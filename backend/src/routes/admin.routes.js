const express = require('express');
const router = express.Router();
const { z } = require('zod');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const { success, error } = require('../utils/response');
const { auth } = require('../middleware/auth');
const { requireSuperAdmin } = require('../middleware/roleCheck');
const audit = require('../services/audit.service');

const prisma = new PrismaClient();

// Tüm admin route'larında JWT kimlik doğrulaması gerekli
router.use(auth);

// ─── UYGULAMALAR ───

// GET /api/admin/applications (SUPER_ADMIN tümünü, USER sadece kendininkileri görür)
router.get('/applications', async (req, res) => {
  try {
    const where = req.user.role === 'SUPER_ADMIN'
      ? {}
      : {
          OR: [
            { createdById: req.user.id },
            { appAccess: { some: { adminUserId: req.user.id } } },
          ],
        };

    const applications = await prisma.application.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { enrollments: true } },
        enrollments: {
          where: { isActive: true },
          select: { id: true },
        },
      },
    });

    const data = applications.map((app) => ({
      id: app.id,
      name: app.name,
      slug: app.slug,
      apiKey: app.apiKey,
      domain: app.domain,
      description: app.description,
      isActive: app.isActive,
      force2FA: app.force2FA,
      allowedIps: app.allowedIps,
      createdById: app.createdById,
      createdAt: app.createdAt,
      updatedAt: app.updatedAt,
      totalEnrollments: app._count.enrollments,
      activeEnrollments: app.enrollments.length,
    }));

    return success(res, { applications: data });
  } catch (err) {
    console.error('[GET /applications]', err);
    return error(res, 'SERVER_ERROR', 'Sunucu hatası', 500);
  }
});

// GET /api/admin/applications/:id — apiSecret dahil tam detay (entegrasyon sayfası için)
router.get('/applications/:id', async (req, res) => {
  try {
    if (!z.string().uuid().safeParse(req.params.id).success) {
      return error(res, 'VALIDATION_ERROR', 'Geçersiz uygulama ID formatı', 400);
    }

    const app = await prisma.application.findUnique({
      where: { id: req.params.id },
      include: {
        _count: { select: { enrollments: true } },
        enrollments: { where: { isActive: true }, select: { id: true } },
      },
    });

    if (!app) {
      return error(res, 'NOT_FOUND', 'Uygulama bulunamadı', 404);
    }

    // Erişim kontrolü: SUPER_ADMIN veya erişim hakkı olan kullanıcı
    if (req.user.role !== 'SUPER_ADMIN') {
      const hasAccess =
        app.createdById === req.user.id ||
        !!(await prisma.appAccess.findUnique({
          where: { adminUserId_applicationId: { adminUserId: req.user.id, applicationId: app.id } },
        }));
      if (!hasAccess) {
        return error(res, 'FORBIDDEN', 'Bu uygulamaya erişim yetkiniz yok', 403);
      }
    }

    return success(res, {
      application: {
        id: app.id,
        name: app.name,
        slug: app.slug,
        apiKey: app.apiKey,
        apiSecret: app.apiSecret,
        domain: app.domain,
        description: app.description,
        isActive: app.isActive,
        force2FA: app.force2FA,
        allowedIps: app.allowedIps,
        webhookUrl: app.webhookUrl,
        webhookSecret: app.webhookSecret,
        rateLimitMaxRequests: app.rateLimitMaxRequests,
        rateLimitWindowMs: app.rateLimitWindowMs,
        createdById: app.createdById,
        createdAt: app.createdAt,
        updatedAt: app.updatedAt,
        totalEnrollments: app._count.enrollments,
        activeEnrollments: app.enrollments.length,
      },
    });
  } catch (err) {
    console.error('[GET /applications/:id]', err);
    return error(res, 'SERVER_ERROR', 'Sunucu hatası', 500);
  }
});


router.post('/applications', async (req, res) => {
  try {
    const schema = z.object({
      name: z.string().min(1, 'Uygulama adı zorunludur').max(100),
      slug: z.string().min(1).max(50).regex(/^[a-z0-9-_]+$/, 'Slug sadece küçük harf, rakam, tire ve alt çizgi içerebilir'),
      domain: z.string().max(255).optional(),
      description: z.string().max(500).optional(),
      force2FA: z.boolean().optional().default(false),
    });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return error(res, 'VALIDATION_ERROR', parsed.error.errors[0].message, 400);
    }

    const { name, slug, domain, description, force2FA } = parsed.data;

    // Slug unique kontrolü
    const existing = await prisma.application.findUnique({ where: { slug } });
    if (existing) {
      return error(res, 'VALIDATION_ERROR', 'Bu slug zaten kullanılıyor', 400);
    }

    const apiKey = `otp_${crypto.randomBytes(24).toString('hex')}`;
    const apiSecret = `secret_${crypto.randomBytes(32).toString('hex')}`;

    const app = await prisma.application.create({
      data: {
        name,
        slug,
        apiKey,
        apiSecret,
        domain,
        description,
        force2FA,
        createdById: req.user.id,
      },
    });

    await audit.log({
      action: 'APP_CREATED',
      adminUserId: req.user.id,
      applicationId: app.id,
      ipAddress: audit.getIp(req),
      metadata: { name, slug },
    });

    return success(res, { application: app }, 201);
  } catch (err) {
    console.error('[POST /applications]', err);
    return error(res, 'SERVER_ERROR', 'Sunucu hatası', 500);
  }
});

// PUT /api/admin/applications/:id (SUPER_ADMIN veya Oluşturan Kullanıcı)
router.put('/applications/:id', async (req, res) => {
  try {
    const schema = z.object({
      name: z.string().min(1).max(100).optional(),
      domain: z.string().max(255).optional().nullable(),
      description: z.string().max(500).optional().nullable(),
      isActive: z.boolean().optional(),
      force2FA: z.boolean().optional(),
      allowedIps: z.array(z.string().max(50)).optional(),
      webhookUrl: z.string().url().max(500).optional().nullable(),
      webhookSecret: z.string().max(200).optional().nullable(),
      rateLimitMaxRequests: z.number().int().min(1).max(10000).optional(),
      rateLimitWindowMs: z.number().int().min(1000).max(3600000).optional(),
    });

    if (!z.string().uuid().safeParse(req.params.id).success) {
      return error(res, 'VALIDATION_ERROR', 'Geçersiz uygulama ID formatı', 400);
    }

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return error(res, 'VALIDATION_ERROR', parsed.error.errors[0].message, 400);
    }

    const app = await prisma.application.findUnique({ where: { id: req.params.id } });
    if (!app) {
      return error(res, 'NOT_FOUND', 'Uygulama bulunamadı', 404);
    }

    // Yalnızca SUPER_ADMIN veya uygulamayı oluşturan kullanıcı güncelleyebilir
    if (req.user.role !== 'SUPER_ADMIN' && app.createdById !== req.user.id) {
      return error(res, 'FORBIDDEN', 'Bu uygulamayı güncelleme yetkiniz yok', 403);
    }

    const updated = await prisma.application.update({
      where: { id: req.params.id },
      data: parsed.data,
    });

    await audit.log({
      action: 'APP_UPDATED',
      adminUserId: req.user.id,
      applicationId: app.id,
      ipAddress: audit.getIp(req),
    });

    return success(res, { application: updated });
  } catch (err) {
    console.error('[PUT /applications/:id]', err);
    return error(res, 'SERVER_ERROR', 'Sunucu hatası', 500);
  }
});

// DELETE /api/admin/applications/:id (SUPER_ADMIN veya Oluşturan Kullanıcı)
router.delete('/applications/:id', async (req, res) => {
  try {
    if (!z.string().uuid().safeParse(req.params.id).success) {
      return error(res, 'VALIDATION_ERROR', 'Geçersiz uygulama ID formatı', 400);
    }
    const app = await prisma.application.findUnique({ where: { id: req.params.id } });
    if (!app) {
      return error(res, 'NOT_FOUND', 'Uygulama bulunamadı', 404);
    }

    // Yalnızca SUPER_ADMIN veya uygulamayı oluşturan kullanıcı silebilir
    if (req.user.role !== 'SUPER_ADMIN' && app.createdById !== req.user.id) {
      return error(res, 'FORBIDDEN', 'Bu uygulamayı silme yetkiniz yok', 403);
    }

    await prisma.application.delete({ where: { id: req.params.id } });

    await audit.log({
      action: 'APP_DELETED',
      adminUserId: req.user.id,
      ipAddress: audit.getIp(req),
      metadata: { deletedAppName: app.name, deletedAppId: app.id },
    });

    return success(res, { message: 'Uygulama silindi' });
  } catch (err) {
    console.error('[DELETE /applications/:id]', err);
    return error(res, 'SERVER_ERROR', 'Sunucu hatası', 500);
  }
});

// POST /api/admin/applications/:id/regenerate-key (SUPER_ADMIN veya Oluşturan Kullanıcı)
router.post('/applications/:id/regenerate-key', async (req, res) => {
  try {
    const app = await prisma.application.findUnique({ where: { id: req.params.id } });
    if (!app) {
      return error(res, 'NOT_FOUND', 'Uygulama bulunamadı', 404);
    }

    if (req.user.role !== 'SUPER_ADMIN' && app.createdById !== req.user.id) {
      return error(res, 'FORBIDDEN', 'API anahtarlarını sıfırlama yetkiniz yok', 403);
    }

    const apiKey = `otp_${crypto.randomBytes(24).toString('hex')}`;
    const apiSecret = `secret_${crypto.randomBytes(32).toString('hex')}`;

    const updated = await prisma.application.update({
      where: { id: req.params.id },
      data: { apiKey, apiSecret },
    });

    await audit.log({
      action: 'APP_UPDATED',
      adminUserId: req.user.id,
      applicationId: app.id,
      ipAddress: audit.getIp(req),
      metadata: { action: 'API_KEY_REGENERATED' },
    });

    return success(res, { application: updated });
  } catch (err) {
    console.error('[POST /regenerate-key]', err);
    return error(res, 'SERVER_ERROR', 'Sunucu hatası', 500);
  }
});

// ─── PANEL KULLANICILARI ───

// GET /api/admin/users
router.get('/users', async (req, res) => {
  try {
    const users = await prisma.adminUser.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, email: true, name: true, role: true,
        isActive: true, totpEnabled: true, createdAt: true,
        appAccess: { include: { application: { select: { id: true, name: true, slug: true } } } },
      },
    });

    return success(res, { users });
  } catch (err) {
    console.error('[GET /users]', err);
    return error(res, 'SERVER_ERROR', 'Sunucu hatası', 500);
  }
});

// POST /api/admin/users (SUPER_ADMIN)
router.post('/users', requireSuperAdmin, async (req, res) => {
  try {
    const schema = z.object({
      email: z.string().email('Geçerli bir email giriniz').max(255),
      password: z.string()
        .min(8, 'Şifre en az 8 karakter olmalıdır')
        .regex(/[A-Z]/, 'Şifre en az 1 büyük harf içermelidir')
        .regex(/[0-9]/, 'Şifre en az 1 rakam içermelidir'),
      name: z.string().min(1, 'Ad zorunludur').max(100),
      role: z.enum(['SUPER_ADMIN', 'USER']).default('USER'),
      appAccess: z.array(z.string().uuid()).optional().default([]),
    });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return error(res, 'VALIDATION_ERROR', parsed.error.errors[0].message, 400);
    }

    const { email, password, name, role, appAccess } = parsed.data;

    const existing = await prisma.adminUser.findUnique({ where: { email } });
    if (existing) {
      return error(res, 'VALIDATION_ERROR', 'Bu email adresi zaten kayıtlı', 400);
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.adminUser.create({
      data: {
        email, password: hashedPassword, name, role,
        appAccess: {
          create: appAccess.map((applicationId) => ({ applicationId })),
        },
      },
      select: {
        id: true, email: true, name: true, role: true,
        isActive: true, totpEnabled: true, createdAt: true,
        appAccess: { include: { application: { select: { id: true, name: true } } } },
      },
    });

    await audit.log({
      action: 'ADMIN_CREATED',
      adminUserId: req.user.id,
      ipAddress: audit.getIp(req),
      metadata: { createdEmail: email, role },
    });

    return success(res, { user }, 201);
  } catch (err) {
    console.error('[POST /users]', err);
    return error(res, 'SERVER_ERROR', 'Sunucu hatası', 500);
  }
});

// PUT /api/admin/users/:id (SUPER_ADMIN)
router.put('/users/:id', requireSuperAdmin, async (req, res) => {
  try {
    if (!z.string().uuid().safeParse(req.params.id).success) {
      return error(res, 'VALIDATION_ERROR', 'Geçersiz kullanıcı ID formatı', 400);
    }

    const schema = z.object({
      name: z.string().min(1).max(100).optional(),
      role: z.enum(['SUPER_ADMIN', 'USER']).optional(),
      isActive: z.boolean().optional(),
      password: z.string()
        .min(8, 'Şifre en az 8 karakter olmalıdır')
        .regex(/[A-Z]/, 'Şifre en az 1 büyük harf içermelidir')
        .regex(/[0-9]/, 'Şifre en az 1 rakam içermelidir')
        .optional(),
      appAccess: z.array(z.string().uuid()).optional(),
    });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return error(res, 'VALIDATION_ERROR', parsed.error.errors[0].message, 400);
    }

    const user = await prisma.adminUser.findUnique({ where: { id: req.params.id } });
    if (!user) {
      return error(res, 'NOT_FOUND', 'Kullanıcı bulunamadı', 404);
    }

    const { appAccess, password, ...rest } = parsed.data;
    const updateData = { ...rest };

    if (password) {
      updateData.password = await bcrypt.hash(password, 12);
    }

    const updated = await prisma.$transaction(async (tx) => {
      if (appAccess !== undefined) {
        await tx.appAccess.deleteMany({ where: { adminUserId: req.params.id } });
        if (appAccess.length > 0) {
          await tx.appAccess.createMany({
            data: appAccess.map((applicationId) => ({
              adminUserId: req.params.id,
              applicationId,
            })),
          });
        }
      }
      return tx.adminUser.update({
        where: { id: req.params.id },
        data: updateData,
        select: {
          id: true, email: true, name: true, role: true,
          isActive: true, totpEnabled: true,
          appAccess: { include: { application: { select: { id: true, name: true } } } },
        },
      });
    });

    await audit.log({
      action: 'ADMIN_UPDATED',
      adminUserId: req.user.id,
      ipAddress: audit.getIp(req),
      metadata: { updatedUserId: req.params.id },
    });

    return success(res, { user: updated });
  } catch (err) {
    console.error('[PUT /users/:id]', err);
    return error(res, 'SERVER_ERROR', 'Sunucu hatası', 500);
  }
});

// DELETE /api/admin/users/:id (SUPER_ADMIN)
router.delete('/users/:id', requireSuperAdmin, async (req, res) => {
  try {
    if (!z.string().uuid().safeParse(req.params.id).success) {
      return error(res, 'VALIDATION_ERROR', 'Geçersiz kullanıcı ID formatı', 400);
    }
    if (req.params.id === req.user.id) {
      return error(res, 'FORBIDDEN', 'Kendi hesabınızı silemezsiniz', 403);
    }

    const user = await prisma.adminUser.findUnique({ where: { id: req.params.id } });
    if (!user) {
      return error(res, 'NOT_FOUND', 'Kullanıcı bulunamadı', 404);
    }

    await prisma.adminUser.delete({ where: { id: req.params.id } });

    return success(res, { message: 'Kullanıcı silindi' });
  } catch (err) {
    console.error('[DELETE /users/:id]', err);
    return error(res, 'SERVER_ERROR', 'Sunucu hatası', 500);
  }
});

// POST /api/admin/users/:id/unlock (SUPER_ADMIN)
router.post('/users/:id/unlock', requireSuperAdmin, async (req, res) => {
  try {
    if (!z.string().uuid().safeParse(req.params.id).success) {
      return error(res, 'VALIDATION_ERROR', 'Geçersiz kullanıcı ID formatı', 400);
    }
    const user = await prisma.adminUser.findUnique({ where: { id: req.params.id } });
    if (!user) {
      return error(res, 'NOT_FOUND', 'Kullanıcı bulunamadı', 404);
    }

    await prisma.adminUser.update({
      where: { id: req.params.id },
      data: { loginAttempts: 0, lockedUntil: null },
    });

    await audit.log({
      action: 'ADMIN_UPDATED',
      adminUserId: req.user.id,
      ipAddress: audit.getIp(req),
      metadata: { unlockedUserId: req.params.id },
    });

    return success(res, { message: 'Hesap kilitlenmesi kaldırıldı' });
  } catch (err) {
    console.error('[POST /users/:id/unlock]', err);
    return error(res, 'SERVER_ERROR', 'Sunucu hatası', 500);
  }
});

// POST /api/admin/users/:id/reset-2fa (SUPER_ADMIN)
router.post('/users/:id/reset-2fa', requireSuperAdmin, async (req, res) => {
  try {
    if (!z.string().uuid().safeParse(req.params.id).success) {
      return error(res, 'VALIDATION_ERROR', 'Geçersiz kullanıcı ID formatı', 400);
    }
    const user = await prisma.adminUser.findUnique({ where: { id: req.params.id } });
    if (!user) {
      return error(res, 'NOT_FOUND', 'Kullanıcı bulunamadı', 404);
    }

    await prisma.adminUser.update({
      where: { id: req.params.id },
      data: { totpSecret: null, totpEnabled: false },
    });

    await audit.log({
      action: 'TOTP_RESET',
      adminUserId: req.user.id,
      ipAddress: audit.getIp(req),
      metadata: { targetUserId: req.params.id },
    });

    return success(res, { message: 'Kullanıcının 2FA kaydı sıfırlandı' });
  } catch (err) {
    console.error('[POST /users/:id/reset-2fa]', err);
    return error(res, 'SERVER_ERROR', 'Sunucu hatası', 500);
  }
});

// ─── IP WHİTELİST YÖNETİMİ ───

// POST /api/admin/applications/:id/whitelist — IP adresi/CIDR ekle
router.post('/applications/:id/whitelist', async (req, res) => {
  try {
    if (!z.string().uuid().safeParse(req.params.id).success) {
      return error(res, 'VALIDATION_ERROR', 'Geçersiz uygulama ID formatı', 400);
    }

    // Gelen IP'leri parse et: virgülle ayrılmış veya dizi
    const ipSchema = z.object({
      ips: z.union([
        z.string().min(1).max(2000), // "1.2.3.4, 10.0.0.0/8"
        z.array(z.string().min(1).max(50)),
      ]),
    });

    const parsed = ipSchema.safeParse(req.body);
    if (!parsed.success) {
      return error(res, 'VALIDATION_ERROR', 'Geçersiz IP listesi formatı', 400);
    }

    let newIps;
    if (typeof parsed.data.ips === 'string') {
      newIps = parsed.data.ips.split(',').map((ip) => ip.trim()).filter(Boolean);
    } else {
      newIps = parsed.data.ips.map((ip) => ip.trim()).filter(Boolean);
    }

    // Basit format doğrulama (IPv4, IPv6, CIDR)
    const ipPattern = /^(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}(\/\d{1,2})?|[0-9a-fA-F:]+(\/\d{1,3})?)$/;
    const invalidIps = newIps.filter((ip) => !ipPattern.test(ip));
    if (invalidIps.length > 0) {
      return error(res, 'VALIDATION_ERROR', `Geçersiz IP formatı: ${invalidIps.join(', ')}`, 400);
    }

    const app = await prisma.application.findUnique({ where: { id: req.params.id } });
    if (!app) {
      return error(res, 'NOT_FOUND', 'Uygulama bulunamadı', 404);
    }

    // Yetki kontrolü
    if (req.user.role !== 'SUPER_ADMIN' && app.createdById !== req.user.id) {
      return error(res, 'FORBIDDEN', 'Bu uygulamayı güncelleme yetkiniz yok', 403);
    }

    // Mevcut liste ile birleştir, tekrar edenleri temizle
    const merged = [...new Set([...app.allowedIps, ...newIps])];

    const updated = await prisma.application.update({
      where: { id: req.params.id },
      data: { allowedIps: merged },
    });

    await audit.log({
      action: 'APP_UPDATED',
      adminUserId: req.user.id,
      applicationId: app.id,
      ipAddress: audit.getIp(req),
      metadata: { action: 'IP_WHITELIST_ADDED', addedIps: newIps },
    });

    return success(res, { allowedIps: updated.allowedIps });
  } catch (err) {
    console.error('[POST /applications/:id/whitelist]', err);
    return error(res, 'SERVER_ERROR', 'Sunucu hatası', 500);
  }
});

// DELETE /api/admin/applications/:id/whitelist — Belirli IP sil
router.delete('/applications/:id/whitelist', async (req, res) => {
  try {
    if (!z.string().uuid().safeParse(req.params.id).success) {
      return error(res, 'VALIDATION_ERROR', 'Geçersiz uygulama ID formatı', 400);
    }

    const ipSchema = z.object({
      ip: z.string().min(1).max(50),
    });

    const parsed = ipSchema.safeParse(req.body);
    if (!parsed.success) {
      return error(res, 'VALIDATION_ERROR', 'Silinecek IP adresi belirtilmeli', 400);
    }

    const app = await prisma.application.findUnique({ where: { id: req.params.id } });
    if (!app) {
      return error(res, 'NOT_FOUND', 'Uygulama bulunamadı', 404);
    }

    // Yetki kontrolü
    if (req.user.role !== 'SUPER_ADMIN' && app.createdById !== req.user.id) {
      return error(res, 'FORBIDDEN', 'Bu uygulamayı güncelleme yetkiniz yok', 403);
    }

    const filtered = app.allowedIps.filter((ip) => ip !== parsed.data.ip);

    const updated = await prisma.application.update({
      where: { id: req.params.id },
      data: { allowedIps: filtered },
    });

    await audit.log({
      action: 'APP_UPDATED',
      adminUserId: req.user.id,
      applicationId: app.id,
      ipAddress: audit.getIp(req),
      metadata: { action: 'IP_WHITELIST_REMOVED', removedIp: parsed.data.ip },
    });

    return success(res, { allowedIps: updated.allowedIps });
  } catch (err) {
    console.error('[DELETE /applications/:id/whitelist]', err);
    return error(res, 'SERVER_ERROR', 'Sunucu hatası', 500);
  }
});

module.exports = router;
