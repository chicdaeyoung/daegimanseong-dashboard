"use client";

import Link from "next/link";
import { useState } from "react";
import { SectionCard } from "@/components/ui/SectionCard";
import { ReceiptSlidePanel } from "@/components/inventory/ReceiptSlidePanel";
import { ItemHistoryPanel } from "@/components/inventory/ItemHistoryPanel";
import { formatCurrency } from "@/lib/inventory/utils";
import type { DashboardItem, Item, Supplier } from "@/lib/inventory/types";

type Props = {
  dashboardItems: DashboardItem[];
  activeItems: Item[];
  suppliers: Supplier[];
};

export function InventoryPageClient({
  dashboardItems,
  activeItems,
  suppliers,
}: Props) {
  const [panelOpen, setPanelOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<DashboardItem | null>(null);

  return (
    <>
      <div className="mx-auto max-w-6xl space-y-4">
        {/* 헤더 */}
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-slate-50 lg:text-2xl">
              재고 관리
            </h1>
            <p className="mt-1 text-xs text-slate-400 lg:text-sm">
              품목별 현재 재고, 평균 단가, 재고 금액입니다.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/"
              className="text-sm font-medium text-slate-400 hover:text-slate-200"
            >
              ← 대시보드
            </Link>
            <Link
              href="/inventory/items/new"
              className="inline-flex items-center justify-center rounded-xl border border-slate-600 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800"
            >
              품목 추가
            </Link>
            <Link
              href="/inventory/suppliers"
              className="inline-flex items-center justify-center rounded-xl border border-slate-600 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800"
            >
              공급처 관리
            </Link>
            <button
              onClick={() => setPanelOpen(true)}
              className="inline-flex items-center justify-center rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/30 hover:bg-emerald-400"
            >
              입고 등록
            </button>
          </div>
        </div>

        {/* 재고 현황 테이블 */}
        <SectionCard
          title="재고 현황"
          description="품목별 현재 수량(구매단위 기준)·평균 단가·재고 금액·최근 입고일"
        >
          {dashboardItems.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">
              등록된 품목이 없거나 Supabase가 연결되지 않았습니다. 품목을 추가하고 입고를 등록하면 여기에 표시됩니다.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-slate-700 text-xs uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="pb-3 pr-4">품목</th>
                    <th className="pb-3 pr-4 text-right">현재 수량</th>
                    <th className="pb-3 pr-4">단위</th>
                    <th className="pb-3 pr-4 text-right">평균 단가</th>
                    <th className="pb-3 pr-4 text-right">재고 금액</th>
                    <th className="pb-3">최근 입고일</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {dashboardItems.map((row) => {
                    const currentQty = Number(row.stock?.current_qty ?? 0);
                    const unitConversion = row.unit_conversion ?? 1;
                    const displayQty =
                      unitConversion > 1
                        ? currentQty / unitConversion
                        : currentQty;
                    const displayUnit = row.purchase_unit ?? row.base_unit;

                    return (
                      <tr
                        key={row.id}
                        className="cursor-pointer hover:bg-slate-800/50 transition-colors"
                        onClick={() => setSelectedItem(row)}
                      >
                        <td className="py-3 pr-4 font-medium text-slate-100">
                          <span className="hover:text-emerald-400 transition-colors">
                            {row.name}
                          </span>
                        </td>
                        <td className="py-3 pr-4 text-right text-slate-200">
                          {displayQty.toLocaleString("ko-KR", {
                            maximumFractionDigits: 3,
                          })}
                        </td>
                        <td className="py-3 pr-4 text-slate-300">
                          {displayUnit}
                        </td>
                        <td className="py-3 pr-4 text-right text-slate-200">
                          {formatCurrency(
                            Number(row.stock?.avg_unit_cost ?? 0),
                            4,
                          )}
                        </td>
                        <td className="py-3 pr-4 text-right text-slate-200">
                          {formatCurrency(row.stock_amount, 0)}
                        </td>
                        <td className="py-3 text-slate-400">
                          {row.stock?.last_inbound_at
                            ? new Date(
                                row.stock.last_inbound_at,
                              ).toLocaleDateString("ko-KR")
                            : "-"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>
      </div>

      {/* 입고 등록 슬라이드 패널 */}
      <ReceiptSlidePanel
        isOpen={panelOpen}
        onClose={() => setPanelOpen(false)}
        items={activeItems}
        suppliers={suppliers}
      />

      {/* 품목 입고 히스토리 패널 */}
      <ItemHistoryPanel
        itemId={selectedItem?.id ?? null}
        itemName={selectedItem?.name ?? ""}
        purchaseUnit={selectedItem?.purchase_unit ?? selectedItem?.base_unit ?? ""}
        unitConversion={selectedItem?.unit_conversion ?? 1}
        onClose={() => setSelectedItem(null)}
      />
    </>
  );
}
