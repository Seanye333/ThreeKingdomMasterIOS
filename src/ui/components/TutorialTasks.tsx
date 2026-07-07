import { useEffect, useMemo, useRef, useState } from 'react';
import { useGameStore } from '../../game/state/store';
import { playSfx } from '../../game/systems/sound';
import { useT } from '../i18n';

/**
 * 教學任務 — the interactive successor to the slideshow: five real
 * actions, each watched in the store and ticked the moment the player
 * actually does it. Shows only in a campaign's first dozen ticks and
 * never again once completed or dismissed (per device).
 */
const DONE_KEY = 'tkm-tutorial-tasks-v1';

export function TutorialTasks() {
  const t = useT();
  const playerForceId = useGameStore((s) => s.playerForceId);
  const forces = useGameStore((s) => s.forces);
  const selectedCityId = useGameStore((s) => s.selectedCityId);
  const pendingCommands = useGameStore((s) => s.pendingCommands);
  const cityDelegations = useGameStore((s) => s.cityDelegations ?? {});
  const armies = useGameStore((s) => s.armies);
  const officers = useGameStore((s) => s.officers);
  const seasonsPlayed = useGameStore((s) => s.campaignStats.seasonsPlayed ?? 0);
  const tutorialStep = useGameStore((s) => s.tutorialStep);

  const [dismissed, setDismissed] = useState(() => {
    try { return localStorage.getItem(DONE_KEY) === '1'; } catch { return false; }
  });
  const [startSeasons] = useState(seasonsPlayed);
  const [collapsed, setCollapsed] = useState(false);

  const capital = playerForceId ? forces[playerForceId]?.capitalCityId : null;

  const tasks = useMemo(() => {
    const myCommand = Object.values(pendingCommands).some((c) => {
      const o = officers[c.officerId];
      return o?.forceId === playerForceId;
    });
    const myArmy = Object.values(armies).some((a) => a.forceId === playerForceId);
    return [
      { zh: '點選你的首都', en: 'Select your capital', done: !!selectedCityId && selectedCityId === capital, hint: '地圖上點它,或按 Tab' },
      { zh: '下一道內政令', en: 'Issue an internal order', done: myCommand, hint: '進城 → 勸農/勸商/徵兵任一' },
      { zh: '委任一位太守', en: 'Delegate a governor', done: Object.keys(cityDelegations).length > 0, hint: '城內指令面板頂部的「太守」下拉' },
      { zh: '發起一次出陣', en: 'March an army', done: myArmy, hint: '選自家城 → ⚔出陣,或快捷輪盤' },
      { zh: '結束一旬', en: 'End a tick', done: seasonsPlayed > startSeasons, hint: '右上「下旬→」或按空格' },
    ];
  }, [pendingCommands, officers, playerForceId, armies, selectedCityId, capital, cityDelegations, seasonsPlayed, startSeasons]);

  const doneCount = tasks.filter((x) => x.done).length;
  const allDone = doneCount === tasks.length;

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
  if (dismissed || seasonsPlayed > 12 || tutorialStep !== null) return null;

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
          {t('五事皆成 · 出師矣!', 'First steps complete!')}
        </div>
        <div style={{ fontSize: '0.7rem', color: '#b8a878', lineHeight: 1.5 }}>
          {t('新手引導功成身退,天下在前。', 'The checklist bows out — the realm awaits.')}
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
          🎓 {t('新手五事', 'First steps')} {doneCount}/{tasks.length}
        </span>
        <span style={{ display: 'flex', gap: 6 }}>
          <span style={{ color: '#7a8893', fontSize: '0.7rem' }}>{collapsed ? '▸' : '▾'}</span>
          <span onClick={(e) => { e.stopPropagation(); markDismissed(); }} style={{ color: '#7a8893', cursor: 'pointer', fontSize: '0.75rem' }}>✕</span>
        </span>
      </div>
      {!collapsed && (
        <div style={{ padding: '0 0.6rem 0.5rem' }}>
          {tasks.map((task, i) => (
            <div key={i} title={task.hint} style={{
              fontSize: '0.74rem', lineHeight: 1.9,
              color: task.done ? '#9ed68a' : '#aab6c0',
              textDecoration: task.done ? 'line-through' : 'none',
            }}>
              {task.done ? '☑' : '☐'} {t(task.zh, task.en)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
