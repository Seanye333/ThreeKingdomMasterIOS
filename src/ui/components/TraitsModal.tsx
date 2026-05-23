import { TRAIT_DEFS } from '../../game/data/personality';
import { CatalogModal, type CatalogItem, type CatalogCategory } from './CatalogModal';

const CATEGORIES: CatalogCategory[] = [
  { key: 'positive', zh: '正面', en: 'Positive', color: '#b8c87a' },
  { key: 'negative', zh: '負面', en: 'Negative', color: '#b8442e' },
];

interface Props { onClose: () => void; }

export function TraitsModal({ onClose }: Props) {
  const items: CatalogItem[] = TRAIT_DEFS.map((t) => ({
    id: t.id,
    zh: t.name.zh,
    en: t.name.en,
    description: t.description,
    category: t.positive ? 'positive' : 'negative',
    accent: t.color,
    tag: {
      label: t.positive ? '正面' : '負面',
      color: t.positive ? '#b8c87a' : '#b8442e',
    },
  }));
  return (
    <CatalogModal
      onClose={onClose}
      title={{ zh: '性格', en: 'Personality Traits' }}
      items={items}
      categories={CATEGORIES}
    />
  );
}
