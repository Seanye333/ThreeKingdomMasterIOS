import { useMemo, useState } from 'react';
import type { Officer } from '../../game/types';
import { useGameStore } from '../../game/state/store';
import { Modal } from './Modal';
import { OfficerPortrait } from './OfficerPortrait';
import { officerGrade, officerLevel, gradeMeta } from '../../game/systems/officerGrade';
import { combatBP, cardCondition } from '../../game/systems/battlePower';
import { liveItemById } from '../../game/data/items';
import { SKILLS_BY_ID } from '../../game/data/skills';
import { honorificById } from '../../game/data/honorifics';
import { OATH_BONDS, isFeudKind } from '../../game/data/bonds';
import { OFFICER_RELATIONSHIPS } from '../../game/data/relationships';
import { deriveTactics, TACTIC_COMBOS } from '../../game/data/officerAttributes';
import { isSignaturePair, signatureItemsOf } from '../../game/data/signatureItems';
import { skillLevelBadge } from '../../game/systems/skillMastery';
import { TRAIT_DEFS_BY_ID } from '../../game/data/personality';
import { peerageById } from '../../game/data/peerage';
import { MILITARY_RANKS_BY_ID } from '../../game/data/titles';
import { OFFICER_DUEL_LINES } from '../../game/data/officerLines';
import { CARD_INDEX, CARD_TOTAL } from '../../game/data/cardIndex';
import { MEDALS_BY_ID } from '../../game/data/medals';
import { MedalBadge } from './MedalBadge';
import { loadFrameSkin } from './cardFrames';
import { unlockedAltArts } from './altArts';
import { cardFaceMood } from './cardFaceMood';
import { foilMeta } from '../../game/systems/cardFoil';
import { RelationWebModal } from './RelationWebModal';
import { headToHead } from '../../game/systems/rivalries';
import { getBiography } from '../../game/data';
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
  const season = useGameStore((s) => s.date.season);
  const forces = useGameStore((s) => s.forces);
  const officers = useGameStore((s) => s.officers);
  const deeds = useGameStore((s) => s.deeds[officer.id]);
  const duelHall = useGameStore((s) => s.duelHall);
  const rivalries = useGameStore((s) => s.rivalries);
  const [artFailed, setArtFailed] = useState(0); // 0 = try -full, 1 = try square, 2 = silhouette
  // 三面卡 — ⟲ cycles 正面(0) → 戰績面(1) → 列傳面(2). Content swaps inside
  // the same frame (no nested 3D flip — the reveal modal already spins).
  const [face, setFace] = useState<0 | 1 | 2>(0);
  const showBack = face !== 0;
  // 傾斜視差 + 閃卡 — pointer position drives a gentle 3D tilt, and (gold and
  // above) a holographic foil glare that follows the hand. Hover devices only.
  const [tilt, setTilt] = useState<{ rx: number; ry: number; gx: number; gy: number } | null>(null);
  const canHover = typeof window !== 'undefined' && !!window.matchMedia?.('(hover: hover)').matches;

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
  const stars = officer.stars ?? 0;
  const frameSkin = loadFrameSkin();
  // 名場面異畫(B1) — unlocked alternate faces; index 0 = the base art.
  const unlockedAlts = useMemo(() => unlockedAltArts(officer.id), [officer.id]);
  const [altIdx, setAltIdx] = useState(0);
  const altArt = altIdx > 0 ? (unlockedAlts[altIdx - 1] ?? null) : null;
  // 動態卡面(B6) — a mood layer read off the officer's present state + season.
  const mood = cardFaceMood(officer, season);
  // 開包閃度(B3) — the card's foil sheen, if it ever rolled one.
  const fm = foilMeta(officer.foil);
  const inscriptions = useGameStore((s) => s.itemInscriptions);
  // 鈐印題跋(B5) — the collector's seal (player's force) + a written colophon.
  const playerForceId = useGameStore((s) => s.playerForceId);
  const colophon = useGameStore((s) => s.officerColophons?.[officer.id]);
  const inscribeOfficer = useGameStore((s) => s.inscribeOfficer);
  const [editingColophon, setEditingColophon] = useState(false);
  const [colophonDraft, setColophonDraft] = useState('');
  // 群英譜(B2) — the relationship-web overlay, opened from the BONDS heading.
  const [showWeb, setShowWeb] = useState(false);
  const playerForce = playerForceId ? forces[playerForceId] : null;
  const collectorSeal = playerForce && officer.forceId === playerForceId ? playerForce.name.zh.slice(0, 2) : null;
  // 批A — the card's paper trail: 官爵 / 性格 / 本命指引 / 武評印 / 圖鑑編號 / 語錄.
  const boardRank = useGameStore((s) => s.powerBoardPrev?.[officer.id]);
  const peer = peerageById(officer.peerageId);
  const rankDef = MILITARY_RANKS_BY_ID[officer.rank];
  const traits = (officer.traits ?? [])
    .map((tid) => TRAIT_DEFS_BY_ID[tid])
    .filter((tr): tr is NonNullable<typeof tr> => !!tr)
    .slice(0, 3);
  const missingSignatures = signatureItemsOf(officer.id)
    .filter((id) => !officer.equipment.includes(id))
    .map((id) => liveItemById(id))
    .filter((it): it is NonNullable<typeof it> => !!it)
    .slice(0, 2);
  const cardNo = CARD_INDEX[officer.id];
  const flavor = OFFICER_DUEL_LINES[officer.id]?.taunt[0];
  const CN_NUM = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
  const sealText = boardRank !== undefined && boardRank <= 50
    ? (boardRank <= 10 ? `天下第${CN_NUM[boardRank - 1]}` : `武評第${boardRank}`)
    : null;

  return (
    <>
      <style>{`
        @keyframes tkmCardSheen { 0% { transform: translateX(-130%) skewX(-18deg); } 55% { transform: translateX(230%) skewX(-18deg); } 100% { transform: translateX(230%) skewX(-18deg); } }
        @keyframes tkmCardConic { to { transform: rotate(1turn); } }
        @keyframes tkmStarTwinkle { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.55; transform: scale(0.88); } }
      `}</style>
      <div
        onMouseMove={canHover ? (e) => {
          const r = e.currentTarget.getBoundingClientRect();
          const px = (e.clientX - r.left) / r.width;
          const py = (e.clientY - r.top) / r.height;
          setTilt({ rx: (0.5 - py) * 9, ry: (px - 0.5) * 11, gx: px * 100, gy: py * 100 });
        } : undefined}
        onMouseLeave={canHover ? () => setTilt(null) : undefined}
        style={{
          position: 'relative', ...fs.wrap,
          boxShadow: `0 8px 40px rgba(0,0,0,0.7)${stars >= 6 ? ', 0 0 30px rgba(255,214,110,0.4)' : grade.grade === 'diamond' ? ', 0 0 26px rgba(142,232,255,0.35)' : grade.grade === 'platinum' ? ', 0 0 18px rgba(234,240,244,0.25)' : grade.grade === 'gold' ? ', 0 0 16px rgba(230,196,115,0.3)' : ''}`,
          overflow: 'hidden',
          transform: tilt ? `perspective(900px) rotateX(${tilt.rx.toFixed(2)}deg) rotateY(${tilt.ry.toFixed(2)}deg)` : undefined,
          transition: tilt ? 'transform 0.06s linear' : 'transform 0.3s ease',
          willChange: canHover ? 'transform' : undefined,
        }}>
        {/* 鑽石 — a slowly wheeling prismatic border. */}
        {fs.conic && (
          <div aria-hidden style={{ position: 'absolute', inset: '-60%', background: 'conic-gradient(#8ee8ff, #b7a8ff, #eafcff, #7ec0e0, #d0f4ff, #8ee8ff)', animation: 'tkmCardConic 7s linear infinite' }} />
        )}
        <div style={{ position: 'relative', background: '#0c1118', borderRadius: 9, overflow: 'hidden' }}>
          {face === 2 ? (
            /* ── 列傳面 — the chronicle: biography + era + famous quote ── */
            (() => {
              const bio = getBiography(officer.id, officer.name.en, officer.name.zh, officer.stats);
              return (
                <div style={{ padding: '14px 14px 16px', display: 'flex', flexDirection: 'column', gap: 10, minHeight: 460 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderBottom: `1px solid ${meta.color}44`, paddingBottom: 6 }}>
                    <span style={{ fontSize: '1.1rem', color: '#f2e2b8', fontFamily: '"Ma Shan Zheng", "Songti SC", serif' }}>{pickName(officer.name, lang)}</span>
                    <span style={{ fontSize: '0.66rem', color: meta.color, letterSpacing: '0.2rem' }}>{t('列　傳', 'BIOGRAPHY')}</span>
                  </div>
                  {bio.era && (
                    <span style={{ alignSelf: 'flex-start', fontSize: '0.68rem', padding: '1px 8px', borderRadius: 9, border: '1px solid #4a3f26', background: 'rgba(230,196,115,0.08)', color: '#d8b060' }}>
                      {lang === 'en' ? bio.era.en : bio.era.zh}
                    </span>
                  )}
                  <div style={{ fontSize: '0.8rem', lineHeight: 1.9, color: '#c0ccd6', overflowY: 'auto', maxHeight: 340, paddingRight: 4 }}>
                    {lang === 'en' ? bio.en : bio.zh}
                  </div>
                  {bio.quote && (
                    <div style={{ borderLeft: `2px solid ${meta.color}66`, paddingLeft: 10, fontSize: '0.78rem', fontStyle: 'italic', color: '#e0c98a' }}>
                      「{lang === 'en' ? bio.quote.en : bio.quote.zh}」
                    </div>
                  )}
                  <div style={{ marginTop: 'auto', textAlign: 'center', fontSize: '0.64rem', color: '#5a6672' }}>
                    {t('⟲ 返回卡面', '⟲ back to the card face')}
                  </div>
                </div>
              );
            })()
          ) : showBack ? (
            /* ── 戰績面 — the card's back: career deeds + famous bouts ── */
            <div style={{ padding: '14px 14px 16px', display: 'flex', flexDirection: 'column', gap: 10, minHeight: 460 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderBottom: `1px solid ${meta.color}44`, paddingBottom: 6 }}>
                <span style={{ fontSize: '1.1rem', color: '#f2e2b8', fontFamily: '"Ma Shan Zheng", "Songti SC", serif' }}>{pickName(officer.name, lang)}</span>
                <span style={{ fontSize: '0.66rem', color: meta.color, letterSpacing: '0.2rem' }}>{t('生涯戰績', 'CAREER RECORD')}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                {([
                  { zh: '斬敵', en: 'Troops slain', v: (deeds?.killsTroops ?? 0).toLocaleString() },
                  { zh: '會戰勝/敗', en: 'Battles W/L', v: `${deeds?.battlesWon ?? 0}/${deeds?.battlesLost ?? 0}` },
                  { zh: '單挑勝', en: 'Duels won', v: deeds?.duelsWon ?? 0 },
                  { zh: '舌戰勝', en: 'Debates won', v: deeds?.debatesWon ?? 0 },
                  { zh: '罵倒', en: 'Debate routs', v: deeds?.debateRouts ?? 0 },
                  { zh: '擒將', en: 'Captured', v: deeds?.captured ?? 0 },
                  { zh: '拔城', en: 'Cities taken', v: deeds?.citiesTaken ?? 0 },
                  { zh: '用間', en: 'Espionage', v: deeds?.espionageSuccess ?? 0 },
                  { zh: '內政', en: 'Civic works', v: deeds?.civicWorks ?? 0 },
                  { zh: '特訓', en: 'Trainings', v: deeds?.trainingsCompleted ?? 0 },
                ] as Array<{ zh: string; en: string; v: number | string }>).map((r) => (
                  <div key={r.zh} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 8px', background: '#131a23', border: '1px solid #232d38', borderRadius: 5, fontSize: '0.72rem' }}>
                    <span style={{ color: '#7a8893' }}>{lang === 'en' ? r.en : r.zh}</span>
                    <span style={{ color: '#e6c473', fontFamily: 'ui-monospace, monospace' }}>{r.v}</span>
                  </div>
                ))}
              </div>
              {/* 勳章牆 — struck SVG medals, each minted a permanent +1. */}
              {(officer.medals?.length ?? 0) > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'flex-start' }}>
                  {officer.medals!.map((mid) => {
                    const m = MEDALS_BY_ID[mid];
                    return m ? <MedalBadge key={mid} medal={m} /> : null;
                  })}
                </div>
              )}
              {(deeds?.titles?.length ?? 0) > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {deeds!.titles!.map((ti) => (
                    <span key={ti} style={{ fontSize: '0.68rem', padding: '1px 7px', borderRadius: 9, background: 'rgba(230,196,115,0.12)', border: '1px solid #4a3f26', color: '#ffe9a8' }}>{ti}</span>
                  ))}
                </div>
              )}
              {/* 宿敵 — the standing feuds off the 恩怨簿, tallied head-to-head. */}
              {(() => {
                const recs = Object.values(rivalries ?? {})
                  .filter((r) => r.aId === officer.id || r.bId === officer.id)
                  .sort((a, b) => b.bouts - a.bouts)
                  .slice(0, 2);
                if (recs.length === 0) return null;
                return (
                  <div>
                    <div style={{ fontSize: '0.62rem', color: '#7a8893', letterSpacing: '0.12rem', marginBottom: 3 }}>{t('宿　敵', 'RIVALS')}</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      {recs.map((rec) => {
                        const otherId = rec.aId === officer.id ? rec.bId : rec.aId;
                        const other = officers[otherId];
                        const h = headToHead(rec, officer.id);
                        const blood = rec.killerId === officer.id;
                        const slain = rec.victimId === officer.id;
                        return (
                          <div key={otherId} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem' }}>
                            <span style={{ color: '#e0907a' }}>⚡ {other ? pickName(other.name, lang) : otherId}</span>
                            <span style={{ color: blood ? '#8ac88a' : slain ? '#e0705a' : '#9aa6b0', fontFamily: 'ui-monospace, monospace' }}>
                              {h.mine}–{h.theirs}{h.draws ? t(`·平${h.draws}`, ` · ${h.draws}d`) : ''}{blood ? t('・手刃', ' · slew') : slain ? t('・殞其手', ' · fell') : ''}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
              {(() => {
                const bouts = duelHall.filter((r) => r.aId === officer.id || r.dId === officer.id).slice(0, 4);
                if (bouts.length === 0) return null;
                return (
                  <div>
                    <div style={{ fontSize: '0.62rem', color: '#7a8893', letterSpacing: '0.12rem', marginBottom: 3 }}>{t('名局', 'FAMOUS BOUTS')}</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      {bouts.map((b) => {
                        const otherId = b.aId === officer.id ? b.dId : b.aId;
                        const other = officers[otherId];
                        const won = b.kind === 'duel'
                          ? (b.winner === 'attacker' ? b.aId === officer.id : b.winner === 'defender' ? b.dId === officer.id : false)
                          : b.kind === 'melee'
                            ? (b.winner === 'a' ? b.aId === officer.id : b.winner === 'b' ? b.dId === officer.id : false)
                            : (b.winner === 'a' ? b.aId === officer.id : b.winner === 'd' ? b.dId === officer.id : false);
                        const drew = b.winner === 'draw';
                        const finish = b.kind === 'duel' ? (b.killed ? t('・斬', ' · slew') : '')
                          : b.kind === 'melee' ? (b.fighters.some((f) => f.fate === 'slain') ? t('・團戰斬將', ' · melee kill') : t('・團戰', ' · melee'))
                          : (b.routed ? t('・罵倒', ' · routed') : '');
                        return (
                          <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem' }}>
                            <span style={{ color: '#9aa6b0' }}>
                              {b.kind === 'duel' ? '⚔' : b.kind === 'melee' ? '🔥' : '💬'} vs {other ? pickName(other.name, lang) : otherId}
                            </span>
                            <span style={{ color: drew ? '#7a8893' : won ? '#8ac88a' : '#e0907a', fontFamily: 'ui-monospace, monospace' }}>
                              {b.year}{t('年', '')} {drew ? t('平', 'draw') : won ? t('勝', 'won') : t('負', 'lost')}{won ? finish : ''}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
              <div style={{ marginTop: 'auto', textAlign: 'center', fontSize: '0.64rem', color: '#5a6672' }}>
                {t('⟲ 列傳面', '⟲ biography')}
              </div>
            </div>
          ) : (
          <>
          {/* 立繪 — the full-body art, with the square portrait then the SVG
              silhouette as graceful fallbacks. */}
          <div style={{ position: 'relative', height: 330, background: altArt ? altArt.bg : 'radial-gradient(ellipse at 50% 22%, #24303e 0%, #0c1118 78%)' }}>
            {artFailed < 2 ? (
              <img
                src={artFailed === 0 ? `${artBase}-full.webp` : `${artBase}.webp`}
                alt=""
                onError={() => setArtFailed((v) => v + 1)}
                style={{
                  position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center',
                  // 追憶 — the departed render in faded sepia, an heirloom print.
                  filter: officer.status === 'dead' ? 'sepia(0.55) brightness(0.88) contrast(0.95)' : undefined,
                }}
              />
            ) : (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', filter: officer.status === 'dead' ? 'sepia(0.55) brightness(0.88)' : undefined }}>
                <OfficerPortrait officer={officer} size={190} forceColor={force?.color} year={year} />
              </div>
            )}
            {/* 陣營水印 — the banner they march under, ghosted over the art. */}
            {force && (
              <div aria-hidden style={{
                position: 'absolute', left: 8, top: '38%', pointerEvents: 'none',
                writingMode: 'vertical-rl', fontSize: '2.6rem', lineHeight: 1,
                color: force.color, opacity: 0.14, fontFamily: '"Ma Shan Zheng", "Songti SC", serif',
                textShadow: '0 0 2px rgba(0,0,0,0.4)', letterSpacing: '0.2rem',
              }}>
                {force.name.zh.slice(0, 2)}
              </div>
            )}
            {/* 動態卡面(B6) — a translucent mood layer over the art. */}
            {mood && (
              <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: mood.overlay }} />
            )}
            {/* 開包閃度(B3) — a foil sheen sweeps a shiny card. */}
            {fm && (
              <div aria-hidden style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', mixBlendMode: 'screen' }}>
                <div style={{ position: 'absolute', top: '-30%', bottom: '-30%', width: '55%', opacity: 0.5,
                  background: `linear-gradient(115deg, transparent, ${fm.colors.join(', ')}, transparent)`,
                  animation: 'tkmCardSheen 3.4s ease-in-out infinite' }} />
              </div>
            )}
            {/* 名場面異畫(B1) — epithet banner + corner emblem when a face is on. */}
            {altArt && (
              <>
                <div aria-hidden style={{ position: 'absolute', top: 42, right: 10, writingMode: 'vertical-rl', fontSize: '3rem', lineHeight: 1, color: altArt.accent, opacity: 0.22, fontFamily: '"Ma Shan Zheng", "Songti SC", serif', pointerEvents: 'none' }}>
                  {altArt.glyph}
                </div>
                <div style={{ position: 'absolute', left: 0, right: 0, top: 44, textAlign: 'center', pointerEvents: 'none' }}>
                  <span style={{ fontSize: '0.94rem', color: altArt.accent, fontFamily: '"Ma Shan Zheng", "Songti SC", serif', letterSpacing: '0.24rem', textShadow: '0 1px 6px rgba(0,0,0,0.85)' }}>
                    {lang === 'en' ? altArt.en : altArt.zh}
                  </span>
                </div>
              </>
            )}
            {/* 鑑藏印(B5) — a vermilion collector's seal: this card is in my hand. */}
            {collectorSeal && (
              <div aria-hidden title="鑑藏印"
                style={{ position: 'absolute', right: 10, bottom: 92, width: 30, height: 44, border: '2px solid #b83a2e', borderRadius: 3, color: '#e0574a', display: 'flex', alignItems: 'center', justifyContent: 'center', writingMode: 'vertical-rl', fontSize: '0.72rem', letterSpacing: '0.05rem', fontFamily: '"Ma Shan Zheng", "Songti SC", serif', background: 'rgba(184,58,46,0.08)', opacity: 0.9, transform: 'rotate(-3deg)' }}>
                {collectorSeal}藏
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
                {/* 品相 — collector's condition grade, appraised off BP + 星級. */}
                {(() => {
                  const cond = cardCondition(bp, stars);
                  return (
                    <span
                      title={t('品相 — 依綜合戰力與星級鑑定的收藏品級(神品>極美品>上品>佳品>中品)', 'Condition grade — an appraisal from BP and stars')}
                      style={{ display: 'block', marginTop: 2, fontSize: '0.62rem', color: cond.color, letterSpacing: '0.14rem', fontFamily: '"Ma Shan Zheng", "Songti SC", serif' }}
                    >◈ {pickName({ zh: cond.zh, en: cond.en }, lang)}</span>
                  );
                })()}
              </span>
            </div>
            {stars > 0 && (
              <div style={{ position: 'absolute', top: 40, left: 10, color: '#ffd66e', fontSize: '0.8rem', textShadow: '0 0 6px rgba(0,0,0,0.9)' }}>
                {Array.from({ length: 6 }, (_, si) => (
                  <span key={si} style={si < stars
                    ? { animation: `tkmStarTwinkle ${stars >= 6 ? 1.6 : 2.8}s ease-in-out ${si * 0.35}s infinite`, display: 'inline-block' }
                    : { color: '#3d4a56' }}>
                    {si < stars ? '★' : '☆'}
                  </span>
                ))}
              </div>
            )}
            {/* 武評朱印 — the realm board's seal, stamped in vermilion (gold-edged top ten). */}
            {sealText && (
              <div
                title={t(`天下武評 第${boardRank}位(上季榜)`, `Realm power board: #${boardRank} (last season)`)}
                style={{
                  position: 'absolute', top: 54, right: 12, transform: 'rotate(6deg)',
                  border: `2px solid ${boardRank! <= 10 ? '#e6c473' : '#b8442e'}`,
                  color: boardRank! <= 10 ? '#ffe9a8' : '#e0705a',
                  background: 'rgba(120,20,12,0.35)', borderRadius: 4,
                  padding: '3px 5px', fontSize: '0.66rem', letterSpacing: '0.08rem',
                  fontFamily: '"Ma Shan Zheng", "Songti SC", serif',
                  writingMode: 'vertical-rl', textShadow: '0 0 4px rgba(0,0,0,0.8)',
                }}>
                {sealText}
              </div>
            )}
            {/* Name plate over a bottom fade. */}
            <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: '26px 12px 8px', background: 'linear-gradient(180deg, transparent, rgba(10,13,18,0.92) 62%)' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
                <span style={stars >= 6
                  ? { fontSize: '1.35rem', fontWeight: 700, fontFamily: '"Ma Shan Zheng", "Songti SC", serif',
                      // 六星金箔 — the awakened name is stamped in gold leaf.
                      background: 'linear-gradient(180deg, #fff4c8 8%, #e6c473 52%, #a8842e 95%)',
                      WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                      filter: 'drop-shadow(0 1px 4px rgba(0,0,0,0.8)) drop-shadow(0 0 8px rgba(255,214,110,0.35))' }
                  : { fontSize: '1.35rem', color: '#f2e2b8', fontWeight: 700, fontFamily: '"Ma Shan Zheng", "Songti SC", serif', textShadow: '0 1px 8px rgba(0,0,0,0.8)' }}>
                  {pickName(officer.name, lang)}
                </span>
                {officer.status === 'dead' && (
                  <span title={t('已故 — 追憶之卡', 'Departed — a card of remembrance')}
                    style={{ fontSize: '0.7rem', color: '#b8a888', border: '1px solid #6a5a42', borderRadius: 6, padding: '0 5px' }}>
                    {t('卒', '†')}{officer.deathYear ? ` ${officer.deathYear}` : ''}{officer.posthumousName ? t(`·諡${officer.posthumousName}`, ` · ${officer.posthumousName}`) : ''}
                  </span>
                )}
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
                {/* 戰意 — the fought-battle streak, worn on the sleeve. */}
                {(officer.streak ?? 0) >= 2 && (
                  <span title={t(`勢如破竹 — 連勝 ${officer.streak},戰力 +${((officer.streak ?? 0) * 0.6).toFixed(1)}%`, `On a ${officer.streak}-win streak — power +${((officer.streak ?? 0) * 0.6).toFixed(1)}%`)}
                    style={{ color: '#ff9a5a' }}>🔥{t(`連勝${officer.streak}`, `W${officer.streak}`)}</span>
                )}
                {(officer.streak ?? 0) <= -2 && (
                  <span title={t('心灰意冷 — 連敗挫志,戰力受抑', 'Demoralised by defeats — power sapped')}
                    style={{ color: '#8ab0c8' }}>❄{t('連敗', 'cold')}</span>
                )}
                {rankDef && <span style={{ color: '#b0a0c8' }}>{pickName(rankDef.name, lang)}</span>}
                {peer && <span style={{ color: '#d8b060' }}>{t('爵·', '')}{pickName(peer.name, lang)}</span>}
                {honorific && <span style={{ color: '#e0a868' }}>「{pickName(honorific.name, lang)}」</span>}
                {/* 動態卡面標(B6) — the current mood, worn small. */}
                {mood && (
                  <span title={t('動態卡面 — 隨現狀變化', 'Living card — reflects current state')}
                    style={{ color: mood.accent }}>{mood.glyph} {lang === 'en' ? mood.en : mood.zh}</span>
                )}
                {/* 開包閃度標(B3) — the foil tier, worn as a shiny chip. */}
                {fm && (
                  <span title={t('開包閃度 — 開卡時擲得的收藏閃度', 'Foil tier — rolled at reveal')}
                    style={{ color: '#20242c', fontWeight: 700, padding: '0 6px', borderRadius: 8, background: `linear-gradient(100deg, ${fm.colors.join(', ')})` }}>
                    ✦{lang === 'en' ? fm.en : fm.zh}
                  </span>
                )}
              </div>
              {/* 名場面異畫題句(B1) — the epithet couplet, on the active alt face. */}
              {altArt && (
                <div style={{ marginTop: 4, fontSize: '0.74rem', fontStyle: 'italic', color: altArt.accent, textShadow: '0 1px 6px rgba(0,0,0,0.85)' }}>
                  「{lang === 'en' ? altArt.quoteEn : altArt.quoteZh}」
                </div>
              )}
              {/* 異畫切換(B1) — cycle base ↔ unlocked famous-moment faces. */}
              {unlockedAlts.length > 0 && (
                <div style={{ display: 'flex', gap: 5, alignItems: 'center', marginTop: 5, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.62rem', color: '#7a8893', letterSpacing: '0.1rem' }}>{t('異畫', 'ALT')}</span>
                  {[{ zh: '本畫', en: 'Base', accent: '#9aa6b0' }, ...unlockedAlts].map((a, i) => {
                    const on = altIdx === i;
                    const acc = i === 0 ? '#9aa6b0' : unlockedAlts[i - 1].accent;
                    return (
                      <button key={i}
                        onClick={(e) => { e.stopPropagation(); setAltIdx(i); }}
                        title={i === 0 ? t('本畫', 'Base art') : t(`名場面:${(a as { zh: string }).zh}`, `Famous moment: ${(a as { en: string }).en}`)}
                        style={{
                          fontSize: '0.64rem', padding: '0.05rem 0.4rem', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit',
                          border: `1px solid ${on ? acc : '#3c4f5e'}`, background: on ? `${acc}22` : 'rgba(10,14,20,0.6)',
                          color: on ? acc : '#8a94a0',
                        }}>
                        {i === 0 ? t('本畫', 'Base') : (lang === 'en' ? (a as { en: string }).en : (a as { zh: string }).zh)}
                      </button>
                    );
                  })}
                </div>
              )}
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

            {/* 性格 — the officer's temperament, straight from §2.3 (top 3). */}
            {traits.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {traits.map((tr) => (
                  <span key={tr.id} title={lang === 'en' ? tr.description : tr.descriptionZh}
                    style={{ fontSize: '0.68rem', padding: '1px 7px', borderRadius: 9, background: 'rgba(255,255,255,0.04)', border: `1px solid ${tr.color}66`, color: tr.color }}>
                    ◈ {pickName(tr.name, lang)}
                  </span>
                ))}
              </div>
            )}

            {officer.skills.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {officer.skills.slice(0, 8).map((sid) => {
                  const sk = SKILLS_BY_ID[sid];
                  if (!sk) return null;
                  const badge = skillLevelBadge(officer, sid);
                  return (
                    <span key={sid} title={(lang === 'en' ? sk.description : sk.descriptionZh) + (badge ? t(`(精研 ${badge} 級)`, ` (mastery ${badge})`) : '')}
                      style={{ fontSize: '0.68rem', padding: '1px 7px', borderRadius: 9, background: 'rgba(230,196,115,0.1)', border: '1px solid #4a3f26', color: '#e6c473' }}>
                      {pickName(sk.name, lang)}{badge && <span style={{ marginLeft: 3, color: '#ffd66e', fontWeight: 700 }}>{badge}</span>}
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
                  // 神兵共鳴 — the hero's own legend glows gold on the card.
                  const resonant = isSignaturePair(officer.id, id);
                  const ins = inscriptions?.[id];
                  return (
                    <span key={id}
                      title={[ins?.motto ? `「${ins.motto}」` : null, resonant ? t('本命神兵 — 人器合一,效力 115%', 'Signature arm — resonates at 115% effect') : null].filter(Boolean).join(' · ') || undefined}
                      style={resonant
                        ? { fontSize: '0.68rem', padding: '1px 7px', borderRadius: 9, background: 'rgba(230,196,115,0.16)', border: '1px solid #8a6a2a', color: '#ffe9a8', boxShadow: '0 0 8px rgba(230,196,115,0.25)' }
                        : { fontSize: '0.68rem', padding: '1px 7px', borderRadius: 9, background: 'rgba(126,192,224,0.08)', border: '1px solid #2c4454', color: '#9ed0ea' }}>
                      {resonant ? '✦' : '⚔'} {ins?.name ?? pickName(it.name, lang)}{ins?.name && <span style={{ marginLeft: 3, fontSize: '0.58rem', color: '#c8a24e' }}>{t('銘', '✒')}</span>}{resonant && <span style={{ marginLeft: 3, fontSize: '0.6rem', color: '#e6c473' }}>{t('本命', 'SIG')}</span>}
                    </span>
                  );
                })}
                {/* 本命指引 — the legend they should be carrying: go and get it. */}
                {missingSignatures.map((it) => (
                  <span key={`want-${it.id}`}
                    title={t('本命神兵尚未入手 — 得之駕馭直達 115%', 'Their signature arm awaits — resonates at 115% once won')}
                    style={{ fontSize: '0.68rem', padding: '1px 7px', borderRadius: 9, background: 'transparent', border: '1px dashed #4a545e', color: '#5f6c76' }}>
                    ✧ {pickName(it.name, lang)}{t('(未得)', ' (unclaimed)')}
                  </span>
                ))}
              </div>
            )}
            {officer.equipment.length === 0 && missingSignatures.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {missingSignatures.map((it) => (
                  <span key={`want-${it.id}`}
                    title={t('本命神兵尚未入手 — 得之駕馭直達 115%', 'Their signature arm awaits — resonates at 115% once won')}
                    style={{ fontSize: '0.68rem', padding: '1px 7px', borderRadius: 9, background: 'transparent', border: '1px dashed #4a545e', color: '#5f6c76' }}>
                    ✧ {pickName(it.name, lang)}{t('(未得)', ' (unclaimed)')}
                  </span>
                ))}
              </div>
            )}

            {bonds.length > 0 && (
              <div>
                <div style={{ fontSize: '0.62rem', color: '#7a8893', letterSpacing: '0.12rem', marginBottom: 3, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>{t('緣分', 'BONDS')}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowWeb(true); }}
                    title={t('群英譜 — 以連線圖遍覽其緣', 'Web of ties — see the bonds as a graph')}
                    style={{ fontSize: '0.62rem', background: 'none', border: '1px solid #2b3d4e', borderRadius: 7, color: '#8fb0c8', cursor: 'pointer', padding: '0 6px', fontFamily: 'inherit' }}
                  >🕸 {t('群英譜', 'Web')}</button>
                </div>
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

            {/* 語錄 — the hero speaks in their own voice (flavor text). */}
            {(flavor || cardNo) && (
              <div style={{ borderTop: '1px solid #1e2832', paddingTop: 6, display: 'flex', alignItems: 'baseline', gap: 8 }}>
                {flavor && (
                  <span style={{ flex: 1, fontSize: '0.7rem', fontStyle: 'italic', color: '#8a96a2' }}>
                    “{pickName(flavor, lang)}”
                  </span>
                )}
                {cardNo && (
                  <span title={t('圖鑑編號', 'Collector number')}
                    style={{ marginLeft: 'auto', fontSize: '0.62rem', color: '#4a545e', fontFamily: 'ui-monospace, monospace', whiteSpace: 'nowrap' }}>
                    #{String(cardNo).padStart(3, '0')}/{CARD_TOTAL}
                  </span>
                )}
              </div>
            )}
            {/* 題跋(B5) — the collector's colophon: read it, or ✒ write your own. */}
            <div style={{ borderTop: '1px solid #1e2832', paddingTop: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
              {editingColophon ? (
                <input
                  autoFocus
                  value={colophonDraft}
                  maxLength={48}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => setColophonDraft(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { inscribeOfficer(officer.id, colophonDraft); setEditingColophon(false); } if (e.key === 'Escape') setEditingColophon(false); }}
                  placeholder={t('題一句…(Enter 存,Esc 取消)', 'A colophon… (Enter to save)')}
                  style={{ flex: 1, background: '#0c1118', border: '1px solid #3c4f5e', borderRadius: 4, color: '#d8c8a0', fontSize: '0.72rem', padding: '2px 6px', fontFamily: 'inherit' }}
                />
              ) : (
                <span style={{ flex: 1, fontSize: '0.72rem', fontStyle: 'italic', color: colophon ? '#c8b48a' : '#4a545e', fontFamily: '"Ma Shan Zheng", "Songti SC", serif' }}>
                  {colophon ? `題:${colophon}` : t('（未題跋）', '(no colophon)')}
                </span>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); if (editingColophon) { inscribeOfficer(officer.id, colophonDraft); setEditingColophon(false); } else { setColophonDraft(colophon ?? ''); setEditingColophon(true); } }}
                title={t('題跋 — 為此卡題一句收藏語', 'Write a collector\'s colophon')}
                style={{ fontSize: '0.7rem', background: 'none', border: '1px solid #3c4f5e', borderRadius: 4, color: '#8a96a2', cursor: 'pointer', padding: '1px 7px', fontFamily: 'inherit' }}
              >{editingColophon ? t('存', '✓') : '✒'}</button>
            </div>
          </div>
          </>
          )}
        </div>
        {/* 卡框皮膚 — an achievement-unlocked accent ring + corner glyphs. */}
        {frameSkin.id !== 'default' && (
          <div aria-hidden style={{ position: 'absolute', inset: 4, zIndex: 2, pointerEvents: 'none', border: `1px solid ${frameSkin.color}55`, borderRadius: 10 }}>
            <span style={{ position: 'absolute', top: 26, left: 2, fontSize: '0.8rem', color: frameSkin.color, opacity: 0.5, fontFamily: '"Ma Shan Zheng", "Songti SC", serif' }}>{frameSkin.glyph}</span>
            <span style={{ position: 'absolute', bottom: 2, right: 4, fontSize: '0.8rem', color: frameSkin.color, opacity: 0.5, fontFamily: '"Ma Shan Zheng", "Songti SC", serif' }}>{frameSkin.glyph}</span>
          </div>
        )}
        {/* 閃卡 — a holographic foil glare rides the pointer (gold+ frames). */}
        {fs.sheen && tilt && !showBack && (
          <div aria-hidden style={{
            position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none',
            mixBlendMode: 'color-dodge', opacity: 0.22,
            background: `radial-gradient(circle at ${tilt.gx.toFixed(1)}% ${tilt.gy.toFixed(1)}%, rgba(255,240,200,0.9), rgba(160,220,255,0.35) 30%, rgba(255,170,220,0.22) 55%, transparent 75%)`,
          }} />
        )}
        {/* ⟲ 戰績面 — flip between the face and the career-record back. */}
        <button
          onClick={(e) => { e.stopPropagation(); setFace((v) => ((v + 1) % 3) as 0 | 1 | 2); }}
          aria-label={face === 0 ? t('戰績面', 'Career record') : face === 1 ? t('列傳面', 'Biography') : t('返回卡面', 'Card face')}
          title={face === 0 ? t('戰績面 — 生涯數字與名局', 'Career record — deeds & famous bouts') : face === 1 ? t('列傳面 — 本朝實錄', 'Biography — the chronicle') : t('返回卡面', 'Back to the card face')}
          style={{ position: 'absolute', top: 6, right: onClose ? 70 : 38, zIndex: 3, width: 26, height: 26, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.25)', background: showBack ? 'rgba(230,196,115,0.25)' : 'rgba(10,14,20,0.72)', color: '#cfd8e0', cursor: 'pointer', fontSize: '0.85rem', lineHeight: 1 }}
        >⟲</button>
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
      {/* 群英譜(B2) — the relationship-web overlay. */}
      {showWeb && <RelationWebModal initialFocalId={officer.id} onClose={() => setShowWeb(false)} />}
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
