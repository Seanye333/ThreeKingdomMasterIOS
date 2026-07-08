import { useEffect, useState } from 'react';
import { useGameStore } from '../../game/state/store';
import { useLanguage } from '../i18n';
import { useEscapeKey } from '../hooks/useEscapeKey';
import { playSfx } from '../../game/systems/sound';
import { popupImageCandidates, popupVideoUrl } from '../popups/assets';

/**
 * 慶典彈窗 — shows the front of the store's popupQueue (city tier-ups, capital
 * moves, great works…). Tries the conventional image/video under public/popups/;
 * if the file is absent it degrades to a styled card, so the system works before
 * any art exists and lights up as files are dropped in. Tap / 關閉 / auto-timeout
 * advances the queue.
 */
export function CelebrationPopup() {
  const event = useGameStore((s) => s.popupQueue[0] ?? null);
  const queueLen = useGameStore((s) => s.popupQueue.length);
  const dismissPopup = useGameStore((s) => s.dismissPopup);
  const lang = useLanguage();
  // Esc advances the queue too (matches the tap/timeout dismissal).
  useEscapeKey(dismissPopup, !!event);
  // Walk the candidate image URLs (jpg → png) on error; -1 once all fail →
  // styled fallback card. Reset whenever the queue advances.
  const [imgIdx, setImgIdx] = useState(0);
  const [videoFailed, setVideoFailed] = useState(false);

  const key = event?.key;
  useEffect(() => {
    if (!event) return;
    setImgIdx(0);
    setVideoFailed(false);
    playSfx('victory');
    const id = window.setTimeout(() => dismissPopup(), 5200);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, queueLen]);

  if (!event) return null;

  const title = lang === 'en' ? event.titleEn : event.titleZh;
  const caption = lang === 'en' ? event.captionEn : event.captionZh;
  const candidates = popupImageCandidates(event.key);
  const showVideo = event.media === 'video' && !videoFailed;
  const showImage = event.media !== 'video' && imgIdx >= 0 && imgIdx < candidates.length;
  const mediaFailed = event.media === 'video' ? videoFailed : imgIdx < 0;

  return (
    <div
      onClick={dismissPopup}
      style={{
        position: 'fixed', inset: 0, zIndex: 1200,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(8, 5, 2, 0.74)',
        backdropFilter: 'blur(2px)',
        animation: 'tkmPopupFade 0.3s ease-out',
      }}
    >
      <style>{`
        @keyframes tkmPopupFade { from { opacity: 0 } to { opacity: 1 } }
        @keyframes tkmPopupRise { from { opacity: 0; transform: translateY(14px) scale(0.97) } to { opacity: 1; transform: none } }
      `}</style>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(560px, 88vw)',
          background: 'linear-gradient(180deg, #1c140a 0%, #14100a 100%)',
          border: '1px solid #c79a3c',
          borderRadius: 'var(--tkm-radius)',
          boxShadow: '0 12px 50px rgba(0,0,0,0.6), 0 0 30px rgba(199,154,60,0.25)',
          overflow: 'hidden',
          fontFamily: 'var(--tkm-font-body)',
          animation: 'tkmPopupRise 0.4s cubic-bezier(0.2,0.8,0.3,1)',
        }}
      >
        {/* Media (or fallback art panel) */}
        <div style={{
          position: 'relative', width: '100%', aspectRatio: '16 / 9',
          background: 'radial-gradient(120% 90% at 50% 0%, #3a2c14 0%, #1a130a 70%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {showImage && (
            <img
              key={candidates[imgIdx]}
              src={candidates[imgIdx]}
              alt={title}
              onError={() => setImgIdx((i) => (i + 1 < candidates.length ? i + 1 : -1))}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          )}
          {showVideo && (
            <video
              src={popupVideoUrl(event.key)}
              autoPlay
              muted
              playsInline
              onEnded={dismissPopup}
              onError={() => setVideoFailed(true)}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          )}
          {mediaFailed && (
            // Styled fallback when no asset is present yet.
            <div style={{ textAlign: 'center', color: '#e8c46a', padding: '1rem' }}>
              <div style={{ fontSize: '3rem', lineHeight: 1, filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.5))' }}>🏯</div>
              <div style={{ marginTop: 8, fontSize: '0.72rem', color: '#8a7858', letterSpacing: '0.12rem' }}>{lang === 'en' ? 'CELEBRATION' : '慶 · 賀'}</div>
            </div>
          )}
        </div>

        {/* Caption bar */}
        <div style={{ padding: '0.7rem 1rem 0.9rem', textAlign: 'center' }}>
          <div style={{ color: '#f4dd96', fontSize: '1.15rem', letterSpacing: '0.14rem' }}>{title}</div>
          {caption && (
            <div style={{ color: '#c0a878', fontSize: '0.82rem', marginTop: 4, lineHeight: 1.5 }}>{caption}</div>
          )}
          <button
            onClick={dismissPopup}
            style={{
              marginTop: 10, background: '#2a1f12', border: '1px solid #c79a3c',
              color: '#f0d98a', padding: '0.32rem 1.4rem', borderRadius: 'var(--tkm-radius-sm)',
              cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.82rem', letterSpacing: '0.1rem',
            }}
          >{lang === 'en' ? 'Continue' : '繼續'}</button>
        </div>
      </div>
    </div>
  );
}
