"use client";

import { useState } from "react";
import type { MenuRecipeWithItem } from "@/lib/recipes/types";
import {
  deleteRecipeLineAction,
  addRecipeLineAction,
  updateRecipeLineAction,
} from "../actions";

const RECIPE_UNITS = ["g", "kg", "ml", "L", "개"] as const;
type RecipeUnit = (typeof RECIPE_UNITS)[number];

function unitToConversion(unit: string): number {
  if (unit === "kg" || unit === "L") return 1000;
  return 1;
}

type AvailableItem = {
  id: string;
  name: string;
  base_unit: string;
  purchase_unit: string;
  unit_conversion: number;
};

type LineState = {
  item_id: string;
  quantity: number;
  unit: string;
  unit_conversion: number;
};

function defaultUnit(item: AvailableItem): string {
  if ((RECIPE_UNITS as readonly string[]).includes(item.purchase_unit)) {
    return item.purchase_unit;
  }
  return item.base_unit;
}

function emptyAddState(): LineState {
  return { item_id: "", quantity: 0, unit: "g", unit_conversion: 1 };
}

type Props = {
  recipes: MenuRecipeWithItem[];
  menuItemId: string;
  availableItems: AvailableItem[];
};

export function RecipeLinesTable({
  recipes: initialRecipes,
  menuItemId,
  availableItems,
}: Props) {
  const [recipes, setRecipes] = useState(initialRecipes);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editState, setEditState] = useState<Omit<LineState, "item_id">>({
    quantity: 0,
    unit: "g",
    unit_conversion: 1,
  });
  const [showAddForm, setShowAddForm] = useState(false);
  const [addState, setAddState] = useState<LineState>(emptyAddState());
  const [pendingSave, setPendingSave] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── 삭제 ────────────────────────────────────────────────────────────────
  async function handleDelete(recipeLineId: string) {
    setError(null);
    setPendingDeleteId(recipeLineId);
    const result = await deleteRecipeLineAction(recipeLineId);
    setPendingDeleteId(null);
    if (result?.error) {
      setError(result.error);
      return;
    }
    setRecipes((prev) => prev.filter((r) => r.id !== recipeLineId));
  }

  // ── 수정 시작 ────────────────────────────────────────────────────────────
  function startEdit(r: MenuRecipeWithItem) {
    setShowAddForm(false);
    setEditingId(r.id);
    setEditState({
      quantity: Number(r.quantity),
      unit: r.unit,
      unit_conversion: r.unit_conversion ?? unitToConversion(r.unit),
    });
    setError(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setError(null);
  }

  async function handleUpdate(recipeLineId: string) {
    setError(null);
    if (editState.quantity <= 0) {
      setError("사용량은 0보다 커야 합니다.");
      return;
    }
    setPendingSave(true);
    const result = await updateRecipeLineAction(recipeLineId, editState);
    setPendingSave(false);
    if (result?.error) {
      setError(result.error);
      return;
    }
    setRecipes((prev) =>
      prev.map((r) =>
        r.id === recipeLineId
          ? { ...r, ...editState }
          : r,
      ),
    );
    setEditingId(null);
  }

  // ── 추가 ─────────────────────────────────────────────────────────────────
  function openAddForm() {
    setEditingId(null);
    setAddState(emptyAddState());
    setShowAddForm(true);
    setError(null);
  }

  function cancelAdd() {
    setShowAddForm(false);
    setError(null);
  }

  function handleAddItemChange(itemId: string) {
    const item = availableItems.find((i) => i.id === itemId);
    const unit = item ? defaultUnit(item) : "g";
    setAddState({
      item_id: itemId,
      quantity: 0,
      unit,
      unit_conversion: unitToConversion(unit),
    });
  }

  function handleAddUnitChange(unit: string) {
    setAddState((prev) => ({
      ...prev,
      unit,
      unit_conversion: unitToConversion(unit),
    }));
  }

  async function handleAdd() {
    setError(null);
    if (!addState.item_id) {
      setError("품목을 선택해 주세요.");
      return;
    }
    if (addState.quantity <= 0) {
      setError("사용량은 0보다 커야 합니다.");
      return;
    }
    setPendingSave(true);
    const result = await addRecipeLineAction(menuItemId, addState);
    setPendingSave(false);
    if (result?.error) {
      setError(result.error);
      return;
    }
    if (result.data) {
      setRecipes((prev) => [...prev, result.data as MenuRecipeWithItem]);
    }
    setShowAddForm(false);
    setAddState(emptyAddState());
  }

  const inputCls =
    "rounded border border-slate-700 bg-slate-900 px-2 py-1 text-sm text-slate-100 outline-none focus:border-emerald-500";
  const readonlyCls =
    "rounded border border-slate-700 bg-slate-800 px-2 py-1 text-sm text-slate-400 cursor-not-allowed";

  return (
    <>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-slate-700 text-xs uppercase text-slate-400">
            <tr>
              <th className="pb-2 pr-4">품목</th>
              <th className="pb-2 pr-4 text-right">사용량</th>
              <th className="pb-2 pr-4">단위</th>
              <th className="pb-2 pr-4">변환계수</th>
              <th className="pb-2 w-28">작업</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {recipes.length === 0 && !showAddForm && (
              <tr>
                <td
                  colSpan={5}
                  className="py-6 text-center text-sm text-slate-500"
                >
                  등록된 재료가 없습니다. 아래 버튼으로 추가하세요.
                </td>
              </tr>
            )}

            {recipes.map((r) =>
              editingId === r.id ? (
                /* ── 수정 모드 행 ── */
                <tr key={r.id} className="bg-slate-800/40">
                  <td className="py-2 pr-4 font-medium text-slate-100">
                    {r.item?.name ?? r.item_id}
                  </td>
                  <td className="py-2 pr-4 text-right">
                    <input
                      type="number"
                      min={0}
                      step="any"
                      value={editState.quantity || ""}
                      onChange={(e) =>
                        setEditState((prev) => ({
                          ...prev,
                          quantity: Number(e.target.value),
                        }))
                      }
                      className={`${inputCls} w-24 text-right`}
                    />
                  </td>
                  <td className="py-2 pr-4">
                    <select
                      value={editState.unit}
                      onChange={(e) => {
                        const u = e.target.value;
                        setEditState((prev) => ({
                          ...prev,
                          unit: u,
                          unit_conversion: unitToConversion(u),
                        }));
                      }}
                      className={inputCls}
                    >
                      {RECIPE_UNITS.map((u) => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="py-2 pr-4">
                    <input
                      readOnly
                      value={editState.unit_conversion}
                      className={`${readonlyCls} w-16`}
                    />
                  </td>
                  <td className="py-2">
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => handleUpdate(r.id)}
                        disabled={pendingSave}
                        className="rounded bg-emerald-500/20 px-2 py-1 text-xs font-medium text-emerald-300 hover:bg-emerald-500/30 disabled:opacity-50"
                      >
                        {pendingSave ? "…" : "저장"}
                      </button>
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="rounded bg-slate-700 px-2 py-1 text-xs font-medium text-slate-300 hover:bg-slate-600"
                      >
                        취소
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                /* ── 일반 행 ── */
                <tr key={r.id} className="hover:bg-slate-800/30">
                  <td className="py-2 pr-4 font-medium text-slate-100">
                    {r.item?.name ?? r.item_id}
                  </td>
                  <td className="py-2 pr-4 text-right text-slate-300">
                    {Number(r.quantity).toLocaleString()}
                  </td>
                  <td className="py-2 pr-4 text-slate-300">{r.unit}</td>
                  <td className="py-2 pr-4 text-slate-500 text-xs">
                    ×{r.unit_conversion ?? 1}
                  </td>
                  <td className="py-2">
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => startEdit(r)}
                        className="rounded bg-slate-700 px-2 py-1 text-xs font-medium text-slate-300 hover:bg-slate-600"
                      >
                        수정
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(r.id)}
                        disabled={pendingDeleteId === r.id}
                        className="rounded bg-red-500/20 px-2 py-1 text-xs font-medium text-red-300 hover:bg-red-500/30 disabled:opacity-50"
                      >
                        {pendingDeleteId === r.id ? "…" : "삭제"}
                      </button>
                    </div>
                  </td>
                </tr>
              ),
            )}

            {/* ── 추가 폼 행 ── */}
            {showAddForm && (
              <tr className="bg-slate-800/40">
                <td className="py-2 pr-4">
                  <select
                    value={addState.item_id}
                    onChange={(e) => handleAddItemChange(e.target.value)}
                    className={`${inputCls} w-full min-w-32`}
                  >
                    <option value="">품목 선택</option>
                    {availableItems.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="py-2 pr-4 text-right">
                  <input
                    type="number"
                    min={0}
                    step="any"
                    value={addState.quantity || ""}
                    onChange={(e) =>
                      setAddState((prev) => ({
                        ...prev,
                        quantity: Number(e.target.value),
                      }))
                    }
                    className={`${inputCls} w-24 text-right`}
                    placeholder="0"
                  />
                </td>
                <td className="py-2 pr-4">
                  <select
                    value={addState.unit}
                    onChange={(e) => handleAddUnitChange(e.target.value)}
                    className={inputCls}
                  >
                    {RECIPE_UNITS.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="py-2 pr-4">
                  <input
                    readOnly
                    value={addState.unit_conversion}
                    className={`${readonlyCls} w-16`}
                  />
                </td>
                <td className="py-2">
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={handleAdd}
                      disabled={pendingSave}
                      className="rounded bg-emerald-500/20 px-2 py-1 text-xs font-medium text-emerald-300 hover:bg-emerald-500/30 disabled:opacity-50"
                    >
                      {pendingSave ? "…" : "저장"}
                    </button>
                    <button
                      type="button"
                      onClick={cancelAdd}
                      className="rounded bg-slate-700 px-2 py-1 text-xs font-medium text-slate-300 hover:bg-slate-600"
                    >
                      취소
                    </button>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 재료 추가 버튼 */}
      {!showAddForm && (
        <div className="mt-3">
          <button
            type="button"
            onClick={openAddForm}
            className="text-sm font-medium text-emerald-400 hover:text-emerald-300"
          >
            + 재료 추가
          </button>
        </div>
      )}

      {error && <p className="mt-2 text-sm text-red-300">{error}</p>}
    </>
  );
}
