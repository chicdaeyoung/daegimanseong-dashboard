-- Patch: Receipt input centered on supply_amount instead of unit_price
-- Run in Supabase SQL Editor
-- Supports: quantity + supply_amount (user input) -> unit_price = supply_amount / quantity

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
