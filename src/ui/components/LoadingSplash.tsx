import { Seal } from './Seal';
import { useLanguage } from '../i18n';
import styles from './LoadingSplash.module.css';

/**
 * 品牌加載頁 — the splash behind the Suspense boundary while the realm's 3D
 * chunks stream in. A breathing 鼎 seal over the wordmark and an indeterminate
 * ink sweep, in place of the old bare "展開輿圖…" line.
 */
export function LoadingSplash({ label }: { label?: string }) {
  const lang = useLanguage();
  const caption = label ?? (lang === 'en' ? 'Unrolling the map…' : '展開輿圖…');
  return (
    <div className={styles.root} role="status" aria-live="polite" aria-label={caption}>
      <div className={styles.inner}>
        <Seal chars="鼎" size={76} rotate={-6} className={styles.seal} />
        <div className={styles.wordmark}>{lang === 'en' ? 'Three Kingdoms' : '三國志'}</div>
        <div className={styles.bar} />
        <div className={styles.caption}>{caption}</div>
      </div>
    </div>
  );
}
