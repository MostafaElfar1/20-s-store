-- p_items: [{"product_id":"<uuid>","quantity":2}, ...]
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
  v_qty integer;
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

  -- Lock rows in id order to avoid deadlocks between concurrent orders
  for v_item in
    select value from jsonb_array_elements(p_items) order by (value->>'product_id')
  loop
    v_qty := (v_item->>'quantity')::integer;
    if v_qty is null or v_qty < 1 or v_qty > 20 then raise exception 'INVALID_QUANTITY'; end if;

    select * into v_prod from products
      where id = (v_item->>'product_id')::uuid and is_active = true for update;
    if not found then raise exception 'PRODUCT_UNAVAILABLE:%', v_item->>'product_id'; end if;
    if v_prod.stock_quantity < v_qty then raise exception 'INSUFFICIENT_STOCK:%', v_prod.name; end if;

    update products set stock_quantity = stock_quantity - v_qty where id = v_prod.id;
    insert into order_items (order_id, product_id, product_name, unit_price, quantity, line_total)
      values (v_order_id, v_prod.id, v_prod.name, v_prod.price, v_qty, v_prod.price * v_qty);
    v_subtotal := v_subtotal + v_prod.price * v_qty;
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
