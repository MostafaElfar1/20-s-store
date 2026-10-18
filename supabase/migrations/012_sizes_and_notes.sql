-- 012: bottle sizes (each with its own price and stock), perfume notes, and "when & where to use".
-- Safe to run once on top of 001-011. Existing products are converted automatically (see step 2).

-- 1) One row per bottle size of a product --------------------------------------------------------
create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  size_ml integer not null check (size_ml > 0 and size_ml <= 1000),
  price numeric(10,2) not null check (price >= 0),
  compare_at_price numeric(10,2) check (compare_at_price is null or compare_at_price > price),
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  created_at timestamptz not null default now(),
  unique (product_id, size_ml)
);
create index if not exists product_variants_product_idx on public.product_variants (product_id);

alter table public.product_variants enable row level security;
drop policy if exists "public read variants of active products" on public.product_variants;
create policy "public read variants of active products" on public.product_variants
  for select using (exists (select 1 from public.products p where p.id = product_variants.product_id and p.is_active = true));
drop policy if exists "admin read variants" on public.product_variants;
create policy "admin read variants" on public.product_variants
  for select to authenticated using (public.is_admin());
drop policy if exists "admin insert variants" on public.product_variants;
create policy "admin insert variants" on public.product_variants
  for insert to authenticated with check (public.is_admin());
drop policy if exists "admin update variants" on public.product_variants;
create policy "admin update variants" on public.product_variants
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admin delete variants" on public.product_variants;
create policy "admin delete variants" on public.product_variants
  for delete to authenticated using (public.is_admin());

-- Order lines remember which size was bought.
alter table public.order_items
  add column if not exists variant_id uuid references public.product_variants(id) on delete set null,
  add column if not exists size_ml integer;

-- 2) Convert the products you already have: one size each, with its current price and stock.
--    Products that had no volume are given 50 ml: open them in the admin and fix the size if needed.
insert into public.product_variants (product_id, size_ml, price, compare_at_price, stock_quantity)
select id, coalesce(volume_ml, 50), price, compare_at_price, stock_quantity from public.products
where true
on conflict (product_id, size_ml) do nothing;

-- 3) products.price / stock_quantity / volume_ml now follow the sizes automatically:
--    price = cheapest size ("from" price), stock_quantity = total of all sizes.
create or replace function public.sync_product_from_variants() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  pid uuid := coalesce(new.product_id, old.product_id);
  cheapest public.product_variants%rowtype;
  total integer;
begin
  select * into cheapest from public.product_variants
    where product_id = pid order by price asc, size_ml asc limit 1;
  if found then
    select coalesce(sum(stock_quantity), 0) into total from public.product_variants where product_id = pid;
    update public.products
       set price = cheapest.price, compare_at_price = cheapest.compare_at_price,
           stock_quantity = total, volume_ml = cheapest.size_ml
     where id = pid;
  end if;
  return null;
end $$;

drop trigger if exists product_variants_sync on public.product_variants;
create trigger product_variants_sync
  after insert or update or delete on public.product_variants
  for each row execute function public.sync_product_from_variants();

-- 4) Notes (top / heart / base), occasions ("when & where") and an optional usage text.
alter table public.products
  add column if not exists notes_top text[] not null default '{}',
  add column if not exists notes_heart text[] not null default '{}',
  add column if not exists notes_base text[] not null default '{}',
  add column if not exists occasions text[] not null default '{}',
  add column if not exists usage text,
  add column if not exists usage_ar text;
alter table public.products drop constraint if exists products_notes_limits;
alter table public.products add constraint products_notes_limits check (
  cardinality(notes_top) <= 12 and cardinality(notes_heart) <= 12 and cardinality(notes_base) <= 12 and cardinality(occasions) <= 12
);

-- 5) Admin saves all sizes of a product in ONE atomic call (adds, updates and removes the unticked ones).
create or replace function public.admin_set_variants(p_product_id uuid, p_variants jsonb) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'not authorized'; end if;
  if jsonb_typeof(p_variants) <> 'array' or jsonb_array_length(p_variants) = 0 then
    raise exception 'Tick at least one size.';
  end if;
  -- Lock the product first (same order as create_order), so saving and ordering cannot deadlock.
  perform 1 from public.products where id = p_product_id for update;
  if not found then raise exception 'Product not found.'; end if;

  delete from public.product_variants
   where product_id = p_product_id
     and size_ml not in (select (value->>'size_ml')::integer from jsonb_array_elements(p_variants));

  insert into public.product_variants (product_id, size_ml, price, compare_at_price, stock_quantity)
  select p_product_id, (value->>'size_ml')::integer, (value->>'price')::numeric,
         nullif(value->>'compare_at_price', '')::numeric, (value->>'stock_quantity')::integer
    from jsonb_array_elements(p_variants)
   where true
  on conflict (product_id, size_ml) do update
     set price = excluded.price, compare_at_price = excluded.compare_at_price, stock_quantity = excluded.stock_quantity;
end $$;
revoke all on function public.admin_set_variants(uuid, jsonb) from public, anon;
grant execute on function public.admin_set_variants(uuid, jsonb) to authenticated;

-- 6) Ordering: p_items is now [{"product_id":"..","variant_id":"..","quantity":2}, ...]
--    (variant_id may be left out only for a product that has exactly one size).
create or replace function public.create_order(
  p_idempotency_key uuid,
  p_customer_name text,
  p_customer_phone text,
  p_customer_email text,
  p_governorate text,
  p_delivery_address text,
  p_notes text,
  p_items jsonb
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_existing orders%rowtype;
  v_order_id uuid := gen_random_uuid();
  v_number text;
  v_subtotal numeric(10,2) := 0;
  v_item jsonb;
  v_items jsonb;
  v_prod products%rowtype;
  v_var product_variants%rowtype;
  v_has_var boolean;
  v_count integer;
  v_qty integer;
  v_price numeric(10,2);
  v_name text;
  v_phone text := regexp_replace(coalesce(p_customer_phone,''), '[\s-]', '', 'g');
begin
  -- Idempotency: same key returns the same order
  select * into v_existing from orders where idempotency_key = p_idempotency_key;
  if found then
    select jsonb_agg(jsonb_build_object('name', product_name, 'unit_price', unit_price,
                                        'quantity', quantity, 'line_total', line_total))
      into v_items from order_items where order_id = v_existing.id;
    return jsonb_build_object('order_id', v_existing.id, 'order_number', v_existing.order_number,
      'subtotal', v_existing.subtotal, 'items', coalesce(v_items, '[]'::jsonb), 'duplicate', true);
  end if;

  if char_length(trim(coalesce(p_customer_name,''))) < 2 then raise exception 'INVALID_NAME'; end if;
  if v_phone !~ '^(\+20|0020|0)?1[0125][0-9]{8}$' then raise exception 'INVALID_PHONE'; end if;
  if char_length(trim(coalesce(p_governorate,''))) = 0 then raise exception 'INVALID_GOVERNORATE'; end if;
  if char_length(trim(coalesce(p_delivery_address,''))) < 8 then raise exception 'INVALID_ADDRESS'; end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 or jsonb_array_length(p_items) > 50
    then raise exception 'INVALID_ITEMS'; end if;

  v_number := '20S-' || nextval('order_number_seq');
  insert into orders (id, order_number, idempotency_key, customer_name, customer_phone, customer_email,
                      governorate, delivery_address, notes, subtotal, payment_method)
  values (v_order_id, v_number, p_idempotency_key, trim(p_customer_name), v_phone,
          nullif(trim(p_customer_email),''), trim(p_governorate), trim(p_delivery_address),
          nullif(trim(p_notes),''), 0, 'cash_on_delivery');

  -- Pass 1: lock the products of this order in id order. Everything that changes stock locks the product
  -- first and the sizes second, always in the same order, so two orders can never deadlock.
  for v_item in
    select value from jsonb_array_elements(p_items)
    order by (value->>'product_id'), coalesce(value->>'variant_id', '')
  loop
    perform 1 from products where id = (v_item->>'product_id')::uuid and is_active = true for update;
  end loop;

  -- Pass 2: check stock, take it, and record each line
  for v_item in
    select value from jsonb_array_elements(p_items)
    order by (value->>'product_id'), coalesce(value->>'variant_id', '')
  loop
    v_qty := (v_item->>'quantity')::integer;
    if v_qty is null or v_qty < 1 or v_qty > 20 then raise exception 'INVALID_QUANTITY'; end if;

    select * into v_prod from products
      where id = (v_item->>'product_id')::uuid and is_active = true;
    if not found then raise exception 'PRODUCT_UNAVAILABLE:%', v_item->>'product_id'; end if;

    v_has_var := false;
    if nullif(v_item->>'variant_id', '') is not null then
      select * into v_var from product_variants
        where id = (v_item->>'variant_id')::uuid and product_id = v_prod.id for update;
      if not found then raise exception 'PRODUCT_UNAVAILABLE:%', v_item->>'product_id'; end if;
      v_has_var := true;
    else
      select count(*) into v_count from product_variants where product_id = v_prod.id;
      if v_count = 1 then
        select * into v_var from product_variants where product_id = v_prod.id for update;
        v_has_var := true;
      elsif v_count > 1 then
        raise exception 'VARIANT_REQUIRED:%', v_prod.name;
      end if;
    end if;

    if v_has_var then
      v_name := v_prod.name || ' (' || v_var.size_ml || ' ml)';
      if v_var.stock_quantity < v_qty then raise exception 'INSUFFICIENT_STOCK:%', v_name; end if;
      v_price := v_var.price;
      update product_variants set stock_quantity = stock_quantity - v_qty where id = v_var.id;
      insert into order_items (order_id, product_id, variant_id, size_ml, product_name, unit_price, quantity, line_total)
        values (v_order_id, v_prod.id, v_var.id, v_var.size_ml, v_name, v_price, v_qty, v_price * v_qty);
    else
      v_name := v_prod.name;
      if v_prod.stock_quantity < v_qty then raise exception 'INSUFFICIENT_STOCK:%', v_name; end if;
      v_price := v_prod.price;
      update products set stock_quantity = stock_quantity - v_qty where id = v_prod.id;
      insert into order_items (order_id, product_id, product_name, unit_price, quantity, line_total)
        values (v_order_id, v_prod.id, v_name, v_price, v_qty, v_price * v_qty);
    end if;
    v_subtotal := v_subtotal + v_price * v_qty;
  end loop;

  update orders set subtotal = v_subtotal where id = v_order_id;
  select jsonb_agg(jsonb_build_object('name', product_name, 'unit_price', unit_price,
                                      'quantity', quantity, 'line_total', line_total))
    into v_items from order_items where order_id = v_order_id;
  return jsonb_build_object('order_id', v_order_id, 'order_number', v_number,
    'subtotal', v_subtotal, 'items', coalesce(v_items, '[]'::jsonb), 'duplicate', false);
end $$;

revoke all on function public.create_order from public;
grant execute on function public.create_order to anon, authenticated;

-- 7) Cancelling an order returns each size to its own stock (exactly once, as before).
create or replace function public.restore_stock_on_cancel() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'cancelled' and old.status <> 'cancelled' and not old.stock_restored then
    -- lines with a size: give the quantity back to that size
    update public.product_variants v
       set stock_quantity = v.stock_quantity + i.q
      from (select variant_id, sum(quantity) as q from public.order_items
             where order_id = new.id and variant_id is not null group by variant_id) i
     where v.id = i.variant_id;
    -- older lines without a size: only for products that still have no sizes
    update public.products p
       set stock_quantity = p.stock_quantity + i.q
      from (select product_id, sum(quantity) as q from public.order_items
             where order_id = new.id and variant_id is null and product_id is not null group by product_id) i
     where p.id = i.product_id
       and not exists (select 1 from public.product_variants pv where pv.product_id = p.id);
    new.stock_restored := true;
  end if;
  return new;
end $$;
