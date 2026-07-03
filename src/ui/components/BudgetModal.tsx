import { useMemo } from 'react';
import { useGameStore } from '../../game/state/store';
import { realmBudget, TAX_EFFECT } from '../../game/systems/economy';
import type { TaxRate } from '../../game/types';
import { useT } from '../i18n';
import { Modal } from './Modal';
import { Icon } from './Icon';
import { playSfx } from '../../game/systems/sound';
import { SpecialtyDominionPanel } from './SpecialtyDominionPanel';

/**
 * 度支簿 — the realm's full season ledger. It runs realmBudget(), the same
 * helpers the season engine applies, so it nets the tax/harvest the cities
 * raise against the realm-level flows that actually move at season-end (通商
 * 條約 · 名產商路 · 食邑 · 官署常俸 · 俸祿). The bottom line is the TRUE net,
 * not a gross-income guess; a red 净金 plus a 府庫見底 countdown is the warning.
 */
export function BudgetModal({ onClose }: { onClose: () => void }) {
  const t = useT();
  const cities = useGameStore((s) => s.cities);
  const officers = useGameStore((s) => s.officers);
  const allBuildings = useGameStore((s) => s.buildings);
  const forces = useGameStore((s) => s.forces);
  const season = useGameStore((s) => s.date.season);
  const playerForceId = useGameStore((s) => s.playerForceId);
  const selectCity = useGameStore((s) => s.selectCity);
  const tax: TaxRate = useGameStore((s) => (playerForceId ? s.taxPolicy[playerForceId] : undefined) ?? 'normal');
  const setTaxPolicy = useGameStore((s) => s.setTaxPolicy);
  const inflation = useGameStore((s) => s.inflation ?? 0);
  const mintCoin = useGameStore((s) => s.mintCoin);
  const solicitDonations = useGameStore((s) => s.solicitDonations);
  const borrowWarFunds = useGameStore((s) => s.borrowWarFunds);
  const merchantLoan = useGameStore((s) => s.merchantLoan ?? null);
  const refugees = useGameStore((s) => s.refugees ?? 0);
  const weather = useGameStore((s) => s.weather);
  const diplomacy = useGameStore((s) => s.diplomacy);
  const appointments = useGameStore((s) => s.appointments);
  const tradePartners = useGameStore((s) => s.tradePartners);
  const treasuryHistory = useGameStore((s) => s.treasuryHistory ?? []);

  const budget = useMemo(() => {
    if (!playerForceId) return null;
    return realmBudget({
      cities, officers, forceId: playerForceId, season, tax, inflation,
      weatherKind: weather?.kind ?? 'clear',
      buildings: allBuildings, tradePartners, diplomacy, appointments,
      statecraft: forces[playerForceId]?.statecraft ?? null,
    });
  }, [cities, officers, allBuildings, forces, season, playerForceId, tax, inflation, weather, tradePartners, diplomacy, appointments]);

  const seasonZh = { spring: '春', summer: '夏', autumn: '秋', winter: '冬' }[season];
  const num = (n: number) => Math.round(n).toLocaleString();
  const signed = (n: number) => (n >= 0 ? `+${num(n)}` : `−${num(-n)}`);

  if (!budget) {
    return (
      <Modal onClose={onClose} width="min(720px, 100%)" icon={<Icon name="gold" size={18} />} title={t('度支簿', 'Treasury')}>
        <div style={{ color: '#7a8893', fontSize: '0.85rem', padding: '1rem 0' }}>{t('尚無勢力。', 'No force yet.')}</div>
      </Modal>
    );
  }

  const { rows, treasury, goldLines, goldNet, foodLines, foodNet, goldRunway, foodRunway } = budget;
  const isAutumn = season === 'autumn';

  // Donation cooldown — once a year. Derive remaining seasons for the button label.
  const date = useGameStore.getState().date;
  const order = { spring: 0, summer: 1, autumn: 2, winter: 3 }[date.season];
  const absSeason = date.year * 4 + order;
  const lastDonationAt = useGameStore.getState().lastDonationAt;
  const donateWait = lastDonationAt != null ? Math.max(0, 4 - (absSeason - lastDonationAt)) : 0;

  // Income-statement ledger lines (omit zero rows to keep it tight).
  const goldRows: Array<{ zh: string; en: string; v: number }> = [
    { zh: '稅入', en: 'Taxes', v: goldLines.tax },
    { zh: '名產商路', en: 'Trade routes', v: goldLines.tradeRoute },
    { zh: '通商條約', en: 'Treaties', v: goldLines.tradeTreaty },
    { zh: '食邑', en: 'Fiefs', v: goldLines.fief },
    { zh: '官署常俸', en: 'Offices', v: goldLines.office },
    { zh: '俸祿', en: 'Stipends', v: -goldLines.stipend },
  ].filter((r) => r.v !== 0);
  const foodRows: Array<{ zh: string; en: string; v: number }> = [
    { zh: '秋收', en: 'Harvest', v: foodLines.harvest },
    { zh: '食邑', en: 'Fiefs', v: foodLines.fief },
    { zh: '官署常俸', en: 'Offices', v: foodLines.office },
    { zh: '兵糧', en: 'Upkeep', v: -foodLines.upkeep },
  ].filter((r) => r.v !== 0);

  const card = { background: '#141c25', border: '1px solid #243240', padding: '0.5rem 0.6rem', borderRadius: 'var(--tkm-radius-sm)' } as const;
  const labelStyle = { color: '#7a8893', fontSize: '0.72rem' } as const;
  const mono = { fontFamily: 'ui-monospace, monospace' } as const;

  return (
    <Modal
      onClose={onClose}
      width="min(720px, 100%)"
      icon={<Icon name="gold" size={18} />}
      title={t('度支簿', 'Treasury')}
      badge={t(`${seasonZh}季預算`, `${season} budget`)}
    >
        {/* Realm summary — treasury on hand, net gold/season, net grain/season. */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: '0.6rem' }}>
          <div style={card}>
            <div style={labelStyle}>{t('府庫現金', 'On hand')}</div>
            <div style={{ ...mono, color: '#f2dd9a', fontSize: '1.05rem' }}>{num(treasury.gold)} <span style={{ fontSize: '0.7rem' }}>金</span></div>
            <div style={{ ...mono, color: '#aab6c0', fontSize: '0.72rem' }}>{num(treasury.food)} 糧</div>
          </div>
          <div style={card}>
            <div style={labelStyle}>{t('本季淨金', 'Net gold / season')}</div>
            <div style={{ ...mono, color: goldNet >= 0 ? '#7ed68a' : '#e8704a', fontSize: '1.05rem' }}>{signed(goldNet)}</div>
            <div style={{ fontSize: '0.7rem', color: goldRunway !== Infinity ? '#e8704a' : '#5f6c76' }}>
              {goldRunway !== Infinity ? t(`府庫 ${goldRunway} 季見底 ⚠`, `dry in ${goldRunway} qtr ⚠`) : `${rows.length} ${t('城', 'cities')}`}
            </div>
          </div>
          <div style={card}>
            <div style={labelStyle}>{t('本季淨糧', 'Net grain / season')}</div>
            <div style={{ ...mono, color: foodNet >= 0 ? '#7ed68a' : '#e8704a', fontSize: '1.05rem' }}>{signed(foodNet)}</div>
            <div style={{ fontSize: '0.7rem', color: foodRunway !== Infinity ? '#e8704a' : '#5f6c76' }}>
              {foodRunway !== Infinity ? t(`存糧 ${foodRunway} 季見底 ⚠`, `dry in ${foodRunway} qtr ⚠`) : t('糧有盈餘', 'surplus')}
            </div>
          </div>
        </div>

        {/* 度支沿革 — treasury trend over the last few seasons. */}
        {treasuryHistory.length >= 2 && (
          <Sparkline values={treasuryHistory} t={t} />
        )}

        {/* 收支明細 — the full income statement, gold | grain side by side. */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: '0.6rem' }}>
          <Ledger title={t('金 · 收支', 'Gold ledger')} rows={goldRows} net={goldNet} num={num} signed={signed} t={t} />
          <Ledger title={t('糧 · 收支', 'Grain ledger')} rows={foodRows} net={foodNet} num={num} signed={signed} t={t}
                  note={!isAutumn ? t('糧入僅秋收', 'harvest = autumn only') : weather?.kind === 'drought' ? t('旱災 秋收 ×0.55', 'drought ×0.55') : undefined} />
        </div>

        {/* 名產版圖 — strategic-good control, monopoly tiers, embargo lever. */}
        <SpecialtyDominionPanel />

        {/* 流民 — the realm-wide displaced pool. */}
        {refugees > 0 && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, marginBottom: '0.5rem',
            background: '#1c1814', border: '1px solid #5a4a2a', borderRadius: 'var(--tkm-radius-sm)', padding: '0.35rem 0.6rem',
          }}>
            <Icon name="city" size={14} color="#d4b070" />
            <span style={{ color: '#d4b070', fontSize: '0.8rem' }}>{t('天下流民', 'Refugees afield')}</span>
            <span style={{ ...mono, color: '#f2dd9a', fontSize: '0.9rem' }}>{num(refugees)}</span>
            <span style={{ color: '#8a7a5a', fontSize: '0.7rem', flex: 1, textAlign: 'right' }}>
              {t('輕稅 + 高民忠 + 餘容 → 引流民歸附', 'Light tax + high loyalty + headroom draws them in')}
            </span>
          </div>
        )}

        {/* 定稅 — the gold↔loyalty lever. */}
        {playerForceId && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{ color: '#7a8893', fontSize: '0.78rem' }}>{t('稅率', 'Tax rate')}</span>
            <div style={{ display: 'flex', gap: 3 }}>
              {(['light', 'normal', 'heavy'] as TaxRate[]).map((r) => (
                <button
                  key={r}
                  onClick={() => setTaxPolicy(playerForceId, r)}
                  style={{
                    background: tax === r ? '#26323e' : 'transparent',
                    border: `1px solid ${tax === r ? '#e6c473' : '#2b3845'}`,
                    color: tax === r ? '#f2dd9a' : '#7a8893',
                    padding: '0.2rem 0.6rem', borderRadius: 'var(--tkm-radius-sm)', cursor: 'pointer',
                    fontFamily: 'inherit', fontSize: '0.78rem',
                  }}
                >{t(TAX_EFFECT[r].zh, TAX_EFFECT[r].en)}</button>
              ))}
            </div>
            <span style={{ color: tax === 'heavy' ? '#e0a070' : tax === 'light' ? '#9ad6a8' : '#5f6c76', fontSize: '0.72rem' }}>
              {tax === 'heavy' ? t('入金 ×1.4,民忠 −3/季', '+40% gold, −3 loyalty/season')
                : tax === 'light' ? t('入金 ×0.7,民忠 +2/季', '−30% gold, +2 loyalty/season')
                : t('常制,民忠不增不減', 'baseline, loyalty steady')}
            </span>
          </div>
        )}

        {/* 應急 — one-off fundraising levers: 鑄錢 (inflation) and 勸募 (loyalty). */}
        {playerForceId && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '0.5rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => { mintCoin(); playSfx('coin'); }}
              title={t('鑄小錢 — 即入大筆金,然通脹上揚,蝕日後稅入(漸消)', 'Debase the coinage — a gold windfall now, but inflation rises and saps future tax income (eases over time)')}
              style={{
                background: 'rgba(212,168,74,0.16)', border: '1px solid #e6c473', color: '#f2dd9a',
                padding: '0.25rem 0.7rem', borderRadius: 'var(--tkm-radius-sm)', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.8rem',
              }}
            ><Icon name="gold" size={13} /> {t('鑄錢', 'Mint coin')}</button>
            <button
              onClick={() => { const r = solicitDonations(); if (r.ok) playSfx('coin'); }}
              disabled={donateWait > 0}
              title={t('勸募 — 向民間募捐,即入一筆金(隨國力與民忠遞增),然民忠 −8/城。一年一次', 'Solicit donations — an immediate gold gift scaled by realm size & loyalty, but −8 loyalty per city. Once a year')}
              style={{
                background: donateWait > 0 ? 'transparent' : 'rgba(124,214,138,0.14)',
                border: `1px solid ${donateWait > 0 ? '#2b3845' : '#7ed68a'}`,
                color: donateWait > 0 ? '#5f6c76' : '#9ad6a8',
                padding: '0.25rem 0.7rem', borderRadius: 'var(--tkm-radius-sm)', cursor: donateWait > 0 ? 'default' : 'pointer',
                fontFamily: 'inherit', fontSize: '0.8rem',
              }}
            ><Icon name="city" size={13} /> {donateWait > 0 ? t(`勸募(待 ${donateWait} 季)`, `Donate (${donateWait}q)`) : t('勸募', 'Donate')}</button>
            <button
              onClick={() => { const r = borrowWarFunds(); if (r.ok) playSfx('coin'); }}
              disabled={!!merchantLoan && merchantLoan.owed > 0}
              title={t('富商借餉 — 即入一大筆金,分 8 季自首都償還(本+息約 25%);債未清不可再借', 'War-loan — a large lump of gold now, auto-repaid from the capital over 8 seasons (~25% interest); no new loan until repaid')}
              style={{
                background: merchantLoan && merchantLoan.owed > 0 ? 'transparent' : 'rgba(124,170,214,0.14)',
                border: `1px solid ${merchantLoan && merchantLoan.owed > 0 ? '#2b3845' : '#7ea8d6'}`,
                color: merchantLoan && merchantLoan.owed > 0 ? '#5f6c76' : '#9abce0',
                padding: '0.25rem 0.7rem', borderRadius: 'var(--tkm-radius-sm)', cursor: merchantLoan && merchantLoan.owed > 0 ? 'default' : 'pointer',
                fontFamily: 'inherit', fontSize: '0.8rem',
              }}
            ><Icon name="gold" size={13} /> {t('借餉', 'War-loan')}</button>
            {merchantLoan && merchantLoan.owed > 0 && (
              <span style={{ fontSize: '0.74rem', color: '#e0a070' }}>
                {t(`欠餉 ${merchantLoan.owed.toLocaleString()}`, `Owed ${merchantLoan.owed.toLocaleString()}`)}
                <span style={{ color: '#7a8893' }}> · {t(`每季 −${merchantLoan.perSeason.toLocaleString()}`, `−${merchantLoan.perSeason.toLocaleString()}/q`)}</span>
              </span>
            )}
            <span style={{ fontSize: '0.74rem', color: inflation >= 60 ? '#e0707a' : inflation >= 25 ? '#e0a070' : '#7a8893' }}>
              {t('通脹', 'Inflation')} <strong>{inflation}</strong>
              {inflation > 0 && <span style={{ color: '#7a8893' }}> · {t(`稅入 −${Math.round(inflation / 2.5)}%`, `−${Math.round(inflation / 2.5)}% tax`)}</span>}
            </span>
          </div>
        )}

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
          <thead>
            <tr style={{ color: '#7a8893', borderBottom: '1px solid #2b3845' }}>
              <th style={{ textAlign: 'left', padding: '4px 6px' }}>{t('城', 'City')}</th>
              <th style={{ textAlign: 'right', padding: '4px 6px' }}>{t('入金', 'Gold')}</th>
              <th style={{ textAlign: 'right', padding: '4px 6px' }}>{t('糧入', 'Grain+')}</th>
              <th style={{ textAlign: 'right', padding: '4px 6px' }}>{t('兵糧', 'Upkeep')}</th>
              <th style={{ textAlign: 'right', padding: '4px 6px' }}>{t('糧淨', 'Net')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.city.id} onClick={() => { selectCity(r.city.id); onClose(); }} style={{ cursor: 'pointer', borderBottom: '1px solid #18212b' }}>
                <td style={{ padding: '3px 6px', color: r.starving ? '#e8704a' : '#eef4f8' }}>
                  {r.city.name.zh}{r.starving ? ' ⚠' : ''}
                </td>
                <td style={{ ...mono, textAlign: 'right', padding: '3px 6px', color: '#7ed68a' }}>+{num(r.gold)}</td>
                <td style={{ ...mono, textAlign: 'right', padding: '3px 6px', color: '#aab6c0' }}>{r.foodIn ? `+${num(r.foodIn)}` : '—'}</td>
                <td style={{ ...mono, textAlign: 'right', padding: '3px 6px', color: '#a88' }}>−{num(r.foodUp)}</td>
                <td style={{ ...mono, textAlign: 'right', padding: '3px 6px', color: r.netFood >= 0 ? '#7ed68a' : '#e8704a' }}>{signed(r.netFood)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && (
          <div style={{ color: '#7a8893', fontSize: '0.85rem', padding: '1rem 0' }}>{t('尚無城池。', 'No cities yet.')}</div>
        )}
    </Modal>
  );
}

/** One income-statement column: line items + a netted bottom rule. */
function Ledger({ title, rows, net, num, signed, t, note }: {
  title: string;
  rows: Array<{ zh: string; en: string; v: number }>;
  net: number;
  num: (n: number) => string;
  signed: (n: number) => string;
  t: (zh: string, en: string) => string;
  note?: string;
}) {
  const mono = { fontFamily: 'ui-monospace, monospace' } as const;
  return (
    <div style={{ background: '#10171f', border: '1px solid #1e2a34', borderRadius: 'var(--tkm-radius-sm)', padding: '0.45rem 0.55rem' }}>
      <div style={{ color: '#9fb0bc', fontSize: '0.74rem', marginBottom: 3, display: 'flex', justifyContent: 'space-between' }}>
        <span>{title}</span>
        {note && <span style={{ color: '#6f7c86', fontSize: '0.66rem' }}>{note}</span>}
      </div>
      {rows.length === 0 && <div style={{ color: '#5f6c76', fontSize: '0.72rem' }}>{t('無', 'none')}</div>}
      {rows.map((r) => (
        <div key={r.zh} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', padding: '1px 0' }}>
          <span style={{ color: '#8a98a4' }}>{t(r.zh, r.en)}</span>
          <span style={{ ...mono, color: r.v >= 0 ? '#7ed68a' : '#d98a6a' }}>{r.v >= 0 ? `+${num(r.v)}` : `−${num(-r.v)}`}</span>
        </div>
      ))}
      <div style={{ borderTop: '1px solid #243240', marginTop: 3, paddingTop: 2, display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
        <span style={{ color: '#aab6c0' }}>{t('淨', 'Net')}</span>
        <span style={{ ...mono, color: net >= 0 ? '#7ed68a' : '#e8704a' }}>{signed(net)}</span>
      </div>
    </div>
  );
}

/** 度支沿革 — a tiny inline treasury-over-time sparkline. */
function Sparkline({ values, t }: { values: number[]; t: (zh: string, en: string) => string }) {
  const w = 200, h = 26;
  const min = Math.min(...values), max = Math.max(...values);
  const span = max - min || 1;
  const pts = values.map((v, i) => {
    const x = values.length === 1 ? w : (i / (values.length - 1)) * w;
    const y = h - 2 - ((v - min) / span) * (h - 4);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  const rising = values[values.length - 1] >= values[0];
  const stroke = rising ? '#7ed68a' : '#e8704a';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '0.6rem' }}>
      <span style={{ color: '#7a8893', fontSize: '0.72rem', whiteSpace: 'nowrap' }}>{t('府庫沿革', 'Treasury trend')}</span>
      <svg width={w} height={h} style={{ flex: 1 }} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
        <polyline points={pts} fill="none" stroke={stroke} strokeWidth={1.5} />
      </svg>
      <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: '0.72rem', color: stroke, whiteSpace: 'nowrap' }}>
        {rising ? '▲' : '▼'} {Math.round(values[values.length - 1]).toLocaleString()}
      </span>
    </div>
  );
}
