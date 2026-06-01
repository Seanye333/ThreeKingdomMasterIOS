import { useGameStore } from '../../game/state/store';
import type { BattleDetail, BattleSideDetail, Officer } from '../../game/types';
import styles from './BattleDetailModal.module.css';

interface Props {
  battle: BattleDetail;
  onClose: () => void;
}

export function BattleDetailModal({ battle, onClose }: Props) {
  const officers = useGameStore((s) => s.officers);
  const forces = useGameStore((s) => s.forces);
  const cities = useGameStore((s) => s.cities);

  const city = cities[battle.cityId];

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <header className={styles.header}>
          <div>
            <div className={styles.titleZh}>{battle.field ? '野戰' : '戰況'}</div>
            <div className={styles.titleEn}>
              {battle.field ? 'Field Battle — near ' : 'Battle Report — '}{city?.name.en ?? battle.cityId}
            </div>
          </div>
          <button className={styles.closeButton} onClick={onClose}>
            ×
          </button>
        </header>

        <div className={styles.banner}>
          {battle.field ? (
            <span className={`${styles.outcome} ${styles.victory}`}>
              截擊得勝 Interception — victor routs the column
            </span>
          ) : battle.cityFalls ? (
            <span className={`${styles.outcome} ${styles.conquest}`}>
              城陷 City Fell
            </span>
          ) : battle.attackerWins ? (
            <span className={`${styles.outcome} ${styles.victory}`}>
              戰勝 Attacker won (no breach)
            </span>
          ) : (
            <span className={`${styles.outcome} ${styles.defeat}`}>
              退却 Attacker repulsed
            </span>
          )}
        </div>

        <div className={styles.sides}>
          <Side
            label="Attacker 攻"
            detail={battle.attacker}
            officers={officers}
            forces={forces}
          />
          <div className={styles.versus}>vs</div>
          <Side
            label="Defender 守"
            detail={battle.defender}
            officers={officers}
            forces={forces}
          />
        </div>

        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Power calculation</h3>
          <PowerLine
            label="Attacker"
            blended={battle.attacker.blendedStat}
            troops={battle.attacker.troops}
            power={battle.attacker.power}
            extra={battle.attacker.bondBonus > 0
              ? `bond +${battle.attacker.bondBonus}`
              : undefined}
          />
          <PowerLine
            label="Defender"
            blended={battle.defender.blendedStat}
            troops={battle.defender.troops}
            power={battle.defender.power}
            extra={battle.field
              ? (battle.defender.bondBonus > 0 ? `bond +${battle.defender.bondBonus}` : 'open field')
              : `defense ${battle.cityDefense} (×${battle.defenseFactor}) ${battle.defender.bondBonus > 0 ? `· bond +${battle.defender.bondBonus}` : ''}`}
          />
          <div className={styles.shareRow}>
            <PowerShareBar
              attackerPower={battle.attacker.power}
              defenderPower={battle.defender.power}
            />
          </div>
        </section>

        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Casualties</h3>
          <div className={styles.casRow}>
            <div className={styles.casBlock}>
              <span className={styles.casLabel}>Attacker</span>
              <span className={styles.casLoss}>
                −{battle.attackerLosses.toLocaleString()}
              </span>
              <span className={styles.casPct}>
                {Math.round((battle.attackerLosses / Math.max(1, battle.attacker.troops)) * 100)}% lost
              </span>
            </div>
            <div className={styles.casBlock}>
              <span className={styles.casLabel}>Defender</span>
              <span className={styles.casLoss}>
                −{battle.defenderLosses.toLocaleString()}
              </span>
              <span className={styles.casPct}>
                {Math.round((battle.defenderLosses / Math.max(1, battle.defender.troops)) * 100)}% lost
              </span>
            </div>
          </div>
        </section>

        {battle.duelWinnerId && battle.duelLoserId && (
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Duel 一騎打</h3>
            <div className={styles.duelLine}>
              <strong>{officers[battle.duelWinnerId]?.name.en ?? battle.duelWinnerId}</strong>{' '}
              slew{' '}
              <strong style={{ textDecoration: 'line-through' }}>
                {officers[battle.duelLoserId]?.name.en ?? battle.duelLoserId}
              </strong>{' '}
              on the field.
            </div>
          </section>
        )}
      </div>
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
            {force.name.zh}
          </>
        )}
      </div>
      <ul className={styles.officerList}>
        {all.map((o, i) => (
          <li key={o.id} className={i === 0 ? styles.commander : ''}>
            <span className={styles.officerNameZh}>
              {i === 0 ? '★ ' : '  '}
              {o.name.zh}
            </span>
            <span className={styles.officerNameEn}>{o.name.en}</span>
            <span className={styles.officerStats}>
              W{o.stats.war} · L{o.stats.leadership}
            </span>
          </li>
        ))}
      </ul>
      <div className={styles.troopLine}>
        Troops: <strong>{detail.troops.toLocaleString()}</strong>
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
