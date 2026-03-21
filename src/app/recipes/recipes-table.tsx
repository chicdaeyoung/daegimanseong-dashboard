"use client";

import Link from "next/link";
import { useState } from "react";
import type { MenuItem } from "@/lib/recipes/types";
import { formatCurrency } from "@/lib/inventory/utils";
import { menuDeactivateAction } from "./actions";

type MenuWithCount = MenuItem & { recipe_count: number };

type Props = { menus: MenuWithCount[] };

export function RecipesTable({ menus }: Props) {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleDeactivate(menuItemId: string) {
    setError(null);
    setPendingId(menuItemId);
    const result = await menuDeactivateAction(menuItemId);
    setPendingId(null);
    if (result?.error) setError(result.error);
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-slate-700 text-xs uppercase tracking-wider text-slate-400">
            <tr>
              <th className="pb-3 pr-4">메뉴명</th>
              <th className="pb-3 pr-4">코드</th>
              <th className="pb-3 pr-4">카테고리</th>
              <th className="pb-3 pr-4 text-right">판매가</th>
              <th className="pb-3 pr-4 text-right">레시피 수</th>
              <th className="pb-3 pr-4">사용</th>
              <th className="pb-3 w-32">작업</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {menus.map((m) => (
              <tr key={m.id} className="hover:bg-slate-800/30">
                <td className="py-3 pr-4 font-medium text-slate-100">
                  {m.name}
                  {(m as any).menu_type === 'set' && (
                    <span className="ml-1 text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">세트</span>
                  )}
                </td>
                <td className="py-3 pr-4 text-slate-300">{m.code ?? "-"}</td>
                <td className="py-3 pr-4 text-slate-300">
                  {m.category ?? "-"}
                </td>
                <td className="py-3 pr-4 text-right text-slate-200">
                  {formatCurrency(m.sale_price)}
                </td>
                <td className="py-3 pr-4 text-right text-slate-300">
                  {m.recipe_count}
                </td>
                <td className="py-3 pr-4">
                  <span
                    className={
                      m.is_active
                        ? "rounded bg-emerald-500/20 px-2 py-0.5 text-xs text-emerald-300"
                        : "rounded bg-slate-700 px-2 py-0.5 text-xs text-slate-500"
                    }
                  >
                    {m.is_active ? "사용" : "미사용"}
                  </span>
                </td>
                <td className="py-3">
                  <div className="flex gap-2">
                    <Link
                      href={`/recipes/${m.id}`}
                      className="rounded bg-slate-700 px-2 py-1 text-xs font-medium text-slate-200 hover:bg-slate-600"
                    >
                      레시피
                    </Link>
                    {m.is_active && (
                      <form action={() => handleDeactivate(m.id)}>
                        <button
                          type="submit"
                          disabled={pendingId === m.id}
                          className="rounded bg-amber-500/20 px-2 py-1 text-xs font-medium text-amber-300 hover:bg-amber-500/30 disabled:opacity-50"
                        >
                          {pendingId === m.id ? "처리 중…" : "비활성화"}
                        </button>
                      </form>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {error && <p className="mt-2 text-sm text-red-300">{error}</p>}
    </>
  );
}
