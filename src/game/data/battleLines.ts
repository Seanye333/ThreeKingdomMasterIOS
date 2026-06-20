/**
 * 台詞庫 — spoken lines for the interactive 單挑 and 舌戰. Each notable move can
 * voice a short bilingual barb; finishers (必殺技 / 罵倒) and personas get their
 * own flavour. Text-only for now (no audio); surfaced in the bout log + overlay.
 */
import type { DuelMove, DuelPersona } from '../systems/duel';
import type { DebateMove, DebatePersona } from '../systems/wordWar';

export interface Line { zh: string; en: string }

const pick = <T,>(arr: T[], rng: () => number): T => arr[Math.floor(rng() * arr.length)];

// ─── 單挑 ────────────────────────────────────────────────────────────────────
const DUEL_LINES: Partial<Record<DuelMove, Line[]>> = {
  power: [
    { zh: '看我這一擊!', en: 'Feel the weight of this!' },
    { zh: '納命來!', en: 'Your life is forfeit!' },
  ],
  combo: [
    { zh: '一招接一招,接得住嗎?', en: 'Blow upon blow — can you keep up?' },
    { zh: '連環不斷!', en: 'No respite for you!' },
  ],
  thrust: [
    { zh: '破!', en: 'Pierce!' },
    { zh: '一槍封喉!', en: 'Straight for the throat!' },
  ],
  parry: [
    { zh: '就這點本事?', en: 'Is that all you have?' },
    { zh: '破綻百出!', en: 'Full of openings!' },
  ],
};

// 必殺技 — persona-flavoured finisher cries.
const DUEL_ULT: Record<DuelPersona, Line[]> = {
  aggressive: [{ zh: '受死吧!', en: 'Now you die!' }, { zh: '一擊必殺!', en: 'One blow — one kill!' }],
  cautious:   [{ zh: '時機已到。', en: 'The moment is now.' }, { zh: '了結了。', en: 'It ends here.' }],
  cunning:    [{ zh: '你早已落入我的算計。', en: 'You walked into this long ago.' }, { zh: '勝負已分。', en: 'It was decided already.' }],
  balanced:   [{ zh: '全力一擊!', en: 'With all my strength!' }, { zh: '決勝負!', en: 'We end this!' }],
};

export function duelMoveLine(move: DuelMove, rng: () => number = Math.random): Line | null {
  const pool = DUEL_LINES[move];
  return pool ? pick(pool, rng) : null;
}
export function duelUltLine(persona: DuelPersona, rng: () => number = Math.random): Line {
  return pick(DUEL_ULT[persona], rng);
}

// ─── 舌戰 ────────────────────────────────────────────────────────────────────
const DEBATE_LINES: Partial<Record<DebateMove, Line[]>> = {
  press:   [{ zh: '我且問你 — 何以自處?', en: 'I ask you plainly — what is your answer?' }, { zh: '步步緊逼,看你如何辯解!', en: 'Question upon question — squirm if you can!' }],
  cite:    [{ zh: '昔者聖人有云……', en: 'As the sages of old taught us…' }, { zh: '史冊俱在,豈容狡辯?', en: 'The records stand — there is no twisting them.' }],
  scorn:   [{ zh: '哂!此等見識,可笑可笑。', en: 'Ha! Such reasoning — laughable.' }, { zh: '不值一哂。', en: 'Hardly worth a chuckle.' }],
  analogy: [{ zh: '譬如以水救火,愈救愈烈。', en: 'It is like dousing a fire with oil.' }, { zh: '猶緣木而求魚也。', en: 'Like climbing a tree to catch a fish.' }],
  rebuke:  [{ zh: '住口!安敢妄言!', en: 'Silence! How dare you prattle on!' }, { zh: '一派胡言,豈有此理!', en: 'Utter nonsense — preposterous!' }],
  deceive: [{ zh: '此一時,彼一時也。', en: 'What held then need not hold now.' }, { zh: '君只知其一,不知其二。', en: 'You see the half, never the whole.' }],
};

// 罵倒 — persona-flavoured routing finishers (composure broken).
const DEBATE_ROUT: Record<DebatePersona, Line[]> = {
  sage:   [{ zh: '言盡於此,先生請回。', en: 'I have said my piece — you may withdraw.' }],
  fierce: [{ zh: '匹夫!也敢與我論理?', en: 'Fool! And you presumed to argue with me?' }],
  sly:    [{ zh: '我早知你詞窮，何必相逼。', en: 'I knew you would run dry. Why force it?' }],
};

export function debateMoveLine(move: DebateMove, rng: () => number = Math.random): Line | null {
  const pool = DEBATE_LINES[move];
  return pool ? pick(pool, rng) : null;
}
export function debateRoutLine(persona: DebatePersona, rng: () => number = Math.random): Line {
  return pick(DEBATE_ROUT[persona], rng);
}
