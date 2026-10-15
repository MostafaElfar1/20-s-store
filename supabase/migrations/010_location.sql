-- Optional, customer-approved location (rounded to ~100 m by the browser code) saved as an event.
alter table public.analytics_events drop constraint if exists analytics_events_event_type_check;
alter table public.analytics_events add constraint analytics_events_event_type_check
  check (event_type in ('page_view', 'product_view', 'product_click', 'add_to_cart', 'order_placed', 'location_shared'));

-- Same function as in 009, now also returning the shared location (if any).
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
             (select e3.meta from public.analytics_events e3
               where e3.visit_id = v.id and e3.event_type = 'location_shared'
               order by e3.created_at desc limit 1) as location,
             exists (select 1 from public.visits o where o.visitor_id = v.visitor_id and o.started_at < v.started_at) as returning
      from public.visits v
      left join public.analytics_events e on e.visit_id = v.id
      group by v.id
      order by v.started_at desc
      limit n
    ) r
  ), '[]'::jsonb);
end $$;

revoke all on function public.supervisor_recent_visits(integer) from public, anon;
grant execute on function public.supervisor_recent_visits(integer) to authenticated;
