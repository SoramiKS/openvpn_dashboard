import { ActionType, ActionStatus } from "@/lib/generated/prisma";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";


interface Params {
  id: string; // VpnUser ID
}

export async function POST(req: Request, { params }: { params: Params }) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { message: "VpnUser ID is required." },
        { status: 400 }
      );
    }

    const vpnUser = await prisma.vpnUser.findUnique({
      where: { id: id },
      select: { id: true, username: true, nodeId: true, status: true },
    });

    if (!vpnUser) {
      return NextResponse.json(
        { message: "VPN User not found." },
        { status: 404 }
      );
    }

    // Check if the user is already revoked
    if (vpnUser.status === "REVOKED") {
      // Using string directly as enum doesn't support direct comparison
      return NextResponse.json(
        { message: "VPN User is already revoked." },
        { status: 400 }
      );
    }

    await prisma.actionLog.create({
      data: {
        action: ActionType.REVOKE_USER,
        nodeId: vpnUser.nodeId,
        vpnUserId: vpnUser.id,
        details: vpnUser.username,
        status: ActionStatus.PENDING,
      },
    });

    return NextResponse.json(
      { message: "VPN profile revocation initiated successfully" },
      { status: 202 }
    );
  } catch (error: any) {
    console.error("Error initiating VPN profile revocation:", error);
    return NextResponse.json(
      { message: "Internal server error", error: error.message },
      { status: 500 }
    );
  } finally {

  }
}
