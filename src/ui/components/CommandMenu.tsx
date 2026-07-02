import { useMemo, useState } from 'react';
import { useGameStore } from '../../game/state/store';
import { COMMAND_DEFS, meetsMinSize } from '../../game/systems/commands';
import { citySize, CITY_SIZES_BY_ID } from '../../game/systems/citySize';
import type { GovernorStance } from '../../game/systems/governor';
import type { EntityId, InternalAffairsType } from '../../game/types';
import { MarchPicker } from './MarchPicker';
import { TrainingPicker } from './TrainingPicker';
import { cityHasAcademy, cityHasMentors } from '../../game/systems/training';
import { buyQuote, sellQuote, marketOutlook } from '../../game/systems/market';
import { buildingBonuses } from '../../game/systems/buildings';
import { useMarketShock } from '../hooks/useMarketShock';
import { OfficerPicker } from './OfficerPicker';
import { Icon, type IconName } from './Icon';
import styles from './CommandMenu.module.css';
import { useT, useLanguage, useDesc } from '../i18n';

interface Props {
  cityId: EntityId;
}

const EMPTY_DELEGATIONS: Record<string, string> = {};

// 基本內政 — always available.
const BASIC_ORDER: InternalAffairsType[] = [
  'develop-agriculture',
  'develop-commerce',
  'build-defense',
  'recruit-troops',
  'military-farming',
  'drill-troops',
  'special-training',
  'improve-loyalty',
  'relief',
  'anti-corruption',
  'promote-learning',
  'flood-control',
  'garrison',
  'search',
  'encourage-migration',
];
// 大型工程 — unlocked once the city reaches a higher tier.
const MAJOR_ORDER: InternalAffairsType[] = [
  'major-agriculture',
  'major-commerce',
  'major-defense',
  'upgrade-wall',
];

type ModalState =
  | { kind: 'closed' }
  | { kind: 'internal'; type: InternalAffairsType }
  | { kind: 'march' }
  | { kind: 'training' }
  | { kind: 'drill' }
  | { kind: 'market' };

export function CommandMenu({ cityId }: Props) {
  const [modal, setModal] = useState<ModalState>({ kind: 'closed' });
  const city = useGameStore((s) => s.cities[cityId]);
  // Select the map by reference (stable) — filter inside useMemo to avoid creating
  // a new array on every render (which would trigger an infinite re-render loop).
  const allPending = useGameStore((s) => s.pendingCommands);
  const pendingInCity = useMemo(
    () => Object.values(allPending).filter((c) => c.cityId === cityId),
    [allPending, cityId],
  );
  const officersMap = useGameStore((s) => s.officers);
  const citiesMap = useGameStore((s) => s.cities);
  const cancelCommand = useGameStore((s) => s.cancelCommand);
  const buildings = useGameStore((s) => s.buildings);
  const delegations = useGameStore((s) => s.cityDelegations ?? EMPTY_DELEGATIONS);
  const delegateCity = useGameStore((s) => s.delegateCity);
  const governorStances = useGameStore((s) => s.governorStances ?? EMPTY_DELEGATIONS);
  const setGovernorStance = useGameStore((s) => s.setGovernorStance);
  const pendingTrainings = useGameStore((s) => s.pendingTrainings);
  const playerForceId = useGameStore((s) => s.playerForceId);
  const t = useT();
  const lang = useLanguage();
  const desc = useDesc();

  // 演習 — needs at least one stationed officer to take the field.
  const garrisonCount = useMemo(
    () => Object.values(officersMap).filter(
      (o) => o.locationCityId === cityId && o.forceId === playerForceId
        && o.status !== 'dead' && o.status !== 'unsearched' && o.status !== 'imprisoned',
    ).length,
    [officersMap, cityId, playerForceId],
  );

  if (!city) return null;

  const marchDef = COMMAND_DEFS['march'];
  const canMarch = city.gold >= marchDef.goldCost && city.troops > 0;

  const stationed = Object.values(officersMap).filter(
    (o) => o.locationCityId === cityId && o.forceId === playerForceId
      && o.status !== 'dead' && o.status !== 'unsearched' && o.status !== 'imprisoned',
  );
  const governorId = delegations[cityId];
  const governor = governorId ? officersMap[governorId] : null;

  const currentSize = citySize(city);
  const majorUnlocked = MAJOR_ORDER.some((type) => meetsMinSize(currentSize.id, COMMAND_DEFS[type].minSize));

  // Small full-width divider that labels a band of related orders.
  const groupHead = (key: string, icon: IconName, label: string) => (
    <div
      key={key}
      style={{
        gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: 6,
        fontSize: '0.64rem', color: '#8a98a4', letterSpacing: '0.14rem',
        marginTop: key === 'basic' ? 0 : 6, paddingBottom: 3, borderBottom: '1px solid #1d2731',
      }}
    >
      <Icon name={icon} size={11} color="#8a98a4" />{label}
    </div>
  );

  const renderInternal = (type: InternalAffairsType) => {
    const def = COMMAND_DEFS[type];
    const tierOk = meetsMinSize(currentSize.id, def.minSize);
    if (!tierOk) return null; // tier-locked orders simply don't show
    // 賑濟 spends FOOD, not gold — gate and label it on the granary so the menu
    // doesn't advertise it as a free (0g) order or let it fire on empty stores.
    const reliefFood = type === 'relief' ? Math.max(500, Math.round(city.population * 0.02)) : 0;
    const canAfford = type === 'relief' ? city.food >= reliefFood : city.gold >= def.goldCost;
    const costLabel = type === 'relief' ? `${reliefFood}${t('糧', ' food')}` : `${def.goldCost}g`;
    const minSizeDef = def.minSize ? CITY_SIZES_BY_ID[def.minSize] : null;
    const reason = !canAfford
      ? (type === 'relief' ? t('存糧不足', 'Not enough food') : t('金錢不足', 'Not enough gold'))
      : desc(def);
    return (
      <button
        key={type}
        className={styles.cmdButton}
        onClick={() => setModal({ kind: 'internal', type })}
        disabled={!canAfford}
        title={reason}
      >
        <span className={styles.cmdLabelZh}>
          {lang === 'en' ? def.label.en : def.label.zh}
          {def.minSize && <span style={{ fontSize: '0.55rem', color: '#7a8893', marginLeft: 4 }}>★{lang === 'en' ? minSizeDef?.name.en : minSizeDef?.name.zh}+</span>}
        </span>
        {lang === 'both' && <span className={styles.cmdLabelEn}>{def.label.en}</span>}
        <span className={styles.cmdCost}>{costLabel}</span>
      </button>
    );
  };

  return (
    <>
      {/* 委任太守 — hand the city to a governor; every tick they file one
          internal command for you through the normal pipeline. */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
        background: governor ? 'rgba(126, 214, 138, 0.08)' : 'rgba(20, 14, 8, 0.5)',
        border: `1px solid ${governor ? '#5a8a50' : '#26323e'}`,
        padding: '0.35rem 0.6rem', marginBottom: '0.5rem',
        fontFamily: 'var(--tkm-font-body)', fontSize: '0.78rem', color: '#aab6c0',
      }}>
        <span>
          {t('太守', 'Governor')}{governor ? `:${lang === 'en' ? governor.name.en : governor.name.zh}` : ''}
          <span style={{ display: 'block', fontSize: '0.7rem', color: '#7a8893' }}>
            {governor
              ? t('已委任 — 每旬自動施政', 'Delegated — auto-governs each tick')
              : t('委任後此城自動內政', 'Delegate to auto-run internal affairs')}
          </span>
        </span>
        <select
          value={governorId ?? ''}
          onChange={(e) => delegateCity(cityId, e.target.value || null)}
          style={{
            background: '#080b0e', border: '1px solid #2b3845', color: '#e6c473',
            padding: '0.2rem', fontFamily: 'inherit', fontSize: '0.72rem', maxWidth: 130,
          }}
        >
          <option value="">{t('親自治理', 'Rule directly')}</option>
          {stationed.map((o) => (
            <option key={o.id} value={o.id}>
              {lang === 'en' ? o.name.en : o.name.zh}({t('政', 'P')}{o.stats.politics})
            </option>
          ))}
        </select>
      </div>
      {/* 施政重點 — steer a delegated governor without micromanaging. */}
      {governor && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: '-0.35rem', marginBottom: '0.5rem', padding: '0.2rem 0.6rem', fontFamily: 'var(--tkm-font-body)', fontSize: '0.72rem', color: '#9aa6b0' }}>
          <span>{t('施政重點', 'Focus')}</span>
          <select
            value={governorStances[cityId] ?? 'balanced'}
            onChange={(e) => setGovernorStance(cityId, e.target.value as GovernorStance)}
            style={{ background: '#080b0e', border: '1px solid #2b3845', color: '#e6c473', padding: '0.2rem', fontFamily: 'inherit', fontSize: '0.72rem', maxWidth: 130 }}
          >
            <option value="balanced">{t('均衡', 'Balanced')}</option>
            <option value="economy">{t('富國', 'Economy')}</option>
            <option value="military">{t('強兵', 'Military')}</option>
            <option value="walls">{t('守備', 'Defences')}</option>
            <option value="loyalty">{t('安民', 'Loyalty')}</option>
          </select>
        </div>
      )}
      {/* Currently pending commands in this city — one per assigned officer */}
      {pendingInCity.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', marginBottom: '0.5rem' }}>
          {pendingInCity.map((cmd) => {
            const officer = officersMap[cmd.officerId];
            if (!officer) return null;
            const def = COMMAND_DEFS[cmd.type];
            const targetCity = cmd.type === 'march' ? citiesMap[cmd.targetCityId] : null;
            return (
              <div key={cmd.officerId} className={styles.activeCmd}>
                <div className={styles.activeRow}>
                  <div className={styles.activeText}>
                    <span className={styles.activeLabel}>
                      {lang === 'en' ? def.label.en : lang === 'both' ? `${def.label.zh} · ${def.label.en}` : def.label.zh}
                    </span>
                    <span className={styles.activeOfficer}>
                      {t('由', 'by')} {lang === 'en' ? officer.name.en : officer.name.zh}
                      {cmd.type !== 'march' && cmd.assistantOfficerIds && cmd.assistantOfficerIds.length > 0 && (
                        <span style={{ color: '#7ed68a' }}>
                          {' '}{t('協同', '+')}{' '}
                          {cmd.assistantOfficerIds
                            .map((aid) => officersMap[aid])
                            .filter(Boolean)
                            .map((a) => lang === 'en' ? a!.name.en : a!.name.zh)
                            .join(lang === 'en' ? ', ' : '、')}
                        </span>
                      )}
                      {cmd.type === 'march' && targetCity && (
                        <>
                          {' → '}
                          <strong>{lang === 'en' ? targetCity.name.en : targetCity.name.zh}</strong>
                          {' '}{t('率', 'with')}{' '}
                          {cmd.troops.toLocaleString()} {t('兵', 'troops')}
                        </>
                      )}
                    </span>
                  </div>
                  <button
                    className={styles.cancelButton}
                    onClick={() => cancelCommand(cmd.officerId)}
                    title={t('取消命令 (退還金錢)', 'Cancel command (refund gold)')}
                  >
                    ×
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className={styles.menu}>
        {groupHead('basic', 'scroll', t('基本內政', 'Internal Affairs'))}
        {BASIC_ORDER.map(renderInternal)}
        {majorUnlocked && groupHead('major', 'city', t('大型工程', 'Major Works'))}
        {majorUnlocked && MAJOR_ORDER.map(renderInternal)}
        {groupHead('mil', 'war', t('軍事 · 特務', 'Military & Special'))}
        <button
          className={`${styles.cmdButton} ${styles.marchButton}`}
          onClick={() => setModal({ kind: 'march' })}
          disabled={!canMarch}
          title={
            !canMarch
              ? city.troops === 0
                ? t('無兵可出', 'No troops to march')
                : t('金錢不足', 'Not enough gold')
              : desc(marchDef)
          }
        >
          <span className={styles.cmdLabelZh}>{lang === 'en' ? marchDef.label.en : marchDef.label.zh}</span>
          {lang === 'both' && <span className={styles.cmdLabelEn}>{marchDef.label.en}</span>}
          <span className={styles.cmdCost}>{marchDef.goldCost}g</span>
        </button>
        <button
          className={styles.cmdButton}
          onClick={() => setModal({ kind: 'market' })}
          title={t('市易 — 金糧互市,秋賤冬貴,缺糧之城價高', 'Grain market — gold↔food; cheap after harvest, dear in winter and in want')}
          style={{ borderColor: '#c8a258' }}
        >
          <span className={styles.cmdLabelZh}>{t('市易', 'Market')}</span>
          {lang === 'both' && <span className={styles.cmdLabelEn}>Market</span>}
          <span className={styles.cmdCost}>{t('糧', 'food')}</span>
        </button>
        <button
          className={styles.cmdButton}
          onClick={() => setModal({ kind: 'drill' })}
          disabled={garrisonCount === 0}
          title={
            garrisonCount === 0
              ? t('需有武將駐城方可演習', 'Need a stationed officer to drill')
              : t('守城演習 — 在本城真實戰場(城牆+你建的箭樓拒馬)上操演守備,不損兵將', 'Siege drill — defend this city\'s real battlefield (walls + the towers/traps you built). No losses; practice only.')
          }
          style={{ borderColor: '#7ed68a' }}
        >
          <span className={styles.cmdLabelZh}>{t('演習', 'Drill')}</span>
          {lang === 'both' && <span className={styles.cmdLabelEn}>Drill</span>}
          <span className={styles.cmdCost}>{t('練', 'free')}</span>
        </button>
        {(cityHasAcademy(city, buildings) || cityHasMentors(city, officersMap, pendingTrainings)) && (() => {
          const hasAcad = cityHasAcademy(city, buildings);
          const label = hasAcad ? t('書院培訓', 'Academy Training') : t('師徒傳授', 'Mentor Teaching');
          const labelEn = hasAcad ? 'Academy' : 'Mentor';
          const tip = hasAcad
            ? t('書院培訓 — 武將學一個新政策(費用視政策難度而定)', 'Academy training — train an officer in a new policy (cost varies by tier)')
            : t('師徒傳授 — 同城武將傳授其已通政策,無需書院,免費但較慢', 'Mentor teaching — a senior officer teaches a policy they know, no academy needed, free but slower');
          return (
            <button
              className={styles.cmdButton}
              onClick={() => setModal({ kind: 'training' })}
              title={tip}
              style={{ borderColor: hasAcad ? '#88b7e8' : '#7ed68a' }}
            >
              <span className={styles.cmdLabelZh}>{lang === 'en' ? labelEn : label}</span>
              {lang === 'both' && <span className={styles.cmdLabelEn}>{labelEn}</span>}
              <span className={styles.cmdCost}>{t('政', 'policy')}</span>
            </button>
          );
        })()}
      </div>

      {modal.kind === 'internal' && (
        <OfficerPicker
          cityId={cityId}
          commandType={modal.type}
          onClose={() => setModal({ kind: 'closed' })}
        />
      )}
      {modal.kind === 'march' && (
        <MarchPicker
          cityId={cityId}
          onClose={() => setModal({ kind: 'closed' })}
        />
      )}
      {modal.kind === 'training' && (
        <TrainingPicker
          cityId={cityId}
          onClose={() => setModal({ kind: 'closed' })}
        />
      )}
      {modal.kind === 'drill' && (
        <DrillPicker
          cityId={cityId}
          onClose={() => setModal({ kind: 'closed' })}
        />
      )}
      {modal.kind === 'market' && (
        <MarketPanel
          cityId={cityId}
          onClose={() => setModal({ kind: 'closed' })}
        />
      )}
    </>
  );
}

/** 演習點將 — pick which stationed officers take the field for the drill
 *  (the garrison's best six come pre-checked; cap six per side). */
function DrillPicker({ cityId, onClose }: { cityId: EntityId; onClose: () => void }) {
  const officersMap = useGameStore((s) => s.officers);
  const playerForceId = useGameStore((s) => s.playerForceId);
  const startPracticeBattle = useGameStore((s) => s.startPracticeBattle);
  const t = useT();
  const lang = useLanguage();
  const garrison = useMemo(
    () => Object.values(officersMap)
      .filter((o) => o.locationCityId === cityId && o.forceId === playerForceId
        && o.status !== 'dead' && o.status !== 'unsearched' && o.status !== 'imprisoned')
      .sort((a, b) => (b.stats.war * 0.6 + b.stats.leadership * 0.4) - (a.stats.war * 0.6 + a.stats.leadership * 0.4)),
    [officersMap, cityId, playerForceId],
  );
  const [picked, setPicked] = useState<Set<string>>(
    () => new Set(garrison.slice(0, 6).map((o) => o.id)),
  );
  const toggle = (id: string) => setPicked((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id);
    else if (next.size < 6) next.add(id);
    return next;
  });
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
        display: 'grid', placeItems: 'center', zIndex: 240,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#10161e', border: '1px solid #7ed68a', padding: '1rem 1.2rem',
          minWidth: 320, maxWidth: 440, maxHeight: '80vh', overflow: 'auto',
          fontFamily: 'var(--tkm-font-body)', color: '#e6edf3',
        }}
      >
        <div style={{ color: '#9ed68a', letterSpacing: '0.08rem', marginBottom: '0.3rem' }}>
          ⚔ {t('演習點將', 'Drill Roster')}
        </div>
        <div style={{ color: '#7a8893', fontSize: '0.72rem', marginBottom: '0.6rem' }}>
          {t(`選至多 6 員上場(已選 ${picked.size})— 不損兵將,純為練兵`,
             `Pick up to 6 to take the field (${picked.size} picked) — no losses, practice only`)}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {garrison.map((o) => {
            const on = picked.has(o.id);
            return (
              <button
                key={o.id}
                onClick={() => toggle(o.id)}
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  background: on ? 'rgba(126, 214, 138, 0.12)' : 'transparent',
                  border: `1px solid ${on ? '#7ed68a' : '#26323e'}`,
                  color: on ? '#d8f0c8' : '#a08a60', cursor: 'pointer',
                  padding: '0.35rem 0.6rem', fontFamily: 'inherit', fontSize: '0.8rem',
                }}
              >
                <span>{on ? '☑' : '☐'} {lang === 'en' ? o.name.en : o.name.zh}</span>
                <span style={{ color: '#7a8893', fontSize: '0.7rem' }}>
                  {t('武', 'W')}{o.stats.war} {t('統', 'L')}{o.stats.leadership}
                </span>
              </button>
            );
          })}
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.8rem' }}>
          <button
            onClick={() => {
              if (picked.size === 0) return;
              if (startPracticeBattle(cityId, 0, [...picked])) onClose();
            }}
            disabled={picked.size === 0}
            style={{
              flex: 1, padding: '0.45rem', cursor: picked.size > 0 ? 'pointer' : 'not-allowed',
              background: 'linear-gradient(180deg, #2a3a20, #1d2a16)',
              color: '#9ed68a', border: '1px solid #7ed68a', fontFamily: 'inherit',
              letterSpacing: '0.05rem',
            }}
          >{t('開始演習', 'Start Drill')}</button>
          <button
            onClick={onClose}
            style={{
              padding: '0.45rem 0.8rem', cursor: 'pointer', background: 'transparent',
              color: '#7a8893', border: '1px solid #2b3845', fontFamily: 'inherit',
            }}
          >{t('取消', 'Cancel')}</button>
        </div>
      </div>
    </div>
  );
}


/** 市易 — the grain market: live quotes both ways, quick lot sizes. */
function MarketPanel({ cityId, onClose }: { cityId: EntityId; onClose: () => void }) {
  const city = useGameStore((s) => s.cities[cityId]);
  const season = useGameStore((s) => s.date.season);
  const tradeFood = useGameStore((s) => s.tradeFood);
  const buildings = useGameStore((s) => s.buildings);
  const t = useT();
  const [last, setLast] = useState<string | null>(null);
  const shock = useMarketShock(cityId);
  if (!city) return null;
  const mkt = { stability: buildingBonuses(cityId, buildings).priceStability };
  const outlook = marketOutlook(city, season, mkt, shock);
  const rate = outlook.spot;
  const levelZh = outlook.level === 'cheap' ? '穀賤' : outlook.level === 'dear' ? '穀貴' : '平';
  const levelEn = outlook.level === 'cheap' ? 'cheap' : outlook.level === 'dear' ? 'dear' : 'fair';
  const nextZh = outlook.nextDir === 'cheaper' ? '↓賤' : outlook.nextDir === 'dearer' ? '↑貴' : '→平';
  const nextEn = outlook.nextDir === 'cheaper' ? '↓' : outlook.nextDir === 'dearer' ? '↑' : '→';
  const buyLots = [200, 500, 1000];
  const sellLots = [2000, 5000, 10000];
  const row: React.CSSProperties = { display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' };
  const btn: React.CSSProperties = {
    background: '#241c12', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#e6edf3',
    padding: '0.35rem 0.7rem', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.78rem',
  };
  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'grid', placeItems: 'center', zIndex: 240 }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#10161e', border: '1px solid #c8a258', padding: '1rem 1.2rem',
          minWidth: 320, maxWidth: 420, fontFamily: 'var(--tkm-font-body)', color: '#e6edf3',
        }}
      >
        <div style={{ color: '#e8c478', letterSpacing: '0.08rem', marginBottom: '0.2rem', display: 'flex', alignItems: 'center', gap: 6 }}><Icon name="gold" size={15} color="#e8c478" />{t('市易', 'Grain Market')}</div>
        <div style={{ fontSize: '0.72rem', color: '#7a8893', marginBottom: outlook.warnings.length ? '0.3rem' : '0.7rem' }}>
          {t(`時價:1金 ≈ ${rate.toFixed(1)}糧 · ${levelZh} · 來季${nextZh} · 庫:${city.gold}金 / ${city.food.toLocaleString()}糧`,
             `Rate: 1g ≈ ${rate.toFixed(1)} food · ${levelEn} · next ${nextEn} · ${city.gold}g / ${city.food.toLocaleString()} food`)}
        </div>
        {outlook.warnings.length > 0 && (
          <div style={{ fontSize: '0.7rem', color: '#e0a060', marginBottom: '0.6rem' }}>
            {outlook.warnings.map((w, i) => <div key={i}>⚠ {t(w.zh, w.en)}</div>)}
          </div>
        )}
        <div style={{ fontSize: '0.78rem', color: '#aab6c0', marginBottom: 4 }}>{t('買糧', 'Buy food')}</div>
        <div style={row}>
          {buyLots.map((g) => (
            <button key={g} style={btn} disabled={city.gold < g}
              onClick={() => {
                const r = tradeFood(cityId, 'buy', g);
                setLast(r.ok ? t(`購入 ${r.got.toLocaleString()} 糧`, `Bought ${r.got.toLocaleString()} food`) : t('金錢不足', 'Not enough gold'));
              }}
            >{g}金 → ~{buyQuote(city, season, g, mkt).toLocaleString()}糧</button>
          ))}
        </div>
        <div style={{ fontSize: '0.78rem', color: '#aab6c0', marginBottom: 4 }}>{t('賣糧', 'Sell food')}</div>
        <div style={row}>
          {sellLots.map((f) => (
            <button key={f} style={btn} disabled={city.food < f}
              onClick={() => {
                const r = tradeFood(cityId, 'sell', f);
                setLast(r.ok ? t(`售得 ${r.got.toLocaleString()} 金`, `Sold for ${r.got.toLocaleString()}g`) : t('存糧不足', 'Not enough food'));
              }}
            >{f.toLocaleString()}糧 → ~{sellQuote(city, season, f, mkt).toLocaleString()}金</button>
          ))}
        </div>
        {last && <div style={{ fontSize: '0.75rem', color: '#9ed68a', marginBottom: 6 }}>{last}</div>}
        <button onClick={onClose} style={{ ...btn, width: '100%', textAlign: 'center' }}>{t('關閉', 'Close')}</button>
      </div>
    </div>
  );
}
