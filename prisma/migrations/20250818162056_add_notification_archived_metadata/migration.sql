-- AlterTable
ALTER TABLE "public"."Notification" ADD COLUMN     "archived" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "metadata" JSONB;
