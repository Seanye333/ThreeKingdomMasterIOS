import { useGameStore } from '../../game/state/store';
import { useT, useLanguage } from '../i18n';
import { Modal } from './Modal';

/**
 * 一代記落幕 — the closing card for a roguelike career run.
 *
 * This replaces the last native `alert()` left in the app. It fired mid-reducer
 * from endSeason, which is why it survived the panel-level sweep: the store
 * cannot render, so the fix was to write the epilogue as state and show it here.
 *
 * Deliberately quiet: a run that just ended deserves a moment, not a fanfare.
 */
export function CareerEpilogueModal() {
  const epilogue = useGameStore((s) => s.careerEpilogue);
  const dismiss = useGameStore((s) => s.dismissCareerEpilogue);
  const t = useT();
  const lang = useLanguage();
  if (!epilogue) return null;

  const name = lang === 'en' ? epilogue.nameEn : epilogue.nameZh;
  const status = lang === 'en' ? epilogue.statusEn : epilogue.statusZh;

  const stat = (label: string, value: number) => (
    <div style={{ textAlign: 'center', minWidth: 72 }}>
      <div style={{ fontSize: '1.15rem', color: '#e6c473', fontFamily: 'ui-monospace, monospace' }}>
        {value.toLocaleString()}
      </div>
      <div style={{ fontSize: '0.7rem', color: '#8a98a4', marginTop: 2 }}>{label}</div>
    </div>
  );

  return (
    <Modal
      onClose={dismiss}
      width="min(460px, 100%)"
      title={t('一代記落幕', 'A Life Ends')}
      badge={t(`第 ${epilogue.runNumber} 世`, `Run #${epilogue.runNumber}`)}
    >
      <div style={{ textAlign: 'center', padding: '0.4rem 0 0.2rem' }}>
        <div style={{ fontSize: '1.3rem', color: '#f2dd9a', letterSpacing: '0.06em' }}>{name}</div>
        <div style={{ fontSize: '0.82rem', color: '#a8b4bf', marginTop: 6 }}>
          {t(`終為${status}(品 ${epilogue.rank})`, `Died as ${status} (rank ${epilogue.rank})`)}
        </div>
      </div>

      <div style={{
        display: 'flex', justifyContent: 'center', gap: 14, flexWrap: 'wrap',
        margin: '14px 0 10px', padding: '0.7rem 0.4rem',
        background: 'rgba(255,255,255,0.03)', border: '1px solid #26323e',
        borderRadius: 'var(--tkm-radius-sm)',
      }}>
        {stat(t('歷戰勝', 'Battles won'), epilogue.battlesWon)}
        {stat(t('殲敵', 'Enemy slain'), epilogue.kills)}
        {stat(t('拔城', 'Cities taken'), epilogue.cities)}
        {stat(t('單挑勝', 'Duels won'), epilogue.duels)}
      </div>

      <div style={{ fontSize: '0.74rem', color: '#8a98a4', lineHeight: 1.6, textAlign: 'center' }}>
        {t('此局至此而終。功過已入史筆,來世再見。',
           'The campaign ends here. The record stands; begin again when you are ready.')}
      </div>
    </Modal>
  );
}
