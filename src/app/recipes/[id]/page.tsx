import Link from "next/link";
import { notFound } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { SectionCard } from "@/components/ui/SectionCard";
import { getRecipeDetail } from "@/lib/recipes/queries";
import { formatCurrency } from "@/lib/inventory/utils";
import { RecipeLinesTable } from "./recipe-lines-table";

export default async function RecipeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { menu, recipes } = await getRecipeDetail(id);
  if (!menu) notFound();

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-50">
      <Sidebar />
      <div className="flex min-h-screen flex-1 flex-col">
        <Topbar />
        <main className="flex-1 px-4 py-4 pb-8 lg:px-8 lg:py-6">
          <div className="mx-auto max-w-4xl space-y-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h1 className="text-xl font-semibold tracking-tight text-slate-50 lg:text-2xl">
                  레시피: {menu.name}
                </h1>
                <p className="mt-1 text-xs text-slate-400 lg:text-sm">
                  {menu.code ?? "-"} · {formatCurrency(menu.sale_price)}
                </p>
              </div>
              <Link
                href="/recipes"
                className="text-sm font-medium text-emerald-400 hover:text-emerald-300"
              >
                ← 목록
              </Link>
            </div>

            <SectionCard
              title="레시피 품목"
              description="품목, 사용량, 단위. 삭제 시 해당 라인만 제거됩니다(메뉴는 유지)."
            >
              {recipes.length === 0 ? (
                <p className="py-4 text-center text-sm text-slate-500">
                  등록된 레시피 라인이 없습니다.
                </p>
              ) : (
                <RecipeLinesTable recipes={recipes} />
              )}
            </SectionCard>
          </div>
        </main>
      </div>
    </div>
  );
}
