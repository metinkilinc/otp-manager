const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');
const { computeHmac, safeCompare } = require('../utils/hmac');
const { error } = require('../utils/response');
const { ipWhitelist } = require('./ipWhitelist');

const prisma = new PrismaClient();

const TIMESTAMP_TOLERANCE = 300; // ±5 dakika

// ─── Replay Attack Koruması ───
// Kullanılan signature:timestamp çiftlerini 10 dakika hafızada tut
const usedSignatures = new Map();
const REPLAY_WINDOW_MS = 10 * 60 * 1000; // 10 dakika

// Kullanılmış imzaları temizle (her dakika)
setInterval(() => {
  const now = Date.now();
  for (const [key, timestamp] of usedSignatures.entries()) {
    if (now - timestamp > REPLAY_WINDOW_MS) {
      usedSignatures.delete(key);
    }
  }
}, 60 * 1000);

// ─── Uygulama Başına Rate Limiter ───
// Map<applicationId, { count: number, windowStart: number }>
const appRateLimitStore = new Map();

/**
 * Uygulamaya özel rate limit kontrolü.
 * application.rateLimitMaxRequests ve application.rateLimitWindowMs kullanılır.
 * @returns {{ limited: boolean, retryAfterSeconds: number }}
 */
function checkAppRateLimit(application) {
  const maxReq = application.rateLimitMaxRequests ?? 100;
  const windowMs = application.rateLimitWindowMs ?? 60000;
  const now = Date.now();

  let entry = appRateLimitStore.get(application.id);

  if (!entry || now - entry.windowStart >= windowMs) {
    // Yeni pencere başlat
    entry = { count: 1, windowStart: now };
    appRateLimitStore.set(application.id, entry);
    return { limited: false, retryAfterSeconds: 0 };
  }

  entry.count += 1;

  if (entry.count > maxReq) {
    const retryAfterMs = windowMs - (now - entry.windowStart);
    return { limited: true, retryAfterSeconds: Math.ceil(retryAfterMs / 1000) };
  }

  return { limited: false, retryAfterSeconds: 0 };
}

// Rate limit store temizliği (her 5 dakika)
setInterval(() => {
  const now = Date.now();
  for (const [appId, entry] of appRateLimitStore.entries()) {
    // 1 saatlik pencereyi geçmiş girişleri temizle
    if (now - entry.windowStart > 3_600_000) {
      appRateLimitStore.delete(appId);
    }
  }
}, 5 * 60 * 1000);

/**
 * API Key + HMAC-SHA256 doğrulama middleware'i
 * Harici uygulamaların /api/v1/totp/* endpoint'lerine erişimi için
 *
 * Zorunlu header'lar:
 *   X-API-Key: uygulama_api_key
 *   X-Signature: HMAC-SHA256(normalizedBody + timestamp, apiSecret)
 *   X-Timestamp: unix_saniye
 *
 * Güvenlik:
 *  - timingSafeEqual ile HMAC karşılaştırması
 *  - Replay attack koruması (in-memory nonce cache)
 *  - Body normalize (JSON key sıralaması deterministik)
 */
async function apiAuth(req, res, next) {
  try {
    const apiKey    = req.headers['x-api-key'];
    const signature = req.headers['x-signature'];
    const timestamp = req.headers['x-timestamp'];

    // Header kontrolleri
    if (!apiKey) {
      return error(res, 'INVALID_API_KEY', 'X-API-Key header\'ı eksik', 401);
    }
    if (!signature) {
      return error(res, 'INVALID_SIGNATURE', 'X-Signature header\'ı eksik', 401);
    }
    if (!timestamp) {
      return error(res, 'TIMESTAMP_EXPIRED', 'X-Timestamp header\'ı eksik', 401);
    }

    // 1. Timestamp kontrolü (önce yap — DB'ye gitme gerek olmadan erken red)
    const now     = Math.floor(Date.now() / 1000);
    const reqTime = parseInt(timestamp, 10);

    if (isNaN(reqTime) || Math.abs(now - reqTime) > TIMESTAMP_TOLERANCE) {
      res.set('Retry-After', TIMESTAMP_TOLERANCE.toString());
      return error(res, 'TIMESTAMP_EXPIRED', 'İstek zaman damgası geçersiz (±5 dakika tolerans)', 401);
    }

    // 2. Replay attack kontrolü
    const sigKey = `${apiKey}:${signature}:${timestamp}`;
    if (usedSignatures.has(sigKey)) {
      return error(res, 'REPLAY_DETECTED', 'Bu istek daha önce kullanılmış (replay attack engellendi)', 401);
    }

    // 3. API Key ile uygulamayı bul (apiKey alanından — mevcut sistemle uyumlu)
    const application = await prisma.application.findUnique({
      where: { apiKey },
    });

    if (!application) {
      return error(res, 'INVALID_API_KEY', 'Geçersiz API anahtarı', 401);
    }

    // 4. Uygulama aktif mi?
    if (!application.isActive) {
      return error(res, 'INVALID_API_KEY', 'Bu uygulama devre dışı bırakılmış', 401);
    }

    // 5. HMAC imzası doğrula (body normalize edilerek — key sort)
    const normalizedBody = JSON.stringify(req.body || {}, Object.keys(req.body || {}).sort());
    const expectedSignature = computeHmac(normalizedBody, timestamp, application.apiSecret);

    if (!safeCompare(signature, expectedSignature)) {
      return error(res, 'INVALID_SIGNATURE', 'HMAC imzası geçersiz', 401);
    }

    // 6. Replay cache'e ekle (imza geçerliyse)
    usedSignatures.set(sigKey, Date.now());

    // 7. Uygulama bilgisini request'e ekle
    req.application = application;

    // 8. Uygulama bazlı rate limit kontrolü
    const rl = checkAppRateLimit(application);
    if (rl.limited) {
      res.set('Retry-After', rl.retryAfterSeconds.toString());
      return error(res, 'APP_RATE_LIMITED',
        `Bu uygulamanın istek kotası doldu. ${rl.retryAfterSeconds} saniye sonra tekrar deneyin.`, 429);
    }

    // 9. IP Whitelist kontrolü (IP_WHITELIST_ENABLED=true ise uygulama bazı kontrol)
    return ipWhitelist(req, res, next);
  } catch (err) {
    console.error('[ApiAuth Middleware] Hata:', err.message);
    return error(res, 'INVALID_API_KEY', 'API doğrulama hatası', 401);
  }
}

module.exports = { apiAuth };
