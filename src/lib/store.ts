import { DEFAULT_SETTINGS, type Snapshot, type StudySession, type StudySettings, type StudyTask, type SubjectId, type TimerMode } from './types';
import { newId, readGuestData, writeGuestData } from './local-store';
import { supabase } from './supabase';

export interface NewSessionInput {
  subject: SubjectId;
  mode: TimerMode;
  seconds: number;
  startedAt: string;
  endedAt: string;
}

export interface NewTaskInput {
  title: string;
  subject: SubjectId;
}

export interface StudyStore {
  mode: 'guest' | 'account';
  load(): Promise<Snapshot>;
  addSession(input: NewSessionInput): Promise<StudySession>;
  deleteSession(id: string): Promise<void>;
  addTask(input: NewTaskInput): Promise<StudyTask>;
  setTaskDone(id: string, done: boolean): Promise<void>;
  deleteTask(id: string): Promise<void>;
  saveSettings(patch: Partial<StudySettings>): Promise<StudySettings>;
  importData(data: { sessions: StudySession[]; tasks: StudyTask[] }): Promise<void>;
}

/** 로그인하지 않았을 때: 브라우저 저장소에만 저장하는 체험 모드. */
export const guestStore: StudyStore = {
  mode: 'guest',

  async load() {
    return readGuestData();
  },

  async addSession(input) {
    const data = readGuestData();
    const session: StudySession = { id: newId(), ...input };
    data.sessions = [session, ...data.sessions];
    writeGuestData(data);
    return session;
  },

  async deleteSession(id) {
    const data = readGuestData();
    data.sessions = data.sessions.filter((s) => s.id !== id);
    writeGuestData(data);
  },

  async addTask(input) {
    const data = readGuestData();
    const task: StudyTask = {
      id: newId(),
      title: input.title,
      subject: input.subject,
      done: false,
      createdAt: new Date().toISOString(),
      completedAt: null,
    };
    data.tasks = [...data.tasks, task];
    writeGuestData(data);
    return task;
  },

  async setTaskDone(id, done) {
    const data = readGuestData();
    data.tasks = data.tasks.map((t) =>
      t.id === id ? { ...t, done, completedAt: done ? new Date().toISOString() : null } : t,
    );
    writeGuestData(data);
  },

  async deleteTask(id) {
    const data = readGuestData();
    data.tasks = data.tasks.filter((t) => t.id !== id);
    writeGuestData(data);
  },

  async saveSettings(patch) {
    const data = readGuestData();
    data.settings = { ...data.settings, ...patch };
    writeGuestData(data);
    return data.settings;
  },

  async importData() {
    // 체험 모드에서는 이미 같은 저장소에 있으므로 할 일이 없다.
  },
};

interface SessionRow {
  id: string;
  subject: string;
  mode: string;
  seconds: number;
  started_at: string;
  ended_at: string;
}

interface TaskRow {
  id: string;
  title: string;
  subject: string;
  done: boolean;
  created_at: string;
  completed_at: string | null;
}

interface SettingsRow {
  nickname: string | null;
  weekly_goal_hours: number | null;
}

function toSession(row: SessionRow): StudySession {
  return {
    id: row.id,
    subject: row.subject as SubjectId,
    mode: row.mode as TimerMode,
    seconds: row.seconds,
    startedAt: row.started_at,
    endedAt: row.ended_at,
  };
}

function toTask(row: TaskRow): StudyTask {
  return {
    id: row.id,
    title: row.title,
    subject: row.subject as SubjectId,
    done: row.done,
    createdAt: row.created_at,
    completedAt: row.completed_at,
  };
}

function fail(context: string, message: string | undefined): never {
  throw new Error(`${context}: ${message ?? '알 수 없는 오류'}`);
}

/** 로그인한 사용자: Supabase 에 저장해 다른 기기에서도 이어진다. */
export function createAccountStore(userId: string): StudyStore {
  if (!supabase) {
    throw new Error('Supabase 설정이 없습니다.');
  }
  const db = supabase;

  return {
    mode: 'account',

    async load() {
      const [sessionsRes, tasksRes, settingsRes] = await Promise.all([
        db
          .from('study_sessions')
          .select('id,subject,mode,seconds,started_at,ended_at')
          .eq('user_id', userId)
          .order('ended_at', { ascending: false })
          .limit(1000),
        db
          .from('study_tasks')
          .select('id,title,subject,done,created_at,completed_at')
          .eq('user_id', userId)
          .order('created_at', { ascending: true })
          .limit(500),
        db
          .from('study_settings')
          .select('nickname,weekly_goal_hours')
          .eq('user_id', userId)
          .maybeSingle(),
      ]);

      if (sessionsRes.error) fail('공부 기록을 불러오지 못했어요', sessionsRes.error.message);
      if (tasksRes.error) fail('할 일을 불러오지 못했어요', tasksRes.error.message);
      if (settingsRes.error) fail('설정을 불러오지 못했어요', settingsRes.error.message);

      const settingsRow = settingsRes.data as SettingsRow | null;
      return {
        sessions: ((sessionsRes.data ?? []) as SessionRow[]).map(toSession),
        tasks: ((tasksRes.data ?? []) as TaskRow[]).map(toTask),
        settings: {
          nickname: settingsRow?.nickname || '학생',
          weeklyGoalHours:
            typeof settingsRow?.weekly_goal_hours === 'number'
              ? settingsRow.weekly_goal_hours
              : DEFAULT_SETTINGS.weeklyGoalHours,
        },
      };
    },

    async addSession(input) {
      const { data, error } = await db
        .from('study_sessions')
        .insert({
          user_id: userId,
          subject: input.subject,
          mode: input.mode,
          seconds: Math.round(input.seconds),
          started_at: input.startedAt,
          ended_at: input.endedAt,
        })
        .select('id,subject,mode,seconds,started_at,ended_at')
        .single();
      if (error) fail('기록을 저장하지 못했어요', error.message);
      return toSession(data as SessionRow);
    },

    async deleteSession(id) {
      const { error } = await db
        .from('study_sessions')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);
      if (error) fail('기록을 삭제하지 못했어요', error.message);
    },

    async addTask(input) {
      const { data, error } = await db
        .from('study_tasks')
        .insert({ user_id: userId, title: input.title, subject: input.subject })
        .select('id,title,subject,done,created_at,completed_at')
        .single();
      if (error) fail('할 일을 저장하지 못했어요', error.message);
      return toTask(data as TaskRow);
    },

    async setTaskDone(id, done) {
      const { error } = await db
        .from('study_tasks')
        .update({ done, completed_at: done ? new Date().toISOString() : null })
        .eq('id', id)
        .eq('user_id', userId);
      if (error) fail('할 일을 바꾸지 못했어요', error.message);
    },

    async deleteTask(id) {
      const { error } = await db.from('study_tasks').delete().eq('id', id).eq('user_id', userId);
      if (error) fail('할 일을 삭제하지 못했어요', error.message);
    },

    async saveSettings(patch) {
      const next: StudySettings = {
        nickname: patch.nickname ?? '학생',
        weeklyGoalHours: patch.weeklyGoalHours ?? DEFAULT_SETTINGS.weeklyGoalHours,
      };
      const { error } = await db.from('study_settings').upsert(
        {
          user_id: userId,
          nickname: next.nickname,
          weekly_goal_hours: next.weeklyGoalHours,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' },
      );
      if (error) fail('설정을 저장하지 못했어요', error.message);
      return next;
    },

    async importData(data) {
      if (data.sessions.length > 0) {
        const { error } = await db.from('study_sessions').insert(
          data.sessions.map((s) => ({
            user_id: userId,
            subject: s.subject,
            mode: s.mode,
            seconds: Math.round(s.seconds),
            started_at: s.startedAt,
            ended_at: s.endedAt,
          })),
        );
        if (error) fail('체험 기록을 가져오지 못했어요', error.message);
      }
      if (data.tasks.length > 0) {
        const { error } = await db.from('study_tasks').insert(
          data.tasks.map((t) => ({
            user_id: userId,
            title: t.title,
            subject: t.subject,
            done: t.done,
            created_at: t.createdAt,
            completed_at: t.completedAt,
          })),
        );
        if (error) fail('체험 할 일을 가져오지 못했어요', error.message);
      }
    },
  };
}
