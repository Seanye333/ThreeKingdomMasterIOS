import { useMemo, useState } from 'react';
import { useGameStore } from '../../game/state/store';
import type { BoutRecord } from '../../game/systems/duelHall';
import { ladderBoard, ratingTier } from '../../game/systems/warRanking';
import { NEMESIS_THRESHOLD, type RivalryRecord } from '../../game/systems/rivalries';
import { resolveDuel, canDuel, staticProwess, weaponClassFor } from '../../game/systems/duel';
import { resolveTeamDuel, type TeamDuelResult, type TeamMember, type TeamStation } from '../../game/systems/teamDuel';
import { TeamDuel3DStage } from './duel/TeamDuel3DStage';
import { InteractiveTeamDuel3D } from './duel/InteractiveTeamDuel3D';
import { wagerMultiplier, wagerProfit } from '../../game/systems/wager';
import { Modal } from './Modal';
import { OfficerPortrait } from './OfficerPortrait';
import { BoutReplay3D } from './duel/BoutReplay3D';
import { useT, useLanguage, pickName } from '../i18n';
import { EmptyState } from './EmptyState';

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
  const debateRivalries = useGameStore((s) => s.debateRivalries);
  const applyScenarioEffects = useGameStore((s) => s.applyScenarioEffects);
  const playerForceId = useGameStore((s) => s.playerForceId);
  const arenaChampion = useGameStore((s) => s.arenaChampion);
  const challengeArenaFn = useGameStore((s) => s.challengeArena);
  const holdArenaFn = useGameStore((s) => s.holdArena);
  const playerGold = useGameStore((s) => {
    const f = s.forces[s.playerForceId ?? ''];
    return f ? (s.cities[f.capitalCityId]?.gold ?? 0) : 0;
  });
  const [tab, setTab] = useState<'ranks' | 'ladder' | 'arena' | 'melee' | 'feuds' | 'gallery' | 'bet'>('ranks');
  // 打擂 — challenge / hold the standing arena champion.
  const [arenaPick, setArenaPick] = useState('');
  const [arenaMsg, setArenaMsg] = useState<{ text: string; win: boolean } | null>(null);
  // 團戰演武 — a practice N-vs-M champion melee (no consequences).
  const [meleePick, setMeleePick] = useState('');
  const [meleeResult, setMeleeResult] = useState<{ winner: 'a' | 'b' | 'draw'; log: string[] } | null>(null);
  // 團戰同場 — the staged 3D playback of the resolved melee (all fighters in-ring).
  const [meleeStage, setMeleeStage] = useState<TeamDuelResult | null>(null);
  // 親督 (§6.11 互動) — command the practice melee round by round yourself.
  const [liveCommand, setLiveCommand] = useState(true);
  const [meleeLive, setMeleeLive] = useState<{ mine: TeamMember[]; foes: TeamMember[] } | null>(null);
  // 站位 — player-set van/rear per teammate (unset = default: bow rear, else van).
  const [stations, setStations] = useState<Record<string, TeamStation>>({});
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

  const myFighters = useMemo(() => fighters.filter((o) => o.forceId === playerForceId), [fighters, playerForceId]);
  const foeFighters = useMemo(() => fighters.filter((o) => o.forceId !== playerForceId), [fighters, playerForceId]);
  const championOfficer = arenaChampion ? officers[arenaChampion.officerId] : null;
  const iHoldArena = !!championOfficer && championOfficer.forceId === playerForceId;

  const runArenaChallenge = () => {
    if (!arenaPick) return;
    const r = challengeArenaFn(arenaPick);
    if (!r.ok) { setArenaMsg({ text: t('無法挑戰(選將/狀態)', 'Cannot challenge (pick/status)'), win: false }); return; }
    const cn = lang === 'en' ? r.championEn : r.championZh;
    setArenaMsg(r.won
      ? { text: t(`力克 ${cn} — 榮登擂主!心得 +${r.insight}・${r.gold} 金`, `Bested ${cn} — you take the arena! +${r.insight} insight, +${r.gold} gold`), win: true }
      : { text: t(`不敵 ${cn},擂主之位未動。`, `${cn} holds the arena — you fall short.`), win: false });
  };
  const runHold = () => {
    const r = holdArenaFn();
    if (!r.ok) { setArenaMsg({ text: t('無法坐鎮擂台', 'Cannot hold the arena'), win: false }); return; }
    const cn = lang === 'en' ? r.challengerEn : r.challengerZh;
    setArenaMsg(r.held
      ? { text: t(`擊退挑戰者 ${cn} — 續守擂台!心得 +${r.insight}・${r.gold} 金`, `Turned away ${cn} — you hold! +${r.insight} insight, +${r.gold} gold`), win: true }
      : { text: t(`敗於 ${cn} 之手 — 痛失擂主!`, `${cn} beats you — the arena seat is lost!`), win: false });
  };
  const stationOf = (o: { id: string }): TeamStation =>
    stations[o.id] ?? (weaponClassFor(officers[o.id]) === 'bow' ? 'rear' : 'van');
  const runMelee = () => {
    const cap = officers[meleePick];
    if (!cap) return;
    const mine = [cap, ...myFighters.filter((o) => o.id !== cap.id).slice(0, 2)];
    const foes = foeFighters.slice(0, 3);
    if (!foes.length) { setMeleeResult({ winner: 'a', log: [t('無敵可戰。', 'No foes to face.')] }); return; }
    // 站位 — my side fields the player's van/rear picks; the foe fields defaults.
    const mySide = mine.map((o) => ({ officer: o, station: stationOf(o) }));
    const foeSide = foes.map((o) => ({ officer: o }));
    if (liveCommand) {
      // 親督 — the player commands it round by round in the 3D ring.
      setMeleeLive({ mine: mySide, foes: foeSide });
      return;
    }
    const res = resolveTeamDuel(mySide, foeSide);
    setMeleeResult({ winner: res.winner, log: res.log.map((l) => (lang === 'en' ? l.en : l.zh)) });
    useGameStore.getState().recordMeleeBout(res); // 團戰名局廊
    // 團戰同場 (§6.11) — stage the whole melee in the 3D ring, everyone on stage.
    setMeleeStage(res);
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
  // 文敵簿 (§6.15) — the same ledger for wars of words, kept apart from blades.
  const wordFeuds = useMemo(
    () => Object.values(debateRivalries ?? {})
      .filter((r) => officers[r.aId] && officers[r.bId])
      .sort((a, b) => b.bouts - a.bouts)
      .slice(0, 20),
    [debateRivalries, officers],
  );

  if (replay) {
    return <BoutReplay3D rec={replay} onClose={() => setReplay(null)} />;
  }
  // 團戰同場 — while the staged melee plays, show only the 3D ring.
  if (meleeStage) {
    return <TeamDuel3DStage result={meleeStage} onDone={() => setMeleeStage(null)} />;
  }
  // 親督團戰 — the player commands the practice melee live.
  if (meleeLive) {
    return (
      <InteractiveTeamDuel3D
        sideA={meleeLive.mine}
        sideB={meleeLive.foes}
        onComplete={(res) => {
          setMeleeLive(null);
          setMeleeResult({ winner: res.winner, log: res.log.map((l) => (lang === 'en' ? l.en : l.zh)) });
          useGameStore.getState().recordMeleeBout(res); // 團戰名局廊
        }}
      />
    );
  }

  const medal = (i: number) => (i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`);

  const rankList = (rows: Array<{ id: string; n: number }>, unit: string, color: string) => (
    rows.length === 0
      ? <EmptyState compact icon="🏆" title={t('尚無紀錄。', 'No records yet.')} />
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
        {(['ranks', 'ladder', 'arena', 'melee', 'feuds', 'gallery', 'bet'] as const).map((m) => (
          <button
            key={m}
            onClick={() => setTab(m)}
            style={{
              flex: 1, padding: '0.4rem 0.2rem', borderRadius: 'var(--tkm-radius-sm)', cursor: 'pointer', fontFamily: 'var(--tkm-font-body)', fontSize: '0.74rem',
              background: tab === m ? 'rgba(230,196,115,0.18)' : '#10161e',
              border: `1px solid ${tab === m ? '#e6c473' : '#26323e'}`, color: tab === m ? '#f2dd9a' : '#8a96a0',
            }}
          >{m === 'ranks' ? t('戰績', 'Wins') : m === 'ladder' ? t('武評', 'Ladder') : m === 'arena' ? t('擂台', 'Arena') : m === 'melee' ? t('團戰', 'Melee') : m === 'feuds' ? `${t('恩怨', 'Feuds')}${feuds.length > 0 ? ` (${feuds.length})` : ''}` : m === 'bet' ? t('賭坊', 'Wagers') : `${t('名局', 'Replays')}${duelHall.length > 0 ? ` (${duelHall.length})` : ''}`}</button>
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

      {tab === 'arena' && (
        <>
          <div style={{ fontSize: '0.72rem', color: '#aab6c0', lineHeight: 1.5, margin: '0 0 0.6rem 2px' }}>
            {t('打擂 — 天下擂台,唯強者居之。力克擂主即取而代之(點到為止,不取生死);坐鎮擂台可拒退挑戰者,得威名・心得・金,守得越久賞越厚。', 'The Arena — held by the mightiest. Best the champion (a contest, not to the death) to take the seat; hold it against challengers for renown, insight and gold — the longer your reign, the richer the purse.')}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(230,196,115,0.08)', border: '1px solid #caa86a', borderRadius: 'var(--tkm-radius-sm)', padding: '0.5rem 0.6rem', marginBottom: '0.7rem' }}>
            <span style={{ fontSize: '1.4rem' }}>🏛</span>
            {championOfficer ? (
              <>
                <OfficerPortrait officer={championOfficer} size={34} year={useGameStore.getState().date.year} />
                <div style={{ flex: 1 }}>
                  <div style={{ color: '#f2dd9a', fontSize: '0.9rem' }}>{t('擂主', 'Champion')} · {nm(championOfficer.id)}{iHoldArena ? t('(我方)', ' (yours)') : ''}</div>
                  <div style={{ color: '#9aa7b3', fontSize: '0.72rem' }}>{t(`守擂 ${arenaChampion?.defenses ?? 0} 場 · 自 ${arenaChampion?.sinceYear ?? ''} 年`, `${arenaChampion?.defenses ?? 0} defenses · since ${arenaChampion?.sinceYear ?? ''}`)}</div>
                </div>
              </>
            ) : (
              <div style={{ flex: 1, color: '#c9b87a', fontSize: '0.85rem' }}>{t('擂主虛位 — 天下第一待爭!', 'The seat stands empty — the title awaits its first holder!')}</div>
            )}
          </div>
          {iHoldArena ? (
            <button onClick={runHold} style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--tkm-radius-sm)', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.9rem', background: 'linear-gradient(180deg,#4a3a1a,#2a2010)', border: '1px solid #e6c473', color: '#f0d890' }}>
              🛡 {t('坐鎮擂台一季 — 迎戰來犯', 'Hold the Arena — face this season\'s challenger')}
            </button>
          ) : (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <select value={arenaPick} onChange={(e) => setArenaPick(e.target.value)} style={{ flex: 1, padding: '0.4rem', background: '#10161e', border: '1px solid #26323e', color: '#e6edf3', borderRadius: 'var(--tkm-radius-sm)', fontFamily: 'inherit' }}>
                <option value="">{t('— 遣將登台 —', '— send a fighter —')}</option>
                {myFighters.map((o) => <option key={o.id} value={o.id}>{nm(o.id)} · 武 {o.stats.war}</option>)}
              </select>
              <button onClick={runArenaChallenge} disabled={!arenaPick} style={{ padding: '0.4rem 0.9rem', borderRadius: 'var(--tkm-radius-sm)', cursor: arenaPick ? 'pointer' : 'not-allowed', fontFamily: 'inherit', fontSize: '0.86rem', background: arenaPick ? 'linear-gradient(180deg,#5a2a20,#3a1810)' : '#10161e', border: '1px solid #e0846a', color: arenaPick ? '#ffe0d0' : '#6a7480', whiteSpace: 'nowrap' }}>⚔ {t('挑戰擂主', 'Challenge')}</button>
            </div>
          )}
          {arenaMsg && <div style={{ marginTop: '0.7rem', padding: '0.5rem', borderRadius: 'var(--tkm-radius-sm)', background: arenaMsg.win ? 'rgba(60,120,60,0.18)' : 'rgba(120,60,60,0.16)', border: `1px solid ${arenaMsg.win ? '#6aae73' : '#c86a6a'}`, color: arenaMsg.win ? '#cfe8c8' : '#e8b0b0', fontSize: '0.82rem' }}>{arenaMsg.text}</div>}
        </>
      )}

      {tab === 'melee' && (
        <>
          <div style={{ fontSize: '0.72rem', color: '#aab6c0', lineHeight: 1.5, margin: '0 0 0.6rem 2px' }}>
            {t('團戰演武 — 真・多將混戰(圍攻/合擊/膽氣)。擇一主將,自動成隊:你方 主將+二將 對 敵陣三傑。演武而已,不取生死。', 'Team Melee (practice) — a real N-vs-M brawl (ganging / joint strikes / nerve). Pick a captain; teams auto-form: your captain + 2 vs three foes. A drill — no one dies.')}
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: '0.6rem' }}>
            <select value={meleePick} onChange={(e) => { setMeleePick(e.target.value); setMeleeResult(null); }} style={{ flex: 1, padding: '0.4rem', background: '#10161e', border: '1px solid #26323e', color: '#e6edf3', borderRadius: 'var(--tkm-radius-sm)', fontFamily: 'inherit' }}>
              <option value="">{t('— 擇一主將 —', '— pick a captain —')}</option>
              {myFighters.map((o) => <option key={o.id} value={o.id}>{nm(o.id)} · 武 {o.stats.war}</option>)}
            </select>
            <button onClick={runMelee} disabled={!meleePick || foeFighters.length === 0} style={{ padding: '0.4rem 0.9rem', borderRadius: 'var(--tkm-radius-sm)', cursor: meleePick ? 'pointer' : 'not-allowed', fontFamily: 'inherit', fontSize: '0.86rem', background: meleePick ? 'linear-gradient(180deg,#3a2a5a,#201838)' : '#10161e', border: '1px solid #9a7ad0', color: meleePick ? '#cbb6ef' : '#6a7480', whiteSpace: 'nowrap' }}>⚔ {t('演武團戰', 'Melee')}</button>
          </div>
          {/* 親督 — command it round by round vs. hand it to the engine. */}
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: '0.6rem', fontSize: '0.76rem', color: liveCommand ? '#ffd8c8' : '#8a96a0', cursor: 'pointer' }}>
            <input type="checkbox" checked={liveCommand} onChange={(e) => setLiveCommand(e.target.checked)} />
            {t('親自督戰 — 每合親下集火/死守之令(不勾則自動結算+上演)', 'Command it live — issue focus/guard orders each round (unchecked = auto-resolve + replay)')}
          </label>
          {(() => {
            const cap = officers[meleePick];
            if (!cap) return null;
            const mine = [cap, ...myFighters.filter((o) => o.id !== cap.id).slice(0, 2)];
            const foes = foeFighters.slice(0, 3);
            // 站位 — my side's van/rear is a toggle chip: 前鋒 screens, 後衛 is
            // screened (a rear archer shoots full; a rear melee arm only pokes).
            const chip = (o: typeof mine[number]) => {
              const st = stationOf(o);
              return (
                <button
                  onClick={() => setStations((s) => ({ ...s, [o.id]: st === 'van' ? 'rear' : 'van' }))}
                  title={t('點擊切換 前鋒/後衛 — 前鋒掩護後衛;後衛弓手全力放箭、近戰只掠陣', 'Toggle van/rear — the van screens; a rear archer shoots full, rear melee only pokes')}
                  style={{ padding: '0 0.3rem', marginLeft: 4, borderRadius: 'var(--tkm-radius-xs)', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.68rem', background: st === 'van' ? 'rgba(200,120,60,0.2)' : 'rgba(90,140,220,0.18)', border: `1px solid ${st === 'van' ? '#d08a4a' : '#6a9ade'}`, color: st === 'van' ? '#f0c48a' : '#aac8f0' }}
                >{st === 'van' ? t('前鋒', 'Van') : t('後衛', 'Rear')}</button>
              );
            };
            const roster = (arr: typeof mine, color: string, toggle: boolean) => (
              <div style={{ flex: 1 }}>{arr.map((o) => (
                <div key={o.id} style={{ color, fontSize: '0.78rem' }}>
                  {nm(o.id)} <span style={{ color: '#7a8893' }}>武{o.stats.war}·勇{staticProwess(o)}</span>
                  {toggle ? chip(o) : <span style={{ marginLeft: 4, color: '#7a8893', fontSize: '0.68rem' }}>{weaponClassFor(o) === 'bow' ? t('後衛', 'rear') : t('前鋒', 'van')}</span>}
                </div>
              ))}</div>
            );
            return (
              <div style={{ display: 'flex', gap: 10, background: '#10161e', border: '1px solid #26323e', borderRadius: 'var(--tkm-radius-sm)', padding: '0.5rem' }}>
                {roster(mine, '#7fc7ff', true)}
                <span style={{ alignSelf: 'center', color: '#e08a4a' }}>⚔</span>
                {roster(foes, '#ff9a7a', false)}
              </div>
            );
          })()}
          {meleeResult && (
            <div style={{ marginTop: '0.7rem', padding: '0.5rem', borderRadius: 'var(--tkm-radius-sm)', background: 'rgba(20,28,38,0.9)', border: '1px solid #3a4a5a' }}>
              <div style={{ color: meleeResult.winner === 'a' ? '#9ed68a' : meleeResult.winner === 'b' ? '#e8b0b0' : '#e6c473', fontSize: '0.9rem', marginBottom: '0.3rem' }}>
                {meleeResult.winner === 'a' ? t('我方大勝!', 'Your side prevails!') : meleeResult.winner === 'b' ? t('我方落敗。', 'Your side is beaten.') : t('鏖戰平手。', 'A hard-fought draw.')}
              </div>
              {meleeResult.log.map((l, i) => <div key={i} style={{ color: '#aab6c0', fontSize: '0.74rem', lineHeight: 1.5 }}>{l}</div>)}
            </div>
          )}
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
            <EmptyState
              icon="⚔️"
              title={t('尚無恩怨。', 'No feuds yet.')}
              hint={t('同一對武將反覆單挑,便會在此結下宿敵。', 'When the same two warriors keep dueling, a rivalry forms here.')}
            />
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

          {/* 文敵簿 (§6.15) — feuds fought with the tongue, kept apart from blades. */}
          {wordFeuds.length > 0 && (
            <>
              <div style={{ fontSize: '0.72rem', color: '#aab6c0', lineHeight: 1.5, margin: '0.9rem 0 0.5rem 2px' }}>
                {t('文敵簿 — 舌戰亦結怨:反覆交鋒三次以上即成「文敵」,月旦來辯必先由文敵下帖;一方罵倒則此怨已了。', 'The book of word-feuds — three wars of words forge a 文敵, who writs for your Moon-Rank laurel ahead of any stranger. A rout settles it.')}
              </div>
              <div style={{ display: 'grid', gap: 5 }}>
                {wordFeuds.map((r: RivalryRecord) => {
                  const a = officers[r.aId], b = officers[r.bId];
                  const sworn = r.bouts >= NEMESIS_THRESHOLD && !r.killerId;
                  const routed = !!r.killerId;
                  const border = routed ? '#6a6ab0' : sworn ? '#88b7e8' : '#26323e';
                  return (
                    <div key={`w|${r.aId}|${r.bId}`} style={{ display: 'flex', alignItems: 'center', gap: 8, background: sworn || routed ? 'rgba(60,80,140,0.14)' : '#10161e', border: `1px solid ${border}`, borderRadius: 'var(--tkm-radius-sm)', padding: '0.35rem 0.55rem' }}>
                      {a && <OfficerPortrait officer={a} size={28} forceColor="#88b7e8" year={useGameStore.getState().date.year} />}
                      <span style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ color: '#f2dd9a', fontSize: '0.86rem' }}>
                          {nm(r.aId)} <span style={{ color: '#a8d0ff', fontWeight: 700 }}>{r.aWins}</span>
                          <span style={{ color: '#7a8893' }}> – </span>
                          <span style={{ color: '#a8d0ff', fontWeight: 700 }}>{r.bWins}</span> {nm(r.bId)}
                          {r.draws > 0 && <span style={{ color: '#7a8893', fontSize: '0.72rem' }}> ・{t('各執', 'draw')}{r.draws}</span>}
                        </span>
                        <span style={{ display: 'block', fontSize: '0.66rem', color: '#8a96a0' }}>
                          {routed
                            ? <span style={{ color: '#a08ae0' }}>💬 {t('一辯了怨', 'Settled by a rout')} — {nm(r.killerId!)} {t('罵倒', 'routed')} {nm(r.victimId!)}</span>
                            : sworn
                              ? <span style={{ color: '#88b7e8' }}>📜 {t('文敵', 'Word-feud')} · {t('交鋒', 'argued')} {r.bouts} {t('場', '×')}</span>
                              : <>{t('舊辯', 'Old debates')} · {t('交鋒', 'argued')} {r.bouts} {t('場', '×')}</>}
                        </span>
                      </span>
                      {b && <OfficerPortrait officer={b} size={28} forceColor="#c178c7" year={useGameStore.getState().date.year} />}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </>
      )}

      {tab === 'gallery' && (
        <div style={{ display: 'grid', gap: 6 }}>
          {duelHall.length === 0 && (
            <EmptyState
              icon="🏛️"
              title={t('尚無名局。', 'No famous bouts yet.')}
              hint={t('一場斬將或罵死、一場酣戰,皆會載入此廊。', 'A kill, a 罵死 rout, or a long hard fight will be recorded here.')}
            />
          )}
          {duelHall.map((rec) => {
            const aWon = rec.kind === 'duel' ? rec.winner === 'attacker' : rec.winner === 'a';
            const dWon = rec.kind === 'duel' ? rec.winner === 'defender'
              : rec.kind === 'melee' ? rec.winner === 'b' : rec.winner === 'd';
            // 團戰名局 — a melee reads by its butcher's bill, not a single blow.
            const meleeSlain = rec.kind === 'melee' && rec.fighters.some((f) => f.fate === 'slain');
            const flourish = rec.kind === 'duel'
              ? (rec.killed ? t('斬', 'slew') : aWon || dWon ? t('力克', 'bested') : t('戰平', 'drew'))
              : rec.kind === 'melee'
                ? (meleeSlain ? t('團戰斬將', 'cut down') : aWon || dWon ? t('團戰破陣', 'broke') : t('鏖戰不分', 'held'))
                : (rec.routed ? t('罵倒', 'shouted down') : aWon || dWon ? t('辯勝', 'out-argued') : t('平手', 'drew'));
            const winnerName = aWon ? nm(rec.aId) : dWon ? nm(rec.dId) : null;
            const loserName = aWon ? nm(rec.dId) : dWon ? nm(rec.aId) : null;
            return (
              <button
                key={rec.id}
                onClick={() => setReplay(rec)}
                style={{ textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8, background: '#10161e', border: `1px solid ${rec.kind === 'duel' ? '#3a2c1c' : rec.kind === 'melee' ? '#3a2436' : '#243240'}`, borderRadius: 'var(--tkm-radius-sm)', padding: '0.45rem 0.6rem', cursor: 'pointer', color: '#e6edf3', fontFamily: 'var(--tkm-font-body)' }}
              >
                <span style={{ fontSize: '1.1rem' }}>{rec.kind === 'duel' ? '⚔' : rec.kind === 'melee' ? '🔥' : '💬'}</span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ color: '#f2dd9a', fontSize: '0.86rem' }}>
                    {winnerName
                      ? <>{winnerName} <span style={{ color: '#caa86a' }}>{flourish}</span> {loserName}</>
                      : <>{nm(rec.aId)} <span style={{ color: '#7a8893' }}>{flourish}</span> {nm(rec.dId)}</>}
                    {(rec.kind === 'duel' && rec.killed) || (rec.kind === 'debate' && rec.routed) || meleeSlain ? <span style={{ color: '#e06a5a' }}> ★</span> : null}
                  </span>
                  <span style={{ display: 'block', fontSize: '0.68rem', color: '#7a8893' }}>
                    {lang === 'en' ? SEASON_EN[rec.season] : SEASON_ZH[rec.season]}{lang === 'en' ? ` ${rec.year}` : ` ${rec.year}年`} · {rec.kind === 'melee' ? rec.rounds : rec.fx.length} {t('回合', 'rounds')}{rec.kind === 'melee' ? ` · ${rec.fighters.length} ${t('將', 'champions')}` : ''}
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
