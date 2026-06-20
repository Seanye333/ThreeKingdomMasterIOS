import { useMemo, useState } from 'react';
import { useGameStore } from '../../game/state/store';
import { canDuel, type DuelDifficulty } from '../../game/systems/duel';
import { Modal } from './Modal';
import { OfficerPortrait } from './OfficerPortrait';
import { OfficerStats } from './OfficerStats';
import { Duel3DStage } from './duel/Duel3DStage';
import { useT, useLanguage, pickName } from '../i18n';

/**
 * 演武場 — sparring ground. Pick two of your own duel-capable officers and let
 * them spar (non-lethal). Both gain experience — the winner a little more —
 * which can grow stats or teach skills via the normal growth path. No risk of
 * death; it's a drill, not a war.
 */
export function TrainingGroundModal({ onClose }: { onClose: () => void }) {
  const t = useT();
  const lang = useLanguage();
  const officers = useGameStore((s) => s.officers);
  const playerForceId = useGameStore((s) => s.playerForceId);
  const year = useGameStore((s) => s.date.year);
  const grantSparXp = useGameStore((s) => s.grantSparXp);

  const roster = useMemo(
    () => Object.values(officers)
      .filter((o) => o.forceId === playerForceId && o.status !== 'dead' && o.status !== 'imprisoned' && canDuel(o).ok)
      .sort((a, b) => b.stats.war - a.stats.war),
    [officers, playerForceId],
  );

  const [aId, setAId] = useState<string | null>(null);
  const [bId, setBId] = useState<string | null>(null);
  const [difficulty, setDifficulty] = useState<DuelDifficulty>('veteran');
  const [sparring, setSparring] = useState(false);
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

  // While the bout plays, show only the duel (it's fixed-position; rendering it
  // alongside the higher-z modal would bury it).
  if (sparring && a && b) {
    return (
      <Duel3DStage
        attacker={a}
        defender={b}
        lethal={false}
        difficulty={difficulty}
        onComplete={(outcome) => {
          setSparring(false);
          const draw = outcome.winner === 'draw';
          const winnerId = draw || outcome.winner === 'attacker' ? aId! : bId!;
          const loserId = winnerId === aId ? bId! : aId!;
          const r = grantSparXp(winnerId, loserId, draw);
          if (r) {
            const text = draw
              ? t('點到為止 — 雙方皆有所獲', 'A friendly draw — both learned from it')
              : t(`${r.winnerName} 佔上風`, `${pickName(officers[winnerId].name, lang)} prevails`);
            setResult({ text, notes: r.notes });
          }
        }}
      />
    );
  }

  const slot = (o: typeof a, label: string) => (
    <div style={{ flex: 1, textAlign: 'center', border: '1px dashed #3a4754', borderRadius: 6, padding: '0.6rem', background: o ? 'rgba(230,196,115,0.06)' : 'transparent' }}>
      <div style={{ fontSize: '0.68rem', color: '#7a8893', letterSpacing: '0.1rem', marginBottom: '0.4rem' }}>{label}</div>
      {o ? (
        <>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.3rem' }}>
            <OfficerPortrait officer={o} size={64} forceColor="#e6c473" year={year} />
          </div>
          <div style={{ color: '#f2dd9a' }}>{pickName(o.name, lang)}</div>
          <div style={{ fontSize: '0.72rem', color: '#aab6c0', marginTop: 2 }}>
            {t('武', 'WAR')} {o.stats.war} · {t('等', 'Lv')} {o.level ?? 1}
          </div>
        </>
      ) : (
        <div style={{ color: '#5f6c76', fontSize: '0.85rem', padding: '1.4rem 0' }}>{t('（從下方選將）', '(pick below)')}</div>
      )}
    </div>
  );

  return (
    <Modal onClose={onClose} title={t('演武場', 'Sparring Ground')} icon="⚔" width="min(560px, 100%)" scrollBody>
      <div style={{ fontSize: '0.8rem', color: '#aab6c0', marginBottom: '0.8rem', lineHeight: 1.6 }}>
        {t('選兩名麾下武將切磋(點到為止,不致命)。勝負雙方皆增經驗,或可升級增益屬性、習得新技。',
          'Pick two officers to spar (non-lethal). Both gain experience — the winner more — which can raise stats or teach skills.')}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.8rem' }}>
        {slot(a, t('挑戰者', 'Challenger'))}
        <div style={{ fontSize: '1.4rem', color: '#7a8893' }}>VS</div>
        {slot(b, t('對手', 'Opponent'))}
      </div>

      {/* AI 難度 — how sharply the opponent reads and counters. */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: '0.8rem' }}>
        <span style={{ fontSize: '0.72rem', color: '#7a8893', letterSpacing: '0.06rem', marginRight: 2 }}>{t('對手難度', 'AI')}</span>
        {([['rookie', '新手', 'Rookie'], ['veteran', '老將', 'Veteran'], ['peerless', '無雙', 'Peerless']] as const).map(([id, zh, en]) => {
          const on = difficulty === id;
          return (
            <button
              key={id}
              onClick={() => setDifficulty(id)}
              style={{
                flex: 1, padding: '0.3rem', fontFamily: 'inherit', fontSize: '0.8rem', cursor: 'pointer', borderRadius: 4,
                background: on ? 'rgba(230,196,115,0.16)' : '#10161e', border: `1px solid ${on ? '#e6c473' : '#26323e'}`,
                color: on ? '#f2dd9a' : '#8a96a0',
              }}
            >{lang === 'en' ? en : zh}</button>
          );
        })}
      </div>

      <button
        disabled={!ready}
        onClick={() => { setResult(null); setSparring(true); }}
        style={{
          width: '100%', padding: '0.6rem', marginBottom: '0.8rem',
          background: ready ? 'linear-gradient(180deg,#7a2a20,#4a1810)' : '#1e2832',
          border: `1px solid ${ready ? '#e0846a' : '#2b3845'}`,
          color: ready ? '#ffe0d0' : '#5f6c76', cursor: ready ? 'pointer' : 'default',
          fontFamily: 'var(--tkm-font-body)', fontSize: '1rem', letterSpacing: '0.1rem',
        }}
      >⚔ {t('開始切磋', 'Begin the Spar')}</button>

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
                background: sel ? 'rgba(230,196,115,0.14)' : '#10161e',
                border: `1px solid ${sel ? '#e6c473' : '#26323e'}`,
                borderRadius: 4, padding: '0.4rem 0.5rem', cursor: 'pointer', color: '#e6edf3',
                fontFamily: 'var(--tkm-font-body)',
              }}
            >
              <OfficerPortrait officer={o} size={32} forceColor="#e6c473" year={year} />
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ color: '#f2dd9a', fontSize: '0.85rem' }}>{pickName(o.name, lang)}</span>
                <span style={{ display: 'block', fontSize: '0.66rem', color: '#8a96a0' }}>
                  <OfficerStats officer={o} keys={['war', 'leadership']} /> · {t('等', 'Lv')}{o.level ?? 1}
                </span>
              </span>
            </button>
          );
        })}
        {roster.length === 0 && (
          <div style={{ color: '#7a8893', fontStyle: 'italic', padding: '1rem 0', gridColumn: '1 / -1' }}>
            {t('麾下無可上陣切磋的武將(需武力 ≥ 50)。', 'No officers fit to spar (need War ≥ 50).')}
          </div>
        )}
      </div>
    </Modal>
  );
}
