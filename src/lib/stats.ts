import { addDays, dayKey, startOfDay, startOfWeek } from './format';
import type { StudySession, SubjectId } from './types';
import { SUBJECTS } from './subjects';

export interface RangeTotals {
  totalSeconds: number;
  count: number;
  bySubject: Record<SubjectId, number>;
}

export function emptyBySubject(): Record<SubjectId, number> {
  const out = {} as Record<SubjectId, number>;
  for (const s of SUBJECTS) out[s.id] = 0;
  return out;
}

export function sessionsBetween(sessions: StudySession[], from: Date, to: Date): StudySession[] {
  const a = from.getTime();
  const b = to.getTime();
  return sessions.filter((s) => {
    const t = new Date(s.endedAt).getTime();
    return t >= a && t < b;
  });
}

export function totals(sessions: StudySession[]): RangeTotals {
  const bySubject = emptyBySubject();
  let totalSeconds = 0;
  for (const s of sessions) {
    totalSeconds += s.seconds;
    bySubject[s.subject] = (bySubject[s.subject] ?? 0) + s.seconds;
  }
  return { totalSeconds, count: sessions.length, bySubject };
}

export function todaySessions(sessions: StudySession[], now: Date = new Date()): StudySession[] {
  return sessionsBetween(sessions, startOfDay(now), addDays(startOfDay(now), 1));
}

export function weekSessions(sessions: StudySession[], now: Date = new Date()): StudySession[] {
  const start = startOfWeek(now);
  return sessionsBetween(sessions, start, addDays(start, 7));
}

/** 이번 주 월~일 각 요일의 공부 시간(초). */
export function weekDayTotals(sessions: StudySession[], now: Date = new Date()): number[] {
  const start = startOfWeek(now);
  const out = new Array<number>(7).fill(0);
  for (let i = 0; i < 7; i += 1) {
    const day = addDays(start, i);
    out[i] = sessionsBetween(sessions, day, addDays(day, 1)).reduce((sum, s) => sum + s.seconds, 0);
  }
  return out;
}

/**
 * 연속 공부일. 오늘(또는 아직 오늘 기록이 없으면 어제)부터 거슬러 올라가며
 * 기록이 있는 날이 며칠 이어졌는지 센다.
 */
export function streakDays(sessions: StudySession[], now: Date = new Date()): number {
  const days = new Set(sessions.map((s) => dayKey(new Date(s.endedAt))));
  if (days.size === 0) return 0;

  let cursor = startOfDay(now);
  if (!days.has(dayKey(cursor))) {
    cursor = addDays(cursor, -1);
    if (!days.has(dayKey(cursor))) return 0;
  }

  let streak = 0;
  while (days.has(dayKey(cursor))) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}
