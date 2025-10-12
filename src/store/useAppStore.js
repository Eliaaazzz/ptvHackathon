import { create } from "zustand";
import {
  createIncident,
  createShift,
  updateShift,
  createBlitz,
  logAuditEvent,
  mapIncidentDto,
  mapShiftStartDto,
  mapShiftEndDto,
} from "../lib/api";

const QUEUE_KEY = "offlineQueue";
const SHIFT_ID_MAP_KEY = "shiftIdMap";

function getStorage() {
  try {
    return typeof window !== "undefined" ? window.localStorage : null;
  } catch {
    return null;
  }
}

function readQueue() {
  const storage = getStorage();
  if (!storage) return [];
  try {
    return JSON.parse(storage.getItem(QUEUE_KEY) || "[]");
  } catch {
    return [];
  }
}

export const useAppStore = create((set, get) => ({
  showIncidentForm: false,
  showSummary: false,
  setShowIncidentForm: (v) => set({ showIncidentForm: v }),
  setShowSummary: (v) => set({ showSummary: v }),
  // UI toggles
  showHeatmap: true,
  showActive: true,
  showChat: false,
  setShowHeatmap: (v) => set({ showHeatmap: v }),
  setShowActive: (v) => set({ showActive: v }),
  setShowChat: (v) => set({ showChat: v }),

  // Shift
  shift: { active: false, startedAt: null, endedAt: null, localId: null },
  startShift: () => {
    const startedAt = Date.now();
    const localId = `sh_${startedAt}_${Math.random().toString(36).slice(2)}`;
    set({ shift: { active: true, startedAt, endedAt: null, localId } });
    // enqueue for backend sync
    get().enqueue({ type: "shiftStart", payload: { startedAt, localId } });
  },
  endShift: () => {
    const endedAt = Date.now();
    const s = get().shift;
    set({
      shift: { ...s, active: false, endedAt },
      showSummary: true,
    });
    // enqueue for backend sync, include basic stats
    get().enqueue({ type: "shiftEnd", payload: { startedAt: s.startedAt, endedAt, localId: s.localId } });
  },

  // Pins
  pins: [], // local pins {lat,lng,type:'pin'|'blitz'}
  remotePins: [], // server-sourced markers (e.g., blitz)
  setRemotePins: (pins) => set({ remotePins: pins }),
  addPin: (p) => set({ pins: [...get().pins, p] }),

  // UI mode for adding pin
  dropPinMode: false,
  setDropPinMode: (v) => set({ dropPinMode: v }),

  // Incidents
  incidents: [],
  addIncident: (inc) => set({ incidents: [...get().incidents, inc] }),

  // Toasts
  toasts: [],
  pushToast: ({ message, type = "info", duration = 4000 }) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const entry = { id, message, type, createdAt: Date.now() };
    set({ toasts: [...get().toasts, entry] });
    setTimeout(() => {
      const toasts = get().toasts;
      if (toasts.some((t) => t.id === id)) {
        set({ toasts: toasts.filter((t) => t.id !== id) });
      }
    }, duration);
    return id;
  },
  removeToast: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),

  // Offline queue state
  queueLength: readQueue().length,
  refreshQueueLength: () => {
    const length = readQueue().length;
    set({ queueLength: length });
    return length;
  },
  clearQueue: async () => {
    const items = readQueue();
    const storage = getStorage();
    if (storage) {
      try {
        storage.removeItem(QUEUE_KEY);
        storage.removeItem(SHIFT_ID_MAP_KEY);
      } catch {}
    }
    set({ queueLength: 0 });
    try {
      await logAuditEvent({
        action: "OFFLINE_QUEUE_CLEAR",
        entityType: "OfflineQueue",
        metadata: JSON.stringify({ cleared: items.length }),
      });
      return { cleared: items.length, auditLogged: true };
    } catch (error) {
      return { cleared: items.length, auditLogged: false, error };
    }
  },

  // Offline queue (simple)
  enqueue: (item) => {
    try {
      const storage = getStorage();
      if (!storage) return;
      const q = JSON.parse(storage.getItem(QUEUE_KEY) || "[]");
      q.push(item);
      storage.setItem(QUEUE_KEY, JSON.stringify(q));
      set({ queueLength: q.length });
    } catch (e) {
      // ignore quota/JSON errors in this simple client
    }
  },
  flushQueue: async () => {
    const q = readQueue();
    if (!q.length) return { sent: 0, failed: 0 };
    const remaining = [];
    let sent = 0;
    const storage = getStorage();
    const idMap = storage ? JSON.parse(storage.getItem(SHIFT_ID_MAP_KEY) || "{}") : {};

    for (const item of q) {
      try {
        if (item.type === "incident") {
          await createIncident(mapIncidentDto(item.payload));
          sent += 1;
          continue;
        }
        if (item.type === "blitzCreate") {
          const { lat, lng, description, blitzType, scheduledEnd } = item.payload || {};
          await createBlitz({ latitude: lat, longitude: lng, description, blitzType, scheduledEnd });
          sent += 1;
          continue;
        }
        if (item.type === "shiftStart") {
          const res = await createShift(mapShiftStartDto(item.payload));
          const serverId = res?.id;
          const localId = item.payload?.localId;
          if (serverId && localId) {
            idMap[localId] = serverId;
            storage?.setItem(SHIFT_ID_MAP_KEY, JSON.stringify(idMap));
          }
          sent += 1;
          continue;
        }
        if (item.type === "shiftEnd") {
          const localId = item.payload?.localId;
          const serverId = localId ? idMap[localId] : null;
          if (!serverId) {
            // cannot update yet, keep for later
            remaining.push(item);
            continue;
          }
          await updateShift(serverId, mapShiftEndDto(item.payload));
          sent += 1;
          continue;
        }
        // unknown item type
        remaining.push(item);
      } catch (err) {
        remaining.push(item);
      }
    }
    storage?.setItem(QUEUE_KEY, JSON.stringify(remaining));
    set({ queueLength: remaining.length });
    return { sent, failed: remaining.length };
  },
}));
