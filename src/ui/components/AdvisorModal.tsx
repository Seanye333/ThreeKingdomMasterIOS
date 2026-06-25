import { useMemo, useState } from 'react';
import { useEscapeKey } from '../hooks/useEscapeKey';
import { useGameStore } from '../../game/state/store';
import { adviseTips, pickAdvisor, type AdvisorTip } from '../../game/systems/advisor';
import { OfficerAvatar } from './OfficerAvatar';
import { useT } from '../i18n';

/**
 * 軍師錦囊 — three reads of the board from your sharpest mind, each
 * with a 照辦 button that fires the real order. Advice recomputes
 * after every execution so the next tip reflects the new state.
 */
export function AdvisorModal({ onClose }: { onClose: () => void }) {
  useEscapeKey(onClose);
  const cities = useGameStore((s) => s.cities);
  const officers = useGameStore((s) => s.officers);
  const armies = useGameStore((s) => s.armies);
  const pendingCommands = useGameStore((s) => s.pendingCommands);
  const pendingTrainings = useGameStore((s) => s.pendingTrainings);
  const playerForceId = useGameStore((s) => s.playerForceId);
  const season = useGameStore((s) => s.date.season);
  const issueCommand = useGameStore((s) => s.issueCommand);
  const tradeFood = useGameStore((s) => s.tradeFood);
  const t = useT();
  const [done, setDone] = useState<Record<string, string>>({});
  const reduced = typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const anim = (s: string) => (reduced ? undefined : s);

  const advisor = useMemo(
    () => (playerForceId ? pickAdvisor(officers, playerForceId) : null),
    [officers, playerForceId],
  );

  const tips = useMemo(() => {
    if (!playerForceId) return [];
    return adviseTips({
      cities,
      officers,
      armies,
      busyOfficerIds: new Set([
        ...Object.keys(pendingCommands),
        ...pendingTrainings.map((tr) => tr.officerId),
      ]),
      playerForceId,
      season,
    });
  }, [cities, officers, armies, pendingCommands, pendingTrainings, playerForceId, season]);

  const execute = (tip: AdvisorTip) => {
    if (tip.action.kind === 'command') {
      const r = issueCommand(tip.action.cityId, tip.action.type, tip.action.officerId);
      setDone((d) => ({ ...d, [tip.id]: r.ok ? t('✓ 已照辦', '✓ Done') : (r.reason ?? t('未能執行', 'Failed')) }));
    } else if (tip.action.kind === 'trade') {
      const r = tradeFood(tip.action.cityId, tip.action.trade, tip.action.amount);
      setDone((d) => ({ ...d, [tip.id]: r.ok ? t(`✓ 已成交(得${r.got.toLocaleString()})`, `✓ Traded (+${r.got.toLocaleString()})`) : t('未能成交', 'Failed') }));
    }
  };

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'grid', placeItems: 'center', zIndex: 900, padding: '1rem' }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'linear-gradient(160deg,#1b2531,#10161e)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px',
          width: 'min(560px,100%)', maxHeight: '85vh', overflowY: 'auto',
          color: '#e6edf3', fontFamily: 'var(--tkm-font-body)', padding: '1rem 1.3rem',
          animation: anim('tkmVictorySub 0.4s cubic-bezier(0.16,1,0.3,1) both'),
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.7rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {advisor && (
              <span style={{ display: 'inline-flex', borderRadius: '50%', boxShadow: '0 0 16px rgba(212,168,74,0.55)', animation: anim('tkmPortraitRise 0.6s cubic-bezier(0.2,0.9,0.3,1) both') }}>
                <OfficerAvatar officer={advisor} size={42} />
              </span>
            )}
            <div>
              <div style={{ fontSize: '1.15rem', color: '#e6c473', letterSpacing: '0.07rem' }}>🧠 {t('軍師錦囊', 'Advisor')}</div>
              <div style={{ fontSize: '0.72rem', color: '#7a8893' }}>
                {advisor ? t(`${advisor.name.zh} 進言`, `${advisor.name.en} counsels`) : t('幕僚進言', 'Your aides counsel')}
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#e6c473', fontSize: '1.4rem', cursor: 'pointer' }}>×</button>
        </div>

        {tips.length === 0 && (
          <div style={{ color: '#7a8893', fontSize: '0.85rem', padding: '1rem 0' }}>
            {t('「眼下並無燃眉之急,主公可從容布局。」', '"Nothing burns today, my lord — plan at leisure."')}
          </div>
        )}
        {tips.map((tip, i) => (
          <div key={tip.id} style={{
            border: '1px solid #26323e', background: '#10161e',
            padding: '0.6rem 0.8rem', marginBottom: '0.5rem',
            display: 'flex', alignItems: 'center', gap: 10,
            animation: anim(`tkmVictorySub 0.34s ease-out ${0.15 + i * 0.07}s both`),
          }}>
            <div style={{ flex: 1, fontSize: '0.85rem', lineHeight: 1.6 }}>{t(tip.zh, tip.en)}</div>
            {done[tip.id] ? (
              <span style={{ fontSize: '0.75rem', color: '#9ed68a', whiteSpace: 'nowrap', display: 'inline-block', animation: anim('tkmRapportPop 0.5s ease-out') }}>{done[tip.id]}</span>
            ) : tip.action.kind !== 'none' ? (
              <button
                onClick={() => execute(tip)}
                style={{
                  background: 'linear-gradient(180deg,#3a2d18,#2a1f10)', border: '1px solid #e6c473',
                  color: '#f2dd9a', padding: '0.35rem 0.9rem', cursor: 'pointer',
                  fontFamily: 'inherit', letterSpacing: '0.05rem', whiteSpace: 'nowrap',
                }}
              >{t('照辦', 'Do it')}</button>
            ) : (
              <span style={{ fontSize: '0.7rem', color: '#5f6c76', whiteSpace: 'nowrap' }}>{t('參考', 'FYI')}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
