import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { useEscapeKey } from '../hooks/useEscapeKey';
import { playSfx } from '../../game/systems/sound';
import styles from './Modal.module.css';

export interface ModalProps {
  onClose: () => void;
  /** Header title (jin-gold). Omit (along with icon) and pass hideClose for a chromeless shell. */
  title?: ReactNode;
  /** Leading glyph before the title. */
  icon?: ReactNode;
  /** Muted count/subtitle riding after the title, e.g. "(3)" or "春季預算". */
  badge?: ReactNode;
  /** Extra controls in the header, left of the close button. */
  headerRight?: ReactNode;
  /** Frame width. Default 'min(560px, 100%)'. */
  width?: string;
  /** Frame max height. Default '86vh'. */
  maxHeight?: string;
  /** Stacking order of the backdrop. Default 900. */
  zIndex?: number;
  /** Padding of the frame interior (or of the scrolling body, when scrollBody). Default '1rem 1.2rem'. */
  padding?: string;
  /** Fixed header above a self-scrolling body — for long lists that mustn't carry the title away. */
  scrollBody?: boolean;
  /** Hide the × close button (rare — confirm dialogs that own their buttons). */
  hideClose?: boolean;
  /** Whether clicking the backdrop closes. Default true. */
  closeOnBackdrop?: boolean;
  /** Whether Esc closes. Default true. */
  closeOnEsc?: boolean;
  /** Extra class on the frame (for texture/seal opt-ins). */
  className?: string;
  frameStyle?: CSSProperties;
  ariaLabel?: string;
  children: ReactNode;
}

/**
 * The shared modal shell. Renders the canonical ink-panel frame, a dimmed
 * backdrop, a header row (icon · title · badge … headerRight × close), and the
 * body. Open motion (fade + rise) lives in the CSS module, so every dialog that
 * adopts this gains the same entrance for free. Esc and backdrop-click close by
 * default; opt out per-modal when a flow must be dismissed deliberately.
 */
export function Modal({
  onClose,
  title,
  icon,
  badge,
  headerRight,
  width = 'min(560px, 100%)',
  maxHeight = '86vh',
  zIndex = 900,
  padding = '1rem 1.2rem',
  scrollBody = false,
  hideClose = false,
  closeOnBackdrop = true,
  closeOnEsc = true,
  className,
  frameStyle,
  ariaLabel,
  children,
}: ModalProps) {
  // Animated close: play the exit, *then* tell the parent to unmount us. The
  // dialog stays mounted through the ~0.17s exit because onClose (which flips
  // the parent's `show` flag) only fires when the animation is done.
  const [closing, setClosing] = useState(false);
  const closingRef = useRef(false);
  const closeTimer = useRef(0);
  const requestClose = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    playSfx('whoosh');
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce) { onClose(); return; }
    setClosing(true);
    closeTimer.current = window.setTimeout(onClose, 170);
  }, [onClose]);
  useEffect(() => () => window.clearTimeout(closeTimer.current), []);

  // 弹窗開合 — a soft sting on open; whoosh on close (in requestClose).
  useEffect(() => { playSfx('open-modal'); }, []);

  useEscapeKey(requestClose, closeOnEsc);

  const hasHeader = title != null || icon != null || headerRight != null || !hideClose;

  const frameClasses = [styles.frame];
  if (scrollBody) frameClasses.push(styles.frameScroll);
  if (closing) frameClasses.push(styles.closing);
  if (className) frameClasses.push(className);

  const header = hasHeader ? (
    <div className={scrollBody ? `${styles.header} ${styles.headerBar}` : styles.header}>
      <div className={styles.title}>
        {icon != null && <span className={styles.icon}>{icon}</span>}
        {title}
        {badge != null && <span className={styles.badge}>{badge}</span>}
      </div>
      {(headerRight != null || !hideClose) && (
        <div className={styles.headerRight}>
          {headerRight}
          {!hideClose && (
            <button type="button" className={styles.closeBtn} onClick={requestClose} aria-label="Close">
              ×
            </button>
          )}
        </div>
      )}
    </div>
  ) : null;

  return (
    <div
      className={closing ? `${styles.backdrop} ${styles.closing}` : styles.backdrop}
      style={{ zIndex }}
      onClick={closeOnBackdrop ? requestClose : undefined}
      role="presentation"
    >
      <div
        className={frameClasses.join(' ')}
        style={{ width, maxHeight, ...(scrollBody ? null : { padding }), ...frameStyle }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
      >
        {scrollBody ? (
          <>
            {header}
            <div className={styles.bodyScroll} style={{ padding }}>
              {children}
            </div>
          </>
        ) : (
          <>
            {header}
            {children}
          </>
        )}
      </div>
    </div>
  );
}
