-- Run this once in the Supabase SQL editor before connecting the dashboard.
-- The browser only receives the anon key; RLS is the security boundary.
create table if not exists public.study_states (
  user_id uuid primary key references auth.users(id) on delete cascade,
  payload jsonb not null check (jsonb_typeof(payload) = 'object' and pg_column_size(payload) <= 1048576),
  updated_at timestamptz not null default now()
);

alter table public.study_states enable row level security;

revoke all on public.study_states from anon;
grant select, insert, update on public.study_states to authenticated;

drop policy if exists "study_states_select_own" on public.study_states;
create policy "study_states_select_own"
  on public.study_states for select
  using (auth.uid() = user_id);

drop policy if exists "study_states_insert_own" on public.study_states;
create policy "study_states_insert_own"
  on public.study_states for insert
  with check (auth.uid() = user_id);

drop policy if exists "study_states_update_own" on public.study_states;
create policy "study_states_update_own"
  on public.study_states for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Enable this table under Database > Replication if realtime updates are needed.
-- Run the following only when the table is not already in supabase_realtime:
-- alter publication supabase_realtime add table public.study_states;
