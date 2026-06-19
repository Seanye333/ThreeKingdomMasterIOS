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
  | 'lou-che'       // 樓車 — siege tower
  // ── D-set additions ──
  | 'jing-lan'      // 井闌 — high archer platform (曹操官渡 used these)
  | 'huo-jian-che'  // 火箭車 — fire-arrow cart, ignites wooden palisades
  | 'lian-nu-che'   // 連弩車 — cart-mounted repeating crossbow (Zhuge-improved)
  | 'fen-yun'       // 轒轀 — armored covered ram-cart, shelters sappers
  | 'fei-lou';      // 飛樓 — flying tower, taller than 樓車, archers + men dropped onto wall

export interface SiegeEngine {
  id: SiegeEngineId;
  name: { zh: string; en: string };
  /** Multiplier on (1 + wallTier×0.4) defense factor — less than 1 helps attacker. */
  defenseMultiplier: number;
  /** Description for UI / tooltip. */
  description: string;
  descriptionZh?: string;
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

  // ── D-set: classic Three Kingdoms siege engines ──
  'jing-lan': {
    id: 'jing-lan',
    name: { zh: '井闌', en: 'Well-Tower' },
    defenseMultiplier: 0.88,
    description: 'Tall fixed archer platform — Cao Cao built rows of these at Guandu to suppress Yuan Shao\'s walls.',
    descriptionZh: "井闌——曹操官渡之戰列陣此器,壓制袁軍城牆。固定式高臺,弓手居高遠射。",
  },
  'huo-jian-che': {
    id: 'huo-jian-che',
    name: { zh: '火箭車', en: 'Fire-Arrow Cart' },
    defenseMultiplier: 0.80,
    description: 'Volley fire-arrow cart. Devastating against wooden palisades and tier-1 walls; less useful against citadels.',
    descriptionZh: "齊射火矢之車。對木柵與一級城牆破壞極大,對堅城效果有限。",
  },
  'lian-nu-che': {
    id: 'lian-nu-che',
    name: { zh: '連弩車', en: 'Repeating Crossbow Cart' },
    defenseMultiplier: 0.84,
    description: 'Cart-mounted repeating crossbow, Zhuge Liang\'s improved design. Suppresses defenders during assault.',
    descriptionZh: "車載連弩,諸葛亮改良之制。攻城時壓制守軍弓矢還擊。",
  },
  'fen-yun': {
    id: 'fen-yun',
    name: { zh: '轒轀', en: 'Armored Sapper-Cart' },
    defenseMultiplier: 0.86,
    description: 'Roofed wheeled hut covering sappers as they undermine walls or fill in moats.',
    descriptionZh: "頂上加蓋之輪車,掩護工兵於城下掘地、填壕。",
  },
  'fei-lou': {
    id: 'fei-lou',
    name: { zh: '飛樓', en: 'Flying Tower' },
    defenseMultiplier: 0.76,
    description: 'Taller than 樓車; archers + men dropped directly onto the wall. Slow to build, decisive in a siege.',
    descriptionZh: "高於樓車之巨型攻城樓,弓手與步卒可直接踏上城牆。建造緩慢但常為破城關鍵。",
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

  // Engineer-type officer? The 攻城 (siegemaster) skill is the real signal; a
  // mace/siege weapon is a secondary tell. (The old `id.includes('siege')` check
  // matched no item id and was dead — siegemaster was never consulted.)
  const allOfficers = [army.commander, ...(army.companions ?? [])];
  const hasEngineer = allOfficers.some(
    (o) => o.skills?.includes('siegemaster') || o.equipment.some((id) => id.includes('mace')),
  );

  if (cityWallTier >= 3 && army.troops >= 8000) return SIEGE_ENGINES['tou-shi-ji'];
  if (cityWallTier >= 2 && hasEngineer) return SIEGE_ENGINES['chong-che'];
  if (army.troops >= 6000) return SIEGE_ENGINES['lou-che'];
  return SIEGE_ENGINES['yun-ti'];
}
