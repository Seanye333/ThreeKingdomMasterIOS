/**
 * AI 諜報 — gives rival courts the same covert reach the player wields (§7.3 ①).
 * Until now espionage was one-directional: only the player ran ops. Each season
 * every AI force with a capable spymaster and spare silver may now move against
 * the PLAYER — incite a city, burn its stores, slander or suborn an officer, send
 * an assassin, or plant a 潛伏細作 in a player city (which the player must then
 * root out via 肅諜). The player's counter-intel (諜報司/斥候營, loyal/honour-bound
 * officers, 心腹/仁孝 immunities) blunts it through the same channels. Pure.
 */
import type {
  Building,
  City,
  EntityId,
  EmbeddedSpy,
  Force,
  Officer,
  ReportEntry,
} from '../types';
import type { RulerPersonality } from '../types/personality';
import type { FamilyRelation } from '../types/family';
import { espionageBonus, counterEspionageResist } from './traitEffects';
import { hasBloodKinInForce } from './relationshipEffects';
import { isConfidant, getLordRapport } from './rapport';

/** How keen each ruler type is to run cloak-and-dagger ops. */
const SPY_APPETITE: Record<RulerPersonality, number> = {
  opportunist: 1.4, tyrant: 1.3, aggressive: 1.0, expansionist: 0.9,
  hesitant: 0.8, scholar: 0.9, defensive: 0.7, cautious: 0.6,
};

export interface AIEspionageContext {
  forces: Record<EntityId, Force>;
  officers: Record<EntityId, Officer>;
  cities: Record<EntityId, City>;
  embeddedSpies: EmbeddedSpy[];
  playerForceId: EntityId | null | undefined;
  buildings?: Building[];
  family?: FamilyRelation[];
  lordRapport?: Record<EntityId, number>;
  /** 肅諜 — a recent counter-intel sweep stiffens the realm against enemy ops. */
  counterIntelActive?: boolean;
  date: { year: number; season: 'spring' | 'summer' | 'autumn' | 'winter' };
  rng: () => number;
}

export interface AIEspionageOutput {
  cities: Record<EntityId, City>;
  officers: Record<EntityId, Officer>;
  /** AI 潛伏細作 newly planted in player cities (append to state.embeddedSpies). */
  newSpies: EmbeddedSpy[];
  entries: ReportEntry[];
}

const COST = { instigate: 250, sabotage: 200, frame: 150, defect: 400, assassinate: 500, plant: 300 } as const;

/** The player's realm-wide counter-intel — the average vigilance of its officers. */
function playerCounterResist(officers: Record<EntityId, Officer>, playerForceId: EntityId): number {
  const own = Object.values(officers).filter((o) => o.forceId === playerForceId && o.status !== 'dead');
  if (own.length === 0) return 0;
  return own.reduce((s, o) => s + counterEspionageResist(o), 0) / own.length;
}

export function resolveAIEspionage(ctx: AIEspionageContext): AIEspionageOutput {
  const cities = { ...ctx.cities };
  const officers = { ...ctx.officers };
  const newSpies: EmbeddedSpy[] = [];
  const entries: ReportEntry[] = [];
  const { playerForceId } = ctx;
  if (!playerForceId || !ctx.forces[playerForceId]) return { cities, officers, newSpies, entries };

  const counterResist = playerCounterResist(officers, playerForceId) + (ctx.counterIntelActive ? 0.25 : 0);
  const playerCities = () => Object.values(cities).filter((c) => c.ownerForceId === playerForceId);
  const playerOfficers = () => Object.values(officers).filter((o) => o.forceId === playerForceId && o.status !== 'dead' && o.id !== ctx.forces[playerForceId].rulerOfficerId);

  for (const force of Object.values(ctx.forces)) {
    if (force.id === playerForceId || force.vassalOfForceId === playerForceId) continue;
    const live = Object.values(cities).some((c) => c.ownerForceId === force.id);
    if (!live) continue;
    // Spymaster = the force's sharpest mind; needs real cunning to run an op.
    const spy = Object.values(officers)
      .filter((o) => o.forceId === force.id && o.status !== 'dead')
      .sort((a, b) => b.stats.intelligence - a.stats.intelligence)[0];
    if (!spy || spy.stats.intelligence < 68) continue;
    const appetite = SPY_APPETITE[force.personality ?? 'opportunist'] ?? 1.0;
    const attempt = Math.min(0.25, 0.12 * appetite * (0.55 + spy.stats.intelligence / 220));
    if (ctx.rng() >= attempt) continue;
    const capital = cities[force.capitalCityId];
    if (!capital) continue;

    // Success model mirrors the player's: agent INT vs the player's vigilance.
    const baseChance = (k: 'instigate' | 'sabotage' | 'frame' | 'defect' | 'assassinate') => {
      const base = { instigate: 0.45, sabotage: 0.55, frame: 0.55, defect: 0.3, assassinate: 0.25 }[k];
      return base * (spy.stats.intelligence / 100) + espionageBonus(spy) - counterResist;
    };

    // Pick an op by opportunity.
    const targets = playerOfficers();
    const lowLoyal = targets.filter((o) => o.loyalty < 60).sort((a, b) => a.loyalty - b.loyalty);
    const richCity = playerCities().filter((c) => c.food > 4000).sort((a, b) => b.food - a.food)[0];
    const midCity = playerCities().filter((c) => c.loyalty < 80).sort((a, b) => a.loyalty - b.loyalty)[0];
    const strongOfficer = targets.sort((a, b) => (b.stats.leadership + b.stats.war) - (a.stats.leadership + a.stats.war))[0];

    const fnE = force.name.en, fnZ = force.name.zh;
    const roll = ctx.rng();
    let acted = false;

    // 1) 寢返/離間 — turn or slander a wavering player officer.
    if (!acted && lowLoyal.length > 0 && capital.gold >= COST.frame) {
      const t = lowLoyal[0];
      // 心腹/仁孝 — a confidant or kin-anchored officer cannot be turned (defect only).
      const immune = isConfidant(ctx.lordRapport ?? {}, t.id) || hasBloodKinInForce(t, officers, ctx.family ?? []);
      const wantDefect = !immune && t.loyalty < 45 && capital.gold >= COST.defect;
      const kind = wantDefect ? 'defect' : 'frame';
      cities[capital.id] = { ...capital, gold: capital.gold - COST[kind] };
      let chance = baseChance(kind);
      if (kind === 'defect') {
        chance += (100 - t.loyalty) / 50 - 0.2 - counterEspionageResist(t) * 3 - Math.max(0, getLordRapport(ctx.lordRapport ?? {}, t.id)) / 120;
      }
      chance = Math.max(0.02, Math.min(0.9, chance));
      if (ctx.rng() < chance) {
        if (kind === 'defect') {
          officers[t.id] = { ...t, forceId: force.id, loyalty: 60, status: 'idle', task: null };
          entries.push({ cityId: t.locationCityId ?? null, kind: 'espionage',
            text: `${t.name.en} is secretly suborned by ${fnE} and defects from your service!`,
            textZh: `${t.name.zh}為${fnZ}暗中策反,叛你而去!` });
        } else {
          const drop = 15 + Math.floor(ctx.rng() * 11);
          officers[t.id] = { ...t, loyalty: Math.max(0, t.loyalty - drop) };
          entries.push({ cityId: t.locationCityId ?? null, kind: 'espionage',
            text: `${fnE} slanders your officer ${t.name.en} — loyalty −${drop}.`,
            textZh: `${fnZ}行離間,陷我${t.name.zh},忠誠 −${drop}。` });
        }
      } else {
        entries.push({ cityId: t.locationCityId ?? null, kind: 'espionage',
          text: `${fnE}'s plot against ${t.name.en} is uncovered.`, textZh: `${fnZ}謀我${t.name.zh}之計為我所察。` });
      }
      acted = true;
    }

    // 2) 破壊 — burn a well-stocked player city's granaries.
    if (!acted && richCity && capital.gold >= COST.sabotage && roll < 0.6) {
      cities[capital.id] = { ...capital, gold: capital.gold - COST.sabotage };
      if (ctx.rng() < Math.max(0.05, Math.min(0.9, baseChance('sabotage')))) {
        const lost = Math.floor(richCity.food * (0.25 + ctx.rng() * 0.15));
        cities[richCity.id] = { ...cities[richCity.id], food: Math.max(0, richCity.food - lost) };
        entries.push({ cityId: richCity.id, kind: 'espionage',
          text: `${fnE}'s saboteurs torch the granaries at ${richCity.name.en} — ${lost.toLocaleString()} food lost.`,
          textZh: `${fnZ}細作焚我${richCity.name.zh}糧倉,毀糧 ${lost.toLocaleString()} 石。` });
      } else {
        entries.push({ cityId: richCity.id, kind: 'espionage', text: `Saboteurs from ${fnE} are caught at ${richCity.name.en}.`, textZh: `${fnZ}縱火細作為${richCity.name.zh}所擒。` });
      }
      acted = true;
    }

    // 3) 煽動 — stir unrest in a restive player city.
    if (!acted && midCity && capital.gold >= COST.instigate && roll < 0.85) {
      cities[capital.id] = { ...capital, gold: capital.gold - COST.instigate };
      if (ctx.rng() < Math.max(0.05, Math.min(0.9, baseChance('instigate')))) {
        const drop = 12 + Math.floor(ctx.rng() * 13);
        cities[midCity.id] = { ...cities[midCity.id], loyalty: Math.max(0, midCity.loyalty - drop) };
        entries.push({ cityId: midCity.id, kind: 'espionage',
          text: `${fnE} foments unrest in ${midCity.name.en} — loyalty −${drop}.`,
          textZh: `${fnZ}煽動我${midCity.name.zh}民心,民忠 −${drop}。` });
      } else {
        entries.push({ cityId: midCity.id, kind: 'espionage', text: `Agitators from ${fnE} are rooted out of ${midCity.name.en}.`, textZh: `${fnZ}煽亂之徒為${midCity.name.zh}所除。` });
      }
      acted = true;
    }

    // 4) 潛伏細作 — plant a sleeper in a player city (the player must 肅諜 to find it).
    if (!acted && capital.gold >= COST.plant && playerCities().length > 0 && roll < 0.5) {
      const targetCity = playerCities().sort((a, b) => b.population - a.population)[0];
      if (targetCity && !ctx.embeddedSpies.some((s) => s.agentOfficerId === spy.id)) {
        cities[capital.id] = { ...capital, gold: capital.gold - COST.plant };
        newSpies.push({
          id: `spy-${force.id}-${spy.id}`, agentOfficerId: spy.id, targetCityId: targetCity.id,
          originCityId: force.capitalCityId, targetForceId: playerForceId, ownerForceId: force.id,
          plantedYear: ctx.date.year, exposure: 0,
        });
        officers[spy.id] = { ...officers[spy.id], task: null, locationCityId: targetCity.id };
        // A planted spy is covert — no immediate news (revealed only when caught).
        acted = true;
      }
    }

    // 5) 暗殺 — a bellicose, wealthy court sends a killer after a key general.
    if (!acted && strongOfficer && capital.gold >= COST.assassinate && appetite >= 1.2 && roll < 0.25) {
      cities[capital.id] = { ...capital, gold: capital.gold - COST.assassinate };
      if (ctx.rng() < Math.max(0.02, Math.min(0.6, baseChance('assassinate')))) {
        officers[strongOfficer.id] = { ...strongOfficer, status: 'dead', forceId: null, task: null };
        entries.push({ cityId: strongOfficer.locationCityId ?? null, kind: 'espionage',
          text: `Your general ${strongOfficer.name.en} is struck down by an assassin in ${fnE}'s pay!`,
          textZh: `我將${strongOfficer.name.zh}為刺客所害 — 主使乃${fnZ}!` });
      } else {
        entries.push({ cityId: strongOfficer.locationCityId ?? null, kind: 'espionage',
          text: `An assassin sent by ${fnE} fails to reach ${strongOfficer.name.en} — the plot is exposed.`,
          textZh: `${fnZ}遣刺客謀我${strongOfficer.name.zh},事敗敗露。` });
      }
      acted = true;
    }
  }

  return { cities, officers, newSpies, entries };
}
