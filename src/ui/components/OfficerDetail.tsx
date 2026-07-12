import { lazy, Suspense, useMemo, useState } from 'react';
import { OfficerCardModal } from './OfficerCardModal';
import { useGameStore } from '../../game/state/store';
import { COMMAND_DEFS } from '../../game/systems/commands';
import { composeBiography } from '../../game/systems/biography';
import type { BoutRecord } from '../../game/systems/duelHall';
// Lazy — pulls the heavy 3D duel/debate stack only when a 名局 is actually replayed.
const BoutReplay3D = lazy(() => import('./duel/BoutReplay3D').then((m) => ({ default: m.BoutReplay3D })));
import { durationBreakdown, isParentMentor } from '../../game/systems/training';
import { effectiveStats, traitMechanicalEffects, isFlavorOnlyTrait } from '../../game/systems/traitEffects';
import { FAMILY_LINEAGE } from '../../game/data/familyLineage';
import { DEED_TITLES_BY_ID } from '../../game/systems/deedTitles';
import {
  CIVIC_TITLES_BY_ID,
  ITEMS_BY_ID,
  MILITARY_RANKS_BY_ID,
  OFFICER_RELATIONSHIPS,
  SKILLS_BY_ID,
  TRAIT_DEFS_BY_ID,
  getBiography,
} from '../../game/data';
import {
  DOCTRINE_DEFS,
  FORMATION_DEFS,
  TACTIC_DEFS,
  POLICY_DEFS,
  tacticBonus,
  isTacticSignature,
  TACTIC_COMBOS,
} from '../../game/data/officerAttributes';
import { WEAPON_TYPE_DEFS, deriveWeaponType } from '../../game/data/weaponTypes';
import { HISTORICAL_LIFESPANS } from '../../game/data/historicalLifespans';
import { effectivePrestige } from '../../game/data/prestige';
import { peerageById } from '../../game/data/peerage';
import { clanOf } from '../../game/data/clans';
import { honorificById } from '../../game/data/honorifics';
import { renownFromDeeds, fameTier, fameMedal } from '../../game/systems/fame';
import { xpProgress, learnableSkills, canBreakthrough, breakthroughCost, breakthroughIronCost, BREAKTHROUGH_PATHS, MAX_BREAKTHROUGHS, breakthroughTitle, growthPowerMul, growthAptitude, aptitudeLabel, EPIPHANY_THRESHOLD } from '../../game/systems/growth';
import { canAppraise, GRADE_LABEL } from '../../game/systems/appraisal';
import { officerGrade, officerLevel, nextGradeGap, gradeMeta } from '../../game/systems/officerGrade';
import { MAX_STARS, officerStars, nextStarRequirement } from '../../game/systems/stars';
import { skillLevelBadge } from '../../game/systems/skillMastery';
import { gradeCombatBonus, itemMasteryMul } from '../../game/systems/gradeCombat';
import { itemRarity, itemRarityMeta, liveItemById, refineCost, REFINE_MAX,
  BREAKTHROUGH_MAX, breakthroughCost as itemBreakthroughCost, socketsFor, GEMS, GEMS_BY_ID,
  itemLoreLevel, itemLoreTitle } from '../../game/data/items';
import { activeItemSets } from '../../game/data/itemSets';
import { ageBand, annualDeathChance } from '../../game/systems/aging';
import type { City, Force, Officer, OfficerStats, Skill } from '../../game/types';
import { FORMATIONS_BY_ID } from '../../game/data/formations';
import { TACTIC_DESC } from './TacticsModal';
import { POLICY_DESC } from './PoliciesModal';
import styles from './OfficerDetail.module.css';
import { useT, useLanguage } from '../i18n';

type PortraitArchetype = 'warrior' | 'strategist' | 'civil' | 'ruler' | 'lady' | 'sage';

const KNOWN_LADIES = new Set<string>([
  'diaochan', 'huang-yueying', 'lady-sun', 'lady-gan', 'lady-mi',
  'empress-cao', 'empress-zhang', 'empress-pan', 'lady-wu', 'lady-yan',
  'sun-lu',
]);

const KNOWN_RULERS = new Set<string>([
  'cao-cao', 'liu-bei', 'sun-jian', 'sun-ce', 'sun-quan', 'yuan-shao',
  'yuan-shu', 'dong-zhuo', 'liu-biao', 'liu-yan', 'liu-zhang',
  'gongsun-zan', 'tao-qian', 'kong-rong', 'ma-teng', 'zhang-jiao',
  'cao-pi', 'cao-rui',
]);

/**
 * Sum item.effects into a per-stat delta so the UI can show "base + items"
 * on every stat bar. Skills are NOT added — they're separate active/passive
 * combat abilities, not stat boosters.
 */
function effectiveStatBonuses(o: Officer): {
  leadership: number;
  war: number;
  intelligence: number;
  politics: number;
  charisma: number;
} {
  const bonus = { leadership: 0, war: 0, intelligence: 0, politics: 0, charisma: 0 };
  // Item bonuses. 兵器駕馭 — war/leadership are scaled by the wielder's mastery
  // (matching what combat actually applies), so the bars don't promise more
  // than an under-grade officer can draw from a 神兵.
  for (const itemId of o.equipment) {
    const item = liveItemById(itemId);
    if (!item) continue;
    const mastery = itemMasteryMul(o, item);
    bonus.leadership += Math.round((item.effects.leadership ?? 0) * mastery);
    bonus.war += Math.round((item.effects.war ?? 0) * mastery);
    bonus.intelligence += item.effects.intelligence ?? 0;
    bonus.politics += item.effects.politics ?? 0;
    bonus.charisma += item.effects.charisma ?? 0;
  }
  // T2 — trait bonuses (delta from base stats)
  const eff = effectiveStats(o);
  bonus.leadership += eff.leadership - o.stats.leadership;
  bonus.war += eff.war - o.stats.war;
  bonus.intelligence += eff.intelligence - o.stats.intelligence;
  bonus.politics += eff.politics - o.stats.politics;
  bonus.charisma += eff.charisma - o.stats.charisma;
  return bonus;
}

function inferArchetype(o: Officer): PortraitArchetype {
  if (KNOWN_LADIES.has(o.id)) return 'lady';
  if (KNOWN_RULERS.has(o.id)) return 'ruler';
  const s = o.stats;
  // Sage tier: very high intelligence (Zhuge, Pang Tong, Sima Yi after growth)
  if (s.intelligence >= 95) return 'sage';
  if (s.war >= s.intelligence + 10 && s.war >= 75) return 'warrior';
  if (s.intelligence >= s.war + 10 && s.intelligence >= 80) return 'strategist';
  if (s.politics >= 80 && s.war < 70) return 'civil';
  if (s.war >= 80) return 'warrior';
  if (s.intelligence >= 75) return 'strategist';
  return 'civil';
}

interface Props {
  officer: Officer;
  onClose: () => void;
  // Optional context overrides (used by the title-screen scenario browser
  // before any game state is loaded).
  forcesOverride?: Record<string, Force>;
  citiesOverride?: Record<string, City>;
  yearOverride?: number;
  officersOverride?: Record<string, Officer>;
}

export function OfficerDetail({
  officer,
  onClose,
  forcesOverride,
  citiesOverride,
  yearOverride,
  officersOverride,
}: Props) {
  const storeForces = useGameStore((s) => s.forces);
  const storeCities = useGameStore((s) => s.cities);
  const storeYear = useGameStore((s) => s.date.year);
  const lifespanMode = useGameStore((s) => s.lifespanMode);
  const lifespanLength = useGameStore((s) => s.lifespanLength);
  const t = useT();
  const lang = useLanguage();
  const playerForceId = useGameStore((s) => s.playerForceId);
  const appointments = useGameStore((s) => s.appointments);
  const pendingTrainings = useGameStore((s) => s.pendingTrainings);
  const cancelTrainingFn = useGameStore((s) => s.cancelTraining);
  const allOfficers = useGameStore((s) => s.officers);
  const deeds = useGameStore((s) => s.deeds);
  const buildings = useGameStore((s) => s.buildings);
  const family = useGameStore((s) => s.family);
  const officerDeeds = useGameStore((s) => s.deeds[officer.id]);
  const officerWishes = useGameStore((s) => s.officerWishes);
  const openWish = officerWishes.find((w) => w.officerId === officer.id);
  const unequipItemFn = useGameStore((s) => s.unequipItem);
  const refineItemFn = useGameStore((s) => s.refineItem);
  const breakthroughItemFn = useGameStore((s) => s.breakthroughItem);
  const resetItemGrowthFn = useGameStore((s) => s.resetItemGrowth);
  const socketGemFn = useGameStore((s) => s.socketGem);
  const unsocketGemFn = useGameStore((s) => s.unsocketGem);
  const itemBreakthroughs = useGameStore((s) => s.itemBreakthroughs);
  const itemGems = useGameStore((s) => s.itemGems);
  const gemStock = useGameStore((s) => s.gemStock);
  // 裝備養成提示 — turn the store's raw reason codes into a bilingual message.
  const gearReason = (r?: string): string => ({
    'need-foundry': t('需要鐵工坊', 'Needs a foundry'),
    'no-gold': t('金不足', 'Not enough gold'),
    'no-iron': t('鐵不足', 'Not enough iron'),
    'no-socket': t('無空孔', 'No open socket'),
    'refine-first': t('須先精煉滿級', 'Refine to max first'),
    'maxed': t('已達上限', 'Already maxed'),
    'no-city': t('不在我方城中', 'Not held in your city'),
  } as Record<string, string>)[r ?? ''] ?? r ?? '';
  // Subscribe so refining (which bumps this map) re-renders the equipment list.
  const itemRefinements = useGameStore((s) => s.itemRefinements);
  const setTrainingFocusFn = useGameStore((s) => s.setTrainingFocus);
  const breakthroughOfficerFn = useGameStore((s) => s.breakthroughOfficer);
  const assignMentorFn = useGameStore((s) => s.assignMentor);
  const studyManualFn = useGameStore((s) => s.studyManual);
  const issueCommandFn = useGameStore((s) => s.issueCommand);
  const appraiseOfficerFn = useGameStore((s) => s.appraiseOfficer);
  const activeTraining = pendingTrainings.find((tr) => tr.officerId === officer.id);
  const isPlayerOfficer = officer.forceId === playerForceId;
  const [progressMsg, setProgressMsg] = useState<string | null>(null);
  const [appraiseMsg, setAppraiseMsg] = useState<string | null>(null);

  const forces = forcesOverride ?? storeForces;
  const cities = citiesOverride ?? storeCities;
  const currentYear = yearOverride ?? storeYear;

  const force = officer.forceId ? forces[officer.forceId] : null;
  const city = officer.locationCityId
    ? cities[officer.locationCityId]
    : null;
  const age = currentYear - officer.birthYear;
  const isMine = officer.forceId === playerForceId;
  const taskDef = officer.task ? COMMAND_DEFS[officer.task] : null;
  const rankDef = MILITARY_RANKS_BY_ID[officer.rank];
  const appointment = appointments.find((a) => a.officerId === officer.id);
  const titleDef = appointment ? CIVIC_TITLES_BY_ID[appointment.titleId] : null;
  const [showCard, setShowCard] = useState(false);
  // 星級 — feedback line for the star-up button (成功/緣由 both land here).
  const [starMsg, setStarMsg] = useState<string | null>(null);
  const investStar = useGameStore((s) => s.investStar);
  // 退訂培訓的二段確認(取代 window.confirm)。
  const [confirmCancelTraining, setConfirmCancelTraining] = useState(false);

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* 🎴 武將卡 — the trading-card view (full art + grade frame + BP). */}
        <button
          onClick={() => setShowCard(true)}
          aria-label={lang === 'en' ? 'Officer card' : '武將卡'}
          title={lang === 'en' ? 'Officer card — full art, grade frame, battle power' : '武將卡 — 全身立繪·品階卡框·綜合戰力'}
          style={{
            position: 'absolute', top: 8, right: 44, zIndex: 4,
            background: 'rgba(58,45,24,0.85)', border: '1px solid #d4a84a', color: '#f0d98a',
            borderRadius: 'var(--tkm-radius-sm)', padding: '2px 9px', cursor: 'pointer',
            fontFamily: 'inherit', fontSize: '0.78rem',
          }}
        >🎴 {lang === 'en' ? 'Card' : '武將卡'}</button>
        {showCard && <OfficerCardModal officer={officer} onClose={() => setShowCard(false)} />}
        <PortraitColumn
          officer={officer}
          zh={officer.name.zh}
          color={force?.color ?? '#364654'}
          archetype={inferArchetype(officer)}
          age={age}
        />
        <div className={styles.detailBody}>
        <header className={styles.header}>
          <div className={styles.titleBlock}>
            {lang !== 'en' && <div className={styles.titleZh}>{officer.name.zh}</div>}
            {lang === 'en' && <div className={styles.titleZh}>{officer.name.en}</div>}
            {(lang !== 'zh' || officer.courtesyName) && (
              <div className={styles.titleEn}>
                {lang === 'both' && officer.name.en}
                {officer.courtesyName && (
                  <span className={styles.courtesy}>
                    {lang === 'both' && ' · '}
                    {lang === 'zh' && '字 '}
                    {lang === 'en' ? officer.courtesyName.en : officer.courtesyName.zh}
                    {lang === 'both' && <> {officer.courtesyName.en}</>}
                  </span>
                )}
              </div>
            )}
            {(() => {
              const prestige = effectivePrestige(officer);
              if (!prestige) return null;
              return (
                <div style={{
                  display: 'inline-block', marginTop: '0.3rem', padding: '0.12rem 0.5rem',
                  background: 'linear-gradient(180deg, #4a3a1a, #2a2010)', border: '1px solid #e6c473',
                  color: '#f0d890', fontSize: '0.82rem', letterSpacing: '0.05rem', borderRadius: 'var(--tkm-radius-xs)',
                }}>
                  威名 · {lang === 'en' ? prestige.name.en : prestige.name.zh}
                </div>
              );
            })()}
            {(() => {
              // 名聲榜 — martial/rhetorical renown from the officer's deeds.
              const renown = renownFromDeeds(deeds[officer.id]);
              if (renown < 20) return null;
              const tier = fameTier(renown);
              const medal = fameMedal(renown);
              return (
                <div style={{
                  display: 'inline-block', marginTop: '0.3rem', marginLeft: '0.4rem', padding: '0.12rem 0.5rem',
                  background: 'linear-gradient(180deg, #1a3a2a, #102018)', border: '1px solid #6aae8a',
                  color: '#9ed8b8', fontSize: '0.82rem', letterSpacing: '0.05rem', borderRadius: 'var(--tkm-radius-xs)',
                }}>
                  {medal && (
                    <span title={lang === 'en' ? medal.name.en : medal.name.zh} style={{ marginRight: '0.3rem' }}>
                      {medal.glyph}
                    </span>
                  )}
                  {lang === 'en' ? tier.en : tier.zh} · {t('名望', 'Renown')} {renown}
                </div>
              );
            })()}
            {officer.retinueOfLordId && allOfficers[officer.retinueOfLordId] && officer.retinueOfLordId !== officer.id && (() => {
              const lord = allOfficers[officer.retinueOfLordId];
              const serving = lord.status !== 'dead' && lord.forceId === officer.forceId;
              return (
                <div title={serving ? t('故主在上,死生相隨', "Serving their old lord — loyalty runs deep") : t('故主之舊部', "An old lord's retainer")}
                  style={{
                    display: 'inline-block', marginTop: '0.3rem', marginLeft: '0.4rem', padding: '0.12rem 0.5rem',
                    background: 'linear-gradient(180deg,#2a2418,#161208)', border: '1px solid #8a7244',
                    color: '#d8c08a', fontSize: '0.78rem', letterSpacing: '0.05rem', borderRadius: 'var(--tkm-radius-xs)',
                  }}>
                  {t(`舊部 · ${lord.name.zh}之故將`, `Retainer of ${lord.name.en}`)}{serving ? ' ✦' : ''}
                </div>
              );
            })()}
            {(officer.afflictions ?? []).map((a) => (
              <div key={a.kind} style={{ marginTop: '0.2rem', fontSize: '0.72rem', color: a.kind === 'wound' ? '#d88a6a' : '#c79ad6' }}>
                {a.kind === 'wound'
                  ? `🩹 ${t(`養傷中(武力 ${a.war}，${a.seasons} 季)`, `Recovering (WAR ${a.war}, ${a.seasons}s)`)}`
                  : `😖 ${t(`羞憤難平(魅力 ${a.charisma}、智力 ${a.intelligence}，${a.seasons} 季)`, `Shamed (CHA ${a.charisma}/INT ${a.intelligence}, ${a.seasons}s)`)}`}
              </div>
            ))}
            {officer.status === 'wounded' && officer.woundSeverity && (() => {
              const sev = officer.woundSeverity;
              const zh = sev === 'critical' ? '瀕死' : sev === 'serious' ? '重傷' : '輕傷';
              const en = sev === 'critical' ? 'Critical' : sev === 'serious' ? 'Serious' : 'Minor';
              const mul = sev === 'critical' ? '0.65' : sev === 'serious' ? '0.78' : '0.9';
              const seasons = officer.woundedSeasons ?? 0;
              return (
                <div style={{ marginTop: '0.2rem', fontSize: '0.72rem', fontWeight: 600,
                  color: sev === 'critical' ? '#b8442e' : sev === 'serious' ? '#d88a6a' : '#caa15a' }}>
                  🩹 {t(`${zh}・${seasons} 季・戰力 ×${mul}${sev === 'critical' ? '・不能理事' : ''}`,
                       `${en} wound · ${seasons}s · power ×${mul}${sev === 'critical' ? ' · cannot serve' : ''}`)}
                </div>
              );
            })()}
            {openWish && (
              <div style={{
                marginTop: '0.3rem', fontSize: '0.78rem',
                color: openWish.kind === 'info' ? '#7ed68a' : '#e6c473',
                letterSpacing: '0.1rem',
              }}>
                📜 {openWish.kind === 'info' ? (lang === 'en' ? 'A memorial awaits your review' : '一封上書待覽') : (lang === 'en' ? 'A letter awaits your reply' : '一封書信待覆')}
              </div>
            )}
            {(officer.grievanceCount ?? 0) >= 2 && (
              <div style={{ marginTop: '0.2rem', fontSize: '0.72rem', color: '#b8442e' }}>
                ⚠ {lang === 'en' ? `Growing resentment (×${officer.grievanceCount})` : `怨望日深(怨次 ${officer.grievanceCount})`}
              </div>
            )}
            {/* 君主彈壓 (§7.5 ①) — pre-empt a brewing rebel among your own officers. */}
            {isPlayerOfficer && officer.id !== storeForces[playerForceId ?? '']?.rulerOfficerId
              && (officer.status === 'idle' || officer.status === 'active')
              && (officer.loyalty < 40 || (officer.grievanceCount ?? 0) >= 2) && (() => {
              const disc = useGameStore.getState().disciplineOfficer;
              const act = (a: 'placate' | 'reassign' | 'imprison' | 'execute') => { const r = disc(officer.id, a); if (r.message) alert(r.message); };
              const btn: React.CSSProperties = { background: 'transparent', border: '1px solid #5a4326', color: '#d6a86a', cursor: 'pointer', fontSize: '0.68rem', padding: '0.1rem 0.4rem', borderRadius: 'var(--tkm-radius-xs)' };
              return (
                <div style={{ marginTop: '0.35rem', display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.68rem', color: '#7a8893' }}>{lang === 'en' ? 'Discipline:' : '君主彈壓:'}</span>
                  <button style={btn} title={lang === 'en' ? 'Placate — 400g → loyalty +15' : '安撫 — 400金 → 忠誠+15、消積怨'} onClick={() => act('placate')}>{lang === 'en' ? 'Placate' : '安撫'}</button>
                  <button style={btn} title={lang === 'en' ? 'Recall to capital — strips their power base' : '調離 — 召還都城,奪其割據之基'} onClick={() => act('reassign')}>{lang === 'en' ? 'Reassign' : '調離'}</button>
                  <button style={{ ...btn, borderColor: '#5a2d2d', color: '#e0707a' }} title={lang === 'en' ? 'Imprison' : '下獄'} onClick={() => act('imprison')}>{lang === 'en' ? 'Imprison' : '下獄'}</button>
                  <button style={{ ...btn, borderColor: '#5a2d2d', color: '#e0707a' }} title={lang === 'en' ? 'Execute — decisive, but breeds grudges' : '誅殺 — 絕後患,然全軍離心、結怨'} onClick={() => act('execute')}>{lang === 'en' ? 'Execute' : '誅殺'}</button>
                </div>
              );
            })()}
          </div>
          <button className={styles.closeButton} onClick={onClose}>
            ×
          </button>
        </header>

        <section className={styles.identity}>
          <div className={styles.identityRow}>
            <span className={styles.idLabel}>{t('勢力', 'Force')}</span>
            <span>
              {force ? (
                <>
                  <span
                    className={styles.dot}
                    style={{ background: force.color }}
                  />
                  <span className={styles.idValue}>{lang === 'en' ? force.name.en : force.name.zh}</span>
                  {lang === 'both' && <span className={styles.idValueEn}>· {force.name.en}</span>}
                  {isMine && <span className={styles.youTag}>{t('我方', 'YOU')}</span>}
                </>
              ) : officer.status === 'imprisoned' ? (
                <span className={styles.captiveTag}>{t('俘虜', 'Captive')}</span>
              ) : (
                <span className={styles.freeTag}>{t('浪人', 'Free Agent')}</span>
              )}
            </span>
          </div>
          <div className={styles.identityRow}>
            <span className={styles.idLabel}>{t('居所', 'Location')}</span>
            <span>
              {city ? (
                <>
                  <span className={styles.idValue}>{lang === 'en' ? city.name.en : city.name.zh}</span>
                  {lang === 'both' && <span className={styles.idValueEn}>· {city.name.en}</span>}
                </>
              ) : (
                <span className={styles.muted}>—</span>
              )}
            </span>
          </div>
          {officer.hometownCityId && cities[officer.hometownCityId] && (
            <div className={styles.identityRow}>
              <span className={styles.idLabel}>{t('籍貫', 'Hometown')}</span>
              <span>
                <span className={styles.idValue}>
                  {lang === 'en'
                    ? cities[officer.hometownCityId].name.en
                    : cities[officer.hometownCityId].name.zh}
                </span>
                {lang === 'both' && (
                  <span className={styles.idValueEn}>· {cities[officer.hometownCityId].name.en}</span>
                )}
              </span>
            </div>
          )}
          <div className={styles.identityRow}>
            <span className={styles.idLabel}>{t('年齡', 'Age')}</span>
            <span className={styles.idValue}>
              {age}{' '}
              <span className={styles.muted}>
                ({officer.birthYear}
                {officer.deathYear ? ` – ${officer.deathYear}*` : ''})
              </span>
            </span>
          </div>
          {taskDef && (
            <div className={styles.identityRow}>
              <span className={styles.idLabel}>{t('現任命令', 'Current Order')}</span>
              <span className={styles.idValue}>
                {lang === 'en' ? taskDef.label.en : lang === 'both' ? `${taskDef.label.zh} ${taskDef.label.en}` : taskDef.label.zh}
              </span>
            </div>
          )}
          <div className={styles.identityRow}>
            <span className={styles.idLabel}>{t('官位', 'Title')}</span>
            <span>
              {titleDef && (
                <span className={styles.titleBadge}>
                  <span className={styles.titleBadgeZh}>{lang === 'en' ? titleDef.name.en : titleDef.name.zh}</span>
                  {lang === 'both' && <span className={styles.rankEn}>{titleDef.name.en}</span>}
                </span>
              )}
              {rankDef && (
                <span className={styles.rankBadge}>
                  <span className={styles.rankZh}>{lang === 'en' ? rankDef.name.en : rankDef.name.zh}</span>
                  {lang === 'both' && <span className={styles.rankEn}>{rankDef.name.en}</span>}
                </span>
              )}
              {(() => {
                const peer = peerageById(officer.peerageId);
                if (!peer) return null;
                return (
                  <span
                    className={styles.rankBadge}
                    style={{ background: 'linear-gradient(135deg,#7a5c12,#caa53d)', color: '#1a1206' }}
                    title={t(
                      `爵位 ${peer.name.zh} · 食邑每季 +${peer.fiefGold}金 +${peer.fiefGrain}糧 · 忠誠 +${peer.loyaltyBonus}/季`,
                      `Peerage ${peer.name.en} · fief +${peer.fiefGold}g +${peer.fiefGrain} grain/season · loyalty +${peer.loyaltyBonus}/season`,
                    )}
                  >
                    <span className={styles.rankZh}>{lang === 'en' ? peer.name.en : peer.name.zh}</span>
                    {lang === 'both' && <span className={styles.rankEn}>{peer.name.en}</span>}
                  </span>
                );
              })()}
              {(() => {
                const hon = honorificById(officer.honorificId);
                if (!hon) return null;
                return (
                  <span
                    className={styles.rankBadge}
                    style={{ background: 'linear-gradient(135deg,#5a1e1e,#b8442e)', color: '#fbeede' }}
                    title={t(
                      `名號 ${hon.name.zh} · 忠誠 +${hon.loyaltyBonus}/季${hon.combatPowerMul ? ` · 戰力 ×${hon.combatPowerMul}` : ''}`,
                      `Honorific ${hon.name.en} · loyalty +${hon.loyaltyBonus}/season${hon.combatPowerMul ? ` · power ×${hon.combatPowerMul}` : ''}`,
                    )}
                  >
                    <span className={styles.rankZh}>{lang === 'en' ? hon.name.en : hon.name.zh}</span>
                    {lang === 'both' && <span className={styles.rankEn}>{hon.name.en}</span>}
                  </span>
                );
              })()}
            </span>
          </div>
        </section>

        <section className={styles.statsSection}>
          <h3 className={styles.sectionTitle}>{t('能力', 'Statistics')}</h3>
          {(() => {
            const b = effectiveStatBonuses(officer);
            return (
              <>
                <StatBar label={t('統率', 'Leadership')}   value={officer.stats.leadership}   bonus={b.leadership} />
                <StatBar label={t('武力', 'War')}          value={officer.stats.war}          bonus={b.war} />
                <StatBar label={t('知力', 'Intelligence')} value={officer.stats.intelligence} bonus={b.intelligence} />
                <StatBar label={t('政治', 'Politics')}     value={officer.stats.politics}     bonus={b.politics} />
                <StatBar label={t('魅力', 'Charisma')}     value={officer.stats.charisma}     bonus={b.charisma} />
              </>
            );
          })()}
        </section>

        <section className={styles.statsSection}>
          <h3 className={styles.sectionTitle}>{t('心情', 'Disposition')}</h3>
          <StatBar label={t('忠誠', 'Loyalty')} value={officer.loyalty} mode="loyalty" />
        </section>

        {(
          <section className={styles.statsSection}>
            <h3 className={styles.sectionTitle}>{t('武將錄', 'Officer Profile')}</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem 1.5rem', alignItems: 'flex-start' }}>
              {(() => {
                // 品階 — gold/silver/bronze grade from effective stats. Descriptive,
                // not a spend currency: it climbs 鐵→銅→銀→金 as the officer grows.
                const g = officerGrade(officer);
                const renown = Math.round(officer.renown ?? 0);
                return (
                  <div title={t(`品階 ${g.rank.zh} · 評分 ${g.score}${renown ? ` · 戰功威望 ${renown}` : ''}`, `Grade ${g.rank.en} · score ${g.score}${renown ? ` · renown ${renown}` : ''}`)}>
                    <span style={{ fontSize: '0.72rem', color: '#7a8893', letterSpacing: '0.05rem' }}>{t('品階', 'Grade')} </span>
                    <span style={{
                      display: 'inline-block', padding: '0.1rem 0.5rem', borderRadius: 'var(--tkm-radius-xs)',
                      background: '#10161e', border: `1px solid ${g.color}`, color: g.color,
                      fontSize: '0.85rem', letterSpacing: '0.08rem',
                    }}>
                      {lang === 'en' ? g.name.en : g.name.zh}
                      <span style={{ marginLeft: 4, fontSize: '0.7rem', opacity: 0.8 }}>
                        {lang === 'en' ? g.rank.en : g.rank.zh}
                      </span>
                    </span>
                    {renown > 0 && (
                      <span style={{ marginLeft: 6, fontSize: '0.7rem', color: '#c8a24e' }}>
                        {t('威望', 'Renown')} {renown}
                      </span>
                    )}
                    {/* 晉品評定 — make the hidden grade formula legible: points to next tier. */}
                    {(() => {
                      const gap = nextGradeGap(officer);
                      if (!gap.next) return null;
                      const nm = gradeMeta(gap.next);
                      return (
                        <span style={{ marginLeft: 6, fontSize: '0.7rem', color: '#7a8893' }}>
                          {t(`距${nm.name.zh} +${gap.toNext}`, `+${gap.toNext} to ${nm.name.en}`)}
                        </span>
                      );
                    })()}
                  </div>
                );
              })()}
              {(() => {
                // 星級 — the card-game ascension track (stars.ts): six stars
                // bought with gold, level-gated, awakening at the sixth.
                const s = officerStars(officer);
                const req = nextStarRequirement(officer);
                const canBuy = isMine && req.ok;
                return (
                  <div title={t(
                    `星級 ${s}/${MAX_STARS} — 每星微升品階威儀(戰力/單挑/舌戰);六星覺醒:最強一圍 +2`,
                    `Stars ${s}/${MAX_STARS} — each star amplifies the grade passive; the sixth awakens (+2 best stat)`)}>
                    <span style={{ fontSize: '0.72rem', color: '#7a8893', letterSpacing: '0.05rem' }}>{t('星級', 'Stars')} </span>
                    <span style={{ fontSize: '0.9rem', color: '#ffd66e', letterSpacing: '0.1rem' }}>
                      {'★'.repeat(s)}<span style={{ color: '#3d4a56' }}>{'☆'.repeat(MAX_STARS - s)}</span>
                    </span>
                    {s >= MAX_STARS && <span style={{ marginLeft: 6, fontSize: '0.7rem', color: '#e6c473' }}>{t('覺醒', 'Awakened')}</span>}
                    {isMine && s < MAX_STARS && (
                      <button
                        onClick={() => { setStarMsg(investStar(officer.id).message); }}
                        disabled={!canBuy}
                        title={req.ok
                          ? t(`升第 ${req.next} 星:金 ${req.cost}(取自所在城)`, `Buy star ${req.next}: ${req.cost} gold (from their city)`)
                          : (lang === 'en' ? req.reasonEn ?? '' : req.reasonZh ?? '')}
                        style={{
                          marginLeft: 8, padding: '0.05rem 0.5rem', fontSize: '0.72rem', cursor: canBuy ? 'pointer' : 'default',
                          background: canBuy ? 'rgba(230,196,115,0.12)' : 'transparent',
                          border: `1px solid ${canBuy ? '#8a6a2a' : '#2b3845'}`, borderRadius: 'var(--tkm-radius-xs)',
                          color: canBuy ? '#e6c473' : '#5f6c76', fontFamily: 'inherit',
                        }}
                      >{t(`升星 ${req.cost}金`, `Star up ${req.cost}g`)}</button>
                    )}
                    {starMsg && <span style={{ marginLeft: 6, fontSize: '0.7rem', color: '#c8a24e' }}>{starMsg}</span>}
                  </div>
                );
              })()}
              {(() => {
                // 歷練 — the officer's overall level (headline) plus a bar showing
                // progress toward the next stat-growth tick. Raised by practice,
                // debates, battle and internal-affairs work.
                const lvl = officerLevel(officer);
                const p = xpProgress(officer.xp);
                const pct = p.atMax ? 100 : Math.round((p.intoLevel / p.levelSpan) * 100);
                return (
                  <div style={{ minWidth: 150 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem' }}>
                      <span style={{ fontSize: '0.72rem', color: '#7a8893', letterSpacing: '0.05rem' }}>{t('歷練', 'Level')}</span>
                      <span style={{ fontSize: '1.1rem', color: '#e6c473', fontFamily: 'ui-monospace, monospace' }}>
                        Lv.{lvl}
                      </span>
                    </div>
                    <div style={{ marginTop: 3, height: 5, width: 150, background: '#10161e', border: '1px solid #26323e', borderRadius: 'var(--tkm-radius-xs)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: p.atMax ? 'linear-gradient(90deg,#c9a64e,#e6c473)' : '#3a7dd9' }} />
                    </div>
                    <div style={{ marginTop: 2, fontSize: '0.7rem', color: '#7a8893', fontFamily: 'ui-monospace, monospace' }}>
                      {p.atMax
                        ? t(`已臻化境 · 頓悟 ${officer.epiphany ?? 0}/${EPIPHANY_THRESHOLD}`, `Mastery · Epiphany ${officer.epiphany ?? 0}/${EPIPHANY_THRESHOLD}`)
                        : t(`距下次成長 · 再 ${p.toNext} 經驗`, `${p.toNext} XP to next growth`)}
                    </div>
                  </div>
                );
              })()}
              {(() => {
                // 成長資質 — per-stat talent (天/上/中/常) read from latent ceilings.
                // 月旦評 識人雾 — known for your own officers, or any a 名士 has
                // appraised; otherwise the ceilings are fog until you size them up.
                const apt = growthAptitude(officer);
                const STATS: Array<{ key: keyof typeof apt; zh: string; en: string }> = [
                  { key: 'leadership', zh: '統', en: 'LDR' }, { key: 'war', zh: '武', en: 'WAR' },
                  { key: 'intelligence', zh: '智', en: 'INT' }, { key: 'politics', zh: '政', en: 'POL' },
                  { key: 'charisma', zh: '魅', en: 'CHA' },
                ];
                const col = (g: string) => g === 'S' ? '#e6c473' : g === 'A' ? '#9ed8b8' : g === 'B' ? '#88b7e8' : '#7a8893';
                const ap = officer.appraisal;
                const accurate = !!ap && !ap.misread;            // a 走眼 read reveals nothing
                const known = isMine || accurate;
                const recognized = officer.recognizedByForceId === playerForceId && officer.forceId !== playerForceId; // 知遇
                // 名士 — the keenest eye in your court (not the target).
                const appraiser = Object.values(allOfficers)
                  .filter((o) => o.forceId === playerForceId && (o.status === 'idle' || o.status === 'active') && canAppraise(o) && o.id !== officer.id)
                  .sort((a, b) => b.stats.intelligence - a.stats.intelligence)[0];
                // A fresh read, or a re-read only by a strictly sharper eye than the one who 走眼'd.
                const canAppraiseNow = !!appraiser && (!ap || (ap.misread && appraiser.stats.intelligence > (ap.byInt ?? 0)));
                const doAppraise = () => {
                  const r = appraiseOfficerFn(officer.id);
                  if (!r.ok) { setAppraiseMsg(r.reason === 'no-better-eye' ? t('需更高明的識者方能重斷。', 'Needs a sharper eye to judge again.') : t('無名士可品評。', 'No 名士 available.')); return; }
                  const an = lang === 'en' ? r.appraiserName!.en : r.appraiserName!.zh;
                  setAppraiseMsg(r.misread
                    ? t(`${an} 沉吟未決 —「${r.verdictZh}」(走眼,資質難辨,可另請高明)`, `${an} hesitates — “${r.verdictEn}” (a misread; send a sharper eye)`)
                    : t(`${an} 品評:「${r.verdictZh}」(名望 +${r.renownGain})`, `${an}: “${r.verdictEn}” (renown +${r.renownGain})`));
                };
                return (
                  <div style={{ minWidth: 150 }}>
                    <span style={{ fontSize: '0.72rem', color: '#7a8893', letterSpacing: '0.05rem' }}>
                      {t('成長資質', 'Aptitude')}{recognized && <span style={{ color: '#9ed68a' }} title={t('知遇之恩 — 你曾賞識他,招攬大加成', 'You recognized him — far easier for you to recruit')}> · {t('知遇', 'Recognized')}</span>}
                    </span>
                    {known ? (
                      <div style={{ display: 'flex', gap: 4, marginTop: 3, flexWrap: 'wrap' }}>
                        {STATS.map((s) => (
                          <span key={s.key}
                            title={t(`${s.zh} · ${aptitudeLabel(apt[s.key]).zh}`, `${s.en} · ${apt[s.key]} aptitude`)}
                            style={{ fontSize: '0.7rem', padding: '0.05rem 0.32rem', borderRadius: 'var(--tkm-radius-xs)', background: '#10161e', border: `1px solid ${col(apt[s.key])}`, color: col(apt[s.key]), fontFamily: 'ui-monospace, monospace' }}>
                            {lang === 'en' ? s.en.slice(0, 1) : s.zh}{apt[s.key]}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <div style={{ marginTop: 3, fontSize: '0.7rem', color: ap?.misread ? '#c79a6a' : '#6a7682', fontStyle: 'italic' }}>
                        {ap?.misread ? t('識者走眼 — 資質難辨', 'Misjudged — aptitude unclear') : t('資質未明 — 待名士品評', 'Unknown — needs a 名士’s appraisal')}
                      </div>
                    )}
                    {/* 月旦評 定評 — accurate verdicts read as a permanent epithet. */}
                    {accurate && (
                      <div style={{ marginTop: 4, fontSize: '0.66rem', color: '#caa86a', fontStyle: 'italic' }}
                        title={t(`品第 ${GRADE_LABEL[ap!.grade].zh}`, `${GRADE_LABEL[ap!.grade].en} grade`)}>
                        「{lang === 'en' ? ap!.en : ap!.zh}」<span style={{ color: '#7a8893', fontStyle: 'normal' }}> · {lang === 'en' ? GRADE_LABEL[ap!.grade].en : GRADE_LABEL[ap!.grade].zh}</span>
                      </div>
                    )}
                    {canAppraiseNow && (
                      <button
                        onClick={doAppraise}
                        style={{ marginTop: 4, fontSize: '0.7rem', padding: '0.1rem 0.5rem', borderRadius: 'var(--tkm-radius-xs)', cursor: 'pointer', background: '#1a2230', border: '1px solid #4a5a48', color: '#cfe0ff', fontFamily: 'var(--tkm-font-body)' }}
                      >🔍 {ap?.misread ? t('另請高明', 'Re-appraise') : t('遣名士品評', 'Appraise (月旦評)')}</button>
                    )}
                    {appraiseMsg && (
                      <div style={{ marginTop: 3, fontSize: '0.7rem', color: '#9ed68a', lineHeight: 1.5 }}>{appraiseMsg}</div>
                    )}
                  </div>
                );
              })()}
              {(() => {
                // 年歲 — life-stage band; past 遲暮 the officer's martial edge wanes.
                const band = ageBand(age);
                return (
                  <div title={t(`${age} 歲 · ${band.zh}${band.declining ? '（武力漸衰）' : ''}`, `Age ${age} · ${band.en}${band.declining ? ' (waning)' : ''}`)}>
                    <span style={{ fontSize: '0.72rem', color: '#7a8893', letterSpacing: '0.05rem' }}>{t('年歲', 'Age')} </span>
                    <span style={{
                      display: 'inline-block', padding: '0.1rem 0.5rem', borderRadius: 'var(--tkm-radius-xs)',
                      background: '#10161e', border: `1px solid ${band.color}`, color: band.color, fontSize: '0.85rem',
                    }}>
                      {age} · {lang === 'en' ? band.en : band.zh}
                    </span>
                  </div>
                );
              })()}
              {(() => {
                // 壽算 — yearly death risk, computed exactly as the winter roll
                // does (base × 性格 hardiness × 壽命長短). Surfaced so death stops
                // being a silent surprise. Hidden when negligible (<5%).
                const risk = annualDeathChance(officer, storeYear, lifespanMode ?? 'historical', lifespanLength ?? 'historical');
                if (risk < 0.05) return null;
                const pct = Math.round(risk * 100);
                const { zh, en, color } = risk >= 0.5 ? { zh: '將盡', en: 'Failing', color: '#b8442e' }
                  : risk >= 0.25 ? { zh: '遲暮', en: 'Frail', color: '#d88a6a' }
                  : { zh: '漸衰', en: 'Aging', color: '#caa15a' };
                return (
                  <div title={t(`今冬殞落機率約 ${pct}%`, `~${pct}% chance to pass this winter`)} style={{ marginTop: '0.2rem' }}>
                    <span style={{ fontSize: '0.72rem', color: '#7a8893', letterSpacing: '0.05rem' }}>{t('壽算', 'Mortality')} </span>
                    <span style={{
                      display: 'inline-block', padding: '0.1rem 0.5rem', borderRadius: 'var(--tkm-radius-xs)',
                      background: '#10161e', border: `1px solid ${color}`, color, fontSize: '0.8rem',
                    }}>
                      {lang === 'en' ? en : zh} · {pct}%
                    </span>
                  </div>
                );
              })()}
              {(() => {
                // 寶物品階 — the best gold/silver/bronze rarity the officer carries,
                // shown in the same palette as 品階 so ability and gear read alike.
                const live = allOfficers[officer.id] ?? officer;
                const owned = live.equipment.map((id) => ITEMS_BY_ID[id]).filter(Boolean);
                if (owned.length === 0) return null;
                const order = { gold: 3, silver: 2, bronze: 1 } as const;
                let best = owned[0];
                for (const it of owned) if (order[itemRarity(it)] > order[itemRarity(best)]) best = it;
                const rm = itemRarityMeta(itemRarity(best));
                return (
                  <div title={t(`持有 ${owned.length} 件寶物，最高 ${rm.zh}`, `Carries ${owned.length} item(s), best ${rm.en}`)}>
                    <span style={{ fontSize: '0.72rem', color: '#7a8893', letterSpacing: '0.05rem' }}>{t('寶物', 'Gear')} </span>
                    <span style={{
                      display: 'inline-block', padding: '0.1rem 0.5rem', borderRadius: 'var(--tkm-radius-xs)',
                      background: '#10161e', border: `1px solid ${rm.color}`, color: rm.color,
                      fontSize: '0.85rem', letterSpacing: '0.08rem',
                    }}>
                      {lang === 'en' ? rm.en : rm.zh}
                      {owned.length > 1 && <span style={{ marginLeft: 4, fontSize: '0.7rem', opacity: 0.8 }}>×{owned.length}</span>}
                    </span>
                  </div>
                );
              })()}
              {officer.doctrine && (() => {
                const d = DOCTRINE_DEFS[officer.doctrine];
                return (
                  <div>
                    <span style={{ fontSize: '0.72rem', color: '#7a8893', letterSpacing: '0.05rem' }}>{t('主義', 'Doctrine')} </span>
                    <span
                      title={`${d.zh} · ${d.en}`}
                      style={{
                        background: '#10161e', border: `1px solid ${d.color}`, color: d.color,
                        padding: '0.2rem 0.55rem', fontSize: '0.8rem', letterSpacing: '0.1rem',
                        }}
                    >
                      {lang === 'en' ? d.en : d.zh}
                      {lang === 'both' && <> <span style={{ fontSize: '0.72rem', color: '#7a8893', fontStyle: 'italic' }}>{d.en}</span></>}
                    </span>
                  </div>
                );
              })()}
              {(() => {
                const wt = deriveWeaponType(officer);
                const w = WEAPON_TYPE_DEFS[wt];
                return (
                  <div>
                    <span style={{ fontSize: '0.72rem', color: '#7a8893', letterSpacing: '0.05rem' }}>{t('兵裝', 'Weapon')} </span>
                    <span
                      title={`${w.zh} · ${w.en}`}
                      style={{
                        background: '#10161e', border: `1px solid ${w.color}`, color: w.color,
                        padding: '0.2rem 0.55rem', fontSize: '0.8rem', letterSpacing: '0.1rem',
                        }}
                    >
                      {lang === 'en' ? w.en : w.zh}
                      {lang === 'both' && <> <span style={{ fontSize: '0.72rem', color: '#7a8893', fontStyle: 'italic' }}>{w.en}</span></>}
                    </span>
                  </div>
                );
              })()}
            </div>

            {(() => {
              // ── 品階威儀 / 練兵 / 突破 / 可習之技 — the progression controls ──
              const live = allOfficers[officer.id] ?? officer;
              const STAT_META: Array<{ key: keyof OfficerStats; zh: string; en: string }> = [
                { key: 'leadership', zh: '統', en: 'LDR' },
                { key: 'war', zh: '武', en: 'WAR' },
                { key: 'intelligence', zh: '智', en: 'INT' },
                { key: 'politics', zh: '政', en: 'POL' },
                { key: 'charisma', zh: '魅', en: 'CHA' },
              ];
              const gp = gradeCombatBonus(live);
              const passivePct = Math.round((gp.powerMul - 1) * 100);
              const gate = canBreakthrough(live);
              const count = live.breakthroughs ?? 0;
              const cost = breakthroughCost(live);
              const ironCost = breakthroughIronCost(live);
              const cityGold = city?.gold ?? 0;
              const cityIron = city?.iron ?? 0;
              const canBT = cityGold >= cost && cityIron >= ironCost;
              const pool = learnableSkills(live);
              const labelStyle = { fontSize: '0.72rem', color: '#7a8893', letterSpacing: '0.05rem' } as const;
              return (
                <div style={{ marginTop: '0.7rem', display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                  {/* 品階威儀 — what the grade actually does in a fight */}
                  {passivePct > 0 && (
                    <div style={{ fontSize: '0.7rem', color: '#9aa7b3' }}>
                      <span style={labelStyle}>{t('品階威儀', 'Grade aura')} </span>
                      {t(
                        `戰力 +${passivePct}%　士氣 +${gp.morale}　單挑 +${gp.duelBonus}　氣力 +${gp.duelStamina}　威儀減傷 ${Math.round(gp.damageResist * 100)}%　歷練 +${Math.round((growthPowerMul(live) - 1) * 100)}%`,
                        `Power +${passivePct}%, Morale +${gp.morale}, Duel +${gp.duelBonus}, Stamina +${gp.duelStamina}, Resist ${Math.round(gp.damageResist * 100)}%, Seasoning +${Math.round((growthPowerMul(live) - 1) * 100)}%`,
                      )}
                    </div>
                  )}

                  {/* 失威 — disgrace suppresses 品階招牌 until recovered */}
                  {(live.disgrace ?? 0) > 0 && (
                    <div style={{ fontSize: '0.7rem', color: '#d08a6a' }}>
                      <span style={labelStyle}>{t('失威', 'Disgraced')} </span>
                      {t(`名望受挫,品階招牌暫失 ${live.disgrace} 季`, `Aura shaken — signature perks suppressed for ${live.disgrace} season(s)`)}
                    </div>
                  )}

                  {/* 練兵/拜師 — steer growth (player officers only) */}
                  {isMine && (
                    <div>
                      <span style={labelStyle}>{t('練兵方向', 'Training focus')} </span>
                      <span style={{ display: 'inline-flex', flexWrap: 'wrap', gap: '0.3rem', marginLeft: '0.3rem', verticalAlign: 'middle' }}>
                        {STAT_META.map((s) => {
                          const on = live.trainingFocus === s.key;
                          return (
                            <button
                              key={s.key}
                              onClick={() => setTrainingFocusFn(officer.id, on ? null : s.key)}
                              title={t('成長偏向此能力', 'Bias level-up growth toward this stat')}
                              style={{
                                cursor: 'pointer', padding: '0.1rem 0.45rem', borderRadius: 'var(--tkm-radius-xs)',
                                background: on ? '#2a2010' : '#10161e',
                                border: `1px solid ${on ? '#e6c473' : '#26323e'}`,
                                color: on ? '#e6c473' : '#8a97a3', fontSize: '0.78rem',
                              }}
                            >
                              {lang === 'en' ? s.en : s.zh}
                            </button>
                          );
                        })}
                      </span>
                    </div>
                  )}

                  {/* 拜師 — apprentice to a master (same city); 特訓 — drill this officer */}
                  {isMine && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span style={labelStyle}>{t('師承', 'Mentor')}</span>
                      {(() => {
                        const masters = Object.values(allOfficers).filter((m) =>
                          m.id !== officer.id && m.forceId === officer.forceId &&
                          m.locationCityId != null && m.locationCityId === officer.locationCityId &&
                          (m.status === 'idle' || m.status === 'active'));
                        return (
                          <select
                            value={live.mentorId ?? ''}
                            onChange={(e) => assignMentorFn(officer.id, e.target.value || null)}
                            title={t('同城拜師:成長偏向師父所長,並可習其衣缽', 'Apprentice (same city): grow toward the master’s strength and inherit their craft')}
                            style={{ background: '#10161e', border: '1px solid #26323e', color: '#cdd6df', fontSize: '0.74rem', borderRadius: 'var(--tkm-radius-xs)', padding: '0.1rem 0.3rem', maxWidth: 130 }}
                          >
                            <option value="">{t('（無）', '(none)')}</option>
                            {masters.map((m) => (
                              <option key={m.id} value={m.id}>{lang === 'en' ? m.name.en : m.name.zh}</option>
                            ))}
                          </select>
                        );
                      })()}
                      {city?.ownerForceId === playerForceId && officer.locationCityId && (officer.status === 'idle' || officer.status === 'active') && (
                        <button
                          onClick={() => {
                            const r = issueCommandFn(officer.locationCityId!, 'special-training', officer.id);
                            setProgressMsg(r.ok ? t('特訓已下令', 'Training ordered') : t('無法特訓(金/狀態)', 'Cannot train (gold/status)'));
                          }}
                          title={t('特訓 · 400 黃金 · 苦練一季,可習技/性格/潛能', 'Special Training · 400g · a hard season; may yield skill/trait/potential')}
                          style={{ cursor: 'pointer', padding: '0.12rem 0.55rem', borderRadius: 'var(--tkm-radius-xs)', background: 'linear-gradient(180deg,#1a3a2a,#102018)', border: '1px solid #9ed8b8', color: '#bfeacf', fontSize: '0.76rem' }}
                        >
                          {t('特訓', 'Train')}
                        </button>
                      )}
                    </div>
                  )}

                  {/* 轉生/突破 — renewed growth past the XP ceiling */}
                  {isMine && (count > 0 || gate.ok || gate.reason === 'capped') && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span style={labelStyle}>{t('突破', 'Breakthrough')}</span>
                      {count > 0 && (
                        <span title={t(`已突破 ${count}/${MAX_BREAKTHROUGHS} 重`, `${count}/${MAX_BREAKTHROUGHS} breakthroughs`)} style={{ color: '#e6c473', fontSize: '0.82rem', letterSpacing: '0.1rem' }}>
                          {'★'.repeat(count)}{'☆'.repeat(Math.max(0, MAX_BREAKTHROUGHS - count))}
                          {(() => { const bt = breakthroughTitle(count); return bt ? <span style={{ marginLeft: 5, fontSize: '0.7rem', color: '#8ee8ff' }}>{lang === 'en' ? bt.en : bt.zh}</span> : null; })()}
                        </span>
                      )}
                      {gate.ok ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '0.66rem', color: canBT ? '#9aa7b3' : '#a86a6a' }}>
                            {t(`擇道突破 · ${cost}金 ${ironCost}鐵`, `Choose a path · ${cost}g ${ironCost} iron`)}
                            {!canBT && t(`(本城 ${cityGold}金/${cityIron}鐵)`, ` (city ${cityGold}g/${cityIron} iron)`)}
                          </span>
                          {(Object.keys(BREAKTHROUGH_PATHS) as Array<keyof typeof BREAKTHROUGH_PATHS>).map((pk) => {
                            const p = BREAKTHROUGH_PATHS[pk];
                            return (
                              <button
                                key={pk}
                                onClick={() => {
                                  const res = breakthroughOfficerFn(officer.id, pk);
                                  setProgressMsg(res.ok
                                    ? (res.notes?.[0] ?? t(`突破·${p.zh}成功!`, `${p.en} breakthrough!`))
                                    : res.reason === 'no-gold' ? t('府庫黃金不足', 'Not enough gold')
                                      : res.reason === 'no-iron' ? t('府庫鐵料不足', 'Not enough iron')
                                        : t('無法突破', 'Cannot break through'));
                                }}
                                disabled={!canBT}
                                title={t(`${p.zh} — 偏 ${p.stats.map((s) => STAT_META.find((m) => m.key === s)?.zh ?? s).join('/')}`, `${p.en} — favours ${p.stats.join('/')}`)}
                                style={{
                                  cursor: canBT ? 'pointer' : 'not-allowed', padding: '0.1rem 0.4rem', borderRadius: 'var(--tkm-radius-xs)',
                                  background: canBT ? 'linear-gradient(180deg,#4a3a1a,#2a2010)' : '#10161e',
                                  border: '1px solid #e6c473', color: canBT ? '#f0d890' : '#6a7480', fontSize: '0.74rem',
                                }}
                              >
                                {lang === 'en' ? p.en : p.zh}
                              </button>
                            );
                          })}
                        </span>
                      ) : gate.reason === 'capped' ? (
                        <span style={{ fontSize: '0.72rem', color: '#7a8893' }}>{t('已臻極限', 'At the limit')}</span>
                      ) : null}
                      {progressMsg && <span style={{ fontSize: '0.72rem', color: '#9ed8b8' }}>{progressMsg}</span>}
                    </div>
                  )}

                  {/* 可習之技 — skills this officer could still grow into */}
                  {pool.length > 0 && (
                    <div>
                      <span style={labelStyle}>{t('可習之技', 'May yet learn')} </span>
                      <span style={{ display: 'inline-flex', flexWrap: 'wrap', gap: '0.3rem', marginLeft: '0.3rem', verticalAlign: 'middle' }}>
                        {pool.slice(0, 8).map((sk) => (
                          <span key={sk.id} style={{
                            padding: '0.08rem 0.4rem', borderRadius: 'var(--tkm-radius-xs)', background: '#10161e',
                            border: '1px dashed #3a4a5a', color: '#8a97a3', fontSize: '0.72rem',
                          }}>
                            {lang === 'en' ? sk.name.en : sk.name.zh}
                          </span>
                        ))}
                        {pool.length > 8 && <span style={{ fontSize: '0.7rem', color: '#7a8893' }}>+{pool.length - 8}</span>}
                      </span>
                    </div>
                  )}
                </div>
              );
            })()}
          </section>
        )}

        {officer.formations && officer.formations.length > 0 && (
          <section className={styles.statsSection}>
            <h3 className={styles.sectionTitle}>{t('陣形', 'Formations')}</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
              {officer.formations.map((fid) => {
                const f = FORMATION_DEFS[fid];
                const fdef = FORMATIONS_BY_ID[fid];
                const fullDesc =
                  (lang === 'zh' && fdef?.descriptionZh) ||
                  fdef?.description ||
                  `${f.zh} · ${f.en}`;
                return (
                  <span
                    key={fid}
                    title={fullDesc}
                    style={{
                      background: '#10161e', border: '1px solid #88b7e8', color: '#88b7e8',
                      padding: '0.3rem 0.55rem', fontSize: '0.78rem', letterSpacing: '0.1rem',
                    }}
                  >
                    {lang === 'en' ? f.en : f.zh}
                    {lang === 'both' && <> <span style={{ fontSize: '0.72rem', color: '#5a7090', fontStyle: 'italic' }}>{f.en}</span></>}
                  </span>
                );
              })}
            </div>
          </section>
        )}

        {officer.tactics && officer.tactics.length > 0 && (
          <section className={styles.statsSection}>
            <h3 className={styles.sectionTitle}>{t('戰法', 'Tactics')}</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
              {officer.tactics.map((tid) => {
                const tac = TACTIC_DEFS[tid];
                const b = tacticBonus(tid);
                const bonuses = [
                  b.war         && `武 +${b.war}`,
                  b.leadership  && `統 +${b.leadership}`,
                  b.intelligence&& `知 +${b.intelligence}`,
                  b.politics    && `政 +${b.politics}`,
                  b.charisma    && `魅 +${b.charisma}`,
                ].filter(Boolean).join(' · ');
                const sig = isTacticSignature(tid) ? '★ ' : '';
                const desc = TACTIC_DESC[tid] ?? `${tac.zh} · ${tac.en}`;
                const tooltip = bonuses
                  ? `${sig}${desc}\n${bonuses}`
                  : `${sig}${desc}`;
                return (
                  <span
                    key={tid}
                    title={tooltip}
                    style={{
                      background: '#10161e', border: '1px solid #b8442e', color: '#b8442e',
                      padding: '0.3rem 0.55rem', fontSize: '0.78rem', letterSpacing: '0.1rem',
                    }}
                  >
                    {isTacticSignature(tid) && <span style={{ color: '#e6c473', marginRight: 2 }}>★</span>}
                    {lang === 'en' ? tac.en : tac.zh}
                    {lang === 'both' && <> <span style={{ fontSize: '0.72rem', color: '#8a4530', fontStyle: 'italic' }}>{tac.en}</span></>}
                  </span>
                );
              })}
            </div>
            {/* N2 — Combo progress: which combos this officer has fully / partially completed */}
            {(() => {
              const ownTactics = new Set((officer.tactics ?? []) as string[]);
              const combos = TACTIC_COMBOS
                .map((c) => ({
                  combo: c,
                  have: c.tactics.filter((t) => ownTactics.has(t)),
                  miss: c.tactics.filter((t) => !ownTactics.has(t)),
                }))
                .filter((r) => r.have.length > 0);
              if (combos.length === 0) return null;
              return (
                <div style={{ marginTop: '0.5rem', fontSize: '0.72rem', color: '#7a8893' }}>
                  <div style={{ color: '#e6c473', marginBottom: '0.2rem', letterSpacing: '0.05rem' }}>
                    {t('連環戰法進度', 'Combo Progress')}
                  </div>
                  {combos.map(({ combo, have, miss }) => (
                    <div key={combo.id} style={{ marginBottom: '0.2rem' }}>
                      <span style={{ color: miss.length === 0 ? '#7ed68a' : '#aab6c0' }}>
                        {miss.length === 0 ? '✓' : '◐'} {lang === 'en' ? combo.nameEn : combo.nameZh}
                        {' '}({have.length}/{combo.tactics.length})
                      </span>
                      {miss.length > 0 && (
                        <span style={{ color: '#7a8893', marginLeft: '0.4rem' }}>
                          {t('缺', 'need')}: {miss.map((m) => TACTIC_DEFS[m as keyof typeof TACTIC_DEFS]?.zh ?? m).join('、')}
                        </span>
                      )}
                      {miss.length === 0 && (
                        <span style={{ color: '#7ed68a', marginLeft: '0.4rem' }}>
                          {t(`戰力 ×${combo.powerMul.toFixed(2)}`, `power ×${combo.powerMul.toFixed(2)}`)}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              );
            })()}
          </section>
        )}

        {((officer.policies && officer.policies.length > 0) || activeTraining) && (
          <section className={styles.statsSection}>
            <h3 className={styles.sectionTitle}>{t('政策', 'Policies')}</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
              {(officer.policies ?? []).map((pid) => {
                const p = POLICY_DEFS[pid];
                const desc = POLICY_DESC[pid] ?? `${p.zh} · ${p.en}`;
                return (
                  <span
                    key={pid}
                    title={desc}
                    style={{
                      background: '#10161e', border: '1px solid #7a9a5a', color: '#7a9a5a',
                      padding: '0.3rem 0.55rem', fontSize: '0.78rem', letterSpacing: '0.1rem',
                    }}
                  >
                    {lang === 'en' ? p.en : p.zh}
                    {lang === 'both' && <> <span style={{ fontSize: '0.72rem', color: '#5a7a4a', fontStyle: 'italic' }}>{p.en}</span></>}
                  </span>
                );
              })}
              {activeTraining && (() => {
                const p = POLICY_DEFS[activeTraining.policyId];
                // 二段確認 — first tap arms the button (turns red, shows the
                // refund), second tap within 3s cancels. Replaces the jarring
                // OS window.confirm (ugly native sheet on iOS).
                const refund = Math.floor(activeTraining.goldSpent / 2);
                const handleCancel = (e: React.MouseEvent) => {
                  e.stopPropagation();
                  if (!isMine) return;
                  if (!confirmCancelTraining) {
                    setConfirmCancelTraining(true);
                    window.setTimeout(() => setConfirmCancelTraining(false), 3000);
                    return;
                  }
                  setConfirmCancelTraining(false);
                  cancelTrainingFn(officer.id);
                };
                const trainCity = activeTraining ? storeCities[activeTraining.cityId] : null;
                const mentor = activeTraining.mentorOfficerId
                  ? allOfficers[activeTraining.mentorOfficerId]
                  : null;
                const bd = trainCity
                  ? durationBreakdown(officer, trainCity, activeTraining.policyId, buildings)
                  : null;
                const formulaLines: string[] = [];
                if (bd) {
                  const tierZh = bd.tier === 1 ? '基礎' : bd.tier === 2 ? '進階' : '高階';
                  const tierEn = bd.tier === 1 ? 'Base' : bd.tier === 2 ? 'Adv' : 'High';
                  if (mentor) {
                    formulaLines.push(t(
                      `師徒制 — 由 ${mentor.name.zh} 傳授`,
                      `Mentor mode — taught by ${mentor.name.en}`,
                    ));
                  }
                  const parts: string[] = [];
                  parts.push(t(`${tierZh}(${bd.tier})`, `${tierEn}(${bd.tier})`));
                  if (bd.academyModifier) parts.push(t(`書院 lv${bd.academyLevel}(+1)`, `Acad lv${bd.academyLevel}(+1)`));
                  if (bd.intelligenceBonus) parts.push(t('知力≥80(−1)', 'Int≥80(−1)'));
                  if (bd.studiousBonus) parts.push(t('博學(−1)', 'Scholar(−1)'));
                  if (bd.lazyPenalty) parts.push(t('懶惰(+1)', 'Lazy(+1)'));
                  if (bd.bookSpeedup > 0) parts.push(t(`兵書(−${bd.bookSpeedup})`, `Books(−${bd.bookSpeedup})`));
                  if (mentor) parts.push(t('師徒(+1)', 'Mentor(+1)'));
                  if (mentor && isParentMentor(mentor, officer, family)) parts.push(t('親屬(−1)', 'Family(−1)'));
                  formulaLines.push(t(
                    `公式:${parts.join(' ')} = ${activeTraining.seasonsLeft} 季 (起算)`,
                    `Formula: ${parts.join(' ')} = ${activeTraining.seasonsLeft} season(s) (orig)`,
                  ));
                }
                const tooltipBody = [
                  t(
                    `培訓中:${p?.zh ?? activeTraining.policyId} — 剩餘 ${activeTraining.seasonsLeft} 季`,
                    `Training: ${p?.en ?? activeTraining.policyId} — ${activeTraining.seasonsLeft} season(s) left`,
                  ),
                  ...formulaLines,
                  isMine ? t('按 × 退訂 (退還一半金錢)', 'Click × to cancel (50% refund)') : '',
                ].filter(Boolean).join('\n');
                return (
                  <span
                    title={tooltipBody}
                    style={{
                      background: 'rgba(136, 183, 232, 0.12)',
                      border: '1px dashed #88b7e8', color: '#88b7e8',
                      padding: '0.3rem 0.55rem', fontSize: '0.78rem', letterSpacing: '0.1rem',
                      fontStyle: 'italic',
                      display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                    }}
                  >
                    ⏳ {lang === 'en' ? p?.en : p?.zh} ({activeTraining.seasonsLeft})
                    {isMine && (
                      <button
                        type="button"
                        onClick={handleCancel}
                        title={confirmCancelTraining
                          ? t(`再點一次確認 — 退還 ${refund} 金`, `Tap again to confirm — refund ${refund} gold`)
                          : t('取消培訓 (退還一半金錢)', 'Cancel training (50% refund)')}
                        style={{
                          background: confirmCancelTraining ? 'rgba(184,68,46,0.25)' : 'transparent',
                          border: confirmCancelTraining ? '1px solid #b8442e' : 'none',
                          borderRadius: 'var(--tkm-radius-xs)',
                          color: confirmCancelTraining ? '#e0907a' : '#88b7e8',
                          cursor: 'pointer',
                          padding: '0 0.3rem',
                          fontSize: confirmCancelTraining ? '0.72rem' : '0.95rem',
                          lineHeight: 1.4,
                          fontFamily: 'inherit',
                        }}
                      >
                        {confirmCancelTraining ? t(`退訂 +${refund}金?`, `Cancel +${refund}g?`) : '×'}
                      </button>
                    )}
                  </span>
                );
              })()}
            </div>
          </section>
        )}

        {((officer.traits && officer.traits.length > 0) || officer.skills.length > 0) && (
          <section className={styles.statsSection}>
            <h3 className={styles.sectionTitle}>{t('個性', 'Individualities')}</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
              {officer.skills
                .map((id) => SKILLS_BY_ID[id])
                .filter((s): s is Skill => !!s)
                .map((s) => {
                  // Skill border + text color by category
                  const color =
                    s.category === 'combat'  ? '#b8442e'
                    : s.category === 'command' ? '#e6c473'
                    : s.category === 'wisdom'  ? '#88b7e8'
                    : s.category === 'civil'   ? '#b8c87a'
                    : '#c178c7';
                  const desc = lang === 'zh' && s.descriptionZh ? s.descriptionZh : s.description;
                  return (
                    <span
                      key={`skill-${s.id}`}
                      title={desc}
                      style={{
                        background: '#10161e', border: `1px solid ${color}`, color,
                        padding: '0.3rem 0.55rem', fontSize: '0.78rem', letterSpacing: '0.1rem',
                        }}
                    >
                      {lang === 'en' ? s.name.en : s.name.zh}
                      {/* 技能等級 — 特訓精研出的 Ⅱ/Ⅲ 熟練徽記 (skillMastery.ts) */}
                      {skillLevelBadge(officer, s.id) && (
                        <span style={{ marginLeft: 3, color: '#ffd66e', fontWeight: 700 }} title={t('特訓精研 — 效果放大', 'Refined by special training')}>
                          {skillLevelBadge(officer, s.id)}
                        </span>
                      )}
                      {lang === 'both' && <> <span style={{ fontSize: '0.72rem', color: '#7a8893', fontStyle: 'italic' }}>{s.name.en}</span></>}
                    </span>
                  );
                })}
              {(officer.traits ?? [])
                .map((tid) => TRAIT_DEFS_BY_ID[tid])
                .filter((tr): tr is import('../../game/types').PersonalityTraitDef => !!tr)
                .map((tr) => {
                  const desc = lang === 'zh' && tr.descriptionZh ? tr.descriptionZh : tr.description;
                  // P5 — append actual mechanical effects to the tooltip. A trait
                  // no system reads is flagged "(風味)" so it doesn't masquerade
                  // as having a hidden effect.
                  const effects = traitMechanicalEffects(tr.id);
                  const effectLines = effects.length > 0
                    ? '\n\n' + effects.map((e) => `• ${lang === 'en' ? e.en : e.zh}`).join('\n')
                    : isFlavorOnlyTrait(tr.id)
                      ? '\n\n' + (lang === 'en' ? '(flavor only — no mechanical effect)' : '(風味性格 · 無機制效果)')
                      : '';
                  return (
                    <span
                      key={`trait-${tr.id}`}
                      title={desc + effectLines}
                      style={{
                        background: '#10161e', border: `1px solid ${tr.color}`, color: tr.color,
                        padding: '0.3rem 0.55rem', fontSize: '0.78rem', letterSpacing: '0.1rem',
                        }}
                    >
                      {lang === 'en' ? tr.name.en : tr.name.zh}
                      {lang === 'both' && <> <span style={{ fontSize: '0.72rem', color: '#7a8893', fontStyle: 'italic' }}>{tr.name.en}</span></>}
                    </span>
                  );
                })}
            </div>
          </section>
        )}

        <FamilyTreeSection officerId={officer.id} officersOverride={officersOverride} />
        <HeirsAndClanSection officerId={officer.id} />
        <RelationshipsSection officerId={officer.id} officersOverride={officersOverride} />

        {officerDeeds && (officerDeeds.titles?.length ?? 0) + officerDeeds.killsTroops + officerDeeds.duelsWon + officerDeeds.citiesTaken + officerDeeds.espionageSuccess + officerDeeds.civicWorks + officerDeeds.battlesWon > 0 && (
          <section className={styles.statsSection}>
            <h3 className={styles.sectionTitle}>
              {t('武功', 'Deeds')}
            </h3>
            {(officerDeeds.titles?.length ?? 0) > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '0.5rem' }}>
                {(officerDeeds.titles ?? []).map((tid) => {
                  const tDef = DEED_TITLES_BY_ID[tid];
                  if (!tDef) return null;
                  return (
                    <span key={tid} title={lang === 'zh' ? tDef.name.zh : tDef.name.en}
                      style={{
                        background: 'linear-gradient(135deg,#1e2832,#1a1208)',
                        border: '1px solid #e6c473', color: '#e6c473',
                        padding: '0.3rem 0.6rem', fontSize: '0.78rem', letterSpacing: '0.1rem',
                      }}
                    >
                      {lang === 'en' ? tDef.name.en : tDef.name.zh}
                      {lang === 'both' && <> <span style={{ fontSize: '0.72rem', color: '#7a8893', fontStyle: 'italic' }}>{tDef.name.en}</span></>}
                    </span>
                  );
                })}
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(110px,1fr))', gap: '0.4rem', fontSize: '0.78rem' }}>
              {([
                ['killsTroops',       t('殲敵', 'Kills')],
                ['duelsWon',          t('一騎', 'Duels')],
                ['captured',          t('生擒', 'Captures')],
                ['citiesTaken',       t('攻陷', 'Cities')],
                ['espionageSuccess',  t('謀略', 'Plots')],
                ['civicWorks',        t('内政', 'Civil')],
                ['battlesWon',        t('勝戰', 'Wins')],
                ['trainingsCompleted',t('育成', 'Training')],
                ['childrenSired',     t('子嗣', 'Heirs')],
              ] as const).map(([k, label]) => {
                const v = (officerDeeds[k as keyof typeof officerDeeds] as number) ?? 0;
                if (v === 0) return null;
                return (
                  <div key={k} style={{ color: '#aab6c0' }}>
                    <span style={{ color: '#7a8893', fontSize: '0.7rem' }}>{label}</span>{' '}
                    <span style={{ fontFamily: 'ui-monospace, monospace' }}>{v.toLocaleString()}</span>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {officer.equipment.length > 0 && (() => {
          // Aggregate all item stat bonuses.
          const total: Record<string, number> = {};
          for (const id of officer.equipment) {
            const item = liveItemById(id);
            if (!item) continue;
            for (const [k, v] of Object.entries(item.effects)) {
              total[k] = (total[k] ?? 0) + (v as number);
            }
          }
          const totalStr = Object.entries(total)
            .filter(([, v]) => v > 0)
            .map(([k, v]) => `${k.slice(0, 3).toUpperCase()} +${v}`)
            .join(' · ');
          return (
            <section className={styles.statsSection}>
              <h3 className={styles.sectionTitle}>
                {t('持有', 'Equipment')} ({officer.equipment.length})
                {totalStr && (
                  <span style={{ marginLeft: '0.8rem', fontSize: '0.75rem', color: '#e6c473', letterSpacing: '0.1rem' }}>
                    {t('合計', 'Total')}: {totalStr}
                  </span>
                )}
              </h3>
              {(() => {
                // 神兵譜 — full legendary sets the officer has assembled.
                const sets = activeItemSets(officer);
                if (sets.length === 0) return null;
                return (
                  <div style={{ marginBottom: '0.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.4rem', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.72rem', color: '#7a8893' }}>{t('神兵譜', 'Set')}</span>
                    {sets.map((s) => (
                      <span key={s.id} title={t(`套裝共鳴 — 戰力 +${Math.round(s.powerBonus * 100)}%`, `Set resonance — power +${Math.round(s.powerBonus * 100)}%`)}
                        style={{ padding: '0.1rem 0.5rem', borderRadius: 'var(--tkm-radius-xs)', background: '#10161e', border: `1px solid ${s.color}`, color: s.color, fontSize: '0.78rem' }}>
                        {lang === 'en' ? s.name.en : s.name.zh} <span style={{ fontSize: '0.66rem', opacity: 0.85 }}>+{Math.round(s.powerBonus * 100)}%</span>
                      </span>
                    ))}
                  </div>
                );
              })()}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                {officer.equipment.map((id) => {
                  const item = liveItemById(id);
                  if (!item) return null;
                  const plus = itemRefinements[id] ?? 0;
                  const stars = itemBreakthroughs[id] ?? 0;
                  const gems = itemGems[id] ?? [];
                  // Socket count off the BASE item (matches the store's socketGem
                  // guard) — liveItem's refine/突破 can promote 品階 and would
                  // otherwise show phantom sockets the store rejects.
                  const maxSockets = socketsFor(ITEMS_BY_ID[id] ?? item);
                  const kindColor =
                    item.kind === 'weapon'   ? '#b8442e'
                    : item.kind === 'armor'    ? '#6a8fb0'
                    : item.kind === 'horse'    ? '#c9a64e'
                    : item.kind === 'treasure' ? '#e6c473'
                    : item.kind === 'book'     ? '#3a7dd9'
                    : '#364654';
                  const desc = lang === 'zh' && item.descriptionZh ? item.descriptionZh : item.description;
                  const effects = Object.entries(item.effects)
                    .map(([stat, val]) => `${stat.slice(0, 3).toUpperCase()} +${val}`)
                    .join(' · ');
                  const grantSummary = item.grants ? Object.entries(item.grants)
                    .map(([k, v]) => `+${k}:${v}`).join(' · ') : '';
                  // Rarity reads off the *live* item, so a refined piece shows its promoted tier.
                  const rm = itemRarityMeta(itemRarity(item));
                  const atMax = plus >= REFINE_MAX;
                  const cost = atMax ? 0 : refineCost(item, plus);
                  return (
                    <span
                      key={id}
                      title={`【${lang === 'en' ? rm.en : rm.zh}${plus ? ` +${plus}` : ''}】${desc}\n${effects}${grantSummary ? '\n' + grantSummary : ''}`}
                      style={{
                        background: '#10161e', border: `1px solid ${kindColor}`, color: kindColor,
                        padding: '0.3rem 0.55rem', fontSize: '0.78rem', letterSpacing: '0.1rem',
                        display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                      }}
                    >
                      <span title={lang === 'en' ? rm.en : rm.zh} style={{ width: 7, height: 7, borderRadius: '50%', background: rm.color, flexShrink: 0 }} />
                      <span>
                        {lang === 'en' ? item.name.en : item.name.zh}
                        {plus > 0 && <span style={{ marginLeft: '0.25rem', color: '#e6c473', fontWeight: 600 }}>+{plus}</span>}
                        {stars > 0 && <span style={{ marginLeft: '0.2rem', color: '#ff9f5a', fontWeight: 600 }}>{'★'.repeat(stars)}</span>}
                        {/* 名器威名 — a storied weapon's earned title (飲血/百戰/名器) */}
                        {(() => {
                          const lore = itemLoreLevel(id);
                          const lt = itemLoreTitle(lore);
                          return lt ? <span title={t(`名器威名 · 歷 ${lore} 戰`, `${lore} battles carried`)} style={{ marginLeft: '0.25rem', color: '#8ee8ff', fontSize: '0.7rem' }}>〈{lang === 'en' ? lt.en : lt.zh}〉</span> : null;
                        })()}
                        {lang === 'both' && <> <span style={{ fontSize: '0.72rem', color: '#7a8893', fontStyle: 'italic' }}>{item.name.en}</span></>}
                      </span>
                      {/* 鑲嵌 — socketed gem dots */}
                      {gems.map((gid, gi) => {
                        const gem = GEMS_BY_ID[gid];
                        return gem ? (
                          <span key={gi} title={`${lang === 'en' ? gem.name.en : gem.name.zh}${isPlayerOfficer ? t('（點擊卸下）', ' (click to remove)') : ''}`}
                            onClick={isPlayerOfficer ? () => unsocketGemFn(id, gi) : undefined}
                            style={{ width: 9, height: 9, borderRadius: 'var(--tkm-radius-xs)', background: gem.color, cursor: isPlayerOfficer ? 'pointer' : 'default', flexShrink: 0, boxShadow: '0 0 3px ' + gem.color }} />
                        ) : null;
                      })}
                      {isPlayerOfficer && !atMax && (
                        <button
                          onClick={() => refineItemFn(id)}
                          title={t(`精煉 +${plus + 1}（${cost} 金，本城金庫支付）`, `Refine to +${plus + 1} (${cost} gold from this city)`)}
                          style={{
                            background: 'none', border: '1px solid #e6c473', borderRadius: 'var(--tkm-radius-xs)', color: '#e6c473',
                            cursor: 'pointer', padding: '0 0.25rem', fontSize: '0.68rem',
                          }}
                        >{t('煉', '⚒')}</button>
                      )}
                      {isPlayerOfficer && atMax && stars < BREAKTHROUGH_MAX && (() => {
                        const bc = itemBreakthroughCost(item, stars);
                        const holdCity = officer.locationCityId ? cities[officer.locationCityId] : null;
                        const hasFoundry = !!holdCity && buildings.some((b) => b.cityId === holdCity.id && b.id === 'foundry');
                        const canBreak = hasFoundry && !!holdCity && holdCity.gold >= bc.gold && (holdCity.iron ?? 0) >= bc.iron;
                        return (
                          <button
                            onClick={() => { if (!canBreak) return; const r = breakthroughItemFn(id); if (!r.ok) alert(gearReason(r.reason)); }}
                            disabled={!canBreak}
                            title={!hasFoundry
                              ? t('突破需鐵工坊', 'Breakthrough needs a foundry city')
                              : t(`突破 ★${stars + 1}（${bc.gold} 金 + ${bc.iron} 鐵）`, `Breakthrough to ★${stars + 1} (${bc.gold} gold + ${bc.iron} iron)`)}
                            style={{
                              background: 'none', border: `1px solid ${canBreak ? '#ff9f5a' : '#5a4636'}`, borderRadius: 'var(--tkm-radius-xs)', color: canBreak ? '#ff9f5a' : '#6a5238',
                              cursor: canBreak ? 'pointer' : 'not-allowed', padding: '0 0.25rem', fontSize: '0.68rem',
                            }}
                          >{t('突', '★')}</button>
                        );
                      })()}
                      {isPlayerOfficer && gems.length < maxSockets && (
                        <select
                          value=""
                          onChange={(e) => { if (e.target.value) { const r = socketGemFn(id, e.target.value); if (!r.ok) alert(gearReason(r.reason)); } }}
                          title={t(`鑲嵌寶石（${gems.length}/${maxSockets} 孔）`, `Socket a gem (${gems.length}/${maxSockets})`)}
                          style={{
                            background: '#10161e', border: '1px solid #6a8fb0', borderRadius: 'var(--tkm-radius-xs)', color: '#9fb0bf',
                            cursor: 'pointer', padding: '0 0.1rem', fontSize: '0.7rem', maxWidth: 26,
                          }}
                        >
                          <option value="">💎</option>
                          {GEMS.map((g) => {
                            const stock = gemStock[g.id] ?? 0;
                            const price = stock > 0 ? t(`庫存${stock}·免費`, `${stock} in stock · free`) : `${g.cost}g`;
                            return <option key={g.id} value={g.id}>{(lang === 'en' ? g.name.en : g.name.zh)} ({price})</option>;
                          })}
                        </select>
                      )}
                      {isPlayerOfficer && item.consumable && (
                        <button
                          onClick={() => {
                            const r = studyManualFn(officer.id, id);
                            if (r.ok) {
                              const msg = (r.notes && r.notes.length) ? r.notes.join('\n') : t('研讀完畢', 'Studied.');
                              window.alert(t(`${item.name.zh} 研讀:\n${msg}`, `Studied ${item.name.en}:\n${msg}`));
                            } else {
                              window.alert(t('無法研讀此書', 'Cannot study this manual'));
                            }
                          }}
                          title={t('研讀此兵書(一次性,讀後即毀)', 'Study this manual (one-time; consumed on use)')}
                          style={{
                            background: 'linear-gradient(180deg,#1a2a3a,#101820)', border: '1px solid #3a7dd9', color: '#9cc6f0',
                            cursor: 'pointer', padding: '0 0.35rem', fontSize: '0.7rem', borderRadius: 'var(--tkm-radius-xs)', marginRight: 4,
                          }}
                        >{t('研讀', 'Study')}</button>
                      )}
                      {isPlayerOfficer && (plus > 0 || stars > 0 || gems.length > 0) && (
                        <button
                          onClick={() => {
                            const r = resetItemGrowthFn(id);
                            if (r.ok) window.alert(t(`已退養「${item.name.zh}」:寶石歸庫,退還 ${r.refund ?? 0} 金`, `Reset ${item.name.en}: gems returned, ${r.refund ?? 0}g refunded`));
                          }}
                          title={t('洗點退養 — 拆精煉/突破/鑲嵌:寶石歸庫、半數金退還(名器威名保留)', 'Respec — strip refine/breakthrough/gems: gems to stock, half gold refunded (名器 renown kept)')}
                          style={{
                            background: 'none', border: 'none', color: '#7a8893',
                            cursor: 'pointer', padding: '0 0.15rem', fontSize: '0.72rem',
                          }}
                        >♻</button>
                      )}
                      {isPlayerOfficer && (
                        <button
                          onClick={() => unequipItemFn(officer.id, id)}
                          title={t('卸下', 'Unequip')}
                          style={{
                            background: 'none', border: 'none', color: '#7a8893',
                            cursor: 'pointer', padding: '0 0.1rem', fontSize: '0.75rem',
                          }}
                        >×</button>
                      )}
                    </span>
                  );
                })}
              </div>
            </section>
          );
        })()}

        <section className={styles.statsSection}>
          <h3 className={styles.sectionTitle}>{t('列傳', 'Biography')}</h3>
          <BiographyBlock officer={officer} />
          <CampaignChronicleBlock officer={officer} officersOverride={officersOverride} />
        </section>

        {officer.deathYear && (
          <p className={styles.footnote}>
            {t('* 歷史卒年。衰老擲骰集中於此日期前後。', '* Historical death year. Aging rolls cluster around this date.')}
          </p>
        )}
        </div>
      </div>
    </div>
  );
}

const REL_KIND_LABEL: Record<string, { zh: string; en: string; color: string }> = {
  'sworn-brothers': { zh: '義兄弟', en: 'Sworn Brothers', color: '#e6c473' },
  'rival':          { zh: '宿敵',   en: 'Rival',          color: '#b8442e' },
  'mentor-student': { zh: '師弟',   en: 'Mentor / Student', color: '#3a7dd9' },
  'master-servant': { zh: '主従',   en: 'Master / Servant', color: '#c9a64e' },
  'romantic':       { zh: '恋人',   en: 'Romantic',         color: '#c178c7' },
  'enemy':          { zh: '私仇',   en: 'Personal Enemy',   color: '#5a2025' },
  // Family kinds (from FamilyRelation type)
  'spouse':         { zh: '配偶',   en: 'Spouse',          color: '#e8a8c8' },
  'parent':         { zh: '父母',   en: 'Parent',          color: '#88b7e8' },
  'child':          { zh: '子嗣',   en: 'Child',           color: '#7ed68a' },
  'sibling':        { zh: '兄弟',   en: 'Sibling',         color: '#c9a64e' },
};

function RelationshipsSection({ officerId, officersOverride }: { officerId: string; officersOverride?: Record<string, Officer> }) {
  const storeOfficers = useGameStore((s) => s.officers);
  const officers = officersOverride ?? storeOfficers;
  const family = useGameStore((s) => s.family);
  const t = useT();
  const lang = useLanguage();
  // R2 — local state for drill-down: clicking a related officer chip
  // opens THEIR detail in a stacked modal.
  const [drillOfficerId, setDrillOfficerId] = useState<string | null>(null);
  // R5 — local collapse state per category. Default expanded.
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const toggleCollapse = (k: string) => {
    setCollapsed((s) => {
      const next = new Set(s);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });
  };
  const rels = OFFICER_RELATIONSHIPS.filter((r) => r.a === officerId || r.b === officerId);
  type FamilyDisplay = { otherId: string; kind: 'spouse' | 'parent' | 'child' | 'sibling'; note: { zh: string; en: string } };
  const seenFamilyKeys = new Set<string>();
  const familyPool = [
    ...family,
    ...FAMILY_LINEAGE.filter((f) => f.officerA === officerId || f.officerB === officerId),
  ].filter((f) => {
    const key = `${f.officerA}|${f.officerB}|${f.kind}`;
    if (seenFamilyKeys.has(key)) return false;
    seenFamilyKeys.add(key);
    return true;
  });
  const familyRels: FamilyDisplay[] = familyPool
    .filter((f) => f.officerA === officerId || f.officerB === officerId)
    .map((f) => {
      const isA = f.officerA === officerId;
      const otherId = isA ? f.officerB : f.officerA;
      let kind: FamilyDisplay['kind'];
      if (f.kind === 'spouse') kind = 'spouse';
      else if (f.kind === 'sibling') kind = 'sibling';
      else kind = isA ? 'child' : 'parent';
      const otherName = officers[otherId]?.name.zh ?? otherId;
      const note = (() => {
        switch (kind) {
          case 'spouse':  return { zh: `結髮 · ${otherName}`,     en: `Spouse of ${otherName}` };
          case 'parent':  return { zh: `${otherName}之父母`,      en: `Parent of ${otherName}` };
          case 'child':   return { zh: `${otherName}之子嗣`,      en: `Child of ${otherName}` };
          case 'sibling': return { zh: `與${otherName}兄弟`,      en: `Sibling of ${otherName}` };
        }
      })();
      return { otherId, kind, note };
    });
  if (rels.length === 0 && familyRels.length === 0) return null;

  // R5 — Group entries by category for collapsible display.
  type Entry = {
    key: string;
    otherId: string;
    kind: string;
    noteZh: string;
    noteEn: string;
  };
  const groups: Record<string, Entry[]> = {};
  // Order priority — family kinds first, then bond kinds
  const CATEGORY_ORDER = [
    'spouse', 'parent', 'child', 'sibling',
    'sworn-brothers', 'master-servant', 'mentor-student',
    'romantic', 'rival', 'enemy',
  ];
  const addEntry = (kind: string, e: Entry) => {
    if (!groups[kind]) groups[kind] = [];
    groups[kind].push(e);
  };
  for (const fr of familyRels) {
    addEntry(fr.kind, {
      key: `fam-${fr.otherId}-${fr.kind}`,
      otherId: fr.otherId,
      kind: fr.kind,
      noteZh: fr.note.zh,
      noteEn: fr.note.en,
    });
  }
  for (const r of rels) {
    const otherId = r.a === officerId ? r.b : r.a;
    addEntry(r.kind, {
      key: `${r.a}-${r.b}-${r.kind}`,
      otherId,
      kind: r.kind,
      noteZh: r.note.zh,
      noteEn: r.note.en,
    });
  }
  const totalCount = Object.values(groups).reduce((n, arr) => n + arr.length, 0);

  const renderEntry = (entry: Entry) => {
    const other = officers[entry.otherId];
    const meta = REL_KIND_LABEL[entry.kind];
    if (!other || !meta) return null;
    return (
      <div
        key={entry.key}
        onClick={() => setDrillOfficerId(entry.otherId)}
        title={lang === 'en' ? `Open ${other.name.en}` : `查看 ${other.name.zh}`}
        style={{
          background: '#10161e',
          borderLeft: `3px solid ${meta.color}`,
          padding: '0.4rem 0.6rem',
          fontSize: '0.8rem',
          cursor: 'pointer',
          transition: 'background 0.1s',
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = '#1b2531'; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = '#10161e'; }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span>
            <span style={{ color: '#e6c473' }}>{lang === 'en' ? other.name.en : other.name.zh}</span>
            {lang === 'both' && <> <span style={{ fontSize: '0.7rem', color: '#7a8893', fontStyle: 'italic' }}>{other.name.en}</span></>}
          </span>
          <span style={{
            fontSize: '0.72rem', letterSpacing: '0.05rem', textTransform: 'uppercase',
            color: meta.color,
          }}>
            {lang === 'en' ? meta.en : lang === 'both' ? `${meta.zh} ${meta.en}` : meta.zh}
          </span>
        </div>
        <div style={{ fontSize: '0.72rem', color: '#aab6c0', fontStyle: 'italic', marginTop: '0.2rem' }}>
          {lang === 'en' ? entry.noteEn : lang === 'both' ? `${entry.noteZh} · ${entry.noteEn}` : entry.noteZh}
        </div>
      </div>
    );
  };

  const drillOfficer = drillOfficerId ? officers[drillOfficerId] : null;

  return (
    <section className={styles.statsSection}>
      <h3 className={styles.sectionTitle}>
        {t('因緣', 'Relationships')}
        <span style={{ marginLeft: '0.6rem', fontSize: '0.7rem', color: '#7a8893' }}>
          {totalCount}
        </span>
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {CATEGORY_ORDER.map((cat) => {
          const arr = groups[cat];
          if (!arr || arr.length === 0) return null;
          const meta = REL_KIND_LABEL[cat];
          if (!meta) return null;
          const isCollapsed = collapsed.has(cat);
          return (
            <div key={cat}>
              <div
                onClick={() => toggleCollapse(cat)}
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  cursor: 'pointer',
                  padding: '0.15rem 0.3rem',
                  borderBottom: `1px dashed ${meta.color}`,
                  marginBottom: '0.25rem',
                }}
              >
                <span style={{
                  color: meta.color,
                  fontSize: '0.72rem',
                  letterSpacing: '0.07rem',
                }}>
                  {isCollapsed ? '▸' : '▾'} {lang === 'en' ? meta.en : meta.zh}
                  <span style={{ marginLeft: 4, fontSize: '0.7rem', opacity: 0.7 }}>({arr.length})</span>
                </span>
              </div>
              {!isCollapsed && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  {arr.map(renderEntry)}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {/* R2 — Drill-down: clicking a chip opens that officer's full detail */}
      {drillOfficer && (
        <OfficerDetail
          officer={drillOfficer}
          onClose={() => setDrillOfficerId(null)}
          officersOverride={officersOverride}
        />
      )}
    </section>
  );
}

/** 本朝實錄 — the biography THIS campaign wrote: composed live from the
 *  officer's deeds, epithets and battle history. The static lore above is
 *  who they were; this is who they're becoming in your game. */
function CampaignChronicleBlock({ officer, officersOverride }: { officer: Officer; officersOverride?: Record<string, Officer> }) {
  const deeds = useGameStore((s) => s.deeds[officer.id] ?? null);
  const battleHistory = useGameStore((s) => s.battleHistory);
  const forces = useGameStore((s) => s.forces);
  const cities = useGameStore((s) => s.cities);
  const storeOfficers = useGameStore((s) => s.officers);
  const family = useGameStore((s) => s.family);
  const runtimeBonds = useGameStore((s) => s.runtimeBonds);
  const duelHall = useGameStore((s) => s.duelHall);
  const clanStandings = useGameStore((s) => s.clanStandings);
  const officers = officersOverride ?? storeOfficers;
  const lang = useLanguage();
  const t = useT();
  // B — 交叉引用 click targets: drill to a named officer, or replay a 名局.
  const [drillId, setDrillId] = useState<string | null>(null);
  const [replay, setReplay] = useState<BoutRecord | null>(null);
  const officerNamesById = useMemo(
    () => Object.fromEntries(Object.values(officers).map((o) => [o.id, o.name])),
    [officers],
  );
  const forceNamesById = useMemo(
    () => Object.fromEntries(Object.values(forces).map((f) => [f.id, f.name])),
    [forces],
  );
  const paragraphs = useMemo(() => composeBiography({
    officer,
    deeds,
    battleHistory,
    forceNameZh: officer.forceId ? forces[officer.forceId]?.name.zh ?? null : null,
    cityNameZhById: Object.fromEntries(Object.values(cities).map((c) => [c.id, c.name.zh])),
    officerNamesById,
    forceNamesById,
    family,
    runtimeBonds,
    duelHall,
    clanStandings,
  }), [officer, deeds, battleHistory, forces, cities, officerNamesById, forceNamesById, family, runtimeBonds, duelHall, clanStandings]);
  return (
    <div style={{ marginTop: '0.6rem', borderTop: '1px dashed #26323e', paddingTop: '0.5rem' }}>
      <div style={{
        fontSize: '0.66rem', color: '#c9a64e', letterSpacing: '0.08rem',
        textTransform: 'uppercase', fontFamily: 'ui-monospace, monospace', marginBottom: 4,
      }}>{t('本朝實錄', 'This campaign')}</div>
      {paragraphs.map((p, i) => {
        // Clickable cross-references: named officers we can drill to, a bout we can replay.
        const refIds = [...new Set(p.refs?.officerIds ?? [])].filter((id) => id !== officer.id && officers[id]);
        const bout = p.refs?.boutId ? duelHall.find((b) => b.id === p.refs!.boutId) : undefined;
        return (
          <div key={i} style={{ margin: '0 0 0.35rem' }}>
            <p style={{
              margin: 0, fontSize: '0.8rem', lineHeight: 1.7,
              color: '#cdb88f', fontFamily: 'var(--tkm-font-body)',
            }}>
              {lang === 'en' ? p.en : lang === 'both' ? `${p.zh} — ${p.en}` : p.zh}
            </p>
            {(refIds.length > 0 || bout) && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 3 }}>
                {refIds.map((id) => (
                  <button key={id} onClick={() => setDrillId(id)} style={refChip}>
                    {officers[id].name.zh}
                  </button>
                ))}
                {bout && (
                  <button onClick={() => setReplay(bout)} style={{ ...refChip, color: '#9ed8b8', borderColor: '#3a5e4c' }}>
                    ▶ {t('名局重演', 'Replay')}
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}
      {drillId && officers[drillId] && (
        <OfficerDetail officer={officers[drillId]} onClose={() => setDrillId(null)} officersOverride={officersOverride} />
      )}
      {replay && (
        <Suspense fallback={null}>
          <BoutReplay3D rec={replay} onClose={() => setReplay(null)} />
        </Suspense>
      )}
    </div>
  );
}

const refChip: React.CSSProperties = {
  background: 'rgba(212,168,74,0.10)', border: '1px solid #5a4a2a', color: '#e6c473',
  padding: '0.05rem 0.45rem', fontSize: '0.72rem', cursor: 'pointer',
  fontFamily: 'var(--tkm-font-body)', borderRadius: 'var(--tkm-radius-xs)',
};

function BiographyBlock({ officer }: { officer: Officer }) {
  const bio = getBiography(officer.id, officer.name.en, officer.name.zh, officer.stats);
  const lang = useLanguage();
  // 歷代名將 cross-over generals carry their real historical lifespan as a
  // display-only line (their playable birthYear is shifted to ~150 AD).
  const lifespan = HISTORICAL_LIFESPANS[officer.id];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {bio.era && (
        <div
          style={{
            fontSize: '0.72rem',
            color: '#c9a64e',
            letterSpacing: '0.07rem',
            textTransform: 'uppercase',
            fontFamily: 'ui-monospace, monospace',
          }}
        >
          {lang === 'en' ? bio.era.en : lang === 'both' ? `${bio.era.zh} · ${bio.era.en}` : bio.era.zh}
        </div>
      )}
      {lifespan && (
        <div
          style={{
            fontSize: '0.7rem',
            color: '#7a8893',
            fontFamily: 'var(--tkm-font-body)',
          }}
          title={lang === 'en' ? 'Historical lifespan' : '歷史生卒'}
        >
          ◷ {lang === 'en' ? lifespan.en : lang === 'both' ? `${lifespan.zh} · ${lifespan.en}` : lifespan.zh}
        </div>
      )}
      {lang !== 'en' && (
        <div
          style={{
            background: '#10161e',
            borderLeft: '3px solid #e6c473',
            padding: '0.6rem 0.85rem',
            fontSize: '0.85rem',
            lineHeight: 1.7,
            color: '#e6c473',
            fontFamily: 'var(--tkm-font-body)',
          }}
        >
          {bio.zh}
        </div>
      )}
      {lang !== 'zh' && (
        <div
          style={{
            background: '#10161e',
            borderLeft: '3px solid #364654',
            padding: '0.6rem 0.85rem',
            fontSize: '0.82rem',
            lineHeight: 1.6,
            color: '#aab6c0',
            fontStyle: 'italic',
          }}
        >
          {bio.en}
        </div>
      )}
      {bio.quote && (
        <div
          style={{
            background: '#080b0e',
            border: '1px dashed #2b3845',
            padding: '0.6rem 0.85rem',
            fontSize: '0.85rem',
            lineHeight: 1.6,
            color: '#e6edf3',
            textAlign: 'center',
            fontStyle: 'italic',
          }}
        >
          &ldquo; {lang === 'en' ? bio.quote.en : bio.quote.zh} &rdquo;
          {lang === 'both' && (
            <div style={{ fontSize: '0.7rem', color: '#7a8893', marginTop: '0.3rem' }}>
              — {bio.quote.en}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Known Chinese compound surnames present in the roster.
const COMPOUND_SURNAMES = [
  '諸葛', '司馬', '夏侯', '太史', '公孫', '上官', '歐陽',
];

function getSurname(zh: string): string {
  for (const s of COMPOUND_SURNAMES) {
    if (zh.startsWith(s)) return s;
  }
  return zh.charAt(0);
}

// Officer ids whose full-body portrait (public/portraits/<id>-full.webp) 404'd
// this session — skip re-requesting so we don't re-fire a failing GET.
const missingFullPortraits = new Set<string>();

/**
 * Left column of the officer-detail modal. Shows a hand-drawn full-body
 * portrait (public/portraits/<id>-full.webp) at its natural proportions when
 * one exists; otherwise falls back to the procedural circular Portrait.
 */
function PortraitColumn({
  officer,
  zh,
  color,
  archetype,
  age,
}: {
  officer: Officer;
  zh: string;
  color: string;
  archetype: PortraitArchetype;
  age: number;
}) {
  const [imgFailed, setImgFailed] = useState(() => missingFullPortraits.has(officer.id));
  const src = `${import.meta.env.BASE_URL}portraits/${officer.id}-full.webp`;

  return (
    <div className={styles.portraitColumn}>
      {imgFailed ? (
        <Portrait zh={zh} color={color} archetype={archetype} age={age} />
      ) : (
        <img
          className={styles.portraitFull}
          src={src}
          alt={zh}
          loading="lazy"
          onError={() => { missingFullPortraits.add(officer.id); setImgFailed(true); }}
        />
      )}
    </div>
  );
}

function Portrait({
  zh,
  color,
  archetype,
  age,
}: {
  zh: string;
  color: string;
  archetype: PortraitArchetype;
  age: number;
}) {
  const surname = getSurname(zh);
  const isCompound = surname.length === 2;
  const gradId = `grad-${zh.charCodeAt(0)}-${zh.charCodeAt(1) ?? 0}-${archetype}`;
  const isOld = age >= 55;

  // Archetype-specific accent color.
  const accent: Record<PortraitArchetype, string> = {
    warrior: '#b8442e',
    strategist: '#3a7dd9',
    civil: '#6abf6a',
    ruler: '#e6c473',
    lady: '#c178c7',
    sage: '#88b7e8',
  };
  const acc = accent[archetype];

  return (
    <svg
      width="84"
      height="84"
      viewBox="0 0 84 84"
      className={styles.portrait}
    >
      <defs>
        <radialGradient id={gradId} cx="42%" cy="38%" r="68%">
          <stop offset="0%" stopColor={color} stopOpacity="0.95" />
          <stop offset="60%" stopColor={color} stopOpacity="0.55" />
          <stop offset="100%" stopColor="#10161e" stopOpacity="1" />
        </radialGradient>
        <linearGradient id={`${gradId}-frame`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#e6c473" />
          <stop offset="100%" stopColor="#8a6a3a" />
        </linearGradient>
      </defs>

      {/* Outer frame ring with archetype color */}
      <circle cx="42" cy="42" r="40" fill="none" stroke={acc} strokeWidth="1" opacity="0.5" />
      <circle cx="42" cy="42" r="38" fill={`url(#${gradId})`} stroke={`url(#${gradId}-frame)`} strokeWidth="1.8" />

      {/* Archetype ornaments */}
      {archetype === 'warrior' && (
        <g>
          {/* Helmet sweep over the top */}
          <path d="M 14 30 Q 42 8 70 30 L 66 32 Q 42 14 18 32 Z" fill="#5a2025" opacity="0.9" stroke="#b8442e" strokeWidth="0.6" />
          {/* Plume */}
          <path d="M 42 8 L 38 2 L 42 4 L 46 2 Z" fill="#b8442e" />
          {/* Cheek guards */}
          <path d="M 14 38 L 14 50 L 20 52" fill="none" stroke="#5a2025" strokeWidth="1.5" opacity="0.7" />
          <path d="M 70 38 L 70 50 L 64 52" fill="none" stroke="#5a2025" strokeWidth="1.5" opacity="0.7" />
        </g>
      )}
      {archetype === 'strategist' && (
        <g>
          {/* Scholar's cap (冠) - boxy with a tassel */}
          <rect x="28" y="14" width="28" height="10" rx="1" fill="#1a3052" stroke="#3a7dd9" strokeWidth="0.6" />
          <path d="M 28 14 L 32 8 L 52 8 L 56 14 Z" fill="#1a3052" opacity="0.7" />
          <line x1="42" y1="8" x2="42" y2="4" stroke="#88b7e8" strokeWidth="0.8" />
          <circle cx="42" cy="3" r="1" fill="#e6c473" />
        </g>
      )}
      {archetype === 'sage' && (
        <g>
          {/* Daoist headdress with star */}
          <path d="M 22 22 Q 42 6 62 22 L 58 26 Q 42 12 26 26 Z" fill="#0a1a2a" opacity="0.85" />
          <path d="M 42 6 L 44 10 L 48 11 L 45 14 L 46 18 L 42 16 L 38 18 L 39 14 L 36 11 L 40 10 Z" fill="#e6c473" opacity="0.9" />
          {/* Feathered fan accent */}
          <path d="M 64 50 Q 76 46 72 60 Q 66 56 64 50 Z" fill="#e6edf3" opacity="0.7" stroke="#7a8893" strokeWidth="0.3" />
        </g>
      )}
      {archetype === 'civil' && (
        <g>
          {/* Tall civil hat */}
          <rect x="32" y="10" width="20" height="14" rx="1" fill="#2a3a2a" stroke="#6abf6a" strokeWidth="0.6" />
          <line x1="42" y1="10" x2="42" y2="6" stroke="#6abf6a" strokeWidth="0.6" />
          <circle cx="42" cy="5" r="0.8" fill="#e6c473" />
        </g>
      )}
      {archetype === 'ruler' && (
        <g>
          {/* Imperial crown with bead curtain */}
          <rect x="22" y="14" width="40" height="6" fill="#26323e" stroke="#e6c473" strokeWidth="1" />
          <rect x="22" y="10" width="40" height="6" fill="#10161e" stroke="#e6c473" strokeWidth="0.6" />
          {/* Hanging beads */}
          {[26, 31, 36, 42, 48, 53, 58].map((x, i) => (
            <g key={i}>
              <line x1={x} y1="20" x2={x} y2="26" stroke="#e6c473" strokeWidth="0.4" />
              <circle cx={x} cy="27" r="1.2" fill="#e6c473" />
            </g>
          ))}
          {/* Top dragon ornament */}
          <path d="M 38 10 L 42 4 L 46 10 Z" fill="#b8442e" />
        </g>
      )}
      {archetype === 'lady' && (
        <g>
          {/* Hair coil with hairpin and ornament */}
          <ellipse cx="42" cy="20" rx="22" ry="10" fill="#10161e" opacity="0.85" />
          <ellipse cx="42" cy="18" rx="14" ry="6" fill="#1b2531" />
          {/* Hairpin with flower */}
          <line x1="48" y1="22" x2="58" y2="14" stroke="#e6c473" strokeWidth="0.6" />
          <circle cx="58" cy="14" r="2.5" fill="#c178c7" stroke="#e6c473" strokeWidth="0.4" />
          <circle cx="58" cy="14" r="1" fill="#e6c473" />
          {/* Side hair locks */}
          <path d="M 22 24 Q 18 38 22 50" fill="none" stroke="#10161e" strokeWidth="2.5" opacity="0.7" />
          <path d="M 62 24 Q 66 38 62 50" fill="none" stroke="#10161e" strokeWidth="2.5" opacity="0.7" />
        </g>
      )}

      {/* Beard for older male officers */}
      {isOld && archetype !== 'lady' && (
        <path
          d="M 30 56 Q 42 78 54 56 Q 50 70 42 72 Q 34 70 30 56 Z"
          fill="#26323e"
          opacity="0.7"
        />
      )}

      {/* Surname character */}
      {isCompound ? (
        <>
          <text
            x="42" y="40"
            textAnchor="middle"
            fontSize="18"
            fontFamily='"Songti SC","Noto Serif SC",serif'
            fontWeight="bold"
            fill="#e6edf3"
            stroke="#10161e"
            strokeWidth="0.4"
          >
            {surname.charAt(0)}
          </text>
          <text
            x="42" y="60"
            textAnchor="middle"
            fontSize="18"
            fontFamily='"Songti SC","Noto Serif SC",serif'
            fontWeight="bold"
            fill="#e6edf3"
            stroke="#10161e"
            strokeWidth="0.4"
          >
            {surname.charAt(1)}
          </text>
        </>
      ) : (
        <text
          x="42" y="56"
          textAnchor="middle"
          fontSize="28"
          fontFamily='"Songti SC","Noto Serif SC",serif'
          fontWeight="bold"
          fill="#e6edf3"
          stroke="#10161e"
          strokeWidth="0.5"
        >
          {surname}
        </text>
      )}

      {/* Archetype seal in corner */}
      <g transform="translate(64, 64)">
        <rect x="-7" y="-7" width="14" height="14" fill={acc} stroke="#10161e" strokeWidth="0.8" rx="1" />
        <text
          x="0" y="3"
          textAnchor="middle"
          fontSize="9"
          fontFamily='"Songti SC","Noto Serif SC",serif'
          fontWeight="bold"
          fill="#fff"
        >
          {archetype === 'warrior' ? '武'
          : archetype === 'strategist' ? '智'
          : archetype === 'sage' ? '聖'
          : archetype === 'civil' ? '文'
          : archetype === 'ruler' ? '君'
          : '麗'}
        </text>
      </g>
    </svg>
  );
}

function StatBar({
  label,
  value,
  bonus = 0,
  mode = 'stat',
}: {
  label: string;
  value: number;
  /** Bonuses from items + skills (drawn as a separate fill segment). */
  bonus?: number;
  mode?: 'stat' | 'loyalty';
}) {
  // Loyalty: 0–100 scale. Stats: 0–150 scale (max possible after XP growth).
  // Past 100, glow gold ("transcendent"). Past 130, glow brighter.
  const scaleMax = mode === 'loyalty' ? 100 : 150;
  const effective = value + bonus;
  const baseWidthPct = Math.min(100, (value / scaleMax) * 100);
  const bonusWidthPct = Math.min(100, ((value + bonus) / scaleMax) * 100) - baseWidthPct;
  const fillColor =
    mode === 'loyalty'
      ? effective >= 80 ? '#3a7dd9' : effective >= 50 ? '#c9a64e' : '#b8442e'
      : effective >= 130 ? '#ffce4a'
      : effective >= 100 ? '#e6c473'
      : effective >= 80 ? '#c9a64e'
      : effective >= 60 ? '#7a8893'
      : '#364654';
  const glow = mode === 'stat' && effective > 100;
  return (
    <div className={styles.statRow}>
      <span className={styles.statLabel}>{label}</span>
      <div className={styles.statBarTrack}>
        {/* Hundred-mark tick — shows the old "natural" cap */}
        {mode === 'stat' && (
          <div
            style={{
              position: 'absolute',
              left: `${(100 / scaleMax) * 100}%`,
              top: 0,
              bottom: 0,
              width: 1,
              background: 'rgba(212, 168, 74, 0.5)',
              pointerEvents: 'none',
            }}
          />
        )}
        {/* Base stat fill */}
        <div
          className={styles.statBarFill}
          style={{
            width: `${baseWidthPct}%`,
            background: fillColor,
            boxShadow: glow ? `0 0 6px ${fillColor}` : undefined,
          }}
        />
        {/* Item + skill bonus fill — striped/lighter to show it's external */}
        {bonus > 0 && (
          <div
            className={styles.statBarFill}
            style={{
              left: `calc(1px + ${baseWidthPct}%)`,
              width: `${bonusWidthPct}%`,
              background:
                `repeating-linear-gradient(45deg, #88b7e8 0, #88b7e8 4px, #5a8ab8 4px, #5a8ab8 8px)`,
              boxShadow: '0 0 6px #88b7e8',
            }}
          />
        )}
        <span
          className={styles.statBarValue}
          style={glow ? { color: '#ffce4a', textShadow: '0 0 4px #000, 0 0 6px #ffce4a' } : undefined}
          title={bonus > 0 ? `Base ${value} + ${bonus} from items/skills` : undefined}
        >
          {effective}
          {bonus > 0 && (
            <span style={{ color: '#88b7e8', fontSize: '0.7em', marginLeft: 4 }}>
              ({value}+{bonus})
            </span>
          )}
        </span>
      </div>
    </div>
  );
}

/* ─── R4 — Family tree mini-visualization ──────────────────────────────
 * Shows parent(s) above, self in center, spouse to the side, children
 * below — all clickable to drill-down. Uses static FAMILY_LINEAGE +
 * runtime state.family.
 */
function FamilyTreeSection({ officerId, officersOverride }: {
  officerId: string;
  officersOverride?: Record<string, Officer>;
}) {
  const storeOfficers = useGameStore((s) => s.officers);
  const officers = officersOverride ?? storeOfficers;
  const family = useGameStore((s) => s.family);
  const t = useT();
  const lang = useLanguage();
  const [drillId, setDrillId] = useState<string | null>(null);

  const allFamily = [...family, ...FAMILY_LINEAGE.filter(
    (f) => f.officerA === officerId || f.officerB === officerId,
  )];
  // Dedup
  const seen = new Set<string>();
  const familyPool = allFamily.filter((f) => {
    const k = `${f.officerA}|${f.officerB}|${f.kind}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });

  const parents: string[] = [];
  const children: string[] = [];
  const spouses: string[] = [];
  const siblings: string[] = [];
  for (const f of familyPool) {
    if (f.officerA !== officerId && f.officerB !== officerId) continue;
    if (f.kind === 'parent-child') {
      if (f.officerA === officerId) children.push(f.officerB);
      else parents.push(f.officerA);
    } else if (f.kind === 'spouse') {
      spouses.push(f.officerA === officerId ? f.officerB : f.officerA);
    } else if (f.kind === 'sibling') {
      siblings.push(f.officerA === officerId ? f.officerB : f.officerA);
    }
  }

  if (parents.length === 0 && children.length === 0 && spouses.length === 0 && siblings.length === 0) {
    return null;
  }

  const node = (id: string, color: string, role: string) => {
    const o = officers[id];
    if (!o) return null;
    return (
      <div
        key={`${role}-${id}`}
        onClick={() => setDrillId(id)}
        title={lang === 'en' ? `Open ${o.name.en}` : `查看 ${o.name.zh}`}
        style={{
          display: 'inline-flex', flexDirection: 'column', alignItems: 'center',
          background: '#10161e',
          border: `1px solid ${color}`,
          padding: '0.35rem 0.55rem',
          minWidth: 75,
          cursor: 'pointer',
          margin: 2,
          transition: 'background 0.1s',
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = '#1b2531'; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = '#10161e'; }}
      >
        <span style={{ color, fontSize: '0.7rem', letterSpacing: '0.1rem' }}>{role}</span>
        <span style={{ color: '#e6c473', fontSize: '0.82rem', marginTop: 2 }}>
          {lang === 'en' ? o.name.en : o.name.zh}
        </span>
        {o.status === 'dead' && (
          <span style={{ fontSize: '0.7rem', color: '#6b3a3a', marginTop: 1 }}>† {t('卒', 'dec.')}</span>
        )}
        {o.status === 'retired' && (
          <span style={{ fontSize: '0.7rem', color: '#7a8a5a', marginTop: 1 }}>{t('歸隱', 'retired')}</span>
        )}
      </div>
    );
  };

  const drillOfficer = drillId ? officers[drillId] : null;

  return (
    <section className={styles.statsSection}>
      <h3 className={styles.sectionTitle}>{t('家系図', 'Family Tree')}</h3>
      <div style={{
        background: 'linear-gradient(180deg, rgba(212,168,74,0.04) 0%, transparent 100%)',
        padding: '0.6rem 0.4rem',
        border: '1px solid #2b3845',
      }}>
        {/* Parents */}
        {parents.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap' }}>
            {parents.map((p) => node(p, '#88b7e8', t('父母', 'Parent')))}
          </div>
        )}
        {/* Vertical line if has parents */}
        {parents.length > 0 && (
          <div style={{ width: 2, height: 12, background: '#364654', margin: '2px auto' }} />
        )}
        {/* Self + spouses + siblings */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap', gap: '4px' }}>
          {siblings.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap' }}>
              {siblings.slice(0, 4).map((s) => node(s, '#c9a64e', t('兄弟', 'Sibling')))}
              {siblings.length > 4 && (
                <span style={{ color: '#7a8893', fontSize: '0.72rem', alignSelf: 'center', margin: '0 4px' }}>
                  +{siblings.length - 4}
                </span>
              )}
            </div>
          )}
          {/* Self */}
          <div
            style={{
              display: 'inline-flex', flexDirection: 'column', alignItems: 'center',
              background: '#1e2832',
              border: '2px solid #e6c473',
              padding: '0.5rem 0.8rem',
              minWidth: 90,
              margin: 2,
              boxShadow: '0 0 12px rgba(212,168,74,0.4)',
            }}
          >
            <span style={{ color: '#e6c473', fontSize: '0.7rem', letterSpacing: '0.05rem' }}>
              {t('本人', 'Self')}
            </span>
            <span style={{ color: '#ffd47a', fontSize: '0.95rem', marginTop: 2, fontWeight: 600 }}>
              {(() => {
                const me = officers[officerId];
                return me ? (lang === 'en' ? me.name.en : me.name.zh) : officerId;
              })()}
            </span>
          </div>
          {spouses.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap' }}>
              {spouses.map((s) => node(s, '#e8a8c8', t('配偶', 'Spouse')))}
            </div>
          )}
        </div>
        {/* Vertical line down to children */}
        {children.length > 0 && (
          <div style={{ width: 2, height: 12, background: '#364654', margin: '2px auto' }} />
        )}
        {/* Children */}
        {children.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap' }}>
            {children.slice(0, 8).map((c) => node(c, '#7ed68a', t('子嗣', 'Child')))}
            {children.length > 8 && (
              <span style={{ color: '#7a8893', fontSize: '0.72rem', alignSelf: 'center', margin: '0 4px' }}>
                +{children.length - 8}
              </span>
            )}
          </div>
        )}
      </div>
      {drillOfficer && (
        <OfficerDetail
          officer={drillOfficer}
          onClose={() => setDrillId(null)}
          officersOverride={officersOverride}
        />
      )}
    </section>
  );
}

const CLAN_TIER_META: Record<'humble' | 'gentry' | 'great', { zh: string; en: string; color: string }> = {
  humble: { zh: '寒門', en: 'Humble', color: '#7a8893' },
  gentry: { zh: '士族', en: 'Gentry', color: '#cfd8e0' },
  great: { zh: '世家', en: 'Great House', color: '#e6c473' },
};

const HEIR_STAT_ROW: Array<{ key: keyof Officer['stats']; zh: string; en: string }> = [
  { key: 'leadership', zh: '統', en: 'LDR' },
  { key: 'war', zh: '武', en: 'WAR' },
  { key: 'intelligence', zh: '智', en: 'INT' },
  { key: 'politics', zh: '政', en: 'POL' },
  { key: 'charisma', zh: '魅', en: 'CHR' },
];

/** 家門與子嗣 — clan standing banner + pending-heir roster with upbringing /
 *  designation / adoption controls (for the player's own officers). §2.5. */
function HeirsAndClanSection({ officerId }: { officerId: string }) {
  const officers = useGameStore((s) => s.officers);
  const pendingHeirs = useGameStore((s) => s.pendingHeirs);
  const clanStandings = useGameStore((s) => s.clanStandings);
  const family = useGameStore((s) => s.family);
  const playerForceId = useGameStore((s) => s.playerForceId);
  const year = useGameStore((s) => s.date.year);
  const assignTutorFn = useGameStore((s) => s.assignTutor);
  const designateHeirFn = useGameStore((s) => s.designateHeir);
  const adoptHeirFn = useGameStore((s) => s.adoptHeir);
  const t = useT();
  const lang = useLanguage();
  const [adoptId, setAdoptId] = useState('');

  const officer = officers[officerId];
  if (!officer) return null;
  const isMine = officer.forceId === playerForceId;
  const clanId = clanOf(officer);
  const standing = clanId ? clanStandings[clanId] : undefined;
  const heirs = pendingHeirs.filter((h) => h.parentAId === officerId || h.parentBId === officerId);
  // Grown children (activated officers) of this officer, for heir designation.
  const grownChildren = family
    .filter((r) => r.kind === 'parent-child' && (r.officerA === officerId || r.officerB === officerId))
    .map((r) => (r.officerA === officerId ? r.officerB : r.officerA))
    .filter((id, i, arr) => arr.indexOf(id) === i)
    .map((id) => officers[id])
    .filter((o): o is Officer => !!o && o.status !== 'dead');

  if (!standing && heirs.length === 0 && grownChildren.length === 0) return null;

  const tierMeta = standing ? CLAN_TIER_META[standing.tier] : null;
  // Living officers in the player's force — tutor / adoption candidates.
  const playerOfficers = isMine
    ? Object.values(officers).filter((o) => o.forceId === playerForceId && o.status !== 'dead' && o.status !== 'unsearched')
    : [];

  return (
    <section className={styles.statsSection}>
      <h3 className={styles.sectionTitle}>{t('家門與子嗣', 'House & Heirs')}</h3>

      {standing && tierMeta && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap',
          background: 'linear-gradient(180deg, rgba(212,168,74,0.05) 0%, transparent 100%)',
          border: '1px solid #2b3845', padding: '0.5rem 0.6rem', marginBottom: heirs.length > 0 ? '0.5rem' : 0,
        }}>
          <span style={{ color: '#ffd47a', fontSize: '0.95rem', fontWeight: 600 }}>
            {lang === 'en' ? (standing.nameEn ?? standing.nameZh) : standing.nameZh}
          </span>
          <span style={{
            color: tierMeta.color, border: `1px solid ${tierMeta.color}`,
            fontSize: '0.66rem', padding: '0.05rem 0.35rem', letterSpacing: '0.06rem',
          }}>{lang === 'en' ? tierMeta.en : tierMeta.zh}</span>
          <span style={{ color: '#9fb0bf', fontSize: '0.74rem' }}>
            {t('聲望', 'Prestige')} {standing.prestige}
            {standing.peakPrestige && standing.peakPrestige > standing.prestige
              ? `（${t('巔峰', 'peak')} ${standing.peakPrestige}）` : ''}
          </span>
        </div>
      )}

      {heirs.map((h) => {
        const age = year - h.birthYear;
        const toCome = Math.max(0, 14 - age);
        const projected = HEIR_STAT_ROW.map(({ key }) => h.baseStats[key] + (h.upbringing?.statBias[key] ?? 0));
        const tutor = h.tutorId ? officers[h.tutorId] : undefined;
        return (
          <div key={h.id} style={{ border: '1px solid #2b3845', padding: '0.5rem 0.6rem', marginBottom: '0.4rem', background: '#10161e' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
              <span style={{ color: '#e6c473', fontSize: '0.85rem' }}>
                {lang === 'en' ? h.name.en : h.name.zh}
              </span>
              <span style={{ color: h.female ? '#e8a8c8' : '#88b7e8', fontSize: '0.66rem' }}>
                {h.female ? t('女', 'F') : t('男', 'M')}
              </span>
              <span style={{ color: '#9fb0bf', fontSize: '0.72rem' }}>
                {age}{t('歲', 'y')} · {toCome > 0 ? t(`${toCome}年後及冠`, `${toCome}y to age`) : t('將及冠', 'coming of age')}
              </span>
              {h.upbringing?.prodigyRevealed && (
                <span style={{ color: '#ffce4a', border: '1px solid #ffce4a', fontSize: '0.7rem', padding: '0.02rem 0.3rem' }}>{t('神童', 'Prodigy')}</span>
              )}
              {h.designatedHeir && (
                <span style={{ color: '#7ed68a', border: '1px solid #7ed68a', fontSize: '0.7rem', padding: '0.02rem 0.3rem' }}>{t('世子', 'Heir')}</span>
              )}
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.35rem', flexWrap: 'wrap' }}>
              {HEIR_STAT_ROW.map((s, i) => (
                <span key={s.key} style={{ color: '#cfd8e0', fontSize: '0.72rem' }}>
                  <span style={{ color: '#7a8893' }}>{lang === 'en' ? s.en : s.zh}</span> {projected[i]}
                </span>
              ))}
            </div>

            {h.traits && h.traits.length > 0 && (
              <div style={{ marginTop: '0.3rem', color: '#b69bd0', fontSize: '0.72rem' }}>
                {h.traits.map((tid) => TRAIT_DEFS_BY_ID[tid]).filter(Boolean).map((tr) => lang === 'en' ? tr.name.en : tr.name.zh).join('、')}
              </div>
            )}

            <div style={{ marginTop: '0.3rem', color: '#9fb0bf', fontSize: '0.72rem' }}>
              {t('西席', 'Tutor')}：{tutor ? (lang === 'en' ? tutor.name.en : tutor.name.zh) : t('（無）', '(none)')}
            </div>

            {isMine && (
              <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <select
                  value={h.tutorId ?? ''}
                  onChange={(e) => assignTutorFn(h.id, e.target.value || null)}
                  style={{ background: '#0c1218', color: '#cfd8e0', border: '1px solid #2b3845', fontSize: '0.72rem', padding: '0.15rem 0.25rem', maxWidth: 160 }}
                >
                  <option value="">{t('指派西席…', 'Assign tutor…')}</option>
                  {playerOfficers.map((o) => (
                    <option key={o.id} value={o.id}>{lang === 'en' ? o.name.en : o.name.zh}</option>
                  ))}
                </select>
                {!h.designatedHeir && (
                  <button
                    onClick={() => designateHeirFn(h.id)}
                    style={{ background: '#1b2531', color: '#7ed68a', border: '1px solid #2b5a3a', fontSize: '0.72rem', padding: '0.15rem 0.5rem', cursor: 'pointer' }}
                  >{t('立為世子', 'Designate heir')}</button>
                )}
              </div>
            )}
          </div>
        );
      })}

      {grownChildren.length > 0 && (
        <div style={{ marginTop: '0.3rem' }}>
          <div style={{ color: '#7a8893', fontSize: '0.68rem', marginBottom: '0.2rem' }}>{t('成年子嗣', 'Grown children')}</div>
          {grownChildren.map((c) => (
            <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.2rem' }}>
              <span style={{ color: '#7ed68a', fontSize: '0.78rem' }}>{lang === 'en' ? c.name.en : c.name.zh}</span>
              {c.designatedHeir && (
                <span style={{ color: '#7ed68a', border: '1px solid #7ed68a', fontSize: '0.7rem', padding: '0.02rem 0.3rem' }}>{t('世子', 'Heir')}</span>
              )}
              {isMine && !c.designatedHeir && (
                <button
                  onClick={() => designateHeirFn(c.id)}
                  style={{ background: '#1b2531', color: '#7ed68a', border: '1px solid #2b5a3a', fontSize: '0.7rem', padding: '0.1rem 0.45rem', cursor: 'pointer' }}
                >{t('立為世子', 'Designate heir')}</button>
              )}
            </div>
          ))}
        </div>
      )}

      {isMine && (
        <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.3rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ color: '#7a8893', fontSize: '0.72rem' }}>{t('收養', 'Adopt')}</span>
          <select
            value={adoptId}
            onChange={(e) => setAdoptId(e.target.value)}
            style={{ background: '#0c1218', color: '#cfd8e0', border: '1px solid #2b3845', fontSize: '0.72rem', padding: '0.15rem 0.25rem', maxWidth: 160 }}
          >
            <option value="">{t('選擇武將…', 'Choose officer…')}</option>
            {playerOfficers.filter((o) => o.id !== officerId).map((o) => (
              <option key={o.id} value={o.id}>{lang === 'en' ? o.name.en : o.name.zh}</option>
            ))}
          </select>
          <button
            disabled={!adoptId}
            onClick={() => { if (adoptId) { adoptHeirFn(adoptId, officerId); setAdoptId(''); } }}
            style={{ background: '#1b2531', color: adoptId ? '#e6c473' : '#566', border: '1px solid #2b3845', fontSize: '0.72rem', padding: '0.15rem 0.5rem', cursor: adoptId ? 'pointer' : 'default' }}
          >{t('收為養子', 'Adopt')}</button>
        </div>
      )}
    </section>
  );
}
