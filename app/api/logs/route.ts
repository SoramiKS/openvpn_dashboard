// app/api/logs/route.ts
import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';


export async function GET() {
  try {
    const actionLogs = await prisma.actionLog.findMany({
      orderBy: {
        createdAt: 'desc', // Urutkan dari yang terbaru
      },
      include: {
        node: { // Sertakan informasi Node
          select: { name: true },
        },
        vpnUser: { // Sertakan informasi VpnUser (jika ada)
          select: { username: true },
        },
      },
      take: 100, // Ambil 100 log terbaru untuk performa
    });

    return NextResponse.json(actionLogs, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching action logs:', error);
    return NextResponse.json({ message: 'Internal server error', error: error.message }, { status: 500 });
  } finally {

  }
}
