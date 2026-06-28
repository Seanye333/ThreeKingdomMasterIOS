import { useEffect, useMemo, useState } from 'react';
import { useGameStore } from '../../game/state/store';
import { COMMAND_DEFS } from '../../game/systems/commands';
import { navalReachableCityIds } from '../../game/data/ports';
import { marchDurationFor } from '../../game/data/cities';
import { marchSpeedMul, adjustMarchSeasons, MARCH_PACES, PACE_LABEL, type MarchPace } from '../../game/systems/marchPace';
import { playSfx } from '../../game/systems/sound';
import { generateTerritories, terrainRoute } from '../../game/data/territories';
import { useT, useLanguage } from '../i18n';
import { BattlePrepModal } from './BattlePrepModal';
import { applicableStratagems } from '../../game/data/stratagems2';
import type { EntityId } from '../../game/types';
import { OfficerHoverCard } from './OfficerHoverCard';
import { OfficerStats } from './OfficerStats';
import styles from './MarchPicker.module.css';

interface Props {
  cityId: EntityId;
  onClose: () => void;
}

const MAX_COMPANIONS = 5;
const EMPTY_OWNERSHIP: Record<EntityId, EntityId | null> = {};

export function MarchPicker({ cityId, onClose }: Props) {
  const def = COMMAND_DEFS['march'];
  const issueMarch = useGameStore((s) => s.issueMarch);
  const source = useGameStore((s) => s.cities[cityId]);
  const cities = useGameStore((s) => s.cities);
  const forces = useGameStore((s) => s.forces);
  const officersMap = useGameStore((s) => s.officers);
  const season = useGameStore((s) => s.date.season);
  const setMarchPreview = useGameStore((s) => s.setMarchPreview);
  const territoryOwnership = useGameStore((s) => s.territoryOwnership ?? EMPTY_OWNERSHIP);
  const [showPrep, setShowPrep] = useState(false);

  const pendingTrainings = useGameStore((s) => s.pendingTrainings);
  const trainingIds = useMemo(
    () => new Set(pendingTrainings.map((tr) => tr.officerId)),
    [pendingTrainings],
  );
  const officers = useMemo(
    () =>
      Object.values(officersMap)
        .filter(
          (o) =>
            o.locationCityId === cityId &&
            o.forceId === source?.ownerForceId &&
            o.status === 'idle' &&
            !o.task &&
            !trainingIds.has(o.id),
        )
        .sort((a, b) => b.stats.leadership - a.stats.leadership),
    [officersMap, cityId, source?.ownerForceId, trainingIds],
  );

  const ports = useGameStore((s) => s.ports);

  const adjacentCities = useMemo(
    () =>
      (source?.adjacentCityIds ?? [])
        .map((id) => cities[id])
        .filter((c) => !!c),
    [source?.adjacentCityIds, cities],
  );

  /** Cities reachable from `cityId` by sea via the port graph. Each comes
   *  with isNaval=true so the dropdown can mark them with 🚢. */
  const navalCities = useMemo(() => {
    const navalIds = navalReachableCityIds(cityId, ports);
    const adjacentSet = new Set(adjacentCities.map((c) => c.id));
    return [...navalIds]
      .filter((id) => !adjacentSet.has(id))   // don't double-list
      .map((id) => cities[id])
      .filter((c) => !!c);
  }, [cityId, ports, adjacentCities, cities]);

  /** Combined target candidates (land + sea). */
  const targetCandidates = useMemo(
    () => [
      ...adjacentCities.map((c) => ({ city: c, naval: false })),
      ...navalCities.map((c) => ({ city: c, naval: true })),
    ],
    [adjacentCities, navalCities],
  );

  const [targetId, setTargetId] = useState<EntityId | null>(
    adjacentCities[0]?.id ?? null,
  );
  const [officerId, setOfficerId] = useState<EntityId | null>(
    officers[0]?.id ?? null,
  );

  // Route preview for the selected target: which territory cells the army
  // crosses, who owns them, how many seasons, and whether it passes through
  // hostile ground (which risks interception + bleeds supply en route).
  const routeInfo = useMemo(() => {
    const src = cities[cityId];
    const tgt = targetId ? cities[targetId] : null;
    if (!src || !tgt) return null;
    const territories = generateTerritories(Object.values(cities));
    const route = terrainRoute(src.coords.x, src.coords.y, tgt.coords.x, tgt.coords.y);
    const ownerAt = (x: number, y: number): EntityId | null => {
      let best = -1;
      let bestD = Infinity;
      for (let i = 0; i < territories.length; i++) {
        const dx = x - territories[i].coords.x;
        const dy = y - territories[i].coords.y;
        const d = dx * dx + dy * dy;
        if (d < bestD) { bestD = d; best = i; }
      }
      if (best < 0) return null;
      const ter = territories[best];
      const ov = territoryOwnership[ter.id];
      if (ov !== undefined && ov !== null) return ov;
      return cities[ter.parentCityId]?.ownerForceId ?? null;
    };
    // Interior waypoints (skip the two city endpoints).
    const cells = route.slice(1, -1).map((p) => ownerAt(p.x, p.y));
    const myForce = src.ownerForceId;
    const hostileCells = cells.filter((f) => f && f !== myForce).length;
    return { cells, seasons: marchDurationFor(src, tgt, season), hostileCells, myForce };
  }, [cityId, targetId, cities, territoryOwnership]);
  // Light the prospective route up on the 3D map while picking.
  useEffect(() => {
    if (targetId) setMarchPreview({ fromId: cityId, toId: targetId });
    return () => setMarchPreview(null);
  }, [cityId, targetId, setMarchPreview]);

  const [additionalIds, setAdditionalIds] = useState<EntityId[]>([]);
  const [pace, setPace] = useState<MarchPace>('normal');
  const [forcedStratagem, setForcedStratagem] = useState<string>('');
  const weather = useGameStore((s) => s.weather);
  const [troops, setTroops] = useState<number>(
    Math.min(2000, source?.troops ?? 0),
  );

  const toggleAdditional = (id: EntityId) => {
    setAdditionalIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= MAX_COMPANIONS) return prev;
      return [...prev, id];
    });
  };

  if (!source) return null;
  const target = targetId ? cities[targetId] : null;
  const targetForce = target?.ownerForceId
    ? forces[target.ownerForceId]
    : null;
  const isHostile =
    !!target && target.ownerForceId !== source.ownerForceId;
  const officer = officerId ? officersMap[officerId] : null;
  // 戰前敵情 — what we can read of the target's garrison and its captain.
  const enemyIntel = useMemo(() => {
    if (!target || !isHostile) return null;
    let captain: (typeof officersMap)[string] | null = null;
    for (const o of Object.values(officersMap)) {
      if (o.locationCityId !== target.id || o.forceId !== target.ownerForceId) continue;
      if (o.status === 'dead' || o.status === 'unsearched') continue;
      if (!captain || (o.stats.leadership + o.stats.war) > (captain.stats.leadership + captain.stats.war)) captain = o;
    }
    return { garrison: target.troops, captain, defense: target.defense, wallTier: target.wallTier ?? 1 };
  }, [target, isHostile, officersMap]);
  // 軍師獻策 — schemes the chosen commander could deploy in this assault (§5.3).
  const schemeOptions = useMemo(() => {
    if (!officer || !isHostile || !target) return [];
    const companions = additionalIds.map((id) => officersMap[id]).filter(Boolean) as typeof officer[];
    const aInt = Math.round((officer.stats.intelligence + companions.reduce((s, o) => s + o.stats.intelligence, 0)) / (1 + companions.length));
    const cap = enemyIntel?.captain ?? null;
    return applicableStratagems({
      attacker: officer, defender: cap,
      attackerTroops: troops, defenderTroops: target.troops,
      city: target, weather: weather ?? ({ kind: 'clear', windPower: 0 } as never),
      attackerIntelligence: aInt,
      defenderIntelligence: cap?.stats.intelligence ?? 60,
      defenderAvgLoyalty: cap?.loyalty ?? 80,
    });
  }, [officer, isHostile, target, additionalIds, officersMap, troops, enemyIntel, weather]);
  // A scheme the commander can no longer field (target/officer changed) is dropped.
  useEffect(() => {
    if (forcedStratagem && !schemeOptions.some((s) => s.id === forcedStratagem)) setForcedStratagem('');
  }, [schemeOptions, forcedStratagem]);
  const maxTroops = source.troops;
  const canAfford = source.gold >= def.goldCost;
  const valid =
    !!targetId &&
    !!officerId &&
    troops > 0 &&
    troops <= maxTroops &&
    canAfford;

  const handleConfirm = () => {
    if (!valid || !targetId || !officerId) return;
    const extras = additionalIds.filter((id) => id !== officerId);
    const r = issueMarch(cityId, targetId, officerId, troops, extras, pace, false, forcedStratagem || undefined);
    if (r.ok) {
      // 出征 — a war march answers the gate horn with drums; a plain move just
      // sounds the march cadence.
      if (isHostile) {
        playSfx('horn');
        window.setTimeout(() => playSfx('wardrum'), 260);
      } else {
        playSfx('march');
      }
      onClose();
    }
  };

  const handleTactical = () => {
    if (!valid || !targetId || !officerId || !target) return;
    setShowPrep(true);
  };

  const t = useT();
  const lang = useLanguage();
  const adjustTroops = (delta: number) => {
    setTroops((t) => Math.max(0, Math.min(maxTroops, t + delta)));
  };

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <header className={styles.header}>
          <div>
            <div className={styles.titleZh}>{def.label.zh}</div>
            <div className={styles.titleEn}>{def.label.en}</div>
          </div>
          <button className={styles.closeButton} onClick={onClose}>
            ×
          </button>
        </header>

        <div className={styles.row}>
          <span className={styles.rowLabel}>{t('出兵自', 'From')}</span>
          <span className={styles.rowValue}>
            {source.name.zh}
            <span className={styles.muted}>
              {' '}· {source.troops.toLocaleString()} {t('兵', 'troops')} · {source.gold.toLocaleString()} {t('金', 'gold')}
            </span>
          </span>
        </div>

        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>{t('目標', 'Target')}</h3>
          {targetCandidates.length === 0 ? (
            <div className={styles.empty}>{t('無相鄰或海路可達之城。', 'No adjacent or sea-reachable cities.')}</div>
          ) : (
            <ul className={styles.targetList}>
              {targetCandidates.map(({ city: c, naval }) => {
                const f = c.ownerForceId ? forces[c.ownerForceId] : null;
                const hostile = c.ownerForceId !== source.ownerForceId;
                return (
                  <li key={c.id}>
                    <button
                      className={`${styles.targetButton} ${targetId === c.id ? styles.targetSelected : ''}`}
                      onClick={() => setTargetId(c.id)}
                    >
                      <span
                        className={styles.colorDot}
                        style={{ background: f?.color ?? '#364654' }}
                      />
                      <span className={styles.targetText}>
                        <span className={styles.targetNameZh}>
                          {naval && <span style={{ color: '#5a9bc8', marginRight: 4 }}>🚢</span>}
                          {c.name.zh}
                        </span>
                        <span className={styles.targetNameEn}>
                          {t(f?.name.zh ?? '無主', `${c.name.en} · ${f?.name.en ?? 'Neutral'}`)}
                          {naval && <span style={{ color: '#5a9bc8', marginLeft: 6 }}>{t('海路', 'by sea')}</span>}
                        </span>
                      </span>
                      <span className={styles.targetMeta}>
                        {hostile ? (
                          <span className={styles.hostile}>{t('攻', 'ATK')}</span>
                        ) : (
                          <span className={styles.friendly}>{t('移', 'MOVE')}</span>
                        )}
                        <span className={styles.muted}>
                          {c.troops.toLocaleString()}t · D{c.defense} · {marchDurationFor(source, c, season)}{t('季', 's')}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {routeInfo && target && (
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>{t('行軍路線', 'March Route')}</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap', padding: '0.2rem 0' }}>
              {/* source */}
              <span style={{
                display: 'inline-block', width: 9, height: 9, borderRadius: '50%',
                background: source.ownerForceId ? (forces[source.ownerForceId]?.color ?? '#364654') : '#364654',
                border: '1px solid #000',
              }} title={source.name.zh} />
              {routeInfo.cells.map((f, i) => (
                <span key={i} style={{
                  display: 'inline-block', width: 7, height: 7,
                  transform: 'rotate(45deg)',
                  background: f ? (forces[f]?.color ?? '#364654') : '#26323e',
                  outline: f && f !== routeInfo.myForce ? '1px solid #b8442e' : 'none',
                }} title={f ? (forces[f]?.name.zh ?? '無主') : '無主'} />
              ))}
              {/* arrow + target */}
              <span style={{ color: '#7a8893', fontSize: '0.7rem' }}>▸</span>
              <span style={{
                display: 'inline-block', width: 10, height: 10, borderRadius: '50%',
                background: targetForce?.color ?? '#364654',
                border: '1px solid #fff4d0',
              }} title={target.name.zh} />
            </div>
            {(() => {
              // 行軍節奏 — fold the chosen pace + the column's speed (健行/驛站…) into
              // the shown ETA, so the player sees what 急行/緩 actually buys.
              const pool = [officerId ? officersMap[officerId] : null, ...additionalIds.map((id) => officersMap[id])].filter(Boolean) as import('../../game/types').Officer[];
              const eta = adjustMarchSeasons(routeInfo.seasons, pace, marchSpeedMul(pool));
              return (
                <div style={{ fontSize: '0.72rem', color: '#aab6c0', marginTop: '0.2rem' }}>
                  {t(`耗時 ${eta} 季`, `${eta} season(s)`)}
                  {routeInfo.hostileCells > 0 && (
                    <span style={{ color: '#e08850', marginLeft: 8 }}>
                      ⚠ {t(`途經 ${routeInfo.hostileCells} 格敵境 — 恐遭攔截`, `crosses ${routeInfo.hostileCells} enemy cell(s) — interception risk`)}
                    </span>
                  )}
                </div>
              );
            })()}
            {/* 行軍節奏 — 急行軍(快·累毙·疲勞) / 常行 / 緩進(慢·減孤軍折損). */}
            <div style={{ display: 'flex', gap: 6, marginTop: '0.4rem' }}>
              {MARCH_PACES.map((p) => {
                const on = pace === p;
                const tip = p === 'forced' ? t('急行軍:少一季,但累毙折兵、抵達疲勞', 'Forced: −1 season, but stragglers lost & arrives weary')
                  : p === 'cautious' ? t('緩進:多一季,但孤軍折損減半', 'Cautious: +1 season, but half the deep-strike attrition')
                  : t('常行', 'Normal pace');
                return (
                  <button key={p} onClick={() => setPace(p)} title={tip}
                    style={{ flex: 1, padding: '0.25rem', borderRadius: 4, cursor: 'pointer', fontFamily: 'var(--tkm-font-body)', fontSize: '0.74rem',
                      background: on ? 'rgba(230,196,115,0.18)' : '#10161e', border: `1px solid ${on ? '#e6c473' : '#26323e'}`, color: on ? '#f2dd9a' : '#8a96a0' }}>
                    {lang === 'en' ? PACE_LABEL[p].en : PACE_LABEL[p].zh}
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {enemyIntel && (() => {
          // Defender effective strength: garrison hardened by city defense and
          // wall tier. A rough scout's read, not a battle oracle.
          const wallMul = enemyIntel.wallTier >= 3 ? 1.6 : enemyIntel.wallTier === 2 ? 1.3 : 1;
          const defEff = enemyIntel.garrison * (1 + enemyIntel.defense / 200) * wallMul;
          const ratio = troops / Math.max(1, defEff);
          const verdict = ratio >= 2 ? { zh: '勝算極大', en: 'Overwhelming', c: '#7ed68a' }
            : ratio >= 1.3 ? { zh: '兵勢佔優', en: 'Favoured', c: '#a8d67e' }
            : ratio >= 0.8 ? { zh: '勝負難料', en: 'Toss-up', c: '#e6c473' }
            : ratio >= 0.5 ? { zh: '略居下風', en: 'Outmatched', c: '#e0a070' }
            : { zh: '兵力懸殊', en: 'Hopeless', c: '#e0707a' };
          return (
            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>{t('敵情', 'Enemy Intel')}</h3>
              <div style={{ fontSize: '0.76rem', color: '#aab6c0', display: 'flex', flexWrap: 'wrap', gap: '0.2rem 1rem' }}>
                <span>{t('守軍', 'Garrison')} <strong style={{ color: '#e6edf3' }}>{enemyIntel.garrison.toLocaleString()}</strong></span>
                <span>{t('城防', 'Defense')} <strong style={{ color: '#e6edf3' }}>{enemyIntel.defense}</strong></span>
                <span>{t('城壁', 'Wall')} <strong style={{ color: '#e6edf3' }}>{'★'.repeat(enemyIntel.wallTier)}</strong></span>
                <span>{t('守將', 'Captain')} <strong style={{ color: '#e6edf3' }}>{enemyIntel.captain ? enemyIntel.captain.name.zh : t('無', 'none')}</strong>
                  {enemyIntel.captain && <span style={{ marginLeft: 5 }}><OfficerStats officer={enemyIntel.captain} keys={['leadership', 'war']} /></span>}
                </span>
              </div>
              <div style={{ marginTop: '0.3rem', fontSize: '0.78rem' }}>
                {t('兵勢評估', 'Assessment')}: <strong style={{ color: verdict.c }}>{t(verdict.zh, verdict.en)}</strong>
                <span className={styles.muted}> · {t(`遣 ${troops.toLocaleString()} 攻 ${Math.round(defEff).toLocaleString()} 守勢`, `${troops.toLocaleString()} vs ~${Math.round(defEff).toLocaleString()} eff.`)}</span>
              </div>
            </section>
          );
        })()}

        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>{t('大將', 'Commander')}</h3>
          {officers.length === 0 ? (
            <div className={styles.empty}>{t('無可用武將。', 'No available officers.')}</div>
          ) : (
            <div className={styles.officerGrid}>
              {officers.map((o) => (
                <OfficerHoverCard key={o.id} officer={o}>
                  <button
                    className={`${styles.officerButton} ${officerId === o.id ? styles.officerSelected : ''}`}
                    onClick={() => setOfficerId(o.id)}
                  >
                    {lang !== 'en' && <span className={styles.officerNameZh}>{o.name.zh}</span>}
                    {lang !== 'zh' && <span className={styles.officerNameEn}>{o.name.en}</span>}
                    <span className={styles.officerWar}>
                      <OfficerStats officer={o} keys={['leadership', 'war']} />
                    </span>
                  </button>
                </OfficerHoverCard>
              ))}
            </div>
          )}
        </section>

        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>
            {t('副將', 'Accompanying Officers')} — {additionalIds.length} / {MAX_COMPANIONS}
          </h3>
          <div className={styles.officerGrid}>
            {officers
              .filter((o) => o.id !== officerId)
              .map((o) => {
                const picked = additionalIds.includes(o.id);
                const disabled = !picked && additionalIds.length >= MAX_COMPANIONS;
                return (
                  <OfficerHoverCard key={o.id} officer={o}>
                    <button
                      className={`${styles.officerButton} ${picked ? styles.officerSelected : ''}`}
                      onClick={() => toggleAdditional(o.id)}
                      disabled={disabled}
                      style={disabled ? { opacity: 0.35, cursor: 'not-allowed' } : undefined}
                    >
                      {lang !== 'en' && (
                        <span className={styles.officerNameZh}>
                          {picked ? '✓ ' : ''}
                          {o.name.zh}
                        </span>
                      )}
                      {lang !== 'zh' && (
                        <span className={styles.officerNameEn}>{picked && lang === 'en' ? '✓ ' : ''}{o.name.en}</span>
                      )}
                      <span className={styles.officerWar}>
                        <OfficerStats officer={o} keys={['leadership', 'war']} />
                      </span>
                    </button>
                  </OfficerHoverCard>
                );
              })}
          </div>
        </section>

        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>
            {t('兵力', 'Troops')} — {troops.toLocaleString()} / {maxTroops.toLocaleString()}
          </h3>
          <div className={styles.troopRow}>
            <button onClick={() => adjustTroops(-1000)}>−1k</button>
            <button onClick={() => adjustTroops(-100)}>−100</button>
            <input
              type="range"
              min={0}
              max={maxTroops}
              step={100}
              value={troops}
              onChange={(e) => setTroops(Number(e.target.value))}
              className={styles.slider}
            />
            <button onClick={() => adjustTroops(100)}>+100</button>
            <button onClick={() => adjustTroops(1000)}>+1k</button>
            <button
              className={styles.allButton}
              onClick={() => setTroops(maxTroops)}
            >
              {t('全部', 'ALL')}
            </button>
          </div>
        </section>

        {isHostile && schemeOptions.length > 0 && (
          <div style={{ padding: '0.4rem 0.75rem', borderTop: '1px solid #3a2818', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.78rem', color: '#c178c7' }} title={t('速決戰時軍師獻上之計;過智謀門檻且合戰場條件方可施。戰術對戰請改用左鍵「戰術」', 'A scheme your strategist offers for a quick-resolved assault — INT-gated & condition-bound. For a played-out battle use “Tactical”.')}>
              🧠 {t('軍師獻策', 'Strategist')}
            </span>
            <select
              value={forcedStratagem}
              onChange={(e) => setForcedStratagem(e.target.value)}
              style={{ fontSize: '0.78rem', background: 'rgba(20,14,8,0.9)', color: '#d4a84a', border: '1px solid #5a4530', borderRadius: 3, padding: '2px 5px', fontFamily: 'var(--tkm-font-body)' }}
            >
              <option value="">{t('不獻計(主將自擇)', 'None (let the marshal decide)')}</option>
              {schemeOptions.map((s) => (
                <option key={s.id} value={s.id}>{lang === 'en' ? s.name.en : s.name.zh}（{Math.round(s.odds * 100)}%）</option>
              ))}
            </select>
          </div>
        )}
        <footer className={styles.footer}>
          <div className={styles.footerMeta}>
            {t('費用', 'Cost')}: <strong>{def.goldCost}{t('金', 'g')}</strong>
            {target && officer && (
              <>
                {' '}· {isHostile ? t('攻擊', 'Attack') : t('移防', 'Transfer')}{' '}
                <strong>{target.name.zh}</strong>
                {targetForce && (
                  <span className={styles.muted}>
                    {' '}({targetForce.name.zh})
                  </span>
                )}
              </>
            )}
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {isHostile && (
              <button
                className={styles.confirmButton}
                onClick={handleTactical}
                disabled={!valid}
                style={{ background: '#26323e', borderColor: '#88b7e8', color: '#88b7e8' }}
                title={t('以回合制戰術戰鬥決勝', 'Resolve as turn-based tactical battle')}
              >
                {t('戰術', 'Tactical')}
              </button>
            )}
            <button
              className={styles.confirmButton}
              onClick={handleConfirm}
              disabled={!valid}
            >
              {isHostile ? t('出陣！', 'March!') : t('移動', 'Move')}
            </button>
          </div>
        </footer>
      </div>
      {showPrep && targetId && officerId && (
        <BattlePrepModal
          sourceCityId={cityId}
          targetCityId={targetId}
          commanderId={officerId}
          companionIds={additionalIds.filter((id) => id !== officerId)}
          totalTroops={troops}
          onClose={() => {
            setShowPrep(false);
            onClose();
          }}
        />
      )}
    </div>
  );
}
