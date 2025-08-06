// app/api/profiles/route.ts

import { VpnCertificateStatus, ActionType, ActionStatus } from '@/lib/generated/prisma';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma'; // Using global PrismaClient instance


interface CreateProfileRequestBody {
  username: string;
  nodeId: string;
} 

// --- GET Request (Fetch all VPN Users/Profiles) ---
export async function GET() {
  try {
    const vpnUsers = await prisma.vpnUser.findMany({
      select: {
        id: true,
        username: true,
        nodeId: true,
        node: { // Include node name for display purposes
          select: { name: true }
        },
        status: true,
        expirationDate: true,
        revocationDate: true, // Include revocation date
        serialNumber: true, // Include serial number
        ovpnFileContent: true, // Include OVPN file content for download
        isActive: true, // Include active status
        lastConnected: true, // Include last connected timestamp
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(vpnUsers, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching VPN profiles:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  } finally {
  }
}

// --- POST Request (Create a new VPN User/Profile) ---
export async function POST(req: Request) {
  try {
    const { username, nodeId }: CreateProfileRequestBody = await req.json();

    // Normalize username to lowercase for consistency across the system
    const normalizedUsername = username.toLowerCase();

    if (!normalizedUsername || !nodeId) {
      return NextResponse.json({ message: 'Username and Node ID are required.' }, { status: 400 });
    }

    // Check if a VpnUser with this username already exists.
    // This prevents creating action logs for users that are already managed.
    const existingVpnUser = await prisma.vpnUser.findUnique({
        where: { username: normalizedUsername },
    });

    if (existingVpnUser) {
        return NextResponse.json({ message: `VPN profile for '${username}' already exists.` }, { status: 409 });
    }

    // Also check if there's an existing pending CREATE_USER action for this username
    const existingPendingAction = await prisma.actionLog.findFirst({
        where: {
            action: ActionType.CREATE_USER,
            details: normalizedUsername, // 'details' field stores the username for CREATE_USER actions
            status: ActionStatus.PENDING,
        },
    });

    if (existingPendingAction) {
        return NextResponse.json({ message: `Creation for '${username}' is already pending.` }, { status: 409 });
    }

    // ONLY create an ActionLog entry. The VpnUser record will be created
    // by the agent's sync-profiles report once the user is created on the OpenVPN server.
    const actionLog = await prisma.actionLog.create({
      data: {
        action: ActionType.CREATE_USER,
        nodeId: nodeId,
        // vpnUserId is null here because the VpnUser record doesn't exist yet.
        // It will be linked later by the agent's completion report (action-logs/complete).
        details: normalizedUsername, // Store the normalized username here for the agent
        status: ActionStatus.PENDING,
      },
    });

    return NextResponse.json({ message: 'VPN profile creation request submitted successfully. It will be processed by the agent.', actionLogId: actionLog.id }, { status: 202 });
  } catch (error: any) {
    console.error('Error submitting VPN profile creation request:', error);
    return NextResponse.json({ message: 'Internal server error', error: error.message }, { status: 500 });
  } finally {

  }
}
