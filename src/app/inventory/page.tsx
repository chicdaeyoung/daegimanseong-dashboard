"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { SectionCard } from "@/components/ui/SectionCard";
import {
  actualInventory,
  inboundTransactionsSeed,
  initialInventory,
  ingredients,
  menus,
  recipes,
  setMenuComponents,
  todaySaleLines,
  unitConversions,
} from "@/lib/sampleData";
import {
  applyInventoryConsumption,
  computeWeightedAverageCost,
  computeIngredientUsage,
  expandSetMenus,
  getInboundUnitLabel,
  getMultiplierToBase,
} from "@/lib/calculations";
import type { InboundUnit, InventoryInbound } from "@/lib/domain";

type TabId = "all" | "low" | "difference" | "loss" | "history";

const TABS: { id: TabId; label: string }[] = [
  { id: "all", label: "전체 재고" },
  { id: "low", label: "재고 부족" },
  { id: "difference", label: "재고 차이" },
  { id: "loss", label: "손실 분석" },
  { id: "history", label: "재고 이력" },
];

/** Stub inventory history for demo. In production, from DB. */
const INVENTORY_HISTORY = [
  { date: "2026-03-14", ingredientName: "중화면", type: "usage", quantity: 2520 },
  { date: "2026-03-13", ingredientName: "군만두", type: "inbound", quantity: 100 },
  { date: "2026-03-13", ingredientName: "춘장 소스", type: "usage", quantity: 660 },
  { date: "2026-03-12", ingredientName: "탕수육 돼지고기", type: "inbound", quantity: 5000 },
  { date: "2026-03-12", ingredientName: "야채 믹스", type: "usage", quantity: 880 },
];

export default function InventoryPage() {
  const [tab, setTab] = useState<TabId>("all");
  const [inbounds, setInbounds] = useState<InventoryInbound[]>(
    inboundTransactionsSeed,
  );
  const [stockBaseByIngredient, setStockBaseByIngredient] = useState<
    Record<string, number>
  >(() => {
    const map: Record<string, number> = {};
    for (const inv of actualInventory) {
      map[inv.ingredientId] = inv.quantity;
    }
    return map;
  });
  const [avgCostPerBaseByIngredient, setAvgCostPerBaseByIngredient] = useState<
    Record<string, number>
  >(() => {
    const map: Record<string, number> = {};
    for (const ing of ingredients) {
      // 초기 평균 단가는 기존 costPerUnit (base unit)로 시작
      map[ing.id] = ing.costPerUnit;
    }
    return map;
  });

  const [inboundIngredientId, setInboundIngredientId] = useState(
    ingredients[0]?.id ?? "",
  );
  const [inboundUnit, setInboundUnit] = useState<InboundUnit>("KG");
  const [inboundQty, setInboundQty] = useState<number>(1);
  const [purchasePricePerUnit, setPurchasePricePerUnit] = useState<number>(0);
  const [supplier, setSupplier] = useState<string>("");

  const usage = useMemo(
    () =>
      computeIngredientUsage(
        expandSetMenus(todaySaleLines, menus, setMenuComponents),
        menus,
        recipes,
        setMenuComponents,
      ),
    [],
  );

  const theoreticalInventory = useMemo(
    () => applyInventoryConsumption(initialInventory, usage),
    [usage],
  );

  const inboundUnitOptions = useMemo(() => {
    return unitConversions
      .filter((c) => c.ingredientId === inboundIngredientId)
      .map((c) => c.inboundUnit);
  }, [inboundIngredientId]);

  const handleInboundSubmit = () => {
    if (!inboundIngredientId) return;
    const multiplier = getMultiplierToBase({
      ingredientId: inboundIngredientId,
      inboundUnit,
      conversions: unitConversions,
    });
    if (!multiplier || multiplier <= 0) {
      alert("해당 단위 변환 설정이 없습니다. 단위를 확인해 주세요.");
      return;
    }
    if (!Number.isFinite(inboundQty) || inboundQty <= 0) {
      alert("수량을 확인해 주세요.");
      return;
    }
    if (!Number.isFinite(purchasePricePerUnit) || purchasePricePerUnit <= 0) {
      alert("매입 단가를 확인해 주세요.");
      return;
    }

    const inboundQuantityBase = inboundQty * multiplier;
    const inboundCostPerBase = purchasePricePerUnit / multiplier;

    setStockBaseByIngredient((prev) => {
      const current = prev[inboundIngredientId] ?? 0;
      return { ...prev, [inboundIngredientId]: current + inboundQuantityBase };
    });

    setAvgCostPerBaseByIngredient((prev) => {
      const currentStock = stockBaseByIngredient[inboundIngredientId] ?? 0;
      const currentAvg = prev[inboundIngredientId] ?? 0;
      const { newAvgCostPerBase } = computeWeightedAverageCost({
        currentStockBase: currentStock,
        currentAvgCostPerBase: currentAvg,
        inboundQuantityBase,
        inboundCostPerBase,
      });
      return { ...prev, [inboundIngredientId]: newAvgCostPerBase };
    });

    const tx: InventoryInbound = {
      id: `inb-${Date.now()}`,
      storeId: "store-1",
      ingredientId: inboundIngredientId,
      inboundAt: new Date().toISOString(),
      inboundUnit,
      quantity: inboundQty,
      purchasePricePerUnit,
      supplier: supplier.trim() ? supplier.trim() : undefined,
    };
    setInbounds((prev) => [tx, ...prev]);

    // reset minimal fields
    setInboundQty(1);
    setPurchasePricePerUnit(0);
    setSupplier("");
  };

  const rows = useMemo(() => {
    return ingredients.map((ing) => {
      const theoretical = theoreticalInventory.find(
        (i) => i.ingredientId === ing.id,
      )?.quantity ?? 0;
      const actual = stockBaseByIngredient[ing.id] ?? 0;
      const difference = actual - theoretical;
      const lossRate =
        theoretical > 0
          ? Math.max(0, ((theoretical - actual) / theoretical) * 100)
          : 0;
      const recentUsage = usage.get(ing.id) ?? 0;
      const isLow = actual <= ing.lowStockThreshold;
      const avgUnitCost = avgCostPerBaseByIngredient[ing.id] ?? ing.costPerUnit;
      const inventoryValue = actual * avgUnitCost;

      const recentInboundBase = inbounds
        .filter((t) => t.ingredientId === ing.id)
        .slice(0, 5)
        .reduce((sum, t) => {
          const mult = getMultiplierToBase({
            ingredientId: t.ingredientId,
            inboundUnit: t.inboundUnit,
            conversions: unitConversions,
          });
          return sum + (mult ? t.quantity * mult : 0);
        }, 0);

      return {
        ing,
        theoretical,
        actual,
        difference,
        lossRate,
        recentInbound: recentInboundBase,
        recentUsage,
        isLow,
        avgUnitCost,
        inventoryValue,
      };
    });
  }, [
    theoreticalInventory,
    usage,
    stockBaseByIngredient,
    avgCostPerBaseByIngredient,
    inbounds,
  ]);

  const filteredRows = useMemo(() => {
    switch (tab) {
      case "low":
        return rows.filter((r) => r.isLow);
      case "difference":
        return rows.filter((r) => r.difference !== 0);
      case "loss":
        return rows
          .filter((r) => r.difference < 0)
          .sort((a, b) => b.lossRate - a.lossRate);
      default:
        return rows;
    }
  }, [rows, tab]);

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-50">
      <Sidebar />
      <div className="flex min-h-screen flex-1 flex-col">
        <Topbar />
        <main className="flex-1 px-4 py-4 pb-8 lg:px-8 lg:py-6">
          <div className="mx-auto max-w-6xl space-y-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h1 className="text-xl font-semibold tracking-tight text-slate-50 lg:text-2xl">
                  재고 관리
                </h1>
                <p className="mt-1 text-xs text-slate-400 lg:text-sm">
                  이론 재고·실사 재고·차이·손실률·입출고를 한 화면에서 확인하고
                  탭으로 필터링하세요.
                </p>
              </div>
              <Link
                href="/"
                className="text-xs font-medium text-emerald-400 hover:text-emerald-300"
              >
                ← 대시보드
              </Link>
            </div>

            <SectionCard
              title="재고 입고 등록"
              description="입고 단위(BOX/KG/EA 등)로 입력하면 기본 단위로 환산되어 재고와 평균 단가가 자동 업데이트됩니다."
            >
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-6">
                <label className="lg:col-span-2">
                  <div className="mb-1 text-[11px] uppercase tracking-wider text-slate-400">
                    식자재
                  </div>
                  <select
                    value={inboundIngredientId}
                    onChange={(e) => setInboundIngredientId(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2 py-2 text-sm text-slate-100 outline-none focus:border-emerald-500"
                  >
                    {ingredients.map((ing) => (
                      <option key={ing.id} value={ing.id}>
                        {ing.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  <div className="mb-1 text-[11px] uppercase tracking-wider text-slate-400">
                    입고 단위
                  </div>
                  <select
                    value={inboundUnit}
                    onChange={(e) => setInboundUnit(e.target.value as InboundUnit)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2 py-2 text-sm text-slate-100 outline-none focus:border-emerald-500"
                  >
                    {(inboundUnitOptions.length > 0
                      ? inboundUnitOptions
                      : (["KG", "G", "L", "ML", "EA", "BOX"] as InboundUnit[])
                    ).map((u) => (
                      <option key={u} value={u}>
                        {getInboundUnitLabel(u)}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  <div className="mb-1 text-[11px] uppercase tracking-wider text-slate-400">
                    수량
                  </div>
                  <input
                    type="number"
                    min={0}
                    value={inboundQty}
                    onChange={(e) => setInboundQty(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2 py-2 text-sm text-slate-100 outline-none focus:border-emerald-500"
                  />
                </label>

                <label>
                  <div className="mb-1 text-[11px] uppercase tracking-wider text-slate-400">
                    매입 단가 (단위당)
                  </div>
                  <input
                    type="number"
                    min={0}
                    value={purchasePricePerUnit}
                    onChange={(e) =>
                      setPurchasePricePerUnit(Number(e.target.value))
                    }
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2 py-2 text-sm text-slate-100 outline-none focus:border-emerald-500"
                    placeholder="예) 42000"
                  />
                </label>

                <label className="lg:col-span-1">
                  <div className="mb-1 text-[11px] uppercase tracking-wider text-slate-400">
                    공급처 (선택)
                  </div>
                  <input
                    value={supplier}
                    onChange={(e) => setSupplier(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2 py-2 text-sm text-slate-100 outline-none focus:border-emerald-500"
                    placeholder="예) 대기식자재"
                  />
                </label>

                <div className="lg:col-span-6">
                  <button
                    type="button"
                    onClick={handleInboundSubmit}
                    className="inline-flex items-center justify-center rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-400"
                  >
                    입고 등록 · 평균 단가 업데이트
                  </button>
                  <p className="mt-2 text-[11px] text-slate-500">
                    재고는 기본 단위(g/ml/piece)로 저장됩니다. 평균 단가는 가중평균
                    방식으로 자동 갱신됩니다.
                  </p>
                </div>
              </div>
            </SectionCard>

            <SectionCard
              title="재고 목록"
              description="전체 품목 또는 탭별로 재고 현황을 확인합니다."
              right={
                <div className="flex flex-wrap gap-1">
                  {TABS.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTab(t.id)}
                      className={
                        tab === t.id
                          ? "rounded-lg bg-emerald-500/20 px-2.5 py-1 text-xs font-medium text-emerald-300"
                          : "rounded-lg bg-slate-800/80 px-2.5 py-1 text-xs text-slate-300 hover:bg-slate-700 hover:text-slate-100"
                      }
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              }
            >
              {tab === "history" ? (
                <div className="overflow-hidden rounded-xl border border-slate-800">
                  <table className="min-w-full text-left text-sm">
                    <thead className="bg-slate-900/95 text-[11px] uppercase tracking-wider text-slate-400">
                      <tr>
                        <th className="px-3 py-2">일자</th>
                        <th className="px-3 py-2">품목</th>
                        <th className="px-3 py-2">구분</th>
                        <th className="px-3 py-2 text-right">수량</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {inbounds.slice(0, 12).map((t) => {
                        const ing = ingredients.find((i) => i.id === t.ingredientId);
                        return (
                          <tr key={t.id} className="hover:bg-slate-800/40">
                            <td className="px-3 py-2 text-slate-200">
                              {new Date(t.inboundAt).toLocaleDateString("ko-KR")}
                            </td>
                            <td className="px-3 py-2 text-slate-200">
                              {ing?.name ?? "-"}
                            </td>
                            <td className="px-3 py-2">
                              <span className="text-emerald-400">입고</span>
                            </td>
                            <td className="px-3 py-2 text-right text-slate-200">
                              {t.quantity.toLocaleString()} {getInboundUnitLabel(t.inboundUnit)} ·{" "}
                              {t.purchasePricePerUnit.toLocaleString()}원
                            </td>
                          </tr>
                        );
                      })}
                      {INVENTORY_HISTORY.map((h, i) => (
                        <tr
                          key={i}
                          className="hover:bg-slate-800/40"
                        >
                          <td className="px-3 py-2 text-slate-200">
                            {h.date}
                          </td>
                          <td className="px-3 py-2 text-slate-200">
                            {h.ingredientName}
                          </td>
                          <td className="px-3 py-2">
                            <span
                              className={
                                h.type === "inbound"
                                  ? "text-emerald-400"
                                  : "text-amber-400"
                              }
                            >
                              {h.type === "inbound" ? "입고" : "사용"}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-right text-slate-200">
                            {h.quantity.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead className="bg-slate-900/95 text-[11px] uppercase tracking-wider text-slate-400">
                      <tr>
                        <th className="px-3 py-2">품목</th>
                        <th className="px-2 py-2">단위</th>
                        <th className="px-2 py-2 text-right">현재 재고</th>
                        <th className="px-2 py-2 text-right">평균 단가</th>
                        <th className="px-2 py-2 text-right">재고 금액</th>
                        <th className="px-2 py-2 text-right">이론 재고</th>
                        <th className="px-2 py-2 text-right">차이</th>
                        <th className="px-2 py-2 text-right">손실률</th>
                        <th className="px-2 py-2 text-right">최근 입고</th>
                        <th className="px-2 py-2 text-right">최근 사용</th>
                        <th className="px-3 py-2">재고 상태</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {filteredRows.map((r) => (
                        <tr
                          key={r.ing.id}
                          className="hover:bg-slate-800/40"
                        >
                          <td className="px-3 py-2 font-medium">
                            <Link
                              href={`/inventory/${r.ing.id}`}
                              className="text-slate-50 hover:text-emerald-300"
                            >
                              {r.ing.name}
                            </Link>
                          </td>
                          <td className="px-2 py-2 text-slate-400">
                            {r.ing.unit}
                          </td>
                          <td className="px-2 py-2 text-right text-slate-200">
                            {Math.round(r.actual).toLocaleString()}
                          </td>
                          <td className="px-2 py-2 text-right text-slate-200">
                            {r.avgUnitCost.toLocaleString("ko-KR", {
                              maximumFractionDigits: r.ing.unit === "piece" ? 0 : 4,
                            })}
                          </td>
                          <td className="px-2 py-2 text-right text-slate-200">
                            {Math.round(r.inventoryValue).toLocaleString()}원
                          </td>
                          <td className="px-2 py-2 text-right text-slate-300">
                            {Math.round(r.theoretical).toLocaleString()}
                          </td>
                          <td
                            className={`px-2 py-2 text-right ${
                              r.difference < 0
                                ? "text-red-300"
                                : r.difference > 0
                                  ? "text-emerald-300"
                                  : "text-slate-400"
                            }`}
                          >
                            {r.difference >= 0 ? "+" : ""}
                            {Math.round(r.difference).toLocaleString()}
                          </td>
                          <td className="px-2 py-2 text-right">
                            <span
                              className={
                                r.lossRate > 0 ? "text-amber-300" : "text-slate-400"
                              }
                            >
                              {r.lossRate > 0
                                ? `${r.lossRate.toFixed(1)}%`
                                : "-"}
                            </span>
                          </td>
                          <td className="px-2 py-2 text-right text-slate-300">
                            {r.recentInbound > 0
                              ? r.recentInbound.toLocaleString()
                              : "-"}
                          </td>
                          <td className="px-2 py-2 text-right text-slate-300">
                            {r.recentUsage > 0
                              ? Math.round(r.recentUsage).toLocaleString()
                              : "-"}
                          </td>
                          <td className="px-3 py-2">
                            {r.isLow ? (
                              <span className="rounded bg-red-500/20 px-2 py-0.5 text-[10px] font-medium text-red-300">
                                부족
                              </span>
                            ) : (
                              <span className="rounded bg-slate-700/80 px-2 py-0.5 text-[10px] text-slate-400">
                                정상
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {tab !== "history" && filteredRows.length === 0 && (
                <p className="py-6 text-center text-sm text-slate-500">
                  해당 조건에 맞는 품목이 없습니다.
                </p>
              )}
            </SectionCard>
          </div>
        </main>
      </div>
    </div>
  );
}
