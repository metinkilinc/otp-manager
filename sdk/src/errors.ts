import { OTPErrorPayload } from './types';

/**
 * OTP Manager SDK tarafından fırlatılan tipli hata sınıfı.
 *
 * @example
 * try {
 *   await client.validate({ userId: 'user1', token: '123456' });
 * } catch (err) {
 *   if (err instanceof OTPError) {
 *     console.log(err.code);       // 'INVALID_TOKEN'
 *     console.log(err.statusCode); // 401
 *   }
 * }
 */
export class OTPError extends Error {
  /** OTP Manager hata kodu — ör: 'INVALID_TOKEN', 'ENROLLMENT_NOT_FOUND' */
  public readonly code: string;
  /** HTTP durum kodu */
  public readonly statusCode: number;

  constructor(payload: OTPErrorPayload) {
    super(payload.message);
    this.name = 'OTPError';
    this.code = payload.code;
    this.statusCode = payload.statusCode;

    // TypeScript extends Error düzeltmesi
    Object.setPrototypeOf(this, OTPError.prototype);
  }

  toString(): string {
    return `OTPError[${this.code}] (${this.statusCode}): ${this.message}`;
  }
}

// ─── Bilinen hata kodları (type guard için) ───
export const KNOWN_ERROR_CODES = [
  'INVALID_API_KEY',
  'INVALID_SIGNATURE',
  'TIMESTAMP_EXPIRED',
  'REPLAY_DETECTED',
  'ENROLLMENT_NOT_FOUND',
  'ENROLLMENT_ALREADY_EXISTS',
  'INVALID_TOKEN',
  'ACCOUNT_LOCKED',
  'USER_NOT_ENROLLED',
  'RECOVERY_CODE_INVALID',
  'VALIDATION_ERROR',
  'RATE_LIMITED',
  'APP_RATE_LIMITED',
  'IP_FORBIDDEN',
  'SERVER_ERROR',
] as const;

export type KnownErrorCode = typeof KNOWN_ERROR_CODES[number];
