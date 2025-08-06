// app/login/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react"; // Import signIn from next-auth/react
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield } from "lucide-react"; // Import Shield icon

export default function LoginPage() {
  // Mengubah state 'email' menjadi 'username' agar sesuai dengan CredentialsProvider
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null); // State untuk pesan error
  const [isLoading, setIsLoading] = useState(false); // State untuk loading
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); // Reset error
    setIsLoading(true); // Mulai loading

    const result = await signIn("credentials", {
      redirect: false, // Jangan redirect otomatis
      username, // Menggunakan username
      password,
    });

    setIsLoading(false); // Selesai loading

    if (result?.error) {
      // Menampilkan pesan error yang lebih spesifik jika ada dari NextAuth.js
      setError(result.error || "Login gagal. Periksa username dan password Anda.");
      console.error("Login error:", result.error);
    } else {
      // Login berhasil, redirect ke dashboard
      router.push("/dashboard");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
      <Card className="w-full max-w-md shadow-lg rounded-lg overflow-hidden">
        <CardHeader className="space-y-1 text-center p-6 bg-white border-b border-gray-200">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-blue-100 rounded-full shadow-inner"> {/* Warna disesuaikan */}
              <Shield className="h-8 w-8 text-blue-600" /> {/* Warna disesuaikan */}
            </div>
          </div>
          <CardTitle className="text-3xl font-extrabold text-gray-800">OpenVPN Manager</CardTitle>
          <CardDescription className="text-gray-600 mt-2">
            Sign in to your account to manage your VPN infrastructure
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 bg-white">
          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm" role="alert">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label> {/* Mengubah label menjadi Username */}
              <Input
                id="username"
                type="text" // Mengubah type menjadi text untuk username
                placeholder="admin" // Contoh placeholder
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <Button type="submit" className="w-full py-2.5 rounded-md text-lg font-semibold bg-blue-600 hover:bg-blue-700 transition-colors" disabled={isLoading}>
              {isLoading ? "Signing In..." : "Sign In"}
            </Button>
          </form>
          {/* Hapus teks ini karena tidak ada pendaftaran pengguna lain */}
          {/* <div className="mt-4 text-center text-sm text-muted-foreground">
            Use any email and password to access the dashboard
          </div> */}
        </CardContent>
      </Card>
    </div>
  );
}
