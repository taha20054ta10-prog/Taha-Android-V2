-- Additive analytics; historical counters remain in their original tables.
alter table taha_metrics.file_events enable row level security;
alter table taha_metrics.traffic_sources enable row level security;
revoke all on all tables in schema taha_metrics from public, anon, authenticated;
create table taha_metrics.sessions_v2 (
 id uuid primary key, visitor uuid not null, started_at timestamptz not null default now(),
 last_seen timestamptz not null default now(), source text not null, medium text not null,
 campaign text not null, is_test boolean not null default false
);
create index sessions_v2_visitor on taha_metrics.sessions_v2(visitor,started_at);
create index sessions_v2_started on taha_metrics.sessions_v2(started_at);
alter table taha_metrics.sessions_v2 enable row level security;
create table taha_metrics.events_v2 (
 id uuid primary key, session_id uuid not null references taha_metrics.sessions_v2(id),
 occurred_at timestamptz not null default now(), kind text not null check(kind in ('view','pdf','download','section')),
 page text not null, title text not null, category text not null, grade text not null, subject text not null
);
create index events_v2_session on taha_metrics.events_v2(session_id);
create index events_v2_time on taha_metrics.events_v2(occurred_at);
alter table taha_metrics.events_v2 enable row level security;
revoke all on taha_metrics.sessions_v2,taha_metrics.events_v2 from public,anon,authenticated;
create function public.taha_record_event_v2(p_event uuid,p_session uuid,p_visitor uuid,p_kind text,
 p_page text,p_title text default '',p_category text default '',p_grade text default '',p_subject text default '',
 p_source text default 'unknown',p_medium text default '',p_campaign text default '',p_test boolean default false)
returns void language plpgsql security definer set search_path='' as $$
declare s taha_metrics.sessions_v2; src text; affected integer;
begin
 if p_event is null or p_session is null or p_visitor is null or p_kind is null or
 p_kind not in ('view','active','pdf','download','section') or p_page is null or
 p_page not like '/Taha-Android-V2/%' or length(p_page)>200 or p_page like '%?%' then return; end if;
 src:=case when p_source in ('google','facebook','instagram','telegram','tiktok','youtube','pinterest','bing','yahoo','search','referral','direct','unknown') then p_source else 'unknown' end;
 insert into taha_metrics.sessions_v2(id,visitor,source,medium,campaign,is_test)
 values(p_session,p_visitor,src,left(coalesce(p_medium,''),40),left(coalesce(p_campaign,''),100),coalesce(p_test,false)) on conflict do nothing;
 select * into s from taha_metrics.sessions_v2 where id=p_session for update;
 if s.visitor<>p_visitor or s.is_test<>coalesce(p_test,false) then return; end if;
 if p_kind='active' then
   if s.last_seen<now()-interval '30 minutes' then return; end if;
   update taha_metrics.sessions_v2 set last_seen=now() where id=p_session;
   if not s.is_test then perform public.taha_record_visit(p_visitor,'active'); end if; return;
 end if;
 -- A retry with the same event id cannot increase any counters.
 insert into taha_metrics.events_v2(id,session_id,kind,page,title,category,grade,subject)
 values(p_event,p_session,p_kind,p_page,left(coalesce(p_title,''),180),left(coalesce(p_category,''),40),left(coalesce(p_grade,''),80),left(coalesce(p_subject,''),80)) on conflict do nothing;
 get diagnostics affected=row_count;
 if affected=0 then return; end if;
 update taha_metrics.sessions_v2 set last_seen=now() where id=p_session;
 if not s.is_test and p_kind in ('view','pdf','download') then
   perform public.taha_record_visit(p_visitor,p_kind);
   if p_kind='view' then perform public.taha_record_source(p_visitor,case when src in ('bing','yahoo','search','referral','unknown') then 'other' else src end);
   else perform public.taha_record_file(p_visitor,p_kind,left(p_title,180),left(coalesce(nullif(p_category,''),'أخرى'),40)); end if;
 end if;
end $$;
revoke all on function public.taha_record_event_v2(uuid,uuid,uuid,text,text,text,text,text,text,text,text,text,boolean) from public,authenticated;
grant execute on function public.taha_record_event_v2(uuid,uuid,uuid,text,text,text,text,text,text,text,text,text,boolean) to anon;

create function public.taha_owner_report_v2(p_start date,p_end date,p_source text default '',p_page text default '',p_category text default '',p_test boolean default false)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare result jsonb; lo timestamptz; hi timestamptz;
begin
 if auth.uid() is null or not exists(select 1 from auth.users where id=auth.uid() and email_confirmed_at is not null and lower(email)='taha.20054.ta21@gmail.com' and banned_until is null) then raise exception 'Access denied' using errcode='42501'; end if;
 if p_start is null or p_end is null or p_end<p_start or p_end-p_start>366 then raise exception 'Invalid range'; end if;
 lo:=p_start::timestamp at time zone 'Asia/Baghdad'; hi:=(p_end+1)::timestamp at time zone 'Asia/Baghdad';
 with filtered as (
 select e.*,s.visitor,s.source,s.medium,s.campaign,s.started_at from taha_metrics.events_v2 e join taha_metrics.sessions_v2 s on s.id=e.session_id
 where s.is_test=p_test and e.occurred_at>=lo and e.occurred_at<hi
 and (coalesce(p_source,'')='' or s.source=p_source) and (coalesce(p_page,'')='' or e.page=p_page)
 and (coalesce(p_category,'')='' or e.category=p_category)
 ), firsts as (select visitor,min(started_at) first_at from taha_metrics.sessions_v2 where is_test=p_test group by visitor),
 summary as (select count(distinct f.visitor) visitors,count(distinct session_id) sessions,count(*) filter(where kind='view') views,
 count(*) filter(where kind='pdf') pdf_opens,count(*) filter(where kind='download') downloads,
 count(distinct f.visitor) filter(where first_at>=lo) new_visitors,count(distinct f.visitor) filter(where first_at<lo) returning_visitors
 from filtered f join firsts using(visitor)),
 sources as (select source,count(distinct visitor) visitors,count(distinct session_id) sessions,count(*) filter(where kind='view') views from filtered group by source),
 pages as (select page,max(title) filter(where kind='view') title,count(*) filter(where kind='view') views,count(distinct visitor) visitors from filtered group by page),
 files as (select title,category,grade,subject,count(*) filter(where kind='pdf') opens,count(*) filter(where kind='download') downloads,max(occurred_at) last_at from filtered where kind in ('pdf','download') group by title,category,grade,subject),
 campaigns as (select source,medium,campaign,count(distinct session_id) sessions,count(*) filter(where kind='view') views from filtered group by source,medium,campaign),
 apps as (select title,source,count(*) filter(where kind='section') views,count(*) filter(where kind='download') downloads from filtered where category='تطبيق أندرويد' group by title,source),
 daily as (select d::date as day,count(distinct f.visitor) visitors,count(distinct session_id) sessions,count(*) filter(where kind='view') views
 from generate_series(p_start::timestamp,p_end::timestamp,interval '1 day') d left join filtered f on (f.occurred_at at time zone 'Asia/Baghdad')::date=d::date group by d)
 select jsonb_build_object('summary',(select to_jsonb(summary) from summary),
 'active',(select count(distinct visitor) from taha_metrics.sessions_v2 where is_test=p_test and last_seen>=now()-interval '90 seconds' and (coalesce(p_source,'')='' or source=p_source)),
 'sources',coalesce((select jsonb_agg(to_jsonb(sources) order by sessions desc) from sources),'[]'),
 'pages',coalesce((select jsonb_agg(to_jsonb(pages) order by views desc) from pages),'[]'),
 'files',coalesce((select jsonb_agg(to_jsonb(files) order by opens+downloads desc) from files),'[]'),
 'campaigns',coalesce((select jsonb_agg(to_jsonb(campaigns) order by sessions desc) from campaigns),'[]'),
 'apps',coalesce((select jsonb_agg(to_jsonb(apps) order by downloads desc) from apps),'[]'),
 'daily',coalesce((select jsonb_agg(to_jsonb(daily) order by day) from daily),'[]'),
 'previous_views',(select count(*) from taha_metrics.events_v2 e join taha_metrics.sessions_v2 s on s.id=e.session_id where s.is_test=p_test and e.kind='view' and e.occurred_at>=lo-(hi-lo) and e.occurred_at<lo and (coalesce(p_source,'')='' or s.source=p_source) and (coalesce(p_page,'')='' or e.page=p_page) and (coalesce(p_category,'')='' or e.category=p_category))) into result;
 return result;
end $$;
revoke all on function public.taha_owner_report_v2(date,date,text,text,text,boolean) from public,anon;
grant execute on function public.taha_owner_report_v2(date,date,text,text,text,boolean) to authenticated;
