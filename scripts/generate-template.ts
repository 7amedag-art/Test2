/**
 * Regenerates the canonical CSV templates in `data/templates/`.
 * Useful when the schema evolves — keeps user-facing templates in sync.
 *
 * Run: pnpm template:generate
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";

const ROOT = resolve(__dirname, "..");
const OUT = resolve(ROOT, "data/templates");

type ColSpec = { name: string; example: string; notes?: string };

const productsColumns: ColSpec[] = [
  { name: "product_code",        example: "ELP-OG-001", notes: "unique; stable identifier" },
  { name: "product_name_en",     example: "Industrial Gas Turbine (100-150 MW)" },
  { name: "product_name_ar",     example: "توربين غازي صناعي (100-150 ميجاواط)" },
  { name: "category",            example: "Rotating Equipment" },
  { name: "subcategory",         example: "Gas Turbines" },
  { name: "sector",              example: "power", notes: "oil_gas|petrochemicals|power|renewables" },
  { name: "segment",             example: "generation", notes: "free-form sub-industry (upstream, olefins, solar_pv, …)" },
  { name: "short_description_en", example: "Heavy-duty gas turbine for power generation." },
  { name: "short_description_ar", example: "توربين غازي ثقيل لتوليد الكهرباء." },
  { name: "hs_code",             example: "8411.82" },
  { name: "criticality_level",   example: "high",   notes: "high|medium|low" },
  { name: "complexity_level",    example: "high",   notes: "low|medium|high|very_high" },
  { name: "localization_potential", example: "medium", notes: "low|medium|high|very_high" },
  { name: "strategic_priority_score", example: "85", notes: "0-100 integer" },
  { name: "notes",               example: "Critical for grid stability." },
];

const manufacturersColumns: ColSpec[] = [
  { name: "manufacturer_name", example: "Siemens Energy", notes: "must be unique" },
  { name: "is_local", example: "false", notes: "true|false" },
  { name: "manufacturer_type", example: "global_oem",
    notes: "global_oem|local_manufacturer|assembler|distributor|service_provider" },
  { name: "local_capability_level", example: "non_manufacturing",
    notes: "full_manufacturing|partial_manufacturing|assembly_only|non_manufacturing" },
  { name: "country", example: "Germany" },
  { name: "city", example: "" },
  { name: "website", example: "https://…" },
  { name: "capabilities", example: "gas turbines;generators", notes: "semicolon-separated" },
  { name: "certifications", example: "ISO 9001;API 616", notes: "semicolon-separated" },
  { name: "status", example: "active", notes: "active|new|expanding|inactive" },
  { name: "established_year", example: "2020" },
  { name: "employee_count_range", example: "10000+" },
  { name: "verification_status", example: "verified",
    notes: "unverified|pending|verified|disputed|outdated" },
  { name: "notes", example: "Global OEM" },
];

const linksColumns: ColSpec[] = [
  { name: "product_code", example: "ELP-OG-001" },
  { name: "manufacturer_name", example: "Siemens Energy" },
  { name: "relationship_type", example: "primary_oem",
    notes: "primary_oem|licensed|assembler|distributor" },
  { name: "since_year", example: "2005" },
  { name: "verified", example: "true" },
  { name: "source", example: "Public OEM catalog" },
  { name: "notes", example: "" },
];

function toCsv(cols: ColSpec[], rows: string[][]): string {
  const header = cols.map((c) => c.name).join(",");
  const body = rows.map((r) => r.map(escape).join(",")).join("\n");
  return header + "\n" + body + "\n";
}
function escape(v: string): string {
  if (v.includes(",") || v.includes('"') || v.includes("\n")) {
    return `"${v.replace(/"/g, '""')}"`;
  }
  return v;
}

function write(name: string, cols: ColSpec[], rows: string[][]) {
  const path = resolve(OUT, name);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, toCsv(cols, rows));
  console.log(`✓ Wrote ${path}`);
  // Also write a README describing columns
  const readme = cols
    .map((c) => `- **${c.name}** — ${c.notes ?? ""} (e.g. \`${c.example}\`)`)
    .join("\n");
  writeFileSync(path.replace(/\.csv$/, ".md"),
    `# ${name} — column reference\n\n${readme}\n`);
}

write("products_template.csv", productsColumns, [
  productsColumns.map((c) => c.example),
]);
write("manufacturers_template.csv", manufacturersColumns, [
  manufacturersColumns.map((c) => c.example),
]);
write("product_manufacturer_links_template.csv", linksColumns, [
  linksColumns.map((c) => c.example),
]);
console.log("✅ Templates regenerated.");
