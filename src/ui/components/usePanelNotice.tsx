import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useLanguage } from '../i18n';

/**
 * In-panel feedback that replaces native `alert()` / `confirm()` — those pop a
 * jarring, OS-styled, thread-blocking (and often English-only) dialog mid-game.
 *
 * A global toast/modal would render *behind* a z-layered panel, so this keeps
 * the toast + confirm local to the calling panel and returns `noticeUI` to drop
 * into its render tree. z 960/965 sits above the panels (z 600–900) yet below
 * the tutorial layer.
 *
 *   const { notify, confirm, noticeUI } = usePanelNotice();
 *   // ...  if (!r.ok) notify(r.reason);           // toast (赭=warn / 綠=ok)
 *   // ...  confirm(t('刪除?','Delete?'), () => del());  // styled yes/no
 *   return (<div>… {noticeUI}</div>);
 */
export function usePanelNotice() {
  const lang = useLanguage();
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [confirmBox, setConfirmBox] = useState<{ body: string; onYes: () => void } | null>(null);
  const timer = useRef(0);
  // Tolerant of nullish like the alert() it replaces — a missing reason/message
  // just shows nothing rather than a literal "undefined".
  const notify = (msg: string | null | undefined, ok = false) => {
    if (!msg) return;
    setToast({ msg, ok });
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setToast(null), 2800);
  };
  const confirm = (body: string, onYes: () => void) => setConfirmBox({ body, onYes });
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const noticeUI: ReactNode = (
    <>
      {toast && (
        <div style={{
          position: 'fixed', bottom: 'calc(1.4rem + var(--tkm-safe-bottom))', left: '50%', transform: 'translateX(-50%)',
          zIndex: 960, maxWidth: '86vw', pointerEvents: 'none', textAlign: 'center',
          background: toast.ok ? 'rgba(20,40,26,0.96)' : 'rgba(46,26,20,0.96)',
          border: `1px solid ${toast.ok ? '#5fae73' : '#c07a4a'}`,
          color: toast.ok ? '#bfe6c8' : '#f0c4a4',
          borderRadius: 'var(--tkm-radius)', padding: '0.5rem 0.9rem',
          fontFamily: 'var(--tkm-font-body)', fontSize: '0.85rem', boxShadow: '0 4px 18px rgba(0,0,0,0.5)',
        }}>{toast.msg}</div>
      )}
      {confirmBox && (
        <div
          onClick={(e) => { e.stopPropagation(); setConfirmBox(null); }}
          style={{ position: 'fixed', inset: 0, zIndex: 965, background: 'rgba(6,4,2,0.62)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
        >
          <div onClick={(e) => e.stopPropagation()} style={{
            width: 'min(400px, 92vw)', background: 'linear-gradient(180deg,#1e1710,#150f0a)',
            border: '1px solid #7a5a30', borderRadius: 'var(--tkm-radius)', padding: '1rem 1.1rem',
            color: '#e0cfa8', fontFamily: 'var(--tkm-font-body)', boxShadow: '0 10px 40px rgba(0,0,0,0.6)',
          }}>
            <div style={{ fontSize: '0.9rem', lineHeight: 1.55, marginBottom: '0.9rem' }}>{confirmBox.body}</div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button onClick={() => setConfirmBox(null)} style={{ background: 'transparent', border: '1px solid #4a5568', color: '#97a4ae', borderRadius: 'var(--tkm-radius-sm)', padding: '0.35rem 0.9rem', cursor: 'pointer', fontFamily: 'inherit' }}>{lang === 'en' ? 'Cancel' : '取消'}</button>
              <button onClick={() => { const yes = confirmBox.onYes; setConfirmBox(null); yes(); }} style={{ background: 'rgba(192,90,74,0.25)', border: '1px solid #c0504a', color: '#f0b0a0', borderRadius: 'var(--tkm-radius-sm)', padding: '0.35rem 0.9rem', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 'bold' }}>{lang === 'en' ? 'Confirm' : '確定'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );

  return { notify, confirm, noticeUI };
}
