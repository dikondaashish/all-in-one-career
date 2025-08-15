-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "atsScans" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "emails" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "portfolios" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "referrals" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "trackerEvents" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "public"."Log" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "message" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Log_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."Log" ADD CONSTRAINT "Log_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
