/**
 * CSV import pipeline — loads products, manufacturers, and their links.
 *
 * Usage:
 *   pnpm import:products --products ./data/seed/products.csv
 *   pnpm import:products \
 *     --products      ./data/seed/products.csv \
 *     --manufacturers ./data/seed/manufacturers.csv \
 *     --links         ./data/seed/links.csv
 *
 * The schema is designed so the analyst can edit the CSV template at
 * `data/templates/*.csv`, rename it into `data/seed/*.csv`, and re-run
 * this command without any code changes.
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { parse } from "csv-parse/sync";
import { PrismaClient, type Prisma } from "@prisma/client";

const prisma = new PrismaClient();

// ------------------------------ CLI args ------------------------------
function arg(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

const productsPath      = arg("--products")      ?? "data/seed/products.csv";
const manufacturersPath = arg("--manufacturers") ?? "data/seed/manufacturers.csv";
const linksPath         = arg("--links")         ?? "data/seed/links.csv";
const dryRun            = process.argv.includes("--dry-run");

// ------------------------------ helpers ------------------------------
function readCsv(path: string): Record<string, string>[] {
  const full = resolve(process.cwd(), path);
  if (!existsSync(full)) {
    console.warn(`⚠ skipping (not found): ${full}`);
    return [];
  }
  const content = readFileSync(full, "utf8");
  return parse(content, { columns: true, skip_empty_lines: true, trim: true });
}

function splitList(v: string | undefined): string[] {
  if (!v) return [];
  return v.split(";").map((s) => s.trim()).filter(Boolean);
}

function parseJsonOrNull(v: string | undefined): Prisma.InputJsonValue | undefined {
  if (!v) return undefined;
  try { return JSON.parse(v); } catch { return undefined; }
}

function toBool(v: string | undefined): boolean {
  return (v ?? "").toLowerCase() === "true";
}

function toIntOrNull(v: string | undefined): number | null {
  if (!v) return null;
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : null;
}

function toDecimalOrNull(v: string | undefined): string | null {
  if (!v) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n.toString() : null;
}

// ------------------------------ importers ------------------------------
async function importProducts() {
  const rows = readCsv(productsPath);
  let inserted = 0, updated = 0;
  for (const r of rows) {
    const data = {
      productCode: r.product_code,
      productNameEn: r.product_name_en,
      productNameAr: r.product_name_ar || null,
      category: r.category,
      subcategory: r.subcategory || null,
      descriptionEn: r.description_en || null,
      descriptionAr: r.description_ar || null,
      industrySegment: (r.industry_segment || "cross_sector") as any,
      criticalityLevel: (r.criticality_level || "medium") as any,
      strategicImportance: r.strategic_importance || null,
      hsCode: r.hs_code || null,
      priceRangeMin: toDecimalOrNull(r.price_range_min),
      priceRangeMax: toDecimalOrNull(r.price_range_max),
      priceCurrency: r.price_currency || "USD",
      useCases: splitList(r.use_cases),
      technicalSpecs: parseJsonOrNull(r.technical_specs_json) ?? undefined,
      approvalStatus: "pending_review" as any,
    };

    if (dryRun) { console.log("[dry-run] product:", data.productCode); continue; }

    const existing = await prisma.product.findUnique({ where: { productCode: r.product_code } });
    const res = await prisma.product.upsert({
      where: { productCode: r.product_code },
      update: data,
      create: data,
    });
    // Ensure shell rows exist for localization & gap so downstream queries don't fail.
    await prisma.localizationStatus.upsert({
      where: { productId: res.id },
      update: {},
      create: { productId: res.id },
    });
    await prisma.gapAnalysis.upsert({
      where: { productId: res.id },
      update: {},
      create: { productId: res.id },
    });

    existing ? updated++ : inserted++;
  }
  console.log(`✓ products — inserted ${inserted}, updated ${updated}`);
}

async function importManufacturers() {
  const rows = readCsv(manufacturersPath);
  let inserted = 0, updated = 0;
  for (const r of rows) {
    const data = {
      manufacturerName: r.manufacturer_name,
      isLocal: toBool(r.is_local),
      manufacturerType: (r.manufacturer_type || "global_oem") as any,
      localCapabilityLevel: (r.local_capability_level || "non_manufacturing") as any,
      country: r.country || "Unknown",
      city: r.city || null,
      website: r.website || null,
      capabilities: splitList(r.capabilities),
      certifications: splitList(r.certifications),
      status: (r.status || "active") as any,
      establishedYear: toIntOrNull(r.established_year),
      employeeCountRange: r.employee_count_range || null,
      verificationStatus: (r.verification_status || "unverified") as any,
      notes: r.notes || null,
    };

    if (dryRun) { console.log("[dry-run] manufacturer:", data.manufacturerName); continue; }

    const existing = await prisma.manufacturer.findFirst({
      where: { manufacturerName: data.manufacturerName },
    });
    if (existing) {
      await prisma.manufacturer.update({ where: { id: existing.id }, data });
      updated++;
    } else {
      await prisma.manufacturer.create({ data });
      inserted++;
    }
  }
  console.log(`✓ manufacturers — inserted ${inserted}, updated ${updated}`);
}

async function importLinks() {
  const rows = readCsv(linksPath);
  let linked = 0;
  for (const r of rows) {
    const product = await prisma.product.findUnique({ where: { productCode: r.product_code } });
    const manufacturer = await prisma.manufacturer.findFirst({
      where: { manufacturerName: r.manufacturer_name },
    });
    if (!product || !manufacturer) {
      console.warn(`⚠ skipping link ${r.product_code} ↔ ${r.manufacturer_name} (not found)`);
      continue;
    }
    const data = {
      productId: product.id,
      manufacturerId: manufacturer.id,
      relationshipType: (r.relationship_type || "primary_oem") as any,
      sinceYear: toIntOrNull(r.since_year),
      verified: toBool(r.verified),
      source: r.source || null,
      notes: r.notes || null,
    };
    if (dryRun) { console.log("[dry-run] link:", r.product_code, "↔", r.manufacturer_name); continue; }
    await prisma.productManufacturer.upsert({
      where: {
        productId_manufacturerId: {
          productId: product.id,
          manufacturerId: manufacturer.id,
        },
      },
      update: data,
      create: data,
    });
    linked++;
  }
  console.log(`✓ links — ${linked} relationships upserted`);
}

async function main() {
  console.log("▶ Importing from:");
  console.log("   products:      ", productsPath);
  console.log("   manufacturers: ", manufacturersPath);
  console.log("   links:         ", linksPath);
  if (dryRun) console.log("   mode: DRY RUN (no writes)");

  await importManufacturers();
  await importProducts();
  await importLinks();
  console.log("✅ Import complete.");
}

main()
  .catch((e) => { console.error("✗ Import failed:", e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
