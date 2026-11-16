import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Check, Flame, Pause, Play, RotateCcw, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useStudy } from '../context/StudyContext';
import { useToast } from '../context/ToastContext';
import { MODES, SUBJECTS, modeOf, modeTargetSeconds, subjectOf } from '../lib/subjects';
import type { SubjectId, TimerMode } from '../lib/types';
import { formatDuration, formatToday, formatTimer, percent } from '../lib/format';
import { streakDays, todaySessions, totals } from '../lib/stats';

const RING_SIZE = 264;
const RING_STROKE = 12;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRC = 2 * Math.PI * RING_RADIUS;
const MIN_SAVE_SECONDS = 10;

export function TimerPage({ onOpenAuth }: { onOpenAuth: () => void }) {
  const { user } = useAuth();
  const { sessions, addSession, mode: storeMode } = useStudy();
  const { toast } = useToast();

  const [subject, setSubject] = useState<SubjectId>('math');
  const [timerMode, setTimerMode] = useState<TimerMode>('pomodoro25');
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [startedAt, setStartedAt] = useState<string | null>(null);
  const anchorRef = useRef<number | null>(null);
  const savingRef = useRef(false);

  const today = useMemo(() => todaySessions(sessions), [sessions]);
  const todayTotal = useMemo(() => totals(today), [today]);
  const streak = useMemo(() => streakDays(sessions), [sessions]);
  const target = modeTargetSeconds(timerMode);
  const meta = subjectOf(subject);
  const modeMeta = modeOf(timerMode);

  // 0.2초마다 경과 시간을 다시 계산한다. (탭이 백그라운드여도 실제 시간 기준)
  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      if (anchorRef.current == null) return;
      setElapsed((Date.now() - anchorRef.current) / 1000);
    }, 200);
    return () => window.clearInterval(id);
  }, [running]);

  const resetTimer = useCallback(() => {
    setRunning(false);
    anchorRef.current = null;
    setElapsed(0);
    setStartedAt(null);
  }, []);

  const saveRecord = useCallback(
    async (seconds: number, note?: string) => {
      if (savingRef.current) return;
      const rounded = Math.round(seconds);
      if (rounded < MIN_SAVE_SECONDS) {
        toast('10초 이상 공부해야 기록을 저장할 수 있어요.', 'error');
        return;
      }
      savingRef.current = true;
      const ended = new Date();
      const began = startedAt
        ? new Date(startedAt)
        : new Date(ended.getTime() - rounded * 1000);
      try {
        await addSession({
          subject,
          mode: timerMode,
          seconds: rounded,
          startedAt: began.toISOString(),
          endedAt: ended.toISOString(),
        });
        toast(note ?? `${meta.label} · ${formatDuration(rounded)} 저장했어요!`, 'success');
        resetTimer();
      } catch (error) {
        toast(error instanceof Error ? error.message : '기록을 저장하지 못했어요.', 'error');
      } finally {
        savingRef.current = false;
      }
    },
    [addSession, meta.label, resetTimer, startedAt, subject, timerMode, toast],
  );

  // 뽀모도로는 목표 시간에 닿으면 자동으로 기록을 남긴다.
  useEffect(() => {
    if (!running || target <= 0) return;
    if (elapsed >= target && !savingRef.current) {
      setRunning(false);
      anchorRef.current = null;
      setElapsed(target);
      void saveRecord(target, `${meta.label} ${modeMeta.minutes}분 완료! 기록에 저장했어요 🎉`);
    }
  }, [elapsed, running, target, saveRecord, meta.label, modeMeta.minutes]);

  const start = () => {
    anchorRef.current = Date.now() - elapsed * 1000;
    if (!startedAt) setStartedAt(new Date().toISOString());
    setRunning(true);
  };

  const pause = () => {
    if (anchorRef.current != null) {
      setElapsed((Date.now() - anchorRef.current) / 1000);
    }
    setRunning(false);
    anchorRef.current = null;
  };

  const changeMode = (next: TimerMode) => {
    if (next === timerMode) return;
    setRunning(false);
    anchorRef.current = null;
    setElapsed(0);
    setStartedAt(null);
    setTimerMode(next);
  };

  const displaySeconds = target > 0 ? Math.max(0, target - elapsed) : elapsed;
  const progress = target > 0 ? Math.min(1, elapsed / target) : (elapsed % 3600) / 3600;
  const dashOffset = RING_CIRC * (1 - progress);
  const canSave = Math.round(elapsed) >= MIN_SAVE_SECONDS;
  const isCounting = running || elapsed > 0;

  return (
    <div className="space-y-4 pt-4">
      {storeMode === 'guest' && (
        <button
          type="button"
          onClick={onOpenAuth}
          className="flex w-full items-center gap-3 rounded-2xl border border-cyan-400/25 bg-cyan-400/[0.07] px-4 py-3 text-left transition hover:bg-cyan-400/[0.12]"
        >
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-cyan-400/15 text-cyan-200">
            <Sparkles className="h-[18px] w-[18px]" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[13px] font-bold text-cyan-100">체험 모드로 둘러보는 중</span>
            <span className="mt-0.5 block text-[11.5px] leading-tight text-cyan-100/70">
              로그인하면 기록이 계정에 저장돼요 · 탭해서 5초 만에 가입
            </span>
          </span>
        </button>
      )}

      {/* 오늘 요약 */}
      <section className="app-card relative overflow-hidden p-4">
        <div
          className="pointer-events-none absolute -right-10 -top-16 h-40 w-40 rounded-full opacity-40 blur-2xl"
          style={{ background: `radial-gradient(circle, ${meta.color}55, transparent 70%)` }}
        />
        <p className="text-[11.5px] font-semibold text-slate-400">{formatToday()}</p>
        <div className="mt-1 flex items-end justify-between gap-3">
          <div>
            <p className="text-[12px] font-semibold text-slate-400">오늘 총 공부시간</p>
            <p className="tabular mt-0.5 bg-gradient-to-r from-cyan-300 to-teal-200 bg-clip-text text-[34px] font-extrabold leading-none tracking-tight text-transparent">
              {formatTimer(todayTotal.totalSeconds)}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1.5 pb-1">
            <span className="pill border-amber-400/25 bg-amber-400/10 text-amber-200">
              <Flame className="h-3.5 w-3.5" />
              {streak}일 연속
            </span>
            <span className="text-[11.5px] font-semibold text-slate-400">
              오늘 기록 {todayTotal.count}회
            </span>
          </div>
        </div>
      </section>

      {/* 과목 */}
      <section>
        <div className="section-title mb-2">
          <span>공부할 과목</span>
          <span className="text-[11px] font-medium normal-case tracking-normal text-slate-500">
            {meta.hint}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {SUBJECTS.map((s) => {
            const selected = s.id === subject;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setSubject(s.id)}
                aria-pressed={selected}
                className={`flex items-center justify-center gap-1.5 rounded-2xl border px-2 py-2.5 text-[13px] font-bold transition ${
                  selected ? 'text-white' : 'border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/[0.07]'
                }`}
                style={
                  selected
                    ? { borderColor: `${s.color}80`, backgroundColor: `${s.color}22`, boxShadow: `inset 0 0 0 1px ${s.color}33` }
                    : undefined
                }
              >
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: s.color }} />
                <span className="truncate">{s.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* 모드 */}
      <div className="grid grid-cols-3 gap-1 rounded-2xl border border-white/10 bg-night-900/70 p-1">
        {MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => changeMode(m.id)}
            aria-pressed={m.id === timerMode}
            className={`tab-btn ${m.id === timerMode ? 'bg-white/10 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
          >
            {m.short}
          </button>
        ))}
      </div>

      {/* 타이머 링 */}
      <section className="app-card flex flex-col items-center px-4 pb-5 pt-6">
        <div className="relative" style={{ width: RING_SIZE, height: RING_SIZE }}>
          <svg width={RING_SIZE} height={RING_SIZE} className="-rotate-90">
            <circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RING_RADIUS}
              fill="none"
              stroke="rgba(148,163,184,0.16)"
              strokeWidth={RING_STROKE}
            />
            <circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RING_RADIUS}
              fill="none"
              stroke={meta.color}
              strokeWidth={RING_STROKE}
              strokeLinecap="round"
              strokeDasharray={RING_CIRC}
              strokeDashoffset={dashOffset}
              style={{
                transition: running ? 'stroke-dashoffset 0.2s linear' : 'stroke-dashoffset 0.35s ease',
                filter: `drop-shadow(0 0 10px ${meta.color}66)`,
              }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold"
              style={{ backgroundColor: `${meta.color}22`, color: meta.color }}
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: meta.color }} />
              {meta.label}
            </span>
            <p className="tabular mt-2 text-[46px] font-extrabold leading-none tracking-tight text-white">
              {formatTimer(displaySeconds)}
            </p>
            <p className="mt-2 text-[12px] font-medium text-slate-400">
              {target > 0
                ? isCounting
                  ? `${modeMeta.minutes}분 중 ${formatDuration(displaySeconds)} 남음`
                  : '시작 버튼을 눌러 시작'
                : isCounting
                  ? '경과 시간 · 스톱워치'
                  : '경과 시간 · 준비 완료'}
            </p>
            {target > 0 && (
              <p className="mt-1 text-[11px] font-semibold text-slate-500">
                {percent(elapsed, target)}% 진행
              </p>
            )}
          </div>
        </div>

        <div className="mt-6 flex items-center justify-center gap-6">
          <button
            type="button"
            onClick={resetTimer}
            disabled={!isCounting}
            aria-label="초기화"
            className="grid h-12 w-12 place-items-center rounded-full border border-white/10 bg-white/[0.05] text-slate-300 transition hover:bg-white/10 disabled:opacity-40"
          >
            <RotateCcw className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={running ? pause : start}
            aria-label={running ? '일시정지' : '시작'}
            className="grid h-[68px] w-[68px] place-items-center rounded-full bg-gradient-to-br from-cyan-300 to-teal-300 text-night-950 shadow-glow transition hover:brightness-105 active:scale-95"
          >
            {running ? <Pause className="h-7 w-7" strokeWidth={2.4} /> : <Play className="ml-0.5 h-7 w-7" strokeWidth={2.4} />}
          </button>
          <button
            type="button"
            onClick={() => void saveRecord(elapsed)}
            disabled={!canSave}
            aria-label="완료 저장"
            className="grid h-12 w-12 place-items-center rounded-full border border-white/10 bg-white/[0.05] text-slate-300 transition hover:bg-white/10 disabled:opacity-40"
          >
            <Check className="h-5 w-5" />
          </button>
        </div>
        <div className="mt-2 flex w-full max-w-[260px] items-center justify-between px-1 text-[10.5px] font-semibold text-slate-500">
          <span>초기화</span>
          <span className="-ml-1">{running ? '일시정지' : '시작'}</span>
          <span>완료 저장</span>
        </div>
        <p className="mt-3 text-center text-[11px] leading-relaxed text-slate-500">
          {canSave
            ? '완료 저장을 누르면 오늘 기록에 남습니다.'
            : `10초 이상 공부하면 기록을 저장할 수 있어요.`}
        </p>
      </section>

      {!user && (
        <p className="px-2 pb-1 text-center text-[11px] leading-relaxed text-slate-500">
          지금 기록은 이 기기에만 저장돼요. 로그인하면 계정에 저장되어 다른 기기에서도 이어져요.
        </p>
      )}
    </div>
  );
}
