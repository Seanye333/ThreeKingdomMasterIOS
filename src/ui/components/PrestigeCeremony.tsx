import { useEffect, type CSSProperties } from 'react';
import type { Officer } from '../../game/types';
import { prestigeTitleById, type PrestigePath } from '../../game/data/prestige';
import { OfficerPortrait } from './OfficerPortrait';
import { useLanguage } from '../i18n';

interface Props {
  officer: Officer;
  titleId: string;
  /** Player force color, for accents. */
  color: string;
  year: number;
  onDone: () => void;
}

const PATH_COLOR: Record<PrestigePath, string> = {
  military: '#c0504a',
  strategist: '#5a8ac0',
  official: '#6aa84f',
  merchant: '#e6c473',
};

const MOTES = Array.from({ length: 12 }, (_, i) => i);

/**
 * 封號 — a brief flourish when a player officer rises to a top-tier 威名 title.
 * The officer's portrait rises into golden light, a path-colored title plaque
 * unfurls with the calligraphy, and motes drift up. Auto-dismisses after ~2.6s
 * (or on click); honours prefers-reduced-motion.
 */
export function PrestigeCeremony({ officer, titleId, color, year, onDone }: Props) {
  const lang = useLanguage();
  const title = prestigeTitleById(titleId);
  const reduced = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const accent = title ? PATH_COLOR[title.path] : color;

  useEffect(() => {
    const id = setTimeout(onDone, reduced ? 1200 : 2600);
    return () => clearTimeout(id);
  }, [onDone, reduced]);

  if (!title) return null;
  const anim = (s: string): CSSProperties => (reduced ? {} : { animation: s });

  return (
    <div
      onClick={onDone}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000, cursor: 'pointer',
        display: 'grid', placeItems: 'center',
        background: 'radial-gradient(ellipse at center, rgba(30,20,8,0.55), rgba(0,0,0,0.88))',
        ...anim('tkmCeremonyBackdrop 0.4s ease-out'),
      }}
    >
      {!reduced && (
        <div
          style={{
            position: 'absolute', left: '50%', top: '44%', width: 560, height: 560,
            background: `repeating-conic-gradient(from 0deg, ${hexA(accent, 0)} 0deg, ${hexA(accent, 0.5)} 6deg, ${hexA(accent, 0)} 12deg)`,
            borderRadius: '50%', pointerEvents: 'none',
            maskImage: 'radial-gradient(circle, #000 0%, transparent 62%)',
            WebkitMaskImage: 'radial-gradient(circle, #000 0%, transparent 62%)',
            animation: 'tkmRaySpin 16s linear infinite, tkmRayPulse 2.6s ease-in-out infinite',
          }}
        />
      )}

      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.1rem' }}>
        <div style={{ fontSize: '0.8rem', letterSpacing: '0.5rem', color: '#aab6c0', ...anim('tkmCeremonyBackdrop 0.5s ease-out 0.2s both') }}>威名 · PRESTIGE</div>

        {/* Portrait rising into the light */}
        <div style={{ borderRadius: '50%', border: `3px solid ${accent}`, boxShadow: `0 0 32px ${hexA(accent, 0.8)}`, ...anim('tkmPortraitRise 0.8s cubic-bezier(0.2,0.9,0.3,1) both') }}>
          <OfficerPortrait officer={officer} size={132} forceColor={color} year={year} />
        </div>
        <div style={{ fontSize: '1.15rem', color: '#eef4f8', fontFamily: 'var(--tkm-font-body)', textShadow: '0 1px 4px rgba(0,0,0,0.7)' }}>
          {lang === 'en' ? officer.name.en : officer.name.zh}
        </div>

        {/* Title plaque unfurling */}
        <div
          style={{
            position: 'relative', padding: '0.5rem 2.2rem',
            background: `linear-gradient(160deg, ${hexA(accent, 0.95)}, ${hexA(accent, 0.55)})`,
            border: '3px solid #eef4f8', borderRadius: 6,
            boxShadow: `0 0 26px ${hexA(accent, 0.7)}, inset 0 0 14px rgba(0,0,0,0.3)`,
            ...anim('tkmBannerUnfurl 0.7s cubic-bezier(0.2,1.1,0.3,1) 0.4s both'),
          }}
        >
          <span style={{ fontSize: '2.4rem', color: '#fff8e6', fontFamily: 'var(--tkm-font-body)', fontWeight: 'bold', letterSpacing: '0.1rem', textShadow: '0 2px 5px rgba(0,0,0,0.5)' }}>
            {title.name.zh}
          </span>
        </div>
        {lang !== 'zh' && (
          <div style={{ fontSize: '1rem', color: '#aab6c0', fontStyle: 'italic', letterSpacing: '0.07rem', ...anim('tkmCalligraphyReveal 0.9s ease-out 0.7s both') }}>
            {title.name.en}
          </div>
        )}

        {/* Motes */}
        {!reduced && MOTES.map((i) => (
          <span
            key={i}
            style={{
              position: 'absolute', left: `calc(50% + ${(i - 6) * 9}px)`, bottom: '18%',
              width: 4 + (i % 3), height: 4 + (i % 3), borderRadius: '50%',
              background: i % 2 ? '#eef4f8' : accent, pointerEvents: 'none',
              animation: `tkmMoteFloat ${2 + (i % 4) * 0.4}s ease-out ${0.7 + (i % 5) * 0.18}s infinite`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

function hexA(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  if (h.length < 6) return `rgba(212,168,74,${alpha})`;
  const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}
