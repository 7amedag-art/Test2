import Link from "next/link";
import { prisma } from "@elp/db";
import { getLocale } from "@/lib/i18n/locale";
import { getMessages } from "@/lib/i18n/messages";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const locale = getLocale();
  const m = getMessages(locale);
  const rows = await prisma.product.findMany({
    include: { localizationStatus: true, gapAnalysis: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{m.products.title}</h1>
        <Link href="/admin/products/new" className="btn btn-primary">{m.products.newProduct}</Link>
      </div>
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface-50 text-ink-500 text-xs">
            <tr>
              <Th>{m.products.code}</Th>
              <Th>{locale === "ar" ? m.products.nameAr : m.products.nameEn}</Th>
              <Th>{m.products.category}</Th>
              <Th>{m.products.segment}</Th>
              <Th>{m.products.criticality}</Th>
              <Th>{m.products.localized}</Th>
              <Th>{m.products.gap}</Th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={7} className="text-center text-ink-500 py-8">{m.common.noData}</td></tr>
            )}
            {rows.map((p) => (
              <tr key={p.id} className="border-t border-surface-100 hover:bg-surface-50">
                <td className="px-4 py-2 font-mono text-xs">
                  <Link href={`/products/${p.id}`} className="text-brand-700 hover:underline">{p.productCode}</Link>
                </td>
                <td className="px-4 py-2">{locale === "ar" ? p.productNameAr ?? p.productNameEn : p.productNameEn}</td>
                <td className="px-4 py-2">{p.category}</td>
                <td className="px-4 py-2">{m.segments[p.industrySegment]}</td>
                <td className="px-4 py-2">{m.criticality[p.criticalityLevel]}</td>
                <td className="px-4 py-2">
                  {p.localizationStatus?.isLocalized
                    ? <span className="badge badge-green">{m.common.yes}</span>
                    : <span className="badge badge-red">{m.common.no}</span>}
                </td>
                <td className="px-4 py-2">
                  {p.gapAnalysis ? (
                    <span className={`badge ${p.gapAnalysis.localizationGap === "high" ? "badge-red" : p.gapAnalysis.localizationGap === "medium" ? "badge-amber" : "badge-green"}`}>
                      {p.gapAnalysis.localizationGap}
                    </span>
                  ) : "—"}
                </td>
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
