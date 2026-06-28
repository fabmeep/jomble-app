-- AlterTable
ALTER TABLE "app_auth"."users" ADD COLUMN     "ghostThresholdDays" INTEGER NOT NULL DEFAULT 30;
