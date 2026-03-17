import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { MenuItem, MenuRecipeWithItem } from "./types";

export async function getMenuItemsList(): Promise<MenuItem[]> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("menu_items")
    .select("*")
    .order("name", { ascending: true });

  if (error) return [];
  return (data ?? []) as MenuItem[];
}

export async function getMenuItemsForSales(): Promise<MenuItem[]> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("menu_items")
    .select("*")
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (error) return [];
  return (data ?? []) as MenuItem[];
}

/** Only menu items that have at least one recipe (for sales deduction) */
export async function getMenuItemsWithRecipesForSales(): Promise<MenuItem[]> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return [];

  const { data: menuIds } = await supabase
    .from("menu_recipes")
    .select("menu_item_id");

  const uniqueIds = [...new Set((menuIds ?? []).map((r: { menu_item_id: string }) => r.menu_item_id))];
  if (uniqueIds.length === 0) return [];

  const { data, error } = await supabase
    .from("menu_items")
    .select("*")
    .eq("is_active", true)
    .in("id", uniqueIds)
    .order("name", { ascending: true });

  if (error) return [];
  return (data ?? []) as MenuItem[];
}

export async function getMenuItemsWithRecipeCount(): Promise<
  (MenuItem & { recipe_count: number })[]
> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return [];

  const { data: menus, error: mErr } = await supabase
    .from("menu_items")
    .select("*")
    .order("name", { ascending: true });

  if (mErr || !menus?.length) return [];

  const { data: counts } = await supabase
    .from("menu_recipes")
    .select("menu_item_id");

  const countByMenu = new Map<string, number>();
  for (const r of counts ?? []) {
    const id = (r as { menu_item_id: string }).menu_item_id;
    countByMenu.set(id, (countByMenu.get(id) ?? 0) + 1);
  }

  return (menus as MenuItem[]).map((m) => ({
    ...m,
    recipe_count: countByMenu.get(m.id) ?? 0,
  }));
}

export async function getRecipeDetail(menuItemId: string): Promise<{
  menu: MenuItem | null;
  recipes: MenuRecipeWithItem[];
}> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return { menu: null, recipes: [] };

  const { data: menu, error: mErr } = await supabase
    .from("menu_items")
    .select("*")
    .eq("id", menuItemId)
    .single();

  if (mErr || !menu) return { menu: null, recipes: [] };

  const { data: recipes, error: rErr } = await supabase
    .from("menu_recipes")
    .select(`
      *,
      item:items(*)
    `)
    .eq("menu_item_id", menuItemId)
    .order("created_at", { ascending: true });

  return {
    menu: menu as MenuItem,
    recipes: (rErr ? [] : recipes ?? []) as MenuRecipeWithItem[],
  };
}
