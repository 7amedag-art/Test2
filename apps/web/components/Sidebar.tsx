import Link from "next/link";
import { getLocale } from "@/lib/i18n/locale";
import { getMessages } from "@/lib/i18n/messages";
import {
  LayoutDashboard, Package, Factory, FileCheck2, BarChart3,
  MessagesSquare, Settings, History, LogOut,
} from "lucide-react";

export function Sidebar() {
  const locale = getLocale();
  const m = getMessages(locale);
  const items = [
    { href: "/",                icon: LayoutDashboard, label: m.nav.dashboard },
    { href: "/products",        icon: Package,         label: m.nav.products },
    { href: "/manufacturers",   icon: Factory,         label: m.nav.manufacturers },
    { href: "/evidence",        icon: FileCheck2,      label: m.nav.evidence },
    { href: "/gaps",            icon: BarChart3,       label: m.nav.gaps },
    { href: "/chat",            icon: MessagesSquare,  label: m.nav.chat },
    { href: "/admin",           icon: Settings,        label: m.nav.admin },
    { href: "/audit",           icon: History,         label: m.nav.audit },
  ];
  return (
    <aside className="w-64 shrink-0 bg-surface-0 border-s border-surface-100 h-screen sticky top-0 flex flex-col">
      <div className="p-5 border-b border-surface-100">
        <div className="text-brand-700 font-semibold leading-tight">{m.app.name}</div>
        <div className="text-ink-500 text-xs mt-1">{m.app.tagline}</div>
      </div>
      <nav className="p-2 flex-1 overflow-y-auto">
        {items.map((it) => (
          <Link
            key={it.href}
            href={it.href}
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-ink-700 hover:bg-surface-50"
          >
            <it.icon size={18} className="text-ink-500" />
            <span>{it.label}</span>
          </Link>
        ))}
      </nav>
      <form action="/api/auth/signout" method="post" className="p-3 border-t border-surface-100">
        <button className="btn btn-secondary w-full" type="submit">
          <LogOut size={16} /> {m.nav.logout}
        </button>
      </form>
    </aside>
  );
}
