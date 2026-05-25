import type { BilingualName, EntityId } from './common';
import type { CommandType } from './command';
import type { PersonalityTrait } from './personality';
import type { MilitaryRankId } from './title';

// Re-exports so consumers can `import type { Doctrine, OfficerFormationId, TacticId, PolicyId } from '../types'`
export type { Doctrine, OfficerFormationId, TacticId, PolicyId } from '../data/officerAttributes';

export interface OfficerStats {
  leadership: number;
  war: number;
  intelligence: number;
  politics: number;
  charisma: number;
}

/** Item kinds — used for UI grouping only. No longer caps the per-officer count. */
export type EquipSlot = 'weapon' | 'horse' | 'treasure' | 'book';

/**
 * Equipment is an unbounded list of item IDs an officer carries.
 * Items are still globally unique (one officer at a time), but each officer
 * can carry as many as you give them.
 */
export type Equipment = EntityId[];

export interface Officer {
  id: EntityId;
  name: BilingualName;
  courtesyName?: BilingualName;
  birthYear: number;
  deathYear?: number;
  stats: OfficerStats;
  loyalty: number;
  locationCityId: EntityId | null;
  forceId: EntityId | null;
  status: 'active' | 'idle' | 'imprisoned' | 'dead' | 'unsearched' | 'wounded';
  /** Historical hometown — fixed at scenario load from the template. Doesn't
   *  change as the officer moves around. Used by UI + search bonuses. */
  hometownCityId?: EntityId;
  /** Seasons remaining before a wounded officer recovers to idle. */
  woundedSeasons?: number;
  task: CommandType | null;
  equipment: Equipment;
  /** Innate skill IDs (referencing SKILLS_BY_ID). 0–4 per officer. */
  skills: EntityId[];
  /** Military rank — defaults to 'soldier' for an unranked officer. */
  rank: MilitaryRankId;
  /** Accumulated experience points. Officers level up at 100/250/500/1000/2000. */
  xp?: number;
  /** Latent talent caps — each stat can grow up to here via XP. */
  latentStats?: OfficerStats;
  /** True for female officers; affects portrait + recruit defaults. */
  female?: boolean;
  /** Personality traits — 0–3 entries. Drive AI tendencies and event hooks. */
  traits?: PersonalityTrait[];
  /** 主義 — ideological alignment that shapes how the officer judges sovereigns and events. */
  doctrine?: import('../data/officerAttributes').Doctrine;
  /** 陣形 — battle formations this officer can deploy (typically 2–4). */
  formations?: import('../data/officerAttributes').OfficerFormationId[];
  /** 戰法 — battle tactics available to this officer (typically 1–3). */
  tactics?: import('../data/officerAttributes').TacticId[];
  /** 政策 — civic policies this officer specializes in (typically 0–3). */
  policies?: import('../data/officerAttributes').PolicyId[];
  /** Lv. — officer level (1–100), derived from total stats. */
  level?: number;
}
