import { useEffect, useState } from 'react';
import { useGameStore } from '../../game/state/store';
import { OfficerCardFace } from './OfficerCardModal';
import { officerGrade, gradeMeta } from '../../game/systems/officerGrade';
import { playSfx } from '../../game/systems/sound';
import { foilMeta } from '../../game/systems/cardFoil';
import { loadCardBack } from './cardBacks';
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
  const kind = useGameStore((s) => s.cardRevealKind);
  const officer = useGameStore((s) => (s.cardReveal ? s.officers[s.cardReveal] : undefined));
  const setCardReveal = useGameStore((s) => s.setCardReveal);
  const assignFoil = useGameStore((s) => s.assignFoil);
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    if (!cardReveal) { setFlipped(false); return; }
    // 開包閃度 — the pull rolls (and locks) this card's foil, 覺醒 guaranteed gold+.
    assignFoil(cardReveal, { minGold: kind === 'awaken' });
    playSfx('open-modal');
    const tm = window.setTimeout(() => { setFlipped(true); playSfx('victory'); }, 900);
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setCardReveal(null); };
    window.addEventListener('keydown', onKey);
    return () => { window.clearTimeout(tm); window.removeEventListener('keydown', onKey); };
  }, [cardReveal, setCardReveal, assignFoil, kind]);

  if (!cardReveal || !officer) return null;
  const meta = gradeMeta(officerGrade(officer).grade);
  // 覺醒 wears gold, 求賢祭 wears jade; each flourish says what just happened.
  const awaken = kind === 'awaken';
  const festival = kind === 'festival';
  const accent = awaken ? '#ffd66e' : festival ? '#9ad6a8' : meta.color;
  // 開包閃度 — the rolled foil, revealed with the card (null for plain pulls).
  const fm = foilMeta(officer.foil);
  // 卡背收藏 — the collectible back this card flips from.
  const back = loadCardBack();

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
      <div style={{ fontSize: '1.05rem', color: accent, letterSpacing: '0.3rem', textShadow: `0 0 14px ${accent}66`, fontFamily: '"Ma Shan Zheng", "Songti SC", serif' }}>
        {awaken ? t('★ 將星覺醒 ★', '★ THE STAR AWAKENS ★') : festival ? t('🏮 求賢祭 · 賢士現身', '🏮 A HIDDEN TALENT STEPS FORWARD') : t('名將來投', 'A NAME JOINS YOUR BANNER')}
      </div>
      {/* 開包閃度(B3) — a foil "hit" is announced once the card flips over. */}
      {flipped && fm && (
        <div style={{
          fontSize: '0.82rem', letterSpacing: '0.28rem', fontWeight: 700, padding: '2px 12px', borderRadius: 20,
          border: `1px solid ${fm.accent}`, color: '#20242c',
          background: `linear-gradient(100deg, ${fm.colors.join(', ')})`,
          boxShadow: `0 0 18px ${fm.accent}66`,
        }}>
          ✦ {lang === 'en' ? fm.en : fm.zh} ✦
        </div>
      )}
      <div style={{ width: 'min(380px, 88vw)', perspective: 1100, animation: 'tkmRevealDrop 0.5s ease-out' }}>
        <div style={{ position: 'relative', transformStyle: 'preserve-3d', transition: 'transform 0.7s cubic-bezier(0.2, 0.7, 0.3, 1)', transform: flipped ? 'rotateY(0deg)' : 'rotateY(180deg)' }}>
          {/* Face */}
          <div style={{ backfaceVisibility: 'hidden' }} onClick={(e) => { if (!flipped) return; e.stopPropagation(); setCardReveal(null); }}>
            <OfficerCardFace officer={officer} />
          </div>
          {/* Back — the chosen collectible 卡背, edged in the occasion's colour. */}
          <div style={{
            position: 'absolute', inset: 0, backfaceVisibility: 'hidden', transform: 'rotateY(180deg)',
            borderRadius: 12, border: `3px solid ${accent}`,
            background: back.bg,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 8px 40px rgba(0,0,0,0.7), 0 0 22px ${accent}44`,
          }}>
            {/* The back's own emblem, ghosted; the occasion glyph rides on top. */}
            {back.glyph && (
              <span aria-hidden style={{ position: 'absolute', fontSize: '7rem', color: back.accent || accent, opacity: 0.16, fontFamily: '"Ma Shan Zheng", "Songti SC", serif' }}>{back.glyph}</span>
            )}
            <span style={{ fontSize: '4.2rem', color: accent, opacity: 0.85, fontFamily: '"Ma Shan Zheng", "Songti SC", serif', textShadow: `0 0 24px ${accent}88` }}>{awaken ? '★' : festival ? '賢' : '將'}</span>
          </div>
        </div>
      </div>
      <div style={{ fontSize: '0.78rem', color: '#8a96a2' }}>
        {flipped
          ? (awaken
            ? `${pickName(officer.name, lang)} · ${lang === 'en' ? 'six stars — best stat +2' : '六星圓滿·最強一圍 +2'}${lang === 'en' ? ' — tap to dismiss' : ' — 點擊收起'}`
            : festival
            ? `${pickName(officer.name, lang)} · ${lang === 'en' ? 'now a free agent — go recruit them' : '現於都城在野 — 往訪賢招之'}${lang === 'en' ? ' — tap to dismiss' : ' — 點擊收起'}`
            : `${pickName(officer.name, lang)} · ${pickName(meta.name, lang)}${lang === 'en' ? ' — tap to dismiss' : ' — 點擊收起'}`)
          : (lang === 'en' ? 'Tap to reveal' : '點擊開卡')}
      </div>
    </div>
  );
}
