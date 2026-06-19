/**
 * IndexedDB-backed storage for the live campaign blob.
 *
 * The autosaved campaign is the single largest, most-frequently-written
 * value the game keeps — parking it in IndexedDB (gigabytes available)
 * instead of localStorage (~5MB, shared with all the save slots) means
 * a long unification run never collides with the slot budget.
 *
 * Implements zustand's async StateStorage. Falls back to localStorage
 * wholesale when IndexedDB is unavailable (private mode, old browsers),
 * and migrates an existing localStorage value into IDB on first read so
 * no one loses their game to the switch.
 */
import type { StateStorage } from 'zustand/middleware';

const DB_NAME = 'tkm';
const STORE = 'kv';

function idbAvailable(): boolean {
  try {
    return typeof indexedDB !== 'undefined';
  } catch {
    return false;
  }
}

let dbPromise: Promise<IDBDatabase> | null = null;
function getDb(): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => {
        if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE);
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  return dbPromise;
}

function idbGet(key: string): Promise<string | null> {
  return getDb().then((db) => new Promise<string | null>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).get(key);
    req.onsuccess = () => resolve((req.result as string | undefined) ?? null);
    req.onerror = () => reject(req.error);
  }));
}

function idbSet(key: string, value: string): Promise<void> {
  return getDb().then((db) => new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  }));
}

function idbDel(key: string): Promise<void> {
  return getDb().then((db) => new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  }));
}

export const idbStorage: StateStorage = {
  async getItem(key) {
    if (!idbAvailable()) return localStorage.getItem(key);
    try {
      const fromIdb = await idbGet(key);
      if (fromIdb != null) return fromIdb;
      // First run after the switch — adopt any existing localStorage save,
      // then leave the old copy in place as a belt-and-braces backup.
      const legacy = localStorage.getItem(key);
      if (legacy != null) { await idbSet(key, legacy).catch(() => undefined); }
      return legacy;
    } catch {
      return localStorage.getItem(key);
    }
  },
  async setItem(key, value) {
    if (!idbAvailable()) { try { localStorage.setItem(key, value); } catch { /* quota */ } return; }
    try {
      await idbSet(key, value);
      // Keep localStorage clear of the multi-MB blob so slots own that quota.
      try { localStorage.removeItem(key); } catch { /* ignore */ }
    } catch {
      try { localStorage.setItem(key, value); } catch { /* quota */ }
    }
  },
  async removeItem(key) {
    if (idbAvailable()) await idbDel(key).catch(() => undefined);
    try { localStorage.removeItem(key); } catch { /* ignore */ }
  },
};
