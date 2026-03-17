-- Patch: Improve error messages in create_sales_entry_with_deduction
-- Run in Supabase SQL Editor

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
  insert into public.sales_entries (sales_date, memo, created_by)
  values (p_sales_date, p_memo, p_created_by)
  returning id into v_sales_entry_id;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_menu_item_id := (v_item->>'menu_item_id')::uuid;
    v_sold_qty := (v_item->>'quantity')::numeric;

    if v_sold_qty is null or v_sold_qty <= 0 then
      raise exception 'Invalid quantity for menu item %', v_menu_item_id;
    end if;

    select count(*) into v_recipe_count from public.menu_recipes where menu_item_id = v_menu_item_id;
    if v_recipe_count = 0 then
      select name into v_menu_name from public.menu_items where id = v_menu_item_id;
      raise exception '레시피 없음: "%" 메뉴에 레시피가 등록되어 있지 않습니다.', coalesce(v_menu_name, '알 수 없음');
    end if;

    insert into public.sales_entry_items (sales_entry_id, menu_item_id, quantity)
    values (v_sales_entry_id, v_menu_item_id, v_sold_qty);

    for v_recipe in
      select mr.item_id, mr.quantity, mr.unit, i.name as item_name
      from public.menu_recipes mr
      join public.items i on i.id = mr.item_id
      where mr.menu_item_id = v_menu_item_id
    loop
      v_required_qty := v_recipe.quantity * v_sold_qty;

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

      update public.inventory_stocks
      set current_qty = v_new_qty, updated_at = now()
      where item_id = v_recipe.item_id;

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
