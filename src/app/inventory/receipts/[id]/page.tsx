import Link from "next/link";
import { notFound } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { SectionCard } from "@/components/ui/SectionCard";
import { getReceiptDetail } from "@/lib/inventory/queries";
import { formatCurrency } from "@/lib/inventory/utils";
import { CancelReceiptForm } from "./cancel-receipt-form";

export default async function ReceiptDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const receipt = await getReceiptDetail(id);
  if (!receipt) notFound();

  const supplier = receipt.supplier;
  const items = receipt.items ?? [];
  const isCancelled = receipt.status === "cancelled";

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-50">
      <Sidebar />
      <div className="flex min-h-screen flex-1 flex-col">
        <Topbar />
        <main className="flex-1 px-4 py-4 pb-8 lg:px-8 lg:py-6">
          <div className="mx-auto max-w-4xl space-y-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h1 className="text-xl font-semibold tracking-tight text-slate-50 lg:text-2xl">
                  입고 전표: {receipt.receipt_no}
                </h1>
                <p className="mt-1 text-xs text-slate-400 lg:text-sm">
                  {new Date(receipt.receipt_date).toLocaleDateString("ko-KR")} ·{" "}
                  {receipt.status === "confirmed"
                    ? "확정"
                    : receipt.status === "cancelled"
                      ? "취소됨"
                      : receipt.status}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {!isCancelled && (
                  <Link
                    href={`/inventory/receipts/${id}/edit`}
                    className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200"
                  >
                    수정
                  </Link>
                )}
                <Link
                  href="/inventory/receipts"
                  className="text-sm font-medium text-emerald-400 hover:text-emerald-300"
                >
                  ← 입고 목록
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <SectionCard title="기본 정보" description="전표 및 입고일">
                <ul className="space-y-1.5 text-sm">
                  <li className="flex justify-between">
                    <span className="text-slate-400">전표번호</span>
                    <span className="font-medium text-slate-100">
                      {receipt.receipt_no}
                    </span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-slate-400">입고일</span>
                    <span className="text-slate-100">
                      {new Date(receipt.receipt_date).toLocaleDateString("ko-KR")}
                    </span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-slate-400">총 금액</span>
                    <span className="font-medium text-slate-100">
                      {formatCurrency(Number(receipt.total_amount))}
                    </span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-slate-400">부가세</span>
                    <span className="text-slate-100">
                      {formatCurrency(Number(receipt.vat_amount))}
                    </span>
                  </li>
                  {receipt.memo && (
                    <li className="flex justify-between">
                      <span className="text-slate-400">메모</span>
                      <span className="text-slate-300">{receipt.memo}</span>
                    </li>
                  )}
                  {"cancelled_at" in receipt && (receipt as { cancelled_at?: string | null }).cancelled_at && (
                    <>
                      <li className="flex justify-between">
                        <span className="text-slate-400">취소 일시</span>
                        <span className="text-slate-300">
                          {new Date((receipt as { cancelled_at: string }).cancelled_at).toLocaleString("ko-KR")}
                        </span>
                      </li>
                      {"cancel_reason" in receipt && (receipt as { cancel_reason?: string | null }).cancel_reason && (
                        <li className="flex justify-between">
                          <span className="text-slate-400">취소 사유</span>
                          <span className="text-slate-300">{(receipt as { cancel_reason: string }).cancel_reason}</span>
                        </li>
                      )}
                    </>
                  )}
                </ul>
              </SectionCard>

              {!isCancelled && (
                <SectionCard title="취소" description="입고 전표 취소 (재고 역반영)">
                  <CancelReceiptForm receiptId={id} />
                </SectionCard>
              )}

              <SectionCard title="공급처" description="선택된 공급처 정보">
                {supplier ? (
                  <ul className="space-y-1.5 text-sm">
                    <li className="font-medium text-slate-100">{supplier.name}</li>
                    {supplier.contact_name && (
                      <li className="text-slate-400">
                        담당: {supplier.contact_name}
                      </li>
                    )}
                    {supplier.phone && (
                      <li className="text-slate-400">연락처: {supplier.phone}</li>
                    )}
                    {supplier.business_number && (
                      <li className="text-slate-400">
                        사업자번호: {supplier.business_number}
                      </li>
                    )}
                  </ul>
                ) : (
                  <p className="text-sm text-slate-500">공급처 미선택</p>
                )}
              </SectionCard>
            </div>

            <SectionCard
              title="입고 품목"
              description="품목별 수량·단가·합계"
            >
              {items.length === 0 ? (
                <p className="py-4 text-center text-sm text-slate-500">
                  품목이 없습니다.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="border-b border-slate-700 text-xs uppercase text-slate-400">
                      <tr>
                        <th className="pb-2 pr-4 text-left">품목</th>
                        <th className="pb-2 pr-4 text-right">수량</th>
                        <th className="pb-2 pr-4 text-left">단위</th>
                        <th className="pb-2 pr-4 text-right">단가</th>
                        <th className="pb-2 pr-4 text-right">공급가액</th>
                        <th className="pb-2 pr-4 text-right">부가세</th>
                        <th className="pb-2 text-right">합계</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {items.map((row) => (
                        <tr key={row.id} className="hover:bg-slate-800/30">
                          <td className="py-2 pr-4 font-medium text-slate-100">
                            {(row as { item?: { name: string } }).item?.name ?? row.item_id}
                          </td>
                          <td className="py-2 pr-4 text-right text-slate-300">
                            {Number(row.quantity).toLocaleString()}
                          </td>
                          <td className="py-2 pr-4 text-slate-300">{row.unit}</td>
                          <td className="py-2 pr-4 text-right text-slate-300">
                            {formatCurrency(Number(row.unit_price))}
                          </td>
                          <td className="py-2 pr-4 text-right text-slate-300">
                            {formatCurrency(Number(row.supply_amount))}
                          </td>
                          <td className="py-2 pr-4 text-right text-slate-300">
                            {formatCurrency(Number(row.vat_amount))}
                          </td>
                          <td className="py-2 text-right font-medium text-slate-100">
                            {formatCurrency(Number(row.total_amount))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <div className="mt-3 flex justify-end border-t border-slate-800 pt-3 text-sm font-semibold text-slate-50">
                전표 합계: {formatCurrency(Number(receipt.total_amount))}
              </div>
            </SectionCard>
          </div>
        </main>
      </div>
    </div>
  );
}
