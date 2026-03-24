"use server";

import { revalidatePath } from "next/cache";
import { deactivateMenu, deleteRecipeLine } from "@/lib/recipes/mutations";
import { getSupabaseServerClient } from "@/lib/supabase/server";

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

export async function addRecipeLineAction(
  menuItemId: string,
  line: { item_id: string; quantity: number; unit: string; unit_conversion: number },
) {
  const supabase = await getSupabaseServerClient()
  if (!supabase) return { error: '서버 연결 실패' }

  const { data, error } = await supabase
    .from('menu_recipes')
    .insert({
      menu_item_id: menuItemId,
      item_id: line.item_id,
      quantity: line.quantity,
      unit: line.unit,
      unit_conversion: line.unit_conversion,
    })
    .select('*, item:items(*)')
    .single()

  if (error) return { error: error.message }
  revalidatePath('/recipes')
  revalidatePath('/recipes/[id]')
  return { data }
}

export async function updateRecipeLineAction(
  recipeLineId: string,
  line: { quantity: number; unit: string; unit_conversion: number },
) {
  const supabase = await getSupabaseServerClient()
  if (!supabase) return { error: '서버 연결 실패' }

  const { error } = await supabase
    .from('menu_recipes')
    .update({
      quantity: line.quantity,
      unit: line.unit,
      unit_conversion: line.unit_conversion,
    })
    .eq('id', recipeLineId)

  if (error) return { error: error.message }
  revalidatePath('/recipes')
  revalidatePath('/recipes/[id]')
  return { success: true }
}
