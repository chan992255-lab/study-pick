export const WEEKDAY_LABELS = ['월', '화', '수', '목', '금', '토', '일'];

export function pad2(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

/** 로컬 시간대 기준 날짜 키 (YYYY-MM-DD). */
export function dayKey(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export function startOfDay(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export function addDays(d: Date, days: number): Date {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + days);
  return copy;
}

/** 월요일 00:00 을 한 주의 시작으로 본다. */
export function startOfWeek(d: Date): Date {
  const base = startOfDay(d);
  const offset = (base.getDay() + 6) % 7; // 월=0 … 일=6
  return addDays(base, -offset);
}

export function weekdayIndex(d: Date): number {
  return (d.getDay() + 6) % 7;
}

/** 카운트다운·스톱워치 표시: 1시간 미만은 MM:SS, 이상은 H:MM:SS */
export function formatTimer(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return h > 0 ? `${h}:${pad2(m)}:${pad2(sec)}` : `${pad2(m)}:${pad2(sec)}`;
}

/** 공부 시간 요약: 28초 / 25분 / 1시간 15분 */
export function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0 && m > 0) return `${h}시간 ${m}분`;
  if (h > 0) return `${h}시간`;
  if (m > 0) return `${m}분`;
  if (s > 0) return `${s}초`;
  return '0분';
}

/** 막대·목표 카드용 짧은 표기: 1.3h */
export function formatHours(seconds: number): string {
  const h = seconds / 3600;
  if (h > 0 && h < 0.1) return `${h.toFixed(2)}h`;
  return `${h.toFixed(1)}h`;
}

/** 기록 목록의 시각 표기: 오늘 · 오후 6:24 */
export function formatSessionTime(iso: string, now: Date = new Date()): string {
  const d = new Date(iso);
  const time = d.toLocaleTimeString('ko-KR', { hour: 'numeric', minute: '2-digit' });
  const diffDays = Math.round((startOfDay(now).getTime() - startOfDay(d).getTime()) / 86400000);
  if (diffDays === 0) return `오늘 · ${time}`;
  if (diffDays === 1) return `어제 · ${time}`;
  if (diffDays > 1 && diffDays < 7) return `${WEEKDAY_LABELS[weekdayIndex(d)]}요일 · ${time}`;
  return `${d.getMonth() + 1}월 ${d.getDate()}일 · ${time}`;
}

/** 헤더 날짜 표기: 11월 16일 월요일 */
export function formatToday(d: Date = new Date()): string {
  return `${d.getMonth() + 1}월 ${d.getDate()}일 ${
    ['일', '월', '화', '수', '목', '금', '토'][d.getDay()]
  }요일`;
}

export function percent(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((part / whole) * 100)));
}

export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}
