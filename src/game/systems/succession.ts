import type {
  EntityId,
  FamilyRelation,
  Force,
  Officer,
  ReportEntry,
} from '../types';
import type { HeroicDeeds } from '../types/deeds';
import { careerStanding, canInheritForce } from './career';

/**
 * When a force's ruler dies, automatically appoint a successor:
 *   1. A living child (from family relations) of the dead ruler, if any.
 *   2. Otherwise, the surviving officer in the force with the highest
 *      (loyalty + politics) score.
 *   3. Otherwise, the force is considered ended (force has no living
 *      members; we leave it for the existing dissolution logic).
 */
export interface SuccessionContext {
  forces: Record<EntityId, Force>;
  officers: Record<EntityId, Officer>;
  family: FamilyRelation[];
  /** The chronicle (一代記) officer, if any — inherits their force when its
   *  ruler dies, provided they've risen to 都督 (Viceroy) or above. */
  careerOfficerId?: EntityId | null;
  deeds?: Record<EntityId, HeroicDeeds>;
}

export interface SuccessionOutput {
  forces: Record<EntityId, Force>;
  entries: ReportEntry[];
}

export function applySuccession(ctx: SuccessionContext): SuccessionOutput {
  const forces = { ...ctx.forces };
  const entries: ReportEntry[] = [];

  for (const force of Object.values(forces)) {
    const ruler = ctx.officers[force.rulerOfficerId];
    if (ruler && ruler.status !== 'dead') continue;

    // The chronicle officer inherits their own force if they've risen high enough.
    const careerOff = ctx.careerOfficerId ? ctx.officers[ctx.careerOfficerId] : null;
    const careerInherits = !!careerOff &&
      careerOff.status !== 'dead' && careerOff.status !== 'imprisoned' &&
      careerOff.forceId === force.id &&
      careerOff.id !== force.rulerOfficerId &&
      canInheritForce(careerStanding(ctx.deeds?.[careerOff.id]));

    // Ruler is dead — find heir.
    const candidates = findCandidates(force, ruler ?? null, ctx.family, ctx.officers);
    const heir = careerInherits ? careerOff! : candidates[0];
    if (!heir) continue;
    forces[force.id] = { ...force, rulerOfficerId: heir.id };
    entries.push({
      cityId: null,
      kind: 'succession',
      text: `${heir.name.en} has inherited the ${force.name.en} force following the death of ${ruler?.name.en ?? 'the previous ruler'}.`,
      textZh: `${ruler?.name.zh ?? '前主公'}薨，${heir.name.zh}繼承${force.name.zh}基業。`,
    });
  }
  return { forces, entries };
}

function findCandidates(
  force: Force,
  deadRuler: Officer | null,
  family: FamilyRelation[],
  officers: Record<EntityId, Officer>,
): Officer[] {
  const isLivingInForce = (id: EntityId): boolean => {
    const o = officers[id];
    return !!o && o.status !== 'dead' && o.status !== 'imprisoned' && o.forceId === force.id;
  };
  // 1. Children of the dead ruler.
  const children: Officer[] = [];
  if (deadRuler) {
    for (const r of family) {
      if (r.kind !== 'parent-child') continue;
      if (r.officerB === deadRuler.id && isLivingInForce(r.officerA)) {
        const c = officers[r.officerA];
        if (c) children.push(c);
      } else if (r.officerA === deadRuler.id && isLivingInForce(r.officerB)) {
        const c = officers[r.officerB];
        if (c) children.push(c);
      }
    }
  }
  if (children.length > 0) {
    // Eldest male preferred; tiebreak on politics.
    children.sort((a, b) => {
      const ageA = a.birthYear; // smaller = older
      const ageB = b.birthYear;
      if (a.female !== b.female) return a.female ? 1 : -1;
      if (ageA !== ageB) return ageA - ageB;
      return b.stats.politics - a.stats.politics;
    });
    return children;
  }
  // 2. Highest loyalty + politics among living force members.
  const fallback = Object.values(officers)
    .filter((o) => isLivingInForce(o.id))
    .sort((a, b) => (b.loyalty + b.stats.politics) - (a.loyalty + a.stats.politics));
  return fallback;
}
