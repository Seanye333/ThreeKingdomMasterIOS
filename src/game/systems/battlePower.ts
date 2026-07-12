import type { Officer } from '../types';
import { officerGrade, officerLevel, gradeRank } from './officerGrade';
import { liveItemById } from '../data/items';

/**
 * 綜合戰力 (BP) — the one big number a card game lives on. A transparent
 * composite of everything an officer brings: the five stats, 品階, level,
 * skills, equipment and renown (+ 星級, once the ascension track lands).
 * Purely informational — combat never reads it — so it can be tuned for
 * legibility without touching balance.
 */
export interface BattlePowerParts {
  stats: number;
  grade: number;
  level: number;
  skills: number;
  equipment: number;
  renown: number;
  stars: number;
}

export function combatBP(officer: Officer): { bp: number; parts: BattlePowerParts } {
  const s = officer.stats;
  const parts: BattlePowerParts = {
    // 武統智 carry a battle card; 政魅 still count (a warlord is more than a lance).
    stats: Math.round(s.war * 2.6 + s.leadership * 2.2 + s.intelligence * 2.0 + s.politics * 1.2 + s.charisma * 1.4),
    grade: gradeRank(officerGrade(officer).grade) * 120,
    level: officerLevel(officer) * 40,
    skills: officer.skills.length * 45,
    equipment: Math.round(officer.equipment.reduce((sum, id) => {
      const it = liveItemById(id);
      if (!it) return sum;
      const e = it.effects ?? {};
      return sum
        + Math.abs(e.war ?? 0) + Math.abs(e.leadership ?? 0) + Math.abs(e.intelligence ?? 0)
        + Math.abs(e.politics ?? 0) + Math.abs(e.charisma ?? 0);
    }, 0) * 8),
    renown: Math.round(Math.sqrt(Math.max(0, officer.renown ?? 0)) * 10),
    stars: ((officer as { stars?: number }).stars ?? 0) * 80,
  };
  const bp = parts.stats + parts.grade + parts.level + parts.skills + parts.equipment + parts.renown + parts.stars;
  return { bp, parts };
}
