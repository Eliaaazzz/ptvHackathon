import { useEffect, useMemo } from "react";
import { useAppStore } from "../store/useAppStore";
import { glassPanel, panelPadding, pillButton, mergeClasses } from "../lib/theme";

export default function OfflineQueueWidget() {
  const queueLength = useAppStore((s) => s.queueLength);
  const flushQueue = useAppStore((s) => s.flushQueue);
  const clearQueue = useAppStore((s) => s.clearQueue);
  const refreshQueueLength = useAppStore((s) => s.refreshQueueLength);
  const pushToast = useAppStore((s) => s.pushToast);

  useEffect(() => {
    refreshQueueLength();
    const handler = (event) => {
      if (event.key === "offlineQueue") {
        refreshQueueLength();
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, [refreshQueueLength]);

  const countLabel = useMemo(() => {
    if (!queueLength) return "";
    return `${queueLength} item${queueLength === 1 ? "" : "s"}`;
  }, [queueLength]);

  if (!queueLength) return null;

  const handleFlush = async () => {
    try {
      const { sent, failed } = await flushQueue();
      if (failed) {
        pushToast({
          type: "warning",
          message: `Tried to sync ${sent + failed} item${sent + failed === 1 ? "" : "s"}; ${failed} left pending.`,
        });
      } else {
        pushToast({ type: "success", message: `Synced ${sent} queued item${sent === 1 ? "" : "s"}.` });
      }
    } catch {
      pushToast({ type: "error", message: "Sync failed. Please retry shortly." });
    }
  };

  const handleClear = async () => {
    const ok = window.confirm(`Clear ${countLabel}? This cannot be undone.`);
    if (!ok) return;
    const result = await clearQueue();
    if (result.auditLogged) {
      pushToast({ type: "info", message: `Cleared ${result.cleared} queued item${result.cleared === 1 ? "" : "s"}.` });
    } else {
      pushToast({
        type: "warning",
        message: `Cleared ${result.cleared} item${result.cleared === 1 ? "" : "s"}, but audit logging failed.`,
      });
    }
  };

  return (
    <div className="absolute bottom-32 right-5 z-40 sm:bottom-36 sm:right-10">
      <div className={mergeClasses(glassPanel, panelPadding, "rounded-full flex flex-wrap items-center gap-3 shadow-[0_18px_55px_-30px_rgba(236,72,153,0.55)]")}> 
        <div className="flex items-center gap-2">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-rose-200 text-sm font-semibold text-rose-700">
            {queueLength}
          </span>
          <div className="text-left text-sm font-semibold text-slate-700">
            <div>Pending sync</div>
            <div className="text-xs font-normal text-slate-500">{countLabel}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className={mergeClasses(pillButton, "bg-white text-slate-600 text-xs shadow-none px-3 py-1 hover:bg-slate-100")}
            onClick={handleFlush}
          >
            Retry now
          </button>
          <button
            type="button"
            className={mergeClasses(pillButton, "bg-gradient-to-r from-rose-200 via-amber-200 to-amber-100 text-xs text-slate-700 px-3 py-1")}
            onClick={handleClear}
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  );
}
