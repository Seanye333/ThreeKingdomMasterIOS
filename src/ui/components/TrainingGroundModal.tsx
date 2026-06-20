import { useMemo, useState } from 'react';
import { useGameStore } from '../../game/state/store';
import { canDuel, type DuelDifficulty } from '../../game/systems/duel';
import { renownFromDeeds, fameTier, rollChallenger } from '../../game/systems/fame';
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
  const recordDeed = useGameStore((s) => s.recordDeed);
  const deeds = useGameStore((s) => s.deeds);
  const applyScenarioEffects = useGameStore((s) => s.applyScenarioEffects);

  const roster = useMemo(
    () => Object.values(officers)
      .filter((o) => o.forceId === playerForceId && o.status !== 'dead' && o.status !== 'imprisoned' && canDuel(o).ok)
      .sort((a, b) => b.stats.war - a.stats.war),
    [officers, playerForceId],
  );

  // 踢館 — your most renowned warrior draws an ambitious outsider who rides in to
  // test them. Generated deterministically (rng→0) so a challenge is waiting when
  // you visit; beat them for a gold bounty (and the renown).
  const challenge = useMemo(() => {
    const champ = roster.find((o) => fameTier(renownFromDeeds(deeds[o.id])).min >= 50);
    if (!champ) return null;
    const renown = renownFromDeeds(deeds[champ.id]);
    const candidates = Object.values(officers).filter((o) => o.forceId !== playerForceId && canDuel(o).ok);
    const ch = rollChallenger(champ, renown, candidates, () => 0);
    if (!ch || ch.kind !== 'duel') return null;
    const challenger = officers[ch.challengerId];
    return challenger ? { champ, challenger, bounty: ch.bounty, lineZh: ch.lineZh, lineEn: ch.lineEn } : null;
  }, [roster, officers, deeds, playerForceId]);

  const [aId, setAId] = useState<string | null>(null);
  const [bId, setBId] = useState<string | null>(null);
  const [difficulty, setDifficulty] = useState<DuelDifficulty>('veteran');
  const [sparring, setSparring] = useState(false);
  const [duelChallenge, setDuelChallenge] = useState(false);
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
          if (!draw) recordDeed(winnerId, { duelsWon: 1 }); // 名聲榜 — a 演武 win
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

  // 踢館 — the renowned champion faces the visiting challenger; a real bout with a
  // gold bounty on the line.
  if (duelChallenge && challenge) {
    return (
      <Duel3DStage
        attacker={challenge.champ}
        defender={challenge.challenger}
        lethal={false}
        difficulty="peerless"
        onComplete={(outcome) => {
          setDuelChallenge(false);
          const won = outcome.winner === 'attacker';
          if (won) {
            recordDeed(challenge.champ.id, { duelsWon: 1 });
            applyScenarioEffects([{ kind: 'gold', amount: challenge.bounty, textZh: '', textEn: '' }]);
            setResult({
              text: t(`${pickName(challenge.champ.name, lang)} 力克踢館者 ${pickName(challenge.challenger.name, lang)}!`, `${pickName(challenge.champ.name, lang)} beats the challenger ${pickName(challenge.challenger.name, lang)}!`),
              notes: [t(`賞金 ${challenge.bounty} 入庫。`, `Bounty of ${challenge.bounty} gold collected.`)],
            });
          } else {
            setResult({
              text: outcome.winner === 'draw'
                ? t('與踢館者戰成平手。', 'A draw against the challenger.')
                : t(`不敵踢館者 ${pickName(challenge.challenger.name, lang)}。`, `Bested by the challenger ${pickName(challenge.challenger.name, lang)}.`),
              notes: [],
            });
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

      {/* 踢館 — an outsider drawn by your champion's renown waits to test them. */}
      {challenge && (
        <div style={{ background: 'linear-gradient(180deg, rgba(120,40,30,0.3), rgba(40,16,12,0.3))', border: '1px solid #e0846a', borderRadius: 6, padding: '0.6rem 0.8rem', marginBottom: '0.8rem' }}>
          <div style={{ color: '#ffd0b8', fontSize: '0.84rem', marginBottom: 4 }}>
            🏯 {t('踢館', 'A Challenger Arrives')} — <b style={{ color: '#ffe0d0' }}>{pickName(challenge.challenger.name, lang)}</b>
            <span style={{ color: '#caa86a', fontSize: '0.74rem' }}> ({t('武', 'WAR')} {challenge.challenger.stats.war})</span>
          </div>
          <div style={{ fontSize: '0.74rem', color: '#d8b0a0', fontStyle: 'italic', marginBottom: 6 }}>「{lang === 'en' ? challenge.lineEn : challenge.lineZh}」</div>
          <button
            onClick={() => { setResult(null); setDuelChallenge(true); }}
            style={{ width: '100%', padding: '0.45rem', background: 'linear-gradient(180deg,#7a2a20,#4a1810)', border: '1px solid #e0846a', color: '#ffe0d0', cursor: 'pointer', fontFamily: 'var(--tkm-font-body)', letterSpacing: '0.08rem', borderRadius: 4 }}
          >⚔ {t(`遣 ${pickName(challenge.champ.name, lang)} 應戰(賞 ${challenge.bounty} 金)`, `Send ${pickName(challenge.champ.name, lang)} (${challenge.bounty}g bounty)`)}</button>
        </div>
      )}

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
