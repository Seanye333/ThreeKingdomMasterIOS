import { useMemo, useState } from 'react';
import { useGameStore } from '../../game/state/store';
import type { EntityId } from '../../game/types';
import styles from './MarriagePicker.module.css';
import { useT } from '../i18n';

interface Props { onClose: () => void; }

export function BuildStockadePicker({ onClose }: Props) {
  const playerForceId = useGameStore((s) => s.playerForceId);
  const cities = useGameStore((s) => s.cities);
  const buildStockade = useGameStore((s) => s.buildStockade);
  const playerCapitalGold = useGameStore((s) => {
    const f = playerForceId ? s.forces[playerForceId] : null;
    const c = f ? s.cities[f.capitalCityId] : null;
    return c?.gold ?? 0;
  });

  const [pickCityId, setPickCityId] = useState<EntityId | null>(null);
  const [label, setLabel] = useState('');
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);
  const t = useT();

  const ownedCities = useMemo(() =>
    Object.values(cities)
      .filter((c) => c.ownerForceId === playerForceId)
      .sort((a, b) => b.troops - a.troops),
  [cities, playerForceId]);

  const handleSubmit = () => {
    if (!pickCityId) return;
    const r = buildStockade(pickCityId, label.trim() || '壘');
    setFeedback({ ok: r.ok, text: r.message });
    if (r.ok) setLabel('');
  };

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <header className={styles.header}>
          <div>
            <div className={styles.titleZh}>築壘</div>
            <div className={styles.titleEn}>{t('300金 · 10季', 'Build Stockade (300g · 10 seasons)')}</div>
          </div>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </header>

        <div className={styles.meta}>
          {t(`木壘為臨時軍堡。國庫金：${playerCapitalGold}`,
             `A stockade is a temporary wooden fort. Capital gold: ${playerCapitalGold}g.`)}
        </div>

        <div style={{ padding: '0.5rem 0.8rem' }}>
          <input
            placeholder={t('壘名（如 街壘、山壘）', 'Stockade name (e.g. Jielou, Shanlou)')}
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            style={{
              width: '100%', padding: '0.4rem 0.6rem',
              background: '#1a1410', color: '#f0e0b0',
              border: '1px solid #5a4530',
              fontFamily: 'Songti SC, serif',
            }}
          />
        </div>

        <div className={styles.columns}>
          <div className={styles.column}>
            <div className={styles.columnHeader}>
              <span>{t('於附近城邑 — 選一座', 'Near city — pick one')}</span>
            </div>
            {ownedCities.length === 0 ? (
              <div className={styles.empty}>{t('你尚未擁有城邑。', 'You own no cities.')}</div>
            ) : (
              <ul className={styles.officerList}>
                {ownedCities.map((c) => (
                  <li key={c.id}>
                    <button
                      className={`${styles.officerButton} ${pickCityId === c.id ? styles.officerSelected : ''}`}
                      onClick={() => setPickCityId(c.id)}
                    >
                      <span className={styles.officerNameZh}>{c.name.zh}</span>
                      <span className={styles.officerNameEn}>{c.name.en}</span>
                      <span className={styles.officerCha}>
                        {t('兵', 'TROOPS')} <strong>{c.troops.toLocaleString()}</strong>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {feedback && (
          <div className={`${styles.feedback} ${feedback.ok ? styles.feedbackOk : styles.feedbackFail}`}>
            {feedback.text}
          </div>
        )}

        <footer className={styles.footer}>
          <button
            className={styles.submitButton}
            onClick={handleSubmit}
            disabled={!pickCityId || playerCapitalGold < 300}
          >{t('築壘', 'Build')}</button>
        </footer>
      </div>
    </div>
  );
}
