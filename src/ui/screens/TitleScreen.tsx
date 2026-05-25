import { useMemo, useState } from 'react';
import { SCENARIOS } from '../../game/data';
import { useGameStore } from '../../game/state/store';
import type { Difficulty } from '../../game/state/gameState';
import type { Scenario } from '../../game/types';
import { AchievementsModal } from '../components/AchievementsModal';
import { CustomOfficerCreator } from '../components/CustomOfficerCreator';
import { ItemsBrowser } from '../components/ItemsBrowser';
import { FormationsModal } from '../components/FormationsModal';
import { TacticsModal } from '../components/TacticsModal';
import { PoliciesModal } from '../components/PoliciesModal';
import { TraitsModal } from '../components/TraitsModal';
import { SkillsModal } from '../components/SkillsModal';
import { SaveSlotsModal } from '../components/SaveSlotsModal';
import { SettingsModal } from '../components/SettingsModal';
import { ScenarioOfficersBrowser } from '../components/ScenarioOfficersBrowser';
import { useT, useLanguage, useDesc } from '../i18n';
import styles from './TitleScreen.module.css';

const DIFFICULTIES: Array<{ id: Difficulty; en: string; zh: string; noteZh: string; noteEn: string }> = [
  { id: 'easy',   en: 'Easy',   zh: '初級', noteZh: '我方初始兵力 +20%。AI 攻擊較保守。', noteEn: 'Your starting troops +20%. AI attacks more cautiously.' },
  { id: 'normal', en: 'Normal', zh: '中級', noteZh: '預設平衡。',                              noteEn: 'Default balance.' },
  { id: 'hard',   en: 'Hard',   zh: '上級', noteZh: 'AI 初始兵力 +20%。AI 攻擊較積極。',     noteEn: 'AI starting troops +20%. AI attacks aggressively.' },
];

export function TitleScreen() {
  const loadScenario = useGameStore((s) => s.loadScenario);
  const loadRandom = useGameStore((s) => s.loadRandomScenario);
  const setTutorialStep = useGameStore((s) => s.setTutorialStep);
  const setHotSeatPlayers = useGameStore((s) => s.setHotSeatPlayers);
  const [scenarioId, setScenarioId] = useState<string>(SCENARIOS[0].id);
  const [difficulty, setDifficulty] = useState<Difficulty>('normal');
  const [showOfficers, setShowOfficers] = useState(false);
  const [showCustomOfficer, setShowCustomOfficer] = useState(false);
  const [showLoad, setShowLoad] = useState(false);
  const [hotSeatMode, setHotSeatMode] = useState(false);
  const [careerMode, setCareerMode] = useState(false);
  const [romance, setRomance] = useState(false);
  const [roguelike, setRoguelike] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const [showItems, setShowItems] = useState(false);
  const [showFormations, setShowFormations] = useState(false);
  const [showTactics, setShowTactics] = useState(false);
  const [showPolicies, setShowPolicies] = useState(false);
  const [showTraits, setShowTraits] = useState(false);
  const [showSkills, setShowSkills] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const enterCareerMode = useGameStore((s) => s.enterCareerMode);
  const setRomanceMode = useGameStore((s) => s.setRomanceMode);
  const setRoguelikeMode = useGameStore((s) => s.setRoguelikeMode);
  const t = useT();
  const lang = useLanguage();
  const desc = useDesc();

  const scenario = useMemo<Scenario>(
    () => SCENARIOS.find((s) => s.id === scenarioId) ?? SCENARIOS[0],
    [scenarioId],
  );
  const startYear = scenario.startDate.year;

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <h1 className={styles.title}>
          {lang !== 'en' && <span className={styles.titleZh}>三國志</span>}
          {lang !== 'zh' && <span className={styles.titleEn}>Three Kingdom Masters</span>}
          <svg
            className="tkm-brush-stroke"
            viewBox="0 0 300 80"
            style={{ display: 'block', margin: '0.5rem auto 0', maxWidth: 300, opacity: 0.85 }}
            fill="none"
            stroke="#d4a84a"
            strokeWidth="3"
            strokeLinecap="round"
          >
            {/* Three flowing brush strokes evoking 三 國 志 */}
            <path d="M 20 25 Q 80 18 145 25" />
            <path d="M 20 45 Q 80 38 145 45" />
            <path d="M 20 65 Q 80 58 145 65" />
            {/* A diagonal calligraphy flourish */}
            <path d="M 180 18 Q 220 40 270 65" style={{ animationDelay: '0.9s' }} />
          </svg>
        </h1>
      </header>

      <main className={styles.main}>
        <section className={styles.scenarioCard}>
          <div className={styles.scenarioLabel}>{t('戰役', 'Scenario')}</div>
          <ul className={styles.scenarioList}>
            {SCENARIOS.map((s) => (
              <li key={s.id}>
                <button
                  className={`${styles.scenarioButton} ${scenarioId === s.id ? styles.scenarioSelected : ''}`}
                  onClick={() => setScenarioId(s.id)}
                >
                  <span className={styles.scenarioYear}>
                    {s.startDate.year} AD
                  </span>
                  <span className={styles.scenarioName}>
                    {lang !== 'en' && <span className={styles.scenarioNameZh}>{s.name.zh}</span>}
                    {lang !== 'zh' && <span className={styles.scenarioNameEn}>{s.name.en}</span>}
                  </span>
                  {s.kind === 'whatif' && (
                    <span
                      style={{
                        marginLeft: 'auto',
                        background: '#3a2d20',
                        color: '#c178c7',
                        border: '1px solid #c178c7',
                        padding: '0.08rem 0.4rem',
                        fontSize: '0.6rem',
                        letterSpacing: '0.15rem',
                        borderRadius: 2,
                      }}
                    >
                      {t('假想', 'WHAT-IF')}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>

          <p className={styles.scenarioDesc}>{desc(scenario)}</p>

          <div className={styles.difficultyLabel}>{t('難易度', 'Difficulty')}</div>
          <div className={styles.difficultyRow}>
            {DIFFICULTIES.map((d) => (
              <button
                key={d.id}
                className={`${styles.diffButton} ${difficulty === d.id ? styles.diffSelected : ''}`}
                onClick={() => setDifficulty(d.id)}
                title={t(d.noteZh, d.noteEn)}
              >
                {lang !== 'en' && <span className={styles.diffZh}>{d.zh}</span>}
                {lang !== 'zh' && <span className={styles.diffEn}>{d.en}</span>}
              </button>
            ))}
          </div>
          <p className={styles.difficultyNote}>
            {(() => {
              const d = DIFFICULTIES.find((x) => x.id === difficulty);
              return d ? t(d.noteZh, d.noteEn) : '';
            })()}
          </p>

          <button
            className={styles.officersButton}
            onClick={() => setShowOfficers(true)}
          >
            {t('武將一覽', 'Browse All Officers')}
          </button>
          <button
            className={styles.officersButton}
            onClick={() => setShowItems(true)}
            style={{ marginTop: '0.5rem' }}
          >
            {t('名品一覽', 'Browse All Famous Items')}
          </button>
          <button
            className={styles.officersButton}
            onClick={() => setShowFormations(true)}
            style={{ marginTop: '0.5rem' }}
          >
            {t('陣形一覽', 'Browse All Formations')}
          </button>
          <button
            className={styles.officersButton}
            onClick={() => setShowTactics(true)}
            style={{ marginTop: '0.5rem' }}
          >
            {t('戰法一覽', 'Browse All Tactics')}
          </button>
          <button
            className={styles.officersButton}
            onClick={() => setShowPolicies(true)}
            style={{ marginTop: '0.5rem' }}
          >
            {t('政策一覽', 'Browse All Policies')}
          </button>
          <button
            className={styles.officersButton}
            onClick={() => setShowTraits(true)}
            style={{ marginTop: '0.5rem' }}
          >
            {t('性格一覽', 'Browse All Traits')}
          </button>
          <button
            className={styles.officersButton}
            onClick={() => setShowSkills(true)}
            style={{ marginTop: '0.5rem' }}
          >
            {t('特技一覽', 'Browse All Skills')}
          </button>
          <button
            className={styles.officersButton}
            onClick={() => setShowCustomOfficer(true)}
            style={{ marginTop: '0.5rem' }}
          >
            {t('自定義武將', 'Create Your Own Officer')}
          </button>
          <button
            className={styles.officersButton}
            onClick={() => setShowLoad(true)}
            style={{ marginTop: '0.5rem' }}
          >
            {t('載入存檔', 'Load Saved Game')}
          </button>
          <button
            className={styles.officersButton}
            onClick={() => {
              const count = Number(prompt(t('勢力數量？(3–8)', 'How many forces? (3–8)'), '5') ?? '5');
              const year = Number(prompt(t('年份？(180–240)', 'Year? (180–240)'), '200') ?? '200');
              if (count >= 2 && count <= 10 && year >= 100 && year <= 280) {
                loadRandom(count, year);
              }
            }}
            style={{ marginTop: '0.5rem' }}
          >
            {t('隨機劇本', 'Random Scenario')}
          </button>
          <label
            style={{
              display: 'block',
              marginTop: '0.5rem',
              fontSize: '0.78rem',
              color: '#8a7050',
              cursor: 'pointer',
            }}
          >
            <input
              type="checkbox"
              checked={hotSeatMode}
              onChange={(e) => setHotSeatMode(e.target.checked)}
              style={{ marginRight: '0.4rem' }}
            />
             {t('輪流模式（多人共用鍵盤）', 'Hot-seat (players share keyboard)')}
          </label>
          <label
            style={{
              display: 'block',
              marginTop: '0.3rem',
              fontSize: '0.78rem',
              color: '#8a7050',
              cursor: 'pointer',
            }}
          >
            <input
              type="checkbox"
              checked={careerMode}
              onChange={(e) => setCareerMode(e.target.checked)}
              style={{ marginRight: '0.4rem' }}
            />
            {t('列傳模式（選擇一位武將為主角）', 'Career mode (pick one officer as your avatar)')}
          </label>
          <label style={{ display: 'block', marginTop: '0.3rem', fontSize: '0.78rem', color: '#8a7050', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={romance}
              onChange={(e) => { setRomance(e.target.checked); setRomanceMode(e.target.checked); }}
              style={{ marginRight: '0.4rem' }}
            />
            {t('演義模式（歷史事件按時觸發）', 'Romance mode (historical events fire on schedule)')}
          </label>
          <label style={{ display: 'block', marginTop: '0.3rem', fontSize: '0.78rem', color: '#8a7050', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={roguelike}
              onChange={(e) => { setRoguelike(e.target.checked); setRoguelikeMode(e.target.checked); }}
              style={{ marginRight: '0.4rem' }}
              disabled={!careerMode}
            />
             {t('Roguelike 模式（主角陣亡即遊戲結束；需開啟列傳）', 'Roguelike (career officer death = game over; requires Career mode)')}
          </label>
          <button
            onClick={() => setShowAchievements(true)}
            className={styles.officersButton}
            style={{ marginTop: '0.5rem' }}
          >
            {t('勳功', 'Achievements')}
          </button>
        </section>

        <section className={styles.forceSection}>
          <div className={styles.forceLabel}>
            {t('君主選擇', 'Choose your force')} · {startYear} AD
          </div>
          <ul className={styles.forceList}>
            {scenario.forces.map((force) => {
              const ruler = scenario.officers.find(
                (o) => o.id === force.rulerOfficerId,
              );
              if (!ruler) return null;
              return (
                <li key={force.id}>
                  <button
                    className={styles.forceButton}
                    onClick={() => {
                      if (hotSeatMode) {
                        const human = prompt(
                          t('人類玩家數量？(2–4)', 'How many human players? (2–4)'),
                          '2',
                        );
                        const n = Math.max(2, Math.min(4, Number(human) || 2));
                        const allForces = scenario.forces.slice(0, n);
                        setHotSeatPlayers(
                          allForces.map((f, i) => ({
                            forceId: f.id,
                            label: `P${i + 1}: ${lang === 'zh' ? f.name.zh : f.name.en}`,
                          })),
                        );
                        loadScenario(scenario, allForces[0].id, difficulty);
                      } else {
                        loadScenario(scenario, force.id, difficulty);
                      }
                      // Career mode — let the player pick which officer in this
                      // force is their avatar (defaults to the ruler).
                      if (careerMode) {
                        const officersInForce = scenario.officers.filter(
                          (o) => o.forceId === force.id,
                        );
                        const list = officersInForce
                          .map((o, i) => `${i + 1}. ${lang === 'zh' ? o.name.zh : `${o.name.zh} ${o.name.en}`} (W${o.stats.war} I${o.stats.intelligence})`)
                          .join('\n');
                        const choice = prompt(
                          `${t('列傳主角 — 請輸入編號：', 'Career officer — pick a number:')}\n\n${list}`,
                          '1',
                        );
                        const idx = Math.max(0, Math.min(officersInForce.length - 1, Number(choice) - 1));
                        const picked = officersInForce[idx] ?? officersInForce[0];
                        if (picked) enterCareerMode(picked.id);
                      }
                      setTutorialStep(0);
                    }}
                  >
                    <span
                      className={styles.forceColor}
                      style={{ background: force.color }}
                    />
                    <span className={styles.forceText}>
                      {lang !== 'en' && <span className={styles.forceNameZh}>{force.name.zh}</span>}
                      {lang !== 'zh' && <span className={styles.forceNameEn}>{ruler.name.en}</span>}
                      {lang === 'zh' && <span className={styles.forceNameEn}>{ruler.name.zh}</span>}
                    </span>
                    <span className={styles.forceStats}>
                      W{ruler.stats.war} · I{ruler.stats.intelligence} · P
                      {ruler.stats.politics} · C{ruler.stats.charisma}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      </main>

      {showOfficers && (
        <ScenarioOfficersBrowser
          scenario={scenario}
          onClose={() => setShowOfficers(false)}
        />
      )}
      {showCustomOfficer && (
        <CustomOfficerCreator
          scenario={scenario}
          onClose={() => setShowCustomOfficer(false)}
          onCreate={(custom) => {
            const playerForceId =
              custom.affiliationForceId ?? scenario.forces[0].id;
            loadScenario(scenario, playerForceId, difficulty, {
              id: custom.id,
              name: { zh: custom.zhName, en: custom.enName },
              courtesyName: custom.courtesyZh || custom.courtesyEn
                ? { zh: custom.courtesyZh, en: custom.courtesyEn }
                : undefined,
              stats: custom.stats,
              skills: custom.skills,
              affiliationForceId: custom.affiliationForceId,
            });
          }}
        />
      )}
      {showLoad && (
        <SaveSlotsModal mode="load" onClose={() => setShowLoad(false)} />
      )}
      {showAchievements && (
        <AchievementsModal onClose={() => setShowAchievements(false)} />
      )}
      {showItems && <ItemsBrowser onClose={() => setShowItems(false)} />}
      {showFormations && <FormationsModal onClose={() => setShowFormations(false)} />}
      {showTactics && <TacticsModal onClose={() => setShowTactics(false)} />}
      {showPolicies && <PoliciesModal onClose={() => setShowPolicies(false)} />}
      {showTraits && <TraitsModal onClose={() => setShowTraits(false)} />}
      {showSkills && <SkillsModal onClose={() => setShowSkills(false)} />}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}

      {/* Settings gear in top-right corner */}
      <button
        onClick={() => setShowSettings(true)}
        title="設定 / Settings"
        style={{
          position: 'fixed',
          top: 16, right: 16,
          width: 44, height: 44,
          background: 'rgba(20, 14, 8, 0.85)',
          border: '1px solid #d4a84a',
          color: '#d4a84a',
          fontSize: '1.4rem',
          cursor: 'pointer',
          fontFamily: 'serif',
          boxShadow: '0 0 8px rgba(0,0,0,0.6)',
          zIndex: 50,
        }}
      >⚙</button>
    </div>
  );
}
