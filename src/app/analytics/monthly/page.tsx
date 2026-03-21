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
  sumMenuQuantities,
} from "@/lib/calculations";

function formatCurrency(value: number) {
  return value.toLocaleString("ko-KR", {
    style: "currency",
    currency: "KRW",
    maximumFractionDigits: 0,
  });
}

export default function MonthlyAnalyticsPage() {
  const monthlyBuckets = useMemo(() => {
    const byMonth = new Map<
      string,
      { sales: typeof salesHistory; lines: typeof saleLinesHistory }
    >();

    for (const sale of salesHistory) {
      const d = new Date(sale.soldAt);
      const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
      const bucket =
        byMonth.get(key) ?? { sales: [], lines: [] as typeof saleLinesHistory };
      bucket.sales.push(sale);
      byMonth.set(key, bucket);
    }

    for (const line of saleLinesHistory) {
      const sale = salesHistory.find((s) => s.id === line.saleId);
      if (!sale) continue;
      const d = new Date(sale.soldAt);
      const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
      const bucket = byMonth.get(key);
      if (!bucket) continue;
      bucket.lines.push(line);
    }

    return [...byMonth.entries()]
      .map(([key, bucket]) => {
        const [year, month] = key.split("-").map(Number);
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
          .slice(0, 5);

        return {
          key,
          year,
          month,
          ...totals,
          foodCostRatio: ratio,
          ranking,
        };
      })
      .sort((a, b) => b.year - a.year || b.month - a.month);
  }, []);

  const currentMonth = monthlyBuckets[0];

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
                  월간 매출 분석
                </h1>
                <p className="mt-1 text-xs text-slate-400 sm:text-sm">
                  월별 매출, 원가율, 베스트 메뉴를 한눈에 비교합니다.
                </p>
              </div>
            </div>

            {currentMonth && (
              <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <KpiCard
                  label="이번 달 매출"
                  value={formatCurrency(currentMonth.totalAmount)}
                  subLabel={`${currentMonth.year}년 ${currentMonth.month}월 기준`}
                  pill="Sales"
                />
                <KpiCard
                  label="이번 달 식재료 원가"
                  value={formatCurrency(currentMonth.foodCost)}
                  subLabel="레시피 기준 산정"
                  pill="Food Cost"
                />
                <KpiCard
                  label="이번 달 매출 총이익"
                  value={formatCurrency(currentMonth.grossProfit)}
                  subLabel="인건비·임대료 제외"
                  pill="Gross Profit"
                />
                <KpiCard
                  label="이번 달 평균 원가율"
                  value={`${currentMonth.foodCostRatio.toFixed(1)}%`}
                  subLabel="월간 기준 원가율"
                  pill="Food Cost %"
                />
              </section>
            )}

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <div className="space-y-4 lg:col-span-2">
                <SectionCard
                  title="월별 매출 추이"
                  description="최근 월별 매출과 원가율을 비교합니다."
                >
                  <div className="space-y-2 text-xs">
                    {monthlyBuckets.map((m) => (
                      <div
                        key={m.key}
                        className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/70 px-3 py-2"
                      >
                        <div>
                          <div className="text-sm font-medium text-slate-50">
                            {m.year}년 {m.month}월
                          </div>
                          <div className="mt-0.5 text-[11px] text-slate-400">
                            매출 {formatCurrency(m.totalAmount)} · 원가율{" "}
                            {m.foodCostRatio.toFixed(1)}%
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </SectionCard>
              </div>

              <div className="space-y-4">
                <SectionCard
                  title="이번 달 베스트 메뉴 TOP 5"
                  description="월간 판매량 기준 상위 메뉴입니다."
                >
                  {currentMonth ? (
                    <div className="space-y-2 text-xs">
                      {currentMonth.ranking.map((item, idx) => (
                        <div
                          key={item.menu.id}
                          className="flex items-center justify-between rounded-lg bg-slate-900/80 px-3 py-1.5"
                        >
                          <div className="flex items-center gap-2">
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-800 text-[10px] text-slate-100">
                              {idx + 1}
                            </span>
                            <span className="text-[13px] text-slate-50">
                              {item.menu.name}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-400">
                            {item.quantity.toLocaleString()} 그릇
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400">
                      월간 데이터가 아직 없습니다.
                    </p>
                  )}
                </SectionCard>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

