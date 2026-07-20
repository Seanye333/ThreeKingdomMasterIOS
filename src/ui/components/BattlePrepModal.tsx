import { useEffect, useMemo, useState } from 'react';
import { useEscapeKey } from '../hooks/useEscapeKey';
import { FORMATIONS, NAMED_MAPS_BY_CITY, NAMED_MAPS_BY_ID } from '../../game/data';
import { inferUnitType } from '../../game/systems/tactical';
import { setupTacticalBattle, planSiegeRelief, planColumnReinforcements, rollTimeOfDay } from '../../game/systems/tacticalSetup';
import { regionalTacticalWeather } from '../../game/systems/weather';
import {
  navalContextFor, drillTier, seasickness, fleetSize, DRILL_TIER_NAMES,
} from '../../game/systems/navalWarfare';
import { cityPos } from '../../game/data/cityGeo';
import { isRiverside } from '../../game/data/geography';
import { useGameStore } from '../../game/state/store';
import type {
  EntityId,
  FormationId,
  Officer,
  UnitType,
} from '../../game/types';
import { OfficerStats } from './OfficerStats';
import { Name } from './Name';
import styles from './BattlePrepModal.module.css';
import { useLanguage, useDesc, pickName } from '../i18n';

interface Props {
  sourceCityId: EntityId;
  targetCityId: EntityId;
  commanderId: EntityId;
  companionIds: EntityId[];
  totalTroops: number;
  onClose: () => void;
}

const UNIT_TYPES: UnitType[] = ['infantry', 'spearmen', 'cavalry', 'archers', 'siege', 'navy'];
const UNIT_TYPE_LABEL: Record<UnitType, { zh: string; en: string }> = {
  infantry: { zh: '步兵',   en: 'Infantry' },
  spearmen: { zh: '槍兵',   en: 'Spearmen' },
  cavalry:  { zh: '騎兵',   en: 'Cavalry'  },
  archers:  { zh: '弓兵',   en: 'Archers'  },
  siege:    { zh: '攻城',   en: 'Siege'    },
  navy:     { zh: '水軍',   en: 'Navy'     },
};

// 5-dot normalized [0..1]² layout per formation — the commander is the gold dot (first).
// Designed to suggest the formation's shape (V-spearhead for awl, wide arc for crane-wing, etc.).
function formationLayout(id: FormationId): { x: number; y: number }[] {
  const map: Partial<Record<FormationId, { x: number; y: number }[]>> = {
    'fish-scale':        [{x:.5,y:.3},{x:.3,y:.5},{x:.5,y:.5},{x:.7,y:.5},{x:.5,y:.7}],
    'eight-trigrams':    [{x:.5,y:.5},{x:.2,y:.3},{x:.8,y:.3},{x:.2,y:.7},{x:.8,y:.7}],
    'arrow-tip':         [{x:.5,y:.15},{x:.35,y:.45},{x:.65,y:.45},{x:.2,y:.75},{x:.8,y:.75}],
    'crane-wing':        [{x:.5,y:.55},{x:.15,y:.35},{x:.85,y:.35},{x:.25,y:.7},{x:.75,y:.7}],
    'spread-out':        [{x:.1,y:.5},{x:.3,y:.5},{x:.5,y:.5},{x:.7,y:.5},{x:.9,y:.5}],
    'awl':               [{x:.5,y:.15},{x:.4,y:.4},{x:.6,y:.4},{x:.3,y:.7},{x:.7,y:.7}],
    'wheel':             [{x:.5,y:.5},{x:.5,y:.2},{x:.8,y:.5},{x:.5,y:.8},{x:.2,y:.5}],
    'square':            [{x:.5,y:.5},{x:.3,y:.3},{x:.7,y:.3},{x:.3,y:.7},{x:.7,y:.7}],
    'crescent-moon':     [{x:.5,y:.55},{x:.2,y:.4},{x:.35,y:.3},{x:.65,y:.3},{x:.8,y:.4}],
    'wild-goose':        [{x:.5,y:.2},{x:.35,y:.4},{x:.65,y:.4},{x:.2,y:.65},{x:.8,y:.65}],
    'trinity':           [{x:.5,y:.3},{x:.25,y:.65},{x:.75,y:.65},{x:.4,y:.85},{x:.6,y:.85}],
    'back-to-water':     [{x:.5,y:.8},{x:.3,y:.55},{x:.5,y:.5},{x:.7,y:.55},{x:.5,y:.3}],
    'ten-ambush':        [{x:.5,y:.5},{x:.15,y:.2},{x:.85,y:.2},{x:.15,y:.8},{x:.85,y:.8}],
    'long-snake':        [{x:.5,y:.1},{x:.5,y:.3},{x:.5,y:.5},{x:.5,y:.7},{x:.5,y:.9}],
    'crescent-withdraw': [{x:.5,y:.7},{x:.2,y:.55},{x:.35,y:.4},{x:.65,y:.4},{x:.8,y:.55}],
    'yoke':              [{x:.5,y:.5},{x:.3,y:.3},{x:.7,y:.3},{x:.4,y:.75},{x:.6,y:.75}],
    'armored-cart':      [{x:.5,y:.6},{x:.3,y:.45},{x:.7,y:.45},{x:.35,y:.8},{x:.65,y:.8}],
    'seven-star':        [{x:.5,y:.45},{x:.25,y:.25},{x:.75,y:.25},{x:.2,y:.7},{x:.8,y:.7}],
    'five-elements':     [{x:.5,y:.5},{x:.5,y:.2},{x:.8,y:.55},{x:.65,y:.85},{x:.2,y:.55}],
    'four-symbols':      [{x:.5,y:.5},{x:.5,y:.2},{x:.8,y:.5},{x:.5,y:.8},{x:.2,y:.5}],
    'rattan-armor':      [{x:.4,y:.3},{x:.6,y:.3},{x:.4,y:.55},{x:.6,y:.55},{x:.5,y:.8}],
    'stacked':           [{x:.5,y:.25},{x:.5,y:.45},{x:.5,y:.6},{x:.35,y:.8},{x:.65,y:.8}],
    'mandarin-duck':     [{x:.4,y:.4},{x:.6,y:.4},{x:.4,y:.65},{x:.6,y:.65},{x:.5,y:.85}],
  };
  return map[id] ?? [{x:.2,y:.5},{x:.35,y:.5},{x:.5,y:.5},{x:.65,y:.5},{x:.8,y:.5}];
}

function FormationDiagram({ id }: { id: FormationId }) {
  const pts = formationLayout(id);
  return (
    <svg viewBox="0 0 100 60" style={{ width: '100%', height: 48, display: 'block' }}>
      {/* Ground line */}
      <line x1="0" y1="55" x2="100" y2="55" stroke="#2b3845" strokeWidth="0.5" strokeDasharray="2 2" />
      {/* Unit dots: first dot = commander (gold star), rest = troops (small circles) */}
      {pts.map((p, i) => {
        const cx = p.x * 100;
        const cy = p.y * 60;
        if (i === 0) {
          return (
            <g key={i}>
              <circle cx={cx} cy={cy} r="5.5" fill="#e6c473" stroke="#10161e" strokeWidth="0.8" />
              <text x={cx} y={cy + 1.6} textAnchor="middle" fontSize="6" fill="#10161e" fontWeight="bold">★</text>
            </g>
          );
        }
        return (
          <circle key={i} cx={cx} cy={cy} r="3.8" fill="#7a9bd9" stroke="#10161e" strokeWidth="0.6" />
        );
      })}
      {/* Engagement arrow pointing up toward enemy */}
      <path d="M 50 4 L 47 9 L 50 7 L 53 9 Z" fill="#b8442e" opacity="0.7" />
    </svg>
  );
}

export function BattlePrepModal({
  sourceCityId,
  targetCityId,
  commanderId,
  companionIds,
  totalTroops,
  onClose,
}: Props) {
  useEscapeKey(onClose);
  const officers = useGameStore((s) => s.officers);
  const cities = useGameStore((s) => s.cities);
  const startTactical = useGameStore((s) => s.startTacticalBattle);
  const currentWeather = useGameStore((s) => s.weather);
  const currentSeason = useGameStore((s) => s.date.season);
  const worldScars = useGameStore((s) => s.worldScars);
  const mapArmies = useGameStore((s) => s.armies);
  const maybeHint = useGameStore((s) => s.maybeHint);
  const lang = useLanguage();
  const desc = useDesc();

  const source = cities[sourceCityId];
  const target = cities[targetCityId];
  // 軍師點撥 — first assault on a reinforced citadel: warn about the layers.
  useEffect(() => {
    if ((target?.wallTier ?? 1) >= 2) {
      maybeHint('walltier',
        '軍師:此城城壁經強化 — 破外郭後尚有內城牆,三重者更有護城河,唯門前橋道可渡。備攻城器與水攻方略。',
        'This citadel has INNER walls (tier 3 adds a moat) — bring siege gear or flood the dikes.');
    }
  }, [target?.wallTier, maybeHint]);

  const ourOfficers = useMemo(
    () =>
      [commanderId, ...companionIds]
        .map((id) => officers[id])
        .filter((o): o is Officer => !!o),
    [commanderId, companionIds, officers],
  );

  // 水戰預告 — what this force will actually be on the water, read the same way
  // the battle itself reads it (navalContextFor), so the preview cannot drift
  // from the fight.
  const ports = useGameStore((s) => s.ports);
  const navalPreview = useMemo(() => {
    const ctx = navalContextFor({
      forceId: source?.ownerForceId ?? null, cityId: targetCityId,
      cities: Object.values(cities), ports: Object.values(ports),
      officers: ourOfficers,
    });
    return {
      drill: ctx.drill,
      tier: drillTier(ctx.drill),
      sick: seasickness(ctx.drill),
      hulls: fleetSize(ctx.fleet),
    };
  }, [source?.ownerForceId, targetCityId, cities, ports, ourOfficers]);

  const defenders = useMemo(
    () =>
      Object.values(officers)
        .filter(
          (o) =>
            o.locationCityId === targetCityId &&
            o.forceId === target?.ownerForceId &&
            o.status === 'idle',
        )
        .sort((a, b) => b.stats.war - a.stats.war)
        .slice(0, 6),
    [officers, targetCityId, target?.ownerForceId],
  );

  // Per-officer settings.
  const [unitTypes, setUnitTypes] = useState<Record<EntityId, UnitType>>(() => {
    const init: Record<EntityId, UnitType> = {};
    for (const o of ourOfficers) init[o.id] = inferUnitType(o);
    return init;
  });

  const [troopShares, setTroopShares] = useState<Record<EntityId, number>>(() => {
    const init: Record<EntityId, number> = {};
    const base = Math.floor(totalTroops / ourOfficers.length);
    for (const o of ourOfficers) init[o.id] = base;
    if (ourOfficers.length > 0) {
      init[ourOfficers[0].id] = totalTroops - base * (ourOfficers.length - 1);
    }
    return init;
  });

  const [formation, setFormation] = useState<FormationId>('none');
  // 攻城方略 — storm / invest / flood. Flood needs a riverside target and
  // flowing water (not a drought); invest burns the besiegers' grain.
  const [siegeWorks, setSiegeWorks] = useState<'storm' | 'invest' | 'flood'>('storm');
  const spendSiegeWorks = useGameStore((s) => s.spendSiegeWorks);
  const dispatchRelief = useGameStore((s) => s.dispatchRelief);
  const targetPos = target ? cityPos(target) : null;
  const riverside = targetPos ? isRiverside(targetPos.x, targetPos.y) : false;
  const drought = currentWeather?.kind === 'drought';
  const investFoodCost = Math.max(800, totalTroops);
  const floodGoldCost = 400;
  const canInvest = (source?.food ?? 0) >= investFoodCost;
  const canFlood = riverside && !drought && (source?.gold ?? 0) >= floodGoldCost;
  // 舌戰 state moved into TacticalBattleScreen — fires after the opening cinematic.

  const namedMapId = NAMED_MAPS_BY_CITY[targetCityId];
  const namedMap = namedMapId ? NAMED_MAPS_BY_ID[namedMapId] : undefined;

  const troopSum = useMemo(
    () => Object.values(troopShares).reduce((s, n) => s + n, 0),
    [troopShares],
  );

  const canEngage = troopSum === totalTroops && ourOfficers.length > 0;

  const engage = () => {
    if (!canEngage || !source || !target) return;
    // Pay for the chosen siege works up front (deducted from the
    // attacking city's stores); fall back to a plain storm if it can't
    // be paid (button should already be disabled in that case).
    if (siegeWorks === 'invest' && !spendSiegeWorks(source.id, 0, investFoodCost)) return;
    if (siegeWorks === 'flood' && !spendSiegeWorks(source.id, floodGoldCost, 0)) return;
    const attackers = ourOfficers.map((o) => ({
      officer: o,
      troops: troopShares[o.id],
      unitType: unitTypes[o.id],
    }));
    const dCount = Math.max(1, defenders.length);
    const dPerOfficer = Math.floor(target.troops / dCount);
    const defenderEntries = defenders.length === 0
      ? []
      : defenders.map((o, i) => ({
          officer: o,
          troops: i === 0 ? target.troops - dPerOfficer * (dCount - 1) : dPerOfficer,
        }));

    // Strategic-layer weather snapshot → tactical battle weather.
    // 'drought' maps to 'clear' (the existing tactical kinds don't include
    // it). Everything else is 1:1.
    const stratWeather = currentWeather?.kind ?? 'clear';
    // 區域天候 — the sky over the TARGET city, not the realm-wide roll:
    // storm 遼東 in winter and expect snow whatever the capital saw.
    const dateNow = useGameStore.getState().date;
    const tacticalWeather = target
      ? regionalTacticalWeather(stratWeather, cityPos(target).x, cityPos(target).y, currentSeason, `${dateNow.year}-${dateNow.season}-${dateNow.phase ?? ''}`)
      : (stratWeather === 'drought' ? 'clear' : stratWeather);

    // 馳援 — the defender's neighbouring cities ride to the rescue
    // mid-battle (their troops leave home now; survivors return after).
    const sp0 = cityPos(source);
    const tp0 = cityPos(target);
    const bearing0 = Math.atan2(tp0.y - sp0.y, tp0.x - sp0.x);
    const relief = planSiegeRelief({
      target, cities, officers,
      defenderForceId: target.ownerForceId, bearing: bearing0,
    });
    // 會戰 — map columns of either belligerent near the walls join the field
    // mid-battle, entering from their true bearings.
    const columnJoin = planColumnReinforcements({
      site: { x: tp0.x, y: tp0.y }, bearing: bearing0,
      attackerForceId: source.ownerForceId, defenderForceId: target.ownerForceId,
      armies: mapArmies, officers,
      diplomacy: useGameStore.getState().diplomacy,
    });
    const battle = setupTacticalBattle({
      cityId: target.id,
      // Procedural default sized for tactical depth — named maps still
      // use their own hand-crafted dimensions.
      width: namedMap?.width ?? 18,
      height: namedMap?.height ?? 12,
      worldScars,
      attackerForceId: source.ownerForceId,
      defenderForceId: target.ownerForceId,
      attackers,
      defenders: defenderEntries,
      wallTier: target.wallTier,
      attackerFormation: formation,
      weather: tacticalWeather as 'clear' | 'rain' | 'wind' | 'fog' | 'snow',
      timeOfDay: rollTimeOfDay(),
      windDirection: currentWeather?.wind ?? 'calm',
      // Carry the defender city's perimeter defense structures into the battle.
      buildSlots: target.buildSlots,
      // Geography hints — battlefield matches the defender city's real terrain.
      terrainHint: {
        terrain: target.terrain,
        port: target.port,
        x: target.coords.x,
        y: target.coords.y,
      },
      // Real-map siege ground: the grid is anchored on the target city
      // (just behind its rampart) and oriented along the true approach
      // bearing from the attacking city — storm 襄陽 from the north and
      // the 漢水 lies between you and the walls; from the south it does
      // not. 四面不同,看真实地形。
      battleGeo: (() => {
        const sp = cityPos(source);
        const tp = cityPos(target);
        return {
          x: tp.x, y: tp.y,
          bearing: Math.atan2(tp.y - sp.y, tp.x - sp.x),
          anchorCol: (namedMap?.width ?? 18) - 2,
          season: currentSeason,
        };
      })(),
      siegeWorks,
      reinforcements: [...relief.reinforcements, ...columnJoin.reinforcements],
      // 水戰 (§5.14) — storming a river city is a fleet action: each side brings
      // its own seamanship (a northern host is sick on the deck) and whatever
      // hulls its harbours here have ready.
      ...(() => {
        const st = useGameStore.getState();
        const cityList = Object.values(cities);
        const portList = Object.values(st.ports);
        const a = navalContextFor({
          forceId: source.ownerForceId, cityId: target.id,
          cities: cityList, ports: portList, officers: attackers.map((x) => x.officer),
        });
        const d = navalContextFor({
          forceId: target.ownerForceId, cityId: target.id,
          cities: cityList, ports: portList, officers: defenderEntries.map((x) => x.officer),
        });
        return {
          attackerNavalDrill: a.drill, defenderNavalDrill: d.drill,
          attackerFleet: a.fleet, defenderFleet: d.fleet,
        };
      })(),
    });
    battle.reliefPlans = relief.plans;
    if (columnJoin.columnPlans.length > 0) battle.columnPlans = columnJoin.columnPlans;
    for (const plan of relief.plans) dispatchRelief(plan.cityId, plan.troops);

    // 舌戰 is now triggered AFTER the 3D battle opens — see TacticalBattleScreen.
    startTactical(battle);
    onClose();
  };

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <header className={styles.header}>
          <div>
            {lang !== 'en' && <div className={styles.titleZh}>戰鬥準備{source && target ? `:${source.name.zh} → ${target.name.zh}` : ''}</div>}
            {lang !== 'zh' && (
              <div className={styles.titleEn}>
                Battle Preparation: {source?.name.en} → {target?.name.en}
              </div>
            )}
          </div>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </header>

        <div className={styles.body}>
          <div className={styles.context}>
            <div className={styles.ctxCard}>
              <div className={styles.ctxLabel}>{lang === 'en' ? 'Map' : '戰場'}</div>
              <div className={styles.ctxValue}>
                {namedMap ? pickName(namedMap.name, lang) : (lang === 'en' ? 'Procedural' : '隨機地形')}
              </div>
            </div>
            <div className={styles.ctxCard}>
              <div className={styles.ctxLabel}>Weather 天候</div>
              <div className={styles.ctxValue}>{namedMap?.weather ?? 'clear'}</div>
            </div>
            <div className={styles.ctxCard}>
              <div className={styles.ctxLabel}>Time 時刻</div>
              <div className={styles.ctxValue}>{namedMap?.timeOfDay ?? 'day'}</div>
            </div>
          </div>

          {/* 水戰 (§5.14) — attacking a river city is a fleet action; say so BEFORE
              the player commits, not in the battle log afterwards. */}
          {target?.terrain === 'water' && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap',
              padding: '0.5rem 0.75rem', marginTop: '0.5rem', fontSize: '0.78rem',
              background: 'rgba(20,32,44,0.6)', border: '1px solid #35566e',
            }}>
              <span style={{ color: '#7aaed0', letterSpacing: '0.05rem' }}>{lang === 'en' ? 'River battle' : '水戰'}</span>
              <span style={{ color: navalPreview.tier === 'landlubber' ? '#e0707a' : navalPreview.tier === 'master' ? '#7ed68a' : '#c8d4dc' }}>
                {lang === 'en'
                  ? `Your seamanship: ${DRILL_TIER_NAMES[navalPreview.tier].en} (${navalPreview.drill})`
                  : `我軍水軍:${DRILL_TIER_NAMES[navalPreview.tier].zh}(${navalPreview.drill})`}
              </span>
              <span style={{ color: '#8a98a4', fontSize: '0.72rem' }}>
                {lang === 'en'
                  ? `power ×${navalPreview.sick.powerMul}${navalPreview.sick.moraleDelta ? `, opening morale ${navalPreview.sick.moraleDelta}` : ''}${navalPreview.sick.apPenalty ? ', −1 AP' : ''}${navalPreview.hulls ? ` · ${navalPreview.hulls} hull(s) in port` : ''}`
                  : `戰力 ×${navalPreview.sick.powerMul}${navalPreview.sick.moraleDelta ? `、開局士氣 ${navalPreview.sick.moraleDelta}` : ''}${navalPreview.sick.apPenalty ? '、每船 −1 AP' : ''}${navalPreview.hulls ? ` · 港中戰船 ${navalPreview.hulls} 艘` : ''}`}
              </span>
            </div>
          )}

          {/* 攻城方略 — how the siege is prosecuted. */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap',
            padding: '0.5rem 0.75rem', marginTop: '0.5rem', fontSize: '0.78rem',
            background: 'rgba(26,20,16,0.55)', border: '1px solid #2b3845',
          }}>
            <span style={{ color: '#7a8893', letterSpacing: '0.05rem' }}>{lang === 'en' ? 'Siege plan' : '攻城方略'}</span>
            {([
              { id: 'storm' as const, zh: '強攻', en: 'Storm', hint: lang === 'zh' ? '直接攻城' : 'Assault as-is', disabled: false },
              { id: 'invest' as const, zh: '圍困', en: 'Invest', hint: (lang === 'zh' ? `斷其糧道（軍糧 −${investFoodCost.toLocaleString()}）守軍飢疲` : `Starve them out (food −${investFoodCost.toLocaleString()})`), disabled: !canInvest },
              { id: 'flood' as const, zh: '水攻', en: 'Flood', hint: !riverside ? (lang === 'zh' ? '此城不臨水' : 'Not riverside') : drought ? (lang === 'zh' ? '旱季水涸' : 'Drought — no water') : (lang === 'zh' ? `決堤灌城（金 −${floodGoldCost}）潰牆溺敵` : `Break the dikes (gold −${floodGoldCost})`), disabled: !canFlood },
            ]).map((o) => (
              <button
                key={o.id}
                onClick={() => !o.disabled && setSiegeWorks(o.id)}
                disabled={o.disabled}
                title={o.hint}
                style={{
                  padding: '0.3rem 0.7rem',
                  background: siegeWorks === o.id ? '#6a4a20' : 'rgba(20,14,8,0.7)',
                  border: `1px solid ${siegeWorks === o.id ? '#e6c473' : '#2b3845'}`,
                  color: o.disabled ? '#5a4a38' : siegeWorks === o.id ? '#ffe9a8' : '#aab6c0',
                  cursor: o.disabled ? 'not-allowed' : 'pointer',
                  fontFamily: 'var(--tkm-font-body)',
                }}
              >{o.zh} {o.en}</button>
            ))}
            <span style={{ color: '#7a6650', fontSize: '0.7rem' }}>
              {({ storm: lang === 'zh' ? '雲梯衝車,直取城垣。' : 'Ladders and rams, straight at the walls.',
                 invest: lang === 'zh' ? '圍而不攻,坐待城中糧盡。' : 'Surround and starve the garrison.',
                 flood: lang === 'zh' ? '引水決堤,水淹七軍。' : 'Break the dikes and drown the city.' } as Record<string, string>)[siegeWorks]}
            </span>
          </div>

          {/* Terrain composition preview for named maps. */}
          {namedMap && (() => {
            const counts: Record<string, number> = {};
            for (const k of Object.values(namedMap.terrainOverrides)) {
              counts[k] = (counts[k] ?? 0) + 1;
            }
            const labelZh: Record<string, string> = {
              plain: '平原', forest: '森林', mountain: '山', river: '河',
              road: '道', hill: '高地', marsh: '沼', chokepoint: '隘',
              bridge: '橋', gate: '城門', watchtower: '瞭望',
            };
            const colorBy: Record<string, string> = {
              plain: '#4a5e30', forest: '#2a4220', mountain: '#5a4838',
              river: '#2c5882', road: '#7a6038', hill: '#7a6238',
              marsh: '#3a4838', chokepoint: '#364654', bridge: '#8a6840',
              gate: '#4a2820', watchtower: '#7a8893',
            };
            const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
            return (
              <div style={{
                display: 'flex', flexWrap: 'wrap', gap: '0.35rem',
                padding: '0.5rem 0.75rem', fontSize: '0.7rem',
                background: 'rgba(26,20,16,0.55)', border: '1px solid #2b3845',
                marginTop: '0.5rem',
              }}>
                <span style={{ color: '#7a8893', letterSpacing: '0.07rem', marginRight: '0.3rem' }}>
                  地形組成
                </span>
                {entries.map(([k, n]) => (
                  <span key={k} style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                    border: `1px solid ${colorBy[k] ?? '#364654'}`,
                    padding: '0.1rem 0.4rem',
                    color: colorBy[k] ?? '#aab6c0',
                  }}>
                    <span style={{
                      display: 'inline-block', width: 6, height: 6,
                      background: colorBy[k] ?? '#364654',
                    }} />
                    {labelZh[k] ?? k} × {n}
                  </span>
                ))}
              </div>
            );
          })()}

          <div className={styles.section}>
            <div className={styles.sectionLabel}>
              Officers & unit type — total troops {totalTroops.toLocaleString()}
            </div>
            {ourOfficers.map((o) => (
              <div key={o.id} className={styles.unitRow}>
                <div>
                  <span className={styles.unitName}><Name pair={o.name} /></span>
                </div>
                <div className={styles.unitStat}>
                  <OfficerStats officer={o} keys={['war', 'leadership', 'intelligence']} />
                </div>
                <select
                  className={styles.typeSelect}
                  value={unitTypes[o.id]}
                  onChange={(e) => setUnitTypes((u) => ({ ...u, [o.id]: e.target.value as UnitType }))}
                >
                  {UNIT_TYPES.map((utype) => {
                    const lbl = UNIT_TYPE_LABEL[utype];
                    return (
                      <option key={utype} value={utype}>{lang === 'en' ? lbl.en : lbl.zh}</option>
                    );
                  })}
                </select>
                <input
                  className={styles.troopInput}
                  type="number"
                  min={0}
                  max={totalTroops}
                  value={troopShares[o.id]}
                  onChange={(e) => setTroopShares((s) => ({ ...s, [o.id]: Math.max(0, Number(e.target.value) || 0) }))}
                />
              </div>
            ))}
            <div className={styles.unitStat} style={{ textAlign: 'right' }}>
              Allocated: {troopSum.toLocaleString()} / {totalTroops.toLocaleString()}
              {troopSum !== totalTroops && (
                <span style={{ color: '#b8442e', marginLeft: '0.5rem' }}>
                  ({troopSum < totalTroops ? '−' : '+'}{Math.abs(totalTroops - troopSum)})
                </span>
              )}
            </div>
          </div>

          <div className={styles.section}>
            <div className={styles.sectionLabel}>Formation 陣形</div>
            <div className={styles.formGrid}>
              {FORMATIONS.map((f) => {
                const cmd = ourOfficers[0];
                const eligible = cmd ? cmd.stats.intelligence >= f.minIntelligence : true;
                return (
                  <button
                    key={f.id}
                    className={`${styles.formCard} ${formation === f.id ? styles.formCardActive : ''}`}
                    disabled={!eligible}
                    onClick={() => setFormation(f.id)}
                    style={!eligible ? { opacity: 0.45 } : undefined}
                  >
                    <div>
                      {lang !== 'en' && <span className={styles.formName}>{f.name.zh}</span>}
                      {lang !== 'zh' && <span className={styles.formNameEn}>{f.name.en}</span>}
                    </div>
                    <FormationDiagram id={f.id} />
                    <div className={styles.formDesc}>{desc(f)}</div>
                    <div style={{ fontSize: '0.72rem', color: '#7a8893' }}>
                      req INT {f.minIntelligence}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className={styles.footer}>
          <button className={styles.cancelBtn} onClick={onClose}>Cancel</button>
          <button className={styles.engageBtn} onClick={engage} disabled={!canEngage}>
            出陣 Engage
          </button>
        </div>
      </div>
    </div>
  );
}
