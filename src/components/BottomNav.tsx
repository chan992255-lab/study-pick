import { BarChart3, ListChecks, Timer } from 'lucide-react';

export type Tab = 'timer' | 'tasks' | 'stats';

const TABS: { id: Tab; label: string; icon: typeof Timer }[] = [
  { id: 'timer', label: '타이머', icon: Timer },
  { id: 'tasks', label: '과목·할 일', icon: ListChecks },
  { id: 'stats', label: '통계', icon: BarChart3 },
];

export function BottomNav({ active, onChange }: { active: Tab; onChange: (tab: Tab) => void }) {
  return (
    <nav
      className="safe-bottom z-20 border-t border-white/[0.07] bg-night-900/90 px-3 pb-2 pt-2 backdrop-blur-xl"
      aria-label="주요 화면"
    >
      <div className="grid grid-cols-3 gap-1">
        {TABS.map(({ id, label, icon: Icon }) => {
          const isActive = id === active;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onChange(id)}
              aria-current={isActive ? 'page' : undefined}
              className={`flex flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-semibold transition ${
                isActive
                  ? 'bg-cyan-400/12 text-cyan-200'
                  : 'text-slate-500 hover:bg-white/[0.04] hover:text-slate-300'
              }`}
            >
              <Icon className="h-5 w-5" strokeWidth={isActive ? 2.5 : 2} />
              {label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
