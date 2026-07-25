# OtpManager.Client (.NET / C# SDK)

OTP Manager için resmi **C# / .NET SDK**. Otomatik HMAC-SHA256 imzalama, ASP.NET Core Dependency Injection desteği ve `async/await` mimarisi içerir.

---

## Kurulum

```bash
dotnet add package OtpManager.Client
```

---

## ASP.NET Core Entegrasyonu (Dependency Injection)

### 1. `appsettings.json` Yapılandırması

```json
{
  "OtpManager": {
    "BaseUrl": "https://otp.yourcompany.com",
    "ApiKey": "otp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    "ApiSecret": "secret_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    "TimeoutSeconds": 10
  }
}
```

### 2. `Program.cs` Servis Kaydı

```csharp
using OtpManager.Client;

var builder = WebApplication.CreateBuilder(args);

// appsettings.json dosyasından OtpManager konfigürasyonunu ekleyin:
builder.Services.AddOtpManager(builder.Configuration);

// veya lambda ile:
// builder.Services.AddOtpManager(options => {
//     options.BaseUrl = "https://otp.yourcompany.com";
//     options.ApiKey = "otp_xxx";
//     options.ApiSecret = "secret_xxx";
// });

var app = builder.Build();
```

### 3. Controller / Service Kullanımı

```csharp
using Microsoft.AspNetCore.Mvc;
using OtpManager.Client;
using OtpManager.Client.Models;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IOtpClient _otpClient;

    public AuthController(IOtpClient otpClient)
    {
        _otpClient = otpClient;
    }

    [HttpPost("verify-2fa")]
    public async Task<IActionResult> VerifyTwoFactor([FromBody] VerifyDto dto)
    {
        try
        {
            ValidateResponse res = await _otpClient.ValidateAsync(dto.UserId, dto.Code);
            if (res.Valid)
            {
                return Ok(new { Success = true, Message = "2FA Başarılı" });
            }
            return BadRequest(new { Success = false, Message = "Kod geçersiz" });
        }
        catch (OtpManagerException ex)
        {
            if (ex.Code == "ACCOUNT_LOCKED")
            {
                return StatusCode(429, new { Message = "Hesap kilitlendi, lütfen bekleyin" });
            }
            return StatusCode(ex.StatusCode, new { Error = ex.Code, ex.Message });
        }
    }
}
```

---

## Standalone C# Kullanımı (Console App / Desktop)

```csharp
using System;
using System.Threading.Tasks;
using OtpManager.Client;
using OtpManager.Client.Models;

class Program
{
    static async Task Main(string[] args)
    {
        var options = new OtpManagerOptions
        {
            BaseUrl = "https://otp.yourcompany.com",
            ApiKey = "otp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
            ApiSecret = "secret_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
        };

        IOtpClient client = new OtpClient(options);

        // 1. Enroll
        EnrollResponse enrollRes = await client.EnrollAsync("user_101", "user@yourcompany.com", "Ali Yılmaz");
        Console.WriteLine($"QR Code URL: {enrollRes.QrCodeDataUrl}");

        // 2. Validate
        ValidateResponse validateRes = await client.ValidateAsync("user_101", "123456");
        Console.WriteLine($"Valid: {validateRes.Valid}");

        // 3. Recovery
        RecoveryResponse recoveryRes = await client.RecoveryAsync("user_101", "ABCD-EFGH");
        Console.WriteLine($"Recovery Valid: {recoveryRes.Valid}");
    }
}
```

---

## API Metodları

| Metod | Açıklama |
|-------|----------|
| `EnrollAsync(userId, email, name)` | 2FA kaydı başlatır, QR kodu döner. |
| `VerifyAsync(userId, code)` | QR kod tarandıktan sonraki ilk aktivasyon doğrulamasını yapar. |
| `ValidateAsync(userId, code)` | Giriş anında 6 haneli TOTP kodunu doğrular. |
| `GetStatusAsync(userId)` | Kullanıcının 2FA durumunu sorgular. |
| `DisableAsync(userId)` | Kullanıcının 2FA kaydını devre dışı bırakır. |
| `ResetAsync(userId)` | TOTP secret'ı sıfırlar ve yeni QR kodu üretir. |
| `RecoveryAsync(userId, recoveryCode)` | Kurtarma kodu ile 2FA doğrulamasını geçer. |

---

## Lisans

MIT
