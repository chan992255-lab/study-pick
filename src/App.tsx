import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { BottomNav, type Tab } from './components/BottomNav';
import { Header } from './components/Header';
import { AuthModal } from './components/AuthModal';
import { ProfileModal } from './components/ProfileModal';
import { ImportPrompt } from './components/ImportPrompt';
import { Toasts } from './components/Toasts';
import { Logo } from './components/Logo';
import { TimerPage } from './pages/TimerPage';
import { TasksPage } from './pages/TasksPage';
import { StatsPage } from './pages/StatsPage';
import { useStudy } from './context/StudyContext';
import { todaySessions, totals } from './lib/stats';

const TAB_LIST: Tab[] = ['timer', 'tasks', 'stats'];

function readTabFromHash(): Tab {
  const raw = window.location.hash.replace(/^#\/?/, '').split('?')[0];
  return (TAB_LIST as string[]).includes(raw) ? (raw as Tab) : 'timer';
}

export default function App() {
  const { sessions, loading, loadError, refresh } = useStudy();
  const [tab, setTab] = useState<Tab>(readTabFromHash);
  const [authOpen, setAuthOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const scrollRef = useRef<HTMLElement | null>(null);

  const todaySeconds = useMemo(() => totals(todaySessions(sessions)).totalSeconds, [sessions]);

  useEffect(() => {
    const titles: Record<Tab, string> = {
      timer: '공부 타이머',
      tasks: '과목·할 일',
      stats: '공부 통계',
    };
    document.title = `${titles[tab]} | 스터디픽 StudyPick`;
  }, [tab]);

  useEffect(() => {
    const onHash = () => setTab(readTabFromHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const changeTab = (next: Tab) => {
    setTab(next);
    if (window.location.hash !== `#/${next}`) {
      window.location.hash = `#/${next}`;
    }
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="flex min-h-[100dvh] items-stretch justify-center sm:items-center sm:p-6">
      <div className="relative flex h-[100dvh] w-full max-w-[460px] flex-col overflow-hidden bg-night-950/40 sm:h-[min(920px,calc(100dvh-3rem))] sm:rounded-[36px] sm:border sm:border-white/10 sm:bg-night-900/45 sm:shadow-[0_50px_120px_-50px_rgba(0,0,0,0.95)]">
        <Header
          todaySeconds={todaySeconds}
          onOpenAuth={() => setAuthOpen(true)}
          onOpenProfile={() => setProfileOpen(true)}
        />

        <main
          ref={scrollRef}
          className="no-scrollbar flex-1 overflow-y-auto overscroll-contain px-4 pb-6"
        >
          {loadError && (
            <div className="mt-4 flex items-start gap-2 rounded-2xl border border-rose-400/25 bg-rose-500/10 px-3 py-2.5 text-[12px] text-rose-100">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <div className="flex-1">
                <p className="font-semibold">{loadError}</p>
                <button
                  type="button"
                  onClick={() => void refresh()}
                  className="mt-1 rounded-lg bg-white/10 px-2 py-1 text-[11px] font-bold"
                >
                  다시 시도
                </button>
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex h-[70%] flex-col items-center justify-center gap-3">
              <Logo size="sm" />
              <span className="flex items-center gap-1.5 text-[12px] font-semibold text-slate-500">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                공부 기록을 불러오는 중…
              </span>
            </div>
          ) : tab === 'timer' ? (
            <TimerPage onOpenAuth={() => setAuthOpen(true)} />
          ) : tab === 'tasks' ? (
            <TasksPage />
          ) : (
            <StatsPage />
          )}
        </main>

        <BottomNav active={tab} onChange={changeTab} />
        <Toasts />
        <ImportPrompt />
        <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
        <ProfileModal
          open={profileOpen}
          onClose={() => setProfileOpen(false)}
          onOpenAuth={() => {
            setProfileOpen(false);
            setAuthOpen(true);
          }}
        />
      </div>
    </div>
  );
}
