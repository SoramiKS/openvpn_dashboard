// app/vpn-profiles/page.tsx
"use client";

import { useState, useEffect, useCallback, useMemo } from "react"; // Import useMemo
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Trash2, Download, Loader2, Wifi, PowerOff } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

// Import tipe langsung dari Prisma Client yang digenerate
import { VpnUser, VpnCertificateStatus, Node } from "@/lib/generated/prisma";

// Definisi tipe Node yang lebih sederhana untuk dropdown pilihan node
interface NodeForSelect {
  id: string;
  name: string;
}

export default function VpnProfilesPage() {
  // Menggunakan tipe VpnUser dari Prisma, dengan relasi 'node' yang di-include
  const [vpnUsers, setVpnUsers] = useState<
    (VpnUser & { node: { name: string } })[]
  >([]);
  const [nodes, setNodes] = useState<NodeForSelect[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newProfile, setNewProfile] = useState({ username: "", nodeId: "" });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Fungsi untuk mengambil data profil VPN dari API
  const fetchVpnUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/profiles");
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message ||
            `HTTP error! status: ${response.status} saat mengambil profil VPN`
        );
      }
      const data: (VpnUser & { node: { name: string } })[] =
        await response.json();
      setVpnUsers(data.filter((user) => !user.username.startsWith("server_")));
    } catch (error: any) {
      console.error("Gagal mengambil profil VPN:", error);
      toast({
        title: "Error",
        description:
          error.message || "Gagal memuat profil VPN. Silakan coba lagi.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Fungsi untuk mengambil daftar node untuk dropdown
  const fetchNodesForSelect = useCallback(async () => {
    try {
      const response = await fetch("/api/nodes");
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message ||
            `HTTP error! status: ${response.status} saat mengambil node`
        );
      }
      const data: NodeForSelect[] = await response.json();
      setNodes(data);
    } catch (error: any) {
      console.error("Gagal mengambil node untuk pilihan:", error);
      toast({
        title: "Error",
        description:
          error.message || "Gagal memuat node untuk pembuatan profil.",
        variant: "destructive",
      });
    }
  }, [toast]);

  // Efek samping untuk mengambil data saat komponen dimuat dan untuk auto-refresh
  useEffect(() => {
    fetchVpnUsers();
    fetchNodesForSelect();

    // Auto-refresh profil setiap 15 detik untuk update status koneksi
    // Anda bisa mengaktifkan kembali ini jika ingin auto-refresh
    // const interval = setInterval(fetchVpnUsers, 15000);
    // return () => clearInterval(interval); // Cleanup interval saat komponen unmount
  }, [fetchVpnUsers, fetchNodesForSelect]);

  // Memisahkan vpnUsers menjadi valid dan revoked menggunakan useMemo
  const validUsers = useMemo(() => {
    return vpnUsers.filter(
      (user) =>
        user.status === VpnCertificateStatus.VALID ||
        user.status === VpnCertificateStatus.PENDING
    );
  }, [vpnUsers]);

  const revokedUsers = useMemo(() => {
    return vpnUsers.filter(
      (user) =>
        user.status === VpnCertificateStatus.REVOKED ||
        user.status === VpnCertificateStatus.EXPIRED ||
        user.status === VpnCertificateStatus.UNKNOWN
    );
  }, [vpnUsers]);

  // Fungsi untuk menangani penambahan profil VPN baru
  const handleAddProfile = async () => {
    if (!newProfile.username.trim() || !newProfile.nodeId) {
      toast({
        title: "Kesalahan Input",
        description: "Nama Profil dan Node wajib diisi.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newProfile),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Gagal membuat profil VPN");
      }

      toast({
        title: "Berhasil",
        description: "Pembuatan profil VPN berhasil dimulai!",
      });
      setNewProfile({ username: "", nodeId: "" }); // Reset form
      setIsAddModalOpen(false); // Tutup modal
      // Tidak perlu fetchVpnUsers() di sini, karena agen akan melaporkan statusnya
      // dan auto-refresh akan mengambilnya.
    } catch (error: any) {
      console.error("Error membuat profil VPN:", error);
      toast({
        title: "Error",
        description:
          error.message || "Gagal membuat profil VPN. Silakan coba lagi.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Fungsi untuk menangani pencabutan profil VPN
  const handleRevokeProfile = async (id: string, username: string) => {
    if (
      !window.confirm(
        `Apakah Anda yakin ingin mencabut profil VPN untuk ${username}?`
      )
    ) {
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/profiles/${id}/revoke`, {
        method: "POST",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Gagal mencabut profil VPN.");
      }

      toast({
        title: "Berhasil",
        description: `Pencabutan profil VPN untuk ${username} berhasil dimulai!`,
      });
      // Tidak perlu fetchVpnUsers() di sini, karena agen akan melaporkan statusnya
      // dan auto-refresh akan mengambilnya.
    } catch (error: any) {
      console.error("Error mencabut profil VPN:", error);
      toast({
        title: "Error",
        description:
          error.message || "Gagal mencabut profil VPN. Silakan coba lagi.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Fungsi untuk mengunduh file OVPN
  const handleDownloadOvpn = (
    ovpnFileContent: string | null | undefined,
    username: string
  ) => {
    if (ovpnFileContent) {
      const blob = new Blob([ovpnFileContent], {
        type: "application/octet-stream",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${username}.ovpn`; // Nama file yang diunduh
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url); // Bersihkan URL objek

      toast({
        title: "Unduhan Dimulai",
        description: `File OVPN untuk ${username} sedang diunduh.`,
      });
    } else {
      toast({
        title: "Tidak Ada File OVPN",
        description:
          "Profil ini belum memiliki file OVPN yang tersedia atau belum dibuat oleh agen.",
        variant: "default",
      });
    }
  };

  // Helper untuk menentukan varian Badge status sertifikat
  const getCertificateStatusBadgeVariant = (status: VpnCertificateStatus) => {
    switch (status) {
      case VpnCertificateStatus.VALID:
        return "default";
      case VpnCertificateStatus.PENDING:
        return "secondary";
      case VpnCertificateStatus.REVOKED:
      case VpnCertificateStatus.EXPIRED:
        return "destructive";
      case VpnCertificateStatus.UNKNOWN:
      default:
        return "outline";
    }
  };

  const renderProfileTable = (
    profiles: (VpnUser & { node: { name: string } })[],
    title: string,
    noDataMessage: string
  ) => (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
            <span className="ml-2 text-gray-500">Memuat profil VPN...</span>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama Pengguna</TableHead>
                <TableHead>Node</TableHead>
                <TableHead>Status Sertifikat</TableHead>
                <TableHead>Koneksi</TableHead>
                <TableHead>Tanggal Kadaluarsa</TableHead>
                <TableHead>Tanggal Dibuat</TableHead>
                <TableHead>Terakhir Terhubung</TableHead>
                <TableHead>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {profiles.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center py-8 text-gray-500"
                  >
                    {noDataMessage}
                  </TableCell>
                </TableRow>
              ) : (
                profiles.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      {user.username}
                    </TableCell>
                    <TableCell>{user.node?.name || "N/A"}</TableCell>
                    <TableCell>
                      <Badge
                        variant={getCertificateStatusBadgeVariant(user.status)}
                      >
                        {user.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.isActive ? (
                        <Badge
                          variant="default"
                          className="bg-green-500 hover:bg-green-500"
                        >
                          <Wifi className="h-3 w-3 mr-1" /> Online
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-gray-500">
                          <PowerOff className="h-3 w-3 mr-1" /> Offline
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {user.expirationDate
                        ? new Date(user.expirationDate).toLocaleDateString()
                        : "N/A"}
                    </TableCell>
                    <TableCell>
                      {new Date(user.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {user.lastConnected
                        ? new Date(user.lastConnected).toLocaleString()
                        : "Belum Terhubung"}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        {/* Tombol Unduh OVPN (hanya untuk status VALID) */}
                        {user.ovpnFileContent &&
                        user.status === VpnCertificateStatus.VALID ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleDownloadOvpn(
                                user.ovpnFileContent,
                                user.username
                              )
                            }
                            disabled={isSubmitting}
                          >
                            <Download className="h-4 w-4 mr-1" /> Unduh
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled
                            title="File OVPN belum tersedia atau sertifikat tidak valid"
                          >
                            <Download className="h-4 w-4 mr-1" /> Unduh
                          </Button>
                        )}

                        {/* Tombol Cabut (hanya untuk status VALID atau PENDING) */}
                        {(user.status === VpnCertificateStatus.VALID ||
                          user.status === VpnCertificateStatus.PENDING) && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() =>
                              handleRevokeProfile(user.id, user.username)
                            }
                            disabled={isSubmitting}
                          >
                            {isSubmitting ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4 mr-1" />
                            )}
                            Cabut
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Profil VPN</h1>
          <p className="text-gray-600">Kelola profil konfigurasi VPN</p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)} disabled={isSubmitting}>
          {isSubmitting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4 mr-2" />
          )}
          Buat Profil
        </Button>
      </div>
      {/* Tabel untuk Profil Pengguna Aktif/Valid */}
      {renderProfileTable(
        validUsers,
        "Daftar Profil Pengguna Aktif",
        "Tidak ada profil VPN aktif ditemukan. Buat profil baru untuk memulai!"
      )}
      <div className="pt-8"></div> {/* Spacer antara dua tabel */}
      {/* Tabel untuk Profil Pengguna Dicabut/Kadaluarsa */}
      {renderProfileTable(
        revokedUsers,
        "Daftar Profil Pengguna Dicabut/Kadaluarsa",
        "Tidak ada profil VPN dicabut atau kadaluarsa ditemukan."
      )}
      {/* Dialog Tambah Profil VPN */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Buat Profil VPN Baru</DialogTitle>
            <DialogDescription>
              Masukkan nama pengguna dan pilih node untuk profil VPN baru.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="username" className="text-right">
                Nama Pengguna
              </Label>
              <Input
                id="username"
                name="username"
                value={newProfile.username}
                onChange={(e) =>
                  setNewProfile({ ...newProfile, username: e.target.value })
                }
                className="col-span-3"
                disabled={isSubmitting}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="node" className="text-right">
                Node yang Ditugaskan
              </Label>
              <Select
                value={newProfile.nodeId}
                onValueChange={(value) =>
                  setNewProfile({ ...newProfile, nodeId: value })
                }
                disabled={isSubmitting || nodes.length === 0}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue
                    placeholder={
                      nodes.length > 0
                        ? "Pilih Node"
                        : "Tidak ada node tersedia"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {nodes.length === 0 ? (
                    <SelectItem value="no-nodes" disabled>
                      Tidak ada node tersedia. Silakan tambahkan node terlebih
                      dahulu.
                    </SelectItem>
                  ) : (
                    nodes.map((node) => (
                      <SelectItem key={node.id} value={node.id}>
                        {node.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAddModalOpen(false)}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button onClick={handleAddProfile} disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Buat Profil
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
