import {
  Ingredient,
  InventoryItem,
  Menu,
  RecipeRow,
  SaleLine,
  InboundUnit,
  UnitConversionRule,
  SetMenuComponent,
} from "./domain";

export function expandSetMenus(
  lines: SaleLine[],
  menus: Menu[],
  setComponents: SetMenuComponent[],
): SaleLine[] {
  const menuById = new Map(menus.map((m) => [m.id, m]));
  const result: SaleLine[] = [];

  for (const line of lines) {
    const menu = menuById.get(line.menuId);
    if (!menu) continue;

    if (menu.category === "single") {
      result.push(line);
      continue;
    }

    const components = setComponents.filter(
      (c) => c.setMenuId === line.menuId,
    );
    for (const comp of components) {
      result.push({
        ...line,
        id: `${line.id}-${comp.menuId}`,
        menuId: comp.menuId,
        quantity: line.quantity * comp.quantity,
        totalPrice:
          ((line.totalPrice || line.unitPrice * line.quantity) *
            comp.quantity) /
          components.length,
      });
    }
  }

  return result;
}

export function computeIngredientUsage(
  lines: SaleLine[],
  menus: Menu[],
  recipes: RecipeRow[],
  setComponents: SetMenuComponent[],
): Map<string, number> {
  const singles = expandSetMenus(lines, menus, setComponents);
  const recipeByMenu = new Map<string, RecipeRow[]>();
  for (const row of recipes) {
    const bucket = recipeByMenu.get(row.menuId) ?? [];
    bucket.push(row);
    recipeByMenu.set(row.menuId, bucket);
  }

  const usage = new Map<string, number>();
  for (const line of singles) {
    const menuRecipes = recipeByMenu.get(line.menuId) ?? [];
    for (const r of menuRecipes) {
      const current = usage.get(r.ingredientId) ?? 0;
      usage.set(r.ingredientId, current + r.quantity * line.quantity);
    }
  }

  return usage;
}

export function applyInventoryConsumption(
  inventory: InventoryItem[],
  usage: Map<string, number>,
): InventoryItem[] {
  return inventory.map((inv) => {
    const consumed = usage.get(inv.ingredientId) ?? 0;
    return {
      ...inv,
      quantity: Math.max(0, inv.quantity - consumed),
    };
  });
}

export function detectLowStock(
  inventory: InventoryItem[],
  ingredients: Ingredient[],
): { ingredientId: string; remaining: number; threshold: number }[] {
  const ingById = new Map(ingredients.map((i) => [i.id, i]));
  const alerts: { ingredientId: string; remaining: number; threshold: number }[] =
    [];

  for (const inv of inventory) {
    const ing = ingById.get(inv.ingredientId);
    if (!ing) continue;
    if (inv.quantity <= ing.lowStockThreshold) {
      alerts.push({
        ingredientId: ing.id,
        remaining: inv.quantity,
        threshold: ing.lowStockThreshold,
      });
    }
  }

  return alerts;
}

export function sumMenuQuantities(lines: SaleLine[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const line of lines) {
    const current = map.get(line.menuId) ?? 0;
    map.set(line.menuId, current + line.quantity);
  }
  return map;
}

export function computeTotalsAndCost(params: {
  lines: SaleLine[];
  menus: Menu[];
  recipes: RecipeRow[];
  setComponents: SetMenuComponent[];
  ingredients: Ingredient[];
}) {
  const { lines, menus, recipes, setComponents, ingredients } = params;
  const expanded = expandSetMenus(lines, menus, setComponents);

  const totalSales = expanded.reduce(
    (sum, line) => sum + (line.totalPrice || line.unitPrice * line.quantity),
    0,
  );

  const usage = computeIngredientUsage(expanded, menus, recipes, setComponents);
  const ingredientById = new Map(ingredients.map((i) => [i.id, i]));

  let foodCost = 0;
  for (const [ingredientId, qty] of usage.entries()) {
    const ing = ingredientById.get(ingredientId);
    if (!ing) continue;
    foodCost += qty * ing.costPerUnit;
  }

  const grossProfit = totalSales - foodCost;
  const foodCostRatio = totalSales > 0 ? (foodCost / totalSales) * 100 : 0;

  return {
    totalSales,
    foodCost,
    grossProfit,
    foodCostRatio,
  };
}

export function getKoreanWeekdayIndex(date: Date): number {
  // 0=일, 1=월, ..., 6=토
  return date.getDay();
}

export function getInboundUnitLabel(unit: InboundUnit): string {
  switch (unit) {
    case "BOX":
      return "BOX";
    case "KG":
      return "KG";
    case "G":
      return "g";
    case "L":
      return "L";
    case "ML":
      return "ml";
    case "EA":
      return "EA";
  }
}

export function getMultiplierToBase(params: {
  ingredientId: string;
  inboundUnit: InboundUnit;
  conversions: UnitConversionRule[];
}): number | null {
  const { ingredientId, inboundUnit, conversions } = params;
  const match = conversions.find(
    (c) => c.ingredientId === ingredientId && c.inboundUnit === inboundUnit,
  );
  return match ? match.multiplierToBase : null;
}

export function computeWeightedAverageCost(params: {
  currentStockBase: number;
  currentAvgCostPerBase: number;
  inboundQuantityBase: number;
  inboundCostPerBase: number;
}) {
  const {
    currentStockBase,
    currentAvgCostPerBase,
    inboundQuantityBase,
    inboundCostPerBase,
  } = params;
  const newStock = currentStockBase + inboundQuantityBase;
  if (newStock <= 0) {
    return { newStock: 0, newAvgCostPerBase: currentAvgCostPerBase };
  }
  const totalValue =
    currentStockBase * currentAvgCostPerBase +
    inboundQuantityBase * inboundCostPerBase;
  return {
    newStock,
    newAvgCostPerBase: totalValue / newStock,
  };
}



