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
    /*
     * 十月。**這一節原本在第 1 回合就演完了** —— 決定官渡勝負的那把火,燒在
     * 白馬斬顏良(第 11 回合)之前、兩軍相持(第 3 回合)之前。體檢十二輪
     * 都是這個順序。
     *
     * 許攸是相持到糧將盡的時候才夜奔而來的,那是這場仗打了半年之後的事,
     * 不是開場第一句。
     *
     * ⚠ 鎖「秋」沒有用 —— **這張盤的開局就是 200 年秋**,於是秋鎖在第 1 回合
     * 就成立,十輪實測仍然全部落在第 1–2 回合。鎖冬才真的把它推到相持之後
     * (十月,正是史書給的月份)。**季節鎖要對照劇本的開局季節看**,
     * 這是 184、190 兩張春天開局的盤上不會遇到的坑。
     */
    season: 'winter',
    /*
     * ⚠ 一度在這裡加了 `flag-set: baima-yanliang`(讓烏巢排在白馬之後)——
     * 十輪實測**整條鏈 0/10**。原因是白馬那一節要 `guan-yu-with-cao`,
     * 而官渡盤上關羽在劉備麾下(史實上他 200 年正月下邳城破才降曹),
     * 那個旗標在這張盤根本設不起來 —— 開關取不到,底下全靜默。
     * 這與 190 盤上「討董鎖春導致整條鏈不演」是同一個教訓:
     * **順序交給季節,不要交給一個可能永遠設不上的旗標。**
     */
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
    /*
     * 窗口 212 → 218(2026-08-08)。原本從 212 年開就開,而**史書上這是
     * 建安二十四年(219)冬的事**,前提是關羽北伐襄樊、盡起江陵之兵而後方空虛
     * ——「羽果信之,稍撤兵以赴樊」。
     *
     * 量得出來的後果:213 落鳳坡盤 12 輪**每一輪第 1 回合就演**,關羽當場身死,
     * 劉備 18 城掉到 10。214、215 兩張盤同型。也就是說荊州易主在這幾張盤上
     * 不是一場戰役,是開局的一則公告。
     *
     * 另加一條守衛:江陵得在關羽(劉備)手裡 —— 白衣渡江渡的是那座城,
     * 城不在他手上這一幕沒有對象。
     */
    yearMin: 218,
    yearMax: 225,
    requires: [
      { kind: 'officer-active', officerId: 'lu-meng' },
      { kind: 'officer-alive', officerId: 'guan-yu' },
      { kind: 'officer-alive', officerId: 'sun-quan' },
      { kind: 'city-owner-ruler', cityId: 'jiangling', rulerOfficerId: 'liu-bei' },
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
      'Your vanguard reaches Xicheng and finds the gates wide open — Kongming alone on the wall, burning incense, playing the guqin. Fifteen萬 men halt at the sound of one instrument.',
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
    /*
     * 夏 → 冬,且須聯軍已起。原本無條件觸發,於是關東還沒起兵,董卓就先把
     * 洛陽燒了 —— 焚都遷都是**被逼出來的**,不是他的日程表。
     * 排在虎牢關(秋)之後:汜水、虎牢兩關既撞,而後西遷。
     */
    season: 'winter',
    requires: [
      { kind: 'force-alive', forceId: 'force-dong-zhuo' },
      { kind: 'flag-set', key: 'coalition-formed' },
    ],
    description:
      'Pressed by the coalition, Dong Zhuo torches the imperial capital and flees with the boy emperor to Chang\'an. Luoyang lies in ruins; loyalty collapses across the Central Plain.',
    descriptionZh: "迫於聯軍壓境,董卓焚毀帝都,挾少帝西遷長安。洛陽化為廢墟,中原民心崩潰。",
    effects: [
      /*
       * ⚠ 原本只有一條民忠 −40,而且城 id 寫成 'city-luoyang' —— 盤上沒有這個
       *   id(城 id 就叫 luoyang),查不到城靜默跳過,這條效果從沒生效過。
       *
       * 補成一座真的被燒過的城。史書:「盡徙洛陽人數百萬口於長安,悉燒宮廟
       * 官府居家,二百里內無復雞犬。」而盤面上原本焚完之後,洛陽的城防、
       * 守軍、倉廩一分未動 —— 董卓照樣拿它當都城守到二百年後。
       *
       * 這一條同時解開兩個卡住的目標:孫堅的「攻取洛陽」與曹操的「據有洛陽
       * 與許昌」在體檢裡都是 0/12,而洛陽是全盤最硬的一座城(董卓十七將、
       * 十萬兵)。史實上他們面對的不是那座洛陽,是一片焦土 —— 孫堅入洛之日
       * 「城中無雞犬,火猶未熄」。燒過之後城該是可取的,那才是這一節的意義。
       */
      { kind: 'city-loyalty', cityId: 'luoyang', delta: -40 },
      { kind: 'city-defense', cityId: 'luoyang', delta: -30 },
      { kind: 'city-troops-multiplier', cityId: 'luoyang', multiplier: 0.45 },
      { kind: 'city-food', cityId: 'luoyang', delta: -30000 },
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
    yearMax: 202,
    /*
     * 這一節**是烏巢那把火的結果,不是它的前提**。原本無條件、無季節,體檢
     * 十二輪都在第 3 回合觸發 —— 於是袁紹的兵在他還沒渡河之前就先折了四成,
     * 而許攸要到第 1 回合就已經夜奔過了(那條也沒鎖)。
     *
     * 現在要 `wuchao-burned`:選了「親率輕騎夜襲烏巢」才有這一場大潰。
     * 選「疑有詐,按兵不動」的話,這一節不演 —— 相持下去,而糧盡的是自己。
     * 那正是史書給的那個岔路口,也是這張盤唯一一個真正決定勝負的選擇。
     *
     * 排在烏巢的下一季(春):火在十月,而袁紹渡河北走、倉亭再敗是次年的事。
     */
    season: 'spring',
    requires: [
      { kind: 'flag-set', key: 'wuchao-burned' },
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
  /* ─── 江東三節 —— 195 盤的收尾(chooser: 孫策) ─────────────────
     195 孫策定江東的事件只有兩節:孫策征江東(第 1 回合)與太史慈酣鬥
     小霸王(第 2 回合),此後三百餘回合沒有一件與江東有關的事。而他打的
     那四家各有各的下場,史書寫得清清楚楚:王朗浮海而遁、華歆葛巾迎於道左、
     嚴白虎的部下被許昭所庇而孫策不追。補三節,各自綁在**真的打下那座城**
     之後 —— 與 184 宛城之圍同一個手法:戲是戰果的回響,不是戰果的前提。 */
  {
    id: 'evt-wanglang-sea',
    name: { en: 'Wang Lang Puts to Sea', zh: '王朗浮海' },
    yearMin: 195,
    yearMax: 200,
    requires: [
      { kind: 'officer-active', officerId: 'sun-ce' },
      { kind: 'city-owner-ruler', cityId: 'kuaiji', rulerOfficerId: 'sun-ce' },
      { kind: 'flag-unset', key: 'wanglang-fled' },
    ],
    description:
      "Wang Lang would not step aside — 'I am an officer of Han; I ought to hold my walls' — and met you at Guling, and could not be carried. Your uncle Sun Jing took the Zhadu road by night while the fires burned as a decoy, and the camp at Gaoqian fell. Now Wang Lang is at sea, running for Dongye, and the question is whether that is far enough.",
    descriptionZh:
      '王朗不肯避,曰:「吾為漢吏,宜保城邑。」拒於固陵,數渡水戰而不能克。'
      + '叔父孫靜獻策:夜多然火為疑兵,分軍投查瀆道,襲高遷屯 —— 朗大駭,浮海而遁。'
      + '今其舟已出東冶,而追與不追,在你一念。',
    chooserRulerId: 'sun-ce',
    choices: [
      {
        id: 'pursue',
        label: { zh: '追至東冶,取之而後禮', en: 'Run him down at Dongye — then treat him well' },
        effects: [
          { kind: 'mandate-ruler', rulerOfficerId: 'sun-ce', delta: 5 },
          { kind: 'city-loyalty', cityId: 'kuaiji', delta: 8 },
          { kind: 'flag', key: 'wanglang-fled' },
        ],
      },
      {
        id: 'let-go',
        label: { zh: '縱之入海 —— 儒者不必窮追', en: 'Let the sea have him' },
        effects: [
          { kind: 'city-loyalty', cityId: 'kuaiji', delta: 14 },
          { kind: 'flag', key: 'wanglang-fled' },
        ],
      },
    ],
    effects: [],
  },
  {
    id: 'evt-huaxin-welcome',
    name: { en: 'Hua Xin at the Roadside', zh: '華歆葛巾迎' },
    yearMin: 195,
    yearMax: 201,
    requires: [
      { kind: 'officer-active', officerId: 'sun-ce' },
      { kind: 'city-owner-ruler', cityId: 'yuzhang', rulerOfficerId: 'sun-ce' },
      { kind: 'flag-unset', key: 'huaxin-welcomed' },
    ],
    description:
      "Yu Fan went ahead to talk: the general is a strategist beyond his age, and Your Honour has no talent for war. Hua Xin heard him out and said he had long wanted to go north anyway. Next morning he came out to the roadside in a plain kerchief, and Yuzhang never knew there had been an army in it.",
    descriptionZh:
      '虞翻先往說之:「討逆將軍智略超世,用兵如神。府君無用兵之才,不如避之。」'
      + '歆曰:「久在江表,常欲北歸;孫會稽來,吾便去也。」明日,葛巾迎於道左 ——'
      + '豫章之民,不知有兵。',
    effects: [
      { kind: 'mandate-ruler', rulerOfficerId: 'sun-ce', delta: 8 },
      { kind: 'city-loyalty', cityId: 'yuzhang', delta: 18 },
      { kind: 'flag', key: 'huaxin-welcomed' },
    ],
    mood: 'auspicious',
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
    // 三顧正鏈(evt-maolu-1/2/3)沒走成時的**退路**,靠 flag-unset maolu-visit-1
    // 與鏈末那一節互斥。同名是刻意的 —— 見 eventExclusivity.test.ts 的說明。
    name: { en: 'Three Visits to the Thatched Cottage', zh: '三顧茅廬' },
    yearMin: 207,
    yearMax: 211,
    /* ⚠ 這是**沒有走過三顧鏈**的盤才用的簡述版(例如開局已過 207 年、或
       司馬徽不在場)。原本寫的是 `flag-set: maolu-abandoned` —— 意思剛好相反:
       玩家在鏈裡明白選了「罷了,天下何處無賢才」之後,系統反手把諸葛亮送上門,
       把那個選擇整個抹掉。改成「鏈從未開始」才算(兩個旗標都沒有)。 */
    requires: [
      { kind: 'flag-unset', key: 'maolu-visit-1' },
      { kind: 'flag-unset', key: 'maolu-abandoned' },
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
      { kind: 'flag-set', key: 'east-wind-borrowed' },
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
    name: { en: 'The Fall of Guan Yu', zh: '關羽，麥城死' },
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
    name: { en: 'Liu Bei Dies at Baidicheng', zh: '劉備，白帝城沒' },
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
    name: { en: 'Seven Steps to Spare a Brother', zh: '七步詩' },
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
    /*
     * 官渡這一鏈原本一節都沒鎖季節,體檢十二輪跑出來的順序是:
     * **烏巢第 1 回合、官渡之戰第 3、白馬斬顏良第 11** —— 決定勝負的那把火
     * 燒在開戰之前,而斬顏良發生在戰役結束之後。史實的順序是
     * 白馬(二月)→ 延津 → 官渡相持(八月至十月)→ 烏巢(十月)→ 大潰。
     *
     * 這一節是開頭,鎖春;下游用旗標串起來。
     * (同名的第二條 evt-baima-yan-liang 已刪 —— 兩條同一個場面,名字一字不差,
     *  而互斥條件各查各的旗標,誰先誰後全看列表順序。)
     */
    season: 'spring',
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
      // 併掉的那條設的是 yan-liang-slain,一併設上,免得舊存檔/成就讀不到。
      { kind: 'flag', key: 'baima-yanliang' },
      { kind: 'flag', key: 'yan-liang-slain' },
      { kind: 'mandate-ruler', rulerOfficerId: 'yuan-shao', delta: -2 },
      { kind: 'flag', key: 'baima-yanliang' },
    ],
    mood: 'martial',
  },
  {
    id: 'evt-guan-yu-five-passes',
    name: { en: "Past Five Passes, Six Generals", zh: '過五關斬六將' },
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
    name: { en: 'Disaster at Wancheng', zh: '宛城之變' },
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
      // 抉擇鏈(evt-chibi-1/2/3)跑起來的時候,這一套旁白版讓位 ——
      // 與 evt-battle-of-red-cliffs 同一條規則,否則同一場赤壁會演兩套。
      { kind: 'flag-unset', key: 'chibi-chain-started' },
      { kind: 'flag-set', key: 'chain-ships-set' },
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
    yearMin: 258,
    yearMax: 262,
    // 這條原本是「一句話概括三場叛亂」,窗口 251–258 —— 而三場現在各自有了具體
    // 的一節(evt-wangling-plot / evt-wenyang-raid / evt-zhuge-dan-shouchun)。
    // 第一版只給它加 flag-unset 讓它別重複,結果是**誰先搖到誰演**:六輪裡
    // 概括條搶走四輪,具體的王淩只演到兩輪。改成往後挪、並要求三叛的最後一場
    // 已經發生 —— 它於是從「三選一的替身」變成三叛之後的收束。
    requires: [{ kind: 'flag-set', key: 'zhuge-dan-revolt' }],
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
      "After a month's standoff at Ruxu, Cao Cao beholds the taut order of Sun Quan's ships and ranks and sighs in admiration: 'Would that I had a son like Sun Zhongmou! Liu Biao's boys were pigs and dogs beside him.' He gathers his army and turns north.",
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
      "When his father is killed by Tao Qian's officers, Cao Cao raises an army of vengeance; where it passes, the slaughter is such that the Si River ceases to flow. Terrified, Tao Qian thrice offers Xuzhou to Liu Bei. Cao Cao's name for cruelty spreads far, and the people of Xuzhou hate him to the bone.",
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
  // ─────────── 經典橋段補遺(2026-07 第四批):討董與河北 ───────────
  {
    id: 'evt-coalition-formed',
    name: { en: 'The Coalition Against Dong Zhuo', zh: '十八路諸侯討董' },
    yearMin: 190,
    yearMax: 190,
    /*
     * 這一鏈原本一節都沒鎖季節,體檢十二輪跑出來是:討董第 2 回合、三英第 4、
     * 玉璽第 6、焚洛陽第 9 —— 兩年多的事,十一個旬演完,而且玉璽比洛陽起火
     * 還早三回合撈上來。節奏由**下游**四節的季節鎖來扛(夏華雄、秋三英、
     * 冬焚洛陽),而這一節是整條鏈的**開關**,刻意不鎖季節:
     *
     * 一度也給它鎖了春(190 正月起兵),六輪追下來有一輪整條鏈沒演 ——
     * 春天只有九個旬,而每旬只放行一個事件,它得跟同期的其他事件搶。開關
     * 一旦沒開,底下四節全靜默(都要 coalition-formed)。給它一整年,
     * 開關就不會漏,而順序仍由下游的季節鎖決定。
     */
    requires: [
      { kind: 'officer-active', officerId: 'dong-zhuo' },
      { kind: 'officer-active', officerId: 'yuan-shao' },
      { kind: 'flag-unset', key: 'coalition-dissolved' },
    ],
    description:
      "Cao Cao forges an edict and speeds it to every march. Eighteen lords of the east answer, gathering at Suanzao to smear their lips with blood and swear to destroy Dong Zhuo. Yuan Shao is raised to alliance-chief and given the axe of command. Banners blot out the fields — yet each lord harbours his own designs, and the seed of the coalition's collapse is sown on the very day of the oath.",
    descriptionZh:
      "曹操矯詔,馳報各鎮。關東諸侯十八路響應,會盟於酸棗,歃血為誓,共討董卓。眾推袁紹為盟主,拜將授鉞。旌旗蔽野,聲勢震天 —— 然各懷異心,離散之機,已伏於會盟之日。",
    effects: [
      { kind: 'mandate-ruler', rulerOfficerId: 'dong-zhuo', delta: -4 },
      { kind: 'flag', key: 'coalition-formed' },
    ],
    mood: 'martial',
  },
  {
    id: 'evt-sanying-lubu',
    name: { en: 'Three Heroes Battle Lü Bu', zh: '三英戰呂布' },
    yearMin: 190,
    yearMax: 191,
    season: 'autumn',   // 汜水關既破,而後虎牢
    /*
     * 這個場面原本在事件表裡有**兩條**(另一條是 evt-three-heroes-lu-bu),
     * 名字一字不差。互斥只做了一半:後者查 flag-unset sanying-lubu,而前者
     * 不查後者的旗標 —— 於是呂布若正好負傷(前者要 active,後者只要 alive),
     * 後者先演,旗標沒設,等呂布傷癒前者再演一次,虎牢關前打兩場。
     * 現在併成一條:取兩者條件的聯集(三英俱在、呂布尚存),刪掉重複的那條。
     */
    requires: [
      { kind: 'flag-set', key: 'hua-xiong-slain' },
      { kind: 'officer-alive', officerId: 'lu-bu' },
      { kind: 'officer-active', officerId: 'liu-bei' },
      { kind: 'officer-active', officerId: 'guan-yu' },
      { kind: 'officer-active', officerId: 'zhang-fei' },
    ],
    description:
      "Before Hulao Pass, Lü Bu cuts down champion after champion of the coalition; none can stand against him. Zhang Fei charges with his spear — fifty bouts, no decision; Guan Yu joins with his blade — thirty more; then Liu Bei draws his twin swords into the fray. The three ring the Marquis of Wen, who can no longer parry, and breaks for the pass. From that day the realm knows the valour of the Peach Garden.",
    descriptionZh:
      "虎牢關前,呂布連斬諸侯上將,無人能敵。張飛挺矛直取,鬥五十合不分;關羽舞刀夾攻,又三十合;劉備掣雙股劍助戰。三英環戰溫侯,呂布遮攔不住,望關而走。天下由是知桃園之勇。",
    effects: [
      { kind: 'mandate-ruler', rulerOfficerId: 'dong-zhuo', delta: -3 },
      // 三英各得其分 —— 併掉的那條給三兄弟各 +3,這裡一併收下,不讓合併吃掉效果。
      { kind: 'officer-loyalty', officerId: 'zhang-fei', delta: 5 },
      { kind: 'officer-loyalty', officerId: 'guan-yu', delta: 3 },
      { kind: 'officer-loyalty', officerId: 'liu-bei', delta: 3 },
      { kind: 'flag', key: 'sanying-lubu' },
      // 舊旗標一併設上 —— 存檔或成就若引用過它,合併之後仍讀得到。
      { kind: 'flag', key: 'three-heroes-vs-lu-bu' },
    ],
    mood: 'martial',
  },
  {
    id: 'evt-jieqiao-battle',
    name: { en: 'The Battle of Jieqiao', zh: '界橋之戰' },
    yearMin: 191,
    yearMax: 193,
    requires: [
      { kind: 'officer-active', officerId: 'gongsun-zan' },
      { kind: 'officer-active', officerId: 'yuan-shao' },
    ],
    description:
      "Gongsun Zan's White Horse Volunteers range unchecked across Hebei until they meet Yuan Shao at Jieqiao. Yuan's general Ju Yi hides eight hundred strong crossbows beneath shields; when the white riders close, a thousand bolts loose at once, the Volunteers shatter, and their commander Yan Gang falls. Here a young Zhao Yun still rides under Gongsun — but the north, from this day, passes to Yuan.",
    descriptionZh:
      "公孫瓚以白馬義從縱橫河北,與袁紹戰於界橋。紹將麴義以八百強弩伏於盾下,待白馬軍近,千弩俱發,義從大潰,斬其大將嚴綱。趙雲於此陣中猶隨公孫;而河北之勢,自此歸於袁氏。",
    effects: [
      { kind: 'force-troops-multiplier-ruler', rulerOfficerId: 'gongsun-zan', multiplier: 0.9 },
      { kind: 'officer-loyalty', officerId: 'ju-yi', delta: 6 },
      { kind: 'flag', key: 'jieqiao-battle' },
    ],
    mood: 'martial',
  },
  {
    id: 'evt-sunjian-death',
    name: { en: 'Sun Jian Falls at Mount Xian', zh: '孫堅跨江隕峴山' },
    yearMin: 191,
    yearMax: 193,
    requires: [{ kind: 'officer-active', officerId: 'sun-jian' }],
    description:
      "Sun Jian crosses the river to strike Liu Biao and besieges Xiangyang. Liu Biao's general Huang Zu is routed and flees; Sun Jian, pressing the pursuit, rides alone into the hills of Mount Xian. Huang Zu's men lie hidden in the bamboo, and a hail of arrows splits his skull. The lord of the Southland dies at thirty-seven, undone by his own daring. His eldest son Sun Ce bears the coffin home, and swears to avenge his father.",
    descriptionZh:
      "孫堅跨江擊劉表,圍襄陽。表將黃祖敗走,堅乘勝追之,單馬入峴山。祖伏軍於竹林間,亂箭齊發,堅腦裂而亡,年三十七。江東之主,竟殞於一時之勇。長子孫策扶柩歸葬,誓報父仇 —— 江東基業,自此由孫策肇之。",
    effects: [
      { kind: 'officer-status', officerId: 'sun-jian', status: 'dead' },
      { kind: 'officer-loyalty', officerId: 'sun-ce', delta: 10 },
      { kind: 'flag', key: 'sunjian-death' },
    ],
    mood: 'somber',
  },

  // ─────────── 經典橋段補遺(2026-07 第三批):開局與奸雄 ───────────
  {
    id: 'evt-caocao-blade',
    name: { en: 'Cao Cao Offers the Blade', zh: '孟德獻刀' },
    yearMin: 189,
    yearMax: 190,
    requires: [
      { kind: 'officer-active', officerId: 'cao-cao' },
      { kind: 'officer-active', officerId: 'dong-zhuo' },
    ],
    description:
      "Feigning devotion, Cao Cao borrows Wang Yun's Seven-Star blade to kill Dong Zhuo. As the tyrant dozes, Cao draws — but Dong glimpses him in the mirror, and Cao must turn the strike into the gift of the blade. The plot fails; Cao flees east on a fast horse, spends his fortune, forges an imperial edict, and the lords of the east begin to gather to him.",
    descriptionZh:
      "王允假意獻媚董卓，曹操借得七星寶刀，欲刺之。卓臥榻假寐，操拔刀在手，卓從衣鏡中窺見，操急跪改為獻刀。事敗，操飛馬東逃。散盡家財，矯詔起兵——關東群雄由是而集，討董之勢成矣。",
    effects: [
      { kind: 'mandate-ruler', rulerOfficerId: 'cao-cao', delta: 3 },
      { kind: 'mandate-ruler', rulerOfficerId: 'dong-zhuo', delta: -3 },
      { kind: 'flag', key: 'caocao-blade' },
    ],
    mood: 'martial',
  },
  {
    id: 'evt-chen-gong-release',
    name: { en: 'Chen Gong Frees and Forsakes Cao', zh: '陳宮捉放曹' },
    yearMin: 189,
    yearMax: 190,
    requires: [
      { kind: 'officer-active', officerId: 'cao-cao' },
      { kind: 'officer-active', officerId: 'chen-gong' },
    ],
    description:
      "Fleeing the failed assassination, Cao Cao is caught at Zhongmou by the magistrate Chen Gong. Honouring his stand against the tyrant, Chen quits his post to flee with him. But at Lü Boshe's house Cao, suspecting a trap, slaughters the whole household — then kills Boshe himself, returning with wine: 'Better I wrong the world than the world wrong me.' Seeing such cruelty, Chen Gong slips away in the night.",
    descriptionZh:
      "曹操行刺事敗，逃至中牟，為縣令陳宮所擒。宮敬其為國除賊之義，棄官同逃。途經呂伯奢家，操疑其謀己，盡殺其家，又殺沽酒而歸之伯奢，曰：「寧教我負天下人，休教天下人負我。」宮見其忍，夜半棄之而去 —— 是為日後白門樓之伏筆。",
    effects: [
      { kind: 'officer-loyalty', officerId: 'chen-gong', delta: 5 },
      { kind: 'flag', key: 'chen-gong-release' },
    ],
    mood: 'somber',
  },
  {
    id: 'evt-changsha-huangzhong',
    name: { en: 'The Duel at Changsha', zh: '戰長沙義釋黃忠' },
    yearMin: 208,
    yearMax: 210,
    requires: [
      { kind: 'officer-active', officerId: 'guan-yu' },
      { kind: 'officer-active', officerId: 'huang-zhong' },
    ],
    description:
      "Guan Yu battles the veteran Huang Zhong at Changsha. When Huang's horse stumbles, Guan Yu spares him rather than strike a fallen man; the next day Huang, in gratitude, looses only empty shots. Governor Han Xuan, suspecting treason, moves to behead him — but Wei Yan cuts Han Xuan down and yields Changsha to Liu Bei. Old Huang Zhong and fierce Wei Yan enter Shu together.",
    descriptionZh:
      "關羽攻長沙，與老將黃忠大戰百合不分。忠馬失前蹄，羽念其義，不殺而縱之。次日忠感其恩，虛拽弓弦，止射盔纓。太守韓玄疑忠通敵，欲斬之。魏延奮起殺玄，開城獻長沙以降劉備。老將黃忠、猛將魏延，自此歸於西蜀。",
    effects: [
      { kind: 'mandate-ruler', rulerOfficerId: 'liu-bei', delta: 4 },
      { kind: 'officer-loyalty', officerId: 'huang-zhong', delta: 8 },
      { kind: 'flag', key: 'changsha-huangzhong' },
    ],
    mood: 'martial',
  },
  {
    id: 'evt-puyang-fire',
    name: { en: 'Fire at Puyang', zh: '濮陽之戰' },
    yearMin: 194,
    yearMax: 194,
    requires: [
      { kind: 'officer-active', officerId: 'lu-bu' },
      { kind: 'officer-active', officerId: 'cao-cao' },
    ],
    description:
      "Lü Bu holds Puyang and grinds against Cao Cao. Lured by Chen Gong's ruse into the city by night, Cao finds the four gates ablaze and ambushers pouring out. In the flames he blunders into Lü Bu himself, who cracks him on the helm with his halberd — 'Where is Cao Cao?' — and Cao points ahead at another to escape, his hair and beard singed off. Dian Wei fights him free; Cao all but dies at Puyang.",
    descriptionZh:
      "呂布據濮陽，與曹操相持。操中陳宮之計，夜入濮陽，四門火起，伏兵盡出。操於火中撞見呂布，布以戟擊操盔，問「曹操何在」，操反指前騎紿之，乃得脫，鬚髮盡燒。典韋拼死殺入救主，操幾殞於濮陽。呂布之勇，一時無兩。",
    effects: [
      { kind: 'force-troops-multiplier-ruler', rulerOfficerId: 'cao-cao', multiplier: 0.9 },
      { kind: 'flag', key: 'puyang-fire' },
    ],
    mood: 'ominous',
  },
  {
    id: 'evt-jiping-poison',
    name: { en: "Ji Ping's Poison", zh: '吉平下毒' },
    yearMin: 199,
    yearMax: 200,
    requires: [
      { kind: 'officer-active', officerId: 'ji-ping' },
      { kind: 'officer-active', officerId: 'cao-cao' },
    ],
    description:
      "The Girdle Edict sworn, the physician Ji Ping conspires with Dong Cheng to poison Cao Cao. Cao feigns illness and summons him; Ji Ping mixes the poison in — but Cao, forewarned, seizes and tortures him. Cursing to the last, Ji Ping dashes his head on the steps and bites off a finger to seal his oath. Five households, Dong Cheng's among them, are exterminated. The edict's plot drowns Xuchang in blood.",
    descriptionZh:
      "衣帶詔既成，太醫吉平與董承同謀，欲以毒藥弒曹操。操詐病召平進藥，平下毒於中，操覺，執而拷之。平怒罵不絕，觸階而死，斷指以明志。董承等五家，盡皆族滅。衣帶詔之謀，血染許都 —— 漢室最後一次由內傾曹之舉，就此煙消。",
    effects: [
      { kind: 'officer-status', officerId: 'ji-ping', status: 'dead' },
      { kind: 'mandate-ruler', rulerOfficerId: 'cao-cao', delta: -3 },
      { kind: 'flag', key: 'jiping-poison' },
    ],
    mood: 'ominous',
  },
  {
    id: 'evt-caocao-dream',
    name: { en: 'Murder in a Dream', zh: '曹操夢中殺人' },
    yearMin: 200,
    yearMax: 215,
    requires: [{ kind: 'officer-active', officerId: 'cao-cao' }],
    description:
      "Fearing assassination, Cao Cao pretends: 'In my dreams I kill — when I sleep, none of you come near.' One day, dozing, his blanket slips; an attendant picks it up to cover him, and Cao springs up, cuts him down, and lies back to sleep. Rising later, he feigns shock and grief. At the burial Yang Xiu points and sighs: 'It is not the Chancellor who dreamed — it is you, my lord, who dream.'",
    descriptionZh:
      "曹操恐人暗中謀害，詐言於眾：「吾夢中好殺人，凡吾睡著，汝等切勿近前。」一日晝寢，落被於地，一近侍拾而覆之，操躍起拔劍斬之，復上床睡。半晌方起，佯驚問左右何人殺吾近侍。楊修知其詐，臨葬指而歎曰：「丞相非在夢中，君乃在夢中耳！」",
    effects: [
      { kind: 'mandate-ruler', rulerOfficerId: 'cao-cao', delta: -2 },
      { kind: 'flag', key: 'caocao-dream' },
    ],
    mood: 'ominous',
  },

  // ─────────── 經典橋段補遺(2026-07 第二批):演義名場面 ───────────
  {
    id: 'evt-maleap-tanxi',
    name: { en: 'The Leap Across Tan Creek', zh: '馬躍檀溪' },
    yearMin: 201,
    yearMax: 207,
    requires: [
      // 互斥要**雙向**:另一條同場面的事件(evt-liu-bei-tan-stream)查了
      // flag-unset maleap-tanxi,而這一條原本沒查它的旗標 —— 於是那一條先演
      // 的時候,這一條照樣會再演一次。與三英戰呂布、白馬斬顏良同一個毛病。
      { kind: 'flag-unset', key: 'tan-stream-leap' },
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
    id: 'evt-taishici-beihai',
    name: { en: 'Taishi Ci Breaks the Siege of Beihai', zh: '太史慈北海解圍' },
    yearMin: 193,
    yearMax: 196,
    requires: [
      { kind: 'officer-active', officerId: 'taishi-ci' },
      { kind: 'officer-active', officerId: 'kong-rong' },
    ],
    description:
      "The Yellow Turban Guan Hai besieges Kong Rong at Beihai. To repay Kong Rong's kindness to his mother, Taishi Ci rides out alone — for days feigning archery practice to lull the besiegers, then bursting through at a gallop to beg aid of Liu Bei at Pingyuan. 'So Kong Rong of Beihai knows there is a Liu Bei in the world!' Liu Bei marvels, and sends troops to lift the siege. A man of his word, worth a thousand in gold.",
    descriptionZh:
      "黃巾管亥圍北海，孔融困守。太史慈為報孔融養母之恩，單騎突圍：連日詐作射獵以懈敵備，一朝疾馳而過，求救於平原劉備。備驚曰：「孔北海乃復知天下有劉備耶!」即發兵解圍。信義之士，一諾千金。",
    effects: [
      { kind: 'officer-loyalty', officerId: 'taishi-ci', delta: 8 },
      { kind: 'flag', key: 'taishici-beihai' },
    ],
    mood: 'martial',
  },
  {
    id: 'evt-yuji-curse',
    name: { en: 'Yu Ji Haunts Sun Ce', zh: '于吉顯聖' },
    yearMin: 200,
    yearMax: 200,
    requires: [
      { kind: 'officer-active', officerId: 'sun-ce' },
      { kind: 'officer-active', officerId: 'yu-ji' },
    ],
    description:
      "The Daoist Yu Ji roams Jiangdong, dispensing charm-water and healing the sick; the people revere him like a god. Enraged that he deludes the crowds, Sun Ce has him beheaded. Thereafter Sun Ce sees Yu Ji standing in every mirror, following at his shoulder — until, terror-struck, his old wound splits and he dies crying out before the glass. 'He who slew the god,' say the people of the south, 'the god has slain.'",
    descriptionZh:
      "于吉道人往來江東，普施符水，治病救人，士民敬之如神。孫策怒其惑眾，斬之。自此策每見于吉立於鏡中、隨於左右，驚怖不安。舊創迸裂，臨鏡大叫而絕。江東皆言：殺神者，神殺之。",
    effects: [
      { kind: 'mandate-ruler', rulerOfficerId: 'sun-ce', delta: -3 },
      { kind: 'flag', key: 'yuji-curse' },
    ],
    mood: 'mystic',
  },
  {
    id: 'evt-guanlu-divine',
    name: { en: "Guan Lu's Divinations", zh: '管輅神卜' },
    yearMin: 208,
    yearMax: 245,
    requires: [{ kind: 'officer-active', officerId: 'guan-lu' }],
    description:
      "Guan Lu of Pingyuan, master of milfoil and wind-angle divination, casts for Cao Cao on the fates of Wu and Shu — and hits each mark uncannily. He foretells the very days of death of Deng Yang and He Yan, and all comes true. Knowing his own span short, he says: 'My brow has no lord-bone, my eyes no guarding light — this is no long-lived face,' and dies young. His name for divination stands first in the age.",
    descriptionZh:
      "平原管輅，精於卜筮風角。嘗為曹操卜東吳、西蜀之事，皆奇中。又預言鄧颺、何晏死期，一一應驗。輅自知壽短，曰：「吾額無主骨，眼無守精，非長壽之相。」果早卒。神卜之名，冠絕一時。",
    effects: [{ kind: 'flag', key: 'guanlu-divine' }],
    mood: 'mystic',
  },
  {
    id: 'evt-wangcan-memory',
    name: { en: 'Wang Can Forgets Nothing', zh: '王粲過目不忘' },
    yearMin: 200,
    yearMax: 217,
    requires: [{ kind: 'officer-active', officerId: 'wang-can' }],
    description:
      "Wang Can's gift is total recall. Walking with a companion, he reads a roadside stele; asked whether he can recite it, he turns his back and renders it without a single error. Watching a game of weiqi, when the board is upset, he restores every stone to its place, not one misplaced. Foremost of the Seven Masters of Jian'an, the literary lodestar of his day.",
    descriptionZh:
      "王粲才高，過目不忘。嘗與人共行，讀道邊碑文，人問能誦否，粲背碑而誦，不失一字。又觀人弈棋，局亂，粲為復之，不誤一道。建安七子之冠冕，一時文宗。",
    effects: [{ kind: 'flag', key: 'wangcan-memory' }],
    mood: 'auspicious',
  },
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
      { kind: 'flag-set', key: 'three-kingdoms-formed' },
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
    /*
     * 三處要改:
     *  ① 條件只有「孫堅還活著」—— 於是他人在長沙、洛陽還沒燒,井裡就撈出了
     *     玉璽(體檢十二輪全在第 6 回合觸發,而焚洛陽在第 9)。璽出於洛陽宮中
     *     甄官井,要城已焚、而孫堅入了城,才有這一撈。
     *  ② 期限 191 → 193:他的主目標是「於193年前攻取洛陽」,兩者要對得上,
     *     否則打下洛陽而戲已過期。
     *     ⚠ 一度把條件綁成「孫堅**據有**洛陽」(照 184 宛城之圍的做法),
     *     六輪追下來這一幕 **0/6** —— 他的地盤在荊南,而洛陽在千里之外,
     *     自走十二輪一次也沒打到。而且史書裡他也不曾據有洛陽:董卓西遷後
     *     他入的是一座空城,掃除宗廟、平塞諸陵而後**引軍還**。所以只留
     *     「城已焚」這一道 —— 順序對了,那才是原本壞掉的地方。
     *  ③ 補一句「不敢有」的後果 —— 史書裡孫堅得璽而還之,袁術取璽而稱帝;
     *     這條事件是那一整條線的起點,所以旗標留著給後面用。
     */
    yearMax: 193,
    requires: [
      { kind: 'officer-active', officerId: 'sun-jian' },
      { kind: 'flag-set', key: 'luoyang-burned' },
    ],
    description:
      'Amid the ruins of burned Luoyang, Sun Jian\'s men draw a glittering object from a palace well — the Imperial Hereditary Seal of the Han. The Tiger of Jiangdong pockets the mandate of heaven, and with it, a fatal ambition.',
    descriptionZh: "洛陽焚餘之廢墟,孫堅軍自宮中枯井打撈得一璀璨之物——傳國玉璽。江東猛虎私納天命於懷,亦自此種下取禍之心。",
    effects: [
      { kind: 'officer-loyalty', officerId: 'sun-jian', delta: 10 },
      { kind: 'flag', key: 'imperial-seal-found' },
      /*
       * 記下**誰**拿到了 —— `imperial-seal-found` 原本是個只寫不讀的死旗標
       * (全庫沒有任何地方讀它),於是這個名場面在遊戲裡不影響任何東西。
       * 旗標沒有欄位可以放持有者,所以把持有者寫進旗標名:`seal-with-<君主>`。
       * 讀它的是 `aiCourt` 的僭號分支(見 systems/aiCourt.ts)。
       */
      { kind: 'flag', key: 'seal-with-sun-jian' },
    ],
  },
  {
    /*
     * 玉璽的下一手 —— 興平元年,孫策以父之玉璽質於袁術,借兵千餘、騎數十匹,
     * 而後渡江。史書上這一質是袁術僭號的本錢:建安二年,術以讖言「代漢者
     * 當塗高」與傳國璽在手,遂僭號於壽春。
     *
     * 沒有這一節,袁術手上永遠沒有玉璽,而僭號那條路也就走不通。
     */
    id: 'evt-sun-ce-pledges-seal',
    name: { en: 'The Seal Pledged for Soldiers', zh: '孫策以璽借兵' },
    yearMin: 193,
    yearMax: 197,
    requires: [
      { kind: 'flag-set', key: 'seal-with-sun-jian' },
      { kind: 'officer-active', officerId: 'sun-ce' },
      { kind: 'officer-alive', officerId: 'yuan-shu' },
      { kind: 'flag-unset', key: 'seal-with-yuan-shu' },
    ],
    description:
      "Sun Ce puts his father's seal in Yuan Shu's hands as surety and asks for men. He gets a thousand foot and a few dozen horse — and with them he crosses the river and never comes back. Yuan Shu keeps the seal, and four years later he puts on a yellow robe.",
    descriptionZh: '興平元年,策以父所得傳國璽質於袁術,得兵千餘、騎數十匹。渡江而東,此後不復北向。而術得璽,建安二年遂以「代漢者當塗高」之讖僭號於壽春 —— 那一方璽,借的是兵,押的是命。',
    effects: [
      { kind: 'flag', key: 'seal-with-yuan-shu' },
      { kind: 'mandate-ruler', rulerOfficerId: 'yuan-shu', delta: 6 },
      { kind: 'force-troops-multiplier-ruler', rulerOfficerId: 'sun-ce', multiplier: 1.25 },
      { kind: 'officer-loyalty', officerId: 'sun-ce', delta: 8 },
    ],
    mood: 'ominous',
  },
  {
    id: 'evt-liu-bei-tan-stream',
    // 與 evt-maleap-tanxi 同一個場面;互斥已補成**雙向**(見該條的註解)。
    name: { en: 'The Leap across Tan Stream', zh: '馬躍檀溪' },
    yearMin: 201,
    yearMax: 206,
    /* 與 evt-maleap-tanxi 同一個場面。那一版要求劉表尚在(這一躍是從劉表的
       宴席上逃出來的),這一版連劉表在不在都不問 —— 所以至少要互斥。 */
    requires: [
      { kind: 'flag-unset', key: 'maleap-tanxi' },
      { kind: 'officer-active', officerId: 'liu-bei' },
      { kind: 'officer-alive', officerId: 'liu-biao' },
    ],
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
    requires: [
      // 抉擇鏈(evt-chibi-1/2/3)跑起來的時候,這一套旁白版讓位 ——
      // 與 evt-battle-of-red-cliffs 同一條規則,否則同一場赤壁會演兩套。
      { kind: 'flag-unset', key: 'chibi-chain-started' },
      { kind: 'officer-active', officerId: 'zhuge-liang' }],
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
    requires: [
      // 抉擇鏈(evt-chibi-1/2/3)跑起來的時候,這一套旁白版讓位 ——
      // 與 evt-battle-of-red-cliffs 同一條規則,否則同一場赤壁會演兩套。
      { kind: 'flag-unset', key: 'chibi-chain-started' },
      { kind: 'flag-set', key: 'huang-gai-ruse' },
      { kind: 'officer-alive', officerId: 'pang-tong' }],
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
    /* 赤壁這一鏈原本各節只鎖了「冬」而彼此無序,體檢十二輪演出來的順序是:
       借東風@10 → 赤壁@10 → 華容道@12 → 連環計@13 → 草船借箭@13 → 苦肉計@16
       —— 曹操先被燒、關羽先放人,而後周瑜才開始設計。用旗標串成演義的順序:
       草船借箭 → 苦肉計 → 連環計 → 借東風 → 火燒赤壁 → 華容道。 */
    name: { en: 'Huang Gai\'s Sacrifice', zh: '苦肉計·黃蓋詐降' },
    yearMin: 208,
    yearMax: 209,
    season: 'winter',
    requires: [
      // 抉擇鏈(evt-chibi-1/2/3)跑起來的時候,這一套旁白版讓位 ——
      // 與 evt-battle-of-red-cliffs 同一條規則,否則同一場赤壁會演兩套。
      { kind: 'flag-unset', key: 'chibi-chain-started' },
      { kind: 'flag-set', key: 'arrows-borrowed' },
      { kind: 'officer-active', officerId: 'huang-gai' }],
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
    season: 'summer',   // 汜水關 —— 聯軍既集,而後有這一場
    requires: [
      { kind: 'flag-set', key: 'coalition-formed' },
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
    // §8.1 抉擇鏈的結果(要 flag-set jieting-masu);evt-jieting-ma-su 是鏈沒走時
    // 的退路(要 flag-unset jieting-chain-started)。同名刻意,互斥見該測試。
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

  /* ════════════════════════════════════════════════════════════════════
     黃巾之亂 — 這張盤自己的事件鏈(2026-08-01)

     體檢腳本(scripts/scenario-report.ts)跑 120 回合的結果:整整三年,這張
     盤只觸發了五個事件,而且四個在前四回合 —— 它自己的名場面(長社之火、
     廣宗易帥、張角病死、宛城之圍)一個都沒有。更要命的是黃巾在模擬裡**贏**:
     13 城滾到 25 城,而漢室從 39 掉到 25。史實上這場起義當年就結束了。

     所以這條鏈同時是內容也是平衡:**張角八月病死**是史實上黃巾崩解的真正
     原因,把它寫成事件,黃巾的雪球就由歷史本身按住,而不必去偷改開局數值。

     一律用 `-ruler` 系列的效果(依君主解析),所以這幾條在別的盤上也成立
     —— 只要張角/皇甫嵩/盧植這些人還在場。
     ══════════════════════════════════════════════════════════════════ */
  {
    /*
     * 184 年最重大的**政治**決定,盤上原本沒有。
     *
     * 這條鏈補進來之前,整個 184 年是純軍事的:長社、廣宗、宛城,全是打仗。
     * 而史實上這一年真正改變走向的一道詔是解黨禁 —— 皇甫嵩上言「宜解黨禁,
     * 益出中藏錢、西園廄馬以班軍士」,中常侍呂彊也說「黨錮久積,人情怨憤,
     * 若不赦宥,輕與張角合謀,為變滋大,悔之無救」。靈帝懼而從之。
     *
     * 士大夫沒有倒向黃巾,關鍵就在這裡。這是整場亂事最大的一個「差一點」——
     * 所以它該是一個抉擇,而不是背景設定。
     *
     * 抉擇者是漢室(盤上以盧植為君主代表朝廷)。放在春季,早於長社(夏)——
     * 詔在三月,仗在五月,順序不能顛倒。
     */
    id: 'evt-yt-dangjin',
    name: { en: 'Lift the Proscription', zh: '解黨錮' },
    yearMin: 184,
    yearMax: 185,
    season: 'spring',
    requires: [
      { kind: 'officer-active', officerId: 'lu-zhi' },
      { kind: 'flag-unset', key: 'yt-dangjin' },
    ],
    description:
      "Huangfu Song memorialises the throne: lift the ban on the proscribed, open the inner treasury and the Western Garden stables, and give it all to the troops. Even Lü Qiang — a Regular Palace Attendant, one of the eunuchs who put the ban there — says the same thing: twenty years of grievance is stacked up behind that ban, and if it is not lifted the gentry will go over to Zhang Jue, and then nothing can be mended. The emperor is afraid.",
    descriptionZh: '皇甫嵩上言:「宜解黨禁,益出中藏錢、西園廄馬以班軍士。」中常侍呂彊亦言 —— 設黨錮的正是他們這些人 ——「黨錮久積,人情怨憤,若不赦宥,輕與張角合謀,為變滋大,悔之無救。」帝懼。',
    chooserRulerId: 'lu-zhi',
    choices: [
      {
        id: 'lift',
        label: { zh: '解之 —— 錮二十年的人,不能再推給張角', en: 'Lift it — do not push twenty years of grievance into Zhang Jue\'s arms' },
        effects: [
          // 中藏錢與西園廄馬都出了 —— 賣官積下的那筆錢,終於花在了軍士身上。
          { kind: 'force-gold-ruler', rulerOfficerId: 'lu-zhi', delta: -1800 },
          { kind: 'mandate-ruler', rulerOfficerId: 'lu-zhi', delta: 10 },
          // 士大夫沒有倒向太平道 —— 這是黃巾失去的那一半天下。
          { kind: 'mandate-ruler', rulerOfficerId: 'zhang-jiao', delta: -10 },
          { kind: 'officer-join-ruler', officerId: 'he-yong', rulerOfficerId: 'lu-zhi' },
          { kind: 'flag', key: 'yt-dangjin' },
        ],
      },
      {
        id: 'keep',
        label: { zh: '不解 —— 黨人終究是黨人', en: 'Keep it — a faction is a faction' },
        effects: [
          { kind: 'mandate-ruler', rulerOfficerId: 'zhang-jiao', delta: 10 },
          { kind: 'mandate-ruler', rulerOfficerId: 'lu-zhi', delta: -6 },
          // 郡國豪右與失意士人各自結部曲,而黃旗是現成的旗。
          { kind: 'force-troops-multiplier-ruler', rulerOfficerId: 'zhang-jiao', multiplier: 1.08 },
          { kind: 'flag', key: 'yt-dangjin' },
        ],
      },
    ],
    effects: [],
  },
  {
    id: 'evt-yt-changshe',
    name: { en: 'The Fire at Changshe', zh: '長社之火' },
    yearMin: 184,
    yearMax: 185,
    // 長社在五月。不釘季節的話整條鏈會在開局五個回合內演完,一年的弧線
    // 被壓成一週 —— 體檢腳本第一次跑就是這樣(第 2,3,4,5 回合各一節)。
    season: 'summer',
    requires: [
      { kind: 'officer-active', officerId: 'huangfu-song' },
      { kind: 'officer-alive', officerId: 'bo-cai' },
      { kind: 'flag-unset', key: 'yt-changshe' },
    ],
    description:
      "Bo Cai's Turbans have Huangfu Song penned inside Changshe with a handful of men, and the rebels have camped in the tall grass. That night the wind gets up. Huangfu Song tells his officers: war is deception — and sends men over the wall with torches.",
    descriptionZh: '波才圍皇甫嵩於長社,官軍兵少,人情震恐。而賊依草結營 —— 是夜大風。嵩謂軍吏曰:「兵有奇變,不在眾寡。」乃約敕軍士皆束苣乘城,使銳士間出圍外,縱火大呼。',
    chooserRulerId: 'huangfu-song',
    choices: [
      {
        id: 'fire',
        label: { zh: '順風縱火,銳士間出', en: 'Fire downwind, and send the picked men out' },
        effects: [
          { kind: 'force-troops-multiplier-ruler', rulerOfficerId: 'zhang-jiao', multiplier: 0.9 },
          { kind: 'mandate-ruler', rulerOfficerId: 'huangfu-song', delta: 6 },
          { kind: 'officer-loyalty', officerId: 'cao-cao', delta: 6 },
          { kind: 'flag', key: 'yt-changshe' },
        ],
      },
      {
        id: 'hold',
        label: { zh: '堅壁待援,不以少擊眾', en: 'Hold the wall and wait for relief' },
        effects: [
          { kind: 'city-defense', cityId: 'xuchang', delta: 8 },
          { kind: 'mandate-ruler', rulerOfficerId: 'zhang-jiao', delta: 4 },
          { kind: 'flag', key: 'yt-changshe' },
        ],
      },
    ],
    effects: [],
  },
  {
    id: 'evt-yt-guangzong',
    name: { en: 'A New Commander at Guangzong', zh: '廣宗易帥' },
    yearMin: 184,
    yearMax: 185,
    season: 'autumn',   // 檻車徵盧植在八月
    requires: [
      { kind: 'officer-active', officerId: 'lu-zhi' },
      { kind: 'officer-alive', officerId: 'zhang-jiao' },
      { kind: 'flag-unset', key: 'yt-guangzong' },
    ],
    description:
      'Lu Zhi has Zhang Jue shut up in Guangzong and is building ramps and ladders. The court sends the eunuch Zuo Feng to inspect; someone suggests a gift would smooth the report. Lu Zhi refuses. The report says he is idling behind his walls waiting for Heaven to do the work — and a prison cart comes north for him.',
    descriptionZh: '盧植連戰破角,築圍鑿塹,造作雲梯,垂當拔之。帝遣小黃門左豐詣軍觀賊,或勸植以賂送豐,植不肯。豐還言於帝曰:「廣宗賊易破耳。盧中郎固壘息軍,以待天誅。」帝怒,檻車徵植,減死一等 —— 而代之者,是東中郎將董卓。',
    chooserRulerId: 'lu-zhi',
    choices: [
      {
        id: 'refuse',
        label: { zh: '不賂 —— 檻車便檻車', en: 'No bribe. Let the prison cart come.' },
        effects: [
          { kind: 'officer-status', officerId: 'lu-zhi', status: 'imprisoned' },
          { kind: 'mandate-ruler', rulerOfficerId: 'zhang-jiao', delta: 8 },
          { kind: 'flag', key: 'yt-guangzong' },
          { kind: 'flag', key: 'yt-luzhi-jailed' },
        ],
      },
      {
        id: 'bribe',
        label: { zh: '送左豐一份,保住這支軍', en: 'Buy Zuo Feng off and keep the army' },
        effects: [
          { kind: 'force-gold-ruler', rulerOfficerId: 'lu-zhi', delta: -1200 },
          { kind: 'officer-loyalty', officerId: 'lu-zhi', delta: -10 },
          { kind: 'flag', key: 'yt-guangzong' },
        ],
      },
    ],
    effects: [],
  },
  {
    /*
     * 鏈子上少的那一節 —— 董卓在廣宗打輸了,而北道之任因此落到皇甫嵩手上。
     *
     * 原本這條鏈是「盧植下獄(廣宗易帥)→ 張角病死 → 黑山之聚」,中間那個
     * 代盧植去打、打不下來、被免官的人整個不見。可是他就在盤上,而且他自己的
     * 目標註解裡寫著「史實上他這一仗打輸了」—— 事件表卻從沒演過這一仗。
     *
     * 補上之後兩件事同時說得通:①董卓的「擁兵自重」有了來由 —— 他這一趟是
     * 賠本的,回涼州保本才成為選擇;②皇甫嵩的主目標(於187年前取鄴與信都)
     * 有了本錢。體檢五輪,他從沒拿下過那兩座城 —— 五城四萬兵去打黃巾最硬的
     * 兩座老巢,本來就不夠。史實上他是**接了董卓的兵**才北上的:十月代卓擊
     * 廣宗斬張梁,十一月下曲陽斬張寶。兵是朝廷的,不是他自己帶去的。
     */
    id: 'evt-yt-dongzhuo-fails',
    name: { en: 'Dong Zhuo Achieves Nothing at Guangzong', zh: '卓無功,嵩代之' },
    yearMin: 184,
    yearMax: 185,
    season: 'winter',   // 十月,以皇甫嵩代董卓
    requires: [
      { kind: 'flag-set', key: 'yt-guangzong' },
      { kind: 'officer-active', officerId: 'dong-zhuo' },
      { kind: 'officer-active', officerId: 'huangfu-song' },
      { kind: 'flag-unset', key: 'yt-dongzhuo-failed' },
    ],
    description:
      "Dong Zhuo took Lu Zhi's command at Guangzong with a staff of authority and a free hand. The walls did not fall. He sat before them into the tenth month and was recalled — tried, and let off one degree short of death. The court sent Huangfu Song north in his place, with the army Dong Zhuo had been given. Song stormed Guangzong, killed Zhang Liang, and took thirty thousand heads; fifty thousand more went into the river.",
    descriptionZh: '卓拜東中郎將,持節,代盧植擊角於廣宗 —— 而壘不能拔。相持至十月,徵還,坐減死罪一等。朝廷乃以皇甫嵩代之,兵如故。嵩夜勒兵,雞鳴陳,大戰至晡,斬張梁,獲首三萬,赴河死者五萬許。十一月,又與鉅鹿太守郭典攻張寶於下曲陽,斬之。',
    chooserRulerId: 'dong-zhuo',
    choices: [
      {
        id: 'hold',
        label: { zh: '持重不進 —— 兵者國之大事,不可以求功輕擲', en: 'Hold. An army is not spent chasing merit.' },
        effects: [
          // 兵留住了,名聲賠光 —— 這正是他日後「擁兵自重」的本錢與理由。
          { kind: 'mandate-ruler', rulerOfficerId: 'dong-zhuo', delta: -12 },
          { kind: 'force-troops-multiplier-ruler', rulerOfficerId: 'huangfu-song', multiplier: 1.28 },
          { kind: 'mandate-ruler', rulerOfficerId: 'huangfu-song', delta: 6 },
          { kind: 'flag', key: 'yt-dongzhuo-failed' },
        ],
      },
      {
        id: 'storm',
        label: { zh: '強攻廣宗 —— 縱不拔,亦要朝廷看見我攻過', en: 'Storm it — let the court see the attempt, whatever it costs' },
        effects: [
          { kind: 'force-troops-multiplier-ruler', rulerOfficerId: 'dong-zhuo', multiplier: 0.84 },
          { kind: 'force-troops-multiplier-ruler', rulerOfficerId: 'zhang-jiao', multiplier: 0.93 },
          { kind: 'mandate-ruler', rulerOfficerId: 'dong-zhuo', delta: -5 },
          // 接手的軍隊已被他打薄了一層。
          { kind: 'force-troops-multiplier-ruler', rulerOfficerId: 'huangfu-song', multiplier: 1.14 },
          { kind: 'mandate-ruler', rulerOfficerId: 'huangfu-song', delta: 4 },
          { kind: 'flag', key: 'yt-dongzhuo-failed' },
        ],
      },
    ],
    effects: [],
  },
  {
    /* 這條沒有選項 —— 病死不是誰的決定。它也是這張盤的平衡樞紐:
       黃巾的兵力在此腰斬,滾雪球到此為止。 */
    id: 'evt-yt-zhangjue-dies',
    name: { en: 'Zhang Jue Dies of Illness', zh: '張角病死' },
    yearMin: 184,
    yearMax: 186,
    season: 'autumn',   // 八月,卒於廣宗城中 —— 且排在廣宗易帥之後
    requires: [
      { kind: 'officer-alive', officerId: 'zhang-jiao' },
      { kind: 'flag-set', key: 'yt-guangzong' },
      { kind: 'flag-unset', key: 'yt-zhangjue-dead' },
    ],
    description:
      'Zhang Jue does not fall in battle. He dies of illness in the eighth month, inside Guangzong, before the walls are stormed. The Way of Great Peace had one voice and one body, and both were his; his brothers can lead soldiers but cannot make three hundred thousand people believe. When Huangfu Song finally takes the city he has the grave opened and the coffin broken, and sends the head to the capital.',
    descriptionZh: '角未破,病死。八月,卒於廣宗城中。太平道一教之眾,所信者一人耳 —— 寶、梁能將兵,不能使三十六方復如臂使指。及嵩拔廣宗,乃發角棺,戮屍,傳首京師。',
    effects: [
      { kind: 'officer-status', officerId: 'zhang-jiao', status: 'dead' },
      { kind: 'force-troops-multiplier-ruler', rulerOfficerId: 'zhang-jiao', multiplier: 0.45 },
      { kind: 'mandate-ruler', rulerOfficerId: 'zhang-jiao', delta: -25 },
      /*
       * 三十六方失了那一個聲音,邊上的城當季就換了旗。
       *
       * 幅度從 0.40 提到 0.50、兵從 ×0.55 壓到 ×0.45,是因為把「宛城之圍」改成
       * 必須真的打下宛城才觸發之後,崩盤整個垮了(黃巾 17→19,反而長大)——
       * 原來有一大半重量壓在那條無條件觸發的事件上。而史實上瓦解這場運動的是
       * 張角之死,不是宛城:「太平道一教之眾,所信者一人耳。」重量該在這裡。
       */
      { kind: 'force-cities-revolt-ruler', rulerOfficerId: 'zhang-jiao', fraction: 0.50 },
      { kind: 'flag', key: 'yt-zhangjue-dead' },
    ],
  },
  {
    /*
     * 崩盤要**持續**,不能只崩一次。
     *
     * 加這兩條之前,自走的曲線是:張角一死,城從 17 掉到 12,然後就平了 ——
     * 甚至長回去(某一輪從 17 長到 18)。黃巾成了一家「兵多一點的普通勢力」,
     * 而史實上張角死後這場亂是碎掉的:河北餘部散入太行號黑山,朝廷討不了,
     * 反拜張燕為平難中郎將;其餘散為盜賊,各以山谷為名,再也聚不回三十六方。
     *
     * 所以在張角死後再排兩年的侵蝕。兩條都沒有選項 —— 這不是誰的決定,
     * 是一場失去了唯一那個聲音的運動自己的下場。
     */
    id: 'evt-yt-heishan',
    name: { en: 'The Black Mountain Bands', zh: '黑山之聚' },
    yearMin: 185,
    yearMax: 188,
    season: 'summer',
    requires: [
      { kind: 'flag-set', key: 'yt-zhangjue-dead' },
      { kind: 'flag-unset', key: 'yt-heishan' },
    ],
    description:
      'With Zhang Jue gone, the Hebei remnants do not surrender — they go up into the Taihang. Calling themselves the Black Mountain, they number a hundred thousand and more under Zhang Yan, and no commandery can dig them out. In the end the court gives up and makes Zhang Yan a General of the Household, Pacifier of Difficulties, with the right to nominate officials. Bandits with seals of office: the rising has stopped being a war and become a condition.',
    descriptionZh: '角既死,河北餘部不降,而入太行。號曰黑山,眾至百萬,張燕為之帥,郡縣不能討。朝廷卒以燕為平難中郎將,使領河北諸山谷事,歲得舉孝廉、計吏 —— 賊而有印綬。自此亂非一戰可平,而成積年之患。',
    effects: [
      { kind: 'force-troops-multiplier-ruler', rulerOfficerId: 'zhang-jiao', multiplier: 0.75 },
      { kind: 'force-cities-revolt-ruler', rulerOfficerId: 'zhang-jiao', fraction: 0.35 },
      { kind: 'mandate-ruler', rulerOfficerId: 'zhang-jiao', delta: -8 },
      { kind: 'flag', key: 'yt-heishan' },
    ],
  },
  {
    id: 'evt-yt-embers',
    name: { en: 'The Embers', zh: '餘燼' },
    yearMin: 186,
    yearMax: 189,
    season: 'autumn',
    requires: [
      { kind: 'flag-set', key: 'yt-heishan' },
      { kind: 'flag-unset', key: 'yt-embers' },
    ],
    description:
      "What is left takes the names of hills and rivers: the Black Hills, the White Waves, the Yellow Dragon, the Left Cudgel. Each keeps its own valley and its own leader, and none of them answers to another. They still wear yellow on their heads. There is no longer anyone whose word reaches them all.",
    descriptionZh: '餘部各以山谷為號:黑山、白波、黃龍、左校、於毒、五鹿……各據其谷,各有其帥,而莫相統屬。頭上之黃猶在,而能使三十六方一時俱起的那個聲音,已經沒有了。',
    effects: [
      { kind: 'force-troops-multiplier-ruler', rulerOfficerId: 'zhang-jiao', multiplier: 0.85 },
      { kind: 'force-cities-revolt-ruler', rulerOfficerId: 'zhang-jiao', fraction: 0.25 },
      { kind: 'flag', key: 'yt-embers' },
    ],
  },
  {
    id: 'evt-yt-wancheng',
    name: { en: 'The Siege of Wancheng', zh: '宛城之圍' },
    yearMin: 184,
    /*
     * 期限 186 → 189。這一節是**圍城結束的那一刻**,不是月曆上的某一年 ——
     * 誰在什麼時候把宛城拔下來,戲就該在那之後的第一個冬天演。
     *
     * 十二輪追蹤:觸發 7 次,漏的五次是 ①朱儁始終沒拿到宛城(3 次,盟軍先
     * 到了)②第 118 回合才拿到 —— 那是 187 年,已經出界(1 次)③拿到又丟
     * (1 次)。②是期限的問題,改一個數字就回來了;①③是聯軍互搶,那是這張盤
     * 的結構,不該用事件去掩蓋。
     */
    yearMax: 189,
    season: 'winter',   // 十一月,宛城拔,亂事終
    /*
     * 這條事件本來沒有查「宛城到底拿下來了沒」。
     *
     * 於是兩個毛病:①敘述與選項都在講攻下宛城(「乘城而入」),而效果裡沒有
     * 任何一項把城交給朱儁 —— 玩家讀到自己破了城,地圖上城還在黃巾手裡;
     * ②「納降」那一項給宛城 +10 民忠,**那個效果只有在宛城已經是他的時候才
     * 說得通**,否則是在替敵城加民心。
     *
     * 兩個毛病指向同一個答案:它本來就是「攻下之後」的善後抉擇,只是條件漏
     * 寫了。條件表裡正好有 city-owner-ruler,註解寫著「conquest payoffs」——
     * 就是為這種事準備的。
     *
     * 補上之後因果也對了:黃巾的大規模反正(0.45/0.55)從「時間到就發生」變成
     * 「有人真的去終結了它才發生」。史實上這場亂正是終於宛城,而終結它的是朱儁。
     * 刻意**不**讓選項直接授城 —— 那會讓朱儁的主目標白送。城要自己打。
     */
    requires: [
      { kind: 'officer-active', officerId: 'zhu-jun' },
      { kind: 'city-owner-ruler', cityId: 'wancheng', rulerOfficerId: 'zhu-jun' },
      { kind: 'flag-set', key: 'yt-zhangjue-dead' },
      { kind: 'flag-unset', key: 'yt-wancheng' },
    ],
    description:
      "Wancheng would not fall to assault. Zhu Jun ringed the city, raised earth-mounds inside the ring to look down into it, beat his drums in the southwest until the rebels all ran to meet them, then went in over the northeast wall with five thousand picked men. Sun Xia broke out and was run down at Jingshan. Tens of thousands are left, kneeling with their hands bound, asking for terms.",
    descriptionZh: '朱儁攻宛,不能拔。乃圍城,起土山以臨之,鳴鼓攻其西南,賊悉眾赴之 —— 儁自將精卒五千,掩其東北,乘城而入。孫夏走,追至西鄂精山,大破之。餘眾數萬,面縛請降。',
    chooserRulerId: 'zhu-jun',
    choices: [
      {
        id: 'storm',
        label: { zh: '不許 —— 受降則無以懲惡', en: 'Refuse — mercy now teaches rebellion' },
        effects: [
          { kind: 'force-troops-multiplier-ruler', rulerOfficerId: 'zhang-jiao', multiplier: 0.7 },
          { kind: 'mandate-ruler', rulerOfficerId: 'zhu-jun', delta: 8 },
          { kind: 'officer-loyalty', officerId: 'liu-bei', delta: 6 },
          { kind: 'officer-loyalty', officerId: 'sun-jian', delta: 6 },
          // 起於八州之亂,終於一城之門 —— 宛城一破,據城的餘部大半棄旗。
          { kind: 'force-cities-revolt-ruler', rulerOfficerId: 'zhang-jiao', fraction: 0.45 },
          { kind: 'flag', key: 'yt-wancheng' },
        ],
      },
      {
        id: 'accept-surrender',
        label: { zh: '許之 —— 編其降眾為己用', en: 'Accept — take them into your own ranks' },
        effects: [
          { kind: 'force-troops-multiplier-ruler', rulerOfficerId: 'zhu-jun', multiplier: 1.12 },
          { kind: 'city-loyalty', cityId: 'wancheng', delta: 10 },
          { kind: 'mandate-ruler', rulerOfficerId: 'zhu-jun', delta: 4 },
          // 納降散得更快 —— 但降卒編進了朱儁自己的軍中(見上一條乘數)。
          { kind: 'force-cities-revolt-ruler', rulerOfficerId: 'zhang-jiao', fraction: 0.55 },
          { kind: 'flag', key: 'yt-wancheng' },
        ],
      },
    ],
    effects: [],
  },
  {
    id: 'evt-yt-huangfu-stripped',
    name: { en: 'The Seals Are Taken Back', zh: '收印綬,削戶邑' },
    yearMin: 185,
    yearMax: 187,
    requires: [
      { kind: 'officer-active', officerId: 'huangfu-song' },
      { kind: 'flag-set', key: 'yt-zhangjue-dead' },
      { kind: 'flag-unset', key: 'yt-huangfu-stripped' },
    ],
    description:
      'Huangfu Song asked that Ji province be excused a year of taxes, and the province made songs about him. Then Zhao Zhong found that his house had been pulled down for building over the regulations, and Zhang Rang asked him for five million in cash and was refused. Both men memorialised. The seal of Left General comes back off, six thousand households are cut from his fief, and he is made a marquis of a lesser rank.',
    descriptionZh: '嵩表請免冀州一年田租以贍飢民,帝從之,百姓歌曰:「天下大亂兮市為墟,母不保子兮妻失夫,賴得皇甫兮復安居。」\n\n而中常侍趙忠以嵩軍舍逾制奏之,張讓私求錢五千萬,嵩不與 —— 二人皆奏。詔收左車騎將軍印綬,削戶六千,更封都鄉侯。',
    chooserRulerId: 'huangfu-song',
    choices: [
      {
        id: 'submit',
        label: { zh: '交印,歸第', en: 'Hand back the seal and go home' },
        effects: [
          { kind: 'force-gold-ruler', rulerOfficerId: 'huangfu-song', delta: -800 },
          { kind: 'officer-loyalty', officerId: 'huangfu-song', delta: 8 },
          { kind: 'flag', key: 'yt-huangfu-stripped' },
        ],
      },
      {
        id: 'defy',
        label: { zh: '擁兵不交 —— 這支軍是我練的', en: 'Keep the army. I trained it.' },
        effects: [
          { kind: 'mandate-ruler', rulerOfficerId: 'huangfu-song', delta: -10 },
          { kind: 'force-troops-multiplier-ruler', rulerOfficerId: 'huangfu-song', multiplier: 1.15 },
          { kind: 'flag', key: 'yt-huangfu-stripped' },
          { kind: 'flag', key: 'yt-huangfu-defied' },
        ],
      },
    ],
    effects: [],
  },
  /* ========================================================================
   * 外傳三線與末期四盤的事件鏈(2026-08-08)
   *
   * 起因是一次覆蓋率量測:**五張盤在自己的年代裡一條事件都不會演** ——
   * 大澤鄉、濰水、垓下、虎牢、西陵。垓下之戰沒有四面楚歌,虎牢之戰沒有
   * 一戰擒兩王,而那正是那兩張盤存在的理由。
   *
   * ⚠ 外傳三線借三國曆法軸(`startDate.year = 178`),所以年份鎖不住它們 ——
   * 每一條都以**只有那條線才有的人**當守衛(`officer-alive: hist-xiang-yu`
   * 之類)。三國盤上沒有那個人,`officer-alive` 直接回 false,事件於是不會外漏。
   * 這與 §7.4 的 `isLaterHanBoard` 是同一個問題的兩種解法。
   * ====================================================================== */

  // ---- 楚漢·大澤鄉起義 --------------------------------------------------
  {
    id: 'evt-daze-1',
    name: { en: 'The Fish and the Fox', zh: '魚腹丹書·篝火狐鳴' },
    yearMin: 178,
    yearMax: 181,
    requires: [
      { kind: 'flag-set', key: 'chain-daze' },
      { kind: 'officer-alive', officerId: 'hist-chen-sheng' },
      { kind: 'officer-alive', officerId: 'hist-wu-guang' },
      { kind: 'flag-unset', key: 'daze-risen' },
    ],
    description:
      'The rain has washed the road out and the levy is late; the law says late means death. Wu Guang has put a strip of silk in a fish\'s belly and Chen Sheng has been howling like a fox in the shrine at night: "The Great Chu rises. Chen Sheng shall be king."',
    descriptionZh: '會天大雨,道不通,度已失期 —— 失期,法皆斬。吳廣乃丹書帛曰「陳勝王」,置人所罾魚腹中;又夜篝火狐鳴呼曰:「大楚興,陳勝王。」卒皆夜驚恐。',
    effects: [],
    chooserRulerId: 'hist-chen-sheng',
    choices: [
      {
        id: 'rise',
        label: { zh: '王侯將相寧有種乎 —— 斬木為兵,揭竿為旗', en: 'Are kings and nobles born to it? Cut staves for spears.' },
        effects: [
          { kind: 'force-troops-multiplier-ruler', rulerOfficerId: 'hist-chen-sheng', multiplier: 1.35 },
          { kind: 'mandate-ruler', rulerOfficerId: 'hist-chen-sheng', delta: 12 },
          { kind: 'flag', key: 'daze-risen' },
        ],
      },
      {
        id: 'flee',
        label: { zh: '亡亦死,不如逃入澤中', en: 'Desert into the marshes' },
        effects: [
          { kind: 'force-troops-multiplier-ruler', rulerOfficerId: 'hist-chen-sheng', multiplier: 0.75 },
          { kind: 'flag', key: 'daze-risen' },
          { kind: 'flag', key: 'daze-fled' },
        ],
      },
    ],
  },
  {
    id: 'evt-daze-2',
    name: { en: 'Zhou Wen Reaches the Pass', zh: '周文西入戲下' },
    yearMin: 178,
    yearMax: 182,
    season: 'autumn',
    requires: [
      { kind: 'flag-set', key: 'chain-daze' },
      { kind: 'flag-set', key: 'daze-risen' },
      { kind: 'flag-unset', key: 'daze-fled' },
      { kind: 'officer-alive', officerId: 'hist-zhou-wen' },
      { kind: 'officer-alive', officerId: 'hist-zhang-han' },
    ],
    description:
      'Zhou Wen went west gathering men as he walked and arrived at Xi with a thousand chariots and a hundred thousand foot — a day\'s march from the capital. Zhang Han asks the court for the convicts building the First Emperor\'s tomb: pardon them, arm them, and send them out today.',
    descriptionZh: '周文行收兵至關,車千乘,卒數十萬,至戲而軍 —— 去咸陽一日之程。少府章邯言:「盜已至,眾強,今發近縣不及矣。驪山徒多,請赦之,授兵以擊。」',
    effects: [],
    chooserRulerId: 'hist-qin-ershi',
    choices: [
      {
        id: 'pardon',
        label: { zh: '赦驪山徒,授兵擊之', en: 'Pardon the tomb-builders and arm them' },
        effects: [
          { kind: 'force-troops-multiplier-ruler', rulerOfficerId: 'hist-qin-ershi', multiplier: 1.5 },
          { kind: 'officer-loyalty', officerId: 'hist-zhang-han', delta: 10 },
          { kind: 'flag', key: 'daze-lishan' },
        ],
      },
      {
        id: 'deny',
        label: { zh: '天下安寧,何盜之有 —— 下吏治言者', en: 'The realm is at peace. Arrest whoever says otherwise.' },
        effects: [
          { kind: 'mandate-ruler', rulerOfficerId: 'hist-qin-ershi', delta: -15 },
          { kind: 'force-troops-multiplier-ruler', rulerOfficerId: 'hist-chen-sheng', multiplier: 1.2 },
          { kind: 'flag', key: 'daze-lishan' },
        ],
      },
    ],
  },
  {
    id: 'evt-daze-3',
    name: { en: 'Wu Guang Killed by His Own', zh: '吳廣為其部將所殺' },
    yearMin: 179,
    yearMax: 184,
    season: 'winter',
    requires: [
      { kind: 'flag-set', key: 'chain-daze' },
      { kind: 'flag-set', key: 'daze-risen' },
      { kind: 'officer-alive', officerId: 'hist-wu-guang' },
      { kind: 'officer-alive', officerId: 'hist-chen-sheng' },
    ],
    description:
      'Wu Guang sat outside Xingyang for months and could not take it. His lieutenant Tian Zang forged an order from the king, killed him, and sent the head back — and Chen Sheng, who could not afford another quarrel, sent the seal of chancellor after it.',
    descriptionZh: '吳廣圍滎陽,久不下。其將田臧與諸將謀曰:「假王驕,不知兵權,不可與計。」乃矯王令殺吳廣,獻其首於陳王 —— 陳王使賜田臧楚令尹印,使為上將。',
    effects: [
      { kind: 'officer-status', officerId: 'hist-wu-guang', status: 'dead' },
      { kind: 'officer-loyalty', officerId: 'hist-chen-sheng', delta: -6 },
      { kind: 'mandate-ruler', rulerOfficerId: 'hist-chen-sheng', delta: -8 },
      { kind: 'flag', key: 'daze-wuguang-dead' },
    ],
  },

  // ---- 楚漢·濰水之戰 ----------------------------------------------------
  {
    id: 'evt-weishui-1',
    name: { en: 'Li Yiji Talks Qi Over', zh: '酈生說齊' },
    yearMin: 178,
    yearMax: 181,
    requires: [
      { kind: 'flag-set', key: 'chain-weishui' },
      { kind: 'officer-alive', officerId: 'hist-liyiji' },
      { kind: 'officer-alive', officerId: 'hist-han-xin' },
      { kind: 'officer-alive', officerId: 'hist-tian-guang' },
      { kind: 'flag-unset', key: 'weishui-qi-decided' },
    ],
    description:
      'Li Yiji rode east alone and talked Qi into coming over — seventy walled towns, without an arrow. The letter reaches Han Xin\'s camp on the same day his army is drawn up to cross. Kuai Tong leans in: "You were ordered to attack Qi. Was the order recalled?"',
    descriptionZh: '酈食其東說齊王,下齊七十餘城,兵不血刃。書至韓信軍中,而信方引兵臨河。蒯通說信曰:「將軍受詔擊齊,漢獨發間使下齊,寧有詔止將軍乎?」',
    effects: [],
    chooserRulerId: 'hist-liu-bang',
    choices: [
      {
        id: 'strike',
        label: { zh: '乘其無備而擊之 —— 齊已撤守', en: 'Strike: Qi has stood its garrisons down' },
        effects: [
          { kind: 'officer-status', officerId: 'hist-liyiji', status: 'dead' },
          { kind: 'force-troops-multiplier-ruler', rulerOfficerId: 'hist-tian-guang', multiplier: 0.6 },
          { kind: 'mandate-ruler', rulerOfficerId: 'hist-liu-bang', delta: -8 },
          { kind: 'flag', key: 'weishui-qi-decided' },
          { kind: 'flag', key: 'weishui-betrayed-qi' },
        ],
      },
      {
        id: 'honour',
        label: { zh: '止兵,受齊之降', en: 'Halt. Accept the surrender.' },
        effects: [
          { kind: 'officer-loyalty', officerId: 'hist-liyiji', delta: 12 },
          { kind: 'mandate-ruler', rulerOfficerId: 'hist-liu-bang', delta: 10 },
          { kind: 'flag', key: 'weishui-qi-decided' },
        ],
      },
    ],
  },
  {
    id: 'evt-weishui-2',
    name: { en: 'Sandbags in the Wei', zh: '囊沙壅水' },
    yearMin: 179,
    yearMax: 183,
    requires: [
      { kind: 'flag-set', key: 'chain-weishui' },
      { kind: 'flag-set', key: 'weishui-betrayed-qi' },
      { kind: 'officer-alive', officerId: 'hist-han-xin' },
      { kind: 'officer-alive', officerId: 'hist-long-qu' },
    ],
    description:
      'In the night Han Xin sent ten thousand sandbags upstream and dammed the Wei. At dawn he crossed, struck, and ran. Long Qu said what he had been waiting to say — "I always knew Han Xin was a coward" — and followed him across. Then the bags came out.',
    descriptionZh: '信乃夜令人為萬餘囊,滿盛沙,壅水上流。引軍半渡,擊龍且,佯不勝,還走。龍且果喜曰:「固知信怯也。」遂追渡水。信使人決壅囊,水大至 —— 龍且軍太半不得渡。',
    effects: [
      { kind: 'officer-status', officerId: 'hist-long-qu', status: 'dead' },
      { kind: 'force-troops-multiplier-ruler', rulerOfficerId: 'hist-xiang-yu', multiplier: 0.72 },
      { kind: 'officer-loyalty', officerId: 'hist-han-xin', delta: 6 },
      { kind: 'flag', key: 'weishui-longqu-dead' },
    ],
  },
  {
    id: 'evt-weishui-3',
    name: { en: 'Kuai Tong Offers a Third of the World', zh: '蒯通說信三分' },
    yearMin: 180,
    yearMax: 184,
    season: 'summer',
    requires: [
      { kind: 'flag-set', key: 'chain-weishui' },
      { kind: 'flag-set', key: 'weishui-longqu-dead' },
      { kind: 'officer-alive', officerId: 'hist-han-xin' },
      { kind: 'officer-alive', officerId: 'hist-kuai-tong' },
    ],
    description:
      'Kuai Tong reads Han Xin\'s face and says the realm now turns on where he stands: side with Han and Chu falls, side with Chu and Han falls, or stand still and take a third. "Heaven gives and the man who will not take is blamed for it."',
    descriptionZh: '蒯通曰:「當今兩主之命懸於足下。足下右投則漢王勝,左投則項王勝。莫若兩利而俱存之,參分天下,鼎足而居。天與弗取,反受其咎。」',
    effects: [],
    chooserRulerId: 'hist-liu-bang',
    choices: [
      {
        id: 'loyal',
        label: { zh: '漢王遇我甚厚 —— 吾不忍背之', en: 'The King of Han has been good to me' },
        effects: [
          { kind: 'officer-loyalty', officerId: 'hist-han-xin', delta: 15 },
          { kind: 'mandate-ruler', rulerOfficerId: 'hist-liu-bang', delta: 6 },
          { kind: 'flag', key: 'weishui-hanxin-loyal' },
        ],
      },
      {
        id: 'third',
        label: { zh: '參分天下,鼎足而居', en: 'Take the third part and stand on it' },
        effects: [
          { kind: 'spawn-rebel-force', cityId: 'linzi', troops: 30000, label: { zh: '齊', en: 'Qi' } },
          { kind: 'officer-loyalty', officerId: 'hist-han-xin', delta: -30 },
          { kind: 'mandate-ruler', rulerOfficerId: 'hist-liu-bang', delta: -12 },
          { kind: 'flag', key: 'weishui-hanxin-third' },
        ],
      },
    ],
  },

  // ---- 楚漢·垓下之戰 ----------------------------------------------------
  {
    id: 'evt-gaixia-1',
    name: { en: 'The Ten Ambushes', zh: '十面埋伏' },
    yearMin: 178,
    yearMax: 181,
    requires: [
      { kind: 'flag-set', key: 'chain-gaixia' },
      { kind: 'officer-alive', officerId: 'hist-han-xin' },
      { kind: 'officer-alive', officerId: 'hist-xiang-yu' },
      { kind: 'flag-unset', key: 'gaixia-set' },
    ],
    description:
      'Han Xin took command of the whole line at Gaixia — three hundred thousand, his own column in the centre, Kong and Fei on the wings. He went in first, gave ground, and let the wings close.',
    descriptionZh: '淮陰侯將三十萬自當之,孔將軍居左,費將軍居右,皇帝在後,絳侯、柴將軍在皇帝後。淮陰侯先合,不利,卻 —— 孔將軍、費將軍縱,楚兵不利。',
    effects: [],
    chooserRulerId: 'hist-liu-bang',
    choices: [
      {
        id: 'encircle',
        label: { zh: '以信為將,十面設伏', en: 'Give Han Xin the whole line' },
        effects: [
          { kind: 'force-troops-multiplier-ruler', rulerOfficerId: 'hist-xiang-yu', multiplier: 0.8 },
          { kind: 'flag', key: 'gaixia-set' },
          { kind: 'flag', key: 'gaixia-encircled' },
        ],
      },
      {
        id: 'press',
        label: { zh: '自將中軍,正面壓上', en: 'Take the centre yourself and push' },
        effects: [
          { kind: 'force-troops-multiplier-ruler', rulerOfficerId: 'hist-liu-bang', multiplier: 0.85 },
          { kind: 'flag', key: 'gaixia-set' },
        ],
      },
    ],
  },
  {
    id: 'evt-gaixia-2',
    name: { en: 'Songs of Chu on Every Side', zh: '四面楚歌' },
    yearMin: 178,
    yearMax: 182,
    season: 'winter',
    requires: [
      { kind: 'flag-set', key: 'chain-gaixia' },
      { kind: 'flag-set', key: 'gaixia-encircled' },
      { kind: 'officer-alive', officerId: 'hist-xiang-yu' },
      { kind: 'flag-unset', key: 'gaixia-sang' },
    ],
    description:
      'The wall of camps around Gaixia sang, at night, in Chu. The king woke and said: has Han taken all of Chu already? How many Chu men do they have over there? Then he rose and drank in his tent, and made a song of his own.',
    descriptionZh: '項王軍壁垓下,兵少食盡,漢軍及諸侯兵圍之數重。夜聞漢軍四面皆楚歌,項王乃大驚曰:「漢皆已得楚乎?是何楚人之多也!」項王則夜起,飲帳中。',
    effects: [
      { kind: 'force-troops-multiplier-ruler', rulerOfficerId: 'hist-xiang-yu', multiplier: 0.7 },
      { kind: 'flag', key: 'gaixia-sang' },
    ],
  },
  {
    id: 'evt-gaixia-3',
    name: { en: 'The King Parts from His Lady', zh: '霸王別姬' },
    yearMin: 178,
    yearMax: 183,
    requires: [
      { kind: 'flag-set', key: 'chain-gaixia' },
      { kind: 'flag-set', key: 'gaixia-sang' },
      { kind: 'officer-alive', officerId: 'hist-xiang-yu' },
      { kind: 'officer-alive', officerId: 'hist-yu-ji' },
    ],
    description:
      '"My strength uprooted mountains, my spirit covered the age — the times are against me and my horse will not run. My horse will not run, and what am I to do. Yu, my Yu, what am I to do." He sang it several times through. She answered him, and the men around could not lift their heads.',
    descriptionZh: '「力拔山兮氣蓋世,時不利兮騅不逝。騅不逝兮可奈何,虞兮虞兮奈若何!」歌數闋,美人和之。項王泣數行下,左右皆泣,莫能仰視。',
    effects: [],
    chooserRulerId: 'hist-xiang-yu',
    choices: [
      {
        id: 'ride',
        label: { zh: '麾下壯士八百餘騎,直夜潰圍南出', en: 'Eight hundred riders. Break south in the dark.' },
        effects: [
          { kind: 'officer-status', officerId: 'hist-yu-ji', status: 'dead' },
          { kind: 'force-troops-multiplier-ruler', rulerOfficerId: 'hist-xiang-yu', multiplier: 0.5 },
          { kind: 'flag', key: 'gaixia-yuji' },
          { kind: 'flag', key: 'gaixia-broke-out' },
        ],
      },
      {
        id: 'stand',
        label: { zh: '不走了 —— 明日決戰於壁下', en: 'No. We fight at the wall tomorrow.' },
        effects: [
          { kind: 'officer-status', officerId: 'hist-yu-ji', status: 'dead' },
          { kind: 'officer-loyalty', officerId: 'hist-zhongli-mei', delta: 10 },
          { kind: 'flag', key: 'gaixia-yuji' },
        ],
      },
    ],
  },
  {
    id: 'evt-gaixia-4',
    name: { en: 'The Wu River', zh: '烏江自刎' },
    yearMin: 179,
    yearMax: 184,
    requires: [
      { kind: 'flag-set', key: 'chain-gaixia' },
      { kind: 'flag-set', key: 'gaixia-broke-out' },
      { kind: 'officer-alive', officerId: 'hist-xiang-yu' },
    ],
    description:
      'The village head of Wu had a boat waiting on the bank. "East of the river is small, but it is a thousand li and a hundred thousand households — enough to be king on." The king laughed: I took eight thousand sons of the east across this river and not one is going back. What face have I to meet their fathers?',
    descriptionZh: '於是項王乃欲東渡烏江。烏江亭長檥船待,曰:「江東雖小,地方千里,眾數十萬人,亦足王也。願大王急渡。」項王笑曰:「天之亡我,我何渡為!且籍與江東子弟八千人渡江而西,今無一人還,縱江東父兄憐而王我,我何面目見之?」',
    effects: [],
    chooserRulerId: 'hist-xiang-yu',
    choices: [
      {
        id: 'refuse',
        label: { zh: '無顏見江東父老 —— 以劍自刎', en: 'I cannot face them. The sword, then.' },
        effects: [
          { kind: 'officer-status', officerId: 'hist-xiang-yu', status: 'dead' },
          { kind: 'force-cities-revolt-ruler', rulerOfficerId: 'hist-xiang-yu', fraction: 0.5 },
          { kind: 'flag', key: 'gaixia-ended' },
        ],
      },
      {
        id: 'cross',
        label: { zh: '渡江東,卷土重來未可知', en: 'Cross. The east may yet be gathered again.' },
        effects: [
          { kind: 'force-troops-multiplier-ruler', rulerOfficerId: 'hist-xiang-yu', multiplier: 1.6 },
          { kind: 'mandate-ruler', rulerOfficerId: 'hist-xiang-yu', delta: -10 },
          { kind: 'flag', key: 'gaixia-ended' },
          { kind: 'flag', key: 'gaixia-crossed' },
        ],
      },
    ],
  },

  /*
   * 兩條**橋接** —— 只有「楚漢爭霸」那張整條線的盤會種 `chain-chuhan-era`,
   * 於是三段鏈在它上面是接力的:大澤鄉 → 濰水 → 垓下,順序照史書。
   * 單一戰役的三張盤各自只種自己那一條,開局就演,不必等前一段。
   *
   * 為什麼不用年份錯開:垓下那條鏈要在垓下盤上**早早**演、在整線盤上**很晚**
   * 演,同一個窗口做不到兩件事。
   */
  {
    id: 'evt-chuhan-bridge-1',
    name: { en: 'Zhang Han Breaks Chen, and Xiang Liang Rises', zh: '章邯破陳·項梁起江東' },
    yearMin: 179,
    yearMax: 183,
    requires: [
      { kind: 'flag-set', key: 'chain-chuhan-era' },
      { kind: 'flag-set', key: 'daze-wuguang-dead' },
      { kind: 'flag-unset', key: 'chain-weishui' },
    ],
    description:
      "Chen Sheng was six months a king and then his own driver killed him on the road at Chengfu. The rising did not stop; it changed hands. Xiang Liang came over the river with eight thousand sons of the east and put a shepherd boy — grandson of the old king of Chu — on the throne, and kept the name Huai.",
    descriptionZh: '陳勝王凡六月,為其御莊賈所殺,葬於碭,諡曰隱王。而事不因此而止,只是易手 —— 項梁將江東子弟八千人渡江而西,求楚懷王孫心於民間,為人牧羊,立以為楚懷王,從民望也。',
    effects: [
      { kind: 'officer-status', officerId: 'hist-chen-sheng', status: 'dead' },
      { kind: 'flag', key: 'chain-weishui' },
    ],
  },
  {
    id: 'evt-chuhan-bridge-2',
    name: { en: 'The Treaty at Hong Canal', zh: '鴻溝之約' },
    yearMin: 180,
    yearMax: 185,
    season: 'autumn',
    requires: [
      { kind: 'flag-set', key: 'chain-chuhan-era' },
      { kind: 'flag-set', key: 'weishui-longqu-dead' },
      { kind: 'flag-unset', key: 'chain-gaixia' },
      { kind: 'officer-alive', officerId: 'hist-xiang-yu' },
    ],
    description:
      'They cut the world in half at the canal — west of it Han, east of it Chu — and Chu sent the old man and the wife home. Chu turned east. Zhang Liang and Chen Ping took the king by the sleeve: he is out of food and out of men, this is heaven handing him over, and to let him walk now is to feed a tiger and be eaten later.',
    descriptionZh: '項王乃與漢約,中分天下,割鴻溝以西者為漢,以東者為楚,歸漢王父母妻子。項王引兵解而東歸。張良、陳平說曰:「漢有天下太半,而諸侯皆附之。楚兵罷食盡,此天亡楚之時也。今釋弗擊,此所謂養虎自遺患也。」',
    effects: [],
    chooserRulerId: 'hist-liu-bang',
    choices: [
      {
        id: 'pursue',
        label: { zh: '養虎自遺患 —— 背約東追', en: 'To let him go is to feed a tiger. Follow him east.' },
        effects: [
          { kind: 'mandate-ruler', rulerOfficerId: 'hist-liu-bang', delta: -6 },
          { kind: 'flag', key: 'chain-gaixia' },
        ],
      },
      {
        id: 'honour',
        label: { zh: '守約,罷兵西歸', en: 'Keep the treaty and go west' },
        effects: [
          { kind: 'mandate-ruler', rulerOfficerId: 'hist-liu-bang', delta: 10 },
          { kind: 'force-troops-multiplier-ruler', rulerOfficerId: 'hist-xiang-yu', multiplier: 1.25 },
          { kind: 'flag', key: 'chain-gaixia' },
          { kind: 'flag', key: 'chuhan-treaty-kept' },
        ],
      },
    ],
  },

  /* ---- 滅蜀之役(263)---------------------------------------------------
   * 這張盤原本只有四條事件在窗口內,而蜀漢亡國那一年最該演的三幕
   * ——綿竹、譙周之議、輿櫬出降——一幕都沒有。
   */
  {
    id: 'evt-shufall-mianzhu',
    name: { en: 'Father and Son at Mianzhu', zh: '綿竹·諸葛瞻父子' },
    yearMin: 263,
    yearMax: 266,
    requires: [
      { kind: 'flag-set', key: 'chain-shufall' },
      { kind: 'officer-alive', officerId: 'deng-ai' },
      /*
       * ⚠ 這裡原本要求 `officer-alive: zhuge-zhan` —— 而諸葛瞻在盤上**第 1 旬
       * 就戰死**(綿竹之戰是這張盤的開局戰),於是這一節永遠等不到他。
       * 改問「綿竹還在蜀手裡沒有」:那才是這一幕的前提。
       * 同型的坑見 §7.4「長社之火」—— 皇甫嵩第 9 回合陣亡,事件連骰都沒擲。
       */
      { kind: 'city-owner-ruler', cityId: 'mianzhu', rulerOfficerId: 'liu-shan' },
    ],
    description:
      'Deng Ai wrote offering him the princedom of Langye if he came over. Zhuge Zhan beheaded the messenger and drew up outside Mianzhu. "I could not remove Huang Hao within, could not check Jiang Wei without, and could not hold the land — I have three crimes, and no face to go back." His son Zhuge Shang, nineteen, rode into the line and did not come out.',
    descriptionZh: '鄧艾遣書誘瞻曰:「若降者,必表為琅邪王。」瞻怒,斬艾使,列陣待之。瞻曰:「吾內不除黃皓,外不制姜維,進不守江油,吾有三罪,何面而反!」乃進兵大戰,敗,臨陣死。子尚年十九,歎曰:「父子荷國重恩,不早斬黃皓,以致傾敗,用生何為!」乃馳赴魏軍而死。',
    effects: [
      { kind: 'officer-status', officerId: 'zhuge-zhan', status: 'dead' },
      { kind: 'officer-status', officerId: 'zhuge-shang', status: 'dead' },
      { kind: 'city-defense', cityId: 'mianzhu', delta: -25 },
      { kind: 'mandate-ruler', rulerOfficerId: 'liu-shan', delta: -12 },
      { kind: 'flag', key: 'shufall-mianzhu' },
    ],
  },
  {
    id: 'evt-shufall-qiaozhou',
    name: { en: 'Qiao Zhou Argues for Surrender', zh: '譙周之議' },
    yearMin: 263,
    yearMax: 267,
    requires: [
      { kind: 'flag-set', key: 'chain-shufall' },
      { kind: 'flag-set', key: 'shufall-mianzhu' },
      { kind: 'officer-alive', officerId: 'liu-shan' },
    ],
    description:
      'The court is split three ways: run south to Nanzhong, run east to Wu, or open the gates. Qiao Zhou says a small state that submits to a great one is only doing what small states do; but a state that flees to Wu will one day have to submit twice, and it is better to be humiliated once than twice.',
    descriptionZh: '或謂宜南入七郡,或謂東奔孫吳。譙周曰:「自古以來,無寄他國為天子者。今若入吳,固當臣服 —— 且魏能并吳,吳不能并魏明矣。等為稱臣,為小孰與為大?再辱之恥,何與一辱?」',
    effects: [],
    chooserRulerId: 'liu-shan',
    choices: [
      {
        id: 'surrender',
        label: { zh: '面縛輿櫬,出降於軍門', en: 'Bind the hands, bear the coffin, go out to the camp gate' },
        effects: [
          { kind: 'force-cities-revolt-ruler', rulerOfficerId: 'liu-shan', fraction: 0.6 },
          { kind: 'flag', key: 'shufall-surrendered' },
        ],
      },
      {
        id: 'nanzhong',
        label: { zh: '南入七郡,依南中以圖後舉', en: 'South into the seven commanderies and gather again' },
        effects: [
          { kind: 'city-troops-multiplier', cityId: 'nanzhong', multiplier: 1.6 },
          { kind: 'city-loyalty', cityId: 'chengdu', delta: -20 },
          { kind: 'mandate-ruler', rulerOfficerId: 'liu-shan', delta: -6 },
          { kind: 'flag', key: 'shufall-south' },
        ],
      },
      {
        id: 'fight',
        label: { zh: '嬰城固守,以待姜維之還', en: 'Shut the gates and wait for Jiang Wei' },
        effects: [
          { kind: 'city-defense', cityId: 'chengdu', delta: 20 },
          { kind: 'officer-loyalty', officerId: 'jiang-wei', delta: 10 },
          { kind: 'flag', key: 'shufall-hold' },
        ],
      },
    ],
  },
  {
    id: 'evt-shufall-jiange',
    name: { en: 'Jiang Wei Holds Jiange', zh: '姜維守劍閣' },
    yearMin: 263,
    yearMax: 266,
    requires: [
      { kind: 'flag-set', key: 'chain-shufall' },
      { kind: 'officer-alive', officerId: 'jiang-wei' },
      { kind: 'officer-alive', officerId: 'zhong-hui' },
      { kind: 'flag-unset', key: 'shufall-mianzhu' },
    ],
    description:
      'Jiang Wei pulled back from Tazhong, slipped past the columns closing on him, and got to Jiange first. Zhong Hui came up with a hundred thousand and could not pass; his supply line ran back over the mountains and he began to talk about withdrawing. Then a rider came from Deng Ai, who had gone another way.',
    descriptionZh: '維列營守險,會攻之不能克,糧道險遠,議欲還歸。而鄧艾自陰平道行無人之地七百餘里 —— 會之不能拔劍閣,正是艾之所以得偷渡也。',
    effects: [
      { kind: 'city-defense', cityId: 'jianmen', delta: 25 },
      { kind: 'officer-loyalty', officerId: 'jiang-wei', delta: 8 },
      { kind: 'flag', key: 'shufall-jiange' },
    ],
  },

  /* ---- 鍾會之亂(264)-------------------------------------------------- */
  {
    id: 'evt-zhonghui-jiangwei',
    name: { en: 'Jiang Wei Bends the Rebel', zh: '姜維說鍾會' },
    yearMin: 264,
    yearMax: 267,
    requires: [
      { kind: 'flag-set', key: 'chain-zhonghui' },
      { kind: 'officer-alive', officerId: 'jiang-wei' },
      { kind: 'officer-alive', officerId: 'zhong-hui' },
    ],
    description:
      'Jiang Wei surrendered to Zhong Hui and then went to work on him: the merit is already too great to take home; Han Xin was killed for less. Zhong Hui listened, and Jiang Wei wrote secretly to his own emperor — "endure a few more days of humiliation; the altars are in danger and I mean to set them up again."',
    descriptionZh: '維知會有異志,因說之曰:「聞君自淮南以來,算無遺策,今復定蜀,威德振世,民高其功,主畏其謀 —— 何不法陶朱公泛舟絕跡?」會亦欲以維為助。維密書與後主曰:「願陛下忍數日之辱,臣欲使社稷危而復安,日月幽而復明。」',
    effects: [],
    chooserRulerId: 'zhong-hui',
    choices: [
      {
        id: 'rebel',
        label: { zh: '據蜀自立,以維為前驅', en: 'Hold Shu and rise, with Jiang Wei in front' },
        effects: [
          { kind: 'force-troops-multiplier-ruler', rulerOfficerId: 'zhong-hui', multiplier: 1.2 },
          { kind: 'officer-loyalty', officerId: 'jiang-wei', delta: -25 },
          { kind: 'flag', key: 'zhonghui-risen' },
        ],
      },
      {
        id: 'submit',
        label: { zh: '交兵權,還洛陽', en: 'Give up the army and go back to Luoyang' },
        effects: [
          { kind: 'force-troops-multiplier-ruler', rulerOfficerId: 'zhong-hui', multiplier: 0.6 },
          { kind: 'force-troops-multiplier-ruler', rulerOfficerId: 'sima-zhao', multiplier: 1.2 },
          { kind: 'flag', key: 'zhonghui-submitted' },
        ],
      },
    ],
  },
  {
    id: 'evt-zhonghui-weiguan',
    name: { en: 'Wei Guan Sends Tian Xu', zh: '衛瓘遣田續' },
    yearMin: 264,
    yearMax: 267,
    requires: [
      { kind: 'flag-set', key: 'chain-zhonghui' },
      { kind: 'officer-alive', officerId: 'deng-ai' },
      { kind: 'officer-alive', officerId: 'wei-guan' },
    ],
    description:
      'Deng Ai was already in a cage-cart on the road east when the mutiny broke and his own officers went to fetch him back. Wei Guan, who had signed the arrest warrant and had most to fear if Deng Ai returned, sent Tian Xu after him at a gallop. They caught him west of Mianzhu.',
    descriptionZh: '會既死,艾本營將士追出檻車,欲迎還艾。衛瓘自以與會共陷艾,懼為艾所殺,乃遣田續等討艾,遇於綿竹西,斬之。艾子忠與艾俱死。',
    effects: [
      { kind: 'officer-status', officerId: 'deng-ai', status: 'dead' },
      { kind: 'force-cities-revolt-ruler', rulerOfficerId: 'deng-ai', fraction: 0.5 },
      { kind: 'officer-loyalty', officerId: 'wei-guan', delta: -10 },
      { kind: 'flag', key: 'zhonghui-dengai-dead' },
    ],
  },
  {
    id: 'evt-zhonghui-mutiny',
    name: { en: 'The Soldiers Come Over the Wall', zh: '亂兵殺會與維' },
    yearMin: 264,
    yearMax: 268,
    requires: [
      { kind: 'flag-set', key: 'chain-zhonghui' },
      { kind: 'flag-set', key: 'zhonghui-risen' },
      { kind: 'officer-alive', officerId: 'zhong-hui' },
      { kind: 'officer-alive', officerId: 'hu-lie' },
    ],
    description:
      'He shut the Wei generals in the government offices and could not decide whether to kill them. Hu Lie\'s son got word over the wall; the camps came in at noon with ladders and fire. Zhong Hui and Jiang Wei fought with their own hands and were cut down; Jiang Wei\'s heart, they said afterwards, was the size of a peck measure.',
    descriptionZh: '會欲盡殺魏將,猶豫未決。胡烈子淵得其父書,宣告諸軍。眾將謀曰:「不如盡殺牙門騎督以上。」正月十八日,諸軍鼓噪而入,會與姜維率左右格鬥,皆見殺。時人云:維死時見剖,膽大如斗。',
    effects: [
      { kind: 'officer-status', officerId: 'zhong-hui', status: 'dead' },
      { kind: 'officer-status', officerId: 'jiang-wei', status: 'dead' },
      /*
       * 0.7 → 0.9(2026-08-08)。史書上鍾會一死,那支軍隊當天就散了 ——
       * 衛瓘接管成都、士卒各還本營,不是留著幾座城跟朝廷慢慢打。
       * 體檢八輪:反正 0.7 之下鍾會軍終局中位仍有 6 城,而魏的「收蜀定亂」
       * 只有 1/8 —— 那 1/8 不是魏打不贏,是收尾收不完。
       */
      { kind: 'force-cities-revolt-ruler', rulerOfficerId: 'zhong-hui', fraction: 0.9 },
      { kind: 'flag', key: 'zhonghui-ended' },
    ],
  },

  /* ---- 遼東·襄平之戰(238)-------------------------------------------- */
  {
    id: 'evt-xiangping-rain',
    name: { en: 'The Rain at Xiangping', zh: '襄平大雨·不移營' },
    yearMin: 238,
    yearMax: 241,
    requires: [
      { kind: 'flag-set', key: 'chain-xiangping' },
      { kind: 'officer-alive', officerId: 'sima-yi' },
      { kind: 'officer-alive', officerId: 'gongsun-yuan' },
    ],
    description:
      'It rained for a month; the Liao rose and boats came up to the walls of the camp. The officers asked to move to higher ground. Sima Yi had the next man who asked beheaded, and the camp stayed where it was. When the water went down he closed the ring.',
    descriptionZh: '會霖雨三十餘日,遼水暴長,運船自遼口徑至城下。雨甚,平地水數尺,三軍恐,欲移營。宣王令軍中敢有言徙者斬 —— 都督令史張靜犯令,斬之,軍中乃定。',
    effects: [
      { kind: 'city-defense', cityId: 'xiangping', delta: -15 },
      { kind: 'officer-loyalty', officerId: 'sima-yi', delta: 8 },
      { kind: 'flag', key: 'xiangping-ring' },
    ],
  },
  {
    id: 'evt-xiangping-envoy',
    name: { en: 'Gongsun Yuan Sends for Terms', zh: '公孫淵乞降' },
    yearMin: 238,
    yearMax: 242,
    requires: [
      { kind: 'flag-set', key: 'chain-xiangping' },
      { kind: 'flag-set', key: 'xiangping-ring' },
      { kind: 'officer-alive', officerId: 'gongsun-yuan' },
    ],
    description:
      'Inside the walls they were eating each other. Yuan sent his chancellor and his censor to ask for terms; Sima Yi killed them both. He sent a lesser officer to say he would send a hostage. "War has five ways: fight, hold, run, surrender, die. You will not bind yourself and come — that is choosing to die. There is no need for a hostage."',
    descriptionZh: '城中糧盡,人相食,死者甚多,將軍楊祚等降。淵遣相國王建、御史大夫柳甫乞降,請解圍面縛。宣王皆斬之。淵復遣侍中衛演乞剋日送任。宣王曰:「軍事大要有五:能戰當戰,不能戰當守,不能守當走,餘二事惟有降與死耳。汝不肯面縛,此為決就死也,不須送任。」',
    effects: [],
    chooserRulerId: 'gongsun-yuan',
    choices: [
      {
        id: 'breakout',
        label: { zh: '將數百騎突圍東南', en: 'Break out southeast with a few hundred horse' },
        effects: [
          { kind: 'officer-status', officerId: 'gongsun-yuan', status: 'dead' },
          { kind: 'force-cities-revolt-ruler', rulerOfficerId: 'gongsun-yuan', fraction: 0.6 },
          { kind: 'flag', key: 'xiangping-ended' },
          // 城**破**了才有下一節的京觀 —— 另一個選項是嬰城不出,城還在。
          { kind: 'flag', key: 'xiangping-stormed' },
        ],
      },
      {
        id: 'hold',
        label: { zh: '嬰城死守,待其糧盡而還', en: 'Hold the walls; his supply comes further than mine' },
        effects: [
          { kind: 'city-defense', cityId: 'xiangping', delta: 20 },
          { kind: 'city-food', cityId: 'xiangping', delta: -3000 },
          { kind: 'flag', key: 'xiangping-ended' },
        ],
      },
    ],
  },

  // ---- 隋唐·虎牢之戰 ----------------------------------------------------
  {
    id: 'evt-hulao-1',
    name: { en: 'Besiege Luoyang, Fight the Relief', zh: '圍洛打援' },
    yearMin: 178,
    yearMax: 181,
    requires: [
      { kind: 'flag-set', key: 'chain-hulao' },
      { kind: 'officer-alive', officerId: 'hist-tang-taizong' },
      { kind: 'officer-alive', officerId: 'hist-dou-jiande' },
      { kind: 'flag-unset', key: 'hulao-set' },
    ],
    description:
      'Luoyang has held for eight months and the army wants to go home; now Dou Jiande is coming down from Hebei with a hundred thousand to raise the siege. Every general says withdraw. Li Shimin says: keep the siege, and take three thousand five hundred to Hulao to hold the gate.',
    descriptionZh: '圍洛八月不下,將士思歸,而竇建德將兵十餘萬西救王世充。諸將皆請還師,秦王曰:「世充糧盡,內外離心,不煩力攻,可以坐克。建德新破海公,將驕卒惰,吾據武牢,扼其咽喉。」',
    effects: [],
    chooserRulerId: 'hist-li-yuan',
    choices: [
      {
        id: 'hold',
        label: { zh: '圍洛不解,自將三千五百騎據武牢', en: 'Hold the siege. Take 3,500 to Hulao.' },
        effects: [
          { kind: 'flag', key: 'hulao-set' },
          { kind: 'flag', key: 'hulao-held' },
          { kind: 'officer-loyalty', officerId: 'hist-tang-taizong', delta: 8 },
        ],
      },
      {
        id: 'withdraw',
        label: { zh: '解圍還師,避其鋒銳', en: 'Lift the siege and go home' },
        effects: [
          { kind: 'flag', key: 'hulao-set' },
          { kind: 'force-troops-multiplier-ruler', rulerOfficerId: 'hist-wang-shichong', multiplier: 1.3 },
          { kind: 'force-troops-multiplier-ruler', rulerOfficerId: 'hist-dou-jiande', multiplier: 1.2 },
        ],
      },
    ],
  },
  {
    id: 'evt-hulao-2',
    name: { en: 'Ling Jing Advises Taking Taiyuan', zh: '凌敬勸取晉陽' },
    yearMin: 178,
    yearMax: 182,
    season: 'summer',
    requires: [
      { kind: 'flag-set', key: 'chain-hulao' },
      { kind: 'flag-set', key: 'hulao-held' },
      { kind: 'officer-alive', officerId: 'hist-dou-jiande' },
      { kind: 'flag-unset', key: 'hulao-decided' },
    ],
    description:
      'His counsellor says: do not force Hulao. Cross the river, take Huaizhou and Heyang, climb over Taihang and go into Shangdang — Tang must come back to save its own country, and Luoyang lifts itself. Wang Shichong\'s envoys have been buying the generals all week, and the generals say: fight here.',
    descriptionZh: '凌敬曰:「宜悉兵濟河,攻取懷州、河陽,踰太行,入上黨 —— 唐必還師自救,鄭圍自解。」而王世充遣使告急相繼,諸將皆受世充金,爭言:「凌敬書生,豈可與言戰事!」',
    effects: [],
    chooserRulerId: 'hist-dou-jiande',
    choices: [
      {
        id: 'north',
        label: { zh: '用凌敬之策 —— 踰太行,入上黨', en: "Take Ling Jing's road: over Taihang into Shangdang" },
        effects: [
          { kind: 'force-troops-multiplier-ruler', rulerOfficerId: 'hist-dou-jiande', multiplier: 1.15 },
          { kind: 'mandate-ruler', rulerOfficerId: 'hist-dou-jiande', delta: 8 },
          { kind: 'flag', key: 'hulao-decided' },
          { kind: 'flag', key: 'hulao-north' },
        ],
      },
      {
        id: 'fight',
        label: { zh: '決戰武牢 —— 諸將所願', en: 'Fight at Hulao, as the generals want' },
        effects: [
          { kind: 'flag', key: 'hulao-decided' },
          { kind: 'flag', key: 'hulao-battle' },
        ],
      },
    ],
  },
  {
    id: 'evt-hulao-3',
    name: { en: 'Two Kings in One Day', zh: '一戰擒兩王' },
    yearMin: 178,
    yearMax: 183,
    requires: [
      { kind: 'flag-set', key: 'chain-hulao' },
      { kind: 'flag-set', key: 'hulao-battle' },
      { kind: 'officer-alive', officerId: 'hist-tang-taizong' },
      { kind: 'officer-alive', officerId: 'hist-dou-jiande' },
    ],
    description:
      'Xia stood in line from dawn to noon; the men sat down and began fighting over water. Then the horse came out of the Fan river valley behind them. Dou Jiande was speared off his mount and taken alive; the head of Xia went to Luoyang under the walls, and Wang Shichong came out with his hands bound.',
    descriptionZh: '建德列陣,自辰至午,士卒饑倦,皆坐列,又爭飲水。秦王曰:「可擊矣!」親率輕騎出汜水東,直薄其陣。建德為長矛所中,竄於牛口渚,車騎將軍白士讓生擒之。王世充見建德檻車至城下,乃率其群臣面縛出降。',
    effects: [
      { kind: 'officer-status', officerId: 'hist-dou-jiande', status: 'imprisoned' },
      { kind: 'force-cities-revolt-ruler', rulerOfficerId: 'hist-dou-jiande', fraction: 0.5 },
      { kind: 'force-cities-revolt-ruler', rulerOfficerId: 'hist-wang-shichong', fraction: 0.5 },
      { kind: 'mandate-ruler', rulerOfficerId: 'hist-li-yuan', delta: 15 },
      { kind: 'flag', key: 'hulao-won' },
    ],
  },

  // ---- 西陵之戰 ---------------------------------------------------------
  {
    id: 'evt-xiling-1',
    name: { en: 'Lu Kang Builds a Wall Instead', zh: '陸抗築圍' },
    yearMin: 272,
    yearMax: 275,
    requires: [
      { kind: 'flag-set', key: 'chain-xiling' },
      { kind: 'officer-alive', officerId: 'lu-kang' },
      { kind: 'officer-alive', officerId: 'bu-chan' },
      { kind: 'flag-unset', key: 'xiling-decided' },
    ],
    description:
      'Bu Chan has given Xiling to Jin and Jin is marching to hold it. The army wants to storm the city before the relief arrives. Lu Kang makes them build a ring of wall and ditch around it instead — outward as well as inward — and the men dig for a month and complain the whole time.',
    descriptionZh: '步闡據西陵降晉,晉遣羊祜等三道來援。諸將咸欲急攻闡,抗曰:「此城處勢既固,糧穀又足,且所繕修備禦之具,皆抗所宿規。今反攻之,不可猝拔。」乃令築嚴圍,自赤谿至故市,內以圍闡,外以禦寇,晝夜催切,眾甚苦之。',
    effects: [],
    chooserRulerId: 'sun-hao',
    choices: [
      {
        id: 'wall',
        label: { zh: '築嚴圍 —— 內以圍闡,外以禦寇', en: 'Build the ring: inward against Bu Chan, outward against Jin' },
        /*
         * ⚠ 這裡原本寫的是 `city-defense: xiling +20` —— 而西陵在這張盤上是
         * **步闡獻給晉的城**。也就是說吳玩家選「築嚴圍」,系統反手把敵人的城
         * 修硬了 20 點。陸抗築的是圍城的牆(自赤谿至故市),內以圍闡、外以禦寇,
         * 它該讓那座孤城守不下去,不是讓它更好守。
         */
        effects: [
          { kind: 'city-troops-multiplier', cityId: 'xiling', multiplier: 0.72 },
          { kind: 'city-food', cityId: 'xiling', delta: -22000 },
          { kind: 'city-loyalty', cityId: 'xiling', delta: -20 },
          { kind: 'officer-loyalty', officerId: 'lu-kang', delta: 8 },
          { kind: 'flag', key: 'xiling-decided' },
          { kind: 'flag', key: 'xiling-walled' },
        ],
      },
      {
        id: 'storm',
        label: { zh: '諸將所請 —— 急攻之', en: 'Storm it now, as the generals ask' },
        effects: [
          { kind: 'force-troops-multiplier-ruler', rulerOfficerId: 'sun-hao', multiplier: 0.85 },
          { kind: 'flag', key: 'xiling-decided' },
        ],
      },
    ],
  },
  {
    id: 'evt-xiling-2',
    name: { en: "Yang Hu's Wine and Lu Kang's Medicine", zh: '羊陸之交' },
    yearMin: 273,
    yearMax: 278,
    season: 'spring',
    requires: [
      { kind: 'flag-set', key: 'chain-xiling' },
      { kind: 'officer-alive', officerId: 'lu-kang' },
      { kind: 'officer-alive', officerId: 'yang-hu' },
      { kind: 'flag-unset', key: 'xiling-friendship' },
    ],
    description:
      'Lu Kang was ill and asked across the line for medicine; Yang Hu sent it, ready-made. His staff said do not drink it. He drank it. When Yang Hu wanted wine, Lu Kang sent a jar and said drink it, it is mine. "If he behaves like this," Lu Kang told his officers, "and we answer with raids, we shall be conquered without a battle."',
    descriptionZh: '抗嘗病,祜饋之藥。抗服之無疑心,人多諫抗,抗曰:「羊祜豈鴆人者!」祜嘗欲酒,抗酒與之,祜飲不疑。抗告其邊戍曰:「彼專為德,我專為暴,是不戰而自服也。各保分界而已,無求細利。」',
    effects: [],
    chooserRulerId: 'sun-hao',
    choices: [
      {
        id: 'keep',
        label: { zh: '各保分界,無求細利', en: 'Each keeps his line. No raiding for scraps.' },
        effects: [
          { kind: 'officer-loyalty', officerId: 'lu-kang', delta: 10 },
          { kind: 'city-loyalty', cityId: 'xiling', delta: 10 },
          { kind: 'flag', key: 'xiling-friendship' },
        ],
      },
      {
        id: 'accuse',
        label: { zh: '通敵之嫌 —— 詔問陸抗', en: 'Summon Lu Kang to explain himself' },
        effects: [
          { kind: 'officer-loyalty', officerId: 'lu-kang', delta: -20 },
          { kind: 'mandate-ruler', rulerOfficerId: 'sun-hao', delta: -10 },
          { kind: 'flag', key: 'xiling-friendship' },
        ],
      },
    ],
  },
  {
    id: 'evt-xiling-3',
    name: { en: 'The Screen of the State', zh: '國之藩表' },
    yearMin: 274,
    yearMax: 279,
    season: 'autumn',
    requires: [
      { kind: 'flag-set', key: 'chain-xiling' },
      { kind: 'officer-alive', officerId: 'lu-kang' },
      /*
       * 西陵得先回到吳手上這一疏才說得通 —— 「西陵國之西門」是陸抗**收復之後**
       * 上的疏,而效果是替它增兵加防。城還在晉手裡就演,等於替敵人加固。
       */
      { kind: 'city-owner-ruler', cityId: 'xiling', rulerOfficerId: 'sun-hao' },
      { kind: 'flag-unset', key: 'xiling-memorial' },
    ],
    description:
      'Lu Kang memorialises: Xiling and Jianping are the screen of the state, and they stand outside everything else — if an enemy comes down the river in force, no help from the interior arrives in time. Give me thirty thousand more men there. The court is busy with other things.',
    descriptionZh: '抗上疏曰:「西陵、建平,國之蕃表,既處下流,受敵二境。若敵泛舟順流,舳艫千里,星奔電邁,俄然行至,非可恃援他部以救倒縣也。此乃社稷安危之機,非徒封疆侵陵小害也。臣父遜昔在西垂陳言,以為西陵國之西門,雖云易守,亦復易失。」',
    effects: [
      { kind: 'city-defense', cityId: 'xiling', delta: 15 },
      { kind: 'city-troops-multiplier', cityId: 'xiling', multiplier: 1.2 },
      { kind: 'flag', key: 'xiling-memorial' },
    ],
  },

  {
    /*
     * 這條鏈原本缺的是**這一仗本身**:築圍 → 羊陸之交 → 上疏,而「圍了一個月
     * 之後怎麼了」沒有人交代。史書上這裡是三路晉援被逐一擊破、西陵城破、
     * 步闡與同謀者數十家夷三族 —— 吳國兵法的最後一件傑作,替這個王朝又
     * 續了十年。
     *
     * 事件不能直接把城judge給誰(EventEffect 沒有轉移歸屬那一種,那是刻意的:
     * 城要靠打)。所以這一節做的是**讓那座孤城守不住**:圍了一冬,城中糧盡、
     * 兵疲、人心已離,剩下的交給盤上的軍隊。
     */
    id: 'evt-xiling-4',
    name: { en: 'Xiling Falls; the Bu Clan Ends', zh: '破西陵・誅步氏' },
    yearMin: 272,
    yearMax: 276,
    requires: [
      { kind: 'flag-set', key: 'chain-xiling' },
      { kind: 'flag-set', key: 'xiling-walled' },
      { kind: 'officer-alive', officerId: 'lu-kang' },
      { kind: 'officer-alive', officerId: 'bu-chan' },
      { kind: 'flag-unset', key: 'xiling-fallen' },
    ],
    description:
      'The ring holds. Yang Hu drives at Jiangling and is turned; Yang Zhao comes up to the wall and is beaten off in the dark; Xu Yin never gets past the gorge. Then the ring turns inward. Bu Chan and the dozens of families who went over with him are put to death to the third degree of kin — and Lu Kang, having taken the city, pardons everyone else.',
    descriptionZh: '圍既成,羊祜攻江陵不克,楊肇夜遁,徐胤不得過峽。三道之援既卻,抗乃還攻西陵。城中糧盡,守者離心,遂拔之。闡及其同計者數十家,皆夷三族;自餘所請,一無所問。吳人謂之「國之藩表」既固,而晉之圖吳,自此又待八年。',
    effects: [
      { kind: 'city-troops-multiplier', cityId: 'xiling', multiplier: 0.45 },
      { kind: 'city-defense', cityId: 'xiling', delta: -25 },
      { kind: 'city-loyalty', cityId: 'xiling', delta: -25 },
      { kind: 'officer-status', officerId: 'bu-chan', status: 'dead' },
      { kind: 'officer-loyalty', officerId: 'lu-kang', delta: 12 },
      { kind: 'mandate-ruler', rulerOfficerId: 'sun-hao', delta: 8 },
      { kind: 'mandate-ruler', rulerOfficerId: 'sima-yan', delta: -5 },
      { kind: 'flag', key: 'xiling-fallen' },
    ],
    mood: 'martial',
  },

  /* ---- 假想:若郭嘉不死(chain-guojia)----------------------------------
   *
   * 十七張假想盤此前**一條專屬事件鏈都沒有**(`eventFlags` 全空),於是
   * 「前提成立之後會發生什麼」在盤上沒有著落 —— 郭嘉活著,而他活著這件事
   * 不影響任何一個場面。這是第一條。
   *
   * 鏈的骨架照史書上曹操自己的話走:赤壁敗後他嘆「郭奉孝在,不使孤至此」。
   * 那句話的意思很具體 —— 郭嘉諫的從來不是「別打」,是**別急**。
   */
  {
    id: 'evt-guojia-alt-1',
    name: { en: "Fengxiao's Caution", zh: '奉孝諫緩' },
    yearMin: 208,
    yearMax: 209,
    requires: [
      { kind: 'flag-set', key: 'chain-guojia' },
      { kind: 'officer-alive', officerId: 'guo-jia' },
      { kind: 'officer-alive', officerId: 'cao-cao' },
      { kind: 'flag-unset', key: 'guojia-alt-advised' },
    ],
    description:
      'Guo Jia does not say do not go. He says the northern men have not learned the water, the newly surrendered Jing fleet has not learned you, and both of those take a winter. Cao Cao has eighty thousand hulls and a following wind of victory.',
    descriptionZh: '嘉不諫南征,諫的是「毋急」:北兵不習水土,荊州新附之眾不習主帥,二者皆須一冬。而公有舟八十萬斛、破荊州之威,諸將皆言乘勝可下江東。',
    effects: [],
    chooserRulerId: 'cao-cao',
    choices: [
      {
        id: 'wait',
        label: { zh: '納其謀 —— 屯江陵,俟明春', en: 'Take the counsel — winter at Jiangling' },
        effects: [
          { kind: 'flag', key: 'guojia-alt-advised' },
          { kind: 'flag', key: 'guojia-alt-patient' },
          { kind: 'city-troops-multiplier', cityId: 'jiangling', multiplier: 1.15 },
          { kind: 'officer-loyalty', officerId: 'guo-jia', delta: 10 },
          { kind: 'mandate-ruler', rulerOfficerId: 'cao-cao', delta: -3 },
        ],
      },
      {
        id: 'press',
        label: { zh: '乘勝而東 —— 諸將所請', en: 'Press east on the tide of victory' },
        effects: [
          { kind: 'flag', key: 'guojia-alt-advised' },
          { kind: 'force-troops-multiplier-ruler', rulerOfficerId: 'cao-cao', multiplier: 1.08 },
          { kind: 'mandate-ruler', rulerOfficerId: 'cao-cao', delta: 4 },
        ],
      },
    ],
  },
  {
    /*
     * 第二節只在「納其謀」之後演 —— 這正是這張盤要回答的那個問題:
     * 鬼才在側,那條鐵索還連不連得起來。史書上曹操是**自己**燒船退的
     * (「公燒其餘船引退」),而火是周瑜點的。
     */
    id: 'evt-guojia-alt-2',
    name: { en: 'The Chain That Was Not Laid', zh: '連環未成' },
    yearMin: 208,
    yearMax: 210,
    requires: [
      { kind: 'flag-set', key: 'chain-guojia' },
      { kind: 'flag-set', key: 'guojia-alt-patient' },
      { kind: 'officer-alive', officerId: 'guo-jia' },
      { kind: 'flag-unset', key: 'guojia-alt-chain' },
    ],
    description:
      "Pang Tong comes with his advice about linking the hulls. Guo Jia asks one question — what does a man who links ships do when the wind turns? — and Cao Cao sends the visitor away with gifts and does not link them.",
    descriptionZh: '龐士元來獻連環之策,言鎖船首尾則北兵不病。嘉問一句:「船既相聯,風轉則何如?」公乃厚遣之而不用其策。是冬東南風果至,而江上無可燃之陣。',
    effects: [
      { kind: 'flag', key: 'guojia-alt-chain' },
      { kind: 'mandate-ruler', rulerOfficerId: 'cao-cao', delta: 8 },
      { kind: 'mandate-ruler', rulerOfficerId: 'sun-quan', delta: -6 },
      { kind: 'officer-loyalty', officerId: 'guo-jia', delta: 8 },
    ],
    mood: 'auspicious',
  },
  {
    /*
     * 第三節是代價那一面:急也好緩也好,郭嘉活著的代價是**荀彧那一邊的人
     * 開始不安**。史書上郭嘉「不治行檢」,陳群數廷訴之,而太祖愈重之。
     * 這一節讓那條裂縫在盤上有數字。
     */
    id: 'evt-guojia-alt-3',
    name: { en: 'Chen Qun Lodges a Complaint', zh: '陳群廷訴' },
    yearMin: 209,
    yearMax: 212,
    requires: [
      { kind: 'flag-set', key: 'chain-guojia' },
      { kind: 'officer-alive', officerId: 'guo-jia' },
      { kind: 'officer-alive', officerId: 'chen-qun' },
      { kind: 'flag-unset', key: 'guojia-alt-rift' },
    ],
    description:
      "Chen Qun brings it up in open court again: Guo Jia keeps no decorum. Cao Cao commends Chen Qun for saying so and thinks more of Guo Jia than before — which settles nothing.",
    descriptionZh: '嘉不治行檢,陳群數廷訴之。嘉意自若,而太祖愈重之 —— 一邊嘉其公,一邊重其能,兩邊都沒有話說,而事情也就沒有了結。',
    effects: [
      { kind: 'flag', key: 'guojia-alt-rift' },
      { kind: 'officer-loyalty', officerId: 'chen-qun', delta: -8 },
      { kind: 'officer-loyalty', officerId: 'guo-jia', delta: 6 },
    ],
    mood: 'somber',
  },

  /* ---- 假想:關羽守住荊州(chain-guanyu-jing)---------------------------
   * 前提是白衣渡江功敗垂成、呂蒙憂憤而歿。那麼接下來要回答的是:
   * **孫劉之盟還剩什麼**,以及雲長那把刀往哪裡指。
   */
  {
    id: 'evt-gyjing-1',
    name: { en: 'The Alliance After the Knife', zh: '盟好之餘' },
    yearMin: 220,
    yearMax: 223,
    requires: [
      { kind: 'flag-set', key: 'chain-guanyu-jing' },
      { kind: 'officer-alive', officerId: 'guan-yu' },
      { kind: 'officer-alive', officerId: 'sun-quan' },
      { kind: 'flag-unset', key: 'gyjing-alliance' },
    ],
    description:
      "Lü Meng's boats turned back and Lü Meng is dead of it. Sun Quan sends an envoy to Jiangling with gifts and no explanation. Guan Yu has the letter read out in front of the man who brought it.",
    descriptionZh: '白衣之舟既還,呂蒙憂憤而歿。權遣使至江陵,厚幣而無一語及前事。羽命當使者之面讀其書 —— 讀畢,問左右:「此盟,還算不算?」',
    effects: [],
    chooserRulerId: 'liu-bei',
    choices: [
      {
        id: 'keep',
        label: { zh: '算 —— 北向者曹,不在江東', en: 'It holds — the enemy is north, not east' },
        effects: [
          { kind: 'flag', key: 'gyjing-alliance' },
          { kind: 'flag', key: 'gyjing-allied' },
          { kind: 'mandate-ruler', rulerOfficerId: 'liu-bei', delta: 6 },
          { kind: 'officer-loyalty', officerId: 'guan-yu', delta: -6 },
        ],
      },
      {
        id: 'break',
        label: { zh: '不算 —— 東吳鼠子,終為腹心之患', en: 'It does not — the east will try again' },
        effects: [
          { kind: 'flag', key: 'gyjing-alliance' },
          { kind: 'city-defense', cityId: 'jiangling', delta: 12 },
          { kind: 'officer-loyalty', officerId: 'guan-yu', delta: 10 },
          { kind: 'mandate-ruler', rulerOfficerId: 'sun-quan', delta: -5 },
        ],
      },
    ],
  },
  {
    /* 只在「盟好還算」之後演 —— 荊州不必回頭看,那把刀就指得出去。 */
    id: 'evt-gyjing-2',
    name: { en: 'Northward Again', zh: '再出襄樊' },
    yearMin: 221,
    yearMax: 225,
    requires: [
      { kind: 'flag-set', key: 'chain-guanyu-jing' },
      { kind: 'flag-set', key: 'gyjing-allied' },
      { kind: 'officer-active', officerId: 'guan-yu' },
      { kind: 'city-owner-ruler', cityId: 'jiangling', rulerOfficerId: 'liu-bei' },
      { kind: 'flag-unset', key: 'gyjing-north' },
    ],
    description:
      "With the river behind him secure for the first time, Guan Yu goes up the Han again — and this time nobody is coming across it while his back is turned.",
    descriptionZh: '後路既固,羽復北向。前歲水淹七軍、威震華夏而終於功敗者,敗在江陵一夕易主;今江陵在手,而樊城之圍,可以圍到底。',
    effects: [
      { kind: 'flag', key: 'gyjing-north' },
      { kind: 'city-defense', cityId: 'fancheng', delta: -20 },
      { kind: 'city-troops-multiplier', cityId: 'fancheng', multiplier: 0.75 },
      { kind: 'mandate-ruler', rulerOfficerId: 'liu-bei', delta: 8 },
      { kind: 'officer-loyalty', officerId: 'guan-yu', delta: 8 },
    ],
    mood: 'martial',
  },

  /* ---- 假想:若周瑜不死(chain-zhouyu)---------------------------------
   * 骨架是現成的 —— 周瑜臨終前上疏所請的那個方略:「乞與奮威俱進取蜀,
   * 得蜀而并張魯,因留奮威固守其地,好與馬超結援。瑜還與將軍據襄陽以蹙操,
   * 北方可圖也。」他死在巴丘,而這張盤的前提是他沒有。
   */
  {
    id: 'evt-zhouyu-alt-1',
    name: { en: "The Memorial from Baqiu", zh: '巴丘上疏' },
    yearMin: 211,
    yearMax: 213,
    requires: [
      { kind: 'flag-set', key: 'chain-zhouyu' },
      { kind: 'officer-active', officerId: 'zhou-yu' },
      { kind: 'officer-alive', officerId: 'sun-quan' },
      { kind: 'flag-unset', key: 'zhouyu-alt-plan' },
    ],
    description:
      "The memorial Zhou Yu wrote at Baqiu was the last thing he did. This time he delivers it standing up: take Shu, swallow Zhang Lu, leave Fenwei to hold it, ally with Ma Chao — then come back and press Cao Cao at Xiangyang from both ends.",
    descriptionZh: '「乞與奮威俱進取蜀,得蜀而并張魯,因留奮威固守其地,好與馬超結援。瑜還與將軍據襄陽以蹙操,北方可圖也。」—— 史書上這道疏是他最後做的一件事;這一回他是站著呈上來的。',
    effects: [],
    chooserRulerId: 'sun-quan',
    choices: [
      {
        id: 'west',
        label: { zh: '許之 —— 西取巴蜀', en: 'Grant it — take Shu' },
        effects: [
          { kind: 'flag', key: 'zhouyu-alt-plan' },
          { kind: 'flag', key: 'zhouyu-alt-west' },
          { kind: 'force-troops-multiplier-ruler', rulerOfficerId: 'sun-quan', multiplier: 1.12 },
          { kind: 'officer-loyalty', officerId: 'zhou-yu', delta: 10 },
          { kind: 'mandate-ruler', rulerOfficerId: 'liu-bei', delta: -6 },
        ],
      },
      {
        id: 'hold',
        label: { zh: '不許 —— 荊州未定,不宜遠圖', en: 'Deny it — Jingzhou is not settled' },
        effects: [
          { kind: 'flag', key: 'zhouyu-alt-plan' },
          { kind: 'city-defense', cityId: 'jiangling', delta: 14 },
          { kind: 'officer-loyalty', officerId: 'zhou-yu', delta: -8 },
          { kind: 'mandate-ruler', rulerOfficerId: 'sun-quan', delta: 3 },
        ],
      },
    ],
  },
  {
    /* 許之之後 —— 那條路上第一個要過的人是劉備,而不是劉璋。 */
    id: 'evt-zhouyu-alt-2',
    name: { en: 'The Man in the Way', zh: '借道之議' },
    yearMin: 211,
    yearMax: 215,
    requires: [
      { kind: 'flag-set', key: 'chain-zhouyu' },
      { kind: 'flag-set', key: 'zhouyu-alt-west' },
      { kind: 'officer-active', officerId: 'zhou-yu' },
      { kind: 'officer-alive', officerId: 'liu-bei' },
      { kind: 'flag-unset', key: 'zhouyu-alt-road' },
    ],
    description:
      "The road west runs through Liu Bei's Jiangling. He replies that Liu Zhang is his kinsman and that he would rather let his hair down and go into the hills than see Shu taken — which everyone present understands as a threat.",
    descriptionZh: '西向之道,取於劉備之江陵。備報曰:「備與璋託為宗室,若備討璋,則備放發歸於山林,不失信於天下也。」—— 在座者皆知此為拒辭。',
    effects: [
      { kind: 'flag', key: 'zhouyu-alt-road' },
      { kind: 'city-troops-multiplier', cityId: 'jiangling', multiplier: 0.9 },
      { kind: 'mandate-ruler', rulerOfficerId: 'sun-quan', delta: -4 },
      { kind: 'officer-loyalty', officerId: 'zhou-yu', delta: 6 },
    ],
    mood: 'ominous',
  },

  /* ---- 假想:若孫策不死(chain-sunce)-----------------------------------
   * 前提是許貢門客那一刺沒中。他被刺那年正在做的事,史書寫得很清楚:
   * 「建安五年,曹公與袁紹相拒於官渡,策陰欲襲許,迎漢帝。」
   */
  {
    id: 'evt-sunce-alt-1',
    name: { en: 'Secretly, to Xu', zh: '陰欲襲許' },
    yearMin: 201,
    yearMax: 203,
    requires: [
      { kind: 'flag-set', key: 'chain-sunce' },
      { kind: 'officer-active', officerId: 'sun-ce' },
      { kind: 'officer-alive', officerId: 'cao-cao' },
      { kind: 'flag-unset', key: 'sunce-alt-plan' },
    ],
    description:
      "Cao Cao is pinned at Guandu with everything he has. Sun Ce, twenty-six and never beaten, has the shortest road to an empty Xuchang and the Emperor sitting in it. His officers point out that the road runs past Huang Zu, who killed his father.",
    descriptionZh: '曹公與袁紹相拒於官渡,許下空虛。策年二十六而未嘗一敗,去許最近者莫如江東。而諸將言:北上之道,先過黃祖 —— 那是殺父之讎。',
    effects: [],
    chooserRulerId: 'sun-ce',
    choices: [
      {
        id: 'north',
        label: { zh: '北上襲許,迎天子', en: 'North to Xu — and the Emperor' },
        effects: [
          { kind: 'flag', key: 'sunce-alt-plan' },
          { kind: 'flag', key: 'sunce-alt-north' },
          { kind: 'force-troops-multiplier-ruler', rulerOfficerId: 'sun-ce', multiplier: 1.15 },
          { kind: 'mandate-ruler', rulerOfficerId: 'sun-ce', delta: 8 },
          { kind: 'mandate-ruler', rulerOfficerId: 'cao-cao', delta: -6 },
        ],
      },
      {
        id: 'west',
        label: { zh: '先報父讎 —— 西討黃祖', en: "First the blood debt — west against Huang Zu" },
        effects: [
          { kind: 'flag', key: 'sunce-alt-plan' },
          { kind: 'city-troops-multiplier', cityId: 'jiangxia', multiplier: 0.7 },
          { kind: 'officer-loyalty', officerId: 'sun-ce', delta: 10 },
          { kind: 'mandate-ruler', rulerOfficerId: 'sun-ce', delta: 4 },
        ],
      },
    ],
  },
  {
    /*
     * 代價那一面 —— 郭嘉在他死前就把話說完了,而那段話是這張盤真正的難題:
     * 前提保護攔得住事件,攔不住他自己的性子。
     */
    id: 'evt-sunce-alt-2',
    name: { en: "What Guo Jia Said", zh: '郭嘉之言' },
    yearMin: 201,
    yearMax: 205,
    requires: [
      { kind: 'flag-set', key: 'chain-sunce' },
      { kind: 'officer-active', officerId: 'sun-ce' },
      { kind: 'flag-unset', key: 'sunce-alt-warning' },
    ],
    description:
      "Guo Jia's assessment gets repeated back to him: Sun Ce has killed every man of standing in Jiangdong, and every one of them left someone behind; he rides out with no guard; a hundred thousand men are no protection against one determined nobody.",
    descriptionZh: '有以郭嘉語聞於策者:「策新并江東,所誅皆英豪雄傑,能得人死力者也。然策輕而無備,雖有百萬之眾,無異於獨行中原也。若刺客伏起,一人之敵耳。」策聞之而笑,左右不敢言。',
    effects: [],
    chooserRulerId: 'sun-ce',
    choices: [
      {
        id: 'guard',
        label: { zh: '自此出必以兵衛', en: 'Ride with a guard from now on' },
        effects: [
          { kind: 'flag', key: 'sunce-alt-warning' },
          { kind: 'flag', key: 'sunce-alt-guarded' },
          { kind: 'officer-loyalty', officerId: 'sun-ce', delta: 6 },
          { kind: 'mandate-ruler', rulerOfficerId: 'sun-ce', delta: -3 },
        ],
      },
      {
        id: 'laugh',
        label: { zh: '笑而不改 —— 大丈夫豈畏匹夫', en: 'Laugh it off' },
        effects: [
          { kind: 'flag', key: 'sunce-alt-warning' },
          { kind: 'mandate-ruler', rulerOfficerId: 'sun-ce', delta: 5 },
          { kind: 'officer-loyalty', officerId: 'sun-quan', delta: -6 },
        ],
      },
    ],
  },

  /* ---- 假想:若董卓未亡(chain-dong)------------------------------------
   * 前提是連環美人之計事泄而敗,飛將仍在側。那麼問題只剩兩個:
   * 這個人拿天下要做什麼,以及那道裂縫還在不在。
   */
  {
    id: 'evt-dong-alt-1',
    name: { en: 'Thirty Years of Grain', zh: '郿塢三十年儲' },
    yearMin: 192,
    yearMax: 195,
    requires: [
      { kind: 'flag-set', key: 'chain-dong' },
      { kind: 'officer-active', officerId: 'dong-zhuo' },
      { kind: 'flag-unset', key: 'dong-alt-wu' },
    ],
    description:
      "He builds Meiwu two hundred and fifty li from Chang'an, walls as high as the capital's, thirty years of grain inside. \"If it comes off, the realm. If not, I can grow old in here.\" The men who dug it understand exactly what that second half means.",
    descriptionZh: '築塢於郿,高厚七丈,與長安城埒,積穀為三十年儲。自云:「事成,雄據天下;不成,守此足以畢老。」—— 掘土者皆知後半句是什麼意思。',
    effects: [],
    chooserRulerId: 'dong-zhuo',
    choices: [
      {
        id: 'build',
        label: { zh: '築之 —— 不成則守此畢老', en: 'Build it — a place to grow old' },
        effects: [
          { kind: 'flag', key: 'dong-alt-wu' },
          { kind: 'city-defense', cityId: 'changan', delta: 18 },
          { kind: 'city-food', cityId: 'changan', delta: 40000 },
          { kind: 'mandate-ruler', rulerOfficerId: 'dong-zhuo', delta: -8 },
        ],
      },
      {
        id: 'east',
        label: { zh: '不築 —— 提兵東出,事在關東', en: 'Do not — the realm is east of the passes' },
        effects: [
          { kind: 'flag', key: 'dong-alt-wu' },
          { kind: 'force-troops-multiplier-ruler', rulerOfficerId: 'dong-zhuo', multiplier: 1.15 },
          { kind: 'mandate-ruler', rulerOfficerId: 'dong-zhuo', delta: 5 },
        ],
      },
    ],
  },
  {
    /*
     * 那道裂縫 —— 連環計敗了,而它本來就不是憑空造出來的:
     * 「卓性剛而褊,忿不思難,嘗小失意,拔手戟擲布。」貂蟬只是把它撬開。
     */
    id: 'evt-dong-alt-2',
    name: { en: 'The Halberd Thrown', zh: '拔戟擲布' },
    yearMin: 192,
    yearMax: 196,
    requires: [
      { kind: 'flag-set', key: 'chain-dong' },
      { kind: 'officer-active', officerId: 'dong-zhuo' },
      { kind: 'officer-active', officerId: 'lu-bu' },
      { kind: 'flag-unset', key: 'dong-alt-rift' },
    ],
    description:
      "The plot failed, but the crack it was levering at was already there: Dong Zhuo throws a hand-halberd at Lü Bu over some small displeasure. Lü Bu dodges it, apologises, and is forgiven. Neither of them forgets.",
    descriptionZh: '計雖不成,而所撬之縫本來就在:卓性剛而褊,忿不思難,嘗小失意,拔手戟擲布。布拳捷得免,而後謝之,卓意亦解 —— 兩個人都沒有忘。',
    effects: [],
    chooserRulerId: 'dong-zhuo',
    choices: [
      {
        id: 'mend',
        label: { zh: '厚遇之 —— 誓為父子', en: 'Make it good — swear the father-son oath again' },
        effects: [
          { kind: 'flag', key: 'dong-alt-rift' },
          { kind: 'officer-loyalty', officerId: 'lu-bu', delta: 18 },
          { kind: 'mandate-ruler', rulerOfficerId: 'dong-zhuo', delta: -4 },
        ],
      },
      {
        id: 'ignore',
        label: { zh: '不以為意 —— 一戟而已', en: 'Think nothing of it — it was one halberd' },
        effects: [
          { kind: 'flag', key: 'dong-alt-rift' },
          { kind: 'officer-loyalty', officerId: 'lu-bu', delta: -20 },
          { kind: 'force-troops-multiplier-ruler', rulerOfficerId: 'dong-zhuo', multiplier: 1.06 },
        ],
      },
    ],
  },

  /* ---- 假想:若關羽威震華夏(chain-gynorth)-----------------------------
   * 開局就是水淹七軍之後那一刻,旌旗距許昌不過百里。兩節分別給兩邊:
   * 曹操那一邊真的議過遷都,而關羽這一邊真正的問題從來在後方。
   */
  {
    id: 'evt-gynorth-1',
    name: { en: 'Move the Capital', zh: '議徙許都' },
    yearMin: 219,
    yearMax: 221,
    requires: [
      { kind: 'flag-set', key: 'chain-gynorth' },
      { kind: 'officer-alive', officerId: 'guan-yu' },
      { kind: 'officer-alive', officerId: 'cao-cao' },
      { kind: 'flag-unset', key: 'gynorth-capital' },
    ],
    description:
      "Cao Cao proposes moving the court north out of Guan Yu's reach. Sima Yi and Jiang Ji tell him not to: Yu Jin's army was lost to water, not to battle; and Sun Quan will not enjoy watching Guan Yu win. Send someone east instead.",
    descriptionZh: '羽威震華夏,曹公議徙許都以避其銳。司馬宣王、蔣濟諫曰:「于禁等為水所沒,非戰攻之失,於國家大計未足有損。劉備、孫權,外親內疏,關羽得志,權必不願也。可遣人勸權躡其後。」',
    effects: [],
    chooserRulerId: 'cao-cao',
    choices: [
      {
        id: 'east',
        label: { zh: '納其言 —— 遣使勸權躡其後', en: 'Take the counsel — send east to Sun Quan' },
        effects: [
          { kind: 'flag', key: 'gynorth-capital' },
          { kind: 'flag', key: 'gynorth-envoy' },
          { kind: 'mandate-ruler', rulerOfficerId: 'cao-cao', delta: 6 },
          { kind: 'mandate-ruler', rulerOfficerId: 'liu-bei', delta: -5 },
        ],
      },
      {
        id: 'move',
        label: { zh: '徙都河北 —— 避其鋒', en: 'Move the court north, out of reach' },
        effects: [
          { kind: 'flag', key: 'gynorth-capital' },
          { kind: 'mandate-ruler', rulerOfficerId: 'cao-cao', delta: -12 },
          { kind: 'city-loyalty', cityId: 'xuchang', delta: -18 },
          { kind: 'mandate-ruler', rulerOfficerId: 'liu-bei', delta: 8 },
        ],
      },
    ],
  },
  {
    /*
     * 這一邊的問題從來不在樊城 —— 是江陵與公安那兩個人。
     * 「南郡太守糜芳在江陵,將軍傅士仁屯公安,素皆嫌羽自輕己。」
     */
    id: 'evt-gynorth-2',
    name: { en: 'The Two Men Behind Him', zh: '江陵公安' },
    yearMin: 219,
    yearMax: 222,
    requires: [
      { kind: 'flag-set', key: 'chain-gynorth' },
      { kind: 'officer-active', officerId: 'guan-yu' },
      { kind: 'city-owner-ruler', cityId: 'jiangling', rulerOfficerId: 'liu-bei' },
      { kind: 'flag-unset', key: 'gynorth-rear' },
    ],
    description:
      "Mi Fang holds Jiangling and Fu Shiren holds Gong'an, and both of them have been made to feel small by Guan Yu for years. Supplies for the northern army are late again. He can send word that he will deal with them when he gets back — or he can go back now.",
    descriptionZh: '南郡太守糜芳在江陵,將軍傅士仁屯公安,素皆嫌羽自輕己。羽之出軍,芳、仁供給軍資不悉相救,羽言「還當治之」—— 芳、仁咸懷懼不安。而北軍之資,又遲了一旬。',
    effects: [],
    chooserRulerId: 'liu-bei',
    choices: [
      {
        id: 'reassure',
        label: { zh: '緩其辭 —— 遣使慰撫,許以不問', en: 'Soften it — send word that nothing will be held against them' },
        effects: [
          { kind: 'flag', key: 'gynorth-rear' },
          { kind: 'city-loyalty', cityId: 'jiangling', delta: 20 },
          { kind: 'city-loyalty', cityId: 'gongan', delta: 20 },
          { kind: 'officer-loyalty', officerId: 'guan-yu', delta: -8 },
        ],
      },
      {
        id: 'punish',
        label: { zh: '還當治之 —— 軍法無私', en: '"I will deal with them when I return"' },
        effects: [
          { kind: 'flag', key: 'gynorth-rear' },
          { kind: 'city-loyalty', cityId: 'jiangling', delta: -22 },
          { kind: 'city-loyalty', cityId: 'gongan', delta: -22 },
          { kind: 'officer-loyalty', officerId: 'guan-yu', delta: 10 },
        ],
      },
    ],
  },

  /* ---- 假想:若袁紹勝官渡(chain-yuanguandu)----------------------------
   * 他贏了外面。而史書給袁紹的評語是「外寬雅有局度,憂喜不形於色,而內多
   * 忌害」—— 這張盤真正的題目在河北自己家裡:那個諫臣,和那三個兒子。
   */
  {
    id: 'evt-yuanguandu-1',
    name: { en: 'Tian Feng, Out of the Cell', zh: '田豐出獄' },
    yearMin: 201,
    yearMax: 204,
    requires: [
      { kind: 'flag-set', key: 'chain-yuanguandu' },
      { kind: 'officer-alive', officerId: 'yuan-shao' },
      { kind: 'officer-alive', officerId: 'tian-feng' },
      { kind: 'flag-unset', key: 'yuanguandu-tianfeng' },
    ],
    description:
      "Tian Feng told him to grind Cao Cao down instead of gambling on one battle, and went to prison for saying it. This time the advice worked. The man is still in the cell.",
    descriptionZh: '田豐諫持重以耗,言「曹公善用兵,變化無方,眾雖少,未可輕也」—— 而以此下獄。這一回那條計成了,而說話的人還在牢裡。',
    effects: [],
    chooserRulerId: 'yuan-shao',
    choices: [
      {
        id: 'release',
        label: { zh: '釋而謝之 —— 用其謀者當用其人', en: 'Release him and apologise' },
        effects: [
          { kind: 'flag', key: 'yuanguandu-tianfeng' },
          { kind: 'officer-loyalty', officerId: 'tian-feng', delta: 25 },
          { kind: 'mandate-ruler', rulerOfficerId: 'yuan-shao', delta: 8 },
        ],
      },
      {
        id: 'keep',
        label: { zh: '仍囚之 —— 勝不由諫', en: 'Leave him there — the victory was not his' },
        effects: [
          { kind: 'flag', key: 'yuanguandu-tianfeng' },
          { kind: 'officer-loyalty', officerId: 'tian-feng', delta: -30 },
          { kind: 'mandate-ruler', rulerOfficerId: 'yuan-shao', delta: -10 },
        ],
      },
    ],
  },
  {
    /*
     * 河北真正的裂縫 —— 「紹有三子,譚長而惠,尚少而美。紹妻劉氏愛尚,
     * 數稱其才,紹亦奇其貌,欲以為後,未顯而紹死。」而後兄弟相攻,曹操
     * 坐收之。這張盤把那個「未顯」交回給玩家。
     */
    id: 'evt-yuanguandu-2',
    name: { en: 'Which Son', zh: '三子之議' },
    yearMin: 202,
    yearMax: 206,
    requires: [
      { kind: 'flag-set', key: 'chain-yuanguandu' },
      { kind: 'officer-alive', officerId: 'yuan-shao' },
      { kind: 'flag-unset', key: 'yuanguandu-heir' },
    ],
    description:
      "Three sons: Tan is the eldest and able, Shang is the youngest and beautiful, and their mother has been praising Shang for years. Yuan Shao never settled it in his lifetime, and after him they went at each other until Cao Cao picked up the pieces.",
    descriptionZh: '紹有三子,譚長而惠,尚少而美。紹妻劉氏愛尚,數稱其才,紹亦奇其貌,欲以為後,未顯而紹死 —— 於是兄弟相攻,而曹操坐收河北。這一回,那個「未顯」交在你手上。',
    effects: [],
    chooserRulerId: 'yuan-shao',
    choices: [
      {
        id: 'eldest',
        label: { zh: '立長 —— 譚長而惠', en: 'The eldest — Tan' },
        effects: [
          { kind: 'flag', key: 'yuanguandu-heir' },
          { kind: 'officer-loyalty', officerId: 'yuan-tan', delta: 22 },
          { kind: 'officer-loyalty', officerId: 'yuan-shang', delta: -12 },
          { kind: 'mandate-ruler', rulerOfficerId: 'yuan-shao', delta: 7 },
        ],
      },
      {
        id: 'youngest',
        label: { zh: '立少 —— 尚少而美', en: 'The youngest — Shang' },
        effects: [
          { kind: 'flag', key: 'yuanguandu-heir' },
          { kind: 'officer-loyalty', officerId: 'yuan-shang', delta: 22 },
          { kind: 'officer-loyalty', officerId: 'yuan-tan', delta: -25 },
          { kind: 'mandate-ruler', rulerOfficerId: 'yuan-shao', delta: -6 },
        ],
      },
    ],
  },

  /* ---- 假想:若龐統不死(chain-pangtong)--------------------------------
   * 前提是落鳳坡之箭射中的是坐騎。那麼這張盤要回答的是:鳳雛活著,
   * 臥龍就不必西去 —— 蜀漢兩線分兵那個致命隱患,從此在誰身上。
   */
  {
    id: 'evt-pangtong-alt-1',
    name: { en: 'Not the War of a Benevolent Man', zh: '非仁者之兵' },
    yearMin: 215,
    yearMax: 218,
    requires: [
      { kind: 'flag-set', key: 'chain-pangtong' },
      { kind: 'officer-active', officerId: 'pang-tong' },
      { kind: 'officer-alive', officerId: 'liu-bei' },
      { kind: 'flag-unset', key: 'pangtong-alt-feast' },
    ],
    description:
      "At the feast in Fucheng, Liu Bei says this is a joyful occasion. Pang Tong says: to invade another man's state and call it a party is not the war of a benevolent man. Liu Bei, drunk and angry, tells him to get out.",
    descriptionZh: '涪城大會置酒,備謂統曰:「今日之會,可謂樂矣。」統曰:「伐人之國而以為歡,非仁者之兵也。」備醉,怒曰:「武王伐紂,前歌後舞,非仁者邪?卿言不當,宜速起出!」於是統起而退。',
    effects: [],
    chooserRulerId: 'liu-bei',
    choices: [
      {
        id: 'recall',
        label: { zh: '既而悔,請還 —— 復故位', en: 'Regret it, and call him back' },
        effects: [
          { kind: 'flag', key: 'pangtong-alt-feast' },
          { kind: 'officer-loyalty', officerId: 'pang-tong', delta: 20 },
          { kind: 'mandate-ruler', rulerOfficerId: 'liu-bei', delta: 6 },
        ],
      },
      {
        id: 'keep-out',
        label: { zh: '不召 —— 軍中無戲言', en: 'Let him stay out' },
        effects: [
          { kind: 'flag', key: 'pangtong-alt-feast' },
          { kind: 'officer-loyalty', officerId: 'pang-tong', delta: -18 },
          { kind: 'mandate-ruler', rulerOfficerId: 'liu-bei', delta: -8 },
        ],
      },
    ],
  },
  {
    /*
     * 這張盤的前提本身 —— 鳳雛既在益州,孔明就不必入川;而荊州有沒有一個
     * 能與關羽共事的人,是後來那十年的分水嶺。
     */
    id: 'evt-pangtong-alt-2',
    name: { en: "The Dragon Need Not Go West", zh: '臥龍不必西去' },
    yearMin: 215,
    yearMax: 219,
    requires: [
      { kind: 'flag-set', key: 'chain-pangtong' },
      { kind: 'officer-active', officerId: 'pang-tong' },
      { kind: 'officer-active', officerId: 'zhuge-liang' },
      { kind: 'flag-unset', key: 'pangtong-alt-west' },
    ],
    description:
      "With Pang Tong running Yi province, there is no reason to summon Zhuge Liang up the river. The question is what to do with him instead: leave him in Jingzhou beside Guan Yu, or bring him west anyway.",
    descriptionZh: '鳳雛既治益州,則孔明不必溯江而西 —— 水鏡所謂「臥龍鳳雛,得一可安天下」,這一回兩個都在。所餘者一問:那一個留在荊州,還是仍舊召之入川。',
    effects: [],
    chooserRulerId: 'liu-bei',
    choices: [
      {
        id: 'stay',
        label: { zh: '留鎮荊州 —— 與雲長共事', en: 'Leave him in Jingzhou, beside Guan Yu' },
        effects: [
          { kind: 'flag', key: 'pangtong-alt-west' },
          { kind: 'city-defense', cityId: 'jiangling', delta: 16 },
          { kind: 'city-loyalty', cityId: 'jiangling', delta: 12 },
          { kind: 'officer-loyalty', officerId: 'guan-yu', delta: 8 },
        ],
      },
      {
        id: 'summon',
        label: { zh: '仍召入川 —— 兩人共佐', en: 'Summon him west anyway — both at your side' },
        effects: [
          { kind: 'flag', key: 'pangtong-alt-west' },
          { kind: 'city-defense', cityId: 'chengdu', delta: 14 },
          { kind: 'mandate-ruler', rulerOfficerId: 'liu-bei', delta: 8 },
          { kind: 'city-loyalty', cityId: 'jiangling', delta: -10 },
        ],
      },
    ],
  },

  /* ---- 假想:若呂布割據徐州(chain-lubu)--------------------------------
   * 前提是泗水未潰下邳之牆、陳宮之謀得行。而史書上他敗的兩個真原因都不是
   * 城牆:一個是那條沒有採用的犄角之計,一個是陳登。
   */
  {
    id: 'evt-lubu-alt-1',
    name: { en: "Chen Gong's Two Camps", zh: '掎角之計' },
    yearMin: 198,
    yearMax: 201,
    requires: [
      { kind: 'flag-set', key: 'chain-lubu' },
      { kind: 'officer-active', officerId: 'lu-bu' },
      { kind: 'officer-active', officerId: 'chen-gong' },
      { kind: 'flag-unset', key: 'lubu-alt-horns' },
    ],
    description:
      "Chen Gong's plan: you take the horse outside and camp, I hold the walls. If they come at you I hit their backs; if they besiege me you relieve me from outside. Ten days and their grain is gone. Lü Bu agreed — and then went in and talked to his wife.",
    descriptionZh: '宮曰:「將軍以步騎出屯於外,宮將餘眾閉守於內。若向將軍,宮引兵擊其背;若來攻城,將軍為救於外。不過旬日,操軍食盡。」布然之 —— 而後入謂妻嚴氏,嚴氏曰:「宮、順素不和,將軍一出,豈得定乎?」布乃止。',
    effects: [],
    chooserRulerId: 'lu-bu',
    choices: [
      {
        id: 'horns',
        label: { zh: '從之 —— 出屯於外,內外相應', en: 'Do it — camp outside, hold within' },
        effects: [
          { kind: 'flag', key: 'lubu-alt-horns' },
          { kind: 'force-troops-multiplier-ruler', rulerOfficerId: 'lu-bu', multiplier: 1.18 },
          { kind: 'officer-loyalty', officerId: 'chen-gong', delta: 18 },
          { kind: 'mandate-ruler', rulerOfficerId: 'lu-bu', delta: 6 },
        ],
      },
      {
        id: 'wife',
        label: { zh: '止 —— 宮、順素不和,一出豈得定乎', en: 'Stay — Gong and Shun do not get on' },
        effects: [
          { kind: 'flag', key: 'lubu-alt-horns' },
          { kind: 'city-defense', cityId: 'xiapi', delta: 14 },
          { kind: 'officer-loyalty', officerId: 'chen-gong', delta: -20 },
          { kind: 'mandate-ruler', rulerOfficerId: 'lu-bu', delta: -5 },
        ],
      },
    ],
  },
  {
    /*
     * 陳登 —— 布使登詣曹操求徐州牧,而登「陰欲圖布」,還則勸操早圖之。
     * 布怒,拔戟斫几,而登一席話就把他哄過去了(「養虎當飽其肉」那一段
     * 是登說給操聽的,布聽到的是另一版)。
     */
    id: 'evt-lubu-alt-2',
    name: { en: 'What Chen Deng Told Cao Cao', zh: '陳登之心' },
    yearMin: 198,
    yearMax: 202,
    requires: [
      { kind: 'flag-set', key: 'chain-lubu' },
      { kind: 'officer-active', officerId: 'lu-bu' },
      { kind: 'officer-alive', officerId: 'chen-deng' },
      { kind: 'flag-unset', key: 'lubu-alt-deng' },
    ],
    description:
      "Lü Bu sent Chen Deng to Cao Cao to ask for the governorship of Xu. Chen Deng asked Cao Cao to destroy Lü Bu instead — \"a tiger should be kept hungry, not fed\" — and came home with a promotion for himself and nothing for Lü Bu.",
    descriptionZh: '布使登詣操求徐州牧,而登陰言於操曰:「布,豺狼也,勇而無計,輕於去就,宜早圖之。」操曰:「布狼子野心,誠難久養,非卿莫能究其情偽。」登還,布怒,拔戟斫几 —— 而登一席話又哄過去了。',
    effects: [],
    chooserRulerId: 'lu-bu',
    choices: [
      {
        id: 'see',
        label: { zh: '察其偽 —— 收登下獄', en: 'See through him — arrest Chen Deng' },
        effects: [
          { kind: 'flag', key: 'lubu-alt-deng' },
          { kind: 'officer-status', officerId: 'chen-deng', status: 'imprisoned' },
          { kind: 'city-loyalty', cityId: 'xiapi', delta: -14 },
          { kind: 'mandate-ruler', rulerOfficerId: 'lu-bu', delta: 5 },
        ],
      },
      {
        id: 'trust',
        label: { zh: '信之 —— 登言在理', en: 'Believe him — he talks well' },
        effects: [
          { kind: 'flag', key: 'lubu-alt-deng' },
          { kind: 'city-loyalty', cityId: 'xiapi', delta: 10 },
          { kind: 'officer-loyalty', officerId: 'chen-deng', delta: -15 },
          { kind: 'mandate-ruler', rulerOfficerId: 'lu-bu', delta: -6 },
        ],
      },
    ],
  },

  /* ---- 假想:若袁術稱帝成(chain-yuanshu)-------------------------------
   * 盤的前提替他免掉了大旱與部將之叛,府庫充盈如舊。那麼題目就換了一個:
   * 史書上他不是**沒有**糧,是把糧用錯了地方。
   */
  {
    id: 'evt-yuanshu-alt-1',
    name: { en: 'Every Neighbour a Han Officer', zh: '四面皆漢臣' },
    yearMin: 198,
    yearMax: 201,
    requires: [
      { kind: 'flag-set', key: 'chain-yuanshu' },
      { kind: 'officer-active', officerId: 'yuan-shu' },
      { kind: 'flag-unset', key: 'yuanshu-alt-isolation' },
    ],
    description:
      "The throne is up and holding. What comes with it: Sun Ce writes to break off relations, Lü Bu breaks the marriage, and every man within reach now has a lawful reason to march on Shouchun. An envoy could still be sent.",
    descriptionZh: '僭號既成而守得住。隨之而來的是:孫策以書絕之,呂布斷婚,而四境之內人人都有了一個討伐壽春的名分。使者還遣得出去。',
    effects: [],
    chooserRulerId: 'yuan-shu',
    choices: [
      {
        id: 'envoy',
        label: { zh: '遣使自解 —— 尊漢而不去號', en: 'Send envoys — keep the title, court the Han' },
        effects: [
          { kind: 'flag', key: 'yuanshu-alt-isolation' },
          { kind: 'mandate-ruler', rulerOfficerId: 'yuan-shu', delta: 8 },
          { kind: 'force-troops-multiplier-ruler', rulerOfficerId: 'yuan-shu', multiplier: 0.94 },
        ],
      },
      {
        id: 'defy',
        label: { zh: '益兵拒守 —— 天下非漢有久矣', en: 'Reinforce the walls — the Han is long gone' },
        effects: [
          { kind: 'flag', key: 'yuanshu-alt-isolation' },
          { kind: 'city-defense', cityId: 'shouchun', delta: 20 },
          { kind: 'mandate-ruler', rulerOfficerId: 'yuan-shu', delta: -6 },
        ],
      },
    ],
  },
  {
    /*
     * 真正的敗因 —— 「荒侈滋甚,後宮數百皆服綺縠,餘粱肉,而士卒凍餒」。
     * 盤給了他糧,而糧到底進誰的嘴,是這一節。
     */
    id: 'evt-yuanshu-alt-2',
    name: { en: 'Silk in the Palace, Frost in the Camp', zh: '後宮數百' },
    yearMin: 198,
    yearMax: 202,
    requires: [
      { kind: 'flag-set', key: 'chain-yuanshu' },
      { kind: 'officer-active', officerId: 'yuan-shu' },
      { kind: 'flag-unset', key: 'yuanshu-alt-luxury' },
    ],
    description:
      "Several hundred women in the palace all in patterned silk, meat and fine grain left over — and the soldiers outside are cold and hungry. The granaries are full this time. Whose mouths they fill is the question.",
    descriptionZh: '荒侈滋甚,後宮數百皆服綺縠,餘粱肉,而士卒凍餒。這一回倉是滿的 —— 而糧進誰的嘴,是另一件事。',
    effects: [],
    chooserRulerId: 'yuan-shu',
    choices: [
      {
        id: 'army',
        label: { zh: '散府庫以賞士 —— 減後宮之奉', en: 'Open the stores to the army; cut the palace' },
        effects: [
          { kind: 'flag', key: 'yuanshu-alt-luxury' },
          { kind: 'force-troops-multiplier-ruler', rulerOfficerId: 'yuan-shu', multiplier: 1.16 },
          { kind: 'city-loyalty', cityId: 'shouchun', delta: 16 },
          { kind: 'mandate-ruler', rulerOfficerId: 'yuan-shu', delta: 6 },
        ],
      },
      {
        id: 'palace',
        label: { zh: '仍舊 —— 天子之奉,固當如是', en: 'As before — this is what a Son of Heaven is owed' },
        effects: [
          { kind: 'flag', key: 'yuanshu-alt-luxury' },
          { kind: 'city-loyalty', cityId: 'shouchun', delta: -20 },
          { kind: 'force-troops-multiplier-ruler', rulerOfficerId: 'yuan-shu', multiplier: 0.9 },
          { kind: 'mandate-ruler', rulerOfficerId: 'yuan-shu', delta: -10 },
        ],
      },
    ],
  },

  /* ---- 假想:若馬超盡得關中(chain-machao)------------------------------
   * 前提是抹書離間未成、超遂盟好不疑而下潼關。那麼剩下兩件事:那封信的
   * 種子,和許都的那一家人。
   */
  {
    id: 'evt-machao-alt-1',
    name: { en: 'The Letter with the Crossings-Out', zh: '抹書之疑' },
    yearMin: 211,
    yearMax: 214,
    requires: [
      { kind: 'flag-set', key: 'chain-machao' },
      { kind: 'officer-active', officerId: 'ma-chao' },
      { kind: 'officer-active', officerId: 'han-sui' },
      { kind: 'flag-unset', key: 'machao-alt-letter' },
    ],
    description:
      "The plan failed but the letter exists: Cao Cao wrote to Han Sui and scratched words out all over it, as if Han Sui had been the one editing. Ma Chao has now read it. Han Sui says he never touched it.",
    descriptionZh: '賈詡之計:操與遂書,多所點竄,如遂改定者。計雖未成,而信是真的 —— 超已讀之。遂曰:「書來已如此,吾何嘗改。」超默然。',
    effects: [],
    chooserRulerId: 'ma-chao',
    choices: [
      {
        id: 'burn',
        label: { zh: '焚之於眾 —— 十部同心', en: 'Burn it in front of the camps' },
        effects: [
          { kind: 'flag', key: 'machao-alt-letter' },
          { kind: 'officer-loyalty', officerId: 'han-sui', delta: 22 },
          { kind: 'force-troops-multiplier-ruler', rulerOfficerId: 'ma-chao', multiplier: 1.12 },
          { kind: 'mandate-ruler', rulerOfficerId: 'ma-chao', delta: 6 },
        ],
      },
      {
        id: 'doubt',
        label: { zh: '藏之 —— 而心已生芥蒂', en: 'Keep it — and keep the doubt' },
        effects: [
          { kind: 'flag', key: 'machao-alt-letter' },
          { kind: 'officer-loyalty', officerId: 'han-sui', delta: -25 },
          { kind: 'mandate-ruler', rulerOfficerId: 'ma-chao', delta: -5 },
        ],
      },
    ],
  },
  {
    /*
     * 這一節是這張盤真正的重量 —— 他起兵的時候,馬騰一家在許都做質。
     * 史書上的結果是「騰坐夷三族」,而超自己說的是「棄父」。
     */
    id: 'evt-machao-alt-2',
    name: { en: 'His Family Is in Xu', zh: '父在許都' },
    yearMin: 211,
    yearMax: 215,
    requires: [
      { kind: 'flag-set', key: 'chain-machao' },
      { kind: 'officer-active', officerId: 'ma-chao' },
      { kind: 'officer-alive', officerId: 'cao-cao' },
      { kind: 'flag-unset', key: 'machao-alt-father' },
    ],
    description:
      "Ma Teng and the clan are hostages in Xuchang; Ma Chao raised the west anyway. Cao Cao sends word: come to terms and they live. In the histories, Ma Teng and three degrees of kin were put to death, and Ma Chao said afterwards that he had thrown his father away.",
    descriptionZh: '超之起兵,騰與宗族皆在許為質。操遣使諭之:降則全其家。史書上的下場是「騰坐夷三族」,而超後來自言「闔門百口,一旦同命」—— 說這話那年他四十歲不到。',
    effects: [],
    chooserRulerId: 'ma-chao',
    choices: [
      {
        id: 'plead',
        label: { zh: '遣使請和 —— 求全父族', en: 'Send terms — try to save them' },
        effects: [
          { kind: 'flag', key: 'machao-alt-father' },
          { kind: 'force-troops-multiplier-ruler', rulerOfficerId: 'ma-chao', multiplier: 0.92 },
          { kind: 'officer-loyalty', officerId: 'ma-chao', delta: 12 },
          { kind: 'mandate-ruler', rulerOfficerId: 'ma-chao', delta: 8 },
        ],
      },
      {
        id: 'onward',
        label: { zh: '不顧 —— 今棄父而取關中', en: 'March on regardless' },
        effects: [
          { kind: 'flag', key: 'machao-alt-father' },
          { kind: 'force-troops-multiplier-ruler', rulerOfficerId: 'ma-chao', multiplier: 1.14 },
          { kind: 'officer-loyalty', officerId: 'ma-chao', delta: -14 },
          { kind: 'mandate-ruler', rulerOfficerId: 'ma-chao', delta: -10 },
        ],
      },
    ],
  },

  /* ---- 假想:若曹爽先發制人(chain-caoshuang)---------------------------
   * 前提是桓範之謀得行:爽不解印就縛,挾天子疾走,發關中之兵。
   * 那麼接下來要回答的是檄文有沒有人應,以及那一句洛水之誓信不信。
   */
  {
    id: 'evt-caoshuang-alt-1',
    name: { en: "The Dispatch Goes Out", zh: '傳檄四方' },
    yearMin: 249,
    yearMax: 252,
    requires: [
      { kind: 'flag-set', key: 'chain-caoshuang' },
      { kind: 'officer-active', officerId: 'cao-shuang' },
      { kind: 'flag-unset', key: 'caoshuang-alt-call' },
    ],
    description:
      "Huan Fan had it right: the carriage is outside the city, the Emperor is in your hands, and a man who holds the Emperor gives orders to the realm. The dispatch naming Sima Yi a rebel is written. Who it is addressed to is the choice.",
    descriptionZh: '桓範之言果驗:「車駕在外,天子在手,挾令諸侯,誰敢不應?」討司馬為叛逆之檄已具 —— 而發給誰,是另一件事。',
    effects: [],
    chooserRulerId: 'cao-shuang',
    choices: [
      {
        id: 'huainan',
        label: { zh: '發淮南之兵 —— 王凌方鎮壽春', en: 'Call Huainan — Wang Ling holds Shouchun' },
        effects: [
          { kind: 'flag', key: 'caoshuang-alt-call' },
          { kind: 'city-troops-multiplier', cityId: 'shouchun', multiplier: 1.3 },
          { kind: 'mandate-ruler', rulerOfficerId: 'cao-shuang', delta: 8 },
        ],
      },
      {
        id: 'guanzhong',
        label: { zh: '發關中之兵 —— 據險而後圖', en: 'Call Guanzhong — hold the passes first' },
        effects: [
          { kind: 'flag', key: 'caoshuang-alt-call' },
          { kind: 'city-troops-multiplier', cityId: 'changan', multiplier: 1.3 },
          { kind: 'city-defense', cityId: 'tongguan', delta: 16 },
          { kind: 'mandate-ruler', rulerOfficerId: 'cao-shuang', delta: 4 },
        ],
      },
    ],
  },
  {
    /*
     * 洛水之誓 —— 史書上曹爽信了,然後被族誅。這一節把那個信不信交回去,
     * 而它也是後來「淮南三叛」都拿來說事的那一句:太傅指洛水為誓,而食言。
     */
    id: 'evt-caoshuang-alt-2',
    name: { en: 'Sworn by the Luo', zh: '指洛水為誓' },
    yearMin: 249,
    yearMax: 253,
    requires: [
      { kind: 'flag-set', key: 'chain-caoshuang' },
      { kind: 'officer-active', officerId: 'cao-shuang' },
      { kind: 'officer-alive', officerId: 'sima-yi' },
      { kind: 'flag-unset', key: 'caoshuang-alt-oath' },
    ],
    description:
      "Sima Yi sends word swearing by the Luo river that Cao Shuang will keep his marquisate and his household if he lays down the seals. In the histories he believed it — \"I can still be a rich man at home\" — and was executed with three degrees of kin.",
    descriptionZh: '太傅遣使,指洛水為誓:解印就第,不失侯爵之奉。史書上爽信之,曰「我亦不失作富家翁」;桓範哭曰:「曹子丹佳人,生汝兄弟,犢耳!」—— 旬日而夷三族。',
    effects: [],
    chooserRulerId: 'cao-shuang',
    choices: [
      {
        id: 'refuse',
        label: { zh: '不信 —— 桓範之言在耳', en: 'Refuse — Huan Fan is still shouting' },
        effects: [
          { kind: 'flag', key: 'caoshuang-alt-oath' },
          { kind: 'officer-loyalty', officerId: 'cao-shuang', delta: 15 },
          { kind: 'mandate-ruler', rulerOfficerId: 'cao-shuang', delta: 10 },
          { kind: 'mandate-ruler', rulerOfficerId: 'sima-yi', delta: -8 },
        ],
      },
      {
        id: 'believe',
        label: { zh: '信之 —— 解印就第,不失富家翁', en: 'Believe it — lay down the seals' },
        effects: [
          { kind: 'flag', key: 'caoshuang-alt-oath' },
          { kind: 'force-cities-revolt-ruler', rulerOfficerId: 'cao-shuang', fraction: 0.5 },
          { kind: 'mandate-ruler', rulerOfficerId: 'cao-shuang', delta: -20 },
          { kind: 'mandate-ruler', rulerOfficerId: 'sima-yi', delta: 15 },
        ],
      },
    ],
  },

  /* ---- 假想:若陸遜不冤死(chain-luxun)---------------------------------
   * 前提是他撐過了二宮之爭那場風暴。而那場風暴本身還在 —— 吳國真正的
   * 那一戰不在江上,在建業的宮裡。
   */
  {
    id: 'evt-luxun-alt-1',
    name: { en: 'Two Palaces', zh: '二宮之爭' },
    yearMin: 249,
    yearMax: 252,
    requires: [
      { kind: 'flag-set', key: 'chain-luxun' },
      { kind: 'officer-active', officerId: 'lu-xun' },
      { kind: 'officer-alive', officerId: 'sun-quan' },
      { kind: 'flag-unset', key: 'luxun-alt-palaces' },
    ],
    description:
      "Lu Xun memorialises: the heir is the legitimate line and should stand on rock; the Prince of Lu is a vassal and his honours should be visibly less. Sun Quan did not act on it, and sent a messenger to interrogate the old man instead — who died of it, with no property in his house.",
    descriptionZh: '遜上疏:「太子正統,宜有磐石之固;魯王藩臣,當使寵秩有差,彼此得所。」權不聽,而遣中使責問。史書上遜憤恚致卒,年六十三,家無餘財 —— 而這一回他還在。',
    effects: [],
    chooserRulerId: 'sun-quan',
    choices: [
      {
        id: 'settle',
        label: { zh: '定名分 —— 寵秩有差,彼此得所', en: 'Settle it — ranks visibly different' },
        effects: [
          { kind: 'flag', key: 'luxun-alt-palaces' },
          { kind: 'flag', key: 'luxun-alt-settled' },
          { kind: 'officer-loyalty', officerId: 'lu-xun', delta: 20 },
          { kind: 'mandate-ruler', rulerOfficerId: 'sun-quan', delta: 12 },
        ],
      },
      {
        id: 'both',
        label: { zh: '兩存之 —— 手心手背', en: 'Keep both — they are both my sons' },
        effects: [
          { kind: 'flag', key: 'luxun-alt-palaces' },
          { kind: 'officer-loyalty', officerId: 'lu-xun', delta: -15 },
          { kind: 'mandate-ruler', rulerOfficerId: 'sun-quan', delta: -14 },
          { kind: 'city-loyalty', cityId: 'jianye', delta: -12 },
        ],
      },
    ],
  },
  {
    /*
     * 定了名分之後,那個老人還能做什麼 —— 這一節接的是這張盤的主目標
     * 「社稷之臣」:上大將軍仍立於大江之上、吳軍之首。
     */
    id: 'evt-luxun-alt-2',
    name: { en: 'The Pillar Still Standing', zh: '社稷之臣' },
    yearMin: 250,
    yearMax: 255,
    requires: [
      { kind: 'flag-set', key: 'chain-luxun' },
      { kind: 'flag-set', key: 'luxun-alt-settled' },
      { kind: 'officer-active', officerId: 'lu-xun' },
      { kind: 'flag-unset', key: 'luxun-alt-post' },
    ],
    description:
      "The man who burned Liu Bei's camps at Yiling and broke Cao Xiu at Shiting is sixty-eight and still standing. Where he stands is the decision: on the river at Wuchang, or in the capital at the Emperor's side.",
    descriptionZh: '夷陵焚連營、石亭破曹休者,今年六十八而尚在。所餘一問:是留他在武昌當那條江的門,還是召還建業,置於御座之側。',
    effects: [],
    chooserRulerId: 'sun-quan',
    choices: [
      {
        id: 'river',
        label: { zh: '鎮武昌 —— 上流之重', en: 'Wuchang — the upper river' },
        effects: [
          { kind: 'flag', key: 'luxun-alt-post' },
          { kind: 'city-defense', cityId: 'wuchang', delta: 18 },
          { kind: 'city-defense', cityId: 'jiangling', delta: 12 },
          { kind: 'officer-loyalty', officerId: 'lu-xun', delta: 8 },
        ],
      },
      {
        id: 'capital',
        label: { zh: '召還建業 —— 錄尚書事', en: 'Recall him — let him run the government' },
        effects: [
          { kind: 'flag', key: 'luxun-alt-post' },
          { kind: 'city-loyalty', cityId: 'jianye', delta: 18 },
          { kind: 'mandate-ruler', rulerOfficerId: 'sun-quan', delta: 10 },
          { kind: 'city-defense', cityId: 'wuchang', delta: -8 },
        ],
      },
    ],
  },

  /* ---- 假想:曹操贏赤壁(chain-caochibi)--------------------------------
   * 前提是東南風不至、周郎殞於亂軍、孫權斬於江岸。贏了之後要面對的不是
   * 敵人,是自己人:荀文若那一關,和江東那一片新地。
   */
  {
    id: 'evt-caochibi-alt-1',
    name: { en: "Xun Yu's Objection", zh: '文若之議' },
    yearMin: 209,
    yearMax: 213,
    requires: [
      { kind: 'flag-set', key: 'chain-caochibi' },
      { kind: 'officer-active', officerId: 'cao-cao' },
      { kind: 'officer-active', officerId: 'xun-yu' },
      { kind: 'flag-unset', key: 'caochibi-alt-xunyu' },
    ],
    description:
      "The realm is effectively his. The court proposes the Nine Bestowals and a dukedom. Xun Yu, who has run his government for twenty years, says: you raised the army to restore the Han, and a man who keeps faith does not do this. In the histories he was dead within the year.",
    descriptionZh: '天下略定,董昭等議加九錫、進爵國公。彧曰:「本興義兵以匡朝寧國,秉忠貞之誠,守退讓之實;君子愛人以德,不宜如此。」—— 史書上他當年就死了,或云憂薨,或云飲藥。',
    effects: [],
    chooserRulerId: 'cao-cao',
    choices: [
      {
        id: 'defer',
        label: { zh: '從其言 —— 九錫且置', en: 'Take his advice — set the Bestowals aside' },
        effects: [
          { kind: 'flag', key: 'caochibi-alt-xunyu' },
          { kind: 'officer-loyalty', officerId: 'xun-yu', delta: 25 },
          { kind: 'officer-loyalty', officerId: 'xun-you', delta: 12 },
          { kind: 'mandate-ruler', rulerOfficerId: 'cao-cao', delta: -6 },
        ],
      },
      {
        id: 'accept',
        label: { zh: '受之 —— 設使國家無有孤', en: 'Accept — "Were it not for me, how many would call themselves king?"' },
        effects: [
          { kind: 'flag', key: 'caochibi-alt-xunyu' },
          { kind: 'officer-loyalty', officerId: 'xun-yu', delta: -35 },
          { kind: 'mandate-ruler', rulerOfficerId: 'cao-cao', delta: 12 },
          { kind: 'city-loyalty', cityId: 'xuchang', delta: -10 },
        ],
      },
    ],
  },
  {
    /*
     * 江東那一片新地 —— 孫氏既滅,而江東士族還在。史書上曹操對新附之地
     * 的兩手是「徙其民」與「用其人」,而赤壁那一敗讓他從沒機會用第二手。
     */
    id: 'evt-caochibi-alt-2',
    name: { en: 'What to Do with Jiangdong', zh: '江東新附' },
    yearMin: 209,
    yearMax: 214,
    requires: [
      { kind: 'flag-set', key: 'chain-caochibi' },
      { kind: 'officer-active', officerId: 'cao-cao' },
      { kind: 'flag-unset', key: 'caochibi-alt-south' },
    ],
    description:
      "The Sun house is finished but the Jiangdong gentry are not. Move them north where they can be watched, or leave them in place and use them — the same choice he faced in Jing province, and got wrong there.",
    descriptionZh: '孫氏既滅,而顧、陸、朱、張猶在。北徙其豪族而置之腹地,或因其舊人而用之 —— 與他在荊州面對過的是同一道題,而那一次他選錯了。',
    effects: [],
    chooserRulerId: 'cao-cao',
    choices: [
      {
        id: 'use',
        label: { zh: '因其舊人 —— 各領本郡', en: 'Use them where they stand' },
        effects: [
          { kind: 'flag', key: 'caochibi-alt-south' },
          { kind: 'city-loyalty', cityId: 'jianye', delta: 22 },
          { kind: 'city-loyalty', cityId: 'wu', delta: 18 },
          { kind: 'mandate-ruler', rulerOfficerId: 'cao-cao', delta: 5 },
        ],
      },
      {
        id: 'move',
        label: { zh: '北徙其豪族 —— 置之腹地', en: 'Move them north, where they can be watched' },
        effects: [
          { kind: 'flag', key: 'caochibi-alt-south' },
          { kind: 'city-loyalty', cityId: 'jianye', delta: -20 },
          { kind: 'city-loyalty', cityId: 'wu', delta: -18 },
          { kind: 'force-gold-ruler', rulerOfficerId: 'cao-cao', delta: 800 },
        ],
      },
    ],
  },

  /* ---- 假想:諸葛亮活到八十(chain-zhugelives)--------------------------
   * 前提是他沒有殞於五丈原,而且復了長安。那麼史書上他在五丈原交代的那件事
   * ——「後事」—— 就從遺命變成了他自己要做的決定。
   */
  {
    id: 'evt-zhugelives-alt-1',
    name: { en: 'Governing Chang\'an', zh: '長安之政' },
    yearMin: 240,
    yearMax: 244,
    requires: [
      { kind: 'flag-set', key: 'chain-zhugelives' },
      { kind: 'officer-active', officerId: 'zhuge-liang' },
      { kind: 'flag-unset', key: 'zhugelives-alt-govern' },
    ],
    description:
      "Guanzhong is back in Han hands after forty years of somebody else's law. The Chancellor's method has always been the same — clear statutes, certain rewards and punishments — but Guanzhong is not Shu, and the men who farm it grew up under Wei.",
    descriptionZh: '關中復為漢有,而其民四十年在他人法度之下。丞相之政向來是「科教嚴明,賞罰必信,無惡不懲,無善不顯」—— 而關中不是蜀,耕其地者生於魏。',
    effects: [],
    chooserRulerId: 'liu-shan',
    choices: [
      {
        id: 'law',
        label: { zh: '一以蜀科 —— 賞罰必信', en: 'One law, as in Shu' },
        effects: [
          { kind: 'flag', key: 'zhugelives-alt-govern' },
          { kind: 'city-loyalty', cityId: 'changan', delta: 14 },
          { kind: 'city-defense', cityId: 'changan', delta: 10 },
          { kind: 'mandate-ruler', rulerOfficerId: 'liu-shan', delta: 6 },
        ],
      },
      {
        id: 'local',
        label: { zh: '因其舊俗 —— 徐徐圖之', en: 'Leave their customs; move slowly' },
        effects: [
          { kind: 'flag', key: 'zhugelives-alt-govern' },
          { kind: 'city-food', cityId: 'changan', delta: 30000 },
          { kind: 'force-troops-multiplier-ruler', rulerOfficerId: 'liu-shan', multiplier: 1.08 },
          { kind: 'city-loyalty', cityId: 'changan', delta: -6 },
        ],
      },
    ],
  },
  {
    /*
     * 後事 —— 史書上他在五丈原病篤時,李福奉命來問的正是這件事:
     * 「公百年後,誰可任大事者?」曰:「蔣琬之後,文偉可以繼之。」
     * 再問其次,不答 —— 而這一回他有時間答完。
     */
    id: 'evt-zhugelives-alt-2',
    name: { en: 'Who Comes After', zh: '後事之議' },
    yearMin: 241,
    yearMax: 248,
    requires: [
      { kind: 'flag-set', key: 'chain-zhugelives' },
      { kind: 'officer-active', officerId: 'zhuge-liang' },
      { kind: 'flag-unset', key: 'zhugelives-alt-heir' },
    ],
    description:
      "At Wuzhang Plains, Li Fu was sent to ask who could take on the great affairs after him. Jiang Wan, he said; and after Jiang Wan, Fei Yi. Asked who came after that, he did not answer. This time there is time to finish the sentence.",
    descriptionZh: '五丈原病篤,李福奉命而問:「公百年後,誰可任大事者?」曰:「蔣琬之後,文偉可以繼之。」復問其次 —— 亮不答。這一回,那句話說得完。',
    effects: [],
    chooserRulerId: 'liu-shan',
    choices: [
      {
        id: 'civil',
        label: { zh: '蔣琬、費禕次第 —— 守成而已', en: 'Jiang Wan, then Fei Yi — hold what we have' },
        effects: [
          { kind: 'flag', key: 'zhugelives-alt-heir' },
          { kind: 'officer-loyalty', officerId: 'jiang-wan', delta: 20 },
          { kind: 'officer-loyalty', officerId: 'fei-yi', delta: 18 },
          { kind: 'mandate-ruler', rulerOfficerId: 'liu-shan', delta: 8 },
        ],
      },
      {
        id: 'wei',
        label: { zh: '付之伯約 —— 志繼北伐', en: 'Jiang Wei — the northern campaigns go on' },
        effects: [
          { kind: 'flag', key: 'zhugelives-alt-heir' },
          { kind: 'officer-loyalty', officerId: 'jiang-wei', delta: 25 },
          { kind: 'force-troops-multiplier-ruler', rulerOfficerId: 'liu-shan', multiplier: 1.12 },
          { kind: 'officer-loyalty', officerId: 'fei-yi', delta: -10 },
          { kind: 'mandate-ruler', rulerOfficerId: 'liu-shan', delta: -4 },
        ],
      },
    ],
  },

  /* ---- 假想:女傑時代(chain-women)-------------------------------------
   * 這一張不是史實的反事實,是平行之世 —— 七家女傑各執兵符。所以鏈也不能
   * 照史書寫,而要照**她們各自留下來的那件東西**寫:蔡琰的十八拍、
   * 黃月英的機巧、祝融的飛刀、二喬的銅雀之讖。
   */
  {
    id: 'evt-women-alt-1',
    name: { en: 'Eighteen Stanzas for the Nomad Flute', zh: '胡笳十八拍' },
    yearMin: 200,
    yearMax: 205,
    requires: [
      { kind: 'flag-set', key: 'chain-women' },
      { kind: 'officer-active', officerId: 'cai-yan' },
      { kind: 'flag-unset', key: 'women-alt-hujia' },
    ],
    description:
      "From Ye, Cai Yan sends the eighteen stanzas out along the post roads. In the histories they were the record of a woman taken north and ransomed back; here they arrive as a proclamation, and every garrison between the rivers can recite them within the season.",
    descriptionZh: '琰於鄴城作《胡笳十八拍》,傳之驛路。史書上那是一個被掠而復贖之人的紀事;在這裡,它是一紙檄 —— 一季之內,河北戍卒無不能誦。',
    effects: [],
    chooserRulerId: 'cai-yan',
    choices: [
      {
        id: 'proclaim',
        label: { zh: '傳之四方 —— 以文取天下之心', en: 'Send it everywhere — take the realm by writing' },
        effects: [
          { kind: 'flag', key: 'women-alt-hujia' },
          { kind: 'city-loyalty', cityId: 'ye', delta: 20 },
          { kind: 'mandate-ruler', rulerOfficerId: 'cai-yan', delta: 12 },
          { kind: 'force-troops-multiplier-ruler', rulerOfficerId: 'cai-yan', multiplier: 0.95 },
        ],
      },
      {
        id: 'keep',
        label: { zh: '藏之 —— 此我一人之痛', en: 'Keep it — this grief is mine' },
        effects: [
          { kind: 'flag', key: 'women-alt-hujia' },
          { kind: 'force-troops-multiplier-ruler', rulerOfficerId: 'cai-yan', multiplier: 1.1 },
          { kind: 'officer-loyalty', officerId: 'cai-yan', delta: 12 },
        ],
      },
    ],
  },
  {
    /*
     * 黃月英那一節 —— 她在史書上只留下一句「黃承彥有女,黃頭黑色,而才堪
     * 相配」,和後世附會給她的木牛流馬。這張盤把那份機巧交到她自己手上。
     */
    id: 'evt-women-alt-2',
    /* ⚠ 原本叫「木牛流馬」,而 `eventExclusivity.test.ts` 當場擋下 ——
       全庫已經有一條 `evt-muniu-liuma` 同名。那條是丞相的,這條是黃月英的
       工坊,兩個不同的場面,所以改名而不是加旗標互斥。 */
    name: { en: 'The Workshop Drawings', zh: '工坊圖成' },
    yearMin: 200,
    yearMax: 206,
    requires: [
      { kind: 'flag-set', key: 'chain-women' },
      { kind: 'officer-active', officerId: 'lady-huang' },
      { kind: 'flag-unset', key: 'women-alt-oxen' },
    ],
    description:
      "The workshops at Xiangyang have the drawings finished: carriages that walk, mills that need no ox, crossbows that loose ten bolts. Build the transport and the army eats; build the crossbows and it kills. There is not enough seasoned timber for both.",
    descriptionZh: '襄陽工坊圖成:木牛流馬、連弩十矢俱發。作轉運之器則軍食足,作連弩則軍威張 —— 而堪用之材,只夠做一樣。',
    effects: [],
    chooserRulerId: 'lady-huang',
    choices: [
      {
        id: 'transport',
        label: { zh: '作木牛流馬 —— 軍食自足', en: 'Build the transport' },
        effects: [
          { kind: 'flag', key: 'women-alt-oxen' },
          { kind: 'city-food', cityId: 'xiangyang', delta: 45000 },
          { kind: 'city-food', cityId: 'jiangling', delta: 30000 },
          { kind: 'mandate-ruler', rulerOfficerId: 'lady-huang', delta: 6 },
        ],
      },
      {
        id: 'crossbow',
        label: { zh: '作連弩 —— 十矢俱發', en: 'Build the repeating crossbows' },
        effects: [
          { kind: 'flag', key: 'women-alt-oxen' },
          { kind: 'force-troops-multiplier-ruler', rulerOfficerId: 'lady-huang', multiplier: 1.16 },
          { kind: 'city-defense', cityId: 'xiangyang', delta: 14 },
        ],
      },
    ],
  },

  /* ---- 假想:英雄集結(chain-gathering)---------------------------------
   * 十七路諸侯同立於一時,而他們本來分屬三十年。這張盤唯一能寫的鏈,
   * 就是**這件事本身**:同時存在這回事,他們自己知不知道。
   */
  {
    id: 'evt-gathering-alt-1',
    name: { en: 'Out of Their Own Years', zh: '不在其時' },
    yearMin: 200,
    yearMax: 204,
    requires: [
      { kind: 'flag-set', key: 'chain-gathering' },
      { kind: 'officer-active', officerId: 'cao-cao' },
      { kind: 'flag-unset', key: 'gathering-alt-known' },
    ],
    description:
      "The roster does not add up. Dong Zhuo holds Chang'an and Sun Ce holds the east in the same season; men who were thirty years apart are drawing pay from the same court. Whether to say so out loud is a decision.",
    descriptionZh: '名籍對不上:董卓據長安,而孫策橫江東,同在一時;相隔三十年的人,在同一份俸祿冊上。這件事說不說破,是一個決定。',
    effects: [],
    chooserRulerId: 'cao-cao',
    choices: [
      {
        id: 'speak',
        label: { zh: '明言之 —— 天下皆知其異', en: 'Say it aloud — let everyone know' },
        effects: [
          { kind: 'flag', key: 'gathering-alt-known' },
          { kind: 'flag', key: 'gathering-alt-open' },
          { kind: 'mandate-ruler', rulerOfficerId: 'cao-cao', delta: -8 },
          { kind: 'city-loyalty', cityId: 'xuchang', delta: -10 },
        ],
      },
      {
        id: 'silent',
        label: { zh: '不言 —— 各安其位', en: 'Say nothing — let each keep his place' },
        effects: [
          { kind: 'flag', key: 'gathering-alt-known' },
          { kind: 'mandate-ruler', rulerOfficerId: 'cao-cao', delta: 6 },
          { kind: 'city-loyalty', cityId: 'xuchang', delta: 8 },
        ],
      },
    ],
  },
  {
    /*
     * 說破之後 —— 十七家都知道自己不該在這裡,那麼結盟討伐最強的那一家
     * 就有了一個誰都說得出口的理由。虎牢那一次是真的發生過的,只是換了年份。
     */
    id: 'evt-gathering-alt-2',
    name: { en: 'The Gate Again', zh: '虎牢再會' },
    yearMin: 201,
    yearMax: 206,
    requires: [
      { kind: 'flag-set', key: 'chain-gathering' },
      { kind: 'flag-set', key: 'gathering-alt-open' },
      { kind: 'officer-active', officerId: 'cao-cao' },
      { kind: 'flag-unset', key: 'gathering-alt-league' },
    ],
    description:
      "Once it is common knowledge that none of them belongs in this year, an alliance against whoever is strongest needs no other justification. They did it once at Hulao already — different year, same gate.",
    descriptionZh: '既知眾人皆不在其時,則合縱討最強者,不必再找別的理由。虎牢那一次本來就發生過 —— 換了年份,還是那道關。',
    effects: [
      { kind: 'flag', key: 'gathering-alt-league' },
      { kind: 'city-defense', cityId: 'hulao', delta: 20 },
      { kind: 'mandate-ruler', rulerOfficerId: 'cao-cao', delta: -6 },
      { kind: 'mandate-ruler', rulerOfficerId: 'liu-bei', delta: 6 },
      { kind: 'mandate-ruler', rulerOfficerId: 'sun-ce', delta: 6 },
    ],
    mood: 'martial',
  },

  // ---- 晉滅吳 -----------------------------------------------------------
  {
    id: 'evt-jinunite-1',
    name: { en: 'The Chains Across the River', zh: '鐵鎖橫江' },
    yearMin: 280,
    yearMax: 284,
    requires: [
      { kind: 'flag-set', key: 'chain-jinunite' },
      { kind: 'officer-alive', officerId: 'wang-jun' },
      { kind: 'officer-alive', officerId: 'sun-hao' },
      { kind: 'flag-unset', key: 'jinunite-chains' },
    ],
    description:
      'Wu strung iron chains across the narrows and set iron spikes in the shallows. Wang Jun built rafts the size of fields, put straw men on them with armour and spears, and floated them down first: the spikes came away in the rafts. Then torches of hemp soaked in sesame oil, ten zhang long, and the chains melted and let go.',
    descriptionZh: '吳人於江險磧要害處,以鐵鎖橫截之,又作鐵錐長丈餘,暗置江中。濬乃作大筏數十,方百餘步,縛草為人,被甲持杖,令善水者以筏先行,錐著筏去。又作火炬,長十餘丈,大數十圍,灌以麻油,遇鎖然炬燒之,須臾融液斷絕。',
    effects: [
      { kind: 'force-troops-multiplier-ruler', rulerOfficerId: 'sun-hao', multiplier: 0.85 },
      { kind: 'officer-loyalty', officerId: 'wang-jun', delta: 8 },
      { kind: 'flag', key: 'jinunite-chains' },
    ],
  },
  {
    id: 'evt-jinunite-2',
    name: { en: 'Zhang Ti Will Not Run', zh: '張悌不走' },
    yearMin: 280,
    yearMax: 285,
    requires: [
      { kind: 'flag-set', key: 'chain-jinunite' },
      { kind: 'flag-set', key: 'jinunite-chains' },
      { kind: 'officer-alive', officerId: 'zhang-ti' },
      { kind: 'officer-alive', officerId: 'sun-hao' },
    ],
    description:
      'The line broke at Banqiao. His officers pulled at him to come away. "Today is the day I die. As a boy I was picked out by the house of Sun; I always feared I should not die well and shame those who knew me. If the state ends today, what is there to run to?" He would not move, and they left him.',
    descriptionZh: '晉軍至,吳軍大敗。諸葛靚引騎數百,遣人牽悌走。悌曰:「仲思,今日是我死日也。且我為兒童時,便為卿家丞相所識拔,常恐不得其死,負名賢知顧。今以身徇社稷,復何遁邪?」靚流涕放去,行百餘步,已見為晉軍所殺。',
    effects: [],
    chooserRulerId: 'sun-hao',
    choices: [
      {
        id: 'die',
        label: { zh: '以身徇社稷 —— 不走', en: 'He stands, and dies for the state' },
        effects: [
          { kind: 'officer-status', officerId: 'zhang-ti', status: 'dead' },
          { kind: 'mandate-ruler', rulerOfficerId: 'sun-hao', delta: 8 },
          { kind: 'flag', key: 'jinunite-zhangti' },
        ],
      },
      {
        id: 'retreat',
        label: { zh: '牽之而走,收餘眾守建業', en: 'Drag him away; hold Jianye with what is left' },
        effects: [
          { kind: 'city-troops-multiplier', cityId: 'jianye', multiplier: 1.25 },
          { kind: 'mandate-ruler', rulerOfficerId: 'sun-hao', delta: -6 },
          { kind: 'flag', key: 'jinunite-zhangti' },
        ],
      },
    ],
  },
  {
    id: 'evt-jinunite-3',
    name: { en: 'One White Banner Out of Shitou', zh: '一片降旛出石頭' },
    yearMin: 280,
    yearMax: 286,
    requires: [
      { kind: 'flag-set', key: 'chain-jinunite' },
      { kind: 'flag-set', key: 'jinunite-zhangti' },
      { kind: 'officer-alive', officerId: 'sun-hao' },
      { kind: 'officer-alive', officerId: 'wang-jun' },
    ],
    description:
      'Wang Jun\'s towered ships came down out of Yizhou; the king\'s ghost-fire at Jinling went out. A thousand xun of iron chain sank to the bottom of the river, and one white banner came out of Shitou.',
    descriptionZh: '王濬樓船下益州,金陵王氣黯然收。千尋鐵鎖沉江底,一片降旛出石頭。\n\n皓乃備亡國之禮,素車白馬,肉袒面縛,銜璧牽羊,大夫衰服,士輿櫬,造於壘門。',
    effects: [],
    chooserRulerId: 'sun-hao',
    choices: [
      {
        id: 'surrender',
        label: { zh: '肉袒面縛,銜璧牽羊', en: 'Bare the shoulder, bind the hands, lead the sheep' },
        effects: [
          { kind: 'force-cities-revolt-ruler', rulerOfficerId: 'sun-hao', fraction: 0.6 },
          { kind: 'flag', key: 'jinunite-ended' },
        ],
      },
      {
        id: 'burn',
        label: { zh: '焚宮室,死守石頭', en: 'Burn the palaces and hold Shitou' },
        effects: [
          { kind: 'city-defense', cityId: 'jianye', delta: 25 },
          { kind: 'city-troops-multiplier', cityId: 'jianye', multiplier: 1.3 },
          { kind: 'mandate-ruler', rulerOfficerId: 'sun-hao', delta: -8 },
          { kind: 'flag', key: 'jinunite-ended' },
        ],
      },
    ],
  },

  /* ════════════════════════════════════════════════════════════════════
     後三國 · 魏晉:權柄是怎麼一級一級交出去的(239–262)

     為什麼補這一批:全庫 230 條事件裡,234 年之後只有 44 條,而 190–220 那
     三十年有一百八十餘條。後果是「事件薄」的八張盤全在這一段 —— 晉滅吳整盤
     十年只有四條可演。而這些盤自己的專屬鏈都寫過了,缺的是**這個時代的共享
     名場面**:司馬師的名字在全庫事件裡出現 0 次,毌丘儉 0 次,嵇康 0 次。

     這一批刻意**不綁 chain-xxx 旗標** —— 綁了就只有一張盤演得到。條件只問
     「那個人還在不在」,於是 238/241/244/249/252/253/255/257 每一張跨過那個
     年份的盤都演得到,一批下去七八張盤同時變厚。

     抉擇歸屬:寫 chooserRulerId 之前先查過那個 id 在這幾張盤上真的是君主 ——
     曹芳是 241/244/252/253 的魏主,曹叡是 238 與「諸葛亮活到八十」的魏主,
     司馬昭是 257/263/264 的魏主。**曹髦不是任何一張盤的君主**,所以他那一段
     (詔昭留鎮許昌)只能寫進敘事,不能當選項。
     ════════════════════════════════════════════════════════════════════ */
  {
    id: 'evt-caorui-tuogu',
    name: { en: 'Cao Rui Names His Regents', zh: '明帝托孤' },
    yearMin: 239,
    yearMax: 241,
    requires: [
      { kind: 'officer-alive', officerId: 'cao-rui' },
      { kind: 'officer-alive', officerId: 'sima-yi' },
    ],
    description:
      'The emperor is dying at thirty-four with an adopted boy of seven for an heir. The first edict named his uncle Cao Yu regent, with Xiahou Xian and Cao Zhao beside him — the clan keeping the clan. Then Liu Fang and Sun Zi, who hated Cao Zhao, got the sickroom to themselves for the length of one conversation, and the edict was rewritten: Cao Shuang, and Sima Yi recalled from the frontier. The emperor changed his mind twice. What he signed at the end decided the next thirty years.',
    descriptionZh:
      '景初三年正月,帝疾篤。初詔以燕王曹宇為大將軍,與夏侯獻、曹肇、秦朗共輔政 —— 宗室輔宗室。中書監劉放、中書令孫資素與曹肇不睦,乘間言宇等非社稷之計,勸帝以曹爽代之,并召司馬懿。帝從之,既而復悔,放、資固請,帝乃執放手,強起作詔。\n\n懿至,帝執其手,目太子曰:「以後事相托。死乃復可忍,朕忍死待君,得相見,無所復恨矣。」',
    effects: [],
    chooserRulerId: 'cao-rui',
    choices: [
      {
        id: 'shuang-yi',
        label: { zh: '從劉放孫資之言:曹爽、司馬懿共輔', en: 'Cao Shuang and Sima Yi together' },
        effects: [
          { kind: 'officer-loyalty', officerId: 'sima-yi', delta: 6 },
          { kind: 'officer-loyalty', officerId: 'cao-shuang', delta: 10 },
          { kind: 'flag', key: 'tuogu-shuang-yi' },
        ],
      },
      {
        id: 'yi-alone',
        label: { zh: '獨以後事屬司馬懿', en: 'Sima Yi alone' },
        effects: [
          { kind: 'officer-loyalty', officerId: 'sima-yi', delta: 16 },
          { kind: 'city-defense', cityId: 'luoyang', delta: 10 },
          { kind: 'flag', key: 'tuogu-yi-alone' },
        ],
      },
      {
        id: 'zongshi',
        label: { zh: '守初詔:燕王曹宇、夏侯獻、曹肇輔政', en: 'Keep the first edict: the clan holds it' },
        effects: [
          { kind: 'officer-loyalty', officerId: 'cao-yu', delta: 14 },
          { kind: 'officer-loyalty', officerId: 'sima-yi', delta: -18 },
          { kind: 'city-loyalty', cityId: 'luoyang', delta: 8 },
          { kind: 'flag', key: 'tuogu-zongshi' },
        ],
      },
    ],
    mood: 'somber',
  },
  {
    id: 'evt-wangling-plot',
    name: { en: 'Wang Ling Calls on the Ghost of Jia Kui', zh: '王淩之謀' },
    yearMin: 251,
    yearMax: 252,
    requires: [
      { kind: 'officer-alive', officerId: 'wang-ling' },
      { kind: 'officer-alive', officerId: 'sima-yi' },
      { kind: 'flag-unset', key: 'huainan-rebellions' },
    ],
    description:
      'The first of the three Huainan risings, and the quietest. Wang Ling, Grand Commandant, holds the southeast and thinks the boy on the throne is a boy on a leash; he means to raise Cao Biao, prince of Chu, and move the capital to Xuchang. Sima Yi, seventy-two and two years past the coup, comes down the river himself before the plan is a week old. Wang Ling binds his own hands and meets him at the water. He is sent back to Luoyang under guard, and at Xiang, passing the shrine of Jia Kui, he calls out to the dead man that he was a loyal servant of Wei — and then takes poison.',
    descriptionZh:
      '太尉王淩督淮南,與外甥令狐愚謀立楚王曹彪,都許昌 —— 以為天子幼弱,制於強臣。事洩,宣王自將中軍,泛舟沿流,九日而至甘城。淩自知勢窮,面縛水次。遣步騎六百送還洛陽,行至項,過賈逵廟,大呼曰:「賈梁道!王淩是大魏之忠臣,惟爾有神知之!」遂飲藥死。夷三族,發令狐愚冢,剖棺暴屍。\n\n淮南第一叛,起得無聲,滅得也無聲。',
    effects: [
      { kind: 'officer-status', officerId: 'wang-ling', status: 'dead' },
      { kind: 'city-loyalty', cityId: 'shouchun', delta: -22 },
      { kind: 'officer-loyalty', officerId: 'sima-yi', delta: 8 },
      { kind: 'flag', key: 'wangling-purged' },
    ],
    mood: 'ominous',
  },
  {
    id: 'evt-lifeng-plot',
    name: { en: 'The Plot of the Palace Secretariat', zh: '中書之謀' },
    yearMin: 254,
    yearMax: 255,
    requires: [
      { kind: 'officer-alive', officerId: 'cao-fang' },
      { kind: 'officer-alive', officerId: 'li-feng' },
      { kind: 'officer-alive', officerId: 'sima-shi' },
    ],
    description:
      'Li Feng runs the Secretariat and is the last man in the palace the Sima do not own. With the empress father Zhang Ji he plans to put Xiahou Xuan in the regency in place of Sima Shi. The plan leaks before it moves. Sima Shi summons him; Li Feng knows what the summons is and goes anyway, because refusing would be the same answer with less dignity. Asked what he meant by it, he says: your house harbours treason and will bring down the altars of the state — I regret only that I lacked the strength to take you. Sima Shi has him beaten to death with the hilt-ring of a sword. Three clans are wiped out; in the ninth month the emperor himself is deposed.',
    descriptionZh:
      '中書令李豐與后父光祿大夫張緝、黃門監蘇鑠等謀以太常夏侯玄代司馬師輔政。事未發而洩。師召豐,豐知禍至而不敢不往。師詰之,豐知不免,乃曰:「卿父子懷姦,將傾社稷,惜吾力不能相禽殺耳!」師怒,使勇士以刀鐶築殺之。玄、緝皆夷三族 —— 夏侯玄臨斬東市,顏色不變,舉動自若。\n\n是歲九月,師以太后令廢帝為齊王。',
    effects: [],
    chooserRulerId: 'cao-fang',
    choices: [
      {
        id: 'stay-out',
        label: { zh: '不與聞,坐觀成敗', en: 'Know nothing of it' },
        effects: [
          { kind: 'officer-status', officerId: 'li-feng', status: 'dead' },
          { kind: 'officer-status', officerId: 'xiahou-xuan', status: 'dead' },
          { kind: 'mandate-ruler', rulerOfficerId: 'cao-fang', delta: -7 },
          { kind: 'flag', key: 'lifeng-purged' },
        ],
      },
      {
        id: 'back-them',
        label: { zh: '下密詔,以夏侯玄代司馬師輔政', en: 'Sign the edict: Xiahou Xuan for the regency' },
        effects: [
          { kind: 'officer-status', officerId: 'li-feng', status: 'dead' },
          { kind: 'officer-loyalty', officerId: 'xiahou-xuan', delta: 15 },
          { kind: 'city-loyalty', cityId: 'luoyang', delta: -15 },
          { kind: 'mandate-ruler', rulerOfficerId: 'cao-fang', delta: 6 },
          { kind: 'flag', key: 'lifeng-imperial-backing' },
        ],
      },
      {
        id: 'betray',
        label: { zh: '執李豐以獻,自保天位', en: 'Hand Li Feng over and keep the throne' },
        effects: [
          { kind: 'officer-status', officerId: 'li-feng', status: 'dead' },
          { kind: 'officer-loyalty', officerId: 'sima-shi', delta: 10 },
          { kind: 'mandate-ruler', rulerOfficerId: 'cao-fang', delta: -12 },
          { kind: 'flag', key: 'lifeng-betrayed' },
        ],
      },
    ],
    mood: 'ominous',
  },
  {
    id: 'evt-wenyang-raid',
    name: { en: 'Wen Yang Rides Into the Camp', zh: '文鴦夜斫營' },
    yearMin: 255,
    yearMax: 256,
    requires: [
      { kind: 'officer-alive', officerId: 'sima-shi' },
      { kind: 'officer-active', officerId: 'wen-qin' },
      { kind: 'officer-active', officerId: 'guanqiu-jian' },
    ],
    description:
      'Guanqiu Jian and Wen Qin raise Huainan against the Sima — the second rising, and the one that nearly worked. Wen Qin son Yang is eighteen. He tells his father the enemy camp is not yet settled and can be broken tonight, splits the horse into two wings, and gets there first, riding through the lines shouting for Sima Shi to come out and show himself. The camp comes apart in the dark. Sima Shi had a tumour cut from his eye a few days before; lying in his tent he presses the bedding over his face so no one will hear him, and bites through it.',
    descriptionZh:
      '毌丘儉、文欽舉兵壽春,移檄郡國,數司馬師之罪十一。欽子鴦,年十八,力冠三軍,謂欽曰:「及其未定,擊之可破也。」乃分為二隊,夜夾攻。鴦率壯士先至,鼓譟大呼曰:「司馬師安在!」一軍皆擾。\n\n師新割目瘤,創甚,聞之驚駭,目睛迸出,以被蒙頭,痛甚,齧被,被皆破碎 —— 而左右不知也。',
    effects: [
      { kind: 'officer-loyalty', officerId: 'wen-qin', delta: 12 },
      { kind: 'city-loyalty', cityId: 'shouchun', delta: -10 },
      { kind: 'flag', key: 'wenyang-raid' },
    ],
    mood: 'martial',
  },
  {
    id: 'evt-sima-shi-dies',
    name: { en: 'The Eye Bursts at Xuchang', zh: '目決於許昌' },
    yearMin: 255,
    yearMax: 257,
    requires: [
      { kind: 'officer-alive', officerId: 'sima-shi' },
      { kind: 'flag-set', key: 'wenyang-raid' },
    ],
    description:
      'The rising is put down and its author does not outlive it. Sima Shi dies at Xuchang at forty-eight, having handed the army to his brother in a back room. In Luoyang the boy emperor Cao Mao sees what the moment is worth and orders Sima Zhao to stay at Xuchang and hold the southeast, with Fu Jia to bring the six armies home — the throne reaching for its own soldiers, once, while the reaching is possible. Fu Jia and Zhong Hui advise otherwise. Sima Zhao marches to Luoyang with the army behind him, and the edict is not mentioned again.',
    descriptionZh:
      '儉、欽既敗,師目遂出,還許昌,病篤,召昭付以後事,卒,年四十八。\n\n洛中知之,詔昭留鎮許昌,以尚書傅嘏率六軍還京師 —— 少帝曹髦十四歲,伸了一次手。嘏與鍾會謀之,昭乃徑還洛陽,屯於雒水之南,詔遂不行。天下之勢,自此無問焉。',
    effects: [
      { kind: 'officer-status', officerId: 'sima-shi', status: 'dead' },
      { kind: 'officer-loyalty', officerId: 'sima-zhao', delta: 12 },
      { kind: 'city-loyalty', cityId: 'luoyang', delta: -8 },
      { kind: 'flag', key: 'sima-shi-gone' },
    ],
    mood: 'ominous',
  },
  {
    id: 'evt-jikang-guangling',
    name: { en: 'The Guangling Melody Ends Here', zh: '廣陵散於今絕矣' },
    yearMin: 262,
    yearMax: 263,
    requires: [
      { kind: 'officer-alive', officerId: 'ji-kang' },
      { kind: 'officer-alive', officerId: 'sima-zhao' },
    ],
    description:
      'Ji Kang is arrested over another man affair and Zhong Hui, who once came to his forge and was not spoken to, tells the regent: this one is a sleeping dragon, and cannot be allowed to wake. Three thousand students of the Imperial Academy petition to have him as their master. He is taken to the eastern market instead. He looks at where the shadow has got to, asks for his zither, and plays — then says that Yuan Xiaoni once asked to learn this piece and he refused him, and that the Guangling melody ends here.',
    descriptionZh:
      '嵇康以呂安事下獄。鍾會構之於文王曰:「嵇康,臥龍也,不可起。公無憂天下,顧以康為慮耳。」太學生三千人請以為師,不許。\n\n康將刑東市,顧視日影,索琴彈之,曰:「昔袁孝尼嘗從吾學廣陵散,吾每靳固之,廣陵散於今絕矣!」時年四十。海內之士,莫不痛之。',
    effects: [],
    chooserRulerId: 'sima-zhao',
    choices: [
      {
        id: 'execute',
        label: { zh: '從鍾會之言,棄市', en: 'Take Zhong Hui advice: the eastern market' },
        effects: [
          { kind: 'officer-status', officerId: 'ji-kang', status: 'dead' },
          { kind: 'officer-loyalty', officerId: 'zhong-hui', delta: 8 },
          { kind: 'mandate-ruler', rulerOfficerId: 'sima-zhao', delta: -6 },
          { kind: 'flag', key: 'jikang-slain' },
        ],
      },
      {
        id: 'spare',
        label: { zh: '赦之,聽其還山陽鍛鐵', en: 'Let him go back to his forge at Shanyang' },
        effects: [
          { kind: 'officer-loyalty', officerId: 'zhong-hui', delta: -10 },
          { kind: 'mandate-ruler', rulerOfficerId: 'sima-zhao', delta: 7 },
          { kind: 'city-loyalty', cityId: 'luoyang', delta: 10 },
          { kind: 'flag', key: 'jikang-spared' },
        ],
      },
    ],
    mood: 'somber',
  },

  /* ════════════════════════════════════════════════════════════════════
     後三國 · 吳:建業宮裡的四十年(241–280)

     吳國不是被晉滅的,是先在自己的宮裡爛掉的 —— 太子登一死,二宮之爭;
     諸葛恪一敗,孫峻的刀;孫綝廢立;然後是孫皓。這一段全庫一條事件都沒有:
     孫登 0 次、孫綝 0 次、丁奉 0 次、孫皓 0 次。

     ⚠ 年份窗口要蓋住盤的**開局年之後** —— 西陵(272)與晉滅吳(280)這兩張
     最薄的盤,補 264 年的事件對它們一點用都沒有。所以底下拆成兩組:
     241–266 那組給 241/244/249/252/253/255/257/263/264/265,
     273–284 那組專給 272 與 280。
     ════════════════════════════════════════════════════════════════════ */
  {
    id: 'evt-sun-deng-dies',
    name: { en: 'The Death of the Heir Sun Deng', zh: '太子登之薨' },
    yearMin: 241,
    yearMax: 243,
    requires: [
      { kind: 'officer-alive', officerId: 'sun-deng' },
      { kind: 'officer-alive', officerId: 'sun-quan' },
    ],
    description:
      'Sun Deng has been heir for twenty years and is the one thing about the succession nobody in Wu argues about. He dies at thirty-three. His last memorial names the men fit to be trusted with the state, asks for lighter corvee and fewer levies, and asks his father to settle the succession early so the realm knows where it stands. Sun Quan reads it and cannot stop weeping. He then names Sun He heir and goes on favouring Sun Ba exactly as before, and the court spends the next eight years choosing sides.',
    descriptionZh:
      '赤烏四年五月,太子登卒,年三十三。臨終上疏,言諸葛瑾、步騭、朱然、全琮、朱據、呂岱、吾粲、闞澤、嚴畯、張承皆通達治體,可付大任;又願寬息賦役,以順民望。末言:「皇子和仁孝聰哲,德行清茂,宜早建置,以繫民望。」\n\n權省書悲感,不能自勝。—— 二宮之爭,自此一步之遙。',
    effects: [
      { kind: 'officer-status', officerId: 'sun-deng', status: 'dead' },
      { kind: 'flag', key: 'sun-deng-gone' },
    ],
    chooserRulerId: 'sun-quan',
    choices: [
      {
        id: 'he-and-ba',
        label: { zh: '立和為嗣,而寵霸如故', en: 'Sun He as heir — and Sun Ba favoured as before' },
        effects: [
          { kind: 'city-loyalty', cityId: 'jianye', delta: -12 },
          { kind: 'mandate-ruler', rulerOfficerId: 'sun-quan', delta: -6 },
          { kind: 'flag', key: 'ergong-seeds' },
        ],
      },
      {
        id: 'he-only',
        label: { zh: '立和為嗣,黜霸出鎮,絕兩宮之嫌', en: 'Sun He alone; send Sun Ba out to a garrison' },
        effects: [
          { kind: 'city-loyalty', cityId: 'jianye', delta: 10 },
          { kind: 'officer-loyalty', officerId: 'lu-xun', delta: 12 },
          { kind: 'mandate-ruler', rulerOfficerId: 'sun-quan', delta: 6 },
          { kind: 'flag', key: 'ergong-averted' },
        ],
      },
      {
        id: 'wait',
        label: { zh: '虛儲位,待諸子之長', en: 'Leave the seat empty and see how the sons grow' },
        effects: [
          { kind: 'city-loyalty', cityId: 'jianye', delta: -6 },
          { kind: 'officer-loyalty', officerId: 'sun-ba', delta: 10 },
          { kind: 'officer-loyalty', officerId: 'sun-he', delta: 10 },
          { kind: 'flag', key: 'ergong-deferred' },
        ],
      },
    ],
    mood: 'somber',
  },
  {
    id: 'evt-dongxing-dike',
    name: { en: 'Short Blades on the Dongxing Dike', zh: '東興堤上雪' },
    yearMin: 252,
    yearMax: 254,
    requires: [
      { kind: 'officer-active', officerId: 'ding-feng' },
      { kind: 'officer-active', officerId: 'zhuge-ke' },
    ],
    description:
      'Wei sends seventy thousand against the new dike at Dongxing. Zhuge Ke comes up with forty thousand; Ding Feng tells him the other columns are too slow and takes three thousand of his own down the water instead, sails two days on a north wind, and is standing at Xutang before anyone expects him. It is snowing and the Wei officers are at their wine. Seeing how few men are in the forward camp, Ding Feng tells his troops that rank and fief are being handed out today — and has them strip off their armour and go up the dike in helmets with short blades. The Wei men laugh at the sight and do not stand to. The pontoon breaks under the rout; tens of thousands drown.',
    descriptionZh:
      '恪作大堤於東興,左右結山,夾築兩城。魏遣胡遵、諸葛誕等率眾七萬攻圍兩塢。恪興軍四萬,晨夜赴救。丁奉曰:「今諸軍行緩,若敵據便地,則難與爭鋒矣。」乃辟諸軍使下道,自率麾下三千人徑進。時北風,舉帆二日至,遂據徐塘。\n\n天寒雪,敵諸將方會飲。奉見其前部兵少,謂左右曰:「取封侯爵賞,正在今日!」乃使兵解鎧著冑,持短兵。敵人望而笑之,不為設備。奉縱兵斫之,大破前屯,浮橋絕,爭渡墮水,死者數萬。',
    effects: [
      { kind: 'officer-loyalty', officerId: 'ding-feng', delta: 15 },
      { kind: 'officer-loyalty', officerId: 'zhuge-ke', delta: 10 },
      { kind: 'city-troops-multiplier', cityId: 'hefei', multiplier: 0.85 },
      { kind: 'city-defense', cityId: 'ruxu', delta: 12 },
      { kind: 'flag', key: 'dongxing-victory' },
    ],
    mood: 'martial',
  },
  {
    id: 'evt-sun-lin-deposes',
    name: { en: 'Sun Lin Unmakes an Emperor', zh: '孫綝廢立' },
    yearMin: 258,
    yearMax: 260,
    requires: [
      { kind: 'officer-alive', officerId: 'sun-lin' },
      { kind: 'officer-alive', officerId: 'sun-liang' },
    ],
    description:
      'Sun Lin is twenty-seven and has killed two regents to get where he is. The emperor Sun Liang is sixteen and has started asking, out loud, why the granary records do not match. He plans with his sister and Liu Cheng to have Sun Lin taken; the plan leaks; Sun Lin deposes him and sends him out as marquis of Kuaiji, and brings in his elder brother Sun Xiu instead. Which is where it turns: at the winter feast Sun Xiu has Ding Feng and Zhang Bu take Sun Lin from behind. He asks to be sent to Jiaozhou; the emperor asks him why he did not send Teng Yin and Lu Ju to Jiaozhou. He asks to be made a slave of the state; the emperor asks the same question again. Then his head goes round the camps with a herald saying that everyone he misled is pardoned.',
    descriptionZh:
      '綝以宗室秉政,連誅滕胤、呂據,兵威震主。帝亮年十六,始親覽政事,數詰責綝。亮與全公主、將軍劉承謀誅之,事洩。太平三年九月,綝以太后令廢帝為會稽王,迎琅琊王休立之。\n\n永安元年臘會,綝稱疾不入,休彊起之。酒數行,張布目丁奉,左右縛綝。綝叩首曰:「願徙交州。」休曰:「卿何以不徙滕胤、呂據於交州?」綝曰:「願沒為官奴。」休曰:「何不以胤、據為奴乎?」遂斬之,以其首徇軍曰:「諸為綝所詿誤者,皆赦之。」',
    effects: [],
    chooserRulerId: 'sun-liang',
    choices: [
      {
        id: 'deposed',
        label: { zh: '謀洩,受廢為會稽王', en: 'The plan leaks; go out as marquis of Kuaiji' },
        effects: [
          { kind: 'officer-status', officerId: 'sun-lin', status: 'dead' },
          { kind: 'city-loyalty', cityId: 'jianye', delta: -14 },
          { kind: 'mandate-ruler', rulerOfficerId: 'sun-liang', delta: -10 },
          { kind: 'flag', key: 'sunlin-deposes' },
        ],
      },
      {
        id: 'strike-first',
        label: { zh: '先發,伏兵於殿,誅孫綝', en: 'Strike first: swordsmen behind the screens' },
        effects: [
          { kind: 'officer-status', officerId: 'sun-lin', status: 'dead' },
          { kind: 'officer-loyalty', officerId: 'ding-feng', delta: 12 },
          { kind: 'city-loyalty', cityId: 'jianye', delta: -8 },
          { kind: 'mandate-ruler', rulerOfficerId: 'sun-liang', delta: 12 },
          { kind: 'flag', key: 'sunlin-slain-early' },
        ],
      },
      {
        id: 'endure',
        label: { zh: '隱忍,委政於綝以待其斃', en: 'Endure; hand him the government and wait' },
        effects: [
          { kind: 'officer-loyalty', officerId: 'sun-lin', delta: 12 },
          { kind: 'city-loyalty', cityId: 'jianye', delta: -6 },
          { kind: 'mandate-ruler', rulerOfficerId: 'sun-liang', delta: -5 },
          { kind: 'flag', key: 'sunlin-endured' },
        ],
      },
    ],
    mood: 'ominous',
  },
  {
    id: 'evt-sun-hao-first',
    name: { en: 'Sun Hao Begins Well', zh: '粗有令稱' },
    yearMin: 264,
    yearMax: 267,
    requires: [
      { kind: 'officer-alive', officerId: 'sun-hao' },
      { kind: 'flag-unset', key: 'sunhao-tyrant' },
    ],
    description:
      'The new sovereign opens with everything a good reign is supposed to open with: relief edicts, granaries unsealed for the poor, palace women sent out to be married to men who have none, the beasts of the royal park turned loose. For a season the realm calls him an enlightened ruler. Then, having got what he wanted, he becomes coarse, violent, swollen with himself, thick with taboos, and fond of wine and women — and the men who put him there begin, quietly, to regret it. Puyang Xing and Zhang Bu regret it out loud enough to be reported, and are dead by the eleventh month.',
    descriptionZh:
      '皓初立,發優詔,恤士民,開倉廩,振貧乏,科出宮女以配無妻者,禽獸養於苑者皆放之。當時翕然稱為明主。\n\n及既得志,粗暴驕盈,多忌諱,好酒色,大小失望。濮陽興、張布竊悔之 —— 或以譖皓,十一月誅興、布,夷三族。',
    effects: [],
    chooserRulerId: 'sun-hao',
    choices: [
      {
        id: 'turn',
        label: { zh: '既得志,粗暴驕盈', en: 'Having got it, let the mask come off' },
        effects: [
          { kind: 'officer-status', officerId: 'zhang-bu', status: 'dead' },
          { kind: 'city-loyalty', cityId: 'jianye', delta: -18 },
          { kind: 'mandate-ruler', rulerOfficerId: 'sun-hao', delta: -8 },
          { kind: 'flag', key: 'sunhao-tyrant' },
        ],
      },
      {
        id: 'keep',
        label: { zh: '守初政,終始如一', en: 'Keep the opening reign to the end' },
        effects: [
          { kind: 'city-loyalty', cityId: 'jianye', delta: 15 },
          { kind: 'city-loyalty', cityId: 'wuchang', delta: 10 },
          { kind: 'officer-loyalty', officerId: 'lu-kai', delta: 12 },
          { kind: 'mandate-ruler', rulerOfficerId: 'sun-hao', delta: 10 },
          { kind: 'flag', key: 'sunhao-restrained' },
        ],
      },
    ],
    mood: 'auspicious',
  },

  /* ── 吳晉末路(273–284):西陵與晉滅吳兩張盤能演到的,只有這一組 ── */
  {
    id: 'evt-sunhao-cruelty',
    name: { en: 'The Saw and the Flaying Knife', zh: '剝面鑿眼' },
    yearMin: 273,
    yearMax: 279,
    requires: [
      { kind: 'officer-alive', officerId: 'sun-hao' },
      { kind: 'flag-unset', key: 'sunhao-restrained' },
    ],
    description:
      'He Ding, a former stable clerk, is running the court by informing on it. The sovereign holds banquets where every guest must drink seven measures and appointed censors write down what is said and how it is looked; those who displease him have their faces peeled or their eyes bored out. He Shao is beaten to death, Lou Xuan sent to the sea and made to kill himself. Lu Kai memorialises that the state has three calamities and not one blessing left, and dies before the reply comes. The frontier commanders keep asking for men; the men are in Jianye, building palaces.',
    descriptionZh:
      '皓使何定典兵,定本孫權給使小人,而皓委以耳目,群臣側足。皓每饗宴,無不竟日,坐席無能否率以七升為限;又置黃門郎十人為司過之官,宴罷各奏其闕失,或剝人面,或鑿人眼。\n\n中書令賀邵坐口不能言,收付酒藏,掠考千所,竟殺之。宮下鎮驃騎將軍樓玄流徙廣州,追賜死。左丞相陸凱上疏極諫,言國有三不祥,而無一善政 —— 疏入,不報。',
    effects: [
      { kind: 'city-loyalty', cityId: 'jianye', delta: -16 },
      { kind: 'city-loyalty', cityId: 'wuchang', delta: -12 },
      { kind: 'city-loyalty', cityId: 'wu', delta: -10 },
      { kind: 'mandate-ruler', rulerOfficerId: 'sun-hao', delta: -10 },
      { kind: 'flag', key: 'sunhao-tyrant' },
    ],
    mood: 'ominous',
  },
  {
    id: 'evt-lu-kang-dies',
    name: { en: 'The Last Memorial of Lu Kang', zh: '陸抗之薨' },
    // 窗口從 273 起而不是史實的 274:陸抗庫裡 deathYear 274,aging 會在那一年
    // 自己把他收走 —— 第一版寫 274–276,六輪只演到三輪,另外三輪他先老死了,
    // 那封「西陵建平,國之藩表」的遺疏就永遠看不到。提前一年給事件搶身位。
    yearMin: 273,
    yearMax: 276,
    requires: [
      { kind: 'officer-alive', officerId: 'lu-kang' },
      { kind: 'officer-alive', officerId: 'sun-hao' },
    ],
    description:
      'Lu Kang has held the western gate of Wu with fewer men than the job needs for twelve years, and has said so in writing every year. His last memorial says it once more: Xiling and Jianping are the outer wall of the state, and they are upstream — if either goes, the whole southern bank goes with it, and no defence downstream can be improvised in time. He asks for thirty thousand more men for the west. He gets no reply and dies in the summer. Yang Hu, across the line, reads the news and starts drafting the plan for the invasion.',
    descriptionZh:
      '抗疾病,上疏曰:「西陵、建平,國之藩表,既處上流,受敵二境。若敵汎舟順流,舳艫千里,星奔電邁,俄然行至 —— 此乃社稷安危之機,非徒封疆侵陵小害也。臣父遜昔在西垂陳言,以為西陵國之西門,雖云易守,亦復易失。臣往在西陵,得涉遜跡,前乞精兵三萬,而至者循常,未肯差赴。」\n\n疏入,不報。秋七月,抗卒。吳之西門,自是無人。',
    effects: [
      { kind: 'officer-status', officerId: 'lu-kang', status: 'dead' },
      { kind: 'city-defense', cityId: 'jiangling', delta: -18 },
      { kind: 'city-defense', cityId: 'wuchang', delta: -10 },
      { kind: 'mandate-ruler', rulerOfficerId: 'sun-hao', delta: -6 },
      { kind: 'flag', key: 'lu-kang-gone' },
    ],
    mood: 'somber',
  },
  {
    id: 'evt-atong-song',
    name: { en: 'A Tong Comes Down the River', zh: '阿童復阿童' },
    yearMin: 275,
    yearMax: 280,
    requires: [
      { kind: 'officer-alive', officerId: 'wang-jun' },
      { kind: 'officer-alive', officerId: 'yang-hu' },
    ],
    description:
      'A children rhyme goes round the Jing province villages: A Tong, A Tong again, with a blade at his belt he floats across the river; he fears not the horse on the bank, he fears the boat astern. Yang Hu hears it and says the man in it must be a naval commander — and A Tong happens to be the milk-name of Wang Jun, who is governor of Yizhou. Yang Hu keeps him on upstream instead of promoting him away, and Wang Jun spends the next five years building ships in Shu: decks a hundred and twenty paces long, painted beasts at the prows, room for two thousand men. The shavings come down the Yangtze in drifts, and Wu, seeing them go past, does nothing.',
    descriptionZh:
      '荊州童謠曰:「阿童復阿童,銜刀浮渡江。不畏岸上獸,但畏水中龍。」羊祜聞之曰:「此必水軍有功。」而王濬小字阿童,時為益州刺史 —— 祜表留監益州諸軍事,使治水軍。\n\n濬乃作大船連舫,方百二十步,受二千餘人,以木為城,起樓櫓,開四出門,其上皆得馳馬來往。舟楫之盛,自古未有。作船木柹蔽江而下,吳建平太守吾彥取以白皓曰:「晉必有攻吳之計,宜增建平兵。」皓不從。',
    effects: [
      { kind: 'city-troops-multiplier', cityId: 'chengdu', multiplier: 1.12 },
      { kind: 'officer-loyalty', officerId: 'wang-jun', delta: 12 },
      { kind: 'city-loyalty', cityId: 'jiangling', delta: -8 },
      { kind: 'flag', key: 'atong-ships' },
    ],
    mood: 'mystic',
  },
  {
    id: 'evt-yanghu-tears',
    name: { en: 'The Stone That Makes Them Weep', zh: '墮淚碑' },
    yearMin: 278,
    yearMax: 281,
    requires: [
      { kind: 'officer-alive', officerId: 'yang-hu' },
      { kind: 'officer-alive', officerId: 'sima-yan' },
    ],
    description:
      'Ten years on the Xiangyang line, and Yang Hu fought it by not fighting it: fields farmed until the granaries held ten years of grain, prisoners sent home, game shot on the far bank returned to the hunters who wounded it first, Lu Kang sent wine and Lu Kang drank it. He asks, dying, for the invasion to go ahead, and names Du Yu to take his place. The emperor sends Zhang Hua to hear the last of it. When Xiangyang learns he is gone the markets close; the people of Jing raise a stone on Mount Xian where he liked to sit, and no one who reads it can keep from crying, so Du Yu gives it the name it still has.',
    descriptionZh:
      '祜鎮襄陽十年,務修德信以懷吳人:每交兵,克日方戰,不為掩襲;獲吳二將之子,送還其家;吳人有來降者,欲去皆聽之。與陸抗對境,使命交通,抗遺祜酒,祜飲之不疑;抗嘗病,祜饋之藥,抗服之無難色。軍無私財,墾田八百餘頃,積糧十年之儲。\n\n疾篤,舉杜預自代,曰:「吳平則蜀漢之弊自解,願陛下勿失此機。」卒,南州人罷市巷哭,吳守邊將士亦為之泣。襄陽百姓於峴山祜平生遊憩之所建碑立廟,歲時饗祭,望其碑者莫不流涕 —— 杜預因名之曰墮淚碑。',
    effects: [
      { kind: 'officer-status', officerId: 'yang-hu', status: 'dead' },
      { kind: 'officer-loyalty', officerId: 'du-yu', delta: 15 },
      { kind: 'city-food', cityId: 'xiangyang', delta: 40000 },
      { kind: 'city-loyalty', cityId: 'xiangyang', delta: 12 },
      { kind: 'flag', key: 'yanghu-gone' },
    ],
    mood: 'somber',
  },
  {
    id: 'evt-wangjun-no-orders',
    name: { en: 'The Wind Is Good and We Cannot Moor', zh: '不受節度' },
    yearMin: 280,
    yearMax: 283,
    requires: [
      { kind: 'officer-alive', officerId: 'wang-jun' },
      { kind: 'flag-unset', key: 'jinunite-ended' },
    ],
    description:
      'Six columns are moving on Wu and the one on the water is moving fastest. Wang Hun, whose army is stalled north of the river, sends word for Wang Jun to put in and confer — which would hand the surrender of Jianye, and the credit for the reunification, to a man standing on the wrong bank. Wang Jun replies that the wind is good and he cannot moor, and goes past under full sail with eighty thousand men and a river of banners. Du Yu, who could have made the same claim, writes to him instead: take the whole thing, and let the arguing wait.',
    descriptionZh:
      '濬自巴丘東下,克西陵、夷道、樂鄉,兵不血刃,攻無堅城。王渾軍屯於江北,遣信要濬暫過議事 —— 濬舉帆直指建業,報曰:「風利,不得泊也。」\n\n杜預與濬書曰:「足下既摧其西藩,便當徑取秣陵,討累世之逋寇,釋吳人於塗炭 —— 自江入淮,逾於泗汴,溯河而上,振旅還都,亦曠世一事也!」濬大悅,以其書表上之。',
    effects: [
      { kind: 'officer-loyalty', officerId: 'wang-jun', delta: 10 },
      { kind: 'city-loyalty', cityId: 'jianye', delta: -12 },
      { kind: 'city-defense', cityId: 'jianye', delta: -10 },
      { kind: 'flag', key: 'wangjun-full-sail' },
    ],
    mood: 'martial',
  },

  /* ── 遼東:出兵之前與破城之後(既有的鏈從「大雨」開始,兩頭都缺一節)── */
  {
    id: 'evt-sima-yi-one-year',
    name: { en: 'A Year Will Be Enough', zh: '一年足矣' },
    yearMin: 238,
    yearMax: 239,
    requires: [
      { kind: 'officer-alive', officerId: 'cao-rui' },
      { kind: 'officer-alive', officerId: 'sima-yi' },
      { kind: 'officer-alive', officerId: 'gongsun-yuan' },
      { kind: 'flag-unset', key: 'xiangping-ring' },
    ],
    description:
      'Gongsun Yuan has declared himself king of Yan and taken a title from Wu. Some at court say four myriad men is too many for a march of four thousand li and the transport will ruin the treasury. The emperor says that when you campaign four thousand li, cleverness is not enough, you also need weight, and this is not the moment to be counting carts. Then he asks Sima Yi how long it will take. A hundred days to go, a hundred days to take it, a hundred days to come back, sixty to rest: a year will be enough.',
    descriptionZh:
      '淵自立為燕王,置百官,南結孫權,北誘鮮卑。帝召司馬懿於長安,使將四萬眾討之。議臣或以為四萬兵多,役費難供。帝曰:「四千里征伐,雖云用奇,亦當任力,不當稍計役費。」\n\n帝問懿:「往還幾時?」對曰:「往百日,攻百日,還百日,以六十日為休息,一年足矣。」又問:「淵何計?」對曰:「棄城預走,上計也;據遼水以距大軍,次計也;坐守襄平,此成擒耳。」帝曰:「其計將安出?」對曰:「惟明者能深度彼己,豫有所棄 —— 此非淵所及也。」',
    effects: [],
    chooserRulerId: 'cao-rui',
    choices: [
      {
        id: 'four-myriad',
        label: { zh: '與兵四萬,不計役費', en: 'Four myriad men, and stop counting carts' },
        effects: [
          { kind: 'officer-loyalty', officerId: 'sima-yi', delta: 10 },
          { kind: 'city-defense', cityId: 'xiangping', delta: -10 },
          { kind: 'flag', key: 'liaodong-full-army' },
        ],
      },
      {
        id: 'frugal',
        label: { zh: '減為萬人,省關中之役', en: 'Ten thousand: Guanzhong cannot carry more' },
        effects: [
          { kind: 'force-gold-ruler', rulerOfficerId: 'cao-rui', delta: 3000 },
          { kind: 'city-defense', cityId: 'xiangping', delta: 18 },
          { kind: 'officer-loyalty', officerId: 'sima-yi', delta: -6 },
          { kind: 'flag', key: 'liaodong-small-army' },
        ],
      },
      {
        id: 'no-campaign',
        label: { zh: '不征,以幽州刺史羈縻之', en: 'Do not march; hold him with the Youzhou office' },
        effects: [
          { kind: 'city-troops-multiplier', cityId: 'xiangping', multiplier: 1.25 },
          { kind: 'officer-loyalty', officerId: 'gongsun-yuan', delta: 12 },
          { kind: 'force-gold-ruler', rulerOfficerId: 'cao-rui', delta: 6000 },
          { kind: 'flag', key: 'liaodong-no-campaign' },
        ],
      },
    ],
    mood: 'martial',
  },
  {
    id: 'evt-xiangping-jingguan',
    name: { en: 'The Mound at Xiangping', zh: '京觀' },
    yearMin: 238,
    yearMax: 242,
    requires: [
      { kind: 'flag-set', key: 'xiangping-stormed' },
      { kind: 'officer-alive', officerId: 'sima-yi' },
    ],
    description:
      'The wall came down on the壬午 day. Gongsun Yuan and his son broke out southeast with a few hundred horse and were run down where the meteor had fallen; their heads went to Luoyang. Inside, the chancellor and everyone of rank below him were beheaded by the thousand, and every male of fifteen years and over — some seven thousand of them — was killed and the bodies piled into a mound, so that anyone coming up the road afterwards would understand what had been decided here. Liaodong, Daifang, Lelang and Xuantu were all pacified. Sima Yi then opened the granaries to the starving and sent the old soldiers home, and the four commanderies were quiet for thirty years.',
    descriptionZh:
      '壬午,城潰。淵與子脩將數百騎突圍東南走,大兵急擊之,當流星所墜處,斬淵父子,傳首洛陽。城中斬相國以下首級以千數,男子年十五已上七千餘人皆殺之,以為京觀 —— 遼東、帶方、樂浪、玄菟悉平。\n\n既而開倉廩,恤饑者,遣舊將吏還鄉里。時有兵士寒凍,乞襦,宣王弗與,或曰:「幸多故襦,可以賜之。」宣王曰:「襦者官物,人臣無私施也。」四郡自是三十年不聞兵革。',
    effects: [
      { kind: 'city-loyalty', cityId: 'xiangping', delta: -30 },
      { kind: 'city-troops-multiplier', cityId: 'xiangping', multiplier: 0.5 },
      { kind: 'officer-loyalty', officerId: 'sima-yi', delta: 12 },
      { kind: 'flag', key: 'xiangping-jingguan' },
    ],
    mood: 'ominous',
  },

  /* ── 晉初(265–273):鍾會之亂/司馬炎篡魏/西陵三張盤能演到的那幾年 ── */
  {
    id: 'evt-sima-zhao-dies',
    name: { en: 'The Prince of Jin Does Not Take the Last Step', zh: '文王之薨' },
    yearMin: 265,
    yearMax: 267,
    requires: [
      { kind: 'officer-alive', officerId: 'sima-zhao' },
      { kind: 'officer-alive', officerId: 'sima-yan' },
    ],
    description:
      'Shu is taken, the Nine Bestowals are accepted, the title of King of Jin is accepted, and the last step is not taken. Asked why, he says what his father would have said: if heaven has kept this seat for me, then let me be King Wen — meaning the man who did the work and let his son take the crown for it. In the eighth month he has a stroke and cannot speak; he takes his son by the hand and points at him, and dies. Sima Yan buries him, keeps the mourning short, and by the twelfth month the abdication is written.',
    descriptionZh:
      '蜀既平,昭封晉公,加九錫,進爵為王。或勸受禪,昭曰:「若天命在吾,吾其為周文王矣。」\n\n咸熙二年八月辛卯,王疾篤,不能言,執太子炎手而指之,遂崩,年五十五。炎襲位為相國、晉王。十二月,魏帝奐禪位於晉。',
    effects: [
      { kind: 'officer-status', officerId: 'sima-zhao', status: 'dead' },
      { kind: 'officer-loyalty', officerId: 'sima-yan', delta: 14 },
      { kind: 'officer-loyalty', officerId: 'jia-chong', delta: 8 },
      { kind: 'city-loyalty', cityId: 'luoyang', delta: -6 },
      { kind: 'flag', key: 'sima-zhao-gone' },
    ],
    mood: 'somber',
  },
  {
    id: 'evt-jin-taishi',
    name: { en: 'The Taishi Ordinances', zh: '泰始之政' },
    yearMin: 266,
    yearMax: 271,
    requires: [
      { kind: 'officer-alive', officerId: 'sima-yan' },
      { kind: 'officer-rules-cities-min', officerId: 'sima-yan', count: 30 },
    ],
    description:
      'The new dynasty spends its first years undoing things. The agricultural-garrison offices, which had made the state a landlord to its own soldiers for sixty years, are abolished and the land handed to the counties. The proscription on the Cao clan is lifted. Twenty-seven kinsmen are enfeoffed as kings with their own troops, which will look like foresight for exactly twenty-five years. And the Taishi code goes out: the old law had over twenty thousand articles and seven hundred and seventy-three thousand words, and the new one has six hundred and twenty articles and a hundred and twenty-six thousand — the first Chinese code short enough that the people who had to obey it could be told what it said.',
    descriptionZh:
      '泰始元年,詔罷屯田官,以屯田民歸郡縣;除魏宗室禁錮,聽其仕進;封宗室二十七人為王,各以戶邑大小置軍。\n\n四年,頒《泰始律》於天下。漢律科條無限,凡二萬六千餘條,七百七十三萬言,覽者益難。新律但為二十篇,六百二十條,二萬七千六百五十七言 —— 詔曰:「律令既就,班之天下,將以簡直,寡而易從。」是為後世律令之祖。',
    effects: [
      { kind: 'city-loyalty', cityId: 'luoyang', delta: 14 },
      { kind: 'city-loyalty', cityId: 'changan', delta: 10 },
      { kind: 'city-loyalty', cityId: 'chengdu', delta: 10 },
      { kind: 'mandate-ruler', rulerOfficerId: 'sima-yan', delta: 10 },
      { kind: 'flag', key: 'jin-taishi-code' },
    ],
    mood: 'auspicious',
  },
  {
    id: 'evt-sunhao-huali',
    name: { en: 'The Emperor Rides North to Hua Li', zh: '皓出華里' },
    yearMin: 271,
    yearMax: 275,
    requires: [
      { kind: 'officer-alive', officerId: 'sun-hao' },
      { kind: 'flag-unset', key: 'sunhao-restrained' },
    ],
    description:
      'A diviner tells the sovereign that the blue canopy of the imperial carriage ought to enter Luoyang. So he sets out north in the first month with his mother, his consorts and the whole harem, in snow, on roads where the soldiers carry their armour and their weapons and one dead man in every hundred paces. The troops say among themselves that if they meet the enemy they will change sides. His mother tells him to turn round before something happens that cannot be undone. He turns round at Hua Li. Wu spends the rest of the reign paying for the trip.',
    descriptionZh:
      '皓聞歷陽山石文理成字,曰「楚九州渚,吳九州都,揚州士,作天子,四世治,太平始」,又望氣者云荊州有王氣破揚州而建業宮不利 —— 遂徙都武昌。揚土百姓溯流供給,以為患苦。左丞相陸凱上疏,引童謠曰:「寧飲建業水,不食武昌魚;寧還建業死,不止武昌居。」\n\n建衡三年正月,皓又以望氣者言「青蓋當入洛陽」,大舉北出,載其母妻子及後宮數千人,從牛渚陸道西上。時大雪,道塗陷壞,兵士被甲持仗,百人共引一車,寒凍殆死。兵人皆曰:「若遇敵,便當倒戈耳。」皓聞之,乃還。',
    effects: [
      { kind: 'city-loyalty', cityId: 'jianye', delta: -12 },
      { kind: 'city-loyalty', cityId: 'wuchang', delta: -16 },
      { kind: 'city-food', cityId: 'wuchang', delta: -20000 },
      { kind: 'mandate-ruler', rulerOfficerId: 'sun-hao', delta: -8 },
      { kind: 'flag', key: 'sunhao-huali' },
    ],
    mood: 'ominous',
  },

  /* ── 太康(280–286):晉滅吳那張盤開局在 280,能演到的只有這之後的事 ──
       它原本全盤只有四條事件,而那四條全是滅吳本身;吳一降,剩下的十年空著。 */
  {
    id: 'evt-wangjun-wanghun-feud',
    name: { en: 'Two Men Claim the Same River', zh: '爭功' },
    yearMin: 280,
    yearMax: 284,
    requires: [
      { kind: 'officer-alive', officerId: 'wang-jun' },
      { kind: 'officer-alive', officerId: 'wang-hun' },
      { kind: 'flag-set', key: 'jinunite-ended' },
    ],
    description:
      'Wang Hun beat the last Wu field army north of the river and then watched Wang Jun sail past him and take the surrender. He memorialises that Wang Jun disobeyed orders and should be brought back in a cage-cart; the law officers agree that it was gross disrespect. Wang Jun, for his part, cannot get through an audience without relating both his campaign and his grievance, and sometimes walks out without taking leave. The emperor knows exactly what he has on his hands — the man who ended a three-hundred-year division, and the man whose family is the most powerful in the north — and declines to decide between them.',
    descriptionZh:
      '渾以濬不從節度,表上其事,並奏濬違詔不受節度,請檻車徵。有司奏濬違詔大不敬,請付廷尉。帝弗許,但以詔書責濬曰:「將軍功勳茂著,而恃功肆意,朕以功掩過,勿復多言。」\n\n濬自以功大,而為渾父子及其黨與所挫抑,每進見,陳其攻伐之勞,及見枉之狀,或不勝忿憤,徑出不辭。帝終不問。范通謂濬曰:「卿功則美矣,然恨所以居美者未盡善也。」濬曰:「吾始懼鄧艾之事,勢不得默 —— 意猶不能自忘,是吾之短也。」',
    effects: [],
    chooserRulerId: 'sima-yan',
    choices: [
      {
        id: 'pardon',
        label: { zh: '以功掩過,兩皆封賞', en: 'The merit covers the fault; reward both' },
        effects: [
          { kind: 'officer-loyalty', officerId: 'wang-jun', delta: 8 },
          { kind: 'officer-loyalty', officerId: 'wang-hun', delta: 6 },
          { kind: 'mandate-ruler', rulerOfficerId: 'sima-yan', delta: 5 },
          { kind: 'flag', key: 'wangjun-pardoned' },
        ],
      },
      {
        id: 'cage-cart',
        label: { zh: '檻車徵濬,以正詔命', en: 'The cage-cart: orders are orders' },
        effects: [
          { kind: 'officer-loyalty', officerId: 'wang-jun', delta: -30 },
          { kind: 'officer-loyalty', officerId: 'wang-hun', delta: 12 },
          { kind: 'mandate-ruler', rulerOfficerId: 'sima-yan', delta: -6 },
          { kind: 'flag', key: 'wangjun-caged' },
        ],
      },
      {
        id: 'reward-jun',
        label: { zh: '專賞濬,抑渾之黨', en: 'Reward Wang Jun alone and check the Wang clan' },
        effects: [
          { kind: 'officer-loyalty', officerId: 'wang-jun', delta: 20 },
          { kind: 'officer-loyalty', officerId: 'wang-hun', delta: -25 },
          { kind: 'city-loyalty', cityId: 'luoyang', delta: -10 },
          { kind: 'flag', key: 'wangjun-favoured' },
        ],
      },
    ],
    mood: 'somber',
  },
  {
    id: 'evt-sunhao-at-luoyang',
    name: { en: 'This Seat Has Been Waiting For You', zh: '設此座以待卿久矣' },
    yearMin: 280,
    yearMax: 284,
    requires: [
      { kind: 'officer-alive', officerId: 'sun-hao' },
      { kind: 'officer-alive', officerId: 'jia-chong' },
      { kind: 'flag-set', key: 'jinunite-ended' },
    ],
    description:
      'The last sovereign of Wu is brought up to Luoyang and given a seat at court. The emperor says: I have kept this seat waiting a long while for you. Sun Hao says: in the south your servant also kept a seat, waiting for Your Majesty. Later Jia Chong — who arranged the killing of one emperor and stood by while it was blamed on the man who held the halberd — asks him whether it is true that in the south he bored out eyes and peeled off faces, and what sort of punishment that was supposed to be. Sun Hao says: for a subject who murders his sovereign, or who is crooked and disloyal, that punishment. Jia Chong says nothing at all, and is deeply ashamed; Sun Hao is not embarrassed in the least.',
    descriptionZh:
      '皓至洛陽,帝引見,賜坐曰:「朕設此座以待卿久矣。」皓曰:「臣於南方,亦設此座以待陛下。」\n\n賈充問皓曰:「聞君在南方鑿人目,剝人面皮,此何等刑也?」皓曰:「人臣有弒其君及姦回不忠者,則加此刑耳。」充默然大慚,而皓顏色無怍。',
    effects: [
      { kind: 'mandate-ruler', rulerOfficerId: 'sima-yan', delta: -4 },
      { kind: 'officer-loyalty', officerId: 'jia-chong', delta: -8 },
      { kind: 'flag', key: 'sunhao-at-luoyang' },
    ],
    mood: 'somber',
  },
  {
    id: 'evt-taikang-disarm',
    name: { en: 'Put Up the Weapons', zh: '罷州郡兵' },
    yearMin: 281,
    yearMax: 286,
    requires: [
      { kind: 'officer-alive', officerId: 'sima-yan' },
      { kind: 'flag-set', key: 'jinunite-ended' },
    ],
    description:
      'With the realm one again the court decides the provinces do not need soldiers: the commandery garrisons are stood down, a hundred constables left in a large commandery and fifty in a small one, and the men sent back to the fields. Shan Tao argues against it — that the frontier is quiet is not a reason to have no frontier — and is not heeded. For ten years it looks like the right call: taxes even, granaries full, cattle loose in the open country, surplus grain left standing in the fields, travellers sleeping in the grass and doors not barred at night. Then the princes who were given their own troops in 265 discover that nobody else has any.',
    descriptionZh:
      '太康元年,詔罷州郡兵,大郡置武吏百人,小郡五十人。尚書僕射山濤諫曰:「不宜去州郡武備,其言深切。」帝雖善之,而不能用。\n\n是時天下無事,賦稅平均,人咸安其業而樂其事。牛馬被野,餘糧棲畝,行旅草舍,外閭不閉,民相遇者如親 —— 而宗室二十七王之兵,獨在。',
    effects: [],
    chooserRulerId: 'sima-yan',
    choices: [
      {
        id: 'disarm',
        label: { zh: '罷之,示天下以無事', en: 'Stand them down; show the realm there is no war' },
        effects: [
          { kind: 'force-gold-ruler', rulerOfficerId: 'sima-yan', delta: 12000 },
          { kind: 'city-loyalty', cityId: 'luoyang', delta: 12 },
          { kind: 'city-loyalty', cityId: 'jianye', delta: 12 },
          { kind: 'city-defense', cityId: 'changan', delta: -14 },
          { kind: 'city-defense', cityId: 'ye', delta: -14 },
          { kind: 'flag', key: 'jin-disarmed' },
        ],
      },
      {
        id: 'keep-arms',
        label: { zh: '從山濤之言,州郡武備如故', en: 'Heed Shan Tao: keep the garrisons' },
        effects: [
          { kind: 'force-gold-ruler', rulerOfficerId: 'sima-yan', delta: -8000 },
          { kind: 'city-defense', cityId: 'changan', delta: 14 },
          { kind: 'city-defense', cityId: 'ye', delta: 14 },
          { kind: 'city-defense', cityId: 'luoyang', delta: 10 },
          { kind: 'flag', key: 'jin-armed' },
        ],
      },
    ],
    mood: 'auspicious',
  },

  /* ── 240 年代中段:芍陂那張盤十年窗口裡唯一還空著的一段 ── */
  {
    id: 'evt-lu-xun-dies',
    name: { en: 'Lu Xun Is Questioned to Death', zh: '陸遜之死' },
    yearMin: 244,
    yearMax: 246,
    requires: [
      { kind: 'officer-alive', officerId: 'lu-xun' },
      { kind: 'officer-alive', officerId: 'sun-quan' },
      { kind: 'flag-unset', key: 'ergong-averted' },
    ],
    description:
      'The heir and the second son have divided the court, and the chancellor — who won Yiling, who has held the west for twenty years, who is the only man in Wu everyone still listens to — writes to say that a son is a son and a subject is a subject and the ranks must be kept distinct. He asks to come up to the capital and say it in person. What comes back instead is a series of palace messengers, each carrying the same set of accusations, each requiring an answer. His nephews are exiled, one of his kinsmen flogged in the court. He answers every letter and dies of it in the second month, sixty-three years old, with nothing in the house worth listing.',
    descriptionZh:
      '二宮構爭,中外官僚將軍大臣舉國中分。遜上疏陳:「太子正統,宜有磐石之固;魯王藩臣,當使寵秩有差,彼此得所,上下獲安。」書三四上,又求詣都,欲口論適庶之分,以匡得失。\n\n權不聽,而遣中使責讓遜,前後數輩。遜外甥顧譚、顧承、姚信並流徙,族子陸胤下獄,太子太傅吾粲坐數與遜交書賜死。遜憤恚致卒,時年六十三,家無餘財。—— 火燒連營的那個人,死在建業送來的一封封問責裡。',
    effects: [
      { kind: 'officer-status', officerId: 'lu-xun', status: 'dead' },
      { kind: 'city-loyalty', cityId: 'wu', delta: -14 },
      { kind: 'city-loyalty', cityId: 'jianye', delta: -10 },
      { kind: 'mandate-ruler', rulerOfficerId: 'sun-quan', delta: -8 },
      { kind: 'flag', key: 'lu-xun-gone' },
    ],
    mood: 'somber',
  },
  {
    id: 'evt-guanqiu-goguryeo',
    name: { en: 'The Stone at Wandu', zh: '毌丘儉東征' },
    yearMin: 245,
    yearMax: 249,
    requires: [
      { kind: 'officer-active', officerId: 'guanqiu-jian' },
      { kind: 'flag-unset', key: 'wangling-purged' },
    ],
    description:
      'Goguryeo had raided the Liaodong border while Wei was busy elsewhere; now Wei is not busy. Guanqiu Jian goes out from Xuantu with ten thousand, breaks the Goguryeo king twice, storms his capital at Wandu and burns it, then splits his force and runs the king down through Okjeo a thousand li further, to where the officers report that the land stops and there is only sea. He has the campaign cut into a stone on the spot and comes home. The frontier is quiet for forty years — and the general who made it quiet is the same man who will raise Huainan against the Sima ten years later, and lose.',
    descriptionZh:
      '正始五年,幽州刺史毌丘儉以高句麗數侵叛,督步騎萬人出玄菟,從諸道討之。句麗王宮將步騎二萬人進軍沸流水上,大戰梁口,宮連破走。儉遂束馬懸車,以登丸都,屠其所都,斬獲首虜以千數。\n\n六年復征之,宮遂奔買溝。儉遣玄菟太守王頎追之,過沃沮千有餘里,至肅慎氏南界,刻石紀功,刊丸都之山,銘不耐之城 —— 東垂四十年不聞兵革。而十年之後,舉淮南之兵反司馬者,亦此人也。',
    effects: [
      { kind: 'officer-loyalty', officerId: 'guanqiu-jian', delta: 14 },
      { kind: 'city-loyalty', cityId: 'xiangping', delta: 12 },
      { kind: 'city-defense', cityId: 'xiangping', delta: 10 },
      { kind: 'flag', key: 'goguryeo-broken' },
    ],
    mood: 'martial',
  },

  /* ════════════════════════════════════════════════════════════════════
     戰國 · 通用場面(2026-08-09)

     為什麼要有這一批:十四張戰國盤**一條事件都不會演**。實測
     `scenario-report scn-ws-changping 200 4`,四輪兩百回合,觸發清單完全是空的
     —— 不是薄,是徹底的空白。楚漢的鉅鹿/還定三秦/彭城/井陘、隋唐的淺水原/
     柏壁/安史也一樣(21 張外傳盤全空)。

     成因:三國那一百八十餘條事件的守衛全是 `officer-alive: cao-cao` 這一類,
     而戰國盤上沒有曹操 —— `findFiringEventIn` 查不到人就回 false。
     **這個天然隔離是好的**,結果是戰國那一側從來沒有人往裡面放東西。

     兩個寫這一批必須先知道的事實:

     1. **年份軸是借三國的**(`startDate.year = 178`),所以窗口寫 178–192,
        不是 -260。鎖住它的不是年份,是「只有那條線才有的人」。
     2. **十四張戰國盤共用同一個人物池** —— 154 人在每一張盤上都在場
        (多數 forceId=null 在野)。於是 `officer-alive` 擋得住三國線,
        **擋不住戰國盤彼此**。所以這一批寫的是「戰國時代都可能發生」的場面;
        某一戰自己的鏈(長平、馬陵、即墨)另綁 `chain-xxx` 逐盤寫。

     君主 id 因盤而異,寫 chooserRulerId 前查過覆蓋面:
     秦昭襄王 10 張、趙武靈王 8、魏惠王 12、齊宣王 9、燕昭王 13、楚懷王 12、
     韓昭侯 14。史實正確但只有一兩張盤的(秦孝公、趙惠文王),照樣寫它們 ——
     其餘盤自動走第一項(史實線),不會壞。
     ════════════════════════════════════════════════════════════════════ */
  {
    id: 'evt-ws-simu-lixin',
    name: { en: 'The Pole at the South Gate', zh: '徙木立信' },
    yearMin: 178,
    yearMax: 190,
    requires: [
      { kind: 'officer-alive', officerId: 'hist-shang-yang' },
      { kind: 'flag-unset', key: 'ws-shangyang-law' },
    ],
    description:
      'The new statutes are drafted and not yet promulgated, because nobody believes the government does what it says. So a pole thirty feet long is set at the south gate of the market and it is announced that whoever moves it to the north gate gets ten pieces of gold. Nobody touches it. The reward is raised to fifty. One man moves it, out of curiosity as much as anything, and is paid fifty on the spot. Then the statutes go out. A year later the heir breaks one of them; the heir cannot be punished, so his tutor is branded and his guardian has his nose cut off, and after that nobody in Qin asks whether the law means it.',
    descriptionZh:
      '令既具,未布,恐民之不信,乃立三丈之木於國都市南門,'
      + '募民有能徙置北門者予十金。民怪之,莫敢徙。復曰:「能徙者予五十金。」'
      + '有一人徙之,輒予五十金,以明不欺。卒下令。\n\n'
      + '令行於民期年,秦民之國都言初令之不便者以千數。'
      + '於是太子犯法。衛鞅曰:「法之不行,自上犯之。」將法太子。'
      + '太子,君嗣也,不可施刑,刑其傅公子虔,黥其師公孫賈。'
      + '明日,秦人皆趨令。行之十年,秦民大說,道不拾遺,山無盜賊,'
      + '家給人足,民勇於公戰,怯於私鬥,鄉邑大治。',
    effects: [],
    chooserRulerId: 'hist-qin-xiaogong',
    choices: [
      {
        id: 'enforce',
        label: { zh: '法之不行,自上犯之 —— 刑其傅,黥其師', en: 'The law fails from the top: brand the tutor' },
        effects: [
          { kind: 'city-loyalty', cityId: 'changan', delta: 16 },
          { kind: 'city-troops-multiplier', cityId: 'changan', multiplier: 1.15 },
          { kind: 'officer-loyalty', officerId: 'hist-shang-yang', delta: 15 },
          { kind: 'flag', key: 'ws-shangyang-law' },
        ],
      },
      {
        id: 'spare',
        label: { zh: '太子,君嗣也 —— 此事作罷', en: 'The heir is the heir; let it go' },
        effects: [
          { kind: 'city-loyalty', cityId: 'changan', delta: -10 },
          { kind: 'officer-loyalty', officerId: 'hist-shang-yang', delta: -20 },
          { kind: 'flag', key: 'ws-shangyang-law' },
        ],
      },
    ],
    mood: 'auspicious',
  },
  {
    id: 'evt-ws-hufu-qishe',
    name: { en: 'Nomad Dress and Mounted Archery', zh: '胡服騎射' },
    yearMin: 178,
    yearMax: 190,
    requires: [
      { kind: 'officer-alive', officerId: 'hist-zhao-wuling' },
      { kind: 'flag-unset', key: 'ws-hufu' },
    ],
    description:
      'The proposal is that the army put away its chariots and its long court robes and dress like the people it keeps losing to: short jacket, trousers, boots, and shoot from the saddle. The objection is not military. It is that the robes of the central states are what makes them the central states, and that a king who dresses his men like Hu is announcing the end of something. The king says: a garment is for wearing and a rule is for the work it does, and a sage does not tie the present to the customs of the dead.',
    descriptionZh:
      '王曰:「今吾將胡服騎射以教百姓,而世必議寡人矣。」'
      + '公子成不朝,曰:「中國者,蓋聰明徇智之所居也,萬物財用之所聚也,'
      + '賢聖之所教也,仁義之所施也……而今王舍此而襲遠方之服,'
      + '變古之教,易古之道,逆人之心,臣願王孰圖之也。」\n\n'
      + '王曰:「聖人觀鄉而順宜,因事而制禮,所以利其民而厚其國也。'
      + '……故禮世不必一其道,便國不必法古。」\n\n'
      + '遂胡服。招騎射,略中山地,北至燕、代,西至雲中、九原。',
    effects: [],
    chooserRulerId: 'hist-zhao-wuling',
    choices: [
      {
        id: 'reform',
        label: { zh: '便國不必法古 —— 遂胡服騎射', en: 'What serves the state need not follow antiquity' },
        effects: [
          { kind: 'city-troops-multiplier', cityId: 'ye', multiplier: 1.2 },
          { kind: 'city-troops-multiplier', cityId: 'yanmen', multiplier: 1.3 },
          { kind: 'city-defense', cityId: 'yanmen', delta: 15 },
          { kind: 'officer-loyalty', officerId: 'hist-li-mu', delta: 10 },
          { kind: 'flag', key: 'ws-hufu' },
        ],
      },
      {
        id: 'keep',
        label: { zh: '從公子成之議,仍用車戰', en: 'Heed the objection; keep the chariots' },
        effects: [
          { kind: 'city-loyalty', cityId: 'ye', delta: 10 },
          { kind: 'city-troops-multiplier', cityId: 'yanmen', multiplier: 0.9 },
          { kind: 'flag', key: 'ws-hufu' },
        ],
      },
    ],
    mood: 'martial',
  },
  {
    id: 'evt-ws-wanbi',
    name: { en: 'The Jade Returns Whole', zh: '完璧歸趙' },
    yearMin: 179,
    yearMax: 190,
    requires: [
      { kind: 'officer-alive', officerId: 'hist-lin-xiangru' },
      { kind: 'flag-unset', key: 'ws-wanbi' },
    ],
    description:
      'Qin offers fifteen cities for the Heshi jade, which everyone understands to mean that Qin will take the jade. A retainer named Lin Xiangru carries it west, sees the king pass it round his consorts without a word about the cities, and says there is a flaw in it that he must point out. With the jade back in his hands he backs against a pillar, his hair standing up under his cap, and says that if he is pressed his head and the jade go into the pillar together. He then sends it home by night with a servant in plain clothes, and stays to be executed. Qin does not execute him, because killing him would only prove the point.',
    descriptionZh:
      '秦昭王聞趙得和氏璧,使人遺趙王書,願以十五城請易璧。'
      + '趙王與大將軍廉頗諸大臣謀:欲予秦,秦城恐不可得,徒見欺;'
      + '欲勿予,即患秦兵之來。計未定,求人可使報秦者,未得。\n\n'
      + '藺相如奉璧西入秦。秦王坐章臺見相如,相如奉璧奏秦王。'
      + '秦王大喜,傳以示美人及左右,左右皆呼萬歲 ——'
      + '相如視秦王無意償趙城,乃前曰:「璧有瑕,請指示王。」王授璧。\n\n'
      + '相如因持璧卻立,倚柱,怒髮上衝冠,曰:'
      + '「大王必欲急臣,臣頭今與璧俱碎於柱矣!」'
      + '……乃使其從者衣褐,懷其璧,從徑道亡,歸璧於趙。',
    effects: [
      { kind: 'officer-loyalty', officerId: 'hist-lin-xiangru', delta: 18 },
      { kind: 'city-loyalty', cityId: 'ye', delta: 10 },
      { kind: 'flag', key: 'ws-wanbi' },
    ],
    mood: 'auspicious',
  },
  {
    id: 'evt-ws-fujing',
    name: { en: 'The Bramble on His Back', zh: '負荊請罪' },
    yearMin: 180,
    yearMax: 191,
    requires: [
      { kind: 'officer-alive', officerId: 'hist-lian-po' },
      { kind: 'officer-alive', officerId: 'hist-lin-xiangru' },
      { kind: 'flag-set', key: 'ws-wanbi' },
      { kind: 'flag-unset', key: 'ws-fujing' },
    ],
    description:
      'Lian Po, who has taken cities and cut down armies, is placed below a man who talked his way through two embassies, and says publicly that he will humiliate him when he sees him. Lin Xiangru stops going to court and turns his carriage down side streets. His own retainers ask to leave, ashamed of him. He asks them: who is more frightening, the king of Qin or General Lian? Then why does Qin not attack Zhao? Because the two of us are here. Two tigers fighting means one of us dies, and that is the day Qin comes. Lian Po hears of it, strips to the waist, has a bramble rod tied on his back, and goes to the gate.',
    descriptionZh:
      '既罷歸國,以相如功大,拜為上卿,位在廉頗之右。'
      + '廉頗曰:「我為趙將,有攻城野戰之大功,而藺相如徒以口舌為勞,'
      + '而位居我上,且相如素賤人,吾羞,不忍為之下!」宣言曰:'
      + '「我見相如,必辱之。」\n\n'
      + '相如聞,不肯與會,每朝時常稱病,不欲與廉頗爭列;'
      + '出,望見廉頗,引車避匿。舍人相與諫,請辭去。\n\n'
      + '相如曰:「夫以秦王之威,而相如廷叱之,辱其群臣,'
      + '相如雖駑,獨畏廉將軍哉?顧吾念之,強秦之所以不敢加兵於趙者,'
      + '徒以吾兩人在也。今兩虎共鬥,其勢不俱生。'
      + '吾所以為此者,以先國家之急而後私讎也。」\n\n'
      + '廉頗聞之,肉袒負荊,因賓客至藺相如門謝罪,'
      + '曰:「鄙賤之人,不知將軍寬之至此也!」卒相與驩,為刎頸之交。',
    effects: [
      { kind: 'officer-loyalty', officerId: 'hist-lian-po', delta: 15 },
      { kind: 'officer-loyalty', officerId: 'hist-lin-xiangru', delta: 15 },
      { kind: 'city-defense', cityId: 'ye', delta: 15 },
      { kind: 'city-loyalty', cityId: 'ye', delta: 12 },
      { kind: 'flag', key: 'ws-fujing' },
    ],
    mood: 'auspicious',
  },
  {
    id: 'evt-ws-yuanjiao',
    name: { en: 'Befriend the Far and Attack the Near', zh: '遠交近攻' },
    yearMin: 180,
    yearMax: 190,
    requires: [
      { kind: 'officer-alive', officerId: 'hist-fan-ju' },
      { kind: 'flag-unset', key: 'ws-yuanjiao' },
    ],
    description:
      'Fan Ju tells the king that the standing policy has it backwards: Qin has been crossing Han and Wei to attack Qi, and even when it wins the ground cannot be held, because it does not touch Qin. Be friendly with the distant states and attack the ones you border. Take an inch and the inch is yours; take a foot and the foot is yours. And begin with Han and Wei, because whoever holds them holds the middle of the realm.',
    descriptionZh:
      '范雎曰:「王不如遠交而近攻,得寸則王之寸,得尺亦王之尺也。'
      + '今釋此而遠攻,不亦繆乎?……夫韓、魏,中國之處而天下之樞也。'
      + '王其欲霸,必親中國以為天下樞,以威楚、趙。'
      + '楚彊則附趙,趙彊則附楚,楚、趙皆附,齊必懼矣。」\n\n'
      + '王曰:「善。」乃拜范雎為客卿,謀兵事 —— 秦之東出,自此有次第。',
    effects: [],
    chooserRulerId: 'hist-qin-zhaoxiang',
    choices: [
      {
        id: 'adopt',
        label: { zh: '得寸則王之寸 —— 用其策', en: 'Take the inch and keep it: adopt the policy' },
        effects: [
          { kind: 'officer-loyalty', officerId: 'hist-fan-ju', delta: 15 },
          { kind: 'city-troops-multiplier', cityId: 'changan', multiplier: 1.12 },
          { kind: 'city-defense', cityId: 'luoyang', delta: -12 },
          { kind: 'city-defense', cityId: 'xuchang', delta: -12 },
          { kind: 'flag', key: 'ws-yuanjiao' },
        ],
      },
      {
        id: 'keep-old',
        label: { zh: '仍越韓魏以攻齊', en: 'Go on crossing Han and Wei to strike Qi' },
        effects: [
          { kind: 'city-defense', cityId: 'linzi', delta: -15 },
          { kind: 'force-gold-ruler', rulerOfficerId: 'hist-qin-zhaoxiang', delta: -4000 },
          { kind: 'officer-loyalty', officerId: 'hist-fan-ju', delta: -12 },
          { kind: 'flag', key: 'ws-yuanjiao' },
        ],
      },
    ],
    mood: 'martial',
  },
  {
    id: 'evt-ws-hezong',
    name: { en: 'The Vertical Alliance', zh: '合縱' },
    yearMin: 179,
    yearMax: 190,
    requires: [
      { kind: 'officer-alive', officerId: 'hist-su-qin' },
      { kind: 'flag-unset', key: 'ws-hezong' },
    ],
    description:
      'Su Qin walks the six courts with one argument, adjusted at each stop: your land together is five times Qin, your soldiers ten times Qin, and you are being taken one at a time because each of you would rather serve the west than stand next to your neighbour. He comes out of it holding the chancellor seals of all six states at once, and for fifteen years Qin does not come through the pass.',
    descriptionZh:
      '蘇秦說六國曰:「臣竊以天下之地圖案之,諸侯之地五倍於秦,'
      + '料度諸侯之卒十倍於秦,六國并力西鄉而攻秦,秦必破矣。'
      + '今西面而事之,見臣於秦。夫破人之與破於人也,'
      + '臣人之與臣於人也,豈可同日而言之哉!」\n\n'
      + '於是六國從合而并力焉。蘇秦為從約長,并相六國。'
      + '……秦兵不敢闚函谷關十五年。',
    effects: [
      { kind: 'city-defense', cityId: 'luoyang', delta: 14 },
      { kind: 'city-defense', cityId: 'ye', delta: 12 },
      { kind: 'city-defense', cityId: 'chenliu', delta: 12 },
      { kind: 'city-defense', cityId: 'linzi', delta: 10 },
      { kind: 'city-defense', cityId: 'jiangling', delta: 10 },
      { kind: 'officer-loyalty', officerId: 'hist-su-qin', delta: 18 },
      { kind: 'flag', key: 'ws-hezong' },
    ],
    mood: 'auspicious',
  },
  {
    id: 'evt-ws-lianheng',
    name: { en: 'Six Hundred Li of Shangyu', zh: '連橫·商於六百里' },
    yearMin: 180,
    yearMax: 191,
    requires: [
      { kind: 'officer-alive', officerId: 'hist-zhang-yi' },
      { kind: 'officer-alive', officerId: 'hist-chu-huaiwang' },
      { kind: 'flag-unset', key: 'ws-lianheng' },
    ],
    description:
      'Zhang Yi comes to Chu and offers six hundred li of Shangyu if Chu will break with Qi. Chen Zhen says: take the land first and break afterwards. The king breaks with Qi first, sends an officer to take delivery, and Zhang Yi says he promised six li of his own fief, not six hundred of the state. Chu goes to war over it and loses eighty thousand men and Hanzhong. Later, offered Zhang Yi in exchange for land, the king takes him — and then lets him go again, having been talked round by his own favourite consort.',
    descriptionZh:
      '張儀說楚王曰:「大王誠能聽臣,閉關絕約於齊,'
      + '臣請獻商於之地六百里。」楚王大說而許之。'
      + '陳軫諫曰:「臣見商於之地不可得,而患必至也。」王曰:'
      + '「吾事善矣!子其弭口無言,以待吾事。」\n\n'
      + '楚使者既絕齊,張儀曰:「儀有奉邑六里,願以獻大王左右。」'
      + '使者曰:「臣受令於王,以商於之地六百里,不聞六里。」'
      + '……楚王大怒,發兵而攻秦,大敗於丹陽,斬首八萬,遂取漢中。',
    effects: [],
    chooserRulerId: 'hist-chu-huaiwang',
    choices: [
      {
        id: 'break-first',
        label: { zh: '閉關絕約於齊,先與秦交', en: 'Break with Qi first and take Qin at its word' },
        effects: [
          { kind: 'city-troops-multiplier', cityId: 'jiangling', multiplier: 0.82 },
          { kind: 'city-defense', cityId: 'hanzhong', delta: -20 },
          { kind: 'mandate-ruler', rulerOfficerId: 'hist-chu-huaiwang', delta: -8 },
          { kind: 'flag', key: 'ws-lianheng' },
        ],
      },
      {
        id: 'land-first',
        label: { zh: '從陳軫之諫:先受地,而後絕齊', en: 'Heed Chen Zhen: take the land first, break after' },
        effects: [
          { kind: 'city-defense', cityId: 'jiangling', delta: 12 },
          { kind: 'mandate-ruler', rulerOfficerId: 'hist-chu-huaiwang', delta: 6 },
          { kind: 'officer-loyalty', officerId: 'hist-qu-yuan', delta: 12 },
          { kind: 'flag', key: 'ws-lianheng' },
        ],
      },
    ],
    mood: 'ominous',
  },
  {
    id: 'evt-ws-jixia',
    name: { en: 'The Academy at the Ji Gate', zh: '稷下學宮' },
    yearMin: 179,
    yearMax: 191,
    requires: [
      { kind: 'officer-alive', officerId: 'hist-zou-yan' },
      { kind: 'flag-unset', key: 'ws-jixia' },
    ],
    description:
      'Below the Ji gate at Linzi the state keeps several hundred men in mansions on the main avenue, ranked as senior officers, who hold no office and are not required to govern: they argue. Zou Yan on the five phases, Chunyu Kun on everything, Shen Dao and Tian Pian and Huan Yuan on the way and its power, and later Xunzi three times as libationer. It is the largest single concentration of argument in the ancient world, and it is funded by the state that will do the least with it.',
    descriptionZh:
      '齊宣王喜文學游說之士,自如騶衍、淳于髡、田駢、接子、慎到、環淵之徒,'
      + '七十六人,皆賜列第,為上大夫,不治而議論。'
      + '是以齊稷下學士復盛,且數百千人。\n\n'
      + '……天下之學術,半在此城。而其後四十餘年不受兵,'
      + '亦四十餘年不修備 —— 這座城裡辯得最多的事,'
      + '恰恰不是它自己最該想的那一件。',
    effects: [],
    chooserRulerId: 'hist-qi-xuanwang',
    choices: [
      {
        id: 'endow',
        label: { zh: '賜列第,為上大夫,不治而議論', en: 'Mansions and rank, and no duties but argument' },
        effects: [
          { kind: 'city-loyalty', cityId: 'linzi', delta: 18 },
          { kind: 'officer-loyalty', officerId: 'hist-zou-yan', delta: 15 },
          { kind: 'officer-loyalty', officerId: 'hist-xunzi', delta: 15 },
          { kind: 'force-gold-ruler', rulerOfficerId: 'hist-qi-xuanwang', delta: -3000 },
          { kind: 'flag', key: 'ws-jixia' },
        ],
      },
      {
        id: 'spend-on-arms',
        label: { zh: '罷稷下之廩,以其費繕甲兵', en: 'Close the stipends and spend it on armour' },
        effects: [
          { kind: 'city-troops-multiplier', cityId: 'linzi', multiplier: 1.18 },
          { kind: 'city-defense', cityId: 'linzi', delta: 14 },
          { kind: 'city-loyalty', cityId: 'linzi', delta: -12 },
          { kind: 'flag', key: 'ws-jixia' },
        ],
      },
    ],
    mood: 'auspicious',
  },
  {
    id: 'evt-ws-ximenbao',
    name: { en: 'The Bride for the River Lord', zh: '西門豹治鄴' },
    yearMin: 178,
    yearMax: 190,
    requires: [
      { kind: 'officer-alive', officerId: 'hist-ximen-bao' },
      { kind: 'flag-unset', key: 'ws-ximenbao' },
    ],
    description:
      'At Ye the elders and the shamaness have been collecting several hundred thousand a year to marry a girl to the river god, spending twenty or thirty thousand on the wedding and keeping the rest, and families with daughters have been leaving. The new magistrate attends the ceremony and says the bride is not pretty enough — would the shamaness go and explain the delay to the river lord? She is put in. After a while: she is slow, send an apprentice. Then another. Then, since women cannot manage it, would the senior elder go? By then everyone is on their knees with their foreheads on the ground. Afterwards he cuts twelve canals from the river, and the fields of Ye are watered ever since.',
    descriptionZh:
      '鄴三老、廷掾常歲賦斂百姓,收取其錢得數百萬,'
      + '用其二三十萬為河伯娶婦,而與祝巫共分其餘錢持歸。'
      + '當其時,巫行視人家女好者,曰:「是當為河伯婦。」'
      + '……以故多持女遠逃亡,城中益空無人。\n\n'
      + '西門豹至,曰:「至為河伯娶婦時,願三老、巫祝、父老送女河上,'
      + '幸來告語之,吾亦往送女。」及其時,豹視其女曰:'
      + '「是女子不好,煩大巫嫗為入報河伯,得更求好女,後日送之。」'
      + '即使吏卒共抱大巫嫗投之河中。有頃,曰:「巫嫗何久也?弟子趣之!」'
      + '復以弟子一人投河中。……凡投三弟子。'
      + '豹曰:「巫嫗、弟子是女子也,不能白事,煩三老為入白之。」復投三老河中。\n\n'
      + '皆叩頭,叩頭且破,額血流地,色如死灰。'
      + '自是以後,不敢復言為河伯娶婦。'
      + '豹即發民鑿十二渠,引河水灌民田,田皆溉。',
    effects: [
      { kind: 'city-loyalty', cityId: 'ye', delta: 20 },
      { kind: 'city-food', cityId: 'ye', delta: 30000 },
      { kind: 'officer-loyalty', officerId: 'hist-ximen-bao', delta: 15 },
      { kind: 'flag', key: 'ws-ximenbao' },
    ],
    mood: 'auspicious',
  },
  {
    id: 'evt-ws-jiming',
    name: { en: 'The Cock-Crow and the Dog-Thief', zh: '雞鳴狗盜' },
    yearMin: 181,
    yearMax: 191,
    requires: [
      { kind: 'officer-alive', officerId: 'hist-mengchang-jun' },
      { kind: 'flag-unset', key: 'ws-jiming' },
    ],
    description:
      'The lord of Mengchang keeps three thousand retainers, taking anyone who comes, and is mocked for the quality of them. Detained in Qin and about to be killed, he sends to the king favourite for help; she wants the white fox robe, which he has already presented to the king. One of the useless retainers goes through a dog-hole into the treasury and steals it back. They get out at night and reach the pass, which does not open until the cock crows. Another useless retainer crows, every cock in the district answers, the gate opens, and they are through before the pursuit arrives.',
    descriptionZh:
      '孟嘗君在薛,招致諸侯賓客及亡人有罪者,皆歸孟嘗君 ——'
      + '食客數千人,無貴賤一與文等。\n\n'
      + '入秦,昭王囚之,欲殺。孟嘗君使人抵昭王幸姬求解,'
      + '姬曰:「妾願得君狐白裘。」此時孟嘗君有一狐白裘,直千金,'
      + '天下無雙,入秦獻之昭王,更無他裘。'
      + '客有能為狗盜者,曰:「臣能得狐白裘。」乃夜為狗,'
      + '以入秦宮臧中,取所獻狐白裘至,以獻秦王幸姬 —— 姬為言,得出。\n\n'
      + '夜半至函谷關。秦昭王後悔出孟嘗君,求之已去,即使人馳傳逐之。'
      + '關法:雞鳴而出客。客之居下坐者有能為雞鳴,而雞盡鳴,遂發傳出。'
      + '出如食頃,秦追果至關,已後孟嘗君出,乃還。\n\n'
      + '始孟嘗君列此二人於賓客,賓客盡羞之;及此,莫不服。',
    effects: [
      { kind: 'officer-loyalty', officerId: 'hist-mengchang-jun', delta: 15 },
      { kind: 'city-loyalty', cityId: 'linzi', delta: 12 },
      { kind: 'flag', key: 'ws-jiming' },
    ],
    mood: 'auspicious',
  },
  {
    id: 'evt-ws-qihuo',
    name: { en: 'A Rare Piece of Merchandise', zh: '奇貨可居' },
    yearMin: 182,
    yearMax: 191,
    requires: [
      { kind: 'officer-alive', officerId: 'hist-lu-buwei' },
      { kind: 'flag-unset', key: 'ws-qihuo' },
    ],
    description:
      'A merchant of Yangdi doing business in Handan sees a Qin prince being kept there as a hostage, one of more than twenty sons, by a mother nobody favours, living poorly and going nowhere. He goes home and asks his father what the return is on farming. Ten to one. On pearls and jade? A hundred. On establishing a sovereign and settling a state? Beyond calculation. He spends five hundred in gold on the prince and another five hundred on gifts for the childless principal consort of the heir, and buys, in the end, an adoption.',
    descriptionZh:
      '呂不韋賈邯鄲,見秦質子異人,歸而謂父曰:'
      + '「耕田之利幾倍?」曰:「十倍。」'
      + '「珠玉之贏幾倍?」曰:「百倍。」'
      + '「立國家之主贏幾倍?」曰:「無數。」\n\n'
      + '曰:「今力田疾作,不得煖衣餘食;今建國立君,澤可以遺世 —— 願往事之。」'
      + '乃以五百金與子楚,為進用,結賓客;'
      + '而復以五百金買奇物玩好,自奉而西游秦,'
      + '求見華陽夫人姊,而皆以其物獻華陽夫人。\n\n'
      + '此局之後,秦之嗣君,由一個商人挑定。',
    effects: [
      { kind: 'officer-loyalty', officerId: 'hist-lu-buwei', delta: 15 },
      { kind: 'force-gold-ruler', rulerOfficerId: 'hist-qin-zhaoxiang', delta: 5000 },
      { kind: 'city-loyalty', cityId: 'changan', delta: -8 },
      { kind: 'flag', key: 'ws-qihuo' },
    ],
    mood: 'mystic',
  },
  {
    id: 'evt-ws-limu-border',
    name: { en: 'Li Mu Will Not Come Out', zh: '李牧守邊' },
    yearMin: 181,
    yearMax: 191,
    requires: [
      { kind: 'officer-alive', officerId: 'hist-li-mu' },
      { kind: 'flag-unset', key: 'ws-limu' },
    ],
    description:
      'For years he sets his own officers, spends the market taxes of the district on his troops, kills several oxen a day for them, drills them at riding and shooting, mans the beacons carefully, sends out many scouts — and has a standing order that when the Xiongnu come in, everyone goes inside the walls, and any man who goes out to fight will be beheaded. Both his own soldiers and the Xiongnu conclude he is a coward. He is recalled; his replacement fights every raid and loses. He is sent back and resumes doing nothing. Then, one day, he puts fifteen hundred thousand chariots, thirteen thousand horse, fifty thousand picked infantry and a hundred thousand archers in the field at once, opens with a deliberate rout of his own herdsmen as bait, and destroys over a hundred thousand Xiongnu cavalry in a single day.',
    descriptionZh:
      '李牧者,趙之北邊良將也。常居代、雁門,備匈奴。'
      + '以便宜置吏,市租皆輸入莫府,為士卒費。'
      + '日擊數牛饗士,習騎射,謹烽火,多間諜,厚遇戰士。為約曰:'
      + '「匈奴即入盜,急入收保,有敢捕虜者斬。」'
      + '匈奴每入,烽火謹,輒入收保,不敢戰。如是數歲,亦不亡失。\n\n'
      + '然匈奴以李牧為怯,雖趙邊兵亦以為吾將怯。趙王讓之,牧如故。'
      + '王怒,召之,使他人代將。歲餘,匈奴每來,出戰,'
      + '出戰數不利,失亡多,邊不得田畜。復請李牧 —— 牧曰:'
      + '「王必用臣,臣如前,乃敢奉令。」王許之。\n\n'
      + '乃具選車得千三百乘,選騎得萬三千匹,百金之士五萬人,彀者十萬人,'
      + '悉勒習戰。大縱畜牧,人民滿野。匈奴小入,詳北不勝,以數千人委之。'
      + '單于聞之,大率眾來入。李牧多為奇陳,張左右翼擊之,'
      + '大破殺匈奴十餘萬騎 —— 其後十餘歲,匈奴不敢近趙邊城。',
    effects: [
      { kind: 'officer-loyalty', officerId: 'hist-li-mu', delta: 18 },
      { kind: 'city-troops-multiplier', cityId: 'yanmen', multiplier: 1.25 },
      { kind: 'city-defense', cityId: 'yanmen', delta: 20 },
      { kind: 'city-food', cityId: 'yanmen', delta: 15000 },
      { kind: 'flag', key: 'ws-limu' },
    ],
    mood: 'martial',
  },
  {
    id: 'evt-ws-quyuan',
    name: { en: 'The Whole World Is Muddy', zh: '舉世皆濁' },
    yearMin: 181,
    yearMax: 192,
    requires: [
      { kind: 'officer-alive', officerId: 'hist-qu-yuan' },
      { kind: 'flag-set', key: 'ws-lianheng' },
      { kind: 'flag-unset', key: 'ws-quyuan' },
    ],
    description:
      'Exiled to the river country, he walks the bank reciting, gaunt. A fisherman asks whether he is not the Master of the Three Wards, and what he is doing here. Because the whole world is muddy and I alone am clear; everyone is drunk and I alone am sober, and so I was sent away. The fisherman says: a sage is not held fast by things but moves with the age. If the world is muddy, why not stir the silt and raise the waves with it? He answers that a man who has just washed his hair flicks his cap before putting it on, and that he would sooner go into the river and be buried in the bellies of fish than let what is white in him take the dust of the world. Then he writes one more poem and takes a stone into the Miluo.',
    descriptionZh:
      '屈原至於江濱,被髮行吟澤畔,顏色憔悴,形容枯槁。'
      + '漁父見而問之曰:「子非三閭大夫歟?何故而至此?」'
      + '屈原曰:「舉世混濁而我獨清,眾人皆醉而我獨醒,是以見放。」\n\n'
      + '漁父曰:「夫聖人者,不凝滯於物而能與世推移。'
      + '舉世混濁,何不隨其流而揚其波?眾人皆醉,何不餔其糟而啜其醨?'
      + '何故懷瑾握瑜而自令見放為?」\n\n'
      + '屈原曰:「吾聞之,新沐者必彈冠,新浴者必振衣。'
      + '人又誰能以身之察察,受物之汶汶者乎!'
      + '寧赴常流而葬乎江魚腹中耳,又安能以皓皓之白而蒙世俗之溫蠖乎!」\n\n'
      + '乃作《懷沙》之賦。於是懷石遂自沉汨羅以死。',
    effects: [
      { kind: 'officer-status', officerId: 'hist-qu-yuan', status: 'dead' },
      { kind: 'city-loyalty', cityId: 'jiangling', delta: -14 },
      { kind: 'mandate-ruler', rulerOfficerId: 'hist-chu-huaiwang', delta: -6 },
      { kind: 'flag', key: 'ws-quyuan' },
    ],
    mood: 'somber',
  },

  /* ════════════════════════════════════════════════════════════════════
     楚漢 · 通用場面(2026-08-09)

     同戰國那一批的成因與寫法:鉅鹿、還定三秦、彭城、井陘四張盤原本一條事件
     都不會演(濰水與垓下有自己的鏈,其餘沒有)。守衛用 `hist-` 人物,
     年份窗口散在 178–187 讓它們不要擠在開局頭半年。
     ════════════════════════════════════════════════════════════════════ */
  {
    id: 'evt-ch-pofu',
    name: { en: 'Break the Cauldrons, Sink the Boats', zh: '破釜沉舟' },
    yearMin: 178,
    yearMax: 186,
    requires: [
      { kind: 'officer-alive', officerId: 'hist-xiang-yu' },
      { kind: 'flag-unset', key: 'ch-pofu' },
    ],
    description:
      'The relief army has sat forty-six days without moving because its commander thinks it better to let Qin and Zhao wear each other out. Xiang Yu kills him in his tent, takes the army across the river, sinks every boat, smashes every cooking pot, burns the huts and issues three days of rations, so that the men understand there is nothing behind them. Nine engagements. When it is over the other lords come to his gate on their knees, and none of them dares look up.',
    descriptionZh:
      '宋義行至安陽,留四十六日不進。羽曰:'
      + '「今歲饑民貧,士卒食芋菽,軍無見糧,乃飲酒高會,'
      + '不引兵渡河因趙食,與趙并力攻秦,乃曰『承其敝』。'
      + '夫以秦之彊,攻新造之趙,其勢必舉趙。趙舉而秦彊,何敝之承!」'
      + '晨朝上將軍宋義,即其帳中斬宋義頭。\n\n'
      + '乃悉引兵渡河,皆沉船,破釜甑,燒廬舍,持三日糧,'
      + '以示士卒必死,無一還心。於是至則圍王離,與秦軍遇,九戰,絕其甬道,'
      + '大破之。當是時,楚兵冠諸侯,諸侯軍救鉅鹿下者十餘壁,莫敢縱兵。\n\n'
      + '及楚擊秦,諸將皆從壁上觀。楚戰士無不一以當十,'
      + '楚兵呼聲動天,諸侯軍無不人人惴恐。於是已破秦軍,'
      + '項羽召見諸侯將,入轅門,無不膝行而前,莫敢仰視。',
    effects: [
      { kind: 'officer-loyalty', officerId: 'hist-xiang-yu', delta: 20 },
      { kind: 'city-troops-multiplier', cityId: 'pengcheng', multiplier: 1.2 },
      { kind: 'mandate-ruler', rulerOfficerId: 'hist-xiang-yu', delta: 12 },
      { kind: 'flag', key: 'ch-pofu' },
    ],
    mood: 'martial',
  },
  {
    id: 'evt-ch-yuefa',
    name: { en: 'Three Articles and No More', zh: '約法三章' },
    yearMin: 178,
    yearMax: 186,
    requires: [
      { kind: 'officer-alive', officerId: 'hist-liu-bang' },
      { kind: 'flag-unset', key: 'ch-yuefa' },
    ],
    description:
      'First into the passes, he summons the elders and men of standing of the districts and tells them they have suffered long enough under the Qin statutes — criticise the government and your clan is wiped out, talk in private and you are executed in the market. He is here by agreement to be king of the passes, and he is repealing all of it. Three articles: a killer dies, a man who injures or steals is dealt with according to the offence. He also refuses the treasuries, seals the palaces, and withdraws to camp. The people of Qin bring beef and wine and are afraid only that he will not stay.',
    descriptionZh:
      '沛公西入咸陽,諸將皆爭走金帛財物之府分之,'
      + '蕭何獨先入收秦丞相御史律令圖書藏之。'
      + '沛公欲止宮休舍,樊噲、張良諫,乃封秦重寶財物府庫,還軍霸上。\n\n'
      + '召諸縣父老豪桀曰:「父老苦秦苛法久矣,誹謗者族,偶語者棄市。'
      + '吾與諸侯約,先入關者王之,吾當王關中。'
      + '與父老約,法三章耳:殺人者死,傷人及盜抵罪。餘悉除去秦法。」\n\n'
      + '秦人大喜,爭持牛羊酒食獻饗軍士。沛公又讓不受,曰:'
      + '「倉粟多,非乏,不欲費人。」人又益喜,唯恐沛公不為秦王。',
    effects: [],
    chooserRulerId: 'hist-liu-bang',
    choices: [
      {
        id: 'three-articles',
        label: { zh: '悉除秦法,約法三章', en: 'Repeal it all; three articles only' },
        effects: [
          { kind: 'city-loyalty', cityId: 'changan', delta: 22 },
          { kind: 'city-loyalty', cityId: 'mei', delta: 15 },
          { kind: 'mandate-ruler', rulerOfficerId: 'hist-liu-bang', delta: 12 },
          { kind: 'flag', key: 'ch-yuefa' },
        ],
      },
      {
        id: 'take-the-treasury',
        label: { zh: '止宮休舍,收其府庫', en: 'Stay in the palace and take the treasuries' },
        effects: [
          { kind: 'force-gold-ruler', rulerOfficerId: 'hist-liu-bang', delta: 12000 },
          { kind: 'city-loyalty', cityId: 'changan', delta: -18 },
          { kind: 'mandate-ruler', rulerOfficerId: 'hist-liu-bang', delta: -10 },
          { kind: 'flag', key: 'ch-yuefa' },
        ],
      },
    ],
    mood: 'auspicious',
  },
  {
    id: 'evt-ch-hongmen',
    name: { en: 'The Banquet at Hongmen', zh: '鴻門宴' },
    yearMin: 179,
    yearMax: 186,
    requires: [
      { kind: 'officer-alive', officerId: 'hist-xiang-yu' },
      { kind: 'officer-alive', officerId: 'hist-liu-bang' },
      { kind: 'officer-alive', officerId: 'hist-fan-zeng' },
      { kind: 'flag-set', key: 'ch-yuefa' },
      { kind: 'flag-unset', key: 'ch-hongmen' },
    ],
    description:
      'Fan Zeng has told him three times that the man drank and took women in Shandong and has touched neither since entering the passes, which means his ambition is not small, and that the vapour over his camp is dragon-shaped in five colours, and that he should be killed now. At the banquet Fan Zeng raises his jade ring three times as the signal and gets no answer. Xiang Zhuang dances with a sword; Xiang Bo gets up and dances too, shielding Liu Bang with his body. Fan Kuai comes in through the guards, drinks a gallon standing, eats a raw shoulder of pork off his shield, and lectures the Hegemon-King on how the man who takes the passes should be treated. Liu Bang leaves on the excuse of the latrine and rides for his camp by the back roads.',
    descriptionZh:
      '范增說項羽曰:「沛公居山東時,貪於財貨,好美姬。'
      + '今入關,財物無所取,婦女無所幸,此其志不在小。'
      + '吾令人望其氣,皆為龍虎,成五采,此天子氣也。急擊勿失!」\n\n'
      + '……范增數目項王,舉所佩玉玦以示之者三,項王默然不應。'
      + '范增起,出召項莊,曰:「君王為人不忍。若入前為壽,'
      + '壽畢,請以劍舞,因擊沛公於坐,殺之。」'
      + '項莊拔劍起舞,項伯亦拔劍起舞,常以身翼蔽沛公,莊不得擊。\n\n'
      + '樊噲側其盾以撞,衛士仆地,遂入,披帷西向立,瞋目視項王,'
      + '頭髮上指,目眥盡裂。……項王曰:「壯士!賜之卮酒。」'
      + '則與斗卮酒。噲拜謝,起,立而飲之。\n\n'
      + '坐須臾,沛公起如廁,因招樊噲出,道芷陽間行。'
      + '范增拔劍撞而破之,曰:「唉!豎子不足與謀。奪項王天下者,必沛公也。」',
    effects: [],
    chooserRulerId: 'hist-xiang-yu',
    choices: [
      {
        id: 'let-him-go',
        label: { zh: '默然不應 —— 為人不忍', en: 'Say nothing; the ring is raised three times in vain' },
        effects: [
          { kind: 'officer-loyalty', officerId: 'hist-fan-zeng', delta: -15 },
          { kind: 'mandate-ruler', rulerOfficerId: 'hist-xiang-yu', delta: 5 },
          { kind: 'flag', key: 'ch-hongmen' },
        ],
      },
      {
        id: 'strike',
        label: { zh: '從亞父之計,擊之於坐', en: 'Answer the ring: kill him at the mat' },
        effects: [
          { kind: 'officer-loyalty', officerId: 'hist-fan-zeng', delta: 20 },
          { kind: 'force-troops-multiplier-ruler', rulerOfficerId: 'hist-liu-bang', multiplier: 0.7 },
          { kind: 'mandate-ruler', rulerOfficerId: 'hist-xiang-yu', delta: -10 },
          { kind: 'city-loyalty', cityId: 'changan', delta: -15 },
          { kind: 'flag', key: 'ch-hongmen' },
        ],
      },
    ],
    mood: 'ominous',
  },
  {
    id: 'evt-ch-yuexia-zhuihan',
    name: { en: 'Xiao He Rides After Han Xin', zh: '蕭何月下追韓信' },
    yearMin: 179,
    yearMax: 187,
    requires: [
      { kind: 'officer-alive', officerId: 'hist-han-xin' },
      { kind: 'officer-alive', officerId: 'hist-xiao-he' },
      { kind: 'flag-unset', key: 'ch-zhuihan' },
    ],
    description:
      'Dozens of officers have deserted on the road into Hanzhong. When the chancellor himself goes missing, the king is told and reacts as though he has lost both hands. Two days later Xiao He is back. Why did you run? I did not run, I went after someone who ran. Who? Han Xin. Dozens of officers have deserted and you went after that one — you are lying. Xiao He says: the others are easy to come by; that one is the finest man in the realm and there is not a second. If you mean to be king of Hanzhong and no more, you have no use for him. If you mean to contend for the realm, there is nobody else to discuss it with.',
    descriptionZh:
      '諸將行道亡者數十人。信度何等已數言上,上不我用,即亡。'
      + '何聞信亡,不及以聞,自追之。人有言上曰:「丞相何亡。」'
      + '上大怒,如失左右手。\n\n'
      + '居一二日,何來謁上。上且怒且喜,罵何曰:「若亡,何也?」'
      + '何曰:「臣不敢亡也,臣追亡者。」曰:「若所追者誰?」曰:「韓信也。」'
      + '上復罵曰:「諸將亡者以十數,公無所追;追信,詐也。」\n\n'
      + '何曰:「諸將易得耳。至如信者,國士無雙。'
      + '王必欲長王漢中,無所事信;必欲爭天下,非信無所與計事者。'
      + '顧王策安所決耳。」……王曰:「吾為公以為將。」'
      + '何曰:「雖為將,信必不留。」王曰:「以為大將。」何曰:「幸甚。」\n\n'
      + '……乃擇良日,齋戒,設壇場,具禮。至拜大將,乃韓信也,一軍皆驚。',
    effects: [],
    chooserRulerId: 'hist-liu-bang',
    choices: [
      {
        id: 'altar',
        label: { zh: '擇良日,設壇場,拜為大將', en: 'Pick a day, build the altar, make him marshal' },
        effects: [
          { kind: 'officer-loyalty', officerId: 'hist-han-xin', delta: 25 },
          { kind: 'officer-loyalty', officerId: 'hist-xiao-he', delta: 12 },
          { kind: 'city-troops-multiplier', cityId: 'hanzhong', multiplier: 1.2 },
          { kind: 'flag', key: 'ch-zhuihan' },
        ],
      },
      {
        id: 'a-command',
        label: { zh: '與一將軍而已', en: 'Give him a command and leave it there' },
        effects: [
          { kind: 'officer-loyalty', officerId: 'hist-han-xin', delta: -20 },
          { kind: 'officer-loyalty', officerId: 'hist-xiao-he', delta: -10 },
          { kind: 'flag', key: 'ch-zhuihan' },
        ],
      },
    ],
    mood: 'auspicious',
  },
  {
    id: 'evt-ch-andu-chencang',
    name: { en: 'Repair the Galleries, Cross at Chencang', zh: '明修棧道,暗度陳倉' },
    yearMin: 180,
    yearMax: 187,
    requires: [
      { kind: 'officer-alive', officerId: 'hist-han-xin' },
      { kind: 'flag-set', key: 'ch-zhuihan' },
      { kind: 'flag-unset', key: 'ch-chencang' },
    ],
    description:
      'The plank roads out of Hanzhong were burned on the way in, to show there was no intention of coming back — which is now the problem. Work parties are put on rebuilding them in plain sight, a job of months that Zhang Han watches with satisfaction. The army goes out by the old Chencang road instead. Zhang Han meets it too late, is beaten at Chencang, falls back on Feiqiu, and the three kings of the passes are undone inside a season.',
    descriptionZh:
      '漢王之國,行南鄭,道燒絕所過棧道,以備諸侯盜兵,'
      + '亦示項羽無東意 —— 而今東出,棧道正是難處。\n\n'
      + '信乃使人明修棧道,示以東還之期。章邯聞之而笑,益不為備。'
      + '而漢王用韓信之計,從故道還,襲雍王章邯。'
      + '邯迎擊漢陳倉,雍兵敗,還走;止戰好畤,又復敗,走廢丘。\n\n'
      + '漢王遂定雍地,東至咸陽,引兵圍雍王廢丘,而遣諸將略定隴西、北地、上郡。'
      + '——三秦之地,一季而下。',
    effects: [
      { kind: 'officer-loyalty', officerId: 'hist-han-xin', delta: 15 },
      { kind: 'city-defense', cityId: 'changan', delta: -20 },
      { kind: 'city-troops-multiplier', cityId: 'changan', multiplier: 0.85 },
      { kind: 'city-troops-multiplier', cityId: 'hanzhong', multiplier: 1.15 },
      { kind: 'flag', key: 'ch-chencang' },
    ],
    mood: 'martial',
  },
  {
    id: 'evt-ch-beishui',
    name: { en: 'With the River at Their Backs', zh: '背水一陣' },
    yearMin: 180,
    yearMax: 187,
    requires: [
      { kind: 'officer-alive', officerId: 'hist-han-xin' },
      { kind: 'flag-set', key: 'ch-chencang' },
      { kind: 'flag-unset', key: 'ch-beishui' },
    ],
    description:
      'He sends scouts to find out whether Li Zuoche advice to cut the baggage train on the Jingxing road has been taken. It has not. Only then does he bring the army down. He puts ten thousand across the river with their backs to it, which the Zhao camp watches and laughs at, and sends two thousand light horse with red banners up a side path. When the Zhao army comes out and cannot break the line — because there is nowhere for that line to run — the two thousand ride into the empty camp and change every flag. Afterwards his officers ask what military manual that is in. The manual says put your back to a hill and your front to water. He says: it also says throw them where they will die and they live, and besides, these are men I picked up in the street; if I had not put them somewhere they could not run from, they would all have run.',
    descriptionZh:
      '信使人間視,知其不用廣武君策,還報,則大喜,乃敢引兵遂下。\n\n'
      + '未至井陘口三十里,止舍。夜半傳發,選輕騎二千人,人持一赤幟,'
      + '從間道萆山而望趙軍,誡曰:「趙見我走,必空壁逐我,'
      + '若疾入趙壁,拔趙幟,立漢赤幟。」……乃使萬人先行,出,背水陳。'
      + '趙軍望見而大笑。\n\n'
      + '……趙開壁擊之,大戰良久。於是信、張耳詳棄鼓旗,走水上軍。'
      + '水上軍開入之,復疾戰。趙果空壁爭漢鼓旗,逐韓信、張耳。'
      + '韓信、張耳已入水上軍,軍皆殊死戰,不可敗。'
      + '信所出奇兵二千騎,共候趙空壁逐利,則馳入趙壁,皆拔趙旗,立漢赤幟二千。\n\n'
      + '諸將問曰:「兵法右倍山陵,前左水澤,今者將軍令臣等反背水陳,'
      + '曰破趙會食,臣等不服。然竟以勝,此何術也?」\n'
      + '信曰:「此在兵法,顧諸君不察耳。兵法不曰『陷之死地而後生,'
      + '置之亡地而後存』?且信非得素拊循士大夫也,此所謂『驅市人而戰之』,'
      + '其勢非置之死地,使人人自為戰;今予之生地,皆走,寧尚可得而用之乎!」',
    effects: [
      { kind: 'officer-loyalty', officerId: 'hist-han-xin', delta: 18 },
      { kind: 'city-defense', cityId: 'ye', delta: -18 },
      { kind: 'city-troops-multiplier', cityId: 'ye', multiplier: 0.85 },
      { kind: 'flag', key: 'ch-beishui' },
    ],
    mood: 'martial',
  },
  {
    id: 'evt-ch-fanzeng-leaves',
    name: { en: 'The Meal for the Hegemon Envoy', zh: '亞父之去' },
    yearMin: 181,
    yearMax: 187,
    requires: [
      { kind: 'officer-alive', officerId: 'hist-fan-zeng' },
      { kind: 'officer-alive', officerId: 'hist-chen-ping' },
      { kind: 'flag-set', key: 'ch-hongmen' },
      { kind: 'flag-unset', key: 'ch-fanzeng' },
    ],
    description:
      'Chen Ping is given forty thousand catties of gold and told not to account for it. Word goes round the Chu camp that Zhong Li Mo and the others have great merit and no fief and are in touch with Han. When a Chu envoy arrives, a magnificent meal is brought in; the servants look at him, say oh, we thought you came from the Grand Tutor, and take it away, returning with plain food. The envoy reports this. Xiang Yu begins to suspect Fan Zeng. Fan Zeng, when he understands, says: the realm business is settled; my lord may see to it himself; let these old bones go home. He gets as far as Pengcheng and dies of a boil on his back.',
    descriptionZh:
      '漢王患之,乃用陳平之計間項王。'
      + '項王使者來,為太牢具,舉欲進之。'
      + '見使者,詳驚曰:「吾以為亞父使者,乃反項王使者。」'
      + '更持去,以惡食食項王使者。使者歸報項王,項王乃疑范增與漢有私,稍奪之權。\n\n'
      + '范增大怒,曰:「天下事大定矣,君王自為之!願賜骸骨歸卒伍。」'
      + '項王許之。行未至彭城,疽發背而死。\n\n'
      + '——項王帳中只有一個能謀的人,而他把那個人送走了。',
    effects: [
      { kind: 'officer-status', officerId: 'hist-fan-zeng', status: 'dead' },
      { kind: 'officer-loyalty', officerId: 'hist-chen-ping', delta: 15 },
      { kind: 'mandate-ruler', rulerOfficerId: 'hist-xiang-yu', delta: -8 },
      { kind: 'city-loyalty', cityId: 'pengcheng', delta: -10 },
      { kind: 'flag', key: 'ch-fanzeng' },
    ],
    mood: 'ominous',
  },
  {
    id: 'evt-ch-jixin',
    name: { en: 'The Man Who Went Out in the Yellow Carriage', zh: '紀信誑楚' },
    yearMin: 181,
    yearMax: 187,
    requires: [
      { kind: 'officer-alive', officerId: 'hist-ji-xin' },
      { kind: 'officer-alive', officerId: 'hist-liu-bang' },
      { kind: 'flag-set', key: 'ch-hongmen' },
      { kind: 'flag-unset', key: 'ch-jixin' },
    ],
    description:
      'Xingyang has been invested for a year and the corn road is cut. Ji Xin says: the situation is urgent; let me impersonate the king and deceive Chu, and my lord can go out the other side. Two thousand women in armour are sent out of the east gate at night and the Chu army closes on them from all four sides; the yellow-canopied carriage goes out behind them with Ji Xin in it, announcing that the food is gone and the king of Han surrenders. The whole Chu army shouts for joy and goes to the east side to watch. Liu Bang leaves by the west gate with a few dozen horse. Xiang Yu, seeing what has happened, has Ji Xin burned.',
    descriptionZh:
      '漢王食乏,恐,請和,割滎陽以西為漢。項王不聽。'
      + '漢王患之,乃用陳平計,夜出女子滎陽東門二千餘人,被甲,楚因四面擊之。'
      + '紀信乃乘王駕,詐為漢王,誑楚,曰:「城中食盡,漢王降。」'
      + '楚皆呼萬歲,之城東觀,以故漢王得與數十騎出西門遁去。\n\n'
      + '項王見紀信,問:「漢王安在?」曰:「漢王已出矣。」'
      + '項王燒殺紀信。\n\n'
      + '……周苛、樅公守滎陽。項王拔滎陽,烹周苛。'
      + '——滎陽這一年,漢王活了下來,而替他活的人都沒有。',
    effects: [
      { kind: 'officer-status', officerId: 'hist-ji-xin', status: 'dead' },
      { kind: 'mandate-ruler', rulerOfficerId: 'hist-liu-bang', delta: 8 },
      { kind: 'city-loyalty', cityId: 'luoyang', delta: -12 },
      { kind: 'flag', key: 'ch-jixin' },
    ],
    mood: 'somber',
  },
  {
    id: 'evt-ch-yibeigeng',
    name: { en: 'Then Send Me a Cup of the Soup', zh: '分我一杯羹' },
    yearMin: 182,
    yearMax: 187,
    requires: [
      { kind: 'officer-alive', officerId: 'hist-xiang-yu' },
      { kind: 'officer-alive', officerId: 'hist-liu-bang' },
      { kind: 'flag-set', key: 'ch-jixin' },
      { kind: 'flag-unset', key: 'ch-yibeigeng' },
    ],
    description:
      'Stalemated across the ravine, Xiang Yu has a high chopping board set up with Liu Bang father on it and calls across that unless Han surrenders now he will boil the old man. The answer comes back: you and I faced north together and took our commission from King Huai, and swore to be brothers, so my father is your father — and if you insist on boiling your father, be so good as to send me a cup of the soup. Xiang Bo says: the fate of the realm is not knowable, and a man who contends for it does not care about his family; killing him gains nothing and adds harm. The board is taken down.',
    descriptionZh:
      '項王為高俎,置太公其上,告漢王曰:'
      + '「今不急下,吾烹太公。」\n\n'
      + '漢王曰:「吾與項羽俱北面受命懷王,曰『約為兄弟』,'
      + '吾翁即若翁,必欲烹而翁,則幸分我一杯羹。」\n\n'
      + '項王怒,欲殺之。項伯曰:「天下事未可知,且為天下者不顧家,'
      + '雖殺之無益,祗益禍耳。」項王從之。',
    effects: [],
    chooserRulerId: 'hist-xiang-yu',
    choices: [
      {
        id: 'stand-down',
        label: { zh: '從項伯之言,撤俎', en: 'Heed Xiang Bo; take the board down' },
        effects: [
          { kind: 'mandate-ruler', rulerOfficerId: 'hist-xiang-yu', delta: 4 },
          { kind: 'flag', key: 'ch-yibeigeng' },
        ],
      },
      {
        id: 'boil',
        label: { zh: '烹之', en: 'Boil him' },
        effects: [
          { kind: 'mandate-ruler', rulerOfficerId: 'hist-xiang-yu', delta: -12 },
          { kind: 'mandate-ruler', rulerOfficerId: 'hist-liu-bang', delta: 8 },
          { kind: 'city-loyalty', cityId: 'pengcheng', delta: -15 },
          { kind: 'flag', key: 'ch-yibeigeng' },
        ],
      },
    ],
    mood: 'ominous',
  },
  {
    id: 'evt-ch-pengyue',
    name: { en: 'Peng Yue Behind the Lines', zh: '彭越撓楚' },
    yearMin: 182,
    yearMax: 188,
    requires: [
      { kind: 'officer-alive', officerId: 'hist-peng-yue' },
      { kind: 'flag-set', key: 'ch-chencang' },
      { kind: 'flag-unset', key: 'ch-pengyue' },
    ],
    description:
      'He never fights a battle anyone records the name of. He takes the country between Liang and Chu with a few tens of thousands, goes where the granaries are, burns the corn road, and disappears; Xiang Yu turns east to deal with him and by the time he has, Xingyang has been resupplied and the front has moved back. Chu wins nearly every engagement of the war and cannot finish it, because every time it presses in the west somebody is burning its food in the east.',
    descriptionZh:
      '彭越常往來為漢游兵,擊楚,絕其後糧於梁地。'
      + '……漢王敗,越亦亡所得城,獨將其兵北居河上。'
      + '項王與漢王相距滎陽,越攻下睢陽、外黃十七城。'
      + '項王聞之,乃使曹咎守成皋,自東收越所下城邑,皆復為楚。\n\n'
      + '越將其兵北走穀城。……越復下昌邑旁二十餘城,得穀十餘萬斛,以給漢王食。\n\n'
      + '——楚戰無不勝而不能終,正在於此:'
      + '每當它在西邊壓上去,東邊就有人在燒它的糧。',
    effects: [
      { kind: 'officer-loyalty', officerId: 'hist-peng-yue', delta: 15 },
      { kind: 'city-food', cityId: 'pengcheng', delta: -25000 },
      { kind: 'strip-force-paint', forceId: 'chu' },
      { kind: 'flag', key: 'ch-pengyue' },
    ],
    mood: 'martial',
  },

  /* ════════════════════════════════════════════════════════════════════
     隋唐 · 兩組(2026-08-09)

     ⚠ 這一線的守衛跟另外兩線不一樣,因為**人物池不對稱**:
     隋末群雄(隋煬帝/竇建德/王世充/劉武周/宋金剛/李密)**不在安史盤上**,
     而安史那批(安祿山/楊貴妃/哥舒翰/顏真卿)**在淺水原、柏壁、虎牢盤上都在**。

     於是:唐初那組靠人物就擋得住安史盤(用隋末人物當守衛);
     **安史那組靠人物擋不住**,必須綁 `chain-anshi`(已在 scenarios.ts 宣告)。
     ════════════════════════════════════════════════════════════════════ */
  {
    id: 'evt-st-jinyang',
    name: { en: 'The Rising at Jinyang', zh: '晉陽起兵' },
    yearMin: 178,
    yearMax: 188,
    requires: [
      { kind: 'officer-alive', officerId: 'hist-sui-yangdi' },
      { kind: 'officer-alive', officerId: 'hist-li-yuan' },
      { kind: 'flag-unset', key: 'st-jinyang' },
    ],
    description:
      'The garrison commander at Taiyuan has lost engagements against the Turks and is liable for it under a law that does not care about circumstances. His second son and Liu Wenjing have already been recruiting, on the argument that the realm is in pieces and holding a province for a dynasty that is finished is the least safe thing available. When it is finally put to him he refuses, then says he will report his own son — and then says: if I inform, the house dies; if I do not, the house may live. As you have brought it this far, what else is there to do?',
    descriptionZh:
      '高祖為太原留守,與突厥戰,數不利,恐獲罪。'
      + '太宗與晉陽令劉文靜謀舉大事,計已決,而未敢言。'
      + '……太宗乘間屏人說曰:「今主上無道,百姓困窮,'
      + '晉陽城外皆為戰場;大人若守小節,下有寇盜,上有嚴刑,'
      + '危亡無日。不若順民心,興義兵,轉禍為福,此天授之時也。」\n\n'
      + '高祖大驚曰:「汝安得為此言!吾今執汝以告縣官。」'
      + '取紙筆,欲表其事。太宗徐曰:「兒觀天時人事如此,故敢發言;'
      + '必欲執告,不敢辭死。」高祖曰:「吾豈忍告汝,汝慎勿出口。」\n\n'
      + '明日,又曰:「吾一夕思汝言,亦大有理。今日破家亡軀亦由汝,'
      + '化家為國亦由汝矣。」',
    effects: [],
    chooserRulerId: 'hist-li-yuan',
    choices: [
      {
        id: 'rise',
        label: { zh: '化家為國亦由汝 —— 舉義兵', en: 'Raise the standard at Jinyang' },
        effects: [
          { kind: 'city-troops-multiplier', cityId: 'taiyuan', multiplier: 1.25 },
          { kind: 'officer-loyalty', officerId: 'hist-tang-taizong', delta: 15 },
          { kind: 'mandate-ruler', rulerOfficerId: 'hist-li-yuan', delta: 10 },
          { kind: 'flag', key: 'st-jinyang' },
        ],
      },
      {
        id: 'hold-post',
        label: { zh: '守留守之職,以待朝命', en: 'Hold the post and wait for the court' },
        effects: [
          { kind: 'city-loyalty', cityId: 'taiyuan', delta: 10 },
          { kind: 'officer-loyalty', officerId: 'hist-tang-taizong', delta: -12 },
          { kind: 'mandate-ruler', rulerOfficerId: 'hist-li-yuan', delta: -6 },
          { kind: 'flag', key: 'st-jinyang' },
        ],
      },
    ],
    mood: 'martial',
  },
  {
    id: 'evt-st-huoyi',
    name: { en: 'The Rain at Huoyi', zh: '霍邑之雨' },
    yearMin: 179,
    yearMax: 189,
    requires: [
      { kind: 'officer-alive', officerId: 'hist-tang-taizong' },
      { kind: 'officer-alive', officerId: 'hist-liu-wuzhou' },
      { kind: 'flag-set', key: 'st-jinyang' },
      { kind: 'flag-unset', key: 'st-huoyi' },
    ],
    description:
      'Stopped at Huoyi by rain that will not end, with the grain low and a rumour that the Turks and Liu Wuzhou are moving on Taiyuan behind them, the council votes to go back and secure the base. The second son argues: we came out on a just cause, and an army that advances wins and one that turns back disperses; if it disperses and the enemy comes on behind, we die where we stand. He is not heard. That night he weeps outside the tent loudly enough to be summoned in, repeats it, and the order to withdraw is cancelled at dawn.',
    descriptionZh:
      '義師至賈胡堡,隋將宋老生屯霍邑以拒。會霖雨積旬,饋運不給,'
      + '又傳突厥與劉武周乘虛襲晉陽 —— 高祖集將佐議還師,以救根本。\n\n'
      + '太宗諫曰:「今禾菽被野,何憂乏糧?'
      + '宋老生輕躁,一戰可擒。李密顧戀倉粟,未遑遠略。'
      + '劉武周外雖倚突厥,內實猜嫌。'
      + '本興大義以救蒼生,當須先入咸陽,號令天下;'
      + '今遇小敵,遽已班師,恐從義之徒一朝解體。」\n\n'
      + '高祖不納,催令引發。太宗遂號泣於外,聲聞帳中。'
      + '高祖召問其故,對曰:「今兵以義動,進戰則克,退還則散;'
      + '眾散於前,敵乘於後,死亡無日,何得不悲!」'
      + '高祖乃悟而止。',
    effects: [
      { kind: 'officer-loyalty', officerId: 'hist-tang-taizong', delta: 18 },
      { kind: 'city-troops-multiplier', cityId: 'taiyuan', multiplier: 1.1 },
      { kind: 'city-defense', cityId: 'changan', delta: -12 },
      { kind: 'flag', key: 'st-huoyi' },
    ],
    mood: 'martial',
  },
  {
    id: 'evt-st-yuchi',
    name: { en: 'Yuchi Jingde Comes Over', zh: '尉遲敬德歸唐' },
    yearMin: 180,
    yearMax: 190,
    requires: [
      { kind: 'officer-alive', officerId: 'hist-yuchi-gong' },
      { kind: 'officer-alive', officerId: 'hist-song-jingang' },
      { kind: 'flag-unset', key: 'st-yuchi' },
    ],
    description:
      'With Song Jingang broken and gone north, Yuchi Jingde holds Jiexiu and Yong-an and then surrenders both. Shortly afterwards two other officers who had come over the same way desert again, and the staff put Yuchi under arrest on the reasonable ground that he will be next. The prince has him released, brought in, given gold, and told: a man decides these things for himself, and I will not have anyone believe I would harm a man who came to me. If you truly want to leave, take this for the road. He does not leave. At Meiliangchuan, at Hulao, and later at the Xuanwu gate, he is the man standing next to him.',
    descriptionZh:
      '宋金剛之敗,尋相與尉遲敬德收其餘眾,守介休。'
      + '太宗遣任城王道宗、宇文士及往諭之,敬德與尋相舉城來降。\n\n'
      + '其後尋相與諸將復叛去,諸將疑敬德必叛,囚之軍中。'
      + '行臺左僕射屈突通、尚書殷開山咸言:「敬德驍勇絕倫,'
      + '今既囚之,心必怨望,留之恐貽後悔,請即殺之。」\n\n'
      + '太宗曰:「不然。敬德若懷翻背之計,豈在尋相之後邪?」'
      + '遽命釋之,引入臥內,賜以金寶,謂曰:'
      + '「丈夫意氣相期,勿以小疑介意,寡人終不聽讒言以害忠良,公宜體之。'
      + '必欲去者,以此相資,表一時共事之情也。」\n\n'
      + '是日,獵於榆窠,遇王世充,單雄信直趨太宗,敬德躍馬大呼,'
      + '橫刺雄信墜馬,護太宗以出。',
    effects: [
      { kind: 'officer-join-ruler', officerId: 'hist-yuchi-gong', rulerOfficerId: 'hist-li-yuan' },
      { kind: 'officer-loyalty', officerId: 'hist-yuchi-gong', delta: 25 },
      { kind: 'city-troops-multiplier', cityId: 'taiyuan', multiplier: 1.12 },
      { kind: 'flag', key: 'st-yuchi' },
    ],
    mood: 'auspicious',
  },
  {
    id: 'evt-st-xuanjia',
    name: { en: 'The Black Armour', zh: '玄甲軍' },
    yearMin: 181,
    yearMax: 190,
    requires: [
      { kind: 'officer-alive', officerId: 'hist-tang-taizong' },
      { kind: 'officer-alive', officerId: 'hist-dou-jiande' },
      { kind: 'flag-set', key: 'st-yuchi' },
      { kind: 'flag-unset', key: 'st-xuanjia' },
    ],
    description:
      'A thousand picked horse in black armour, split into two wings under Qin Shubao, Cheng Yaojin, Yuchi Jingde and Zhai Zhangsun, kept for the moment when a line is already bending. Before Hulao the prince takes Yuchi and four riders out to look at Dou Jiande camp and says: I take the bow, you take the lance, and a hundred thousand of them can do nothing to us. They ride up to the pickets, announce themselves, kill the men who come out, and lead five or six thousand cavalry back into an ambush.',
    descriptionZh:
      '太宗簡精銳千餘騎,皆皂衣玄甲,分為左右隊,'
      + '使秦叔寶、程知節、尉遲敬德、翟長孫分將之。'
      + '每戰,太宗親披玄甲帥之為前鋒,乘機進擊,所向無不摧破,敵人畏之。\n\n'
      + '將戰,太宗以五百騎行視戰地,謂敬德曰:'
      + '「吾執弓矢,公執槊相隨,雖百萬眾若我何!」'
      + '又曰:「彼見我而還,上策也。」\n\n'
      + '遂至其營,去賊營三里所,賊眾大驚,'
      + '曰:「秦王也。」太宗曰:「我秦王也。」引弓射之,斃其一將。'
      + '賊眾五六千騎逐之,太宗徐引而還,與李世勣、程咬金伏兵,大破之。',
    effects: [
      { kind: 'officer-loyalty', officerId: 'hist-tang-taizong', delta: 15 },
      { kind: 'officer-loyalty', officerId: 'hist-qin-qiong', delta: 12 },
      { kind: 'officer-loyalty', officerId: 'hist-cheng-yaojin', delta: 12 },
      { kind: 'city-troops-multiplier', cityId: 'changan', multiplier: 1.15 },
      { kind: 'flag', key: 'st-xuanjia' },
    ],
    mood: 'martial',
  },

  /* ── 安史之亂(綁 chain-anshi:靠人物擋不住,見上面的說明)── */
  {
    id: 'evt-st-anshi-1',
    name: { en: 'The Drums of Yuyang', zh: '漁陽鼙鼓' },
    yearMin: 178,
    yearMax: 186,
    requires: [
      { kind: 'flag-set', key: 'chain-anshi' },
      { kind: 'officer-active', officerId: 'hist-an-lushan' },
      { kind: 'flag-unset', key: 'anshi-rising' },
    ],
    description:
      'He commands three frontier commands and a hundred and fifty thousand men, and marches south from Fanyang on a forged edict ordering him to punish the chief minister. The interior has not seen a war in a century: the commanderies of Hebei fold as he passes, the officials either flee, surrender, or are killed, and the column covers the ground faster than the reports of it. At Chang-an the court is still discussing whether the report is true.',
    descriptionZh:
      '天寶十四載十一月,祿山發所部兵及同羅、奚、契丹、室韋凡十五萬眾,'
      + '夜半發漁陽,以誅楊國忠為名,詐為敕書,曰:'
      + '「有密旨,令祿山將兵入朝討楊國忠。」\n\n'
      + '時海內久承平,百姓累世不識兵革,猝聞范陽兵起,遠近震駭。'
      + '河北皆祿山統內,所過州縣,望風瓦解,'
      + '守令或開門出迎,或棄城竄匿,或為所擒戮,無敢拒之者。\n\n'
      + '而長安猶以為妄,議者尚論其書之真偽。',
    effects: [
      { kind: 'city-loyalty', cityId: 'ye', delta: -25 },
      { kind: 'city-loyalty', cityId: 'beiping', delta: -25 },
      { kind: 'city-defense', cityId: 'luoyang', delta: -20 },
      { kind: 'mandate-ruler', rulerOfficerId: 'hist-li-longji', delta: -12 },
      { kind: 'flag', key: 'anshi-rising' },
    ],
    mood: 'ominous',
  },
  {
    id: 'evt-st-anshi-2',
    name: { en: 'Twenty-Four Commanderies and Not One Man', zh: '河北二十四郡' },
    yearMin: 178,
    yearMax: 187,
    requires: [
      { kind: 'flag-set', key: 'chain-anshi' },
      { kind: 'officer-alive', officerId: 'hist-yan-zhenqing' },
      { kind: 'flag-set', key: 'anshi-rising' },
      { kind: 'flag-unset', key: 'anshi-hebei' },
    ],
    description:
      'With every commandery in Hebei gone over, the emperor says: in twenty-four commanderies of Hebei was there not one loyal man? Then word comes that the governor of Pingyuan has raised troops, and his cousin at Changshan with him, and seventeen commanderies have declared for the throne in a single day with two hundred thousand men. The emperor strikes the arm of his couch and says: I do not even know what Yan Zhenqing looks like, and he does this.',
    descriptionZh:
      '河北二十四郡皆從賊。上歎曰:'
      + '「河北二十四郡,曾無一人義士邪!」\n\n'
      + '既而平原太守顏真卿遣使間道奉表 —— 真卿先度祿山必反,'
      + '陰完城浚池,料丁壯,實廩實,而以霖雨為解。'
      + '祿山以為書生,不足慮也。\n\n'
      + '從兄常山太守顏杲卿起兵斷賊歸路,河北十七郡同日歸朝廷,'
      + '得兵二十餘萬。上撫床歎曰:'
      + '「朕不識顏真卿作何狀,乃能如是!」',
    effects: [
      { kind: 'city-loyalty', cityId: 'ye', delta: 20 },
      { kind: 'city-loyalty', cityId: 'bohai', delta: 22 },
      { kind: 'officer-loyalty', officerId: 'hist-yan-zhenqing', delta: 20 },
      { kind: 'mandate-ruler', rulerOfficerId: 'hist-li-longji', delta: 8 },
      { kind: 'flag', key: 'anshi-hebei' },
    ],
    mood: 'auspicious',
  },
  {
    id: 'evt-st-anshi-3',
    name: { en: 'The Cry of Wrong at the Camp Gate', zh: '邊令誠之譖' },
    yearMin: 179,
    yearMax: 187,
    requires: [
      { kind: 'flag-set', key: 'chain-anshi' },
      { kind: 'officer-alive', officerId: 'hist-gao-xianzhi' },
      { kind: 'officer-alive', officerId: 'hist-feng-changqing' },
      { kind: 'flag-set', key: 'anshi-rising' },
      { kind: 'flag-unset', key: 'anshi-tongguan' },
    ],
    description:
      'Feng Changqing raised troops in Luoyang from the market crowd, lost, and told Gao Xianzhi the honest thing: these men cannot hold, fall back to Tong pass and hold that. They abandoned Shanzhou and got the pass fortified before the rebels arrived, which is the reason Chang-an did not fall that winter. The eunuch supervisor, refused a bribe, reported that Feng had exaggerated the enemy and that Gao had abandoned several hundred li and skimmed the ration allowance. Both were executed at the camp. When Gao denied the skimming and asked the ranks whether it was true, the whole army shouted that it was a wrong, and the sound of it shook the ground.',
    descriptionZh:
      '封常清募兵洛陽,所募皆市井子弟,不習戰,屢敗。'
      + '謂高仙芝曰:「累日血戰,賊鋒不可當。且潼關無兵,'
      + '若賊豕突入關,則長安危矣。宜棄陝守潼關。」'
      + '仙芝從之,遂焚太原倉,引兵趣潼關,修完守備 ——'
      + '賊至,不得入而去。長安之不即陷,由此也。\n\n'
      + '監軍邊令誠數以事干仙芝,仙芝多不從,'
      + '令誠入奏,具言二人罪狀,曰:'
      + '「常清以賊搖眾,而仙芝棄陝地數百里,又盜減軍士糧賜。」\n\n'
      + '上怒,遣令誠即軍中斬之。仙芝曰:'
      + '「我遇敵而退,死則宜矣。今上戴天,下履地,'
      + '謂我盜減糧賜則誣也。」顧謂令誠曰:'
      + '「上是天,下是地,士卒皆在,足下豈不知乎!」'
      + '其麾下皆呼「枉」,其聲振地。',
    effects: [
      { kind: 'officer-status', officerId: 'hist-gao-xianzhi', status: 'dead' },
      { kind: 'officer-status', officerId: 'hist-feng-changqing', status: 'dead' },
      { kind: 'city-defense', cityId: 'changan', delta: -18 },
      { kind: 'mandate-ruler', rulerOfficerId: 'hist-li-longji', delta: -10 },
      { kind: 'flag', key: 'anshi-tongguan' },
    ],
    mood: 'ominous',
  },
  {
    id: 'evt-st-anshi-4',
    name: { en: 'He Wept as He Went Out the Pass', zh: '慟哭出關' },
    yearMin: 180,
    yearMax: 188,
    requires: [
      { kind: 'flag-set', key: 'chain-anshi' },
      { kind: 'officer-alive', officerId: 'hist-geshu-han' },
      { kind: 'flag-set', key: 'anshi-tongguan' },
      { kind: 'flag-unset', key: 'anshi-lingbao' },
    ],
    description:
      'Geshu Han holds Tong pass with two hundred thousand and will not come out, on the grounds that the rebels are veterans, his own men are new, and that Guo Ziyi and Li Guangbi are cutting the rebel line in the north and time is on the imperial side. The chief minister, who is afraid of what an army sitting still might eventually be used for, tells the emperor the rebels at Shanzhou are weak and that this is dithering. Order after order arrives. He beats his chest, weeps, and goes out. At Lingbao the column is caught in a defile, fire and rolling logs come down from the heights, and of two hundred thousand about eight thousand come back.',
    descriptionZh:
      '哥舒翰以病廢在家,倉卒發兵二十萬守潼關,'
      + '議者以為賊悉銳兵在陝,而潼關之兵皆新募烏合,不可輕出。'
      + '翰上言:「祿山久習用兵,今始為逆,豈肯無備?'
      + '是必羸師以誘我,若往,正墮其計。'
      + '且賊遠來,利在速戰;王師自戰其地,利在堅守。'
      + '況賊殘虐失眾,兵勢日蹙,將有內變 —— 因而乘之,可不戰擒也。」\n\n'
      + '楊國忠疑翰謀己,言於上曰:「兵法『安不忘危』,'
      + '今大軍留關,而賊在陝,不亟討,恐失機會。」'
      + '上以為然,遣中使趣翰進兵,項背相望。\n\n'
      + '翰撫膺慟哭,引兵出關。至靈寶西原,'
      + '南薄山,北阻河,隘道七十里,賊伏兵於險,'
      + '以草車數十乘塞路,縱火焚之,煙焰亙天,官軍不能視。'
      + '……二十萬眾,存者八千而已。',
    effects: [
      { kind: 'officer-status', officerId: 'hist-geshu-han', status: 'imprisoned' },
      { kind: 'city-defense', cityId: 'changan', delta: -30 },
      { kind: 'city-troops-multiplier', cityId: 'changan', multiplier: 0.5 },
      { kind: 'mandate-ruler', rulerOfficerId: 'hist-li-longji', delta: -14 },
      { kind: 'flag', key: 'anshi-lingbao' },
    ],
    mood: 'ominous',
  },
  {
    id: 'evt-st-anshi-5',
    name: { en: 'The Post Station at Mawei', zh: '馬嵬驛' },
    yearMin: 180,
    yearMax: 189,
    requires: [
      { kind: 'flag-set', key: 'chain-anshi' },
      { kind: 'officer-alive', officerId: 'hist-yang-guifei' },
      { kind: 'flag-set', key: 'anshi-lingbao' },
      { kind: 'flag-unset', key: 'anshi-mawei' },
    ],
    description:
      'The column out of Chang-an has not eaten properly for a day when it stops at Mawei and the Six Armies will not go on. The chief minister is cut down by soldiers while talking to Tibetan envoys about supplies. The emperor comes out on a stick to tell them to disperse and nobody moves; Chen Xuanli says the minister is dealt with but the lady is still at his side, and the men cannot feel safe. Gao Lishi says: the lady is truly guiltless, but the men have killed her cousin, and while she is beside Your Majesty they will not settle. He goes back inside. She is taken to a Buddhist shrine at the station and strangled with a length of silk, and the body is laid out in the courtyard for Chen Xuanli to inspect.',
    descriptionZh:
      '至馬嵬驛,將士飢疲,皆憤怒。'
      + '龍武大將軍陳玄禮以禍由楊國忠,欲誅之,因東宮宦者李輔國以告太子,太子未決。\n\n'
      + '會吐蕃使者二十餘人遮國忠馬,訴以無食。'
      + '軍士呼曰:「國忠與胡虜謀反!」或射之,中鞍。'
      + '國忠走至西門內,軍士追殺之,屠割支體,以槍揭其首於驛門外。\n\n'
      + '上杖屨出驛門,慰勞軍士,令收隊,軍士不應。'
      + '上使高力士問之,玄禮對曰:「國忠謀反,貴妃不宜供奉,願陛下割恩正法。」'
      + '上曰:「朕當自處之。」入門,倚杖傾首而立。久之,京兆司錄韋諤前言:'
      + '「今眾怒難犯,安危在晷刻,願陛下速決!」\n\n'
      + '高力士曰:「貴妃誠無罪,然將士已殺國忠,'
      + '而貴妃在陛下左右,豈敢自安?願陛下審思之,將士安則陛下安矣。」'
      + '上乃命力士引貴妃於佛堂,縊殺之。'
      + '輿屍置驛庭,召玄禮等入視之。',
    effects: [
      { kind: 'officer-status', officerId: 'hist-yang-guifei', status: 'dead' },
      { kind: 'officer-status', officerId: 'hist-yang-guozhong', status: 'dead' },
      { kind: 'city-loyalty', cityId: 'changan', delta: -20 },
      { kind: 'mandate-ruler', rulerOfficerId: 'hist-li-longji', delta: -16 },
      { kind: 'officer-loyalty', officerId: 'hist-guo-ziyi', delta: 10 },
      { kind: 'flag', key: 'anshi-mawei' },
    ],
    mood: 'somber',
  },
];

export const EVENTS_BY_ID: Record<string, HistoricalEvent> = Object.fromEntries(
  HISTORICAL_EVENTS.map((e) => [e.id, e]),
);
