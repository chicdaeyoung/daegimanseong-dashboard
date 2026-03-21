import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import type { CreateRecipeInput, MenuItem } from "./types";

export async function createRecipe(input: CreateRecipeInput & { store_id: string }): Promise<MenuItem> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) throw new Error("서버 연결에 실패했습니다.");

  const { data: menu, error: menuErr } = await supabase
    .from("menu_items")
    .insert({
      store_id: input.store_id,
      name: input.name,
      code: input.code || null,
      category: input.category || null,
      sale_price: input.sale_price ?? 0,
      memo: input.memo || null,
      is_active: true,
    })
    .select()
    .single();

  if (menuErr) throw new Error(menuErr.message);
  const menuId = (menu as MenuItem).id;

  for (const line of input.lines) {
    if (!line.item_id || Number(line.quantity) <= 0 || !line.unit) continue;

    const { error: recipeErr } = await supabase.from("menu_recipes").insert({
      menu_item_id: menuId,
      item_id: line.item_id,
      quantity: Number(line.quantity),
      unit: line.unit,
      memo: line.memo || null,
    });

    if (recipeErr) throw new Error(recipeErr.message);
  }

  return menu as MenuItem;
}

export async function deactivateMenu(menuItemId: string): Promise<void> {
  const supabase = await getSupabaseServerClient();
  if (!supabase) throw new Error("서버 연결에 실패했습니다.");
  const { error } = await supabase
    .from("menu_items")
    .update({ is_active: false })
    .eq("id", menuItemId);
  if (error) throw new Error(error.message);
}

export async function deleteRecipeLine(recipeLineId: string): Promise<void> {
  const supabase = await getSupabaseServerClient();
  if (!supabase) throw new Error("서버 연결에 실패했습니다.");
  const { error } = await supabase
    .from("menu_recipes")
    .delete()
    .eq("id", recipeLineId);
  if (error) throw new Error(error.message);
}
