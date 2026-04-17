import { prisma } from "@elp/db";
import { z } from "zod";
import { ok, fail, parseBody } from "@/lib/api";
import { requireRole } from "@/lib/rbac";
import { writeAudit } from "@/lib/audit";

const Update = z.object({
  productNameEn: z.string().optional(),
  productNameAr: z.string().nullish(),
  category: z.string().optional(),
  subcategory: z.string().nullish(),
  descriptionEn: z.string().nullish(),
  descriptionAr: z.string().nullish(),
  industrySegment: z.enum(["oil_gas", "power", "renewables", "cross_sector"]).optional(),
  criticalityLevel: z.enum(["high", "medium", "low"]).optional(),
  strategicImportance: z.string().nullish(),
  hsCode: z.string().nullish(),
  priceRangeMin: z.number().nullish(),
  priceRangeMax: z.number().nullish(),
  priceCurrency: z.string().optional(),
  useCases: z.array(z.string()).optional(),
  technicalSpecs: z.record(z.any()).nullish(),
  approvalStatus: z.enum(["draft", "pending_review", "approved", "rejected", "archived"]).optional(),
});

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const product = await prisma.product.findUnique({
    where: { id: params.id },
    include: {
      manufacturers: { include: { manufacturer: true } },
      localizationStatus: true,
      gapAnalysis: true,
      documents: true,
    },
  });
  if (!product) return fail("not_found", 404);
  return ok(product);
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const guard = await requireRole("analyst");
  if (!guard.ok) return guard.response;
  const parsed = await parseBody(req, Update);
  if (!parsed.ok) return parsed.response;

  const updated = await prisma.product.update({
    where: { id: params.id },
    data: {
      ...parsed.data,
      priceRangeMin: parsed.data.priceRangeMin != null ? (parsed.data.priceRangeMin as any) : undefined,
      priceRangeMax: parsed.data.priceRangeMax != null ? (parsed.data.priceRangeMax as any) : undefined,
    },
  });
  await writeAudit({
    entityType: "product", entityId: updated.id, action: "update",
    userId: guard.session!.user.id, changes: parsed.data as any,
  });
  return ok(updated);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const guard = await requireRole("admin");
  if (!guard.ok) return guard.response;
  await prisma.product.delete({ where: { id: params.id } });
  await writeAudit({
    entityType: "product", entityId: params.id, action: "delete",
    userId: guard.session!.user.id,
  });
  return ok({ deleted: params.id });
}
