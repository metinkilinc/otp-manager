import { useState } from 'react';
import { Terminal, Code, Cpu, Package, CheckCircle2, ShieldCheck, Binary, Coffee, Box } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import CopyButton from '../ui/CopyButton';

function getSnippets(isEn, serviceUrl, apiKey, apiSecret) {
  return {
    nodejs: {
      name: 'Node.js / TypeScript SDK',
      install: 'npm install @otp-manager/node-sdk',
      configLabel: isEn ? '2. Environment Variables (.env)' : '2. Ortam Değişkenleri (.env)',
      configText: `OTP_SERVICE_URL=${serviceUrl}\nOTP_API_KEY=${apiKey}\nOTP_API_SECRET=${apiSecret}`,
      init: `import { OTPClient, OTPError } from '@otp-manager/node-sdk';

const otp = new OTPClient({
  baseUrl: process.env.OTP_SERVICE_URL!,
  apiKey: process.env.OTP_API_KEY!,
  apiSecret: process.env.OTP_API_SECRET!,
});`,
      enroll: isEn
        ? `// 1. Initiate 2FA Enrollment for user (enroll)
try {
  const { otpauthUrl, qrDataUrl, recoveryCodes } = await otp.enroll({
    userId: 'user_101',
    email: 'user@company.com',
    name: 'John Doe',
  });

  // Send QR Code Data URL to frontend
  console.log('QR Code:', qrDataUrl);
  console.log('Recovery Codes:', recoveryCodes);
} catch (err) {
  if (err instanceof OTPError) {
    console.error('Enrollment Error:', err.code, err.message);
  }
}`
        : `// 1. Kullanıcı için 2FA Kaydı Başlat (enroll)
try {
  const { otpauthUrl, qrDataUrl, recoveryCodes } = await otp.enroll({
    userId: 'user_101',
    email: 'user@yourcompany.com',
    name: 'Ahmet Yılmaz',
  });

  // QR Kod Data URL'sini frontend'e gönderin
  console.log('QR Code:', qrDataUrl);
  console.log('Kurtarma Kodları:', recoveryCodes);
} catch (err) {
  if (err instanceof OTPError) {
    console.error('Enrollment Hatası:', err.code, err.message);
  }
}`,
      validate: isEn
        ? `// 2. Validate 6-Digit TOTP Code during login (validate)
try {
  const { valid } = await otp.validate({
    userId: 'user_101',
    token: req.body.totpCode, // 6-digit code
  });

  if (valid) {
    // Login successful — Create Session/JWT
    console.log('✅ 2FA Verified');
  }
} catch (err) {
  if (err instanceof OTPError) {
    if (err.code === 'ACCOUNT_LOCKED') {
      return res.status(429).json({ message: 'Account locked, please wait' });
    }
    return res.status(401).json({ message: 'Invalid 2FA code' });
  }
}`
        : `// 2. Giriş Anında 6 Haneli TOTP Kodunu Doğrula (validate)
try {
  const { valid } = await otp.validate({
    userId: 'user_101',
    token: req.body.totpCode, // 6 haneli kod
  });

  if (valid) {
    // Giriş başarılı — Session/JWT oluşturun
    console.log('✅ 2FA Doğrulandı');
  }
} catch (err) {
  if (err instanceof OTPError) {
    if (err.code === 'ACCOUNT_LOCKED') {
      return res.status(429).json({ message: 'Hesap kilitlendi, lütfen bekleyin' });
    }
    return res.status(401).json({ message: 'Geçersiz 2FA kodu' });
  }
}`,
      recovery: isEn
        ? `// 3. Login with Recovery Code if phone is lost (recovery)
try {
  const { recovered, remainingCodes } = await otp.recovery({
    userId: 'user_101',
    recoveryCode: req.body.recoveryCode, // Ex: ABCD-EFGH
  });

  if (recovered) {
    console.log(\`✅ Recovery code accepted. Remaining codes: \${remainingCodes}\`);
  }
} catch (err) {
  console.error('Recovery code error:', err.message);
}`
        : `// 3. Telefon Kayıpsa Kurtarma Kodu ile Giriş Yap (recovery)
try {
  const { recovered, remainingCodes } = await otp.recovery({
    userId: 'user_101',
    recoveryCode: req.body.recoveryCode, // Ör: ABCD-EFGH
  });

  if (recovered) {
    console.log(\`✅ Kurtarma kodu kabul edildi. Kalan kod sayısı: \${remainingCodes}\`);
  }
} catch (err) {
  console.error('Kurtarma kodu hatası:', err.message);
}`,
    },
    python: {
      name: 'Python SDK (Sync & Async)',
      install: isEn
        ? '# Synchronous (with requests)\npip install otp-manager-python\n\n# Asynchronous (with httpx)\npip install "otp-manager-python[async]"'
        : '# Senkron (requests ile)\npip install otp-manager-python\n\n# Asenkron (httpx ile)\npip install "otp-manager-python[async]"',
      configLabel: isEn ? '2. Environment Variables (.env)' : '2. Ortam Değişkenleri (.env)',
      configText: `OTP_SERVICE_URL=${serviceUrl}\nOTP_API_KEY=${apiKey}\nOTP_API_SECRET=${apiSecret}`,
      init: `import os
from otp_manager import OTPClient, OTPError

otp = OTPClient(
    base_url=os.getenv("OTP_SERVICE_URL", "${serviceUrl}"),
    api_key=os.getenv("OTP_API_KEY", "${apiKey}"),
    api_secret=os.getenv("OTP_API_SECRET", "${apiSecret}")
)`,
      enroll: isEn
        ? `# 1. Start User 2FA Enrollment (enroll)
try:
    result = otp.enroll(
        user_id="user_101",
        email="user@company.com",
        name="John Doe"
    )
    print("QR Code Data URL:", result["qrCodeDataUrl"])
    print("Recovery Codes:", result.get("recoveryCodes"))
except OTPError as e:
    print(f"Enrollment Error [{e.code}]: {e.message}")`
        : `# 1. Kullanıcı 2FA Kaydı Başlat (enroll)
try:
    result = otp.enroll(
        user_id="user_101",
        email="user@yourcompany.com",
        name="Ahmet Yılmaz"
    )
    print("QR Code Data URL:", result["qrCodeDataUrl"])
    print("Kurtarma Kodları:", result.get("recoveryCodes"))
except OTPError as e:
    print(f"Enrollment Hatası [{e.code}]: {e.message}")`,
      validate: isEn
        ? `# 2. Validate 6-Digit TOTP Code on Login (validate)
try:
    res = otp.validate(user_id="user_101", token="123456")
    if res.get("valid"):
        print("✅ 2FA Verified")
    else:
        print("❌ Code Invalid")
except OTPError as e:
    if e.code == "ACCOUNT_LOCKED":
        print("⚠️ Too many failed attempts! Account locked.")
    else:
        print(f"Error [{e.code}]: {e.message}")`
        : `# 2. Giriş Anında 6 Haneli TOTP Kod Doğrulama (validate)
try:
    res = otp.validate(user_id="user_101", token="123456")
    if res.get("valid"):
        print("✅ 2FA Doğrulandı")
    else:
        print("❌ Kod Geçersiz")
except OTPError as e:
    if e.code == "ACCOUNT_LOCKED":
        print("⚠️ Çok fazla hatalı deneme! Hesap kilitlendi.")
    else:
        print(f"Hata [{e.code}]: {e.message}")`,
      recovery: isEn
        ? `# 3. Login with Recovery Code (recovery)
try:
    res = otp.recovery(user_id="user_101", recovery_code="ABCD-EFGH")
    if res.get("recovered"):
        print(f"✅ Recovery successful. Remaining codes: {res.get('remainingCodes')}")
except OTPError as e:
    print("Recovery code error:", e.message)`
        : `# 3. Kurtarma Kodu ile Giriş (recovery)
try:
    res = otp.recovery(user_id="user_101", recovery_code="ABCD-EFGH")
    if res.get("recovered"):
        print(f"✅ Kurtarma başarılı. Kalan kod: {res.get('remainingCodes')}")
except OTPError as e:
    print("Kurtarma koda hatası:", e.message)`,
    },
    php: {
      name: 'PHP & Laravel SDK',
      install: 'composer require otp-manager/php-sdk',
      configLabel: isEn ? '2. Environment Variables (.env)' : '2. Ortam Değişkenleri (.env)',
      configText: `OTP_SERVICE_URL=${serviceUrl}\nOTP_API_KEY=${apiKey}\nOTP_API_SECRET=${apiSecret}`,
      init: isEn
        ? `// Standalone PHP
use OtpManager\\OTPClient;
use OtpManager\\Exceptions\\OTPException;

$otp = new OTPClient(
    baseUrl: getenv('OTP_SERVICE_URL'),
    apiKey: getenv('OTP_API_KEY'),
    apiSecret: getenv('OTP_API_SECRET')
);

// Or inside Laravel via Facade:
// use OtpManager\\Laravel\\OTPFacade as OTP;`
        : `// Standalone PHP
use OtpManager\\OTPClient;
use OtpManager\\Exceptions\\OTPException;

$otp = new OTPClient(
    baseUrl: getenv('OTP_SERVICE_URL'),
    apiKey: getenv('OTP_API_KEY'),
    apiSecret: getenv('OTP_API_SECRET')
);

// Veya Laravel içinde Facade ile:
// use OtpManager\\Laravel\\OTPFacade as OTP;`,
      enroll: isEn
        ? `// 1. Start User 2FA Enrollment (enroll)
try {
    $result = $otp->enroll(
        userId: 'user_101',
        email: 'user@company.com',
        name: 'John Doe'
    );

    $qrDataUrl = $result['qrCodeDataUrl'];
    $recoveryCodes = $result['recoveryCodes'] ?? [];
} catch (OTPException $e) {
    echo "Enrollment Error [{$e->getErrorCode()}]: " . $e->getMessage();
}`
        : `// 1. Kullanıcı 2FA Kaydı Başlat (enroll)
try {
    $result = $otp->enroll(
        userId: 'user_101',
        email: 'user@yourcompany.com',
        name: 'Ahmet Yılmaz'
    );

    $qrDataUrl = $result['qrCodeDataUrl'];
    $recoveryCodes = $result['recoveryCodes'] ?? [];
} catch (OTPException $e) {
    echo "Enrollment Hatası [{$e->getErrorCode()}]: " . $e->getMessage();
}`,
      validate: isEn
        ? `// 2. TOTP Code Verification on Login (validate) — Laravel Example
use OtpManager\\Laravel\\OTPFacade as OTP;
use OtpManager\\Exceptions\\OTPException;

try {
    $result = OTP::validate(
        userId: (string) auth()->id(),
        code: $request->input('totp_code')
    );

    if ($result['valid'] ?? false) {
        session(['2fa_passed' => true]);
        return redirect()->intended('/dashboard');
    }
} catch (OTPException $e) {
    return back()->withErrors(['code' => $e->getMessage()]);
}`
        : `// 2. Girişte TOTP Kod Doğrulama (validate) — Laravel Örneği
use OtpManager\\Laravel\\OTPFacade as OTP;
use OtpManager\\Exceptions\\OTPException;

try {
    $result = OTP::validate(
        userId: (string) auth()->id(),
        code: $request->input('totp_code')
    );

    if ($result['valid'] ?? false) {
        session(['2fa_passed' => true]);
        return redirect()->intended('/dashboard');
    }
} catch (OTPException $e) {
    return back()->withErrors(['code' => $e->getMessage()]);
}`,
      recovery: isEn
        ? `// 3. Login with Recovery Code (recovery)
try {
    $result = $otp->recovery(
        userId: 'user_101',
        recoveryCode: $request->input('recovery_code')
    );

    if ($result['valid'] ?? false) {
        echo "✅ Recovery successful. Remaining codes: " . $result['remainingRecoveryCodes'];
    }
} catch (OTPException $e) {
    echo "Recovery error: " . $e->getMessage();
}`
        : `// 3. Kurtarma Kodu ile Giriş (recovery)
try {
    $result = $otp->recovery(
        userId: 'user_101',
        recoveryCode: $request->input('recovery_code')
    );

    if ($result['valid'] ?? false) {
        echo "✅ Kurtarma başarılı. Kalan kod: " . $result['remainingRecoveryCodes'];
    }
} catch (OTPException $e) {
    echo "Kurtarma hatası: " . $e->getMessage();
}`,
    },
    dotnet: {
      name: '.NET / C# SDK (OtpManager.Client)',
      install: 'dotnet add package OtpManager.Client',
      configLabel: isEn ? '2. Configuration (appsettings.json)' : '2. Yapılandırma (appsettings.json)',
      configText: `{
  "OtpManager": {
    "BaseUrl": "${serviceUrl}",
    "ApiKey": "${apiKey}",
    "ApiSecret": "${apiSecret}",
    "TimeoutSeconds": 10
  }
}`,
      init: isEn
        ? `// 1. Program.cs Service Registration (Dependency Injection)
builder.Services.AddOtpManager(builder.Configuration);

// 2. Injection inside Controller
public class AuthController : ControllerBase
{
    private readonly IOtpClient _otpClient;

    public AuthController(IOtpClient otpClient)
    {
        _otpClient = otpClient;
    }
}`
        : `// 1. Program.cs Servis Kaydı (Dependency Injection)
builder.Services.AddOtpManager(builder.Configuration);

// 2. Controller İçinde Injection
public class AuthController : ControllerBase
{
    private readonly IOtpClient _otpClient;

    public AuthController(IOtpClient otpClient)
    {
        _otpClient = otpClient;
    }
}`,
      enroll: isEn
        ? `// 1. Start User 2FA Enrollment (enroll)
try
{
    EnrollResponse enrollRes = await _otpClient.EnrollAsync(
        userId: "user_101",
        email: "user@company.com",
        name: "John Doe"
    );

    string qrCodeUrl = enrollRes.QrCodeDataUrl;
    List<string>? recoveryCodes = enrollRes.RecoveryCodes;
}
catch (OtpManagerException ex)
{
    Console.WriteLine($"Enrollment Error [{ex.Code}]: {ex.Message}");
}`
        : `// 1. Kullanıcı 2FA Kaydı Başlat (enroll)
try
{
    EnrollResponse enrollRes = await _otpClient.EnrollAsync(
        userId: "user_101",
        email: "user@yourcompany.com",
        name: "Ahmet Yılmaz"
    );

    string qrCodeUrl = enrollRes.QrCodeDataUrl;
    List<string>? recoveryCodes = enrollRes.RecoveryCodes;
}
catch (OtpManagerException ex)
{
    Console.WriteLine($"Enrollment Hatası [{ex.Code}]: {ex.Message}");
}`,
      validate: isEn
        ? `// 2. Validate 6-Digit TOTP Code on Login (validate)
try
{
    ValidateResponse validateRes = await _otpClient.ValidateAsync("user_101", "123456");
    if (validateRes.Valid)
    {
        // ✅ 2FA Verified
        return Ok(new { Success = true });
    }
    return BadRequest(new { Message = "Code invalid" });
}
catch (OtpManagerException ex)
{
    if (ex.Code == "ACCOUNT_LOCKED")
    {
        return StatusCode(429, new { Message = "Account locked, please wait" });
    }
    return StatusCode(ex.StatusCode, new { Error = ex.Code, ex.Message });
}`
        : `// 2. Giriş Anında 6 Haneli TOTP Kod Doğrulama (validate)
try
{
    ValidateResponse validateRes = await _otpClient.ValidateAsync("user_101", "123456");
    if (validateRes.Valid)
    {
        // ✅ 2FA Başarılı
        return Ok(new { Success = true });
    }
    return BadRequest(new { Message = "Kod geçersiz" });
}
catch (OtpManagerException ex)
{
    if (ex.Code == "ACCOUNT_LOCKED")
    {
        return StatusCode(429, new { Message = "Hesap kilitlendi, lütfen bekleyin" });
    }
    return StatusCode(ex.StatusCode, new { Error = ex.Code, ex.Message });
}`,
      recovery: isEn
        ? `// 3. Login with Recovery Code (recovery)
try
{
    RecoveryResponse recRes = await _otpClient.RecoveryAsync("user_101", "ABCD-EFGH");
    if (recRes.Valid)
    {
        Console.WriteLine($"✅ Recovery successful. Remaining codes: {recRes.RemainingRecoveryCodes}");
    }
}
catch (OtpManagerException ex)
{
    Console.WriteLine($"Recovery error: {ex.Message}");
}`
        : `// 3. Kurtarma Kodu ile Giriş (recovery)
try
{
    RecoveryResponse recRes = await _otpClient.RecoveryAsync("user_101", "ABCD-EFGH");
    if (recRes.Valid)
    {
        Console.WriteLine($"✅ Kurtarma başarılı. Kalan kod sayısı: {recRes.RemainingRecoveryCodes}");
    }
}
catch (OtpManagerException ex)
{
    Console.WriteLine($"Kurtarma hatası: {ex.Message}");
}`,
    },
    java: {
      name: 'Java & Spring Boot SDK (otp-manager-client)',
      install: `<dependency>\n    <groupId>com.otpmanager</groupId>\n    <artifactId>otp-manager-client</artifactId>\n    <version>1.0.0</version>\n</dependency>`,
      configLabel: isEn ? '2. Configuration (application.yml)' : '2. Yapılandırma (application.yml)',
      configText: `otp-manager:\n  service-url: ${serviceUrl}\n  api-key: ${apiKey}\n  api-secret: ${apiSecret}\n  timeout-seconds: 10`,
      init: isEn
        ? `// Spring Boot Automatic Bean Injection (@Autowired)
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final OtpManagerClient otpClient;

    @Autowired
    public AuthController(OtpManagerClient otpClient) {
        this.otpClient = otpClient;
    }
}`
        : `// Spring Boot Otomatik Bean Enjeksiyonu (@Autowired)
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final OtpManagerClient otpClient;

    @Autowired
    public AuthController(OtpManagerClient otpClient) {
        this.otpClient = otpClient;
    }
}`,
      enroll: isEn
        ? `// 1. Full Login Flow — Enroll (Start 2FA Setup)
try {
    EnrollResponse enrollRes = otpClient.enroll("user_101", "user@company.com", "John Doe");
    String qrDataUrl = enrollRes.getQrCodeDataUrl();
    List<String> recoveryCodes = enrollRes.getRecoveryCodes();
    System.out.println("QR Data URL: " + qrDataUrl);
} catch (OtpManagerException ex) {
    System.err.println("Enroll Error [" + ex.getCode() + "]: " + ex.getMessage());
}`
        : `// 1. Tam Login Akışı — Enroll (2FA Kaydı Başlat)
try {
    EnrollResponse enrollRes = otpClient.enroll("user_101", "user@yourcompany.com", "Ahmet Yılmaz");
    String qrDataUrl = enrollRes.getQrCodeDataUrl();
    List<String> recoveryCodes = enrollRes.getRecoveryCodes();
    System.out.println("QR Data URL: " + qrDataUrl);
} catch (OtpManagerException ex) {
    System.err.println("Enroll Hatası [" + ex.getCode() + "]: " + ex.getMessage());
}`,
      validate: isEn
        ? `// 2. Full Login Flow — Verify & Validate (2FA Code Verification)
try {
    // Initial Setup Activation:
    // VerifyResponse verifyRes = otpClient.verify("user_101", "123456");

    // Login TOTP Validation:
    ValidateResponse validateRes = otpClient.validate("user_101", "123456");
    if (validateRes.isValid()) {
        System.out.println("✅ 2FA Verified, Session Granted");
    } else {
        System.out.println("❌ Invalid TOTP Code");
    }
} catch (OtpManagerException ex) {
    if ("ACCOUNT_LOCKED".equals(ex.getCode())) {
        System.err.println("⚠️ Account Locked after 5 Failed Attempts!");
    } else {
        System.err.println("Error (" + ex.getStatusCode() + "): " + ex.getMessage());
    }
}`
        : `// 2. Tam Login Akışı — Verify & Validate (2FA Kod Doğrulama)
try {
    // İlk Kurulum Aktivasyonu:
    // VerifyResponse verifyRes = otpClient.verify("user_101", "123456");

    // Login Anında TOTP Doğrulama:
    ValidateResponse validateRes = otpClient.validate("user_101", "123456");
    if (validateRes.isValid()) {
        System.out.println("✅ 2FA Başarılı, Oturum Açıldı");
    } else {
        System.out.println("❌ Hatalı TOTP Kodu");
    }
} catch (OtpManagerException ex) {
    if ("ACCOUNT_LOCKED".equals(ex.getCode())) {
        System.err.println("⚠️ 5 Hatalı Deneme Sonrası Hesap Kilitlendi!");
    } else {
        System.err.println("Hata (" + ex.getStatusCode() + "): " + ex.getMessage());
    }
}`,
      recovery: isEn
        ? `// 3. Login with Recovery Code (Recovery)
try {
    RecoveryResponse recRes = otpClient.recovery("user_101", "ABCD-EFGH");
    if (recRes.isValid()) {
        System.out.println("✅ Recovery Code Verified. Remaining Codes: " + recRes.getRemainingRecoveryCodes());
    }
} catch (OtpManagerException ex) {
    System.err.println("Recovery error: " + ex.getMessage());
}`
        : `// 3. Kurtarma Kodu ile Giriş (Recovery)
try {
    RecoveryResponse recRes = otpClient.recovery("user_101", "ABCD-EFGH");
    if (recRes.isValid()) {
        System.out.println("✅ Kurtarma Kodu Doğrulandı. Kalan Kod: " + recRes.getRemainingRecoveryCodes());
    }
} catch (OtpManagerException ex) {
    System.err.println("Kurtarma koda hatası: " + ex.getMessage());
}`,
    },
    go: {
      name: 'Go (Golang) SDK (otp-manager-go)',
      install: 'go get github.com/otpmanager/otp-manager-go',
      configLabel: isEn ? '2. Environment Variables & Configuration' : '2. Ortam Değişkenleri & Konfigürasyon',
      configText: `export OTP_SERVICE_URL="${serviceUrl}"\nexport OTP_API_KEY="${apiKey}"\nexport OTP_API_SECRET="${apiSecret}"`,
      init: `package main

import (
    "context"
    "fmt"
    "os"
    "time"
    otpmanager "github.com/otpmanager/otp-manager-go"
)

func getClient() (*otpmanager.Client, error) {
    return otpmanager.NewClient(
        os.Getenv("OTP_SERVICE_URL"),
        os.Getenv("OTP_API_KEY"),
        os.Getenv("OTP_API_SECRET"),
    )
}`,
      enroll: isEn
        ? `// 1. Full Login Flow — Enroll (Start 2FA Setup)
ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
defer cancel()

enrollRes, err := client.Enroll(ctx, otpmanager.EnrollRequest{
    UserID: "user_101",
    Email:  "user@company.com",
    Name:   "John Doe",
})
if err != nil {
    if otpErr, ok := err.(*otpmanager.OtpManagerError); ok {
        fmt.Printf("Enroll Error [%s]: %s\n", otpErr.Code, otpErr.Message)
    }
    return
}
fmt.Println("QR Code URL:", enrollRes.QRCodeDataURL)`
        : `// 1. Tam Login Akışı — Enroll (2FA Kaydı Başlat)
ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
defer cancel()

enrollRes, err := client.Enroll(ctx, otpmanager.EnrollRequest{
    UserID: "user_101",
    Email:  "user@yourcompany.com",
    Name:   "Ahmet Yılmaz",
})
if err != nil {
    if otpErr, ok := err.(*otpmanager.OtpManagerError); ok {
        fmt.Printf("Enroll Hatası [%s]: %s\n", otpErr.Code, otpErr.Message)
    }
    return
}
fmt.Println("QR Code URL:", enrollRes.QRCodeDataURL)`,
      validate: isEn
        ? `// 2. Full Login Flow — Verify & Validate (2FA Code Verification)
ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
defer cancel()

valRes, err := client.Validate(ctx, "user_101", "123456")
if err != nil {
    if otpErr, ok := err.(*otpmanager.OtpManagerError); ok {
        if otpErr.Code == "ACCOUNT_LOCKED" {
            fmt.Println("⚠️ Account Locked! Please wait.")
            return
        }
        fmt.Printf("Error (HTTP %d): %s\n", otpErr.StatusCode, otpErr.Message)
    }
    return
}

if valRes.Valid {
    fmt.Println("✅ 2FA Verification Successful")
}`
        : `// 2. Tam Login Akışı — Verify & Validate (2FA Kod Doğrulama)
ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
defer cancel()

valRes, err := client.Validate(ctx, "user_101", "123456")
if err != nil {
    if otpErr, ok := err.(*otpmanager.OtpManagerError); ok {
        if otpErr.Code == "ACCOUNT_LOCKED" {
            fmt.Println("⚠️ Hesap Kilitlendi! Lütfen bekleyin.")
            return
        }
        fmt.Printf("Hata (HTTP %d): %s\n", otpErr.StatusCode, otpErr.Message)
    }
    return
}

if valRes.Valid {
    fmt.Println("✅ 2FA Doğrulama Başarılı")
}`,
      recovery: isEn
        ? `// 3. Login with Recovery Code (Recovery)
ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
defer cancel()

recRes, err := client.Recovery(ctx, "user_101", "ABCD-EFGH")
if err != nil {
    fmt.Println("Recovery code error:", err)
    return
}

if recRes.Valid {
    fmt.Printf("✅ Recovery Successful. Remaining Codes: %d\n", recRes.RemainingRecoveryCodes)
}`
        : `// 3. Kurtarma Kodu ile Giriş (Recovery)
ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
defer cancel()

recRes, err := client.Recovery(ctx, "user_101", "ABCD-EFGH")
if err != nil {
    fmt.Println("Kurtarma koda hatası:", err)
    return
}

if recRes.Valid {
    fmt.Printf("✅ Kurtarma Başarılı. Kalan Kod Sayısı: %d\n", recRes.RemainingRecoveryCodes)
}`,
    },
  };
}

const SdkGuide = ({ app }) => {
  const { t, i18n } = useTranslation();
  const [activeLang, setActiveLang] = useState('nodejs'); // 'nodejs' | 'python' | 'php' | 'dotnet' | 'java' | 'go'

  if (!app) return null;

  const serviceUrl = window.location.origin.replace('5173', '3500');
  const apiKey = app.apiKey || 'otp_demo_key';
  const rawSecret = app.apiSecret;
  const hasSecret = rawSecret && rawSecret !== 'undefined' && rawSecret !== 'null';
  const apiSecret = hasSecret ? rawSecret : 'OTP_API_SECRET_BURAYA';
  const isEn = i18n.language === 'en';

  const snippets = getSnippets(isEn, serviceUrl, apiKey, apiSecret);
  const current = snippets[activeLang];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Üst Bilgilendirme Kartı */}
      <div className="card" style={{ borderTop: '4px solid #3182CE' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
          <Package size={20} color="#3182CE" />
          <div>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>
              {t('sdkGuide.title')}
            </h3>
            <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
              {t('sdkGuide.subtitle')}
            </span>
          </div>
        </div>

        {/* Altı Dil Seçim Sekmeleri */}
        <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.75rem', marginTop: '1rem', flexWrap: 'wrap' }}>
          {[
            { id: 'nodejs', label: 'Node.js / TypeScript', icon: Code },
            { id: 'python', label: 'Python (Sync/Async)', icon: Cpu },
            { id: 'php', label: 'PHP / Laravel', icon: Terminal },
            { id: 'dotnet', label: '.NET / C#', icon: Binary },
            { id: 'java', label: ' Java / Spring Boot', icon: Coffee },
            { id: 'go', label: ' Go (Golang)', icon: Box },
          ].map((l) => {
            const Icon = l.icon;
            const active = activeLang === l.id;
            return (
              <button
                key={l.id}
                type="button"
                onClick={() => setActiveLang(l.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.375rem',
                  padding: '0.5rem 0.875rem', borderRadius: '4px',
                  border: active ? '1px solid #3182CE' : '1px solid #E2E8F0',
                  background: active ? '#EBF8FF' : 'white',
                  color: active ? '#2B6CB0' : '#4A5568',
                  fontWeight: active ? 800 : 600, fontSize: '0.8125rem',
                  cursor: 'pointer', transition: 'all 0.15s ease',
                }}
              >
                <Icon size={16} />
                {l.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 1. PAKET KURULUMU */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.625rem' }}>
          <h4 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 800, color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <Package size={16} color="#3182CE" /> {t('sdkGuide.installTitle')}
          </h4>
          <CopyButton text={current.install} label={t('common.copy')} />
        </div>
        <pre style={{
          margin: 0, padding: '0.75rem', background: '#1E293B', color: '#38BDF8',
          borderRadius: '4px', fontSize: '0.8125rem', fontFamily: 'var(--font-mono)',
          overflowX: 'auto',
        }}>
          {current.install}
        </pre>
      </div>

      {/* 2. YAPILANDIRMA (.env / application.yml / appsettings.json) */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.625rem' }}>
          <h4 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 800, color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <Terminal size={16} color="#D97706" /> {current.configLabel}
          </h4>
          <CopyButton text={current.configText} label={t('common.copy')} />
        </div>
        <pre style={{
          margin: 0, padding: '0.75rem', background: '#1E293B', color: '#FBBF24',
          borderRadius: '4px', fontSize: '0.8125rem', fontFamily: 'var(--font-mono)',
          overflowX: 'auto',
        }}>
          {current.configText}
        </pre>
      </div>

      {/* 3. İSTEMCİ BAŞLATMA */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.625rem' }}>
          <h4 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 800, color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <Code size={16} color="#8B5CF6" /> {t('sdkGuide.initTitle')}
          </h4>
          <CopyButton text={current.init} label={t('common.copy')} />
        </div>
        <pre style={{
          margin: 0, padding: '0.875rem', background: '#1E293B', color: '#E2E8F0',
          borderRadius: '4px', fontSize: '0.8125rem', fontFamily: 'var(--font-mono)',
          overflowX: 'auto', lineHeight: 1.5,
        }}>
          {current.init}
        </pre>
      </div>

      {/* 4. METOD ÖRNEKLERİ (ENROLL, VALIDATE, RECOVERY) */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <h4 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 800, color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
          <ShieldCheck size={16} color="#10B981" /> {t('sdkGuide.examplesTitle')}
        </h4>

        {/* Enroll */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#3182CE', textTransform: 'uppercase' }}>
              {t('sdkGuide.enrollSub')}
            </span>
            <CopyButton text={current.enroll} label={t('common.copy')} />
          </div>
          <pre style={{
            margin: 0, padding: '0.75rem', background: '#1E293B', color: '#60A5FA',
            borderRadius: '4px', fontSize: '0.8125rem', fontFamily: 'var(--font-mono)',
            overflowX: 'auto', lineHeight: 1.5,
          }}>
            {current.enroll}
          </pre>
        </div>

        {/* Validate */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#10B981', textTransform: 'uppercase' }}>
              {t('sdkGuide.validateSub')}
            </span>
            <CopyButton text={current.validate} label={t('common.copy')} />
          </div>
          <pre style={{
            margin: 0, padding: '0.75rem', background: '#1E293B', color: '#34D399',
            borderRadius: '4px', fontSize: '0.8125rem', fontFamily: 'var(--font-mono)',
            overflowX: 'auto', lineHeight: 1.5,
          }}>
            {current.validate}
          </pre>
        </div>

        {/* Recovery */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#D97706', textTransform: 'uppercase' }}>
              {t('sdkGuide.recoverySub')}
            </span>
            <CopyButton text={current.recovery} label={t('common.copy')} />
          </div>
          <pre style={{
            margin: 0, padding: '0.75rem', background: '#1E293B', color: '#FBBF24',
            borderRadius: '4px', fontSize: '0.8125rem', fontFamily: 'var(--font-mono)',
            overflowX: 'auto', lineHeight: 1.5,
          }}>
            {current.recovery}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default SdkGuide;
