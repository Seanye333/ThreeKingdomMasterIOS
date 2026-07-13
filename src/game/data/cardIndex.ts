import { OFFICER_IDS, TALENT_POOL_IDS } from './officers';
import { HISTORICAL_OFFICER_TEMPLATES } from './historicalOfficers';

/**
 * 圖鑑編號 — the collector's number stamped on every officer card (#042/1108,
 * TCG-style). Ordering is the data files' own roster order (stable across
 * sessions; new officers append). Generated commoners/customs have no number.
 */
const ALL_IDS: string[] = [
  ...OFFICER_IDS,
  ...TALENT_POOL_IDS,
  ...HISTORICAL_OFFICER_TEMPLATES.map((t) => t.id),
];

export const CARD_INDEX: Record<string, number> = Object.fromEntries(
  ALL_IDS.map((id, i) => [id, i + 1]),
);
export const CARD_TOTAL = ALL_IDS.length;
