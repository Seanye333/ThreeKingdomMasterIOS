import { useMemo } from 'react';
import { useGameStore } from '../../game/state/store';
import { tickCityEconomy } from '../../game/systems/economy';
import { useT } from '../i18n';
import { Modal } from './Modal';
import { playSfx } from '../../game/systems/sound';
import { CHIP_TONES } from './Chip';
import { requestMapFocus } from './mapFocusBus';

type Tone = 'urgent' | 'warn' | 'info';

interface Todo {
  key: string;
  icon: string;
  zh: string;
  en: string;
  sub?: string;
  tone: Tone;
  onClick?: () => void;
}

// Share the one status palette — urgent reads as the 受襲 danger red.
const TONE_COLOR: Record<Tone, { fg: string; border: string; bg: string }> = {
  urgent: CHIP_TONES.danger,
  warn:   CHIP_TONES.warn,
  info:   CHIP_TONES.info,
};

/**
 * 待辦 — one panel that answers "what needs me this season?". It sweeps the
 * realm for the things a ruler must not miss — a city under the sword, a
 * garrison about to starve, restless subjects, idle talent, worthies in the
 * wild, unanswered letters — and lets you leap straight to each. Pure read of
 * existing state; clears to 天下無事 when nothing's pressing.
 */
/** 未曾涉足的玩法 — discovery nudges for the game's deeper systems. */
const DISCOVER_FEATURES: Array<{ id: string; icon: string; zh: string; en: string; subZh: string }> = [
  { id: 'schemes',      icon: '🪄', zh: '計略 — 驅虎吞狼、造讖惑眾', en: 'Schemes', subZh: '不費一兵而亂敵國' },
  { id: 'espionage',    icon: '🕵', zh: '密偵 — 細作與反間',        en: 'Espionage', subZh: '潛伏敵城,開眼蝕心' },
  { id: 'rites',        icon: '⛩', zh: '祭祀 — 郊祀/祈雨/招安',    en: 'Rites', subZh: '天命亦可經營' },
  { id: 'annals',       icon: '☄', zh: '災異志 — 本朝編年',        en: 'Annals', subZh: '史事天象盡入誌' },
  { id: 'forge',        icon: '⚒', zh: '鍛造 — 神兵自鑄',          en: 'Forge', subZh: '鐵與火,養一把名器' },
  { id: 'tournament',   icon: '🏆', zh: '比武大會 — 群英校技',      en: 'Tournament', subZh: '擂台之上見真章' },
  { id: 'debate-ground',icon: '💬', zh: '論辯場 — 舌戰練膽',        en: 'Debate', subZh: '不戰而屈人之口' },
];
const SEEN_KEY = 'tkm-seen-features';
const seenFeatures = (): Set<string> => {
  try { return new Set(JSON.parse(localStorage.getItem(SEEN_KEY) ?? '[]')); } catch { return new Set(); }
};
export const markFeatureSeen = (id: string) => {
  const s = seenFeatures(); s.add(id);
  localStorage.setItem(SEEN_KEY, JSON.stringify([...s]));
};

export function ToDoModal({ onClose, onOpenLetters, onOpenFeature }: { onClose: () => void; onOpenLetters?: () => void; onOpenFeature?: (id: string) => void }) {
  const t = useT();
  const cities = useGameStore((s) => s.cities);
  const officers = useGameStore((s) => s.officers);
  const allBuildings = useGameStore((s) => s.buildings);
  const armies = useGameStore((s) => s.armies);
  const season = useGameStore((s) => s.date.season);
  const playerForceId = useGameStore((s) => s.playerForceId);
  const cityDelegations = useGameStore((s) => s.cityDelegations);
  const pendingTrainings = useGameStore((s) => s.pendingTrainings);
  const wishCount = useGameStore((s) => s.officerWishes.length);
  const selectCity = useGameStore((s) => s.selectCity);
  const dispatchConvoy = useGameStore((s) => s.dispatchConvoy);

  const todos = useMemo<Todo[]>(() => {
    if (!playerForceId) return [];
    const list: Todo[] = [];
    // Select the city AND fly the map camera over to it (not just select), so
    // a to-do item lands you looking right at it.
    const jump = (id: string) => () => { selectCity(id); requestMapFocus(id); onClose(); };
    const mine = Object.values(cities).filter((c) => c.ownerForceId === playerForceId);
    const officersList = Object.values(officers);
    const officersByCity: Record<string, typeof officersList> = {};
    for (const o of officersList) {
      if (!o.locationCityId || o.status === 'dead' || o.status === 'unsearched') continue;
      (officersByCity[o.locationCityId] ??= []).push(o);
    }

    // 1) 受襲 — enemy field army marching on one of my cities (most urgent).
    const threatTroops: Record<string, number> = {};
    for (const a of Object.values(armies)) {
      if (a.forceId === playerForceId || a.cellTarget) continue;
      const c = cities[a.targetCityId];
      if (!c || c.ownerForceId !== playerForceId) continue;
      threatTroops[a.targetCityId] = (threatTroops[a.targetCityId] ?? 0) + a.troops;
    }
    for (const [cid, troops] of Object.entries(threatTroops)) {
      const c = cities[cid];
      list.push({
        key: `threat:${cid}`, icon: '⚔', tone: 'urgent',
        zh: `${c.name.zh} 受襲`, en: `${c.name.en} under attack`,
        sub: t(`來犯 ${troops.toLocaleString()} 兵 · 守軍 ${c.troops.toLocaleString()}`, `${troops.toLocaleString()} incoming · ${c.troops.toLocaleString()} garrison`),
        onClick: jump(cid),
      });
    }

    // 2) 糧荒 — garrison will starve next season (food + net < 0 → desertion).
    for (const c of mine) {
      const tick = tickCityEconomy(c, season, officersByCity[c.id] ?? [], 'normal', 0, 'clear', allBuildings);
      const net = tick.foodIncome - tick.foodUpkeep;
      if (c.food + net < 0) {
        // 一鍵調糧 — the richest adjacent friendly city with grain to spare
        // can relieve the famine in one click; else just jump there.
        const relief = c.adjacentCityIds
          .map((id) => cities[id])
          .filter((s) => s && s.ownerForceId === playerForceId && s.food > 4000)
          .sort((a, b) => b.food - a.food)[0];
        // 押運 — pick the ablest idle officer in the relief city to run the haul.
        const escort = relief
          ? (officersByCity[relief.id] ?? [])
              .filter((o) => o.forceId === playerForceId && (o.status === 'idle' || o.status === 'active') && !o.task)
              .sort((a, b) => b.stats.politics - a.stats.politics)[0]
          : undefined;
        const canRelieve = relief && escort;
        list.push({
          key: `food:${c.id}`, icon: '🌾', tone: 'urgent',
          zh: `${c.name.zh} 糧秣告急`, en: `${c.name.en} running out of grain`,
          sub: canRelieve
            ? t(`存糧 ${c.food.toLocaleString()} — 點擊遣 ${escort!.name.zh} 自 ${relief!.name.zh} 調糧`, `${c.food.toLocaleString()} stored — click to send ${escort!.name.en} with grain from ${relief!.name.en}`)
            : relief
              ? t(`存糧 ${c.food.toLocaleString()} — ${relief.name.zh} 有糧但無閒將押運`, `${c.food.toLocaleString()} stored — ${relief.name.en} has grain but no idle officer to escort`)
              : t(`存糧 ${c.food.toLocaleString()},下季缺糧逃兵`, `${c.food.toLocaleString()} stored — desertion next season`),
          onClick: canRelieve
            ? () => { dispatchConvoy(relief!.id, c.id, Math.min(relief!.food - 3000, 5000), 0, 0, escort!.id); playSfx('coin'); onClose(); }
            : jump(c.id),
        });
      }
    }

    // 3) 民心 — loyalty low enough to risk revolt/defection.
    for (const c of mine) {
      if (c.loyalty < 40) {
        list.push({
          key: `loy:${c.id}`, icon: '💔', tone: 'warn',
          zh: `${c.name.zh} 民心浮動`, en: `${c.name.en} discontent`,
          sub: t(`忠誠 ${c.loyalty} — 宜安撫/賞賜`, `loyalty ${c.loyalty} — pacify or reward`),
          onClick: jump(c.id),
        });
      }
    }

    // 4) 在野賢才 — an unaffiliated worthy sitting in one of your cities.
    const recruitCities: Record<string, number> = {};
    for (const o of officersList) {
      if (o.forceId !== null || o.status === 'dead' || o.status === 'unsearched' || o.status === 'retired' || o.status === 'imprisoned') continue;
      if (!o.locationCityId) continue;
      const c = cities[o.locationCityId];
      if (!c || c.ownerForceId !== playerForceId) continue;
      recruitCities[o.locationCityId] = (recruitCities[o.locationCityId] ?? 0) + 1;
    }
    for (const [cid, n] of Object.entries(recruitCities)) {
      const c = cities[cid];
      list.push({
        key: `recruit:${cid}`, icon: '📜', tone: 'info',
        zh: `${c.name.zh} 有在野賢才`, en: `Worthy in ${c.name.en}`,
        sub: t(`${n} 人可招攬`, `${n} available to recruit`),
        onClick: jump(cid),
      });
    }

    // 5) 閒置武将 — officers in self-run cities with no order this season.
    const delegated = new Set(Object.keys(cityDelegations ?? {}));
    const training = new Set(pendingTrainings.map((tr) => tr.officerId));
    let idle = 0;
    let firstIdleCity: string | null = null;
    for (const o of officersList) {
      if (o.forceId !== playerForceId || o.task) continue;
      if (training.has(o.id)) continue;
      const c = o.locationCityId ? cities[o.locationCityId] : null;
      if (!c || c.ownerForceId !== playerForceId || delegated.has(c.id)) continue;
      idle++;
      if (!firstIdleCity) firstIdleCity = c.id;
    }
    if (idle > 0 && firstIdleCity) {
      list.push({
        key: 'idle', icon: '⚑', tone: 'warn',
        zh: `${idle} 名武將閒置`, en: `${idle} idle commanders`,
        sub: t('尚未派遣 — 點擊前往', 'awaiting orders — click to jump'),
        onClick: jump(firstIdleCity),
      });
    }

    // 6) 書信 — officers awaiting a reply.
    if (wishCount > 0 && onOpenLetters) {
      list.push({
        key: 'letters', icon: '✉', tone: 'info',
        zh: `${wishCount} 封書信待覆`, en: `${wishCount} letters to answer`,
        onClick: () => { onOpenLetters(); onClose(); },
      });
    }

    // 7) 尚未涉足 — nudge toward the systems this campaign hasn't touched.
    if (onOpenFeature) {
      const seen = seenFeatures();
      for (const f of DISCOVER_FEATURES.filter((x) => !seen.has(x.id)).slice(0, 3)) {
        list.push({
          key: `discover-${f.id}`, icon: f.icon, tone: 'info',
          zh: `試試:${f.zh}`, en: `Try: ${f.en}`, sub: f.subZh,
          onClick: () => { markFeatureSeen(f.id); onOpenFeature(f.id); onClose(); },
        });
      }
    }

    const rank: Record<Tone, number> = { urgent: 0, warn: 1, info: 2 };
    return list.sort((a, b) => rank[a.tone] - rank[b.tone]);
  }, [cities, officers, allBuildings, armies, season, playerForceId, cityDelegations, pendingTrainings, wishCount, onOpenLetters, onOpenFeature, selectCity, dispatchConvoy, onClose, t]);

  const urgent = todos.filter((td) => td.tone === 'urgent').length;

  return (
    <Modal
      onClose={onClose}
      icon="📋"
      title={t('待辦', 'To-Do')}
      badge={urgent > 0 ? <span style={{ color: '#ffb088' }}>· {urgent} {t('急', 'urgent')}</span> : undefined}
    >
        {todos.length === 0 ? (
          <div style={{ color: '#9ad6a8', fontSize: '0.95rem', textAlign: 'center', padding: '1.6rem 0' }}>
            ✓ {t('天下無事 — 諸事妥當,可安心過旬。', 'All quiet — nothing pressing this season.')}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {todos.map((td) => {
              const c = TONE_COLOR[td.tone];
              return (
                <div
                  key={td.key}
                  onClick={td.onClick}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '0.5rem 0.7rem', borderRadius: 5,
                    background: c.bg, border: `1px solid ${c.border}`,
                    cursor: td.onClick ? 'pointer' : 'default',
                  }}
                >
                  <span style={{ fontSize: '1.2rem' }}>{td.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: c.fg, fontSize: '0.9rem' }}>{t(td.zh, td.en)}</div>
                    {td.sub && <div style={{ color: '#7a8893', fontSize: '0.74rem' }}>{td.sub}</div>}
                  </div>
                  {td.onClick && <span style={{ color: '#5f6c76', fontSize: '0.9rem' }}>›</span>}
                </div>
              );
            })}
          </div>
        )}
    </Modal>
  );
}
