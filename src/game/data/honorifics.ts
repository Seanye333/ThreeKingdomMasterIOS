import type { BilingualName, Officer } from '../types';
import type { HeroicDeeds } from '../types/deeds';
import { meritScore } from './peerage';

/**
 * 名號將軍 (雜號將軍) — martial honorifics a ruler bestows on a deserving
 * general. Distinct from the formal 軍階 ladder (an officer's office) and the
 * 爵位 peerage (land + politics): these are *glory titles*, a collectible roster
 * each tied to a feat and carrying a small signature perk. One per officer (the
 * highest held); conferral is a deliberate reward, not an automatic promotion.
 */
export type HonorificTheme =
  | 'valor'    // 武勇 — duels / slaying
  | 'rebel'    // 平叛 — crushing rebellions, cults, casus belli
  | 'naval'    // 水戰 — river & sea
  | 'siege'    // 攻城 — taking cities
  | 'frontier' // 征討 — tribes / far campaigns
  | 'guile'    // 謀略 — espionage / schemes
  | 'steward'; // 鎮撫 — governance / holding the realm together

export interface Honorific {
  id: string;
  name: BilingualName;
  /** 1 (common) → 3 (illustrious); only an equal-or-higher tier can replace. */
  tier: number;
  theme: HonorificTheme;
  /** 功勳積分 gate (shares peerage's meritScore). */
  minMerit: number;
  /** Standing loyalty while held (folded into the season drift, with peerage). */
  loyaltyBonus: number;
  /** One-shot loyalty bump on conferral. */
  loyaltyOnGrant: number;
  /** One-shot 戰功威望 granted on conferral — feeds 品階 → real combat heft. */
  renownOnGrant: number;
  /** Optional battle-power multiplier, routed through prestigeCombatMultiplier. */
  combatPowerMul?: number;
  /** Short flavour of the feat the title honours (for the "宜授" hint). */
  deedHintZh: string;
}

export const HONORIFICS: Honorific[] = [
  // ── 武勇 valor ──
  { id: 'zhechong', name: { zh: '折衝將軍', en: 'Repelling General' }, tier: 1, theme: 'valor', minMerit: 130, loyaltyBonus: 1, loyaltyOnGrant: 3, renownOnGrant: 20, combatPowerMul: 1.03, deedHintZh: '陷陣卻敵之勇' },
  { id: 'fenwei', name: { zh: '奮威將軍', en: 'Rousing-Might General' }, tier: 1, theme: 'valor', minMerit: 170, loyaltyBonus: 1, loyaltyOnGrant: 3, renownOnGrant: 28, combatPowerMul: 1.04, deedHintZh: '勇冠三軍' },
  { id: 'huwei', name: { zh: '虎威將軍', en: 'Tiger-Might General' }, tier: 2, theme: 'valor', minMerit: 300, loyaltyBonus: 2, loyaltyOnGrant: 5, renownOnGrant: 48, combatPowerMul: 1.06, deedHintZh: '單騎討勝、威震敵膽' },

  // ── 平叛 rebel-quelling ──
  { id: 'dangkou', name: { zh: '盪寇將軍', en: 'Bandit-Sweeping General' }, tier: 1, theme: 'rebel', minMerit: 140, loyaltyBonus: 1, loyaltyOnGrant: 3, renownOnGrant: 22, combatPowerMul: 1.03, deedHintZh: '討平盜寇民變' },
  { id: 'taoni', name: { zh: '討逆將軍', en: 'Rebel-Chastising General' }, tier: 2, theme: 'rebel', minMerit: 280, loyaltyBonus: 2, loyaltyOnGrant: 5, renownOnGrant: 42, combatPowerMul: 1.05, deedHintZh: '奉辭伐罪、討伐不臣' },
  { id: 'pinglu', name: { zh: '平虜將軍', en: 'Caitiff-Pacifying General' }, tier: 2, theme: 'rebel', minMerit: 320, loyaltyBonus: 2, loyaltyOnGrant: 6, renownOnGrant: 46, combatPowerMul: 1.05, deedHintZh: '蕩平群凶' },

  // ── 水戰 naval ──
  { id: 'fubo', name: { zh: '伏波將軍', en: 'Wave-Quelling General' }, tier: 2, theme: 'naval', minMerit: 260, loyaltyBonus: 2, loyaltyOnGrant: 5, renownOnGrant: 40, combatPowerMul: 1.05, deedHintZh: '樓船橫江、靖定水路' },
  { id: 'hengjiang', name: { zh: '橫江將軍', en: 'River-Spanning General' }, tier: 1, theme: 'naval', minMerit: 160, loyaltyBonus: 1, loyaltyOnGrant: 3, renownOnGrant: 26, combatPowerMul: 1.03, deedHintZh: '扼守津渡、舟師制勝' },

  // ── 攻城 siege ──
  { id: 'polu', name: { zh: '破虜將軍', en: 'Caitiff-Smashing General' }, tier: 2, theme: 'siege', minMerit: 300, loyaltyBonus: 2, loyaltyOnGrant: 5, renownOnGrant: 44, combatPowerMul: 1.05, deedHintZh: '摧城拔寨' },
  { id: 'zhenwei', name: { zh: '振威將軍', en: 'Awe-Shaking General' }, tier: 1, theme: 'siege', minMerit: 170, loyaltyBonus: 1, loyaltyOnGrant: 3, renownOnGrant: 28, combatPowerMul: 1.03, deedHintZh: '克城略地' },

  // ── 征討 frontier ──
  { id: 'duliao', name: { zh: '度遼將軍', en: 'Liao-Crossing General' }, tier: 2, theme: 'frontier', minMerit: 290, loyaltyBonus: 2, loyaltyOnGrant: 5, renownOnGrant: 44, combatPowerMul: 1.05, deedHintZh: '征撫異族、鎮守邊陲' },
  { id: 'zhenglu', name: { zh: '征虜將軍', en: 'Caitiff-Campaigning General' }, tier: 2, theme: 'frontier', minMerit: 330, loyaltyBonus: 2, loyaltyOnGrant: 6, renownOnGrant: 48, combatPowerMul: 1.05, deedHintZh: '遠征不毛、威加四裔' },

  // ── 謀略 guile ──
  { id: 'anyuan', name: { zh: '安遠將軍', en: 'Far-Securing General' }, tier: 1, theme: 'guile', minMerit: 150, loyaltyBonus: 2, loyaltyOnGrant: 3, renownOnGrant: 18, deedHintZh: '運籌謀算、諜定四方' },
  { id: 'junshi-jiangjun', name: { zh: '軍師將軍', en: 'Strategist General' }, tier: 2, theme: 'guile', minMerit: 320, loyaltyBonus: 3, loyaltyOnGrant: 5, renownOnGrant: 30, combatPowerMul: 1.04, deedHintZh: '帷幄定策、智計成擒' },

  // ── 鎮撫 steward ──
  { id: 'jianwei', name: { zh: '建威將軍', en: 'Might-Founding General' }, tier: 1, theme: 'steward', minMerit: 150, loyaltyBonus: 2, loyaltyOnGrant: 4, renownOnGrant: 16, deedHintZh: '資歷既深、勳望素著' },
  { id: 'zhenjun', name: { zh: '鎮軍將軍', en: 'Army-Steadying General' }, tier: 2, theme: 'steward', minMerit: 300, loyaltyBonus: 3, loyaltyOnGrant: 6, renownOnGrant: 24, deedHintZh: '坐鎮一方、軍民賴安' },
  { id: 'fuguo', name: { zh: '輔國將軍', en: 'Realm-Aiding General' }, tier: 3, theme: 'steward', minMerit: 520, loyaltyBonus: 4, loyaltyOnGrant: 8, renownOnGrant: 36, combatPowerMul: 1.04, deedHintZh: '股肱社稷、勳冠群臣' },
  { id: 'anhan', name: { zh: '安漢將軍', en: 'Han-Securing General' }, tier: 3, theme: 'steward', minMerit: 560, loyaltyBonus: 4, loyaltyOnGrant: 9, renownOnGrant: 40, combatPowerMul: 1.05, deedHintZh: '柱石之臣、安定天下' },

  // ── 中郎將 — early martial honorifics, the 郎官 commands ──
  { id: 'yamen', name: { zh: '牙門將軍', en: 'Standard-Gate General' }, tier: 1, theme: 'valor', minMerit: 110, loyaltyBonus: 1, loyaltyOnGrant: 2, renownOnGrant: 16, combatPowerMul: 1.02, deedHintZh: '宿衛中軍、陷陣摧鋒' },
  { id: 'wuguan-zhonglang', name: { zh: '五官中郎將', en: 'General of the Household for All Purposes' }, tier: 1, theme: 'steward', minMerit: 130, loyaltyBonus: 2, loyaltyOnGrant: 3, renownOnGrant: 14, deedHintZh: '統領郎官、儲貳之選' },
  { id: 'huben-zhonglang', name: { zh: '虎賁中郎將', en: 'General of the Rapid Tigers' }, tier: 1, theme: 'valor', minMerit: 150, loyaltyBonus: 1, loyaltyOnGrant: 3, renownOnGrant: 22, combatPowerMul: 1.03, deedHintZh: '掌虎賁宿衛、扈從驍銳' },
  { id: 'yulin-zhonglang', name: { zh: '羽林中郎將', en: 'General of the Feathered Forest' }, tier: 1, theme: 'valor', minMerit: 150, loyaltyBonus: 1, loyaltyOnGrant: 3, renownOnGrant: 22, combatPowerMul: 1.03, deedHintZh: '掌羽林精騎' },

  // ── 杂号续 ──
  { id: 'yangwu', name: { zh: '揚武將軍', en: 'Martial-Display General' }, tier: 1, theme: 'siege', minMerit: 175, loyaltyBonus: 1, loyaltyOnGrant: 3, renownOnGrant: 28, combatPowerMul: 1.03, deedHintZh: '耀武揚威、略地建功' },
  { id: 'pingnan', name: { zh: '平難將軍', en: 'Calamity-Quelling General' }, tier: 2, theme: 'rebel', minMerit: 290, loyaltyBonus: 2, loyaltyOnGrant: 5, renownOnGrant: 42, combatPowerMul: 1.05, deedHintZh: '戡定禍亂、解民倒懸' },

  // ── 重望 illustrious valor ──
  { id: 'zhengxi-da', name: { zh: '征西大將軍', en: 'Grand General Who Campaigns West' }, tier: 3, theme: 'valor', minMerit: 600, loyaltyBonus: 5, loyaltyOnGrant: 10, renownOnGrant: 60, combatPowerMul: 1.07, deedHintZh: '方面元帥、聲威赫赫' },
];

export const HONORIFICS_BY_ID: Record<string, Honorific> = Object.fromEntries(
  HONORIFICS.map((h) => [h.id, h]),
);

export const HONORIFIC_THEME_ZH: Record<HonorificTheme, string> = {
  valor: '武勇', rebel: '平叛', naval: '水戰', siege: '攻城',
  frontier: '征討', guile: '謀略', steward: '鎮撫',
};

export function honorificById(id: string | undefined | null): Honorific | null {
  return id ? HONORIFICS_BY_ID[id] ?? null : null;
}

export function honorificTier(id: string | undefined | null): number {
  return honorificById(id)?.tier ?? 0;
}

/** Highest honorific an officer's merit clears, above any already held. */
export function highestEligibleHonorific(
  o: Officer,
  deeds: HeroicDeeds | undefined,
): Honorific | null {
  const merit = meritScore(o, deeds);
  const held = honorificTier(o.honorificId);
  let best: Honorific | null = null;
  for (const h of HONORIFICS) {
    if (merit < h.minMerit) continue;
    if (h.tier <= held) continue;
    if (!best || h.tier > best.tier || (h.tier === best.tier && h.minMerit > best.minMerit)) best = h;
  }
  return best;
}

/**
 * 適才適號 — how well a theme suits an officer's strengths (0 = poor, 3 = ideal).
 * Now that themes carry a situational battle/affairs perk, a 水戰 title belongs
 * on a navy officer, a 鎮撫 on a statesman, etc. Pure.
 */
export function honorificThemeFit(o: Officer, deeds: HeroicDeeds | undefined, theme: HonorificTheme): number {
  const s = o.stats;
  switch (theme) {
    case 'naval':    return (o.skills ?? []).includes('navy-master') ? 3 : 0;
    case 'valor':    return s.war >= 82 ? 2 : s.war >= 68 ? 1 : 0;
    case 'siege':    return (deeds?.citiesTaken ?? 0) >= 3 ? 2 : (s.war + s.leadership) / 2 >= 78 ? 1 : 0;
    case 'guile':    return (s.intelligence >= 82 || (deeds?.espionageSuccess ?? 0) >= 3) ? 2 : s.intelligence >= 68 ? 1 : 0;
    case 'steward':  return s.politics >= 78 ? 2 : s.politics >= 62 ? 1 : 0;
    case 'rebel':    return s.war >= 76 ? 1 : 0;
    case 'frontier': return (s.leadership >= 80 || s.war >= 80) ? 1 : 0;
    default:         return 0;
  }
}

/**
 * The honorific to actually confer: the HIGHEST tier the officer's merit clears
 * (scarcity preserved), and among that tier the one whose theme best fits them —
 * so 適才適號 makes the §2.12 theme perk land where it helps. Null if none.
 */
export function bestFitHonorific(o: Officer, deeds: HeroicDeeds | undefined): Honorific | null {
  const merit = meritScore(o, deeds);
  const held = honorificTier(o.honorificId);
  const eligible = HONORIFICS.filter((h) => merit >= h.minMerit && h.tier > held);
  if (eligible.length === 0) return null;
  const maxTier = Math.max(...eligible.map((h) => h.tier));
  const top = eligible.filter((h) => h.tier === maxTier);
  return top.reduce((best, h) => {
    const fb = honorificThemeFit(o, deeds, best.theme);
    const fh = honorificThemeFit(o, deeds, h.theme);
    if (fh > fb) return h;
    if (fh === fb && h.minMerit > best.minMerit) return h;
    return best;
  });
}

export interface HonorificEffects {
  loyaltyBonus: number;
  combatPowerMul: number;
}

const NO_HONORIFIC: HonorificEffects = { loyaltyBonus: 0, combatPowerMul: 1 };

export function honorificEffects(o: Officer | undefined): HonorificEffects {
  const h = honorificById(o?.honorificId);
  if (!h) return NO_HONORIFIC;
  return { loyaltyBonus: h.loyaltyBonus, combatPowerMul: h.combatPowerMul ?? 1 };
}
