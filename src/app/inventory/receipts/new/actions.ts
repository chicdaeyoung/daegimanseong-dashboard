"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createReceipt } from "@/lib/inventory/mutations";
import type { CreateReceiptInput, ReceiptLineInput } from "@/lib/inventory/types";

export async function createReceiptAction(formData: FormData) {
  const supplierIdRaw = formData.get("supplier_id");
  const supplier_id =
    supplierIdRaw && String(supplierIdRaw).trim()
      ? String(supplierIdRaw).trim()
      : null;

  const receipt_date = formData.get("receipt_date");
  if (!receipt_date || typeof receipt_date !== "string") {
    return { error: "입고일을 선택해 주세요." };
  }

  const memo = formData.get("memo");
  const memoStr = memo && typeof memo === "string" ? memo.trim() : undefined;

  let items: ReceiptLineInput[];
  try {
    const itemsJson = formData.get("items");
    if (!itemsJson || typeof itemsJson !== "string") {
      return { error: "품목이 없습니다. 최소 1개 라인을 입력해 주세요." };
    }
    items = JSON.parse(itemsJson) as ReceiptLineInput[];
  } catch {
    return { error: "품목 데이터 형식이 올바르지 않습니다." };
  }

  if (!items.length) {
    return { error: "최소 1개 품목을 입력해 주세요." };
  }

  const validItems = items.filter(
    (l) =>
      l.item_id &&
      Number(l.quantity) > 0 &&
      l.unit &&
      Number(l.supply_amount) >= 0 &&
      Number(l.vat_amount ?? 0) >= 0,
  );
  if (validItems.length === 0) {
    return {
      error: "유효한 품목(품목, 수량, 단위, 공급가액)을 입력해 주세요.",
    };
  }

  const input: CreateReceiptInput = {
    supplier_id,
    receipt_date,
    memo: memoStr,
    items: validItems.map((l) => ({
      item_id: l.item_id,
      quantity: Number(l.quantity),
      unit: l.unit,
      supply_amount: Number(l.supply_amount),
      vat_amount: Number(l.vat_amount ?? 0),
      expiry_date: l.expiry_date,
      lot_no: l.lot_no,
      memo: l.memo,
    })),
  };

  let receiptId: string;
  try {
    const result = await createReceipt(input);
    receiptId = result.receiptId;
  } catch (e) {
    const message = e instanceof Error ? e.message : "입고 등록에 실패했습니다.";
    return { error: message };
  }

  revalidatePath("/inventory");
  revalidatePath("/inventory/receipts");
  revalidatePath(`/inventory/receipts/${receiptId}`);
  redirect(`/inventory/receipts/${receiptId}`);
}
