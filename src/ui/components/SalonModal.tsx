import { useMemo, useRef, useState } from 'react';
import { useGameStore } from '../../game/state/store';
import { resolveWordWar } from '../../game/systems/wordWar';
import { moonScore, canOrate } from '../../game/systems/scholarRank';
import { playSfx } from '../../game/systems/sound';
import { Modal } from './Modal';
import { OfficerPortrait } from './OfficerPortrait';
import { Debate3DStage } from './debate/Debate3DStage';
import { useT, useLanguage, pickName } from '../i18n';

interface Match { aId: string; bId: string; winnerId: string; }

// Same seeding as the martial bracket so top seeds meet late.
const SEED_4 = [0, 3, 1, 2];
const SEED_8 = [0, 7, 3, 4, 1, 6, 2, 5];

/**
 * 清談大會 (§6.15) — the 舌戰 mirror of the 比武大會. Your keenest tongues contest
 * a single-elimination bracket of wars of words. Pick a 本命 to argue their own
 * bouts in the 3D hall; the rest auto-resolve on the shared 舌戰 engine. The
 * victor is crowned 文魁 — a steep climb in 文名 and a purse of 文辯心得.
 */
export function SalonModal({ onClose }: { onClose: () => void }) {
  const t = useT();
  const lang = useLanguage();
  const officers = useGameStore((s) => s.officers);
  const playerForceId = useGameStore((s) => s.playerForceId);
  const year = useGameStore((s) => s.date.year);
  const grantOfficerXp = useGameStore((s) => s.grantOfficerXp);
  const awardSalonChampion = useGameStore((s) => s.awardSalonChampion);

  const eligible = useMemo(
    () => Object.values(officers)
      .filter((o) => o.forceId === playerForceId && canOrate(o))
      .sort((a, b) => moonScore(b) - moonScore(a)),
    [officers, playerForceId],
  );
  const field = useMemo(() => eligible.slice(0, eligible.length >= 8 ? 8 : 4), [eligible]);

  const [myPickId, setMyPickId] = useState<string | null>(null);
  const [rounds, setRounds] = useState<Match[][] | null>(null);
  const [championId, setChampionId] = useState<string | null>(null);
  const [notes, setNotes] = useState<string[]>([]);
  const [pending, setPending] = useState<{ foeId: string } | null>(null);

  const accRef = useRef<Match[][]>([]);
  const partsRef = useRef<string[]>([]);
  const pendingRef = useRef<{ matches: Match[]; champIdx: number } | null>(null);

  // Auto bouts run on the pre-battle 舌戰 resolver; a dead heat falls to the
  // keener 清議分 so a bracket always produces a winner.
  const autoWinner = (aId: string, bId: string): string => {
    const a = officers[aId], b = officers[bId];
    const r = resolveWordWar(a, b, [], [], Math.random);
    return r.winnerSide === 'attacker' ? a.id
      : r.winnerSide === 'defender' ? b.id
      : (moonScore(a) >= moonScore(b) ? a.id : b.id);
  };

  const finish = (champId: string) => {
    const all = accRef.current;
    setRounds(all);
    setChampionId(champId);
    playSfx('victory');
    const finalists = new Set(all[all.length - 1].flatMap((m) => [m.aId, m.bId]));
    const collected: string[] = [];
    for (const o of field) {
      const amt = o.id === champId ? 110 : finalists.has(o.id) ? 55 : 22;
      const res = grantOfficerXp(o.id, amt, ['intelligence', 'charisma']);
      if (res) collected.push(...res.notes);
    }
    const annual = awardSalonChampion(champId, [...finalists]);
    collected.unshift(annual
      ? t('📜 文魁 — 年度清談大會奪魁,文名大振、心得滿載!', '📜 Voice of the Salon — this year\'s title: fame through every court, and a purse of insight!')
      : t('📜 奪魁 — 然本年度清談已決,此番僅作清談。', '📜 Champion — but this year\'s title is already settled; this was but a friendly salon.'));
    setNotes(collected);
  };

  const drive = () => {
    let participants = partsRef.current;
    while (participants.length > 1) {
      const matches: Match[] = [];
      let champIdx = -1;
      for (let i = 0; i < participants.length; i += 2) {
        const x = participants[i], y = participants[i + 1];
        if (myPickId && champIdx < 0 && (x === myPickId || y === myPickId)) {
          // Always slot the player's debater as 'a' (the controllable side).
          champIdx = matches.length;
          matches.push({ aId: myPickId, bId: x === myPickId ? y : x, winnerId: '' });
        } else {
          matches.push({ aId: x, bId: y, winnerId: autoWinner(x, y) });
        }
      }
      if (champIdx >= 0) {
        pendingRef.current = { matches, champIdx };
        setPending({ foeId: matches[champIdx].bId });
        return; // wait for the interactive bout
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

  // While a 本命 bout is live, the 3D hall takes the whole screen.
  if (pending && myPickId) {
    const me = officers[myPickId];
    const foe = officers[pending.foeId];
    return (
      <Debate3DStage
        me={me}
        foe={foe}
        difficulty="peerless"
        onComplete={(o) => {
          const champWon = o.winner === 'me' || (o.winner === 'draw' && moonScore(me) >= moonScore(foe));
          onChampBout(champWon);
        }}
      />
    );
  }

  const nm = (id: string) => {
    const o = officers[id];
    return o ? pickName(o.name, lang) : id;
  };
  const roundName = (idx: number, total: number) => {
    const fromEnd = total - 1 - idx;
    if (fromEnd === 0) return t('決辯', 'Final');
    if (fromEnd === 1) return t('準決辯', 'Semifinal');
    return t(`第 ${idx + 1} 輪`, `Round ${idx + 1}`);
  };

  return (
    <Modal onClose={onClose} title={t('清談大會', 'Debate Salon')} icon="📜" width="min(560px, 100%)" scrollBody>
      {!rounds ? (
        <>
          <div style={{ fontSize: '0.82rem', color: '#aab6c0', marginBottom: '0.8rem', lineHeight: 1.6 }}>
            {t('召集麾下辯才,單淘汰較量辭鋒。選一名「本命」由你親自登殿(其餘自動);不選則全程觀辯。奪魁者為天下文魁 — 文名大振,並得心得之賞。',
              'Your keenest tongues contest a single-elimination bracket of debates. Pick a champion to argue their own bouts in 3D — or watch it all resolve. The victor is crowned 文魁: fame and a purse of insight.')}
          </div>
          {field.length < 4 ? (
            <div style={{ color: '#e0846a', fontStyle: 'italic', padding: '1rem 0' }}>
              {t('需至少 4 名可與辯之士方可開席。', 'Need at least 4 officers fit to debate.')}
            </div>
          ) : (
            <>
              <div style={{ fontSize: '0.68rem', color: '#7a8893', letterSpacing: '0.1rem', marginBottom: '0.4rem' }}>
                {t('與辯者 — 點選你的本命', 'Entrants — tap to argue as your champion')} ({field.length})
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
                        background: picked ? 'rgba(136,183,232,0.16)' : '#10161e',
                        border: `1px solid ${picked ? '#88b7e8' : '#26323e'}`, borderRadius: 'var(--tkm-radius-sm)', padding: '0.35rem 0.5rem',
                        color: '#e6edf3', fontFamily: 'var(--tkm-font-body)',
                      }}
                    >
                      <span style={{ fontSize: '0.66rem', color: '#7a8893', width: 14 }}>{i + 1}</span>
                      <OfficerPortrait officer={o} size={28} forceColor={picked ? '#88b7e8' : '#26323e'} year={year} />
                      <span style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ color: '#f2dd9a', fontSize: '0.82rem' }}>{pickName(o.name, lang)}{picked ? ' ★' : ''}</span>
                        <span style={{ display: 'block', fontSize: '0.64rem', color: '#8a96a0' }}>{t('清議', 'Rank')} {moonScore(o)}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
              <button
                onClick={start}
                style={{ width: '100%', padding: '0.6rem', background: 'linear-gradient(180deg,#234a6e,#13283e)', border: '1px solid #88b7e8', color: '#d8ecff', cursor: 'pointer', fontFamily: 'var(--tkm-font-body)', fontSize: '1rem', letterSpacing: '0.12rem' }}
              >📜 {myPickId ? t('開席 — 親自登殿', 'Begin — Argue in Person') : t('開席 — 全程觀辯', 'Begin — Watch It Through')}</button>
            </>
          )}
        </>
      ) : (
        <>
          <div style={{ textAlign: 'center', marginBottom: '0.9rem' }}>
            <div style={{ color: '#88b7e8', fontSize: '1.15rem', letterSpacing: '0.1rem' }}>
              📜 {t('文魁', 'Voice of the Salon')} — {championId ? nm(championId) : ''}
            </div>
          </div>
          {rounds.map((matches, ri) => (
            <div key={ri} style={{ marginBottom: '0.7rem' }}>
              <div style={{ fontSize: '0.68rem', color: '#7a8893', letterSpacing: '0.1rem', marginBottom: 4 }}>{roundName(ri, rounds.length)}</div>
              <div style={{ display: 'grid', gap: 4 }}>
                {matches.map((m, mi) => (
                  <div key={mi} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#10161e', border: '1px solid #26323e', borderRadius: 'var(--tkm-radius-sm)', padding: '0.3rem 0.55rem', fontSize: '0.82rem' }}>
                    <span style={{ flex: 1, color: m.winnerId === m.aId ? '#f2dd9a' : '#7a8893' }}>{nm(m.aId)}</span>
                    <span style={{ color: '#5f6c76', fontSize: '0.72rem' }}>vs</span>
                    <span style={{ flex: 1, textAlign: 'right', color: m.winnerId === m.bId ? '#f2dd9a' : '#7a8893' }}>{nm(m.bId)}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {notes.length > 0 && (
            <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid #3a4754', borderRadius: 'var(--tkm-radius)', padding: '0.6rem 0.8rem', marginTop: '0.6rem' }}>
              {notes.map((n, i) => (
                <div key={i} style={{ fontSize: '0.8rem', color: i === 0 ? '#f2dd9a' : '#9ed68a', lineHeight: 1.6 }}>{i === 0 ? n : `✦ ${n}`}</div>
              ))}
            </div>
          )}
        </>
      )}
    </Modal>
  );
}
