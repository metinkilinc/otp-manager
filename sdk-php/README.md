# otp-manager/php-sdk

OTP Manager resmi **PHP** ve **Laravel** SDK. Otomatik HMAC-SHA256 imzalama, Laravel Service Provider ve Facade desteği içerir.

---

## Kurulum

```bash
composer require otp-manager/php-sdk
```

---

## Saf PHP Kullanımı (Standalone PHP)

```php
<?php

use OtpManager\OTPClient;
use OtpManager\Exceptions\OTPException;

require_once __DIR__ . '/vendor/autoload.php';

$client = new OTPClient(
    baseUrl: 'https://otp.yourcompany.com',
    apiKey: 'otp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    apiSecret: 'secret_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
);

// 1. 2FA Kaydı Başlatma (Enroll)
try {
    $result = $client->enroll(userId: 'user_12345', email: 'user@yourcompany.com');
    echo "QR Code Data URL: " . $result['qrCodeDataUrl'] . "\n";
} catch (OTPException $e) {
    echo "Hata [{$e->getErrorCode()}]: {$e->getMessage()}\n";
}

// 2. Girişte TOTP Kod Doğrulama (Validate)
try {
    $res = $client->validate(userId: 'user_12345', code: '123456');
    if ($res['valid'] ?? false) {
        echo "✅ 2FA Başarılı\n";
    }
} catch (OTPException $e) {
    echo "Doğrulama Hatası: " . $e->getMessage() . "\n";
}
```

---

## Laravel Entegrasyonu

### 1. `.env` Yapılandırması

```env
OTP_SERVICE_URL=https://otp.yourcompany.com
OTP_API_KEY=otp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
OTP_API_SECRET=secret_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 2. Controller İçinde Kullanım (Facade ile)

```php
<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use OtpManager\Laravel\OTPFacade as OTP;
use OtpManager\Exceptions\OTPException;

class AuthController extends Controller
{
    public function verifyTwoFactor(Request $request)
    {
        $request->validate([
            'code' => 'required|string|size:6',
        ]);

        try {
            $result = OTP::validate(
                userId: (string) auth()->id(),
                code: $request->input('code')
            );

            if ($result['valid']) {
                session(['2fa_passed' => true]);
                return redirect()->intended('/dashboard');
            }
        } catch (OTPException $e) {
            return back()->withErrors(['code' => $e->getMessage()]);
        }

        return back()->withErrors(['code' => 'Geçersiz 2FA kodu']);
    }
}
```

---

## API Metodları

| Metod | Açıklama |
|-------|----------|
| `enroll($userId, $email = null, $name = null)` | 2FA kaydı başlatır, QR kodu döner. |
| `verify($userId, $code)` | İlk kurulum doğrulamasını yapar ve 2FA'yı aktifleştirir. |
| `validate($userId, $code)` | Login anında 6 haneli TOTP kodunu doğrular. |
| `getStatus($userId)` | Kullanıcının 2FA durumunu sorgular. |
| `disable($userId)` | 2FA kaydını devre dışı bırakır. |
| `reset($userId)` | TOTP secret'ı sıfırlar ve yeni QR kodu üretir. |
| `recovery($userId, $recoveryCode)` | Kurtarma kodu ile 2FA doğrulamasını geçer. |

---

## Lisans

MIT
