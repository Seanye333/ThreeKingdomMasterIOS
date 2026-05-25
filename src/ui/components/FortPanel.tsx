import { useMemo, useState } from 'react';
import { useGameStore } from '../../game/state/store';
import type { EntityId } from '../../game/types';
import { canPlayerAttackFort } from '../../game/data/forts';
import { useT } from '../i18n';

interface Props {
  fortId: EntityId;
  onClose: () => void;
}

const SUBTYPE_LABEL: Record<string, string> = {
  fort: '砦', stockade: '壘',
};

export function FortPanel({ fortId, onClose }: Props) {
  const fort = useGameStore((s) => s.forts[fortId]);
  const forces = useGameStore((s) => s.forces);
  const cities = useGameStore((s) => s.cities);
  const officersMap = useGameStore((s) => s.officers);
  const playerForceId = useGameStore((s) => s.playerForceId);
  const playerCapitalGold = useGameStore((s) => {
    const f = playerForceId ? s.forces[playerForceId] : null;
    const c = f ? s.cities[f.capitalCityId] : null;
    return c?.gold ?? 0;
  });
  const attackFort = useGameStore((s) => s.attackFort);
  const repairFort = useGameStore((s) => s.repairFort);
  const upgradeFort = useGameStore((s) => s.upgradeFort);
  const t = useT();

  const [pickOfficer, setPickOfficer] = useState<EntityId | null>(null);
  const [troops, setTroops] = useState(2000);
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  // Reachable officers — in a city that owns or borders any of fort.guards
  const candidates = useMemo(() => {
    if (!playerForceId || !fort) return [];
    const validSourceCityIds = new Set<string>();
    for (const guardId of fort.guards) {
      const guard = cities[guardId];
      if (!guard) continue;
      if (guard.ownerForceId === playerForceId) validSourceCityIds.add(guard.id);
      for (const adjId of guard.adjacentCityIds ?? []) {
        if (cities[adjId]?.ownerForceId === playerForceId) validSourceCityIds.add(adjId);
      }
    }
    return Object.values(officersMap)
      .filter((o) =>
        o.forceId === playerForceId
        && (o.status === 'idle' || o.status === 'active')
        && o.locationCityId
        && validSourceCityIds.has(o.locationCityId),
      )
      .map((o) => ({ officer: o, city: cities[o.locationCityId!]! }))
      .sort((a, b) => b.officer.stats.war - a.officer.stats.war);
  }, [fort, cities, officersMap, playerForceId]);

  if (!fort) return null;
  const owner = fort.ownerForceId ? forces[fort.ownerForceId] : null;
  const isMine = fort.ownerForceId === playerForceId;
  const ownerColor = owner?.color ?? '#5a4530';
  const hpPct = Math.max(0, Math.min(1, fort.hp / fort.maxHp));
  const reach = playerForceId
    ? canPlayerAttackFort(fort, cities, playerForceId)
    : { ok: false, reason: 'No player force.' };
  const chosen = candidates.find((c) => c.officer.id === pickOfficer);
  const maxTroops = chosen ? chosen.city.troops : 0;
  if (candidates.length > 0 && !pickOfficer) setPickOfficer(candidates[0].officer.id);

  const doAttack = () => {
    if (!pickOfficer) return;
    const r = attackFort(fort.id, pickOfficer, Math.min(troops, maxTroops));
    setFeedback({ ok: r.ok, text: r.message });
  };
  const doRepair = () => {
    const r = repairFort(fort.id);
    setFeedback({ ok: r.ok, text: r.message });
  };
  const doUpgrade = () => {
    const r = upgradeFort(fort.id);
    setFeedback({ ok: r.ok, text: r.message });
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.55)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 200,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#1a1410',
          border: `2px solid ${ownerColor}`,
          padding: '1rem 1.2rem',
          color: '#f0e0b0',
          fontFamily: 'Songti SC, serif',
          minWidth: 360, maxWidth: 460,
          boxShadow: `0 0 16px ${ownerColor}`,
        }}
      >
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: '1.3rem', fontWeight: 'bold' }}>
              {SUBTYPE_LABEL[fort.subtype] ?? '⚔'} {fort.name.zh}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#a89070' }}>
              {fort.name.en} · {fort.subtype === 'stockade' ? t('壘', 'Stockade') : t('砦', 'Fort')}
            </div>
          </div>
          <button onClick={onClose} style={{
            background: 'transparent', border: 'none', color: '#a89070',
            fontSize: '1.4rem', cursor: 'pointer', padding: 0,
          }}>×</button>
        </header>

        <div style={{ marginTop: '0.7rem', display: 'grid', gridTemplateColumns: '90px 1fr', gap: '0.3rem 0.5rem', fontSize: '0.85rem' }}>
          <span style={{ color: '#8a7050' }}>{t('歸屬', 'Owner')}</span>
          <span style={{ color: ownerColor, fontWeight: 'bold' }}>
            {owner?.name.zh ?? t('無主', 'Neutral')}
            {isMine && <span style={{ color: '#7ed68a', marginLeft: 6 }}>{t('（自軍）', '(yours)')}</span>}
          </span>

          <span style={{ color: '#8a7050' }}>{t('等級', 'Level')}</span>
          <span style={{ color: '#d4a84a', fontWeight: 'bold' }}>
            {'★'.repeat(fort.level ?? 1)}
            <span style={{ color: '#5a4530' }}>{'★'.repeat(3 - (fort.level ?? 1))}</span>
            <span style={{ color: '#8a7050', fontSize: '0.72rem', marginLeft: 6 }}>
              Lv {fort.level ?? 1}
            </span>
          </span>

          <span style={{ color: '#8a7050' }}>HP</span>
          <span>
            <div style={{ height: 8, background: '#3a2818', border: '1px solid #5a4530', position: 'relative', width: '100%' }}>
              <div style={{
                height: '100%',
                width: `${Math.round(hpPct * 100)}%`,
                background: hpPct > 0.5 ? '#7ed68a' : '#b8442e',
              }} />
            </div>
            <span style={{ fontSize: '0.72rem', color: '#a89070' }}>
              {fort.hp.toLocaleString()} / {fort.maxHp.toLocaleString()}
            </span>
          </span>

          <span style={{ color: '#8a7050' }}>{t('守護', 'Guards')}</span>
          <span style={{ fontSize: '0.78rem' }}>
            {fort.guards.map((id) => cities[id]?.name.zh ?? id).join(' · ')}
          </span>

          {fort.seasonsRemaining !== undefined && (
            <>
              <span style={{ color: '#8a7050' }}>{t('腐朽', 'Decay')}</span>
              <span style={{ color: '#c19a3b', fontSize: '0.78rem' }}>
                {t(`${fort.seasonsRemaining} 季後消失`, `Rots in ${fort.seasonsRemaining} season${fort.seasonsRemaining !== 1 ? 's' : ''}`)}
              </span>
            </>
          )}
        </div>

        {!isMine && reach.ok && candidates.length > 0 && (
          <div style={{
            marginTop: '0.7rem',
            padding: '0.5rem 0.7rem',
            background: 'rgba(60, 26, 22, 0.4)',
            border: '1px solid #b8442e',
          }}>
            <div style={{ fontSize: '0.72rem', color: '#ff8060', marginBottom: '0.4rem' }}>
              {t('選武將與兵力：', 'Pick officer + troops:')}
            </div>
            <select
              value={pickOfficer ?? ''}
              onChange={(e) => {
                setPickOfficer(e.target.value);
                const c = candidates.find((c) => c.officer.id === e.target.value);
                if (c) setTroops(Math.min(2000, c.city.troops));
              }}
              style={{
                width: '100%', padding: '0.3rem 0.5rem',
                background: '#1a1410', color: '#f0e0b0',
                border: '1px solid #5a4530',
                fontFamily: 'Songti SC, serif', fontSize: '0.82rem',
                marginBottom: '0.4rem',
              }}
            >
              {candidates.map(({ officer: o, city }) => (
                <option key={o.id} value={o.id}>
                  {o.name.zh} (WAR {o.stats.war}) @ {city.name.zh} ({city.troops.toLocaleString()}t)
                </option>
              ))}
            </select>
            <div style={{ fontSize: '0.78rem', marginBottom: '0.3rem' }}>
              {t('兵力', 'Troops')}: <strong>{troops.toLocaleString()}</strong> / {maxTroops.toLocaleString()}
            </div>
            <input
              type="range"
              min={500}
              max={maxTroops}
              step={500}
              value={troops}
              onChange={(e) => setTroops(parseInt(e.target.value, 10))}
              style={{ width: '100%' }}
            />
          </div>
        )}

        <div style={{ marginTop: '0.9rem', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {!isMine && (
            <button
              onClick={doAttack}
              disabled={!reach.ok || candidates.length === 0 || !pickOfficer}
              title={reach.ok ? 'Attack with selected officer' : (reach.reason ?? '')}
              style={{
                background: '#3a1a1a', color: reach.ok ? '#ff8060' : '#a89070',
                border: `1px solid ${reach.ok ? '#b8442e' : '#5a4530'}`,
                padding: '0.4rem 0.8rem',
                cursor: reach.ok ? 'pointer' : 'not-allowed',
                fontFamily: 'Songti SC, serif', fontSize: '0.85rem',
                opacity: reach.ok ? 1 : 0.5,
              }}
            >{t('攻砦', 'Attack')}</button>
          )}
          {isMine && (
            <>
              <button
                onClick={doRepair}
                disabled={fort.hp >= fort.maxHp || playerCapitalGold < 150}
                style={{
                  background: '#1a3a1a', color: '#7ed68a',
                  border: '1px solid #5a7a3a',
                  padding: '0.4rem 0.8rem', cursor: 'pointer',
                  fontFamily: 'Songti SC, serif', fontSize: '0.85rem',
                  opacity: fort.hp >= fort.maxHp || playerCapitalGold < 150 ? 0.4 : 1,
                }}
              >{t('修繕', 'Repair')} (+300 HP, −150g)</button>
              {(() => {
                const lv = fort.level ?? 1;
                const nextLv = lv + 1;
                const cost = nextLv === 2 ? 500 : nextLv === 3 ? 1200 : 0;
                if (lv >= 3) return null;
                return (
                  <button
                    onClick={doUpgrade}
                    disabled={playerCapitalGold < cost}
                    style={{
                      background: '#1a2a3a', color: '#d4a84a',
                      border: '1px solid #d4a84a',
                      padding: '0.4rem 0.8rem', cursor: 'pointer',
                      fontFamily: 'Songti SC, serif', fontSize: '0.85rem',
                      opacity: playerCapitalGold < cost ? 0.4 : 1,
                    }}
                    title={`Upgrade to Lv${nextLv} (+50% maxHp). Costs ${cost}g.`}
                  >{t('升級', 'Upgrade')} Lv{nextLv} ({cost}g)</button>
                );
              })()}
            </>
          )}
        </div>

        {feedback && (
          <div style={{
            marginTop: '0.7rem',
            padding: '0.4rem 0.6rem',
            background: feedback.ok ? 'rgba(30, 60, 30, 0.4)' : 'rgba(60, 30, 30, 0.4)',
            border: `1px solid ${feedback.ok ? '#7ed68a' : '#b8442e'}`,
            color: feedback.ok ? '#7ed68a' : '#ff8060',
            fontSize: '0.82rem',
          }}>{feedback.text}</div>
        )}
      </div>
    </div>
  );
}
