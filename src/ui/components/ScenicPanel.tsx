import { useMemo, useState } from 'react';
import { useGameStore } from '../../game/state/store';
import { SCENIC_BY_ID, canVisitScenic } from '../../game/data/scenicSites';
import { ITEMS } from '../../game/data/items';
import type { EntityId } from '../../game/types';
import { useT, useLanguage, pickName } from '../i18n';

interface Props {
  siteId: string;
  onClose: () => void;
}

const ITEM_BY_ID = Object.fromEntries(ITEMS.map((i) => [i.id, i]));

export function ScenicPanel({ siteId, onClose }: Props) {
  const site = SCENIC_BY_ID[siteId];
  const cities = useGameStore((s) => s.cities);
  const officersMap = useGameStore((s) => s.officers);
  const playerForceId = useGameStore((s) => s.playerForceId);
  const scenicLooted = useGameStore((s) => s.scenicLooted);
  const visitScenicSite = useGameStore((s) => s.visitScenicSite);
  const t = useT();
  const lang = useLanguage();

  const [pickOfficer, setPickOfficer] = useState<EntityId | null>(null);
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
      // A persuasive envoy fares best — sort by charisma.
      .map((o) => ({ officer: o, city: cities[o.locationCityId!]! }))
      .sort((a, b) => b.officer.stats.charisma - a.officer.stats.charisma);
  }, [site, cities, officersMap, playerForceId]);

  if (!site) return null;
  const reach = playerForceId
    ? canVisitScenic(site, cities, playerForceId)
    : { ok: false, reason: 'No player force.' };
  if (candidates.length > 0 && !pickOfficer) setPickOfficer(candidates[0].officer.id);
  const looted = !!scenicLooted[siteId];
  const hermit = site.hermitId ? officersMap[site.hermitId] : null;
  const hermitAvailable = hermit && hermit.forceId === null
    && (hermit.status === 'idle' || hermit.status === 'unsearched');
  const item = site.itemId ? ITEM_BY_ID[site.itemId] : null;
  const color = '#c9a23c';

  const doVisit = () => {
    if (!pickOfficer) return;
    const r = visitScenicSite(site.id, pickOfficer);
    setFeedback({ ok: r.ok, text: r.message });
  };

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
          background: '#10161e', border: `2px solid ${color}`,
          padding: '1rem 1.2rem', color: '#eef4f8', fontFamily: 'var(--tkm-font-body)',
          minWidth: 360, maxWidth: 470, boxShadow: `0 0 16px ${color}`,
        }}
      >
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: '1.3rem', fontWeight: 'bold' }}>⛰ {pickName(site.name, lang)}</div>
            <div style={{ fontSize: '0.72rem', color: '#97a4ae' }}>{t('名所', 'Scenic Site')}</div>
          </div>
          <button onClick={onClose} style={{
            background: 'transparent', border: 'none', color: '#97a4ae',
            fontSize: '1.4rem', cursor: 'pointer', padding: 0,
          }}>×</button>
        </header>

        <div style={{ marginTop: '0.6rem', fontSize: '0.8rem', color: '#c8b89a', lineHeight: 1.6 }}>
          {site.descZh}
        </div>

        <div style={{ marginTop: '0.7rem', display: 'grid', gridTemplateColumns: '70px 1fr', gap: '0.3rem 0.5rem', fontSize: '0.85rem' }}>
          {hermit && (
            <>
              <span style={{ color: '#7a8893' }}>{t('賢者', 'Recluse')}</span>
              <span style={{ color: hermitAvailable ? '#7ed68a' : '#97a4ae' }}>
                {pickName(hermit.name, lang)} (INT {hermit.stats.intelligence})
                {!hermitAvailable && <span style={{ color: '#7a8893' }}> · {t('已出仕', 'already served')}</span>}
              </span>
            </>
          )}
          {item && (
            <>
              <span style={{ color: '#7a8893' }}>{t('寶物', 'Treasure')}</span>
              <span style={{ color: looted ? '#7a8893' : '#e0c070' }}>
                {pickName(item.name, lang)}{looted && ` · ${t('已取', 'taken')}`}
              </span>
            </>
          )}
          {site.gold > 0 && (
            <>
              <span style={{ color: '#7a8893' }}>{t('資財', 'Gold')}</span>
              <span style={{ color: looted ? '#7a8893' : '#e0c070' }}>{site.gold}{looted && ` · ${t('已取', 'taken')}`}</span>
            </>
          )}
        </div>

        {reach.ok && candidates.length > 0 && (
          <div style={{ marginTop: '0.7rem', padding: '0.5rem 0.7rem', background: 'rgba(40, 34, 18, 0.5)', border: `1px solid ${color}` }}>
            <div style={{ fontSize: '0.72rem', color: '#e0c070', marginBottom: '0.4rem' }}>
              {t('遣使（魅力越高越易訪得賢者）：', 'Send envoy (charisma helps win the recluse):')}
            </div>
            <select
              value={pickOfficer ?? ''}
              onChange={(e) => setPickOfficer(e.target.value)}
              style={{
                width: '100%', padding: '0.3rem 0.5rem', background: '#10161e', color: '#eef4f8',
                border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', fontFamily: 'var(--tkm-font-body)', fontSize: '0.82rem',
              }}
            >
              {candidates.map(({ officer: o, city }) => (
                <option key={o.id} value={o.id}>
                  {pickName(o.name, lang)} (CHR {o.stats.charisma}) @ {pickName(city.name, lang)}
                </option>
              ))}
            </select>
          </div>
        )}

        <div style={{ marginTop: '0.9rem' }}>
          <button
            onClick={doVisit}
            disabled={!reach.ok || candidates.length === 0 || !pickOfficer || (looted && !hermitAvailable)}
            title={reach.ok ? '' : (reach.reason ?? '')}
            style={{
              background: '#2a2414', color: reach.ok ? '#e0c070' : '#97a4ae',
              border: `1px solid ${reach.ok ? color : '#364654'}`,
              padding: '0.4rem 0.9rem',
              cursor: reach.ok && !(looted && !hermitAvailable) ? 'pointer' : 'not-allowed',
              fontFamily: 'var(--tkm-font-body)', fontSize: '0.9rem',
              opacity: reach.ok && !(looted && !hermitAvailable) ? 1 : 0.5,
            }}
          >{looted && !hermitAvailable ? t('已無所獲', 'Nothing left') : t('訪賢尋寶', 'Visit')}</button>
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
