const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { auth } = require('../middleware/auth');
const { success, error } = require('../utils/response');

const prisma = new PrismaClient();

// Tüm analytics route'larında JWT kimlik doğrulaması gerekli
router.use(auth);

// ─── GET /api/analytics/overview ───
// Toplam uygulama, aktif kullanıcı, bugünkü doğrulama ve başarısız deneme
router.get('/overview', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    // Kullanıcı rolüne göre uygulama filtresi
    const appWhere = req.user.role === 'SUPER_ADMIN'
      ? {}
      : {
          OR: [
            { createdById: req.user.id },
            { appAccess: { some: { adminUserId: req.user.id } } },
          ],
        };

    const [
      totalApps,
      activeApps,
      totalEnrollments,
      activeEnrollments,
      todaySuccess,
      todayFail,
      lockedCount,
    ] = await Promise.all([
      prisma.application.count({ where: appWhere }),
      prisma.application.count({ where: { ...appWhere, isActive: true } }),
      prisma.enrollment.count(),
      prisma.enrollment.count({ where: { isActive: true } }),
      prisma.auditLog.count({
        where: { action: 'TOTP_VERIFY_SUCCESS', createdAt: { gte: today, lt: tomorrow } },
      }),
      prisma.auditLog.count({
        where: { action: 'TOTP_VERIFY_FAIL', createdAt: { gte: today, lt: tomorrow } },
      }),
      prisma.enrollment.count({
        where: { lockedUntil: { gt: new Date() } },
      }),
    ]);

    const totalToday = todaySuccess + todayFail;
    const successRate = totalToday > 0 ? Math.round((todaySuccess / totalToday) * 100) : null;

    return success(res, {
      totalApps,
      activeApps,
      totalEnrollments,
      activeEnrollments,
      todaySuccess,
      todayFail,
      lockedCount,
      successRate,
    });
  } catch (err) {
    console.error('[GET /analytics/overview]', err);
    return error(res, 'SERVER_ERROR', 'Sunucu hatası', 500);
  }
});

// ─── GET /api/analytics/traffic?appId=xxx&period=7d ───
// Günlük başarılı vs başarısız istek sayıları
router.get('/traffic', async (req, res) => {
  try {
    const { appId, period = '7d' } = req.query;
    const days = period === '30d' ? 30 : period === '14d' ? 14 : 7;

    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - (days - 1));
    dateFrom.setHours(0, 0, 0, 0);

    const where = {
      action: { in: ['TOTP_VERIFY_SUCCESS', 'TOTP_VERIFY_FAIL', 'ENROLL_VERIFY'] },
      createdAt: { gte: dateFrom },
    };
    if (appId) where.applicationId = appId;

    const logs = await prisma.auditLog.findMany({
      where,
      select: { action: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    // Günlük gruplama
    const dayLabels = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
    const result = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(dateFrom);
      d.setDate(dateFrom.getDate() + i);
      const dateStr = d.toISOString().slice(0, 10);
      const label = `${d.getDate()}/${d.getMonth() + 1}`;

      const dayLogs = logs.filter((l) => l.createdAt.toISOString().slice(0, 10) === dateStr);
      const basarili = dayLogs.filter((l) => l.action === 'TOTP_VERIFY_SUCCESS' || l.action === 'ENROLL_VERIFY').length;
      const basarisiz = dayLogs.filter((l) => l.action === 'TOTP_VERIFY_FAIL').length;

      result.push({ date: dateStr, label, basarili, basarisiz, toplam: basarili + basarisiz });
    }

    return success(res, { traffic: result, period, days });
  } catch (err) {
    console.error('[GET /analytics/traffic]', err);
    return error(res, 'SERVER_ERROR', 'Sunucu hatası', 500);
  }
});

// ─── GET /api/analytics/top-apps ───
// En çok doğrulama yapılan 5 uygulama
router.get('/top-apps', async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Her uygulama için son 30 günlük başarılı doğrulama sayısı
    const logs = await prisma.auditLog.groupBy({
      by: ['applicationId'],
      where: {
        action: 'TOTP_VERIFY_SUCCESS',
        createdAt: { gte: thirtyDaysAgo },
        applicationId: { not: null },
      },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 5,
    });

    // Uygulama adlarını çek
    const appIds = logs.map((l) => l.applicationId).filter(Boolean);
    const apps = await prisma.application.findMany({
      where: { id: { in: appIds } },
      select: { id: true, name: true, slug: true },
    });

    const appMap = Object.fromEntries(apps.map((a) => [a.id, a]));

    const topApps = logs.map((l) => ({
      applicationId: l.applicationId,
      name: appMap[l.applicationId]?.name || 'Bilinmiyor',
      slug: appMap[l.applicationId]?.slug || '',
      count: l._count.id,
    }));

    return success(res, { topApps });
  } catch (err) {
    console.error('[GET /analytics/top-apps]', err);
    return error(res, 'SERVER_ERROR', 'Sunucu hatası', 500);
  }
});

// ─── GET /api/analytics/threats ───
// Son 24 saatte kilitlenen hesaplar ve şüpheli IP'ler
router.get('/threats', async (req, res) => {
  try {
    const oneDayAgo = new Date();
    oneDayAgo.setHours(oneDayAgo.getHours() - 24);

    const [lockedAccounts, suspiciousIps] = await Promise.all([
      // Kilitli hesaplar
      prisma.auditLog.findMany({
        where: { action: 'ACCOUNT_LOCKED', createdAt: { gte: oneDayAgo } },
        orderBy: { createdAt: 'desc' },
        take: 20,
        include: {
          application: { select: { name: true, slug: true } },
        },
      }),
      // Aynı IP'den çok fazla başarısız deneme (5+)
      prisma.auditLog.groupBy({
        by: ['ipAddress'],
        where: {
          action: 'TOTP_VERIFY_FAIL',
          createdAt: { gte: oneDayAgo },
          ipAddress: { not: null },
        },
        _count: { id: true },
        having: { id: { _count: { gt: 4 } } },
        orderBy: { _count: { id: 'desc' } },
        take: 10,
      }),
    ]);

    return success(res, {
      lockedAccounts: lockedAccounts.map((l) => ({
        id: l.id,
        externalUserId: l.externalUserId,
        applicationName: l.application?.name || 'Bilinmiyor',
        ipAddress: l.ipAddress,
        lockedAt: l.createdAt.toISOString(),
      })),
      suspiciousIps: suspiciousIps.map((s) => ({
        ipAddress: s.ipAddress,
        failCount: s._count.id,
      })),
    });
  } catch (err) {
    console.error('[GET /analytics/threats]', err);
    return error(res, 'SERVER_ERROR', 'Sunucu hatası', 500);
  }
});

// ─── GET /api/analytics/export?appId=xxx&format=csv ───
// Audit log CSV dışa aktarma
router.get('/export', async (req, res) => {
  try {
    const { appId, format = 'csv' } = req.query;

    const where = {};
    if (appId) where.applicationId = appId;

    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 5000,
      include: {
        application: { select: { name: true, slug: true } },
      },
    });

    if (format === 'csv') {
      const header = 'id,action,application,externalUserId,ipAddress,createdAt\n';
      const rows = logs.map((l) =>
        [
          l.id,
          l.action,
          `"${(l.application?.name || '').replace(/"/g, '""')}"`,
          l.externalUserId || '',
          l.ipAddress || '',
          l.createdAt.toISOString(),
        ].join(',')
      ).join('\n');

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="audit-logs-${Date.now()}.csv"`);
      return res.send('\uFEFF' + header + rows); // BOM ile UTF-8
    }

    return success(res, { logs });
  } catch (err) {
    console.error('[GET /analytics/export]', err);
    return error(res, 'SERVER_ERROR', 'Sunucu hatası', 500);
  }
});

module.exports = router;
