import type { Officer } from '../../game/types';

/**
 * Generative SVG portrait — a stylized silhouette that varies by the
 * officer's stat profile. Not a real portrait, but enough to give each
 * officer a unique visual fingerprint:
 *  - WAR-heavy   → warrior helm + thick brows
 *  - INT-heavy   → scholar cap + slim face
 *  - CHA-heavy   → noble crown + smile
 *  - POL-heavy   → court hat
 *  - LED-heavy   → general's helm
 *  Color tinted by force (via prop).
 */
export function OfficerAvatar({
  officer,
  size = 64,
  forceColor,
}: {
  officer: Officer;
  size?: number;
  forceColor?: string;
}) {
  const s = officer.stats;
  // Find dominant stat.
  const stats: Array<[keyof typeof s, number]> = [
    ['war', s.war],
    ['leadership', s.leadership],
    ['intelligence', s.intelligence],
    ['politics', s.politics],
    ['charisma', s.charisma],
  ];
  stats.sort((a, b) => b[1] - a[1]);
  const dom = stats[0][0];
  const accent = forceColor ?? '#364654';
  // Deterministic-ish skin tone variation by id hash.
  const idHash = officer.id.split('').reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 0);
  const skinShade = 0.85 + ((Math.abs(idHash) % 30) / 100); // 0.85–1.15
  const skin = adjustLightness('#d8b894', skinShade);
  const female = !!officer.female;
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" style={{ display: 'block' }}>
      <defs>
        <radialGradient id={`bg-${officer.id}`} cx="50%" cy="40%" r="65%">
          <stop offset="0%" stopColor="#1e2832" />
          <stop offset="100%" stopColor="#1a1208" />
        </radialGradient>
      </defs>
      <rect width="64" height="64" fill={`url(#bg-${officer.id})`} />
      {/* Shoulders / robe */}
      <path d="M 8 64 L 12 48 Q 32 42 52 48 L 56 64 Z" fill={accent} stroke="#1a1208" strokeWidth="0.5" />
      {/* Neck */}
      <rect x="28" y="38" width="8" height="8" fill={skin} />
      {/* Head */}
      <ellipse cx="32" cy="30" rx={female ? 10 : 11} ry="12" fill={skin} stroke="#1e2832" strokeWidth="0.5" />
      {/* Hair / hat (varies by dominant stat) */}
      {dom === 'war' && (
        // Warrior helm — peaked iron with cheek guards.
        <>
          <path d="M 20 26 Q 20 12 32 10 Q 44 12 44 26 L 44 22 Q 32 18 20 22 Z" fill="#1e2832" />
          <circle cx="32" cy="11" r="1.5" fill="#b8442e" />
          <path d="M 20 26 L 18 32 L 22 30 Z" fill="#1e2832" />
          <path d="M 44 26 L 46 32 L 42 30 Z" fill="#1e2832" />
        </>
      )}
      {dom === 'leadership' && (
        // General's helm — crested with a horsetail plume.
        <>
          <path d="M 20 28 Q 20 14 32 12 Q 44 14 44 28 L 44 22 Q 32 18 20 22 Z" fill="#364654" />
          <path d="M 30 12 L 32 4 L 34 12 Z" fill="#b8442e" />
          <path d="M 32 4 Q 36 2 38 6" fill="none" stroke="#1e2832" strokeWidth="1.2" />
        </>
      )}
      {dom === 'intelligence' && (
        // Scholar cap — square futou.
        <>
          <rect x="20" y="14" width="24" height="8" fill="#1a1208" rx="1" />
          <rect x="22" y="12" width="20" height="4" fill="#1e2832" rx="0.5" />
          <line x1="20" y1="22" x2="14" y2="18" stroke="#1a1208" strokeWidth="1" />
          <line x1="44" y1="22" x2="50" y2="18" stroke="#1a1208" strokeWidth="1" />
        </>
      )}
      {dom === 'politics' && (
        // Court hat — wide-brimmed with a wing.
        <>
          <ellipse cx="32" cy="18" rx="14" ry="3" fill="#1a1208" />
          <rect x="26" y="10" width="12" height="10" fill="#1e2832" rx="0.5" />
          <path d="M 38 14 Q 50 12 50 18" fill="none" stroke="#1a1208" strokeWidth="1.5" />
        </>
      )}
      {dom === 'charisma' && (
        // Noble crown — gold band with jade.
        <>
          <ellipse cx="32" cy="20" rx="11" ry="4" fill="#e6c473" />
          <rect x="21" y="14" width="22" height="6" fill="#e6c473" />
          <circle cx="32" cy="17" r="1.6" fill="#6a8a6a" />
          <circle cx="26" cy="17" r="1.2" fill="#b8442e" />
          <circle cx="38" cy="17" r="1.2" fill="#b8442e" />
        </>
      )}
      {/* Eyes */}
      <ellipse cx="27" cy="29" rx="1.4" ry={s.intelligence > 80 ? 0.8 : 1.4} fill="#1a1208" />
      <ellipse cx="37" cy="29" rx="1.4" ry={s.intelligence > 80 ? 0.8 : 1.4} fill="#1a1208" />
      {/* Brow thickness varies with WAR */}
      {s.war > 75 && (
        <>
          <path d={`M ${24} ${26} L ${30} ${25}`} stroke="#1a1208" strokeWidth="1.4" />
          <path d={`M ${34} ${25} L ${40} ${26}`} stroke="#1a1208" strokeWidth="1.4" />
        </>
      )}
      {/* Beard / mustache for high age + male */}
      {!female && officer.birthYear < 180 && (
        <path d="M 26 36 Q 32 40 38 36 Q 36 38 32 39 Q 28 38 26 36 Z" fill="#1e2832" opacity="0.85" />
      )}
      {/* Charisma smile */}
      {s.charisma > 75 && (
        <path d="M 28 34 Q 32 37 36 34" fill="none" stroke="#1a1208" strokeWidth="1" />
      )}
      {/* Force color shoulder badge */}
      {forceColor && (
        <circle cx="52" cy="56" r="3" fill={forceColor} stroke="#1a1208" strokeWidth="0.5" />
      )}
    </svg>
  );
}

function adjustLightness(hex: string, mul: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  return `#${[clamp(r * mul), clamp(g * mul), clamp(b * mul)].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}
