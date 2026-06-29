import { useMemo, useRef, useState } from 'react';
import { useGameStore } from '../../game/state/store';
import { canDuel, resolveDuel, staticProwess } from '../../game/systems/duel';
import { playSfx } from '../../game/systems/sound';
import { Modal } from './Modal';
import { OfficerPortrait } from './OfficerPortrait';
import { Duel3DStage } from './duel/Duel3DStage';
import { useT, useLanguage, pickName } from '../i18n';

interface Match { aId: string; bId: string; winnerId: string; }

// Standard single-elim seeding so top seeds meet late (indices into the seeded
// field). 4 → [1v4, 2v3]; 8 → the classic 1/8/4/5/2/7/3/6 ladder.
const SEED_4 = [0, 3, 1, 2];
const SEED_8 = [0, 7, 3, 4, 1, 6, 2, 5];

/**
 * 比武大會 — a martial tournament. Your strongest duel-capable officers fight a
 * single-elimination bracket (non-lethal). Pick a 本命 (champion) to fight their
 * bouts yourself in the 3D arena; everyone else auto-resolves. The winner is
 * crowned 天下無雙 and wins the most experience.
 */
export function TournamentModal({ onClose }: { onClose: () => void }) {
  const t = useT();
  const lang = useLanguage();
  const officers = useGameStore((s) => s.officers);
  const playerForceId = useGameStore((s) => s.playerForceId);
  const year = useGameStore((s) => s.date.year);
  const grantOfficerXp = useGameStore((s) => s.grantOfficerXp);
  const awardTournamentChampion = useGameStore((s) => s.awardTournamentChampion);

  const eligible = useMemo(
    () => Object.values(officers)
      .filter((o) => o.forceId === playerForceId && o.status !== 'dead' && o.status !== 'imprisoned' && canDuel(o).ok)
      .sort((a, b) => staticProwess(b) - staticProwess(a)),
    [officers, playerForceId],
  );

  const field = useMemo(() => eligible.slice(0, eligible.length >= 8 ? 8 : 4), [eligible]);

  // 本命 — the officer the player fights with in person (null = watch it all auto).
  const [myPickId, setMyPickId] = useState<string | null>(null);
  // Final results (set when the bracket finishes).
  const [rounds, setRounds] = useState<Match[][] | null>(null);
  const [championId, setChampionId] = useState<string | null>(null);
  const [notes, setNotes] = useState<string[]>([]);
  // A champion bout awaiting the player (the 3D duel is shown while set).
  const [pending, setPending] = useState<{ foeId: string } | null>(null);

  // Stepped-bracket bookkeeping carried across interactive pauses.
  const accRef = useRef<Match[][]>([]);
  const partsRef = useRef<string[]>([]);
  const pendingRef = useRef<{ matches: Match[]; champIdx: number } | null>(null);

  const autoWinner = (aId: string, bId: string): string => {
    const a = officers[aId], b = officers[bId];
    const r = resolveDuel({ attacker: a, defender: b, rng: Math.random });
    return r.winner === 'defender' ? b.id : r.winner === 'attacker' ? a.id
      : (staticProwess(a) >= staticProwess(b) ? a.id : b.id);
  };

  const finish = (champId: string) => {
    const all = accRef.current;
    setRounds(all);
    setChampionId(champId);
    playSfx('victory');
    const finalists = new Set(all[all.length - 1].flatMap((m) => [m.aId, m.bId]));
    const size = field.length >= 8 ? 8 : 4;
    const collected: string[] = [];
    for (const o of field.slice(0, size)) {
      const amt = o.id === champId ? 120 : finalists.has(o.id) ? 60 : 25;
      const res = grantOfficerXp(o.id, amt);
      if (res) collected.push(...res.notes);
    }
    // 天下無雙 — the champion climbs the 武評榜 steeply (often a tier up → 鬥將生涯
    // bonus) and his fame soars; the other finalist shares a lesser climb. The steep
    // climb is the year's championship — a second tournament the same year is practice.
    const annual = awardTournamentChampion(champId, [...finalists]);
    collected.unshift(annual
      ? t('🏅 天下無雙 — 年度武道會奪魁,武評榜大漲、威名遠播!', '🏅 Peerless Under Heaven — this year\'s championship: a steep climb on the war ladder, and fame to match!')
      : t('🏅 奪魁 — 然本年度武道會已決,此番僅作切磋。', '🏅 Champion — but this year\'s title is already settled; this was but a friendly bout.'));
    setNotes(collected);
  };

  // Process rounds until a 本命 bout needs the player (then pause), or finish.
  const drive = () => {
    let participants = partsRef.current;
    while (participants.length > 1) {
      const matches: Match[] = [];
      let champIdx = -1;
      for (let i = 0; i < participants.length; i += 2) {
        const x = participants[i], y = participants[i + 1];
        if (myPickId && champIdx < 0 && (x === myPickId || y === myPickId)) {
          // Always slot the player's officer as 'a' (the controllable attacker).
          champIdx = matches.length;
          matches.push({ aId: myPickId, bId: x === myPickId ? y : x, winnerId: '' });
        } else {
          matches.push({ aId: x, bId: y, winnerId: autoWinner(x, y) });
        }
      }
      if (champIdx >= 0) {
        pendingRef.current = { matches, champIdx };
        setPending({ foeId: matches[champIdx].bId });
        return; // wait for the interactive bout to complete
      }
      accRef.current = [...accRef.current, matches];
      participants = matches.map((m) => m.winnerId);
      partsRef.current = participants;
    }
    finish(participants[0]);
  };

  const onChampBout = (championWon: boolean) => {
    const p = pendingRef.current; if (!p) return;
    p.matches[p.champIdx].winnerId = championWon ? p.matches[p.champIdx].aId : p.matches[p.champIdx].bId;
    accRef.current = [...accRef.current, p.matches];
    partsRef.current = p.matches.map((m) => m.winnerId);
    pendingRef.current = null;
    setPending(null);
    drive();
  };

  const start = () => {
    if (field.length < 4) return;
    const size = field.length >= 8 ? 8 : 4;
    const seed = size === 8 ? SEED_8 : SEED_4;
    accRef.current = [];
    partsRef.current = seed.map((i) => field[i].id);
    drive();
  };

  // While a 本命 bout is live, the 3D arena takes the whole screen.
  if (pending && myPickId) {
    const me = officers[myPickId];
    const foe = officers[pending.foeId];
    return (
      <Duel3DStage
        attacker={me}
        defender={foe}
        lethal={false}
        onComplete={(o) => {
          const champWon = o.winner === 'attacker' || (o.winner === 'draw' && staticProwess(me) >= staticProwess(foe));
          onChampBout(champWon);
        }}
      />
    );
  }

  const roundName = (idx: number, total: number) => {
    const fromEnd = total - 1 - idx;
    if (fromEnd === 0) return t('決賽', 'Final');
    if (fromEnd === 1) return t('準決賽', 'Semifinal');
    return t(`第 ${idx + 1} 輪`, `Round ${idx + 1}`);
  };

  return (
    <Modal onClose={onClose} title={t('比武大會', 'Martial Tournament')} icon="🏆" width="min(560px, 100%)" scrollBody>
      {!rounds ? (
        <>
          <div style={{ fontSize: '0.82rem', color: '#aab6c0', marginBottom: '0.8rem', lineHeight: 1.6 }}>
            {t('召集麾下最強武將,單淘汰較量武藝(點到為止)。選一名「本命」由你親自上陣(其餘自動);不選則全程觀戰。',
              'Your strongest officers contest a single-elimination bracket (non-lethal). Pick a champion to fight their bouts yourself in 3D — or leave it unset to watch it all auto-resolve.')}
          </div>
          {field.length < 4 ? (
            <div style={{ color: '#e0846a', fontStyle: 'italic', padding: '1rem 0' }}>
              {t('需至少 4 名武力 ≥ 50 的武將方可舉辦。', 'Need at least 4 officers with War ≥ 50.')}
            </div>
          ) : (
            <>
              <div style={{ fontSize: '0.68rem', color: '#7a8893', letterSpacing: '0.1rem', marginBottom: '0.4rem' }}>
                {t('參賽者 — 點選你的本命', 'Entrants — tap to fight as your champion')} ({field.length})
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px,1fr))', gap: 6, marginBottom: '1rem' }}>
                {field.map((o, i) => {
                  const picked = o.id === myPickId;
                  return (
                    <button
                      key={o.id}
                      onClick={() => setMyPickId(picked ? null : o.id)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 6, textAlign: 'left', cursor: 'pointer',
                        background: picked ? 'rgba(230,196,115,0.16)' : '#10161e',
                        border: `1px solid ${picked ? '#e6c473' : '#26323e'}`, borderRadius: 4, padding: '0.35rem 0.5rem',
                        color: '#e6edf3', fontFamily: 'var(--tkm-font-body)',
                      }}
                    >
                      <span style={{ fontSize: '0.66rem', color: '#7a8893', width: 14 }}>{i + 1}</span>
                      <OfficerPortrait officer={o} size={28} forceColor={picked ? '#e6c473' : '#26323e'} year={year} />
                      <span style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ color: '#f2dd9a', fontSize: '0.82rem' }}>{pickName(o.name, lang)}{picked ? ' ★' : ''}</span>
                        <span style={{ display: 'block', fontSize: '0.64rem', color: '#8a96a0' }}>{t('勇', 'PWR')} {staticProwess(o)}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
              <button
                onClick={start}
                style={{ width: '100%', padding: '0.6rem', background: 'linear-gradient(180deg,#7a5a20,#4a3510)', border: '1px solid #e6c473', color: '#ffe9a8', cursor: 'pointer', fontFamily: 'var(--tkm-font-body)', fontSize: '1rem', letterSpacing: '0.12rem' }}
              >🏆 {myPickId ? t('開賽 — 親自出戰', 'Begin — Fight in Person') : t('開賽 — 全程觀戰', 'Begin — Watch It Through')}</button>
            </>
          )}
        </>
      ) : (
        <>
          {championId && (
            <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.72rem', letterSpacing: '0.4rem', color: '#e0b060' }}>{t('天下無雙', 'PEERLESS UNDER HEAVEN')}</div>
              <div style={{ display: 'flex', justifyContent: 'center', margin: '0.5rem 0' }}>
                <div style={{ borderRadius: '50%', border: '2px solid #e6c473', boxShadow: '0 0 22px rgba(230,196,115,0.7)' }}>
                  <OfficerPortrait officer={officers[championId]} size={96} forceColor="#e6c473" year={year} />
                </div>
              </div>
              <div style={{ fontSize: '1.5rem', color: '#f2dd9a' }}>{pickName(officers[championId].name, lang)}{championId === myPickId ? t('（本命奪魁!）', ' (your champion!)') : ''}</div>
            </div>
          )}

          {rounds.map((matches, ri) => (
            <div key={ri} style={{ marginBottom: '0.7rem' }}>
              <div style={{ fontSize: '0.66rem', color: '#7a8893', letterSpacing: '0.1rem', textTransform: 'uppercase', marginBottom: '0.3rem' }}>{roundName(ri, rounds.length)}</div>
              {matches.map((m, mi) => {
                const a = officers[m.aId], b = officers[m.bId];
                const side = (o: typeof a, win: boolean) => (
                  <span style={{ color: win ? '#9ed68a' : '#8a96a0', fontWeight: win ? 700 : 400 }}>
                    {pickName(o.name, lang)}{win ? ' ✔' : ''}
                  </span>
                );
                return (
                  <div key={mi} style={{ fontSize: '0.84rem', padding: '0.25rem 0.5rem', background: '#10161e', border: '1px solid #1e2832', borderRadius: 3, marginBottom: 3 }}>
                    {side(a, m.winnerId === a.id)} <span style={{ color: '#5f6c76' }}>vs</span> {side(b, m.winnerId === b.id)}
                  </div>
                );
              })}
            </div>
          ))}

          {notes.length > 0 && (
            <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid #3a4754', borderRadius: 6, padding: '0.6rem 0.8rem', marginTop: '0.6rem' }}>
              <div style={{ fontSize: '0.7rem', color: '#7a8893', marginBottom: '0.3rem' }}>{t('賽後成長', 'Growth')}</div>
              {notes.map((n, i) => <div key={i} style={{ fontSize: '0.78rem', color: '#9ed68a', lineHeight: 1.6 }}>✦ {n}</div>)}
            </div>
          )}
        </>
      )}
    </Modal>
  );
}
