import { prisma } from "@elp/db";
import { getLocale } from "@/lib/i18n/locale";
import { getMessages } from "@/lib/i18n/messages";
import { formatNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";

async function loadKpis() {
  const [totalProducts, nonLocalized, highOpportunities, localManufacturers] = await Promise.all([
    prisma.product.count(),
    prisma.localizationStatus.count({ where: { isLocalized: false } }),
    prisma.gapAnalysis.count({ where: { localizationGap: "high" } }),
    prisma.manufacturer.count({ where: { isLocal: true, status: { in: ["active", "new", "expanding"] } } }),
  ]);
  return { totalProducts, nonLocalized, highOpportunities, localManufacturers };
}

async function loadTopOpportunities() {
  return prisma.gapAnalysis.findMany({
    orderBy: { finalOpportunityScore: "desc" },
    take: 10,
    include: { product: true },
  });
}

export default async function DashboardPage() {
  const locale = getLocale();
  const m = getMessages(locale);
  const kpis = await loadKpis();
  const tops = await loadTopOpportunities();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">{m.dashboard.title}</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi label={m.dashboard.kpi.totalProducts}      value={formatNumber(kpis.totalProducts, locale)} />
        <Kpi label={m.dashboard.kpi.notLocalized}       value={formatNumber(kpis.nonLocalized, locale)} tone="red" />
        <Kpi label={m.dashboard.kpi.highOpportunities}  value={formatNumber(kpis.highOpportunities, locale)} tone="amber" />
        <Kpi label={m.dashboard.kpi.localManufacturers} value={formatNumber(kpis.localManufacturers, locale)} tone="green" />
      </div>

      <div className="card p-5">
        <h2 className="text-lg font-medium mb-3">{m.dashboard.topOpportunities}</h2>
        {tops.length === 0 ? (
          <p className="text-sm text-ink-500">{m.common.noData}</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-ink-500 text-xs">
                <th className="text-start font-medium py-2">{m.products.code}</th>
                <th className="text-start font-medium py-2">{m.products.nameEn}</th>
                <th className="text-start font-medium py-2">{m.gaps.opportunity}</th>
                <th className="text-start font-medium py-2">{m.gaps.level}</th>
                <th className="text-start font-medium py-2">{m.gaps.recommendation}</th>
              </tr>
            </thead>
            <tbody>
              {tops.map((g) => (
                <tr key={g.productId} className="border-t border-surface-100">
                  <td className="py-2">{g.product.productCode}</td>
                  <td className="py-2">{locale === "ar" ? g.product.productNameAr ?? g.product.productNameEn : g.product.productNameEn}</td>
                  <td className="py-2">{Number(g.finalOpportunityScore).toFixed(1)}</td>
                  <td className="py-2">
                    <span className={`badge ${g.localizationGap === "high" ? "badge-red" : g.localizationGap === "medium" ? "badge-amber" : "badge-green"}`}>
                      {g.localizationGap}
                    </span>
                  </td>
                  <td className="py-2">{g.recommendation.replace(/_/g, " ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function Kpi({ label, value, tone = "blue" }: { label: string; value: string; tone?: "blue" | "red" | "amber" | "green" }) {
  const toneClass =
    tone === "red"   ? "text-rose-600"    :
    tone === "amber" ? "text-amber-600"   :
    tone === "green" ? "text-emerald-600" : "text-brand-700";
  return (
    <div className="card p-5">
      <div className="text-xs text-ink-500">{label}</div>
      <div className={`mt-1 text-3xl font-semibold ${toneClass}`}>{value}</div>
    </div>
  );
}
