// lib/prisma.ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// 👇 Promise untuk memastikan koneksi siap sebelum pakai
const prismaConnectReady = prisma.$connect().then(() => {
  console.log("✅ Prisma connected");
}).catch((e) => {
  console.error("❌ Prisma failed to connect:", e);
});

export { prismaConnectReady };
export default prisma;
