-- Run this entire script in Supabase Dashboard → SQL Editor → New query
-- Fixes: "Could not find the table 'public.items' in the schema cache"

-- 1) suppliers
create table if not exists public.suppliers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text unique,
  contact_name text,
  phone text,
  email text,
  address text,
  business_number text,
  memo text,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_suppliers_code on public.suppliers(code);
create index if not exists idx_suppliers_is_active on public.suppliers(is_active);

-- 2) items
create table if not exists public.items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text unique,
  category text,
  base_unit text not null default 'ea',
  spec text,
  is_active boolean default true,
  memo text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_items_code on public.items(code);
create index if not exists idx_items_is_active on public.items(is_active);

-- 3) inventory_receipts
create table if not exists public.inventory_receipts (
  id uuid primary key default gen_random_uuid(),
  receipt_no text unique not null,
  supplier_id uuid references public.suppliers(id),
  receipt_date date not null,
  status text not null default 'confirmed',
  total_amount numeric(14,2) default 0,
  vat_amount numeric(14,2) default 0,
  memo text,
  created_by text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_inventory_receipts_receipt_no on public.inventory_receipts(receipt_no);
create index if not exists idx_inventory_receipts_supplier_id on public.inventory_receipts(supplier_id);
create index if not exists idx_inventory_receipts_receipt_date on public.inventory_receipts(receipt_date desc);

-- 4) inventory_receipt_items
create table if not exists public.inventory_receipt_items (
  id uuid primary key default gen_random_uuid(),
  receipt_id uuid not null references public.inventory_receipts(id) on delete cascade,
  item_id uuid not null references public.items(id),
  quantity numeric(14,3) not null,
  unit text not null,
  unit_price numeric(14,2) not null default 0,
  supply_amount numeric(14,2) not null default 0,
  vat_amount numeric(14,2) not null default 0,
  total_amount numeric(14,2) not null default 0,
  expiry_date date,
  lot_no text,
  memo text,
  created_at timestamptz default now()
);

create index if not exists idx_inventory_receipt_items_receipt_id on public.inventory_receipt_items(receipt_id);
create index if not exists idx_inventory_receipt_items_item_id on public.inventory_receipt_items(item_id);

-- 5) inventory_stocks
create table if not exists public.inventory_stocks (
  item_id uuid primary key references public.items(id) on delete cascade,
  current_qty numeric(14,3) not null default 0,
  avg_unit_cost numeric(14,4) not null default 0,
  last_inbound_at timestamptz,
  updated_at timestamptz default now()
);

-- 6) inventory_transactions
create table if not exists public.inventory_transactions (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.items(id),
  tx_type text not null,
  ref_type text not null,
  ref_id uuid,
  tx_date timestamptz not null default now(),
  qty_change numeric(14,3) not null,
  unit_cost numeric(14,4) not null default 0,
  balance_qty numeric(14,3),
  memo text,
  created_at timestamptz default now()
);

create index if not exists idx_inventory_transactions_item_id on public.inventory_transactions(item_id);
create index if not exists idx_inventory_transactions_tx_date on public.inventory_transactions(tx_date desc);
create index if not exists idx_inventory_transactions_ref on public.inventory_transactions(ref_type, ref_id);

-- RPC: create_inventory_receipt
create or replace function public.create_inventory_receipt(
  p_receipt_no text,
  p_supplier_id uuid,
  p_receipt_date date,
  p_memo text,
  p_created_by text,
  p_items jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_receipt_id uuid;
  v_item jsonb;
  v_total_amount numeric(14,2) := 0;
  v_vat_amount numeric(14,2) := 0;
  v_old_qty numeric(14,3);
  v_old_avg numeric(14,4);
  v_new_qty numeric(14,3);
  v_new_price numeric(14,4);
  v_balance_qty numeric(14,3);
  v_line_supply numeric(14,2);
  v_line_vat numeric(14,2);
  v_line_total numeric(14,2);
begin
  insert into public.inventory_receipts (receipt_no, supplier_id, receipt_date, memo, created_by, status)
  values (p_receipt_no, p_supplier_id, p_receipt_date, p_memo, p_created_by, 'confirmed')
  returning id into v_receipt_id;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_new_qty := (v_item->>'quantity')::numeric;
    v_line_supply := coalesce((v_item->>'supply_amount')::numeric, 0);
    v_line_vat := coalesce((v_item->>'vat_amount')::numeric, 0);
    v_line_total := coalesce((v_item->>'total_amount')::numeric, v_line_supply + v_line_vat);
    v_new_price := coalesce(
      (v_item->>'unit_price')::numeric,
      case when v_new_qty > 0 then v_line_supply / v_new_qty else 0 end
    );

    insert into public.inventory_receipt_items (
      receipt_id, item_id, quantity, unit, unit_price,
      supply_amount, vat_amount, total_amount,
      expiry_date, lot_no, memo
    ) values (
      v_receipt_id,
      (v_item->>'item_id')::uuid,
      v_new_qty,
      coalesce(v_item->>'unit', 'ea'),
      v_new_price,
      v_line_supply,
      v_line_vat,
      v_line_total,
      case when v_item->>'expiry_date' <> '' and v_item->>'expiry_date' is not null then (v_item->>'expiry_date')::date else null end,
      nullif(trim(v_item->>'lot_no'), ''),
      nullif(trim(v_item->>'memo'), '')
    );

    select coalesce(current_qty, 0), coalesce(avg_unit_cost, 0)
    into v_old_qty, v_old_avg
    from public.inventory_stocks
    where item_id = (v_item->>'item_id')::uuid;

    if v_old_qty is null then
      v_old_qty := 0;
      v_old_avg := 0;
    end if;

    v_balance_qty := v_old_qty + v_new_qty;

    insert into public.inventory_transactions (
      item_id, tx_type, ref_type, ref_id, tx_date, qty_change, unit_cost, balance_qty, memo
    ) values (
      (v_item->>'item_id')::uuid,
      'inbound',
      'receipt',
      v_receipt_id,
      coalesce(p_receipt_date::timestamptz + time '00:00:00', now()),
      v_new_qty,
      v_new_price,
      v_balance_qty,
      'Receipt ' || p_receipt_no
    );

    if v_balance_qty > 0 then
      update public.inventory_stocks
      set
        current_qty = v_balance_qty,
        avg_unit_cost = ((v_old_qty * v_old_avg) + (v_new_qty * v_new_price)) / v_balance_qty,
        last_inbound_at = now(),
        updated_at = now()
      where item_id = (v_item->>'item_id')::uuid;

      if not found then
        insert into public.inventory_stocks (item_id, current_qty, avg_unit_cost, last_inbound_at, updated_at)
        values (
          (v_item->>'item_id')::uuid,
          v_balance_qty,
          ((v_old_qty * v_old_avg) + (v_new_qty * v_new_price)) / v_balance_qty,
          now(),
          now()
        );
      end if;
    end if;

    v_total_amount := v_total_amount + v_line_total;
    v_vat_amount := v_vat_amount + v_line_vat;
  end loop;

  update public.inventory_receipts
  set total_amount = v_total_amount, vat_amount = v_vat_amount, updated_at = now()
  where id = v_receipt_id;

  return v_receipt_id;
end;
$$;
