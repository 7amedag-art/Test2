import { prisma } from "@elp/db";
import { z } from "zod";
import { ok, fail, parseBody } from "@/lib/api";
import { requireRole } from "@/lib/rbac";
import { writeAudit } from "@/lib/audit";

const Update = z.object({
  isLocalized: z.boolean().optional(),
  localManufacturersCount: z.number().int().min(0).optional(),
  localizationPercentage: z.number().min(0).max(100).optional(),
  supplyRiskLevel: z.enum(["critical", "high", "medium", "low"]).optional(),
  notes: z.string().nullish(),
  approvalStatus: z.enum(["draft", "pending_review", "approved", "rejected", "archived"]).optional(),
});

export async function PATCH(req: Request, { params }: { params: { productId: string } }) {
  const guard = await requireRole("analyst");
  if (!guard.ok) return guard.response;
  const parsed = await parseBody(req, Update);
  if (!parsed.ok) return parsed.response;

  // Any localization change logs an approval request for audit + review.
  await prisma.approvalRequest.create({
    data: {
      entityType: "localization_status",
      entityId: params.productId,
      action: "update",
      payloadDiff: parsed.data as any,
      status: guard.session!.user.role === "admin" ? "approved" : "pending_review",
      requestedById: guard.session!.user.id,
      decidedById: guard.session!.user.role === "admin" ? guard.session!.user.id : undefined,
      decidedAt:   guard.session!.user.role === "admin" ? new Date() : undefined,
    },
  });

  const updated = await prisma.localizationStatus.update({
    where: { productId: params.productId },
    data: {
      ...parsed.data,
      localizationPercentage: parsed.data.localizationPercentage != null
        ? (parsed.data.localizationPercentage as any) : undefined,
      reviewedById: guard.session!.user.id,
      reviewedAt: new Date(),
      lastReviewedAt: new Date(),
    },
  });
  await writeAudit({
    entityType: "localization_status", entityId: params.productId, action: "update",
    userId: guard.session!.user.id, changes: parsed.data as any,
  });
  return ok(updated);
}
