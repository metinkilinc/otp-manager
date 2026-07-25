# Installation Guide — OTP Manager

## System Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| Node.js | 18.x | 20.x LTS |
| PostgreSQL | 14 | 15 or 16 |
| RAM | 512 MB | 2 GB |
| OS | Linux, macOS, Windows | Ubuntu 22.04 LTS |

---

## 1. PostgreSQL Setup

### Ubuntu / Debian

```bash
sudo apt update
sudo apt install postgresql postgresql-contrib -y
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
sudo -u postgres psql
```

```sql
CREATE DATABASE otp_manager;
CREATE USER otp_user WITH ENCRYPTED PASSWORD 'your_strong_password';
GRANT ALL PRIVILEGES ON DATABASE otp_manager TO otp_user;
\q
```

### macOS (via Homebrew)

```bash
brew install postgresql@16
brew services start postgresql@16
createdb otp_manager
```

### Windows

Download and install from [https://www.postgresql.org/download/windows/](https://www.postgresql.org/download/windows/)

---

## 2. Clone the Repository

```bash
git clone https://github.com/yourusername/otp-manager.git
cd otp-manager
```

---

## 3. Backend Setup

### 3.1 Install Dependencies

```bash
cd backend
npm install
```

### 3.2 Generate Secret Keys

Run these commands to generate secure random keys:

```bash
# JWT Secret (run for each secret: JWT_SECRET, JWT_REFRESH_SECRET, JWT_TEMP_SECRET)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# AES-256-GCM Encryption Key (64 hex chars = 32 bytes)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3.3 Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your values:

```env
# Database
DATABASE_URL="postgresql://otp_user:your_strong_password@localhost:5432/otp_manager"

# JWT Secrets (generate with command above)
JWT_SECRET="your_generated_hex_string"
JWT_EXPIRES_IN="4h"
JWT_REFRESH_SECRET="another_generated_hex_string"
JWT_REFRESH_EXPIRES_IN="7d"
JWT_TEMP_SECRET="another_generated_hex_string"

# AES-256-GCM Encryption Key
ENCRYPTION_KEY="your_64_char_hex_string"

# Server
PORT=3500
NODE_ENV=production
CORS_ORIGIN="http://localhost:5173"

# IP Whitelist
IP_WHITELIST_ENABLED=false

# First Admin
SEED_ADMIN_EMAIL="admin@yourcompany.com"
SEED_ADMIN_PASSWORD="ChangeThisPassword123!"
SEED_ADMIN_NAME="Admin"
```

### 3.4 Run Database Migrations

```bash
# Option A: Prisma (recommended)
npx prisma migrate deploy
npx prisma db seed

# Option B: Direct SQL
psql -U otp_user -d otp_manager -f ../database/schema.sql
```

### 3.5 Start Backend

```bash
# Development
npm run dev

# Production
npm start
```

The backend will be available at `http://localhost:3500`.

---

## 4. Frontend Setup

### 4.1 Install Dependencies

```bash
cd frontend
npm install
```

### 4.2 Build for Production

```bash
npm run build
```

This generates the `dist/` directory.

### 4.3 Configure nginx (Production)

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend (React SPA)
    location / {
        root /var/www/otp-manager/frontend/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # Backend API proxy
    location /api/ {
        proxy_pass http://localhost:3500;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }
}
```

For development, run the Vite dev server:

```bash
npm run dev
# Opens at http://localhost:5173
```

---

## 5. Production Deployment with PM2

### 5.1 Install PM2

```bash
npm install -g pm2
```

### 5.2 Start Backend with PM2

```bash
cd backend
pm2 start src/index.js --name otp-manager-backend
pm2 startup
pm2 save
```

### 5.3 PM2 Management Commands

```bash
pm2 status              # Check status
pm2 logs otp-manager-backend    # View logs
pm2 restart otp-manager-backend # Restart
pm2 stop otp-manager-backend    # Stop
```

---

## 6. First Login and 2FA Setup

1. Open `http://localhost:5173` (or your domain)
2. Login with the admin credentials you set in `.env`
3. On first login, you will be prompted to set up 2FA:
   - Download **Google Authenticator** (Android / iOS)
   - Scan the QR code shown on screen
   - Save the recovery codes in a safe place
   - Enter the 6-digit code to activate
4. You are now logged in to the admin panel

---

## 7. Troubleshooting

### Database connection failed

```
Error: Can't reach database server
```

**Solution:** Check that PostgreSQL is running and `DATABASE_URL` in `.env` is correct.

```bash
sudo systemctl status postgresql
```

### JWT verification failed

```
Error: invalid signature
```

**Solution:** Make sure `JWT_SECRET` in `.env` has not changed since users logged in. Any change invalidates all existing tokens.

### TOTP code rejected

```
Error: INVALID_TOTP_CODE
```

**Solution:** Check that server time is synchronized. TOTP requires clock accuracy within ±30 seconds.

```bash
# Sync time (Linux)
sudo timedatectl set-ntp true
```

### Port already in use

```
Error: EADDRINUSE: address already in use :::3500
```

**Solution:** Change `PORT` in `.env` or kill the existing process:

```bash
# Linux/macOS
lsof -i :3500
kill -9 <PID>

# Windows PowerShell
netstat -ano | findstr :3500
taskkill /PID <PID> /F
```

### Prisma migration errors

```
Error: P3009 migrate found failed migrations
```

**Solution:**

```bash
npx prisma migrate resolve --rolled-back <migration_name>
npx prisma migrate deploy
```

---

## 8. Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | ✅ | — | PostgreSQL connection string |
| `JWT_SECRET` | ✅ | — | JWT access token signing key |
| `JWT_EXPIRES_IN` | ✅ | `4h` | Access token expiry |
| `JWT_REFRESH_SECRET` | ✅ | — | Refresh token signing key |
| `JWT_REFRESH_EXPIRES_IN` | ✅ | `7d` | Refresh token expiry |
| `JWT_TEMP_SECRET` | ✅ | — | Temporary 2FA flow token key |
| `ENCRYPTION_KEY` | ✅ | — | AES-256-GCM key for TOTP secrets |
| `PORT` | — | `3500` | Backend server port |
| `NODE_ENV` | — | `development` | Environment mode |
| `CORS_ORIGIN` | — | `*` | Allowed CORS origin |
| `IP_WHITELIST_ENABLED` | — | `false` | Enable IP whitelist enforcement |
| `SEED_ADMIN_EMAIL` | — | — | First admin email (for seed) |
| `SEED_ADMIN_PASSWORD` | — | — | First admin password (for seed) |
| `SEED_ADMIN_NAME` | — | — | First admin display name (for seed) |
