import { useMemo, useState } from 'react';
import { FORMATIONS, NAMED_MAPS_BY_CITY, NAMED_MAPS_BY_ID } from '../../game/data';
import { inferUnitType, setupTacticalBattle } from '../../game/systems/tactical';
import { resolveWordWar, type WordWarResult } from '../../game/systems/wordWar';
import { useGameStore } from '../../game/state/store';
import type {
  EntityId,
  FormationId,
  Officer,
  UnitType,
} from '../../game/types';
import { WordWarModal } from './WordWarModal';
import styles from './BattlePrepModal.module.css';
import { useLanguage, useDesc } from '../i18n';

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
      <line x1="0" y1="55" x2="100" y2="55" stroke="#4a3520" strokeWidth="0.5" strokeDasharray="2 2" />
      {/* Unit dots: first dot = commander (gold star), rest = troops (small circles) */}
      {pts.map((p, i) => {
        const cx = p.x * 100;
        const cy = p.y * 60;
        if (i === 0) {
          return (
            <g key={i}>
              <circle cx={cx} cy={cy} r="5.5" fill="#d4a84a" stroke="#1a1410" strokeWidth="0.8" />
              <text x={cx} y={cy + 1.6} textAnchor="middle" fontSize="6" fill="#1a1410" fontWeight="bold">★</text>
            </g>
          );
        }
        return (
          <circle key={i} cx={cx} cy={cy} r="3.8" fill="#7a9bd9" stroke="#1a1410" strokeWidth="0.6" />
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
  const officers = useGameStore((s) => s.officers);
  const cities = useGameStore((s) => s.cities);
  const startTactical = useGameStore((s) => s.startTacticalBattle);
  const currentWeather = useGameStore((s) => s.weather);
  const lang = useLanguage();
  const desc = useDesc();

  const source = cities[sourceCityId];
  const target = cities[targetCityId];

  const ourOfficers = useMemo(
    () =>
      [commanderId, ...companionIds]
        .map((id) => officers[id])
        .filter((o): o is Officer => !!o),
    [commanderId, companionIds, officers],
  );

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
  const [wordWar, setWordWar] = useState<WordWarResult | null>(null);
  const [pendingBattle, setPendingBattle] = useState<ReturnType<typeof setupTacticalBattle> | null>(null);

  const namedMapId = NAMED_MAPS_BY_CITY[targetCityId];
  const namedMap = namedMapId ? NAMED_MAPS_BY_ID[namedMapId] : undefined;

  const troopSum = useMemo(
    () => Object.values(troopShares).reduce((s, n) => s + n, 0),
    [troopShares],
  );

  const canEngage = troopSum === totalTroops && ourOfficers.length > 0;

  const engage = () => {
    if (!canEngage || !source || !target) return;
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
    const tacticalWeather = stratWeather === 'drought' ? 'clear' : stratWeather;

    const battle = setupTacticalBattle({
      cityId: target.id,
      width: namedMap?.width ?? 14,
      height: namedMap?.height ?? 10,
      attackerForceId: source.ownerForceId,
      defenderForceId: target.ownerForceId,
      attackers,
      defenders: defenderEntries,
      attackerFormation: formation,
      weather: tacticalWeather as 'clear' | 'rain' | 'wind' | 'fog' | 'snow',
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
    });

    // 舌戰 — if both sides have an officer with INT ≥ 80, run a war of words first.
    const aLead = ourOfficers.find((o) => o.stats.intelligence >= 80);
    const dLead = defenders.find((o) => o.stats.intelligence >= 80);
    if (aLead && dLead) {
      const ww = resolveWordWar(ourOfficers[0], defenders[0], ourOfficers.slice(1), defenders.slice(1));
      // Apply the morale modifier to the battle's units.
      const adjusted = {
        ...battle,
        units: battle.units.map((u) => ({
          ...u,
          morale: Math.max(0, Math.min(100, u.morale + (u.side === 'attacker' ? ww.attackerMoraleDelta : ww.defenderMoraleDelta))),
        })),
      };
      setPendingBattle(adjusted);
      setWordWar(ww);
      return;
    }

    startTactical(battle);
    onClose();
  };

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <header className={styles.header}>
          <div>
            <div className={styles.titleZh}>戰闘準備</div>
            <div className={styles.titleEn}>
              Battle Preparation: {source?.name.en} → {target?.name.en}
            </div>
          </div>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </header>

        <div className={styles.body}>
          <div className={styles.context}>
            <div className={styles.ctxCard}>
              <div className={styles.ctxLabel}>Map 戰場</div>
              <div className={styles.ctxValue}>
                {namedMap ? namedMap.name.zh + ' ' + namedMap.name.en : 'Procedural'}
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
              marsh: '#3a4838', chokepoint: '#5a4530', bridge: '#8a6840',
              gate: '#4a2820', watchtower: '#8a7050',
            };
            const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
            return (
              <div style={{
                display: 'flex', flexWrap: 'wrap', gap: '0.35rem',
                padding: '0.5rem 0.75rem', fontSize: '0.7rem',
                background: 'rgba(26,20,16,0.55)', border: '1px solid #4a3520',
                marginTop: '0.5rem',
              }}>
                <span style={{ color: '#8a7050', letterSpacing: '0.2rem', marginRight: '0.3rem' }}>
                  地形組成
                </span>
                {entries.map(([k, n]) => (
                  <span key={k} style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                    border: `1px solid ${colorBy[k] ?? '#5a4530'}`,
                    padding: '0.1rem 0.4rem',
                    color: colorBy[k] ?? '#c0a878',
                  }}>
                    <span style={{
                      display: 'inline-block', width: 6, height: 6,
                      background: colorBy[k] ?? '#5a4530',
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
                  <span className={styles.unitName}>{o.name.zh}</span>
                  <span className={styles.unitNameEn}>{o.name.en}</span>
                </div>
                <div className={styles.unitStat}>
                  W{o.stats.war} L{o.stats.leadership} I{o.stats.intelligence}
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
                    <div style={{ fontSize: '0.65rem', color: '#8a7050' }}>
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
      {wordWar && pendingBattle && (
        <WordWarModal
          result={wordWar}
          onClose={() => {
            startTactical(pendingBattle);
            setWordWar(null);
            setPendingBattle(null);
            onClose();
          }}
        />
      )}
    </div>
  );
}
