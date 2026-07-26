import { useState, type ReactNode } from 'react';

/**
 * 三圖共用的 HUD 元件 — the overlay vocabulary shared by the world map, the
 * city scene and the battle screen.
 *
 * All three grew their chrome independently and ended up with roughly a
 * thousand hand-written hex colours between them, which is how the same
 * "toggle button" ends up three subtly different shades of brown. These are
 * the canonical pieces: a toggle/action button and a read-only chip, both
 * driven by one tone table.
 *
 * Extracted from TacticalBattleScreen3D, which had already converged on this
 * shape for its top bar.
 */

export const HUD_TONES = {
  gold:  { border: 'var(--tkm-hud-gold)', color: '#f0d98a', bg: 'rgba(212,168,74,0.25)' },
  green: { border: 'var(--tkm-hud-green)', color: '#c8e8a0', bg: 'rgba(126,214,138,0.25)' },
  red:   { border: '#ff6a50', color: '#ffb0a0', bg: 'rgba(184,68,46,0.35)' },
  blue:  { border: '#7ec0e0', color: '#9ed0ea', bg: 'rgba(126,192,224,0.15)' },
  ember: { border: '#b8584a', color: '#e0a090', bg: 'rgba(60,30,20,0.7)' },
} as const;
export type HudTone = keyof typeof HUD_TONES;

/**
 * A HUD toggle or action.
 *
 * `active` lights it in its tone (a toggle that is currently on); `danger`
 * keeps it permanently lit in ember (a 撤退-style action that should read as
 * consequential even when idle). Falls back to `title` for the accessible
 * name, so an icon-only button is labelled by construction rather than by
 * remembering to pass two props.
 */
export function HudButton({ active, tone = 'gold', danger, title, ariaLabel, onClick, children }: {
  active?: boolean;
  tone?: HudTone;
  /** Always-tinted action (撤退-style) rather than a toggle. */
  danger?: boolean;
  title?: string;
  ariaLabel?: string;
  onClick: () => void;
  children: ReactNode;
}) {
  const [hover, setHover] = useState(false);
  const tn = HUD_TONES[danger ? 'ember' : tone];
  const lit = !!active || !!danger;
  return (
    <button
      onClick={onClick}
      title={title}
      aria-label={ariaLabel ?? title}
      // A toggle has to announce its state; a plain action must not claim one.
      aria-pressed={active === undefined ? undefined : active}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        fontSize: '0.72rem', padding: '2px 8px', cursor: 'pointer', fontFamily: 'inherit',
        background: lit ? tn.bg : hover ? 'rgba(58,45,24,0.85)' : 'rgba(40, 28, 18, 0.7)',
        border: `1px solid ${lit ? tn.border : hover ? '#8a7048' : '#5a4530'}`,
        color: lit ? tn.color : hover ? '#d8c090' : 'var(--tkm-hud-tan)',
        filter: lit && hover ? 'brightness(1.12)' : undefined,
      }}
    >{children}</button>
  );
}

/** A read-only HUD reading (weather, turn count, troop total…). */
export function HudChip({ tone, bg, title, children }: {
  /** Border/text tint; omitted = quiet parchment. */
  tone?: HudTone;
  /** Optional tinted background (e.g. the ready-count chip). */
  bg?: string;
  title?: string;
  children: ReactNode;
}) {
  const tn = tone ? HUD_TONES[tone] : { border: 'rgba(255,255,255,0.1)', color: 'var(--tkm-hud-tan)' };
  return (
    <span title={title} style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      fontSize: '0.72rem', padding: '2px 7px',
      background: bg ?? 'rgba(40, 28, 18, 0.7)',
      border: `1px solid ${tn.border}`, color: tn.color,
    }}>{children}</span>
  );
}
