// app/api/nodes/route.ts

import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';


// --- GET Request (Fetch all nodes with all relevant data) ---
export async function GET() {
  try {
    const nodes = await prisma.node.findMany({
      // Select all fields relevant for the NodesPage table
      select: {
        id: true,
        name: true,
        ip: true,          // Menggunakan 'ip' sesuai schema.prisma
        location: true,    // Pastikan ini ada di schema.prisma
        status: true,
        cpuUsage: true,
        ramUsage: true,
        serviceStatus: true,
        lastSeen: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { name: 'asc' },
    });
    return NextResponse.json(nodes, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching nodes:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  } finally {

  }
}

// --- POST Request (Create a new node) ---
export async function POST(request: Request) {
  try {
    const body = await request.json();
    // Destructure all expected fields from the frontend
    const { name, ipAddress, location, token } = body;

    // Validate required fields
    if (!name || !ipAddress || !token) {
      return NextResponse.json({ message: 'Node name, IP Address, and token are required' }, { status: 400 });
    }

    // You can optionally add more robust IP address validation here

    const newNode = await prisma.node.create({
      data: {
        name,
        ip: ipAddress, // Map ipAddress from frontend to 'ip' in Prisma
        token,
        location, // location bisa null di database, tapi kalau dikirim dari frontend, simpan.
        // status, cpuUsage, ramUsage, serviceStatus, lastSeen akan menggunakan default dari schema.prisma
      },
    });

    return NextResponse.json(newNode, { status: 201 }); // 201 Created
  } catch (error: any) {
    console.error('Error creating node:', error);
    if (error.code === 'P2002') { // Prisma unique constraint violation (for name or token)
      const target = error.meta?.target;
      let errorMessage = 'A node with this name or token already exists.';
      if (target === 'name') {
        errorMessage = 'A node with this name already exists.';
      } else if (target === 'token') {
        errorMessage = 'This token is already in use by another node.';
      }
      return NextResponse.json({ message: errorMessage }, { status: 409 }); // 409 Conflict
    }
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  } finally {

  }
}