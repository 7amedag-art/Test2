/**
 * Database seed — creates baseline users + a small sample dataset so the
 * platform is usable immediately. The full 105-product catalog is loaded
 * separately via `pnpm import:products` from the CSV template.
 */
import { PrismaClient, UserRole } from "@prisma/client";
import { createHash } from "node:crypto";

const prisma = new PrismaClient();

function hashPassword(plain: string): string {
  // Simple deterministic hash for dev seeds ONLY. Real auth flow replaces this
  // with bcrypt/argon2 at user creation time in the web app.
  return createHash("sha256").update(plain).digest("hex");
}

async function seedUsers() {
  const users = [
    { email: "admin@elp.local",   name: "System Admin",        role: UserRole.admin,   password: "admin123" },
    { email: "analyst@elp.local", name: "Localization Analyst", role: UserRole.analyst, password: "analyst123" },
    { email: "viewer@elp.local",  name: "Read-only Viewer",    role: UserRole.viewer,  password: "viewer123" },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: { name: u.name, role: u.role },
      create: {
        email: u.email,
        name: u.name,
        role: u.role,
        hashedPassword: hashPassword(u.password),
        emailVerified: new Date(),
      },
    });
  }
  console.log(`✓ Seeded ${users.length} users`);
}

async function seedSampleProducts() {
  const samples = [
    {
      productCode: "ELP-OG-001",
      productNameEn: "Industrial Gas Turbine (100–150 MW)",
      productNameAr: "توربين غازي صناعي (100–150 ميجاواط)",
      category: "Rotating Equipment",
      subcategory: "Gas Turbines",
      descriptionEn: "Heavy-duty industrial gas turbine for power generation and mechanical drive.",
      descriptionAr: "توربين غازي صناعي ثقيل لتوليد الكهرباء والتشغيل الميكانيكي.",
      industrySegment: "power" as const,
      criticalityLevel: "high" as const,
      strategicImportance: "Core asset for power generation; critical for grid stability.",
      hsCode: "8411.82",
      useCases: ["Power generation", "Mechanical drive", "Cogeneration"],
      technicalSpecs: { power_output_mw: "100-150", fuel: ["natural gas", "diesel"], efficiency_pct: "38-42" },
    },
    {
      productCode: "ELP-OG-002",
      productNameEn: "High-Pressure Centrifugal Compressor",
      productNameAr: "ضاغط طرد مركزي عالي الضغط",
      category: "Rotating Equipment",
      subcategory: "Compressors",
      descriptionEn: "Multi-stage centrifugal compressor for upstream gas processing.",
      descriptionAr: "ضاغط طرد مركزي متعدد المراحل لمعالجة الغاز في المنبع.",
      industrySegment: "oil_gas" as const,
      criticalityLevel: "high" as const,
      strategicImportance: "Essential for gas gathering, processing and re-injection.",
      hsCode: "8414.80",
      useCases: ["Gas re-injection", "Gas processing", "Pipeline boosting"],
      technicalSpecs: { pressure_bar: "up to 350", flow_mmscfd: "50-400" },
    },
    {
      productCode: "ELP-RE-003",
      productNameEn: "Photovoltaic Module (Bifacial, 540–600 W)",
      productNameAr: "لوح كهروضوئي ثنائي الوجه (540–600 واط)",
      category: "Renewables",
      subcategory: "PV Modules",
      descriptionEn: "Utility-scale bifacial PV module suitable for desert environments.",
      descriptionAr: "لوح كهروضوئي ثنائي الوجه للمشاريع الكبيرة في البيئات الصحراوية.",
      industrySegment: "renewables" as const,
      criticalityLevel: "medium" as const,
      strategicImportance: "High-volume commodity for solar programs (Vision 2030 target: 58 GW solar).",
      hsCode: "8541.42",
      useCases: ["Utility-scale solar", "Commercial rooftop"],
      technicalSpecs: { rated_power_w: "540-600", technology: "bifacial N-type", efficiency_pct: "21-22.5" },
    },
  ];

  for (const p of samples) {
    await prisma.product.upsert({
      where: { productCode: p.productCode },
      update: {},
      create: {
        productCode: p.productCode,
        productNameEn: p.productNameEn,
        productNameAr: p.productNameAr,
        category: p.category,
        subcategory: p.subcategory,
        descriptionEn: p.descriptionEn,
        descriptionAr: p.descriptionAr,
        industrySegment: p.industrySegment,
        criticalityLevel: p.criticalityLevel,
        strategicImportance: p.strategicImportance,
        hsCode: p.hsCode,
        useCases: p.useCases,
        technicalSpecs: p.technicalSpecs,
        approvalStatus: "approved",
        localizationStatus: {
          create: {
            isLocalized: false,
            localManufacturersCount: 0,
            localizationPercentage: 0,
            supplyRiskLevel: "high",
            notes: "Sample seed — needs review by analyst.",
            approvalStatus: "draft",
          },
        },
        gapAnalysis: {
          create: {
            demandScore: 80,
            strategicScore: 90,
            localizationScore: 10,
            manufacturingComplexityScore: 70,
            supplyRiskScore: 75,
            finalOpportunityScore: 78,
            localizationGap: "high",
            recommendation: "need_local_manufacturing",
            rationale: "High demand and strategic importance combined with near-zero local content.",
            approvalStatus: "draft",
          },
        },
      },
    });
  }
  console.log(`✓ Seeded ${samples.length} sample products`);
}

async function seedSampleManufacturers() {
  const samples = [
    {
      manufacturerName: "Siemens Energy",
      isLocal: false,
      manufacturerType: "global_oem" as const,
      localCapabilityLevel: "non_manufacturing" as const,
      country: "Germany",
      capabilities: ["gas turbines", "generators", "transformers"],
      certifications: ["ISO 9001", "API 616"],
      status: "active" as const,
      verificationStatus: "verified" as const,
    },
    {
      manufacturerName: "Dussur (Saudi Arabian Industrial Investments Co.)",
      isLocal: true,
      manufacturerType: "local_manufacturer" as const,
      localCapabilityLevel: "partial_manufacturing" as const,
      country: "Saudi Arabia",
      city: "Riyadh",
      capabilities: ["industrial JVs", "heavy equipment"],
      certifications: ["ISO 9001"],
      status: "expanding" as const,
      verificationStatus: "verified" as const,
    },
    {
      manufacturerName: "Desert Technologies",
      isLocal: true,
      manufacturerType: "local_manufacturer" as const,
      localCapabilityLevel: "assembly_only" as const,
      country: "Saudi Arabia",
      city: "Jeddah",
      capabilities: ["PV module assembly"],
      certifications: ["IEC 61215", "IEC 61730"],
      status: "active" as const,
      verificationStatus: "pending" as const,
    },
  ];

  for (const m of samples) {
    await prisma.manufacturer.upsert({
      where: { id: m.manufacturerName }, // placeholder; upsert by name via findFirst
      update: {},
      create: m as any,
    }).catch(async () => {
      const exists = await prisma.manufacturer.findFirst({ where: { manufacturerName: m.manufacturerName } });
      if (!exists) await prisma.manufacturer.create({ data: m as any });
    });
  }
  console.log(`✓ Seeded sample manufacturers`);
}

async function main() {
  console.log("▶ Seeding database…");
  await seedUsers();
  await seedSampleProducts();
  await seedSampleManufacturers();
  console.log("✅ Seed complete.");
}

main()
  .catch((e) => {
    console.error("✗ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
