"use client";

import { useState } from "react";
import type { Supplier } from "@/lib/inventory/types";
import { supplierDeactivateAction } from "./actions";

type Props = { suppliers: Supplier[] };

export function SuppliersTable({ suppliers }: Props) {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleDeactivate(supplierId: string) {
    setError(null);
    setPendingId(supplierId);
    const result = await supplierDeactivateAction(supplierId);
    setPendingId(null);
    if (result?.error) setError(result.error);
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-slate-700 text-xs uppercase tracking-wider text-slate-400">
            <tr>
              <th className="pb-3 pr-4">이름</th>
              <th className="pb-3 pr-4">담당자</th>
              <th className="pb-3 pr-4">연락처</th>
              <th className="pb-3 pr-4">사업자번호</th>
              <th className="pb-3 pr-4">사용</th>
              <th className="pb-3 w-24">작업</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {suppliers.map((s) => (
              <tr key={s.id} className="hover:bg-slate-800/30">
                <td className="py-3 pr-4 font-medium text-slate-100">
                  {s.name}
                </td>
                <td className="py-3 pr-4 text-slate-300">
                  {s.contact_name ?? "-"}
                </td>
                <td className="py-3 pr-4 text-slate-300">{s.phone ?? "-"}</td>
                <td className="py-3 pr-4 text-slate-300">
                  {s.business_number ?? "-"}
                </td>
                <td className="py-3 pr-4">
                  <span
                    className={
                      s.is_active
                        ? "rounded bg-emerald-500/20 px-2 py-0.5 text-xs text-emerald-300"
                        : "rounded bg-slate-700 px-2 py-0.5 text-xs text-slate-500"
                    }
                  >
                    {s.is_active ? "사용" : "미사용"}
                  </span>
                </td>
                <td className="py-3">
                  {s.is_active && (
                    <form action={() => handleDeactivate(s.id)}>
                      <button
                        type="submit"
                        disabled={pendingId === s.id}
                        className="rounded bg-amber-500/20 px-2 py-1 text-xs font-medium text-amber-300 hover:bg-amber-500/30 disabled:opacity-50"
                      >
                        {pendingId === s.id ? "처리 중…" : "비활성화"}
                      </button>
                    </form>
                  )}
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
