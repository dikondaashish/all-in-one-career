/*
  Warnings:

  - You are about to drop the column `metadata` on the `Notification` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Notification` table. All the data in the column will be lost.
  - You are about to drop the `NotificationPreference` table. If the table is not empty, all the data it contains will be lost.
  - Changed the type of `type` on the `Notification` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "public"."NotificationPreference" DROP CONSTRAINT "NotificationPreference_userId_fkey";

-- Create new Notification table with proper structure
CREATE TABLE "public"."Notification_new" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "archived" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Notification_new_pkey" PRIMARY KEY ("id")
);

-- Migrate existing data to new table
INSERT INTO "public"."Notification_new" ("id", "userId", "type", "title", "message", "isRead", "createdAt", "archived")
SELECT 
    "id",
    "userId",
    COALESCE("type", 'SYSTEM') as "type",
    COALESCE("title", 'Notification') as "title",
    COALESCE("message", '') as "message",
    COALESCE("isRead", false) as "isRead",
    COALESCE("createdAt", CURRENT_TIMESTAMP) as "createdAt",
    COALESCE("archived", false) as "archived"
FROM "public"."Notification";

-- Drop old table and rename new one
DROP TABLE "public"."Notification";
ALTER TABLE "public"."Notification_new" RENAME TO "Notification";

-- DropTable
DROP TABLE "public"."NotificationPreference";

-- DropEnum
DROP TYPE "public"."NotificationType";
