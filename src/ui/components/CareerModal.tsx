import { useGameStore } from '../../game/state/store';
import { SEASON_LABEL } from '../../game/types';
import { careerStanding, careerPrivileges } from '../../game/systems/career';
import { useT, useLanguage } from '../i18n';

interface Props {
  onClose: () => void;
}

/**
 * Career mode screen — chronicle of the player's chosen officer:
 *   - Portrait, biography, stats
 *   - Battle wins/losses + cities taken + deeds
 *   - Milestone timeline (auto-recorded major events)
 */
export function CareerModal({ onClose }: Props) {
  const career = useGameStore((s) => s.careerMode);
  const officers = useGameStore((s) => s.officers);
  const deeds = useGameStore((s) => s.deeds);
  const forces = useGameStore((s) => s.forces);
  const t = useT();
  const lang = useLanguage();

  if (!career) {
    return (
      <div
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
          display: 'grid', placeItems: 'center', zIndex: 900, padding: '1rem',
        }}
        onClick={onClose}
      >
        <div
          style={{
            background: '#1b2531', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '2rem',
            color: '#aab6c0', fontFamily: 'var(--tkm-font-body)', textAlign: 'center',
          }}
        >
          {t('一代記模式未啟用。請於新遊戲中選擇主角武將。', 'Chronicle mode is not active. Start a new game with a career officer.')}
        </div>
      </div>
    );
  }

  const officer = officers[career.officerId];
  const d = deeds[career.officerId];
  const force = officer?.forceId ? forces[officer.forceId] : null;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
        display: 'grid', placeItems: 'center', zIndex: 900, padding: '1rem',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'linear-gradient(160deg,#1b2531,#10161e)',
          border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px',
          width: 'min(720px,100%)',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          color: '#e6edf3',
          fontFamily: 'var(--tkm-font-body)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <header
          style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
            padding: '1rem 1.5rem', borderBottom: '1px solid #2b3845',
          }}
        >
          <div>
            <div style={{ fontSize: '1.4rem', color: '#e6c473', letterSpacing: '0.07rem' }}>{t('一代記', 'Chronicle')}</div>
            <div style={{ fontSize: '0.85rem', color: '#7a8893', fontStyle: 'italic' }}>
              {lang === 'en' ? `Career: ${officer?.name.en ?? '?'}` : `主角 ${officer?.name.zh ?? '?'}`}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#e6c473', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
        </header>

        <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
          {/* Header card */}
          <div
            style={{
              background: '#10161e',
              borderLeft: `3px solid ${force?.color ?? '#364654'}`,
              padding: '1rem',
              marginBottom: '1rem',
            }}
          >
            <div style={{ fontSize: '1.8rem', color: '#e6c473', letterSpacing: '0.1rem' }}>
              {lang === 'en' ? officer?.name.en : officer?.name.zh}
              {lang === 'both' && <> <span style={{ fontSize: '0.95rem', color: '#7a8893', fontStyle: 'italic' }}>{officer?.name.en}</span></>}
            </div>
            {officer?.courtesyName && (
              <div style={{ fontSize: '0.85rem', color: '#aab6c0' }}>
                {t('字', 'Courtesy')} {lang === 'en' ? officer.courtesyName.en : officer.courtesyName.zh}
                {lang === 'both' && ` · ${officer.courtesyName.en}`}
              </div>
            )}
            <div style={{ fontSize: '0.78rem', color: '#7a8893', marginTop: '0.5rem' }}>
              {force
                ? <>{t('效忠', 'Serving')} <strong style={{ color: force.color }}>{lang === 'en' ? force.name.en : force.name.zh}</strong></>
                : t('浪人', 'Free agent')}
              {officer && (
                <>
                  {' · '}{t('官位', 'Rank')}: <strong style={{ color: '#e6c473' }}>{officer.rank}</strong>
                  {' · '}{t('武', 'War')} {officer.stats.war} · {t('統', 'Lead')} {officer.stats.leadership} · {t('智', 'Int')} {officer.stats.intelligence}
                </>
              )}
            </div>
          </div>

          {/* Career standing — 功績 / 品階 / 身份 ladder */}
          {(() => {
            const s = careerStanding(d);
            const pct = s.nextRankMerit !== null
              ? Math.max(4, Math.min(100, Math.round((s.merit / s.nextRankMerit) * 100)))
              : 100;
            return (
              <div style={{ background: '#10161e', border: '1px solid #e6c473', padding: '0.85rem', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.5rem' }}>
                  <div style={{ color: '#e6c473', letterSpacing: '0.07rem' }}>
                    {t('身份', 'Standing')} · <strong>{lang === 'en' ? s.status.en : s.status.zh}</strong>
                    <span style={{ fontSize: '0.78rem', color: '#7a8893', marginLeft: '0.5rem' }}>{t('品', 'Rank')} {s.rank}</span>
                  </div>
                  <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: '0.8rem', color: '#aab6c0' }}>
                    {t('功績', 'Merit')} {s.merit}{s.nextRankMerit !== null ? ` / ${s.nextRankMerit}` : ` (${t('登峰', 'pinnacle')})`}
                  </div>
                </div>
                <div style={{ height: 10, background: '#1b2531', border: '1px solid #2b3845', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg,#8a6a3a,#e6c473)' }} />
                </div>
                <div style={{ fontSize: '0.68rem', color: '#6a5238', marginTop: '0.35rem' }}>
                  {t('武官 → 大臣 → 太守 → 都督 → 一方諸侯', 'Officer → Minister → Governor → Viceroy → Grand Marshal')}
                </div>
                {/* 品階特權 — unlocked perks light up as the hero climbs */}
                <div style={{ marginTop: '0.6rem', borderTop: '1px solid #1e2832', paddingTop: '0.5rem' }}>
                  <div style={{ fontSize: '0.66rem', letterSpacing: '0.05rem', color: '#7a8893', marginBottom: '0.3rem' }}>{t('品階特權', 'Rank Privileges')}</div>
                  {careerPrivileges(s).map((p, i) => (
                    <div key={i} style={{ fontSize: '0.76rem', color: p.unlocked ? '#7ed68a' : '#6a5238', marginTop: '0.15rem' }}>
                      {p.unlocked ? '✓' : '○'} {lang === 'en' ? p.en : p.zh}
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Deeds summary */}
          {d && (
            <div style={{ background: '#10161e', border: '1px solid #2b3845', padding: '0.85rem', marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.7rem', letterSpacing: '0.07rem', color: '#7a8893', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                {t('武功', 'Deeds')}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', fontFamily: 'ui-monospace, monospace', fontSize: '0.8rem' }}>
                <span><span style={{ color: '#7a8893' }}>{t('殲敵', 'Kills')}</span> {d.killsTroops.toLocaleString()}</span>
                <span><span style={{ color: '#7a8893' }}>{t('一騎', 'Duels')}</span> {d.duelsWon}</span>
                <span><span style={{ color: '#7a8893' }}>{t('生擒', 'Captures')}</span> {d.captured}</span>
                <span><span style={{ color: '#7a8893' }}>{t('攻陷', 'Conquests')}</span> {d.citiesTaken}</span>
                <span><span style={{ color: '#7a8893' }}>{t('謀略', 'Schemes')}</span> {d.espionageSuccess}</span>
                <span><span style={{ color: '#7a8893' }}>{t('内政', 'Civic')}</span> {d.civicWorks}</span>
                <span><span style={{ color: '#7a8893' }}>{t('勝戰', 'Wins')}</span> {d.battlesWon}</span>
                <span><span style={{ color: '#7a8893' }}>{t('敗戰', 'Losses')}</span> {d.battlesLost}</span>
              </div>
            </div>
          )}

          {/* Milestone timeline */}
          <div style={{ background: '#10161e', border: '1px solid #2b3845', padding: '0.85rem' }}>
            <div style={{ fontSize: '0.7rem', letterSpacing: '0.07rem', color: '#7a8893', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
              {t('年譜', 'Chronicle')} ({career.milestones.length})
            </div>
            {career.milestones.length === 0 ? (
              <div style={{ color: '#6a5238', fontStyle: 'italic' }}>{t('尚無里程碑記錄。', 'No milestones recorded yet.')}</div>
            ) : (
              <div style={{ position: 'relative', paddingLeft: '1.5rem', borderLeft: '2px solid #2b3845' }}>
                {[...career.milestones].reverse().map((m, i) => {
                  const season = SEASON_LABEL[m.season];
                  return (
                    <div key={i} style={{ marginBottom: '0.7rem', position: 'relative' }}>
                      <span style={{
                        position: 'absolute', left: -22, top: 6,
                        width: 8, height: 8, borderRadius: 4,
                        background: '#e6c473',
                        boxShadow: '0 0 6px #e6c473',
                      }} />
                      <div style={{ fontSize: '0.7rem', color: '#7a8893', fontFamily: 'ui-monospace, monospace' }}>
                        {m.year} {lang === 'en' ? season.en : season.zh}
                      </div>
                      <div style={{ fontSize: '0.95rem', color: '#e6c473' }}>
                        {lang === 'en' ? m.title.en : m.title.zh}
                      </div>
                      {lang === 'both' && (
                        <div style={{ fontSize: '0.78rem', color: '#aab6c0', fontStyle: 'italic' }}>
                          {m.title.en}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
