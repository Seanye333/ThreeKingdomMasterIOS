import { useMemo, useState } from 'react';
import { useGameStore } from '../../game/state/store';
import { careerStanding } from '../../game/systems/career';
import { ERRAND_LABEL, errandOdds, errandCap, takesErrands } from '../../game/systems/careerErrands';
import { recommendThreshold } from '../../game/systems/careerPatronage';
import { Modal } from './Modal';
import { EmptyState } from './EmptyState';
import { useT, useLanguage } from '../i18n';

interface Props {
  onClose: () => void;
}

const TIER_ZH = ['', '易', '尋常', '難', '凶險', '死地'];
const TIER_EN = ['', 'Easy', 'Ordinary', 'Hard', 'Perilous', 'Deadly'];

/**
 * 差事 — 白身接得到的活。
 *
 * 面板的重點不是「有哪些活」,是<b>讓玩家看得見自己在賭什麼</b>:
 * 勝算、帶的人夠不夠、失手會賠多少。系統設計成會死人,那就得把風險攤開講;
 * 藏起來的風險不叫風險,叫耍賴。
 */
export function ErrandsModal({ onClose }: Props) {
  const career = useGameStore((s) => s.careerMode);
  const officers = useGameStore((s) => s.officers);
  const cities = useGameStore((s) => s.cities);
  const deeds = useGameStore((s) => s.deeds);
  const currentErrands = useGameStore((s) => s.currentErrands);
  const takeErrand = useGameStore((s) => s.takeErrand);
  const [log, setLog] = useState<Array<{ ok: boolean; text: string }>>([]);
  const [done, setDone] = useState<Set<string>>(new Set());
  const t = useT();
  const lang = useLanguage();

  const hero = career ? officers[career.officerId] : null;
  const city = hero?.locationCityId ? cities[hero.locationCityId] : null;
  const standing = useMemo(
    () => (hero ? careerStanding(deeds[hero.id]) : null),
    [hero, deeds],
  );
  const errands = useMemo(
    () => (hero && hero.status !== 'wounded' ? currentErrands() : []),
    [hero, currentErrands, done],
  );

  const favors = career?.favors ?? {};
  const topFavor = useMemo(() => {
    let best: { id: string; v: number } | null = null;
    for (const [id, v] of Object.entries(favors)) {
      if (!best || v > best.v) best = { id, v };
    }
    return best;
  }, [favors]);
  const troops = hero?.privateTroops ?? 0;
  const cap = standing ? errandCap(standing.rank) : 0;

  const run = (id: string) => {
    const r = takeErrand(id);
    setLog((l) => [{ ok: r.ok, text: r.message }, ...l].slice(0, 6));
    setDone((d) => new Set(d).add(id));
  };

  return (
    <Modal
      onClose={onClose}
      icon="🪧"
      title={t('差事', 'Errands')}
      badge={city ? (lang === 'zh' ? city.name.zh : city.name.en) : undefined}
      width="min(620px, 100%)"
      scrollBody
    >
      {!hero || !standing ? (
        <EmptyState title={t('非一代記模式。', 'Chronicle mode only.')} />
      ) : hero.status === 'wounded' ? (
        <EmptyState title={t('傷未癒,辦不了差。', 'Too badly hurt to take work.')} />
      ) : !takesErrands(standing.rank) ? (
        <EmptyState
          title={t(
            '已有正經公務在身,不必再替人跑腿。',
            'You hold real office now — no more odd jobs.',
          )}
        />
      ) : (
        <>
          <div style={{
            display: 'flex', gap: '1rem', flexWrap: 'wrap',
            fontSize: '.82rem', color: 'var(--tkm-text-muted)',
            marginBottom: '.7rem', fontVariantNumeric: 'tabular-nums',
          }}>
            <span>{t('身份', 'Standing')} · {lang === 'zh' ? standing.status.zh : standing.status.en}</span>
            <span>{t('部曲', 'Retinue')} · {troops}</span>
            <span>{t('每季可接', 'Per season')} · {cap}</span>
          </div>

          {/* 薦舉進度 — 讓「替人辦事」有個看得見的去處 */}
          {topFavor && standing && (
            <div style={{
              fontSize: '.8rem', marginBottom: '.7rem',
              color: 'var(--tkm-text-muted)',
            }}>
              {t('最厚的人情', 'Deepest debt')} ·{' '}
              {lang === 'zh'
                ? officers[topFavor.id]?.name.zh
                : officers[topFavor.id]?.name.en}{' '}
              {topFavor.v}/{recommendThreshold(standing.rank)}
              {topFavor.v >= recommendThreshold(standing.rank)
                && ` — ${t('已足以求薦', 'enough to be spoken for')}`}
            </div>
          )}

          {errands.length === 0 ? (
            <EmptyState title={t('此地無活可接。', 'No work to be had here.')} />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
              {errands.map((e) => {
                const odds = errandOdds(e, hero);
                const short = e.wantTroops > 0 && troops < e.wantTroops;
                const spent = done.has(e.id);
                const pct = Math.round(odds * 100);
                const bar = pct >= 70 ? 'var(--tkm-ok, #6b9e63)'
                  : pct >= 45 ? 'var(--tkm-warn, #c8a45a)' : 'var(--tkm-bad, #b25a48)';
                return (
                  <div key={e.id} style={{
                    border: '1px solid var(--tkm-border)',
                    background: 'var(--tkm-panel)',
                    padding: '.65rem .8rem',
                    display: 'flex', flexDirection: 'column', gap: '.4rem',
                    opacity: spent ? 0.5 : 1,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '.6rem', flexWrap: 'wrap' }}>
                      <strong style={{ fontSize: '1rem' }}>
                        {lang === 'zh' ? ERRAND_LABEL[e.kind].zh : ERRAND_LABEL[e.kind].en}
                      </strong>
                      <span style={{ fontSize: '.78rem', color: 'var(--tkm-text-muted)' }}>
                        {lang === 'zh' ? TIER_ZH[e.tier] : TIER_EN[e.tier]}
                      </span>
                      <span style={{
                        marginLeft: 'auto', fontVariantNumeric: 'tabular-nums',
                        fontSize: '.82rem',
                      }}>
                        {t('酬', 'Pay')} {e.goldReward}
                      </span>
                    </div>

                    {/* 雇主 — 人情那條線的起點,得讓玩家看見自己在替誰辦事 */}
                    {e.patronId && officers[e.patronId] && (
                      <div style={{ fontSize: '.78rem', color: 'var(--tkm-text-muted)' }}>
                        {t('委託', 'Commissioned by')}{' '}
                        {lang === 'zh'
                          ? officers[e.patronId].name.zh
                          : officers[e.patronId].name.en}
                        {(favors[e.patronId] ?? 0) !== 0 && (
                          <span style={{
                            marginLeft: '.5rem',
                            color: (favors[e.patronId] ?? 0) > 0
                              ? 'var(--tkm-ok, #6b9e63)' : 'var(--tkm-bad, #b25a48)',
                          }}>
                            {t('人情', 'Favour')} {favors[e.patronId] > 0 ? '+' : ''}
                            {favors[e.patronId]}
                          </span>
                        )}
                      </div>
                    )}

                    <div style={{
                      display: 'flex', gap: '.8rem', flexWrap: 'wrap',
                      fontSize: '.78rem', fontVariantNumeric: 'tabular-nums',
                      color: short ? 'var(--tkm-bad, #b25a48)' : 'var(--tkm-text-muted)',
                    }}>
                      <span>
                        {t('需人', 'Needs')} {e.wantTroops || '—'}
                        {short && ` · ${t('人手不足', 'undermanned')}`}
                      </span>
                      <span>{t('勝算', 'Odds')} {pct}%</span>
                    </div>
                    {/* 勝算做成一條可看的量尺 —— 數字容易被略過,顏色不會 */}
                    <div style={{ height: 4, background: 'var(--tkm-border)' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: bar }} />
                    </div>

                    <button
                      type="button"
                      disabled={spent}
                      onClick={() => run(e.id)}
                      style={{ alignSelf: 'flex-start', marginTop: '.15rem' }}
                    >
                      {spent ? t('已辦', 'Done') : t('接下', 'Take it')}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {log.length > 0 && (
            <div style={{ marginTop: '.9rem', display: 'flex', flexDirection: 'column', gap: '.3rem' }}>
              {log.map((l, i) => (
                <div key={i} style={{
                  fontSize: '.84rem',
                  color: l.ok ? 'var(--tkm-text)' : 'var(--tkm-bad, #b25a48)',
                }}>
                  {l.text}
                </div>
              ))}
            </div>
          )}

          {troops === 0 && (
            <p style={{ marginTop: '.9rem', fontSize: '.8rem', color: 'var(--tkm-text-muted)' }}>
              {t(
                '孤身一人,只接得了護院這類不必動手的活。要剿匪,先得有人跟你走。',
                'Alone, you can only take work that needs no swords. To hunt bandits, you need men.',
              )}
            </p>
          )}
        </>
      )}
    </Modal>
  );
}
