"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems: { href: string; label: string }[] = [
  { href: "/", label: "대시보드" },
  { href: "/sales/manual", label: "매출 입력" },
  { href: "/analytics", label: "매출 분석" },
  { href: "/inventory", label: "재고 관리" },
  { href: "/sales/upload", label: "영수증 업로드" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden border-r border-slate-800 bg-slate-950/80 px-4 py-6 lg:block lg:w-64">
      <div className="mb-8 flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/30">
          DG
        </div>
        <div>
          <div className="text-sm font-semibold tracking-tight">
            Daegimanseong
          </div>
          <div className="text-xs text-slate-400">매장 대시보드</div>
        </div>
      </div>

      <nav className="space-y-1 text-sm">
        {navItems.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                "flex items-center justify-between rounded-lg px-3 py-2 transition-colors",
                active
                  ? "bg-emerald-500/10 text-emerald-300"
                  : "text-slate-300 hover:bg-slate-800/60 hover:text-slate-50",
              ].join(" ")}
            >
              <span>{item.label}</span>
              {active && (
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

