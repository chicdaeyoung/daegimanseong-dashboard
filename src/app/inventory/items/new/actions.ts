"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createItem } from "@/lib/inventory/mutations";

export async function createItemAction(formData: FormData) {
  const name = formData.get("name");
  if (!name || typeof name !== "string" || !name.trim()) {
    return { error: "품목명을 입력해 주세요." };
  }

  const base_unit = formData.get("base_unit");
  const unit = base_unit && typeof base_unit === "string" ? base_unit : "ea";

  try {
    await createItem({
      name: name.trim(),
      code: formData.get("code")
        ? String(formData.get("code")).trim() || null
        : null,
      base_unit: unit,
      spec: formData.get("spec")
        ? String(formData.get("spec")).trim() || null
        : null,
      memo: formData.get("memo")
        ? String(formData.get("memo")).trim() || null
        : null,
    });
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "품목 등록에 실패했습니다.",
    };
  }

  revalidatePath("/inventory/items");
  revalidatePath("/inventory");
  revalidatePath("/inventory/receipts/new");
  redirect("/inventory/items");
}
