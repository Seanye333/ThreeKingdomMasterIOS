import { useMemo, useState } from 'react';
import { useGameStore } from '../../game/state/store';
import { TRIBES_BY_ID } from '../../game/data/tribes';
import { canCampaignTribe } from '../../game/systems/tribes';
import type { EntityId } from '../../game/types';
import { useT, useLanguage, pickName } from '../i18n';

interface Props {
  tribeId: string;
  onClose: () => void;
}

/** 異族部落 — frontier tribe diplomacy/war panel. Mirrors FortPanel's flow
 *  (pick officer + troops to campaign) but the target is a raid-source tribe
 *  rather than a capturable strongpoint. */
export function TribePanel({ tribeId, onClose }: Props) {
  const tribe = TRIBES_BY_ID[tribeId];
  const cities = useGameStore((s) => s.cities);
  const officersMap = useGameStore((s) => s.officers);
  const playerForceId = useGameStore((s) => s.playerForceId);
  const aggression = useGameStore((s) =>
    (s.tribeState.aggression as Record<string, number>)[tribeId] ?? tribe?.baseAggression ?? 0);
  const playerCapitalGold = useGameStore((s) => {
    const f = playerForceId ? s.forces[playerForceId] : null;
    const c = f ? s.cities[f.capitalCityId] : null;
    return c?.gold ?? 0;
  });
  const subjugateTribe = useGameStore((s) => s.subjugateTribe);
  const placateTribe = useGameStore((s) => s.placateTribe);
  const t = useT();
  const lang = useLanguage();

  const [pickOfficer, setPickOfficer] = useState<EntityId | null>(null);
  const [troops, setTroops] = useState(5000);
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  const candidates = useMemo(() => {
    if (!playerForceId || !tribe) return [];
    const validSourceCityIds = new Set<string>();
    for (const cid of tribe.raidableCityIds) {
      const c = cities[cid];
      if (!c) continue;
      if (c.ownerForceId === playerForceId) validSourceCityIds.add(c.id);
      for (const adjId of c.adjacentCityIds ?? []) {
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
  }, [tribe, cities, officersMap, playerForceId]);

  if (!tribe) return null;
  const reach = playerForceId
    ? canCampaignTribe(tribe, cities, playerForceId)
    : { ok: false, reason: 'No player force.' };
  const chosen = candidates.find((c) => c.officer.id === pickOfficer);
  const maxTroops = chosen ? chosen.city.troops : 0;
  if (candidates.length > 0 && !pickOfficer) setPickOfficer(candidates[0].officer.id);
  // 威脅 — aggression capped to ~0.4 for the bar.
  const threatPct = Math.max(0, Math.min(1, aggression / 0.4));
  const color = tribe.color;

  const doSubjugate = () => {
    if (!pickOfficer) return;
    const r = subjugateTribe(tribe.id, pickOfficer, Math.min(troops, maxTroops));
    setFeedback({ ok: r.ok, text: r.message });
  };
  const doPlacate = () => {
    const r = placateTribe(tribe.id);
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
          background: '#10161e',
          border: `2px solid ${color}`,
          padding: '1rem 1.2rem',
          color: '#eef4f8',
          fontFamily: 'var(--tkm-font-body)',
          minWidth: 360, maxWidth: 470,
          boxShadow: `0 0 16px ${color}`,
        }}
      >
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: '1.3rem', fontWeight: 'bold' }}>
              ⛺ {pickName(tribe.name, lang)}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#97a4ae' }}>
              {tribe.name.en} · {t('異族部落', 'Frontier Tribe')}
            </div>
          </div>
          <button onClick={onClose} style={{
            background: 'transparent', border: 'none', color: '#97a4ae',
            fontSize: '1.4rem', cursor: 'pointer', padding: 0,
          }}>×</button>
        </header>

        <div style={{ marginTop: '0.6rem', fontSize: '0.78rem', color: '#c8b89a', lineHeight: 1.5 }}>
          {tribe.descriptionZh ?? tribe.description}
        </div>

        <div style={{ marginTop: '0.7rem', display: 'grid', gridTemplateColumns: '70px 1fr', gap: '0.3rem 0.5rem', fontSize: '0.85rem' }}>
          <span style={{ color: '#7a8893' }}>{t('威脅', 'Threat')}</span>
          <span>
            <div style={{ height: 8, background: '#1e2832', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', position: 'relative', width: '100%' }}>
              <div style={{
                height: '100%', width: `${Math.round(threatPct * 100)}%`,
                background: threatPct > 0.6 ? '#b8442e' : threatPct > 0.3 ? '#c9a64e' : '#7ed68a',
              }} />
            </div>
            <span style={{ fontSize: '0.72rem', color: '#97a4ae' }}>
              {threatPct > 0.6 ? t('蠢蠢欲動', 'Restless') : threatPct > 0.3 ? t('時有寇邊', 'Probing') : t('暫且安分', 'Quiet')}
            </span>
          </span>

          <span style={{ color: '#7a8893' }}>{t('寇邊', 'Raids')}</span>
          <span style={{ fontSize: '0.78rem' }}>
            {tribe.raidableCityIds.map((id) => (cities[id] ? pickName(cities[id].name, lang) : id)).join(' · ')}
          </span>
        </div>

        {reach.ok && candidates.length > 0 && (
          <div style={{
            marginTop: '0.7rem', padding: '0.5rem 0.7rem',
            background: 'rgba(60, 26, 22, 0.4)', border: '1px solid #b8442e',
          }}>
            <div style={{ fontSize: '0.72rem', color: '#ff8060', marginBottom: '0.4rem' }}>
              {t('選將出征：', 'Pick officer to campaign:')}
            </div>
            <select
              value={pickOfficer ?? ''}
              onChange={(e) => {
                setPickOfficer(e.target.value);
                const c = candidates.find((c) => c.officer.id === e.target.value);
                if (c) setTroops(Math.min(5000, c.city.troops));
              }}
              style={{
                width: '100%', padding: '0.3rem 0.5rem',
                background: '#10161e', color: '#eef4f8', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px',
                fontFamily: 'var(--tkm-font-body)', fontSize: '0.82rem', marginBottom: '0.4rem',
              }}
            >
              {candidates.map(({ officer: o, city }) => (
                <option key={o.id} value={o.id}>
                  {pickName(o.name, lang)} (WAR {o.stats.war}) @ {pickName(city.name, lang)} ({city.troops.toLocaleString()}t)
                </option>
              ))}
            </select>
            <div style={{ fontSize: '0.78rem', marginBottom: '0.3rem' }}>
              {t('兵力', 'Troops')}: <strong>{troops.toLocaleString()}</strong> / {maxTroops.toLocaleString()}
            </div>
            <input
              type="range" min={1000} max={Math.max(1000, maxTroops)} step={500}
              value={troops}
              onChange={(e) => setTroops(parseInt(e.target.value, 10))}
              style={{ width: '100%' }}
            />
          </div>
        )}

        <div style={{ marginTop: '0.9rem', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            onClick={doSubjugate}
            disabled={!reach.ok || candidates.length === 0 || !pickOfficer}
            title={reach.ok ? '' : (reach.reason ?? '')}
            style={{
              background: '#3a1a1a', color: reach.ok ? '#ff8060' : '#97a4ae',
              border: `1px solid ${reach.ok ? '#b8442e' : '#364654'}`,
              padding: '0.4rem 0.8rem', cursor: reach.ok ? 'pointer' : 'not-allowed',
              fontFamily: 'var(--tkm-font-body)', fontSize: '0.85rem',
              opacity: reach.ok ? 1 : 0.5,
            }}
          >{t('征討', 'Subjugate')}</button>
          <button
            onClick={doPlacate}
            disabled={playerCapitalGold < 400}
            title={t('賜物招撫,降低威脅', 'Gifts to cool their aggression')}
            style={{
              background: '#1a2a3a', color: '#e6c473',
              border: '1px solid #e6c473',
              padding: '0.4rem 0.8rem', cursor: playerCapitalGold < 400 ? 'not-allowed' : 'pointer',
              fontFamily: 'var(--tkm-font-body)', fontSize: '0.85rem',
              opacity: playerCapitalGold < 400 ? 0.4 : 1,
            }}
          >{t('招撫', 'Placate')} (−400g)</button>
        </div>

        {feedback && (
          <div style={{
            marginTop: '0.7rem', padding: '0.4rem 0.6rem',
            background: feedback.ok ? 'rgba(30, 60, 30, 0.4)' : 'rgba(60, 30, 30, 0.4)',
            border: `1px solid ${feedback.ok ? '#7ed68a' : '#b8442e'}`,
            color: feedback.ok ? '#7ed68a' : '#ff8060', fontSize: '0.82rem',
          }}>{feedback.text}</div>
        )}
      </div>
    </div>
  );
}
