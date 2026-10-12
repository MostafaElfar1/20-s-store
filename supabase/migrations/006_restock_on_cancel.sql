-- Cancelling an order returns its items to stock, exactly once.
-- Safe to run more than once.
alter table public.orders add column if not exists stock_restored boolean not null default false;

create or replace function public.restore_stock_on_cancel() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'cancelled' and old.status <> 'cancelled' and not old.stock_restored then
    -- Atomic increment per product. Lines whose product was deleted (product_id is null) are skipped.
    update public.products p
       set stock_quantity = p.stock_quantity + i.quantity
      from public.order_items i
     where i.order_id = new.id and i.product_id = p.id;
    new.stock_restored := true;
  end if;
  return new;
end $$;

-- Name starts with "zz" so it fires AFTER the status-transition check (triggers run alphabetically).
-- If the transition is invalid, the whole update is rejected and no stock is touched.
drop trigger if exists orders_zz_restore_stock on public.orders;
create trigger orders_zz_restore_stock
  before update of status on public.orders
  for each row execute function public.restore_stock_on_cancel();
