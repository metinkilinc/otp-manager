const crypto = require('crypto');
const https = require('https');
const http = require('http');
const { URL } = require('url');

/**
 * Webhook Servisi
 *
 * Desteklenen olaylar:
 *  - enrollment.created   → Kullanıcı kaydı başlatıldı
 *  - enrollment.disabled  → 2FA devre dışı bırakıldı
 *  - auth.locked          → Hesap kilitlendi
 *  - recovery.used        → Kurtarma kodu kullanıldı
 *
 * Güvenlik:
 *  - X-OTP-Signature: HMAC-SHA256(JSON.stringify(payload), webhookSecret)
 *  - X-OTP-Event: olay adı
 *  - X-OTP-Timestamp: unix milisaniye
 *
 * Retry: 3 deneme, exponential backoff (1s, 3s, 9s)
 */

const RETRY_DELAYS_MS = [1000, 3000, 9000];
const WEBHOOK_TIMEOUT_MS = 8000;

/**
 * Webhook payload imzası hesapla
 */
function signWebhook(payload, secret) {
  return crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');
}

/**
 * Tek HTTP isteği gönder (retry yok — üst fonksiyon yönetir)
 */
function sendHttpRequest(webhookUrl, payload, signature, event) {
  return new Promise((resolve, reject) => {
    let parsedUrl;
    try {
      parsedUrl = new URL(webhookUrl);
    } catch {
      return reject(new Error(`Geçersiz webhook URL: ${webhookUrl}`));
    }

    const body = JSON.stringify(payload);
    const isHttps = parsedUrl.protocol === 'https:';
    const lib = isHttps ? https : http;

    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (isHttps ? 443 : 80),
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
        'X-OTP-Signature': signature,
        'X-OTP-Event': event,
        'X-OTP-Timestamp': Date.now().toString(),
        'User-Agent': 'OTP-Manager-Webhook/1.0',
      },
    };

    const req = lib.request(options, (res) => {
      // 2xx → başarı
      if (res.statusCode >= 200 && res.statusCode < 300) {
        resolve({ statusCode: res.statusCode });
      } else {
        reject(new Error(`HTTP ${res.statusCode}`));
      }
      res.resume(); // body'yi tüket
    });

    req.setTimeout(WEBHOOK_TIMEOUT_MS, () => {
      req.destroy();
      reject(new Error('Webhook isteği zaman aşımına uğradı'));
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

/**
 * Webhook gönder — retry logic dahil
 *
 * @param {object} params
 * @param {string} params.webhookUrl
 * @param {string} params.webhookSecret
 * @param {string} params.event   - enrollment.created | enrollment.disabled | auth.locked | recovery.used
 * @param {object} params.data    - Olaya özgü veri
 * @param {string} [params.applicationId]
 */
async function send({ webhookUrl, webhookSecret, event, data, applicationId }) {
  if (!webhookUrl || !webhookSecret) return; // Webhook yapılandırılmamışsa çık

  const payload = {
    event,
    applicationId: applicationId ?? null,
    timestamp: new Date().toISOString(),
    data,
  };

  const signature = signWebhook(payload, webhookSecret);

  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
    try {
      await sendHttpRequest(webhookUrl, payload, signature, event);
      console.log(`[Webhook] ✅ ${event} → ${webhookUrl} (deneme ${attempt + 1})`);
      return; // Başarılı, çık
    } catch (err) {
      const isLastAttempt = attempt === RETRY_DELAYS_MS.length;
      if (isLastAttempt) {
        console.error(`[Webhook] ❌ ${event} → ${webhookUrl} — Tüm denemeler başarısız: ${err.message}`);
        return;
      }
      const delay = RETRY_DELAYS_MS[attempt];
      console.warn(`[Webhook] ⚠️ ${event} → deneme ${attempt + 1} başarısız (${err.message}), ${delay}ms sonra tekrar...`);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
}

/**
 * Convenience — uygulama nesnesini alarak webhook gönder
 * application.webhookUrl ve application.webhookSecret otomatik kullanılır
 */
async function trigger(application, event, data) {
  if (!application?.webhookUrl) return;

  // Fire-and-forget: webhook hatası ana akışı engellemesin
  send({
    webhookUrl: application.webhookUrl,
    webhookSecret: application.webhookSecret,
    event,
    data,
    applicationId: application.id,
  }).catch((err) => {
    console.error('[Webhook] Beklenmeyen hata:', err.message);
  });
}

module.exports = { trigger, send, signWebhook };
