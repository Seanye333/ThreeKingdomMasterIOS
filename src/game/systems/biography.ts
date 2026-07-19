/**
 * 武將列傳 — a biography composed on the fly from what the campaign has
 * actually recorded: stats archetypes, heroic deeds, epithets and the
 * battle history. Zero new bookkeeping; the history was already there,
 * this module just writes it down like a court historian would.
 */
import type { EntityId, HistoricBattle, Officer } from '../types';
import type { HeroicDeeds } from '../types/deeds';
import type { FamilyRelation } from '../types/family';
import type { ClanStanding } from '../types/clan';
import type { OathBond } from '../data/bonds';
import { isFeudKind } from '../data/bonds';
import type { BoutRecord } from './duelHall';
import {
  allSwornBrothersOf, swornDepth, rivalsOf, personalEnemiesOf,
  mentorsOf, spousesOf, childrenOf,
} from './relationshipEffects';
import { prestigeTitleById } from '../data/prestige';
import { peerageById } from '../data/peerage';
import { HONORIFICS_BY_ID } from '../data/honorifics';
import { clanTierOf } from './clans';

export interface BioParagraph {
  zh: string;
  en: string;
  /** 交叉引用 anchors — officers this line names (for clickable drill-down) and
   *  a notable bout it recalls (for ▶ replay). Optional; the history-book export
   *  ignores them, so its prose is unaffected. */
  refs?: { officerIds: EntityId[]; boutId?: string };
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
  // ── 交叉引用 inputs — all optional. Supplying `officerNamesById` switches
  //    on the cross-referenced paragraphs (結義/仇讎/師承/婚育/名局/封賞/復仇);
  //    the history-book export omits them all, so its prose stays unchanged. ──
  officerNamesById?: Record<EntityId, { zh: string; en: string }>;
  forceNamesById?: Record<EntityId, { zh: string; en: string }>;
  family?: FamilyRelation[];
  runtimeBonds?: OathBond[];
  duelHall?: BoutRecord[];
  clanStandings?: Record<string, ClanStanding>;
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

  // ── 交叉引用 — woven in only when the caller hands over the name maps. ──
  const names = input.officerNamesById;
  if (names) {
    const onZh = (id: EntityId) => names[id]?.zh ?? id;
    const onEn = (id: EntityId) => names[id]?.en ?? id;
    const fZh = (id: EntityId) => input.forceNamesById?.[id]?.zh ?? id;
    const fEn = (id: EntityId) => input.forceNamesById?.[id]?.en ?? id;
    const cap1 = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
    const top = <T,>(arr: T[]) => arr.slice(0, 3);
    const moreZh = (arr: unknown[]) => (arr.length > 3 ? '等' : '');
    const moreEn = (arr: unknown[]) => (arr.length > 3 ? ' and others' : '');
    const bonds = input.runtimeBonds ?? [];
    const fam = input.family ?? [];

    // 親緣 — 師承 + 婚育.
    const mentorIds = [...new Set([...(o.mentorId ? [o.mentorId] : []), ...mentorsOf(o.id)])];
    const spouseIds = spousesOf(o.id, fam);
    const childIds = childrenOf(o.id, fam);
    const kinZh: string[] = [];
    const kinEn: string[] = [];
    if (mentorIds.length) {
      kinZh.push(`師事${top(mentorIds).map(onZh).join('、')}${moreZh(mentorIds)}`);
      kinEn.push(`Studied under ${top(mentorIds).map(onEn).join(', ')}.`);
    }
    if (spouseIds.length) {
      kinZh.push(childIds.length ? `娶${top(spouseIds).map(onZh).join('、')},育${childIds.length}子` : `娶${top(spouseIds).map(onZh).join('、')}`);
      kinEn.push(childIds.length ? `Married ${top(spouseIds).map(onEn).join(', ')}; ${childIds.length} children.` : `Married ${top(spouseIds).map(onEn).join(', ')}.`);
    } else if (childIds.length) {
      kinZh.push(`育${childIds.length}子`);
      kinEn.push(`Father to ${childIds.length} children.`);
    }
    if (kinZh.length) {
      out.push({ zh: `${kinZh.join(',')}。`, en: kinEn.join(' '), refs: { officerIds: [...mentorIds, ...spouseIds] } });
    }

    // 金石之交 — sworn brothers (static lore + 結拜/義結 bonds).
    const sworn = allSwornBrothersOf(o.id, bonds);
    if (sworn.length) {
      const maxDepth = Math.max(...sworn.map((id) => swornDepth(o.id, id, bonds)));
      const labelZh = maxDepth >= 3 ? '生死之交' : maxDepth === 1 ? '義交' : '義結金蘭';
      const labelEn = maxDepth >= 3 ? 'a life-and-death oath' : 'sworn brotherhood';
      out.push({
        zh: `與${top(sworn).map(onZh).join('、')}${moreZh(sworn)}結為${labelZh}。`,
        en: `Bound to ${top(sworn).map(onEn).join(', ')}${moreEn(sworn)} by ${labelEn}.`,
        refs: { officerIds: sworn },
      });
    }

    // 仇讎 — feuds (宿怨) + rivals (宿敵) + personal enemies (私仇), deduped.
    const feudPairs: Array<{ id: EntityId; depth: number }> = [];
    for (const bd of bonds) {
      if (!isFeudKind(bd.kind)) continue;
      const other = bd.officerA === o.id ? bd.officerB : bd.officerB === o.id ? bd.officerA : null;
      if (other) feudPairs.push({ id: other, depth: bd.depth ?? 1 });
    }
    const feudIds = new Set(feudPairs.map((f) => f.id));
    const rivals = rivalsOf(o.id).filter((id) => !feudIds.has(id));
    const rivalSet = new Set(rivals);
    const enemies = personalEnemiesOf(o.id).filter((id) => !feudIds.has(id) && !rivalSet.has(id));
    const foeRefs: EntityId[] = [];
    const foeZh: string[] = [];
    const foeEn: string[] = [];
    if (feudPairs.length) {
      const maxDepth = Math.max(...feudPairs.map((f) => f.depth));
      const fl = maxDepth >= 3 ? '死敵' : maxDepth === 1 ? '嫌隙' : '宿怨';
      const ids = feudPairs.map((f) => f.id);
      foeRefs.push(...ids);
      foeZh.push(`與${top(ids).map(onZh).join('、')}${moreZh(ids)}結為${fl}`);
      foeEn.push(`locked in ${maxDepth >= 3 ? 'a mortal feud' : 'enmity'} with ${top(ids).map(onEn).join(', ')}`);
    }
    if (rivals.length) {
      foeRefs.push(...rivals);
      foeZh.push(`與${top(rivals).map(onZh).join('、')}${moreZh(rivals)}互為宿敵`);
      foeEn.push(`a longtime rival of ${top(rivals).map(onEn).join(', ')}`);
    }
    if (enemies.length) {
      foeRefs.push(...enemies);
      foeZh.push(`與${top(enemies).map(onZh).join('、')}${moreZh(enemies)}有私仇`);
      foeEn.push(`bears a private grudge against ${top(enemies).map(onEn).join(', ')}`);
    }
    if (foeZh.length) {
      out.push({ zh: `${foeZh.join(';')}。`, en: cap1(`${foeEn.join('; ')}.`), refs: { officerIds: foeRefs } });
    }

    // 名局 — the most memorable bout they won (from the 名局廊).
    const won = (input.duelHall ?? []).filter((b) =>
      b.kind === 'duel'
        ? (b.winner === 'attacker' && b.aId === o.id) || (b.winner === 'defender' && b.dId === o.id)
        : b.kind === 'melee'
          // 團戰 — the captain of the winning knot claims the day.
          ? (b.winner === 'a' && b.aId === o.id) || (b.winner === 'b' && b.dId === o.id)
          : (b.winner === 'a' && b.aId === o.id) || (b.winner === 'd' && b.dId === o.id),
    );
    if (won.length) {
      const decisive = (b: BoutRecord) =>
        b.kind === 'duel' ? b.killed
        : b.kind === 'melee' ? b.fighters.some((f) => f.fate === 'slain')
        : b.routed;
      const weight = (b: BoutRecord) => (b.kind === 'melee' ? b.rounds : b.fx.length);
      const score = (b: BoutRecord) => (decisive(b) ? 1000 : 0) + weight(b);
      const best = won.reduce((a, b) => (score(b) > score(a) ? b : a));
      const loserId = best.aId === o.id ? best.dId : best.aId;
      const yr = best.year;
      let zh: string, en: string;
      if (best.kind === 'duel') {
        zh = best.killed ? `${yr}年陣前斬${onZh(loserId)}。` : `${yr}年陣前力克${onZh(loserId)}。`;
        en = best.killed ? `Slew ${onEn(loserId)} in single combat (${yr}).` : `Bested ${onEn(loserId)} in single combat (${yr}).`;
      } else if (best.kind === 'melee') {
        zh = `${yr}年率眾將團戰並擊,大破${onZh(loserId)}等敵陣群英。`;
        en = `Led the champions' melee that broke ${onEn(loserId)}'s knot (${yr}).`;
      } else {
        zh = best.routed ? `${yr}年舌戰罵死${onZh(loserId)}。` : `${yr}年廷辯折服${onZh(loserId)}。`;
        en = best.routed ? `Routed ${onEn(loserId)} in debate (${yr}).` : `Out-argued ${onEn(loserId)} in debate (${yr}).`;
      }
      out.push({ zh, en, refs: { officerIds: [loserId], boutId: best.id } });
    }

    // 封賞 — 名號將軍 / 爵位 / 威名 / 家門出身.
    const honor = o.honorificId ? HONORIFICS_BY_ID[o.honorificId] : null;
    const peer = peerageById(o.peerageId);
    const prest = prestigeTitleById(o.prestigeTitleId);
    const tier = o.clanId && input.clanStandings ? clanTierOf(o, input.clanStandings) : null;
    const tierZh = tier === 'great' ? '世家' : tier === 'gentry' ? '士族' : null;
    const tierEn = tier === 'great' ? 'a great house' : tier === 'gentry' ? 'a gentry house' : null;
    const honZh: string[] = [];
    const honEn: string[] = [];
    if (honor) { honZh.push(`拜${honor.name.zh}`); honEn.push(`raised to ${honor.name.en}`); }
    if (peer) { honZh.push(`封${peer.name.zh}`); honEn.push(`enfeoffed as ${peer.name.en}`); }
    if (prest) { honZh.push(`時人謂之${prest.name.zh}`); honEn.push(`hailed as ${prest.name.en}`); }
    if (honZh.length || tierZh) {
      const zhParts = [honZh.length ? `朝廷${honZh.join(',')}` : '', tierZh ? `出身${tierZh}` : ''].filter(Boolean);
      const enParts = [honEn.length ? cap1(honEn.join(', ')) : '', tierEn ? `Of ${tierEn}` : ''].filter(Boolean);
      out.push({ zh: `${zhParts.join(';')}。`, en: `${enParts.join('; ')}.` });
    }

    // 生涯轉折 — 復仇 + 在囚.
    const vengeance: Array<{ victim: EntityId; force: EntityId; sworn: boolean }> = [
      ...Object.entries(o.killedRelativesBy ?? {}).map(([victim, force]) => ({ victim, force, sworn: false })),
      ...Object.entries(o.killedSwornBy ?? {}).map(([victim, force]) => ({ victim, force, sworn: true })),
    ];
    if (vengeance.length) {
      const v = vengeance[0];
      out.push({
        zh: `${fZh(v.force)}害其${v.sworn ? '義兄弟' : '骨肉'}${onZh(v.victim)},誓報此仇。`,
        en: `Sworn to avenge ${v.sworn ? 'sworn brother' : 'kin'} ${onEn(v.victim)}, slain by ${fEn(v.force)}.`,
        refs: { officerIds: [v.victim] },
      });
    }
    if (o.status === 'imprisoned') {
      out.push({ zh: '今為階下囚,待時而動。', en: 'Currently held captive, awaiting their hour.' });
    }
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
