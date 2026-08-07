import type {
  Appointment,
  City,
  DiplomaticState,
  EdictKind,
  EntityId,
  Force,
  GameDate,
  HeroicDeeds,
  ImperialRank,
  IssuedEdict,
  Officer,
  ReportEntry,
} from '../types';
import { EDICTS_BY_KIND, IMPERIAL_RANKS, IMPERIAL_RANKS_BY_ID } from '../data/imperial';
import { canPromoteToRank } from './imperialEffects';
import { getRelation } from './diplomacy';

const SEASON_IDX = { spring: 0, summer: 1, autumn: 2, winter: 3 } as const;
type Season = keyof typeof SEASON_IDX;

export interface AICourtContext {
  forces: Record<EntityId, Force>;
  officers: Record<EntityId, Officer>;
  cities: Record<EntityId, City>;
  appointments: Appointment[];
  edictCooldowns: Record<string, { year: number; season: Season }>;
  deeds: Record<EntityId, HeroicDeeds>;
  diplomacy: DiplomaticState;
  eventFlags: Record<string, boolean>;
  mandate: { byForce: Record<EntityId, number> };
  date: GameDate;
  playerForceId: EntityId | null;
  rng: () => number;
}

export interface AICourtOutput {
  forces: Record<EntityId, Force>;
  officers: Record<EntityId, Officer>;
  cities: Record<EntityId, City>;
  edictHistory: IssuedEdict[];
  edictCooldowns: Record<string, { year: number; season: Season }>;
  casusBelliMarks: Array<{ byForceId: EntityId; targetForceId: EntityId; expiresYear: number; expiresSeason: Season }>;
  /** New imperial rank promotions this tick. */
  rankChanges: Array<{ forceId: EntityId; newRank: ImperialRank }>;
  entries: ReportEntry[];
  /** Whether each AI force used its enthronement edict this tick. */
  newEnthronements: EntityId[];
  /** 求賢令 — forces that issued a Call for Talent this tick (host folds each
   *  into recruitBonusSeasons so commoners actually answer, §3.1). */
  talentEdicts: EntityId[];
}

function nextSeasonAbs(date: GameDate, after: number): { year: number; season: Season } {
  const cur = date.year * 4 + SEASON_IDX[date.season];
  const nextAbs = cur + after;
  return { year: Math.floor(nextAbs / 4), season: (['spring', 'summer', 'autumn', 'winter'] as const)[nextAbs % 4] };
}

/**
 * 敕令冷卻的鍵 —— **每家一份,別再共用。**
 *
 * `state.edictCooldowns` 原本只以敕令種類為鍵,而它同時給玩家和全部 AI 用:
 * 蜀漢一下大赦,魏、吳、和**玩家**的大赦一起進冷卻。抓到它是因為
 * 「三分天下,蜀吳同時稱帝」的測試只回一家 —— 蜀先發了即位詔,吳當季
 * 就被同一把鎖擋住了,而那正是 229 年孫權該做的事。
 *
 * 存檔相容:玩家那側仍寫裸的 `kind`(store.ts 的讀寫沒動),AI 改用
 * `forceId::kind`,舊檔照樣讀得起來,只是 AI 冷卻從零開始。
 */
function cooldownKey(forceId: EntityId, kind: EdictKind): string {
  return `${forceId}::${kind}`;
}

function onCooldown(
  edictCooldowns: Record<string, { year: number; season: Season }>,
  key: string,
  date: GameDate,
): boolean {
  const cd = edictCooldowns[key];
  if (!cd) return false;
  const cdAbs = cd.year * 4 + SEASON_IDX[cd.season];
  const nowAbs = date.year * 4 + SEASON_IDX[date.season];
  return cdAbs > nowAbs;
}

function canAffordEdict(
  force: Force,
  cities: Record<EntityId, City>,
  cost: number,
): boolean {
  const cap = cities[force.capitalCityId];
  return !!cap && cap.gold >= cost;
}

/**
 * Per-season AI court actions: imperial rank promotions + edict issuance.
 * Loosely models historical opportunism — once a warlord controls enough
 * cities/years, they march up the imperial ladder; with no opposition they
 * eventually enthrone. Edicts are picked greedily by current need.
 */
export function planAICourt(ctx: AICourtContext): AICourtOutput {
  const forces = { ...ctx.forces };
  const officers = { ...ctx.officers };
  const cities = { ...ctx.cities };
  const edictCooldowns = { ...ctx.edictCooldowns };
  const edictHistory: IssuedEdict[] = [];
  const casusBelliMarks: AICourtOutput['casusBelliMarks'] = [];
  const rankChanges: AICourtOutput['rankChanges'] = [];
  const newEnthronements: EntityId[] = [];
  const talentEdicts: EntityId[] = [];
  const entries: ReportEntry[] = [];

  // 前線 — a city is exposed if any neighbour is held by a rival force.
  const isFrontline = (city: City): boolean =>
    city.adjacentCityIds.some((nid) => {
      const n = cities[nid];
      return !!n && n.ownerForceId != null && n.ownerForceId !== city.ownerForceId;
    });
  // 治所價值 — big and safe cities make better seats; frontline cities are
  // discounted so the AI prefers a defensible interior capital.
  const seatScore = (city: City): number => city.population * (isFrontline(city) ? 0.6 : 1);

  for (const force of Object.values(forces)) {
    if (force.id === ctx.playerForceId) continue;
    if (force.vassalOfForceId) continue; // vassals don't run their own court

    // --- 戰略遷都 — move the seat to a markedly better (bigger / safer) city.
    // The 1.4× threshold + the loyalty cost give hysteresis so the AI doesn't
    // thrash its capital back and forth season to season. ---
    {
      const cap = cities[force.capitalCityId];
      if (cap && cap.ownerForceId === force.id) {
        const owned = Object.values(cities).filter((c) => c.ownerForceId === force.id && !c.ruined);
        if (owned.length > 1) {
          let best = cap;
          let bestScore = seatScore(cap);
          for (const c of owned) {
            const s = seatScore(c);
            if (s > bestScore) { best = c; bestScore = s; }
          }
          if (best.id !== cap.id && bestScore >= seatScore(cap) * 1.4) {
            forces[force.id] = { ...forces[force.id], capitalCityId: best.id };
            cities[best.id] = { ...best, loyalty: Math.min(100, best.loyalty + 5) };
            cities[cap.id] = { ...cap, loyalty: Math.max(0, cap.loyalty - 3) };
            entries.push({
              cityId: best.id,
              kind: 'note',
              text: `${force.name.en} moves its capital to ${best.name.en}.`,
              textZh: `${force.name.zh}遷治所於${best.name.zh}。`,
            });
          }
        }
      }
    }

    // --- Imperial rank promotion (try one tier per tick) ---
    const currentRank = force.imperialRank ?? 'commoner';
    const currentTier = IMPERIAL_RANKS_BY_ID[currentRank]?.tier ?? 0;
    const nextDef = IMPERIAL_RANKS.find((r) => r.tier === currentTier + 1);
    if (nextDef && nextDef.id !== 'emperor') {
      const check = canPromoteToRank(nextDef.id, force, cities, ctx.appointments, ctx.date.year, ctx.eventFlags);
      if (check.ok) {
        forces[force.id] = { ...force, imperialRank: nextDef.id };
        rankChanges.push({ forceId: force.id, newRank: nextDef.id });
        entries.push({
          cityId: cities[force.capitalCityId]?.id ?? null,
          kind: 'note',
          text: `${force.name.en} ascends to ${nextDef.name.en}.`,
          textZh: `${force.name.zh}進爵為${nextDef.name.zh}。`,
        });
      }
    }

    // Re-read current rank after potential promotion.
    const ranknow = forces[force.id].imperialRank ?? 'commoner';
    const rankTier = IMPERIAL_RANKS_BY_ID[ranknow]?.tier ?? 0;

    // --- Decide which edict (if any) to issue ---
    // Priority order: enthronement > denounce > tax-amnesty > reward-merit
    // > self-deprecation > call-for-talent. One edict per force per tick.
    const tryIssue = (kind: EdictKind, target?: EntityId, extraEffects?: () => void): boolean => {
      const def = EDICTS_BY_KIND[kind];
      if (!def) return false;
      const minTier = IMPERIAL_RANKS_BY_ID[def.minRank]?.tier ?? 0;
      if (rankTier < minTier) return false;
      if (onCooldown(edictCooldowns, cooldownKey(force.id, kind), ctx.date)) return false;
      if (!canAffordEdict(forces[force.id], cities, def.goldCost)) return false;
      // Pay cost.
      const cap = cities[forces[force.id].capitalCityId];
      if (def.goldCost > 0 && cap) {
        cities[cap.id] = { ...cap, gold: cap.gold - def.goldCost };
      }
      if (extraEffects) extraEffects();
      // Mandate-adjusted cooldown (same logic as player path).
      const m = ctx.mandate.byForce[force.id] ?? 50;
      let cdSeasons = def.cooldownSeasons;
      if (kind !== 'era-change') {
        if (m < 30) cdSeasons += 1;
        else if (m > 70) cdSeasons = Math.max(1, cdSeasons - 1);
      }
      edictCooldowns[cooldownKey(force.id, kind)] = nextSeasonAbs(ctx.date, cdSeasons);
      edictHistory.push({
        id: `edict-${ctx.date.year}-${ctx.date.season}-${force.id}-${kind}`,
        kind, issuingForceId: force.id, targetForceId: target,
        issuedYear: ctx.date.year, issuedSeason: ctx.date.season,
      });
      return true;
    };

    /*
     * 1. 即位 —— 王爵 + 220 年後。
     *
     * 原本還有一條「天下已有帝則不得稱帝」,而那條**把史實寫反了**:
     * 劉備 221 稱帝、孫權 229 稱帝,兩次都正因為別人先稱了 ——
     * 「漢統既絕,不得不立」。照原規則,229 三帝盤上的 AI 孫權永遠登不了基,
     * 而那張盤的主目標就叫「吳皇帝即位」。
     *
     * 改成:天下無帝時照舊(0.4);已有他人稱帝時仍可**割據稱帝**,但門檻高 ——
     * 得有二十城的本錢、與那位皇帝勢不兩立(關係 ≤ -20),機率降到 0.15。
     * 附庸不在此列(上面已 continue)。
     */
    if (ranknow === 'king' && ctx.date.year >= 220) {
      const otherEmperors = Object.values(forces).filter(
        (f) => f.imperialRank === 'emperor' && f.id !== force.id,
      );
      // 王爵本身已要二十城(IMPERIAL_RANKS),所以這裡不必再驗一次本錢;
      // 真正的條件是「有一個否認得了的對頭」—— 只要天下還有一位與己為敵的
      // 皇帝,稱帝就有話說。用 some 不用 every:229 年孫權踐阼時與蜀漢是盟友
      // (蜀還遣陳震去道賀),他要否認的從來只有洛陽那一位。
      const atOddsWithSome = otherEmperors.some(
        (e) => getRelation(ctx.diplomacy, force.id, e.id).score <= 0,
      );
      const chance = otherEmperors.length === 0 ? 0.4 : (atOddsWithSome ? 0.15 : 0);
      if (ctx.rng() < chance) {
        const issued = tryIssue('enthronement', undefined, () => {
          forces[force.id] = { ...forces[force.id], imperialRank: 'emperor' };
          rankChanges.push({ forceId: force.id, newRank: 'emperor' });
          newEnthronements.push(force.id);
          // All non-vassal force officers lose 10 loyalty toward you.
          for (const o of Object.values(officers)) {
            if (o.forceId && o.forceId !== force.id) {
              const otherForce = forces[o.forceId];
              if (!otherForce || otherForce.vassalOfForceId !== force.id) {
                officers[o.id] = { ...o, loyalty: Math.max(0, o.loyalty - 10) };
              }
            }
          }
          entries.push({
            cityId: cities[forces[force.id].capitalCityId]?.id ?? null,
            kind: 'note',
            text: `${force.name.en} proclaims itself the new dynasty.`,
            textZh: `${force.name.zh}自立為帝。`,
          });
        });
        if (issued) continue;
      }
    }

    // 2. Denounce most-hostile rival.
    {
      const def = EDICTS_BY_KIND['denounce'];
      const minTier = def ? IMPERIAL_RANKS_BY_ID[def.minRank].tier : 99;
      if (rankTier >= minTier && !onCooldown(edictCooldowns, cooldownKey(force.id, 'denounce'), ctx.date)) {
        let worstRel: EntityId | null = null;
        let worstScore = -10;
        for (const target of Object.values(forces)) {
          if (target.id === force.id) continue;
          if (target.vassalOfForceId === force.id) continue;
          const rel = getRelation(ctx.diplomacy, force.id, target.id);
          if (rel.score < worstScore) { worstScore = rel.score; worstRel = target.id; }
        }
        if (worstRel && worstScore <= -30 && ctx.rng() < 0.35) {
          const issued = tryIssue('denounce', worstRel, () => {
            for (const o of Object.values(officers)) {
              if (o.forceId === worstRel) {
                officers[o.id] = { ...o, loyalty: Math.max(0, o.loyalty - 5) };
              }
            }
            const expires = nextSeasonAbs(ctx.date, 8);
            casusBelliMarks.push({
              byForceId: force.id, targetForceId: worstRel!,
              expiresYear: expires.year, expiresSeason: expires.season,
            });
            entries.push({
              cityId: null, kind: 'note',
              text: `${force.name.en} denounces ${forces[worstRel!]?.name.en ?? '?'}.`,
              textZh: `${force.name.zh}下詔討伐${forces[worstRel!]?.name.zh ?? '?'}。`,
            });
          });
          if (issued) continue;
        }
      }
    }

    // 3. tax-amnesty when avg city loyalty is low.
    {
      const ownCities = Object.values(cities).filter((c) => c.ownerForceId === force.id);
      if (ownCities.length > 0) {
        const avgLoyalty = ownCities.reduce((s, c) => s + c.loyalty, 0) / ownCities.length;
        if (avgLoyalty < 55) {
          const issued = tryIssue('tax-amnesty', undefined, () => {
            for (const c of ownCities) {
              cities[c.id] = { ...c, loyalty: Math.min(100, c.loyalty + 10) };
            }
            entries.push({
              cityId: ownCities[0].id, kind: 'note',
              text: `${force.name.en} proclaims a grand amnesty.`,
              textZh: `${force.name.zh}下大赦詔。`,
            });
          });
          if (issued) continue;
        }
      }
    }

    // 4. reward-merit when there's a high-deeds officer.
    {
      let bestId: EntityId | null = null;
      let bestScore = 0;
      for (const o of Object.values(officers)) {
        if (o.forceId !== force.id) continue;
        if (o.status === 'dead' || o.status === 'imprisoned') continue;
        const d = ctx.deeds[o.id];
        if (!d) continue;
        const score = d.killsTroops / 100 + d.duelsWon * 5 + d.captured * 8 +
          d.citiesTaken * 15 + d.espionageSuccess * 4 + d.civicWorks + d.battlesWon * 3;
        if (score > bestScore) { bestScore = score; bestId = o.id; }
      }
      if (bestId && bestScore >= 50 && ctx.rng() < 0.3) {
        const honored = officers[bestId];
        const issued = tryIssue('reward-merit', undefined, () => {
          officers[bestId!] = { ...honored, loyalty: Math.min(100, honored.loyalty + 15) };
          entries.push({
            cityId: honored.locationCityId, kind: 'note',
            text: `${force.name.en} honors ${honored.name.en} for merit.`,
            textZh: `${force.name.zh}賞功嘉勉${honored.name.zh}。`,
          });
        });
        if (issued) continue;
      }
    }

    // 5. self-deprecation: only when low mandate AND low city loyalty.
    {
      const m = ctx.mandate.byForce[force.id] ?? 50;
      const ownCities = Object.values(cities).filter((c) => c.ownerForceId === force.id);
      const avgLoyalty = ownCities.length > 0
        ? ownCities.reduce((s, c) => s + c.loyalty, 0) / ownCities.length
        : 100;
      if (m < 35 && avgLoyalty < 50 && ctx.rng() < 0.4) {
        tryIssue('self-deprecation', undefined, () => {
          for (const c of ownCities) {
            cities[c.id] = { ...c, loyalty: Math.min(100, c.loyalty + 15) };
          }
          entries.push({
            cityId: ownCities[0]?.id ?? null, kind: 'note',
            text: `${force.name.en} issues an edict of self-reproach.`,
            textZh: `${force.name.zh}下罪己詔。`,
          });
        });
        continue;
      }
    }

    // 6. call-for-talent occasionally when officer count is low.
    {
      const forceOfficers = Object.values(officers).filter(
        (o) => o.forceId === force.id && o.status !== 'dead' && o.status !== 'imprisoned',
      );
      if (forceOfficers.length < 6 && ctx.rng() < 0.2) {
        tryIssue('call-for-talent', undefined, () => {
          // 求賢令出寒門 — grant the recruit bonus so commoners actually answer
          // (the host folds talentEdicts into recruitBonusSeasons).
          talentEdicts.push(force.id);
          entries.push({
            cityId: null, kind: 'note',
            text: `${force.name.en} calls for sages.`,
            textZh: `${force.name.zh}下求賢令。`,
          });
        });
      }
    }
  }

  return {
    forces, officers, cities,
    edictHistory, edictCooldowns, casusBelliMarks,
    rankChanges, entries, newEnthronements, talentEdicts,
  };
}
