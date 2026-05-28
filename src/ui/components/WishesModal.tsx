import { useGameStore } from '../../game/state/store';
import { OfficerAvatar } from './OfficerAvatar';

interface Props {
  onClose: () => void;
}

const SEASON_IDX = { spring: 0, summer: 1, autumn: 2, winter: 3 } as const;

export function WishesModal({ onClose }: Props) {
  const wishes = useGameStore((s) => s.officerWishes);
  const officers = useGameStore((s) => s.officers);
  const grant = useGameStore((s) => s.grantWish);
  const reject = useGameStore((s) => s.rejectWish);
  const currentYear = useGameStore((s) => s.date.year);
  const currentSeason = useGameStore((s) => s.date.season);
  const nowAbs = currentYear * 4 + SEASON_IDX[currentSeason];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.65)',
        display: 'grid',
        placeItems: 'center',
        zIndex: 900,
        padding: '1rem',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'linear-gradient(160deg,#2a1f15 0%,#1a1410 100%)',
          border: '1px solid #5a4530',
          borderTop: '3px solid #e8c878',  // parchment yellow — 紙卷
          width: 'min(620px,100%)',
          maxHeight: '88vh',
          overflow: 'auto',
          color: '#e8d9b0',
          fontFamily: '"Songti SC","Noto Serif SC",serif',
          boxShadow: '0 0 16px rgba(232,200,120,0.12)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <header
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '1rem 1.5rem',
            borderBottom: '1px solid #4a3520',
            alignItems: 'baseline',
          }}
        >
          <div>
            <div style={{ fontSize: '1.4rem', color: '#d4a84a', letterSpacing: '0.2rem' }}>書信</div>
            <div style={{ fontSize: '0.85rem', color: '#8a7050', fontStyle: 'italic' }}>
              Officer Letters
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            {wishes.filter((w) => w.kind !== 'info').length >= 3 && (
              <>
                <button
                  onClick={() => {
                    for (const w of wishes.filter((x) => x.kind !== 'info')) grant(w.id);
                  }}
                  style={{
                    background: '#3a2d20', border: '1px solid #7ed68a', color: '#7ed68a',
                    padding: '0.3rem 0.7rem', fontFamily: 'inherit', cursor: 'pointer', fontSize: '0.8rem',
                  }}
                >全部準許</button>
                <button
                  onClick={() => {
                    for (const w of wishes.filter((x) => x.kind !== 'info')) reject(w.id);
                  }}
                  style={{
                    background: 'none', border: '1px solid #b8442e', color: '#b8442e',
                    padding: '0.3rem 0.7rem', fontFamily: 'inherit', cursor: 'pointer', fontSize: '0.8rem',
                  }}
                >全部却下</button>
              </>
            )}
            <button
              onClick={onClose}
              style={{ background: 'none', border: 'none', color: '#d4a84a', fontSize: '1.5rem', cursor: 'pointer' }}
            >
              ×
            </button>
          </div>
        </header>
        <div style={{ padding: '1rem 1.5rem' }}>
          {wishes.length === 0 ? (
            <div style={{ color: '#6a5238', fontStyle: 'italic', textAlign: 'center', padding: '2rem' }}>
              No pending letters.
            </div>
          ) : (
            wishes.map((w) => {
              const o = officers[w.officerId];
              const isInfo = w.kind === 'info';
              const issuedAbs = w.issuedYear * 4 + SEASON_IDX[w.issuedSeason];
              const maxAge = w.expiresAfterSeasons ?? 6;
              const seasonsLeft = Math.max(0, maxAge - (nowAbs - issuedAbs));
              const grievance = o?.grievanceCount ?? 0;
              return (
                <div
                  key={w.id}
                  style={{
                    background: isInfo ? '#15201a' : '#1a1410',
                    border: `1px solid ${isInfo ? '#3a5a4a' : '#4a3520'}`,
                    padding: '0.75rem 1rem',
                    marginBottom: '0.5rem',
                    display: 'flex', gap: '0.75rem', alignItems: 'flex-start',
                  }}
                >
                  {o && (
                    <div style={{ flexShrink: 0, border: '1px solid #5a4530', borderRadius: 2, overflow: 'hidden' }}>
                      <OfficerAvatar officer={o} size={56} />
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <div style={{ fontSize: '0.9rem', color: isInfo ? '#7ed68a' : '#d4a84a' }}>
                      {isInfo && <span style={{ marginRight: '0.4rem', letterSpacing: '0.2rem' }}>上書</span>}
                      {o?.name.zh} {o?.name.en}
                      {grievance >= 2 && (
                        <span style={{ marginLeft: '0.5rem', color: '#b8442e', fontSize: '0.72rem' }}>
                          怨次 {grievance}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#8a7050' }}>
                      剩 {seasonsLeft} 季
                    </div>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#c0a878', marginTop: '0.2rem', lineHeight: 1.5 }}>
                    {w.text.zh}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#8a7050', fontStyle: 'italic', marginTop: '0.2rem' }}>
                    {w.text.en}
                  </div>
                  {!isInfo && (
                    <div
                      style={{
                        fontFamily: 'ui-monospace, monospace',
                        fontSize: '0.7rem',
                        color: '#8a7050',
                        marginTop: '0.3rem',
                      }}
                    >
                      Grant: <span style={{ color: '#7ed68a' }}>+{w.grantBonus} loyalty</span> · Reject:{' '}
                      <span style={{ color: '#b8442e' }}>−{w.rejectPenalty} loyalty</span>
                      {grievance > 0 && (
                        <span style={{ color: '#b8442e' }}> (×{(1 + grievance * 0.45).toFixed(2)})</span>
                      )}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                    {isInfo ? (
                      <button
                        onClick={() => grant(w.id)}
                        style={{
                          background: '#1a2820', border: '1px solid #7ed68a', color: '#7ed68a',
                          padding: '0.3rem 0.8rem', fontFamily: 'inherit', cursor: 'pointer',
                        }}
                      >
                        知悉 Acknowledge
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => grant(w.id)}
                          style={{
                            background: '#3a2d20', border: '1px solid #7ed68a', color: '#7ed68a',
                            padding: '0.3rem 0.8rem', fontFamily: 'inherit', cursor: 'pointer',
                          }}
                        >
                          準許 Grant
                        </button>
                        <button
                          onClick={() => reject(w.id)}
                          style={{
                            background: 'none', border: '1px solid #b8442e', color: '#b8442e',
                            padding: '0.3rem 0.8rem', fontFamily: 'inherit', cursor: 'pointer',
                          }}
                        >
                          却下 Reject
                        </button>
                      </>
                    )}
                  </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
