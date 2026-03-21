import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { CreateSalesEntryInput } from "./types";

// -------------------------------------------------------
// 세트메뉴 포함 재고 자동 차감
// -------------------------------------------------------
export async function deductInventoryForSalesLines(
  supabase: any,
  storeId: string,
  salesLines: Array<{ menu_id: string; qty: number; slip_id: string }>
) {
  for (const line of salesLines) {
    // 1. 메뉴 타입 확인
    const { data: menu } = await supabase
      .from('menu_items')
      .select('menu_type')
      .eq('id', line.menu_id)
      .single()

    if (!menu) continue

    if (menu.menu_type === 'set') {
      // 2a. 세트 → 구성 단품 조회 후 각 단품 레시피로 차감
      const { data: components } = await supabase
        .from('set_menu_components')
        .select('component_menu_id, quantity')
        .eq('set_menu_id', line.menu_id)

      for (const comp of components ?? []) {
        await deductByRecipe(supabase, storeId, {
          menu_id:  comp.component_menu_id,
          qty:      line.qty * comp.quantity,
          slip_id:  line.slip_id,
        })
      }
    } else {
      // 2b. 단품 → 직접 레시피로 차감
      await deductByRecipe(supabase, storeId, line)
    }
  }
}

async function deductByRecipe(
  supabase: any,
  storeId: string,
  { menu_id, qty, slip_id }: { menu_id: string; qty: number; slip_id: string }
) {
  // menu_recipes 테이블에서 레시피 조회
  const { data: recipes } = await supabase
    .from('menu_recipes')
    .select('item_id, quantity')
    .eq('menu_item_id', menu_id)

  for (const recipe of recipes ?? []) {
    const deductQty = recipe.quantity * qty

    // 재고 차감 (DB 함수 호출)
    const { error } = await supabase.rpc('adjust_stock_quantity', {
      p_item_id: recipe.item_id,
      p_qty:     -deductQty,
    })

    if (error) {
      // insufficient_stock 에러는 상위로 전파
      throw new Error(error.message)
    }

    // 이동 이력 기록
    await supabase.from('inventory_transactions').insert({
      store_id:      storeId,
      item_id:       recipe.item_id,
      tx_type:       'sale_out',
      qty_change:    -deductQty,
      unit_cost:     0,
      ref_type:      'sales_line',
      ref_id:        slip_id,
      tx_date:       new Date().toISOString(),
    })
  }
}

export async function createSalesEntry(
  input: CreateSalesEntryInput & { store_id: string },
): Promise<{ salesEntryId: string }> {
  const supabase = await getSupabaseServerClient();
  if (!supabase) throw new Error("서버 연결에 실패했습니다.");

  const itemsPayload = input.items
    .filter((l) => l.menu_item_id && Number(l.quantity) > 0)
    .map((l) => ({
      menu_item_id: l.menu_item_id,
      quantity: Number(l.quantity),
    }));

  if (itemsPayload.length === 0) {
    throw new Error("최소 1개 메뉴를 입력해 주세요.");
  }

  const { data, error } = await supabase.rpc("create_sales_entry_with_deduction", {
    p_store_id: input.store_id,
    p_sales_date: input.sales_date,
    p_memo: input.memo || null,
    p_created_by: input.created_by || null,
    p_items: itemsPayload,
  });

  if (error) throw new Error(error.message);
  if (!data) throw new Error("매출 전표 번호를 받지 못했습니다.");

  return { salesEntryId: data as string };
}

export async function cancelSalesEntry(
  salesEntryId: string,
  reason: string,
): Promise<void> {
  const supabase = await getSupabaseServerClient();
  if (!supabase) throw new Error("서버 연결에 실패했습니다.");

  const { data: entry, error: eErr } = await supabase
    .from("sales_entries")
    .select("id, status")
    .eq("id", salesEntryId)
    .single();

  if (eErr || !entry) throw new Error("매출 전표를 찾을 수 없습니다.");
  const status = (entry as { status?: string }).status;
  if (status === "cancelled") throw new Error("이미 취소된 전표입니다.");

  const { data: entryItems, error: iErr } = await supabase
    .from("sales_entry_items")
    .select("menu_item_id, quantity")
    .eq("sales_entry_id", salesEntryId);

  if (iErr || !entryItems?.length) throw new Error("매출 품목을 찾을 수 없습니다.");

  const itemRestore = new Map<string, number>();

  for (const line of entryItems as { menu_item_id: string; quantity: number }[]) {
    const { data: recipes } = await supabase
      .from("menu_recipes")
      .select("item_id, quantity")
      .eq("menu_item_id", line.menu_item_id);

    const soldQty = Number(line.quantity);
    for (const r of recipes ?? []) {
      const itemId = (r as { item_id: string }).item_id;
      const recipeQty = Number((r as { quantity: number }).quantity);
      const add = recipeQty * soldQty;
      itemRestore.set(itemId, (itemRestore.get(itemId) ?? 0) + add);
    }
  }

  const { error: upErr } = await supabase
    .from("sales_entries")
    .update({
      status: "cancelled",
      cancel_reason: reason,
      cancelled_at: new Date().toISOString(),
    })
    .eq("id", salesEntryId);

  if (upErr) throw new Error(upErr.message);

  for (const [itemId, qty] of itemRestore) {
    const { data: stock } = await supabase
      .from("inventory_stocks")
      .select("current_qty, avg_unit_cost")
      .eq("item_id", itemId)
      .single();

    const currentQty = Number((stock as { current_qty: number } | null)?.current_qty ?? 0);
    const avgCost = Number((stock as { avg_unit_cost: number } | null)?.avg_unit_cost ?? 0);
    const newQty = currentQty + qty;

    if (!stock) {
      await supabase.from("inventory_stocks").insert({
        item_id: itemId,
        current_qty: qty,
        avg_unit_cost: avgCost,
        updated_at: new Date().toISOString(),
      });
    } else {
      await supabase
        .from("inventory_stocks")
        .update({ current_qty: newQty, updated_at: new Date().toISOString() })
        .eq("item_id", itemId);
    }

    await supabase.from("inventory_transactions").insert({
      item_id: itemId,
      tx_type: "inbound",
      ref_type: "sales_cancel",
      ref_id: salesEntryId,
      qty_change: qty,
      unit_cost: avgCost,
      balance_qty: newQty,
      memo: "판매 취소",
    });
  }
}
