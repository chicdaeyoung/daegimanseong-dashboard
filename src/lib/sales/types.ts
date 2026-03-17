import type { MenuItem } from "@/lib/recipes/types";

export type SalesEntry = {
  id: string;
  sales_date: string;
  memo: string | null;
  created_by: string | null;
  created_at: string;
  status?: string;
  cancel_reason?: string | null;
  cancelled_at?: string | null;
};

export type SalesEntryItem = {
  id: string;
  sales_entry_id: string;
  menu_item_id: string;
  quantity: number;
  created_at: string;
};

export type SalesLineInput = {
  menu_item_id: string;
  quantity: number;
};

export type CreateSalesEntryInput = {
  sales_date: string;
  memo?: string | null;
  created_by?: string | null;
  items: SalesLineInput[];
};

export type SalesEntryWithItems = SalesEntry & {
  items: (SalesEntryItem & { menu_item?: MenuItem | null })[];
};
