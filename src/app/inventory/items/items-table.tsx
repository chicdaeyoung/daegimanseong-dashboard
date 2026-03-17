"use client";

import { useState } from "react";
import type { Item } from "@/lib/inventory/types";
import { itemDeactivateAction } from "./actions";

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
              <th className="pb-3 w-24">작업</th>
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
                <td className="py-3">
                  {item.is_active && (
                    <form action={() => handleDeactivate(item.id)}>
                      <button
                        type="submit"
                        disabled={pendingId === item.id}
                        className="rounded bg-amber-500/20 px-2 py-1 text-xs font-medium text-amber-300 hover:bg-amber-500/30 disabled:opacity-50"
                      >
                        {pendingId === item.id ? "처리 중…" : "비활성화"}
                      </button>
                    </form>
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
