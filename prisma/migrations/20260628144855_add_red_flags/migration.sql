-- CreateTable
CREATE TABLE "red_flags" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "emoji" TEXT NOT NULL DEFAULT '🚩',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "red_flags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_application_red_flags" (
    "jobAppId" TEXT NOT NULL,
    "flagId" TEXT NOT NULL,

    CONSTRAINT "job_application_red_flags_pkey" PRIMARY KEY ("jobAppId","flagId")
);

-- CreateIndex
CREATE INDEX "red_flags_userId_idx" ON "red_flags"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "red_flags_userId_label_key" ON "red_flags"("userId", "label");

-- AddForeignKey
ALTER TABLE "red_flags" ADD CONSTRAINT "red_flags_userId_fkey" FOREIGN KEY ("userId") REFERENCES "app_auth"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_application_red_flags" ADD CONSTRAINT "job_application_red_flags_jobAppId_fkey" FOREIGN KEY ("jobAppId") REFERENCES "job_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_application_red_flags" ADD CONSTRAINT "job_application_red_flags_flagId_fkey" FOREIGN KEY ("flagId") REFERENCES "red_flags"("id") ON DELETE CASCADE ON UPDATE CASCADE;
