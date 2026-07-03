import { useMemo } from 'react';
import { useGameStore } from '../../game/state/store';
import {
  specialtyControl, specialtyRealmEffects, roleEffect, monopolyTier,
  canEmbargo, embargoedRolesAgainst, ROLE_ZH, type SpecialtyRole,
} from '../../game/data/specialties';
import { useT } from '../i18n';

const ROLES: SpecialtyRole[] = ['warhorse', 'iron', 'medicine', 'rations', 'lumber', 'coin', 'luxury'];

/**
 * 名產版圖 — the player's realm-wide grip on each strategic good: producers held
 * vs. the world, the 專營 (monopoly) tier it has reached, the realm bonus it
 * confers, and the 禁運 (embargo) lever a monopoly unlocks against rivals.
 */
export function SpecialtyDominionPanel() {
  const t = useT();
  const cities = useGameStore((s) => s.cities);
  const forces = useGameStore((s) => s.forces);
  const playerForceId = useGameStore((s) => s.playerForceId);
  const embargoes = useGameStore((s) => s.embargoes);
  const setEmbargo = useGameStore((s) => s.setEmbargo);

  const ctrl = useMemo(
    () => specialtyControl(cities, playerForceId, embargoedRolesAgainst(playerForceId ?? '', embargoes)),
    [cities, playerForceId, embargoes],
  );
  const realm = useMemo(() => specialtyRealmEffects(ctrl), [ctrl]);
  if (!playerForceId) return null;

  // Roles the player actually holds (any producers), richest grip first.
  const held = ROLES.filter((r) => ctrl.owned[r] > 0).sort((a, b) => roleEffect(ctrl, b) - roleEffect(ctrl, a));
  // Rival forces with at least one city (potential embargo targets).
  const rivals = Object.values(forces).filter((f) => f.id !== playerForceId
    && Object.values(cities).some((c) => c.ownerForceId === f.id && !c.ruined));

  const pct = (n: number) => `${Math.round(n * 100)}%`;
  const effectText = (r: SpecialtyRole): string => {
    switch (r) {
      case 'warhorse': return t('馬政:產戰馬', 'breeds warhorses');
      case 'iron': return t('冶鐵:鍛造之資', 'feeds the forge');
      case 'medicine': return t(`傷癒 ×${realm.woundRecoveryMul.toFixed(2)}、抗疫 ${pct(realm.plagueResist)}`, `heal ×${realm.woundRecoveryMul.toFixed(2)}, plague −${pct(realm.plagueResist)}`);
      case 'rations': return t(`兵糧 ×${realm.foodUpkeepMul.toFixed(2)}`, `upkeep ×${realm.foodUpkeepMul.toFixed(2)}`);
      case 'lumber': return t(`造船 ×${realm.shipBuildMul.toFixed(2)}`, `ships ×${realm.shipBuildMul.toFixed(2)}`);
      case 'coin': return t(`通脹 −${realm.inflationRelief.toFixed(1)}/季、鑄錢 ×${realm.mintMul.toFixed(2)}`, `inflation −${realm.inflationRelief.toFixed(1)}/q, mint ×${realm.mintMul.toFixed(2)}`);
      case 'luxury': return t(`進貢 ×${realm.tributeMul.toFixed(2)}、天命 +${(realm.courtPrestige * 0.2).toFixed(1)}/季`, `tribute ×${realm.tributeMul.toFixed(2)}, mandate +${(realm.courtPrestige * 0.2).toFixed(1)}/q`);
    }
  };
  const tierBadge = (share: number) => {
    const tier = monopolyTier(share);
    if (tier === 2) return <span style={{ color: '#e0707a', fontWeight: 700 }}> {t('壟斷', 'Monopoly')}</span>;
    if (tier === 1) return <span style={{ color: '#e0a070', fontWeight: 700 }}> {t('專營', 'Dominant')}</span>;
    return null;
  };

  return (
    <div style={{ background: '#10171f', border: '1px solid #1e2a34', borderRadius: 'var(--tkm-radius-sm)', padding: '0.5rem 0.6rem', marginBottom: '0.6rem' }}>
      <div style={{ color: '#9fb0bc', fontSize: '0.74rem', marginBottom: 4 }}>{t('名產版圖', 'Specialty Dominion')}</div>
      {held.length === 0 && <div style={{ color: '#5f6c76', fontSize: '0.72rem' }}>{t('未握任何名產之地。', 'You hold no specialty cities.')}</div>}
      {held.map((r) => (
        <div key={r} style={{ display: 'flex', alignItems: 'baseline', gap: 6, fontSize: '0.74rem', padding: '1px 0' }}>
          <span style={{ color: '#e0c070', minWidth: '2.6rem' }}>{ROLE_ZH[r]}</span>
          <span style={{ fontFamily: 'ui-monospace, monospace', color: '#aab6c0' }}>
            {ctrl.owned[r]}/{Math.round(ctrl.owned[r] / Math.max(0.0001, ctrl.share[r]))} · {pct(ctrl.share[r])}
          </span>
          {tierBadge(ctrl.share[r])}
          <span style={{ color: '#7a8893', fontSize: '0.68rem', flex: 1, textAlign: 'right' }}>{effectText(r)}</span>
        </div>
      ))}

      {/* 禁運 — a monopoly lets you cut a rival off a good. */}
      {held.some((r) => canEmbargo(ctrl, r)) && rivals.length > 0 && (
        <div style={{ marginTop: 6, borderTop: '1px dotted #243240', paddingTop: 5 }}>
          <div style={{ color: '#9fb0bc', fontSize: '0.7rem', marginBottom: 3 }}>{t('禁運 — 挾專營以斷敵', 'Embargo — cut a rival off a monopolized good')}</div>
          {held.filter((r) => canEmbargo(ctrl, r)).map((r) => (
            <div key={r} style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap', padding: '2px 0' }}>
              <span style={{ color: '#e0c070', fontSize: '0.72rem', minWidth: '2.6rem' }}>{ROLE_ZH[r]}</span>
              {rivals.map((f) => {
                const on = (embargoes ?? []).some((e) => e.by === playerForceId && e.against === f.id && e.role === r);
                return (
                  <button
                    key={f.id}
                    onClick={() => { const res = setEmbargo(f.id, r, !on); if (!res.ok) alert(res.message); }}
                    style={{
                      background: on ? 'rgba(224,112,122,0.18)' : 'transparent',
                      border: `1px solid ${on ? '#e0707a' : '#2b3845'}`,
                      color: on ? '#f0a0a8' : '#7a8893',
                      padding: '0.1rem 0.4rem', borderRadius: 'var(--tkm-radius-sm)', cursor: 'pointer',
                      fontFamily: 'inherit', fontSize: '0.68rem',
                    }}
                    title={on ? t('點擊解禁', 'Click to lift') : t('點擊禁運', 'Click to embargo')}
                  >
                    {on ? '✕ ' : ''}{f.name.zh}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
