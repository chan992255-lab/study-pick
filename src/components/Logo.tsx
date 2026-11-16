import { BookOpen } from 'lucide-react';

export function Logo({ size = 'md' }: { size?: 'sm' | 'md' }) {
  const box = size === 'sm' ? 'h-9 w-9 rounded-[14px]' : 'h-10 w-10 rounded-2xl';
  const icon = size === 'sm' ? 'h-[18px] w-[18px]' : 'h-5 w-5';
  return (
    <div className="flex items-center gap-2.5">
      <div
        className={`relative grid ${box} place-items-center bg-gradient-to-br from-cyan-300 via-cyan-400 to-teal-300 shadow-glow`}
      >
        <BookOpen className={`${icon} text-night-950`} strokeWidth={2.5} />
        <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-night-900 bg-emerald-400" />
      </div>
      <div className="leading-none">
        <p className="text-[17px] font-extrabold tracking-tight text-white">스터디픽</p>
        <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.32em] text-cyan-300/70">studypick</p>
      </div>
    </div>
  );
}
