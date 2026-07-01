import type {
  City,
  EntityId,
  EspionageOp,
  EspionageResult,
  Officer,
  ReportEntry,
} from '../types';
import { ESPIONAGE_DEFS_BY_KIND } from '../data/espionage';
import { espionageBonus, counterEspionageResist } from './traitEffects';
import { hasBloodKinInForce, runtimeSwornPair, swornDepth } from './relationshipEffects';
import { getLordRapport, isConfidant } from './rapport';
import { addFriction } from './friction';
import { getRapport } from './rapport';
import { pairKey } from '../types/diplomacy';
import { buildingBonuses } from './buildings';
import type { Building } from '../types';
import type { FamilyRelation } from '../types/family';

export interface EspionageContext {
  ops: EspionageOp[];
  cities: Record<EntityId, City>;
  officers: Record<EntityId, Officer>;
  playerForceId: EntityId | null;
  rng: () => number;
  /** City buildings — 諜報司/寺院/甕城/譙樓 blunt schemes against the city. */
  buildings?: Building[];
  /** Family relations — for the 仁孝 kin-anchored defection immunity. */
  family?: FamilyRelation[];
  /** 君臣好感 — per-officer regard for their lord; a 心腹 (≥80) can't be turned,
   *  and warmth blunts 策反. Also read/written by the 離間計 (sow-discord) op. */
  lordRapport?: Record<EntityId, number>;
  /** Pairwise officer rapport (好感) — the 離間計 op lowers it / breaks weak bonds. */
  rapport?: Record<string, number>;
  /** Runtime bonds — 離間計 may sever a shallow 義結; deep bonds resist. */
  runtimeBonds?: import('../data/bonds').OathBond[];
  /** Diplomatic state — 諜報 (gather-intel) reads it to report the target's
   *  treaties and intentions (§7.3 ① actionable intel). */
  diplomacy?: import('../types/diplomacy').DiplomaticState;
  /** Forces — for naming a target's treaty partners in the intel report. */
  forces?: Record<EntityId, import('../types').Force>;
  /** §7.3 U 細作網絡 — the player's standing spy network into each rival realm
   *  (forceId → 0–100). A deep network sharpens every op against that realm. */
  spyNetwork?: Record<EntityId, number>;
}

export interface EspionageOutput {
  cities: Record<EntityId, City>;
  officers: Record<EntityId, Officer>;
  results: EspionageResult[];
  entries: ReportEntry[];
  /** 敗露之怨 — forceId → added resentment toward the player when a scheme
   *  (e.g. a botched assassination) is traced back. Merged into state.grudges. */
  grudgeDelta: Record<EntityId, number>;
  /** Officer rapport after any 離間計 (sow-discord) ops. Undefined = unchanged. */
  rapport?: Record<string, number>;
  /** Runtime bonds after any 離間計 that severed a shallow 義結. Undefined = unchanged. */
  runtimeBonds?: import('../data/bonds').OathBond[];
}

/**
 * Resolves all pending espionage ops at season-end. Each op's success
 * chance is its baseSuccess scaled by:
 *   agent INT / 100
 *   (1 + (agent INT − target avg INT) × 0.5%)
 *   defection only: (100 − target loyalty) / 50  (heavy)
 */
export function resolveEspionage(ctx: EspionageContext): EspionageOutput {
  const cities = { ...ctx.cities };
  const officers = { ...ctx.officers };
  const results: EspionageResult[] = [];
  const entries: ReportEntry[] = [];
  const grudgeDelta: Record<EntityId, number> = {};
  // 離間計 mutates the social fabric; track copies and whether they changed.
  let rapport = { ...(ctx.rapport ?? {}) };
  let runtimeBonds = ctx.runtimeBonds ? [...ctx.runtimeBonds] : [];
  let socialChanged = false;

  // 校事 (§7.3 ②) — the realm's sharpest covert mind oversees every operation,
  // lending a realm-wide edge to all the player's ops. Picks the player officer
  // with the highest (intelligence + espionage knack).
  const spymasterBonus = (() => {
    const own = Object.values(officers).filter((o) => o.forceId === ctx.playerForceId && o.status !== 'dead');
    if (own.length === 0) return 0;
    const best = own.reduce((a, b) => (b.stats.intelligence + espionageBonus(b) * 100) > (a.stats.intelligence + espionageBonus(a) * 100) ? b : a);
    return Math.min(0.15, Math.max(0, (best.stats.intelligence - 70) / 300) + espionageBonus(best) * 0.5);
  })();

  for (const op of ctx.ops) {
    const def = ESPIONAGE_DEFS_BY_KIND[op.kind];
    const agent = officers[op.agentOfficerId];
    if (!def || !agent) continue;

    // Compute success.
    const targetForceOfficers = Object.values(officers).filter(
      (o) => o.forceId === op.targetForceId && o.status !== 'dead',
    );
    const targetAvgInt =
      targetForceOfficers.length > 0
        ? targetForceOfficers.reduce((s, o) => s + o.stats.intelligence, 0) /
          targetForceOfficers.length
        : 60;

    let chance = def.baseSuccess * (agent.stats.intelligence / 100);
    chance += (agent.stats.intelligence - targetAvgInt) * 0.005;
    // T7 — agent traits: cunning/stealthy/strategist boost; target-side
    // counter-intel traits reduce success (averaged across target officers).
    chance += espionageBonus(agent);
    chance += spymasterBonus; // 校事 — the realm's spymaster sharpens every op.
    // §7.3 U 細作網絡 — a deep-rooted network into the target realm sharpens every op.
    chance += (ctx.spyNetwork?.[op.targetForceId] ?? 0) / 400; // network 100 → +0.25
    // §7.3 W 死士 — an agent who has made his peace with death gets far closer.
    if (op.deathAgent) chance += 0.25;
    const counterResist =
      targetForceOfficers.length > 0
        ? targetForceOfficers.reduce((s, o) => s + counterEspionageResist(o), 0) /
          targetForceOfficers.length
        : 0;
    chance -= counterResist;

    // 諜報司 — a target city's intelligence bureau blunts schemes against it;
    // 寺院/甕城/譙樓 specifically resist instigation (民心煽動).
    if (op.targetCityId) {
      const cityBB = buildingBonuses(op.targetCityId, ctx.buildings ?? []);
      chance -= cityBB.schemeResist;
      if (op.kind === 'instigate') chance -= cityBB.instigateResistance * 0.3;
    }
    // 斥候營 — a scout camp at the agent's home base sharpens the operation.
    if (agent.locationCityId) {
      chance += buildingBonuses(agent.locationCityId, ctx.buildings ?? []).espionagePower;
    }

    // True immunity (仁孝 / 心腹) — bypasses the 2% floor below.
    let hardBlock = false;
    if (op.kind === 'defect' && op.targetOfficerId) {
      const t = officers[op.targetOfficerId];
      if (t) {
        // 仁孝 — won't abandon a force where blood kin still serve.
        // 心腹 — a confidant (君臣好感 ≥80) will not betray their lord at any price.
        if (hasBloodKinInForce(t, officers, ctx.family ?? []) || isConfidant(ctx.lordRapport ?? {}, t.id)) {
          chance = 0;
          hardBlock = true;
        } else {
          chance += ((100 - t.loyalty) / 50) - 0.2;
          // 好色 — a lustful target is far easier to lure (美人計).
          if ((t.traits as string[] | undefined ?? []).includes('lustful')) chance += 0.15;
          // T7 — loyal/honor-bound officers resist defection HARD
          chance -= counterEspionageResist(t) * 3;
          // 君臣好感 — an officer who esteems their lord is harder to turn.
          chance -= Math.max(0, getLordRapport(ctx.lordRapport ?? {}, t.id)) / 120;
        }
      }
    }

    // 美人計 — a honey-trap. Lust is its great lever; a confidant/kin-anchored
    // officer (心腹/仁孝) still resists absolutely.
    if (op.kind === 'seduce' && op.targetOfficerId) {
      const t = officers[op.targetOfficerId];
      if (t) {
        if (hasBloodKinInForce(t, officers, ctx.family ?? []) || isConfidant(ctx.lordRapport ?? {}, t.id)) {
          chance = 0; hardBlock = true;
        } else {
          chance += (100 - t.loyalty) / 80;
          chance += (t.traits as string[] | undefined ?? []).includes('lustful') ? 0.45 : -0.15;
          chance -= Math.max(0, getLordRapport(ctx.lordRapport ?? {}, t.id)) / 150;
        }
      }
    }

    // 離間計 — a deep 義結 (or even high warmth) resists estrangement.
    if (op.kind === 'sow-discord' && op.targetOfficerId && op.targetOfficerId2) {
      const depth = swornDepth(op.targetOfficerId, op.targetOfficerId2, runtimeBonds);
      if (depth >= 2) chance *= 0.3;                 // 金蘭/生死之交 nearly unbreakable
      else if (runtimeSwornPair(op.targetOfficerId, op.targetOfficerId2, runtimeBonds)) chance *= 0.6;
      const warmth = getRapport(rapport, op.targetOfficerId, op.targetOfficerId2);
      if (warmth > 0) chance -= warmth / 250;        // genuine friendship is hard to poison
    }

    // 護衛 (§7.3 ③) — a lord is heavily guarded, and a great captain keeps a
    // bodyguard: both are far harder to reach with a blade.
    if (op.kind === 'assassinate' && op.targetOfficerId) {
      const t = officers[op.targetOfficerId];
      if (t && ctx.forces?.[op.targetForceId]?.rulerOfficerId === t.id) chance -= 0.18;
      if (t && (t.stats.leadership + t.stats.war) > 160) chance -= 0.08;
    }

    chance = hardBlock ? 0 : Math.max(0.02, Math.min(0.95, chance));
    const roll = ctx.rng();
    const success = roll < chance;

    let message = '';
    let messageZh = '';

    if (op.kind === 'gather-intel') {
      if (success) {
        const targetCities = Object.values(cities)
          .filter((c) => c.ownerForceId === op.targetForceId)
          .slice(0, 4);
        const cityList = targetCities
          .map((c) => `${c.name.en} (T:${c.troops.toLocaleString()}, G:${c.gold}, F:${c.food})`)
          .join('; ');
        const cityListZh = targetCities
          .map((c) => `${c.name.zh}（兵${c.troops.toLocaleString()}、金${c.gold}、糧${c.food}）`)
          .join('、');
        // §7.3 ① 實用情報 — beyond raw numbers, read the foe's TREATIES and INTENT.
        const intel: string[] = [];
        const intelZh: string[] = [];
        if (ctx.diplomacy) {
          // Treaties — the target's standing alliances / NAPs (lift the diplo fog).
          const partners: string[] = [];
          const partnersZh: string[] = [];
          for (const rel of Object.values(ctx.diplomacy.relations)) {
            if (rel.status === 'neutral') continue;
            const other = rel.forceA === op.targetForceId ? rel.forceB : rel.forceB === op.targetForceId ? rel.forceA : null;
            if (!other) continue;
            const tag = rel.status === 'allied' ? (lang: 'en' | 'zh') => (lang === 'en' ? 'ally' : '盟') : (lang: 'en' | 'zh') => (lang === 'en' ? 'NAP' : '不戰');
            partners.push(`${ctx.forces?.[other]?.name.en ?? other} (${tag('en')})`);
            partnersZh.push(`${ctx.forces?.[other]?.name.zh ?? other}(${tag('zh')})`);
          }
          if (partners.length > 0) { intel.push(`treaties: ${partners.join(', ')}`); intelZh.push(`盟約:${partnersZh.join('、')}`); }
          // Intent — which of OUR cities its border host most threatens.
          if (ctx.playerForceId) {
            let worst: { city: City; pressure: number } | null = null;
            for (const c of Object.values(cities)) {
              if (c.ownerForceId !== ctx.playerForceId) continue;
              let pressure = 0;
              for (const adjId of c.adjacentCityIds ?? []) {
                const adj = cities[adjId];
                if (adj?.ownerForceId === op.targetForceId) pressure += adj.troops;
              }
              const eff = pressure / Math.max(1, c.troops * (1 + (c.defense ?? 0) / 200));
              if (pressure > 0 && (!worst || eff > worst.pressure)) worst = { city: c, pressure: eff };
            }
            if (worst) { intel.push(`eyeing ${worst.city.name.en}`); intelZh.push(`兵鋒似指${worst.city.name.zh}`); }
          }
        }
        const intelStr = intel.length ? ` — ${intel.join('; ')}` : '';
        const intelStrZh = intelZh.length ? ` —— ${intelZh.join(';')}` : '';
        message = `${agent.name.en}'s spies report: ${cityList || '(no cities)'}${intelStr}.`;
        messageZh = `${agent.name.zh}細作來報：${cityListZh || '（無城）'}${intelStrZh}。`;
      } else {
        message = `${agent.name.en}'s spy ring was uncovered. The agent escaped with nothing.`;
        messageZh = `${agent.name.zh}細作為敵所察，無功而還。`;
      }
    } else if (op.kind === 'instigate' && op.targetCityId) {
      const c = cities[op.targetCityId];
      if (!c) {
        message = `Target city no longer exists.`;
        messageZh = `目標城池已不復存在。`;
      } else if (success) {
        const drop = 15 + Math.floor(ctx.rng() * 16);
        cities[op.targetCityId] = {
          ...c,
          loyalty: Math.max(0, c.loyalty - drop),
        };
        message = `Agitators in ${c.name.en} caused loyalty to drop by ${drop}.`;
        messageZh = `細作於${c.name.zh}煽動民心，民忠減 ${drop}。`;
      } else {
        message = `Plot in ${c.name.en} was exposed. The agitators were executed.`;
        messageZh = `${c.name.zh}之謀洩露，細作伏誅。`;
      }
    } else if (op.kind === 'sabotage' && op.targetCityId) {
      const c = cities[op.targetCityId];
      if (!c) {
        message = `Target city no longer exists.`;
        messageZh = `目標城池已不復存在。`;
      } else if (success) {
        const lost = Math.floor(c.food * (0.3 + ctx.rng() * 0.2));
        cities[op.targetCityId] = { ...c, food: Math.max(0, c.food - lost) };
        message = `Granaries at ${c.name.en} put to the torch: ${lost.toLocaleString()} food destroyed.`;
        messageZh = `${c.name.zh}糧倉遭焚，毀糧 ${lost.toLocaleString()} 石。`;
      } else {
        message = `Saboteurs at ${c.name.en} were caught and hanged.`;
        messageZh = `${c.name.zh}縱火細作為人所擒，盡皆處斬。`;
      }
    } else if (op.kind === 'assassinate' && op.targetOfficerId) {
      const t = officers[op.targetOfficerId];
      if (!t || t.status === 'dead') {
        message = `Target unavailable.`;
        messageZh = `目標已不可及。`;
      } else if (success) {
        const isRuler = ctx.forces?.[op.targetForceId]?.rulerOfficerId === t.id;
        officers[op.targetOfficerId] = {
          ...t,
          status: 'dead',
          forceId: null,
          task: null,
        };
        // 弒君之亂 (§7.3 ③) — striking down a lord throws the whole realm into shock.
        if (isRuler && op.targetForceId) {
          for (const c of Object.values(cities)) {
            if (c.ownerForceId === op.targetForceId) cities[c.id] = { ...c, loyalty: Math.max(0, c.loyalty - 10) };
          }
        }
        message = isRuler
          ? `${t.name.en}, lord of their realm, is struck down — the realm reels in turmoil.`
          : `${t.name.en} was struck down by an unknown assassin.`;
        messageZh = isRuler
          ? `${t.name.zh}身為一國之主,竟為刺客所弒,舉國震動。`
          : `${t.name.zh}為不知名刺客所殺。`;
      } else {
        const isRuler = ctx.forces?.[op.targetForceId]?.rulerOfficerId === t.id;
        // §7.3 W 死士 — a caught 死士 dies with his secret; no trail leads home.
        message = op.deathAgent
          ? `The assassin failed and was cut down — but died without a word; no trail leads home.`
          : `The assassin failed. ${t.name.en} survives — and the plot is traced back.`;
        messageZh = op.deathAgent
          ? `死士行刺不成,力戰而歿 —— 然守口如瓶,主使無從追索。`
          : `刺客失手，${t.name.zh}得以倖免，且行刺敗露為人所察。`;
        // 行刺敗露 — a botched hit is traced to its sponsor (grudge). An attempt on a
        // LORD's very life is an outrage — far deeper resentment. A 死士 gives nothing up.
        if (op.targetForceId && !op.deathAgent) {
          grudgeDelta[op.targetForceId] = (grudgeDelta[op.targetForceId] ?? 0) + (isRuler ? 26 : 14);
        }
      }
    } else if (op.kind === 'defect' && op.targetOfficerId) {
      const t = officers[op.targetOfficerId];
      if (!t || t.status === 'dead') {
        message = `Target unavailable.`;
        messageZh = `目標已不可及。`;
      } else if (success && ctx.playerForceId) {
        officers[op.targetOfficerId] = {
          ...t,
          forceId: ctx.playerForceId,
          loyalty: 60,
          status: 'idle',
          task: null,
        };
        message = `${t.name.en} secretly defected and is now in your service!`;
        messageZh = `${t.name.zh}暗中歸順，今為主公效命！`;
      } else {
        // Blowback: officer's loyalty to their lord shoots up.
        if (t) {
          officers[op.targetOfficerId] = {
            ...t,
            loyalty: Math.min(100, t.loyalty + 10),
          };
        }
        message = `${t?.name.en ?? 'Target'} reported the bribe. Their loyalty has increased.`;
        messageZh = `${t?.name.zh ?? '目標'}將賄事告於其主，忠誠反升。`;
      }
    } else if (op.kind === 'frame' && op.targetOfficerId) {
      const t = officers[op.targetOfficerId];
      if (!t || t.status === 'dead') {
        message = `Target unavailable.`;
        messageZh = `目標已不可及。`;
      } else if (success) {
        const drop = 15 + Math.floor(ctx.rng() * 11);
        officers[op.targetOfficerId] = {
          ...t,
          loyalty: Math.max(0, t.loyalty - drop),
        };
        message = `Slander against ${t.name.en} took root: loyalty −${drop}.`;
        messageZh = `離間之計奏效，${t.name.zh}忠誠 −${drop}。`;
      } else {
        message = `The slander against ${t.name.en} was disbelieved.`;
        messageZh = `離間${t.name.zh}之謀未為其主所信。`;
      }
    } else if (op.kind === 'sow-discord' && op.targetOfficerId && op.targetOfficerId2) {
      const t1 = officers[op.targetOfficerId], t2 = officers[op.targetOfficerId2];
      if (!t1 || !t2 || t1.status === 'dead' || t2.status === 'dead') {
        message = `Targets unavailable.`;
        messageZh = `目標已不可及。`;
      } else if (success) {
        // Poison their rapport; a shallow (depth-1) 義結 may shatter outright.
        const drop = 20 + Math.floor(ctx.rng() * 21); // 20–40
        const beforeBonded = runtimeSwornPair(t1.id, t2.id, runtimeBonds);
        const shallow = beforeBonded && swornDepth(t1.id, t2.id, runtimeBonds) <= 1;
        if (shallow) {
          runtimeBonds = runtimeBonds.filter((bd) =>
            !((bd.kind === 'sibling' || bd.kind === 'oath') &&
              ((bd.officerA === t1.id && bd.officerB === t2.id) || (bd.officerA === t2.id && bd.officerB === t1.id))));
          // A broken bond starts the pair from neutral before souring.
          rapport = { ...rapport, [pairKey(t1.id, t2.id)]: 0 };
        }
        const alreadyFeud = runtimeBonds.some((bd) =>
          bd.kind === 'feud' &&
          ((bd.officerA === t1.id && bd.officerB === t2.id) || (bd.officerA === t2.id && bd.officerB === t1.id)));
        const fr = addFriction(rapport, t1.id, t2.id, drop, alreadyFeud);
        rapport = fr.rapport;
        if (fr.forged) runtimeBonds = [...runtimeBonds, fr.forged];
        socialChanged = true;
        message = shallow
          ? `Whispers shattered the bond between ${t1.name.en} and ${t2.name.en} — now bitter rivals.`
          : `${t1.name.en} and ${t2.name.en} turn cold toward one another (好感 −${drop}).`;
        messageZh = shallow
          ? `讒言離間，${t1.name.zh}與${t2.name.zh}義斷恩絕，反目成仇。`
          : `${t1.name.zh}與${t2.name.zh}漸生嫌隙(好感 −${drop})。`;
      } else {
        message = `The attempt to estrange ${t1.name.en} and ${t2.name.en} came to nothing.`;
        messageZh = `離間${t1.name.zh}與${t2.name.zh}之計未成。`;
      }
    } else if (op.kind === 'steal-gold' && op.targetCityId) {
      const c = cities[op.targetCityId];
      if (!c) {
        message = `Target city no longer exists.`; messageZh = `目標城池已不復存在。`;
      } else if (success) {
        const taken = Math.floor(c.gold * (0.25 + ctx.rng() * 0.15));
        cities[op.targetCityId] = { ...c, gold: Math.max(0, c.gold - taken) };
        // The loot lands in the agent's home city, if it's still yours.
        const home = agent.locationCityId ? cities[agent.locationCityId] : null;
        if (home && home.ownerForceId === ctx.playerForceId) {
          cities[home.id] = { ...home, gold: home.gold + taken };
        }
        message = `Thieves spirit ${taken.toLocaleString()} gold out of ${c.name.en}'s treasury.`;
        messageZh = `細作盜${c.name.zh}府庫之金 ${taken.toLocaleString()},輸歸我帑。`;
      } else {
        message = `The theft at ${c.name.en} was foiled.`; messageZh = `${c.name.zh}盜金之謀為人所敗。`;
      }
    } else if (op.kind === 'seduce' && op.targetOfficerId) {
      const t = officers[op.targetOfficerId];
      if (!t || t.status === 'dead') {
        message = `Target unavailable.`; messageZh = `目標已不可及。`;
      } else if (success && ctx.playerForceId) {
        officers[op.targetOfficerId] = { ...t, forceId: ctx.playerForceId, loyalty: 55, status: 'idle', task: null };
        message = `${t.name.en}, ensnared by a honey-trap, defects to your service!`;
        messageZh = `${t.name.zh}中美人之計,傾心來歸!`;
      } else {
        if (t) officers[op.targetOfficerId] = { ...t, loyalty: Math.min(100, t.loyalty + 6) };
        message = `${t?.name.en ?? 'The mark'} resisted the honey-trap.`;
        messageZh = `${t?.name.zh ?? '目標'}不為美人計所動。`;
      }
    } else if (op.kind === 'false-intel' && op.targetOfficerId) {
      const t = officers[op.targetOfficerId];
      if (!t || t.status === 'dead') {
        message = `Target unavailable.`; messageZh = `目標已不可及。`;
      } else if (success) {
        const drop = 25 + Math.floor(ctx.rng() * 11); // 25–35
        // 蔣幹盜書 — a suspicious lord may jail (or worse) his own slandered general.
        const jailed = ctx.rng() < 0.4;
        officers[op.targetOfficerId] = jailed
          ? { ...t, status: 'imprisoned', task: null, loyalty: Math.max(0, t.loyalty - drop), capturedFromForceId: t.forceId ?? undefined }
          : { ...t, loyalty: Math.max(0, t.loyalty - drop) };
        message = jailed
          ? `Forged letters convince ${t.name.en}'s lord of treason — the general is thrown in irons!`
          : `Forged proof of treason ruins ${t.name.en} — loyalty −${drop}.`;
        messageZh = jailed
          ? `偽書既成,其主信以為真,${t.name.zh}竟為己主所囚!`
          : `偽書反間,陷${t.name.zh}通敵之名,忠誠 −${drop}。`;
      } else {
        message = `The forged letter against ${t.name.en} was seen for what it was.`;
        messageZh = `偽書反間${t.name.zh}之計為其主識破。`;
      }
    } else if (op.kind === 'spread-rumor' && op.targetCityId) {
      const c = cities[op.targetCityId];
      if (!c) { message = `Target unavailable.`; messageZh = `目標已不可及。`; }
      else if (success) {
        const drop = 10 + Math.floor(ctx.rng() * 9); // 10–18
        cities[op.targetCityId] = { ...c, loyalty: Math.max(0, c.loyalty - drop) };
        message = `Rumours take root in ${c.name.en} — 民心 −${drop}, and the whispers begin to spread.`;
        messageZh = `流言惑${c.name.zh}之眾,民心 −${drop},且謠言將蔓延鄰城。`;
        // The spread itself is seeded by the store from this successful result.
      } else {
        message = `The rumour-mongers were caught before the whispers could take.`;
        messageZh = `散布流言者為敵察覺,謠言未及生根。`;
      }
    }

    // §7.3 W 死士 — spent on the deed, the agent does not come home (win or lose).
    if (op.deathAgent && officers[op.agentOfficerId] && officers[op.agentOfficerId].status !== 'dead') {
      officers[op.agentOfficerId] = { ...officers[op.agentOfficerId], status: 'dead', forceId: null, task: null };
      messageZh += '(死士殞身)';
      message += ' (the death-agent is spent)';
    }

    results.push({ op, success, message });
    entries.push({
      cityId: op.targetCityId ?? agent.locationCityId ?? null,
      kind: 'espionage',
      text: `[${def.name.en}] ${message}`,
      textZh: `【${def.name.zh}】${messageZh}`,
    });
  }

  return {
    cities, officers, results, entries, grudgeDelta,
    ...(socialChanged ? { rapport, runtimeBonds } : {}),
  };
}
