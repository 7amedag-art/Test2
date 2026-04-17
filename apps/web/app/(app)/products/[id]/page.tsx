import { notFound } from "next/navigation";
import { prisma } from "@elp/db";
import { getLocale } from "@/lib/i18n/locale";
import { getMessages } from "@/lib/i18n/messages";

export const dynamic = "force-dynamic";

export default async function ProductDetail({ params }: { params: { id: string } }) {
  const locale = getLocale();
  const m = getMessages(locale);
  const product = await prisma.product.findUnique({
    where: { id: params.id },
    include: {
      manufacturers: { include: { manufacturer: true } },
      localizationStatus: true,
      gapAnalysis: true,
      evidence: true,
      documents: true,
    },
  });
  if (!product) notFound();

  const name = locale === "ar" ? product.productNameAr ?? product.productNameEn : product.productNameEn;

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <div className="text-xs text-ink-500 font-mono">{product.productCode}</div>
          <h1 className="text-2xl font-semibold">{name}</h1>
        </div>
        <div className="flex gap-2">
          <span className="badge badge-blue">{m.segments[product.industrySegment]}</span>
          <span className="badge badge-amber">{m.criticality[product.criticalityLevel]}</span>
        </div>
      </header>

      <section className="grid md:grid-cols-3 gap-4">
        <div className="card p-5 col-span-2">
          <h2 className="text-lg font-medium mb-2">Overview</h2>
          <p className="text-sm text-ink-700 whitespace-pre-line">
            {locale === "ar" ? product.descriptionAr ?? product.descriptionEn : product.descriptionEn ?? "—"}
          </p>
          {product.strategicImportance && (
            <>
              <h3 className="mt-4 text-sm font-medium">Strategic importance</h3>
              <p className="text-sm text-ink-700">{product.strategicImportance}</p>
            </>
          )}
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <KV label="Category"      value={product.category} />
            <KV label="Subcategory"   value={product.subcategory ?? "—"} />
            <KV label="HS code"       value={product.hsCode ?? "—"} />
            <KV label="Local content" value={product.localContentPercent ? `${product.localContentPercent}%` : "—"} />
            <KV label="Price range"   value={priceRange(product.priceRangeMin, product.priceRangeMax, product.priceCurrency)} />
            <KV label="Approval"      value={product.approvalStatus} />
          </div>
        </div>

        <div className="card p-5">
          <h2 className="text-lg font-medium mb-2">Localization</h2>
          {product.localizationStatus ? (
            <ul className="text-sm space-y-1">
              <li>Localized: {product.localizationStatus.isLocalized ? m.common.yes : m.common.no}</li>
              <li>Local manufacturers: {product.localizationStatus.localManufacturersCount}</li>
              <li>Localization %: {String(product.localizationStatus.localizationPercentage)}</li>
              <li>Supply risk: {product.localizationStatus.supplyRiskLevel}</li>
            </ul>
          ) : <p className="text-sm text-ink-500">—</p>}
          <h2 className="text-lg font-medium mt-4 mb-2">Gap analysis</h2>
          {product.gapAnalysis ? (
            <ul className="text-sm space-y-1">
              <li>Opportunity: <b>{String(product.gapAnalysis.finalOpportunityScore)}</b></li>
              <li>Gap level: {product.gapAnalysis.localizationGap}</li>
              <li>Recommendation: {product.gapAnalysis.recommendation.replace(/_/g, " ")}</li>
            </ul>
          ) : <p className="text-sm text-ink-500">—</p>}
        </div>
      </section>

      <section className="card p-5">
        <h2 className="text-lg font-medium mb-2">Manufacturers</h2>
        {product.manufacturers.length === 0 ? (
          <p className="text-sm text-ink-500">{m.common.noData}</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-ink-500 text-xs">
              <tr><Th>Name</Th><Th>Country</Th><Th>Type</Th><Th>Capability</Th><Th>Relationship</Th></tr>
            </thead>
            <tbody>
              {product.manufacturers.map((pm) => (
                <tr key={pm.manufacturerId} className="border-t border-surface-100">
                  <td className="py-2">{pm.manufacturer.manufacturerName}</td>
                  <td className="py-2">{pm.manufacturer.country}</td>
                  <td className="py-2">{pm.manufacturer.manufacturerType}</td>
                  <td className="py-2">{pm.manufacturer.localCapabilityLevel}</td>
                  <td className="py-2">{pm.relationshipType}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="card p-5">
        <h2 className="text-lg font-medium mb-2">Evidence</h2>
        {product.evidence.length === 0 ? (
          <p className="text-sm text-ink-500">{m.common.noData}</p>
        ) : (
          <ul className="text-sm space-y-2">
            {product.evidence.map((e) => (
              <li key={e.id} className="border-s-2 border-brand-500 ps-3">
                <div className="font-medium">{e.claimType} — {e.sourceName}</div>
                <div className="text-ink-500 text-xs">
                  Confidence: {String(e.confidenceScore)} — Status: {e.verificationStatus}
                </div>
                {e.evidenceExcerpt && <p className="mt-1 text-ink-700">{e.evidenceExcerpt}</p>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function KV({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs text-ink-500">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  );
}
function Th({ children }: { children: React.ReactNode }) {
  return <th className="text-start font-medium py-2">{children}</th>;
}
function priceRange(min: any, max: any, cur = "USD") {
  if (!min && !max) return "—";
  const fmt = (n: any) => new Intl.NumberFormat("en-US").format(Number(n));
  if (min && max) return `${fmt(min)} – ${fmt(max)} ${cur}`;
  return `${fmt(min ?? max)} ${cur}`;
}
