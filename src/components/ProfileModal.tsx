import { useEffect, useState } from 'react';
import { LogOut, UserRound, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useStudy } from '../context/StudyContext';
import { useToast } from '../context/ToastContext';

interface ProfileModalProps {
  open: boolean;
  onClose: () => void;
  onOpenAuth: () => void;
}

export function ProfileModal({ open, onClose, onOpenAuth }: ProfileModalProps) {
  const { user, signOut } = useAuth();
  const { settings, sessions, tasks, setNickname, mode } = useStudy();
  const { toast } = useToast();
  const [draft, setDraft] = useState(settings.nickname);

  useEffect(() => {
    if (open) setDraft(settings.nickname);
  }, [open, settings.nickname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const savedCount = sessions.length;
  const doneCount = tasks.filter((t) => t.done).length;

  return (
    <div className="absolute inset-0 z-50 flex items-end justify-center sm:items-center">
      <button type="button" aria-label="닫기" onClick={onClose} className="absolute inset-0 bg-night-950/80 backdrop-blur-sm" />
      <div className="relative w-full animate-slide-up rounded-t-[28px] border border-white/10 bg-night-850 px-5 pb-6 pt-4 sm:max-w-[400px] sm:rounded-[28px]">
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/15 sm:hidden" />
        <button
          type="button"
          onClick={onClose}
          aria-label="닫기"
          className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full text-slate-400 transition hover:bg-white/10 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="mb-4 flex items-center gap-3 pr-8">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-cyan-400/25 to-teal-300/15 text-cyan-200">
            <UserRound className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-[17px] font-extrabold text-white">{settings.nickname}</p>
            <p className="truncate text-[12px] text-slate-400">
              {mode === 'account' ? user?.email ?? '로그인됨' : '체험 모드 · 이 기기에만 저장'}
            </p>
          </div>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-2">
          <div className="soft-card px-3 py-2.5">
            <p className="text-[11px] font-semibold text-slate-400">저장된 공부 기록</p>
            <p className="mt-0.5 text-[17px] font-extrabold text-white">{savedCount}개</p>
          </div>
          <div className="soft-card px-3 py-2.5">
            <p className="text-[11px] font-semibold text-slate-400">완료한 할 일</p>
            <p className="mt-0.5 text-[17px] font-extrabold text-white">{doneCount}개</p>
          </div>
        </div>

        {mode === 'account' ? (
          <>
            <label className="label" htmlFor="profile-nickname">
              닉네임
            </label>
            <div className="flex gap-2">
              <input
                id="profile-nickname"
                className="field"
                value={draft}
                maxLength={12}
                onChange={(e) => setDraft(e.target.value)}
              />
              <button
                type="button"
                onClick={() => void setNickname(draft)}
                disabled={!draft.trim() || draft.trim() === settings.nickname}
                className="btn-soft shrink-0 px-4"
              >
                저장
              </button>
            </div>
            <button
              type="button"
              onClick={async () => {
                await signOut();
                onClose();
                toast('로그아웃했어요. 체험 모드로 이어집니다.');
              }}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 py-3 text-[13px] font-semibold text-slate-300 transition hover:bg-white/[0.06]"
            >
              <LogOut className="h-4 w-4" />
              로그아웃
            </button>
          </>
        ) : (
          <div className="rounded-2xl border border-cyan-400/25 bg-cyan-400/[0.08] px-4 py-3">
            <p className="text-[13px] font-semibold text-cyan-100">
              지금은 체험 모드예요
            </p>
            <p className="mt-1 text-[12px] leading-relaxed text-cyan-100/70">
              기록이 이 기기의 브라우저에만 저장돼요. 로그인하면 계정에 저장돼 다른 기기에서도 이어서 볼 수 있어요.
            </p>
            <button type="button" onClick={onOpenAuth} className="btn-primary mt-3 w-full">
              로그인 / 회원가입
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
