import { useEffect, useRef, useState } from 'react';
import { useGameStore } from '../../game/state/store';
import { SEASON_LABEL, type Season } from '../../game/types';
import styles from './SeasonTransition.module.css';

/** Seasonal accents — jade spring, warm summer, jin autumn, cold winter. */
const SEASON_ACCENT: Record<Season, string> = {
  spring: '#6fbf9f',
  summer: '#e0784a',
  autumn: '#e6c473',
  winter: '#8fb6e0',
};

const SEASON_TINT: Record<Season, string> = {
  spring: 'rgba(111,191,159,0.16)',
  summer: 'rgba(224,120,74,0.16)',
  autumn: 'rgba(230,196,115,0.16)',
  winter: 'rgba(143,182,224,0.16)',
};

/** 落物 — the drifting glyph for each season (fireflies rise, the rest fall). */
const SEASON_PARTICLE: Record<Season, { glyph: string; color: string; rise: boolean }> = {
  spring: { glyph: '❀', color: '#f3b6c6', rise: false },
  summer: { glyph: '✦', color: '#ffe7a0', rise: true },
  autumn: { glyph: '❧', color: '#e0a050', rise: false },
  winter: { glyph: '❄', color: '#dbe8f5', rise: false },
};

const PARTICLES = Array.from({ length: 16 }, (_, i) => i);

/**
 * 季度過場 — washes a water-ink season card over the realm whenever the season
 * turns. Watches the campaign date; on a season (or year) change it shows the
 * card for ~1.5s, then clears itself. A click skips early. Suppressed in
 * spectator mode so the auto-sim isn't gated by 1.5s cards.
 */
export function SeasonTransition() {
  const year = useGameStore((s) => s.date.year);
  const season = useGameStore((s) => s.date.season);
  const observing = useGameStore((s) => s.playerForceId === null);
  const [card, setCard] = useState<{ year: number; season: Season } | null>(null);
  const prevKey = useRef<string | null>(null);
  const timer = useRef(0);

  useEffect(() => {
    const key = `${year}-${season}`;
    // Skip the very first render (campaign load) — only turns should fire it.
    if (prevKey.current === null) {
      prevKey.current = key;
      return;
    }
    if (prevKey.current !== key) {
      prevKey.current = key;
      if (observing) return;
      setCard({ year, season });
      window.clearTimeout(timer.current);
      const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      timer.current = window.setTimeout(() => setCard(null), reduce ? 800 : 1500);
    }
  }, [year, season, observing]);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  if (!card) return null;

  const accent = SEASON_ACCENT[card.season];
  const label = SEASON_LABEL[card.season];
  const particle = SEASON_PARTICLE[card.season];

  return (
    <div
      className={styles.root}
      data-testid="season-transition"
      style={{ background: `radial-gradient(ellipse 70% 60% at 50% 48%, ${SEASON_TINT[card.season]} 0%, rgba(8,11,14,0.82) 72%)` }}
      onClick={() => { window.clearTimeout(timer.current); setCard(null); }}
      role="presentation"
    >
      {/* 季節落物 — petals/fireflies/leaves/snow drift across the season card. */}
      {PARTICLES.map((i) => (
        <span
          key={i}
          className={particle.rise ? styles.particleRise : styles.particle}
          aria-hidden="true"
          style={{
            left: `${(i * 53) % 100}%`,
            color: particle.color,
            fontSize: `${0.7 + (i % 4) * 0.35}rem`,
            textShadow: `0 0 8px ${particle.color}`,
            ['--p-dur' as string]: `${1.5 + (i % 5) * 0.28}s`,
            ['--p-delay' as string]: `${(i % 6) * 0.13}s`,
            ['--p-drift' as string]: `${((i % 7) - 3) * 22}px`,
            ['--p-spin' as string]: `${((i % 2) ? 1 : -1) * (160 + (i % 3) * 90)}deg`,
          }}
        >{particle.glyph}</span>
      ))}
      <div className={styles.card} style={{ color: accent }}>
        <div className={styles.bigChar}>{label.zh}</div>
        <div className={styles.line} />
        <div className={styles.year}>{card.year}年</div>
        <div className={styles.en}>{label.en} · {card.year} AD</div>
      </div>
    </div>
  );
}
