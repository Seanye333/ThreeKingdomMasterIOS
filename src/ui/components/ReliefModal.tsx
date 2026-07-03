import { useState } from 'react';
import { useEscapeKey } from '../hooks/useEscapeKey';
import { useGameStore } from '../../game/state/store';
import { reliefFoodCost } from '../../game/systems/events';
import { useT, useLanguage, pickName } from '../i18n';

const KIND_ZH: Record<string, string> = {
  famine: '饑荒', plague: '瘟疫', flood: '洪災', quake: '地動',
};

/** §8.2-deep 賑災 — answer this season's disasters city by city:
 *  開倉賑濟(糧換民心)/ 徙民就食 / 坐視不理. */
export function ReliefModal({ onClose }: { onClose: () => void }) {
  useEscapeKey(onClose);
  const t = useT();
  const lang = useLanguage();
  const pendingRelief = useGameStore((s) => s.pendingRelief ?? []);
  const cities = useGameStore((s) => s.cities);
  const answerRelief = useGameStore((s) => s.answerRelief);
  const [messages, setMessages] = useState<string[]>([]);

  const answer = (cityId: string, choice: 'grant' | 'migrate' | 'ignore') => {
    const r = answerRelief(cityId, choice);
    setMessages((m) => [...m, r.message]);
  };

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'grid', placeItems: 'center', zIndex: 920, padding: '1rem' }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'linear-gradient(160deg,#2a1f18,#141009)', border: '1px solid #b8863e', borderRadius: 'var(--tkm-radius-lg)',
          width: 'min(560px,100%)', maxHeight: '75vh', overflowY: 'auto',
          color: '#eee6d8', fontFamily: 'var(--tkm-font-body)', padding: '1rem 1.3rem',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.5rem' }}>
          <div>
            <div style={{ fontSize: '1.2rem', color: '#f0c078', letterSpacing: '0.08rem' }}>🌾 {t('賑災', 'Disaster Relief')}</div>
            <div style={{ fontSize: '0.7rem', color: '#9a8a70' }}>
              {t('災報既至,郡縣待命 — 主公示下。', 'The disaster reports are in. The prefects await your word.')}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#f0c078', fontSize: '1.4rem', cursor: 'pointer' }}>×</button>
        </div>

        {pendingRelief.length === 0 && (
          <div style={{ color: '#9a8a70', fontSize: '0.85rem', padding: '0.6rem 0' }}>
            {t('諸災已議,無待決之案。', 'Every disaster has been answered.')}
          </div>
        )}

        {pendingRelief.map((p) => {
          const city = cities[p.cityId];
          if (!city) return null;
          const cost = reliefFoodCost(city);
          const btn: React.CSSProperties = {
            padding: '0.35rem 0.6rem', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.78rem',
            background: 'transparent', border: '1px solid #6a5a40', color: '#e8d8b8',
          };
          return (
            <div key={p.cityId} style={{ padding: '0.6rem 0.7rem', marginBottom: 8, background: 'rgba(60,40,20,0.35)', border: '1px solid rgba(184,134,62,0.4)' }}>
              <div style={{ fontSize: '0.95rem', marginBottom: 4 }}>
                <strong style={{ color: '#ff9a70' }}>{KIND_ZH[p.kind] ?? p.kind}</strong>
                {' — '}{pickName(city.name, lang)}
                <span style={{ color: '#9a8a70', fontSize: '0.75rem' }}>
                  {'　'}{t(`存糧 ${city.food.toLocaleString()} · 民忠 ${city.loyalty}`, `food ${city.food.toLocaleString()} · loyalty ${city.loyalty}`)}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button
                  style={{ ...btn, borderColor: '#8ad6a0', color: '#aef0c0', opacity: city.food < cost ? 0.45 : 1 }}
                  disabled={city.food < cost}
                  onClick={() => answer(p.cityId, 'grant')}
                >{t(`開倉賑濟(−${cost} 糧,民忠+9)`, `Open granaries (−${cost} food)`)}</button>
                <button style={btn} onClick={() => answer(p.cityId, 'migrate')}>
                  {t('徙民就食(移 8% 口於鄰城)', 'Move the hungry (8% pop)')}
                </button>
                <button style={{ ...btn, borderColor: '#8a5a4a', color: '#d8a090' }} onClick={() => answer(p.cityId, 'ignore')}>
                  {t('坐視不理(民忠−5)', 'Do nothing (loyalty −5)')}
                </button>
              </div>
            </div>
          );
        })}

        {messages.map((m, i) => (
          <div key={i} style={{ fontSize: '0.8rem', color: '#f2dd9a', padding: '0.2rem 0' }}>{m}</div>
        ))}
      </div>
    </div>
  );
}
