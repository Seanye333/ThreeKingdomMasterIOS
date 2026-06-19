import { useMemo } from 'react';
import { useGameStore } from '../../game/state/store';
import { useT } from '../i18n';
import { Modal } from './Modal';

interface Rumor { key: string; zh: string; en: string; icon: string }

/**
 * 市井 — the word on the street. Not a dossier: hearsay, half-truths and the
 * mood of the age, woven from the realm's actual state but spoken as a merchant
 * or tavern-keeper might. Soft hints (a worthy in the wild, a restless general,
 * a granary running thin) that point you somewhere without handing you numbers.
 * Pure read; deterministic, so the talk is steady within a season.
 */
export function RumorsModal({ onClose }: { onClose: () => void }) {
  const t = useT();
  const officers = useGameStore((s) => s.officers);
  const forces = useGameStore((s) => s.forces);
  const cities = useGameStore((s) => s.cities);
  const year = useGameStore((s) => s.date.year);
  const playerForceId = useGameStore((s) => s.playerForceId);

  const rumors = useMemo<Rumor[]>(() => {
    const out: Rumor[] = [];
    const cityName = (id: string | null | undefined) => (id && cities[id] ? cities[id].name.zh : '');
    const forceName = (id: string | null | undefined) => (id && forces[id] ? forces[id].name.zh : '');

    // 在野賢才 — a notable unaffiliated officer and roughly where they linger.
    const wild = Object.values(officers)
      .filter((o) => o.forceId === null && o.locationCityId && (o.status === 'idle' || o.status === 'active'))
      .sort((a, b) => (b.stats.war + b.stats.intelligence + b.stats.politics) - (a.stats.war + a.stats.intelligence + a.stats.politics))
      .slice(0, 2);
    for (const o of wild) {
      out.push({
        key: `wild:${o.id}`, icon: '📜',
        zh: `聽聞${o.name.zh}懷經緯之才,隱於${cityName(o.locationCityId)}一帶,未事一主。`,
        en: `They say ${o.name.en}, a talent of note, lingers near ${cities[o.locationCityId!]?.name.en} — pledged to no one.`,
      });
    }

    // 異心 — a restless general somewhere in the realm (defection hint).
    const restless = Object.values(officers)
      .filter((o) => o.forceId && o.forceId !== playerForceId && (o.status === 'active' || o.status === 'idle') && o.loyalty < 40 && forces[o.forceId])
      .sort((a, b) => a.loyalty - b.loyalty)
      .slice(0, 2);
    for (const o of restless) {
      out.push({
        key: `restless:${o.id}`, icon: '🗣',
        zh: `市井私語,${forceName(o.forceId)}麾下${o.name.zh}鬱鬱,似有去就之意。`,
        en: `Whispers hold that ${o.name.en} of ${forceName(o.forceId)} chafes — perhaps open to other banners.`,
      });
    }

    // 糧匱 — a rival whose stores look thin against the mouths it feeds.
    const byForce: Record<string, { food: number; troops: number }> = {};
    for (const c of Object.values(cities)) {
      if (!c.ownerForceId || c.ownerForceId === playerForceId) continue;
      const a = (byForce[c.ownerForceId] ??= { food: 0, troops: 0 });
      a.food += c.food; a.troops += c.troops;
    }
    const strained = Object.entries(byForce)
      .filter(([, v]) => v.troops > 0 && v.food < v.troops * 2)
      .sort((a, b) => (a[1].food / Math.max(1, a[1].troops)) - (b[1].food / Math.max(1, b[1].troops)))[0];
    if (strained) {
      out.push({
        key: `food:${strained[0]}`, icon: '🌾',
        zh: `商旅傳言,${forceName(strained[0])}倉廩漸匱,軍中已有怨聲。`,
        en: `Traders murmur that ${forceName(strained[0])}'s granaries run thin — discontent stirs in the ranks.`,
      });
    }

    // 強藩 — who the realm fears most (top by cities held).
    const tally: Record<string, number> = {};
    for (const c of Object.values(cities)) if (c.ownerForceId) tally[c.ownerForceId] = (tally[c.ownerForceId] ?? 0) + 1;
    const top = Object.entries(tally).sort((a, b) => b[1] - a[1])[0];
    if (top && top[0] !== playerForceId && top[1] >= 3) {
      out.push({
        key: `mighty:${top[0]}`, icon: '🐉',
        zh: `皆道${forceName(top[0])}方今勢盛,諸侯側目,恐有並吞之心。`,
        en: `All speak of ${forceName(top[0])}'s rising power — rivals watch warily for an appetite to conquer.`,
      });
    }

    // 時氣 — flavour for the age.
    const era = year < 190 ? { zh: '黃巾餘燼未熄,州郡多事,豪傑並起。', en: 'The embers of the Turban revolt still smoulder; heroes rise across the provinces.' }
      : year < 200 ? { zh: '群雄逐鹿,漢室傾頹,天下未知所歸。', en: 'Warlords contend for the deer of empire as the Han totters.' }
      : year < 220 ? { zh: '三分之勢漸成,智謀之士各擇其主。', en: 'A threefold balance takes shape; the cunning choose their lords.' }
      : { zh: '禪代之後,正朔之爭未息,人心思定。', en: 'After the abdications, the quarrel over legitimacy lingers; the people long for peace.' };
    out.push({ key: 'era', icon: '🏮', zh: era.zh, en: era.en });

    return out;
  }, [officers, forces, cities, year, playerForceId]);

  return (
    <Modal onClose={onClose} width="min(540px, 100%)" icon="🏮" title={t('市井流言', 'Word on the Street')}>
        <div style={{ color: '#7a8893', fontSize: '0.72rem', fontStyle: 'italic', marginBottom: '0.7rem' }}>
          {t('道聽途說,未必盡實 — 然空穴來風,亦或有自。', 'Hearsay, not gospel — yet smoke seldom rises without fire.')}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {rumors.map((r) => (
            <div key={r.key} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '0.5rem 0.6rem', background: '#141c25', border: '1px solid #243240', borderRadius: 5 }}>
              <span style={{ fontSize: '1.1rem' }}>{r.icon}</span>
              <span style={{ fontSize: '0.86rem', lineHeight: 1.5, color: '#cdd8e0' }}>{t(r.zh, r.en)}</span>
            </div>
          ))}
        </div>
    </Modal>
  );
}
