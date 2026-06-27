import { useMemo, useState } from 'react';
import { useGameStore } from '../../game/state/store';
import { Modal } from './Modal';
import { useT, useLanguage, pickName } from '../i18n';

/**
 * 全軍集結令 — the muster planner UI (§4.2). Opens on any city: a hostile target
 * (全軍集結·攻) or one of your own (勤王增援 / 集結點). Before committing it shows
 * the full preview — how many columns march, total troops & gold, slowest ETA,
 * and which cities sit it out (and why) — and lets the player tune the muster:
 * troop fraction, a garrison floor (don't strip a city bare), and 排除前線
 * (leave border garrisons home). One informed click instead of a blind one.
 */
const REASON_LABEL: Record<string, { zh: string; en: string }> = {
  'low-garrison': { zh: '兵不足/守軍底線', en: 'garrison too thin' },
  'no-officer':   { zh: '無閒將', en: 'no idle officer' },
  'no-gold':      { zh: '金不足', en: 'cannot pay' },
  'unreachable':  { zh: '無路可達', en: 'no in-realm path' },
  'excluded':     { zh: '前線/排除', en: 'frontier/excluded' },
};

export function MusterModal({ targetCityId, onClose }: { targetCityId: string; onClose: () => void }) {
  const t = useT();
  const lang = useLanguage();
  const cities = useGameStore((s) => s.cities);
  const playerForceId = useGameStore((s) => s.playerForceId);
  const musterPreview = useGameStore((s) => s.musterPreview);
  const massMuster = useGameStore((s) => s.massMuster);
  const startMusterCampaign = useGameStore((s) => s.startMusterCampaign);
  const cancelMusterCampaign = useGameStore((s) => s.cancelMusterCampaign);
  const musters = useGameStore((s) => s.musters);

  const [fraction, setFraction] = useState(0.7);
  const [keepGarrison, setKeepGarrison] = useState(0);
  const [excludeFrontier, setExcludeFrontier] = useState(false);
  const [standing, setStanding] = useState(false);
  const [rallyCityId, setRallyCityId] = useState<string>('');
  const [sent, setSent] = useState<number | null>(null);

  const ownCities = useMemo(
    () => Object.values(cities).filter((c) => c.ownerForceId === playerForceId && c.id !== targetCityId),
    [cities, playerForceId, targetCityId],
  );
  const activeCampaign = musters[`muster-${playerForceId}-${targetCityId}`];

  const opts = { fraction, keepGarrison, excludeFrontier };
  // Re-plan whenever the knobs change (cities snapshot is stable within a turn).
  const preview = useMemo(() => musterPreview(targetCityId, opts), [musterPreview, targetCityId, fraction, keepGarrison, excludeFrontier]);
  const target = cities[targetCityId];
  const title = preview.relief ? t('集結增援', 'Muster — Reinforce') : t('全軍集結', 'Mass Muster');

  return (
    <Modal onClose={onClose} icon="🚩" title={`${title} → ${target ? pickName(target.name, lang) : '?'}`} width="min(540px, 100%)" scrollBody>
      <div style={{ fontSize: '0.8rem', color: '#aab6c0', marginBottom: '0.7rem', lineHeight: 1.55 }}>
        {preview.relief
          ? t('令全國合格之城發兵增援此城(友軍合流);亦可作集結點,蓄勢再合擊。', 'Every eligible city sends a column to reinforce this city (they merge); also serves as a staging point to gather before striking.')
          : t('令全國合格之城(駐軍≥3000、有閒將、付得起軍費)向此敵城進發。', 'Every eligible city (garrison ≥3000, an idle officer, march gold) marches on this enemy city.')}
      </div>

      {/* 集結預覽 — the cost of committing, before you do. */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6, marginBottom: '0.8rem' }}>
        {([
          [t('出兵路數', 'Columns'), `${preview.columns}`],
          [t('共調兵力', 'Total troops'), preview.totalTroops.toLocaleString()],
          [t('耗金', 'Gold cost'), `${preview.totalGold}`],
          [t('最慢抵達', 'Slowest ETA'), preview.slowestSeasons > 0 ? t(`${preview.slowestSeasons} 季`, `${preview.slowestSeasons}s`) : '—'],
        ] as const).map(([k, v]) => (
          <div key={k} style={{ background: '#10161e', border: '1px solid #26323e', borderRadius: 5, padding: '0.4rem 0.6rem' }}>
            <div style={{ fontSize: '0.62rem', color: '#7a8893', letterSpacing: '0.08rem' }}>{k}</div>
            <div style={{ color: '#f2dd9a', fontSize: '1rem' }}>{v}</div>
          </div>
        ))}
      </div>

      {/* 選擇性集結 — fraction / garrison floor / exclude frontier. */}
      <div style={{ marginBottom: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <label style={{ fontSize: '0.74rem', color: '#aab6c0', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 96 }}>{t('出兵比例', 'Troop %')} {Math.round(fraction * 100)}%</span>
          <input type="range" min={0.3} max={1} step={0.05} value={fraction} onChange={(e) => setFraction(Number(e.target.value))} style={{ flex: 1 }} />
        </label>
        <label style={{ fontSize: '0.74rem', color: '#aab6c0', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 96 }}>{t('保留守軍', 'Keep home')} {keepGarrison > 0 ? keepGarrison.toLocaleString() : t('不限', 'none')}</span>
          <input type="range" min={0} max={8000} step={500} value={keepGarrison} onChange={(e) => setKeepGarrison(Number(e.target.value))} style={{ flex: 1 }} />
        </label>
        <label style={{ fontSize: '0.78rem', color: '#aab6c0', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
          <input type="checkbox" checked={excludeFrontier} onChange={(e) => setExcludeFrontier(e.target.checked)} />
          {t('排除前線城(守軍留邊)', 'Exclude frontier cities (keep border garrisons home)')}
        </label>
        <label style={{ fontSize: '0.78rem', color: '#aab6c0', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
          <input type="checkbox" checked={standing} onChange={(e) => setStanding(e.target.checked)} />
          {t('持續集結(每季續發,funnel 全國之力至目標陷落)', 'Standing muster (re-issues each season until it falls)')}
        </label>
        {/* 集結點・分進合擊 — gather at a forward own city first, then strike. Attack musters only. */}
        {standing && !preview.relief && (
          <label style={{ fontSize: '0.78rem', color: '#aab6c0', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 96 }}>{t('集結點', 'Rally at')}</span>
            <select value={rallyCityId} onChange={(e) => setRallyCityId(e.target.value)}
              style={{ flex: 1, background: '#10161e', border: '1px solid #26323e', color: '#e6edf3', borderRadius: 4, padding: '0.2rem', fontFamily: 'var(--tkm-font-body)', fontSize: '0.74rem' }}>
              <option value="">{t('— 直撲(不設集結點) —', '— Direct (no rally) —')}</option>
              {ownCities.map((c) => <option key={c.id} value={c.id}>{pickName(c.name, lang)}</option>)}
            </select>
          </label>
        )}
      </div>

      {/* 持續集結進行中 — show & allow calling off an active standing campaign. */}
      {activeCampaign && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: '0.8rem', padding: '0.45rem 0.6rem', background: 'rgba(110,52,35,0.18)', border: '1px solid #b8584a', borderRadius: 5 }}>
          <span style={{ fontSize: '0.76rem', color: '#f0c4b4' }}>
            🚩 {t('持續集結進行中', 'Standing muster active')}{(activeCampaign.gatherSeasonsLeft ?? 0) > 0 ? t('(集結中)', ' (gathering)') : ''} · {t(`餘 ${activeCampaign.seasonsLeft} 季`, `${activeCampaign.seasonsLeft}s left`)}
          </span>
          <button onClick={() => cancelMusterCampaign(activeCampaign.id)}
            style={{ background: 'rgba(184,68,46,0.22)', border: '1px solid #b8442e', color: '#f0b9a4', padding: '0.15rem 0.55rem', borderRadius: 4, cursor: 'pointer', fontFamily: 'var(--tkm-font-body)', fontSize: '0.74rem' }}>
            {t('罷集結', 'Call off')}
          </button>
        </div>
      )}

      {/* 不發之城 — who sits it out and why. */}
      {preview.excluded.length > 0 && (
        <details style={{ marginBottom: '0.8rem' }}>
          <summary style={{ fontSize: '0.72rem', color: '#9aa6b0', cursor: 'pointer' }}>{t(`不發之城 (${preview.excluded.length})`, `Sitting out (${preview.excluded.length})`)}</summary>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 5 }}>
            {preview.excluded.map((e) => {
              const c = cities[e.cityId];
              const r = REASON_LABEL[e.reason];
              return (
                <span key={e.cityId} style={{ fontSize: '0.66rem', color: '#9aa6b0', background: '#10161e', border: '1px solid #26323e', borderRadius: 4, padding: '0.1rem 0.4rem' }}>
                  {c ? pickName(c.name, lang) : e.cityId} · {r ? (lang === 'en' ? r.en : r.zh) : e.reason}
                </span>
              );
            })}
          </div>
        </details>
      )}

      {sent != null ? (
        <div style={{ textAlign: 'center', color: sent > 0 ? '#9ed68a' : '#d88', padding: '0.5rem 0' }}>
          {sent > 0 ? t(`🚩 ${sent} 路兵馬已發`, `🚩 ${sent} columns marching`) : t('無兵可發', 'No troops marched')}
        </div>
      ) : (
        <button
          disabled={preview.columns === 0}
          onClick={() => {
            if (standing) {
              startMusterCampaign(targetCityId, { rallyCityId: rallyCityId || undefined, ...opts });
              setSent(preview.columns);
            } else {
              setSent(massMuster(targetCityId, opts));
            }
          }}
          style={{
            width: '100%', padding: '0.6rem',
            background: preview.columns > 0 ? 'linear-gradient(180deg,#6e3423,#3e1813)' : '#1e2832',
            border: `1px solid ${preview.columns > 0 ? '#b8584a' : '#2b3845'}`,
            color: preview.columns > 0 ? '#ffd0c0' : '#5f6c76', cursor: preview.columns > 0 ? 'pointer' : 'default',
            fontFamily: 'var(--tkm-font-body)', fontSize: '1rem', letterSpacing: '0.1rem',
          }}
        >🚩 {standing ? t(`下持續集結令（${preview.columns} 路/季)`, `Standing muster (${preview.columns}/season)`) : preview.relief ? t(`發 ${preview.columns} 路增援`, `Send ${preview.columns} columns to reinforce`) : t(`全軍集結（${preview.columns} 路)`, `Muster (${preview.columns} columns)`)}</button>
      )}
    </Modal>
  );
}
