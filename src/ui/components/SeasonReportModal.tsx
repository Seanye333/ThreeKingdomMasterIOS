import { useEffect, useState, type ReactNode } from 'react';
import { useGameStore } from '../../game/state/store';
import { playSfx } from '../../game/systems/sound';
import { Icon } from './Icon';
import { SEASON_LABEL } from '../../game/types';
import type { BattleDetail, Season } from '../../game/types';
import { BattleDetailModal } from './BattleDetailModal';
import styles from './SeasonReportModal.module.css';
import { useT, useLanguage } from '../i18n';
import { POLICY_DEFS } from '../../game/data/officerAttributes';
import { BUILDING_DEFS_BY_ID } from '../../game/data/buildings';
import { COMMAND_DEFS } from '../../game/systems/commands';

export function SeasonReportModal() {
  const report = useGameStore((s) => s.lastReport);
  const dismiss = useGameStore((s) => s.dismissReport);
  const selectCity = useGameStore((s) => s.selectCity);
  const playerForceId = useGameStore((s) => s.playerForceId);
  const cities = useGameStore((s) => s.cities);
  const officers = useGameStore((s) => s.officers);
  const pendingTrainings = useGameStore((s) => s.pendingTrainings);
  const buildings = useGameStore((s) => s.buildings);
  const [selectedBattle, setSelectedBattle] = useState<BattleDetail | null>(null);
  const t = useT();
  const lang = useLanguage();

  // 開卷鑼 — one soft gong as the scroll unfurls; keyed on the report itself
  // (the component stays mounted between turns).
  useEffect(() => { if (report) playSfx('gong'); }, [report]);

  if (!report) return null;
  const season = SEASON_LABEL[report.date.season as Season];
  // 季色 — spring jade, summer cinnabar, autumn gold, winter frost.
  const SEASON_TINT: Record<Season, { accent: string; glow: string }> = {
    spring: { accent: '#7ec46a', glow: 'rgba(126,196,106,0.22)' },
    summer: { accent: '#e0744a', glow: 'rgba(224,116,74,0.22)' },
    autumn: { accent: '#e6c473', glow: 'rgba(212,168,74,0.2)' },
    winter: { accent: '#a9c8e2', glow: 'rgba(169,200,226,0.22)' },
  };
  const tint = SEASON_TINT[report.date.season as Season] ?? SEASON_TINT.autumn;

  // ── 進行中 (In-Progress) — multi-season tasks still in flight ──
  const trainingsInProgress = pendingTrainings.filter((tr) => {
    const o = officers[tr.officerId];
    return o && o.forceId === playerForceId;
  });
  const buildingsInProgress = buildings.filter((b) => {
    const def = BUILDING_DEFS_BY_ID[b.id];
    if (!def || b.level >= def.maxLevel) return false;
    const city = cities[b.cityId];
    return city?.ownerForceId === playerForceId;
  });
  const hasInProgress = trainingsInProgress.length > 0 || buildingsInProgress.length > 0;

  // Show entries for player-owned cities, plus newsworthy events anywhere
  // (battles, conquests, defeats, deaths, talent appearances, etc.).
  const NEWSWORTHY = new Set([
    'battle',
    'conquest',
    'defeat',
    'march',
    'death',
    'succession',
    'dissolution',
    'rebellion',
    'talent',
  ]);
  const playerEntries = report.entries.filter((e) => {
    if (!e.cityId) return true;
    if (NEWSWORTHY.has(e.kind)) return true;
    return cities[e.cityId]?.ownerForceId === playerForceId;
  });

  // ── 摘要 — a one-line scannable tally so the season's signal isn't buried in
  // a 40-line scroll. Counts are taken over the same player-relevant slice.
  const n = (k: string) => playerEntries.filter((e) => e.kind === k).length;
  const summary: Array<{ icon: ReactNode; label: string; count: number; color: string }> = [
    { icon: '✓', label: t('令成', 'done'), count: n('command-success'), color: '#9ad6a8' },
    { icon: '✗', label: t('令敗', 'failed'), count: n('command-failure'), color: '#e8a07a' },
    { icon: <Icon name="war" size={13} color="#e0b070" />, label: t('戰', 'battles'), count: n('battle'), color: '#e0b070' },
    { icon: <Icon name="city" size={13} color="#7ed68a" />, label: t('克城', 'taken'), count: n('conquest'), color: '#7ed68a' },
    { icon: <Icon name="shield" size={13} color="#e0707a" />, label: t('失地', 'lost'), count: n('defeat'), color: '#e0707a' },
    { icon: '✦', label: t('賢才', 'talent'), count: n('talent'), color: '#c0a0e8' },
    { icon: '☠', label: t('殞', 'deaths'), count: n('death'), color: '#b0a090' },
  ].filter((s) => s.count > 0);

  // ── 季度旁白 — a史官's one-line prose gloss on the season, woven from the
  // same tallies. Turns a column of numbers into a sentence you'd read in a
  // chronicle. Quiet seasons get their own (peaceful) line.
  const narration: { zh: string; en: string } = (() => {
    const c = (k: string) => n(k);
    const zh: string[] = [];
    const en: string[] = [];
    if (c('battle')) { zh.push(`烽火${c('battle')}起`); en.push(`${c('battle')} clash${c('battle') > 1 ? 'es' : ''}`); }
    if (c('conquest')) { zh.push(`拓土${c('conquest')}城`); en.push(`${c('conquest')} city taken`); }
    if (c('defeat')) { zh.push(`失地${c('defeat')}城`); en.push(`${c('defeat')} city lost`); }
    if (c('talent')) { zh.push(`${c('talent')}賢來投`); en.push(`${c('talent')} worthy joined`); }
    if (c('death')) { zh.push(`${c('death')}將星隕`); en.push(`${c('death')} fallen`); }
    if (c('rebellion')) { zh.push('境內生變'); en.push('unrest stirs'); }
    if (c('succession')) { zh.push('易主承祧'); en.push('a throne passes'); }
    const era = `${report.date.year}年·${season.zh}`;
    const eraEn = `${season.en} ${report.date.year} AD`;
    if (zh.length === 0) return { zh: `${era} —— 四海晏然,境內無大事。`, en: `${eraEn} — a quiet season across the realm.` };
    return { zh: `${era} —— ${zh.join('、')}。`, en: `${eraEn} — ${en.join(', ')}.` };
  })();

  return (
    <div className={styles.backdrop} onClick={dismiss}>
      <div
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
        style={{ ['--season-accent' as string]: tint.accent, ['--season-glow' as string]: tint.glow }}
      >
        <header className={styles.header}>
          <div className={styles.titleBlock}>
            <div className={styles.titleZh}>{t('季報', 'Season Report')}</div>
            <div className={styles.titleEn}>
              {lang === 'zh'
                ? `${season.zh} ${report.date.year} 年`
                : lang === 'both'
                  ? `${season.zh} · ${season.en} ${report.date.year} AD`
                  : `Season Report — ${season.en} ${report.date.year} AD`}
            </div>
          </div>
        </header>

        {/* 季度旁白 — chronicler's gloss on the season (serif for flavour) */}
        <div style={{
          textAlign: 'center', fontStyle: 'italic', color: '#bda06a',
          fontFamily: 'var(--tkm-font-serif)', fontSize: '0.9rem',
          padding: '0.55rem 1rem 0.2rem', lineHeight: 1.5,
        }}>
          {lang === 'en' ? narration.en : lang === 'both' ? `${narration.zh} · ${narration.en}` : narration.zh}
        </div>

        {summary.length > 0 && (
          <div style={{
            display: 'flex', flexWrap: 'wrap', gap: '0.4rem',
            padding: '0.5rem 0.2rem 0.2rem', justifyContent: 'center',
          }}>
            {summary.map((s, i) => (
              <span key={s.label} style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                background: 'rgba(0,0,0,0.25)', border: `1px solid ${s.color}55`,
                borderRadius: 'var(--tkm-radius-lg)', padding: '0.12rem 0.6rem',
                color: s.color, fontSize: '0.82rem', fontFamily: 'var(--tkm-font-body)',
                animation: `tkmTroopMarchIn 0.4s cubic-bezier(0.2,0.9,0.3,1) ${0.5 + i * 0.07}s both`,
              }}>
                <b style={{ fontSize: '0.95rem', display: 'inline-flex', alignItems: 'center', gap: 3 }}>{s.icon}{s.count}</b>
                <span style={{ opacity: 0.8 }}>{s.label}</span>
              </span>
            ))}
          </div>
        )}

        {report.executedCommands && report.executedCommands.length > 0 && (
          <div className={styles.executedBlock}>
            <div className={styles.sectionDivider}>
              {t('本季令', 'Orders This Turn')}
            </div>
            <ul className={styles.entries}>
              {report.executedCommands.map((cmd) => {
                const o = officers[cmd.officerId];
                const fromCity = cities[cmd.cityId];
                const def = COMMAND_DEFS[cmd.type];
                const oName = o ? (lang === 'en' ? o.name.en : o.name.zh) : '?';
                const cName = fromCity ? (lang === 'en' ? fromCity.name.en : fromCity.name.zh) : '?';
                const actName = lang === 'en' ? def.label.en : def.label.zh;
                let body: string;
                if (cmd.type === 'march') {
                  const target = cities[cmd.targetCityId];
                  const tName = target ? (lang === 'en' ? target.name.en : target.name.zh) : '?';
                  body = lang === 'zh'
                    ? `${oName} 自 ${cName} 出陣 ${tName} (率 ${cmd.troops.toLocaleString()} 兵)`
                    : lang === 'both'
                      ? `${oName}: ${cName} → ${tName} · ${actName} · ${cmd.troops.toLocaleString()} ${'troops'}`
                      : `${oName} marched from ${cName} to ${tName} (${cmd.troops.toLocaleString()} troops)`;
                } else {
                  body = lang === 'zh'
                    ? `${oName} 於 ${cName} 執行「${actName}」`
                    : lang === 'both'
                      ? `${oName} @ ${cName} · ${actName}`
                      : `${oName} at ${cName} — ${actName}`;
                }
                return (
                  <li key={`cmd-${cmd.officerId}`} className={`${styles.entry} ${styles.kind_executed}`}>
                    <span className={styles.kindTag}>
                      {lang === 'zh' ? '令' : lang === 'both' ? '令 · CMD' : 'CMD'}
                    </span>
                    <span className={styles.text}>{body}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {playerEntries.length === 0 ? (
          <div className={styles.empty}>
            {t('季內無事,境內安寧。', 'A quiet season. Nothing of note in your domain.')}
          </div>
        ) : (
          <ul className={styles.entries}>
            {playerEntries.map((e, i) => {
              const clickable = !!e.battle;
              const body = lang === 'zh' ? (e.textZh ?? e.text) : e.text;
              return (
                <li
                  key={i}
                  className={`${styles.entry} ${styles[kindClass(e.kind)]}`}
                  onClick={
                    clickable && e.battle
                      ? () => setSelectedBattle(e.battle!)
                      : undefined
                  }
                  style={clickable ? { cursor: 'pointer' } : undefined}
                >
                  <span className={styles.kindTag}>{
                    (e.textZh ?? e.text ?? '').startsWith('考課')
                      ? (lang === 'en' ? 'REVIEW' : '考課')
                      : kindLabel(e.kind, lang)
                  }</span>
                  <span className={styles.text}>{body}</span>
                  {e.cityId && cities[e.cityId] && (
                    <button
                      title={lang === 'zh' ? '跳轉至地圖位置' : 'Jump to it on the map'}
                      onClick={(ev) => {
                        ev.stopPropagation();
                        selectCity(e.cityId!);
                        dismiss();
                      }}
                      style={{
                        marginLeft: 6, background: 'transparent', border: '1px solid #2b3845',
                        color: '#e6c473', cursor: 'pointer', fontSize: '0.7rem',
                        padding: '0 0.35rem', borderRadius: 'var(--tkm-radius-xs)', flexShrink: 0,
                      }}
                    >📍 {lang === 'zh' ? cities[e.cityId]!.name.zh : cities[e.cityId]!.name.en}</button>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        {hasInProgress && (
          <div className={styles.inProgressBlock}>
            <div className={styles.sectionDivider}>
              {t('進行中', 'In Progress')}
            </div>
            <ul className={styles.entries}>
              {trainingsInProgress.map((tr) => {
                const o = officers[tr.officerId];
                const city = cities[tr.cityId];
                const pol = POLICY_DEFS[tr.policyId];
                const oName = o ? (lang === 'en' ? o.name.en : o.name.zh) : '?';
                const cName = city ? (lang === 'en' ? city.name.en : city.name.zh) : '?';
                const pName = pol ? (lang === 'en' ? pol.en : pol.zh) : tr.policyId;
                const body = lang === 'zh'
                  ? `${oName} 於 ${cName} 學「${pName}」,剩 ${tr.seasonsLeft} 季`
                  : lang === 'both'
                    ? `${oName} @ ${cName} · 學「${pName}」· ${tr.seasonsLeft} season(s) left`
                    : `${oName} at ${cName} — learning ${pName} · ${tr.seasonsLeft} season(s) left`;
                return (
                  <li key={`tr-${tr.officerId}`} className={`${styles.entry} ${styles.kind_in_progress}`}>
                    <span className={styles.kindTag}>
                      {lang === 'zh' ? '書院' : lang === 'both' ? '書院 · ACADEMY' : 'ACADEMY'}
                    </span>
                    <span className={styles.text}>{body}</span>
                  </li>
                );
              })}
              {buildingsInProgress.map((b) => {
                const def = BUILDING_DEFS_BY_ID[b.id]!;
                const city = cities[b.cityId];
                const cName = city ? (lang === 'en' ? city.name.en : city.name.zh) : '?';
                const bName = lang === 'en' ? def.name.en : def.name.zh;
                const nextLevel = b.level + 1;
                const body = lang === 'zh'
                  ? `${cName} · ${b.level === 0 ? '興建' : '升級至'} ${bName}${b.level === 0 ? '' : ` ${nextLevel} 級`} · ${b.progress}/${def.seasonsPerLevel} 季`
                  : lang === 'both'
                    ? `${cName} · ${b.level === 0 ? 'Building' : `Upgrading to lv ${nextLevel}`}: ${bName} · ${b.progress}/${def.seasonsPerLevel}`
                    : `${cName}: ${b.level === 0 ? 'building' : `upgrading to lv ${nextLevel}`} ${bName} · ${b.progress}/${def.seasonsPerLevel} seasons`;
                return (
                  <li key={`bd-${b.cityId}-${b.id}`} className={`${styles.entry} ${styles.kind_in_progress}`}>
                    <span className={styles.kindTag}>
                      {lang === 'zh' ? '建造' : lang === 'both' ? '建造 · BUILD' : 'BUILD'}
                    </span>
                    <span className={styles.text}>{body}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        <footer className={styles.footer}>
          <button className={styles.closeButton} onClick={dismiss}>
            {t('繼續', 'Continue')}
          </button>
        </footer>

        {selectedBattle && (
          <BattleDetailModal
            battle={selectedBattle}
            onClose={() => setSelectedBattle(null)}
          />
        )}
      </div>
    </div>
  );
}

function kindClass(kind: string): string {
  return `kind_${kind.replace('-', '_')}`;
}

function kindLabel(kind: string, lang: 'zh' | 'en' | 'both'): string {
  const pair = ((): { zh: string; en: string } => {
    switch (kind) {
      case 'income':           return { zh: '收入', en: 'INCOME' };
      case 'upkeep':           return { zh: '俸給', en: 'UPKEEP' };
      case 'desertion':        return { zh: '逃散', en: 'DESERTION' };
      case 'command-success':  return { zh: '政令', en: 'ORDER' };
      case 'command-failure':  return { zh: '政令', en: 'ORDER' };
      case 'march':            return { zh: '進軍', en: 'MARCH' };
      case 'battle':           return { zh: '戰役', en: 'BATTLE' };
      case 'conquest':         return { zh: '攻佔', en: 'CONQUEST' };
      case 'defeat':           return { zh: '敗北', en: 'DEFEAT' };
      case 'death':            return { zh: '逝世', en: 'DEATH' };
      case 'succession':       return { zh: '繼承', en: 'SUCCESSION' };
      case 'dissolution':      return { zh: '滅亡', en: 'DISSOLUTION' };
      case 'rebellion':        return { zh: '叛亂', en: 'REVOLT' };
      case 'harvest':          return { zh: '豐收', en: 'HARVEST' };
      case 'famine':           return { zh: '饑荒', en: 'FAMINE' };
      case 'plague':           return { zh: '瘟疫', en: 'PLAGUE' };
      case 'talent':           return { zh: '人才', en: 'TALENT' };
      default:                 return { zh: '雜事', en: 'NOTE' };
    }
  })();
  if (lang === 'zh') return pair.zh;
  if (lang === 'both') return `${pair.zh} · ${pair.en}`;
  return pair.en;
}
