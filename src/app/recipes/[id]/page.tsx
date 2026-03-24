import Link from "next/link";
import { notFound } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { SectionCard } from "@/components/ui/SectionCard";
import { getRecipeDetail } from "@/lib/recipes/queries";
import { formatCurrency } from "@/lib/inventory/utils";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { RecipeLinesTable } from "./recipe-lines-table";

export default async function RecipeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await getSupabaseServerClient();
  const [{ menu, recipes }, itemsResult] = await Promise.all([
    getRecipeDetail(id),
    supabase
      ? supabase
          .from("items")
          .select("id, name, base_unit, purchase_unit, unit_conversion")
          .eq("is_active", true)
          .order("name")
      : Promise.resolve({ data: [] }),
  ]);

  if (!menu) notFound();

  const availableItems = (itemsResult?.data ?? []).map(
    (item: {
      id: string;
      name: string;
      base_unit: string;
      purchase_unit: string | null;
      unit_conversion: number | null;
    }) => ({
      id: item.id,
      name: item.name,
      base_unit: item.base_unit,
      purchase_unit: item.purchase_unit ?? item.base_unit,
      unit_conversion: item.unit_conversion ?? 1,
    }),
  );

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
              description="품목, 사용량, 단위. 수정/삭제는 해당 라인에서 처리합니다."
            >
              <RecipeLinesTable
                recipes={recipes}
                menuItemId={id}
                availableItems={availableItems}
              />
            </SectionCard>
          </div>
        </main>
      </div>
    </div>
  );
}
