import { useEffect, useState } from 'react';
import { Loader2, LockKeyhole, Mail, Sparkles, UserRound, X } from 'lucide-react';
import { authErrorMessage, useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

interface AuthModalProps {
  open: boolean;
  initialMode?: 'login' | 'signup';
  onClose: () => void;
}

export function AuthModal({ open, initialMode = 'signup', onClose }: AuthModalProps) {
  const { signIn, signUp, configured } = useAuth();
  const { toast } = useToast();

  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setMode(initialMode);
      setError(null);
      setBusy(false);
    }
  }, [open, initialMode]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    const trimmedEmail = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError('이메일 형식이 올바르지 않아요. 예) studypick@example.com');
      return;
    }
    if (password.length < 6) {
      setError('비밀번호는 6자 이상으로 만들어 주세요.');
      return;
    }
    if (mode === 'signup' && nickname.trim().length < 2) {
      setError('닉네임은 2자 이상 입력해 주세요.');
      return;
    }

    setBusy(true);
    try {
      if (mode === 'signup') {
        const { needsConfirm } = await signUp(trimmedEmail, password, nickname);
        if (needsConfirm) {
          toast('인증 메일을 보냈어요. 메일 확인 후 로그인해 주세요.', 'default');
        } else {
          toast(`환영해요, ${nickname.trim()}님! 이제 기록이 계정에 저장돼요.`, 'success');
        }
      } else {
        await signIn(trimmedEmail, password);
        toast('로그인했어요. 어느 기기에서든 이어서 공부할 수 있어요.', 'success');
      }
      setNickname('');
      setEmail('');
      setPassword('');
      onClose();
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="absolute inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label="닫기"
        onClick={onClose}
        className="absolute inset-0 bg-night-950/80 backdrop-blur-sm"
      />
      <div className="relative w-full animate-slide-up rounded-t-[28px] border border-white/10 bg-night-850 px-5 pb-6 pt-4 shadow-[0_-20px_60px_-20px_rgba(0,0,0,0.9)] sm:max-w-[400px] sm:rounded-[28px]">
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/15 sm:hidden" />
        <button
          type="button"
          onClick={onClose}
          aria-label="닫기"
          className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full text-slate-400 transition hover:bg-white/10 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="mb-4 pr-8">
          <h2 className="text-[19px] font-extrabold text-white">
            {mode === 'signup' ? '스터디픽 시작하기' : '다시 오셨네요'}
          </h2>
          <p className="mt-1 text-[13px] leading-relaxed text-slate-400">
            로그인하면 공부 기록·할 일·목표가 계정에 저장돼
            <br className="hidden sm:block" /> 다른 기기에서도 그대로 이어져요.
          </p>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-1 rounded-2xl bg-night-900/80 p-1">
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setError(null);
            }}
            className={`tab-btn ${mode === 'signup' ? 'bg-white/10 text-white' : 'text-slate-400'}`}
          >
            회원가입
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError(null);
            }}
            className={`tab-btn ${mode === 'login' ? 'bg-white/10 text-white' : 'text-slate-400'}`}
          >
            로그인
          </button>
        </div>

        <form onSubmit={submit} className="space-y-3">
          {mode === 'signup' && (
            <div>
              <label className="label" htmlFor="auth-nickname">
                닉네임
              </label>
              <div className="relative">
                <UserRound className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  id="auth-nickname"
                  className="field pl-10"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="예) 공부하는 수학러"
                  maxLength={12}
                  autoComplete="nickname"
                />
              </div>
            </div>
          )}

          <div>
            <label className="label" htmlFor="auth-email">
              이메일
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                id="auth-email"
                className="field pl-10"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="studypick@example.com"
                autoComplete="email"
                inputMode="email"
              />
            </div>
          </div>

          <div>
            <label className="label" htmlFor="auth-password">
              비밀번호
            </label>
            <div className="relative">
              <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                id="auth-password"
                className="field pl-10"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="6자 이상"
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              />
            </div>
          </div>

          {error && (
            <p className="rounded-xl border border-rose-400/25 bg-rose-500/10 px-3 py-2 text-[12.5px] font-medium leading-relaxed text-rose-200">
              {error}
            </p>
          )}

          {!configured && (
            <p className="rounded-xl border border-amber-400/25 bg-amber-500/10 px-3 py-2 text-[12.5px] text-amber-200">
              지금은 서버 설정이 없어 로그인을 쓸 수 없어요. 체험 모드로 계속 이용해 주세요.
            </p>
          )}

          <button type="submit" disabled={busy || !configured} className="btn-primary mt-1 w-full">
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" strokeWidth={2.4} />
            )}
            {mode === 'signup' ? '5초 만에 가입하고 시작' : '로그인'}
          </button>
        </form>

        <button
          type="button"
          onClick={onClose}
          className="mt-3 w-full py-2 text-[12.5px] font-semibold text-slate-500 transition hover:text-slate-300"
        >
          로그인 없이 체험 모드로 계속하기
        </button>
      </div>
    </div>
  );
}
