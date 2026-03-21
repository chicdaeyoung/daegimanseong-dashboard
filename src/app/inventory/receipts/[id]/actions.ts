"use server";

import { revalidatePath } from "next/cache";
import { cancelReceipt } from "@/lib/inventory/mutations";

export async function cancelReceiptAction(receiptId: string, reason: string) {
  if (!receiptId) return { error: "전표가 없습니다." };
  if (!reason?.trim()) return { error: "취소 사유를 입력해 주세요." };

  try {
    await cancelReceipt(receiptId, reason.trim());
    revalidatePath("/inventory/receipts");
    revalidatePath("/inventory/receipts/[id]");
    revalidatePath("/inventory");
    return { ok: true };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "입고 취소에 실패했습니다.",
    };
  }
}
