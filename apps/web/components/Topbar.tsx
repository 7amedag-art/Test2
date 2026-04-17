import { getLocale } from "@/lib/i18n/locale";
import { getMessages } from "@/lib/i18n/messages";
import { currentUser } from "@/lib/rbac";
import { LocaleToggle } from "./LocaleToggle";

export async function Topbar() {
  const locale = getLocale();
  const m = getMessages(locale);
  const user = await currentUser();
  return (
    <header className="h-14 bg-surface-0 border-b border-surface-100 flex items-center px-6 gap-4 sticky top-0 z-10">
      <div className="flex-1">
        <input
          type="search"
          placeholder={m.common.search}
          className="w-full max-w-md rounded-xl border border-surface-100 bg-surface-50 px-4 py-2 text-sm outline-none focus:border-brand-500"
        />
      </div>
      <LocaleToggle current={locale} />
      <div className="text-sm text-ink-700">
        {user ? (
          <div className="flex items-center gap-2">
            <span className="font-medium">{user.name ?? user.email}</span>
            <span className="badge badge-blue">{user.role}</span>
          </div>
        ) : null}
      </div>
    </header>
  );
}
