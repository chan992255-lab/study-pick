export type SubjectId = 'korean' | 'math' | 'english' | 'social' | 'science' | 'etc';

export type TimerMode = 'pomodoro25' | 'pomodoro50' | 'stopwatch';

/** 한 번의 공부 기록. Supabase 의 public.study_sessions 한 행과 같다. */
export interface StudySession {
  id: string;
  subject: SubjectId;
  mode: TimerMode;
  seconds: number;
  startedAt: string; // ISO 8601
  endedAt: string; // ISO 8601
}

/** 과목별 할 일. Supabase 의 public.study_tasks 한 행과 같다. */
export interface StudyTask {
  id: string;
  title: string;
  subject: SubjectId;
  done: boolean;
  createdAt: string;
  completedAt: string | null;
}

/** 사용자 설정. Supabase 의 public.study_settings 한 행과 같다. */
export interface StudySettings {
  nickname: string;
  weeklyGoalHours: number;
}

export interface Snapshot {
  sessions: StudySession[];
  tasks: StudyTask[];
  settings: StudySettings;
}

export const DEFAULT_SETTINGS: StudySettings = {
  nickname: '학생',
  weeklyGoalHours: 20,
};
