import {
  getPendingEvents,
  updateEventSyncStatus,
} from "@/database/db";
import type { ScoutEvent } from "@/types";

type Listener = (info: { pending: number; syncing: boolean }) => void;

let syncing = false;
const listeners = new Set<Listener>();

export function onSyncStatusChange(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

async function notify() {
  const pending = (await getPendingEvents()).length;
  listeners.forEach((l) => l({ pending, syncing }));
}

// Envia um evento para o backend. O endpoint faz upsert por id (seção 45:
// "a sincronização deverá ser idempotente para evitar eventos duplicados").
async function pushEvent(event: ScoutEvent) {
  const res = await fetch("/api/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(event),
  });
  if (!res.ok) {
    throw new Error(`Falha ao sincronizar evento ${event.id}: ${res.status}`);
  }
}

export async function syncPendingEvents() {
  if (syncing) return;
  if (!navigator.onLine) return;

  syncing = true;
  await notify();

  const pending = await getPendingEvents();
  for (const event of pending) {
    try {
      await pushEvent(event);
      await updateEventSyncStatus(event.id, "SYNCED");
    } catch {
      await updateEventSyncStatus(event.id, "ERROR");
    }
  }

  syncing = false;
  await notify();
}

let started = false;

export function startSyncEngine() {
  if (started) return;
  started = true;

  window.addEventListener("online", () => {
    syncPendingEvents();
  });

  // tenta a cada 15s enquanto há eventos pendentes e há conexão
  setInterval(() => {
    syncPendingEvents();
  }, 15000);

  syncPendingEvents();
}
