import { useMemo, useRef, useState, type CSSProperties } from 'react';
import { OATH_BONDS } from '../../game/data';
import { useGameStore } from '../../game/state/store';
import type { Officer } from '../../game/types';
import { getRapport } from '../../game/systems/rapport';
import { OfficerDetail } from './OfficerDetail';
import { BondCeremony } from './BondCeremony';
import { playSfx } from '../../game/systems/sound';
import styles from './BondsModal.module.css';
import { useT, useLanguage } from '../i18n';

interface Props {
  onClose: () => void;
}

type BondStatus = 'active' | 'dormant' | 'broken';

interface BondRow {
  officerA: Officer | null;
  officerB: Officer | null;
  floor: number;
  kind: string;
  label: string;
  status: BondStatus;
}

export function BondsModal({ onClose }: Props) {
  const officers = useGameStore((s) => s.officers);
  const forces = useGameStore((s) => s.forces);
  const runtimeBonds = useGameStore((s) => s.runtimeBonds);
  const cities = useGameStore((s) => s.cities);
  const playerForceId = useGameStore((s) => s.playerForceId);
  const rapport = useGameStore((s) => s.rapport);
  const socializeOfficers = useGameStore((s) => s.socializeOfficers);
  const hostBanquet = useGameStore((s) => s.hostBanquet);
  const swearBrotherhood = useGameStore((s) => s.swearBrotherhood);
  const year = useGameStore((s) => s.date.year);
  const playerColor = (playerForceId ? forces[playerForceId]?.color : null) ?? '#d4a84a';
  const [selectedOfficer, setSelectedOfficer] = useState<Officer | null>(null);
  const [aSel, setASel] = useState('');
  const [bSel, setBSel] = useState('');
  const [citySel, setCitySel] = useState('');
  const [socialMsg, setSocialMsg] = useState('');
  // Ceremony overlay (義結金蘭 flourish) + a transient floating-number cue.
  const [ceremony, setCeremony] = useState<{ a: Officer; b: Officer; titleZh: string; titleEn: string } | null>(null);
  const [floater, setFloater] = useState<{ key: number; text: string; color: string } | null>(null);
  const floatId = useRef(0);
  const lang = useLanguage();
  const t = useT();

  const floatFx = (text: string, color: string) => {
    floatId.current += 1;
    setFloater({ key: floatId.current, text, color });
  };
  const handleSocialize = () => {
    const r = socializeOfficers(aSel, bSel);
    setSocialMsg(r.message);
    if (r.forged && officers[aSel] && officers[bSel]) {
      playSfx('bell');
      setCeremony({ a: officers[aSel], b: officers[bSel], titleZh: '義結金蘭', titleEn: 'A Bond is Sworn' });
    } else if (r.ok) {
      playSfx('coin');
      floatFx(t('好感 +25', 'Rapport +25'), '#7ed68a');
    } else {
      playSfx('defeat');
    }
  };
  const handleSwear = () => {
    const r = swearBrotherhood(aSel, bSel);
    setSocialMsg(r.message);
    if (r.ok && officers[aSel] && officers[bSel]) {
      playSfx('bell');
      setCeremony({ a: officers[aSel], b: officers[bSel], titleZh: '義結金蘭 · 義兄弟', titleEn: 'Sworn Brothers' });
    } else {
      playSfx('defeat');
    }
  };
  const handleBanquet = () => {
    const r = hostBanquet(citySel);
    setSocialMsg(r.message);
    if (r.ok) { playSfx('horn'); floatFx(t('忠誠 ↑ · 好感 ↑', 'Loyalty ↑ · Rapport ↑'), '#d4a84a'); }
    else playSfx('defeat');
  };

  const myOfficers = useMemo(
    () => Object.values(officers)
      .filter((o) => o.forceId === playerForceId && o.status !== 'dead' && o.status !== 'imprisoned')
      .sort((a, b) => a.name.zh.localeCompare(b.name.zh)),
    [officers, playerForceId],
  );
  const myCities = useMemo(
    () => Object.values(cities).filter((c) => c.ownerForceId === playerForceId),
    [cities, playerForceId],
  );
  const oName = (o: Officer) => (lang === 'en' ? o.name.en : o.name.zh);

  const rows = useMemo<BondRow[]>(() => {
    return [...OATH_BONDS, ...runtimeBonds].map((bond) => {
      const a = officers[bond.officerA] ?? null;
      const b = officers[bond.officerB] ?? null;
      let status: BondStatus;
      if (!a || !b || a.status === 'dead' || b.status === 'dead') {
        status = 'broken';
      } else if (a.forceId && a.forceId === b.forceId) {
        status = 'active';
      } else {
        status = 'dormant';
      }
      return { officerA: a, officerB: b, floor: bond.floor, kind: bond.kind, label: bond.label, status };
    });
  }, [officers, runtimeBonds]);

  const grouped: Record<BondStatus, BondRow[]> = {
    active: rows.filter((r) => r.status === 'active'),
    dormant: rows.filter((r) => r.status === 'dormant'),
    broken: rows.filter((r) => r.status === 'broken'),
  };

  // 近誼養成中 — player pairs whose rapport is climbing toward a bond.
  const warming = useMemo(() => {
    const bonded = new Set(
      [...OATH_BONDS, ...runtimeBonds].map((b) => (b.officerA < b.officerB ? `${b.officerA}|${b.officerB}` : `${b.officerB}|${b.officerA}`)),
    );
    const out: Array<{ a: Officer; b: Officer; r: number }> = [];
    for (let i = 0; i < myOfficers.length; i++) {
      for (let j = i + 1; j < myOfficers.length; j++) {
        const a = myOfficers[i], b = myOfficers[j];
        const key = a.id < b.id ? `${a.id}|${b.id}` : `${b.id}|${a.id}`;
        if (bonded.has(key)) continue;
        const r = getRapport(rapport, a.id, b.id);
        if (r > 0) out.push({ a, b, r });
      }
    }
    return out.sort((x, y) => y.r - x.r).slice(0, 6);
  }, [myOfficers, rapport, runtimeBonds]);

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <header className={styles.header}>
          <div>
            <div className={styles.titleZh}>{t('絆', 'Bonds')}</div>
            <div className={styles.titleEn}>
              {t(
                `現役 ${grouped.active.length} · 沉寂 ${grouped.dormant.length} · 斷絕 ${grouped.broken.length}`,
                `Bonds & Allegiances — ${grouped.active.length} active · ${grouped.dormant.length} dormant · ${grouped.broken.length} broken`,
              )}
            </div>
          </div>
          <button className={styles.closeButton} onClick={onClose}>
            ×
          </button>
        </header>

        {/* 社交 — grow rapport (好感) toward sworn bonds */}
        <div style={{ border: '1px solid #4a3520', background: 'rgba(20,16,12,0.5)', padding: '0.6rem 0.75rem', margin: '0 0 0.8rem' }}>
          <div style={{ color: '#d4a84a', letterSpacing: '0.2rem', marginBottom: '0.5rem', position: 'relative' }}>
            {t('結交養誼', 'Build Rapport')}
            {floater && (
              <span
                key={floater.key}
                style={{
                  position: 'absolute', left: '6.5rem', top: '-0.1rem', whiteSpace: 'nowrap',
                  fontSize: '0.82rem', color: floater.color, fontWeight: 'bold', pointerEvents: 'none',
                  textShadow: '0 1px 3px rgba(0,0,0,0.7)', animation: 'tkmFloatUpFade 1s ease-out forwards',
                }}
                onAnimationEnd={() => setFloater(null)}
              >
                {floater.text}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <select value={aSel} onChange={(e) => setASel(e.target.value)} style={selStyle}>
              <option value="">{t('武將甲', 'Officer A')}</option>
              {myOfficers.map((o) => <option key={o.id} value={o.id}>{oName(o)}</option>)}
            </select>
            <select value={bSel} onChange={(e) => setBSel(e.target.value)} style={selStyle}>
              <option value="">{t('武將乙', 'Officer B')}</option>
              {myOfficers.map((o) => <option key={o.id} value={o.id}>{oName(o)}</option>)}
            </select>
            {aSel && bSel && aSel !== bSel && (
              <span style={{ fontSize: '0.75rem', color: '#c0a878' }}>{t('好感', 'Rapport')} {getRapport(rapport, aSel, bSel)}/100</span>
            )}
            <button
              onClick={handleSocialize}
              disabled={!aSel || !bSel || aSel === bSel}
              style={btnStyle(!(!aSel || !bSel || aSel === bSel))}
            >
              {t('結交 (100金)', 'Socialize (100g)')}
            </button>
            <button
              onClick={handleSwear}
              disabled={!aSel || !bSel || aSel === bSel}
              style={{ ...btnStyle(!(!aSel || !bSel || aSel === bSel)), borderColor: '#c0504a', color: aSel && bSel && aSel !== bSel ? '#e2a07a' : undefined }}
              title={t('義結金蘭 — 永久羈絆，戰場同陣加成 + 忠誠下限90', 'Sworn brotherhood — permanent bond: same-side combat synergy + loyalty floor 90')}
            >
              {t('結拜 (300金)', 'Swear Oath (300g)')}
            </button>
          </div>
          <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', marginTop: '0.5rem', flexWrap: 'wrap' }}>
            <select value={citySel} onChange={(e) => setCitySel(e.target.value)} style={selStyle}>
              <option value="">{t('擇城設宴', 'Pick a city')}</option>
              {myCities.map((c) => <option key={c.id} value={c.id}>{lang === 'en' ? c.name.en : c.name.zh}</option>)}
            </select>
            <button
              onClick={handleBanquet}
              disabled={!citySel}
              style={btnStyle(!!citySel)}
            >
              {t('宴請 (300金)', 'Banquet (300g)')}
            </button>
            {socialMsg && <span style={{ fontSize: '0.74rem', color: '#7ed68a' }}>{socialMsg}</span>}
          </div>
          {warming.length > 0 && (
            <div style={{ marginTop: '0.6rem', borderTop: '1px solid #3a2818', paddingTop: '0.5rem' }}>
              <div style={{ fontSize: '0.7rem', color: '#8a7050', marginBottom: '0.3rem' }}>
                {t('近誼養成中（同袍共事,好感漸增,滿百義結）', 'Warming ties — serving together raises rapport; a bond forms at 100')}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                {warming.map(({ a, b, r }) => (
                  <span key={`${a.id}|${b.id}`} style={{ fontSize: '0.74rem', color: '#c0a878', border: '1px solid #4a3520', padding: '0.1rem 0.4rem', borderRadius: 2 }}>
                    {oName(a)}–{oName(b)} <span style={{ color: r >= 80 ? '#7ed68a' : '#d4a84a', fontFamily: 'ui-monospace, monospace' }}>{r}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <Section
          title={t('現役 — 兩位武將同屬一勢力', 'Active — both officers in the same force')}
          rows={grouped.active}
          forces={forces}
          emptyMsg={t('目前無啟動中之羈絆。', 'No bonds are currently active.')}
          onPickOfficer={setSelectedOfficer}
        />
        <Section
          title={t('沉寂 — 因效忠或所在地而暫絕', 'Dormant — separated by allegiance or location')}
          rows={grouped.dormant}
          forces={forces}
          emptyMsg={t('無沉寂之羈絆。', 'No dormant bonds.')}
          onPickOfficer={setSelectedOfficer}
        />
        <Section
          title={t('斷絕 — 至少一方已亡', 'Broken — at least one party has died')}
          rows={grouped.broken}
          forces={forces}
          emptyMsg={t('無斷絕之羈絆。', 'No broken bonds.')}
          onPickOfficer={setSelectedOfficer}
          dim
        />

        {selectedOfficer && (
          <OfficerDetail
            officer={selectedOfficer}
            onClose={() => setSelectedOfficer(null)}
          />
        )}
      </div>
      {ceremony && (
        <BondCeremony
          a={ceremony.a}
          b={ceremony.b}
          titleZh={ceremony.titleZh}
          titleEn={ceremony.titleEn}
          color={playerColor}
          year={year}
          onDone={() => setCeremony(null)}
        />
      )}
    </div>
  );
}

function Section({
  title,
  rows,
  forces,
  emptyMsg,
  onPickOfficer,
  dim,
}: {
  title: string;
  rows: BondRow[];
  forces: Record<string, { color: string; name: { en: string; zh: string } }>;
  emptyMsg: string;
  onPickOfficer: (o: Officer) => void;
  dim?: boolean;
}) {
  return (
    <section className={`${styles.section} ${dim ? styles.sectionDim : ''}`}>
      <h3 className={styles.sectionTitle}>{title}</h3>
      {rows.length === 0 ? (
        <div className={styles.empty}>{emptyMsg}</div>
      ) : (
        <ul className={styles.list}>
          {rows.map((r, i) => (
            <BondRowView
              key={i}
              row={r}
              forces={forces}
              onPickOfficer={onPickOfficer}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

function BondRowView({
  row,
  forces,
  onPickOfficer,
}: {
  row: BondRow;
  forces: Record<string, { color: string; name: { en: string; zh: string } }>;
  onPickOfficer: (o: Officer) => void;
}) {
  const aForce = row.officerA?.forceId ? forces[row.officerA.forceId] : null;
  const bForce = row.officerB?.forceId ? forces[row.officerB.forceId] : null;
  const t = useT();
  return (
    <li className={styles.row}>
      <OfficerCell officer={row.officerA} force={aForce} onClick={onPickOfficer} />
      <div className={styles.linkBlock}>
        <div className={styles.bondLabel}>{row.label}</div>
        <div className={styles.bondFloor}>
          ≥ {row.floor} {t('忠誠', 'loyalty')}
        </div>
        <div className={`${styles.bondKind} ${styles[`kind_${row.kind}`]}`}>
          {row.kind}
        </div>
      </div>
      <OfficerCell officer={row.officerB} force={bForce} onClick={onPickOfficer} />
    </li>
  );
}

function OfficerCell({
  officer,
  force,
  onClick,
}: {
  officer: Officer | null;
  force: { color: string; name: { en: string; zh: string } } | null;
  onClick: (o: Officer) => void;
}) {
  const lang = useLanguage();
  if (!officer) return <div className={styles.cellMissing}>—</div>;
  const dead = officer.status === 'dead';
  return (
    <div
      className={styles.cell}
      style={{ cursor: 'pointer' }}
      onClick={() => onClick(officer)}
    >
      <div className={styles.cellName}>
        <span className={`${styles.cellNameZh} ${dead ? styles.dead : ''}`}>
          {lang === 'en' ? officer.name.en : officer.name.zh}
        </span>
        {lang === 'both' && <span className={styles.cellNameEn}>{officer.name.en}</span>}
      </div>
      <div className={styles.cellFooter}>
        <span
          className={styles.cellDot}
          style={{ background: force?.color ?? '#5a4530' }}
        />
        <span className={styles.cellForce}>
          {force ? (lang === 'en' ? force.name.en : force.name.zh) : (dead ? '亡' : '浪人')}
        </span>
        <span className={styles.cellLoy}>L{officer.loyalty}</span>
      </div>
    </div>
  );
}

const selStyle: CSSProperties = {
  background: '#2a1f15', color: '#e8d9b0', border: '1px solid #5a4530',
  padding: '0.25rem 0.4rem', fontFamily: 'inherit', fontSize: '0.8rem',
};
function btnStyle(enabled: boolean): CSSProperties {
  return {
    background: enabled ? '#3a2818' : '#241c12',
    color: enabled ? '#d4a84a' : '#5a4a36',
    border: `1px solid ${enabled ? '#5a4530' : '#3a2c1c'}`,
    padding: '0.3rem 0.6rem', cursor: enabled ? 'pointer' : 'default',
    fontFamily: 'inherit', fontSize: '0.8rem',
  };
}
