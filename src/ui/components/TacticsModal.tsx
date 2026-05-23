import { TACTIC_DEFS } from '../../game/data/officerAttributes';
import { CatalogModal, type CatalogItem, type CatalogCategory } from './CatalogModal';

// Manually classify the 12 tactics into 4 categories.
const TACTIC_CATEGORY: Record<string, string> = {
  charge:         'melee',
  rouse:          'melee',
  ambush:         'melee',
  volley:         'ranged',
  crossbow:       'ranged',
  catapult:       'ranged',
  'fire-attack':  'mystic',
  'water-attack': 'mystic',
  ruse:           'disrupt',
  disorder:       'disrupt',
  pitfall:        'disrupt',
  curse:          'disrupt',
};

const TACTIC_DESC: Record<string, string> = {
  charge:         '突擊 — 騎兵衝鋒突破敵陣。對未防禦的密集步兵殺傷尤甚。',
  rouse:          '鼓舞 — 提振士氣，使己方部隊一回合內 +20% 戰力。',
  ambush:         '急襲 — 出其不意，繞至敵後造成 25% 額外傷害。',
  volley:         '齊射 — 弓兵集體射擊，遠程齊發。對輕甲尤其有效。',
  crossbow:       '連弩 — 連發弩箭，穿透重甲。射程 +1。',
  catapult:       '投石 — 巨石投擲，攻城專用。對城牆造成額外損害。',
  'fire-attack':  '火計 — 火攻燒營，乘風縱火。順風時威力 +35%。',
  'water-attack': '水計 — 掘堤淹城，水攻陣地。要求臨水城池。',
  ruse:           '偽計 — 詐降詐敗誘敵深入，敵 INT <70 時必中。',
  disorder:       '撹亂 — 散布謠言使敵軍陷入混亂，−1 行動點。',
  pitfall:        '落穴 — 設伏陷阱，林地 / 山地專用，造成數倍傷害。',
  curse:          '罵聲 — 陣前痛罵激怒對方主將，引發魯莽行動。',
};

const CATEGORIES: CatalogCategory[] = [
  { key: 'melee',   zh: '近戰', en: 'Melee',   color: '#b8442e' },
  { key: 'ranged',  zh: '遠程', en: 'Ranged',  color: '#b8c87a' },
  { key: 'mystic',  zh: '奇門', en: 'Mystic',  color: '#c178c7' },
  { key: 'disrupt', zh: '擾亂', en: 'Disrupt', color: '#88b7e8' },
];

interface Props { onClose: () => void; }

export function TacticsModal({ onClose }: Props) {
  const items: CatalogItem[] = Object.entries(TACTIC_DEFS).map(([id, def]) => ({
    id,
    zh: def.zh,
    en: def.en,
    description: TACTIC_DESC[id] ?? '',
    category: TACTIC_CATEGORY[id] ?? 'melee',
  }));
  return (
    <CatalogModal
      onClose={onClose}
      title={{ zh: '戰法', en: 'Tactics' }}
      items={items}
      categories={CATEGORIES}
    />
  );
}
