import { useGameStore } from '../../game/state/store';
import { SEASON_LABEL } from '../../game/types';
import { useT, useLanguage } from '../i18n';

interface Props {
  onClose: () => void;
}

export function CampaignStatsModal({ onClose }: Props) {
  const stats = useGameStore((s) => s.campaignStats);
  const officers = useGameStore((s) => s.officers);
  const cities = useGameStore((s) => s.cities);
  const t = useT();
  const lang = useLanguage();

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.78)',
        display: 'grid', placeItems: 'center',
        zIndex: 900, padding: '1rem',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'linear-gradient(160deg,#2a1f15,#1a1410)',
          border: '2px solid #d4a84a',
          width: 'min(600px,100%)',
          padding: '1.5rem',
          color: '#e8d9b0',
          fontFamily: '"Songti SC","Noto Serif SC",serif',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ fontSize: '0.65rem', letterSpacing: '0.4rem', color: '#c19a3b', textTransform: 'uppercase', textAlign: 'center', marginBottom: '0.5rem' }}>
          {t('戰記', 'Campaign Statistics')}
        </div>
        <div style={{ fontSize: '1.6rem', color: '#d4a84a', letterSpacing: '0.3rem', textAlign: 'center', marginBottom: '0.4rem' }}>
          {t('戰記', 'Stats')}
        </div>
        <hr style={{ border: 'none', height: 1, background: 'linear-gradient(90deg, transparent, #d4a84a, transparent)', margin: '1rem 0' }} />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.82rem' }}>
          <Row label={t('遊玩季數', 'Seasons played')} value={stats.seasonsPlayed} />
          <Row label={t('交戰次數', 'Battles fought')} value={stats.totalBattles} />
        </div>

        <h3 style={{ fontSize: '0.7rem', letterSpacing: '0.2rem', color: '#8a7050', textTransform: 'uppercase', margin: '1rem 0 0.5rem' }}>{t('記錄', 'Records')}</h3>

        {stats.biggestBattle ? (
          <Card label={t('最大之戰', 'Biggest Battle')}>
            <div style={{ color: '#d4a84a' }}>
              {cities[stats.biggestBattle.cityId] ? (lang === 'en' ? cities[stats.biggestBattle.cityId].name.en : cities[stats.biggestBattle.cityId].name.zh) : '?'} ({stats.biggestBattle.year} {lang === 'en' ? SEASON_LABEL[stats.biggestBattle.season].en : SEASON_LABEL[stats.biggestBattle.season].zh})
            </div>
            <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: '0.78rem', color: '#c0a878' }}>
              {stats.biggestBattle.attackerTroops.toLocaleString()} vs {stats.biggestBattle.defenderTroops.toLocaleString()}
            </div>
          </Card>
        ) : <Card label={t('最大之戰', 'Biggest Battle')}><em style={{ color: '#6a5238' }}>—</em></Card>}

        {stats.longestSiege ? (
          <Card label={t('最長攻城', 'Longest Siege')}>
            <div style={{ color: '#d4a84a' }}>{cities[stats.longestSiege.cityId] ? (lang === 'en' ? cities[stats.longestSiege.cityId].name.en : cities[stats.longestSiege.cityId].name.zh) : '?'} — {stats.longestSiege.turns} {t('回合', 'turns')}</div>
          </Card>
        ) : <Card label={t('最長攻城', 'Longest Siege')}><em style={{ color: '#6a5238' }}>—</em></Card>}

        {stats.biggestHit ? (
          <Card label={t('一擊必殺', 'Highest Single Strike')}>
            <div style={{ color: '#d4a84a' }}>
              {officers[stats.biggestHit.attackerId] ? (lang === 'en' ? officers[stats.biggestHit.attackerId].name.en : officers[stats.biggestHit.attackerId].name.zh) : '?'} → {officers[stats.biggestHit.defenderId] ? (lang === 'en' ? officers[stats.biggestHit.defenderId].name.en : officers[stats.biggestHit.defenderId].name.zh) : '?'}
            </div>
            <div style={{ fontFamily: 'ui-monospace, monospace', color: '#ff9070' }}>
              {stats.biggestHit.damage.toLocaleString()} {t('傷害', 'damage')}
            </div>
          </Card>
        ) : <Card label={t('一擊必殺', 'Highest Single Strike')}><em style={{ color: '#6a5238' }}>—</em></Card>}

        {stats.topOfficerByCities ? (
          <Card label={t('攻陷王', 'Top Conqueror')}>
            <div style={{ color: '#d4a84a' }}>
              {officers[stats.topOfficerByCities.officerId] ? (lang === 'en' ? officers[stats.topOfficerByCities.officerId].name.en : officers[stats.topOfficerByCities.officerId].name.zh) : '?'} — {stats.topOfficerByCities.count} {t('座城', 'cities')}
            </div>
          </Card>
        ) : <Card label={t('攻陷王', 'Top Conqueror')}><em style={{ color: '#6a5238' }}>—</em></Card>}

        <div style={{ textAlign: 'center', marginTop: '1.2rem' }}>
          <button
            onClick={onClose}
            style={{
              background: 'linear-gradient(180deg, #5a4530, #3a2d20)',
              border: '1px solid #d4a84a',
              color: '#d4a84a',
              padding: '0.5rem 2rem',
              fontFamily: 'inherit', cursor: 'pointer',
              letterSpacing: '0.25rem',
            }}
          >
            {t('關閉', 'Close')}
          </button>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dotted #3a2d20', padding: '0.25rem 0' }}>
      <span style={{ color: '#8a7050' }}>{label}</span>
      <span style={{ fontFamily: 'ui-monospace, monospace', color: '#d4a84a' }}>{value}</span>
    </div>
  );
}

function Card({ label, children }: { label: string; children: import('react').ReactNode }) {
  return (
    <div style={{ background: '#1a1410', border: '1px solid #4a3520', padding: '0.5rem 0.7rem', marginBottom: '0.4rem' }}>
      <div style={{ fontSize: '0.65rem', letterSpacing: '0.15rem', color: '#8a7050', textTransform: 'uppercase', marginBottom: '0.2rem' }}>
        {label}
      </div>
      {children}
    </div>
  );
}
