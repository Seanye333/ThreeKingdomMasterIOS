/**
 * 終局史書 — the court historians compile the campaign into one scroll:
 * a preface, the annals (from the chronicle), the ten great battles,
 * the lives of the meritorious, and a closing appraisal. Composed from
 * ledgers the game was already keeping; readable any time, definitive
 * at the end.
 */
import type { City, EntityId, Force, HistoricBattle, Officer } from '../types';
import type { HeroicDeeds } from '../types/deeds';
import { composeBiography } from './biography';

export interface BookSection {
  title: string;
  lines: string[];
}

export interface HistoryBookInput {
  playerForceId: EntityId | null;
  forces: Record<EntityId, Force>;
  officers: Record<EntityId, Officer>;
  cities: Record<EntityId, City>;
  deeds: Record<EntityId, HeroicDeeds>;
  battleHistory: HistoricBattle[];
  chronicle: Array<{ year: number; season: string; zh: string; kind: string }>;
  victoryStatus: string;
  startYear: number;
  currentYear: number;
}

const SEASON_ZH: Record<string, string> = { spring: '春', summer: '夏', autumn: '秋', winter: '冬' };

export function composeHistoryBook(input: HistoryBookInput): BookSection[] {
  const force = input.playerForceId ? input.forces[input.playerForceId] : null;
  const ruler = force ? input.officers[force.rulerOfficerId] : null;
  const owned = Object.values(input.cities).filter((c) => c.ownerForceId === input.playerForceId).length;
  const total = Object.values(input.cities).length;
  const years = Math.max(1, input.currentYear - input.startYear);
  const sections: BookSection[] = [];

  // 序
  const fate = input.victoryStatus === 'victory'
    ? `終定鼎天下,四海歸一。`
    : input.victoryStatus === 'defeat'
      ? `霸業未竟,社稷傾覆。後人哀之。`
      : `霸業方興,據城${owned}/${total},史筆未絕。`;
  sections.push({
    title: '序',
    lines: [
      `${force?.name.zh ?? '無名之師'},起於${input.startYear}年,${ruler ? `主公${ruler.name.zh}揭旗倡義` : '群龍無首'}。`,
      `歷${years}載征伐,至${input.currentYear}年,${fate}`,
    ],
  });

  // 大事記 — the chronicle, at most the 30 loudest lines.
  if (input.chronicle.length > 0) {
    sections.push({
      title: '大事記',
      lines: input.chronicle.slice(-30).map((e) => `${e.year}年${SEASON_ZH[e.season] ?? ''} ${e.zh}`),
    });
  }

  // 十大戰役 — by total troops engaged.
  const battles = [...input.battleHistory]
    .sort((a, b) => (b.attacker.troops + b.defender.troops) - (a.attacker.troops + a.defender.troops))
    .slice(0, 10);
  if (battles.length > 0) {
    sections.push({
      title: '十大戰役',
      lines: battles.map((b, i) => {
        const place = input.cities[b.cityId]?.name.zh ?? b.cityId;
        const atk = input.officers[b.attacker.commanderId]?.name.zh ?? '?';
        const def = input.officers[b.defender.commanderId]?.name.zh ?? '?';
        const scale = Math.round((b.attacker.troops + b.defender.troops) / 1000);
        return `${i + 1}. ${b.date.year}年${place}之役 — ${atk}攻${def},兩軍${scale}千之眾,${b.attackerWins ? '攻方克之' : '守方卻之'}${b.cityFalls ? ',城陷' : ''}。`;
      }),
    });
  }

  // 功臣列傳 — top five of YOUR officers by deed weight, one line each.
  const score = (d: HeroicDeeds) =>
    d.citiesTaken * 15 + d.battlesWon * 4 + d.duelsWon * 5 + d.espionageSuccess * 3 + d.civicWorks;
  const meritorious = Object.values(input.deeds)
    .filter((d) => input.officers[d.officerId]?.forceId === input.playerForceId)
    .sort((a, b) => score(b) - score(a))
    .slice(0, 5)
    .filter((d) => score(d) > 0);
  if (meritorious.length > 0) {
    sections.push({
      title: '功臣列傳',
      lines: meritorious.flatMap((d) => {
        const o = input.officers[d.officerId];
        if (!o) return [];
        const bio = composeBiography({
          officer: o,
          deeds: d,
          battleHistory: input.battleHistory,
          forceNameZh: force?.name.zh ?? null,
          cityNameZhById: Object.fromEntries(Object.values(input.cities).map((c) => [c.id, c.name.zh])),
        });
        return [`【${o.name.zh}】` + bio.map((p) => p.zh).join('')];
      }),
    });
  }

  // 贊
  sections.push({
    title: '贊曰',
    lines: [
      input.victoryStatus === 'victory'
        ? '亂世如爐,英雄為薪。今薪盡而火傳,天下太平 — 後之視今,亦猶今之視昔。'
        : input.victoryStatus === 'defeat'
          ? '勝敗兵家事不期,包羞忍恥是男兒。江東子弟多才俊,捲土重來未可知。'
          : '天下大勢,分久必合,合久必分 — 此卷未完。',
    ],
  });

  return sections;
}

/** Plain-text export of the whole scroll. */
export function historyBookToText(sections: BookSection[], forceNameZh: string): string {
  return [
    `《${forceNameZh}本紀》`,
    '',
    ...sections.flatMap((s) => [`■ ${s.title}`, ...s.lines, '']),
    '— 三國志大師 修史局',
  ].join('\n');
}
