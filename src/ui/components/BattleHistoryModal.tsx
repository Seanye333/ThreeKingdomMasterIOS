import { useMemo, useState } from 'react';
import { useEscapeKey } from '../hooks/useEscapeKey';
import { useGameStore } from '../../game/state/store';
import { SEASON_LABEL } from '../../game/types';
import type { HistoricBattle, Season } from '../../game/types';
import { BattleDetailModal } from './BattleDetailModal';
import { Name } from './Name';
import { useLanguage } from '../i18n';
import styles from './BattleHistoryModal.module.css';

interface Props {
  onClose: () => void;
}

type OutcomeFilter = 'all' | 'won' | 'lost' | 'conquest';

export function BattleHistoryModal({ onClose }: Props) {
  useEscapeKey(onClose);
  const lang = useLanguage();
  const battles = useGameStore((s) => s.battleHistory);
  const cities = useGameStore((s) => s.cities);
  const officers = useGameStore((s) => s.officers);
  const forces = useGameStore((s) => s.forces);
  const playerForceId = useGameStore((s) => s.playerForceId);
  const [selected, setSelected] = useState<HistoricBattle | null>(null);
  const [outcomeFilter, setOutcomeFilter] = useState<OutcomeFilter>('all');
  const [search, setSearch] = useState('');

  // Aggregate stats — restricted to player's battles where possible.
  const stats = useMemo(() => {
    const playerBattles = battles.filter(
      (b) => b.attacker.forceId === playerForceId || b.defender.forceId === playerForceId,
    );
    let won = 0, lost = 0, conquests = 0;
    let killsDealt = 0, killsTaken = 0;
    for (const b of playerBattles) {
      const playerIsAttacker = b.attacker.forceId === playerForceId;
      const playerWon = (b.attackerWins && playerIsAttacker) || (!b.attackerWins && !playerIsAttacker);
      if (playerWon) won++; else lost++;
      if (b.cityFalls && playerIsAttacker) conquests++;
      // Approximation: enemy loss = kills dealt by player
      if (playerIsAttacker) {
        killsDealt += b.defenderLosses;
        killsTaken += b.attackerLosses;
      } else {
        killsDealt += b.attackerLosses;
        killsTaken += b.defenderLosses;
      }
    }
    return { total: playerBattles.length, won, lost, conquests, killsDealt, killsTaken };
  }, [battles, playerForceId]);

  // Newest first, filtered
  const sorted = useMemo(() => {
    const q = search.trim().toLowerCase();
    const qZh = search.trim();
    return [...battles]
      .reverse()
      .filter((b) => {
        if (outcomeFilter !== 'all') {
          const playerIsAttacker = b.attacker.forceId === playerForceId;
          const playerWon = (b.attackerWins && playerIsAttacker) || (!b.attackerWins && !playerIsAttacker);
          if (outcomeFilter === 'won' && !playerWon) return false;
          if (outcomeFilter === 'lost' && playerWon) return false;
          if (outcomeFilter === 'conquest' && !(b.cityFalls && playerIsAttacker)) return false;
        }
        if (!q) return true;
        const city = cities[b.cityId];
        return (
          (city?.name.zh ?? '').includes(qZh) ||
          (city?.name.en ?? '').toLowerCase().includes(q) ||
          String(b.date.year).includes(q)
        );
      });
  }, [battles, outcomeFilter, search, cities, playerForceId]);

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <header className={styles.header}>
          <div>
            {lang !== 'en' && <div className={styles.titleZh}>戰史</div>}
            {lang !== 'zh' && <div className={styles.titleEn}>
              Battle History — {battles.length} battle{battles.length === 1 ? '' : 's'} recorded
            </div>}
          </div>
          <button className={styles.closeButton} onClick={onClose}>
            ×
          </button>
        </header>

        {/* Aggregate stats — player perspective. */}
        {playerForceId && stats.total > 0 && (
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(110px,1fr))',
            gap: '0.5rem', padding: '0.6rem 1rem', borderBottom: '1px solid #2b3845',
            background: 'rgba(20,16,12,0.4)',
            fontFamily: 'var(--tkm-font-body)', fontSize: '0.78rem',
          }}>
            <Stat label={lang === 'en' ? 'Battles' : '總戰'} value={stats.total} color="#aab6c0" />
            <Stat label={lang === 'en' ? 'Won' : '勝'} value={stats.won} color="#7ed68a" />
            <Stat label={lang === 'en' ? 'Lost' : '敗'} value={stats.lost} color="#b8442e" />
            <Stat label={lang === 'en' ? 'Taken' : '攻陷'} value={stats.conquests} color="#e6c473" />
            <Stat label={lang === 'en' ? 'Kills' : '殲敵'} value={stats.killsDealt.toLocaleString()} color="#c9a64e" />
            <Stat label={lang === 'en' ? 'Losses' : '己損'} value={stats.killsTaken.toLocaleString()} color="#8a5a3a" />
          </div>
        )}

        {/* Filter row */}
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: '0.4rem', alignItems: 'center',
          padding: '0.5rem 1rem', borderBottom: '1px solid #2b3845',
        }}>
          {(['all', 'won', 'lost', 'conquest'] as const).map((k) => {
            const label = (lang === 'en' ? { all: 'All', won: 'Won', lost: 'Lost', conquest: 'Taken' } : { all: '全部', won: '勝戰', lost: '敗戰', conquest: '攻陷' })[k];
            const active = outcomeFilter === k;
            return (
              <button
                key={k}
                onClick={() => setOutcomeFilter(k)}
                style={{
                  background: active ? '#1e2832' : 'transparent',
                  border: `1px solid ${active ? '#e6c473' : '#2b3845'}`,
                  color: active ? '#e6c473' : '#7a8893',
                  padding: '0.2rem 0.6rem',
                  cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.75rem',
                }}
              >{label}</button>
            );
          })}
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={lang === 'en' ? 'Search city / year…' : '搜尋城名/年份…'}
            style={{
              flex: 1, minWidth: '140px',
              background: '#10161e', border: '1px solid #2b3845',
              color: '#e6edf3', padding: '0.25rem 0.5rem',
              fontFamily: 'inherit', fontSize: '0.78rem',
            }}
          />
        </div>

        {sorted.length === 0 ? (
          <div className={styles.empty}>
            No battles yet. March on an enemy city to start the record.
          </div>
        ) : (
          <ul className={styles.list}>
            {sorted.map((b) => {
              const city = cities[b.cityId];
              const aForce = b.attacker.forceId ? forces[b.attacker.forceId] : null;
              const dForce = b.defender.forceId ? forces[b.defender.forceId] : null;
              const aCommander = officers[b.attacker.commanderId];
              const dCommander = officers[b.defender.commanderId];
              const season = SEASON_LABEL[b.date.season as Season];
              const outcome = b.cityFalls
                ? 'Conquest'
                : b.attackerWins
                  ? 'Field won'
                  : 'Repulsed';
              const outcomeClass = b.cityFalls
                ? styles.outcomeConquest
                : b.attackerWins
                  ? styles.outcomeWon
                  : styles.outcomeRepulsed;
              return (
                <li
                  key={b.id}
                  className={styles.row}
                  onClick={() => setSelected(b)}
                >
                  <span className={styles.dateCell}>
                    {b.date.year} {season.en.slice(0, 3)}
                  </span>
                  <span className={styles.cityCell}>
                    {city?.name.zh ?? b.cityId}
                  </span>
                  <span className={styles.sidesCell}>
                    <span className={styles.sideTag}>
                      {aForce && (
                        <span
                          className={styles.dot}
                          style={{ background: aForce.color }}
                        />
                      )}
                      {aCommander ? <Name pair={aCommander.name} /> : '?'}
                    </span>
                    <span className={styles.versus}>vs</span>
                    <span className={styles.sideTag}>
                      {dForce && (
                        <span
                          className={styles.dot}
                          style={{ background: dForce.color }}
                        />
                      )}
                      {dCommander ? <Name pair={dCommander.name} /> : '?'}
                    </span>
                  </span>
                  <span className={`${styles.outcomeCell} ${outcomeClass}`}>
                    {outcome}
                  </span>
                  <span className={styles.casualtiesCell}>
                    {b.attackerLosses.toLocaleString()} / {b.defenderLosses.toLocaleString()}
                  </span>
                </li>
              );
            })}
          </ul>
        )}

        {selected && (
          <BattleDetailModal
            battle={selected}
            onClose={() => setSelected(null)}
          />
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '0.65rem', color: '#7a8893', letterSpacing: '0.07rem' }}>{label}</div>
      <div style={{ fontSize: '1rem', color, fontFamily: 'ui-monospace, monospace', marginTop: '0.15rem' }}>{value}</div>
    </div>
  );
}
