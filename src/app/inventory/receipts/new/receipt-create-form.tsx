"use client";

import { useState } from "react";
import type { Item, ReceiptLineInput, Supplier } from "@/lib/inventory/types";
import { formatCurrency } from "@/lib/inventory/utils";
import { createReceiptAction } from "./actions";
import { SectionCard } from "@/components/ui/SectionCard";

const DEFAULT_UNIT = "ea";

type LineState = {
  item_id: string;
  quantity: number;
  unit: string;
  supply_amount: number;
  vat_amount: number;
  expiry_date: string;
  lot_no: string;
  memo: string;
};

function emptyLine(items: Item[]): LineState {
  const firstId = items[0]?.id ?? "";
  return {
    item_id: firstId,
    quantity: 1,
    unit: DEFAULT_UNIT,
    supply_amount: 0,
    vat_amount: 0,
    expiry_date: "",
    lot_no: "",
    memo: "",
  };
}

function lineToInput(l: LineState): ReceiptLineInput {
  return {
    item_id: l.item_id,
    quantity: l.quantity,
    unit: l.unit,
    supply_amount: l.supply_amount,
    vat_amount: l.vat_amount,
    expiry_date: l.expiry_date || undefined,
    lot_no: l.lot_no || undefined,
    memo: l.memo || undefined,
  };
}

function computedUnitPrice(supply: number, qty: number): number {
  return qty > 0 ? supply / qty : 0;
}

function computedTotalAmount(supply: number, vat: number): number {
  return supply + vat;
}

type Props = { suppliers: Supplier[]; items: Item[] };

export function ReceiptCreateForm({ suppliers, items }: Props) {
  const [supplierId, setSupplierId] = useState<string>("");
  const [receiptDate, setReceiptDate] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );
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

  const receiptTotal = lines.reduce(
    (sum, l) => sum + computedTotalAmount(l.supply_amount, l.vat_amount),
    0,
  );
  const receiptVat = lines.reduce((sum, l) => sum + l.vat_amount, 0);

  async function submit(formData: FormData) {
    setError(null);
    setPending(true);
    const result = await createReceiptAction(formData);
    setPending(false);
    if (result?.error) {
      setError(result.error);
      return;
    }
  }

  if (items.length === 0) {
    return (
      <SectionCard
        title="품목 없음"
        description="입고하려면 먼저 품목을 등록해 주세요."
      >
        <p className="text-sm text-slate-400">
          재고 관리 → 품목(Items)을 추가한 뒤 입고 등록을 이용할 수 있습니다.
        </p>
      </SectionCard>
    );
  }

  return (
    <form action={submit} className="space-y-4">
      <input type="hidden" name="supplier_id" value={supplierId} />
      <input type="hidden" name="receipt_date" value={receiptDate} />
      <input type="hidden" name="memo" value={memo} />
      <input
        type="hidden"
        name="items"
        value={JSON.stringify(lines.map(lineToInput))}
      />

      <SectionCard title="입고 기본 정보" description="공급처와 입고일을 선택하세요.">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <label>
            <span className="mb-1 block text-xs font-medium text-slate-400">
              공급처
            </span>
            <select
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-emerald-500"
            >
              <option value="">선택 안 함</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="mb-1 block text-xs font-medium text-slate-400">
              입고일
            </span>
            <input
              type="date"
              value={receiptDate}
              onChange={(e) => setReceiptDate(e.target.value)}
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
              placeholder="선택"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-emerald-500"
            />
          </label>
        </div>
      </SectionCard>

      <SectionCard
        title="입고 품목"
        description="품목, 수량, 공급가액(총 매입액)을 입력하세요. 단가는 자동 계산됩니다."
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
                <th className="w-20 pb-2 pr-2 text-right">수량</th>
                <th className="w-16 pb-2 pr-2">단위</th>
                <th className="w-24 pb-2 pr-2 text-right">공급가액</th>
                <th className="w-20 pb-2 pr-2 text-right">부가세</th>
                <th className="w-20 pb-2 pr-2 text-right">단가(자동)</th>
                <th className="w-24 pb-2 pr-2 text-right">합계</th>
                <th className="w-24 pb-2 pr-2">유통기한</th>
                <th className="w-20 pb-2 pr-2">로트</th>
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
                          quantity: Math.max(0, Number(e.target.value) || 0),
                        })
                      }
                      className="w-full rounded border border-slate-700 bg-slate-950 px-2 py-1.5 text-right text-slate-100 outline-none focus:border-emerald-500"
                    />
                  </td>
                  <td className="py-2 pr-2">
                    <input
                      type="text"
                      value={line.unit}
                      onChange={(e) => updateLine(idx, { unit: e.target.value })}
                      className="w-full rounded border border-slate-700 bg-slate-950 px-2 py-1.5 text-slate-100 outline-none focus:border-emerald-500"
                    />
                  </td>
                  <td className="py-2 pr-2 text-right">
                    <input
                      type="number"
                      min={0}
                      step="any"
                      value={line.supply_amount || ""}
                      onChange={(e) =>
                        updateLine(idx, {
                          supply_amount: Math.max(
                            0,
                            Number(e.target.value) || 0,
                          ),
                        })
                      }
                      className="w-full rounded border border-slate-700 bg-slate-950 px-2 py-1.5 text-right text-slate-100 outline-none focus:border-emerald-500"
                    />
                  </td>
                  <td className="py-2 pr-2 text-right">
                    <input
                      type="number"
                      min={0}
                      step="any"
                      value={line.vat_amount || ""}
                      onChange={(e) =>
                        updateLine(idx, {
                          vat_amount: Math.max(
                            0,
                            Number(e.target.value) || 0,
                          ),
                        })
                      }
                      className="w-full rounded border border-slate-700 bg-slate-950 px-2 py-1.5 text-right text-slate-100 outline-none focus:border-emerald-500"
                    />
                  </td>
                  <td className="py-2 pr-2 text-right text-slate-400">
                    {formatCurrency(
                      computedUnitPrice(line.supply_amount, line.quantity),
                    )}
                  </td>
                  <td className="py-2 pr-2 text-right font-medium text-slate-100">
                    {formatCurrency(
                      computedTotalAmount(line.supply_amount, line.vat_amount),
                    )}
                  </td>
                  <td className="py-2 pr-2">
                    <input
                      type="date"
                      value={line.expiry_date}
                      onChange={(e) =>
                        updateLine(idx, { expiry_date: e.target.value })
                      }
                      className="w-full rounded border border-slate-700 bg-slate-950 px-2 py-1.5 text-slate-100 outline-none focus:border-emerald-500"
                    />
                  </td>
                  <td className="py-2 pr-2">
                    <input
                      type="text"
                      value={line.lot_no}
                      onChange={(e) =>
                        updateLine(idx, { lot_no: e.target.value })
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
        <div className="mt-3 flex justify-end gap-4 border-t border-slate-800 pt-3 text-sm">
          <span className="text-slate-400">부가세 합계: {formatCurrency(receiptVat)}</span>
          <span className="font-semibold text-slate-50">
            입고 합계: {formatCurrency(receiptTotal)}
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
          href="/inventory/receipts"
          className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800"
        >
          취소
        </a>
        <button
          type="submit"
          disabled={pending || lines.length === 0}
          className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/30 hover:bg-emerald-400 disabled:opacity-50 disabled:shadow-none"
        >
          {pending ? "등록 중…" : "입고 등록"}
        </button>
      </div>
    </form>
  );
}
