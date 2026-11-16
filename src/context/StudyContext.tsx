import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { DEFAULT_SETTINGS, type Snapshot, type StudySession, type StudySettings, type StudyTask } from '../lib/types';
import { createAccountStore, guestStore, type NewSessionInput, type NewTaskInput, type StudyStore } from '../lib/store';
import { clearGuestData, guestHasData, readGuestData } from '../lib/local-store';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

interface PendingImport {
  sessions: number;
  tasks: number;
}

interface StudyValue {
  mode: 'guest' | 'account';
  sessions: StudySession[];
  tasks: StudyTask[];
  settings: StudySettings;
  loading: boolean;
  loadError: string | null;
  addSession: (input: NewSessionInput) => Promise<StudySession>;
  deleteSession: (id: string) => Promise<void>;
  addTask: (input: NewTaskInput) => Promise<StudyTask>;
  setTaskDone: (id: string, done: boolean) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  setWeeklyGoal: (hours: number) => Promise<void>;
  setNickname: (nickname: string) => Promise<void>;
  pendingImport: PendingImport | null;
  importGuestData: () => Promise<void>;
  discardGuestData: () => void;
  refresh: () => Promise<void>;
}

const StudyContext = createContext<StudyValue | null>(null);

const EMPTY_GUEST: Snapshot = {
  sessions: [],
  tasks: [],
  settings: { ...DEFAULT_SETTINGS, nickname: '체험 중인 학생' },
};

export function StudyProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { toast } = useToast();

  const store = useMemo<StudyStore>(() => {
    if (user) {
      try {
        return createAccountStore(user.id);
      } catch {
        return guestStore;
      }
    }
    return guestStore;
  }, [user]);

  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [tasks, setTasks] = useState<StudyTask[]>([]);
  const [settings, setSettings] = useState<StudySettings>(EMPTY_GUEST.settings);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [pendingImport, setPendingImport] = useState<PendingImport | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const snapshot = await store.load();
      setSessions(snapshot.sessions);
      setTasks(snapshot.tasks);
      setSettings(snapshot.settings);
    } catch (error) {
      const message = error instanceof Error ? error.message : '데이터를 불러오지 못했어요.';
      setLoadError(message);
      setSessions([]);
      setTasks([]);
      setSettings(EMPTY_GUEST.settings);
    } finally {
      setLoading(false);
    }
  }, [store]);

  useEffect(() => {
    void load();
  }, [load]);

  // 로그인하면 이 기기의 체험 기록이 있는지 살펴보고, 있으면 가져올지 물어본다.
  useEffect(() => {
    if (!user || store.mode !== 'account') {
      setPendingImport(null);
      return;
    }
    const guest = readGuestData();
    if (guest.sessions.length > 0 || guest.tasks.length > 0) {
      setPendingImport({ sessions: guest.sessions.length, tasks: guest.tasks.length });
    } else {
      setPendingImport(null);
    }
  }, [user, store]);

  const addSession = useCallback(
    async (input: NewSessionInput) => {
      const saved = await store.addSession(input);
      setSessions((prev) => [saved, ...prev]);
      return saved;
    },
    [store],
  );

  const deleteSession = useCallback(
    async (id: string) => {
      const before = sessions;
      setSessions((prev) => prev.filter((s) => s.id !== id));
      try {
        await store.deleteSession(id);
      } catch (error) {
        setSessions(before);
        toast(error instanceof Error ? error.message : '기록을 삭제하지 못했어요.', 'error');
      }
    },
    [store, sessions, toast],
  );

  const addTask = useCallback(
    async (input: NewTaskInput) => {
      const saved = await store.addTask(input);
      setTasks((prev) => [...prev, saved]);
      return saved;
    },
    [store],
  );

  const setTaskDone = useCallback(
    async (id: string, done: boolean) => {
      const completedAt = done ? new Date().toISOString() : null;
      setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done, completedAt } : t)));
      try {
        await store.setTaskDone(id, done);
      } catch (error) {
        setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !done } : t)));
        toast(error instanceof Error ? error.message : '할 일을 바꾸지 못했어요.', 'error');
      }
    },
    [store, toast],
  );

  const deleteTask = useCallback(
    async (id: string) => {
      const before = tasks;
      setTasks((prev) => prev.filter((t) => t.id !== id));
      try {
        await store.deleteTask(id);
      } catch (error) {
        setTasks(before);
        toast(error instanceof Error ? error.message : '할 일을 삭제하지 못했어요.', 'error');
      }
    },
    [store, tasks, toast],
  );

  const setWeeklyGoal = useCallback(
    async (hours: number) => {
      const next = { ...settings, weeklyGoalHours: hours };
      setSettings(next);
      try {
        await store.saveSettings(next);
      } catch (error) {
        toast(error instanceof Error ? error.message : '목표를 저장하지 못했어요.', 'error');
      }
    },
    [settings, store, toast],
  );

  const setNickname = useCallback(
    async (nickname: string) => {
      const trimmed = nickname.trim();
      if (!trimmed) return;
      const next = { ...settings, nickname: trimmed };
      setSettings(next);
      try {
        await store.saveSettings(next);
        toast('닉네임을 저장했어요.', 'success');
      } catch (error) {
        toast(error instanceof Error ? error.message : '닉네임을 저장하지 못했어요.', 'error');
      }
    },
    [settings, store, toast],
  );

  const importGuestData = useCallback(async () => {
    const guest = readGuestData();
    try {
      await store.importData({ sessions: guest.sessions, tasks: guest.tasks });
      clearGuestData();
      setPendingImport(null);
      await load();
      toast('체험 기록을 계정으로 가져왔어요.', 'success');
    } catch (error) {
      toast(error instanceof Error ? error.message : '체험 기록을 가져오지 못했어요.', 'error');
    }
  }, [store, load, toast]);

  const discardGuestData = useCallback(() => {
    clearGuestData();
    setPendingImport(null);
  }, []);

  const value = useMemo<StudyValue>(
    () => ({
      mode: store.mode,
      sessions,
      tasks,
      settings,
      loading,
      loadError,
      addSession,
      deleteSession,
      addTask,
      setTaskDone,
      deleteTask,
      setWeeklyGoal,
      setNickname,
      pendingImport,
      importGuestData,
      discardGuestData,
      refresh: load,
    }),
    [
      store.mode,
      sessions,
      tasks,
      settings,
      loading,
      loadError,
      addSession,
      deleteSession,
      addTask,
      setTaskDone,
      deleteTask,
      setWeeklyGoal,
      setNickname,
      pendingImport,
      importGuestData,
      discardGuestData,
      load,
    ],
  );

  return <StudyContext.Provider value={value}>{children}</StudyContext.Provider>;
}

export function useStudy(): StudyValue {
  const ctx = useContext(StudyContext);
  if (!ctx) throw new Error('StudyProvider 안에서만 useStudy 를 쓸 수 있습니다.');
  return ctx;
}

export { guestHasData };
