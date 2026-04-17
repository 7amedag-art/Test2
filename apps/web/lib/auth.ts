import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@elp/db";
import { createHash } from "node:crypto";

// Dev password hashing matches seed script. In production, switch to bcrypt:
// `import bcrypt from "bcryptjs"` — compare via `bcrypt.compare(plain, hash)`.
function hashPassword(plain: string) {
  return createHash("sha256").update(plain).digest("hex");
}

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: { signIn: "/sign-in" },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(creds) {
        if (!creds?.email || !creds?.password) return null;
        const user = await prisma.user.findUnique({ where: { email: creds.email } });
        if (!user || !user.hashedPassword) return null;
        if (user.hashedPassword !== hashPassword(creds.password)) return null;
        return {
          id: user.id,
          email: user.email,
          name: user.name ?? user.email,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.uid = (user as any).id;
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.uid;
        (session.user as any).role = token.role;
      }
      return session;
    },
  },
};

export type SessionRole = "admin" | "analyst" | "viewer";

declare module "next-auth" {
  interface Session {
    user: { id: string; email: string; name?: string | null; role: SessionRole };
  }
  interface User {
    role: SessionRole;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    uid: string;
    role: SessionRole;
  }
}
