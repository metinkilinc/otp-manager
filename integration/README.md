# OTP Manager — Integration Guide

## Overview

OTP Manager is a centralized service that lets you add **Google Authenticator-based 2FA** to your existing web applications.

**Service URL:** `https://otp.yourcompany.com` (production) / `http://localhost:3500` (development)

---

## Quick Start

### 1. Register your application in the Panel

1. Log in to the panel at `http://localhost:3500`
2. Click **Applications → New Application** to add your app
3. Copy the generated **API Key** and **API Secret**

### 2. Copy the Client File

Copy `otp-client.js` to your backend project.

### 3. Add to .env

```env
OTP_SERVICE_URL=http://localhost:3500
OTP_API_KEY=otp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
OTP_API_SECRET=secret_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 4. Integrate into Backend

```javascript
const OTPClient = require('./otp-client');
const otp = new OTPClient(
  process.env.OTP_SERVICE_URL,
  process.env.OTP_API_KEY,
  process.env.OTP_API_SECRET
);
```

---

## Usage Flows

### Flow 1: Enroll a User in 2FA

When a user wants to set up 2FA for the first time:

```javascript
// Backend endpoint
app.post('/setup-2fa', async (req, res) => {
  const { userId, email, name } = req.user; // logged-in user

  const result = await otp.enroll(userId, email, name);

  if (!result.success) {
    return res.status(400).json({ error: result.error.message });
  }

  // Send QR and recovery codes to frontend
  res.json({
    qrCodeDataUrl: result.data.qrCodeDataUrl,    // <img src={qrCodeDataUrl} />
    otpauthUrl: result.data.otpauthUrl,           // otpauth://totp/...
    recoveryCodes: result.data.recoveryCodes,     // ["A1B2C3D4", ...]
  });
});
```

### Flow 2: Verify Initial Setup

After user scans QR code, confirm the code:

```javascript
app.post('/verify-2fa-setup', async (req, res) => {
  const { userId } = req.user;
  const { code } = req.body; // Code from user's Google Authenticator

  const result = await otp.verify(userId, code);

  if (!result.success) {
    return res.status(400).json({ error: '2FA verification failed' });
  }

  // Mark user as 2FA-enabled in DB
  await User.update({ totpEnabled: true }, { where: { id: userId } });
  res.json({ success: true, message: '2FA successfully activated' });
});
```

### Flow 3: Validate 2FA on Login

```javascript
app.post('/login', async (req, res) => {
  const { email, password, totpCode } = req.body;

  // 1. Verify password
  const user = await User.findOne({ where: { email } });
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // 2. Check 2FA
  if (user.totpEnabled) {
    if (!totpCode) {
      // Notify frontend that 2FA step is required
      return res.json({ requires2FA: true });
    }

    const result = await otp.validate(user.id.toString(), totpCode);

    if (!result.success) {
      const errorMsg = result.error?.code === 'ACCOUNT_LOCKED'
        ? 'Too many failed attempts. Please wait.'
        : `Invalid code. ${result.error?.remainingAttempts || 0} attempts remaining.`;
      return res.status(401).json({ error: errorMsg });
    }
  }

  // 3. Issue JWT
  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '4h' });
  res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
});
```

### Flow 4: Login with Recovery Code

```javascript
app.post('/login-recovery', async (req, res) => {
  const { email, recoveryCode } = req.body;

  const user = await User.findOne({ where: { email } });
  if (!user) return res.status(404).json({ error: 'User not found' });

  const result = await otp.recovery(user.id.toString(), recoveryCode);

  if (!result.success) {
    return res.status(400).json({ error: 'Invalid recovery code' });
  }

  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET);
  res.json({ token, remainingCodes: result.data.remainingRecoveryCodes });
});
```

---

## API Reference

### Request Format

All requests must include these headers:

| Header | Value |
|--------|-------|
| `Content-Type` | `application/json` |
| `X-API-Key` | API Key from panel |
| `X-Signature` | `HMAC-SHA256(JSON.stringify(body) + timestamp, apiSecret)` |
| `X-Timestamp` | Unix timestamp (seconds) |

### Response Format

**Success:**
```json
{ "success": true, "data": { ... } }
```

**Error:**
```json
{ "success": false, "error": { "code": "ERROR_CODE", "message": "Error description" } }
```

### Error Codes

| Code | HTTP | Description |
|------|------|-------------|
| `INVALID_API_KEY` | 401 | API key is invalid or application is disabled |
| `INVALID_SIGNATURE` | 401 | HMAC signature mismatch |
| `TIMESTAMP_EXPIRED` | 401 | Request timestamp is outside ±5 minute window |
| `INVALID_TOTP_CODE` | 400 | 6-digit code is incorrect |
| `ENROLLMENT_NOT_FOUND` | 404 | User has no 2FA enrollment |
| `ALREADY_ENROLLED` | 409 | User is already enrolled |
| `ACCOUNT_LOCKED` | 423 | Locked for 15 minutes after 5 failed attempts |
| `RATE_LIMITED` | 429 | Request limit exceeded |

---

## Frontend Integration (React)

### Login Form — 2FA Step

```jsx
const [step, setStep] = useState('credentials'); // 'credentials' | '2fa'
const [requires2FA, setRequires2FA] = useState(false);

const handleLogin = async (email, password) => {
  const res = await fetch('/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
    headers: { 'Content-Type': 'application/json' },
  });
  const data = await res.json();

  if (data.requires2FA) {
    setStep('2fa');
    return;
  }

  // Save token
  localStorage.setItem('token', data.token);
};

const handleOTP = async (code) => {
  const res = await fetch('/login', {
    method: 'POST',
    body: JSON.stringify({ email, password, totpCode: code }),
    headers: { 'Content-Type': 'application/json' },
  });
  // ...
};
```

---

## Integration Checklist

For each application integration:

- [ ] Register application in OTP Manager panel → get API key + secret
- [ ] Copy `otp-client.js` to backend
- [ ] Add `OTP_SERVICE_URL`, `OTP_API_KEY`, `OTP_API_SECRET` to `.env`
- [ ] Add 2FA check to login route (`getStatus` → `requires2FA` → `validate`)
- [ ] Add OTP input step to login frontend
- [ ] Add 2FA setup component to profile page (optional)
- [ ] **Test:** Enable 2FA → Scan QR → Verify → Login → Enter code → Success
- [ ] **Test:** Wrong code → Error message → Remaining attempts count
- [ ] **Test:** 5 wrong codes → Account lockout message
- [ ] **Test:** Disable 2FA → Login → No code prompted
- [ ] **Test:** Login with recovery code
