"use server";

import { revalidatePath } from "next/cache";
import { cancelSalesEntry } from "@/lib/sales/mutations";

function verifyAdminPassword(password: string): boolean {
  const expected = process.env.ADMIN_OVERRIDE_PASSWORD;
  if (!expected) return false;
  return password.trim() === expected;
}

export async function cancelSalesEntryAction(
  salesEntryId: string,
  password: string,
  reason: string,
) {
  if (!salesEntryId) return { error: "전표가 없습니다." };
  if (!reason?.trim()) return { error: "취소 사유를 입력해 주세요." };
  if (!verifyAdminPassword(password)) {
    return { error: "관리자 비밀번호가 일치하지 않습니다." };
  }

  try {
    await cancelSalesEntry(salesEntryId, reason.trim());
    revalidatePath("/sales-input");
    revalidatePath("/inventory");
    return { ok: true };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "판매 취소에 실패했습니다.",
    };
  }
}
