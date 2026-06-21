import type { City, EntityId, Force, Officer } from '../types';
import { CLANS, CLANS_BY_ID, clanOf, isCommoner } from '../data/clans';

/**
 * 門閥世族 loop — each season the realm's 門第政策 (recruitmentStance) tugs the
 * loyalty of its great-clan scions against its 寒門 nobodies, and a clan that
 * grows over-mighty under an aristocratic line lends its strongmen a push
 * toward usurpation (司馬代魏). Pure; mutates nothing of its inputs.
 */
export interface ClanTickContext {
  officers: Record<EntityId, Officer>;
  forces: Record<EntityId, Force>;
  cities: Record<EntityId, City>;
  /** Player realm — its stance is opt-in (undefined → 並用); AI realms derive a
   *  default from how clan-heavy they are, so 司馬代魏 can emerge unprompted. */
  playerForceId?: EntityId | null;
  /** Deterministic seed (derive from the campaign date). */
  seed: number;
}

/**
 * Effective 門第政策 for a realm. The player's is exactly what they set (absent
 * → 並用, no effect). An AI realm with no explicit stance leans aristocratic
 * when ≥2 great-clan scions serve it (so a clan-stacked Wei drifts that way and
 * eventually breeds its over-mighty subject), otherwise stays neutral.
 */
export function effectiveStance(
  force: Force,
  officers: Record<EntityId, Officer>,
  isPlayer: boolean,
): Force['recruitmentStance'] {
  if (force.recruitmentStance) return force.recruitmentStance;
  if (isPlayer) return 'balanced';
  let scions = 0;
  for (const clan of CLANS) {
    for (const id of clan.members) {
      const o = officers[id];
      if (o && o.forceId === force.id && o.status !== 'dead' && o.status !== 'imprisoned') scions++;
    }
  }
  return scions >= 2 ? 'aristocratic' : 'balanced';
}

export interface ClanTickResult {
  /** Officers with loyalty nudged by the stance. */
  officers: Record<EntityId, Officer>;
  /** Season-report lines (clan disaffection / over-mighty warnings). */
  entries: Array<{ cityId: EntityId; text: string; textZh: string }>;
  /** Per-officer betrayal-chance bonus to feed ambition.factionBoost. */
  factionBoost: Record<EntityId, number>;
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * 世族勢力 — a clan's influence within one realm: how many of its scions serve,
 * weighted by their ability, amplified when the realm leans aristocratic.
 * Returns 0..~100. Pure helper, also used by the UI.
 */
export function clanInfluence(
  officers: Record<EntityId, Officer>,
  forceId: EntityId,
  clanId: string,
  stance: Force['recruitmentStance'],
): number {
  const clan = CLANS_BY_ID[clanId];
  if (!clan) return 0;
  let inf = 0;
  for (const id of clan.members) {
    const o = officers[id];
    if (!o || o.forceId !== forceId) continue;
    if (o.status === 'dead' || o.status === 'imprisoned') continue;
    const ability = Math.max(o.stats.intelligence, o.stats.politics, o.stats.war);
    inf += 8 + ability * 0.25;
  }
  if (stance === 'aristocratic') inf *= 1.5;
  else if (stance === 'meritocratic') inf *= 0.6;
  return Math.round(Math.min(100, inf));
}

export function tickClans(ctx: ClanTickContext): ClanTickResult {
  const officers = { ...ctx.officers };
  const entries: ClanTickResult['entries'] = [];
  const factionBoost: Record<EntityId, number> = {};
  const rng = mulberry32(ctx.seed);

  const adjust = (id: EntityId, delta: number) => {
    const o = officers[id];
    if (!o) return;
    const loyalty = Math.max(0, Math.min(100, o.loyalty + delta));
    if (loyalty !== o.loyalty) officers[id] = { ...o, loyalty };
  };

  for (const force of Object.values(ctx.forces)) {
    const stance = effectiveStance(force, officers, force.id === ctx.playerForceId);
    if (stance === 'balanced') continue;
    const capital = force.capitalCityId;

    // Loyalty tug: scions vs commoners.
    for (const o of Object.values(officers)) {
      if (o.forceId !== force.id) continue;
      if (o.status === 'dead' || o.status === 'imprisoned') continue;
      const aristocrat = clanOf(o) !== null;
      if (stance === 'aristocratic') {
        if (aristocrat) adjust(o.id, 1);
        else if (isCommoner(o)) adjust(o.id, -2);
      } else {
        // meritocratic
        if (isCommoner(o)) adjust(o.id, 2);
        else if (aristocrat) adjust(o.id, -1);
      }
    }

    // Per-clan disaffection / over-mighty checks.
    for (const clan of CLANS) {
      const scions = clan.members
        .map((id) => officers[id])
        .filter((o): o is Officer => !!o && o.forceId === force.id && o.status !== 'dead' && o.status !== 'imprisoned');
      if (scions.length === 0) continue;
      const inf = clanInfluence(officers, force.id, clan.id, stance);
      const avgLoyalty = scions.reduce((s, o) => s + o.loyalty, 0) / scions.length;

      if (stance === 'meritocratic' && scions.length >= 2 && avgLoyalty < 40) {
        entries.push({
          cityId: capital,
          text: `The ${clan.name.en} (${clan.seat.en}) chafe under ${force.name.en}'s 唯才是舉 — old families feel passed over.`,
          textZh: `${force.name.zh}行唯才是舉,${clan.seat.zh}${clan.name.zh}心懷怨望,自覺見輕。`,
        });
      }

      if (stance === 'aristocratic' && inf >= 70) {
        // Over-mighty clan: its ablest low-loyalty scion gets a usurpation push.
        let strongman: Officer | null = null;
        for (const o of scions) {
          if (o.loyalty >= 45) continue;
          if (!strongman || ability(o) > ability(strongman)) strongman = o;
        }
        if (strongman) {
          factionBoost[strongman.id] = Math.min(0.06, (inf - 60) * 0.0015 + 0.01);
          if (rng() < 0.25) {
            entries.push({
              cityId: capital,
              text: `${clan.name.en} grows over-mighty in ${force.name.en}; ${strongman.name.en} eclipses the throne's shadow.`,
              textZh: `${clan.name.zh}坐大於${force.name.zh},${strongman.name.zh}權傾朝野,主疑其志。`,
            });
          }
        }
      }
    }
  }

  return { officers, entries, factionBoost };
}

function ability(o: Officer): number {
  return o.stats.war + o.stats.leadership + o.stats.intelligence * 0.6 + o.stats.politics * 0.4;
}

/** Recruit-success modifier the realm's stance + content clans lend. Used by
 *  访贤/劝降. Aristocratic realms open the gentry's doors; meritocratic realms
 *  trade that for breadth (handled by the commoner-arrival path). */
export function stanceRecruitModifier(
  officers: Record<EntityId, Officer>,
  forceId: EntityId,
  stance: Force['recruitmentStance'],
): number {
  if (stance !== 'aristocratic') return 0;
  let bonus = 0;
  for (const clan of CLANS) {
    const serving = clan.members.some((id) => {
      const o = officers[id];
      return o && o.forceId === forceId && o.status !== 'dead' && o.status !== 'imprisoned' && o.loyalty >= 50;
    });
    if (serving) bonus += clan.perk.recruitBonus;
  }
  return Math.min(0.3, bonus);
}
