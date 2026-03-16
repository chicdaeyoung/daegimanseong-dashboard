import {
  Ingredient,
  InboundUnit,
  InventoryItem,
  InventoryInbound,
  Menu,
  RecipeRow,
  Sale,
  SaleLine,
  SetMenuComponent,
  Store,
  UnitConversionRule,
} from "./domain";

export const stores: Store[] = [
  {
    id: "store-1",
    name: "서울대입구 직영점",
    type: "direct",
    location: "서울 관악구",
  },
];

export const ingredients: Ingredient[] = [
  {
    id: "ing-noodle",
    name: "중화면",
    unit: "g",
    costPerUnit: 0.01,
    lowStockThreshold: 2000,
  },
  {
    id: "ing-black-bean-sauce",
    name: "춘장 소스",
    unit: "g",
    costPerUnit: 0.03,
    lowStockThreshold: 1500,
  },
  {
    id: "ing-spicy-broth",
    name: "짬뽕 육수",
    unit: "ml",
    costPerUnit: 0.015,
    lowStockThreshold: 4000,
  },
  {
    id: "ing-rice",
    name: "밥",
    unit: "g",
    costPerUnit: 0.004,
    lowStockThreshold: 3000,
  },
  {
    id: "ing-pork",
    name: "탕수육 돼지고기",
    unit: "g",
    costPerUnit: 0.018,
    lowStockThreshold: 4000,
  },
  {
    id: "ing-mandu",
    name: "군만두",
    unit: "piece",
    costPerUnit: 120,
    lowStockThreshold: 40,
  },
  {
    id: "ing-veg-mix",
    name: "야채 믹스",
    unit: "g",
    costPerUnit: 0.008,
    lowStockThreshold: 2000,
  },
];

/** Allowed inbound units per ingredient (converted into base unit for storage). */
export const unitConversions: UnitConversionRule[] = [
  // 중화면 (g base): 1KG = 1000g, 1BOX = 6KG
  {
    id: "ucr-noodle-kg",
    ingredientId: "ing-noodle",
    inboundUnit: "KG",
    multiplierToBase: 1000,
  },
  {
    id: "ucr-noodle-box",
    ingredientId: "ing-noodle",
    inboundUnit: "BOX",
    multiplierToBase: 6000,
  },
  {
    id: "ucr-noodle-g",
    ingredientId: "ing-noodle",
    inboundUnit: "G",
    multiplierToBase: 1,
  },

  // 춘장 소스 (g base)
  {
    id: "ucr-sauce-kg",
    ingredientId: "ing-black-bean-sauce",
    inboundUnit: "KG",
    multiplierToBase: 1000,
  },
  {
    id: "ucr-sauce-g",
    ingredientId: "ing-black-bean-sauce",
    inboundUnit: "G",
    multiplierToBase: 1,
  },

  // 짬뽕 육수 (ml base): 1L = 1000ml
  {
    id: "ucr-broth-l",
    ingredientId: "ing-spicy-broth",
    inboundUnit: "L",
    multiplierToBase: 1000,
  },
  {
    id: "ucr-broth-ml",
    ingredientId: "ing-spicy-broth",
    inboundUnit: "ML",
    multiplierToBase: 1,
  },

  // 밥, 돼지고기, 야채 (g base)
  {
    id: "ucr-rice-kg",
    ingredientId: "ing-rice",
    inboundUnit: "KG",
    multiplierToBase: 1000,
  },
  {
    id: "ucr-rice-g",
    ingredientId: "ing-rice",
    inboundUnit: "G",
    multiplierToBase: 1,
  },
  {
    id: "ucr-pork-kg",
    ingredientId: "ing-pork",
    inboundUnit: "KG",
    multiplierToBase: 1000,
  },
  {
    id: "ucr-pork-g",
    ingredientId: "ing-pork",
    inboundUnit: "G",
    multiplierToBase: 1,
  },
  {
    id: "ucr-veg-kg",
    ingredientId: "ing-veg-mix",
    inboundUnit: "KG",
    multiplierToBase: 1000,
  },
  {
    id: "ucr-veg-g",
    ingredientId: "ing-veg-mix",
    inboundUnit: "G",
    multiplierToBase: 1,
  },

  // 군만두 (piece base): 1EA = 1 piece, 1BOX = 100EA
  {
    id: "ucr-mandu-ea",
    ingredientId: "ing-mandu",
    inboundUnit: "EA",
    multiplierToBase: 1,
  },
  {
    id: "ucr-mandu-box",
    ingredientId: "ing-mandu",
    inboundUnit: "BOX",
    multiplierToBase: 100,
  },
];

export const menus: Menu[] = [
  { id: "menu-jjajang", name: "짜장면", category: "single", price: 7000 },
  { id: "menu-jjamppong", name: "짬뽕", category: "single", price: 8000 },
  { id: "menu-fried-rice", name: "볶음밥", category: "single", price: 8000 },
  { id: "menu-tangsuyuk", name: "탕수육", category: "single", price: 16000 },
  { id: "menu-gunmandu", name: "군만두", category: "single", price: 6000 },
  {
    id: "menu-honbap-set",
    name: "혼밥 세트",
    category: "set",
    price: 13000,
  },
  {
    id: "menu-a-set",
    name: "A 세트",
    category: "set",
    price: 23000,
  },
];

export const recipes: RecipeRow[] = [
  {
    id: "rec-jjajang-noodle",
    menuId: "menu-jjajang",
    ingredientId: "ing-noodle",
    quantity: 180,
  },
  {
    id: "rec-jjajang-sauce",
    menuId: "menu-jjajang",
    ingredientId: "ing-black-bean-sauce",
    quantity: 120,
  },
  {
    id: "rec-jjajang-veg",
    menuId: "menu-jjajang",
    ingredientId: "ing-veg-mix",
    quantity: 60,
  },
  {
    id: "rec-jjamppong-noodle",
    menuId: "menu-jjamppong",
    ingredientId: "ing-noodle",
    quantity: 180,
  },
  {
    id: "rec-jjamppong-broth",
    menuId: "menu-jjamppong",
    ingredientId: "ing-spicy-broth",
    quantity: 350,
  },
  {
    id: "rec-jjamppong-veg",
    menuId: "menu-jjamppong",
    ingredientId: "ing-veg-mix",
    quantity: 80,
  },
  {
    id: "rec-fried-rice-rice",
    menuId: "menu-fried-rice",
    ingredientId: "ing-rice",
    quantity: 220,
  },
  {
    id: "rec-fried-rice-veg",
    menuId: "menu-fried-rice",
    ingredientId: "ing-veg-mix",
    quantity: 70,
  },
  {
    id: "rec-tangsuyuk-pork",
    menuId: "menu-tangsuyuk",
    ingredientId: "ing-pork",
    quantity: 280,
  },
  {
    id: "rec-tangsuyuk-veg",
    menuId: "menu-tangsuyuk",
    ingredientId: "ing-veg-mix",
    quantity: 60,
  },
  {
    id: "rec-gunmandu-mandu",
    menuId: "menu-gunmandu",
    ingredientId: "ing-mandu",
    quantity: 8,
  },
];

export const setMenuComponents: SetMenuComponent[] = [
  {
    id: "set-honbap-jjajang",
    setMenuId: "menu-honbap-set",
    menuId: "menu-jjajang",
    quantity: 1,
  },
  {
    id: "set-honbap-mini-tang",
    setMenuId: "menu-honbap-set",
    menuId: "menu-tangsuyuk",
    quantity: 0.5,
  },
  {
    id: "set-a-jjajang",
    setMenuId: "menu-a-set",
    menuId: "menu-jjajang",
    quantity: 1,
  },
  {
    id: "set-a-jjamppong",
    setMenuId: "menu-a-set",
    menuId: "menu-jjamppong",
    quantity: 1,
  },
  {
    id: "set-a-mini-tang",
    setMenuId: "menu-a-set",
    menuId: "menu-tangsuyuk",
    quantity: 0.7,
  },
];

export const initialInventory: InventoryItem[] = [
  {
    id: "inv-noodle",
    storeId: "store-1",
    ingredientId: "ing-noodle",
    quantity: 8000,
  },
  {
    id: "inv-black-bean",
    storeId: "store-1",
    ingredientId: "ing-black-bean-sauce",
    quantity: 5000,
  },
  {
    id: "inv-broth",
    storeId: "store-1",
    ingredientId: "ing-spicy-broth",
    quantity: 8000,
  },
  {
    id: "inv-rice",
    storeId: "store-1",
    ingredientId: "ing-rice",
    quantity: 7000,
  },
  {
    id: "inv-pork",
    storeId: "store-1",
    ingredientId: "ing-pork",
    quantity: 6000,
  },
  {
    id: "inv-mandu",
    storeId: "store-1",
    ingredientId: "ing-mandu",
    quantity: 90,
  },
  {
    id: "inv-veg",
    storeId: "store-1",
    ingredientId: "ing-veg-mix",
    quantity: 5000,
  },
];

/** Simulated physical count (actual stock). Some items slightly lower than theoretical to show loss. */
export const actualInventory: InventoryItem[] = [
  { id: "act-inv-noodle", storeId: "store-1", ingredientId: "ing-noodle", quantity: 5480 },
  { id: "act-inv-black-bean", storeId: "store-1", ingredientId: "ing-black-bean-sauce", quantity: 4340 },
  { id: "act-inv-broth", storeId: "store-1", ingredientId: "ing-spicy-broth", quantity: 6270 },
  { id: "act-inv-rice", storeId: "store-1", ingredientId: "ing-rice", quantity: 5890 },
  { id: "act-inv-pork", storeId: "store-1", ingredientId: "ing-pork", quantity: 4490 },
  { id: "act-inv-mandu", storeId: "store-1", ingredientId: "ing-mandu", quantity: 26 },
  { id: "act-inv-veg", storeId: "store-1", ingredientId: "ing-veg-mix", quantity: 4120 },
];

/** Example inbound transactions (used for weighted average cost demo). */
export const inboundTransactionsSeed: InventoryInbound[] = [
  {
    id: "inb-1",
    storeId: "store-1",
    ingredientId: "ing-noodle",
    inboundAt: isoDaysAgo(3),
    inboundUnit: "BOX",
    quantity: 1,
    purchasePricePerUnit: 42000,
    supplier: "대기식자재",
  },
  {
    id: "inb-2",
    storeId: "store-1",
    ingredientId: "ing-mandu",
    inboundAt: isoDaysAgo(2),
    inboundUnit: "BOX",
    quantity: 1,
    purchasePricePerUnit: 24000,
    supplier: "만두상회",
  },
  {
    id: "inb-3",
    storeId: "store-1",
    ingredientId: "ing-pork",
    inboundAt: isoDaysAgo(1),
    inboundUnit: "KG",
    quantity: 5,
    purchasePricePerUnit: 11000,
    supplier: "정육유통",
  },
];


// Helper for relative dates (used for analytics/inbound mock data)
function isoDaysAgo(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

// Simple 3-week history for analytics examples
export const salesHistory: Sale[] = [
  {
    id: "sale-d0",
    storeId: "store-1",
    soldAt: isoDaysAgo(0),
    totalAmount: 580000,
    foodCost: 190000,
    grossProfit: 390000,
  },
  {
    id: "sale-d1",
    storeId: "store-1",
    soldAt: isoDaysAgo(1),
    totalAmount: 520000,
    foodCost: 176000,
    grossProfit: 344000,
  },
  {
    id: "sale-d2",
    storeId: "store-1",
    soldAt: isoDaysAgo(2),
    totalAmount: 610000,
    foodCost: 206000,
    grossProfit: 404000,
  },
  {
    id: "sale-d3",
    storeId: "store-1",
    soldAt: isoDaysAgo(3),
    totalAmount: 470000,
    foodCost: 154000,
    grossProfit: 316000,
  },
  {
    id: "sale-d4",
    storeId: "store-1",
    soldAt: isoDaysAgo(4),
    totalAmount: 640000,
    foodCost: 214000,
    grossProfit: 426000,
  },
  {
    id: "sale-d5",
    storeId: "store-1",
    soldAt: isoDaysAgo(5),
    totalAmount: 690000,
    foodCost: 231000,
    grossProfit: 459000,
  },
  {
    id: "sale-d6",
    storeId: "store-1",
    soldAt: isoDaysAgo(6),
    totalAmount: 730000,
    foodCost: 248000,
    grossProfit: 482000,
  },
  {
    id: "sale-d7",
    storeId: "store-1",
    soldAt: isoDaysAgo(7),
    totalAmount: 510000,
    foodCost: 170000,
    grossProfit: 340000,
  },
  {
    id: "sale-d8",
    storeId: "store-1",
    soldAt: isoDaysAgo(8),
    totalAmount: 560000,
    foodCost: 184000,
    grossProfit: 376000,
  },
  {
    id: "sale-d9",
    storeId: "store-1",
    soldAt: isoDaysAgo(9),
    totalAmount: 600000,
    foodCost: 198000,
    grossProfit: 402000,
  },
  {
    id: "sale-d10",
    storeId: "store-1",
    soldAt: isoDaysAgo(10),
    totalAmount: 650000,
    foodCost: 214000,
    grossProfit: 436000,
  },
  {
    id: "sale-d11",
    storeId: "store-1",
    soldAt: isoDaysAgo(11),
    totalAmount: 620000,
    foodCost: 204000,
    grossProfit: 416000,
  },
  {
    id: "sale-d12",
    storeId: "store-1",
    soldAt: isoDaysAgo(12),
    totalAmount: 540000,
    foodCost: 178000,
    grossProfit: 362000,
  },
  {
    id: "sale-d13",
    storeId: "store-1",
    soldAt: isoDaysAgo(13),
    totalAmount: 700000,
    foodCost: 232000,
    grossProfit: 468000,
  },
  {
    id: "sale-d14",
    storeId: "store-1",
    soldAt: isoDaysAgo(14),
    totalAmount: 720000,
    foodCost: 240000,
    grossProfit: 480000,
  },
];

export const saleLinesHistory: SaleLine[] = [
  // Today (d0) - weekend-like pattern
  {
    id: "sl-d0-1",
    saleId: "sale-d0",
    menuId: "menu-jjajang",
    quantity: 22,
    unitPrice: 7000,
    totalPrice: 154000,
  },
  {
    id: "sl-d0-2",
    saleId: "sale-d0",
    menuId: "menu-jjamppong",
    quantity: 15,
    unitPrice: 8000,
    totalPrice: 120000,
  },
  {
    id: "sl-d0-3",
    saleId: "sale-d0",
    menuId: "menu-fried-rice",
    quantity: 10,
    unitPrice: 8000,
    totalPrice: 80000,
  },
  {
    id: "sl-d0-4",
    saleId: "sale-d0",
    menuId: "menu-tangsuyuk",
    quantity: 7,
    unitPrice: 16000,
    totalPrice: 112000,
  },
  {
    id: "sl-d0-5",
    saleId: "sale-d0",
    menuId: "menu-gunmandu",
    quantity: 8,
    unitPrice: 6000,
    totalPrice: 48000,
  },
  {
    id: "sl-d0-6",
    saleId: "sale-d0",
    menuId: "menu-honbap-set",
    quantity: 6,
    unitPrice: 13000,
    totalPrice: 78000,
  },
  {
    id: "sl-d0-7",
    saleId: "sale-d0",
    menuId: "menu-a-set",
    quantity: 4,
    unitPrice: 23000,
    totalPrice: 92000,
  },
  // Yesterday (d1)
  {
    id: "sl-d1-1",
    saleId: "sale-d1",
    menuId: "menu-jjajang",
    quantity: 18,
    unitPrice: 7000,
    totalPrice: 126000,
  },
  {
    id: "sl-d1-2",
    saleId: "sale-d1",
    menuId: "menu-jjamppong",
    quantity: 9,
    unitPrice: 8000,
    totalPrice: 72000,
  },
  {
    id: "sl-d1-3",
    saleId: "sale-d1",
    menuId: "menu-fried-rice",
    quantity: 7,
    unitPrice: 8000,
    totalPrice: 56000,
  },
  {
    id: "sl-d1-4",
    saleId: "sale-d1",
    menuId: "menu-tangsuyuk",
    quantity: 4,
    unitPrice: 16000,
    totalPrice: 64000,
  },
  {
    id: "sl-d1-5",
    saleId: "sale-d1",
    menuId: "menu-gunmandu",
    quantity: 5,
    unitPrice: 6000,
    totalPrice: 30000,
  },
  {
    id: "sl-d1-6",
    saleId: "sale-d1",
    menuId: "menu-honbap-set",
    quantity: 3,
    unitPrice: 13000,
    totalPrice: 39000,
  },
  {
    id: "sl-d1-7",
    saleId: "sale-d1",
    menuId: "menu-a-set",
    quantity: 2,
    unitPrice: 23000,
    totalPrice: 46000,
  },
];

// Today-only convenience exports for the main dashboard
export const todaySales: Sale[] = salesHistory.slice(0, 1);

export const todaySaleLines: SaleLine[] = saleLinesHistory.filter(
  (l) => l.saleId === "sale-d0",
);

