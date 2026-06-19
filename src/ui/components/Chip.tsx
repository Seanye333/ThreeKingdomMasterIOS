import type { CSSProperties, ReactNode } from 'react';

export type ChipTone = 'danger' | 'warn' | 'info' | 'ok' | 'neutral';

/** Shared status-chip palette — one source of truth for 受襲/糧荒/民心/在野 等狀態色. */
export const CHIP_TONES: Record<ChipTone, { fg: string; border: string; bg: string }> = {
  danger:  { fg: '#ffb088', border: '#e0603a', bg: 'rgba(200,60,40,0.18)' },
  warn:    { fg: '#f2dd9a', border: '#e6c473', bg: 'rgba(212,168,74,0.12)' },
  info:    { fg: '#9ad6c8', border: '#5a8a7a', bg: 'rgba(90,138,122,0.12)' },
  ok:      { fg: '#9ad6a8', border: '#6fae73', bg: 'rgba(110,174,115,0.14)' },
  neutral: { fg: '#aab6c0', border: '#2b3845', bg: 'rgba(255,255,255,0.04)' },
};

interface ChipProps {
  tone?: ChipTone;
  icon?: ReactNode;
  /** Soft attention pulse (uses the shared threat-chip keyframe; honours reduce-motion). */
  pulse?: boolean;
  onClick?: () => void;
  title?: string;
  disabled?: boolean;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}

/**
 * 狀態芯片 — one rounded status pill, coloured by tone. Replaces the scattered
 * hand-styled HUD labels (受襲/閒置/…) so every status reads the same. Renders a
 * <button> when given onClick, otherwise a static <span>.
 */
export function Chip({ tone = 'neutral', icon, pulse, onClick, title, disabled, className, style, children }: ChipProps) {
  const c = CHIP_TONES[tone];
  const cls = [pulse ? 'tkm-threat-chip' : '', className].filter(Boolean).join(' ') || undefined;
  const common: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 5,
    background: c.bg,
    border: `1px solid ${c.border}`,
    color: c.fg,
    padding: '0.2rem 0.6rem',
    borderRadius: 999,
    fontFamily: 'var(--tkm-font-body)',
    fontSize: '0.78rem',
    lineHeight: 1.25,
    whiteSpace: 'nowrap',
    ...style,
  };
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        title={title}
        disabled={disabled}
        className={cls}
        style={{ ...common, cursor: disabled ? 'default' : 'pointer' }}
      >
        {icon}
        {children}
      </button>
    );
  }
  return (
    <span title={title} className={cls} style={common}>
      {icon}
      {children}
    </span>
  );
}
