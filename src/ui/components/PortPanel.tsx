import { useState } from 'react';
import { useGameStore } from '../../game/state/store';
import type { EntityId } from '../../game/types';
import { AttackPortPicker } from './AttackPortPicker';
import { canPlayerAttackPort } from '../../game/data/ports';
import { SHIP_CLASSES, SHIP_CLASSES_BY_ID } from '../../game/data/ships';
import type { ShipClass } from '../../game/types';
import { useT, useDesc } from '../i18n';

interface Props {
  portId: EntityId;
  onClose: () => void;
}

export function PortPanel({ portId, onClose }: Props) {
  const port = useGameStore((s) => s.ports[portId]);
  const forces = useGameStore((s) => s.forces);
  const cities = useGameStore((s) => s.cities);
  const ports = useGameStore((s) => s.ports);
  const playerForceId = useGameStore((s) => s.playerForceId);
  const playerCapitalGold = useGameStore((s) => {
    const f = playerForceId ? s.forces[playerForceId] : null;
    const c = f ? s.cities[f.capitalCityId] : null;
    return c?.gold ?? 0;
  });
  const attackPort = useGameStore((s) => s.attackPort);
  const repairPort = useGameStore((s) => s.repairPort);
  const buildShipAtPort = useGameStore((s) => s.buildShipAtPort);
  const t = useT();
  const desc = useDesc();

  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);
  const [showAttackPicker, setShowAttackPicker] = useState(false);

  if (!port) return null;
  const owner = port.ownerForceId ? forces[port.ownerForceId] : null;
  const isMine = port.ownerForceId === playerForceId;
  const linkedCity = cities[port.linkedCityId];
  const ownerColor = owner?.color ?? '#5a4530';
  const hpPct = Math.max(0, Math.min(1, port.hp / port.maxHp));

  const doRepair = () => {
    const r = repairPort(port.id);
    setFeedback({ ok: r.ok, text: r.message });
  };
  const doAttackCommit = (officerId: EntityId, troops: number) => {
    const r = attackPort(port.id, officerId, troops);
    setShowAttackPicker(false);
    setFeedback({ ok: r.ok, text: r.message });
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.55)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 200,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#1a1410',
          border: `2px solid ${ownerColor}`,
          padding: '1rem 1.2rem',
          color: '#f0e0b0',
          fontFamily: 'Songti SC, serif',
          minWidth: 320,
          maxWidth: 420,
          boxShadow: `0 0 16px ${ownerColor}`,
        }}
      >
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: '1.4rem', fontWeight: 'bold' }}>
              ⚓ {port.name.zh}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#a89070' }}>{port.name.en}</div>
          </div>
          <button onClick={onClose} style={{
            background: 'transparent', border: 'none', color: '#a89070',
            fontSize: '1.4rem', cursor: 'pointer', padding: 0,
          }}>×</button>
        </header>

        <div style={{ marginTop: '0.7rem', display: 'grid', gridTemplateColumns: '90px 1fr', gap: '0.3rem 0.5rem', fontSize: '0.85rem' }}>
          <span style={{ color: '#8a7050' }}>{t('歸屬', 'Owner')}</span>
          <span style={{ color: ownerColor, fontWeight: 'bold' }}>
            {owner?.name.zh ?? t('無主', 'Neutral')}
            {isMine && <span style={{ color: '#7ed68a', marginLeft: 6 }}>{t('（自軍）', '(yours)')}</span>}
          </span>

          <span style={{ color: '#8a7050' }}>HP</span>
          <span>
            <div style={{ height: 8, background: '#3a2818', border: '1px solid #5a4530', position: 'relative', width: '100%' }}>
              <div style={{
                height: '100%',
                width: `${Math.round(hpPct * 100)}%`,
                background: hpPct > 0.5 ? '#7ed68a' : '#b8442e',
              }} />
            </div>
            <span style={{ fontSize: '0.72rem', color: '#a89070' }}>
              {port.hp.toLocaleString()} / {port.maxHp.toLocaleString()}
            </span>
          </span>

          <span style={{ color: '#8a7050' }}>{t('關聯城', 'Linked city')}</span>
          <span>{linkedCity?.name.zh ?? '?'}</span>

          <span style={{ color: '#8a7050' }}>{t('海路', 'Sea routes')}</span>
          <span style={{ fontSize: '0.78rem' }}>
            {port.connectedPortIds.map((id) => ports[id]?.name.zh ?? id).join(' · ')}
          </span>
        </div>

        {/* Shipyard section — visible whenever we know the docked ships */}
        {(isMine || (port.dockedShips && Object.keys(port.dockedShips).length > 0)) && (
          <div style={{
            marginTop: '0.7rem',
            padding: '0.5rem 0.7rem',
            background: 'rgba(20, 36, 52, 0.45)',
            border: '1px solid #3a5a7a',
            fontSize: '0.82rem',
          }}>
            <div style={{
              color: '#88b7e8', fontWeight: 'bold', marginBottom: '0.35rem',
              fontSize: '0.78rem', letterSpacing: '0.1rem',
            }}>{t('船廠', 'SHIPYARD')}</div>
            {/* Docked ships */}
            <div style={{ marginBottom: '0.3rem', color: '#a8c4e0' }}>
              {SHIP_CLASSES.map((sc) => {
                const n = port.dockedShips?.[sc.id] ?? 0;
                if (n === 0) return null;
                return (
                  <span key={sc.id} style={{ marginRight: '0.8rem' }}>
                    {sc.name.zh} <strong>×{n}</strong>
                  </span>
                );
              })}
              {(!port.dockedShips || Object.values(port.dockedShips).every((c) => !c))
                && <span style={{ color: '#5a7a8a' }}>{t('港內無船', 'No ships docked.')}</span>}
            </div>
            {/* Pending builds */}
            {port.buildQueue && port.buildQueue.length > 0 && (
              <div style={{ color: '#c8a878', marginBottom: '0.3rem', fontSize: '0.76rem' }}>
                {t('建造中：', 'Building:')} {port.buildQueue.map((b, i) =>
                  `${SHIP_CLASSES_BY_ID[b.shipClass].name.zh} (${b.seasonsLeft}s)`
                  + (i < port.buildQueue!.length - 1 ? ', ' : '')
                ).join('')}
              </div>
            )}
            {/* Build buttons — own port only */}
            {isMine && (
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: '0.3rem' }}>
                {SHIP_CLASSES.map((sc) => {
                  const canAfford = playerCapitalGold >= sc.goldCost;
                  return (
                    <button
                      key={sc.id}
                      onClick={() => {
                        const r = buildShipAtPort(port.id, sc.id as ShipClass);
                        setFeedback({ ok: r.ok, text: r.message });
                      }}
                      disabled={!canAfford}
                      title={`${desc(sc)}\n${t('戰力', 'Strength')} ${sc.combatStrength} · ${t('載量', 'Capacity')} ${sc.capacity} · ${sc.seasonsToBuild} ${t('季', 'seasons')}`}
                      style={{
                        background: canAfford ? '#1a2a3a' : '#1a1410',
                        color: canAfford ? '#88b7e8' : '#5a6a78',
                        border: '1px solid #3a5a7a',
                        padding: '0.25rem 0.5rem',
                        fontSize: '0.72rem',
                        fontFamily: 'Songti SC, serif',
                        cursor: canAfford ? 'pointer' : 'not-allowed',
                      }}
                    >{t('造', 'Build')} {sc.name.zh} ({sc.goldCost}g)</button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        <div style={{ marginTop: '0.9rem', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {!isMine && (() => {
            const reach = playerForceId
              ? canPlayerAttackPort(port, cities, ports, playerForceId)
              : { ok: false, reason: 'No player force.' };
            return (
              <button
                onClick={() => reach.ok && setShowAttackPicker(true)}
                disabled={!reach.ok}
                style={{
                  background: '#3a1a1a',
                  color: reach.ok ? '#ff8060' : '#a89070',
                  border: `1px solid ${reach.ok ? '#b8442e' : '#5a4530'}`,
                  padding: '0.4rem 0.8rem',
                  cursor: reach.ok ? 'pointer' : 'not-allowed',
                  fontFamily: 'Songti SC, serif', fontSize: '0.85rem',
                  opacity: reach.ok ? 1 : 0.5,
                }}
                title={reach.ok
                  ? `Attack ${reach.via === 'sea' ? 'by sea' : 'overland'} — pick officer + troops.`
                  : reach.reason ?? 'Cannot reach.'}
              >{t('攻擊', 'Attack')}{reach.via === 'sea' ? ' 🚢' : ''}…</button>
            );
          })()}
          {isMine && (
            <button
              onClick={doRepair}
              disabled={port.hp >= port.maxHp || playerCapitalGold < 200}
              style={{
                background: '#1a3a1a', color: '#7ed68a',
                border: '1px solid #5a7a3a',
                padding: '0.4rem 0.8rem', cursor: 'pointer',
                fontFamily: 'Songti SC, serif', fontSize: '0.85rem',
                opacity: port.hp >= port.maxHp || playerCapitalGold < 200 ? 0.4 : 1,
              }}
            >{t('修繕', 'Repair')} (+400 HP, −200g)</button>
          )}
        </div>

        {feedback && (
          <div style={{
            marginTop: '0.7rem',
            padding: '0.4rem 0.6rem',
            background: feedback.ok ? 'rgba(30, 60, 30, 0.4)' : 'rgba(60, 30, 30, 0.4)',
            border: `1px solid ${feedback.ok ? '#7ed68a' : '#b8442e'}`,
            color: feedback.ok ? '#7ed68a' : '#ff8060',
            fontSize: '0.82rem',
          }}>{feedback.text}</div>
        )}
      </div>
      {showAttackPicker && (
        <AttackPortPicker
          portId={port.id}
          onClose={() => setShowAttackPicker(false)}
          onCommit={doAttackCommit}
        />
      )}
    </div>
  );
}
