import { prisma } from "@elp/db";
import { z } from "zod";
import { ok, parseBody } from "@/lib/api";
import { requireRole } from "@/lib/rbac";
import { writeAudit } from "@/lib/audit";

const Link = z.object({
  manufacturerId: z.string().uuid(),
  relationshipType: z.enum(["primary_oem", "licensed", "assembler", "distributor"]),
  sinceYear: z.number().int().nullish(),
  verified: z.boolean().default(false),
  source: z.string().nullish(),
  notes: z.string().nullish(),
});

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const guard = await requireRole("analyst");
  if (!guard.ok) return guard.response;
  const parsed = await parseBody(req, Link);
  if (!parsed.ok) return parsed.response;

  const row = await prisma.productManufacturer.upsert({
    where: {
      productId_manufacturerId: {
        productId: params.id, manufacturerId: parsed.data.manufacturerId,
      },
    },
    update: parsed.data,
    create: { productId: params.id, ...parsed.data },
  });
  await writeAudit({
    entityType: "product_manufacturer",
    entityId: params.id,
    action: "link",
    userId: guard.session!.user.id,
    changes: parsed.data as any,
  });
  return ok(row);
}
