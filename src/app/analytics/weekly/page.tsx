"use client";

import { useMemo, useState } from "react";
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
  sumMenuQuantities,
} from "@/lib/calculations";

function formatCurrency(value: number) {
  return value.toLocaleString("ko-KR", {
    style: "currency",
    currency: "KRW",
    maximumFractionDigits: 0,
  });
}

export default function WeeklyAnalyticsPage() {
  const [weeks] = useState(2);

  const groupedByDay = useMemo(() => {
    const byId = new Map<string, typeof saleLinesHistory>();
    for (const line of saleLinesHistory) {
      const bucket = byId.get(line.saleId) ?? [];
      bucket.push(line);
      byId.set(line.saleId, bucket);
    }
    return byId;
  }, []);

  const recentSales = useMemo(
    () => salesHistory.slice(0, weeks * 7),
    [weeks],
  );

  const dailyStats = useMemo(() => {
    return recentSales.map((sale) => {
      const lines = groupedByDay.get(sale.id) ?? [];
      const totals =
        lines.length === 0
          ? {
              totalSales: sale.totalAmount,
              foodCost: sale.foodCost,
              grossProfit: sale.grossProfit,
              foodCostRatio:
                sale.totalAmount > 0
                  ? (sale.foodCost / sale.totalAmount) * 100
                  : 0,
            }
          : computeTotalsAndCost({
              lines,
              menus,
              recipes,
              setComponents: setMenuComponents,
              ingredients,
            });

      const date = new Date(sale.soldAt);
      const label = `${date.getMonth() + 1}/${date.getDate()}`;

      const expanded = expandSetMenus(
        lines,
        menus,
        setMenuComponents,
      );
      const qtyMap = sumMenuQuantities(expanded);
      const bestEntry = [...qtyMap.entries()].sort(
        (a, b) => b[1] - a[1],
      )[0];
      const bestMenu =
        bestEntry && menus.find((m) => m.id === bestEntry[0]);

      return {
        id: sale.id,
        label,
        weekday: date.toLocaleDateString("ko-KR", {
          weekday: "short",
        }),
        ...totals,
        bestMenuName: bestMenu?.name ?? "-",
      };
    });
  }, [groupedByDay, recentSales]);

  const weeklyBuckets = useMemo(() => {
    const buckets: {
      weekIndex: number;
      days: (typeof dailyStats)[number][];
    }[] = [];
    for (let i = 0; i < dailyStats.length; i += 7) {
      buckets.push({
        weekIndex: i / 7,
        days: dailyStats.slice(i, i + 7),
      });
    }
    return buckets;
  }, [dailyStats]);

  const totalOfRange = dailyStats.reduce(
    (acc, d) => {
      acc.totalSales += d.totalSales;
      acc.foodCost += d.foodCost;
      acc.grossProfit += d.grossProfit;
      return acc;
    },
    { totalSales: 0, foodCost: 0, grossProfit: 0 },
  );
  const avgFoodCostRatio =
    totalOfRange.totalSales > 0
      ? (totalOfRange.foodCost / totalOfRange.totalSales) * 100
      : 0;

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
                  주간 매출 분석
                </h1>
                <p className="mt-1 text-xs text-slate-400 sm:text-sm">
                  최근 {weeks}주간 일자별 매출과 베스트 메뉴를 요약합니다.
                </p>
              </div>
            </div>

            <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <KpiCard
                label="기간 총 매출"
                value={formatCurrency(totalOfRange.totalSales)}
                subLabel={`최근 ${weeks}주 매출 합계`}
                pill="Sales"
              />
              <KpiCard
                label="기간 식재료 원가"
                value={formatCurrency(totalOfRange.foodCost)}
                subLabel="레시피 기준 산정"
                pill="Food Cost"
              />
              <KpiCard
                label="기간 매출 총이익"
                value={formatCurrency(totalOfRange.grossProfit)}
                subLabel="인건비·임대료 제외"
                pill="Gross Profit"
              />
              <KpiCard
                label="평균 원가율"
                value={`${avgFoodCostRatio.toFixed(1)}%`}
                subLabel="기간 내 일자별 원가율 평균"
                pill="Food Cost %"
              />
            </section>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <div className="space-y-4 lg:col-span-2">
                <SectionCard
                  title="일별 매출 및 베스트 메뉴"
                  description="요일별 흐름과 함께 일자별 매출, 원가율, 베스트 메뉴를 확인합니다."
                >
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {dailyStats.map((d) => (
                      <div
                        key={d.id}
                        className="flex items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900/70 px-3 py-2"
                      >
                        <div>
                          <div className="text-sm font-medium text-slate-50">
                            {d.label} ({d.weekday})
                          </div>
                          <div className="mt-0.5 text-[11px] text-slate-400">
                            매출 {formatCurrency(d.totalSales)} · 원가율{" "}
                            {d.foodCostRatio.toFixed(1)}%
                          </div>
                          <div className="mt-0.5 text-[11px] text-slate-400">
                            베스트 메뉴:{" "}
                            <span className="text-slate-100">
                              {d.bestMenuName}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </SectionCard>
              </div>

              <div className="space-y-4">
                <SectionCard
                  title="주차별 요약"
                  description="주차별 매출과 평균 원가율을 비교합니다."
                >
                  <div className="space-y-2 text-xs">
                    {weeklyBuckets.map((w) => {
                      const sum = w.days.reduce(
                        (acc, d) => {
                          acc.totalSales += d.totalSales;
                          acc.foodCost += d.foodCost;
                          return acc;
                        },
                        { totalSales: 0, foodCost: 0 },
                      );
                      const ratio =
                        sum.totalSales > 0
                          ? (sum.foodCost / sum.totalSales) * 100
                          : 0;
                      return (
                        <div
                          key={w.weekIndex}
                          className="rounded-lg bg-slate-900/80 px-3 py-2"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[13px] font-medium text-slate-50">
                              최근 {w.weekIndex + 1}주차
                            </span>
                            <span className="text-[11px] text-slate-400">
                              {w.days.length}일 기준
                            </span>
                          </div>
                          <div className="mt-1 text-[11px] text-slate-400">
                            매출{" "}
                            <span className="text-slate-100">
                              {formatCurrency(sum.totalSales)}
                            </span>{" "}
                            · 평균 원가율{" "}
                            <span className="text-emerald-300">
                              {ratio.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      );
                    })}
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

