import { prisma, Prisma } from "@elp/db";
import { z } from "zod";
import { ok, fail, parseBody } from "@/lib/api";
import { requireRole } from "@/lib/rbac";
import { writeAudit } from "@/lib/audit";

const Create = z.object({
  productCode: z.string().min(1),
  productNameEn: z.string().min(1),
  productNameAr: z.string().nullish(),
  category: z.string().min(1),
  subcategory: z.string().nullish(),
  descriptionEn: z.string().nullish(),
  descriptionAr: z.string().nullish(),
  industrySegment: z.enum(["oil_gas", "power", "renewables", "cross_sector"]),
  criticalityLevel: z.enum(["high", "medium", "low"]),
  strategicImportance: z.string().nullish(),
  hsCode: z.string().nullish(),
  priceRangeMin: z.number().nullish(),
  priceRangeMax: z.number().nullish(),
  priceCurrency: z.string().default("USD"),
  useCases: z.array(z.string()).default([]),
  technicalSpecs: z.record(z.any()).nullish(),
});

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q        = url.searchParams.get("q") ?? "";
  const category = url.searchParams.get("category");
  const segment  = url.searchParams.get("segment");
  const critical = url.searchParams.get("criticality");
  const gap      = url.searchParams.get("gap");
  const localized = url.searchParams.get("localized");
  const page     = Math.max(1, Number(url.searchParams.get("page") ?? 1));
  const pageSize = Math.min(100, Math.max(1, Number(url.searchParams.get("pageSize") ?? 25)));

  const where: Prisma.ProductWhereInput = {};
  if (q) {
    where.OR = [
      { productCode:   { contains: q, mode: "insensitive" } },
      { productNameEn: { contains: q, mode: "insensitive" } },
      { productNameAr: { contains: q, mode: "insensitive" } },
    ];
  }
  if (category)                      where.category         = category;
  if (segment)                       where.industrySegment  = segment as any;
  if (critical)                      where.criticalityLevel = critical as any;
  if (localized === "true")          where.localizationStatus = { isLocalized: true };
  if (localized === "false")         where.localizationStatus = { isLocalized: false };
  if (gap)                           where.gapAnalysis      = { localizationGap: gap as any };

  const [rows, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { localizationStatus: true, gapAnalysis: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.product.count({ where }),
  ]);

  return ok(rows, { page, pageSize, total });
}

export async function POST(req: Request) {
  const guard = await requireRole("analyst");
  if (!guard.ok) return guard.response;

  const parsed = await parseBody(req, Create);
  if (!parsed.ok) return parsed.response;

  try {
    const { priceRangeMin, priceRangeMax, technicalSpecs, ...rest } = parsed.data;
    const created = await prisma.product.create({
      data: {
        ...rest,
        priceRangeMin: priceRangeMin ?? undefined,
        priceRangeMax: priceRangeMax ?? undefined,
        technicalSpecs: technicalSpecs == null
          ? Prisma.JsonNull
          : (technicalSpecs as Prisma.InputJsonValue),
        approvalStatus: "draft",
        localizationStatus: { create: {} },
        gapAnalysis:       { create: {} },
      },
    });
    await writeAudit({
      entityType: "product", entityId: created.id, action: "create",
      userId: guard.session!.user.id, changes: parsed.data as any,
    });
    return ok(created);
  } catch (e: any) {
    if (e?.code === "P2002") return fail("duplicate_product_code", 409);
    return fail("server_error", 500, e?.message);
  }
}
