"use client";

import { useState } from "react";
import type { Item } from "@/lib/inventory/types";
import type { RecipeLineInput } from "@/lib/recipes/types";
import { createRecipeAction } from "./actions";
import { SectionCard } from "@/components/ui/SectionCard";

const DEFAULT_UNIT = "ea";

type LineState = {
  item_id: string;
  quantity: number;
  unit: string;
  memo: string;
};

function emptyLine(items: Item[]): LineState {
  const firstId = items[0]?.id ?? "";
  return {
    item_id: firstId,
    quantity: 1,
    unit: DEFAULT_UNIT,
    memo: "",
  };
}

function lineToInput(l: LineState): RecipeLineInput {
  return {
    item_id: l.item_id,
    quantity: l.quantity,
    unit: l.unit,
    memo: l.memo || undefined,
  };
}

type Props = { items: Item[] };

export function RecipeCreateForm({ items }: Props) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [category, setCategory] = useState("");
  const [salePrice, setSalePrice] = useState(0);
  const [memo, setMemo] = useState("");
  const [lines, setLines] = useState<LineState[]>(() =>
    items.length ? [emptyLine(items)] : [],
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const addLine = () => {
    setLines((prev) => [...prev, emptyLine(items)]);
  };

  const removeLine = (index: number) => {
    setLines((prev) => prev.filter((_, i) => i !== index));
  };

  const updateLine = (index: number, patch: Partial<LineState>) => {
    setLines((prev) =>
      prev.map((l, i) => (i === index ? { ...l, ...patch } : l)),
    );
  };

  async function submit(formData: FormData) {
    setError(null);
    setPending(true);
    const result = await createRecipeAction(formData);
    setPending(false);
    if (result?.error) setError(result.error);
  }

  if (items.length === 0) {
    return (
      <SectionCard
        title="품목 없음"
        description="레시피를 등록하려면 먼저 품목을 등록해 주세요."
      >
        <p className="text-sm text-slate-400">
          재고 관리 → 품목을 추가한 뒤 레시피를 등록할 수 있습니다.
        </p>
      </SectionCard>
    );
  }

  return (
    <form action={submit} className="space-y-4">
      <input type="hidden" name="name" value={name} />
      <input type="hidden" name="code" value={code} />
      <input type="hidden" name="category" value={category} />
      <input type="hidden" name="sale_price" value={String(salePrice)} />
      <input type="hidden" name="memo" value={memo} />
      <input
        type="hidden"
        name="lines"
        value={JSON.stringify(lines.map(lineToInput))}
      />

      <SectionCard
        title="메뉴 기본 정보"
        description="메뉴명, 코드, 카테고리, 판매가"
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label>
            <span className="mb-1 block text-xs font-medium text-slate-400">
              메뉴명 *
            </span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-emerald-500"
              placeholder="예: 짜장면"
            />
          </label>
          <label>
            <span className="mb-1 block text-xs font-medium text-slate-400">
              메뉴 코드
            </span>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-emerald-500"
              placeholder="선택"
            />
          </label>
          <label>
            <span className="mb-1 block text-xs font-medium text-slate-400">
              카테고리
            </span>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-emerald-500"
              placeholder="예: 면류"
            />
          </label>
          <label>
            <span className="mb-1 block text-xs font-medium text-slate-400">
              판매가 *
            </span>
            <input
              type="number"
              min={0}
              value={salePrice || ""}
              onChange={(e) => setSalePrice(Number(e.target.value) || 0)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-emerald-500"
            />
          </label>
          <label className="sm:col-span-2">
            <span className="mb-1 block text-xs font-medium text-slate-400">
              메모
            </span>
            <input
              type="text"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-emerald-500"
            />
          </label>
        </div>
      </SectionCard>

      <SectionCard
        title="레시피 품목"
        description="품목, 사용량, 단위"
        right={
          <button
            type="button"
            onClick={addLine}
            className="rounded-lg bg-slate-700 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-600"
          >
            + 라인 추가
          </button>
        }
      >
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700 text-left text-xs uppercase text-slate-400">
                <th className="pb-2 pr-2">품목</th>
                <th className="w-24 pb-2 pr-2 text-right">사용량</th>
                <th className="w-20 pb-2 pr-2">단위</th>
                <th className="w-32 pb-2 pr-2">메모</th>
                <th className="w-8 pb-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {lines.map((line, idx) => (
                <tr key={idx} className="align-top">
                  <td className="py-2 pr-2">
                    <select
                      value={line.item_id}
                      onChange={(e) => {
                        const item = items.find((i) => i.id === e.target.value);
                        updateLine(idx, {
                          item_id: e.target.value,
                          unit: item?.base_unit ?? DEFAULT_UNIT,
                        });
                      }}
                      className="w-full min-w-[120px] rounded border border-slate-700 bg-slate-950 px-2 py-1.5 text-slate-100 outline-none focus:border-emerald-500"
                    >
                      {items.map((i) => (
                        <option key={i.id} value={i.id}>
                          {i.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="py-2 pr-2 text-right">
                    <input
                      type="number"
                      min={0.001}
                      step="any"
                      value={line.quantity || ""}
                      onChange={(e) =>
                        updateLine(idx, {
                          quantity: Number(e.target.value) || 0,
                        })
                      }
                      className="w-full rounded border border-slate-700 bg-slate-950 px-2 py-1.5 text-right text-slate-100 outline-none focus:border-emerald-500"
                    />
                  </td>
                  <td className="py-2 pr-2">
                    <input
                      type="text"
                      value={line.unit}
                      onChange={(e) =>
                        updateLine(idx, { unit: e.target.value })
                      }
                      className="w-full rounded border border-slate-700 bg-slate-950 px-2 py-1.5 text-slate-100 outline-none focus:border-emerald-500"
                    />
                  </td>
                  <td className="py-2 pr-2">
                    <input
                      type="text"
                      value={line.memo}
                      onChange={(e) =>
                        updateLine(idx, { memo: e.target.value })
                      }
                      placeholder="선택"
                      className="w-full rounded border border-slate-700 bg-slate-950 px-2 py-1.5 text-slate-100 outline-none focus:border-emerald-500"
                    />
                  </td>
                  <td className="py-2">
                    <button
                      type="button"
                      onClick={() => removeLine(idx)}
                      className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-red-300"
                      aria-label="삭제"
                    >
                      ×
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {error && (
        <div className="rounded-lg bg-red-950/50 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      <div className="flex justify-end gap-3">
        <a
          href="/recipes"
          className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800"
        >
          취소
        </a>
        <button
          type="submit"
          disabled={pending || !name.trim() || lines.length === 0}
          className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/30 hover:bg-emerald-400 disabled:opacity-50"
        >
          {pending ? "등록 중…" : "레시피 등록"}
        </button>
      </div>
    </form>
  );
}
