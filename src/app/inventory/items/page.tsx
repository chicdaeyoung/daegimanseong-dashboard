import Link from "next/link";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { SectionCard } from "@/components/ui/SectionCard";
import { getItemsList } from "@/lib/inventory/queries";
import { ItemsTable } from "./items-table";

export default async function ItemsPage() {
  const items = await getItemsList();

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
                  품목 관리
                </h1>
                <p className="mt-1 text-xs text-slate-400 lg:text-sm">
                  입고 시 선택할 품목 목록입니다. 품목을 먼저 등록한 후 입고를 등록하세요.
                </p>
              </div>
              <div className="flex gap-2">
                <Link
                  href="/inventory"
                  className="text-sm font-medium text-slate-400 hover:text-slate-200"
                >
                  재고 관리
                </Link>
                <Link
                  href="/inventory/items/new"
                  className="inline-flex items-center justify-center rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/30 hover:bg-emerald-400"
                >
                  품목 추가
                </Link>
              </div>
            </div>

            <SectionCard
              title="품목 목록"
              description="품목명, 코드, 기본 단위, 규격, 사용 여부. 비활성화 시 선택 목록에서 제외됩니다."
            >
              {items.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-500">
                  등록된 품목이 없습니다. 품목 추가 버튼으로 품목을 등록한 후 입고를 등록하세요.
                </p>
              ) : (
                <ItemsTable items={items} />
              )}
            </SectionCard>
          </div>
        </main>
      </div>
    </div>
  );
}
