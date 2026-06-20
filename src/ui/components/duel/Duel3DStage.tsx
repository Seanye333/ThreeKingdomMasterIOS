import { useRef, useState } from 'react';
import type { ComponentProps } from 'react';
import { DuelGameModal, type DuelRoundFx } from '../DuelGameModal';
import { pickName, useLanguage, useT } from '../../i18n';
import { playSfx } from '../../../game/systems/sound';
import { DuelArena3D, type DuelArenaEvent } from './DuelArena3D';

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
  const keyRef = useRef(0);
  const history = useRef<DuelRoundFx[]>([]);
  const [ended, setEnded] = useState<DuelRoundFx | null>(null);
  const [replaying, setReplaying] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const emit = (fx: DuelRoundFx) => { keyRef.current += 1; setEvent({ ...fx, key: keyRef.current }); };

  const handleRound = (fx: DuelRoundFx) => {
    history.current.push(fx);
    emit(fx);
    if (fx.over) setEnded(fx);
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
      />
      <DuelGameModal {...props} staged onRound={handleRound} />

      {/* 戰後 — replay / share, shown once the bout is decided. */}
      {ended && (
        <div style={{ position: 'fixed', left: '50%', bottom: 18, transform: 'translateX(-50%)', display: 'flex', gap: 8, zIndex: 132, pointerEvents: 'auto' }}>
          <button
            onClick={replay}
            disabled={replaying}
            style={{ padding: '0.4rem 0.9rem', background: 'rgba(20,28,38,0.94)', border: '1px solid #6aae73', borderRadius: 5, color: replaying ? '#5a6a5a' : '#cfe8c8', cursor: replaying ? 'default' : 'pointer', fontFamily: 'var(--tkm-font-body)', fontSize: '0.85rem' }}
          >🔁 {replaying ? t('回放中…', 'Replaying…') : t('回放', 'Replay')}</button>
          <button
            onClick={share}
            style={{ padding: '0.4rem 0.9rem', background: 'rgba(20,28,38,0.94)', border: '1px solid #e6c473', borderRadius: 5, color: '#f2dd9a', cursor: 'pointer', fontFamily: 'var(--tkm-font-body)', fontSize: '0.85rem' }}
          >📤 {t('分享', 'Share')}</button>
          {toast && <span style={{ alignSelf: 'center', color: '#9ed68a', fontSize: '0.78rem', textShadow: '0 1px 3px #000' }}>{toast}</span>}
        </div>
      )}
    </>
  );
}
