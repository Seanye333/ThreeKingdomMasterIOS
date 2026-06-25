import { useRef, useState, type CSSProperties } from 'react';
import { useEscapeKey } from '../hooks/useEscapeKey';
import { useGameStore } from '../../game/state/store';
import { privateGuardMultiplier } from '../../game/systems/combat';
import { playSfx } from '../../game/systems/sound';
import { useT, useLanguage } from '../i18n';

const MARCH_GLYPHS = ['卒', '卒', '卒', '卒', '卒'];

interface Props {
  onClose: () => void;
}

/**
 * 私兵 / 部曲 (Private Forces) — fund a personal-guard corps for your officers.
 * The guard strengthens whatever army the officer commands (attack or defend),
 * capped at leadership×100, paid from the officer's current city treasury.
 */
export function PrivateForcesModal({ onClose }: Props) {
  useEscapeKey(onClose);
  const officers = useGameStore((s) => s.officers);
  const cities = useGameStore((s) => s.cities);
  const playerForceId = useGameStore((s) => s.playerForceId);
  const levyPrivateTroops = useGameStore((s) => s.levyPrivateTroops);
  const disbandPrivateTroops = useGameStore((s) => s.disbandPrivateTroops);
  const t = useT();
  const lang = useLanguage();

  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState('');
  // Per-row levy flourish: 部曲列隊 glyphs + a floating gain on the levied row.
  const [flash, setFlash] = useState<{ officerId: string; gain: number; key: number } | null>(null);
  const flashId = useRef(0);

  const doLevy = (officerId: string, amt: string, before: number) => {
    const r = levyPrivateTroops(officerId, Number(amt));
    setMsg(r.message);
    if (r.ok) {
      const after = useGameStore.getState().officers[officerId]?.privateTroops ?? before;
      flashId.current += 1;
      setFlash({ officerId, gain: after - before, key: flashId.current });
      playSfx('horn');
    } else {
      playSfx('defeat');
    }
  };
  const doDisband = (officerId: string) => {
    const r = disbandPrivateTroops(officerId);
    setMsg(r.message);
    playSfx(r.ok ? 'march' : 'defeat');
  };

  const mine = Object.values(officers)
    .filter((o) => o.forceId === playerForceId && o.status !== 'dead' && o.status !== 'unsearched')
    .sort((a, b) => (b.privateTroops ?? 0) - (a.privateTroops ?? 0) || b.stats.leadership - a.stats.leadership);

  const pct = (n: number) => `${Math.round((privateGuardMultiplier([{ privateTroops: n } as never]) - 1) * 1000) / 10}%`;

  return (
    <div style={overlay} onClick={onClose}>
      <div style={panel} onClick={(e) => e.stopPropagation()}>
        <header style={header}>
          <div>
            <div style={{ fontSize: '1.4rem', color: '#e6c473', letterSpacing: '0.07rem' }}>{t('私兵 · 部曲', 'Private Forces')}</div>
            <div style={{ fontSize: '0.8rem', color: '#7a8893', fontStyle: 'italic' }}>
              {t('募養家兵 — 增強麾下武將領軍之威（攻守皆然，上限 統率×100）', 'Fund a personal guard — strengthens the officer in battle (attack & defence), cap = leadership×100')}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#e6c473', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
        </header>

        <div style={{ padding: '0.6rem 1.2rem', flex: 1, overflowY: 'auto' }}>
          {msg && <div style={{ fontSize: '0.8rem', color: msg.includes('levies') || msg.includes('disbands') ? '#7ed68a' : '#e2a07a', margin: '0.3rem 0 0.5rem' }}>{msg}</div>}
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 0.8fr 1.2fr 1.4fr', gap: '0.3rem 0.6rem', fontSize: '0.68rem', color: '#7a8893', textTransform: 'uppercase', letterSpacing: '0.1rem', paddingBottom: '0.3rem', borderBottom: '1px solid #2b3845' }}>
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
                <span style={{ color: '#e6c473', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {lang === 'en' ? o.name.en : o.name.zh}
                  {city && <span style={{ color: '#6a5238', fontSize: '0.68rem' }}> · {lang === 'en' ? city.name.en : city.name.zh}</span>}
                </span>
                <span style={{ color: '#aab6c0' }}>{o.stats.leadership}</span>
                <span style={{ fontFamily: 'ui-monospace, monospace', color: cur > 0 ? '#7ed68a' : '#7a8893', position: 'relative' }}>
                  <span style={flash?.officerId === o.id ? { display: 'inline-block', animation: 'tkmRapportPop 0.7s ease-out' } : undefined}>
                    {cur.toLocaleString()}/{cap.toLocaleString()}
                  </span>
                  {cur > 0 && <span style={{ color: '#6a8a5a', fontSize: '0.7rem' }}> (+{pct(cur)})</span>}
                  {flash?.officerId === o.id && (
                    <>
                      <span
                        key={flash.key}
                        style={{ position: 'absolute', left: 0, top: '-0.9rem', whiteSpace: 'nowrap', color: '#7ed68a', fontWeight: 'bold', fontSize: '0.78rem', textShadow: '0 1px 3px rgba(0,0,0,0.7)', pointerEvents: 'none', animation: 'tkmFloatUpFade 1.1s ease-out forwards' }}
                        onAnimationEnd={() => setFlash(null)}
                      >
                        +{flash.gain.toLocaleString()} {t('私兵', 'guard')}
                      </span>
                      <span style={{ position: 'absolute', left: 0, top: '1.05rem', display: 'inline-flex', gap: 1, pointerEvents: 'none' }}>
                        {MARCH_GLYPHS.map((g, i) => (
                          <span key={i} style={{ color: city?.ownerForceId ? '#e6c473' : '#e6c473', fontSize: '0.7rem', animation: `tkmTroopMarchIn 0.5s ease-out ${i * 0.07}s both` }}>{g}</span>
                        ))}
                      </span>
                    </>
                  )}
                </span>
                <span style={{ display: 'flex', gap: '0.3rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <input
                    type="number"
                    value={amt}
                    onChange={(e) => setAmounts((m) => ({ ...m, [o.id]: e.target.value }))}
                    style={{ width: 64, background: '#14100c', border: '1px solid #2b3845', color: '#e6edf3', padding: '0.2rem 0.3rem', fontFamily: 'inherit', fontSize: '0.78rem' }}
                  />
                  <button style={btn(!!city)} disabled={!city}
                    onClick={() => doLevy(o.id, amt, cur)}>
                    {t('募', 'Levy')}
                  </button>
                  {cur > 0 && (
                    <button style={{ ...btn(true), borderColor: '#c0504a', color: '#e2a07a' }}
                      onClick={() => doDisband(o.id)}>
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
const panel: CSSProperties = { background: 'linear-gradient(160deg,#1b2531,#10161e)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', width: 'min(700px,100%)', maxHeight: '88vh', display: 'flex', flexDirection: 'column', color: '#e6edf3', fontFamily: 'var(--tkm-font-body)' };
const header: CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '1rem 1.2rem', borderBottom: '1px solid #2b3845' };
function btn(enabled: boolean): CSSProperties {
  return { background: enabled ? '#1e2832' : 'transparent', border: '1px solid #e6c473', color: enabled ? '#e6c473' : '#6a5238', padding: '0.2rem 0.5rem', cursor: enabled ? 'pointer' : 'not-allowed', fontFamily: 'inherit', fontSize: '0.76rem' };
}
