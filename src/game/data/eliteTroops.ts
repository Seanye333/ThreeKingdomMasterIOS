import type { Officer, EntityId } from '../types';

/**
 * 精銳兵種 — Elite troop types tied to specific historical commanders.
 *
 * When an officer leads troops in combat, if they are the named historical
 * commander (or one of their lineage), the troops gain elite-troop bonuses.
 *
 * Bonuses are passive multipliers consumed by the combat resolver.
 */
export interface EliteTroop {
  id: string;
  name: { zh: string; en: string };
  description: string;
  /** Officer IDs that summon this troop type when commanding. */
  commanderIds: EntityId[];
  /** Multiplier on commander's blended stat (war+lead). */
  powerMultiplier: number;
  /** Multiplier on own losses (lower = better). */
  ownLossMultiplier: number;
  /** Bonus war damage to enemies (added to blended). */
  warBonus: number;
  /** Special vulnerability — text only for now. */
  weakness?: { zh: string; en: string };
}

export const ELITE_TROOPS: EliteTroop[] = [
  {
    id: 'tiger-leopard-cavalry',
    name: { zh: '虎豹騎', en: 'Tiger-Leopard Cavalry' },
    description:
      "Cao Cao's elite mounted bodyguard. Hand-picked from the best of every company — heavy lamellar, blooded mounts, no quarter.",
    descriptionZh: "曹操親衛精銳重騎,自全軍精挑細選——披重甲、騎良駒、戰無留情。",
    commanderIds: ['cao-cao', 'cao-chun', 'cao-zhen', 'cao-xiu'],
    powerMultiplier: 1.18,
    ownLossMultiplier: 0.80,
    warBonus: 8,
  },
  {
    id: 'fall-formation',
    name: { zh: '陷陣營', en: 'Fall-Formation Company' },
    description:
      "Gao Shun's 700-man assault corps under Lü Bu — drilled to break gates and shield-walls. Each charge succeeded; the formation never broke.",
    descriptionZh: "高順麾下七百人之陷陣營,隸屬呂布——專破城門與盾陣。每戰必克,陣列從未潰散。",
    commanderIds: ['gao-shun'],
    powerMultiplier: 1.25,
    ownLossMultiplier: 0.75,
    warBonus: 10,
  },
  {
    id: 'white-plume-guard',
    name: { zh: '白毦兵', en: 'White-Plume Guard' },
    description:
      "Liu Bei's personal guard — picked from the southwestern frontier and crowned with white feathers. Loyal beyond ordinary measure.",
    descriptionZh: "劉備親軍——選自西南邊陲之地,頭戴白羽,忠心遠勝常人。",
    commanderIds: ['liu-bei', 'chen-dao'],
    powerMultiplier: 1.15,
    ownLossMultiplier: 0.78,
    warBonus: 6,
  },
  {
    id: 'rattan-armor',
    name: { zh: '藤甲兵', en: 'Rattan-Armor Troops' },
    description:
      "Wuge clan warriors armored in oil-cured rattan — arrows skip off. But the same oil makes them lethally vulnerable to fire.",
    descriptionZh: "烏戈部勇士,披油浸藤甲——箭矢難入。然此油遇火則致命難當。",
    commanderIds: ['wutugu'],
    powerMultiplier: 1.20,
    ownLossMultiplier: 0.55, // hugely arrow-resistant
    warBonus: 5,
    weakness: {
      zh: '火攻倍敵 — 遇火則熔',
      en: 'Fire attacks deal double damage — the oil ignites.',
    },
  },
  {
    id: 'danyang-troops',
    name: { zh: '丹陽兵', en: 'Danyang Troops' },
    description:
      "Tao Qian's elite infantry from the Danyang highlands — mountain people, peerless at ambush and broken ground.",
    descriptionZh: "陶謙麾下丹陽高地精銳步兵——山民出身,擅長伏擊與險地作戰,無人能敵。",
    commanderIds: ['tao-qian', 'liu-bei', 'sun-ce'],
    powerMultiplier: 1.12,
    ownLossMultiplier: 0.85,
    warBonus: 4,
  },
  {
    id: 'wuhuan-cavalry',
    name: { zh: '烏丸突騎', en: 'Wuhuan Mounted Vanguard' },
    description:
      "The frontier Wuhuan tribesmen recruited by Cao Cao after Bailang Mountain. Light, fast, lethal in pursuit.",
    descriptionZh: "白狼山之戰後,曹操所招的烏丸邊塞部族騎兵。輕捷迅猛,追擊絕殺。",
    commanderIds: ['cao-cao', 'zhang-liao', 'tian-yu'],
    powerMultiplier: 1.10,
    ownLossMultiplier: 0.82,
    warBonus: 5,
  },
];

/**
 * Returns the elite troop bonus an officer brings, or null if they don't
 * command any elite formation.
 */
export function getEliteTroop(officer: Officer): EliteTroop | null {
  for (const t of ELITE_TROOPS) {
    if (t.commanderIds.includes(officer.id)) return t;
  }
  return null;
}
