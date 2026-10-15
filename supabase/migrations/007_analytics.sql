-- Visit + product-interaction tracking, readable only by admins.
-- (Vercel Analytics has no read API for this data, so the admin dashboard uses its own table.)

create table public.analytics_events (
  id bigint generated always as identity primary key,
  event_type text not null check (event_type in ('page_view', 'product_view', 'product_click', 'add_to_cart')),
  path text check (path is null or char_length(path) <= 300),
  product_id uuid references public.products(id) on delete set null,
  visitor_id text not null check (char_length(visitor_id) between 8 and 64),
  created_at timestamptz not null default now()
);
create index analytics_events_created_idx on public.analytics_events (created_at desc);
create index analytics_events_type_idx on public.analytics_events (event_type, created_at desc);
create index analytics_events_product_idx on public.analytics_events (product_id) where product_id is not null;

alter table public.analytics_events enable row level security;

-- Visitors can only INSERT events. Only admins can read them.
create policy "anyone can log events" on public.analytics_events
  for insert to anon, authenticated with check (true);
create policy "admin read events" on public.analytics_events
  for select to authenticated using (public.is_admin());

-- One call returns everything the dashboard needs. Days are bucketed in Cairo time.
create or replace function public.analytics_summary(p_days integer default 30)
returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  d integer := least(greatest(coalesce(p_days, 30), 1), 365);
  today date := (now() at time zone 'Africa/Cairo')::date;
  since timestamptz := ((today - (d - 1))::timestamp) at time zone 'Africa/Cairo';
begin
  if not public.is_admin() then
    raise exception 'not authorized';
  end if;

  return jsonb_build_object(
    'page_views',     (select count(*) from public.analytics_events where event_type = 'page_view' and created_at >= since),
    'visitors',       (select count(distinct visitor_id) from public.analytics_events where event_type = 'page_view' and created_at >= since),
    'product_clicks', (select count(*) from public.analytics_events where event_type = 'product_click' and created_at >= since),
    'add_to_cart',    (select count(*) from public.analytics_events where event_type = 'add_to_cart' and created_at >= since),
    'daily', (
      select coalesce(jsonb_agg(to_jsonb(x) order by x.day), '[]'::jsonb) from (
        select (today - (d - 1) + g.n) as day,
               count(e.id) filter (where e.event_type = 'page_view') as views,
               count(distinct e.visitor_id) filter (where e.event_type = 'page_view') as visitors
        from generate_series(0, d - 1) as g(n)
        left join public.analytics_events e
          on e.created_at >= since
         and (e.created_at at time zone 'Africa/Cairo')::date = (today - (d - 1) + g.n)
        group by g.n
      ) x
    ),
    'top_products', (
      select coalesce(jsonb_agg(to_jsonb(t) order by t.clicks desc, t.views desc), '[]'::jsonb) from (
        select p.id, p.name,
               count(*) filter (where e.event_type = 'product_click') as clicks,
               count(*) filter (where e.event_type = 'product_view') as views,
               count(*) filter (where e.event_type = 'add_to_cart') as carts
        from public.analytics_events e
        join public.products p on p.id = e.product_id
        where e.created_at >= since
        group by p.id, p.name
        order by clicks desc, views desc
        limit 10
      ) t
    )
  );
end $$;

revoke all on function public.analytics_summary(integer) from public, anon;
grant execute on function public.analytics_summary(integer) to authenticated;
