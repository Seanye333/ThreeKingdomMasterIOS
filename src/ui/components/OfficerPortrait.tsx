import { useState } from 'react';
import type { Officer } from '../../game/types';
import { useLanguage, pickName } from '../i18n';

/**
 * Stylized SVG portrait silhouettes for officers.
 *
 * Eight archetypes auto-derived from stats + age + female flag.
 * Each portrait uses the officer's force color as the helmet/hair accent
 * so two same-archetype officers from different forces still read as distinct.
 */

export type Archetype =
  | 'general'     // 猛將 — war ≥ 85
  | 'strategist'  // 軍師 — int ≥ 88 + war < 70
  | 'official'    // 文官 — pol ≥ 80 + war < 65
  | 'ruler'       // 君主 — charisma ≥ 88 (auto-promoted if also leadership ≥ 80)
  | 'female'      // 才女 / 烈女
  | 'tribal'      // 異族 — non-han ethnicity (heuristic: certain id prefixes)
  | 'elder'       // 老臣 — age ≥ 60
  | 'youth';      // 少年 — age ≤ 25

export function deriveArchetype(o: Officer, currentYear?: number): Archetype {
  if (o.female) return 'female';

  // Tribal heuristic — name prefixes / known IDs.
  const TRIBAL_IDS = /^(wutugu|mulu-da|jin-huan|dong-tu-na|zhurong|ahui-nan|meng-huo|meng-yong|meng-jie|sha-mo-ke|ke-bi-neng|tadun)/;
  if (TRIBAL_IDS.test(o.id)) return 'tribal';

  if (currentYear !== undefined) {
    const age = currentYear - o.birthYear;
    if (age <= 22 && o.birthYear > 0) return 'youth';
    if (age >= 62 && o.birthYear > 0) return 'elder';
  }

  const { war, intelligence, politics, charisma, leadership } = o.stats;
  if (charisma >= 88 && leadership >= 80) return 'ruler';
  if (war >= 85) return 'general';
  if (intelligence >= 88 && war < 70) return 'strategist';
  if (politics >= 80 && war < 65) return 'official';
  if (war >= 70) return 'general';
  return 'official';
}

const ARCH_LABEL: Record<Archetype, string> = {
  general:    '猛將',
  strategist: '軍師',
  official:   '文官',
  ruler:      '君主',
  female:     '才女',
  tribal:     '異族',
  elder:      '老臣',
  youth:      '少年',
};
const ARCH_LABEL_EN: Record<Archetype, string> = {
  general:    'Warrior',
  strategist: 'Strategist',
  official:   'Official',
  ruler:      'Ruler',
  female:     'Lady',
  tribal:     'Tribal',
  elder:      'Elder',
  youth:      'Youth',
};

interface PortraitProps {
  officer: Officer;
  size?: number;
  forceColor?: string;
  /** Year to compute age (for elder/youth detection). Optional. */
  year?: number;
  /** Faction tag — colors the border (wei/shu/wu/warlord). Optional. */
  faction?: 'wei' | 'shu' | 'wu' | 'warlord';
}

// Officer ids whose portrait image 404'd this session — skip re-requesting so we
// don't re-fire a failing GET for every list cell.
const missingPortraits = new Set<string>();

export function OfficerPortrait({
  officer,
  size = 48,
  forceColor,
  year,
  faction,
}: PortraitProps) {
  const lang = useLanguage();
  const arch = deriveArchetype(officer, year);
  const accent = forceColor ?? '#e6c473';
  const factionAttr: Record<string, boolean> = {};
  if (faction) factionAttr[`data-faction-${faction}`] = true;

  // Prefer a hand-drawn portrait at public/portraits/<id>.webp if present; fall
  // back to the procedural SVG silhouette when there is no image for this id.
  const [imgFailed, setImgFailed] = useState(() => missingPortraits.has(officer.id));
  const src = `${import.meta.env.BASE_URL}portraits/${officer.id}.webp`;

  return (
    <div
      className="tkm-portrait"
      style={{ width: size, height: size, ...(forceColor ? { borderColor: forceColor } : null) }}
      title={`${pickName(officer.name, lang)} · ${(lang === 'en' ? ARCH_LABEL_EN : ARCH_LABEL)[arch]}`}
      {...factionAttr}
    >
      {imgFailed ? (
        <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
          <ArchetypeSilhouette arch={arch} accent={accent} />
        </svg>
      ) : (
        <img
          src={src}
          alt={pickName(officer.name, lang)}
          width={size}
          height={size}
          loading="lazy"
          onError={() => { missingPortraits.add(officer.id); setImgFailed(true); }}
          style={{ width: size, height: size, objectFit: 'cover', display: 'block' }}
        />
      )}
    </div>
  );
}

function ArchetypeSilhouette({ arch, accent }: { arch: Archetype; accent: string }) {
  const skin = '#c9a878';
  const robe = '#2d2218';
  const robeLight = '#3d2f22';

  switch (arch) {
    case 'general': // 猛將 — wide-shouldered with horned helmet
      return (
        <g>
          <rect width="64" height="64" fill={robe} opacity="0.4" />
          {/* shoulders */}
          <path d="M6,64 Q6,46 18,42 L46,42 Q58,46 58,64 Z" fill={robeLight} />
          {/* armor plate */}
          <path d="M22,42 L42,42 L40,60 L24,60 Z" fill={accent} opacity="0.6" />
          {/* neck */}
          <rect x="28" y="36" width="8" height="8" fill={skin} />
          {/* head */}
          <circle cx="32" cy="28" r="11" fill={skin} />
          {/* helmet base */}
          <path d="M19,28 Q19,15 32,13 Q45,15 45,28 Z" fill={accent} />
          {/* helmet horn left/right */}
          <path d="M19,24 L13,16 L17,22 Z" fill={accent} />
          <path d="M45,24 L51,16 L47,22 Z" fill={accent} />
          {/* eyes */}
          <rect x="25" y="27" width="3" height="2" fill="#10161e" />
          <rect x="36" y="27" width="3" height="2" fill="#10161e" />
          {/* beard */}
          <path d="M27,33 Q32,40 37,33 L37,36 Q32,42 27,36 Z" fill="#10161e" opacity="0.7" />
        </g>
      );

    case 'strategist': // 軍師 — long-faced, scholar's cap with tassel
      return (
        <g>
          <rect width="64" height="64" fill={robe} opacity="0.4" />
          {/* robe */}
          <path d="M10,64 Q10,46 20,42 L44,42 Q54,46 54,64 Z" fill={robeLight} />
          {/* fan in hand */}
          <path d="M44,46 L52,40 L54,42 L46,48 Z" fill={accent} opacity="0.5" />
          {/* neck */}
          <rect x="28" y="35" width="8" height="9" fill={skin} />
          {/* face — slightly longer */}
          <ellipse cx="32" cy="26" rx="10" ry="12" fill={skin} />
          {/* scholar's cap (futou) */}
          <path d="M20,20 Q20,10 32,9 Q44,10 44,20 L40,18 L24,18 Z" fill="#10161e" />
          {/* cap tassel */}
          <line x1="44" y1="14" x2="50" y2="20" stroke={accent} strokeWidth="1.5" />
          <circle cx="50" cy="20" r="1.5" fill={accent} />
          {/* eyes — narrow, contemplative */}
          <line x1="25" y1="28" x2="29" y2="28" stroke="#10161e" strokeWidth="1.4" />
          <line x1="35" y1="28" x2="39" y2="28" stroke="#10161e" strokeWidth="1.4" />
          {/* thin moustache */}
          <line x1="28" y1="33" x2="36" y2="33" stroke="#10161e" strokeWidth="0.8" />
        </g>
      );

    case 'official': // 文官 — broad cap, plump face
      return (
        <g>
          <rect width="64" height="64" fill={robe} opacity="0.4" />
          <path d="M10,64 Q10,46 20,42 L44,42 Q54,46 54,64 Z" fill={robeLight} />
          {/* sash */}
          <rect x="30" y="42" width="4" height="22" fill={accent} opacity="0.7" />
          <rect x="28" y="35" width="8" height="9" fill={skin} />
          <circle cx="32" cy="27" r="11" fill={skin} />
          {/* wide official's cap with wings */}
          <path d="M18,22 Q18,12 32,10 Q46,12 46,22 L42,20 L22,20 Z" fill="#10161e" />
          <rect x="10" y="19" width="10" height="3" fill="#10161e" />
          <rect x="44" y="19" width="10" height="3" fill="#10161e" />
          {/* eyes — composed */}
          <rect x="25" y="27" width="3" height="2" fill="#10161e" />
          <rect x="36" y="27" width="3" height="2" fill="#10161e" />
          {/* small thin beard */}
          <path d="M28,33 L30,38 L34,38 L36,33" fill="none" stroke="#10161e" strokeWidth="1" />
        </g>
      );

    case 'ruler': // 君主 — imperial crown with bead curtains
      return (
        <g>
          <rect width="64" height="64" fill={robe} opacity="0.4" />
          <path d="M8,64 Q8,46 20,42 L44,42 Q56,46 56,64 Z" fill={robeLight} />
          {/* embroidered front */}
          <path d="M24,42 L40,42 L36,60 L28,60 Z" fill={accent} opacity="0.6" />
          <circle cx="32" cy="50" r="3" fill={accent} />
          <rect x="28" y="35" width="8" height="9" fill={skin} />
          <circle cx="32" cy="27" r="11" fill={skin} />
          {/* imperial mortarboard cap */}
          <rect x="16" y="14" width="32" height="5" fill="#10161e" />
          <path d="M19,19 Q19,11 32,9 Q45,11 45,19 Z" fill="#10161e" />
          {/* hanging bead strings */}
          <line x1="20" y1="19" x2="20" y2="24" stroke={accent} strokeWidth="1" />
          <circle cx="20" cy="24" r="1.5" fill={accent} />
          <line x1="44" y1="19" x2="44" y2="24" stroke={accent} strokeWidth="1" />
          <circle cx="44" cy="24" r="1.5" fill={accent} />
          {/* eyes */}
          <rect x="25" y="27" width="3" height="2" fill="#10161e" />
          <rect x="36" y="27" width="3" height="2" fill="#10161e" />
          {/* dignified beard */}
          <path d="M26,33 Q32,42 38,33 L36,40 L28,40 Z" fill="#10161e" opacity="0.85" />
        </g>
      );

    case 'female': // 才女 — two side buns, hairpin, fine face
      return (
        <g>
          <rect width="64" height="64" fill={robe} opacity="0.4" />
          <path d="M10,64 Q10,46 22,42 L42,42 Q54,46 54,64 Z" fill={robeLight} />
          {/* flowing sleeve trim */}
          <path d="M10,52 Q14,46 22,46 L22,52 Z" fill={accent} opacity="0.5" />
          <path d="M54,52 Q50,46 42,46 L42,52 Z" fill={accent} opacity="0.5" />
          <rect x="28" y="36" width="8" height="8" fill={skin} />
          {/* oval face */}
          <ellipse cx="32" cy="26" rx="10" ry="11" fill={skin} />
          {/* hair */}
          <path d="M21,18 Q21,12 32,10 Q43,12 43,18 L43,26 L21,26 Z" fill="#10161e" />
          {/* side buns */}
          <circle cx="19" cy="22" r="4" fill="#10161e" />
          <circle cx="45" cy="22" r="4" fill="#10161e" />
          {/* hairpin */}
          <circle cx="32" cy="13" r="1.5" fill={accent} />
          <line x1="32" y1="13" x2="38" y2="9" stroke={accent} strokeWidth="0.8" />
          {/* eyes — wider, delicate */}
          <ellipse cx="27" cy="27" rx="1.5" ry="1" fill="#10161e" />
          <ellipse cx="37" cy="27" rx="1.5" ry="1" fill="#10161e" />
          {/* lips */}
          <path d="M30,32 Q32,34 34,32" stroke="#8a3c2e" strokeWidth="1" fill="none" />
        </g>
      );

    case 'tribal': // 異族 — feather headdress, fierce face
      return (
        <g>
          <rect width="64" height="64" fill={robe} opacity="0.4" />
          <path d="M8,64 Q8,46 18,42 L46,42 Q58,46 58,64 Z" fill="#5a3a22" />
          {/* fur shoulder pads */}
          <ellipse cx="14" cy="44" rx="6" ry="3" fill="#1e2832" />
          <ellipse cx="50" cy="44" rx="6" ry="3" fill="#1e2832" />
          <rect x="28" y="35" width="8" height="9" fill={skin} />
          <circle cx="32" cy="27" r="11" fill={skin} />
          {/* feather headdress — three feathers */}
          <path d="M22,16 L18,4 L24,12 Z" fill={accent} />
          <path d="M30,12 L32,2 L34,12 Z" fill={accent} />
          <path d="M42,16 L46,4 L40,12 Z" fill={accent} />
          {/* headband */}
          <rect x="20" y="20" width="24" height="3" fill="#1e2832" />
          {/* eyes — fierce */}
          <rect x="24" y="27" width="4" height="2" fill="#10161e" />
          <rect x="36" y="27" width="4" height="2" fill="#10161e" />
          {/* warpaint stripes on cheeks */}
          <rect x="22" y="31" width="6" height="1.5" fill="#b8442e" opacity="0.6" />
          <rect x="36" y="31" width="6" height="1.5" fill="#b8442e" opacity="0.6" />
        </g>
      );

    case 'elder': // 老臣 — white beard, weathered
      return (
        <g>
          <rect width="64" height="64" fill={robe} opacity="0.4" />
          <path d="M10,64 Q10,46 20,42 L44,42 Q54,46 54,64 Z" fill={robeLight} />
          <rect x="28" y="32" width="8" height="9" fill={skin} />
          <circle cx="32" cy="27" r="11" fill={skin} />
          {/* cap */}
          <path d="M21,22 Q21,13 32,11 Q43,13 43,22 Z" fill="#10161e" />
          <rect x="30" y="11" width="4" height="3" fill={accent} />
          {/* eyes — squinted */}
          <line x1="25" y1="27" x2="29" y2="27" stroke="#10161e" strokeWidth="1.4" />
          <line x1="35" y1="27" x2="39" y2="27" stroke="#10161e" strokeWidth="1.4" />
          {/* long flowing white beard */}
          <path d="M24,32 Q32,38 40,32 L40,52 Q32,58 24,52 Z" fill="#e0d8c8" opacity="0.9" />
          <path d="M30,34 L34,34 L33,40 L31,40 Z" fill="#c4b8a0" />
          {/* eyebrow */}
          <line x1="24" y1="24" x2="29" y2="23" stroke="#e0d8c8" strokeWidth="1.5" />
          <line x1="35" y1="23" x2="40" y2="24" stroke="#e0d8c8" strokeWidth="1.5" />
        </g>
      );

    case 'youth': // 少年 — youthful, sword on belt, single topknot
      return (
        <g>
          <rect width="64" height="64" fill={robe} opacity="0.4" />
          <path d="M10,64 Q10,46 20,42 L44,42 Q54,46 54,64 Z" fill={robeLight} />
          {/* sash + small sword pommel */}
          <rect x="42" y="48" width="3" height="10" fill={accent} />
          <circle cx="43.5" cy="48" r="2" fill={accent} />
          <rect x="28" y="36" width="8" height="8" fill={skin} />
          <circle cx="32" cy="28" r="10" fill={skin} />
          {/* topknot */}
          <path d="M28,18 L30,8 L34,8 L36,18 Z" fill="#10161e" />
          <rect x="29" y="14" width="6" height="2" fill={accent} />
          {/* side hair */}
          <path d="M22,22 Q22,30 26,32 L26,22 Z" fill="#10161e" />
          <path d="M42,22 Q42,30 38,32 L38,22 Z" fill="#10161e" />
          {/* eyes — large, bright */}
          <circle cx="27" cy="28" r="1.5" fill="#10161e" />
          <circle cx="37" cy="28" r="1.5" fill="#10161e" />
          {/* small smile */}
          <path d="M29,33 Q32,35 35,33" stroke="#10161e" strokeWidth="0.8" fill="none" />
        </g>
      );
  }
}
