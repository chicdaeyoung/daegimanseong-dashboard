"use client";

import { useState } from "react";
import type { MenuItem } from "@/lib/recipes/types";
import type { SalesLineInput } from "@/lib/sales/types";
import { createSalesEntryAction } from "./actions";
import { SectionCard } from "@/components/ui/SectionCard";
import { formatCurrency } from "@/lib/inventory/utils";

type LineState = {
  menu_item_id: string;
  quantity: number;
};

function emptyLine(menus: MenuItem[]): LineState {
  const firstId = menus[0]?.id ?? "";
  return { menu_item_id: firstId, quantity: 1 };
}

function lineToInput(l: LineState): SalesLineInput {
  return { menu_item_id: l.menu_item_id, quantity: l.quantity };
}

type Props = { menuItems: MenuItem[] };

export function SalesEntryForm({ menuItems }: Props) {
  const [salesDate, setSalesDate] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [memo, setMemo] = useState("");
  const [lines, setLines] = useState<LineState[]>(() =>
    menuItems.length ? [emptyLine(menuItems)] : [],
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const addLine = () => {
    setLines((prev) => [...prev, emptyLine(menuItems)]);
  };

  const removeLine = (index: number) => {
    setLines((prev) => prev.filter((_, i) => i !== index));
  };

  const updateLine = (index: number, patch: Partial<LineState>) => {
    setLines((prev) =>
      prev.map((l, i) => (i === index ? { ...l, ...patch } : l)),
    );
  };

  const totalAmount = lines.reduce((sum, l) => {
    const menu = menuItems.find((m) => m.id === l.menu_item_id);
    return sum + (menu ? menu.sale_price * l.quantity : 0);
  }, 0);

  async function submit(formData: FormData) {
    setError(null);
    setPending(true);
    const result = await createSalesEntryAction(formData);
    setPending(false);
    if (result?.error) setError(result.error);
  }

  if (menuItems.length === 0) {
    return (
      <SectionCard
        title="메뉴 없음"
        description="매출을 등록하려면 먼저 레시피를 등록해 주세요."
      >
        <p className="text-sm text-slate-400">
          레시피 관리에서 메뉴와 레시피를 등록한 뒤 매출 입력을 이용할 수 있습니다.
        </p>
      </SectionCard>
    );
  }

  return (
    <form action={submit} className="space-y-4">
      <input type="hidden" name="sales_date" value={salesDate} />
      <input type="hidden" name="memo" value={memo} />
      <input
        type="hidden"
        name="items"
        value={JSON.stringify(lines.map(lineToInput))}
      />

      <SectionCard
        title="매출 기본 정보"
        description="매출일과 메모"
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label>
            <span className="mb-1 block text-xs font-medium text-slate-400">
              매출일 *
            </span>
            <input
              type="date"
              value={salesDate}
              onChange={(e) => setSalesDate(e.target.value)}
              required
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-emerald-500"
            />
          </label>
          <label>
            <span className="mb-1 block text-xs font-medium text-slate-400">
              메모
            </span>
            <input
              type="text"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-emerald-500"
              placeholder="선택"
            />
          </label>
        </div>
      </SectionCard>

      <SectionCard
        title="판매 메뉴"
        description="메뉴와 수량. 재고가 자동 차감됩니다. (레시피가 있는 메뉴만 선택 가능)"
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
                <th className="pb-2 pr-2">메뉴</th>
                <th className="w-24 pb-2 pr-2 text-right">수량</th>
                <th className="w-28 pb-2 pr-2 text-right">단가</th>
                <th className="w-28 pb-2 pr-2 text-right">금액</th>
                <th className="w-8 pb-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {lines.map((line, idx) => {
                const menu = menuItems.find((m) => m.id === line.menu_item_id);
                const lineAmount = menu ? menu.sale_price * line.quantity : 0;
                return (
                  <tr key={idx} className="align-top">
                    <td className="py-2 pr-2">
                      <select
                        value={line.menu_item_id}
                        onChange={(e) =>
                          updateLine(idx, { menu_item_id: e.target.value })
                        }
                        className="w-full min-w-[140px] rounded border border-slate-700 bg-slate-950 px-2 py-1.5 text-slate-100 outline-none focus:border-emerald-500"
                      >
                        {menuItems.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name} ({formatCurrency(m.sale_price)})
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-2 pr-2 text-right">
                      <input
                        type="number"
                        min={1}
                        value={line.quantity || ""}
                        onChange={(e) =>
                          updateLine(idx, {
                            quantity: Math.max(1, Number(e.target.value) || 0),
                          })
                        }
                        className="w-full rounded border border-slate-700 bg-slate-950 px-2 py-1.5 text-right text-slate-100 outline-none focus:border-emerald-500"
                      />
                    </td>
                    <td className="py-2 pr-2 text-right text-slate-300">
                      {menu ? formatCurrency(menu.sale_price) : "-"}
                    </td>
                    <td className="py-2 pr-2 text-right font-medium text-slate-100">
                      {formatCurrency(lineAmount)}
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
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="mt-3 flex justify-end border-t border-slate-800 pt-3 text-sm">
          <span className="font-semibold text-slate-50">
            예상 매출: {formatCurrency(totalAmount)}
          </span>
        </div>
      </SectionCard>

      {error && (
        <div className="rounded-lg bg-red-950/50 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      <div className="flex justify-end gap-3">
        <a
          href="/sales-input"
          className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800"
        >
          취소
        </a>
        <button
          type="submit"
          disabled={pending || lines.length === 0}
          className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/30 hover:bg-emerald-400 disabled:opacity-50"
        >
          {pending ? "등록 중…" : "매출 등록"}
        </button>
      </div>
    </form>
  );
}
