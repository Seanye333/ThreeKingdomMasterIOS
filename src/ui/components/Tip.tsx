import { useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface TipProps {
  /** Tooltip text. When empty/undefined, the children render with no tooltip. */
  text?: string;
  /** Which side of the trigger the bubble sits. Default 'bottom'. */
  placement?: 'top' | 'bottom';
  children: ReactNode;
}

/**
 * 統一 tooltip — a styled, portal-rendered hover bubble that replaces the slow,
 * unstyled native `title`. Rendered to document.body so no `overflow:hidden`
 * ancestor (top bar, modal, panel) can clip it; appears after a short hover
 * delay and on keyboard focus; never eats pointer events. The wrapper is
 * inline-flex, so it drops into flex toolbars without disturbing layout.
 */
export function Tip({ text, placement = 'bottom', children }: TipProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);

  const show = () => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setPos({
      x: r.left + r.width / 2,
      y: placement === 'bottom' ? r.bottom + 8 : r.top - 8,
    });
  };
  const hide = () => setPos(null);

  if (!text) return <>{children}</>;

  // 觸屏長按 — coarse pointers have no hover: press-and-hold 350ms shows the
  // bubble, releasing (or tapping elsewhere) hides it. Desktop keeps hover.
  const holdTimer = useRef<number | null>(null);
  const onTouchStart = () => {
    holdTimer.current = window.setTimeout(show, 350);
  };
  const onTouchEnd = () => {
    if (holdTimer.current) window.clearTimeout(holdTimer.current);
    window.setTimeout(hide, 1600); // linger long enough to read
  };

  return (
    <span
      ref={ref}
      style={{ display: 'inline-flex' }}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocusCapture={show}
      onBlurCapture={hide}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onTouchCancel={onTouchEnd}
    >
      {children}
      {pos &&
        createPortal(
          <div
            role="tooltip"
            style={{
              position: 'fixed',
              left: Math.max(8, Math.min(window.innerWidth - 8, pos.x)),
              top: pos.y,
              transform: `translate(-50%, ${placement === 'bottom' ? '0' : '-100%'})`,
              maxWidth: 'min(260px, 90vw)',
              background: '#10161e',
              border: '1px solid var(--tkm-text-h2, #e6c473)',
              color: 'var(--tkm-text-h2, #e6c473)',
              padding: '0.34rem 0.6rem',
              fontSize: '0.76rem',
              fontFamily: 'var(--tkm-font-body)',
              lineHeight: 1.45,
              borderRadius: 6,
              boxShadow: '0 4px 16px rgba(0,0,0,0.55)',
              pointerEvents: 'none',
              zIndex: 10000,
              animation: 'tkmFadeIn 0.12s ease-out',
            }}
          >
            {text}
          </div>,
          document.body,
        )}
    </span>
  );
}
