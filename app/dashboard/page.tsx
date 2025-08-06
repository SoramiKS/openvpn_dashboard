// app/dashboard/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Server, Users, Activity, Shield, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Import tipe langsung dari Prisma Client yang digenerate
import { Node, VpnUser, VpnCertificateStatus, NodeStatus } from "@/lib/generated/prisma"; // Import NodeStatus enum

export default function DashboardPage() {
  const [nodesData, setNodesData] = useState<Node[]>([]);
  const [vpnUsersData, setVpnUsersData] = useState<VpnUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Fungsi untuk mengambil semua data yang dibutuhkan untuk dashboard
  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch Nodes data
      const nodesResponse = await fetch("/api/nodes");
      if (!nodesResponse.ok) {
        const errorData = await nodesResponse.json();
        throw new Error(errorData.message || `HTTP error! status: ${nodesResponse.status} saat mengambil data node`);
      }
      const nodes: Node[] = await nodesResponse.json();
      setNodesData(nodes);

      // Fetch VPN Users data
      const usersResponse = await fetch("/api/profiles");
      if (!usersResponse.ok) {
        const errorData = await usersResponse.json();
        throw new Error(errorData.message || `HTTP error! status: ${usersResponse.status} saat mengambil data profil VPN`);
      }
      const users: VpnUser[] = await usersResponse.json();
      setVpnUsersData(users);

    } catch (error: any) {
      console.error("Gagal memuat data dashboard:", error);
      toast({
        title: "Error",
        description: error.message || "Gagal memuat data dashboard. Silakan coba lagi.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Efek samping untuk mengambil data saat komponen dimuat
  useEffect(() => {
    fetchDashboardData();
    // Opsional: Auto-refresh data dashboard setiap X detik
    const interval = setInterval(fetchDashboardData, 30000); // Refresh setiap 30 detik
    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  // Hitung statistik dari data yang diambil
  const totalNodes = nodesData.length;
  // Perbaiki perbandingan status di sini
  const onlineNodes = nodesData.filter(node => node.status === NodeStatus.ONLINE).length;
  const totalUsers = vpnUsersData.length;
  const validUsersCount = vpnUsersData.filter(user => user.status === VpnCertificateStatus.VALID).length;
  const activeSessions = vpnUsersData.filter(user => user.isActive).length;

  // Tentukan status sistem secara keseluruhan
  const systemStatus = onlineNodes === totalNodes && totalNodes > 0 ? "Healthy" : "Degraded";
  // Varian badge untuk status sistem (tidak perlu diubah, karena sudah string)
  const systemStatusVariant = systemStatus === "Healthy" ? "default" : "destructive";

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Overview</h1>
        <p className="text-gray-600">Monitor your OpenVPN infrastructure at a glance</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-60">
          <Loader2 className="h-10 w-10 animate-spin text-gray-500" />
          <span className="ml-4 text-gray-500 text-lg">Memuat data dashboard...</span>
        </div>
      ) : (
        <>
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Nodes</CardTitle>
                <Server className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalNodes}</div>
                <div className="flex items-center mt-2">
                  {/* Perbaiki perbandingan status di sini */}
                  <Badge variant={onlineNodes > 0 ? "default" : "destructive"}>
                    {onlineNodes} online
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalUsers}</div>
                <div className="flex items-center mt-2">
                  <Badge variant="default">
                    {validUsersCount} valid
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{activeSessions}</div>
                <p className="text-xs text-muted-foreground mt-2">
                  Jumlah pengguna yang sedang terhubung
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">System Status</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${systemStatus === "Healthy" ? "text-green-600" : "text-red-600"}`}>
                  {systemStatus}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {systemStatus === "Healthy" ? "Semua sistem beroperasi normal" : "Beberapa node mungkin offline atau bermasalah"}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Node Status & Resource Usage */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Node Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {nodesData.length === 0 ? (
                    <div className="text-center text-gray-500 py-4">Tidak ada node ditemukan.</div>
                  ) : (
                    nodesData.map((node) => (
                      <div key={node.id} className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{node.name}</div>
                          <div className="text-sm text-muted-foreground">{node.location || "N/A"}</div>
                        </div>
                        {/* Perbaiki perbandingan status di sini */}
                        <Badge variant={node.status === NodeStatus.ONLINE ? 'default' : 'destructive'}>
                          {node.status} {/* Menampilkan nilai enum sebagai string */}
                        </Badge>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Resource Usage (Online Nodes)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {nodesData.filter(node => node.status === NodeStatus.ONLINE).length === 0 ? ( // Filter juga diperbaiki
                    <div className="text-center text-gray-500 py-4">Tidak ada node online untuk menampilkan penggunaan sumber daya.</div>
                  ) : (
                    nodesData.filter(node => node.status === NodeStatus.ONLINE).map((node) => (
                      <div key={node.id} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>{node.name}</span>
                          <span>CPU: {node.cpuUsage?.toFixed(1) || 'N/A'}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${node.cpuUsage || 0}%` }}
                          ></div>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span></span>
                          <span>RAM: {node.ramUsage?.toFixed(1) || 'N/A'}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-purple-600 h-2 rounded-full"
                            style={{ width: `${node.ramUsage || 0}%` }}
                          ></div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
