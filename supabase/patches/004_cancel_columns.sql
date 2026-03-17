-- Add cancellation columns for transactional data (no hard delete)
-- Run in Supabase SQL Editor

alter table public.inventory_receipts
  add column if not exists cancel_reason text,
  add column if not exists cancelled_at timestamptz;

-- sales_entries: add status if missing (PostgreSQL 11+ supports if not exists for column)
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'sales_entries' and column_name = 'status'
  ) then
    alter table public.sales_entries add column status text not null default 'confirmed';
  end if;
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'sales_entries' and column_name = 'cancel_reason'
  ) then
    alter table public.sales_entries add column cancel_reason text;
  end if;
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'sales_entries' and column_name = 'cancelled_at'
  ) then
    alter table public.sales_entries add column cancelled_at timestamptz;
  end if;
end $$;
