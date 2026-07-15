import { useMemo, useRef, useState } from 'react';
import { useT } from '../i18n';

export interface PaletteCommand {
  id: string;
  zh: string;
  en: string;
  /** Short context line (group/where). */
  hint?: string;
  run: () => void;
}

/**
 * 命令臺 — a keyboard-first command palette (open with / or ⌘K). Type to fuzzy-
 * match any panel or action, ↑↓ to move, ↵ to run. One doorway to the whole
 * HUD so a power player never hunts through menus. Stateless beyond its query/
 * cursor; the parent owns the command list and what each one does.
 */
export function CommandPalette({ commands, onClose }: { commands: PaletteCommand[]; onClose: () => void }) {
  const t = useT();
  const [query, setQuery] = useState('');
  const [cursor, setCursor] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    // Subsequence ("fuzzy") match on the combined zh/en/hint haystack.
    const matches = (hay: string) => {
      hay = hay.toLowerCase();
      if (hay.includes(q)) return true;
      let i = 0;
      for (const ch of hay) { if (ch === q[i]) i++; if (i === q.length) return true; }
      return false;
    };
    return commands.filter((c) => matches(`${c.zh} ${c.en} ${c.hint ?? ''}`));
  }, [commands, query]);

  const clampCursor = (n: number) => Math.max(0, Math.min(filtered.length - 1, n));
  const runAt = (i: number) => {
    const cmd = filtered[i];
    if (cmd) { cmd.run(); onClose(); }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setCursor((c) => clampCursor(c + 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setCursor((c) => clampCursor(c - 1)); }
    else if (e.key === 'Enter') { e.preventDefault(); runAt(cursor); }
    else if (e.key === 'Escape') { e.preventDefault(); onClose(); }
  };

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'grid', placeItems: 'start center', zIndex: 950, padding: 'calc(12vh + var(--tkm-safe-top)) calc(1rem + var(--tkm-safe-right)) 1rem calc(1rem + var(--tkm-safe-left))' }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: 'linear-gradient(160deg,#1b2531,#0e141b)', border: '1px solid rgba(255,255,255,0.1)',
        width: 'min(520px,100%)', maxHeight: '70vh', display: 'flex', flexDirection: 'column',
        color: '#e6edf3', fontFamily: 'var(--tkm-font-body)', borderRadius: 'var(--tkm-radius-lg)',
        boxShadow: '0 18px 50px rgba(0,0,0,0.6)', overflow: 'hidden',
      }}>
        <input
          autoFocus
          value={query}
          onChange={(e) => { setQuery(e.target.value); setCursor(0); }}
          onKeyDown={onKeyDown}
          placeholder={t('命令臺 — 鍵入面板或指令…', 'Command — type a panel or action…')}
          style={{
            background: '#14100a', border: 'none', borderBottom: '1px solid #2b3845',
            color: '#eef4f8', padding: '0.7rem 0.9rem', fontFamily: 'inherit', fontSize: '0.95rem', outline: 'none',
          }}
        />
        <div ref={listRef} style={{ overflowY: 'auto' }}>
          {filtered.length === 0 ? (
            <div style={{ color: '#7a8893', fontSize: '0.85rem', padding: '1rem' }}>{t('無相符指令', 'No matching command')}</div>
          ) : filtered.map((c, i) => (
            <div
              key={c.id}
              onClick={() => runAt(i)}
              onMouseEnter={() => setCursor(i)}
              style={{
                display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10,
                padding: '0.5rem 0.9rem', cursor: 'pointer',
                background: i === cursor ? 'rgba(212,168,74,0.16)' : 'transparent',
                borderLeft: `3px solid ${i === cursor ? '#e6c473' : 'transparent'}`,
              }}
            >
              <span style={{ color: i === cursor ? '#f2dd9a' : '#cdd8e0', fontSize: '0.9rem' }}>{t(c.zh, c.en)}</span>
              {c.hint && <span style={{ color: '#7a8893', fontSize: '0.72rem', whiteSpace: 'nowrap' }}>{c.hint}</span>}
            </div>
          ))}
        </div>
        <div style={{ borderTop: '1px solid #243240', padding: '0.35rem 0.9rem', color: '#5f6c76', fontSize: '0.7rem', display: 'flex', gap: 12 }}>
          <span>↑↓ {t('選擇', 'move')}</span>
          <span>↵ {t('執行', 'run')}</span>
          <span>esc {t('關閉', 'close')}</span>
        </div>
      </div>
    </div>
  );
}
