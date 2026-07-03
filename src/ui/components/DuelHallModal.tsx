import { useMemo, useState } from 'react';
import { useGameStore } from '../../game/state/store';
import type { BoutRecord } from '../../game/systems/duelHall';
import { ladderBoard, ratingTier } from '../../game/systems/warRanking';
import { NEMESIS_THRESHOLD, type RivalryRecord } from '../../game/systems/rivalries';
import { resolveDuel, canDuel } from '../../game/systems/duel';
import { wagerMultiplier, wagerProfit } from '../../game/systems/wager';
import { Modal } from './Modal';
import { OfficerPortrait } from './OfficerPortrait';
import { BoutReplay3D } from './duel/BoutReplay3D';
import { useT, useLanguage, pickName } from '../i18n';

const SEASON_ZH = ['春', '夏', '秋', '冬'];
const SEASON_EN = ['Spring', 'Summer', 'Autumn', 'Winter'];

/**
 * 武鬥館 — the Hall of Famous Bouts. Two views: a 戰績榜 leaderboard ranking
 * officers by duels / debates won, and a 名局廊 gallery of saved bouts that can
 * be re-staged in the 3D arena.
 */
export function DuelHallModal({ onClose }: { onClose: () => void }) {
  const t = useT();
  const lang = useLanguage();
  const officers = useGameStore((s) => s.officers);
  const deeds = useGameStore((s) => s.deeds);
  const duelHall = useGameStore((s) => s.duelHall);
  const warRatings = useGameStore((s) => s.warRatings);
  const rivalries = useGameStore((s) => s.rivalries);
  const applyScenarioEffects = useGameStore((s) => s.applyScenarioEffects);
  const playerGold = useGameStore((s) => {
    const f = s.forces[s.playerForceId ?? ''];
    return f ? (s.cities[f.capitalCityId]?.gold ?? 0) : 0;
  });
  const [tab, setTab] = useState<'ranks' | 'ladder' | 'feuds' | 'gallery' | 'bet'>('ranks');
  const [replay, setReplay] = useState<BoutRecord | null>(null);
  // 賭坊 — bet on a duel between any two warriors; the house resolves it.
  const fighters = useMemo(
    () => Object.values(officers).filter((o) => o.status !== 'dead' && o.status !== 'unsearched' && o.status !== 'imprisoned' && canDuel(o).ok).sort((a, b) => b.stats.war - a.stats.war),
    [officers],
  );
  const [betAId, setBetAId] = useState('');
  const [betBId, setBetBId] = useState('');
  const [back, setBack] = useState<'a' | 'b'>('a');
  const [stake, setStake] = useState(100);
  const [betResult, setBetResult] = useState<{ text: string; win: boolean } | null>(null);
  const betA = officers[betAId];
  const betB = officers[betBId];
  const odds = betA && betB ? wagerMultiplier(back === 'a' ? betA : betB, back === 'a' ? betB : betA) : 1;

  const runBet = () => {
    if (!betA || !betB || betAId === betBId) return;
    const bet = Math.min(stake, playerGold);
    const res = resolveDuel({ attacker: betA, defender: betB });
    const backedWon = (back === 'a' && res.winner === 'attacker') || (back === 'b' && res.winner === 'defender');
    const winnerName = res.winner === 'attacker' ? nm(betAId) : res.winner === 'defender' ? nm(betBId) : t('平手', 'a draw');
    if (res.winner === 'draw') {
      setBetResult({ text: t(`${nm(betAId)} 與 ${nm(betBId)} 戰平 — 押注退回。`, `${nm(betAId)} and ${nm(betBId)} draw — your stake is returned.`), win: false });
      return;
    }
    if (backedWon && bet > 0) {
      const profit = wagerProfit(bet, odds);
      applyScenarioEffects([{ kind: 'gold', amount: profit, textZh: '', textEn: '' }]);
      setBetResult({ text: t(`${winnerName} 得勝 — 押中!淨賺 ${profit} 金。`, `${winnerName} wins — you called it! +${profit} gold.`), win: true });
    } else {
      if (bet > 0) applyScenarioEffects([{ kind: 'gold', amount: -bet, textZh: '', textEn: '' }]);
      setBetResult({ text: t(`${winnerName} 得勝 — 押注 ${bet} 金付諸流水。`, `${winnerName} wins — your ${bet} gold is lost.`), win: false });
    }
  };

  const nm = (id: string) => {
    const o = officers[id];
    return o ? pickName(o.name, lang) : id;
  };

  const { duelRanks, debateRanks } = useMemo(() => {
    const rank = (key: 'duelsWon' | 'debatesWon') => Object.values(deeds)
      .map((d) => ({ id: d.officerId, n: (d as unknown as Record<string, number>)[key] ?? 0 }))
      .filter((r) => r.n > 0 && officers[r.id])
      .sort((a, b) => b.n - a.n)
      .slice(0, 10);
    return { duelRanks: rank('duelsWon'), debateRanks: rank('debatesWon') };
  }, [deeds, officers]);

  const ladder = useMemo(() => ladderBoard(warRatings, officers).slice(0, 12), [warRatings, officers]);

  // 恩怨簿 — every pair that has crossed blades, most-fought first; sworn 宿敵
  // and blood-ended feuds flagged. Drop pairs where an officer no longer exists.
  const feuds = useMemo(
    () => Object.values(rivalries ?? {})
      .filter((r) => officers[r.aId] && officers[r.bId])
      .sort((a, b) => b.bouts - a.bouts)
      .slice(0, 20),
    [rivalries, officers],
  );

  if (replay) {
    return <BoutReplay3D rec={replay} onClose={() => setReplay(null)} />;
  }

  const medal = (i: number) => (i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`);

  const rankList = (rows: Array<{ id: string; n: number }>, unit: string, color: string) => (
    rows.length === 0
      ? <div style={{ color: '#7a8893', fontStyle: 'italic', padding: '0.6rem 0' }}>{t('尚無紀錄。', 'No records yet.')}</div>
      : (
        <div style={{ display: 'grid', gap: 4 }}>
          {rows.map((r, i) => {
            const o = officers[r.id];
            return (
              <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 8, background: i < 3 ? 'rgba(230,196,115,0.08)' : '#10161e', border: `1px solid ${i < 3 ? '#caa86a' : '#26323e'}`, borderRadius: 'var(--tkm-radius-sm)', padding: '0.3rem 0.5rem' }}>
                <span style={{ width: 24, textAlign: 'center', color: '#caa86a' }}>{medal(i)}</span>
                {o && <OfficerPortrait officer={o} size={28} forceColor={color} year={useGameStore.getState().date.year} />}
                <span style={{ flex: 1, color: '#f2dd9a', fontSize: '0.88rem' }}>{nm(r.id)}</span>
                <span style={{ color, fontWeight: 600 }}>{r.n}</span>
                <span style={{ color: '#7a8893', fontSize: '0.72rem' }}>{unit}</span>
              </div>
            );
          })}
        </div>
      )
  );

  return (
    <Modal onClose={onClose} title={t('武鬥館', 'Hall of Bouts')} icon="🏆" width="min(560px, 100%)" scrollBody>
      <div style={{ display: 'flex', gap: 6, marginBottom: '0.9rem' }}>
        {(['ranks', 'ladder', 'feuds', 'gallery', 'bet'] as const).map((m) => (
          <button
            key={m}
            onClick={() => setTab(m)}
            style={{
              flex: 1, padding: '0.4rem 0.2rem', borderRadius: 'var(--tkm-radius-sm)', cursor: 'pointer', fontFamily: 'var(--tkm-font-body)', fontSize: '0.78rem',
              background: tab === m ? 'rgba(230,196,115,0.18)' : '#10161e',
              border: `1px solid ${tab === m ? '#e6c473' : '#26323e'}`, color: tab === m ? '#f2dd9a' : '#8a96a0',
            }}
          >{m === 'ranks' ? t('戰績', 'Wins') : m === 'ladder' ? t('武評', 'Ladder') : m === 'feuds' ? `${t('恩怨', 'Feuds')}${feuds.length > 0 ? ` (${feuds.length})` : ''}` : m === 'bet' ? t('賭坊', 'Wagers') : `${t('名局', 'Replays')}${duelHall.length > 0 ? ` (${duelHall.length})` : ''}`}</button>
        ))}
      </div>

      {tab === 'ladder' && (
        <>
          <div style={{ fontSize: '0.72rem', color: '#aab6c0', lineHeight: 1.5, margin: '0 0 0.6rem 2px' }}>
            {t('天下武評 — 依單挑勝負實時升降的 ELO 天梯(未對戰者依武力評定)。', 'The realm\'s war ladder — live ELO from duel results (un-fought generals seeded from 武力).')}
          </div>
          <div style={{ display: 'grid', gap: 4 }}>
            {ladder.map((r, i) => {
              const o = officers[r.id];
              const tier = ratingTier(r.rating);
              return (
                <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 8, background: i < 3 ? 'rgba(230,196,115,0.08)' : '#10161e', border: `1px solid ${i < 3 ? '#caa86a' : '#26323e'}`, borderRadius: 'var(--tkm-radius-sm)', padding: '0.3rem 0.5rem' }}>
                  <span style={{ width: 24, textAlign: 'center', color: '#caa86a' }}>{medal(i)}</span>
                  {o && <OfficerPortrait officer={o} size={28} forceColor="#e0846a" year={useGameStore.getState().date.year} />}
                  <span style={{ flex: 1, color: '#f2dd9a', fontSize: '0.86rem' }}>{nm(r.id)}</span>
                  <span style={{ color: '#8aa0b8', fontSize: '0.68rem' }}>{lang === 'en' ? tier.en : tier.zh}</span>
                  <span style={{ color: '#e0b060', fontWeight: 600, minWidth: 42, textAlign: 'right' }}>{r.rating}</span>
                  {r.seeded && <span style={{ color: '#5f6c76', fontSize: '0.7rem' }}>{t('評', '~')}</span>}
                </div>
              );
            })}
          </div>
        </>
      )}

      {tab === 'ranks' && (
        <>
          <div style={{ fontSize: '0.7rem', color: '#e08a4a', letterSpacing: '0.1rem', margin: '0 0 0.4rem 2px' }}>⚔ {t('單挑勝場', 'Duels Won')}</div>
          {rankList(duelRanks, t('勝', 'wins'), '#e0846a')}
          <div style={{ fontSize: '0.7rem', color: '#88b7e8', letterSpacing: '0.1rem', margin: '0.9rem 0 0.4rem 2px' }}>💬 {t('舌戰勝場', 'Debates Won')}</div>
          {rankList(debateRanks, t('勝', 'wins'), '#88b7e8')}
        </>
      )}

      {tab === 'bet' && (
        <>
          <div style={{ fontSize: '0.72rem', color: '#aab6c0', lineHeight: 1.5, margin: '0 0 0.6rem 2px' }}>
            {t('賭坊 — 押注兩將之單挑,莊家依武力開盤,中者依賠率得金。', 'The wager house — bet on a duel between two warriors; the house sets odds by 武力, winners paid by the multiplier.')}
            <span style={{ color: '#e0b060' }}> · 💰 {playerGold}</span>
          </div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
            {(['a', 'b'] as const).map((side) => (
              <select
                key={side}
                value={side === 'a' ? betAId : betBId}
                onChange={(e) => side === 'a' ? setBetAId(e.target.value) : setBetBId(e.target.value)}
                style={{ flex: 1, minWidth: 0, background: '#10161e', color: '#e6edf3', border: `1px solid ${side === 'a' ? '#e0846a' : '#88b7e8'}`, borderRadius: 'var(--tkm-radius-sm)', padding: '0.35rem', fontFamily: 'var(--tkm-font-body)', fontSize: '0.78rem' }}
              >
                <option value="">{side === 'a' ? t('紅方…', 'Red…') : t('藍方…', 'Blue…')}</option>
                {fighters.map((o) => <option key={o.id} value={o.id}>{nm(o.id)}（{t('武', 'W')}{o.stats.war}）</option>)}
              </select>
            ))}
          </div>
          {betA && betB && betAId !== betBId && (
            <>
              <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                {(['a', 'b'] as const).map((side) => {
                  const on = back === side;
                  const o = side === 'a' ? betA : betB;
                  return (
                    <button key={side} onClick={() => setBack(side)} style={{ flex: 1, padding: '0.35rem', borderRadius: 'var(--tkm-radius-sm)', cursor: 'pointer', fontFamily: 'var(--tkm-font-body)', fontSize: '0.8rem', background: on ? 'rgba(230,196,115,0.2)' : '#10161e', border: `1px solid ${on ? '#e6c473' : '#26323e'}`, color: on ? '#f2dd9a' : '#8a96a0' }}>
                      {t('押', 'Back')} {nm(o.id)} ×{wagerMultiplier(o, side === 'a' ? betB : betA)}
                    </button>
                  );
                })}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.72rem', color: '#caa86a' }}>{t('籌碼', 'Stake')}</span>
                {[100, 250, 500, 1000].map((amt) => (
                  <button key={amt} disabled={amt > playerGold} onClick={() => setStake(amt)} style={{ padding: '0.2rem 0.5rem', fontFamily: 'inherit', fontSize: '0.74rem', borderRadius: 'var(--tkm-radius-sm)', cursor: amt <= playerGold ? 'pointer' : 'default', background: stake === amt ? 'rgba(230,196,115,0.22)' : '#1a1410', border: `1px solid ${stake === amt ? '#e6c473' : '#3a2c1c'}`, color: amt > playerGold ? '#5a4a36' : stake === amt ? '#ffe8a8' : '#c8a878' }}>{amt}</button>
                ))}
              </div>
              <button
                onClick={runBet}
                disabled={playerGold < Math.min(stake, playerGold) || playerGold <= 0}
                style={{ width: '100%', padding: '0.5rem', marginBottom: 8, background: 'linear-gradient(180deg,#6e4a23,#3e2813)', border: '1px solid #e0b060', color: '#ffe8c0', cursor: 'pointer', fontFamily: 'var(--tkm-font-body)', fontSize: '0.95rem', letterSpacing: '0.08rem', borderRadius: 'var(--tkm-radius-sm)' }}
              >🎲 {t('開賭', 'Place the Wager')}</button>
            </>
          )}
          {betResult && (
            <div style={{ background: 'rgba(0,0,0,0.3)', border: `1px solid ${betResult.win ? '#6aae73' : '#a05050'}`, borderRadius: 'var(--tkm-radius)', padding: '0.6rem 0.8rem', color: betResult.win ? '#9ed68a' : '#e0a0a0' }}>{betResult.text}</div>
          )}
        </>
      )}

      {tab === 'feuds' && (
        <>
          <div style={{ fontSize: '0.72rem', color: '#aab6c0', lineHeight: 1.5, margin: '0 0 0.6rem 2px' }}>
            {t('恩怨簿 — 凡反覆交手者皆記逐對戰績;交手三次以上即結「宿敵」(重逢知己知彼);一方斬殺即血仇了結。', 'The book of feuds — every pair who keep crossing blades, with their head-to-head. Three bouts forge sworn 宿敵; a kill closes it in blood.')}
          </div>
          {feuds.length === 0 ? (
            <div style={{ color: '#7a8893', fontStyle: 'italic', padding: '1rem 0' }}>
              {t('尚無恩怨。同一對武將反覆單挑,便會在此結下宿敵。', 'No feuds yet. When the same two warriors keep dueling, a rivalry forms here.')}
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 5 }}>
              {feuds.map((r: RivalryRecord) => {
                const a = officers[r.aId], b = officers[r.bId];
                const sworn = r.bouts >= NEMESIS_THRESHOLD && !r.killerId;
                const blood = !!r.killerId;
                const border = blood ? '#a05050' : sworn ? '#e07a5a' : '#26323e';
                return (
                  <div key={`${r.aId}|${r.bId}`} style={{ display: 'flex', alignItems: 'center', gap: 8, background: sworn || blood ? 'rgba(120,40,30,0.12)' : '#10161e', border: `1px solid ${border}`, borderRadius: 'var(--tkm-radius-sm)', padding: '0.35rem 0.55rem' }}>
                    {a && <OfficerPortrait officer={a} size={28} forceColor="#e0846a" year={useGameStore.getState().date.year} />}
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ color: '#f2dd9a', fontSize: '0.86rem' }}>
                        {nm(r.aId)} <span style={{ color: '#ffd28a', fontWeight: 700 }}>{r.aWins}</span>
                        <span style={{ color: '#7a8893' }}> – </span>
                        <span style={{ color: '#ffd28a', fontWeight: 700 }}>{r.bWins}</span> {nm(r.bId)}
                        {r.draws > 0 && <span style={{ color: '#7a8893', fontSize: '0.72rem' }}> ・{t('平', 'draw')}{r.draws}</span>}
                      </span>
                      <span style={{ display: 'block', fontSize: '0.66rem', color: '#8a96a0' }}>
                        {blood
                          ? <span style={{ color: '#e06a5a' }}>🩸 {t('血仇了結', 'Settled in blood')} — {nm(r.killerId!)} {t('斬', 'slew')} {nm(r.victimId!)}</span>
                          : sworn
                            ? <span style={{ color: '#e0846a' }}>⚔ {t('宿敵', 'Sworn rivals')} · {t('交手', 'fought')} {r.bouts} {t('場', '×')}</span>
                            : <>{t('舊識', 'Old foes')} · {t('交手', 'fought')} {r.bouts} {t('場', '×')}</>}
                      </span>
                    </span>
                    {b && <OfficerPortrait officer={b} size={28} forceColor="#88b7e8" year={useGameStore.getState().date.year} />}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {tab === 'gallery' && (
        <div style={{ display: 'grid', gap: 6 }}>
          {duelHall.length === 0 && (
            <div style={{ color: '#7a8893', fontStyle: 'italic', padding: '1rem 0' }}>
              {t('尚無名局。一場斬將或罵死、一場酣戰,皆會載入此廊。', 'No famous bouts yet. A kill, a 罵死 rout, or a long hard fight will be recorded here.')}
            </div>
          )}
          {duelHall.map((rec) => {
            const aWon = rec.kind === 'duel' ? rec.winner === 'attacker' : rec.winner === 'a';
            const dWon = rec.kind === 'duel' ? rec.winner === 'defender' : rec.winner === 'd';
            const flourish = rec.kind === 'duel'
              ? (rec.killed ? t('斬', 'slew') : aWon || dWon ? t('力克', 'bested') : t('戰平', 'drew'))
              : (rec.routed ? t('罵倒', 'shouted down') : aWon || dWon ? t('辯勝', 'out-argued') : t('平手', 'drew'));
            const winnerName = aWon ? nm(rec.aId) : dWon ? nm(rec.dId) : null;
            const loserName = aWon ? nm(rec.dId) : dWon ? nm(rec.aId) : null;
            return (
              <button
                key={rec.id}
                onClick={() => setReplay(rec)}
                style={{ textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8, background: '#10161e', border: `1px solid ${rec.kind === 'duel' ? '#3a2c1c' : '#243240'}`, borderRadius: 'var(--tkm-radius-sm)', padding: '0.45rem 0.6rem', cursor: 'pointer', color: '#e6edf3', fontFamily: 'var(--tkm-font-body)' }}
              >
                <span style={{ fontSize: '1.1rem' }}>{rec.kind === 'duel' ? '⚔' : '💬'}</span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ color: '#f2dd9a', fontSize: '0.86rem' }}>
                    {winnerName
                      ? <>{winnerName} <span style={{ color: '#caa86a' }}>{flourish}</span> {loserName}</>
                      : <>{nm(rec.aId)} <span style={{ color: '#7a8893' }}>{flourish}</span> {nm(rec.dId)}</>}
                    {(rec.kind === 'duel' && rec.killed) || (rec.kind === 'debate' && rec.routed) ? <span style={{ color: '#e06a5a' }}> ★</span> : null}
                  </span>
                  <span style={{ display: 'block', fontSize: '0.68rem', color: '#7a8893' }}>
                    {lang === 'en' ? SEASON_EN[rec.season] : SEASON_ZH[rec.season]}{lang === 'en' ? ` ${rec.year}` : ` ${rec.year}年`} · {rec.fx.length} {t('回合', 'rounds')}
                  </span>
                </span>
                <span style={{ color: '#9ed68a', fontSize: '0.8rem' }}>▶ {t('重演', 'Play')}</span>
              </button>
            );
          })}
        </div>
      )}
    </Modal>
  );
}
