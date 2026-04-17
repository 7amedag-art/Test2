import { prisma } from "@elp/db";
import { getLocale } from "@/lib/i18n/locale";
import { getMessages } from "@/lib/i18n/messages";

export const dynamic = "force-dynamic";

export default async function GapsPage() {
  const locale = getLocale();
  const m = getMessages(locale);
  const rows = await prisma.gapAnalysis.findMany({
    orderBy: { finalOpportunityScore: "desc" },
    include: { product: true },
    take: 200,
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">{m.gaps.title}</h1>
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface-50 text-ink-500 text-xs">
            <tr>
              <Th>{m.products.code}</Th>
              <Th>{locale === "ar" ? m.products.nameAr : m.products.nameEn}</Th>
              <Th>{m.gaps.opportunity}</Th>
              <Th>{m.gaps.level}</Th>
              <Th>{m.gaps.recommendation}</Th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={5} className="text-center text-ink-500 py-8">{m.common.noData}</td></tr>
            )}
            {rows.map((g) => (
              <tr key={g.productId} className="border-t border-surface-100">
                <td className="px-4 py-2 font-mono text-xs">{g.product.productCode}</td>
                <td className="px-4 py-2">{locale === "ar" ? g.product.productNameAr ?? g.product.productNameEn : g.product.productNameEn}</td>
                <td className="px-4 py-2 font-semibold">{Number(g.finalOpportunityScore).toFixed(1)}</td>
                <td className="px-4 py-2">
                  <span className={`badge ${g.localizationGap === "high" ? "badge-red" : g.localizationGap === "medium" ? "badge-amber" : "badge-green"}`}>
                    {g.localizationGap}
                  </span>
                </td>
                <td className="px-4 py-2">{g.recommendation.replace(/_/g, " ")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="text-start font-medium px-4 py-3">{children}</th>;
}
