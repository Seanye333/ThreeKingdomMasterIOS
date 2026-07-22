import type { City, EntityId, Force, GameDate, Officer } from '../types';
import type { EndingKind } from '../state/gameState';

export interface EndingContext {
  cities: Record<EntityId, City>;
  officers: Record<EntityId, Officer>;
  forces: Record<EntityId, Force>;
  playerForceId: EntityId | null;
  date: GameDate;
  /** Year the player declared emperor (if any). */
  enthroneYear?: number;
  /** 勝利條件 — when not 'free', only the chosen path (and defeat) ends the
   *  campaign; lesser/incidental endings are suppressed so the game continues. */
  victoryGoal?: 'free' | 'unify' | 'hegemon' | 'tripartite';
}

/** Which ending kinds satisfy a chosen victory goal. Unification always counts
 *  (it strictly exceeds the lesser goals); defeat is handled separately. */
const GOAL_ALLOWED: Record<'unify' | 'hegemon' | 'tripartite', EndingKind[]> = {
  unify: ['unify', 'unify-tyrant'],
  hegemon: ['hegemon', 'restore-han', 'unify', 'unify-tyrant'],
  tripartite: ['tripartite', 'unify', 'unify-tyrant'],
};

export interface EndingResult {
  kind: EndingKind;
  titleZh: string;
  titleEn: string;
  textZh: string;
  textEn: string;
}

export function checkEndings(ctx: EndingContext): EndingResult | null {
  const result = rawEnding(ctx);
  if (!result) return null;
  const goal = ctx.victoryGoal ?? 'free';
  // Defeat always ends the game; with a goal set, only matching victories do.
  if (goal === 'free' || result.kind === 'defeat') return result;
  return GOAL_ALLOWED[goal].includes(result.kind) ? result : null;
}

function rawEnding(ctx: EndingContext): EndingResult | null {
  if (!ctx.playerForceId) return null;
  const totalCities = Object.keys(ctx.cities).length;
  const playerCities = Object.values(ctx.cities).filter(
    (c) => c.ownerForceId === ctx.playerForceId,
  );
  if (playerCities.length === 0) return defeat(ctx);
  if (playerCities.length === totalCities) {
    // 王道 vs 霸道 — did you win the realm's heart, or only its land?
    const avgLoy = playerCities.reduce((s, c) => s + c.loyalty, 0) / playerCities.length;
    return avgLoy < 50 ? unifyTyrant() : unify();
  }

  // Restore Han: playing as a Liu, hold Luoyang + Chang'an + Xuchang.
  const ruler = playerForceRuler(ctx);
  const isLiu = ruler?.name.en.startsWith('Liu') || ruler?.id.startsWith('liu-');
  const holdsHanCapitals =
    playerCities.some((c) => c.id === 'city-luoyang') &&
    playerCities.some((c) => c.id === 'city-changan') &&
    playerCities.some((c) => c.id === 'city-xuchang');
  if (isLiu && holdsHanCapitals) return restoreHan();
  // Hegemon: a non-Liu warlord seizes all three imperial capitals — the
  // Mandate held by the sword, not by blood.
  if (!isLiu && holdsHanCapitals) return hegemon();

  // Tripartite: each of three top forces holds ≥ 1/3, and we're one of them.
  const byForce = new Map<EntityId, number>();
  for (const c of Object.values(ctx.cities)) {
    if (c.ownerForceId) byForce.set(c.ownerForceId, (byForce.get(c.ownerForceId) ?? 0) + 1);
  }
  const sorted = [...byForce.entries()].sort((a, b) => b[1] - a[1]);
  if (sorted.length >= 3) {
    const [, a] = sorted[0];
    const [, b] = sorted[1];
    const [, c] = sorted[2];
    const oneThird = Math.floor(totalCities * 0.28);
    if (a >= oneThird && b >= oneThird && c >= oneThird) {
      const playerHolds = sorted.slice(0, 3).some(([id]) => id === ctx.playerForceId);
      if (playerHolds && ctx.date.year >= 220) return tripartite();
    }
  }

  // Recluse: own < 4 cities AND avg officer loyalty ≥ 90 AND year ≥ 220.
  if (playerCities.length <= 3 && ctx.date.year >= 220) {
    const mine = Object.values(ctx.officers).filter(
      (o) => o.forceId === ctx.playerForceId && o.status !== 'dead',
    );
    if (mine.length > 0) {
      const avg = mine.reduce((s, o) => s + o.loyalty, 0) / mine.length;
      if (avg >= 90) return recluse();
    }
  }

  // Emperor: declared emperor 5+ years ago and still holding ≥ half cities.
  if (
    ctx.enthroneYear &&
    ctx.date.year - ctx.enthroneYear >= 5 &&
    playerCities.length >= Math.floor(totalCities / 2)
  ) {
    return emperor();
  }

  // Endured: no unification, but you outlasted the age (the era ends 280) and
  // still hold a real domain. Lowest priority — only if nothing grander fits.
  if (ctx.date.year >= 265 && playerCities.length >= 4) return endured();

  return null;
}

function playerForceRuler(ctx: EndingContext): Officer | null {
  if (!ctx.playerForceId) return null;
  const f = ctx.forces[ctx.playerForceId];
  if (!f) return null;
  return ctx.officers[f.rulerOfficerId] ?? null;
}

function unify(): EndingResult {
  return {
    kind: 'unify',
    titleZh: '天下統一',
    titleEn: 'Unified the Realm',
    textZh:
      '汉室倾颓数十年,战乱无休。今卿一统九州,百姓重见天日。史官将此功记入青史,千秋万代,永传其名。',
    textEn:
      'For decades the Han crumbled and the realm bled. Now you have brought all nine provinces under one banner. The people see daylight again. The historians enter your name into the record — to be remembered for ten thousand generations.',
  };
}

function unifyTyrant(): EndingResult {
  return {
    kind: 'unify-tyrant',
    titleZh: '霸道一統',
    titleEn: 'Unification by the Sword',
    textZh:
      '九州盡入版圖,然非以德而以威。 城邑俯首,非心服也,畏卿之兵耳。 史官提筆而躊躇:一統之功則大矣,然「苛政猛於虎」之譏,亦千載難磨。 願卿守成之日,化威為德。',
    textEn:
      'All nine provinces are yours — won not by virtue but by force. The cities bow, yet not in their hearts: it is your soldiers they fear. The historian hesitates, brush in hand. The feat of unification is vast — but the old reproach, "tyranny is fiercer than a tiger," will not wear away in a thousand years. May the days of keeping the peace turn that fear to love.',
  };
}

function endured(): EndingResult {
  return {
    kind: 'endured',
    titleZh: '久御四海',
    titleEn: 'Outlasted the Age',
    textZh:
      '群雄並起,旋起旋滅,而卿之旗,歷數十寒暑而不倒。 天下未一,然亂世將終,卿猶巍然守其疆土。 後人翻檢青史,於興亡更迭之間,屢見卿名 —— 不為最強,而為最久。',
    textEn:
      'Warlords rose and fell, rose and fell — yet your banner still stands after decades of frost and heat. The realm is not united, but the age of chaos draws to its close, and there you remain, holding your borders unbroken. Later readers, leafing through the chronicles of rise and ruin, meet your name again and again — not the mightiest, but the most enduring.',
  };
}

function restoreHan(): EndingResult {
  return {
    kind: 'restore-han',
    titleZh: '汉室再兴',
    titleEn: 'The Han Restored',
    textZh:
      '献帝降诏,大汉中兴。卿以宗室之身,聚天下英才,夺三京以复祖业。汉祚再续四百年,后世称卿为光武之亚。',
    textEn:
      'Emperor Xian issues an edict of restoration. As kin of the imperial line, you have gathered the talent of the realm and recovered the three capitals. The Han endures another four hundred years. Later ages will name you second only to Emperor Guangwu.',
  };
}

function hegemon(): EndingResult {
  return {
    kind: 'hegemon',
    titleZh: '霸業既成',
    titleEn: 'Hegemon of the Realm',
    textZh:
      '洛陽、長安、許昌——三京皆入卿手。卿非漢之宗親,然挾天子、據形勝,號令不出於血脈而出於刀鋒。 諸侯側目,海內震動。 史筆難斷:此為周公,抑或王莽?',
    textEn:
      "Luoyang, Chang'an, Xuchang — all three imperial capitals are yours. No kin of the Han, you hold the Son of Heaven and the high ground both; your word carries not by bloodline but by the edge of the blade. The lords look on askance, and the realm trembles. The historians cannot decide: are you a Duke of Zhou, or a Wang Mang?",
  };
}

function tripartite(): EndingResult {
  return {
    kind: 'tripartite',
    titleZh: '三国鼎立',
    titleEn: 'The Three Kingdoms Stand',
    textZh:
      '天下三分,卿守一隅,与其余二雄分庭抗礼。 兵戈或暂息,然各怀大志。 史称三国时代,自此而始。',
    textEn:
      'The realm divides in three. You hold one corner, balanced against the other two. The sword may rest awhile, but each watches the other. Historians will call this the Age of Three Kingdoms — beginning here.',
  };
}

function recluse(): EndingResult {
  return {
    kind: 'recluse',
    titleZh: '隐士退隐',
    titleEn: 'The Sage Retires',
    textZh:
      '不与天下争锋,守一隅之地,与亲信渔樵山林。 浊世汹涌,而卿之名清如孤云,后人记为隐世名君。',
    textEn:
      'You take no part in the contest for the realm. Holding your small corner, you fish and gather firewood in the hills with your closest friends. The world stays muddy, but your name floats clean above it like a single cloud. Later ages remember you as the hidden ruler.',
  };
}

function emperor(): EndingResult {
  return {
    kind: 'emperor',
    titleZh: '即位称帝',
    titleEn: 'Enthroned',
    textZh:
      '卿登九五之位,改元建号。四方称臣,百官朝贺。 自此,新朝立焉。',
    textEn:
      'You ascend the dragon throne. A new era begins under your reign-name. The corners of the realm bow; the hundred officials offer congratulations. Thus a new dynasty is founded.',
  };
}

/**
 * 敗亡 — one EndingKind, but the manner of the fall is not one story. We read
 * the player-ruler's fate at the moment the last city is lost and pick a
 * matching elegy, so losing gets the same narrative care as the six victories:
 *   • 身死亂軍 (ruler dead) → 社稷為墟
 *   • 為敵所擒 (ruler imprisoned) → 階下之囚
 *   • 大勢已去而奉璽出降 (ruler alive, late era) → 奉璽出降(樂不思蜀式)
 *   • 提殘騎亡命 (ruler alive, early era) → 流亡天涯
 *   • 無主可考 → the plain collapse (fallback).
 */
function defeat(ctx: EndingContext): EndingResult {
  const ruler = playerForceRuler(ctx);
  const base = { kind: 'defeat' as const };

  if (ruler?.status === 'dead') {
    return {
      ...base,
      titleZh: '社稷為墟',
      titleEn: 'The Altars Fall',
      textZh:
        '孤城既破,君主身死亂軍之中。 宗廟傾覆,社稷為墟,舊部星散,或降或亡。 亂世如爐,又銷一雄 —— 青史寥寥數字,不及當年金戈鐵馬。',
      textEn:
        'The last city breaks, and the lord falls amid the routed host. The ancestral temples topple, the altars of state lie in ruin; the old retainers scatter — some surrender, some perish. The age of chaos is a furnace, and it has melted down another hero. The chronicles spare you a few cold words, nothing of the clash of arms.',
    };
  }

  if (ruler?.status === 'imprisoned') {
    return {
      ...base,
      titleZh: '階下之囚',
      titleEn: 'Prisoner of the Victor',
      textZh:
        '城陷之日,君主為敵所擒,檻車一輛,囚送敵都。 昔日號令三軍,今日仰人鼻息。 或如亡國之君日夕以淚洗面,或如劉禪佯狂求活 —— 生死榮辱,已不由己。',
      textEn:
        "On the day the city falls, the lord is taken alive — a single prison cart bears him to the conqueror's capital. Once you commanded three armies; now you live at another's sufferance. Perhaps, like the last ruler of a fallen house, you wash your face nightly with tears; perhaps, like Liu Shan, you play the fool to keep breathing. Life and death, honor and shame — none of it is yours to choose now.",
    };
  }

  // Ruler still alive but landless. A late-era collapse reads as a formal
  // surrender (奉璽出降); an early one, as flight into the wilderness.
  if (ruler && ctx.date.year >= 263) {
    return {
      ...base,
      titleZh: '奉璽出降',
      titleEn: 'The Seal Surrendered',
      textZh:
        '大勢已去,君主自縛出降,雙手奉上國璽。 敵酋受之,或封侯以安其心,或遷宗室於異鄉。 「此間樂,不思蜀」—— 苟全性命於亂世,亦是一種收場。 只是那面旗,再不會升起了。',
      textEn:
        'The tide has turned past saving. The lord binds his own hands and comes out to surrender, offering up the state seal in both palms. The victor takes it — enfeoffing you a marquis to set your heart at ease, or removing your kin to some distant town. "This place is pleasant; I do not miss Shu" — to keep one\'s life through a broken age is also an ending, of a kind. Only that banner will never rise again.',
    };
  }

  if (ruler) {
    return {
      ...base,
      titleZh: '流亡天涯',
      titleEn: 'Cast Adrift',
      textZh:
        '城池盡失,君主提殘部數騎,亡命關山。 或依附故舊,寄人籬下;或散作編氓,湮沒無聞。 昔劉備數失城郭而終成帝業 —— 然天下,終究只有一個劉備。',
      textEn:
        "Every city lost, the lord flees over the passes with a handful of riders. Perhaps you attach yourself to old friends and live under another's roof; perhaps you dissolve into the common registers and vanish without a trace. Liu Bei too lost his cities time and again and yet founded an empire in the end — but the realm, after all, held only one Liu Bei.",
    };
  }

  return {
    ...base,
    titleZh: '败亡',
    titleEn: 'Defeated',
    textZh: '势力倾覆,部下星散。 历史从未记得失败者的姓名。',
    textEn:
      'Your force collapses, your followers scatter. History does not remember the names of the defeated.',
  };
}
