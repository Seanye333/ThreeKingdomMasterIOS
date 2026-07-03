import { useMemo, useState } from 'react';
import { useGameStore } from '../../game/state/store';
import { playSfx } from '../../game/systems/sound';
import { useLanguage, useT } from '../i18n';
import { Modal } from './Modal';

/**
 * 劫糧道 — compose a raiding column against a spotted enemy supply convoy: pick a
 * captain and how many riders to commit, weigh them against the column's escort,
 * and send them out. They run the quarry down next season — matching or
 * outnumbering its escort overruns it (grain burned, coin looted home, escort
 * taken); a heavier guard beats the raiders off (the 烏巢 move).
 */
export function RaidDispatchModal({ targetConvoyId, fromCityId, onClose }: { targetConvoyId: string; fromCityId: string; onClose: () => void }) {
  const t = useT();
  const lang = useLanguage();
  const cities = useGameStore((s) => s.cities);
  const officers = useGameStore((s) => s.officers);
  const convoys = useGameStore((s) => s.convoys);
  const forces = useGameStore((s) => s.forces);
  const playerForceId = useGameStore((s) => s.playerForceId);
  const pendingCommands = useGameStore((s) => s.pendingCommands);
  const raidConvoy = useGameStore((s) => s.raidConvoy);

  const target = convoys[targetConvoyId];
  const from = cities[fromCityId];

  // 領兵之將 — idle officers in the launch city, the boldest (武) first.
  const captains = useMemo(
    () => Object.values(officers)
      .filter((o) => o.forceId === playerForceId && o.locationCityId === fromCityId && (o.status === 'idle' || o.status === 'active') && !o.task && !pendingCommands[o.id])
      .sort((a, b) => b.stats.war - a.stats.war),
    [officers, playerForceId, fromCityId, pendingCommands],
  );

  const troopCap = Math.max(0, (from?.troops ?? 0) - 100);
  const escort = target?.troops ?? 0;
  // Default to a force that can take the escort, if the garrison can spare it.
  const [captainId, setCaptainId] = useState(captains[0]?.id ?? '');
  const [troops, setTroops] = useState(Math.min(troopCap, Math.max(800, escort + 200)));

  if (!target || !from) {
    return (
      <Modal onClose={onClose} icon="🐎" title={t('劫糧道', 'Raid Supply Column')} width="min(420px, 100%)">
        <div style={{ color: '#7a8893', fontSize: '0.86rem', padding: '1rem 0' }}>{t('糧道已不可截。', 'The column is no longer in reach.')}</div>
      </Modal>
    );
  }

  const captain = officers[captainId] && captains.some((o) => o.id === captainId) ? officers[captainId] : captains[0];
  const enemy = forces[target.forceId]?.name;
  const send = Math.min(troops, troopCap);
  const willOverrun = send >= escort;

  const cargoText = [target.food > 0 ? `${t('糧', 'grain')} ${target.food.toLocaleString()}` : '', target.gold > 0 ? `${t('金', 'gold')} ${target.gold.toLocaleString()}` : '']
    .filter(Boolean).join(' · ') || t('空車', 'empty');

  const launch = () => {
    if (!captain || send < 1) return;
    const r = raidConvoy(targetConvoyId, fromCityId, captain.id, send);
    if (r.ok) { playSfx('sword'); onClose(); }
  };

  return (
    <Modal onClose={onClose} icon="🐎" title={t('劫糧道', 'Raid Supply Column')} badge={t(`自 ${from.name.zh}`, `from ${from.name.en}`)} width="min(440px, 100%)">
      {/* The quarry */}
      <div style={{ background: '#141c25', border: '1px solid #243240', borderRadius: 'var(--tkm-radius-sm)', padding: '0.55rem 0.7rem', marginBottom: '0.8rem', fontSize: '0.8rem' }}>
        <div style={{ color: '#e8a890' }}>
          {t('敵糧道', 'Enemy column')} · {(lang === 'en' ? enemy?.en : enemy?.zh) ?? '—'}
        </div>
        <div style={{ color: '#aab6c0', fontFamily: 'ui-monospace, monospace', marginTop: 2 }}>
          {t('載', 'cargo')} {cargoText} · {t('護糧', 'escort')} {escort.toLocaleString()}
        </div>
      </div>

      {/* Captain */}
      <label style={{ display: 'grid', gridTemplateColumns: '3.4rem 1fr', gap: 8, alignItems: 'center', marginBottom: '0.7rem' }}>
        <span style={{ fontSize: '0.78rem', color: '#7a8893' }}>{t('領兵', 'Captain')}</span>
        {captains.length === 0 ? (
          <span style={{ fontSize: '0.78rem', color: '#e0a070' }}>{t('此城無閒置武將', 'no idle officer here')}</span>
        ) : (
          <select value={captain?.id ?? ''} onChange={(e) => setCaptainId(e.target.value)} style={selectStyle}>
            {captains.map((o) => (
              <option key={o.id} value={o.id}>{(lang === 'en' ? o.name.en : o.name.zh)} · {t('武', 'WAR')}{o.stats.war}</option>
            ))}
          </select>
        )}
      </label>

      {/* Riders */}
      <div style={{ display: 'grid', gridTemplateColumns: '3.4rem 1fr 5rem', gap: 8, alignItems: 'center', marginBottom: '0.5rem' }}>
        <span style={{ fontSize: '0.78rem', color: '#9ec0d8' }}>{t('騎兵', 'Riders')}</span>
        <input
          type="range" min={0} max={troopCap} step={100}
          value={Math.min(troops, troopCap)}
          onChange={(e) => setTroops(Number(e.target.value))}
          disabled={!captain || troopCap <= 0}
          style={{ accentColor: '#9ec0d8', width: '100%' }}
        />
        <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: '0.78rem', color: '#cdd8e0', textAlign: 'right' }}>
          {send.toLocaleString()}<span style={{ color: '#5f6c76' }}> /{troopCap.toLocaleString()}</span>
        </span>
      </div>

      {/* Odds */}
      <div style={{ fontSize: '0.78rem', marginBottom: '0.9rem', color: willOverrun ? '#9ad6a8' : '#e0a070', lineHeight: 1.6 }}>
        {willOverrun
          ? t('● 兵力足以踏破護糧 — 必克,焚糧掠金、生擒押運。', '● Enough to overrun the escort — column destroyed, escort taken.')
          : t('● 兵力不及護糧 — 恐為所拒,折兵而還。', '● Too few for the escort — likely beaten off, with losses.')}
        <div style={{ color: '#7a8893', marginTop: 2 }}>{t('一季後截擊,得手後回城。', 'Intercepts next season, then rides home.')}</div>
      </div>

      <button
        onClick={launch}
        disabled={!captain || send < 1}
        style={{
          width: '100%', padding: '0.5rem', borderRadius: 'var(--tkm-radius)', cursor: !captain || send < 1 ? 'default' : 'pointer',
          fontFamily: 'inherit', fontSize: '0.92rem', letterSpacing: '0.1rem',
          background: !captain || send < 1 ? '#1b2531' : 'linear-gradient(180deg, rgba(184,68,46,0.28), rgba(184,68,46,0.1))',
          border: `1px solid ${!captain || send < 1 ? '#2b3845' : '#b8442e'}`,
          color: !captain || send < 1 ? '#5f6c76' : '#f0b9a4',
        }}
      >
        {t('劫糧', 'Raid')} {send > 0 ? `· ${send.toLocaleString()}` : ''}
      </button>
    </Modal>
  );
}

const selectStyle = {
  background: '#080b0e', border: '1px solid #2b3845', color: '#e6c473',
  padding: '0.3rem 0.4rem', fontFamily: 'inherit', fontSize: '0.82rem', borderRadius: 'var(--tkm-radius-sm)',
} as const;
