import { getSupabaseAdminClient } from '@/lib/supabase/admin'

export type DailySalesSummary = {
  sales_date: string
  store_id: string
  total_sales: number
  food_cost: number
  gross_profit: number
  food_cost_ratio: number
  day_of_week: number
}

export async function getDailySalesSummary(days: number = 14): Promise<DailySalesSummary[]> {
  const supabase = getSupabaseAdminClient()
  if (!supabase) return []

  const { data, error } = await supabase
    .from('daily_sales_summary')
    .select('*')
    .limit(days)

  if (error) {
    console.log('[getDailySalesSummary] error:', error.message)
    return []
  }
  return (data ?? []) as DailySalesSummary[]
}

export async function getTopMenus(days: number = 14): Promise<{ menu_name: string; total_qty: number }[]> {
  const supabase = getSupabaseAdminClient()
  if (!supabase) return []

  const from = new Date()
  from.setDate(from.getDate() - days)

  const { data, error } = await supabase
    .from('sales_entry_items')
    .select(`
      quantity,
      menu_items!inner(name, store_id)
    `)
    .gte('created_at', from.toISOString())

  if (error) return []

  const qtyMap = new Map<string, number>()
  for (const row of data ?? []) {
    const name = (row.menu_items as any)?.name ?? '알 수 없음'
    qtyMap.set(name, (qtyMap.get(name) ?? 0) + row.quantity)
  }

  return [...qtyMap.entries()]
    .map(([menu_name, total_qty]) => ({ menu_name, total_qty }))
    .sort((a, b) => b.total_qty - a.total_qty)
    .slice(0, 5)
}
