import { X } from 'lucide-react';
import { useToast } from '../context/ToastContext';

export function Toasts() {
  const { toasts, dismiss } = useToast();
  if (toasts.length === 0) return null;
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-[86px] z-40 flex flex-col items-center gap-2 px-4">
      {toasts.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => dismiss(t.id)}
          className={`pointer-events-auto flex w-full max-w-[380px] animate-toast-in items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left text-[13px] font-semibold shadow-[0_18px_40px_-16px_rgba(0,0,0,0.9)] backdrop-blur-xl ${
            t.tone === 'error'
              ? 'border-rose-400/30 bg-rose-950/85 text-rose-100'
              : t.tone === 'success'
                ? 'border-emerald-400/30 bg-emerald-950/85 text-emerald-100'
                : 'border-white/15 bg-night-800/90 text-slate-100'
          }`}
        >
          <span>{t.message}</span>
          <X className="h-4 w-4 shrink-0 opacity-60" />
        </button>
      ))}
    </div>
  );
}
