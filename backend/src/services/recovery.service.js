const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const CODE_COUNT = 8;
const CODE_LENGTH = 8;
const CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Karıştırılabilecek karakterler çıkarıldı (0,O,1,I)

/**
 * Kurtarma kodları üret
 * @returns {{ plainCodes: string[], hashedCodes: string[] }}
 */
async function generateRecoveryCodes() {
  const plainCodes = [];

  for (let i = 0; i < CODE_COUNT; i++) {
    let code = '';
    const bytes = crypto.randomBytes(CODE_LENGTH);
    for (let j = 0; j < CODE_LENGTH; j++) {
      code += CHARSET[bytes[j] % CHARSET.length];
    }
    plainCodes.push(code);
  }

  // Her kodu bcrypt ile hashle
  const hashedCodes = await Promise.all(
    plainCodes.map((code) => bcrypt.hash(code, 10))
  );

  return { plainCodes, hashedCodes };
}

/**
 * Girilen kurtarma kodunun hashlenmiş listede olup olmadığını kontrol et
 * @param {string} inputCode - Kullanıcının girdiği kod
 * @param {string[]} hashedCodes - DB'deki hashlenmiş kodlar
 * @returns {{ valid: boolean, matchIndex: number }}
 */
async function verifyRecoveryCode(inputCode, hashedCodes) {
  const normalized = inputCode.trim().toUpperCase();

  for (let i = 0; i < hashedCodes.length; i++) {
    const match = await bcrypt.compare(normalized, hashedCodes[i]);
    if (match) {
      return { valid: true, matchIndex: i };
    }
  }

  return { valid: false, matchIndex: -1 };
}

module.exports = { generateRecoveryCodes, verifyRecoveryCode };
