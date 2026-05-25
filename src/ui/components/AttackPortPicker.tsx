import { useMemo, useState } from 'react';
import { useGameStore } from '../../game/state/store';
import type { EntityId } from '../../game/types';
import styles from './MarriagePicker.module.css';
import { useT } from '../i18n';

interface Props {
  portId: EntityId;
  onClose: () => void;
  onCommit: (officerId: EntityId, troops: number) => void;
}

export function AttackPortPicker({ portId, onClose, onCommit }: Props) {
  const playerForceId = useGameStore((s) => s.playerForceId);
  const officersMap = useGameStore((s) => s.officers);
  const cities = useGameStore((s) => s.cities);
  const ports = useGameStore((s) => s.ports);
  const port = ports[portId];

  const [officerId, setOfficerId] = useState<EntityId | null>(null);
  const [troops, setTroops] = useState<number>(2000);
  const t = useT();

  // Eligible attackers: officers stationed in cities that can REACH the port —
  // either land-adjacent to the port's linked city, the linked city itself, or
  // hosting a sea-connected port the player owns.
  const candidates = useMemo(() => {
    if (!playerForceId || !port) return [];
    const linkedCity = cities[port.linkedCityId];
    const validSourceCityIds = new Set<string>();
    // Land — linked city + its neighbors, IF owned by player
    if (linkedCity) {
      if (linkedCity.ownerForceId === playerForceId) validSourceCityIds.add(linkedCity.id);
      for (const adjId of linkedCity.adjacentCityIds ?? []) {
        if (cities[adjId]?.ownerForceId === playerForceId) validSourceCityIds.add(adjId);
      }
    }
    // Sea — cities hosting a player port directly connected to target
    for (const p of Object.values(ports)) {
      if (p.ownerForceId === playerForceId
          && p.connectedPortIds.includes(port.id)
          && cities[p.linkedCityId]?.ownerForceId === playerForceId) {
        validSourceCityIds.add(p.linkedCityId);
      }
    }
    return Object.values(officersMap)
      .filter((o) =>
        o.forceId === playerForceId
        && (o.status === 'idle' || o.status === 'active')
        && o.locationCityId
        && validSourceCityIds.has(o.locationCityId),
      )
      .map((o) => ({
        officer: o,
        city: cities[o.locationCityId!]!,
      }))
      .sort((a, b) => b.officer.stats.war - a.officer.stats.war);
  }, [officersMap, cities, ports, port, playerForceId]);

  if (!port) return null;
  const chosen = candidates.find((c) => c.officer.id === officerId);
  const maxTroops = chosen ? chosen.city.troops : 0;

  // Auto-pick top candidate on first render
  if (candidates.length > 0 && !officerId) {
    setOfficerId(candidates[0].officer.id);
  }

  const handleSubmit = () => {
    if (!officerId || troops <= 0) return;
    onCommit(officerId, Math.min(troops, maxTroops));
  };

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <header className={styles.header}>
          <div>
            <div className={styles.titleZh}>攻港</div>
            <div className={styles.titleEn}>{t(`攻擊 ${port.name.zh}`, `Attack ${port.name.zh}`)}</div>
          </div>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </header>

        <div className={styles.meta}>
          {t('選擇出戰武將與兵力。武勇高增加港傷，統率高增加實效兵力。',
             'Pick an officer and the troops they will lead. Higher WAR boosts port damage; higher LED boosts effective strength.')}
        </div>

        <div className={styles.columns}>
          <div className={styles.column}>
            <div className={styles.columnHeader}>
              <span>{t('攻擊方 — 選擇武將', 'Attacker — pick an officer')}</span>
            </div>
            {candidates.length === 0 ? (
              <div className={styles.empty}>{t('沒有可用武將。', 'No eligible officers.')}</div>
            ) : (
              <ul className={styles.officerList}>
                {candidates.map(({ officer: o, city }) => (
                  <li key={o.id}>
                    <button
                      className={`${styles.officerButton} ${officerId === o.id ? styles.officerSelected : ''}`}
                      onClick={() => {
                        setOfficerId(o.id);
                        setTroops(Math.min(2000, city.troops));
                      }}
                    >
                      <span className={styles.officerNameZh}>{o.name.zh}</span>
                      <span className={styles.officerNameEn}>{o.name.en}</span>
                      <span className={styles.officerCha}>
                        WAR <strong>{o.stats.war}</strong>
                        {' · '}LED <strong>{o.stats.leadership}</strong>
                      </span>
                      <span className={styles.officerCity}>
                        {city.name.zh} ({city.troops.toLocaleString()}t)
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {chosen && (
          <div style={{
            margin: '0.8rem 0',
            padding: '0.5rem 0.8rem',
            background: 'rgba(40, 28, 18, 0.6)',
            border: '1px solid #5a4530',
            color: '#f0e0b0',
            fontFamily: 'Songti SC, serif',
            fontSize: '0.85rem',
          }}>
            <div style={{ marginBottom: '0.4rem' }}>
              {t('兵力', 'Troops')}: <strong>{troops.toLocaleString()}</strong> / {maxTroops.toLocaleString()}
            </div>
            <input
              type="range"
              min={500}
              max={maxTroops}
              step={500}
              value={troops}
              onChange={(e) => setTroops(parseInt(e.target.value, 10))}
              style={{ width: '100%' }}
            />
          </div>
        )}

        <footer className={styles.footer}>
          <button
            className={styles.submitButton}
            onClick={handleSubmit}
            disabled={!officerId || troops <= 0 || troops > maxTroops}
          >
            {t('出兵攻港', 'Attack Port')}
          </button>
        </footer>
      </div>
    </div>
  );
}
