import { useMemo, useState } from 'react';
import { useEscapeKey } from '../hooks/useEscapeKey';
import { useGameStore } from '../../game/state/store';
import { SCHEME_DEFS, schemeOdds, validateScheme, type SchemeId } from '../../game/systems/schemes';
import { pickAdvisor } from '../../game/systems/advisor';
import { useT, useLanguage } from '../i18n';

/**
 * 計略 — the named force-level schemes, with the strategist's odds
 * shown before the silver leaves the treasury.
 */
export function SchemesModal({ onClose }: { onClose: () => void }) {
  useEscapeKey(onClose);
  const t = useT();
  const lang = useLanguage();
  const cities = useGameStore((s) => s.cities);
  const forces = useGameStore((s) => s.forces);
  const officers = useGameStore((s) => s.officers);
  const diplomacy = useGameStore((s) => s.diplomacy);
  const playerForceId = useGameStore((s) => s.playerForceId);
  const emperorCityId = useGameStore((s) => s.emperorCityId);
  const executeScheme = useGameStore((s) => s.executeScheme);
  // §7.2-2 假詔討賊 — needs the 天子 in hand.
  const holdsEmperor = !!emperorCityId && cities[emperorCityId]?.ownerForceId === playerForceId;

  const [schemeId, setSchemeId] = useState<SchemeId>('tiger-wolf');
  const [targetA, setTargetA] = useState('');
  const [targetB, setTargetB] = useState('');
  const [result, setResult] = useState<string | null>(null);

  const def = SCHEME_DEFS.find((d) => d.id === schemeId)!;
  const strategist = useMemo(
    () => (playerForceId ? pickAdvisor(officers, playerForceId) : null),
    [officers, playerForceId],
  );
  const living = useMemo(() => {
    const alive = new Set(Object.values(cities).map((c) => c.ownerForceId).filter(Boolean) as string[]);
    return Object.values(forces).filter((f) => alive.has(f.id) && f.id !== playerForceId);
  }, [cities, forces, playerForceId]);

  const problem = playerForceId
    ? (schemeId === 'imperial-edict' && !holdsEmperor
        ? t('須挾天子方可假詔', 'Needs the Son of Heaven in hand')
        : targetA ? validateScheme(schemeId, cities, playerForceId, targetA, def.targets === 2 ? targetB || undefined : undefined, diplomacy) : t('選定目標', 'Pick a target'))
    : 'no force';
  const ready = !problem && targetA && (def.targets === 1 || targetB);
  // 抗謀/天命 — mirror the store's real odds (target counsel IQ; 造讖 rides
  // the target's mandate) so the shown 成算 matches what actually rolls.
  const counselIQ = (fid: string) => pickAdvisor(officers, fid)?.stats.intelligence ?? 50;
  const targetCounselIQ = targetA ? Math.max(counselIQ(targetA), targetB ? counselIQ(targetB) : 0) : undefined;
  const targetMandate = useGameStore((s) => (targetA ? s.mandate.byForce[targetA] ?? 50 : 50));
  const odds = ready ? schemeOdds(schemeId, diplomacy, strategist, targetA, targetB || undefined, targetCounselIQ, targetMandate) : null;

  const sel: React.CSSProperties = {
    background: '#080b0e', border: '1px solid #2b3845', color: '#e6c473',
    padding: '0.3rem', fontFamily: 'inherit', fontSize: '0.8rem', minWidth: 130,
  };

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'grid', placeItems: 'center', zIndex: 900, padding: '1rem' }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'linear-gradient(160deg,#1b2531,#10161e)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px',
          width: 'min(560px,100%)', color: '#e6edf3',
          fontFamily: 'var(--tkm-font-body)', padding: '1rem 1.3rem',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.7rem' }}>
          <div>
            <div style={{ fontSize: '1.2rem', color: '#e6c473', letterSpacing: '0.08rem' }}>🪄 {t('計略', 'Schemes')}</div>
            <div style={{ fontSize: '0.7rem', color: '#7a8893' }}>
              {strategist ? t(`${strategist.name.zh} 運籌(智${strategist.stats.intelligence})`, `${strategist.name.en} plans`) : t('無人運籌', 'No strategist')}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#e6c473', fontSize: '1.4rem', cursor: 'pointer' }}>×</button>
        </div>

        <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
          {SCHEME_DEFS.map((d) => (
            <button
              key={d.id}
              onClick={() => { setSchemeId(d.id); setResult(null); }}
              title={lang === 'en' ? d.hintEn : d.hintZh}
              style={{
                flex: 1, padding: '0.4rem 0.3rem', cursor: 'pointer', fontFamily: 'inherit',
                background: schemeId === d.id ? 'rgba(212,168,74,0.18)' : 'transparent',
                border: `1px solid ${schemeId === d.id ? '#e6c473' : '#26323e'}`,
                color: schemeId === d.id ? '#f2dd9a' : '#a08a60', fontSize: '0.85rem',
              }}
            >{d.zh}<div style={{ fontSize: '0.6rem', color: '#7a8893' }}>{d.goldCost}g</div></button>
          ))}
        </div>

        <div style={{ fontSize: '0.74rem', color: '#7a8893', marginBottom: 8 }}>{lang === 'en' ? def.hintEn : def.hintZh}</div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 10 }}>
          <select value={targetA} onChange={(e) => { setTargetA(e.target.value); setResult(null); }} style={sel}>
            <option value="">{def.targets === 2 ? t('甲…', 'Force A…') : schemeId === 'far-friend' ? t('結好對象…', 'Befriend…') : t('目標…', 'Target…')}</option>
            {living.map((f) => <option key={f.id} value={f.id}>{f.name.zh}</option>)}
          </select>
          {def.targets === 2 && (
            <>
              <span style={{ color: '#7a8893' }}>⚔</span>
              <select value={targetB} onChange={(e) => { setTargetB(e.target.value); setResult(null); }} style={sel}>
                <option value="">{t('乙…', 'Force B…')}</option>
                {living.filter((f) => f.id !== targetA).map((f) => <option key={f.id} value={f.id}>{f.name.zh}</option>)}
              </select>
            </>
          )}
          {odds != null && (
            <span style={{ fontSize: '0.85rem', color: odds > 0.5 ? '#9ed68a' : '#e8b070' }}>
              {t('成算', 'Odds')} {Math.round(odds * 100)}%
            </span>
          )}
        </div>

        {problem && targetA && <div style={{ fontSize: '0.74rem', color: '#ff9080', marginBottom: 8 }}>{problem}</div>}
        {result && <div style={{ fontSize: '0.8rem', color: '#f2dd9a', marginBottom: 8 }}>{result}</div>}

        <button
          disabled={!ready}
          onClick={() => {
            const r = executeScheme(schemeId, targetA, def.targets === 2 ? targetB : undefined);
            setResult(r.message);
          }}
          style={{
            width: '100%', padding: '0.5rem', cursor: ready ? 'pointer' : 'not-allowed',
            background: ready ? 'linear-gradient(180deg,#3a2d18,#2a1f10)' : 'transparent',
            border: `1px solid ${ready ? '#e6c473' : '#26323e'}`,
            color: ready ? '#f2dd9a' : '#5a4a35', fontFamily: 'inherit', letterSpacing: '0.08rem',
          }}
        >{t('施計', 'Execute')}({def.goldCost}g)</button>
      </div>
    </div>
  );
}
