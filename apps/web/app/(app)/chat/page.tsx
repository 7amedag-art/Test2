import { getLocale } from "@/lib/i18n/locale";
import { getMessages } from "@/lib/i18n/messages";
import { MessagesSquare } from "lucide-react";

export default function ChatPage() {
  const locale = getLocale();
  const m = getMessages(locale);
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">{m.nav.chat}</h1>
      <div className="card p-10 grid place-items-center text-center">
        <MessagesSquare size={36} className="text-brand-500 mb-3" />
        <div className="text-lg font-medium">{m.common.soon}</div>
        <p className="text-sm text-ink-500 mt-2 max-w-md">
          {locale === "ar"
            ? "سيتم تفعيل الشات الذكي في المرحلة الرابعة (RAG + citations + anti-hallucination)."
            : "The RAG-powered chat ships in Phase 4: retrieval, citations, and anti-hallucination guards."}
        </p>
      </div>
    </div>
  );
}
