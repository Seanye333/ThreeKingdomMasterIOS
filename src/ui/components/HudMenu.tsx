import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Tip } from './Tip';
import { playSfx } from '../../game/systems/sound';

interface MenuItem {
  label: ReactNode;
  onClick: () => void;
  /** Show a small badge next to the label. */
  badge?: number;
  title?: string;
}

/** A non-clickable section label inside the dropdown, e.g. 演武場 / 武備. */
interface MenuHeader {
  header: ReactNode;
}

export type MenuEntry = MenuItem | MenuHeader;

const isHeader = (e: MenuEntry): e is MenuHeader => 'header' in e;

interface Props {
  label: ReactNode;
  items: MenuEntry[];
  /** Optional title attribute on the trigger. */
  title?: string;
}

/**
 * A simple HUD dropdown menu. Click the label to open; click outside to close.
 * Used to group related top-bar buttons into a single trigger.
 *
 * The dropdown is rendered via React portal so a parent's `overflow: hidden`
 * (e.g. on the topBar) can never clip it.
 */
export function HudMenu({ label, items, title }: Props) {
  const [open, setOpen] = useState(false);
  // 待辦加總 — surface the sum of item badges on the closed trigger, so a
  // pending 賑災/書信 still pings the player without opening the menu.
  const badgeSum = items.reduce((n, it) => n + (isHeader(it) ? 0 : it.badge ?? 0), 0);
  const [pos, setPos] = useState<{ left: number; top: number; width: number }>({
    left: 0, top: 0, width: 0,
  });
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const dropRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;
    const r = triggerRef.current.getBoundingClientRect();
    setPos({ left: r.left, top: r.bottom + 4, width: r.width });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const t = e.target as Node;
      if (
        triggerRef.current && !triggerRef.current.contains(t) &&
        dropRef.current && !dropRef.current.contains(t)
      ) {
        setOpen(false);
      }
    };
    const onResize = () => setOpen(false);
    document.addEventListener('mousedown', handler);
    window.addEventListener('resize', onResize);
    window.addEventListener('scroll', onResize, true);
    return () => {
      document.removeEventListener('mousedown', handler);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onResize, true);
    };
  }, [open]);

  return (
    <>
      <Tip text={title} placement="bottom">
        <button
          ref={triggerRef}
          className="hud-menu-trigger"
          onClick={() => setOpen((o) => { if (!o) playSfx('click'); return !o; })}
          style={{
            background: open ? 'var(--tkm-bg-raised)' : 'transparent',
            color: 'var(--tkm-text-h2)',
            border: `1px solid ${open ? 'var(--tkm-text-h2)' : 'var(--tkm-border)'}`,
            padding: '0.35rem 0.7rem',
            fontFamily: 'var(--tkm-font-body)',
            fontSize: '0.82rem',
            cursor: 'pointer',
            letterSpacing: '0.1rem',
            transition: 'background 0.15s, border-color 0.15s',
            whiteSpace: 'nowrap',
          }}
        >
          {label} <span style={{ fontSize: '0.7rem', opacity: 0.6 }}>▾</span>
          {badgeSum > 0 && (
            <span
              style={{
                marginLeft: '0.3rem',
                background: 'var(--tkm-danger)',
                color: 'white',
                fontSize: '0.68rem',
                padding: '0 0.35rem',
                borderRadius: 'var(--tkm-radius)',
                fontFamily: 'var(--tkm-font-mono)',
                verticalAlign: 'middle',
              }}
            >
              {badgeSum}
            </span>
          )}
        </button>
      </Tip>
      {open && createPortal(
        <div
          ref={dropRef}
          style={{
            position: 'fixed',
            top: pos.top,
            left: pos.left,
            minWidth: Math.max(200, pos.width),
            maxHeight: '70vh',
            overflowY: 'auto',
            background: 'var(--tkm-bg-modal)',
            border: '1px solid var(--tkm-text-h2)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.7)',
            zIndex: 9999,
            animation: 'tkmFadeIn 0.12s ease-out',
          }}
        >
          {items.map((it, i) => isHeader(it) ? (
            <div
              key={i}
              style={{
                padding: '0.4rem 0.75rem 0.2rem',
                fontSize: '0.64rem',
                letterSpacing: '0.14rem',
                color: 'var(--tkm-text-muted)',
                borderBottom: '1px solid var(--tkm-border-soft)',
                marginTop: i === 0 ? 0 : 4,
                fontFamily: 'var(--tkm-font-body)',
              }}
            >
              {it.header}
            </div>
          ) : (
            <button
              key={i}
              onClick={() => {
                it.onClick();
                setOpen(false);
              }}
              title={it.title}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                width: '100%',
                background: 'transparent',
                color: 'var(--tkm-text-body)',
                border: 'none',
                borderBottom: i < items.length - 1 ? '1px solid var(--tkm-border-soft)' : 'none',
                padding: '0.45rem 0.75rem',
                fontFamily: 'var(--tkm-font-body)',
                fontSize: '0.82rem',
                textAlign: 'left',
                cursor: 'pointer',
                gap: '0.5rem',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = 'var(--tkm-bg-raised)';
                (e.currentTarget as HTMLElement).style.color = 'var(--tkm-text-h1)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = 'transparent';
                (e.currentTarget as HTMLElement).style.color = 'var(--tkm-text-body)';
              }}
            >
              <span>{it.label}</span>
              {it.badge !== undefined && it.badge > 0 && (
                <span
                  style={{
                    background: 'var(--tkm-danger)',
                    color: 'white',
                    fontSize: '0.7rem',
                    padding: '0 0.4rem',
                    borderRadius: 'var(--tkm-radius)',
                    fontFamily: 'var(--tkm-font-mono)',
                  }}
                >
                  {it.badge}
                </span>
              )}
            </button>
          ))}
        </div>,
        document.body
      )}
    </>
  );
}
