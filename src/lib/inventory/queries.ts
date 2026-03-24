import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import type {
  DashboardItem,
  Item,
  ReceiptDetail,
  ReceiptWithSupplier,
  Supplier,
} from "./types";

export async function getSuppliers(): Promise<Supplier[]> {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("suppliers")
    .select("*")
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (error) return [];
  return (data ?? []) as Supplier[];
}

export async function getSuppliersList(): Promise<Supplier[]> {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("suppliers")
    .select("*")
    .order("name", { ascending: true });

  if (error) return [];
  return (data ?? []) as Supplier[];
}

export async function getItemsForInventory(): Promise<Item[]> {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("items")
    .select("*")
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (error) return [];
  return (data ?? []) as Item[];
}

export async function getItemsList(): Promise<Item[]> {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("items")
    .select("*")
    .order("name", { ascending: true });

  if (error) return [];
  return (data ?? []) as Item[];
}

export async function getReceiptList(): Promise<ReceiptWithSupplier[]> {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return [];

  const { data: receipts, error: rErr } = await supabase
    .from("inventory_receipts")
    .select(`
      *,
      supplier:suppliers(*)
    `)
    .order("receipt_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (rErr) return [];
  return (receipts ?? []) as ReceiptWithSupplier[];
}

export async function getReceiptDetail(
  receiptId: string,
): Promise<ReceiptDetail | null> {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return null;

  const { data: receipt, error: rErr } = await supabase
    .from("inventory_receipts")
    .select(`
      *,
      supplier:suppliers(*)
    `)
    .eq("id", receiptId)
    .single();

  if (rErr || !receipt) return null;

  const { data: items, error: iErr } = await supabase
    .from("inventory_receipt_items")
    .select(`
      *,
      item:items(*)
    `)
    .eq("receipt_id", receiptId)
    .order("created_at", { ascending: true });

  const detail: ReceiptDetail = {
    ...(receipt as ReceiptDetail),
    items: (items ?? []) as ReceiptDetail["items"],
  };
  return iErr ? { ...detail, items: [] } : detail;
}

export async function getInventoryDashboardItems(): Promise<DashboardItem[]> {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return [];

  const { data: items, error: itemsErr } = await supabase
    .from("items")
    .select("*")
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (itemsErr || !items?.length) return [];

  const { data: stocks, error: stocksErr } = await supabase
    .from("inventory_stocks")
    .select("*");

  const stockByItem = new Map(
    (stocks ?? []).map((s: { item_id: string; current_qty: number; avg_unit_cost: number; last_inbound_at: string | null; updated_at: string }) => [
      s.item_id,
      {
        item_id: s.item_id,
        current_qty: Number(s.current_qty),
        avg_unit_cost: Number(s.avg_unit_cost),
        last_inbound_at: s.last_inbound_at,
        updated_at: s.updated_at,
      },
    ]),
  );

  return (items as Item[]).map((item) => {
    const stock = stockByItem.get(item.id) ?? null;
    const current_qty = stock ? stock.current_qty : 0;
    const avg_unit_cost = stock ? stock.avg_unit_cost : 0;
    return {
      ...item,
      stock,
      stock_amount: current_qty * avg_unit_cost,
    } as DashboardItem;
  });
}

export async function getItemReceiptHistory(itemId: string) {
  const supabase = getSupabaseAdminClient()
  if (!supabase) return []

  const { data, error } = await supabase
    .from('inventory_receipt_items')
    .select(`
      id,
      quantity,
      unit,
      unit_price,
      supply_amount,
      vat_amount,
      total_amount,
      created_at,
      receipt:inventory_receipts(
        id,
        receipt_no,
        receipt_date,
        status,
        supplier:suppliers(name)
      )
    `)
    .eq('item_id', itemId)
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) return []
  return data ?? []
}

export async function getStockAlerts() {
  const supabase = getSupabaseAdminClient()
  if (!supabase) return []

  const { data, error } = await supabase
    .from('inventory_stock_alerts')
    .select('*')
    .in('alert_level', ['critical', 'warning'])
    .order('alert_level', { ascending: true })
    .order('current_qty', { ascending: true })

  if (error) {
    console.log('[getStockAlerts] error:', error.message)
    return []
  }
  return data ?? []
}
