import type { TerrainKind } from '../../game/types';

/** SVG <defs>: gradients for each terrain, sky backdrop, vignette, filters.
 *  Shared by TacticalBattleScreen + CityMapScreen. */
export function MapDefs() {
  return (
    <defs>
      <linearGradient id="tkmPlainGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#4a4530" />
        <stop offset="100%" stopColor="#2a2515" />
      </linearGradient>
      <linearGradient id="tkmForestGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#3a5530" />
        <stop offset="100%" stopColor="#1a2a18" />
      </linearGradient>
      <linearGradient id="tkmMountainGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#5a4838" />
        <stop offset="100%" stopColor="#2a1f15" />
      </linearGradient>
      <linearGradient id="tkmRiverGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#3a6a98" />
        <stop offset="50%" stopColor="#2c4a6a" />
        <stop offset="100%" stopColor="#1a3050" />
      </linearGradient>
      <linearGradient id="tkmRoadGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#6a5538" />
        <stop offset="100%" stopColor="#3a2818" />
      </linearGradient>
      <linearGradient id="tkmMapBg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%"   stopColor="#1a1408" />
        <stop offset="20%"  stopColor="#241810" />
        <stop offset="100%" stopColor="#0a0805" />
      </linearGradient>
      <radialGradient id="tkmVignette" cx="50%" cy="50%" r="65%">
        <stop offset="60%"  stopColor="rgba(0,0,0,0)" />
        <stop offset="100%" stopColor="rgba(0,0,0,0.55)" />
      </radialGradient>
      {/* Soft drop shadow under units. */}
      <filter id="tkmUnitShadow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur in="SourceAlpha" stdDeviation="1.4" />
        <feOffset dx="0" dy="1.5" result="offsetBlur" />
        <feComponentTransfer><feFuncA type="linear" slope="0.6" /></feComponentTransfer>
        <feMerge>
          <feMergeNode />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      {/* Soft gold glow for hovered/selected hexes. */}
      <filter id="tkmHexGlow" x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation="2.5" result="blur" />
        <feFlood floodColor="#f0e0b0" floodOpacity="0.75" />
        <feComposite in2="blur" operator="in" />
        <feMerge>
          <feMergeNode />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
  );
}

/** Decorative corner brackets around the battlefield. */
export function MapFrame({ width, height }: { width: number; height: number }) {
  const pad = 6;
  const bracket = 24;
  return (
    <g pointerEvents="none">
      <rect
        x={pad} y={pad}
        width={width - pad * 2} height={height - pad * 2}
        fill="none"
        stroke="#5a4530"
        strokeWidth="0.6"
        opacity="0.6"
      />
      {([
        [pad, pad, 1, 1],
        [width - pad, pad, -1, 1],
        [pad, height - pad, 1, -1],
        [width - pad, height - pad, -1, -1],
      ] as Array<[number, number, number, number]>).map(([cx, cy, sx, sy], i) => (
        <g key={i} stroke="#d4a84a" strokeWidth="1.4" fill="none" opacity="0.85">
          <line x1={cx} y1={cy} x2={cx + bracket * sx} y2={cy} />
          <line x1={cx} y1={cy} x2={cx} y2={cy + bracket * sy} />
          <circle cx={cx + 2 * sx} cy={cy + 2 * sy} r="1.5" fill="#d4a84a" stroke="none" />
        </g>
      ))}
    </g>
  );
}

/** Compass rose in a corner — 4 cardinal points with a center diamond. */
export function CompassRose({ x, y }: { x: number; y: number }) {
  const r = 18;
  return (
    <g pointerEvents="none" opacity="0.78">
      <circle cx={x} cy={y} r={r} fill="rgba(20,14,8,0.6)" stroke="#5a4530" strokeWidth="0.6" />
      <circle cx={x} cy={y} r={r - 3} fill="none" stroke="#3a2d20" strokeWidth="0.4" />
      <path d={`M ${x} ${y - r + 2} L ${x - 3} ${y} L ${x} ${y + r - 2} L ${x + 3} ${y} Z`} fill="#d4a84a" opacity="0.85" />
      <path d={`M ${x - r + 2} ${y} L ${x} ${y - 3} L ${x + r - 2} ${y} L ${x} ${y + 3} Z`} fill="#8a7050" opacity="0.6" />
      <text x={x} y={y - r + 1} textAnchor="middle" fontSize="6" fill="#f0e0b0" fontFamily="Songti SC, serif" fontWeight="bold">N</text>
      <circle cx={x} cy={y} r="1.2" fill="#f0e0b0" />
    </g>
  );
}

/** Map terrain to its gradient fill URL. */
export const TERRAIN_FILL_URL: Record<TerrainKind, string> = {
  plain:    'url(#tkmPlainGrad)',
  forest:   'url(#tkmForestGrad)',
  mountain: 'url(#tkmMountainGrad)',
  river:    'url(#tkmRiverGrad)',
  road:     'url(#tkmRoadGrad)',
};

/** Rich per-terrain art: layered pines, shadowed mountains with snow caps,
 *  wavelets with glints, cobblestone roads, scattered grass tufts.
 *  Animations classes are applied (tkm-wave, tkm-sway). */
export function TerrainArt({ x, y, terrain }: { x: number; y: number; terrain: TerrainKind }) {
  const jitter = ((x * 31 + y * 17) % 5) - 2;
  const jitter2 = ((x * 13 + y * 23) % 5) - 2;
  switch (terrain) {
    case 'forest':
      return (
        <g pointerEvents="none" className="tkm-hex-sway">
          {/* Ground shadow under tree cluster */}
          <ellipse cx={x} cy={y + 10} rx="10" ry="2.5" fill="rgba(0,0,0,0.4)" />
          {/* Layered canopy — back row (darker), shifted up to stand taller */}
          <ellipse cx={x - 5} cy={y - 2} rx="5" ry="4" fill="#152812" opacity="0.7" />
          <ellipse cx={x + 5} cy={y - 3} rx="5" ry="4" fill="#152812" opacity="0.7" />
          {/* Three taller pines with depth — each extends up to y-14 */}
          <path d={`M ${x - 8 + jitter} ${y + 8} L ${x - 5 + jitter} ${y - 14} L ${x - 2 + jitter} ${y + 8} Z`} fill="#2d4a28" stroke="#0a1808" strokeWidth="0.5" />
          <path d={`M ${x - 8 + jitter} ${y + 2} L ${x - 5 + jitter} ${y - 8} L ${x - 2 + jitter} ${y + 2} Z`} fill="#3a5a32" stroke="#0a1808" strokeWidth="0.3" opacity="0.9" />
          <path d={`M ${x - 8 + jitter} ${y - 4} L ${x - 5 + jitter} ${y - 12} L ${x - 2 + jitter} ${y - 4} Z`} fill="#4a7038" stroke="#0a1808" strokeWidth="0.3" opacity="0.85" />
          <path d={`M ${x + 1 + jitter2} ${y + 8} L ${x + 4 + jitter2} ${y - 16} L ${x + 7 + jitter2} ${y + 8} Z`} fill="#2d4a28" stroke="#0a1808" strokeWidth="0.5" />
          <path d={`M ${x + 1 + jitter2} ${y + 2} L ${x + 4 + jitter2} ${y - 9} L ${x + 7 + jitter2} ${y + 2} Z`} fill="#3a5a32" stroke="#0a1808" strokeWidth="0.3" opacity="0.9" />
          <path d={`M ${x + 1 + jitter2} ${y - 4} L ${x + 4 + jitter2} ${y - 14} L ${x + 7 + jitter2} ${y - 4} Z`} fill="#4a7038" stroke="#0a1808" strokeWidth="0.3" opacity="0.85" />
          <line x1={x - 5 + jitter} y1={y + 8} x2={x - 5 + jitter} y2={y + 10} stroke="#3a2818" strokeWidth="1" />
          <line x1={x + 4 + jitter2} y1={y + 8} x2={x + 4 + jitter2} y2={y + 10} stroke="#3a2818" strokeWidth="1" />
        </g>
      );
    case 'mountain':
      return (
        <g pointerEvents="none">
          {/* Cast shadow — long, towards the south-east */}
          <ellipse cx={x + 3} cy={y + 11} rx="13" ry="3" fill="rgba(0,0,0,0.5)" />
          {/* Back peak — taller, in deeper shadow, extends to y-22 */}
          <path d={`M ${x - 8} ${y + 8} L ${x - 1} ${y - 22} L ${x + 6} ${y + 8} Z`} fill="#2a1f15" stroke="#0a0805" strokeWidth="0.5" />
          {/* Mid peak */}
          <path d={`M ${x - 4} ${y + 8} L ${x + 3} ${y - 18} L ${x + 10} ${y + 8} Z`} fill="#3a2d20" stroke="#0a0805" strokeWidth="0.5" />
          {/* Front peak — lighter, with visible face */}
          <path d={`M ${x - 2} ${y + 8} L ${x + 5} ${y - 12} L ${x + 12} ${y + 8} Z`} fill="#5a4530" stroke="#0a0805" strokeWidth="0.5" />
          {/* Right (shadow) face */}
          <path d={`M ${x + 5} ${y - 12} L ${x + 12} ${y + 8} L ${x + 8} ${y + 8} Z`} fill="#3a2818" opacity="0.85" />
          {/* Snow caps — bigger now */}
          <path d={`M ${x - 3} ${y - 14} L ${x - 1} ${y - 22} L ${x + 1} ${y - 14} L ${x} ${y - 12} L ${x - 2} ${y - 12} Z`} fill="#f0e0b0" stroke="#a89878" strokeWidth="0.3" />
          <path d={`M ${x + 1} ${y - 10} L ${x + 3} ${y - 18} L ${x + 5} ${y - 10} L ${x + 4} ${y - 8} L ${x + 2} ${y - 8} Z`} fill="#f0e0b0" stroke="#a89878" strokeWidth="0.3" />
          <path d={`M ${x + 3} ${y - 5} L ${x + 5} ${y - 12} L ${x + 7} ${y - 5} Z`} fill="#f0e0b0" stroke="#a89878" strokeWidth="0.2" />
        </g>
      );
    case 'river':
      return (
        <g pointerEvents="none" className="tkm-hex-wave">
          <ellipse cx={x} cy={y - 1} rx="11" ry="3" fill="#5a9bc8" opacity="0.4" />
          <g stroke="#a8d4f0" strokeWidth="0.7" fill="none" opacity="0.95">
            <path d={`M ${x - 11} ${y - 5} Q ${x - 5.5} ${y - 7} ${x} ${y - 5} Q ${x + 5.5} ${y - 3} ${x + 11} ${y - 5}`} />
            <path d={`M ${x - 11} ${y} Q ${x - 5.5} ${y - 2.5} ${x} ${y} Q ${x + 5.5} ${y + 2.5} ${x + 11} ${y}`} />
            <path d={`M ${x - 11} ${y + 5} Q ${x - 5.5} ${y + 2.5} ${x} ${y + 5} Q ${x + 5.5} ${y + 7.5} ${x + 11} ${y + 5}`} />
          </g>
          <circle cx={x + jitter} cy={y - 3} r="1" fill="#f0f7ff" opacity="0.7" className="tkm-glint" />
          <circle cx={x + jitter2 - 4} cy={y + 3} r="0.8" fill="#f0f7ff" opacity="0.6" className="tkm-glint" />
        </g>
      );
    case 'road':
      return (
        <g pointerEvents="none">
          <rect x={x - 13} y={y - 4} width="26" height="8" fill="#5a4838" stroke="#3a2d20" strokeWidth="0.5" rx="1" />
          <rect x={x - 11} y={y - 3} width="4" height="3" fill="#7a6750" opacity="0.6" />
          <rect x={x - 6} y={y - 3} width="4" height="3" fill="#8a7560" opacity="0.55" />
          <rect x={x - 1} y={y - 3} width="4" height="3" fill="#7a6750" opacity="0.6" />
          <rect x={x + 4} y={y - 3} width="4" height="3" fill="#8a7560" opacity="0.55" />
          <rect x={x - 11} y={y + 1} width="4" height="3" fill="#8a7560" opacity="0.55" />
          <rect x={x - 6} y={y + 1} width="4" height="3" fill="#7a6750" opacity="0.6" />
          <rect x={x - 1} y={y + 1} width="4" height="3" fill="#8a7560" opacity="0.55" />
          <rect x={x + 4} y={y + 1} width="4" height="3" fill="#7a6750" opacity="0.6" />
          <line x1={x - 13} y1={y} x2={x + 13} y2={y} stroke="#3a2d20" strokeWidth="0.4" opacity="0.7" />
        </g>
      );
    case 'plain':
    default:
      return (
        <g pointerEvents="none">
          <line x1={x - 7 + jitter}  y1={y + 5} x2={x - 7 + jitter}  y2={y + 1} stroke="#6a7a3a" strokeWidth="0.7" />
          <line x1={x - 8 + jitter}  y1={y + 5} x2={x - 6 + jitter}  y2={y + 2} stroke="#5a6a30" strokeWidth="0.5" />
          <line x1={x - 1 + jitter2} y1={y + 4} x2={x - 1 + jitter2} y2={y + 0} stroke="#6a7a3a" strokeWidth="0.7" />
          <line x1={x + 5 + jitter2} y1={y + 6} x2={x + 5 + jitter2} y2={y + 1} stroke="#6a7a3a" strokeWidth="0.7" />
          <line x1={x + 6 + jitter2} y1={y + 5} x2={x + 4 + jitter2} y2={y + 2} stroke="#5a6a30" strokeWidth="0.5" />
          {jitter > 0 && (
            <circle cx={x - 3 + jitter} cy={y + 6} r="0.8" fill="#8a7050" opacity="0.6" />
          )}
          {jitter2 < 0 && (
            <ellipse cx={x + 7 + jitter2} cy={y + 7} rx="1.2" ry="0.6" fill="#8a7050" opacity="0.5" />
          )}
        </g>
      );
  }
}
