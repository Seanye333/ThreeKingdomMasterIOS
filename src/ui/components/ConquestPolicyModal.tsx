import { useGameStore } from '../../game/state/store';
import { playSfx } from '../../game/systems/sound';
import { useLanguage } from '../i18n';

/**
 * 入城三選 — the moment a stormed city's gates fall, the conqueror sets the
 * tone: 安民 (pacify), 犒軍 (reward the host) or 搜捕 (hunt the old regime).
 * One choice, then the modal clears the pending state.
 */
export function ConquestPolicyModal() {
  const pending = useGameStore((s) => s.pendingConquestPolicy);
  const cities = useGameStore((s) => s.cities);
  const resolve = useGameStore((s) => s.resolveConquestPolicy);
  const lang = useLanguage();
  if (!pending) return null;
  const city = cities[pending.cityId];
  if (!city) return null;
  const recovered = Math.max(100, Math.floor(pending.attackerLosses * 0.15));
  const t = (zh: string, en: string) => (lang === 'en' ? en : zh);

  const btn = (label: string, sub: string, color: string, onClick: () => void) => (
    <button
      onClick={() => { playSfx('click'); onClick(); }}
      style={{
        flex: 1, padding: '0.7rem 0.6rem', cursor: 'pointer',
        background: 'linear-gradient(180deg, rgba(40,28,16,0.95), rgba(24,16,9,0.95))',
        border: `1px solid ${color}`, color: '#f0e0b0',
        fontFamily: 'var(--tkm-font-body)', textAlign: 'center',
      }}
    >
      <div style={{ fontSize: '1.05rem', letterSpacing: '0.1rem', color }}>{label}</div>
      <div style={{ fontSize: '0.68rem', color: '#bfae86', marginTop: 4, lineHeight: 1.45 }}>{sub}</div>
    </button>
  );

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.62)', display: 'grid', placeItems: 'center', zIndex: 1200 }}>
      <div style={{
        width: 'min(560px, 94vw)', padding: '1.2rem 1.3rem',
        background: 'linear-gradient(160deg,#241a10,#140d06)', border: '1px solid #d4a84a',
        fontFamily: 'var(--tkm-font-body)', color: '#e6edf3', boxShadow: '0 0 30px rgba(212,168,74,0.3)',
      }}>
        <div style={{ fontSize: '0.75rem', letterSpacing: '0.3rem', color: '#d4a84a', marginBottom: 4 }}>
          ⚑ {t('城破 · 入城', 'THE CITY FALLS')}
        </div>
        <div style={{ fontSize: '1.35rem', color: '#f2dd9a', marginBottom: 4 }}>
          {t(`${city.name.zh}城門洞開 — 三軍入城,號令為何?`, `${city.name.en} is yours — set the tone.`)}
        </div>
        <div style={{ fontSize: '0.78rem', color: '#aab6c0', marginBottom: '1rem' }}>
          {t('破城之初,一令定人心。', 'The first order after the storm decides how the town remembers you.')}
        </div>
        <div style={{ display: 'flex', gap: '0.7rem' }}>
          {btn(
            t('安民', 'Pacify'),
            t('出榜安民、開倉施粥 — 民忠 +12', 'Proclamations & soup kitchens — loyalty +12'),
            '#9ad6a8',
            () => resolve('pacify'),
          )}
          {btn(
            t('犒軍', 'Reward'),
            t(`犒賞三軍,輕傷歸隊 +${recovered.toLocaleString()} 兵 — 民忠 −3`, `Feast the host: +${recovered.toLocaleString()} troops — loyalty −3`),
            '#e6c473',
            () => resolve('reward'),
          )}
          {btn(
            t('搜捕', 'Roundup'),
            t('全城搜捕舊臣,各 40% 就擒 — 民忠 −8', 'Hunt the old regime: 40% each captured — loyalty −8'),
            '#e0846a',
            () => resolve('roundup'),
          )}
        </div>
      </div>
    </div>
  );
}
