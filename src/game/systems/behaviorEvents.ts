import type { City, EntityId, Force, GameDate, Officer, TaxRate } from '../types';
import type { EventEffect, EventChoice, HistoricalEvent } from '../types/event';

/**
 * 動態事件 — emergent events driven by *how the player is playing*, not by the
 * calendar. Each reads the current force/economy/court state and, when a
 * behavioural threshold is crossed, builds a {@link HistoricalEvent} on the fly
 * so it flows through the same firing → EventModal → choice pipeline as scripted
 * history. The player's ruler is set as the chooser, so the decision is theirs.
 *
 * De-duplication is free: the store appends a fired event's `id` to
 * `firedEventIds`, and we skip any id already there — so each behavioural beat
 * fires at most once per campaign. No new persisted state is introduced.
 */
export interface BehaviorEventContext {
  date: GameDate;
  cities: Record<EntityId, City>;
  officers: Record<EntityId, Officer>;
  forces: Record<EntityId, Force>;
  taxPolicy: Record<EntityId, TaxRate>;
  playerForceId: EntityId | null;
  firedEventIds: EntityId[];
  /** §8.5 — per-force 天命 (0–100); drives the 勸進/眾叛親離 beats. */
  mandateByForce?: Record<EntityId, number>;
  /** §1.11 律令 — the realm's legal code; the 峻法/寬刑 beats read it. */
  lawCode?: Record<EntityId, string>;
  /** §1.12 徭役 — the realm's corvée level; the 民力 beat reads it. */
  corvee?: Record<EntityId, string>;
  rng?: () => number;
}

const statAvg = (o: Officer): number =>
  (o.stats.leadership + o.stats.war + o.stats.intelligence + o.stats.politics + o.stats.charisma) / 5;

/** A behavioural candidate: a predicate over current state + a builder that
 *  produces the firing event when the predicate holds. */
interface Candidate {
  id: EntityId;
  build: () => HistoricalEvent | null;
}

/**
 * Returns at most one emergent event for this season, or null. Eligible-and-
 * unfired candidates each roll a per-season chance so the beat doesn't fire the
 * very instant a threshold is crossed; since it can only fire once per game, it
 * still lands within a season or two of becoming eligible.
 */
export function rollBehaviorEvent(ctx: BehaviorEventContext): HistoricalEvent | null {
  const { playerForceId } = ctx;
  if (!playerForceId) return null;
  const force = ctx.forces[playerForceId];
  if (!force) return null;
  const rulerId = force.rulerOfficerId;
  const fired = new Set(ctx.firedEventIds);
  const rng = ctx.rng ?? Math.random;

  const cities = Object.values(ctx.cities).filter((c) => c.ownerForceId === playerForceId);
  if (cities.length === 0) return null;
  const totalGold = cities.reduce((a, c) => a + c.gold, 0);
  const avgLoyalty = cities.reduce((a, c) => a + c.loyalty, 0) / cities.length;
  const tax = ctx.taxPolicy[playerForceId] ?? 'normal';
  const idleTalent = Object.values(ctx.officers)
    .filter((o) => o.forceId === playerForceId && o.status === 'idle' && statAvg(o) >= 70)
    .sort((a, b) => statAvg(b) - statAvg(a));
  // Restless officers — your own men (not the ruler) whose loyalty has sunk
  // into defection territory.
  const restless = Object.values(ctx.officers)
    .filter((o) =>
      o.forceId === playerForceId && o.id !== rulerId &&
      o.status !== 'dead' && o.status !== 'imprisoned' &&
      o.loyalty < 30)
    .sort((a, b) => a.loyalty - b.loyalty);

  const cityLoyaltyAll = (delta: number): EventEffect[] =>
    cities.map((c) => ({ kind: 'city-loyalty', cityId: c.id, delta }));

  const playerMandate = ctx.mandateByForce?.[playerForceId] ?? 50;
  const loyalOfficers = Object.values(ctx.officers)
    .filter((o) => o.forceId === playerForceId && o.id !== rulerId && o.status !== 'dead' && o.status !== 'imprisoned')
    .sort((a, b) => b.loyalty - a.loyalty);

  // §1.11–§1.14 民政 — the four civic meters, realm-wide, for the beats below.
  const meanOf = (pick: (c: City) => number) =>
    cities.length ? cities.reduce((a, c) => a + pick(c), 0) / cities.length : 0;
  const meanDocket = meanOf((c) => c.caseload ?? 0);
  const meanHidden = meanOf((c) => c.hiddenHouseholds ?? 0);
  const worstHoard = cities.reduce((m, c) => Math.max(m, c.hoardedGrain ?? 0), 0);
  const law = ctx.lawCode?.[playerForceId] ?? 'standard';
  const levy = ctx.corvee?.[playerForceId] ?? 'none';

  const candidates: Candidate[] = [
    // §1.11 刑名之議 — with the courts choked, the court itself argues about law.
    {
      id: 'behavior-law-debate',
      build: () => {
        if (meanDocket < 45 || cities.length < 4) return null;
        const jurist = [...loyalOfficers].sort((a, b) => b.stats.politics - a.stats.politics)[0] ?? null;
        const choices: EventChoice[] = [
          {
            id: 'strict',
            label: { zh: '明正典刑,寧嚴勿縱', en: 'Sharpen the code — better harsh than lax' },
            effects: [
              ...cityLoyaltyAll(-3),
              ...(jurist ? [{ kind: 'officer-loyalty' as const, officerId: jurist.id, delta: 8 }] : []),
              { kind: 'flag', key: 'law-debate-strict' },
            ],
          },
          {
            id: 'lenient',
            label: { zh: '約法省刑,與民更始', en: 'Cut the code back — begin again with the people' },
            effects: [...cityLoyaltyAll(5), { kind: 'flag', key: 'law-debate-lenient' }],
          },
          {
            id: 'judges',
            label: { zh: '不改其法,但增廷尉', en: 'Leave the law; appoint more magistrates' },
            effects: [
              { kind: 'force-gold', forceId: playerForceId, delta: -800 },
              ...cityLoyaltyAll(2),
            ],
          },
        ];
        return event(
          'behavior-law-debate', rulerId,
          { zh: '刑名之議', en: 'The Argument Over Law' },
          {
            zh: `獄訟山積,案牘盈庭。堂上爭論不休 —— 一曰「亂世當用重典,不嚴無以立威」;一曰「秦以嚴亡,漢以寬興,願主公省刑薄賦」。${law === 'strict' ? '(今行峻法)' : law === 'lenient' ? '(今行寬刑)' : ''}`,
            en: 'The dockets are choked and the hall is loud. One side: "In a broken age only a harsh code commands respect." The other: "Qin fell by severity and Han rose by mercy — lighten the law, my lord."',
          },
          'somber',
          choices,
        );
      },
    },

    // §1.12 豪右抗命 — the great houses have swallowed the registers and say so.
    {
      id: 'behavior-gentry-defiance',
      build: () => {
        if (meanHidden < 22 || cities.length < 4) return null;
        const clanLord = [...loyalOfficers].sort((a, b) => b.stats.charisma - a.stats.charisma)[0] ?? null;
        const choices: EventChoice[] = [
          {
            id: 'audit',
            label: { zh: '嚴詔括戶,敢隱者論罪', en: 'Order a full audit — concealment is a crime' },
            effects: [
              ...cityLoyaltyAll(-2),
              ...(clanLord ? [{ kind: 'officer-loyalty' as const, officerId: clanLord.id, delta: -12 }] : []),
              { kind: 'flag', key: 'gentry-audit' },
            ],
          },
          {
            id: 'bargain',
            label: { zh: '與之約:輸粟則免其罪', en: 'Bargain: grain for amnesty' },
            effects: [
              { kind: 'force-gold', forceId: playerForceId, delta: 1200 },
              ...cityLoyaltyAll(-1),
            ],
          },
          {
            id: 'ignore',
            label: { zh: '姑置不問,先安其心', en: 'Let it lie — their goodwill is worth more' },
            effects: clanLord ? [{ kind: 'officer-loyalty', officerId: clanLord.id, delta: 8 }] : [],
          },
        ];
        return event(
          'behavior-gentry-defiance', rulerId,
          { zh: '豪右抗命', en: 'The Great Houses Refuse' },
          {
            zh: '郡中大姓蔭附日眾,版籍所載十不存七。遣吏檢括,其家僮部曲閉門拒之,曰:「此皆吾家舊佃,非國之編戶也。」',
            en: 'The commandery\'s great families have taken in so many households that the registers show barely a third of the people. Sent to count them, your clerks found the gates barred: "These are our tenants of old — not the state\'s households."',
          },
          'ominous',
          choices,
        );
      },
    },

    // §1.14 米貴如珠 — a cornered grain market reaches the throne.
    {
      id: 'behavior-grain-corner',
      build: () => {
        if (worstHoard < 28) return null;
        const choices: EventChoice[] = [
          {
            id: 'break',
            label: { zh: '發兵啟倉,平糶於市', en: 'Send troops, open the warehouses, sell at the fair price' },
            effects: [...cityLoyaltyAll(5), { kind: 'force-gold', forceId: playerForceId, delta: -600 }],
          },
          {
            id: 'buy',
            label: { zh: '官出金購之,轉輸軍中', en: 'Buy the hoard at their price — the army needs it' },
            effects: [
              { kind: 'force-gold', forceId: playerForceId, delta: -2500 },
              { kind: 'force-troops-multiplier', forceId: playerForceId, multiplier: 1.05 },
              ...cityLoyaltyAll(-2),
            ],
          },
          {
            id: 'tax',
            label: { zh: '許其自便,但徵其利', en: 'Let them profit — and tax the profit' },
            effects: [{ kind: 'force-gold', forceId: playerForceId, delta: 1800 }, ...cityLoyaltyAll(-5)],
          },
        ];
        return event(
          'behavior-grain-corner', rulerId,
          { zh: '米貴如珠', en: 'Grain Worth Its Weight' },
          {
            zh: '市中米價一日三漲,而諸家倉廩皆滿。饑民聚於倉門,吏不能禁。或曰:「此輩非商,乃國之蠹也。」',
            en: 'Grain rises three times in a day while every private granary stands full. The hungry gather at the warehouse gates and the clerks cannot move them. Someone says: "These are not merchants. They are worms in the state\'s timber."',
          },
          'ominous',
          choices,
        );
      },
    },

    // §1.12/§1.15 民力已竭 — heavy corvée, and the countryside says enough.
    {
      id: 'behavior-corvee-strain',
      build: () => {
        if (levy !== 'heavy' || avgLoyalty > 55) return null;
        const choices: EventChoice[] = [
          {
            id: 'rest',
            label: { zh: '罷役還農,與民休息', en: 'Send the levies home to their fields' },
            effects: [...cityLoyaltyAll(8), { kind: 'flag', key: 'corvee-rested' }],
          },
          {
            id: 'press',
            label: { zh: '功成在即,不可半途', en: 'The work is nearly done — press on' },
            effects: [...cityLoyaltyAll(-4), { kind: 'flag', key: 'corvee-pressed' }],
          },
          {
            id: 'pay',
            label: { zh: '出府庫錢,雇役代徵', en: 'Pay the labourers out of the treasury instead' },
            effects: [
              { kind: 'force-gold', forceId: playerForceId, delta: -2200 },
              ...cityLoyaltyAll(4),
            ],
          },
        ];
        return event(
          'behavior-corvee-strain', rulerId,
          { zh: '民力已竭', en: 'The People Are Spent' },
          {
            zh: '役夫死者相枕於道,田疇多荒。父老詣府叩首:「非敢惰也 —— 丁壯盡在工上,田中唯老弱婦人耳。」',
            en: 'The dead labourers lie along the road and the fields stand half-worked. The village elders kneel at the gate: "We are not idle, my lord. Every able man is on the works; only the old and the women are left to the fields."',
          },
          'somber',
          choices,
        );
      },
    },

    // §8.5 勸進 — at 天命所歸 the court presses the throne on you.
    {
      id: 'behavior-mandate-urge',
      build: () => {
        if (playerMandate < 90 || cities.length < 8) return null;
        const choices: EventChoice[] = [
          {
            id: 'accept',
            label: { zh: '順天應人,築壇備禮', en: 'Bow to Heaven — raise the altar' },
            effects: [
              { kind: 'mandate-ruler', rulerOfficerId: rulerId, delta: 6 },
              { kind: 'force-gold', forceId: playerForceId, delta: -2000 },
              ...loyalOfficers.slice(0, 8).map((o): EventEffect => ({ kind: 'officer-loyalty', officerId: o.id, delta: 5 })),
              { kind: 'flag', key: 'urged-enthrone' },
            ],
          },
          {
            id: 'decline',
            label: { zh: '三讓而不受,以示謙德', en: 'Decline thrice — let virtue speak' },
            effects: [
              { kind: 'mandate-ruler', rulerOfficerId: rulerId, delta: 3 },
              ...cityLoyaltyAll(3),
            ],
          },
        ];
        return event(
          'behavior-mandate-urge', rulerId,
          { zh: '群臣勸進', en: 'The Court Urges the Throne' },
          {
            zh: '祥瑞屢見,天命所歸。群臣百官伏闕上表:「天與不取,反受其咎 — 願主公早正大位,以安天下!」',
            en: 'Portent upon portent — Heaven\'s favor is plain. The assembled court kneels with a memorial: "What Heaven offers and one refuses becomes a curse. Take the high seat, my lord, and steady the realm!"',
          },
          'auspicious',
          choices,
        );
      },
    },

    // §8.5 眾叛親離 — with the mandate in ashes, the court starts eyeing the door.
    {
      id: 'behavior-mandate-collapse',
      build: () => {
        if (playerMandate >= 12) return null;
        const shakiest = [...loyalOfficers].reverse()[0] ?? null;
        const choices: EventChoice[] = [
          {
            id: 'penance',
            label: { zh: '下罪己詔,開倉賑民', en: 'Issue a penance edict — open the granaries' },
            effects: [
              { kind: 'mandate-ruler', rulerOfficerId: rulerId, delta: 10 },
              { kind: 'force-gold', forceId: playerForceId, delta: -500 },
              ...cityLoyaltyAll(4),
            ],
          },
          {
            id: 'deny',
            label: { zh: '諱而不宣,鎮之以威', en: 'Say nothing — rule by awe' },
            effects: shakiest
              ? [{ kind: 'officer-loyalty', officerId: shakiest.id, delta: -15 }]
              : [],
          },
        ];
        return event(
          'behavior-mandate-collapse', rulerId,
          { zh: '天命已去,眾叛親離', en: 'The Mandate in Ashes' },
          {
            zh: '彗星再見,讖謠四起:「天厭之矣。」朝士交頭接耳,吏民逃亡日眾。老臣泣諫:「主公,人心將散,不可不察!」',
            en: 'The comet returns and the ballads say Heaven has turned its face. Courtiers whisper; clerks and commoners slip away by night. An old minister weeps: "My lord — the hearts of men are scattering."',
          },
          'ominous',
          choices,
        );
      },
    },
    // 倉廩盈溢 — a swollen treasury invites a choice: spend it on the people,
    // on the army, or sit on it.
    {
      id: 'behavior-treasury',
      build: () => {
        if (totalGold < 8000) return null;
        const choices: EventChoice[] = [
          {
            id: 'feast',
            label: { zh: '大宴群臣,與民同樂', en: 'Hold a grand feast for people and court' },
            effects: [...cityLoyaltyAll(6), { kind: 'force-gold', forceId: playerForceId, delta: -2000 }],
          },
          {
            id: 'arm',
            label: { zh: '充實武備,招兵買馬', en: 'Pour it into the army' },
            effects: [
              { kind: 'force-gold', forceId: playerForceId, delta: -3000 },
              { kind: 'force-troops-multiplier', forceId: playerForceId, multiplier: 1.08 },
            ],
          },
          {
            id: 'hoard',
            label: { zh: '積穀防饑,謹守府庫', en: 'Keep the coffers full against lean years' },
            effects: [],
          },
        ];
        return event(
          'behavior-treasury', rulerId,
          { zh: '倉廩盈溢', en: 'A Swollen Treasury' },
          {
            zh: '府庫充盈,金帛山積。長史進言:「府庫既實,主公何不有所為?」',
            en: 'The granaries are full and gold piles high. Your chief clerk asks: "The coffers brim over, my lord — to what end shall we put them?"',
          },
          'auspicious',
          choices,
        );
      },
    },

    // 苛政猛於虎 — heavy taxes plus sullen cities force a reckoning.
    {
      id: 'behavior-heavy-tax',
      build: () => {
        if (tax !== 'heavy' || avgLoyalty >= 50 || cities.length < 2) return null;
        const choices: EventChoice[] = [
          {
            id: 'ease',
            label: { zh: '輕徭薄賦,與民休息', en: 'Ease the burden — lighten taxes' },
            effects: cityLoyaltyAll(8),
          },
          {
            id: 'crackdown',
            label: { zh: '嚴刑彈壓,催徵如故', en: 'Hold the line — collect by force' },
            effects: [...cityLoyaltyAll(-5), { kind: 'force-gold', forceId: playerForceId, delta: 1500 }],
          },
        ];
        return event(
          'behavior-heavy-tax', rulerId,
          { zh: '苛政猛於虎', en: 'Taxes Heavier Than a Tiger' },
          {
            zh: '重稅之下,民有菜色,境內怨聲漸起。老吏垂淚諫曰:「苛政猛於虎也。」',
            en: 'Under heavy levies the people grow gaunt and resentment spreads. An old official weeps: "Harsh rule is fiercer than any tiger."',
          },
          'ominous',
          choices,
        );
      },
    },

    // 府庫空虛 — an empty treasury forces hard money in a tight spot.
    {
      id: 'behavior-treasury-empty',
      build: () => {
        if (totalGold >= 800 || cities.length < 2) return null;
        const choices: EventChoice[] = [
          {
            id: 'levy',
            label: { zh: '加徵賦稅,救一時之急', en: 'Raise an emergency levy' },
            effects: [
              { kind: 'force-gold', forceId: playerForceId, delta: 2000 },
              ...cityLoyaltyAll(-6),
            ],
          },
          {
            id: 'sell',
            label: { zh: '變賣官物,聊補府庫', en: 'Sell state property for coin' },
            effects: [{ kind: 'force-gold', forceId: playerForceId, delta: 1000 }],
          },
          {
            id: 'austerity',
            label: { zh: '開源節流,與民共度', en: 'Tighten the belt and share the want' },
            effects: cityLoyaltyAll(2),
          },
        ];
        return event(
          'behavior-treasury-empty', rulerId,
          { zh: '府庫空虛', en: 'An Empty Treasury' },
          {
            zh: '府庫告罄,出無可支。度支愁眉:「主公,軍餉俸祿,恐難為繼。」',
            en: 'The coffers ring hollow and there is nothing left to draw on. Your treasurer frets: "My lord — pay and stipends can hardly be met."',
          },
          'ominous',
          choices,
        );
      },
    },

    // 四海歸心 — popular rule draws worthies; reward it.
    {
      id: 'behavior-popular',
      build: () => {
        if (avgLoyalty < 85 || cities.length < 3) return null;
        const officersOfForce = Object.values(ctx.officers).filter(
          (o) => o.forceId === playerForceId && o.status !== 'dead' && o.status !== 'imprisoned',
        );
        const choices: EventChoice[] = [
          {
            id: 'feast-worthies',
            label: { zh: '設宴款待,廣結賢士', en: 'Feast the worthies who flock to you' },
            effects: [
              ...officersOfForce.slice(0, 8).map((o): EventEffect => ({ kind: 'officer-loyalty', officerId: o.id, delta: 4 })),
              { kind: 'force-gold', forceId: playerForceId, delta: -1500 },
            ],
          },
          {
            id: 'humble',
            label: { zh: '謙抑自守,不事張揚', en: 'Stay humble and let the goodwill stand' },
            effects: cityLoyaltyAll(3),
          },
        ];
        return event(
          'behavior-popular', rulerId,
          { zh: '四海歸心', en: 'The Realm Turns to You' },
          {
            zh: '德政既行,四海歸心,賢士聞風來投。或曰:「得民心者得天下。」',
            en: 'Just rule has won the people; worthy men come from afar to serve. As they say: "Win the people, and you win all under heaven."',
          },
          'auspicious',
          choices,
        );
      },
    },

    // 人心思變 — officers whose loyalty has rotted are a defection waiting to
    // happen. Buy them back, or gamble on holding them.
    {
      id: 'behavior-restless',
      build: () => {
        if (restless.length < 2) return null;
        const atRisk = restless.slice(0, 6);
        const choices: EventChoice[] = [
          {
            id: 'appease',
            label: { zh: '厚賜安撫,以恩結之', en: 'Win them back with rewards' },
            effects: [
              ...atRisk.map((o): EventEffect => ({ kind: 'officer-loyalty', officerId: o.id, delta: 12 })),
              { kind: 'force-gold', forceId: playerForceId, delta: -1500 },
            ],
          },
          {
            id: 'hold',
            label: { zh: '不為所動,靜觀其變', en: 'Hold firm and watch them' },
            effects: [],
          },
        ];
        return event(
          'behavior-restless', rulerId,
          { zh: '人心思變', en: 'Restless Hearts' },
          {
            zh: '帳下數將,怏怏不樂,頗有去意。細作密報:「主公,恐生肘腋之變。」',
            en: 'Several of your officers grow sullen and look to the door. A spy warns quietly: "My lord — trouble may stir from within."',
          },
          'ominous',
          choices,
        );
      },
    },

    // 群賢閒置 — a bench of idle talent is a standing reproach (and a risk).
    {
      id: 'behavior-idle-talent',
      build: () => {
        if (idleTalent.length < 3) return null;
        const honored = idleTalent.slice(0, 5);
        const slighted = idleTalent[0];
        const choices: EventChoice[] = [
          {
            id: 'honor',
            label: { zh: '量才授官,以禮待之', en: 'Honour them with posts and stipends' },
            effects: [
              ...honored.map((o): EventEffect => ({ kind: 'officer-loyalty', officerId: o.id, delta: 5 })),
              { kind: 'force-gold', forceId: playerForceId, delta: -1000 },
            ],
          },
          {
            id: 'ignore',
            label: { zh: '置之不理,任其投閒', en: 'Leave them idle' },
            effects: [{ kind: 'officer-loyalty', officerId: slighted.id, delta: -10 }],
          },
        ];
        return event(
          'behavior-idle-talent', rulerId,
          { zh: '群賢閒置', en: 'Talent Left Idle' },
          {
            zh: '帳下賢才雲集,卻多投閒置散。有人嘆曰:「明珠暗投,豈不惜哉?」',
            en: 'Able men crowd your halls, yet many sit unused. One sighs: "Bright pearls cast into the dark — what a waste."',
          },
          'somber',
          choices,
        );
      },
    },
  ];

  for (const cand of candidates) {
    if (fired.has(cand.id)) continue;
    const built = cand.build();
    if (!built) continue;
    // A per-season chance so the beat doesn't fire the instant it's eligible.
    if (rng() < 0.5) return built;
  }
  return null;
}

/** Assemble a behavioural event. Top-level effects stay empty — all consequence
 *  rides on the choices — and the player's ruler is the chooser so the modal
 *  always offers the decision. yearMin/Max are wide; eligibility is decided here,
 *  not by the date window. */
function event(
  id: EntityId,
  rulerId: EntityId,
  name: { zh: string; en: string },
  desc: { zh: string; en: string },
  mood: NonNullable<HistoricalEvent['mood']>,
  choices: EventChoice[],
): HistoricalEvent {
  return {
    id,
    name,
    yearMin: 0,
    yearMax: 9999,
    description: desc.en,
    descriptionZh: desc.zh,
    effects: [],
    chooserRulerId: rulerId,
    mood,
    choices,
  };
}
