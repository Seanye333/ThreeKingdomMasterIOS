import type {
  City,
  EntityId,
  GameDate,
  Officer,
  OfficerWish,
  ReportEntry,
  WishKind,
} from '../types';
import { POLICY_DEFS, POLICY_PREREQ, type PolicyId } from '../data/officerAttributes';
import { PEERAGES, PEERAGES_BY_ID } from '../data/peerage';
import { hasChronicAilment, chronicAilmentOf } from './afflictions';

/**
 * Officer wishes: a small chance each season that an active officer in the
 * player's force will make a request. Granting it boosts loyalty; rejecting
 * it drops loyalty by the configured penalty.
 */

const WISH_CHANCE_PER_OFFICER = 0.04;
const MAX_OPEN_WISHES = 4;

export interface WishContext {
  officers: Record<EntityId, Officer>;
  cities: Record<EntityId, City>;
  playerForceId: EntityId | null;
  existing: OfficerWish[];
  date: GameDate;
  rng: () => number;
}

export function rollWishes(ctx: WishContext): OfficerWish[] {
  if (!ctx.playerForceId) return ctx.existing;
  if (ctx.existing.length >= MAX_OPEN_WISHES) return ctx.existing;
  const playerOfficers = Object.values(ctx.officers).filter(
    (o) => {
      if (o.forceId !== ctx.playerForceId) return false;
      if (o.status !== 'idle' && o.status !== 'wounded') return false;
      if (o.loyalty >= 95) return false;
      if (ctx.existing.some((w) => w.officerId === o.id)) return false;
      // 'loyal' trait officers never make demands (含蓄不索取).
      if ((o.traits ?? []).includes('loyal')) return false;
      return true;
    },
  );
  if (playerOfficers.length === 0) return ctx.existing;
  const newWishes: OfficerWish[] = [];
  for (const o of playerOfficers) {
    // Personality scales base chance: arrogant 2×, humble 0.3×, others 1×.
    const traits = o.traits ?? [];
    let chance = WISH_CHANCE_PER_OFFICER;
    if (traits.includes('arrogant') || traits.includes('ambitious')) chance *= 2;
    if (traits.includes('humble')) chance *= 0.3;
    if (ctx.rng() > chance) continue;
    if (newWishes.length + ctx.existing.length >= MAX_OPEN_WISHES) break;
    const w = generateWish(o, ctx);
    if (w) newWishes.push(w);
  }
  return [...ctx.existing, ...newWishes];
}

/**
 * Prune wishes whose officer has died/defected, OR which have aged past
 * their expiry. Expiry has a small loyalty cost — ignoring a letter is
 * itself disrespectful.
 */
export function expireWishes(
  wishes: OfficerWish[],
  officers: Record<EntityId, Officer>,
  currentYear: number,
  currentSeason: 'spring' | 'summer' | 'autumn' | 'winter',
): { wishes: OfficerWish[]; officers: Record<EntityId, Officer>; entries: ReportEntry[] } {
  const seasonIdx = { spring: 0, summer: 1, autumn: 2, winter: 3 } as const;
  const nextOfficers = { ...officers };
  const surviving: OfficerWish[] = [];
  const entries: ReportEntry[] = [];
  const nowAbs = currentYear * 4 + seasonIdx[currentSeason];
  for (const w of wishes) {
    const o = nextOfficers[w.officerId];
    // Officer gone or dead — silently drop.
    if (!o || o.status === 'dead' || o.status === 'imprisoned') continue;
    const issuedAbs = w.issuedYear * 4 + seasonIdx[w.issuedSeason];
    const maxAge = w.expiresAfterSeasons ?? 6;
    if (nowAbs - issuedAbs < maxAge) {
      surviving.push(w);
      continue;
    }
    // Expired: small loyalty penalty (smaller than reject — silent neglect).
    if (w.kind !== 'info') {
      const penalty = 3;
      nextOfficers[o.id] = { ...o, loyalty: Math.max(0, o.loyalty - penalty) };
      entries.push({
        cityId: o.locationCityId,
        kind: 'note',
        text: `${o.name.en}'s letter went unanswered (loyalty −${penalty}).`,
        textZh: `${o.name.zh}之書信無人問津（忠誠 −${penalty}）。`,
      });
    }
  }
  return { wishes: surviving, officers: nextOfficers, entries };
}

/**
 * 怨氣漸消 — each season, an officer with no open wish and decent loyalty has a
 * chance to let an old grievance fade (grievanceCount −1). Stops a few past
 * rejections from permanently shadowing an otherwise content officer. Pure.
 */
export function decayGrievances(
  officers: Record<EntityId, Officer>,
  openWishes: OfficerWish[],
  rng: () => number,
): Record<EntityId, Officer> {
  const withWish = new Set(openWishes.map((w) => w.officerId));
  let changed = false;
  const next = { ...officers };
  for (const o of Object.values(officers)) {
    if ((o.grievanceCount ?? 0) <= 0) continue;
    if (withWish.has(o.id)) continue;            // a pending ask keeps the grudge fresh
    if (o.status === 'dead' || o.status === 'imprisoned') continue;
    if (o.loyalty < 60) continue;                // resentment only fades when content
    if (rng() < 0.25) {                          // ~1-in-4 seasons
      next[o.id] = { ...o, grievanceCount: (o.grievanceCount ?? 0) - 1 };
      changed = true;
    }
  }
  return changed ? next : officers;
}

/**
 * Wounded-officer wish: a wounded officer with 'cautious' or `sickly`
 * trait may petition to retire. Called from the wounded-recovery tick.
 */
export function maybeWoundedRetireWish(
  officer: Officer,
  date: GameDate,
  rng: () => number,
): OfficerWish | null {
  const traits = officer.traits ?? [];
  const ageHigh = (date.year - officer.birthYear) >= 55;
  const wantsOut = traits.includes('cautious') || traits.includes('sickly') || ageHigh;
  if (!wantsOut) return null;
  if (rng() > 0.35) return null;
  return {
    id: `wish-retire-${officer.id}-${date.year}-${date.season}`,
    officerId: officer.id,
    kind: 'retire',
    text: {
      zh: `${officer.name.zh}經此一傷，求歸故里安養。`,
      en: `${officer.name.en} pleads to retire to their home after this wound.`,
    },
    issuedYear: date.year,
    issuedSeason: date.season,
    rejectPenalty: 12,
    grantBonus: 8,
    expiresAfterSeasons: 4,
  };
}

function generateWish(o: Officer, ctx: WishContext): OfficerWish | null {
  const traits = o.traits ?? [];
  // 致仕 — a very old officer may petition to retire honourably, wound or no
  // wound. (The selfless 'loyal' are already filtered out upstream.)
  const age = ctx.date.year - o.birthYear;
  if (age >= 68 && ctx.rng() < 0.5) {
    return {
      id: `wish-retire-${o.id}-${ctx.date.year}-${ctx.date.season}`,
      officerId: o.id,
      kind: 'retire',
      text: {
        zh: `${o.name.zh}年事已高,上書乞骸骨,願歸故里。`,
        en: `${o.name.en}, grown old, petitions to retire honourably.`,
      },
      issuedYear: ctx.date.year,
      issuedSeason: ctx.date.season,
      rejectPenalty: 10,
      grantBonus: 8,
      expiresAfterSeasons: 4,
    };
  }
  // 老病告退 — an officer worn down by a lasting 宿疾 (much likelier past their
  // prime) may lay down their arms. A chance to lose a maimed veteran unless you
  // honour the plea — or cure them first (洗髓/名醫/傷兵營).
  if (hasChronicAilment(o) && ctx.rng() < (age >= 50 ? 0.28 : 0.12)) {
    const ail = chronicAilmentOf(o);
    return {
      id: `wish-retire-${o.id}-${ctx.date.year}-${ctx.date.season}`,
      officerId: o.id,
      kind: 'retire',
      text: {
        zh: `${o.name.zh}宿疾「${ail?.labelZh ?? '纏身'}」日重,力不從心,乞骸骨以歸養。`,
        en: `${o.name.en}, worn by a lasting ${ail?.labelEn ?? 'infirmity'}, begs to retire.`,
      },
      issuedYear: ctx.date.year,
      issuedSeason: ctx.date.season,
      rejectPenalty: 12,
      grantBonus: 8,
      expiresAfterSeasons: 4,
    };
  }
  // Officers with int >= 70 and < 8 policies sometimes wish to learn one.
  const have = new Set(o.policies ?? []);
  const learnable: PolicyId[] = [];
  if (o.stats.intelligence >= 70 && have.size < 8) {
    for (const id of Object.keys(POLICY_DEFS) as PolicyId[]) {
      if (have.has(id)) continue;
      const prereqs = POLICY_PREREQ[id] ?? [];
      if (prereqs.every((p) => have.has(p))) learnable.push(id);
    }
  }
  // Find a rival (envious/jealous/proud) for dismiss-rival wish.
  const rivals = (traits.includes('envious') || traits.includes('jealous') || traits.includes('arrogant'))
    ? Object.values(ctx.officers).filter(
        (other) =>
          other.id !== o.id &&
          other.forceId === o.forceId &&
          other.status !== 'dead' &&
          other.stats[o.stats.war >= o.stats.intelligence ? 'war' : 'intelligence'] >
            o.stats[o.stats.war >= o.stats.intelligence ? 'war' : 'intelligence'],
      )
    : [];
  // 求爵 — a renowned officer may petition for the next peerage tier.
  const curPeerIdx = o.peerageId ? PEERAGES.findIndex((p) => p.id === o.peerageId) : -1;
  const nextPeerage = curPeerIdx + 1 < PEERAGES.length ? PEERAGES[curPeerIdx + 1] : null;
  const ambitious = traits.includes('ambitious') || traits.includes('arrogant');
  const wantsPeerage = !!nextPeerage && ((o.renown ?? 0) >= 150 || (ambitious && (o.renown ?? 0) >= 80));
  // 求師 — a junior officer with a much stronger same-force colleague may seek a mentor.
  const myBest = Math.max(o.stats.war, o.stats.intelligence);
  const mentorCand = !o.mentorId && (o.level ?? 1) < 14
    ? Object.values(ctx.officers).find(
        (m) => m.id !== o.id && m.forceId === o.forceId && m.status !== 'dead' &&
          Math.max(m.stats.war, m.stats.intelligence) >= myBest + 15,
      )
    : undefined;
  // Build weighted kind pool by personality.
  const weights: Array<[WishKind, number]> = [
    ['transfer',     traits.includes('refined') ? 2 : 1],
    ['reinforce',    o.stats.war >= 70 ? 2 : 1],
    ['promote',      ambitious ? 4 : 1],
    ['item',         o.stats.war >= 75 || traits.includes('martial-valor') ? 2 : 1],
    ['gift',         traits.includes('greedy') ? 3 : 1],
  ];
  if (learnable.length > 0) {
    weights.push(['learn-policy', traits.includes('humble') ? 5 : (o.stats.intelligence >= 80 ? 3 : 1)]);
  }
  if (rivals.length > 0) {
    weights.push(['dismiss-rival', 3]);
  }
  if (wantsPeerage) {
    weights.push(['peerage', ambitious ? 4 : 2]);
  }
  if (mentorCand) {
    weights.push(['mentor', traits.includes('humble') ? 4 : 2]);
  }
  // 上書: 5% chance of an info letter from a high-INT prefect-eligible officer.
  if (o.stats.intelligence >= 75 && ctx.rng() < 0.15) {
    weights.push(['info', 5]);
  }
  const total = weights.reduce((s, [, w]) => s + w, 0);
  let pick = ctx.rng() * total;
  let kind: WishKind = 'transfer';
  for (const [k, w] of weights) {
    pick -= w;
    if (pick <= 0) { kind = k; break; }
  }
  if (kind === 'learn-policy') {
    const wantId = learnable[Math.floor(ctx.rng() * learnable.length)];
    const want = POLICY_DEFS[wantId];
    return {
      id: `wish-${o.id}-${ctx.date.year}-${ctx.date.season}`,
      officerId: o.id,
      kind: 'learn-policy',
      text: {
        zh: `${o.name.zh}求學「${want?.zh ?? wantId}」之政。`,
        en: `${o.name.en} wishes to study the policy ${want?.en ?? wantId}.`,
      },
      targetId: wantId,
      issuedYear: ctx.date.year,
      issuedSeason: ctx.date.season,
      rejectPenalty: 4,
      grantBonus: 14,
    };
  }
  if (kind === 'transfer') {
    const otherCities = Object.values(ctx.cities).filter(
      (c) => c.ownerForceId === ctx.playerForceId && c.id !== o.locationCityId,
    );
    const target = otherCities[Math.floor(ctx.rng() * otherCities.length)];
    return {
      id: `wish-${o.id}-${ctx.date.year}-${ctx.date.season}`,
      officerId: o.id,
      kind: 'transfer',
      text: {
        zh: `${o.name.zh}請求轉任至${target?.name.zh ?? '其他城'}。`,
        en: `${o.name.en} requests transfer to ${target?.name.en ?? 'another city'}.`,
      },
      targetId: target?.id,
      issuedYear: ctx.date.year,
      issuedSeason: ctx.date.season,
      rejectPenalty: 8,
      grantBonus: 10,
    };
  }
  if (kind === 'reinforce') {
    return {
      id: `wish-${o.id}-${ctx.date.year}-${ctx.date.season}`,
      officerId: o.id,
      kind: 'reinforce',
      text: {
        zh: `${o.name.zh}請求增兵${o.locationCityId ? ctx.cities[o.locationCityId]?.name.zh : ''}。`,
        en: `${o.name.en} requests reinforcements for ${o.locationCityId ? ctx.cities[o.locationCityId]?.name.en : 'their city'}.`,
      },
      targetId: o.locationCityId ?? undefined,
      issuedYear: ctx.date.year,
      issuedSeason: ctx.date.season,
      rejectPenalty: 6,
      grantBonus: 8,
    };
  }
  if (kind === 'item') {
    const stat = o.stats.war >= o.stats.intelligence ? '寶刀' : '兵法書';
    const statEn = o.stats.war >= o.stats.intelligence ? 'a fine weapon' : 'a strategy treatise';
    return {
      id: `wish-${o.id}-${ctx.date.year}-${ctx.date.season}`,
      officerId: o.id,
      kind: 'item',
      text: {
        zh: `${o.name.zh}求${stat}一柄。`,
        en: `${o.name.en} requests ${statEn}.`,
      },
      issuedYear: ctx.date.year,
      issuedSeason: ctx.date.season,
      rejectPenalty: 4,
      grantBonus: 10,
    };
  }
  if (kind === 'dismiss-rival' && rivals.length > 0) {
    const rival = rivals[Math.floor(ctx.rng() * rivals.length)];
    return {
      id: `wish-${o.id}-${ctx.date.year}-${ctx.date.season}`,
      officerId: o.id,
      kind: 'dismiss-rival',
      text: {
        zh: `${o.name.zh}進言：求黜${rival.name.zh}之職。`,
        en: `${o.name.en} petitions to remove ${rival.name.en}.`,
      },
      targetId: rival.id,
      issuedYear: ctx.date.year,
      issuedSeason: ctx.date.season,
      rejectPenalty: 6,
      grantBonus: 8,
    };
  }
  if (kind === 'info') {
    const reports = composeInfoLetters(o, ctx);
    const r = reports[Math.floor(ctx.rng() * reports.length)];
    return {
      id: `wish-${o.id}-${ctx.date.year}-${ctx.date.season}`,
      officerId: o.id,
      kind: 'info',
      text: r,
      issuedYear: ctx.date.year,
      issuedSeason: ctx.date.season,
      rejectPenalty: 0,
      grantBonus: 2, // small acknowledgement loyalty
      expiresAfterSeasons: 3,
    };
  }
  if (kind === 'peerage' && nextPeerage) {
    return {
      id: `wish-${o.id}-${ctx.date.year}-${ctx.date.season}`,
      officerId: o.id,
      kind: 'peerage',
      text: {
        zh: `${o.name.zh}自陳功勳,求封「${nextPeerage.name.zh}」之爵。`,
        en: `${o.name.en} petitions to be enfeoffed as ${nextPeerage.name.en}.`,
      },
      targetId: nextPeerage.id,
      issuedYear: ctx.date.year,
      issuedSeason: ctx.date.season,
      rejectPenalty: 10,
      grantBonus: 12,
    };
  }
  if (kind === 'mentor' && mentorCand) {
    return {
      id: `wish-${o.id}-${ctx.date.year}-${ctx.date.season}`,
      officerId: o.id,
      kind: 'mentor',
      text: {
        zh: `${o.name.zh}願拜${mentorCand.name.zh}為師,以求精進。`,
        en: `${o.name.en} wishes to study under ${mentorCand.name.en}.`,
      },
      targetId: mentorCand.id,
      issuedYear: ctx.date.year,
      issuedSeason: ctx.date.season,
      rejectPenalty: 6,
      grantBonus: 10,
    };
  }
  if (kind === 'gift') {
    return {
      id: `wish-${o.id}-${ctx.date.year}-${ctx.date.season}`,
      officerId: o.id,
      kind: 'gift',
      text: {
        zh: `${o.name.zh}自陳勞苦,求主公賞賜以彰其功。`,
        en: `${o.name.en} asks for a reward to honour their service.`,
      },
      issuedYear: ctx.date.year,
      issuedSeason: ctx.date.season,
      rejectPenalty: 6,
      grantBonus: 8,
    };
  }
  return {
    id: `wish-${o.id}-${ctx.date.year}-${ctx.date.season}`,
    officerId: o.id,
    kind: 'promote',
    text: {
      zh: `${o.name.zh}請求升遷。`,
      en: `${o.name.en} requests promotion.`,
    },
    issuedYear: ctx.date.year,
    issuedSeason: ctx.date.season,
    rejectPenalty: 10,
    grantBonus: 12,
  };
}

/**
 * 上書 — the letters an officer could plausibly write from the post he
 * actually holds.
 *
 * Every line is gated on something true about THIS officer in THIS city this
 * season — the granary count, the graft in the clerks' books, the silted
 * ditches, his own age or unhealed wound — so a letter is never generic
 * filler. A lord reading two in a row should be able to tell the two
 * postings apart. The 問安 greeting is the last-resort fallback, not the
 * usual case it used to be.
 *
 * Exported so the pool can be tested directly: `generateWish` only ever
 * shows one of these at random.
 */
export function composeInfoLetters(
  o: Officer,
  ctx: Pick<WishContext, 'cities' | 'date'>,
): Array<{ zh: string; en: string }> {
  {
    const city = o.locationCityId ? ctx.cities[o.locationCityId] : undefined;
    const reports: Array<{ zh: string; en: string }> = [];
    const zh = o.name.zh, en = o.name.en;
    if (city) {
      const cz = city.name.zh, ce = city.name.en;
      // ── 城務 — the ledger of the place he sits in.
      if (city.food < city.troops * 0.8) {
        reports.push({
          zh: `${zh}上書：${cz}存糧不足，恐生變。`,
          en: `${en} reports low grain reserves in ${ce}.`,
        });
      }
      if (city.food > city.troops * 4) {
        reports.push({
          zh: `${zh}上書：${cz}倉廩皆盈，陳陳相因，宜及時轉輸他郡。`,
          en: `${en} writes that the granaries of ${ce} are full to the rafters, old grain under new — it should be moved on while it keeps.`,
        });
      }
      if (city.loyalty < 50) {
        reports.push({
          zh: `${zh}上書：${cz}民心浮動，宜安撫。`,
          en: `${en} reports stirring discontent in ${ce}.`,
        });
      }
      if (city.loyalty >= 90) {
        reports.push({
          zh: `${zh}上書：${cz}道不拾遺，市井無囂，父老以為數十年未有之安。`,
          en: `${en} writes that nothing dropped in the streets of ${ce} is picked up and the markets are quiet; the elders say there has been no such peace in decades.`,
        });
      }
      if (city.troops > 10000) {
        reports.push({
          zh: `${zh}上書：${cz}兵備整肅，可堪一戰。`,
          en: `${en} reports ${ce} stands battle-ready.`,
        });
      }
      if (city.troops < 3000) {
        reports.push({
          zh: `${zh}上書：${cz}城大而兵寡，設有緩急，恐不能守。`,
          en: `${en} writes that ${ce} is a large city with a thin garrison; should anything happen suddenly, he doubts it can be held.`,
        });
      }
      if ((city.corruption ?? 0) >= 40) {
        reports.push({
          zh: `${zh}上書：${cz}吏胥舞文，出入之數不相應，乞遣人按之。`,
          en: `${en} writes that the clerks of ${ce} are cooking the books — receipts and disbursements do not match — and asks that an auditor be sent.`,
        });
      }
      if ((city.hiddenHouseholds ?? 0) >= 20) {
        reports.push({
          zh: `${zh}上書：${cz}豪右蔭戶，版籍所載不及其半，賦役皆出於貧民。`,
          en: `${en} writes that the great houses of ${ce} are sheltering households off the registers — the rolls show under half the true number, and the levies all fall on the poor.`,
        });
      }
      if (city.defense < 30) {
        reports.push({
          zh: `${zh}上書：${cz}城堞頹圮，壕塹淤淺，乞給工料修之。`,
          en: `${en} writes that the battlements of ${ce} are crumbling and the ditches silted shallow, and asks for materials and labour to repair them.`,
        });
      }
      if (city.commerce > city.agriculture * 1.6) {
        reports.push({
          zh: `${zh}上書：${cz}市易日盛而田疇日荒，末富而本貧，非長久之計。`,
          en: `${en} writes that trade in ${ce} grows daily while the fields go to weeds — wealth in the branch and poverty at the root, which cannot last.`,
        });
      }
      if (city.agriculture > city.commerce * 1.6) {
        reports.push({
          zh: `${zh}上書：${cz}稼穡雖修而商旅不至，錢貨不流，物賤傷農。`,
          en: `${en} writes that ${ce} farms well but no merchants come; coin does not circulate, and prices so low they hurt the farmers.`,
        });
      }
      if (city.ruined) {
        reports.push({
          zh: `${zh}上書：${cz}焦土之餘，井邑無煙，白骨蔽野，非旬月可復。`,
          en: `${en} writes from the ashes of ${ce}: no smoke from the wards, bones in the open fields, and no restoring it in a month or two.`,
        });
      }
      if (city.imperialSeat) {
        reports.push({
          zh: `${zh}上書：乘輿駐蹕${cz}，百官環列，一舉一動皆在眾目，願主公慎之。`,
          en: `${en} writes that with the imperial carriage resting at ${ce} and the whole court around it, every move is watched — and asks his lord to be careful.`,
        });
      }
      // ── 時令 — what the season is doing to the land.
      if (ctx.date.season === 'spring') {
        reports.push({
          zh: `${zh}上書：春耕方始，${cz}民力已竭於徭役，乞緩一時之征。`,
          en: `${en} writes that the spring ploughing has begun and the people of ${ce} are already spent on corvée, and asks that this season's levy be eased.`,
        });
      } else if (ctx.date.season === 'summer') {
        reports.push({
          zh: `${zh}上書：夏雨連旬，${cz}河水暴漲，堤防當先葺。`,
          en: `${en} writes that ten days of summer rain have the rivers at ${ce} running high, and the dykes should be seen to first.`,
        });
      } else if (ctx.date.season === 'autumn') {
        reports.push({
          zh: `${zh}上書：秋熟已登，${cz}倉稟稍實，然野有遺秉，宜遣吏督之。`,
          en: `${en} writes that the autumn harvest is in and the granaries of ${ce} a little fuller, but sheaves are being left in the fields and an officer should be sent to see to it.`,
        });
      } else {
        reports.push({
          zh: `${zh}上書：歲暮苦寒，${cz}戍卒衣薄，乞給襦絮。`,
          en: `${en} writes that the year ends bitter cold and the garrison at ${ce} is thinly clothed, and asks for padded coats.`,
        });
      }
    }
    // ── 其人 — and something about the man holding the pen.
    const age = ctx.date.year - (o.birthYear ?? ctx.date.year - 30);
    if (age >= 60) {
      reports.push({
        zh: `${zh}上書：臣年已${age}，齒髮衰矣，猶思一效鞍馬之力，恐後無日。`,
        en: `${en} writes that he is ${age} now, his teeth and hair going, and would still like one more turn in the saddle before there is no time left.`,
      });
    }
    if (o.status === 'wounded') {
      reports.push({
        zh: `${zh}上書：臣創處未合，未能趨事，然軍中之務，不敢一日忘。`,
        en: `${en} writes that his wound has not closed and he cannot yet attend to duty — but that he has not forgotten the army's business for a single day.`,
      });
    }
    if (o.loyalty < 60) {
      reports.push({
        zh: `${zh}上書：臣以疏遠之身，久居閒任，未知進退所安，惟主公裁之。`,
        en: `${en} writes as an outsider long kept in an idle post, uncertain where he stands, and leaves the matter to his lord.`,
      });
    }
    const s = o.stats;
    if (s.intelligence >= 85 && s.war < 60) {
      reports.push({
        zh: `${zh}上書：兵者凶器，聖人不得已而用之。願主公先論廟算，後議出師。`,
        en: `${en} writes that arms are inauspicious things which the wise use only when they must, and asks that the reckoning be done in council before the marching order is given.`,
      });
    }
    if (s.war >= 85 && (o.status === 'idle')) {
      reports.push({
        zh: `${zh}上書：閒居日久，髀肉復生，願得一軍效命行間。`,
        en: `${en} writes that the flesh has grown back on his thighs from too much sitting, and asks for a command and a road to take it down.`,
      });
    }
    if (s.politics >= 85) {
      reports.push({
        zh: `${zh}上書：治國之要，在於安民；安民之本，在於足食。願主公省繇役而勸農桑。`,
        en: `${en} writes that governing turns on keeping the people settled, and keeping them settled turns on feeding them: lighten the corvée and encourage the fields.`,
      });
    }
    if (reports.length === 0) {
      reports.push({
        zh: `${zh}上書問安。`,
        en: `${en} sends a courtly letter of greeting.`,
      });
    }
    return reports;
  }
}


/**
 * Apply the answer to a wish: grants give the loyalty bonus and resolve the
 * referenced action; rejections cost loyalty.
 */
import { MILITARY_RANKS, MILITARY_RANKS_BY_ID } from '../data/titles';

export interface ApplyWishContext {
  officers: Record<EntityId, Officer>;
  cities: Record<EntityId, City>;
  /** Multiplier on the granted loyalty bonus — driven by 諫議大夫. */
  advisorMultiplier?: number;
  /** Pool of items not currently equipped; used for `item` wish grant. */
  unequippedItemIds?: EntityId[];
  /** Lost items pool; cheaper fallback if no unequipped exist. */
  lostItems?: Array<{ itemId: EntityId; cityId: EntityId }>;
}

export interface ApplyWishOutput {
  officers: Record<EntityId, Officer>;
  cities: Record<EntityId, City>;
  entry: ReportEntry;
  /** When the wish was 'item' and an item was granted, the consumed pool
   *  is reported here so the store can mutate state.lostItems / items. */
  consumedItemId?: EntityId;
  consumedFromLost?: EntityId; // cityId entry if drawn from lostItems
}

export function applyWishGrant(
  wish: OfficerWish,
  ctx: ApplyWishContext,
): ApplyWishOutput {
  const officers = { ...ctx.officers };
  const cities = { ...ctx.cities };
  const o = officers[wish.officerId];
  if (!o) {
    return {
      officers, cities,
      entry: { cityId: null, kind: 'note', text: 'Wish target gone.', textZh: '心願對象已不在。' },
    };
  }
  const bonus = Math.ceil(wish.grantBonus * (ctx.advisorMultiplier ?? 1));
  let extraEn = '';
  let extraZh = '';

  if (wish.kind === 'transfer' && wish.targetId) {
    officers[o.id] = {
      ...o,
      locationCityId: wish.targetId,
      loyalty: Math.min(100, o.loyalty + bonus),
    };
    const dest = cities[wish.targetId];
    if (dest) {
      extraEn = ` Moved to ${dest.name.en}.`;
      extraZh = `已轉任${dest.name.zh}。`;
    }
  } else if (wish.kind === 'reinforce' && wish.targetId) {
    // BUG FIX: actually add troops to the requested city + deduct gold
    // from capital. Up to 1500 troops, capped by city.troopCap.
    const city = cities[wish.targetId];
    if (city) {
      const cap = (city as City & { troopCap?: number }).troopCap ?? 30000;
      const add = Math.min(1500, Math.max(0, cap - city.troops));
      const goldCost = Math.min(city.gold, 400);
      cities[city.id] = {
        ...city,
        troops: city.troops + add,
        gold: Math.max(0, city.gold - goldCost),
      };
      officers[o.id] = { ...o, loyalty: Math.min(100, o.loyalty + bonus) };
      extraEn = ` ${add} troops drafted at ${city.name.en} (cost ${goldCost}g).`;
      extraZh = `${city.name.zh}增兵 ${add} 卒（耗金 ${goldCost}）。`;
    } else {
      officers[o.id] = { ...o, loyalty: Math.min(100, o.loyalty + bonus) };
    }
  } else if (wish.kind === 'promote') {
    // BUG FIX: actually promote to the highest eligible military rank.
    const currentTier = MILITARY_RANKS_BY_ID[o.rank]?.tier ?? 0;
    const best = Math.max(o.stats.war, o.stats.leadership);
    const nextRank = [...MILITARY_RANKS]
      .sort((a, b) => b.tier - a.tier)
      .find((r) => r.tier > currentTier && best >= r.minStat);
    if (nextRank) {
      officers[o.id] = {
        ...o,
        rank: nextRank.id,
        loyalty: Math.min(100, o.loyalty + bonus + nextRank.loyaltyBonus),
      };
      extraEn = ` Promoted to ${nextRank.name.en}.`;
      extraZh = `晉升為${nextRank.name.zh}。`;
    } else {
      // Already at max eligible — grant loyalty only.
      officers[o.id] = { ...o, loyalty: Math.min(100, o.loyalty + bonus) };
      extraEn = ` (No higher rank earned — loyalty only.)`;
      extraZh = `（已達其能升之最高軍銜，僅 +忠誠。）`;
    }
  } else if (wish.kind === 'item') {
    // BUG FIX: actually grant an item from the unequipped pool or lost pool.
    let granted: EntityId | null = null;
    let fromLost: EntityId | undefined;
    if (ctx.unequippedItemIds && ctx.unequippedItemIds.length > 0) {
      granted = ctx.unequippedItemIds[0];
    } else if (ctx.lostItems && ctx.lostItems.length > 0) {
      granted = ctx.lostItems[0].itemId;
      fromLost = ctx.lostItems[0].cityId;
    }
    if (granted) {
      const have = o.equipment ?? [];
      officers[o.id] = {
        ...o,
        equipment: [...have, granted],
        loyalty: Math.min(100, o.loyalty + bonus),
      };
      extraEn = ` Item #${granted} bestowed from the armoury.`;
      extraZh = `自府庫賜「${granted}」。`;
      return {
        officers, cities,
        entry: {
          cityId: o.locationCityId,
          kind: 'note',
          text: `Granted ${o.name.en}'s wish (+${bonus} loyalty).${extraEn}`,
          textZh: `達成${o.name.zh}之心願（忠誠 +${bonus}）。${extraZh}`,
        },
        consumedItemId: granted,
        consumedFromLost: fromLost,
      };
    }
    // No items available — loyalty only, mark in text.
    officers[o.id] = { ...o, loyalty: Math.min(100, o.loyalty + bonus) };
    extraEn = ' (Armoury empty — token granted in name only.)';
    extraZh = '（府庫無實物，徒以言謝。）';
  } else if (wish.kind === 'dismiss-rival' && wish.targetId) {
    // Drop the rival's loyalty by 5 (they feel slighted), satisfy petitioner.
    const rival = officers[wish.targetId];
    if (rival) {
      officers[rival.id] = { ...rival, loyalty: Math.max(0, rival.loyalty - 5) };
      extraEn = ` ${rival.name.en} is publicly chastised.`;
      extraZh = `${rival.name.zh}受朝堂責問。`;
    }
    officers[o.id] = { ...o, loyalty: Math.min(100, o.loyalty + bonus) };
  } else if (wish.kind === 'retire') {
    // Officer leaves service permanently — status:'retired' keeps them
    // visible in 列傳 with a "歸隱" tag.
    const formerForce = o.forceId;
    officers[o.id] = {
      ...o,
      forceId: null,
      status: 'retired',
      locationCityId: o.hometownCityId ?? o.locationCityId,
      task: null,
      loyalty: Math.min(100, o.loyalty + bonus),
    };
    // 禮遇耆老 — honourably retiring an elder heartens the whole court: every
    // serving colleague is steadied by the gesture (+2 loyalty).
    let cascade = 0;
    if (formerForce) {
      for (const other of Object.values(officers)) {
        if (other.id === o.id || other.forceId !== formerForce) continue;
        if (other.status === 'dead' || other.status === 'unsearched') continue;
        officers[other.id] = { ...other, loyalty: Math.min(100, other.loyalty + 2) };
        cascade++;
      }
    }
    extraEn = ` Retired with full honors${cascade ? ` — the court is heartened (${cascade}× +2 loyalty)` : ''}.`;
    extraZh = `准其辭官歸里${cascade ? `,禮遇耆老,百僚感懷(${cascade} 人忠誠 +2)` : ''}。`;
  } else if (wish.kind === 'peerage' && wish.targetId) {
    // 求爵 — enfeoff to the requested tier (generated as exactly one step up).
    const peer = PEERAGES_BY_ID[wish.targetId as import('../types/title').PeerageId];
    if (peer) {
      officers[o.id] = { ...o, peerageId: peer.id, loyalty: Math.min(100, o.loyalty + bonus) };
      extraEn = ` Enfeoffed as ${peer.name.en}.`;
      extraZh = `封為${peer.name.zh}。`;
    } else {
      officers[o.id] = { ...o, loyalty: Math.min(100, o.loyalty + bonus) };
    }
  } else if (wish.kind === 'mentor' && wish.targetId) {
    // 求師 — apprentice the petitioner to the named colleague (師承).
    const mentor = officers[wish.targetId];
    if (mentor && mentor.status !== 'dead') {
      officers[o.id] = { ...o, mentorId: mentor.id, loyalty: Math.min(100, o.loyalty + bonus) };
      extraEn = ` Now studies under ${mentor.name.en}.`;
      extraZh = `拜${mentor.name.zh}為師。`;
    } else {
      officers[o.id] = { ...o, loyalty: Math.min(100, o.loyalty + bonus) };
    }
  } else if (wish.kind === 'gift') {
    // 求賜 — a reward of honour: loyalty + a renown bump (賞賜揚名).
    officers[o.id] = { ...o, renown: (o.renown ?? 0) + 20, loyalty: Math.min(100, o.loyalty + bonus) };
    extraEn = ' Rewarded with honours (renown +20).';
    extraZh = '厚加賞賜,威望 +20。';
  } else if (wish.kind === 'info') {
    // Acknowledging an info letter gives a small loyalty bump, no other effect.
    officers[o.id] = { ...o, loyalty: Math.min(100, o.loyalty + bonus) };
  } else if (wish.kind === 'learn-policy' && wish.targetId) {
    // BUG FIX: actually add the policy to the officer's list.
    const have = o.policies ?? [];
    if (have.includes(wish.targetId as import('../data/officerAttributes').PolicyId)) {
      officers[o.id] = { ...o, loyalty: Math.min(100, o.loyalty + bonus) };
    } else {
      officers[o.id] = {
        ...o,
        policies: [...have, wish.targetId as import('../data/officerAttributes').PolicyId],
        loyalty: Math.min(100, o.loyalty + bonus),
      };
      const polDef = POLICY_DEFS[wish.targetId as import('../data/officerAttributes').PolicyId];
      extraEn = ` Learned ${polDef?.en ?? wish.targetId}.`;
      extraZh = `習得「${polDef?.zh ?? wish.targetId}」。`;
    }
  } else {
    officers[o.id] = {
      ...o,
      loyalty: Math.min(100, o.loyalty + bonus),
    };
  }
  return {
    officers, cities,
    entry: {
      cityId: o.locationCityId,
      kind: 'note',
      text: `Granted ${o.name.en}'s wish (+${bonus} loyalty).${extraEn}`,
      textZh: `達成${o.name.zh}之心願（忠誠 +${bonus}）。${extraZh}`,
    },
  };
}

export function applyWishReject(
  wish: OfficerWish,
  ctx: ApplyWishContext,
): ApplyWishOutput {
  const officers = { ...ctx.officers };
  const cities = { ...ctx.cities };
  const o = officers[wish.officerId];
  if (!o) {
    return {
      officers, cities,
      entry: { cityId: null, kind: 'note', text: 'Wish target gone.', textZh: '心願對象已不在。' },
    };
  }
  // Grievance escalates the rejection penalty. Each prior rejection adds
  // a multiplier so the 4th rejection costs roughly 2.4× the first.
  const grievance = o.grievanceCount ?? 0;
  const escalation = 1 + grievance * 0.45;
  const penalty = Math.ceil(wish.rejectPenalty * escalation);
  officers[o.id] = {
    ...o,
    loyalty: Math.max(0, o.loyalty - penalty),
    grievanceCount: grievance + 1,
  };
  const grievanceNote = grievance >= 2
    ? ` ${o.name.en} is visibly frustrated (grievance ${grievance + 1}).`
    : '';
  const grievanceNoteZh = grievance >= 2
    ? `${o.name.zh}已多次被拒，怨望日深（怨次 ${grievance + 1}）。`
    : '';
  return {
    officers, cities,
    entry: {
      cityId: o.locationCityId,
      kind: 'note',
      text: `Rejected ${o.name.en}'s wish (−${penalty} loyalty).${grievanceNote}`,
      textZh: `回絕${o.name.zh}之心願（忠誠 −${penalty}）。${grievanceNoteZh}`,
    },
  };
}
