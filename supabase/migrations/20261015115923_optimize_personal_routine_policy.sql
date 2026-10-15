drop policy if exists "personal routine: owner read only" on public.personal_routines;
create policy "personal routine: owner read only"
  on public.personal_routines
  for select
  to authenticated
  using (owner_email = (select lower(auth.jwt() ->> 'email')));
