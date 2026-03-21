import { getSupabaseServerClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'

export default async function SetMenuDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = await getSupabaseServerClient()
  if (!supabase) notFound()

  const { data: menu } = await supabase
    .from('menu_items')
    .select('*, set_menu_components(*, component:menu_items!set_menu_components_component_menu_id_fkey(id, name, category))')
    .eq('id', params.id)
    .eq('menu_type', 'set')
    .single()

  if (!menu) notFound()

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-900">{menu.name}</h1>
        <span className="text-sm text-gray-500">세트메뉴</span>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">코드</span>
            <span className="ml-2 text-gray-900">{menu.code}</span>
          </div>
          <div>
            <span className="text-gray-500">판매가</span>
            <span className="ml-2 text-gray-900">₩{menu.sale_price?.toLocaleString()}</span>
          </div>
          <div>
            <span className="text-gray-500">카테고리</span>
            <span className="ml-2 text-gray-900">{menu.category ?? '-'}</span>
          </div>
          <div>
            <span className="text-gray-500">상태</span>
            <span className={`ml-2 font-medium ${menu.is_active ? 'text-green-600' : 'text-red-500'}`}>
              {menu.is_active ? '사용' : '미사용'}
            </span>
          </div>
        </div>

        <div>
          <h2 className="text-sm font-medium text-gray-700 mb-3">구성 단품</h2>
          <div className="space-y-2">
            {menu.set_menu_components?.map((comp: any) => (
              <div key={comp.id}
                className="flex items-center justify-between bg-gray-50 px-4 py-2 rounded-lg">
                <span className="text-sm text-gray-900">{comp.component?.name}</span>
                <span className="text-sm text-gray-500">{comp.quantity} 인분</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 flex gap-3">
        <a href="/recipes"
          className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200">
          ← 목록으로
        </a>
      </div>
    </div>
  )
}
