import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { CreateReceiptInput, Item, Supplier } from "./types";
import { formatReceiptNo } from "./utils";

export type CreateReceiptResult = { receiptId: string; receiptNo: string };

export async function createReceipt(
  input: CreateReceiptInput,
): Promise<CreateReceiptResult> {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    throw new Error("Supabase is not configured");
  }

  const receiptNo = formatReceiptNo();

  const itemsPayload = input.items.map((line) => {
    const qty = Number(line.quantity);
    const supply = Number(line.supply_amount);
    const vat = Number(line.vat_amount ?? 0);
    const unitPrice = qty > 0 ? supply / qty : 0;
    return {
      item_id: line.item_id,
      quantity: qty,
      unit: line.unit,
      unit_price: unitPrice,
      supply_amount: supply,
      vat_amount: vat,
      total_amount: supply + vat,
      expiry_date: line.expiry_date || null,
      lot_no: line.lot_no || null,
      memo: line.memo || null,
    };
  });

  const { data, error } = await supabase.rpc("create_inventory_receipt", {
    p_receipt_no: receiptNo,
    p_supplier_id: input.supplier_id || null,
    p_receipt_date: input.receipt_date,
    p_memo: input.memo || null,
    p_created_by: input.created_by || null,
    p_items: itemsPayload,
  });

  if (error) {
    throw new Error(error.message || "Failed to create receipt");
  }

  if (!data) {
    throw new Error("No receipt id returned");
  }

  return { receiptId: data as string, receiptNo };
}

export type CreateSupplierInput = {
  name: string;
  code?: string | null;
  contact_name?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  business_number?: string | null;
  memo?: string | null;
  is_active?: boolean;
};

export async function createSupplier(
  input: CreateSupplierInput,
): Promise<Supplier> {
  const supabase = getSupabaseServerClient();
  if (!supabase) throw new Error("Supabase is not configured");

  const { data, error } = await supabase
    .from("suppliers")
    .insert({
      name: input.name,
      code: input.code || null,
      contact_name: input.contact_name || null,
      phone: input.phone || null,
      email: input.email || null,
      address: input.address || null,
      business_number: input.business_number || null,
      memo: input.memo || null,
      is_active: input.is_active ?? true,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Supplier;
}

export type CreateItemInput = {
  name: string;
  code?: string | null;
  base_unit: string;
  spec?: string | null;
  memo?: string | null;
};

export async function createItem(input: CreateItemInput): Promise<Item> {
  const supabase = getSupabaseServerClient();
  if (!supabase) throw new Error("Supabase is not configured");

  const { data, error } = await supabase
    .from("items")
    .insert({
      name: input.name,
      code: input.code || null,
      base_unit: input.base_unit || "ea",
      spec: input.spec || null,
      memo: input.memo || null,
      is_active: true,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Item;
}

export async function deactivateItem(itemId: string): Promise<void> {
  const supabase = getSupabaseServerClient();
  if (!supabase) throw new Error("Supabase is not configured");
  const { error } = await supabase
    .from("items")
    .update({ is_active: false })
    .eq("id", itemId);
  if (error) throw new Error(error.message);
}

export async function deactivateSupplier(supplierId: string): Promise<void> {
  const supabase = getSupabaseServerClient();
  if (!supabase) throw new Error("Supabase is not configured");
  const { error } = await supabase
    .from("suppliers")
    .update({ is_active: false })
    .eq("id", supplierId);
  if (error) throw new Error(error.message);
}

export async function cancelReceipt(receiptId: string, reason: string): Promise<void> {
  const supabase = getSupabaseServerClient();
  if (!supabase) throw new Error("Supabase is not configured");

  const { data: receipt, error: rErr } = await supabase
    .from("inventory_receipts")
    .select("id, status")
    .eq("id", receiptId)
    .single();

  if (rErr || !receipt) throw new Error("입고 전표를 찾을 수 없습니다.");
  if ((receipt as { status: string }).status === "cancelled") {
    throw new Error("이미 취소된 전표입니다.");
  }

  const { data: items, error: iErr } = await supabase
    .from("inventory_receipt_items")
    .select("item_id, quantity")
    .eq("receipt_id", receiptId);

  if (iErr || !items?.length) throw new Error("입고 품목을 찾을 수 없습니다.");

  for (const row of items as { item_id: string; quantity: number }[]) {
    const { data: stock } = await supabase
      .from("inventory_stocks")
      .select("current_qty")
      .eq("item_id", row.item_id)
      .single();

    const current = Number((stock as { current_qty: number } | null)?.current_qty ?? 0);
    const required = Number(row.quantity);
    if (current < required) {
      throw new Error(
        `재고 부족으로 취소할 수 없습니다. (품목: ${row.item_id}, 필요: ${required}, 현재: ${current})`,
      );
    }
  }

  const { error: upErr } = await supabase
    .from("inventory_receipts")
    .update({
      status: "cancelled",
      cancel_reason: reason,
      cancelled_at: new Date().toISOString(),
    })
    .eq("id", receiptId);

  if (upErr) throw new Error(upErr.message);

  for (const row of items as { item_id: string; quantity: number }[]) {
    const itemId = row.item_id;
    const qty = Number(row.quantity);

    const { data: stock } = await supabase
      .from("inventory_stocks")
      .select("current_qty, avg_unit_cost")
      .eq("item_id", itemId)
      .single();

    const currentQty = Number((stock as { current_qty: number } | null)?.current_qty ?? 0);
    const avgCost = Number((stock as { avg_unit_cost: number } | null)?.avg_unit_cost ?? 0);
    const newQty = currentQty - qty;

    await supabase
      .from("inventory_stocks")
      .update({ current_qty: newQty, updated_at: new Date().toISOString() })
      .eq("item_id", itemId);

    await supabase.from("inventory_transactions").insert({
      item_id: itemId,
      tx_type: "outbound",
      ref_type: "receipt_cancel",
      ref_id: receiptId,
      qty_change: -qty,
      unit_cost: avgCost,
      balance_qty: newQty,
      memo: "입고 취소",
    });
  }
}
