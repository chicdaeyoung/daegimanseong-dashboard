import Link from "next/link";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { getItemsForInventory, getSuppliers } from "@/lib/inventory/queries";
import { ReceiptCreateForm } from "./receipt-create-form";

export default async function NewReceiptPage() {
  const [suppliers, items] = await Promise.all([
    getSuppliers(),
    getItemsForInventory(),
  ]);

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
                  입고 등록
                </h1>
                <p className="mt-1 text-xs text-slate-400 lg:text-sm">
                  입고 전표를 등록하면 재고와 평균 단가가 자동 반영됩니다.
                </p>
              </div>
              <Link
                href="/inventory/receipts"
                className="text-sm font-medium text-emerald-400 hover:text-emerald-300"
              >
                ← 입고 목록
              </Link>
            </div>
            <ReceiptCreateForm suppliers={suppliers} items={items} />
          </div>
        </main>
      </div>
    </div>
  );
}
