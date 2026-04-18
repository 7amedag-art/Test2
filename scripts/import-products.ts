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

function toNumOr(v: string | undefined, fallback: number): number {
  if (!v) return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

// Sector names in the canonical dataset map onto the IndustrySegment enum.
// Petrochemicals has no dedicated enum value yet, so it falls under
// cross_sector; the original sector label is preserved in technical_specs.
const SECTOR_TO_SEGMENT: Record<string, string> = {
  oil_gas:        "oil_gas",
  "oil & gas":    "oil_gas",
  oilgas:         "oil_gas",
  petrochemicals: "cross_sector",
  petrochem:      "cross_sector",
  power:          "power",
  "conventional power": "power",
  conventional_power:   "power",
  renewables:     "renewables",
  "renewable energy":   "renewables",
  renewable_energy:     "renewables",
};

// Convert a qualitative level ("low" / "medium" / "high" / "very_high") into a
// numeric 0-100 score used by GapAnalysis. Unknown inputs default to 50.
function levelToScore(v: string | undefined): number {
  const s = (v ?? "").toLowerCase().trim();
  if (s === "very_high" || s === "very high") return 95;
  if (s === "high")   return 80;
  if (s === "medium" || s === "mid") return 55;
  if (s === "low")    return 25;
  const n = Number(s);
  return Number.isFinite(n) ? Math.max(0, Math.min(100, n)) : 50;
}

// ------------------------------ importers ------------------------------
async function importProducts() {
  const rows = readCsv(productsPath);
  let inserted = 0, updated = 0;
  for (const r of rows) {
    // Support both the original schema (industry_segment / description_en /
    // strategic_importance / technical_specs_json) and the canonical dataset
    // schema (sector / segment / short_description_* / complexity_level /
    // localization_potential / strategic_priority_score / notes).
    const sectorRaw = (r.sector || r.industry_segment || "cross_sector").toLowerCase();
    const industrySegment = SECTOR_TO_SEGMENT[sectorRaw] ?? "cross_sector";
    const segment = r.segment || null;
    const descEn  = r.short_description_en || r.description_en || null;
    const descAr  = r.short_description_ar || r.description_ar || null;
    const notes   = r.notes || r.strategic_importance || null;

    // Build technical_specs JSON. Prefer an explicit JSON blob if the old
    // schema is used; otherwise synthesize a small object that preserves
    // the sector label and qualitative levels for future filtering.
    let specs = parseJsonOrNull(r.technical_specs_json);
    if (!specs) {
      const built: Record<string, string> = {};
      if (r.sector)                built.sector               = r.sector;
      if (segment)                 built.segment              = segment;
      if (r.complexity_level)      built.complexity_level     = r.complexity_level;
      if (r.localization_potential) built.localization_potential = r.localization_potential;
      specs = Object.keys(built).length ? (built as Prisma.InputJsonValue) : undefined;
    }

    const data = {
      productCode: r.product_code,
      productNameEn: r.product_name_en,
      productNameAr: r.product_name_ar || null,
      category: r.category,
      subcategory: r.subcategory || null,
      descriptionEn: descEn,
      descriptionAr: descAr,
      industrySegment: industrySegment as any,
      criticalityLevel: (r.criticality_level || "medium") as any,
      strategicImportance: notes,
      hsCode: r.hs_code || null,
      priceRangeMin: toDecimalOrNull(r.price_range_min),
      priceRangeMax: toDecimalOrNull(r.price_range_max),
      priceCurrency: r.price_currency || "USD",
      useCases: splitList(r.use_cases),
      technicalSpecs: specs,
      approvalStatus: "pending_review" as any,
    };

    if (dryRun) { console.log("[dry-run] product:", data.productCode); continue; }

    const existing = await prisma.product.findUnique({ where: { productCode: r.product_code } });
    const res = await prisma.product.upsert({
      where: { productCode: r.product_code },
      update: data,
      create: data,
    });

    // Seed gap-analysis shell from the qualitative fields so analysts see
    // meaningful initial numbers; full recomputation happens in Phase 2.
    const strategicScore   = toNumOr(r.strategic_priority_score, 60);
    const complexityScore  = levelToScore(r.complexity_level);
    const localizationPot  = levelToScore(r.localization_potential);
    // Localization potential is a capability ceiling, not current state:
    // store current localization score as 0 (no data yet) and keep the
    // potential on the manufacturing complexity axis + strategic axis.

    await prisma.localizationStatus.upsert({
      where: { productId: res.id },
      update: {},
      create: { productId: res.id },
    });
    await prisma.gapAnalysis.upsert({
      where: { productId: res.id },
      update: {
        strategicScore,
        manufacturingComplexityScore: complexityScore,
      },
      create: {
        productId: res.id,
        strategicScore,
        manufacturingComplexityScore: complexityScore,
        // seed other components at neutral defaults; Phase 2 recomputes.
        demandScore: 60,
        localizationScore: 0,
        supplyRiskScore: Math.max(0, 100 - localizationPot),
        finalOpportunityScore: Math.round(
          (strategicScore * 0.4) +
          ((100 - localizationPot) * 0.3) +
          (complexityScore * 0.3),
        ),
      },
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
