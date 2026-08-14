-- Motifs de suppression de compte (avant hard-delete auth.users)

create table if not exists public.account_deletion_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  email text not null default '',
  reason text not null,
  details text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists account_deletion_feedback_created_idx
  on public.account_deletion_feedback (created_at desc);

alter table public.account_deletion_feedback enable row level security;

-- Insertion uniquement via service role (API serveur)
drop policy if exists "account_deletion_feedback_no_client" on public.account_deletion_feedback;
