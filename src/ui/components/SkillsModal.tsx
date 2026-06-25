import { SKILLS } from '../../game/data/skills';
import { useEscapeKey } from '../hooks/useEscapeKey';
import { CatalogModal, type CatalogItem, type CatalogCategory } from './CatalogModal';

const CATEGORIES: CatalogCategory[] = [
  { key: 'combat',  zh: '武勇', en: 'Combat',   color: '#b8442e' },
  { key: 'command', zh: '統率', en: 'Command',  color: '#e6c473' },
  { key: 'wisdom',  zh: '智謀', en: 'Wisdom',   color: '#88b7e8' },
  { key: 'civil',   zh: '文政', en: 'Civil',    color: '#b8c87a' },
];

interface Props { onClose: () => void; }

export function SkillsModal({ onClose }: Props) {
  useEscapeKey(onClose);
  const items: CatalogItem[] = SKILLS.map((s) => ({
    id: s.id,
    zh: s.name.zh,
    en: s.name.en,
    description: s.description,
    descriptionZh: s.descriptionZh,
    category: s.category,
  }));
  return (
    <CatalogModal
      onClose={onClose}
      title={{ zh: '特技', en: 'Skills' }}
      items={items}
      categories={CATEGORIES}
    />
  );
}
