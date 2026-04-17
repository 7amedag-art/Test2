import { prisma, type Prisma } from "@elp/db";
import { z } from "zod";
import { ok, parseBody } from "@/lib/api";
import { requireRole } from "@/lib/rbac";
import { writeAudit } from "@/lib/audit";

const Create = z.object({
  entityType: z.enum(["product", "manufacturer", "localization", "gap"]),
  entityId: z.string().uuid(),
  claimType: z.enum([
    "product_spec", "manufacturer_existence", "manufacturer_capability",
    "certification", "localization_status", "gap_assessment", "other",
  ]),
  sourceName: z.string().min(1),
  sourceUrl: z.string().url().nullish(),
  evidenceExcerpt: z.string().nullish(),
  confidenceScore: z.number().min(0).max(100).default(50),
  verificationStatus: z.enum(["unverified", "pending", "verified", "disputed", "outdated"]).default("unverified"),
  notes: z.string().nullish(),
});

export async function GET(req: Request) {
  const url = new URL(req.url);
  const where: Prisma.EvidenceWhereInput = {};
  const entityType = url.searchParams.get("entity_type");
  const entityId   = url.searchParams.get("entity_id");
  const claim      = url.searchParams.get("claim");
  if (entityType) where.entityType = entityType;
  if (entityId)   where.entityId   = entityId;
  if (claim)      where.claimType  = claim as any;
  const rows = await prisma.evidence.findMany({ where, orderBy: { createdAt: "desc" }, take: 200 });
  return ok(rows);
}

export async function POST(req: Request) {
  const guard = await requireRole("analyst");
  if (!guard.ok) return guard.response;
  const parsed = await parseBody(req, Create);
  if (!parsed.ok) return parsed.response;

  const created = await prisma.evidence.create({
    data: {
      ...parsed.data,
      confidenceScore: parsed.data.confidenceScore as any,
    },
  });
  await writeAudit({
    entityType: "evidence", entityId: created.id, action: "create",
    userId: guard.session!.user.id, changes: parsed.data as any,
  });
  return ok(created);
}
