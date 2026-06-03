import { useGameStore } from '../../game/state/store';

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

  const mine = Object.values(armies).filter((a) => a.forceId === playerForceId);
  if (mine.length === 0) return null;

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
      <div style={{ fontSize: '0.62rem', letterSpacing: '0.15rem', color: '#8a7050', textTransform: 'uppercase', marginBottom: 3 }}>
        在途部隊 · Armies
      </div>
      {selectedArmyId && armies[selectedArmyId] && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4, marginBottom: 3 }}>
          <span style={{ fontSize: '0.58rem', color: '#d4a84a' }}>點城改道 · 點野地進駐 · 點近處友軍合流</span>
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
        return (
          <div
            key={a.id}
            onClick={() => selectArmy(selected ? null : a.id)}
            style={{
              display: 'flex', justifyContent: 'space-between', gap: 6, lineHeight: 1.5,
              cursor: 'pointer', padding: '0 2px',
              background: selected ? 'rgba(212, 168, 74, 0.22)' : 'transparent',
              outline: selected ? '1px solid #d4a84a' : 'none',
            }}
          >
            <span style={{ color: '#ffe9a8', whiteSpace: 'nowrap' }}>
              {cmdr?.name.zh ?? '？'}
              <span style={{ color: '#8a7050', marginLeft: 4, fontSize: '0.62rem', fontFamily: 'ui-monospace, monospace' }}>{troopLabel}</span>
            </span>
            <span style={{ color: a.holding ? '#a8c87a' : '#c0a878', whiteSpace: 'nowrap' }}>
              {a.holding ? '駐守中'
                : a.cellTarget ? `▸野地 ${a.totalSeasons > 1 ? `${remaining}季` : ''}`
                : `▸${target?.name.zh ?? '?'} ${a.totalSeasons > 1 ? `${remaining}季` : ''}`}
            </span>
          </div>
        );
      })}
    </div>
  );
}
