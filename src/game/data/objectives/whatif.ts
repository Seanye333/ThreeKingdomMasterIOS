import type { ScenarioObjective } from '../../types';

/** 劇本目標 · 假想 what-if 盤 —— 純資料,唯一入口仍是 data/objectives.ts。 */
export const OBJ_WHATIF: Record<string, ScenarioObjective[]> = {
  'scn-whatif-guanyu-jing': [
    {
      id: 'obj-wi-gyjing-shu',
      forceId: 'liu-bei',
      primary: {
        title: { zh: '兩路北伐', en: 'Two Roads North' },
        description: "Hold Jiangling, Xiangyang and Chang'an by 232 — the Longzhong plan, intact.",
        descriptionZh: "於232年前兼據江陵、襄陽、長安 —— 荊州未失,隆中對的兩路出兵終於成立。",
        goal: { kind: 'hold-cities', cityIds: ['jiangling', 'xiangyang', 'changan'], byYear: 232 },
      },
      secondary: [
        {
          title: { zh: '興復漢室', en: 'Restore the Han' },
          description: 'Bring all under the Han banner.',
          descriptionZh: "混一天下,還於舊都。",
          goal: { kind: 'unify-realm' },
        },
      ],
    },
    {
      id: 'obj-wi-gyjing-wei',
      forceId: 'cao',
      primary: {
        title: { zh: '遷都之議', en: 'The Question of Moving the Capital' },
        description: 'Still hold Xuchang and Luoyang in 230 — Cao Cao once talked of fleeing this man.',
        descriptionZh: "至230年仍保許昌、洛陽 —— 關羽威震華夏時,曹操曾議遷都以避之。",
        goal: { kind: 'hold-cities', cityIds: ['xuchang', 'luoyang'], byYear: 230 },
      },
      secondary: [
        {
          title: { zh: '南取江陵', en: 'Take Jiangling' },
          description: 'Hold Jiangling by 235.',
          descriptionZh: "於235年前南取江陵。",
          goal: { kind: 'hold-cities', cityIds: ['jiangling'], byYear: 235 },
        },
      ],
    },
    {
      id: 'obj-wi-gyjing-wu',
      forceId: 'sun',
      primary: {
        title: { zh: '盟而不襲', en: 'Ally, Do Not Stab' },
        description: 'Take Hefei and Shouchun by 232 — the north is the enemy, not the ally upstream.',
        descriptionZh: "於232年前取合肥、壽春 —— 沒有白衣渡江,便只剩合肥這條路。",
        goal: { kind: 'hold-cities', cityIds: ['hefei', 'shouchun'], byYear: 232 },
      },
      secondary: [
        {
          title: { zh: '終須一決', en: 'It Still Comes to Blows' },
          description: 'Take Jiangling by 240.',
          descriptionZh: "於240年前奪取江陵 —— 全據長江之志,終究不會消失。",
          goal: { kind: 'hold-cities', cityIds: ['jiangling'], byYear: 240 },
        },
      ],
    },
    {
      id: 'obj-wi-guanyu-jing-shi-xie',
      forceId: 'shi-xie',
      primary: {
        title: { zh: '交趾世家', en: 'The House of Jiaozhi' },
        description: "Still hold Jiaozhi and Nanhai in 226. The brothers held the commanderies between them; for over forty years the south saw no war.",
        descriptionZh: "至226年仍據交趾、南海。兄弟並為列郡守,雄長一州,四十餘年疆場無事。",
        goal: { kind: 'hold-cities', cityIds: ['jiaozhi', 'nanhai'], byYear: 226 },
      },
    },
    {
      id: 'obj-wi-guanyu-jing-nanman',
      forceId: 'nanman',
      primary: {
        title: { zh: '南中之主', en: 'Lord of Nanzhong' },
        description: "Still hold Jianning and Nanzhong in 226. They trusted to distance and mountains and answered to no one. The hills are theirs.",
        descriptionZh: "至226年仍據建寧、南中。恃其險遠,不服王化 —— 山是他們的。",
        goal: { kind: 'hold-cities', cityIds: ['jianning', 'nanzhong'], byYear: 226 },
      },
    },
    {
      id: 'obj-wi-guanyu-jing-xianbei',
      forceId: 'xianbei',
      primary: {
        title: { zh: '控弦十萬', en: 'A Hundred Thousand Bows' },
        description: "Still hold Wuhuan and Liucheng in 226. The land divided into three parts under three chieftains: they come like birds and leave like a cut string.",
        descriptionZh: "至226年仍據烏丸、柳城。分其地為三部,各置大人;來如飛鳥,去如絕弦。",
        goal: { kind: 'hold-cities', cityIds: ['wuhuan', 'liucheng'], byYear: 226 },
      },
    },
  ],

  // What if Zhuge Liang had lived to eighty
  'scn-whatif-zhuge-lives': [
    {
      id: 'obj-wi-zgl-shu',
      forceId: 'liu-bei',
      primary: {
        title: { zh: '出師未捷身不死', en: 'The Campaign Outlives the Man' },
        description: "Take Chang'an and Luoyang by 255 — the years Wuzhang Plain took back.",
        descriptionZh: "於255年前克復長安、洛陽 —— 五丈原奪走的那些年,還你了。",
        goal: { kind: 'hold-cities', cityIds: ['changan', 'luoyang'], byYear: 255 },
      },
      secondary: [
        {
          title: { zh: '斷隴右', en: 'Cut Off Longyou' },
          description: 'Hold Tianshui and Hanzhong by 246.',
          descriptionZh: "於246年前據天水、漢中 —— 先斷隴右,再圖關中。",
          goal: { kind: 'hold-cities', cityIds: ['tianshui', 'hanzhong'], byYear: 246 },
        },
      ],
    },
    {
      id: 'obj-wi-zgl-wei',
      forceId: 'cao',
      primary: {
        title: { zh: '拖死孔明', en: 'Outlast Kongming' },
        description: "Still hold Chang'an and Tianshui in 255 — you cannot beat him, only wait him out. This time the wait is longer.",
        descriptionZh: "至255年仍保長安、天水 —— 你打不贏他,只能等他死。這一次要等得久一些。",
        goal: { kind: 'hold-cities', cityIds: ['changan', 'tianshui'], byYear: 255 },
      },
    },
    {
      id: 'obj-wi-zgl-wu',
      forceId: 'sun',
      primary: {
        title: { zh: '東西呼應', en: 'Answer from the East' },
        description: 'Take Hefei and Xiangyang by 250.',
        descriptionZh: "於250年前取合肥、襄陽 —— 蜀既能持久,吳當並力。",
        goal: { kind: 'hold-cities', cityIds: ['hefei', 'xiangyang'], byYear: 250 },
      },
    },
  ],

  // What if Cao Cao had won at Chibi
  'scn-whatif-cao-wins-chibi': [
    {
      id: 'obj-wi-chibi-cao',
      forceId: 'cao',
      primary: {
        title: { zh: '順流東下', en: 'Down the River' },
        description: 'Bring all under one banner — the wind did not turn.',
        descriptionZh: "混一天下 —— 東風沒有來,江東已無屏障。",
        goal: { kind: 'unify-realm' },
      },
      secondary: [
        {
          title: { zh: '掃平江東', en: 'Sweep Jiangdong' },
          description: 'Destroy the Wu remnant by 215.',
          descriptionZh: "於215年前掃滅吳之殘部。",
          goal: { kind: 'defeat-force', forceId: 'sun', byYear: 215 },
        },
      ],
    },
    {
      id: 'obj-wi-chibi-sun',
      forceId: 'sun',
      primary: {
        title: { zh: '江東殘部', en: 'What Is Left of Wu' },
        description: 'Survive to 220 and still hold Jianye — Zhou Yu is ash, Sun Quan is gone, you are what remains.',
        descriptionZh: "存續至220年且仍據建業 —— 周郎已成灰,兄長已不在,剩下的只有你。",
        goal: { kind: 'survive-until', year: 220 },
      },
      secondary: [
        {
          title: { zh: '守住建業', en: 'Hold Jianye' },
          description: 'Still hold Jianye in 218.',
          descriptionZh: "至218年仍據建業。",
          goal: { kind: 'hold-cities', cityIds: ['jianye'], byYear: 218 },
        },
      ],
    },
    {
      id: 'obj-wi-chibi-liubei',
      forceId: 'liu-bei',
      primary: {
        title: { zh: '無立錐之地', en: 'Nowhere to Set a Foot' },
        description: 'Take Chengdu by 216 — Jing is lost before you ever held it; go west or die.',
        descriptionZh: "於216年前取成都 —— 荊州還沒到手就沒了,不入蜀便無死所。",
        goal: { kind: 'hold-cities', cityIds: ['chengdu'], byYear: 216 },
      },
      secondary: [
        {
          title: { zh: '據險而守', en: 'Hold the Passes' },
          description: 'Hold Chengdu and Hanzhong by 220.',
          descriptionZh: "於220年前據成都、漢中 —— 天下已九分歸曹,唯蜀道可恃。",
          goal: { kind: 'hold-cities', cityIds: ['chengdu', 'hanzhong'], byYear: 220 },
        },
      ],
    },
    {
      id: 'obj-wi-chibi-liuzhang',
      forceId: 'liu-zhang',
      primary: {
        title: { zh: '蜀中最後一隅', en: 'The Last Corner' },
        description: "Still hold Chengdu, Jiangzhou and Luocheng in 218 — with the north lost, Shu is the last room in the house.",
        descriptionZh: "至218年仍據成都、江州、雒城 —— 天下既已底定,蜀中是最後一間屋子。",
        goal: { kind: 'hold-cities', cityIds: ['chengdu', 'jiangzhou', 'luocheng'], byYear: 218 },
      },
      secondary: [
        {
          title: { zh: '蜀中最後一隅', en: 'The Last Corner' },
          description: 'Control Yi province by 218 — everyone displaced by Chibi is coming your way.',
          descriptionZh: "於218年前盡有益州 —— 赤壁之後無家可歸的人,都往你這裡來。",
          goal: { kind: 'control-province', provinceId: 'yi', byYear: 218 },
        },
      ],
    },
    {
      id: 'obj-wi-cao-wins-chibi-zhang-lu',
      forceId: 'zhang-lu',
      primary: {
        title: { zh: '師君治漢中', en: 'The Shijun of Hanzhong' },
        description: "Still hold Hanzhong and Tianshui in 214. Church and state in one hand, free rice and meat at the roadside lodges, and thirty years without an army passing through.",
        descriptionZh: "至214年仍據漢中、天水。政教合一,置義舍米肉,三十年不見兵革。",
        goal: { kind: 'hold-cities', cityIds: ['hanzhong', 'tianshui'], byYear: 214 },
      },
    },
    {
      id: 'obj-wi-cao-wins-chibi-ma-teng',
      forceId: 'ma-teng',
      primary: {
        title: { zh: '西涼之安', en: 'Liang Kept Quiet' },
        description: "Still hold Wuwei and Anding in 214. The captains of Liang each hold their own walls: they come when the court summons them and mind their own business when it does not.",
        descriptionZh: "至214年仍據武威、安定。涼州諸將各據其城,朝廷徵之則來,不徵則自守。",
        goal: { kind: 'hold-cities', cityIds: ['wuwei', 'anding'], byYear: 214 },
      },
    },
    {
      id: 'obj-wi-cao-wins-chibi-shi-xie',
      forceId: 'shi-xie',
      primary: {
        title: { zh: '交趾世家', en: 'The House of Jiaozhi' },
        description: "Still hold Jiaozhi and Nanhai in 214. The brothers held the commanderies between them; for over forty years the south saw no war.",
        descriptionZh: "至214年仍據交趾、南海。兄弟並為列郡守,雄長一州,四十餘年疆場無事。",
        goal: { kind: 'hold-cities', cityIds: ['jiaozhi', 'nanhai'], byYear: 214 },
      },
    },
  ],

  // The age of heroines
  'scn-whatif-women': [
    {
      id: 'obj-wi-women-diaochan',
      forceId: 'diaochan-han',
      primary: {
        title: { zh: '連環之後', en: 'After the Chained Stratagem' },
        description: "Hold Chang'an and Luoyang by 212 — you brought down a tyrant with nothing but a plan; now hold what you took.",
        descriptionZh: "於212年前據長安、洛陽 —— 你曾以一計傾一國,如今要守住它。",
        goal: { kind: 'hold-cities', cityIds: ['changan', 'luoyang'], byYear: 212 },
      },
      secondary: [
        {
          title: { zh: '女子稱制', en: 'A Woman Takes the Throne' },
          description: 'Declare yourself emperor.',
          descriptionZh: "稱帝建號。",
          goal: { kind: 'declare-emperor' },
        },
      ],
    },
    {
      id: 'obj-wi-women-lady-sun',
      forceId: 'lady-sun',
      primary: {
        title: { zh: '侍婢百人皆執刀', en: 'A Hundred Maids, All Armed' },
        description: 'Hold Jianye and Jiangling by 212 — Liu Bei was afraid to enter your rooms.',
        descriptionZh: "於212年前據建業、江陵 —— 房中侍婢百餘,皆親執刀侍立,劉備每入,心常凜然。",
        goal: { kind: 'hold-cities', cityIds: ['jianye', 'jiangling'], byYear: 212 },
      },
    },
    {
      id: 'obj-wi-women-yueying',
      forceId: 'yueying',
      primary: {
        title: { zh: '木牛流馬', en: 'Wooden Oxen and Flowing Horses' },
        description: 'Hold Chengdu and Hanzhong by 214 — the machines were half yours anyway.',
        descriptionZh: "於214年前據成都、漢中 —— 那些木牛流馬,本也有你一半。",
        goal: { kind: 'hold-cities', cityIds: ['chengdu', 'hanzhong'], byYear: 214 },
      },
    },
    {
      id: 'obj-wi-women-zhurong',
      forceId: 'zhurong-nan',
      primary: {
        title: { zh: '飛刀取將', en: 'The Thrown Blade' },
        description: 'Hold Chengdu by 214 — descendant of the Fire God, and the only one at Nanzhong who beat Shu in the field.',
        descriptionZh: "於214年前攻取成都 —— 火神之裔,南中唯一在陣上勝過蜀將的人。",
        goal: { kind: 'hold-cities', cityIds: ['chengdu'], byYear: 214 },
      },
    },
    {
      id: 'obj-wi-women-caiyan',
      forceId: 'caiyan-ye',
      primary: {
        title: { zh: '胡笳十八拍', en: 'Eighteen Songs of the Nomad Flute' },
        description: 'Hold Ye and Luoyang by 214 — twelve years among the Xiongnu taught you what borders are worth.',
        descriptionZh: "於214年前據鄴城、洛陽 —— 沒入胡中十二年,你比誰都懂邊塞。",
        goal: { kind: 'hold-cities', cityIds: ['ye', 'luoyang'], byYear: 214 },
      },
      secondary: [
        {
          title: { zh: '默書四百篇', en: 'Four Hundred Texts from Memory' },
          description: 'Survive to 220 — the library burned; you were the library.',
          descriptionZh: "存續至220年 —— 家書盡毀,而你默寫四百餘篇無一誤字。",
          goal: { kind: 'survive-until', year: 220 },
        },
      ],
    },
    {
      id: 'obj-wi-women-qiao',
      forceId: 'qiao',
      primary: {
        title: { zh: '銅雀春深', en: 'Not for the Bronze Bird Tower' },
        description: 'Hold Jianye, Wu and Chaisang by 213 — the tower in Ye was built with you in mind.',
        descriptionZh: "於213年前據建業、吳、柴桑 —— 鄴城那座銅雀台,本是為你們而築。",
        goal: { kind: 'hold-cities', cityIds: ['jianye', 'wu', 'chaisang'], byYear: 213 },
      },
    },
    {
      id: 'obj-wi-women-bian',
      forceId: 'bian-liang',
      primary: {
        title: { zh: '倡家女為國母', en: 'From Entertainer to Mother of a Dynasty' },
        description: 'Hold Ye and Xuchang by 213 — you kept the House of Cao together when Cao Cao was thought dead.',
        descriptionZh: "於213年前據鄴城、許昌 —— 曹操凶問傳來時,是你按住了整個曹家。",
        goal: { kind: 'hold-cities', cityIds: ['ye', 'xuchang'], byYear: 213 },
      },
    },
  ],

  // What if Yuan Shao had won at Guandu
  'scn-whatif-yuan-guandu': [
    {
      id: 'obj-wi-yg-yuanshao',
      forceId: 'yuan-shao',
      primary: {
        title: { zh: '併吞四海', en: 'Swallow the Four Seas' },
        description: 'Destroy the Cao Cao remnant by 208 — Wuchao did not burn.',
        descriptionZh: "於208年前殲滅曹操殘部 —— 烏巢沒有燒起來。",
        goal: { kind: 'defeat-force', forceId: 'cao', byYear: 208 },
      },
      secondary: [
        {
          title: { zh: '入主許都', en: 'Take Xuchang' },
          description: 'Hold Xuchang and Luoyang by 208.',
          descriptionZh: "於208年前據許昌、洛陽 —— 挾天子者,自今日換人。",
          goal: { kind: 'hold-cities', cityIds: ['xuchang', 'luoyang'], byYear: 208 },
        },
      ],
    },
    {
      id: 'obj-wi-yg-cao',
      forceId: 'cao',
      primary: {
        title: { zh: '敗而不亡', en: 'Beaten, Not Finished' },
        description: 'Survive to 210 and still hold Xuchang — you have a tenth of his men and all of your wits.',
        descriptionZh: "存續至210年且仍據許昌 —— 兵不及其十一,所恃者唯一顆腦袋。",
        goal: { kind: 'survive-until', year: 210 },
      },
      secondary: [
        {
          title: { zh: '許都不失', en: 'Xuchang Holds' },
          description: 'Still hold Xuchang in 208.',
          descriptionZh: "至208年仍據許昌 —— 天子還在你手上,這是最後的本錢。",
          goal: { kind: 'hold-cities', cityIds: ['xuchang'], byYear: 208 },
        },
      ],
    },
    {
      id: 'obj-wi-yg-sun',
      forceId: 'sun',
      primary: {
        title: { zh: '北方無主', en: 'The North Has No Master Yet' },
        description: 'Take Hefei and Jiangling by 210 — the two who mattered have bled each other white.',
        descriptionZh: "於210年前取合肥、江陵 —— 中原兩強相殘,江東正可西進北出。",
        goal: { kind: 'hold-cities', cityIds: ['hefei', 'jiangling'], byYear: 210 },
      },
    },
    {
      id: 'obj-wi-yg-liubei',
      forceId: 'liu-bei',
      primary: {
        title: { zh: '再尋一處落腳', en: 'Another Roof, Again' },
        description: 'Hold Chengdu or Jiangling by 212 — you have outlived four patrons; find land of your own.',
        descriptionZh: "於212年前據江陵、成都 —— 依人者四矣,總該有自己的地方。",
        goal: { kind: 'hold-cities', cityIds: ['jiangling', 'chengdu'], byYear: 212 },
      },
    },
    {
      id: 'obj-wi-yg-liubiao',
      forceId: 'liu-biao',
      primary: {
        title: { zh: '北出宛洛', en: 'North Through Wan and Luo' },
        description: 'Take Luoyang by 211 — with Cao Cao broken, the road north is finally open.',
        descriptionZh: "於211年前北取洛陽 —— 曹操既敗,宛洛之路終於開了。",
        goal: { kind: 'hold-cities', cityIds: ['luoyang'], byYear: 211 },
      },
    },
    {
      id: 'obj-wi-yuan-guandu-liu-zhang',
      forceId: 'liu-zhang',
      primary: {
        title: { zh: '守此蜀土', en: 'Hold the Shu Lands' },
        description: "Still hold Chengdu and Jiangzhou in 207. A weak lord over a rich people: the trouble was never a shortage of means.",
        descriptionZh: "至207年仍據成都、江州。暗弱而民殷國富 —— 難處從來不是沒有本錢。",
        goal: { kind: 'hold-cities', cityIds: ['chengdu', 'jiangzhou'], byYear: 207 },
      },
    },
    {
      id: 'obj-wi-yuan-guandu-ma-teng',
      forceId: 'ma-teng',
      primary: {
        title: { zh: '西涼之安', en: 'Liang Kept Quiet' },
        description: "Still hold Wuwei and Anding in 207. The captains of Liang each hold their own walls: they come when the court summons them and mind their own business when it does not.",
        descriptionZh: "至207年仍據武威、安定。涼州諸將各據其城,朝廷徵之則來,不徵則自守。",
        goal: { kind: 'hold-cities', cityIds: ['wuwei', 'anding'], byYear: 207 },
      },
    },
    {
      id: 'obj-wi-yuan-guandu-wuhuan',
      forceId: 'wuhuan',
      primary: {
        title: { zh: '控弦南下', en: 'The Riders Come South' },
        description: "Still hold Wuhuan and Liaodong in 207. Tadun had a name for daring, and the Wuhuan of Liaoxi rode at his word.",
        descriptionZh: "至207年仍據烏丸、遼東。蹋頓有雄名,遼西烏丸皆從其號令。",
        goal: { kind: 'hold-cities', cityIds: ['wuhuan', 'liaodong'], byYear: 207 },
      },
    },
  ],

  // What if Lü Bu had kept Xuzhou
  'scn-whatif-lubu-xuzhou': [
    {
      id: 'obj-wi-lbxz-lubu',
      forceId: 'lubu',
      primary: {
        title: { zh: '徐州王', en: 'King of Xuzhou' },
        description: 'Still hold Xiapi and Pengcheng in 205 — no White Gate Tower this time.',
        descriptionZh: "至205年仍據下邳、彭城 —— 這一次沒有白門樓。",
        goal: { kind: 'hold-cities', cityIds: ['xiapi', 'pengcheng'], byYear: 205 },
      },
      secondary: [
        {
          title: { zh: '西向許都', en: 'West to Xuchang' },
          description: 'Take Xuchang by 208 — a halberd is a fine thing to hold a court with.',
          descriptionZh: "於208年前攻取許昌 —— 有方天畫戟,也未必不能執朝政。",
          goal: { kind: 'hold-cities', cityIds: ['xuchang'], byYear: 208 },
        },
      ],
    },
    {
      id: 'obj-wi-lbxz-cao',
      forceId: 'cao',
      primary: {
        title: { zh: '東顧之患', en: 'The Thorn in the East' },
        description: 'Destroy the Lü Bu force by 205 — you cannot face Yuan Shao with this behind you.',
        descriptionZh: "於205年前擊滅呂布 —— 背後有此人,無法安心北向。",
        goal: { kind: 'defeat-force', forceId: 'lubu', byYear: 205 },
      },
      secondary: [
        {
          title: { zh: '再定河北', en: 'Then Settle the North' },
          description: 'Destroy the Yuan Shao force.',
          descriptionZh: "擊滅袁紹。",
          goal: { kind: 'defeat-force', forceId: 'yuan-shao' },
        },
      ],
    },
    {
      id: 'obj-wi-lbxz-yuanshao',
      forceId: 'yuan-shao',
      primary: {
        title: { zh: '南下之機', en: 'The Moment to Move South' },
        description: 'Take Xuchang by 206 — Cao Cao is pinned in the east.',
        descriptionZh: "於206年前攻取許昌 —— 曹操東顧不暇,正當南下。",
        goal: { kind: 'hold-cities', cityIds: ['xuchang'], byYear: 206 },
      },
    },
    {
      id: 'obj-wi-lbxz-sun',
      forceId: 'sun',
      primary: {
        title: { zh: '江東無事則西', en: 'Quiet at Home, Move West' },
        description: 'Control Yang province and take Jiangxia by 206.',
        descriptionZh: "於206年前盡有揚州並取江夏。",
        goal: { kind: 'hold-cities', cityIds: ['jiangxia'], byYear: 206 },
      },
    },
    {
      id: 'obj-wi-lbxz-yuanshu',
      forceId: 'yuan-shu',
      primary: {
        title: { zh: '與布連和', en: 'The Alliance with Lü Bu' },
        description: 'Declare yourself emperor and still hold Shouchun in 204.',
        descriptionZh: "稱帝建號 —— 這一次呂布沒有撕毀婚約。",
        goal: { kind: 'declare-emperor' },
      },
      secondary: [
        {
          title: { zh: '壽春不飢', en: 'Shouchun Fed' },
          description: 'Still hold Shouchun in 204.',
          descriptionZh: "至204年仍據壽春。",
          goal: { kind: 'hold-cities', cityIds: ['shouchun'], byYear: 204 },
        },
      ],
    },
    {
      id: 'obj-wi-lubu-xuzhou-liu-biao',
      forceId: 'liu-biao',
      primary: {
        title: { zh: '荊襄之守', en: 'The Jing Heartland' },
        description: "Still hold Xiangyang and Changsha in 204. He rode into Yicheng alone and settled the province. A man for talk, they said — and Jing province did have seventeen quiet years.",
        descriptionZh: "至204年仍據襄陽、長沙。單騎入宜城而定荊州,坐談客耳 —— 守成之主,而荊州確實安了十七年。",
        goal: { kind: 'hold-cities', cityIds: ['xiangyang', 'changsha'], byYear: 204 },
      },
    },
    {
      id: 'obj-wi-lubu-xuzhou-liu-zhang',
      forceId: 'liu-zhang',
      primary: {
        title: { zh: '守此蜀土', en: 'Hold the Shu Lands' },
        description: "Still hold Chengdu and Jiangzhou in 204. A weak lord over a rich people: the trouble was never a shortage of means.",
        descriptionZh: "至204年仍據成都、江州。暗弱而民殷國富 —— 難處從來不是沒有本錢。",
        goal: { kind: 'hold-cities', cityIds: ['chengdu', 'jiangzhou'], byYear: 204 },
      },
    },
    {
      id: 'obj-wi-lubu-xuzhou-gongsun',
      forceId: 'gongsun',
      primary: {
        title: { zh: '白馬義從', en: 'The White Horse Volunteers' },
        description: "Still hold Beiping and Ji in 204. Frontier troops, used to running with the steppe horse — and after Jieqiao he drew back further every year.",
        descriptionZh: "至204年仍據北平、薊。邊地之兵,慣與胡騎相馳 —— 而界橋之後,他愈退愈深。",
        goal: { kind: 'hold-cities', cityIds: ['beiping', 'ji'], byYear: 204 },
      },
    },
    {
      id: 'obj-wi-lubu-xuzhou-ma-teng',
      forceId: 'ma-teng',
      primary: {
        title: { zh: '西涼之安', en: 'Liang Kept Quiet' },
        description: "Still hold Wuwei and Anding in 204. The captains of Liang each hold their own walls: they come when the court summons them and mind their own business when it does not.",
        descriptionZh: "至204年仍據武威、安定。涼州諸將各據其城,朝廷徵之則來,不徵則自守。",
        goal: { kind: 'hold-cities', cityIds: ['wuwei', 'anding'], byYear: 204 },
      },
    },
  ],

  // What if Ma Chao had taken all of Guanzhong
  'scn-whatif-machao-guanzhong': [
    {
      id: 'obj-wi-mcgz-machao',
      forceId: 'ma-chao',
      primary: {
        title: { zh: '神威天將軍', en: 'The God-Might General' },
        description: "Hold Chang'an and control Liang province by 218 — no forged letter divided you from Han Sui.",
        descriptionZh: "於218年前據長安並盡有涼州 —— 那封塗改的書信沒有寄出,關中十部未散。",
        goal: { kind: 'hold-cities', cityIds: ['changan'], byYear: 218 },
      },
      secondary: [
        {
          title: { zh: '東出函谷', en: 'East Through Hangu' },
          description: 'Take Luoyang by 222.',
          descriptionZh: "於222年前東取洛陽 —— 關中既全,便當東向。",
          goal: { kind: 'hold-cities', cityIds: ['luoyang'], byYear: 222 },
        },
      ],
    },
    {
      id: 'obj-wi-mcgz-cao',
      forceId: 'cao',
      primary: {
        title: { zh: '馬兒不死', en: '"While That Horse Lives"' },
        description: "Destroy the Ma Chao force by 219 — \"while that boy lives I shall have no place to be buried.\"",
        descriptionZh: "於219年前擊滅馬超 —— 「馬兒不死,吾無葬地也。」",
        goal: { kind: 'defeat-force', forceId: 'ma-chao', byYear: 219 },
      },
      secondary: [
        {
          title: { zh: '奪回長安', en: "Retake Chang'an" },
          description: "Hold Chang'an by 218.",
          descriptionZh: "於218年前奪回長安。",
          goal: { kind: 'hold-cities', cityIds: ['changan'], byYear: 218 },
        },
      ],
    },
    {
      id: 'obj-wi-mcgz-hansui',
      forceId: 'han-sui',
      primary: {
        title: { zh: '關中十部', en: 'The Ten Camps of Guanzhong' },
        description: "Still hold Jincheng, Wuwei, Anding and Longxi in 218.",
        descriptionZh: "至218年仍據金城、武威、安定、隴西 —— 十部聯軍,而各有各的城。",
        goal: { kind: 'hold-cities', cityIds: ['jincheng', 'wuwei', 'anding', 'longxi'], byYear: 218 },
      },
      secondary: [
        {
          title: { zh: '關中十部', en: 'The Ten Companies of Guanzhong' },
          description: 'Control Liang province by 218 — this time the alliance did not break.',
          descriptionZh: "於218年前盡有涼州 —— 這一次盟約沒有裂。",
          goal: { kind: 'control-province', provinceId: 'liang', byYear: 218 },
        },
      ],
    },
    {
      id: 'obj-wi-mcgz-liubei',
      forceId: 'liu-bei',
      primary: {
        title: { zh: '西川與關中', en: 'Shu and Guanzhong' },
        description: 'Hold Chengdu and Hanzhong by 219 — with Cao Cao held in the west, the door to Shu is unguarded.',
        descriptionZh: "於219年前據成都、漢中 —— 曹操被牽制於關西,入蜀之路無人守。",
        goal: { kind: 'hold-cities', cityIds: ['chengdu', 'hanzhong'], byYear: 219 },
      },
    },
    {
      id: 'obj-wi-mcgz-sun',
      forceId: 'sun',
      primary: {
        title: { zh: '合肥可下', en: 'Hefei Is Takeable Now' },
        description: 'Take Hefei by 217 — the Wei field army is a thousand li to the west.',
        descriptionZh: "於217年前攻取合肥 —— 魏之主力遠在關西。",
        goal: { kind: 'hold-cities', cityIds: ['hefei'], byYear: 217 },
      },
    },
    {
      id: 'obj-wi-machao-guanzhong-liu-zhang',
      forceId: 'liu-zhang',
      primary: {
        title: { zh: '守此蜀土', en: 'Hold the Shu Lands' },
        description: "Still hold Chengdu and Jiangzhou in 217. A weak lord over a rich people: the trouble was never a shortage of means.",
        descriptionZh: "至217年仍據成都、江州。暗弱而民殷國富 —— 難處從來不是沒有本錢。",
        goal: { kind: 'hold-cities', cityIds: ['chengdu', 'jiangzhou'], byYear: 217 },
      },
    },
    {
      id: 'obj-wi-machao-guanzhong-zhang-lu',
      forceId: 'zhang-lu',
      primary: {
        title: { zh: '師君治漢中', en: 'The Shijun of Hanzhong' },
        description: "Still hold Hanzhong and Baxi in 217. Church and state in one hand, free rice and meat at the roadside lodges, and thirty years without an army passing through.",
        descriptionZh: "至217年仍據漢中、巴西。政教合一,置義舍米肉,三十年不見兵革。",
        goal: { kind: 'hold-cities', cityIds: ['hanzhong', 'baxi'], byYear: 217 },
      },
    },
    {
      id: 'obj-wi-machao-guanzhong-shi-xie',
      forceId: 'shi-xie',
      primary: {
        title: { zh: '交趾世家', en: 'The House of Jiaozhi' },
        description: "Still hold Jiaozhi and Nanhai in 217. The brothers held the commanderies between them; for over forty years the south saw no war.",
        descriptionZh: "至217年仍據交趾、南海。兄弟並為列郡守,雄長一州,四十餘年疆場無事。",
        goal: { kind: 'hold-cities', cityIds: ['jiaozhi', 'nanhai'], byYear: 217 },
      },
    },
  ],

  // What if Sun Ce had lived
  'scn-whatif-sunce-lives': [
    {
      id: 'obj-wi-sc-sun',
      forceId: 'sun',
      primary: {
        title: { zh: '襲許迎帝', en: 'Raid Xuchang, Take the Emperor' },
        description: 'Take Xuchang by 208 — the plan you were preparing when the assassins found you.',
        descriptionZh: "於208年前襲取許昌 —— 遇刺那年,你正在做的就是這件事。",
        goal: { kind: 'hold-cities', cityIds: ['xuchang'], byYear: 208 },
      },
      secondary: [
        {
          title: { zh: '全據江漢', en: 'The River Entire' },
          description: 'Hold Jianye, Jiangxia and Jiangling by 210.',
          descriptionZh: "於210年前據建業、江夏、江陵。",
          goal: { kind: 'hold-cities', cityIds: ['jianye', 'jiangxia', 'jiangling'], byYear: 210 },
        },
      ],
    },
    {
      id: 'obj-wi-sc-cao',
      forceId: 'cao',
      primary: {
        title: { zh: '兩面受敵', en: 'Enemies on Two Sides' },
        description: 'Still hold Xuchang in 208, and destroy Yuan Shao — the tiger cub is at your back.',
        descriptionZh: "至208年仍據許昌並擊滅袁紹 —— 北有袁紹,背後還有一頭小老虎。",
        goal: { kind: 'defeat-force', forceId: 'yuan-shao', byYear: 210 },
      },
      secondary: [
        {
          title: { zh: '許都不容有失', en: 'Xuchang Above All' },
          description: 'Still hold Xuchang in 208.',
          descriptionZh: "至208年仍據許昌。",
          goal: { kind: 'hold-cities', cityIds: ['xuchang'], byYear: 208 },
        },
      ],
    },
    {
      id: 'obj-wi-sc-yuanshao',
      forceId: 'yuan-shao',
      primary: {
        title: { zh: '南北夾擊', en: 'The Pincer' },
        description: 'Take Xuchang by 207 — Sun Ce comes from the south, you from the north.',
        descriptionZh: "於207年前攻取許昌 —— 孫策自南,你自北,曹操無以兩顧。",
        goal: { kind: 'hold-cities', cityIds: ['xuchang'], byYear: 207 },
      },
    },
    {
      id: 'obj-wi-sc-liubei',
      forceId: 'liu-bei',
      primary: {
        title: { zh: '亂中取地', en: 'Take Land in the Confusion' },
        description: 'Hold Jiangling or Chengdu by 212.',
        descriptionZh: "於212年前據江陵、成都 —— 三強相持,反是無地者的機會。",
        goal: { kind: 'hold-cities', cityIds: ['jiangling', 'chengdu'], byYear: 212 },
      },
    },
    {
      id: 'obj-wi-sunce-lives-liu-biao',
      forceId: 'liu-biao',
      primary: {
        title: { zh: '荊襄之守', en: 'The Jing Heartland' },
        description: "Still hold Xiangyang and Jiangling in 207. He rode into Yicheng alone and settled the province. A man for talk, they said — and Jing province did have seventeen quiet years.",
        descriptionZh: "至207年仍據襄陽、江陵。單騎入宜城而定荊州,坐談客耳 —— 守成之主,而荊州確實安了十七年。",
        goal: { kind: 'hold-cities', cityIds: ['xiangyang', 'jiangling'], byYear: 207 },
      },
    },
    {
      id: 'obj-wi-sunce-lives-liu-zhang',
      forceId: 'liu-zhang',
      primary: {
        title: { zh: '守此蜀土', en: 'Hold the Shu Lands' },
        description: "Still hold Chengdu and Jiangzhou in 207. A weak lord over a rich people: the trouble was never a shortage of means.",
        descriptionZh: "至207年仍據成都、江州。暗弱而民殷國富 —— 難處從來不是沒有本錢。",
        goal: { kind: 'hold-cities', cityIds: ['chengdu', 'jiangzhou'], byYear: 207 },
      },
    },
    {
      id: 'obj-wi-sunce-lives-ma-teng',
      forceId: 'ma-teng',
      primary: {
        title: { zh: '西涼之安', en: 'Liang Kept Quiet' },
        description: "Still hold Wuwei and Anding in 207. The captains of Liang each hold their own walls: they come when the court summons them and mind their own business when it does not.",
        descriptionZh: "至207年仍據武威、安定。涼州諸將各據其城,朝廷徵之則來,不徵則自守。",
        goal: { kind: 'hold-cities', cityIds: ['wuwei', 'anding'], byYear: 207 },
      },
    },
    {
      id: 'obj-wi-sunce-lives-wuhuan',
      forceId: 'wuhuan',
      primary: {
        title: { zh: '控弦南下', en: 'The Riders Come South' },
        description: "Still hold Wuhuan and Liaodong in 207. Tadun had a name for daring, and the Wuhuan of Liaoxi rode at his word.",
        descriptionZh: "至207年仍據烏丸、遼東。蹋頓有雄名,遼西烏丸皆從其號令。",
        goal: { kind: 'hold-cities', cityIds: ['wuhuan', 'liaodong'], byYear: 207 },
      },
    },
  ],

  // What if Dong Zhuo had never fallen
  'scn-whatif-dong-lives': [
    {
      id: 'obj-wi-dl-dong',
      forceId: 'dong',
      primary: {
        title: { zh: '郿塢三十年', en: 'Thirty Years in Meiwu' },
        description: "Still hold Chang'an and Luoyang in 200 — the dagger at the palace gate missed.",
        descriptionZh: "至200年仍據長安、洛陽 —— 掖門那一戟沒有刺中。",
        goal: { kind: 'hold-cities', cityIds: ['changan', 'luoyang'], byYear: 200 },
      },
      secondary: [
        {
          title: { zh: '受禪代漢', en: 'Take the Throne Outright' },
          description: 'Declare yourself emperor.',
          descriptionZh: "稱帝建號 —— 廢立既由我,何不自為之?",
          goal: { kind: 'declare-emperor' },
        },
      ],
    },
    {
      id: 'obj-wi-dl-cao',
      forceId: 'cao',
      primary: {
        title: { zh: '再舉義兵', en: 'Raise the Righteous Army Again' },
        description: 'Destroy the Dong Zhuo force by 202 — the coalition dissolved; you did not.',
        descriptionZh: "於202年前擊滅董卓 —— 關東諸侯散了,你沒散。",
        goal: { kind: 'defeat-force', forceId: 'dong', byYear: 202 },
      },
      secondary: [
        {
          title: { zh: '迎天子於長安', en: 'Fetch the Emperor Home' },
          description: "Hold Chang'an by 204.",
          descriptionZh: "於204年前攻取長安,迎天子還都。",
          goal: { kind: 'hold-cities', cityIds: ['changan'], byYear: 204 },
        },
      ],
    },
    {
      id: 'obj-wi-dl-yuanshao',
      forceId: 'yuan-shao',
      primary: {
        title: { zh: '另立天子', en: 'Enthrone Another' },
        description: 'Hold Ye and take Luoyang by 202 — if the emperor is a hostage, make a new emperor.',
        descriptionZh: "於202年前據鄴城並取洛陽 —— 天子既在賊手,不如另立一個。",
        goal: { kind: 'hold-cities', cityIds: ['ye', 'luoyang'], byYear: 202 },
      },
    },
    {
      id: 'obj-wi-dl-sun',
      forceId: 'sun',
      primary: {
        title: { zh: '孫堅入洛', en: 'Sun Jian Enters Luoyang' },
        description: 'Take Luoyang by 199 — you were the only one who actually fought Dong Zhuo.',
        descriptionZh: "於199年前攻入洛陽 —— 十八路諸侯,真打董卓的只有你一個。",
        goal: { kind: 'hold-cities', cityIds: ['luoyang'], byYear: 199 },
      },
    },
    {
      id: 'obj-wi-dl-yuanshu',
      forceId: 'yuan-shu',
      primary: {
        title: { zh: '南陽起事', en: 'Rise from Nanyang' },
        description: 'Declare yourself emperor.',
        descriptionZh: "稱帝建號。",
        goal: { kind: 'declare-emperor' },
      },
    },
    {
      id: 'obj-wi-dong-lives-liu-biao',
      forceId: 'liu-biao',
      primary: {
        title: { zh: '荊襄之守', en: 'The Jing Heartland' },
        description: "Still hold Xiangyang and Jiangling in 198. He rode into Yicheng alone and settled the province. A man for talk, they said — and Jing province did have seventeen quiet years.",
        descriptionZh: "至198年仍據襄陽、江陵。單騎入宜城而定荊州,坐談客耳 —— 守成之主,而荊州確實安了十七年。",
        goal: { kind: 'hold-cities', cityIds: ['xiangyang', 'jiangling'], byYear: 198 },
      },
    },
    {
      id: 'obj-wi-dong-lives-liu-yan',
      forceId: 'liu-yan',
      primary: {
        title: { zh: '閉關守險', en: 'Shut the Passes' },
        description: "Still hold Chengdu and Jiangzhou in 198. The diviners said Yi province had the air of a Son of Heaven — and the first thing he did was cut the plank roads.",
        descriptionZh: "至198年仍據成都、江州。望氣者言益州有天子氣 —— 而他先做的是斷絕棧道。",
        goal: { kind: 'hold-cities', cityIds: ['chengdu', 'jiangzhou'], byYear: 198 },
      },
    },
    {
      id: 'obj-wi-dong-lives-gongsun',
      forceId: 'gongsun',
      primary: {
        title: { zh: '白馬義從', en: 'The White Horse Volunteers' },
        description: "Still hold Beiping and Ji in 198. Frontier troops, used to running with the steppe horse — and after Jieqiao he drew back further every year.",
        descriptionZh: "至198年仍據北平、薊。邊地之兵,慣與胡騎相馳 —— 而界橋之後,他愈退愈深。",
        goal: { kind: 'hold-cities', cityIds: ['beiping', 'ji'], byYear: 198 },
      },
    },
    {
      id: 'obj-wi-dong-lives-tao',
      forceId: 'tao',
      primary: {
        title: { zh: '徐州安堵', en: 'Xu Province at Peace' },
        description: "Still hold Pengcheng and Xiapi in 198. Xu province is prosperous and he is old: every year it holds is a year won.",
        descriptionZh: "至198年仍據彭城、下邳。徐州殷實,而他老了,守得住一年是一年。",
        goal: { kind: 'hold-cities', cityIds: ['pengcheng', 'xiapi'], byYear: 198 },
      },
    },
    {
      id: 'obj-wi-dong-lives-kong-rong',
      forceId: 'kong-rong',
      primary: {
        title: { zh: '北海之政', en: 'The Governance of Beihai' },
        description: "Still hold Beihai and Linzi in 198. He founded schools and honoured the classics. The Turbans were outside the wall the whole time.",
        descriptionZh: "至198年仍據北海、臨淄。立學校,表顯儒術 —— 而黃巾就在城外。",
        goal: { kind: 'hold-cities', cityIds: ['beihai', 'linzi'], byYear: 198 },
      },
    },
    {
      id: 'obj-wi-dong-lives-ma-teng',
      forceId: 'ma-teng',
      primary: {
        title: { zh: '西涼之安', en: 'Liang Kept Quiet' },
        description: "Still hold Wuwei in 198. The captains of Liang each hold their own walls: they come when the court summons them and mind their own business when it does not.",
        descriptionZh: "至198年仍據武威。涼州諸將各據其城,朝廷徵之則來,不徵則自守。",
        goal: { kind: 'hold-cities', cityIds: ['wuwei'], byYear: 198 },
      },
    },
  ],

  // What if Yuan Shu's empire had held
  'scn-whatif-yuanshu-empire': [
    {
      id: 'obj-wi-ys-yuanshu',
      forceId: 'yuan-shu',
      primary: {
        title: { zh: '仲氏之世', en: 'The Reign of Zhong' },
        description: 'Still hold Shouchun and Hefei in 208 — the title stuck this time.',
        descriptionZh: "至208年仍據壽春、合肥 —— 這一次,帝號沒有變成笑話。",
        goal: { kind: 'hold-cities', cityIds: ['shouchun', 'hefei'], byYear: 208 },
      },
      secondary: [
        {
          title: { zh: '北取許都', en: 'Take Xuchang' },
          description: 'Take Xuchang by 210 — two emperors cannot share a realm.',
          descriptionZh: "於210年前攻取許昌 —— 天無二日,許都那位必須廢。",
          goal: { kind: 'hold-cities', cityIds: ['xuchang'], byYear: 210 },
        },
      ],
    },
    {
      id: 'obj-wi-ys-cao',
      forceId: 'cao',
      primary: {
        title: { zh: '討僭號者', en: 'Punish the Usurper' },
        description: 'Destroy the Yuan Shu force by 206.',
        descriptionZh: "於206年前討滅袁術 —— 名分之戰,不容拖延。",
        goal: { kind: 'defeat-force', forceId: 'yuan-shu', byYear: 206 },
      },
    },
    {
      id: 'obj-wi-ys-sun',
      forceId: 'sun',
      primary: {
        title: { zh: '不為人下', en: 'No Longer Anyone\'s Subordinate' },
        description: 'Take Shouchun and Hefei by 208 — your father\'s old master owes you a realm.',
        descriptionZh: "於208年前取壽春、合肥 —— 父親當年投的那個人,如今要還債了。",
        goal: { kind: 'hold-cities', cityIds: ['shouchun', 'hefei'], byYear: 208 },
      },
    },
    {
      id: 'obj-wi-ys-lubu',
      forceId: 'lubu',
      primary: {
        title: { zh: '轅門射戟', en: 'The Halberd at the Gate' },
        description: 'Hold Xiapi and take Shouchun by 208 — you shot the halberd to keep them apart; now take the prize.',
        descriptionZh: "於208年前守下邳並取壽春 —— 轅門射戟解了紛爭,如今自取其地。",
        goal: { kind: 'hold-cities', cityIds: ['xiapi', 'shouchun'], byYear: 208 },
      },
    },
    {
      id: 'obj-wi-ys-yuanshao',
      forceId: 'yuan-shao',
      primary: {
        title: { zh: '兄弟之爭', en: 'Brothers' },
        description: 'Take Xuchang by 208 — your half-brother wears a crown; you will need a better one.',
        descriptionZh: "於208年前攻取許昌 —— 庶弟已戴冕旒,嫡兄豈可落後。",
        goal: { kind: 'hold-cities', cityIds: ['xuchang'], byYear: 208 },
      },
    },
    {
      id: 'obj-wi-yuanshu-empire-liu-biao',
      forceId: 'liu-biao',
      primary: {
        title: { zh: '荊襄之守', en: 'The Jing Heartland' },
        description: "Still hold Xiangyang and Changsha in 204. He rode into Yicheng alone and settled the province. A man for talk, they said — and Jing province did have seventeen quiet years.",
        descriptionZh: "至204年仍據襄陽、長沙。單騎入宜城而定荊州,坐談客耳 —— 守成之主,而荊州確實安了十七年。",
        goal: { kind: 'hold-cities', cityIds: ['xiangyang', 'changsha'], byYear: 204 },
      },
    },
    {
      id: 'obj-wi-yuanshu-empire-liu-zhang',
      forceId: 'liu-zhang',
      primary: {
        title: { zh: '守此蜀土', en: 'Hold the Shu Lands' },
        description: "Still hold Chengdu and Jiangzhou in 204. A weak lord over a rich people: the trouble was never a shortage of means.",
        descriptionZh: "至204年仍據成都、江州。暗弱而民殷國富 —— 難處從來不是沒有本錢。",
        goal: { kind: 'hold-cities', cityIds: ['chengdu', 'jiangzhou'], byYear: 204 },
      },
    },
    {
      id: 'obj-wi-yuanshu-empire-gongsun',
      forceId: 'gongsun',
      primary: {
        title: { zh: '白馬義從', en: 'The White Horse Volunteers' },
        description: "Still hold Beiping and Ji in 204. Frontier troops, used to running with the steppe horse — and after Jieqiao he drew back further every year.",
        descriptionZh: "至204年仍據北平、薊。邊地之兵,慣與胡騎相馳 —— 而界橋之後,他愈退愈深。",
        goal: { kind: 'hold-cities', cityIds: ['beiping', 'ji'], byYear: 204 },
      },
    },
    {
      id: 'obj-wi-yuanshu-empire-ma-teng',
      forceId: 'ma-teng',
      primary: {
        title: { zh: '西涼之安', en: 'Liang Kept Quiet' },
        description: "Still hold Wuwei and Anding in 204. The captains of Liang each hold their own walls: they come when the court summons them and mind their own business when it does not.",
        descriptionZh: "至204年仍據武威、安定。涼州諸將各據其城,朝廷徵之則來,不徵則自守。",
        goal: { kind: 'hold-cities', cityIds: ['wuwei', 'anding'], byYear: 204 },
      },
    },
  ],

  // What if Guo Jia had lived
  'scn-whatif-guojia-lives': [
    {
      id: 'obj-wi-gj-cao',
      forceId: 'cao',
      primary: {
        title: { zh: '郭奉孝在', en: 'Had Fengxiao Been Here' },
        description: 'Take Jiangling and Jianye by 215 — "had Fengxiao lived, I would not have come to this."',
        descriptionZh: "於215年前取江陵、建業 —— 「郭奉孝在,不使孤至此。」這一次他在。",
        goal: { kind: 'hold-cities', cityIds: ['jiangling', 'jianye'], byYear: 215 },
      },
      secondary: [
        {
          title: { zh: '混一宇內', en: 'Unify the Realm' },
          description: 'Bring all under one banner.',
          descriptionZh: "混一天下。",
          goal: { kind: 'unify-realm' },
        },
      ],
    },
    {
      id: 'obj-wi-gj-sun',
      forceId: 'sun',
      primary: {
        title: { zh: '赤壁之火', en: 'The Fire at Chibi' },
        description: 'Destroy the Cao Cao force by 216 — the fire still has to be lit, and now someone is watching for it.',
        descriptionZh: "於216年前擊敗曹操 —— 火還是要放,只是這回北岸有人在等。",
        goal: { kind: 'defeat-force', forceId: 'cao', byYear: 216 },
      },
      secondary: [
        {
          title: { zh: '保有江東', en: 'Keep Jiangdong' },
          description: 'Still hold Jianye and Chaisang in 214.',
          descriptionZh: "至214年仍保建業、柴桑。",
          goal: { kind: 'hold-cities', cityIds: ['jianye', 'chaisang'], byYear: 214 },
        },
      ],
    },
    {
      id: 'obj-wi-gj-liubei',
      forceId: 'liu-bei',
      primary: {
        title: { zh: '走投何處', en: 'Where Now?' },
        description: 'Hold Jiangling by 214 and Chengdu by 218.',
        descriptionZh: "於214年前據江陵、218年前據成都 —— 對面多了一個算得比你快的人。",
        goal: { kind: 'hold-cities', cityIds: ['jiangling'], byYear: 214 },
      },
      secondary: [
        {
          title: { zh: '西入益州', en: 'West into Yi' },
          description: 'Hold Chengdu by 218.',
          descriptionZh: "於218年前攻取成都。",
          goal: { kind: 'hold-cities', cityIds: ['chengdu'], byYear: 218 },
        },
      ],
    },
    {
      id: 'obj-wi-gj-liuzhang',
      forceId: 'liu-zhang',
      primary: {
        title: { zh: '閉關自守', en: 'Shut the Passes' },
        description: "Still hold Chengdu, Jiangzhou and Luocheng in 216.",
        descriptionZh: "至216年仍據成都、江州、雒城 —— 把劍閣的門關上,外面的事與你無關。",
        goal: { kind: 'hold-cities', cityIds: ['chengdu', 'jiangzhou', 'luocheng'], byYear: 216 },
      },
      secondary: [
        {
          title: { zh: '閉關自守', en: 'Bar the Passes' },
          description: 'Control Yi province by 216.',
          descriptionZh: "於216年前盡有益州。",
          goal: { kind: 'control-province', provinceId: 'yi', byYear: 216 },
        },
      ],
    },
    {
      id: 'obj-wi-guojia-lives-liu-biao',
      forceId: 'liu-biao',
      primary: {
        title: { zh: '荊襄之守', en: 'The Jing Heartland' },
        description: "Still hold Xiangyang and Jiangling in 214. He rode into Yicheng alone and settled the province. A man for talk, they said — and Jing province did have seventeen quiet years.",
        descriptionZh: "至214年仍據襄陽、江陵。單騎入宜城而定荊州,坐談客耳 —— 守成之主,而荊州確實安了十七年。",
        goal: { kind: 'hold-cities', cityIds: ['xiangyang', 'jiangling'], byYear: 214 },
      },
    },
    {
      id: 'obj-wi-guojia-lives-zhang-lu',
      forceId: 'zhang-lu',
      primary: {
        title: { zh: '師君治漢中', en: 'The Shijun of Hanzhong' },
        description: "Still hold Hanzhong and Baxi in 214. Church and state in one hand, free rice and meat at the roadside lodges, and thirty years without an army passing through.",
        descriptionZh: "至214年仍據漢中、巴西。政教合一,置義舍米肉,三十年不見兵革。",
        goal: { kind: 'hold-cities', cityIds: ['hanzhong', 'baxi'], byYear: 214 },
      },
    },
    {
      id: 'obj-wi-guojia-lives-ma-teng',
      forceId: 'ma-teng',
      primary: {
        title: { zh: '西涼之安', en: 'Liang Kept Quiet' },
        description: "Still hold Wuwei and Tianshui in 214. The captains of Liang each hold their own walls: they come when the court summons them and mind their own business when it does not.",
        descriptionZh: "至214年仍據武威、天水。涼州諸將各據其城,朝廷徵之則來,不徵則自守。",
        goal: { kind: 'hold-cities', cityIds: ['wuwei', 'tianshui'], byYear: 214 },
      },
    },
    {
      id: 'obj-wi-guojia-lives-shi-xie',
      forceId: 'shi-xie',
      primary: {
        title: { zh: '交趾世家', en: 'The House of Jiaozhi' },
        description: "Still hold Jiaozhi and Nanhai in 214. The brothers held the commanderies between them; for over forty years the south saw no war.",
        descriptionZh: "至214年仍據交趾、南海。兄弟並為列郡守,雄長一州,四十餘年疆場無事。",
        goal: { kind: 'hold-cities', cityIds: ['jiaozhi', 'nanhai'], byYear: 214 },
      },
    },
  ],

  // What if Zhou Yu had lived
  'scn-whatif-zhouyu-lives': [
    {
      id: 'obj-wi-zy-sun',
      forceId: 'sun',
      primary: {
        title: { zh: '取蜀之策', en: "Zhou Yu's Plan for Shu" },
        description: 'Take Jiangling and Chengdu by 218 — the two-emperor plan he died before starting.',
        descriptionZh: "於218年前取江陵、成都 —— 周瑜二分天下之策,他沒來得及開始。",
        goal: { kind: 'hold-cities', cityIds: ['jiangling', 'chengdu'], byYear: 218 },
      },
      secondary: [
        {
          title: { zh: '與操分天下', en: 'Split the Realm With Cao' },
          description: "Hold Xiangyang and Chang'an by 224.",
          descriptionZh: "於224年前取襄陽、長安 —— 據襄陽以蹙操,北方可圖。",
          goal: { kind: 'hold-cities', cityIds: ['xiangyang', 'changan'], byYear: 224 },
        },
      ],
    },
    {
      id: 'obj-wi-zy-liubei',
      forceId: 'liu-bei',
      primary: {
        title: { zh: '不得借荊州', en: 'No Loan of Jing This Time' },
        description: 'Take Chengdu by 217 — Zhou Yu would never have lent you Nanjun; get to Shu first.',
        descriptionZh: "於217年前攻取成都 —— 周瑜在,南郡便借不到,只能自己搶先入蜀。",
        goal: { kind: 'hold-cities', cityIds: ['chengdu'], byYear: 217 },
      },
    },
    {
      id: 'obj-wi-zy-cao',
      forceId: 'cao',
      primary: {
        title: { zh: '拒吳於襄樊', en: 'Stop Wu at Xiangyang' },
        description: 'Still hold Xiangyang in 220, and break Sun Quan.',
        descriptionZh: "至220年仍守襄陽 —— 周瑜不死,荊北便無寧日。",
        goal: { kind: 'hold-cities', cityIds: ['xiangyang'], byYear: 220 },
      },
      secondary: [
        {
          title: { zh: '擊滅孫吳', en: 'Destroy Wu' },
          description: 'Destroy the Sun force.',
          descriptionZh: "擊滅孫吳。",
          goal: { kind: 'defeat-force', forceId: 'sun' },
        },
      ],
    },
    {
      id: 'obj-wi-zy-machao',
      forceId: 'ma-chao',
      primary: {
        title: { zh: '關中之亂', en: 'The Guanzhong Rising' },
        description: "Take Chang'an by 216.",
        descriptionZh: "於216年前攻取長安。",
        goal: { kind: 'hold-cities', cityIds: ['changan'], byYear: 216 },
      },
    },
    {
      id: 'obj-wi-zhouyu-lives-han-sui',
      forceId: 'han-sui',
      primary: {
        title: { zh: '西州自立', en: 'A Realm in the West' },
        description: "Still hold Jincheng and Tianshui in 217. Thirty years in Liang, and never once answered a summons to court.",
        descriptionZh: "至217年仍據金城、天水。在涼州三十年,一次也沒有應詔入朝。",
        goal: { kind: 'hold-cities', cityIds: ['jincheng', 'tianshui'], byYear: 217 },
      },
    },
    {
      id: 'obj-wi-zhouyu-lives-liu-zhang',
      forceId: 'liu-zhang',
      primary: {
        title: { zh: '守此蜀土', en: 'Hold the Shu Lands' },
        description: "Still hold Chengdu and Jiangzhou in 217. A weak lord over a rich people: the trouble was never a shortage of means.",
        descriptionZh: "至217年仍據成都、江州。暗弱而民殷國富 —— 難處從來不是沒有本錢。",
        goal: { kind: 'hold-cities', cityIds: ['chengdu', 'jiangzhou'], byYear: 217 },
      },
    },
    {
      id: 'obj-wi-zhouyu-lives-zhang-lu',
      forceId: 'zhang-lu',
      primary: {
        title: { zh: '師君治漢中', en: 'The Shijun of Hanzhong' },
        description: "Still hold Hanzhong and Baxi in 217. Church and state in one hand, free rice and meat at the roadside lodges, and thirty years without an army passing through.",
        descriptionZh: "至217年仍據漢中、巴西。政教合一,置義舍米肉,三十年不見兵革。",
        goal: { kind: 'hold-cities', cityIds: ['hanzhong', 'baxi'], byYear: 217 },
      },
    },
    {
      id: 'obj-wi-zhouyu-lives-shi-xie',
      forceId: 'shi-xie',
      primary: {
        title: { zh: '交趾世家', en: 'The House of Jiaozhi' },
        description: "Still hold Jiaozhi and Nanhai in 217. The brothers held the commanderies between them; for over forty years the south saw no war.",
        descriptionZh: "至217年仍據交趾、南海。兄弟並為列郡守,雄長一州,四十餘年疆場無事。",
        goal: { kind: 'hold-cities', cityIds: ['jiaozhi', 'nanhai'], byYear: 217 },
      },
    },
  ],

  // What if Pang Tong had lived
  'scn-whatif-pangtong-lives': [
    {
      id: 'obj-wi-pt-liubei',
      forceId: 'liu-bei',
      primary: {
        title: { zh: '臥龍鳳雛並在', en: 'Both the Dragon and the Phoenix' },
        description: "Take Hanzhong, Chang'an and Luoyang by 230 — with Pang Tong in Shu, Zhuge Liang is free to march.",
        descriptionZh: "於230年前取漢中、長安、洛陽 —— 鳳雛坐鎮成都,臥龍便能專心北伐。",
        goal: { kind: 'hold-cities', cityIds: ['hanzhong', 'changan', 'luoyang'], byYear: 230 },
      },
      secondary: [
        {
          title: { zh: '荊益不失其一', en: 'Lose Neither Jing nor Yi' },
          description: 'Still hold Jiangling and Chengdu in 222.',
          descriptionZh: "至222年仍兼保江陵、成都 —— 兩處都要,這是隆中對的底線。",
          goal: { kind: 'hold-cities', cityIds: ['jiangling', 'chengdu'], byYear: 222 },
        },
      ],
    },
    {
      id: 'obj-wi-pt-cao',
      forceId: 'cao',
      primary: {
        title: { zh: '西南之患', en: 'The Threat from the Southwest' },
        description: "Still hold Chang'an and Hanzhong in 225.",
        descriptionZh: "至225年仍保長安、漢中 —— 蜀中多了一個能謀的人。",
        goal: { kind: 'hold-cities', cityIds: ['changan', 'hanzhong'], byYear: 225 },
      },
      secondary: [
        {
          title: { zh: '混一宇內', en: 'Unify the Realm' },
          description: 'Bring all under one banner.',
          descriptionZh: "混一天下。",
          goal: { kind: 'unify-realm' },
        },
      ],
    },
    {
      id: 'obj-wi-pt-sun',
      forceId: 'sun',
      primary: {
        title: { zh: '荊州之爭', en: 'The Jing Question' },
        description: 'Take Jiangling by 224 and Hefei by 228.',
        descriptionZh: "於224年前取江陵、228年前取合肥。",
        goal: { kind: 'hold-cities', cityIds: ['jiangling'], byYear: 224 },
      },
      secondary: [
        {
          title: { zh: '北取合肥', en: 'Take Hefei' },
          description: 'Hold Hefei by 228.',
          descriptionZh: "於228年前攻取合肥。",
          goal: { kind: 'hold-cities', cityIds: ['hefei'], byYear: 228 },
        },
      ],
    },
    {
      id: 'obj-wi-pangtong-lives-zhang-lu',
      forceId: 'zhang-lu',
      primary: {
        title: { zh: '師君治漢中', en: 'The Shijun of Hanzhong' },
        description: "Still hold Hanzhong and Wudu in 221. Church and state in one hand, free rice and meat at the roadside lodges, and thirty years without an army passing through.",
        descriptionZh: "至221年仍據漢中、武都。政教合一,置義舍米肉,三十年不見兵革。",
        goal: { kind: 'hold-cities', cityIds: ['hanzhong', 'wudu'], byYear: 221 },
      },
    },
    {
      id: 'obj-wi-pangtong-lives-shi-xie',
      forceId: 'shi-xie',
      primary: {
        title: { zh: '交趾世家', en: 'The House of Jiaozhi' },
        description: "Still hold Jiaozhi and Nanhai in 221. The brothers held the commanderies between them; for over forty years the south saw no war.",
        descriptionZh: "至221年仍據交趾、南海。兄弟並為列郡守,雄長一州,四十餘年疆場無事。",
        goal: { kind: 'hold-cities', cityIds: ['jiaozhi', 'nanhai'], byYear: 221 },
      },
    },
    {
      id: 'obj-wi-pangtong-lives-xianbei',
      forceId: 'xianbei',
      primary: {
        title: { zh: '控弦十萬', en: 'A Hundred Thousand Bows' },
        description: "Still hold Wuhuan and Liucheng in 221. The land divided into three parts under three chieftains: they come like birds and leave like a cut string.",
        descriptionZh: "至221年仍據烏丸、柳城。分其地為三部,各置大人;來如飛鳥,去如絕弦。",
        goal: { kind: 'hold-cities', cityIds: ['wuhuan', 'liucheng'], byYear: 221 },
      },
    },
    {
      id: 'obj-wi-pangtong-lives-nanman',
      forceId: 'nanman',
      primary: {
        title: { zh: '南中之主', en: 'Lord of Nanzhong' },
        description: "Still hold Jianning and Nanzhong in 221. They trusted to distance and mountains and answered to no one. The hills are theirs.",
        descriptionZh: "至221年仍據建寧、南中。恃其險遠,不服王化 —— 山是他們的。",
        goal: { kind: 'hold-cities', cityIds: ['jianning', 'nanzhong'], byYear: 221 },
      },
    },
  ],

  // What if Guan Yu's northern campaign had succeeded
  'scn-whatif-guanyu-north': [
    {
      id: 'obj-wi-gyn-liubei',
      forceId: 'liu-bei',
      primary: {
        title: { zh: '威震華夏', en: 'His Fame Shook the Realm' },
        description: "Take Xiangyang, Xuchang and Luoyang by 228 — the water drowned Yu Jin and did not stop.",
        descriptionZh: "於228年前取襄陽、許昌、洛陽 —— 那場大水淹了于禁七軍之後,沒有停。",
        goal: { kind: 'hold-cities', cityIds: ['xiangyang', 'xuchang', 'luoyang'], byYear: 228 },
      },
      secondary: [
        {
          title: { zh: '興復漢室', en: 'Restore the Han' },
          description: 'Bring all under the Han banner.',
          descriptionZh: "混一天下。",
          goal: { kind: 'unify-realm' },
        },
      ],
    },
    {
      id: 'obj-wi-gyn-cao',
      forceId: 'cao',
      primary: {
        title: { zh: '徙都以避', en: 'Move the Capital' },
        description: 'Still hold Xuchang and Luoyang in 226 — and break the man in Jing.',
        descriptionZh: "至226年仍保許昌、洛陽 —— 遷都之議已上,你要否掉它。",
        goal: { kind: 'hold-cities', cityIds: ['xuchang', 'luoyang'], byYear: 226 },
      },
      secondary: [
        {
          title: { zh: '結好孫權', en: 'Buy Sun Quan' },
          description: 'Destroy the Liu Bei force.',
          descriptionZh: "擊滅劉備 —— 許以江南之地,則東吳可為我用。",
          goal: { kind: 'defeat-force', forceId: 'liu-bei' },
        },
      ],
    },
    {
      id: 'obj-wi-gyn-sun',
      forceId: 'sun',
      primary: {
        title: { zh: '背盟與否', en: 'To Break the Alliance, or Not' },
        description: 'Take Jiangling by 226 — the knife in the back is still available.',
        descriptionZh: "於226年前奪取江陵 —— 白衣渡江這一手,現在仍然可以打。",
        goal: { kind: 'hold-cities', cityIds: ['jiangling'], byYear: 226 },
      },
      secondary: [
        {
          title: { zh: '或取合肥', en: 'Or Take Hefei Instead' },
          description: 'Hold Hefei by 228 — the honest road north.',
          descriptionZh: "於228年前攻取合肥 —— 若不背盟,便只剩這一條路。",
          goal: { kind: 'hold-cities', cityIds: ['hefei'], byYear: 228 },
        },
      ],
    },
    {
      id: 'obj-wi-guanyu-north-xianbei',
      forceId: 'xianbei',
      primary: {
        title: { zh: '控弦十萬', en: 'A Hundred Thousand Bows' },
        description: "Still hold Wuhuan and Liaodong in 225. The land divided into three parts under three chieftains: they come like birds and leave like a cut string.",
        descriptionZh: "至225年仍據烏丸、遼東。分其地為三部,各置大人;來如飛鳥,去如絕弦。",
        goal: { kind: 'hold-cities', cityIds: ['wuhuan', 'liaodong'], byYear: 225 },
      },
    },
    {
      id: 'obj-wi-guanyu-north-nanman',
      forceId: 'nanman',
      primary: {
        title: { zh: '南中之主', en: 'Lord of Nanzhong' },
        description: "Still hold Jianning and Nanzhong in 225. They trusted to distance and mountains and answered to no one. The hills are theirs.",
        descriptionZh: "至225年仍據建寧、南中。恃其險遠,不服王化 —— 山是他們的。",
        goal: { kind: 'hold-cities', cityIds: ['jianning', 'nanzhong'], byYear: 225 },
      },
    },
  ],

  // What if Cao Shuang had struck first
  'scn-whatif-gaopingling': [
    {
      id: 'obj-wi-gpl-cao',
      forceId: 'cao',
      primary: {
        title: { zh: '先發制人', en: 'Strike First' },
        description: 'Destroy the Sima faction by 254 — the old fox was only pretending to be senile.',
        descriptionZh: "於254年前翦滅司馬氏 —— 那個老人是裝病,你這次沒有信。",
        goal: { kind: 'defeat-force', forceId: 'sima', byYear: 254 },
      },
      secondary: [
        {
          title: { zh: '曹魏不亡', en: 'Wei Endures' },
          description: 'Still hold Luoyang and Xuchang in 265 — the year Wei falls in history.',
          descriptionZh: "至265年仍保洛陽、許昌 —— 史書上,魏亡於這一年。",
          goal: { kind: 'hold-cities', cityIds: ['luoyang', 'xuchang'], byYear: 265 },
        },
      ],
    },
    {
      id: 'obj-wi-gpl-sima',
      forceId: 'sima',
      primary: {
        title: { zh: '反守為攻', en: 'Turn It Around' },
        description: 'Destroy the Cao Shuang force by 254 — you have lost the surprise; you still have the army.',
        descriptionZh: "於254年前翦滅曹爽 —— 先機已失,所恃者唯宿將與人望。",
        goal: { kind: 'defeat-force', forceId: 'cao', byYear: 254 },
      },
    },
    {
      id: 'obj-wi-gpl-shu',
      forceId: 'liu-bei',
      primary: {
        title: { zh: '中原有變', en: 'The Change in the Central Plain' },
        description: "Take Chang'an by 262 — this is the moment the Longzhong plan waited for.",
        descriptionZh: "於262年前克復長安 —— 「天下有變」,隆中對等的就是這一刻。",
        goal: { kind: 'hold-cities', cityIds: ['changan'], byYear: 262 },
      },
    },
    {
      id: 'obj-wi-gpl-wu',
      forceId: 'sun',
      primary: {
        title: { zh: '北窺淮南', en: 'Watch Huainan' },
        description: 'Take Hefei and Shouchun by 260.',
        descriptionZh: "於260年前取合肥、壽春。",
        goal: { kind: 'hold-cities', cityIds: ['hefei', 'shouchun'], byYear: 260 },
      },
    },
  ],

  // What if Lu Xun had not been hounded to death
  'scn-whatif-luxun-lives': [
    {
      id: 'obj-wi-lx-wu',
      forceId: 'sun',
      primary: {
        title: { zh: '社稷之臣', en: 'The Pillar of the State' },
        description: 'Hold Xiangyang and Shouchun by 262 — no succession purge, no letters of reproach, no death from grief.',
        descriptionZh: "於262年前取襄陽、壽春 —— 沒有二宮之爭,沒有那些責問的詔書,陸遜沒有憤恚而死。",
        goal: { kind: 'hold-cities', cityIds: ['xiangyang', 'shouchun'], byYear: 262 },
      },
      secondary: [
        {
          title: { zh: '吳祚永延', en: 'Wu Endures' },
          description: 'Survive to 285.',
          descriptionZh: "存續至285年 —— 史書上,吳亡於280年。",
          goal: { kind: 'survive-until', year: 285 },
        },
      ],
    },
    {
      id: 'obj-wi-lx-sima',
      forceId: 'sima',
      primary: {
        title: { zh: '南顧之憂', en: 'Trouble in the South' },
        description: 'Destroy the Wu force by 268 — with Lu Xun alive, the river line does not rot from within.',
        descriptionZh: "於268年前滅吳 —— 陸遜尚在,江防不會從內部爛掉。",
        goal: { kind: 'defeat-force', forceId: 'sun', byYear: 268 },
      },
      secondary: [
        {
          title: { zh: '先取洛陽', en: 'Secure the Court First' },
          description: 'Destroy the Cao Shuang force.',
          descriptionZh: "翦滅曹爽,先定內廷。",
          goal: { kind: 'defeat-force', forceId: 'cao' },
        },
      ],
    },
    {
      id: 'obj-wi-lx-cao',
      forceId: 'cao',
      primary: {
        title: { zh: '曹氏自保', en: 'Save the House of Cao' },
        description: 'Destroy the Sima faction by 254.',
        descriptionZh: "於254年前翦滅司馬氏。",
        goal: { kind: 'defeat-force', forceId: 'sima', byYear: 254 },
      },
    },
    {
      id: 'obj-wi-lx-shu',
      forceId: 'liu-bei',
      primary: {
        title: { zh: '吳蜀並力', en: 'Shu and Wu Together' },
        description: "Take Chang'an and Luoyang by 265.",
        descriptionZh: "於265年前克復長安、洛陽 —— 東線有陸遜牽制,西線正可用力。",
        goal: { kind: 'hold-cities', cityIds: ['changan', 'luoyang'], byYear: 265 },
      },
    },
  ],

  // ───────────────────────────────────────────────────────────────────────
  // Warring States. These boards reuse the Three Kingdoms map and its
  // calendar (all start in year 178), so deadlines are given in game years,
  // not the historical ones. City stand-ins: Chang'an = Xianyang,
  // Ye = Handan, Linzi = Qi's capital, Ji = Yan's, Xuchang = Xinzheng,
  // Chenliu = Daliang, Jiangling = Ying.
  // ───────────────────────────────────────────────────────────────────────

  // The seven powers
};
