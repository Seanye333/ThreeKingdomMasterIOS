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
  /** §1.16 糴政 / §1.17 錢法 / §4.8 兵制 — the 2026-07-21 institutions. */
  grainPolicy?: Record<EntityId, string>;
  coinStandard?: Record<EntityId, string>;
  serviceSystem?: Record<EntityId, string>;
  rng?: () => number;
}

/**
 * Flags the *player-pickable* choices in this file can set. Behavioural events
 * are built at runtime, so the achievement-integrity test cannot walk them the
 * way it walks scripted history — this list is what it checks against. Add a
 * key here whenever a choice sets one, or a choice-achievement pointing at it
 * will read as a dead reference.
 */
export const BEHAVIOR_CHOICE_FLAGS: readonly string[] = [
  'law-debate-strict', 'law-debate-lenient',
  'gentry-audit', 'corvee-pressed', 'corvee-rested', 'urged-enthrone',
  'coin-debased', 'coin-kept-sound', 'coin-grain-cloth',
  'wages-paid-in-full', 'wages-promised-plunder', 'wages-disbanded',
  'grain-roads-opened', 'grain-monopolised', 'grain-roads-shut',
  'wounded-tended', 'wounded-discharged', 'wounded-abandoned',
  'arms-workshops-opened', 'arms-smiths-levied', 'arms-shortage-ignored',
];

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
  // §1.16–§4.12 — the institution batch's own state, for the beats below.
  const grainPol = ctx.grainPolicy?.[playerForceId] ?? 'guided';
  const coin = ctx.coinStandard?.[playerForceId] ?? 'wuzhu';
  const service = ctx.serviceSystem?.[playerForceId] ?? 'levy';
  const meanArms = meanOf((c) => c.armaments ?? 0);
  const totalWounded = cities.reduce((a, c) => a + (c.wounded ?? 0), 0);
  // `?? 0` is load-bearing: a City without troops makes the thresholds NaN, and
  // `x < NaN` is false — which would fire these beats on turn one.
  const totalTroops = cities.reduce((a, c) => a + (c.troops ?? 0), 0);

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

    // §1.17 大錢之議 — the treasury is empty and someone knows a way to fill it.
    {
      id: 'behavior-debase-coin',
      build: () => {
        if (coin !== 'wuzhu' || cities.length < 3) return null;
        if (!(totalGold >= 0) || totalGold > cities.length * 700) return null;   // only when it bites
        const treasurer = [...loyalOfficers].sort((a, b) => b.stats.intelligence - a.stats.intelligence)[0] ?? null;
        const choices: EventChoice[] = [
          {
            id: 'debase',
            label: { zh: '鑄大錢,一當五百', en: 'Mint the big cash — one for five hundred' },
            effects: [
              { kind: 'force-gold', forceId: playerForceId, delta: 2600 },
              ...cityLoyaltyAll(-3),
              { kind: 'flag', key: 'coin-debased' },
            ],
          },
          {
            id: 'refuse',
            label: { zh: '錢法不可輕改', en: 'The coinage is not a thing to play with' },
            effects: [
              ...cityLoyaltyAll(3),
              ...(treasurer ? [{ kind: 'officer-loyalty' as const, officerId: treasurer.id, delta: 5 }] : []),
              { kind: 'flag', key: 'coin-kept-sound' },
            ],
          },
          {
            id: 'grain-cloth',
            label: { zh: '罷錢不用,以穀帛為市', en: 'Abolish coin — let them trade in grain and silk' },
            effects: [
              { kind: 'force-gold', forceId: playerForceId, delta: -400 },
              ...cityLoyaltyAll(1),
              { kind: 'flag', key: 'coin-grain-cloth' },
            ],
          },
        ];
        return event(
          'behavior-debase-coin', rulerId,
          { zh: '大錢之議', en: 'The Debasement Proposal' },
          {
            zh: '府庫已竭,而軍食方急。有司獻議:「銅一而值五百,一鑄則帑實。」老吏在旁不語,良久乃曰:「董卓鑄小錢,穀一斛數十萬 —— 主公不記得了麼?」',
            en: 'The treasury is dry and the army wants feeding. An official proposes: "One measure of copper, struck at five hundred — one minting fills the coffers." An old clerk says nothing for a long moment, then: "Dong Zhuo struck small cash. Grain went to hundreds of thousands a picul. Does my lord not remember?"',
          },
          'somber',
          choices,
        );
      },
    },

    // §4.8 欠餉之變 — a hired army that has not been paid.
    {
      id: 'behavior-wage-arrears',
      build: () => {
        if (service !== 'paid' || cities.length < 3) return null;
        const wageBill = Math.round((totalTroops / 1000) * 14);
        if (totalGold > wageBill * 3) return null;
        const captain = [...loyalOfficers].sort((a, b) => b.stats.war - a.stats.war)[0] ?? null;
        const choices: EventChoice[] = [
          {
            id: 'pay-all',
            label: { zh: '傾府庫發餉,一錢不欠', en: 'Empty the treasury — not one coin short' },
            effects: [
              { kind: 'force-gold', forceId: playerForceId, delta: -Math.min(totalGold, wageBill * 2) },
              ...(captain ? [{ kind: 'officer-loyalty' as const, officerId: captain.id, delta: 10 }] : []),
              ...cityLoyaltyAll(2),
              { kind: 'flag', key: 'wages-paid-in-full' },
            ],
          },
          {
            id: 'promise-plunder',
            label: { zh: '許以破城之財', en: 'Promise them the sack of the next city' },
            effects: [
              ...(captain ? [{ kind: 'officer-loyalty' as const, officerId: captain.id, delta: 4 }] : []),
              ...cityLoyaltyAll(-4),
              { kind: 'flag', key: 'wages-promised-plunder' },
            ],
          },
          {
            id: 'disband',
            label: { zh: '汰其冗卒,還之於農', en: 'Discharge the surplus back to the fields' },
            effects: [
              ...cities.map((c) => ({ kind: 'city-troops-multiplier' as const, cityId: c.id, multiplier: 0.88 })),
              ...cityLoyaltyAll(3),
              { kind: 'flag', key: 'wages-disbanded' },
            ],
          },
        ];
        return event(
          'behavior-wage-arrears', rulerId,
          { zh: '欠餉', en: 'Arrears' },
          {
            zh: `募兵之制,月月要錢。今府庫將盡而餉期又至,營中已有怨聲:「重賞之下所聚,無賞則散 —— 我等非世兵,不食主公之田。」`,
            en: 'A paid army wants paying, every season. The treasury is nearly out and the day has come round again. The camps are muttering: "We came for the pay. We are not hereditary soldiers; we till none of your fields."',
          },
          'somber',
          choices,
        );
      },
    },

    // §1.16 商賈請榷 — the merchant houses ask for the roads to be opened.
    {
      id: 'behavior-merchant-petition',
      build: () => {
        if (grainPol !== 'guided' || cities.length < 4) return null;
        const merchantCity = [...cities].sort((a, b) => (b.commerce ?? 0) - (a.commerce ?? 0))[0];
        if (!merchantCity || (merchantCity.commerce ?? 0) < 60) return null;
        const choices: EventChoice[] = [
          {
            id: 'open',
            label: { zh: '開關通糴,抽其商稅', en: 'Open the roads and tax the trade' },
            effects: [
              { kind: 'force-gold', forceId: playerForceId, delta: 900 },
              { kind: 'city-loyalty', cityId: merchantCity.id, delta: 5 },
              { kind: 'flag', key: 'grain-roads-opened' },
            ],
          },
          {
            id: 'monopoly',
            label: { zh: '官榷其利,不假商賈', en: 'The state takes the trade itself' },
            effects: [
              { kind: 'force-gold', forceId: playerForceId, delta: 1500 },
              { kind: 'city-loyalty', cityId: merchantCity.id, delta: -6 },
              { kind: 'flag', key: 'grain-monopolised' },
            ],
          },
          {
            id: 'refuse',
            label: { zh: '寸粟不出境', en: 'Not a grain leaves the realm' },
            effects: [
              ...cityLoyaltyAll(1),
              { kind: 'city-loyalty', cityId: merchantCity.id, delta: -3 },
              { kind: 'flag', key: 'grain-roads-shut' },
            ],
          },
        ];
        return event(
          'behavior-merchant-petition', rulerId,
          { zh: '商賈請榷', en: 'The Merchants Petition' },
          {
            zh: `${merchantCity.name.zh}大賈聯名上書:「鄰境米貴而我倉滿,願得通關之符,轉輸有無 —— 所獲,願以什一輸官。」座中有駁之者:「今日輸粟與鄰,明年鄰以我粟養兵攻我。」`,
            en: `The great merchants of ${merchantCity.name.en} petition together: "Grain is dear across the border and our granaries are full. Grant us passes, and we will hand the state a tenth of what we make." Someone objects: "Sell them grain today and next year they feed the army that comes for us."`,
          },
          'somber',
          choices,
        );
      },
    },

    // §4.11 傷卒滿營 — the infirmaries are overflowing.
    {
      id: 'behavior-wounded-overflow',
      build: () => {
        if (totalWounded <= 0 || totalWounded < Math.max(2000, totalTroops * 0.06)) return null;
        const physician = [...loyalOfficers].sort((a, b) => b.stats.intelligence - a.stats.intelligence)[0] ?? null;
        const choices: EventChoice[] = [
          {
            id: 'buy-medicine',
            label: { zh: '出金購藥,活一人是一人', en: 'Buy medicine — every man saved is a man' },
            effects: [
              { kind: 'force-gold', forceId: playerForceId, delta: -1200 },
              ...cityLoyaltyAll(4),
              ...(physician ? [{ kind: 'officer-loyalty' as const, officerId: physician.id, delta: 6 }] : []),
              { kind: 'flag', key: 'wounded-tended' },
            ],
          },
          {
            id: 'discharge',
            label: { zh: '悉數遣還鄉里', en: 'Send them all home' },
            effects: [...cityLoyaltyAll(-2), { kind: 'flag', key: 'wounded-discharged' }],
          },
          {
            id: 'ignore',
            label: { zh: '軍中無暇顧此', en: 'The army has no time for this' },
            effects: [
              ...cityLoyaltyAll(-5),
              ...(physician ? [{ kind: 'officer-loyalty' as const, officerId: physician.id, delta: -8 }] : []),
              { kind: 'flag', key: 'wounded-abandoned' },
            ],
          },
        ];
        return event(
          'behavior-wounded-overflow', rulerId,
          { zh: '傷卒滿營', en: 'The Infirmaries Overflow' },
          {
            zh: `傷者相枕於營，醫少藥竭。掌醫者叩首曰:「藥不足十之一,活與不活,今日全在主公一言。」`,
            en: 'The wounded lie head to foot in the camps; there are few physicians and no medicine. The surgeon kneels: "We have a tenth of what we need. Who lives and who does not is your word today, my lord."',
          },
          'somber',
          choices,
        );
      },
    },

    // §1.18 甲兵不修 — an ill-armed realm, told plainly.
    {
      id: 'behavior-arms-shortage',
      build: () => {
        if (meanArms >= 12 || cities.length < 4 || totalTroops < 20000) return null;
        const quartermaster = [...loyalOfficers].sort((a, b) => b.stats.politics - a.stats.politics)[0] ?? null;
        const choices: EventChoice[] = [
          {
            id: 'workshops',
            label: { zh: '大開工官,傾金鑄兵', en: 'Open the workshops — pour coin into arms' },
            effects: [
              { kind: 'force-gold', forceId: playerForceId, delta: -1600 },
              ...cities.slice(0, 4).map((c) => ({ kind: 'city-defense' as const, cityId: c.id, delta: 6 })),
              { kind: 'flag', key: 'arms-workshops-opened' },
            ],
          },
          {
            id: 'levy-smiths',
            label: { zh: '括民間之鐵,徵匠戶入官', en: 'Requisition private iron; conscript the smiths' },
            effects: [
              ...cityLoyaltyAll(-4),
              ...cities.slice(0, 6).map((c) => ({ kind: 'city-defense' as const, cityId: c.id, delta: 5 })),
              { kind: 'flag', key: 'arms-smiths-levied' },
            ],
          },
          {
            id: 'wait',
            label: { zh: '兵在人不在器', en: 'Battles are won by men, not gear' },
            effects: [
              ...(quartermaster ? [{ kind: 'officer-loyalty' as const, officerId: quartermaster.id, delta: -6 }] : []),
              { kind: 'flag', key: 'arms-shortage-ignored' },
            ],
          },
        ];
        return event(
          'behavior-arms-shortage', rulerId,
          { zh: '甲兵不修', en: 'Ill Armed' },
          {
            zh: '校閱之日,三軍列陣 —— 而甲者不能十之三,矛戟半朽。主簿低聲曰:「無甲不成軍。此非兵少,是器不足。」',
            en: 'At the review the army forms up — and fewer than a third are in armour; half the spears are rotten at the socket. The clerk says quietly: "Men without arms are a crowd. This is not a shortage of soldiers."',
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
