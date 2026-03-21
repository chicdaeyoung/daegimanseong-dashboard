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

const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토']

type WeekdayStat = {
  weekdayIndex: number
  label: string
  count: number
  total_sales: number
  food_cost: number
  gross_profit: number
  food_cost_ratio: number
}

function groupByWeekday(data: DailySalesSummary[]): WeekdayStat[] {
  const buckets: Record<number, { total_sales: number; food_cost: number; gross_profit: number; count: number }> = {}
  for (let i = 0; i < 7; i++) {
    buckets[i] = { total_sales: 0, food_cost: 0, gross_profit: 0, count: 0 }
  }
  for (const d of data) {
    const idx = Number(d.day_of_week)
    if (idx < 0 || idx > 6) continue
    buckets[idx].total_sales += Number(d.total_sales)
    buckets[idx].food_cost += Number(d.food_cost)
    buckets[idx].gross_profit += Number(d.gross_profit)
    buckets[idx].count += 1
  }
  return WEEKDAY_LABELS.map((label, idx) => ({
    weekdayIndex: idx,
    label,
    count: buckets[idx].count,
    total_sales: buckets[idx].total_sales,
    food_cost: buckets[idx].food_cost,
    gross_profit: buckets[idx].gross_profit,
    food_cost_ratio:
      buckets[idx].total_sales > 0
        ? (buckets[idx].food_cost / buckets[idx].total_sales) * 100
        : 0,
  }))
}

type Props = { data: DailySalesSummary[] }

export function WeekdayAnalysis({ data }: Props) {
  const weekdayStats = groupByWeekday(data)
  const totalSalesAll = weekdayStats.reduce((sum, d) => sum + d.total_sales, 0)
  const bestWeekday = [...weekdayStats].sort((a, b) => b.total_sales - a.total_sales)[0]

  if (data.length === 0) {
    return <div className="py-8 text-center text-sm text-slate-500">매출 데이터가 없습니다.</div>
  }

  return (
    <div className="space-y-4">
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard
          label="분석 기간 총 매출"
          value={formatCurrency(totalSalesAll)}
          subLabel="요일 분석에 사용된 전체 매출 합계"
          pill="Sales"
        />
        {bestWeekday && bestWeekday.count > 0 && (
          <KpiCard
            label="매출이 가장 높은 요일"
            value={`${bestWeekday.label}요일`}
            subLabel={formatCurrency(bestWeekday.total_sales)}
            pill="Top Weekday"
          />
        )}
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <SectionCard title="요일별 매출 및 원가율" description="요일별 누적 매출과 원가율 비교">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {weekdayStats.map((d) => (
                <div
                  key={d.weekdayIndex}
                  className="rounded-xl border border-slate-800 bg-slate-900/70 px-3 py-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-50">
                      {d.label}요일
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {d.count}일
                    </span>
                  </div>
                  {d.count > 0 ? (
                    <div className="mt-1 text-[11px] text-slate-400">
                      총 매출{' '}
                      <span className="text-slate-100">
                        {formatCurrency(d.total_sales)}
                      </span>
                      <br />
                      원가율{' '}
                      <span className="text-emerald-300">
                        {d.food_cost_ratio.toFixed(1)}%
                      </span>
                    </div>
                  ) : (
                    <div className="mt-1 text-[11px] text-slate-500">데이터 없음</div>
                  )}
                </div>
              ))}
            </div>
          </SectionCard>
        </div>

        <div className="space-y-4">
          <SectionCard title="요일별 원가율 비교" description="요일별 원가율 시각화">
            <div className="space-y-2">
              {weekdayStats.filter(d => d.count > 0).map((d) => (
                <div key={d.weekdayIndex} className="rounded-lg bg-slate-900/80 px-3 py-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-50">{d.label}요일</span>
                    <span
                      className={
                        d.food_cost_ratio > 35
                          ? 'text-red-300'
                          : d.food_cost_ratio > 30
                            ? 'text-amber-300'
                            : 'text-emerald-300'
                      }
                    >
                      {d.food_cost_ratio.toFixed(1)}%
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                    <div
                      className={`h-full rounded-full ${
                        d.food_cost_ratio > 35
                          ? 'bg-red-400'
                          : d.food_cost_ratio > 30
                            ? 'bg-amber-400'
                            : 'bg-emerald-400'
                      }`}
                      style={{ width: `${Math.min(100, d.food_cost_ratio * 2).toFixed(0)}%` }}
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
