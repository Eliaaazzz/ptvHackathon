// API client. Uses absolute base URL if provided; otherwise, relies on Vite dev proxy.
const base = import.meta.env.VITE_API_BASE_URL;

function getHeaders() {
  const headers = { "Content-Type": "application/json" };
  try {
    const raw = localStorage.getItem("auth");
    if (raw) {
      const { token } = JSON.parse(raw);
      if (token) headers["Authorization"] = `Bearer ${token}`;
    }
  } catch {}
  return headers;
}

function buildUrl(path) {
  const p = path.startsWith("/") ? path : `/${path}`;
  if (!base) return p; // rely on dev proxy
  return base.replace(/\/$/, "") + p;
}

// DTO mappers
export function mapIncidentDto(payload) {
  const lat = payload?.location?.lat ?? null;
  const lng = payload?.location?.lng ?? null;
  return {
    title: payload?.tag || "Incident",
    description: payload?.notes || "",
    severity: "MEDIUM",
    status: "OPEN",
    latitude: typeof lat === "number" ? lat : null,
    longitude: typeof lng === "number" ? lng : null,
    occurredAt: payload?.createdAt || new Date().toISOString(),
  };
}

export function mapShiftStartDto(payload) {
  return {
    startTime: new Date(payload?.startedAt || Date.now()).toISOString(),
    endTime: null,
    status: "OPEN",
    location: "",
    notes: "",
  };
}

export function mapShiftEndDto(payload) {
  return {
    startTime: new Date(payload?.startedAt || Date.now()).toISOString(),
    endTime: new Date(payload?.endedAt || Date.now()).toISOString(),
    status: "CLOSED",
    location: "",
    notes: "",
  };
}

// REST helpers
export async function createIncident(dto) {
  const res = await fetch(buildUrl("/api/incidents"), {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(dto),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json().catch(() => null);
}

export async function createShift(dto) {
  const res = await fetch(buildUrl("/api/shifts"), {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(dto),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json().catch(() => null);
}

export async function updateShift(id, dto) {
  const res = await fetch(buildUrl(`/api/shifts/${id}`), {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify(dto),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json().catch(() => null);
}

export async function createBlitz({ latitude, longitude, description = "", blitzType = "GENERIC", scheduledEnd = null }) {
  // try read inspectorId from auth store persistence
  let inspectorId = undefined;
  try {
    const raw = localStorage.getItem("auth");
    if (raw) inspectorId = JSON.parse(raw)?.user?.inspectorId;
  } catch {}
  const body = {
    inspectorId,
    latitude,
    longitude,
    description,
    blitzType,
    scheduledEnd,
  };
  const res = await fetch(buildUrl("/api/blitz"), {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json().catch(() => null);
}

export async function logAuditEvent({ action, entityType, entityId = null, metadata = "" }) {
  const body = { action, entityType, entityId, metadata };
  const res = await fetch(buildUrl("/api/audit"), {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text().catch(() => null);
}
