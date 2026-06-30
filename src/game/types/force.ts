import type { BilingualName, EntityId } from './common';
import type { ImperialRank } from './imperial';
import type { RulerPersonality } from './personality';

export interface Force {
  id: EntityId;
  name: BilingualName;
  rulerOfficerId: EntityId;
  capitalCityId: EntityId;
  color: string;
  isPlayer: boolean;
  /** Imperial standing. Defaults to 'commoner' if absent on legacy saves. */
  imperialRank?: ImperialRank;
  /** Vassal-of relationship: set if this force is the vassal of another. */
  vassalOfForceId?: EntityId;
  /** AI personality; defaults to 'opportunist' if absent. */
  personality?: RulerPersonality;
  /** 門第政策 — how the realm selects and rewards talent. Drives the 門閥世族
   *  loop (systems/clans.ts). Defaults to 'balanced' if absent.
   *   • aristocratic 重門第/九品中正 — lean on the great clans
   *   • meritocratic 唯才是舉 — promote by ability, commoners included
   *   • balanced 並用 — neutral middle road */
  recruitmentStance?: 'aristocratic' | 'meritocratic' | 'balanced';
  /** 治國理念 — the realm's school of statecraft (法/儒/道/兵). Drives the
   *  per-season statecraft loop + doctrine-matched officer loyalty. Absent →
   *  雜糅 (no slant). See data/statecraft.ts + systems/statecraft.ts. */
  statecraft?: import('../data/statecraft').StatecraftSchool;
  /** §7.9-deep I 學派造詣 — 0–100, climbs while the school is held (faster with a
   *  太學/書院); the school's effects scale with it. Reset to 0 on switching. */
  statecraftMastery?: number;
  /** §7.9-deep L 國策大政 — when the school's signature decree was last enacted
   *  (for the cooldown). */
  statecraftDecreeAt?: { year: number; season: import('./common').Season };
  /** 國號 — the dynasty name proclaimed at the 建國大典 (e.g. 魏/蜀漢/吳/晉). */
  dynastyTitle?: string;
  /** 年號 — the reign era declared at the founding (e.g. 章武/黃龍/景初). */
  eraName?: string;
  /** Year the 建國大典 was held — set once; gates the one-shot ceremony. */
  foundingYear?: number;
}
