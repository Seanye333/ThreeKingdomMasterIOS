import { SKILLS } from '../../game/data/skills';
import { TRAIT_DEFS } from '../../game/data/personality';
import { useT } from '../i18n';
import { CatalogModal, type CatalogItem, type CatalogCategory } from './CatalogModal';

/**
 * RTK 14-style unified "Individuality" browser.
 *
 * Merges the 200 personality traits + 30 combat/civil skills into one
 * sortable catalogue. Under the hood the data still lives in two separate
 * arrays — combat math reads `SKILLS`, recruit math reads `TRAIT_DEFS` —
 * but the player sees a single list and a single browse button.
 */

const CATEGORIES: CatalogCategory[] = [
  { key: 'combat',      zh: '武勇',     en: 'Combat',      color: '#b8442e' },
  { key: 'command',     zh: '統率',     en: 'Command',     color: '#e6c473' },
  { key: 'wisdom',      zh: '智謀',     en: 'Wisdom',      color: '#88b7e8' },
  { key: 'civil',       zh: '文政',     en: 'Civil',       color: '#b8c87a' },
  { key: 'personality', zh: '性格',     en: 'Personality', color: '#c178c7' },
];

interface Props { onClose: () => void; }

export function IndividualitiesModal({ onClose }: Props) {
  const t = useT();

  const skillItems: CatalogItem[] = SKILLS.map((s) => ({
    id: `skill-${s.id}`,
    zh: s.name.zh,
    en: s.name.en,
    description: s.description,
    descriptionZh: s.descriptionZh,
    category: s.category,
    tag: { label: t('特技', 'Skill'), color: '#e6c473' },
  }));

  const traitItems: CatalogItem[] = TRAIT_DEFS.map((tr) => ({
    id: `trait-${tr.id}`,
    zh: tr.name.zh,
    en: tr.name.en,
    description: tr.description,
    descriptionZh: tr.descriptionZh,
    category: 'personality',
    accent: tr.color,
    tag: {
      label: tr.positive ? t('正面', 'Positive') : t('負面', 'Negative'),
      color: tr.positive ? '#b8c87a' : '#b8442e',
    },
  }));

  return (
    <CatalogModal
      onClose={onClose}
      title={{ zh: '個性', en: 'Individualities' }}
      items={[...skillItems, ...traitItems]}
      categories={CATEGORIES}
    />
  );
}
