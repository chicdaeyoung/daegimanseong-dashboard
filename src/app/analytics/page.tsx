"use client";

import { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { WeeklyAnalysis } from "@/components/analytics/WeeklyAnalysis";
import { MonthlyAnalysis } from "@/components/analytics/MonthlyAnalysis";
import { WeekdayAnalysis } from "@/components/analytics/WeekdayAnalysis";

type TabId = "weekly" | "monthly" | "weekday";

const tabs: { id: TabId; label: string; description: string }[] = [
  { id: "weekly", label: "주간 분석", description: "일자별 흐름과 주차 요약" },
  { id: "monthly", label: "월간 분석", description: "월별 추이와 TOP 메뉴" },
  { id: "weekday", label: "요일 분석", description: "요일별 성과와 인기 메뉴" },
];

export default function AnalyticsPage() {
  const [tab, setTab] = useState<TabId>("weekly");
  const active = tabs.find((t) => t.id === tab) ?? tabs[0];

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-50">
      <Sidebar />
      <div className="flex min-h-screen flex-1 flex-col">
        <Topbar />
        <main className="flex-1 px-4 py-4 pb-8 lg:px-8 lg:py-6">
          <div className="mx-auto flex max-w-6xl flex-col gap-5">
            <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
              <div>
                <h1 className="text-xl font-semibold tracking-tight text-slate-50 lg:text-2xl">
                  매출 분석
                </h1>
                <p className="mt-1 text-xs text-slate-400 lg:text-sm">
                  {active.description}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-800 bg-slate-900/50 p-2">
              {tabs.map((t) => {
                const isActive = t.id === tab;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTab(t.id)}
                    className={[
                      "relative rounded-xl px-4 py-2 text-sm font-medium transition",
                      isActive
                        ? "bg-emerald-500/15 text-emerald-200"
                        : "text-slate-300 hover:bg-slate-800/60 hover:text-slate-50",
                    ].join(" ")}
                  >
                    {t.label}
                    {isActive && (
                      <span className="absolute inset-x-4 -bottom-[2px] h-[2px] rounded-full bg-emerald-400" />
                    )}
                  </button>
                );
              })}
            </div>

            {tab === "weekly" && <WeeklyAnalysis />}
            {tab === "monthly" && <MonthlyAnalysis />}
            {tab === "weekday" && <WeekdayAnalysis />}
          </div>
        </main>
      </div>
    </div>
  );
}

