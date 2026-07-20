import { useEffect, useRef, useState } from 'react';
import type { ComponentProps } from 'react';
import { DuelGameModal, type DuelRoundFx } from '../DuelGameModal';
import { pickName, useLanguage, useT } from '../../i18n';
import { OfficerCardFace } from '../OfficerCardModal';
import { playSfx } from '../../../game/systems/sound';
import { useGameStore } from '../../../game/state/store';
import { isNotableBout, type BoutRecord } from '../../../game/systems/duelHall';
import { duelCommentary } from '../../../game/systems/combatCommentary';
import { rivalryBetween, isNemesis, headToHead } from '../../../game/systems/rivalries';
import { ratingOf, duelCareerBonus } from '../../../game/systems/warRanking';
import { staticProwess } from '../../../game/systems/duel';
import { checkMartialEpiphany, readFoe, martialSchoolName } from '../../../game/systems/martialArts';
import { weaponClassFor } from '../../../game/systems/duel';
import { DuelArena3D, type DuelArenaEvent } from './DuelArena3D';

const SEASON_IDX = ['spring', 'summer', 'autumn', 'winter'];
let boutSeq = 0;

/**
 * 寫實單挑 — pairs the interactive {@link DuelGameModal} (rendered in `staged`
 * mode as a bottom control panel) with the 3D {@link DuelArena3D} behind it, so
 * the player's choices play out as real fighters trading blows. It also records
 * the bout so the finish can be replayed or shared.
 *
 * It is a drop-in replacement for `<DuelGameModal>` anywhere a player-driven
 * bout is shown (演武 / 比武 / 單挑): pass the same props.
 */
export function Duel3DStage(props: ComponentProps<typeof DuelGameModal>) {
  const { attacker, defender, onRound } = props;
  const lang = useLanguage();
  const t = useT();
  const leftName = pickName(attacker.name, lang);
  const rightName = pickName(defender.name, lang);
  const [event, setEvent] = useState<DuelArenaEvent | null>(null);
  // 對陣亮相 — both fighters' faces square off for a breath, then fade.
  const [introUp, setIntroUp] = useState(true);
  useEffect(() => {
    const id = window.setTimeout(() => setIntroUp(false), 2600);
    return () => window.clearTimeout(id);
  }, []);
  const keyRef = useRef(0);
  const history = useRef<DuelRoundFx[]>([]);
  const [ended, setEnded] = useState<DuelRoundFx | null>(null);
  const [replaying, setReplaying] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [announce, setAnnounce] = useState<{ key: number; text: string } | null>(null);
  const archived = useRef(false);

  // 宿敵 — the head-to-head record going INTO this bout (snapshot once, before it
  // is folded in below), so the banner reads "宿敵 · 戰績 2-1" as they square off.
  const rivalryRef = useRef(rivalryBetween(useGameStore.getState().rivalries ?? {}, attacker.id, defender.id));
  const swornRef = useRef(isNemesis(useGameStore.getState().rivalries ?? {}, attacker.id, defender.id));
  // 鬥將生涯 — the duel prowess each fighter has EARNED (武評榜段位 + 百戰勝績),
  // folded into the bout so a recognised duellist fights above their stat line.
  const careerRef = useRef((() => {
    const st = useGameStore.getState();
    const meRat = ratingOf(st.warRatings ?? {}, attacker), foeRat = ratingOf(st.warRatings ?? {}, defender);
    const me = duelCareerBonus(meRat, st.deeds?.[attacker.id]?.duelsWon ?? 0);
    const foe = duelCareerBonus(foeRat, st.deeds?.[defender.id]?.duelsWon ?? 0);
    return { me, foe };
  })());

  // 臨陣觀敵 (§6.10) — what your fighter can read off the arm across from them
  // before the first blow. Depth scales with their 智力 + own 修為.
  const foeRead = useRef(readFoe(attacker, defender, weaponClassFor(attacker), weaponClassFor(defender))).current;

  const emit = (fx: DuelRoundFx) => { keyRef.current += 1; setEvent({ ...fx, key: keyRef.current }); };

  const handleRound = (fx: DuelRoundFx) => {
    history.current.push(fx);
    emit(fx);
    // 實況解說 — a ringside line for the notable exchanges.
    const line = duelCommentary({ aName: leftName, dName: rightName, winner: fx.winner, hit: fx.hit, killed: fx.killed, disarm: fx.disarm, combo: fx.combo, aMove: fx.aMove, dMove: fx.dMove }, history.current.length);
    if (line) setAnnounce({ key: history.current.length, text: lang === 'en' ? line.en : line.zh });
    if (fx.over) {
      setEnded(fx);
      // 名局廊 — archive a memorable bout (a kill or a long, hard fight) so it
      // can be replayed from the hall later.
      if (!archived.current) {
        archived.current = true;
        const { date, recordBout, recordDuelRating, recordRivalry } = useGameStore.getState();
        const rec: BoutRecord = {
          id: `duel-${attacker.id}-${defender.id}-${Date.now()}-${boutSeq++}`,
          kind: 'duel', aId: attacker.id, dId: defender.id,
          winner: fx.winner ?? 'draw', killed: !!fx.killed,
          year: date.year, season: Math.max(0, SEASON_IDX.indexOf(date.season)),
          fx: history.current.map((h) => ({ ...h })),
        };
        if (isNotableBout(rec)) recordBout(rec);
        // 武評榜 — fold the result into the ELO ladder (from the attacker's view).
        recordDuelRating(attacker.id, defender.id, fx.winner === 'attacker' ? 'win' : fx.winner === 'defender' ? 'loss' : 'draw');
        // 恩怨簿 — accrue the head-to-head record (and close it if it ended in blood).
        recordRivalry(attacker.id, defender.id, fx.winner ?? 'draw', !!fx.killed);
        // 苦戰頓悟 — the player's fighter deepens their 武學 from the bout. A win
        // over a stronger arm / a famed rival / a long hard fight can spark a 頓悟.
        const won = fx.winner === 'attacker';
        const ep = checkMartialEpiphany({
          won,
          prowessGap: Math.round(staticProwess(defender) - staticProwess(attacker)),
          notableFoe: swornRef.current || !!rivalryRef.current,
          survivedThin: history.current.length >= 6,
          spar: props.lethal === false,
        }, Math.random);
        const st0 = useGameStore.getState();
        st0.awardMartialInsight(attacker.id, ep.insight);
        // 敵亦精進 — the foe learns from the bout too. A player-side foe banks 心得
        // to spend; an AI 鬥將 deepens 修為 directly (they never 修煉 by hand), so
        // rivals grow across a long game rather than staying stuck (§6.10).
        const foeEp = checkMartialEpiphany({
          won: fx.winner === 'defender',
          prowessGap: Math.round(staticProwess(attacker) - staticProwess(defender)),
          notableFoe: swornRef.current || !!rivalryRef.current,
          survivedThin: history.current.length >= 6,
          spar: props.lethal === false,
        }, Math.random);
        if (defender.forceId && defender.forceId !== st0.playerForceId) {
          st0.growMartialXiuwei(defender.id, foeEp.epiphany ? 3 : 1);
        } else {
          st0.awardMartialInsight(defender.id, foeEp.insight);
        }
        if (ep.epiphany) {
          setToast(lang === 'en' ? ep.noteEn : ep.noteZh);
          window.setTimeout(() => setToast(null), 2600);
          playSfx('bell');
        }
        // 名場面入史 (§6.13) — an epic bout (a kill, a marathon, a feud settled) is
        // written into the running 事件簿 so it can be relived in the annals.
        const rounds = history.current.length;
        if (fx.killed || rounds >= 12) {
          const st = useGameStore.getState();
          const winName = fx.winner === 'attacker' ? leftName : fx.winner === 'defender' ? rightName : '';
          const loseName = fx.winner === 'attacker' ? rightName : fx.winner === 'defender' ? leftName : '';
          let titleZh = '陣前力克';
          let textZh = `${winName} 大戰 ${rounds} 合力克 ${loseName},威名遠播。`;
          if (fx.killed) {
            titleZh = swornRef.current ? '了斷宿敵' : '陣斬名將';
            textZh = `${winName} 於陣前 ${rounds} 合斬 ${loseName}${swornRef.current ? ',了斷多年恩怨' : ''}!`;
          } else if (fx.winner === 'draw') {
            titleZh = '棋逢敵手';
            textZh = `${leftName} 與 ${rightName} 大戰 ${rounds} 合,不分勝負 — 一時傳為佳話。`;
          }
          st.recordAnnal({ year: st.date.year, season: st.date.season, kind: 'event', titleZh, textZh, cityId: null });
        }
      }
    }
    onRound?.(fx); // preserve any host-supplied behaviour
  };

  // Re-play the recorded exchanges through the arena, spaced like a live bout.
  const replay = () => {
    if (replaying || history.current.length === 0) return;
    setReplaying(true);
    const seq = history.current;
    let i = 0;
    const step = () => {
      if (i >= seq.length) { setReplaying(false); return; }
      emit(seq[i]);
      i += 1;
      window.setTimeout(step, 950);
    };
    step();
  };

  const share = () => {
    if (!ended) return;
    const winner = ended.winner === 'attacker' ? leftName : ended.winner === 'defender' ? rightName : t('平手', 'a draw');
    const verb = ended.killed ? t('斬', 'slew') : ended.winner === 'draw' ? t('戰平', 'fought to a draw with') : t('力克', 'bested');
    const text = ended.winner === 'draw'
      ? t(`⚔ ${leftName} 與 ${rightName} ${verb}！(${history.current.length} 回合) #三國志大師`, `⚔ ${leftName} ${verb} ${rightName}! (${history.current.length} rounds) #ThreeKingdomMasters`)
      : t(`⚔ ${winner} ${verb} ${winner === leftName ? rightName : leftName}！(${history.current.length} 回合) #三國志大師`, `⚔ ${winner} ${verb} ${winner === leftName ? rightName : leftName}! (${history.current.length} rounds) #ThreeKingdomMasters`);
    const nav = navigator as Navigator & { share?: (d: { text: string }) => Promise<void> };
    if (nav.share) { nav.share({ text }).catch(() => undefined); return; }
    navigator.clipboard?.writeText(text).then(() => {
      playSfx('click');
      setToast(t('戰報已複製', 'Copied to clipboard'));
      window.setTimeout(() => setToast(null), 1800);
    }).catch(() => undefined);
  };

  return (
    <>
      <DuelArena3D
        attacker={attacker}
        defender={defender}
        leftName={leftName}
        rightName={rightName}
        event={event}
        terrain={props.terrain}
      />
      {/* 知己知彼 — a sworn rival has fought you enough to read you a tier sharper. */}
      <DuelGameModal
        {...props}
        staged
        onRound={handleRound}
        difficulty={swornRef.current
          ? (props.difficulty === 'rookie' ? 'veteran' : 'peerless')
          : props.difficulty}
        meCareer={careerRef.current.me.prowess}
        foeCareer={careerRef.current.foe.prowess}
      />

      {/* 對陣亮相 — portraits face off, then step aside for the bout. */}
      {introUp && (() => {
        // VS 卡撞 — the two officers' trading cards slam in from the wings and
        // square off (TCG-style), replacing the old flat portrait pair.
        const s = (typeof window !== 'undefined' && window.innerWidth < 700) ? 0.38 : 0.54;
        const cardBox: React.CSSProperties = { width: 380 * s, height: 640 * s, overflow: 'hidden', borderRadius: 8, boxShadow: '0 12px 40px rgba(0,0,0,0.8)' };
        const inner: React.CSSProperties = { width: 380, transform: `scale(${s})`, transformOrigin: 'top left', pointerEvents: 'none' };
        return (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 133, pointerEvents: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 18,
          }}>
            <style>{`
              @keyframes tkmVsLeft { from { transform: translateX(-70vw) rotate(-8deg); opacity: 0; } 70% { transform: translateX(10px) rotate(1.5deg); } to { transform: none; opacity: 1; } }
              @keyframes tkmVsRight { from { transform: translateX(70vw) rotate(8deg); opacity: 0; } 70% { transform: translateX(-10px) rotate(-1.5deg); } to { transform: none; opacity: 1; } }
              @keyframes tkmVsFlash { 0%, 40% { opacity: 0; transform: scale(0.6); } 55% { opacity: 1; transform: scale(1.25); } 100% { opacity: 0.9; transform: scale(1); } }
            `}</style>
            <div style={{ ...cardBox, animation: 'tkmVsLeft 0.5s cubic-bezier(0.2, 0.8, 0.3, 1)' }}>
              <div style={inner}><OfficerCardFace officer={attacker} /></div>
            </div>
            <div style={{
              fontSize: '2.6rem', color: '#ffd0a0', fontFamily: 'var(--tkm-font-body)', fontWeight: 700,
              textShadow: '0 0 22px rgba(224,132,106,0.9), 0 2px 6px #000',
              animation: 'tkmVsFlash 0.9s ease-out',
            }}>⚔</div>
            <div style={{ ...cardBox, animation: 'tkmVsRight 0.5s cubic-bezier(0.2, 0.8, 0.3, 1)' }}>
              <div style={inner}><OfficerCardFace officer={defender} /></div>
            </div>
          </div>
        );
      })()}

      {/* 宿敵 — the head-to-head going into the bout (kills the loop between the
          恩怨簿 and the arena: rivals who keep meeting see their tally). */}
      {rivalryRef.current && (
        <div style={{ position: 'fixed', left: '50%', top: 28, transform: 'translateX(-50%)', zIndex: 131, pointerEvents: 'none', background: swornRef.current ? 'rgba(120,30,30,0.9)' : 'rgba(20,28,38,0.86)', border: `1px solid ${swornRef.current ? '#e07a5a' : '#5a4a2a'}`, borderRadius: 'var(--tkm-radius-sm)', padding: '0.18rem 0.8rem', color: swornRef.current ? '#ffd0c0' : '#e6c473', fontFamily: 'var(--tkm-font-body)', fontSize: '0.78rem', letterSpacing: '0.05rem', textShadow: '0 1px 3px #000', whiteSpace: 'nowrap' }}>
          {(() => { const h = headToHead(rivalryRef.current!, attacker.id); return (
            <>{swornRef.current ? '⚔ ' + t('宿敵', 'Sworn Rivals') : t('舊識', 'Old foes')} · {leftName} {h.mine}–{h.theirs} {rightName}{h.draws ? t(` ・平${h.draws}`, ` · ${h.draws}d`) : ''}</>
          ); })()}
        </div>
      )}

      {/* 鬥將生涯 — show a fighter's 段位 + earned edge when it's worth noting. */}
      {(careerRef.current.me.prowess > 0 || careerRef.current.foe.prowess > 0) && (
        <div style={{ position: 'fixed', left: '50%', top: rivalryRef.current ? 50 : 28, transform: 'translateX(-50%)', zIndex: 130, pointerEvents: 'none', display: 'flex', gap: 10, fontFamily: 'var(--tkm-font-body)', fontSize: '0.66rem', color: '#c9b87a', textShadow: '0 1px 3px #000', whiteSpace: 'nowrap' }}>
          {careerRef.current.me.prowess > 0 && <span>🏅 {leftName} {lang === 'en' ? careerRef.current.me.tierEn : careerRef.current.me.tierZh} +{careerRef.current.me.prowess}</span>}
          {careerRef.current.foe.prowess > 0 && <span>{rightName} {lang === 'en' ? careerRef.current.foe.tierEn : careerRef.current.foe.tierZh} +{careerRef.current.foe.prowess} 🏅</span>}
        </div>
      )}

      {/* 臨陣觀敵 — the pre-bout read on the foe; only as deep as your eye is sharp. */}
      {!ended && (
        <div style={{ position: 'fixed', right: 14, top: 74, zIndex: 130, pointerEvents: 'none', maxWidth: '46vw', background: 'rgba(20,28,38,0.86)', border: '1px solid #4a5a3a', borderRadius: 'var(--tkm-radius-sm)', padding: '0.28rem 0.6rem', fontFamily: 'var(--tkm-font-body)', fontSize: '0.7rem', color: '#c8d8b0', textShadow: '0 1px 3px #000', lineHeight: 1.6 }}>
          <div style={{ color: '#9ab88a', letterSpacing: '0.06rem' }}>
            👁 {t('觀敵', 'Read')} — {rightName}
          </div>
          <div>{t('流派', 'School')} {lang === 'en' ? foeRead.school.en : foeRead.school.zh}</div>
          {foeRead.tier
            ? <div>{t('修為', 'Mastery')} {lang === 'en' ? foeRead.tier.en : foeRead.tier.zh}</div>
            : <div style={{ color: '#7a8893' }}>{t('深淺莫測', 'depth unclear')}</div>}
          {foeRead.counter && foeRead.counter !== 'even' && (
            <div style={{ color: foeRead.counter === 'favourable' ? '#8ec88a' : '#e0846a' }}>
              {foeRead.counter === 'favourable'
                ? t(`${martialSchoolName(weaponClassFor(attacker)).zh}剋其派 — 佔上風`, 'Your school answers theirs')
                : t('其派剋我 — 須慎', 'Their school answers yours — careful')}
            </div>
          )}
          {foeRead.hasSecret && <div style={{ color: '#f0d890' }}>⚡ {t('身懷流派絕學', 'carries a school secret')}</div>}
        </div>
      )}

      {/* 實況解說 — a ringside announcer line, refreshed each notable exchange. */}
      {announce && (
        <div key={announce.key} className="tkm-announce" style={{ position: 'fixed', left: '50%', top: 52, transform: 'translateX(-50%)', maxWidth: '88vw', zIndex: 131, pointerEvents: 'none', background: 'linear-gradient(90deg, rgba(20,28,38,0), rgba(20,28,38,0.92) 18%, rgba(20,28,38,0.92) 82%, rgba(20,28,38,0))', padding: '0.3rem 1.2rem', color: '#ffe6b0', fontFamily: 'var(--tkm-font-body)', fontSize: '0.92rem', letterSpacing: '0.04rem', textShadow: '0 1px 4px #000', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          🎙 {announce.text}
        </div>
      )}

      {/* 戰後 — replay / share, shown once the bout is decided. */}
      {ended && (
        <div style={{ position: 'fixed', left: '50%', bottom: 18, transform: 'translateX(-50%)', display: 'flex', gap: 8, zIndex: 132, pointerEvents: 'auto' }}>
          <button
            onClick={replay}
            disabled={replaying}
            style={{ padding: '0.4rem 0.9rem', background: 'rgba(20,28,38,0.94)', border: '1px solid #6aae73', borderRadius: 'var(--tkm-radius-sm)', color: replaying ? '#5a6a5a' : '#cfe8c8', cursor: replaying ? 'default' : 'pointer', fontFamily: 'var(--tkm-font-body)', fontSize: '0.85rem' }}
          >🔁 {replaying ? t('回放中…', 'Replaying…') : t('回放', 'Replay')}</button>
          <button
            onClick={share}
            style={{ padding: '0.4rem 0.9rem', background: 'rgba(20,28,38,0.94)', border: '1px solid #e6c473', borderRadius: 'var(--tkm-radius-sm)', color: '#f2dd9a', cursor: 'pointer', fontFamily: 'var(--tkm-font-body)', fontSize: '0.85rem' }}
          >📤 {t('分享', 'Share')}</button>
          {toast && <span style={{ alignSelf: 'center', color: '#9ed68a', fontSize: '0.78rem', textShadow: '0 1px 3px #000' }}>{toast}</span>}
        </div>
      )}
    </>
  );
}
