export type StoreType = "franchise" | "direct";

export type Store = {
  id: string;
  name: string;
  type: StoreType;
  location: string;
};

export type Ingredient = {
  id: string;
  name: string;
  /**
   * Base unit for inventory storage and recipe calculation.
   * All inventory quantities must be stored in this unit.
   */
  unit: "g" | "ml" | "piece";
  costPerUnit: number;
  lowStockThreshold: number;
};

export type InboundUnit = "BOX" | "KG" | "G" | "L" | "ML" | "EA";

/**
 * Unit conversion rule for inbound registration.
 * multiplierToBase means: 1 inboundUnit = multiplierToBase * baseUnit
 * Example: base unit g, inbound KG => multiplierToBase = 1000
 * Example: base unit piece, inbound BOX => multiplierToBase = 100 (1 BOX = 100 EA)
 */
export type UnitConversionRule = {
  id: string;
  ingredientId: string;
  inboundUnit: InboundUnit;
  multiplierToBase: number;
};

export type InventoryInbound = {
  id: string;
  storeId: string;
  ingredientId: string;
  inboundAt: string;
  inboundUnit: InboundUnit;
  quantity: number;
  purchasePricePerUnit: number;
  supplier?: string;
};

export type InventoryItem = {
  id: string;
  storeId: string;
  ingredientId: string;
  quantity: number;
};

export type MenuCategory = "single" | "set";

export type Menu = {
  id: string;
  name: string;
  category: MenuCategory;
  price: number;
};

export type RecipeRow = {
  id: string;
  menuId: string;
  ingredientId: string;
  quantity: number;
};

export type SetMenuComponent = {
  id: string;
  setMenuId: string;
  menuId: string;
  quantity: number;
};

export type SaleLine = {
  id: string;
  saleId: string;
  menuId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
};

export type Sale = {
  id: string;
  storeId: string;
  soldAt: string;
  totalAmount: number;
  foodCost: number;
  grossProfit: number;
};

export type ReceiptUpload = {
  id: string;
  storeId: string;
  uploadedAt: string;
  imageUrl: string;
  status: "pending" | "parsed" | "failed";
  rawText?: string;
};

export type ParsedSalesDraft = {
  id: string;
  receiptUploadId: string;
  storeId: string;
  draftDate: string;
  lines: {
    id: string;
    menuName: string;
    quantity: number;
    unitPrice?: number;
    totalPrice?: number;
    matchedMenuId?: string;
  }[];
  status: "draft" | "confirmed" | "discarded";
};

