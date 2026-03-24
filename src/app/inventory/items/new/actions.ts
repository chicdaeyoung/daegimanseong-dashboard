'use server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createItem } from '@/lib/inventory/mutations'
import { getSupabaseServerClient } from '@/lib/supabase/server'

export async function createItemAction(formData: FormData) {
  const name = formData.get('name')
  if (!name || typeof name !== 'string' || !name.trim()) {
    return { error: '품목명을 입력해 주세요.' }
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

  function getBaseUnit(purchaseUnit: string): string {
    if (['kg', 'g', '봉지'].includes(purchaseUnit)) return 'g'
    if (['L', 'ml', '통'].includes(purchaseUnit)) return 'ml'
    return '개' // 개, 박스
  }

  function getAutoConversion(purchaseUnit: string): number | null {
    if (purchaseUnit === 'kg' || purchaseUnit === 'L') return 1000
    if (purchaseUnit === 'g' || purchaseUnit === 'ml') return 1
    return null // 개, 봉지, 박스, 통: 직접 입력
  }

  const purchaseUnit = String(formData.get('purchase_unit') || 'kg')
  const base_unit = getBaseUnit(purchaseUnit)
  const autoConversion = getAutoConversion(purchaseUnit)
  const unitConversionRaw = formData.get('unit_conversion')
  const unit_conversion = autoConversion !== null
    ? autoConversion
    : unitConversionRaw ? Number(unitConversionRaw) : 1

  if (isNaN(unit_conversion) || unit_conversion <= 0) {
    return { error: '변환계수는 양수여야 합니다.' }
  }

  try {
    await createItem({
      store_id: storeUser.store_id,
      name: name.trim(),
      code: formData.get('code') ? String(formData.get('code')).trim() || null : null,
      base_unit,
      purchase_unit: purchaseUnit,
      unit_conversion,
      spec: formData.get('spec') ? String(formData.get('spec')).trim() || null : null,
      memo: formData.get('memo') ? String(formData.get('memo')).trim() || null : null,
    })
  } catch (e) {
    return { error: e instanceof Error ? e.message : '품목 등록에 실패했습니다.' }
  }

  revalidatePath('/inventory/items')
  revalidatePath('/inventory')
  redirect('/inventory/items')
}
