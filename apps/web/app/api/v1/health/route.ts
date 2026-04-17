import { prisma } from "@elp/db";
import { ok, fail } from "@/lib/api";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return ok({ status: "ok", db: "up" });
  } catch (e: any) {
    return fail("db_down", 503, e?.message);
  }
}
