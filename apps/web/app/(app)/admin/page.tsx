import Link from "next/link";
import { currentUser } from "@/lib/rbac";
import { getLocale } from "@/lib/i18n/locale";
import { getMessages } from "@/lib/i18n/messages";

export default async function AdminPage() {
  const user = await currentUser();
  const locale = getLocale();
  const m = getMessages(locale);
  const canWrite = user?.role === "admin" || user?.role === "analyst";
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">{m.nav.admin}</h1>
      <div className="grid md:grid-cols-2 gap-4">
        <Card title={m.products.newProduct} href="/admin/products/new" enabled={canWrite} />
        <Card title={m.manufacturers.addLocal} href="/admin/manufacturers/new?scope=local" enabled={canWrite} />
        <Card title={m.manufacturers.addGlobal} href="/admin/manufacturers/new?scope=global" enabled={canWrite} />
        <Card title={m.evidence.addEvidence} href="/admin/evidence/new" enabled={canWrite} />
        <Card title={locale === "ar" ? "إعادة حساب الفجوات" : "Recompute gaps"}
              href="/admin/recompute" enabled={canWrite} />
        <Card title={locale === "ar" ? "استيراد CSV" : "CSV import"}
              href="/admin/import" enabled={user?.role === "admin"} />
      </div>
      {!canWrite && (
        <p className="text-sm text-ink-500">
          {locale === "ar"
            ? "حسابك viewer فقط — التعديلات متاحة لـ analyst/admin."
            : "Your account is viewer-only — edits require analyst/admin role."}
        </p>
      )}
    </div>
  );
}

function Card({ title, href, enabled }: { title: string; href: string; enabled: boolean }) {
  return enabled ? (
    <Link href={href} className="card p-5 hover:bg-surface-50 transition">
      <div className="font-medium">{title}</div>
    </Link>
  ) : (
    <div className="card p-5 opacity-50 cursor-not-allowed">
      <div className="font-medium">{title}</div>
    </div>
  );
}
