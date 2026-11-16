import { LogIn, UserRound } from 'lucide-react';
import { Logo } from './Logo';
import { useAuth } from '../context/AuthContext';
import { useStudy } from '../context/StudyContext';
import { formatDuration } from '../lib/format';

interface HeaderProps {
  todaySeconds: number;
  onOpenAuth: () => void;
  onOpenProfile: () => void;
}

export function Header({ todaySeconds, onOpenAuth, onOpenProfile }: HeaderProps) {
  const { user } = useAuth();
  const { mode } = useStudy();

  return (
    <header className="z-20 flex items-center justify-between gap-2 border-b border-white/[0.06] bg-night-900/80 px-4 py-3 backdrop-blur-xl">
      <Logo />
      <div className="flex items-center gap-2">
        <div className="hidden items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-[12px] font-semibold text-slate-300 xs:flex">
          <span className="h-1.5 w-1.5 rounded-full bg-cyan-300" />
          오늘 {formatDuration(todaySeconds)}
        </div>
        {user ? (
          <button
            type="button"
            onClick={onOpenProfile}
            aria-label="내 프로필"
            className="flex h-9 items-center gap-1.5 rounded-full border border-cyan-400/30 bg-cyan-400/10 pl-2.5 pr-3 text-[12px] font-bold text-cyan-200 transition hover:bg-cyan-400/20"
          >
            <UserRound className="h-4 w-4" />
            <span className="max-w-[72px] truncate">{mode === 'account' ? '내 계정' : '체험 중'}</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={onOpenAuth}
            className="flex h-9 items-center gap-1.5 rounded-full bg-gradient-to-br from-cyan-400 to-teal-300 px-3 text-[12px] font-bold text-night-950 shadow-glow transition hover:brightness-105"
          >
            <LogIn className="h-4 w-4" strokeWidth={2.6} />
            로그인
          </button>
        )}
      </div>
    </header>
  );
}
