import { prisma } from "@elp/db";
import { getLocale } from "@/lib/i18n/locale";
import { getMessages } from "@/lib/i18n/messages";

export const dynamic = "force-dynamic";

export default async function EvidencePage() {
  const locale = getLocale();
  const m = getMessages(locale);
  const rows = await prisma.evidence.findMany({
    orderBy: { createdAt: "desc" }, take: 200,
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">{m.evidence.title}</h1>
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface-50 text-ink-500 text-xs">
            <tr>
              <Th>{m.evidence.entity}</Th>
              <Th>{m.evidence.claim}</Th>
              <Th>{m.evidence.source}</Th>
              <Th>{m.evidence.confidence}</Th>
              <Th>{m.evidence.status}</Th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={5} className="text-center text-ink-500 py-8">{m.common.noData}</td></tr>
            )}
            {rows.map((e) => (
              <tr key={e.id} className="border-t border-surface-100">
                <td className="px-4 py-2 font-mono text-xs">{e.entityType}:{e.entityId.slice(0, 8)}</td>
                <td className="px-4 py-2">{e.claimType}</td>
                <td className="px-4 py-2">
                  {e.sourceUrl
                    ? <a className="text-brand-700 hover:underline" href={e.sourceUrl} target="_blank" rel="noreferrer">{e.sourceName}</a>
                    : e.sourceName}
                </td>
                <td className="px-4 py-2">{String(e.confidenceScore)}</td>
                <td className="px-4 py-2">
                  <span className={`badge ${e.verificationStatus === "verified" ? "badge-green" : e.verificationStatus === "disputed" ? "badge-red" : "badge-amber"}`}>
                    {e.verificationStatus}
                  </span>
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
