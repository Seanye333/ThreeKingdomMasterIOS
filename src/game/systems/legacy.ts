/**
 * 遺澤 — what one campaign leaves to the next (§9.x).
 *
 * Everything else in this game is per-campaign: the realm falls, the officers
 * die, and the next 劉備 starts in 平原 with nothing. The 圖鑑 and the 勳功 do
 * carry over, but only as a record — they change nothing about the next run.
 *
 * 遺澤 is the first thing that does. Finishing a campaign (however it ends)
 * banks points scaled by what you actually achieved; before the next one you
 * spend them on modest opening boons — a loyal veteran who "followed your house
 * from the old days", a chest of family silver, an heirloom blade. Deliberately
 * small: the point is continuity between runs, not a power ladder that makes
 * year one trivial.
 *
 * Persisted in localStorage beside the codex/achievement ledgers, so it survives
 * save-file deletion the same way they do.
 */

const STORAGE_KEY = 'tkm-legacy-v1';

export interface LegacyLedger {
  /** Points banked and not yet spent. */
  points: number;
  /** Total ever earned — shown as a lifetime figure. */
  earned: number;
  /** Boon ids armed for the NEXT campaign (spent already). */
  armed: string[];
  /** Campaigns finished. */
  runs: number;
}

export function emptyLegacy(): LegacyLedger {
  return { points: 0, earned: 0, armed: [], runs: 0 };
}

export function loadLegacy(): LegacyLedger {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyLegacy();
    const p = JSON.parse(raw) as Partial<LegacyLedger>;
    return {
      points: Math.max(0, Math.floor(p.points ?? 0)),
      earned: Math.max(0, Math.floor(p.earned ?? 0)),
      armed: Array.isArray(p.armed) ? p.armed.filter((x) => typeof x === 'string') : [],
      runs: Math.max(0, Math.floor(p.runs ?? 0)),
    };
  } catch {
    return emptyLegacy();
  }
}

export function saveLegacy(l: LegacyLedger): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(l));
  } catch {
    /* ignore quota errors */
  }
}

// ─── Earning ──────────────────────────────────────────────────────────

/**
 * 遺澤幾何 — what a finished campaign banks.
 *
 * Reach counts most (cities held is the one number that summarises a run),
 * then the length you sustained it, then the ending itself: unifying the realm
 * is worth several times an honourable collapse — but an honourable collapse
 * is still worth something, which is the point. A run you abandon in year two
 * banks almost nothing, so this cannot be farmed by restarting.
 */
export function legacyEarned(args: {
  /** Cities held at the end. */
  cities: number;
  /** Years the campaign lasted. */
  years: number;
  /** Ending reached — 'unify' | 'hegemon' | 'tripartite' | 'survive' | 'defeat' | … */
  ending?: string;
  /** Achievements unlocked during this campaign (not lifetime). */
  achievements?: number;
}): number {
  const reach = Math.min(60, args.cities * 2.5);
  const span = Math.min(25, args.years);
  const endBonus =
    args.ending === 'unify' ? 60
      : args.ending === 'hegemon' ? 35
        : args.ending === 'tripartite' ? 25
          : args.ending === 'defeat' ? 5
            : 15;
  const deeds = Math.min(20, (args.achievements ?? 0) * 2);
  return Math.max(0, Math.round(reach + span + endBonus + deeds));
}

// ─── Spending ─────────────────────────────────────────────────────────

export type LegacyBoonId =
  | 'old-retainer'    // 舊部相隨 — a capable officer joins at once
  | 'family-silver'   // 家貲 — starting gold
  | 'granary-store'   // 積穀 — starting food
  | 'heirloom-blade'  // 傳家寶刃 — an heirloom weapon in the capital armoury
  | 'drilled-guard'   // 宿衛之士 — the capital opens drilled
  | 'kept-registers'; // 舊籍猶存 — the realm opens with honest registers (§1.12)

export interface LegacyBoonDef {
  id: LegacyBoonId;
  name: { zh: string; en: string };
  cost: number;
  descZh: string;
  descEn: string;
}

export const LEGACY_BOONS: LegacyBoonDef[] = [
  {
    id: 'family-silver', cost: 20,
    name: { zh: '家貲', en: 'Family Silver' },
    descZh: '首都開局 +1500 金 —— 先人留下的一點家底。',
    descEn: 'Capital opens with +1500 gold — what the family put by.',
  },
  {
    id: 'granary-store', cost: 20,
    name: { zh: '積穀', en: 'Granary Store' },
    descZh: '首都開局 +12000 糧 —— 舊倉未空。',
    descEn: 'Capital opens with +12,000 food — the old granary was not empty.',
  },
  {
    id: 'drilled-guard', cost: 30,
    name: { zh: '宿衛之士', en: 'Drilled Guard' },
    descZh: '首都開局 練度 40 —— 你帶出來的兵沒有散。',
    descEn: 'Capital opens at 40 drill — the men you trained did not scatter.',
  },
  {
    id: 'kept-registers', cost: 35,
    name: { zh: '舊籍猶存', en: 'Kept Registers' },
    descZh: '全境開局 隱戶歸零、獄無滯訟(§1.11/§1.12)—— 前朝的簿冊還在。',
    descEn: 'The realm opens with honest registers and an empty docket (§1.11/§1.12).',
  },
  {
    id: 'heirloom-blade', cost: 45,
    name: { zh: '傳家寶刃', en: 'Heirloom Blade' },
    descZh: '首都武庫多一件名兵 —— 祖上佩過的那把。',
    descEn: 'A named weapon waits in the capital armoury — the one your house carried.',
  },
  {
    id: 'old-retainer', cost: 60,
    name: { zh: '舊部相隨', en: 'Old Retainer' },
    descZh: '開局即有一員能將來投(忠誠極高)—— 舊日袍澤,聞你起兵而至。',
    descEn: 'A capable officer joins at once, fiercely loyal — an old comrade who heard you had raised a banner.',
  },
];

export const BOONS_BY_ID: Record<LegacyBoonId, LegacyBoonDef> =
  Object.fromEntries(LEGACY_BOONS.map((b) => [b.id, b])) as Record<LegacyBoonId, LegacyBoonDef>;

/** 一世之澤有限 — how many boons may be armed for a single campaign. */
export const MAX_ARMED = 3;

export function armBoon(l: LegacyLedger, id: LegacyBoonId): { ok: boolean; ledger: LegacyLedger; reasonZh?: string } {
  const def = BOONS_BY_ID[id];
  if (!def) return { ok: false, ledger: l, reasonZh: '無此遺澤。' };
  if (l.armed.includes(id)) return { ok: false, ledger: l, reasonZh: '此澤已備。' };
  if (l.armed.length >= MAX_ARMED) return { ok: false, ledger: l, reasonZh: `一世之澤至多 ${MAX_ARMED} 事。` };
  if (l.points < def.cost) return { ok: false, ledger: l, reasonZh: `遺澤不足(需 ${def.cost},現有 ${l.points})。` };
  return { ok: true, ledger: { ...l, points: l.points - def.cost, armed: [...l.armed, id] } };
}

/** Take a boon back off the list and refund it (only before the run starts). */
export function disarmBoon(l: LegacyLedger, id: LegacyBoonId): LegacyLedger {
  if (!l.armed.includes(id)) return l;
  return { ...l, points: l.points + (BOONS_BY_ID[id]?.cost ?? 0), armed: l.armed.filter((x) => x !== id) };
}

/** Bank a finished campaign. Consumes the armed list (they were spent on it). */
export function bankRun(l: LegacyLedger, earned: number): LegacyLedger {
  return {
    points: l.points + earned,
    earned: l.earned + earned,
    armed: [],
    runs: l.runs + 1,
  };
}
