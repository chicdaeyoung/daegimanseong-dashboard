'use server'

import { getSupabaseServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createSetMenu(formData: FormData) {
  const supabase = await getSupabaseServerClient()
  if (!supabase) return { error: 'DB 연결 실패' }

  const { data: { user } } = await supabase.auth.getUser()
  const { data: storeUser } = await supabase
    .from('store_users')
    .select('store_id')
    .eq('id', user!.id)
    .single()

  const name      = formData.get('name') as string
  const code      = formData.get('code') as string
  const category  = formData.get('category') as string
  const salePrice = parseInt(formData.get('sale_price') as string)
  const componentIds = formData.getAll('component_ids') as string[]
  const componentQtys = formData.getAll('component_qtys') as string[]

  if (componentIds.length === 0) {
    return { error: '구성 메뉴를 최소 1개 이상 선택해주세요.' }
  }

  // 1. 세트메뉴 생성
  const { data: menu, error: menuErr } = await supabase
    .from('menu_items')
    .insert({
      store_id:   storeUser!.store_id,
      name,
      code,
      category,
      sale_price: salePrice,
      menu_type:  'set',
      is_active:  true,
    })
    .select('id')
    .single()

  if (menuErr) return { error: menuErr.message }

  // 2. 구성 단품 등록
  const components = componentIds.map((id, idx) => ({
    set_menu_id:       menu!.id,
    component_menu_id: id,
    quantity:          parseFloat(componentQtys[idx] ?? '1'),
  }))

  const { error: compErr } = await supabase
    .from('set_menu_components')
    .insert(components)

  if (compErr) return { error: compErr.message }

  revalidatePath('/recipes')
  redirect('/recipes')
}
