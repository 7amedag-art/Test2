import { prisma } from "@elp/db";
import { ok } from "@/lib/api";
import { requireRole } from "@/lib/rbac";
import { computeAndPersistGap } from "@/lib/gap";

export async function POST(req: Request) {
  const guard = await requireRole("analyst");
  if (!guard.ok) return guard.response;
  const url = new URL(req.url);
  const productId = url.searchParams.get("productId");

  if (productId) {
    const res = await computeAndPersistGap(productId);
    return ok(res);
  }

  const products = await prisma.product.findMany({ select: { id: true } });
  const results = [];
  for (const p of products) {
    results.push(await computeAndPersistGap(p.id));
  }
  return ok({ recomputed: results.length });
}
