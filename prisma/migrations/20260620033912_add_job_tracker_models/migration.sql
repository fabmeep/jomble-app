-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('APPLIED', 'SCREENING', 'INTERVIEW', 'OFFER', 'ACCEPTED', 'REJECTED', 'WITHDRAWN', 'GHOSTED');

-- CreateEnum
CREATE TYPE "WorkMode" AS ENUM ('REMOTE', 'HYBRID', 'ON_SITE');

-- CreateEnum
CREATE TYPE "JobSource" AS ENUM ('LINKEDIN', 'DEALLS', 'KALIBRR', 'INDEED', 'GLASSDOOR', 'COMPANY_WEBSITE', 'REFERRAL', 'RECRUITER', 'JOB_FAIR', 'GITHUB_JOBS', 'OTHER');

-- CreateEnum
CREATE TYPE "TimelineEventType" AS ENUM ('STATUS_CHANGE', 'NOTE_ADDED', 'CONTACT_ADDED', 'AUTO_GHOSTED', 'MANUAL_UPDATE');

-- CreateTable
CREATE TABLE "job_applications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "jobTitle" TEXT NOT NULL,
    "location" TEXT,
    "jobUrl" TEXT,
    "source" "JobSource" NOT NULL DEFAULT 'OTHER',
    "workMode" "WorkMode" NOT NULL DEFAULT 'ON_SITE',
    "salaryMin" INTEGER,
    "salaryMax" INTEGER,
    "currency" TEXT DEFAULT 'IDR',
    "excitementScore" INTEGER,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'APPLIED',
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastActivityAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "job_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "timeline_events" (
    "id" TEXT NOT NULL,
    "jobAppId" TEXT NOT NULL,
    "eventType" "TimelineEventType" NOT NULL DEFAULT 'STATUS_CHANGE',
    "oldStatus" "ApplicationStatus",
    "newStatus" "ApplicationStatus",
    "description" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "timeline_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notes" (
    "id" TEXT NOT NULL,
    "jobAppId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contacts" (
    "id" TEXT NOT NULL,
    "jobAppId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT,
    "email" TEXT,
    "linkedinUrl" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prefill_tokens" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "payload" TEXT NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "prefill_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "job_applications_userId_idx" ON "job_applications"("userId");

-- CreateIndex
CREATE INDEX "job_applications_userId_status_idx" ON "job_applications"("userId", "status");

-- CreateIndex
CREATE INDEX "job_applications_userId_lastActivityAt_idx" ON "job_applications"("userId", "lastActivityAt");

-- CreateIndex
CREATE INDEX "job_applications_userId_appliedAt_idx" ON "job_applications"("userId", "appliedAt");

-- CreateIndex
CREATE INDEX "job_applications_userId_excitementScore_idx" ON "job_applications"("userId", "excitementScore");

-- CreateIndex
CREATE INDEX "timeline_events_jobAppId_idx" ON "timeline_events"("jobAppId");

-- CreateIndex
CREATE INDEX "timeline_events_jobAppId_occurredAt_idx" ON "timeline_events"("jobAppId", "occurredAt");

-- CreateIndex
CREATE INDEX "notes_jobAppId_idx" ON "notes"("jobAppId");

-- CreateIndex
CREATE INDEX "contacts_jobAppId_idx" ON "contacts"("jobAppId");

-- CreateIndex
CREATE UNIQUE INDEX "prefill_tokens_token_key" ON "prefill_tokens"("token");

-- CreateIndex
CREATE INDEX "prefill_tokens_token_idx" ON "prefill_tokens"("token");

-- CreateIndex
CREATE INDEX "prefill_tokens_userId_idx" ON "prefill_tokens"("userId");

-- AddForeignKey
ALTER TABLE "job_applications" ADD CONSTRAINT "job_applications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "app_auth"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timeline_events" ADD CONSTRAINT "timeline_events_jobAppId_fkey" FOREIGN KEY ("jobAppId") REFERENCES "job_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_jobAppId_fkey" FOREIGN KEY ("jobAppId") REFERENCES "job_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_jobAppId_fkey" FOREIGN KEY ("jobAppId") REFERENCES "job_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;
