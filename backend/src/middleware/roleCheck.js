const { error } = require('../utils/response');

/**
 * SUPER_ADMIN rol kontrolü
 * auth middleware'inden sonra kullanılmalı
 */
function requireSuperAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'SUPER_ADMIN') {
    return error(res, 'FORBIDDEN', 'Bu işlem için SUPER_ADMIN yetkisi gerekli', 403);
  }
  next();
}

module.exports = { requireSuperAdmin };
