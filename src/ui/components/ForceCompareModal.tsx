import { useMemo, useState } from 'react';
import { useGameStore } from '../../game/state/store';
import { useT } from '../i18n';
import { Modal } from './Modal';

interface Agg {
  fid: string;
  name: string;
  color: string;
  ruler: string;
  cities: number;
  troops: number;
  gold: number;
  food: number;
  officers: number;
  elites: number;
}

/**
 * 較量 — lay your realm beside a rival's, metric for metric. Cities, troops,
 * coffers, granaries, the depth of the officer corps and how many true elites
 * each side fields — twin bars and a one-word verdict on who holds the edge.
 * Pure read; the call you make from it is yours.
 */
export function ForceCompareModal({ onClose }: { onClose: () => void }) {
  const t = useT();
  const forces = useGameStore((s) => s.forces);
  const cities = useGameStore((s) => s.cities);
  const officers = useGameStore((s) => s.officers);
  const playerForceId = useGameStore((s) => s.playerForceId);

  const aggs = useMemo(() => {
    const map: Record<string, Agg> = {};
    const ensure = (fid: string): Agg => (map[fid] ??= {
      fid, name: forces[fid]?.name.zh ?? fid, color: forces[fid]?.color ?? '#888',
      ruler: forces[fid]?.rulerOfficerId ? (officers[forces[fid].rulerOfficerId]?.name.zh ?? '') : '',
      cities: 0, troops: 0, gold: 0, food: 0, officers: 0, elites: 0,
    });
    for (const c of Object.values(cities)) {
      if (!c.ownerForceId || !forces[c.ownerForceId]) continue;
      const a = ensure(c.ownerForceId);
      a.cities++; a.troops += c.troops; a.gold += c.gold; a.food += c.food;
    }
    for (const o of Object.values(officers)) {
      if (!o.forceId || o.status === 'dead' || o.status === 'unsearched' || !forces[o.forceId]) continue;
      const a = ensure(o.forceId);
      a.officers++;
      if (o.stats.war >= 85 || o.stats.leadership >= 85 || o.stats.intelligence >= 90) a.elites++;
    }
    return map;
  }, [forces, cities, officers]);

  const me = playerForceId ? aggs[playerForceId] : undefined;
  const rivals = useMemo(
    () => Object.values(aggs).filter((a) => a.fid !== playerForceId).sort((x, y) => y.cities - x.cities || y.troops - x.troops),
    [aggs, playerForceId],
  );
  const [rivalId, setRivalId] = useState<string>(() => rivals[0]?.fid ?? '');
  const rival = aggs[rivalId];

  const metrics: Array<{ zh: string; en: string; key: keyof Agg; fmt?: (n: number) => string }> = [
    { zh: '城池', en: 'Cities', key: 'cities' },
    { zh: '總兵', en: 'Troops', key: 'troops', fmt: (n) => n.toLocaleString() },
    { zh: '武將', en: 'Officers', key: 'officers' },
    { zh: '名將', en: 'Elites', key: 'elites' },
    { zh: '國庫', en: 'Gold', key: 'gold', fmt: (n) => n.toLocaleString() },
    { zh: '存糧', en: 'Grain', key: 'food', fmt: (n) => n.toLocaleString() },
  ];

  // 勢 — weighted edge (cities + troops dominate, corps depth a tiebreaker).
  const verdict = useMemo(() => {
    if (!me || !rival) return null;
    const score = (a: Agg) => a.cities * 1000 + a.troops * 0.05 + a.elites * 200 + a.officers * 40;
    const r = score(me) / Math.max(1, score(rival));
    if (r >= 1.5) return { zh: '我強敵弱', en: 'You dominate', color: '#7ed68a' };
    if (r >= 1.12) return { zh: '我佔上風', en: 'You lead', color: '#a8d67e' };
    if (r > 0.89) return { zh: '勢均力敵', en: 'Evenly matched', color: '#e6c473' };
    if (r > 0.66) return { zh: '敵佔上風', en: 'They lead', color: '#e0a070' };
    return { zh: '敵強我弱', en: 'They dominate', color: '#e0707a' };
  }, [me, rival]);

  return (
    <Modal onClose={onClose} width="min(600px, 100%)" icon="⚖" title={t('較量', 'Compare')}>
        {!me ? (
          <div style={{ color: '#7a8893', fontSize: '0.85rem', padding: '1.5rem 0' }}>{t('觀戰模式無從較量。', 'No force to compare in spectator mode.')}</div>
        ) : rivals.length === 0 ? (
          <div style={{ color: '#7a8893', fontSize: '0.85rem', padding: '1.5rem 0' }}>{t('天下已定,別無對手。', 'No rivals left — the realm is yours.')}</div>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: '0.7rem' }}>
              <span style={{ color: me.color, fontSize: '0.95rem' }}>■ {me.name}{me.ruler ? ` · ${me.ruler}` : ''} <span style={{ color: '#7a8893' }}>({t('我', 'You')})</span></span>
              <span style={{ color: '#7a8893' }}>{t('對', 'vs')}</span>
              <select value={rivalId} onChange={(e) => setRivalId(e.target.value)} style={{ background: '#080b0e', border: '1px solid #2b3845', color: '#e6c473', padding: '0.25rem 0.4rem', fontFamily: 'inherit', maxWidth: '50%' }}>
                {rivals.map((r) => (
                  <option key={r.fid} value={r.fid}>{r.name}{r.ruler ? ` · ${r.ruler}` : ''}</option>
                ))}
              </select>
            </div>

            {rival && verdict && (
              <>
                <div style={{ textAlign: 'center', color: verdict.color, fontSize: '1.05rem', letterSpacing: '0.07rem', marginBottom: '0.7rem' }}>
                  〔 {t(verdict.zh, verdict.en)} 〕
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {metrics.map((m) => {
                    const mv = me[m.key] as number;
                    const rv = rival[m.key] as number;
                    const max = Math.max(1, mv, rv);
                    const fmt = m.fmt ?? ((n: number) => String(n));
                    return (
                      <div key={m.key}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: 2 }}>
                          <span style={{ color: mv >= rv ? '#f2dd9a' : '#97a4ae' }}>{fmt(mv)}</span>
                          <span style={{ color: '#7a8893' }}>{t(m.zh, m.en)}</span>
                          <span style={{ color: rv > mv ? '#f2dd9a' : '#97a4ae' }}>{fmt(rv)}</span>
                        </div>
                        <div style={{ display: 'flex', gap: 3, alignItems: 'center', height: 12 }}>
                          <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
                            <div style={{ width: `${(mv / max) * 100}%`, height: '100%', background: me.color, borderRadius: '3px 0 0 3px', opacity: 0.85 }} />
                          </div>
                          <div style={{ width: 1, height: '100%', background: '#364654' }} />
                          <div style={{ flex: 1 }}>
                            <div style={{ width: `${(rv / max) * 100}%`, height: '100%', background: rival.color, borderRadius: '0 3px 3px 0', opacity: 0.85 }} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </>
        )}
    </Modal>
  );
}
