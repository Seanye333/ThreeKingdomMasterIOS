import { useEffect, type CSSProperties } from 'react';
import type { Officer } from '../../game/types';
import { gradeMeta, type OfficerGrade } from '../../game/systems/officerGrade';
import { OfficerPortrait } from './OfficerPortrait';
import { useLanguage } from '../i18n';

interface Props {
  officer: Officer;
  grade: OfficerGrade;
  /** Player force color, for accents. */
  color: string;
  year: number;
  onDone: () => void;
}

const MOTES = Array.from({ length: 12 }, (_, i) => i);

/**
 * 晉牌封賞 — a brief flourish when a player officer crosses into a 金牌+ 品階.
 * Mirrors the 封號 (PrestigeCeremony) flourish but plaqued in the new grade's
 * colour and rank (一流/超一流/神品). Auto-dismisses after ~2.6s or on click.
 */
export function PromotionCeremony({ officer, grade, color, year, onDone }: Props) {
  const lang = useLanguage();
  const meta = gradeMeta(grade);
  const accent = meta.color;
  const reduced = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    const id = setTimeout(onDone, reduced ? 1200 : 2600);
    return () => clearTimeout(id);
  }, [onDone, reduced]);

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
        <div style={{ fontSize: '0.8rem', letterSpacing: '0.5rem', color: '#aab6c0', ...anim('tkmCeremonyBackdrop 0.5s ease-out 0.2s both') }}>晉牌 · PROMOTION</div>

        <div style={{ borderRadius: '50%', border: `3px solid ${accent}`, boxShadow: `0 0 32px ${hexA(accent, 0.8)}`, ...anim('tkmPortraitRise 0.8s cubic-bezier(0.2,0.9,0.3,1) both') }}>
          <OfficerPortrait officer={officer} size={132} forceColor={color} year={year} />
        </div>
        <div style={{ fontSize: '1.15rem', color: '#eef4f8', fontFamily: 'var(--tkm-font-body)', textShadow: '0 1px 4px rgba(0,0,0,0.7)' }}>
          {lang === 'en' ? officer.name.en : officer.name.zh}
        </div>

        <div
          style={{
            position: 'relative', padding: '0.5rem 2.2rem',
            background: `linear-gradient(160deg, ${hexA(accent, 0.95)}, ${hexA(accent, 0.55)})`,
            border: '3px solid #eef4f8', borderRadius: 6,
            boxShadow: `0 0 26px ${hexA(accent, 0.7)}, inset 0 0 14px rgba(0,0,0,0.3)`,
            ...anim('tkmBannerUnfurl 0.7s cubic-bezier(0.2,1.1,0.3,1) 0.4s both'),
          }}
        >
          <span style={{ fontSize: '2.4rem', color: '#1a1208', fontFamily: 'var(--tkm-font-body)', fontWeight: 'bold', letterSpacing: '0.1rem', textShadow: '0 1px 2px rgba(255,255,255,0.3)' }}>
            {meta.name.zh}
          </span>
        </div>
        <div style={{ fontSize: '1rem', color: '#aab6c0', fontStyle: 'italic', letterSpacing: '0.07rem', ...anim('tkmCalligraphyReveal 0.9s ease-out 0.7s both') }}>
          {lang === 'en' ? `${meta.name.en} · ${meta.rank.en}` : meta.rank.zh}
        </div>

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
