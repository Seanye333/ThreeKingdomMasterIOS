import { useEffect, useState } from 'react';
import { useGameStore } from '../../game/state/store';
import { TRAIT_DEFS_BY_ID } from '../../game/data/personality';
import type { Officer } from '../../game/types';
import { OfficerPortrait } from './OfficerPortrait';
import { AnimatedNumber } from './AnimatedNumber';
import { useT, useLanguage } from '../i18n';

const reducedMotion = (): boolean =>
  typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

const MOTES = Array.from({ length: 10 }, (_, i) => i);

/**
 * 入幕之慶 — the celebratory card when an officer joins your banner
 * (recruited from captivity or invited from the wild): portrait rising into
 * accent-coloured light, the five stats counting up, traits popping in, and
 * a victorious line. Shared by both flows.
 */
export function RecruitSuccessModal({ officer, onClose }: { officer: Officer; onClose: () => void }) {
  const t = useT();
  const lang = useLanguage();
  const forces = useGameStore((s) => s.forces);
  const year = useGameStore((s) => s.date.year);
  const force = officer.forceId ? forces[officer.forceId] : null;
  const accent = force?.color ?? '#e6c473';
  const reduced = reducedMotion();

  // Flip on after mount so the stats roll up from 0 and staged elements animate.
  const [revealed, setRevealed] = useState(reduced);
  useEffect(() => {
    if (reduced) return;
    const id = requestAnimationFrame(() => setRevealed(true));
    return () => cancelAnimationFrame(id);
  }, [reduced]);

  const stats: Array<[string, number, string]> = [
    ['統', officer.stats.leadership, 'LDR'],
    ['武', officer.stats.war, 'WAR'],
    ['智', officer.stats.intelligence, 'INT'],
    ['政', officer.stats.politics, 'POL'],
    ['魅', officer.stats.charisma, 'CHA'],
  ];
  const best = Math.max(...stats.map((s) => s[1]));
  const anim = (s: string) => (reduced ? undefined : s);

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.78)', display: 'grid', placeItems: 'center', zIndex: 1200, padding: '1rem' }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative', overflow: 'hidden',
          background: 'linear-gradient(165deg,#2e2417,#15100a)', border: `1px solid ${accent}`,
          width: 'min(380px,100%)', padding: '1.2rem 1.3rem', textAlign: 'center',
          color: '#e6edf3', fontFamily: 'var(--tkm-font-body)',
          boxShadow: `0 0 30px ${accent}44`,
        }}
      >
        {/* 光芒 — accent rays turn slowly behind the portrait. */}
        {!reduced && (
          <div
            style={{
              position: 'absolute', left: '50%', top: 92, width: 360, height: 360,
              transform: 'translate(-50%, -50%)', pointerEvents: 'none',
              background: `repeating-conic-gradient(from 0deg, ${accent}00 0deg, ${accent}66 6deg, ${accent}00 12deg)`,
              borderRadius: '50%',
              WebkitMaskImage: 'radial-gradient(circle, #000 0%, transparent 60%)',
              maskImage: 'radial-gradient(circle, #000 0%, transparent 60%)',
              animation: 'tkmRaySpin 18s linear infinite, tkmRayPulse 3s ease-in-out infinite',
            }}
          />
        )}

        <div style={{ position: 'relative' }}>
          <div style={{ fontSize: '0.95rem', letterSpacing: '0.14rem', color: accent, marginBottom: '0.1rem', animation: anim('tkmVictorySub 0.5s ease-out both') }}>
            🎉 {t('招攬成功', 'Recruited!')}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#7a8893', marginBottom: '0.8rem', animation: anim('tkmVictorySub 0.5s ease-out 0.1s both') }}>
            {force ? t(`${force.name.zh} 喜得一員`, `Joins ${force.name.en}`) : t('入我麾下', 'Joins your banner')}
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.6rem' }}>
            <div style={{ borderRadius: '50%', boxShadow: `0 0 22px ${accent}99`, animation: anim('tkmPortraitRise 0.7s cubic-bezier(0.2,0.9,0.3,1) both') }}>
              <OfficerPortrait officer={officer} size={96} forceColor={accent} year={year} />
            </div>
          </div>

          <div style={{ fontSize: '1.4rem', color: '#f2dd9a', animation: anim('tkmVictorySub 0.5s ease-out 0.25s both') }}>
            {lang === 'en' ? officer.name.en : officer.name.zh}
            {officer.courtesyName && <span style={{ fontSize: '0.8rem', color: '#7a8893', marginLeft: 6 }}>{lang === 'en' ? `(${officer.courtesyName.en})` : `字 ${officer.courtesyName.zh}`}</span>}
          </div>
          {lang === 'both' && <div style={{ fontSize: '0.78rem', color: '#97a4ae', fontStyle: 'italic', marginBottom: '0.7rem' }}>{officer.name.en}</div>}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 4, marginTop: '0.7rem', marginBottom: '0.7rem' }}>
            {stats.map(([zh, v, en], i) => (
              <div key={en} style={{ background: '#10161e', border: '1px solid #26323e', padding: '0.35rem 0', animation: anim(`tkmTroopMarchIn 0.45s cubic-bezier(0.2,0.9,0.3,1) ${0.35 + i * 0.08}s both`) }}>
                <div style={{ fontSize: '0.62rem', color: '#7a8893' }}>{lang === 'en' ? en : zh}</div>
                <AnimatedNumber
                  value={revealed ? v : 0}
                  durationMs={700}
                  style={{ fontSize: '1.05rem', color: v === best ? accent : '#e6edf3', fontWeight: v === best ? 700 : 400 }}
                />
              </div>
            ))}
          </div>

          {officer.traits && officer.traits.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, justifyContent: 'center', marginBottom: '0.8rem' }}>
              {officer.traits.map((tid, i) => {
                const d = TRAIT_DEFS_BY_ID[tid];
                if (!d) return null;
                return (
                  <span key={tid} style={{
                    fontSize: '0.68rem', padding: '1px 7px', borderRadius: 2,
                    border: `1px solid ${d.color}`, color: d.color,
                    animation: anim(`tkmTroopMarchIn 0.4s cubic-bezier(0.2,0.9,0.3,1) ${0.75 + i * 0.1}s both`),
                  }}>{lang === 'en' ? d.name.en : d.name.zh}</span>
                );
              })}
            </div>
          )}

          <button
            onClick={onClose}
            style={{
              width: '100%', padding: '0.5rem', cursor: 'pointer',
              background: 'linear-gradient(180deg,#3a2d18,#2a1f10)', border: `1px solid ${accent}`,
              color: '#f2dd9a', fontFamily: 'inherit', letterSpacing: '0.1rem',
            }}
          >{t('善', 'Excellent')}</button>
        </div>

        {/* 金粉 — a few embers drift up past the portrait. */}
        {!reduced && MOTES.map((i) => (
          <span
            key={i}
            style={{
              position: 'absolute', left: `calc(50% + ${(i - 5) * 26}px)`, top: 150,
              width: 4 + (i % 2), height: 4 + (i % 2), borderRadius: '50%',
              background: i % 2 ? '#f2dd9a' : accent, pointerEvents: 'none',
              boxShadow: `0 0 6px ${accent}aa`,
              animation: `tkmMoteFloat ${2 + (i % 4) * 0.4}s ease-out ${0.5 + (i % 5) * 0.25}s infinite`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
