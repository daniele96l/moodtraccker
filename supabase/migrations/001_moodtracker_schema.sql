create schema if not exists moodtracker;

create table if not exists moodtracker.day_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entry_date date not null,
  mood_score smallint check (mood_score between 1 and 10),
  journal_text text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, entry_date)
);

create table if not exists moodtracker.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  kind text not null check (kind in ('habit', 'vice')),
  color text,
  sort_order int not null default 0,
  archived_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists moodtracker.habit_logs (
  id uuid primary key default gen_random_uuid(),
  habit_id uuid not null references moodtracker.habits(id) on delete cascade,
  log_date date not null,
  completed boolean not null default false,
  unique (habit_id, log_date)
);

create table if not exists moodtracker.meditation_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  session_date date not null,
  duration_seconds int not null,
  pattern text,
  completed_at timestamptz not null default now()
);

create index if not exists day_entries_user_date_idx on moodtracker.day_entries (user_id, entry_date);
create index if not exists habit_logs_habit_date_idx on moodtracker.habit_logs (habit_id, log_date);
create index if not exists meditation_sessions_user_date_idx on moodtracker.meditation_sessions (user_id, session_date);

alter table moodtracker.day_entries enable row level security;
alter table moodtracker.habits enable row level security;
alter table moodtracker.habit_logs enable row level security;
alter table moodtracker.meditation_sessions enable row level security;

create policy "day_entries_select" on moodtracker.day_entries for select using (user_id = auth.uid());
create policy "day_entries_insert" on moodtracker.day_entries for insert with check (user_id = auth.uid());
create policy "day_entries_update" on moodtracker.day_entries for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "day_entries_delete" on moodtracker.day_entries for delete using (user_id = auth.uid());

create policy "habits_select" on moodtracker.habits for select using (user_id = auth.uid());
create policy "habits_insert" on moodtracker.habits for insert with check (user_id = auth.uid());
create policy "habits_update" on moodtracker.habits for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "habits_delete" on moodtracker.habits for delete using (user_id = auth.uid());

create policy "habit_logs_select" on moodtracker.habit_logs for select using (
  exists (select 1 from moodtracker.habits h where h.id = habit_id and h.user_id = auth.uid())
);
create policy "habit_logs_insert" on moodtracker.habit_logs for insert with check (
  exists (select 1 from moodtracker.habits h where h.id = habit_id and h.user_id = auth.uid())
);
create policy "habit_logs_update" on moodtracker.habit_logs for update using (
  exists (select 1 from moodtracker.habits h where h.id = habit_id and h.user_id = auth.uid())
) with check (
  exists (select 1 from moodtracker.habits h where h.id = habit_id and h.user_id = auth.uid())
);
create policy "habit_logs_delete" on moodtracker.habit_logs for delete using (
  exists (select 1 from moodtracker.habits h where h.id = habit_id and h.user_id = auth.uid())
);

create policy "meditation_sessions_select" on moodtracker.meditation_sessions for select using (user_id = auth.uid());
create policy "meditation_sessions_insert" on moodtracker.meditation_sessions for insert with check (user_id = auth.uid());
create policy "meditation_sessions_update" on moodtracker.meditation_sessions for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "meditation_sessions_delete" on moodtracker.meditation_sessions for delete using (user_id = auth.uid());

grant usage on schema moodtracker to anon, authenticated;
grant all on all tables in schema moodtracker to anon, authenticated;
grant all on all sequences in schema moodtracker to anon, authenticated;
alter default privileges in schema moodtracker grant all on tables to anon, authenticated;

alter role authenticator set pgrst.db_schemas = 'public, graphql_public, moodtracker';
notify pgrst, 'reload config';
