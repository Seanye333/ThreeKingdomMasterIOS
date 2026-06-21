/**
 * 演義成書 — recast the campaign's chronicle as a 章回體 romance: the annals
 * carved into 回 (chapters), each headed by a 回目 couplet and told as running
 * narrative in the 三國演義 voice. Distinct from the 紀傳體《本紀》(historyBook):
 * same ledger, a storyteller's form — meant to be read and shared.
 */
export interface ChronicleEntry {
  year: number;
  season: string;
  zh: string;
  en?: string;
  kind: 'conquest' | 'works' | 'event' | 'rebellion' | 'defense' | string;
}

export interface RomanceChapter {
  number: number;
  /** 回目 — the chapter's couplet title. */
  title: string;
  lines: string[];
}

export interface Romance {
  bookTitle: string;
  chapters: RomanceChapter[];
}

const SEASON_ZH: Record<string, string> = { spring: '春', summer: '夏', autumn: '秋', winter: '冬' };
const OPENERS = ['卻說', '話說', '且說', '時'];
/** Events per 回 — keeps chapters bite-sized. */
const PER_CHAPTER = 5;
/** Kinds worth a 回目 half, most headline-worthy first. */
const HEADLINE_PRIORITY: Record<string, number> = {
  conquest: 4, defense: 3, rebellion: 3, event: 1, works: 0,
};

/** Strip parenthetical asides (full- or half-width) and battle tags. */
function stripAsides(s: string): string {
  return s.replace(/（[^）]*）/g, '').replace(/\([^)]*\)/g, '').replace(/【[^】]*】/g, '').trim();
}

/** Condense one chronicle line into a ≤7-char 回目 half. */
function headlinePhrase(e: ChronicleEntry): string {
  const core = stripAsides(e.zh);
  return core.length > 8 ? core.slice(0, 8) : core;
}

function makeCouplet(chunk: ChronicleEntry[]): string {
  const ranked = [...chunk].sort(
    (a, b) => (HEADLINE_PRIORITY[b.kind] ?? 0) - (HEADLINE_PRIORITY[a.kind] ?? 0),
  );
  const a = ranked[0] ? headlinePhrase(ranked[0]) : '群雄逐鹿';
  const b = ranked.find((e) => e !== ranked[0]) ? headlinePhrase(ranked.find((e) => e !== ranked[0])!) : '天下紛爭';
  return a === b ? a : `${a}　${b}`;
}

export function composeRomance(input: {
  chronicle: ChronicleEntry[];
  forceNameZh: string;
  victoryStatus: string;
}): Romance {
  const bookTitle = `《${input.forceNameZh}演義》`;
  const chapters: RomanceChapter[] = [];

  // Open even an empty campaign with a 楔子.
  if (input.chronicle.length === 0) {
    chapters.push({
      number: 1,
      title: '楔子　霸業未啟',
      lines: ['話說天下大勢,分久必合,合久必分。此卷方啟,英雄未顯,且待後事。'],
    });
    return { bookTitle, chapters };
  }

  const sorted = [...input.chronicle];
  for (let i = 0; i < sorted.length; i += PER_CHAPTER) {
    const chunk = sorted.slice(i, i + PER_CHAPTER);
    const no = chapters.length + 1;
    const opener = OPENERS[no % OPENERS.length];
    const lines = chunk.map((e, j) => {
      const when = `${e.year}年${SEASON_ZH[e.season] ?? ''}`;
      const body = stripAsides(e.zh);
      return j === 0 ? `${opener},${when},${body}。` : `${when},${body}。`;
    });
    chapters.push({ number: no, title: `第${no}回　${makeCouplet(chunk)}`, lines });
  }

  // Closing couplet on the last chapter, fate-aware.
  const last = chapters[chapters.length - 1];
  last.lines.push(
    input.victoryStatus === 'victory'
      ? '正是:亂世如爐銷俊傑,一朝鼎定四海清。'
      : input.victoryStatus === 'defeat'
        ? '正是:勝負兵家原不定,捲土重來未可知。'
        : '欲知後事如何,且聽下回分解。',
  );

  return { bookTitle, chapters };
}

/** Plain-text export of the whole romance. */
export function romanceToText(romance: Romance): string {
  return [
    romance.bookTitle,
    '',
    ...romance.chapters.flatMap((c) => [c.title, ...c.lines, '']),
    '— 三國志大師 說書人',
  ].join('\n');
}
