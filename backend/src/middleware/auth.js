const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const { error } = require('../utils/response');

const prisma = new PrismaClient();

/**
 * JWT doğrulama middleware'i
 * Authorization: Bearer <token>
 * req.user'a AdminUser bilgisini ekler
 *
 * Güvenlik: algorithms: ['HS256'] ile alg:none saldırısı engellenir.
 */
async function auth(req, res, next) {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return error(res, 'AUTH_REQUIRED', 'Kimlik doğrulama gerekli', 401);
    }

    const token = authHeader.split(' ')[1];
    let decoded;

    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET, {
        algorithms: ['HS256'], // alg:none saldırısına karşı koruma
      });
    } catch (err) {
      return error(res, 'AUTH_REQUIRED', 'Geçersiz veya süresi dolmuş token', 401);
    }

    // Token tipi kontrolü (tempToken olmamalı)
    if (decoded.type === 'temp' || decoded.purpose === 'temp_2fa') {
      return error(res, 'AUTH_REQUIRED', 'Bu işlem için geçerli bir oturum token\'ı gerekli', 401);
    }

    // Refresh token olmamalı
    if (decoded.type === 'refresh') {
      return error(res, 'AUTH_REQUIRED', 'Refresh token geçerli değil', 401);
    }

    const user = await prisma.adminUser.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        totpEnabled: true,
        lockedUntil: true,
      },
    });

    if (!user || !user.isActive) {
      return error(res, 'AUTH_REQUIRED', 'Kullanıcı bulunamadı veya hesap devre dışı', 401);
    }

    // Hesap kilidi kontrolü
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      return error(res, 'ACCOUNT_LOCKED', 'Hesabınız geçici olarak kilitlenmiştir', 401);
    }

    req.user = user;
    next();
  } catch (err) {
    console.error('[Auth Middleware] Hata:', err.message);
    return error(res, 'AUTH_REQUIRED', 'Kimlik doğrulama hatası', 401);
  }
}

module.exports = { auth };
