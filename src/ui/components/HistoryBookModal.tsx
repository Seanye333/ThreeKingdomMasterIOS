import { useMemo } from 'react';
import { useGameStore } from '../../game/state/store';
import { composeHistoryBook, historyBookToText } from '../../game/systems/historyBook';
import { useT } from '../i18n';
import { Modal } from './Modal';

/**
 * 本朝史書 — the compiled scroll, readable mid-campaign (annals so far)
 * and definitive at the end. 導出 downloads the plain-text scroll.
 */
export function HistoryBookModal({ onClose }: { onClose: () => void }) {
  const t = useT();
  const playerForceId = useGameStore((s) => s.playerForceId);
  const forces = useGameStore((s) => s.forces);
  const officers = useGameStore((s) => s.officers);
  const cities = useGameStore((s) => s.cities);
  const deeds = useGameStore((s) => s.deeds);
  const battleHistory = useGameStore((s) => s.battleHistory);
  const chronicle = useGameStore((s) => s.chronicle ?? []);
  const victoryStatus = useGameStore((s) => s.victoryStatus);
  const year = useGameStore((s) => s.date.year);
  // Start year: the earliest annal (campaigns chronicle from tick one).
  const scenarioStartYear = chronicle.length > 0 ? Math.min(...chronicle.map((e) => e.year)) : year;

  const sections = useMemo(() => composeHistoryBook({
    playerForceId, forces, officers, cities, deeds, battleHistory,
    chronicle, victoryStatus, startYear: scenarioStartYear, currentYear: year,
  }), [playerForceId, forces, officers, cities, deeds, battleHistory, chronicle, victoryStatus, scenarioStartYear, year]);

  const forceName = playerForceId ? forces[playerForceId]?.name.zh ?? '本朝' : '本朝';

  const exportText = () => {
    const blob = new Blob([historyBookToText(sections, forceName)], { type: 'text/plain;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${forceName}本紀-${year}年.txt`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <Modal
      onClose={onClose}
      scrollBody
      width="min(680px, 100%)"
      maxHeight="88vh"
      padding="1rem 1.6rem"
      frameStyle={{ background: 'linear-gradient(160deg,#2e2418,#10161e)', border: '1px solid #c9a64e' }}
      icon="📜"
      title={`《${forceName}本紀》`}
      badge={victoryStatus === 'playing' ? t('未完之卷 — 至今實錄', 'The unfinished scroll — annals so far') : t('定本', 'Definitive edition')}
      headerRight={
        <button
          onClick={exportText}
          style={{ background: '#1b2531', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#e6c473', padding: '0.3rem 0.8rem', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.78rem' }}
        >⬇ {t('導出', 'Export')}</button>
      }
    >
          {sections.map((sec) => (
            <div key={sec.title} style={{ marginBottom: '1.1rem' }}>
              <div style={{
                fontSize: '0.95rem', color: '#c9a64e', letterSpacing: '0.14rem',
                borderBottom: '1px dashed #2b3845', paddingBottom: 4, marginBottom: 8,
              }}>{sec.title}</div>
              {sec.lines.map((l, i) => (
                <p key={i} style={{ margin: '0 0 0.4rem', fontSize: '0.85rem', lineHeight: 1.9, color: '#cdb88f' }}>{l}</p>
              ))}
            </div>
          ))}
    </Modal>
  );
}
