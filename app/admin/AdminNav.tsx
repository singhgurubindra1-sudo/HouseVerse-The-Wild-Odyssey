"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/admin", label: "Overview", emoji: "📊" },
  { href: "/admin/approvals", label: "Approvals", emoji: "✅" },
  { href: "/admin/quests", label: "Quests", emoji: "🧭" },
  { href: "/admin/badges", label: "Badges", emoji: "🏅" },
  { href: "/admin/lore", label: "House lore", emoji: "📜" },
  { href: "/admin/members", label: "Members", emoji: "🧑‍🤝‍🧑" },
  { href: "/admin/log", label: "Activity log", emoji: "🗒️" },
];

export function AdminNav({ pending }: { pending: number }) {
  const path = usePathname();
  return (
    <nav aria-label="Admin sections" className="-mx-4 overflow-x-auto px-4">
      <ul className="flex min-w-max gap-2">
        {TABS.map((t) => {
          const active = t.href === "/admin" ? path === "/admin" : path.startsWith(t.href);
          return (
            <li key={t.href}>
              <Link href={t.href} aria-current={active ? "page" : undefined} className={`btn btn-sm ${active ? "btn-primary" : "btn-ghost"}`}>
                <span aria-hidden>{t.emoji}</span> {t.label}
                {t.href === "/admin/approvals" && pending > 0 && <span className="ml-1 rounded-full bg-sun px-1.5 text-xs font-black text-ink">{pending}</span>}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
