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
  {
    id: 'evt-battle-of-yiling',
    name: { en: 'The Battle of Yiling', zh: '夷陵之戰' },
    yearMin: 222,
    yearMax: 223,
    requires: [
      { kind: 'force-alive', forceId: 'force-liu-bei' },
      { kind: 'force-alive', forceId: 'force-sun-quan' },
    ],
    description:
      'Liu Bei marches east to avenge Guan Yu. Lu Xun, fresh-faced and underestimated, lets him exhaust himself, then burns his camps across seven hundred li. The Shu host is annihilated.',
    descriptionZh: "劉備東征為關羽復仇。陸遜年少氣盛卻深諳兵法,坐視蜀軍疲憊,而後火燒連營七百里。蜀軍幾乎全軍覆沒。",
    effects: [
      { kind: 'force-troops-multiplier', forceId: 'force-liu-bei', multiplier: 0.5 },
    ],
  },
  {
    id: 'evt-liu-bei-dies',
    name: { en: 'Liu Bei Dies at Baidicheng', zh: '劉備，白帝城没' },
    yearMin: 223,
    yearMax: 223,
    requires: [{ kind: 'officer-active', officerId: 'liu-bei' }],
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
    effects: [{ kind: 'flag', key: 'northern-campaigns-begun' }],
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
      { kind: 'city-loyalty', cityId: 'city-xiapi', delta: -30 },
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
    effects: [{ kind: 'flag', key: 'heroes-over-wine' }],
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
    effects: [{ kind: 'flag', key: 'bowang-fire' }],
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
];

export const EVENTS_BY_ID: Record<string, HistoricalEvent> = Object.fromEntries(
  HISTORICAL_EVENTS.map((e) => [e.id, e]),
);
