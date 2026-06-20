import { useState, type ReactNode } from 'react';
import { TRAIT_DEFS_BY_ID, SKILLS_BY_ID, ITEMS_BY_ID } from '../../game/data';
import type { Officer } from '../../game/types';
import { OfficerPortrait } from './OfficerPortrait';
import { OfficerStats } from './OfficerStats';
import { useGameStore } from '../../game/state/store';
import { officerGrade, officerLevel } from '../../game/systems/officerGrade';
import { renownFromDeeds, fameMedal } from '../../game/systems/fame';
import { useLanguage, pickName } from '../i18n';

interface Props {
  officer: Officer;
  children: ReactNode;
}

/**
 * Hover-wrapper. Wrap an officer name/avatar with this and a stat card
 * pops out next to the cursor with full details — no need to open the
 * full OfficerDetail modal just to glance.
 */
export function OfficerHoverCard({ officer, children }: Props) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const currentYear = useGameStore((s) => s.date.year);
  const forceColor = useGameStore((s) =>
    officer.forceId ? s.forces[officer.forceId]?.color : undefined,
  );
  const deeds = useGameStore((s) => s.deeds[officer.id]);
  const lang = useLanguage();
  const grade = officerGrade(officer);
  const lvl = officerLevel(officer);
  const medal = fameMedal(renownFromDeeds(deeds));
  const t = officer.traits ?? [];
  const skills = officer.skills.map((id) => SKILLS_BY_ID[id]).filter(Boolean);
  const items = officer.equipment.map((id) => ITEMS_BY_ID[id]).filter(Boolean);

  return (
    <span
      style={{ display: 'inline-block' }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onMouseMove={(e) => setPos({ x: e.clientX, y: e.clientY })}
    >
      {children}
      {open && (
        <div
          style={{
            position: 'fixed',
            left: Math.min(window.innerWidth - 340, pos.x + 14),
            top: Math.min(window.innerHeight - 240, pos.y + 14),
            background: 'linear-gradient(160deg,#1b2531,#10161e)',
            border: '1px solid #e6c473',
            padding: '0.6rem 0.8rem',
            color: '#e6edf3',
            fontFamily: 'var(--tkm-font-body)',
            width: 320,
            pointerEvents: 'none',
            zIndex: 1000,
            boxShadow: '0 0 16px rgba(212, 168, 74, 0.4)',
            animation: 'tkmTipPop 0.13s ease-out',
          }}
        >
          <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start' }}>
            <OfficerPortrait
              officer={officer}
              size={56}
              forceColor={forceColor}
              year={currentYear}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '1rem', color: '#e6c473', letterSpacing: '0.07rem' }}>
                {lang === 'both' ? (
                  <>
                    {officer.name.zh}{' '}
                    <span style={{ fontSize: '0.75rem', color: '#7a8893', fontStyle: 'italic' }}>
                      {officer.name.en}
                    </span>
                  </>
                ) : (
                  pickName(officer.name, lang)
                )}
              </div>
              {officer.courtesyName && (
                <div style={{ fontSize: '0.72rem', color: '#7a8893' }}>
                  {lang === 'en' ? 'Courtesy ' : '字 '}{pickName(officer.courtesyName, lang)}
                </div>
              )}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: '0.25rem', alignItems: 'center' }}>
                <span style={{
                  fontSize: '0.66rem', padding: '0.04rem 0.34rem', borderRadius: 2,
                  border: `1px solid ${grade.color}`, color: grade.color, letterSpacing: '0.04rem',
                }}>
                  {pickName(grade.name, lang)} {pickName(grade.rank, lang)}
                </span>
                <span style={{ fontSize: '0.7rem', color: '#e6c473', fontFamily: 'ui-monospace, monospace' }}>
                  Lv.{lvl}
                </span>
                {medal && (
                  <span title={pickName(medal.name, lang)} style={{ fontSize: '0.72rem', color: medal.color }}>
                    {medal.glyph}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div style={{ marginTop: '0.4rem' }}>
            <OfficerStats officer={officer} size="md" />
          </div>
          {t.length > 0 && (
            <div style={{ marginTop: '0.3rem' }}>
              <div style={{ fontSize: '0.65rem', color: '#7a8893', letterSpacing: '0.05rem' }}>
                {lang === 'en' ? 'TRAITS' : lang === 'both' ? '性格 TRAITS' : '性格'}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                {t.map((tid) => {
                  const def = TRAIT_DEFS_BY_ID[tid];
                  if (!def) return null;
                  return (
                    <span
                      key={tid}
                      style={{
                        fontSize: '0.7rem',
                        color: def.color,
                        border: `1px solid ${def.color}`,
                        padding: '0.05rem 0.3rem',
                      }}
                    >
                      {pickName(def.name, lang)}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
          {skills.length > 0 && (
            <div style={{ marginTop: '0.3rem' }}>
              <div style={{ fontSize: '0.65rem', color: '#7a8893', letterSpacing: '0.05rem' }}>
                {lang === 'en' ? 'SKILLS' : lang === 'both' ? '特技 SKILLS' : '特技'}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#c9a64e' }}>
                {skills.map((s) => pickName(s!.name, lang)).join(' · ')}
              </div>
            </div>
          )}
          {items.length > 0 && (
            <div style={{ marginTop: '0.3rem' }}>
              <div style={{ fontSize: '0.65rem', color: '#7a8893', letterSpacing: '0.05rem' }}>
                {lang === 'en' ? 'ITEMS' : lang === 'both' ? '持有 ITEMS' : '持有'} ({items.length})
              </div>
              <div style={{ fontSize: '0.72rem', color: '#88b7e8' }}>
                {items.map((i) => pickName(i!.name, lang)).join(' · ')}
              </div>
            </div>
          )}
        </div>
      )}
    </span>
  );
}
