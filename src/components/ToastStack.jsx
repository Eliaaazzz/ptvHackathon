import { useAppStore } from "../store/useAppStore";
import { useMemo } from "react";

const toneMap = {
  success: {
    bg: "from-emerald-200 via-green-200 to-emerald-100",
    text: "text-emerald-800",
    indicator: "bg-emerald-500",
  },
  info: {
    bg: "from-sky-200 via-blue-200 to-sky-100",
    text: "text-slate-700",
    indicator: "bg-sky-500",
  },
  warning: {
    bg: "from-amber-200 via-yellow-200 to-amber-100",
    text: "text-amber-800",
    indicator: "bg-amber-500",
  },
  error: {
    bg: "from-rose-200 via-red-200 to-rose-100",
    text: "text-rose-800",
    indicator: "bg-rose-500",
  },
};

export default function ToastStack() {
  const toasts = useAppStore((s) => s.toasts);
  const removeToast = useAppStore((s) => s.removeToast);

  const entries = useMemo(() => toasts.slice(-4), [toasts]);
  if (!entries.length) return null;

  return (
    <div className="pointer-events-none fixed bottom-6 left-1/2 z-[100] flex w-full max-w-xl -translate-x-1/2 flex-col gap-2 px-4 sm:left-auto sm:right-6 sm:translate-x-0">
      {entries.map((toast) => {
        const tone = toneMap[toast.type] || toneMap.info;
        return (
          <div
            key={toast.id}
            className={`pointer-events-auto rounded-3xl bg-gradient-to-r ${tone.bg} ${tone.text} shadow-[0_18px_45px_-30px_rgba(15,23,42,0.45)] backdrop-blur px-4 py-3 flex items-start gap-3`}
            role="status"
            aria-live="polite"
          >
            <span className={`mt-1 inline-flex h-2.5 w-2.5 shrink-0 rounded-full ${tone.indicator}`} aria-hidden="true" />
            <span className="text-sm font-semibold leading-snug">{toast.message}</span>
            <button
              className="ml-auto rounded-full bg-white/60 px-2 py-1 text-xs font-semibold uppercase text-slate-500 transition hover:bg-white"
              type="button"
              onClick={() => removeToast(toast.id)}
            >
              Close
            </button>
          </div>
        );
      })}
    </div>
  );
}
