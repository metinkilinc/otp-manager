require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const app = express();

// ─── Trust Proxy (Nginx/Load Balancer arkasında gerçek IP için) ───
app.set('trust proxy', 1);

// ─── Helmet (HTTP Güvenlik Header'ları) ───
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc:  ["'self'"],
      styleSrc:   ["'self'", "'unsafe-inline'"],
      imgSrc:     ["'self'", "data:"],
      connectSrc: ["'self'"],
      fontSrc:    ["'self'"],
      objectSrc:  ["'none'"],
      frameSrc:   ["'none'"],
    },
  },
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
  xContentTypeOptions: true,
  xFrameOptions: { action: 'deny' },
  xXssProtection: false, // Modern tarayıcılarda XSS Auditor kaldırıldı
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
}));

// ─── CORS ───
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));

// ─── Body Parser ───
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Routes ───
app.use('/api/auth',         require('./routes/auth.routes'));
app.use('/api/admin',        require('./routes/admin.routes'));
app.use('/api/enrollments',  require('./routes/enrollment.routes'));
app.use('/api/v1/totp',      require('./routes/totp.routes'));
app.use('/api/audit-logs',   require('./routes/audit.routes'));
app.use('/api/analytics',    require('./routes/analytics.routes'));

// ─── Health Check ───
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── 404 Handler ───
app.use((req, res) => {
  res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Endpoint bulunamadı' } });
});

// ─── Global Error Handler ───
app.use((err, req, res, next) => {
  const isDev = process.env.NODE_ENV === 'development';

  // Prisma hatalarını maskele (P ile başlayan kodlar)
  if (err.code && typeof err.code === 'string' && err.code.startsWith('P')) {
    console.error('[DB_ERROR]', { message: err.message, path: req.path });
    return res.status(500).json({
      success: false,
      error: { code: 'DATABASE_ERROR', message: 'Veritabanı hatası' },
    });
  }

  console.error('[ERROR]', {
    message: err.message,
    stack: isDev ? err.stack : undefined,
    path: req.path,
    method: req.method,
  });

  return res.status(err.status || 500).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message: isDev ? err.message : 'Sunucu hatası',
    },
  });
});

// ─── Unhandled Promise Rejection ───
process.on('unhandledRejection', (reason) => {
  console.error('[UNHANDLED_REJECTION]', reason);
});

process.on('uncaughtException', (err) => {
  console.error('[UNCAUGHT_EXCEPTION]', err.message);
  process.exit(1);
});

const PORT = process.env.PORT || 3500;
app.listen(PORT, () => {
  console.log(`✅ OTP Manager backend: http://localhost:${PORT}`);
  console.log(`   Ortam: ${process.env.NODE_ENV || 'development'}`);
});
