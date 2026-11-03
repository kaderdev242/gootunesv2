-- Journal des erreurs appli (admin : Logs système)

create table if not exists public.system_logs (
  id uuid primary key default gen_random_uuid(),
  level text not null default 'error' check (level in ('error', 'warn', 'info')),
  source text not null default 'server',
  message text not null,
  stack text,
  path text,
  digest text,
  user_agent text,
  user_id uuid references public.profiles (id) on delete set null,
  context jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists system_logs_created_idx
  on public.system_logs (created_at desc);

create index if not exists system_logs_source_idx
  on public.system_logs (source, created_at desc);

alter table public.system_logs enable row level security;

drop policy if exists "system_logs_admin_select" on public.system_logs;
create policy "system_logs_admin_select"
  on public.system_logs for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );

drop policy if exists "system_logs_admin_delete" on public.system_logs;
create policy "system_logs_admin_delete"
  on public.system_logs for delete
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );
