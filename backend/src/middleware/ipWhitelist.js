const ipRangeCheck = require('ip-range-check');

/**
 * IP Whitelist Middleware
 *
 * Kullanım:
 *  - IP_WHITELIST_ENABLED=false → tüm kontrolleri atla (local dev)
 *  - IP_WHITELIST_ENABLED=true  → uygulama bazlı allowedIps kontrolü yap
 *
 * Kurallar:
 *  - application.allowedIps boş ise → herkese izin ver (henüz whitelist kurulmamış)
 *  - application.allowedIps dolu ise → gelen IP listede yoksa 403 döndür
 *  - IPv4, IPv6 ve CIDR notasyonu (192.168.1.0/24, ::1/128) desteklenir
 *  - trust proxy açık olduğu için req.ip gerçek IP'yi içerir
 */
function ipWhitelist(req, res, next) {
  const enabled = process.env.IP_WHITELIST_ENABLED === 'true';

  // Global olarak devre dışıysa (local dev vb.) doğrudan geç
  if (!enabled) {
    return next();
  }

  const application = req.application;

  // Uygulama bilgisi henüz set edilmemişse (middleware sırası hatası) geç
  if (!application) {
    return next();
  }

  const allowedIps = application.allowedIps || [];

  // allowedIps boş/tanımsızsa → uygulama sahibi whitelist kurmamış, herkese izin
  if (allowedIps.length === 0) {
    return next();
  }

  // Gerçek istemci IP'sini al (trust proxy açık → req.ip zaten düzgün)
  const clientIp = getClientIp(req);

  if (!clientIp) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'IP_FORBIDDEN',
        message: 'İstemci IP adresi belirlenemedi',
      },
    });
  }

  // CIDR ve düz IP karşılaştırması
  const isAllowed = ipRangeCheck(clientIp, allowedIps);

  if (!isAllowed) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'IP_FORBIDDEN',
        message: `Bu IP adresine (${clientIp}) izin verilmiyor. Uygulama IP whitelist'ine ekleyin.`,
      },
    });
  }

  return next();
}

/**
 * Gerçek istemci IP'sini döndürür.
 * trust proxy açık → req.ip zaten normalize edilmiş haldedir.
 * Yedek olarak X-Forwarded-For header'ına da bakar.
 */
function getClientIp(req) {
  // Express trust proxy ile req.ip en güvenilir kaynak
  if (req.ip) {
    return normalizeIp(req.ip);
  }

  // Yedek: X-Forwarded-For header (virgülle ayrılmışsa ilk = gerçek istemci)
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    const first = forwarded.split(',')[0].trim();
    return normalizeIp(first);
  }

  return null;
}

/**
 * Express bazı durumlarda IPv4-mapped IPv6 adresi döner (::ffff:192.168.1.1).
 * Bunu saf IPv4'e çevirir ki allowedIps içindeki "192.168.1.1" ile eşleşsin.
 */
function normalizeIp(ip) {
  if (!ip) return null;
  // ::ffff: prefix'ini kaldır
  const mapped = ip.replace(/^::ffff:/, '');
  return mapped;
}

module.exports = { ipWhitelist, getClientIp };
