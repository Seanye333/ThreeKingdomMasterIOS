/**
 * 存檔互傳 — export every tkm-* localStorage key into one JSON file and
 * import it back on another device. With the game deployed as a PWA this
 * is the "cloud save" that needs no cloud: download on the desktop,
 * AirDrop/send the file, import on the phone.
 *
 * The bundle carries the live campaign (tkm-save-vN), all named slots,
 * autosaves and preferences — everything the game keeps in localStorage.
 */

const KEY_PREFIX = 'tkm-';
const BUNDLE_VERSION = 1;

export interface SaveBundle {
  kind: 'tkm-save-bundle';
  version: number;
  exportedAt: string;
  entries: Record<string, string>;
}

export function exportAllSaves(now = new Date()): SaveBundle {
  const entries: Record<string, string> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key || !key.startsWith(KEY_PREFIX)) continue;
    const value = localStorage.getItem(key);
    if (value != null) entries[key] = value;
  }
  return {
    kind: 'tkm-save-bundle',
    version: BUNDLE_VERSION,
    exportedAt: now.toISOString(),
    entries,
  };
}

/** Validate + write a bundle. Only tkm-* keys are accepted — a crafted
 *  file can't plant foreign localStorage entries. Returns the number of
 *  keys restored, or a reason on rejection. */
export function importAllSaves(raw: string): { ok: true; count: number } | { ok: false; reason: string } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, reason: 'not-json' };
  }
  const bundle = parsed as Partial<SaveBundle>;
  if (bundle?.kind !== 'tkm-save-bundle' || typeof bundle.entries !== 'object' || !bundle.entries) {
    return { ok: false, reason: 'not-a-save-bundle' };
  }
  const entries = Object.entries(bundle.entries)
    .filter(([k, v]) => k.startsWith(KEY_PREFIX) && typeof v === 'string');
  if (entries.length === 0) return { ok: false, reason: 'empty' };
  for (const [k, v] of entries) localStorage.setItem(k, v);
  return { ok: true, count: entries.length };
}
