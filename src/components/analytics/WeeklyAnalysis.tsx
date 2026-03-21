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

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

type Props = { data: DailySalesSummary[] }

export function WeeklyAnalysis({ data }: Props) {
  const totals = data.reduce(
    (acc, d) => {
      acc.total_sales += Number(d.total_sales)
      acc.food_cost   += Number(d.food_cost)
      acc.gross_profit += Number(d.gross_profit)
      return acc
    },
    { total_sales: 0, food_cost: 0, gross_profit: 0 }
  )

  const avgFoodCostRatio =
    totals.total_sales > 0
      ? (totals.food_cost / totals.total_sales) * 100
      : 0

  const week1 = data.slice(0, 7)
  const week2 = data.slice(7, 14)
  const weeks = [week1, week2].filter(w => w.length > 0)

  if (data.length === 0) {
    return <div className="py-8 text-center text-sm text-slate-500">매출 데이터가 없습니다.</div>
  }

  return (
    <div className="space-y-4">
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard
          label="기간 총 매출"
          value={formatCurrency(totals.total_sales)}
          subLabel="최근 2주 매출 합계"
          pill="Sales"
        />
        <KpiCard
          label="기간 식재료 원가"
          value={formatCurrency(totals.food_cost)}
          subLabel="레시피 기준 산정"
          pill="Food Cost"
        />
        <KpiCard
          label="기간 매출 총이익"
          value={formatCurrency(totals.gross_profit)}
          subLabel="인건비·임대료 제외"
          pill="Gross Profit"
        />
        <KpiCard
          label="평균 원가율"
          value={`${avgFoodCostRatio.toFixed(1)}%`}
          subLabel="기간 내 일자별 원가율 평균"
          pill="Food Cost %"
        />
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <SectionCard
            title="일별 매출 현황"
            description="최근 2주 기준 일자별 매출, 원가율 요약"
          >
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {data.map((d) => {
                const date = new Date(d.sales_date)
                const label = `${date.getMonth() + 1}/${date.getDate()}`
                const weekday = WEEKDAYS[Number(d.day_of_week)]
                return (
                  <div
                    key={d.sales_date}
                    className="flex items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900/70 px-3 py-2"
                  >
                    <div>
                      <div className="text-sm font-medium text-slate-50">
                        {label} ({weekday})
                      </div>
                      <div className="mt-0.5 text-[11px] text-slate-400">
                        매출 {formatCurrency(Number(d.total_sales))} · 원가율{' '}
                        {Number(d.food_cost_ratio).toFixed(1)}%
                      </div>
                      <div className="mt-0.5 text-[11px] text-slate-400">
                        총이익:{' '}
                        <span className="text-emerald-300">
                          {formatCurrency(Number(d.gross_profit))}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </SectionCard>
        </div>

        <div className="space-y-4">
          <SectionCard
            title="주차별 요약"
            description="주차별 매출과 평균 원가율 비교"
          >
            <div className="space-y-2 text-xs">
              {weeks.map((w, idx) => {
                const sum = w.reduce(
                  (acc, d) => {
                    acc.total_sales += Number(d.total_sales)
                    acc.food_cost   += Number(d.food_cost)
                    return acc
                  },
                  { total_sales: 0, food_cost: 0 }
                )
                const ratio =
                  sum.total_sales > 0
                    ? (sum.food_cost / sum.total_sales) * 100
                    : 0
                return (
                  <div key={idx} className="rounded-lg bg-slate-900/80 px-3 py-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] font-medium text-slate-50">
                        최근 {idx + 1}주차
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {w.length}일 기준
                      </span>
                    </div>
                    <div className="mt-1 text-[11px] text-slate-400">
                      매출{' '}
                      <span className="text-slate-100">
                        {formatCurrency(sum.total_sales)}
                      </span>{' '}
                      · 평균 원가율{' '}
                      <span className="text-emerald-300">
                        {ratio.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  )
}
