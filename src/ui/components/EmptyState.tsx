import type { ReactNode } from 'react';

/**
 * 空狀態 — one styled shell for every "nothing here yet" panel, so an empty
 * list reads as a designed rest-state (a soft glyph, a line, an optional hint)
 * instead of a lonely italic string. Keep it quiet: it should never shout.
 */
export function EmptyState({
  icon = '·',
  title,
  hint,
  action,
  compact = false,
}: {
  /** A glyph/emoji or any node shown above the title. */
  icon?: ReactNode;
  /** The main line — what's absent. */
  title: ReactNode;
  /** An optional second line — how to fill it. */
  hint?: ReactNode;
  /** An optional call-to-action (a button node). */
  action?: ReactNode;
  /** Tighter padding for inline sections vs. a full panel. */
  compact?: boolean;
}) {
  return (
    <div
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
        gap: compact ? 4 : 7,
        padding: compact ? '1rem 0.8rem' : '1.8rem 1rem',
        color: 'var(--tkm-text-muted, #7a8893)',
        fontFamily: 'var(--tkm-font-body)',
        animation: 'tkmFadeIn 0.25s ease-out',
      }}
      role="status"
    >
      <div style={{
        fontSize: compact ? '1.3rem' : '1.7rem', lineHeight: 1, opacity: 0.7,
        filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.4))',
      }}>{icon}</div>
      <div style={{ fontSize: compact ? '0.8rem' : '0.86rem', color: 'var(--tkm-text-body, #b6c2cc)', letterSpacing: '0.03rem' }}>{title}</div>
      {hint && <div style={{ fontSize: '0.72rem', color: 'var(--tkm-text-muted, #7a8893)', lineHeight: 1.5, maxWidth: 280 }}>{hint}</div>}
      {action && <div style={{ marginTop: 4 }}>{action}</div>}
    </div>
  );
}
