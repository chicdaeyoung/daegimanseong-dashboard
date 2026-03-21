import { getSupabaseServerClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import SetMenuCreateForm from './set-menu-create-form'

export default async function SetMenuNewPage() {
  const supabase = await getSupabaseServerClient()
  if (!supabase) notFound()

  const { data: menus } = await supabase
    .from('menu_items')
    .select('id, name, category')
    .eq('menu_type', 'single')
    .eq('is_active', true)
    .order('name')

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-xl font-semibold text-gray-900 mb-6">세트메뉴 등록</h1>
      <SetMenuCreateForm menus={menus ?? []} />
    </div>
  )
}
