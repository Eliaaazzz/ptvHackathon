import { useEffect } from "react";
import MapDashboard from "./components/MapDashboard";
import QuickActions from "./components/QuickActions";
import IncidentForm from "./components/IncidentForm";
import ShiftSummary from "./components/ShiftSummary";
import { useAppStore } from "./store/useAppStore";
import LoginModal from "./components/LoginModal";
import AuthStatus from "./components/AuthStatus";
import { startRealtime, stopRealtime } from "./lib/ws";
import MapControls from "./components/MapControls";
import ChatPanel from "./components/ChatPanel";
import OfflineQueueWidget from "./components/OfflineQueueWidget";
import ToastStack from "./components/ToastStack";

function App() {
  const flushQueue = useAppStore((s) => s.flushQueue);

  useEffect(() => {
    const onOnline = () => flushQueue();
    window.addEventListener("online", onOnline);
    // best-effort flush once on mount
    flushQueue();
    // start realtime subscriptions (blitz)
    startRealtime();
    return () => {
      window.removeEventListener("online", onOnline);
      try { stopRealtime(); } catch {}
    };
  }, [flushQueue]);

  return (
    <div className="w-screen h-screen relative overflow-hidden text-slate-700">
      <div className="pointer-events-none absolute -top-48 -left-32 h-[360px] w-[360px] rounded-full bg-gradient-to-br from-rose-200/70 via-amber-100/60 to-sky-100/60 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-48 -right-28 h-[400px] w-[400px] rounded-full bg-gradient-to-tr from-emerald-100/60 via-rose-100/70 to-indigo-100/60 blur-3xl" />
      <div className="pointer-events-none absolute top-1/3 left-[10%] h-40 w-40 rounded-[38%] bg-white/40 blur-2xl" />
      <div className="absolute inset-4 sm:inset-6 lg:inset-10">
        <div className="h-full w-full rounded-[36px] border border-white/60 bg-white/35 shadow-[0_30px_80px_-35px_rgba(236,72,153,0.6)] backdrop-blur-md relative overflow-hidden">
          <MapDashboard />
        </div>
      </div>
      <LoginModal />
      <AuthStatus />
      <MapControls />
      <QuickActions />
      <OfflineQueueWidget />
      <IncidentForm />
      <ShiftSummary />
      <ChatPanel />
      <ToastStack />
    </div>
  );
}
export default App;
