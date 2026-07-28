import type { GameStore } from './store';
import type { GameState } from './gameState';
import type { ResolutionOutput } from '../systems/resolution';
import type { EntityId, Officer } from '../types';
import { dueMedals, grantMedals } from '../data/medals';
import {
  checkCodexAchievements, loadAchievementProgress, processTrigger, saveAchievementProgress,
} from '../systems/achievements';
import { combatBP } from '../systems/battlePower';
import { fulfilledBounties, rollBounties } from '../systems/bounty';
import { composeYearChronicle } from '../systems/chronicle';
import { CITY_ACHIEVEMENTS_BY_ID, cityCodexRecord } from '../systems/cityCodex';
import { codexRecordPeaks, loadCodex } from '../systems/codex';
import { grantXp } from '../systems/growth';
import { gradeRank, officerGrade } from '../systems/officerGrade';
import { topBoardIds } from '../systems/powerBoard';
import { SET_REWARD_GOLD, SET_REWARD_LOYALTY, pendingSetRewards } from '../systems/setBonds';
import { playSfx } from '../systems/sound';

/**
 * 季末落幕 — everything the season does AFTER the world has already resolved.
 *
 * These blocks share a shape: the new world is settled, and they read the
 * before/after pair to decide what the player should be TOLD about it — the
 * card flip for a great name who just joined, the stingers for a city starved
 * open, the achievements a siege earned, the medals a career reached, the
 * chronicle page the historian closes each spring, the hints the 軍師 offers.
 * Nothing here changes the outcome of the season; it changes what the player
 * sees of it.
 *
 * Lifted out of `store.endSeason`, which had grown to 5,459 lines — 30% of
 * store.ts by itself. Same treatment, and same contract, as seasonBouts.ts:
 * every block reads and writes ONLY through the store's own `get`/`set`, so
 * behaviour is identical to when it lived inline.
 *
 * @param state  the world BEFORE the season resolved — the blocks below diff
 *               against it to find what changed (a roster newcomer, a city
 *               that changed hands). Not the current store state.
 * @param result what `resolveSeason` returned; its `report.entries` are the
 *               narrative source most of these blocks trigger off.
 * @param rng    戰役隨機源 — the bounty board re-roll and the sparring pairs
 *               are simulation, so they must draw from the campaign stream or
 *               a replayed season diverges. Defaults for standalone callers.
 */
export function tickSeasonEpilogue(
  get: () => GameStore,
  set: (patch: Partial<GameState>) => void,
  seasonBoundary: boolean,
  state: GameState,
  result: ResolutionOutput,
  rng: () => number = Math.random,
): void {
  // 得將開卡 — a gold-or-better name that newly entered the player's
  // service this season (歸化/薦才/來投/俘降…) gets the card-flip
  // flourish. One per season — the strongest newcomer takes the stage.
  {
    const after = get();
    if (after.playerForceId && !after.cardReveal && after.victoryStatus === 'playing') {
      let best: { id: EntityId; bp: number } | null = null;
      for (const o of Object.values(after.officers)) {
        if (o.forceId !== after.playerForceId || o.status === 'dead') continue;
        const prev = state.officers[o.id];
        if (prev && prev.forceId === after.playerForceId) continue;
        if (gradeRank(officerGrade(o).grade) < gradeRank('gold')) continue;
        const bp = combatBP(o).bp;
        if (!best || bp > best.bp) best = { id: o.id, bp };
      }
      if (best) set({ cardReveal: best.id });
    }
  }

  // 新時刻音效 — the season's dramatic beats get their stingers.
  {
    const zhAll = result.report.entries.map((e) => e.textZh ?? '').join('|');
    if (zhAll.includes('開城出降')) playSfx('horn');        // a city starved open
    else if (zhAll.includes('突圍!')) playSfx('shout');     // a sortie broke a siege
    else if (zhAll.includes('據水斷橋')) playSfx('fire');    // AI burned a crossing
  }

  // 圍城/伏擊功業 — instant achievements + the chronicle keeps the tale.
  {
    let achS = loadAchievementProgress();
    const newly: string[] = [];
    // 兵不血刃 — a city the player was besieging opened its gates.
    const starved = Object.values(state.pendingCommands).some((c) =>
      c.type === 'march' && c.besieging
      && state.officers[c.officerId]?.forceId === state.playerForceId
      && state.cities[c.besieging]?.ownerForceId !== state.playerForceId
      && result.cities[c.besieging]?.ownerForceId === state.playerForceId);
    if (starved) {
      const r = processTrigger(achS, { kind: 'starve-out-city' });
      achS = r.progress; newly.push(...r.newlyUnlocked);
    }
    // 十面埋伏 — the player's laid ambush sprang and won the clash.
    const ambushed = result.report.entries.some((e) =>
      e.battle?.ambush && e.battle.attacker.forceId === state.playerForceId);
    if (ambushed) {
      const r = processTrigger(achS, { kind: 'ambush-victory' });
      achS = r.progress; newly.push(...r.newlyUnlocked);
    }
    // 追亡逐北 — the player's army (or garrison) wiped out a fleeing rout.
    const routWiped = result.report.entries.some((e) =>
      e.battle?.routDestroyed && e.battle.attacker.forceId === state.playerForceId);
    if (routWiped) {
      const r = processTrigger(achS, { kind: 'rout-annihilated' });
      achS = r.progress; newly.push(...r.newlyUnlocked);
    }
    // 鐵鎖橫江 — your boom chained a hostile fleet this turn.
    if (result.report.entries.some((e) => (e.textZh ?? '').includes('我攔江鎖鎖住'))) {
      const r = processTrigger(achS, { kind: 'boom-stall' });
      achS = r.progress; newly.push(...r.newlyUnlocked);
    }
    // 烽火傳京 — a threatened, beaconed frontier city can relay its
    // alarm through player-held ground to the capital.
    if (state.playerForceId) {
      const pid2 = state.playerForceId;
      const cap = result.forces[pid2]?.capitalCityId;
      const hasBeacon = (c?: { buildSlots?: Array<{ buildingId?: string }> }) =>
        !!c && (c.buildSlots ?? []).some((sl) => sl.buildingId === 'beacon');
      const relayFires = cap != null && Object.values(result.armies ?? {}).some((a) => {
        if (a.forceId === pid2) return false;
        const tgt = result.cities[a.targetCityId];
        if (!tgt || tgt.ownerForceId !== pid2 || !hasBeacon(tgt) || tgt.id === cap) return false;
        // BFS through player cities to the capital (chain has a route home).
        const seen = new Set<string>([tgt.id]);
        const queue = [tgt.id];
        while (queue.length) {
          const cur = queue.shift()!;
          for (const adj of result.cities[cur]?.adjacentCityIds ?? []) {
            if (seen.has(adj)) continue;
            const n = result.cities[adj];
            if (!n || n.ownerForceId !== pid2) continue;
            if (adj === cap) return true;
            seen.add(adj);
            queue.push(adj);
          }
        }
        return false;
      });
      if (relayFires) {
        const r = processTrigger(achS, { kind: 'beacon-relay' });
        achS = r.progress; newly.push(...r.newlyUnlocked);
      }
    }
    // 民政功業(指令觸發)— fired by resolution's civic commands this season.
    for (const kind of result.civicAchievements ?? []) {
      const r = processTrigger(achS, { kind: kind as import('../types/achievement').AchievementTriggerKind });
      achS = r.progress; newly.push(...r.newlyUnlocked);
    }
    // 名場面 (§5.15/§5.17) — a plague or a fired siege camp is a beat the
    // player should hear and see, not just read. At most one per season
    // (the report still carries the rest) so a bad season doesn't spam.
    const moment = (result.moments ?? [])[0];
    if (moment) {
      playSfx(moment.kind === 'night-raid' ? 'fire' : 'dirge');
      get().pushPopup({
        key: moment.kind === 'night-raid' ? 'night-raid' : 'camp-plague',
        media: 'image',
        titleZh: moment.titleZh, titleEn: moment.titleEn,
        captionZh: moment.captionZh, captionEn: moment.captionEn,
      });
    }
    // 民政功業 (§1.11–§1.14) — checked against the realm's own books at
    // season commit: a great city with an empty docket, and a realm whose
    // registers are honest again.
    if (seasonBoundary && state.playerForceId) {
      const mine = Object.values(get().cities).filter((c) => c.ownerForceId === state.playerForceId);
      if (mine.some((c) => c.population >= 200_000 && (c.caseload ?? 0) <= 0.5)) {
        const r = processTrigger(achS, { kind: 'clear-docket' });
        achS = r.progress; newly.push(...r.newlyUnlocked);
      }
      // 編戶齊民 — a realm of real size whose hidden share is near the floor.
      if (mine.length >= 5
        && mine.reduce((a, c) => a + (c.hiddenHouseholds ?? 0), 0) / mine.length <= 4) {
        const r = processTrigger(achS, { kind: 'registers-whole' });
        achS = r.progress; newly.push(...r.newlyUnlocked);
      }
    }
    // 圖鑑功業 — collection milestones against the cross-campaign codex
    // (this season's recruits/naturalizations already marked above).
    {
      const r = checkCodexAchievements(achS, loadCodex());
      achS = r.progress; newly.push(...r.newlyUnlocked);
    }
    // 天下武評 — a player officer breaking into the realm's top ten is
    // an event worth a herald (once per entry; board is pure BP).
    if (seasonBoundary && state.playerForceId) {
      const before = topBoardIds(state.officers, 10);
      const after = topBoardIds(get().officers, 10);
      let heralds = 0;
      for (const [oid, rank] of after) {
        if (heralds >= 2) break;
        const o = get().officers[oid];
        if (!o || o.forceId !== state.playerForceId || before.has(oid)) continue;
        get().notify(
          `天下武評 — ${o.name.zh}名列第${rank}!`,
          `Realm power board: ${o.name.en} enters at #${rank}!`,
        );
        heralds += 1;
      }
    }
    if (newly.length > 0) {
      saveAchievementProgress(achS);
      set({ recentAchievementUnlocks: [...get().recentAchievementUnlocks, ...newly] });
    }
  }

  // 成套之禮 — a famous roster standing complete under the player's
  // banner for the first time this campaign: the court celebrates,
  // the treasury opens, the honoured names warm (once per set).
  if (seasonBoundary && state.playerForceId) {
    const cur = get();
    const rewards = pendingSetRewards(cur.officers, cur.playerForceId, cur.setRewardsClaimed ?? []);
    if (rewards.length > 0) {
      const capId = cur.playerForceId ? cur.forces[cur.playerForceId]?.capitalCityId : null;
      const cities2 = { ...cur.cities };
      if (capId && cities2[capId]) {
        cities2[capId] = { ...cities2[capId], gold: cities2[capId].gold + SET_REWARD_GOLD * rewards.length };
      }
      const officers2 = { ...cur.officers };
      for (const r of rewards) {
        for (const mid of r.memberIds) {
          const o = officers2[mid];
          if (o) officers2[mid] = { ...o, loyalty: Math.min(100, o.loyalty + SET_REWARD_LOYALTY) };
        }
      }
      set({
        cities: cities2,
        officers: officers2,
        setRewardsClaimed: [...(cur.setRewardsClaimed ?? []), ...rewards.map((r) => r.setId)],
        popupQueue: [...cur.popupQueue, ...rewards.map((r) => ({
          key: 'set-complete',
          media: 'image' as const,
          titleZh: '名將成套',
          titleEn: 'A Famous Set Complete',
          captionZh: `${r.zh}齊聚我麾下!賜金 ${SET_REWARD_GOLD}、眾將忠誠 +${SET_REWARD_LOYALTY};同陣出征自有羈絆之力`,
          captionEn: `${r.en} all serve your banner! +${SET_REWARD_GOLD} gold, members +${SET_REWARD_LOYALTY} loyalty`,
        }))],
      });
    }
  }

  // 歷戰勳章 — deed milestones mint their medals (+1 stat each) for every
  // living officer, AI included; the player's newest laureates get a herald.
  if (seasonBoundary) {
    const cur = get();
    const patches: Record<EntityId, Officer> = {};
    let heralds = 0;
    for (const o of Object.values(cur.officers)) {
      if (o.status === 'dead') continue;
      const due = dueMedals(o, cur.deeds[o.id]);
      if (due.length === 0) continue;
      patches[o.id] = grantMedals(o, due);
      if (o.forceId === cur.playerForceId && heralds < 2) {
        heralds += 1;
        get().notify(
          `${o.name.zh}獲勳「${due.map((m) => m.name.zh).join('」「')}」— ${due.map((m) => `${m.descriptionZh.split('—')[1]?.trim() ?? ''}`).join('、')}`,
          `${o.name.en} earns ${due.map((m) => m.name.en).join(', ')}`,
        );
      }
    }
    if (Object.keys(patches).length > 0) {
      set({ officers: { ...cur.officers, ...patches } });
    }
  }

  // 天下懸賞 — settle fulfilled notices (gold to the capital, fame to the
  // court), then re-roll the spring board.
  if (seasonBoundary && state.playerForceId) {
    const cur = get();
    const done = fulfilledBounties(cur.bounties ?? [], cur.officers, cur.cities, cur.playerForceId);
    let bountiesNext = (cur.bounties ?? []).filter((b) => !done.some((d) => d.officerId === b.officerId));
    if (done.length > 0) {
      const capId = cur.playerForceId ? cur.forces[cur.playerForceId]?.capitalCityId : null;
      const cap = capId ? cur.cities[capId] : undefined;
      const goldSum = done.reduce((s2, b) => s2 + b.gold, 0);
      if (cap) {
        set({ cities: { ...cur.cities, [cap.id]: { ...cap, gold: cap.gold + goldSum } } });
      }
      for (const b of done) {
        const o = cur.officers[b.officerId];
        get().notify(
          `懸賞已結 — ${o?.name.zh ?? b.officerId}${b.kind === 'capture' ? '落網' : '來歸'}!賞金 ${b.gold}`,
          `Bounty settled — ${o?.name.en ?? b.officerId} ${b.kind === 'capture' ? 'taken' : 'won over'}! +${b.gold} gold`,
        );
      }
    }
    if (get().date.season === 'spring' || bountiesNext.length !== (cur.bounties ?? []).length) {
      if (get().date.season === 'spring') {
        const rolled = rollBounties(get().officers, cur.playerForceId, get().date.year, rng, bountiesNext);
        for (const b of rolled) {
          if (!bountiesNext.some((x) => x.officerId === b.officerId)) {
            const o = get().officers[b.officerId];
            get().notify(
              `天下懸賞 — ${b.kind === 'capture' ? '擒' : '攬'}${o?.name.zh ?? b.officerId}:賞金 ${b.gold}(限至 ${b.expiresYear} 年)`,
              `Wanted — ${b.kind} ${o?.name.en ?? b.officerId}: ${b.gold} gold (by ${b.expiresYear})`,
            );
          }
        }
        bountiesNext = rolled;
      }
      set({ bounties: bountiesNext });
    }
  }

  // 切磋雙修 — two idle officers sharing a city may spar the season away
  // (20%/city): both season their craft (XP), and a green hand pressed by
  // a far stronger partner may steal a technique (偷師). All forces alike.
  if (seasonBoundary) {
    const cur = get();
    const byCity = new Map<EntityId, Officer[]>();
    for (const o of Object.values(cur.officers)) {
      if (o.status !== 'idle' || !o.locationCityId || !o.forceId) continue;
      const arr = byCity.get(o.locationCityId) ?? [];
      arr.push(o);
      byCity.set(o.locationCityId, arr);
    }
    const patches: Record<EntityId, Officer> = {};
    let told = 0;
    for (const [cityId, pool] of byCity) {
      const sameForce = pool.filter((o) => o.forceId === pool[0].forceId);
      if (sameForce.length < 2 || rng() >= 0.2) continue;
      const [a, b] = sameForce.sort(() => rng() - 0.5).slice(0, 2);
      let ga = grantXp(a, 12, rng).officer;
      let gb = grantXp(b, 12, rng).officer;
      // 偷師 — outmatched by 15+ war, the weaker gleans a technique (20%).
      const [hi, lo] = ga.stats.war >= gb.stats.war ? [ga, gb] : [gb, ga];
      let stole: string | null = null;
      if (hi.stats.war - lo.stats.war >= 15 && rng() < 0.2) {
        stole = hi.skills.find((sk) => !lo.skills.includes(sk)) ?? null;
        if (stole) {
          const loNext = { ...lo, skills: [...lo.skills, stole] };
          if (loNext.id === ga.id) ga = loNext; else gb = loNext;
        }
      }
      patches[ga.id] = ga;
      patches[gb.id] = gb;
      if (a.forceId === cur.playerForceId && told < 1) {
        told += 1;
        const cn = cur.cities[cityId]?.name.zh ?? '';
        get().notify(
          `${a.name.zh}與${b.name.zh}於${cn}切磋演武 — 兩人俱有所得${stole ? `,${lo.name.zh}偷師得技` : ''}`,
          `${a.name.en} and ${b.name.en} spar at ${cn} — both sharpen${stole ? '; a technique gleaned' : ''}`,
        );
      }
    }
    if (Object.keys(patches).length > 0) set({ officers: { ...get().officers, ...patches } });
  }

  // 巔峰入冊 — the album remembers the strongest form each of YOUR
  // officers ever reached (BP/stars/grade), across campaigns.
  if (seasonBoundary && state.playerForceId) {
    const cur = get();
    codexRecordPeaks(Object.values(cur.officers)
      .filter((o) => o.forceId === cur.playerForceId && o.status !== 'dead')
      .map((o) => ({ id: o.id, bp: combatBP(o).bp, stars: o.stars ?? 0, grade: officerGrade(o).grade })));
    // 名城入錄 — the atlas remembers every city you raise to greatness.
    const freshCity = cityCodexRecord(Object.values(cur.cities).filter((c) => c.ownerForceId === cur.playerForceId));
    for (const { cityId, achId } of freshCity.slice(0, 3)) {
      const cn = cur.cities[cityId]?.name; const ach = CITY_ACHIEVEMENTS_BY_ID[achId];
      if (cn && ach) get().notify(`名城入錄 —「${cn.zh}」得「${ach.zh}」之譽`, `${cn.en} earns the honour of ${ach.en}`);
    }
  }

  // 史官年鑑 — the historian closes the year each spring: one page of
  // 大勢/兵事/災異/武評, waiting in pendingChronicle for the player.
  if (seasonBoundary && get().date.season === 'spring' && state.playerForceId
      && get().victoryStatus === 'playing') {
    const cur = get();
    const closedYear = cur.date.year - 1;
    const counts: Record<EntityId, number> = {};
    for (const c of Object.values(cur.cities)) {
      if (c.ownerForceId) counts[c.ownerForceId] = (counts[c.ownerForceId] ?? 0) + 1;
    }
    if (closedYear >= (cur.annals[0]?.year ?? closedYear)) {
      set({
        pendingChronicle: composeYearChronicle({
          year: closedYear, annals: cur.annals, cities: cur.cities, forces: cur.forces,
          officers: cur.officers, boardTop: topBoardIds(cur.officers, 3),
          prevCounts: cur.yearbookCounts ?? {}, playerForceId: cur.playerForceId,
        }),
        yearbookCounts: counts,
      });
    } else {
      set({ yearbookCounts: counts });
    }
  }

  // 武評前席 — snapshot this season's top-50 board so the 武評 tab can
  // draw ↑↓ movement arrows and NEW badges against last season.
  if (seasonBoundary) {
    set({ powerBoardPrev: Object.fromEntries(topBoardIds(get().officers, 50)) });
  }

  // 軍師點撥 — turn-report-driven one-shot tips for the new systems.
  {
    const hints = get();
    // ① first ambush sprung on (or by) the player → scouting counterplay.
    if (result.report.entries.some((e) => e.battle?.ambush
      && (e.battle.attacker.forceId === state.playerForceId || e.battle.defender.forceId === state.playerForceId))) {
      hints.maybeHint('scouting',
        '軍師:伏兵之患,在於不見 — 行軍改「緩進」偵查加半,智將領軍更易識破林間藏兵。',
        'Ambushes hide — march CAUTIOUS to scout better; a wise commander flushes them out.');
    }
    // ② an enemy column bearing down on a beacon-less player city → 烽燧.
    if (state.playerForceId) {
      const threatened = Object.values(result.armies ?? {}).some((a) => {
        if (a.forceId === state.playerForceId) return false;
        const tgt = result.cities[a.targetCityId];
        return tgt?.ownerForceId === state.playerForceId
          && !(tgt.buildSlots ?? []).some((sl) => sl.buildingId === 'beacon');
      });
      if (threatened) {
        hints.maybeHint('beacon',
          '軍師:敵蹤已近而烽燧未備 — 於邊城外環建「烽燧」,警訊可沿烽燧鏈直傳都城。',
          'Raise BEACONS on frontier cities — alarms then relay station-to-station to your capital.');
      }
    }
    // ③ an enemy rout is fleeing across the map → hunt it down.
    if (state.playerForceId
      && Object.values(result.armies ?? {}).some((a) => a.routed && a.forceId !== state.playerForceId)) {
      hints.maybeHint('rout-hunt',
        '軍師:敵軍已潰,倉皇奔逃 — 潰軍無力再戰,以近城之兵「邀擊」掩殺,可收降卒、擒敵將;縱之則歸城復振。',
        'An enemy ROUT is fleeing — intercept it: routs cannot fight back, and cutting one down yields surrendered troops and captured officers.');
    }
    // ④ a player column worn past 60 fatigue → remind them to rest it.
    if (state.playerForceId
      && Object.values(result.armies ?? {}).some((a) => a.forceId === state.playerForceId && (a.fatigue ?? 0) >= 60)) {
      hints.maybeHint('fatigue-rest',
        '軍師:師老兵疲 — 久役之軍戰力士氣俱衰(面板「疲」值),擇安地「駐守」休整數旬可復;圍城之營不得息。',
        'A column past 60 FATIGUE fights well below strength — camp it somewhere safe to rest (siege camps grind on).');
    }
  }
}
