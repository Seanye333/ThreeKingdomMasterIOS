import { useMemo, useState, type CSSProperties } from 'react';
import { useEscapeKey } from '../hooks/useEscapeKey';
import { useGameStore } from '../../game/state/store';
import {
  scoreGovernorSeatDetail, isFrontierCity, GRADE_NAME, type KaoKeGrade,
} from '../../game/systems/governorEval';
import { OfficerAvatar } from './OfficerAvatar';
import { useT } from '../i18n';

/**
 * 考課面板・殿最榜 — every seated 太守, scored live against the year-end review:
 * the projected grade, a pillar-by-pillar breakdown of what's dragging the seat
 * down (民忠/府庫/倉廩/守軍/城防/政治), the 連續考績 streak, tenure, and last
 * year's verdict — so the player can mend a failing seat before 冬末考課, and
 * 親裁 恩威 (表彰/問責/革職) on the spot.
 */
const GRADE_COLOR: Record<KaoKeGrade, string> = { shang: '#5fc26a', zhong: '#e6c473', xia: '#e0623a' };

export function GovernorEvalModal({ onClose }: { onClose: () => void }) {
  useEscapeKey(onClose);
  const cities = useGameStore((s) => s.cities);
  const officers = useGameStore((s) => s.officers);
  const appointments = useGameStore((s) => s.appointments);
  const playerForceId = useGameStore((s) => s.playerForceId);
  const year = useGameStore((s) => s.date.year);
  const streaks = useGameStore((s) => s.governorEvalStreaks);
  const reviewLast = useGameStore((s) => s.governorReviewLast);
  const commendGovernor = useGameStore((s) => s.commendGovernor);
  const reprimandGovernor = useGameStore((s) => s.reprimandGovernor);
  const revokeTitle = useGameStore((s) => s.revokeTitle);
  const t = useT();
  const [msg, setMsg] = useState<Record<string, string>>({});
  const reduced = typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  const seats = useMemo(() => {
    if (!playerForceId) return [];
    const out = [];
    for (const a of appointments) {
      if (a.titleId !== 'prefect' || a.forceId !== playerForceId || !a.cityId) continue;
      const city = cities[a.cityId];
      const gov = officers[a.officerId];
      if (!city || !gov || city.ownerForceId !== playerForceId) continue;
      const frontier = isFrontierCity(city, cities);
      const detail = scoreGovernorSeatDetail(city, gov, frontier);
      out.push({ appt: a, city, gov, detail, frontier, streak: streaks[gov.id] ?? 0, last: reviewLast[gov.id] });
    }
    return out.sort((p, q) => q.detail.score - p.detail.score);
  }, [appointments, cities, officers, playerForceId, streaks, reviewLast]);

  const act = (id: string, fn: () => { ok: boolean; reason?: string }, okZh: string, okEn: string) => {
    const r = fn();
    setMsg((m) => ({ ...m, [id]: r.ok ? t(okZh, okEn) : (r.reason ?? t('未能執行', 'Failed')) }));
  };

  const PILLARS = [
    { key: 'order', zh: '民忠', en: 'Loyalty' },
    { key: 'coffer', zh: '府庫', en: 'Coffers' },
    { key: 'granary', zh: '倉廩', en: 'Granary' },
    { key: 'garrison', zh: '守軍', en: 'Garrison' },
    { key: 'defense', zh: '城防', en: 'Walls' },
    { key: 'calibre', zh: '政才', en: 'Calibre' },
  ] as const;

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'grid', placeItems: 'center', zIndex: 900, padding: '1rem' }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'linear-gradient(160deg,#1b2531,#10161e)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 'var(--tkm-radius-lg)',
          width: 'min(640px,100%)', maxHeight: '85vh', overflowY: 'auto',
          color: '#e6edf3', fontFamily: 'var(--tkm-font-body)', padding: '1rem 1.3rem',
          animation: reduced ? undefined : 'tkmVictorySub 0.4s cubic-bezier(0.16,1,0.3,1) both',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <div>
            <div style={{ fontSize: '1.15rem', color: '#e6c473', letterSpacing: '0.07rem' }}>📋 {t('考課・殿最', 'Governor Review')}</div>
            <div style={{ fontSize: '0.72rem', color: '#7a8893' }}>{t('冬末考課前的預估;可即時親裁恩威', 'Live projection before the winter review — 親裁 at will')}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#e6c473', fontSize: '1.4rem', cursor: 'pointer' }}>×</button>
        </div>

        {seats.length === 0 && (
          <div style={{ color: '#7a8893', fontSize: '0.85rem', padding: '1rem 0' }}>
            {t('尚未委任太守。於「任官」拜將守城,即受考課。', 'No prefects appointed yet — name one in 任官 and the 考課 will judge their stewardship.')}
          </div>
        )}

        {seats.map((seat) => {
          const gc = GRADE_COLOR[seat.detail.grade];
          const tenure = year - (seat.appt.appointedYear ?? year);
          const id = seat.gov.id;
          return (
            <div key={id} style={{ border: '1px solid #26323e', background: '#10161e', padding: '0.6rem 0.8rem', marginBottom: '0.55rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '0.45rem' }}>
                <OfficerAvatar officer={seat.gov} size={36} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.92rem' }}>
                    {t(seat.gov.name.zh, seat.gov.name.en)}
                    <span style={{ color: '#7a8893', fontSize: '0.78rem' }}> · {t(seat.city.name.zh, seat.city.name.en)}</span>
                    <span style={{ marginLeft: 6, fontSize: '0.68rem', color: seat.frontier ? '#e0a23a' : '#5a6b7a' }}>
                      {seat.frontier ? t('邊城·重戎守', 'Frontier · garrison-weighed') : t('腹地·重民殷', 'Heartland · economy-weighed')}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#7a8893' }}>
                    {t(`在任 ${tenure} 年`, `${tenure}y in seat`)}
                    {seat.streak >= 2 && <span style={{ color: '#5fc26a' }}>{t(` · 連 ${seat.streak} 上考`, ` · ${seat.streak}× 上`)}</span>}
                    {seat.streak <= -2 && <span style={{ color: '#e0623a' }}>{t(` · 連 ${Math.abs(seat.streak)} 下考`, ` · ${Math.abs(seat.streak)}× 下`)}</span>}
                    {seat.last && <span> · {t('去年', 'last')} {GRADE_NAME[seat.last.grade].zh}</span>}
                    {seat.detail.graft >= 40 && <span style={{ color: '#e0623a' }}>{t(` · 貪腐 ${Math.round(seat.detail.graft)}`, ` · graft ${Math.round(seat.detail.graft)}`)}</span>}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.3rem', fontWeight: 700, color: gc, lineHeight: 1 }}>{seat.detail.score}</div>
                  <div style={{ fontSize: '0.72rem', color: gc }}>{GRADE_NAME[seat.detail.grade].zh}</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.3rem 0.7rem', marginBottom: '0.4rem' }}>
                {PILLARS.map((p) => {
                  const fill = seat.detail.fill[p.key];
                  return (
                    <div key={p.key} style={{ fontSize: '0.66rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#8a98a4' }}>
                        <span>{t(p.zh, p.en)}</span><span>{Math.round(fill * 100)}</span>
                      </div>
                      <div style={{ height: 4, background: '#1e2a36', borderRadius: 'var(--tkm-radius-xs)', overflow: 'hidden' }}>
                        <div style={{ width: `${Math.round(fill * 100)}%`, height: '100%', background: fill >= 0.66 ? '#5fc26a' : fill >= 0.33 ? '#e6c473' : '#e0623a' }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <button
                  onClick={() => act(id, () => commendGovernor(id), '✓ 已表彰', '✓ Commended')}
                  style={btn('#3a2d18', '#e6c473', '#f2dd9a')}
                >{t('表彰(賞300金)', 'Commend (300g)')}</button>
                <button
                  onClick={() => act(id, () => reprimandGovernor(id), '✓ 已問責', '✓ Reprimanded')}
                  style={btn('#3a2218', '#d08a4a', '#e6b483')}
                >{t('問責', 'Reprimand')}</button>
                <button
                  onClick={() => act(id, () => revokeTitle(id), '✓ 已革職', '✓ Removed')}
                  style={btn('#2a1818', '#a04a4a', '#e08a8a')}
                >{t('革職', 'Remove')}</button>
                {msg[id] && <span style={{ fontSize: '0.72rem', color: '#9ed68a' }}>{msg[id]}</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function btn(bg: string, border: string, color: string): CSSProperties {
  return {
    background: `linear-gradient(180deg,${bg},#10161e)`, border: `1px solid ${border}`,
    color, padding: '0.28rem 0.7rem', cursor: 'pointer',
    fontFamily: 'inherit', fontSize: '0.74rem', letterSpacing: '0.04rem', whiteSpace: 'nowrap',
  };
}
