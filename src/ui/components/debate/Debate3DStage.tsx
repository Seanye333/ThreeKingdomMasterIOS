import { useRef, useState } from 'react';
import type { ComponentProps } from 'react';
import { DebateGameModal, type DebateRoundFx } from '../DebateGameModal';
import { pickName, useLanguage, useT } from '../../i18n';
import { playSfx } from '../../../game/systems/sound';
import { DebateArena3D, type DebateArenaEvent } from './DebateArena3D';

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

  const emit = (fx: DebateRoundFx) => { keyRef.current += 1; setEvent({ ...fx, key: keyRef.current }); };

  const handleRound = (fx: DebateRoundFx) => {
    history.current.push(fx);
    emit(fx);
    if (fx.over) setEnded(fx);
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

      {/* 戰後 — replay / share, shown once the debate is decided. */}
      {ended && (
        <div style={{ position: 'fixed', left: '50%', bottom: 132, transform: 'translateX(-50%)', display: 'flex', gap: 8, zIndex: 132, pointerEvents: 'auto' }}>
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
