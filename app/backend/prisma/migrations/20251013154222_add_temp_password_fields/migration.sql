-- AlterTable
ALTER TABLE "public"."users" ADD COLUMN     "isTempPassword" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "passwordSetAt" TIMESTAMP(3),
ADD COLUMN     "tempPasswordExpiresAt" TIMESTAMP(3);
