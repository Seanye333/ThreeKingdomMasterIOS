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
    id: 'evt-three-visits-to-thatched-cottage',
    name: { en: 'Three Visits to the Thatched Cottage', zh: '三顧茅廬' },
    yearMin: 207,
    yearMax: 208,
    requires: [
      { kind: 'force-alive', forceId: 'force-liu-bei' },
      { kind: 'officer-alive', officerId: 'zhuge-liang' },
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
];

export const EVENTS_BY_ID: Record<string, HistoricalEvent> = Object.fromEntries(
  HISTORICAL_EVENTS.map((e) => [e.id, e]),
);
