import { useMemo, useState } from 'react';
import { useGameStore } from '../../game/state/store';
import { marchDurationFor } from '../../game/data/cities';
import { navalReachableCityIds } from '../../game/data/ports';
import { convoyCapacity, planConvoy } from '../../game/systems/convoy';
import { playSfx } from '../../game/systems/sound';
import { useLanguage, useT } from '../i18n';
import { Modal } from './Modal';

/**
 * 輜重發運 — compose one supply column: pick a destination and an escorting
 * officer (whose 政治 sets the load), then load grain/gold/troops with sliders
 * against a live capacity meter, see the ETA and road-loss the haul will
 * actually take, and dispatch it in one go (a single mixed convoy — not a cart
 * per cargo). Replaces the old cramped preset-button rows.
 */
export function ConvoyDispatchModal({ fromCityId, onClose }: { fromCityId: string; onClose: () => void }) {
  const t = useT();
  const lang = useLanguage();
  const cities = useGameStore((s) => s.cities);
  const officers = useGameStore((s) => s.officers);
  const ports = useGameStore((s) => s.ports);
  const date = useGameStore((s) => s.date);
  const playerForceId = useGameStore((s) => s.playerForceId);
  const dispatchConvoy = useGameStore((s) => s.dispatchConvoy);
  const standingRoutes = useGameStore((s) => s.standingRoutes);
  const setStandingRoute = useGameStore((s) => s.setStandingRoute);

  const from = cities[fromCityId];
  const woodenOx = useMemo(
    () => Object.values(officers).some((o) => o.forceId === playerForceId && o.status !== 'dead' && (o.skills ?? []).includes('wooden-ox' as never)),
    [officers, playerForceId],
  );
  const dests = useMemo(
    () => Object.values(cities).filter((c) => c.ownerForceId === playerForceId && c.id !== fromCityId)
      .sort((a, b) => (from?.adjacentCityIds.includes(b.id) ? 1 : 0) - (from?.adjacentCityIds.includes(a.id) ? 1 : 0) || a.name.zh.localeCompare(b.name.zh)),
    [cities, playerForceId, fromCityId, from],
  );
  const escorts = useMemo(
    () => Object.values(officers)
      .filter((o) => o.forceId === playerForceId && o.locationCityId === fromCityId && (o.status === 'idle' || o.status === 'active') && !o.task)
      .sort((a, b) => b.stats.politics - a.stats.politics),
    [officers, playerForceId, fromCityId],
  );

  const [destId, setDestId] = useState(dests[0]?.id ?? '');
  const [escortId, setEscortId] = useState(escorts[0]?.id ?? '');
  const [food, setFood] = useState(0);
  const [gold, setGold] = useState(0);
  const [troops, setTroops] = useState(0);
  const [cautious, setCautious] = useState(false);

  const dest = cities[destId] ?? dests[0];
  const escort = officers[escortId] && escorts.some((o) => o.id === escortId) ? officers[escortId] : escorts[0];
  const cap = escort ? convoyCapacity(escort) : 0;

  if (!from || dests.length === 0) {
    return (
      <Modal onClose={onClose} icon="🐂" title={t('輜重發運', 'Dispatch Convoy')} width="min(440px, 100%)">
        <div style={{ color: '#7a8893', fontSize: '0.86rem', padding: '1rem 0' }}>{t('無其他可運之城。', 'No other city to ship to.')}</div>
      </Modal>
    );
  }

  const total = food + gold + troops;
  const remaining = Math.max(0, cap - total);
  const foodStock = from.food;
  const goldStock = from.gold;
  const troopStock = Math.max(0, from.troops - 100);

  // Live ETA + road-loss, identical to what dispatch will apply.
  const naval = dest ? (!from.adjacentCityIds.includes(dest.id) && navalReachableCityIds(fromCityId, ports).has(dest.id)) : false;
  const baseSeasons = dest ? Math.max(1, marchDurationFor(from, dest, date.season)) : 1;
  const plan = planConvoy({ baseSeasons, season: date.season, officer: escort, naval, woodenOx, cautious });
  const lossPct = Math.round((1 - plan.keepFrac) * 100);

  const standingOn = dest ? (standingRoutes ?? []).some((r) => r.fromCityId === fromCityId && r.toCityId === dest.id) : false;

  const send = () => {
    if (!dest || !escort || total <= 0) return;
    const r = dispatchConvoy(fromCityId, dest.id, food, gold, troops, escort.id, cautious);
    if (r.ok) { playSfx('coin'); onClose(); }
  };

  const cargoRow = (
    label: string, value: number, set: (n: number) => void, stock: number, color: string,
  ) => {
    const max = Math.min(stock, value + remaining); // can't push the column over capacity
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '2.4rem 1fr 5.2rem', gap: 8, alignItems: 'center' }}>
        <span style={{ fontSize: '0.82rem', color }}>{label}</span>
        <input
          type="range" min={0} max={Math.max(0, max)} step={Math.max(100, Math.round(stock / 40 / 100) * 100)}
          value={Math.min(value, max)}
          onChange={(e) => set(Math.min(max, Number(e.target.value)))}
          disabled={!escort || stock <= 0}
          style={{ accentColor: color, width: '100%' }}
        />
        <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: '0.78rem', color: '#cdd8e0', textAlign: 'right' }}>
          {value.toLocaleString()}<span style={{ color: '#5f6c76' }}> /{stock.toLocaleString()}</span>
        </span>
      </div>
    );
  };

  const overCap = cap > 0 && total > cap;
  return (
    <Modal onClose={onClose} icon="🐂" title={t('輜重發運', 'Dispatch Convoy')} badge={t(`自 ${from.name.zh}`, `from ${from.name.en}`)} width="min(480px, 100%)">
      {/* Destination + escort */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: '0.8rem' }}>
        <label style={{ display: 'grid', gridTemplateColumns: '3.4rem 1fr', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: '0.78rem', color: '#7a8893' }}>{t('目的地', 'To')}</span>
          <select value={dest?.id ?? ''} onChange={(e) => setDestId(e.target.value)} style={selectStyle}>
            {dests.map((c) => (
              <option key={c.id} value={c.id}>
                {(lang === 'en' ? c.name.en : c.name.zh)} · {t('糧', 'grain')}{Math.round(c.food / 1000)}k{from.adjacentCityIds.includes(c.id) ? t(' · 鄰', ' · adj') : navalReachableCityIds(fromCityId, ports).has(c.id) ? ' · 🚢' : ''}
              </option>
            ))}
          </select>
        </label>
        <label style={{ display: 'grid', gridTemplateColumns: '3.4rem 1fr', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: '0.78rem', color: '#7a8893' }}>{t('押運', 'Escort')}</span>
          {escorts.length === 0 ? (
            <span style={{ fontSize: '0.78rem', color: '#e0a070' }}>{t('此城無閒置武將可押運', 'no idle officer here to escort')}</span>
          ) : (
            <select value={escort?.id ?? ''} onChange={(e) => setEscortId(e.target.value)} style={selectStyle}>
              {escorts.map((o) => (
                <option key={o.id} value={o.id}>{(lang === 'en' ? o.name.en : o.name.zh)} · {t('政', 'POL')}{o.stats.politics} · {t('載量', 'cap')}{convoyCapacity(o).toLocaleString()}</option>
              ))}
            </select>
          )}
        </label>
      </div>

      {/* Cargo sliders */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: '0.7rem', opacity: escort ? 1 : 0.5 }}>
        {cargoRow(t('糧', 'Grain'), food, setFood, foodStock, '#d8c88a')}
        {cargoRow(t('金', 'Gold'), gold, setGold, goldStock, '#e8c84a')}
        {cargoRow(t('兵', 'Troops'), troops, setTroops, troopStock, '#9ec0d8')}
      </div>

      {/* Load meter */}
      <div style={{ marginBottom: '0.6rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', color: '#7a8893', marginBottom: 3 }}>
          <span>{t('載量', 'Load')}</span>
          <span style={{ fontFamily: 'ui-monospace, monospace', color: overCap ? '#e0707a' : '#cdd8e0' }}>{total.toLocaleString()} / {cap.toLocaleString()}</span>
        </div>
        <div style={{ height: 8, background: '#10161e', border: '1px solid #2b3845', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{ width: `${cap > 0 ? Math.min(100, (total / cap) * 100) : 0}%`, height: '100%', background: overCap ? '#b8442e' : total / Math.max(1, cap) > 0.85 ? '#e6c473' : '#6fae73' }} />
        </div>
      </div>

      {/* ETA + loss + arrivals */}
      <div style={{ fontSize: '0.76rem', color: '#aab6c0', marginBottom: '0.6rem', lineHeight: 1.7 }}>
        {t(`約 ${plan.seasons} 旬抵達`, `≈ ${plan.seasons} season${plan.seasons > 1 ? 's' : ''} en route`)}
        {' · '}{t(`途耗 ~${lossPct}%`, `~${lossPct}% road loss`)}
        {naval && t(' · 漕運', ' · by water')}{woodenOx && t(' · 木牛流馬', ' · Wooden Ox')}
        {total > 0 && (
          <div style={{ color: '#7a8893' }}>
            {t('實到', 'arrives')}:
            {food > 0 && ` 糧${Math.floor(food * plan.keepFrac).toLocaleString()}`}
            {gold > 0 && ` 金${Math.floor(gold * plan.keepFrac).toLocaleString()}`}
            {troops > 0 && ` 兵${Math.floor(troops * plan.keepFrac).toLocaleString()}`}
          </div>
        )}
      </div>

      {/* Options */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', marginBottom: '0.9rem' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.76rem', color: cautious ? '#9ad6a8' : '#7a8893', cursor: 'pointer' }}>
          <input type="checkbox" checked={cautious} onChange={(e) => setCautious(e.target.checked)} />
          {t('謹慎走小路(+1旬,少被劫)', 'Back-roads (+1 season, safer)')}
        </label>
        {dest && (
          <button
            onClick={() => setStandingRoute(fromCityId, dest.id, !standingOn)}
            style={{ ...selectStyle, cursor: 'pointer', padding: '0.2rem 0.6rem', color: standingOn ? '#9ad6a8' : '#e6c473', borderColor: standingOn ? '#6fae73' : '#2b3845', background: standingOn ? 'rgba(126,214,138,0.12)' : '#080b0e' }}
            title={t('常運糧道 — 每季自動把餘糧運往此城(無將小隊)', 'Standing route — auto-ship surplus grain here each season')}
          >
            {standingOn ? t('↻ 常運中', '↻ Standing on') : t('↻ 設常運', '↻ Standing route')}
          </button>
        )}
      </div>

      <button
        onClick={send}
        disabled={!escort || total <= 0}
        style={{
          width: '100%', padding: '0.5rem', borderRadius: 6, cursor: !escort || total <= 0 ? 'default' : 'pointer',
          fontFamily: 'inherit', fontSize: '0.92rem', letterSpacing: '0.1rem',
          background: !escort || total <= 0 ? '#1b2531' : 'linear-gradient(180deg, rgba(230,196,115,0.22), rgba(230,196,115,0.08))',
          border: `1px solid ${!escort || total <= 0 ? '#2b3845' : '#e6c473'}`,
          color: !escort || total <= 0 ? '#5f6c76' : '#f2dd9a',
        }}
      >
        {t('發運', 'Dispatch')} {total > 0 ? `· ${total.toLocaleString()}` : ''}
      </button>
    </Modal>
  );
}

const selectStyle = {
  background: '#080b0e', border: '1px solid #2b3845', color: '#e6c473',
  padding: '0.3rem 0.4rem', fontFamily: 'inherit', fontSize: '0.82rem', borderRadius: 4,
} as const;
