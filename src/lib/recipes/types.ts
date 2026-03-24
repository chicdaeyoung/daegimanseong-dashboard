import type { Item } from "@/lib/inventory/types";

export type MenuItem = {
  id: string;
  name: string;
  code: string | null;
  category: string | null;
  sale_price: number;
  is_active: boolean;
  memo: string | null;
  created_at: string;
  updated_at: string;
};

export type MenuRecipe = {
  id: string;
  menu_item_id: string;
  item_id: string;
  quantity: number;
  unit: string;
  unit_conversion: number;
  memo: string | null;
  created_at: string;
};

export type MenuRecipeWithItem = MenuRecipe & {
  item?: Item | null;
};

export type RecipeLineInput = {
  item_id: string;
  quantity: number;
  unit: string;
  memo?: string;
};

export type CreateRecipeInput = {
  name: string;
  code?: string | null;
  category?: string | null;
  sale_price: number;
  memo?: string | null;
  lines: RecipeLineInput[];
};
