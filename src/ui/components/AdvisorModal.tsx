import { useMemo, useState } from 'react';
import { useEscapeKey } from '../hooks/useEscapeKey';
import { useGameStore } from '../../game/state/store';
import { adviseTips, pickAdvisor, type AdvisorTip } from '../../game/systems/advisor';
import { OfficerAvatar } from './OfficerAvatar';
import { useT } from '../i18n';

/**
 * 軍師錦囊 — your sharpest mind (or your appointed 軍師) reads the board and
 * hands you up to five moves, each with a 照辦 button that fires the real
 * order — recruit, soothe, trade, 設宴結心, or a named 計略. Advice recomputes
 * after every execution so the next tip reflects the new state. 一鍵照辦全部
 * clears the lot; ✕ shelves a tip you'd rather not act on.
 */
export function AdvisorModal({ onClose }: { onClose: () => void }) {
  useEscapeKey(onClose);
  const cities = useGameStore((s) => s.cities);
  const officers = useGameStore((s) => s.officers);
  const armies = useGameStore((s) => s.armies);
  const forces = useGameStore((s) => s.forces);
  const diplomacy = useGameStore((s) => s.diplomacy);
  const appointments = useGameStore((s) => s.appointments);
  const pendingCommands = useGameStore((s) => s.pendingCommands);
  const pendingTrainings = useGameStore((s) => s.pendingTrainings);
  const playerForceId = useGameStore((s) => s.playerForceId);
  const season = useGameStore((s) => s.date.season);
  const issueCommand = useGameStore((s) => s.issueCommand);
  const tradeFood = useGameStore((s) => s.tradeFood);
  const hostBanquet = useGameStore((s) => s.hostBanquet);
  const executeScheme = useGameStore((s) => s.executeScheme);
  const t = useT();
  const [done, setDone] = useState<Record<string, string>>({});
  const [dismissed, setDismissed] = useState<Record<string, true>>({});
  const reduced = typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const anim = (s: string) => (reduced ? undefined : s);

  const advisor = useMemo(
    () => (playerForceId ? pickAdvisor(officers, playerForceId, appointments) : null),
    [officers, playerForceId, appointments],
  );

  const allTips = useMemo(() => {
    if (!playerForceId) return [];
    const force = forces[playerForceId];
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
      advisor,
      forces,
      diplomacy,
      playerCapitalId: force?.capitalCityId,
      rulerOfficerId: force?.rulerOfficerId,
    });
  }, [cities, officers, armies, forces, diplomacy, pendingCommands, pendingTrainings, playerForceId, season, advisor]);

  const tips = allTips.filter((tip) => !dismissed[tip.id]);

  const runAction = (tip: AdvisorTip): string => {
    const a = tip.action;
    if (a.kind === 'command') {
      const r = issueCommand(a.cityId, a.type, a.officerId);
      return r.ok ? t('✓ 已照辦', '✓ Done') : (r.reason ?? t('未能執行', 'Failed'));
    }
    if (a.kind === 'trade') {
      const r = tradeFood(a.cityId, a.trade, a.amount);
      return r.ok ? t(`✓ 已成交(得${r.got.toLocaleString()})`, `✓ Traded (+${r.got.toLocaleString()})`) : t('未能成交', 'Failed');
    }
    if (a.kind === 'banquet') {
      const r = hostBanquet(a.cityId);
      return r.ok ? t('✓ 已設宴結心', '✓ Banquet held') : t('未能設宴', 'Failed');
    }
    if (a.kind === 'scheme') {
      const r = executeScheme(a.schemeId, a.targetA, a.targetB);
      return r.ok ? t('✓ 計成', '✓ Scheme set') : (r.message ?? t('計不售', 'Failed'));
    }
    return '';
  };

  const execute = (tip: AdvisorTip) => {
    const msg = runAction(tip);
    setDone((d) => ({ ...d, [tip.id]: msg }));
  };

  const actionable = tips.filter((tip) => tip.action.kind !== 'none' && !done[tip.id]);
  const doAll = () => {
    const results: Record<string, string> = {};
    for (const tip of actionable) results[tip.id] = runAction(tip);
    setDone((d) => ({ ...d, ...results }));
  };

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'grid', placeItems: 'center', zIndex: 900, padding: '1rem' }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'linear-gradient(160deg,#1b2531,#10161e)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 'var(--tkm-radius-lg)',
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
                {advisor
                  ? t(`${advisor.name.zh} 進言 · 智 ${advisor.stats.intelligence}`, `${advisor.name.en} counsels · INT ${advisor.stats.intelligence}`)
                  : t('幕僚進言', 'Your aides counsel')}
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#e6c473', fontSize: '1.4rem', cursor: 'pointer' }}>×</button>
        </div>

        {actionable.length > 1 && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.5rem' }}>
            <button
              onClick={doAll}
              style={{
                background: 'linear-gradient(180deg,#243447,#16202c)', border: '1px solid #4a6a86',
                color: '#bcd6ee', padding: '0.3rem 0.85rem', cursor: 'pointer',
                fontFamily: 'inherit', fontSize: '0.78rem', letterSpacing: '0.04rem',
              }}
            >{t(`一鍵照辦全部(${actionable.length})`, `Do all (${actionable.length})`)}</button>
          </div>
        )}

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
            {!done[tip.id] && (
              <button
                onClick={() => setDismissed((dd) => ({ ...dd, [tip.id]: true }))}
                title={t('暫且擱置', 'Set aside')}
                style={{ background: 'none', border: 'none', color: '#52606b', fontSize: '1rem', cursor: 'pointer', lineHeight: 1, padding: '0 0.1rem' }}
              >×</button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
