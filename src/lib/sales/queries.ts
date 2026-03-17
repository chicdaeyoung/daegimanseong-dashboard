import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { SalesEntryWithItems } from "./types";

export async function getSalesEntryList(): Promise<SalesEntryWithItems[]> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return [];

  const { data: entries, error: eErr } = await supabase
    .from("sales_entries")
    .select("*")
    .order("sales_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (eErr || !entries?.length) return [];

  const { data: items } = await supabase
    .from("sales_entry_items")
    .select(`
      *,
      menu_item:menu_items(*)
    `);

  const itemsByEntry = new Map<string, typeof items>();
  for (const i of items ?? []) {
    const eid = (i as { sales_entry_id: string }).sales_entry_id;
    const list = itemsByEntry.get(eid) ?? [];
    list.push(i);
    itemsByEntry.set(eid, list);
  }

  return (entries as SalesEntryWithItems[]).map((e) => ({
    ...e,
    items: (itemsByEntry.get(e.id) ?? []) as SalesEntryWithItems["items"],
  }));
}

export async function getSalesEntryDetail(
  entryId: string,
): Promise<SalesEntryWithItems | null> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return null;

  const { data: entry, error: eErr } = await supabase
    .from("sales_entries")
    .select("*")
    .eq("id", entryId)
    .single();

  if (eErr || !entry) return null;

  const { data: items, error: iErr } = await supabase
    .from("sales_entry_items")
    .select(`
      *,
      menu_item:menu_items(*)
    `)
    .eq("sales_entry_id", entryId)
    .order("created_at", { ascending: true });

  return {
    ...(entry as SalesEntryWithItems),
    items: (iErr ? [] : items ?? []) as SalesEntryWithItems["items"],
  };
}
