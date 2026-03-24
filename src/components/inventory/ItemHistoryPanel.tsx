"use client";

import { useState, useEffect } from "react";
import { fetchItemReceiptHistory } from "@/app/inventory/item-history-actions";

type Props = {
  itemId: string | null;
  itemName: string;
  purchaseUnit: string;
  unitConversion: number;
  onClose: () => void;
};

export function ItemHistoryPanel({
  itemId,
  itemName,
  purchaseUnit,
  unitConversion,
  onClose,
}: Props) {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!itemId) return;
    setLoading(true);
    setHistory([]);
    fetchItemReceiptHistory(itemId).then((data) => {
      setHistory(data);
      setLoading(false);
    });
  }, [itemId]);

  if (!itemId) return null;

  return (
    <>
      {/* 오버레이 */}
      <div className="fixed inset-0 z-40 bg-black/50" onClick={onClose} />

      {/* 슬라이드 패널 */}
      <div className="fixed right-0 top-0 z-50 flex h-full w-full max-w-lg flex-col bg-slate-900 shadow-2xl">
        {/* 헤더 */}
        <div className="flex items-center justify-between border-b border-slate-700 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-50">{itemName}</h2>
            <p className="mt-0.5 text-xs text-slate-400">입고 히스토리</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
          >
            ✕
          </button>
        </div>

        {/* 내용 */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <p className="py-8 text-center text-sm text-slate-500">
              로딩 중...
            </p>
          ) : history.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">
              입고 내역이 없습니다.
            </p>
          ) : (
            <div className="space-y-3">
              {history.map((row: any) => {
                const receipt = row.receipt;
                const isCancelled = receipt?.status === "cancelled";
                const displayQty =
                  unitConversion > 1
                    ? (row.quantity / unitConversion).toFixed(3)
                    : row.quantity;

                return (
                  <div
                    key={row.id}
                    className={`rounded-xl border px-4 py-3 ${
                      isCancelled
                        ? "border-slate-700 bg-slate-800/30 opacity-50"
                        : "border-slate-700 bg-slate-800/60"
                    }`}
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-100">
                          {receipt?.receipt_date ?? "-"}
                        </span>
                        {isCancelled && (
                          <span className="rounded-full bg-red-900/50 px-2 py-0.5 text-xs text-red-300">
                            취소
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-slate-400">
                        {receipt?.receipt_no ?? "-"}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-400">
                      <div>
                        <span className="text-slate-500">공급처</span>
                        <span className="ml-2 text-slate-300">
                          {receipt?.supplier?.name ?? "-"}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500">수량</span>
                        <span className="ml-2 font-mono text-slate-300">
                          {displayQty} {purchaseUnit}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500">단가</span>
                        <span className="ml-2 font-mono text-slate-300">
                          {Number(row.unit_price).toLocaleString("ko-KR")}원/
                          {purchaseUnit}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500">합계</span>
                        <span className="ml-2 font-mono text-slate-300">
                          {Number(row.total_amount).toLocaleString("ko-KR")}원
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
