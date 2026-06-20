import { useEffect, useRef, useState } from 'react';
import { useGameStore } from '../../../game/state/store';
import { pickName, useLanguage, useT } from '../../i18n';
import type { BoutRecord } from '../../../game/systems/duelHall';
import { DuelArena3D, type DuelArenaEvent } from './DuelArena3D';
import { DebateArena3D, type DebateArenaEvent } from '../debate/DebateArena3D';

/**
 * 名局重演 — replays a saved {@link BoutRecord} through the matching 3D arena,
 * stepping its recorded exchanges at a live cadence. Used by the Hall of Famous
 * Bouts; mounts the arena standalone (full-screen) with a 返回 control.
 */
export function BoutReplay3D({ rec, onClose }: { rec: BoutRecord; onClose: () => void }) {
  const officers = useGameStore((s) => s.officers);
  const lang = useLanguage();
  const t = useT();
  const a = officers[rec.aId];
  const b = officers[rec.dId];
  const [event, setEvent] = useState<{ key: number } | null>(null);
  const [playKey, setPlayKey] = useState(0); // bump to replay from the top
  const keyRef = useRef(0);

  useEffect(() => {
    let i = 0;
    let timer = 0;
    const step = () => {
      if (i >= rec.fx.length) return;
      keyRef.current += 1;
      setEvent({ ...(rec.fx[i] as object), key: keyRef.current } as { key: number });
      i += 1;
      timer = window.setTimeout(step, 950);
    };
    // small delay so the arena mounts before the first exchange lands
    timer = window.setTimeout(step, 400);
    return () => window.clearTimeout(timer);
  }, [rec, playKey]);

  if (!a || !b) {
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0b0f14', color: '#c8b8a0' }}>
        <div>
          {t('史料散佚,無法重演此局。', 'The record is incomplete — this bout cannot be replayed.')}
          <div style={{ textAlign: 'center', marginTop: 12 }}>
            <button onClick={onClose} style={btnStyle('#88b7e8', '#d8ecff')}>{t('返回', 'Back')}</button>
          </div>
        </div>
      </div>
    );
  }

  const leftName = pickName(a.name, lang);
  const rightName = pickName(b.name, lang);

  return (
    <>
      {rec.kind === 'duel'
        ? <DuelArena3D attacker={a} defender={b} leftName={leftName} rightName={rightName} event={event as DuelArenaEvent | null} />
        : <DebateArena3D me={a} foe={b} leftName={leftName} rightName={rightName} event={event as DebateArenaEvent | null} />}

      <div style={{ position: 'fixed', left: '50%', bottom: 24, transform: 'translateX(-50%)', display: 'flex', gap: 8, zIndex: 210, pointerEvents: 'auto' }}>
        <button onClick={() => { keyRef.current = 0; setEvent(null); setPlayKey((k) => k + 1); }} style={btnStyle('#6aae73', '#cfe8c8')}>🔁 {t('重演', 'Replay')}</button>
        <button onClick={onClose} style={btnStyle('#e6c473', '#f2dd9a')}>✕ {t('返回', 'Back')}</button>
      </div>
    </>
  );
}

function btnStyle(border: string, color: string): React.CSSProperties {
  return {
    padding: '0.45rem 1rem', background: 'rgba(20,28,38,0.94)', border: `1px solid ${border}`,
    borderRadius: 5, color, cursor: 'pointer', fontFamily: 'var(--tkm-font-body)', fontSize: '0.9rem',
  };
}
