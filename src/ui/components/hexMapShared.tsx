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
        <stop offset="100%" stopColor="#1b2531" />
      </linearGradient>
      <linearGradient id="tkmRiverGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#3a6a98" />
        <stop offset="50%" stopColor="#2c4a6a" />
        <stop offset="100%" stopColor="#1a3050" />
      </linearGradient>
      <linearGradient id="tkmRoadGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#6a5538" />
        <stop offset="100%" stopColor="#1e2832" />
      </linearGradient>
      {/* Hill — warm tawny earth, brighter on top. */}
      <linearGradient id="tkmHillGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#8a7048" />
        <stop offset="100%" stopColor="#3a2a18" />
      </linearGradient>
      {/* Marsh — muddy olive-blue. */}
      <linearGradient id="tkmMarshGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#3a4838" />
        <stop offset="100%" stopColor="#1a2418" />
      </linearGradient>
      {/* Chokepoint — narrow stone defile, darker than road. */}
      <linearGradient id="tkmChokepointGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#364654" />
        <stop offset="100%" stopColor="#1a1208" />
      </linearGradient>
      {/* Bridge — timber over water. */}
      <linearGradient id="tkmBridgeGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#8a6840" />
        <stop offset="100%" stopColor="#1e2832" />
      </linearGradient>
      {/* Gate — dark masonry. */}
      <linearGradient id="tkmGateGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#4a3525" />
        <stop offset="100%" stopColor="#1a1208" />
      </linearGradient>
      {/* Watchtower — stone platform with warm highlight. */}
      <linearGradient id="tkmWatchtowerGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#6a5840" />
        <stop offset="100%" stopColor="#2a2018" />
      </linearGradient>
      <linearGradient id="tkmMapBg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%"   stopColor="#1a1408" />
        <stop offset="20%"  stopColor="#241810" />
        <stop offset="100%" stopColor="#080b0e" />
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
        <feFlood floodColor="#eef4f8" floodOpacity="0.75" />
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
        stroke="#364654"
        strokeWidth="0.6"
        opacity="0.6"
      />
      {([
        [pad, pad, 1, 1],
        [width - pad, pad, -1, 1],
        [pad, height - pad, 1, -1],
        [width - pad, height - pad, -1, -1],
      ] as Array<[number, number, number, number]>).map(([cx, cy, sx, sy], i) => (
        <g key={i} stroke="#e6c473" strokeWidth="1.4" fill="none" opacity="0.85">
          <line x1={cx} y1={cy} x2={cx + bracket * sx} y2={cy} />
          <line x1={cx} y1={cy} x2={cx} y2={cy + bracket * sy} />
          <circle cx={cx + 2 * sx} cy={cy + 2 * sy} r="1.5" fill="#e6c473" stroke="none" />
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
      <circle cx={x} cy={y} r={r} fill="rgba(20,14,8,0.6)" stroke="#364654" strokeWidth="0.6" />
      <circle cx={x} cy={y} r={r - 3} fill="none" stroke="#26323e" strokeWidth="0.4" />
      <path d={`M ${x} ${y - r + 2} L ${x - 3} ${y} L ${x} ${y + r - 2} L ${x + 3} ${y} Z`} fill="#e6c473" opacity="0.85" />
      <path d={`M ${x - r + 2} ${y} L ${x} ${y - 3} L ${x + r - 2} ${y} L ${x} ${y + 3} Z`} fill="#7a8893" opacity="0.6" />
      <text x={x} y={y - r + 1} textAnchor="middle" fontSize="6" fill="#eef4f8" fontFamily="Songti SC, serif" fontWeight="bold">N</text>
      <circle cx={x} cy={y} r="1.2" fill="#eef4f8" />
    </g>
  );
}

/** Map terrain to its gradient fill URL. */
export const TERRAIN_FILL_URL: Record<TerrainKind, string> = {
  plain:    'url(#tkmPlainGrad)',
  ice:      'url(#tkmRiverGrad)',
  forest:   'url(#tkmForestGrad)',
  mountain: 'url(#tkmMountainGrad)',
  river:    'url(#tkmRiverGrad)',
  road:     'url(#tkmRoadGrad)',
  hill:       'url(#tkmHillGrad)',
  marsh:      'url(#tkmMarshGrad)',
  desert:     'url(#tkmHillGrad)',   // tawny ≈ sand on the 2D map (3D uses a sand colour)
  chokepoint: 'url(#tkmChokepointGrad)',
  bridge:     'url(#tkmBridgeGrad)',
  gate:       'url(#tkmGateGrad)',
  wall:       'url(#tkmGateGrad)',
  watchtower: 'url(#tkmWatchtowerGrad)',
  fieldworks: 'url(#tkmChokepointGrad)',  // dug earth ≈ dark defile tone on the 2D map
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
          <line x1={x - 5 + jitter} y1={y + 8} x2={x - 5 + jitter} y2={y + 10} stroke="#1e2832" strokeWidth="1" />
          <line x1={x + 4 + jitter2} y1={y + 8} x2={x + 4 + jitter2} y2={y + 10} stroke="#1e2832" strokeWidth="1" />
        </g>
      );
    case 'mountain':
      return (
        <g pointerEvents="none">
          {/* Cast shadow — long, towards the south-east */}
          <ellipse cx={x + 3} cy={y + 11} rx="13" ry="3" fill="rgba(0,0,0,0.5)" />
          {/* Back peak — taller, in deeper shadow, extends to y-22 */}
          <path d={`M ${x - 8} ${y + 8} L ${x - 1} ${y - 22} L ${x + 6} ${y + 8} Z`} fill="#1b2531" stroke="#080b0e" strokeWidth="0.5" />
          {/* Mid peak */}
          <path d={`M ${x - 4} ${y + 8} L ${x + 3} ${y - 18} L ${x + 10} ${y + 8} Z`} fill="#26323e" stroke="#080b0e" strokeWidth="0.5" />
          {/* Front peak — lighter, with visible face */}
          <path d={`M ${x - 2} ${y + 8} L ${x + 5} ${y - 12} L ${x + 12} ${y + 8} Z`} fill="#364654" stroke="#080b0e" strokeWidth="0.5" />
          {/* Right (shadow) face */}
          <path d={`M ${x + 5} ${y - 12} L ${x + 12} ${y + 8} L ${x + 8} ${y + 8} Z`} fill="#1e2832" opacity="0.85" />
          {/* Snow caps — bigger now */}
          <path d={`M ${x - 3} ${y - 14} L ${x - 1} ${y - 22} L ${x + 1} ${y - 14} L ${x} ${y - 12} L ${x - 2} ${y - 12} Z`} fill="#eef4f8" stroke="#a89878" strokeWidth="0.3" />
          <path d={`M ${x + 1} ${y - 10} L ${x + 3} ${y - 18} L ${x + 5} ${y - 10} L ${x + 4} ${y - 8} L ${x + 2} ${y - 8} Z`} fill="#eef4f8" stroke="#a89878" strokeWidth="0.3" />
          <path d={`M ${x + 3} ${y - 5} L ${x + 5} ${y - 12} L ${x + 7} ${y - 5} Z`} fill="#eef4f8" stroke="#a89878" strokeWidth="0.2" />
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
          <rect x={x - 13} y={y - 4} width="26" height="8" fill="#5a4838" stroke="#26323e" strokeWidth="0.5" rx="1" />
          <rect x={x - 11} y={y - 3} width="4" height="3" fill="#7a6750" opacity="0.6" />
          <rect x={x - 6} y={y - 3} width="4" height="3" fill="#8a7560" opacity="0.55" />
          <rect x={x - 1} y={y - 3} width="4" height="3" fill="#7a6750" opacity="0.6" />
          <rect x={x + 4} y={y - 3} width="4" height="3" fill="#8a7560" opacity="0.55" />
          <rect x={x - 11} y={y + 1} width="4" height="3" fill="#8a7560" opacity="0.55" />
          <rect x={x - 6} y={y + 1} width="4" height="3" fill="#7a6750" opacity="0.6" />
          <rect x={x - 1} y={y + 1} width="4" height="3" fill="#8a7560" opacity="0.55" />
          <rect x={x + 4} y={y + 1} width="4" height="3" fill="#7a6750" opacity="0.6" />
          <line x1={x - 13} y1={y} x2={x + 13} y2={y} stroke="#26323e" strokeWidth="0.4" opacity="0.7" />
        </g>
      );
    case 'hill':
      return (
        <g pointerEvents="none">
          <ellipse cx={x} cy={y + 7} rx="11" ry="2" fill="rgba(0,0,0,0.35)" />
          {/* Rounded earthy mound */}
          <path d={`M ${x - 11} ${y + 7} Q ${x - 5} ${y - 6} ${x} ${y - 8} Q ${x + 5} ${y - 6} ${x + 11} ${y + 7} Z`}
            fill="#7a6238" stroke="#1e2832" strokeWidth="0.5" />
          {/* Highlight band */}
          <path d={`M ${x - 7} ${y - 1} Q ${x} ${y - 7} ${x + 7} ${y - 1}`}
            fill="none" stroke="#a08858" strokeWidth="1.2" opacity="0.7" />
          {/* Grass tufts on top */}
          <line x1={x - 2 + jitter} y1={y - 4} x2={x - 2 + jitter} y2={y - 7} stroke="#6a8a3a" strokeWidth="0.6" />
          <line x1={x + 2 + jitter2} y1={y - 4} x2={x + 2 + jitter2} y2={y - 7} stroke="#6a8a3a" strokeWidth="0.6" />
        </g>
      );
    case 'marsh':
      return (
        <g pointerEvents="none" className="tkm-hex-wave">
          {/* Murky water base */}
          <ellipse cx={x} cy={y + 2} rx="11" ry="6" fill="#3a4a3a" opacity="0.9" />
          {/* Moss/reed clumps */}
          <ellipse cx={x - 6 + jitter} cy={y - 1} rx="3" ry="1.2" fill="#5a6838" opacity="0.85" />
          <ellipse cx={x + 5 + jitter2} cy={y + 1} rx="2.5" ry="1" fill="#4a5828" opacity="0.85" />
          {/* Cattail reeds poking up */}
          <line x1={x - 4 + jitter} y1={y + 3} x2={x - 4 + jitter} y2={y - 4} stroke="#7a6238" strokeWidth="0.6" />
          <circle cx={x - 4 + jitter} cy={y - 4} r="0.8" fill="#364654" />
          <line x1={x + 3 + jitter2} y1={y + 3} x2={x + 3 + jitter2} y2={y - 3} stroke="#7a6238" strokeWidth="0.6" />
          <circle cx={x + 3 + jitter2} cy={y - 3} r="0.7" fill="#364654" />
          {/* Bubbles */}
          <circle cx={x + 7} cy={y + 5} r="0.6" fill="#8a9870" opacity="0.6" className="tkm-glint" />
        </g>
      );
    case 'chokepoint':
      return (
        <g pointerEvents="none">
          {/* Twin cliff walls left and right with a narrow defile in the middle */}
          <path d={`M ${x - 13} ${y - 8} L ${x - 7} ${y - 8} L ${x - 5} ${y + 8} L ${x - 13} ${y + 8} Z`}
            fill="#1e2832" stroke="#1a1208" strokeWidth="0.4" />
          <path d={`M ${x + 7} ${y - 8} L ${x + 13} ${y - 8} L ${x + 13} ${y + 8} L ${x + 5} ${y + 8} Z`}
            fill="#1e2832" stroke="#1a1208" strokeWidth="0.4" />
          {/* Highlight on cliff faces */}
          <line x1={x - 7} y1={y - 8} x2={x - 5} y2={y + 8} stroke="#6a5238" strokeWidth="0.5" opacity="0.7" />
          <line x1={x + 7} y1={y - 8} x2={x + 5} y2={y + 8} stroke="#6a5238" strokeWidth="0.5" opacity="0.7" />
          {/* Path stones in the defile */}
          <ellipse cx={x} cy={y - 2} rx="2" ry="0.8" fill="#8a7560" opacity="0.7" />
          <ellipse cx={x} cy={y + 2} rx="2" ry="0.8" fill="#8a7560" opacity="0.7" />
        </g>
      );
    case 'bridge':
      return (
        <g pointerEvents="none">
          {/* Water underneath */}
          <ellipse cx={x} cy={y + 2} rx="10" ry="3" fill="#2c5882" opacity="0.7" />
          {/* Bridge deck */}
          <rect x={x - 12} y={y - 3} width="24" height="6" fill="#6a4a28" stroke="#1e2832" strokeWidth="0.5" rx="0.8" />
          {/* Plank lines */}
          <line x1={x - 8} y1={y - 3} x2={x - 8} y2={y + 3} stroke="#1e2832" strokeWidth="0.4" />
          <line x1={x - 4} y1={y - 3} x2={x - 4} y2={y + 3} stroke="#1e2832" strokeWidth="0.4" />
          <line x1={x} y1={y - 3} x2={x} y2={y + 3} stroke="#1e2832" strokeWidth="0.4" />
          <line x1={x + 4} y1={y - 3} x2={x + 4} y2={y + 3} stroke="#1e2832" strokeWidth="0.4" />
          <line x1={x + 8} y1={y - 3} x2={x + 8} y2={y + 3} stroke="#1e2832" strokeWidth="0.4" />
          {/* Rope railings */}
          <line x1={x - 12} y1={y - 4.5} x2={x + 12} y2={y - 4.5} stroke="#1e2832" strokeWidth="0.6" />
          <line x1={x - 12} y1={y + 4.5} x2={x + 12} y2={y + 4.5} stroke="#1e2832" strokeWidth="0.6" />
        </g>
      );
    case 'gate':
      return (
        <g pointerEvents="none">
          {/* Stone wall background */}
          <rect x={x - 12} y={y - 9} width="24" height="18" fill="#364654" stroke="#1a1208" strokeWidth="0.6" />
          {/* Crenellated battlement top */}
          <rect x={x - 12} y={y - 11} width="3" height="3" fill="#364654" />
          <rect x={x - 6}  y={y - 11} width="3" height="3" fill="#364654" />
          <rect x={x}      y={y - 11} width="3" height="3" fill="#364654" />
          <rect x={x + 6}  y={y - 11} width="3" height="3" fill="#364654" />
          {/* Gate arch (dark recess) */}
          <path d={`M ${x - 5} ${y + 9} L ${x - 5} ${y - 3} Q ${x} ${y - 8} ${x + 5} ${y - 3} L ${x + 5} ${y + 9} Z`}
            fill="#1a1208" />
          {/* Iron gate bars */}
          <line x1={x - 3} y1={y - 4} x2={x - 3} y2={y + 8} stroke="#1e2832" strokeWidth="0.5" />
          <line x1={x}     y1={y - 5} x2={x}     y2={y + 8} stroke="#1e2832" strokeWidth="0.5" />
          <line x1={x + 3} y1={y - 4} x2={x + 3} y2={y + 8} stroke="#1e2832" strokeWidth="0.5" />
        </g>
      );
    case 'watchtower':
      return (
        <g pointerEvents="none">
          {/* Base platform */}
          <rect x={x - 8} y={y + 4} width="16" height="4" fill="#364654" stroke="#1a1208" strokeWidth="0.4" />
          {/* Tower body */}
          <rect x={x - 5} y={y - 6} width="10" height="10" fill="#7a6238" stroke="#1a1208" strokeWidth="0.4" />
          {/* Window slits */}
          <rect x={x - 3} y={y - 3} width="1.5" height="3" fill="#1a1208" />
          <rect x={x + 1.5} y={y - 3} width="1.5" height="3" fill="#1a1208" />
          {/* Tower roof */}
          <path d={`M ${x - 7} ${y - 6} L ${x} ${y - 12} L ${x + 7} ${y - 6} Z`}
            fill="#5a3520" stroke="#1a1208" strokeWidth="0.4" />
          {/* Flag pole + flag */}
          <line x1={x} y1={y - 12} x2={x} y2={y - 16} stroke="#1e2832" strokeWidth="0.5" />
          <path d={`M ${x} ${y - 16} L ${x + 4} ${y - 15} L ${x} ${y - 13} Z`} fill="#e6c473" className="tkm-flag-ripple" />
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
            <circle cx={x - 3 + jitter} cy={y + 6} r="0.8" fill="#7a8893" opacity="0.6" />
          )}
          {jitter2 < 0 && (
            <ellipse cx={x + 7 + jitter2} cy={y + 7} rx="1.2" ry="0.6" fill="#7a8893" opacity="0.5" />
          )}
        </g>
      );
  }
}
