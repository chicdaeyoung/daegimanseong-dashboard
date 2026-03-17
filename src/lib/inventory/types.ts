export type Supplier = {
  id: string;
  name: string;
  code: string | null;
  contact_name: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  business_number: string | null;
  memo: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type Item = {
  id: string;
  name: string;
  code: string | null;
  category: string | null;
  base_unit: string;
  spec: string | null;
  is_active: boolean;
  memo: string | null;
  created_at: string;
  updated_at: string;
};

export type InventoryReceipt = {
  id: string;
  receipt_no: string;
  supplier_id: string | null;
  receipt_date: string;
  status: string;
  total_amount: number;
  vat_amount: number;
  memo: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  cancel_reason?: string | null;
  cancelled_at?: string | null;
};

export type InventoryReceiptItem = {
  id: string;
  receipt_id: string;
  item_id: string;
  quantity: number;
  unit: string;
  unit_price: number;
  supply_amount: number;
  vat_amount: number;
  total_amount: number;
  expiry_date: string | null;
  lot_no: string | null;
  memo: string | null;
  created_at: string;
};

export type InventoryStock = {
  item_id: string;
  current_qty: number;
  avg_unit_cost: number;
  last_inbound_at: string | null;
  updated_at: string;
};

export type ReceiptLineInput = {
  item_id: string;
  quantity: number;
  unit: string;
  supply_amount: number;
  vat_amount?: number;
  expiry_date?: string;
  lot_no?: string;
  memo?: string;
};

export type CreateReceiptInput = {
  supplier_id: string | null;
  receipt_date: string;
  memo?: string;
  created_by?: string;
  items: ReceiptLineInput[];
};

export type ReceiptWithSupplier = InventoryReceipt & {
  supplier?: Supplier | null;
};

export type ReceiptDetail = InventoryReceipt & {
  supplier?: Supplier | null;
  items: (InventoryReceiptItem & { item?: Item | null })[];
};

export type DashboardItem = Item & {
  stock: InventoryStock | null;
  stock_amount: number;
};
