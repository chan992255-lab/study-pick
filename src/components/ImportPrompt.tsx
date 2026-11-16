import { Sparkles } from 'lucide-react';
import { useStudy } from '../context/StudyContext';

/** 로그인 직후, 이 기기의 체험 기록을 계정으로 가져올지 묻는 작은 시트. */
export function ImportPrompt() {
  const { pendingImport, importGuestData, discardGuestData } = useStudy();
  if (!pendingImport) return null;

  const parts: string[] = [];
  if (pendingImport.sessions > 0) parts.push(`공부 기록 ${pendingImport.sessions}개`);
  if (pendingImport.tasks > 0) parts.push(`할 일 ${pendingImport.tasks}개`);

  return (
    <div className="absolute inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-night-950/80 backdrop-blur-sm" />
      <div className="relative w-full animate-slide-up rounded-t-[28px] border border-white/10 bg-night-850 px-5 pb-6 pt-4 sm:max-w-[400px] sm:rounded-[28px]">
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/15 sm:hidden" />
        <div className="mb-2 grid h-11 w-11 place-items-center rounded-2xl bg-cyan-400/15 text-cyan-200">
          <Sparkles className="h-5 w-5" />
        </div>
        <h2 className="text-[18px] font-extrabold text-white">체험 기록을 가져올까요?</h2>
        <p className="mt-1.5 text-[13px] leading-relaxed text-slate-400">
          로그인 전에 이 기기에서 만든 {parts.join(' · ')}가 있어요. 계정으로 옮기면 다른 기기에서도 이어서 볼 수 있어요.
        </p>
        <div className="mt-5 space-y-2">
          <button type="button" onClick={() => void importGuestData()} className="btn-primary w-full">
            가져오기
          </button>
          <button
            type="button"
            onClick={discardGuestData}
            className="w-full rounded-2xl border border-white/10 py-3 text-[13px] font-semibold text-slate-300 transition hover:bg-white/[0.06]"
          >
            새 계정으로 깔끔하게 시작
          </button>
        </div>
      </div>
    </div>
  );
}
