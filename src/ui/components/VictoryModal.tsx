import { useGameStore } from '../../game/state/store';
import { Seal } from './Seal';
import { useLanguage, pickName } from '../i18n';
import styles from './VictoryModal.module.css';

const MOTES = Array.from({ length: 14 }, (_, i) => i);

export function VictoryModal() {
  const victoryStatus = useGameStore((s) => s.victoryStatus);
  const date = useGameStore((s) => s.date);
  const playerForceId = useGameStore((s) => s.playerForceId);
  const playerForce = useGameStore((s) =>
    playerForceId ? s.forces[playerForceId] : null,
  );
  const acknowledge = useGameStore((s) => s.acknowledgeVictory);
  const reset = useGameStore((s) => s.reset);
  const chronicle = useGameStore((s) => s.chronicle ?? []);
  const lang = useLanguage();

  if (victoryStatus !== 'victory' && victoryStatus !== 'defeat') return null;
  const isVictory = victoryStatus === 'victory';

  return (
    <div className={styles.backdrop}>
      <div className={`${styles.modal} ${isVictory ? styles.victory : styles.defeat}`}>
        {/* 凱旋光芒 + 金粉 — only triumph gets the rotating rays and rising motes. */}
        {isVictory && (
          <>
            <div className={styles.rays} />
            {MOTES.map((i) => (
              <span
                key={i}
                className={styles.mote}
                style={{
                  left: `calc(50% + ${(i - 7) * 22}px)`,
                  ['--mote-dur' as string]: `${2 + (i % 4) * 0.4}s`,
                  ['--mote-delay' as string]: `${(i % 5) * 0.3}s`,
                }}
              />
            ))}
          </>
        )}
        <div className={styles.banner} style={{ position: 'relative' }}>
          {isVictory ? (
            <>
              {lang !== 'en' && <div className={styles.bannerZh}>天下統一</div>}
              {lang !== 'zh' && <div className={styles.bannerEn}>The Realm United</div>}
            </>
          ) : (
            <>
              {lang !== 'en' && <div className={styles.bannerZh}>滅亡</div>}
              {lang !== 'zh' && <div className={styles.bannerEn}>Annihilation</div>}
            </>
          )}
          {/* 朱印 — the record is stamped: 「統一」 in triumph, 「終」 at the end. */}
          <span className={styles.sealStamp}>
            <Seal
              chars={isVictory ? '統一' : '終'}
              size={88}
              rotate={isVictory ? 7 : -8}
              color={isVictory ? '#b5302c' : '#6f2723'}
              title={isVictory ? '天下統一' : '滅亡'}
            />
          </span>
        </div>

        <p className={styles.body}>
          {isVictory ? (
            <>
              In the {date.season} of <strong>{date.year} AD</strong>, every city
              of the empire flies the banner of{' '}
              <strong style={{ color: playerForce?.color }}>
                {playerForce ? pickName(playerForce.name, lang) : ''}
              </strong>
              . The Three Kingdoms era ends — your name shall be written in the
              records of the Han successor.
            </>
          ) : (
            <>
              In the {date.season} of <strong>{date.year} AD</strong>, the last
              city of{' '}
              <strong style={{ color: playerForce?.color }}>
                {playerForce ? pickName(playerForce.name, lang) : ''}
              </strong>{' '}
              fell. Your campaign is over.
            </>
          )}
        </p>

        {/* 本局戰史 — the campaign chronicle, year by year. */}
        {chronicle.length > 0 && (
          <div style={{
            maxHeight: 260, overflowY: 'auto', margin: '0.8rem 0',
            padding: '0.7rem 1rem',
            background: 'rgba(12, 8, 4, 0.55)',
            border: '1px solid #6a4a20', borderRadius: 4,
            textAlign: 'left',
          }}>
            <div style={{
              fontFamily: '"Ma Shan Zheng", "Songti SC", serif',
              color: '#e6c473', letterSpacing: '0.3em', marginBottom: 6,
            }}>本局戰史 · The Chronicle</div>
            {(() => {
              const ICON: Record<string, string> = {
                conquest: '⚔', works: '🌊', event: '📜', rebellion: '🔥', defense: '🛡',
              };
              let lastYear = 0;
              return chronicle.map((c, i) => (
                <div key={i} style={{ fontSize: '0.82rem', lineHeight: 1.7, color: '#e8d8b0', animation: `tkmVictorySub 0.4s ease-out ${0.6 + i * 0.04}s both` }}>
                  {c.year !== lastYear && (lastYear = c.year) && (
                    <div style={{ color: '#a08050', marginTop: 6, fontFamily: 'ui-monospace, monospace' }}>— {c.year} —</div>
                  )}
                  <span style={{ marginRight: 6 }}>{ICON[c.kind] ?? '·'}</span>
                  <span style={{ fontFamily: 'var(--tkm-font-body)' }}>{c.zh}</span>
                </div>
              ));
            })()}
          </div>
        )}

        <div className={styles.actions}>
          {isVictory && (
            <button
              className={styles.continueButton}
              onClick={acknowledge}
              title="Continue managing the unified realm"
            >
              Continue Reign
            </button>
          )}
          <button className={styles.titleButton} onClick={reset}>
            Return to Title
          </button>
        </div>
      </div>
    </div>
  );
}
