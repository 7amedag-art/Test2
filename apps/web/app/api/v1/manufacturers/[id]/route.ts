import { prisma } from "@elp/db";
import { z } from "zod";
import { ok, fail, parseBody } from "@/lib/api";
import { requireRole } from "@/lib/rbac";
import { writeAudit } from "@/lib/audit";

const Update = z.object({
  manufacturerName: z.string().optional(),
  isLocal: z.boolean().optional(),
  manufacturerType: z.enum(["global_oem", "local_manufacturer", "assembler", "distributor", "service_provider"]).optional(),
  localCapabilityLevel: z.enum(["full_manufacturing", "partial_manufacturing", "assembly_only", "non_manufacturing"]).optional(),
  country: z.string().optional(),
  city: z.string().nullish(),
  website: z.string().url().nullish(),
  capabilities: z.array(z.string()).optional(),
  certifications: z.array(z.string()).optional(),
  status: z.enum(["active", "new", "expanding", "inactive"]).optional(),
  establishedYear: z.number().int().nullish(),
  employeeCountRange: z.string().nullish(),
  verificationStatus: z.enum(["unverified", "pending", "verified", "disputed", "outdated"]).optional(),
  notes: z.string().nullish(),
});

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const [m, evidence] = await Promise.all([
    prisma.manufacturer.findUnique({
      where: { id: params.id },
      include: { products: { include: { product: true } } },
    }),
    prisma.evidence.findMany({
      where: { entityType: "manufacturer", entityId: params.id },
      orderBy: { createdAt: "desc" },
    }),
  ]);
  if (!m) return fail("not_found", 404);
  return ok({ ...m, evidence });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const guard = await requireRole("analyst");
  if (!guard.ok) return guard.response;
  const parsed = await parseBody(req, Update);
  if (!parsed.ok) return parsed.response;

  // Verification changes require an approval request (viewer-safe policy).
  if (parsed.data.verificationStatus) {
    // Log an ApprovalRequest for traceability.
    await prisma.approvalRequest.create({
      data: {
        entityType: "manufacturer_verification",
        entityId: params.id,
        action: "update",
        payloadDiff: { verificationStatus: parsed.data.verificationStatus } as any,
        status: "pending_review",
        requestedById: guard.session!.user.id,
      },
    });
  }

  const updated = await prisma.manufacturer.update({
    where: { id: params.id },
    data: {
      ...parsed.data,
      lastVerifiedAt: parsed.data.verificationStatus === "verified" ? new Date() : undefined,
    },
  });
  await writeAudit({
    entityType: "manufacturer", entityId: updated.id, action: "update",
    userId: guard.session!.user.id, changes: parsed.data as any,
  });
  return ok(updated);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const guard = await requireRole("admin");
  if (!guard.ok) return guard.response;
  await prisma.manufacturer.delete({ where: { id: params.id } });
  await writeAudit({
    entityType: "manufacturer", entityId: params.id, action: "delete",
    userId: guard.session!.user.id,
  });
  return ok({ deleted: params.id });
}
