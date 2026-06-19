import { useId, type CSSProperties } from 'react';

export interface SealProps {
  /** 1–4 characters carved into the chop. */
  chars: string;
  /** Side length in px. Default 64. */
  size?: number;
  /** Tilt for a hand-stamped feel. Default -6deg. */
  rotate?: number;
  /** Cinnabar red. Default a warm vermilion. */
  color?: string;
  title?: string;
  className?: string;
  style?: CSSProperties;
}

/**
 * 朱印 — a vermilion seal stamp. A rounded cinnabar chop with a cream double
 * border and relief (白文-style) characters, tilted and softly shadowed so it
 * reads as pressed onto the surface. Four characters fall into the classic
 * 篆刻 reading order (right column top→bottom, then left). Inline SVG; the only
 * colour it imposes is its own red, so it sits on any panel.
 */
export function Seal({
  chars,
  size = 64,
  rotate = -6,
  color = '#b5302c',
  title,
  className,
  style,
}: SealProps) {
  const uid = useId().replace(/:/g, '');
  const cream = '#fbe6cf';
  const list = [...chars].slice(0, 4);

  // Per-count glyph placement (x, y, fontSize). 4 chars read TR→BR→TL→BL.
  const layout: Array<{ x: number; y: number; fs: number }> =
    list.length <= 1
      ? [{ x: 50, y: 52, fs: 52 }]
      : list.length === 2
        ? [{ x: 50, y: 34, fs: 40 }, { x: 50, y: 74, fs: 40 }]
        : list.length === 3
          ? [{ x: 50, y: 28, fs: 30 }, { x: 50, y: 52, fs: 30 }, { x: 50, y: 76, fs: 30 }]
          : [{ x: 68, y: 38, fs: 34 }, { x: 68, y: 74, fs: 34 }, { x: 32, y: 38, fs: 34 }, { x: 32, y: 74, fs: 34 }];

  return (
    <span
      className={className}
      title={title}
      style={{
        display: 'inline-block',
        width: size,
        height: size,
        transform: `rotate(${rotate}deg)`,
        filter: 'drop-shadow(0 2px 4px rgba(120,20,16,0.45))',
        lineHeight: 0,
        ...style,
      }}
      aria-label={title ?? chars}
      role="img"
    >
      <svg viewBox="0 0 100 100" width={size} height={size}>
        <defs>
          <radialGradient id={`seal-${uid}`} cx="42%" cy="38%" r="72%">
            <stop offset="0%" stopColor="#cf4a40" />
            <stop offset="70%" stopColor={color} />
            <stop offset="100%" stopColor="#92201d" />
          </radialGradient>
        </defs>
        <rect x="5" y="5" width="90" height="90" rx="13" fill={`url(#seal-${uid})`} />
        <rect x="11" y="11" width="78" height="78" rx="8" fill="none" stroke={cream} strokeWidth="2.5" opacity="0.92" />
        {list.map((ch, i) => (
          <text
            key={i}
            x={layout[i].x}
            y={layout[i].y}
            fontSize={layout[i].fs}
            fill={cream}
            textAnchor="middle"
            dominantBaseline="central"
            fontFamily="'Songti SC','Noto Serif SC',serif"
            fontWeight={700}
          >
            {ch}
          </text>
        ))}
      </svg>
    </span>
  );
}
