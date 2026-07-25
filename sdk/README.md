# @otp-manager/node-sdk

OTP Manager için resmi **Node.js / TypeScript** SDK. Otomatik HMAC imzalama, TypeScript tip desteği ve kapsamlı hata yönetimi içerir.

---

## Kurulum

```bash
npm install @otp-manager/node-sdk
# veya
yarn add @otp-manager/node-sdk
```

---

## Hızlı Başlangıç

```typescript
import { OTPClient } from '@otp-manager/node-sdk';

const client = new OTPClient({
  baseUrl: 'https://otp.yourcompany.com',
  apiKey: 'otp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
  apiSecret: 'secret_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
});
```

---

## Metodlar

### `enroll(params)` — Kullanıcı Kaydı

```typescript
const result = await client.enroll({
  userId: 'user_12345',
  email: 'user@yourcompany.com',   // isteğe bağlı
  name: 'Ali Yılmaz',            // isteğe bağlı
});

console.log(result.otpauthUrl);  // QR kod için kullanın
console.log(result.secret);      // Base32 secret
console.log(result.qrDataUrl);   // Hazır QR data URL
```

### `verify(params)` — Kayıt Doğrulama

Kullanıcı Authenticator uygulamasını taratıp ilk kodu girdikten sonra aktivasyon için çağırın:

```typescript
const result = await client.verify({
  userId: 'user_12345',
  token: '123456',
});

if (result.verified) {
  // Kurtarma kodlarını kullanıcıya göster — sadece bir kez döner!
  console.log(result.recoveryCodes);
}
```

### `validate(params)` — Giriş Doğrulama

Her giriş işleminde kullanıcının 6 haneli TOTP kodunu doğrulamak için:

```typescript
const result = await client.validate({
  userId: 'user_12345',
  token: '654321',
});

if (result.valid) {
  // Giriş izni ver
}
```

### `getStatus(userId)` — Kayıt Durumu

```typescript
const status = await client.getStatus('user_12345');

console.log(status.isActive);    // 2FA aktif mi?
console.log(status.isVerified);  // Kayıt onaylandı mı?
console.log(status.lastUsedAt);  // Son kullanım tarihi
```

### `disable(params)` — 2FA Devre Dışı

```typescript
await client.disable({ userId: 'user_12345' });
```

### `reset(params)` — Secret Sıfırla

Kullanıcı cihazını kaybettiyse yeni QR kod üretir:

```typescript
const result = await client.reset({ userId: 'user_12345' });
// result içinde yeni otpauthUrl ve secret döner
```

### `recovery(params)` — Kurtarma Kodu ile Giriş

```typescript
const result = await client.recovery({
  userId: 'user_12345',
  recoveryCode: 'ABCD-EFGH',
});

console.log(result.recovered);       // true → giriş başarılı
console.log(result.remainingCodes);  // Kalan kod sayısı
```

---

## Hata Yönetimi

SDK, OTP Manager hata kodlarını `OTPError` sınıfıyla fırlatır:

```typescript
import { OTPClient, OTPError } from '@otp-manager/node-sdk';

try {
  await client.validate({ userId: 'user_12345', token: 'yanlış' });
} catch (err) {
  if (err instanceof OTPError) {
    switch (err.code) {
      case 'INVALID_TOKEN':
        console.log('Yanlış doğrulama kodu');
        break;
      case 'ACCOUNT_LOCKED':
        console.log('Hesap kilitlendi, lütfen bekleyin');
        break;
      case 'ENROLLMENT_NOT_FOUND':
        console.log('Kullanıcı henüz 2FA kaydı yapmamış');
        break;
      case 'IP_FORBIDDEN':
        console.log('Bu IP adresinden erişim engellendi');
        break;
      default:
        console.log(`Hata: ${err.code} — ${err.message}`);
    }
    console.log(`HTTP ${err.statusCode}`);
  }
}
```

### Bilinen Hata Kodları

| Kod | HTTP | Açıklama |
|-----|------|----------|
| `INVALID_API_KEY` | 401 | API anahtarı geçersiz |
| `INVALID_SIGNATURE` | 401 | HMAC imzası doğrulanamadı |
| `TIMESTAMP_EXPIRED` | 401 | İstek çok eski veya gelecekte |
| `REPLAY_DETECTED` | 401 | Tekrar kullanılan istek |
| `ENROLLMENT_NOT_FOUND` | 404 | Kullanıcı kaydı bulunamadı |
| `INVALID_TOKEN` | 401 | Yanlış TOTP kodu |
| `ACCOUNT_LOCKED` | 429 | Çok fazla başarısız deneme |
| `RECOVERY_CODE_INVALID` | 401 | Geçersiz kurtarma kodu |
| `APP_RATE_LIMITED` | 429 | Uygulama istek kotası doldu |
| `IP_FORBIDDEN` | 403 | IP whitelist'te değil |

---

## HMAC İmzalama Detayı

SDK her istekte otomatik olarak imzalar:

```
normalizedBody = JSON.stringify(body, Object.keys(body).sort())
signature      = HMAC-SHA256(normalizedBody + timestamp, apiSecret)
```

Headers:
- `X-API-Key: <apiKey>`
- `X-Signature: <imza>`
- `X-Timestamp: <unix_saniye>`

---

## TypeScript Desteği

SDK tam TypeScript desteği ile gelir. Tüm metodlar tip güvenlidir:

```typescript
import { OTPClient, EnrollResponse, OTPError, KnownErrorCode } from '@otp-manager/node-sdk';
```

---

## Lisans

MIT
