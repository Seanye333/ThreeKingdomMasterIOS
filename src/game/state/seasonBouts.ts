import type { GameStore } from './store';
import type { GameState } from './gameState';
import type { Officer } from '../types';
import { resolveDuel, canDuel, staticProwess } from '../systems/duel';
import { resolveWordWar } from '../systems/wordWar';
import { pickArenaChampion, pickArenaChallenger } from '../systems/arenaLadder';
import { pickMoonLaurel, pickMoonChallenger, moonScore, dualLuminaries, annualHonors, honorRenown } from '../systems/scholarRank';
import { realmEthos, ethosSchoolBonus, ethosLoyaltyAura } from '../systems/realmEthos';
import { DUAL_LUMINARY_LOYALTY } from '../systems/scholarRank';
import { recordTeaching } from '../systems/lineage';
import { martialTier } from '../systems/martialArts';
import { debateArtsTier } from '../systems/debateArts';
import { tickAIPersuasions, tickMoonWrit } from '../systems/aiParley';
import { addSeasons as addDiploSeasons, isOnOrAfter } from '../systems/diplomacy';

/**
 * 隨季之事 (§6.10–§6.18) — the season-driven half of the duel/debate deepening:
 * the standing seats that change hands on their own (擂台/月旦評), the bouts the
 * world fights without you (世間鬥將/世間論辯), the AI's own cultivation
 * (AI 傳習) and diplomacy-by-tongue (說降來使/月旦來辯), and the slow accruals
 * that give a realm its character (學宮養士/出將入相/崇文安民/歲末雙榜).
 *
 * Lifted out of `store.endSeason`, which had grown past 5,000 lines. Every block
 * here reads and writes ONLY through the store's own `get`/`set`, so behaviour is
 * identical to when it lived inline — but the cadence rules are now readable in
 * one place. **All of it is per-SEASON**: the caller passes `seasonBoundary`, and
 * each block gates on it. (Getting that gate wrong is exactly the bug this batch
 * of code shipped once; see seasonCadence.integration.test.ts.)
 */
export function tickBoutSeason(
  get: () => GameStore,
  set: (patch: Partial<GameState>) => void,
  seasonBoundary: boolean,
  state: GameState,
): void {
  // 打擂隨季 (§6.12) — the arena seat lives its own life: while an AI (or no
  // one from your force) holds it, the realm's fighters keep contesting it
  // between seasons; the player-held seat is only ever risked by choice
  // (holdArena). A change of hands is chronicle material.
  if (seasonBoundary) {
    const cur = get();
    const seat = cur.arenaChampion;
    const holder = seat ? cur.officers[seat.officerId] : null;
    const holderIsPlayers = !!holder && holder.forceId === cur.playerForceId;
    if (seat && holder && holder.status !== 'dead' && holder.status !== 'imprisoned' && !holderIsPlayers && Math.random() < 0.45) {
      const contender = pickArenaChallenger(cur.officers, holder.id, Math.random);
      if (contender) {
        const bout = resolveDuel({ attacker: contender, defender: holder });
        if (bout.winner === 'attacker') {
          set({ arenaChampion: { officerId: contender.id, sinceYear: cur.date.year, defenses: 0 } });
          get().recordAnnal({
            year: cur.date.year, season: cur.date.season, kind: 'event',
            titleZh: '擂主易位',
            textZh: `${contender.name.zh} 登台力克 ${holder.name.zh} — 天下擂主易位!`,
            cityId: null,
          });
        } else {
          set({ arenaChampion: { ...seat, defenses: seat.defenses + 1 } });
        }
      }
    } else if (seat && (!holder || holder.status === 'dead' || holder.status === 'imprisoned')) {
      // 擂主凋零 — a dead/captive champion's seat falls to the strongest arm.
      const heir = pickArenaChampion(cur.officers);
      set({ arenaChampion: heir ? { officerId: heir.id, sinceYear: cur.date.year, defenses: 0 } : undefined });
    }
  }

  // 月旦隨季 (§6.15) — the critique of tongues lives its own life too: while
  // an AI holds the 魁首, the realm's scholars keep contesting it between
  // seasons; a player-held laurel is only ever risked by choice (守評).
  if (seasonBoundary) {
    const cur = get();
    const seat = cur.moonLaurel;
    const holder = seat ? cur.officers[seat.officerId] : null;
    const holderIsPlayers = !!holder && holder.forceId === cur.playerForceId;
    if (seat && holder && holder.status !== 'dead' && holder.status !== 'imprisoned' && !holderIsPlayers && Math.random() < 0.45) {
      const contender = pickMoonChallenger(cur.officers, holder.id, Math.random);
      if (contender) {
        const bout = resolveWordWar(contender, holder, [], []);
        if (bout.winnerSide === 'attacker') {
          set({ moonLaurel: { officerId: contender.id, sinceYear: cur.date.year, defenses: 0 } });
          get().recordAnnal({
            year: cur.date.year, season: cur.date.season, kind: 'event',
            titleZh: '月旦易評',
            textZh: `${contender.name.zh} 清議之上辯倒 ${holder.name.zh} — 月旦評魁首易主!`,
            cityId: null,
          });
          get().stampMoonEpithet(contender.id); // 品題隨榜 — the new 魁首 gets their line
        } else {
          set({ moonLaurel: { ...seat, defenses: seat.defenses + 1 } });
        }
      }
    } else if (seat && (!holder || holder.status === 'dead' || holder.status === 'imprisoned')) {
      // 魁首凋零 — a dead/captive holder's laurel falls to the keenest tongue.
      const heir = pickMoonLaurel(cur.officers);
      set({ moonLaurel: heir ? { officerId: heir.id, sinceYear: cur.date.year, defenses: 0 } : undefined });
    }
  }

  // 世間鬥將 (§6.13) — the 武評榜 lives beyond the player's bouts: between
  // seasons, champions of OTHER realms test each other (較藝,點到為止 —
  // face and rating, not blood). The ladder moves, AI arms deepen their
  // 修為, and a marquee upset is chronicle material.
  if (seasonBoundary) {
    const cur = get();
    if (Math.random() < 0.35) {
      const pool = Object.values(cur.officers).filter((o) =>
        o.forceId && o.forceId !== cur.playerForceId
        && o.status !== 'dead' && o.status !== 'imprisoned' && o.status !== 'unsearched'
        && o.stats.war >= 70 && canDuel(o).ok);
      if (pool.length >= 2) {
        const i = Math.floor(Math.random() * pool.length);
        let j = Math.floor(Math.random() * (pool.length - 1));
        if (j >= i) j++;
        const A = pool[i], B = pool[j];
        if (A.forceId !== B.forceId) { // champions of different realms cross paths
          const res = resolveDuel({ attacker: A, defender: B });
          const outcome = res.winner === 'attacker' ? 'win' : res.winner === 'defender' ? 'loss' : 'draw';
          get().recordDuelRating(A.id, B.id, outcome);
          // 敵亦精進 — both arms learn from a real test (§6.10).
          get().growMartialXiuwei(A.id, outcome === 'win' ? 2 : 1);
          get().growMartialXiuwei(B.id, outcome === 'loss' ? 1 : 2);
          if (outcome !== 'draw') {
            const winner = outcome === 'win' ? A : B;
            const loser = outcome === 'win' ? B : A;
            get().recordDeed(winner.id, { duelsWon: 1 });
            // Only a marquee matchup (two famed arms) makes the chronicle.
            if (staticProwess(winner) >= 85 && staticProwess(loser) >= 85) {
              get().recordAnnal({
                year: cur.date.year, season: cur.date.season, kind: 'event',
                titleZh: '兩雄較藝',
                textZh: `${winner.name.zh} 與 ${loser.name.zh} 陣前較藝,${res.rounds.length} 合而 ${winner.name.zh} 稍勝 — 武評榜為之一動。`,
                cityId: null,
              });
            }
          }
        }
      }
    }
  }

  // AI 傳習 (§6.18) — the realms cultivate their own. Each season one AI
  // master (宗師/名士) drills a junior of the same court, exactly as the
  // player's 傳藝/傳道 does — so lineages, 同門 bonds and deep benches grow
  // across the whole map instead of only in your house.
  if (seasonBoundary && Math.random() < 0.4) {
    const cur = get();
    const teach = (art: 'martial' | 'debate') => {
      const tierOf = (o: Officer) => (art === 'martial' ? martialTier(o).tier : debateArtsTier(o).tier);
      const xwOf = (o: Officer) => (art === 'martial' ? (o.martialXiuwei ?? 0) : (o.debateXiuwei ?? 0));
      const usable = (o: Officer) => o.forceId && o.forceId !== cur.playerForceId
        && o.status !== 'dead' && o.status !== 'imprisoned' && o.status !== 'unsearched' && !!o.locationCityId;
      const masters = Object.values(cur.officers).filter((o) => usable(o) && tierOf(o) >= 4);
      if (!masters.length) return false;
      const master = masters[Math.floor(Math.random() * masters.length)];
      // 同城同袍 — a master drills whoever shares their posting.
      const pupils = Object.values(cur.officers).filter((o) =>
        usable(o) && o.id !== master.id && o.forceId === master.forceId
        && o.locationCityId === master.locationCityId
        && xwOf(o) < xwOf(master) - 10);
      if (!pupils.length) return false;
      const pupil = pupils[Math.floor(Math.random() * pupils.length)];
      const gained = Math.min(8, Math.max(0, xwOf(master) - 5 - xwOf(pupil)));
      if (gained <= 0) return false;
      const next = xwOf(pupil) + gained;
      set({
        officers: { ...get().officers, [pupil.id]: {
          ...get().officers[pupil.id],
          ...(art === 'martial' ? { martialXiuwei: next } : { debateXiuwei: next }),
        } },
        lineage: recordTeaching(get().lineage ?? [], { masterId: master.id, pupilId: pupil.id, art, year: cur.date.year }),
      });
      return true;
    };
    // One teaching a season, martial or literary — whichever the coin falls.
    if (!teach(Math.random() < 0.5 ? 'martial' : 'debate')) teach(Math.random() < 0.5 ? 'debate' : 'martial');
  }

  // 世間論辯 (§6.15) — the 月旦榜 lives beyond the player's bouts too: between
  // seasons, the realms' famous tongues hold 清談 with one another. The
  // board moves on its own, AI scholars deepen their 文辯修為, and a
  // meeting of two great names is chronicle material. Mirrors 世間鬥將.
  if (seasonBoundary) {
    const cur = get();
    if (Math.random() < 0.3) {
      const pool = Object.values(cur.officers).filter((o) =>
        o.forceId && o.forceId !== cur.playerForceId
        && o.status !== 'dead' && o.status !== 'imprisoned' && o.status !== 'unsearched'
        && moonScore(o) >= 70);
      if (pool.length >= 2) {
        const i = Math.floor(Math.random() * pool.length);
        let j = Math.floor(Math.random() * (pool.length - 1));
        if (j >= i) j++;
        const A = pool[i], B = pool[j];
        if (A.forceId !== B.forceId) { // tongues of different courts cross
          const bout = resolveWordWar(A, B, [], []);
          const winner = bout.winnerSide === 'attacker' ? A : bout.winnerSide === 'defender' ? B : null;
          const loser = winner ? (winner.id === A.id ? B : A) : null;
          // 清談亦長學 — both sharpen; the one who carried it more so.
          get().growDebateXiuwei(A.id, winner?.id === A.id ? 2 : 1);
          get().growDebateXiuwei(B.id, winner?.id === B.id ? 2 : 1);
          if (winner && loser) {
            get().recordDeed(winner.id, { debatesWon: 1 });
            // Only a meeting of two renowned names makes the chronicle.
            if (moonScore(winner) >= 85 && moonScore(loser) >= 85) {
              get().recordAnnal({
                year: cur.date.year, season: cur.date.season, kind: 'event',
                titleZh: '兩賢清談',
                textZh: `${winner.name.zh} 與 ${loser.name.zh} 清談竟日,${winner.name.zh} 辭鋒稍勝 — 月旦榜為之一動。`,
                cityId: null,
              });
            }
          }
        }
      }
    }
  }

  // AI 舌戰說降來使 (§6.16 對稱) — an unanswered envoy at your wall argues
  // it out unattended when the writ lapses; then a rival realm may send a
  // fresh tongue to another weakly-held wall.
  if (seasonBoundary) {
    const cur = get();
    const standing = (cur.pendingPersuasions ?? []).filter((p) => {
      const city = cur.cities[p.cityId];
      const envoy = cur.officers[p.envoyId];
      const defender = cur.officers[p.defenderId];
      return city && city.ownerForceId === cur.playerForceId && envoy && envoy.status !== 'dead' && defender && defender.status !== 'dead';
    });
    const lapsed = standing.find((p) => !isOnOrAfter(p.expiresAt, cur.date));
    if (lapsed) {
      // 置之不理 — the wall answers without you; the engine argues it out.
      const envoy = cur.officers[lapsed.envoyId];
      const defender = cur.officers[lapsed.defenderId];
      set({ pendingPersuasions: [lapsed] }); // settle reads the head entry
      const bout = resolveWordWar(envoy, defender, [], []);
      const last = bout.rounds[bout.rounds.length - 1];
      const margin = last ? Math.abs(last.attackerTotal - last.defenderTotal) : 0;
      const outcome = bout.winnerSide === 'attacker' ? 'loss' : bout.winnerSide === 'defender' ? 'win' : 'draw';
      get().settleIncomingPersuasion(outcome, bout.winnerSide === 'attacker' && margin >= 50);
    } else if (standing.length !== (cur.pendingPersuasions ?? []).length) {
      set({ pendingPersuasions: standing });
    }
    const cur2 = get();
    const fresh = tickAIPersuasions({
      forces: cur2.forces, cities: cur2.cities, officers: cur2.officers,
      diplomacy: cur2.diplomacy, playerForceId: cur2.playerForceId,
      existing: cur2.pendingPersuasions ?? [],
      expiresAt: addDiploSeasons(cur2.date, 2),
    });
    if (fresh) {
      set({ pendingPersuasions: [fresh] });
      const from = cur2.forces[fresh.fromForceId];
      const city = cur2.cities[fresh.cityId];
      const envoy = cur2.officers[fresh.envoyId];
      get().notify(
        `說降來使 · ${from?.name.zh ?? ''}遣 ${envoy?.name.zh ?? ''} 至 ${city?.name.zh ?? ''} 城下`,
        `${from?.name.en ?? 'A rival'} sends ${envoy?.name.en ?? 'an envoy'} to argue at ${city?.name.en ?? 'your wall'} — answer in the Diplomacy panel`,
        'warn',
      );
    }
  }

  // 月旦來辯 (§6.15 對稱) — while your champion holds the laurel, rival
  // scholars send writs; an ignored writ lapses into a public duck.
  if (seasonBoundary) {
    const cur = get();
    const writ = cur.pendingMoonWrit;
    const holderId = cur.moonLaurel?.officerId;
    const holderIsMine = !!holderId && cur.officers[holderId]?.forceId === cur.playerForceId;
    if (writ && (!holderIsMine || !cur.officers[writ.challengerId] || cur.officers[writ.challengerId].status === 'dead')) {
      set({ pendingMoonWrit: undefined });
    } else if (writ && !isOnOrAfter(writ.expiresAt, cur.date)) {
      get().duckMoonWrit(); // 置帖不答,即為避辯
    } else if (!writ && holderIsMine) {
      const freshWrit = tickMoonWrit({
        officers: cur.officers, holderId, playerForceId: cur.playerForceId,
        existing: undefined, expiresAt: addDiploSeasons(cur.date, 2),
        debateRivalries: cur.debateRivalries ?? {}, // 文敵先至
      });
      if (freshWrit) {
        set({ pendingMoonWrit: freshWrit });
        const ch = cur.officers[freshWrit.challengerId];
        get().notify(
          `月旦來辯 · ${ch?.name.zh ?? ''} ${freshWrit.feud ? '舊怨未了,再下戰帖' : '下帖求辯魁首'}`,
          `${ch?.name.en ?? 'A rival scholar'} sends a writ for your Moon-Rank laurel — answer at the Debate Ground`,
          'warn',
        );
      }
    }
  }

  // 學宮養士 (§6.10/§6.14) — seats of learning drip 心得 into whoever is
  // garrisoned beneath them: 文教 (學舍/太學/藏書樓) banks 文辯心得, 武備
  // (校場/講武堂) banks 武學心得. Any realm's cities — the schools teach
  // whoever sits in them. Capped per city so stacking stays modest.
  if (seasonBoundary) {
    const cur = get();
    const wen: Record<string, number> = {};
    const wu: Record<string, number> = {};
    for (const b of cur.buildings) {
      if (b.level <= 0) continue;
      const add = (m: Record<string, number>, n: number) => { m[b.cityId] = Math.min(3, (m[b.cityId] ?? 0) + n); };
      if (b.id === 'academy' || b.id === 'library') add(wen, 1);
      else if (b.id === 'grandacademy') add(wen, 2);
      else if (b.id === 'drillground') add(wu, 1);
      else if (b.id === 'warschool') add(wu, 2);
    }
    if (Object.keys(wen).length > 0 || Object.keys(wu).length > 0) {
      const officers = { ...cur.officers };
      let touched = false;
      // 國風助學 (§6.18) — a realm's character speeds the schools that match
      // it. Cached per force so a big roster doesn't recompute per officer.
      const ethosCache = new Map<string, { martial: number; literary: number }>();
      const ethosFor = (fid: string | null | undefined) => {
        if (!fid) return { martial: 0, literary: 0 };
        let e = ethosCache.get(fid);
        if (!e) { e = ethosSchoolBonus(realmEthos(cur.officers, cur.deeds ?? {}, fid)); ethosCache.set(fid, e); }
        return e;
      };
      for (const o of Object.values(cur.officers)) {
        if (!o.locationCityId || o.status === 'dead' || o.status === 'imprisoned' || o.status === 'unsearched') continue;
        const bonus = ethosFor(o.forceId);
        const w1 = (wen[o.locationCityId] ?? 0) > 0 ? (wen[o.locationCityId] ?? 0) + bonus.literary : 0;
        const w2 = (wu[o.locationCityId] ?? 0) > 0 ? (wu[o.locationCityId] ?? 0) + bonus.martial : 0;
        if (!w1 && !w2) continue;
        officers[o.id] = {
          ...o,
          ...(w1 ? { debateInsight: (o.debateInsight ?? 0) + w1 } : {}),
          ...(w2 ? { martialInsight: (o.martialInsight ?? 0) + w2 } : {}),
        };
        touched = true;
      }
      if (touched) set({ officers });
    }
  }

  // 出將入相 (§6.15) — a name high on BOTH the 武評榜 and the 月旦榜
  // steadies whichever city they garrison (a small loyalty aura), for any
  // realm: the talent commands respect, not the flag.
  if (seasonBoundary) {
    const cur = get();
    const dual = dualLuminaries(cur.officers, cur.warRatings ?? {});
    if (dual.size > 0) {
      const cities = { ...cur.cities };
      let touched = false;
      for (const id of dual) {
        const o = cur.officers[id];
        const city = o?.locationCityId ? cities[o.locationCityId] : null;
        if (!city || city.loyalty >= 100) continue;
        cities[city.id] = { ...city, loyalty: Math.min(100, city.loyalty + DUAL_LUMINARY_LOYALTY) };
        touched = true;
      }
      if (touched) set({ cities });
    }
  }

  // 崇文安民 (§6.18) — a realm whose court honours letters keeps its cities
  // that little bit calmer, everywhere at once. The martial mirror of this
  // is 武風懾人 (ethosDreadBonus), felt at the duelling ground instead.
  if (seasonBoundary) {
    const cur = get();
    const byForce = new Map<string, number>();
    for (const f of Object.values(cur.forces)) {
      const aura = ethosLoyaltyAura(realmEthos(cur.officers, cur.deeds ?? {}, f.id));
      if (aura > 0) byForce.set(f.id, aura);
    }
    if (byForce.size > 0) {
      const cities = { ...cur.cities };
      let touched = false;
      for (const c of Object.values(cur.cities)) {
        const aura = c.ownerForceId ? byForce.get(c.ownerForceId) : undefined;
        if (!aura || c.loyalty >= 100) continue;
        cities[c.id] = { ...c, loyalty: Math.min(100, c.loyalty + aura) };
        touched = true;
      }
      if (touched) set({ cities });
    }
  }

  // 歲末雙榜 (§6.15) — at year's end the court publishes both boards' top
  // three: the year's fiercest arms (武評榜) and keenest tongues (月旦榜).
  // A place is a feather of 威名 and the roll goes into the annals — a
  // yearly beat that keeps both ladders feeling like living institutions.
  if (seasonBoundary && state.date.season === 'winter') {
    const cur = get();
    const honors = annualHonors(cur.officers, cur.warRatings ?? {}, cur.date.year);
    const officers = { ...cur.officers };
    const bump = (id: string, rank: number) => {
      const o = officers[id];
      if (o && o.status !== 'dead') officers[id] = { ...o, renown: (o.renown ?? 0) + honorRenown(rank) };
    };
    const nameOf = (id: string) => cur.officers[id]?.name.zh ?? id;
    if (honors.arms.length) {
      for (const h of honors.arms) bump(h.officerId, h.rank);
      const line = honors.arms.map((h) => `${h.rank}. ${nameOf(h.officerId)}(${h.scoreZh})`).join('、');
      get().recordAnnal({ year: cur.date.year, season: cur.date.season, kind: 'event', titleZh: '歲末武評', textZh: `是歲武評榜:${line} — 天下驍將,一時瑜亮。`, cityId: null });
    }
    if (honors.tongues.length) {
      for (const h of honors.tongues) bump(h.officerId, h.rank);
      const line = honors.tongues.map((h) => `${h.rank}. ${nameOf(h.officerId)}(${h.scoreZh})`).join('、');
      get().recordAnnal({ year: cur.date.year, season: cur.date.season, kind: 'event', titleZh: '歲末月旦', textZh: `是歲月旦榜:${line} — 士林清望,天下所歸。`, cityId: null });
    }
    set({ officers });
  }
}
