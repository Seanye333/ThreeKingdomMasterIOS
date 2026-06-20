/**
 * 寫實單挑資產清單 — realistic-duel asset manifest.
 *
 * The 3D duel arena ({@link ../DuelArena3D}) plays one of a fixed set of named
 * actions on each fighter. Each action is backed by one or more Mixamo clip
 * files under `public/models/duel/`; the arena rotates through a clip pool so
 * repeated moves don't look identical.
 *
 * Current assets are Mixamo **FBX** on the default **"X Bot"** rig (a grey
 * placeholder robot — swap {@link DUEL_CHARACTER_URL} for a real warrior model
 * later; every clip below is on the same rig so the animations carry over). All
 * clips MUST share that rig's bone names so they retarget onto the mesh.
 */

// The arena's animation names line up 1:1 with the duel moves (slash/cleave/
// sweep/guard/dodge/parry/power) plus the reaction states (idle/hit/death/
// victory), so the arena can play a fighter's chosen move directly.
export type DuelAnim =
  | 'idle'    // 待機 — relaxed stance, loops
  | 'slash'   // 斬 — fast lateral cut
  | 'cleave'  // 劈 — heavy overhead chop
  | 'sweep'   // 掃 — low sweep / kick
  | 'guard'   // 格 — raise block
  | 'dodge'   // 閃 — sidestep / evade
  | 'parry'   // 架 — deflect + riposte
  | 'power'   // 奮 — heavy overpower combo
  | 'hit'     // 受擊 — flinch from a blow (from left / right / gut)
  | 'death'   // 倒地 — cut down
  | 'victory';// 得勝 — battle-cry flourish

/** 'fbx' (current Mixamo export) or 'glb' if you later convert for iOS perf. */
export const DUEL_FORMAT: 'fbx' | 'glb' = 'fbx';

const DIR = '/models/duel/';
const EXT = '.' + DUEL_FORMAT;

// Filenames contain spaces (e.g. "X Bot.fbx"); encode so fetch works under the
// iOS WKWebView and on Vercel, where raw spaces in a URL aren't reliable.
const url = (basename: string) => encodeURI(DIR + basename + EXT);

// ── Animation packs ──────────────────────────────────────────────────────────
// Two complete Mixamo packs drive the duel. A fighter uses one based on their
// weapon: one-handed weapons (sword/axe/twinblade) fight with the Sword &
// Shield Pack; two-handed weapons (glaive/spear/halberd/greatsword) with the
// Great Sword Pack. Both packs share the same DuelAnim → clip-pool shape and
// both carry real death/impact/block clips. Evasions reuse the standalone
// Dodging/Roll/Jump clips. Clip key = path under the duel folder (no extension).

export type DuelPackId = 'sword' | 'great';

const SS = 'Sword and Shield Pack/';
const GS = 'Great Sword Pack/';
const EVADE = ['Dodging', 'Quick Roll To Run', 'Jump'];

const RAW_SWORD: Record<DuelAnim, string[]> = {
  idle:    [SS + 'sword and shield idle', SS + 'sword and shield idle (2)'],
  slash:   [SS + 'sword and shield slash', SS + 'sword and shield slash (2)', SS + 'sword and shield slash (3)'],
  cleave:  [SS + 'sword and shield attack', SS + 'sword and shield attack (2)', SS + 'sword and shield attack (3)'],
  sweep:   [SS + 'sword and shield kick', SS + 'sword and shield attack (4)'],
  guard:   [SS + 'sword and shield block idle'],
  dodge:   EVADE,
  parry:   [SS + 'sword and shield block', SS + 'sword and shield block (2)'],
  power:   [SS + 'sword and shield slash (4)', SS + 'sword and shield slash (5)'],
  hit:     [SS + 'sword and shield impact', SS + 'sword and shield impact (2)', SS + 'sword and shield impact (3)'],
  death:   [SS + 'sword and shield death', SS + 'sword and shield death (2)'],
  victory: [SS + 'sword and shield power up'],
};

const RAW_GREAT: Record<DuelAnim, string[]> = {
  idle:    [GS + 'great sword idle', GS + 'great sword idle (2)'],
  slash:   [GS + 'great sword slash', GS + 'great sword slash (2)', GS + 'great sword slash (3)'],
  cleave:  [GS + 'great sword attack', GS + 'great sword slash (4)', GS + 'great sword slash (5)'],
  sweep:   [GS + 'great sword kick', GS + 'great sword slide attack'],
  guard:   [GS + 'great sword blocking'],
  dodge:   EVADE,
  parry:   [GS + 'great sword blocking (2)', GS + 'great sword blocking (3)'],
  // (great sword jump attack.fbx fails to parse in FBXLoader, so it's omitted.)
  power:   [GS + 'great sword high spin attack', GS + 'great sword slash (5)'],
  hit:     [GS + 'great sword impact', GS + 'great sword impact (2)', GS + 'great sword impact (3)'],
  death:   [GS + 'two handed sword death', GS + 'two handed sword death (2)'],
  victory: [GS + 'great sword power up'],
};

export interface DuelPack {
  character: string;                       // mesh URL
  actionClips: Record<DuelAnim, string[]>; // anim → clip keys (rotated by round)
  clipKeys: string[];                      // every unique clip key, in load order
  clipFiles: Record<string, string>;       // clip key → URL
  idleKey: string;
  urls: string[];                          // [character, ...clip URLs] for useLoader
}

function buildPack(characterBasename: string, raw: Record<DuelAnim, string[]>): DuelPack {
  const clipFiles: Record<string, string> = {};
  for (const keys of Object.values(raw)) for (const k of keys) clipFiles[k] = url(k);
  const clipKeys = Object.keys(clipFiles);
  const character = url(characterBasename);
  return {
    character, actionClips: raw, clipKeys, clipFiles,
    idleKey: raw.idle[0],
    urls: [character, ...clipKeys.map((k) => clipFiles[k])],
  };
}

// Both packs ride the same X Bot rig, so one mesh works for either.
export const DUEL_PACKS: Record<DuelPackId, DuelPack> = {
  sword: buildPack('X Bot', RAW_SWORD),
  great: buildPack('X Bot', RAW_GREAT),
};

/**
 * Assets are present, so the arena uses the realistic backend. Set to `false`
 * to force the built-in procedural fallback fighter (e.g. while debugging).
 */
export const DUEL_ASSETS_READY = true;
