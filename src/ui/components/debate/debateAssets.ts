/**
 * 舌戰資產清單 — court-debate asset manifest.
 *
 * The 3D debate arena ({@link ../DebateArena3D}) plays one of a fixed set of
 * named actions on each scholar each exchange. Unlike the duel, the debaters
 * are unarmed: the "attacks" are oratory and mockery, so the clips come from
 * the **Pro Magic Pack** (the broad two-handed casts read as forceful
 * declamation once their spell VFX are stripped) and the **Gestures Pack
 * Basic** (scoffing, dismissing, head-shakes — body language you'd never use
 * in a sword fight but which is the soul of a war of words).
 *
 * Every clip rides the same Mixamo **"X Bot"** rig as the duel, so they all
 * retarget by bone name onto one mesh. Files live under `public/models/duel/`
 * (shared with the duel packs — no new downloads needed).
 */

// The arena's animation names line up with the four debate moves
// (assert/retort/provoke/press) plus the reaction states, so the arena can
// play a scholar's chosen move directly from the round result.
export type DebateAnim =
  | 'idle'     // 端坐待辯 — composed stance, loops
  | 'assert'   // 論 — emphatic, both-arms declamation
  | 'retort'   // 駁 — a dismissive wave that turns the argument aside
  | 'provoke'  // 諷 — cocky, sarcastic mockery
  | 'press'    // 詰 — overwhelming forward pressure
  | 'flinch'   // 微挫 — a small loss of composure (annoyed recoil)
  | 'recoil'   // 語塞 — a large loss of composure (struck back)
  | 'rout'     // 罵倒 — composure broken; stagger back, undone
  | 'win';     // 折服 — won the exchange; a cocky flourish

/** 'fbx' (current Mixamo export) or 'glb' if you later convert for iOS perf. */
export const DEBATE_FORMAT: 'fbx' | 'glb' = 'fbx';

const DIR = '/models/duel/';
const EXT = '.' + DEBATE_FORMAT;

// Filenames contain spaces; encode so fetch works under the iOS WKWebView and
// on Vercel, where raw spaces in a URL aren't reliable.
const url = (basename: string) => encodeURI(DIR + basename + EXT);

const PM = 'Pro Magic Pack/';        // casts (stripped of VFX) + reactions
const GB = 'Gestures Pack Basic/';   // scoff / dismiss / concede body language

// anim → clip-pool (rotated by round index so repeats don't look identical).
// Clip key = path under the duel folder, no extension.
const RAW: Record<DebateAnim, string[]> = {
  idle:    [PM + 'standing idle', PM + 'standing idle 02'],
  assert:  [PM + 'Standing 2H Cast Spell 01', PM + 'Standing 2H Magic Attack 01'],
  retort:  [GB + 'dismissing gesture', GB + 'shaking head no'],
  provoke: [GB + 'being cocky', GB + 'sarcastic head nod'],
  press:   [PM + 'Standing 2H Magic Area Attack 01', PM + 'Standing 2H Magic Attack 03'],
  flinch:  [GB + 'annoyed head shake', PM + 'Standing React Small From Front'],
  recoil:  [PM + 'Standing React Large From Front'],
  rout:    [PM + 'Standing React Death Backward'],
  win:     [GB + 'being cocky', GB + 'acknowledging'],
};

export interface DebatePack {
  character: string;                         // mesh URL
  actionClips: Record<DebateAnim, string[]>; // anim → clip keys (rotated by round)
  clipKeys: string[];                        // every unique clip key, in load order
  clipFiles: Record<string, string>;         // clip key → URL
  idleKey: string;
  urls: string[];                            // [character, ...clip URLs] for useLoader
}

function buildPack(characterBasename: string, raw: Record<DebateAnim, string[]>): DebatePack {
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

// Both scholars share one rig/mesh; the robe colour is tinted per side at clone
// time (see DebateArena3D.applyRobe), so a single pack drives both debaters.
export const DEBATE_PACK: DebatePack = buildPack('Pro Magic Pack/X Bot', RAW);

/**
 * Assets are present, so the arena uses the realistic backend. Set to `false`
 * to force the built-in procedural scholar fallback (e.g. while debugging).
 */
export const DEBATE_ASSETS_READY = true;
