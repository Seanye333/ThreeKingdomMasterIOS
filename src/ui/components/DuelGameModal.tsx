import { useState } from 'react';
import type { Officer } from '../../game/types';
import {
  initDuelBout, duelRound, aiDuelMove, POWER_GUARD_COST,
  type DuelMove, type DuelBout,
} from '../../game/systems/duel';
import { OfficerPortrait } from './OfficerPortrait';
import { useT, useLanguage } from '../i18n';

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
  attacker, defender, onComplete,
}: {
  attacker: Officer;
  defender: Officer;
  onComplete: (outcome: { winner: 'attacker' | 'defender' | 'draw'; killedId?: 'attacker' | 'defender' }) => void;
}) {
  const t = useT();
  const lang = useLanguage();
  const [bout, setBout] = useState<DuelBout>(() => initDuelBout(attacker, defender));
  const [log, setLog] = useState<string[]>([]);
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
  };

  const bar = (val: number, color: string) => (
    <div style={{ height: 14, background: '#2a1f15', border: '1px solid #4a3520', borderRadius: 2, overflow: 'hidden' }}>
      <div style={{ width: `${val}%`, height: '100%', background: color, transition: 'width 0.3s' }} />
    </div>
  );
  const guardPips = (n: number) => (
    <div style={{ fontSize: '0.7rem', color: n >= POWER_GUARD_COST ? '#d4a84a' : '#6a5238', letterSpacing: '0.15rem' }}>
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
      <div style={{ width: 560, maxWidth: '95vw', background: '#1f1810', border: '1px solid #d4a84a', padding: '1.25rem', fontFamily: 'Songti SC, serif', color: '#e8d9b0' }}>
        <div style={{ textAlign: 'center', color: '#d4a84a', letterSpacing: '0.4rem', fontSize: '1.2rem', marginBottom: '0.8rem' }}>
          ⚔ {t('單挑', 'Single Combat')}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '1rem', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <OfficerPortrait officer={attacker} size={44} forceColor="#b8442e" />
              <div><div style={{ color: '#d4a84a' }}>{nm(attacker)}</div><div style={{ fontSize: '0.72rem', color: '#c0a878' }}>{t('武', 'WAR')} {attacker.stats.war}</div></div>
            </div>
            <div style={{ marginTop: '0.4rem' }}>{bar(bout.aStamina, '#b8442e')}</div>
            {guardPips(bout.aGuard)}
          </div>
          <div style={{ fontSize: '1.6rem', color: '#8a7050' }}>VS</div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexDirection: 'row-reverse' }}>
              <OfficerPortrait officer={defender} size={44} forceColor="#3a7dd9" />
              <div><div style={{ color: '#d4a84a' }}>{nm(defender)}</div><div style={{ fontSize: '0.72rem', color: '#c0a878' }}>{t('武', 'WAR')} {defender.stats.war}</div></div>
            </div>
            <div style={{ marginTop: '0.4rem' }}>{bar(bout.dStamina, '#3a7dd9')}</div>
            {guardPips(bout.dGuard)}
          </div>
        </div>

        {/* 罵陣 — one shot, before blows are traded */}
        {!bout.over && !taunted && bout.round === 0 && (
          <button
            onClick={taunt}
            style={{
              marginTop: '0.9rem', width: '100%', padding: '0.4rem',
              background: 'rgba(184, 88, 74, 0.18)', border: '1px solid #b8584a',
              color: '#e8b0a0', cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '0.2rem',
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
                    padding: '0.5rem 0.3rem', background: disabled ? '#241c12' : '#3a2818',
                    border: `1px solid ${disabled ? '#3a2c1c' : '#5a4530'}`,
                    color: disabled ? '#5a4a36' : '#e8d9b0', cursor: disabled ? 'default' : 'pointer',
                    fontFamily: 'inherit', textAlign: 'center',
                  }}
                  title={lang === 'en' ? m.hint.en : m.hint.zh}
                >
                  <div style={{ fontSize: '1.3rem', color: disabled ? '#5a4a36' : '#d4a84a' }}>{m.zh}</div>
                  <div style={{ fontSize: '0.6rem', color: '#8a7050' }}>{lang === 'en' ? m.en : m.hint.zh}</div>
                </button>
              );
            })}
          </div>
        )}

        {/* Round log */}
        <div style={{ marginTop: '0.8rem', minHeight: 96, maxHeight: 96, overflow: 'hidden', fontSize: '0.74rem', color: '#c0a878', lineHeight: 1.6 }}>
          {log.map((l, i) => <div key={i} style={{ opacity: 1 - i * 0.12 }}>{l}</div>)}
        </div>

        {bout.over && (
          <div style={{ marginTop: '0.6rem', textAlign: 'center' }}>
            <div style={{ color: bout.killedId ? '#b8442e' : '#d4a84a', fontSize: '1.05rem', letterSpacing: '0.2rem', marginBottom: '0.6rem' }}>{resultText}</div>
            <button
              onClick={() => onComplete({ winner: bout.winner ?? 'draw', killedId: bout.killedId as 'attacker' | 'defender' | undefined })}
              style={{ padding: '0.45rem 1.6rem', background: '#3a2818', border: '1px solid #d4a84a', color: '#d4a84a', cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '0.2rem' }}
            >
              {t('確定', 'Continue')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
