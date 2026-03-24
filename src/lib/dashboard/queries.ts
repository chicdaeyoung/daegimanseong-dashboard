import { getSupabaseAdminClient } from '@/lib/supabase/admin'

export type TodaySummary = {
  store_id: string
  total_sales: number
  food_cost: number
  gross_profit: number
  food_cost_ratio: number
}

export type TodayMenuSale = {
  menu_item_id: string
  menu_name: string
  total_qty: number
}

export type WeekdayPattern = {
  day_of_week: number
  avg_sales: number
}

async function getActiveStoreId(): Promise<string | null> {
  const supabase = getSupabaseAdminClient()
  if (!supabase) return null

  const { data: stores } = await supabase
    .from('stores')
    .select('id')
    .eq('is_active', true)
    .limit(1)

  return stores?.[0]?.id ?? null
}

export async function getTodaySummary(): Promise<TodaySummary | null> {
  const supabase = getSupabaseAdminClient()
  if (!supabase) return null

  const storeId = await getActiveStoreId()
  if (!storeId) return null

  const { data, error } = await supabase
    .from('today_sales_summary')
    .select('*')
    .eq('store_id', storeId)
    .single()

  if (error || !data) return null
  return data as TodaySummary
}

export async function getYesterdaySummary(): Promise<TodaySummary | null> {
  const supabase = getSupabaseAdminClient()
  if (!supabase) return null

  const storeId = await getActiveStoreId()
  if (!storeId) return null

  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const yStr = yesterday.toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('daily_sales_summary')
    .select('*')
    .eq('store_id', storeId)
    .eq('sales_date', yStr)
    .single()

  if (error || !data) return null
  return data as TodaySummary
}

export async function getTodayMenuSales(): Promise<TodayMenuSale[]> {
  const supabase = getSupabaseAdminClient()
  if (!supabase) return []

  const storeId = await getActiveStoreId()
  if (!storeId) return []

  const { data, error } = await supabase
    .from('today_menu_sales')
    .select('*')
    .eq('store_id', storeId)
    .order('total_qty', { ascending: false })
    .limit(5)

  if (error) return []
  return (data ?? []) as TodayMenuSale[]
}

export async function getWeekdayPattern(): Promise<WeekdayPattern[]> {
  const supabase = getSupabaseAdminClient()
  if (!supabase) return []

  const storeId = await getActiveStoreId()
  if (!storeId) return []

  const { data, error } = await supabase
    .from('daily_sales_summary')
    .select('day_of_week, total_sales')
    .eq('store_id', storeId)

  if (error || !data?.length) return []

  const grouped = new Map<number, number[]>()
  for (const row of data) {
    const dow = Number(row.day_of_week)
    const bucket = grouped.get(dow) ?? []
    bucket.push(Number(row.total_sales))
    grouped.set(dow, bucket)
  }

  return Array.from(grouped.entries())
    .map(([day_of_week, sales]) => ({
      day_of_week,
      avg_sales: sales.reduce((a, b) => a + b, 0) / sales.length,
    }))
    .sort((a, b) => a.day_of_week - b.day_of_week)
}

export async function getMenuMargins(): Promise<{ name: string; cost_ratio: number }[]> {
  const supabase = getSupabaseAdminClient()
  if (!supabase) return []

  const storeId = await getActiveStoreId()
  if (!storeId) return []

  const { data: menus } = await supabase
    .from('menu_items')
    .select('id, name, sale_price, menu_type')
    .eq('store_id', storeId)
    .eq('is_active', true)
    .eq('menu_type', 'single')

  if (!menus?.length) return []

  const results: { name: string; cost_ratio: number }[] = []

  for (const menu of menus) {
    const { data: recipes } = await supabase
      .from('menu_recipes')
      .select('item_id, quantity, unit_conversion')
      .eq('menu_item_id', menu.id)

    if (!recipes?.length) continue

    let cost = 0
    for (const r of recipes) {
      const { data: stock } = await supabase
        .from('inventory_stocks')
        .select('avg_unit_cost')
        .eq('item_id', r.item_id)
        .single()

      cost += r.quantity * (r.unit_conversion ?? 1) * Number(stock?.avg_unit_cost ?? 0)
    }

    if (menu.sale_price > 0) {
      results.push({
        name: menu.name,
        cost_ratio: Math.round((cost / menu.sale_price) * 100),
      })
    }
  }

  return results.sort((a, b) => a.cost_ratio - b.cost_ratio).slice(0, 5)
}
