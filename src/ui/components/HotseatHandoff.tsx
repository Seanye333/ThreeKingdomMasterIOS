import { useGameStore } from '../../game/state/store';
import { useT, useLanguage, pickName } from '../i18n';
import { seatNumber } from '../../game/systems/hotseat';

/**
 * 換手 — the card between two people sharing a device.
 *
 * It exists for one reason beyond ceremony: the map, the treasury and every
 * panel behind it belong to the seat that just finished. Handing the phone
 * across an open board shows the next player exactly where the last one's
 * armies are going. So this covers the screen until they say they are ready,
 * and nothing underneath renders in the meantime.
 */
export function HotseatHandoff() {
  const t = useT();
  const lang = useLanguage();
  const open = useGameStore((s) => s.hotseatHandoff);
  const seats = useGameStore((s) => s.hotSeatPlayers);
  const index = useGameStore((s) => s.hotSeatActiveIndex);
  const forces = useGameStore((s) => s.forces);
  const officers = useGameStore((s) => s.officers);
  const date = useGameStore((s) => s.date);
  const ready = useGameStore((s) => s.hotseatReady);

  if (!open || !seats || seats.length < 2) return null;
  const force = forces[seats[index]?.forceId ?? ''];
  const ruler = force ? officers[force.rulerOfficerId] : undefined;
  const who = ruler ? pickName(ruler.name, lang) : (force ? pickName(force.name, lang) : '—');
  const seat = seatNumber({ forceIds: seats.map((p) => p.forceId), index });

  const SEASON: Record<string, [string, string]> = {
    spring: ['春', 'Spring'], summer: ['夏', 'Summer'],
    autumn: ['秋', 'Autumn'], winter: ['冬', 'Winter'],
  };
  const season = SEASON[date.season] ?? ['', ''];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t('換手', 'Pass the device')}
      style={{
        position: 'fixed', inset: 0, zIndex: 9000,
        // Fully opaque: the whole point is that the previous player's board
        // must not be readable through it.
        background: 'radial-gradient(ellipse at 50% 35%, #1d2630 0%, #0b0f14 70%)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        fontFamily: 'var(--tkm-font-body)', textAlign: 'center', padding: '2rem',
      }}
    >
      <div style={{ color: '#7d8b98', letterSpacing: '0.3rem', fontSize: '0.78rem' }}>
        {t(`第 ${seat} 席`, `SEAT ${seat}`)}
      </div>
      <div style={{
        color: '#e6c473', fontSize: 'clamp(1.6rem, 6vw, 2.6rem)',
        margin: '0.8rem 0 0.2rem', letterSpacing: '0.1rem',
      }}>
        {t(`請將裝置交給 ${who}`, `Pass the device to ${who}`)}
      </div>
      <div style={{ color: '#9fb0bd', fontSize: '0.9rem', marginBottom: '2rem' }}>
        {t(`${date.year} 年 ${season[0]}`, `${season[1]}, ${date.year}`)}
        {force && <span style={{ marginLeft: 10, opacity: 0.75 }}>{pickName(force.name, lang)}</span>}
      </div>
      <p style={{ color: '#6f7d89', fontSize: '0.8rem', maxWidth: 380, lineHeight: 1.8, margin: '0 0 2rem' }}>
        {t(
          '在對方就座之前不要按下 —— 此畫面之後即是他的疆土與府庫。',
          'Do not tap until they are looking — everything behind this card is theirs.',
        )}
      </p>
      <button
        onClick={ready}
        style={{
          background: 'linear-gradient(180deg, #364654, #26323e)',
          border: '1px solid #e6c473', color: '#e6c473',
          padding: '0.7rem 2.4rem', fontFamily: 'inherit',
          letterSpacing: '0.12rem', fontSize: '1rem', cursor: 'pointer',
          borderRadius: 'var(--tkm-radius-xs)',
        }}
      >
        {t('我已就座', 'I am ready')}
      </button>
    </div>
  );
}
