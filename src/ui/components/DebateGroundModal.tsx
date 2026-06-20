import { useMemo, useState } from 'react';
import { useGameStore } from '../../game/state/store';
import { debateProwess } from '../../game/systems/wordWar';
import { debateShame, isEmotional } from '../../game/systems/afflictions';
import { Modal } from './Modal';
import { OfficerPortrait } from './OfficerPortrait';
import { OfficerStats } from './OfficerStats';
import { Debate3DStage } from './debate/Debate3DStage';
import { useT, useLanguage, pickName } from '../i18n';

/**
 * 論辯場 — the war-of-words sparring ground. Pick two of your own officers and
 * let them cross words in the 3D court hall (non-lethal). Both gain experience —
 * the sharper tongue a little more — feeding the normal growth path. The 舌戰
 * counterpart to the 演武場 (TrainingGroundModal). No stakes; it's a drill.
 */
export function DebateGroundModal({ onClose }: { onClose: () => void }) {
  const t = useT();
  const lang = useLanguage();
  const officers = useGameStore((s) => s.officers);
  const playerForceId = useGameStore((s) => s.playerForceId);
  const year = useGameStore((s) => s.date.year);
  const grantSparXp = useGameStore((s) => s.grantSparXp);
  const afflictOfficer = useGameStore((s) => s.afflictOfficer);
  const recordDeed = useGameStore((s) => s.recordDeed);

  // Anyone fit to speak may debate — sort the sharpest tongues to the front.
  const roster = useMemo(
    () => Object.values(officers)
      .filter((o) => o.forceId === playerForceId && o.status !== 'dead' && o.status !== 'unsearched' && o.status !== 'imprisoned')
      .sort((a, b) => debateProwess(b) - debateProwess(a)),
    [officers, playerForceId],
  );

  const [aId, setAId] = useState<string | null>(null);
  const [bId, setBId] = useState<string | null>(null);
  const [debating, setDebating] = useState(false);
  const [result, setResult] = useState<{ text: string; notes: string[] } | null>(null);

  const a = aId ? officers[aId] : null;
  const b = bId ? officers[bId] : null;
  const ready = !!(a && b && aId !== bId);

  const pick = (id: string) => {
    setResult(null);
    if (aId === id) { setAId(null); return; }
    if (bId === id) { setBId(null); return; }
    if (!aId) setAId(id);
    else if (!bId) setBId(id);
    else { setAId(id); setBId(null); }
  };

  // While the debate plays, show only the 3D hall (it's fixed-position; rendering
  // it alongside the higher-z modal would bury it).
  if (debating && a && b) {
    return (
      <Debate3DStage
        me={a}
        foe={b}
        onComplete={(outcome) => {
          setDebating(false);
          const draw = outcome.winner === 'draw';
          const winnerId = draw || outcome.winner === 'me' ? aId! : bId!;
          const loserId = winnerId === aId ? bId! : aId!;
          const r = grantSparXp(winnerId, loserId, draw);
          // 羞憤 — an emotional officer who is out-argued stews on it for a few
          // seasons (−魅力/−智力), a real cost to losing a war of words.
          const loser = officers[loserId];
          let shamed = false;
          if (!draw) {
            recordDeed(winnerId, { debatesWon: 1 }); // 名聲榜 — a 舌戰 win
            if (loser && isEmotional(loser)) {
              afflictOfficer(loserId, debateShame());
              shamed = true;
            }
          }
          if (r) {
            const base = draw
              ? t('各執一詞 — 雙方皆有所獲', 'A stalemate of words — both learned from it')
              : t(`${pickName(officers[winnerId].name, lang)} 辯勝`, `${pickName(officers[winnerId].name, lang)} carries the argument`);
            const text = shamed
              ? `${base} — ${t(`${pickName(loser.name, lang)} 羞憤難平`, `${pickName(loser.name, lang)} is left stewing in shame`)}`
              : base;
            setResult({ text, notes: r.notes });
          }
        }}
      />
    );
  }

  const slot = (o: typeof a, label: string) => (
    <div style={{ flex: 1, textAlign: 'center', border: '1px dashed #3a4754', borderRadius: 6, padding: '0.6rem', background: o ? 'rgba(136,183,232,0.07)' : 'transparent' }}>
      <div style={{ fontSize: '0.68rem', color: '#7a8893', letterSpacing: '0.1rem', marginBottom: '0.4rem' }}>{label}</div>
      {o ? (
        <>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.3rem' }}>
            <OfficerPortrait officer={o} size={64} forceColor="#88b7e8" year={year} />
          </div>
          <div style={{ color: '#f2dd9a' }}>{pickName(o.name, lang)}</div>
          <div style={{ fontSize: '0.72rem', color: '#aab6c0', marginTop: 2 }}>
            {t('智', 'INT')} {o.stats.intelligence} · {t('魅', 'CHA')} {o.stats.charisma}
          </div>
        </>
      ) : (
        <div style={{ color: '#5f6c76', fontSize: '0.85rem', padding: '1.4rem 0' }}>{t('（從下方選將）', '(pick below)')}</div>
      )}
    </div>
  );

  return (
    <Modal onClose={onClose} title={t('論辯場', 'Debate Ground')} icon="💬" width="min(560px, 100%)" scrollBody>
      <div style={{ fontSize: '0.8rem', color: '#aab6c0', marginBottom: '0.8rem', lineHeight: 1.6 }}>
        {t('選兩名麾下武將切磋舌辯(點到為止)。出「論/駁/諷/詰」破對方沉著,雙方皆增經驗,或可升級增益屬性、習得新技。',
          'Pick two officers for a war of words (non-lethal). Play 論/駁/諷/詰 to break their composure; both gain experience — which can raise stats or teach skills.')}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.8rem' }}>
        {slot(a, t('挑戰者', 'Challenger'))}
        <div style={{ fontSize: '1.4rem', color: '#7a8893' }}>VS</div>
        {slot(b, t('對手', 'Opponent'))}
      </div>

      <button
        disabled={!ready}
        onClick={() => { setResult(null); setDebating(true); }}
        style={{
          width: '100%', padding: '0.6rem', marginBottom: '0.8rem',
          background: ready ? 'linear-gradient(180deg,#234a6e,#13283e)' : '#1e2832',
          border: `1px solid ${ready ? '#88b7e8' : '#2b3845'}`,
          color: ready ? '#d8ecff' : '#5f6c76', cursor: ready ? 'pointer' : 'default',
          fontFamily: 'var(--tkm-font-body)', fontSize: '1rem', letterSpacing: '0.1rem',
        }}
      >💬 {t('開始論辯', 'Begin the Debate')}</button>

      {result && (
        <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid #3a4754', borderRadius: 6, padding: '0.6rem 0.8rem', marginBottom: '0.8rem' }}>
          <div style={{ color: '#e6c473', marginBottom: result.notes.length ? '0.4rem' : 0 }}>{result.text}</div>
          {result.notes.map((n, i) => (
            <div key={i} style={{ fontSize: '0.8rem', color: '#9ed68a', lineHeight: 1.6 }}>✦ {n}</div>
          ))}
          {result.notes.length === 0 && (
            <div style={{ fontSize: '0.78rem', color: '#7a8893' }}>{t('經驗已增,尚未及晉級。', 'Experience gained; not enough to level up yet.')}</div>
          )}
        </div>
      )}

      <div style={{ fontSize: '0.68rem', color: '#7a8893', letterSpacing: '0.1rem', margin: '0.2rem 0 0.4rem' }}>
        {t('麾下武將', 'Your Officers')} ({roster.length})
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 6 }}>
        {roster.map((o) => {
          const sel = o.id === aId || o.id === bId;
          return (
            <button
              key={o.id}
              onClick={() => pick(o.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, textAlign: 'left',
                background: sel ? 'rgba(136,183,232,0.16)' : '#10161e',
                border: `1px solid ${sel ? '#88b7e8' : '#26323e'}`,
                borderRadius: 4, padding: '0.4rem 0.5rem', cursor: 'pointer', color: '#e6edf3',
                fontFamily: 'var(--tkm-font-body)',
              }}
            >
              <OfficerPortrait officer={o} size={32} forceColor="#88b7e8" year={year} />
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ color: '#f2dd9a', fontSize: '0.85rem' }}>{pickName(o.name, lang)}</span>
                <span style={{ display: 'block', fontSize: '0.66rem', color: '#8a96a0' }}>
                  <OfficerStats officer={o} keys={['intelligence', 'charisma']} /> · {t('等', 'Lv')}{o.level ?? 1}
                </span>
              </span>
            </button>
          );
        })}
        {roster.length === 0 && (
          <div style={{ color: '#7a8893', fontStyle: 'italic', padding: '1rem 0', gridColumn: '1 / -1' }}>
            {t('麾下無可論辯的武將。', 'No officers available to debate.')}
          </div>
        )}
      </div>
    </Modal>
  );
}
