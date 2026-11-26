import React from 'react';
import { Check, X } from 'lucide-react';
import { useStore } from '../context/StoreContext';

export const ToastStack: React.FC = () => {
  const { toasts, dismissToast } = useStore();

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed bottom-5 right-5 z-[110] flex w-[340px] max-w-[calc(100vw-2.5rem)] flex-col gap-2.5"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="animate-modal-in flex items-start justify-between gap-3 border border-[var(--hairline-strong)] bg-[var(--ink)] px-4 py-3 text-[var(--surface)] shadow-2xl"
        >
          <div className="flex items-start gap-2.5 min-w-0">
            <span
              className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${
                toast.tone === 'olive'
                  ? 'bg-[var(--olive)] text-white'
                  : 'bg-[var(--accent)] text-[var(--accent-contrast)]'
              }`}
            >
              <Check size={10} strokeWidth={2.2} />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-medium leading-snug">{toast.title}</p>
              {toast.detail && (
                <p className="mt-0.5 truncate font-mono-tech text-[10px] opacity-70">
                  {toast.detail}
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => dismissToast(toast.id)}
            aria-label="Dismiss notification"
            className="shrink-0 opacity-60 transition-opacity hover:opacity-100"
          >
            <X size={14} strokeWidth={1.5} />
          </button>
        </div>
      ))}
    </div>
  );
};
