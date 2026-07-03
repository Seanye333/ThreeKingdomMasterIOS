import { useEffect, useState } from 'react';
import { useT } from '../i18n';

/**
 * 安裝引導 — phones visiting the site get told the game installs.
 * iOS Safari never volunteers this (no beforeinstallprompt, no hint),
 * so we spell out 分享→添加到主屏幕; Chromium phones get the real
 * install prompt wired to a button. Hidden once installed (standalone
 * display mode) and quiet for 14 days after a dismissal.
 */
const DISMISS_KEY = 'tkm-install-dismissed';
const QUIET_DAYS = 14;

type BeforeInstallPromptEvent = Event & { prompt: () => Promise<void> };

function isStandalone(): boolean {
  return window.matchMedia?.('(display-mode: standalone)')?.matches
    || (navigator as { standalone?: boolean }).standalone === true;
}

function recentlyDismissed(): boolean {
  try {
    const ts = Number(localStorage.getItem(DISMISS_KEY) ?? 0);
    return Date.now() - ts < QUIET_DAYS * 86_400_000;
  } catch {
    return false;
  }
}

export function InstallPrompt() {
  const t = useT();
  const [visible, setVisible] = useState(false);
  const [installEvt, setInstallEvt] = useState<BeforeInstallPromptEvent | null>(null);
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const isMobile = window.matchMedia?.('(pointer: coarse)')?.matches || window.innerWidth < 700;

  useEffect(() => {
    if (!isMobile || isStandalone() || recentlyDismissed()) return;
    if (isIOS) {
      setVisible(true);
      return;
    }
    // Chromium: only offer when the browser confirms installability.
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setInstallEvt(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    return () => window.removeEventListener('beforeinstallprompt', onPrompt);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!visible) return null;

  const dismiss = () => {
    setVisible(false);
    try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch { /* quota */ }
  };

  return (
    <div style={{
      position: 'fixed', left: 10, right: 10, bottom: 10, zIndex: 950,
      background: 'linear-gradient(160deg,#1b2531,#10161e)', border: '1px solid #e6c473',
      borderRadius: 'var(--tkm-radius)', padding: '0.7rem 0.9rem', boxShadow: '0 4px 18px rgba(0,0,0,0.6)',
      fontFamily: 'var(--tkm-font-body)', color: '#e6edf3',
      display: 'flex', alignItems: 'center', gap: 10,
    }}>
      <span style={{ fontSize: '1.4rem' }}>📲</span>
      <div style={{ flex: 1, fontSize: '0.82rem', lineHeight: 1.5 }}>
        <div style={{ color: '#f2dd9a' }}>{t('把遊戲裝到主屏幕,全屏離線玩', 'Install to your home screen — fullscreen, offline')}</div>
        {isIOS ? (
          <div style={{ color: '#97a4ae', fontSize: '0.74rem' }}>
            {t('Safari 底部', 'In Safari: tap')} <strong>{t('分享', 'Share')} ⬆️</strong> → <strong>{t('「添加到主屏幕」', '"Add to Home Screen"')}</strong>
          </div>
        ) : (
          <div style={{ color: '#97a4ae', fontSize: '0.74rem' }}>
            {t('一鍵安裝,不佔多少空間', 'One tap, barely any space')}
          </div>
        )}
      </div>
      {!isIOS && installEvt && (
        <button
          onClick={() => { installEvt.prompt().catch(() => undefined); dismiss(); }}
          style={{
            background: 'linear-gradient(180deg,#3a2d18,#2a1f10)', border: '1px solid #e6c473',
            color: '#f2dd9a', padding: '0.45rem 1rem', cursor: 'pointer',
            fontFamily: 'inherit', letterSpacing: '0.05rem', whiteSpace: 'nowrap',
          }}
        >{t('安裝', 'Install')}</button>
      )}
      <button
        onClick={dismiss}
        style={{ background: 'transparent', border: 'none', color: '#7a8893', fontSize: '1.1rem', cursor: 'pointer', padding: '0 0.2rem' }}
      >✕</button>
    </div>
  );
}
