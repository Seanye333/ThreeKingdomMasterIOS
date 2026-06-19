import { useMemo, useState } from 'react';
import { GLOSSARY } from '../../game/data/glossary';
import { useLanguage, useT } from '../i18n';
import { Modal } from './Modal';

/**
 * 概念 — a searchable, plain-language glossary of the game's mechanics, so a
 * newcomer can look up what 民忠 / 補給線 / 合縱 / 簒奪 actually mean without
 * leaving the realm. Reads GLOSSARY; pure presentation.
 */
export function GlossaryModal({ onClose }: { onClose: () => void }) {
  const t = useT();
  const lang = useLanguage();
  const [query, setQuery] = useState('');

  const categories = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return GLOSSARY;
    return GLOSSARY.map((cat) => ({
      ...cat,
      terms: cat.terms.filter(
        (term) =>
          term.zh.includes(query.trim()) ||
          term.en.toLowerCase().includes(q) ||
          term.descZh.includes(query.trim()) ||
          term.descEn.toLowerCase().includes(q),
      ),
    })).filter((cat) => cat.terms.length > 0);
  }, [query]);

  return (
    <Modal
      onClose={onClose}
      scrollBody
      padding="0.9rem 1.2rem"
      width="min(680px, 100%)"
      maxHeight="88vh"
      icon="📖"
      title={t('概念', 'Concepts')}
      badge={t('遊戲機制詞條', 'how the systems work')}
    >
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t('搜索概念…', 'Search concepts…')}
        style={{
          width: '100%', boxSizing: 'border-box', marginBottom: '0.8rem',
          background: '#14100a', border: '1px solid #2b3845', borderRadius: 5,
          color: '#e6edf3', padding: '0.4rem 0.6rem', fontFamily: 'inherit', fontSize: '0.86rem',
        }}
      />
      {categories.length === 0 && (
        <div style={{ color: '#7a8893', fontSize: '0.86rem', padding: '1.2rem 0', textAlign: 'center' }}>
          {t('查無此條。', 'No matching concept.')}
        </div>
      )}
      {categories.map((cat) => (
        <div key={cat.zh} style={{ marginBottom: '1.1rem' }}>
          <div style={{
            display: 'flex', alignItems: 'baseline', gap: 8,
            color: '#c9a64e', fontSize: '0.92rem', letterSpacing: '0.1rem',
            borderBottom: '1px solid #2b3845', paddingBottom: 5, marginBottom: 8,
          }}>
            <span style={{ fontSize: '1.05rem' }}>{cat.icon}</span>
            <span>{t(cat.zh, cat.en)}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {cat.terms.map((term) => (
              <div key={term.zh} style={{ background: '#141c25', border: '1px solid #243240', borderRadius: 5, padding: '0.5rem 0.7rem' }}>
                <div style={{ color: '#e6c473', fontSize: '0.92rem', marginBottom: 3 }}>
                  {term.zh}
                  <span style={{ color: '#7a8893', fontSize: '0.76rem', marginLeft: 8, fontStyle: 'italic' }}>{term.en}</span>
                </div>
                {lang !== 'en' && (
                  <div style={{ color: '#cdd8e0', fontSize: '0.82rem', lineHeight: 1.6 }}>{term.descZh}</div>
                )}
                {lang !== 'zh' && (
                  <div style={{ color: lang === 'both' ? '#97a4ae' : '#cdd8e0', fontSize: '0.8rem', lineHeight: 1.55, fontStyle: lang === 'both' ? 'italic' : 'normal', marginTop: lang === 'both' ? 3 : 0 }}>
                    {term.descEn}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </Modal>
  );
}
