-- OTP Manager — Database Schema
-- PostgreSQL 14+
--
-- Usage:
--   createdb otp_manager
--   psql -U postgres -d otp_manager -f schema.sql
--
-- Or use Prisma migrations (recommended):
--   npx prisma migrate deploy

-- Generated: 2026-07-25

-- ============================================================
-- Migration 1: Initial Schema (20260724221000_init)
-- ============================================================

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'USER');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('ENROLL_START', 'ENROLL_VERIFY', 'TOTP_VERIFY_SUCCESS', 'TOTP_VERIFY_FAIL', 'TOTP_ENABLE', 'TOTP_DISABLE', 'TOTP_RESET', 'RECOVERY_USED', 'ACCOUNT_LOCKED', 'APP_CREATED', 'APP_UPDATED', 'APP_DELETED', 'ADMIN_LOGIN', 'ADMIN_CREATED', 'ADMIN_UPDATED');

-- CreateTable
CREATE TABLE "AdminUser" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "totpSecret" TEXT,
    "totpEnabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Application" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "apiKey" TEXT NOT NULL,
    "apiSecret" TEXT NOT NULL,
    "domain" TEXT,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "force2FA" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Application_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppAccess" (
    "id" TEXT NOT NULL,
    "adminUserId" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,

    CONSTRAINT "AppAccess_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Enrollment" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "externalUserId" TEXT NOT NULL,
    "externalEmail" TEXT,
    "externalName" TEXT,
    "totpSecret" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "recoveryCodes" TEXT[],
    "failedAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Enrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "action" "AuditAction" NOT NULL,
    "applicationId" TEXT,
    "adminUserId" TEXT,
    "externalUserId" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_email_key" ON "AdminUser"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Application_slug_key" ON "Application"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Application_apiKey_key" ON "Application"("apiKey");

-- CreateIndex
CREATE UNIQUE INDEX "AppAccess_adminUserId_applicationId_key" ON "AppAccess"("adminUserId", "applicationId");

-- CreateIndex
CREATE INDEX "Enrollment_applicationId_idx" ON "Enrollment"("applicationId");

-- CreateIndex
CREATE INDEX "Enrollment_externalEmail_idx" ON "Enrollment"("externalEmail");

-- CreateIndex
CREATE UNIQUE INDEX "Enrollment_applicationId_externalUserId_key" ON "Enrollment"("applicationId", "externalUserId");

-- CreateIndex
CREATE INDEX "AuditLog_applicationId_idx" ON "AuditLog"("applicationId");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- AddForeignKey
ALTER TABLE "AppAccess" ADD CONSTRAINT "AppAccess_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "AdminUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppAccess" ADD CONSTRAINT "AppAccess_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ============================================================
-- Migration 2: Add allowedIps (20260725134700_add_allowed_ips)
-- ============================================================

-- AlterTable: Add allowedIps field to Application model
ALTER TABLE "Application" ADD COLUMN "allowedIps" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

-- ============================================================
-- Migration 3: Webhook & Rate Limit (20260725140000_webhook_and_ratelimit)
-- ============================================================

-- Phase 2: Webhook fields
ALTER TABLE "Application" ADD COLUMN "webhookUrl" TEXT;
ALTER TABLE "Application" ADD COLUMN "webhookSecret" TEXT;

-- Phase 3: Rate limiting fields
ALTER TABLE "Application" ADD COLUMN "rateLimitMaxRequests" INTEGER NOT NULL DEFAULT 100;
ALTER TABLE "Application" ADD COLUMN "rateLimitWindowMs" INTEGER NOT NULL DEFAULT 60000;
