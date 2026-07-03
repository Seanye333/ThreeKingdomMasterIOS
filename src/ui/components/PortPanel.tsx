import { useState } from 'react';
import { useGameStore } from '../../game/state/store';
import type { EntityId } from '../../game/types';
import { AttackPortPicker } from './AttackPortPicker';
import { Name } from './Name';
import { canPlayerAttackPort } from '../../game/data/ports';
import { SHIP_CLASSES, SHIP_CLASSES_BY_ID, shipMeetsTier, shipBuildSeasons, SHIP_MIN_TIER, portUpgradeCost, PORT_MAX_NAVAL_TIER } from '../../game/data/ships';
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
  const upgradePort = useGameStore((s) => s.upgradePort);
  const buildShipAtPort = useGameStore((s) => s.buildShipAtPort);
  const t = useT();
  const desc = useDesc();

  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);
  const [showAttackPicker, setShowAttackPicker] = useState(false);

  if (!port) return null;
  const owner = port.ownerForceId ? forces[port.ownerForceId] : null;
  const isMine = port.ownerForceId === playerForceId;
  const linkedCity = cities[port.linkedCityId];
  const ownerColor = owner?.color ?? '#364654';
  const hpPct = Math.max(0, Math.min(1, port.hp / port.maxHp));
  const tier = port.navalTier ?? 1;
  const upgradeCost = portUpgradeCost(tier);

  const doRepair = () => {
    const r = repairPort(port.id);
    setFeedback({ ok: r.ok, text: r.message });
  };
  const doUpgrade = () => {
    const r = upgradePort(port.id);
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
          background: '#10161e',
          border: `2px solid ${ownerColor}`,
          padding: '1rem 1.2rem',
          color: '#eef4f8',
          fontFamily: 'var(--tkm-font-body)',
          minWidth: 320,
          maxWidth: 420,
          boxShadow: `0 0 16px ${ownerColor}`,
        }}
      >
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: '1.4rem', fontWeight: 'bold' }}>
              ⚓ <Name pair={port.name} />
            </div>
          </div>
          <button onClick={onClose} style={{
            background: 'transparent', border: 'none', color: '#97a4ae',
            fontSize: '1.4rem', cursor: 'pointer', padding: 0,
          }}>×</button>
        </header>

        <div style={{ marginTop: '0.7rem', display: 'grid', gridTemplateColumns: '90px 1fr', gap: '0.3rem 0.5rem', fontSize: '0.85rem' }}>
          <span style={{ color: '#7a8893' }}>{t('歸屬', 'Owner')}</span>
          <span style={{ color: ownerColor, fontWeight: 'bold' }}>
            {owner?.name.zh ?? t('無主', 'Neutral')}
            {isMine && <span style={{ color: '#7ed68a', marginLeft: 6 }}>{t('（自軍）', '(yours)')}</span>}
          </span>

          <span style={{ color: '#7a8893' }}>HP</span>
          <span>
            <div style={{ height: 8, background: '#1e2832', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 'var(--tkm-radius-lg)', position: 'relative', width: '100%' }}>
              <div style={{
                height: '100%',
                width: `${Math.round(hpPct * 100)}%`,
                background: hpPct > 0.5 ? '#7ed68a' : '#b8442e',
              }} />
            </div>
            <span style={{ fontSize: '0.72rem', color: '#97a4ae' }}>
              {port.hp.toLocaleString()} / {port.maxHp.toLocaleString()}
            </span>
          </span>

          <span style={{ color: '#7a8893' }}>{t('船塢', 'Dockyard')}</span>
          <span style={{ color: '#88b7e8', fontWeight: 'bold' }}>
            {'★'.repeat(tier)}<span style={{ color: '#3a5a7a' }}>{'★'.repeat(PORT_MAX_NAVAL_TIER - tier)}</span>
            <span style={{ color: '#7a8893', fontSize: '0.72rem', marginLeft: 6 }}>{t(`${tier} 級`, `Tier ${tier}`)}</span>
          </span>

          <span style={{ color: '#7a8893' }}>{t('關聯城', 'Linked city')}</span>
          <span>{linkedCity?.name.zh ?? '?'}</span>

          <span style={{ color: '#7a8893' }}>{t('海路', 'Sea routes')}</span>
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
            {/* 擴建船塢 — naval tier upgrade */}
            {isMine && tier < PORT_MAX_NAVAL_TIER && (
              <button
                onClick={doUpgrade}
                disabled={playerCapitalGold < upgradeCost}
                title={t('擴建船塢:解鎖更大戰船、造船更快、港防更固', 'Upgrade dockyard: unlock heavier hulls, faster builds, tougher port')}
                style={{
                  background: '#13243a', color: '#e6c473', border: '1px solid #e6c473',
                  padding: '0.3rem 0.6rem', fontSize: '0.74rem', fontFamily: 'var(--tkm-font-body)',
                  cursor: playerCapitalGold >= upgradeCost ? 'pointer' : 'not-allowed',
                  opacity: playerCapitalGold >= upgradeCost ? 1 : 0.5, marginBottom: '0.35rem',
                }}
              >{t('擴建船塢', 'Upgrade Dockyard')} → {tier + 1}{t(' 級', '')} ({upgradeCost}g)</button>
            )}
            {/* Build buttons — own port only */}
            {isMine && (
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: '0.3rem' }}>
                {SHIP_CLASSES.map((sc) => {
                  const tierOk = shipMeetsTier(sc.id, tier);
                  const canAfford = playerCapitalGold >= sc.goldCost;
                  const enabled = tierOk && canAfford;
                  const seasons = shipBuildSeasons(sc, tier);
                  return (
                    <button
                      key={sc.id}
                      onClick={() => {
                        const r = buildShipAtPort(port.id, sc.id as ShipClass);
                        setFeedback({ ok: r.ok, text: r.message });
                      }}
                      disabled={!enabled}
                      title={tierOk
                        ? `${desc(sc)}\n${t('戰力', 'Strength')} ${sc.combatStrength} · ${t('載量', 'Capacity')} ${sc.capacity} · ${seasons} ${t('季', 'seasons')}`
                        : t(`需 ${SHIP_MIN_TIER[sc.id]} 級船塢`, `Needs Tier ${SHIP_MIN_TIER[sc.id]} dockyard`)}
                      style={{
                        background: enabled ? '#1a2a3a' : '#10161e',
                        color: enabled ? '#88b7e8' : '#5a6a78',
                        border: '1px solid ' + (tierOk ? '#3a5a7a' : '#26323e'),
                        padding: '0.25rem 0.5rem',
                        fontSize: '0.72rem',
                        fontFamily: 'var(--tkm-font-body)',
                        cursor: enabled ? 'pointer' : 'not-allowed',
                        opacity: tierOk ? 1 : 0.55,
                      }}
                    >{t('造', 'Build')} {sc.name.zh}{!tierOk ? ` 🔒${SHIP_MIN_TIER[sc.id]}` : ''} ({sc.goldCost}g)</button>
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
                  color: reach.ok ? '#ff8060' : '#97a4ae',
                  border: `1px solid ${reach.ok ? '#b8442e' : '#364654'}`,
                  padding: '0.4rem 0.8rem',
                  cursor: reach.ok ? 'pointer' : 'not-allowed',
                  fontFamily: 'var(--tkm-font-body)', fontSize: '0.85rem',
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
                fontFamily: 'var(--tkm-font-body)', fontSize: '0.85rem',
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
