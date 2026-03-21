"use client";

import { useMemo } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { KpiCard } from "@/components/ui/KpiCard";
import { SectionCard } from "@/components/ui/SectionCard";
import {
  ingredients,
  menus,
  recipes,
  saleLinesHistory,
  salesHistory,
  setMenuComponents,
} from "@/lib/sampleData";
import {
  computeTotalsAndCost,
  expandSetMenus,
  getKoreanWeekdayIndex,
  sumMenuQuantities,
} from "@/lib/calculations";

function formatCurrency(value: number) {
  return value.toLocaleString("ko-KR", {
    style: "currency",
    currency: "KRW",
    maximumFractionDigits: 0,
  });
}

const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

export default function WeekdayAnalyticsPage() {
  const dayBuckets = useMemo(() => {
    const groupedSales: Record<
      number,
      { sales: typeof salesHistory; lines: typeof saleLinesHistory }
    > = {
      0: { sales: [], lines: [] },
      1: { sales: [], lines: [] },
      2: { sales: [], lines: [] },
      3: { sales: [], lines: [] },
      4: { sales: [], lines: [] },
      5: { sales: [], lines: [] },
      6: { sales: [], lines: [] },
    };

    for (const sale of salesHistory) {
      const d = new Date(sale.soldAt);
      const idx = getKoreanWeekdayIndex(d);
      groupedSales[idx].sales.push(sale);
    }

    for (const line of saleLinesHistory) {
      const sale = salesHistory.find((s) => s.id === line.saleId);
      if (!sale) continue;
      const d = new Date(sale.soldAt);
      const idx = getKoreanWeekdayIndex(d);
      groupedSales[idx].lines.push(line);
    }

    return groupedSales;
  }, []);

  const weekdayStats = useMemo(() => {
    return WEEKDAY_LABELS.map((label, idx) => {
      const bucket = dayBuckets[idx];
      const totals = bucket.sales.reduce(
        (acc, s) => {
          acc.totalAmount += s.totalAmount;
          acc.foodCost += s.foodCost;
          acc.grossProfit += s.grossProfit;
          return acc;
        },
        { totalAmount: 0, foodCost: 0, grossProfit: 0 },
      );
      const ratio =
        totals.totalAmount > 0
          ? (totals.foodCost / totals.totalAmount) * 100
          : 0;

      const expanded = expandSetMenus(
        bucket.lines,
        menus,
        setMenuComponents,
      );
      const qtyMap = sumMenuQuantities(expanded);
      const ranking = [...qtyMap.entries()]
        .map(([menuId, qty]) => ({
          menu: menus.find((m) => m.id === menuId)!,
          quantity: qty,
        }))
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 3);

      return {
        weekdayIndex: idx,
        label,
        count: bucket.sales.length,
        ...totals,
        foodCostRatio: ratio,
        ranking,
      };
    });
  }, [dayBuckets]);

  const totalSalesAll = weekdayStats.reduce(
    (sum, d) => sum + d.totalAmount,
    0,
  );
  const bestWeekday = weekdayStats
    .slice()
    .sort((a, b) => b.totalAmount - a.totalAmount)[0];

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-50">
      <Sidebar />
      <div className="flex min-h-screen flex-1 flex-col">
        <Topbar />
        <main className="flex-1 px-4 py-4 pb-8 lg:px-6 lg:py-6">
          <div className="mx-auto flex max-w-6xl flex-col gap-4">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
              <div>
                <h1 className="text-xl font-semibold tracking-tight text-slate-50 sm:text-2xl">
                  요일별 매출 분석
                </h1>
                <p className="mt-1 text-xs text-slate-400 sm:text-sm">
                  어떤 요일에 어떤 메뉴가 잘 팔리는지 파악합니다.
                </p>
              </div>
            </div>

            <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <KpiCard
                label="분석 기간 총 매출"
                value={formatCurrency(totalSalesAll)}
                subLabel="요일 분석에 사용된 전체 매출 합계"
                pill="Sales"
              />
              {bestWeekday && (
                <KpiCard
                  label="매출이 가장 높은 요일"
                  value={`${bestWeekday.label}요일`}
                  subLabel={formatCurrency(bestWeekday.totalAmount)}
                  pill="Top Weekday"
                />
              )}
            </section>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <div className="space-y-4 lg:col-span-2">
                <SectionCard
                  title="요일별 매출 및 원가율"
                  description="요일별 평균 매출과 원가율을 비교합니다."
                >
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {weekdayStats.map((d) => (
                      <div
                        key={d.weekdayIndex}
                        className="rounded-xl border border-slate-800 bg-slate-900/70 px-3 py-2 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-slate-50">
                            {d.label}요일
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {d.count}일 기준
                          </span>
                        </div>
                        <div className="mt-1 text-[11px] text-slate-400">
                          총 매출{" "}
                          <span className="text-slate-100">
                            {formatCurrency(d.totalAmount)}
                          </span>
                          <br />
                          평균 원가율{" "}
                          <span className="text-emerald-300">
                            {d.foodCostRatio.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </SectionCard>
              </div>

              <div className="space-y-4">
                <SectionCard
                  title="요일별 TOP 메뉴"
                  description="각 요일마다 잘 팔리는 메뉴 TOP 3입니다."
                >
                  <div className="max-h-72 space-y-2 overflow-y-auto pr-1 text-xs scrollbar-thin">
                    {weekdayStats.map((d) => (
                      <div
                        key={d.weekdayIndex}
                        className="rounded-lg bg-slate-900/80 px-3 py-2"
                      >
                        <div className="mb-1 flex items-center justify-between">
                          <span className="text-[13px] font-medium text-slate-50">
                            {d.label}요일
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {d.count}일 기준
                          </span>
                        </div>
                        {d.ranking.length === 0 ? (
                          <p className="text-[11px] text-slate-400">
                            데이터가 없습니다.
                          </p>
                        ) : (
                          <ul className="space-y-0.5">
                            {d.ranking.map((item, idx) => (
                              <li
                                key={item.menu.id}
                                className="flex items-center justify-between text-[11px] text-slate-300"
                              >
                                <span>
                                  {idx + 1}. {item.menu.name}
                                </span>
                                <span>
                                  {item.quantity.toLocaleString()} 그릇
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                </SectionCard>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

