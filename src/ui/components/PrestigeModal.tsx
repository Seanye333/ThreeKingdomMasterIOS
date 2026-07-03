import { useMemo, type CSSProperties } from 'react';
import { useEscapeKey } from '../hooks/useEscapeKey';
import { useGameStore } from '../../game/state/store';
import { PRESTIGE_TITLES, REQ, effectivePrestige, type PrestigePath } from '../../game/data/prestige';
import { useT, useLanguage } from '../i18n';

interface Props {
  onClose: () => void;
}

const PATH_LABEL: Record<PrestigePath, { zh: string; en: string; color: string }> = {
  military:   { zh: '武', en: 'Martial',   color: '#c0504a' },
  strategist: { zh: '謀', en: 'Strategy',  color: '#5a8ac0' },
  official:   { zh: '政', en: 'Civil',     color: '#6aa84f' },
  merchant:   { zh: '商', en: 'Commerce',  color: '#e6c473' },
};

/**
 * 威名一覽 — browse every prestige title, its requirements + perks, and who
 * currently holds it across all forces. Holders use the cached deeds-aware
 * title (effectivePrestige), so earned-from-deeds rises show up here.
 */
export function PrestigeModal({ onClose }: Props) {
  useEscapeKey(onClose);
  const officers = useGameStore((s) => s.officers);
  const forces = useGameStore((s) => s.forces);
  const t = useT();
  const lang = useLanguage();

  const holdersByTitle = useMemo(() => {
    const map: Record<string, { id: string; nameZh: string; nameEn: string; color: string }[]> = {};
    for (const o of Object.values(officers)) {
      if (o.status === 'dead' || o.status === 'unsearched') continue;
      const title = effectivePrestige(o);
      if (!title) continue;
      (map[title.id] ??= []).push({
        id: o.id, nameZh: o.name.zh, nameEn: o.name.en,
        color: o.forceId ? forces[o.forceId]?.color ?? '#7a8893' : '#7a8893',
      });
    }
    return map;
  }, [officers, forces]);

  const fmtEff = (e: { duelBonus: number; combatPowerMul: number; incomeMul: number }): string => {
    const parts: string[] = [];
    if (e.duelBonus) parts.push(`${t('一騎', 'Duel')} +${e.duelBonus}`);
    if (e.combatPowerMul > 1) parts.push(`${t('戰力', 'Power')} +${Math.round((e.combatPowerMul - 1) * 100)}%`);
    if (e.incomeMul > 1) parts.push(`${t('收入', 'Income')} +${Math.round((e.incomeMul - 1) * 100)}%`);
    return parts.join(' · ') || '—';
  };

  return (
    <div style={overlay} onClick={onClose}>
      <div style={panel} onClick={(e) => e.stopPropagation()}>
        <header style={header}>
          <div>
            <div style={{ fontSize: '1.4rem', color: '#e6c473', letterSpacing: '0.07rem' }}>{t('威名一覽', 'Prestige')}</div>
            <div style={{ fontSize: '0.8rem', color: '#7a8893', fontStyle: 'italic' }}>
              {t('憑天資與功業而得的名望階層', 'Reputation ranks earned through talent and deeds')}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#e6c473', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
        </header>

        <div style={{ padding: '0.8rem 1.2rem', overflowY: 'auto', flex: 1, display: 'grid', gap: '0.6rem' }}>
          {PRESTIGE_TITLES.map((title) => {
            const path = PATH_LABEL[title.path];
            const holders = holdersByTitle[title.id] ?? [];
            return (
              <div key={title.id} style={{ background: '#10161e', border: '1px solid #2b3845', borderLeft: `3px solid ${path.color}`, padding: '0.7rem 0.9rem' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '1.05rem', color: '#e6c473' }}>{lang === 'en' ? title.name.en : title.name.zh}</span>
                  <span style={{ fontSize: '0.68rem', color: path.color, border: `1px solid ${path.color}`, padding: '0.03rem 0.3rem', borderRadius: 'var(--tkm-radius-xs)' }}>{lang === 'en' ? path.en : path.zh}</span>
                  <span style={{ fontSize: '0.74rem', color: '#7ed68a', marginLeft: 'auto' }}>{fmtEff(title.effects)}</span>
                </div>
                <div style={{ fontSize: '0.74rem', color: '#a08c6a', marginTop: '0.3rem' }}>
                  {t('條件', 'Requires')}: {lang === 'en' ? REQ[title.id]?.en : REQ[title.id]?.zh}
                </div>
                <div style={{ fontSize: '0.74rem', color: '#7a8893', marginTop: '0.3rem' }}>
                  {t('現有', 'Holders')} ({holders.length}):{' '}
                  {holders.length === 0
                    ? <span style={{ fontStyle: 'italic', color: '#6a5238' }}>{t('無', 'none')}</span>
                    : holders.slice(0, 14).map((h, i) => (
                        <span key={h.id} style={{ color: h.color }}>
                          {lang === 'en' ? h.nameEn : h.nameZh}{i < Math.min(holders.length, 14) - 1 ? '、' : ''}
                        </span>
                      ))}
                  {holders.length > 14 && <span style={{ color: '#6a5238' }}> …+{holders.length - 14}</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const overlay: CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'grid', placeItems: 'center', zIndex: 900, padding: '1rem' };
const panel: CSSProperties = { background: 'linear-gradient(160deg,#1b2531,#10161e)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 'var(--tkm-radius-lg)', width: 'min(720px,100%)', maxHeight: '88vh', display: 'flex', flexDirection: 'column', color: '#e6edf3', fontFamily: 'var(--tkm-font-body)' };
const header: CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '1rem 1.2rem', borderBottom: '1px solid #2b3845' };
