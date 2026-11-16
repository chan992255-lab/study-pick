create extension if not exists "pgcrypto";
create table if not exists public.study_settings (
  user_id           uuid primary key references auth.users (id) on delete cascade,
  nickname          text not null default '학생'
                      check (char_length(nickname) between 1 and 12),
  weekly_goal_hours int  not null default 20
                      check (weekly_goal_hours between 1 and 60),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create table if not exists public.study_sessions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  subject    text not null
               check (subject in ('korean', 'math', 'english', 'social', 'science', 'etc')),
  mode       text not null
               check (mode in ('pomodoro25', 'pomodoro50', 'stopwatch')),
  seconds    int  not null check (seconds between 10 and 86400),
  started_at timestamptz not null,
  ended_at   timestamptz not null,
  created_at timestamptz not null default now(),
  constraint study_sessions_time_order check (ended_at >= started_at)
);
create index if not exists study_sessions_user_ended_idx
  on public.study_sessions (user_id, ended_at desc);
create table if not exists public.study_tasks (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  title        text not null check (char_length(title) between 1 and 80),
  subject      text not null
                 check (subject in ('korean', 'math', 'english', 'social', 'science', 'etc')),
  done         boolean not null default false,
  created_at   timestamptz not null default now(),
  completed_at timestamptz
);
create index if not exists study_tasks_user_created_idx
  on public.study_tasks (user_id, created_at);
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
drop trigger if exists study_settings_set_updated_at on public.study_settings;
create trigger study_settings_set_updated_at
  before update on public.study_settings
  for each row execute function public.set_updated_at();
create or replace function public.handle_new_study_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_nickname text;
begin
  v_nickname := coalesce(
    nullif(btrim(new.raw_user_meta_data ->> 'nickname'), ''),
    split_part(coalesce(new.email, 'student'), '@', 1),
    '학생'
  );
  if char_length(v_nickname) > 12 then
    v_nickname := substr(v_nickname, 1, 12);
  end if;
  insert into public.study_settings (user_id, nickname)
  values (new.id, v_nickname)
  on conflict (user_id) do nothing;
  return new;
end;
$$;
drop trigger if exists on_auth_user_created_study on auth.users;
create trigger on_auth_user_created_study
  after insert on auth.users
  for each row execute function public.handle_new_study_user();
alter table public.study_settings enable row level security;
alter table public.study_sessions enable row level security;
alter table public.study_tasks    enable row level security;
drop policy if exists "study_settings own select" on public.study_settings;
create policy "study_settings own select"
  on public.study_settings for select
  to authenticated
  using (auth.uid() = user_id);
drop policy if exists "study_settings own insert" on public.study_settings;
create policy "study_settings own insert"
  on public.study_settings for insert
  to authenticated
  with check (auth.uid() = user_id);
drop policy if exists "study_settings own update" on public.study_settings;
create policy "study_settings own update"
  on public.study_settings for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
drop policy if exists "study_settings own delete" on public.study_settings;
create policy "study_settings own delete"
  on public.study_settings for delete
  to authenticated
  using (auth.uid() = user_id);
drop policy if exists "study_sessions own select" on public.study_sessions;
create policy "study_sessions own select"
  on public.study_sessions for select
  to authenticated
  using (auth.uid() = user_id);
drop policy if exists "study_sessions own insert" on public.study_sessions;
create policy "study_sessions own insert"
  on public.study_sessions for insert
  to authenticated
  with check (auth.uid() = user_id);
drop policy if exists "study_sessions own update" on public.study_sessions;
create policy "study_sessions own update"
  on public.study_sessions for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
drop policy if exists "study_sessions own delete" on public.study_sessions;
create policy "study_sessions own delete"
  on public.study_sessions for delete
  to authenticated
  using (auth.uid() = user_id);
drop policy if exists "study_tasks own select" on public.study_tasks;
create policy "study_tasks own select"
  on public.study_tasks for select
  to authenticated
  using (auth.uid() = user_id);
drop policy if exists "study_tasks own insert" on public.study_tasks;
create policy "study_tasks own insert"
  on public.study_tasks for insert
  to authenticated
  with check (auth.uid() = user_id);
drop policy if exists "study_tasks own update" on public.study_tasks;
create policy "study_tasks own update"
  on public.study_tasks for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
drop policy if exists "study_tasks own delete" on public.study_tasks;
create policy "study_tasks own delete"
  on public.study_tasks for delete
  to authenticated
  using (auth.uid() = user_id);
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete
  on public.study_settings, public.study_sessions, public.study_tasks
  to authenticated;
revoke all on public.study_settings, public.study_sessions, public.study_tasks from anon;