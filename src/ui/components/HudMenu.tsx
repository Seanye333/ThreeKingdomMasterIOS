import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Tip } from './Tip';
import { playSfx } from '../../game/systems/sound';
import { useEscapeKey } from '../hooks/useEscapeKey';
import { Z } from '../zIndex';

interface MenuItem {
  label: ReactNode;
  onClick: () => void;
  /** Show a small badge next to the label. */
  badge?: number;
  title?: string;
  /**
   * 一代記的權限閘門 — 對應 careerAuthority 的命令 id。
   * 留空表示個人的事,白身也做得了。過濾在 MapScreen 做,這裡只帶著。
   */
  gate?: string;
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
 *
 * 鍵盤與讀屏(2026-07-29) — the six top-bar menus (內政/軍務/外交/朝堂/人才/記錄)
 * are the main way into most of the game, and they were mouse-only: the trigger
 * announced nothing about having a menu or being open, the list had no menu
 * semantics, Escape did not close it, and focus never entered it. The items
 * themselves were always real <button>s — an earlier audit claimed otherwise,
 * having enumerated `document.querySelectorAll('button')` and truncated the
 * list before reaching the portal at the end of <body>.
 */
export function HudMenu({ label, items, title }: Props) {
  const [open, setOpen] = useState(false);
  const menuId = useId();
  // Index of the item the arrow keys have walked to; -1 = focus still on the
  // trigger. Headers are skipped, so this indexes into `items` directly and
  // the movement helper hops over them.
  const [cursor, setCursor] = useState(-1);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);
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

  const close = useCallback((restoreFocus: boolean) => {
    setOpen(false);
    setCursor(-1);
    if (restoreFocus) triggerRef.current?.focus();
  }, []);

  // Esc 關閉 — goes on the shared escape stack rather than a local listener, so
  // a menu left open over a modal peels in the right order, and the map's own
  // Esc-to-deselect yields while it is up (StrategicMap3D checks hasEscapeLayers).
  useEscapeKey(useCallback(() => close(true), [close]), open);

  // Move the arrow-key cursor to the next selectable item, skipping headers.
  const step = useCallback((dir: 1 | -1) => {
    setCursor((cur) => {
      const n = items.length;
      for (let i = 1; i <= n; i++) {
        const next = (cur + dir * i + n * 2) % n;
        if (!isHeader(items[next])) return next;
      }
      return cur;
    });
  }, [items]);

  // Focus follows the cursor so the reader announces each item as you walk.
  useEffect(() => {
    if (!open || cursor < 0) return;
    itemRefs.current[cursor]?.focus();
  }, [open, cursor]);

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
          aria-haspopup="menu"
          aria-expanded={open}
          aria-controls={open ? menuId : undefined}
          onClick={(e) => {
            // `detail === 0` means the click came from Enter/Space, not a mouse.
            // Keyboard users expect to land inside the menu; mouse users would
            // find focus jumping under the cursor jarring, so only the former
            // gets the cursor pre-placed.
            const viaKeyboard = e.detail === 0;
            setOpen((o) => {
              if (!o) playSfx('click');
              setCursor(!o && viaKeyboard ? items.findIndex((it) => !isHeader(it)) : -1);
              return !o;
            });
          }}
          onKeyDown={(e) => {
            if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
            e.preventDefault();
            if (!open) {
              setOpen(true);
              setCursor(
                e.key === 'ArrowDown'
                  ? items.findIndex((it) => !isHeader(it))
                  : items.map(isHeader).lastIndexOf(false),
              );
            } else {
              step(e.key === 'ArrowDown' ? 1 : -1);
            }
          }}
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
          id={menuId}
          role="menu"
          aria-label={typeof title === 'string' ? title : undefined}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') { e.preventDefault(); step(1); }
            else if (e.key === 'ArrowUp') { e.preventDefault(); step(-1); }
            else if (e.key === 'Home') { e.preventDefault(); setCursor(items.findIndex((it) => !isHeader(it))); }
            else if (e.key === 'End') { e.preventDefault(); setCursor(items.map(isHeader).lastIndexOf(false)); }
            else if (e.key === 'Tab') { close(false); }
          }}
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
            zIndex: Z.dropdown,
            animation: 'tkmFadeIn 0.12s ease-out',
          }}
        >
          {items.map((it, i) => isHeader(it) ? (
            <div
              key={i}
              role="presentation"
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
              ref={(el) => { itemRefs.current[i] = el; }}
              role="menuitem"
              // Roving tabindex: only the item the cursor is on is tabbable, so
              // Tab leaves the menu instead of walking every entry in it.
              tabIndex={cursor === i ? 0 : -1}
              onClick={() => {
                it.onClick();
                close(false);
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
