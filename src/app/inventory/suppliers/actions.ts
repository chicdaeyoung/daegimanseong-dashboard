"use server";

import { revalidatePath } from "next/cache";
import { deactivateSupplier, deleteSupplier } from "@/lib/inventory/mutations";

export async function supplierDeactivateAction(supplierId: string) {
  if (!supplierId) return { error: "공급처가 없습니다." };
  try {
    await deactivateSupplier(supplierId);
    revalidatePath("/inventory/suppliers");
    revalidatePath("/inventory/receipts/new");
    return { ok: true };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "비활성화에 실패했습니다.",
    };
  }
}

export async function supplierDeleteAction(supplierId: string) {
  if (!supplierId) return { error: "공급처가 없습니다." };
  try {
    await deleteSupplier(supplierId);
    revalidatePath("/inventory/suppliers");
    return { ok: true };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "삭제에 실패했습니다.",
    };
  }
}
