"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const mobileNavItems: { href: string; label: string }[] = [
  { href: "/", label: "대시보드" },
  { href: "/sales/manual", label: "매출 입력" },
  { href: "/analytics", label: "매출 분석" },
  { href: "/inventory", label: "재고 관리" },
];

export function Topbar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="border-b border-slate-800 bg-slate-950/80 px-4 py-3 backdrop-blur lg:px-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 lg:hidden">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-slate-100"
          >
            <span className="sr-only">Toggle navigation</span>
            <div className="space-y-1.5">
              <span className="block h-0.5 w-4 rounded-full bg-slate-100" />
              <span className="block h-0.5 w-4 rounded-full bg-slate-100" />
              <span className="block h-0.5 w-4 rounded-full bg-slate-100" />
            </div>
          </button>
          <div>
            <div className="text-sm font-semibold">Daegimanseong</div>
            <div className="text-xs text-slate-400">매장 대시보드</div>
          </div>
        </div>

        <div className="hidden items-center gap-2 text-sm text-slate-400 lg:flex">
          <span className="text-xs font-medium uppercase tracking-[0.2em] text-emerald-400">
            오늘
          </span>
          <span className="h-1 w-1 rounded-full bg-emerald-500" />
          <span className="truncate text-xs">
            매출 · 원가 · 재고 한눈에
          </span>
        </div>

        <div className="ml-auto flex items-center gap-3">
          <button className="hidden rounded-full border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-200 hover:border-emerald-500/60 hover:text-emerald-100 lg:inline-flex">
            직영 · 가맹 전환
          </button>
          <div className="flex items-center gap-2">
            <div className="text-right text-xs leading-tight">
              <div className="font-medium text-slate-100">홍길동 점주</div>
              <div className="text-slate-400">서울대입구 직영점</div>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-emerald-500 to-sky-500 text-xs font-semibold text-slate-950">
              HG
            </div>
          </div>
        </div>
      </div>

      {open && (
        <nav className="mt-3 grid grid-cols-3 gap-2 text-xs font-medium text-slate-100 lg:hidden">
          {mobileNavItems.map((item) => {
            const active =
              item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={[
                  "rounded-lg border px-2 py-1.5 text-center",
                  active
                    ? "border-emerald-500/60 bg-emerald-500/10 text-emerald-200"
                    : "border-slate-800 bg-slate-900/60",
                ].join(" ")}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      )}
    </header>
  );
}

