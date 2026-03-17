"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSalesEntry } from "@/lib/sales/mutations";
import type { SalesLineInput } from "@/lib/sales/types";

export async function createSalesEntryAction(formData: FormData) {
  const salesDate = formData.get("sales_date");
  if (!salesDate || typeof salesDate !== "string") {
    return { error: "매출일을 선택해 주세요." };
  }

  let items: SalesLineInput[];
  try {
    const itemsJson = formData.get("items");
    if (!itemsJson || typeof itemsJson !== "string") {
      return { error: "메뉴 라인이 없습니다. 최소 1개 메뉴를 입력해 주세요." };
    }
    items = JSON.parse(itemsJson) as SalesLineInput[];
  } catch {
    return { error: "메뉴 데이터 형식이 올바르지 않습니다." };
  }

  const validItems = items.filter(
    (l) => l.menu_item_id && Number(l.quantity) > 0,
  );
  if (validItems.length === 0) {
    return { error: "유효한 메뉴(메뉴, 수량)을 입력해 주세요." };
  }

  try {
    await createSalesEntry({
      sales_date: salesDate,
      memo: formData.get("memo")
        ? String(formData.get("memo")).trim() || null
        : null,
      created_by: null,
      items: validItems,
    });
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "매출 등록에 실패했습니다.",
    };
  }

  revalidatePath("/sales-input");
  revalidatePath("/inventory");
  redirect("/sales-input");
}
