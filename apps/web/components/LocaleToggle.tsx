"use client";
import { useRouter } from "next/navigation";
import type { Locale } from "@/lib/i18n/messages";

export function LocaleToggle({ current }: { current: Locale }) {
  const router = useRouter();
  async function change(locale: Locale) {
    await fetch("/api/locale", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ locale }),
    });
    router.refresh();
  }
  return (
    <div className="flex items-center rounded-lg bg-surface-50 p-0.5 text-xs">
      <button
        onClick={() => change("ar")}
        className={`px-3 py-1.5 rounded-md ${current === "ar" ? "bg-surface-0 shadow-sm" : "text-ink-500"}`}
      >
        عربي
      </button>
      <button
        onClick={() => change("en")}
        className={`px-3 py-1.5 rounded-md ${current === "en" ? "bg-surface-0 shadow-sm" : "text-ink-500"}`}
      >
        EN
      </button>
    </div>
  );
}
