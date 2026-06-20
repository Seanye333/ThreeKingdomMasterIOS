import { useRef, useState } from 'react';
import type { Officer } from '../../game/types';
import {
  initDuelBout, duelRound, aiDuelMove, POWER_GUARD_COST, THRUST_COST, COMBO_COST, staticProwess, weaponArtFor,
  type DuelMove, type DuelBout, type DuelDifficulty,
} from '../../game/systems/duel';
import { OfficerPortrait } from './OfficerPortrait';
import { playSfx } from '../../game/systems/sound';
import { useT, useLanguage } from '../i18n';

/** Per-exchange feedback emitted by {@link DuelGameModal} so a host (the staged
 *  battlefield or the 3D duel arena) can drive strike / hit / death animations.
 *  `hit` is which side took the blow; the rest let the arena pick the right clip
 *  (a 奮 plays a heavier strike; `over`/`winner` trigger the finishing pose). */
export interface DuelRoundFx {
  hit: 'a' | 'd' | 'both';
  killed: boolean;
  aMove?: DuelMove;
  dMove?: DuelMove;
  over?: boolean;
  winner?: 'attacker' | 'defender' | 'draw';
  /** 缴械 — set to the side whose weapon was knocked aside by a 架 parry. */
  disarm?: 'attacker' | 'defender';
}

/** 必殺技 — a named signature move for famous warriors; the rest of the great
 *  (matchless / war ≥ 90) fall back to a generic 奮命一擊. */
const SIGNATURE_MOVES: Record<string, { zh: string; en: string }> = {
  'lu-bu': { zh: '方天畫戟', en: 'Sky Piercer' },
  'guan-yu': { zh: '拖刀計', en: 'Dragging-Blade Feint' },
  'zhang-fei': { zh: '丈八蛇矛', en: 'Serpent Lance' },
  'zhao-yun': { zh: '七進七出', en: 'Seven In, Seven Out' },
  'ma-chao': { zh: '錦帆銀槍', en: 'Silver Spear' },
  'dian-wei': { zh: '雙戟摧鋒', en: 'Twin Halberds' },
  'xu-chu': { zh: '虎癡裸衣', en: 'Tiger Fury' },
  'sun-ce': { zh: '江東霸王', en: 'Little Conqueror' },
  'huang-zhong': { zh: '百步穿楊', en: 'Hundred-Pace Shot' },
  'taishi-ci': { zh: '猿臂神射', en: 'Ape-Arm Volley' },
  'gan-ning': { zh: '錦帆百騎', en: 'Hundred Riders' },
  'yan-liang': { zh: '河北上將', en: 'Champion of Hebei' },
};

function signatureFor(o: Officer): { zh: string; en: string } | null {
  if (SIGNATURE_MOVES[o.id]) return SIGNATURE_MOVES[o.id];
  if (o.traits?.includes('matchless') || o.stats.war >= 90) return { zh: '奮命一擊', en: 'All-Out Strike' };
  return null;
}

/**
 * Interactive single combat — each round the player commits one of 3 attacks
 * (劈 cleave / 斬 slash / 掃 sweep) or 3 defenses (格 guard / 閃 dodge / 架 parry),
 * or spends 氣 on 奮 (Overpower). Counters are near-decisive: each attack is
 * stopped by two defenses and punishes the third; attacks clash on 斬>劈>掃>斬.
 * First to drop the foe's 氣力 to 0 cuts them down; a lead at the end wins.
 */
type MoveKind = 'attack' | 'defense' | 'power';
// `cost` is 氣 spent (0 = free); `bank` flags the 挑釁 generator.
const MOVES: Array<{ id: DuelMove; zh: string; en: string; kind: MoveKind; cost?: number; bank?: boolean; hint: { zh: string; en: string } }> = [
  { id: 'cleave', zh: '劈', en: 'Cleave',    kind: 'attack',  hint: { zh: '高·重 — 破架招', en: 'high/heavy — punishes Parry' } },
  { id: 'slash',  zh: '斬', en: 'Slash',     kind: 'attack',  hint: { zh: '中·快 — 破閃避', en: 'mid/fast — punishes Dodge' } },
  { id: 'sweep',  zh: '掃', en: 'Sweep',     kind: 'attack',  hint: { zh: '低·掃 — 破格擋', en: 'low — punishes Guard' } },
  { id: 'guard',  zh: '格', en: 'Guard',     kind: 'defense', hint: { zh: '擋斬·劈，攢氣；漏掃', en: 'stops Slash/Cleave, banks 氣; weak vs Sweep' } },
  { id: 'dodge',  zh: '閃', en: 'Dodge',     kind: 'defense', hint: { zh: '閃劈·掃，回氣力；漏斬', en: 'evades Cleave/Sweep, recovers; weak vs Slash' } },
  { id: 'parry',  zh: '架', en: 'Parry',     kind: 'defense', hint: { zh: '架斬·掃，反擊攢2氣，可缴械；漏劈', en: 'deflects Slash/Sweep, ripostes +2氣, can disarm; weak vs Cleave' } },
  { id: 'taunt',  zh: '挑釁', en: 'Taunt',   kind: 'power', bank: true, hint: { zh: '攢2氣+回氣力；若對手進攻則挨實打', en: 'banks 2氣 + recovers; but a foe attack lands clean' } },
  { id: 'thrust', zh: '突刺', en: 'Thrust',  kind: 'power', cost: THRUST_COST, hint: { zh: '耗1氣，破閃·架，唯格可擋', en: '1氣 — slips Dodge/Parry, only Guard stops' } },
  { id: 'combo',  zh: '連擊', en: 'Combo',    kind: 'power', cost: COMBO_COST, hint: { zh: '耗2氣，連環擊，無單防可全擋', en: '2氣 — a flurry no single defense fully stops' } },
  { id: 'power',  zh: '奮', en: 'Overpower', kind: 'power', cost: POWER_GUARD_COST, hint: { zh: '耗2氣，重擊，唯格可擋', en: '2氣 — heavy, only Guard stops it' } },
];

export function DuelGameModal({
  attacker, defender, onComplete, meFatigue = 0, foeFatigue = 0, lethal = true, reinforcements = [], staged = false, onRound, difficulty = 'veteran',
}: {
  attacker: Officer;
  defender: Officer;
  onComplete: (outcome: { winner: 'attacker' | 'defender' | 'draw'; killedId?: 'attacker' | 'defender'; attackerId?: string }) => void;
  /** 車輪戰 — starting-stamina penalties from bouts already fought this battle. */
  meFatigue?: number;
  foeFatigue?: number;
  /** AI 難度 — how sharply the foe reads and counters (rookie/veteran/peerless). */
  difficulty?: DuelDifficulty;
  /** 演武 — a non-lethal sparring bout: a knockout reads as "yields", not death. */
  lethal?: boolean;
  /** 三英戰呂布 — adjacent allies who can leap in when your fighter is hard-pressed. */
  reinforcements?: Officer[];
  /** 戰場原地對決 — render as a bottom panel so the 3D battlefield shows behind. */
  staged?: boolean;
  /** Fires after each exchange so the staged battlefield (or 3D duel arena) can
   *  play the matching strike/hit/death animations. */
  onRound?: (r: DuelRoundFx) => void;
}) {
  const t = useT();
  const lang = useLanguage();
  const reduced = typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const [bout, setBout] = useState<DuelBout>(() => initDuelBout(attacker, defender, meFatigue, foeFatigue, difficulty));
  // 當前出戰者 — starts as `attacker`; an ally can take over mid-bout (援護).
  const [me, setMe] = useState<Officer>(attacker);
  const [used, setUsed] = useState<Set<string>>(() => new Set([attacker.id]));
  const [log, setLog] = useState<string[]>([]);
  // 命中演出 — per-round strike feedback: which side was hit, by how much, and
  // a key so the clash glint / shake / damage-float replay even on a repeat hit.
  const [fx, setFx] = useState<{ key: number; hit: 'a' | 'd' | 'both'; dmg: number; killed: boolean } | null>(null);
  const fxKey = useRef(0);
  // 必殺技 — a named signature move flares when a great warrior lands a 奮.
  const [signature, setSignature] = useState<{ key: number; text: string } | null>(null);
  const sigKey = useRef(0);
  // 罵陣 — a one-time pre-duel taunt: out-talk them (your 武+魅 vs theirs)
  // and start with banked 氣 toward 奮; misfire and you open the round winded.
  const [taunted, setTaunted] = useState(false);
  const taunt = () => {
    if (taunted || bout.round > 0 || bout.over) return;
    setTaunted(true);
    const mine = me.stats.war * 0.5 + me.stats.charisma * 0.5;
    const theirs = defender.stats.war * 0.5 + defender.stats.charisma * 0.5;
    const land = Math.random() < 0.5 + (mine - theirs) / 120;
    if (land) {
      setBout((b) => ({ ...b, aGuard: b.aGuard + POWER_GUARD_COST }));
      setLog((l) => [`${nm(me)} ${t('罵陣搦戰,氣勢大盛 — 蓄滿一記奮擊!', 'taunts the foe and seizes the initiative — an Overpower is banked!')}`, ...l]);
    } else {
      setBout((b) => ({ ...b, aStamina: Math.max(1, b.aStamina - 12) }));
      setLog((l) => [`${nm(me)} ${t('罵陣不成,反被激得心浮氣躁(−12 氣力)。', 'taunts and is rattled in return (−12 stamina).')}`, ...l]);
    }
  };
  const nm = (o: Officer) => (lang === 'en' ? o.name.en : o.name.zh);
  const moveZh = (m: DuelMove) => MOVES.find((x) => x.id === m)!.zh;

  // 援護 — a fresh ally leaps in to take over, body fresh, against a foe who
  // keeps every wound and banked 氣 from the bout so far (三英戰呂布).
  const available = reinforcements.filter((r) => !used.has(r.id));
  const swapIn = (ally: Officer) => {
    if (bout.over) return;
    setMe(ally);
    setUsed((s) => new Set([...s, ally.id]));
    setTaunted(true);
    setBout((b) => ({
      ...b,
      aStamina: 100, aGuard: 0, aMoves: [],
      aStatic: staticProwess(ally), aInt: ally.stats.intelligence, aArt: weaponArtFor(ally),
    }));
    setLog((l) => [`${nm(ally)} ${t('挺身援護,接力再戰!', 'leaps in to fight on!')}`, ...l]);
  };

  const moveCost = (m: DuelMove) => MOVES.find((x) => x.id === m)?.cost ?? 0;
  const play = (move: DuelMove) => {
    if (bout.over) return;
    if (bout.aGuard < moveCost(move)) return; // not enough 氣 to spend
    const foeMove = aiDuelMove(bout, 'defender', Math.random);
    const res = duelRound(bout, move, foeMove, Math.random);
    const who = res.roundWinner === 'attacker' ? nm(me)
      : res.roundWinner === 'defender' ? nm(defender) : t('雙方', 'Both');
    const line = res.roundWinner === 'draw'
      ? `${t('第', 'R')}${res.bout.round}: ${nm(me)} ${moveZh(move)} ⚔ ${moveZh(foeMove)} ${nm(defender)} — ${t('相持', 'clash')}`
      : `${t('第', 'R')}${res.bout.round}: ${nm(me)} ${moveZh(move)} ⚔ ${moveZh(foeMove)} ${nm(defender)} — ${who}${t(' 佔先', ' lands it')} (−${Math.max(res.dmgToAttacker, res.dmgToDefender)})`;
    setLog((l) => [line, ...l].slice(0, 7));
    setBout(res.bout);

    // Fire the strike feedback: the round loser takes the blow.
    const hit: 'a' | 'd' | 'both' =
      res.dmgToAttacker > res.dmgToDefender ? 'a'
      : res.dmgToDefender > res.dmgToAttacker ? 'd'
      : 'both';
    fxKey.current += 1;
    setFx({ key: fxKey.current, hit, dmg: Math.max(res.dmgToAttacker, res.dmgToDefender), killed: !!res.bout.killedId });
    onRound?.({ hit, killed: !!res.bout.killedId, aMove: move, dMove: foeMove, over: res.bout.over, winner: res.bout.winner, disarm: res.disarm });
    if (res.disarm) {
      const victim = res.disarm === 'attacker' ? nm(me) : nm(defender);
      setLog((l) => [`⚡ ${victim} ${t('被架開兵器,氣勢盡失!', 'is disarmed — weapon knocked aside!')}`, ...l].slice(0, 7));
    }

    // 必殺 — a decisive 奮 from a great warrior unleashes a named signature move.
    const sigSide = move === 'power' && res.roundWinner === 'attacker' ? me
      : foeMove === 'power' && res.roundWinner === 'defender' ? defender
      : null;
    if (sigSide) {
      const sig = signatureFor(sigSide);
      if (sig) {
        sigKey.current += 1;
        const text = lang === 'en' ? `${nm(sigSide)} — ${sig.en}!` : `${nm(sigSide)}【${sig.zh}】!`;
        setSignature({ key: sigKey.current, text });
        playSfx('crash');
        if (!reduced) window.setTimeout(() => playSfx('shout'), 130);
        window.setTimeout(() => setSignature((s) => (s && s.key === sigKey.current ? null : s)), 1700);
      }
    }
  };

  const bar = (val: number, color: string) => (
    <div style={{ height: 14, background: '#1b2531', border: '1px solid #2b3845', borderRadius: 2, overflow: 'hidden' }}>
      <div style={{ width: `${val}%`, height: '100%', background: color, transition: 'width 0.5s cubic-bezier(0.4,0,0.2,1)' }} />
    </div>
  );
  const guardPips = (n: number) => (
    <div style={{ fontSize: '0.7rem', color: n >= POWER_GUARD_COST ? '#e6c473' : '#6a5238', letterSpacing: '0.05rem' }}>
      {t('氣', 'GD')} {'◆'.repeat(n)}{'◇'.repeat(Math.max(0, POWER_GUARD_COST - n))}
    </div>
  );

  const resultText = !bout.over ? '' :
    bout.winner === 'draw' ? (lethal ? t('平手 — 各自負傷', 'Draw — both wounded') : t('平手 — 點到為止', 'A draw — well matched'))
    : bout.winner === 'attacker'
      ? (lethal && bout.killedId ? `${nm(me)} ${t('斬', 'cut down')} ${nm(defender)}!` : `${nm(me)} ${t('佔上風', 'prevails')}`)
      : (lethal && bout.killedId ? `${nm(defender)} ${t('斬', 'cut down')} ${nm(me)}!` : `${nm(defender)} ${t('佔上風', 'prevails')}`);

  // ── Move buttons (shared by the inline grid and the staged side panels) ──
  const KIND_TINT: Record<MoveKind, string> = { attack: '#b8442e', defense: '#3a7dd9', power: '#e6c473' };
  const movesOf = (kind: MoveKind) => MOVES.filter((m) => m.kind === kind);
  const moveBtn = (m: typeof MOVES[number]) => {
    const cost = m.cost ?? 0;
    const disabled = cost > bout.aGuard;
    const tint = m.bank ? '#e08a4a' : KIND_TINT[m.kind]; // 挑釁 reads as a risky orange
    return (
      <button
        key={m.id}
        onClick={() => play(m.id)}
        disabled={disabled}
        style={{
          width: '100%', padding: '0.4rem 0.3rem', background: disabled ? '#241c12' : 'rgba(20,28,38,0.96)',
          border: `1px solid ${disabled ? '#243240' : tint}`,
          color: disabled ? '#5a4a36' : '#e6edf3', cursor: disabled ? 'default' : 'pointer',
          fontFamily: 'inherit', textAlign: 'center', borderRadius: 4,
        }}
        title={lang === 'en' ? m.hint.en : m.hint.zh}
      >
        <div style={{ fontSize: m.zh.length > 1 ? '1.0rem' : '1.25rem', color: disabled ? '#5a4a36' : tint }}>
          {m.zh}{cost > 0 ? ` ${'◆'.repeat(cost)}` : m.bank ? ' ＋' : ''}
        </div>
        <div style={{ fontSize: '0.58rem', color: '#8a96a0', lineHeight: 1.2 }}>{lang === 'en' ? m.en : m.hint.zh}</div>
      </button>
    );
  };
  const groupLabel = (zh: string, en: string, kind: MoveKind) => (
    <div style={{ fontSize: '0.62rem', color: KIND_TINT[kind], letterSpacing: '0.08rem', margin: '0 0 3px 2px', textShadow: '0 1px 3px #000' }}>
      {lang === 'en' ? en : zh}
    </div>
  );

  // One fighter's portrait + name + WAR + weapon art + health + guard, with the
  // hit shake / damage float. `who` picks the side; `foe` mirrors it to the right.
  const fighterStatus = (who: 'me' | 'foe') => {
    const o = who === 'me' ? me : defender;
    const color = who === 'me' ? '#b8442e' : '#3a7dd9';
    const stamina = who === 'me' ? bout.aStamina : bout.dStamina;
    const guard = who === 'me' ? bout.aGuard : bout.dGuard;
    const art = who === 'me' ? bout.aArt : bout.dArt;
    const right = who === 'foe';
    const isHit = !!fx && (who === 'me' ? (fx.hit === 'a' || fx.hit === 'both') : (fx.hit === 'd' || fx.hit === 'both'));
    return (
      <div
        key={isHit && !reduced ? `${who}${fx!.key}` : who}
        className={isHit && !reduced ? 'tkm-shake' : undefined}
        style={{ position: 'relative', textAlign: right ? 'right' : 'left', minWidth: 0 }}
      >
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexDirection: right ? 'row-reverse' : 'row' }}>
          <OfficerPortrait officer={o} size={44} forceColor={color} />
          <div style={{ minWidth: 0 }}>
            <div style={{ color: '#e6c473', whiteSpace: 'nowrap' }}>{nm(o)}</div>
            <div style={{ fontSize: '0.72rem', color: '#aab6c0' }}>{t('武', 'WAR')} {o.stats.war}</div>
            {art && <div style={{ fontSize: '0.64rem', color: '#e0b060', whiteSpace: 'nowrap' }}>⚔ {lang === 'en' ? art.en : art.zh}</div>}
          </div>
        </div>
        <div style={{ marginTop: '0.4rem' }}>{bar(stamina, color)}</div>
        {guardPips(guard)}
        {fx && fx.dmg > 0 && isHit && (
          <span key={`d${who}${fx.key}`} className="tkm-damage-num" style={{ position: 'absolute', [right ? 'left' : 'right']: 8, top: 4, fontSize: '1.1rem' }}>−{fx.dmg}</span>
        )}
      </div>
    );
  };

  return (
    <div style={staged
      ? { position: 'fixed', inset: 0, zIndex: 130, pointerEvents: 'none' }
      : { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.82)', display: 'grid', placeItems: 'center', zIndex: 130 }}>
      {/* Status card — slim bar at the TOP when staged (so the fighters stay clear) */}
      <div style={staged
        ? { position: 'fixed', top: 8, left: '50%', transform: 'translateX(-50%)', width: 'min(340px, 42vw)', overflow: 'hidden', background: 'rgba(31,24,16,0.9)', border: '1px solid #e6c473', borderRadius: 6, padding: '0.55rem 0.9rem', fontFamily: 'var(--tkm-font-body)', color: '#e6edf3', pointerEvents: 'auto', boxShadow: '0 6px 30px rgba(0,0,0,0.6)' }
        : { position: 'relative', overflow: 'hidden', width: 560, maxWidth: '95vw', background: '#1f1810', border: '1px solid #e6c473', padding: '1.25rem', fontFamily: 'var(--tkm-font-body)', color: '#e6edf3', pointerEvents: 'auto' }}>
        {/* 受創血暈 — the card edges flush red when *you* (the attacker) take a blow. */}
        {fx && !reduced && fx.hit === 'a' && <div key={`v${fx.key}`} className="tkm-blood-vignette" />}

        <div style={{ textAlign: 'center', color: '#e6c473', letterSpacing: '0.14rem', fontSize: '1.2rem', marginBottom: foeFatigue > 0 || meFatigue > 0 ? '0.2rem' : '0.8rem' }}>
          ⚔ {t('單挑', 'Single Combat')}
        </div>
        {(foeFatigue > 0 || meFatigue > 0) && (
          <div style={{ textAlign: 'center', fontSize: '0.72rem', color: '#e0a060', marginBottom: '0.7rem', letterSpacing: '0.05rem' }}>
            🌀 {foeFatigue >= meFatigue
              ? t('車輪戰 — 敵將連戰力竭,氣力大損!', 'Gauntlet — the foe is worn down from earlier bouts!')
              : t('車輪戰 — 我將連戰力竭,氣力大損!', 'Gauntlet — your officer is winded from earlier bouts!')}
          </div>
        )}

        {/* 必殺技 — the signature move slams across the whole screen. */}
        {signature && (
          <div key={signature.key} style={{ position: 'fixed', inset: 0, display: 'grid', placeItems: 'center', pointerEvents: 'none', zIndex: 140 }}>
            <div
              className={reduced ? undefined : 'tkm-victory-slam'}
              style={{
                fontFamily: 'var(--tkm-font-zh, "Ma Shan Zheng", "Songti SC", serif)',
                fontSize: '2.1rem', color: '#ffe08a', letterSpacing: '0.12rem', textAlign: 'center',
                textShadow: '0 0 26px rgba(255,180,60,0.9), 0 2px 6px #000',
                background: 'rgba(20,10,4,0.55)', padding: '0.35rem 1.5rem', borderRadius: 6,
                border: '1px solid rgba(255,200,90,0.5)',
              }}
            >{signature.text}</div>
          </div>
        )}

        {/* Non-staged: portraits in a centred row. (Staged shows them in the
            top corners — see the fixed panels below.) */}
        {!staged && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '1rem', alignItems: 'center', position: 'relative' }}>
            {fighterStatus('me')}
            <div style={{ position: 'relative', display: 'grid', placeItems: 'center', minWidth: '2.6rem' }}>
              <div style={{ fontSize: '1.6rem', color: '#7a8893' }}>VS</div>
              {fx && !reduced && (
                <span key={`c${fx.key}`} className="tkm-clash" style={{ position: 'absolute', color: fx.killed ? '#ffd86a' : '#e6c473' }}>
                  {fx.killed ? '✸' : '⚔'}
                </span>
              )}
            </div>
            {fighterStatus('foe')}
          </div>
        )}

        {/* 罵陣 — one shot, before blows are traded */}
        {!bout.over && !taunted && bout.round === 0 && (
          <button
            onClick={taunt}
            style={{
              marginTop: '0.9rem', width: '100%', padding: '0.4rem',
              background: 'rgba(184, 88, 74, 0.18)', border: '1px solid #b8584a',
              color: '#e8b0a0', cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '0.07rem',
            }}
            title={t('開打前先罵陣搦戰 — 武力+魅力壓過對手則蓄一記奮擊,反之自亂陣腳', 'Taunt before blows — win on War+Charisma to bank an Overpower, lose and rattle yourself')}
          >🗣 {t('罵陣搦戰', 'Taunt')}</button>
        )}

        {/* 援護 — when your fighter is hard-pressed, a fresh ally can leap in. */}
        {!bout.over && available.length > 0 && bout.aStamina < 45 && (
          <div style={{ marginTop: '0.9rem' }}>
            <div style={{ fontSize: '0.7rem', color: '#e0846a', letterSpacing: '0.05rem', marginBottom: 4 }}>
              🆘 {t('力戰不支 — 召友將援護(接力,敵將不回氣):', 'Hard-pressed — call an ally to fight on (the foe keeps its wounds):')}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {available.map((r) => (
                <button
                  key={r.id}
                  onClick={() => swapIn(r)}
                  style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#2a3a2a', border: '1px solid #6aae73', borderRadius: 4, padding: '0.25rem 0.5rem', color: '#d0ffd8', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.8rem' }}
                >🛡 {nm(r)} <span style={{ color: '#9ed68a', fontSize: '0.68rem' }}>{t('武', 'W')}{r.stats.war}</span></button>
              ))}
            </div>
          </div>
        )}

        {/* Move buttons — inline grid (non-staged); staged mode shows them as
            side panels outside this card so the fighters aren't covered. */}
        {!bout.over && !staged && (
          <div style={{ display: 'grid', gap: '0.5rem', marginTop: '0.9rem' }}>
            <div>
              {groupLabel('攻 — 進攻', 'ATTACK', 'attack')}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.4rem' }}>{movesOf('attack').map(moveBtn)}</div>
            </div>
            <div>
              {groupLabel('守 — 防禦', 'DEFEND', 'defense')}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.4rem' }}>{movesOf('defense').map(moveBtn)}</div>
            </div>
            <div>
              {groupLabel('技 — 絕技 (耗氣)', 'SPECIAL (氣)', 'power')}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.4rem' }}>{movesOf('power').map(moveBtn)}</div>
            </div>
          </div>
        )}

        {/* Round log — short when staged (it's a slim top bar) */}
        <div style={{ marginTop: '0.7rem', minHeight: staged ? 40 : 96, maxHeight: staged ? 40 : 96, overflow: 'hidden', fontSize: '0.74rem', color: '#aab6c0', lineHeight: 1.5 }}>
          {log.slice(0, staged ? 2 : 7).map((l, i) => <div key={i} style={{ opacity: 1 - i * 0.12 }}>{l}</div>)}
        </div>

        {bout.over && (
          <div style={{ marginTop: '0.6rem', textAlign: 'center' }}>
            <div className={reduced ? undefined : 'tkm-victory-slam'} style={{ color: lethal && bout.killedId ? '#b8442e' : '#e6c473', fontSize: '1.15rem', letterSpacing: '0.07rem', marginBottom: '0.6rem', textShadow: lethal && bout.killedId ? '0 0 14px rgba(184,68,46,0.6)' : '0 0 12px rgba(212,168,74,0.45)' }}>{resultText}</div>
            <button
              onClick={() => onComplete({ winner: bout.winner ?? 'draw', killedId: bout.killedId as 'attacker' | 'defender' | undefined, attackerId: me.id })}
              style={{ padding: '0.45rem 1.6rem', background: '#1e2832', border: '1px solid #e6c473', color: '#e6c473', cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '0.07rem' }}
            >
              {t('確定', 'Continue')}
            </button>
          </div>
        )}
      </div>

      {/* Staged: each fighter's portrait/name/health sits in a top corner. */}
      {staged && (() => {
        const corner = (who: 'me' | 'foe') => (
          <div style={{
            position: 'fixed', top: 10, ...(who === 'me' ? { left: 10 } : { right: 10 }),
            width: 'min(220px, 28vw)', pointerEvents: 'none', zIndex: 131,
            background: 'rgba(15,12,8,0.72)', border: '1px solid #5a4a2a', borderRadius: 6, padding: '0.45rem 0.6rem',
          }}>{fighterStatus(who)}</div>
        );
        return <>{corner('me')}{corner('foe')}</>;
      })()}

      {/* Staged side panels — attacks bottom-left, defenses bottom-right, so the
          centre stays clear for the 3D fighters. */}
      {staged && !bout.over && (
        <>
          <div style={{ position: 'fixed', left: 10, bottom: 22, width: 104, display: 'flex', flexDirection: 'column', gap: 6, pointerEvents: 'auto', zIndex: 131, maxHeight: '92vh', overflowY: 'auto' }}>
            {groupLabel('攻 — 進攻', 'ATTACK', 'attack')}
            {movesOf('attack').map(moveBtn)}
            <div style={{ height: 2 }} />
            {groupLabel('技 — 絕技', 'SPECIAL', 'power')}
            {movesOf('power').map(moveBtn)}
          </div>
          <div style={{ position: 'fixed', right: 10, bottom: 22, width: 104, display: 'flex', flexDirection: 'column', gap: 6, pointerEvents: 'auto', zIndex: 131 }}>
            {groupLabel('守 — 防禦', 'DEFEND', 'defense')}
            {movesOf('defense').map(moveBtn)}
          </div>
        </>
      )}
    </div>
  );
}
