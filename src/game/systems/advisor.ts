/**
 * 軍師錦囊 — your best mind reads the board and hands you the moves.
 *
 * Each tick the advisor scans for the loudest problems and opportunities;
 * every tip carries a one-tap action that routes through the ordinary
 * order pipeline. The advice is deliberately conservative — the 軍師 never
 * spends what the treasury can't afford and never orders a busy officer.
 *
 * 軍師做活 — the advisor is no longer a name on the panel. A sharper mind
 * (or your appointed 軍師) reads further:
 *   • more counsel       — 3 tips → up to 5, by intelligence
 *   • earlier warning    — the thresholds for 兵臨/民變/糧盡 relax with 智,
 *                          so a 神機 advisor sounds the alarm before the fire
 *   • deeper counsel     — 謀略獻策 (set rivals against each other / 遠交近攻)
 *                          and 名士奇策 (signature counsel from the great
 *                          strategists) unlock only for a capable mind
 * and the appointed 軍師 speaks first, even over a sharper unappointed aide.
 */
import type { Army, City, EntityId, Force, InternalAffairsType, Officer, Season } from '../types';
import type { DiplomaticState } from '../types/diplomacy';
import { getRelation } from '../types/diplomacy';
import { COMMAND_DEFS } from './commands';
import { foodRate } from './market';
import { forcesAdjacent, forceEmbroiled, SCHEME_DEFS, type SchemeId } from './schemes';

export interface AdvisorTip {
  id: string;
  /** The advice, in the advisor's voice. */
  zh: string;
  en: string;
  priority: number;
  action:
    | { kind: 'command'; cityId: EntityId; type: InternalAffairsType; officerId: EntityId }
    | { kind: 'trade'; cityId: EntityId; trade: 'buy' | 'sell'; amount: number }
    | { kind: 'banquet'; cityId: EntityId }
    | { kind: 'scheme'; schemeId: SchemeId; targetA: EntityId; targetB?: EntityId }
    | { kind: 'none' };
}

export interface AdvisorInput {
  cities: Record<EntityId, City>;
  officers: Record<EntityId, Officer>;
  armies: Record<EntityId, Army>;
  busyOfficerIds: ReadonlySet<EntityId>;
  playerForceId: EntityId;
  season: Season;
  /** The advisor whose 智 drives slot count + foresight + signature counsel.
   *  Absent → a neutral aide (INT 70): 3 tips, no relaxed thresholds. */
  advisor?: Officer | null;
  /** Rival forces — names/strength for 謀略獻策. Omit to skip scheme counsel. */
  forces?: Record<EntityId, Force>;
  /** Standing relations — sour pairs make the easiest 二虎競食 marks. */
  diplomacy?: DiplomaticState;
  /** Where schemes are paid from — gates the 照辦 button on scheme tips. */
  playerCapitalId?: EntityId;
  /** The lord himself never "defects"; excluded from 忠誠告警. */
  rulerOfficerId?: EntityId;
}

/** A 軍師 appointment, if any (a thin slice of the civic-appointment record). */
export interface AdvisorAppointment {
  officerId: EntityId;
  forceId: EntityId;
  titleId: string;
}

/**
 * The voice of the tips. Your appointed 軍師 speaks first; absent one, your
 * sharpest serving mind. A nameless aide if the bench is empty.
 */
export function pickAdvisor(
  officers: Record<EntityId, Officer>,
  playerForceId: EntityId,
  appointments?: ReadonlyArray<AdvisorAppointment>,
): Officer | null {
  const eligible = (o: Officer | undefined | null): o is Officer =>
    !!o && o.forceId === playerForceId && o.status !== 'dead' && o.status !== 'imprisoned' && o.status !== 'unsearched';
  // 拜將拜相 — the man you named 軍師 advises, even over a sharper aide.
  const appt = appointments?.find((a) => a.forceId === playerForceId && a.titleId === 'strategist');
  if (appt && eligible(officers[appt.officerId])) return officers[appt.officerId];
  return Object.values(officers)
    .filter(eligible)
    .sort((a, b) => b.stats.intelligence - a.stats.intelligence)[0] ?? null;
}

function idleIn(input: AdvisorInput, cityId: EntityId): Officer | null {
  return Object.values(input.officers)
    .filter((o) => o.forceId === input.playerForceId
      && o.locationCityId === cityId
      && !o.task
      && (o.status === 'active' || o.status === 'idle')
      && !input.busyOfficerIds.has(o.id))
    .sort((a, b) => b.stats.politics - a.stats.politics)[0] ?? null;
}

/** A command tip if an idle officer + the silver are both on hand, else 參考. */
function cmdTip(
  input: AdvisorInput,
  city: City,
  type: InternalAffairsType,
  fields: { id: string; zh: string; en: string; priority: number },
): AdvisorTip {
  const officer = idleIn(input, city.id);
  const canAct = officer && city.gold >= COMMAND_DEFS[type].goldCost;
  return {
    ...fields,
    action: canAct ? { kind: 'command', cityId: city.id, type, officerId: officer.id } : { kind: 'none' },
  };
}

/**
 * 名士奇策 — the great strategists, when they hold your ear, give counsel in
 * their own hand. Flavour + a nudge toward the move that made them famous.
 */
function legendaryCounsel(input: AdvisorInput, sage: Officer, own: City[]): AdvisorTip | null {
  if (!own.length) return null;
  const byAgri = [...own].sort((a, b) => a.agriculture - b.agriculture)[0];
  const byWall = [...own].sort((a, b) => a.defense - b.defense)[0];
  const byTroops = [...own].sort((a, b) => b.troops - a.troops)[0];
  const PRI = 64;
  switch (sage.id) {
    case 'zhuge-liang':
      return cmdTip(input, byAgri, 'develop-agriculture', {
        id: `sage-${sage.id}`, priority: PRI,
        zh: `孔明撫扇而言:「治戎為長,務農足食 — 願於${byAgri.name.zh}屯田勸耕,根固而後圖天下。」`,
        en: `Kongming counsels patient husbandry — break new fields at ${byAgri.name.en} before reaching for the realm.`,
      });
    case 'sima-yi':
      return cmdTip(input, byWall, 'build-defense', {
        id: `sage-${sage.id}`, priority: PRI,
        zh: `仲達斂目:「善藏其鋒,待釁而動 — 宜厚${byWall.name.zh}之壘,以逸待勞,時至自有可乘。」`,
        en: `Zhongda preaches patience — thicken ${byWall.name.en}'s walls and let the foe tire first.`,
      });
    case 'zhou-yu':
      return cmdTip(input, byTroops, 'drill-troops', {
        id: `sage-${sage.id}`, priority: PRI,
        zh: `公瑾撫琴:「兵在精不在多 — 願精練${byTroops.name.zh}之卒,水陸並進,可決勝於談笑。」`,
        en: `Gongjin would drill ${byTroops.name.en}'s ranks to a razor's edge — quality wins the day.`,
      });
    case 'guo-jia':
      return {
        id: `sage-${sage.id}`, priority: PRI, action: { kind: 'none' },
        zh: `奉孝撫掌:「兵貴神速,主公有十勝,敵有十敗 — 見可乘之隙,當疾取之,遲則生變。」`,
        en: `Fengxiao urges speed — you hold ten advantages; strike the opening before it closes.`,
      };
    case 'jia-xu':
      return {
        id: `sage-${sage.id}`, priority: PRI, action: { kind: 'none' },
        zh: `文和低語:「亂世自保為先 — 驅人相鬥,坐觀虎爭,我不損一卒而敵自弱。」`,
        en: `Wenhe whispers — let rivals bleed each other; you spend not a single soldier.`,
      };
    case 'xun-yu': {
      const talentCity = own.find((c) => Object.values(input.officers)
        .some((o) => o.status === 'unsearched' && o.locationCityId === c.id));
      if (talentCity) return cmdTip(input, talentCity, 'search', {
        id: `sage-${sage.id}`, priority: PRI,
        zh: `文若進言:「廣攬賢才,固本寧邦 — 聞${talentCity.name.zh}有遺賢,宜速訪之,人安則國安。」`,
        en: `Wenruo counsels talent first — hidden worthies wait at ${talentCity.name.en}; bring them in.`,
      });
      return {
        id: `sage-${sage.id}`, priority: PRI, action: { kind: 'none' },
        zh: `文若進言:「廣攬賢才,固本寧邦 — 王業之基,在得人心、收賢士。」`,
        en: `Wenruo counsels that the dynasty's foundation is winning hearts and worthy minds.`,
      };
    }
    case 'lu-xun':
      return cmdTip(input, byWall, 'build-defense', {
        id: `sage-${sage.id}`, priority: PRI,
        zh: `伯言斂容:「以逸待勞,後發制人 — 固${byWall.name.zh}之守,驕敵深入,一炬可破連營。」`,
        en: `Boyan would fortify ${byWall.name.en} and bait the foe deep — then burn the camps.`,
      });
    case 'pang-tong':
      return {
        id: `sage-${sage.id}`, priority: PRI, action: { kind: 'none' },
        zh: `士元獻策:「連環之計,可束敵手 — 環環相扣,則堅陣可破,然用之者當慎防火攻。」`,
        en: `Shiyuan offers the chained-ploy — bind the foe's hand, but beware the answering fire.`,
      };
    case 'fa-zheng':
      return {
        id: `sage-${sage.id}`, priority: PRI, action: { kind: 'none' },
        zh: `孝直進言:「奇正相生,出敵不意 — 因勢用險,可收奇功於一役。」`,
        en: `Xiaozhi counsels the bold gambit — read the moment and take the daring line.`,
      };
    default:
      return null;
  }
}

export function adviseTips(input: AdvisorInput): AdvisorTip[] {
  const tips: AdvisorTip[] = [];
  const own = Object.values(input.cities).filter((c) => c.ownerForceId === input.playerForceId);
  const hostiles = Object.values(input.armies).filter((a) => a.forceId !== input.playerForceId);

  // 軍師做活 — a sharper mind sees further and speaks more.
  const iq = input.advisor?.stats.intelligence ?? 70;
  const foresight = Math.max(0, iq - 70) / 100;                 // 0 at ≤70 … 0.30 at 100
  const maxTips = 3 + (iq >= 80 ? 1 : 0) + (iq >= 92 ? 1 : 0);  // 3 … 5

  for (const city of own) {
    // ① 兵臨城下 — hostile columns marching here. A sharp 軍師 sounds the
    //    alarm before they actually outnumber the walls (斥候警讯).
    const inbound = hostiles.filter((a) => a.targetCityId === city.id && !a.holding)
      .reduce((sum, a) => sum + a.troops, 0);
    if (inbound > city.troops * (1 - foresight * 0.5)) {
      const dire = inbound > city.troops;
      tips.push(cmdTip(input, city, 'recruit-troops', {
        id: `threat-${city.id}`,
        zh: dire
          ? `敵軍${Math.round(inbound / 1000)}千之眾正撲${city.name.zh},守軍恐難支 — 宜速徵兵固守。`
          : `斥候報:${Math.round(inbound / 1000)}千敵旅壓向${city.name.zh},雖未及城下,宜早徵兵以備。`,
        en: dire
          ? `~${Math.round(inbound / 1000)}k hostiles march on ${city.name.en}; the garrison won't hold. Recruit now.`
          : `Scouts: ~${Math.round(inbound / 1000)}k bearing down on ${city.name.en} — recruit early, before they arrive.`,
        priority: (dire ? 100 : 86) + inbound / 1000,
      }));
    }

    // ② 民心浮動 — unrest brewing (a charismatic eye catches it sooner).
    if (city.loyalty < 50 + foresight * 30) {
      tips.push(cmdTip(input, city, 'improve-loyalty', {
        id: `unrest-${city.id}`,
        zh: `${city.name.zh}民忠僅${city.loyalty},恐生民變 — 宜行安撫。`,
        en: `${city.name.en} loyalty is ${city.loyalty}; revolt brews. Soothe it.`,
        priority: 80 + (50 - city.loyalty),
      }));
    }

    // ③ 糧將盡 — the granary won't feed the garrison much longer.
    if (city.food < city.troops * (2 + foresight * 4) && city.gold >= 500) {
      tips.push({
        id: `hunger-${city.id}`,
        zh: `${city.name.zh}存糧不繼(${city.food.toLocaleString()}糧養${(city.troops / 1000).toFixed(1)}千兵)— 宜市易購糧。`,
        en: `${city.name.en} is eating through its stores — buy grain.`,
        priority: 75,
        action: { kind: 'trade', cityId: city.id, trade: 'buy', amount: 500 },
      });
    }

    // ④ 穀賤傷農反着來 — autumn glut + thin purse: sell high stock.
    if (city.gold < 300 && city.food > city.troops * 8 && foodRate(city, input.season) > 0) {
      tips.push({
        id: `glut-${city.id}`,
        zh: `${city.name.zh}倉廩盈而府庫虛 — 宜糶糧充金。`,
        en: `${city.name.en} is grain-rich and gold-poor — sell stock.`,
        priority: 60,
        action: { kind: 'trade', cityId: city.id, trade: 'sell', amount: 5000 },
      });
    }

    // ⑤ 賢才蒙塵 — unsearched officers wait in an own city.
    const hidden = Object.values(input.officers)
      .filter((o) => o.status === 'unsearched' && o.locationCityId === city.id).length;
    if (hidden > 0) {
      tips.push(cmdTip(input, city, 'search', {
        id: `talent-${city.id}`,
        zh: `聞${city.name.zh}有在野賢士 — 宜遣人尋訪。`,
        en: `Word of hidden talent at ${city.name.en} — send a search.`,
        priority: 50 + hidden * 3,
      }));
    }

    // ⑥ 良將閒置 — three or more idle officers in one city is wasted salt.
    const idleCount = Object.values(input.officers)
      .filter((o) => o.forceId === input.playerForceId
        && o.locationCityId === city.id && !o.task
        && (o.status === 'active' || o.status === 'idle')
        && !input.busyOfficerIds.has(o.id)).length;
    if (idleCount >= 3) {
      const weakest: InternalAffairsType = city.agriculture <= city.commerce ? 'develop-agriculture' : 'develop-commerce';
      tips.push(cmdTip(input, city, weakest, {
        id: `idle-${city.id}`,
        zh: `${city.name.zh}有${idleCount}員良將賦閒 — 養兵千日,宜遣其勸${weakest === 'develop-agriculture' ? '農' : '商'}。`,
        en: `${idleCount} officers idle at ${city.name.en} — put one to work.`,
        priority: 30,
      }));
    }
  }

  // ⑦ 忠誠告警 — a key officer's heart is slipping; win them back with a
  //    banquet before they bolt (the lord himself never defects).
  const wavering = Object.values(input.officers)
    .filter((o) => o.forceId === input.playerForceId && o.id !== input.rulerOfficerId
      && (o.status === 'active' || o.status === 'idle') && o.loyalty < 40)
    .sort((a, b) => a.loyalty - b.loyalty)[0];
  if (wavering) {
    const here = input.cities[wavering.locationCityId ?? ''];
    const canAct = !!here && here.ownerForceId === input.playerForceId;
    tips.push({
      id: `loyalty-${wavering.id}`,
      zh: `${wavering.name.zh}忠心僅${wavering.loyalty},久必生異志 — 宜設宴加恩,以結其心。`,
      en: `${wavering.name.en}'s loyalty is ${wavering.loyalty}; hold a banquet and win them back before they bolt.`,
      priority: 90 - wavering.loyalty,
      action: canAct ? { kind: 'banquet', cityId: here.id } : { kind: 'none' },
    });
  }

  // ⑦b 民政三患 (§1.11–§1.14) — the advisor names the civic rot the player is
  // most likely to be ignoring, worst city first, and hands them the command.
  {
    const worstDocket = [...own].sort((a, b) => (b.caseload ?? 0) - (a.caseload ?? 0))[0];
    if (worstDocket && (worstDocket.caseload ?? 0) >= 45) {
      tips.push(cmdTip(input, worstDocket, 'adjudicate', {
        id: `docket-${worstDocket.id}`,
        zh: `${worstDocket.name.zh}獄訟積${Math.round(worstDocket.caseload ?? 0)},民有冤滯 — 宜遣能吏決獄,遲則生變。`,
        en: `${worstDocket.name.en}'s docket stands at ${Math.round(worstDocket.caseload ?? 0)} — send an able hand to hear the cases.`,
        priority: 58 + Math.round((worstDocket.caseload ?? 0) / 5),
      }));
    }
    const worstHidden = [...own].sort((a, b) => (b.hiddenHouseholds ?? 0) - (a.hiddenHouseholds ?? 0))[0];
    if (worstHidden && (worstHidden.hiddenHouseholds ?? 0) >= 20) {
      tips.push(cmdTip(input, worstHidden, 'household-audit', {
        id: `hidden-${worstHidden.id}`,
        zh: `${worstHidden.name.zh}蔭戶已${(worstHidden.hiddenHouseholds ?? 0).toFixed(0)}%,租賦大削 — 宜括戶檢地(然豪右必怨)。`,
        en: `${worstHidden.name.en} has ${(worstHidden.hiddenHouseholds ?? 0).toFixed(0)}% of its people off the registers — audit them back on.`,
        priority: 56 + Math.round((worstHidden.hiddenHouseholds ?? 0) / 5),
      }));
    }
    const worstHoard = [...own].sort((a, b) => (b.hoardedGrain ?? 0) - (a.hoardedGrain ?? 0))[0];
    if (worstHoard && (worstHoard.hoardedGrain ?? 0) >= 18) {
      tips.push(cmdTip(input, worstHoard, 'curb-hoarding', {
        id: `hoard-${worstHoard.id}`,
        zh: `${worstHoard.name.zh}豪商囤糧${Math.round(worstHoard.hoardedGrain ?? 0)}%,米價騰貴 — 宜抑兼併,或築常平倉以平之。`,
        en: `Merchants have cornered ${Math.round(worstHoard.hoardedGrain ?? 0)}% of ${worstHoard.name.en}'s grain — break the warehouses open.`,
        priority: 57 + Math.round((worstHoard.hoardedGrain ?? 0) / 5),
      }));
    }
  }

  // ⑧ 敵城空虛 — a weak neighbour invites ambition (informational).
  const strongest = Math.max(0, ...own.map((c) => c.troops));
  for (const city of own) {
    for (const adjId of city.adjacentCityIds ?? []) {
      const nb = input.cities[adjId];
      if (!nb || !nb.ownerForceId || nb.ownerForceId === input.playerForceId) continue;
      if (nb.troops < strongest * 0.35 && city.troops > nb.troops * 2) {
        tips.push({
          id: `weak-${adjId}`,
          zh: `${nb.name.zh}兵微將寡(僅${(nb.troops / 1000).toFixed(1)}千)而${city.name.zh}兵鋒正盛 — 天予不取,反受其咎。`,
          en: `${nb.name.en} is thinly held; ${city.name.en} could take it.`,
          priority: 40,
          action: { kind: 'none' },
        });
        break;
      }
    }
  }

  // ⑨ 謀略獻策 — a capable strategist (智≥72) reads the wider board and
  //    proposes a named scheme: set two bordering rivals to bleed each
  //    other (二虎競食), or court a far power (遠交近攻).
  if (iq >= 72 && input.forces && input.playerCapitalId) {
    const capital = input.cities[input.playerCapitalId];
    const rivalIds = [...new Set(Object.values(input.cities)
      .map((c) => c.ownerForceId)
      .filter((f): f is EntityId => !!f && f !== input.playerForceId))];
    const strength = (fid: EntityId) => Object.values(input.cities)
      .filter((c) => c.ownerForceId === fid).reduce((s, c) => s + c.troops, 0);
    const nameOf = (fid: EntityId) => input.forces?.[fid]?.name.zh ?? fid;
    const nameEn = (fid: EntityId) => input.forces?.[fid]?.name.en ?? fid;
    // 二虎競食 — the strongest sour, bordering rival pair.
    let pair: { a: EntityId; b: EntityId; score: number } | null = null;
    for (let i = 0; i < rivalIds.length; i++) {
      for (let j = i + 1; j < rivalIds.length; j++) {
        const a = rivalIds[i], b = rivalIds[j];
        if (!forcesAdjacent(input.cities, a, b)) continue;
        const sa = strength(a), sb = strength(b);
        if (sa < 3000 || sb < 3000) continue;
        const rel = input.diplomacy ? getRelation(input.diplomacy, a, b).score : 0;
        const score = sa + sb - rel * 30; // already-sour pairs are easiest to ignite
        if (!pair || score > pair.score) pair = { a, b, score };
      }
    }
    const twoTigers = SCHEME_DEFS.find((d) => d.id === 'two-tigers')!;
    const farFriend = SCHEME_DEFS.find((d) => d.id === 'far-friend')!;
    if (pair && capital && capital.gold >= twoTigers.goldCost) {
      tips.push({
        id: `scheme-2t-${pair.a}-${pair.b}`,
        zh: `${nameOf(pair.a)}與${nameOf(pair.b)}接壤而勢均 — 可施二虎競食,使其自相消耗,我坐收漁利。`,
        en: `${nameEn(pair.a)} and ${nameEn(pair.b)} border each other and are evenly matched — set them at each other and reap the spoils.`,
        priority: 48,
        action: { kind: 'scheme', schemeId: 'two-tigers', targetA: pair.a, targetB: pair.b },
      });
    } else {
      const far = rivalIds
        .filter((f) => !forcesAdjacent(input.cities, input.playerForceId, f) && strength(f) >= 3000)
        .sort((a, b) => strength(b) - strength(a))[0];
      if (far && capital && capital.gold >= farFriend.goldCost) {
        tips.push({
          id: `scheme-ff-${far}`,
          zh: `${nameOf(far)}地遠而不接壤 — 宜遠交近攻,結為奧援,以制近敵。`,
          en: `${nameEn(far)} shares no border with us — court them as a distant ally against the neighbours.`,
          priority: 44,
          action: { kind: 'scheme', schemeId: 'far-friend', targetA: far },
        });
      }
    }

    // 離間盟好 — two rivals stand in a pact, at least one pressing on us: prise them apart.
    const sowDiscord = SCHEME_DEFS.find((d) => d.id === 'sow-discord')!;
    if (capital && capital.gold >= sowDiscord.goldCost && input.diplomacy) {
      let pact: { a: EntityId; b: EntityId; score: number } | null = null;
      for (let i = 0; i < rivalIds.length; i++) {
        for (let j = i + 1; j < rivalIds.length; j++) {
          const a = rivalIds[i], b = rivalIds[j];
          const rel = getRelation(input.diplomacy, a, b);
          if (rel.status !== 'allied' && rel.status !== 'non-aggression') continue;
          if (!forcesAdjacent(input.cities, input.playerForceId, a) && !forcesAdjacent(input.cities, input.playerForceId, b)) continue;
          if (!pact || rel.score < pact.score) pact = { a, b, score: rel.score }; // shallow bonds break easiest
        }
      }
      if (pact) {
        tips.push({
          id: `scheme-sd-${pact.a}-${pact.b}`,
          zh: `${nameOf(pact.a)}與${nameOf(pact.b)}締盟相倚 — 宜行離間,破其盟好,各個擊破。`,
          en: `${nameEn(pact.a)} and ${nameEn(pact.b)} stand together — sow discord to break their pact and beat them apart.`,
          priority: 52,
          action: { kind: 'scheme', schemeId: 'sow-discord', targetA: pact.a, targetB: pact.b },
        });
      }
    }

    // 趁火打劫 — a bordering rival already embroiled is ripe to be denounced and struck.
    const lootFire = SCHEME_DEFS.find((d) => d.id === 'loot-fire')!;
    if (capital && capital.gold >= lootFire.goldCost && input.diplomacy) {
      const ripe = rivalIds.find((f) => forcesAdjacent(input.cities, input.playerForceId, f) && forceEmbroiled(input.cities, input.diplomacy!, f, input.playerForceId));
      if (ripe) {
        tips.push({
          id: `scheme-lf-${ripe}`,
          zh: `${nameOf(ripe)}內外交困 — 正可趁火打劫,得討伐之名而乘其危。`,
          en: `${nameEn(ripe)} is embroiled — loot the burning house: take a casus belli and fall on it.`,
          priority: 50,
          action: { kind: 'scheme', schemeId: 'loot-fire', targetA: ripe },
        });
      }
    }

    // 疑兵之計 — a much stronger bordering rival: bluff to buy quiet on that front.
    const feign = SCHEME_DEFS.find((d) => d.id === 'feign-strength')!;
    if (capital && capital.gold >= feign.goldCost) {
      const myStr = strength(input.playerForceId);
      const bully = rivalIds.find((f) => forcesAdjacent(input.cities, input.playerForceId, f) && strength(f) > myStr * 1.5);
      if (bully) {
        tips.push({
          id: `scheme-fs-${bully}`,
          zh: `${nameOf(bully)}兵勢凌我 — 可施疑兵之計,虛張聲勢,使其數季不敢來犯。`,
          en: `${nameEn(bully)} overshadows us — feign strength to cow them off our border for a while.`,
          priority: 46,
          action: { kind: 'scheme', schemeId: 'feign-strength', targetA: bully },
        });
      }
    }
  }

  // ⑩ 名士奇策 — a legendary strategist gives counsel in their own hand.
  if (input.advisor) {
    const sage = legendaryCounsel(input, input.advisor, own);
    if (sage) tips.push(sage);
  }

  // Dedupe by id, sort loudest first, hand over the top N (scaled by 智).
  const seen = new Set<string>();
  return tips
    .filter((t2) => (seen.has(t2.id) ? false : (seen.add(t2.id), true)))
    .sort((a, b) => b.priority - a.priority)
    .slice(0, maxTips);
}
