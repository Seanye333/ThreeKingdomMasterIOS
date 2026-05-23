import { POLICY_DEFS } from '../../game/data/officerAttributes';
import { CatalogModal, type CatalogItem, type CatalogCategory } from './CatalogModal';

const POLICY_CATEGORY: Record<string, string> = {
  tuntian:             'economy',
  hydraulics:          'economy',
  commerce:            'economy',
  scholarship:         'civil',
  legalism:            'civil',
  rites:               'civil',
  engineering:         'military',
  recruitment:         'military',
  smithing:            'military',
  'horse-stewardship': 'military',
  medicine:            'civil',
  'military-theory':   'military',
};

const POLICY_DESC: Record<string, string> = {
  tuntian:             '屯田 — 兵農合一，駐軍墾荒。糧食產量 +25%，募兵 +10%。',
  hydraulics:          '治水 — 修堤築壩，灌溉農田。農業上限 +15，水攻防 +20%。',
  commerce:            '商業 — 興市通商，鼓勵交易。商業上限 +15，金收入 +20%。',
  scholarship:         '學問 — 興建學館，培育人才。武將招募成功率 +20%，新生 INT +5。',
  legalism:            '法治 — 嚴明法令，重典治世。城市忠誠 +10，叛亂概率減半。',
  rites:               '禮樂 — 制禮作樂，安撫民心。民忠每季 +1，文官效率 +15%。',
  engineering:         '工兵 — 攻城器械研發。攻城傷害 +25%，城防 +10%。',
  recruitment:         '養兵 — 練兵備戰，訓練精銳。兵力上限 +20%，士兵素質 +1。',
  smithing:            '鍛造 — 鑄造兵刃。武器物品銳氣 +5，武將攻擊 +5。',
  'horse-stewardship': '馬政 — 養馬育駒，騎兵改革。騎兵戰力 +20%，新馬獲取率 +10%。',
  medicine:            '醫術 — 軍醫進駐，療傷救命。瘟疫概率 −50%，負傷恢復 −1 季。',
  'military-theory':   '軍學 — 設兵書院，研讀兵法。陣形效果 +15%，計策成功率 +10%。',
};

const CATEGORIES: CatalogCategory[] = [
  { key: 'economy',  zh: '民政', en: 'Economy',  color: '#b8c87a' },
  { key: 'civil',    zh: '文教', en: 'Civil',    color: '#88b7e8' },
  { key: 'military', zh: '兵備', en: 'Military', color: '#b8442e' },
];

interface Props { onClose: () => void; }

export function PoliciesModal({ onClose }: Props) {
  const items: CatalogItem[] = Object.entries(POLICY_DEFS).map(([id, def]) => ({
    id,
    zh: def.zh,
    en: def.en,
    description: POLICY_DESC[id] ?? '',
    category: POLICY_CATEGORY[id] ?? 'civil',
  }));
  return (
    <CatalogModal
      onClose={onClose}
      title={{ zh: '政策', en: 'Policies' }}
      items={items}
      categories={CATEGORIES}
    />
  );
}
