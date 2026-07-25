const express = require('express');
const router = express.Router();
const { z } = require('zod');
const { PrismaClient } = require('@prisma/client');

const { success, error } = require('../utils/response');
const { auth } = require('../middleware/auth');
const { createEnrollment } = require('../services/totp.service');
const { generateRecoveryCodes } = require('../services/recovery.service');
const audit = require('../services/audit.service');

const prisma = new PrismaClient();

router.use(auth);

/**
 * Kullanıcının belirli bir uygulamaya erişimi var mı?
 * SUPER_ADMIN her şeye erişebilir.
 */
async function checkAppAccess(user, applicationId) {
  if (user.role === 'SUPER_ADMIN') return true;

  const app = await prisma.application.findUnique({
    where: { id: applicationId },
    select: { createdById: true },
  });

  if (app && app.createdById === user.id) return true;

  const access = await prisma.appAccess.findUnique({
    where: { adminUserId_applicationId: { adminUserId: user.id, applicationId } },
  });
  return !!access;
}

// GET /api/enrollments?appId=xxx&search=xxx&status=active|inactive|all&page=1&limit=20
router.get('/', async (req, res) => {
  try {
    const { appId, search, status = 'all', page = '1', limit = '20' } = req.query;

    if (!appId) {
      return error(res, 'VALIDATION_ERROR', 'appId parametresi zorunludur', 400);
    }

    const hasAccess = await checkAppAccess(req.user, appId);
    if (!hasAccess) {
      return error(res, 'FORBIDDEN', 'Bu uygulamaya erişim yetkiniz yok', 403);
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const where = { applicationId: appId };

    if (search) {
      where.OR = [
        { externalUserId: { contains: search, mode: 'insensitive' } },
        { externalEmail: { contains: search, mode: 'insensitive' } },
        { externalName: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status === 'active') where.isActive = true;
    else if (status === 'inactive') where.isActive = false;

    const [enrollments, total] = await Promise.all([
      prisma.enrollment.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, externalUserId: true, externalEmail: true, externalName: true,
          isActive: true, isVerified: true, failedAttempts: true,
          lockedUntil: true, lastUsedAt: true, createdAt: true,
        },
      }),
      prisma.enrollment.count({ where }),
    ]);

    return success(res, {
      enrollments,
      pagination: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) },
    });
  } catch (err) {
    console.error('[GET /enrollments]', err);
    return error(res, 'SERVER_ERROR', 'Sunucu hatası', 500);
  }
});

// GET /api/enrollments/stats?appId=xxx
router.get('/stats', async (req, res) => {
  try {
    const { appId } = req.query;

    if (!appId) {
      return error(res, 'VALIDATION_ERROR', 'appId parametresi zorunludur', 400);
    }

    const hasAccess = await checkAppAccess(req.user, appId);
    if (!hasAccess) {
      return error(res, 'FORBIDDEN', 'Bu uygulamaya erişim yetkiniz yok', 403);
    }

    const [totalUsers, activeUsers, pendingUsers] = await Promise.all([
      prisma.enrollment.count({ where: { applicationId: appId } }),
      prisma.enrollment.count({ where: { applicationId: appId, isActive: true, isVerified: true } }),
      prisma.enrollment.count({ where: { applicationId: appId, isVerified: false } }),
    ]);

    const inactiveUsers = totalUsers - activeUsers - pendingUsers;

    // Bugünkü doğrulama istatistikleri
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [todaySuccessLogs, todayFailLogs] = await Promise.all([
      prisma.auditLog.count({
        where: { applicationId: appId, action: 'TOTP_VERIFY_SUCCESS', createdAt: { gte: today, lt: tomorrow } },
      }),
      prisma.auditLog.count({
        where: { applicationId: appId, action: 'TOTP_VERIFY_FAIL', createdAt: { gte: today, lt: tomorrow } },
      }),
    ]);

    // Son 7 günlük istatistikler
    const weeklyVerifications = [];
    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date();
      dayStart.setDate(dayStart.getDate() - i);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const [daySuccess, dayFail] = await Promise.all([
        prisma.auditLog.count({
          where: { applicationId: appId, action: 'TOTP_VERIFY_SUCCESS', createdAt: { gte: dayStart, lt: dayEnd } },
        }),
        prisma.auditLog.count({
          where: { applicationId: appId, action: 'TOTP_VERIFY_FAIL', createdAt: { gte: dayStart, lt: dayEnd } },
        }),
      ]);

      weeklyVerifications.push({
        date: dayStart.toISOString().split('T')[0],
        success: daySuccess,
        fail: dayFail,
      });
    }

    return success(res, {
      totalUsers,
      activeUsers,
      pendingUsers: Math.max(0, pendingUsers),
      inactiveUsers: Math.max(0, inactiveUsers),
      todayVerifications: todaySuccessLogs,
      todayFailures: todayFailLogs,
      weeklyVerifications,
    });
  } catch (err) {
    console.error('[GET /enrollments/stats]', err);
    return error(res, 'SERVER_ERROR', 'Sunucu hatası', 500);
  }
});

// PUT /api/enrollments/:id/toggle
router.put('/:id/toggle', async (req, res) => {
  try {
    const schema = z.object({ isActive: z.boolean() });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return error(res, 'VALIDATION_ERROR', 'isActive boolean değeri zorunludur', 400);
    }

    const enrollment = await prisma.enrollment.findUnique({ where: { id: req.params.id } });
    if (!enrollment) {
      return error(res, 'NOT_FOUND', 'Kayıt bulunamadı', 404);
    }

    const hasAccess = await checkAppAccess(req.user, enrollment.applicationId);
    if (!hasAccess) {
      return error(res, 'FORBIDDEN', 'Bu işlem için yetkiniz yok', 403);
    }

    const updated = await prisma.enrollment.update({
      where: { id: req.params.id },
      data: { isActive: parsed.data.isActive },
    });

    await audit.log({
      action: parsed.data.isActive ? 'TOTP_ENABLE' : 'TOTP_DISABLE',
      applicationId: enrollment.applicationId,
      adminUserId: req.user.id,
      externalUserId: enrollment.externalUserId,
      ipAddress: audit.getIp(req),
    });

    return success(res, {
      id: updated.id,
      isActive: updated.isActive,
      message: parsed.data.isActive ? '2FA aktifleştirildi' : '2FA devre dışı bırakıldı',
    });
  } catch (err) {
    console.error('[PUT /enrollments/:id/toggle]', err);
    return error(res, 'SERVER_ERROR', 'Sunucu hatası', 500);
  }
});

// PUT /api/enrollments/:id/reset
router.put('/:id/reset', async (req, res) => {
  try {
    const enrollment = await prisma.enrollment.findUnique({
      where: { id: req.params.id },
      include: { application: true },
    });
    if (!enrollment) {
      return error(res, 'NOT_FOUND', 'Kayıt bulunamadı', 404);
    }

    const hasAccess = await checkAppAccess(req.user, enrollment.applicationId);
    if (!hasAccess) {
      return error(res, 'FORBIDDEN', 'Bu işlem için yetkiniz yok', 403);
    }

    const { encryptedSecret, qrCodeDataUrl, otpauthUrl } = await createEnrollment(
      enrollment.application.name,
      enrollment.externalEmail || enrollment.externalUserId
    );
    const { plainCodes, hashedCodes } = await generateRecoveryCodes();

    await prisma.enrollment.update({
      where: { id: req.params.id },
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
      applicationId: enrollment.applicationId,
      adminUserId: req.user.id,
      externalUserId: enrollment.externalUserId,
      ipAddress: audit.getIp(req),
    });

    return success(res, { qrCodeDataUrl, otpauthUrl, recoveryCodes: plainCodes });
  } catch (err) {
    console.error('[PUT /enrollments/:id/reset]', err);
    return error(res, 'SERVER_ERROR', 'Sunucu hatası', 500);
  }
});

// DELETE /api/enrollments/:id
router.delete('/:id', async (req, res) => {
  try {
    const enrollment = await prisma.enrollment.findUnique({ where: { id: req.params.id } });
    if (!enrollment) {
      return error(res, 'NOT_FOUND', 'Kayıt bulunamadı', 404);
    }

    const hasAccess = await checkAppAccess(req.user, enrollment.applicationId);
    if (!hasAccess) {
      return error(res, 'FORBIDDEN', 'Bu işlem için yetkiniz yok', 403);
    }

    await prisma.enrollment.delete({ where: { id: req.params.id } });

    return success(res, { message: 'Kayıt silindi' });
  } catch (err) {
    console.error('[DELETE /enrollments/:id]', err);
    return error(res, 'SERVER_ERROR', 'Sunucu hatası', 500);
  }
});

// POST /api/enrollments/bulk-toggle
router.post('/bulk-toggle', async (req, res) => {
  try {
    const schema = z.object({
      ids: z.array(z.string()).min(1),
      isActive: z.boolean(),
    });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return error(res, 'VALIDATION_ERROR', parsed.error.errors[0].message, 400);
    }

    const { ids, isActive } = parsed.data;

    // Erişim kontrolü için ilk kaydı al
    if (ids.length > 0) {
      const firstEnrollment = await prisma.enrollment.findUnique({ where: { id: ids[0] } });
      if (firstEnrollment) {
        const hasAccess = await checkAppAccess(req.user, firstEnrollment.applicationId);
        if (!hasAccess) {
          return error(res, 'FORBIDDEN', 'Bu işlem için yetkiniz yok', 403);
        }
      }
    }

    const result = await prisma.enrollment.updateMany({
      where: { id: { in: ids } },
      data: { isActive },
    });

    return success(res, {
      updated: result.count,
      message: `${result.count} kullanıcının 2FA'sı ${isActive ? 'aktifleştirildi' : 'devre dışı bırakıldı'}`,
    });
  } catch (err) {
    console.error('[POST /enrollments/bulk-toggle]', err);
    return error(res, 'SERVER_ERROR', 'Sunucu hatası', 500);
  }
});

module.exports = router;
