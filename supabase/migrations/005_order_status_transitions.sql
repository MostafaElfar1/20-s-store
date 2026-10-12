-- Enforces the allowed order status workflow inside the database (not only in the UI).
-- Cancelling does NOT restore stock; stock is adjusted manually from the Products page.
create or replace function public.enforce_order_status_transition() returns trigger
language plpgsql as $$
begin
  if new.status = old.status then return new; end if;
  if not (
    (old.status = 'pending'    and new.status in ('confirmed', 'cancelled')) or
    (old.status = 'confirmed'  and new.status in ('processing', 'cancelled')) or
    (old.status = 'processing' and new.status in ('shipped', 'cancelled')) or
    (old.status = 'shipped'    and new.status = 'delivered')
  ) then
    raise exception 'INVALID_STATUS_TRANSITION: % -> %', old.status, new.status;
  end if;
  return new;
end $$;

drop trigger if exists orders_status_transition on public.orders;
create trigger orders_status_transition
  before update of status on public.orders
  for each row execute function public.enforce_order_status_transition();
