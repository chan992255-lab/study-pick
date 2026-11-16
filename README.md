# 스터디픽 (Study Pick) 📚

> 고등학생을 위한 **공부 타이머 · 과목별 할 일 · 학습 통계** 웹앱입니다.
> 계정으로 로그인하면 공부 기록·할 일·목표가 서버(Supabase)에 저장되어 **다른 기기에서도 이어서** 볼 수 있습니다.

- 라이브: https://study-pick.vercel.app
- 스택: React 18 + TypeScript + Vite 5 + Tailwind CSS 3 + Supabase(Auth · Postgres) + PWA
- 저장소: https://github.com/chan992255-lab/study-pick

---

## 1. 주요 기능

### 타이머 탭
- 과목 6개(국어 · 수학 · 영어 · 통합사회 · 통합과학 · 기타) — 과목마다 고유 컬러
- **뽀모도로 25분 · 뽀모도로 50분 · 스톱워치** 3가지 모드, 원형 진행 링
- 시작 · 일시정지 · 초기화 · 완료 저장 (10초 미만은 저장되지 않음)
- 뽀모도로는 목표 시간에 도달하면 자동으로 기록에 저장
- 오늘 총 공부시간 · 연속 공부일(불꽃 스트릭) · 오늘 기록 횟수

### 과목·할 일 탭
- 과목별 오늘 공부 시간 요약(6칸 + 미니 프로그레스)
- 할 일 입력 + 과목 태그(6개 칩이 잘리지 않고 3열 2행으로 고르게 배치)
- 과목별 그룹 목록, 체크 완료(축하 토스트) · 삭제, 전체 진행률

### 통계 탭
- **오늘 / 이번 주** 토글
- 요일별 막대 차트(월~일, 오늘 강조)
- 과목별 비율 막대(시간 · %)
- 주간 목표 시간 ±1시간 조절 + 달성률
- 최근 공부 기록 리스트(모드 배지 · 시각) 및 삭제

### 계정 · 개인 학습 데이터
- 이메일 · 비밀번호 회원가입 / 로그인 + 닉네임(가입 시 자동 저장)
- Supabase Auth + Postgres 테이블 `study_sessions` / `study_tasks` / `study_settings`
- 모든 테이블에 **RLS(`auth.uid() = user_id`)** 적용 → 본인 데이터만 읽고 쓰기
- Supabase Auth 의 **Confirm email 꺼짐** → 가입 즉시 바로 로그인
- 비로그인(체험) 상태에서도 모든 화면을 그대로 사용할 수 있고, 데이터는 이 기기 브라우저(localStorage)에만 저장
- 로그인하면 기존 체험 기록을 계정으로 가져올지 물어봄(가져오기 / 깔끔하게 시작)

### 기타
- 모바일 퍼스트 하단 탭 3개 + 데스크톱에서는 가운데 정렬된 앱 프레임
- 다크 네이비/슬레이트 + 민트·스카이블루 포인트
- PWA: `manifest.webmanifest`, 아이콘(192/512), `apple-touch-icon`, 서비스 워커 → iPhone Safari "홈 화면에 추가"
- 해시 라우팅(`#/timer`, `#/tasks`, `#/stats`) · 토스트 · 낙관적 업데이트 · 접근성 라벨

---

## 2. 빠른 시작

```bash
cd projects/study-pick
npm install
npm run dev          # http://localhost:5173
```

빌드 확인:

```bash
npm run build        # tsc --noEmit && vite build
npm run preview
```

`.env`(또는 `.env.local`)에 Supabase 값을 넣으면 로그인이 활성화됩니다.

```env
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<publishable/anon key>
```

값이 없어도 앱은 **체험 모드**로 정상 동작합니다(로그인 버튼만 비활성 안내).

---

## 3. Supabase 구성

1. 새 프로젝트 생성 (무료 플랜 기준 프로젝트 2개까지)
2. **SQL Editor** 에 `supabase/schema.sql` 전체를 붙여넣고 실행
   - `study_settings` · `study_sessions` · `study_tasks` 테이블
   - RLS 정책 12개(테이블마다 select/insert/update/delete, `auth.uid() = user_id`)
   - 회원가입 시 `study_settings`(닉네임) 자동 생성 트리거
3. **Authentication → Sign In / Providers → Email** 에서 **Confirm email 끄기** (가입 즉시 로그인)
4. **Authentication → URL Configuration** 의 Redirect URLs 에 배포 주소 추가
   - `https://study-pick.vercel.app/`
   - `http://localhost:5173/`

프론트엔드는 publishable(anon) 키만 사용하며, 실제 접근 제어는 RLS 가 담당합니다.

---

## 4. 배포 (Vercel)

- GitHub `chan992255-lab/study-pick` 저장소를 Vercel 에 연결하면 `vite build` 결과(`dist/`)를 자동 배포합니다.
- 환경변수 `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` 를 Production/Preview 에 등록하세요.
  (같은 값이 `.env.production` 에도 들어 있어 CLI 빌드에서도 동작합니다.)

---

## 5. 구조

```
src/
  App.tsx                 앱 셸 · 해시 라우팅 · 모달
  main.tsx                엔트리 · 서비스 워커 등록
  context/
    AuthContext.tsx       Supabase 인증(세션 · 회원가입 · 로그인 · 로그아웃)
    StudyContext.tsx      기록·할 일·설정 상태 + 체험 기록 가져오기
    ToastContext.tsx      토스트 알림
  lib/
    supabase.ts           Supabase 클라이언트
    store.ts              저장소 추상화(guest=localStorage / account=Supabase)
    local-store.ts        체험 모드 저장소
    stats.ts              오늘·주간 집계, 요일별 합계, 스트릭
    format.ts             시간·날짜 표기
    subjects.ts           과목·모드 메타데이터
    types.ts              타입 정의
  pages/
    TimerPage.tsx         타이머 · 과목 선택 · 오늘 요약
    TasksPage.tsx         과목별 할 일
    StatsPage.tsx         통계
  components/             Header · BottomNav · AuthModal · ProfileModal · ImportPrompt · Toasts
supabase/schema.sql       테이블 · RLS · 트리거
scripts/make-icons.py     PWA 아이콘 생성
```

## 6. 데이터 모델

| 테이블 | 칼럼 |
| --- | --- |
| `study_sessions` | `id`, `user_id`, `subject`, `mode`, `seconds`, `started_at`, `ended_at`, `created_at` |
| `study_tasks` | `id`, `user_id`, `title`, `subject`, `done`, `created_at`, `completed_at` |
| `study_settings` | `user_id`(PK), `nickname`, `weekly_goal_hours`, `created_at`, `updated_at` |
