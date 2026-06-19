import type { GameState } from './gameState';

/**
 * Multi-slot save support. The persist middleware uses a single key
 * (tkm-save-vN); this module exposes additional named slots that the
 * player can write to and read from explicitly.
 *
 * Slot keys: `tkm-slot-<id>` where id is one of `slot-1` ... `slot-5`,
 * or a custom string. Slot metadata (name, date, scenario id) is stored
 * alongside the full state blob.
 */

const SLOT_PREFIX = 'tkm-slot-';

export interface SaveSlot {
  id: string;
  label: string;
  savedAt: number;     // epoch ms
  scenarioId: string | null;
  year: number;
  season: string;
  playerForceName: string;
  state: GameState;
}

const SLOT_INDEX_KEY = 'tkm-slot-index';

export interface SlotMeta {
  id: string;
  label: string;
  savedAt: number;
  scenarioId: string | null;
  year: number;
  season: string;
  playerForceName: string;
  /** Force theme color for visual identification (added in v27). */
  forceColor?: string;
  /** Number of cities the player owns at save time. */
  cityCount?: number;
  /** Total troops across player cities at save time. */
  troopTotal?: number;
  /** 縮略圖 — every city as [x, y, ownerColor] in 1000×720 strategic px;
   *  the slot list renders these as a tiny realm snapshot. */
  mapDots?: Array<[number, number, string]>;
}

function readIndex(): SlotMeta[] {
  try {
    const raw = localStorage.getItem(SLOT_INDEX_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

function writeIndex(idx: SlotMeta[]): void {
  localStorage.setItem(SLOT_INDEX_KEY, JSON.stringify(idx));
}

export function listSlots(): SlotMeta[] {
  return readIndex().sort((a, b) => b.savedAt - a.savedAt);
}

export function saveToSlot(
  slotId: string,
  label: string,
  state: GameState,
  playerForceName: string,
): void {
  // Derive a few summary stats so the slot list reads informatively.
  const force = state.playerForceId ? state.forces[state.playerForceId] : null;
  const playerCities = Object.values(state.cities).filter(
    (c) => state.playerForceId && c.ownerForceId === state.playerForceId,
  );
  const meta: SlotMeta = {
    id: slotId,
    label,
    savedAt: Date.now(),
    scenarioId: state.scenarioId,
    year: state.date.year,
    season: state.date.season,
    playerForceName,
    forceColor: force?.color,
    cityCount: playerCities.length,
    troopTotal: playerCities.reduce((sum, c) => sum + c.troops, 0),
    mapDots: Object.values(state.cities).map((c) => [
      Math.round(c.coords.x),
      Math.round(c.coords.y),
      (c.ownerForceId ? state.forces[c.ownerForceId]?.color : null) ?? '#555',
    ]),
  };
  // Strip the per-turn replay trails + the live snapshot buffer before
  // writing — they're session conveniences, and three rolling autosaves of
  // multi-MB trails would exhaust the localStorage quota in a long campaign.
  const slim = {
    ...state,
    battleReplays: (state.battleReplays ?? []).map((r) => ({ ...r, snapshots: [] })),
    currentBattleSnapshots: [],
  };
  localStorage.setItem(SLOT_PREFIX + slotId, JSON.stringify(slim));
  const idx = readIndex().filter((s) => s.id !== slotId);
  idx.push(meta);
  writeIndex(idx);
}

/** Update only the label on an existing slot (without touching state). */
export function renameSlot(slotId: string, newLabel: string): boolean {
  const idx = readIndex();
  const entry = idx.find((s) => s.id === slotId);
  if (!entry) return false;
  entry.label = newLabel;
  writeIndex(idx);
  return true;
}

export function loadFromSlot(slotId: string): GameState | null {
  try {
    const raw = localStorage.getItem(SLOT_PREFIX + slotId);
    if (!raw) return null;
    return JSON.parse(raw) as GameState;
  } catch {
    return null;
  }
}

export function deleteSlot(slotId: string): void {
  localStorage.removeItem(SLOT_PREFIX + slotId);
  writeIndex(readIndex().filter((s) => s.id !== slotId));
}
