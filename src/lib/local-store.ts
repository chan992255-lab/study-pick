import { DEFAULT_SETTINGS, type Snapshot } from './types';

const KEY = 'studypick.guest.v1';

const EMPTY: Snapshot = {
  sessions: [],
  tasks: [],
  settings: { ...DEFAULT_SETTINGS, nickname: '체험 중인 학생' },
};

interface StoredShape {
  sessions: Snapshot['sessions'];
  tasks: Snapshot['tasks'];
  settings: { nickname?: string; weeklyGoalHours?: number };
}

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

/** 체험(비로그인) 모드 데이터를 읽는다. 이 기기의 브라우저 저장소에만 남는다. */
export function readGuestData(): Snapshot {
  if (!isBrowser()) return { ...EMPTY, sessions: [], tasks: [], settings: { ...EMPTY.settings } };
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return { ...EMPTY, sessions: [], tasks: [], settings: { ...EMPTY.settings } };
    const parsed = JSON.parse(raw) as Partial<StoredShape>;
    return {
      sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
      tasks: Array.isArray(parsed.tasks) ? parsed.tasks : [],
      settings: {
        nickname: parsed.settings?.nickname || EMPTY.settings.nickname,
        weeklyGoalHours:
          typeof parsed.settings?.weeklyGoalHours === 'number'
            ? parsed.settings.weeklyGoalHours
            : EMPTY.settings.weeklyGoalHours,
      },
    };
  } catch {
    return { ...EMPTY, sessions: [], tasks: [], settings: { ...EMPTY.settings } };
  }
}

export function writeGuestData(data: Snapshot): void {
  if (!isBrowser()) return;
  const payload: StoredShape = {
    sessions: data.sessions,
    tasks: data.tasks,
    settings: data.settings,
  };
  try {
    window.localStorage.setItem(KEY, JSON.stringify(payload));
  } catch {
    /* 저장 공간이 가득 찬 경우는 조용히 넘어간다. */
  }
}

export function clearGuestData(): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* 무시 */
  }
}

export function guestHasData(): boolean {
  const data = readGuestData();
  return data.sessions.length > 0 || data.tasks.length > 0;
}

export function newId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
}
