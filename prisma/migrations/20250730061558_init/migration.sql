-- CreateEnum
CREATE TYPE "public"."NodeStatus" AS ENUM ('ONLINE', 'OFFLINE', 'UNKNOWN', 'ERROR');

-- CreateEnum
CREATE TYPE "public"."VpnCertificateStatus" AS ENUM ('VALID', 'REVOKED', 'EXPIRED', 'PENDING', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "public"."ActionType" AS ENUM ('CREATE_USER', 'REVOKE_USER', 'RESTART_NODE', 'GET_LATEST_OVPN');

-- CreateEnum
CREATE TYPE "public"."ActionStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "public"."Node" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ip" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "lastSeen" TIMESTAMP(3),
    "status" "public"."NodeStatus" NOT NULL DEFAULT 'UNKNOWN',
    "cpuUsage" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "ramUsage" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "serviceStatus" TEXT NOT NULL DEFAULT 'UNKNOWN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Node_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."VpnUser" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "nodeId" TEXT NOT NULL,
    "status" "public"."VpnCertificateStatus" NOT NULL DEFAULT 'PENDING',
    "expirationDate" TIMESTAMP(3),
    "revocationDate" TIMESTAMP(3),
    "serialNumber" TEXT,
    "ovpnFileContent" TEXT,
    "lastSeen" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VpnUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ActionLog" (
    "id" TEXT NOT NULL,
    "action" "public"."ActionType" NOT NULL,
    "status" "public"."ActionStatus" NOT NULL DEFAULT 'PENDING',
    "message" TEXT,
    "nodeId" TEXT NOT NULL,
    "vpnUserId" TEXT,
    "details" TEXT,
    "ovpnFileContent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "executedAt" TIMESTAMP(3),

    CONSTRAINT "ActionLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Node_name_key" ON "public"."Node"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Node_token_key" ON "public"."Node"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VpnUser_username_key" ON "public"."VpnUser"("username");

-- CreateIndex
CREATE UNIQUE INDEX "VpnUser_serialNumber_key" ON "public"."VpnUser"("serialNumber");

-- AddForeignKey
ALTER TABLE "public"."VpnUser" ADD CONSTRAINT "VpnUser_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "public"."Node"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ActionLog" ADD CONSTRAINT "ActionLog_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "public"."Node"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ActionLog" ADD CONSTRAINT "ActionLog_vpnUserId_fkey" FOREIGN KEY ("vpnUserId") REFERENCES "public"."VpnUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
