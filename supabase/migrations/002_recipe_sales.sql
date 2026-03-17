-- Recipe-based menu and sales with automatic inventory deduction
-- Run in Supabase SQL Editor

-- 1) menu_items
create table if not exists public.menu_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text unique,
  category text,
  sale_price numeric(14,2) not null default 0,
  is_active boolean not null default true,
  memo text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_menu_items_code on public.menu_items(code);
create index if not exists idx_menu_items_is_active on public.menu_items(is_active);

-- 2) menu_recipes
create table if not exists public.menu_recipes (
  id uuid primary key default gen_random_uuid(),
  menu_item_id uuid not null references public.menu_items(id) on delete cascade,
  item_id uuid not null references public.items(id) on delete restrict,
  quantity numeric(14,3) not null check (quantity > 0),
  unit text not null,
  memo text,
  created_at timestamptz default now(),
  unique(menu_item_id, item_id)
);

create index if not exists idx_menu_recipes_menu_item_id on public.menu_recipes(menu_item_id);
create index if not exists idx_menu_recipes_item_id on public.menu_recipes(item_id);

-- 3) sales_entries
create table if not exists public.sales_entries (
  id uuid primary key default gen_random_uuid(),
  sales_date date not null,
  memo text,
  created_by text,
  created_at timestamptz default now()
);

create index if not exists idx_sales_entries_sales_date on public.sales_entries(sales_date desc);

-- 4) sales_entry_items
create table if not exists public.sales_entry_items (
  id uuid primary key default gen_random_uuid(),
  sales_entry_id uuid not null references public.sales_entries(id) on delete cascade,
  menu_item_id uuid not null references public.menu_items(id) on delete restrict,
  quantity numeric(14,3) not null check (quantity > 0),
  created_at timestamptz default now()
);

create index if not exists idx_sales_entry_items_sales_entry_id on public.sales_entry_items(sales_entry_id);
create index if not exists idx_sales_entry_items_menu_item_id on public.sales_entry_items(menu_item_id);

-- RPC: create_sales_entry_with_deduction
create or replace function public.create_sales_entry_with_deduction(
  p_sales_date date,
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
  v_sales_entry_id uuid;
  v_item jsonb;
  v_menu_item_id uuid;
  v_menu_name text;
  v_sold_qty numeric(14,3);
  v_recipe record;
  v_required_qty numeric(14,3);
  v_current_qty numeric(14,3);
  v_avg_cost numeric(14,4);
  v_new_qty numeric(14,3);
  v_recipe_count int;
begin
  -- 1. Create sales_entries row
  insert into public.sales_entries (sales_date, memo, created_by)
  values (p_sales_date, p_memo, p_created_by)
  returning id into v_sales_entry_id;

  -- 2. Create sales_entry_items and deduct inventory
  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_menu_item_id := (v_item->>'menu_item_id')::uuid;
    v_sold_qty := (v_item->>'quantity')::numeric;

    if v_sold_qty is null or v_sold_qty <= 0 then
      raise exception 'Invalid quantity for menu item %', v_menu_item_id;
    end if;

    -- Recipe-less menu: must have at least one recipe
    select count(*) into v_recipe_count from public.menu_recipes where menu_item_id = v_menu_item_id;
    if v_recipe_count = 0 then
      select name into v_menu_name from public.menu_items where id = v_menu_item_id;
      raise exception '레시피 없음: "%" 메뉴에 레시피가 등록되어 있지 않습니다.', coalesce(v_menu_name, '알 수 없음');
    end if;

    insert into public.sales_entry_items (sales_entry_id, menu_item_id, quantity)
    values (v_sales_entry_id, v_menu_item_id, v_sold_qty);

    -- 3. For each recipe line, deduct inventory
    for v_recipe in
      select mr.item_id, mr.quantity, mr.unit, i.name as item_name
      from public.menu_recipes mr
      join public.items i on i.id = mr.item_id
      where mr.menu_item_id = v_menu_item_id
    loop
      v_required_qty := v_recipe.quantity * v_sold_qty;

      -- 4. Check inventory_stocks
      select coalesce(current_qty, 0), coalesce(avg_unit_cost, 0)
      into v_current_qty, v_avg_cost
      from public.inventory_stocks
      where item_id = v_recipe.item_id;

      if v_current_qty is null then
        raise exception '재고 부족: "%" 품목에 재고 기록이 없습니다.', coalesce(v_recipe.item_name, '알 수 없음');
      end if;

      if v_current_qty < v_required_qty then
        raise exception '재고 부족: %, 필요수량=%, 현재고=%',
          coalesce(v_recipe.item_name, '알 수 없음'), v_required_qty, v_current_qty;
      end if;

      v_new_qty := v_current_qty - v_required_qty;

      -- 5. Update inventory_stocks
      update public.inventory_stocks
      set current_qty = v_new_qty, updated_at = now()
      where item_id = v_recipe.item_id;

      -- 6. Insert inventory_transactions (outbound)
      insert into public.inventory_transactions (
        item_id, tx_type, ref_type, ref_id, tx_date,
        qty_change, unit_cost, balance_qty, memo
      ) values (
        v_recipe.item_id,
        'outbound',
        'sales_entry',
        v_sales_entry_id,
        coalesce(p_sales_date::timestamptz + time '00:00:00', now()),
        -v_required_qty,
        v_avg_cost,
        v_new_qty,
        'Sales deduction'
      );
    end loop;
  end loop;

  return v_sales_entry_id;
end;
$$;
