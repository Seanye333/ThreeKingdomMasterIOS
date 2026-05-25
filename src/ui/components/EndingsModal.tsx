import { useEffect, useMemo } from 'react';
import { useGameStore } from '../../game/state/store';
import { checkEndings } from '../../game/systems/endings';
import type { EndingKind } from '../../game/state/gameState';
import { useT, useLanguage } from '../i18n';

/**
 * Small SVG vignettes for each ending — water-ink style.
 */
function EndingArtwork({ kind }: { kind: EndingKind }) {
  const w = 520;
  const h = 180;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height="180" style={{ display: 'block' }}>
      <defs>
        <linearGradient id="ink-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#d4a84a" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#1a1410" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect width={w} height={h} fill="url(#ink-sky)" />

      {kind === 'unify' && (
        <g stroke="#d4a84a" strokeWidth="1.4" fill="none" opacity="0.85">
          {/* Mountain ranges */}
          <path d="M 0 140 L 60 100 L 90 130 L 160 80 L 200 130 L 260 90 L 320 130 L 380 95 L 440 130 L 520 105 L 520 180 L 0 180 Z" fill="#3a2d20" stroke="#d4a84a" strokeWidth="1" />
          {/* Sun */}
          <circle cx="370" cy="60" r="22" fill="#d4a84a" opacity="0.85" />
          {/* Banner pole */}
          <line x1="100" y1="80" x2="100" y2="160" />
          <path d="M 100 80 L 145 84 L 138 96 L 100 95 Z" fill="#b8442e" />
        </g>
      )}

      {kind === 'restore-han' && (
        <g>
          {/* Palace silhouette */}
          <path d="M 80 160 L 80 100 L 100 90 L 140 90 L 160 100 L 160 60 L 200 50 L 240 60 L 240 100 L 260 90 L 300 90 L 320 100 L 320 160 Z" fill="#3a2d20" stroke="#d4a84a" strokeWidth="1.2" />
          <path d="M 200 50 L 200 30 M 188 38 L 212 38" stroke="#d4a84a" strokeWidth="1.5" />
          {/* Han banner */}
          <text x="380" y="80" fill="#d4a84a" fontSize="40" fontFamily="Songti SC, serif" fontWeight="bold" opacity="0.7">漢</text>
        </g>
      )}

      {kind === 'tripartite' && (
        <g stroke="#d4a84a" strokeWidth="1.2" fill="none">
          {/* Three banners */}
          <g transform="translate(120, 60)">
            <line x1="0" y1="0" x2="0" y2="100" />
            <rect x="0" y="0" width="40" height="30" fill="#3a7dd9" opacity="0.8" />
            <text x="20" y="22" fill="#fff" fontSize="18" textAnchor="middle" fontFamily="Songti SC, serif">魏</text>
          </g>
          <g transform="translate(240, 60)">
            <line x1="0" y1="0" x2="0" y2="100" />
            <rect x="0" y="0" width="40" height="30" fill="#a85d8a" opacity="0.8" />
            <text x="20" y="22" fill="#fff" fontSize="18" textAnchor="middle" fontFamily="Songti SC, serif">蜀</text>
          </g>
          <g transform="translate(360, 60)">
            <line x1="0" y1="0" x2="0" y2="100" />
            <rect x="0" y="0" width="40" height="30" fill="#2f8e6f" opacity="0.8" />
            <text x="20" y="22" fill="#fff" fontSize="18" textAnchor="middle" fontFamily="Songti SC, serif">吳</text>
          </g>
        </g>
      )}

      {kind === 'recluse' && (
        <g>
          {/* Mountain hermit */}
          <path d="M 0 160 L 80 100 L 140 130 L 220 80 L 280 130 L 360 90 L 440 140 L 520 110 L 520 180 L 0 180 Z" fill="#2a3a2a" stroke="#6abf6a" strokeWidth="1" />
          {/* Hut */}
          <path d="M 240 130 L 270 110 L 300 130 L 300 150 L 240 150 Z" fill="#3a2d20" stroke="#d4a84a" />
          {/* Crane */}
          <path d="M 400 60 Q 410 50 420 60 Q 415 70 410 65 Q 405 70 400 60 Z" fill="#e8d9b0" />
        </g>
      )}

      {kind === 'emperor' && (
        <g>
          {/* Dragon throne */}
          <rect x="180" y="80" width="160" height="80" fill="#3a2d20" stroke="#d4a84a" strokeWidth="1.5" />
          <rect x="195" y="60" width="130" height="30" fill="#b8442e" stroke="#d4a84a" />
          <text x="260" y="82" fill="#d4a84a" fontSize="20" textAnchor="middle" fontFamily="Songti SC, serif">帝</text>
          {/* Sun behind */}
          <circle cx="260" cy="40" r="20" fill="#d4a84a" opacity="0.6" />
          {/* Banner */}
          <line x1="60" y1="40" x2="60" y2="160" stroke="#d4a84a" strokeWidth="1.5" />
          <line x1="460" y1="40" x2="460" y2="160" stroke="#d4a84a" strokeWidth="1.5" />
        </g>
      )}

      {kind === 'defeat' && (
        <g>
          {/* Broken banner */}
          <path d="M 200 40 L 200 130 M 200 40 L 280 50 L 270 70 L 200 65 Z" fill="#5a2025" stroke="#b8442e" strokeWidth="1" />
          <line x1="195" y1="110" x2="225" y2="140" stroke="#3a2d20" strokeWidth="2" />
          {/* Fallen helm */}
          <ellipse cx="320" cy="155" rx="18" ry="8" fill="#3a2d20" stroke="#5a4530" />
          <path d="M 304 155 Q 320 140 336 155" fill="none" stroke="#5a4530" strokeWidth="1" />
        </g>
      )}
    </svg>
  );
}

interface Props {
  onClose: () => void;
}

export function EndingsModal({ onClose }: Props) {
  const cities = useGameStore((s) => s.cities);
  const officers = useGameStore((s) => s.officers);
  const forces = useGameStore((s) => s.forces);
  const playerForceId = useGameStore((s) => s.playerForceId);
  const date = useGameStore((s) => s.date);
  const ending = useMemo(
    () => checkEndings({ cities, officers, forces, playerForceId, date }),
    [cities, officers, forces, playerForceId, date],
  );
  const t = useT();
  const lang = useLanguage();

  useEffect(() => {
    if (!ending || ending.kind === 'defeat') return;
  }, [ending]);

  if (!ending) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.92)',
        display: 'grid',
        placeItems: 'center',
        zIndex: 990,
        padding: '1rem',
      }}
    >
      <div
        style={{
          background: 'linear-gradient(160deg,#2a1f15 0%,#1a1410 100%)',
          border: '2px solid #d4a84a',
          width: 'min(640px,100%)',
          padding: '2.5rem',
          color: '#e8d9b0',
          fontFamily: '"Songti SC","Noto Serif SC",serif',
          boxShadow: '0 0 60px rgba(212,168,74,0.4)',
        }}
      >
        <EndingArtwork kind={ending.kind} />
        <div
          style={{
            fontSize: '2.5rem',
            color: '#d4a84a',
            textAlign: 'center',
            letterSpacing: '0.5rem',
            textShadow: '0 0 20px rgba(212,168,74,0.4)',
            marginTop: '1.5rem',
          }}
        >
          {lang === 'en' ? ending.titleEn : ending.titleZh}
        </div>
        {lang === 'both' && (
          <div
            style={{
              fontSize: '0.9rem',
              color: '#c0a878',
              textAlign: 'center',
              fontStyle: 'italic',
              marginTop: '0.5rem',
              letterSpacing: '0.3rem',
            }}
          >
            {ending.titleEn}
          </div>
        )}
        <hr
          style={{
            border: 'none',
            height: '1px',
            background: 'linear-gradient(90deg, transparent, #d4a84a, transparent)',
            margin: '1.5rem 0',
          }}
        />
        {lang !== 'en' && (
          <p
            style={{
              fontSize: '1rem',
              lineHeight: 1.8,
              color: '#d4a84a',
              textAlign: 'justify',
              margin: 0,
              marginBottom: '1rem',
            }}
          >
            {ending.textZh}
          </p>
        )}
        {lang !== 'zh' && (
          <p
            style={{
              fontSize: '0.88rem',
              lineHeight: 1.7,
              color: '#c0a878',
              fontStyle: 'italic',
              textAlign: 'justify',
              margin: 0,
            }}
          >
            {ending.textEn}
          </p>
        )}
        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <button
            onClick={onClose}
            style={{
              background: 'linear-gradient(180deg, #5a4530, #3a2d20)',
              border: '1px solid #d4a84a',
              color: '#d4a84a',
              padding: '0.6rem 2rem',
              fontFamily: 'inherit',
              letterSpacing: '0.3rem',
              cursor: 'pointer',
            }}
          >
            {t('續行', 'Continue')}
          </button>
        </div>
      </div>
    </div>
  );
}
