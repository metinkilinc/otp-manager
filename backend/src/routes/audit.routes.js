const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');

const { success, error } = require('../utils/response');
const { auth } = require('../middleware/auth');

const prisma = new PrismaClient();

router.use(auth);

// GET /api/audit-logs?appId=xxx&action=xxx&from=xxx&to=xxx&page=1&limit=50
router.get('/', async (req, res) => {
  try {
    const { appId, action, from, to, page = '1', limit = '50' } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(200, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const where = {};

    // USER rolü sadece erişimindeki veya oluşturduğu uygulamaların loglarını görebilir
    if (req.user.role !== 'SUPER_ADMIN') {
      const [createdApps, accessList] = await Promise.all([
        prisma.application.findMany({
          where: { createdById: req.user.id },
          select: { id: true },
        }),
        prisma.appAccess.findMany({
          where: { adminUserId: req.user.id },
          select: { applicationId: true },
        }),
      ]);

      const allowedAppIds = Array.from(
        new Set([
          ...createdApps.map((a) => a.id),
          ...accessList.map((a) => a.applicationId),
        ])
      );

      if (appId && !allowedAppIds.includes(appId)) {
        return error(res, 'FORBIDDEN', 'Bu uygulamaya erişim yetkiniz yok', 403);
      }

      where.applicationId = appId || { in: allowedAppIds };
    } else if (appId) {
      where.applicationId = appId;
    }

    if (action) where.action = action;

    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to) where.createdAt.lte = new Date(to);
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          application: { select: { id: true, name: true, slug: true } },
          adminUser: { select: { id: true, name: true, email: true } },
        },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return success(res, {
      logs,
      pagination: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) },
    });
  } catch (err) {
    console.error('[GET /audit-logs]', err);
    return error(res, 'SERVER_ERROR', 'Sunucu hatası', 500);
  }
});

module.exports = router;
