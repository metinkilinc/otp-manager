// ─── OTP Manager Node.js SDK Tip Tanımları ───

/** SDK istemcisini başlatmak için gereken yapılandırma */
export interface OTPClientConfig {
  /** OTP Manager API temel URL'i — ör: "https://otp.yourcompany.com" */
  baseUrl: string;
  /** Uygulama API Key'i — X-API-Key header'ı olarak gönderilir */
  apiKey: string;
  /** Uygulama API Secret'ı — HMAC imzalama için */
  apiSecret: string;
  /** İstek zaman aşımı (ms). Varsayılan: 10000 */
  timeout?: number;
}

// ─── Enroll ───

export interface EnrollRequest {
  /** Sisteme kayıt edilecek kullanıcının harici ID'si */
  userId: string;
  /** Kullanıcının e-posta adresi (isteğe bağlı, görüntüleme için) */
  email?: string;
  /** Kullanıcının görünen adı (isteğe bağlı) */
  name?: string;
}

export interface EnrollResponse {
  /** OTP URI — QR kod üretimi için */
  otpauthUrl: string;
  /** Base32 formatında TOTP secret */
  secret: string;
  /** QR kod görseli için hazır data URL */
  qrDataUrl: string;
  /** Kullanıcıya özgü kayıt ID'si */
  enrollmentId: string;
}

// ─── Verify (Kayıt Doğrulama) ───

export interface VerifyRequest {
  userId: string;
  /** Kullanıcıdan alınan 6 haneli TOTP kodu */
  token: string;
}

export interface VerifyResponse {
  /** true → kayıt doğrulandı ve aktifleştirildi */
  verified: boolean;
  /** Kurtarma kodları — yalnızca ilk aktivasyonda döner */
  recoveryCodes?: string[];
}

// ─── Validate (Giriş Doğrulama) ───

export interface ValidateRequest {
  userId: string;
  /** Kullanıcıdan alınan 6 haneli TOTP kodu */
  token: string;
}

export interface ValidateResponse {
  /** true → doğrulama başarılı */
  valid: boolean;
}

// ─── Status ───

export interface EnrollmentStatus {
  userId: string;
  isActive: boolean;
  isVerified: boolean;
  lastUsedAt: string | null;
  createdAt: string;
}

// ─── Disable ───

export interface DisableRequest {
  userId: string;
}

export interface DisableResponse {
  disabled: boolean;
}

// ─── Reset ───

export interface ResetRequest {
  userId: string;
}

export interface ResetResponse {
  /** Yeni QR kodunu taratmak için kullanılacak URL */
  otpauthUrl: string;
  secret: string;
  qrDataUrl: string;
  enrollmentId: string;
}

// ─── Recovery ───

export interface RecoveryRequest {
  userId: string;
  /** Kullanıcının girdiği kurtarma kodu */
  recoveryCode: string;
}

export interface RecoveryResponse {
  /** true → kurtarma başarılı, oturum açılabilir */
  recovered: boolean;
  /** Kalan kurtarma kodu sayısı */
  remainingCodes: number;
}

// ─── Hata Yapısı ───

export interface OTPErrorPayload {
  code: string;
  message: string;
  statusCode: number;
}
