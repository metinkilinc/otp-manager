const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;  // 16 byte
const TAG_LENGTH = 16; // 16 byte

function getKey() {
  if (!process.env.ENCRYPTION_KEY) {
    throw new Error('ENCRYPTION_KEY environment variable is not set');
  }
  return Buffer.from(process.env.ENCRYPTION_KEY, 'hex'); // 32 byte
}

/**
 * Metni AES-256-GCM ile şifrele
 * Format: iv_hex:tag_hex:encrypted_hex
 */
function encrypt(plaintext) {
  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const tag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`;
}

/**
 * AES-256-GCM ile şifreli metni çöz
 */
function decrypt(ciphertext) {
  const key = getKey();
  const [ivHex, tagHex, encryptedData] = ciphertext.split(':');

  if (!ivHex || !tagHex || !encryptedData) {
    throw new Error('Geçersiz şifreli metin formatı');
  }

  const iv = Buffer.from(ivHex, 'hex');
  const tag = Buffer.from(tagHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

module.exports = { encrypt, decrypt };
