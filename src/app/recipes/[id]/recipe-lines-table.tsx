"use client";

import { useState } from "react";
import type { MenuRecipeWithItem } from "@/lib/recipes/types";
import { deleteRecipeLineAction } from "../actions";

type Props = { recipes: MenuRecipeWithItem[] };

export function RecipeLinesTable({ recipes: initialRecipes }: Props) {
  const [recipes, setRecipes] = useState(initialRecipes);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete(recipeLineId: string) {
    setError(null);
    setPendingId(recipeLineId);
    const result = await deleteRecipeLineAction(recipeLineId);
    setPendingId(null);
    if (result?.error) {
      setError(result.error);
      return;
    }
    setRecipes((prev) => prev.filter((r) => r.id !== recipeLineId));
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-slate-700 text-xs uppercase text-slate-400">
            <tr>
              <th className="pb-2 pr-4">품목</th>
              <th className="pb-2 pr-4 text-right">사용량</th>
              <th className="pb-2 pr-4">단위</th>
              <th className="pb-2 w-20">작업</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {recipes.map((r) => (
              <tr key={r.id} className="hover:bg-slate-800/30">
                <td className="py-2 pr-4 font-medium text-slate-100">
                  {r.item?.name ?? r.item_id}
                </td>
                <td className="py-2 pr-4 text-right text-slate-300">
                  {Number(r.quantity).toLocaleString()}
                </td>
                <td className="py-2 pr-4 text-slate-300">{r.unit}</td>
                <td className="py-2">
                  <form action={() => handleDelete(r.id)}>
                    <button
                      type="submit"
                      disabled={pendingId === r.id}
                      className="rounded bg-red-500/20 px-2 py-1 text-xs font-medium text-red-300 hover:bg-red-500/30 disabled:opacity-50"
                    >
                      {pendingId === r.id ? "처리 중…" : "삭제"}
                    </button>
                  </form>
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
