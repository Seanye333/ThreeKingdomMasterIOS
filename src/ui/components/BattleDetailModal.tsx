import { useGameStore } from '../../game/state/store';
import { useEscapeKey } from '../hooks/useEscapeKey';
import type { BattleDetail, BattleSideDetail, Officer } from '../../game/types';
import { OfficerStats } from './OfficerStats';
import { OfficerPortrait } from './OfficerPortrait';
import { Name } from './Name';
import { useLanguage, useT } from '../i18n';
import styles from './BattleDetailModal.module.css';

interface Props {
  battle: BattleDetail;
  onClose: () => void;
}

export function BattleDetailModal({ battle, onClose }: Props) {
  useEscapeKey(onClose);
  const officers = useGameStore((s) => s.officers);
  const forces = useGameStore((s) => s.forces);
  const cities = useGameStore((s) => s.cities);

  const city = cities[battle.cityId];
  const playerForceId = useGameStore((s) => s.playerForceId);
  const hasLiveBattle = useGameStore((s) => !!s.tacticalBattle);
  const spectateFn = useGameStore((s) => s.spectateBattle);
  // 演義重現 — an AI-vs-AI clash can be re-staged live (nothing writes back).
  const canSpectate = !hasLiveBattle
    && battle.attacker.forceId !== playerForceId
    && battle.defender.forceId !== playerForceId;
  const lang = useLanguage();
  const t = useT();

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <header className={styles.header}>
          <div>
            {lang !== 'en' && <div className={styles.titleZh}>{battle.ambush ? '伏擊' : battle.campAssault ? '拔寨' : battle.field ? '野戰' : '戰況'}</div>}
            {lang !== 'zh' && (
              <div className={styles.titleEn}>
                {battle.ambush ? 'Ambush — near ' : battle.campAssault ? 'Camp Stormed — near ' : battle.field ? 'Field Battle — near ' : 'Battle Report — '}{city?.name.en ?? battle.cityId}
              </div>
            )}
          </div>
          {canSpectate && (
            <button
              onClick={() => { if (spectateFn(battle)) onClose(); }}
              title={t('演義重現 — 以 3D 會戰重演此役(雙方皆由 AI 演出,勝負不入史)', 'Dramatize — restage this clash live in 3D (pure theatre, nothing recorded)')}
              style={{
                marginLeft: 'auto', marginRight: 10, alignSelf: 'center',
                background: 'rgba(212,168,74,0.14)', border: '1px solid #8a6a2a', borderRadius: 'var(--tkm-radius-xs)',
                color: '#e8cf9a', padding: '0.25rem 0.7rem', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.78rem',
              }}
            >⏵ {t('演義重現', 'Dramatize')}</button>
          )}
          <button className={styles.closeButton} onClick={onClose}>
            ×
          </button>
        </header>

        <div className={styles.banner}>
          {battle.field ? (
            <span className={`${styles.outcome} ${styles.victory}`}>
              {battle.ambush
                ? (lang === 'en' ? `Ambush — sprung from cover, column shattered${battle.detected ? ' (enemy ready)' : ''}` : `設伏破敵${battle.detected ? '(敵已有備)' : ''}`)
                : battle.campAssault
                  ? (lang === 'en' ? `Camp stormed — earthworks overrun, ground seized${battle.detected ? ' (ambush detected)' : ''}` : `拔寨破營${battle.detected ? '(識破伏兵)' : ''}`)
                  : (lang === 'en' ? 'Interception — victor routs the column' : '截擊得勝')}
            </span>
          ) : battle.cityFalls ? (
            <span className={`${styles.outcome} ${styles.conquest}`}>
              {lang === 'en' ? 'City Fell' : '城陷'}
            </span>
          ) : battle.attackerWins ? (
            <span className={`${styles.outcome} ${styles.victory}`}>
              {lang === 'en' ? 'Attacker won (no breach)' : '戰勝'}
            </span>
          ) : (
            <span className={`${styles.outcome} ${styles.defeat}`}>
              {lang === 'en' ? 'Attacker repulsed' : '退却'}
            </span>
          )}
        </div>

        <div className={styles.sides}>
          <Side
            label={t('攻方', 'Attacker')}
            detail={battle.attacker}
            officers={officers}
            forces={forces}
          />
          <div className={styles.versus}>vs</div>
          <Side
            label={t('守方', 'Defender')}
            detail={battle.defender}
            officers={officers}
            forces={forces}
          />
        </div>

        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>{t('戰力推算', 'Power calculation')}</h3>
          <PowerLine
            label={t('攻', 'ATK')}
            blended={battle.attacker.blendedStat}
            troops={battle.attacker.troops}
            power={battle.attacker.power}
            extra={battle.attacker.bondBonus > 0
              ? t(`結義 +${battle.attacker.bondBonus}`, `bond +${battle.attacker.bondBonus}`)
              : undefined}
          />
          <PowerLine
            label={t('守', 'DEF')}
            blended={battle.defender.blendedStat}
            troops={battle.defender.troops}
            power={battle.defender.power}
            extra={battle.field
              ? (battle.defender.bondBonus > 0 ? t(`結義 +${battle.defender.bondBonus}`, `bond +${battle.defender.bondBonus}`) : t('平原野地', 'open field'))
              : t(`守備 ${battle.cityDefense} (×${battle.defenseFactor}) ${battle.defender.bondBonus > 0 ? `· 結義 +${battle.defender.bondBonus}` : ''}`,
                  `defense ${battle.cityDefense} (×${battle.defenseFactor}) ${battle.defender.bondBonus > 0 ? `· bond +${battle.defender.bondBonus}` : ''}`)}
          />
          <div className={styles.shareRow}>
            <PowerShareBar
              attackerPower={battle.attacker.power}
              defenderPower={battle.defender.power}
            />
          </div>
        </section>

        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>{t('傷亡', 'Casualties')}</h3>
          <div className={styles.casRow}>
            <CasBlock label={t('攻方', 'Attacker')} losses={battle.attackerLosses} troops={battle.attacker.troops} />
            <CasBlock label={t('守方', 'Defender')} losses={battle.defenderLosses} troops={battle.defender.troops} />
          </div>
        </section>

        {battle.duelWinnerId && battle.duelLoserId && (
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>{lang === 'en' ? 'Duel' : '一騎打'}</h3>
            <div className={styles.duelLine}>
              <strong>{officers[battle.duelWinnerId] ? <Name pair={officers[battle.duelWinnerId].name} /> : battle.duelWinnerId}</strong>{' '}
              {lang === 'en' ? 'slew' : '陣斬'}{' '}
              <strong style={{ textDecoration: 'line-through' }}>
                {officers[battle.duelLoserId] ? <Name pair={officers[battle.duelLoserId].name} /> : battle.duelLoserId}
              </strong>{' '}
              {lang === 'en' ? 'on the field.' : '於陣前。'}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

/** 傷亡塊 — the raw loss plus a proportion bar tinted by severity, so the
 *  price of the battle reads at a glance instead of as a number wall. */
function CasBlock({ label, losses, troops }: { label: string; losses: number; troops: number }) {
  const t = useT();
  const pct = Math.min(100, Math.round((losses / Math.max(1, troops)) * 100));
  const tone = pct >= 50 ? '#e05a3a' : pct >= 25 ? '#e0a050' : '#9ab87a';
  return (
    <div className={styles.casBlock}>
      <span className={styles.casLabel}>{label}</span>
      <span className={styles.casLoss} style={{ color: tone }}>
        −{losses.toLocaleString()}
      </span>
      <span className={styles.casTrack} title={`${losses.toLocaleString()} / ${troops.toLocaleString()}`}>
        <span className={styles.casFill} style={{ width: `${pct}%`, background: tone }} />
      </span>
      <span className={styles.casPct}>{pct}% {t('折損', 'lost')}</span>
    </div>
  );
}

function Side({
  label,
  detail,
  officers,
  forces,
}: {
  label: string;
  detail: BattleSideDetail;
  officers: Record<string, Officer>;
  forces: Record<string, { color: string; name: { en: string; zh: string } }>;
}) {
  const t = useT();
  const force = detail.forceId ? forces[detail.forceId] : null;
  const all = [detail.commanderId, ...detail.companionIds]
    .map((id) => officers[id])
    .filter((o): o is Officer => !!o);
  return (
    <div className={styles.side}>
      <div className={styles.sideLabel}>{label}</div>
      <div className={styles.sideForce}>
        {force && (
          <>
            <span
              className={styles.colorDot}
              style={{ background: force.color }}
            />
            <Name pair={force.name} />
          </>
        )}
      </div>
      <ul className={styles.officerList}>
        {all.map((o, i) => (
          <li key={o.id} className={i === 0 ? styles.commander : ''}>
            <span className={styles.officerNameZh} style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <OfficerPortrait officer={o} size={22} forceColor={force?.color} />
              {i === 0 ? '★ ' : ''}
              <Name pair={o.name} />
            </span>
            <span className={styles.officerStats}>
              <OfficerStats officer={o} keys={['war', 'leadership']} />
            </span>
          </li>
        ))}
      </ul>
      <div className={styles.troopLine}>
        {t('兵力', 'Troops')}: <strong>{detail.troops.toLocaleString()}</strong>
      </div>
    </div>
  );
}

function PowerLine({
  label,
  blended,
  troops,
  power,
  extra,
}: {
  label: string;
  blended: number;
  troops: number;
  power: number;
  extra?: string;
}) {
  return (
    <div className={styles.powerLine}>
      <span className={styles.powerLabel}>{label}</span>
      <span className={styles.powerFormula}>
        {blended.toFixed(1)} × √{troops.toLocaleString()}
        {extra && <span className={styles.powerExtra}> · {extra}</span>}
      </span>
      <span className={styles.powerValue}>= {power.toLocaleString()}</span>
    </div>
  );
}

function PowerShareBar({
  attackerPower,
  defenderPower,
}: {
  attackerPower: number;
  defenderPower: number;
}) {
  const total = attackerPower + defenderPower || 1;
  const aPct = (attackerPower / total) * 100;
  return (
    <div className={styles.shareBar}>
      <div
        className={styles.shareAttacker}
        style={{ width: `${aPct}%` }}
        title={`Attacker share ${aPct.toFixed(1)}%`}
      >
        {Math.round(aPct)}%
      </div>
      <div className={styles.shareDefender}>{Math.round(100 - aPct)}%</div>
    </div>
  );
}
