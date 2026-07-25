const crypto = require('crypto');

/**
 * HMAC-SHA256 imzası hesapla
 * @param {string} body - JSON.stringify(req.body)
 * @param {string} timestamp - unix saniye string
 * @param {string} secret - uygulama API secret'ı
 * @returns {string} hex imza
 */
function computeHmac(body, timestamp, secret) {
  const payload = body + timestamp;
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

/**
 * Sabit zamanlı string karşılaştırma (timing attack önlemi)
 */
function safeCompare(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  if (a.length !== b.length) {
    // Uzunluk farklı olsa bile sabit zaman harcayalım
    crypto.timingSafeEqual(Buffer.alloc(1), Buffer.alloc(1));
    return false;
  }
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

module.exports = { computeHmac, safeCompare };
