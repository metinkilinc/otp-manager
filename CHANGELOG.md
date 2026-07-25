# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] — 2026-07-25

### Added

- Centralized TOTP/2FA management for multiple applications
- Multi-tenant architecture with role-based access control (SUPER_ADMIN, USER)
- Mandatory first-login 2FA enforcement with QR code setup
- AES-256-GCM encrypted TOTP secret storage (per-secret IV)
- HMAC-SHA256 API authentication with replay attack protection (±5 min timestamp window)
- IP Whitelist with CIDR range support per application
- Per-application rate limiting (configurable max requests per time window)
- Webhook system with retry logic for events: enrollment, lockout, recovery code usage
- Security Analytics Dashboard with real-time threat monitoring
- Audit log with full payload inspection and CSV export
- Recovery codes (8 codes per enrollment, single-use)
- Brute force protection: 5 failed attempts → 15-minute account lockout
- JWT with refresh token rotation, revocation, and 4-hour access token expiry
- SDK support:
  - Node.js / TypeScript (`sdk/`)
  - Python (`sdk-python/`)
  - PHP / Laravel (`sdk-php/`)
  - .NET / C# (`sdk-dotnet/`)
  - Java / Spring Boot (`sdk-java/`)
  - Go (`sdk-go/`)
- i18n support: English (default) and Turkish
- Responsive admin panel built with React + Vite + Tailwind CSS
- Live TOTP simulator and QR code sandbox in admin UI
- AI Integration Prompt Generator for developers
