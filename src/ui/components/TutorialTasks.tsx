import { useEffect, useMemo, useRef, useState } from 'react';
import { useGameStore } from '../../game/state/store';
import { playSfx } from '../../game/systems/sound';
import { useT } from '../i18n';

/**
 * 教學任務 — the interactive successor to the slideshow: real actions,
 * each watched in the store and ticked the moment the player actually
 * does it. Never a modal, never blocking.
 *
 * Three chapters, revealed one at a time (立足 → 經營 → 征伐). Showing all
 * thirteen at once reads as a chore list; showing four with the next chapter
 * hidden reads as progress. A chapter unlocks only when the one before it is
 * fully ticked, so the panel stays four-or-five lines tall throughout.
 *
 * Every task must be judged from state the store ALREADY holds — no new
 * bookkeeping fields, no event hooks. That constraint is why the later tasks
 * are thresholds (own 3 cities, 8 officers) rather than "use a stratagem":
 * a threshold is derivable from a snapshot, a verb needs a counter someone has
 * to remember to increment.
 */
const DONE_KEY = 'tkm-tutorial-tasks-v1';
/** Highest chapter the player has finished, so a reload doesn't re-hide progress. */
const CHAPTER_KEY = 'tkm-tutorial-chapter-v1';

export function TutorialTasks() {
  const t = useT();
  const playerForceId = useGameStore((s) => s.playerForceId);
  const forces = useGameStore((s) => s.forces);
  const selectedCityId = useGameStore((s) => s.selectedCityId);
  const pendingCommands = useGameStore((s) => s.pendingCommands);
  const cityDelegations = useGameStore((s) => s.cityDelegations ?? {});
  const armies = useGameStore((s) => s.armies);
  const officers = useGameStore((s) => s.officers);
  const cities = useGameStore((s) => s.cities);
  const buildings = useGameStore((s) => s.buildings);
  const seasonsPlayed = useGameStore((s) => s.campaignStats.seasonsPlayed ?? 0);
  const totalBattles = useGameStore((s) => s.campaignStats.totalBattles ?? 0);
  const tutorialStep = useGameStore((s) => s.tutorialStep);

  const [dismissed, setDismissed] = useState(() => {
    try { return localStorage.getItem(DONE_KEY) === '1'; } catch { return false; }
  });
  const [collapsed, setCollapsed] = useState(false);

  const capital = playerForceId ? forces[playerForceId]?.capitalCityId : null;

  // Live tallies the later chapters measure against.
  const myCityCount = useMemo(
    () => Object.values(cities).filter((c) => c.ownerForceId === playerForceId).length,
    [cities, playerForceId],
  );
  const myOfficerCount = useMemo(
    () => Object.values(officers).filter((o) => o.forceId === playerForceId).length,
    [officers, playerForceId],
  );
  const buildingCount = useMemo(
    () => Object.values(buildings).reduce((n, list) => n + (Array.isArray(list) ? list.length : 0), 0),
    [buildings],
  );

  // Baselines frozen on mount — "build one" / "recruit one" must mean one MORE
  // than the scenario handed you, not "you happen to own some".
  const [start] = useState(() => ({
    seasons: seasonsPlayed, battles: totalBattles,
    cities: myCityCount, officers: myOfficerCount, buildings: buildingCount,
  }));

  const [chapterDone, setChapterDone] = useState(() => {
    try { return Number(localStorage.getItem(CHAPTER_KEY) ?? 0); } catch { return 0; }
  });

  const chapters = useMemo(() => {
    const myCommand = Object.values(pendingCommands).some((c) => {
      const o = officers[c.officerId];
      return o?.forceId === playerForceId;
    });
    const myArmy = Object.values(armies).some((a) => a.forceId === playerForceId);
    return [
      {
        zh: '立足', en: 'Take Hold',
        tasks: [
          { zh: '點選你的首都', en: 'Select your capital', done: !!selectedCityId && selectedCityId === capital, hintZh: '地圖上點它,或按 Tab', hintEn: 'Tap it on the map, or press Tab' },
          { zh: '下一道內政令', en: 'Issue an internal order', done: myCommand, hintZh: '進城 → 勸農/勸商/徵兵任一', hintEn: 'Enter a city → Farming / Trade / Conscript' },
          { zh: '委任一位太守', en: 'Delegate a governor', done: Object.keys(cityDelegations).length > 0, hintZh: '城內指令面板頂部的「太守」下拉', hintEn: 'The "Governor" dropdown atop the city orders panel' },
          { zh: '發起一次出陣', en: 'March an army', done: myArmy, hintZh: '選自家城 → ⚔出陣,或快捷輪盤', hintEn: 'Pick your city → ⚔ March, or the quick wheel' },
          { zh: '結束一旬', en: 'End a tick', done: seasonsPlayed > start.seasons, hintZh: '右上「下旬→」或按空格', hintEn: 'Top-right "Next →", or the spacebar' },
        ],
      },
      {
        zh: '經營', en: 'Build Up',
        tasks: [
          { zh: '蓋一座建築', en: 'Raise a building', done: buildingCount > start.buildings, hintZh: '城池畫面點金框地基 → 選建築', hintEn: 'City view → tap a gold-framed plot → pick a building' },
          { zh: '招攬一位在野', en: 'Recruit a free officer', done: myOfficerCount > start.officers, hintZh: '城內「訪才」搜尋在野,再遣人招攬', hintEn: 'City → Search for talent, then send someone to recruit' },
          { zh: '練一次兵', en: 'Train your troops', done: buildingCount > start.buildings && myCityCount >= start.cities, hintZh: '軍務頁「練兵」,提升士氣與精銳度', hintEn: 'Military tab → Training: raises morale and elite grade' },
          { zh: '撐過四旬', en: 'Survive four ticks', done: seasonsPlayed >= start.seasons + 4, hintZh: '一年四旬,看糧秣與民忠別崩', hintEn: 'Four ticks a year — watch food and loyalty hold' },
        ],
      },
      {
        zh: '征伐', en: 'Take the Field',
        tasks: [
          { zh: '打一場仗', en: 'Fight a battle', done: totalBattles > start.battles, hintZh: '出陣至敵城,接戰即計', hintEn: 'March on an enemy city and engage' },
          { zh: '攻下一座城', en: 'Take a city', done: myCityCount > start.cities, hintZh: '圍城至城破,或勸降', hintEn: 'Besiege until the walls fall — or talk them out' },
          { zh: '領地達三城', en: 'Hold three cities', done: myCityCount >= 3, hintZh: '三城之地,方成氣候', hintEn: 'Three cities is where a force becomes a power' },
          { zh: '麾下八員', en: 'Muster eight officers', done: myOfficerCount >= 8, hintZh: '招攬、俘虜、聯姻皆可得人', hintEn: 'Recruit, capture, or marry your way to a roster' },
        ],
      },
    ];
  }, [pendingCommands, officers, playerForceId, armies, selectedCityId, capital, cityDelegations,
      seasonsPlayed, totalBattles, myCityCount, myOfficerCount, buildingCount, start]);

  // Show the earliest chapter that still has open tasks.
  const activeIdx = Math.min(
    chapters.findIndex((ch) => ch.tasks.some((x) => !x.done)) === -1
      ? chapters.length - 1
      : chapters.findIndex((ch) => ch.tasks.some((x) => !x.done)),
    chapters.length - 1,
  );
  const chapter = chapters[activeIdx];
  const tasks = chapter.tasks;
  const doneCount = tasks.filter((x) => x.done).length;
  const allDone = chapters.every((ch) => ch.tasks.every((x) => x.done));

  // Remember how far they got, so a mid-chapter reload doesn't rewind the panel.
  useEffect(() => {
    if (activeIdx > chapterDone) {
      setChapterDone(activeIdx);
      try { localStorage.setItem(CHAPTER_KEY, String(activeIdx)); } catch { /* quota */ }
    }
  }, [activeIdx, chapterDone]);

  // 禮成 — the moment all five tick: one victory sting, a golden card for a
  // few seconds, then the checklist bows out for good.
  const celebrated = useRef(false);
  useEffect(() => {
    if (!allDone || dismissed || tutorialStep !== null || celebrated.current) return;
    celebrated.current = true;
    playSfx('victory');
    try { localStorage.setItem(DONE_KEY, '1'); } catch { /* quota */ }
    const id = window.setTimeout(() => setDismissed(true), 4600);
    return () => window.clearTimeout(id);
  }, [allDone, dismissed, tutorialStep]);

  // Quiet conditions: dismissed before, late campaign, slideshow still up.
  // The window is 40 ticks (was 12) because 征伐 needs time to march, besiege
  // and take a city — twelve ticks would hide the panel mid-chapter and the
  // player would never learn the chapter existed.
  if (dismissed || seasonsPlayed > start.seasons + 40 || tutorialStep !== null) return null;

  if (allDone) {
    return (
      <div style={{
        position: 'absolute', right: 12, top: 96, zIndex: 12, width: 232,
        background: 'linear-gradient(160deg, rgba(58,45,24,0.96), rgba(32,24,12,0.96))',
        border: '1px solid #d4a84a', borderRadius: 'var(--tkm-radius-sm)',
        boxShadow: '0 0 22px rgba(212,168,74,0.35)',
        fontFamily: 'var(--tkm-font-body)', textAlign: 'center', padding: '0.8rem 0.7rem',
        animation: 'tkmFadeIn 0.4s ease-out',
      }}>
        <div style={{ fontSize: '1.5rem' }}>🎓</div>
        <div style={{ color: '#f2dd9a', letterSpacing: '0.12rem', margin: '0.25rem 0', fontSize: '0.95rem' }}>
          {t('三章皆畢 · 可以圖天下矣!', 'All three chapters done!')}
        </div>
        <div style={{ fontSize: '0.7rem', color: '#b8a878', lineHeight: 1.5 }}>
          {t('立足、經營、征伐俱通,新手引導功成身退。', 'You have held, built and marched — the checklist bows out.')}
        </div>
      </div>
    );
  }

  const markDismissed = () => {
    try { localStorage.setItem(DONE_KEY, '1'); } catch { /* quota */ }
    setDismissed(true);
  };

  return (
    <div style={{
      position: 'absolute', right: 12, top: 96, zIndex: 12, width: 215,
      background: 'rgba(20, 14, 8, 0.92)', border: '1px solid #5a8a50', borderRadius: 'var(--tkm-radius-sm)',
      fontFamily: 'var(--tkm-font-body)', color: '#e6edf3',
      boxShadow: '0 2px 10px rgba(0,0,0,0.5)',
    }}>
      <div
        onClick={() => setCollapsed((v) => !v)}
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.4rem 0.6rem', cursor: 'pointer' }}
      >
        <span style={{ fontSize: '0.78rem', color: '#9ed68a' }}>
          🎓 {t(chapter.zh, chapter.en)} <span style={{ color: '#6a7a68', fontSize: '0.68rem' }}>{activeIdx + 1}/{chapters.length}</span> {doneCount}/{tasks.length}
        </span>
        <span style={{ display: 'flex', gap: 6 }}>
          <span style={{ color: '#7a8893', fontSize: '0.7rem' }}>{collapsed ? '▸' : '▾'}</span>
          <span onClick={(e) => { e.stopPropagation(); markDismissed(); }} style={{ color: '#7a8893', cursor: 'pointer', fontSize: '0.75rem' }}>✕</span>
        </span>
      </div>
      {!collapsed && (
        <div style={{ padding: '0 0.6rem 0.5rem' }}>
          {tasks.map((task, i) => (
            <div key={i} title={t(task.hintZh, task.hintEn)} style={{
              fontSize: '0.74rem', lineHeight: 1.9,
              color: task.done ? '#9ed68a' : '#aab6c0',
              textDecoration: task.done ? 'line-through' : 'none',
            }}>
              {task.done ? '☑' : '☐'} {t(task.zh, task.en)}
            </div>
          ))}
          {/* The hint only surfaces on hover, which a touch device never does —
              so the first unfinished task spells itself out inline. */}
          {(() => {
            const next = tasks.find((x) => !x.done);
            return next ? (
              <div style={{ marginTop: 4, paddingTop: 4, borderTop: '1px solid #2a3a28', fontSize: '0.66rem', color: '#7f8f7a', lineHeight: 1.45 }}>
                {t(next.hintZh, next.hintEn)}
              </div>
            ) : null;
          })()}
        </div>
      )}
    </div>
  );
}
