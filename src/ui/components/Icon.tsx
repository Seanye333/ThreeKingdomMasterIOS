import type { CSSProperties, ReactElement } from 'react';

export type IconName = 'gold' | 'grain' | 'war' | 'city' | 'shield' | 'flag' | 'scroll';

/**
 * 統一圖標 — a small set of inline-SVG glyphs for the game's core nouns, so
 * 金/糧/兵/城 read identically on every OS instead of leaning on emoji
 * (🪙🌾⚔🏯) that render differently on Windows/Mac/Android. Monochrome,
 * `currentColor`-driven, sized in px; drops inline beside text.
 */
const PATHS: Record<IconName, ReactElement> = {
  // 錢 — a round Chinese cash coin with its square hole.
  gold: (
    <g fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="8.4" />
      <rect x="9.3" y="9.3" width="5.4" height="5.4" />
    </g>
  ),
  // 禾 — a wheat sheaf: stem with three paired grains.
  grain: (
    <g stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" fill="currentColor">
      <path d="M12 21 V11" fill="none" />
      <path d="M12 12.4 C8.6 11.8 7.4 9 8 6.6 C11.4 7.2 12.6 10 12 12.4 Z" stroke="none" />
      <path d="M12 12.4 C15.4 11.8 16.6 9 16 6.6 C12.6 7.2 11.4 10 12 12.4 Z" stroke="none" />
      <path d="M12 8.6 C9.2 8.1 8.2 5.8 8.7 3.8 C11.5 4.3 12.5 6.6 12 8.6 Z" stroke="none" />
      <path d="M12 8.6 C14.8 8.1 15.8 5.8 15.3 3.8 C12.5 4.3 11.5 6.6 12 8.6 Z" stroke="none" />
    </g>
  ),
  // 兵 — crossed swords.
  war: (
    <g stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none">
      <path d="M6 19 L15.6 7.2" />
      <path d="M18 19 L8.4 7.2" />
      <path d="M4.4 17.4 L7.6 20.6" />
      <path d="M19.6 17.4 L16.4 20.6" />
      <path d="M15.6 7.2 L17.8 4.4" />
      <path d="M8.4 7.2 L6.2 4.4" />
    </g>
  ),
  // 城 — a gate tower with a peaked roof and an arched gate.
  city: (
    <g fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round">
      <path d="M4.5 20.5 V10 L12 4.5 L19.5 10 V20.5 Z" />
      <path d="M9.6 20.5 V15 a2.4 2.4 0 0 1 4.8 0 V20.5" />
    </g>
  ),
  // 守 — a shield.
  shield: (
    <g fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round">
      <path d="M12 3.5 L19 6 V11.5 C19 16 16 19.5 12 21 C8 19.5 5 16 5 11.5 V6 Z" />
    </g>
  ),
  // 旗 — a banner on a pole.
  flag: (
    <g fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 3 V21" />
      <path d="M6 4.5 H17 L14 8 L17 11.5 H6 Z" fill="currentColor" stroke="none" />
    </g>
  ),
  // 書 — a rolled scroll.
  scroll: (
    <g fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round">
      <path d="M6 5.5 a2 2 0 0 1 2 -2 H18 a2 2 0 0 0 -2 2 V17 H8 a2 2 0 0 0 -2 2 Z" />
      <path d="M16 3.5 a2 2 0 0 1 2 2 V19 a2 2 0 0 1 -2 2 H8" />
    </g>
  ),
};

interface IconProps {
  name: IconName;
  /** Side length in px. Default 16. */
  size?: number;
  color?: string;
  title?: string;
  style?: CSSProperties;
}

export function Icon({ name, size = 16, color, title, style }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      aria-hidden={title ? undefined : true}
      role={title ? 'img' : undefined}
      aria-label={title}
      style={{ display: 'inline-block', verticalAlign: '-0.14em', flexShrink: 0, color, ...style }}
    >
      {title && <title>{title}</title>}
      {PATHS[name]}
    </svg>
  );
}
