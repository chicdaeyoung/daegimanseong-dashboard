"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createRecipe } from "@/lib/recipes/mutations";
import type { RecipeLineInput } from "@/lib/recipes/types";

export async function createRecipeAction(formData: FormData) {
  const name = formData.get("name");
  if (!name || typeof name !== "string" || !name.trim()) {
    return { error: "메뉴명을 입력해 주세요." };
  }

  let lines: RecipeLineInput[];
  try {
    const linesJson = formData.get("lines");
    if (!linesJson || typeof linesJson !== "string") {
      return { error: "레시피 라인이 없습니다. 최소 1개 품목을 입력해 주세요." };
    }
    lines = JSON.parse(linesJson) as RecipeLineInput[];
  } catch {
    return { error: "레시피 데이터 형식이 올바르지 않습니다." };
  }

  const validLines = lines.filter(
    (l) => l.item_id && Number(l.quantity) > 0 && l.unit,
  );
  if (validLines.length === 0) {
    return { error: "유효한 레시피 라인(품목, 사용량, 단위)을 입력해 주세요." };
  }

  try {
    await createRecipe({
      name: name.trim(),
      code: formData.get("code")
        ? String(formData.get("code")).trim() || null
        : null,
      category: formData.get("category")
        ? String(formData.get("category")).trim() || null
        : null,
      sale_price: Number(formData.get("sale_price")) || 0,
      memo: formData.get("memo")
        ? String(formData.get("memo")).trim() || null
        : null,
      lines: validLines,
    });
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "레시피 등록에 실패했습니다.",
    };
  }

  revalidatePath("/recipes");
  revalidatePath("/sales-input/new");
  redirect("/recipes");
}
