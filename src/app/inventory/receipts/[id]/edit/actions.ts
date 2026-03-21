'use server'

import { getSupabaseServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function updateReceiptLine(formData: FormData) {
  const supabase = await getSupabaseServerClient()
  if (!supabase) return { error: 'DB 연결 실패' }

  const receiptId   = formData.get('receipt_id') as string
  const lineId      = formData.get('line_id') as string
  const newQty      = parseFloat(formData.get('quantity') as string)
  const newUnitPrice = parseFloat(formData.get('unit_price') as string)

  // 1. 기존 라인 조회
  const { data: line } = await supabase
    .from('inventory_receipt_items')
    .select('item_id, quantity, unit_price')
    .eq('id', lineId)
    .single()

  if (!line) return { error: '입고 라인을 찾을 수 없습니다.' }

  const qtyDiff = newQty - line.quantity

  // 2. 음수 재고 체크
  const { data: stock } = await supabase
    .from('inventory_stocks')
    .select('current_qty')
    .eq('item_id', line.item_id)
    .single()

  if (stock && stock.current_qty + qtyDiff < 0) {
    return {
      error: `재고 부족: 현재 재고(${stock.current_qty})보다 많이 차감할 수 없습니다.`,
    }
  }

  // 3. 라인 업데이트
  const supplyAmount = newQty * newUnitPrice
  const vatAmount    = Math.round(supplyAmount * 0.1)

  const { error: lineErr } = await supabase
    .from('inventory_receipt_items')
    .update({
      quantity:       newQty,
      unit_price:     newUnitPrice,
      supply_amount:  supplyAmount,
      vat_amount:     vatAmount,
      total_amount:   supplyAmount + vatAmount,
    })
    .eq('id', lineId)

  if (lineErr) return { error: lineErr.message }

  // 4. 이동평균 재계산 + 재고 수량 반영
  if (qtyDiff !== 0) {
    const { error: rpcErr } = await supabase.rpc('apply_receipt_to_stock', {
      p_item_id:   line.item_id,
      p_qty:       qtyDiff,
      p_unit_cost: newUnitPrice,
    })
    if (rpcErr) return { error: rpcErr.message }

    // 5. 이동 이력 기록
    const { data: { user } } = await supabase.auth.getUser()
    const { data: storeUser } = await supabase
      .from('store_users')
      .select('store_id')
      .eq('id', user!.id)
      .single()

    await supabase.from('inventory_transactions').insert({
      store_id:      storeUser!.store_id,
      item_id:       line.item_id,
      tx_type:       'receipt_in',
      qty_change:    qtyDiff,
      unit_cost:     newUnitPrice,
      ref_type:      'receipt_line',
      ref_id:        lineId,
      memo:          '입고 수정',
      tx_date:       new Date().toISOString(),
    })
  }

  revalidatePath(`/inventory/receipts/${receiptId}`)
  redirect(`/inventory/receipts/${receiptId}`)
}
