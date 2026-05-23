import { useMemo, useState } from 'react';
import { SCENARIOS } from '../../game/data';
import { useGameStore } from '../../game/state/store';
import type { Difficulty } from '../../game/state/gameState';
import type { Scenario } from '../../game/types';
import { AchievementsModal } from '../components/AchievementsModal';
import { CustomOfficerCreator } from '../components/CustomOfficerCreator';
import { ItemsBrowser } from '../components/ItemsBrowser';
import { FormationsModal } from '../components/FormationsModal';
import { SaveSlotsModal } from '../components/SaveSlotsModal';
import { ScenarioOfficersBrowser } from '../components/ScenarioOfficersBrowser';
import styles from './TitleScreen.module.css';

const DIFFICULTIES: Array<{ id: Difficulty; en: string; zh: string; note: string }> = [
  { id: 'easy',   en: 'Easy',   zh: '初級', note: 'Your starting troops +20%. AI attacks more cautiously.' },
  { id: 'normal', en: 'Normal', zh: '中級', note: 'Default balance.' },
  { id: 'hard',   en: 'Hard',   zh: '上級', note: 'AI starting troops +20%. AI attacks aggressively.' },
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
  const enterCareerMode = useGameStore((s) => s.enterCareerMode);
  const setRomanceMode = useGameStore((s) => s.setRomanceMode);
  const setRoguelikeMode = useGameStore((s) => s.setRoguelikeMode);

  const scenario = useMemo<Scenario>(
    () => SCENARIOS.find((s) => s.id === scenarioId) ?? SCENARIOS[0],
    [scenarioId],
  );
  const startYear = scenario.startDate.year;

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <h1 className={styles.title}>
          <span className={styles.titleZh}>三國志</span>
          <span className={styles.titleEn}>Three Kingdom Masters</span>
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
          <div className={styles.scenarioLabel}>Scenario 戰役</div>
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
                    <span className={styles.scenarioNameZh}>{s.name.zh}</span>
                    <span className={styles.scenarioNameEn}>{s.name.en}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>

          <p className={styles.scenarioDesc}>{scenario.description}</p>

          <div className={styles.difficultyLabel}>Difficulty 難易度</div>
          <div className={styles.difficultyRow}>
            {DIFFICULTIES.map((d) => (
              <button
                key={d.id}
                className={`${styles.diffButton} ${difficulty === d.id ? styles.diffSelected : ''}`}
                onClick={() => setDifficulty(d.id)}
                title={d.note}
              >
                <span className={styles.diffZh}>{d.zh}</span>
                <span className={styles.diffEn}>{d.en}</span>
              </button>
            ))}
          </div>
          <p className={styles.difficultyNote}>
            {DIFFICULTIES.find((d) => d.id === difficulty)?.note}
          </p>

          <button
            className={styles.officersButton}
            onClick={() => setShowOfficers(true)}
          >
            武将一覧 · Browse All Officers
          </button>
          <button
            className={styles.officersButton}
            onClick={() => setShowItems(true)}
            style={{ marginTop: '0.5rem' }}
          >
            名品一覧 · Browse All Famous Items
          </button>
          <button
            className={styles.officersButton}
            onClick={() => setShowFormations(true)}
            style={{ marginTop: '0.5rem' }}
          >
            陣形一覽 · Browse All Formations
          </button>
          <button
            className={styles.officersButton}
            onClick={() => setShowCustomOfficer(true)}
            style={{ marginTop: '0.5rem' }}
          >
            自定義武將 · Create Your Own Officer
          </button>
          <button
            className={styles.officersButton}
            onClick={() => setShowLoad(true)}
            style={{ marginTop: '0.5rem' }}
          >
            載入 · Load Saved Game
          </button>
          <button
            className={styles.officersButton}
            onClick={() => {
              const count = Number(prompt('How many forces? (3–8)', '5') ?? '5');
              const year = Number(prompt('Year? (180–240)', '200') ?? '200');
              if (count >= 2 && count <= 10 && year >= 100 && year <= 280) {
                loadRandom(count, year);
              }
            }}
            style={{ marginTop: '0.5rem' }}
          >
            随机剧本 · Random Scenario
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
             Hot-seat (players share keyboard)
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
            列傳 Career mode (pick one officer as your avatar)
          </label>
          <label style={{ display: 'block', marginTop: '0.3rem', fontSize: '0.78rem', color: '#8a7050', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={romance}
              onChange={(e) => { setRomance(e.target.checked); setRomanceMode(e.target.checked); }}
              style={{ marginRight: '0.4rem' }}
            />
            演義 Romance mode (historical events fire on schedule)
          </label>
          <label style={{ display: 'block', marginTop: '0.3rem', fontSize: '0.78rem', color: '#8a7050', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={roguelike}
              onChange={(e) => { setRoguelike(e.target.checked); setRoguelikeMode(e.target.checked); }}
              style={{ marginRight: '0.4rem' }}
              disabled={!careerMode}
            />
             Roguelike (career officer death = game over; requires Career mode)
          </label>
          <button
            onClick={() => setShowAchievements(true)}
            className={styles.officersButton}
            style={{ marginTop: '0.5rem' }}
          >
            勳功 · Achievements
          </button>
        </section>

        <section className={styles.forceSection}>
          <div className={styles.forceLabel}>
            Choose your force 君主選択 · {startYear} AD
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
                          'How many human players? (2–4)',
                          '2',
                        );
                        const n = Math.max(2, Math.min(4, Number(human) || 2));
                        const allForces = scenario.forces.slice(0, n);
                        setHotSeatPlayers(
                          allForces.map((f, i) => ({
                            forceId: f.id,
                            label: `P${i + 1}: ${f.name.en}`,
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
                          .map((o, i) => `${i + 1}. ${o.name.zh} ${o.name.en} (W${o.stats.war} I${o.stats.intelligence})`)
                          .join('\n');
                        const choice = prompt(
                          `Career officer — pick a number:\n\n${list}`,
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
                      <span className={styles.forceNameZh}>{force.name.zh}</span>
                      <span className={styles.forceNameEn}>{ruler.name.en}</span>
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
    </div>
  );
}
