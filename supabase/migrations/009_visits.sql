-- Visitor "supervisor" data: one row per visit (approximate area, device, source) + links from events.
-- No IP address and no exact location is stored.

create table public.visits (
  id uuid primary key,
  visitor_id text not null check (char_length(visitor_id) between 8 and 64),
  started_at timestamptz not null default now(),
  country text check (country is null or char_length(country) <= 8),
  region text check (region is null or char_length(region) <= 64),
  city text check (city is null or char_length(city) <= 100),
  timezone text check (timezone is null or char_length(timezone) <= 64),
  device text check (device is null or device in ('mobile', 'tablet', 'desktop')),
  os text check (os is null or char_length(os) <= 32),
  browser text check (browser is null or char_length(browser) <= 32),
  language text check (language is null or char_length(language) <= 16),
  source text check (source is null or char_length(source) <= 64),
  referrer_host text check (referrer_host is null or char_length(referrer_host) <= 100),
  utm_campaign text check (utm_campaign is null or char_length(utm_campaign) <= 100),
  landing_path text check (landing_path is null or char_length(landing_path) <= 300)
);
create index visits_started_idx on public.visits (started_at desc);
create index visits_visitor_idx on public.visits (visitor_id, started_at);

alter table public.visits enable row level security;
create policy "anyone can log a visit" on public.visits
  for insert to anon, authenticated with check (true);
create policy "admin read visits" on public.visits
  for select to authenticated using (public.is_admin());

-- Events can now belong to a visit, carry a short note (the order number) and include order_placed.
alter table public.analytics_events
  add column if not exists visit_id uuid,
  add column if not exists meta text check (meta is null or char_length(meta) <= 100);
alter table public.analytics_events drop constraint if exists analytics_events_event_type_check;
alter table public.analytics_events add constraint analytics_events_event_type_check
  check (event_type in ('page_view', 'product_view', 'product_click', 'add_to_cart', 'order_placed'));
create index if not exists analytics_events_visit_idx on public.analytics_events (visit_id) where visit_id is not null;

-- Summary numbers and breakdowns (days are Cairo time).
create or replace function public.supervisor_overview(p_days integer default 7)
returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  d integer := least(greatest(coalesce(p_days, 7), 1), 90);
  today date := (now() at time zone 'Africa/Cairo')::date;
  since timestamptz := ((today - (d - 1))::timestamp) at time zone 'Africa/Cairo';
begin
  if not public.is_admin() then
    raise exception 'not authorized';
  end if;

  return jsonb_build_object(
    'online', (select count(distinct visit_id) from public.analytics_events
               where visit_id is not null and created_at >= now() - interval '5 minutes'),
    'visits', (select count(*) from public.visits where started_at >= since),
    'visitors', (select count(distinct visitor_id) from public.visits where started_at >= since),
    'returning', (select count(*) from public.visits v
                  where v.started_at >= since
                    and exists (select 1 from public.visits o where o.visitor_id = v.visitor_id and o.started_at < v.started_at)),
    'funnel', jsonb_build_object(
      'visits', (select count(*) from public.visits where started_at >= since),
      'viewed', (select count(distinct visit_id) from public.analytics_events
                 where event_type in ('product_view', 'product_click') and visit_id is not null and created_at >= since),
      'carted', (select count(distinct visit_id) from public.analytics_events
                 where event_type = 'add_to_cart' and visit_id is not null and created_at >= since),
      'ordered', (select count(distinct visit_id) from public.analytics_events
                  where event_type = 'order_placed' and visit_id is not null and created_at >= since)
    ),
    'daily', (
      select coalesce(jsonb_agg(to_jsonb(x) order by x.day), '[]'::jsonb) from (
        select (today - (d - 1) + g.n) as day, count(v.id) as visits, count(distinct v.visitor_id) as visitors
        from generate_series(0, d - 1) as g(n)
        left join public.visits v
          on v.started_at >= since
         and (v.started_at at time zone 'Africa/Cairo')::date = (today - (d - 1) + g.n)
        group by g.n
      ) x
    ),
    'countries', (select coalesce(jsonb_agg(to_jsonb(x)), '[]'::jsonb) from (
      select coalesce(country, '??') as label, count(*) as n from public.visits where started_at >= since
      group by 1 order by n desc limit 8) x),
    'regions', (select coalesce(jsonb_agg(to_jsonb(x)), '[]'::jsonb) from (
      select region, country, count(*) as n from public.visits where started_at >= since and region is not null
      group by region, country order by n desc limit 8) x),
    'cities', (select coalesce(jsonb_agg(to_jsonb(x)), '[]'::jsonb) from (
      select coalesce(nullif(concat_ws(', ', city, country), ''), 'Unknown') as label, count(*) as n
      from public.visits where started_at >= since
      group by 1 order by n desc limit 8) x),
    'sources', (select coalesce(jsonb_agg(to_jsonb(x)), '[]'::jsonb) from (
      select coalesce(source, 'Direct') as label, count(*) as n from public.visits where started_at >= since
      group by 1 order by n desc limit 8) x),
    'devices', (select coalesce(jsonb_agg(to_jsonb(x)), '[]'::jsonb) from (
      select coalesce(device, 'unknown') as label, count(*) as n from public.visits where started_at >= since
      group by 1 order by n desc) x),
    'browsers', (select coalesce(jsonb_agg(to_jsonb(x)), '[]'::jsonb) from (
      select coalesce(browser, 'Other') as label, count(*) as n from public.visits where started_at >= since
      group by 1 order by n desc limit 8) x),
    'os', (select coalesce(jsonb_agg(to_jsonb(x)), '[]'::jsonb) from (
      select coalesce(os, 'Other') as label, count(*) as n from public.visits where started_at >= since
      group by 1 order by n desc limit 8) x),
    'languages', (select coalesce(jsonb_agg(to_jsonb(x)), '[]'::jsonb) from (
      select coalesce(nullif(lower(split_part(language, '-', 1)), ''), 'unknown') as label, count(*) as n
      from public.visits where started_at >= since
      group by 1 order by n desc limit 8) x)
  );
end $$;

-- Latest visits with what each visitor did.
create or replace function public.supervisor_recent_visits(p_limit integer default 100)
returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  n integer := least(greatest(coalesce(p_limit, 100), 1), 500);
begin
  if not public.is_admin() then
    raise exception 'not authorized';
  end if;

  return coalesce((
    select jsonb_agg(to_jsonb(r) order by r.started_at desc) from (
      select v.id, v.visitor_id, v.started_at, v.country, v.region, v.city, v.device, v.os, v.browser,
             v.language, v.source, v.referrer_host, v.landing_path,
             coalesce(max(e.created_at), v.started_at) as last_seen,
             count(*) filter (where e.event_type = 'page_view') as pages,
             count(*) filter (where e.event_type = 'product_view') as product_views,
             count(*) filter (where e.event_type = 'add_to_cart') as add_to_cart,
             array_remove(array_agg(distinct e.meta) filter (where e.event_type = 'order_placed'), null) as orders,
             (select e2.path from public.analytics_events e2
               where e2.visit_id = v.id and e2.event_type = 'page_view'
               order by e2.created_at desc limit 1) as last_path,
             exists (select 1 from public.visits o where o.visitor_id = v.visitor_id and o.started_at < v.started_at) as returning
      from public.visits v
      left join public.analytics_events e on e.visit_id = v.id
      group by v.id
      order by v.started_at desc
      limit n
    ) r
  ), '[]'::jsonb);
end $$;

-- Step by step: what one visit did.
create or replace function public.supervisor_visit_timeline(p_visit_id uuid)
returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_admin() then
    raise exception 'not authorized';
  end if;

  return coalesce((
    select jsonb_agg(to_jsonb(t) order by t.created_at) from (
      select e.created_at, e.event_type, e.path, e.meta, p.name as product
      from public.analytics_events e
      left join public.products p on p.id = e.product_id
      where e.visit_id = p_visit_id
    ) t
  ), '[]'::jsonb);
end $$;

revoke all on function public.supervisor_overview(integer) from public, anon;
revoke all on function public.supervisor_recent_visits(integer) from public, anon;
revoke all on function public.supervisor_visit_timeline(uuid) from public, anon;
grant execute on function public.supervisor_overview(integer) to authenticated;
grant execute on function public.supervisor_recent_visits(integer) to authenticated;
grant execute on function public.supervisor_visit_timeline(uuid) to authenticated;
