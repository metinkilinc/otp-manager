const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Audit log kaydı oluştur
 * @param {object} params
 * @param {string} params.action - AuditAction enum değeri
 * @param {string} [params.applicationId]
 * @param {string} [params.adminUserId]
 * @param {string} [params.externalUserId]
 * @param {string} [params.ipAddress]
 * @param {string} [params.userAgent]
 * @param {object} [params.metadata]
 */
async function log(params) {
  const {
    action,
    applicationId = null,
    adminUserId = null,
    externalUserId = null,
    ipAddress = null,
    userAgent = null,
    metadata = null,
  } = params;

  try {
    await prisma.auditLog.create({
      data: {
        action,
        applicationId,
        adminUserId,
        externalUserId,
        ipAddress,
        userAgent,
        metadata,
      },
    });
  } catch (err) {
    // Audit log başarısız olsa da ana işlemi engelleme
    console.error('[AuditLog] Kayıt hatası:', err.message);
  }
}

/**
 * Request objesinden IP adresini al
 */
function getIp(req) {
  return (
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.socket?.remoteAddress ||
    null
  );
}

module.exports = { log, getIp };
