import { useMemo, useState } from 'react';
import { FORMATIONS } from '../../game/data';
import { useGameStore } from '../../game/state/store';
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
  all:     '#e6c473',
  attack:  '#b8442e',
  defense: '#88b7e8',
  balance: '#b8c87a',
  special: '#e6c473',
  mystic:  '#c178c7',
};

export function FormationsModal({ onClose }: Props) {
  const [cat, setCat] = useState<Category>('all');
  const [usableOnly, setUsableOnly] = useState(false);
  const t = useT();
  const lang = useLanguage();
  const desc = useDesc();

  const officers = useGameStore((s) => s.officers);
  const playerForceId = useGameStore((s) => s.playerForceId);

  // Highest INT among the player's officers — gates which formations the
  // force can deploy. (Each formation has minIntelligence.)
  const maxPlayerInt = useMemo(() => {
    if (!playerForceId) return 0;
    let m = 0;
    for (const o of Object.values(officers)) {
      if (o.forceId !== playerForceId) continue;
      if (o.status === 'dead' || o.status === 'imprisoned') continue;
      if (o.stats.intelligence > m) m = o.stats.intelligence;
    }
    return m;
  }, [officers, playerForceId]);

  const list: FormationDef[] = useMemo(() => {
    let base = cat === 'all' ? FORMATIONS : FORMATIONS.filter((f) => CATEGORY[f.id] === cat);
    if (usableOnly) {
      base = base.filter((f) => maxPlayerInt >= f.minIntelligence);
    }
    return base;
  }, [cat, usableOnly, maxPlayerInt]);

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
          background: 'var(--tkm-bg-modal, #141c25)',
          border: '1px solid var(--tkm-text-h2, #e6c473)',
          width: '900px', maxWidth: '96vw',
          maxHeight: '90vh',
          display: 'flex', flexDirection: 'column',
          color: 'var(--tkm-text-body, #b6c2cc)',
          fontFamily: 'var(--tkm-font-body)',
        }}
      >
        <header
          style={{
            padding: '1rem 1.25rem',
            borderBottom: '1px solid var(--tkm-border, #2b3845)',
            display: 'flex', alignItems: 'baseline', gap: '0.75rem',
          }}
        >
          <div style={{
            fontFamily: 'var(--tkm-font-zh)',
            fontSize: '1.5rem',
            color: 'var(--tkm-text-h2, #e6c473)',
            letterSpacing: '0.1rem',
          }}>
            陣形
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--tkm-text-muted, #7a8893)', letterSpacing: '0.07rem', flex: 1 }}>
            {t(`${FORMATIONS.length} 種`, `FORMATIONS · ${FORMATIONS.length}`)}
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent', border: 'none',
              color: 'var(--tkm-text-h2, #e6c473)',
              fontSize: '1.5rem', cursor: 'pointer', padding: '0 0.5rem',
            }}
          >×</button>
        </header>

        {/* Category filter */}
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: '0.4rem',
          padding: '0.75rem 1rem',
          borderBottom: '1px solid var(--tkm-border-soft, #1e2832)',
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
                  letterSpacing: '0.05rem',
                  cursor: 'pointer',
                }}
              >
                {lang === 'en' ? CATEGORY_LABEL[c].en : CATEGORY_LABEL[c].zh}
                {lang === 'both' && <> <span style={{ fontSize: '0.65rem', opacity: 0.7 }}>{CATEGORY_LABEL[c].en}</span></>}
              </button>
            );
          })}
          {/* Usable-only filter — gated by player's highest-INT officer. */}
          {playerForceId && (
            <button
              onClick={() => setUsableOnly((v) => !v)}
              style={{
                background: usableOnly ? '#1e2832' : 'transparent',
                color: usableOnly ? '#7ed68a' : 'var(--tkm-text-body)',
                border: `1px solid ${usableOnly ? '#7ed68a' : 'var(--tkm-border)'}`,
                padding: '0.3rem 0.7rem',
                fontFamily: 'var(--tkm-font-body)',
                fontSize: '0.78rem',
                letterSpacing: '0.05rem',
                cursor: 'pointer',
                marginLeft: '0.4rem',
              }}
              title={`Filter to formations your top officer (INT ${maxPlayerInt}) can deploy`}
            >
              {t('我軍可用', 'Usable')} ({maxPlayerInt})
            </button>
          )}
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
                  background: 'var(--tkm-bg-raised, #18212b)',
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
                    color: 'var(--tkm-text-h1, #eef4f8)',
                    letterSpacing: '0.07rem',
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
                <FormationDiagram formation={f.id} accent={accent} />
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
                    letterSpacing: '0.05rem',
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
          borderTop: '1px solid var(--tkm-border, #2b3845)',
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

/**
 * Tiny hex-grid sketch of where troops sit in this formation. Schematic —
 * uses a 7x4 grid with filled hexes representing unit slots. Hand-tuned
 * per formation to match its historical shape.
 */
function FormationDiagram({ formation, accent }: { formation: string; accent: string }) {
  const W = 7, H = 4;
  // Hand-curated unit positions per formation. (col, row).
  const SHAPES: Record<string, Array<[number, number]>> = {
    'none':              [[2, 1], [3, 1], [4, 1], [2, 2], [3, 2], [4, 2]],
    'fish-scale':        [[1, 0], [2, 1], [3, 0], [4, 1], [5, 0], [2, 2], [4, 2], [3, 3]],
    'eight-trigrams':    [[3, 0], [1, 1], [5, 1], [2, 2], [3, 2], [4, 2], [1, 3], [5, 3]],
    'arrow-tip':         [[3, 0], [2, 1], [4, 1], [1, 2], [3, 2], [5, 2], [2, 3], [4, 3]],
    'crane-wing':        [[0, 0], [1, 1], [2, 2], [3, 3], [4, 2], [5, 1], [6, 0]],
    'spread-out':        [[0, 0], [3, 0], [6, 0], [1, 2], [5, 2], [2, 3], [4, 3]],
    'awl':               [[3, 0], [3, 1], [2, 2], [3, 2], [4, 2], [3, 3]],
    'wheel':             [[3, 0], [1, 1], [5, 1], [3, 2], [1, 3], [5, 3]],
    'square':            [[1, 0], [3, 0], [5, 0], [1, 2], [3, 2], [5, 2], [1, 3], [3, 3], [5, 3]],
    'crescent-moon':     [[1, 0], [3, 0], [5, 0], [0, 2], [3, 2], [6, 2]],
    'wild-goose':        [[1, 0], [3, 0], [5, 0], [2, 1], [4, 1], [3, 2]],
    'trinity':           [[3, 0], [2, 2], [4, 2]],
    'back-to-water':     [[1, 0], [2, 0], [3, 0], [4, 0], [5, 0]],
    'ten-ambush':        [[0, 0], [6, 0], [3, 1], [1, 2], [5, 2], [0, 3], [3, 3], [6, 3]],
    'long-snake':        [[0, 1], [1, 1], [2, 2], [3, 2], [4, 1], [5, 1], [6, 2]],
    'crescent-withdraw': [[1, 1], [2, 0], [3, 1], [4, 0], [5, 1], [3, 3]],
    'yoke':              [[1, 0], [3, 0], [5, 0], [2, 1], [4, 1], [3, 2]],
    'armored-cart':      [[1, 1], [2, 1], [3, 1], [4, 1], [5, 1]],
    'seven-star':        [[3, 0], [1, 1], [5, 1], [2, 2], [4, 2], [3, 3], [3, 2]],
    'five-elements':     [[3, 0], [1, 2], [5, 2], [2, 3], [4, 3]],
    'four-symbols':      [[3, 0], [1, 1], [5, 1], [3, 3]],
    'rattan-armor':      [[1, 0], [3, 0], [5, 0], [1, 2], [3, 2], [5, 2]],
    'stacked':           [[1, 0], [2, 0], [3, 0], [4, 0], [5, 0], [1, 2], [2, 2], [3, 2], [4, 2], [5, 2]],
    'mandarin-duck':     [[2, 1], [3, 1], [4, 1], [3, 2]],
  };
  const positions = SHAPES[formation] ?? SHAPES['none'];
  const slotSet = new Set(positions.map(([c, r]) => `${c},${r}`));
  const hexR = 4;
  const colStep = hexR * 1.5;
  const rowStep = hexR * Math.sqrt(3);
  const width = W * colStep + hexR;
  const height = H * rowStep + hexR;
  return (
    <svg
      width="100%" height="50"
      viewBox={`0 0 ${width} ${height}`}
      style={{ marginBottom: '0.5rem', opacity: 0.95 }}
    >
      {Array.from({ length: H }).map((_, row) =>
        Array.from({ length: W }).map((_, col) => {
          const x = col * colStep + hexR;
          const y = row * rowStep + (col & 1 ? rowStep / 2 : 0) + hexR;
          const filled = slotSet.has(`${col},${row}`);
          const pts: string[] = [];
          for (let i = 0; i < 6; i++) {
            const a = (Math.PI / 3) * i;
            pts.push(`${x + hexR * Math.cos(a)},${y + hexR * Math.sin(a)}`);
          }
          return (
            <polygon
              key={`${col},${row}`}
              points={pts.join(' ')}
              fill={filled ? accent : 'none'}
              stroke={filled ? '#1a1208' : '#1e2832'}
              strokeWidth={filled ? 0.4 : 0.2}
              opacity={filled ? 0.9 : 0.4}
            />
          );
        }),
      )}
    </svg>
  );
}
