import { resolveBattleEnd } from '../../game/systems/tactical';
import { battleRecap } from '../../game/systems/battleRecap';
import { useGameStore } from '../../game/state/store';
import { pickVoiceLine } from '../../game/data/voiceLines';
import { getDeathPoem } from '../../game/data/deathPoems';
import type { TacticalBattle } from '../../game/types';
import styles from './BattleResultsModal.module.css';
import { OfficerPortrait } from './OfficerPortrait';

interface Props {
  battle: TacticalBattle;
  playerSide: 'attacker' | 'defender' | null;
  onClose: () => void;
}

export function BattleResultsModal({ battle, playerSide, onClose }: Props) {
  const officers = useGameStore((s) => s.officers);
  const currentYear = useGameStore((s) => s.date.year);
  const forces = useGameStore((s) => s.forces);
  const resolution = resolveBattleEnd(battle, officers);
  const won = resolution.winner === playerSide;
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
          <div
            className={`${styles.bannerZh} ${
              won ? styles.bannerZhVictory : styles.bannerZhDefeat
            }`}
          >
            {winnerZh}
          </div>
          <div className={styles.bannerEn}>{winnerEn}</div>
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
                  letterSpacing: '0.15rem',
                }}
              >
                {speaker.name.zh} {speaker.name.en}
              </div>
              <div className="tkm-voiceline" style={{ marginTop: '0.2rem' }}>
                「{victoryLine}」
              </div>
            </div>
          </div>
        )}

        <div className={styles.body}>
          <div className={styles.section}>
            <div className={styles.sectionLabel}>Casualties</div>
            <div className={styles.statRow}>
              <span className={styles.statSide}>Attacker losses</span>
              <span className={`${styles.statValue} ${styles.statValueAttack}`}>
                {resolution.attackerLosses.toLocaleString()}
              </span>
              <span className={styles.statValue}>troops</span>
            </div>
            <div className={styles.statRow}>
              <span className={styles.statSide}>Defender losses</span>
              <span className={`${styles.statValue} ${styles.statValueDefend}`}>
                {resolution.defenderLosses.toLocaleString()}
              </span>
              <span className={styles.statValue}>troops</span>
            </div>
            <div className={styles.statRow}>
              <span className={styles.statSide}>Turns elapsed</span>
              <span className={styles.statValue} style={{ gridColumn: '2 / -1' }}>
                {battle.turn}
              </span>
            </div>
          </div>

          {/* 復盤 — derived recap: exchange ratio, MVP, schemes thrown. */}
          {(() => {
            const recap = battleRecap(battle, officers);
            const rows: Array<[string, string]> = [];
            if (recap.exchangeRatio != null) rows.push(['戰損比 Exchange', `1 : ${recap.exchangeRatio}`]);
            if (recap.toughest) rows.push(['最堅韌 Toughest', `${recap.toughest.name}(存 ${Math.round(recap.toughest.keptPct * 100)}%)`]);
            if (recap.pillar) rows.push(['中流砥柱 Pillar', `${recap.pillar.name}(${recap.pillar.troops.toLocaleString()})`]);
            if (recap.schemesCast > 0) rows.push(['計謀 Schemes', `${recap.schemesCast} 次`]);
            if (rows.length === 0) return null;
            return (
              <div className={styles.section}>
                <div className={styles.sectionLabel}>復盤 Recap</div>
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
                <div className={styles.sectionLabel}>名場面 Highlights</div>
                {moments.map((m, i) => (
                  <div key={i} style={{
                    color: '#f0d98a', fontFamily: 'Songti SC, serif', fontSize: '0.85rem',
                    padding: '2px 0', borderLeft: '2px solid #d4a84a', paddingLeft: 8, margin: '3px 0',
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
                      <span className={styles.officerName}>{o.name.zh}</span>
                      <span className={styles.officerNameEn}>{o.name.en}</span>
                    </div>
                    <span className={styles.officerStat}>
                      W{o.stats.war} L{o.stats.leadership} → 捕虜
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
                        <span className={styles.officerName}>{o.name.zh}</span>
                        <span className={styles.officerNameEn}>{o.name.en}</span>
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
                  <div key={i} className={styles.officerCard} style={{ borderColor: '#3a2d20' }}>
                    <div style={{ fontSize: '0.78rem' }}>
                      <span style={{ color: '#8a7050' }}>T{entry.turn} </span>
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
          <span style={{ fontSize: '0.78rem', color: '#8a7050' }}>
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
