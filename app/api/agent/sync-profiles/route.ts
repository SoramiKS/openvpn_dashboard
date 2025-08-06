// app/api/agent/sync-profiles/route.ts
import { VpnCertificateStatus } from '@/lib/generated/prisma';
import { NextResponse } from 'next/server';
import prisma, { prismaConnectReady } from '@/lib/prisma';

interface VpnProfileData {
  username: string;
  status: string; // "VALID", "REVOKED", "EXPIRED", "UNKNOWN", "PENDING"
  expirationDate?: string | null; // ISO string
  revocationDate?: string | null; // ISO string
  serialNumber?: string | null;
  ovpnFileContent?: string | null; // Diperbaiki: Menggunakan 'ovpnFileContent' agar konsisten dengan agen
}

interface SyncProfilesRequestBody {
  serverId: string;
  vpnProfiles: VpnProfileData[];
}

export async function POST(req: Request) {
  let serverId: string | undefined;
  try {
    const { serverId: nodeId, vpnProfiles }: SyncProfilesRequestBody = await req.json();
    serverId = nodeId; // Assign to serverId for logging context

    const authHeader = req.headers.get('Authorization');
    const apiKey = authHeader?.split(' ')[1];

    // --- PENTING: Pastikan variabel lingkungan AGENT_API_KEY diatur di Next.js server Anda ---
    if (apiKey !== process.env.AGENT_API_KEY) {
      console.warn(`Unauthorized access attempt to /api/agent/sync-profiles. Invalid API Key: ${apiKey}`);
      return NextResponse.json({ message: 'Unauthorized: Invalid Agent API Key.' }, { status: 401 });
    }

    if (!serverId || !Array.isArray(vpnProfiles)) {
      console.warn(`Missing required fields for sync-profiles from server ${serverId || 'N/A'}.`);
      return NextResponse.json({ message: 'Missing required fields: serverId and vpnProfiles array.' }, { status: 400 });
    }

    await prismaConnectReady; 

    await prisma.$transaction(async (tx) => {
      const upsertPromises: Promise<any>[] = [];

      for (const agentProfile of vpnProfiles) {
        // Normalize username to lowercase for consistency
        const normalizedUsername = agentProfile.username.toLowerCase();

        let newStatus: VpnCertificateStatus = VpnCertificateStatus.UNKNOWN;
        if (agentProfile.status === "VALID") {
            newStatus = VpnCertificateStatus.VALID;
        } else if (agentProfile.status === "REVOKED") {
            newStatus = VpnCertificateStatus.REVOKED;
        } else if (agentProfile.status === "EXPIRED") {
            newStatus = VpnCertificateStatus.EXPIRED;
        } else if (agentProfile.status === "PENDING") {
            newStatus = VpnCertificateStatus.PENDING;
        } else {
            newStatus = VpnCertificateStatus.UNKNOWN;
        }

        const commonData = {
          status: newStatus,
          serialNumber: agentProfile.serialNumber,
          expirationDate: agentProfile.expirationDate ? new Date(agentProfile.expirationDate) : null,
          revocationDate: agentProfile.revocationDate ? new Date(agentProfile.revocationDate) : null,
          ovpnFileContent: agentProfile.ovpnFileContent || null, // Diperbaiki: Menggunakan 'ovpnFileContent'
        };

        upsertPromises.push(tx.vpnUser.upsert({
          where: { username: normalizedUsername },
          update: commonData, // Update these fields if user exists
          create: {
            username: normalizedUsername,
            nodeId: serverId as string, // Ensure nodeId is set for new users and is always a string
            ...commonData, // Create with these fields
            isActive: false, // Default to inactive, report-status will update if active
            // ovpnFileContent: null, // DIHAPUS: Ini akan menimpa konten OVPN dari commonData
            createdAt: new Date(), // Set creation date for new users
          },
        }));
      }

      await Promise.all(upsertPromises);

      // Optional: Logic to mark users in DB as non-existent if they are no longer in agent's index.txt
      // This is more complex and depends on your exact requirements for deletion/archiving.
      // For now, we only upsert based on what the agent reports.
    });

    console.log(`VPN profiles synced for server ${serverId}.`);
    return NextResponse.json({ message: 'VPN profiles synced successfully' }, { status: 200 });
  } catch (err: any) {
    console.error('Error syncing VPN profiles for serverId:', serverId || 'N/A', ':', err);
    if (err.code === 'P2025') {
      return NextResponse.json({ message: `Node with ID ${serverId} not found.` }, { status: 404 });
    }
    if (err.code === 'P2002') {
        return NextResponse.json({ message: 'A unique constraint violation occurred during profile synchronization. This might indicate a data inconsistency or a race condition. Please check your Prisma schema, especially the `serialNumber` field on `VpnUser` model (it likely should not be `@unique`).', error: err.message }, { status: 409 });
    }
    return NextResponse.json({ message: 'Internal server error', error: err.message }, { status: 500 });
  } finally {
  }
}
