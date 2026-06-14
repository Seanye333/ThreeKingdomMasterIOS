import { useMemo } from 'react';
import { useGameStore } from '../../game/state/store';
import { tickCityEconomy } from '../../game/systems/economy';
import { useT } from '../i18n';

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

const TONE_COLOR: Record<Tone, { fg: string; border: string; bg: string }> = {
  urgent: { fg: '#ffb088', border: '#e0603a', bg: 'rgba(200,60,40,0.12)' },
  warn:   { fg: '#f0d98a', border: '#d4a84a', bg: 'rgba(212,168,74,0.10)' },
  info:   { fg: '#9ad6c8', border: '#5a8a7a', bg: 'rgba(90,138,122,0.10)' },
};

/**
 * 待辦 — one panel that answers "what needs me this season?". It sweeps the
 * realm for the things a ruler must not miss — a city under the sword, a
 * garrison about to starve, restless subjects, idle talent, worthies in the
 * wild, unanswered letters — and lets you leap straight to each. Pure read of
 * existing state; clears to 天下無事 when nothing's pressing.
 */
export function ToDoModal({ onClose, onOpenLetters }: { onClose: () => void; onOpenLetters?: () => void }) {
  const t = useT();
  const cities = useGameStore((s) => s.cities);
  const officers = useGameStore((s) => s.officers);
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
    const jump = (id: string) => () => { selectCity(id); onClose(); };
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
      const tick = tickCityEconomy(c, season, officersByCity[c.id] ?? []);
      const net = tick.foodIncome - tick.foodUpkeep;
      if (c.food + net < 0) {
        // 一鍵調糧 — the richest adjacent friendly city with grain to spare
        // can relieve the famine in one click; else just jump there.
        const relief = c.adjacentCityIds
          .map((id) => cities[id])
          .filter((s) => s && s.ownerForceId === playerForceId && s.food > 4000)
          .sort((a, b) => b.food - a.food)[0];
        list.push({
          key: `food:${c.id}`, icon: '🌾', tone: 'urgent',
          zh: `${c.name.zh} 糧秣告急`, en: `${c.name.en} running out of grain`,
          sub: relief
            ? t(`存糧 ${c.food.toLocaleString()} — 點擊由 ${relief.name.zh} 調糧`, `${c.food.toLocaleString()} stored — click to ship grain from ${relief.name.en}`)
            : t(`存糧 ${c.food.toLocaleString()},下季缺糧逃兵`, `${c.food.toLocaleString()} stored — desertion next season`),
          onClick: relief
            ? () => { dispatchConvoy(relief.id, c.id, Math.min(relief.food - 3000, 5000), 0); onClose(); }
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

    const rank: Record<Tone, number> = { urgent: 0, warn: 1, info: 2 };
    return list.sort((a, b) => rank[a.tone] - rank[b.tone]);
  }, [cities, officers, armies, season, playerForceId, cityDelegations, pendingTrainings, wishCount, onOpenLetters, selectCity, dispatchConvoy, onClose, t]);

  const urgent = todos.filter((td) => td.tone === 'urgent').length;

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'grid', placeItems: 'center', zIndex: 900, padding: '1rem' }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: 'linear-gradient(160deg,#2a1f15,#1a1410)', border: '1px solid #5a4530',
        width: 'min(560px,100%)', maxHeight: '86vh', overflowY: 'auto', color: '#e8d9b0',
        fontFamily: '"Songti SC","Noto Serif SC",serif', padding: '1rem 1.2rem',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.6rem' }}>
          <div style={{ fontSize: '1.15rem', color: '#d4a84a', letterSpacing: '0.2rem' }}>
            📋 {t('待辦', 'To-Do')} {urgent > 0 && <span style={{ color: '#ffb088', fontSize: '0.8rem' }}>· {urgent} {t('急', 'urgent')}</span>}
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#d4a84a', fontSize: '1.4rem', cursor: 'pointer' }}>×</button>
        </div>

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
                    {td.sub && <div style={{ color: '#8a7050', fontSize: '0.74rem' }}>{td.sub}</div>}
                  </div>
                  {td.onClick && <span style={{ color: '#6a5a45', fontSize: '0.9rem' }}>›</span>}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
