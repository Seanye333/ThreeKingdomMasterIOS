import type { MedalDef } from '../../game/data/medals';
import { useLanguage } from '../i18n';

/** 勳章徽章 — a struck SVG medal: stat-coloured disc, laurel ring, ribbon,
 *  and the deed's glyph at its heart. Pure chrome for the card's medal wall. */

const STAT_COLOR: Record<string, string> = {
  war: '#e07a5f', leadership: '#7ec0e0', intelligence: '#b78ae0',
  politics: '#8ac88a', charisma: '#e0c068',
};

export function MedalBadge({ medal, size = 36 }: { medal: MedalDef; size?: number }) {
  const lang = useLanguage();
  const c = STAT_COLOR[medal.stat] ?? '#e6c473';
  return (
    <span title={`${medal.name.zh} — ${lang === 'en' ? medal.description : medal.descriptionZh}`}
      style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', width: size + 6 }}>
      <svg width={size} height={size * 1.25} viewBox="0 0 40 50">
        {/* 綬帶 */}
        <path d="M14 28 L 11 46 L 20 40 L 29 46 L 26 28 Z" fill={c} opacity="0.55" />
        {/* 外環(桂冠) */}
        <circle cx="20" cy="18" r="15" fill="#141b24" stroke={c} strokeWidth="2" />
        <circle cx="20" cy="18" r="11.5" fill="none" stroke={c} strokeWidth="0.8" opacity="0.6" strokeDasharray="2 2.4" />
        {/* 徽記 */}
        <text x="20" y="24" textAnchor="middle" fontSize="15" fill={c}
          fontFamily='"Ma Shan Zheng", "Songti SC", serif'>{medal.glyph}</text>
      </svg>
      <span style={{ fontSize: '0.56rem', color: c, letterSpacing: '0.04rem', whiteSpace: 'nowrap' }}>{medal.name.zh}</span>
    </span>
  );
}
