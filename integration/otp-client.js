const crypto = require('crypto');

/**
 * OTP Manager Node.js Client
 * 
 * Kullanım:
 *   const OTPClient = require('./otp-client');
 *   const otp = new OTPClient(
 *     process.env.OTP_SERVICE_URL,
 *     process.env.OTP_API_KEY,
 *     process.env.OTP_API_SECRET
 *   );
 */
class OTPClient {
  constructor(serviceUrl, apiKey, apiSecret) {
    if (!serviceUrl || !apiKey || !apiSecret) {
      throw new Error('OTPClient: serviceUrl, apiKey ve apiSecret zorunludur');
    }
    this.serviceUrl = serviceUrl.replace(/\/$/, ''); // trailing slash kaldır
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;
  }

  /**
   * HMAC-SHA256 imzası hesapla ve istek gönder
   */
  async _request(method, endpoint, body = {}) {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const bodyStr = JSON.stringify(body);
    const signature = crypto
      .createHmac('sha256', this.apiSecret)
      .update(bodyStr + timestamp)
      .digest('hex');

    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey,
        'X-Signature': signature,
        'X-Timestamp': timestamp,
      },
    };

    if (method !== 'GET') {
      options.body = bodyStr;
    }

    const res = await fetch(`${this.serviceUrl}${endpoint}`, options);
    const data = await res.json();
    return data;
  }

  /**
   * Kullanıcıyı 2FA'ya kaydet
   * @param {string} userId - Uygulamadaki kullanıcı ID'si
   * @param {string} [email] - Kullanıcı emaili (QR'da görünür)
   * @param {string} [name] - Kullanıcı adı (panelde görünür)
   * @returns {{ enrollmentId, qrCodeDataUrl, otpauthUrl, recoveryCodes }}
   */
  async enroll(userId, email, name) {
    return this._request('POST', '/api/v1/totp/enroll', { userId, email, name });
  }

  /**
   * İlk kurulum doğrulaması — QR tarandıktan sonra kullanıcının kodu onaylaması
   * @param {string} userId
   * @param {string} code - 6 haneli kod
   */
  async verify(userId, code) {
    return this._request('POST', '/api/v1/totp/verify', { userId, code });
  }

  /**
   * Her login'de 2FA kodu doğrula
   * @param {string} userId
   * @param {string} code - 6 haneli kod
   */
  async validate(userId, code) {
    return this._request('POST', '/api/v1/totp/validate', { userId, code });
  }

  /**
   * Kullanıcının 2FA durumunu kontrol et
   * @returns {{ enrolled, enabled, verified, lastUsedAt }}
   */
  async getStatus(userId) {
    return this._request('GET', `/api/v1/totp/status/${userId}`);
  }

  /**
   * 2FA'yı devre dışı bırak (secret silinmez)
   */
  async disable(userId) {
    return this._request('POST', '/api/v1/totp/disable', { userId });
  }

  /**
   * 2FA sıfırla — yeni secret + QR + recovery kodları üret
   */
  async reset(userId) {
    return this._request('POST', '/api/v1/totp/reset', { userId });
  }

  /**
   * Kurtarma kodu ile giriş
   * @param {string} userId
   * @param {string} recoveryCode - Kurtarma kodu (örn. A1B2C3D4)
   */
  async recovery(userId, recoveryCode) {
    return this._request('POST', '/api/v1/totp/recovery', { userId, recoveryCode });
  }
}

module.exports = OTPClient;
