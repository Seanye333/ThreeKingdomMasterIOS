import { useMemo, useState } from 'react';
import { useGameStore } from '../../game/state/store';
import { canDuel, resolveDuel, staticProwess } from '../../game/systems/duel';
import { playSfx } from '../../game/systems/sound';
import { Modal } from './Modal';
import { OfficerPortrait } from './OfficerPortrait';
import { useT, useLanguage, pickName } from '../i18n';

interface Match { aId: string; bId: string; winnerId: string; }

// Standard single-elim seeding so top seeds meet late (indices into the seeded
// field). 4 → [1v4, 2v3]; 8 → the classic 1/8/4/5/2/7/3/6 ladder.
const SEED_4 = [0, 3, 1, 2];
const SEED_8 = [0, 7, 3, 4, 1, 6, 2, 5];

/**
 * 比武大會 — a martial tournament. Your strongest duel-capable officers fight a
 * single-elimination bracket (non-lethal). The champion is crowned 天下無雙 and
 * wins the most experience; finalists and the rest earn lesser shares.
 */
export function TournamentModal({ onClose }: { onClose: () => void }) {
  const t = useT();
  const lang = useLanguage();
  const officers = useGameStore((s) => s.officers);
  const playerForceId = useGameStore((s) => s.playerForceId);
  const year = useGameStore((s) => s.date.year);
  const grantOfficerXp = useGameStore((s) => s.grantOfficerXp);

  const eligible = useMemo(
    () => Object.values(officers)
      .filter((o) => o.forceId === playerForceId && o.status !== 'dead' && o.status !== 'imprisoned' && canDuel(o).ok)
      .sort((a, b) => staticProwess(b) - staticProwess(a)),
    [officers, playerForceId],
  );

  const [rounds, setRounds] = useState<Match[][] | null>(null);
  const [championId, setChampionId] = useState<string | null>(null);
  const [notes, setNotes] = useState<string[]>([]);

  const field = useMemo(() => eligible.slice(0, eligible.length >= 8 ? 8 : 4), [eligible]);

  const run = () => {
    if (field.length < 4) return;
    const size = field.length >= 8 ? 8 : 4;
    const seed = size === 8 ? SEED_8 : SEED_4;
    let current = seed.map((i) => field[i].id);
    const allRounds: Match[][] = [];
    while (current.length > 1) {
      const matches: Match[] = [];
      for (let i = 0; i < current.length; i += 2) {
        const a = officers[current[i]];
        const b = officers[current[i + 1]];
        const r = resolveDuel({ attacker: a, defender: b, rng: Math.random });
        const winnerId = r.winner === 'defender' ? b.id
          : r.winner === 'attacker' ? a.id
          : (staticProwess(a) >= staticProwess(b) ? a.id : b.id);
        matches.push({ aId: a.id, bId: b.id, winnerId });
      }
      allRounds.push(matches);
      current = matches.map((m) => m.winnerId);
    }
    const champ = current[0];
    setRounds(allRounds);
    setChampionId(champ);
    playSfx('victory');
    // Prizes: champion most, the other finalist next, the rest a token.
    const finalists = new Set(allRounds[allRounds.length - 1].flatMap((m) => [m.aId, m.bId]));
    const collected: string[] = [];
    for (const o of field.slice(0, size)) {
      const amt = o.id === champ ? 120 : finalists.has(o.id) ? 60 : 25;
      const res = grantOfficerXp(o.id, amt);
      if (res) collected.push(...res.notes);
    }
    setNotes(collected);
  };

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
            {t('召集麾下最強武將,單淘汰較量武藝(點到為止)。冠軍封「天下無雙」,獲最豐經驗;入圍者亦有所獲。',
              'Your strongest officers contest a single-elimination bracket (non-lethal). The champion is crowned the realm’s finest and wins the most experience.')}
          </div>
          {field.length < 4 ? (
            <div style={{ color: '#e0846a', fontStyle: 'italic', padding: '1rem 0' }}>
              {t('需至少 4 名武力 ≥ 50 的武將方可舉辦。', 'Need at least 4 officers with War ≥ 50.')}
            </div>
          ) : (
            <>
              <div style={{ fontSize: '0.68rem', color: '#7a8893', letterSpacing: '0.1rem', marginBottom: '0.4rem' }}>
                {t('參賽者', 'Entrants')} ({field.length})
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px,1fr))', gap: 6, marginBottom: '1rem' }}>
                {field.map((o, i) => (
                  <div key={o.id} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#10161e', border: '1px solid #26323e', borderRadius: 4, padding: '0.35rem 0.5rem' }}>
                    <span style={{ fontSize: '0.66rem', color: '#7a8893', width: 14 }}>{i + 1}</span>
                    <OfficerPortrait officer={o} size={28} forceColor="#e6c473" year={year} />
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ color: '#f2dd9a', fontSize: '0.82rem' }}>{pickName(o.name, lang)}</span>
                      <span style={{ display: 'block', fontSize: '0.64rem', color: '#8a96a0' }}>{t('勇', 'PWR')} {staticProwess(o)}</span>
                    </span>
                  </div>
                ))}
              </div>
              <button
                onClick={run}
                style={{ width: '100%', padding: '0.6rem', background: 'linear-gradient(180deg,#7a5a20,#4a3510)', border: '1px solid #e6c473', color: '#ffe9a8', cursor: 'pointer', fontFamily: 'var(--tkm-font-body)', fontSize: '1rem', letterSpacing: '0.12rem' }}
              >🏆 {t('開賽', 'Begin the Tournament')}</button>
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
              <div style={{ fontSize: '1.5rem', color: '#f2dd9a' }}>{pickName(officers[championId].name, lang)}</div>
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
