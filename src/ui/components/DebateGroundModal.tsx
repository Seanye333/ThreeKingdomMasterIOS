import { useMemo, useState } from 'react';
import { useGameStore } from '../../game/state/store';
import { debateProwess, type DebateDifficulty } from '../../game/systems/wordWar';
import { moonBoard, moonScore, pickMoonLaurel, pickMoonChallenger, canOrate } from '../../game/systems/scholarRank';
import { resolveTeamDebate, type TeamDebateResult } from '../../game/systems/teamDebate';
import { debateShame, isEmotional } from '../../game/systems/afflictions';
import { DEBATE_SCENARIOS, scenarioOutcome, scenarioResultLine, type DebateScenario } from '../../game/systems/debateScenarios';
import { trainKey, trainsLeft, TRAIN_PER_SEASON } from '../../game/systems/sparLimit';
import { officerLevel } from '../../game/systems/officerGrade';
import { Modal } from './Modal';
import { OfficerPortrait } from './OfficerPortrait';
import { OfficerStats } from './OfficerStats';
import { Debate3DStage } from './debate/Debate3DStage';
import { useT, useLanguage, pickName } from '../i18n';
import { EmptyState } from './EmptyState';

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
  const grantOfficerXp = useGameStore((s) => s.grantOfficerXp);
  const recordTrainingUse = useGameStore((s) => s.recordTrainingUse);
  const debateUsage = useGameStore((s) => s.debateUsage);
  const date = useGameStore((s) => s.date);
  const afflictOfficer = useGameStore((s) => s.afflictOfficer);
  const recordDeed = useGameStore((s) => s.recordDeed);
  const applyScenarioEffects = useGameStore((s) => s.applyScenarioEffects);

  const [mode, setMode] = useState<'spar' | 'story' | 'gauntlet' | 'moon' | 'team'>('spar');
  // 朝堂合辯 (§6.17) — the auto-resolved 2v2 hall melee's last result, for the log.
  const [teamResult, setTeamResult] = useState<TeamDebateResult | null>(null);
  // 舌戰群儒 — a champion faces a line of opposing scholars, one after another.
  const [gauntlet, setGauntlet] = useState<{ championId: string; foeIds: string[]; idx: number; wins: number } | null>(null);
  // 月旦評 — an interactive bout for (or in defense of) the 魁首 laurel (§6.15).
  const moonLaurel = useGameStore((s) => s.moonLaurel);
  const seizeMoonLaurel = useGameStore((s) => s.seizeMoonLaurel);
  const defendMoonLaurel = useGameStore((s) => s.defendMoonLaurel);
  // 月旦來辯 (§6.15 對稱) — a rival scholar's standing writ for your laurel.
  const pendingMoonWrit = useGameStore((s) => s.pendingMoonWrit);
  const duckMoonWrit = useGameStore((s) => s.duckMoonWrit);
  const clearMoonWrit = useGameStore((s) => s.clearMoonWrit);
  const [moonBout, setMoonBout] = useState<{ meId: string; foeId: string; kind: 'seize' | 'defend' } | null>(null);
  // The reigning 魁首 (falls back to the keenest tongue when unseeded/fallen).
  const seatHolder = useMemo(() => {
    const seated = moonLaurel ? officers[moonLaurel.officerId] : null;
    if (seated && canOrate(seated)) return seated;
    return pickMoonLaurel(officers);
  }, [officers, moonLaurel]);
  const board = useMemo(() => moonBoard(officers, 10), [officers]);
  // 劇情舌戰 — scenarios whose opponent is present on the map and not yet ours.
  const scenarios = useMemo(
    () => DEBATE_SCENARIOS.filter((s) => {
      const opp = officers[s.opponentId];
      return opp && opp.status !== 'dead' && opp.status !== 'unsearched' && opp.forceId !== playerForceId;
    }),
    [officers, playerForceId],
  );
  const [scenario, setScenario] = useState<DebateScenario | null>(null);
  const [story, setStory] = useState<{ scenario: DebateScenario; strategistId: string } | null>(null);

  // 群儒 — the opposing scholars, sharpest tongue saved for last (up to 5).
  const gauntletFoes = useMemo(
    () => Object.values(officers)
      .filter((o) => o.forceId !== playerForceId && o.status !== 'dead' && o.status !== 'unsearched' && o.status !== 'imprisoned')
      .sort((x, y) => debateProwess(x) - debateProwess(y))
      .slice(0, 5),
    [officers, playerForceId],
  );

  // Anyone fit to speak may debate — sort the sharpest tongues to the front.
  const roster = useMemo(
    () => Object.values(officers)
      .filter((o) => o.forceId === playerForceId && o.status !== 'dead' && o.status !== 'unsearched' && o.status !== 'imprisoned')
      .sort((a, b) => debateProwess(b) - debateProwess(a)),
    [officers, playerForceId],
  );

  const [aId, setAId] = useState<string | null>(null);
  const [bId, setBId] = useState<string | null>(null);
  const [difficulty, setDifficulty] = useState<DebateDifficulty>('veteran');
  const [debating, setDebating] = useState(false);
  const [result, setResult] = useState<{ text: string; notes: string[] } | null>(null);

  const a = aId ? officers[aId] : null;
  const b = bId ? officers[bId] : null;
  const ready = !!(a && b && aId !== bId);
  // 論辯冷卻 — each officer gets a limited number of friendly debates per season.
  const seasonKey = trainKey(date);
  const debateLeftFor = (id: string | null) => (id ? trainsLeft(debateUsage ?? {}, id, seasonKey) : 0);
  const debateReady = ready && debateLeftFor(aId) > 0 && debateLeftFor(bId) > 0;
  // 群儒 — the champion spends one debate slot on entry (the whole run costs one).
  const gauntletReady = !!a && gauntletFoes.length > 0 && debateLeftFor(aId) > 0;

  const pick = (id: string) => {
    setResult(null);
    if (mode === 'story' || mode === 'gauntlet' || mode === 'moon') { setAId(aId === id ? null : id); return; } // pick one champion
    if (aId === id) { setAId(null); return; }
    if (bId === id) { setBId(null); return; }
    if (!aId) setAId(id);
    else if (!bId) setBId(id);
    else { setAId(id); setBId(null); }
  };

  // 舌戰群儒 — the champion debates each foe in turn; a win advances, a loss ends
  // the run. Composure resets per opponent (a fresh war of words each time).
  if (gauntlet) {
    const champ = officers[gauntlet.championId];
    const foe = officers[gauntlet.foeIds[gauntlet.idx]];
    if (champ && foe) {
      return (
        <Debate3DStage
          key={`g-${gauntlet.idx}`}
          me={champ}
          foe={foe}
          difficulty={difficulty}
          onComplete={(outcome) => {
            const won = outcome.winner === 'me';
            // 舌戰增知力 — each scholar bested sharpens the champion's mind.
            const xp = won ? grantOfficerXp(gauntlet.championId, 30, ['intelligence', 'charisma']) : null;
            if (won) recordDeed(gauntlet.championId, { debatesWon: 1, ...(outcome.routed ? { debateRouts: 1 } : {}) });
            const last = gauntlet.idx >= gauntlet.foeIds.length - 1;
            if (won && !last) {
              setGauntlet({ ...gauntlet, idx: gauntlet.idx + 1, wins: gauntlet.wins + 1 });
            } else {
              const wins = gauntlet.wins + (won ? 1 : 0);
              const cleared = won && last;
              setGauntlet(null);
              setResult({
                text: cleared
                  ? t(`${pickName(champ.name, lang)} 舌戰群儒 — 連折 ${wins} 人,全勝!`, `${pickName(champ.name, lang)} out-talks them all — ${wins} routed, a clean sweep!`)
                  : t(`${pickName(champ.name, lang)} 連折 ${wins} 人,終遇強手。`, `${pickName(champ.name, lang)} bested ${wins} before meeting their match.`),
                notes: xp?.notes ?? [],
              });
            }
          }}
        />
      );
    }
    setGauntlet(null);
  }

  // 月旦評 — the interactive bout for (or in defense of) the 魁首.
  if (moonBout) {
    const meO = officers[moonBout.meId];
    const foeO = officers[moonBout.foeId];
    if (meO && foeO) {
      return (
        <Debate3DStage
          me={meO}
          foe={foeO}
          difficulty="peerless"
          onComplete={(outcome) => {
            const won = outcome.winner === 'me';
            setMoonBout(null);
            if (moonBout.kind === 'seize') {
              const r = seizeMoonLaurel(moonBout.meId, won);
              if (won) grantOfficerXp(moonBout.meId, 30, ['intelligence', 'charisma']);
              setResult({
                text: won
                  ? t(`${pickName(meO.name, lang)} 清議奪魁 — 月旦評魁首易主!`, `${pickName(meO.name, lang)} takes the Moon-Rank laurel!`)
                  : t(`${pickName(foeO.name, lang)} 辯鋒不減,魁首之位穩如泰山。`, `${pickName(foeO.name, lang)} holds the laurel — the critique stands.`),
                notes: won && r.ok ? [t(`文辯心得 +${r.insight} · 金 +${r.gold}`, `Insight +${r.insight} · Gold +${r.gold}`)] : [],
              });
            } else {
              const r = defendMoonLaurel(won, moonBout.foeId);
              setResult({
                text: won
                  ? t(`${pickName(meO.name, lang)} 坐鎮清議,又折一位來辯之士。`, `${pickName(meO.name, lang)} turns the challenger aside — the laurel holds.`)
                  : t(`${pickName(foeO.name, lang)} 辯倒 ${pickName(meO.name, lang)} — 月旦評易主!`, `${pickName(foeO.name, lang)} out-argues ${pickName(meO.name, lang)} — the laurel passes!`),
                notes: won && r.ok ? [t(`文辯心得 +${r.insight} · 金 +${r.gold}`, `Insight +${r.insight} · Gold +${r.gold}`)] : [],
              });
            }
          }}
        />
      );
    }
    setMoonBout(null);
  }

  // While the debate plays, show only the 3D hall (it's fixed-position; rendering
  // it alongside the higher-z modal would bury it).
  if (debating && a && b) {
    return (
      <Debate3DStage
        me={a}
        foe={b}
        difficulty={difficulty}
        onComplete={(outcome) => {
          setDebating(false);
          const draw = outcome.winner === 'draw';
          const winnerId = draw || outcome.winner === 'me' ? aId! : bId!;
          const loserId = winnerId === aId ? bId! : aId!;
          const r = grantSparXp(winnerId, loserId, draw, ['intelligence', 'charisma']); // 舌戰增知力/魅力
          recordTrainingUse('debate', [aId!, bId!]); // 論辯冷卻 — both spend a slot
          // 羞憤 — an emotional officer who is out-argued stews on it for a few
          // seasons (−魅力/−智力), a real cost to losing a war of words.
          const loser = officers[loserId];
          let shamed = false;
          if (!draw) {
            recordDeed(winnerId, { debatesWon: 1, ...(outcome.routed ? { debateRouts: 1 } : {}) }); // 名聲榜 — a 舌戰 win (罵倒 counts extra)
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

  // 劇情舌戰 — your strategist faces the scenario's named opponent; the outcome
  // carries real stakes (recruit / gold / a 罵死), applied to live state.
  if (story) {
    const strategist = officers[story.strategistId];
    const opponent = officers[story.scenario.opponentId];
    if (strategist && opponent) {
      return (
        <Debate3DStage
          me={strategist}
          foe={opponent}
          difficulty={difficulty}
          topic={story.scenario.topic}
          onComplete={(outcome) => {
            const sc = story.scenario;
            setStory(null);
            const won = outcome.winner === 'me';
            const routed = won && outcome.routed;
            const effects = scenarioOutcome(sc, { won, routed });
            applyScenarioEffects(effects);
            if (won) {
              recordDeed(story.strategistId, { debatesWon: 1 });
              if (routed) recordDeed(story.strategistId, { debateRouts: 1 }); // 罵倒
            }
            const head = scenarioResultLine(sc, { won, routed });
            setResult({
              text: lang === 'en' ? head.en : head.zh,
              notes: effects.map((e) => (lang === 'en' ? e.textEn : e.textZh)),
            });
          }}
        />
      );
    }
  }

  const slot = (o: typeof a, label: string) => (
    <div style={{ flex: 1, textAlign: 'center', border: '1px dashed #3a4754', borderRadius: 'var(--tkm-radius)', padding: '0.6rem', background: o ? 'rgba(136,183,232,0.07)' : 'transparent' }}>
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
      {/* 切磋 / 劇情 / 群儒 / 月旦 / 合辯 */}
      <div style={{ display: 'flex', gap: 6, marginBottom: '0.8rem' }}>
        {(['spar', 'story', 'gauntlet', 'moon', 'team'] as const).map((m) => (
          <button
            key={m}
            onClick={() => { setMode(m); setResult(null); setTeamResult(null); }}
            style={{
              flex: 1, padding: '0.4rem', borderRadius: 'var(--tkm-radius-sm)', cursor: 'pointer', fontFamily: 'var(--tkm-font-body)', fontSize: '0.84rem',
              background: mode === m ? 'rgba(136,183,232,0.18)' : '#10161e',
              border: `1px solid ${mode === m ? '#88b7e8' : '#26323e'}`, color: mode === m ? '#d8ecff' : '#8a96a0',
            }}
          >{m === 'spar' ? t('切磋', 'Spar') : m === 'story' ? t('劇情', 'Scenarios') : m === 'gauntlet' ? t('群儒', 'Gauntlet') : m === 'moon' ? t('月旦', 'Moon-Rank') : t('合辯', 'Joint')}</button>
        ))}
      </div>

      {mode === 'team' && (() => {
        // 朝堂合辯 — your two voices vs the two keenest hostile tongues.
        const foePair = Object.values(officers)
          .filter((o) => o.forceId !== playerForceId && canOrate(o) && o.forceId)
          .sort((x, y) => debateProwess(y) - debateProwess(x))
          .slice(0, 2);
        const teamReady = !!(a && b && aId !== bId) && foePair.length >= 1 && debateLeftFor(aId) > 0 && debateLeftFor(bId) > 0;
        return (<>
          <div style={{ fontSize: '0.8rem', color: '#aab6c0', marginBottom: '0.8rem', lineHeight: 1.6 }}>
            {t('朝堂合辯 — 遣主辯、副辯二人同赴殿上,與敵方二士並席而辯。同派合辯相得益彰;寡不敵眾者一回只擋最利一問。',
              'A joint debate — send a lead and a second against the enemy\'s two keenest tongues. Like-schooled partners compound; an outnumbered voice parries only the sharpest thrust each round.')}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: '0.6rem' }}>
            <span style={{ color: '#f2dd9a', fontSize: '0.86rem' }}>{a ? pickName(a.name, lang) : t('主辯?', 'Lead?')}</span>
            <span style={{ color: '#8ec8a0', fontSize: '0.86rem' }}>{b ? `+ ${pickName(b.name, lang)}` : t('+ 副辯?', '+ Second?')}</span>
            <span style={{ color: '#7a8893' }}>vs</span>
            {foePair.map((f) => (
              <span key={f.id} style={{ fontSize: '0.72rem', color: '#9aa6b0', background: '#10161e', border: '1px solid #26323e', borderRadius: 'var(--tkm-radius-sm)', padding: '0.1rem 0.4rem' }}>
                {pickName(f.name, lang)} · {debateProwess(f)}
              </span>
            ))}
          </div>
          <button
            disabled={!teamReady}
            onClick={() => {
              if (!a || !b || !teamReady) return;
              setResult(null);
              recordTrainingUse('debate', [a.id, b.id]);
              const res = resolveTeamDebate([a, b], foePair);
              setTeamResult(res);
              const won = res.winner === 'a';
              if (won) {
                for (const v of res.a.filter((v) => !v.downed)) {
                  grantOfficerXp(v.id, 24, ['intelligence', 'charisma']);
                  recordDeed(v.id, { debatesWon: 1 });
                }
              }
              // 羞憤 — an emotional voice argued down stews on it (both benches).
              for (const v of [...res.a, ...res.b].filter((v) => v.downed)) {
                if (isEmotional(v.officer)) afflictOfficer(v.id, debateShame());
              }
              setResult({
                text: won
                  ? t('我方合辯得理 — 滿殿折服!', 'Your pair carries the hall!')
                  : res.winner === 'b'
                    ? t('彼方伶牙俐齒,我方合辯失利。', 'Their pair out-argues yours.')
                    : t('兩造各執一詞,殿上不了了之。', 'The hall adjourns undecided.'),
                notes: [],
              });
            }}
            style={{
              width: '100%', padding: '0.6rem', marginBottom: '0.8rem',
              background: teamReady ? 'linear-gradient(180deg,#234a6e,#13283e)' : '#1e2832',
              border: `1px solid ${teamReady ? '#88b7e8' : '#2b3845'}`,
              color: teamReady ? '#d8ecff' : '#5f6c76', cursor: teamReady ? 'pointer' : 'default',
              fontFamily: 'var(--tkm-font-body)', fontSize: '1rem', letterSpacing: '0.1rem',
            }}
          >🏛 {foePair.length === 0 ? t('無對手可辯', 'No opponents present') : t('殿上合辯', 'Begin the Joint Debate')}</button>
          {teamResult && (
            <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid #3a4754', borderRadius: 'var(--tkm-radius)', padding: '0.5rem 0.7rem', marginBottom: '0.8rem' }}>
              <div style={{ fontSize: '0.72rem', color: '#9aa6b0', marginBottom: 4 }}>{t(`合辯 ${teamResult.rounds} 回合`, `${teamResult.rounds} rounds`)}</div>
              {teamResult.log.map((l, i) => (
                <div key={i} style={{ fontSize: '0.78rem', color: '#cfe0ff', lineHeight: 1.6 }}>{lang === 'en' ? l.en : l.zh}</div>
              ))}
              {teamResult.log.length === 0 && <div style={{ fontSize: '0.78rem', color: '#7a8893' }}>{t('唇槍舌劍往還,無人語塞。', 'Barbs flew; no one was argued down.')}</div>}
            </div>
          )}
        </>);
      })()}

      {mode === 'moon' && (() => {
        const holderIsMine = !!seatHolder && seatHolder.forceId === playerForceId;
        const challengerReady = !!a && !holderIsMine && !!seatHolder && a.id !== seatHolder.id && debateLeftFor(aId) > 0;
        const defendReady = holderIsMine && !!seatHolder && debateLeftFor(seatHolder.id) > 0;
        const nextChallenger = holderIsMine && seatHolder ? pickMoonChallenger(officers, seatHolder.id, Math.random) : null;
        return (<>
          <div style={{ fontSize: '0.8rem', color: '#aab6c0', marginBottom: '0.8rem', lineHeight: 1.6 }}>
            {t('月旦評 — 天下名士清議排座次。辯倒在評魁首可奪其位;執魁首者聲名日隆,亦須應四方來辯。',
              'The Moon-Rank critique ranks the realm\'s tongues. Out-argue the laurel holder to take the seat; holding it pays in fame — and draws challengers.')}
          </div>
          {seatHolder && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(230,196,115,0.08)', border: '1px solid #e6c473', borderRadius: 'var(--tkm-radius)', padding: '0.5rem 0.7rem', marginBottom: '0.7rem' }}>
              <OfficerPortrait officer={seatHolder} size={44} forceColor="#e6c473" year={year} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: '#f2dd9a', fontSize: '0.92rem' }}>👑 {pickName(seatHolder.name, lang)} <span style={{ color: '#9aa6b0', fontSize: '0.72rem' }}>· {t('清議分', 'score')} {moonScore(seatHolder)}</span></div>
                <div style={{ fontSize: '0.7rem', color: '#9aa6b0' }}>
                  {moonLaurel && moonLaurel.officerId === seatHolder.id
                    ? t(`${moonLaurel.sinceYear}年在評 · 連折 ${moonLaurel.defenses} 辯`, `laurel since ${moonLaurel.sinceYear} · ${moonLaurel.defenses} defenses`)
                    : t('清議推重,虛位待辯', 'presumptive — the laurel awaits its first bout')}
                </div>
              </div>
            </div>
          )}
          {/* 月旦來辯 — a rival's writ demands a bout; answer it or wear the scorn. */}
          {holderIsMine && pendingMoonWrit && seatHolder && officers[pendingMoonWrit.challengerId] && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(224,132,106,0.1)', border: '1px solid #e0846a', borderRadius: 'var(--tkm-radius)', padding: '0.5rem 0.7rem', marginBottom: '0.7rem' }}>
              <OfficerPortrait officer={officers[pendingMoonWrit.challengerId]} size={36} forceColor="#e0846a" year={year} />
              <span style={{ flex: 1, color: '#ffd8c8', fontSize: '0.82rem', lineHeight: 1.5 }}>
                {t(`${pickName(officers[pendingMoonWrit.challengerId].name, lang)} 下帖求辯魁首 — 應戰,或為清議所輕?`,
                  `${pickName(officers[pendingMoonWrit.challengerId].name, lang)} sends a writ for the laurel — answer, or wear the scorn?`)}
              </span>
              <button
                onClick={() => { setResult(null); clearMoonWrit(); setMoonBout({ meId: seatHolder.id, foeId: pendingMoonWrit.challengerId, kind: 'defend' }); }}
                style={{ padding: '0.3rem 0.7rem', background: 'linear-gradient(180deg,#234a6e,#13283e)', border: '1px solid #88b7e8', borderRadius: 'var(--tkm-radius-sm)', color: '#d8ecff', cursor: 'pointer', fontFamily: 'var(--tkm-font-body)', fontSize: '0.8rem' }}
              >{t('應戰', 'Answer')}</button>
              <button
                onClick={() => { const r = duckMoonWrit(); setResult(r.message ? { text: r.message, notes: [] } : null); }}
                style={{ padding: '0.3rem 0.7rem', background: '#1e2832', border: '1px solid #5a4a44', borderRadius: 'var(--tkm-radius-sm)', color: '#b0a098', cursor: 'pointer', fontFamily: 'var(--tkm-font-body)', fontSize: '0.8rem' }}
              >{t('避辯', 'Duck')}</button>
            </div>
          )}
          {!holderIsMine ? (
            <button
              disabled={!challengerReady}
              onClick={() => { if (aId && seatHolder && challengerReady) { setResult(null); recordTrainingUse('debate', [aId]); setMoonBout({ meId: aId, foeId: seatHolder.id, kind: 'seize' }); } }}
              style={{
                width: '100%', padding: '0.6rem', marginBottom: '0.8rem',
                background: challengerReady ? 'linear-gradient(180deg,#6e5a23,#3e3213)' : '#1e2832',
                border: `1px solid ${challengerReady ? '#e6c473' : '#2b3845'}`,
                color: challengerReady ? '#ffe8c0' : '#5f6c76', cursor: challengerReady ? 'pointer' : 'default',
                fontFamily: 'var(--tkm-font-body)', fontSize: '1rem', letterSpacing: '0.1rem',
              }}
            >🌙 {a ? t(`遣 ${pickName(a.name, lang)} 挑戰月旦評`, `Send ${pickName(a.name, lang)} for the laurel`) : t('選一位說客', 'Pick a debater')}</button>
          ) : (
            <button
              disabled={!defendReady || !nextChallenger}
              onClick={() => { if (seatHolder && nextChallenger && defendReady) { setResult(null); recordTrainingUse('debate', [seatHolder.id]); setMoonBout({ meId: seatHolder.id, foeId: nextChallenger.id, kind: 'defend' }); } }}
              style={{
                width: '100%', padding: '0.6rem', marginBottom: '0.8rem',
                background: defendReady ? 'linear-gradient(180deg,#234a6e,#13283e)' : '#1e2832',
                border: `1px solid ${defendReady ? '#88b7e8' : '#2b3845'}`,
                color: defendReady ? '#d8ecff' : '#5f6c76', cursor: defendReady && nextChallenger ? 'pointer' : 'default',
                fontFamily: 'var(--tkm-font-body)', fontSize: '1rem', letterSpacing: '0.1rem',
              }}
            >🛡 {t('坐鎮清議,應四方來辯', 'Hold the laurel — answer a challenger')}</button>
          )}
          {/* 月旦榜 — the realm's ten keenest tongues. */}
          <div style={{ display: 'grid', gap: 4, marginBottom: '0.8rem' }}>
            {board.map((row, i) => (
              <div key={row.officer.id} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#10161e', border: `1px solid ${seatHolder?.id === row.officer.id ? '#e6c473' : '#26323e'}`, borderRadius: 'var(--tkm-radius-sm)', padding: '0.3rem 0.5rem' }}>
                <span style={{ width: 20, textAlign: 'right', color: i < 3 ? '#e6c473' : '#7a8893', fontSize: '0.8rem' }}>{i + 1}</span>
                <OfficerPortrait officer={row.officer} size={26} forceColor="#88b7e8" year={year} />
                <span style={{ flex: 1, color: '#e6edf3', fontSize: '0.84rem' }}>
                  {seatHolder?.id === row.officer.id ? '👑 ' : ''}{pickName(row.officer.name, lang)}
                  {row.officer.forceId === playerForceId && <span style={{ color: '#8ec8a0', fontSize: '0.68rem' }}> · {t('我方', 'yours')}</span>}
                </span>
                <span style={{ color: '#9aa6b0', fontSize: '0.76rem' }}>{row.score}</span>
              </div>
            ))}
          </div>
        </>);
      })()}

      {mode === 'gauntlet' && (<>
        <div style={{ fontSize: '0.8rem', color: '#aab6c0', marginBottom: '0.8rem', lineHeight: 1.6 }}>
          {t('遣一位說客舌戰群儒 — 連辯敵方諸人,愈往後對手愈強。一敗即止,看能連折幾人。',
            'Send one debater against a line of opposing scholars — each tougher than the last. One loss ends the run; see how many you can rout.')}
        </div>
        {a && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: '0.6rem' }}>
            <span style={{ color: '#f2dd9a', fontSize: '0.86rem' }}>{pickName(a.name, lang)}</span>
            <span style={{ color: '#7a8893' }}>vs</span>
            {gauntletFoes.map((f, i) => (
              <span key={f.id} style={{ fontSize: '0.72rem', color: '#9aa6b0', background: '#10161e', border: '1px solid #26323e', borderRadius: 'var(--tkm-radius-sm)', padding: '0.1rem 0.4rem' }}>
                {i + 1}. {pickName(f.name, lang)}
              </span>
            ))}
          </div>
        )}
        <button
          disabled={!gauntletReady}
          onClick={() => { if (aId && gauntletReady) { setResult(null); recordTrainingUse('debate', [aId]); setGauntlet({ championId: aId, foeIds: gauntletFoes.map((f) => f.id), idx: 0, wins: 0 }); } }}
          style={{
            width: '100%', padding: '0.6rem', marginBottom: a && !gauntletReady ? '0.4rem' : '0.8rem',
            background: gauntletReady ? 'linear-gradient(180deg,#234a6e,#13283e)' : '#1e2832',
            border: `1px solid ${gauntletReady ? '#88b7e8' : '#2b3845'}`,
            color: gauntletReady ? '#d8ecff' : '#5f6c76', cursor: gauntletReady ? 'pointer' : 'default',
            fontFamily: 'var(--tkm-font-body)', fontSize: '1rem', letterSpacing: '0.1rem',
          }}
        >💬 {gauntletFoes.length === 0 ? t('無對手可辯', 'No opponents present') : a ? t(`遣 ${pickName(a.name, lang)} 舌戰群儒`, `Send ${pickName(a.name, lang)} into the gauntlet`) : t('選一位說客', 'Pick a debater')}</button>
        {a && gauntletFoes.length > 0 && debateLeftFor(aId) <= 0 && (
          <div style={{ fontSize: '0.74rem', color: '#7fa8d8', marginBottom: '0.8rem', lineHeight: 1.5 }}>
            ⏳ {t(`${pickName(a.name, lang)} 本季舌敝唇焦，需休整至下季再辯。`, `${pickName(a.name, lang)} is talked out for the season — rest until next season.`)}
          </div>
        )}
      </>)}

      {mode !== 'gauntlet' && (
        <div style={{ fontSize: '0.8rem', color: '#aab6c0', marginBottom: '0.8rem', lineHeight: 1.6 }}>
          {mode === 'spar'
            ? t('選兩名麾下武將切磋舌辯(點到為止)。出「論/駁/諷/詰」破對方沉著,雙方皆增經驗,或可升級增益屬性、習得新技。',
                'Pick two officers for a war of words (non-lethal). Play 論/駁/諷/詰 to break their composure; both gain experience — which can raise stats or teach skills.')
            : t('挑一段劇情,遣一位說客出馬。辯勝有真實獎賞 — 說降、結盟、乃至罵死強敵。',
                'Pick a scenario and send a debater. A win carries real stakes — a defection, an alliance, even shouting a foe to death.')}
        </div>
      )}

      {mode === 'spar' && (<>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.8rem' }}>
          {slot(a, t('挑戰者', 'Challenger'))}
          <div style={{ fontSize: '1.4rem', color: '#7a8893' }}>VS</div>
          {slot(b, t('對手', 'Opponent'))}
        </div>
        {/* 難度 — how sharply the opposing officer reads & counters your arguments. */}
        <div style={{ display: 'flex', gap: 6, marginBottom: '0.8rem' }}>
          {([
            ['rookie', t('學徒', 'Novice')],
            ['veteran', t('名士', 'Adept')],
            ['peerless', t('宗師', 'Master')],
          ] as const).map(([id, label]) => {
            const on = difficulty === id;
            return (
              <button
                key={id}
                onClick={() => setDifficulty(id)}
                style={{
                  flex: 1, padding: '0.35rem', borderRadius: 'var(--tkm-radius-sm)', cursor: 'pointer', fontFamily: 'var(--tkm-font-body)', fontSize: '0.82rem',
                  background: on ? 'rgba(136,183,232,0.18)' : '#10161e',
                  border: `1px solid ${on ? '#88b7e8' : '#26323e'}`, color: on ? '#d8ecff' : '#8a96a0',
                }}
              >{label}</button>
            );
          })}
        </div>
        <button
          disabled={!debateReady}
          onClick={() => { setResult(null); setDebating(true); }}
          style={{
            width: '100%', padding: '0.6rem', marginBottom: ready && !debateReady ? '0.4rem' : '0.8rem',
            background: debateReady ? 'linear-gradient(180deg,#234a6e,#13283e)' : '#1e2832',
            border: `1px solid ${debateReady ? '#88b7e8' : '#2b3845'}`,
            color: debateReady ? '#d8ecff' : '#5f6c76', cursor: debateReady ? 'pointer' : 'default',
            fontFamily: 'var(--tkm-font-body)', fontSize: '1rem', letterSpacing: '0.1rem',
          }}
        >💬 {t('開始論辯', 'Begin the Debate')}</button>
        {ready && !debateReady && (
          <div style={{ fontSize: '0.74rem', color: '#7fa8d8', marginBottom: '0.8rem', lineHeight: 1.5 }}>
            ⏳ {t(
              `${debateLeftFor(aId) <= 0 ? pickName(a!.name, lang) : pickName(b!.name, lang)} 本季舌敝唇焦，需休整至下季再辯。`,
              `${debateLeftFor(aId) <= 0 ? pickName(a!.name, lang) : pickName(b!.name, lang)} is talked out for the season — rest until next season to debate again.`,
            )}
          </div>
        )}
      </>)}

      {mode === 'story' && (<>
        <div style={{ display: 'grid', gap: 6, marginBottom: '0.8rem' }}>
          {scenarios.map((sc) => {
            const sel = scenario?.id === sc.id;
            const opp = officers[sc.opponentId];
            return (
              <button
                key={sc.id}
                onClick={() => { setScenario(sel ? null : sc); setResult(null); }}
                style={{
                  textAlign: 'left', padding: '0.5rem 0.6rem', borderRadius: 'var(--tkm-radius-sm)', cursor: 'pointer', fontFamily: 'var(--tkm-font-body)',
                  background: sel ? 'rgba(136,183,232,0.16)' : '#10161e', border: `1px solid ${sel ? '#88b7e8' : '#26323e'}`, color: '#e6edf3',
                }}
              >
                <div style={{ color: '#f2dd9a', fontSize: '0.9rem' }}>{lang === 'en' ? sc.titleEn : sc.titleZh} <span style={{ color: '#8a96a0', fontSize: '0.72rem' }}>— {t('對手', 'vs')} {opp ? pickName(opp.name, lang) : sc.opponentId}</span></div>
                <div style={{ fontSize: '0.72rem', color: '#9aa6b0', lineHeight: 1.5, marginTop: 2 }}>{lang === 'en' ? sc.introEn : sc.introZh}</div>
              </button>
            );
          })}
          {scenarios.length === 0 && (
            <EmptyState compact icon="💬" title={t('目前無可進行的劇情舌戰。', 'No scenarios available right now.')} />
          )}
        </div>
        <button
          disabled={!(scenario && a)}
          onClick={() => { if (scenario && aId) { setResult(null); setStory({ scenario, strategistId: aId }); } }}
          style={{
            width: '100%', padding: '0.6rem', marginBottom: '0.8rem',
            background: scenario && a ? 'linear-gradient(180deg,#6e4a23,#3e2813)' : '#1e2832',
            border: `1px solid ${scenario && a ? '#e0b060' : '#2b3845'}`,
            color: scenario && a ? '#ffe8c0' : '#5f6c76', cursor: scenario && a ? 'pointer' : 'default',
            fontFamily: 'var(--tkm-font-body)', fontSize: '1rem', letterSpacing: '0.1rem',
          }}
        >🗣 {a ? t(`遣 ${pickName(a.name, lang)} 出馬`, `Send ${pickName(a.name, lang)}`) : t('選一位說客', 'Pick a debater')}</button>
      </>)}

      {result && (
        <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid #3a4754', borderRadius: 'var(--tkm-radius)', padding: '0.6rem 0.8rem', marginBottom: '0.8rem' }}>
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
        {mode === 'story' || mode === 'gauntlet' || mode === 'moon' ? t('遣誰出馬', 'Choose your debater') : t('麾下武將', 'Your Officers')} ({roster.length})
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 6 }}>
        {roster.map((o) => {
          const sel = o.id === aId || o.id === bId;
          // 論辯冷卻 — a talked-out officer can't be fielded in 切磋 or 群儒
          // (deselect still works).
          const left = trainsLeft(debateUsage ?? {}, o.id, seasonKey);
          const winded = (mode === 'spar' || mode === 'gauntlet' || mode === 'moon' || mode === 'team') && left <= 0 && !sel;
          return (
            <button
              key={o.id}
              disabled={winded}
              onClick={() => pick(o.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, textAlign: 'left',
                background: sel ? 'rgba(136,183,232,0.16)' : '#10161e',
                border: `1px solid ${sel ? '#88b7e8' : '#26323e'}`,
                borderRadius: 'var(--tkm-radius-sm)', padding: '0.4rem 0.5rem', cursor: winded ? 'default' : 'pointer',
                color: '#e6edf3', opacity: winded ? 0.5 : 1, fontFamily: 'var(--tkm-font-body)',
              }}
            >
              <OfficerPortrait officer={o} size={32} forceColor="#88b7e8" year={year} />
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ color: '#f2dd9a', fontSize: '0.85rem' }}>{pickName(o.name, lang)}</span>
                <span style={{ display: 'block', fontSize: '0.66rem', color: '#8a96a0' }}>
                  <OfficerStats officer={o} keys={['intelligence', 'charisma']} /> · {t('等', 'Lv')}{officerLevel(o)}
                </span>
              </span>
              {(mode === 'spar' || mode === 'gauntlet' || mode === 'moon' || mode === 'team') && (
                <span style={{ fontSize: '0.7rem', color: winded ? '#7fa8d8' : '#7a8893', whiteSpace: 'nowrap' }}>
                  {winded ? t('歇', 'Rest') : `辯 ${left}/${TRAIN_PER_SEASON}`}
                </span>
              )}
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
