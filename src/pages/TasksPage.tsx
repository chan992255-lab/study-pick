import { useMemo, useState } from 'react';
import { Check, CircleCheckBig, Plus, Trash2 } from 'lucide-react';
import { useStudy } from '../context/StudyContext';
import { useToast } from '../context/ToastContext';
import { SUBJECTS, subjectOf } from '../lib/subjects';
import type { SubjectId } from '../lib/types';
import { formatDuration, percent } from '../lib/format';
import { todaySessions, totals } from '../lib/stats';

export function TasksPage() {
  const { tasks, sessions, addTask, setTaskDone, deleteTask } = useStudy();
  const { toast } = useToast();

  const [draft, setDraft] = useState('');
  const [subject, setSubject] = useState<SubjectId>('math');
  const [adding, setAdding] = useState(false);

  const todayTotals = useMemo(() => totals(todaySessions(sessions)), [sessions]);
  const maxSubjectSeconds = Math.max(1, ...Object.values(todayTotals.bySubject));

  const doneCount = tasks.filter((t) => t.done).length;
  const remaining = tasks.length - doneCount;
  const completion = percent(doneCount, tasks.length);

  const grouped = useMemo(
    () =>
      SUBJECTS.map((s) => ({
        subject: s,
        items: tasks.filter((t) => t.subject === s.id),
      })).filter((group) => group.items.length > 0),
    [tasks],
  );

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const title = draft.trim();
    if (!title || adding) return;
    setAdding(true);
    try {
      await addTask({ title, subject });
      setDraft('');
      toast(`${subjectOf(subject).label} 할 일을 추가했어요.`, 'success');
    } catch (error) {
      toast(error instanceof Error ? error.message : '할 일을 추가하지 못했어요.', 'error');
    } finally {
      setAdding(false);
    }
  };

  const toggle = async (id: string, done: boolean, title: string) => {
    await setTaskDone(id, done);
    if (!done) toast(`🎉 '${title}' 완료! 잘하고 있어요.`, 'success');
  };

  return (
    <div className="space-y-4 pt-4">
      {/* 과목별 오늘 공부 시간 */}
      <section className="app-card p-4">
        <div className="section-title mb-3">
          <span>오늘 과목별 공부시간</span>
          <span className="text-[11px] font-bold normal-case tracking-normal text-cyan-200">
            합계 {formatDuration(todayTotals.totalSeconds)}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {SUBJECTS.map((s) => {
            const seconds = todayTotals.bySubject[s.id] ?? 0;
            const width = Math.round((seconds / maxSubjectSeconds) * 100);
            return (
              <div key={s.id} className="rounded-2xl border border-white/10 bg-white/[0.035] px-3 py-2.5">
                <div className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: s.color }} />
                  <span className="text-[12px] font-semibold text-slate-300">{s.label}</span>
                </div>
                <p className="mt-1.5 text-[15px] font-extrabold text-white">
                  {seconds > 0 ? formatDuration(seconds) : '0분'}
                </p>
                <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${width}%`, backgroundColor: s.color }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 오늘의 할 일 입력 */}
      <section className="app-card p-4">
        <div className="section-title mb-3">
          <span>오늘의 할 일</span>
          <span className="text-[11px] font-semibold normal-case tracking-normal text-slate-400">
            남은 {remaining}개 · 완료 {doneCount}개
          </span>
        </div>

        <form onSubmit={submit} className="space-y-2.5">
          <div className="flex items-center gap-2">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="예) 수학 기출 10문제 풀기"
              maxLength={80}
              className="field flex-1 py-2.5"
              aria-label="할 일"
            />
            <button
              type="submit"
              disabled={!draft.trim() || adding}
              aria-label="할 일 추가"
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gradient-to-br from-cyan-300 to-teal-300 text-night-950 shadow-glow transition hover:brightness-105 disabled:opacity-45"
            >
              <Plus className="h-5 w-5" strokeWidth={2.8} />
            </button>
          </div>

          {/* 과목 태그: 6개가 잘리지 않고 두 줄로 고르게 배치된다 */}
          <div className="grid grid-cols-3 gap-1.5">
            {SUBJECTS.map((s) => {
              const selected = s.id === subject;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSubject(s.id)}
                  aria-pressed={selected}
                  className={`flex h-9 min-w-0 items-center justify-center gap-1.5 rounded-xl border px-1.5 text-[12.5px] font-semibold transition ${
                    selected
                      ? 'text-white'
                      : 'border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/[0.07]'
                  }`}
                  style={
                    selected
                      ? { borderColor: `${s.color}80`, backgroundColor: `${s.color}22` }
                      : undefined
                  }
                >
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: s.color }} />
                  <span className="truncate">{s.label}</span>
                </button>
              );
            })}
          </div>
        </form>

        {tasks.length > 0 && (
          <div className="mt-3.5">
            <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-teal-300 transition-all duration-500"
                style={{ width: `${completion}%` }}
              />
            </div>
            <p className="mt-1.5 text-right text-[11px] font-semibold text-slate-500">
              오늘 할 일 {completion}% 완료
            </p>
          </div>
        )}
      </section>

      {/* 과목별 그룹 */}
      {grouped.length === 0 ? (
        <section className="app-card flex flex-col items-center px-4 py-10 text-center">
          <CircleCheckBig className="h-9 w-9 text-slate-600" />
          <p className="mt-3 text-[14px] font-bold text-slate-200">아직 오늘 할 일이 없어요</p>
          <p className="mt-1 text-[12px] leading-relaxed text-slate-500">
            공부할 내용을 적고 과목을 골라 추가해 보세요.
            <br />
            타이머로 공부한 시간은 통계 탭에 쌓여요.
          </p>
        </section>
      ) : (
        <div className="space-y-2.5">
          {grouped.map(({ subject: s, items }) => {
            const done = items.filter((t) => t.done).length;
            return (
              <section key={s.id} className="app-card overflow-hidden">
                <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
                    <span className="text-[13px] font-bold text-slate-200">{s.label}</span>
                  </div>
                  <span
                    className="rounded-full px-2 py-0.5 text-[10.5px] font-bold"
                    style={{ backgroundColor: `${s.color}1f`, color: s.color }}
                  >
                    {done === items.length ? '모두 완료' : `남은 ${items.length - done}개`}
                  </span>
                </div>
                <ul className="divide-y divide-white/[0.05]">
                  {items.map((task) => (
                    <li key={task.id} className="flex items-center gap-3 px-4 py-2.5">
                      <button
                        type="button"
                        onClick={() => void toggle(task.id, !task.done, task.title)}
                        aria-label={task.done ? '완료 취소' : '완료 표시'}
                        aria-pressed={task.done}
                        className="grid h-6 w-6 shrink-0 place-items-center rounded-full border transition active:scale-95"
                        style={
                          task.done
                            ? { backgroundColor: s.color, borderColor: s.color }
                            : { borderColor: 'rgba(148,163,184,0.45)' }
                        }
                      >
                        {task.done && <Check className="h-3.5 w-3.5 text-night-950" strokeWidth={3.2} />}
                      </button>
                      <span
                        className={`min-w-0 flex-1 break-words text-[13.5px] leading-snug ${
                          task.done ? 'text-slate-500 line-through' : 'text-slate-100'
                        }`}
                      >
                        {task.title}
                      </span>
                      <button
                        type="button"
                        onClick={() => void deleteTask(task.id)}
                        aria-label="할 일 삭제"
                        className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-slate-500 transition hover:bg-white/[0.06] hover:text-rose-300"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
