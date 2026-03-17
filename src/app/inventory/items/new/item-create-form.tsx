"use client";

import { useState } from "react";
import { createItemAction } from "./actions";
import { SectionCard } from "@/components/ui/SectionCard";

const BASE_UNITS = [
  { value: "ea", label: "ea" },
  { value: "kg", label: "kg" },
  { value: "g", label: "g" },
  { value: "ml", label: "ml" },
  { value: "l", label: "l" },
  { value: "pack", label: "pack" },
  { value: "box", label: "box" },
];

export function ItemCreateForm() {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(formData: FormData) {
    setError(null);
    setPending(true);
    const result = await createItemAction(formData);
    setPending(false);
    if (result?.error) setError(result.error);
  }

  return (
    <form action={submit} className="space-y-4">
      <SectionCard
        title="품목 정보"
        description="필수: 품목명, 기본 단위. 나머지는 선택입니다."
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label>
            <span className="mb-1 block text-xs font-medium text-slate-400">
              품목명 *
            </span>
            <input
              type="text"
              name="name"
              required
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-emerald-500"
              placeholder="예: 중화면"
            />
          </label>
          <label>
            <span className="mb-1 block text-xs font-medium text-slate-400">
              품목 코드
            </span>
            <input
              type="text"
              name="code"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-emerald-500"
              placeholder="선택"
            />
          </label>
          <label>
            <span className="mb-1 block text-xs font-medium text-slate-400">
              기본 단위 *
            </span>
            <select
              name="base_unit"
              required
              defaultValue="ea"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-emerald-500"
            >
              {BASE_UNITS.map((u) => (
                <option key={u.value} value={u.value}>
                  {u.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="mb-1 block text-xs font-medium text-slate-400">
              규격
            </span>
            <input
              type="text"
              name="spec"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-emerald-500"
              placeholder="예: 1kg/봉"
            />
          </label>
          <label className="sm:col-span-2">
            <span className="mb-1 block text-xs font-medium text-slate-400">
              메모
            </span>
            <textarea
              name="memo"
              rows={2}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-emerald-500"
            />
          </label>
        </div>
      </SectionCard>

      {error && (
        <div className="rounded-lg bg-red-950/50 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      <div className="flex justify-end gap-3">
        <a
          href="/inventory/items"
          className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800"
        >
          취소
        </a>
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/30 hover:bg-emerald-400 disabled:opacity-50"
        >
          {pending ? "등록 중…" : "등록"}
        </button>
      </div>
    </form>
  );
}
