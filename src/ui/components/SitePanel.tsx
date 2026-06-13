import { useMemo, useState } from 'react';
import { useGameStore } from '../../game/state/store';
import { canPlayerSeizeSite, RESOURCE_SITE_DEFS, siteActionVerb } from '../../game/data/sites';
import type { EntityId, SiteSubtype } from '../../game/types';
import { useT } from '../i18n';

interface Props {
  siteId: EntityId;
  onClose: () => void;
}

const SUBTYPE_LABEL: Record<SiteSubtype, { zh: string; en: string; glyph: string }> = {
  bandit:   { zh: '山賊', en: 'Bandit Nest', glyph: '🏴' },
  ford:     { zh: '渡口', en: 'River Ford', glyph: '⛵' },
  resource: { zh: '礦場', en: 'Resource', glyph: '⛏' },
};

export function SitePanel({ siteId, onClose }: Props) {
  const site = useGameStore((s) => s.sites[siteId]);
  const forces = useGameStore((s) => s.forces);
  const cities = useGameStore((s) => s.cities);
  const officersMap = useGameStore((s) => s.officers);
  const playerForceId = useGameStore((s) => s.playerForceId);
  const seizeSite = useGameStore((s) => s.seizeSite);
  const t = useT();

  const [pickOfficer, setPickOfficer] = useState<EntityId | null>(null);
  const [troops, setTroops] = useState(3000);
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  const candidates = useMemo(() => {
    if (!playerForceId || !site) return [];
    const valid = new Set<string>();
    for (const gid of site.guards) {
      const g = cities[gid];
      if (!g) continue;
      if (g.ownerForceId === playerForceId) valid.add(g.id);
      for (const adjId of g.adjacentCityIds ?? []) {
        if (cities[adjId]?.ownerForceId === playerForceId) valid.add(adjId);
      }
    }
    return Object.values(officersMap)
      .filter((o) =>
        o.forceId === playerForceId
        && (o.status === 'idle' || o.status === 'active')
        && o.locationCityId
        && valid.has(o.locationCityId),
      )
      .map((o) => ({ officer: o, city: cities[o.locationCityId!]! }))
      .sort((a, b) => b.officer.stats.war - a.officer.stats.war);
  }, [site, cities, officersMap, playerForceId]);

  if (!site) return null;
  const meta = SUBTYPE_LABEL[site.subtype];
  const owner = site.ownerForceId ? forces[site.ownerForceId] : null;
  const isMine = site.ownerForceId === playerForceId;
  const ownerColor = owner?.color ?? '#5a4530';
  const hpPct = Math.max(0, Math.min(1, site.hp / site.maxHp));
  const reach = playerForceId
    ? canPlayerSeizeSite(site, cities, playerForceId)
    : { ok: false, reason: 'No player force.' };
  const chosen = candidates.find((c) => c.officer.id === pickOfficer);
  const maxTroops = chosen ? chosen.city.troops : 0;
  if (candidates.length > 0 && !pickOfficer) setPickOfficer(candidates[0].officer.id);
  const res = site.subtype === 'resource' ? RESOURCE_SITE_DEFS[site.variant] : null;

  const doSeize = () => {
    if (!pickOfficer) return;
    const r = seizeSite(site.id, pickOfficer, Math.min(troops, maxTroops));
    setFeedback({ ok: r.ok, text: r.message });
  };

  const verb = siteActionVerb(site.subtype);

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#1a1410', border: `2px solid ${ownerColor}`,
          padding: '1rem 1.2rem', color: '#f0e0b0', fontFamily: 'Songti SC, serif',
          minWidth: 360, maxWidth: 460, boxShadow: `0 0 16px ${ownerColor}`,
        }}
      >
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: '1.3rem', fontWeight: 'bold' }}>
              {meta.glyph} {site.name.zh}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#a89070' }}>
              {site.name.en} · {t(meta.zh, meta.en)}
            </div>
          </div>
          <button onClick={onClose} style={{
            background: 'transparent', border: 'none', color: '#a89070',
            fontSize: '1.4rem', cursor: 'pointer', padding: 0,
          }}>×</button>
        </header>

        <div style={{ marginTop: '0.7rem', display: 'grid', gridTemplateColumns: '74px 1fr', gap: '0.3rem 0.5rem', fontSize: '0.85rem' }}>
          <span style={{ color: '#8a7050' }}>{t('歸屬', 'Owner')}</span>
          <span style={{ color: ownerColor, fontWeight: 'bold' }}>
            {owner?.name.zh ?? (site.subtype === 'bandit' ? t('賊據', 'Bandit-held') : t('無主', 'Unclaimed'))}
            {isMine && <span style={{ color: '#7ed68a', marginLeft: 6 }}>{t('（自軍）', '(yours)')}</span>}
          </span>

          {res && (
            <>
              <span style={{ color: '#8a7050' }}>{t('產出', 'Yield')}</span>
              <span style={{ color: '#e0c070', fontSize: '0.82rem' }}>
                {res.goldPerSeason > 0 && t(`每季 +${res.goldPerSeason} 金`, `+${res.goldPerSeason}g/season`)}
                {res.troopsPerSeason > 0 && t(`,每季 +${res.troopsPerSeason} 兵`, `, +${res.troopsPerSeason} troops/season`)}
              </span>
            </>
          )}

          <span style={{ color: '#8a7050' }}>{site.subtype === 'bandit' ? t('賊眾', 'Strength') : t('守備', 'Garrison')}</span>
          <span>
            <div style={{ height: 8, background: '#3a2818', border: '1px solid #5a4530', width: '100%' }}>
              <div style={{ height: '100%', width: `${Math.round(hpPct * 100)}%`, background: hpPct > 0.5 ? '#b8442e' : '#7ed68a' }} />
            </div>
            <span style={{ fontSize: '0.72rem', color: '#a89070' }}>
              {site.hp.toLocaleString()} / {site.maxHp.toLocaleString()}
            </span>
          </span>

          <span style={{ color: '#8a7050' }}>{t('鄰近', 'Near')}</span>
          <span style={{ fontSize: '0.78rem' }}>
            {site.guards.map((id) => cities[id]?.name.zh ?? id).join(' · ')}
          </span>
        </div>

        {site.subtype === 'bandit' && site.hostile && !isMine && (
          <div style={{ marginTop: '0.5rem', fontSize: '0.74rem', color: '#ff9060' }}>
            {t('⚠ 此寨四出劫掠,危害鄰城。', '⚠ This nest raids the nearby cities.')}
          </div>
        )}

        {!isMine && reach.ok && candidates.length > 0 && (
          <div style={{ marginTop: '0.7rem', padding: '0.5rem 0.7rem', background: 'rgba(60, 26, 22, 0.4)', border: '1px solid #b8442e' }}>
            <div style={{ fontSize: '0.72rem', color: '#ff8060', marginBottom: '0.4rem' }}>
              {t('選將與兵力：', 'Pick officer + troops:')}
            </div>
            <select
              value={pickOfficer ?? ''}
              onChange={(e) => {
                setPickOfficer(e.target.value);
                const c = candidates.find((c) => c.officer.id === e.target.value);
                if (c) setTroops(Math.min(3000, c.city.troops));
              }}
              style={{
                width: '100%', padding: '0.3rem 0.5rem', background: '#1a1410', color: '#f0e0b0',
                border: '1px solid #5a4530', fontFamily: 'Songti SC, serif', fontSize: '0.82rem', marginBottom: '0.4rem',
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
              type="range" min={500} max={Math.max(500, maxTroops)} step={500}
              value={troops} onChange={(e) => setTroops(parseInt(e.target.value, 10))}
              style={{ width: '100%' }}
            />
          </div>
        )}

        {!isMine && (
          <div style={{ marginTop: '0.9rem' }}>
            <button
              onClick={doSeize}
              disabled={!reach.ok || candidates.length === 0 || !pickOfficer}
              title={reach.ok ? '' : (reach.reason ?? '')}
              style={{
                background: '#3a1a1a', color: reach.ok ? '#ff8060' : '#a89070',
                border: `1px solid ${reach.ok ? '#b8442e' : '#5a4530'}`,
                padding: '0.4rem 0.9rem', cursor: reach.ok ? 'pointer' : 'not-allowed',
                fontFamily: 'Songti SC, serif', fontSize: '0.9rem', opacity: reach.ok ? 1 : 0.5,
              }}
            >{verb}{t(meta.zh, '')} {t('', meta.en)}</button>
          </div>
        )}

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
