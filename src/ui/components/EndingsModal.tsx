import { useEffect, useMemo, useState } from 'react';
import { useEscapeKey } from '../hooks/useEscapeKey';
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
  // 結局 key-art — drop public/endings/<kind>.jpg to light up a painterly hero;
  // if it's absent (or 404s) we fall back to the procedural ink vignette below.
  const [imgFailed, setImgFailed] = useState(false);
  if (!imgFailed) {
    return (
      <img
        src={`${import.meta.env.BASE_URL}endings/${kind}.jpg`}
        alt=""
        onError={() => setImgFailed(true)}
        style={{ width: '100%', aspectRatio: '16 / 9', objectFit: 'cover', display: 'block', borderRadius: 4 }}
      />
    );
  }
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height="180" style={{ display: 'block' }}>
      <defs>
        <linearGradient id="ink-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e6c473" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#10161e" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect width={w} height={h} fill="url(#ink-sky)" />

      {kind === 'unify' && (
        <g stroke="#e6c473" strokeWidth="1.4" fill="none" opacity="0.85">
          {/* Mountain ranges */}
          <path d="M 0 140 L 60 100 L 90 130 L 160 80 L 200 130 L 260 90 L 320 130 L 380 95 L 440 130 L 520 105 L 520 180 L 0 180 Z" fill="#26323e" stroke="#e6c473" strokeWidth="1" />
          {/* Sun */}
          <circle cx="370" cy="60" r="22" fill="#e6c473" opacity="0.85" />
          {/* Banner pole */}
          <line x1="100" y1="80" x2="100" y2="160" />
          <path d="M 100 80 L 145 84 L 138 96 L 100 95 Z" fill="#b8442e" />
        </g>
      )}

      {kind === 'restore-han' && (
        <g>
          {/* Palace silhouette */}
          <path d="M 80 160 L 80 100 L 100 90 L 140 90 L 160 100 L 160 60 L 200 50 L 240 60 L 240 100 L 260 90 L 300 90 L 320 100 L 320 160 Z" fill="#26323e" stroke="#e6c473" strokeWidth="1.2" />
          <path d="M 200 50 L 200 30 M 188 38 L 212 38" stroke="#e6c473" strokeWidth="1.5" />
          {/* Han banner */}
          <text x="380" y="80" fill="#e6c473" fontSize="40" fontFamily="Songti SC, serif" fontWeight="bold" opacity="0.7">漢</text>
        </g>
      )}

      {kind === 'tripartite' && (
        <g stroke="#e6c473" strokeWidth="1.2" fill="none">
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
          <path d="M 240 130 L 270 110 L 300 130 L 300 150 L 240 150 Z" fill="#26323e" stroke="#e6c473" />
          {/* Crane */}
          <path d="M 400 60 Q 410 50 420 60 Q 415 70 410 65 Q 405 70 400 60 Z" fill="#e6edf3" />
        </g>
      )}

      {kind === 'emperor' && (
        <g>
          {/* Dragon throne */}
          <rect x="180" y="80" width="160" height="80" fill="#26323e" stroke="#e6c473" strokeWidth="1.5" />
          <rect x="195" y="60" width="130" height="30" fill="#b8442e" stroke="#e6c473" />
          <text x="260" y="82" fill="#e6c473" fontSize="20" textAnchor="middle" fontFamily="Songti SC, serif">帝</text>
          {/* Sun behind */}
          <circle cx="260" cy="40" r="20" fill="#e6c473" opacity="0.6" />
          {/* Banner */}
          <line x1="60" y1="40" x2="60" y2="160" stroke="#e6c473" strokeWidth="1.5" />
          <line x1="460" y1="40" x2="460" y2="160" stroke="#e6c473" strokeWidth="1.5" />
        </g>
      )}

      {kind === 'defeat' && (
        <g>
          {/* Broken banner */}
          <path d="M 200 40 L 200 130 M 200 40 L 280 50 L 270 70 L 200 65 Z" fill="#5a2025" stroke="#b8442e" strokeWidth="1" />
          <line x1="195" y1="110" x2="225" y2="140" stroke="#26323e" strokeWidth="2" />
          {/* Fallen helm */}
          <ellipse cx="320" cy="155" rx="18" ry="8" fill="#26323e" stroke="#364654" />
          <path d="M 304 155 Q 320 140 336 155" fill="none" stroke="#364654" strokeWidth="1" />
        </g>
      )}

      {kind === 'hegemon' && (
        <g>
          {/* The seized capital — a battlemented wall with a gate */}
          <path d="M 150 160 L 150 120 L 162 120 L 162 112 L 182 112 L 182 120 L 210 120 L 210 108 L 232 108 L 232 120 L 260 120 L 260 112 L 280 112 L 280 120 L 292 120 L 292 160 Z" fill="#26323e" stroke="#e6c473" strokeWidth="1.2" />
          <path d="M 210 160 L 210 138 a 11 11 0 0 1 22 0 L 232 160 Z" fill="#1a1208" stroke="#e6c473" strokeWidth="0.8" />
          {/* Three capitals' banners, now flying one colour */}
          <g stroke="#e6c473" strokeWidth="1.4">
            <line x1="176" y1="112" x2="176" y2="84" /><path d="M 176 84 L 200 88 L 194 96 L 176 95 Z" fill="#b8442e" />
            <line x1="221" y1="108" x2="221" y2="74" /><path d="M 221 74 L 247 78 L 240 87 L 221 86 Z" fill="#b8442e" />
            <line x1="266" y1="112" x2="266" y2="84" /><path d="M 266 84 L 290 88 L 284 96 L 266 95 Z" fill="#b8442e" />
          </g>
          {/* A great sword planted before the gate — the Mandate by the blade */}
          <g stroke="#e6c473" strokeWidth="2.2" strokeLinecap="round" fill="none">
            <line x1="360" y1="72" x2="360" y2="158" />
            <line x1="346" y1="92" x2="374" y2="92" />
          </g>
          <circle cx="360" cy="74" r="3.4" fill="#e6c473" />
        </g>
      )}

      {kind === 'unify-tyrant' && (
        <g>
          {/* Dark mountains under a stark red sun */}
          <path d="M 0 150 L 70 105 L 110 135 L 180 90 L 230 130 L 300 95 L 370 130 L 440 100 L 520 130 L 520 180 L 0 180 Z" fill="#2a2228" stroke="#b8442e" strokeWidth="1" />
          <circle cx="372" cy="60" r="20" fill="#b8442e" opacity="0.85" />
          {/* One dominant banner */}
          <line x1="150" y1="58" x2="150" y2="160" stroke="#e6c473" strokeWidth="1.6" />
          <path d="M 150 58 L 202 64 L 193 79 L 150 77 Z" fill="#b8442e" stroke="#e6c473" strokeWidth="0.6" />
          {/* A palisade of spears — the realm held at the point of the blade */}
          <g stroke="#e6c473" strokeWidth="1.4" strokeLinecap="round" fill="#e6c473">
            <line x1="92" y1="160" x2="92" y2="120" /><path d="M 92 120 L 88 111 L 96 111 Z" stroke="none" />
            <line x1="116" y1="160" x2="116" y2="115" /><path d="M 116 115 L 112 106 L 120 106 Z" stroke="none" />
            <line x1="186" y1="160" x2="186" y2="115" /><path d="M 186 115 L 182 106 L 190 106 Z" stroke="none" />
            <line x1="210" y1="160" x2="210" y2="120" /><path d="M 210 120 L 206 111 L 214 111 Z" stroke="none" />
          </g>
        </g>
      )}

      {kind === 'endured' && (
        <g>
          {/* Quiet hills under a low, ageing sun */}
          <path d="M 0 155 L 90 120 L 160 145 L 250 110 L 340 145 L 430 120 L 520 150 L 520 180 L 0 180 Z" fill="#26323e" stroke="#e6c473" strokeWidth="0.8" />
          <circle cx="250" cy="42" r="16" fill="#e6c473" opacity="0.55" />
          {/* Banners of the fallen, lying broken */}
          <g stroke="#5a4a38" strokeWidth="2" strokeLinecap="round">
            <line x1="78" y1="150" x2="122" y2="159" />
            <line x1="378" y1="148" x2="422" y2="159" />
            <line x1="300" y1="156" x2="342" y2="150" />
          </g>
          <path d="M 122 159 L 144 150 L 141 159 Z" fill="#3a2a2a" opacity="0.7" />
          <path d="M 378 148 L 356 142 L 360 150 Z" fill="#3a2a2a" opacity="0.7" />
          {/* One banner still standing tall through the years */}
          <line x1="250" y1="60" x2="250" y2="150" stroke="#e6c473" strokeWidth="2" />
          <path d="M 250 60 L 298 66 L 289 81 L 250 79 Z" fill="#b8442e" stroke="#e6c473" strokeWidth="0.6" />
        </g>
      )}
    </svg>
  );
}

interface Props {
  onClose: () => void;
}

export function EndingsModal({ onClose }: Props) {
  useEscapeKey(onClose);
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
          background: 'linear-gradient(160deg,#1b2531 0%,#10161e 100%)',
          border: '2px solid #e6c473',
          width: 'min(640px,100%)',
          padding: '2.5rem',
          color: '#e6edf3',
          fontFamily: 'var(--tkm-font-body)',
          boxShadow: '0 0 60px rgba(212,168,74,0.4)',
        }}
      >
        <EndingArtwork kind={ending.kind} />
        <div
          style={{
            fontSize: '2.5rem',
            color: '#e6c473',
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
              color: '#aab6c0',
              textAlign: 'center',
              fontStyle: 'italic',
              marginTop: '0.5rem',
              letterSpacing: '0.1rem',
            }}
          >
            {ending.titleEn}
          </div>
        )}
        <hr
          style={{
            border: 'none',
            height: '1px',
            background: 'linear-gradient(90deg, transparent, #e6c473, transparent)',
            margin: '1.5rem 0',
          }}
        />
        {lang !== 'en' && (
          <p
            style={{
              fontSize: '1rem',
              lineHeight: 1.8,
              color: '#e6c473',
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
              color: '#aab6c0',
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
              background: 'linear-gradient(180deg, #364654, #26323e)',
              border: '1px solid #e6c473',
              color: '#e6c473',
              padding: '0.6rem 2rem',
              fontFamily: 'inherit',
              letterSpacing: '0.1rem',
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
