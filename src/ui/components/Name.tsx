import { useLanguage, pickName } from '../i18n';

/**
 * 名 — render a bilingual {zh,en} pair in the player's chosen language only
 * (zh → zh, en → en, both → "zh en"). Reads the language itself, so it can drop
 * into any roster row / list / card without threading `lang` through the
 * component. Replaces the scattered `{x.name.zh} {x.name.en}` dual displays that
 * leaked both languages regardless of the setting.
 */
export function Name({ pair }: { pair: { zh: string; en: string } | undefined | null }) {
  const lang = useLanguage();
  if (!pair) return null;
  return <>{pickName(pair, lang)}</>;
}
