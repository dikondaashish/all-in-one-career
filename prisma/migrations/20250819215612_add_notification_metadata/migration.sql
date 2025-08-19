-- AlterTable
ALTER TABLE "public"."Notification" RENAME CONSTRAINT "Notification_new_pkey" TO "Notification_pkey";

-- AlterTable
ALTER TABLE "public"."Notification" ADD COLUMN "metadata" JSONB;

-- AddForeignKey
ALTER TABLE "public"."Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
