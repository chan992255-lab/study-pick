import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

interface AuthValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  configured: boolean;
  signUp: (email: string, password: string, nickname: string) => Promise<{ needsConfirm: boolean }>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateNickname: (nickname: string) => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

const MESSAGES: { match: RegExp; message: string }[] = [
  { match: /Invalid login credentials/i, message: '이메일 또는 비밀번호가 맞지 않아요.' },
  { match: /Email not confirmed/i, message: '이메일 인증이 아직 끝나지 않았어요. 메일함을 확인해 주세요.' },
  { match: /User already registered/i, message: '이미 가입된 이메일이에요. 로그인해 주세요.' },
  { match: /Password should be at least (\d+) characters/i, message: '비밀번호는 6자 이상으로 만들어 주세요.' },
  { match: /Unable to validate email address|invalid format/i, message: '이메일 형식이 올바르지 않아요.' },
  { match: /Signups not allowed|signup is disabled/i, message: '지금은 새로 가입할 수 없어요. 잠시 후 다시 시도해 주세요.' },
  { match: /rate limit|too many requests|after \d+ seconds/i, message: '요청이 너무 잦았어요. 잠시 후 다시 시도해 주세요.' },
  { match: /Database error saving new user/i, message: '가입 처리 중 문제가 생겼어요. 잠시 후 다시 시도해 주세요.' },
  { match: /network|Failed to fetch/i, message: '인터넷 연결을 확인하고 다시 시도해 주세요.' },
];

export function authErrorMessage(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error ?? '');
  for (const item of MESSAGES) {
    if (item.match.test(raw)) return item.message;
  }
  return raw || '알 수 없는 오류가 발생했어요.';
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    let alive = true;
    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!alive) return;
        setSession(data.session ?? null);
        setLoading(false);
      })
      .catch(() => {
        if (alive) setLoading(false);
      });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
    });
    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const signUp = useCallback(async (email: string, password: string, nickname: string) => {
    if (!supabase) throw new Error('로그인 기능을 쓸 수 없어요.');
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { nickname: nickname.trim() } },
    });
    if (error) throw error;
    return { needsConfirm: !data.session };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    if (!supabase) throw new Error('로그인 기능을 쓸 수 없어요.');
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) throw error;
  }, []);

  const signOut = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
  }, []);

  const updateNickname = useCallback(async (nickname: string) => {
    if (!supabase) return;
    const { error } = await supabase.auth.updateUser({ data: { nickname: nickname.trim() } });
    if (error) throw error;
  }, []);

  const value = useMemo<AuthValue>(
    () => ({
      user: session?.user ?? null,
      session,
      loading,
      configured: isSupabaseConfigured,
      signUp,
      signIn,
      signOut,
      updateNickname,
    }),
    [session, loading, signUp, signIn, signOut, updateNickname],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('AuthProvider 안에서만 useAuth 를 쓸 수 있습니다.');
  return ctx;
}
