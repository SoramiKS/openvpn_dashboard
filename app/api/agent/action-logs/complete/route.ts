// app/api/agent/action-logs/complete/route.ts
import { ActionStatus, ActionType } from '@/lib/generated/prisma';
import { NextResponse } from 'next/server';
import prisma, { prismaConnectReady } from '@/lib/prisma';


interface CompleteActionRequestBody {
  actionLogId: string;
  status: 'success' | 'failed';
  message: string;
  ovpnFileContent?: string | null; // For CREATE_USER actions
}

export async function POST(req: Request) {
  try {
    const { actionLogId, status, message, ovpnFileContent }: CompleteActionRequestBody = await req.json();

    const agentApiKey = req.headers.get('Authorization')?.split(' ')[1];
    if (agentApiKey !== process.env.AGENT_API_KEY) {
      console.warn(`Unauthorized access attempt to /api/agent/action-logs/complete. Invalid API Key: ${agentApiKey}`);
      return NextResponse.json({ message: 'Unauthorized: Invalid Agent API Key.' }, { status: 401 });
    }

    await prismaConnectReady;

    await prisma.$transaction(async (tx: { actionLog: { findUnique: (arg0: { where: { id: string; }; }) => any; update: (arg0: { where: { id: string; } | { id: string; }; data: { status: "COMPLETED" | "FAILED"; message: string; executedAt: Date; } | { vpnUserId: any; }; }) => any; }; vpnUser: { findUnique: (arg0: { where: { username: any; }; }) => any; update: (arg0: { where: { id: any; }; data: { ovpnFileContent: string; }; }) => any; }; }) => {
      const actionLog = await tx.actionLog.findUnique({
        where: { id: actionLogId },
      });

      if (!actionLog) {
        console.warn(`Action log with ID ${actionLogId} not found during completion.`);
        return NextResponse.json({ message: 'Action log not found.' }, { status: 404 });
      }

      // Update the ActionLog status and message
      await tx.actionLog.update({
        where: { id: actionLogId },
        data: {
          status: status === 'success' ? ActionStatus.COMPLETED : ActionStatus.FAILED,
          message: message,
          executedAt: new Date(),
        },
      });

      // Special handling for CREATE_USER success: link to VpnUser and save OVPN content
      if (actionLog.action === ActionType.CREATE_USER && status === 'success') {
        const username = actionLog.details; // Get the normalized username from action log details
        if (username) {
          // Find the VpnUser record that should have been created by the agent's sync-profiles report.
          // This VpnUser record is the actual source of truth for the profile's existence.
          const vpnUser = await tx.vpnUser.findUnique({
            where: { username: username },
          });

          if (vpnUser) {
            // Link the ActionLog to the VpnUser record
            await tx.actionLog.update({
              where: { id: actionLogId },
              data: {
                vpnUserId: vpnUser.id, // Link to the VpnUser
              },
            });

            // Save OVPN file content to the VpnUser record
            if (ovpnFileContent) {
              await tx.vpnUser.update({
                where: { id: vpnUser.id },
                data: {
                  ovpnFileContent: ovpnFileContent,
                  // The status (VALID/PENDING) is primarily managed by sync-profiles,
                  // so we don't force it to VALID here. Let sync-profiles handle it
                  // based on the actual index.txt state.
                },
              });
            }
          } else {
            console.warn(`VpnUser with username '${username}' not found during CREATE_USER action completion for actionLogId: ${actionLogId}. This might indicate a sync issue.`);
            // Optionally, update action log status to reflect this internal inconsistency
            // For example, mark the action log as 'FAILED' with a specific message.
          }
        }
      }
      // For REVOKE_USER or DELETE_USER, the sync-profiles will eventually update the status to REVOKED
      // based on index.txt. We don't need to do much here beyond marking the action log complete.
    });

    console.log(`Action log ${actionLogId} completed successfully.`);
    return NextResponse.json({ message: 'Action log completed successfully' }, { status: 200 });
  } catch (error: any) {
    console.error('Error completing action log:', error);
    // Menambahkan penanganan khusus untuk kesalahan P2002 (Unique constraint violation)
    if (error.code === "P2002") {
      return NextResponse.json(
        { message: `A unique constraint violation occurred: ${error.meta?.target || 'unknown field'}. This might indicate a data inconsistency or a schema issue.`, error: error.message },
        { status: 409 }
      );
    }
    return NextResponse.json({ message: 'Internal server error', error: error.message }, { status: 500 });
  } finally {
    // Tidak perlu memanggil prisma.$disconnect() karena menggunakan instance global
  }
}
    