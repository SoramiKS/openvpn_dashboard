// middleware.ts
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

// Middleware ini akan dijalankan untuk setiap permintaan yang cocok dengan 'matcher' di bawah.
// `withAuth` akan secara otomatis memeriksa sesi NextAuth.js.
export default withAuth(
  // Fungsi middleware utama yang akan dijalankan jika pengguna terautentikasi
  function middleware(req) {
    // Di sini Anda bisa menambahkan logika otorisasi lebih lanjut jika diperlukan,
    // misalnya, membatasi akses ke rute tertentu berdasarkan peran pengguna.
    // Namun, untuk satu akun admin, ini tidak terlalu diperlukan di sini.
    // Contoh:
    // if (req.nextUrl.pathname.startsWith("/admin-only") && req.nextauth.token?.role !== "ADMIN") {
    //   return NextResponse.rewrite(new URL("/access-denied", req.url));
    // }
  },
  {
    // Callbacks ini menentukan apakah pengguna diizinkan untuk mengakses rute yang dilindungi
    callbacks: {
      authorized: ({ token }) => {
        // Mengembalikan `true` jika ada token (berarti pengguna sudah login),
        // dan `false` jika tidak ada token.
        // Ini adalah cara paling sederhana untuk melindungi semua rute yang cocok.
        return !!token;
      },
    },
    // Konfigurasi halaman yang akan digunakan NextAuth.js untuk redirect jika autentikasi gagal
    pages: {
      signIn: "/login", // Mengarahkan pengguna ke halaman login jika mereka tidak terautentikasi
    },
  }
);

// Konfigurasi 'matcher' menentukan rute mana yang akan dilindungi oleh middleware ini.
// Semua rute yang cocok dengan pola di bawah akan memerlukan autentikasi.
export const config = {
  matcher: [
    "/dashboard/:path*", // Melindungi semua rute di bawah /dashboard (misal: /dashboard, /dashboard/settings)
    "/api/:path*",       // Melindungi semua API routes (misal: /api/profiles, /api/nodes)
    // PENTING: Kecualikan rute autentikasi NextAuth.js itu sendiri,
    // dan halaman login agar tidak terjadi redirect loop tak terbatas.
    // Pola ini berarti: cocokkan semua kecuali yang diawali dengan /api/auth, /login, /_next/static, dll.
    "/((?!api/auth|_next/static|_next/image|favicon.ico|login).*)",
  ],
};
