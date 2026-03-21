import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { KpiCard } from "@/components/ui/KpiCard";
import { SectionCard } from "@/components/ui/SectionCard";
import type { Ingredient } from "@/lib/domain";
import {
  initialInventory,
  ingredients,
  menus,
  recipes,
  setMenuComponents,
  todaySaleLines,
  todaySales,
} from "@/lib/sampleData";
import {
  applyInventoryConsumption,
  computeIngredientUsage,
  detectLowStock,
  expandSetMenus,
  sumMenuQuantities,
} from "@/lib/calculations";
import { getStockAlerts } from "@/lib/inventory/queries";

function formatCurrency(value: number) {
  return value.toLocaleString("ko-KR", {
    style: "currency",
    currency: "KRW",
    maximumFractionDigits: 0,
  });
}

export default async function Home() {
  const today = todaySales[0];
  const foodCostRatio =
    today && today.totalAmount > 0
      ? (today.foodCost / today.totalAmount) * 100
      : 0;

  const expandedLines = expandSetMenus(
    todaySaleLines,
    menus,
    setMenuComponents,
  );
  const menuQty = sumMenuQuantities(expandedLines);

  const usage = computeIngredientUsage(
    expandedLines,
    menus,
    recipes,
    setMenuComponents,
  );
  const afterInventory = applyInventoryConsumption(
    initialInventory,
    usage,
  );
  const alerts = detectLowStock(afterInventory, ingredients);

  const withRatio = afterInventory
    .map((inv) => {
      const ing = ingredients.find((i) => i.id === inv.ingredientId);
      if (!ing) return null;
      const ratio =
        ing.lowStockThreshold > 0
          ? inv.quantity / ing.lowStockThreshold
          : 1;
      return {
        ing,
        remaining: inv.quantity,
        threshold: ing.lowStockThreshold,
        ratio,
        isLow: inv.quantity <= ing.lowStockThreshold,
      };
    })
    .filter(Boolean) as {
    ing: Ingredient;
    remaining: number;
    threshold: number;
    ratio: number;
    isLow: boolean;
  }[];

  const attentionItems = withRatio
    .filter((x) => x.ratio <= 1.2)
    .sort((a, b) => a.ratio - b.ratio)
    .slice(0, 5);

  const bestMenus = [...menuQty.entries()]
    .map(([menuId, qty]) => ({
      menu: menus.find((m) => m.id === menuId)!,
      quantity: qty,
    }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  const stockAlerts = await getStockAlerts();

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
                  오늘 매출 한눈에 보기
                </h1>
                <p className="mt-1 text-xs text-slate-400 sm:text-sm">
                  매출 · 원가율 · 예상 이익 · 재고를 한 화면에서 확인하세요.
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                <span>서울대입구 직영점</span>
                <span className="text-slate-600">·</span>
                <span>오늘 기준</span>
              </div>
            </div>

            <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <KpiCard
                label="오늘 총 매출"
                value={today ? formatCurrency(today.totalAmount) : "-"}
                subLabel="쿠폰 · 배달앱 포함"
                trend="+8.3% 증가"
                trendType="up"
                pill="Sales"
              />
              <KpiCard
                label="오늘 식재료 원가"
                value={today ? formatCurrency(today.foodCost) : "-"}
                subLabel="레시피 기준 자동 계산"
                trend="+3.1% 증가"
                trendType="up"
                pill="Food Cost"
              />
              <KpiCard
                label="예상 매장 매출 총이익"
                value={today ? formatCurrency(today.grossProfit) : "-"}
                subLabel="인건비·임대료 제외"
                trend="+5.2% 증가"
                trendType="up"
                pill="Gross Profit"
              />
              <KpiCard
                label="오늘 원가율"
                value={today ? `${foodCostRatio.toFixed(1)}%` : "-"}
                subLabel="목표 원가율 32%"
                trend="-0.6%p 개선"
                trendType="down"
                pill="Food Cost %"
              />
            </section>

            {stockAlerts.length > 0 && (
              <SectionCard
                title="재고 경고"
                description="부족하거나 소진 임박한 품목입니다."
              >
                <div className="space-y-2">
                  {stockAlerts.map((alert: any) => (
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
                        <span className="text-sm font-medium">{alert.item_name}</span>
                      </div>
                      <div className="text-right text-xs">
                        <span className="font-mono">
                          {alert.current_qty}{alert.base_unit}
                        </span>
                        <span className="ml-2 text-slate-400">
                          / 기준 {Math.ceil(alert.threshold_qty)}{alert.base_unit}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </SectionCard>
            )}

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <div className="space-y-4 lg:col-span-2">
                <SectionCard
                  title="오늘 메뉴 판매 현황"
                  description="단품 + 세트 판매를 메뉴별로 자동 집계합니다."
                  right={
                    <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-slate-300">
                      Top {bestMenus.length}
                    </span>
                  }
                >
                  <div className="flex flex-col gap-3">
                    {bestMenus.map((item, idx) => (
                      <div
                        key={item.menu.id}
                        className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2"
                      >
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-800 text-xs font-semibold text-slate-200">
                          {idx + 1}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <div className="text-sm font-medium text-slate-50">
                              {item.menu.name}
                            </div>
                            <div className="text-xs text-slate-400">
                              {item.quantity} 그릇
                            </div>
                          </div>
                          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-sky-400"
                              style={{
                                width: `${Math.min(
                                  100,
                                  (item.quantity / bestMenus[0].quantity) *
                                    100,
                                ).toFixed(0)}%`,
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </SectionCard>

                <SectionCard
                  title="요일별 매출 패턴 (예시)"
                  description="최근 4주 누적 기준으로 요일별 매출 패턴을 미리 보여줍니다."
                >
                  <div className="grid grid-cols-7 gap-2 text-center text-[11px] text-slate-300">
                    {["월", "화", "수", "목", "금", "토", "일"].map(
                      (label, idx) => (
                        <div
                          key={label}
                          className="flex flex-col items-center gap-1 rounded-lg bg-slate-900/80 px-1.5 py-1.5"
                        >
                          <span className="text-[10px] text-slate-400">
                            {label}
                          </span>
                          <div className="flex h-10 w-full items-end justify-center">
                            <div
                              className="w-3 rounded-full bg-gradient-to-t from-slate-700 to-emerald-400"
                              style={{
                                height: `${40 + idx * 8}%`,
                              }}
                            />
                          </div>
                          <span className="text-[10px] text-slate-400">
                            {idx >= 4 ? "강세" : "보통"}
                          </span>
                        </div>
                      ),
                    )}
                  </div>
                </SectionCard>
              </div>

              <div className="space-y-4">
                <SectionCard
                  title="재고 요약"
                  description="재고 부족·주의 품목만 간단히 표시합니다. 상세는 재고 관리에서 확인하세요."
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
                      <span className="text-slate-400">재고 부족 품목 수</span>
                      <span
                        className={
                          alerts.length > 0
                            ? "font-semibold text-red-300"
                            : "font-medium text-slate-100"
                        }
                      >
                        {alerts.length}개
                      </span>
                    </div>
                    {alerts.length > 0 && (
                      <div className="rounded-lg border border-red-900/50 bg-red-950/30 px-2.5 py-1.5">
                        <div className="text-[10px] font-medium uppercase tracking-wider text-red-300">
                          주의 필요
                        </div>
                        <ul className="mt-1 space-y-0.5">
                          {alerts.slice(0, 3).map((a) => {
                            const ing = ingredients.find(
                              (i) => i.id === a.ingredientId,
                            );
                            return ing ? (
                              <li
                                key={a.ingredientId}
                                className="text-[11px] text-red-100"
                              >
                                {ing.name}{" "}
                                {Math.round(a.remaining).toLocaleString()}
                                {ing.unit}
                              </li>
                            ) : null;
                          })}
                        </ul>
                      </div>
                    )}
                    <div className="text-[10px] text-slate-500">
                      주의 품목 TOP 5 (부족·임박)
                    </div>
                    <ul className="space-y-0.5">
                      {attentionItems.length === 0 ? (
                        <li className="text-[11px] text-slate-500">
                          재고 부족·임박 품목 없음
                        </li>
                      ) : (
                        attentionItems.map((item) => (
                          <li
                            key={item.ing.id}
                            className="flex items-center justify-between rounded bg-slate-800/60 px-2 py-1 text-[11px]"
                          >
                            <span className="text-slate-200">
                              {item.ing.name}
                            </span>
                            <span
                              className={
                                item.isLow
                                  ? "text-red-300"
                                  : "text-amber-300"
                              }
                            >
                              {Math.round(item.remaining).toLocaleString()}
                              {item.ing.unit} /{" "}
                              {item.threshold.toLocaleString()}
                              {item.ing.unit}
                            </span>
                          </li>
                        ))
                      )}
                    </ul>
                  </div>
                </SectionCard>

                <SectionCard
                  title="메뉴별 마진 요약 (예시)"
                  description="실제 매출 데이터가 쌓이면 자동으로 계산됩니다."
                >
                  <div className="space-y-1.5 text-[11px] text-slate-300">
                    <div className="flex items-center justify-between">
                      <span>짜장면</span>
                      <span className="text-emerald-300">원가율 29%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>짬뽕</span>
                      <span className="text-emerald-300">원가율 31%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>혼밥 세트</span>
                      <span className="text-yellow-300">원가율 34%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>A 세트</span>
                      <span className="text-red-300">원가율 37%</span>
                    </div>
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
