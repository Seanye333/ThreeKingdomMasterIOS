import type { Officer } from '../../game/types';

export type StatKey = 'leadership' | 'war' | 'intelligence' | 'politics' | 'charisma';

const STAT_META: Record<StatKey, { zh: string; en: string; color: string }> = {
  leadership:   { zh: '統', en: 'LDR', color: '#88b7e8' },
  war:          { zh: '武', en: 'WAR', color: '#e0807a' },
  intelligence: { zh: '智', en: 'INT', color: '#b79ae0' },
  politics:     { zh: '政', en: 'POL', color: '#7ed68a' },
  charisma:     { zh: '魅', en: 'CHA', color: '#e6c473' },
};

const ALL_KEYS: StatKey[] = ['leadership', 'war', 'intelligence', 'politics', 'charisma'];

/**
 * 五維 — one canonical, colour-coded officer stat strip (統/武/智/政/魅), so
 * every roster row, hover-card and captive line reads the same instead of the
 * ad-hoc `W70 I70 P70 C70` strings scattered through the UI. Each stat's label
 * carries its own hue; elite values (≥90) glow in that hue and strong ones
 * (≥80) brighten, so talent pops at a glance without a legend.
 */
export function OfficerStats({ officer, keys = ALL_KEYS, size = 'sm', lang = 'zh' }: {
  officer: Officer;
  keys?: StatKey[];
  size?: 'sm' | 'md';
  lang?: 'zh' | 'en';
}) {
  const valFs = size === 'md' ? '0.82rem' : '0.74rem';
  const lblFs = size === 'md' ? '0.6rem' : '0.55rem';
  const gap = size === 'md' ? 9 : 6;
  return (
    <span style={{ display: 'inline-flex', flexWrap: 'wrap', gap, alignItems: 'baseline', fontFamily: 'ui-monospace, monospace', lineHeight: 1.15 }}>
      {keys.map((k) => {
        const m = STAT_META[k];
        const v = officer.stats[k];
        const elite = v >= 90;
        const strong = v >= 80;
        return (
          <span key={k} style={{ display: 'inline-flex', alignItems: 'baseline', gap: 1.5 }}>
            <span style={{ fontSize: lblFs, color: m.color, opacity: 0.9 }}>{lang === 'en' ? m.en : m.zh}</span>
            <span style={{ fontSize: valFs, color: elite ? m.color : strong ? '#dce6ee' : '#aab6c0', fontWeight: elite ? 700 : 400 }}>{v}</span>
          </span>
        );
      })}
    </span>
  );
}
