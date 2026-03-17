"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { SalesEntryWithItems } from "@/lib/sales/types";
import { formatCurrency } from "@/lib/inventory/utils";
import { cancelSalesEntryAction } from "./actions";

type Props = { entries: SalesEntryWithItems[] };

export function SalesEntriesTable({ entries }: Props) {
  const router = useRouter();
  const [cancelEntryId, setCancelEntryId] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submitCancel(e: React.FormEvent) {
    e.preventDefault();
    if (!cancelEntryId) return;
    setError(null);
    setPending(true);
    const result = await cancelSalesEntryAction(cancelEntryId, password, reason);
    setPending(false);
    if (result?.error) {
      setError(result.error);
      return;
    }
    setCancelEntryId(null);
    setPassword("");
    setReason("");
    router.refresh();
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-slate-700 text-xs uppercase tracking-wider text-slate-400">
            <tr>
              <th className="pb-3 pr-4">매출일</th>
              <th className="pb-3 pr-4">메모</th>
              <th className="pb-3 pr-4 text-right">품목 수</th>
              <th className="pb-3 pr-4 text-right">예상 매출</th>
              <th className="pb-3 pr-4">상태</th>
              <th className="pb-3 w-24">작업</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {entries.map((e) => {
              const itemCount = e.items?.length ?? 0;
              const total = (e.items ?? []).reduce(
                (sum, i) =>
                  sum + (i.menu_item?.sale_price ?? 0) * (i.quantity ?? 0),
                0,
              );
              const isCancelled =
                (e as { status?: string }).status === "cancelled";

              return (
                <tr key={e.id} className="hover:bg-slate-800/30">
                  <td className="py-3 pr-4 font-medium text-slate-100">
                    {new Date(e.sales_date).toLocaleDateString("ko-KR")}
                  </td>
                  <td className="py-3 pr-4 text-slate-300">{e.memo ?? "-"}</td>
                  <td className="py-3 pr-4 text-right text-slate-300">
                    {itemCount}
                  </td>
                  <td className="py-3 pr-4 text-right text-slate-200">
                    {formatCurrency(total)}
                  </td>
                  <td className="py-3 pr-4">
                    <span
                      className={
                        isCancelled
                          ? "rounded bg-slate-700 px-2 py-0.5 text-xs text-slate-500"
                          : "rounded bg-emerald-500/20 px-2 py-0.5 text-xs text-emerald-300"
                      }
                    >
                      {isCancelled ? "취소됨" : "확정"}
                    </span>
                  </td>
                  <td className="py-3">
                    {!isCancelled && (
                      <button
                        type="button"
                        onClick={() => setCancelEntryId(e.id)}
                        className="rounded bg-amber-500/20 px-2 py-1 text-xs font-medium text-amber-300 hover:bg-amber-500/30"
                      >
                        판매 취소
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {cancelEntryId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-xl border border-slate-700 bg-slate-900 p-4 shadow-xl">
            <h3 className="text-sm font-semibold text-amber-300">
              판매 취소
            </h3>
            <p className="mt-1 text-xs text-slate-400">
              관리자 비밀번호와 취소 사유를 입력하세요. 재고가 복원됩니다.
            </p>
            <form onSubmit={submitCancel} className="mt-4 space-y-3">
              <label className="block">
                <span className="mb-1 block text-xs text-slate-400">
                  관리자 비밀번호
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-amber-500"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs text-slate-400">
                  취소 사유
                </span>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  required
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-amber-500"
                  placeholder="예: 매출 오입력"
                />
              </label>
              {error && (
                <p className="text-sm text-red-300">{error}</p>
              )}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setCancelEntryId(null);
                    setPassword("");
                    setReason("");
                    setError(null);
                  }}
                  className="rounded-lg border border-slate-600 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800"
                >
                  닫기
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className="rounded-lg bg-amber-500/20 px-4 py-2 text-sm font-medium text-amber-300 hover:bg-amber-500/30 disabled:opacity-50"
                >
                  {pending ? "처리 중…" : "판매 취소"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
