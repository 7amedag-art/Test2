import { prisma } from "@elp/db";
import { getLocale } from "@/lib/i18n/locale";
import { getMessages } from "@/lib/i18n/messages";

export const dynamic = "force-dynamic";

export default async function AuditPage() {
  const locale = getLocale();
  const m = getMessages(locale);
  const rows = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" }, take: 200,
    include: { user: true },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">{m.nav.audit}</h1>
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface-50 text-ink-500 text-xs">
            <tr>
              <Th>When</Th><Th>User</Th><Th>Entity</Th><Th>Action</Th><Th>Changes</Th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={5} className="text-center text-ink-500 py-8">{m.common.noData}</td></tr>
            )}
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-surface-100 align-top">
                <td className="px-4 py-2 whitespace-nowrap">{r.createdAt.toISOString()}</td>
                <td className="px-4 py-2">{r.user?.email ?? "system"}</td>
                <td className="px-4 py-2 font-mono text-xs">{r.entityType}:{r.entityId.slice(0, 8)}</td>
                <td className="px-4 py-2">{r.action}</td>
                <td className="px-4 py-2">
                  <pre className="text-xs text-ink-500 max-w-md whitespace-pre-wrap">{r.changes ? JSON.stringify(r.changes) : "—"}</pre>
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
