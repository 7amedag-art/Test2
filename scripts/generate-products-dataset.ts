/**
 * Canonical 150-product dataset generator.
 *
 * STEP 1 scaffold: types, sector buckets, code generator, CSV writer, and
 * validation. The per-sector product arrays are intentionally empty here —
 * they are populated in the next step.
 *
 * Run:
 *   pnpm tsx scripts/generate-products-dataset.ts [output.csv]
 *   # default output: data/seed/products.csv
 *
 * The emitted CSV matches the canonical 15-column contract consumed by
 * scripts/import-products.ts.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";

// ============================================================
// Types (15 canonical columns)
// ============================================================

export type Sector =
  | "oil_gas"
  | "petrochemicals"
  | "power"
  | "renewables";

export type CriticalityLevel     = "high" | "medium" | "low";
export type ComplexityLevel      = "low" | "medium" | "high" | "very_high";
export type LocalizationPotential = "low" | "medium" | "high" | "very_high";

/** Emitted row — mirrors the CSV header 1:1. */
export interface ProductRow {
  product_code:              string;
  product_name_en:           string;
  product_name_ar:           string;
  category:                  string;
  subcategory:               string;
  sector:                    Sector;
  segment:                   string;
  short_description_en:      string;
  short_description_ar:      string;
  hs_code:                   string;
  criticality_level:         CriticalityLevel;
  complexity_level:          ComplexityLevel;
  localization_potential:    LocalizationPotential;
  strategic_priority_score:  number; // 0-100 integer
  notes:                     string;
}

/**
 * Author-time shape: everything except the code and sector (those are
 * stamped in by the aggregator so authors can't accidentally desync them).
 */
export type RawProduct = Omit<ProductRow, "product_code" | "sector">;

// ============================================================
// Sector configuration
// ============================================================

/**
 * Target distribution across the four sectors (Saudi-relevant):
 *   Oil & Gas        55  (upstream, midstream, downstream support equipment)
 *   Petrochemicals   30  (Aramco/SABIC downstream reactors, polymers, utilities)
 *   Conventional Power 30 (steam cycle, transformers, switchgear, cables)
 *   Renewables       35  (Vision 2030: PV, CSP, wind, BESS, H2, grid)
 *   ─────
 *   Total           150
 *
 * Skewed toward O&G + renewables on purpose: O&G remains the capital-project
 * spine; renewables is where Vision 2030 localization pressure is highest.
 */
interface SectorConfig {
  sector:      Sector;
  codePrefix:  string;        // e.g. "ELP-OG"
  targetCount: number;        // must equal products.length
  products:    RawProduct[];  // populated in the next step
}

export const SECTORS: SectorConfig[] = [
  { sector: "oil_gas",        codePrefix: "ELP-OG", targetCount: 55, products: [] },
  { sector: "petrochemicals", codePrefix: "ELP-PC", targetCount: 30, products: [] },
  { sector: "power",          codePrefix: "ELP-CP", targetCount: 30, products: [] },
  { sector: "renewables",     codePrefix: "ELP-RE", targetCount: 35, products: [] },
];

// ============================================================
// Convenience builder
//
// Keeps per-product author blocks terse when populating 150 entries: most
// fields are required, but a single call site is easier to grep and diff
// than an object literal with 13 named props.
// ============================================================

export function p(
  category:  string,
  subcategory: string,
  segment:   string,
  nameEn:    string,
  nameAr:    string,
  descEn:    string,
  descAr:    string,
  hsCode:    string,
  criticality:  CriticalityLevel,
  complexity:   ComplexityLevel,
  localization: LocalizationPotential,
  priorityScore: number,
  notes: string,
): RawProduct {
  return {
    product_name_en:          nameEn,
    product_name_ar:          nameAr,
    category,
    subcategory,
    segment,
    short_description_en:     descEn,
    short_description_ar:     descAr,
    hs_code:                  hsCode,
    criticality_level:        criticality,
    complexity_level:         complexity,
    localization_potential:   localization,
    strategic_priority_score: priorityScore,
    notes,
  };
}

// ============================================================
// Code generator — deterministic, zero-padded, unique by sector
// ============================================================

function generateCode(prefix: string, indexZeroBased: number): string {
  return `${prefix}-${String(indexZeroBased + 1).padStart(3, "0")}`;
}

// ============================================================
// Aggregator + validation
// ============================================================

export function buildDataset(): ProductRow[] {
  const rows: ProductRow[] = [];
  const seenCodes = new Set<string>();
  const seenNames = new Set<string>();

  for (const cfg of SECTORS) {
    if (cfg.products.length !== cfg.targetCount) {
      throw new Error(
        `sector ${cfg.sector}: expected ${cfg.targetCount} products, got ${cfg.products.length}`,
      );
    }
    cfg.products.forEach((raw, i) => {
      const code = generateCode(cfg.codePrefix, i);
      if (seenCodes.has(code)) throw new Error(`duplicate product_code: ${code}`);
      seenCodes.add(code);

      const nameKey = raw.product_name_en.trim().toLowerCase();
      if (seenNames.has(nameKey)) {
        throw new Error(`duplicate product_name_en across sectors: "${raw.product_name_en}"`);
      }
      seenNames.add(nameKey);

      if (raw.strategic_priority_score < 0 || raw.strategic_priority_score > 100) {
        throw new Error(`${code}: strategic_priority_score out of range`);
      }

      rows.push({ ...raw, product_code: code, sector: cfg.sector });
    });
  }

  if (rows.length !== 150) throw new Error(`expected 150 rows, got ${rows.length}`);
  return rows;
}

// ============================================================
// CSV writer
// ============================================================

const COLUMNS: (keyof ProductRow)[] = [
  "product_code",
  "product_name_en",
  "product_name_ar",
  "category",
  "subcategory",
  "sector",
  "segment",
  "short_description_en",
  "short_description_ar",
  "hs_code",
  "criticality_level",
  "complexity_level",
  "localization_potential",
  "strategic_priority_score",
  "notes",
];

function csvEscape(v: string | number): string {
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(rows: ProductRow[]): string {
  const header = COLUMNS.join(",");
  const body = rows
    .map((r) => COLUMNS.map((c) => csvEscape((r as unknown as Record<string, unknown>)[c] as string | number)).join(","))
    .join("\n");
  return header + "\n" + body + "\n";
}

// ============================================================
// CLI
// ============================================================

function main() {
  const outPath = resolve(process.cwd(), process.argv[2] ?? "data/seed/products.csv");
  const rows = buildDataset();

  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, toCsv(rows));

  const bySector = rows.reduce<Record<string, number>>((acc, r) => {
    acc[r.sector] = (acc[r.sector] ?? 0) + 1;
    return acc;
  }, {});
  console.log(`✓ wrote ${rows.length} products to ${outPath}`);
  console.log("sector breakdown:", bySector);
}

// Only execute when invoked directly (guard lets the file be imported for tests).
if (require.main === module) {
  main();
}
