"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createReceiptPanelAction } from "@/app/inventory/receipts/new/actions";
import type { Item, Supplier } from "@/lib/inventory/types";

type LineState = {
  item_id: string;
  quantity: number;
  unit: string;
  unit_conversion: number;
  supply_amount: number;
  is_taxable: boolean;
  vat_amount: number;
};

function emptyLine(): LineState {
  return {
    item_id: "",
    quantity: 0,
    unit: "",
    unit_conversion: 1,
    supply_amount: 0,
    is_taxable: true,
    vat_amount: 0,
  };
}

type Props = {
  isOpen: boolean;
  onClose: () => void;
  items: Item[];
  suppliers: Supplier[];
};

type LineRowProps = {
  line: LineState;
  items: Item[];
  onChangeItem: (id: string) => void;
  onChange: (patch: Partial<LineState>) => void;
  onRemove: () => void;
  canRemove: boolean;
};

function LineRow({
  line,
  items,
  onChangeItem,
  onChange,
  onRemove,
  canRemove,
}: LineRowProps) {
  const lineTotal = line.supply_amount + line.vat_amount;

  return (
    <div className="rounded-lg border border-slate-700 bg-slate-950 p-3 space-y-2">
      {/* 품목 선택 + 삭제 */}
      <div className="flex items-center gap-2">
        <select
          value={line.item_id}
          onChange={(e) => onChangeItem(e.target.value)}
          className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm text-slate-100 outline-none focus:border-emerald-500"
        >
          <option value="">품목 선택</option>
          {items.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="text-xs text-slate-500 hover:text-red-400"
          >
            삭제
          </button>
        )}
      </div>

      {/* 수량 / 단위 / 과세여부 */}
      <div className="grid grid-cols-3 gap-2">
        <div>
          <span className="mb-0.5 block text-xs text-slate-500">수량</span>
          <input
            type="number"
            min={0}
            step="any"
            value={line.quantity || ""}
            onChange={(e) => onChange({ quantity: Number(e.target.value) })}
            className="w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-sm text-slate-100 outline-none focus:border-emerald-500"
            placeholder="0"
          />
        </div>
        <div>
          <span className="mb-0.5 block text-xs text-slate-500">단위</span>
          <input
            type="text"
            readOnly
            value={line.unit}
            className="w-full rounded border border-slate-700 bg-slate-800 px-2 py-1 text-sm text-slate-400 cursor-not-allowed"
            placeholder="자동"
          />
        </div>
        <div>
          <span className="mb-0.5 block text-xs text-slate-500">과세 여부</span>
          <div className="flex overflow-hidden rounded border border-slate-700 text-xs">
            <button
              type="button"
              onClick={() => onChange({ is_taxable: true })}
              className={`flex-1 py-1 font-medium transition-colors ${
                line.is_taxable
                  ? "bg-emerald-600 text-white"
                  : "bg-slate-900 text-slate-400 hover:bg-slate-800"
              }`}
            >
              과세
            </button>
            <button
              type="button"
              onClick={() => onChange({ is_taxable: false })}
              className={`flex-1 py-1 font-medium transition-colors ${
                !line.is_taxable
                  ? "bg-slate-600 text-white"
                  : "bg-slate-900 text-slate-400 hover:bg-slate-800"
              }`}
            >
              면세
            </button>
          </div>
        </div>
      </div>

      {/* 공급가액 / 부가세 / 합계 */}
      <div className="grid grid-cols-3 gap-2">
        <div>
          <span className="mb-0.5 block text-xs text-slate-500">공급가액</span>
          <input
            type="number"
            min={0}
            value={line.supply_amount || ""}
            onChange={(e) =>
              onChange({ supply_amount: Number(e.target.value) })
            }
            className="w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-sm text-slate-100 outline-none focus:border-emerald-500"
            placeholder="0"
          />
        </div>
        <div>
          <span className="mb-0.5 block text-xs text-slate-500">
            부가세
          </span>
          <input
            type="number"
            readOnly
            value={line.vat_amount}
            className="w-full rounded border border-slate-700 bg-slate-800 px-2 py-1 text-sm text-slate-400 cursor-not-allowed"
          />
        </div>
        <div>
          <span className="mb-0.5 block text-xs text-slate-500">합계</span>
          <input
            type="number"
            readOnly
            value={lineTotal}
            className="w-full rounded border border-slate-700 bg-slate-800 px-2 py-1 text-sm text-slate-400 cursor-not-allowed"
          />
        </div>
      </div>
    </div>
  );
}

export function ReceiptSlidePanel({ isOpen, onClose, items, suppliers }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [lines, setLines] = useState<LineState[]>([emptyLine()]);
  const [receiptDate, setReceiptDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [supplierId, setSupplierId] = useState("");
  const [memo, setMemo] = useState("");

  const totalSupply = lines.reduce((sum, l) => sum + l.supply_amount, 0);
  const totalVat = lines.reduce((sum, l) => sum + l.vat_amount, 0);
  const totalAmount = totalSupply + totalVat;

  function updateLine(idx: number, patch: Partial<LineState>) {
    setLines((prev) =>
      prev.map((line, i) => {
        if (i !== idx) return line;
        const updated = { ...line, ...patch };
        if ("supply_amount" in patch || "is_taxable" in patch) {
          updated.vat_amount = updated.is_taxable
            ? Math.round(updated.supply_amount * 0.1)
            : 0;
        }
        return updated;
      }),
    );
  }

  function setItemOnLine(idx: number, itemId: string) {
    const item = items.find((i) => i.id === itemId);
    updateLine(idx, {
      item_id: itemId,
      unit: item ? (item.purchase_unit ?? item.base_unit) : "",
      unit_conversion: item ? (item.unit_conversion ?? 1) : 1,
    });
  }

  function addLine() {
    setLines((prev) => [...prev, emptyLine()]);
  }

  function removeLine(idx: number) {
    setLines((prev) => prev.filter((_, i) => i !== idx));
  }

  function resetForm() {
    setLines([emptyLine()]);
    setSupplierId("");
    setMemo("");
    setReceiptDate(new Date().toISOString().split("T")[0]);
    setError(null);
  }

  function handleClose() {
    resetForm();
    onClose();
  }

  function handleSubmit() {
    setError(null);
    const formData = new FormData();
    formData.set("receipt_date", receiptDate);
    if (supplierId) formData.set("supplier_id", supplierId);
    if (memo) formData.set("memo", memo);
    formData.set(
      "items",
      JSON.stringify(
        lines.map((l) => ({
          item_id: l.item_id,
          quantity: l.quantity,
          unit: l.unit,
          supply_amount: l.supply_amount,
          vat_amount: l.vat_amount,
        })),
      ),
    );

    startTransition(async () => {
      const result = await createReceiptPanelAction(formData);
      if (result?.error) {
        setError(result.error);
        return;
      }
      resetForm();
      onClose();
      router.refresh();
    });
  }

  if (!isOpen) return null;

  return (
    <>
      {/* 배경 오버레이 */}
      <div
        className="fixed inset-0 z-40 bg-black/60"
        onClick={handleClose}
      />

      {/* 슬라이드 패널 */}
      <div className="fixed right-0 top-0 z-50 flex h-full w-full max-w-lg flex-col bg-slate-900 shadow-2xl">
        {/* 헤더 */}
        <div className="flex items-center justify-between border-b border-slate-700 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-50">입고 등록</h2>
          <button
            onClick={handleClose}
            className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
          >
            ✕
          </button>
        </div>

        {/* 바디 (스크롤 가능) */}
        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-4">
          {/* 입고일 */}
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-400">
              입고일
            </label>
            <input
              type="date"
              value={receiptDate}
              onChange={(e) => setReceiptDate(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-emerald-500"
            />
          </div>

          {/* 공급처 */}
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-400">
              공급처
            </label>
            <select
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-emerald-500"
            >
              <option value="">선택 안함</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* 메모 */}
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-400">
              메모
            </label>
            <input
              type="text"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-emerald-500"
              placeholder="선택"
            />
          </div>

          {/* 입고 품목 라인 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">
                입고 품목
              </span>
              <button
                type="button"
                onClick={addLine}
                className="text-xs text-emerald-400 hover:text-emerald-300"
              >
                + 라인 추가
              </button>
            </div>

            {lines.map((line, idx) => (
              <LineRow
                key={idx}
                line={line}
                items={items}
                onChangeItem={(id) => setItemOnLine(idx, id)}
                onChange={(patch) => updateLine(idx, patch)}
                onRemove={() => removeLine(idx)}
                canRemove={lines.length > 1}
              />
            ))}
          </div>

          {error && (
            <div className="rounded-lg bg-red-950/50 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}
        </div>

        {/* 푸터 */}
        <div className="border-t border-slate-700 px-6 py-4">
          <div className="mb-4 flex items-baseline justify-between text-sm">
            <span className="text-slate-400">전체 합계</span>
            <span className="font-semibold text-slate-100">
              {totalAmount.toLocaleString("ko-KR")}원
              <span className="ml-2 text-xs text-slate-500">
                (공급 {totalSupply.toLocaleString("ko-KR")} + 부가세{" "}
                {totalVat.toLocaleString("ko-KR")})
              </span>
            </span>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 rounded-xl border border-slate-700 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800"
            >
              취소
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isPending}
              className="flex-1 rounded-xl bg-emerald-500 py-2 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/30 hover:bg-emerald-400 disabled:opacity-50"
            >
              {isPending ? "등록 중…" : "입고 등록"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
