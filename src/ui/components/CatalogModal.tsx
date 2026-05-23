import { useMemo, useState, type ReactNode } from 'react';

export interface CatalogItem {
  id: string;
  zh: string;
  en: string;
  description?: string;
  /** Free-form category — used to filter and color cards. */
  category?: string;
  /** Optional accent color (e.g., trait color). Overrides category color. */
  accent?: string;
  /** Optional small badge at the right (e.g., "INT ≥ 80", "+15 War"). */
  badge?: ReactNode;
  /** Optional small tag at the bottom-right (e.g., "正面" / "負面"). */
  tag?: { label: string; color: string };
}

export interface CatalogCategory {
  key: string;
  zh: string;
  en: string;
  color: string;
}

interface Props {
  onClose: () => void;
  title: { zh: string; en: string };
  items: CatalogItem[];
  /** Categories shown as filter chips. The "all" entry is added automatically. */
  categories?: CatalogCategory[];
}

export function CatalogModal({ onClose, title, items, categories = [] }: Props) {
  const [cat, setCat] = useState<string>('all');

  const list: CatalogItem[] = useMemo(() => {
    if (cat === 'all') return items;
    return items.filter((it) => it.category === cat);
  }, [items, cat]);

  const allChips: CatalogCategory[] = [
    { key: 'all', zh: '全部', en: 'All', color: '#d4a84a' },
    ...categories,
  ];

  const colorFor = (it: CatalogItem) =>
    it.accent ?? categories.find((c) => c.key === it.category)?.color ?? '#8c7a5a';

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
        <header style={{
          padding: '1rem 1.25rem',
          borderBottom: '1px solid var(--tkm-border, #4a3520)',
          display: 'flex', alignItems: 'baseline', gap: '0.75rem',
        }}>
          <div style={{
            fontFamily: 'var(--tkm-font-zh)',
            fontSize: '1.5rem',
            color: 'var(--tkm-text-h2, #d4a84a)',
            letterSpacing: '0.3rem',
          }}>
            {title.zh}
          </div>
          <div style={{
            fontSize: '0.78rem',
            color: 'var(--tkm-text-muted, #8c7a5a)',
            letterSpacing: '0.2rem',
            flex: 1,
          }}>
            {title.en.toUpperCase()} · {items.length} 種
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

        {categories.length > 0 && (
          <div style={{
            display: 'flex', flexWrap: 'wrap', gap: '0.4rem',
            padding: '0.75rem 1rem',
            borderBottom: '1px solid var(--tkm-border-soft, #3a2818)',
          }}>
            {allChips.map((c) => {
              const active = cat === c.key;
              return (
                <button
                  key={c.key}
                  onClick={() => setCat(c.key)}
                  style={{
                    background: active ? c.color + '22' : 'transparent',
                    color: active ? c.color : 'var(--tkm-text-body)',
                    border: `1px solid ${active ? c.color : 'var(--tkm-border)'}`,
                    padding: '0.3rem 0.7rem',
                    fontFamily: 'var(--tkm-font-body)',
                    fontSize: '0.78rem',
                    letterSpacing: '0.15rem',
                    cursor: 'pointer',
                  }}
                >
                  {c.zh} <span style={{ fontSize: '0.65rem', opacity: 0.7 }}>{c.en}</span>
                </button>
              );
            })}
          </div>
        )}

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
          {list.map((it) => {
            const accent = colorFor(it);
            return (
              <div
                key={it.id}
                style={{
                  border: `1px solid ${accent}55`,
                  background: 'var(--tkm-bg-raised, #251c14)',
                  padding: '0.8rem 0.9rem 0.7rem 1.05rem',
                  position: 'relative',
                  overflow: 'hidden',
                  flex: '1 1 280px',
                  minWidth: 0,
                  minHeight: 110,
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <div style={{
                  position: 'absolute', left: 0, top: 0, bottom: 0, width: 3,
                  background: accent,
                }} />
                <div style={{
                  display: 'flex', alignItems: 'baseline',
                  gap: '0.5rem', marginBottom: '0.4rem',
                }}>
                  <span style={{
                    fontFamily: 'var(--tkm-font-zh)',
                    fontSize: '1.25rem',
                    color: 'var(--tkm-text-h1, #f0e0b0)',
                    letterSpacing: '0.2rem',
                  }}>
                    {it.zh}
                  </span>
                  <span style={{
                    fontSize: '0.7rem',
                    color: 'var(--tkm-text-muted)',
                    fontStyle: 'italic',
                    letterSpacing: '0.1rem',
                  }}>
                    {it.en}
                  </span>
                  {it.badge && (
                    <span style={{
                      marginLeft: 'auto',
                      fontSize: '0.7rem',
                      color: 'var(--tkm-text-muted)',
                      fontFamily: 'var(--tkm-font-mono)',
                    }}>
                      {it.badge}
                    </span>
                  )}
                </div>
                {it.description && (
                  <div style={{
                    fontSize: '0.78rem',
                    color: 'var(--tkm-text-body)',
                    lineHeight: 1.55,
                    flex: 1,
                  }}>
                    {it.description}
                  </div>
                )}
                {it.tag && (
                  <div style={{
                    display: 'flex', justifyContent: 'flex-end',
                    fontSize: '0.7rem',
                    color: it.tag.color,
                    letterSpacing: '0.15rem',
                    borderTop: '1px solid var(--tkm-border-soft)',
                    paddingTop: '0.4rem',
                    marginTop: '0.5rem',
                  }}>
                    {it.tag.label}
                  </div>
                )}
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
          展示 {list.length} / {items.length}
        </footer>
      </div>
    </div>
  );
}
