import { useMemo, useState } from 'react';
import { BarChart3, Flame, Minus, Plus, Trash2 } from 'lucide-react';
import { useStudy } from '../context/StudyContext';
import { useToast } from '../context/ToastContext';
import { SUBJECTS, modeOf, subjectOf } from '../lib/subjects';
import {
  WEEKDAY_LABELS,
  formatDuration,
  formatHours,
  formatSessionTime,
  percent,
  weekdayIndex,
} from '../lib/format';
import { streakDays, todaySessions, totals, weekDayTotals, weekSessions } from '../lib/stats';
import { addDays, startOfWeek } from '../lib/format';

type Range = 'today' | 'week';

export function StatsPage() {
  const { sessions, settings, setWeeklyGoal, deleteSession } = useStudy();
  const { toast } = useToast();
  const [range, setRange] = useState<Range>('today');
  const [goalBusy, setGoalBusy] = useState(false);

  const now = new Date();
  const rangeSessions = useMemo(
    () => (range === 'today' ? todaySessions(sessions) : weekSessions(sessions)),
    [range, sessions],
  );
  const rangeTotals = useMemo(() => totals(rangeSessions), [rangeSessions]);
  const weekTotals = useMemo(() => totals(weekSessions(sessions)), [sessions]);
  const streak = useMemo(() => streakDays(sessions), [sessions]);
  const dayTotals = useMemo(() => weekDayTotals(sessions), [sessions]);
  const maxDay = Math.max(1, ...dayTotals);
  const todayIdx = weekdayIndex(now);

  const goalSeconds = settings.weeklyGoalHours * 3600;
  const goalPercent = percent(weekTotals.totalSeconds, goalSeconds);

  const subjectRows = SUBJECTS.map((s) => ({
    subject: s,
    seconds: rangeTotals.bySubject[s.id] ?? 0,
  }))
    .filter((row) => row.seconds > 0)
    .sort((a, b) => b.seconds - a.seconds);

  const recent = useMemo(
    () =>
      [...rangeSessions]
        .sort((a, b) => new Date(b.endedAt).getTime() - new Date(a.endedAt).getTime())
        .slice(0, 30),
    [rangeSessions],
  );

  const changeGoal = async (delta: number) => {
    const next = Math.min(60, Math.max(1, settings.weeklyGoalHours + delta));
    if (next === settings.weeklyGoalHours) return;
    setGoalBusy(true);
    await setWeeklyGoal(next);
    setGoalBusy(false);
  };

  const rangeLabel = range === 'today' ? '오늘' : '이번 주';
  const weekStart = startOfWeek(now);

  return (
    <div className="space-y-4 pt-4">
      <div className="grid grid-cols-2 gap-1 rounded-2xl border border-white/10 bg-night-900/70 p-1">
        {(['today', 'week'] as Range[]).map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRange(r)}
            aria-pressed={range === r}
            className={`tab-btn ${range === r ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-slate-200'}`}
          >
            {r === 'today' ? '오늘' : '이번 주'}
          </button>
        ))}
      </div>

      <section className="app-card relative overflow-hidden p-5">
        <div className="pointer-events-none absolute -right-12 -top-14 h-44 w-44 rounded-full bg-cyan-400/10 blur-2xl" />
        <p className="text-[12px] font-semibold text-slate-400">{rangeLabel} 총 공부시간</p>
        <p className="mt-1 bg-gradient-to-r from-cyan-300 to-teal-200 bg-clip-text text-[36px] font-extrabold leading-none tracking-tight text-transparent">
          {formatDuration(rangeTotals.totalSeconds)}
        </p>
        <p className="mt-2 text-[12px] font-semibold text-slate-400">기록 {rangeTotals.count}회</p>
      </section>

      <div className="grid grid-cols-2 gap-2.5">
        <section className="app-card p-4">
          <div className="flex items-center gap-1.5 text-[11.5px] font-semibold text-slate-400">
            <Flame className="h-3.5 w-3.5 text-amber-300" />
            연속 공부일
          </div>
          <p className="mt-2 flex items-baseline gap-1">
            <span className="text-[26px] font-extrabold leading-none text-white">{streak}</span>
            <span className="text-[12px] font-bold text-slate-400">일</span>
          </p>
          <p className="mt-3 text-[10.5px] leading-relaxed text-slate-500">
            {streak > 0 ? '불꽃이 꺼지지 않게 오늘도 달려요' : '오늘 기록하면 불꽃이 켜져요'}
          </p>
        </section>

        <section className="app-card p-4">
          <div className="flex items-center gap-1.5 text-[11.5px] font-semibold text-slate-400">
            <BarChart3 className="h-3.5 w-3.5 text-cyan-300" />
            이번 주 목표
          </div>
          <p className="mt-2 flex items-baseline gap-1">
            <span className="text-[26px] font-extrabold leading-none text-white">{goalPercent}</span>
            <span className="text-[12px] font-bold text-slate-400">%</span>
          </p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-teal-300 transition-all duration-500"
              style={{ width: `${goalPercent}%` }}
            />
          </div>
          <div className="mt-2.5 flex items-center justify-between gap-1">
            <button
              type="button"
              onClick={() => void changeGoal(-1)}
              disabled={goalBusy || settings.weeklyGoalHours <= 1}
              aria-label="주간 목표 줄이기"
              className="grid h-7 w-7 place-items-center rounded-lg border border-white/10 text-slate-300 transition hover:bg-white/10 disabled:opacity-40"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span className="text-[11px] font-bold text-slate-300">
              {formatHours(weekTotals.totalSeconds)} / {settings.weeklyGoalHours}h
            </span>
            <button
              type="button"
              onClick={() => void changeGoal(1)}
              disabled={goalBusy || settings.weeklyGoalHours >= 60}
              aria-label="주간 목표 늘리기"
              className="grid h-7 w-7 place-items-center rounded-lg border border-white/10 text-slate-300 transition hover:bg-white/10 disabled:opacity-40"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
        </section>
      </div>

      {/* 요일별 막대 차트 */}
      <section className="app-card p-4">
        <div className="section-title mb-3">
          <span>요일별 공부시간</span>
          <span className="text-[11px] font-semibold normal-case tracking-normal text-slate-500">
            이번 주 (월~일)
          </span>
        </div>
        <div className="flex h-[132px] items-end justify-between gap-1.5">
          {dayTotals.map((seconds, index) => {
            const height = seconds > 0 ? Math.max(8, Math.round((seconds / maxDay) * 96)) : 4;
            const isToday = index === todayIdx;
            return (
              <div key={WEEKDAY_LABELS[index]} className="flex flex-1 flex-col items-center gap-1.5">
                <span className={`text-[9.5px] font-bold ${seconds > 0 ? 'text-slate-400' : 'text-slate-600'}`}>
                  {seconds > 0 ? formatDuration(seconds) : ''}
                </span>
                <div className="flex w-full flex-1 items-end">
                  <div
                    className={`w-full rounded-t-md transition-all duration-500 ${
                      isToday
                        ? 'bg-gradient-to-t from-cyan-500 to-teal-300'
                        : seconds > 0
                          ? 'bg-cyan-400/35'
                          : 'bg-white/10'
                    }`}
                    style={{ height: `${height}px` }}
                    title={`${WEEKDAY_LABELS[index]}요일 ${formatDuration(seconds)}`}
                  />
                </div>
                <span
                  className={`text-[10.5px] font-bold ${isToday ? 'text-cyan-200' : 'text-slate-500'}`}
                >
                  {WEEKDAY_LABELS[index]}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* 과목별 비율 */}
      <section className="app-card p-4">
        <div className="section-title mb-3">
          <span>과목별 공부시간</span>
          <span className="text-[11px] font-semibold normal-case tracking-normal text-slate-500">
            {rangeLabel} 기준
          </span>
        </div>
        {subjectRows.length === 0 ? (
          <p className="py-4 text-center text-[12px] text-slate-500">아직 기록이 없어요.</p>
        ) : (
          <ul className="space-y-3">
            {subjectRows.map(({ subject: s, seconds }) => {
              const share = percent(seconds, rangeTotals.totalSeconds);
              return (
                <li key={s.id}>
                  <div className="flex items-center justify-between text-[12px] font-semibold">
                    <span className="flex items-center gap-1.5 text-slate-300">
                      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: s.color }} />
                      {s.label}
                    </span>
                    <span className="text-slate-400">
                      {formatDuration(seconds)} · {share}%
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/[0.08]">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(share, 2)}%`, backgroundColor: s.color }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* 최근 기록 */}
      <section className="app-card overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <span className="text-[13px] font-bold text-slate-200">{rangeLabel}의 공부 기록</span>
          <span className="text-[11px] font-semibold text-slate-500">{recent.length}개</span>
        </div>
        {recent.length === 0 ? (
          <p className="border-t border-white/[0.06] px-4 py-8 text-center text-[12px] text-slate-500">
            타이머로 공부하면 기록이 여기에 쌓여요.
          </p>
        ) : (
          <ul className="divide-y divide-white/[0.05] border-t border-white/[0.06]">
            {recent.map((session) => {
              const s = subjectOf(session.subject);
              return (
                <li key={session.id} className="flex items-center gap-3 px-4 py-2.5">
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: s.color }} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[13px] font-bold text-slate-100">{s.label}</span>
                      <span
                        className="rounded-md px-1.5 py-0.5 text-[9.5px] font-bold"
                        style={{ backgroundColor: `${s.color}1f`, color: s.color }}
                      >
                        {modeOf(session.mode).short}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[10.5px] text-slate-500">{formatSessionTime(session.endedAt)}</p>
                  </div>
                  <span className="text-[13px] font-extrabold text-white">{formatDuration(session.seconds)}</span>
                  <button
                    type="button"
                    onClick={() => {
                      void deleteSession(session.id);
                      toast('기록을 삭제했어요.');
                    }}
                    aria-label="기록 삭제"
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-slate-500 transition hover:bg-white/[0.06] hover:text-rose-300"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <p className="px-2 pb-2 text-center text-[10.5px] text-slate-600">
        이번 주({weekStart.getMonth() + 1}월 {weekStart.getDate()}일 ~{' '}
        {addDays(weekStart, 6).getMonth() + 1}월 {addDays(weekStart, 6).getDate()}일) 기준
      </p>
    </div>
  );
}
