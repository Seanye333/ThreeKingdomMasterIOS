import { useMemo } from 'react';
import { useGameStore } from '../../game/state/store';
import { tickCityEconomy, TAX_EFFECT } from '../../game/systems/economy';
import type { TaxRate } from '../../game/types';
import { useT } from '../i18n';

/**
 * 度支簿 — the realm's ledger for the coming season: every city's projected
 * gold and grain, netted into one bottom line. It runs the very same
 * tickCityEconomy the season engine uses, so these are the true numbers, not a
 * guess. Grain income only lands at the autumn harvest, so spring/summer/winter
 * show upkeep eating into stores — that red is the point.
 */
export function BudgetModal({ onClose }: { onClose: () => void }) {
  const t = useT();
  const cities = useGameStore((s) => s.cities);
  const officers = useGameStore((s) => s.officers);
  const season = useGameStore((s) => s.date.season);
  const playerForceId = useGameStore((s) => s.playerForceId);
  const selectCity = useGameStore((s) => s.selectCity);
  const tax: TaxRate = useGameStore((s) => (playerForceId ? s.taxPolicy[playerForceId] : undefined) ?? 'normal');
  const setTaxPolicy = useGameStore((s) => s.setTaxPolicy);
  const inflation = useGameStore((s) => s.inflation ?? 0);
  const mintCoin = useGameStore((s) => s.mintCoin);

  const { rows, totals, treasury } = useMemo(() => {
    const officersList = Object.values(officers);
    const officersByCity: Record<string, typeof officersList> = {};
    for (const o of officersList) {
      if (!o.locationCityId || o.status === 'dead' || o.status === 'unsearched') continue;
      (officersByCity[o.locationCityId] ??= []).push(o);
    }
    const mine = Object.values(cities).filter((c) => c.ownerForceId === playerForceId);
    const rs = mine.map((c) => {
      const tick = tickCityEconomy(c, season, officersByCity[c.id] ?? [], tax, inflation);
      const netFood = tick.foodIncome - tick.foodUpkeep;
      return {
        city: c,
        gold: tick.goldIncome,
        foodIn: tick.foodIncome,
        foodUp: tick.foodUpkeep,
        netFood,
        starving: c.food + netFood < 0,
      };
    }).sort((a, b) => b.gold - a.gold);
    const totals = rs.reduce(
      (acc, r) => ({ gold: acc.gold + r.gold, foodIn: acc.foodIn + r.foodIn, foodUp: acc.foodUp + r.foodUp }),
      { gold: 0, foodIn: 0, foodUp: 0 },
    );
    const treasury = mine.reduce((acc, c) => ({ gold: acc.gold + c.gold, food: acc.food + c.food }), { gold: 0, food: 0 });
    return { rows: rs, totals, treasury };
  }, [cities, officers, season, playerForceId, tax, inflation]);

  const netFoodTotal = totals.foodIn - totals.foodUp;
  const seasonZh = { spring: '春', summer: '夏', autumn: '秋', winter: '冬' }[season];
  const num = (n: number) => n.toLocaleString();
  const signed = (n: number) => (n >= 0 ? `+${num(n)}` : `−${num(-n)}`);

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'grid', placeItems: 'center', zIndex: 900, padding: '1rem' }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: 'linear-gradient(160deg,#2a1f15,#1a1410)', border: '1px solid #5a4530',
        width: 'min(680px,100%)', maxHeight: '86vh', overflowY: 'auto', color: '#e8d9b0',
        fontFamily: '"Songti SC","Noto Serif SC",serif', padding: '1rem 1.2rem',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.5rem' }}>
          <div style={{ fontSize: '1.15rem', color: '#d4a84a', letterSpacing: '0.2rem' }}>
            🪙 {t('度支簿', 'Treasury')} <span style={{ color: '#8a7050', fontSize: '0.8rem' }}>{t(`${seasonZh}季預算`, `${season} budget`)}</span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#d4a84a', fontSize: '1.4rem', cursor: 'pointer' }}>×</button>
        </div>

        {/* Realm summary — three cards: treasury on hand, gold/season, grain/season. */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: '0.7rem' }}>
          <div style={{ background: '#1a140d', border: '1px solid #3a2c1c', padding: '0.5rem 0.6rem', borderRadius: 4 }}>
            <div style={{ color: '#8a7050', fontSize: '0.72rem' }}>{t('府庫現金', 'On hand')}</div>
            <div style={{ color: '#f0d98a', fontSize: '1.05rem', fontFamily: 'ui-monospace, monospace' }}>{num(treasury.gold)} <span style={{ fontSize: '0.7rem' }}>金</span></div>
            <div style={{ color: '#c0a878', fontSize: '0.72rem', fontFamily: 'ui-monospace, monospace' }}>{num(treasury.food)} 糧</div>
          </div>
          <div style={{ background: '#1a140d', border: '1px solid #3a2c1c', padding: '0.5rem 0.6rem', borderRadius: 4 }}>
            <div style={{ color: '#8a7050', fontSize: '0.72rem' }}>{t('本季入金', 'Gold / season')}</div>
            <div style={{ color: '#7ed68a', fontSize: '1.05rem', fontFamily: 'ui-monospace, monospace' }}>{signed(totals.gold)}</div>
            <div style={{ color: '#6a5a45', fontSize: '0.7rem' }}>{rows.length} {t('城', 'cities')}</div>
          </div>
          <div style={{ background: '#1a140d', border: '1px solid #3a2c1c', padding: '0.5rem 0.6rem', borderRadius: 4 }}>
            <div style={{ color: '#8a7050', fontSize: '0.72rem' }}>{t('本季糧秣', 'Grain / season')}</div>
            <div style={{ color: netFoodTotal >= 0 ? '#7ed68a' : '#e8704a', fontSize: '1.05rem', fontFamily: 'ui-monospace, monospace' }}>{signed(netFoodTotal)}</div>
            <div style={{ color: '#6a5a45', fontSize: '0.7rem' }}>{t('收', 'in')} {num(totals.foodIn)} · {t('支', 'out')} {num(totals.foodUp)}</div>
          </div>
        </div>
        {/* 定稅 — the gold↔loyalty lever. Light eases the people, heavy fills
            the coffers and breeds resentment. */}
        {playerForceId && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{ color: '#8a7050', fontSize: '0.78rem' }}>{t('稅率', 'Tax rate')}</span>
            <div style={{ display: 'flex', gap: 3 }}>
              {(['light', 'normal', 'heavy'] as TaxRate[]).map((r) => (
                <button
                  key={r}
                  onClick={() => setTaxPolicy(playerForceId, r)}
                  style={{
                    background: tax === r ? '#3a2d20' : 'transparent',
                    border: `1px solid ${tax === r ? '#d4a84a' : '#4a3520'}`,
                    color: tax === r ? '#f0d98a' : '#8a7050',
                    padding: '0.2rem 0.6rem', borderRadius: 4, cursor: 'pointer',
                    fontFamily: 'inherit', fontSize: '0.78rem',
                  }}
                >{t(TAX_EFFECT[r].zh, TAX_EFFECT[r].en)}</button>
              ))}
            </div>
            <span style={{ color: tax === 'heavy' ? '#e0a070' : tax === 'light' ? '#9ad6a8' : '#6a5a45', fontSize: '0.72rem' }}>
              {tax === 'heavy' ? t('入金 ×1.4,民忠 −3/季', '+40% gold, −3 loyalty/season')
                : tax === 'light' ? t('入金 ×0.7,民忠 +2/季', '−30% gold, +2 loyalty/season')
                : t('常制,民忠不增不減', 'baseline, loyalty steady')}
            </span>
          </div>
        )}
        {/* 鑄錢 — debase the coinage for fast gold at the cost of inflation. */}
        {playerForceId && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '0.5rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => mintCoin()}
              title={t('鑄小錢 — 即入大筆金,然通脹上揚,蝕日後稅入(漸消)', 'Debase the coinage — a gold windfall now, but inflation rises and saps future tax income (eases over time)')}
              style={{
                background: 'rgba(212,168,74,0.16)', border: '1px solid #d4a84a', color: '#f0d98a',
                padding: '0.25rem 0.7rem', borderRadius: 4, cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.8rem',
              }}
            >🪙 {t('鑄錢', 'Mint coin')}</button>
            <span style={{ fontSize: '0.74rem', color: inflation >= 60 ? '#e0707a' : inflation >= 25 ? '#e0a070' : '#8a7050' }}>
              {t('通脹', 'Inflation')} <strong>{inflation}</strong>
              {inflation > 0 && <span style={{ color: '#8a7050' }}> · {t(`稅入 −${Math.round(inflation / 2.5)}%`, `−${Math.round(inflation / 2.5)}% tax`)}</span>}
            </span>
          </div>
        )}
        {season !== 'autumn' && (
          <div style={{ color: '#8a7050', fontSize: '0.72rem', marginBottom: '0.5rem' }}>
            🌾 {t('糧入僅在秋收結算,他季只支不入。', 'Grain only comes in at the autumn harvest — other seasons are upkeep-only.')}
          </div>
        )}

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
          <thead>
            <tr style={{ color: '#8a7050', borderBottom: '1px solid #4a3520' }}>
              <th style={{ textAlign: 'left', padding: '4px 6px' }}>{t('城', 'City')}</th>
              <th style={{ textAlign: 'right', padding: '4px 6px' }}>{t('入金', 'Gold')}</th>
              <th style={{ textAlign: 'right', padding: '4px 6px' }}>{t('糧入', 'Grain+')}</th>
              <th style={{ textAlign: 'right', padding: '4px 6px' }}>{t('兵糧', 'Upkeep')}</th>
              <th style={{ textAlign: 'right', padding: '4px 6px' }}>{t('糧淨', 'Net')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.city.id} onClick={() => { selectCity(r.city.id); onClose(); }} style={{ cursor: 'pointer', borderBottom: '1px solid #2a2014' }}>
                <td style={{ padding: '3px 6px', color: r.starving ? '#e8704a' : '#f0e0b0' }}>
                  {r.city.name.zh}{r.starving ? ' ⚠' : ''}
                </td>
                <td style={{ textAlign: 'right', padding: '3px 6px', fontFamily: 'ui-monospace, monospace', color: '#7ed68a' }}>+{num(r.gold)}</td>
                <td style={{ textAlign: 'right', padding: '3px 6px', fontFamily: 'ui-monospace, monospace', color: '#c0a878' }}>{r.foodIn ? `+${num(r.foodIn)}` : '—'}</td>
                <td style={{ textAlign: 'right', padding: '3px 6px', fontFamily: 'ui-monospace, monospace', color: '#a88' }}>−{num(r.foodUp)}</td>
                <td style={{ textAlign: 'right', padding: '3px 6px', fontFamily: 'ui-monospace, monospace', color: r.netFood >= 0 ? '#7ed68a' : '#e8704a' }}>{signed(r.netFood)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && (
          <div style={{ color: '#8a7050', fontSize: '0.85rem', padding: '1rem 0' }}>{t('尚無城池。', 'No cities yet.')}</div>
        )}
      </div>
    </div>
  );
}
