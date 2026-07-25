import crypto from 'crypto';
import axios, { AxiosInstance, AxiosError } from 'axios';
import {
  OTPClientConfig,
  EnrollRequest, EnrollResponse,
  VerifyRequest, VerifyResponse,
  ValidateRequest, ValidateResponse,
  EnrollmentStatus,
  DisableRequest, DisableResponse,
  ResetRequest, ResetResponse,
  RecoveryRequest, RecoveryResponse,
} from './types';
import { OTPError } from './errors';

/**
 * OTP Manager Node.js SDK İstemcisi
 *
 * @example
 * import { OTPClient } from '@otp-manager/node-sdk';
 *
 * const client = new OTPClient({
 *   baseUrl: 'https://otp.yourcompany.com',
 *   apiKey: 'otp_xxxxxx',
 *   apiSecret: 'secret_xxxxxx',
 * });
 *
 * // Kullanıcıyı kayıt et
 * const { otpauthUrl } = await client.enroll({ userId: 'user123' });
 *
 * // TOTP kodunu doğrula
 * const { valid } = await client.validate({ userId: 'user123', token: '123456' });
 */
export class OTPClient {
  private readonly http: AxiosInstance;
  private readonly apiKey: string;
  private readonly apiSecret: string;

  constructor(config: OTPClientConfig) {
    if (!config.baseUrl) throw new Error('OTPClient: baseUrl zorunludur');
    if (!config.apiKey) throw new Error('OTPClient: apiKey zorunludur');
    if (!config.apiSecret) throw new Error('OTPClient: apiSecret zorunludur');

    this.apiKey = config.apiKey;
    this.apiSecret = config.apiSecret;

    this.http = axios.create({
      baseURL: config.baseUrl.replace(/\/$/, '') + '/api/v1/totp',
      timeout: config.timeout ?? 10_000,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // ─── HMAC İmzalama ───

  /**
   * Body + timestamp'i HMAC-SHA256 ile imzala.
   * Sunucuyla aynı normalize mantığı: JSON.stringify(body, Object.keys(body).sort())
   */
  private sign(body: Record<string, unknown>, timestamp: string): string {
    const normalizedBody = JSON.stringify(body, Object.keys(body).sort());
    const payload = normalizedBody + timestamp;
    return crypto.createHmac('sha256', this.apiSecret).update(payload).digest('hex');
  }

  /** Unix saniye timestamp üret */
  private timestamp(): string {
    return Math.floor(Date.now() / 1000).toString();
  }

  // ─── İstek Gönderici ───

  private async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
    path: string,
    body: Record<string, unknown> = {}
  ): Promise<T> {
    const ts = this.timestamp();
    const sig = this.sign(body, ts);

    try {
      const res = await this.http.request({
        method,
        url: path,
        data: Object.keys(body).length > 0 ? body : undefined,
        headers: {
          'X-API-Key': this.apiKey,
          'X-Signature': sig,
          'X-Timestamp': ts,
        },
      });
      return res.data.data as T;
    } catch (err) {
      const axiosErr = err as AxiosError<{ error: { code: string; message: string } }>;
      if (axiosErr.response) {
        const errData = axiosErr.response.data?.error;
        throw new OTPError({
          code: errData?.code ?? 'SERVER_ERROR',
          message: errData?.message ?? 'Sunucu hatası',
          statusCode: axiosErr.response.status,
        });
      }
      throw new OTPError({
        code: 'NETWORK_ERROR',
        message: axiosErr.message ?? 'Ağ bağlantısı hatası',
        statusCode: 0,
      });
    }
  }

  // ─── Genel API Metodları ───

  /**
   * Yeni kullanıcı kaydı başlat.
   * Dönen `otpauthUrl` ile QR kod oluşturun, kullanıcı taratıp kodu girin.
   */
  async enroll(params: EnrollRequest): Promise<EnrollResponse> {
    return this.request<EnrollResponse>('POST', '/enroll', {
      userId: params.userId,
      ...(params.email && { email: params.email }),
      ...(params.name && { name: params.name }),
    });
  }

  /**
   * QR kodu tarattıktan sonra kullanıcının 6 haneli kodunu doğrula ve kaydı aktifleştir.
   * Başarılı aktivasyonda kurtarma kodları döner — güvenli saklayın.
   */
  async verify(params: VerifyRequest): Promise<VerifyResponse> {
    return this.request<VerifyResponse>('POST', '/verify', {
      userId: params.userId,
      token: params.token,
    });
  }

  /**
   * Kullanıcı girişinde 2FA kodunu doğrula.
   * `valid: true` ise giriş izni verin.
   */
  async validate(params: ValidateRequest): Promise<ValidateResponse> {
    return this.request<ValidateResponse>('POST', '/validate', {
      userId: params.userId,
      token: params.token,
    });
  }

  /**
   * Kullanıcının 2FA kayıt durumunu sorgula.
   */
  async getStatus(userId: string): Promise<EnrollmentStatus> {
    return this.request<EnrollmentStatus>('POST', '/status', { userId });
  }

  /**
   * Kullanıcının 2FA kaydını devre dışı bırak.
   */
  async disable(params: DisableRequest): Promise<DisableResponse> {
    return this.request<DisableResponse>('POST', '/disable', { userId: params.userId });
  }

  /**
   * Kullanıcının TOTP secret'ını sıfırla (yeni QR kod üretir).
   */
  async reset(params: ResetRequest): Promise<ResetResponse> {
    return this.request<ResetResponse>('POST', '/reset', { userId: params.userId });
  }

  /**
   * Kullanıcı kurtarma kodu ile 2FA'yı atla.
   */
  async recovery(params: RecoveryRequest): Promise<RecoveryResponse> {
    return this.request<RecoveryResponse>('POST', '/recovery', {
      userId: params.userId,
      recoveryCode: params.recoveryCode,
    });
  }
}
