import { useEffect, useState } from 'react';
import { Seal } from './Seal';
import { useLanguage } from '../i18n';
import styles from './LoadingSplash.module.css';

// 載屏語錄 — a slow carousel of period lines so a long first load reads as a
// beat of atmosphere instead of dead air.
const QUOTES: Array<{ zh: string; en: string }> = [
  { zh: '兵者,國之大事,不可不察也。', en: '"War is a matter of vital importance to the state." — Sun Tzu' },
  { zh: '天下大勢,分久必合,合久必分。', en: 'Long divided, the realm must unite; long united, it must divide.' },
  { zh: '知彼知己,百戰不殆。', en: '"Know the enemy and know yourself." — Sun Tzu' },
  { zh: '兵貴神速。', en: 'In war, speed is everything.' },
  { zh: '用兵之道,攻心為上,攻城為下。', en: 'Best take hearts; taking walls comes second.' },
  { zh: '良禽擇木而棲,賢臣擇主而事。', en: 'A wise bird picks its tree; a wise minister, his lord.' },
  { zh: '萬事俱備,只欠東風。', en: 'All is ready — we but await the east wind.' },
  { zh: '鞠躬盡瘁,死而後已。', en: 'To strive, bent with devotion, until the very end.' },
];

/**
 * 品牌加載頁 — the splash behind the Suspense boundary while the realm's 3D
 * chunks stream in. A breathing 鼎 seal over the wordmark, an indeterminate
 * ink sweep, and a rotating period quote, in place of the old bare
 * "展開輿圖…" line.
 */
export function LoadingSplash({ label }: { label?: string }) {
  const lang = useLanguage();
  const caption = label ?? (lang === 'en' ? 'Unrolling the map…' : '展開輿圖…');
  const [qi, setQi] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setQi((i) => (i + 1) % QUOTES.length), 3200);
    return () => window.clearInterval(id);
  }, []);
  return (
    <div className={styles.root} role="status" aria-live="polite" aria-label={caption}>
      <div className={styles.inner}>
        <Seal chars="鼎" size={76} rotate={-6} className={styles.seal} />
        <div className={styles.wordmark}>{lang === 'en' ? 'Three Kingdoms' : '三國志'}</div>
        <div className={styles.bar} />
        <div className={styles.caption}>{caption}</div>
        <div className={styles.quote} key={qi}>{lang === 'en' ? QUOTES[qi].en : QUOTES[qi].zh}</div>
      </div>
    </div>
  );
}
