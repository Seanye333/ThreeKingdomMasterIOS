import { useEffect, useMemo, useState } from 'react';
import { useGameStore } from '../../game/state/store';
import { playSfx } from '../../game/systems/sound';
import type { EntityId, Officer } from '../../game/types';
import { OfficerStats } from './OfficerStats';
import { OfficerPortrait } from './OfficerPortrait';
import { Name } from './Name';
import styles from './MarriagePicker.module.css';
import { useT } from '../i18n';

interface Props {
  targetForceId: EntityId;
  onClose: () => void;
}

const MARRIAGE_COST = 1000;

const PETALS = Array.from({ length: 14 }, (_, i) => i);

/** 婚成 — a red-and-gold flourish when the bond is sealed: the two officers
 *  converge beneath a 囍 as petals fall. Dismiss on click. */
function WeddingReveal({ a, b, year, onDone }: { a: Officer; b: Officer; year: number; onDone: () => void }) {
  const t = useT();
  useEffect(() => { playSfx('wedding'); }, []);
  const reduced = typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const anim = (s: string) => (reduced ? undefined : s);
  return (
    <div
      onClick={onDone}
      style={{
        position: 'fixed', inset: 0, zIndex: 1300, cursor: 'pointer',
        display: 'grid', placeItems: 'center',
        background: 'radial-gradient(ellipse at center, rgba(120,18,14,0.6), rgba(0,0,0,0.9))',
        animation: anim('tkmCeremonyBackdrop 0.35s ease-out'),
      }}
    >
      {!reduced && (
        <div style={{
          position: 'absolute', left: '50%', top: '46%', width: 560, height: 560,
          transform: 'translate(-50%,-50%)', pointerEvents: 'none', borderRadius: '50%',
          background: 'repeating-conic-gradient(from 0deg, rgba(230,196,115,0) 0deg, rgba(230,196,115,0.45) 6deg, rgba(230,196,115,0) 12deg)',
          WebkitMaskImage: 'radial-gradient(circle, #000 0%, transparent 60%)',
          maskImage: 'radial-gradient(circle, #000 0%, transparent 60%)',
          animation: 'tkmRaySpin 18s linear infinite, tkmRayPulse 2.8s ease-in-out infinite',
        }} />
      )}
      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.8rem' }}>
        <div style={{ fontSize: '3.4rem', color: '#e6c473', fontFamily: 'var(--tkm-font-zh, "Ma Shan Zheng", serif)', textShadow: '0 0 26px rgba(230,196,115,0.8)', ...(reduced ? {} : { animation: 'tkmVictorySlam 0.7s cubic-bezier(0.2,0.9,0.3,1) both' }) }}>囍</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.4rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, animation: anim('tkmConvergeLeft 0.8s cubic-bezier(0.2,0.9,0.3,1) both') }}>
            <div style={{ borderRadius: '50%', border: '2px solid #e6c473', boxShadow: '0 0 18px rgba(194,54,47,0.7)' }}>
              <OfficerPortrait officer={a} size={92} forceColor="#c2362f" year={year} />
            </div>
            <div style={{ color: '#ffd9a0', fontFamily: 'var(--tkm-font-body)' }}><Name pair={a.name} /></div>
          </div>
          <div style={{ fontSize: '1.6rem', color: '#e6c473', ...(reduced ? {} : { animation: 'tkmVictorySub 0.5s ease-out 0.5s both' }) }}>⚭</div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, animation: anim('tkmConvergeRight 0.8s cubic-bezier(0.2,0.9,0.3,1) both') }}>
            <div style={{ borderRadius: '50%', border: '2px solid #e6c473', boxShadow: '0 0 18px rgba(194,54,47,0.7)' }}>
              <OfficerPortrait officer={b} size={92} forceColor="#c2362f" year={year} />
            </div>
            <div style={{ color: '#ffd9a0', fontFamily: 'var(--tkm-font-body)' }}><Name pair={b.name} /></div>
          </div>
        </div>
        <div style={{ fontSize: '0.85rem', letterSpacing: '0.4rem', color: '#e8b0a0', ...(reduced ? {} : { animation: 'tkmVictorySub 0.5s ease-out 0.65s both' }) }}>
          {t('秦晉之好', 'A MARRIAGE BOND')}
        </div>
        {!reduced && PETALS.map((i) => (
          <span key={i} style={{
            position: 'absolute', left: `calc(50% + ${(i - 7) * 20}px)`, bottom: '8%',
            width: 4 + (i % 3), height: 4 + (i % 3), borderRadius: '50%',
            background: i % 2 ? '#e6c473' : '#e88a7a', pointerEvents: 'none',
            boxShadow: '0 0 6px rgba(230,196,115,0.8)',
            animation: `tkmMoteFloat ${1.8 + (i % 4) * 0.35}s ease-out ${(i % 5) * 0.2}s infinite`,
          }} />
        ))}
      </div>
    </div>
  );
}

export function MarriagePicker({ targetForceId, onClose }: Props) {
  const playerForceId = useGameStore((s) => s.playerForceId);
  const forces = useGameStore((s) => s.forces);
  const officers = useGameStore((s) => s.officers);
  const cities = useGameStore((s) => s.cities);
  const proposeMarriage = useGameStore((s) => s.proposeMarriage);
  const year = useGameStore((s) => s.date.year);
  const t = useT();
  const playerCapitalGold = useGameStore((s) => {
    const f = playerForceId ? s.forces[playerForceId] : null;
    const c = f ? s.cities[f.capitalCityId] : null;
    return c?.gold ?? 0;
  });

  const [yourPick, setYourPick] = useState<EntityId | null>(null);
  const [theirPick, setTheirPick] = useState<EntityId | null>(null);
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(
    null,
  );
  // The just-wed couple, shown in a brief 囍 reveal over the picker.
  const [wed, setWed] = useState<{ a: Officer; b: Officer } | null>(null);

  const yourOfficers = useMemo(
    () =>
      Object.values(officers)
        .filter((o) => o.forceId === playerForceId && o.status === 'idle')
        .sort((a, b) => b.stats.charisma - a.stats.charisma),
    [officers, playerForceId],
  );
  const theirOfficers = useMemo(
    () =>
      Object.values(officers)
        .filter((o) => o.forceId === targetForceId && o.status === 'idle')
        .sort((a, b) => b.stats.charisma - a.stats.charisma),
    [officers, targetForceId],
  );

  const playerForce = playerForceId ? forces[playerForceId] : null;
  const targetForce = forces[targetForceId];

  const handleSubmit = () => {
    if (!yourPick || !theirPick) return;
    const groom = officers[yourPick];
    const bride = officers[theirPick];
    const r = proposeMarriage(targetForceId, yourPick, theirPick);
    setFeedback({ ok: r.ok, text: r.message });
    if (r.ok) {
      if (groom && bride) setWed({ a: groom, b: bride });
      setYourPick(null);
      setTheirPick(null);
    }
  };

  return (
    <>
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <header className={styles.header}>
          <div>
            <div className={styles.titleZh}>{t('婚姻外交', 'Marriage Diplomacy')}</div>
            <div className={styles.titleEn}>
              {t(`與 ${targetForce?.name.zh ?? ''} 聯姻`, `Marriage Diplomacy with ${targetForce?.name.en ?? ''}`)}
            </div>
          </div>
          <button className={styles.closeButton} onClick={onClose}>
            ×
          </button>
        </header>

        <div className={styles.meta}>
          {t('費用：', 'Cost:')} <strong>{MARRIAGE_COST}{t('金', 'g')}</strong> {t('（國庫）', 'from capital')} · {t('現有：', 'Your gold:')}{' '}
          <strong>{playerCapitalGold}g</strong>
        </div>

        <div className={styles.columns}>
          <Column
            label={`${playerForce?.name.zh ?? t('我方', 'You')} ${t('自軍', '(self)')}`}
            color={playerForce?.color ?? '#364654'}
            officers={yourOfficers}
            cities={cities}
            picked={yourPick}
            onPick={setYourPick}
          />
          <div className={styles.linkIcon}>⚭</div>
          <Column
            label={`${targetForce?.name.zh ?? t('對方', 'Target')} ${t('相手軍', '(other)')}`}
            color={targetForce?.color ?? '#364654'}
            officers={theirOfficers}
            cities={cities}
            picked={theirPick}
            onPick={setTheirPick}
          />
        </div>

        {feedback && (
          <div
            className={`${styles.feedback} ${feedback.ok ? styles.feedbackOk : styles.feedbackFail}`}
          >
            {feedback.text}
          </div>
        )}

        <footer className={styles.footer}>
          <button
            className={styles.submitButton}
            onClick={handleSubmit}
            disabled={
              !yourPick || !theirPick || playerCapitalGold < MARRIAGE_COST
            }
          >
            {t('締結婚姻', 'Forge Marriage Bond')}
          </button>
        </footer>
      </div>
    </div>
    {wed && <WeddingReveal a={wed.a} b={wed.b} year={year} onDone={() => setWed(null)} />}
    </>
  );
}

interface ColumnProps {
  label: string;
  color: string;
  officers: Officer[];
  cities: Record<EntityId, { name: { zh: string; en: string } }>;
  picked: EntityId | null;
  onPick: (id: EntityId) => void;
}

function Column({ label, color, officers, cities, picked, onPick }: ColumnProps) {
  const t = useT();
  return (
    <div className={styles.column}>
      <div className={styles.columnHeader}>
        <span
          className={styles.colorDot}
          style={{ background: color }}
        />
        <span>{label}</span>
      </div>
      {officers.length === 0 ? (
        <div className={styles.empty}>{t('無可用武將。', 'No available officers.')}</div>
      ) : (
        <ul className={styles.officerList}>
          {officers.map((o) => {
            const city = o.locationCityId ? cities[o.locationCityId] : null;
            return (
              <li key={o.id}>
                <button
                  className={`${styles.officerButton} ${picked === o.id ? styles.officerSelected : ''}`}
                  onClick={() => onPick(o.id)}
                >
                  <span className={styles.officerNameZh}><Name pair={o.name} /></span>
                  <span className={styles.officerCha}>
                    <OfficerStats officer={o} keys={['charisma']} />
                  </span>
                  {city && (
                    <span className={styles.officerCity}>{city.name.zh}</span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
