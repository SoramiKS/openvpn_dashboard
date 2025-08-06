// app/logs/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react"; // Import useState, useEffect, useCallback
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RefreshCw, Filter, Loader2 } from "lucide-react"; // Import Loader2
import { useToast } from "@/hooks/use-toast"; // Import useToast

// Import tipe langsung dari Prisma Client yang digenerate
import { ActionLog, ActionStatus, ActionType, Node, VpnUser } from "@/lib/generated/prisma";

// Definisi tipe ActionLog yang diperluas dengan relasi
interface ExtendedActionLog extends ActionLog {
  node: { name: string };
  vpnUser: { username: string } | null; // Bisa null jika tidak terkait dengan vpnUser
}

export default function LogsPage() {
  const [actionLogs, setActionLogs] = useState<ExtendedActionLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast(); // Inisialisasi useToast

  // Fungsi untuk mengambil data action log dari API
  const fetchActionLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/logs");
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message ||
            `HTTP error! status: ${response.status} saat mengambil log aktivitas`
        );
      }
      const data: ExtendedActionLog[] = await response.json();
      setActionLogs(data);
    } catch (error: any) {
      console.error("Gagal mengambil log aktivitas:", error);
      toast({
        title: "Error",
        description:
          error.message || "Gagal memuat log aktivitas. Silakan coba lagi.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Efek samping untuk mengambil data saat komponen dimuat
  useEffect(() => {
    fetchActionLogs();
    // Opsional: Auto-refresh log setiap X detik
    // const interval = setInterval(fetchActionLogs, 30000); // Refresh setiap 30 detik
    // return () => clearInterval(interval);
  }, [fetchActionLogs]);

  // Helper untuk menentukan varian Badge status log
  const getLogStatusBadgeVariant = (status: ActionStatus) => {
    switch (status) {
      case ActionStatus.COMPLETED:
        return "default"; // Atau 'success' jika ada
      case ActionStatus.PENDING:
        return "secondary";
      case ActionStatus.FAILED:
        return "destructive";
      default:
        return "outline";
    }
  };

  return (
    <div className="space-y-6 p-6"> {/* Tambahkan padding */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">System Logs</h1>
          <p className="text-gray-600">Monitor system events and activities</p>
        </div>
        <div className="flex space-x-2">
          {/* Tombol Filter (belum fungsional, hanya placeholder) */}
          <Button variant="outline" disabled={isLoading}>
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          {/* Tombol Refresh */}
          <Button variant="outline" onClick={fetchActionLogs} disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Refresh
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
              <span className="ml-2 text-gray-500">Memuat log aktivitas...</span>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Node</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>User/Details</TableHead> {/* Gabungkan User dan Details */}
                </TableRow>
              </TableHeader>
              <TableBody>
                {actionLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                      Tidak ada log aktivitas ditemukan.
                    </TableCell>
                  </TableRow>
                ) : (
                  actionLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-sm">
                        {new Date(log.createdAt).toLocaleString()}
                      </TableCell>
                      <TableCell className="font-medium">{log.node?.name || "N/A"}</TableCell>
                      <TableCell>{log.action}</TableCell>
                      <TableCell>
                        <Badge variant={getLogStatusBadgeVariant(log.status)}>
                          {log.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-md truncate" title={log.message || log.details || ""}>
                        {log.vpnUser?.username ? `User: ${log.vpnUser.username}` : log.details}
                        {log.message && log.details ? ` - ${log.message}` : log.message}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
