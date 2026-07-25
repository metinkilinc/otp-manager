const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { z } = require('zod');
const { PrismaClient } = require('@prisma/client');

const { success, error } = require('../utils/response');
const { auth } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const { createEnrollment, verifyCode } = require('../services/totp.service');
const { generateRecoveryCodes } = require('../services/recovery.service');
const audit = require('../services/audit.service');

const prisma = new PrismaClient();

const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_LOCK_MINUTES = 15;

// ─── Şifre Validasyon Şeması ───
// En az 8 karakter, 1 büyük harf, 1 rakam
const passwordSchema = z
  .string()
  .min(8, 'Şifre en az 8 karakter olmalıdır')
  .regex(/[A-Z]/, 'Şifre en az 1 büyük harf içermelidir')
  .regex(/[0-9]/, 'Şifre en az 1 rakam içermelidir');

/**
 * Access + Refresh token üret ve refresh token'ı DB'ye kaydet
 */
async function generateTokens(userId) {
  const accessToken = jwt.sign(
    { userId, type: 'access' },
    process.env.JWT_SECRET,
    { algorithm: 'HS256', expiresIn: process.env.JWT_EXPIRES_IN || '4h' }
  );

  // Refresh token — kriptografik rastgele veri + imza
  const rawRefreshToken = crypto.randomBytes(48).toString('hex');
  const refreshToken = jwt.sign(
    { userId, type: 'refresh', jti: rawRefreshToken },
    process.env.JWT_REFRESH_SECRET,
    { algorithm: 'HS256', expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );

  // Refresh token'ın hash'ini DB'ye kaydet (plain text değil)
  const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 gün

  await prisma.refreshToken.create({
    data: { tokenHash, adminUserId: userId, expiresAt },
  });

  return { token: accessToken, refreshToken };
}

/**
 * Geçici setup/login token üret (5 dakika, kısıtlı purpose)
 */
function generateTempToken(userId, purpose) {
  return jwt.sign(
    { userId, purpose },
    process.env.JWT_TEMP_SECRET || process.env.JWT_SECRET + '_temp',
    { algorithm: 'HS256', expiresIn: '5m' }
  );
}

/**
 * Geçici token doğrula ve purpose kontrolü yap
 */
function verifyTempToken(token, expectedPurpose) {
  const decoded = jwt.verify(
    token,
    process.env.JWT_TEMP_SECRET || process.env.JWT_SECRET + '_temp',
    { algorithms: ['HS256'] }
  );
  if (decoded.purpose !== expectedPurpose) {
    throw new Error('Geçersiz token amacı');
  }
  return decoded;
}

/**
 * Login başarısız — kilitleme sayacını artır
 */
async function handleFailedLogin(userId) {
  const user = await prisma.adminUser.findUnique({
    where: { id: userId },
    select: { loginAttempts: true, lockedUntil: true },
  });

  const newAttempts = (user?.loginAttempts || 0) + 1;
  const shouldLock  = newAttempts >= MAX_LOGIN_ATTEMPTS;
  const lockedUntil = shouldLock
    ? new Date(Date.now() + LOGIN_LOCK_MINUTES * 60 * 1000)
    : undefined;

  await prisma.adminUser.update({
    where: { id: userId },
    data: {
      loginAttempts: newAttempts,
      ...(lockedUntil ? { lockedUntil } : {}),
    },
  });

  return { locked: shouldLock, lockedUntil };
}

// POST /api/auth/login
router.post('/login', authLimiter, async (req, res) => {
  try {
    const schema = z.object({
      email: z.string().email('Geçerli bir email adresi girin'),
      password: z.string().min(1, 'Şifre zorunludur'),
    });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      // Jenerik mesaj — email enumeration önlemi
      return error(res, 'INVALID_CREDENTIALS', 'Email veya şifre hatalı', 401);
    }

    const { email, password } = parsed.data;

    const user = await prisma.adminUser.findUnique({ where: { email } });

    // Email bulunamasa bile aynı hata mesajı (email enumeration önlemi)
    if (!user || !user.isActive) {
      // Sabit zaman harcamak için sahte bcrypt karşılaştırması
      await bcrypt.compare(password, '$2a$12$invalidhashplaceholderXXXXXXXXXXXXX');
      return error(res, 'INVALID_CREDENTIALS', 'Email veya şifre hatalı', 401);
    }

    // Hesap kilidi kontrolü
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const remainingMs = user.lockedUntil - new Date();
      const remainingMin = Math.ceil(remainingMs / 60000);
      res.set('Retry-After', (remainingMs / 1000).toFixed(0));
      return error(res, 'ACCOUNT_LOCKED', `Hesabınız kilitlendi. ${remainingMin} dakika sonra tekrar deneyin.`, 423, {
        lockedUntil: user.lockedUntil.toISOString(),
      });
    }

    // Kilitleme süresi geçmişse sıfırla
    if (user.lockedUntil && user.lockedUntil <= new Date()) {
      await prisma.adminUser.update({
        where: { id: user.id },
        data: { loginAttempts: 0, lockedUntil: null },
      });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      await handleFailedLogin(user.id);
      return error(res, 'INVALID_CREDENTIALS', 'Email veya şifre hatalı', 401);
    }

    // Başarılı giriş — sayacı sıfırla
    await prisma.adminUser.update({
      where: { id: user.id },
      data: { loginAttempts: 0, lockedUntil: null },
    });

    await audit.log({
      action: 'ADMIN_LOGIN',
      adminUserId: user.id,
      ipAddress: audit.getIp(req),
      userAgent: req.headers['user-agent'],
    });

    // DURUM 1 — 2FA kurulu, kod bekleniyor
    if (user.totpEnabled && user.totpSecret) {
      const loginToken = generateTempToken(user.id, 'verify_2fa');
      return success(res, { step: 'VERIFY_2FA', loginToken });
    }

    // DURUM 2 — 2FA kurulmamış, ilk giriş: QR kurulum zorunlu
    const { encryptedSecret, qrCodeDataUrl } = await createEnrollment(
      'OTP Manager Panel',
      user.email
    );
    const { plainCodes, hashedCodes } = await generateRecoveryCodes();

    // Şifrelenmiş secret'ı ve hash'li recovery kodlarını geçici olarak
    // setupToken payload'una değil, DB'ye yazıyoruz — token 5 dk ömürlü
    await prisma.adminUser.update({
      where: { id: user.id },
      data: {
        totpSecret: encryptedSecret,    // henüz aktif değil (totpEnabled=false)
        recoveryCodes: hashedCodes,     // setup tamamlanınca aktifleşecek
      },
    });

    const setupToken = generateTempToken(user.id, 'setup_2fa');
    return success(res, {
      step: 'SETUP_2FA',
      setupToken,
      qrCodeDataUrl,
      recoveryCodes: plainCodes,
    });
  } catch (err) {
    console.error('[POST /login]', err.message);
    return error(res, 'SERVER_ERROR', 'Sunucu hatası', 500);
  }
});

// POST /api/auth/setup-2fa — İlk kurulum doğrulama (login sırasında SETUP_2FA adımı)
router.post('/setup-2fa', authLimiter, async (req, res) => {
  try {
    const schema = z.object({
      setupToken: z.string(),
      code: z.string().length(6, 'Kod 6 haneli olmalıdır'),
    });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return error(res, 'VALIDATION_ERROR', 'Geçersiz istek', 400);
    }

    const { setupToken, code } = parsed.data;

    let decoded;
    try {
      decoded = verifyTempToken(setupToken, 'setup_2fa');
    } catch {
      return error(res, 'AUTH_REQUIRED', 'Geçersiz veya süresi dolmuş kurulum token\'ı. Lütfen tekrar giriş yapın.', 401);
    }

    const user = await prisma.adminUser.findUnique({ where: { id: decoded.userId } });
    if (!user || !user.isActive || !user.totpSecret) {
      return error(res, 'AUTH_REQUIRED', 'Kullanıcı bulunamadı', 401);
    }

    // Kodu doğrula
    const valid = verifyCode(user.totpSecret, code);
    if (!valid) {
      return error(res, 'INVALID_TOTP_CODE', 'Doğrulama kodu geçersiz. Google Authenticator\'daki güncel kodu girin.', 400);
    }

    // 2FA'yı aktifleştir — recoveryCodes login sırasında zaten yazılmıştı
    await prisma.adminUser.update({
      where: { id: user.id },
      data: { totpEnabled: true },
    });

    await audit.log({
      action: 'TOTP_ENABLE',
      adminUserId: user.id,
      ipAddress: audit.getIp(req),
      metadata: { target: 'PANEL_USER', source: 'login_setup' },
    });

    // Kurulum tamamlandı — asıl oturum token'larını üret
    const { token, refreshToken } = await generateTokens(user.id);
    return success(res, {
      token,
      refreshToken,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    });
  } catch (err) {
    console.error('[POST /setup-2fa]', err.message);
    return error(res, 'SERVER_ERROR', 'Sunucu hatası', 500);
  }
});

// POST /api/auth/verify-2fa — Her login'de 2FA kodu doğrulama
router.post('/verify-2fa', authLimiter, async (req, res) => {
  try {
    const schema = z.object({
      loginToken: z.string().optional(),
      tempToken: z.string().optional(),  // Geriye dönük uyumluluk
      code: z.string().length(6, 'Kod 6 haneli olmalıdır').optional(),
      recoveryCode: z.string().min(6).max(20).optional(),
    }).refine(d => d.loginToken || d.tempToken, { message: 'loginToken zorunludur' })
      .refine(d => d.code || d.recoveryCode, { message: 'code veya recoveryCode zorunludur' });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return error(res, 'VALIDATION_ERROR', parsed.error.errors[0].message, 400);
    }

    const { loginToken, tempToken, code, recoveryCode } = parsed.data;
    const tokenStr = loginToken || tempToken;

    let decoded;
    try {
      // Yeni format: purpose='verify_2fa' | Eski format: purpose='temp_2fa'
      decoded = jwt.verify(
        tokenStr,
        process.env.JWT_TEMP_SECRET || process.env.JWT_SECRET + '_temp',
        { algorithms: ['HS256'] }
      );
    } catch {
      return error(res, 'AUTH_REQUIRED', 'Geçersiz veya süresi dolmuş token. Lütfen tekrar giriş yapın.', 401);
    }

    if (!['verify_2fa', 'temp_2fa'].includes(decoded.purpose)) {
      return error(res, 'AUTH_REQUIRED', 'Geçersiz token amacı', 401);
    }

    const user = await prisma.adminUser.findUnique({ where: { id: decoded.userId } });
    if (!user || !user.isActive || !user.totpSecret) {
      return error(res, 'AUTH_REQUIRED', 'Kullanıcı bulunamadı', 401);
    }

    // Kurtarma kodu ile giriş
    if (recoveryCode) {
      const { verifyRecoveryCode } = require('../services/recovery.service');
      const normalizedCode = recoveryCode.toUpperCase().trim();
      const { valid, matchIndex } = await verifyRecoveryCode(normalizedCode, user.recoveryCodes);

      if (!valid) {
        return error(res, 'INVALID_TOTP_CODE', 'Kurtarma kodu geçersiz veya daha önce kullanılmış', 400);
      }

      const updatedCodes = user.recoveryCodes.filter((_, i) => i !== matchIndex);
      await prisma.adminUser.update({
        where: { id: user.id },
        data: { recoveryCodes: updatedCodes },
      });

      await audit.log({
        action: 'RECOVERY_USED',
        adminUserId: user.id,
        ipAddress: audit.getIp(req),
        metadata: { remainingCodes: updatedCodes.length },
      });

      const { token, refreshToken } = await generateTokens(user.id);
      return success(res, {
        token,
        refreshToken,
        user: { id: user.id, email: user.email, name: user.name, role: user.role },
      });
    }

    // TOTP kodu doğrula
    const valid = verifyCode(user.totpSecret, code);
    if (!valid) {
      return error(res, 'INVALID_TOTP_CODE', 'Doğrulama kodu geçersiz. Uygulamadaki güncel kodu girin.', 400);
    }

    const { token, refreshToken } = await generateTokens(user.id);
    return success(res, {
      token,
      refreshToken,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    });
  } catch (err) {
    console.error('[POST /verify-2fa]', err.message);
    return error(res, 'SERVER_ERROR', 'Sunucu hatası', 500);
  }
});

// POST /api/auth/refresh — Refresh token ile yeni access token al
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return error(res, 'AUTH_REQUIRED', 'Refresh token gerekli', 401);
    }

    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, {
        algorithms: ['HS256'],
      });
    } catch {
      return error(res, 'AUTH_REQUIRED', 'Geçersiz veya süresi dolmuş refresh token', 401);
    }

    if (decoded.type !== 'refresh') {
      return error(res, 'AUTH_REQUIRED', 'Geçersiz token tipi', 401);
    }

    // DB'de bu refresh token'ın hash'ini kontrol et (revocation)
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const storedToken = await prisma.refreshToken.findUnique({ where: { tokenHash } });

    if (!storedToken || storedToken.revokedAt || storedToken.expiresAt < new Date()) {
      return error(res, 'AUTH_REQUIRED', 'Refresh token geçersiz veya iptal edilmiş', 401);
    }

    const user = await prisma.adminUser.findUnique({ where: { id: decoded.userId } });
    if (!user || !user.isActive) {
      return error(res, 'AUTH_REQUIRED', 'Kullanıcı bulunamadı', 401);
    }

    // Eski token'ı iptal et, yeni token üret (rotation)
    await prisma.refreshToken.update({
      where: { tokenHash },
      data: { revokedAt: new Date() },
    });

    const tokens = await generateTokens(user.id);
    return success(res, tokens);
  } catch (err) {
    console.error('[POST /refresh]', err.message);
    return error(res, 'SERVER_ERROR', 'Sunucu hatası', 500);
  }
});

// POST /api/auth/logout — Refresh token'ı iptal et
router.post('/logout', auth, async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
      await prisma.refreshToken.updateMany({
        where: { tokenHash, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }

    // Kullanıcıya ait tüm aktif refresh token'ları iptal et (güvenli çıkış)
    await prisma.refreshToken.updateMany({
      where: { adminUserId: req.user.id, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    return success(res, { message: 'Oturum başarıyla kapatıldı' });
  } catch (err) {
    console.error('[POST /logout]', err.message);
    return error(res, 'SERVER_ERROR', 'Sunucu hatası', 500);
  }
});

// GET /api/auth/me
router.get('/me', auth, async (req, res) => {
  return success(res, { user: req.user });
});

// PUT /api/auth/profile — Profil bilgilerini güncelle (ad, email)
router.put('/profile', auth, async (req, res) => {
  try {
    const schema = z.object({
      name: z.string().min(1, 'Ad zorunludur').max(100).optional(),
      email: z.string().email('Geçerli bir email adresi girin').max(255).optional(),
    });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return error(res, 'VALIDATION_ERROR', parsed.error.errors[0].message, 400);
    }

    const { name, email } = parsed.data;
    if (!name && !email) {
      return error(res, 'VALIDATION_ERROR', 'En az bir alan güncellenmelidir', 400);
    }

    // Email değiştiriliyorsa kullanımda mı kontrol et
    if (email && email !== req.user.email) {
      const existing = await prisma.adminUser.findUnique({ where: { email } });
      if (existing) {
        return error(res, 'CONFLICT', 'Bu email adresi zaten kullanımda', 409);
      }
    }

    const updatedUser = await prisma.adminUser.update({
      where: { id: req.user.id },
      data: {
        ...(name ? { name } : {}),
        ...(email ? { email } : {}),
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        totpEnabled: true,
        isActive: true,
      },
    });

    await audit.log({
      action: 'ADMIN_UPDATED',
      adminUserId: req.user.id,
      ipAddress: audit.getIp(req),
      metadata: { updatedFields: { name, email } },
    });

    return success(res, { user: updatedUser, message: 'Profil bilgileri güncellendi' });
  } catch (err) {
    console.error('[PUT /profile]', err.message);
    return error(res, 'SERVER_ERROR', 'Sunucu hatası', 500);
  }
});

// POST /api/auth/change-password & PUT /api/auth/change-password
const handleChangePassword = async (req, res) => {
  try {
    const schema = z.object({
      currentPassword: z.string().min(1, 'Mevcut şifre zorunludur'),
      newPassword: passwordSchema,
    });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return error(res, 'VALIDATION_ERROR', parsed.error.errors[0].message, 400);
    }

    const { currentPassword, newPassword } = parsed.data;

    const user = await prisma.adminUser.findUnique({ where: { id: req.user.id } });
    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match) {
      return error(res, 'INVALID_CREDENTIALS', 'Mevcut şifre hatalı', 401);
    }

    const hashed = await bcrypt.hash(newPassword, 12);
    await prisma.adminUser.update({
      where: { id: req.user.id },
      data: { password: hashed },
    });

    // Şifre değişince tüm aktif refresh token'ları iptal et
    await prisma.refreshToken.updateMany({
      where: { adminUserId: req.user.id, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    return success(res, { message: 'Şifre başarıyla değiştirildi' });
  } catch (err) {
    console.error('[change-password]', err.message);
    return error(res, 'SERVER_ERROR', 'Sunucu hatası', 500);
  }
};

router.put('/change-password', auth, handleChangePassword);
router.post('/change-password', auth, handleChangePassword);

// ─── PANEL GÜVENLİK 2FA ENDPOINTLERİ (ADMINUSER KENDİ HESABI İÇİN) ───

// POST /api/auth/2fa/setup — QR Kod ve geçici secret üret
router.post('/2fa/setup', auth, async (req, res) => {
  try {
    const { encryptedSecret, qrCodeDataUrl, otpauthUrl } = await createEnrollment(
      'OTP Manager Panel',
      req.user.email
    );

    return success(res, {
      qrCodeDataUrl,
      otpauthUrl,
      tempSecret: encryptedSecret,
    });
  } catch (err) {
    console.error('[POST /2fa/setup]', err.message);
    return error(res, 'SERVER_ERROR', 'QR Kod üretilemedi', 500);
  }
});

// POST /api/auth/2fa/enable — Kodu doğrula ve 2FA'yı aktifleştir
router.post('/2fa/enable', auth, async (req, res) => {
  try {
    const schema = z.object({
      tempSecret: z.string().min(1, 'Gerekli geçici secret eksik'),
      code: z.string().length(6, 'Kod 6 haneli olmalıdır'),
    });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return error(res, 'VALIDATION_ERROR', parsed.error.errors[0].message, 400);
    }

    const { tempSecret, code } = parsed.data;

    // Kod doğrulama
    const isValid = verifyCode(tempSecret, code);
    if (!isValid) {
      return error(res, 'INVALID_TOTP_CODE', 'Girilen 2FA doğrulama kodu geçersiz', 400);
    }

    // Kurtarma kodları üret
    const { plainCodes, hashedCodes } = await generateRecoveryCodes();

    // Kullanıcı kaydını güncelle — recoveryCodes da kaydediliyor (bug fix)
    await prisma.adminUser.update({
      where: { id: req.user.id },
      data: {
        totpSecret: tempSecret,
        totpEnabled: true,
        recoveryCodes: hashedCodes,
      },
    });

    await audit.log({
      action: 'TOTP_ENABLE',
      adminUserId: req.user.id,
      ipAddress: audit.getIp(req),
      metadata: { target: 'PANEL_USER', source: 'settings' },
    });

    return success(res, {
      message: 'İki faktörlü doğrulama (2FA) başarıyla aktifleştirildi',
      recoveryCodes: plainCodes,
    });
  } catch (err) {
    console.error('[POST /2fa/enable]', err.message);
    return error(res, 'SERVER_ERROR', '2FA aktifleştirilemedi', 500);
  }
});

// POST /api/auth/2fa/disable — 2FA'yı kapat
router.post('/2fa/disable', auth, async (req, res) => {
  try {
    const schema = z.object({
      password: z.string().min(1, 'Mevcut şifrenizi girmelisiniz'),
    });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return error(res, 'VALIDATION_ERROR', parsed.error.errors[0].message, 400);
    }

    const user = await prisma.adminUser.findUnique({ where: { id: req.user.id } });
    const match = await bcrypt.compare(parsed.data.password, user.password);
    if (!match) {
      return error(res, 'INVALID_CREDENTIALS', 'Mevcut şifreniz hatalı', 401);
    }

    await prisma.adminUser.update({
      where: { id: req.user.id },
      data: {
        totpSecret: null,
        totpEnabled: false,
      },
    });

    await audit.log({
      action: 'TOTP_DISABLE',
      adminUserId: req.user.id,
      ipAddress: audit.getIp(req),
      metadata: { target: 'PANEL_USER' },
    });

    return success(res, { message: 'İki faktörlü doğrulama (2FA) devre dışı bırakıldı' });
  } catch (err) {
    console.error('[POST /2fa/disable]', err.message);
    return error(res, 'SERVER_ERROR', '2FA devre dışı bırakılamadı', 500);
  }
});

module.exports = router;

