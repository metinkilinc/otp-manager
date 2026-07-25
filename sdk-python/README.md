# otp-manager-python

OTP Manager resmi **Python** ve **Async Python** SDK. Otomatik HMAC-SHA256 imzalama, tipli hata yönetimi ve senkron / asenkron istemci desteği sunar.

---

## Kurulum

```bash
# Senkron (requests ile)
pip install otp-manager-python

# Asenkron (httpx ile)
pip install "otp-manager-python[async]"
```

---

## Hızlı Başlangıç (Synchronous)

```python
from otp_manager import OTPClient, OTPError

client = OTPClient(
    base_url="https://otp.yourcompany.com",
    api_key="otp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    api_secret="secret_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
)

# 1. Kullanıcı Kaydı (Enrollment)
try:
    res = client.enroll(user_id="user_12345", email="user@yourcompany.com", name="Ali Yılmaz")
    print("QR Code URL:", res["qrCodeDataUrl"])
    print("OTP Auth URL:", res["otpauthUrl"])
except OTPError as e:
    print(f"Hata [{e.code}]: {e.message}")

# 2. Doğrulama (Validate)
try:
    res = client.validate(user_id="user_12345", token="123456")
    if res.get("valid"):
        print("✅ 2FA Doğrulama Başarılı")
    else:
        print("❌ Kod geçersiz")
except OTPError as e:
    if e.code == "ACCOUNT_LOCKED":
        print("⚠️ Hesap kilitlendi!")
```

---

## Asenkron Kullanım (Async / httpx)

```python
import asyncio
from otp_manager import AsyncOTPClient, OTPError

async def main():
    client = AsyncOTPClient(
        base_url="https://otp.yourcompany.com",
        api_key="otp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
        api_secret="secret_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
    )

    # 2FA Kod Doğrulama
    res = await client.validate(user_id="user_12345", token="123456")
    print("Valid:", res.get("valid"))

    # Durum Sorgulama
    status = await client.get_status("user_12345")
    print("Active:", status.get("enabled"))

asyncio.run(main())
```

---

## API Metodları

| Metod | Açıklama |
|-------|----------|
| `enroll(user_id, email=None, name=None)` | Yeni 2FA kaydı başlatır, QR kodu döner. |
| `verify(user_id, token)` | QR kod tarandıktan sonraki ilk aktivasyon doğrulaması. |
| `validate(user_id, token)` | Giriş anındaki 6 haneli TOTP kodunu doğrular. |
| `get_status(user_id)` | Kullanıcının 2FA durumunu sorgular. |
| `disable(user_id)` | Kullanıcının 2FA kaydını devre dışı bırakır. |
| `reset(user_id)` | Secret'ı sıfırlar ve yeni QR kodu üretir. |
| `recovery(user_id, recovery_code)` | Kurtarma kodu ile 2FA doğrulamasını geçer. |

---

## Lisans

MIT
