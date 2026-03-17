import Link from "next/link";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { SectionCard } from "@/components/ui/SectionCard";
import { getInventoryDashboardItems } from "@/lib/inventory/queries";
import { formatCurrency } from "@/lib/inventory/utils";

export default async function InventoryPage() {
  const items = await getInventoryDashboardItems();

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
                  품목별 현재 재고, 평균 단가, 재고 금액입니다. 입고는 입고 등록에서 처리합니다.
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
                  href="/inventory/items"
                  className="text-sm font-medium text-slate-400 hover:text-slate-200"
                >
                  품목 관리
                </Link>
                <Link
                  href="/inventory/receipts"
                  className="text-sm font-medium text-slate-400 hover:text-slate-200"
                >
                  입고 목록
                </Link>
                <Link
                  href="/inventory/suppliers"
                  className="text-sm font-medium text-slate-400 hover:text-slate-200"
                >
                  공급처
                </Link>
                <Link
                  href="/inventory/receipts/new"
                  className="inline-flex items-center justify-center rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/30 hover:bg-emerald-400"
                >
                  입고 등록
                </Link>
              </div>
            </div>

            <SectionCard
              title="재고 현황"
              description="inventory_stocks 기준 현재 수량·평균 단가·재고 금액·최근 입고일"
            >
              {items.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-500">
                  등록된 품목이 없거나 Supabase가 연결되지 않았습니다. items 테이블에 품목을 추가하고 입고를 등록하면 여기에 표시됩니다.
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
                      {items.map((row) => (
                        <tr key={row.id} className="hover:bg-slate-800/30">
                          <td className="py-3 pr-4 font-medium text-slate-100">
                            {row.name}
                          </td>
                          <td className="py-3 pr-4 text-right text-slate-200">
                            {Number(row.stock?.current_qty ?? 0).toLocaleString(
                              "ko-KR",
                              { maximumFractionDigits: 3 },
                            )}
                          </td>
                          <td className="py-3 pr-4 text-slate-300">
                            {row.base_unit}
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
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </SectionCard>
          </div>
        </main>
      </div>
    </div>
  );
}
