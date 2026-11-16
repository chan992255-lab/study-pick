-- =====================================================================
--  스터디픽(Study Pick) — Supabase 스키마
--  Supabase 대시보드 → SQL Editor 에 이 파일 전체를 붙여넣고 실행하세요.
--  한 번 실행하면 표(study_settings / study_sessions / study_tasks),
--  RLS 정책, 회원가입 트리거가 모두 준비됩니다.
--  여러 번 실행해도 안전하도록 작성되어 있습니다(idempotent).
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- 1. study_settings — 사용자별 설정(닉네임 · 주간 목표). auth.users 와 1:1
-- ---------------------------------------------------------------------
create table if not exists public.study_settings (
  user_id           uuid primary key references auth.users (id) on delete cascade,
  nickname          text not null default '학생'
                      check (char_length(nickname) between 1 and 12),
  weekly_goal_hours int  not null default 20
                      check (weekly_goal_hours between 1 and 60),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 2. study_sessions — 타이머로 저장한 공부 기록
-- ---------------------------------------------------------------------
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

-- ---------------------------------------------------------------------
-- 3. study_tasks — 과목별 할 일
-- ---------------------------------------------------------------------
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

-- ---------------------------------------------------------------------
-- 4. updated_at 자동 갱신
-- ---------------------------------------------------------------------
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

-- ---------------------------------------------------------------------
-- 5. 회원가입 시 설정(닉네임) 자동 생성
--    (signUp 의 options.data 에 담긴 nickname 사용)
-- ---------------------------------------------------------------------
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

-- ---------------------------------------------------------------------
-- 6. Row Level Security — 본인 데이터만 읽고 쓰기 (auth.uid() = user_id)
-- ---------------------------------------------------------------------
alter table public.study_settings enable row level security;
alter table public.study_sessions enable row level security;
alter table public.study_tasks    enable row level security;

-- study_settings
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

-- study_sessions
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

-- study_tasks
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

-- ---------------------------------------------------------------------
-- 7. 권한 — 로그인 사용자에게만 테이블 접근 권한 부여
-- ---------------------------------------------------------------------
grant usage on schema public to anon, authenticated;

-- 비로그인(anon)은 어떤 개인 기록도 읽을 수 없다.
revoke all on public.study_settings, public.study_sessions, public.study_tasks from anon;

-- Supabase 기본 권한에는 TRUNCATE·REFERENCES·TRIGGER 도 들어 있어서,
-- 행 단위 RLS 가 적용되지 않는 TRUNCATE 권한은 걷어내고 DML 만 남긴다.
revoke truncate, references, trigger
  on public.study_settings, public.study_sessions, public.study_tasks
  from authenticated;

grant select, insert, update, delete
  on public.study_settings, public.study_sessions, public.study_tasks
  to authenticated;

-- =====================================================================
--  완료! 프로젝트 루트의 .env 에 아래 두 값을 넣고 npm run dev 하세요.
--    VITE_SUPABASE_URL=https://<project-ref>.supabase.co
--    VITE_SUPABASE_ANON_KEY=<publishable/anon key>
--  그리고 Authentication → Providers → Email 에서
--    "Confirm email" 을 꺼야 가입 직후 바로 로그인됩니다.
-- =====================================================================
