-- DropIndex
DROP INDEX "public"."VpnUser_serialNumber_key";

-- AlterTable
ALTER TABLE "public"."VpnUser" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastConnected" TIMESTAMP(3);
