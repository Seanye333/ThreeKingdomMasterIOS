import type { EntityId, EventEffect, City, Officer, Force } from '../../game/types';
import { CIVIC_TITLES_BY_ID } from '../../game/data/titles';

/** 效果晶片 — one mechanical consequence of an event effect, ready to render.
 *  tone drives the chip color: good (green), bad (red), neutral (parchment). */
export interface EffectChip {
  text: string;
  tone: 'good' | 'bad' | 'neutral';
}

export interface ChipContext {
  officers: Record<EntityId, Officer>;
  cities: Record<EntityId, City>;
  forces: Record<EntityId, Force>;
  lang: 'zh' | 'en' | 'both';
}

const fmtDelta = (n: number) => (n > 0 ? `+${n}` : `${n}`);
const fmtMul = (m: number) => `×${m % 1 === 0 ? m : m.toFixed(2).replace(/0+$/, '').replace(/\.$/, '')}`;

/**
 * 事之效 — translate an event's typed effects into short bilingual chips so
 * the player sees the mechanical consequences, not just the prose. Flags and
 * wish-injections are internal bookkeeping and render nothing.
 */
export function effectChips(effects: EventEffect[], ctx: ChipContext): EffectChip[] {
  const en = ctx.lang === 'en';
  const officerName = (id: EntityId) => {
    const o = ctx.officers[id];
    return o ? (en ? o.name.en : o.name.zh) : id;
  };
  const cityName = (id: EntityId) => {
    const c = ctx.cities[id];
    return c ? (en ? c.name.en : c.name.zh) : id;
  };
  // Ruler-referenced effects hit the force this officer rules — label by name.
  const rulerName = (id: EntityId) => officerName(id);

  const chips: EffectChip[] = [];
  for (const e of effects) {
    switch (e.kind) {
      case 'officer-status':
        if (e.status === 'dead') chips.push({ text: en ? `☠ ${officerName(e.officerId)} dies` : `☠ ${officerName(e.officerId)}身死`, tone: 'bad' });
        else if (e.status === 'imprisoned') chips.push({ text: en ? `⛓ ${officerName(e.officerId)} imprisoned` : `⛓ ${officerName(e.officerId)}下獄`, tone: 'bad' });
        else chips.push({ text: en ? `${officerName(e.officerId)} released` : `${officerName(e.officerId)}釋出`, tone: 'neutral' });
        break;
      case 'officer-join':
        chips.push({ text: en ? `⚑ ${officerName(e.officerId)} joins` : `⚑ ${officerName(e.officerId)}入仕`, tone: 'good' });
        break;
      case 'officer-join-ruler':
        chips.push({
          text: en
            ? `⚑ ${officerName(e.officerId)} joins ${rulerName(e.rulerOfficerId)}`
            : `⚑ ${officerName(e.officerId)}入${rulerName(e.rulerOfficerId)}麾下`,
          tone: 'good',
        });
        break;
      case 'officer-loyalty':
        chips.push({
          text: en ? `${officerName(e.officerId)} loyalty ${fmtDelta(e.delta)}` : `${officerName(e.officerId)}忠誠 ${fmtDelta(e.delta)}`,
          tone: e.delta >= 0 ? 'good' : 'bad',
        });
        break;
      case 'mandate-ruler':
        chips.push({
          text: en ? `${rulerName(e.rulerOfficerId)} mandate ${fmtDelta(e.delta)}` : `${rulerName(e.rulerOfficerId)}天命 ${fmtDelta(e.delta)}`,
          tone: e.delta >= 0 ? 'good' : 'bad',
        });
        break;
      case 'force-gold':
        chips.push({ text: en ? `Gold ${fmtDelta(e.delta)}` : `金 ${fmtDelta(e.delta)}`, tone: e.delta >= 0 ? 'good' : 'bad' });
        break;
      case 'force-gold-ruler':
        chips.push({
          text: en ? `${rulerName(e.rulerOfficerId)} gold ${fmtDelta(e.delta)}` : `${rulerName(e.rulerOfficerId)}府庫 ${fmtDelta(e.delta)}`,
          tone: e.delta >= 0 ? 'good' : 'bad',
        });
        break;
      case 'city-loyalty':
        chips.push({ text: en ? `${cityName(e.cityId)} loyalty ${fmtDelta(e.delta)}` : `${cityName(e.cityId)}民忠 ${fmtDelta(e.delta)}`, tone: e.delta >= 0 ? 'good' : 'bad' });
        break;
      case 'city-defense':
        chips.push({ text: en ? `${cityName(e.cityId)} defense ${fmtDelta(e.delta)}` : `${cityName(e.cityId)}城防 ${fmtDelta(e.delta)}`, tone: e.delta >= 0 ? 'good' : 'bad' });
        break;
      case 'city-food':
        chips.push({ text: en ? `${cityName(e.cityId)} food ${fmtDelta(e.delta)}` : `${cityName(e.cityId)}糧 ${fmtDelta(e.delta)}`, tone: e.delta >= 0 ? 'good' : 'bad' });
        break;
      case 'city-troops-multiplier':
        chips.push({ text: en ? `${cityName(e.cityId)} troops ${fmtMul(e.multiplier)}` : `${cityName(e.cityId)}守軍 ${fmtMul(e.multiplier)}`, tone: e.multiplier >= 1 ? 'good' : 'bad' });
        break;
      case 'force-troops-multiplier':
        chips.push({ text: en ? `Troops ${fmtMul(e.multiplier)}` : `全軍兵力 ${fmtMul(e.multiplier)}`, tone: e.multiplier >= 1 ? 'good' : 'bad' });
        break;
      case 'force-troops-multiplier-ruler':
        chips.push({
          text: en ? `${rulerName(e.rulerOfficerId)} troops ${fmtMul(e.multiplier)}` : `${rulerName(e.rulerOfficerId)}軍兵力 ${fmtMul(e.multiplier)}`,
          tone: e.multiplier >= 1 ? 'good' : 'bad',
        });
        break;
      case 'spawn-rebel-force':
        chips.push({ text: en ? `Revolt at ${cityName(e.cityId)}` : `${cityName(e.cityId)}生亂`, tone: 'bad' });
        break;
      case 'strip-force-paint':
        chips.push({ text: en ? 'Supply lines severed' : '糧道盡斷', tone: 'bad' });
        break;
      case 'grant-title': {
        const title = CIVIC_TITLES_BY_ID[e.titleId];
        const titleName = title ? (en ? title.name.en : title.name.zh) : e.titleId;
        chips.push({ text: en ? `${officerName(e.officerId)}: ${titleName}` : `${officerName(e.officerId)}拜${titleName}`, tone: 'good' });
        break;
      }
      // Internal bookkeeping — nothing the player should see as a "consequence".
      case 'flag':
      case 'force-wish':
        break;
    }
  }
  return chips;
}
