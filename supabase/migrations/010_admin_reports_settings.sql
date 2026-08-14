-- Admin, signalements, maintenance, suspension

alter table public.profiles
  add column if not exists is_admin boolean not null default false,
  add column if not exists is_suspended boolean not null default false;

alter table public.releases
  add column if not exists is_hidden boolean not null default false;

do $$ begin
  create type public.report_reason as enum (
    'copyright',
    'illegal',
    'spam',
    'hate',
    'other'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.report_status as enum (
    'open',
    'reviewing',
    'resolved',
    'dismissed'
  );
exception when duplicate_object then null;
end $$;

create table if not exists public.track_reports (
  id uuid primary key default gen_random_uuid(),
  track_id uuid not null references public.tracks (id) on delete cascade,
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  reason public.report_reason not null,
  details text not null default '',
  status public.report_status not null default 'open',
  admin_note text not null default '',
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by uuid references public.profiles (id) on delete set null
);

create unique index if not exists track_reports_open_unique
  on public.track_reports (track_id, reporter_id)
  where status in ('open', 'reviewing');

create index if not exists track_reports_status_idx
  on public.track_reports (status, created_at desc);

create table if not exists public.site_settings (
  id int primary key default 1 check (id = 1),
  maintenance_enabled boolean not null default false,
  maintenance_message text not null default 'Gootunes est en maintenance. Reviens bientôt.',
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles (id) on delete set null
);

insert into public.site_settings (id)
values (1)
on conflict (id) do nothing;

alter table public.track_reports enable row level security;
alter table public.site_settings enable row level security;

drop policy if exists "track_reports_insert_own" on public.track_reports;
create policy "track_reports_insert_own"
  on public.track_reports for insert
  with check (auth.uid() = reporter_id);

drop policy if exists "track_reports_select_own" on public.track_reports;
create policy "track_reports_select_own"
  on public.track_reports for select
  using (
    auth.uid() = reporter_id
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );

drop policy if exists "track_reports_admin_update" on public.track_reports;
create policy "track_reports_admin_update"
  on public.track_reports for update
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );

drop policy if exists "site_settings_select_all" on public.site_settings;
create policy "site_settings_select_all"
  on public.site_settings for select
  using (true);

drop policy if exists "site_settings_admin_update" on public.site_settings;
create policy "site_settings_admin_update"
  on public.site_settings for update
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );
