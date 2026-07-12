import { useEffect, useState } from 'react';
import { useGameStore } from '../../game/state/store';
import { OfficerCardFace } from './OfficerCardModal';
import { officerGrade, gradeMeta } from '../../game/systems/officerGrade';
import { playSfx } from '../../game/systems/sound';
import { useT, useLanguage, pickName } from '../i18n';

/**
 * 得將開卡 — the gacha-style flourish when a notable officer (gold grade or
 * better) enters the player's service: a rune-backed card drops in, hangs a
 * beat, then flips over to the full OfficerCardFace. Driven by the store's
 * transient `cardReveal` id (set by recruit / season-commit sweeps).
 */
export function CardRevealModal() {
  const t = useT();
  const lang = useLanguage();
  const cardReveal = useGameStore((s) => s.cardReveal);
  const officer = useGameStore((s) => (s.cardReveal ? s.officers[s.cardReveal] : undefined));
  const setCardReveal = useGameStore((s) => s.setCardReveal);
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    if (!cardReveal) { setFlipped(false); return; }
    playSfx('open-modal');
    const tm = window.setTimeout(() => { setFlipped(true); playSfx('victory'); }, 900);
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setCardReveal(null); };
    window.addEventListener('keydown', onKey);
    return () => { window.clearTimeout(tm); window.removeEventListener('keydown', onKey); };
  }, [cardReveal, setCardReveal]);

  if (!cardReveal || !officer) return null;
  const meta = gradeMeta(officerGrade(officer).grade);

  return (
    <div
      role="dialog"
      aria-label={t('名將來投', 'A famous officer joins')}
      onClick={() => { if (flipped) setCardReveal(null); else setFlipped(true); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 1400,
        background: 'rgba(4,6,10,0.82)', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 14, cursor: 'pointer',
      }}
    >
      <style>{`
        @keyframes tkmRevealDrop { from { transform: translateY(-40px) scale(0.92); opacity: 0; } to { transform: none; opacity: 1; } }
      `}</style>
      <div style={{ fontSize: '1.05rem', color: meta.color, letterSpacing: '0.3rem', textShadow: `0 0 14px ${meta.color}66`, fontFamily: '"Ma Shan Zheng", "Songti SC", serif' }}>
        {t('名將來投', 'A NAME JOINS YOUR BANNER')}
      </div>
      <div style={{ width: 'min(380px, 88vw)', perspective: 1100, animation: 'tkmRevealDrop 0.5s ease-out' }}>
        <div style={{ position: 'relative', transformStyle: 'preserve-3d', transition: 'transform 0.7s cubic-bezier(0.2, 0.7, 0.3, 1)', transform: flipped ? 'rotateY(0deg)' : 'rotateY(180deg)' }}>
          {/* Face */}
          <div style={{ backfaceVisibility: 'hidden' }} onClick={(e) => { if (!flipped) return; e.stopPropagation(); setCardReveal(null); }}>
            <OfficerCardFace officer={officer} />
          </div>
          {/* Back — a rune card in the grade's colour. */}
          <div style={{
            position: 'absolute', inset: 0, backfaceVisibility: 'hidden', transform: 'rotateY(180deg)',
            borderRadius: 12, border: `3px solid ${meta.color}`,
            background: 'radial-gradient(ellipse at 50% 34%, #1b2531 0%, #0a0e14 80%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 8px 40px rgba(0,0,0,0.7), 0 0 22px ${meta.color}44`,
          }}>
            <span style={{ fontSize: '4.2rem', color: meta.color, opacity: 0.85, fontFamily: '"Ma Shan Zheng", "Songti SC", serif', textShadow: `0 0 24px ${meta.color}88` }}>將</span>
          </div>
        </div>
      </div>
      <div style={{ fontSize: '0.78rem', color: '#8a96a2' }}>
        {flipped
          ? `${pickName(officer.name, lang)} · ${pickName(meta.name, lang)}${lang === 'en' ? ' — tap to dismiss' : ' — 點擊收起'}`
          : (lang === 'en' ? 'Tap to reveal' : '點擊開卡')}
      </div>
    </div>
  );
}
