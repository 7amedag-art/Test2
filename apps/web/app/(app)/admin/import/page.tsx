import { getLocale } from "@/lib/i18n/locale";

export default function ImportPage() {
  const locale = getLocale();
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">CSV import</h1>
      <div className="card p-5 space-y-3 text-sm text-ink-700">
        <p>
          {locale === "ar"
            ? "حاليًا استيراد CSV يتم عبر سطر الأوامر. ضع ملفاتك في data/seed/ وشغّل:"
            : "CSV import currently runs via CLI. Drop files into data/seed/ and run:"}
        </p>
        <pre className="bg-surface-50 p-3 rounded-lg overflow-x-auto">
pnpm import:products \\
  --products      ./data/seed/products.csv \\
  --manufacturers ./data/seed/manufacturers.csv \\
  --links         ./data/seed/links.csv
        </pre>
        <p>
          {locale === "ar"
            ? "سيتم تفعيل رفع CSV من الواجهة في Phase 2."
            : "Upload-from-UI arrives in Phase 2."}
        </p>
        <div>
          <a className="text-brand-700 hover:underline" href="/api/v1/templates/products">Download products template</a>
          {" · "}
          <a className="text-brand-700 hover:underline" href="/api/v1/templates/manufacturers">Download manufacturers template</a>
          {" · "}
          <a className="text-brand-700 hover:underline" href="/api/v1/templates/links">Download links template</a>
        </div>
      </div>
    </div>
  );
}
