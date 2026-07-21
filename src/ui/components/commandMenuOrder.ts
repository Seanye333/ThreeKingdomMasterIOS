/**
 * 指令選單順序 — which internal-affairs orders the city command menu shows, and
 * in what order. Kept OUT of the component so a test can assert that every
 * command in COMMAND_DEFS is actually reachable: these lists are hand-written,
 * so a newly-added command is invisible (and unusable) until it is added here.
 * 決獄/括戶/抑兼併 shipped invisible for exactly this reason.
 */
import type { InternalAffairsType } from '../../game/types';

/** 民政 — civic orders (內政 tab). */
export const CIVIL_ORDER: InternalAffairsType[] = [
  'develop-agriculture',
  'develop-commerce',
  'improve-loyalty',
  'relief',
  'anti-corruption',
  // §1.11–§1.14 民政三患 — 決獄 / 括戶 / 抑兼併.
  'adjudicate',
  'household-audit',
  'curb-hoarding',
  'arm-works',
  'promote-learning',
  'flood-control',
  'search',
  'encourage-migration',
];

/** 軍備 — troops & defence orders (軍務 tab). */
export const MIL_ORDER: InternalAffairsType[] = [
  'recruit-troops',
  'drill-troops',
  'special-training',
  'military-farming',
  'build-defense',
  'garrison',
];

/** 大型工程 — unlocked once the city reaches a higher tier; split the same way. */
export const MAJOR_CIVIL: InternalAffairsType[] = ['major-agriculture', 'major-commerce'];
export const MAJOR_MIL: InternalAffairsType[] = ['major-defense', 'upgrade-wall'];

/** march + every 軍備/城防 order — used to split pending-command rows per tab. */
export const MIL_TYPES = new Set<string>([...MIL_ORDER, ...MAJOR_MIL, 'march']);
