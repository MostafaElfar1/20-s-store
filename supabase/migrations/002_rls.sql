create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.admins enable row level security;

-- Products: public reads active only; admins do everything
create policy "public read active products" on public.products
  for select using (is_active = true);
create policy "admin read all products" on public.products
  for select to authenticated using (public.is_admin());
create policy "admin insert products" on public.products
  for insert to authenticated with check (public.is_admin());
create policy "admin update products" on public.products
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin delete products" on public.products
  for delete to authenticated using (public.is_admin());

-- Orders: no public access at all. Creation goes through create_order() only.
create policy "admin read orders" on public.orders
  for select to authenticated using (public.is_admin());
create policy "admin update orders" on public.orders
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin read order items" on public.order_items
  for select to authenticated using (public.is_admin());

-- Admins table: a logged-in user can only see their own row; nobody can write from the client
create policy "read own admin row" on public.admins
  for select to authenticated using (user_id = auth.uid());

-- Lock down column-level order updates: admins may only change status
revoke update on public.orders from authenticated;
grant update (status) on public.orders to authenticated;
