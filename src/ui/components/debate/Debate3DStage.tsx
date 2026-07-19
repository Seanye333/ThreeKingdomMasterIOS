import { useRef, useState } from 'react';
import type { ComponentProps } from 'react';
import { DebateGameModal, type DebateRoundFx } from '../DebateGameModal';
import { pickName, useLanguage, useT } from '../../i18n';
import { playSfx } from '../../../game/systems/sound';
import { useGameStore } from '../../../game/state/store';
import { isNotableBout, type BoutRecord } from '../../../game/systems/duelHall';
import { debateCommentary } from '../../../game/systems/combatCommentary';
import { checkDebateEpiphany } from '../../../game/systems/debateArts';
import { debateProwess } from '../../../game/systems/wordWar';
import { DebateArena3D, type DebateArenaEvent } from './DebateArena3D';

const SEASON_IDX = ['spring', 'summer', 'autumn', 'winter'];
let debateSeq = 0;

/**
 * 寫實舌戰 — pairs the interactive {@link DebateGameModal} (rendered in `staged`
 * mode as a slim bottom control panel) with the 3D {@link DebateArena3D} behind
 * it, so the player's arguments play out as two robed strategists trading words
 * in a court hall. It also records the bout so the finish can be replayed/shared.
 *
 * Drop-in replacement for `<DebateGameModal>` anywhere a player-driven war of
 * words is shown: pass the same props.
 */
export function Debate3DStage(props: ComponentProps<typeof DebateGameModal>) {
  const { me, foe, onRound } = props;
  const lang = useLanguage();
  const t = useT();
  const leftName = pickName(me.name, lang);
  const rightName = pickName(foe.name, lang);
  const [event, setEvent] = useState<DebateArenaEvent | null>(null);
  const keyRef = useRef(0);
  const history = useRef<DebateRoundFx[]>([]);
  const [ended, setEnded] = useState<DebateRoundFx | null>(null);
  const [replaying, setReplaying] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [announce, setAnnounce] = useState<{ key: number; text: string } | null>(null);
  const archived = useRef(false);

  const emit = (fx: DebateRoundFx) => { keyRef.current += 1; setEvent({ ...fx, key: keyRef.current }); };

  const handleRound = (fx: DebateRoundFx) => {
    history.current.push(fx);
    emit(fx);
    // 實況解說 — a ringside line for the notable exchanges.
    const line = debateCommentary({ aName: leftName, dName: rightName, winner: fx.winner, hit: fx.hit, routed: fx.routed, dmg: fx.dmg, aMove: fx.aMove, dMove: fx.dMove }, history.current.length);
    if (line) setAnnounce({ key: history.current.length, text: lang === 'en' ? line.en : line.zh });
    if (fx.over) {
      setEnded(fx);
      // 名局廊 — archive a memorable war of words (a 罵死 rout or a long debate).
      if (!archived.current) {
        archived.current = true;
        const { date, recordBout } = useGameStore.getState();
        const rec: BoutRecord = {
          id: `debate-${me.id}-${foe.id}-${Date.now()}-${debateSeq++}`,
          kind: 'debate', aId: me.id, dId: foe.id,
          winner: fx.winner ?? 'draw', routed: !!fx.routed,
          year: date.year, season: Math.max(0, SEASON_IDX.indexOf(date.season)),
          fx: history.current.map((h) => ({ ...h })),
        };
        if (isNotableBout(rec)) recordBout(rec);
        // 論戰頓悟 — the player's debater deepens their 文辯 from the bout; a win
        // over a keener tongue / a famed name / a marathon can spark a 頓悟 (§6.14).
        const won = fx.winner === 'a';
        const notable = (foe.renown ?? 0) >= 30 || debateProwess(foe) >= 90;
        const ep = checkDebateEpiphany({
          won,
          prowessGap: Math.round(debateProwess(foe) - debateProwess(me)),
          notableFoe: notable,
          survivedThin: history.current.length >= 5,
        }, Math.random);
        const st0 = useGameStore.getState();
        st0.awardDebateInsight(me.id, ep.insight);
        // 敵亦精進 — the foe learns too: a player-side foe banks 心得 to spend; an
        // AI 名士 deepens 修為 directly (they never 講席 by hand).
        const foeEp = checkDebateEpiphany({
          won: fx.winner === 'd',
          prowessGap: Math.round(debateProwess(me) - debateProwess(foe)),
          notableFoe: (me.renown ?? 0) >= 30 || debateProwess(me) >= 90,
          survivedThin: history.current.length >= 5,
        }, Math.random);
        if (foe.forceId && foe.forceId !== st0.playerForceId) {
          st0.growDebateXiuwei(foe.id, foeEp.epiphany ? 3 : 1);
        } else {
          st0.awardDebateInsight(foe.id, foeEp.insight);
        }
        if (ep.epiphany) {
          setToast(lang === 'en' ? ep.noteEn : ep.noteZh);
          window.setTimeout(() => setToast(null), 2600);
          playSfx('bell');
        }
        // 名局入史 (§6.15) — an epic war of words (a 罵倒, or a marathon that went
        // the distance) is written into the running 事件簿, like a duel's is.
        const rounds = history.current.length;
        if (fx.routed || rounds >= 5) {
          const st = useGameStore.getState();
          const winName = fx.winner === 'a' ? leftName : fx.winner === 'd' ? rightName : '';
          const loseName = fx.winner === 'a' ? rightName : fx.winner === 'd' ? leftName : '';
          let titleZh = '舌戰名局';
          let textZh = `${winName} 與 ${loseName} 舌戰 ${rounds} 回合,終以辭鋒勝之 — 一時傳誦。`;
          if (fx.routed) {
            titleZh = '罵倒名士';
            textZh = `${winName} 舌戰 ${rounds} 回合罵倒 ${loseName} — 滿座失色!`;
          } else if (fx.winner === 'draw') {
            titleZh = '舌戰不下';
            textZh = `${leftName} 與 ${rightName} 舌戰 ${rounds} 回合,勝負不分 — 傳為佳話。`;
          }
          st.recordAnnal({ year: st.date.year, season: st.date.season, kind: 'event', titleZh, textZh, cityId: null });
        }
      }
    }
    onRound?.(fx); // preserve any host-supplied behaviour
  };

  // Re-play the recorded exchanges through the hall, spaced like a live bout.
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
    const winner = ended.winner === 'a' ? leftName : ended.winner === 'd' ? rightName : t('平手', 'a draw');
    const verb = ended.routed ? t('罵倒', 'shouted down') : ended.winner === 'draw' ? t('舌戰平手', 'debated to a draw with') : t('辯勝', 'out-argued');
    const text = ended.winner === 'draw'
      ? t(`💬 ${leftName} 與 ${rightName} ${verb}！(${history.current.length} 回合) #三國志大師`, `💬 ${leftName} ${verb} ${rightName}! (${history.current.length} rounds) #ThreeKingdomMasters`)
      : t(`💬 ${winner} ${verb} ${winner === leftName ? rightName : leftName}！(${history.current.length} 回合) #三國志大師`, `💬 ${winner} ${verb} ${winner === leftName ? rightName : leftName}! (${history.current.length} rounds) #ThreeKingdomMasters`);
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
      <DebateArena3D
        me={me}
        foe={foe}
        leftName={leftName}
        rightName={rightName}
        event={event}
      />
      <DebateGameModal {...props} staged onRound={handleRound} />

      {/* 實況解說 — a ringside announcer line, refreshed each notable exchange. */}
      {announce && (
        <div key={announce.key} className="tkm-announce" style={{ position: 'fixed', left: '50%', top: 52, transform: 'translateX(-50%)', maxWidth: '88vw', zIndex: 131, pointerEvents: 'none', background: 'linear-gradient(90deg, rgba(20,28,38,0), rgba(20,28,38,0.92) 18%, rgba(20,28,38,0.92) 82%, rgba(20,28,38,0))', padding: '0.3rem 1.2rem', color: '#cfe0ff', fontFamily: 'var(--tkm-font-body)', fontSize: '0.92rem', letterSpacing: '0.04rem', textShadow: '0 1px 4px #000', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          🎙 {announce.text}
        </div>
      )}

      {/* 戰後 — replay / share, shown once the debate is decided. */}
      {ended && (
        <div style={{ position: 'fixed', left: '50%', bottom: 132, transform: 'translateX(-50%)', display: 'flex', gap: 8, zIndex: 132, pointerEvents: 'auto' }}>
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
