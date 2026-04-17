import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions, type SessionRole } from "./auth";

export const ROLE_ORDER: Record<SessionRole, number> = {
  viewer: 0,
  analyst: 1,
  admin: 2,
};

export function hasRole(role: SessionRole | undefined, min: SessionRole): boolean {
  if (!role) return false;
  return ROLE_ORDER[role] >= ROLE_ORDER[min];
}

export async function requireRole(min: SessionRole) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "unauthenticated" }, { status: 401 }),
      session: null,
    };
  }
  if (!hasRole(session.user.role, min)) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "forbidden", required: min }, { status: 403 }),
      session,
    };
  }
  return { ok: true as const, response: null, session };
}

export async function currentUser() {
  const session = await getServerSession(authOptions);
  return session?.user ?? null;
}
