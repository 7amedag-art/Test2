import { prisma } from "@elp/db";
import { z } from "zod";
import { ok, fail, parseBody } from "@/lib/api";
import { requireRole } from "@/lib/rbac";
import { writeAudit } from "@/lib/audit";

const Update = z.object({
  sourceName: z.string().optional(),
  sourceUrl: z.string().url().nullish(),
  evidenceExcerpt: z.string().nullish(),
  confidenceScore: z.number().min(0).max(100).optional(),
  verificationStatus: z.enum(["unverified", "pending", "verified", "disputed", "outdated"]).optional(),
  notes: z.string().nullish(),
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const guard = await requireRole("analyst");
  if (!guard.ok) return guard.response;
  const parsed = await parseBody(req, Update);
  if (!parsed.ok) return parsed.response;

  const updated = await prisma.evidence.update({
    where: { id: params.id },
    data: {
      ...parsed.data,
      confidenceScore: parsed.data.confidenceScore != null ? (parsed.data.confidenceScore as any) : undefined,
      verifiedById: parsed.data.verificationStatus === "verified" ? guard.session!.user.id : undefined,
      verifiedAt:   parsed.data.verificationStatus === "verified" ? new Date() : undefined,
    },
  });
  await writeAudit({
    entityType: "evidence", entityId: updated.id, action: "update",
    userId: guard.session!.user.id, changes: parsed.data as any,
  });
  return ok(updated);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const guard = await requireRole("admin");
  if (!guard.ok) return guard.response;
  await prisma.evidence.delete({ where: { id: params.id } });
  await writeAudit({
    entityType: "evidence", entityId: params.id, action: "delete",
    userId: guard.session!.user.id,
  });
  return ok({ deleted: params.id });
}
