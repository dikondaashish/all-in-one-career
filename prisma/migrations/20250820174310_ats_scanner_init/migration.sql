-- AlterTable
ALTER TABLE "public"."Notification" RENAME CONSTRAINT "Notification_new_pkey" TO "Notification_pkey";

-- CreateTable
CREATE TABLE "public"."AtsScan" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "fileName" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "jdText" TEXT,
    "parsedJson" JSONB NOT NULL,
    "matchScore" INTEGER NOT NULL,
    "missingSkills" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "extraSkills" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AtsScan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AtsKeywordStat" (
    "id" TEXT NOT NULL,
    "scanId" TEXT NOT NULL,
    "keyword" TEXT NOT NULL,
    "inResume" BOOLEAN NOT NULL,
    "inJobDesc" BOOLEAN NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1,

    CONSTRAINT "AtsKeywordStat_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AtsKeywordStat_scanId_idx" ON "public"."AtsKeywordStat"("scanId");

-- AddForeignKey
ALTER TABLE "public"."Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AtsScan" ADD CONSTRAINT "AtsScan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AtsKeywordStat" ADD CONSTRAINT "AtsKeywordStat_scanId_fkey" FOREIGN KEY ("scanId") REFERENCES "public"."AtsScan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
