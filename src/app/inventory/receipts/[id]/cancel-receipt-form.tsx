"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cancelReceiptAction } from "./actions";

type Props = { receiptId: string };

export function CancelReceiptForm({ receiptId }: Props) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const result = await cancelReceiptAction(receiptId, reason);
    setPending(false);
    if (result?.error) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="rounded-lg border border-slate-700 bg-slate-900/60 p-4">
      <h3 className="text-sm font-semibold text-amber-300">입고 취소</h3>
      <p className="mt-1 text-xs text-slate-400">
        취소 사유를 입력하세요. 재고가 역반영됩니다.
      </p>
      <div className="mt-3">
        <label className="block">
          <span className="mb-1 block text-xs text-slate-400">취소 사유</span>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-amber-500"
            placeholder="예: 입고 오입력"
          />
        </label>
      </div>
      {error && <p className="mt-2 text-sm text-red-300">{error}</p>}
      <div className="mt-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-amber-500/20 px-4 py-2 text-sm font-medium text-amber-300 hover:bg-amber-500/30 disabled:opacity-50"
        >
          {pending ? "처리 중…" : "입고 취소"}
        </button>
      </div>
    </form>
  );
}
