import { useGameStore } from '../game/state/store';

export type Language = 'zh' | 'en' | 'both';

/** Pick the right side of a bilingual name based on current language.
 *  'both' = "zh en" combined string (legacy behavior). */
export function pickName(
  name: { zh: string; en: string },
  lang: Language,
): string {
  if (lang === 'zh') return name.zh;
  if (lang === 'en') return name.en;
  return `${name.zh} ${name.en}`;
}

/** A hook for components that need the current language. */
export function useLanguage(): Language {
  return useGameStore((s) => s.language ?? 'zh');
}

/** A hook returning a translator that picks zh/en from a bilingual pair.
 *  Usage:
 *    const t = useT();
 *    <button>{t('攻擊', 'Attack')}</button>
 */
export function useT(): (zh: string, en: string) => string {
  const lang = useLanguage();
  if (lang === 'en') return (_zh, en) => en;
  if (lang === 'both') return (zh, en) => `${zh} ${en}`;
  return (zh) => zh;
}

/** Hook returning a description picker. When language is zh, prefers
 *  `obj.descriptionZh` if present; otherwise falls back to `obj.description`.
 *  Usage:
 *    const d = useDesc();
 *    <p>{d(skill)}</p>
 */
export function useDesc(): (obj: { description?: string; descriptionZh?: string }) => string {
  const lang = useLanguage();
  if (lang === 'zh') {
    return (obj) => obj.descriptionZh ?? obj.description ?? '';
  }
  return (obj) => obj.description ?? '';
}
