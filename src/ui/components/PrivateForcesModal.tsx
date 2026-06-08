import { useState, type CSSProperties } from 'react';
import { useGameStore } from '../../game/state/store';
import { privateGuardMultiplier } from '../../game/systems/combat';
import { useT, useLanguage } from '../i18n';

interface Props {
  onClose: () => void;
}

/**
 * 私兵 / 部曲 (Private Forces) — fund a personal-guard corps for your officers.
 * The guard strengthens whatever army the officer commands (attack or defend),
 * capped at leadership×100, paid from the officer's current city treasury.
 */
export function PrivateForcesModal({ onClose }: Props) {
  const officers = useGameStore((s) => s.officers);
  const cities = useGameStore((s) => s.cities);
  const playerForceId = useGameStore((s) => s.playerForceId);
  const levyPrivateTroops = useGameStore((s) => s.levyPrivateTroops);
  const disbandPrivateTroops = useGameStore((s) => s.disbandPrivateTroops);
  const t = useT();
  const lang = useLanguage();

  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState('');

  const mine = Object.values(officers)
    .filter((o) => o.forceId === playerForceId && o.status !== 'dead' && o.status !== 'unsearched')
    .sort((a, b) => (b.privateTroops ?? 0) - (a.privateTroops ?? 0) || b.stats.leadership - a.stats.leadership);

  const pct = (n: number) => `${Math.round((privateGuardMultiplier([{ privateTroops: n } as never]) - 1) * 1000) / 10}%`;

  return (
    <div style={overlay} onClick={onClose}>
      <div style={panel} onClick={(e) => e.stopPropagation()}>
        <header style={header}>
          <div>
            <div style={{ fontSize: '1.4rem', color: '#d4a84a', letterSpacing: '0.2rem' }}>{t('私兵 · 部曲', 'Private Forces')}</div>
            <div style={{ fontSize: '0.8rem', color: '#8a7050', fontStyle: 'italic' }}>
              {t('募養家兵 — 增強麾下武將領軍之威（攻守皆然，上限 統率×100）', 'Fund a personal guard — strengthens the officer in battle (attack & defence), cap = leadership×100')}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#d4a84a', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
        </header>

        <div style={{ padding: '0.6rem 1.2rem', flex: 1, overflowY: 'auto' }}>
          {msg && <div style={{ fontSize: '0.8rem', color: msg.includes('levies') || msg.includes('disbands') ? '#7ed68a' : '#e2a07a', margin: '0.3rem 0 0.5rem' }}>{msg}</div>}
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 0.8fr 1.2fr 1.4fr', gap: '0.3rem 0.6rem', fontSize: '0.68rem', color: '#8a7050', textTransform: 'uppercase', letterSpacing: '0.1rem', paddingBottom: '0.3rem', borderBottom: '1px solid #4a3520' }}>
            <span>{t('武將', 'Officer')}</span>
            <span>{t('統率', 'Lead')}</span>
            <span>{t('私兵 / 上限', 'Guard / Cap')}</span>
            <span>{t('募養 (2金/兵)', 'Levy (2g/unit)')}</span>
          </div>
          {mine.map((o) => {
            const cur = o.privateTroops ?? 0;
            const cap = o.stats.leadership * 100;
            const city = o.locationCityId ? cities[o.locationCityId] : null;
            const amt = amounts[o.id] ?? '1000';
            return (
              <div key={o.id} style={{ display: 'grid', gridTemplateColumns: '1.4fr 0.8fr 1.2fr 1.4fr', gap: '0.3rem 0.6rem', alignItems: 'center', padding: '0.4rem 0', borderBottom: '1px solid #2a2018', fontSize: '0.82rem' }}>
                <span style={{ color: '#d4a84a', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {lang === 'en' ? o.name.en : o.name.zh}
                  {city && <span style={{ color: '#6a5238', fontSize: '0.68rem' }}> · {lang === 'en' ? city.name.en : city.name.zh}</span>}
                </span>
                <span style={{ color: '#c0a878' }}>{o.stats.leadership}</span>
                <span style={{ fontFamily: 'ui-monospace, monospace', color: cur > 0 ? '#7ed68a' : '#8a7050' }}>
                  {cur.toLocaleString()}/{cap.toLocaleString()}
                  {cur > 0 && <span style={{ color: '#6a8a5a', fontSize: '0.7rem' }}> (+{pct(cur)})</span>}
                </span>
                <span style={{ display: 'flex', gap: '0.3rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <input
                    type="number"
                    value={amt}
                    onChange={(e) => setAmounts((m) => ({ ...m, [o.id]: e.target.value }))}
                    style={{ width: 64, background: '#14100c', border: '1px solid #4a3520', color: '#e8d9b0', padding: '0.2rem 0.3rem', fontFamily: 'inherit', fontSize: '0.78rem' }}
                  />
                  <button style={btn(!!city)} disabled={!city}
                    onClick={() => { const r = levyPrivateTroops(o.id, Number(amt)); setMsg(r.message); }}>
                    {t('募', 'Levy')}
                  </button>
                  {cur > 0 && (
                    <button style={{ ...btn(true), borderColor: '#c0504a', color: '#e2a07a' }}
                      onClick={() => { const r = disbandPrivateTroops(o.id); setMsg(r.message); }}>
                      {t('解散', 'Disband')}
                    </button>
                  )}
                </span>
              </div>
            );
          })}
          {mine.length === 0 && (
            <div style={{ color: '#6a5238', fontStyle: 'italic', padding: '1rem 0' }}>{t('無可用武將。', 'No officers available.')}</div>
          )}
        </div>
      </div>
    </div>
  );
}

const overlay: CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'grid', placeItems: 'center', zIndex: 900, padding: '1rem' };
const panel: CSSProperties = { background: 'linear-gradient(160deg,#2a1f15,#1a1410)', border: '1px solid #5a4530', width: 'min(700px,100%)', maxHeight: '88vh', display: 'flex', flexDirection: 'column', color: '#e8d9b0', fontFamily: '"Songti SC","Noto Serif SC",serif' };
const header: CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '1rem 1.2rem', borderBottom: '1px solid #4a3520' };
function btn(enabled: boolean): CSSProperties {
  return { background: enabled ? '#3a2818' : 'transparent', border: '1px solid #d4a84a', color: enabled ? '#d4a84a' : '#6a5238', padding: '0.2rem 0.5rem', cursor: enabled ? 'pointer' : 'not-allowed', fontFamily: 'inherit', fontSize: '0.76rem' };
}
