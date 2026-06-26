import { useMemo, useState } from 'react';
import { useEscapeKey } from '../hooks/useEscapeKey';
import { useGameStore } from '../../game/state/store';
import type { Legion, LegionDirective } from '../../game/systems/legion';
import { useT } from '../i18n';

/** 方略 — directive labels (one place, used by the builder, list & editor). */
const DIR_OPTS: Array<[LegionDirective['kind'], string, string]> = [
  ['conquer', '攻略', 'Conquer'],
  ['consume', '蠶食', 'Consume'],
  ['raid', '略地', 'Raid'],
  ['defend', '固守', 'Hold'],
];
const DIR_LABEL = (k: LegionDirective['kind'], en: boolean) => {
  const o = DIR_OPTS.find((d) => d[0] === k); return o ? (en ? o[2] : o[1]) : k;
};

/**
 * 軍團府 — form and dissolve legions. A legion is a marshal, a cluster
 * of your cities, and a directive (conquer a target / hold the line);
 * its orders auto-issue every tick through the ordinary pipeline.
 */
export function LegionsModal({ onClose }: { onClose: () => void }) {
  useEscapeKey(onClose);
  const legions = useGameStore((s) => s.legions ?? []);
  const cities = useGameStore((s) => s.cities);
  const officers = useGameStore((s) => s.officers);
  const playerForceId = useGameStore((s) => s.playerForceId);
  const createLegion = useGameStore((s) => s.createLegion);
  const disbandLegion = useGameStore((s) => s.disbandLegion);
  const updateLegion = useGameStore((s) => s.updateLegion);
  const t = useT();
  const dirLabel = (k: LegionDirective['kind']) => t(DIR_LABEL(k, false), DIR_LABEL(k, true));

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
  const [kind, setKind] = useState<LegionDirective['kind']>('conquer');
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
    && (kind !== 'conquer' || !!targetId);

  const create = () => {
    if (!canCreate) return;
    const directive: LegionDirective = kind === 'conquer' ? { kind: 'conquer', targetCityId: targetId } : ({ kind } as LegionDirective);
    createLegion({
      name: `第${'一二三四五六七八九十'[legions.length] ?? legions.length + 1}軍團`,
      commanderId,
      cityIds: [...picked],
      directive,
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
            <div key={l.id} style={box}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                <div style={{ fontSize: '0.85rem' }}>
                  <div style={{ color: '#e6c473' }}>
                    {l.name} · {t('都督', 'Marshal')} {cmd?.name.zh ?? '?'}
                    {cmd && <span style={{ color: '#7a8893', fontSize: '0.68rem' }}> (統{cmd.stats.leadership}·智{cmd.stats.intelligence})</span>}
                    <span style={{ color: l.directive.kind === 'defend' ? '#9ed68a' : '#ff9080', marginLeft: 8 }}>
                      {dirLabel(l.directive.kind)}{tgt ? ` ${tgt.name.zh}` : ''}
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
              {/* 軍團改編 — re-task in place without disband & rebuild. */}
              <div style={{ display: 'flex', gap: 8, marginTop: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.68rem', color: '#7a8893' }}>{t('改方略', 'Re-task')}</span>
                <select value={l.directive.kind}
                  onChange={(e) => {
                    const k = e.target.value as LegionDirective['kind'];
                    if (k === 'conquer') updateLegion(l.id, { directive: { kind: 'conquer', targetCityId: l.directive.kind === 'conquer' ? l.directive.targetCityId : (enemyCities[0]?.id ?? '') } });
                    else updateLegion(l.id, { directive: { kind: k } as LegionDirective });
                  }}
                  style={sel}>
                  {DIR_OPTS.map(([k]) => <option key={k} value={k}>{dirLabel(k)}</option>)}
                </select>
                {l.directive.kind === 'conquer' && (
                  <select value={l.directive.targetCityId} onChange={(e) => updateLegion(l.id, { directive: { kind: 'conquer', targetCityId: e.target.value } })} style={sel}>
                    {enemyCities.map((c) => <option key={c.id} value={c.id}>{c.name.zh}</option>)}
                  </select>
                )}
              </div>
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
              <select value={kind} onChange={(e) => setKind(e.target.value as LegionDirective['kind'])} style={sel}>
                {DIR_OPTS.map(([k]) => <option key={k} value={k}>{dirLabel(k)}</option>)}
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
