"use server";

import { revalidatePath } from "next/cache";
import { deactivateItem, deleteItem } from "@/lib/inventory/mutations";

export async function itemDeactivateAction(itemId: string) {
  if (!itemId) return { error: "품목이 없습니다." };
  try {
    await deactivateItem(itemId);
    revalidatePath("/inventory/items");
    revalidatePath("/inventory");
    revalidatePath("/inventory/receipts/new");
    revalidatePath("/recipes/new");
    return { ok: true };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "비활성화에 실패했습니다.",
    };
  }
}

export async function itemDeleteAction(itemId: string) {
  if (!itemId) return { error: "품목이 없습니다." };
  try {
    await deleteItem(itemId);
    revalidatePath("/inventory/items");
    revalidatePath("/inventory");
    return { ok: true };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "삭제에 실패했습니다.",
    };
  }
}
