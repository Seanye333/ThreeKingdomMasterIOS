import { useMemo, useState } from 'react';
import { useGameStore } from '../../game/state/store';
import type { Legion } from '../../game/systems/legion';
import { useT } from '../i18n';

/**
 * 軍團府 — form and dissolve legions. A legion is a marshal, a cluster
 * of your cities, and a directive (conquer a target / hold the line);
 * its orders auto-issue every tick through the ordinary pipeline.
 */
export function LegionsModal({ onClose }: { onClose: () => void }) {
  const legions = useGameStore((s) => s.legions ?? []);
  const cities = useGameStore((s) => s.cities);
  const officers = useGameStore((s) => s.officers);
  const playerForceId = useGameStore((s) => s.playerForceId);
  const createLegion = useGameStore((s) => s.createLegion);
  const disbandLegion = useGameStore((s) => s.disbandLegion);
  const t = useT();

  const ownCities = useMemo(
    () => Object.values(cities).filter((c) => c.ownerForceId === playerForceId),
    [cities, playerForceId],
  );
  const enemyCities = useMemo(
    () => Object.values(cities).filter((c) => c.ownerForceId && c.ownerForceId !== playerForceId),
    [cities, playerForceId],
  );
  const assigned = useMemo(
    () => new Set(legions.flatMap((l) => l.cityIds)),
    [legions],
  );

  // ── builder state ──
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [commanderId, setCommanderId] = useState('');
  const [kind, setKind] = useState<'conquer' | 'defend'>('conquer');
  const [targetId, setTargetId] = useState('');

  const candidates = useMemo(
    () => Object.values(officers)
      .filter((o) => o.forceId === playerForceId
        && o.status !== 'dead' && o.status !== 'imprisoned' && o.status !== 'unsearched'
        && o.locationCityId && picked.has(o.locationCityId))
      .sort((a, b) => b.stats.leadership - a.stats.leadership),
    [officers, playerForceId, picked],
  );

  const canCreate = picked.size > 0 && commanderId
    && (kind === 'defend' || targetId);

  const create = () => {
    if (!canCreate) return;
    createLegion({
      name: `第${'一二三四五六七八九十'[legions.length] ?? legions.length + 1}軍團`,
      commanderId,
      cityIds: [...picked],
      directive: kind === 'conquer'
        ? { kind: 'conquer', targetCityId: targetId }
        : { kind: 'defend' },
    });
    setPicked(new Set());
    setCommanderId('');
    setTargetId('');
  };

  const box: React.CSSProperties = {
    background: '#10161e', border: '1px solid #2b3845', padding: '0.6rem 0.8rem', marginBottom: '0.6rem',
  };

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'grid', placeItems: 'center', zIndex: 900, padding: '1rem' }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'linear-gradient(160deg,#1b2531,#10161e)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px',
          width: 'min(640px,100%)', maxHeight: '88vh', overflowY: 'auto',
          color: '#e6edf3', fontFamily: 'var(--tkm-font-body)', padding: '1rem 1.4rem',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.6rem' }}>
          <div>
            <div style={{ fontSize: '1.3rem', color: '#e6c473', letterSpacing: '0.07rem' }}>⚔ {t('軍團府', 'Legions')}</div>
            <div style={{ fontSize: '0.75rem', color: '#7a8893' }}>
              {t('劃城設督,授以方略 — 軍團每旬自行募兵發兵(內政請配合委任太守)', 'Assign cities to a marshal with a directive — the legion recruits and marches itself each tick')}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#e6c473', fontSize: '1.4rem', cursor: 'pointer' }}>×</button>
        </div>

        {/* Active legions */}
        {legions.map((l: Legion) => {
          const cmd = officers[l.commanderId];
          const tgt = l.directive.kind === 'conquer' ? cities[l.directive.targetCityId] : null;
          return (
            <div key={l.id} style={{ ...box, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
              <div style={{ fontSize: '0.85rem' }}>
                <div style={{ color: '#e6c473' }}>
                  {l.name} · {t('都督', 'Marshal')} {cmd?.name.zh ?? '?'}
                  <span style={{ color: l.directive.kind === 'conquer' ? '#ff9080' : '#9ed68a', marginLeft: 8 }}>
                    {l.directive.kind === 'conquer' ? `${t('攻略', 'Conquer')} ${tgt?.name.zh ?? '?'}` : t('固守', 'Hold')}
                  </span>
                </div>
                <div style={{ fontSize: '0.7rem', color: '#7a8893' }}>
                  {l.cityIds.map((cid) => cities[cid]?.name.zh ?? cid).join('、')}
                </div>
              </div>
              <button
                onClick={() => disbandLegion(l.id)}
                style={{ background: '#3a1410', border: '1px solid #b8442e', color: '#e8a890', padding: '0.25rem 0.6rem', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.75rem' }}
              >{t('解散', 'Disband')}</button>
            </div>
          );
        })}

        {/* Builder */}
        <div style={box}>
          <div style={{ fontSize: '0.72rem', letterSpacing: '0.07rem', color: '#c9a64e', marginBottom: 6 }}>{t('新設軍團', 'NEW LEGION')}</div>
          <div style={{ fontSize: '0.72rem', color: '#7a8893', marginBottom: 4 }}>{t('① 劃撥城池(未入他團者)', '1. Assign cities')}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
            {ownCities.filter((c) => !assigned.has(c.id)).map((c) => {
              const on = picked.has(c.id);
              return (
                <button
                  key={c.id}
                  onClick={() => setPicked((prev) => {
                    const next = new Set(prev);
                    if (next.has(c.id)) next.delete(c.id); else next.add(c.id);
                    return next;
                  })}
                  style={{
                    background: on ? 'rgba(212,168,74,0.22)' : 'transparent',
                    border: `1px solid ${on ? '#e6c473' : '#26323e'}`,
                    color: on ? '#f2dd9a' : '#a08a60',
                    padding: '0.18rem 0.5rem', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.75rem',
                  }}
                >{c.name.zh}</button>
              );
            })}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
            <label style={{ fontSize: '0.75rem' }}>
              {t('② 都督', '2. Marshal')}{' '}
              <select value={commanderId} onChange={(e) => setCommanderId(e.target.value)} style={sel}>
                <option value="">—</option>
                {candidates.map((o) => (
                  <option key={o.id} value={o.id}>{o.name.zh}(統{o.stats.leadership})</option>
                ))}
              </select>
            </label>
            <label style={{ fontSize: '0.75rem' }}>
              {t('③ 方略', '3. Directive')}{' '}
              <select value={kind} onChange={(e) => setKind(e.target.value as 'conquer' | 'defend')} style={sel}>
                <option value="conquer">{t('攻略', 'Conquer')}</option>
                <option value="defend">{t('固守', 'Hold')}</option>
              </select>
            </label>
            {kind === 'conquer' && (
              <select value={targetId} onChange={(e) => setTargetId(e.target.value)} style={sel}>
                <option value="">{t('目標城…', 'Target…')}</option>
                {enemyCities.map((c) => (
                  <option key={c.id} value={c.id}>{c.name.zh}</option>
                ))}
              </select>
            )}
            <button
              onClick={create}
              disabled={!canCreate}
              style={{
                background: canCreate ? 'linear-gradient(180deg,#3a2d18,#2a1f10)' : 'transparent',
                border: `1px solid ${canCreate ? '#e6c473' : '#26323e'}`,
                color: canCreate ? '#f2dd9a' : '#5a4a35',
                padding: '0.3rem 0.9rem', cursor: canCreate ? 'pointer' : 'not-allowed',
                fontFamily: 'inherit', letterSpacing: '0.05rem',
              }}
            >{t('成軍', 'Form')}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

const sel: React.CSSProperties = {
  background: '#080b0e', border: '1px solid #2b3845', color: '#e6c473',
  padding: '0.2rem', fontFamily: 'inherit', fontSize: '0.75rem', maxWidth: 150,
};
