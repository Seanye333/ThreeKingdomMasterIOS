/**
 * 戰報敘事 — turn the facts of a single blow into a line of the battle log.
 *
 * The battlefield already computes an extraordinary amount about every attack:
 * arm matchup, terrain, the arc it landed from, how many friends were pressing
 * the same foe, elite corps, weapon class, fatigue, night, weather, whether the
 * hull had run aground. All of it collapses into one damage number and is gone.
 *
 * `attackUnits` does narrate — but only *exceptional* blows (合擊, 立防, 衝鋒,
 * 甕中捉鱉, 銜尾掩殺, 詐敗, 困獸猶鬥, 腹背受敵, 會心, 軍心崩潰, 主將陣亡). An
 * ordinary hit falls through the whole else-if cascade and its only voice is
 * `pickVoiceLine` — which covers **39 of ~2,218 officers**. For 98% of the
 * roster a normal attack is silent, which is why 120 observed AI battles logged
 * melee 4 times against weather 915, and why a decided nine-turn battle
 * produced five lines, none of them about the fighting.
 *
 * So this module narrates the ordinary blow. It is a pure function of a facts
 * struct — deliberately NOT importing from `tactical.ts`, both to avoid the
 * import cycle and to keep it testable without building a battle.
 *
 * Lines are tagged `kind: 'blow'` rather than `'event'` so the log drawer can
 * separate the play-by-play from the dramatic beats, and so the ticker (which
 * pops voice/arrival only) is unaffected.
 */

import type { UnitType, TerrainKind } from '../types/tactical';

/** Everything the narrator is allowed to know. All of it is already computed
 *  inside `attackUnits` before the damage line — nothing here costs extra. */
export interface BlowFacts {
  attackerName: string;
  attackerNameEn: string;
  targetName: string;
  targetNameEn: string;
  attackerType: UnitType;
  targetType: UnitType;
  /** Troops felled by this blow. */
  damage: number;
  /** Target's strength before the blow, and its full establishment. */
  targetTroopsBefore: number;
  targetMaxTroops: number;
  /** Loosed from range rather than hand to hand. */
  isRanged: boolean;
  /** 兵種相剋 multiplier (>1 favours the attacker). */
  counterMult: number;
  attackerTerrain: TerrainKind;
  targetTerrain: TerrainKind;
  /** Blow landed in the foe's rear arc / on its flank. */
  fromRear: boolean;
  flankMul: number;
  /** Other friendly units also in contact with the target. */
  pincers: number;
  /** 精銳 corps name (虎豹騎 etc.), when this unit is one. */
  eliteZh?: string;
  /** Attacker struck out of concealment — the 十面埋伏 wing springing its trap.
   *  The engine applies ×1.3 (×1.5 at night) and disorders the target, and said
   *  nothing at all about it: the only line in the log mentioning an ambush came
   *  from a scout spotting one that never sprang. */
  ambush: boolean;
  /** Attacker's hull ran aground in the shoals (naval). */
  grounded: boolean;
  isNight: boolean;
  weather: 'clear' | 'rain' | 'wind' | 'fog' | 'snow';
  /** 久戰疲乏 0..100. */
  attackerFatigue: number;
  /** Troops the target took back on the riposte (0 = none). */
  counterDamage: number;
  /** Last arrow spent — the volley that empties the quiver. */
  ammoEmptied: boolean;
}

const ARM_ZH: Record<UnitType, string> = {
  infantry: '步卒', spearmen: '槍陣', cavalry: '鐵騎',
  archers: '弓弩', siege: '攻城械', navy: '舟師',
};
const ARM_EN: Record<UnitType, string> = {
  infantry: 'foot', spearmen: 'spears', cavalry: 'horse',
  archers: 'bows', siege: 'engines', navy: 'ships',
};

/** Verbs, so a hundred blows in one battle don't read identically. */
const MELEE_ZH = ['撲擊', '交鋒', '挺刃直取', '鏖戰', '短兵相接'];
const MELEE_EN = ['falls upon', 'closes with', 'drives into', 'grapples with', 'comes to blows with'];
const RANGED_ZH = ['攢射', '放箭', '矢下如雨', '引弓覆射'];
const RANGED_EN = ['looses on', 'volleys at', 'rains shafts on', 'shoots into'];

/** Terrain the ATTACKER stands on that is worth calling out. */
const ATK_GROUND_ZH: Partial<Record<TerrainKind, string>> = {
  hill: '據高而下', mountain: '踞險而擊', forest: '林間突出',
  marsh: '涉沮洳而前', river: '半渡而擊', bridge: '橋上爭鋒',
  watchtower: '憑樓俯射', gate: '門下死鬥', shallows: '淺瀨接戰',
};
const ATK_GROUND_EN: Partial<Record<TerrainKind, string>> = {
  hill: 'from the high ground', mountain: 'down off the crags', forest: 'bursting from the trees',
  marsh: 'wading the mire', river: 'catching them mid-ford', bridge: 'contesting the span',
  watchtower: 'from the tower top', gate: 'in the gateway', shallows: 'in the shoals',
};

/** Terrain the TARGET stands on that shelters it. */
const DEF_GROUND_ZH: Partial<Record<TerrainKind, string>> = {
  forest: '林深難進', fieldworks: '鹿砦當前', wall: '仰攻堅城',
  mountain: '山高路狹', hill: '仰坡而攻',
};
const DEF_GROUND_EN: Partial<Record<TerrainKind, string>> = {
  forest: 'the thickets slow the press', fieldworks: 'the stakes bar the way', wall: 'the masonry looms',
  mountain: 'the ground climbs against them', hill: 'uphill all the way',
};

const WEATHER_ZH: Partial<Record<BlowFacts['weather'], string>> = {
  rain: '雨中', wind: '風沙裡', fog: '霧中', snow: '雪地上',
};
const WEATHER_EN: Partial<Record<BlowFacts['weather'], string>> = {
  rain: 'in the rain', wind: 'in the blowing grit', fog: 'in the fog', snow: 'in the snow',
};

/** How hard the blow bit, as a share of the target's establishment. */
function weightZh(share: number): string {
  if (share >= 0.30) return '陣列摧折';
  if (share >= 0.18) return '大挫其鋒';
  if (share >= 0.08) return '陣腳一鬆';
  if (share > 0) return '略挫';
  return '未損分毫';
}
function weightEn(share: number): string {
  if (share >= 0.30) return 'the line buckles';
  if (share >= 0.18) return 'a heavy blow';
  if (share >= 0.08) return 'the ranks give a step';
  if (share > 0) return 'a glancing exchange';
  return 'not a man falls';
}

/**
 * The one thing most worth saying about this blow. Ordered by how much it
 * explains the outcome — a grounded hull or a rear-arc strike tells the player
 * more than the weather does.
 */
function dominant(f: BlowFacts): { zh: string; en: string } | null {
  if (f.ambush) return { zh: '伏兵驟起於林間,敵陣猝亂', en: 'the ambush springs from the trees and their ranks fly apart' };
  if (f.grounded) return { zh: '船底觸淺,進退不得', en: 'hull fast in the shallows' };
  if (f.fromRear) return { zh: '繞出其背,猝不及防', en: 'striking clean into their back' };
  if (f.flankMul > 1.01) return { zh: '橫擊其側', en: 'taking them in the flank' };
  if (f.counterMult >= 1.15) {
    return { zh: `${ARM_ZH[f.attackerType]}正克${ARM_ZH[f.targetType]}`, en: `${ARM_EN[f.attackerType]} tell against ${ARM_EN[f.targetType]}` };
  }
  if (f.counterMult <= 0.87) {
    return { zh: `${ARM_ZH[f.targetType]}最忌${ARM_ZH[f.attackerType]}相搏`, en: `${ARM_EN[f.attackerType]} are the wrong tool here` };
  }
  if (f.pincers >= 2) return { zh: '三面同時著力', en: 'pressed from three sides at once' };
  if (f.pincers === 1) return { zh: '兩軍夾攻', en: 'two banners pressing together' };
  const atkGround = ATK_GROUND_ZH[f.attackerTerrain];
  if (atkGround) return { zh: atkGround, en: ATK_GROUND_EN[f.attackerTerrain] ?? '' };
  const defGround = DEF_GROUND_ZH[f.targetTerrain];
  if (defGround) return { zh: defGround, en: DEF_GROUND_EN[f.targetTerrain] ?? '' };
  if (f.eliteZh) return { zh: `${f.eliteZh}之銳,當者披靡`, en: 'the elite corps goes through them' };
  if (f.attackerFatigue >= 70) return { zh: '師老兵疲,刃鈍力竭', en: 'spent men, blunted blades' };
  if (f.isNight) return { zh: '夜色之中各不相辨', en: 'neither side can tell friend from foe' };
  const w = WEATHER_ZH[f.weather];
  if (w) return { zh: `${w}相持`, en: `they grind on ${WEATHER_EN[f.weather]}` };
  return null;
}

/**
 * Narrate one blow. Returns null when there is genuinely nothing to say (a
 * no-damage brush that some other beat already covers).
 *
 * `variant` only rotates the verb, and it is a plain integer rather than an rng
 * callback ON PURPOSE. Drawing from the battle's shared rng to pick a synonym
 * would advance the combat random stream by one call per blow — which silently
 * re-rolls every subsequent crit, capture and weather event. The first version
 * did exactly that, and a 120-battle observation run showed the whole campaign
 * diverging (breaches 24/40 → 17/40) from nothing but flavour text. Narration
 * must be free.
 */
export function describeBlow(f: BlowFacts, variant = 0): { zh: string; en: string } | null {
  if (f.damage <= 0 && f.counterDamage <= 0) return null;
  const pool = f.isRanged ? RANGED_ZH.length : MELEE_ZH.length;
  const i = ((Math.trunc(variant) % pool) + pool) % pool;
  const verbZh = f.isRanged ? RANGED_ZH[i] : MELEE_ZH[i];
  const verbEn = f.isRanged ? RANGED_EN[i] : MELEE_EN[i];

  const share = f.targetMaxTroops > 0 ? f.damage / f.targetMaxTroops : 0;
  const dom = dominant(f);

  const head = `${f.attackerName}${ARM_ZH[f.attackerType]}${verbZh}${f.targetName}`;
  const headEn = `${f.attackerNameEn}'s ${ARM_EN[f.attackerType]} ${verbEn} ${f.targetNameEn}`;

  const parts: string[] = [];
  const partsEn: string[] = [];
  if (dom) { parts.push(dom.zh); if (dom.en) partsEn.push(dom.en); }
  parts.push(`${weightZh(share)},斬 ${f.damage.toLocaleString()}`);
  partsEn.push(`${weightEn(share)} — ${f.damage.toLocaleString()} fallen`);
  if (f.counterDamage > 0) {
    parts.push(`還擊折 ${f.counterDamage.toLocaleString()}`);
    partsEn.push(`${f.counterDamage.toLocaleString()} lost to the riposte`);
  }
  if (f.ammoEmptied) {
    parts.push('箭矢已空');
    partsEn.push('the quivers are empty');
  }

  return {
    zh: `${head} — ${parts.join(',')}。`,
    en: `${headEn} — ${partsEn.join('; ')}.`,
  };
}
