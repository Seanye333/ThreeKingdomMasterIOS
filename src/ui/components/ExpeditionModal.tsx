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
  realmTitle,
  realmAidProfile,
  isHorseRealm,
  realmTradeHorses,
  type EmbassyTarget,
  type TargetRegion,
} from '../../game/systems/foreignRealm';
import { REGION_LABEL, FOREIGN_REALMS_BY_ID } from '../../game/data/foreignRealms';
import { ITEMS_BY_ID } from '../../game/data/items';
import type { ExpeditionMode } from '../../game/types';
import { playSfx } from '../../game/systems/sound';
import { useLanguage, useT } from '../i18n';
import { Modal } from './Modal';
import { EmptyState } from './EmptyState';

/**
 * 游历 — send one officer roaming. Two tabs:
 *  · 城池 — a nearby errand to a map city (探索/出使/策反/刺探).
 *  · 異域 — a long-range 遠使 embassy to a distant historical land (西域/倭/大秦…)
 *    or a border tribe (匈奴/南蠻…), for trade wealth, exotica, auxiliaries,
 *    prestige, and pacifying the frontier.
 */
const MODES: Array<{ id: ExpeditionMode; zh: string; en: string; descZh: string; descEn: string; foreign: boolean; target: 'foreign' | 'own' | 'any'; icon: string }> = [
  { id: 'explore', zh: '探索', en: 'Explore', descZh: '探查虛實,或訪賢、奇遇、攜民心歸', descEn: 'Scout a city; maybe find talent, a windfall, or goodwill', foreign: false, target: 'any', icon: '🧭' },
  { id: 'recruit', zh: '訪賢', en: 'Court Sage', descZh: '三顧茅廬:專程拜訪在野賢才(高才需累積誠意)', descEn: 'Court a known wanderer (legends need repeated visits)', foreign: false, target: 'any', icon: '📜' },
  { id: 'tour', zh: '巡視', en: 'Tour', descZh: '巡視自家城池,升民心、察貳心', descEn: 'Tour your own city — loyalty + sniff out disaffection', foreign: false, target: 'own', icon: '🏯' },
  { id: 'levy', zh: '募兵', en: 'Levy', descZh: '於自家遠城募兵引歸', descEn: 'Raise troops at a far city of yours', foreign: false, target: 'own', icon: '🚩' },
  { id: 'treasure', zh: '尋寶', en: 'Treasure', descZh: '訪古探幽:於古戰場/陵墓/名山尋神兵寶馬(有負傷、殞命之險)', descEn: 'Hunt an old site for relics & warhorses (real peril of wound/death)', foreign: false, target: 'any', icon: '💎' },
  { id: 'study', zh: '游學', en: 'Study', descZh: '訪師問道:游學於名城,歸來長屬性、或得秘笈', descEn: 'Study at a famed city — the officer grows in skill', foreign: false, target: 'any', icon: '📖' },
  { id: 'incognito', zh: '微服', en: 'Incognito', descZh: '明察暗訪:微服私訪(自境:升民心+揪貳心;敵境:深探+被識之險)', descEn: 'Travel in disguise (own land: loyalty + expose a bad official; abroad: deep intel, capture risk)', foreign: false, target: 'any', icon: '🕶️' },
  { id: 'envoy', zh: '出使', en: 'Envoy', descZh: '出使他國,睦鄰修好', descEn: 'Warm relations with a rival power', foreign: true, target: 'foreign', icon: '🕊️' },
  { id: 'befriend', zh: '結交', en: 'Befriend', descZh: '結交敵將,暖其心(為日後策反鋪路)', descEn: "Befriend a rival's officer (eases a later turn)", foreign: true, target: 'foreign', icon: '🤝' },
  { id: 'subvert', zh: '策反', en: 'Subvert', descZh: '潛入策反敵將來投(高風險)', descEn: 'Turn an enemy officer to your side (risky)', foreign: true, target: 'foreign', icon: '🎭' },
  { id: 'infiltrate', zh: '刺探', en: 'Infiltrate', descZh: '細探虛實,伺機破壞(有被擒之險)', descEn: 'Deep intel + a chance to sabotage (capture risk)', foreign: true, target: 'foreign', icon: '🕵️' },
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
        <EmptyState icon="🐎" title={t('此城無閒置武將可遣。', 'No idle officer here to send.')} />
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
                flex: 1, padding: '0.4rem', borderRadius: 'var(--tkm-radius-sm)', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.84rem',
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

  const target = MODES.find((m) => m.id === mode)?.target ?? 'any';
  const dests = useMemo(
    () => Object.values(cities)
      .filter((c) => {
        if (c.id === fromCityId) return false;
        if (target === 'foreign') return c.ownerForceId != null && c.ownerForceId !== playerForceId;
        if (target === 'own') return c.ownerForceId === playerForceId;
        return true;
      })
      .sort((a, b) => (from?.adjacentCityIds.includes(b.id) ? 1 : 0) - (from?.adjacentCityIds.includes(a.id) ? 1 : 0) || a.name.zh.localeCompare(b.name.zh)),
    [cities, fromCityId, target, playerForceId, from],
  );
  const [destId, setDestId] = useState(dests[0]?.id ?? '');
  const dest = cities[destId] && dests.some((c) => c.id === destId) ? cities[destId] : dests[0];
  // 護衛 — an optional second officer (own, idle, in this city, not the envoy).
  const [companionId, setCompanionId] = useState('');
  const escorts = useMemo(
    () => roamers.filter((o) => o.id !== officerId),
    [roamers, officerId],
  );

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
    const r = dispatchExpedition(officer.id, fromCityId, dest.id, mode, companionId || undefined);
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
                textAlign: 'left', padding: '0.4rem 0.55rem', borderRadius: 'var(--tkm-radius-sm)', cursor: 'pointer', fontFamily: 'inherit',
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
          <span style={{ fontSize: '0.78rem', color: '#7a8893' }}>{t('護衛', 'Escort')}</span>
          <select value={companionId} onChange={(e) => setCompanionId(e.target.value)} style={selectStyle} title={t('帶一名護衛同行 → 降被擒之險、共享歷練', 'Bring a guard → lower capture risk, shared XP')}>
            <option value="">{t('（無,單騎)', '(none, ride alone)')}</option>
            {escorts.map((o) => (
              <option key={o.id} value={o.id}>{(lang === 'en' ? o.name.en : o.name.zh)} · {t('武', 'WAR')}{o.stats.war}</option>
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
  const forces = useGameStore((s) => s.forces);
  const date = useGameStore((s) => s.date);
  const playerForceId = useGameStore((s) => s.playerForceId);
  const dispatchEmbassy = useGameStore((s) => s.dispatchEmbassy);
  const designateProtectorate = useGameStore((s) => s.designateProtectorate);
  const stationEnvoy = useGameStore((s) => s.stationEnvoy);
  const recallEnvoy = useGameStore((s) => s.recallEnvoy);
  const summonRealmAid = useGameStore((s) => s.summonRealmAid);
  const setRealmTradeMode = useGameStore((s) => s.setRealmTradeMode);
  const openedRealms = useGameStore((s) => s.openedRealms);
  const realmRelations = useGameStore((s) => s.realmRelations);
  const realmPatron = useGameStore((s) => s.realmPatron);
  const realmRouteDisruption = useGameStore((s) => s.realmRouteDisruption);
  const residentEnvoys = useGameStore((s) => s.residentEnvoys);
  const protectorateCityId = useGameStore((s) => s.protectorateCityId);
  const realmHostility = useGameStore((s) => s.realmHostility);
  const realmTradeModeMap = useGameStore((s) => s.realmTradeMode);

  const [officerId, setOfficerId] = useState(roamers[0]?.id ?? '');
  const officer = officers[officerId] && roamers.some((o) => o.id === officerId) ? officers[officerId] : roamers[0];
  // §7.7 ② 遠使團 — an optional 副使 + a 厚禮 of gold carried abroad.
  const [deputyId, setDeputyId] = useState('');
  const [gift, setGift] = useState(0);
  const deputies = roamers.filter((o) => o.id !== officer?.id);
  const deputy = deputyId && deputies.some((o) => o.id === deputyId) ? officers[deputyId] : undefined;
  const fromGold = cities[fromCityId]?.gold ?? 0;

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
  // §7.7 ① 邦交競逐 — who holds this realm's 封號; ③ whether its road is cut.
  const title = target && !target.isTribe ? realmTitle(target.id) : null;
  const patronId = target ? realmPatron?.[target.id] : undefined;
  const isPatron = !!patronId && patronId === playerForceId;
  const patronName = patronId ? (lang === 'en' ? forces[patronId]?.name.en : forces[patronId]?.name.zh) : null;
  const severed = target ? (realmRouteDisruption?.[target.id] ?? 0) : 0;
  const resident = target ? residentEnvoys?.[target.id] : undefined;
  const residentOfficer = resident ? officers[resident.officerId] : undefined;
  const canProtectorate = Object.keys(openedRealms ?? {}).some((rid) => FOREIGN_REALMS_BY_ID[rid]?.region === 'xiyu');
  const protectorateHere = protectorateCityId === fromCityId;
  // §7.7-deep ②(B)敵意 / ①(A)援軍 / ③(C)互市
  const hostility = target ? (realmHostility?.[target.id] ?? 0) : 0;
  const aid = target && !target.isTribe ? realmAidProfile(target.id) : null;
  const canSummonAid = !!target && !target.isTribe && isPatron && (realmRelations?.[target.id] ?? 0) >= 50 && !!openedRealms?.[target.id];
  const tradeMode = target ? (realmTradeModeMap?.[target.id] ?? 'gold') : 'gold';
  const horseRealm = target ? isHorseRealm(target.id) : false;

  const send = () => {
    if (!officer || !target) return;
    const r = dispatchEmbassy(officer.id, fromCityId, target.id, {
      companionId: deputy?.id,
      giftGold: Math.min(gift, fromGold),
    });
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
                  <option key={tg.id} value={tg.id}>{(lang === 'en' ? tg.name.en : tg.name.zh)}{openedRealms?.[tg.id] ? ' ✓' : ''}{realmPatron?.[tg.id] === playerForceId && realmTitle(tg.id) ? ' ★' : ''}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>
        {/* §7.7 ② 遠使團 — 副使 + 厚禮 */}
        <label style={{ display: 'grid', gridTemplateColumns: '3.4rem 1fr', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: '0.78rem', color: '#7a8893' }}>{t('副使', 'Deputy')}</span>
          <select value={deputyId} onChange={(e) => setDeputyId(e.target.value)} style={selectStyle}>
            <option value="">{t('— 無(獨行)—', '— none —')}</option>
            {deputies.map((o) => (
              <option key={o.id} value={o.id}>{(lang === 'en' ? o.name.en : o.name.zh)} · {t('使才', 'skill')} {Math.round(envoyCompetence(o))}</option>
            ))}
          </select>
        </label>
        <label style={{ display: 'grid', gridTemplateColumns: '3.4rem 1fr', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: '0.78rem', color: '#7a8893' }}>{t('厚禮', 'Gift')}</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="range" min={0} max={Math.min(8000, Math.floor(fromGold / 100) * 100)} step={200}
              value={Math.min(gift, fromGold)} onChange={(e) => setGift(Number(e.target.value))}
              style={{ flex: 1 }}
            />
            <span style={{ fontSize: '0.74rem', color: gift > 0 ? '#e6c473' : '#7a8893', minWidth: '4.5rem', textAlign: 'right' }}>
              {gift > 0 ? `${gift.toLocaleString()} ${t('金', 'gold')}` : t('無', 'none')}
            </span>
          </span>
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
          {/* §7.7 ① 邦交競逐·封號獨占 */}
          {title && (
            <div style={{ color: isPatron ? '#e6c473' : '#7a8893' }}>
              {t('封號', 'Title')} 「{lang === 'en' ? title.en : title.zh}」 ·{' '}
              {isPatron
                ? t('★ 由你獨尊(每季享天命、可借兵)', '★ held by you (standing prestige + troop loans)')
                : patronName
                  ? t(`現為 ${patronName} 所執——再遣使可奪回`, `held by ${patronName} — out-court them to seize it`)
                  : t('尚無歸屬,遣使可受封', 'unclaimed — an embassy can win it')}
            </div>
          )}
          {/* §7.7 ③ 絲路風險 */}
          {!target.isTribe && openedRealms?.[target.id] && (
            severed > 0
              ? <div style={{ color: '#e0707a' }}>{t(`商道中斷,尚需 ${severed} 旬復通`, `caravan road cut — ${severed} season(s) to reopen`)}</div>
              : <div style={{ color: '#9ad6a8' }}>{t('商道通暢', 'caravan road open')}{resident ? t(' · 常駐使節護路', ' · resident envoy guards it') : ''}{protectorateCityId && target.region === 'xiyu' ? t(' · 都護府鎮西域', ' · protectorate secures it') : ''}</div>
          )}
          {/* §7.7-deep ②(B)遠邦之怒 */}
          {!target.isTribe && hostility > 0 && (
            <div style={{ color: hostility >= 55 ? '#e0707a' : '#e6c473' }}>
              {t('遠邦之怒', 'enmity')} {hostility}/100
              {hostility >= 55
                ? t(' · 邊釁將起,速修好(常駐/通好/奪回封號可解)', ' · border raids loom — court them to cool it')
                : t(' · 標心生怨,宜加修好', ' · resentment building')}
            </div>
          )}
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

      {/* §7.7 ④ 常駐使節 — station/recall a resident envoy at an opened realm. */}
      {target && !target.isTribe && openedRealms?.[target.id] && (
        <div style={{ fontSize: '0.68rem', color: '#7a8893', marginBottom: '0.5rem', lineHeight: 1.5 }}>
          {resident
            ? <>
                {t('常駐使節', 'Resident envoy')}: <span style={{ color: '#9ad6a8' }}>{residentOfficer ? (lang === 'en' ? residentOfficer.name.en : residentOfficer.name.zh) : '—'}</span>
                {t(' · 每季增遠邦關係、護商道、密報敵情', ' · warms ties, guards the road, sends intel each season')}
                <button onClick={() => { if (recallEnvoy(target.id).ok) playSfx('click'); }} style={miniBtn}>{t('召還', 'Recall')}</button>
              </>
            : <>
                {t('常駐使節', 'Resident envoy')}: {t('無——可遣一員久駐,坐收邦誼與情報', 'none — post an officer for standing goodwill & intel')}
                {officer && <button onClick={() => { if (stationEnvoy(officer.id, target.id).ok) playSfx('click'); }} style={miniBtn}>{t('遣使常駐', 'Station')}</button>}
              </>}
        </div>
      )}

      {/* §7.7-deep ③(C)絹馬互市 — toggle a horse realm's caravan to 買馬. */}
      {target && horseRealm && openedRealms?.[target.id] && (
        <div style={{ fontSize: '0.68rem', color: '#7a8893', marginBottom: '0.5rem', lineHeight: 1.5 }}>
          {t('互市', 'Trade')}:{' '}
          <button onClick={() => { if (setRealmTradeMode(target.id, 'gold').ok) playSfx('click'); }} style={tradeMode === 'gold' ? miniBtnOn : miniBtn}>{t('通商(金)', 'Coin')}</button>
          <button onClick={() => { if (setRealmTradeMode(target.id, 'horses').ok) playSfx('click'); }} style={tradeMode === 'horses' ? miniBtnOn : miniBtn}>{t('買馬(戰馬)', 'Buy horses')}</button>
          <span style={{ marginLeft: 6, color: '#9fb2c0' }}>
            {tradeMode === 'horses'
              ? t(`每季戰馬 +${realmTradeHorses(target.id, { protectorate: protectorateCityId != null })}(升騎兵上限)`, `+${realmTradeHorses(target.id, { protectorate: protectorateCityId != null })} warhorses/season`)
              : t(`每季入金 ${realmTradeIncome(target.id, { protectorate: protectorateCityId != null && target.region === 'xiyu' })}`, `${realmTradeIncome(target.id)} gold/season`)}
          </span>
        </div>
      )}

      {/* §7.7-deep ①(A)異域援軍 — call the realm's host to this city. */}
      {target && aid && openedRealms?.[target.id] && (
        <div style={{ fontSize: '0.68rem', color: '#7a8893', marginBottom: '0.5rem', lineHeight: 1.5 }}>
          {t('義従遠征軍', 'Expeditionary host')}: {aid.unitZh ? (lang === 'en' ? aid.unitEn : aid.unitZh) : ''} ≈ {aid.troops.toLocaleString()}{aid.warhorses > 0 ? t(` + 戰馬 ${aid.warhorses}`, ` + ${aid.warhorses} horses`) : ''}
          {canSummonAid
            ? <button onClick={() => { if (summonRealmAid(target.id, fromCityId).ok) playSfx('coin'); }} style={miniBtn}>{t('召至此城', 'Summon here')}</button>
            : <span style={{ color: '#5d6b76' }}>{t(' · 須執其封號且關係≥50', ' · needs its 封號 + relation ≥ 50')}</span>}
        </div>
      )}

      {/* §7.7 ③ 西域都護府 — designate this city as the Silk Road seat. */}
      {canProtectorate && (
        <div style={{ fontSize: '0.68rem', color: '#7a8893', marginBottom: '0.6rem', lineHeight: 1.5 }}>
          {t('西域都護府', 'Protectorate of the Western Regions')}:{' '}
          {protectorateHere
            ? <><span style={{ color: '#e6c473' }}>{t('設於此城——西域商利 +50%、商道難斷', 'seated here — +50% Silk Road trade, routes hard to cut')}</span>
                <button onClick={() => { if (designateProtectorate(null).ok) playSfx('click'); }} style={miniBtn}>{t('廢置', 'Dissolve')}</button></>
            : protectorateCityId
              ? <>{t('設於他城', 'seated elsewhere')}<button onClick={() => { if (designateProtectorate(fromCityId).ok) playSfx('click'); }} style={miniBtn}>{t('改設此城', 'Move here')}</button></>
              : <>{t('未設——統西域諸路於一城', 'not set — consolidate the Silk Road under one seat')}<button onClick={() => { if (designateProtectorate(fromCityId).ok) playSfx('click'); }} style={miniBtn}>{t('開府', 'Establish')}</button></>}
        </div>
      )}

      <button onClick={send} disabled={!officer || !target} style={sendBtn(!!officer && !!target)}>
        {t('遣使遠行', 'Send the embassy')}{deputy ? t(' · 攜副使', ' · w/ deputy') : ''}{gift > 0 ? t(` · 厚禮 ${gift.toLocaleString()}`, ` · gift ${gift.toLocaleString()}`) : ''}
      </button>
    </>
  );
}

const miniBtn = {
  marginLeft: 8, background: '#0e1318', border: '1px solid #2b3845', color: '#9fb2c0',
  padding: '0.1rem 0.5rem', fontFamily: 'inherit', fontSize: '0.68rem', borderRadius: 'var(--tkm-radius-sm)', cursor: 'pointer',
} as const;
const miniBtnOn = {
  ...miniBtn, background: '#1c2a18', border: '1px solid #4a6a3a', color: '#9ad6a8',
} as const;

const selectStyle = {
  background: '#080b0e', border: '1px solid #2b3845', color: '#e6c473',
  padding: '0.3rem 0.4rem', fontFamily: 'inherit', fontSize: '0.82rem', borderRadius: 'var(--tkm-radius-sm)',
} as const;

const infoBox = {
  fontSize: '0.76rem', color: '#aab6c0', marginBottom: '0.8rem', lineHeight: 1.8,
  background: '#10161e', border: '1px solid #1d2731', borderRadius: 'var(--tkm-radius-sm)', padding: '0.4rem 0.6rem',
} as const;

const sendBtn = (enabled: boolean) => ({
  width: '100%', padding: '0.5rem', borderRadius: 'var(--tkm-radius)', cursor: enabled ? 'pointer' : 'default',
  fontFamily: 'inherit', fontSize: '0.92rem', letterSpacing: '0.1rem',
  background: enabled ? 'linear-gradient(180deg, rgba(230,196,115,0.22), rgba(230,196,115,0.08))' : '#1b2531',
  border: `1px solid ${enabled ? '#e6c473' : '#2b3845'}`,
  color: enabled ? '#f2dd9a' : '#5f6c76',
}) as const;
