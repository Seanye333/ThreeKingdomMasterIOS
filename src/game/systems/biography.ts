/**
 * 武將列傳 — a biography composed on the fly from what the campaign has
 * actually recorded: stats archetypes, heroic deeds, epithets and the
 * battle history. Zero new bookkeeping; the history was already there,
 * this module just writes it down like a court historian would.
 */
import type { EntityId, HistoricBattle, Officer } from '../types';
import type { HeroicDeeds } from '../types/deeds';

export interface BioParagraph {
  zh: string;
  en: string;
}

/** The officer's defining victory — the biggest battle they personally
 *  commanded and won (by total troops engaged). */
export function signatureBattle(officerId: EntityId, history: HistoricBattle[]): HistoricBattle | null {
  let best: HistoricBattle | null = null;
  let bestSize = 0;
  for (const b of history) {
    const wonAsAttacker = b.attackerWins && b.attacker.commanderId === officerId;
    const wonAsDefender = !b.attackerWins && b.defender.commanderId === officerId;
    if (!wonAsAttacker && !wonAsDefender) continue;
    const size = b.attacker.troops + b.defender.troops;
    if (size > bestSize) { bestSize = size; best = b; }
  }
  return best;
}

function archetype(o: Officer): BioParagraph | null {
  const s = o.stats;
  if (s.war >= 90) return { zh: '有萬夫不當之勇', en: 'a warrior said to be worth ten thousand men' };
  if (s.intelligence >= 90) return { zh: '有經天緯地之才', en: 'a mind that ordered heaven and earth' };
  if (s.politics >= 85) return { zh: '有治世之能', en: 'a gift for governing in troubled times' };
  if (s.leadership >= 88) return { zh: '有統御三軍之略', en: 'a general born to command armies' };
  if (s.charisma >= 85) return { zh: '素有人望', en: 'beloved wherever they served' };
  return null;
}

export function composeBiography(input: {
  officer: Officer;
  deeds: HeroicDeeds | null;
  battleHistory: HistoricBattle[];
  /** zh name of the force they serve (or null for 在野). */
  forceNameZh?: string | null;
  cityNameZhById?: Record<string, string>;
}): BioParagraph[] {
  const { officer: o, deeds: d } = input;
  const out: BioParagraph[] = [];

  // 開篇 — who they are.
  const arch = archetype(o);
  const serve = input.forceNameZh
    ? { zh: `仕於${input.forceNameZh}`, en: `serves ${input.forceNameZh}` }
    : { zh: '今在野', en: 'currently unaffiliated' };
  const death = o.status === 'dead'
    ? (o.posthumousName ? `已歿,朝廷追諡曰「${o.posthumousName}」。` : '已歿。')
    : null;
  const deathEn = o.status === 'dead'
    ? (o.posthumousName ? `now deceased, posthumously honored as ${o.posthumousName}.` : 'now deceased.')
    : null;
  out.push({
    zh: `${o.name.zh},生於${o.birthYear}年。${arch ? arch.zh + ',' : ''}${death ?? serve.zh + '。'}`,
    en: `${o.name.en}, born ${o.birthYear}${arch ? ', ' + arch.en : ''}; ${deathEn ?? serve.en + '.'}`,
  });

  // 戰績.
  if (d && (d.battlesWon + d.battlesLost > 0 || d.duelsWon > 0 || d.killsTroops > 0)) {
    const parts: string[] = [];
    const partsEn: string[] = [];
    if (d.battlesWon + d.battlesLost > 0) {
      parts.push(`歷戰${d.battlesWon + d.battlesLost}場,勝${d.battlesWon}`);
      partsEn.push(`fought ${d.battlesWon + d.battlesLost} battles, won ${d.battlesWon}`);
    }
    if (d.killsTroops >= 1000) {
      parts.push(`殲敵約${Math.round(d.killsTroops / 1000)}千`);
      partsEn.push(`~${Math.round(d.killsTroops / 1000)}k enemy troops felled`);
    }
    if (d.duelsWon > 0) {
      parts.push(`單挑勝${d.duelsWon}陣`);
      partsEn.push(`${d.duelsWon} duels won`);
    }
    if (d.citiesTaken > 0) {
      parts.push(`拔城${d.citiesTaken}座`);
      partsEn.push(`${d.citiesTaken} cities taken`);
    }
    out.push({ zh: `興兵以來,${parts.join(',')}。`, en: `In the field: ${partsEn.join('; ')}.` });
  }

  // 成名之戰.
  const sig = signatureBattle(o.id, input.battleHistory);
  if (sig) {
    const place = input.cityNameZhById?.[sig.cityId] ?? sig.cityId;
    const scale = sig.attacker.troops + sig.defender.troops;
    out.push({
      zh: `${sig.date.year}年${place}之役,兩軍合${Math.round(scale / 1000)}千之眾,${o.name.zh}督軍克之,遂成名。`,
      en: `Made their name at ${place} (${sig.date.year}), prevailing in a clash of ~${Math.round(scale / 1000)}k troops.`,
    });
  }

  // 文治與謀略.
  if (d && (d.civicWorks > 0 || d.espionageSuccess > 0 || d.trainingsCompleted > 0)) {
    const parts: string[] = [];
    const partsEn: string[] = [];
    if (d.civicWorks > 0) { parts.push(`興政${d.civicWorks}事`); partsEn.push(`${d.civicWorks} civic works`); }
    if (d.espionageSuccess > 0) { parts.push(`運籌帷幄,用間${d.espionageSuccess}成`); partsEn.push(`${d.espionageSuccess} successful plots`); }
    if (d.trainingsCompleted > 0) { parts.push(`治學${d.trainingsCompleted}藝`); partsEn.push(`${d.trainingsCompleted} disciplines mastered`); }
    out.push({ zh: `居朝則${parts.join(',')}。`, en: `At court: ${partsEn.join('; ')}.` });
  }

  // 稱號.
  if (d?.titles && d.titles.length > 0) {
    out.push({
      zh: `世人號曰:${d.titles.join('、')}。`,
      en: `Known to the age as: ${d.titles.join(', ')}.`,
    });
  }

  if (out.length === 1) {
    out.push({
      zh: '事蹟未顯,列傳俟後人補之。',
      en: 'Their story is still unwritten — the historians wait.',
    });
  }
  return out;
}
