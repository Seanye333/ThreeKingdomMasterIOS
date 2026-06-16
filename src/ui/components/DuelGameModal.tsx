import { useRef, useState } from 'react';
import type { Officer } from '../../game/types';
import {
  initDuelBout, duelRound, aiDuelMove, POWER_GUARD_COST,
  type DuelMove, type DuelBout,
} from '../../game/systems/duel';
import { OfficerPortrait } from './OfficerPortrait';
import { playSfx } from '../../game/systems/sound';
import { useT, useLanguage } from '../i18n';

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
 * Interactive single combat — the player commits 攻/守/計/奮 each round against
 * the AI. 守>攻, 攻>計, 計>守; a successful 守 banks a guard point, and 奮
 * (Overpower, costs 2 guard) beats 攻 and 計 but loses to 守. First to drop the
 * foe's 氣力 to 0 cuts them down; a stamina lead at the end wins on points.
 */
const MOVES: Array<{ id: DuelMove; zh: string; en: string; hint: { zh: string; en: string } }> = [
  { id: 'attack', zh: '攻', en: 'Attack',  hint: { zh: '勝計、負守', en: 'beats Scheme, loses to Guard' } },
  { id: 'defend', zh: '守', en: 'Guard',   hint: { zh: '勝攻、攢氣', en: 'beats Attack, banks guard' } },
  { id: 'scheme', zh: '計', en: 'Scheme',  hint: { zh: '勝守、負攻', en: 'beats Guard, loses to Attack' } },
  { id: 'power',  zh: '奮', en: 'Overpower', hint: { zh: '耗2氣，勝攻計', en: '2 guard — beats Attack & Scheme' } },
];

export function DuelGameModal({
  attacker, defender, onComplete, meFatigue = 0, foeFatigue = 0,
}: {
  attacker: Officer;
  defender: Officer;
  onComplete: (outcome: { winner: 'attacker' | 'defender' | 'draw'; killedId?: 'attacker' | 'defender' }) => void;
  /** 車輪戰 — starting-stamina penalties from bouts already fought this battle. */
  meFatigue?: number;
  foeFatigue?: number;
}) {
  const t = useT();
  const lang = useLanguage();
  const reduced = typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const [bout, setBout] = useState<DuelBout>(() => initDuelBout(attacker, defender, meFatigue, foeFatigue));
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
    const mine = attacker.stats.war * 0.5 + attacker.stats.charisma * 0.5;
    const theirs = defender.stats.war * 0.5 + defender.stats.charisma * 0.5;
    const land = Math.random() < 0.5 + (mine - theirs) / 120;
    if (land) {
      setBout((b) => ({ ...b, aGuard: b.aGuard + POWER_GUARD_COST }));
      setLog((l) => [`${nm(attacker)} ${t('罵陣搦戰,氣勢大盛 — 蓄滿一記奮擊!', 'taunts the foe and seizes the initiative — an Overpower is banked!')}`, ...l]);
    } else {
      setBout((b) => ({ ...b, aStamina: Math.max(1, b.aStamina - 12) }));
      setLog((l) => [`${nm(attacker)} ${t('罵陣不成,反被激得心浮氣躁(−12 氣力)。', 'taunts and is rattled in return (−12 stamina).')}`, ...l]);
    }
  };
  const nm = (o: Officer) => (lang === 'en' ? o.name.en : o.name.zh);
  const moveZh = (m: DuelMove) => MOVES.find((x) => x.id === m)!.zh;

  const play = (move: DuelMove) => {
    if (bout.over) return;
    if (move === 'power' && bout.aGuard < POWER_GUARD_COST) return;
    const foeMove = aiDuelMove(bout, 'defender', Math.random);
    const res = duelRound(bout, move, foeMove, Math.random);
    const who = res.roundWinner === 'attacker' ? nm(attacker)
      : res.roundWinner === 'defender' ? nm(defender) : t('雙方', 'Both');
    const line = res.roundWinner === 'draw'
      ? `${t('第', 'R')}${res.bout.round}: ${nm(attacker)} ${moveZh(move)} ⚔ ${moveZh(foeMove)} ${nm(defender)} — ${t('相持', 'clash')}`
      : `${t('第', 'R')}${res.bout.round}: ${nm(attacker)} ${moveZh(move)} ⚔ ${moveZh(foeMove)} ${nm(defender)} — ${who}${t(' 佔先', ' lands it')} (−${Math.max(res.dmgToAttacker, res.dmgToDefender)})`;
    setLog((l) => [line, ...l].slice(0, 7));
    setBout(res.bout);

    // Fire the strike feedback: the round loser takes the blow.
    const hit: 'a' | 'd' | 'both' =
      res.dmgToAttacker > res.dmgToDefender ? 'a'
      : res.dmgToDefender > res.dmgToAttacker ? 'd'
      : 'both';
    fxKey.current += 1;
    setFx({ key: fxKey.current, hit, dmg: Math.max(res.dmgToAttacker, res.dmgToDefender), killed: !!res.bout.killedId });

    // 必殺 — a decisive 奮 from a great warrior unleashes a named signature move.
    const sigSide = move === 'power' && res.roundWinner === 'attacker' ? attacker
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
    bout.winner === 'draw' ? t('平手 — 各自負傷', 'Draw — both wounded')
    : bout.winner === 'attacker'
      ? (bout.killedId ? `${nm(attacker)} ${t('斬', 'cut down')} ${nm(defender)}!` : `${nm(attacker)} ${t('佔上風', 'prevails')}`)
      : (bout.killedId ? `${nm(defender)} ${t('斬', 'cut down')} ${nm(attacker)}!` : `${nm(defender)} ${t('佔上風', 'prevails')}`);

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.82)', display: 'grid', placeItems: 'center', zIndex: 130 }}>
      <div style={{ position: 'relative', overflow: 'hidden', width: 560, maxWidth: '95vw', background: '#1f1810', border: '1px solid #e6c473', padding: '1.25rem', fontFamily: 'var(--tkm-font-body)', color: '#e6edf3' }}>
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

        {/* 必殺技 — the signature move slams across the bout. */}
        {signature && (
          <div key={signature.key} style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', pointerEvents: 'none', zIndex: 6 }}>
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

        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '1rem', alignItems: 'center', position: 'relative' }}>
          <div
            key={fx && (fx.hit === 'a' || fx.hit === 'both') && !reduced ? `a${fx.key}` : 'a'}
            className={fx && (fx.hit === 'a' || fx.hit === 'both') && !reduced ? 'tkm-shake' : undefined}
            style={{ position: 'relative' }}
          >
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <OfficerPortrait officer={attacker} size={44} forceColor="#b8442e" />
              <div><div style={{ color: '#e6c473' }}>{nm(attacker)}</div><div style={{ fontSize: '0.72rem', color: '#aab6c0' }}>{t('武', 'WAR')} {attacker.stats.war}</div></div>
            </div>
            <div style={{ marginTop: '0.4rem' }}>{bar(bout.aStamina, '#b8442e')}</div>
            {guardPips(bout.aGuard)}
            {fx && fx.dmg > 0 && (fx.hit === 'a' || fx.hit === 'both') && (
              <span key={`da${fx.key}`} className="tkm-damage-num" style={{ position: 'absolute', right: 8, top: 4, fontSize: '1.1rem' }}>−{fx.dmg}</span>
            )}
          </div>

          {/* 刀光 — a clash glint flares over the centre each time blows are traded. */}
          <div style={{ position: 'relative', display: 'grid', placeItems: 'center', minWidth: '2.6rem' }}>
            <div style={{ fontSize: '1.6rem', color: '#7a8893' }}>VS</div>
            {fx && !reduced && (
              <span key={`c${fx.key}`} className="tkm-clash" style={{ position: 'absolute', color: fx.killed ? '#ffd86a' : '#e6c473' }}>
                {fx.killed ? '✸' : '⚔'}
              </span>
            )}
          </div>

          <div
            key={fx && fx.hit === 'd' && !reduced ? `d${fx.key}` : 'd'}
            className={fx && fx.hit === 'd' && !reduced ? 'tkm-shake' : undefined}
            style={{ textAlign: 'right', position: 'relative' }}
          >
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexDirection: 'row-reverse' }}>
              <OfficerPortrait officer={defender} size={44} forceColor="#3a7dd9" />
              <div><div style={{ color: '#e6c473' }}>{nm(defender)}</div><div style={{ fontSize: '0.72rem', color: '#aab6c0' }}>{t('武', 'WAR')} {defender.stats.war}</div></div>
            </div>
            <div style={{ marginTop: '0.4rem' }}>{bar(bout.dStamina, '#3a7dd9')}</div>
            {guardPips(bout.dGuard)}
            {fx && fx.dmg > 0 && (fx.hit === 'd' || fx.hit === 'both') && (
              <span key={`dd${fx.key}`} className="tkm-damage-num" style={{ position: 'absolute', left: 8, top: 4, fontSize: '1.1rem' }}>−{fx.dmg}</span>
            )}
          </div>
        </div>

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

        {/* Move buttons */}
        {!bout.over && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', marginTop: '1rem' }}>
            {MOVES.map((m) => {
              const disabled = m.id === 'power' && bout.aGuard < POWER_GUARD_COST;
              return (
                <button
                  key={m.id}
                  onClick={() => play(m.id)}
                  disabled={disabled}
                  style={{
                    padding: '0.5rem 0.3rem', background: disabled ? '#241c12' : '#1e2832',
                    border: `1px solid ${disabled ? '#243240' : '#364654'}`,
                    color: disabled ? '#5a4a36' : '#e6edf3', cursor: disabled ? 'default' : 'pointer',
                    fontFamily: 'inherit', textAlign: 'center',
                  }}
                  title={lang === 'en' ? m.hint.en : m.hint.zh}
                >
                  <div style={{ fontSize: '1.3rem', color: disabled ? '#5a4a36' : '#e6c473' }}>{m.zh}</div>
                  <div style={{ fontSize: '0.6rem', color: '#7a8893' }}>{lang === 'en' ? m.en : m.hint.zh}</div>
                </button>
              );
            })}
          </div>
        )}

        {/* Round log */}
        <div style={{ marginTop: '0.8rem', minHeight: 96, maxHeight: 96, overflow: 'hidden', fontSize: '0.74rem', color: '#aab6c0', lineHeight: 1.6 }}>
          {log.map((l, i) => <div key={i} style={{ opacity: 1 - i * 0.12 }}>{l}</div>)}
        </div>

        {bout.over && (
          <div style={{ marginTop: '0.6rem', textAlign: 'center' }}>
            <div className={reduced ? undefined : 'tkm-victory-slam'} style={{ color: bout.killedId ? '#b8442e' : '#e6c473', fontSize: '1.15rem', letterSpacing: '0.07rem', marginBottom: '0.6rem', textShadow: bout.killedId ? '0 0 14px rgba(184,68,46,0.6)' : '0 0 12px rgba(212,168,74,0.45)' }}>{resultText}</div>
            <button
              onClick={() => onComplete({ winner: bout.winner ?? 'draw', killedId: bout.killedId as 'attacker' | 'defender' | undefined })}
              style={{ padding: '0.45rem 1.6rem', background: '#1e2832', border: '1px solid #e6c473', color: '#e6c473', cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '0.07rem' }}
            >
              {t('確定', 'Continue')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
