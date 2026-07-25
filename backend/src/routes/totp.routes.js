const express = require('express');
const router = express.Router();
const { z } = require('zod');
const { PrismaClient } = require('@prisma/client');

const { success, error } = require('../utils/response');
const { apiAuth } = require('../middleware/apiAuth');
const { strictLimiter, enrollLimiter, resetLimiter } = require('../middleware/rateLimiter');
const { createEnrollment, verifyCode } = require('../services/totp.service');
const { generateRecoveryCodes, verifyRecoveryCode } = require('../services/recovery.service');
const audit = require('../services/audit.service');
const webhook = require('../services/webhook.service');

const prisma = new PrismaClient();

const LOCK_DURATION_MINUTES = 15;
const MAX_FAILED_ATTEMPTS = 5;

// Tüm route'larda apiAuth middleware'i kullan
router.use(apiAuth);

// POST /api/v1/totp/enroll
router.post('/enroll', enrollLimiter, async (req, res) => {
  try {
    const schema = z.object({
      userId: z.string().min(1, 'userId zorunludur').max(255),
      email: z.string().email().max(255).optional(),
      name: z.string().max(100).optional(),
    });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return error(res, 'VALIDATION_ERROR', parsed.error.errors[0].message, 400);
    }

    const { userId, email, name } = parsed.data;
    const app = req.application;

    // Zaten kayıtlı mı?
    const existing = await prisma.enrollment.findUnique({
      where: { applicationId_externalUserId: { applicationId: app.id, externalUserId: userId } },
    });

    if (existing) {
      return error(res, 'ALREADY_ENROLLED', 'Bu kullanıcı zaten 2FA kaydına sahip', 409);
    }

    // TOTP secret + QR üret
    const { encryptedSecret, qrCodeDataUrl, otpauthUrl } = await createEnrollment(
      app.name,
      email || userId
    );

    // Recovery kodları üret
    const { plainCodes, hashedCodes } = await generateRecoveryCodes();

    // DB'ye kaydet
    const enrollment = await prisma.enrollment.create({
      data: {
        applicationId: app.id,
        externalUserId: userId,
        externalEmail: email || null,
        externalName: name || null,
        totpSecret: encryptedSecret,
        isActive: false,
        isVerified: false,
        recoveryCodes: hashedCodes,
      },
    });

    await audit.log({
      action: 'ENROLL_START',
      applicationId: app.id,
      externalUserId: userId,
      ipAddress: audit.getIp(req),
      userAgent: req.headers['user-agent'],
    });

    // Webhook: enrollment.created
    webhook.trigger(app, 'enrollment.created', {
      userId,
      email: email || null,
      name: name || null,
      enrollmentId: enrollment.id,
    });

    return success(res, {
      enrollmentId: enrollment.id,
      qrCodeDataUrl,
      otpauthUrl,
      recoveryCodes: plainCodes,
      message: 'QR kodu kullanıcıya gösterin. Kurtarma kodlarını kaydetmesini söyleyin. Ardından /verify ile doğrulama yapın.',
    }, 201);
  } catch (err) {
    console.error('[POST /enroll]', err);
    return error(res, 'SERVER_ERROR', 'Sunucu hatası', 500);
  }
});

// POST /api/v1/totp/verify (ilk kurulum doğrulama)
router.post('/verify', async (req, res) => {
  try {
    const schema = z.object({
      userId: z.string().min(1).max(255),
      code: z.string().length(6, 'Kod 6 haneli olmalıdır'),
    });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return error(res, 'VALIDATION_ERROR', parsed.error.errors[0].message, 400);
    }

    const { userId, code } = parsed.data;
    const app = req.application;

    const enrollment = await prisma.enrollment.findUnique({
      where: { applicationId_externalUserId: { applicationId: app.id, externalUserId: userId } },
    });

    if (!enrollment) {
      return error(res, 'ENROLLMENT_NOT_FOUND', '2FA kaydı bulunamadı', 404);
    }

    const valid = verifyCode(enrollment.totpSecret, code);
    if (!valid) {
      return error(res, 'INVALID_TOTP_CODE', 'Kod geçersiz. Tekrar deneyin.', 400);
    }

    await prisma.enrollment.update({
      where: { id: enrollment.id },
      data: { isVerified: true, isActive: true },
    });

    await audit.log({
      action: 'ENROLL_VERIFY',
      applicationId: app.id,
      externalUserId: userId,
      ipAddress: audit.getIp(req),
    });

    return success(res, { verified: true, message: '2FA başarıyla aktifleştirildi' });
  } catch (err) {
    console.error('[POST /verify]', err);
    return error(res, 'SERVER_ERROR', 'Sunucu hatası', 500);
  }
});

// POST /api/v1/totp/validate (her login'de çağrılır)
router.post('/validate', strictLimiter, async (req, res) => {
  try {
    const schema = z.object({
      userId: z.string().min(1).max(255),
      code: z.string().length(6, 'Kod 6 haneli olmalıdır'),
    });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return error(res, 'VALIDATION_ERROR', parsed.error.errors[0].message, 400);
    }

    const { userId, code } = parsed.data;
    const app = req.application;

    const enrollment = await prisma.enrollment.findUnique({
      where: { applicationId_externalUserId: { applicationId: app.id, externalUserId: userId } },
    });

    if (!enrollment) {
      return error(res, 'ENROLLMENT_NOT_FOUND', '2FA kaydı bulunamadı', 404);
    }

    if (!enrollment.isActive || !enrollment.isVerified) {
      return error(res, 'ENROLLMENT_NOT_FOUND', '2FA henüz aktifleştirilmemiş', 404);
    }

    // Kilitleme kontrolü
    if (enrollment.lockedUntil && enrollment.lockedUntil > new Date()) {
      return error(res, 'ACCOUNT_LOCKED', `Çok fazla hatalı deneme. ${LOCK_DURATION_MINUTES} dakika sonra tekrar deneyin.`, 423, {
        lockedUntil: enrollment.lockedUntil.toISOString(),
      });
    }

    // Kilitlenme süresi geçmişse sıfırla
    if (enrollment.lockedUntil && enrollment.lockedUntil <= new Date()) {
      await prisma.enrollment.update({
        where: { id: enrollment.id },
        data: { failedAttempts: 0, lockedUntil: null },
      });
      enrollment.failedAttempts = 0;
      enrollment.lockedUntil = null;
    }

    const valid = verifyCode(enrollment.totpSecret, code);

    if (valid) {
      await prisma.enrollment.update({
        where: { id: enrollment.id },
        data: { failedAttempts: 0, lockedUntil: null, lastUsedAt: new Date() },
      });

      await audit.log({
        action: 'TOTP_VERIFY_SUCCESS',
        applicationId: app.id,
        externalUserId: userId,
        ipAddress: audit.getIp(req),
      });

      return success(res, { valid: true, remainingAttempts: null });
    } else {
      const newFailedAttempts = enrollment.failedAttempts + 1;
      const shouldLock = newFailedAttempts >= MAX_FAILED_ATTEMPTS;
      const lockedUntil = shouldLock
        ? new Date(Date.now() + LOCK_DURATION_MINUTES * 60 * 1000)
        : null;

      await prisma.enrollment.update({
        where: { id: enrollment.id },
        data: { failedAttempts: newFailedAttempts, lockedUntil },
      });

      await audit.log({
        action: 'TOTP_VERIFY_FAIL',
        applicationId: app.id,
        externalUserId: userId,
        ipAddress: audit.getIp(req),
        metadata: { failedAttempts: newFailedAttempts },
      });

      if (shouldLock) {
        await audit.log({
          action: 'ACCOUNT_LOCKED',
          applicationId: app.id,
          externalUserId: userId,
          ipAddress: audit.getIp(req),
        });

        // Webhook: auth.locked
        webhook.trigger(app, 'auth.locked', {
          userId,
          failedAttempts: newFailedAttempts,
          lockedUntil: lockedUntil.toISOString(),
          ipAddress: audit.getIp(req),
        });

        return error(res, 'ACCOUNT_LOCKED', `${MAX_FAILED_ATTEMPTS} hatalı denemeden sonra hesap kilitlendi. ${LOCK_DURATION_MINUTES} dakika sonra tekrar deneyin.`, 423, {
          lockedUntil: lockedUntil.toISOString(),
        });
      }

      return error(res, 'INVALID_TOTP_CODE', 'Kod geçersiz', 400, {
        remainingAttempts: MAX_FAILED_ATTEMPTS - newFailedAttempts,
      });
    }
  } catch (err) {
    console.error('[POST /validate]', err);
    return error(res, 'SERVER_ERROR', 'Sunucu hatası', 500);
  }
});

// GET /api/v1/totp/status/:userId
router.get('/status/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const app = req.application;

    const enrollment = await prisma.enrollment.findUnique({
      where: { applicationId_externalUserId: { applicationId: app.id, externalUserId: userId } },
    });

    if (!enrollment) {
      return success(res, {
        enrolled: false,
        enabled: false,
        verified: false,
        lastUsedAt: null,
      });
    }

    return success(res, {
      enrolled: true,
      enabled: enrollment.isActive,
      verified: enrollment.isVerified,
      lastUsedAt: enrollment.lastUsedAt?.toISOString() || null,
    });
  } catch (err) {
    console.error('[GET /status]', err);
    return error(res, 'SERVER_ERROR', 'Sunucu hatası', 500);
  }
});

// POST /api/v1/totp/disable
router.post('/disable', async (req, res) => {
  try {
    const schema = z.object({ userId: z.string().min(1).max(255) });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return error(res, 'VALIDATION_ERROR', 'userId zorunludur', 400);
    }

    const { userId } = parsed.data;
    const app = req.application;

    const enrollment = await prisma.enrollment.findUnique({
      where: { applicationId_externalUserId: { applicationId: app.id, externalUserId: userId } },
    });

    if (!enrollment) {
      return error(res, 'ENROLLMENT_NOT_FOUND', '2FA kaydı bulunamadı', 404);
    }

    await prisma.enrollment.update({
      where: { id: enrollment.id },
      data: { isActive: false },
    });

    await audit.log({
      action: 'TOTP_DISABLE',
      applicationId: app.id,
      externalUserId: userId,
      ipAddress: audit.getIp(req),
    });

    // Webhook: enrollment.disabled
    webhook.trigger(app, 'enrollment.disabled', { userId });

    return success(res, { message: '2FA devre dışı bırakıldı' });
  } catch (err) {
    console.error('[POST /disable]', err);
    return error(res, 'SERVER_ERROR', 'Sunucu hatası', 500);
  }
});

// POST /api/v1/totp/reset
router.post('/reset', resetLimiter, async (req, res) => {
  try {
    const schema = z.object({ userId: z.string().min(1).max(255) });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return error(res, 'VALIDATION_ERROR', 'userId zorunludur', 400);
    }

    const { userId } = parsed.data;
    const app = req.application;

    const enrollment = await prisma.enrollment.findUnique({
      where: { applicationId_externalUserId: { applicationId: app.id, externalUserId: userId } },
    });

    if (!enrollment) {
      return error(res, 'ENROLLMENT_NOT_FOUND', '2FA kaydı bulunamadı', 404);
    }

    const { encryptedSecret, qrCodeDataUrl, otpauthUrl } = await createEnrollment(
      app.name,
      enrollment.externalEmail || userId
    );
    const { plainCodes, hashedCodes } = await generateRecoveryCodes();

    await prisma.enrollment.update({
      where: { id: enrollment.id },
      data: {
        totpSecret: encryptedSecret,
        recoveryCodes: hashedCodes,
        isVerified: false,
        isActive: false,
        failedAttempts: 0,
        lockedUntil: null,
      },
    });

    await audit.log({
      action: 'TOTP_RESET',
      applicationId: app.id,
      externalUserId: userId,
      ipAddress: audit.getIp(req),
    });

    return success(res, {
      qrCodeDataUrl,
      otpauthUrl,
      recoveryCodes: plainCodes,
      message: '2FA sıfırlandı. Yeni QR kodu kullanıcıya gösterin.',
    });
  } catch (err) {
    console.error('[POST /reset]', err);
    return error(res, 'SERVER_ERROR', 'Sunucu hatası', 500);
  }
});

// POST /api/v1/totp/recovery
router.post('/recovery', strictLimiter, async (req, res) => {
  try {
    const schema = z.object({
      userId: z.string().min(1).max(255),
      recoveryCode: z.string().min(1, 'Kurtarma kodu zorunludur').max(20),
    });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return error(res, 'VALIDATION_ERROR', parsed.error.errors[0].message, 400);
    }

    const { userId, recoveryCode } = parsed.data;
    const app = req.application;

    const enrollment = await prisma.enrollment.findUnique({
      where: { applicationId_externalUserId: { applicationId: app.id, externalUserId: userId } },
    });

    if (!enrollment) {
      return error(res, 'ENROLLMENT_NOT_FOUND', '2FA kaydı bulunamadı', 404);
    }

    const { valid, matchIndex } = await verifyRecoveryCode(recoveryCode, enrollment.recoveryCodes);

    if (!valid) {
      return error(res, 'INVALID_TOTP_CODE', 'Kurtarma kodu geçersiz', 400);
    }

    // Kullanılan kodu sil
    const updatedCodes = enrollment.recoveryCodes.filter((_, i) => i !== matchIndex);

    await prisma.enrollment.update({
      where: { id: enrollment.id },
      data: {
        recoveryCodes: updatedCodes,
        failedAttempts: 0,
        lockedUntil: null,
      },
    });

    await audit.log({
      action: 'RECOVERY_USED',
      applicationId: app.id,
      externalUserId: userId,
      ipAddress: audit.getIp(req),
      metadata: { remainingCodes: updatedCodes.length },
    });

    // Webhook: recovery.used
    webhook.trigger(app, 'recovery.used', {
      userId,
      remainingCodes: updatedCodes.length,
      ipAddress: audit.getIp(req),
    });

    return success(res, {
      valid: true,
      remainingRecoveryCodes: updatedCodes.length,
      message: `Kurtarma kodu kullanıldı. Kalan kod sayısı: ${updatedCodes.length}`,
    });
  } catch (err) {
    console.error('[POST /recovery]', err);
    return error(res, 'SERVER_ERROR', 'Sunucu hatası', 500);
  }
});

module.exports = router;
