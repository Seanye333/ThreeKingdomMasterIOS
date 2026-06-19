/**
 * Dynasty registry — used to gate "historical officer pools" players can
 * opt into before starting a scenario. The Three-Kingdoms officers are the
 * default and aren't in this list.
 */

export type Dynasty =
  | 'spring-autumn'
  | 'warring-states'
  | 'qin'
  | 'chu-han'
  | 'western-han'
  | 'three-kingdoms'
  | 'jin'
  | 'southern-northern'
  | 'sui'
  | 'tang'
  | 'five-dynasties'
  | 'song'
  | 'yuan'
  | 'ming'
  | 'qing';

export interface DynastyDef {
  id: Dynasty;
  name: { zh: string; en: string };
  /** Approximate era; shown next to the toggle. */
  era: { zh: string; en: string };
  /** Accent color used to dot-tag officers by era in lists. */
  color: string;
}

export const DYNASTY_DEFS: DynastyDef[] = [
  { id: 'spring-autumn',     name: { zh: '春秋',     en: 'Spring & Autumn' }, era: { zh: '前770–前476', en: '770–476 BC' },  color: '#7a8c5a' },
  { id: 'warring-states',    name: { zh: '戰國',     en: 'Warring States' },  era: { zh: '前475–前221', en: '475–221 BC' },  color: '#a06030' },
  { id: 'qin',               name: { zh: '秦',       en: 'Qin' },             era: { zh: '前221–前206', en: '221–206 BC' },  color: '#222222' },
  { id: 'chu-han',           name: { zh: '楚漢',     en: 'Chu-Han' },         era: { zh: '前206–前202', en: '206–202 BC' },  color: '#c0392b' },
  { id: 'western-han',       name: { zh: '西漢',     en: 'Western Han' },     era: { zh: '前202–9',     en: '202 BC–9 AD' }, color: '#d4a84a' },
  { id: 'three-kingdoms',    name: { zh: '三國',     en: 'Three Kingdoms' },  era: { zh: '184–280',     en: '184–280' },     color: '#3a7dd9' },
  { id: 'jin',               name: { zh: '兩晉',     en: 'Jin' },             era: { zh: '266–420',     en: '266–420' },     color: '#5a7a90' },
  { id: 'southern-northern', name: { zh: '南北朝',   en: 'Southern & Northern' }, era: { zh: '420–589', en: '420–589' },    color: '#8a5a90' },
  { id: 'sui',               name: { zh: '隋',       en: 'Sui' },             era: { zh: '581–618',     en: '581–618' },     color: '#3a7d6a' },
  { id: 'tang',              name: { zh: '唐',       en: 'Tang' },            era: { zh: '618–907',     en: '618–907' },     color: '#d4624a' },
  { id: 'five-dynasties',    name: { zh: '五代',     en: 'Five Dynasties' },  era: { zh: '907–960',     en: '907–960' },     color: '#7a5a3a' },
  { id: 'song',              name: { zh: '宋',       en: 'Song' },            era: { zh: '960–1279',    en: '960–1279' },    color: '#3a6da0' },
  { id: 'yuan',              name: { zh: '元',       en: 'Yuan' },            era: { zh: '1271–1368',   en: '1271–1368' },   color: '#5a4030' },
  { id: 'ming',              name: { zh: '明',       en: 'Ming' },            era: { zh: '1368–1644',   en: '1368–1644' },   color: '#c0a04a' },
  { id: 'qing',              name: { zh: '清',       en: 'Qing' },            era: { zh: '1644–1912',   en: '1644–1912' },   color: '#4a6a8a' },
];

export const DYNASTY_BY_ID: Record<Dynasty, DynastyDef> = Object.fromEntries(
  DYNASTY_DEFS.map((d) => [d.id, d]),
) as Record<Dynasty, DynastyDef>;
