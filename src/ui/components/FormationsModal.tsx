import { useMemo, useState } from 'react';
import { FORMATIONS } from '../../game/data';
import type { FormationDef } from '../../game/types';
import { useT, useLanguage, useDesc } from '../i18n';

interface Props {
  onClose: () => void;
}

type Category = 'all' | 'attack' | 'defense' | 'balance' | 'special' | 'mystic';

const CATEGORY_LABEL: Record<Category, { zh: string; en: string }> = {
  all:     { zh: '全部',  en: 'All' },
  attack:  { zh: '攻擊',  en: 'Attack' },
  defense: { zh: '防御',  en: 'Defense' },
  balance: { zh: '平衡',  en: 'Balance' },
  special: { zh: '特殊',  en: 'Special' },
  mystic:  { zh: '奇門',  en: 'Mystic' },
};

// Manual categorization for nicer UI grouping (mirrors gameplay flavor).
const CATEGORY: Record<string, Category> = {
  'none':              'balance',
  'fish-scale':        'defense',
  'eight-trigrams':    'mystic',
  'arrow-tip':         'attack',
  'crane-wing':        'balance',
  'spread-out':        'defense',
  'awl':               'attack',
  'wheel':             'attack',
  'square':            'defense',
  'crescent-moon':     'defense',
  'wild-goose':        'balance',
  'trinity':           'balance',
  'back-to-water':     'attack',
  'ten-ambush':        'attack',
  'long-snake':        'special',
  'crescent-withdraw': 'defense',
  'yoke':              'defense',
  'armored-cart':      'defense',
  'seven-star':        'mystic',
  'five-elements':     'mystic',
  'four-symbols':      'mystic',
  'rattan-armor':      'special',
  'stacked':           'defense',
  'mandarin-duck':     'attack',
};

const CATEGORY_COLOR: Record<Category, string> = {
  all:     '#d4a84a',
  attack:  '#b8442e',
  defense: '#88b7e8',
  balance: '#b8c87a',
  special: '#d4a84a',
  mystic:  '#c178c7',
};

export function FormationsModal({ onClose }: Props) {
  const [cat, setCat] = useState<Category>('all');
  const t = useT();
  const lang = useLanguage();
  const desc = useDesc();

  const list: FormationDef[] = useMemo(() => {
    if (cat === 'all') return FORMATIONS;
    return FORMATIONS.filter((f) => CATEGORY[f.id] === cat);
  }, [cat]);

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.78)',
        zIndex: 200,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--tkm-bg-modal, #1f1610)',
          border: '1px solid var(--tkm-text-h2, #d4a84a)',
          width: '900px', maxWidth: '96vw',
          maxHeight: '90vh',
          display: 'flex', flexDirection: 'column',
          color: 'var(--tkm-text-body, #c9b89a)',
          fontFamily: 'var(--tkm-font-body)',
        }}
      >
        <header
          style={{
            padding: '1rem 1.25rem',
            borderBottom: '1px solid var(--tkm-border, #4a3520)',
            display: 'flex', alignItems: 'baseline', gap: '0.75rem',
          }}
        >
          <div style={{
            fontFamily: 'var(--tkm-font-zh)',
            fontSize: '1.5rem',
            color: 'var(--tkm-text-h2, #d4a84a)',
            letterSpacing: '0.3rem',
          }}>
            陣形
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--tkm-text-muted, #8c7a5a)', letterSpacing: '0.2rem', flex: 1 }}>
            {t(`${FORMATIONS.length} 種`, `FORMATIONS · ${FORMATIONS.length}`)}
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent', border: 'none',
              color: 'var(--tkm-text-h2, #d4a84a)',
              fontSize: '1.5rem', cursor: 'pointer', padding: '0 0.5rem',
            }}
          >×</button>
        </header>

        {/* Category filter */}
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: '0.4rem',
          padding: '0.75rem 1rem',
          borderBottom: '1px solid var(--tkm-border-soft, #3a2818)',
        }}>
          {(Object.keys(CATEGORY_LABEL) as Category[]).map((c) => {
            const active = cat === c;
            const color = CATEGORY_COLOR[c];
            return (
              <button
                key={c}
                onClick={() => setCat(c)}
                style={{
                  background: active ? color + '22' : 'transparent',
                  color: active ? color : 'var(--tkm-text-body)',
                  border: `1px solid ${active ? color : 'var(--tkm-border)'}`,
                  padding: '0.3rem 0.7rem',
                  fontFamily: 'var(--tkm-font-body)',
                  fontSize: '0.78rem',
                  letterSpacing: '0.15rem',
                  cursor: 'pointer',
                }}
              >
                {lang === 'en' ? CATEGORY_LABEL[c].en : CATEGORY_LABEL[c].zh}
                {lang === 'both' && <> <span style={{ fontSize: '0.65rem', opacity: 0.7 }}>{CATEGORY_LABEL[c].en}</span></>}
              </button>
            );
          })}
        </div>

        {/* Formation list */}
        <div style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          padding: '0.75rem 1rem',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.75rem',
          alignContent: 'flex-start',
        }}>
          {list.map((f) => {
            const c = CATEGORY[f.id] ?? 'balance';
            const accent = CATEGORY_COLOR[c];
            return (
              <div
                key={f.id}
                style={{
                  border: `1px solid ${accent}55`,
                  background: 'var(--tkm-bg-raised, #251c14)',
                  padding: '0.8rem 0.9rem 0.7rem 1.05rem',
                  position: 'relative',
                  overflow: 'hidden',
                  flex: '1 1 280px',
                  minWidth: 0,
                  minHeight: 130,
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                {/* Side accent bar */}
                <div style={{
                  position: 'absolute', left: 0, top: 0, bottom: 0, width: 3,
                  background: accent,
                }} />
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.4rem' }}>
                  <span style={{
                    fontFamily: 'var(--tkm-font-zh)',
                    fontSize: '1.3rem',
                    color: 'var(--tkm-text-h1, #f0e0b0)',
                    letterSpacing: '0.2rem',
                  }}>
                    {lang === 'en' ? f.name.en : f.name.zh}
                  </span>
                  {lang === 'both' && (
                    <span style={{
                      fontSize: '0.7rem',
                      color: 'var(--tkm-text-muted)',
                      fontStyle: 'italic',
                      letterSpacing: '0.1rem',
                    }}>
                      {f.name.en}
                    </span>
                  )}
                </div>
                <div style={{
                  fontSize: '0.78rem',
                  color: 'var(--tkm-text-body)',
                  lineHeight: 1.55,
                  marginBottom: '0.5rem',
                }}>
                  {desc(f)}
                </div>
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  fontSize: '0.7rem',
                  color: 'var(--tkm-text-muted)',
                  borderTop: '1px solid var(--tkm-border-soft)',
                  paddingTop: '0.4rem',
                }}>
                  <span>{t('知力', 'INT')} ≥ <span style={{
                    color: f.minIntelligence >= 85 ? 'var(--tkm-danger)' :
                           f.minIntelligence >= 70 ? 'var(--tkm-warn)' :
                           'var(--tkm-success)',
                    fontFamily: 'var(--tkm-font-mono)',
                    fontWeight: 'bold',
                  }}>{f.minIntelligence}</span></span>
                  <span style={{
                    color: accent,
                    letterSpacing: '0.15rem',
                  }}>
                    {lang === 'en' ? CATEGORY_LABEL[c].en : CATEGORY_LABEL[c].zh}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <footer style={{
          padding: '0.6rem 1rem',
          borderTop: '1px solid var(--tkm-border, #4a3520)',
          fontSize: '0.72rem',
          color: 'var(--tkm-text-muted)',
          letterSpacing: '0.1rem',
        }}>
          {t(`展示 ${list.length} / ${FORMATIONS.length} · 戰時於 BattlePrepModal 中選用`, `Showing ${list.length} / ${FORMATIONS.length} · selectable in BattlePrepModal at battle time`)}
        </footer>
      </div>
    </div>
  );
}
