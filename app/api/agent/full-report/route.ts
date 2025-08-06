// app/api/agent/full-report/route.ts
import { $Enums, NodeStatus, VpnCertificateStatus } from '@/lib/generated/prisma';
import { NextResponse } from 'next/server';
import prisma, { prismaConnectReady } from '@/lib/prisma';

// Matching the AgentReportRequest model from Python agent
interface AgentReportRequestBody {
  nodeMetrics: {
    serverId: string;
    cpuUsage: number;
    ramUsage: number;
    serviceStatus: string;
    activeUsers: string[];
  };
  vpnProfiles: {
    username: string;
    status: string; // "VALID", "REVOKED", "EXPIRED", "UNKNOWN"
    expirationDate?: string | null; // ISO string
    revocationDate?: string | null; // ISO string
    serialNumber?: string | null;
  }[];
}

export async function POST(request: Request) {
  let serverId: string | undefined;
  try {
    const { nodeMetrics, vpnProfiles }: AgentReportRequestBody = await request.json();
    serverId = nodeMetrics.serverId;
    const { cpuUsage, ramUsage, serviceStatus, activeUsers } = nodeMetrics;

    const agentApiKey = request.headers.get('Authorization')?.split(' ')[1];

    if (agentApiKey !== process.env.AGENT_API_KEY) {
      return NextResponse.json({ message: 'Unauthorized: Invalid Agent API Key.' }, { status: 401 });
    }

    if (!serverId || typeof cpuUsage === 'undefined' || typeof ramUsage === 'undefined' || !serviceStatus || !Array.isArray(activeUsers) || !Array.isArray(vpnProfiles)) {
      return NextResponse.json(
        { message: 'Missing required fields in full report.' },
        { status: 400 }
      );
    }

    await prismaConnectReady;
    // Start a Prisma transaction to ensure atomicity of updates
    await prisma.$transaction(async (tx: {
        node: { update: (arg0: { where: { id: string | undefined; }; data: { cpuUsage: number; ramUsage: number; serviceStatus: string; lastSeen: Date; status: "ONLINE" | "OFFLINE" | "UNKNOWN"; }; }) => any; }; vpnUser: {
          upsert: (arg0: {
            where: { username: string; }; update: { lastConnected?: Date | undefined; status: $Enums.VpnCertificateStatus; serialNumber: string | null | undefined; expirationDate: Date | null; revocationDate: Date | null; isActive: boolean; }; create: {
              ovpnFileContent: null; // Agent doesn't send OVPN content in this report
              createdAt: Date; lastConnected?: Date | undefined; status: $Enums.VpnCertificateStatus; serialNumber: string | null | undefined; expirationDate: Date | null; revocationDate: Date | null; isActive: boolean; username: string; nodeId: string;
            };
          }) => Promise<any>; findMany: (arg0: { where: { nodeId: string | undefined; }; select: { id: boolean; username: boolean; isActive: boolean; }; }) => any; update: (arg0: { where: { id: any; }; data: { isActive: boolean; }; }) => Promise<any>;
        };
      }) => {
      // 1. Update Node Metrics
      let mappedNodeStatus: NodeStatus;
      if (serviceStatus === 'running') {
        mappedNodeStatus = NodeStatus.ONLINE;
      } else if (serviceStatus === 'stopped') {
        mappedNodeStatus = NodeStatus.OFFLINE;
      } else {
        mappedNodeStatus = NodeStatus.UNKNOWN;
      }

      await tx.node.update({
        where: { id: serverId },
        data: {
          cpuUsage: cpuUsage,
          ramUsage: ramUsage,
          serviceStatus: serviceStatus,
          lastSeen: new Date(),
          status: mappedNodeStatus,
        },
      });

      // 2. Synchronize VpnUser Profiles using upsert
      const activeUsernamesFromAgent = new Set(activeUsers);

      const upsertPromises: Promise<any>[] = [];

      for (const agentProfile of vpnProfiles) {
        const isCurrentlyActive = activeUsernamesFromAgent.has(agentProfile.username);
        
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
          isActive: isCurrentlyActive,
          // lastConnected should only be updated if user is active
          ...(isCurrentlyActive && { lastConnected: new Date() }),
        };

        if (!serverId) {
          throw new Error('serverId is required for creating a vpnUser');
        }
        upsertPromises.push(tx.vpnUser.upsert({
          where: { username: agentProfile.username },
          update: commonData,
          create: {
            username: agentProfile.username,
            nodeId: serverId, // Ensure nodeId is set for new users
            ...commonData,
            ovpnFileContent: null, // Agent doesn't send OVPN content in this report
            createdAt: new Date(), // Set creation date for new users
          },
        }));
      }

      await Promise.all(upsertPromises);

      // 3. Mark users in DB as inactive if they are NOT in agent's activeUsers list
      // This is crucial to mark users as offline if they disconnect
      // We need to fetch all users for this node again, as upsert might have created new ones
      const allUsersOnThisNodeAfterUpsert = await tx.vpnUser.findMany({
        where: { nodeId: serverId },
        select: { id: true, username: true, isActive: true },
      });

      const inactiveUpdates: Promise<any>[] = [];
      for (const dbUser of allUsersOnThisNodeAfterUpsert) {
        if (!activeUsernamesFromAgent.has(dbUser.username) && dbUser.isActive) {
          inactiveUpdates.push(tx.vpnUser.update({
            where: { id: dbUser.id },
            data: { isActive: false },
          }));
        }
      }
      await Promise.all(inactiveUpdates);

    }); // End of transaction

    console.log(`Full report processed for server ${serverId}.`);
    return NextResponse.json({ message: 'Full report processed successfully' }, { status: 200 });

  } catch (error: any) {
    console.error('Error processing full agent report for serverId:', serverId || 'N/A', ':', error);
    if (error.code === 'P2025') {
      return NextResponse.json({ message: `Node with ID ${serverId} not found.` }, { status: 404 });
    }
    // Handle P2002 specifically if it somehow still occurs (e.g., race condition outside transaction or complex unique index)
    if (error.code === 'P2002') {
        return NextResponse.json({ message: 'A unique constraint violation occurred during profile synchronization. This might indicate a data inconsistency or a race condition.', error: error.message }, { status: 409 });
    }
    return NextResponse.json({ message: 'Internal server error', error: error.message }, { status: 500 });
  } finally {
  }
}
