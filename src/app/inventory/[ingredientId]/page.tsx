import Link from "next/link";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { SectionCard } from "@/components/ui/SectionCard";
import { Accordion } from "@/components/ui/Accordion";
import { ingredients, unitConversions } from "@/lib/sampleData";
import { getSupabaseServerClient } from "@/lib/supabase/server";

type InboundRow = {
  id: string;
  inbound_at: string;
  supplier: string | null;
  inbound_unit: string;
  quantity: number;
  purchase_price_per_unit: number;
};

function formatCurrencyKRW(v: number) {
  return v.toLocaleString("ko-KR", {
    style: "currency",
    currency: "KRW",
    maximumFractionDigits: 0,
  });
}

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(key: string) {
  const [y, m] = key.split("-").map(Number);
  return `${y}년 ${m}월`;
}

export default async function InventoryIngredientDetailPage({
  params,
}: {
  params: Promise<{ ingredientId: string }>;
}) {
  const { ingredientId } = await params;

  const ingredient = ingredients.find((i) => i.id === ingredientId);
  const supabase = await getSupabaseServerClient();

  if (!ingredient) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-50">
        <div className="mx-auto max-w-3xl px-6 py-16">
          <h1 className="text-xl font-semibold">존재하지 않는 식자재입니다.</h1>
          <Link
            href="/inventory"
            className="mt-4 inline-block text-sm text-emerald-400"
          >
            ← 재고 관리로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  let inbounds: InboundRow[] = [];
  let currentStockBase: number | null = null;
  let avgCostPerBase: number | null = null;

  if (supabase) {
    const { data: inboundData, error: inboundErr } = await supabase
      .from("inventory_inbound")
      .select("id,inbound_at,supplier,inbound_unit,quantity,purchase_price_per_unit")
      .eq("ingredient_id", ingredientId)
      .order("inbound_at", { ascending: false });

    if (!inboundErr && inboundData) {
      inbounds = inboundData as InboundRow[];
    }

    // Optional: if you have inventories table, we read current stock from there.
    const { data: invData } = await supabase
      .from("inventories")
      .select("quantity")
      .eq("ingredient_id", ingredientId)
      .limit(1)
      .maybeSingle();
    if (invData?.quantity != null) currentStockBase = Number(invData.quantity);

    // Compute weighted avg cost per base unit from inbound rows + unit conversions.
    // If you store base-unit inbound in DB, replace this with a direct aggregate query.
    let totalQtyBase = 0;
    let totalValue = 0;
    for (const r of inbounds) {
      const conversion = unitConversions.find(
        (c) => c.ingredientId === ingredientId && c.inboundUnit === r.inbound_unit,
      );
      const mult = conversion?.multiplierToBase ?? null;
      if (!mult) continue;
      const qtyBase = r.quantity * mult;
      const costPerBase = r.purchase_price_per_unit / mult;
      totalQtyBase += qtyBase;
      totalValue += qtyBase * costPerBase;
    }
    avgCostPerBase = totalQtyBase > 0 ? totalValue / totalQtyBase : null;
  }

  const supplierList = Array.from(
    new Set(
      inbounds
        .map((r) => (r.supplier ?? "").trim())
        .filter((s) => s.length > 0),
    ),
  ).sort((a, b) => a.localeCompare(b, "ko-KR"));

  const grouped = new Map<string, InboundRow[]>();
  for (const r of inbounds) {
    const key = monthKey(new Date(r.inbound_at));
    const bucket = grouped.get(key) ?? [];
    bucket.push(r);
    grouped.set(key, bucket);
  }
  const monthKeys = [...grouped.keys()].sort((a, b) => (a < b ? 1 : -1)); // newest month first
  const currentMonth = monthKey(new Date());

  const accordionItems = monthKeys.map((key) => {
    const rows = grouped.get(key) ?? [];
    return {
      id: key,
      title: (
        <div className="flex items-center justify-between gap-3">
          <span>{monthLabel(key)}</span>
          <span className="text-xs text-slate-400">{rows.length}건</span>
        </div>
      ),
      defaultOpen: key === currentMonth,
      content: (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-950/40 text-[11px] uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-2 py-2">일자</th>
                <th className="px-2 py-2">공급처</th>
                <th className="px-2 py-2 text-right">수량</th>
                <th className="px-2 py-2">단위</th>
                <th className="px-2 py-2 text-right">단가</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {rows.map((r) => (
                <tr key={r.id} className="hover:bg-slate-800/30">
                  <td className="px-2 py-2 text-slate-200">
                    {new Date(r.inbound_at).toLocaleDateString("ko-KR")}
                  </td>
                  <td className="px-2 py-2 text-slate-200">
                    {r.supplier ?? "-"}
                  </td>
                  <td className="px-2 py-2 text-right text-slate-200">
                    {Number(r.quantity).toLocaleString()}
                  </td>
                  <td className="px-2 py-2 text-slate-400">{r.inbound_unit}</td>
                  <td className="px-2 py-2 text-right text-slate-200">
                    {formatCurrencyKRW(Number(r.purchase_price_per_unit))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ),
    };
  });

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
                  {ingredient.name}
                </h1>
                <p className="mt-1 text-xs text-slate-400 lg:text-sm">
                  식자재 상세(공급처/입고 이력/평균 단가)
                </p>
              </div>
              <Link
                href="/inventory"
                className="text-xs font-medium text-emerald-400 hover:text-emerald-300"
              >
                ← 재고 관리
              </Link>
            </div>

            {!supabase && (
              <SectionCard
                title="Supabase 연결 필요"
                description="`NEXT_PUBLIC_SUPABASE_URL`과 `NEXT_PUBLIC_SUPABASE_ANON_KEY`가 설정되어야 inventory_inbound 테이블에서 데이터를 가져올 수 있습니다."
              >
                <p className="text-sm text-slate-300">
                  현재는 Supabase 환경변수가 없어 상세 데이터를 표시할 수 없습니다.
                </p>
              </SectionCard>
            )}

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <div className="space-y-4 lg:col-span-1">
                <SectionCard
                  title="기본 정보"
                  description="현재 재고와 평균 단가(가중평균)를 표시합니다."
                >
                  <ul className="space-y-1.5 text-sm">
                    <li className="flex items-center justify-between">
                      <span className="text-slate-400">이름</span>
                      <span className="font-medium text-slate-100">
                        {ingredient.name}
                      </span>
                    </li>
                    <li className="flex items-center justify-between">
                      <span className="text-slate-400">현재 재고</span>
                      <span className="font-medium text-slate-100">
                        {currentStockBase == null
                          ? "-"
                          : `${Math.round(currentStockBase).toLocaleString()}${ingredient.unit}`}
                      </span>
                    </li>
                    <li className="flex items-center justify-between">
                      <span className="text-slate-400">평균 단가</span>
                      <span className="font-medium text-slate-100">
                        {avgCostPerBase == null
                          ? "-"
                          : `${avgCostPerBase.toLocaleString("ko-KR", {
                              maximumFractionDigits:
                                ingredient.unit === "piece" ? 0 : 4,
                            })}원/${ingredient.unit}`}
                      </span>
                    </li>
                  </ul>
                </SectionCard>

                <SectionCard
                  title="공급처"
                  description="해당 식자재의 입고 기록에 등장하는 공급처 목록입니다."
                >
                  {supplierList.length === 0 ? (
                    <p className="text-sm text-slate-400">공급처 기록이 없습니다.</p>
                  ) : (
                    <ul className="space-y-1 text-sm">
                      {supplierList.map((s) => (
                        <li
                          key={s}
                          className="rounded-lg bg-slate-900/60 px-2 py-1 text-slate-200"
                        >
                          {s}
                        </li>
                      ))}
                    </ul>
                  )}
                </SectionCard>
              </div>

              <div className="space-y-4 lg:col-span-2">
                <SectionCard
                  title="입고 이력 (월별)"
                  description="월별로 접어서 확인합니다. 이번 달이 기본으로 펼쳐집니다."
                >
                  {inbounds.length === 0 ? (
                    <p className="text-sm text-slate-400">
                      입고 이력이 없습니다.
                    </p>
                  ) : (
                    <Accordion items={accordionItems} />
                  )}
                </SectionCard>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

