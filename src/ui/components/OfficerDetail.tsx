import { useGameStore } from '../../game/state/store';
import { COMMAND_DEFS } from '../../game/systems/commands';
import {
  CIVIC_TITLES_BY_ID,
  ITEMS_BY_ID,
  MILITARY_RANKS_BY_ID,
  OFFICER_RELATIONSHIPS,
  SKILLS_BY_ID,
  TRAIT_DEFS_BY_ID,
  getBiography,
} from '../../game/data';
import {
  DOCTRINE_DEFS,
  FORMATION_DEFS,
  TACTIC_DEFS,
  POLICY_DEFS,
} from '../../game/data/officerAttributes';
import { WEAPON_TYPE_DEFS, deriveWeaponType } from '../../game/data/weaponTypes';
import type { City, Force, Officer, Skill } from '../../game/types';
import styles from './OfficerDetail.module.css';
import { useT, useLanguage } from '../i18n';

type PortraitArchetype = 'warrior' | 'strategist' | 'civil' | 'ruler' | 'lady' | 'sage';

const KNOWN_LADIES = new Set<string>([
  'diaochan', 'huang-yueying', 'lady-sun', 'lady-gan', 'lady-mi',
  'empress-cao', 'empress-zhang', 'empress-pan', 'lady-wu', 'lady-yan',
  'sun-lu',
]);

const KNOWN_RULERS = new Set<string>([
  'cao-cao', 'liu-bei', 'sun-jian', 'sun-ce', 'sun-quan', 'yuan-shao',
  'yuan-shu', 'dong-zhuo', 'liu-biao', 'liu-yan', 'liu-zhang',
  'gongsun-zan', 'tao-qian', 'kong-rong', 'ma-teng', 'zhang-jiao',
  'cao-pi', 'cao-rui',
]);

/**
 * Sum item.effects into a per-stat delta so the UI can show "base + items"
 * on every stat bar. Skills are NOT added — they're separate active/passive
 * combat abilities, not stat boosters.
 */
function effectiveStatBonuses(o: Officer): {
  leadership: number;
  war: number;
  intelligence: number;
  politics: number;
  charisma: number;
} {
  const bonus = { leadership: 0, war: 0, intelligence: 0, politics: 0, charisma: 0 };
  for (const itemId of o.equipment) {
    const item = ITEMS_BY_ID[itemId];
    if (!item) continue;
    bonus.leadership += item.effects.leadership ?? 0;
    bonus.war += item.effects.war ?? 0;
    bonus.intelligence += item.effects.intelligence ?? 0;
    bonus.politics += item.effects.politics ?? 0;
    bonus.charisma += item.effects.charisma ?? 0;
  }
  return bonus;
}

function inferArchetype(o: Officer): PortraitArchetype {
  if (KNOWN_LADIES.has(o.id)) return 'lady';
  if (KNOWN_RULERS.has(o.id)) return 'ruler';
  const s = o.stats;
  // Sage tier: very high intelligence (Zhuge, Pang Tong, Sima Yi after growth)
  if (s.intelligence >= 95) return 'sage';
  if (s.war >= s.intelligence + 10 && s.war >= 75) return 'warrior';
  if (s.intelligence >= s.war + 10 && s.intelligence >= 80) return 'strategist';
  if (s.politics >= 80 && s.war < 70) return 'civil';
  if (s.war >= 80) return 'warrior';
  if (s.intelligence >= 75) return 'strategist';
  return 'civil';
}

interface Props {
  officer: Officer;
  onClose: () => void;
  // Optional context overrides (used by the title-screen scenario browser
  // before any game state is loaded).
  forcesOverride?: Record<string, Force>;
  citiesOverride?: Record<string, City>;
  yearOverride?: number;
}

export function OfficerDetail({
  officer,
  onClose,
  forcesOverride,
  citiesOverride,
  yearOverride,
}: Props) {
  const storeForces = useGameStore((s) => s.forces);
  const storeCities = useGameStore((s) => s.cities);
  const storeYear = useGameStore((s) => s.date.year);
  const t = useT();
  const lang = useLanguage();
  const playerForceId = useGameStore((s) => s.playerForceId);
  const appointments = useGameStore((s) => s.appointments);

  const forces = forcesOverride ?? storeForces;
  const cities = citiesOverride ?? storeCities;
  const currentYear = yearOverride ?? storeYear;

  const force = officer.forceId ? forces[officer.forceId] : null;
  const city = officer.locationCityId
    ? cities[officer.locationCityId]
    : null;
  const age = currentYear - officer.birthYear;
  const isMine = officer.forceId === playerForceId;
  const taskDef = officer.task ? COMMAND_DEFS[officer.task] : null;
  const rankDef = MILITARY_RANKS_BY_ID[officer.rank];
  const appointment = appointments.find((a) => a.officerId === officer.id);
  const titleDef = appointment ? CIVIC_TITLES_BY_ID[appointment.titleId] : null;

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <header className={styles.header}>
          <Portrait
            zh={officer.name.zh}
            color={force?.color ?? '#5a4530'}
            archetype={inferArchetype(officer)}
            age={age}
          />
          <div className={styles.titleBlock}>
            {lang !== 'en' && <div className={styles.titleZh}>{officer.name.zh}</div>}
            {lang === 'en' && <div className={styles.titleZh}>{officer.name.en}</div>}
            {(lang !== 'zh' || officer.courtesyName) && (
              <div className={styles.titleEn}>
                {lang === 'both' && officer.name.en}
                {officer.courtesyName && (
                  <span className={styles.courtesy}>
                    {lang === 'both' && ' · '}
                    {lang === 'zh' && '字 '}
                    {lang === 'en' ? officer.courtesyName.en : officer.courtesyName.zh}
                    {lang === 'both' && <> {officer.courtesyName.en}</>}
                  </span>
                )}
              </div>
            )}
          </div>
          <button className={styles.closeButton} onClick={onClose}>
            ×
          </button>
        </header>

        <section className={styles.identity}>
          <div className={styles.identityRow}>
            <span className={styles.idLabel}>{t('勢力', 'Force')}</span>
            <span>
              {force ? (
                <>
                  <span
                    className={styles.dot}
                    style={{ background: force.color }}
                  />
                  <span className={styles.idValue}>{lang === 'en' ? force.name.en : force.name.zh}</span>
                  {lang === 'both' && <span className={styles.idValueEn}>· {force.name.en}</span>}
                  {isMine && <span className={styles.youTag}>{t('我方', 'YOU')}</span>}
                </>
              ) : officer.status === 'imprisoned' ? (
                <span className={styles.captiveTag}>{t('俘虜', 'Captive')}</span>
              ) : (
                <span className={styles.freeTag}>{t('浪人', 'Free Agent')}</span>
              )}
            </span>
          </div>
          <div className={styles.identityRow}>
            <span className={styles.idLabel}>{t('居所', 'Location')}</span>
            <span>
              {city ? (
                <>
                  <span className={styles.idValue}>{lang === 'en' ? city.name.en : city.name.zh}</span>
                  {lang === 'both' && <span className={styles.idValueEn}>· {city.name.en}</span>}
                </>
              ) : (
                <span className={styles.muted}>—</span>
              )}
            </span>
          </div>
          {officer.hometownCityId && cities[officer.hometownCityId] && (
            <div className={styles.identityRow}>
              <span className={styles.idLabel}>{t('籍貫', 'Hometown')}</span>
              <span>
                <span className={styles.idValue}>
                  {lang === 'en'
                    ? cities[officer.hometownCityId].name.en
                    : cities[officer.hometownCityId].name.zh}
                </span>
                {lang === 'both' && (
                  <span className={styles.idValueEn}>· {cities[officer.hometownCityId].name.en}</span>
                )}
              </span>
            </div>
          )}
          <div className={styles.identityRow}>
            <span className={styles.idLabel}>{t('年齡', 'Age')}</span>
            <span className={styles.idValue}>
              {age}{' '}
              <span className={styles.muted}>
                ({officer.birthYear}
                {officer.deathYear ? ` – ${officer.deathYear}*` : ''})
              </span>
            </span>
          </div>
          {taskDef && (
            <div className={styles.identityRow}>
              <span className={styles.idLabel}>{t('現任命令', 'Current Order')}</span>
              <span className={styles.idValue}>
                {lang === 'en' ? taskDef.label.en : lang === 'both' ? `${taskDef.label.zh} ${taskDef.label.en}` : taskDef.label.zh}
              </span>
            </div>
          )}
          <div className={styles.identityRow}>
            <span className={styles.idLabel}>{t('官位', 'Title')}</span>
            <span>
              {titleDef && (
                <span className={styles.titleBadge}>
                  <span className={styles.titleBadgeZh}>{lang === 'en' ? titleDef.name.en : titleDef.name.zh}</span>
                  {lang === 'both' && <span className={styles.rankEn}>{titleDef.name.en}</span>}
                </span>
              )}
              {rankDef && (
                <span className={styles.rankBadge}>
                  <span className={styles.rankZh}>{lang === 'en' ? rankDef.name.en : rankDef.name.zh}</span>
                  {lang === 'both' && <span className={styles.rankEn}>{rankDef.name.en}</span>}
                </span>
              )}
            </span>
          </div>
        </section>

        <section className={styles.statsSection}>
          <h3 className={styles.sectionTitle}>{t('能力', 'Statistics')}</h3>
          {(() => {
            const b = effectiveStatBonuses(officer);
            return (
              <>
                <StatBar label={t('統率', 'Leadership')}   value={officer.stats.leadership}   bonus={b.leadership} />
                <StatBar label={t('武力', 'War')}          value={officer.stats.war}          bonus={b.war} />
                <StatBar label={t('知力', 'Intelligence')} value={officer.stats.intelligence} bonus={b.intelligence} />
                <StatBar label={t('政治', 'Politics')}     value={officer.stats.politics}     bonus={b.politics} />
                <StatBar label={t('魅力', 'Charisma')}     value={officer.stats.charisma}     bonus={b.charisma} />
              </>
            );
          })()}
        </section>

        <section className={styles.statsSection}>
          <h3 className={styles.sectionTitle}>{t('心情', 'Disposition')}</h3>
          <StatBar label={t('忠誠', 'Loyalty')} value={officer.loyalty} mode="loyalty" />
        </section>

        {(officer.doctrine || officer.level) && (
          <section className={styles.statsSection}>
            <h3 className={styles.sectionTitle}>{t('武將錄', 'Officer Profile')}</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem 1.5rem', alignItems: 'baseline' }}>
              {officer.level !== undefined && (
                <div>
                  <span style={{ fontSize: '0.65rem', color: '#8a7050', letterSpacing: '0.15rem' }}>{t('等級', 'Lv.')} </span>
                  <span style={{ fontSize: '1.1rem', color: '#d4a84a', fontFamily: 'ui-monospace, monospace' }}>
                    {officer.level}
                  </span>
                </div>
              )}
              {officer.doctrine && (() => {
                const d = DOCTRINE_DEFS[officer.doctrine];
                return (
                  <div>
                    <span style={{ fontSize: '0.65rem', color: '#8a7050', letterSpacing: '0.15rem' }}>{t('主義', 'Doctrine')} </span>
                    <span style={{
                      background: '#1a1410', border: `1px solid ${d.color}`, color: d.color,
                      padding: '0.2rem 0.55rem', fontSize: '0.8rem', letterSpacing: '0.1rem',
                    }}>
                      {lang === 'en' ? d.en : d.zh}
                      {lang === 'both' && <> <span style={{ fontSize: '0.65rem', color: '#8a7050', fontStyle: 'italic' }}>{d.en}</span></>}
                    </span>
                  </div>
                );
              })()}
              {(() => {
                const wt = deriveWeaponType(officer);
                const w = WEAPON_TYPE_DEFS[wt];
                return (
                  <div>
                    <span style={{ fontSize: '0.65rem', color: '#8a7050', letterSpacing: '0.15rem' }}>{t('兵裝', 'Weapon')} </span>
                    <span style={{
                      background: '#1a1410', border: `1px solid ${w.color}`, color: w.color,
                      padding: '0.2rem 0.55rem', fontSize: '0.8rem', letterSpacing: '0.1rem',
                    }}>
                      {lang === 'en' ? w.en : w.zh}
                      {lang === 'both' && <> <span style={{ fontSize: '0.65rem', color: '#8a7050', fontStyle: 'italic' }}>{w.en}</span></>}
                    </span>
                  </div>
                );
              })()}
            </div>
          </section>
        )}

        {officer.formations && officer.formations.length > 0 && (
          <section className={styles.statsSection}>
            <h3 className={styles.sectionTitle}>{t('陣形', 'Formations')}</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
              {officer.formations.map((fid) => {
                const f = FORMATION_DEFS[fid];
                return (
                  <span key={fid} style={{
                    background: '#1a1410', border: '1px solid #88b7e8', color: '#88b7e8',
                    padding: '0.3rem 0.55rem', fontSize: '0.78rem', letterSpacing: '0.1rem',
                  }}>
                    {lang === 'en' ? f.en : f.zh}
                    {lang === 'both' && <> <span style={{ fontSize: '0.65rem', color: '#5a7090', fontStyle: 'italic' }}>{f.en}</span></>}
                  </span>
                );
              })}
            </div>
          </section>
        )}

        {officer.tactics && officer.tactics.length > 0 && (
          <section className={styles.statsSection}>
            <h3 className={styles.sectionTitle}>{t('戰法', 'Tactics')}</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
              {officer.tactics.map((tid) => {
                const tac = TACTIC_DEFS[tid];
                return (
                  <span key={tid} style={{
                    background: '#1a1410', border: '1px solid #b8442e', color: '#b8442e',
                    padding: '0.3rem 0.55rem', fontSize: '0.78rem', letterSpacing: '0.1rem',
                  }}>
                    {lang === 'en' ? tac.en : tac.zh}
                    {lang === 'both' && <> <span style={{ fontSize: '0.65rem', color: '#8a4530', fontStyle: 'italic' }}>{tac.en}</span></>}
                  </span>
                );
              })}
            </div>
          </section>
        )}

        {officer.policies && officer.policies.length > 0 && (
          <section className={styles.statsSection}>
            <h3 className={styles.sectionTitle}>{t('政策', 'Policies')}</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
              {officer.policies.map((pid) => {
                const p = POLICY_DEFS[pid];
                return (
                  <span key={pid} style={{
                    background: '#1a1410', border: '1px solid #7a9a5a', color: '#7a9a5a',
                    padding: '0.3rem 0.55rem', fontSize: '0.78rem', letterSpacing: '0.1rem',
                  }}>
                    {lang === 'en' ? p.en : p.zh}
                    {lang === 'both' && <> <span style={{ fontSize: '0.65rem', color: '#5a7a4a', fontStyle: 'italic' }}>{p.en}</span></>}
                  </span>
                );
              })}
            </div>
          </section>
        )}

        {officer.traits && officer.traits.length > 0 && (
          <section className={styles.statsSection}>
            <h3 className={styles.sectionTitle}>{t('性格', 'Personality')}</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
              {officer.traits.map((tid) => {
                const tr = TRAIT_DEFS_BY_ID[tid];
                if (!tr) return null;
                return (
                  <span
                    key={tid}
                    title={lang === 'zh' && tr.descriptionZh ? tr.descriptionZh : tr.description}
                    style={{
                      background: '#1a1410',
                      border: `1px solid ${tr.color}`,
                      color: tr.color,
                      padding: '0.3rem 0.55rem',
                      fontSize: '0.78rem',
                      fontFamily: '"Songti SC", serif',
                      letterSpacing: '0.1rem',
                    }}
                  >
                    {lang === 'en' ? tr.name.en : tr.name.zh}
                    {lang === 'both' && <> <span style={{ fontSize: '0.65rem', color: '#8a7050', fontStyle: 'italic' }}>{tr.name.en}</span></>}
                  </span>
                );
              })}
            </div>
          </section>
        )}

        {officer.skills.length > 0 && (
          <section className={styles.statsSection}>
            <h3 className={styles.sectionTitle}>{t('特技', 'Skills')}</h3>
            <div className={styles.skillsList}>
              {officer.skills
                .map((id) => SKILLS_BY_ID[id])
                .filter((s): s is Skill => !!s)
                .map((s) => (
                  <SkillCard key={s.id} skill={s} />
                ))}
            </div>
          </section>
        )}

        <RelationshipsSection officerId={officer.id} />

        {officer.equipment.length > 0 && (
          <section className={styles.statsSection}>
            <h3 className={styles.sectionTitle}>
              {t('持有', 'Equipment')} ({officer.equipment.length})
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {/* Group items by kind for readability, but render every one. */}
              {(['weapon', 'horse', 'treasure', 'book'] as const).flatMap((kind) =>
                officer.equipment
                  .filter((id) => ITEMS_BY_ID[id]?.kind === kind)
                  .map((id) => <ItemCard key={id} itemId={id} />),
              )}
              {/* Any items whose kind isn't in the standard set still render. */}
              {officer.equipment
                .filter((id) => {
                  const k = ITEMS_BY_ID[id]?.kind;
                  return k && !['weapon', 'horse', 'treasure', 'book'].includes(k);
                })
                .map((id) => <ItemCard key={id} itemId={id} />)}
            </div>
          </section>
        )}

        <section className={styles.statsSection}>
          <h3 className={styles.sectionTitle}>{t('列傳', 'Biography')}</h3>
          <BiographyBlock officer={officer} />
        </section>

        {officer.deathYear && (
          <p className={styles.footnote}>
            {t('* 歷史卒年。衰老擲骰集中於此日期前後。', '* Historical death year. Aging rolls cluster around this date.')}
          </p>
        )}
      </div>
    </div>
  );
}

const REL_KIND_LABEL: Record<string, { zh: string; en: string; color: string }> = {
  'sworn-brothers': { zh: '義兄弟', en: 'Sworn Brothers', color: '#d4a84a' },
  'rival':          { zh: '宿敵',   en: 'Rival',          color: '#b8442e' },
  'mentor-student': { zh: '師弟',   en: 'Mentor / Student', color: '#3a7dd9' },
  'master-servant': { zh: '主従',   en: 'Master / Servant', color: '#c19a3b' },
  'romantic':       { zh: '恋人',   en: 'Romantic',         color: '#c178c7' },
  'enemy':          { zh: '私仇',   en: 'Personal Enemy',   color: '#5a2025' },
};

function RelationshipsSection({ officerId }: { officerId: string }) {
  const officers = useGameStore((s) => s.officers);
  const t = useT();
  const lang = useLanguage();
  const rels = OFFICER_RELATIONSHIPS.filter((r) => r.a === officerId || r.b === officerId);
  if (rels.length === 0) return null;
  return (
    <section className={styles.statsSection}>
      <h3 className={styles.sectionTitle}>{t('因緣', 'Relationships')}</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
        {rels.map((r) => {
          const otherId = r.a === officerId ? r.b : r.a;
          const other = officers[otherId];
          const meta = REL_KIND_LABEL[r.kind];
          if (!other || !meta) return null;
          return (
            <div
              key={`${r.a}-${r.b}-${r.kind}`}
              style={{
                background: '#1a1410',
                borderLeft: `3px solid ${meta.color}`,
                padding: '0.4rem 0.6rem',
                fontSize: '0.8rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span>
                  <span style={{ color: '#d4a84a' }}>{lang === 'en' ? other.name.en : other.name.zh}</span>
                  {lang === 'both' && <> <span style={{ fontSize: '0.7rem', color: '#8a7050', fontStyle: 'italic' }}>{other.name.en}</span></>}
                </span>
                <span style={{
                  fontSize: '0.65rem', letterSpacing: '0.15rem', textTransform: 'uppercase',
                  color: meta.color,
                }}>
                  {lang === 'en' ? meta.en : lang === 'both' ? `${meta.zh} ${meta.en}` : meta.zh}
                </span>
              </div>
              <div style={{ fontSize: '0.72rem', color: '#c0a878', fontStyle: 'italic', marginTop: '0.2rem' }}>
                {lang === 'en' ? r.note.en : lang === 'both' ? `${r.note.zh} · ${r.note.en}` : r.note.zh}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function BiographyBlock({ officer }: { officer: Officer }) {
  const bio = getBiography(officer.id, officer.name.en, officer.name.zh, officer.stats);
  const lang = useLanguage();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {bio.era && (
        <div
          style={{
            fontSize: '0.72rem',
            color: '#c19a3b',
            letterSpacing: '0.2rem',
            textTransform: 'uppercase',
            fontFamily: 'ui-monospace, monospace',
          }}
        >
          {lang === 'en' ? bio.era.en : lang === 'both' ? `${bio.era.zh} · ${bio.era.en}` : bio.era.zh}
        </div>
      )}
      {lang !== 'en' && (
        <div
          style={{
            background: '#1a1410',
            borderLeft: '3px solid #d4a84a',
            padding: '0.6rem 0.85rem',
            fontSize: '0.85rem',
            lineHeight: 1.7,
            color: '#d4a84a',
            fontFamily: '"Songti SC","Noto Serif SC",serif',
          }}
        >
          {bio.zh}
        </div>
      )}
      {lang !== 'zh' && (
        <div
          style={{
            background: '#1a1410',
            borderLeft: '3px solid #5a4530',
            padding: '0.6rem 0.85rem',
            fontSize: '0.82rem',
            lineHeight: 1.6,
            color: '#c0a878',
            fontStyle: 'italic',
          }}
        >
          {bio.en}
        </div>
      )}
      {bio.quote && (
        <div
          style={{
            background: '#0a0805',
            border: '1px dashed #4a3520',
            padding: '0.6rem 0.85rem',
            fontSize: '0.85rem',
            lineHeight: 1.6,
            color: '#e8d9b0',
            textAlign: 'center',
            fontStyle: 'italic',
          }}
        >
          &ldquo; {lang === 'en' ? bio.quote.en : bio.quote.zh} &rdquo;
          {lang === 'both' && (
            <div style={{ fontSize: '0.7rem', color: '#8a7050', marginTop: '0.3rem' }}>
              — {bio.quote.en}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Known Chinese compound surnames present in the roster.
const COMPOUND_SURNAMES = [
  '諸葛', '司馬', '夏侯', '太史', '公孫', '上官', '歐陽',
];

function getSurname(zh: string): string {
  for (const s of COMPOUND_SURNAMES) {
    if (zh.startsWith(s)) return s;
  }
  return zh.charAt(0);
}

function Portrait({
  zh,
  color,
  archetype,
  age,
}: {
  zh: string;
  color: string;
  archetype: PortraitArchetype;
  age: number;
}) {
  const surname = getSurname(zh);
  const isCompound = surname.length === 2;
  const gradId = `grad-${zh.charCodeAt(0)}-${zh.charCodeAt(1) ?? 0}-${archetype}`;
  const isOld = age >= 55;

  // Archetype-specific accent color.
  const accent: Record<PortraitArchetype, string> = {
    warrior: '#b8442e',
    strategist: '#3a7dd9',
    civil: '#6abf6a',
    ruler: '#d4a84a',
    lady: '#c178c7',
    sage: '#88b7e8',
  };
  const acc = accent[archetype];

  return (
    <svg
      width="84"
      height="84"
      viewBox="0 0 84 84"
      className={styles.portrait}
    >
      <defs>
        <radialGradient id={gradId} cx="42%" cy="38%" r="68%">
          <stop offset="0%" stopColor={color} stopOpacity="0.95" />
          <stop offset="60%" stopColor={color} stopOpacity="0.55" />
          <stop offset="100%" stopColor="#1a1410" stopOpacity="1" />
        </radialGradient>
        <linearGradient id={`${gradId}-frame`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#d4a84a" />
          <stop offset="100%" stopColor="#8a6a3a" />
        </linearGradient>
      </defs>

      {/* Outer frame ring with archetype color */}
      <circle cx="42" cy="42" r="40" fill="none" stroke={acc} strokeWidth="1" opacity="0.5" />
      <circle cx="42" cy="42" r="38" fill={`url(#${gradId})`} stroke={`url(#${gradId}-frame)`} strokeWidth="1.8" />

      {/* Archetype ornaments */}
      {archetype === 'warrior' && (
        <g>
          {/* Helmet sweep over the top */}
          <path d="M 14 30 Q 42 8 70 30 L 66 32 Q 42 14 18 32 Z" fill="#5a2025" opacity="0.9" stroke="#b8442e" strokeWidth="0.6" />
          {/* Plume */}
          <path d="M 42 8 L 38 2 L 42 4 L 46 2 Z" fill="#b8442e" />
          {/* Cheek guards */}
          <path d="M 14 38 L 14 50 L 20 52" fill="none" stroke="#5a2025" strokeWidth="1.5" opacity="0.7" />
          <path d="M 70 38 L 70 50 L 64 52" fill="none" stroke="#5a2025" strokeWidth="1.5" opacity="0.7" />
        </g>
      )}
      {archetype === 'strategist' && (
        <g>
          {/* Scholar's cap (冠) - boxy with a tassel */}
          <rect x="28" y="14" width="28" height="10" rx="1" fill="#1a3052" stroke="#3a7dd9" strokeWidth="0.6" />
          <path d="M 28 14 L 32 8 L 52 8 L 56 14 Z" fill="#1a3052" opacity="0.7" />
          <line x1="42" y1="8" x2="42" y2="4" stroke="#88b7e8" strokeWidth="0.8" />
          <circle cx="42" cy="3" r="1" fill="#d4a84a" />
        </g>
      )}
      {archetype === 'sage' && (
        <g>
          {/* Daoist headdress with star */}
          <path d="M 22 22 Q 42 6 62 22 L 58 26 Q 42 12 26 26 Z" fill="#0a1a2a" opacity="0.85" />
          <path d="M 42 6 L 44 10 L 48 11 L 45 14 L 46 18 L 42 16 L 38 18 L 39 14 L 36 11 L 40 10 Z" fill="#d4a84a" opacity="0.9" />
          {/* Feathered fan accent */}
          <path d="M 64 50 Q 76 46 72 60 Q 66 56 64 50 Z" fill="#e8d9b0" opacity="0.7" stroke="#8a7050" strokeWidth="0.3" />
        </g>
      )}
      {archetype === 'civil' && (
        <g>
          {/* Tall civil hat */}
          <rect x="32" y="10" width="20" height="14" rx="1" fill="#2a3a2a" stroke="#6abf6a" strokeWidth="0.6" />
          <line x1="42" y1="10" x2="42" y2="6" stroke="#6abf6a" strokeWidth="0.6" />
          <circle cx="42" cy="5" r="0.8" fill="#d4a84a" />
        </g>
      )}
      {archetype === 'ruler' && (
        <g>
          {/* Imperial crown with bead curtain */}
          <rect x="22" y="14" width="40" height="6" fill="#3a2d20" stroke="#d4a84a" strokeWidth="1" />
          <rect x="22" y="10" width="40" height="6" fill="#1a1410" stroke="#d4a84a" strokeWidth="0.6" />
          {/* Hanging beads */}
          {[26, 31, 36, 42, 48, 53, 58].map((x, i) => (
            <g key={i}>
              <line x1={x} y1="20" x2={x} y2="26" stroke="#d4a84a" strokeWidth="0.4" />
              <circle cx={x} cy="27" r="1.2" fill="#d4a84a" />
            </g>
          ))}
          {/* Top dragon ornament */}
          <path d="M 38 10 L 42 4 L 46 10 Z" fill="#b8442e" />
        </g>
      )}
      {archetype === 'lady' && (
        <g>
          {/* Hair coil with hairpin and ornament */}
          <ellipse cx="42" cy="20" rx="22" ry="10" fill="#1a1410" opacity="0.85" />
          <ellipse cx="42" cy="18" rx="14" ry="6" fill="#2a1f15" />
          {/* Hairpin with flower */}
          <line x1="48" y1="22" x2="58" y2="14" stroke="#d4a84a" strokeWidth="0.6" />
          <circle cx="58" cy="14" r="2.5" fill="#c178c7" stroke="#d4a84a" strokeWidth="0.4" />
          <circle cx="58" cy="14" r="1" fill="#d4a84a" />
          {/* Side hair locks */}
          <path d="M 22 24 Q 18 38 22 50" fill="none" stroke="#1a1410" strokeWidth="2.5" opacity="0.7" />
          <path d="M 62 24 Q 66 38 62 50" fill="none" stroke="#1a1410" strokeWidth="2.5" opacity="0.7" />
        </g>
      )}

      {/* Beard for older male officers */}
      {isOld && archetype !== 'lady' && (
        <path
          d="M 30 56 Q 42 78 54 56 Q 50 70 42 72 Q 34 70 30 56 Z"
          fill="#3a2d20"
          opacity="0.7"
        />
      )}

      {/* Surname character */}
      {isCompound ? (
        <>
          <text
            x="42" y="40"
            textAnchor="middle"
            fontSize="18"
            fontFamily='"Songti SC","Noto Serif SC",serif'
            fontWeight="bold"
            fill="#e8d9b0"
            stroke="#1a1410"
            strokeWidth="0.4"
          >
            {surname.charAt(0)}
          </text>
          <text
            x="42" y="60"
            textAnchor="middle"
            fontSize="18"
            fontFamily='"Songti SC","Noto Serif SC",serif'
            fontWeight="bold"
            fill="#e8d9b0"
            stroke="#1a1410"
            strokeWidth="0.4"
          >
            {surname.charAt(1)}
          </text>
        </>
      ) : (
        <text
          x="42" y="56"
          textAnchor="middle"
          fontSize="28"
          fontFamily='"Songti SC","Noto Serif SC",serif'
          fontWeight="bold"
          fill="#e8d9b0"
          stroke="#1a1410"
          strokeWidth="0.5"
        >
          {surname}
        </text>
      )}

      {/* Archetype seal in corner */}
      <g transform="translate(64, 64)">
        <rect x="-7" y="-7" width="14" height="14" fill={acc} stroke="#1a1410" strokeWidth="0.8" rx="1" />
        <text
          x="0" y="3"
          textAnchor="middle"
          fontSize="9"
          fontFamily='"Songti SC","Noto Serif SC",serif'
          fontWeight="bold"
          fill="#fff"
        >
          {archetype === 'warrior' ? '武'
          : archetype === 'strategist' ? '智'
          : archetype === 'sage' ? '聖'
          : archetype === 'civil' ? '文'
          : archetype === 'ruler' ? '君'
          : '麗'}
        </text>
      </g>
    </svg>
  );
}

function SkillCard({ skill }: { skill: Skill }) {
  const lang = useLanguage();
  const catClass =
    skill.category === 'combat' ? styles.skillCategoryCombat
    : skill.category === 'command' ? styles.skillCategoryCommand
    : skill.category === 'wisdom' ? styles.skillCategoryWisdom
    : skill.category === 'civil' ? styles.skillCategoryCivil
    : styles.skillCategorySpecial;
  return (
    <div className={styles.skillCard}>
      <div className={styles.skillHeader}>
        <div>
          {lang !== 'en' && <span className={styles.skillName}>{skill.name.zh}</span>}
          {lang !== 'zh' && <span className={styles.skillNameEn}>{skill.name.en}</span>}
        </div>
        <span className={`${styles.skillCategory} ${catClass}`}>
          {skill.category}
        </span>
      </div>
      <div className={styles.skillDesc}>{lang === 'zh' && skill.descriptionZh ? skill.descriptionZh : skill.description}</div>
    </div>
  );
}

function ItemCard({ itemId }: { itemId: string }) {
  const item = ITEMS_BY_ID[itemId];
  const lang = useLanguage();
  if (!item) return null;
  const kindColor =
    item.kind === 'weapon'   ? '#b8442e'
  : item.kind === 'horse'    ? '#c19a3b'
  : item.kind === 'treasure' ? '#d4a84a'
  : item.kind === 'book'     ? '#3a7dd9'
  : '#5a4530';
  return (
    <div
      style={{
        background: '#1a1410',
        border: '1px solid #4a3520',
        borderLeft: `3px solid ${kindColor}`,
        padding: '0.6rem 0.75rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.3rem',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <div>
          <span style={{ color: '#d4a84a', fontSize: '1.05rem' }}>
            {lang === 'en' ? item.name.en : item.name.zh}
          </span>
          {lang === 'both' && (
            <span style={{ color: '#8a7050', fontSize: '0.75rem', marginLeft: '0.5rem' }}>
              {item.name.en}
            </span>
          )}
        </div>
        <span
          style={{
            background: kindColor,
            color: '#1a1410',
            fontFamily: 'ui-monospace, monospace',
            fontSize: '0.65rem',
            padding: '0.1rem 0.4rem',
            letterSpacing: '0.1rem',
            textTransform: 'uppercase',
          }}
        >
          {item.kind}
        </span>
      </div>
      <div style={{ fontSize: '0.78rem', color: '#c0a878', fontStyle: 'italic', lineHeight: 1.4 }}>
        {lang === 'zh' && item.descriptionZh ? item.descriptionZh : item.description}
      </div>
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {Object.entries(item.effects).map(([stat, val]) => (
          <span
            key={stat}
            style={{
              fontFamily: 'ui-monospace, monospace',
              fontSize: '0.75rem',
              color: '#88b7e8',
              background: '#2a1f15',
              border: '1px solid #3a2d20',
              padding: '0.1rem 0.45rem',
            }}
          >
            {stat.slice(0, 3).toUpperCase()} +{val}
          </span>
        ))}
      </div>
    </div>
  );
}

function StatBar({
  label,
  value,
  bonus = 0,
  mode = 'stat',
}: {
  label: string;
  value: number;
  /** Bonuses from items + skills (drawn as a separate fill segment). */
  bonus?: number;
  mode?: 'stat' | 'loyalty';
}) {
  // Loyalty: 0–100 scale. Stats: 0–150 scale (max possible after XP growth).
  // Past 100, glow gold ("transcendent"). Past 130, glow brighter.
  const scaleMax = mode === 'loyalty' ? 100 : 150;
  const effective = value + bonus;
  const baseWidthPct = Math.min(100, (value / scaleMax) * 100);
  const bonusWidthPct = Math.min(100, ((value + bonus) / scaleMax) * 100) - baseWidthPct;
  const fillColor =
    mode === 'loyalty'
      ? effective >= 80 ? '#3a7dd9' : effective >= 50 ? '#c19a3b' : '#b8442e'
      : effective >= 130 ? '#ffce4a'
      : effective >= 100 ? '#d4a84a'
      : effective >= 80 ? '#c19a3b'
      : effective >= 60 ? '#8a7050'
      : '#5a4530';
  const glow = mode === 'stat' && effective > 100;
  return (
    <div className={styles.statRow}>
      <span className={styles.statLabel}>{label}</span>
      <div className={styles.statBarTrack}>
        {/* Hundred-mark tick — shows the old "natural" cap */}
        {mode === 'stat' && (
          <div
            style={{
              position: 'absolute',
              left: `${(100 / scaleMax) * 100}%`,
              top: 0,
              bottom: 0,
              width: 1,
              background: 'rgba(212, 168, 74, 0.5)',
              pointerEvents: 'none',
            }}
          />
        )}
        {/* Base stat fill */}
        <div
          className={styles.statBarFill}
          style={{
            width: `${baseWidthPct}%`,
            background: fillColor,
            boxShadow: glow ? `0 0 6px ${fillColor}` : undefined,
          }}
        />
        {/* Item + skill bonus fill — striped/lighter to show it's external */}
        {bonus > 0 && (
          <div
            className={styles.statBarFill}
            style={{
              left: `calc(1px + ${baseWidthPct}%)`,
              width: `${bonusWidthPct}%`,
              background:
                `repeating-linear-gradient(45deg, #88b7e8 0, #88b7e8 4px, #5a8ab8 4px, #5a8ab8 8px)`,
              boxShadow: '0 0 6px #88b7e8',
            }}
          />
        )}
        <span
          className={styles.statBarValue}
          style={glow ? { color: '#ffce4a', textShadow: '0 0 4px #000, 0 0 6px #ffce4a' } : undefined}
          title={bonus > 0 ? `Base ${value} + ${bonus} from items/skills` : undefined}
        >
          {effective}
          {bonus > 0 && (
            <span style={{ color: '#88b7e8', fontSize: '0.7em', marginLeft: 4 }}>
              ({value}+{bonus})
            </span>
          )}
        </span>
      </div>
    </div>
  );
}
