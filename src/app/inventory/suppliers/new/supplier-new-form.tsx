"use client";

import { useState } from "react";
import { createSupplierAction } from "./actions";
import { SectionCard } from "@/components/ui/SectionCard";

export function SupplierNewForm() {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(formData: FormData) {
    setError(null);
    setPending(true);
    const result = await createSupplierAction(formData);
    setPending(false);
    if (result?.error) setError(result.error);
  }

  return (
    <form action={submit} className="space-y-4">
      <SectionCard title="기본 정보" description="필수: 이름. 나머지는 선택입니다.">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label>
            <span className="mb-1 block text-xs font-medium text-slate-400">
              공급처 이름 *
            </span>
            <input
              type="text"
              name="name"
              required
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-emerald-500"
              placeholder="예: 대기식자재"
            />
          </label>
          <label>
            <span className="mb-1 block text-xs font-medium text-slate-400">
              코드
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
              담당자
            </span>
            <input
              type="text"
              name="contact_name"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-emerald-500"
            />
          </label>
          <label>
            <span className="mb-1 block text-xs font-medium text-slate-400">
              연락처
            </span>
            <input
              type="text"
              name="phone"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-emerald-500"
            />
          </label>
          <label className="sm:col-span-2">
            <span className="mb-1 block text-xs font-medium text-slate-400">
              이메일
            </span>
            <input
              type="email"
              name="email"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-emerald-500"
            />
          </label>
          <label className="sm:col-span-2">
            <span className="mb-1 block text-xs font-medium text-slate-400">
              주소
            </span>
            <input
              type="text"
              name="address"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-emerald-500"
            />
          </label>
          <label>
            <span className="mb-1 block text-xs font-medium text-slate-400">
              사업자번호
            </span>
            <input
              type="text"
              name="business_number"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-emerald-500"
            />
          </label>
          <label className="flex items-center gap-2 pt-8">
            <input
              type="checkbox"
              name="is_active"
              value="true"
              defaultChecked
              className="rounded border-slate-600 bg-slate-950 text-emerald-500 focus:ring-emerald-500"
            />
            <span className="text-sm text-slate-300">사용</span>
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
          href="/inventory/suppliers"
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
