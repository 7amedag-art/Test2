import Link from "next/link";
import { prisma } from "@elp/db";
import { getLocale } from "@/lib/i18n/locale";
import { getMessages } from "@/lib/i18n/messages";

export const dynamic = "force-dynamic";

export default async function ManufacturersPage({ searchParams }: {
  searchParams?: { scope?: "local" | "global" };
}) {
  const locale = getLocale();
  const m = getMessages(locale);
  const scope = searchParams?.scope ?? "local";
  const rows = await prisma.manufacturer.findMany({
    where: { isLocal: scope === "local" },
    orderBy: { manufacturerName: "asc" },
    take: 200,
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{m.manufacturers.title}</h1>
        <div className="flex gap-2 rounded-lg bg-surface-50 p-0.5 text-sm">
          <Link href="?scope=local" className={`px-3 py-1.5 rounded-md ${scope === "local" ? "bg-surface-0 shadow-sm" : "text-ink-500"}`}>
            Local (KSA)
          </Link>
          <Link href="?scope=global" className={`px-3 py-1.5 rounded-md ${scope === "global" ? "bg-surface-0 shadow-sm" : "text-ink-500"}`}>
            Global
          </Link>
        </div>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface-50 text-ink-500 text-xs">
            <tr>
              <Th>{m.manufacturers.name}</Th>
              <Th>{m.manufacturers.type}</Th>
              <Th>{m.manufacturers.country}</Th>
              <Th>{m.manufacturers.city}</Th>
              <Th>{m.manufacturers.capability}</Th>
              <Th>{m.manufacturers.verification}</Th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={6} className="text-center text-ink-500 py-8">{m.common.noData}</td></tr>
            )}
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-surface-100 hover:bg-surface-50">
                <td className="px-4 py-2 font-medium">{r.manufacturerName}</td>
                <td className="px-4 py-2">{r.manufacturerType}</td>
                <td className="px-4 py-2">{r.country}</td>
                <td className="px-4 py-2">{r.city ?? "—"}</td>
                <td className="px-4 py-2">{r.localCapabilityLevel}</td>
                <td className="px-4 py-2">
                  <span className={`badge ${r.verificationStatus === "verified" ? "badge-green" : r.verificationStatus === "pending" ? "badge-amber" : "badge-blue"}`}>
                    {r.verificationStatus}
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
