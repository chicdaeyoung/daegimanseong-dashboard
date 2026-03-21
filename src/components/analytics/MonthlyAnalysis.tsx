'use client'

import { KpiCard } from '@/components/ui/KpiCard'
import { SectionCard } from '@/components/ui/SectionCard'
import type { DailySalesSummary } from '@/lib/analytics/queries'

function formatCurrency(value: number) {
  return value.toLocaleString('ko-KR', {
    style: 'currency',
    currency: 'KRW',
    maximumFractionDigits: 0,
  })
}

type MonthBucket = {
  key: string
  year: number
  month: number
  total_sales: number
  food_cost: number
  gross_profit: number
  food_cost_ratio: number
  day_count: number
}

function groupByMonth(data: DailySalesSummary[]): MonthBucket[] {
  const map = new Map<string, MonthBucket>()
  for (const d of data) {
    const date = new Date(d.sales_date)
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const key = `${year}-${String(month).padStart(2, '0')}`
    const existing = map.get(key) ?? {
      key,
      year,
      month,
      total_sales: 0,
      food_cost: 0,
      gross_profit: 0,
      food_cost_ratio: 0,
      day_count: 0,
    }
    existing.total_sales += Number(d.total_sales)
    existing.food_cost += Number(d.food_cost)
    existing.gross_profit += Number(d.gross_profit)
    existing.day_count += 1
    map.set(key, existing)
  }
  return [...map.values()]
    .map((b) => ({
      ...b,
      food_cost_ratio: b.total_sales > 0 ? (b.food_cost / b.total_sales) * 100 : 0,
    }))
    .sort((a, b) => b.year - a.year || b.month - a.month)
}

type Props = {
  data: DailySalesSummary[]
  topMenus: { menu_name: string; total_qty: number }[]
}

export function MonthlyAnalysis({ data, topMenus }: Props) {
  const monthlyBuckets = groupByMonth(data)
  const currentMonth = monthlyBuckets[0]

  if (data.length === 0) {
    return <div className="py-8 text-center text-sm text-slate-500">매출 데이터가 없습니다.</div>
  }

  return (
    <div className="space-y-4">
      {currentMonth && (
        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <KpiCard
            label="이번 달 매출"
            value={formatCurrency(currentMonth.total_sales)}
            subLabel={`${currentMonth.year}년 ${currentMonth.month}월 기준`}
            pill="Sales"
          />
          <KpiCard
            label="이번 달 식재료 원가"
            value={formatCurrency(currentMonth.food_cost)}
            subLabel="레시피 기준 산정"
            pill="Food Cost"
          />
          <KpiCard
            label="이번 달 매출 총이익"
            value={formatCurrency(currentMonth.gross_profit)}
            subLabel="인건비·임대료 제외"
            pill="Gross Profit"
          />
          <KpiCard
            label="이번 달 평균 원가율"
            value={`${currentMonth.food_cost_ratio.toFixed(1)}%`}
            subLabel="월간 기준 원가율"
            pill="Food Cost %"
          />
        </section>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <SectionCard title="월별 매출 추이" description="최근 월별 매출과 원가율 비교">
            <div className="space-y-2 text-xs">
              {monthlyBuckets.map((m) => (
                <div
                  key={m.key}
                  className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/70 px-3 py-2"
                >
                  <div>
                    <div className="text-sm font-medium text-slate-50">
                      {m.year}년 {m.month}월
                    </div>
                    <div className="mt-0.5 text-[11px] text-slate-400">
                      매출 {formatCurrency(m.total_sales)} · 원가율 {m.food_cost_ratio.toFixed(1)}%
                    </div>
                    <div className="mt-0.5 text-[11px] text-slate-400">
                      총이익:{' '}
                      <span className="text-emerald-300">
                        {formatCurrency(m.gross_profit)}
                      </span>
                      {' '}· {m.day_count}일 기준
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>

        <div className="space-y-4">
          <SectionCard
            title="최근 14일 베스트 메뉴"
            description="판매량 기준 상위 메뉴"
          >
            {topMenus.length > 0 ? (
              <div className="space-y-2 text-xs">
                {topMenus.map((item, idx) => (
                  <div
                    key={item.menu_name}
                    className="flex items-center justify-between rounded-lg bg-slate-900/80 px-3 py-1.5"
                  >
                    <div className="flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-800 text-[10px] text-slate-100">
                        {idx + 1}
                      </span>
                      <span className="text-[13px] text-slate-50">{item.menu_name}</span>
                    </div>
                    <span className="text-[11px] text-slate-400">
                      {item.total_qty.toLocaleString()} 그릇
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400">메뉴 데이터가 없습니다.</p>
            )}
          </SectionCard>

          <SectionCard
            title="월별 원가율 비교"
            description="월간 원가율 추이"
          >
            <div className="space-y-2 text-xs">
              {monthlyBuckets.map((m) => (
                <div key={m.key} className="rounded-lg bg-slate-900/80 px-3 py-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-medium text-slate-50">
                      {m.year}년 {m.month}월
                    </span>
                    <span
                      className={
                        m.food_cost_ratio > 35
                          ? 'text-red-300'
                          : m.food_cost_ratio > 30
                            ? 'text-amber-300'
                            : 'text-emerald-300'
                      }
                    >
                      {m.food_cost_ratio.toFixed(1)}%
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                    <div
                      className={`h-full rounded-full ${
                        m.food_cost_ratio > 35
                          ? 'bg-red-400'
                          : m.food_cost_ratio > 30
                            ? 'bg-amber-400'
                            : 'bg-emerald-400'
                      }`}
                      style={{ width: `${Math.min(100, m.food_cost_ratio * 2).toFixed(0)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  )
}
