import Link from "next/link";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { getMenuItemsForSales } from "@/lib/recipes/queries";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { SalesEntryForm } from "./sales-entry-form";

export default async function NewSalesEntryPage() {
  // 디버그
  const adminClient = getSupabaseAdminClient();
  console.log('adminClient:', adminClient ? 'OK' : 'NULL');
  console.log('SERVICE_ROLE_KEY exists:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
  console.log('SERVICE_ROLE_KEY length:', process.env.SUPABASE_SERVICE_ROLE_KEY?.length);

  const menuItems = await getMenuItemsForSales();
  console.log('menuItems count:', menuItems.length);

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-50">
      <Sidebar />
      <div className="flex min-h-screen flex-1 flex-col">
        <Topbar />
        <main className="flex-1 px-4 py-4 pb-8 lg:px-8 lg:py-6">
          <div className="mx-auto max-w-5xl space-y-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h1 className="text-xl font-semibold tracking-tight text-slate-50 lg:text-2xl">
                  매출 입력
                </h1>
                <p className="mt-1 text-xs text-slate-400 lg:text-sm">
                  판매 메뉴를 입력하면 레시피 기반으로 재고가 자동 차감됩니다.
                </p>
              </div>
              <Link
                href="/sales-input"
                className="text-sm font-medium text-emerald-400 hover:text-emerald-300"
              >
                ← 목록
              </Link>
            </div>
            <SalesEntryForm menuItems={menuItems} />
          </div>
        </main>
      </div>
    </div>
  );
}
