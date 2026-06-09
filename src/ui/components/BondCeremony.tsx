import { useEffect, type CSSProperties } from 'react';
import type { Officer } from '../../game/types';
import { OfficerPortrait } from './OfficerPortrait';
import { useLanguage } from '../i18n';

interface Props {
  a: Officer;
  b: Officer;
  /** Big calligraphy title — 義結金蘭 / 義兄弟 / 宴飲. */
  titleZh: string;
  titleEn: string;
  /** Force color used to tint the seal + portraits. */
  color: string;
  year: number;
  onDone: () => void;
}

const MOTES = Array.from({ length: 10 }, (_, i) => i);

/**
 * A brief cinematic flourish played when two officers forge a bond — their
 * portraits converge, a golden 義 seal stamps in over radiating light, the
 * calligraphy resolves, and motes drift up. Auto-dismisses after ~2.6s
 * (or on click). Pure presentation; honours prefers-reduced-motion.
 */
export function BondCeremony({ a, b, titleZh, titleEn, color, year, onDone }: Props) {
  const lang = useLanguage();
  const reduced = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    const ms = reduced ? 1200 : 2600;
    const id = setTimeout(onDone, ms);
    return () => clearTimeout(id);
  }, [onDone, reduced]);

  const anim = (s: string): CSSProperties => (reduced ? {} : { animation: s });

  return (
    <div
      onClick={onDone}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000, cursor: 'pointer',
        display: 'grid', placeItems: 'center',
        background: 'radial-gradient(ellipse at center, rgba(30,20,8,0.55), rgba(0,0,0,0.86))',
        ...anim('tkmCeremonyBackdrop 0.4s ease-out'),
      }}
    >
      {/* Rotating light rays behind the seal */}
      {!reduced && (
        <div
          style={{
            position: 'absolute', left: '50%', top: '50%', width: 520, height: 520,
            background: `repeating-conic-gradient(from 0deg, ${hexA(color, 0.0)} 0deg, ${hexA(color, 0.5)} 6deg, ${hexA(color, 0.0)} 12deg)`,
            borderRadius: '50%', pointerEvents: 'none',
            maskImage: 'radial-gradient(circle, #000 0%, transparent 65%)',
            WebkitMaskImage: 'radial-gradient(circle, #000 0%, transparent 65%)',
            animation: 'tkmRaySpin 14s linear infinite, tkmRayPulse 2.6s ease-in-out infinite',
          }}
        />
      )}

      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '4.5rem' }}>
        {/* Left officer */}
        <Figure officer={a} color={color} year={year} lang={lang} style={anim('tkmConvergeLeft 0.7s cubic-bezier(0.2,0.8,0.3,1) both')} />

        {/* Center seal */}
        <div
          style={{
            position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)',
            width: 96, height: 96, borderRadius: 10,
            background: `linear-gradient(150deg, ${hexA(color, 0.95)}, ${hexA(color, 0.65)})`,
            border: '3px solid #f0e0b0', boxShadow: `0 0 26px ${hexA(color, 0.8)}, inset 0 0 14px rgba(0,0,0,0.35)`,
            display: 'grid', placeItems: 'center', zIndex: 3,
            ...anim('tkmSealStamp 0.85s cubic-bezier(0.2,1.2,0.3,1) both'),
          }}
        >
          <span style={{ fontSize: '3.4rem', color: '#fff8e6', fontFamily: '"Songti SC", serif', fontWeight: 'bold', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>義</span>
        </div>

        {/* Right officer */}
        <Figure officer={b} color={color} year={year} lang={lang} style={anim('tkmConvergeRight 0.7s cubic-bezier(0.2,0.8,0.3,1) both')} />

        {/* Motes drifting up from the seal */}
        {!reduced && MOTES.map((i) => (
          <span
            key={i}
            style={{
              position: 'absolute', left: `calc(50% + ${(i - 5) * 7}px)`, top: '54%',
              width: 4 + (i % 3), height: 4 + (i % 3), borderRadius: '50%',
              background: i % 2 ? '#f0e0b0' : color, pointerEvents: 'none',
              animation: `tkmMoteFloat ${1.8 + (i % 4) * 0.4}s ease-out ${0.6 + (i % 5) * 0.18}s infinite`,
            }}
          />
        ))}
      </div>

      {/* Calligraphy title */}
      <div
        style={{
          position: 'absolute', bottom: '24%', textAlign: 'center', pointerEvents: 'none',
          ...anim('tkmCalligraphyReveal 0.9s ease-out 0.35s both'),
        }}
      >
        <div style={{ fontSize: '2.6rem', color: '#f0d98a', fontFamily: '"Songti SC","Noto Serif SC",serif', textShadow: `0 0 18px ${hexA(color, 0.7)}, 0 2px 6px rgba(0,0,0,0.6)` }}>
          {titleZh}
        </div>
        <div style={{ fontSize: '0.95rem', color: '#c0a878', fontStyle: 'italic', letterSpacing: '0.2rem', marginTop: '0.4rem' }}>
          {lang === 'zh' ? '' : titleEn}
        </div>
        <div style={{ fontSize: '1.05rem', color: '#e8d9b0', marginTop: '0.6rem', fontFamily: '"Songti SC", serif' }}>
          {(lang === 'en' ? a.name.en : a.name.zh)} <span style={{ color: color }}>&amp;</span> {(lang === 'en' ? b.name.en : b.name.zh)}
        </div>
      </div>
    </div>
  );
}

function Figure({ officer, color, year, lang, style }: { officer: Officer; color: string; year: number; lang: string; style: CSSProperties }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', ...style }}>
      <div style={{ borderRadius: '50%', boxShadow: `0 0 24px ${hexA(color, 0.7)}`, border: `2px solid ${color}` }}>
        <OfficerPortrait officer={officer} size={104} forceColor={color} year={year} />
      </div>
      <div style={{ fontSize: '1.05rem', color: '#f0e0b0', fontFamily: '"Songti SC", serif', textShadow: '0 1px 4px rgba(0,0,0,0.7)' }}>
        {lang === 'en' ? officer.name.en : officer.name.zh}
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
