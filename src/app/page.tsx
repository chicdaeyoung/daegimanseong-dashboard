import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { KpiCard } from "@/components/ui/KpiCard";
import { SectionCard } from "@/components/ui/SectionCard";
import {
  getTodaySummary,
  getYesterdaySummary,
  getTodayMenuSales,
  getWeekdayPattern,
  getMenuMargins,
} from "@/lib/dashboard/queries";
import { getStockAlerts } from "@/lib/inventory/queries";

const WEEKDAY_LABELS: Record<number, string> = {
  0: "일",
  1: "월",
  2: "화",
  3: "수",
  4: "목",
  5: "금",
  6: "토",
};

function formatCurrency(value: number) {
  return value.toLocaleString("ko-KR", {
    style: "currency",
    currency: "KRW",
    maximumFractionDigits: 0,
  });
}

function trendLabel(
  today: number | null,
  yesterday: number | null,
  unit: "currency" | "percent" = "currency",
): { label: string; type: "up" | "down" | "neutral" } | null {
  if (today === null || yesterday === null || yesterday === 0) return null;
  const diff = today - yesterday;
  const pct = (diff / yesterday) * 100;
  const sign = diff >= 0 ? "+" : "";
  const label =
    unit === "percent"
      ? `${sign}${pct.toFixed(1)}%p ${diff >= 0 ? "증가" : "감소"}`
      : `${sign}${pct.toFixed(1)}% ${diff >= 0 ? "증가" : "감소"}`;
  return { label, type: diff >= 0 ? "up" : "down" };
}

function costRatioColor(ratio: number): string {
  if (ratio <= 30) return "text-emerald-300";
  if (ratio <= 35) return "text-yellow-300";
  return "text-red-300";
}

export default async function Home() {
  const [today, yesterday, menuSales, weekdayPattern, margins, stockAlerts] =
    await Promise.all([
      getTodaySummary(),
      getYesterdaySummary(),
      getTodayMenuSales(),
      getWeekdayPattern(),
      getMenuMargins(),
      getStockAlerts(),
    ]);

  const salesTrend = trendLabel(
    today?.total_sales ?? null,
    yesterday?.total_sales ?? null,
  );
  const costTrend = trendLabel(
    today?.food_cost ?? null,
    yesterday?.food_cost ?? null,
  );
  const profitTrend = trendLabel(
    today?.gross_profit ?? null,
    yesterday?.gross_profit ?? null,
  );
  const ratioTrend = trendLabel(
    today?.food_cost_ratio ?? null,
    yesterday?.food_cost_ratio ?? null,
    "percent",
  );

  const maxAvgSales = weekdayPattern.length
    ? Math.max(...weekdayPattern.map((p) => p.avg_sales))
    : 0;

  const maxMenuQty = menuSales.length ? menuSales[0].total_qty : 0;

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-50">
      <Sidebar />
      <div className="flex min-h-screen flex-1 flex-col">
        <Topbar />
        <main className="flex-1 px-4 py-4 pb-8 lg:px-6 lg:py-6">
          <div className="mx-auto flex max-w-6xl flex-col gap-4">
            {/* 헤더 */}
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
              <div>
                <h1 className="text-xl font-semibold tracking-tight text-slate-50 sm:text-2xl">
                  오늘 매출 한눈에 보기
                </h1>
                <p className="mt-1 text-xs text-slate-400 sm:text-sm">
                  매출 · 원가율 · 예상 이익 · 재고를 한 화면에서 확인하세요.
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                <span>오늘 기준</span>
              </div>
            </div>

            {/* KPI 4개 */}
            <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <KpiCard
                label="오늘 총 매출"
                value={today ? formatCurrency(today.total_sales) : "-"}
                subLabel="쿠폰 · 배달앱 포함"
                trend={salesTrend?.label}
                trendType={salesTrend?.type}
                pill="Sales"
              />
              <KpiCard
                label="오늘 식재료 원가"
                value={today ? formatCurrency(today.food_cost) : "-"}
                subLabel="레시피 기준 자동 계산"
                trend={costTrend?.label}
                trendType={costTrend?.type}
                pill="Food Cost"
              />
              <KpiCard
                label="매장 매출 총이익"
                value={today ? formatCurrency(today.gross_profit) : "-"}
                subLabel="인건비·임대료 제외"
                trend={profitTrend?.label}
                trendType={profitTrend?.type}
                pill="Gross Profit"
              />
              <KpiCard
                label="오늘 원가율"
                value={
                  today
                    ? `${Number(today.food_cost_ratio).toFixed(1)}%`
                    : "-"
                }
                subLabel="목표 원가율 32%"
                trend={ratioTrend?.label}
                trendType={ratioTrend?.type}
                pill="Food Cost %"
              />
            </section>

            {/* 재고 경고 (alerts 있을 때만) */}
            {(stockAlerts as any[]).length > 0 && (
              <SectionCard
                title="재고 경고"
                description="부족하거나 소진 임박한 품목입니다."
              >
                <div className="space-y-2">
                  {(stockAlerts as any[]).map((alert) => (
                    <div
                      key={alert.item_id}
                      className={`flex items-center justify-between rounded-lg px-4 py-2 ${
                        alert.alert_level === "critical"
                          ? "bg-red-950/50 text-red-200"
                          : "bg-amber-950/50 text-amber-200"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs font-bold ${
                            alert.alert_level === "critical"
                              ? "text-red-400"
                              : "text-amber-400"
                          }`}
                        >
                          {alert.alert_level === "critical" ? "소진" : "주의"}
                        </span>
                        <span className="text-sm font-medium">
                          {alert.item_name}
                        </span>
                      </div>
                      <div className="text-right text-xs">
                        <span className="font-mono">
                          {alert.current_qty}
                          {alert.base_unit}
                        </span>
                        <span className="ml-2 text-slate-400">
                          / 기준 {Math.ceil(alert.threshold_qty)}
                          {alert.base_unit}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </SectionCard>
            )}

            {/* 메인 그리드 */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <div className="space-y-4 lg:col-span-2">
                {/* 오늘 메뉴 판매 현황 */}
                <SectionCard
                  title="오늘 메뉴 판매 현황"
                  description="메뉴별 판매 수량 Top 5"
                  right={
                    menuSales.length > 0 ? (
                      <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-slate-300">
                        Top {menuSales.length}
                      </span>
                    ) : undefined
                  }
                >
                  {menuSales.length === 0 ? (
                    <p className="py-6 text-center text-sm text-slate-500">
                      오늘 매출 데이터가 없습니다
                    </p>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {menuSales.map((item, idx) => (
                        <div
                          key={item.menu_item_id}
                          className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2"
                        >
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-800 text-xs font-semibold text-slate-200">
                            {idx + 1}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <div className="text-sm font-medium text-slate-50">
                                {item.menu_name}
                              </div>
                              <div className="text-xs text-slate-400">
                                {item.total_qty}개
                              </div>
                            </div>
                            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                              <div
                                className="h-full rounded-full bg-linear-to-r from-emerald-400 to-sky-400"
                                style={{
                                  width: `${maxMenuQty > 0 ? Math.min(100, (item.total_qty / maxMenuQty) * 100).toFixed(0) : 0}%`,
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </SectionCard>

                {/* 요일별 매출 패턴 */}
                <SectionCard
                  title="요일별 매출 패턴"
                  description="누적 데이터 기준 요일별 평균 매출"
                >
                  {weekdayPattern.length === 0 ? (
                    <p className="py-6 text-center text-sm text-slate-500">
                      데이터가 쌓이면 자동으로 표시됩니다
                    </p>
                  ) : (
                    <div className="grid grid-cols-7 gap-2 text-center text-[11px] text-slate-300">
                      {[0, 1, 2, 3, 4, 5, 6].map((dow) => {
                        const entry = weekdayPattern.find(
                          (p) => p.day_of_week === dow,
                        );
                        const heightPct =
                          entry && maxAvgSales > 0
                            ? Math.max(
                                10,
                                (entry.avg_sales / maxAvgSales) * 100,
                              )
                            : 10;
                        const isEmpty = !entry;

                        return (
                          <div
                            key={dow}
                            className="flex flex-col items-center gap-1 rounded-lg bg-slate-900/80 px-1.5 py-1.5"
                          >
                            <span className="text-[10px] text-slate-400">
                              {WEEKDAY_LABELS[dow]}
                            </span>
                            <div className="flex h-10 w-full items-end justify-center">
                              <div
                                className={`w-3 rounded-full bg-linear-to-t ${
                                  isEmpty
                                    ? "from-slate-800 to-slate-700"
                                    : "from-slate-700 to-emerald-400"
                                }`}
                                style={{ height: `${heightPct}%` }}
                              />
                            </div>
                            <span className="text-[10px] text-slate-500">
                              {entry
                                ? `${Math.round(entry.avg_sales / 10000)}만`
                                : "-"}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </SectionCard>
              </div>

              <div className="space-y-4">
                {/* 재고 요약 */}
                <SectionCard
                  title="재고 요약"
                  description="경고 품목만 표시. 상세는 재고 관리에서 확인하세요."
                  right={
                    <a
                      href="/inventory"
                      className="text-[11px] font-medium text-emerald-400 hover:text-emerald-300"
                    >
                      재고 관리 →
                    </a>
                  }
                >
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between rounded-lg bg-slate-900/80 px-2.5 py-1.5">
                      <span className="text-slate-400">경고 품목 수</span>
                      <span
                        className={
                          (stockAlerts as any[]).length > 0
                            ? "font-semibold text-red-300"
                            : "font-medium text-slate-100"
                        }
                      >
                        {(stockAlerts as any[]).length}개
                      </span>
                    </div>
                    {(stockAlerts as any[]).length === 0 ? (
                      <p className="text-[11px] text-slate-500">
                        재고 부족·임박 품목 없음
                      </p>
                    ) : (
                      <ul className="space-y-0.5">
                        {(stockAlerts as any[]).slice(0, 5).map((alert) => (
                          <li
                            key={alert.item_id}
                            className="flex items-center justify-between rounded bg-slate-800/60 px-2 py-1 text-[11px]"
                          >
                            <span
                              className={
                                alert.alert_level === "critical"
                                  ? "text-red-300"
                                  : "text-amber-300"
                              }
                            >
                              {alert.item_name}
                            </span>
                            <span className="font-mono text-slate-400">
                              {alert.current_qty}
                              {alert.base_unit}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </SectionCard>

                {/* 메뉴별 마진 */}
                <SectionCard
                  title="메뉴별 원가율"
                  description="레시피 + 평균 입고가 기준 자동 계산"
                >
                  {margins.length === 0 ? (
                    <p className="py-4 text-center text-xs text-slate-500">
                      레시피와 입고 데이터가 쌓이면 자동으로 계산됩니다
                    </p>
                  ) : (
                    <div className="space-y-1.5 text-[11px] text-slate-300">
                      {margins.map((m) => (
                        <div
                          key={m.name}
                          className="flex items-center justify-between"
                        >
                          <span>{m.name}</span>
                          <span className={costRatioColor(m.cost_ratio)}>
                            원가율 {m.cost_ratio}%
                          </span>
                        </div>
                      ))}
                    </div>
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
