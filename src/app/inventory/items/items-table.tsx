"use client";

import { useState } from "react";
import type { Item } from "@/lib/inventory/types";
import { itemDeactivateAction, itemDeleteAction } from "./actions";

type Props = { items: Item[] };

export function ItemsTable({ items }: Props) {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleDeactivate(itemId: string) {
    setError(null);
    setPendingId(itemId);
    const result = await itemDeactivateAction(itemId);
    setPendingId(null);
    if (result?.error) setError(result.error);
  }

  async function handleDelete(itemId: string, itemName: string) {
    if (!confirm(`"${itemName}"을(를) 완전히 삭제할까요? 이 작업은 되돌릴 수 없습니다.`)) return;
    setError(null);
    setPendingId(itemId);
    const result = await itemDeleteAction(itemId);
    setPendingId(null);
    if (result?.error) setError(result.error);
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-slate-700 text-xs uppercase tracking-wider text-slate-400">
            <tr>
              <th className="pb-3 pr-4">품목명</th>
              <th className="pb-3 pr-4">품목 코드</th>
              <th className="pb-3 pr-4">기본 단위</th>
              <th className="pb-3 pr-4">규격</th>
              <th className="pb-3 pr-4">사용</th>
              <th className="pb-3 w-32">작업</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {items.map((item) => (
              <tr key={item.id} className="hover:bg-slate-800/30">
                <td className="py-3 pr-4 font-medium text-slate-100">
                  {item.name}
                </td>
                <td className="py-3 pr-4 text-slate-300">{item.code ?? "-"}</td>
                <td className="py-3 pr-4 text-slate-300">{item.base_unit}</td>
                <td className="py-3 pr-4 text-slate-300">{item.spec ?? "-"}</td>
                <td className="py-3 pr-4">
                  <span
                    className={
                      item.is_active
                        ? "rounded bg-emerald-500/20 px-2 py-0.5 text-xs text-emerald-300"
                        : "rounded bg-slate-700 px-2 py-0.5 text-xs text-slate-500"
                    }
                  >
                    {item.is_active ? "사용" : "미사용"}
                  </span>
                </td>
                <td className="py-3 flex gap-1">
                  {item.is_active && (
                    <button
                      onClick={() => handleDeactivate(item.id)}
                      disabled={pendingId === item.id}
                      className="rounded bg-amber-500/20 px-2 py-1 text-xs font-medium text-amber-300 hover:bg-amber-500/30 disabled:opacity-50"
                    >
                      {pendingId === item.id ? "처리 중…" : "비활성화"}
                    </button>
                  )}
                  {!item.is_active && (
                    <button
                      onClick={() => handleDelete(item.id, item.name)}
                      disabled={pendingId === item.id}
                      className="rounded bg-red-500/20 px-2 py-1 text-xs font-medium text-red-300 hover:bg-red-500/30 disabled:opacity-50"
                    >
                      {pendingId === item.id ? "처리 중…" : "삭제"}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {error && (
        <p className="mt-2 text-sm text-red-300">{error}</p>
      )}
    </>
  );
}
