import { useState } from 'react';
import { useGameStore } from '../../game/state/store';
import { Icon } from './Icon';
import { useLanguage, pickName } from '../i18n';

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
  const recallMarch = useGameStore((s) => s.recallMarch);
  const holdArmy = useGameStore((s) => s.holdArmy);
  const resupplyArmy = useGameStore((s) => s.resupplyArmy);
  const splitArmy = useGameStore((s) => s.splitArmy);
  const lang = useLanguage();

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
          color: '#e6edf3', padding: '0.3rem 0.55rem', cursor: 'pointer',
          fontFamily: 'var(--tkm-font-body)', fontSize: '0.72rem',
          pointerEvents: 'auto',
        }}
      ><Icon name="war" size={12} /> {lang === 'en' ? 'In transit' : '在途'} {mine.length}</button>
    );
  }

  return (
    <div style={{
      background: 'rgba(20, 14, 9, 0.86)',
      border: '1px solid #6a5536',
      padding: '0.35rem 0.5rem',
      fontFamily: 'var(--tkm-font-body)',
      fontSize: '0.72rem',
      color: '#e6edf3',
      minWidth: 150,
      maxWidth: 210,
      boxShadow: '0 0 10px rgba(0,0,0,0.6)',
      pointerEvents: 'auto',
    }}>
      <div style={{ fontSize: '0.7rem', letterSpacing: '0.05rem', color: '#7a8893', textTransform: 'uppercase', marginBottom: 3, display: 'flex', justifyContent: 'space-between' }}>
        <span>{lang === 'en' ? 'Armies in transit' : '在途部隊'}</span>
        {IS_MOBILE && (
          <button
            onClick={() => setOpen(false)}
            style={{ background: 'transparent', border: 'none', color: '#7a8893', cursor: 'pointer', fontSize: '0.7rem', padding: 0 }}
          >✕</button>
        )}
      </div>
      {selectedArmyId && armies[selectedArmyId] && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4, marginBottom: 3 }}>
          <span style={{ fontSize: '0.58rem', color: '#e6c473' }}>{lang === 'en' ? 'Tap city to reroute · field to garrison · ally to merge · enemy to attack' : '點城改道 · 點野地進駐 · 點友軍合流 · 點近敵親征'}</span>
          <div style={{ display: 'flex', gap: 4 }}>
            <button
              onClick={() => holdArmy(selectedArmyId)}
              style={{
                background: armies[selectedArmyId].holding ? '#2a3a1a' : '#1a2410',
                border: `1px solid ${armies[selectedArmyId].holding ? '#a8c87a' : '#5a7a3a'}`,
                color: armies[selectedArmyId].holding ? '#c8e8a0' : '#a8c87a',
                fontSize: '0.7rem', padding: '1px 6px', cursor: 'pointer',
                fontFamily: 'var(--tkm-font-body)',
              }}
            >{armies[selectedArmyId].holding ? (lang === 'en' ? 'Release' : '解除') : (lang === 'en' ? 'Hold' : '駐守')}</button>
            <button
              onClick={() => resupplyArmy(selectedArmyId)}
              style={{
                background: '#2a2410', border: '1px solid #b89a4a', color: '#e8d09a',
                fontSize: '0.7rem', padding: '1px 6px', cursor: 'pointer',
                fontFamily: 'var(--tkm-font-body)',
              }}
              title={lang === 'en' ? 'Resupply this army from the nearest friendly city (so it won’t starve and scatter)' : '從最近的友城輸糧補給此軍(免其糧盡逃散)'}
            >{lang === 'en' ? 'Supply' : '補給'}</button>
            {(armies[selectedArmyId].companionIds?.length ?? 0) > 0 && (
              <button
                onClick={() => splitArmy(selectedArmyId)}
                style={{
                  background: '#1a2030', border: '1px solid #5a78a0', color: '#a8c0e8',
                  fontSize: '0.7rem', padding: '1px 6px', cursor: 'pointer',
                  fontFamily: 'var(--tkm-font-body)',
                }}
                title={lang === 'en' ? 'Split off half the troops with one lieutenant to hold this tile' : '分出一半兵力與一名副將,駐守當前格'}
              >{lang === 'en' ? 'Split' : '分兵'}</button>
            )}
            <button
              onClick={() => {
                // 召回 — turn a column still on the road home (keeps most troops,
                // streams back over the distance covered). If it's already
                // arriving / can't turn, fall back to disbanding it outright.
                const r = recallMarch(selectedArmyId);
                if (!r.ok) { cancelCommand(selectedArmyId); selectArmy(null); }
              }}
              style={{
                background: '#3a1410', border: '1px solid #b8442e', color: '#e8a890',
                fontSize: '0.7rem', padding: '1px 6px', cursor: 'pointer',
                fontFamily: 'var(--tkm-font-body)',
              }}
              title={lang === 'en' ? 'Recall — turn the column home (keeps most troops; deeper marches shed more stragglers)' : '召回 — 折返本城(保留大部兵力;行得越深散卒越多)'}
            >{lang === 'en' ? 'Recall' : '召回'}</button>
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
        const dest = a.cellTarget ? (lang === 'en' ? 'field' : '野地') : (target ? pickName(target.name, lang) : '?');
        // States: returning home · hold (parked) · marching · arriving next season.
        const status = a.returning
          ? { icon: '↩', text: lang === 'en' ? `home · ${remaining}s` : `歸返·${remaining}季`, color: '#c79a6a', tip: lang === 'en' ? 'Recalled — streaming home; merges into its source city on arrival' : '已召回,折返本城,抵達即併入守軍' }
          : a.holding
          ? { icon: '⏸', text: lang === 'en' ? 'Hold' : '駐守', color: '#a8c87a', tip: lang === 'en' ? 'Holding position; won’t advance this season (Release to resume)' : '原地駐守,本季不前進(可「解除」續行)' }
          : remaining <= 1
            ? { icon: '⚑', text: lang === 'en' ? `${dest} · arriving` : `${dest}·抵達在即`, color: '#f2dd9a', tip: lang === 'en' ? 'Arrives next season' : '下季抵達目的地' }
            : { icon: '▸', text: lang === 'en' ? `${dest} · ${remaining}s` : `${dest}·${remaining}季`, color: '#aab6c0', tip: lang === 'en' ? `Marching · ${pct}% done` : `行軍中 · 已行 ${pct}%` };
        return (
          <div
            key={a.id}
            onClick={() => selectArmy(selected ? null : a.id)}
            title={status.tip}
            style={{
              lineHeight: 1.4, cursor: 'pointer', padding: '1px 2px',
              background: selected ? 'rgba(212, 168, 74, 0.22)' : 'transparent',
              outline: selected ? '1px solid #e6c473' : 'none',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 6 }}>
              <span style={{ color: '#ffe9a8', whiteSpace: 'nowrap' }}>
                {cmdr?.name.zh ?? '？'}
                <span style={{ color: '#7a8893', marginLeft: 4, fontSize: '0.7rem', fontFamily: 'ui-monospace, monospace' }}>{troopLabel}</span>
                {a.food !== undefined && (() => {
                  const seasons = Math.floor(a.food / Math.max(1, a.troops * 0.25));
                  return (
                    <span style={{ marginLeft: 4, fontSize: '0.58rem', color: seasons <= 1 ? '#e0707a' : seasons <= 3 ? '#e0a070' : '#8a9a6a', display: 'inline-flex', alignItems: 'center', gap: 2 }} title={lang === 'en' ? `Provisions ${a.food.toLocaleString()} — ${seasons} season(s)` : `隨軍糧 ${a.food.toLocaleString()} — 足 ${seasons} 季`}>
                      <Icon name="grain" size={10} />{seasons}
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
