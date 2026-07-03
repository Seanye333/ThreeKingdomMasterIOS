import { useMemo, useState } from 'react';
import { useGameStore } from '../../game/state/store';
import { composeHistoryBook, historyBookToText } from '../../game/systems/historyBook';
import { composeRomance, romanceToText } from '../../game/systems/romance';
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
  const [mode, setMode] = useState<'annals' | 'romance'>('annals');
  // Start year: the earliest annal (campaigns chronicle from tick one).
  const scenarioStartYear = chronicle.length > 0 ? Math.min(...chronicle.map((e) => e.year)) : year;

  const forceName = playerForceId ? forces[playerForceId]?.name.zh ?? '本朝' : '本朝';

  const sections = useMemo(() => composeHistoryBook({
    playerForceId, forces, officers, cities, deeds, battleHistory,
    chronicle, victoryStatus, startYear: scenarioStartYear, currentYear: year,
  }), [playerForceId, forces, officers, cities, deeds, battleHistory, chronicle, victoryStatus, scenarioStartYear, year]);

  const romance = useMemo(() => composeRomance({
    chronicle, forceNameZh: forceName, victoryStatus,
  }), [chronicle, forceName, victoryStatus]);

  // Unify display: both forms render as titled sections.
  const display = mode === 'annals'
    ? sections
    : romance.chapters.map((c) => ({ title: c.title, lines: c.lines }));

  const exportText = () => {
    const text = mode === 'annals'
      ? historyBookToText(sections, forceName)
      : romanceToText(romance);
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = mode === 'annals' ? `${forceName}本紀-${year}年.txt` : `${forceName}演義-${year}年.txt`;
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
      title={mode === 'annals' ? `《${forceName}本紀》` : romance.bookTitle}
      badge={victoryStatus === 'playing' ? t('未完之卷 — 至今實錄', 'The unfinished scroll — annals so far') : t('定本', 'Definitive edition')}
      headerRight={
        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
          <button
            onClick={() => setMode(mode === 'annals' ? 'romance' : 'annals')}
            style={{ background: '#1b2531', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 'var(--tkm-radius)', color: '#e6c473', padding: '0.3rem 0.8rem', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.78rem' }}
            title={t('在紀傳體《本紀》與章回體《演義》間切換', 'Toggle between the annals and the romance')}
          >{mode === 'annals' ? t('改讀演義', 'Read as Romance') : t('改讀本紀', 'Read as Annals')}</button>
          <button
            onClick={exportText}
            style={{ background: '#1b2531', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 'var(--tkm-radius)', color: '#e6c473', padding: '0.3rem 0.8rem', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.78rem' }}
          >⬇ {t('導出', 'Export')}</button>
        </div>
      }
    >
          {display.map((sec) => (
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
