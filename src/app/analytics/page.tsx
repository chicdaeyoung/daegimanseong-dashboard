import { Sidebar } from '@/components/layout/Sidebar'
import { Topbar } from '@/components/layout/Topbar'
import { getDailySalesSummary, getTopMenus } from '@/lib/analytics/queries'
import { AnalyticsDashboard } from '@/components/analytics/AnalyticsDashboard'

export default async function AnalyticsPage() {
  const [dailyData, topMenus] = await Promise.all([
    getDailySalesSummary(30),
    getTopMenus(14),
  ])

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-50">
      <Sidebar />
      <div className="flex min-h-screen flex-1 flex-col">
        <Topbar />
        <main className="flex-1 px-4 py-4 pb-8 lg:px-8 lg:py-6">
          <div className="mx-auto max-w-6xl">
            <AnalyticsDashboard dailyData={dailyData} topMenus={topMenus} />
          </div>
        </main>
      </div>
    </div>
  )
}
