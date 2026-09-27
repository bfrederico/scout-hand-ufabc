import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { Athlete, Game, GameRosterEntry, ScoutEvent } from "@/types";

// Armazenamento local estruturado (seção 44). Preferido em vez de localStorage:
// suporta mais dados, é estruturado e permite fila de sincronização (seção 45).

interface ScoutDB extends DBSchema {
  athletes: {
    key: string;
    value: Athlete;
  };
  games: {
    key: string;
    value: Game;
  };
  game_roster: {
    key: string;
    value: GameRosterEntry;
    indexes: { by_game: string };
  };
  events: {
    key: string;
    value: ScoutEvent;
    indexes: { by_game: string; by_sync_status: string };
  };
}

let dbPromise: Promise<IDBPDatabase<ScoutDB>> | null = null;

export function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<ScoutDB>("scout-hand-ufabc", 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("athletes")) {
          db.createObjectStore("athletes", { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains("games")) {
          db.createObjectStore("games", { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains("game_roster")) {
          const store = db.createObjectStore("game_roster", { keyPath: "id" });
          store.createIndex("by_game", "game_id");
        }
        if (!db.objectStoreNames.contains("events")) {
          const store = db.createObjectStore("events", { keyPath: "id" });
          store.createIndex("by_game", "game_id");
          store.createIndex("by_sync_status", "sync_status");
        }
      },
    });
  }
  return dbPromise;
}

// --- Eventos: gravação local-first (seção 43) ---

export async function saveEventLocally(event: ScoutEvent) {
  const db = await getDB();
  await db.put("events", event);
}

export async function getEventsForGame(gameId: string) {
  const db = await getDB();
  return db.getAllFromIndex("events", "by_game", gameId);
}

export async function getPendingEvents() {
  const db = await getDB();
  return db.getAllFromIndex("events", "by_sync_status", "PENDING");
}

export async function updateEventSyncStatus(
  id: string,
  status: ScoutEvent["sync_status"]
) {
  const db = await getDB();
  const event = await db.get("events", id);
  if (!event) return;
  event.sync_status = status;
  event.updated_at = new Date().toISOString();
  await db.put("events", event);
}

export async function deleteEventLocally(id: string) {
  const db = await getDB();
  await db.delete("events", id);
}

// --- Cache local de atletas / partidas (para uso offline em tela) ---

export async function cacheAthletes(athletes: Athlete[]) {
  const db = await getDB();
  const tx = db.transaction("athletes", "readwrite");
  await Promise.all(athletes.map((a) => tx.store.put(a)));
  await tx.done;
}

export async function getCachedAthletes() {
  const db = await getDB();
  return db.getAll("athletes");
}

export async function cacheGame(game: Game) {
  const db = await getDB();
  await db.put("games", game);
}

export async function getCachedGame(id: string) {
  const db = await getDB();
  return db.get("games", id);
}

export async function getCachedGames() {
  const db = await getDB();
  return db.getAll("games");
}
