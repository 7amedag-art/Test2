import { prisma, type Prisma } from "@elp/db";
import { z } from "zod";
import { ok, fail, parseBody } from "@/lib/api";
import { requireRole } from "@/lib/rbac";
import { writeAudit } from "@/lib/audit";

const Create = z.object({
  manufacturerName: z.string().min(1),
  isLocal: z.boolean().default(false),
  manufacturerType: z.enum(["global_oem", "local_manufacturer", "assembler", "distributor", "service_provider"]),
  localCapabilityLevel: z.enum(["full_manufacturing", "partial_manufacturing", "assembly_only", "non_manufacturing"]).default("non_manufacturing"),
  country: z.string().min(1),
  city: z.string().nullish(),
  website: z.string().url().nullish(),
  capabilities: z.array(z.string()).default([]),
  certifications: z.array(z.string()).default([]),
  status: z.enum(["active", "new", "expanding", "inactive"]).default("active"),
  establishedYear: z.number().int().nullish(),
  employeeCountRange: z.string().nullish(),
  verificationStatus: z.enum(["unverified", "pending", "verified", "disputed", "outdated"]).default("unverified"),
  notes: z.string().nullish(),
});

export async function GET(req: Request) {
  const url = new URL(req.url);
  const isLocal = url.searchParams.get("is_local");
  const q = url.searchParams.get("q") ?? "";
  const where: Prisma.ManufacturerWhereInput = {};
  if (isLocal === "true")  where.isLocal = true;
  if (isLocal === "false") where.isLocal = false;
  if (q) where.manufacturerName = { contains: q, mode: "insensitive" };
  const rows = await prisma.manufacturer.findMany({
    where, orderBy: { manufacturerName: "asc" }, take: 200,
  });
  return ok(rows, { total: rows.length });
}

export async function POST(req: Request) {
  const guard = await requireRole("analyst");
  if (!guard.ok) return guard.response;
  const parsed = await parseBody(req, Create);
  if (!parsed.ok) return parsed.response;

  const created = await prisma.manufacturer.create({ data: parsed.data });
  await writeAudit({
    entityType: "manufacturer", entityId: created.id, action: "create",
    userId: guard.session!.user.id, changes: parsed.data as any,
  });
  return ok(created);
}
