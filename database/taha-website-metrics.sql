create schema if not exists taha_metrics;
revoke all on schema taha_metrics from public, anon, authenticated;

create table taha_metrics.daily (
  day date not null,
  visitor uuid not null,
  last_seen timestamptz not null,
  last_view timestamptz,
  last_download timestamptz,
  last_pdf timestamptz,
  views integer not null default 0,
  downloads integer not null default 0,
  pdf_opens integer not null default 0,
  primary key (day,visitor)
);
alter table taha_metrics.daily enable row level security;
revoke all on taha_metrics.daily from public, anon, authenticated;
create index taha_metrics_recent on taha_metrics.daily (last_seen);

create function public.taha_record_visit(p_visitor uuid, p_event text)
returns void language plpgsql security definer set search_path = ''
as $$
declare
  observed_at timestamptz := now();
  observed_day date := (observed_at at time zone 'Asia/Baghdad')::date;
begin
  if p_visitor is null or p_event is null or p_event not in ('active','view','download','pdf') then return; end if;
  insert into taha_metrics.daily as d
    (day,visitor,last_seen,last_view,last_download,last_pdf,views,downloads,pdf_opens)
  values (observed_day,p_visitor,observed_at,
    case when p_event='view' then observed_at end,
    case when p_event='download' then observed_at end,
    case when p_event='pdf' then observed_at end,
    (p_event='view')::int,(p_event='download')::int,(p_event='pdf')::int)
  on conflict (day,visitor) do update set last_seen=greatest(d.last_seen,excluded.last_seen),
    views=d.views+((excluded.last_view is not null) and (d.last_view is null or excluded.last_view>d.last_view+interval '1 second'))::int,
    downloads=d.downloads+((excluded.last_download is not null) and (d.last_download is null or excluded.last_download>d.last_download+interval '1 second'))::int,
    pdf_opens=d.pdf_opens+((excluded.last_pdf is not null) and (d.last_pdf is null or excluded.last_pdf>d.last_pdf+interval '1 second'))::int,
    last_view=greatest(d.last_view,excluded.last_view),
    last_download=greatest(d.last_download,excluded.last_download),
    last_pdf=greatest(d.last_pdf,excluded.last_pdf);
end;
$$;
revoke all on function public.taha_record_visit(uuid,text) from public, authenticated;
grant execute on function public.taha_record_visit(uuid,text) to anon;

create function public.taha_owner_metrics(p_days integer default 7)
returns jsonb language plpgsql stable security definer set search_path = ''
as $$
declare
  today date := (now() at time zone 'Asia/Baghdad')::date;
  days integer := case when p_days in (1,7,30) then p_days else 7 end;
  result jsonb;
begin
  if auth.uid() is null or not exists (
     select 1 from auth.users u where u.id=auth.uid() and u.email_confirmed_at is not null
       and lower(u.email)='taha.20054.ta21@gmail.com' and u.banned_until is null
  ) then raise exception 'Access denied' using errcode='42501'; end if;
  select jsonb_build_object(
    'active',(select count(distinct visitor) from taha_metrics.daily where last_seen >= now()-interval '90 seconds'),
    'visitors',count(distinct visitor),'views',coalesce(sum(views),0),
    'downloads',coalesce(sum(downloads),0),'pdf_opens',coalesce(sum(pdf_opens),0),
    'daily',(select coalesce(jsonb_agg(to_jsonb(series) order by day),'[]'::jsonb) from (
      select today-n as day, count(d.visitor) as visitors, coalesce(sum(d.views),0) as views
      from generate_series(0,days-1) n left join taha_metrics.daily d on d.day=today-n group by today-n
    ) series)
  ) into result from taha_metrics.daily where day between today-days+1 and today;
  return result;
end;
$$;
revoke all on function public.taha_owner_metrics(integer) from public, anon;
grant execute on function public.taha_owner_metrics(integer) to authenticated;
