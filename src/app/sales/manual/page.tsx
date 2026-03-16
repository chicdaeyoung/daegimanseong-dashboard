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
  setMenuComponents,
} from "@/lib/sampleData";
import { computeTotalsAndCost } from "@/lib/calculations";

type QuantityMap = Record<string, number>;

function formatCurrency(value: number) {
  if (!Number.isFinite(value)) return "-";
  return value.toLocaleString("ko-KR", {
    style: "currency",
    currency: "KRW",
    maximumFractionDigits: 0,
  });
}

export default function ManualSalesPage() {
  const [date, setDate] = useState(() => {
    const today = new Date();
    return today.toISOString().slice(0, 10);
  });
  const [quantities, setQuantities] = useState<QuantityMap>({});
  const [excelFileName, setExcelFileName] = useState<string | null>(null);
  const [excelApplied, setExcelApplied] = useState(false);

  const handleQuantityChange = (menuId: string, value: string) => {
    const parsed = Number.parseInt(value, 10);
    setQuantities((prev) => ({
      ...prev,
      [menuId]: Number.isNaN(parsed) || parsed < 0 ? 0 : parsed,
    }));
  };

  const handleExcelUpload = (file: File | null) => {
    if (!file) {
      setExcelFileName(null);
      setExcelApplied(false);
      return;
    }
    setExcelFileName(file.name);
    setExcelApplied(false);

    // MVP: pretend we parsed an exported POS Excel and found quantities.
    // In real implementation, use a library like SheetJS to parse.
    const demoQuantities: QuantityMap = {
      "menu-jjajang": 20,
      "menu-jjamppong": 12,
      "menu-fried-rice": 9,
      "menu-tangsuyuk": 6,
      "menu-gunmandu": 8,
      "menu-honbap-set": 5,
      "menu-a-set": 4,
    };

    setQuantities((prev) => ({
      ...prev,
      ...demoQuantities,
    }));
    setExcelApplied(true);
  };

  const saleLines = useMemo(() => {
    return menus
      .filter((m) => m.category === "single" || m.category === "set")
      .map((menu) => {
        const qty = quantities[menu.id] ?? 0;
        return {
          id: `draft-${menu.id}`,
          saleId: "draft",
          menuId: menu.id,
          quantity: qty,
          unitPrice: menu.price,
          totalPrice: menu.price * qty,
        };
      })
      .filter((line) => line.quantity > 0);
  }, [quantities]);

  const { totalSales, foodCost, grossProfit, foodCostRatio } = useMemo(() => {
    if (saleLines.length === 0) {
      return {
        totalSales: 0,
        foodCost: 0,
        grossProfit: 0,
        foodCostRatio: 0,
      };
    }
    return computeTotalsAndCost({
      lines: saleLines,
      menus,
      recipes,
      setComponents: setMenuComponents,
      ingredients,
    });
  }, [saleLines]);

  const handleSave = () => {
    // TODO: connect to Supabase: insert into sales + sale_lines table.
    // For now we just log so the flow is visible in the prototype.
    console.log("Saving manual sale", {
      date,
      lines: saleLines,
      totals: { totalSales, foodCost, grossProfit, foodCostRatio },
    });
    alert("MVP 프로토타입: 저장 로직은 Supabase 연동 시 구현됩니다.");
  };

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
                  매장 매출 입력 (데스크톱 전용)
                </h1>
                <p className="mt-1 text-xs text-slate-400 lg:text-sm">
                  POS에서 내려받은 엑셀 또는 아래 테이블에 직접 입력해 오늘 매출을
                  등록하세요.
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <label className="flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900 px-3 py-1.5">
                  <span className="text-[11px] text-slate-400">영업일</span>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="border-none bg-transparent text-xs text-slate-100 outline-none"
                  />
                </label>
              </div>
            </div>

            <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <KpiCard
                label="입력된 총 매출"
                value={formatCurrency(totalSales)}
                subLabel="오늘 수기로 입력한 매출 합계"
                pill="Sales"
              />
              <KpiCard
                label="예상 식재료 원가"
                value={formatCurrency(foodCost)}
                subLabel="레시피 기준 자동 계산"
                pill="Food Cost"
              />
              <KpiCard
                label="예상 매출 총이익"
                value={formatCurrency(grossProfit)}
                subLabel="인건비·임대료 제외"
                pill="Gross Profit"
              />
              <KpiCard
                label="예상 원가율"
                value={
                  totalSales > 0
                    ? `${foodCostRatio.toFixed(1)}%`
                    : "- "
                }
                subLabel="목표 원가율과 비교해 보세요."
                pill="Food Cost %"
              />
            </section>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
              <div className="space-y-4">
                <SectionCard
                  title="메뉴별 매출 입력 (테이블)"
                  description="POS 엑셀 수치 또는 키인 수량을 그대로 입력하세요."
                >
                  <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/70">
                    <div className="max-h-[420px] overflow-auto scrollbar-thin">
                      <table className="min-w-full text-xs lg:text-sm">
                        <thead className="sticky top-0 bg-slate-900/95 text-[11px] uppercase tracking-[0.12em] text-slate-400">
                          <tr>
                            <th className="px-3 py-2 text-left">메뉴</th>
                            <th className="px-2 py-2 text-left">구분</th>
                            <th className="px-2 py-2 text-right">단가</th>
                            <th className="px-2 py-2 text-right">수량</th>
                            <th className="px-3 py-2 text-right">금액</th>
                          </tr>
                        </thead>
                        <tbody>
                          {menus.map((menu) => {
                            const qty = quantities[menu.id] ?? 0;
                            const lineTotal = menu.price * qty;
                            return (
                              <tr
                                key={menu.id}
                                className="border-t border-slate-800/70 hover:bg-slate-800/40"
                              >
                                <td className="px-3 py-1.5 text-slate-50">
                                  {menu.name}
                                </td>
                                <td className="px-2 py-1.5 text-[11px] text-slate-400">
                                  {menu.category === "set" ? "세트" : "단품"}
                                </td>
                                <td className="px-2 py-1.5 text-right text-slate-300">
                                  {formatCurrency(menu.price)}
                                </td>
                                <td className="px-2 py-1.5 text-right">
                                  <input
                                    type="number"
                                    min={0}
                                    inputMode="numeric"
                                    value={qty === 0 ? "" : qty}
                                    onChange={(e) =>
                                      handleQuantityChange(
                                        menu.id,
                                        e.target.value,
                                      )
                                    }
                                    className="w-16 rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-right text-xs text-slate-50 outline-none focus:border-emerald-500"
                                  />
                                </td>
                                <td className="px-3 py-1.5 text-right text-slate-100">
                                  {qty > 0 ? formatCurrency(lineTotal) : "-"}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </SectionCard>

                <SectionCard
                  title="입력 요약"
                  description="입력된 메뉴와 예상 매출을 한눈에 확인합니다."
                >
                  {saleLines.length === 0 ? (
                    <p className="text-xs text-slate-400">
                      아직 입력된 매출이 없습니다. 위 테이블에서 수량을 입력하거나
                      우측에서 엑셀 파일을 불러오세요.
                    </p>
                  ) : (
                    <div className="max-h-64 space-y-2 overflow-y-auto pr-1 text-xs scrollbar-thin">
                      {saleLines.map((line) => {
                        const menu = menus.find((m) => m.id === line.menuId);
                        if (!menu) return null;
                        return (
                          <div
                            key={line.id}
                            className="flex items-center justify-between rounded-lg bg-slate-900/80 px-2.5 py-1.5"
                          >
                            <div>
                              <div className="text-[13px] font-medium text-slate-50">
                                {menu.name}
                              </div>
                              <div className="mt-0.5 text-[11px] text-slate-400">
                                {line.quantity}개 ×{" "}
                                {formatCurrency(line.unitPrice)} ={" "}
                                <span className="text-slate-100">
                                  {formatCurrency(line.totalPrice)}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </SectionCard>
              </div>

              <div className="space-y-4">
                <SectionCard
                  title="POS 엑셀 업로드"
                  description="POS에서 내려받은 Excel/CSV 파일을 업로드하면 수량을 자동 채웁니다."
                >
                  <div className="space-y-2 text-xs">
                    <label className="flex cursor-pointer items-center justify-between rounded-lg border border-dashed border-slate-700 bg-slate-900/80 px-3 py-2 hover:border-emerald-500">
                      <div>
                        <div className="text-[13px] font-medium text-slate-50">
                          파일 선택
                        </div>
                        <p className="mt-0.5 text-[11px] text-slate-400">
                          .xlsx · .xls · .csv 지원 (MVP 데모용, 실제 파서는 추후 연동)
                        </p>
                      </div>
                      <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-slate-200">
                        찾아보기
                      </span>
                      <input
                        type="file"
                        accept=".xlsx,.xls,.csv"
                        className="hidden"
                        onChange={(e) =>
                          handleExcelUpload(e.target.files?.[0] ?? null)
                        }
                      />
                    </label>
                    {excelFileName && (
                      <p className="text-[11px] text-slate-400">
                        선택된 파일:{" "}
                        <span className="font-medium text-slate-100">
                          {excelFileName}
                        </span>{" "}
                        {excelApplied && (
                          <span className="ml-1 text-emerald-300">
                            · 수량 자동 반영 완료
                          </span>
                        )}
                      </p>
                    )}
                    <p className="mt-1 text-[11px] text-slate-500">
                      실제 운영 시에는 POS 내보내기 양식에 맞춰 열 이름-메뉴
                      매칭을 설정한 뒤, Excel 파서를 연동합니다.
                    </p>
                  </div>
                </SectionCard>
                <SectionCard
                  title="오늘 예상 지표"
                  description="입력된 매출 기준으로 계산된 오늘 지표입니다."
                >
                  <ul className="space-y-1.5 text-xs">
                    <li className="flex items-center justify-between">
                      <span className="text-slate-400">입력된 메뉴 수</span>
                      <span className="font-medium text-slate-100">
                        {saleLines.length}개
                      </span>
                    </li>
                    <li className="flex items-center justify-between">
                      <span className="text-slate-400">총 판매 수량</span>
                      <span className="font-medium text-slate-100">
                        {saleLines
                          .reduce((sum, l) => sum + l.quantity, 0)
                          .toLocaleString()}
                        개
                      </span>
                    </li>
                    <li className="flex items-center justify-between">
                      <span className="text-slate-400">예상 식재료 원가율</span>
                      <span className="font-medium text-emerald-300">
                        {totalSales > 0
                          ? `${foodCostRatio.toFixed(1)}%`
                          : "-"}
                      </span>
                    </li>
                  </ul>
                </SectionCard>

                <SectionCard
                  title="매출 저장"
                  description="저장 후에는 추후 분석 페이지에서 자동 반영됩니다."
                  right={
                    <span className="text-[11px] text-emerald-300">
                      MVP 프로토타입
                    </span>
                  }
                >
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saleLines.length === 0}
                    className="mt-1 inline-flex w-full items-center justify-center rounded-xl bg-emerald-500 px-3 py-2 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-300 disabled:shadow-none"
                  >
                    오늘 매출 저장 (예정)
                  </button>
                  <p className="mt-2 text-[11px] leading-relaxed text-slate-400">
                    현재는 로컬에서만 계산되는 프로토타입입니다. Supabase와 연동하면
                    이 버튼으로 매출 · 원가 · 재고까지 동시에 반영할 수 있습니다.
                  </p>
                </SectionCard>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

