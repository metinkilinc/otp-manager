const rateLimit = require('express-rate-limit');
const { error } = require('../utils/response');

// Proxy arkasında gerçek IP'yi al (app.set('trust proxy', 1) ile birlikte çalışır)
function getClientIp(req) {
  return (
    req.headers['x-forwarded-for']?.split(',')[0].trim() ||
    req.socket?.remoteAddress ||
    req.ip
  );
}

const rateLimitHandler = (req, res, options) => {
  const retryAfter = Math.ceil(options.windowMs / 1000);
  res.set('Retry-After', retryAfter.toString());
  return error(res, 'RATE_LIMITED', 'Çok fazla istek gönderdiniz. Lütfen bekleyin.', 429);
};

// /api/v1/totp/validate ve /recovery: IP başına 5 istek/dakika
const strictLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 dakika
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  keyGenerator: getClientIp,
});

// /api/auth/login: IP başına 10 istek/dakika
const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  keyGenerator: getClientIp,
});

// Genel: IP başına 100 istek/dakika
const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  keyGenerator: getClientIp,
});

// /api/v1/totp/enroll: IP başına 10 istek/saat
const enrollLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 saat
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  keyGenerator: getClientIp,
});

// /api/v1/totp/reset: IP başına 5 istek/saat
const resetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 saat
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  keyGenerator: getClientIp,
});

module.exports = { strictLimiter, authLimiter, generalLimiter, enrollLimiter, resetLimiter };
