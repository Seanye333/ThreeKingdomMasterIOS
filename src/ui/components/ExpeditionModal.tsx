import { useMemo, useState } from 'react';
import { useGameStore } from '../../game/state/store';
import { marchDurationFor } from '../../game/data/cities';
import {
  expeditionLegSeasons,
  expeditionSuccessChance,
  expeditionAptitude,
  expeditionPeril,
  expeditionXp,
} from '../../game/systems/expedition';
import {
  embassyTargets,
  embassyLegSeasons,
  embassyPeril,
  envoyCompetence,
  realmTradeIncome,
  type EmbassyTarget,
  type TargetRegion,
} from '../../game/systems/foreignRealm';
import { REGION_LABEL, FOREIGN_REALMS_BY_ID } from '../../game/data/foreignRealms';
import { ITEMS_BY_ID } from '../../game/data/items';
import type { ExpeditionMode } from '../../game/types';
import { playSfx } from '../../game/systems/sound';
import { useLanguage, useT } from '../i18n';
import { Modal } from './Modal';

/**
 * 游历 — send one officer roaming. Two tabs:
 *  · 城池 — a nearby errand to a map city (探索/出使/策反/刺探).
 *  · 異域 — a long-range 遠使 embassy to a distant historical land (西域/倭/大秦…)
 *    or a border tribe (匈奴/南蠻…), for trade wealth, exotica, auxiliaries,
 *    prestige, and pacifying the frontier.
 */
const MODES: Array<{ id: ExpeditionMode; zh: string; en: string; descZh: string; descEn: string; foreign: boolean; icon: string }> = [
  { id: 'explore', zh: '探索', en: 'Explore', descZh: '探查虛實,或訪賢、奇遇、攜民心歸', descEn: 'Scout a city; maybe find talent, a windfall, or goodwill', foreign: false, icon: '🧭' },
  { id: 'envoy', zh: '出使', en: 'Envoy', descZh: '出使他國,睦鄰修好', descEn: 'Warm relations with a rival power', foreign: true, icon: '🕊️' },
  { id: 'subvert', zh: '策反', en: 'Subvert', descZh: '潛入策反敵將來投(高風險)', descEn: 'Turn an enemy officer to your side (risky)', foreign: true, icon: '🎭' },
  { id: 'infiltrate', zh: '刺探', en: 'Infiltrate', descZh: '細探虛實,伺機破壞(有被擒之險)', descEn: 'Deep intel + a chance to sabotage (capture risk)', foreign: true, icon: '🕵️' },
];

export function ExpeditionModal({ fromCityId, onClose }: { fromCityId: string; onClose: () => void }) {
  const t = useT();
  const cities = useGameStore((s) => s.cities);
  const officers = useGameStore((s) => s.officers);
  const playerForceId = useGameStore((s) => s.playerForceId);

  const from = cities[fromCityId];
  const [tab, setTab] = useState<'city' | 'far'>('city');

  const roamers = useMemo(
    () => Object.values(officers)
      .filter((o) => o.forceId === playerForceId && o.locationCityId === fromCityId && (o.status === 'idle' || o.status === 'active') && !o.task)
      .sort((a, b) => b.stats.intelligence + b.stats.charisma - (a.stats.intelligence + a.stats.charisma)),
    [officers, playerForceId, fromCityId],
  );

  if (!from || roamers.length === 0) {
    return (
      <Modal onClose={onClose} icon="🧭" title={t('游历', 'Expedition')} width="min(440px, 100%)">
        <div style={{ color: '#7a8893', fontSize: '0.86rem', padding: '1rem 0' }}>{t('此城無閒置武將可遣。', 'No idle officer here to send.')}</div>
      </Modal>
    );
  }

  return (
    <Modal onClose={onClose} icon="🧭" title={t('游历', 'Expedition')} badge={t(`自 ${from.name.zh}`, `from ${from.name.en}`)} width="min(500px, 100%)">
      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: '0.8rem' }}>
        {(['city', 'far'] as const).map((id) => {
          const active = tab === id;
          return (
            <button
              key={id}
              onClick={() => setTab(id)}
              style={{
                flex: 1, padding: '0.4rem', borderRadius: 5, cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.84rem',
                background: active ? 'linear-gradient(180deg, rgba(230,196,115,0.2), rgba(230,196,115,0.06))' : '#10161e',
                border: `1px solid ${active ? '#e6c473' : '#26323e'}`,
                color: active ? '#f2dd9a' : '#aab6c0',
              }}
            >
              {id === 'city' ? t('🧭 城池游历', '🧭 City errand') : t('🐫 遠使異域', '🐫 Far embassy')}
            </button>
          );
        })}
      </div>

      {tab === 'city'
        ? <CityErrandView fromCityId={fromCityId} roamers={roamers} onClose={onClose} />
        : <FarEmbassyView fromCityId={fromCityId} roamers={roamers} onClose={onClose} />}
    </Modal>
  );
}

type Roamer = import('../../game/types').Officer;

function CityErrandView({ fromCityId, roamers, onClose }: { fromCityId: string; roamers: Roamer[]; onClose: () => void }) {
  const t = useT();
  const lang = useLanguage();
  const cities = useGameStore((s) => s.cities);
  const officers = useGameStore((s) => s.officers);
  const date = useGameStore((s) => s.date);
  const playerForceId = useGameStore((s) => s.playerForceId);
  const forces = useGameStore((s) => s.forces);
  const dispatchExpedition = useGameStore((s) => s.dispatchExpedition);

  const from = cities[fromCityId];
  const [mode, setMode] = useState<ExpeditionMode>('explore');
  const [officerId, setOfficerId] = useState(roamers[0]?.id ?? '');
  const officer = officers[officerId] && roamers.some((o) => o.id === officerId) ? officers[officerId] : roamers[0];

  const foreignOnly = MODES.find((m) => m.id === mode)?.foreign ?? false;
  const dests = useMemo(
    () => Object.values(cities)
      .filter((c) => c.id !== fromCityId && (foreignOnly ? (c.ownerForceId != null && c.ownerForceId !== playerForceId) : true))
      .sort((a, b) => (from?.adjacentCityIds.includes(b.id) ? 1 : 0) - (from?.adjacentCityIds.includes(a.id) ? 1 : 0) || a.name.zh.localeCompare(b.name.zh)),
    [cities, fromCityId, foreignOnly, playerForceId, from],
  );
  const [destId, setDestId] = useState(dests[0]?.id ?? '');
  const dest = cities[destId] && dests.some((c) => c.id === destId) ? cities[destId] : dests[0];

  const leg = officer && dest ? expeditionLegSeasons(Math.max(1, marchDurationFor(from, dest, date.season)), officer) : 0;
  const targetForceId = dest?.ownerForceId ?? null;
  const ruler = targetForceId ? forces[targetForceId]?.rulerOfficerId : undefined;
  const marks = dest
    ? Object.values(officers).filter((o) => o.locationCityId === dest.id && o.forceId === targetForceId && o.id !== ruler && (o.status === 'idle' || o.status === 'active'))
    : [];
  const easiestLoyalty = marks.length ? Math.min(...marks.map((o) => o.loyalty)) : 60;
  const chance = officer ? expeditionSuccessChance(officer, mode, easiestLoyalty) : 0;
  const peril = officer ? expeditionPeril(officer, mode) : 0;
  const apt = officer ? Math.round(expeditionAptitude(officer, mode)) : 0;

  const send = () => {
    if (!officer || !dest) return;
    const r = dispatchExpedition(officer.id, fromCityId, dest.id, mode);
    if (r.ok) { playSfx('coin'); onClose(); }
  };

  const ownerLabel = (c: { ownerForceId: import('../../game/types').EntityId | null }) => {
    if (!c.ownerForceId) return t('在野', 'wild');
    if (c.ownerForceId === playerForceId) return t('我', 'ours');
    const f = forces[c.ownerForceId];
    return f ? (lang === 'en' ? f.name.en : f.name.zh) : '?';
  };

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: '0.7rem' }}>
        {MODES.map((m) => {
          const active = m.id === mode;
          return (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              title={lang === 'en' ? m.descEn : m.descZh}
              style={{
                textAlign: 'left', padding: '0.4rem 0.55rem', borderRadius: 5, cursor: 'pointer', fontFamily: 'inherit',
                background: active ? 'linear-gradient(180deg, rgba(230,196,115,0.2), rgba(230,196,115,0.06))' : '#10161e',
                border: `1px solid ${active ? '#e6c473' : '#26323e'}`,
                color: active ? '#f2dd9a' : '#aab6c0',
              }}
            >
              <div style={{ fontSize: '0.84rem' }}>{m.icon} {lang === 'en' ? m.en : m.zh}{m.foreign && <span style={{ color: '#7a8893', fontSize: '0.66rem' }}> · {t('他國', 'foreign')}</span>}</div>
              <div style={{ fontSize: '0.64rem', color: '#7a8893', lineHeight: 1.3, marginTop: 2 }}>{lang === 'en' ? m.descEn : m.descZh}</div>
            </button>
          );
        })}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: '0.8rem' }}>
        <label style={{ display: 'grid', gridTemplateColumns: '3.4rem 1fr', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: '0.78rem', color: '#7a8893' }}>{t('遣將', 'Officer')}</span>
          <select value={officer?.id ?? ''} onChange={(e) => setOfficerId(e.target.value)} style={selectStyle}>
            {roamers.map((o) => (
              <option key={o.id} value={o.id}>
                {(lang === 'en' ? o.name.en : o.name.zh)} · {t('智', 'INT')}{o.stats.intelligence} · {t('魅', 'CHA')}{o.stats.charisma} · {t('政', 'POL')}{o.stats.politics}
              </option>
            ))}
          </select>
        </label>
        <label style={{ display: 'grid', gridTemplateColumns: '3.4rem 1fr', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: '0.78rem', color: '#7a8893' }}>{t('目的地', 'To')}</span>
          {dests.length === 0 ? (
            <span style={{ fontSize: '0.78rem', color: '#e0a070' }}>{t('無可往之處', 'nowhere to go')}</span>
          ) : (
            <select value={dest?.id ?? ''} onChange={(e) => setDestId(e.target.value)} style={selectStyle}>
              {dests.map((c) => (
                <option key={c.id} value={c.id}>
                  {(lang === 'en' ? c.name.en : c.name.zh)} · {ownerLabel(c)}{from.adjacentCityIds.includes(c.id) ? t(' · 鄰', ' · adj') : ''}
                </option>
              ))}
            </select>
          )}
        </label>
      </div>

      {officer && dest && (
        <div style={infoBox}>
          <div>{t(`來回約 ${leg * 2} 旬`, `≈ ${leg * 2} seasons round trip`)} · {t('適性', 'aptitude')} {apt} · {t('歷練', 'XP')} +{expeditionXp(mode, leg)}</div>
          {mode !== 'envoy' && (
            <div>
              {t('成事機率', 'success')} <span style={{ color: chance > 0.6 ? '#9ad6a8' : chance > 0.35 ? '#e6c473' : '#e0707a' }}>{Math.round(chance * 100)}%</span>
              {(mode === 'subvert' || mode === 'infiltrate') && (
                <> · {t('被擒之險', 'capture risk')} <span style={{ color: peril > 0.3 ? '#e0707a' : '#e6c473' }}>{Math.round(peril * 100)}%</span></>
              )}
              {mode === 'subvert' && marks.length > 0 && <span style={{ color: '#7a8893' }}> · {t(`守將最易動者忠 ${easiestLoyalty}`, `softest officer loy ${easiestLoyalty}`)}</span>}
              {mode === 'subvert' && marks.length === 0 && <span style={{ color: '#e0a070' }}> · {t('此城無可策反之將', 'no officer to turn here')}</span>}
            </div>
          )}
        </div>
      )}

      <button onClick={send} disabled={!officer || !dest} style={sendBtn(!!officer && !!dest)}>
        {t('遣行', 'Send forth')}
      </button>
    </>
  );
}

function FarEmbassyView({ fromCityId, roamers, onClose }: { fromCityId: string; roamers: Roamer[]; onClose: () => void }) {
  const t = useT();
  const lang = useLanguage();
  const officers = useGameStore((s) => s.officers);
  const cities = useGameStore((s) => s.cities);
  const date = useGameStore((s) => s.date);
  const dispatchEmbassy = useGameStore((s) => s.dispatchEmbassy);
  const openedRealms = useGameStore((s) => s.openedRealms);
  const realmRelations = useGameStore((s) => s.realmRelations);

  const [officerId, setOfficerId] = useState(roamers[0]?.id ?? '');
  const officer = officers[officerId] && roamers.some((o) => o.id === officerId) ? officers[officerId] : roamers[0];

  const targets = useMemo(() => embassyTargets(date.year), [date.year]);
  const byRegion = useMemo(() => {
    const groups: Record<string, EmbassyTarget[]> = {};
    for (const tg of targets) (groups[tg.region] ??= []).push(tg);
    return groups;
  }, [targets]);
  const [realmId, setRealmId] = useState(targets[0]?.id ?? '');
  const target = targets.find((tg) => tg.id === realmId) ?? targets[0];

  const leg = officer && target ? embassyLegSeasons(target, officer) : 0;
  const peril = officer && target ? embassyPeril(target, officer) : 0;
  const comp = officer ? Math.round(envoyCompetence(officer)) : 0;
  const realm = target && !target.isTribe ? (FOREIGN_REALMS_BY_ID[target.id]?.reward ?? null) : null;

  const send = () => {
    if (!officer || !target) return;
    const r = dispatchEmbassy(officer.id, fromCityId, target.id);
    if (r.ok) { playSfx('coin'); onClose(); }
  };

  const REGION_ORDER: TargetRegion[] = ['xiyu', 'dongyi', 'nanhai', 'jiyuan', 'tribe'];
  const regionName = (r: string) =>
    r === 'tribe' ? t('邊疆異族', 'Frontier tribes') : (lang === 'en' ? REGION_LABEL[r as keyof typeof REGION_LABEL].en : REGION_LABEL[r as keyof typeof REGION_LABEL].zh);

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: '0.7rem' }}>
        <label style={{ display: 'grid', gridTemplateColumns: '3.4rem 1fr', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: '0.78rem', color: '#7a8893' }}>{t('遣使', 'Envoy')}</span>
          <select value={officer?.id ?? ''} onChange={(e) => setOfficerId(e.target.value)} style={selectStyle}>
            {roamers.map((o) => (
              <option key={o.id} value={o.id}>
                {(lang === 'en' ? o.name.en : o.name.zh)} · {t('魅', 'CHA')}{o.stats.charisma} · {t('政', 'POL')}{o.stats.politics} · {t('智', 'INT')}{o.stats.intelligence}
              </option>
            ))}
          </select>
        </label>
        <label style={{ display: 'grid', gridTemplateColumns: '3.4rem 1fr', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: '0.78rem', color: '#7a8893' }}>{t('遠邦', 'Realm')}</span>
          <select value={target?.id ?? ''} onChange={(e) => setRealmId(e.target.value)} style={selectStyle}>
            {REGION_ORDER.filter((r) => byRegion[r]?.length).map((r) => (
              <optgroup key={r} label={regionName(r)}>
                {byRegion[r].map((tg) => (
                  <option key={tg.id} value={tg.id}>{(lang === 'en' ? tg.name.en : tg.name.zh)}{openedRealms?.[tg.id] ? ' ✓' : ''}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>
      </div>

      {target && (
        <div style={infoBox}>
          <div style={{ color: '#cdd8e0' }}>{lang === 'en' ? target.blurb : target.blurbZh}</div>
          {!target.isTribe && (() => {
            const rel = realmRelations?.[target.id] ?? 0;
            return (
              <div>
                {t('遠邦關係', 'relation')} <span style={{ color: rel >= 60 ? '#9ad6a8' : rel >= 25 ? '#e6c473' : '#7a8893' }}>{rel}/100</span>
                {rel > 0 && <span style={{ color: '#7a8893' }}> · {t('交誼漸篤,使途愈安、所獲愈厚', 'warmer ties: safer road, richer haul')}</span>}
              </div>
            );
          })()}
          {officer && (
            <div>
              {t(`來回約 ${leg * 2} 旬`, `≈ ${leg * 2} seasons round trip`)} · {t('使才', 'envoy skill')} {comp} · {t('歷練', 'XP')} +{expeditionXp('embassy', leg)}
              {' · '}{t('途中之險', 'road peril')} <span style={{ color: peril > 0.35 ? '#e0707a' : peril > 0.2 ? '#e6c473' : '#9ad6a8' }}>{Math.round(peril * 100)}%</span>
              {target.danger >= 0.45 && <span style={{ color: '#e0707a' }}> · {t('或殞於道', 'death possible')}</span>}
            </div>
          )}
          <div style={{ color: '#7a8893' }}>
            {target.isTribe
              ? t('回報:安撫邊患(止其侵擾)· 外族義從 · 貢金 · 或招其酋', 'Reward: placate raids · auxiliaries · tribute · maybe win the chieftain')
              : <>
                  {t('回報', 'Reward')}:
                  {realm?.gold && ` ${t('金', 'gold')}${realm.gold[0]}–${realm.gold[1]}`}
                  {realm?.auxTroops && ` · ${t('異域兵', 'aux')}${realm.auxTroops[0]}–${realm.auxTroops[1]}`}
                  {realm?.prestige ? ` · ${t('天命', 'prestige')}+${realm.prestige}` : ''}
                  {realm?.itemIds?.length ? ` · ${t('奇珍', 'treasure')} ${realm.itemIds.map((id) => (lang === 'en' ? ITEMS_BY_ID[id]?.name.en : ITEMS_BY_ID[id]?.name.zh) ?? id).join('/')}` : ''}
                </>}
          </div>
        </div>
      )}

      {target && !target.isTribe && (
        <div style={{ fontSize: '0.68rem', color: openedRealms?.[target.id] ? '#9ad6a8' : '#7a8893', marginBottom: '0.5rem' }}>
          {openedRealms?.[target.id]
            ? t(`✓ 已通商:絲路商隊每季入金 ${realmTradeIncome(target.id)}`, `✓ Trade open: caravan yields ${realmTradeIncome(target.id)} gold/season`)
            : t(`通成則開絲路商路(每季約 +${realmTradeIncome(target.id)} 金)`, `A clean embassy opens a caravan (~+${realmTradeIncome(target.id)} gold/season)`)}
        </div>
      )}

      {Object.keys(openedRealms ?? {}).length > 0 && (
        <div style={{ fontSize: '0.66rem', color: '#7a8893', marginBottom: '0.6rem', lineHeight: 1.5 }}>
          {t('已通商路', 'Caravans')}: {Object.entries(openedRealms).map(([rid, cid]) => {
            const rn = embassyTargets(date.year).find((tt) => tt.id === rid);
            const c = cities[cid];
            return rn ? `${lang === 'en' ? rn.name.en : rn.name.zh}${c ? `←${lang === 'en' ? c.name.en : c.name.zh}` : ''}` : null;
          }).filter(Boolean).join(' · ')}
        </div>
      )}

      <button onClick={send} disabled={!officer || !target} style={sendBtn(!!officer && !!target)}>
        {t('遣使遠行', 'Send the embassy')}
      </button>
    </>
  );
}

const selectStyle = {
  background: '#080b0e', border: '1px solid #2b3845', color: '#e6c473',
  padding: '0.3rem 0.4rem', fontFamily: 'inherit', fontSize: '0.82rem', borderRadius: 4,
} as const;

const infoBox = {
  fontSize: '0.76rem', color: '#aab6c0', marginBottom: '0.8rem', lineHeight: 1.8,
  background: '#10161e', border: '1px solid #1d2731', borderRadius: 4, padding: '0.4rem 0.6rem',
} as const;

const sendBtn = (enabled: boolean) => ({
  width: '100%', padding: '0.5rem', borderRadius: 6, cursor: enabled ? 'pointer' : 'default',
  fontFamily: 'inherit', fontSize: '0.92rem', letterSpacing: '0.1rem',
  background: enabled ? 'linear-gradient(180deg, rgba(230,196,115,0.22), rgba(230,196,115,0.08))' : '#1b2531',
  border: `1px solid ${enabled ? '#e6c473' : '#2b3845'}`,
  color: enabled ? '#f2dd9a' : '#5f6c76',
}) as const;
