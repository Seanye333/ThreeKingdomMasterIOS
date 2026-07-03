import { useMemo, useState } from 'react';
import { useEscapeKey } from '../hooks/useEscapeKey';
import { useGameStore } from '../../game/state/store';
import { MANDATE_LABEL } from '../../game/systems/mandate';
import { SUBURBAN_RITE_GOLD, SUBURBAN_RITE_FOOD, RAIN_RITE_GOLD } from '../../game/systems/mandateRituals';
import { isCultForce, CULT_PACIFY_GOLD, PACIFY_MISSION_COST } from '../../game/systems/religion';
import { useT, useLanguage, pickName } from '../i18n';

/** §8.5 祭天禮 + §8.4-deep 安民 — the court's ritual & pacification desk:
 *  郊祀(yearly mandate rite)、祈雨(break a drought)、招安(talk a cult
 *  down, 張魯 model)、宣撫(post an envoy against the contagion). */
export function RitesModal({ onClose }: { onClose: () => void }) {
  useEscapeKey(onClose);
  const t = useT();
  const lang = useLanguage();
  const playerForceId = useGameStore((s) => s.playerForceId);
  const forces = useGameStore((s) => s.forces);
  const cities = useGameStore((s) => s.cities);
  const officers = useGameStore((s) => s.officers);
  const weather = useGameStore((s) => s.weather);
  const mandateVal = useGameStore((s) => (s.playerForceId ? s.mandate.byForce[s.playerForceId] ?? 50 : 50));
  const lastRiteYear = useGameStore((s) => s.lastSuburbanRiteYear);
  const year = useGameStore((s) => s.date.year);
  const rainRiteDone = useGameStore((s) => s.rainRiteDone);
  const pacifyMissions = useGameStore((s) => s.pacifyMissions ?? {});
  const performImperialRite = useGameStore((s) => s.performImperialRite);
  const prayForRain = useGameStore((s) => s.prayForRain);
  const pacifyCultForce = useGameStore((s) => s.pacifyCultForce);
  const dispatchPacifyMission = useGameStore((s) => s.dispatchPacifyMission);

  const [msg, setMsg] = useState<string | null>(null);
  const [cultId, setCultId] = useState('');
  const [envoyId, setEnvoyId] = useState('');
  const [pacifierId, setPacifierId] = useState('');
  const [pacifyCityId, setPacifyCityId] = useState('');

  const cults = useMemo(
    () => Object.values(forces).filter((f) =>
      isCultForce(f.id) && Object.values(cities).some((c) => c.ownerForceId === f.id)),
    [forces, cities],
  );
  const idleOfficers = useMemo(
    () => Object.values(officers)
      .filter((o) => o.forceId === playerForceId && o.status === 'idle' && !pacifyMissions[o.id])
      .sort((a, b) => b.stats.charisma - a.stats.charisma),
    [officers, playerForceId, pacifyMissions],
  );
  const ownCities = useMemo(
    () => Object.values(cities).filter((c) => c.ownerForceId === playerForceId),
    [cities, playerForceId],
  );

  const label = MANDATE_LABEL(mandateVal);
  const sect: React.CSSProperties = {
    marginBottom: 12, padding: '0.6rem 0.8rem',
    background: 'rgba(255,255,255,0.03)', border: '1px solid #26323e',
  };
  const btn: React.CSSProperties = {
    padding: '0.35rem 0.8rem', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.82rem',
    background: 'rgba(212,168,74,0.12)', border: '1px solid #e6c473', color: '#f2dd9a',
  };
  const sel: React.CSSProperties = {
    background: '#080b0e', border: '1px solid #2b3845', color: '#e6c473',
    padding: '0.3rem', fontFamily: 'inherit', fontSize: '0.8rem', minWidth: 120,
  };

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'grid', placeItems: 'center', zIndex: 900, padding: '1rem' }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'linear-gradient(160deg,#1b2531,#10161e)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 'var(--tkm-radius-lg)',
          width: 'min(600px,100%)', maxHeight: '80vh', overflowY: 'auto',
          color: '#e6edf3', fontFamily: 'var(--tkm-font-body)', padding: '1rem 1.3rem',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.6rem' }}>
          <div>
            <div style={{ fontSize: '1.2rem', color: '#e6c473', letterSpacing: '0.08rem' }}>⛩ {t('祭祀・安民', 'Rites & Pacification')}</div>
            <div style={{ fontSize: '0.72rem', color: '#7a8893' }}>
              {t(`當前天命 ${mandateVal}(${label.zh})`, `Mandate ${mandateVal} (${label.en})`)}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#e6c473', fontSize: '1.4rem', cursor: 'pointer' }}>×</button>
        </div>

        {/* §8.5 郊祀 */}
        <div style={sect}>
          <div style={{ fontSize: '0.95rem', color: '#f2dd9a', marginBottom: 4 }}>🔥 {t('郊祀祭天', 'Suburban Sacrifice')}</div>
          <div style={{ fontSize: '0.75rem', color: '#97a4ae', marginBottom: 6 }}>
            {t(`築壇燔柴,昭告天命 — 歲行一次,天命 +6~10(挾天子再 +4)。費金 ${SUBURBAN_RITE_GOLD}、糧 ${SUBURBAN_RITE_FOOD}。`,
               `Once a year: mandate +6–10 (+4 with the Emperor). Costs ${SUBURBAN_RITE_GOLD}g + ${SUBURBAN_RITE_FOOD} food.`)}
          </div>
          <button
            style={{ ...btn, opacity: lastRiteYear === year ? 0.45 : 1 }}
            disabled={lastRiteYear === year}
            onClick={() => setMsg(performImperialRite().message)}
          >{lastRiteYear === year ? t('今年已祭', 'Done this year') : t('行郊祀', 'Perform the rite')}</button>
        </div>

        {/* §8.5 祈雨 */}
        <div style={sect}>
          <div style={{ fontSize: '0.95rem', color: '#9ad6e8', marginBottom: 4 }}>🌧 {t('祈雨', 'Rain Prayer')}</div>
          <div style={{ fontSize: '0.75rem', color: '#97a4ae', marginBottom: 6 }}>
            {weather.kind === 'drought'
              ? t(`旱魃為虐 — 以最善禮法之臣主祭,成則旱解民悅(費金 ${RAIN_RITE_GOLD},每季一次)。`,
                  `A drought grips the land. Success breaks it outright (${RAIN_RITE_GOLD}g, once a season).`)
              : t('非旱之年,無雨可祈。', 'No drought — nothing to pray against.')}
          </div>
          <button
            style={{ ...btn, borderColor: '#9ad6e8', color: '#bde8f4', opacity: weather.kind !== 'drought' || rainRiteDone ? 0.45 : 1 }}
            disabled={weather.kind !== 'drought' || rainRiteDone}
            onClick={() => setMsg(prayForRain().message)}
          >{rainRiteDone ? t('本季已禱', 'Prayed this season') : t('築壇祈雨', 'Pray for rain')}</button>
        </div>

        {/* §8.4-deep 招安 */}
        <div style={sect}>
          <div style={{ fontSize: '0.95rem', color: '#e8c060', marginBottom: 4 }}>🕯 {t('招安邪教', 'Pacify a Sect')}</div>
          <div style={{ fontSize: '0.75rem', color: '#97a4ae', marginBottom: 6 }}>
            {cults.length === 0
              ? t('域內無揭竿之教眾。', 'No cult banner flies at present.')
              : t(`遣能言之士單車入營,說其歸命(張魯故事)— 成則舉城來歸、教主入仕;敗則賊勢愈熾,使者或遭扣押。費金 ${CULT_PACIFY_GOLD}。`,
                  `Send a silver tongue to talk the sect down (the Zhang Lu model). Costs ${CULT_PACIFY_GOLD}g.`)}
          </div>
          {cults.length > 0 && (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <select value={cultId} onChange={(e) => setCultId(e.target.value)} style={sel}>
                <option value="">{t('教眾…', 'Sect…')}</option>
                {cults.map((f) => <option key={f.id} value={f.id}>{f.name.zh}</option>)}
              </select>
              <select value={envoyId} onChange={(e) => setEnvoyId(e.target.value)} style={sel}>
                <option value="">{t('使者…', 'Envoy…')}</option>
                {idleOfficers.map((o) => (
                  <option key={o.id} value={o.id}>{pickName(o.name, lang)}(魅{o.stats.charisma})</option>
                ))}
              </select>
              <button
                style={{ ...btn, opacity: !cultId || !envoyId ? 0.45 : 1 }}
                disabled={!cultId || !envoyId}
                onClick={() => setMsg(pacifyCultForce(cultId, envoyId).message)}
              >{t('遣使招安', 'Send the envoy')}</button>
            </div>
          )}
        </div>

        {/* §8.4-deep 宣撫 */}
        <div style={sect}>
          <div style={{ fontSize: '0.95rem', color: '#8ad6a0', marginBottom: 4 }}>🏮 {t('宣撫安民', 'Pacification Mission')}</div>
          <div style={{ fontSize: '0.75rem', color: '#97a4ae', marginBottom: 6 }}>
            {t(`遣官駐城開倉講道 — 兩季之內,邪教蔓延難侵其城,亦不舉城而叛(魅力愈高愈固)。費金 ${PACIFY_MISSION_COST}。`,
               `Post an officer to a threatened city: cult contagion is blunted there for 2 seasons. ${PACIFY_MISSION_COST}g.`)}
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <select value={pacifierId} onChange={(e) => setPacifierId(e.target.value)} style={sel}>
              <option value="">{t('宣撫使…', 'Officer…')}</option>
              {idleOfficers.map((o) => (
                <option key={o.id} value={o.id}>{pickName(o.name, lang)}(魅{o.stats.charisma})</option>
              ))}
            </select>
            <select value={pacifyCityId} onChange={(e) => setPacifyCityId(e.target.value)} style={sel}>
              <option value="">{t('駐城…', 'City…')}</option>
              {ownCities.map((c) => (
                <option key={c.id} value={c.id}>{pickName(c.name, lang)}(忠{c.loyalty})</option>
              ))}
            </select>
            <button
              style={{ ...btn, borderColor: '#8ad6a0', color: '#aef0c0', opacity: !pacifierId || !pacifyCityId ? 0.45 : 1 }}
              disabled={!pacifierId || !pacifyCityId}
              onClick={() => setMsg(dispatchPacifyMission(pacifierId, pacifyCityId).message)}
            >{t('遣使宣撫', 'Dispatch')}</button>
          </div>
          {Object.keys(pacifyMissions).length > 0 && (
            <div style={{ fontSize: '0.72rem', color: '#8ad6a0', marginTop: 6 }}>
              {Object.entries(pacifyMissions).map(([oid, m]) => (
                <div key={oid}>
                  {pickName(officers[oid]?.name ?? { zh: oid, en: oid }, lang)} → {pickName(cities[m.cityId]?.name ?? { zh: m.cityId, en: m.cityId }, lang)}({t(`餘 ${m.seasonsLeft} 季`, `${m.seasonsLeft} season(s) left`)})
                </div>
              ))}
            </div>
          )}
        </div>

        {msg && <div style={{ fontSize: '0.82rem', color: '#f2dd9a', padding: '0.3rem 0' }}>{msg}</div>}
      </div>
    </div>
  );
}
