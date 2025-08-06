// app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import type { AuthOptions } from "next-auth"; // Import AuthOptions
import CredentialsProvider from "next-auth/providers/credentials";
import type { JWT } from "next-auth/jwt"; // Import JWT type
import type { Session } from "next-auth"; // Import Session type

// import prisma from "@/lib/prisma"; // Tidak perlu prisma di sini lagi
// import bcrypt from "bcryptjs"; // Tidak perlu bcryptjs jika password tidak di-hash
// import { UserAccountStatus, UserRole } from "@/lib/generated/prisma"; // Tidak perlu enum ini lagi

export const authOptions: AuthOptions = { // Explicitly type authOptions
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // Sesi berlaku 30 hari
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        // Verifikasi kredensial langsung dari variabel lingkungan
        if (
          credentials?.username === process.env.ADMIN_USERNAME &&
          credentials?.password === process.env.ADMIN_PASSWORD
        ) {
          // Jika kredensial cocok, kembalikan objek pengguna.
          // ID bisa berupa string statis karena hanya ada satu admin.
          return {
            id: "admin-user", // ID statis untuk satu akun admin
            name: process.env.ADMIN_USERNAME, // Nama tampilan
            email: "admin@dashboard.com", // Email statis atau opsional
            role: "ADMIN", // Peran statis
          };
        } else {
          console.warn(`Login attempt failed: Invalid username or password.`);
          throw new Error("Invalid username or password.");
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }: { token: JWT; user: any }) { // Explicitly type token and user
      if (user) {
        token.id = user.id;
        token.role = user.role; // NextAuth.js tidak secara otomatis tahu 'role'
      }
      return token;
    },
    async session({ session, token }: { session: Session; token: JWT }) { // Explicitly type session and token
      if (token) {
        (session.user as any).id = token.id as string; // Cast session.user to any for custom properties
        (session.user as any).role = token.role as string; // Role sekarang string biasa
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/auth/error",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
