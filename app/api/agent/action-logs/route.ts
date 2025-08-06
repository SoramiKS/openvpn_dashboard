import { ActionStatus } from '@/lib/generated/prisma';
import { NextResponse } from 'next/server';
import prisma, { prismaConnectReady } from '@/lib/prisma'; // tambahin ini

export async function GET(req: Request) {
  const authHeader = req.headers.get('Authorization');
  const agentApiKey = process.env.AGENT_API_KEY;

  if (!authHeader || !authHeader.startsWith('Bearer ') || authHeader.split(' ')[1] !== agentApiKey) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const serverId = searchParams.get('serverId');

  if (!serverId) {
    return NextResponse.json({ message: 'Missing serverId query parameter' }, { status: 400 });
  }

  try {
    await prismaConnectReady;

    const pendingActions = await prisma.actionLog.findMany({
      where: {
        nodeId: serverId,
        status: ActionStatus.PENDING,
      },
      orderBy: {
        createdAt: 'asc',
      },
      select: {
        id: true,
        action: true,
        vpnUserId: true,
        details: true,
      }
    });

    return NextResponse.json(pendingActions, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching action logs:', error);
    return NextResponse.json({ message: 'Internal server error', error: error.message }, { status: 500 });
  }
}
