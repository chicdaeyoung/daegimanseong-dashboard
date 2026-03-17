import Link from "next/link";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { SectionCard } from "@/components/ui/SectionCard";
import { getSalesEntryList } from "@/lib/sales/queries";
import { SalesEntriesTable } from "./sales-entries-table";

export default async function SalesInputPage() {
  const entries = await getSalesEntryList();

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-50">
      <Sidebar />
      <div className="flex min-h-screen flex-1 flex-col">
        <Topbar />
        <main className="flex-1 px-4 py-4 pb-8 lg:px-8 lg:py-6">
          <div className="mx-auto max-w-6xl space-y-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h1 className="text-xl font-semibold tracking-tight text-slate-50 lg:text-2xl">
                  매출 입력
                </h1>
                <p className="mt-1 text-xs text-slate-400 lg:text-sm">
                  매출 전표 목록. 레시피 기반 재고 차감이 적용됩니다.
                </p>
              </div>
              <div className="flex gap-2">
                <Link
                  href="/"
                  className="text-sm font-medium text-slate-400 hover:text-slate-200"
                >
                  대시보드
                </Link>
                <Link
                  href="/sales-input/new"
                  className="inline-flex items-center justify-center rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/30 hover:bg-emerald-400"
                >
                  매출 등록
                </Link>
              </div>
            </div>

            <SectionCard
              title="매출 전표 목록"
              description="매출일, 메모, 품목 수, 상태. 판매 취소 시 재고가 복원됩니다."
            >
              {entries.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-500">
                  등록된 매출 전표가 없습니다. 매출 등록 버튼으로 추가하세요.
                </p>
              ) : (
                <SalesEntriesTable entries={entries} />
              )}
            </SectionCard>
          </div>
        </main>
      </div>
    </div>
  );
}
