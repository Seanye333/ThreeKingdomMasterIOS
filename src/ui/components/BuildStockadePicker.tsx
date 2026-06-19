import { useMemo, useState } from 'react';
import { useGameStore } from '../../game/state/store';
import { FACILITY_DEFS, type EntityId, type FacilityKind } from '../../game/types';
import styles from './MarriagePicker.module.css';
import { Name } from './Name';
import { useT, useLanguage } from '../i18n';

interface Props { onClose: () => void; }

type BuildKind = 'stockade' | FacilityKind;

// What you can build on the strategic map. 壘 blocks & must be assaulted; the
// 施設 act on armies marching nearby each season. (陣/防壁 land next.)
const STOCKADE_COST = 300;
const BUILD_TYPES: Array<{
  id: BuildKind; zh: string; en: string; cost: number; descZh: string; descEn: string; color: string;
}> = [
  { id: 'stockade', zh: '壘', en: 'Stockade', cost: STOCKADE_COST,
    descZh: '臨時木堡，阻擋並需被攻打', descEn: 'Temporary fort — blocks, must be assaulted', color: '#9a8358' },
  { id: 'tower', zh: FACILITY_DEFS.tower.name.zh, en: FACILITY_DEFS.tower.name.en, cost: FACILITY_DEFS.tower.cost,
    descZh: `近射 · 過路敵軍每半月 −${FACILITY_DEFS.tower.power} 兵`, descEn: `Short range · −${FACILITY_DEFS.tower.power} troops/half-month to passing foes`, color: FACILITY_DEFS.tower.color },
  { id: 'catapult', zh: FACILITY_DEFS.catapult.name.zh, en: FACILITY_DEFS.catapult.name.en, cost: FACILITY_DEFS.catapult.cost,
    descZh: `遠射高傷 · 每半月 −${FACILITY_DEFS.catapult.power} 兵`, descEn: `Long range, heavy · −${FACILITY_DEFS.catapult.power} troops/half-month`, color: FACILITY_DEFS.catapult.color },
  { id: 'camp', zh: FACILITY_DEFS.camp.name.zh, en: FACILITY_DEFS.camp.name.en, cost: FACILITY_DEFS.camp.cost,
    descZh: `補給 · 友軍過境每半月回 +${FACILITY_DEFS.camp.power} 兵`, descEn: `Supply · friendly columns +${FACILITY_DEFS.camp.power} troops/half-month`, color: FACILITY_DEFS.camp.color },
  { id: 'wall', zh: FACILITY_DEFS.wall.name.zh, en: FACILITY_DEFS.wall.name.en, cost: FACILITY_DEFS.wall.cost,
    descZh: '阻斷 · 敵軍行軍經過受阻滯(每半月約半數機率攔停)', descEn: 'Barricade · stalls passing enemy marches (~50% per half-month)', color: FACILITY_DEFS.wall.color },
];

export function BuildStockadePicker({ onClose }: Props) {
  const playerForceId = useGameStore((s) => s.playerForceId);
  const cities = useGameStore((s) => s.cities);
  const buildStockade = useGameStore((s) => s.buildStockade);
  const buildFacility = useGameStore((s) => s.buildFacility);
  const playerCapitalGold = useGameStore((s) => {
    const f = playerForceId ? s.forces[playerForceId] : null;
    const c = f ? s.cities[f.capitalCityId] : null;
    return c?.gold ?? 0;
  });

  const [kind, setKind] = useState<BuildKind>('stockade');
  const [pickCityId, setPickCityId] = useState<EntityId | null>(null);
  const [label, setLabel] = useState('');
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);
  const t = useT();
  const lang = useLanguage();

  const sel = BUILD_TYPES.find((b) => b.id === kind)!;

  const ownedCities = useMemo(() =>
    Object.values(cities)
      .filter((c) => c.ownerForceId === playerForceId)
      .sort((a, b) => b.troops - a.troops),
  [cities, playerForceId]);

  const handleSubmit = () => {
    if (!pickCityId) return;
    const r = kind === 'stockade'
      ? buildStockade(pickCityId, label.trim() || '壘')
      : buildFacility(pickCityId, kind, label.trim());
    setFeedback({ ok: r.ok, text: r.message });
    if (r.ok) setLabel('');
  };

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <header className={styles.header}>
          <div>
            <div className={styles.titleZh}>{t('築堡 · 施設', 'Build · Facilities')}</div>
            <div className={styles.titleEn}>
              {lang === 'en' ? `${sel.en} · ${sel.cost}g` : `${sel.zh} · ${sel.cost}金`}
            </div>
          </div>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </header>

        <div className={styles.meta}>
          {t(`箭樓/投石臺會自動轟擊路過的敵軍。國庫金：${playerCapitalGold}`,
             `Towers & catapults shell enemy armies passing within range. Capital gold: ${playerCapitalGold}g.`)}
        </div>

        {/* Type selector */}
        <div style={{ display: 'flex', gap: '0.35rem', padding: '0.5rem 0.8rem 0', flexWrap: 'wrap' }}>
          {BUILD_TYPES.map((b) => {
            const on = kind === b.id;
            return (
              <button
                key={b.id}
                onClick={() => setKind(b.id)}
                title={lang === 'en' ? b.descEn : b.descZh}
                style={{
                  flex: '1 1 30%', minWidth: 90, padding: '0.4rem 0.5rem',
                  background: on ? 'rgba(212,168,74,0.16)' : '#10161e',
                  border: `1px solid ${on ? b.color : '#26323e'}`,
                  color: on ? '#eef4f8' : '#a08a60', cursor: 'pointer',
                  fontFamily: 'var(--tkm-font-body)', textAlign: 'left',
                }}
              >
                <div style={{ fontSize: '0.85rem', color: on ? b.color : undefined }}>
                  {lang === 'en' ? b.en : b.zh} <span style={{ float: 'right', opacity: 0.8 }}>{b.cost}g</span>
                </div>
                <div style={{ fontSize: '0.58rem', color: '#7a8893', marginTop: 2, lineHeight: 1.25 }}>
                  {lang === 'en' ? b.descEn : b.descZh}
                </div>
              </button>
            );
          })}
        </div>

        <div style={{ padding: '0.5rem 0.8rem' }}>
          <input
            placeholder={lang === 'en' ? `${sel.en} name (optional)` : `${sel.zh}名（可留空）`}
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            style={{
              width: '100%', padding: '0.4rem 0.6rem',
              background: '#10161e', color: '#eef4f8',
              border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px',
              fontFamily: 'var(--tkm-font-body)',
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
                      <span className={styles.officerNameZh}><Name pair={c.name} /></span>
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
            disabled={!pickCityId || playerCapitalGold < sel.cost}
          >{lang === 'en' ? `Build ${sel.en}` : `築 ${sel.zh}`}</button>
        </footer>
      </div>
    </div>
  );
}
