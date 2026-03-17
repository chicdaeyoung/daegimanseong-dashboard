import Link from "next/link";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { ItemCreateForm } from "./item-create-form";

export default function NewItemPage() {
  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-50">
      <Sidebar />
      <div className="flex min-h-screen flex-1 flex-col">
        <Topbar />
        <main className="flex-1 px-4 py-4 pb-8 lg:px-8 lg:py-6">
          <div className="mx-auto max-w-2xl space-y-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h1 className="text-xl font-semibold tracking-tight text-slate-50 lg:text-2xl">
                  품목 추가
                </h1>
                <p className="mt-1 text-xs text-slate-400 lg:text-sm">
                  입고 시 선택할 품목을 등록합니다.
                </p>
              </div>
              <Link
                href="/inventory/items"
                className="text-sm font-medium text-emerald-400 hover:text-emerald-300"
              >
                ← 목록
              </Link>
            </div>
            <ItemCreateForm />
          </div>
        </main>
      </div>
    </div>
  );
}
