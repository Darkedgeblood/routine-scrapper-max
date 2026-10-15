create table if not exists public.personal_routines (
  owner_email text primary key check (owner_email = lower(owner_email)),
  routine jsonb not null default '[]'::jsonb check (jsonb_typeof(routine) = 'array'),
  skipped_courses text[] not null default '{}',
  skipped_labs text[] not null default '{}',
  updated_at timestamptz not null default now()
);

alter table public.personal_routines enable row level security;

revoke all on table public.personal_routines from anon, authenticated;
grant select on table public.personal_routines to authenticated;

drop policy if exists "personal routine: owner read only" on public.personal_routines;
create policy "personal routine: owner read only"
  on public.personal_routines
  for select
  to authenticated
  using (owner_email = lower((select auth.jwt() ->> 'email')));
