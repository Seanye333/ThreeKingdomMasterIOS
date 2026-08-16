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
        description: "Survive to 226. Kebi Neng united the steppe south of the desert and was never beaten in the field — Wang Xiong had him killed by an assassin in 235.",
        descriptionZh: "存續至226年 —— 軻比能統一漠南,終其身未嘗敗於陣前;殺死他的是幽州刺史王雄派的刺客韓龍。",
        goal: { kind: 'survive-until', year: 226 },
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
      /*
       * 主次對調。`unify-realm` 是 128 座城 —— 他開局 76 座已經是全庫最大的
       * 一家,自走仍然 0/3,因為統一是這張盤的**勝利條件**,不是一條目標。
       * 而題目的名字就寫著「順流東下」:那件事是把江東殘部掃掉,三座城,
       * 無錫 3.07、臨海 1.71、會稽 1.48,全在門檻之上。
       */
      primary: {
        title: { zh: '順流東下', en: 'Down the River' },
        description: 'Destroy the Wu remnant by 215 — the wind did not turn.',
        descriptionZh: "於215年前掃滅吳之殘部 —— 東風沒有來,江東已無屏障。",
        goal: { kind: 'defeat-force', forceId: 'sun', byYear: 215 },
      },
      secondary: [
        {
          title: { zh: '混一天下', en: 'All Under One Banner' },
          description: 'Bring all under one banner.',
          descriptionZh: "混一天下 —— 十分天下已有其九。",
          goal: { kind: 'unify-realm' },
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
      /*
       * 他在這張盤上只有新野一座城,四面全是曹操(壓力 0.10–0.42),
       * 而原本的主目標是取成都 —— 中間隔著四座城,沒有一座是他打得動的。
       * 題目的名字已經說了是「無立錐之地」:那就把它寫成它本來的意思 ——
       * **活著**。取蜀留在次要,那是活下來之後的事。
       */
      primary: {
        title: { zh: '無立錐之地', en: 'Nowhere to Set a Foot' },
        description: 'Survive to 216 — Jing is lost before you ever held it, and every road out is his.',
        descriptionZh: "存續至216年 —— 荊州還沒到手就沒了,四面都是曹操的城,而你還沒有死。",
        goal: { kind: 'survive-until', year: 216 },
      },
      secondary: [
        {
          title: { zh: '不入蜀便無死所', en: 'West or Nowhere' },
          description: 'Take Chengdu by 220.',
          descriptionZh: "於220年前取成都 —— 不入蜀便無死所。",
          goal: { kind: 'hold-cities', cityIds: ['chengdu'], byYear: 220 },
        },
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
      /*
       * 改過兩次,而第一次改錯了。
       *
       * 原本是守漢中、天水到 214;上一批改成「據漢中、葭萌」,理由是葭萌的
       * 壓力值 2.31 看起來推得動 —— 而那個理由本身是錯的
       * (見 scripts/reachability-audit.ts 檔頭:壓力高不等於打得下來)。
       * 重掃結果三輪 0/3。
       *
       * 這次用 `scripts/what-they-actually-do.ts` 實測 6 輪(在手比例,
       * 開局後 +1/+2/+3/+5 年):
       *
       *   陽平關  5/6  5/6  3/6  1/6
       *   白水關  6/6  5/6  3/6  1/6
       *   漢中   2/6  0/6  0/6  0/6      ← 一年內就沒了,而且是**劉璋**拿走的
       *
       * 漢中留不住,所以主目標不能寫它。留得住的是兩道關 ——
       * 而張魯這輩子最像樣的一仗,本來就是據陽平拒曹公。
       * 「取葭萌」那條從頭到尾一個檢查點都沒成立過,降為次要。
       */
      primary: {
        title: { zh: '兩關不失', en: 'The Passes Hold' },
        description: 'Still hold the Yangping and Baishui passes in 210 — the valley may go; the passes are what a Shijun can actually keep.',
        descriptionZh: "至210年仍據陽平關、白水關 —— 谷地或許保不住,而據關拒守才是師君真做得到的事。",
        goal: { kind: 'hold-cities', cityIds: ['yangping', 'baishuiguan'], byYear: 210 },
      },
      secondary: [
        {
          title: { zh: '南下巴蜀', en: 'The Road South' },
          description: 'Take Jiameng — the road south is the only one still open.',
          descriptionZh: "取葭萌 —— 北面已經沒有指望,能走的只剩巴蜀那一條路。",
          goal: { kind: 'hold-cities', cityIds: ['jiameng'], byYear: 216 },
        },
        {
          title: { zh: '三十年不見兵革', en: 'Thirty Years Without an Army' },
          description: 'Still hold Hanzhong and Tianshui in 214.',
          descriptionZh: "至214年仍據漢中、天水。政教合一,置義舍米肉,三十年不見兵革。",
          goal: { kind: 'hold-cities', cityIds: ['hanzhong', 'tianshui'], byYear: 214 },
        },
      ],
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
      /* 江陵在黃月英手裡而壓力只有 0.46 —— 江北的廬江才是她推得動的那一座(3.11)。 */
      primary: {
        title: { zh: '侍婢百人皆執刀', en: 'A Hundred Maids, All Armed' },
        description: 'Hold Jianye and take Lujiang by 210 — Liu Bei was afraid to enter your rooms.',
        descriptionZh: "於210年前據建業、廬江 —— 房中侍婢百餘,皆親執刀侍立,劉備每入,心常凜然。",
        goal: { kind: 'hold-cities', cityIds: ['jianye', 'lujiang'], byYear: 210 },
      },
      secondary: [
        {
          title: { zh: '過江之西', en: 'West Across the River' },
          description: 'Take Jiangling by 214.',
          descriptionZh: "於214年前取江陵 —— 兄長的舊部還記得孫家的旗。",
          goal: { kind: 'hold-cities', cityIds: ['jiangling'], byYear: 214 },
        },
      ],
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
      /*
       * 建業、吳郡、柴桑三座都在孫尚香手裡,而前兩座與二喬的城**完全不相鄰**
       * (壓力 0.00/0.00/0.64)—— 江東是回不去的。她們在這張盤上據的是徐豫,
       * 推得動的是淮南那條線(壽春 1.27)。
       */
      primary: {
        title: { zh: '銅雀春深', en: 'Not for the Bronze Bird Tower' },
        description: 'Hold Pengcheng and take Shouchun by 210 — the tower in Ye was built with you in mind.',
        descriptionZh: "於210年前據彭城、壽春 —— 東風不與周郎便,銅雀春深鎖二喬;這一世沒有周郎替你們擋,那就自己把淮南按住。",
        goal: { kind: 'hold-cities', cityIds: ['pengcheng', 'shouchun'], byYear: 210 },
      },
      secondary: [
        {
          title: { zh: '重返江東', en: 'Home to the East' },
          description: 'Hold Jianye, Wu and Chaisang by 216.',
          descriptionZh: "於216年前據建業、吳、柴桑 —— 一個嫁了孫策,一個嫁了周瑜,那本來是她們的家。",
          goal: { kind: 'hold-cities', cityIds: ['jianye', 'wu', 'chaisang'], byYear: 216 },
        },
      ],
    },
    {
      id: 'obj-wi-women-bian',
      forceId: 'bian-liang',
      /*
       * 鄴與許昌一座在蔡琰手裡、一座在貂蟬手裡,而兩座都**不與她相鄰**
       * (壓力 0.00)—— 她這張盤上據的是涼州、隴右與漢中,東出的第一道門是陳倉。
       */
      primary: {
        title: { zh: '倡家女為國母', en: 'From Entertainer to Mother of a Dynasty' },
        description: 'Hold Hanzhong and take Chencang by 210 — you kept the House of Cao together when Cao Cao was thought dead.',
        descriptionZh: "於210年前據漢中、陳倉 —— 曹操凶問傳來時,是你按住了整個曹家;要從隴上走進關中,先得有陳倉這道門。",
        goal: { kind: 'hold-cities', cityIds: ['hanzhong', 'chencang'], byYear: 210 },
      },
      secondary: [
        {
          title: { zh: '鄴與許', en: 'Ye and Xu' },
          description: 'Hold Ye and Xuchang by 216.',
          descriptionZh: "於216年前據鄴城、許昌 —— 曹家的兩座都城,一座也不能少。",
          goal: { kind: 'hold-cities', cityIds: ['ye', 'xuchang'], byYear: 216 },
        },
      ],
    },
  ],

  // What if Yuan Shao had won at Guandu
  'scn-whatif-yuan-guandu': [
    {
      id: 'obj-wi-yg-yuanshao',
      forceId: 'yuan-shao',
      /*
       * 原本是「殲滅」曹操殘部,自走 0/3 —— 而三座城裡兩座壓力都在 2.5 以上,
       * 不是打不到,是**收不了尾**(§4 第 2 條:AI 收官很慢,十一條「滅某家」
       * 的主目標多半死在這裡)。改用 `break-force`:官渡贏了之後,
       * 要的是把他打回一座城,不是把他從史書上抹掉。
       */
      primary: {
        title: { zh: '併吞四海', en: 'Swallow the Four Seas' },
        description: 'Break the Cao Cao remnant down to a single city by 208 — Wuchao did not burn.',
        descriptionZh: "於208年前將曹操殘部逼到只剩一城 —— 烏巢沒有燒起來,而他還有一顆腦袋。",
        goal: { kind: 'break-force', forceId: 'cao', maxCities: 1, byYear: 208 },
      },
      secondary: [
        {
          title: { zh: '斬草除根', en: 'Root and Branch' },
          description: 'Destroy the Cao Cao remnant by 212.',
          descriptionZh: "於212年前殲滅曹操殘部 —— 沮授說過,此人不可留。",
          goal: { kind: 'defeat-force', forceId: 'cao', byYear: 212 },
        },
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
      /*
       * 江陵在劉表手裡、成都在劉璋手裡,而**兩座都與他的四座城不相鄰**
       * (壓力 0.00)。這張盤把他放在徐州(彭城、下邳、琅琊、小沛),
       * 他推得動的只有一座:譙(1.51)—— 而那是曹操的老家。
       */
      primary: {
        title: { zh: '再尋一處落腳', en: 'Another Roof, Again' },
        description: 'Hold Xiapi and take Qiao by 206 — you have outlived four patrons; find land of your own.',
        descriptionZh: "於206年前據下邳、譙 —— 依人者四矣,總該有自己的地方;而譙是曹家的祖塋所在。",
        goal: { kind: 'hold-cities', cityIds: ['xiapi', 'qiao'], byYear: 206 },
      },
      secondary: [
        {
          title: { zh: '荊益之望', en: 'Jing and Yi' },
          description: 'Hold Jiangling and Chengdu by 214.',
          descriptionZh: "於214年前據江陵、成都 —— 那兩個字他念了半輩子。",
          goal: { kind: 'hold-cities', cityIds: ['jiangling', 'chengdu'], byYear: 214 },
        },
      ],
    },
    {
      id: 'obj-wi-yg-liubiao',
      forceId: 'liu-biao',
      /*
       * 洛陽在袁紹手裡而**與荊州十八城全不相鄰**(壓力 0.00)。題目的名字是
       * 「宛洛」兩個字 —— 宛城才是他推得動的那一座(1.39,曹操殘部的城),
       * 也正是這條路真正的第一站。洛陽降為次要。
       */
      primary: {
        title: { zh: '北出宛洛', en: 'North Through Wan and Luo' },
        description: 'Hold Xiangyang and take Wancheng by 208 — with Cao Cao broken, the road north is finally open.',
        descriptionZh: "於208年前據襄陽、宛城 —— 曹操既敗,宛洛之路終於開了,而宛是第一站。",
        goal: { kind: 'hold-cities', cityIds: ['xiangyang', 'wancheng'], byYear: 208 },
      },
      secondary: [
        {
          title: { zh: '還於舊都', en: 'Back to the Old Capital' },
          description: 'Take Luoyang by 214.',
          descriptionZh: "於214年前北取洛陽 —— 漢室宗親,總該有人回一趟舊都。",
          goal: { kind: 'hold-cities', cityIds: ['luoyang'], byYear: 214 },
        },
      ],
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
      /*
       * 許昌壓力 0.82,在 AI 的候選門檻(1.05)之下 —— 而白馬 4.12、延津 3.77、
       * 官渡 2.18 全在門檻之上,那正是他南下要先過的三個渡口。
       * 主目標改寫成過河那一步,許昌降為次要。
       */
      primary: {
        title: { zh: '南下之機', en: 'The Moment to Move South' },
        description: 'Take Baima, Yanjin and Guandu by 206 — Cao Cao is pinned in the east.',
        descriptionZh: "於206年前取白馬、延津、官渡 —— 曹操東顧不暇,而黃河三個渡口就在眼前。",
        goal: { kind: 'hold-cities', cityIds: ['baima', 'yanjin', 'guandu'], byYear: 206 },
      },
      secondary: [
        {
          title: { zh: '入主許都', en: 'Take Xuchang' },
          description: 'Take Xuchang by 210.',
          descriptionZh: "於210年前攻取許昌 —— 渡口過了,許都就在南邊。",
          goal: { kind: 'hold-cities', cityIds: ['xuchang'], byYear: 210 },
        },
      ],
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
      /*
       * 原本是守長安到 218 年 —— 七年的守成,而對面是五十一城的曹操
       * (函谷關 2.06、潼關 1.30 都在門檻之上,他從東邊一路磨進來)。
       * 三輪 0/3。改成「關隴一體」:守長安**並取天水**(2.72),
       * 那是他真正要做的事,而且拿到就算,不必空守七年。
       */
      primary: {
        title: { zh: '神威天將軍', en: 'The God-Might General' },
        description: "Hold Chang'an and take Tianshui by 215 — no forged letter divided you from Han Sui.",
        descriptionZh: "於215年前據長安、天水 —— 那封塗改的書信沒有寄出,關中十部未散,隴右自當連成一片。",
        goal: { kind: 'hold-cities', cityIds: ['changan', 'tianshui'], byYear: 215 },
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
      /*
       * 「殲滅」十二城的馬超,自走 0/3 —— 又是收尾那一關(§4 第 2 條)。
       * 改用 `break-force` 壓到一城:曹操說的是「馬兒不死,吾無葬地」,
       * 而他在史書上做到的也正是把他趕出關中,不是把他殺掉。
       */
      primary: {
        title: { zh: '馬兒不死', en: '"While That Horse Lives"' },
        description: 'Break the Ma Chao force down to a single city by 217.',
        descriptionZh: "於217年前將馬超逼到只剩一城 —— 「馬兒不死,吾無葬地也。」",
        goal: { kind: 'break-force', forceId: 'ma-chao', maxCities: 1, byYear: 217 },
      },
      secondary: [
        {
          title: { zh: '斬草除根', en: 'Root and Branch' },
          description: 'Destroy the Ma Chao force by 222.',
          descriptionZh: "於222年前擊滅馬超 —— 他的父親與兩個弟弟已經死在許都。",
          goal: { kind: 'defeat-force', forceId: 'ma-chao', byYear: 222 },
        },
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
      /*
       * 四座城的題目,而他開局只有四座 —— 其中兩座(武威、安定)在馬超手裡,
       * 曝險是「窗口 × 城數」,這條兩頭都滿。壓成兩座:守金城、取安定(1.45)。
       */
      primary: {
        title: { zh: '關中十部', en: 'The Ten Camps of Guanzhong' },
        description: 'Hold Jincheng and take Anding by 214 — ten camps, each with its own walls.',
        descriptionZh: "於214年前據金城、安定 —— 十部聯軍,而各有各的城;在涼州三十年,他從來只信自己那一部。",
        goal: { kind: 'hold-cities', cityIds: ['jincheng', 'anding'], byYear: 214 },
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
      /*
       * 成都與漢中**與他任何一座城都不相鄰**(壓力 0.00)。由荊入益只有一扇門:
       * 永安。與 211 渭南盤同型、同一個修法。
       */
      primary: {
        title: { zh: '入蜀之門', en: 'The Gate into Shu' },
        description: 'Take Yong-an by 216 — with Cao Cao held in the west, the door to Shu is unguarded.',
        descriptionZh: "於216年前攻取永安 —— 曹操被牽制於關西,而由荊入益只有魚復這一扇門。",
        goal: { kind: 'hold-cities', cityIds: ['yongan'], byYear: 216 },
      },
      secondary: [
        {
          title: { zh: '西川與關中', en: 'Shu and Guanzhong' },
          description: 'Hold Chengdu and Hanzhong by 219.',
          descriptionZh: "於219年前據成都、漢中 —— 入蜀之路無人守。",
          goal: { kind: 'hold-cities', cityIds: ['chengdu', 'hanzhong'], byYear: 219 },
        },
      ],
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
      /*
       * 實測(`what-they-actually-do.ts` 6 輪,在手比例,開局後 +1/+2/+3/+5 年):
       *
       *   巴西   6/6  6/6  4/6  0/6
       *   陽平關  5/6  4/6  4/6  2/6
       *   漢中   1/6  0/6  0/6  0/6      ← 開局一年內就丟
       *   葭萌   一個檢查點都沒有在手上
       *
       * 這張盤的前提就是馬超盡得關中 —— 北面壓下來,漢中他守不住。
       * 而史書上張魯失漢中之後做的正是這件事:「奔南山入巴中」。
       * 期限壓在 212(+1 年,實測巴西 6/6、陽平關 5/6)。**+2 年那一格試過並且失敗**:
       * 邊際看起來是 6/6 與 4/6,合取卻三輪 0/3 —— 兩座城的失守是相關的,不是獨立事件,
       * 所以不能拿邊際相乘去估合取。
       */
      primary: {
        title: { zh: '奔南山入巴中', en: 'Into Ba' },
        description: 'Still hold the Yangping Pass and Baxi in 212 — Guanzhong is lost and the valley with it; what a Shijun keeps is his flock, not his capital.',
        descriptionZh: "至212年仍據陽平關、巴西 —— 關中既非我有,漢中亦難久持;師君所保者在其眾,不在其城。",
        goal: { kind: 'hold-cities', cityIds: ['yangping', 'baxi'], byYear: 212 },
      },
      secondary: [
        {
          title: { zh: '師君治漢中', en: 'The Shijun of Hanzhong' },
          description: 'Still hold Hanzhong in 214 — church and state in one hand, and the rice-measure open to all.',
          descriptionZh: "至214年仍據漢中 —— 政教合一,置義舍米肉,行者量腹取足。",
          goal: { kind: 'hold-cities', cityIds: ['hanzhong'], byYear: 214 },
        },
      ],
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
        title: { zh: '西取江夏', en: 'West to Jiangxia' },
        description: 'Hold Jianye and take Jiangxia by 206 — Huang Zu first, the way you were already going.',
        descriptionZh: "於206年前據建業、江夏 —— 遇刺那年他正在西征黃祖,那條路本來就是先荊州、後許都。",
        goal: { kind: 'hold-cities', cityIds: ['jianye', 'jiangxia'], byYear: 206 },
      },
      /*
       * 原本的主目標是襲許迎帝 —— 而那正是他**還沒來得及做**的事(壓力 0.66,
       * 在門檻之下)。準則是主目標寫他真正做到的、次要寫他沒做到的:
       * 江夏 1.38 是他當時真的在打的那一座。
       */
      secondary: [
        {
          title: { zh: '襲許迎帝', en: 'Raid Xuchang, Take the Emperor' },
          description: 'Take Xuchang by 210 — the plan you were preparing when the assassins found you.',
          descriptionZh: "於210年前襲取許昌 —— 遇刺那年,你正在做的就是這件事。",
          goal: { kind: 'hold-cities', cityIds: ['xuchang'], byYear: 210 },
        },
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
        description: 'Still hold Xuchang and Luoyang in 207 — Yuan Shao to the north, a tiger cub at your back.',
        descriptionZh: "至207年仍據許昌、洛陽 —— 北有袁紹二十一城,背後還有一頭沒有死的小老虎;先別談滅誰。",
        goal: { kind: 'hold-cities', cityIds: ['xuchang', 'luoyang'], byYear: 207 },
      },
      /*
       * 十一城要「殲滅」二十一城的袁紹,三輪 0/3 —— 而題目的名字就叫兩面受敵。
       * 主目標改成守住兩京(這張盤上洛陽、許昌都是他的),滅袁紹降為次要。
       */
      secondary: [
        {
          title: { zh: '北破袁紹', en: 'Break Yuan Shao' },
          description: 'Destroy Yuan Shao by 212.',
          descriptionZh: "於212年前擊滅袁紹 —— 官渡那一把火,這一世還沒有燒。",
          goal: { kind: 'defeat-force', forceId: 'yuan-shao', byYear: 212 },
        },
      ],
    },
    {
      id: 'obj-wi-sc-yuanshao',
      forceId: 'yuan-shao',
      primary: {
        title: { zh: '南北夾擊', en: 'The Pincer' },
        description: 'Take Guandu, Baima and Yanjin by 206 — Sun Ce comes from the south, you from the north.',
        descriptionZh: "於206年前取官渡、白馬、延津 —— 孫策自南,你自北;黃河三個渡口先過了,許都才談得上。",
        goal: { kind: 'hold-cities', cityIds: ['guandu', 'baima', 'yanjin'], byYear: 206 },
      },
      /* 許昌壓力 0.77,在門檻之下;白馬 3.89、延津 3.56、官渡 2.06 才是他過得去的地方。 */
      secondary: [
        {
          title: { zh: '入主許都', en: 'Take Xuchang' },
          description: 'Take Xuchang by 210.',
          descriptionZh: "於210年前攻取許昌 —— 曹操無以兩顧。",
          goal: { kind: 'hold-cities', cityIds: ['xuchang'], byYear: 210 },
        },
      ],
    },
    {
      id: 'obj-wi-sc-liubei',
      forceId: 'liu-bei',
      primary: {
        title: { zh: '亂中取地', en: 'Take Land in the Confusion' },
        description: 'Hold Xiapi and take Qiao by 206 — three powers at a standstill is a landless man\u2019s chance.',
        descriptionZh: "於206年前據下邳、譙 —— 三強相持,反是無地者的機會;而譙是曹家的祖塋所在。",
        goal: { kind: 'hold-cities', cityIds: ['xiapi', 'qiao'], byYear: 206 },
      },
      /* 江陵與成都跟他徐州那四座城**完全不相鄰**(壓力 0.00);譙 1.14 才是他推得動的。 */
      secondary: [
        {
          title: { zh: '荊益之望', en: 'Jing and Yi' },
          description: 'Hold Jiangling and Chengdu by 214.',
          descriptionZh: "於214年前據江陵、成都 —— 那兩個字他念了半輩子。",
          goal: { kind: 'hold-cities', cityIds: ['jiangling', 'chengdu'], byYear: 214 },
        },
      ],
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
        description: 'Still hold Xuchang and Guandu in 197 — the coalition dissolved; you did not.',
        descriptionZh: "至197年仍據許昌、官渡 —— 關東諸侯散了,你沒散;而你只有兩座城。",
        goal: { kind: 'hold-cities', cityIds: ['xuchang', 'guandu'], byYear: 197 },
      },
      /*
       * **兩座城**要殲滅十三城的董卓,三輪 0/3。而他四周沒有一座城在門檻之上
       * (彭城 0.96、譙 0.91 是最高的兩座)—— 這張盤的曹操是從谷底起家的那一個,
       * 主目標先寫成「站住」。滅董卓與迎天子留在次要。
       */
      secondary: [
        {
          title: { zh: '擊滅董卓', en: 'Destroy Dong Zhuo' },
          description: 'Destroy the Dong Zhuo force by 205.',
          descriptionZh: "於205年前擊滅董卓 —— 諸君北面,我自西向。",
          goal: { kind: 'defeat-force', forceId: 'dong', byYear: 205 },
        },
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
        title: { zh: '先定荊南', en: 'The Four Southern Commanderies' },
        description: 'Hold Changsha and take Guilin by 196 — a base before a march.',
        descriptionZh: "於196年前據長沙、桂林 —— 孫堅是長沙太守,而北伐之前總得先有一塊自己的地。",
        goal: { kind: 'hold-cities', cityIds: ['changsha', 'guilin'], byYear: 196 },
      },
      /*
       * 洛陽在董卓手裡,而**與他那三座荊南的城完全不相鄰**(壓力 0.00)——
       * 掃描三輪 0/3。入洛降為次要:那是他史書上做過的事,但要先走得到。
       */
      secondary: [
        {
          title: { zh: '孫堅入洛', en: 'Sun Jian Enters Luoyang' },
          description: 'Take Luoyang by 200 — you were the only one who actually fought Dong Zhuo.',
          descriptionZh: "於200年前攻入洛陽 —— 十八路諸侯,真打董卓的只有你一個。",
          goal: { kind: 'hold-cities', cityIds: ['luoyang'], byYear: 200 },
        },
      ],
    },
    {
      id: 'obj-wi-dl-yuanshu',
      forceId: 'yuan-shu',
      primary: {
        title: { zh: '南陽起事', en: 'Rise from Nanyang' },
        description: 'Hold Shouchun and take Xuchang by 198 — the seal is not enough; you need the boy who wears the crown.',
        descriptionZh: "於198年前據壽春、許昌 —— 玉璽在手還不夠,得先有那個戴冠的孩子。",
        goal: { kind: 'hold-cities', cityIds: ['shouchun', 'xuchang'], byYear: 198 },
      },
      /*
       * 稱帝當主目標,三輪 0/3 —— 持璽稱帝那條路(`aiCourt`)要列侯以上加八城,
       * 而 AI 幾乎摸不到那個門檻。他在這張盤上其實推得很動(小沛 2.31、
       * 下邳 1.85、許昌 1.51),主目標改成往北那一步,稱帝降為次要。
       */
      secondary: [
        {
          title: { zh: '代漢者當塗高', en: 'The One Foretold' },
          description: 'Declare yourself emperor.',
          descriptionZh: "稱帝建號 —— 「代漢者,當塗高也」,他說那四個字說的就是自己。",
          goal: { kind: 'declare-emperor' },
        },
      ],
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
        description: "Still hold Pengcheng and Xiapi in 194. Xu province is prosperous and he is old: every year it holds is a year won.",
        descriptionZh: "至194年仍據彭城、下邳。徐州殷實,而他老了,守得住一年是一年。",
        goal: { kind: 'hold-cities', cityIds: ['pengcheng', 'xiapi'], byYear: 194 },
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
        description: 'Hold Shouchun and take Xuchang by 204 — two emperors cannot share a realm.',
        descriptionZh: "於204年前據壽春、許昌 —— 天無二日;帝號要不變成笑話,許都那位必須廢。",
        goal: { kind: 'hold-cities', cityIds: ['shouchun', 'xuchang'], byYear: 204 },
      },
      /*
       * 原本是守壽春、合肥到 199 —— 開局 198,**一年的窗口**,三輪 0/3。
       * 而他在這張盤上其實推得動(許昌 1.27、小沛 1.57、下邳 1.49),
       * 主目標改成僭號之後真正該做的那件事,守兩座城降為次要。
       */
      secondary: [
        {
          title: { zh: '淮南不失', en: 'Huainan Holds' },
          description: 'Still hold Shouchun and Hefei in 200.',
          descriptionZh: "至200年仍據壽春、合肥 —— 這一次,帝號沒有變成笑話。",
          goal: { kind: 'hold-cities', cityIds: ['shouchun', 'hefei'], byYear: 200 },
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
        description: 'Hold Jianye and take Lujiang by 204 — your father\'s old master owes you a realm.',
        descriptionZh: "於204年前據建業、廬江 —— 父親當年投的那個人,如今要還債了;而廬江是他討過的第一座城。",
        goal: { kind: 'hold-cities', cityIds: ['jianye', 'lujiang'], byYear: 204 },
      },
      /* 壽春 0.62、合肥 0.65 都在門檻之下,而廬江 1.03 剛好在上面 —— 先過那一座。 */
      secondary: [
        {
          title: { zh: '淮南可取', en: 'Huainan Is There for the Taking' },
          description: 'Take Shouchun and Hefei by 208.',
          descriptionZh: "於208年前取壽春、合肥 —— 僭號者的都城。",
          goal: { kind: 'hold-cities', cityIds: ['shouchun', 'hefei'], byYear: 208 },
        },
      ],
    },
    {
      id: 'obj-wi-ys-lubu',
      forceId: 'lubu',
      primary: {
        title: { zh: '轅門射戟', en: 'The Halberd at the Gate' },
        description: 'Still hold Xiapi and Langya in 202 — you shot the halberd to keep them apart; keep what you have.',
        descriptionZh: "至202年仍據下邳、琅琊 —— 轅門射戟解了別人的紛爭,而他自己的地從來沒守過兩年。",
        goal: { kind: 'hold-cities', cityIds: ['xiapi', 'langya'], byYear: 202 },
      },
      /* 兩座城的人,而壽春 0.30、彭城 0.86、小沛 0.69 —— 他一座都推不動。 */
      secondary: [
        {
          title: { zh: '自取其地', en: 'Take the Prize' },
          description: 'Take Shouchun by 208.',
          descriptionZh: "於208年前取壽春 —— 僭號者的都城,本來也可以是他的。",
          goal: { kind: 'hold-cities', cityIds: ['shouchun'], byYear: 208 },
        },
      ],
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
        description: 'Hold Jianye and take Jiangling by 213 — the fire still has to be lit, and now someone is watching for it.',
        descriptionZh: "於213年前據建業、江陵 —— 火還是要放,只是這回北岸有人在等;而燒完之後,江陵才是那一仗真正的彩頭。",
        goal: { kind: 'hold-cities', cityIds: ['jianye', 'jiangling'], byYear: 213 },
      },
      /*
       * 十四城「殲滅」四十八城的曹操,三輪 0/3 —— 而赤壁之後孫吳真正拿到的
       * 是江陵(周瑜圍了一年)。江陵 1.30 在門檻之上,滅曹降為次要。
       */
      secondary: [
        {
          title: { zh: '北岸無曹', en: 'No Cao on the North Bank' },
          description: 'Destroy the Cao Cao force by 218.',
          descriptionZh: "於218年前擊滅曹操 —— 火還是要放。",
          goal: { kind: 'defeat-force', forceId: 'cao', byYear: 218 },
        },
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
        description: 'Still hold Xiangyang in 212 — a man for talk, they said, and Jing province did have seventeen quiet years.',
        descriptionZh: "至212年仍據襄陽。單騎入宜城而定荊州,坐談客耳 —— 守成之主,而荊州確實安了十七年。",
        goal: { kind: 'hold-cities', cityIds: ['xiangyang'], byYear: 212 },
      },
      /*
       * 原本是守襄陽、江陵到 214 —— 六年,而江北是四十八城的曹操、江東的孫權
       * 對江陵 1.30、武陵 2.45、桂陽 1.76 全在門檻之上。三輪 0/3。
       * 曝險是「窗口 × 城數」,兩頭一起收:一座城,四年。
       */
      secondary: [
        {
          title: { zh: '江陵不失', en: 'Jiangling Holds' },
          description: 'Still hold Jiangling in 214.',
          descriptionZh: "至214年仍據江陵 —— 荊州的糧、船與甲仗都在那裡。",
          goal: { kind: 'hold-cities', cityIds: ['jiangling'], byYear: 214 },
        },
      ],
    },
    {
      id: 'obj-wi-guojia-lives-zhang-lu',
      forceId: 'zhang-lu',
      primary: {
        title: { zh: '師君治漢中', en: 'The Shijun of Hanzhong' },
        description: 'Hold Hanzhong and take Jiameng by 212 — church and state in one hand, and the road south still open.',
        descriptionZh: "於212年前據漢中、葭萌 —— 政教合一,置義舍米肉;而北面是曹操,能走的只剩巴蜀那一條路。",
        goal: { kind: 'hold-cities', cityIds: ['hanzhong', 'jiameng'], byYear: 212 },
      },
      /* 三城守六年而北面是四十八城的曹操,三輪 0/3;葭萌 3.87 是他自己推得動的那一步。 */
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
        description: 'Take Jiangling by 215 — the first step of the two-realm plan he died before starting.',
        descriptionZh: "於215年前取江陵 —— 周瑜二分天下之策,第一步是從劉備手裡拿回南郡;他沒來得及開始。",
        goal: { kind: 'hold-cities', cityIds: ['jiangling'], byYear: 215 },
      },
      /*
       * 成都與他任何一座城都不相鄰(壓力 0.00),而江陵 1.12 在門檻之上 ——
       * 周瑜的二分之策本來就是「先取南郡,再圖巴蜀」。取蜀降為次要。
       */
      secondary: [
        {
          title: { zh: '西進巴蜀', en: 'On into Shu' },
          description: 'Take Chengdu by 220.',
          descriptionZh: "於220年前取成都 —— 得蜀而並張魯,結馬超為援,此周郎所言。",
          goal: { kind: 'hold-cities', cityIds: ['chengdu'], byYear: 220 },
        },
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
        description: 'Take Yong-an by 215 — Zhou Yu would never have lent you Nanjun; get to Shu first.',
        descriptionZh: "於215年前攻取永安 —— 周瑜在,南郡便借不到,只能自己搶先入蜀;而由荊入益只有魚復這一扇門。",
        goal: { kind: 'hold-cities', cityIds: ['yongan'], byYear: 215 },
      },
      /* 成都與他任何一座城都不相鄰(壓力 0.00);與 211 渭南盤同型、同一個修法。 */
      secondary: [
        {
          title: { zh: '搶先入蜀', en: 'Into Shu First' },
          description: 'Take Chengdu by 218.',
          descriptionZh: "於218年前攻取成都 —— 周瑜也在往那裡走。",
          goal: { kind: 'hold-cities', cityIds: ['chengdu'], byYear: 218 },
        },
      ],
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
        description: 'Hold Anding and take Hanzhong by 214 — where he actually went after Weinan.',
        descriptionZh: "於214年前據安定、漢中 —— 關中十部起事;而渭南之敗以後,他真正去的地方是漢中。",
        goal: { kind: 'hold-cities', cityIds: ['anding', 'hanzhong'], byYear: 214 },
      },
      /*
       * 長安在五十五城的曹操手裡而壓力只有 0.67。第一版改指金城(1.54)——
       * **`objectiveDiplomacy.test.ts` 當場擋下**:馬超與韓遂在這張盤上開局
       * 是 `allied`,那條目標從第 0 旬就是死的。改指漢中(1.09,張魯的城),
       * 而那也正是史書上他兵敗之後去投的地方。
       */
      secondary: [
        {
          title: { zh: '東取長安', en: "On to Chang'an" },
          description: "Take Chang'an by 218.",
          descriptionZh: "於218年前攻取長安 —— 渭南那一仗,這一世還沒有打。",
          goal: { kind: 'hold-cities', cityIds: ['changan'], byYear: 218 },
        },
      ],
    },
    {
      id: 'obj-wi-zhouyu-lives-han-sui',
      forceId: 'han-sui',
      primary: {
        title: { zh: '西州自立', en: 'A Realm in the West' },
        description: 'Still hold Tianshui and Shanggui in 213. Thirty years in Liang, and never once answered a summons to court.',
        descriptionZh: "至213年仍據天水、上邽。在涼州三十年,一次也沒有應詔入朝。",
        goal: { kind: 'hold-cities', cityIds: ['tianshui', 'shanggui'], byYear: 213 },
      },
      /*
       * 原本守的是金城 —— 而馬超對金城的壓力是 1.54,在門檻之上;
       * 上邽最高只被馬超的 0.94 指著。窗口一併從四年壓到兩年。
       */
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
      /*
       * 實測(`what-they-actually-do.ts` 6 輪,在手比例,開局後 +1/+2/+3/+5 年):
       *
       *   巴西   6/6  5/6  5/6  4/6
       *   陽平關  5/6  5/6  5/6  5/6
       *   漢中   **四個檢查點全部 0/6** —— 開局那幾旬就沒了
       *   葭萌   一個檢查點都沒有在手上
       *
       * 五十五城的曹操在北面,漢中是留不住的。同 machao-guanzhong:
       * 主目標寫他退得到的地方,而那正是史書上他失漢中之後去的地方。
       * 這張盤他退得比較穩(兩座都 5/6 撐到 +3 年),所以期限給到 214。
       */
      primary: {
        title: { zh: '奔南山入巴中', en: 'Into Ba' },
        description: 'Still hold the Yangping Pass and Baxi in 214 — with fifty-five cities to the north, the valley was never going to keep. What a Shijun keeps is his flock.',
        descriptionZh: "至214年仍據陽平關、巴西 —— 北面五十五城,漢中本就留不住;師君所保者在其眾,不在其城。",
        goal: { kind: 'hold-cities', cityIds: ['yangping', 'baxi'], byYear: 214 },
      },
      secondary: [
        {
          title: { zh: '師君治漢中', en: 'The Shijun of Hanzhong' },
          description: 'Still hold Hanzhong in 214 — the thing history did not let him keep.',
          descriptionZh: "至214年仍據漢中 —— 史書沒有讓他留住的那一座。",
          goal: { kind: 'hold-cities', cityIds: ['hanzhong'], byYear: 214 },
        },
      ],
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
        description: 'Take Hanzhong by 220 — with Pang Tong in Shu, Zhuge Liang is free to march.',
        descriptionZh: "於220年前取漢中 —— 鳳雛坐鎮成都,臥龍便能專心北伐;而北伐的第一步是漢中。",
        goal: { kind: 'hold-cities', cityIds: ['hanzhong'], byYear: 220 },
      },
      /* 漢中 2.09 在門檻之上,而長安、洛陽與他二十五座城**全不相鄰**(壓力 0.00)。 */
      secondary: [
        {
          title: { zh: '還於舊都', en: 'Back to the Old Capital' },
          description: "Take Chang'an and Luoyang by 230.",
          descriptionZh: "於230年前取長安、洛陽 —— 隆中對的最後一句。",
          goal: { kind: 'hold-cities', cityIds: ['changan', 'luoyang'], byYear: 230 },
        },
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
        description: 'Hold Jiangxia and take Jiangling by 228.',
        descriptionZh: "於228年前據江夏、江陵 —— 荊州這筆帳,孫吳記了二十年。",
        goal: { kind: 'hold-cities', cityIds: ['jiangxia', 'jiangling'], byYear: 228 },
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
        description: "Still hold Hanzhong and Wudu in 216. Church and state in one hand, free rice and meat at the roadside lodges, and thirty years without an army passing through.",
        descriptionZh: "至216年仍據漢中、武都。政教合一,置義舍米肉,三十年不見兵革。",
        goal: { kind: 'hold-cities', cityIds: ['hanzhong', 'wudu'], byYear: 216 },
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
        description: "Survive to 221. Kebi Neng united the steppe south of the desert and was never beaten in the field — Wang Xiong had him killed by an assassin in 235.",
        descriptionZh: "存續至221年 —— 軻比能統一漠南,終其身未嘗敗於陣前;殺死他的是幽州刺史王雄派的刺客韓龍。",
        goal: { kind: 'survive-until', year: 221 },
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
        description: 'Still hold Xiangyang and Fancheng in 224 — the water drowned Yu Jin; holding after it drains is the harder half.',
        descriptionZh: "至224年仍據襄陽、樊城 —— 那場大水淹了于禁七軍,而水退之後守得住才算數。",
        goal: { kind: 'hold-cities', cityIds: ['xiangyang', 'fancheng'], byYear: 224 },
      },
      /*
       * 許昌 0.39、洛陽 0.22,兩座都在 AI 的候選門檻之下 —— 而襄陽、樊城
       * 開局就是他的:「威震華夏」講的本來就是那場水之後他握住了荊北。
       */
      secondary: [
        {
          title: { zh: '許都震動', en: 'Xuchang Trembles' },
          description: 'Take Xuchang and Luoyang by 228.',
          descriptionZh: "於228年前取許昌、洛陽 —— 曹操議徙都以避其鋒。",
          goal: { kind: 'hold-cities', cityIds: ['xuchang', 'luoyang'], byYear: 228 },
        },
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
        description: "Survive to 225. Kebi Neng united the steppe south of the desert and was never beaten in the field — Wang Xiong had him killed by an assassin in 235.",
        descriptionZh: "存續至225年 —— 軻比能統一漠南,終其身未嘗敗於陣前;殺死他的是幽州刺史王雄派的刺客韓龍。",
        goal: { kind: 'survive-until', year: 225 },
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
        description: 'Break the Sima faction down to five cities by 256 — the old fox was only pretending to be senile.',
        descriptionZh: "於256年前將司馬氏逼到只剩五城 —— 那個老人是裝病,你這次沒有信。",
        goal: { kind: 'break-force', forceId: 'sima', maxCities: 5, byYear: 256 },
      },
      /*
       * 這張盤上兩家**互相**以 `defeat-force` 對方為主目標,於是兩邊永遠 0 ——
       * 249 歷史盤(高平陵之變)早就踩過同一個坑並修掉了,而它的兩張假想盤
       * 沿用了舊寫法。改用 `break-force`:那一天要的是把對方打回附庸,
       * 不是把一個握著二十九城的執政從史書上抹掉。
       */
      secondary: [
        {
          title: { zh: '斬草除根', en: 'Root and Branch' },
          description: 'Destroy the Sima faction by 262.',
          descriptionZh: "於262年前翦滅司馬氏 —— 夷三族,那是他們對你做過的事。",
          goal: { kind: 'defeat-force', forceId: 'sima', byYear: 262 },
        },
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
        description: 'Take Baima, Yanjin and Guandu by 256 — you have lost the surprise; you still have the army.',
        descriptionZh: "於256年前取白馬、延津、官渡 —— 先機已失,所恃者唯宿將與人望;而河南先要過得去。",
        goal: { kind: 'hold-cities', cityIds: ['baima', 'yanjin', 'guandu'], byYear: 256 },
      },
      /* 同上:二十九城要殲滅四十三城的曹爽,兩邊互相寫成 defeat-force 就是兩邊都 0。 */
      secondary: [
        {
          title: { zh: '翦滅曹爽', en: 'Destroy Cao Shuang' },
          description: 'Destroy the Cao Shuang force by 262.',
          descriptionZh: "於262年前翦滅曹爽 —— 指洛水為誓的那一天,他信了。",
          goal: { kind: 'defeat-force', forceId: 'cao', byYear: 262 },
        },
      ],
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
        description: 'Take Guangling and Jianye by 262 — with Lu Xun alive, the river line does not rot from within.',
        descriptionZh: "於262年前取廣陵、建業 —— 陸遜尚在,江防不會從內部爛掉,那就只能一寸一寸打過去。",
        goal: { kind: 'hold-cities', cityIds: ['guangling', 'jianye'], byYear: 262 },
      },
      /*
       * 「滅吳」是二十四座城的事,自走 0/3。廣陵 1.52、建業 1.17 都在門檻之上 ——
       * 過江那一步先寫成目標,滅吳降為次要。
       */
      secondary: [
        {
          title: { zh: '一統之業', en: 'The Realm Made One' },
          description: 'Destroy the Wu force by 275.',
          descriptionZh: "於275年前滅吳 —— 史書上晉滅吳是 280 年。",
          goal: { kind: 'defeat-force', forceId: 'sun', byYear: 275 },
        },
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
        description: "Still hold Chang'an and Xiangyang in 256 — the Cao name is now a province, not a court.",
        descriptionZh: "至256年仍據長安、襄陽 —— 洛陽已經不是曹家的了,關中與荊北是最後兩根柱子。",
        goal: { kind: 'hold-cities', cityIds: ['changan', 'xiangyang'], byYear: 256 },
      },
      /*
       * 二十九城要殲滅四十三城的司馬,自走 0/3;而他對司馬的城壓力最高只有
       * 0.71(太原)—— 一座都推不動。主目標改成守住自己那一半,翦滅降為次要。
       */
      secondary: [
        {
          title: { zh: '翦滅司馬', en: 'Destroy the Sima' },
          description: 'Destroy the Sima faction by 262.',
          descriptionZh: "於262年前翦滅司馬氏 —— 指洛水為誓的那一天,他信了。",
          goal: { kind: 'defeat-force', forceId: 'sima', byYear: 262 },
        },
      ],
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
