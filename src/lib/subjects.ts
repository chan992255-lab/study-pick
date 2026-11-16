import type { SubjectId, TimerMode } from './types';

export interface SubjectMeta {
  id: SubjectId;
  label: string;
  color: string;
  hint: string;
}

export const SUBJECTS: SubjectMeta[] = [
  { id: 'korean', label: '국어', color: '#fb7185', hint: '문학 · 독서 · 화법과 작문' },
  { id: 'math', label: '수학', color: '#38bdf8', hint: '공통수학 · 대수 · 미적분' },
  { id: 'english', label: '영어', color: '#fbbf24', hint: '영어 · 영어Ⅰ·Ⅱ' },
  { id: 'social', label: '통합사회', color: '#a78bfa', hint: '통합사회1·2' },
  { id: 'science', label: '통합과학', color: '#34d399', hint: '통합과학1·2' },
  { id: 'etc', label: '기타', color: '#94a3b8', hint: '탐구 · 수행 · 정리' },
];

export function subjectOf(id: SubjectId | string): SubjectMeta {
  return SUBJECTS.find((s) => s.id === id) ?? SUBJECTS[SUBJECTS.length - 1];
}

export interface ModeMeta {
  id: TimerMode;
  label: string;
  short: string;
  minutes: number;
}

export const MODES: ModeMeta[] = [
  { id: 'pomodoro25', label: '뽀모도로 25분', short: '뽀모도로 25', minutes: 25 },
  { id: 'pomodoro50', label: '뽀모도로 50분', short: '뽀모도로 50', minutes: 50 },
  { id: 'stopwatch', label: '스톱워치', short: '스톱워치', minutes: 0 },
];

export function modeOf(id: TimerMode | string): ModeMeta {
  return MODES.find((m) => m.id === id) ?? MODES[0];
}

/** 모드의 목표 시간(초). 스톱워치는 0. */
export function modeTargetSeconds(mode: TimerMode): number {
  return modeOf(mode).minutes * 60;
}
