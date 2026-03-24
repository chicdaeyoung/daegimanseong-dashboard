"use client";

import { useState } from "react";
import { createItemAction } from "./actions";
import { SectionCard } from "@/components/ui/SectionCard";

const PURCHASE_UNITS = [
  { value: "kg", label: "kg" },
  { value: "g", label: "g" },
  { value: "L", label: "L" },
  { value: "ml", label: "ml" },
  { value: "개", label: "개" },
  { value: "봉지", label: "봉지" },
  { value: "박스", label: "박스" },
  { value: "통", label: "통" },
];

function getBaseUnit(purchaseUnit: string): string {
  if (["kg", "g", "봉지"].includes(purchaseUnit)) return "g";
  if (["L", "ml", "통"].includes(purchaseUnit)) return "ml";
  return "개"; // 개, 박스
}

function getAutoConversion(purchaseUnit: string): number | null {
  if (purchaseUnit === "kg" || purchaseUnit === "L") return 1000;
  if (purchaseUnit === "g" || purchaseUnit === "ml") return 1;
  return null; // 개, 봉지, 박스, 통: 직접 입력
}

const CONVERSION_HINTS: Record<string, string> = {
  봉지: "봉지 1개의 용량을 g로 입력 (예: 500g 봉지 → 500)",
  박스: "박스 1개의 수량을 입력 (예: 30개들이 → 30)",
  통: "통 1개의 용량을 ml로 입력 (예: 18L 통 → 18000)",
  개: "개 1개 = 1개 (변환 없음)",
};

export function ItemCreateForm() {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [purchaseUnit, setPurchaseUnit] = useState("kg");

  const autoConversion = getAutoConversion(purchaseUnit);
  const baseUnit = getBaseUnit(purchaseUnit);
  const needsManualConversion = autoConversion === null;

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
        description="필수: 품목명, 입고 단위. 나머지는 선택입니다."
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* 품목명 */}
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

          {/* 품목 코드 */}
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

          {/* 입고 단위 */}
          <label>
            <span className="mb-1 block text-xs font-medium text-slate-400">
              입고 단위 *
            </span>
            <select
              name="purchase_unit"
              required
              value={purchaseUnit}
              onChange={(e) => setPurchaseUnit(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-emerald-500"
            >
              {PURCHASE_UNITS.map((u) => (
                <option key={u.value} value={u.value}>
                  {u.label}
                </option>
              ))}
            </select>
          </label>

          {/* 변환계수 */}
          <div>
            <span className="mb-1 block text-xs font-medium text-slate-400">
              변환계수{" "}
              <span className="text-slate-500">
                (1{purchaseUnit} = ?{baseUnit})
              </span>
            </span>
            {needsManualConversion ? (
              <>
                <input
                  type="number"
                  name="unit_conversion"
                  required
                  min={1}
                  step={1}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-emerald-500"
                  placeholder="숫자 입력"
                />
                {CONVERSION_HINTS[purchaseUnit] && (
                  <p className="mt-1 text-xs text-slate-500">
                    {CONVERSION_HINTS[purchaseUnit]}
                  </p>
                )}
              </>
            ) : (
              <input
                type="number"
                name="unit_conversion"
                readOnly
                value={autoConversion ?? 1}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-400 outline-none cursor-not-allowed"
              />
            )}
          </div>

          {/* 기준 단위 (자동 계산, 읽기 전용) */}
          <label>
            <span className="mb-1 block text-xs font-medium text-slate-400">
              기준 단위{" "}
              <span className="text-slate-500">(자동 계산)</span>
            </span>
            <input
              type="text"
              readOnly
              value={baseUnit}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-400 outline-none cursor-not-allowed"
            />
          </label>

          {/* 규격 */}
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

          {/* 메모 */}
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
