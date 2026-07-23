import type { HistoricalEvent } from '../types';

/**
 * Scripted historical events. The event runner checks these every season and
 * fires the first one whose conditions match. Each event can fire at most once
 * (tracked via state.firedEvents).
 *
 * Effects are deliberately moderate — narrative reinforcement, not game-breaking
 * power swings.
 */
export const HISTORICAL_EVENTS: HistoricalEvent[] = [
  /* ─── 三顧茅廬 — three-step chain with choices (chooser: 劉備) ─────────
     Steps gate on flags the previous choice set; walking away at any
     step sets maolu-abandoned and the chain never resumes. AI Liu Bei
     walks the historical path (first choice) automatically. */
  {
    id: 'evt-maolu-1',
    name: { en: 'The Sleeping Dragon', zh: '司馬徽薦臥龍' },
    yearMin: 207,
    yearMax: 210,
    requires: [
      { kind: 'officer-alive', officerId: 'liu-bei' },
      { kind: 'officer-unaffiliated', officerId: 'zhuge-liang' },
      { kind: 'flag-unset', key: 'maolu-abandoned' },
    ],
    description:
      'Sima Hui speaks of a hermit in Longzhong: "The Sleeping Dragon - secure him, and you secure the realm." The farmhouse lies a hard ride away.',
    descriptionZh: '司馬徽言隆中有臥龍先生:「得臥龍者得天下。」茅廬路遠,將軍親往否?',
    effects: [],
    chooserRulerId: 'liu-bei',
    choices: [
      { id: 'go', label: { zh: '親往隆中拜訪', en: 'Ride to Longzhong' }, effects: [{ kind: 'flag', key: 'maolu-visit-1' }] },
      { id: 'skip', label: { zh: '軍務繁忙,改日再說', en: 'The wars come first' }, effects: [{ kind: 'flag', key: 'maolu-abandoned' }] },
    ],
  },
  {
    id: 'evt-maolu-2',
    name: { en: 'The Empty Farmhouse', zh: '二顧不遇' },
    yearMin: 207,
    yearMax: 210,
    requires: [
      { kind: 'flag-set', key: 'maolu-visit-1' },
      { kind: 'flag-unset', key: 'maolu-abandoned' },
      { kind: 'officer-alive', officerId: 'liu-bei' },
      { kind: 'officer-unaffiliated', officerId: 'zhuge-liang' },
    ],
    description:
      'Twice now the farmhouse stands empty - the master wanders the hills. Zhang Fei fumes about burning the place down. Return a third time?',
    descriptionZh: '兩度造訪,先生雲遊未歸。張飛怒欲焚廬。三往乎?',
    effects: [],
    chooserRulerId: 'liu-bei',
    choices: [
      { id: 'again', label: { zh: '精誠所至,金石為開 — 再訪', en: 'Sincerity moves mountains - again' }, effects: [{ kind: 'flag', key: 'maolu-visit-2' }] },
      { id: 'enough', label: { zh: '罷了,天下何處無賢才', en: 'Enough - talent is everywhere' }, effects: [{ kind: 'flag', key: 'maolu-abandoned' }] },
    ],
  },
  {
    id: 'evt-maolu-3',
    name: { en: 'Three Visits to the Thatched Cottage', zh: '三顧茅廬' },
    yearMin: 207,
    yearMax: 211,
    requires: [
      { kind: 'flag-set', key: 'maolu-visit-2' },
      { kind: 'flag-unset', key: 'maolu-abandoned' },
      { kind: 'officer-alive', officerId: 'liu-bei' },
      { kind: 'officer-unaffiliated', officerId: 'zhuge-liang' },
    ],
    description:
      'The third visit finds the Sleeping Dragon at home. He unrolls a map of the realm and speaks of three kingdoms before the tea cools. He will come - if asked with full honors.',
    descriptionZh: '三顧而先生在廬。孔明展圖論天下三分,茶未涼而大勢已明。以師禮相請,先生可出山。',
    effects: [],
    chooserRulerId: 'liu-bei',
    choices: [
      {
        id: 'invite',
        label: { zh: '拜請先生出山', en: 'Beg him to take the field' },
        effects: [
          { kind: 'officer-join-ruler', officerId: 'zhuge-liang', rulerOfficerId: 'liu-bei' },
          { kind: 'officer-loyalty', officerId: 'zhuge-liang', delta: 40 },
          { kind: 'flag', key: 'maolu-done' },
        ],
      },
      { id: 'leave', label: { zh: '聽罷高論,拂袖而去', en: 'Hear him out, then leave' }, effects: [{ kind: 'flag', key: 'maolu-abandoned' }] },
    ],
  },

  /* ─── 連環計 — three-step chain: the beauty, the rift, the halberd ──
     王允獻貂蟬 sows it; at 鳳儀亭 Dong Zhuo (or his player) decides; the
     rift path ends with Lu Bu's halberd. The legacy one-shot
     assassination event is gated off once this chain delivers. */
  {
    id: 'evt-lianhuan-1',
    name: { en: 'The Beauty Stratagem', zh: '王允獻貂蟬' },
    yearMin: 191,
    yearMax: 193,
    requires: [
      { kind: 'officer-active', officerId: 'wang-yun' },
      { kind: 'officer-alive', officerId: 'dong-zhuo' },
      { kind: 'officer-alive', officerId: 'lu-bu' },
    ],
    description:
      'Wang Yun feasts both the tyrant and his foster son — and promises the singing girl Diaochan to each. The wedge is set.',
    descriptionZh: '王允設宴,先許貂蟬於呂布,復獻於董卓。一女二許,楔子已下。',
    effects: [{ kind: 'flag', key: 'lianhuan-sown' }],
  },
  {
    id: 'evt-lianhuan-2',
    name: { en: 'The Phoenix Pavilion', zh: '鳳儀亭' },
    yearMin: 191,
    yearMax: 194,
    requires: [
      { kind: 'flag-set', key: 'lianhuan-sown' },
      { kind: 'officer-alive', officerId: 'dong-zhuo' },
      { kind: 'officer-alive', officerId: 'lu-bu' },
    ],
    description:
      'Dong Zhuo finds Lu Bu and Diaochan together at the Phoenix Pavilion and hurls a halberd at his own foster son. The woman stands between them — whose is she?',
    descriptionZh: '董卓撞見呂布與貂蟬私會鳳儀亭,擲戟相向。美人立於父子之間 — 歸誰?',
    effects: [],
    chooserRulerId: 'dong-zhuo',
    choices: [
      {
        id: 'keep',
        label: { zh: '自納貂蟬,奉先算什麼東西', en: 'Keep her — Fengxian be damned' },
        effects: [
          { kind: 'officer-loyalty', officerId: 'lu-bu', delta: -30 },
          { kind: 'flag', key: 'lianhuan-rift' },
        ],
      },
      {
        id: 'gift',
        label: { zh: '忍痛賜婚,籠絡虎將', en: 'Wed her to Lu Bu — keep the tiger' },
        effects: [
          { kind: 'officer-loyalty', officerId: 'lu-bu', delta: 15 },
          { kind: 'flag', key: 'lianhuan-averted' },
        ],
      },
    ],
  },
  {
    id: 'evt-lianhuan-3',
    name: { en: 'The Halberd Falls', zh: '呂布弒董' },
    yearMin: 192,
    yearMax: 195,
    requires: [
      { kind: 'flag-set', key: 'lianhuan-rift' },
      { kind: 'officer-alive', officerId: 'dong-zhuo' },
      { kind: 'officer-alive', officerId: 'lu-bu' },
    ],
    description:
      'At the palace gate Lu Bu reads the secret decree aloud — and drives his halberd through his foster father. The tyrant\'s host shatters.',
    descriptionZh: '宮門之前,呂布宣詔於先,舉戟於後。義父殞命,涼州兵土崩瓦解。',
    effects: [
      { kind: 'officer-status', officerId: 'dong-zhuo', status: 'dead' },
      { kind: 'force-troops-multiplier', forceId: 'force-dong-zhuo', multiplier: 0.5 },
      { kind: 'flag', key: 'dong-zhuo-slain' },
    ],
  },

  /* ─── 官渡·烏巢 — one night decides the north (chooser: 曹操) ────── */
  {
    id: 'evt-wuchao',
    name: { en: 'The Granaries at Wuchao', zh: '許攸夜獻烏巢' },
    yearMin: 200,
    yearMax: 203,
    requires: [
      { kind: 'officer-alive', officerId: 'cao-cao' },
      { kind: 'officer-alive', officerId: 'yuan-shao' },
      { kind: 'officer-rules-cities-min', officerId: 'yuan-shao', count: 2 },
    ],
    description:
      'Xu You defects barefoot in the night: every grain Yuan Shao owns sits under thin guard at Wuchao. It smells like a trap. It always does.',
    descriptionZh: '許攸夜奔而來:袁紹屯糧盡在烏巢,守備空虛。聞着像個圈套 — 圈套向來都這個味。',
    effects: [],
    chooserRulerId: 'cao-cao',
    choices: [
      {
        id: 'raid',
        label: { zh: '親率輕騎,夜襲烏巢', en: 'Ride tonight — burn it all' },
        effects: [
          { kind: 'force-troops-multiplier', forceId: 'force-yuan-shao', multiplier: 0.65 },
          // 糧道盡毀 — the granary fire sweeps Yuan Shao's whole supply
          // ribbon off the map: his deep columns starve (§4.1 補給線)
          // until they re-walk a corridor home.
          { kind: 'strip-force-paint', forceId: 'force-yuan-shao' },
          { kind: 'flag', key: 'wuchao-burned' },
        ],
      },
      {
        id: 'doubt',
        label: { zh: '疑有詐,按兵不動', en: 'Too neat — hold position' },
        effects: [{ kind: 'flag', key: 'wuchao-missed' }],
      },
    ],
  },

  /* ─── 下邳之圍 — 泗沂灌城,白門樓上 (chooser: 曹操) ─────────────── */
  {
    id: 'evt-xiapi-flood',
    name: { en: 'The Rivers Turned on Xiapi', zh: '決泗沂之水灌下邳' },
    yearMin: 198,
    yearMax: 201,
    requires: [
      { kind: 'officer-alive', officerId: 'cao-cao' },
      { kind: 'officer-in-city', officerId: 'lu-bu', cityId: 'xiapi' },
      { kind: 'flag-unset', key: 'xiapi-resolved' },
    ],
    description:
      'Lü Bu holds Xiapi and will not come out. Guo Jia points at the map: the Si and Yi rivers run right past the walls. Break the dikes, drown the town — or sit down and starve him out.',
    descriptionZh: '呂布嬰城自守,不肯出戰。郭嘉指圖而言:泗、沂二水繞城而過 — 決堤灌城,可不攻自破;或深溝高壘,坐困之。',
    effects: [],
    chooserRulerId: 'cao-cao',
    mood: 'martial',
    choices: [
      {
        id: 'flood',
        label: { zh: '決泗沂之水,灌其城郭', en: 'Break the dikes — drown the walls' },
        effects: [
          // 水灌下邳 — ramparts undermined, garrison drowned and shaken:
          // the follow-up siege (長圍 or storm) meets a broken city.
          { kind: 'city-defense', cityId: 'xiapi', delta: -40 },
          { kind: 'city-troops-multiplier', cityId: 'xiapi', multiplier: 0.8 },
          { kind: 'city-food', cityId: 'xiapi', delta: -8000 },
          { kind: 'city-loyalty', cityId: 'xiapi', delta: -10 },
          { kind: 'flag', key: 'xiapi-flooded' },
        ],
      },
      {
        id: 'invest',
        label: { zh: '深溝高壘,圍而不攻', en: 'Dig in — starve him out' },
        effects: [
          // 圍困之始 — the market roads are cut ahead of the formal siege
          // (pair it with the 長圍 stance for the bloodless finish).
          { kind: 'city-food', cityId: 'xiapi', delta: -12000 },
          { kind: 'city-loyalty', cityId: 'xiapi', delta: -6 },
          { kind: 'flag', key: 'xiapi-invested' },
        ],
      },
    ],
  },
  {
    id: 'evt-baimenlou',
    name: { en: 'The White Gate Tower', zh: '白門樓' },
    yearMin: 198,
    yearMax: 202,
    requires: [
      { kind: 'officer-alive', officerId: 'lu-bu' },
      { kind: 'city-owner-ruler', cityId: 'xiapi', rulerOfficerId: 'cao-cao' },
      { kind: 'flag-unset', key: 'xiapi-resolved' },
    ],
    description:
      'Xiapi has fallen; Lü Bu is bound beneath the White Gate tower, offering his lance to your service. Liu Bei says one quiet sentence about Ding Yuan and Dong Zhuo.',
    descriptionZh: '下邳城破,呂布縛於白門樓下,願獻戟效力。玄德在旁,只輕聲提了丁原、董卓二人。',
    effects: [],
    chooserRulerId: 'cao-cao',
    mood: 'somber',
    choices: [
      {
        id: 'hang',
        label: { zh: '縊殺之,以絕後患(史實)', en: 'Hang him — no third master' },
        effects: [
          { kind: 'officer-status', officerId: 'lu-bu', status: 'dead' },
          { kind: 'officer-status', officerId: 'chen-gong', status: 'dead' },
          { kind: 'flag', key: 'xiapi-resolved' },
        ],
      },
      {
        id: 'spare',
        label: { zh: '收為己用 — 飛將難得,隱患自負', en: 'Take the Flying General — and the risk' },
        effects: [
          { kind: 'officer-join-ruler', officerId: 'lu-bu', rulerOfficerId: 'cao-cao' },
          { kind: 'officer-loyalty', officerId: 'lu-bu', delta: -25 },
          { kind: 'officer-join-ruler', officerId: 'chen-gong', rulerOfficerId: 'cao-cao' },
          { kind: 'officer-loyalty', officerId: 'chen-gong', delta: -15 },
          { kind: 'flag', key: 'xiapi-resolved' },
          { kind: 'flag', key: 'lubu-spared' }, // distinct hook for the 抉擇勳功
        ],
      },
    ],
  },

  /* ─── 白衣渡江 — Jingzhou changes hands in merchant robes (chooser: 孫權) ── */
  {
    id: 'evt-baiyi',
    name: { en: 'White-Robed Crossing', zh: '白衣渡江' },
    yearMin: 212,
    yearMax: 225,
    requires: [
      { kind: 'officer-active', officerId: 'lu-meng' },
      { kind: 'officer-alive', officerId: 'guan-yu' },
      { kind: 'officer-alive', officerId: 'sun-quan' },
      { kind: 'flag-unset', key: 'baiyi-deferred' },
    ],
    description:
      'Lü Meng pleads illness; his soldiers pole upriver dressed as merchants. Guan Yu\'s beacon towers will never light. One word from you and Jingzhou changes hands — and the oath brothers will never forgive it.',
    descriptionZh: '呂蒙稱病,士卒白衣搖櫓,扮作商旅 — 雲長的烽火台一座也來不及點。一聲令下荊州易主,而桃園之仇不死不休。',
    effects: [],
    chooserRulerId: 'sun-quan',
    choices: [
      {
        id: 'cross',
        label: { zh: '白衣渡江,襲取荊州', en: 'Cross — take Jingzhou' },
        effects: [
          { kind: 'officer-status', officerId: 'guan-yu', status: 'dead' },
          { kind: 'flag', key: 'baiyi-done' },
        ],
      },
      {
        id: 'wait',
        label: { zh: '聯劉抗曹為重,暫緩', en: 'The alliance matters more — wait' },
        effects: [{ kind: 'flag', key: 'baiyi-deferred' }],
      },
    ],
  },

  /* ─── 空城計 — an open gate and a guqin (chooser: 司馬懿) ────────── */
  {
    id: 'evt-kongcheng',
    name: { en: 'The Empty Fort', zh: '空城計' },
    yearMin: 205,
    yearMax: 235,
    requires: [
      { kind: 'officer-active', officerId: 'zhuge-liang' },
      { kind: 'officer-active', officerId: 'sima-yi' },
      { kind: 'flag-set', key: 'maolu-done' },
    ],
    description:
      'Your vanguard reaches Xicheng and finds the gates wide open — Kongming alone on the wall, burning incense, playing the guqin. Fifteen万 men halt at the sound of one instrument.',
    descriptionZh: '前鋒抵西城,城門大開 — 孔明獨坐城頭,焚香操琴。十五萬大軍,被一張琴攔在城外。',
    effects: [],
    chooserRulerId: 'sima-yi',
    choices: [
      {
        id: 'retreat',
        label: { zh: '此中有詐,傳令退兵', en: 'A trap — sound the withdrawal' },
        effects: [{ kind: 'flag', key: 'kongcheng-spared' }],
      },
      {
        id: 'charge',
        label: { zh: '管他有詐沒詐,給我衝', en: 'Trap or not — charge' },
        effects: [
          { kind: 'officer-status', officerId: 'zhuge-liang', status: 'imprisoned' },
          { kind: 'flag', key: 'kongcheng-caught' },
        ],
      },
    ],
  },

  /* ─── 衣帶詔 — two-step conspiracy chain (chooser: 劉備) ─────────── */
  {
    id: 'evt-yidaizhao-1',
    name: { en: 'The Girdle Edict', zh: '衣帶詔' },
    yearMin: 199,
    yearMax: 201,
    requires: [
      { kind: 'officer-alive', officerId: 'liu-bei' },
      { kind: 'officer-alive', officerId: 'cao-cao' },
      { kind: 'flag-unset', key: 'yidai-refused' },
    ],
    description:
      'A blood edict sewn into a girdle reaches you: the Emperor begs loyal men to rid him of Cao Cao. Signing it is treason - or loyalty, depending on who wins.',
    descriptionZh: '車騎將軍董承密呈衣帶詔:天子血書,求忠臣誅曹。署名即與聞大逆 — 抑或大忠,成王敗寇而已。',
    effects: [],
    chooserRulerId: 'liu-bei',
    choices: [
      { id: 'sign', label: { zh: '泣血署名', en: 'Sign in blood' }, effects: [{ kind: 'flag', key: 'yidai-signed' }] },
      { id: 'refuse', label: { zh: '不敢奉詔', en: 'Dare not accept' }, effects: [{ kind: 'flag', key: 'yidai-refused' }] },
    ],
  },
  {
    id: 'evt-yidaizhao-2',
    name: { en: 'The Plot Unravels', zh: '衣帶詔事洩' },
    yearMin: 200,
    yearMax: 202,
    requires: [
      { kind: 'flag-set', key: 'yidai-signed' },
      { kind: 'officer-alive', officerId: 'liu-bei' },
      { kind: 'officer-alive', officerId: 'cao-cao' },
    ],
    description:
      "The conspiracy is betrayed. Dong Cheng dies with his household; your name is on the list. The brothers close ranks around you - there is no kneeling back into Cao Cao's good graces now.",
    descriptionZh: '事洩!董承闔門遇害,名冊之上赫然有將軍之名。兄弟同仇,自此與曹氏不死不休。',
    effects: [
      { kind: 'officer-loyalty', officerId: 'guan-yu', delta: 8 },
      { kind: 'officer-loyalty', officerId: 'zhang-fei', delta: 8 },
      { kind: 'flag', key: 'yidai-exposed' },
    ],
  },

  {
    id: 'evt-yellow-turban-defeated',
    name: { en: 'The Yellow Turbans Crushed', zh: '黃巾之亂平定' },
    yearMin: 190,
    yearMax: 191,
    description:
      'Word reaches the courts that the Yellow Turban Rebellion has been broken in the southern provinces. Loyal generals are rewarded with promotions.',
    descriptionZh: "黃巾之亂於南方諸州盡數平定的消息傳至朝廷,有功之將皆獲擢升。",
    effects: [],
  },
  {
    id: 'evt-dong-zhuo-burns-luoyang',
    name: { en: 'Dong Zhuo Burns Luoyang', zh: '董卓焚洛陽' },
    yearMin: 190,
    yearMax: 191,
    season: 'summer',
    requires: [{ kind: 'force-alive', forceId: 'force-dong-zhuo' }],
    description:
      'Pressed by the coalition, Dong Zhuo torches the imperial capital and flees with the boy emperor to Chang\'an. Luoyang lies in ruins; loyalty collapses across the Central Plain.',
    descriptionZh: "迫於聯軍壓境,董卓焚毀帝都,挾少帝西遷長安。洛陽化為廢墟,中原民心崩潰。",
    effects: [
      { kind: 'city-loyalty', cityId: 'city-luoyang', delta: -40 },
      { kind: 'flag', key: 'luoyang-burned' },
    ],
  },
  {
    id: 'evt-dong-zhuo-assassinated',
    name: { en: 'Dong Zhuo Assassinated', zh: '董卓被弒' },
    yearMin: 192,
    yearMax: 193,
    requires: [
      { kind: 'force-alive', forceId: 'force-dong-zhuo' },
      { kind: 'officer-active', officerId: 'wang-yun' },
      // The 連環計 chain owns this outcome now; this one-shot is the
      // fallback when the chain hasn't delivered (or was averted).
      { kind: 'flag-unset', key: 'dong-zhuo-slain' },
      { kind: 'flag-unset', key: 'lianhuan-rift' },
    ],
    description:
      'Wang Yun and Diaochan turn Lü Bu against his foster father. Dong Zhuo dies under his own ward\'s halberd, and the tyrant\'s force fractures.',
    descriptionZh: "王允與貂蟬挑撥呂布反其義父。董卓殞於義子戟下,暴君勢力分崩離析。",
    effects: [
      { kind: 'officer-status', officerId: 'dong-zhuo', status: 'dead' },
      { kind: 'force-troops-multiplier', forceId: 'force-dong-zhuo', multiplier: 0.5 },
    ],
  },
  {
    id: 'evt-coalition-dissolves',
    name: { en: 'The Coalition Dissolves', zh: '反董卓聯軍解散' },
    yearMin: 191,
    yearMax: 193,
    description:
      'With the tyrant chased to Chang\'an, the warlords return to their own holdings. The coalition that once united them is at an end, and the warring states period begins in earnest.',
    descriptionZh: "暴君西竄長安後,諸侯各歸領地,曾共舉義旗的聯盟就此瓦解,群雄割據之世正式開始。",
    effects: [{ kind: 'flag', key: 'coalition-dissolved' }],
  },
  {
    id: 'evt-yuan-shao-takes-jizhou',
    name: { en: 'Yuan Shao Takes Jizhou', zh: '袁紹取冀州' },
    yearMin: 191,
    yearMax: 193,
    requires: [{ kind: 'force-alive', forceId: 'force-yuan-shao' }],
    description:
      'Yuan Shao maneuvers Han Fu out of Jizhou and adds its grain and men to his own. The largest warlord in the north now commands the richest province.',
    descriptionZh: "袁紹巧奪韓馥的冀州,將其糧草兵馬盡收己用。北方最大的諸侯如今坐擁最富庶之州。",
    effects: [
      { kind: 'force-troops-multiplier', forceId: 'force-yuan-shao', multiplier: 1.15 },
    ],
  },
  {
    id: 'evt-cao-cao-shelters-emperor',
    name: { en: 'Cao Cao Shelters the Emperor', zh: '曹操奉天子' },
    yearMin: 196,
    yearMax: 197,
    requires: [
      { kind: 'force-alive', forceId: 'force-cao-cao' },
      { kind: 'flag-set', key: 'luoyang-burned' },
    ],
    description:
      'Cao Cao escorts Emperor Xian from the ruins of Luoyang to Xuchang. Whoever holds the emperor commands legitimacy: edicts issued in Cao\'s name will be obeyed across the realm.',
    descriptionZh: "曹操自洛陽廢墟中迎獻帝至許昌。挾天子者得正統,自此曹氏所頒詔令,天下莫敢不從。",
    effects: [
      { kind: 'force-gold', forceId: 'force-cao-cao', delta: 500 },
      { kind: 'flag', key: 'emperor-with-cao' },
    ],
  },
  {
    id: 'evt-sun-ce-conquers-jiangdong',
    name: { en: 'Sun Ce Conquers Jiangdong', zh: '孫策征江東' },
    yearMin: 195,
    yearMax: 199,
    requires: [
      { kind: 'force-alive', forceId: 'force-sun-ce' },
      { kind: 'officer-active', officerId: 'sun-ce' },
    ],
    description:
      'The Little Conqueror sweeps through the south, breaking Liu Yao, Yan Baihu, and Wang Lang in turn. Jiangdong is unified under the Sun banner.',
    descriptionZh: "小霸王橫掃江南,先後擊破劉繇、嚴白虎、王朗。江東一統於孫氏旗下。",
    effects: [
      { kind: 'force-troops-multiplier', forceId: 'force-sun-ce', multiplier: 1.2 },
    ],
  },
  {
    id: 'evt-battle-of-guandu',
    name: { en: 'The Battle of Guandu', zh: '官渡之戰' },
    yearMin: 200,
    yearMax: 201,
    requires: [
      { kind: 'force-alive', forceId: 'force-cao-cao' },
      { kind: 'force-alive', forceId: 'force-yuan-shao' },
    ],
    description:
      'A small Cao Cao army defies the massive host of Yuan Shao on the Yellow River. Through a daring raid on the granaries at Wuchao, Cao breaks the back of the north — and inherits its lands.',
    descriptionZh: "曹操以寡敵眾,於黃河南岸抗袁紹大軍。烏巢一夜火起,糧盡敵潰,曹操盡得河北之地。",
    effects: [
      { kind: 'force-troops-multiplier', forceId: 'force-yuan-shao', multiplier: 0.6 },
      { kind: 'force-troops-multiplier', forceId: 'force-cao-cao', multiplier: 1.1 },
    ],
  },
  {
    // 官渡的袁紹視角:曹操已有 evt-wuchao(劫烏巢 vs 按兵)的抉擇,袁紹一方
    // 此前無選擇 —— 補上田豐之諫,讓袁紹之主也走一次「持重 vs 傾國」的分岔。
    id: 'evt-guandu-tianfeng',
    name: { en: "Tian Feng's Remonstrance", zh: '田豐諫止南征' },
    yearMin: 199,
    yearMax: 200,
    requires: [
      { kind: 'officer-active', officerId: 'yuan-shao' },
      { kind: 'officer-active', officerId: 'tian-feng' },
      { kind: 'flag-unset', key: 'guandu-tianfeng-resolved' },
    ],
    description:
      "On the eve of the southern march, Tian Feng urges patience: hold the rich north, harry Cao Cao with raids, let time wear him down. Guo Tu calls it cowardice. To heed Tian Feng keeps the north's full strength — to jail him is the road history took, straight to Guandu.",
    descriptionZh: "南征在即,田豐力諫:河北富庶,宜持重固守,分遣奇兵擾曹,曠日持久則操自敝。郭圖等斥為怯懦沮眾。納其言,則保全河北全力;逆其言而囚之,便是官渡慘敗之路 —— 而歷史,走的正是後者。",
    effects: [{ kind: 'flag', key: 'guandu-tianfeng-resolved' }],
    chooserRulerId: 'yuan-shao',
    mood: 'somber',
    choices: [
      {
        // choice[0] 必須是史實線(AI 與非當事玩家自動走此) —— 袁紹囚田豐、傾國南下
        id: 'jail',
        label: { zh: '怒而囚之,傾國南下(史實)', en: 'Jail him — march south in force' },
        effects: [
          { kind: 'mandate-ruler', rulerOfficerId: 'yuan-shao', delta: -3 },
          { kind: 'officer-loyalty', officerId: 'tian-feng', delta: -10 },
          { kind: 'flag', key: 'guandu-tianfeng-jailed' },
        ],
      },
      {
        id: 'heed',
        label: { zh: '納諫持重,緩圖曹操(逆史)', en: 'Heed him — bide your time' },
        effects: [
          { kind: 'force-troops-multiplier-ruler', rulerOfficerId: 'yuan-shao', multiplier: 1.1 },
          { kind: 'flag', key: 'guandu-tianfeng-heeded' },
        ],
      },
    ],
  },
  {
    id: 'evt-sun-ce-assassinated',
    name: { en: 'Sun Ce Assassinated', zh: '孫策死於刺客' },
    yearMin: 200,
    yearMax: 201,
    requires: [{ kind: 'officer-active', officerId: 'sun-ce' }],
    description:
      'Out hunting, the Little Conqueror is ambushed by retainers of Xu Gong, whom he had executed. He dies of his wounds, naming his young brother Sun Quan as successor.',
    descriptionZh: "小霸王出獵時為許貢門客所襲。終因傷重而亡,臨終以幼弟孫權繼業。",
    effects: [
      { kind: 'officer-status', officerId: 'sun-ce', status: 'dead' },
      { kind: 'officer-loyalty', officerId: 'sun-quan', delta: 20 },
    ],
  },
  {
    // Legacy one-shot, now the fallback behind the evt-maolu-* chain: if
    // the player walked away (maolu-abandoned), history finds another way.
    id: 'evt-three-visits-to-thatched-cottage',
    name: { en: 'Three Visits to the Thatched Cottage', zh: '三顧茅廬' },
    yearMin: 207,
    yearMax: 211,
    requires: [
      { kind: 'flag-set', key: 'maolu-abandoned' },
      { kind: 'force-alive', forceId: 'force-liu-bei' },
      { kind: 'officer-alive', officerId: 'zhuge-liang' },
      { kind: 'officer-unaffiliated', officerId: 'zhuge-liang' },
    ],
    description:
      'Liu Bei visits the hermit Zhuge Liang three times, finally winning his service. The Sleeping Dragon rises — and presents the Longzhong Plan, mapping out the path to a divided empire.',
    descriptionZh: "劉備三顧隱士諸葛亮於草廬,終得其出仕。臥龍既起,獻《隆中對》,為三分天下定下大計。",
    effects: [
      { kind: 'officer-join', officerId: 'zhuge-liang', forceId: 'force-liu-bei' },
      { kind: 'officer-loyalty', officerId: 'zhuge-liang', delta: 30 },
      { kind: 'flag', key: 'three-visits-done' },
    ],
  },
  {
    id: 'evt-battle-of-red-cliffs',
    name: { en: 'The Battle of Red Cliffs', zh: '赤壁之戰' },
    yearMin: 208,
    yearMax: 209,
    season: 'winter',
    requires: [
      { kind: 'force-alive', forceId: 'force-cao-cao' },
      { kind: 'force-alive', forceId: 'force-sun-quan' },
      { kind: 'flag-unset', key: 'chibi-chain-started' }, // superseded by the §8.1 choice chain
    ],
    description:
      'On the Yangtze, the allied fleets of Sun Quan and Liu Bei break the host of Cao Cao with a chained-ship fire attack. The dream of unification dies in the river\'s reflection.',
    descriptionZh: "長江之上,孫權與劉備聯軍以連環火攻破曹操艨艟巨艦。一統天下之夢,沒於江濤倒影之中。",
    effects: [
      { kind: 'force-troops-multiplier', forceId: 'force-cao-cao', multiplier: 0.55 },
      { kind: 'force-troops-multiplier', forceId: 'force-sun-quan', multiplier: 1.05 },
      { kind: 'force-troops-multiplier', forceId: 'force-liu-bei', multiplier: 1.1 },
      { kind: 'flag', key: 'three-kingdoms-formed' },
    ],
  },
  {
    id: 'evt-liu-bei-takes-shu',
    name: { en: 'Liu Bei Takes Shu', zh: '劉備取蜀' },
    yearMin: 213,
    yearMax: 215,
    requires: [
      { kind: 'force-alive', forceId: 'force-liu-bei' },
      { kind: 'officer-active', officerId: 'liu-bei' },
    ],
    description:
      'Invited as a defender and turning conqueror, Liu Bei seizes Yi province from his kinsman Liu Zhang. Chengdu is now the capital of a third great power.',
    descriptionZh: "劉備受邀入蜀為援,反客為主,自宗親劉璋手中奪取益州。成都自此成為第三強權的都城。",
    effects: [
      { kind: 'force-troops-multiplier', forceId: 'force-liu-bei', multiplier: 1.2 },
      { kind: 'force-gold', forceId: 'force-liu-bei', delta: 1000 },
    ],
  },
  {
    id: 'evt-fan-castle-guan-yu',
    name: { en: 'The Fall of Guan Yu', zh: '關羽，麦城死' },
    yearMin: 219,
    yearMax: 220,
    requires: [{ kind: 'officer-active', officerId: 'guan-yu' }],
    description:
      'Drowning the seven armies and besieging Fan, Guan Yu shakes the realm. Then Lü Meng of Wu crosses the river in white, takes Jiangling behind him, and the God of War falls at Maicheng.',
    descriptionZh: "關羽水淹七軍,圍困樊城,威震華夏。然呂蒙白衣渡江,襲取江陵,武聖終殞於麥城。",
    effects: [
      { kind: 'officer-status', officerId: 'guan-yu', status: 'dead' },
      { kind: 'officer-loyalty', officerId: 'zhang-fei', delta: -10 },
      { kind: 'officer-loyalty', officerId: 'liu-bei', delta: -10 },
    ],
  },
  {
    id: 'evt-cao-cao-dies',
    name: { en: 'Cao Cao Dies', zh: '曹操，世，去' },
    yearMin: 220,
    yearMax: 220,
    requires: [{ kind: 'officer-active', officerId: 'cao-cao' }],
    description:
      'The Hero of Chaos closes his eyes. His son Cao Pi will not wait long before deposing the Han and proclaiming Wei.',
    descriptionZh: "亂世奸雄闔上雙眼。其子曹丕不久即廢漢自立,建國號為魏。",
    effects: [
      { kind: 'officer-status', officerId: 'cao-cao', status: 'dead' },
      { kind: 'officer-loyalty', officerId: 'cao-pi', delta: 20 },
    ],
  },
  /* ─── 夷陵 — 連營抉擇,一陣東南風定成敗 (chooser: 劉備) ─────────── */
  {
    id: 'evt-battle-of-yiling',
    name: { en: 'The Camps at Yiling', zh: '夷陵連營' },
    yearMin: 222,
    yearMax: 223,
    requires: [
      { kind: 'force-alive', forceId: 'force-liu-bei' },
      { kind: 'force-alive', forceId: 'force-sun-quan' },
      { kind: 'officer-active', officerId: 'liu-bei' },
      { kind: 'flag-unset', key: 'yiling-resolved' },
    ],
    description:
      "Liu Bei marches east to avenge Guan Yu. As high summer bears down, he pulls the army off the boats and into the forest shade — seven hundred li of camps, dry wood upon dry wood. Ma Liang urges caution. Across the line, the young Lu Xun waits for a south-east wind.",
    descriptionZh: "劉備東征為關羽復仇。時值盛暑,乃舍舟就岸,移營林間避暑,連營七百里,盡結於茂林之中。馬良諫其危,劉備不以為意。對岸陸遜年少,只靜待一陣東南風。",
    effects: [{ kind: 'flag', key: 'yiling-resolved' }],
    chooserRulerId: 'liu-bei',
    mood: 'martial',
    choices: [
      {
        id: 'lianying',
        label: { zh: '依林結營避暑(史實)', en: 'Camp in the forest shade' },
        effects: [
          { kind: 'force-troops-multiplier', forceId: 'force-liu-bei', multiplier: 0.5 },
          { kind: 'mandate-ruler', rulerOfficerId: 'sun-quan', delta: 8 },
          { kind: 'flag', key: 'yiling-lianying' },
        ],
      },
      {
        id: 'cautious',
        label: { zh: '納馬良之諫,依險謹慎結寨', en: 'Heed Ma Liang — fortify with care' },
        effects: [
          { kind: 'force-troops-multiplier', forceId: 'force-liu-bei', multiplier: 0.85 },
          { kind: 'force-troops-multiplier', forceId: 'force-sun-quan', multiplier: 0.95 },
          { kind: 'flag', key: 'yiling-cautious' },
        ],
      },
    ],
  },
  {
    id: 'evt-yiling-fire',
    name: { en: 'Seven Hundred Li Ablaze', zh: '火燒連營七百里' },
    yearMin: 222,
    yearMax: 223,
    requires: [
      { kind: 'flag-set', key: 'yiling-lianying' },
      { kind: 'officer-active', officerId: 'lu-xun' },
    ],
    description:
      "The south-east wind rises at dusk. Lu Xun's men strike into the forest camps with torches, and the fire runs the whole length of the line. The Shu host breaks and scatters; Liu Bei flees by night to Baidicheng. A young scholar-general has undone an emperor.",
    descriptionZh: "黃昏東南風起,陸遜命士卒各持茅草火種,突入連營縱火。火乘風勢,七百里營寨一時俱焚,蜀軍崩潰。劉備連夜奔白帝城。一介書生拜將,竟燒盡帝王之師,自此名震天下。",
    effects: [
      { kind: 'officer-loyalty', officerId: 'lu-xun', delta: 10 },
      { kind: 'mandate-ruler', rulerOfficerId: 'sun-quan', delta: 5 },
      { kind: 'flag', key: 'yiling-fire' },
    ],
    mood: 'ominous',
  },
  {
    id: 'evt-liu-bei-dies',
    name: { en: 'Liu Bei Dies at Baidicheng', zh: '劉備，白帝城没' },
    yearMin: 223,
    yearMax: 223,
    requires: [
      { kind: 'officer-active', officerId: 'liu-bei' },
      { kind: 'flag-unset', key: 'baidi-chain-started' }, // superseded by the §8.1 choice chain
    ],
    description:
      'Heartbroken in defeat, Liu Bei dies at the White Emperor City, entrusting his son and his cause to Zhuge Liang.',
    descriptionZh: "劉備兵敗心碎,崩於白帝城,託孤於諸葛亮,以保其子嗣與大業。",
    effects: [
      { kind: 'officer-status', officerId: 'liu-bei', status: 'dead' },
      { kind: 'officer-loyalty', officerId: 'zhuge-liang', delta: 30 },
    ],
  },
  {
    id: 'evt-northern-campaigns',
    name: { en: 'The Northern Campaigns Begin', zh: '出師之表' },
    yearMin: 227,
    yearMax: 228,
    season: 'spring',
    requires: [
      { kind: 'force-alive', forceId: 'force-liu-bei' },
      { kind: 'officer-active', officerId: 'zhuge-liang' },
    ],
    description:
      'Zhuge Liang presents his memorial to the second emperor and marches north. Six campaigns will follow; none will reach Chang\'an. But the cause is kept alive in the marching.',
    descriptionZh: "諸葛亮上《出師表》於後主,揮師北伐。其後六出祁山,終未達長安,然漢室之志在征伐中延續不息。",
    effects: [
      // 鞠躬盡瘁 — 傾國北伐動員,漢室正統之志再燃
      { kind: 'mandate-ruler', rulerOfficerId: 'liu-shan', delta: 8 },
      { kind: 'force-troops-multiplier-ruler', rulerOfficerId: 'liu-shan', multiplier: 1.06 },
      { kind: 'flag', key: 'northern-campaigns-begun' },
    ],
  },
  {
    id: 'evt-zhuge-liang-dies',
    name: { en: 'A Star Falls at Wuzhang Plains', zh: '五丈原星墜' },
    yearMin: 234,
    yearMax: 234,
    season: 'autumn',
    requires: [{ kind: 'officer-active', officerId: 'zhuge-liang' }],
    description:
      'In the field opposite Sima Yi, the Prime Minister of Shu finally breaks. A great star falls from the southwestern sky. The age of giants ends.',
    descriptionZh: "與司馬懿對峙於五丈原前,蜀漢丞相終於油盡燈枯。一顆大星自西南天際隕落,巨人之世就此終結。",
    effects: [
      { kind: 'officer-status', officerId: 'zhuge-liang', status: 'dead' },
      { kind: 'flag', key: 'wuzhang-star-falls' },
    ],
  },

  // ─────────── 後三國補遺(2026-07):234–262 姜維北伐與淮南三叛,原本 46 年僅 ~15 事件 ───────────
  {
    id: 'evt-xingshi-battle',
    name: { en: 'Wang Ping Holds the Xingshi Passes', zh: '興勢之戰' },
    yearMin: 244,
    yearMax: 244,
    requires: [{ kind: 'officer-active', officerId: 'wang-ping' }],
    description:
      "Cao Shuang leads over a hundred thousand men against Shu; Wang Ping holds the heights at Xingshi and will not be drawn. The Wei supply lines fail, oxen and horses die by the road, and Guanzhong is drained. Cao Shuang retreats in disarray, and Shu's northern frontier is preserved.",
    descriptionZh:
      "曹爽率十餘萬眾伐蜀,王平拒守興勢,據險固守,堅壁不出。魏軍糧道艱難,牛馬多死於谷中,關中為之虛耗。爽狼狽引還,蜀漢北疆賴以保全,而曹爽威望大損,埋下高平陵之禍。",
    effects: [
      { kind: 'mandate-ruler', rulerOfficerId: 'liu-shan', delta: 4 },
      { kind: 'officer-loyalty', officerId: 'wang-ping', delta: 8 },
      { kind: 'flag', key: 'xingshi-battle' },
    ],
  },
  {
    id: 'evt-feiyi-assassinated',
    name: { en: 'Fei Yi Struck Down at the New Year Feast', zh: '費禕遇刺' },
    yearMin: 253,
    yearMax: 253,
    season: 'spring',
    requires: [{ kind: 'officer-active', officerId: 'fei-yi' }],
    description:
      "At the New Year's great assembly, the Wei defector Guo Xun, having feigned surrender, stabs the Grand General Fei Yi dead at the banquet. The pillar of Shu is felled at a stroke; thereafter Jiang Wei directs affairs, and the northern campaigns lose all restraint.",
    descriptionZh:
      "歲首大會,魏降人郭循詐降,於席間刺殺大將軍費禕。蜀漢柱石驟折於杯酒之間。自此姜維主政,北伐再無節制之人,國力益耗。溫和守成之政,隨費禕之血而終。",
    effects: [
      { kind: 'mandate-ruler', rulerOfficerId: 'liu-shan', delta: -5 },
      { kind: 'flag', key: 'feiyi-assassinated' },
    ],
  },
  {
    id: 'evt-taoxi-victory',
    name: { en: 'Jiang Wei Triumphs at Taoxi', zh: '洮西大捷' },
    yearMin: 255,
    yearMax: 255,
    requires: [{ kind: 'officer-active', officerId: 'jiang-wei' }],
    description:
      "Jiang Wei shatters Wang Jing's Wei army west of the Tao River; the dead number in the tens of thousands and the survivors flee to Didao. It is the high-water mark of the later campaigns — the closest Shu comes, after Zhuge Liang, to breaking into Yong province.",
    descriptionZh:
      "姜維大破魏雍州刺史王經於洮西,魏軍死者數萬,積屍蔽野,殘部退保狄道。此乃諸葛亮之後蜀漢北伐最盛之一役,幾入雍涼。姜維威名一時無兩,而蜀之元氣,亦於此連年征伐中暗耗。",
    effects: [
      { kind: 'mandate-ruler', rulerOfficerId: 'liu-shan', delta: 5 },
      { kind: 'officer-loyalty', officerId: 'jiang-wei', delta: 8 },
      { kind: 'flag', key: 'taoxi-victory' },
    ],
  },
  {
    id: 'evt-duangu-defeat',
    name: { en: 'Rout at Duangu', zh: '段谷之敗' },
    yearMin: 256,
    yearMax: 256,
    requires: [
      { kind: 'officer-active', officerId: 'jiang-wei' },
      { kind: 'officer-active', officerId: 'deng-ai' },
    ],
    description:
      "The year after Taoxi, Jiang Wei meets Deng Ai at Duangu and is broken; his soldiers scatter and the losses are grievous. He memorialises to demote himself, as Zhuge Liang once did after Jieting. Year upon year of war has worn Shu thin, and the people begin to murmur.",
    descriptionZh:
      "洮西之捷次年,姜維與鄧艾戰於段谷,蜀軍大敗,士卒星散,死傷甚眾。維上疏自貶為後將軍,行大將軍事,一如諸葛亮街亭之後。連年征伐,國力漸疲,蜀人始怨,鄧艾之名亦自此而顯。",
    effects: [
      { kind: 'mandate-ruler', rulerOfficerId: 'liu-shan', delta: -4 },
      { kind: 'officer-loyalty', officerId: 'jiang-wei', delta: -6 },
      { kind: 'flag', key: 'duangu-defeat' },
    ],
  },
  {
    id: 'evt-zhuge-dan-shouchun',
    name: { en: 'Zhuge Dan Rises at Shouchun', zh: '諸葛誕壽春之叛' },
    yearMin: 257,
    yearMax: 258,
    requires: [{ kind: 'officer-active', officerId: 'zhuge-dan' }],
    description:
      "Zhuge Dan holds Shouchun in revolt against Sima Zhao, leaguing with Wu, over a hundred thousand strong. Sima Zhao, the puppet emperor in tow, encircles the city and waits. When it falls and Zhuge Dan dies, the last of the three Huainan rebellions is spent — and the power of the Sima can no longer be checked.",
    descriptionZh:
      "諸葛誕據壽春反司馬昭,連結東吳,眾十餘萬。司馬昭挾天子親征,圍而不攻,曠日持久。城破,誕死,部曲數百人皆不降而戮,呼曰「為諸葛公死,不恨!」淮南三叛至此皆平,司馬氏之勢,遂不可制。",
    effects: [
      { kind: 'city-loyalty', cityId: 'shouchun', delta: -12 },
      { kind: 'mandate-ruler', rulerOfficerId: 'liu-shan', delta: 3 },
      { kind: 'flag', key: 'zhuge-dan-revolt' },
    ],
  },
  {
    id: 'evt-tazhong-farming',
    name: { en: 'Jiang Wei Retreats to Farm at Tazhong', zh: '沓中屯田避禍' },
    yearMin: 262,
    yearMax: 262,
    requires: [{ kind: 'officer-active', officerId: 'jiang-wei' }],
    description:
      "His campaigns fruitless and the eunuch Huang Hao scheming to unseat him, Jiang Wei dares not return to Chengdu. He begs leave to farm soldiers at Tazhong, keeping his army far from the capital. Lord and general are estranged, the frontier held while the heartland lies empty — the omens of a falling state.",
    descriptionZh:
      "姜維北伐無功,宦官黃皓弄權,陰欲廢維。維懼禍,求屯田沓中以避之,擁兵在外,不敢還成都。蜀漢君臣離心,將帥屯於邊陲,國都空虛,亡國之兆,至此已昭然。次年,鄧艾鍾會兩路伐蜀。",
    effects: [
      { kind: 'mandate-ruler', rulerOfficerId: 'liu-shan', delta: -3 },
      { kind: 'officer-loyalty', officerId: 'jiang-wei', delta: -4 },
      { kind: 'flag', key: 'tazhong-farming' },
    ],
  },

  // ─────────── Special officer events ───────────────────────────────
  {
    id: 'evt-diaochan-intrigue',
    name: { en: "Diaochan's Snare", zh: '貂蟬連環計之計' },
    yearMin: 191,
    yearMax: 192,
    requires: [
      { kind: 'officer-active', officerId: 'wang-yun' },
      { kind: 'officer-active', officerId: 'diaochan' },
      { kind: 'officer-active', officerId: 'lu-bu' },
    ],
    description:
      'Wang Yun sets the perfect trap. Promising the maiden Diaochan to both Dong Zhuo and his ward Lü Bu, he weaves the Chain Stratagem — and the bond between tyrant and warrior cracks under it.',
    descriptionZh: "王允設下絕妙連環之計。以貂蟬一人許董卓與義子呂布,離間翁婿之情,父子之義就此分崩。",
    effects: [
      { kind: 'officer-loyalty', officerId: 'lu-bu', delta: -30 },
      { kind: 'flag', key: 'chain-stratagem' },
    ],
  },
  {
    id: 'evt-lu-bu-betrayal',
    name: { en: "Lü Bu's Betrayal", zh: '呂布之裏切' },
    yearMin: 191,
    yearMax: 193,
    requires: [
      { kind: 'force-alive', forceId: 'force-dong-zhuo' },
      { kind: 'officer-active', officerId: 'lu-bu' },
      { kind: 'flag-set', key: 'chain-stratagem' },
    ],
    description:
      'In the throne hall of Mei, the Flying General puts his halberd through Dong Zhuo. The tyrant\'s blood spills, the court erupts, and Lü Bu flees east — a kingmaker now adrift.',
    descriptionZh: "於郿塢宮殿之中,飛將呂布一戟刺穿董卓。暴君血濺朝堂,朝廷大亂,呂布東竄,自此成為飄搖之梟雄。",
    effects: [
      { kind: 'officer-status', officerId: 'dong-zhuo', status: 'dead' },
      { kind: 'flag', key: 'dong-zhuo-killed-by-lubu' },
    ],
  },
  {
    id: 'evt-cao-pi-seven-step-poem',
    name: { en: 'Seven Steps to Spare a Brother', zh: '七歩詩' },
    yearMin: 220,
    yearMax: 221,
    requires: [
      { kind: 'officer-active', officerId: 'cao-pi' },
      { kind: 'officer-active', officerId: 'cao-zhi' },
    ],
    description:
      'Cao Pi orders his brother Cao Zhi to compose a poem within seven paces or die. Cao Zhi answers: "Beans burn in the fire / boiled by their own stalks / both grew from one root — / why must we devour each other?" The poet lives.',
    descriptionZh: "曹丕命弟曹植七步成詩,否則處死。曹植應聲吟道:「煮豆燃豆萁,豆在釜中泣;本是同根生,相煎何太急?」詩人因詩得活。",
    effects: [
      { kind: 'officer-loyalty', officerId: 'cao-zhi', delta: -30 },
      { kind: 'flag', key: 'seven-step-poem' },
    ],
  },
  {
    id: 'evt-liu-bei-mourns-guan-yu',
    name: { en: 'Liu Bei Mourns Guan Yu', zh: '劉備，關羽，哭' },
    yearMin: 220,
    yearMax: 221,
    requires: [
      { kind: 'officer-active', officerId: 'liu-bei' },
      { kind: 'officer-alive', officerId: 'guan-yu' },
    ],
    description:
      'Word reaches Chengdu of the death at Maicheng. Liu Bei collapses; for days he cannot speak. A vow against Wu hardens in his grief — and behind him, Zhuge Liang sees the path ahead darken.',
    descriptionZh: "麥城噩耗傳至成都,劉備悲痛欲絕,數日不能言語。哀慟之中,伐吳之志已然堅定,而諸葛亮見之,知前路愈黑。",
    effects: [
      { kind: 'officer-loyalty', officerId: 'liu-bei', delta: -15 },
      { kind: 'flag', key: 'mourning-guan-yu' },
    ],
  },
  {
    id: 'evt-zhang-fei-murdered',
    name: { en: 'Zhang Fei Murdered in His Tent', zh: '張飛，帳中死' },
    yearMin: 221,
    yearMax: 221,
    requires: [
      { kind: 'officer-active', officerId: 'zhang-fei' },
      { kind: 'flag-set', key: 'mourning-guan-yu' },
    ],
    description:
      'Drunken with grief and rage, Zhang Fei beats his own officers Fan Qiang and Zhang Da. They slip into his tent at night and take his head to Wu. The Three Brothers are no more.',
    descriptionZh: "張飛因悲憤交加,鞭撻部將范彊、張達。二人於夜中潛入帳中,取其首級獻於東吳。桃園三兄弟,自此盡散。",
    effects: [
      { kind: 'officer-status', officerId: 'zhang-fei', status: 'dead' },
    ],
  },
  {
    id: 'evt-yi-zhi-promotion',
    name: { en: 'Sima Yi Rises in Wei', zh: '司馬懿，台閣登' },
    yearMin: 226,
    yearMax: 228,
    requires: [
      { kind: 'officer-active', officerId: 'sima-yi' },
      { kind: 'force-alive', forceId: 'force-cao-cao' },
    ],
    description:
      'With Cao Pi gone, the new emperor Cao Rui needs hands. Sima Yi steps forward — quiet, capable, watchful. Wei does not yet know it is feeding the dragon that will swallow it.',
    descriptionZh: "曹丕既歿,新帝曹叡需人輔政。司馬懿挺身而出——沉穩、有能、深藏不露。魏室尚不知,自己餵養的正是吞噬己身的真龍。",
    effects: [
      { kind: 'officer-loyalty', officerId: 'sima-yi', delta: 10 },
      { kind: 'flag', key: 'sima-yi-rising' },
    ],
  },
  {
    id: 'evt-meng-huo-seven-captures',
    name: { en: 'Seven Captures of Meng Huo', zh: '七擒孟獲' },
    yearMin: 225,
    yearMax: 225,
    requires: [
      { kind: 'force-alive', forceId: 'force-liu-bei' },
      { kind: 'officer-active', officerId: 'zhuge-liang' },
    ],
    description:
      'Zhuge Liang campaigns into the south. Seven times he captures the Nanman king Meng Huo; seven times he releases him. On the seventh, Meng Huo kneels, and the south is pacified — not by sword but by sincerity.',
    descriptionZh: "諸葛亮南征蠻地。七擒南蠻王孟獲,七縱之。至第七次,孟獲心服跪降,南方終得平定——非以兵刃,而以誠心。",
    effects: [
      { kind: 'force-troops-multiplier', forceId: 'force-liu-bei', multiplier: 1.05 },
      { kind: 'flag', key: 'nanman-pacified' },
    ],
  },
  {
    id: 'evt-empty-fort-stratagem',
    name: { en: 'The Empty Fort Stratagem', zh: '空城之計' },
    yearMin: 228,
    yearMax: 230,
    requires: [
      { kind: 'officer-active', officerId: 'zhuge-liang' },
      { kind: 'officer-active', officerId: 'sima-yi' },
    ],
    description:
      'Outflanked at Xicheng with no army to defend, Zhuge Liang throws open the gates, sweeps the courtyard, and plays the qin atop the wall. Sima Yi sees the trap that isn\'t there, and turns his fifteen-thousand back. The Sleeping Dragon wakes another day.',
    descriptionZh: "諸葛亮於西城被司馬懿大軍合圍,身無守兵,遂大開城門,焚香掃地,坐於城頭撫琴。司馬懿疑有伏兵,引十五萬大軍而退。臥龍又得一日。",
    effects: [
      { kind: 'officer-loyalty', officerId: 'zhuge-liang', delta: 10 },
      { kind: 'flag', key: 'empty-fort-stratagem' },
    ],
  },
  {
    id: 'evt-zhou-yu-laments',
    name: { en: '"Why Did Heaven Make Liang?"', zh: '既生瑜何生亮' },
    yearMin: 210,
    yearMax: 210,
    requires: [
      { kind: 'officer-active', officerId: 'zhou-yu' },
      { kind: 'officer-active', officerId: 'zhuge-liang' },
    ],
    description:
      'Outwitted one last time by his rival, Zhou Yu coughs blood and dies at Baqiu, crying to heaven: "Since you sent Yu into the world, why also Liang?" Wu loses its great architect.',
    descriptionZh: "周瑜屢敗於諸葛亮之手,終於巴丘吐血而亡,仰天長嘆:「既生瑜,何生亮!」東吳痛失大都督。",
    effects: [
      { kind: 'officer-status', officerId: 'zhou-yu', status: 'dead' },
    ],
  },
  {
    id: 'evt-zhao-yun-changban',
    name: { en: 'Zhao Yun at Changban', zh: '長坂之趙雲' },
    yearMin: 208,
    yearMax: 208,
    requires: [
      { kind: 'officer-active', officerId: 'zhao-yun' },
      { kind: 'officer-active', officerId: 'liu-bei' },
    ],
    description:
      'Through the Cao army at Changban, Zhao Yun rides alone — once, twice, seven times, slaying fifty-one named commanders to bring Liu Bei\'s infant son out alive. The cape over his shoulder bears the boy emperor of tomorrow.',
    descriptionZh: "長坂坡上,趙雲單槍匹馬七進七出曹軍,斬將五十一員,終於將劉備幼子救出。其懷中所抱,乃日後之幼帝。",
    effects: [
      { kind: 'officer-loyalty', officerId: 'zhao-yun', delta: 15 },
    ],
  },

  // ─── Phase 35: officer-specific iconic events ──────────────
  {
    id: 'evt-lu-bu-halberd-shot',
    name: { en: 'Lü Bu Shoots the Halberd', zh: '轅門射戟' },
    yearMin: 195,
    yearMax: 197,
    requires: [
      { kind: 'officer-active', officerId: 'lu-bu' },
      { kind: 'officer-active', officerId: 'liu-bei' },
      { kind: 'officer-active', officerId: 'ji-ling' },
    ],
    description:
      'To stop a war between Liu Bei and Yuan Shu, Lü Bu plants his halberd 150 paces out and declares: "If I split the side blade, lay down arms." His arrow finds the mark. Both armies stand down.',
    descriptionZh: "為止劉備與袁術之兵戈,呂布於轅門外一百五十步豎戟,聲言:「若射中小枝,雙方罷兵。」一箭中的。兩軍皆退。",
    effects: [
      { kind: 'officer-loyalty', officerId: 'lu-bu', delta: 10 },
    ],
  },
  /* ─── 千里走單騎鏈(2026-07 補鏈)─────────────────────────────────
     evt-guan-yu-five-passes has required `guan-yu-with-cao` since it was
     written, but NOTHING ever set that flag — the ride never fired. 土山約三事
     now opens the chain (and joins Guan Yu to Cao), 白馬斬顏良 sits between
     (array order = same-season priority), and five-passes finally returns
     him to Liu Bei. */
  {
    id: 'evt-tushan-terms',
    name: { en: 'Three Terms on Earthen Hill', zh: '土山約三事' },
    yearMin: 199,
    yearMax: 200,
    requires: [
      { kind: 'officer-active', officerId: 'guan-yu' },
      { kind: 'officer-active', officerId: 'liu-bei' },
      { kind: 'officer-alive', officerId: 'cao-cao' },
      { kind: 'city-owner-ruler', cityId: 'xiapi', rulerOfficerId: 'cao-cao' },
    ],
    description:
      'Xuzhou has fallen and Liu Bei has fled north; Guan Yu stands ringed on an earthen hill with the brothers\' families in the city below. Zhang Liao climbs up alone with an offer. Guan Yu names three terms: he surrenders to the Han, not to Cao; the ladies are kept safe; and the day he learns where his brother is, he leaves. Accept such a surrender?',
    descriptionZh: '徐州已破,劉備北奔,關羽被圍土山,二嫂陷於城中。張遼單騎上山來說。關羽約三事:降漢不降曹;禮待二嫂;但知皇叔去向,雖遠必往。——納此降乎?',
    effects: [],
    chooserRulerId: 'cao-cao',
    mood: 'martial',
    choices: [
      {
        id: 'accept',
        label: { zh: '雲長義士,吾深敬之——許之', en: 'Such honor deserves honor — accept' },
        effects: [
          { kind: 'officer-join-ruler', officerId: 'guan-yu', rulerOfficerId: 'cao-cao' },
          { kind: 'mandate-ruler', rulerOfficerId: 'cao-cao', delta: 1 },
          { kind: 'flag', key: 'guan-yu-with-cao' },
        ],
      },
      {
        id: 'refuse',
        label: { zh: '不從則圍而攻之,以絕後患', en: 'Refuse — storm the hill' },
        effects: [
          { kind: 'officer-status', officerId: 'guan-yu', status: 'dead' },
          { kind: 'mandate-ruler', rulerOfficerId: 'cao-cao', delta: -3 },
          { kind: 'flag', key: 'tushan-stormed' },
        ],
      },
    ],
  },
  {
    id: 'evt-baima-yanliang',
    name: { en: 'Yan Liang Falls at White Horse', zh: '白馬斬顏良' },
    yearMin: 200,
    yearMax: 201,
    requires: [
      { kind: 'flag-set', key: 'guan-yu-with-cao' },
      { kind: 'officer-active', officerId: 'guan-yu' },
      { kind: 'officer-alive', officerId: 'yan-liang' },
      { kind: 'officer-alive', officerId: 'yuan-shao' },
    ],
    description:
      'Yuan Shao\'s vanguard under Yan Liang crushes everything before it at White Horse. Guan Yu, repaying Cao Cao\'s courtesy, sights the general\'s standard from the ridge, rides down alone through ten thousand men, and takes Yan Liang\'s head in one pass. Wen Chou comes for revenge and follows him. Two of Hebei\'s pillars, gone in days.',
    descriptionZh: '袁紹遣顏良攻白馬,鋒不可當。關羽為報曹公之恩,於萬軍之中望見其麾蓋,匹馬單刀,斬顏良首級而還。文醜引軍來報仇,亦歿於刀下。河北雙柱,旬日俱折。',
    effects: [
      { kind: 'officer-status', officerId: 'yan-liang', status: 'dead' },
      { kind: 'officer-status', officerId: 'wen-chou', status: 'dead' },
      { kind: 'officer-loyalty', officerId: 'guan-yu', delta: 5 },
      { kind: 'mandate-ruler', rulerOfficerId: 'cao-cao', delta: 2 },
      { kind: 'mandate-ruler', rulerOfficerId: 'yuan-shao', delta: -2 },
      { kind: 'flag', key: 'baima-yanliang' },
    ],
    mood: 'martial',
  },
  {
    id: 'evt-guan-yu-five-passes',
    name: { en: "Past Five Passes, Six Generals", zh: '過五關斬六将' },
    yearMin: 200,
    yearMax: 201,
    requires: [
      { kind: 'officer-active', officerId: 'guan-yu' },
      { kind: 'officer-active', officerId: 'liu-bei' },
      { kind: 'flag-set', key: 'guan-yu-with-cao' },
    ],
    description:
      'Learning his brother lives, Guan Yu rides a thousand li to rejoin him. Five passes bar his way; six famed Wei commanders try to stop him. The Green Dragon Blade rises six times, and the road opens.',
    descriptionZh: "得知兄長尚在,關羽千里走單騎以歸劉備。五關阻路,六將攔截。青龍偃月刀六起六落,前路豁然。",
    effects: [
      { kind: 'officer-join-ruler', officerId: 'guan-yu', rulerOfficerId: 'liu-bei' },
      { kind: 'officer-loyalty', officerId: 'guan-yu', delta: 20 },
      { kind: 'flag', key: 'guan-yu-returned' },
    ],
  },
  {
    id: 'evt-zhang-fei-drunk',
    name: { en: 'Zhang Fei Loses Xuzhou', zh: '張飛，徐州，失' },
    yearMin: 196,
    yearMax: 197,
    season: 'autumn',
    requires: [
      { kind: 'officer-active', officerId: 'zhang-fei' },
      { kind: 'officer-active', officerId: 'lu-bu' },
    ],
    description:
      'Liu Bei leaves Zhang Fei in charge of Xiapi and goes to fight Yuan Shu. Zhang Fei drinks. He beats Cao Bao the night before. Cao Bao opens the city gates to Lü Bu. Xuzhou falls in a single night.',
    descriptionZh: "劉備留張飛守下邳,自率軍攻袁術。張飛縱酒,夜前鞭撻曹豹。曹豹遂開城門納呂布。徐州一夜易主。",
    effects: [
      { kind: 'officer-loyalty', officerId: 'zhang-fei', delta: -15 },
      { kind: 'city-loyalty', cityId: 'xiapi', delta: -30 },
    ],
  },
  {
    id: 'evt-cao-cao-wancheng',
    name: { en: 'Disaster at Wancheng', zh: '宛城之変' },
    yearMin: 197,
    yearMax: 197,
    requires: [
      { kind: 'officer-active', officerId: 'cao-cao' },
      { kind: 'officer-active', officerId: 'dian-wei' },
    ],
    description:
      'Cao Cao takes Zhang Xiu\'s aunt to his bed. Zhang Xiu, humiliated, mutinies in the night. Dian Wei dies guarding the gate so his lord may escape. Cao Ang, the eldest son, dies giving his father a horse. Cao Cao loses more at Wancheng than at any battle.',
    descriptionZh: "曹操納張繡之嬸為妾。張繡蒙羞,夜間倒戈反曹。典韋死守轅門以保主公脫險,長子曹昂讓馬殉父。宛城一役,曹操所失,勝於任何敗仗。",
    effects: [
      { kind: 'officer-status', officerId: 'dian-wei', status: 'dead' },
      { kind: 'officer-status', officerId: 'cao-ang', status: 'dead' },
      { kind: 'officer-loyalty', officerId: 'cao-cao', delta: -10 },
    ],
  },
  {
    id: 'evt-zhuge-borrows-wind',
    name: { en: 'Borrowing the East Wind', zh: '借東風' },
    yearMin: 208,
    yearMax: 209,
    season: 'winter',
    requires: [
      { kind: 'officer-active', officerId: 'zhuge-liang' },
      { kind: 'officer-active', officerId: 'zhou-yu' },
    ],
    description:
      'Atop the Seven-Star Altar at Nanping Hill, Zhuge Liang prays for three days and three nights. On the third the south-east wind rises against all season. Zhou Yu\'s fire ships scream into the chained fleet at Red Cliffs.',
    descriptionZh: "諸葛亮於南屏山七星壇祈禱三日三夜。第三日,逆季而起的東南風大作。周瑜的火船向赤壁連環艦隊呼嘯而去。",
    effects: [
      // 東南風大作,火船焚連環艦 —— 曹軍水寨大損,江東天命高漲
      { kind: 'force-troops-multiplier-ruler', rulerOfficerId: 'cao-cao', multiplier: 0.88 },
      { kind: 'mandate-ruler', rulerOfficerId: 'sun-quan', delta: 6 },
      { kind: 'flag', key: 'east-wind-borrowed' },
    ],
  },
  {
    id: 'evt-guan-yu-flooded-armies',
    name: { en: 'Flooding the Seven Armies', zh: '水淹七軍' },
    yearMin: 219,
    yearMax: 219,
    season: 'autumn',
    requires: [
      { kind: 'officer-active', officerId: 'guan-yu' },
      { kind: 'officer-active', officerId: 'yu-jin' },
    ],
    description:
      'The Han river runs high. Guan Yu dams it upstream until Yu Jin\'s seven encamped armies drown in the night. Pang De refuses to surrender and is beheaded. Yu Jin bends the knee. All China shakes at Guan Yu\'s name.',
    descriptionZh: "漢水暴漲。關羽於上游築壩攔截,一夜水淹于禁七軍。龐德寧死不降,被斬;于禁屈膝請降。關羽威震華夏。",
    effects: [
      { kind: 'officer-status', officerId: 'yu-jin', status: 'imprisoned' },
      { kind: 'officer-status', officerId: 'pang-de', status: 'dead' },
      { kind: 'flag', key: 'fan-castle-flooded' },
    ],
  },

  // ─── Late Three Kingdoms era (235-280) ──────────────────────────
  {
    id: 'evt-gongsun-yuan-rebels',
    name: { en: 'Gongsun Yuan Declares Independence', zh: '公孫淵稱燕王' },
    yearMin: 237,
    yearMax: 238,
    description:
      'In far Liaodong, Gongsun Yuan throws off Wei suzerainty and proclaims himself King of Yan. Sima Yi marches north — within a year the rebel head will adorn the city gates.',
    descriptionZh: "遼東遠地,公孫淵棄魏自立,稱燕王。司馬懿揮師北上,不出一年,叛賊首級懸於城門。",
    effects: [
      { kind: 'spawn-rebel-force', cityId: 'liaodong', troops: 30_000, label: { en: 'Yan (Gongsun)', zh: '燕（公孫）' } },
    ],
  },
  {
    id: 'evt-sima-yi-coup',
    name: { en: 'Sima Yi Strikes at Gaoping Tombs', zh: '高平陵之變' },
    yearMin: 249,
    yearMax: 249,
    season: 'spring',
    requires: [
      { kind: 'officer-active', officerId: 'sima-yi' },
      { kind: 'flag-unset', key: 'gaopingling-chain-started' }, // superseded by the §8.1 choice chain
    ],
    description:
      'When Cao Shuang escorts the young emperor to sacrifice at the Gaoping tombs, Sima Yi seizes the capital, executes the Cao clan regents, and takes the reins of Wei. The Cao house survives in name only.',
    descriptionZh: "曹爽護幼帝至高平陵祭祀之際,司馬懿乘機奪取都城,誅曹氏輔政諸臣,執掌魏室大權。曹家自此名存實亡。",
    effects: [
      { kind: 'flag', key: 'sima-coup-249' },
    ],
  },
  {
    id: 'evt-shu-jiang-wei-northern-campaigns',
    name: { en: 'Jiang Wei\'s Northern Expeditions', zh: '姜維北伐' },
    yearMin: 247,
    yearMax: 256,
    requires: [
      { kind: 'officer-active', officerId: 'jiang-wei' },
    ],
    description:
      'Inheriting Zhuge Liang\'s sword, Jiang Wei launches campaign after campaign against Wei — eleven in all. Shu\'s coffers strain; the north holds firm. A new generation of Wei commanders (Deng Ai, Chen Tai) rise to meet him.',
    descriptionZh: "姜維承諸葛亮遺志,屢屢出兵北伐——前後共十一次。蜀漢國庫漸虛,北方堅守如山。鄧艾、陳泰等魏國新一代名將,亦因此而起。",
    effects: [
      { kind: 'force-troops-multiplier', forceId: 'force-shu', multiplier: 0.92 },
      { kind: 'force-gold', forceId: 'force-shu', delta: -3000 },
    ],
  },
  {
    id: 'evt-shu-jiang-wei-tielong',
    name: { en: 'Battle of Tielong Mountain', zh: '鐵籠山之戰' },
    yearMin: 254,
    yearMax: 254,
    requires: [
      { kind: 'officer-active', officerId: 'jiang-wei' },
    ],
    description:
      'Jiang Wei traps a Wei force at Tielong Mountain, but Chen Tai\'s relief column reverses the siege overnight. The Shu general slips away with bloodied honor.',
    descriptionZh: "姜維於鐵籠山困住魏軍,然陳泰援軍一夜反包,圍勢倒轉。蜀將含恨脫身而去。",
    effects: [
      { kind: 'flag', key: 'tielong-fought' },
    ],
  },
  {
    id: 'evt-huainan-three-rebellions',
    name: { en: 'Three Rebellions of Huainan', zh: '淮南三叛' },
    yearMin: 251,
    yearMax: 258,
    description:
      'In Shouchun, Wang Ling, then Guanqiu Jian, then Zhuge Dan rise in turn against the Sima clan. Each rebellion ends in slaughter; the Sima grip on Wei tightens with every uprising.',
    descriptionZh: "壽春之地,王凌、毋丘儉、諸葛誕先後舉兵反司馬。三叛皆以屠戮告終,司馬氏對魏的掌控,每經一叛便愈發牢固。",
    effects: [
      { kind: 'city-loyalty', cityId: 'shouchun', delta: -30 },
      { kind: 'flag', key: 'huainan-rebellions' },
    ],
  },
  {
    id: 'evt-sun-quan-dies',
    name: { en: 'Sun Quan Passes', zh: '吳大帝崩' },
    yearMin: 252,
    yearMax: 252,
    season: 'spring',
    requires: [
      { kind: 'officer-active', officerId: 'sun-quan' },
    ],
    description:
      'At seventy, the last of the founding three sovereigns lies dying in Jianye. He names his young son heir; regents quarrel before the body cools. Wu enters a long decline.',
    descriptionZh: "孫權年屆七十,於建業病榻彌留。立幼子為嗣,屍骨未寒,輔政諸臣已起爭執。吳國自此走向漫長衰落。",
    effects: [
      { kind: 'officer-status', officerId: 'sun-quan', status: 'dead' },
      { kind: 'force-troops-multiplier', forceId: 'force-wu', multiplier: 0.90 },
      { kind: 'flag', key: 'sun-quan-gone' },
    ],
  },
  {
    id: 'evt-shu-falls-deng-ai',
    name: { en: 'Deng Ai\'s March Through Yinping', zh: '鄧艾偷渡陰平' },
    yearMin: 263,
    yearMax: 263,
    season: 'autumn',
    requires: [
      { kind: 'officer-active', officerId: 'liu-shan' },
    ],
    description:
      'Deng Ai leads his soldiers down sheer cliffs through the Yinping wilds, descending behind Shu\'s defenses. At Mianzhu, Zhuge Zhan — son of the Sleeping Dragon — dies fighting. Liu Shan tied himself in surrender ropes and rides out to meet the Wei general. Shu Han is no more.',
    descriptionZh: "鄧艾率軍越陰平之絕壁險道,奇兵直插蜀漢腹地。綿竹之戰,臥龍之子諸葛瞻力戰殉國。劉禪自縛出降。蜀漢自此滅亡。",
    effects: [
      { kind: 'officer-status', officerId: 'zhuge-zhan', status: 'dead' },
      { kind: 'force-troops-multiplier', forceId: 'force-shu', multiplier: 0.0 },
      { kind: 'flag', key: 'shu-fallen-263' },
    ],
  },
  {
    id: 'evt-zhong-hui-rebellion',
    name: { en: 'Zhong Hui\'s Rebellion in Chengdu', zh: '鍾會之亂' },
    yearMin: 264,
    yearMax: 264,
    requires: [
      { kind: 'flag-set', key: 'shu-fallen-263' },
    ],
    description:
      'Drunk on victory, Zhong Hui plots with the captive Jiang Wei to seize Yi province. Their conspiracy is uncovered; both die in the chaos along with Deng Ai. Sima Zhao consolidates the spoils.',
    descriptionZh: "鍾會醉於勝果,與降將姜維密謀據益州自立。事敗,二人連同鄧艾皆死於亂中。司馬昭盡收其功。",
    effects: [
      { kind: 'officer-status', officerId: 'jiang-wei', status: 'dead' },
      { kind: 'flag', key: 'zhong-hui-rebellion' },
    ],
  },
  {
    id: 'evt-jin-replaces-wei',
    name: { en: 'Sima Yan Founds Jin', zh: '司馬炎代魏' },
    yearMin: 265,
    yearMax: 266,
    requires: [
      { kind: 'flag-set', key: 'sima-coup-249' },
    ],
    description:
      'Following the Wei ritual of "yielding the throne," Sima Yan accepts Cao Huan\'s abdication. The new Jin dynasty rises on the same foundations Cao Pi laid forty-five years before. The wheel turns.',
    descriptionZh: "依魏代漢之故事,司馬炎受曹奐禪讓,登基稱帝。新晉王朝建於四十五年前曹丕所立之基礎上。歷史的車輪,周而復始。",
    effects: [
      { kind: 'flag', key: 'jin-founded-266' },
    ],
  },
  {
    id: 'evt-jin-conquers-wu',
    name: { en: 'Wang Jun Sails Down the Yangtze', zh: '王濬樓船下益州' },
    yearMin: 280,
    yearMax: 280,
    season: 'spring',
    requires: [
      { kind: 'flag-set', key: 'jin-founded-266' },
    ],
    description:
      'Wang Jun\'s great war-junks burn the iron chains across the Yangtze gorges and sweep east. Wu\'s last emperor Sun Hao surrenders at Jianye. After ninety-six years of division, the Han realm is whole again — under Jin.',
    descriptionZh: "王濬樓船順流而下,焚斷長江鐵索,東進如風。吳末帝孫皓於建業歸降。歷九十六年分裂,漢家天下重歸一統——在晉旗之下。",
    effects: [
      { kind: 'force-troops-multiplier', forceId: 'force-wu', multiplier: 0.0 },
      { kind: 'flag', key: 'wu-fallen-280' },
      { kind: 'flag', key: 'china-reunified' },
    ],
  },

  // ── Added iconic early-period events ──
  {
    id: 'evt-peach-garden-oath',
    name: { en: 'The Peach Garden Oath', zh: '桃園結義' },
    yearMin: 184,
    yearMax: 185,
    requires: [{ kind: 'officer-active', officerId: 'liu-bei' }],
    description:
      'In a blossoming peach garden, Liu Bei, Guan Yu and Zhang Fei swear to be brothers — "not born on the same day, but to die on the same day." The bond that will found a kingdom is sealed.',
    descriptionZh: "桃花盛開之園中,劉備、關羽、張飛結為兄弟——「不求同年同月同日生,但求同年同月同日死」。立國之義,自此而始。",
    effects: [
      { kind: 'officer-loyalty', officerId: 'guan-yu', delta: 15 },
      { kind: 'officer-loyalty', officerId: 'zhang-fei', delta: 15 },
      { kind: 'flag', key: 'peach-garden-oath' },
    ],
  },
  {
    id: 'evt-heroes-over-wine',
    name: { en: 'Heroes Discussed Over Warm Wine', zh: '煮酒論英雄' },
    yearMin: 199,
    yearMax: 200,
    requires: [
      { kind: 'officer-active', officerId: 'cao-cao' },
      { kind: 'officer-active', officerId: 'liu-bei' },
    ],
    description:
      'Cao Cao, sharing warm wine with Liu Bei, declares: "The only heroes of this age are you and I." Liu Bei, startled, drops his chopsticks as thunder cracks — and masks his ambition a while longer.',
    descriptionZh: "曹操與劉備青梅煮酒,曰:「今天下英雄,唯使君與操耳。」劉備驚而失箸,賴雷聲掩飾,韜光養晦又得些時日。",
    effects: [
      // 「天下英雄,唯使君與操耳」—— 曹操親口認證的英雄,天命暗長
      { kind: 'mandate-ruler', rulerOfficerId: 'liu-bei', delta: 5 },
      { kind: 'flag', key: 'heroes-over-wine' },
    ],
  },
  {
    id: 'evt-bowang-slope-fire',
    name: { en: 'Fire at Bowang Slope', zh: '火燒博望坡' },
    yearMin: 207,
    yearMax: 209,
    requires: [{ kind: 'officer-active', officerId: 'zhuge-liang' }],
    description:
      'In his first command, Zhuge Liang lures Xiahou Dun\'s army into the narrow defile at Bowang and sets the brush ablaze. The doubters among Liu Bei\'s generals fall silent.',
    descriptionZh: "諸葛亮初掌兵權,誘夏侯惇之軍入博望狹道,縱火焚之。劉備帳下原本不服的諸將,自此噤聲。",
    effects: [
      // 諸葛初掌兵權,誘夏侯惇入狹道縱火 —— 曹軍受挫,帳下不服諸將自此噤聲
      { kind: 'force-troops-multiplier-ruler', rulerOfficerId: 'cao-cao', multiplier: 0.92 },
      { kind: 'officer-loyalty', officerId: 'zhuge-liang', delta: 10 },
      { kind: 'flag', key: 'bowang-fire' },
    ],
  },
  // ─────────── 名場面補遺(2026-07):填補侦查發現的叙事空洞 ───────────
  {
    id: 'evt-shangfangyu-rain',
    name: { en: 'Heaven Sends Rain at Shangfang Valley', zh: '上方谷天火' },
    yearMin: 234,
    yearMax: 234,
    season: 'summer',
    requires: [
      { kind: 'officer-active', officerId: 'zhuge-liang' },
      { kind: 'officer-active', officerId: 'sima-yi' },
    ],
    description:
      'Zhuge Liang lures Sima Yi and his sons into Shangfang Valley and looses fire from every slope. Sima Yi clasps his sons and weeps, certain of death — when a sudden downpour drowns the flames and lets the Wei men escape. Kongming sighs: "Man may plan, but Heaven decides."',
    descriptionZh:
      "諸葛亮誘司馬懿父子入上方谷,火砲地雷齊發,谷中烈焰沖天。司馬懿抱二子相泣,自分必死——忽天降大雨,火盡熄滅,魏軍得脫。孔明登高長嘆:「謀事在人,成事在天。不可強也!」",
    effects: [
      { kind: 'force-troops-multiplier-ruler', rulerOfficerId: 'cao-rui', multiplier: 0.9 },
      { kind: 'mandate-ruler', rulerOfficerId: 'liu-shan', delta: 5 },
      { kind: 'flag', key: 'shangfangyu-rain' },
    ],
  },
  {
    id: 'evt-changban-bridge',
    name: { en: 'Zhang Fei Roars at Changban Bridge', zh: '當陽橋斷喝' },
    yearMin: 208,
    yearMax: 208,
    season: 'autumn',
    requires: [{ kind: 'officer-active', officerId: 'zhang-fei' }],
    description:
      "Alone at Changban Bridge, Zhang Fei rounds his eyes and thunders: 'I am Zhang Yide of Yan! Who dares fight me to the death?' Cao Cao's van recoils; Xiahou Jie tumbles dead from his horse in fright, and the whole army dares not cross.",
    descriptionZh:
      "長坂坡後,張飛獨據當陽橋頭,倒豎虎鬚,環眼圓睜,厲聲大喝:「我乃燕人張翼德也!誰敢與我決一死戰?」聲如巨雷,曹軍為之股慄,夏侯傑驚墜馬下而亡,大軍反卷,不敢近前。",
    effects: [
      { kind: 'force-troops-multiplier-ruler', rulerOfficerId: 'cao-cao', multiplier: 0.95 },
      { kind: 'officer-loyalty', officerId: 'zhang-fei', delta: 8 },
      { kind: 'flag', key: 'changban-bridge' },
    ],
  },
  {
    id: 'evt-eight-arrays',
    name: { en: 'The Stone Sentinel Maze', zh: '八陣圖困陸遜' },
    yearMin: 222,
    yearMax: 223,
    requires: [
      { kind: 'officer-active', officerId: 'zhuge-liang' },
      { kind: 'officer-active', officerId: 'lu-xun' },
    ],
    description:
      "Pursuing the broken army of Shu to Fish-Belly Meadow, Lu Xun stumbles into a maze of piled stones — killing airs rising to heaven — and cannot find his way out. Only Zhuge Liang's father-in-law, leading him through the Gate of Life, sets him free. 'Kongming is truly a sleeping dragon,' Lu Xun sighs, and withdraws.",
    descriptionZh:
      "陸遜火燒連營,追蜀軍至魚腹浦,忽見亂石排列,殺氣沖天,困於八陣圖中,四面無門。賴諸葛亮岳父黃承彥引出生門,方得脫。陸遜嘆曰:「孔明真臥龍也,吾不能及!」遂斂兵而退,不復西進。",
    effects: [
      { kind: 'force-troops-multiplier-ruler', rulerOfficerId: 'sun-quan', multiplier: 0.93 },
      { kind: 'mandate-ruler', rulerOfficerId: 'liu-shan', delta: 4 },
      { kind: 'flag', key: 'eight-arrays' },
    ],
  },
  {
    id: 'evt-panhe-zhaoyun',
    name: { en: 'A Young General at Panhe', zh: '磐河趙雲初陣' },
    yearMin: 191,
    yearMax: 193,
    requires: [
      { kind: 'officer-active', officerId: 'zhao-yun' },
      { kind: 'officer-alive', officerId: 'gongsun-zan' },
    ],
    description:
      "By Panhe Bridge, Gongsun Zan is pressed to the brink by Wen Chou. In the nick a young general gallops out, spears rider after rider, and plucks his lord from the midst of ten thousand — Zhao Zilong of Changshan, entering the age.",
    descriptionZh:
      "磐河橋畔,公孫瓚為河北名將文醜所迫,幾至墜馬。危殆之際,一少年將軍挺槍飛馬而出,於萬軍中連挑數將,救瓚而還——常山趙子龍,自此登場,名動河北。",
    effects: [
      { kind: 'officer-loyalty', officerId: 'zhao-yun', delta: 10 },
      { kind: 'flag', key: 'panhe-zhaoyun' },
    ],
  },
  {
    id: 'evt-ruxu-standoff',
    name: { en: 'Would That I Had a Son Like Sun', zh: '生子當如孫仲謀' },
    yearMin: 213,
    yearMax: 213,
    season: 'spring',
    requires: [
      { kind: 'officer-active', officerId: 'cao-cao' },
      { kind: 'officer-active', officerId: 'sun-quan' },
    ],
    description:
      "After a month\'s standoff at Ruxu, Cao Cao beholds the taut order of Sun Quan\'s ships and ranks and sighs in admiration: 'Would that I had a son like Sun Zhongmou! Liu Biao\'s boys were pigs and dogs beside him.' He gathers his army and turns north.",
    descriptionZh:
      "濡須口相拒月餘,曹操見孫權舟船器仗、軍伍整肅,望之慨然嘆曰:「生子當如孫仲謀!若劉景升兒子,豚犬耳。」遂斂軍北還,不復強攻。",
    effects: [
      { kind: 'mandate-ruler', rulerOfficerId: 'sun-quan', delta: 7 },
      { kind: 'force-troops-multiplier-ruler', rulerOfficerId: 'sun-quan', multiplier: 1.03 },
      { kind: 'flag', key: 'ruxu-standoff' },
    ],
  },
  {
    id: 'evt-chencang-haozhao',
    name: { en: 'Hao Zhao Holds Chencang', zh: '陳倉郝昭拒諸葛' },
    yearMin: 228,
    yearMax: 229,
    requires: [
      { kind: 'officer-active', officerId: 'zhuge-liang' },
      { kind: 'officer-active', officerId: 'hao-zhao' },
    ],
    description:
      "Zhuge Liang besieges Chencang, held by Hao Zhao with barely a thousand men. Scaling ladders, ram-carts and tunnels — every siege art in turn — are met by fire-arrows, millstones and a second inner wall. After twenty-odd days the Shu grain runs out and the army withdraws; Kongming laments how hard a resolute wall is to take.",
    descriptionZh:
      "諸葛亮出散關,以數萬眾圍陳倉,郝昭以千餘人拒守。雲梯、衝車、地道百計並施,郝昭以火箭、石磨、內重牆一一化解。相拒二十餘日,蜀軍糧盡而退。孔明始知堅城之難拔,一夫當關之可畏。",
    effects: [
      { kind: 'force-troops-multiplier-ruler', rulerOfficerId: 'liu-shan', multiplier: 0.95 },
      { kind: 'officer-loyalty', officerId: 'hao-zhao', delta: 12 },
      { kind: 'flag', key: 'chencang-siege' },
    ],
  },
  {
    id: 'evt-xuzhou-massacre',
    name: { en: 'The Sack of Xuzhou', zh: '曹操屠徐州・陶謙三讓' },
    yearMin: 193,
    yearMax: 194,
    requires: [
      { kind: 'officer-active', officerId: 'cao-cao' },
      { kind: 'officer-alive', officerId: 'tao-qian' },
    ],
    description:
      "When his father is killed by Tao Qian\'s officers, Cao Cao raises an army of vengeance; where it passes, the slaughter is such that the Si River ceases to flow. Terrified, Tao Qian thrice offers Xuzhou to Liu Bei. Cao Cao\'s name for cruelty spreads far, and the people of Xuzhou hate him to the bone.",
    descriptionZh:
      "曹嵩為陶謙部將所殺,曹操起兵復仇,所過多所殘戮,坑殺男女數萬於泗水,水為之不流。陶謙惶懼,三讓徐州於劉備。曹操暴虐之名遠播,徐州士民恨之入骨,此仁暴之判,亦天下向背之始。",
    effects: [
      { kind: 'city-loyalty', cityId: 'pengcheng', delta: -15 },
      { kind: 'mandate-ruler', rulerOfficerId: 'cao-cao', delta: -6 },
      { kind: 'flag', key: 'xuzhou-massacre' },
    ],
  },
  // ─────────── 三分建號:魏蜀吳的稱制時刻(2026-07 補) ───────────
  {
    id: 'evt-cao-pi-usurps-han',
    name: { en: 'Cao Pi Accepts the Abdication', zh: '曹丕受禪代漢' },
    yearMin: 220,
    yearMax: 221,
    requires: [{ kind: 'officer-active', officerId: 'cao-pi' }],
    description:
      "Emperor Xian of Han abdicates to Cao Pi, King of Wei. Thrice declining, Cao Pi at last ascends the altar, proclaims the great state of Wei, and names the era Huangchu. Four hundred years of Han come to an end. 'Now I understand,' Cao Pi murmurs, 'the affair of Shun and Yu.'",
    descriptionZh:
      "漢獻帝禪位於魏王曹丕。曹丕三讓而後受之,登壇告天,國號大魏,改元黃初。四百年漢祚,至此而終。曹丕顧謂左右曰:「舜禹之事,吾知之矣。」魏承漢統,天命一新。",
    effects: [
      { kind: 'mandate-ruler', rulerOfficerId: 'cao-pi', delta: 12 },
      { kind: 'flag', key: 'han-abdicated' },
    ],
  },
  {
    id: 'evt-liu-bei-hanzhong-king',
    name: { en: 'King of Hanzhong, and the Five Tiger Generals', zh: '漢中王・五虎封號' },
    yearMin: 219,
    yearMax: 220,
    requires: [{ kind: 'officer-active', officerId: 'liu-bei' }],
    description:
      "Liu Bei takes the title King of Hanzhong upon an altar at Mianyang, and names Guan Yu, Zhang Fei, Zhao Yun, Ma Chao and Huang Zhong his Five Tiger Generals. Hearing he ranks beside Huang Zhong, Guan Yu bristles and refuses the seal — until Fei Shi recalls him to the greater cause. The house of Shu is at its zenith.",
    descriptionZh:
      "劉備進位漢中王,築壇於沔陽,封關羽、張飛、趙雲、馬超、黃忠為五虎上將。關羽初聞與老將黃忠同列,忿而不受印;賴費詩曉以大義,方拜綬。西蜀氣象,於此為盛。",
    effects: [
      { kind: 'mandate-ruler', rulerOfficerId: 'liu-bei', delta: 8 },
      { kind: 'officer-loyalty', officerId: 'guan-yu', delta: 5 },
      { kind: 'officer-loyalty', officerId: 'zhang-fei', delta: 5 },
      { kind: 'officer-loyalty', officerId: 'zhao-yun', delta: 5 },
      { kind: 'officer-loyalty', officerId: 'ma-chao', delta: 5 },
      { kind: 'officer-loyalty', officerId: 'huang-zhong', delta: 5 },
      { kind: 'flag', key: 'hanzhong-king' },
    ],
  },
  {
    id: 'evt-sun-quan-emperor',
    name: { en: 'Sun Quan Proclaims the State of Wu', zh: '孫權稱帝建吳' },
    yearMin: 229,
    yearMax: 229,
    requires: [{ kind: 'officer-active', officerId: 'sun-quan' }],
    description:
      "Sun Quan ascends the imperial throne at Wuchang, proclaims the state of Wu, and names the era Huanglong. He honours his father and brother posthumously and grants a general amnesty. Now Wei, Shu and Wu each have their emperor — the tripartite realm is fixed at last.",
    descriptionZh:
      "孫權即皇帝位於武昌,國號吳,改元黃龍。追尊父兄,大赦天下。至此魏、蜀、吳三帝並立,天下三分之勢,終成定局。江東基業,五十年而成帝統。",
    effects: [
      { kind: 'mandate-ruler', rulerOfficerId: 'sun-quan', delta: 10 },
      { kind: 'flag', key: 'wu-founded' },
    ],
  },
  // ─────────── 經典橋段補遺(2026-07 第二批):演義名場面 ───────────
  {
    id: 'evt-maleap-tanxi',
    name: { en: 'The Leap Across Tan Creek', zh: '馬躍檀溪' },
    yearMin: 201,
    yearMax: 207,
    requires: [
      { kind: 'officer-active', officerId: 'liu-bei' },
      { kind: 'officer-alive', officerId: 'liu-biao' },
    ],
    description:
      "At a banquet in Xiangyang, Cai Mao lays a trap for Liu Bei. Sensing it, Liu Bei rides west alone — Tan Creek before him, pursuers behind. He spurs his horse into the water; Dilu heaves up from the current and clears three zhang in a single bound to the far bank. 'Dilu, today is deadly — do your utmost!'",
    descriptionZh:
      "劉備赴襄陽宴,蔡瑁欲害之。備覺,匹馬西走,前臨檀溪,後有追兵。備縱馬入溪,的盧馬忽從水中湧身而起,一躍三丈,飛上西岸。備回顧追者,嘆曰:「的盧,今日危矣,可努力!」天不亡備,王業之基,竟繫於一馬一躍。",
    effects: [
      { kind: 'mandate-ruler', rulerOfficerId: 'liu-bei', delta: 3 },
      { kind: 'flag', key: 'maleap-tanxi' },
    ],
    mood: 'auspicious',
  },
  {
    id: 'evt-zhang-song-map',
    name: { en: 'Zhang Song Offers the Map of Shu', zh: '張松獻西川地圖' },
    yearMin: 211,
    yearMax: 213,
    requires: [
      { kind: 'officer-active', officerId: 'zhang-song' },
      { kind: 'officer-active', officerId: 'liu-bei' },
    ],
    description:
      "Zhang Song carries a map of Yi province to Xuchang to offer Cao Cao. Cao, put off by his ugliness and stung by his sharp tongue, has him beaten and driven out. Enraged, Zhang Song turns to Jing province, where Liu Bei greets him at the outskirts with every courtesy. Moved, he hands Liu Bei the full geography of the forty-one commanderies of Shu — the groundwork for the taking of Yi.",
    descriptionZh:
      "張松懷西川地圖入許都,欲獻曹操。操見其貌陋而慢之,松又恃才頂撞,遭杖責逐出。松憤而轉道荊州,劉備郊迎三十里,禮敬備至,款留三日。松感其誠,遂獻西川四十一州地理圖本,備言蜀中虛實 —— 劉備取蜀之基,自此而定。",
    effects: [
      { kind: 'mandate-ruler', rulerOfficerId: 'liu-bei', delta: 5 },
      { kind: 'mandate-ruler', rulerOfficerId: 'cao-cao', delta: -3 },
      { kind: 'flag', key: 'zhang-song-map' },
    ],
    mood: 'somber',
  },
  {
    id: 'evt-zhou-yu-dies',
    name: { en: 'Why Did Heaven Make Liang?', zh: '周瑜歸天' },
    yearMin: 210,
    yearMax: 211,
    requires: [{ kind: 'officer-active', officerId: 'zhou-yu' }],
    description:
      "Matched wits with Kongming once too often, Zhou Yu can never quite win. His old arrow-wound splits open and he lies dying at Baqiu. He memorialises to name Lu Su his successor, then cries to heaven: 'Since Heaven made Yu, why also Liang!' — and dies at thirty-six. The south loses its Grand Commander; Sun Quan mourns in white.",
    descriptionZh:
      "周瑜屢與孔明鬥智,終不能勝。舊創迸裂,臥病巴丘。臨終上疏薦魯肅自代,仰天連叫:「既生瑜,何生亮!」數聲而亡,年僅三十六。江東痛失大都督,孫權素服舉哀,親迎其喪。美周郎一去,東吳再無此等文武兼資之帥。",
    effects: [
      { kind: 'officer-status', officerId: 'zhou-yu', status: 'dead' },
      { kind: 'mandate-ruler', rulerOfficerId: 'sun-quan', delta: -3 },
      { kind: 'flag', key: 'zhou-yu-dead' },
    ],
    mood: 'somber',
  },
  {
    id: 'evt-gefa-daishou',
    name: { en: 'Hair for a Head', zh: '割髮代首' },
    yearMin: 198,
    yearMax: 200,
    requires: [{ kind: 'officer-active', officerId: 'cao-cao' }],
    description:
      "Cao Cao orders death for any man whose horse tramples the standing wheat. A startled dove flushes; his own mount bolts into the field and flattens a swathe. He calls the clerk to sentence him. 'The law does not touch the exalted,' says the clerk. 'A law-maker who breaks his own law — how shall he command men?' Cao draws his sword, cuts off his hair in place of his head, and passes it down the ranks. The army goes still with awe.",
    descriptionZh:
      "曹操行軍,下令踐踏麥田者斬。忽田中驚起一鳩,操馬躍入麥中,踏壞一片。操呼主簿議己罪,主簿曰:「法不加於尊。」操曰:「制法而自犯,何以服眾?」乃拔劍割髮,以髮代首,傳示三軍。於是軍中肅然,秋毫無犯 —— 治軍之嚴,亦收攬眾之效。",
    effects: [
      { kind: 'force-troops-multiplier-ruler', rulerOfficerId: 'cao-cao', multiplier: 1.03 },
      { kind: 'mandate-ruler', rulerOfficerId: 'cao-cao', delta: 3 },
      { kind: 'flag', key: 'gefa-daishou' },
    ],
    mood: 'martial',
  },
  {
    id: 'evt-hengshuo-poetry',
    name: { en: 'The Spear-Song at Red Cliffs', zh: '橫槊賦詩' },
    yearMin: 208,
    yearMax: 208,
    season: 'winter',
    requires: [{ kind: 'officer-active', officerId: 'cao-cao' }],
    description:
      "On the eve of Red Cliffs, Cao Cao feasts his officers aboard ship under a bright moon. He takes up his spear at the prow and sings: 'Wine before song — how brief a life... the moon is bright, the stars are few, the crows fly south.' He boasts he will break Wu by morning. When Liu Fu calls the words ill-omened, Cao runs him through in a fury. Pride at its zenith — and in that cup and spear, the seed of ruin already sown.",
    descriptionZh:
      "赤壁對峙,曹操大宴諸將於船上。時值月明,操取槊立於船頭,慷慨而歌:「對酒當歌,人生幾何……月明星稀,烏鵲南飛。」揚言旦夕破吳。揚州刺史劉馥諫其言不吉,操怒,以槊刺殺之。志得意滿之際,敗亡之機,已伏於杯酒橫槊之間。",
    effects: [
      { kind: 'mandate-ruler', rulerOfficerId: 'cao-cao', delta: 3 },
      { kind: 'flag', key: 'hengshuo-poetry' },
    ],
    mood: 'ominous',
  },
  {
    id: 'evt-mumen-zhanghe',
    name: { en: 'The Ambush at Wooden Gate', zh: '木門道射張郃' },
    yearMin: 231,
    yearMax: 231,
    requires: [
      { kind: 'officer-active', officerId: 'zhuge-liang' },
      { kind: 'officer-active', officerId: 'zhang-he' },
    ],
    description:
      "Zhuge Liang withdraws, and Zhang He gives chase. But Kongming has set an ambush at Wooden Gate Road, where two cliffs press close over dense woods. As Zhang He rides in, a clapper sounds and a storm of crossbow bolts falls; he and his officers die in the defile. Wei loses the one general who could still spar with Kongming — and Sima Yi rues that he did not heed Zhang He's counsel.",
    descriptionZh:
      "諸葛亮退軍,張郃率兵急追。亮預設伏於木門道,兩崖夾峙,林木深密。郃追至,一聲梆子響,萬弩齊發,郃與部將皆中箭死於道中,右膝中箭而亡。魏失一員能與孔明周旋之宿將,司馬懿追悔不聽郃「歸師勿追」之諫。",
    effects: [
      { kind: 'officer-status', officerId: 'zhang-he', status: 'dead' },
      { kind: 'force-troops-multiplier-ruler', rulerOfficerId: 'cao-rui', multiplier: 0.96 },
      { kind: 'mandate-ruler', rulerOfficerId: 'liu-shan', delta: 4 },
      { kind: 'flag', key: 'mumen-zhanghe' },
    ],
    mood: 'martial',
  },
  {
    id: 'evt-longshang-harvest',
    name: { en: 'The Gods Reap the Wheat', zh: '隴上裝神割麥' },
    yearMin: 231,
    yearMax: 231,
    season: 'summer',
    requires: [{ kind: 'officer-active', officerId: 'zhuge-liang' }],
    description:
      "Out of Qishan and short of grain, Zhuge Liang plays the god: three teams of men on four-wheeled carts, got up as spirits amid drifting incense, ghostly and unreal. The Wei troops recoil, afraid to close. In the gap Kongming reaps the whole of the Longshang wheat and hauls it back to Lucheng to feed his army. 'These are the spirits of the Six-Jia and Six-Ding!' cries Sima Yi in alarm.",
    descriptionZh:
      "諸葛亮出祁山,缺糧,乃扮天神:分三隊各推四輪車,車上作法之狀,焚香朦朧,如神如鬼。魏軍望之驚疑,不敢近前。亮乘隙盡割隴上小麥,運回滷城,以充軍糧。司馬懿驚曰:「此乃六丁六甲之神也!」奇謀不獨在陣前,亦在敵之疑懼之間。",
    effects: [
      { kind: 'mandate-ruler', rulerOfficerId: 'liu-shan', delta: 3 },
      { kind: 'flag', key: 'longshang-harvest' },
    ],
    mood: 'mystic',
  },

  // ─────────── 武將個人時刻(2026-07):名士與忠勇的專屬名場面 ───────────
  {
    id: 'evt-miheng-drums',
    name: { en: 'Mi Heng Drums Naked Before Cao', zh: '禰衡擊鼓罵曹' },
    yearMin: 196,
    yearMax: 198,
    requires: [
      { kind: 'officer-active', officerId: 'mi-heng' },
      { kind: 'officer-active', officerId: 'cao-cao' },
    ],
    description:
      "Proud and razor-tongued, Mi Heng is summoned as a mere drummer to shame him. At the great assembly he strips bare and drums — the beat grave and defiant — and turns the humiliation back on Cao Cao. Cao dares not kill so famous a scholar; he packs him off to Liu Biao, and thence to Huang Zu, who does the deed. The madness of a famous man is its own scene of the age.",
    descriptionZh:
      "禰衡恃才傲物,曹操召為鼓吏以辱之。衡於大會之上裸身擊鼓,音節悲壯,反辱曹操。操怒而不殺 —— 恐傷天下士望 —— 遣之劉表,復轉黃祖,終為黃祖所殺。名士之狂,亦亂世一景。",
    effects: [
      { kind: 'mandate-ruler', rulerOfficerId: 'cao-cao', delta: -3 },
      { kind: 'flag', key: 'miheng-drums' },
    ],
    mood: 'somber',
  },
  {
    id: 'evt-zhoutai-guard',
    name: { en: 'Zhou Tai, Scarred for His Lord', zh: '周泰九死護主' },
    yearMin: 213,
    yearMax: 217,
    requires: [
      { kind: 'officer-active', officerId: 'zhou-tai' },
      { kind: 'officer-active', officerId: 'sun-quan' },
    ],
    description:
      "Surrounded at Ruxu, Sun Quan is cut off by the Wei host. Again and again Zhou Tai charges back into the ring to haul his lord free, until his skin is a map of scars. Sun Quan grips his arm and weeps, bids him bare his wounds, and for each scar pours a cup of wine — then gives him the blue silk parasol. The army is moved to fury.",
    descriptionZh:
      "濡須之戰,孫權為魏軍所圍。周泰數番殺入重圍,救權而出,身被數十創,膚如刻畫。權執其臂而泣,命脫衣示創,每一創賜一觴酒,又賜以青羅傘蓋。將士感奮,人思效死。",
    effects: [
      { kind: 'officer-loyalty', officerId: 'zhou-tai', delta: 12 },
      { kind: 'mandate-ruler', rulerOfficerId: 'sun-quan', delta: 3 },
      { kind: 'flag', key: 'zhoutai-guard' },
    ],
    mood: 'martial',
  },
  {
    id: 'evt-kongrong-death',
    name: { en: 'The Death of Kong Rong', zh: '孔融滿門受戮' },
    yearMin: 208,
    yearMax: 208,
    requires: [
      { kind: 'officer-active', officerId: 'kong-rong' },
      { kind: 'officer-active', officerId: 'cao-cao' },
    ],
    description:
      "Kong Rong, descendant of Confucius, needles Cao Cao again and again and champions the failing Han. His anger banked high, Cao charges him with 'unfilial conduct' and 'slander of the court,' and puts his whole household to death. The scholar-gentry shudder — and Cao Cao's grip grows only tighter.",
    descriptionZh:
      "孔融孔門之後,屢以言辭譏刺曹操,又力主尊崇漢室。操積怒既久,遂以「不孝」「謗訕朝廷」之罪,收融下獄,滿門處死。融死之日,天下士林寒心;然曹操之威,亦自此愈重 —— 名士之骨,終不敵權臣之刀。",
    effects: [
      { kind: 'mandate-ruler', rulerOfficerId: 'cao-cao', delta: -4 },
      { kind: 'flag', key: 'kongrong-death' },
    ],
    mood: 'ominous',
  },
  {
    id: 'evt-huarong-path',
    name: { en: 'Mercy on the Huarong Path', zh: '華容道義釋曹操' },
    yearMin: 208,
    yearMax: 210,
    season: 'winter',
    requires: [
      { kind: 'officer-active', officerId: 'guan-yu' },
      { kind: 'officer-active', officerId: 'cao-cao' },
    ],
    description:
      'Fleeing the inferno of Red Cliffs, Cao Cao\'s broken army stumbles onto the Huarong path — where Guan Yu waits. Remembering past kindness, Guan Yu lowers his blade and lets the warlord pass, a debt of honour repaid.',
    descriptionZh: "赤壁火後,曹操殘軍敗走華容道,正遇關羽當道。關羽念及昔日之恩,橫刀立馬,放曹操過關——義重如山,舊恩得償。",
    effects: [
      { kind: 'officer-loyalty', officerId: 'guan-yu', delta: 5 },
      { kind: 'flag', key: 'huarong-mercy' },
    ],
  },
  {
    id: 'evt-sun-jian-imperial-seal',
    name: { en: 'The Imperial Seal', zh: '孫堅得玉璽' },
    yearMin: 190,
    yearMax: 191,
    requires: [{ kind: 'officer-active', officerId: 'sun-jian' }],
    description:
      'Amid the ruins of burned Luoyang, Sun Jian\'s men draw a glittering object from a palace well — the Imperial Hereditary Seal of the Han. The Tiger of Jiangdong pockets the mandate of heaven, and with it, a fatal ambition.',
    descriptionZh: "洛陽焚餘之廢墟,孫堅軍自宮中枯井打撈得一璀璨之物——傳國玉璽。江東猛虎私納天命於懷,亦自此種下取禍之心。",
    effects: [
      { kind: 'officer-loyalty', officerId: 'sun-jian', delta: 10 },
      { kind: 'flag', key: 'imperial-seal-found' },
    ],
  },
  {
    id: 'evt-baima-yan-liang',
    name: { en: 'Slaying Yan Liang at Baima', zh: '白馬斬顏良' },
    yearMin: 200,
    yearMax: 200,
    requires: [
      { kind: 'officer-active', officerId: 'guan-yu' },
      { kind: 'officer-alive', officerId: 'yan-liang' },
    ],
    description:
      'At the siege of Baima, Guan Yu charges alone into Yuan Shao\'s host, cuts down the famed general Yan Liang amid ten thousand troops, and rides back with his head — repaying Cao Cao\'s hospitality before departing.',
    descriptionZh: "白馬之圍,關羽單騎衝入袁紹萬軍之中,於亂軍斬名將顏良,提其首級而還——以報曹操款待之恩,然後掛印封金而去。",
    effects: [
      { kind: 'officer-status', officerId: 'yan-liang', status: 'dead' },
      { kind: 'officer-loyalty', officerId: 'guan-yu', delta: 5 },
      { kind: 'flag', key: 'yan-liang-slain' },
    ],
  },
  {
    id: 'evt-liu-bei-tan-stream',
    name: { en: 'The Leap across Tan Stream', zh: '馬躍檀溪' },
    yearMin: 201,
    yearMax: 206,
    requires: [{ kind: 'officer-active', officerId: 'liu-bei' }],
    description:
      'Ambushed at a banquet and run to the water\'s edge, Liu Bei spurs his horse Dilu into the Tan Stream. "Dilu! Today is life or death!" — and the steed clears the torrent in a single bound, carrying him to safety and the hermit Sima Hui beyond.',
    descriptionZh: "席間遇伏,劉備倉皇走至檀溪。但見前無去路,乃策的盧入水,大呼:「的盧!今日妨吾!」——的盧一躍三丈,飛越激流,載主脫險,得遇水鏡先生於溪畔。",
    effects: [
      { kind: 'officer-loyalty', officerId: 'liu-bei', delta: 5 },
      { kind: 'flag', key: 'tan-stream-leap' },
    ],
  },
  {
    id: 'evt-xu-shu-recommends',
    name: { en: 'Xu Shu Recommends the Sleeping Dragon', zh: '徐庶走馬薦諸葛' },
    yearMin: 207,
    yearMax: 207,
    requires: [
      { kind: 'officer-alive', officerId: 'xu-shu' },
      { kind: 'flag-unset', key: 'three-visits-done' },
    ],
    description:
      'Lured to Cao Cao\'s camp by a forged letter holding his mother hostage, Xu Shu departs Liu Bei in grief — but turns his horse back to name the one man greater than himself: Zhuge Liang, the Sleeping Dragon of Longzhong. He vows never to offer Cao a single plan.',
    descriptionZh: "曹操偽書挾其母,徐庶含淚辭別劉備。行至中途,忽勒馬而回,薦一人勝己十倍——隆中臥龍諸葛孔明。庶身在曹營,終身不獻一謀。",
    effects: [
      { kind: 'officer-loyalty', officerId: 'zhuge-liang', delta: 10 },
      { kind: 'flag', key: 'xu-shu-recommendation' },
    ],
  },
  {
    id: 'evt-borrowing-arrows',
    name: { en: 'Borrowing Arrows with Straw Boats', zh: '草船借箭' },
    yearMin: 208,
    yearMax: 209,
    season: 'winter',
    requires: [{ kind: 'officer-active', officerId: 'zhuge-liang' }],
    description:
      'Pressed by Zhou Yu to forge a hundred thousand arrows in three days, Zhuge Liang sends twenty straw-bound boats into the Yangtze fog before dawn, beating drums. Cao Cao\'s archers loose blindly into the mist — and the boats return bristling with arrows beyond count.',
    descriptionZh: "周瑜限諸葛亮三日造箭十萬,亮以草船二十,趁大霧未明擂鼓佯攻。曹營弓弩齊發,亂射於霧中——草船兩面受箭,滿載而歸,得箭無數。",
    effects: [
      { kind: 'officer-loyalty', officerId: 'zhuge-liang', delta: 10 },
      { kind: 'flag', key: 'arrows-borrowed' },
    ],
  },
  {
    id: 'evt-pang-tong-chain-ships',
    name: { en: 'Pang Tong\'s Chained-Ships Ruse', zh: '龐統獻連環計' },
    yearMin: 208,
    yearMax: 209,
    season: 'winter',
    requires: [{ kind: 'officer-alive', officerId: 'pang-tong' }],
    description:
      'Crossing to Cao Cao\'s camp, the Fledgling Phoenix Pang Tong counsels the northern host — sick on the rolling river — to chain their ships deck to deck for stability. The fleet is bound fast into a single floating fortress, perfect tinder for the coming fire.',
    descriptionZh: "鳳雛龐統渡江入曹營,見北軍不慣水戰、暈眩嘔吐,獻連環之計:以鐵索連舟,首尾相接,如履平地。曹軍艨艟遂結為一體——正堪縱火之薪。",
    effects: [
      { kind: 'officer-loyalty', officerId: 'pang-tong', delta: 10 },
      { kind: 'flag', key: 'chain-ships-set' },
    ],
  },
  {
    id: 'evt-huang-gai-ruse',
    name: { en: 'Huang Gai\'s Sacrifice', zh: '苦肉計·黃蓋詐降' },
    yearMin: 208,
    yearMax: 209,
    season: 'winter',
    requires: [{ kind: 'officer-active', officerId: 'huang-gai' }],
    description:
      'The old general Huang Gai takes fifty lashes before the army in a staged quarrel with Zhou Yu, then sends Cao Cao a secret offer of surrender. None suspect the bleeding veteran — whose fire-boats will soon lead the assault on the chained fleet. "One willing to suffer, one willing to be deceived."',
    descriptionZh: "老將黃蓋與周瑜當眾佯爭,甘受五十脊杖,血肉模糊,然後密遣闞澤獻詐降書於曹操。曹營無人疑此重傷老臣——其火船,不日即引燃連環艨艟。所謂「一個願打,一個願挨」。",
    effects: [
      { kind: 'officer-loyalty', officerId: 'huang-gai', delta: 15 },
      { kind: 'flag', key: 'huang-gai-ruse' },
    ],
  },
  {
    id: 'evt-tongguan-beard',
    name: { en: 'Cutting the Beard at Tongguan', zh: '割鬚棄袍' },
    yearMin: 211,
    yearMax: 211,
    requires: [
      { kind: 'officer-active', officerId: 'cao-cao' },
      { kind: 'officer-active', officerId: 'ma-chao' },
    ],
    description:
      'Routed at Tongguan by the vengeful Ma Chao, Cao Cao flees as his pursuers cry "the one in the red robe is Cao!" — so he casts off the robe; "the long-bearded one is Cao!" — so he hacks off his beard. The conqueror escapes by abandoning his very face.',
    descriptionZh: "潼關大敗於馬超,曹操倉皇奔逃。追兵呼「穿紅袍者是曹操!」操即棄袍;又呼「長髯者是曹操!」操乃割鬚。一代梟雄,捨其鬚袍面目方得脫身。",
    effects: [
      { kind: 'officer-loyalty', officerId: 'ma-chao', delta: 10 },
      { kind: 'flag', key: 'tongguan-rout' },
    ],
  },
  {
    id: 'evt-pang-tong-falls',
    name: { en: 'The Fledgling Phoenix Falls', zh: '落鳳坡' },
    yearMin: 213,
    yearMax: 214,
    requires: [{ kind: 'officer-active', officerId: 'pang-tong' }],
    description:
      'Pressing the advance into Shu on Liu Bei\'s own white horse, Pang Tong rides into a narrow defile — the Slope of the Fallen Phoenix. Liu Zhang\'s archers, mistaking the rider for Liu Bei, loose as one. The Fledgling Phoenix dies at thirty-six, and the Longzhong Plan loses half its wings.',
    descriptionZh: "龐統急進取蜀,乘劉備白馬居前,行入一狹谷——落鳳坡。劉璋伏兵見白馬,誤以為劉備,萬箭齊發。鳳雛歿於是,年僅三十六。隆中之策,自此折其一翼。",
    effects: [
      { kind: 'officer-status', officerId: 'pang-tong', status: 'dead' },
      { kind: 'flag', key: 'pang-tong-fallen' },
    ],
  },

  // ── State-conditional events — fire on the emergent situation (a power's
  //    rise), not a fixed date, via the officer-rules-cities-min predicate. ──
  {
    id: 'evt-cao-hegemony',
    name: { en: 'The Hegemon of the North', zh: '霸業彰顯' },
    yearMin: 205,
    yearMax: 225,
    requires: [
      { kind: 'officer-active', officerId: 'cao-cao' },
      { kind: 'officer-rules-cities-min', officerId: 'cao-cao', count: 8 },
      { kind: 'flag-unset', key: 'cao-hegemony' },
    ],
    description:
      'From the central plains, Cao Cao\'s domain now spans the breadth of the north. Holding the Emperor and commanding the nobles, his word moves armies across a dozen provinces — the realm\'s mightiest power, in fact if not yet in name.',
    descriptionZh: "自中原而四向,曹操之疆域已橫亙北方。挾天子以令諸侯,一聲令下,十數州之兵皆動——雖未稱號,然天下第一強權之實,已成定局。",
    effects: [
      { kind: 'officer-loyalty', officerId: 'cao-cao', delta: 5 },
      { kind: 'flag', key: 'cao-hegemony' },
    ],
  },
  {
    id: 'evt-wu-established',
    name: { en: 'The Founding of Wu', zh: '江東鼎立' },
    yearMin: 200,
    yearMax: 235,
    requires: [
      { kind: 'officer-active', officerId: 'sun-quan' },
      { kind: 'officer-rules-cities-min', officerId: 'sun-quan', count: 5 },
      { kind: 'flag-unset', key: 'wu-established' },
    ],
    description:
      'Inheriting his father and brother\'s legacy, Sun Quan has welded the lands south of the Yangtze into a single power. With able men at his side and the great river for a wall, Jiangdong now stands as one of the realm\'s contending thrones.',
    descriptionZh: "承父兄之基業,孫權已將江南諸地合為一體。賢才環侍,長江為壘,江東自此鼎立於天下諸雄之間,成割據一方之勢。",
    effects: [
      { kind: 'officer-loyalty', officerId: 'sun-quan', delta: 5 },
      { kind: 'flag', key: 'wu-established' },
    ],
  },

  // ── Officer-discovery events — a famed talent enters service, joining
  //    whatever force their lord rules (officer-join-ruler, scenario-agnostic). ──
  {
    id: 'evt-pang-tong-joins',
    name: { en: 'The Fledgling Phoenix Takes Wing', zh: '鳳雛歸劉' },
    yearMin: 209,
    yearMax: 213,
    requires: [
      { kind: 'officer-alive', officerId: 'pang-tong' },
      { kind: 'officer-active', officerId: 'liu-bei' },
      { kind: 'flag-unset', key: 'pang-tong-fallen' },
      { kind: 'flag-unset', key: 'pang-tong-joined' },
    ],
    description:
      'Slighted as a mere county magistrate, Pang Tong clears a hundred days\' backlog of cases in half a morning — and Lu Su and Zhuge Liang reveal his worth. Liu Bei welcomes the Fledgling Phoenix as his strategist; with Sleeping Dragon and Phoenix both, the realm seems within reach.',
    descriptionZh: "龐統屈居縣令,半晌即決百日積案,魯肅、諸葛亮並薦其才。劉備乃迎鳳雛為軍師中郎將。臥龍鳳雛得其一可安天下——今二者兼得,大業似在指掌之間。",
    effects: [
      { kind: 'officer-join-ruler', officerId: 'pang-tong', rulerOfficerId: 'liu-bei' },
      { kind: 'officer-loyalty', officerId: 'pang-tong', delta: 20 },
      { kind: 'flag', key: 'pang-tong-joined' },
    ],
  },
  {
    id: 'evt-ma-chao-joins',
    name: { en: 'Ma Chao Comes to Shu', zh: '錦馬超歸蜀' },
    yearMin: 214,
    yearMax: 219,
    requires: [
      { kind: 'officer-alive', officerId: 'ma-chao' },
      { kind: 'officer-active', officerId: 'liu-bei' },
      { kind: 'flag-unset', key: 'ma-chao-joined' },
    ],
    description:
      'Broken at Tongguan and harried from Liang province, the peerless Ma Chao — "Splendid Ma Chao", terror of the northwest — turns at last to Liu Bei. His arrival at the walls of Chengdu so unnerves Liu Zhang that the city surrenders within days.',
    descriptionZh: "潼關敗後,流離涼州,一身白袍的「錦馬超」——西涼之畏,終投劉備。其軍臨成都城下,劉璋膽寒,旬日即降。猛將歸心,蜀中遂定。",
    effects: [
      { kind: 'officer-join-ruler', officerId: 'ma-chao', rulerOfficerId: 'liu-bei' },
      { kind: 'officer-loyalty', officerId: 'ma-chao', delta: 15 },
      { kind: 'flag', key: 'ma-chao-joined' },
    ],
  },
  {
    id: 'evt-gan-ning-joins',
    name: { en: 'Gan Ning the Pirate Joins Wu', zh: '甘興霸投吳' },
    yearMin: 208,
    yearMax: 215,
    requires: [
      { kind: 'officer-alive', officerId: 'gan-ning' },
      { kind: 'officer-active', officerId: 'sun-quan' },
      { kind: 'flag-unset', key: 'gan-ning-joined' },
    ],
    description:
      'Once a river pirate with bells on his belt, then ill-used under Huang Zu, Gan Ning crosses to Sun Quan and proves a thunderbolt — later raiding Cao Cao\'s camp with a hundred riders in the dead of night and returning without losing a man.',
    descriptionZh: "甘寧,昔為錦帆游俠,腰懸銅鈴;後屈於黃祖帳下,鬱鬱不得志。乃渡江投孫權,果為猛將——日後百騎劫曹營,夜半襲寨而還,不折一人。",
    effects: [
      { kind: 'officer-join-ruler', officerId: 'gan-ning', rulerOfficerId: 'sun-quan' },
      { kind: 'officer-loyalty', officerId: 'gan-ning', delta: 15 },
      { kind: 'flag', key: 'gan-ning-joined' },
    ],
  },
  {
    id: 'evt-jiang-wei-joins',
    name: { en: 'Jiang Wei Defects to Shu', zh: '姜維歸蜀' },
    yearMin: 228,
    yearMax: 234,
    requires: [
      { kind: 'officer-alive', officerId: 'jiang-wei' },
      { kind: 'officer-active', officerId: 'zhuge-liang' },
      { kind: 'flag-unset', key: 'jiang-wei-joined' },
    ],
    description:
      'Cornered and distrusted by his own Wei commanders during the first northern campaign, the young Tianshui officer Jiang Wei surrenders to Zhuge Liang, who weeps for joy: "My life\'s learning has at last found an heir." The Sleeping Dragon has found the one to carry on his work.',
    descriptionZh: "首次北伐,天水少年將姜維為魏將所疑,進退無路,乃降諸葛亮。亮喜極而泣:「吾平生所學,今得傳人矣!」臥龍之志,自此有繼。",
    effects: [
      { kind: 'officer-join-ruler', officerId: 'jiang-wei', rulerOfficerId: 'liu-shan' },
      { kind: 'officer-loyalty', officerId: 'jiang-wei', delta: 20 },
      { kind: 'flag', key: 'jiang-wei-joined' },
    ],
  },
  // ── 列傳名場面 — six missing icons of the era ──
  {
    id: 'evt-warm-wine-hua-xiong',
    name: { en: 'Slaying Hua Xiong While the Wine Is Warm', zh: '溫酒斬華雄' },
    yearMin: 190,
    yearMax: 191,
    requires: [
      { kind: 'officer-active', officerId: 'guan-yu' },
      { kind: 'officer-alive', officerId: 'hua-xiong' },
    ],
    description:
      'Hua Xiong taunts the coalition before Sishui Pass, felling champion after champion. A green-robed horseman volunteers; Cao Cao pours him a parting cup. "Pour it — I shall return before it cools." The drums shake, a head falls, and the wine is still warm when Guan Yu sets it down.',
    descriptionZh: "華雄連斬聯軍數將,陣前耀武。帳中一綠袍長髯者請戰,曹操酌熱酒一杯壯行。關羽曰:「酒且斟下,某去便來。」鼓聲大震,提華雄之頭擲於帳前——其酒尚溫。",
    effects: [
      { kind: 'officer-status', officerId: 'hua-xiong', status: 'dead' },
      { kind: 'officer-loyalty', officerId: 'guan-yu', delta: 5 },
      { kind: 'flag', key: 'hua-xiong-slain' },
    ],
  },
  {
    id: 'evt-three-heroes-lu-bu',
    name: { en: 'Three Heroes Battle Lü Bu', zh: '三英戰呂布' },
    yearMin: 190,
    yearMax: 191,
    requires: [
      { kind: 'officer-active', officerId: 'liu-bei' },
      { kind: 'officer-active', officerId: 'guan-yu' },
      { kind: 'officer-active', officerId: 'zhang-fei' },
      { kind: 'officer-alive', officerId: 'lu-bu' },
    ],
    description:
      'Before Hulao Gate, Lü Bu on Red Hare scatters all challengers — until Zhang Fei roars out with his serpent spear, Guan Yu joins with Green Dragon, and Liu Bei closes the triangle with his twin blades. The three brothers whirl around the lone rider in the most storied duel of the age.',
    descriptionZh: "虎牢關前,呂布乘赤兔,戟挑諸侯眾將,無人可敵。張飛挺丈八蛇矛大喝出馬,戰五十合;關羽舞青龍偃月刀夾攻;劉備掣雙股劍而上——三英圍呂布,轉燈般廝殺,天下第一武勇之戰。",
    effects: [
      { kind: 'officer-loyalty', officerId: 'liu-bei', delta: 3 },
      { kind: 'officer-loyalty', officerId: 'guan-yu', delta: 3 },
      { kind: 'officer-loyalty', officerId: 'zhang-fei', delta: 3 },
      { kind: 'flag', key: 'three-heroes-vs-lu-bu' },
    ],
  },
  {
    id: 'evt-dingjunshan',
    name: { en: 'Mount Dingjun', zh: '定軍山斬夏侯淵' },
    yearMin: 218,
    yearMax: 219,
    requires: [
      { kind: 'officer-active', officerId: 'huang-zhong' },
      { kind: 'officer-alive', officerId: 'xiahou-yuan' },
    ],
    description:
      'Huang Zhong takes the heights above Mount Dingjun and waits past noon, husbanding his men\'s strength while Xiahou Yuan\'s troops tire below. Then one downhill charge — drums like thunder — and the old general\'s blade takes the Wei commander at the foot of the slope. Hanzhong\'s gate swings open.',
    descriptionZh: "黃忠據定軍山之巔,以逸待勞。法正揮旗為號,老將軍一鼓而下,刀光到處,夏侯淵措手不及,連頭帶肩砍於山坡之下。漢中門戶,自此洞開。",
    effects: [
      { kind: 'officer-status', officerId: 'xiahou-yuan', status: 'dead' },
      { kind: 'officer-loyalty', officerId: 'huang-zhong', delta: 8 },
      { kind: 'flag', key: 'dingjunshan' },
    ],
  },
  {
    id: 'evt-jieting-ma-su',
    name: { en: 'Tears for Ma Su', zh: '揮淚斬馬謖' },
    yearMin: 228,
    yearMax: 229,
    requires: [
      { kind: 'officer-active', officerId: 'zhuge-liang' },
      { kind: 'officer-alive', officerId: 'ma-su' },
      { kind: 'flag-unset', key: 'jieting-chain-started' }, // superseded by the §8.1 choice chain
    ],
    description:
      'Against every instruction, Ma Su camps on the waterless hilltop at Jieting; Zhang He cuts the road and the army breaks. The law of the camp is the law: Zhuge Liang signs the order with tears on his face, then demotes himself three ranks for the defeat.',
    descriptionZh: "馬謖違節度,捨水上山紮營於街亭,張郃斷其汲道,蜀軍大潰。軍法如山——孔明揮淚斬馬謖,自貶三級,以明法度。",
    effects: [
      { kind: 'officer-status', officerId: 'ma-su', status: 'dead' },
      { kind: 'officer-loyalty', officerId: 'zhuge-liang', delta: -2 },
      { kind: 'flag', key: 'jieting-lost' },
    ],
  },
  {
    id: 'evt-scraping-bone',
    name: { en: 'Scraping the Bone', zh: '刮骨療毒' },
    yearMin: 215,
    yearMax: 219,
    requires: [
      { kind: 'officer-active', officerId: 'guan-yu' },
    ],
    description:
      'A poisoned bolt festers in Guan Yu\'s right arm. The physician opens the flesh and scrapes the bone clean while the general — arm stretched across the board — keeps drinking and playing weiqi, laughing with his officers. The scraping is heard around the tent.',
    descriptionZh: "毒鏃入骨,右臂青腫。醫者割開皮肉,以刀刮骨,悉悉有聲,帳上帳下皆掩面失色——關公飲酒食炙,談笑弈棋,全無痛苦之色。",
    effects: [
      { kind: 'officer-loyalty', officerId: 'guan-yu', delta: 5 },
      { kind: 'flag', key: 'bone-scraped' },
    ],
  },
  {
    id: 'evt-single-blade-meeting',
    name: { en: 'To the Feast with a Single Blade', zh: '單刀赴會' },
    yearMin: 215,
    yearMax: 215,
    requires: [
      { kind: 'officer-active', officerId: 'guan-yu' },
      { kind: 'officer-alive', officerId: 'lu-su' },
    ],
    description:
      'Lu Su invites Guan Yu across the river to demand Jingzhou back, ambush laid behind the screens. Guan Yu comes with a single blade and a handful of riders, drinks unhurried, then takes Lu Su\'s arm at the parting — walking himself to the boat as the hidden axemen dare not move.',
    descriptionZh: "魯肅設宴索荊州,壁後伏刀斧手。關公單刀赴會,談笑自若;臨別佯醉,執魯肅手至江邊——伏兵投鼠忌器,眼睜睜看其登舟而去。",
    effects: [
      { kind: 'officer-loyalty', officerId: 'guan-yu', delta: 4 },
      { kind: 'flag', key: 'single-blade-meeting' },
    ],
  },
  /* ─── §8.1-deep 赤壁連環 — three-step chain with choices ─────────────
     苦肉計 (chooser 孫權) → 龐統獻連環 (chooser 曹操) → 火燒赤壁 (chooser
     孫權). Each side of the war gets its own decision; the legacy one-shot
     evt-battle-of-red-cliffs is gated off once this chain begins. */
  {
    id: 'evt-chibi-1',
    name: { en: 'The Flesh-and-Blood Ruse', zh: '苦肉計' },
    yearMin: 208,
    yearMax: 209,
    requires: [
      { kind: 'officer-active', officerId: 'zhou-yu' },
      { kind: 'officer-alive', officerId: 'huang-gai' },
      { kind: 'officer-rules-cities-min', officerId: 'cao-cao', count: 6 },
      { kind: 'flag-unset', key: 'three-kingdoms-formed' },
    ],
    description:
      'Cao Cao\'s host darkens the northern bank. Zhou Yu proposes the oldest trick with the highest price: beat the veteran Huang Gai bloody before the assembled fleet, so his "defection" rings true.',
    descriptionZh: '曹軍百萬,飲馬長江。周瑜獻計:當眾杖責老將黃蓋,以詐降取信曹操 — 苦肉之計,非至誠不能行。',
    effects: [{ kind: 'flag', key: 'chibi-chain-started' }],
    chooserRulerId: 'sun-quan',
    mood: 'martial',
    choices: [
      {
        id: 'kurou',
        label: { zh: '依計行事 — 杖責黃蓋', en: 'Stage the beating' },
        effects: [
          { kind: 'flag', key: 'chibi-kurou' },
          { kind: 'officer-loyalty', officerId: 'huang-gai', delta: 10 },
        ],
      },
      {
        id: 'refuse',
        label: { zh: '不忍老將受辱,另尋他策', en: 'Spare the old general' },
        effects: [{ kind: 'flag', key: 'chibi-no-kurou' }],
      },
    ],
  },
  {
    id: 'evt-chibi-2',
    name: { en: 'The Chained Ships', zh: '龐統獻連環' },
    yearMin: 208,
    yearMax: 209,
    requires: [
      { kind: 'flag-set', key: 'chibi-kurou' },
      { kind: 'officer-alive', officerId: 'pang-tong' },
      { kind: 'officer-alive', officerId: 'cao-cao' },
    ],
    description:
      'Huang Gai\'s surrender letter has been received. Now a famed scholar, Pang Tong, arrives in the northern camp with a remedy for seasick soldiers: chain the ships bow to stern into one steady floating fortress.',
    descriptionZh: '黃蓋降書已納。名士龐統復至曹營,獻策治北軍暈眩之疾:「以鐵環連舟,首尾相接,則如履平地。」',
    effects: [],
    chooserRulerId: 'cao-cao',
    mood: 'mystic',
    choices: [
      {
        id: 'chain',
        label: { zh: '納連環之策,鎖艦為城', en: 'Chain the fleet' },
        effects: [{ kind: 'flag', key: 'chibi-chained' }],
      },
      {
        id: 'wary',
        label: { zh: '疑其中詐,分屯艦隊', en: 'Suspect a trap — disperse the fleet' },
        effects: [{ kind: 'flag', key: 'chibi-wary' }],
      },
    ],
  },
  {
    id: 'evt-chibi-3',
    name: { en: 'Fire on the Yangtze', zh: '火燒赤壁' },
    yearMin: 208,
    yearMax: 209,
    requires: [
      { kind: 'flag-set', key: 'chibi-chained' },
      { kind: 'officer-active', officerId: 'zhou-yu' },
    ],
    description:
      'The south-east wind rises against all season. The chained fleet lies fat on the water. Huang Gai\'s "surrender" squadron stands ready, holds full of oil and tinder. One signal will decide the age.',
    descriptionZh: '東南風逆季而起,連環艦隊臃腫於江心。黃蓋「降船」二十艘滿載膏油,只待都督一聲令下。',
    effects: [],
    chooserRulerId: 'sun-quan',
    mood: 'martial',
    choices: [
      {
        id: 'burn',
        label: { zh: '縱火!', en: 'Loose the fire ships!' },
        effects: [
          { kind: 'force-troops-multiplier-ruler', rulerOfficerId: 'cao-cao', multiplier: 0.55 },
          { kind: 'mandate-ruler', rulerOfficerId: 'cao-cao', delta: -10 },
          { kind: 'mandate-ruler', rulerOfficerId: 'sun-quan', delta: 8 },
          { kind: 'mandate-ruler', rulerOfficerId: 'liu-bei', delta: 6 },
          { kind: 'flag', key: 'chibi-burned' },
          { kind: 'flag', key: 'three-kingdoms-formed' },
        ],
      },
      {
        id: 'clash',
        label: { zh: '不用火攻,堂堂正正水戰決勝', en: 'Meet them ship to ship' },
        effects: [
          { kind: 'force-troops-multiplier-ruler', rulerOfficerId: 'cao-cao', multiplier: 0.85 },
          { kind: 'force-troops-multiplier-ruler', rulerOfficerId: 'sun-quan', multiplier: 0.9 },
          { kind: 'flag', key: 'three-kingdoms-formed' },
        ],
      },
    ],
  },
  {
    id: 'evt-chibi-3b',
    name: { en: 'Cao Cao Burns His Own Ships', zh: '曹操焚舟自退' },
    yearMin: 208,
    yearMax: 210,
    requires: [
      { kind: 'flag-set', key: 'chibi-wary' },
      { kind: 'officer-alive', officerId: 'cao-cao' },
    ],
    description:
      'Plague spreads through the dispersed northern fleet and the alliance holds the river. Rather than hand his ships to the enemy, Cao Cao burns them at anchor and marches home. The south stays unconquered.',
    descriptionZh: '疫病流行,北軍分屯之艦隊士氣日沮,而孫劉聯軍扼守大江。曹操不欲以舟師資敵,自焚戰船,引軍北歸 — 江南遂不可圖。',
    effects: [
      { kind: 'force-troops-multiplier-ruler', rulerOfficerId: 'cao-cao', multiplier: 0.8 },
      { kind: 'mandate-ruler', rulerOfficerId: 'cao-cao', delta: -4 },
      { kind: 'flag', key: 'three-kingdoms-formed' },
    ],
    mood: 'somber',
  },

  /* ─── §8.1-deep 街亭之守 — the 228 northern-expedition gamble ─────────
     Choose the hill-loving theorist or the steady veteran; the 斬馬謖
     reckoning only comes if the pass is lost. Gates off the legacy
     one-shot evt-jieting-ma-su. */
  {
    id: 'evt-jieting-1',
    name: { en: 'Who Holds Jieting?', zh: '街亭之守' },
    yearMin: 228,
    yearMax: 229,
    requires: [
      { kind: 'officer-active', officerId: 'zhuge-liang' },
      { kind: 'officer-active', officerId: 'ma-su' },
      { kind: 'officer-active', officerId: 'wang-ping' },
      { kind: 'flag-unset', key: 'jieting-lost' },
    ],
    description:
      'The northern expedition hangs on one mountain road. Ma Su — brilliant in council, untested in the field — begs for the command; the veteran Wang Ping stands silent at his shoulder. Zhang He\'s columns are three days out.',
    descriptionZh: '北伐糧道,繫於街亭一線。馬謖願立軍令狀請守;宿將王平默立其側。張郃大軍,三日可至。',
    effects: [{ kind: 'flag', key: 'jieting-chain-started' }],
    chooserRulerId: 'liu-shan',
    mood: 'martial',
    choices: [
      {
        id: 'masu',
        label: { zh: '用馬謖為主將(立軍令狀)', en: 'Give Ma Su the command' },
        effects: [{ kind: 'flag', key: 'jieting-masu' }],
      },
      {
        id: 'wangping',
        label: { zh: '以王平為主將,當道下寨', en: 'Trust Wang Ping — camp astride the road' },
        effects: [
          { kind: 'flag', key: 'jieting-wangping' },
          { kind: 'officer-loyalty', officerId: 'wang-ping', delta: 8 },
          { kind: 'officer-loyalty', officerId: 'ma-su', delta: -5 },
        ],
      },
    ],
  },
  {
    id: 'evt-jieting-2',
    name: { en: 'Tears for Ma Su', zh: '揮淚斬馬謖' },
    yearMin: 228,
    yearMax: 230,
    requires: [
      { kind: 'flag-set', key: 'jieting-masu' },
      { kind: 'officer-alive', officerId: 'ma-su' },
      { kind: 'officer-active', officerId: 'zhuge-liang' },
    ],
    description:
      'Against every instruction Ma Su camped on the waterless hilltop; Zhang He cut the road and the army broke. The signed pledge lies on the table. The law of the camp is the law — or is mercy wiser?',
    descriptionZh: '馬謖違節度,捨水上山;張郃絕其汲道,街亭遂失,大軍倉皇而還。軍令狀在案 — 軍法如山,抑或惜才留之?',
    effects: [
      { kind: 'force-troops-multiplier-ruler', rulerOfficerId: 'liu-shan', multiplier: 0.93 },
      { kind: 'mandate-ruler', rulerOfficerId: 'liu-shan', delta: -6 },
      { kind: 'flag', key: 'jieting-lost' },
    ],
    chooserRulerId: 'liu-shan',
    mood: 'somber',
    choices: [
      {
        id: 'execute',
        label: { zh: '依法斬之,以明軍紀', en: 'The law is the law — execute him' },
        effects: [
          { kind: 'officer-status', officerId: 'ma-su', status: 'dead' },
          { kind: 'mandate-ruler', rulerOfficerId: 'liu-shan', delta: 4 },
          { kind: 'flag', key: 'masu-executed' }, // hook for the 抉擇勳功
        ],
      },
      {
        id: 'spare',
        label: { zh: '免死貶為庶人,留其後效', en: 'Spare him — strip his rank' },
        effects: [
          { kind: 'officer-loyalty', officerId: 'ma-su', delta: 15 },
          { kind: 'mandate-ruler', rulerOfficerId: 'liu-shan', delta: -3 },
        ],
      },
    ],
  },
  {
    id: 'evt-jieting-2b',
    name: { en: 'The Road Holds', zh: '街亭不失' },
    yearMin: 228,
    yearMax: 230,
    requires: [
      { kind: 'flag-set', key: 'jieting-wangping' },
      { kind: 'officer-alive', officerId: 'wang-ping' },
    ],
    description:
      'Wang Ping camps astride the road, wells within the palisade. Zhang He probes for ten days and finds no opening; the supply line to the north holds, and with it the whole campaign.',
    descriptionZh: '王平當道下寨,井在壘中。張郃攻旬日而無隙可乘,引軍自退 — 糧道既全,北伐之勢得以不墮。',
    effects: [
      { kind: 'mandate-ruler', rulerOfficerId: 'liu-shan', delta: 6 },
      { kind: 'officer-loyalty', officerId: 'wang-ping', delta: 10 },
      { kind: 'flag', key: 'jieting-held' },
    ],
    mood: 'auspicious',
  },

  /* ─── §8.1-deep 白帝托孤 — Liu Bei's deathbed (chooser: 劉備) ─────────
     The player-as-Liu-Bei chooses how much to trust the Sleeping Dragon.
     Gates off the legacy one-shot evt-liu-bei-dies. */
  {
    id: 'evt-baidi-1',
    name: { en: 'The Trust at White Emperor City', zh: '白帝托孤' },
    yearMin: 222,
    yearMax: 224,
    requires: [
      { kind: 'officer-active', officerId: 'liu-bei' },
      { kind: 'officer-active', officerId: 'zhuge-liang' },
      { kind: 'flag-set', key: 'three-kingdoms-formed' },
    ],
    description:
      'Broken at Yiling, Liu Bei lies dying at White Emperor City. Zhuge Liang kneels at the bedside. The last words of a dynasty\'s founder will bind — or fracture — everything that follows.',
    descriptionZh: '夷陵兵敗,劉備病篤於白帝城,召丞相諸葛亮至榻前。開國之君的遺言,將定蜀漢此後數十年之向背。',
    effects: [{ kind: 'flag', key: 'baidi-chain-started' }],
    chooserRulerId: 'liu-bei',
    mood: 'somber',
    choices: [
      {
        id: 'trust',
        label: { zh: '「君才十倍曹丕…君可自取。」全權托孤', en: '"Take the throne yourself if my son fails."' },
        effects: [
          { kind: 'officer-status', officerId: 'liu-bei', status: 'dead' },
          { kind: 'officer-loyalty', officerId: 'zhuge-liang', delta: 40 },
          { kind: 'mandate-ruler', rulerOfficerId: 'liu-shan', delta: 5 },
          { kind: 'flag', key: 'baidi-trust' },
        ],
      },
      {
        id: 'balance',
        label: { zh: '託孤於亮,而分權李嚴以制衡', en: 'Entrust Zhuge Liang — but split the regency' },
        effects: [
          { kind: 'officer-status', officerId: 'liu-bei', status: 'dead' },
          { kind: 'officer-loyalty', officerId: 'zhuge-liang', delta: 10 },
          { kind: 'flag', key: 'baidi-balance' },
        ],
      },
    ],
  },

  /* ─── §8.1-deep 高平陵之變 — the Wei court's last free choice ─────────
     Chooser is the boy emperor 曹芳 (i.e. whoever plays Wei): ride out to
     the tombs as history did, or heed the warnings about the "sick" old
     man. Gates off the legacy one-shot evt-sima-yi-coup (and vice versa). */
  {
    id: 'evt-gaopingling-1',
    name: { en: 'The Sick Man of Luoyang', zh: '司馬懿稱病' },
    yearMin: 247,
    yearMax: 250,
    requires: [
      { kind: 'officer-active', officerId: 'sima-yi' },
      { kind: 'officer-active', officerId: 'cao-shuang' },
      { kind: 'flag-unset', key: 'sima-coup-249' },
    ],
    description:
      'Sima Yi has not left his sickbed in a year — drooling, they say, spilling his gruel. Cao Shuang plans to escort the young emperor to the ancestral sacrifice at the Gaoping tombs, leaving the capital gates behind him.',
    descriptionZh: '司馬懿臥病經年,聞者謂其飲粥沾襟、老耄昏聵。曹爽欲奉天子出謁高平陵祭祖,盡攜心腹而行,都城為之一空。',
    effects: [{ kind: 'flag', key: 'gaopingling-chain-started' }],
    chooserRulerId: 'cao-fang',
    mood: 'ominous',
    choices: [
      {
        id: 'ride',
        label: { zh: '從曹爽出謁高平陵(史實)', en: 'Ride out with Cao Shuang' },
        effects: [
          { kind: 'officer-status', officerId: 'cao-shuang', status: 'dead' },
          { kind: 'mandate-ruler', rulerOfficerId: 'cao-fang', delta: -12 },
          { kind: 'officer-loyalty', officerId: 'sima-yi', delta: -20 },
          { kind: 'flag', key: 'sima-coup-249' },
        ],
      },
      {
        id: 'stay',
        label: { zh: '疑其詐病,留重兵守洛陽', en: 'Distrust the sickbed — garrison Luoyang' },
        effects: [
          { kind: 'mandate-ruler', rulerOfficerId: 'cao-fang', delta: 4 },
          { kind: 'officer-loyalty', officerId: 'sima-yi', delta: -10 },
          { kind: 'flag', key: 'gaopingling-averted' },
        ],
      },
    ],
  },

  /* ─── §8.4-deep 浮屠祠 — Ze Rong's Buddhist temple at Xiapi ──────────
     The era's one great Buddhist beat: bathe the Buddha and feast ten
     thousand — at ruinous public expense. Chooser: 陶謙 (Ze Rong's lord). */
  {
    id: 'evt-futu-temple',
    name: { en: 'The Buddha of Xiapi', zh: '笮融建浮屠祠' },
    yearMin: 193,
    yearMax: 196,
    requires: [
      { kind: 'officer-active', officerId: 'ze-rong' },
      { kind: 'officer-active', officerId: 'tao-qian' },
    ],
    description:
      'Ze Rong, entrusted with the grain transports, has poured them into a tower of bronze and gold — a Buddha nine stories high. On bathing days he lays feasts along the road for ten thousand; the treasury bleeds.',
    descriptionZh: '督運糧曹之笮融,竟移公帑建九層浮屠,黃金塗身,衣以錦采。每浴佛日,設酒飯於路,費以巨億計 — 民悅之,而府庫為之一空。',
    effects: [],
    chooserRulerId: 'tao-qian',
    mood: 'mystic',
    choices: [
      {
        id: 'allow',
        label: { zh: '聽其建祠,與民同會', en: 'Let the temple stand' },
        effects: [
          { kind: 'city-loyalty', cityId: 'xiapi', delta: 7 },
          { kind: 'force-gold-ruler', rulerOfficerId: 'tao-qian', delta: -300 },
          { kind: 'flag', key: 'futu-built' },
        ],
      },
      {
        id: 'forbid',
        label: { zh: '禁之,追還挪用之公帑', en: 'Forbid it — reclaim the funds' },
        effects: [
          { kind: 'city-loyalty', cityId: 'xiapi', delta: -3 },
          { kind: 'force-gold-ruler', rulerOfficerId: 'tao-qian', delta: 200 },
          { kind: 'officer-loyalty', officerId: 'ze-rong', delta: -12 },
        ],
      },
    ],
  },

  /* ─── 名場面補完批(2026-07)────────────────────────────────────────
     Twelve beloved beats the catalog still lacked, in rough chronology.
     Two new chains: 甘露寺招親 → 截江奪阿斗 (ganlu-married gates the
     river intercept) and 威震逍遙津 → 甘寧百騎劫營 (Wu's revenge raid
     only fires after the shame of Xiaoyao Ford). Five are choice events;
     per the engine contract the FIRST choice is always the historical
     path the AI walks. */
  {
    id: 'evt-wangmei',
    name: { en: 'Plums Beyond the Ridge', zh: '望梅止渴' },
    yearMin: 196,
    yearMax: 200,
    season: 'summer',
    requires: [
      { kind: 'officer-alive', officerId: 'cao-cao' },
      { kind: 'officer-rules-cities-min', officerId: 'cao-cao', count: 1 },
    ],
    description:
      'On a parched summer march the columns stagger, tongues cracked. Cao Cao rises in his stirrups and points past the ridge: "Plum groves ahead — sweet-sour fruit, all you can eat!" Mouths water at the very word, and the army makes the next spring in one push.',
    descriptionZh: '盛夏行軍,道乏水源,三軍口渴難行。曹公揚鞭遙指:「前有大梅林,饒子甘酸,可以解渴!」士卒聞之,口皆生津,一鼓作氣趕至前源。',
    effects: [
      { kind: 'force-troops-multiplier-ruler', rulerOfficerId: 'cao-cao', multiplier: 1.03 },
      { kind: 'flag', key: 'wangmei' },
    ],
    mood: 'martial',
  },
  {
    id: 'evt-birou-lament',
    name: { en: 'The Lament at Jingzhou', zh: '髀肉之嘆' },
    yearMin: 201,
    yearMax: 206,
    requires: [
      { kind: 'officer-alive', officerId: 'liu-bei' },
      { kind: 'officer-rules-cities-min', officerId: 'liu-bei', count: 1 },
    ],
    description:
      'A guest in Jingzhou, Liu Bei catches sight of the soft flesh grown back on his thighs and weeps: "Once I never left the saddle, and my thighs were hard as wood. The months gallop past, old age comes on — and still no great work stands to my name." His sworn brothers hear, and burn.',
    descriptionZh: '寄寓荊州,一日如廁,見髀裡肉生,慨然流涕:「吾常身不離鞍,髀肉皆消;今不復騎,髀裡肉生。日月若馳,老將至矣,而功業不建,是以悲耳!」左右聞之,無不奮然。',
    effects: [
      { kind: 'mandate-ruler', rulerOfficerId: 'liu-bei', delta: 1 },
      { kind: 'officer-loyalty', officerId: 'guan-yu', delta: 3 },
      { kind: 'officer-loyalty', officerId: 'zhang-fei', delta: 3 },
      { kind: 'flag', key: 'birou-lament' },
    ],
    mood: 'somber',
  },
  {
    id: 'evt-caochong-elephant',
    name: { en: 'Weighing the Elephant', zh: '曹沖稱象' },
    yearMin: 201,
    yearMax: 207,
    requires: [
      { kind: 'officer-alive', officerId: 'cao-chong' },
      { kind: 'officer-alive', officerId: 'cao-cao' },
      { kind: 'officer-rules-cities-min', officerId: 'cao-cao', count: 2 },
    ],
    description:
      'Sun Quan sends a great elephant; the court is stumped for a way to weigh it. The boy Cao Chong pipes up: "Lead it onto a barge, mark the waterline, then load stones to the same mark and weigh those." Cao Cao beams — word of the prodigy runs through the realm.',
    descriptionZh: '孫權致巨象,曹公欲知其斤重,訪之群下,咸莫能出其理。沖曰:「置象大船之上,而刻其水痕所至,稱物以載之,則校可知矣。」公大悅,施行焉——神童之名,傳於天下。',
    effects: [
      { kind: 'mandate-ruler', rulerOfficerId: 'cao-cao', delta: 1 },
      { kind: 'officer-loyalty', officerId: 'cao-chong', delta: 5 },
      { kind: 'flag', key: 'chong-elephant' },
    ],
    mood: 'auspicious',
  },
  {
    id: 'evt-wenji-return',
    name: { en: 'Wenji Returns to the Han', zh: '文姬歸漢' },
    yearMin: 206,
    yearMax: 210,
    requires: [
      // cai-wenji is the id the scenarios wire (200+ starts place her in Cao's
      // Xuchang, post-return) — the unaffiliated gate keeps this from firing
      // there: she is already home.
      { kind: 'officer-unaffiliated', officerId: 'cai-wenji' },
      { kind: 'officer-rules-cities-min', officerId: 'cao-cao', count: 3 },
    ],
    description:
      "Cai Yong's daughter Wenji has lived twelve years a captive of the southern Xiongnu; her Eighteen Songs of the Nomad Flute drift back across the border and wound every heart that hears them. Cao Cao, who loved her father, may yet ransom her home — at a price in gold and jade.",
    descriptionZh: '蔡邕之女文姬,亂中沒於南匈奴十二載,作《胡笳十八拍》,聲聞中原。曹公素與邕善,痛其無嗣,聞之愴然——遣使者以金璧贖之乎?',
    effects: [],
    chooserRulerId: 'cao-cao',
    mood: 'somber',
    choices: [
      {
        id: 'ransom',
        label: { zh: '遣使齎金璧,贖文姬歸漢', en: 'Send gold and jade to bring her home' },
        effects: [
          { kind: 'force-gold-ruler', rulerOfficerId: 'cao-cao', delta: -400 },
          { kind: 'officer-join-ruler', officerId: 'cai-wenji', rulerOfficerId: 'cao-cao' },
          { kind: 'mandate-ruler', rulerOfficerId: 'cao-cao', delta: 2 },
          { kind: 'flag', key: 'wenji-returned' },
        ],
      },
      {
        id: 'later',
        label: { zh: '兵戈未息,俟諸他日', en: 'The wars come first — another day' },
        effects: [{ kind: 'flag', key: 'wenji-stays' }],
      },
    ],
  },
  {
    id: 'evt-ganlu-wedding',
    name: { en: 'Wedding at Ganlu Temple', zh: '甘露寺招親' },
    yearMin: 209,
    yearMax: 211,
    requires: [
      { kind: 'officer-alive', officerId: 'liu-bei' },
      { kind: 'officer-alive', officerId: 'lady-sun' },
      { kind: 'officer-alive', officerId: 'sun-quan' },
      { kind: 'officer-rules-cities-min', officerId: 'liu-bei', count: 2 },
      { kind: 'officer-rules-cities-min', officerId: 'sun-quan', count: 2 },
    ],
    description:
      "Zhou Yu baits the hook: lure Liu Bei across the river to wed Sun Quan's sister, then hold him hostage for Jingzhou. But at Ganlu Temple the Dowager takes one look at the guest and approves in earnest. A trap that may turn into a true marriage — cross the river, or refuse?",
    descriptionZh: '周瑜獻計,以主公之妹為餌,誆劉備過江招親,實欲囚之以索荊州。豈料吳國太甘露寺相看,竟真愛其英雄之器。弄假成真乎?——過江,或是不過?',
    effects: [],
    chooserRulerId: 'liu-bei',
    mood: 'auspicious',
    choices: [
      {
        id: 'cross',
        label: { zh: '龍鳳呈祥,過江赴會', en: 'Cross the river to the wedding' },
        effects: [
          { kind: 'officer-join-ruler', officerId: 'lady-sun', rulerOfficerId: 'liu-bei' },
          { kind: 'mandate-ruler', rulerOfficerId: 'liu-bei', delta: 2 },
          { kind: 'mandate-ruler', rulerOfficerId: 'sun-quan', delta: -1 },
          { kind: 'flag', key: 'ganlu-married' },
        ],
      },
      {
        id: 'decline',
        label: { zh: '恐是鴻門之宴,辭之', en: 'Smell the trap — decline' },
        effects: [
          { kind: 'mandate-ruler', rulerOfficerId: 'sun-quan', delta: 1 },
          { kind: 'flag', key: 'ganlu-declined' },
        ],
      },
    ],
  },
  {
    id: 'evt-jiejiang-aduo',
    name: { en: 'Seizing A-Dou on the River', zh: '截江奪阿斗' },
    yearMin: 210,
    yearMax: 215,
    requires: [
      { kind: 'flag-set', key: 'ganlu-married' },
      { kind: 'officer-alive', officerId: 'zhao-yun' },
      { kind: 'officer-alive', officerId: 'lady-sun' },
    ],
    description:
      'With Liu Bei away in Shu, Sun Quan sends ships for his sister — and Lady Sun carries little A-Dou aboard with her! Zhao Yun gallops the bank alone, Zhang Fei swings his boats across the current. Wrest the heir back?',
    descriptionZh: '劉備方入蜀,孫權遣舟迎妹歸吳,夫人竟攜阿斗登船!趙雲聞訊單騎沿江追至,張飛引舟橫截江面。奪回幼主乎?',
    effects: [],
    chooserRulerId: 'liu-bei',
    mood: 'martial',
    choices: [
      {
        id: 'intercept',
        label: { zh: '子龍截江,奪回阿斗', en: 'Zhao Yun boards — take back the heir' },
        effects: [
          { kind: 'officer-join-ruler', officerId: 'lady-sun', rulerOfficerId: 'sun-quan' },
          { kind: 'officer-loyalty', officerId: 'zhao-yun', delta: 8 },
          { kind: 'flag', key: 'aduo-rescued' },
        ],
      },
      {
        id: 'let-go',
        label: { zh: '夫人既去,骨肉隨她去罷', en: 'Let wife and child go' },
        effects: [
          { kind: 'officer-join-ruler', officerId: 'lady-sun', rulerOfficerId: 'sun-quan' },
          { kind: 'mandate-ruler', rulerOfficerId: 'liu-bei', delta: -2 },
          { kind: 'officer-loyalty', officerId: 'zhao-yun', delta: -4 },
          { kind: 'flag', key: 'aduo-taken' },
        ],
      },
    ],
  },
  {
    id: 'evt-zuoci-mocks',
    name: { en: 'Zuo Ci Mocks the King', zh: '左慈擲杯戲曹' },
    yearMin: 213,
    yearMax: 219,
    requires: [
      { kind: 'officer-alive', officerId: 'zuo-ci' },
      { kind: 'officer-rules-cities-min', officerId: 'cao-cao', count: 4 },
    ],
    description:
      'At the feast the hermit Zuo Ci tosses his wine-cup into the air — it becomes a white dove and flies off. The delicacies on the table, he says, were fetched this very hour from a thousand li away. Half the hall cries sorcery and calls for his head.',
    descriptionZh: '宴上有隱者左慈,擲杯於空,化白鳩飛去;席間美酒佳肴,自雲皆頃刻取自千里之外。滿座失色,或言妖人惑眾,當捕而誅之。',
    effects: [],
    chooserRulerId: 'cao-cao',
    mood: 'mystic',
    choices: [
      {
        id: 'hunt',
        label: { zh: '妖人惑眾,發兵搜捕', en: 'Sorcerer! Hunt him down' },
        effects: [
          { kind: 'force-gold-ruler', rulerOfficerId: 'cao-cao', delta: -200 },
          { kind: 'mandate-ruler', rulerOfficerId: 'cao-cao', delta: -1 },
          { kind: 'flag', key: 'zuoci-hunted' },
        ],
      },
      {
        id: 'laugh',
        label: { zh: '神仙之事,一笑置之', en: 'Smile, and let the immortal be' },
        effects: [
          { kind: 'mandate-ruler', rulerOfficerId: 'cao-cao', delta: 1 },
          { kind: 'flag', key: 'zuoci-shrugged' },
        ],
      },
    ],
  },
  {
    id: 'evt-xiaoyaojin',
    name: { en: 'Terror at Xiaoyao Ford', zh: '威震逍遙津' },
    yearMin: 214,
    yearMax: 217,
    season: 'autumn',
    requires: [
      { kind: 'officer-alive', officerId: 'zhang-liao' },
      { kind: 'city-owner-ruler', cityId: 'hefei', rulerOfficerId: 'cao-cao' },
      { kind: 'officer-alive', officerId: 'sun-quan' },
      { kind: 'officer-rules-cities-min', officerId: 'sun-quan', count: 3 },
    ],
    description:
      "Sun Quan rings Hefei with a hundred thousand men. At first light Zhang Liao straps on his armor and leads eight hundred picked soldiers straight into the Wu host, roaring his own name, and cuts through to Sun Quan's very standard. The Wu army breaks back across Xiaoyao Ford — and in Jiangdong they hush crying children with his name.",
    descriptionZh: '孫權十萬眾圍合肥,張遼被甲執戟,率八百死士凌晨直衝吳陣,大呼「張遼在此!」直抵孫權麾旗之下。吳軍披靡,退渡逍遙津。自是江東小兒聞遼名,夜不敢啼。',
    effects: [
      { kind: 'city-defense', cityId: 'hefei', delta: 15 },
      { kind: 'officer-loyalty', officerId: 'zhang-liao', delta: 8 },
      { kind: 'mandate-ruler', rulerOfficerId: 'cao-cao', delta: 2 },
      { kind: 'mandate-ruler', rulerOfficerId: 'sun-quan', delta: -2 },
      { kind: 'flag', key: 'xiaoyaojin' },
    ],
    mood: 'martial',
  },
  {
    id: 'evt-ganning-raid',
    name: { en: 'A Hundred Riders Raid the Camp', zh: '甘寧百騎劫魏營' },
    yearMin: 214,
    yearMax: 220,
    requires: [
      { kind: 'flag-set', key: 'xiaoyaojin' },
      { kind: 'officer-alive', officerId: 'gan-ning' },
      { kind: 'officer-alive', officerId: 'sun-quan' },
    ],
    description:
      'To wash out the shame of Xiaoyao Ford, Gan Ning picks a hundred riders — bits in the horses\' mouths, bells muffled — and storms the Cao camp by night, back before dawn with dozens of heads and not a man lost. Sun Quan claps his back: "Mengde has Zhang Liao; I have Xingba. It is answer enough."',
    descriptionZh: '為雪逍遙津之恥,甘寧選百騎,人銜枚、馬摘鈴,夜劫曹營,斬首數十級而還,不折一人一騎。孫權撫其背曰:「孟德有張遼,孤有興霸,足相敵也!」',
    effects: [
      { kind: 'officer-loyalty', officerId: 'gan-ning', delta: 8 },
      { kind: 'mandate-ruler', rulerOfficerId: 'sun-quan', delta: 2 },
      { kind: 'flag', key: 'ganning-raid' },
    ],
    mood: 'martial',
  },
  {
    id: 'evt-jilei-yangxiu',
    name: { en: 'Chicken Ribs', zh: '雞肋・楊修之死' },
    yearMin: 218,
    yearMax: 220,
    requires: [
      { kind: 'officer-alive', officerId: 'yang-xiu' },
      { kind: 'officer-alive', officerId: 'cao-cao' },
      { kind: 'officer-rules-cities-min', officerId: 'cao-cao', count: 4 },
    ],
    description:
      'Deadlocked at Hanzhong, Cao Cao mutters the night watchword: "chicken ribs." Clerk Yang Xiu hears it and tells the men to pack: "Chicken ribs — no meat to eat, yet a shame to throw away. The King has already decided to withdraw." The word spreads; the camp stirs.',
    descriptionZh: '漢中相持,進不能勝,退恐人笑。夜傳口令,曹公隨口曰「雞肋」。主簿楊修聞之,竟教軍士收拾行裝:「雞肋者,食之無肉,棄之有味——魏王歸計已決矣。」語泄,軍心浮動。',
    effects: [],
    chooserRulerId: 'cao-cao',
    mood: 'ominous',
    choices: [
      {
        id: 'execute',
        label: { zh: '造言亂軍,斬之', en: 'He unsettles the army — behead him' },
        effects: [
          { kind: 'officer-status', officerId: 'yang-xiu', status: 'dead' },
          { kind: 'mandate-ruler', rulerOfficerId: 'cao-cao', delta: -1 },
          { kind: 'flag', key: 'yangxiu-dead' },
        ],
      },
      {
        id: 'spare',
        label: { zh: '恃才放曠,姑恕之', en: 'Brilliant and reckless — pardon him' },
        effects: [
          { kind: 'officer-loyalty', officerId: 'yang-xiu', delta: 10 },
          { kind: 'flag', key: 'yangxiu-spared' },
        ],
      },
    ],
  },
  {
    id: 'evt-huatuo-prison',
    name: { en: 'Death of the Divine Physician', zh: '神醫之死' },
    yearMin: 218,
    yearMax: 220,
    requires: [
      { kind: 'officer-alive', officerId: 'hua-tuo' },
      { kind: 'officer-alive', officerId: 'cao-cao' },
      { kind: 'officer-rules-cities-min', officerId: 'cao-cao', count: 4 },
    ],
    description:
      'The headaches grow blinding. The divine physician Hua Tuo examines the King of Wei: "The root sits inside the skull. Drink my numbing draught and let me open it with an axe, and the sickness ends." Cao Cao goes white with rage: "An assassin — Guan Yu\'s man!" Prison and death — or trust the healer?',
    descriptionZh: '頭風愈烈,召神醫華佗。佗曰:「病根在腦中,須飲麻肺湯,以利斧開顱,方可除根。」曹公勃然:「安敢害孤!此必為關羽報仇之細作!」——下獄拷殺,或信其醫道?',
    effects: [],
    chooserRulerId: 'cao-cao',
    mood: 'ominous',
    choices: [
      {
        id: 'kill',
        label: { zh: '必是行刺,下獄殺之', en: 'An assassin — to prison and death' },
        effects: [
          { kind: 'officer-status', officerId: 'hua-tuo', status: 'dead' },
          { kind: 'mandate-ruler', rulerOfficerId: 'cao-cao', delta: -2 },
          { kind: 'flag', key: 'huatuo-dead' },
        ],
      },
      {
        id: 'trust',
        label: { zh: '信其醫道,留為侍醫', en: 'Trust him — keep him as court physician' },
        effects: [
          { kind: 'officer-join-ruler', officerId: 'hua-tuo', rulerOfficerId: 'cao-cao' },
          { kind: 'officer-loyalty', officerId: 'hua-tuo', delta: 10 },
          { kind: 'mandate-ruler', rulerOfficerId: 'cao-cao', delta: 1 },
          { kind: 'flag', key: 'huatuo-spared' },
        ],
      },
    ],
  },
  {
    id: 'evt-lebusishu',
    name: { en: 'No Longing for Shu', zh: '樂不思蜀' },
    yearMin: 264,
    yearMax: 270,
    requires: [
      { kind: 'flag-set', key: 'shu-fallen-263' },
      { kind: 'officer-alive', officerId: 'liu-shan' },
    ],
    description:
      'Liu Shan, now "Duke of Comfort," is settled at Luoyang. At a banquet Sima Zhao has the musicians play the airs of Shu; the old Shu officials weep into their sleeves while Liu Shan giggles on. "Do you miss Shu?" — "It is pleasant here. I do not think of Shu." The empire laughs; the Duke dies in bed.',
    descriptionZh: '安樂公劉禪徙居洛陽。司馬昭設宴,故奏蜀樂,蜀之舊臣盡皆墮淚,禪嬉笑自若。昭問:「頗思蜀否?」禪曰:「此間樂,不思蜀。」——天下笑之,而安樂公竟以此善終。',
    effects: [{ kind: 'flag', key: 'lebusishu' }],
    mood: 'somber',
  },

  /* ─── 名場面第二批(2026-07)───────────────────────────────────────
     Seven more beats, early to late: 神亭嶺 (Sun Ce's choice), 郭嘉遺計,
     罵死王朗, 木牛流馬, 死諸葛嚇走活仲達 (rides the new wuzhang-star-falls
     flag), 甘露之變 (Cao Mao's blood on the palace road), and 諸葛恪之敗
     (rides sun-quan-gone). */
  {
    id: 'evt-shenting-duel',
    name: { en: 'Duel at Shenting Ridge', zh: '太史慈酣鬥小霸王' },
    yearMin: 195,
    yearMax: 199,
    requires: [
      { kind: 'officer-alive', officerId: 'taishi-ci' },
      { kind: 'officer-alive', officerId: 'sun-ce' },
      { kind: 'officer-rules-cities-min', officerId: 'sun-ce', count: 1 },
    ],
    description:
      'Scouting with a dozen riders, Sun Ce runs into Taishi Ci below Shenting Ridge. The two close alone — a hundred passes, horses lathered, then wrestling in the dirt, each tearing a trophy from the other: Sun Ce takes the short halberd, Taishi Ci the helmet. Neither yields before the armies arrive. Later the ridge-duelist is brought in a prisoner.',
    descriptionZh: '孫策引十三騎探神亭,正遇太史慈。二人獨鬥百合,馬打盤旋,揪撦下馬,策奪其手戟,慈掣其兜鍪,直至兩軍齊至方休。後太史慈兵敗被擒,縛至帳前。',
    effects: [],
    chooserRulerId: 'sun-ce',
    mood: 'martial',
    choices: [
      {
        id: 'recruit',
        label: { zh: '親解其縛:「神亭相戰,公若擒我,還相害否?」', en: 'Unbind him yourself — win him over' },
        effects: [
          { kind: 'officer-join-ruler', officerId: 'taishi-ci', rulerOfficerId: 'sun-ce' },
          { kind: 'officer-loyalty', officerId: 'taishi-ci', delta: 10 },
          { kind: 'flag', key: 'shenting-recruited' },
        ],
      },
      {
        id: 'release',
        label: { zh: '各為其主,義而縱之', en: 'Each serves his lord — set him free' },
        effects: [
          { kind: 'mandate-ruler', rulerOfficerId: 'sun-ce', delta: 1 },
          { kind: 'flag', key: 'shenting-released' },
        ],
      },
    ],
  },
  {
    id: 'evt-guojia-legacy',
    name: { en: "Guo Jia's Dying Counsel", zh: '郭嘉遺計定遼東' },
    yearMin: 207,
    yearMax: 208,
    requires: [
      { kind: 'officer-alive', officerId: 'guo-jia' },
      { kind: 'officer-rules-cities-min', officerId: 'cao-cao', count: 5 },
    ],
    description:
      'On the hard road back from Liucheng, Guo Fengxiao dies at thirty-eight — leaving a sealed letter. Do not march on Liaodong: press it, and Gongsun Kang will shelter the Yuan brothers; wait, and he will send their heads. Cao Cao waits. The heads arrive. "Fengxiao knew men to the bone."',
    descriptionZh: '柳城歸途,郭奉孝病卒,年三十八,遺書一封:遼東不可攻——急之則公孫康與二袁併力,緩之則自相圖。曹公按兵不動,旬日,公孫康果送二袁首級至。公臨其喪,哀甚:「奉孝知人,吾不及也。」',
    effects: [
      { kind: 'officer-status', officerId: 'guo-jia', status: 'dead' },
      { kind: 'mandate-ruler', rulerOfficerId: 'cao-cao', delta: 2 },
      { kind: 'force-gold-ruler', rulerOfficerId: 'cao-cao', delta: 300 },
      { kind: 'flag', key: 'guojia-farewell' },
    ],
    mood: 'somber',
  },
  {
    id: 'evt-scolding-wanglang',
    name: { en: 'Scolding Wang Lang to Death', zh: '武鄉侯罵死王朗' },
    yearMin: 227,
    yearMax: 229,
    requires: [
      { kind: 'officer-active', officerId: 'zhuge-liang' },
      { kind: 'officer-alive', officerId: 'wang-lang' },
      { kind: 'officer-rules-cities-min', officerId: 'liu-shan', count: 3 },
    ],
    description:
      'Before the lines at Qishan, old Minister Wang Lang rides out to talk Zhuge Liang into surrender with smooth words about the Mandate having shifted. The Prime Minister answers from his carriage — a public accounting of every year Wang Lang served the Han and every year he helped bury it. The old man reels, cries out once, and drops dead from his horse.',
    descriptionZh: '兩軍陣前,司徒王朗出馬,巧言天命有歸,勸丞相倒戈卸甲。孔明於車上朗聲數其歷仕漢朝、反助篡逆之罪:「皓首匹夫!蒼髯老賊!汝即日將歸於九泉之下,何面目見二十四帝乎!」朗聽罷,大叫一聲,撞死於馬下。',
    effects: [
      { kind: 'officer-status', officerId: 'wang-lang', status: 'dead' },
      { kind: 'mandate-ruler', rulerOfficerId: 'liu-shan', delta: 1 },
      { kind: 'flag', key: 'wanglang-scolded' },
    ],
    mood: 'martial',
  },
  {
    id: 'evt-muniu-liuma',
    name: { en: 'Wooden Oxen, Gliding Horses', zh: '木牛流馬' },
    yearMin: 231,
    yearMax: 234,
    requires: [
      { kind: 'officer-active', officerId: 'zhuge-liang' },
      { kind: 'city-owner-ruler', cityId: 'chengdu', rulerOfficerId: 'liu-shan' },
    ],
    description:
      'Grain has broken every northern campaign before the soldiers did. This time carpenters fill the Xie Valley road with Zhuge Liang\'s contraptions — wooden oxen and gliding horses that walk the plank-roads without fodder or complaint, tongues that lock so captured ones stand useless. The granaries of Chengdu flow to the front.',
    descriptionZh: '歷次北伐,皆困於糧。此番丞相造木牛流馬,不食不飲,踏棧道而行,扭其舌則不能動,魏人奪之無用。成都之糧,源源濟於祁山前線。',
    effects: [
      { kind: 'city-food', cityId: 'chengdu', delta: 6000 },
      { kind: 'flag', key: 'muniu-liuma' },
    ],
    mood: 'auspicious',
  },
  {
    id: 'evt-dead-zhuge-scare',
    name: { en: 'A Dead Zhuge Routs a Living Zhongda', zh: '死諸葛嚇走活仲達' },
    yearMin: 234,
    yearMax: 235,
    requires: [
      { kind: 'flag-set', key: 'wuzhang-star-falls' },
      { kind: 'officer-alive', officerId: 'sima-yi' },
      { kind: 'officer-alive', officerId: 'jiang-wei' },
    ],
    description:
      'The star has fallen, and Sima Yi finally gives chase — until the Shu rearguard wheels about, banners parting around a four-wheeled carriage and a seated figure in a crane cloak, feather fan in hand. Sima Yi flees fifty li clutching his own head: "Is it still on my neck?" The figure was wood. The retreat is flawless.',
    descriptionZh: '將星既隕,司馬懿方敢來追。蜀軍忽然回旗返鼓,四輪車上,綸巾羽扇,端坐如生。懿大驚:「孔明尚在!」策馬奔五十里,撫首問:「吾頭尚在否?」——車上乃木人也。蜀軍從容全師而退。',
    effects: [
      { kind: 'officer-loyalty', officerId: 'jiang-wei', delta: 5 },
      { kind: 'mandate-ruler', rulerOfficerId: 'liu-shan', delta: 1 },
      { kind: 'flag', key: 'dead-zhuge-scare' },
    ],
    mood: 'mystic',
  },
  {
    id: 'evt-caomao-blood',
    name: { en: "Sima Zhao's Heart", zh: '司馬昭之心' },
    yearMin: 260,
    yearMax: 260,
    requires: [
      { kind: 'officer-alive', officerId: 'cao-mao' },
      { kind: 'officer-alive', officerId: 'sima-zhao' },
    ],
    description:
      '"Sima Zhao\'s heart — every passerby knows it." The boy emperor Cao Mao will not sit and wait to be deposed: he gathers the palace guards and pot-boys and drives his carriage at the regent\'s gates. On the southern avenue Cheng Ji runs a halberd through the Son of Heaven. Sima Zhao weeps in public, executes the hand that did it, and takes another step toward the throne.',
    descriptionZh: '「司馬昭之心,路人所知也!」少帝曹髦不甘坐而受廢,率殿中宿衛蒼頭數百,鼓譟而出討昭。至南闕,成濟抽戈犯蹕,弒帝於車下。昭匿其主謀,斬成濟三族以塞天下之口——而代魏之階,又進一級。',
    effects: [
      { kind: 'officer-status', officerId: 'cao-mao', status: 'dead' },
      { kind: 'flag', key: 'caomao-slain' },
    ],
    mood: 'ominous',
  },
  {
    id: 'evt-zhugeke-fall',
    name: { en: 'The Fall of Zhuge Ke', zh: '諸葛恪之敗' },
    yearMin: 253,
    yearMax: 254,
    requires: [
      { kind: 'flag-set', key: 'sun-quan-gone' },
      { kind: 'officer-alive', officerId: 'zhuge-ke' },
    ],
    description:
      'Regent since Sun Quan\'s death and drunk on his victory at Dongxing, Zhuge Ke throws two hundred thousand men at Xincheng against every remonstrance — and brings back plague, defeat, and a court that has stopped forgiving him. At a banquet in the palace, Sun Jun\'s swordsmen step out from behind the screens. The wisest clan of the age loses its Wu branch in one evening.',
    descriptionZh: '孫權既沒,諸葛恪輔政,恃東興之捷,違眾議舉二十萬攻新城,師老疫起,喪敗而還,猶自若也。孫峻伏兵於殿,宴中殺之,夷其三族。諸葛一門,吳枝一夕而折。',
    effects: [
      { kind: 'officer-status', officerId: 'zhuge-ke', status: 'dead' },
      { kind: 'flag', key: 'zhugeke-purged' },
    ],
    mood: 'ominous',
  },
];

export const EVENTS_BY_ID: Record<string, HistoricalEvent> = Object.fromEntries(
  HISTORICAL_EVENTS.map((e) => [e.id, e]),
);
