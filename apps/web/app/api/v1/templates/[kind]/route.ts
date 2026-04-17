import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { fail } from "@/lib/api";

const FILES: Record<string, string> = {
  products:      "data/templates/products_template.csv",
  manufacturers: "data/templates/manufacturers_template.csv",
  links:         "data/templates/product_manufacturer_links_template.csv",
};

export async function GET(_req: Request, { params }: { params: { kind: string } }) {
  const rel = FILES[params.kind];
  if (!rel) return fail("unknown_template", 404);
  // Resolved from monorepo root (process.cwd() when run via `pnpm dev` in apps/web)
  // so look two levels up if needed.
  const candidates = [resolve(process.cwd(), rel), resolve(process.cwd(), "..", "..", rel)];
  const path = candidates.find(existsSync);
  if (!path) return fail("template_file_missing", 500);

  const body = readFileSync(path, "utf8");
  return new Response(body, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${params.kind}_template.csv"`,
    },
  });
}
