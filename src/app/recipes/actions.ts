"use server";

import { revalidatePath } from "next/cache";
import { deactivateMenu, deleteRecipeLine } from "@/lib/recipes/mutations";

export async function menuDeactivateAction(menuItemId: string) {
  if (!menuItemId) return { error: "메뉴가 없습니다." };
  try {
    await deactivateMenu(menuItemId);
    revalidatePath("/recipes");
    revalidatePath("/recipes/[id]");
    revalidatePath("/sales-input/new");
    return { ok: true };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "비활성화에 실패했습니다.",
    };
  }
}

export async function deleteRecipeLineAction(recipeLineId: string) {
  if (!recipeLineId) return { error: "레시피 라인이 없습니다." };
  try {
    await deleteRecipeLine(recipeLineId);
    revalidatePath("/recipes");
    revalidatePath("/recipes/[id]");
    revalidatePath("/sales-input/new");
    return { ok: true };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "삭제에 실패했습니다.",
    };
  }
}
