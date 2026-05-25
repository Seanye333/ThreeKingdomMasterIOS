/**
 * 攻城器 — Siege engines that reduce a city's effective defense factor
 * when present in the attacking army. Currently auto-deployed when the
 * commander or any companion has the relevant equipment / skill.
 */
import type { Officer } from '../types';

export type SiegeEngineId =
  | 'chong-che'     // 衝車 — battering ram
  | 'yun-ti'        // 雲梯 — scaling ladder
  | 'tou-shi-ji'    // 投石機 — trebuchet
  | 'lou-che';      // 樓車 — siege tower

export interface SiegeEngine {
  id: SiegeEngineId;
  name: { zh: string; en: string };
  /** Multiplier on (1 + wallTier×0.4) defense factor — less than 1 helps attacker. */
  defenseMultiplier: number;
  /** Description for UI / tooltip. */
  description: string;
}

export const SIEGE_ENGINES: Record<SiegeEngineId, SiegeEngine> = {
  'chong-che': {
    id: 'chong-che',
    name: { zh: '衝車', en: 'Battering Ram' },
    defenseMultiplier: 0.85,
    description: 'Iron-headed ram on rollers. Best against gates of stone-wall cities (tier 2+).',
    descriptionZh: "鐵首滾輪攻城車。最宜攻破二級以上石牆城池之城門。",
  },
  'yun-ti': {
    id: 'yun-ti',
    name: { zh: '雲梯', en: 'Scaling Ladder' },
    defenseMultiplier: 0.90,
    description: 'Tall wheeled ladder for direct wall assault. Useful at any tier.',
    descriptionZh: "高大有輪之攻城梯,用以直攻城牆。各等級城池皆適用。",
  },
  'tou-shi-ji': {
    id: 'tou-shi-ji',
    name: { zh: '投石機', en: 'Trebuchet' },
    defenseMultiplier: 0.78,
    description: 'Counterweight stone-thrower. Devastates citadel walls (tier 3).',
    descriptionZh: "配重式投石機。專破三級堅城之牆垣。",
  },
  'lou-che': {
    id: 'lou-che',
    name: { zh: '樓車', en: 'Siege Tower' },
    defenseMultiplier: 0.82,
    description: 'Wheeled tower allowing archers to fire down on defenders.',
    descriptionZh: "有輪之高樓,可讓弓手居高臨下射擊守軍。",
  },
};

/**
 * Auto-pick siege engines an army brings. For now: an army's siege capacity
 * scales with troop count + presence of any 'siege' weapon-class officer.
 * Returns the strongest engine the army can deploy.
 */
export function selectSiegeEngine(
  army: { troops: number; commander: Officer; companions?: Officer[] },
  cityWallTier: number,
): SiegeEngine | null {
  // Need a sufficiently large army (5000+) to bring serious gear.
  if (army.troops < 3000) return null;

  // Engineer-type officer? Search by Siege weapon class equipment.
  const allOfficers = [army.commander, ...(army.companions ?? [])];
  const hasEngineer = allOfficers.some(
    (o) => o.equipment.some((id) => id.includes('siege') || id.includes('mace')),
  );

  if (cityWallTier >= 3 && army.troops >= 8000) return SIEGE_ENGINES['tou-shi-ji'];
  if (cityWallTier >= 2 && hasEngineer) return SIEGE_ENGINES['chong-che'];
  if (army.troops >= 6000) return SIEGE_ENGINES['lou-che'];
  return SIEGE_ENGINES['yun-ti'];
}
