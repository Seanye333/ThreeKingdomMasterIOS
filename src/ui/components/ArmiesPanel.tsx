import { useState } from 'react';
import { useGameStore } from '../../game/state/store';

const IS_MOBILE = typeof window !== 'undefined'
  && (window.matchMedia?.('(pointer: coarse)')?.matches || window.innerWidth < 700);

/**
 * In-transit forces overview — lists the player's marching armies (the
 * persistent Army layer) with commander, troops, destination and ETA.
 * A read-only window onto the unit-on-the-map model.
 */
export function ArmiesPanel() {
  const playerForceId = useGameStore((s) => s.playerForceId);
  const armies = useGameStore((s) => s.armies);
  const officers = useGameStore((s) => s.officers);
  const cities = useGameStore((s) => s.cities);
  const selectedArmyId = useGameStore((s) => s.selectedArmyId);
  const selectArmy = useGameStore((s) => s.selectArmy);
  const cancelCommand = useGameStore((s) => s.cancelCommand);
  const holdArmy = useGameStore((s) => s.holdArmy);
  const resupplyArmy = useGameStore((s) => s.resupplyArmy);
  const splitArmy = useGameStore((s) => s.splitArmy);

  // 手機收納 — folded to a chip by default; the list is a tap away.
  const [open, setOpen] = useState(!IS_MOBILE);

  const mine = Object.values(armies).filter((a) => a.forceId === playerForceId);
  if (mine.length === 0) return null;

  if (IS_MOBILE && !open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{
          background: 'rgba(20, 14, 9, 0.88)', border: '1px solid #6a5536',
          color: '#e8d9b0', padding: '0.3rem 0.55rem', cursor: 'pointer',
          fontFamily: '"Songti SC", serif', fontSize: '0.72rem',
          pointerEvents: 'auto',
        }}
      >⚔ 在途 {mine.length}</button>
    );
  }

  return (
    <div style={{
      background: 'rgba(20, 14, 9, 0.86)',
      border: '1px solid #6a5536',
      padding: '0.35rem 0.5rem',
      fontFamily: '"Songti SC", serif',
      fontSize: '0.72rem',
      color: '#e8d9b0',
      minWidth: 150,
      maxWidth: 210,
      boxShadow: '0 0 10px rgba(0,0,0,0.6)',
      pointerEvents: 'auto',
    }}>
      <div style={{ fontSize: '0.62rem', letterSpacing: '0.15rem', color: '#8a7050', textTransform: 'uppercase', marginBottom: 3, display: 'flex', justifyContent: 'space-between' }}>
        <span>在途部隊 · Armies</span>
        {IS_MOBILE && (
          <button
            onClick={() => setOpen(false)}
            style={{ background: 'transparent', border: 'none', color: '#8a7050', cursor: 'pointer', fontSize: '0.7rem', padding: 0 }}
          >✕</button>
        )}
      </div>
      {selectedArmyId && armies[selectedArmyId] && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4, marginBottom: 3 }}>
          <span style={{ fontSize: '0.58rem', color: '#d4a84a' }}>點城改道 · 點野地進駐 · 點友軍合流 · 點近敵亲征</span>
          <div style={{ display: 'flex', gap: 4 }}>
            <button
              onClick={() => holdArmy(selectedArmyId)}
              style={{
                background: armies[selectedArmyId].holding ? '#2a3a1a' : '#1a2410',
                border: `1px solid ${armies[selectedArmyId].holding ? '#a8c87a' : '#5a7a3a'}`,
                color: armies[selectedArmyId].holding ? '#c8e8a0' : '#a8c87a',
                fontSize: '0.6rem', padding: '1px 6px', cursor: 'pointer',
                fontFamily: '"Songti SC", serif',
              }}
            >{armies[selectedArmyId].holding ? '解除' : '駐守'}</button>
            <button
              onClick={() => resupplyArmy(selectedArmyId)}
              style={{
                background: '#2a2410', border: '1px solid #b89a4a', color: '#e8d09a',
                fontSize: '0.6rem', padding: '1px 6px', cursor: 'pointer',
                fontFamily: '"Songti SC", serif',
              }}
              title="從最近的友城輸糧補給此軍(免其糧盡逃散)"
            >補給</button>
            {(armies[selectedArmyId].companionIds?.length ?? 0) > 0 && (
              <button
                onClick={() => splitArmy(selectedArmyId)}
                style={{
                  background: '#1a2030', border: '1px solid #5a78a0', color: '#a8c0e8',
                  fontSize: '0.6rem', padding: '1px 6px', cursor: 'pointer',
                  fontFamily: '"Songti SC", serif',
                }}
                title="分出一半兵力與一名副將,駐守當前格"
              >分兵</button>
            )}
            <button
              onClick={() => { cancelCommand(selectedArmyId); selectArmy(null); }}
              style={{
                background: '#3a1410', border: '1px solid #b8442e', color: '#e8a890',
                fontSize: '0.6rem', padding: '1px 6px', cursor: 'pointer',
                fontFamily: '"Songti SC", serif',
              }}
            >召回</button>
          </div>
        </div>
      )}
      {mine.map((a) => {
        const cmdr = officers[a.commanderId];
        const target = cities[a.targetCityId];
        const remaining = Math.max(1, Math.round((1 - a.progress) * a.totalSeasons));
        const troopLabel = a.troops >= 1000 ? `${(a.troops / 1000).toFixed(1)}k` : `${a.troops}`;
        const selected = a.id === selectedArmyId;
        const pct = Math.max(0, Math.min(100, Math.round(a.progress * 100)));
        const dest = a.cellTarget ? '野地' : (target?.name.zh ?? '?');
        // Three unambiguous states: 駐守 (parked, won't move) · 行軍 (advancing) ·
        // 抵達在即 (arriving next season).
        const status = a.holding
          ? { icon: '⏸', text: '駐守', color: '#a8c87a', tip: '原地駐守,本季不前進(可「解除」續行)' }
          : remaining <= 1
            ? { icon: '⚑', text: `${dest}·抵達在即`, color: '#f0d98a', tip: '下季抵達目的地' }
            : { icon: '▸', text: `${dest}·${remaining}季`, color: '#c0a878', tip: `行軍中 · 已行 ${pct}%` };
        return (
          <div
            key={a.id}
            onClick={() => selectArmy(selected ? null : a.id)}
            title={status.tip}
            style={{
              lineHeight: 1.4, cursor: 'pointer', padding: '1px 2px',
              background: selected ? 'rgba(212, 168, 74, 0.22)' : 'transparent',
              outline: selected ? '1px solid #d4a84a' : 'none',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 6 }}>
              <span style={{ color: '#ffe9a8', whiteSpace: 'nowrap' }}>
                {cmdr?.name.zh ?? '？'}
                <span style={{ color: '#8a7050', marginLeft: 4, fontSize: '0.62rem', fontFamily: 'ui-monospace, monospace' }}>{troopLabel}</span>
                {a.food !== undefined && (() => {
                  const seasons = Math.floor(a.food / Math.max(1, a.troops * 0.25));
                  return (
                    <span style={{ marginLeft: 4, fontSize: '0.58rem', color: seasons <= 1 ? '#e0707a' : seasons <= 3 ? '#e0a070' : '#8a9a6a' }} title={`隨軍糧 ${a.food.toLocaleString()} — 足 ${seasons} 季`}>
                      🌾{seasons}
                    </span>
                  );
                })()}
              </span>
              <span style={{ color: status.color, whiteSpace: 'nowrap' }}>
                {status.icon} {status.text}
              </span>
            </div>
            {/* advancement bar — only for armies actually on the move */}
            {!a.holding && a.totalSeasons > 1 && (
              <div style={{ height: 3, background: '#2a2010', borderRadius: 2, marginTop: 1, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pct}%`, background: status.color, transition: 'width 0.3s' }} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
