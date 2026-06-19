import { resolveBattleEnd } from '../../game/systems/tactical';
import { battleRecap } from '../../game/systems/battleRecap';
import { useGameStore } from '../../game/state/store';
import { pickVoiceLine } from '../../game/data/voiceLines';
import { getDeathPoem } from '../../game/data/deathPoems';
import type { TacticalBattle } from '../../game/types';
import { useEffect, useState } from 'react';
import { OfficerStats } from './OfficerStats';
import styles from './BattleResultsModal.module.css';
import { OfficerPortrait } from './OfficerPortrait';
import { Seal } from './Seal';
import { AnimatedNumber } from './AnimatedNumber';
import { useLanguage, pickName } from '../i18n';

interface Props {
  battle: TacticalBattle;
  playerSide: 'attacker' | 'defender' | null;
  onClose: () => void;
}

export function BattleResultsModal({ battle, playerSide, onClose }: Props) {
  const officers = useGameStore((s) => s.officers);
  const currentYear = useGameStore((s) => s.date.year);
  const forces = useGameStore((s) => s.forces);
  const lang = useLanguage();
  const reduced = typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  // Roll the casualty figures up from 0 once the banner has slammed in.
  const [revealed, setRevealed] = useState(reduced);
  useEffect(() => {
    if (reduced) return;
    const id = window.setTimeout(() => setRevealed(true), 500);
    return () => window.clearTimeout(id);
  }, [reduced]);
  const resolution = resolveBattleEnd(battle, officers);
  const won = resolution.winner === playerSide;
  const isDraw = !resolution.winner;
  const winnerZh = won ? '勝利' : resolution.winner ? '敗北' : '引分';
  const winnerEn = won ? 'Victory' : resolution.winner ? 'Defeat' : 'Draw';

  // Pick a victor's voice line from a surviving officer on the winning side.
  const winnerUnits = resolution.winner
    ? battle.units.filter((u) => u.side === resolution.winner)
    : [];
  const speakerId = winnerUnits.find((u) => {
    const o = officers[u.officerId];
    return o && o.status !== 'dead';
  })?.officerId;
  const speaker = speakerId ? officers[speakerId] : null;
  const speakerForce = speaker?.forceId ? forces[speaker.forceId] : null;
  const victoryLine = speakerId
    ? pickVoiceLine(speakerId, won ? 'rally' : 'spawn', Math.random)
    : null;

  return (
    <div className={styles.backdrop}>
      <div className={styles.modal}>
        <div className={styles.headerBanner}>
          {lang !== 'en' && (
            <div
              className={`${styles.bannerZh} ${
                won ? styles.bannerZhVictory : styles.bannerZhDefeat
              }`}
            >
              {winnerZh}
            </div>
          )}
          {lang !== 'zh' && <div className={styles.bannerEn}>{winnerEn}</div>}
          {/* 朱印 — 「捷」 in victory, 「敗」 in defeat, 「和」 on a draw. */}
          {!isDraw && (
            <span className={styles.sealStamp}>
              <Seal
                chars={won ? '捷' : '敗'}
                size={64}
                rotate={won ? 6 : -7}
                color={won ? '#b5302c' : '#6f2723'}
                title={won ? winnerEn : winnerEn}
              />
            </span>
          )}
        </div>

        {speaker && victoryLine && (
          <div
            style={{
              display: 'flex',
              gap: '0.75rem',
              alignItems: 'center',
              padding: '0.75rem 1rem',
              background: 'var(--tkm-bg-sunken)',
              borderBottom: '1px solid var(--tkm-border-soft)',
            }}
          >
            <OfficerPortrait
              officer={speaker}
              size={56}
              forceColor={speakerForce?.color}
              year={currentYear}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: '0.78rem',
                  color: 'var(--tkm-text-muted)',
                  letterSpacing: '0.05rem',
                }}
              >
                {pickName(speaker.name, lang)}
              </div>
              <div className="tkm-voiceline" style={{ marginTop: '0.2rem' }}>
                「{victoryLine}」
              </div>
            </div>
          </div>
        )}

        <div className={styles.body}>
          <div className={styles.section}>
            <div className={styles.sectionLabel}>{lang === 'en' ? 'Casualties' : '傷亡'}</div>
            <div className={styles.statRow}>
              <span className={styles.statSide}>{lang === 'en' ? 'Attacker losses' : '攻方折損'}</span>
              <span className={`${styles.statValue} ${styles.statValueAttack}`}>
                <AnimatedNumber value={revealed ? resolution.attackerLosses : 0} durationMs={800} style={{ color: 'inherit' }} />
              </span>
              <span className={styles.statValue}>{lang === 'en' ? 'troops' : '兵'}</span>
            </div>
            <div className={styles.statRow}>
              <span className={styles.statSide}>{lang === 'en' ? 'Defender losses' : '守方折損'}</span>
              <span className={`${styles.statValue} ${styles.statValueDefend}`}>
                <AnimatedNumber value={revealed ? resolution.defenderLosses : 0} durationMs={800} style={{ color: 'inherit' }} />
              </span>
              <span className={styles.statValue}>{lang === 'en' ? 'troops' : '兵'}</span>
            </div>
            <div className={styles.statRow}>
              <span className={styles.statSide}>{lang === 'en' ? 'Turns elapsed' : '歷時回合'}</span>
              <span className={styles.statValue} style={{ gridColumn: '2 / -1' }}>
                {battle.turn}
              </span>
            </div>
          </div>

          {/* 復盤 — derived recap: exchange ratio, MVP, schemes thrown. */}
          {(() => {
            const recap = battleRecap(battle, officers);
            const rows: Array<[string, string]> = [];
            if (recap.exchangeRatio != null) rows.push([lang === 'en' ? 'Exchange' : '戰損比', `1 : ${recap.exchangeRatio}`]);
            if (recap.toughest) rows.push([lang === 'en' ? 'Toughest' : '最堅韌', lang === 'en' ? `${recap.toughest.name} (${Math.round(recap.toughest.keptPct * 100)}% kept)` : `${recap.toughest.name}(存 ${Math.round(recap.toughest.keptPct * 100)}%)`]);
            if (recap.pillar) rows.push([lang === 'en' ? 'Pillar' : '中流砥柱', `${recap.pillar.name}(${recap.pillar.troops.toLocaleString()})`]);
            if (recap.schemesCast > 0) rows.push([lang === 'en' ? 'Schemes' : '計謀', lang === 'en' ? `${recap.schemesCast}x` : `${recap.schemesCast} 次`]);
            if (rows.length === 0) return null;
            return (
              <div className={styles.section}>
                <div className={styles.sectionLabel}>{lang === 'en' ? 'Recap' : '復盤'}</div>
                {rows.map(([k, v]) => (
                  <div key={k} className={styles.statRow}>
                    <span className={styles.statSide}>{k}</span>
                    <span className={styles.statValue} style={{ gridColumn: '2 / -1' }}>{v}</span>
                  </div>
                ))}
              </div>
            );
          })()}

          {/* 名場面 — the signature moments that fired this battle. */}
          {(() => {
            const moments = Array.from(new Set(
              (battle.log ?? []).filter((e) => e.kind === 'event').map((e) => e.text),
            )).slice(-4);
            if (moments.length === 0) return null;
            return (
              <div className={styles.section}>
                <div className={styles.sectionLabel}>{lang === 'en' ? 'Highlights' : '名場面'}</div>
                {moments.map((m, i) => (
                  <div key={i} style={{
                    color: '#f2dd9a', fontFamily: 'var(--tkm-font-body)', fontSize: '0.85rem',
                    padding: '2px 0', borderLeft: '2px solid #e6c473', paddingLeft: 8, margin: '3px 0',
                  }}>{m}</div>
                ))}
              </div>
            );
          })()}

          {resolution.capturedOfficerIds.length > 0 && (
            <div className={styles.section}>
              <div className={styles.sectionLabel}>
                Captured Officers ({resolution.capturedOfficerIds.length})
              </div>
              {resolution.capturedOfficerIds.map((id) => {
                const o = officers[id];
                if (!o) return null;
                const f = o.forceId ? forces[o.forceId] : null;
                return (
                  <div
                    key={id}
                    className={`${styles.officerCard} ${styles.captureCard}`}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}
                  >
                    <OfficerPortrait officer={o} size={40} forceColor={f?.color} year={currentYear} />
                    <div style={{ flex: 1 }}>
                      <span className={styles.officerName}>{pickName(o.name, lang)}</span>
                    </div>
                    <span className={styles.officerStat}>
                      <OfficerStats officer={o} keys={['war', 'leadership']} /> → 捕虜
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {(resolution.attackerDead.length > 0 || resolution.defenderDead.length > 0) && (
            <div className={styles.section}>
              <div className={styles.sectionLabel}>Fallen</div>
              {[...resolution.attackerDead, ...resolution.defenderDead].map((id) => {
                const o = officers[id];
                if (!o) return null;
                const f = o.forceId ? forces[o.forceId] : null;
                const poem = getDeathPoem(id);
                return (
                  <div key={id} className={`${styles.officerCard} ${styles.deadCard}`}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <OfficerPortrait officer={o} size={40} forceColor={f?.color} year={currentYear} />
                      <div style={{ flex: 1 }}>
                        <span className={styles.officerName}>{pickName(o.name, lang)}</span>
                      </div>
                      <span className={styles.officerStat}>† fell</span>
                    </div>
                    {poem && (
                      <div className="tkm-voiceline" style={{ marginTop: '0.4rem', fontSize: '0.78rem' }}>
                        絕命詩：「{poem.zh}」
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {won && resolution.lootGold > 0 && (
            <div className={styles.section}>
              <div className={styles.sectionLabel}>Spoils</div>
              <div className={styles.lootRow}>
                <span>
                  Gold seized: <span className={styles.lootValue}>{resolution.lootGold}g</span>
                </span>
              </div>
            </div>
          )}

          {battle.log && battle.log.length > 0 && (
            <div className={styles.section}>
              <div className={styles.sectionLabel}>Battle Log</div>
              {battle.log.slice(-10).map((entry, i) => {
                const speaker = entry.speaker ? officers[entry.speaker] : null;
                return (
                  <div key={i} className={styles.officerCard} style={{ borderColor: '#26323e' }}>
                    <div style={{ fontSize: '0.78rem' }}>
                      <span style={{ color: '#7a8893' }}>T{entry.turn} </span>
                      {speaker && (
                        <span className={styles.officerName}>{speaker.name.zh}: </span>
                      )}
                      <span style={{ fontStyle: 'italic' }}>{entry.text}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className={styles.footer}>
          <span style={{ fontSize: '0.78rem', color: '#7a8893' }}>
            {won ? 'Spoils & captives applied to the strategic map.' : 'Your forces retreat to lick their wounds.'}
          </span>
          <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={onClose}>
            続行 Continue
          </button>
        </div>
      </div>
    </div>
  );
}
