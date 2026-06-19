import { useState, type ReactNode } from 'react';

interface Props {
  /** Tooltip body — typically the English explanation. */
  text: string;
  /** Optional secondary line. */
  hint?: string;
  children: ReactNode;
}

/**
 * Lightweight inline tooltip: wrap any zh term to show an en explanation
 * on hover/focus. Uses absolute positioning relative to a span wrapper.
 */
export function Tooltip({ text, hint, children }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <span
      style={{ position: 'relative', display: 'inline-block', cursor: 'help', borderBottom: '1px dotted #7a8893' }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
      tabIndex={0}
    >
      {children}
      {open && (
        <span
          style={{
            position: 'absolute',
            bottom: 'calc(100% + 6px)',
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#10161e',
            border: '1px solid #e6c473',
            color: '#e6c473',
            padding: '0.35rem 0.65rem',
            fontSize: '0.78rem',
            fontFamily: 'ui-monospace, monospace',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            zIndex: 999,
            boxShadow: '0 0 8px rgba(212, 168, 74, 0.4)',
            animation: 'tkmFadeIn 0.12s ease-out',
          }}
        >
          {text}
          {hint && (
            <span style={{ display: 'block', fontSize: '0.7rem', color: '#7a8893', fontStyle: 'italic' }}>
              {hint}
            </span>
          )}
        </span>
      )}
    </span>
  );
}
