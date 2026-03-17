import Link from "next/link";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { SectionCard } from "@/components/ui/SectionCard";
import { getReceiptList } from "@/lib/inventory/queries";
import { formatCurrency } from "@/lib/inventory/utils";

export default async function ReceiptsPage() {
  const receipts = await getReceiptList();

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
                  입고 목록
                </h1>
                <p className="mt-1 text-xs text-slate-400 lg:text-sm">
                  입고 전표 목록입니다. 상세 보기에서 품목별 내역을 확인할 수 있습니다.
                </p>
              </div>
              <div className="flex gap-2">
                <Link
                  href="/inventory"
                  className="text-sm font-medium text-slate-400 hover:text-slate-200"
                >
                  재고 관리
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
              title="입고 전표"
              description="최신순으로 정렬됩니다."
            >
              {receipts.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-500">
                  등록된 입고 전표가 없습니다. 입고 등록 버튼으로 첫 전표를 등록해 보세요.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead className="border-b border-slate-700 text-xs uppercase tracking-wider text-slate-400">
                      <tr>
                        <th className="pb-3 pr-4">전표번호</th>
                        <th className="pb-3 pr-4">입고일</th>
                        <th className="pb-3 pr-4">공급처</th>
                        <th className="pb-3 pr-4 text-right">총 금액</th>
                        <th className="pb-3 pr-4">상태</th>
                        <th className="pb-3">상세</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {receipts.map((r) => (
                        <tr key={r.id} className="hover:bg-slate-800/30">
                          <td className="py-3 pr-4 font-medium text-slate-100">
                            {r.receipt_no}
                          </td>
                          <td className="py-3 pr-4 text-slate-300">
                            {new Date(r.receipt_date).toLocaleDateString("ko-KR")}
                          </td>
                          <td className="py-3 pr-4 text-slate-300">
                            {(r as { supplier?: { name: string } | null }).supplier?.name ?? "-"}
                          </td>
                          <td className="py-3 pr-4 text-right text-slate-200">
                            {formatCurrency(Number(r.total_amount))}
                          </td>
                          <td className="py-3 pr-4">
                            <span
                              className={
                                r.status === "confirmed"
                                  ? "rounded bg-emerald-500/20 px-2 py-0.5 text-xs text-emerald-300"
                                  : r.status === "cancelled"
                                    ? "rounded bg-slate-700 px-2 py-0.5 text-xs text-slate-500"
                                    : "rounded bg-slate-700 px-2 py-0.5 text-xs text-slate-400"
                              }
                            >
                              {r.status === "confirmed"
                                ? "확정"
                                : r.status === "cancelled"
                                  ? "취소됨"
                                  : r.status}
                            </span>
                          </td>
                          <td className="py-3">
                            <Link
                              href={`/inventory/receipts/${r.id}`}
                              className="font-medium text-emerald-400 hover:text-emerald-300"
                            >
                              보기
                            </Link>
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
