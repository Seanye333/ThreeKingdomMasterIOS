import { useEffect, useRef, useState } from 'react';
import { useGameStore } from '../../game/state/store';
import { playSfx } from '../../game/systems/sound';
import { useT } from '../i18n';
import { Seal } from './Seal';

interface Toast { key: number; zh: string; en: string; tone: 'ok' | 'warn' }

/**
 * 戰略層回饋 — transient confirmation toasts for the player's issued orders
 * (委派/出兵/委任). The store flips `actionToast` (keyed) on each order; this
 * stacks them top-centre and auto-expires them, so every command lands with a
 * crisp "✓ done" instead of the gold silently vanishing.
 */
export function ActionToasts() {
  const toast = useGameStore((s) => s.actionToast);
  const t = useT();
  const [stack, setStack] = useState<Toast[]>([]);
  const lastKey = useRef(0);

  useEffect(() => {
    if (!toast || toast.key === lastKey.current) return;
    lastKey.current = toast.key;
    const incoming = toast;
    setStack((s) => [...s, incoming].slice(-4));
    playSfx(incoming.tone === 'warn' ? 'whoosh' : 'pluck');
    const id = setTimeout(
      () => setStack((s) => s.filter((x) => x.key !== incoming.key)),
      2400,
    );
    return () => clearTimeout(id);
  }, [toast?.key]); // eslint-disable-line react-hooks/exhaustive-deps

  if (stack.length === 0) return null;
  return (
    <div style={{
      position: 'fixed', top: 64, left: '50%', transform: 'translateX(-50%)',
      zIndex: 60, display: 'flex', flexDirection: 'column', gap: 6,
      alignItems: 'center', pointerEvents: 'none', maxWidth: '92vw',
    }}>
      {stack.map((x) => (
        <div
          key={x.key}
          className="tkm-action-toast"
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'rgba(20, 14, 8, 0.94)',
            border: `1px solid ${x.tone === 'warn' ? '#c08a4a' : '#6fae73'}`,
            color: '#eef4f8', fontFamily: 'var(--tkm-font-body)', fontSize: '0.84rem',
            padding: '0.34rem 0.5rem 0.34rem 0.85rem', borderRadius: 4,
            boxShadow: '0 2px 12px rgba(0,0,0,0.55)', whiteSpace: 'nowrap',
            overflow: 'hidden', maxWidth: '92vw',
          }}
        >
          {/* 朱印 — a confirmed order earns a stamped 「令」 chop; a reversal
              keeps the amber ↺. */}
          {x.tone === 'warn' ? (
            <span style={{ color: '#e0b070' }}>↺</span>
          ) : (
            <span className="tkm-seal-stamp" style={{ lineHeight: 0, flexShrink: 0 }}>
              <Seal chars="令" size={22} rotate={0} />
            </span>
          )}
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{t(x.zh, x.en)}</span>
        </div>
      ))}
    </div>
  );
}
