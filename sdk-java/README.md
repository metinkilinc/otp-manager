# otp-manager-client (Java & Spring Boot SDK)

OTP Manager için resmi **Java** ve **Spring Boot** SDK. Otomatik HMAC-SHA256 imzalama, Spring Boot Auto-Configuration ve `@Autowired` / `@Component` bağımlılık enjeksiyonu desteği içerir.

---

## Kurulum (Maven)

`pom.xml` dosyanıza ekleyin:

```xml
<dependency>
    <groupId>com.otpmanager</groupId>
    <artifactId>otp-manager-client</artifactId>
    <version>1.0.0</version>
</dependency>
```

---

## Spring Boot Entegrasyonu (Auto-Configuration)

### 1. `application.yml` veya `application.properties` Yapılandırması

```yaml
otp-manager:
  service-url: https://otp.yourcompany.com
  api-key: otp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
  api-secret: secret_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
  timeout-seconds: 10
```

### 2. Spring Service / Controller İçinde Kullanım (`@Autowired`)

```java
package com.example.demo.controller;

import com.otpmanager.client.OtpManagerClient;
import com.otpmanager.client.exception.OtpManagerException;
import com.otpmanager.client.model.OtpModels.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final OtpManagerClient otpClient;

    @Autowired
    public AuthController(OtpManagerClient otpClient) {
        this.otpClient = otpClient;
    }

    @PostMapping("/verify-2fa")
    public ResponseEntity<?> verify2FA(@RequestParam String userId, @RequestParam String code) {
        try {
            ValidateResponse response = otpClient.validate(userId, code);
            if (response.isValid()) {
                return ResponseEntity.ok("✅ 2FA Başarılı");
            }
            return ResponseEntity.badRequest().body("Kod geçersiz");
        } catch (OtpManagerException ex) {
            if ("ACCOUNT_LOCKED".equals(ex.getCode())) {
                return ResponseEntity.status(429).body("Hesap kilitlendi, lütfen bekleyin");
            }
            return ResponseEntity.status(ex.getStatusCode()).body(ex.getMessage());
        }
    }
}
```

---

## Standalone Java Kullanımı (Spring Olmadan)

```java
import com.otpmanager.client.OtpManagerClient;
import com.otpmanager.client.exception.OtpManagerException;
import com.otpmanager.client.model.OtpModels.*;

public class Main {
    public static void main(String[] args) {
        OtpManagerClient client = new OtpManagerClient(
            "https://otp.yourcompany.com",
            "otp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
            "secret_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
        );

        // 1. Enroll
        EnrollResponse enroll = client.enroll("user_101", "user@yourcompany.com", "Ali Yılmaz");
        System.out.println("QR Code Data URL: " + enroll.getQrCodeDataUrl());

        // 2. Validate
        try {
            ValidateResponse validate = client.validate("user_101", "123456");
            System.out.println("Valid: " + validate.isValid());
        } catch (OtpManagerException ex) {
            System.err.println("Hata: " + ex.getMessage());
        }
    }
}
```

---

## API Metodları

| Metod | Açıklama |
|-------|----------|
| `enroll(userId, email, name)` | 2FA kaydı başlatır, QR kodu döner. |
| `verify(userId, code)` | QR kod tarandıktan sonraki ilk kurulum doğrulamasını yapar. |
| `validate(userId, code)` | Login anında 6 haneli TOTP kodunu doğrular. |
| `getStatus(userId)` | Kullanıcının 2FA durumunu sorgular. |
| `disable(userId)` | Kullanıcının 2FA kaydını devre dışı bırakır. |
| `reset(userId)` | TOTP secret'ı sıfırlar ve yeni QR kodu üretir. |
| `recovery(userId, recoveryCode)` | Kurtarma kodu ile 2FA doğrulamasını geçer. |

---

## Lisans

MIT
