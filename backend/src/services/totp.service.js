const { TOTP, Secret } = require('otpauth');
const QRCode = require('qrcode');
const { encrypt, decrypt } = require('./encryption.service');

/**
 * Yeni TOTP kaydı oluştur
 * @param {string} appName - Uygulama adı (QR'da issuer olarak görünür)
 * @param {string} userEmail - Kullanıcı emaili (QR'da label olarak görünür)
 * @returns {{ encryptedSecret, qrCodeDataUrl, otpauthUrl }}
 */
async function createEnrollment(appName, userEmail) {
  // 1. Yeni random secret üret (20 byte = 160 bit)
  const secret = new Secret({ size: 20 });

  // 2. TOTP nesnesi oluştur
  const totp = new TOTP({
    issuer: appName,
    label: userEmail || 'user',
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret: secret,
  });

  // 3. otpauth:// URL'si (Google Authenticator bu URL'yi okur)
  const otpauthUrl = totp.toString();

  // 4. QR kod üret (data URL olarak — frontend'de <img src="..."> ile göster)
  const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl, {
    width: 256,
    margin: 2,
    color: { dark: '#000000', light: '#ffffff' },
  });

  // 5. Secret'ı AES-256-GCM ile şifrele (DB'ye bu kaydedilir)
  const encryptedSecret = encrypt(secret.base32);

  return { encryptedSecret, qrCodeDataUrl, otpauthUrl };
}

/**
 * TOTP kodunu doğrula
 * @param {string} encryptedSecret - DB'deki şifreli secret
 * @param {string} code - Kullanıcının girdiği 6 haneli kod
 * @returns {boolean}
 */
function verifyCode(encryptedSecret, code) {
  const secretBase32 = decrypt(encryptedSecret);
  const totp = new TOTP({
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret: Secret.fromBase32(secretBase32),
  });

  // window: 1 = mevcut + 1 önceki + 1 sonraki periyot kabul eder (±30 sn tolerans)
  const delta = totp.validate({ token: code, window: 1 });
  return delta !== null; // null = geçersiz
}

module.exports = { createEnrollment, verifyCode };
