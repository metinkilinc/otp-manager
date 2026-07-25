# 🔐 OTP Manager

**Centralized TOTP/2FA Management Service**

A self-hosted, enterprise-grade two-factor authentication management platform.
Integrate Google Authenticator into all your web applications through a single central service —
no Google API required, no per-user cost, fully open-source.

## ✨ Features

- 🏢 **Multi-tenant** — Manage 2FA for multiple applications from one panel
- 🔑 **TOTP Standard** — Works with Google Authenticator, Microsoft Authenticator, Authy
- 🛡️ **Enterprise Security** — AES-256-GCM encryption, HMAC-SHA256 API auth, replay attack protection
- 📊 **Analytics Dashboard** — Real-time verification metrics and threat monitoring
- 🪝 **Webhook System** — Get notified on lockouts, enrollments, and recovery code usage
- 🌐 **IP Whitelist** — Restrict API access by IP address or CIDR range
- 📦 **6 SDK Languages** — Node.js, Python, PHP/Laravel, .NET/C#, Java/Spring Boot, Go
- 🌍 **i18n** — Turkish and English (extensible)
- 🔒 **Mandatory 2FA** — First-login 2FA setup enforcement with recovery codes

## 🏗️ Architecture

```
Your App (ERP, LMS, CRM, etc.)
        │
        │  API Key + HMAC-SHA256
        ▼
  OTP Manager (this project)
        │
        ▼
  PostgreSQL Database
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### 1. Clone the repository

```bash
git clone https://github.com/metinkilinc/otp-manager.git
cd otp-manager
```

### 2. Setup Backend

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your values
npx prisma migrate deploy
npx prisma db seed
npm start
```

### 3. Setup Frontend

```bash
cd ../frontend
npm install
npm run build
# Serve dist/ with nginx or any static server
```

### 4. Login

Open `http://localhost:5173` and login with the credentials from your `.env` file.

> First login will require 2FA setup — scan the QR code with Google Authenticator.

## 📦 SDK Installation

| Language | Package | Install |
|----------|---------|---------|
| Node.js | `@otp-manager/node-sdk` | `npm install @otp-manager/node-sdk` |
| Python | `otp-manager-python` | `pip install otp-manager-python` |
| PHP | `otp-manager/php` | `composer require otp-manager/php` |
| .NET | `OtpManager.Client` | `dotnet add package OtpManager.Client` |
| Java | `com.otpmanager:client` | Maven dependency |
| Go | `otp-manager-go` | `go get github.com/otpmanager/otp-manager-go` |

## 🔒 Security

- TOTP secrets encrypted with **AES-256-GCM** (per-secret IV)
- API authentication via **HMAC-SHA256** with replay attack protection
- **Bcrypt** password hashing (12 rounds)
- **JWT** with refresh token rotation and revocation
- **Brute force protection** (5 attempts → 15 min lockout)
- **Rate limiting** per IP and per application
- **HTTP security headers** via Helmet.js

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.
