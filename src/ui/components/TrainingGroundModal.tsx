import { useMemo, useState } from 'react';
import { useGameStore } from '../../game/state/store';
import { canDuel, type DuelDifficulty } from '../../game/systems/duel';
import { initDuelSeries, advanceDuelSeries, seriesOver, seriesWinner, type DuelSeriesState } from '../../game/systems/duelSeries';
import { wagerMultiplier, wagerProfit } from '../../game/systems/wager';
import { findRivalryChallenge } from '../../game/systems/rivalries';
import { DUEL_SCENARIOS, DUEL_CAMPAIGNS, campaignSteps, duelScenarioOutcome, duelScenarioResultLine, type DuelScenario } from '../../game/systems/duelScenarios';
import { renownFromDeeds, fameTier, rollChallenger } from '../../game/systems/fame';
import { trainKey, trainsLeft, canTrain, TRAIN_PER_SEASON } from '../../game/systems/sparLimit';
import { officerLevel } from '../../game/systems/officerGrade';
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
  const recordTrainingUse = useGameStore((s) => s.recordTrainingUse);
  const sparUsage = useGameStore((s) => s.sparUsage);
  const date = useGameStore((s) => s.date);
  const recordDeed = useGameStore((s) => s.recordDeed);
  const deeds = useGameStore((s) => s.deeds);
  const applyScenarioEffects = useGameStore((s) => s.applyScenarioEffects);
  const clearedScenarios = useGameStore((s) => s.clearedDuelScenarios);
  const markDuelScenarioCleared = useGameStore((s) => s.markDuelScenarioCleared);
  const rapport = useGameStore((s) => s.rapport);

  // 宿敵 — a rival of one of your generals, present & hostile, rides out to fight.
  const rivalry = useMemo(() => {
    const ch = findRivalryChallenge(officers, playerForceId, rapport);
    if (!ch) return null;
    const champ = officers[ch.championId];
    const rival = officers[ch.rivalId];
    return champ && rival ? { ...ch, champ, rival } : null;
  }, [officers, playerForceId, rapport]);
  const [rivalDuel, setRivalDuel] = useState(false);
  // 國庫 — the capital's coffers, the ceiling on any wager.
  const playerGold = useGameStore((s) => {
    const f = s.forces[s.playerForceId ?? ''];
    return f ? (s.cities[f.capitalCityId]?.gold ?? 0) : 0;
  });

  const roster = useMemo(
    () => Object.values(officers)
      .filter((o) => o.forceId === playerForceId && o.status !== 'dead' && o.status !== 'imprisoned' && canDuel(o).ok)
      .sort((a, b) => b.stats.war - a.stats.war),
    [officers, playerForceId],
  );

  const [mode, setMode] = useState<'spar' | 'story' | 'team'>('spar');
  // 車輪團戰 — two squads, king-of-the-hill: the winner stays (wounds carry), the
  // loser sends in their next fighter. The side that runs out of fighters loses.
  const [teamSel, setTeamSel] = useState<string[]>([]);
  const [team, setTeam] = useState<{ aIds: string[]; bIds: string[]; aIdx: number; bIdx: number; aFat: number; bFat: number; aDown: number; bDown: number } | null>(null);
  // 劇情單挑 — scenarios whose famous opponent is present on the map and hostile.
  const scenarios = useMemo(
    () => DUEL_SCENARIOS.filter((s) => {
      const opp = officers[s.opponentId];
      return opp && opp.status !== 'dead' && opp.status !== 'unsearched' && opp.forceId !== playerForceId;
    }),
    [officers, playerForceId],
  );
  const [scenario, setScenario] = useState<DuelScenario | null>(null);
  const [story, setStory] = useState<{ scenario: DuelScenario; championId: string } | null>(null);

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
  const [bestOf, setBestOf] = useState<1 | 3 | 5>(1);
  const [hotSeat, setHotSeat] = useState(false); // 雙人對戰 — P2 picks the foe's moves
  const [series, setSeries] = useState<DuelSeriesState | null>(null);
  const [sparring, setSparring] = useState(false);
  const [duelChallenge, setDuelChallenge] = useState(false);
  // 押注 — optional side-wager on the 踢館 bout (in gold, capped by the treasury).
  const [stake, setStake] = useState(0);
  const [result, setResult] = useState<{ text: string; notes: string[] } | null>(null);

  const a = aId ? officers[aId] : null;
  const b = bId ? officers[bId] : null;
  const ready = !!(a && b && aId !== bId);
  // 演武冷卻 — each officer gets a limited number of friendly spars per season.
  const seasonKey = trainKey(date);
  const sparLeftFor = (id: string | null) => (id ? trainsLeft(sparUsage ?? {}, id, seasonKey) : 0);
  const sparReady = ready && sparLeftFor(aId) > 0 && sparLeftFor(bId) > 0;

  // 敵隊 — auto-built opposing squad: the strongest roster officers not on your
  // team. 演武冷卻 — skip officers who are spent for the season (they can't field).
  const teamB = useMemo(
    () => roster.filter((o) => !teamSel.includes(o.id) && trainsLeft(sparUsage ?? {}, o.id, seasonKey) > 0).slice(0, Math.max(1, teamSel.length)),
    [roster, teamSel, sparUsage, seasonKey],
  );

  const pick = (id: string) => {
    setResult(null);
    if (mode === 'team') { setTeamSel((s) => s.includes(id) ? s.filter((x) => x !== id) : s.length < 5 ? [...s, id] : s); return; }
    if (mode === 'story') { setAId(aId === id ? null : id); return; } // story picks one champion
    if (aId === id) { setAId(null); return; }
    if (bId === id) { setBId(null); return; }
    if (!aId) setAId(id);
    else if (!bId) setBId(id);
    else { setAId(id); setBId(null); }
  };

  // While the bout plays, show only the duel (it's fixed-position; rendering it
  // alongside the higher-z modal would bury it).
  if (sparring && a && b) {
    // Grant XP / deeds / result once a (single bout or whole series) is settled.
    const settle = (winner: 'attacker' | 'defender' | 'draw', scoreNote?: string) => {
      const draw = winner === 'draw';
      const winnerId = draw || winner === 'attacker' ? aId! : bId!;
      const loserId = winnerId === aId ? bId! : aId!;
      const r = grantSparXp(winnerId, loserId, draw);
      recordTrainingUse('spar', [aId!, bId!]); // 演武冷卻 — both fighters spend a slot
      if (!draw) recordDeed(winnerId, { duelsWon: 1 }); // 名聲榜 — a 演武 win
      if (r) {
        const base = draw
          ? t('點到為止 — 雙方皆有所獲', 'A friendly draw — both learned from it')
          : t(`${r.winnerName} 佔上風`, `${pickName(officers[winnerId].name, lang)} prevails`);
        setResult({ text: scoreNote ? `${base}（${scoreNote}）` : base, notes: r.notes });
      }
    };
    return (
      <>
        {/* 系列賽 — running score banner over the 3D bout. */}
        {series && (
          <div style={{ position: 'fixed', top: 10, left: '50%', transform: 'translateX(-50%)', zIndex: 134, pointerEvents: 'none', background: 'rgba(20,28,38,0.92)', border: '1px solid #e6c473', borderRadius: 6, padding: '0.3rem 0.8rem', color: '#f2dd9a', fontFamily: 'var(--tkm-font-body)', fontSize: '0.86rem', letterSpacing: '0.04rem', whiteSpace: 'nowrap' }}>
            {t(`${series.bestOf} 局${Math.floor(series.bestOf / 2) + 1}勝`, `Best of ${series.bestOf}`)} · {pickName(a.name, lang)} <b style={{ color: '#ffe8a8' }}>{series.aWins}</b> : <b style={{ color: '#ffe8a8' }}>{series.dWins}</b> {pickName(b.name, lang)} · {t(`第 ${series.bout} 局`, `Bout ${series.bout}`)}
          </div>
        )}
        <Duel3DStage
          key={series ? `bout-${series.bout}` : 'single'}
          attacker={a}
          defender={b}
          lethal={false}
          difficulty={difficulty}
          hotSeat={hotSeat}
          meFatigue={series?.aFatigue ?? 0}
          foeFatigue={series?.dFatigue ?? 0}
          onComplete={(outcome) => {
            const boutWinner: 'attacker' | 'defender' | 'draw' = outcome.winner === 'draw' ? 'draw' : outcome.winner === 'attacker' ? 'attacker' : 'defender';
            if (series) {
              const next = advanceDuelSeries(series, boutWinner);
              if (seriesOver(next)) {
                setSeries(null);
                setSparring(false);
                settle(seriesWinner(next), t(`系列賽 ${next.aWins}:${next.dWins}`, `series ${next.aWins}:${next.dWins}`));
              } else {
                setSeries(next); // key change re-mounts a fresh, more-winded bout
              }
            } else {
              setSparring(false);
              settle(boutWinner);
            }
          }}
        />
      </>
    );
  }

  // 宿敵 — a grudge match against a rival who rode out to settle the score.
  if (rivalDuel && rivalry) {
    return (
      <Duel3DStage
        attacker={rivalry.champ}
        defender={rivalry.rival}
        lethal={false}
        difficulty="peerless"
        onComplete={(outcome) => {
          setRivalDuel(false);
          const won = outcome.winner === 'attacker';
          if (won) {
            recordDeed(rivalry.champ.id, { duelsWon: 1 });
            applyScenarioEffects([{ kind: 'gold', amount: 300, textZh: '', textEn: '' }]);
            setResult({
              text: t(`${pickName(rivalry.champ.name, lang)} 力克宿敵 ${pickName(rivalry.rival.name, lang)},了結舊怨!`, `${pickName(rivalry.champ.name, lang)} bests the rival ${pickName(rivalry.rival.name, lang)} and settles the score!`),
              notes: [t('揚名立威,賞金 300 入庫。', 'Fame won — 300 gold collected.')],
            });
          } else {
            setResult({
              text: outcome.winner === 'draw'
                ? t(`與宿敵 ${pickName(rivalry.rival.name, lang)} 戰成平手,舊怨難消。`, `A draw with the rival ${pickName(rivalry.rival.name, lang)} — the grudge endures.`)
                : t(`不敵宿敵 ${pickName(rivalry.rival.name, lang)},引以為恨。`, `Bested by the rival ${pickName(rivalry.rival.name, lang)} — a bitter day.`),
              notes: [],
            });
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
          // 押注結算 — settle the side-wager: a win pays the profit on top of the
          // bounty; a loss forfeits the stake; a draw is a push (stake returned).
          const mult = wagerMultiplier(challenge.champ, challenge.challenger);
          const bet = Math.min(stake, playerGold);
          setStake(0);
          if (won) {
            recordDeed(challenge.champ.id, { duelsWon: 1 });
            const profit = bet > 0 ? wagerProfit(bet, mult) : 0;
            applyScenarioEffects([{ kind: 'gold', amount: challenge.bounty + profit, textZh: '', textEn: '' }]);
            const notes = [t(`賞金 ${challenge.bounty} 入庫。`, `Bounty of ${challenge.bounty} gold collected.`)];
            if (bet > 0) notes.push(t(`押注 ${bet} ×${mult} — 淨賺 ${profit} 金!`, `Wager ${bet} ×${mult} — won ${profit} gold!`));
            setResult({
              text: t(`${pickName(challenge.champ.name, lang)} 力克踢館者 ${pickName(challenge.challenger.name, lang)}!`, `${pickName(challenge.champ.name, lang)} beats the challenger ${pickName(challenge.challenger.name, lang)}!`),
              notes,
            });
          } else {
            const draw = outcome.winner === 'draw';
            if (!draw && bet > 0) applyScenarioEffects([{ kind: 'gold', amount: -bet, textZh: '', textEn: '' }]);
            const notes: string[] = [];
            if (bet > 0) notes.push(draw ? t(`押注 ${bet} 退回。`, `Wager of ${bet} returned.`) : t(`押注 ${bet} 金付諸流水。`, `Lost the ${bet} gold stake.`));
            setResult({
              text: draw
                ? t('與踢館者戰成平手。', 'A draw against the challenger.')
                : t(`不敵踢館者 ${pickName(challenge.challenger.name, lang)}。`, `Bested by the challenger ${pickName(challenge.challenger.name, lang)}.`),
              notes,
            });
          }
        }}
      />
    );
  }

  // 劇情單挑 — your champion faces the scenario's famous warrior; the outcome
  // carries real spoils (gold / renown, more for a 斬殺), applied to live state.
  if (story) {
    const champ = officers[story.championId];
    const opponent = officers[story.scenario.opponentId];
    if (champ && opponent) {
      return (
        <Duel3DStage
          attacker={champ}
          defender={opponent}
          lethal
          difficulty="peerless"
          onComplete={(outcome) => {
            const sc = story.scenario;
            setStory(null);
            const won = outcome.winner === 'attacker';
            const slain = won && outcome.killedId === 'defender';
            const effects = duelScenarioOutcome(sc, { won, slain });
            applyScenarioEffects(effects);
            if (won) { recordDeed(story.championId, { duelsWon: 1 }); markDuelScenarioCleared(sc.id); }
            const head = duelScenarioResultLine(sc, { won, slain });
            setResult({
              text: lang === 'en' ? head.en : head.zh,
              notes: effects.map((e) => (lang === 'en' ? e.textEn : e.textZh)).filter(Boolean),
            });
          }}
        />
      );
    }
  }

  // 車輪團戰 — king-of-the-hill: the winner holds the field (wounds carry), the
  // loser sends in a fresh fighter. The side to run out of warriors loses.
  if (team) {
    const aCur = officers[team.aIds[team.aIdx]];
    const bCur = officers[team.bIds[team.bIdx]];
    if (aCur && bCur) {
      const FAT = (n: number) => Math.min(55, n + 16);
      return (
        <>
          <div style={{ position: 'fixed', top: 10, left: '50%', transform: 'translateX(-50%)', zIndex: 134, pointerEvents: 'none', background: 'rgba(20,28,38,0.92)', border: '1px solid #e6c473', borderRadius: 6, padding: '0.3rem 0.8rem', color: '#f2dd9a', fontFamily: 'var(--tkm-font-body)', fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
            {t('車輪戰', 'Gauntlet')} · {t('我方', 'Ours')} {team.aIds.length - team.aDown}/{team.aIds.length} · {t('敵方', 'Foe')} {team.bIds.length - team.bDown}/{team.bIds.length} — {pickName(aCur.name, lang)} vs {pickName(bCur.name, lang)}
          </div>
          <Duel3DStage
            key={`team-${team.aIdx}-${team.bIdx}`}
            attacker={aCur}
            defender={bCur}
            lethal={false}
            difficulty={difficulty}
            meFatigue={team.aFat}
            foeFatigue={team.bFat}
            onComplete={(outcome) => {
              const win = outcome.winner; // 'attacker'=ours, 'defender'=foe, 'draw'
              grantSparXp(win === 'defender' ? bCur.id : aCur.id, win === 'defender' ? aCur.id : bCur.id, win === 'draw');
              let { aIdx, bIdx, aFat, bFat, aDown, bDown } = team;
              if (win === 'attacker') { bIdx += 1; bDown += 1; bFat = 0; aFat = FAT(aFat); }
              else if (win === 'defender') { aIdx += 1; aDown += 1; aFat = 0; bFat = FAT(bFat); }
              else { aIdx += 1; bIdx += 1; aDown += 1; bDown += 1; aFat = 0; bFat = 0; }
              const aOut = aIdx >= team.aIds.length;
              const bOut = bIdx >= team.bIds.length;
              if (aOut || bOut) {
                setTeam(null);
                const ourWin = bOut && !aOut;
                setResult({
                  text: ourWin
                    ? t(`我方車輪戰得勝 — 力克敵陣 ${bDown} 將!`, `Your squad wins the gauntlet — ${bDown} of the foe felled!`)
                    : aOut && bOut
                      ? t('兩敗俱傷,鳴金收兵。', 'Both squads spent — the gongs sound.')
                      : t(`力戰不支,敵方車輪戰得勝。`, 'Your squad is worn down — the foe holds the field.'),
                  notes: [],
                });
              } else {
                setTeam({ ...team, aIdx, bIdx, aFat, bFat, aDown, bDown });
              }
            }}
          />
        </>
      );
    }
    setTeam(null);
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
            {t('武', 'WAR')} {o.stats.war} · {t('等', 'Lv')} {officerLevel(o)}
          </div>
        </>
      ) : (
        <div style={{ color: '#5f6c76', fontSize: '0.85rem', padding: '1.4rem 0' }}>{t('（從下方選將）', '(pick below)')}</div>
      )}
    </div>
  );

  return (
    <Modal onClose={onClose} title={t('演武場', 'Sparring Ground')} icon="⚔" width="min(560px, 100%)" scrollBody>
      {/* 切磋 (sparring) vs 劇情 (scripted famous duels with stakes). */}
      <div style={{ display: 'flex', gap: 6, marginBottom: '0.8rem' }}>
        {(['spar', 'story', 'team'] as const).map((m) => (
          <button
            key={m}
            onClick={() => { setMode(m); setResult(null); }}
            style={{
              flex: 1, padding: '0.4rem', borderRadius: 4, cursor: 'pointer', fontFamily: 'var(--tkm-font-body)', fontSize: '0.84rem',
              background: mode === m ? 'rgba(230,196,115,0.18)' : '#10161e',
              border: `1px solid ${mode === m ? '#e6c473' : '#26323e'}`, color: mode === m ? '#f2dd9a' : '#8a96a0',
            }}
          >{m === 'spar' ? t('切磋', 'Spar') : m === 'story' ? t('劇情', 'Scenarios') : t('車輪戰', 'Gauntlet')}</button>
        ))}
      </div>

      <div style={{ fontSize: '0.8rem', color: '#aab6c0', marginBottom: '0.8rem', lineHeight: 1.6 }}>
        {mode === 'spar'
          ? t('選兩名麾下武將切磋(點到為止,不致命)。勝負雙方皆增經驗,或可升級增益屬性、習得新技。',
              'Pick two officers to spar (non-lethal). Both gain experience — the winner more — which can raise stats or teach skills.')
          : mode === 'story'
            ? t('挑一段史詩單挑,遣一員猛將出陣。力克強敵有真實獎賞 — 揚名、賞金,陣斬更佳。',
                'Pick a famous duel and send a warrior. A win carries real spoils — fame and gold, more for a kill.')
            : t('編一支隊伍(最多 5 人)打車輪戰。勝者留陣(帶傷續戰),敗者換人上 — 拼到一方無人。',
                'Form a squad (up to 5) for a gauntlet. The winner holds the field (wounds carry); the loser tags in a fresh fighter — until one side is spent.')}
      </div>

      {mode === 'team' && (<>
        <div style={{ display: 'flex', gap: 8, marginBottom: '0.8rem' }}>
          <div style={{ flex: 1, border: '1px dashed #6aae73', borderRadius: 6, padding: '0.5rem', background: 'rgba(106,174,115,0.06)' }}>
            <div style={{ fontSize: '0.68rem', color: '#7a8893', letterSpacing: '0.08rem', marginBottom: 4 }}>{t('我方隊伍', 'Your squad')} ({teamSel.length})</div>
            <div style={{ fontSize: '0.78rem', color: '#bfe6b8', lineHeight: 1.6, minHeight: '1.4rem' }}>
              {teamSel.length === 0 ? <span style={{ color: '#5f6c76' }}>{t('（下方點選）', '(pick below)')}</span> : teamSel.map((id) => pickName(officers[id].name, lang)).join('、')}
            </div>
          </div>
          <div style={{ flex: 1, border: '1px dashed #e0846a', borderRadius: 6, padding: '0.5rem', background: 'rgba(224,132,106,0.06)' }}>
            <div style={{ fontSize: '0.68rem', color: '#7a8893', letterSpacing: '0.08rem', marginBottom: 4 }}>{t('敵方隊伍', 'Foe squad')} ({teamB.length})</div>
            <div style={{ fontSize: '0.78rem', color: '#ffd0b8', lineHeight: 1.6, minHeight: '1.4rem' }}>
              {teamB.length === 0 ? <span style={{ color: '#5f6c76' }}>—</span> : teamB.map((o) => pickName(o.name, lang)).join('、')}
            </div>
          </div>
        </div>
        <button
          disabled={teamSel.length === 0 || teamB.length === 0}
          onClick={() => {
            setResult(null);
            const bIds = teamB.map((o) => o.id);
            // 演武冷卻 — fielding a squad spends one slot for every officer on it.
            recordTrainingUse('spar', [...teamSel, ...bIds]);
            setTeam({ aIds: teamSel, bIds, aIdx: 0, bIdx: 0, aFat: 0, bFat: 0, aDown: 0, bDown: 0 });
          }}
          style={{
            width: '100%', padding: '0.6rem', marginBottom: '0.8rem',
            background: teamSel.length > 0 && teamB.length > 0 ? 'linear-gradient(180deg,#7a2a20,#4a1810)' : '#1e2832',
            border: `1px solid ${teamSel.length > 0 && teamB.length > 0 ? '#e0846a' : '#2b3845'}`,
            color: teamSel.length > 0 && teamB.length > 0 ? '#ffe0d0' : '#5f6c76', cursor: teamSel.length > 0 && teamB.length > 0 ? 'pointer' : 'default',
            fontFamily: 'var(--tkm-font-body)', fontSize: '1rem', letterSpacing: '0.1rem',
          }}
        >⚔ {t('開始車輪戰', 'Begin the Gauntlet')}</button>
      </>)}

      {/* 宿敵 — a rival rides out to settle an old score. */}
      {mode === 'spar' && rivalry && (
        <div style={{ background: 'linear-gradient(180deg, rgba(80,30,90,0.32), rgba(30,12,40,0.32))', border: '1px solid #b070c8', borderRadius: 6, padding: '0.6rem 0.8rem', marginBottom: '0.8rem' }}>
          <div style={{ color: '#e8c8ff', fontSize: '0.84rem', marginBottom: 4 }}>
            ⚔ {t('宿敵', 'A Rival Rides Out')} — <b style={{ color: '#f0d8ff' }}>{pickName(rivalry.rival.name, lang)}</b>
            <span style={{ color: '#b8a0c8', fontSize: '0.74rem' }}> {t('挑戰', 'challenges')} {pickName(rivalry.champ.name, lang)}</span>
          </div>
          <div style={{ fontSize: '0.74rem', color: '#d0b8d8', fontStyle: 'italic', marginBottom: 6 }}>「{lang === 'en' ? rivalry.lineEn : rivalry.lineZh}」</div>
          <button
            onClick={() => { setResult(null); setRivalDuel(true); }}
            style={{ width: '100%', padding: '0.45rem', background: 'linear-gradient(180deg,#5a2a6e,#2e1840)', border: '1px solid #b070c8', color: '#f0d8ff', cursor: 'pointer', fontFamily: 'var(--tkm-font-body)', letterSpacing: '0.08rem', borderRadius: 4 }}
          >⚔ {t(`遣 ${pickName(rivalry.champ.name, lang)} 應戰(賞 300 金)`, `Send ${pickName(rivalry.champ.name, lang)} (300g)`)}</button>
        </div>
      )}

      {/* 踢館 — an outsider drawn by your champion's renown waits to test them. */}
      {mode === 'spar' && challenge && (
        <div style={{ background: 'linear-gradient(180deg, rgba(120,40,30,0.3), rgba(40,16,12,0.3))', border: '1px solid #e0846a', borderRadius: 6, padding: '0.6rem 0.8rem', marginBottom: '0.8rem' }}>
          <div style={{ color: '#ffd0b8', fontSize: '0.84rem', marginBottom: 4 }}>
            🏯 {t('踢館', 'A Challenger Arrives')} — <b style={{ color: '#ffe0d0' }}>{pickName(challenge.challenger.name, lang)}</b>
            <span style={{ color: '#caa86a', fontSize: '0.74rem' }}> ({t('武', 'WAR')} {challenge.challenger.stats.war})</span>
          </div>
          <div style={{ fontSize: '0.74rem', color: '#d8b0a0', fontStyle: 'italic', marginBottom: 6 }}>「{lang === 'en' ? challenge.lineEn : challenge.lineZh}」</div>
          {/* 押注 — back your champion with a side-wager; the odds reflect the gap. */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.72rem', color: '#caa86a', letterSpacing: '0.05rem' }}>
              💰 {t('押注', 'Wager')} <span style={{ color: '#ffe0b0' }}>×{wagerMultiplier(challenge.champ, challenge.challenger)}</span>
            </span>
            {[0, 100, 250, 500].map((amt) => {
              const affordable = amt <= playerGold;
              const on = stake === amt;
              return (
                <button
                  key={amt}
                  disabled={!affordable}
                  onClick={() => setStake(amt)}
                  style={{
                    padding: '0.2rem 0.5rem', fontFamily: 'inherit', fontSize: '0.74rem', borderRadius: 4,
                    cursor: affordable ? 'pointer' : 'default',
                    background: on ? 'rgba(230,196,115,0.22)' : '#1a1410', border: `1px solid ${on ? '#e6c473' : '#3a2c1c'}`,
                    color: !affordable ? '#5a4a36' : on ? '#ffe8a8' : '#c8a878',
                  }}
                >{amt === 0 ? t('不押', 'None') : amt}</button>
              );
            })}
            {stake > 0 && (
              <span style={{ fontSize: '0.7rem', color: '#9ed68a' }}>
                {t('勝可得', 'win →')} +{wagerProfit(Math.min(stake, playerGold), wagerMultiplier(challenge.champ, challenge.challenger))}
              </span>
            )}
          </div>
          <button
            onClick={() => { setResult(null); setDuelChallenge(true); }}
            style={{ width: '100%', padding: '0.45rem', background: 'linear-gradient(180deg,#7a2a20,#4a1810)', border: '1px solid #e0846a', color: '#ffe0d0', cursor: 'pointer', fontFamily: 'var(--tkm-font-body)', letterSpacing: '0.08rem', borderRadius: 4 }}
          >⚔ {t(`遣 ${pickName(challenge.champ.name, lang)} 應戰(賞 ${challenge.bounty} 金)`, `Send ${pickName(challenge.champ.name, lang)} (${challenge.bounty}g bounty)`)}</button>
        </div>
      )}

      {mode === 'spar' && (<>
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

      {/* 賽制 — single bout or a best-of series (車輪戰: fatigue carries over). */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: '0.8rem' }}>
        <span style={{ fontSize: '0.72rem', color: '#7a8893', letterSpacing: '0.06rem', marginRight: 2 }}>{t('賽制', 'Format')}</span>
        {([[1, t('單局', 'Single')], [3, t('三局兩勝', 'Best of 3')], [5, t('五局三勝', 'Best of 5')]] as const).map(([n, label]) => {
          const on = bestOf === n;
          return (
            <button
              key={n}
              onClick={() => setBestOf(n as 1 | 3 | 5)}
              style={{
                flex: 1, padding: '0.3rem', fontFamily: 'inherit', fontSize: '0.8rem', cursor: 'pointer', borderRadius: 4,
                background: on ? 'rgba(230,196,115,0.16)' : '#10161e', border: `1px solid ${on ? '#e6c473' : '#26323e'}`,
                color: on ? '#f2dd9a' : '#8a96a0',
              }}
            >{label}</button>
          );
        })}
      </div>

      {/* 雙人對戰 — same-screen hot-seat: a second player picks the foe's moves. */}
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '0.8rem', cursor: 'pointer', fontFamily: 'var(--tkm-font-body)', fontSize: '0.82rem', color: hotSeat ? '#f2dd9a' : '#8a96a0' }}>
        <input type="checkbox" checked={hotSeat} onChange={(e) => setHotSeat(e.target.checked)} />
        👥 {t('雙人對戰(同屏熱座 — 玩家②操控對手)', 'Two-player (hot-seat — Player 2 controls the foe)')}
      </label>

      <button
        disabled={!sparReady}
        onClick={() => { setResult(null); setSeries(bestOf > 1 ? initDuelSeries(bestOf) : null); setSparring(true); }}
        style={{
          width: '100%', padding: '0.6rem', marginBottom: ready && !sparReady ? '0.4rem' : '0.8rem',
          background: sparReady ? 'linear-gradient(180deg,#7a2a20,#4a1810)' : '#1e2832',
          border: `1px solid ${sparReady ? '#e0846a' : '#2b3845'}`,
          color: sparReady ? '#ffe0d0' : '#5f6c76', cursor: sparReady ? 'pointer' : 'default',
          fontFamily: 'var(--tkm-font-body)', fontSize: '1rem', letterSpacing: '0.1rem',
        }}
      >⚔ {bestOf > 1 ? t('開始系列賽', 'Begin the Series') : t('開始切磋', 'Begin the Spar')}</button>
      {ready && !sparReady && (
        <div style={{ fontSize: '0.74rem', color: '#d8956a', marginBottom: '0.8rem', lineHeight: 1.5 }}>
          ⏳ {t(
            `${sparLeftFor(aId) <= 0 ? pickName(a!.name, lang) : pickName(b!.name, lang)} 本季已疲憊，需休整至下季再演武。`,
            `${sparLeftFor(aId) <= 0 ? pickName(a!.name, lang) : pickName(b!.name, lang)} is spent for the season — rest until next season to spar again.`,
          )}
        </div>
      )}
      </>)}

      {/* 劇情單挑 — scenario list + send-a-champion. */}
      {mode === 'story' && (<>
        {/* 單挑戰役 — a story chain; each step unlocks the next once cleared. */}
        {DUEL_CAMPAIGNS.map((camp) => {
          const steps = campaignSteps(camp, new Set(clearedScenarios));
          const done = steps.filter((s) => s.cleared).length;
          return (
            <div key={camp.id} style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid #3a4754', borderRadius: 6, padding: '0.5rem 0.7rem', marginBottom: '0.8rem' }}>
              <div style={{ fontSize: '0.78rem', color: '#e6c473', marginBottom: 6 }}>🏯 {lang === 'en' ? camp.titleEn : camp.titleZh} <span style={{ color: '#7a8893', fontSize: '0.7rem' }}>({done}/{steps.length})</span></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap' }}>
                {steps.map((st, i) => {
                  const sc = st.scenario;
                  const icon = st.cleared ? '✓' : st.unlocked ? '▶' : '🔒';
                  const col = st.cleared ? '#6aae73' : st.unlocked ? '#e6c473' : '#5f6c76';
                  return (
                    <span key={st.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                      <button
                        disabled={!st.unlocked || !sc || !officers[sc.opponentId]}
                        onClick={() => { if (sc && officers[sc.opponentId]) { setScenario(sc); setResult(null); } }}
                        title={sc ? (lang === 'en' ? sc.titleEn : sc.titleZh) : st.id}
                        style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '0.16rem 0.4rem', borderRadius: 4, cursor: st.unlocked && sc && officers[sc.opponentId] ? 'pointer' : 'default', background: scenario?.id === st.id ? 'rgba(230,196,115,0.2)' : '#10161e', border: `1px solid ${col}`, color: col, fontFamily: 'inherit', fontSize: '0.68rem', whiteSpace: 'nowrap' }}
                      >{icon} {sc ? (lang === 'en' ? sc.titleEn : sc.titleZh) : st.id}</button>
                      {i < steps.length - 1 && <span style={{ color: '#5f6c76', fontSize: '0.7rem' }}>›</span>}
                    </span>
                  );
                })}
              </div>
            </div>
          );
        })}

        <div style={{ display: 'grid', gap: 6, marginBottom: '0.8rem' }}>
          {scenarios.map((sc) => {
            const sel = scenario?.id === sc.id;
            const opp = officers[sc.opponentId];
            return (
              <button
                key={sc.id}
                onClick={() => { setScenario(sel ? null : sc); setResult(null); }}
                style={{
                  textAlign: 'left', padding: '0.5rem 0.6rem', borderRadius: 5, cursor: 'pointer', fontFamily: 'var(--tkm-font-body)',
                  background: sel ? 'rgba(230,196,115,0.16)' : '#10161e', border: `1px solid ${sel ? '#e6c473' : '#26323e'}`, color: '#e6edf3',
                }}
              >
                <div style={{ color: '#f2dd9a', fontSize: '0.9rem' }}>{lang === 'en' ? sc.titleEn : sc.titleZh} <span style={{ color: '#8a96a0', fontSize: '0.72rem' }}>— {t('對手', 'vs')} {opp ? pickName(opp.name, lang) : sc.opponentId} ({t('武', 'WAR')} {opp?.stats.war ?? '?'})</span></div>
                <div style={{ fontSize: '0.72rem', color: '#9aa6b0', lineHeight: 1.5, marginTop: 2 }}>{lang === 'en' ? sc.introEn : sc.introZh}</div>
              </button>
            );
          })}
          {scenarios.length === 0 && (
            <div style={{ color: '#7a8893', fontStyle: 'italic', padding: '0.8rem 0' }}>{t('目前無可進行的劇情單挑(對手未現身)。', 'No scenarios available (the famous foes are not on the field).')}</div>
          )}
        </div>
        <button
          disabled={!(scenario && a)}
          onClick={() => { if (scenario && aId) { setResult(null); setStory({ scenario, championId: aId }); } }}
          style={{
            width: '100%', padding: '0.6rem', marginBottom: '0.8rem',
            background: scenario && a ? 'linear-gradient(180deg,#7a2a20,#4a1810)' : '#1e2832',
            border: `1px solid ${scenario && a ? '#e0846a' : '#2b3845'}`,
            color: scenario && a ? '#ffe0d0' : '#5f6c76', cursor: scenario && a ? 'pointer' : 'default',
            fontFamily: 'var(--tkm-font-body)', fontSize: '1rem', letterSpacing: '0.1rem',
          }}
        >⚔ {a ? t(`遣 ${pickName(a.name, lang)} 出陣`, `Send ${pickName(a.name, lang)}`) : t('選一員猛將', 'Pick a warrior')}</button>
      </>)}

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
        {mode === 'story' ? t('遣誰出陣', 'Choose your warrior') : t('麾下武將', 'Your Officers')} ({roster.length})
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 6 }}>
        {roster.map((o) => {
          const sel = mode === 'team' ? teamSel.includes(o.id) : o.id === aId || o.id === bId;
          // 演武冷卻 — a winded officer can't be fielded in 切磋 or 車輪戰
          // (deselect still works).
          const left = trainsLeft(sparUsage ?? {}, o.id, seasonKey);
          const winded = (mode === 'spar' || mode === 'team') && left <= 0 && !sel;
          return (
            <button
              key={o.id}
              disabled={winded}
              onClick={() => pick(o.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, textAlign: 'left',
                background: sel ? 'rgba(230,196,115,0.14)' : '#10161e',
                border: `1px solid ${sel ? '#e6c473' : '#26323e'}`,
                borderRadius: 4, padding: '0.4rem 0.5rem', cursor: winded ? 'default' : 'pointer',
                color: '#e6edf3', opacity: winded ? 0.5 : 1, fontFamily: 'var(--tkm-font-body)',
              }}
            >
              <OfficerPortrait officer={o} size={32} forceColor="#e6c473" year={year} />
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ color: '#f2dd9a', fontSize: '0.85rem' }}>{pickName(o.name, lang)}</span>
                <span style={{ display: 'block', fontSize: '0.66rem', color: '#8a96a0' }}>
                  <OfficerStats officer={o} keys={['war', 'leadership']} /> · {t('等', 'Lv')}{officerLevel(o)}
                </span>
              </span>
              {(mode === 'spar' || mode === 'team') && (
                <span style={{ fontSize: '0.6rem', color: winded ? '#d8956a' : '#7a8893', whiteSpace: 'nowrap' }}>
                  {winded ? t('疲', 'Rest') : `演 ${left}/${TRAIN_PER_SEASON}`}
                </span>
              )}
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
