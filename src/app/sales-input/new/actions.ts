'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createSalesEntry, deductInventoryForSalesLines } from '@/lib/sales/mutations'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import type { SalesLineInput } from '@/lib/sales/types'

export async function createSalesEntryAction(formData: FormData) {
  const salesDate = formData.get('sales_date')
  if (!salesDate || typeof salesDate !== 'string') {
    return { error: '매출일을 선택해 주세요.' }
  }

  let items: SalesLineInput[]
  try {
    const itemsJson = formData.get('items')
    if (!itemsJson || typeof itemsJson !== 'string') {
      return { error: '메뉴 라인이 없습니다. 최소 1개 메뉴를 입력해 주세요.' }
    }
    items = JSON.parse(itemsJson) as SalesLineInput[]
  } catch {
    return { error: '메뉴 데이터 형식이 올바르지 않습니다.' }
  }

  const validItems = items.filter(
    (l) => l.menu_item_id && Number(l.quantity) > 0,
  )
  if (validItems.length === 0) {
    return { error: '유효한 메뉴(메뉴, 수량)을 입력해 주세요.' }
  }

  const supabase = await getSupabaseServerClient()
  if (!supabase) return { error: '서버 연결 실패' }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '로그인이 필요합니다.' }

  const { data: storeUser } = await supabase
    .from('store_users')
    .select('store_id')
    .eq('id', user.id)
    .single()

  if (!storeUser) return { error: '점포 정보를 찾을 수 없습니다.' }

  let salesEntryId: string
  try {
    const result = await createSalesEntry({
      store_id: storeUser.store_id,
      sales_date: salesDate,
      memo: formData.get('memo') ? String(formData.get('memo')).trim() || null : null,
      created_by: null,
      items: validItems,
    })
    salesEntryId = result.salesEntryId
  } catch (e) {
    return { error: e instanceof Error ? e.message : '매출 등록에 실패했습니다.' }
  }

  // 재고 자동 차감
  try {
    await deductInventoryForSalesLines(
      supabase,
      storeUser.store_id,
      validItems.map((item) => ({
        menu_id: item.menu_item_id,
        qty:     Number(item.quantity),
        slip_id: salesEntryId,
      }))
    )
  } catch (e: any) {
    // 재고 부족 시 전표 취소 처리
    await supabase
      .from('sales_entries')
      .update({ status: 'cancelled' })
      .eq('id', salesEntryId)
    return { error: `재고 부족: ${e.message}` }
  }

  revalidatePath('/sales-input')
  revalidatePath('/inventory')
  redirect('/sales-input')
}
