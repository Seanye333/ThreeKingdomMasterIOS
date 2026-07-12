import { useMemo, useState } from 'react';
import type { Officer } from '../../game/types';
import { useGameStore } from '../../game/state/store';
import { Modal } from './Modal';
import { OfficerPortrait } from './OfficerPortrait';
import { officerGrade, officerLevel, gradeMeta } from '../../game/systems/officerGrade';
import { combatBP } from '../../game/systems/battlePower';
import { liveItemById } from '../../game/data/items';
import { SKILLS_BY_ID } from '../../game/data/skills';
import { honorificById } from '../../game/data/honorifics';
import { OATH_BONDS, isFeudKind } from '../../game/data/bonds';
import { OFFICER_RELATIONSHIPS } from '../../game/data/relationships';
import { deriveTactics, TACTIC_COMBOS } from '../../game/data/officerAttributes';
import { exportOfficerCardPNG } from './officerCardExport';
import { useT, useLanguage, pickName } from '../i18n';

/**
 * 武將卡 — the full trading-card view of an officer: full-body art under a
 * grade-tiered frame (iron → diamond), the composite battle power, the five
 * stats, skills, equipment, bonds (緣分) and tactic combos. Purely a
 * presentation layer over systems that already exist — the 1,600+ full-art
 * portraits finally get a stage.
 */

const STAT_KEYS = [
  { k: 'leadership' as const, zh: '統', en: 'LED', color: '#7ec0e0' },
  { k: 'war' as const, zh: '武', en: 'WAR', color: '#e07a5f' },
  { k: 'intelligence' as const, zh: '智', en: 'INT', color: '#b78ae0' },
  { k: 'politics' as const, zh: '政', en: 'POL', color: '#8ac88a' },
  { k: 'charisma' as const, zh: '魅', en: 'CHA', color: '#e0c068' },
];

/** Frame treatment per grade — the card's whole first impression. */
function frameStyle(grade: string): { wrap: React.CSSProperties; sheen: boolean; conic: boolean } {
  switch (grade) {
    case 'diamond':
      return { wrap: { padding: 3, borderRadius: 12 }, sheen: true, conic: true };
    case 'platinum':
      return { wrap: { padding: 3, borderRadius: 12, background: 'linear-gradient(160deg, #eaf0f4, #9fb3c0 35%, #f6fbff 55%, #8fa5b4)' }, sheen: true, conic: false };
    case 'gold':
      return { wrap: { padding: 3, borderRadius: 12, background: 'linear-gradient(160deg, #e6c473, #8a6a2a 40%, #ffe9a8 60%, #a8842e)' }, sheen: true, conic: false };
    case 'silver':
      return { wrap: { padding: 2, borderRadius: 12, background: 'linear-gradient(160deg, #cfd8e0, #6a7682 50%, #cfd8e0)' }, sheen: false, conic: false };
    case 'bronze':
      return { wrap: { padding: 2, borderRadius: 12, background: 'linear-gradient(160deg, #c8884e, #6a4426 55%, #b87a3e)' }, sheen: false, conic: false };
    default:
      return { wrap: { padding: 2, borderRadius: 12, background: '#4a545e' }, sheen: false, conic: false };
  }
}

/** The frame + face alone (no modal shell) — reused by the modal, the
 *  reveal flourish and the PNG exporter. `onJump` makes the 緣分 chips
 *  clickable — the album hops card-to-card along the bond lines. */
export function OfficerCardFace({ officer, onClose, onJump }: { officer: Officer; onClose?: () => void; onJump?: (officerId: string) => void }) {
  const t = useT();
  const lang = useLanguage();
  const year = useGameStore((s) => s.date.year);
  const forces = useGameStore((s) => s.forces);
  const officers = useGameStore((s) => s.officers);
  const [artFailed, setArtFailed] = useState(0); // 0 = try -full, 1 = try square, 2 = silhouette

  const grade = officerGrade(officer);
  const meta = gradeMeta(grade.grade);
  const level = officerLevel(officer);
  const { bp, parts } = combatBP(officer);
  const force = officer.forceId ? forces[officer.forceId] : null;
  const age = officer.birthYear > 0 ? year - officer.birthYear : null;
  const honorific = officer.honorificId ? honorificById(officer.honorificId) : null;
  const fs = frameStyle(grade.grade);

  // 緣分 — sworn oaths / kin / feuds touching this officer, present-first.
  const bonds = useMemo(() => {
    const seen = new Set<string>();
    const rows: Array<{ otherId: string; label: string; feud: boolean }> = [];
    for (const r of OFFICER_RELATIONSHIPS) {
      if (r.a !== officer.id && r.b !== officer.id) continue;
      const other = r.a === officer.id ? r.b : r.a;
      if (seen.has(other)) continue;
      seen.add(other);
      rows.push({ otherId: other, label: pickName(r.note, lang), feud: false });
    }
    for (const b of OATH_BONDS) {
      if (b.officerA !== officer.id && b.officerB !== officer.id) continue;
      const other = b.officerA === officer.id ? b.officerB : b.officerA;
      if (seen.has(other)) continue;
      seen.add(other);
      rows.push({ otherId: other, label: b.label, feud: isFeudKind(b.kind) });
    }
    return rows.slice(0, 8);
  }, [officer.id, lang]);

  // 戰法組合 — combos this officer's derived tactics can feed.
  const combos = useMemo(() => {
    const mine = new Set<string>(deriveTactics(officer.stats, officer.id));
    return TACTIC_COMBOS
      .map((c) => ({ c, have: c.tactics.filter((x) => mine.has(x)).length }))
      .filter((x) => x.have > 0)
      .sort((a, b) => b.have / b.c.tactics.length - a.have / a.c.tactics.length)
      .slice(0, 4);
  }, [officer.stats, officer.id]);

  const artBase = `${import.meta.env.BASE_URL}portraits/${officer.id}`;
  const stars = (officer as { stars?: number }).stars ?? 0;

  return (
    <>
      <style>{`
        @keyframes tkmCardSheen { 0% { transform: translateX(-130%) skewX(-18deg); } 55% { transform: translateX(230%) skewX(-18deg); } 100% { transform: translateX(230%) skewX(-18deg); } }
        @keyframes tkmCardConic { to { transform: rotate(1turn); } }
      `}</style>
      <div style={{ position: 'relative', ...fs.wrap, boxShadow: `0 8px 40px rgba(0,0,0,0.7)${grade.grade === 'diamond' ? ', 0 0 26px rgba(142,232,255,0.35)' : grade.grade === 'platinum' ? ', 0 0 18px rgba(234,240,244,0.25)' : grade.grade === 'gold' ? ', 0 0 16px rgba(230,196,115,0.3)' : ''}`, overflow: 'hidden' }}>
        {/* 鑽石 — a slowly wheeling prismatic border. */}
        {fs.conic && (
          <div aria-hidden style={{ position: 'absolute', inset: '-60%', background: 'conic-gradient(#8ee8ff, #b7a8ff, #eafcff, #7ec0e0, #d0f4ff, #8ee8ff)', animation: 'tkmCardConic 7s linear infinite' }} />
        )}
        <div style={{ position: 'relative', background: '#0c1118', borderRadius: 9, overflow: 'hidden' }}>
          {/* 立繪 — the full-body art, with the square portrait then the SVG
              silhouette as graceful fallbacks. */}
          <div style={{ position: 'relative', height: 330, background: 'radial-gradient(ellipse at 50% 22%, #24303e 0%, #0c1118 78%)' }}>
            {artFailed < 2 ? (
              <img
                src={artFailed === 0 ? `${artBase}-full.webp` : `${artBase}.webp`}
                alt=""
                onError={() => setArtFailed((v) => v + 1)}
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center' }}
              />
            ) : (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <OfficerPortrait officer={officer} size={190} forceColor={force?.color} year={year} />
              </div>
            )}
            {/* 流光 sweep for gold+ frames. */}
            {fs.sheen && (
              <div aria-hidden style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
                <div style={{ position: 'absolute', top: 0, bottom: 0, width: '38%', background: 'linear-gradient(100deg, transparent, rgba(255,255,255,0.14), transparent)', animation: 'tkmCardSheen 4.6s ease-in-out infinite' }} />
              </div>
            )}
            {/* Top chrome — grade badge · stars · BP. */}
            <div style={{ position: 'absolute', top: 8, left: 10, right: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <span style={{ background: 'rgba(10,14,20,0.82)', border: `1px solid ${meta.color}`, color: meta.color, padding: '2px 8px', borderRadius: 6, fontSize: '0.74rem', fontWeight: 700, letterSpacing: '0.06rem' }}>
                {pickName(meta.name, lang)} · {pickName(meta.rank, lang)}
              </span>
              <span style={{ textAlign: 'right', background: 'rgba(10,14,20,0.82)', border: '1px solid #3c4f5e', padding: '2px 8px', borderRadius: 6 }}
                title={t(
                  `戰力構成:五維 ${parts.stats} · 品階 ${parts.grade} · 等級 ${parts.level} · 技 ${parts.skills} · 裝 ${parts.equipment} · 望 ${parts.renown}${parts.stars ? ` · 星 ${parts.stars}` : ''}`,
                  `BP parts: stats ${parts.stats} · grade ${parts.grade} · level ${parts.level} · skills ${parts.skills} · gear ${parts.equipment} · renown ${parts.renown}${parts.stars ? ` · stars ${parts.stars}` : ''}`)}
              >
                <span style={{ display: 'block', fontSize: '0.56rem', color: '#7a8893', letterSpacing: '0.1rem' }}>{t('戰力', 'POWER')}</span>
                <span style={{ fontSize: '1.05rem', color: '#ffe9a8', fontWeight: 700, fontFamily: 'ui-monospace, monospace' }}>{bp.toLocaleString()}</span>
              </span>
            </div>
            {stars > 0 && (
              <div style={{ position: 'absolute', top: 40, left: 10, color: '#ffd66e', fontSize: '0.8rem', textShadow: '0 0 6px rgba(0,0,0,0.9)' }}>
                {'★'.repeat(stars)}{'☆'.repeat(Math.max(0, 6 - stars))}
              </div>
            )}
            {/* Name plate over a bottom fade. */}
            <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: '26px 12px 8px', background: 'linear-gradient(180deg, transparent, rgba(10,13,18,0.92) 62%)' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: '1.35rem', color: '#f2e2b8', fontWeight: 700, fontFamily: '"Ma Shan Zheng", "Songti SC", serif', textShadow: '0 1px 8px rgba(0,0,0,0.8)' }}>
                  {pickName(officer.name, lang)}
                </span>
                {officer.courtesyName && (
                  <span style={{ fontSize: '0.78rem', color: '#c0a878' }}>{t('字', 'style ')} {pickName(officer.courtesyName, lang)}</span>
                )}
                {age != null && <span style={{ fontSize: '0.72rem', color: '#7a8893' }}>{age}{t('歲', ' yrs')}</span>}
              </div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 2, flexWrap: 'wrap', fontSize: '0.72rem' }}>
                {force && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#b6c2cc' }}>
                    <span style={{ width: 9, height: 9, borderRadius: '50%', background: force.color }} />
                    {pickName(force.name, lang)}
                  </span>
                )}
                <span style={{ color: '#8ac88a' }}>Lv.{level}</span>
                {honorific && <span style={{ color: '#e0a868' }}>「{pickName(honorific.name, lang)}」</span>}
              </div>
            </div>
          </div>

          {/* Body — stats, skills, gear, bonds, combos. */}
          <div style={{ padding: '10px 12px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {STAT_KEYS.map(({ k, zh, en, color }) => (
                <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 26, fontSize: '0.68rem', color: '#7a8893' }}>{lang === 'en' ? en : zh}</span>
                  <span style={{ flex: 1, height: 7, background: '#1a222c', borderRadius: 4, overflow: 'hidden' }}>
                    <span style={{ display: 'block', height: '100%', width: `${Math.min(100, (officer.stats[k] / 150) * 100)}%`, background: `linear-gradient(90deg, ${color}88, ${color})` }} />
                  </span>
                  <span style={{ width: 28, textAlign: 'right', fontSize: '0.74rem', color: officer.stats[k] >= 90 ? '#ffe9a8' : '#b6c2cc', fontFamily: 'ui-monospace, monospace' }}>{officer.stats[k]}</span>
                </div>
              ))}
            </div>

            {officer.skills.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {officer.skills.slice(0, 8).map((sid) => {
                  const sk = SKILLS_BY_ID[sid];
                  if (!sk) return null;
                  return (
                    <span key={sid} title={lang === 'en' ? sk.description : sk.descriptionZh}
                      style={{ fontSize: '0.68rem', padding: '1px 7px', borderRadius: 9, background: 'rgba(230,196,115,0.1)', border: '1px solid #4a3f26', color: '#e6c473' }}>
                      {pickName(sk.name, lang)}
                    </span>
                  );
                })}
              </div>
            )}

            {officer.equipment.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {officer.equipment.map((id) => {
                  const it = liveItemById(id);
                  if (!it) return null;
                  return (
                    <span key={id} style={{ fontSize: '0.68rem', padding: '1px 7px', borderRadius: 9, background: 'rgba(126,192,224,0.08)', border: '1px solid #2c4454', color: '#9ed0ea' }}>
                      ⚔ {pickName(it.name, lang)}
                    </span>
                  );
                })}
              </div>
            )}

            {bonds.length > 0 && (
              <div>
                <div style={{ fontSize: '0.62rem', color: '#7a8893', letterSpacing: '0.12rem', marginBottom: 3 }}>{t('緣分', 'BONDS')}</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {bonds.map((b) => {
                    const other = officers[b.otherId];
                    const together = !!other && other.status !== 'dead' && !!officer.forceId && other.forceId === officer.forceId;
                    const jumpable = !!onJump && !!other;
                    return (
                      <span key={b.otherId}
                        onClick={jumpable ? (e) => { e.stopPropagation(); onJump(b.otherId); } : undefined}
                        title={(together ? t('同殿為臣 — 緣分生效', 'Serving together — bond active') : t('未聚 — 集齊以激活緣分', 'Apart — reunite to light this bond'))
                          + (jumpable ? t('(點擊跳至其卡)', ' (tap to jump to their card)') : '')}
                        style={{
                          fontSize: '0.68rem', padding: '1px 7px', borderRadius: 9,
                          background: b.feud ? 'rgba(184,68,46,0.12)' : together ? 'rgba(138,200,138,0.14)' : 'rgba(122,136,147,0.1)',
                          border: `1px solid ${b.feud ? '#6a3028' : together ? '#3f5c3f' : '#2b3845'}`,
                          color: b.feud ? '#e0907a' : together ? '#a8d8a8' : '#7a8893',
                          cursor: jumpable ? 'pointer' : 'default',
                        }}>
                        {b.feud ? '⚡' : together ? '❦' : '◌'} {other ? pickName(other.name, lang) : b.otherId} · {b.label}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {combos.length > 0 && (
              <div>
                <div style={{ fontSize: '0.62rem', color: '#7a8893', letterSpacing: '0.12rem', marginBottom: 3 }}>{t('可成之計', 'TACTIC COMBOS')}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {combos.map(({ c, have }) => (
                    <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem' }}>
                      <span style={{ color: have === c.tactics.length ? '#e6c473' : '#8a96a2' }}>{lang === 'en' ? c.nameEn : c.nameZh}</span>
                      <span style={{ color: have === c.tactics.length ? '#8ac88a' : '#5a6672', fontFamily: 'ui-monospace, monospace' }}>
                        {have}/{c.tactics.length} · ×{c.powerMul.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        {/* 存圖 — canvas-render the card and save it as a PNG keepsake. */}
        <button
          onClick={(e) => { e.stopPropagation(); void exportOfficerCardPNG(officer, lang); }}
          aria-label={t('存圖', 'Save as image')}
          title={t('存圖(PNG)', 'Save card as PNG')}
          style={{ position: 'absolute', top: 6, right: onClose ? 38 : 6, zIndex: 3, width: 26, height: 26, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.25)', background: 'rgba(10,14,20,0.72)', color: '#cfd8e0', cursor: 'pointer', fontSize: '0.85rem', lineHeight: 1 }}
        >⤓</button>
        {/* Close — kept inside the frame so the chromeless card stays clean. */}
        {onClose && (
          <button
            onClick={onClose}
            aria-label={t('關閉', 'Close')}
            style={{ position: 'absolute', top: 6, right: 6, zIndex: 3, width: 26, height: 26, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.25)', background: 'rgba(10,14,20,0.72)', color: '#cfd8e0', cursor: 'pointer', fontSize: '0.85rem', lineHeight: 1 }}
          >×</button>
        )}
      </div>
    </>
  );
}

export function OfficerCardModal({ officer, onClose, onJump }: { officer: Officer; onClose: () => void; onJump?: (officerId: string) => void }) {
  const t = useT();
  return (
    <Modal
      onClose={onClose}
      width="min(400px, 94vw)"
      padding="0"
      zIndex={1200}
      ariaLabel={t('武將卡', 'Officer card')}
      frameStyle={{ background: 'transparent', border: 'none', boxShadow: 'none', overflow: 'visible' }}
      hideClose
    >
      <OfficerCardFace officer={officer} onClose={onClose} onJump={onJump} />
    </Modal>
  );
}
