"use server";

import { revalidatePath } from "next/cache";
import { cancelReceipt } from "@/lib/inventory/mutations";

function verifyAdminPassword(password: string): boolean {
  const expected = process.env.ADMIN_OVERRIDE_PASSWORD;
  if (!expected) return false;
  return password.trim() === expected;
}

export async function cancelReceiptAction(
  receiptId: string,
  password: string,
  reason: string,
) {
  if (!receiptId) return { error: "전표가 없습니다." };
  if (!reason?.trim()) return { error: "취소 사유를 입력해 주세요." };
  if (!verifyAdminPassword(password)) {
    return { error: "관리자 비밀번호가 일치하지 않습니다." };
  }

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
