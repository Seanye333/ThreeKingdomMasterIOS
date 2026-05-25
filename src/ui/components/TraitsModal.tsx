import { TRAIT_DEFS } from '../../game/data/personality';
import { CatalogModal, type CatalogItem, type CatalogCategory } from './CatalogModal';
import { useT } from '../i18n';

const CATEGORIES: CatalogCategory[] = [
  { key: 'positive', zh: '正面', en: 'Positive', color: '#b8c87a' },
  { key: 'negative', zh: '負面', en: 'Negative', color: '#b8442e' },
];

interface Props { onClose: () => void; }

export function TraitsModal({ onClose }: Props) {
  const t = useT();
  const items: CatalogItem[] = TRAIT_DEFS.map((tr) => ({
    id: tr.id,
    zh: tr.name.zh,
    en: tr.name.en,
    description: tr.description,
    descriptionZh: tr.descriptionZh,
    category: tr.positive ? 'positive' : 'negative',
    accent: tr.color,
    tag: {
      label: tr.positive ? t('正面', 'Positive') : t('負面', 'Negative'),
      color: tr.positive ? '#b8c87a' : '#b8442e',
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
