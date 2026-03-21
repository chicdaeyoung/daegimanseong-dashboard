import Link from "next/link";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { SectionCard } from "@/components/ui/SectionCard";
import { getMenuItemsWithRecipeCount } from "@/lib/recipes/queries";
import { RecipesTable } from "./recipes-table";

export default async function RecipesPage() {
  const menus = await getMenuItemsWithRecipeCount();

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
                  레시피 관리
                </h1>
                <p className="mt-1 text-xs text-slate-400 lg:text-sm">
                  메뉴별 사용 품목을 관리합니다. 매출 입력 시 재고가 자동 차감됩니다.
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
                  href="/recipes/new"
                  className="inline-flex items-center justify-center rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/30 hover:bg-emerald-400"
                >
                  레시피 등록
                </Link>
                <a
                  href="/recipes/set/new"
                  className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700"
                >
                  세트메뉴 등록
                </a>
              </div>
            </div>

            <SectionCard
              title="메뉴 목록"
              description="메뉴명, 코드, 카테고리, 판매가, 레시피 수. 레시피에서 라인 삭제, 비활성화 시 매출 선택에서 제외됩니다."
            >
              {menus.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-500">
                  등록된 메뉴가 없습니다. 레시피 등록 버튼으로 메뉴와 레시피를 추가하세요.
                </p>
              ) : (
                <RecipesTable menus={menus} />
              )}
            </SectionCard>
          </div>
        </main>
      </div>
    </div>
  );
}
