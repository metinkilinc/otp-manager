# otp-manager-go (Go / Golang SDK)

OTP Manager için resmi **Go (Golang)** SDK. Otomatik HMAC-SHA256 imzalama, `context.Context` desteği ve tipli `OtpManagerError` yönetimi içerir.

---

## Kurulum

```bash
go get github.com/otpmanager/otp-manager-go
```

---

## Hızlı Başlangıç

```go
package main

import (
	"context"
	"fmt"
	"log"
	"time"

	otpmanager "github.com/otpmanager/otp-manager-go"
)

func main() {
	client, err := otpmanager.NewClient(
		"https://otp.yourcompany.com",
		"otp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
		"secret_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
	)
	if err != nil {
		log.Fatalf("İstemci oluşturulamadı: %v", err)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// 1. Kullanıcı 2FA Kaydı Başlat (Enroll)
	enrollRes, err := client.Enroll(ctx, otpmanager.EnrollRequest{
		UserID: "user_101",
		Email:  "user@yourcompany.com",
		Name:   "Ali Yılmaz",
	})
	if err != nil {
		log.Fatalf("Enroll hatası: %v", err)
	}
	fmt.Println("QR Code URL:", enrollRes.QRCodeDataURL)

	// 2. Girişte TOTP Kod Doğrulama (Validate)
	valRes, err := client.Validate(ctx, "user_101", "123456")
	if err != nil {
		if otpErr, ok := err.(*otpmanager.OtpManagerError); ok {
			if otpErr.Code == "ACCOUNT_LOCKED" {
				fmt.Println("⚠️ Hesap kilitlendi!")
				return
			}
		}
		log.Fatalf("Doğrulama hatası: %v", err)
	}

	if valRes.Valid {
		fmt.Println("✅ 2FA Doğrulama Başarılı!")
	} else {
		fmt.Println("❌ Kod Geçersiz")
	}
}
```

---

## API Metodları

| Metod | Açıklama |
|-------|----------|
| `Enroll(ctx, req)` | 2FA kaydı başlatır, QR kodu döner. |
| `Verify(ctx, userID, code)` | QR kod tarandıktan sonraki ilk aktivasyon doğrulamasını yapar. |
| `Validate(ctx, userID, code)` | Login anında 6 haneli TOTP kodunu doğrular. |
| `GetStatus(ctx, userID)` | Kullanıcının 2FA durumunu sorgular. |
| `Disable(ctx, userID)` | Kullanıcının 2FA kaydını devre dışı bırakır. |
| `Reset(ctx, userID)` | TOTP secret'ı sıfırlar ve yeni QR kodu üretir. |
| `Recovery(ctx, userID, recoveryCode)` | Kurtarma kodu ile 2FA doğrulamasını geçer. |

---

## Lisans

MIT
