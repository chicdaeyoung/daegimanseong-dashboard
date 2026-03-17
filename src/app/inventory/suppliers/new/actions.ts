"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSupplier } from "@/lib/inventory/mutations";

export async function createSupplierAction(formData: FormData) {
  const name = formData.get("name");
  if (!name || typeof name !== "string" || !name.trim()) {
    return { error: "공급처 이름을 입력해 주세요." };
  }

  try {
    await createSupplier({
      name: name.trim(),
      code: formData.get("code") ? String(formData.get("code")).trim() : null,
      contact_name: formData.get("contact_name")
        ? String(formData.get("contact_name")).trim()
        : null,
      phone: formData.get("phone")
        ? String(formData.get("phone")).trim()
        : null,
      email: formData.get("email")
        ? String(formData.get("email")).trim()
        : null,
      address: formData.get("address")
        ? String(formData.get("address")).trim()
        : null,
      business_number: formData.get("business_number")
        ? String(formData.get("business_number")).trim()
        : null,
      memo: formData.get("memo")
        ? String(formData.get("memo")).trim()
        : null,
      is_active: formData.get("is_active") !== "false",
    });
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "공급처 등록에 실패했습니다.",
    };
  }

  revalidatePath("/inventory/suppliers");
  revalidatePath("/inventory/receipts/new");
  redirect("/inventory/suppliers");
}
