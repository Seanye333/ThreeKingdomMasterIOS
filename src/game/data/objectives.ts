import type { ScenarioObjective } from '../types';

/**
 * Per-scenario, per-force objectives. The objectives system reads this map
 * by scenarioId.forceId to find the player's current goal.
 *
 * Each scenario can declare multiple force-specific objectives so a single
 * scenario plays differently as Cao vs Liu vs Sun.
 */
export const SCENARIO_OBJECTIVES: Record<string, ScenarioObjective[]> = {
  // 184 — Yellow Turban
  'scn-184-yellow-turban': [
    {
      id: 'obj-184-han',
      forceId: 'han',
      primary: {
        title: { zh: '黃巾之鎮壓', en: 'Suppress the Yellow Turbans' },
        description: 'Defeat the Yellow Turban force entirely by 187 AD.',
        descriptionZh: "於187年前徹底擊潰黃巾軍。",
        goal: { kind: 'defeat-force', forceId: 'yellow-turban', byYear: 187 },
      },
      secondary: [
        {
          title: { zh: '名将発掘', en: 'Recruit a Future Hero' },
          description: 'Recruit Cao Cao, Liu Bei, or Sun Jian to your court.',
          descriptionZh: "招攬曹操、劉備或孫堅入仕麾下。",
          goal: { kind: 'recruit-officer', officerId: 'cao-cao' },
        },
      ],
    },
    {
      id: 'obj-184-yt',
      forceId: 'yellow-turban',
      primary: {
        title: { zh: '蒼天已死', en: 'The Blue Heaven is Dead' },
        description: 'Take Luoyang before 186 AD.',
        descriptionZh: "於186年前攻取洛陽。",
        goal: { kind: 'hold-cities', cityIds: ['luoyang'], byYear: 186 },
      },
    },
  ],

  // 190 — Anti-Dong Zhuo Coalition
  'scn-190-anti-dong-zhuo': [
    {
      id: 'obj-190-cao',
      forceId: 'cao',
      primary: {
        title: { zh: '献帝奉迎', en: 'Shelter the Emperor' },
        description: "Hold Luoyang and Xuchang by 197 AD.",
        descriptionZh: "於197年前同時據有洛陽與許昌。",
        goal: { kind: 'hold-cities', cityIds: ['luoyang', 'xuchang'], byYear: 197 },
      },
      secondary: [
        {
          title: { zh: '袁紹討伐', en: 'Defeat Yuan Shao' },
          description: 'Crush the Yuan Shao force.',
          descriptionZh: "擊潰袁紹勢力。",
          goal: { kind: 'defeat-force', forceId: 'yuan-shao' },
        },
      ],
    },
    {
      id: 'obj-190-gongsun',
      forceId: 'gongsun',
      primary: {
        title: { zh: '略地青徐', en: 'Reach South to Xuzhou' },
        description: 'Hold Pengcheng + Xiapi by 198 AD.',
        descriptionZh: "於198年前同時據有彭城與下邳,自幽州南下青徐。",
        goal: { kind: 'hold-cities', cityIds: ['pengcheng', 'xiapi'], byYear: 198 },
      },
      secondary: [
        {
          title: { zh: '界橋雪恥', en: 'Avenge Jieqiao' },
          description: 'Destroy the Yuan Shao force.',
          descriptionZh: "擊潰袁紹 —— 白馬義從喪於界橋,此讎當報。",
          goal: { kind: 'defeat-force', forceId: 'yuan-shao' },
        },
      ],
    },
    {
      id: 'obj-190-yuanshao',
      forceId: 'yuan-shao',
      primary: {
        title: { zh: '盟主之實', en: 'Make the Alliance Real' },
        description: 'Control Ji province by 199 — a chief of the alliance needs land of his own.',
        descriptionZh: "於199年前盡取冀州 —— 盟主之名,終須有盟主之土。",
        goal: { kind: 'control-province', provinceId: 'ji', byYear: 199 },
      },
      secondary: [
        {
          title: { zh: '掃平公孫', en: 'Sweep Away Gongsun Zan' },
          description: 'Destroy the Gongsun Zan force.',
          descriptionZh: "擊滅公孫瓚,盡有幽冀之地。",
          goal: { kind: 'defeat-force', forceId: 'gongsun' },
        },
      ],
    },
    {
      id: 'obj-190-yuanshu',
      forceId: 'yuan-shu',
      primary: {
        title: { zh: '南陽之富', en: 'The Wealth of Nanyang' },
        description: 'Hold Wancheng and Shouchun by 197, then take the title.',
        descriptionZh: "於197年前據宛城、壽春 —— 有此二城之富,方可言大位。",
        goal: { kind: 'hold-cities', cityIds: ['wancheng', 'shouchun'], byYear: 197 },
      },
      secondary: [
        {
          title: { zh: '僭號稱尊', en: 'Take the Title' },
          description: 'Declare yourself emperor.',
          descriptionZh: "稱帝建號 —— 史書為此記你一個「冢中枯骨」。",
          goal: { kind: 'declare-emperor' },
        },
      ],
    },
    {
      id: 'obj-190-liubiao',
      forceId: 'liu-biao',
      primary: {
        title: { zh: '單騎定荊州', en: 'One Rider, Nine Commanderies' },
        description: 'Control Jing province by 199.',
        descriptionZh: "於199年前盡有荊州 —— 單騎入宜城,竟成一方之主。",
        goal: { kind: 'control-province', provinceId: 'jing', byYear: 199 },
      },
    },
    {
      id: 'obj-190-liuyan',
      forceId: 'liu-yan',
      primary: {
        title: { zh: '益州天府', en: 'The Storehouse of Heaven' },
        description: 'Control Yi province by 200 — shut the passes and wait.',
        descriptionZh: "於200年前盡有益州 —— 閉關守險,坐待天下之變。",
        goal: { kind: 'control-province', provinceId: 'yi', byYear: 200 },
      },
    },
    {
      id: 'obj-190-tao',
      forceId: 'tao',
      primary: {
        title: { zh: '徐州安堵', en: 'Keep Xuzhou Quiet' },
        description: 'Still hold Pengcheng and Xiapi in 197.',
        descriptionZh: "至197年仍保彭城、下邳 —— 亂世之中,無事便是大功。",
        goal: { kind: 'hold-cities', cityIds: ['pengcheng', 'xiapi'], byYear: 197 },
      },
    },
    {
      id: 'obj-190-sun',
      forceId: 'sun',
      primary: {
        title: { zh: '江東統一', en: 'Unify Jiangdong' },
        description: 'Control the Yang province cities.',
        descriptionZh: "掌控揚州諸城。",
        goal: { kind: 'control-province', provinceId: 'yang', byYear: 200 },
      },
    },
    {
      id: 'obj-190-dong',
      forceId: 'dong',
      primary: {
        title: { zh: '長安遷都', en: 'Hold Chang\'an' },
        description: 'Hold Chang\'an through 195 AD.',
        descriptionZh: "於195年前持續據有長安。",
        goal: { kind: 'hold-cities', cityIds: ['changan'], byYear: 195 },
      },
    },
  ],

  // 200 — Guandu
  'scn-200-guandu': [
    {
      id: 'obj-200-cao',
      forceId: 'cao',
      primary: {
        title: { zh: '官渡之戰', en: 'Defeat Yuan Shao at Guandu' },
        description: 'Eliminate the Yuan Shao force.',
        descriptionZh: "消滅袁紹勢力。",
        goal: { kind: 'defeat-force', forceId: 'yuan-shao', byYear: 207 },
      },
    },
    {
      id: 'obj-200-yuan',
      forceId: 'yuan-shao',
      primary: {
        title: { zh: '河北統一', en: 'Conquer Cao Cao' },
        description: 'Eliminate the Cao Cao force.',
        descriptionZh: "消滅曹操勢力。",
        goal: { kind: 'defeat-force', forceId: 'cao', byYear: 207 },
      },
    },
  ],

  // 208 — Chibi
  'scn-208-chibi': [
    {
      id: 'obj-208-cao',
      forceId: 'cao',
      primary: {
        title: { zh: '南征江東', en: 'Conquer Jiangdong' },
        description: "Take all of Sun Quan's cities before 215.",
        descriptionZh: "於215年前盡取孫權所有城池。",
        goal: { kind: 'defeat-force', forceId: 'sun', byYear: 215 },
      },
    },
    {
      id: 'obj-208-sun-liu',
      forceId: 'sun',
      primary: {
        title: { zh: '赤壁之戰', en: 'Win at Red Cliffs' },
        description: 'Repel Cao Cao\'s force and survive 210 AD.',
        descriptionZh: "擊退曹操大軍,堅守至210年。",
        goal: { kind: 'survive-until', year: 210 },
      },
    },
    {
      id: 'obj-208-liu',
      forceId: 'liu-bei',
      primary: {
        title: { zh: '蜀地確立', en: 'Establish Shu' },
        description: 'Take Chengdu and Hanzhong by 220 AD.',
        descriptionZh: "於220年前同時據有成都與漢中。",
        goal: { kind: 'hold-cities', cityIds: ['chengdu', 'hanzhong'], byYear: 220 },
      },
    },
  ],

  // 220 — Three Kingdoms Declared
  'scn-220-declaration': [
    {
      id: 'obj-220-cao',
      forceId: 'cao',
      primary: {
        title: { zh: '魏之天下統一', en: 'Wei Unifies the Realm' },
        description: 'Unify all cities under Wei.',
        descriptionZh: "於魏旗之下統一天下諸城。",
        goal: { kind: 'unify-realm' },
      },
    },
    {
      id: 'obj-220-liu',
      forceId: 'liu-bei',
      primary: {
        title: { zh: '漢室再興', en: 'Restore the Han' },
        description: 'Hold Luoyang and Chang\'an at the same time.',
        descriptionZh: "同時據有洛陽與長安。",
        goal: { kind: 'hold-cities', cityIds: ['luoyang', 'changan'] },
      },
    },
    {
      id: 'obj-220-sun',
      forceId: 'sun',
      primary: {
        title: { zh: '呉皇帝即位', en: 'Sun Quan as Emperor' },
        description: 'Declare yourself Emperor (via the Court edict).',
        descriptionZh: "頒朝廷詔書,自立為帝。",
        goal: { kind: 'declare-emperor' },
      },
    },
  ],

  // 234 — Wuzhang Plains
  'scn-234-wuzhang': [
    {
      id: 'obj-234-shu',
      forceId: 'liu-bei',
      primary: {
        title: { zh: '北伐成就', en: 'Complete the Northern Campaign' },
        description: 'Take Chang\'an before Zhuge Liang dies (236 AD).',
        descriptionZh: "於諸葛亮歸天(236年)前攻取長安。",
        goal: { kind: 'hold-cities', cityIds: ['changan'], byYear: 236 },
      },
    },
    {
      id: 'obj-234-wei',
      forceId: 'cao',
      primary: {
        title: { zh: '蜀漢殲滅', en: 'Crush Shu' },
        description: 'Eliminate the Liu Bei force.',
        descriptionZh: "於245年前消滅劉備勢力。",
        goal: { kind: 'defeat-force', forceId: 'liu-bei', byYear: 245 },
      },
    },
  ],

  // 215 — Battle of Hefei
  'scn-215-hefei': [
    {
      id: 'obj-215-sun',
      forceId: 'sun',
      primary: {
        title: { zh: '攻取合肥', en: 'Take Hefei' },
        description: 'Seize Hefei by 217 — pry open the road north.',
        descriptionZh: "於217年前攻取合肥,打開北進之門。",
        goal: { kind: 'hold-cities', cityIds: ['hefei'], byYear: 217 },
      },
      secondary: [
        {
          title: { zh: '兵指壽春', en: 'March on Shouchun' },
          description: 'Hold Shouchun by 219.',
          descriptionZh: "於219年前據有壽春。",
          goal: { kind: 'hold-cities', cityIds: ['shouchun'], byYear: 219 },
        },
      ],
    },
    {
      id: 'obj-215-wei',
      forceId: 'cao',
      primary: {
        title: { zh: '張遼守合肥', en: "Zhang Liao's Stand" },
        description: 'Still hold Hefei at 217 — the legendary defense with 7,000 men.',
        descriptionZh: "以張遼七千之眾,於217年仍守住合肥,成就逍遙津傳奇。",
        goal: { kind: 'hold-cities', cityIds: ['hefei'], byYear: 217 },
      },
      secondary: [
        {
          title: { zh: '西取漢中', en: 'Take Hanzhong' },
          description: 'Take Hanzhong from Zhang Lu by 216.',
          descriptionZh: "於216年前自張魯手中取漢中。",
          goal: { kind: 'hold-cities', cityIds: ['hanzhong'], byYear: 216 },
        },
      ],
    },
    {
      id: 'obj-215-shu',
      forceId: 'liu-bei',
      primary: {
        title: { zh: '北爭漢中', en: 'Contest Hanzhong' },
        description: 'Take Hanzhong by 219 — the shield of Yi province.',
        descriptionZh: "於219年前奪取漢中,為益州之屏障。",
        goal: { kind: 'hold-cities', cityIds: ['hanzhong'], byYear: 219 },
      },
    },
    {
      id: 'obj-215-zhanglu',
      forceId: 'zhang-lu',
      primary: {
        title: { zh: '五斗自守', en: 'Hold the Faith' },
        description: 'Survive as lord of Hanzhong until 218.',
        descriptionZh: "憑五斗米道之眾,守漢中政教至218年。",
        goal: { kind: 'survive-until', year: 218 },
      },
    },
  ],

  // 219 — Hanzhong Campaign
  'scn-219-hanzhong': [
    {
      id: 'obj-219-shu',
      forceId: 'liu-bei',
      primary: {
        title: { zh: '定軍山斬夏侯', en: 'Mount Dingjun' },
        description: 'Hold Hanzhong by 220 — the road to King of Hanzhong.',
        descriptionZh: "於220年前據有漢中,黃忠斬夏侯淵,進位漢中王。",
        goal: { kind: 'hold-cities', cityIds: ['hanzhong'], byYear: 220 },
      },
      secondary: [
        {
          title: { zh: '跨有荊益', en: 'Jing and Yi Both' },
          description: 'Hold Chengdu and Jiangling together.',
          descriptionZh: "同時據有成都與江陵,跨有荊益,復隆中之策。",
          goal: { kind: 'hold-cities', cityIds: ['chengdu', 'jiangling'] },
        },
      ],
    },
    {
      id: 'obj-219-wei',
      forceId: 'cao',
      primary: {
        title: { zh: '拒漢中於秦川', en: 'Hold Hanzhong' },
        description: 'Still hold Hanzhong at 220 — keep Liu Bei out of Guanzhong.',
        descriptionZh: "於220年仍守住漢中,拒劉備於秦川之外。",
        goal: { kind: 'hold-cities', cityIds: ['hanzhong'], byYear: 220 },
      },
    },
    {
      id: 'obj-219-wu',
      forceId: 'sun',
      primary: {
        title: { zh: '白衣渡江', en: 'The White-Robed Crossing' },
        description: 'Take Jiangling by 220 — Lü Meng seizes Jing province.',
        descriptionZh: "呂蒙白衣渡江,於220年前襲取江陵,奪回荊州。",
        goal: { kind: 'hold-cities', cityIds: ['jiangling'], byYear: 220 },
      },
    },
  ],

  // 222 — Battle of Yiling
  'scn-222-yiling': [
    {
      id: 'obj-222-shu',
      forceId: 'liu-bei',
      primary: {
        title: { zh: '為關羽復仇', en: 'Avenge Guan Yu' },
        description: 'Retake Jiangling from Wu by 225 — wash away the shame of Guan Yu.',
        descriptionZh: "於225年前自東吳手中奪回江陵,以雪雲長之恨。",
        goal: { kind: 'hold-cities', cityIds: ['jiangling'], byYear: 225 },
      },
      secondary: [
        {
          title: { zh: '伐滅東吳', en: 'Destroy Wu' },
          description: 'Defeat the Sun Quan force.',
          descriptionZh: "擊潰孫權勢力,盡復荊州。",
          goal: { kind: 'defeat-force', forceId: 'sun' },
        },
      ],
    },
    {
      id: 'obj-222-wu',
      forceId: 'sun',
      primary: {
        title: { zh: '火燒連營', en: 'Burn the Camps' },
        description: 'Break Liu Bei — defeat the Shu invasion.',
        descriptionZh: "以陸遜之火,擊潰劉備伐吳之師。",
        goal: { kind: 'defeat-force', forceId: 'liu-bei' },
      },
      secondary: [
        {
          title: { zh: '固守荊州', en: 'Hold Jing Province' },
          description: 'Still hold Jiangling and Yiling by 224.',
          descriptionZh: "於224年仍據江陵與夷陵,保江東門戶。",
          goal: { kind: 'hold-cities', cityIds: ['jiangling', 'yiling'], byYear: 224 },
        },
      ],
    },
    {
      id: 'obj-222-wei',
      forceId: 'cao',
      primary: {
        title: { zh: '坐收漁利', en: 'Reap the Spoils' },
        description: 'While Shu and Wu bleed, seize Jing — hold Xiangyang and Jiangling by 226.',
        descriptionZh: "趁蜀吳相爭,南取荊襄 —— 於226年前據有襄陽與江陵。",
        goal: { kind: 'hold-cities', cityIds: ['xiangyang', 'jiangling'], byYear: 226 },
      },
      secondary: [
        {
          title: { zh: '混一宇內', en: 'Unify the Realm' },
          description: 'Bring all under Wei.',
          descriptionZh: "混一天下,成魏之大業。",
          goal: { kind: 'unify-realm' },
        },
      ],
    },
  ],

  // 189 — The Ten Attendants
  'scn-189-eunuchs': [
    {
      id: 'obj-189-hejin',
      forceId: 'han',
      primary: {
        title: { zh: '盡誅閹豎', en: 'Purge the Eunuchs' },
        description: 'Destroy the Ten Attendants by 192.',
        descriptionZh: "於192年前翦除十常侍,還政於朝。",
        goal: { kind: 'defeat-force', forceId: 'eunuchs', byYear: 192 },
      },
      secondary: [
        {
          title: { zh: '毋召外兵', en: 'Do Not Summon the Border Armies' },
          description: 'Break Dong Zhuo — the wolf you should never have called in.',
          descriptionZh: "擊潰董卓 —— 引狼入室者,終須自誅其狼。",
          goal: { kind: 'defeat-force', forceId: 'dong' },
        },
      ],
    },
    {
      id: 'obj-189-eunuchs',
      forceId: 'eunuchs',
      primary: {
        title: { zh: '挾持宮禁', en: 'Hold the Palace' },
        description: 'Still hold Luoyang in 193 — the Son of Heaven in your sleeves.',
        descriptionZh: "至193年仍據洛陽 —— 天子在袖,詔命由我。",
        goal: { kind: 'hold-cities', cityIds: ['luoyang'], byYear: 193 },
      },
    },
    {
      id: 'obj-189-dong',
      forceId: 'dong',
      primary: {
        title: { zh: '提兵入洛', en: 'March into Luoyang' },
        description: 'Take Luoyang by 192.',
        descriptionZh: "於192年前提兵入洛,執掌朝綱。",
        goal: { kind: 'hold-cities', cityIds: ['luoyang'], byYear: 192 },
      },
      secondary: [
        {
          title: { zh: '兩京在握', en: 'Both Capitals' },
          description: "Hold Luoyang and Chang'an together by 195.",
          descriptionZh: "於195年前兼據洛陽與長安,退可西守,進可東出。",
          goal: { kind: 'hold-cities', cityIds: ['luoyang', 'changan'], byYear: 195 },
        },
      ],
    },
    {
      id: 'obj-189-cao',
      forceId: 'cao',
      primary: {
        title: { zh: '奉天子以令不臣', en: 'Shelter the Son of Heaven' },
        description: 'Hold Luoyang and Xuchang by 199.',
        descriptionZh: "於199年前兼據洛陽與許昌,奉天子以令不臣。",
        goal: { kind: 'hold-cities', cityIds: ['luoyang', 'xuchang'], byYear: 199 },
      },
      secondary: [
        {
          title: { zh: '兗徐為基', en: 'Yan and Xu as the Base' },
          description: 'Hold Pengcheng and Xiapi by 199.',
          descriptionZh: "於199年前據彭城、下邳,以兗徐為根本。",
          goal: { kind: 'hold-cities', cityIds: ['pengcheng', 'xiapi'], byYear: 199 },
        },
      ],
    },
    {
      id: 'obj-189-yuanshao',
      forceId: 'yuan-shao',
      primary: {
        title: { zh: '跨有河北', en: 'Straddle the North' },
        description: 'Control Ji province by 200 — four provinces, a hundred thousand horse.',
        descriptionZh: "於200年前盡取冀州 —— 據四州之地,擁百萬之眾。",
        goal: { kind: 'control-province', provinceId: 'ji', byYear: 200 },
      },
    },
    {
      id: 'obj-189-sun',
      forceId: 'sun',
      primary: {
        title: { zh: '江東猛虎', en: 'The Tiger of Jiangdong' },
        description: 'Take Xiangyang by 196 — the wall that killed you in history.',
        descriptionZh: "於196年前攻取襄陽 —— 峴山之下,史書曾載你的死。",
        goal: { kind: 'hold-cities', cityIds: ['xiangyang'], byYear: 196 },
      },
      secondary: [
        {
          title: { zh: '荊南立業', en: 'A Seat in the South' },
          description: 'Hold Changsha and Jiangling by 198.',
          descriptionZh: "於198年前據長沙、江陵,以荊南為業。",
          goal: { kind: 'hold-cities', cityIds: ['changsha', 'jiangling'], byYear: 198 },
        },
      ],
    },
    {
      id: 'obj-189-liubiao',
      forceId: 'liu-biao',
      primary: {
        title: { zh: '坐保江漢', en: 'Keep the Han Valley' },
        description: 'Still hold Xiangyang, Jiangling and Jiangxia in 205.',
        descriptionZh: "至205年仍據襄陽、江陵、江夏 —— 守成之主,亦是一種答案。",
        goal: { kind: 'hold-cities', cityIds: ['xiangyang', 'jiangling', 'jiangxia'], byYear: 205 },
      },
    },
  ],

  // 192 — Wang Yun's chained stratagem
  'scn-192-wangyun': [
    {
      id: 'obj-192-han',
      forceId: 'han',
      primary: {
        title: { zh: '除卓餘燼', en: 'Finish What the Dagger Started' },
        description: 'Destroy the Li Jue force by 196 — Dong Zhuo is dead, his army is not.',
        descriptionZh: "於196年前翦滅李傕 —— 董卓已死,其眾未散。",
        goal: { kind: 'defeat-force', forceId: 'lijue', byYear: 196 },
      },
      secondary: [
        {
          title: { zh: '守漢舊都', en: "Hold Chang'an" },
          description: "Still hold Chang'an in 196.",
          descriptionZh: "至196年仍據長安,不使乘輿再度播遷。",
          goal: { kind: 'hold-cities', cityIds: ['changan'], byYear: 196 },
        },
      ],
    },
    {
      id: 'obj-192-lubu',
      forceId: 'lubu',
      primary: {
        title: { zh: '飛將求地', en: 'A Land for the Flying General' },
        description: 'Hold Luoyang and Hulao by 196 — you have a halberd, not a home.',
        descriptionZh: "於196年前據洛陽、虎牢 —— 有戟無土,終為客將。",
        goal: { kind: 'hold-cities', cityIds: ['luoyang', 'hulao'], byYear: 196 },
      },
    },
    {
      id: 'obj-192-lijue',
      forceId: 'lijue',
      primary: {
        title: { zh: '還都長安', en: "Retake Chang'an" },
        description: "Take Chang'an by 195 — avenge the Grand Preceptor.",
        descriptionZh: "於195年前攻取長安,為太師復仇。",
        goal: { kind: 'hold-cities', cityIds: ['changan'], byYear: 195 },
      },
    },
    {
      id: 'obj-192-cao',
      forceId: 'cao',
      primary: {
        title: { zh: '迎駕許都', en: 'Bring the Emperor to Xuchang' },
        description: "Hold Xuchang and Chang'an by 198.",
        descriptionZh: "於198年前兼據許昌與長安,迎天子而定名分。",
        goal: { kind: 'hold-cities', cityIds: ['xuchang', 'changan'], byYear: 198 },
      },
    },
    {
      id: 'obj-192-yuanshu',
      forceId: 'yuan-shu',
      primary: {
        title: { zh: '玉璽在手', en: 'The Seal is Mine' },
        description: 'Declare yourself emperor — the Imperial Seal came to your hand for a reason.',
        descriptionZh: "稱帝建號 —— 傳國玉璽既入吾手,豈非天意?",
        goal: { kind: 'declare-emperor' },
      },
      secondary: [
        {
          title: { zh: '淮南根本', en: 'The Huainan Base' },
          description: 'Still hold Shouchun in 199 — where history says you starved.',
          descriptionZh: "至199年仍據壽春 —— 史載你正是死在這座城裡。",
          goal: { kind: 'hold-cities', cityIds: ['shouchun'], byYear: 199 },
        },
      ],
    },
    {
      id: 'obj-192-gongsun',
      forceId: 'gongsun',
      primary: {
        title: { zh: '白馬義從', en: 'The White Horse Volunteers' },
        description: 'Control You province by 199, then break Yuan Shao.',
        descriptionZh: "於199年前盡有幽州,再圖河北。",
        goal: { kind: 'control-province', provinceId: 'you', byYear: 199 },
      },
      secondary: [
        {
          title: { zh: '河北決勝', en: 'Break Yuan Shao' },
          description: 'Destroy the Yuan Shao force.',
          descriptionZh: "擊潰袁紹 —— 界橋之恥,當於此雪。",
          goal: { kind: 'defeat-force', forceId: 'yuan-shao' },
        },
      ],
    },
  ],

  // 194 — Governor of Xuzhou
  'scn-194-xuzhou': [
    {
      id: 'obj-194-cao',
      forceId: 'cao',
      primary: {
        title: { zh: '報父之讎', en: 'Avenge Your Father' },
        description: 'Take Pengcheng and Xiapi by 198.',
        descriptionZh: "於198年前攻取彭城、下邳 —— 父讎在徐州。",
        goal: { kind: 'hold-cities', cityIds: ['pengcheng', 'xiapi'], byYear: 198 },
      },
      secondary: [
        {
          title: { zh: '定兗州之亂', en: 'Put Down the Yan Revolt' },
          description: 'Destroy Lü Bu — he took your province while you marched east.',
          descriptionZh: "擊滅呂布 —— 你東征之時,他偷了你的兗州。",
          goal: { kind: 'defeat-force', forceId: 'lubu' },
        },
      ],
    },
    {
      id: 'obj-194-tao',
      forceId: 'tao',
      primary: {
        title: { zh: '徐州不失', en: 'Xuzhou Shall Not Fall' },
        description: 'Still hold Pengcheng and Xiapi in 198.',
        descriptionZh: "至198年仍保彭城、下邳 —— 老病之身,守得一方是一方。",
        goal: { kind: 'hold-cities', cityIds: ['pengcheng', 'xiapi'], byYear: 198 },
      },
    },
    {
      id: 'obj-194-lubu',
      forceId: 'lubu',
      primary: {
        title: { zh: '奪兗取徐', en: 'Yan First, Then Xu' },
        description: 'Hold Puyang and Xiapi by 199.',
        descriptionZh: "於199年前兼據濮陽、下邳,自濮陽起,終於下邳。",
        goal: { kind: 'hold-cities', cityIds: ['puyang', 'xiapi'], byYear: 199 },
      },
    },
    {
      id: 'obj-194-yuanshao',
      forceId: 'yuan-shao',
      primary: {
        title: { zh: '河北一統', en: 'Master of the North' },
        description: 'Control Ji province by 201.',
        descriptionZh: "於201年前盡取冀州。",
        goal: { kind: 'control-province', provinceId: 'ji', byYear: 201 },
      },
      secondary: [
        {
          title: { zh: '南向許都', en: 'March South' },
          description: 'Take Xuchang by 205.',
          descriptionZh: "於205年前南取許昌。",
          goal: { kind: 'hold-cities', cityIds: ['xuchang'], byYear: 205 },
        },
      ],
    },
    {
      id: 'obj-194-yuanshu',
      forceId: 'yuan-shu',
      primary: {
        title: { zh: '仲氏之業', en: 'The House of Zhong' },
        description: 'Declare yourself emperor.',
        descriptionZh: "稱帝建號,國號仲氏。",
        goal: { kind: 'declare-emperor' },
      },
    },
    {
      id: 'obj-194-mateng',
      forceId: 'ma-teng',
      primary: {
        title: { zh: '西涼鐵騎', en: 'The Iron Horse of Liang' },
        description: 'Control Liang province by 202.',
        descriptionZh: "於202年前盡有涼州,鐵騎出隴。",
        goal: { kind: 'control-province', provinceId: 'liang', byYear: 202 },
      },
    },
  ],

  // 195 — Sun Ce takes Jiangdong
  'scn-195-jiangdong': [
    {
      id: 'obj-195-sun',
      forceId: 'sun',
      primary: {
        title: { zh: '江東六郡', en: 'The Six Commanderies' },
        description: 'Hold Jianye, Wu, Kuaiji and Yuzhang by 200 — with a thousand borrowed men.',
        descriptionZh: "於200年前盡取建業、吳、會稽、豫章 —— 以千餘借兵,取江東六郡。",
        goal: { kind: 'hold-cities', cityIds: ['jianye', 'wu', 'kuaiji', 'yuzhang'], byYear: 200 },
      },
      secondary: [
        {
          title: { zh: '掃平劉繇', en: 'Sweep Away Liu Yao' },
          description: 'Destroy the Liu Yao force.',
          descriptionZh: "擊滅劉繇,拔曲阿之根。",
          goal: { kind: 'defeat-force', forceId: 'liu-yao' },
        },
      ],
    },
    {
      id: 'obj-195-liuyao',
      forceId: 'liu-yao',
      primary: {
        title: { zh: '守曲阿', en: 'Hold the Line at Qu\'e' },
        description: 'Still hold Jianye in 199 — the little tyrant is coming.',
        descriptionZh: "至199年仍據建業 —— 小霸王已渡江而來。",
        goal: { kind: 'hold-cities', cityIds: ['jianye'], byYear: 199 },
      },
    },
    {
      id: 'obj-195-huaxin',
      forceId: 'hua-xin',
      primary: {
        title: { zh: '豫章自保', en: 'Keep Yuzhang' },
        description: 'Still hold Yuzhang and Chaisang in 200.',
        descriptionZh: "至200年仍保豫章、柴桑 —— 名士守土,亦須刀兵。",
        goal: { kind: 'hold-cities', cityIds: ['yuzhang', 'chaisang'], byYear: 200 },
      },
    },
    {
      id: 'obj-195-cao',
      forceId: 'cao',
      primary: {
        title: { zh: '決戰河北', en: 'Settle It With Yuan Shao' },
        description: 'Destroy the Yuan Shao force by 207.',
        descriptionZh: "於207年前擊滅袁紹,定河北之局。",
        goal: { kind: 'defeat-force', forceId: 'yuan-shao', byYear: 207 },
      },
      secondary: [
        {
          title: { zh: '官渡不失', en: 'Hold Guandu' },
          description: 'Still hold Guandu in 202.',
          descriptionZh: "至202年仍守官渡 —— 此地一失,許都無險。",
          goal: { kind: 'hold-cities', cityIds: ['guandu'], byYear: 202 },
        },
      ],
    },
    {
      id: 'obj-195-yuanshao',
      forceId: 'yuan-shao',
      primary: {
        title: { zh: '南下許都', en: 'Take Xuchang' },
        description: 'Take Xuchang by 203.',
        descriptionZh: "於203年前南下攻取許昌,挾天子者當易人。",
        goal: { kind: 'hold-cities', cityIds: ['xuchang'], byYear: 203 },
      },
    },
    {
      id: 'obj-195-yuanshu',
      forceId: 'yuan-shu',
      primary: {
        title: { zh: '僭號稱尊', en: 'Take the Title' },
        description: 'Declare yourself emperor.',
        descriptionZh: "稱帝建號。",
        goal: { kind: 'declare-emperor' },
      },
    },
  ],

  // 197 — The Bohai front
  'scn-197-bohai': [
    {
      id: 'obj-197-cao',
      forceId: 'cao',
      primary: {
        title: { zh: '北破袁紹', en: 'Break Yuan Shao' },
        description: 'Destroy the Yuan Shao force by 207.',
        descriptionZh: "於207年前擊滅袁紹 —— 以弱擊強,勝負在人不在眾。",
        goal: { kind: 'defeat-force', forceId: 'yuan-shao', byYear: 207 },
      },
      secondary: [
        {
          title: { zh: '取鄴定冀', en: 'Take Ye' },
          description: 'Hold Ye by 208.',
          descriptionZh: "於208年前攻下鄴城,河北遂定。",
          goal: { kind: 'hold-cities', cityIds: ['ye'], byYear: 208 },
        },
      ],
    },
    {
      id: 'obj-197-yuanshao',
      forceId: 'yuan-shao',
      primary: {
        title: { zh: '飲馬黃河', en: 'Water the Horses at the Yellow River' },
        description: 'Take Xuchang by 203.',
        descriptionZh: "於203年前攻取許昌 —— 十萬之眾,不當渡不得一河。",
        goal: { kind: 'hold-cities', cityIds: ['xuchang'], byYear: 203 },
      },
      secondary: [
        {
          title: { zh: '併吞公孫', en: 'Swallow Gongsun Zan' },
          description: 'Destroy the Gongsun Zan force by 201.',
          descriptionZh: "於201年前滅公孫瓚,盡有幽冀。",
          goal: { kind: 'defeat-force', forceId: 'gongsun', byYear: 201 },
        },
      ],
    },
    {
      id: 'obj-197-gongsun',
      forceId: 'gongsun',
      primary: {
        title: { zh: '易京樓不焚', en: 'The Tower Shall Not Burn' },
        description: 'Still hold Yi County in 202 — history gives you until 199.',
        descriptionZh: "至202年仍守易縣 —— 史書只給了你到199年。",
        goal: { kind: 'hold-cities', cityIds: ['yi-county'], byYear: 202 },
      },
    },
    {
      id: 'obj-197-sun',
      forceId: 'sun',
      primary: {
        title: { zh: '全有揚州', en: 'All of Yang' },
        description: 'Control Yang province by 204.',
        descriptionZh: "於204年前盡有揚州。",
        goal: { kind: 'control-province', provinceId: 'yang', byYear: 204 },
      },
    },
    {
      id: 'obj-197-lubu',
      forceId: 'lu-bu',
      primary: {
        title: { zh: '徐州為家', en: 'Xuzhou for a Home' },
        description: 'Hold Xiapi and Pengcheng by 201.',
        descriptionZh: "於201年前兼據下邳、彭城,終得一塊自己的地。",
        goal: { kind: 'hold-cities', cityIds: ['xiapi', 'pengcheng'], byYear: 201 },
      },
    },
  ],

  // 198 — The siege of Xiapi
  'scn-198-xiapi': [
    {
      id: 'obj-198-cao',
      forceId: 'cao',
      primary: {
        title: { zh: '白門樓', en: 'The White Gate Tower' },
        description: 'Destroy the Lü Bu force by 200.',
        descriptionZh: "於200年前擊滅呂布 —— 決沂泗之水,白門樓上見分曉。",
        goal: { kind: 'defeat-force', forceId: 'lubu', byYear: 200 },
      },
      secondary: [
        {
          title: { zh: '收降飛將', en: 'Take the Flying General Alive' },
          description: 'Recruit Lü Bu into your service.',
          descriptionZh: "招降呂布為己用 —— 縱虎為患,亦或如虎添翼。",
          goal: { kind: 'recruit-officer', officerId: 'lu-bu' },
        },
      ],
    },
    {
      id: 'obj-198-lubu',
      forceId: 'lubu',
      primary: {
        title: { zh: '下邳不陷', en: 'Xiapi Shall Not Fall' },
        description: 'Hold Xiapi and take Pengcheng by 202.',
        descriptionZh: "於202年前守住下邳並攻下彭城 —— 困守必死,唯有向外。",
        goal: { kind: 'hold-cities', cityIds: ['xiapi', 'pengcheng'], byYear: 202 },
      },
    },
    {
      id: 'obj-198-yuanshao',
      forceId: 'yuan-shao',
      primary: {
        title: { zh: '席捲中原', en: 'Roll Up the Central Plain' },
        description: 'Take Xuchang by 204.',
        descriptionZh: "於204年前攻取許昌。",
        goal: { kind: 'hold-cities', cityIds: ['xuchang'], byYear: 204 },
      },
    },
    {
      id: 'obj-198-sun',
      forceId: 'sun',
      primary: {
        title: { zh: '據江東以觀天下', en: 'Watch the Realm from Jiangdong' },
        description: 'Control Yang province by 204.',
        descriptionZh: "於204年前盡有揚州,坐觀中原之變。",
        goal: { kind: 'control-province', provinceId: 'yang', byYear: 204 },
      },
    },
    {
      id: 'obj-198-yuanshu',
      forceId: 'yuan-shu',
      primary: {
        title: { zh: '仲氏不亡', en: 'Zhong Shall Not Fall' },
        description: 'Still hold Shouchun in 202 — history gives you until 199.',
        descriptionZh: "至202年仍據壽春 —— 史書只給了你到199年。",
        goal: { kind: 'hold-cities', cityIds: ['shouchun'], byYear: 202 },
      },
    },
  ],

  // 199 — The siege of Yijing
  'scn-199-yijing': [
    {
      id: 'obj-199-yuanshao',
      forceId: 'yuan-shao',
      primary: {
        title: { zh: '拔易京', en: 'Storm Yijing' },
        description: 'Destroy the Gongsun Zan force by 202.',
        descriptionZh: "於202年前滅公孫瓚,拔其樓堞。",
        goal: { kind: 'defeat-force', forceId: 'gongsun', byYear: 202 },
      },
      secondary: [
        {
          title: { zh: '併有幽州', en: 'Take You Province' },
          description: 'Control You province by 205.',
          descriptionZh: "於205年前盡有幽州。",
          goal: { kind: 'control-province', provinceId: 'you', byYear: 205 },
        },
      ],
    },
    {
      id: 'obj-199-gongsun',
      forceId: 'gongsun',
      primary: {
        title: { zh: '樓堞猶存', en: 'The Towers Still Stand' },
        description: 'Still hold Yi County and Beiping in 203.',
        descriptionZh: "至203年仍保易縣、北平 —— 積穀三百萬斛,守到天下事定。",
        goal: { kind: 'hold-cities', cityIds: ['yi-county', 'beiping'], byYear: 203 },
      },
    },
    {
      id: 'obj-199-cao',
      forceId: 'cao',
      primary: {
        title: { zh: '官渡決機', en: 'Decide It at Guandu' },
        description: 'Destroy the Yuan Shao force by 207.',
        descriptionZh: "於207年前擊滅袁紹。",
        goal: { kind: 'defeat-force', forceId: 'yuan-shao', byYear: 207 },
      },
    },
    {
      id: 'obj-199-sun',
      forceId: 'sun',
      primary: {
        title: { zh: '江東基業', en: 'The Jiangdong Inheritance' },
        description: 'Control Yang province by 205.',
        descriptionZh: "於205年前盡有揚州,守父兄之業。",
        goal: { kind: 'control-province', provinceId: 'yang', byYear: 205 },
      },
    },
    {
      id: 'obj-199-liubiao',
      forceId: 'liu-biao',
      primary: {
        title: { zh: '荊襄九郡', en: 'The Nine Commanderies of Jing' },
        description: 'Control Jing province by 206.',
        descriptionZh: "於206年前盡有荊州九郡。",
        goal: { kind: 'control-province', provinceId: 'jing', byYear: 206 },
      },
    },
  ],

  // 204 — The fall of Ye
  'scn-204-yecheng': [
    {
      id: 'obj-204-cao',
      forceId: 'cao',
      primary: {
        title: { zh: '決漳水以灌鄴', en: 'Flood Ye' },
        description: 'Take Ye by 207.',
        descriptionZh: "於207年前攻下鄴城 —— 決漳水,圍之半年。",
        goal: { kind: 'hold-cities', cityIds: ['ye'], byYear: 207 },
      },
      secondary: [
        {
          title: { zh: '袁氏俱滅', en: 'End the House of Yuan' },
          description: 'Destroy the Yuan Shang force.',
          descriptionZh: "翦滅袁尚,袁氏之嗣遂絕。",
          goal: { kind: 'defeat-force', forceId: 'yuan-shang' },
        },
      ],
    },
    {
      id: 'obj-204-yuanshang',
      forceId: 'yuan-shang',
      primary: {
        title: { zh: '鄴城固守', en: 'Hold Ye' },
        description: 'Still hold Ye in 208.',
        descriptionZh: "至208年仍據鄴城 —— 父之基業,不可失於我手。",
        goal: { kind: 'hold-cities', cityIds: ['ye'], byYear: 208 },
      },
      secondary: [
        {
          title: { zh: '併兄之眾', en: 'Absorb Your Brother' },
          description: 'Destroy the Yuan Tan force — brothers first, Cao Cao after.',
          descriptionZh: "擊滅袁譚 —— 兄弟鬩牆在先,曹操在後。",
          goal: { kind: 'defeat-force', forceId: 'yuan-tan' },
        },
      ],
    },
    {
      id: 'obj-204-yuantan',
      forceId: 'yuan-tan',
      primary: {
        title: { zh: '長子當立', en: 'The Eldest Son Should Rule' },
        description: 'Destroy the Yuan Shang force — you were born first.',
        descriptionZh: "擊滅袁尚 —— 立嫡以長,何以廢我?",
        goal: { kind: 'defeat-force', forceId: 'yuan-shang' },
      },
      secondary: [
        {
          title: { zh: '入主鄴城', en: 'Take Ye for Yourself' },
          description: 'Hold Ye by 208.',
          descriptionZh: "於208年前入主鄴城。",
          goal: { kind: 'hold-cities', cityIds: ['ye'], byYear: 208 },
        },
      ],
    },
    {
      id: 'obj-204-sun',
      forceId: 'sun',
      primary: {
        title: { zh: '西進荊州', en: 'West into Jing' },
        description: 'Take Jiangxia and Jiangling by 210.',
        descriptionZh: "於210年前西取江夏、江陵 —— 父讎在黃祖,門戶在荊州。",
        goal: { kind: 'hold-cities', cityIds: ['jiangxia', 'jiangling'], byYear: 210 },
      },
    },
    {
      id: 'obj-204-liubiao',
      forceId: 'liu-biao',
      primary: {
        title: { zh: '守此荊土', en: 'Guard the Jing Soil' },
        description: 'Still hold Xiangyang and Jiangling in 210 — history gives you until 208.',
        descriptionZh: "至210年仍保襄陽、江陵 —— 史書只給了你到208年。",
        goal: { kind: 'hold-cities', cityIds: ['xiangyang', 'jiangling'], byYear: 210 },
      },
    },
    {
      id: 'obj-204-zhanglu',
      forceId: 'zhang-lu',
      primary: {
        title: { zh: '五斗米道', en: 'The Way of Five Pecks' },
        description: 'Still hold Hanzhong in 212, and take Chengdu.',
        descriptionZh: "至212年仍據漢中,並取成都 —— 政教合一,師君臨蜀。",
        goal: { kind: 'hold-cities', cityIds: ['hanzhong', 'chengdu'], byYear: 212 },
      },
    },
    {
      id: 'obj-204-shixie',
      forceId: 'shi-xie',
      primary: {
        title: { zh: '交州王', en: 'King of Jiao' },
        description: 'Control Jiao province by 210.',
        descriptionZh: "於210年前盡有交州 —— 嶺南一隅,亦可自王。",
        goal: { kind: 'control-province', provinceId: 'jiao', byYear: 210 },
      },
    },
  ],

  // 207 — The three visits to the thatched hut
  'scn-207-three-visits': [
    {
      id: 'obj-207tv-cao',
      forceId: 'cao',
      primary: {
        title: { zh: '南下荊襄', en: 'South into Jing' },
        description: 'Take Xiangyang and Jiangling by 211.',
        descriptionZh: "於211年前南取襄陽、江陵 —— 北方既定,當飲馬長江。",
        goal: { kind: 'hold-cities', cityIds: ['xiangyang', 'jiangling'], byYear: 211 },
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
      id: 'obj-207tv-sun',
      forceId: 'sun',
      primary: {
        title: { zh: '全據長江', en: 'The Whole Length of the River' },
        description: 'Take Jiangxia and Jiangling by 213 — Lu Su\'s plan: hold the river entire.',
        descriptionZh: "於213年前取江夏、江陵 —— 魯肅之策:竟長江所極而據守之。",
        goal: { kind: 'hold-cities', cityIds: ['jiangxia', 'jiangling'], byYear: 213 },
      },
      secondary: [
        {
          title: { zh: '盡有揚州', en: 'All of Yang' },
          description: 'Control Yang province by 213.',
          descriptionZh: "於213年前盡有揚州。",
          goal: { kind: 'control-province', provinceId: 'yang', byYear: 213 },
        },
      ],
    },
    {
      id: 'obj-207tv-liubiao',
      forceId: 'liu-biao',
      primary: {
        title: { zh: '三顧得人', en: 'Three Visits, One Sleeping Dragon' },
        description: 'Recruit Zhuge Liang — he is farming in Longzhong, in your province.',
        descriptionZh: "招得諸葛亮 —— 臥龍就在你的隆中躬耕,劉備尚未三顧。",
        goal: { kind: 'recruit-officer', officerId: 'zhuge-liang' },
      },
      secondary: [
        {
          title: { zh: '荊土不失', en: 'Jing Shall Not Be Handed Over' },
          description: 'Still hold Xiangyang and Jiangling in 212 — history has your son surrender them.',
          descriptionZh: "至212年仍保襄陽、江陵 —— 史書上,你的兒子把它們拱手送人。",
          goal: { kind: 'hold-cities', cityIds: ['xiangyang', 'jiangling'], byYear: 212 },
        },
      ],
    },
    {
      id: 'obj-207tv-liuzhang',
      forceId: 'liu-zhang',
      primary: {
        title: { zh: '守此蜀土', en: 'Keep the Shu Basin' },
        description: 'Control Yi province by 214 — and never invite a guest with an army.',
        descriptionZh: "於214年前盡有益州 —— 並且,永遠不要迎一個帶兵的客人入蜀。",
        goal: { kind: 'control-province', provinceId: 'yi', byYear: 214 },
      },
    },
    {
      id: 'obj-207tv-zhanglu',
      forceId: 'zhang-lu',
      primary: {
        title: { zh: '師君治漢中', en: 'The Teacher-Lord of Hanzhong' },
        description: 'Still hold Hanzhong and Yangping in 216 — history gives you until 215.',
        descriptionZh: "至216年仍據漢中、陽平 —— 史書只給了你到215年。",
        goal: { kind: 'hold-cities', cityIds: ['hanzhong', 'yangping'], byYear: 216 },
      },
    },
    {
      id: 'obj-207tv-mateng',
      forceId: 'ma-teng',
      primary: {
        title: { zh: '不入許都', en: 'Do Not Go to Xuchang' },
        description: 'Control Liang province by 213 — in history you accepted a court post and died for it.',
        descriptionZh: "於213年前盡有涼州 —— 史書上,你應召入朝,闔門遇害。",
        goal: { kind: 'control-province', provinceId: 'liang', byYear: 213 },
      },
    },
    {
      id: 'obj-207tv-shixie',
      forceId: 'shi-xie',
      primary: {
        title: { zh: '交趾世家', en: 'The House of Jiaozhi' },
        description: 'Control Jiao province by 212.',
        descriptionZh: "於212年前盡有交州。",
        goal: { kind: 'control-province', provinceId: 'jiao', byYear: 212 },
      },
    },
  ],

  // 207 — White Wolf Mountain, the northern campaign
  'scn-207-bailang': [
    {
      id: 'obj-207bl-cao',
      forceId: 'cao',
      primary: {
        title: { zh: '白狼山之戰', en: 'The Battle of White Wolf Mountain' },
        description: 'Destroy the Wuhuan force by 210 — cut the last Yuan refuge.',
        descriptionZh: "於210年前擊滅烏桓 —— 斷袁氏最後之奧援。",
        goal: { kind: 'defeat-force', forceId: 'wuhuan', byYear: 210 },
      },
      secondary: [
        {
          title: { zh: '取柳城', en: 'Take Liucheng' },
          description: 'Hold Liucheng by 210.',
          descriptionZh: "於210年前攻下柳城 —— 千里奔襲,輕兵掩其不備。",
          goal: { kind: 'hold-cities', cityIds: ['liucheng'], byYear: 210 },
        },
      ],
    },
    {
      id: 'obj-207bl-wuhuan',
      forceId: 'wuhuan',
      primary: {
        title: { zh: '踏頓南下', en: 'Tadun Rides South' },
        description: 'Take Beiping by 211 — strike before the Han army reaches the steppe.',
        descriptionZh: "於211年前攻取北平 —— 與其待其深入,不如先發南下。",
        goal: { kind: 'hold-cities', cityIds: ['beiping'], byYear: 211 },
      },
    },
    {
      id: 'obj-207bl-sun',
      forceId: 'sun',
      primary: {
        title: { zh: '西進取荊', en: 'West to Jing' },
        description: 'Take Jiangxia and Jiangling by 213.',
        descriptionZh: "於213年前西取江夏、江陵。",
        goal: { kind: 'hold-cities', cityIds: ['jiangxia', 'jiangling'], byYear: 213 },
      },
    },
    {
      id: 'obj-207bl-liubiao',
      forceId: 'liu-biao',
      primary: {
        title: { zh: '北伐許都', en: 'Strike at Xuchang' },
        description: 'Take Xuchang by 213 — Liu Bei urged it while Cao Cao marched north.',
        descriptionZh: "於213年前攻取許昌 —— 曹操北征之際,劉備曾勸你襲許,你沒有動。",
        goal: { kind: 'hold-cities', cityIds: ['xuchang'], byYear: 213 },
      },
    },
    {
      id: 'obj-207bl-liuzhang',
      forceId: 'liu-zhang',
      primary: {
        title: { zh: '益州自守', en: 'Hold Yi Alone' },
        description: 'Control Yi province by 214.',
        descriptionZh: "於214年前盡有益州。",
        goal: { kind: 'control-province', provinceId: 'yi', byYear: 214 },
      },
    },
  ],

  // 211 — Battle of Weinan
  'scn-211-weinan': [
    {
      id: 'obj-211-cao',
      forceId: 'cao',
      primary: {
        title: { zh: '離間關中', en: 'Sow Discord in Guanzhong' },
        description: 'Destroy the Ma Chao force by 215.',
        descriptionZh: "於215年前擊滅馬超 —— 抹書間韓遂,關中十部自潰。",
        goal: { kind: 'defeat-force', forceId: 'ma-chao', byYear: 215 },
      },
      secondary: [
        {
          title: { zh: '固守長安', en: "Hold Chang'an" },
          description: "Still hold Chang'an in 215.",
          descriptionZh: "至215年仍據長安。",
          goal: { kind: 'hold-cities', cityIds: ['changan'], byYear: 215 },
        },
      ],
    },
    {
      id: 'obj-211-machao',
      forceId: 'ma-chao',
      primary: {
        title: { zh: '奪取長安', en: "Take Chang'an" },
        description: "Take Chang'an by 215 — avenge your father.",
        descriptionZh: "於215年前攻取長安 —— 父兄之讎,不共戴天。",
        goal: { kind: 'hold-cities', cityIds: ['changan'], byYear: 215 },
      },
      secondary: [
        {
          title: { zh: '盡有涼州', en: 'All of Liang' },
          description: 'Control Liang province by 217.',
          descriptionZh: "於217年前盡有涼州 —— 羌胡皆從,號為神威天將軍。",
          goal: { kind: 'control-province', provinceId: 'liang', byYear: 217 },
        },
      ],
    },
    {
      id: 'obj-211-hansui',
      forceId: 'han-sui',
      primary: {
        title: { zh: '西州自立', en: 'A Realm of My Own in the West' },
        description: 'Control Liang province by 217 — thirty years in Guanzhong, always someone else\'s ally.',
        descriptionZh: "於217年前盡有涼州 —— 縱橫關中三十年,總是別人的盟友。",
        goal: { kind: 'control-province', provinceId: 'liang', byYear: 217 },
      },
    },
    {
      id: 'obj-211-liubei',
      forceId: 'liu-bei',
      primary: {
        title: { zh: '西取益州', en: 'Take Yi Province' },
        description: 'Take Chengdu by 216 — the Longzhong plan, second half.',
        descriptionZh: "於216年前攻取成都 —— 隆中對的下半篇。",
        goal: { kind: 'hold-cities', cityIds: ['chengdu'], byYear: 216 },
      },
      secondary: [
        {
          title: { zh: '跨有荊益', en: 'Straddle Jing and Yi' },
          description: 'Hold Jiangling and Chengdu together by 218.',
          descriptionZh: "於218年前兼據江陵與成都 —— 跨有荊益,則霸業可成。",
          goal: { kind: 'hold-cities', cityIds: ['jiangling', 'chengdu'], byYear: 218 },
        },
      ],
    },
    {
      id: 'obj-211-sun',
      forceId: 'sun',
      primary: {
        title: { zh: '北取合肥', en: 'Take Hefei' },
        description: 'Take Hefei by 217 — the wall Sun Quan never got over.',
        descriptionZh: "於217年前攻取合肥 —— 孫權一生沒有翻過的那堵牆。",
        goal: { kind: 'hold-cities', cityIds: ['hefei'], byYear: 217 },
      },
    },
    {
      id: 'obj-211-liuzhang',
      forceId: 'liu-zhang',
      primary: {
        title: { zh: '勿迎劉備', en: 'Do Not Invite Liu Bei' },
        description: 'Still hold Chengdu in 216 — history has you open the gate yourself.',
        descriptionZh: "至216年仍據成都 —— 史書上,是你自己開的城門。",
        goal: { kind: 'hold-cities', cityIds: ['chengdu'], byYear: 216 },
      },
    },
    {
      id: 'obj-211-zhanglu',
      forceId: 'zhang-lu',
      primary: {
        title: { zh: '漢中不下', en: 'Hanzhong Holds' },
        description: 'Still hold Hanzhong in 216 — history gives you until 215.',
        descriptionZh: "至216年仍據漢中 —— 史書只給了你到215年。",
        goal: { kind: 'hold-cities', cityIds: ['hanzhong'], byYear: 216 },
      },
    },
  ],

  // 213 — Fallen Phoenix Slope
  'scn-213-fengpo': [
    {
      id: 'obj-213-liubei',
      forceId: 'liu-bei',
      primary: {
        title: { zh: '進取成都', en: 'On to Chengdu' },
        description: 'Take Luocheng and Chengdu by 217 — the road Pang Tong died on.',
        descriptionZh: "於217年前攻下雒城、成都 —— 龐統死在這條路上。",
        goal: { kind: 'hold-cities', cityIds: ['luocheng', 'chengdu'], byYear: 217 },
      },
      secondary: [
        {
          title: { zh: '鳳雛不隕', en: 'Keep the Fledgling Phoenix' },
          description: 'Still have Pang Tong in your service.',
          descriptionZh: "使龐統仍在麾下 —— 落鳳坡的那一箭,未必非中不可。",
          goal: { kind: 'recruit-officer', officerId: 'pang-tong' },
        },
      ],
    },
    {
      id: 'obj-213-liuzhang',
      forceId: 'liu-zhang',
      primary: {
        title: { zh: '驅逐客兵', en: 'Drive Out the Guest Army' },
        description: 'Destroy the Liu Bei force by 218.',
        descriptionZh: "於218年前擊滅劉備 —— 引之入蜀者我,逐之出蜀者亦當是我。",
        goal: { kind: 'defeat-force', forceId: 'liu-bei', byYear: 218 },
      },
      secondary: [
        {
          title: { zh: '成都不開', en: 'Chengdu Keeps Its Gate Shut' },
          description: 'Still hold Chengdu in 218.',
          descriptionZh: "至218年仍據成都。",
          goal: { kind: 'hold-cities', cityIds: ['chengdu'], byYear: 218 },
        },
      ],
    },
    {
      id: 'obj-213-cao',
      forceId: 'cao',
      primary: {
        title: { zh: '先取漢中', en: 'Hanzhong First' },
        description: 'Take Hanzhong by 217 — get there before Liu Bei does.',
        descriptionZh: "於217年前攻取漢中 —— 得隴之後,是否望蜀?",
        goal: { kind: 'hold-cities', cityIds: ['hanzhong'], byYear: 217 },
      },
    },
    {
      id: 'obj-213-sun',
      forceId: 'sun',
      primary: {
        title: { zh: '索還荊州', en: 'Demand Jing Back' },
        description: 'Take Jiangling by 219.',
        descriptionZh: "於219年前取回江陵 —— 借出去的荊州,總要討回來。",
        goal: { kind: 'hold-cities', cityIds: ['jiangling'], byYear: 219 },
      },
    },
    {
      id: 'obj-213-zhanglu',
      forceId: 'zhang-lu',
      primary: {
        title: { zh: '據險自保', en: 'Hold the Passes' },
        description: 'Still hold Hanzhong in 217.',
        descriptionZh: "至217年仍據漢中。",
        goal: { kind: 'hold-cities', cityIds: ['hanzhong'], byYear: 217 },
      },
    },
  ],

  // 214 — Master of Xichuan
  'scn-214-xichuan': [
    {
      id: 'obj-214-liubei',
      forceId: 'liu-bei',
      primary: {
        title: { zh: '入主西川', en: 'Master of Xichuan' },
        description: 'Control Yi province by 218.',
        descriptionZh: "於218年前盡有益州 —— 隆中對之半,今日始成。",
        goal: { kind: 'control-province', provinceId: 'yi', byYear: 218 },
      },
      secondary: [
        {
          title: { zh: '北定漢中', en: 'Take Hanzhong' },
          description: 'Hold Hanzhong by 220.',
          descriptionZh: "於220年前據有漢中 —— 蜀之咽喉,不可假人。",
          goal: { kind: 'hold-cities', cityIds: ['hanzhong'], byYear: 220 },
        },
      ],
    },
    {
      id: 'obj-214-liuzhang',
      forceId: 'liu-zhang',
      primary: {
        title: { zh: '成都堅守', en: 'Chengdu Holds' },
        description: 'Still hold Chengdu in 219 — the city had three years of grain and wanted to fight.',
        descriptionZh: "至219年仍據成都 —— 城中尚有三年之糧,吏民咸欲死戰。",
        goal: { kind: 'hold-cities', cityIds: ['chengdu'], byYear: 219 },
      },
    },
    {
      id: 'obj-214-cao',
      forceId: 'cao',
      primary: {
        title: { zh: '得隴望蜀', en: 'Having Long, Covet Shu' },
        description: 'Take Hanzhong by 217, then Chengdu.',
        descriptionZh: "於217年前取漢中,再下成都 —— 人苦無足,既得隴,復望蜀。",
        goal: { kind: 'hold-cities', cityIds: ['hanzhong', 'chengdu'], byYear: 220 },
      },
    },
    {
      id: 'obj-214-sun',
      forceId: 'sun',
      primary: {
        title: { zh: '湘水劃界', en: 'The Xiang River Line' },
        description: 'Take Jiangling by 220.',
        descriptionZh: "於220年前取江陵 —— 湘水之盟只是暫緩,荊州終須一決。",
        goal: { kind: 'hold-cities', cityIds: ['jiangling'], byYear: 220 },
      },
    },
    {
      id: 'obj-214-zhanglu',
      forceId: 'zhang-lu',
      primary: {
        title: { zh: '漢中猶在', en: 'Hanzhong Endures' },
        description: 'Still hold Hanzhong in 218.',
        descriptionZh: "至218年仍據漢中。",
        goal: { kind: 'hold-cities', cityIds: ['hanzhong'], byYear: 218 },
      },
    },
  ],

  // 218 — Mount Dingjun, the Hanzhong campaign
  'scn-218-dingjun': [
    {
      id: 'obj-218-liubei',
      forceId: 'liu-bei',
      primary: {
        title: { zh: '定軍山', en: 'Mount Dingjun' },
        description: 'Hold Hanzhong and Yangping by 221.',
        descriptionZh: "於221年前據漢中、陽平 —— 老將黃忠一刀斬夏侯,漢中遂為我有。",
        goal: { kind: 'hold-cities', cityIds: ['hanzhong', 'yangping'], byYear: 221 },
      },
      secondary: [
        {
          title: { zh: '進位漢中王', en: 'King of Hanzhong' },
          description: 'Declare yourself emperor once Hanzhong is yours.',
          descriptionZh: "既得漢中,遂即尊位。",
          goal: { kind: 'declare-emperor' },
        },
      ],
    },
    {
      id: 'obj-218-cao',
      forceId: 'cao',
      primary: {
        title: { zh: '雞肋之地', en: 'Chicken Ribs' },
        description: 'Still hold Hanzhong in 221 — tasteless to eat, a pity to throw away.',
        descriptionZh: "至221年仍據漢中 —— 食之無肉,棄之有味,楊修因此死。",
        goal: { kind: 'hold-cities', cityIds: ['hanzhong'], byYear: 221 },
      },
      secondary: [
        {
          title: { zh: '擊滅劉備', en: 'Destroy Liu Bei' },
          description: 'Destroy the Liu Bei force.',
          descriptionZh: "擊滅劉備。",
          goal: { kind: 'defeat-force', forceId: 'liu-bei' },
        },
      ],
    },
    {
      id: 'obj-218-sun',
      forceId: 'sun',
      primary: {
        title: { zh: '襲取荊州', en: 'Seize Jing' },
        description: 'Take Jiangling by 222 — while Guan Yu looks north.',
        descriptionZh: "於222年前襲取江陵 —— 趁關羽北望之時。",
        goal: { kind: 'hold-cities', cityIds: ['jiangling'], byYear: 222 },
      },
      secondary: [
        {
          title: { zh: '合肥之志', en: 'Hefei Again' },
          description: 'Take Hefei by 224.',
          descriptionZh: "於224年前攻取合肥。",
          goal: { kind: 'hold-cities', cityIds: ['hefei'], byYear: 224 },
        },
      ],
    },
  ],

  // 221 — The founding of Shu-Han
  'scn-221-shu-emperor': [
    {
      id: 'obj-221-shu',
      forceId: 'liu-bei',
      primary: {
        title: { zh: '還於舊都', en: 'Return to the Old Capital' },
        description: "Take Chang'an and Luoyang by 240 — the Han restored is the whole point.",
        descriptionZh: "於240年前克復長安、洛陽 —— 漢賊不兩立,王業不偏安。",
        goal: { kind: 'hold-cities', cityIds: ['changan', 'luoyang'], byYear: 240 },
      },
      secondary: [
        {
          title: { zh: '復取荊州', en: 'Retake Jing' },
          description: 'Hold Jiangling by 226.',
          descriptionZh: "於226年前奪回江陵 —— 雲長之讎,荊州之失。",
          goal: { kind: 'hold-cities', cityIds: ['jiangling'], byYear: 226 },
        },
      ],
    },
    {
      id: 'obj-221-wei',
      forceId: 'cao',
      primary: {
        title: { zh: '受禪定鼎', en: 'The Mandate Received' },
        description: 'Bring all under Wei.',
        descriptionZh: "混一天下 —— 受漢之禪,便當有一統之實。",
        goal: { kind: 'unify-realm' },
      },
      secondary: [
        {
          title: { zh: '南取江陵', en: 'Take Jiangling' },
          description: 'Hold Jiangling by 230.',
          descriptionZh: "於230年前南取江陵。",
          goal: { kind: 'hold-cities', cityIds: ['jiangling'], byYear: 230 },
        },
      ],
    },
    {
      id: 'obj-221-wu',
      forceId: 'sun',
      primary: {
        title: { zh: '保江東而稱尊', en: 'Hold the River, Take the Title' },
        description: 'Declare yourself emperor — last of the three to do it, and the most careful.',
        descriptionZh: "稱帝建號 —— 三家之中稱帝最晚,也活得最久。",
        goal: { kind: 'declare-emperor' },
      },
      secondary: [
        {
          title: { zh: '荊襄在握', en: 'Jing and Xiang' },
          description: 'Hold Jiangling and Xiangyang by 232.',
          descriptionZh: "於232年前兼據江陵、襄陽 —— 全據長江,方可久安。",
          goal: { kind: 'hold-cities', cityIds: ['jiangling', 'xiangyang'], byYear: 232 },
        },
      ],
    },
  ],

  // 225 — The southern campaign
  'scn-225-southern': [
    {
      id: 'obj-225-shu',
      forceId: 'liu-bei',
      primary: {
        title: { zh: '七擒孟獲', en: 'Seven Captures' },
        description: 'Destroy the Nanman force by 229 — take the hearts, not just the ground.',
        descriptionZh: "於229年前平定南蠻 —— 攻心為上,七縱而後可。",
        goal: { kind: 'defeat-force', forceId: 'nanman', byYear: 229 },
      },
      secondary: [
        {
          title: { zh: '南定而後北伐', en: 'South Settled, Then North' },
          description: "Take Chang'an by 240.",
          descriptionZh: "於240年前北取長安 —— 南方已定,兵甲已足。",
          goal: { kind: 'hold-cities', cityIds: ['changan'], byYear: 240 },
        },
      ],
    },
    {
      id: 'obj-225-nanman',
      forceId: 'nanman',
      primary: {
        title: { zh: '北上成都', en: 'North to Chengdu' },
        description: 'Take Chengdu by 232 — refuse to be pacified.',
        descriptionZh: "於232年前攻取成都 —— 不服王化,便打到成都去。",
        goal: { kind: 'hold-cities', cityIds: ['chengdu'], byYear: 232 },
      },
    },
    {
      id: 'obj-225-wei',
      forceId: 'cao',
      primary: {
        title: { zh: '乘虛伐蜀', en: 'Strike While Shu Marches South' },
        description: 'Take Hanzhong by 232.',
        descriptionZh: "於232年前攻取漢中 —— 諸葛南征,蜀北空虛。",
        goal: { kind: 'hold-cities', cityIds: ['hanzhong'], byYear: 232 },
      },
    },
    {
      id: 'obj-225-wu',
      forceId: 'sun',
      primary: {
        title: { zh: '合肥新城', en: 'Hefei Once More' },
        description: 'Take Hefei by 234.',
        descriptionZh: "於234年前攻取合肥。",
        goal: { kind: 'hold-cities', cityIds: ['hefei'], byYear: 234 },
      },
    },
  ],

  // 228 — The battle of Jieting
  'scn-228-jieting': [
    {
      id: 'obj-228jt-shu',
      forceId: 'liu-bei',
      primary: {
        title: { zh: '街亭不失', en: 'Jieting Must Hold' },
        description: 'Hold Jieting and Tianshui by 233 — do not camp on the hill.',
        descriptionZh: "於233年前據街亭、天水 —— 當道下寨,勿屯南山。",
        goal: { kind: 'hold-cities', cityIds: ['jieting', 'tianshui'], byYear: 233 },
      },
      secondary: [
        {
          title: { zh: '克復長安', en: "Take Chang'an" },
          description: "Take Chang'an by 240.",
          descriptionZh: "於240年前克復長安。",
          goal: { kind: 'hold-cities', cityIds: ['changan'], byYear: 240 },
        },
      ],
    },
    {
      id: 'obj-228jt-wei',
      forceId: 'cao',
      primary: {
        title: { zh: '拒蜀於隴右', en: 'Stop Them at Longyou' },
        description: "Still hold Chang'an and Tianshui in 236.",
        descriptionZh: "至236年仍保長安、天水 —— 三郡叛應,張郃須疾行。",
        goal: { kind: 'hold-cities', cityIds: ['changan', 'tianshui'], byYear: 236 },
      },
      secondary: [
        {
          title: { zh: '滅蜀', en: 'Destroy Shu' },
          description: 'Destroy the Shu force.',
          descriptionZh: "擊滅蜀漢。",
          goal: { kind: 'defeat-force', forceId: 'liu-bei' },
        },
      ],
    },
    {
      id: 'obj-228jt-wu',
      forceId: 'sun',
      primary: {
        title: { zh: '東西並舉', en: 'Strike from the East' },
        description: 'Take Hefei by 236 — while Wei looks west.',
        descriptionZh: "於236年前攻取合肥 —— 魏之目光在西,則東可乘。",
        goal: { kind: 'hold-cities', cityIds: ['hefei'], byYear: 236 },
      },
    },
  ],

  // 228 — The battle of Shiting
  'scn-228-shiting': [
    {
      id: 'obj-228st-wu',
      forceId: 'sun',
      primary: {
        title: { zh: '詐降誘敵', en: 'The False Defection' },
        description: 'Take Hefei and Shouchun by 236 — Zhou Fang cut his hair to sell the lie.',
        descriptionZh: "於236年前取合肥、壽春 —— 周魴斷髮賺曹休。",
        goal: { kind: 'hold-cities', cityIds: ['hefei', 'shouchun'], byYear: 236 },
      },
      secondary: [
        {
          title: { zh: '即皇帝位', en: 'Take the Title' },
          description: 'Declare yourself emperor.',
          descriptionZh: "稱帝建號 —— 石亭一勝,遂有黃龍改元。",
          goal: { kind: 'declare-emperor' },
        },
      ],
    },
    {
      id: 'obj-228st-wei',
      forceId: 'cao',
      primary: {
        title: { zh: '淮南不失', en: 'Huainan Holds' },
        description: 'Still hold Hefei and Shouchun in 236.',
        descriptionZh: "至236年仍保合肥、壽春 —— 曹休輕進,幾覆全軍。",
        goal: { kind: 'hold-cities', cityIds: ['hefei', 'shouchun'], byYear: 236 },
      },
    },
    {
      id: 'obj-228st-shu',
      forceId: 'liu-bei',
      primary: {
        title: { zh: '再出祁山', en: 'Out from Qishan Again' },
        description: "Take Chang'an by 240.",
        descriptionZh: "於240年前克復長安。",
        goal: { kind: 'hold-cities', cityIds: ['changan'], byYear: 240 },
      },
    },
  ],

  // 229 — Three emperors
  'scn-229-three-emperors': [
    {
      id: 'obj-229-wei',
      forceId: 'cao',
      primary: {
        title: { zh: '中原正統', en: 'The Legitimate Centre' },
        description: 'Bring all under Wei.',
        descriptionZh: "混一天下 —— 據中原十州之富,本當如此。",
        goal: { kind: 'unify-realm' },
      },
      secondary: [
        {
          title: { zh: '先滅蜀漢', en: 'Shu First' },
          description: 'Destroy the Shu force by 250.',
          descriptionZh: "於250年前擊滅蜀漢。",
          goal: { kind: 'defeat-force', forceId: 'liu-bei', byYear: 250 },
        },
      ],
    },
    {
      id: 'obj-229-shu',
      forceId: 'liu-bei',
      primary: {
        title: { zh: '漢賊不兩立', en: 'Han and Traitor Cannot Both Stand' },
        description: "Take Chang'an and Luoyang by 245.",
        descriptionZh: "於245年前克復長安、洛陽。",
        goal: { kind: 'hold-cities', cityIds: ['changan', 'luoyang'], byYear: 245 },
      },
      secondary: [
        {
          title: { zh: '出隴右', en: 'Into Longyou' },
          description: 'Hold Tianshui by 238.',
          descriptionZh: "於238年前據天水,斷隴右之路。",
          goal: { kind: 'hold-cities', cityIds: ['tianshui'], byYear: 238 },
        },
      ],
    },
    {
      id: 'obj-229-wu',
      forceId: 'sun',
      primary: {
        title: { zh: '全據長江', en: 'The Whole River' },
        description: 'Hold Jiangling, Xiangyang and Hefei by 245.',
        descriptionZh: "於245年前兼據江陵、襄陽、合肥 —— 長江之險,與人共之則不險。",
        goal: { kind: 'hold-cities', cityIds: ['jiangling', 'xiangyang', 'hefei'], byYear: 245 },
      },
    },
    {
      id: 'obj-229-gongsun',
      forceId: 'gongsun',
      primary: {
        title: { zh: '燕王之號', en: 'King of Yan' },
        description: 'Declare yourself emperor — Liaodong has been its own country for forty years.',
        descriptionZh: "稱帝建號 —— 遼東割據四十年,何必為人臣?",
        goal: { kind: 'declare-emperor' },
      },
      secondary: [
        {
          title: { zh: '襄平不陷', en: 'Xiangping Shall Not Fall' },
          description: 'Still hold Xiangping in 245 — history sends Sima Yi in 238.',
          descriptionZh: "至245年仍據襄平 —— 史書上,司馬懿238年就來了。",
          goal: { kind: 'hold-cities', cityIds: ['xiangping'], byYear: 245 },
        },
      ],
    },
  ],

  // 231 — The battle of Lucheng
  'scn-231-lucheng': [
    {
      id: 'obj-231-shu',
      forceId: 'liu-bei',
      primary: {
        title: { zh: '甲首三千', en: 'Three Thousand Helmets' },
        description: "Take Tianshui and Chang'an by 240 — the one field battle Sima Yi lost outright.",
        descriptionZh: "於240年前取天水、長安 —— 鹵城一戰,獲甲首三千,司馬懿自此斂兵。",
        goal: { kind: 'hold-cities', cityIds: ['tianshui', 'changan'], byYear: 240 },
      },
      secondary: [
        {
          title: { zh: '糧不誤期', en: 'The Grain Must Not Be Late' },
          description: 'Hold Hanzhong through 240 — Li Yan\'s late supply ended this campaign.',
          descriptionZh: "至240年仍固守漢中 —— 上一次退兵,是因為李嚴的糧沒到。",
          goal: { kind: 'hold-cities', cityIds: ['hanzhong'], byYear: 240 },
        },
      ],
    },
    {
      id: 'obj-231-wei',
      forceId: 'cao',
      primary: {
        title: { zh: '斂兵依險', en: 'Fortify and Wait' },
        description: "Still hold Chang'an and Tianshui in 240 — refuse battle, let the grain run out.",
        descriptionZh: "至240年仍保長安、天水 —— 不與交鋒,待其糧盡自退。",
        goal: { kind: 'hold-cities', cityIds: ['changan', 'tianshui'], byYear: 240 },
      },
    },
    {
      id: 'obj-231-wu',
      forceId: 'sun',
      primary: {
        title: { zh: '淮南之圖', en: 'Designs on Huainan' },
        description: 'Take Hefei by 240.',
        descriptionZh: "於240年前攻取合肥。",
        goal: { kind: 'hold-cities', cityIds: ['hefei'], byYear: 240 },
      },
    },
  ],

  // 238 — Liaodong, the siege of Xiangping
  'scn-238-liaodong': [
    {
      id: 'obj-238-wei',
      forceId: 'cao',
      primary: {
        title: { zh: '克日擒淵', en: 'Take Gongsun Yuan on Schedule' },
        description: 'Destroy the Yan force by 241 — a hundred days out, a hundred back, a hundred to fight.',
        descriptionZh: "於241年前滅公孫淵 —— 往百日,還百日,攻百日,以六十日為休息。",
        goal: { kind: 'defeat-force', forceId: 'yan', byYear: 241 },
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
      id: 'obj-238-yan',
      forceId: 'yan',
      primary: {
        title: { zh: '燕祚不絕', en: 'Yan Endures' },
        description: 'Still hold Xiangping and Liaodong in 245 — history gives you until 238.',
        descriptionZh: "至245年仍據襄平、遼東 —— 史書只給了你到238年秋。",
        goal: { kind: 'hold-cities', cityIds: ['xiangping', 'liaodong'], byYear: 245 },
      },
      secondary: [
        {
          title: { zh: '南結孫吳', en: 'Reach South to Wu' },
          description: 'Take Beiping by 245 — break out of the northeast corner.',
          descriptionZh: "於245年前南取北平 —— 困守遼東一隅,終無生路。",
          goal: { kind: 'hold-cities', cityIds: ['beiping'], byYear: 245 },
        },
      ],
    },
    {
      id: 'obj-238-shu',
      forceId: 'liu-bei',
      primary: {
        title: { zh: '乘隙北伐', en: 'March While Wei Looks Northeast' },
        description: "Take Chang'an by 248.",
        descriptionZh: "於248年前克復長安 —— 魏之大軍在遼東。",
        goal: { kind: 'hold-cities', cityIds: ['changan'], byYear: 248 },
      },
    },
    {
      id: 'obj-238-wu',
      forceId: 'sun',
      primary: {
        title: { zh: '遼東通使', en: 'The Liaodong Embassy' },
        description: 'Take Hefei by 248 — you sent a fleet to Liaodong and lost the envoys; take the wall instead.',
        descriptionZh: "於248年前攻取合肥 —— 浮海通遼東,使者為公孫淵所斬,不如踏實取合肥。",
        goal: { kind: 'hold-cities', cityIds: ['hefei'], byYear: 248 },
      },
    },
  ],

  // 241 — Wu strikes at Shaopi
  'scn-241-shaopi': [
    {
      id: 'obj-241-wu',
      forceId: 'sun',
      primary: {
        title: { zh: '四路伐魏', en: 'Four Armies North' },
        description: 'Take Hefei and Shouchun by 250 — Quan Cong at Shaopi, Zhuge Ke at Liu\'an.',
        descriptionZh: "於250年前取合肥、壽春 —— 全琮攻芍陂,諸葛恪向六安,四路並舉。",
        goal: { kind: 'hold-cities', cityIds: ['hefei', 'shouchun'], byYear: 250 },
      },
      secondary: [
        {
          title: { zh: '取襄陽', en: 'Take Xiangyang' },
          description: 'Hold Xiangyang by 252 — Zhu Ran\'s road into Jing.',
          descriptionZh: "於252年前取襄陽 —— 朱然攻樊,此路亦當開。",
          goal: { kind: 'hold-cities', cityIds: ['xiangyang'], byYear: 252 },
        },
      ],
    },
    {
      id: 'obj-241-wei',
      forceId: 'cao',
      primary: {
        title: { zh: '淮南屯田', en: 'The Huainan Colonies' },
        description: 'Still hold Hefei and Shouchun in 250 — Deng Ai\'s canals feed the front.',
        descriptionZh: "至250年仍保合肥、壽春 —— 鄧艾開廣漕渠,淮南之田足以養兵。",
        goal: { kind: 'hold-cities', cityIds: ['hefei', 'shouchun'], byYear: 250 },
      },
    },
    {
      id: 'obj-241-shu',
      forceId: 'liu-bei',
      primary: {
        title: { zh: '費禕守成', en: 'Fei Yi Holds the Line' },
        description: "Still hold Hanzhong in 250, and take Chang'an if you can.",
        descriptionZh: "至250年仍保漢中,有餘力則北取長安 —— 費禕主政,不欲窮兵。",
        goal: { kind: 'hold-cities', cityIds: ['hanzhong'], byYear: 250 },
      },
    },
  ],

  // 244 — The battle of Xingshi
  'scn-244-xingshi': [
    {
      id: 'obj-244-wei',
      forceId: 'cao',
      primary: {
        title: { zh: '曹爽伐蜀', en: "Cao Shuang's Invasion" },
        description: 'Take Hanzhong by 249 — you need a victory to hold the court.',
        descriptionZh: "於249年前攻取漢中 —— 你需要一場勝仗來坐穩朝堂。",
        goal: { kind: 'hold-cities', cityIds: ['hanzhong'], byYear: 249 },
      },
      secondary: [
        {
          title: { zh: '滅蜀', en: 'Destroy Shu' },
          description: 'Destroy the Shu force.',
          descriptionZh: "擊滅蜀漢。",
          goal: { kind: 'defeat-force', forceId: 'liu-bei' },
        },
      ],
    },
    {
      id: 'obj-244-shu',
      forceId: 'liu-bei',
      primary: {
        title: { zh: '拒敵於興勢', en: 'Stop Them at Xingshi' },
        description: 'Still hold Hanzhong and Yangping in 250 — Wang Ping held with three thousand.',
        descriptionZh: "至250年仍保漢中、陽平 —— 王平以三萬拒十餘萬,據險而不出。",
        goal: { kind: 'hold-cities', cityIds: ['hanzhong', 'yangping'], byYear: 250 },
      },
      secondary: [
        {
          title: { zh: '反攻關中', en: 'Counter into Guanzhong' },
          description: "Take Chang'an by 256.",
          descriptionZh: "於256年前克復長安 —— 敵既大敗而歸,可以進取。",
          goal: { kind: 'hold-cities', cityIds: ['changan'], byYear: 256 },
        },
      ],
    },
    {
      id: 'obj-244-wu',
      forceId: 'sun',
      primary: {
        title: { zh: '東線並進', en: 'Press the Eastern Front' },
        description: 'Take Hefei by 252.',
        descriptionZh: "於252年前攻取合肥。",
        goal: { kind: 'hold-cities', cityIds: ['hefei'], byYear: 252 },
      },
    },
  ],

  // 249 — The Gaoping Tombs incident
  'scn-249-gaopingling': [
    {
      id: 'obj-249-sima',
      forceId: 'sima',
      primary: {
        title: { zh: '閉城奪權', en: 'Shut the Gates, Take the Court' },
        description: 'Destroy the Cao Shuang force by 253 — ten years of feigned illness, one morning to act.',
        descriptionZh: "於253年前翦滅曹爽 —— 詐病十年,發於一朝。",
        goal: { kind: 'defeat-force', forceId: 'cao', byYear: 253 },
      },
      secondary: [
        {
          title: { zh: '洛陽在握', en: 'Hold Luoyang' },
          description: 'Still hold Luoyang in 255.',
          descriptionZh: "至255年仍據洛陽 —— 據武庫,屯洛水浮橋。",
          goal: { kind: 'hold-cities', cityIds: ['luoyang'], byYear: 255 },
        },
      ],
    },
    {
      id: 'obj-249-caoshuang',
      forceId: 'cao',
      primary: {
        title: { zh: '挾帝幸許', en: 'Take the Emperor to Xuchang' },
        description: 'Destroy the Sima faction by 253 — Huan Fan begged you to fight; you went home instead.',
        descriptionZh: "於253年前翦滅司馬氏 —— 桓範勸你挾天子走許昌,你選擇了回家做富家翁。",
        goal: { kind: 'defeat-force', forceId: 'sima', byYear: 253 },
      },
      secondary: [
        {
          title: { zh: '許昌別都', en: 'Xuchang as the Second Capital' },
          description: 'Hold Xuchang and Luoyang by 255.',
          descriptionZh: "於255年前兼據許昌、洛陽。",
          goal: { kind: 'hold-cities', cityIds: ['xuchang', 'luoyang'], byYear: 255 },
        },
      ],
    },
    {
      id: 'obj-249-shu',
      forceId: 'liu-bei',
      primary: {
        title: { zh: '姜維北伐', en: "Jiang Wei's Northern Campaigns" },
        description: "Take Tianshui and Chang'an by 262.",
        descriptionZh: "於262年前取天水、長安 —— 魏室內亂,正可乘之。",
        goal: { kind: 'hold-cities', cityIds: ['tianshui', 'changan'], byYear: 262 },
      },
    },
    {
      id: 'obj-249-wu',
      forceId: 'sun',
      primary: {
        title: { zh: '乘魏之亂', en: "Profit from Wei's Turmoil" },
        description: 'Take Hefei and Shouchun by 260.',
        descriptionZh: "於260年前取合肥、壽春 —— 魏有內變,淮南可圖。",
        goal: { kind: 'hold-cities', cityIds: ['hefei', 'shouchun'], byYear: 260 },
      },
    },
  ],

  // 252 — The battle of Dongxing
  'scn-252-dongxing': [
    {
      id: 'obj-252-wu',
      forceId: 'sun',
      primary: {
        title: { zh: '東興大捷', en: 'The Dongxing Victory' },
        description: 'Hold Ruxu and take Hefei by 258 — Ding Feng went in with short blades in the snow.',
        descriptionZh: "於258年前守濡須並取合肥 —— 丁奉雪中短兵,魏軍自相踐踏。",
        goal: { kind: 'hold-cities', cityIds: ['ruxu', 'hefei'], byYear: 258 },
      },
      secondary: [
        {
          title: { zh: '勿再興師', en: 'Do Not Overreach' },
          description: 'Still hold Ruxu and Jianye in 260 — the win went to Zhuge Ke\'s head, and cost him his life.',
          descriptionZh: "至260年仍保濡須、建業 —— 諸葛恪勝而驕,再攻新城,遂及於禍。",
          goal: { kind: 'hold-cities', cityIds: ['ruxu', 'jianye'], byYear: 260 },
        },
      ],
    },
    {
      id: 'obj-252-wei',
      forceId: 'cao',
      primary: {
        title: { zh: '拔東興堤', en: 'Break the Dongxing Dam' },
        description: 'Take Ruxu by 258.',
        descriptionZh: "於258年前攻取濡須 —— 壞其堤堰,則巢湖之路通。",
        goal: { kind: 'hold-cities', cityIds: ['ruxu'], byYear: 258 },
      },
    },
    {
      id: 'obj-252-shu',
      forceId: 'liu-bei',
      primary: {
        title: { zh: '出狄道', en: 'Out by Didao' },
        description: "Take Tianshui and Chang'an by 262.",
        descriptionZh: "於262年前取天水、長安。",
        goal: { kind: 'hold-cities', cityIds: ['tianshui', 'changan'], byYear: 262 },
      },
    },
  ],

  // 253 — The siege of Hefei New City
  'scn-253-hefei': [
    {
      id: 'obj-253-wu',
      forceId: 'sun',
      primary: {
        title: { zh: '拔新城', en: 'Storm the New City' },
        description: 'Take Hefei by 258 — two hundred thousand men, three months, one small wall.',
        descriptionZh: "於258年前攻下合肥新城 —— 二十萬眾,圍三月,終不能拔。",
        goal: { kind: 'hold-cities', cityIds: ['hefei'], byYear: 258 },
      },
      secondary: [
        {
          title: { zh: '軍中無疫', en: 'Keep the Camp Alive' },
          description: 'Still hold Jianye and Ruxu in 260 — the siege lost more to sickness than to arrows.',
          descriptionZh: "至260年仍保建業、濡須 —— 圍城之敗,死於疫者多於死於矢者。",
          goal: { kind: 'hold-cities', cityIds: ['jianye', 'ruxu'], byYear: 260 },
        },
      ],
    },
    {
      id: 'obj-253-wei',
      forceId: 'cao',
      primary: {
        title: { zh: '守新城', en: 'Hold the New City' },
        description: 'Still hold Hefei in 258 — Zhang Te bought time with a fake surrender and rebuilt the wall at night.',
        descriptionZh: "至258年仍守合肥 —— 張特詐降緩兵,夜以拆屋之材補城。",
        goal: { kind: 'hold-cities', cityIds: ['hefei'], byYear: 258 },
      },
    },
    {
      id: 'obj-253-shu',
      forceId: 'liu-bei',
      primary: {
        title: { zh: '與吳並舉', en: 'March With Wu' },
        description: "Take Tianshui and Chang'an by 262.",
        descriptionZh: "於262年前取天水、長安 —— 東西並舉,魏不能兩顧。",
        goal: { kind: 'hold-cities', cityIds: ['tianshui', 'changan'], byYear: 262 },
      },
    },
  ],

  // 255 — The second Huainan revolt
  'scn-255-huainan2': [
    {
      id: 'obj-255-sima',
      forceId: 'cao',
      primary: {
        title: { zh: '平毌丘儉', en: 'Put Down Guanqiu Jian' },
        description: 'Destroy the Guanqiu force by 258 — ride out with a tumour in your eye if you must.',
        descriptionZh: "於258年前平定毌丘儉 —— 目瘤方割,亦當輿疾而東。",
        goal: { kind: 'defeat-force', forceId: 'guanqiu', byYear: 258 },
      },
      secondary: [
        {
          title: { zh: '壽春在握', en: 'Hold Shouchun' },
          description: 'Still hold Shouchun in 260.',
          descriptionZh: "至260年仍據壽春 —— 淮南三叛,皆起於此城。",
          goal: { kind: 'hold-cities', cityIds: ['shouchun'], byYear: 260 },
        },
      ],
    },
    {
      id: 'obj-255-guanqiu',
      forceId: 'guanqiu',
      primary: {
        title: { zh: '清君側', en: 'Purge the Emperor\'s Side' },
        description: 'Take Luoyang by 259 — the proclamation named eleven crimes of Sima Shi.',
        descriptionZh: "於259年前攻取洛陽 —— 傳檄州郡,數司馬師十一罪。",
        goal: { kind: 'hold-cities', cityIds: ['luoyang'], byYear: 259 },
      },
      secondary: [
        {
          title: { zh: '毋失壽春', en: 'Do Not Lose Shouchun' },
          description: 'Still hold Shouchun in 258 — your army melted away when their families were held hostage.',
          descriptionZh: "至258年仍據壽春 —— 史書上,將士家屬在北,軍心一夕而散。",
          goal: { kind: 'hold-cities', cityIds: ['shouchun'], byYear: 258 },
        },
      ],
    },
    {
      id: 'obj-255-wu',
      forceId: 'sun',
      primary: {
        title: { zh: '乘亂北取', en: 'Take Huainan in the Confusion' },
        description: 'Take Shouchun by 262.',
        descriptionZh: "於262年前攻取壽春 —— 魏有內亂,淮南易主之機。",
        goal: { kind: 'hold-cities', cityIds: ['shouchun'], byYear: 262 },
      },
    },
    {
      id: 'obj-255-shu',
      forceId: 'liu-bei',
      primary: {
        title: { zh: '洮西大捷', en: 'The Victory West of Tao' },
        description: "Take Tianshui and Chang'an by 264.",
        descriptionZh: "於264年前取天水、長安 —— 洮西一戰,魏人死者數萬。",
        goal: { kind: 'hold-cities', cityIds: ['tianshui', 'changan'], byYear: 264 },
      },
    },
  ],

  // 257 — The third Huainan revolt
  'scn-257-huainan3': [
    {
      id: 'obj-257-sima',
      forceId: 'cao',
      primary: {
        title: { zh: '圍壽春', en: 'Encircle Shouchun' },
        description: 'Destroy the Zhuge Dan force by 261 — twenty-six legions, a ring of earth, and patience.',
        descriptionZh: "於261年前平定諸葛誕 —— 二十六萬眾,築圍而守,不與野戰。",
        goal: { kind: 'defeat-force', forceId: 'huainan', byYear: 261 },
      },
      secondary: [
        {
          title: { zh: '混一宇內', en: 'Unify the Realm' },
          description: 'Bring all under one banner.',
          descriptionZh: "混一天下 —— 內患既除,便可西向。",
          goal: { kind: 'unify-realm' },
        },
      ],
    },
    {
      id: 'obj-257-zhugedan',
      forceId: 'huainan',
      primary: {
        title: { zh: '壽春不下', en: 'Shouchun Shall Not Fall' },
        description: 'Still hold Shouchun in 262 — history gives you until 258.',
        descriptionZh: "至262年仍據壽春 —— 史書只給了你到258年二月。",
        goal: { kind: 'hold-cities', cityIds: ['shouchun'], byYear: 262 },
      },
      secondary: [
        {
          title: { zh: '兵入洛陽', en: 'March on Luoyang' },
          description: 'Take Luoyang by 264.',
          descriptionZh: "於264年前攻取洛陽 —— 困守孤城必亡,唯有北出。",
          goal: { kind: 'hold-cities', cityIds: ['luoyang'], byYear: 264 },
        },
      ],
    },
    {
      id: 'obj-257-wu',
      forceId: 'sun',
      primary: {
        title: { zh: '救壽春', en: 'Relieve Shouchun' },
        description: 'Take Shouchun by 262 — you sent Wen Qin and three legions in; none came back.',
        descriptionZh: "於262年前取壽春 —— 遣文欽、唐咨三萬入城,城破皆沒。",
        goal: { kind: 'hold-cities', cityIds: ['shouchun'], byYear: 262 },
      },
    },
    {
      id: 'obj-257-shu',
      forceId: 'liu-bei',
      primary: {
        title: { zh: '出駱谷', en: 'Out by the Luo Valley' },
        description: "Take Chang'an by 266.",
        descriptionZh: "於266年前克復長安 —— 魏之主力在淮南。",
        goal: { kind: 'hold-cities', cityIds: ['changan'], byYear: 266 },
      },
    },
  ],

  // 263 — The conquest of Shu
  'scn-263-shu-fall': [
    {
      id: 'obj-263-wei',
      forceId: 'cao',
      primary: {
        title: { zh: '三路伐蜀', en: 'Three Roads into Shu' },
        description: 'Destroy the Shu force by 267 — Deng Ai over Yinping, Zhong Hui at Jiange.',
        descriptionZh: "於267年前滅蜀漢 —— 鍾會攻劍閣,鄧艾偷渡陰平。",
        goal: { kind: 'defeat-force', forceId: 'liu-bei', byYear: 267 },
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
      id: 'obj-263-shu',
      forceId: 'liu-bei',
      primary: {
        title: { zh: '社稷不亡', en: 'The Altars Shall Stand' },
        description: 'Survive to 270 — in history the gates of Chengdu open in the winter of 263.',
        descriptionZh: "存續至270年 —— 史書上,成都在263年冬開城出降。",
        goal: { kind: 'survive-until', year: 270 },
      },
      secondary: [
        {
          title: { zh: '守劍閣', en: 'Hold Jiange' },
          description: 'Still hold Hanzhong and Chengdu in 267.',
          descriptionZh: "至267年仍保漢中、成都 —— 姜維列營守險,會不能克。",
          goal: { kind: 'hold-cities', cityIds: ['hanzhong', 'chengdu'], byYear: 267 },
        },
      ],
    },
    {
      id: 'obj-263-wu',
      forceId: 'sun',
      primary: {
        title: { zh: '救蜀', en: 'Save Shu' },
        description: 'Hold Yongan by 267 — Shu falling leaves you alone against the north.',
        descriptionZh: "於267年前據永安 —— 唇亡則齒寒,蜀亡則吳孤。",
        goal: { kind: 'hold-cities', cityIds: ['yongan'], byYear: 267 },
      },
    },
  ],

  // 264 — Zhong Hui's revolt
  'scn-264-zhonghui': [
    {
      id: 'obj-264-zhonghui',
      forceId: 'zhonghui',
      primary: {
        title: { zh: '據蜀自王', en: 'A Kingdom in Shu' },
        description: 'Hold Chengdu and Hanzhong by 268 — with Shu\'s army and Jiang Wei\'s counsel.',
        descriptionZh: "於268年前據成都、漢中 —— 得蜀兵,得姜維,事可濟也。",
        goal: { kind: 'hold-cities', cityIds: ['chengdu', 'hanzhong'], byYear: 268 },
      },
      secondary: [
        {
          title: { zh: '東向爭天下', en: 'Then Turn East' },
          description: 'Destroy the Sima force.',
          descriptionZh: "翦滅司馬昭 —— 事成則得天下,不成退保蜀漢。",
          goal: { kind: 'defeat-force', forceId: 'cao' },
        },
      ],
    },
    {
      id: 'obj-264-dengai',
      forceId: 'dengai',
      primary: {
        title: { zh: '功高見疑', en: 'Too Much Merit' },
        description: 'Destroy the Zhong Hui force — he wrote the letters that had you arrested.',
        descriptionZh: "擊滅鍾會 —— 檻車囚你的那封表,是他偽作的。",
        goal: { kind: 'defeat-force', forceId: 'zhonghui' },
      },
      secondary: [
        {
          title: { zh: '守成都', en: 'Hold Chengdu' },
          description: 'Still hold Chengdu in 268.',
          descriptionZh: "至268年仍據成都 —— 陰平小道走過來的,不該這樣死。",
          goal: { kind: 'hold-cities', cityIds: ['chengdu'], byYear: 268 },
        },
      ],
    },
    {
      id: 'obj-264-sima',
      forceId: 'cao',
      primary: {
        title: { zh: '收蜀定亂', en: 'Take Shu, End the Mutiny' },
        description: 'Destroy the Zhong Hui force by 268 — you sent him because he had no family to protect.',
        descriptionZh: "於268年前平定鍾會 —— 你早知道他會反,只是算準了他成不了。",
        goal: { kind: 'defeat-force', forceId: 'zhonghui', byYear: 268 },
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
      id: 'obj-264-wu',
      forceId: 'sun',
      primary: {
        title: { zh: '西取巴蜀', en: 'West into Ba-Shu' },
        description: 'Take Yongan and Chengdu by 270 — Shu is in chaos and its gates are open.',
        descriptionZh: "於270年前取永安、成都 —— 蜀方大亂,此千載之機。",
        goal: { kind: 'hold-cities', cityIds: ['yongan', 'chengdu'], byYear: 270 },
      },
    },
  ],

  // 265 — Sima Yan takes the throne
  'scn-265-jin-founded': [
    {
      id: 'obj-265-jin',
      forceId: 'sima',
      primary: {
        title: { zh: '混一宇內', en: 'One Realm Under Jin' },
        description: 'Bring all under Jin — sixty years of division end here.',
        descriptionZh: "混一天下 —— 六十年分裂,當終於此。",
        goal: { kind: 'unify-realm' },
      },
      secondary: [
        {
          title: { zh: '樓船下益州', en: 'The Tower Ships Sail' },
          description: 'Destroy the Wu force by 285.',
          descriptionZh: "於285年前滅吳 —— 王濬樓船下益州,金陵王氣黯然收。",
          goal: { kind: 'defeat-force', forceId: 'sun', byYear: 285 },
        },
      ],
    },
    {
      id: 'obj-265-wu',
      forceId: 'sun',
      primary: {
        title: { zh: '江東不亡', en: 'Wu Shall Not Fall' },
        description: 'Survive to 290 — history gives you until 280.',
        descriptionZh: "存續至290年 —— 史書只給了你到280年。",
        goal: { kind: 'survive-until', year: 290 },
      },
      secondary: [
        {
          title: { zh: '固守上游', en: 'Hold the Upper River' },
          description: 'Still hold Jiangling and Xiling in 285 — Wu dies when the upper river is lost.',
          descriptionZh: "至285年仍保江陵、西陵 —— 吳之存亡,在上游而不在建業。",
          goal: { kind: 'hold-cities', cityIds: ['jiangling', 'xiling'], byYear: 285 },
        },
      ],
    },
  ],

  // 272 — The battle of Xiling
  'scn-272-xiling': [
    {
      id: 'obj-272-wu',
      forceId: 'sun',
      primary: {
        title: { zh: '西陵之守', en: 'The Defence of Xiling' },
        description: 'Still hold Xiling and Jiangling in 278 — Lu Kang built a wall against his own rebel general.',
        descriptionZh: "至278年仍保西陵、江陵 —— 陸抗築嚴圍以待步闡,不攻而先自固。",
        goal: { kind: 'hold-cities', cityIds: ['xiling', 'jiangling'], byYear: 278 },
      },
      secondary: [
        {
          title: { zh: '國之西門', en: 'The Western Gate' },
          description: 'Survive to 288.',
          descriptionZh: "存續至288年 —— 西陵、建平,國之藩表,若失之則非徒失一郡。",
          goal: { kind: 'survive-until', year: 288 },
        },
      ],
    },
    {
      id: 'obj-272-jin',
      forceId: 'sima',
      primary: {
        title: { zh: '取西陵', en: 'Take Xiling' },
        description: 'Take Xiling and Jiangling by 278 — Bu Chan has opened the door.',
        descriptionZh: "於278年前取西陵、江陵 —— 步闡已獻城,上游一開,吳不能守。",
        goal: { kind: 'hold-cities', cityIds: ['xiling', 'jiangling'], byYear: 278 },
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
  ],

  // 280 — Jin conquers Wu
  'scn-280-jin-unite': [
    {
      id: 'obj-280-jin',
      forceId: 'sima',
      primary: {
        title: { zh: '一片降旛出石頭', en: 'The Banner of Surrender at Shitou' },
        description: 'Destroy the Wu force by 284 — six armies down the river at once.',
        descriptionZh: "於284年前滅吳 —— 六路並進,千尋鐵鎖沉江底。",
        goal: { kind: 'defeat-force', forceId: 'sun', byYear: 284 },
      },
      secondary: [
        {
          title: { zh: '混一宇內', en: 'Unify the Realm' },
          description: 'Bring all under one banner.',
          descriptionZh: "混一天下 —— 自黃巾至此,九十六年。",
          goal: { kind: 'unify-realm' },
        },
      ],
    },
    {
      id: 'obj-280-wu',
      forceId: 'sun',
      primary: {
        title: { zh: '守此殘江', en: 'Hold What Is Left of the River' },
        description: 'Survive to 290 — the iron chains across the river will not be enough.',
        descriptionZh: "存續至290年 —— 攔江鐵鎖擋不住樓船,能擋住的只有人心。",
        goal: { kind: 'survive-until', year: 290 },
      },
      secondary: [
        {
          title: { zh: '建業不降', en: 'Jianye Does Not Surrender' },
          description: 'Still hold Jianye and Jiangling in 286.',
          descriptionZh: "至286年仍保建業、江陵。",
          goal: { kind: 'hold-cities', cityIds: ['jianye', 'jiangling'], byYear: 286 },
        },
      ],
    },
  ],

  // ───────────────────────────────────────────────────────────────────────
  // What-if boards. The objective is the premise: each force is asked to
  // cash in the thing history denied it.
  // ───────────────────────────────────────────────────────────────────────

  // Gathering of Heroes — everyone at their peak, all at once
  'scn-gathering-of-heroes': [
    {
      id: 'obj-goh-cao',
      forceId: 'cao',
      primary: {
        title: { zh: '寧我負人', en: 'Rather I Wrong the World' },
        description: 'Bring all under one banner.',
        descriptionZh: "混一天下 —— 群雄畢集,正是治世能臣、亂世奸雄的分野處。",
        goal: { kind: 'unify-realm' },
      },
      secondary: [
        {
          title: { zh: '先定中原', en: 'The Central Plain First' },
          description: 'Hold Luoyang, Xuchang and Ye by 210.',
          descriptionZh: "於210年前兼據洛陽、許昌、鄴城。",
          goal: { kind: 'hold-cities', cityIds: ['luoyang', 'xuchang', 'ye'], byYear: 210 },
        },
      ],
    },
    {
      id: 'obj-goh-liubei',
      forceId: 'liu-bei',
      primary: {
        title: { zh: '興復漢室', en: 'Restore the Han' },
        description: 'Hold Chengdu, Jiangling and Luoyang by 215.',
        descriptionZh: "於215年前兼據成都、江陵、洛陽 —— 跨有荊益,還於舊都。",
        goal: { kind: 'hold-cities', cityIds: ['chengdu', 'jiangling', 'luoyang'], byYear: 215 },
      },
      secondary: [
        {
          title: { zh: '三分而後一統', en: 'Three Parts, Then One' },
          description: 'Bring all under one banner.',
          descriptionZh: "混一天下。",
          goal: { kind: 'unify-realm' },
        },
      ],
    },
    {
      id: 'obj-goh-sun',
      forceId: 'sun',
      primary: {
        title: { zh: '小霸王西進', en: 'The Little Conqueror Rides West' },
        description: 'Hold Jianye, Jiangling and Hefei by 212 — Sun Ce never got the chance.',
        descriptionZh: "於212年前兼據建業、江陵、合肥 —— 若不遇許貢門客,孫策本可西向。",
        goal: { kind: 'hold-cities', cityIds: ['jianye', 'jiangling', 'hefei'], byYear: 212 },
      },
    },
    {
      id: 'obj-goh-yuanshao',
      forceId: 'yuan-shao',
      primary: {
        title: { zh: '四世三公', en: 'Four Generations, Three Excellencies' },
        description: 'Control Ji province and take Xuchang by 210.',
        descriptionZh: "於210年前盡有冀州並取許昌 —— 名門之望,當有名門之業。",
        goal: { kind: 'hold-cities', cityIds: ['ye', 'xuchang'], byYear: 210 },
      },
    },
    {
      id: 'obj-goh-dong',
      forceId: 'dong',
      primary: {
        title: { zh: '廢立由我', en: 'I Make and Unmake Emperors' },
        description: "Hold Luoyang and Chang'an by 208.",
        descriptionZh: "於208年前兼據洛陽、長安 —— 兩京在手,廢立由我。",
        goal: { kind: 'hold-cities', cityIds: ['luoyang', 'changan'], byYear: 208 },
      },
    },
    {
      id: 'obj-goh-lubu',
      forceId: 'lubu',
      primary: {
        title: { zh: '人中呂布', en: 'Lü Bu Among Men' },
        description: 'Hold Xiapi, Pengcheng and Luoyang by 212 — a place of your own at last.',
        descriptionZh: "於212年前據下邳、彭城、洛陽 —— 馬中赤兔,人中呂布,終於有了自己的地。",
        goal: { kind: 'hold-cities', cityIds: ['xiapi', 'pengcheng', 'luoyang'], byYear: 212 },
      },
    },
    {
      id: 'obj-goh-yuanshu',
      forceId: 'yuan-shu',
      primary: {
        title: { zh: '受命於天', en: 'Mandated by Heaven' },
        description: 'Declare yourself emperor and hold Shouchun through 210.',
        descriptionZh: "稱帝建號,並至210年仍據壽春。",
        goal: { kind: 'declare-emperor' },
      },
      secondary: [
        {
          title: { zh: '淮南不飢', en: 'Huainan Shall Not Starve' },
          description: 'Still hold Shouchun in 210.',
          descriptionZh: "至210年仍據壽春 —— 史書上你死時只想討一碗蜜水。",
          goal: { kind: 'hold-cities', cityIds: ['shouchun'], byYear: 210 },
        },
      ],
    },
    {
      id: 'obj-goh-liubiao',
      forceId: 'liu-biao',
      primary: {
        title: { zh: '荊州之主', en: 'Lord of Jing' },
        description: 'Control Jing province by 210.',
        descriptionZh: "於210年前盡有荊州。",
        goal: { kind: 'control-province', provinceId: 'jing', byYear: 210 },
      },
    },
    {
      id: 'obj-goh-liuyan',
      forceId: 'liu-yan',
      primary: {
        title: { zh: '益州有天子氣', en: 'A Son of Heaven Rises in Yi' },
        description: 'Control Yi province by 210, then declare yourself emperor.',
        descriptionZh: "於210年前盡有益州 —— 望氣者言益州有天子氣,你信了。",
        goal: { kind: 'control-province', provinceId: 'yi', byYear: 210 },
      },
      secondary: [
        {
          title: { zh: '乘輿車具', en: 'The Imperial Carriage' },
          description: 'Declare yourself emperor.',
          descriptionZh: "稱帝建號 —— 你早已私造乘輿車具千餘乘。",
          goal: { kind: 'declare-emperor' },
        },
      ],
    },
    {
      id: 'obj-goh-gongsun',
      forceId: 'gongsun',
      primary: {
        title: { zh: '白馬將軍', en: 'The White Horse General' },
        description: 'Control You province and destroy Yuan Shao.',
        descriptionZh: "盡有幽州並擊滅袁紹 —— 界橋之敗,本非定局。",
        goal: { kind: 'control-province', provinceId: 'you', byYear: 210 },
      },
      secondary: [
        {
          title: { zh: '河北易主', en: 'The North Changes Hands' },
          description: 'Destroy the Yuan Shao force.',
          descriptionZh: "擊滅袁紹。",
          goal: { kind: 'defeat-force', forceId: 'yuan-shao' },
        },
      ],
    },
    {
      id: 'obj-goh-mateng',
      forceId: 'ma-teng',
      primary: {
        title: { zh: '西涼入關', en: 'Liang Comes Through the Pass' },
        description: "Take Chang'an by 210.",
        descriptionZh: "於210年前攻取長安 —— 西涼鐵騎,本可東出。",
        goal: { kind: 'hold-cities', cityIds: ['changan'], byYear: 210 },
      },
    },
    {
      id: 'obj-goh-zhanglu',
      forceId: 'zhang-lu',
      primary: {
        title: { zh: '政教合一', en: 'Church and State as One' },
        description: 'Hold Hanzhong and Chengdu by 212.',
        descriptionZh: "於212年前據漢中、成都 —— 以鬼道教民,雄據巴漢三十年。",
        goal: { kind: 'hold-cities', cityIds: ['hanzhong', 'chengdu'], byYear: 212 },
      },
    },
  ],

  // What if Guan Yu had held Jing province
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
        description: 'Control Yi province by 218 — everyone displaced by Chibi is coming your way.',
        descriptionZh: "於218年前盡有益州 —— 赤壁之後無家可歸的人,都往你這裡來。",
        goal: { kind: 'control-province', provinceId: 'yi', byYear: 218 },
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
        title: { zh: '關中十部', en: 'The Ten Companies of Guanzhong' },
        description: 'Control Liang province by 218 — this time the alliance did not break.',
        descriptionZh: "於218年前盡有涼州 —— 這一次盟約沒有裂。",
        goal: { kind: 'control-province', provinceId: 'liang', byYear: 218 },
      },
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
        title: { zh: '閉關自守', en: 'Bar the Passes' },
        description: 'Control Yi province by 216.',
        descriptionZh: "於216年前盡有益州。",
        goal: { kind: 'control-province', provinceId: 'yi', byYear: 216 },
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
  'scn-ws-seven': [
    {
      id: 'obj-ws7-qin',
      forceId: 'qin',
      primary: {
        title: { zh: '橫掃六合', en: 'Sweep Up the Six' },
        description: 'Bring all under one banner — from behind the Hangu Pass, one province at a time.',
        descriptionZh: "混一天下 —— 據函谷之險,遠交而近攻,蠶食諸侯。",
        goal: { kind: 'unify-realm' },
      },
      secondary: [
        {
          title: { zh: '東出函谷', en: 'East Through Hangu' },
          description: 'Take Luoyang and Chenliu by 200.',
          descriptionZh: "於200年前東取洛陽、陳留 —— 先取韓魏,則天下之樞在我。",
          goal: { kind: 'hold-cities', cityIds: ['luoyang', 'chenliu'], byYear: 200 },
        },
      ],
    },
    {
      id: 'obj-ws7-chu',
      forceId: 'chu',
      primary: {
        title: { zh: '地方五千里', en: 'Five Thousand Li of Land' },
        description: "Take Chang'an by 205 — the largest state has never once used its size.",
        descriptionZh: "於205年前西取長安 —— 楚地五千里,帶甲百萬,從未真正用出來過。",
        goal: { kind: 'hold-cities', cityIds: ['changan'], byYear: 205 },
      },
      secondary: [
        {
          title: { zh: '合縱抗秦', en: 'The Vertical Alliance' },
          description: 'Destroy the Qin force.',
          descriptionZh: "擊滅秦國 —— 楚雖三戶,亡秦必楚。",
          goal: { kind: 'defeat-force', forceId: 'qin' },
        },
      ],
    },
    {
      id: 'obj-ws7-qi',
      forceId: 'qi',
      primary: {
        title: { zh: '東帝之業', en: 'Emperor of the East' },
        description: 'Declare yourself emperor — Qin took the western title; take the eastern one.',
        descriptionZh: "稱帝建號 —— 秦為西帝,齊為東帝,本是說好的。",
        goal: { kind: 'declare-emperor' },
      },
      secondary: [
        {
          title: { zh: '稷下之盛', en: 'The Jixia Academy' },
          description: 'Still hold Linzi and Beihai in 200.',
          descriptionZh: "至200年仍保臨淄、北海 —— 稷下學宮,天下文樞。",
          goal: { kind: 'hold-cities', cityIds: ['linzi', 'beihai'], byYear: 200 },
        },
      ],
    },
    {
      id: 'obj-ws7-yan',
      forceId: 'yan',
      primary: {
        title: { zh: '黃金台', en: 'The Terrace of Gold' },
        description: 'Take Linzi by 198 — twenty-eight years of humiliation, repaid in one campaign.',
        descriptionZh: "於198年前攻取臨淄 —— 築黃金台以求士,雪二十八年之恥。",
        goal: { kind: 'hold-cities', cityIds: ['linzi'], byYear: 198 },
      },
    },
    {
      id: 'obj-ws7-zhao',
      forceId: 'zhao',
      primary: {
        title: { zh: '胡服騎射', en: 'Nomad Dress, Mounted Archery' },
        description: 'Take Taiyuan, Yanmen and Yunzhong by 195, then strike at Qin.',
        descriptionZh: "於195年前據太原、雁門、雲中 —— 胡服騎射,北取樓煩林胡之地。",
        goal: { kind: 'hold-cities', cityIds: ['taiyuan', 'yanmen', 'yunzhong'], byYear: 195 },
      },
      secondary: [
        {
          title: { zh: '自雲中襲秦', en: 'Down on Qin from Yunzhong' },
          description: "Take Chang'an by 205 — Wuling's own plan: ride south out of the steppe.",
          descriptionZh: "於205年前攻取長安 —— 武靈王的舊策:自雲中南襲咸陽。",
          goal: { kind: 'hold-cities', cityIds: ['changan'], byYear: 205 },
        },
      ],
    },
    {
      id: 'obj-ws7-wei',
      forceId: 'wei',
      primary: {
        title: { zh: '重整武卒', en: 'Rebuild the Wu Zu' },
        description: 'Hold Chenliu, Luoyang and Puyang by 198 — the first hegemon, fallen to a buffer state.',
        descriptionZh: "於198年前據陳留、洛陽、濮陽 —— 戰國首霸,如今夾在秦齊之間。",
        goal: { kind: 'hold-cities', cityIds: ['chenliu', 'luoyang', 'puyang'], byYear: 198 },
      },
    },
    {
      id: 'obj-ws7-han',
      forceId: 'han',
      primary: {
        title: { zh: '勁弩勁韓', en: 'The Crossbows of Han' },
        description: 'Still hold Luoyang and Xuchang in 200 — smallest of the seven, first to be eaten.',
        descriptionZh: "至200年仍保洛陽、許昌 —— 七雄之末,秦之近攻首當其衝。",
        goal: { kind: 'hold-cities', cityIds: ['luoyang', 'xuchang'], byYear: 200 },
      },
      secondary: [
        {
          title: { zh: '存韓', en: 'Han Survives' },
          description: 'Survive to 210.',
          descriptionZh: "存續至210年 —— 韓非入秦而死,他要保的就是這件事。",
          goal: { kind: 'survive-until', year: 210 },
        },
      ],
    },
  ],

  // Marquis Wen of Wei, the first hegemon
  'scn-ws-weiwen': [
    {
      id: 'obj-wswen-wei',
      forceId: 'wei',
      primary: {
        title: { zh: '盡取西河', en: 'Take the West of the River' },
        description: "Take Chang'an and Tongguan by 195 — Wu Qi held this line against Qin for decades.",
        descriptionZh: "於195年前西取長安、潼關 —— 吳起守西河,秦兵不敢東向。",
        goal: { kind: 'hold-cities', cityIds: ['changan', 'tongguan'], byYear: 195 },
      },
      secondary: [
        {
          title: { zh: '首霸中原', en: 'First Hegemon' },
          description: 'Hold Chenliu, Luoyang and Ye by 198.',
          descriptionZh: "於198年前據陳留、洛陽、鄴城 —— 用李悝變法,魏最先強。",
          goal: { kind: 'hold-cities', cityIds: ['chenliu', 'luoyang', 'ye'], byYear: 198 },
        },
      ],
    },
    {
      id: 'obj-wswen-qin',
      forceId: 'qin',
      primary: {
        title: { zh: '收復河西', en: 'Win Back the West Bank' },
        description: "Still hold Chang'an in 195 — before Shang Yang, Qin is the weak one.",
        descriptionZh: "至195年仍守長安 —— 商鞅未至,此時的秦是弱國。",
        goal: { kind: 'hold-cities', cityIds: ['changan'], byYear: 195 },
      },
      secondary: [
        {
          title: { zh: '終有天下', en: 'The Long Game' },
          description: 'Bring all under one banner.',
          descriptionZh: "混一天下。",
          goal: { kind: 'unify-realm' },
        },
      ],
    },
    {
      id: 'obj-wswen-zhao',
      forceId: 'zhao',
      primary: {
        title: { zh: '三晉之分', en: 'The Three Jin Divide' },
        description: 'Take Ye and Shangdang by 198.',
        descriptionZh: "於198年前據鄴城、上黨 —— 三家分晉,魏最強而趙不甘。",
        goal: { kind: 'hold-cities', cityIds: ['ye', 'shangdang'], byYear: 198 },
      },
    },
    {
      id: 'obj-wswen-chu',
      forceId: 'chu',
      primary: {
        title: { zh: '吳起變法', en: "Wu Qi's Reforms" },
        description: 'Take Wancheng and Xuchang by 200 — Wu Qi went south after Wei drove him out.',
        descriptionZh: "於200年前北取宛城、許昌 —— 吳起去魏入楚,楚亦可強。",
        goal: { kind: 'hold-cities', cityIds: ['wancheng', 'xuchang'], byYear: 200 },
      },
    },
  ],

  // Shang Yang's reforms
  'scn-ws-shangyang': [
    {
      id: 'obj-wssy-qin',
      forceId: 'qin',
      primary: {
        title: { zh: '徙木立信', en: 'The Pole at the South Gate' },
        description: 'Take Tongguan, Luoyang and Chenliu by 200 — law before conquest, then conquest.',
        descriptionZh: "於200年前東取潼關、洛陽、陳留 —— 先立法,後出兵。",
        goal: { kind: 'hold-cities', cityIds: ['tongguan', 'luoyang', 'chenliu'], byYear: 200 },
      },
      secondary: [
        {
          title: { zh: '席捲天下', en: 'Roll Up the Realm' },
          description: 'Bring all under one banner.',
          descriptionZh: "混一天下 —— 有席捲天下、包舉宇內之意。",
          goal: { kind: 'unify-realm' },
        },
      ],
    },
    {
      id: 'obj-wssy-wei',
      forceId: 'wei',
      primary: {
        title: { zh: '悔不殺鞅', en: 'We Should Have Killed Him' },
        description: 'Destroy the Qin force by 205 — you had Shang Yang in your court and let him go west.',
        descriptionZh: "於205年前擊滅秦國 —— 公叔痤說「不用則殺之」,你沒有聽。",
        goal: { kind: 'defeat-force', forceId: 'qin', byYear: 205 },
      },
      secondary: [
        {
          title: { zh: '保有河西', en: 'Keep the West Bank' },
          description: 'Still hold Chenliu and Luoyang in 198.',
          descriptionZh: "至198年仍保陳留、洛陽。",
          goal: { kind: 'hold-cities', cityIds: ['chenliu', 'luoyang'], byYear: 198 },
        },
      ],
    },
    {
      id: 'obj-wssy-chu',
      forceId: 'chu',
      primary: {
        title: { zh: '合縱長', en: 'Lead the Vertical Alliance' },
        description: "Take Chang'an by 208.",
        descriptionZh: "於208年前攻取長安 —— 六國合縱,楚為縱長。",
        goal: { kind: 'hold-cities', cityIds: ['changan'], byYear: 208 },
      },
    },
    {
      id: 'obj-wssy-qi',
      forceId: 'qi',
      primary: {
        title: { zh: '東方之強', en: 'The Strength of the East' },
        description: 'Hold Linzi, Pengcheng and Xiapi by 200.',
        descriptionZh: "於200年前據臨淄、彭城、下邳 —— 秦強於西,齊當強於東。",
        goal: { kind: 'hold-cities', cityIds: ['linzi', 'pengcheng', 'xiapi'], byYear: 200 },
      },
    },
  ],

  // Surround Wei to rescue Zhao
  'scn-ws-guiling': [
    {
      id: 'obj-wsgl-qi',
      forceId: 'qi',
      primary: {
        title: { zh: '圍魏救趙', en: 'Surround Wei to Rescue Zhao' },
        description: "Take Chenliu by 195 — strike the capital, not the siege.",
        descriptionZh: "於195年前攻取陳留 —— 批亢擣虛,不救邯鄲而攻大梁。",
        goal: { kind: 'hold-cities', cityIds: ['chenliu'], byYear: 195 },
      },
      secondary: [
        {
          title: { zh: '減灶誘敵', en: 'Fewer Cooking Fires Each Day' },
          description: 'Destroy the Wei force by 202 — Sun Bin owes Pang Juan a death.',
          descriptionZh: "於202年前擊滅魏國 —— 孫臏與龐涓之間,還有一筆帳。",
          goal: { kind: 'defeat-force', forceId: 'wei', byYear: 202 },
        },
      ],
    },
    {
      id: 'obj-wsgl-wei',
      forceId: 'wei',
      primary: {
        title: { zh: '拔邯鄲', en: 'Storm Handan' },
        description: 'Take Ye by 195 and still hold Chenliu — take Zhao before Qi reaches your capital.',
        descriptionZh: "於195年前攻下鄴城,且陳留不失 —— 要在齊軍抵達大梁之前拿下邯鄲。",
        goal: { kind: 'hold-cities', cityIds: ['ye', 'chenliu'], byYear: 195 },
      },
    },
    {
      id: 'obj-wsgl-zhao',
      forceId: 'zhao',
      primary: {
        title: { zh: '邯鄲不陷', en: 'Handan Holds' },
        description: 'Still hold Ye in 196.',
        descriptionZh: "至196年仍據鄴城 —— 齊之救兵未必來得及,先守住再說。",
        goal: { kind: 'hold-cities', cityIds: ['ye'], byYear: 196 },
      },
    },
    {
      id: 'obj-wsgl-qin',
      forceId: 'qin',
      primary: {
        title: { zh: '坐觀三晉', en: 'Watch the Three Jin Bleed' },
        description: 'Take Luoyang and Tongguan by 202 — let Wei and Qi wear each other out.',
        descriptionZh: "於202年前東取洛陽、潼關 —— 三晉相攻,秦收其利。",
        goal: { kind: 'hold-cities', cityIds: ['luoyang', 'tongguan'], byYear: 202 },
      },
    },
  ],

  // Five states attack Qin at Hangu
  'scn-ws-hangu': [
    {
      id: 'obj-wshg-qin',
      forceId: 'qin',
      primary: {
        title: { zh: '函谷不開', en: 'The Pass Does Not Open' },
        description: 'Still hold Hanguguan and Tongguan in 198 — one pass, five armies.',
        descriptionZh: "至198年仍守函谷關、潼關 —— 五國之師百萬,叩關而攻。",
        goal: { kind: 'hold-cities', cityIds: ['hanguguan', 'tongguan'], byYear: 198 },
      },
      secondary: [
        {
          title: { zh: '連橫破縱', en: 'Break the Alliance' },
          description: 'Destroy the Chu force — the vertical alliance dies when Chu leaves it.',
          descriptionZh: "擊滅楚國 —— 縱長既去,合縱自散。",
          goal: { kind: 'defeat-force', forceId: 'chu' },
        },
      ],
    },
    {
      id: 'obj-wshg-chu',
      forceId: 'chu',
      primary: {
        title: { zh: '叩關而攻', en: 'Beat on the Gate' },
        description: "Take Hanguguan and Chang'an by 200.",
        descriptionZh: "於200年前破函谷關、入長安 —— 合縱之師,唯一一次真正打到關下。",
        goal: { kind: 'hold-cities', cityIds: ['hanguguan', 'changan'], byYear: 200 },
      },
    },
    {
      id: 'obj-wshg-zhao',
      forceId: 'zhao',
      primary: {
        title: { zh: '趙師西向', en: 'Zhao Marches West' },
        description: "Take Tongguan and Chang'an by 202.",
        descriptionZh: "於202年前取潼關、長安。",
        goal: { kind: 'hold-cities', cityIds: ['tongguan', 'changan'], byYear: 202 },
      },
    },
    {
      id: 'obj-wshg-wei',
      forceId: 'wei',
      primary: {
        title: { zh: '五國之一', en: 'One of the Five' },
        description: 'Take Luoyang and Tongguan by 200.',
        descriptionZh: "於200年前取洛陽、潼關。",
        goal: { kind: 'hold-cities', cityIds: ['luoyang', 'tongguan'], byYear: 200 },
      },
    },
    {
      id: 'obj-wshg-qi',
      forceId: 'qi',
      primary: {
        title: { zh: '不與西事', en: 'Stay Out of the West' },
        description: 'Hold Linzi, Pengcheng and Langya by 200 — let the others break themselves on the pass.',
        descriptionZh: "於200年前據臨淄、彭城、琅琊 —— 遠交近攻,齊之所以最後亡。",
        goal: { kind: 'hold-cities', cityIds: ['linzi', 'pengcheng', 'langya'], byYear: 200 },
      },
    },
  ],

  // The battle of Yique
  'scn-ws-yique': [
    {
      id: 'obj-wsyq-qin',
      forceId: 'qin',
      primary: {
        title: { zh: '伊闕斬首', en: 'The Slaughter at Yique' },
        description: 'Take Luoyang and Xuchang by 195 — Bai Qi against two armies that will not fight together.',
        descriptionZh: "於195年前取洛陽、許昌 —— 白起以寡擊眾,韓魏各自為戰。",
        goal: { kind: 'hold-cities', cityIds: ['luoyang', 'xuchang'], byYear: 195 },
      },
      secondary: [
        {
          title: { zh: '滅韓', en: 'End Han' },
          description: 'Destroy the Han force by 205.',
          descriptionZh: "於205年前滅韓 —— 近攻之始。",
          goal: { kind: 'defeat-force', forceId: 'han', byYear: 205 },
        },
      ],
    },
    {
      id: 'obj-wsyq-han',
      forceId: 'han',
      primary: {
        title: { zh: '韓魏合軍', en: 'Han and Wei Must Fight as One' },
        description: 'Still hold Luoyang and Xuchang in 198 — the defeat came from each waiting for the other.',
        descriptionZh: "至198年仍保洛陽、許昌 —— 伊闕之敗,敗在兩軍互相觀望。",
        goal: { kind: 'hold-cities', cityIds: ['luoyang', 'xuchang'], byYear: 198 },
      },
    },
    {
      id: 'obj-wsyq-wei',
      forceId: 'wei',
      primary: {
        title: { zh: '不作壁上觀', en: 'Do Not Stand and Watch' },
        description: 'Still hold Chenliu and Puyang in 198, and hold Luoyang too.',
        descriptionZh: "至198年仍保陳留、濮陽,並據洛陽 —— 這一次不要讓韓軍獨當秦鋒。",
        goal: { kind: 'hold-cities', cityIds: ['chenliu', 'puyang', 'luoyang'], byYear: 198 },
      },
    },
    {
      id: 'obj-wsyq-zhao',
      forceId: 'zhao',
      primary: {
        title: { zh: '趙不可獨存', en: 'Zhao Cannot Stand Alone Either' },
        description: 'Take Shangdang and Luoyang by 202.',
        descriptionZh: "於202年前取上黨、洛陽 —— 韓魏若亡,趙即當秦鋒。",
        goal: { kind: 'hold-cities', cityIds: ['shangdang', 'luoyang'], byYear: 202 },
      },
    },
  ],

  // The Yan-Ying campaign
  'scn-ws-yanying': [
    {
      id: 'obj-wsyy-qin',
      forceId: 'qin',
      primary: {
        title: { zh: '水灌鄢城', en: 'Flood Yan' },
        description: 'Take Xiangyang and Jiangling by 196 — Bai Qi dammed the river and drowned a city.',
        descriptionZh: "於196年前取襄陽、江陵 —— 白起決夷水以灌鄢城,再拔郢都。",
        goal: { kind: 'hold-cities', cityIds: ['xiangyang', 'jiangling'], byYear: 196 },
      },
      secondary: [
        {
          title: { zh: '燒夷陵', en: 'Burn Yiling' },
          description: 'Hold Yiling by 198 — the tombs of the Chu kings.',
          descriptionZh: "於198年前據夷陵 —— 燒楚先王之墓,楚人自此不能復振。",
          goal: { kind: 'hold-cities', cityIds: ['yiling'], byYear: 198 },
        },
      ],
    },
    {
      id: 'obj-wsyy-chu',
      forceId: 'chu',
      primary: {
        title: { zh: '郢都不失', en: 'Ying Shall Not Fall' },
        description: 'Still hold Jiangling and Yiling in 198 — after this, Chu never came back west.',
        descriptionZh: "至198年仍保江陵、夷陵 —— 郢都一失,楚就再也沒有回到過西邊。",
        goal: { kind: 'hold-cities', cityIds: ['jiangling', 'yiling'], byYear: 198 },
      },
      secondary: [
        {
          title: { zh: '亡秦必楚', en: 'Chu Will Be the End of Qin' },
          description: 'Destroy the Qin force.',
          descriptionZh: "擊滅秦國 —— 楚雖三戶,亡秦必楚。",
          goal: { kind: 'defeat-force', forceId: 'qin' },
        },
      ],
    },
    {
      id: 'obj-wsyy-qi',
      forceId: 'qi',
      primary: {
        title: { zh: '秦楚相攻', en: 'Let Qin and Chu Fight' },
        description: 'Hold Linzi and Pengcheng by 198.',
        descriptionZh: "於198年前據臨淄、彭城。",
        goal: { kind: 'hold-cities', cityIds: ['linzi', 'pengcheng'], byYear: 198 },
      },
    },
    {
      id: 'obj-wsyy-zhao',
      forceId: 'zhao',
      primary: {
        title: { zh: '北方獨強', en: 'The Last Strong State in the North' },
        description: 'Hold Ye, Taiyuan and Shangdang by 198.',
        descriptionZh: "於198年前據鄴城、太原、上黨 —— 楚既弱,能抗秦者唯趙。",
        goal: { kind: 'hold-cities', cityIds: ['ye', 'taiyuan', 'shangdang'], byYear: 198 },
      },
    },
  ],

  // The battle of Yuyu
  'scn-ws-yuyu': [
    {
      id: 'obj-wsyu-zhao',
      forceId: 'zhao',
      primary: {
        title: { zh: '狹路相逢勇者勝', en: 'In a Narrow Road, the Brave Win' },
        description: 'Hold Shangdang and Taiyuan by 195 — Zhao She marched thirty li out and then ran.',
        descriptionZh: "於195年前據上黨、太原 —— 趙奢去邯鄲三十里而止,再一日一夜疾趨。",
        goal: { kind: 'hold-cities', cityIds: ['shangdang', 'taiyuan'], byYear: 195 },
      },
      secondary: [
        {
          title: { zh: '再破秦軍', en: 'Beat Qin Again' },
          description: 'Destroy the Qin force by 208 — Yuyu is the only field defeat Qin took in this era.',
          descriptionZh: "於208年前擊滅秦國 —— 閼與是這個時代秦唯一一次野戰大敗。",
          goal: { kind: 'defeat-force', forceId: 'qin', byYear: 208 },
        },
      ],
    },
    {
      id: 'obj-wsyu-qin',
      forceId: 'qin',
      primary: {
        title: { zh: '取閼與', en: 'Take Yuyu' },
        description: 'Take Shangdang by 196 — a road too narrow for the loser to retreat.',
        descriptionZh: "於196年前攻取上黨 —— 其道遠險狹,譬之猶兩鼠鬥於穴中。",
        goal: { kind: 'hold-cities', cityIds: ['shangdang'], byYear: 196 },
      },
    },
    {
      id: 'obj-wsyu-wei',
      forceId: 'wei',
      primary: {
        title: { zh: '援趙', en: 'Reinforce Zhao' },
        description: 'Hold Luoyang and Chenliu by 198.',
        descriptionZh: "於198年前據洛陽、陳留 —— 趙若敗,魏即當其鋒。",
        goal: { kind: 'hold-cities', cityIds: ['luoyang', 'chenliu'], byYear: 198 },
      },
    },
    {
      id: 'obj-wsyu-han',
      forceId: 'han',
      primary: {
        title: { zh: '上黨之歸', en: 'Where Shangdang Goes' },
        description: 'Take Shangdang by 200 — whoever holds it decides the next war.',
        descriptionZh: "於200年前取上黨 —— 上黨歸誰,下一場大戰就在哪裡打。",
        goal: { kind: 'hold-cities', cityIds: ['shangdang'], byYear: 200 },
      },
    },
  ],

  // King Min of Qi takes the imperial title
  'scn-ws-qimin': [
    {
      id: 'obj-wsqm-qi',
      forceId: 'qi',
      primary: {
        title: { zh: '南面稱帝', en: 'Emperor of the East' },
        description: 'Declare yourself emperor and take Shouchun by 198 — Qi at its height swallowed Song.',
        descriptionZh: "稱帝建號並於198年前取壽春 —— 齊之極盛,滅宋而稱東帝。",
        goal: { kind: 'declare-emperor' },
      },
      secondary: [
        {
          title: { zh: '滅宋取淮', en: 'Swallow Song' },
          description: 'Hold Pengcheng, Xiapi and Shouchun by 198.',
          descriptionZh: "於198年前據彭城、下邳、壽春 —— 得宋地則齊愈驕,諸侯愈懼。",
          goal: { kind: 'hold-cities', cityIds: ['pengcheng', 'xiapi', 'shouchun'], byYear: 198 },
        },
      ],
    },
    {
      id: 'obj-wsqm-qin',
      forceId: 'qin',
      primary: {
        title: { zh: '去帝號以孤齊', en: 'Drop the Title, Isolate Qi' },
        description: 'Destroy the Qi force by 208 — Qin gave up the western title so Qi would stand alone.',
        descriptionZh: "於208年前擊滅齊國 —— 秦自去帝號,正為使齊獨當眾怒。",
        goal: { kind: 'defeat-force', forceId: 'qi', byYear: 208 },
      },
    },
    {
      id: 'obj-wsqm-yan',
      forceId: 'yan',
      primary: {
        title: { zh: '待時而動', en: 'Wait, Then Strike' },
        description: 'Take Linzi by 200 — Yan has been preparing this for twenty-eight years.',
        descriptionZh: "於200年前攻取臨淄 —— 燕昭王等這一天等了二十八年。",
        goal: { kind: 'hold-cities', cityIds: ['linzi'], byYear: 200 },
      },
    },
    {
      id: 'obj-wsqm-chu',
      forceId: 'chu',
      primary: {
        title: { zh: '淮北之爭', en: 'The Fight for Huaibei' },
        description: 'Hold Shouchun and Pengcheng by 200.',
        descriptionZh: "於200年前據壽春、彭城 —— 宋地之利,楚亦欲得。",
        goal: { kind: 'hold-cities', cityIds: ['shouchun', 'pengcheng'], byYear: 200 },
      },
    },
  ],

  // Yue Yi's campaign against Qi
  'scn-ws-yueyi': [
    {
      id: 'obj-wsyi-yan',
      forceId: 'yan',
      primary: {
        title: { zh: '下齊七十餘城', en: 'Seventy Cities in Six Months' },
        description: 'Take Linzi, Beihai and Langya by 196 — five states marched; only Yue Yi kept going.',
        descriptionZh: "於196年前取臨淄、北海、琅琊 —— 五國之師既還,獨樂毅引燕軍深入。",
        goal: { kind: 'hold-cities', cityIds: ['linzi', 'beihai', 'langya'], byYear: 196 },
      },
      secondary: [
        {
          title: { zh: '滅齊', en: 'End Qi' },
          description: 'Destroy the Qi force by 202 — two cities held out for five years in history.',
          descriptionZh: "於202年前滅齊 —— 史書上,莒與即墨守了五年,燕功敗垂成。",
          goal: { kind: 'defeat-force', forceId: 'qi', byYear: 202 },
        },
      ],
    },
    {
      id: 'obj-wsyi-qi',
      forceId: 'qi',
      primary: {
        title: { zh: '莒與即墨', en: 'Ju and Jimo' },
        description: 'Survive to 200, then retake Linzi — two cities are enough to come back from.',
        descriptionZh: "存續至200年,再復臨淄 —— 只剩兩城,也還能復國。",
        goal: { kind: 'survive-until', year: 200 },
      },
      secondary: [
        {
          title: { zh: '復齊七十城', en: 'Retake the Seventy' },
          description: 'Hold Linzi and Beihai by 205.',
          descriptionZh: "於205年前收復臨淄、北海。",
          goal: { kind: 'hold-cities', cityIds: ['linzi', 'beihai'], byYear: 205 },
        },
      ],
    },
    {
      id: 'obj-wsyi-qin',
      forceId: 'qin',
      primary: {
        title: { zh: '東方兩敗', en: 'Both Eastern Powers Bleed' },
        description: 'Take Luoyang, Chenliu and Shangdang by 200.',
        descriptionZh: "於200年前取洛陽、陳留、上黨 —— 燕齊相殘,秦得從容東出。",
        goal: { kind: 'hold-cities', cityIds: ['luoyang', 'chenliu', 'shangdang'], byYear: 200 },
      },
    },
    {
      id: 'obj-wsyi-zhao',
      forceId: 'zhao',
      primary: {
        title: { zh: '受樂毅', en: 'Shelter Yue Yi' },
        description: 'Hold Ye, Shangdang and Taiyuan by 200 — Yue Yi ended his life in Zhao.',
        descriptionZh: "於200年前據鄴城、上黨、太原 —— 樂毅最後奔趙,趙封之於觀津。",
        goal: { kind: 'hold-cities', cityIds: ['ye', 'shangdang', 'taiyuan'], byYear: 200 },
      },
    },
  ],

  // The battle of Changping
  'scn-ws-changping': [
    {
      id: 'obj-wscp-qin',
      forceId: 'qin',
      primary: {
        title: { zh: '長平坑降', en: 'The Pit at Changping' },
        description: 'Take Shangdang and Ye by 198 — swap the general in secret, cut the supply road, then wait.',
        descriptionZh: "於198年前取上黨、鄴城 —— 陰使武安君為將,絕其糧道,然後圍之。",
        goal: { kind: 'hold-cities', cityIds: ['shangdang', 'ye'], byYear: 198 },
      },
      secondary: [
        {
          title: { zh: '滅趙', en: 'End Zhao' },
          description: 'Destroy the Zhao force by 205.',
          descriptionZh: "於205年前滅趙 —— 趙卒四十萬既坑,邯鄲可下。",
          goal: { kind: 'defeat-force', forceId: 'zhao', byYear: 205 },
        },
      ],
    },
    {
      id: 'obj-wscp-zhao',
      forceId: 'zhao',
      primary: {
        title: { zh: '毋易廉頗', en: 'Do Not Replace Lian Po' },
        description: 'Still hold Shangdang and Ye in 200 — Lian Po held the line; the swap lost the war.',
        descriptionZh: "至200年仍保上黨、鄴城 —— 廉頗堅壁不出,換上趙括才是敗因。",
        goal: { kind: 'hold-cities', cityIds: ['shangdang', 'ye'], byYear: 200 },
      },
      secondary: [
        {
          title: { zh: '趙不亡', en: 'Zhao Survives' },
          description: 'Survive to 210.',
          descriptionZh: "存續至210年 —— 四十萬人的性命,換一個活下去的趙國。",
          goal: { kind: 'survive-until', year: 210 },
        },
      ],
    },
    {
      id: 'obj-wscp-wei',
      forceId: 'wei',
      primary: {
        title: { zh: '救趙與否', en: 'Whether to Save Zhao' },
        description: 'Hold Chenliu and Luoyang by 198, and take Shangdang — Zhao falling means Wei is next.',
        descriptionZh: "於198年前據陳留、洛陽並取上黨 —— 趙亡則魏為秦之鄰。",
        goal: { kind: 'hold-cities', cityIds: ['chenliu', 'luoyang', 'shangdang'], byYear: 198 },
      },
    },
    {
      id: 'obj-wscp-chu',
      forceId: 'chu',
      primary: {
        title: { zh: '北救之師', en: 'The Army from the South' },
        description: 'Take Xuchang and Luoyang by 200.',
        descriptionZh: "於200年前北取許昌、洛陽 —— 春申君將兵救趙,楚亦不能坐視。",
        goal: { kind: 'hold-cities', cityIds: ['xuchang', 'luoyang'], byYear: 200 },
      },
    },
  ],

  // The siege of Handan
  'scn-ws-handan': [
    {
      id: 'obj-wshd-qin',
      forceId: 'qin',
      primary: {
        title: { zh: '圍邯鄲', en: 'Besiege Handan' },
        description: 'Take Ye by 197 — Bai Qi refused this campaign and was ordered to die for it.',
        descriptionZh: "於197年前攻下鄴城 —— 武安君稱病不行,終賜劍杜郵。",
        goal: { kind: 'hold-cities', cityIds: ['ye'], byYear: 197 },
      },
      secondary: [
        {
          title: { zh: '滅趙', en: 'End Zhao' },
          description: 'Destroy the Zhao force by 205.',
          descriptionZh: "於205年前滅趙。",
          goal: { kind: 'defeat-force', forceId: 'zhao', byYear: 205 },
        },
      ],
    },
    {
      id: 'obj-wshd-zhao',
      forceId: 'zhao',
      primary: {
        title: { zh: '邯鄲三年', en: 'Three Years Under Siege' },
        description: 'Still hold Ye in 200 — after Changping, with the city eating its own dead.',
        descriptionZh: "至200年仍守鄴城 —— 長平之後,城中析骨而炊,易子而食。",
        goal: { kind: 'hold-cities', cityIds: ['ye'], byYear: 200 },
      },
      secondary: [
        {
          title: { zh: '反攻', en: 'Push Them Back' },
          description: 'Take Shangdang and Taiyuan by 205.',
          descriptionZh: "於205年前收復上黨、太原 —— 圍解之後,失地當復。",
          goal: { kind: 'hold-cities', cityIds: ['shangdang', 'taiyuan'], byYear: 205 },
        },
      ],
    },
    {
      id: 'obj-wshd-wei',
      forceId: 'wei',
      primary: {
        title: { zh: '竊符救趙', en: 'Steal the Tally, Save Zhao' },
        description: 'Take Ye by 198 while holding Chenliu — Lord Xinling killed his own general for the seal.',
        descriptionZh: "於198年前援取鄴城且陳留不失 —— 信陵君椎殺晉鄙,奪符而後救趙。",
        goal: { kind: 'hold-cities', cityIds: ['ye', 'chenliu'], byYear: 198 },
      },
    },
    {
      id: 'obj-wshd-chu',
      forceId: 'chu',
      primary: {
        title: { zh: '毛遂自薦', en: 'Mao Sui Recommends Himself' },
        description: 'Take Luoyang and Xuchang by 200 — Chu agreed to the alliance under a sword.',
        descriptionZh: "於200年前北取洛陽、許昌 —— 毛遂按劍而前,楚王乃許合縱。",
        goal: { kind: 'hold-cities', cityIds: ['luoyang', 'xuchang'], byYear: 200 },
      },
    },
  ],

  // Tian Dan restores Qi
  'scn-ws-tiandan': [
    {
      id: 'obj-wstd-qi',
      forceId: 'qi',
      primary: {
        title: { zh: '火牛陣', en: 'The Fire Oxen' },
        description: 'Retake Linzi and Beihai by 196 — a thousand oxen, blades on their horns, reeds alight on their tails.',
        descriptionZh: "於196年前收復臨淄、北海 —— 牛千餘,束兵刃於角,灌脂束葦於尾而燒之。",
        goal: { kind: 'hold-cities', cityIds: ['linzi', 'beihai'], byYear: 196 },
      },
      secondary: [
        {
          title: { zh: '復七十餘城', en: 'All Seventy Back' },
          description: 'Destroy the Yan force by 205.',
          descriptionZh: "於205年前逐燕出境 —— 七十餘城,一城不留。",
          goal: { kind: 'defeat-force', forceId: 'yan', byYear: 205 },
        },
      ],
    },
    {
      id: 'obj-wstd-yan',
      forceId: 'yan',
      primary: {
        title: { zh: '毋易樂毅', en: 'Do Not Recall Yue Yi' },
        description: 'Still hold Linzi and Langya in 200 — the reversal began with a change of general.',
        descriptionZh: "至200年仍保臨淄、琅琊 —— 敗局起於騎劫代將。",
        goal: { kind: 'hold-cities', cityIds: ['linzi', 'langya'], byYear: 200 },
      },
    },
    {
      id: 'obj-wstd-qin',
      forceId: 'qin',
      primary: {
        title: { zh: '遠交近攻', en: 'Befriend the Far, Attack the Near' },
        description: 'Take Luoyang, Xuchang and Shangdang by 200.',
        descriptionZh: "於200年前取洛陽、許昌、上黨 —— 范雎之策,自韓魏始。",
        goal: { kind: 'hold-cities', cityIds: ['luoyang', 'xuchang', 'shangdang'], byYear: 200 },
      },
    },
    {
      id: 'obj-wstd-zhao',
      forceId: 'zhao',
      primary: {
        title: { zh: '燕齊兩弊', en: 'Both Neighbours Exhausted' },
        description: 'Hold Ye, Taiyuan and Shangdang by 198.',
        descriptionZh: "於198年前據鄴城、太原、上黨。",
        goal: { kind: 'hold-cities', cityIds: ['ye', 'taiyuan', 'shangdang'], byYear: 198 },
      },
    },
  ],

  // Qin swallows the six states
  'scn-ws-qin-unify': [
    {
      id: 'obj-wsqu-qin',
      forceId: 'qin',
      primary: {
        title: { zh: '六王畢,四海一', en: 'Six Kings Ended, the Realm One' },
        description: 'Bring all under one banner — ten years, six states, in order.',
        descriptionZh: "混一天下 —— 十年之間,韓趙魏楚燕齊,以次而滅。",
        goal: { kind: 'unify-realm' },
      },
      secondary: [
        {
          title: { zh: '先滅韓趙', en: 'Han and Zhao First' },
          description: 'Destroy the Han force by 195.',
          descriptionZh: "於195年前滅韓 —— 六國之滅,自韓始。",
          goal: { kind: 'defeat-force', forceId: 'han', byYear: 195 },
        },
      ],
    },
    {
      id: 'obj-wsqu-chu',
      forceId: 'chu',
      primary: {
        title: { zh: '非六十萬不可', en: 'It Will Take Six Hundred Thousand' },
        description: "Destroy the Qin force by 208 — Xiang Yan broke Li Xin's twenty legions before Wang Jian came.",
        descriptionZh: "於208年前擊滅秦國 —— 項燕破李信二十萬,直到王翦以六十萬來。",
        goal: { kind: 'defeat-force', forceId: 'qin', byYear: 208 },
      },
      secondary: [
        {
          title: { zh: '守郢壽春', en: 'Hold the Southern Capitals' },
          description: 'Still hold Jiangling and Shouchun in 200.',
          descriptionZh: "至200年仍保江陵、壽春。",
          goal: { kind: 'hold-cities', cityIds: ['jiangling', 'shouchun'], byYear: 200 },
        },
      ],
    },
    {
      id: 'obj-wsqu-zhao',
      forceId: 'zhao',
      primary: {
        title: { zh: '李牧在,趙不亡', en: 'While Li Mu Lives' },
        description: 'Still hold Ye and Taiyuan in 202 — Zhao fell to a bribe, not to an army.',
        descriptionZh: "至202年仍保鄴城、太原 —— 趙不是敗於秦軍,是敗於一筆賄賂。",
        goal: { kind: 'hold-cities', cityIds: ['ye', 'taiyuan'], byYear: 202 },
      },
    },
    {
      id: 'obj-wsqu-qi',
      forceId: 'qi',
      primary: {
        title: { zh: '不助五國者亡', en: 'The Last to Fall, and the Easiest' },
        description: 'Survive to 212 — Qi surrendered without a battle after watching five states die.',
        descriptionZh: "存續至212年 —— 齊坐視五國之亡,最後不戰而降。",
        goal: { kind: 'survive-until', year: 212 },
      },
      secondary: [
        {
          title: { zh: '西向抗秦', en: 'Fight, This Time' },
          description: 'Take Pengcheng, Chenliu and Luoyang by 205.',
          descriptionZh: "於205年前西取彭城、陳留、洛陽 —— 這一次不要等到最後。",
          goal: { kind: 'hold-cities', cityIds: ['pengcheng', 'chenliu', 'luoyang'], byYear: 205 },
        },
      ],
    },
    {
      id: 'obj-wsqu-wei',
      forceId: 'wei',
      primary: {
        title: { zh: '大梁不灌', en: 'Do Not Let Them Flood Daliang' },
        description: 'Still hold Chenliu and Puyang in 200 — Wang Ben turned the Yellow River onto the city.',
        descriptionZh: "至200年仍保陳留、濮陽 —— 王賁引河溝灌大梁,三月城壞。",
        goal: { kind: 'hold-cities', cityIds: ['chenliu', 'puyang'], byYear: 200 },
      },
    },
    {
      id: 'obj-wsqu-yan',
      forceId: 'yan',
      primary: {
        title: { zh: '風蕭蕭兮易水寒', en: 'The Wind is Cold on the Yi River' },
        description: "Take Chang'an by 205 — a dagger in a map roll was the other plan.",
        descriptionZh: "於205年前攻取長安 —— 圖窮匕見是另一條路,這條路要用兵。",
        goal: { kind: 'hold-cities', cityIds: ['changan'], byYear: 205 },
      },
    },
    {
      id: 'obj-wsqu-han',
      forceId: 'han',
      primary: {
        title: { zh: '存韓', en: 'Preserve Han' },
        description: 'Survive to 200 — Han is first on the list.',
        descriptionZh: "存續至200年 —— 名單上的第一個就是你。",
        goal: { kind: 'survive-until', year: 200 },
      },
    },
  ],

  // ───────────────────────────────────────────────────────────────────────
  // Chu-Han. Same map and calendar caveat as the Warring States boards.
  // Chang'an = Xianyang, Pengcheng = Western Chu's capital, Guandu/Hulao =
  // the Xingyang-Chenggao line, Ye = Handan/Julu, Linzi = Qi.
  // ───────────────────────────────────────────────────────────────────────

  // The rising at Dazexiang
  'scn-ch-daze': [
    {
      id: 'obj-chdz-zhangchu',
      forceId: 'zhangchu',
      primary: {
        title: { zh: '王侯將相寧有種乎', en: 'Are Kings and Nobles Born to It?' },
        description: 'Take Luoyang by 190 — six hundred conscripts late for a garrison, and the law says death either way.',
        descriptionZh: "於190年前攻取洛陽 —— 失期當斬,舉大計亦死,等死,死國可乎?",
        goal: { kind: 'hold-cities', cityIds: ['luoyang'], byYear: 190 },
      },
      secondary: [
        {
          title: { zh: '入關滅秦', en: 'Through the Pass, End Qin' },
          description: "Take Chang'an by 196 — the first rising rarely gets there.",
          descriptionZh: "於196年前攻取長安 —— 首義者多半到不了咸陽。",
          goal: { kind: 'hold-cities', cityIds: ['changan'], byYear: 196 },
        },
      ],
    },
    {
      id: 'obj-chdz-qin',
      forceId: 'qin',
      primary: {
        title: { zh: '關東群盜', en: '"Merely Bandits, Your Majesty"' },
        description: 'Destroy the Zhangchu force by 192 — the court insisted there was no rebellion at all.',
        descriptionZh: "於192年前平定張楚 —— 朝廷上下都說那不過是群盜,不足憂。",
        goal: { kind: 'defeat-force', forceId: 'zhangchu', byYear: 192 },
      },
      secondary: [
        {
          title: { zh: '二世而不亡', en: 'Not Dead in the Second Generation' },
          description: 'Survive to 205 — the empire that was to last ten thousand generations.',
          descriptionZh: "存續至205年 —— 那個號稱傳之萬世的帝國。",
          goal: { kind: 'survive-until', year: 205 },
        },
      ],
    },
    {
      id: 'obj-chdz-chu',
      forceId: 'chu',
      primary: {
        title: { zh: '楚雖三戶', en: 'Though Chu Has But Three Households' },
        description: "Take Pengcheng and Chang'an by 196 — Xiang Liang raises the old Chu banner in Kuaiji.",
        descriptionZh: "於196年前取彭城、長安 —— 項梁起於會稽,立楚後以從民望。",
        goal: { kind: 'hold-cities', cityIds: ['pengcheng', 'changan'], byYear: 196 },
      },
    },
    {
      id: 'obj-chdz-qi',
      forceId: 'qi',
      primary: {
        title: { zh: '田氏復齊', en: 'The Tian Clan Restores Qi' },
        description: 'Hold Linzi, Beihai and Langya by 192, then take Pengcheng.',
        descriptionZh: "於192年前據臨淄、北海、琅琊 —— 田氏自立,齊地復國。",
        goal: { kind: 'hold-cities', cityIds: ['linzi', 'beihai', 'langya'], byYear: 192 },
      },
    },
  ],

  // The battle of Julu
  'scn-ch-julu': [
    {
      id: 'obj-chjl-chu',
      forceId: 'chu',
      primary: {
        title: { zh: '破釜沉舟', en: 'Break the Cauldrons, Sink the Boats' },
        description: 'Take Ye by 192 — three days of rations, no way back across the river.',
        descriptionZh: "於192年前攻取鉅鹿(鄴) —— 皆沉船,破釜甑,持三日糧,以示士卒必死。",
        goal: { kind: 'hold-cities', cityIds: ['ye'], byYear: 192 },
      },
      secondary: [
        {
          title: { zh: '諸侯膝行', en: 'The Lords Came in on Their Knees' },
          description: 'Destroy the Qin force by 198.',
          descriptionZh: "於198年前滅秦 —— 召見諸侯將,無不膝行而前,莫敢仰視。",
          goal: { kind: 'defeat-force', forceId: 'qin', byYear: 198 },
        },
      ],
    },
    {
      id: 'obj-chjl-qin',
      forceId: 'qin',
      primary: {
        title: { zh: '章邯不降', en: 'Zhang Han Does Not Surrender' },
        description: "Still hold Chang'an and Luoyang in 198 — the last army Qin had, and a court that would not back it.",
        descriptionZh: "至198年仍保長安、洛陽 —— 秦最後一支軍隊,和一個不肯支持它的朝廷。",
        goal: { kind: 'hold-cities', cityIds: ['changan', 'luoyang'], byYear: 198 },
      },
      secondary: [
        {
          title: { zh: '先破鉅鹿', en: 'Take Julu First' },
          description: 'Take Ye by 192.',
          descriptionZh: "於192年前攻下鉅鹿(鄴)。",
          goal: { kind: 'hold-cities', cityIds: ['ye'], byYear: 192 },
        },
      ],
    },
    {
      id: 'obj-chjl-zhao',
      forceId: 'zhao',
      primary: {
        title: { zh: '鉅鹿之圍', en: 'Under Siege at Julu' },
        description: 'Still hold Ye in 194 — ten allied armies watched from behind their walls.',
        descriptionZh: "至194年仍守鉅鹿(鄴) —— 諸侯軍十餘壁,無一人敢縱兵。",
        goal: { kind: 'hold-cities', cityIds: ['ye'], byYear: 194 },
      },
    },
    {
      id: 'obj-chjl-wei',
      forceId: 'wei',
      primary: {
        title: { zh: '魏地復國', en: 'Wei Restored' },
        description: 'Hold Puyang and take Luoyang by 196.',
        descriptionZh: "於196年前守濮陽並取洛陽 —— 魏豹得一城而稱王,總要再取一城。",
        goal: { kind: 'hold-cities', cityIds: ['puyang', 'luoyang'], byYear: 196 },
      },
    },
    {
      id: 'obj-chjl-qi',
      forceId: 'qi',
      primary: {
        title: { zh: '齊不救趙', en: 'Qi Does Not Ride to Julu' },
        description: 'Hold Linzi, Beihai and Langya by 194 — Qi sat out the decisive battle of the age.',
        descriptionZh: "於194年前據臨淄、北海、琅琊 —— 這個時代的決戰,齊沒有參加。",
        goal: { kind: 'hold-cities', cityIds: ['linzi', 'beihai', 'langya'], byYear: 194 },
      },
    },
  ],

  // Chu and Han contend
  'scn-ch-chuhan': [
    {
      id: 'obj-chch-han',
      forceId: 'han',
      primary: {
        title: { zh: '還定三秦', en: 'Take Back the Three Qin' },
        description: "Take Chang'an by 192, then Pengcheng — burn the plank roads, then walk out by Chencang.",
        descriptionZh: "於192年前攻取長安 —— 明修棧道,暗度陳倉。",
        goal: { kind: 'hold-cities', cityIds: ['changan'], byYear: 192 },
      },
      secondary: [
        {
          title: { zh: '垓下之圍', en: 'The Ring at Gaixia' },
          description: 'Destroy the Chu force by 200.',
          descriptionZh: "於200年前擊滅西楚 —— 四面楚歌,十面埋伏。",
          goal: { kind: 'defeat-force', forceId: 'chu', byYear: 200 },
        },
      ],
    },
    {
      id: 'obj-chch-chu',
      forceId: 'chu',
      primary: {
        title: { zh: '力拔山兮', en: 'My Strength Uprooted Mountains' },
        description: 'Destroy the Han force by 198 — you win every battle; that has never been the problem.',
        descriptionZh: "於198年前擊滅漢 —— 你每戰必勝,問題從來不在戰場上。",
        goal: { kind: 'defeat-force', forceId: 'han', byYear: 198 },
      },
      secondary: [
        {
          title: { zh: '守成皋滎陽', en: 'Hold the Chenggao Line' },
          description: 'Still hold Guandu and Hulao in 196.',
          descriptionZh: "至196年仍守滎陽、成皋(官渡、虎牢) —— 楚漢相持之地。",
          goal: { kind: 'hold-cities', cityIds: ['guandu', 'hulao'], byYear: 196 },
        },
      ],
    },
    {
      id: 'obj-chch-yong',
      forceId: 'yong',
      primary: {
        title: { zh: '三秦拒漢', en: 'The Three Qin Hold the Passes' },
        description: "Still hold Chang'an and Chencang in 194 — you were Qin's last general; hold what Xiang Yu gave you.",
        descriptionZh: "至194年仍保長安、陳倉 —— 你是秦最後的大將,守住項羽分給你的地方。",
        goal: { kind: 'hold-cities', cityIds: ['changan', 'chencang'], byYear: 194 },
      },
    },
    {
      id: 'obj-chch-qi',
      forceId: 'qi',
      primary: {
        title: { zh: '齊地自立', en: 'Qi Stands Alone' },
        description: 'Hold Linzi and Beihai by 194 — Tian Rong refused Xiang Yu\'s partition and paid for it.',
        descriptionZh: "於194年前據臨淄、北海 —— 田榮不受項羽之封,遂反。",
        goal: { kind: 'hold-cities', cityIds: ['linzi', 'beihai'], byYear: 194 },
      },
    },
    {
      id: 'obj-chch-zhao',
      forceId: 'zhao',
      primary: {
        title: { zh: '刎頸之交既絕', en: 'The Friendship That Broke' },
        description: 'Hold Ye and Changshan by 194 — Chen Yu and Zhang Er swore to die for each other, once.',
        descriptionZh: "於194年前據鄴城、常山 —— 陳餘與張耳,曾是刎頸之交。",
        goal: { kind: 'hold-cities', cityIds: ['ye', 'changshan'], byYear: 194 },
      },
    },
    {
      id: 'obj-chch-wei',
      forceId: 'wei',
      primary: {
        title: { zh: '首鼠兩端', en: 'Hedging Between Two Kings' },
        description: 'Still hold Luoyang and Puyang in 196 — Wei Bao changed sides once too often.',
        descriptionZh: "至196年仍保洛陽、濮陽 —— 魏豹反覆於楚漢之間,終為韓信所擒。",
        goal: { kind: 'hold-cities', cityIds: ['luoyang', 'puyang'], byYear: 196 },
      },
    },
    {
      id: 'obj-chch-jiujiang',
      forceId: 'jiujiang',
      primary: {
        title: { zh: '黥布反楚', en: 'The Tattooed King Turns' },
        description: 'Hold Shouchun and Hefei by 194, then take Pengcheng.',
        descriptionZh: "於194年前據壽春、合肥 —— 英布叛楚歸漢,淮南遂為戰場。",
        goal: { kind: 'hold-cities', cityIds: ['shouchun', 'hefei'], byYear: 194 },
      },
      secondary: [
        {
          title: { zh: '自取天下', en: 'Or Take It All Yourself' },
          description: 'Declare yourself emperor.',
          descriptionZh: "稱帝建號 —— 為人臣者,終不免鳥盡弓藏。",
          goal: { kind: 'declare-emperor' },
        },
      ],
    },
  ],

  // Retaking the Three Qin
  'scn-ch-sanqin': [
    {
      id: 'obj-chsq-han',
      forceId: 'han',
      primary: {
        title: { zh: '暗度陳倉', en: 'Out by Chencang' },
        description: "Take Chencang and Chang'an by 191 — the burnt roads were the point.",
        descriptionZh: "於191年前取陳倉、長安 —— 燒絕棧道以示無還心,正是為了這一天。",
        goal: { kind: 'hold-cities', cityIds: ['chencang', 'changan'], byYear: 191 },
      },
      secondary: [
        {
          title: { zh: '東出函谷', en: 'East Through Hangu' },
          description: 'Take Luoyang and Hanguguan by 195.',
          descriptionZh: "於195年前東出函谷關、取洛陽。",
          goal: { kind: 'hold-cities', cityIds: ['hanguguan', 'luoyang'], byYear: 195 },
        },
      ],
    },
    {
      id: 'obj-chsq-yong',
      forceId: 'yong',
      primary: {
        title: { zh: '塞漢中於巴蜀', en: 'Keep Them Bottled in Shu' },
        description: "Still hold Chang'an and Chencang in 194 — that is the whole reason you were given this land.",
        descriptionZh: "至194年仍保長安、陳倉 —— 項羽封你三秦,就是要你堵住漢中。",
        goal: { kind: 'hold-cities', cityIds: ['changan', 'chencang'], byYear: 194 },
      },
    },
    {
      id: 'obj-chsq-chu',
      forceId: 'chu',
      primary: {
        title: { zh: '北擊齊而已', en: 'Qi First, As Always' },
        description: 'Hold Pengcheng and take Linzi by 194 — Xiang Yu marched north while Han came out of the west.',
        descriptionZh: "於194年前守彭城並取臨淄 —— 項羽北擊齊之時,漢已出關。",
        goal: { kind: 'hold-cities', cityIds: ['pengcheng', 'linzi'], byYear: 194 },
      },
      secondary: [
        {
          title: { zh: '擊滅漢王', en: 'Destroy the King of Han' },
          description: 'Destroy the Han force.',
          descriptionZh: "擊滅漢王。",
          goal: { kind: 'defeat-force', forceId: 'han' },
        },
      ],
    },
    {
      id: 'obj-chsq-qi',
      forceId: 'qi',
      primary: {
        title: { zh: '牽制項羽', en: 'Pin Xiang Yu Down' },
        description: 'Still hold Linzi and Beihai in 195 — every month Qi holds is a month Han grows.',
        descriptionZh: "至195年仍保臨淄、北海 —— 齊多守一月,漢便多長一分。",
        goal: { kind: 'hold-cities', cityIds: ['linzi', 'beihai'], byYear: 195 },
      },
    },
    {
      id: 'obj-chsq-jiujiang',
      forceId: 'jiujiang',
      primary: {
        title: { zh: '按兵不動', en: 'Send No Troops' },
        description: 'Hold Shouchun and Hefei by 194 — Ying Bu answered neither call, and both kings noticed.',
        descriptionZh: "於194年前據壽春、合肥 —— 英布稱病不出,楚漢都記下了這一筆。",
        goal: { kind: 'hold-cities', cityIds: ['shouchun', 'hefei'], byYear: 194 },
      },
    },
  ],

  // The battle of Pengcheng
  'scn-ch-pengcheng': [
    {
      id: 'obj-chpc-chu',
      forceId: 'chu',
      primary: {
        title: { zh: '三萬破五十六萬', en: 'Thirty Thousand Against Half a Million' },
        description: 'Retake Pengcheng by 192 and destroy the Han army — the fastest reversal in the record.',
        descriptionZh: "於192年前收復彭城 —— 以三萬精騎,晨擊漢軍五十六萬,半日而破之。",
        goal: { kind: 'hold-cities', cityIds: ['pengcheng'], byYear: 192 },
      },
      secondary: [
        {
          title: { zh: '追亡逐北', en: 'Run Them Down' },
          description: 'Destroy the Han force by 198.',
          descriptionZh: "於198年前擊滅漢 —— 睢水為之不流。",
          goal: { kind: 'defeat-force', forceId: 'han', byYear: 198 },
        },
      ],
    },
    {
      id: 'obj-chpc-han',
      forceId: 'han',
      primary: {
        title: { zh: '守住彭城', en: 'Keep Pengcheng This Time' },
        description: 'Still hold Pengcheng in 194 — five armies, one banquet, and a cavalry charge at dawn.',
        descriptionZh: "至194年仍守彭城 —— 五諸侯兵五十六萬,入城即置酒高會,天亮時全完了。",
        goal: { kind: 'hold-cities', cityIds: ['pengcheng'], byYear: 194 },
      },
      secondary: [
        {
          title: { zh: '退保滎陽', en: 'Fall Back on Xingyang' },
          description: 'Still hold Guandu and Hulao in 196 — the line Han held for two years.',
          descriptionZh: "至196年仍保滎陽、成皋(官渡、虎牢) —— 漢就是在這裡撐了兩年。",
          goal: { kind: 'hold-cities', cityIds: ['guandu', 'hulao'], byYear: 196 },
        },
      ],
    },
    {
      id: 'obj-chpc-yong',
      forceId: 'yong',
      primary: {
        title: { zh: '廢丘之圍', en: 'The Siege of Feiqiu' },
        description: "Still hold Chang'an in 194.",
        descriptionZh: "至194年仍守長安 —— 章邯困守廢丘十月,終自刎。",
        goal: { kind: 'hold-cities', cityIds: ['changan'], byYear: 194 },
      },
    },
    {
      id: 'obj-chpc-qi',
      forceId: 'qi',
      primary: {
        title: { zh: '齊地未平', en: 'Qi Is Not Yet Pacified' },
        description: 'Still hold Linzi and Beihai in 195.',
        descriptionZh: "至195年仍保臨淄、北海 —— 項羽陷在齊地,劉邦才能襲彭城。",
        goal: { kind: 'hold-cities', cityIds: ['linzi', 'beihai'], byYear: 195 },
      },
    },
    {
      id: 'obj-chpc-jiujiang',
      forceId: 'jiujiang',
      primary: {
        title: { zh: '淮南之王', en: 'King of Huainan' },
        description: 'Hold Shouchun, Hefei and Lujiang by 194.',
        descriptionZh: "於194年前據壽春、合肥、廬江。",
        goal: { kind: 'hold-cities', cityIds: ['shouchun', 'hefei', 'lujiang'], byYear: 194 },
      },
    },
  ],

  // The battle of Jingxing
  'scn-ch-jingxing': [
    {
      id: 'obj-chjx-han',
      forceId: 'han',
      primary: {
        title: { zh: '背水一戰', en: 'With the River at Our Backs' },
        description: 'Take Ye and Changshan by 192 — put the men where they cannot run, and they will fight.',
        descriptionZh: "於192年前取鄴城、常山 —— 陷之死地而後生,置之亡地而後存。",
        goal: { kind: 'hold-cities', cityIds: ['ye', 'changshan'], byYear: 192 },
      },
      secondary: [
        {
          title: { zh: '再定燕齊', en: 'Then Yan and Qi' },
          description: 'Take Linzi and Ji by 196 — the northern half of the war, won by one man.',
          descriptionZh: "於196年前取臨淄、薊 —— 北方半壁,韓信一人下之。",
          goal: { kind: 'hold-cities', cityIds: ['linzi', 'ji'], byYear: 196 },
        },
      ],
    },
    {
      id: 'obj-chjx-zhao',
      forceId: 'zhao',
      primary: {
        title: { zh: '用李左車之策', en: "Take Li Zuoche's Advice" },
        description: 'Still hold Ye and Changshan in 194 — cut the supply train in the gorge; the plan was on the table.',
        descriptionZh: "至194年仍保鄴城、常山 —— 李左車請以奇兵絕其輜重,陳餘不聽。",
        goal: { kind: 'hold-cities', cityIds: ['ye', 'changshan'], byYear: 194 },
      },
    },
    {
      id: 'obj-chjx-chu',
      forceId: 'chu',
      primary: {
        title: { zh: '正面相持', en: 'Hold the Front Yourself' },
        description: 'Still hold Guandu and Hulao in 196, and take Pengcheng back if lost.',
        descriptionZh: "至196年仍守滎陽、成皋(官渡、虎牢) —— 你在正面壓住劉邦,北方卻在丟。",
        goal: { kind: 'hold-cities', cityIds: ['guandu', 'hulao'], byYear: 196 },
      },
      secondary: [
        {
          title: { zh: '救趙救齊', en: 'Save the North' },
          description: 'Take Ye and Linzi by 198.',
          descriptionZh: "於198年前取鄴城、臨淄 —— 韓信一路下去,楚之側翼全空。",
          goal: { kind: 'hold-cities', cityIds: ['ye', 'linzi'], byYear: 198 },
        },
      ],
    },
    {
      id: 'obj-chjx-qi',
      forceId: 'qi',
      primary: {
        title: { zh: '齊之最後', en: "Qi's Last Years" },
        description: 'Still hold Linzi and Beihai in 196 — Han Xin is coming east after Zhao.',
        descriptionZh: "至196年仍保臨淄、北海 —— 破趙之後,韓信就要東來。",
        goal: { kind: 'hold-cities', cityIds: ['linzi', 'beihai'], byYear: 196 },
      },
    },
    {
      id: 'obj-chjx-yong',
      forceId: 'yong',
      primary: {
        title: { zh: '關中殘局', en: 'What Is Left of Guanzhong' },
        description: "Still hold Chang'an in 194.",
        descriptionZh: "至194年仍守長安。",
        goal: { kind: 'hold-cities', cityIds: ['changan'], byYear: 194 },
      },
    },
  ],

  // The battle of Weishui
  'scn-ch-weishui': [
    {
      id: 'obj-chws-han',
      forceId: 'han',
      primary: {
        title: { zh: '囊沙壅水', en: 'Sandbags in the River' },
        description: 'Take Linzi and Beihai by 192 — dam the Wei upstream, let half of them cross, then open it.',
        descriptionZh: "於192年前取臨淄、北海 —— 夜作萬餘囊,壅濰水上流,半渡而決之。",
        goal: { kind: 'hold-cities', cityIds: ['linzi', 'beihai'], byYear: 192 },
      },
      secondary: [
        {
          title: { zh: '請為假王', en: 'Ask to Be Made King' },
          description: 'Declare yourself emperor — Han Xin asked for a provisional crown; it was the beginning of the end for him.',
          descriptionZh: "稱帝建號 —— 韓信請為假齊王,那封信是他後來一切禍事的開端。",
          goal: { kind: 'declare-emperor' },
        },
      ],
    },
    {
      id: 'obj-chws-qi',
      forceId: 'qi',
      primary: {
        title: { zh: '酈生已說降', en: 'We Had Already Surrendered' },
        description: 'Still hold Linzi and Beihai in 195 — Qi had agreed terms when Han Xin attacked anyway.',
        descriptionZh: "至195年仍保臨淄、北海 —— 酈食其已說降齊,韓信仍然襲之,酈生被烹。",
        goal: { kind: 'hold-cities', cityIds: ['linzi', 'beihai'], byYear: 195 },
      },
      secondary: [
        {
          title: { zh: '三分天下', en: 'A Third Way' },
          description: 'Survive to 205 — Kuai Tong argued Qi could be the third of three.',
          descriptionZh: "存續至205年 —— 蒯通說三分天下鼎足而立,那也是一條路。",
          goal: { kind: 'survive-until', year: 205 },
        },
      ],
    },
    {
      id: 'obj-chws-chu',
      forceId: 'chu',
      primary: {
        title: { zh: '救齊之師', en: 'The Army Sent to Save Qi' },
        description: 'Hold Linzi by 194 and Guandu through 196 — Long Ju took twenty legions east and lost them all.',
        descriptionZh: "於194年前取臨淄、196年前仍守滎陽 —— 龍且將二十萬東救,全軍覆沒。",
        goal: { kind: 'hold-cities', cityIds: ['linzi'], byYear: 194 },
      },
      secondary: [
        {
          title: { zh: '守住正面', en: 'Hold the Front' },
          description: 'Still hold Guandu and Hulao in 196.',
          descriptionZh: "至196年仍守滎陽、成皋(官渡、虎牢)。",
          goal: { kind: 'hold-cities', cityIds: ['guandu', 'hulao'], byYear: 196 },
        },
      ],
    },
  ],

  // The battle of Gaixia
  'scn-ch-gaixia': [
    {
      id: 'obj-chgx-han',
      forceId: 'han',
      primary: {
        title: { zh: '四面楚歌', en: 'Songs of Chu on Every Side' },
        description: 'Destroy the Chu force by 192 — thirty legions, ten ambushes, and a night of homesick singing.',
        descriptionZh: "於192年前擊滅西楚 —— 十面埋伏,夜聞四面皆楚歌。",
        goal: { kind: 'defeat-force', forceId: 'chu', byYear: 192 },
      },
      secondary: [
        {
          title: { zh: '取彭城', en: 'Take Pengcheng' },
          description: 'Hold Pengcheng and Xiapi by 193.',
          descriptionZh: "於193年前取彭城、下邳 —— 西楚之都。",
          goal: { kind: 'hold-cities', cityIds: ['pengcheng', 'xiapi'], byYear: 193 },
        },
      ],
    },
    {
      id: 'obj-chgx-chu',
      forceId: 'chu',
      primary: {
        title: { zh: '不肯過江東', en: 'He Would Not Cross the River' },
        description: 'Survive to 195 and hold Pengcheng — Jiangdong had eight thousand sons left to give.',
        descriptionZh: "存續至195年並保有彭城 —— 江東子弟多才俊,捲土重來未可知。",
        goal: { kind: 'survive-until', year: 195 },
      },
      secondary: [
        {
          title: { zh: '收復失地', en: 'Win It Back' },
          description: "Take Chang'an and Luoyang by 200.",
          descriptionZh: "於200年前克復長安、洛陽 —— 天亡我,非戰之罪?那就再戰一次。",
          goal: { kind: 'hold-cities', cityIds: ['changan', 'luoyang'], byYear: 200 },
        },
      ],
    },
  ],

  // ───────────────────────────────────────────────────────────────────────
  // Sui-Tang. Chang'an = the Tang capital, Luoyang = Wang Shichong's Zheng,
  // Ye = Dou Jiande's Xia, Taiyuan = the Li clan's base, Hulao = the pass where
  // one battle settled two kingdoms.
  // ───────────────────────────────────────────────────────────────────────

  // The end of Sui: the warlords contend
  'scn-st-suiend': [
    {
      id: 'obj-stse-tang',
      forceId: 'tang',
      primary: {
        title: { zh: '太原起兵', en: 'The Rising at Taiyuan' },
        description: "Hold Chang'an and take Luoyang by 195 — enter the pass first, hold it, then take the plain.",
        descriptionZh: "於195年前據長安並取洛陽 —— 先入關中,據險自固,再東出爭天下。",
        goal: { kind: 'hold-cities', cityIds: ['changan', 'luoyang'], byYear: 195 },
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
      id: 'obj-stse-wagang',
      forceId: 'wagang',
      primary: {
        title: { zh: '據洛口倉', en: 'Take the Granaries' },
        description: 'Take Luoyang by 194 — open the granaries and the hungry will come to you.',
        descriptionZh: "於194年前攻取洛陽 —— 開洛口倉恣民就食,饑者自來。",
        goal: { kind: 'hold-cities', cityIds: ['luoyang'], byYear: 194 },
      },
      secondary: [
        {
          title: { zh: '西入關中', en: 'Then Guanzhong' },
          description: "Take Chang'an by 200 — Li Mi argued against this road, and lost the empire on it.",
          descriptionZh: "於200年前西取長安 —— 李密不肯先入關,天下遂歸李氏。",
          goal: { kind: 'hold-cities', cityIds: ['changan'], byYear: 200 },
        },
      ],
    },
    {
      id: 'obj-stse-zheng',
      forceId: 'zheng',
      primary: {
        title: { zh: '據洛稱鄭', en: 'Zheng at Luoyang' },
        description: 'Still hold Luoyang in 196, and take Xuchang.',
        descriptionZh: "至196年仍據洛陽並取許昌 —— 王世充守洛陽,四面皆敵。",
        goal: { kind: 'hold-cities', cityIds: ['luoyang', 'xuchang'], byYear: 196 },
      },
    },
    {
      id: 'obj-stse-xia',
      forceId: 'xia',
      primary: {
        title: { zh: '河北夏王', en: 'The Xia King of Hebei' },
        description: 'Hold Ye and take Luoyang by 197 — the most popular ruler of the age, and the least lucky.',
        descriptionZh: "於197年前守鄴城並取洛陽 —— 竇建德最得民心,也最不走運。",
        goal: { kind: 'hold-cities', cityIds: ['ye', 'luoyang'], byYear: 197 },
      },
    },
    {
      id: 'obj-stse-xiqin',
      forceId: 'xiqin',
      primary: {
        title: { zh: '西秦入關', en: 'Xiqin Through the Pass' },
        description: "Take Chang'an by 194 — Xue Ju was one battle from taking the capital.",
        descriptionZh: "於194年前攻取長安 —— 薛舉離長安只差一戰。",
        goal: { kind: 'hold-cities', cityIds: ['changan'], byYear: 194 },
      },
    },
    {
      id: 'obj-stse-dingyang',
      forceId: 'dingyang',
      primary: {
        title: { zh: '南下并州', en: 'South into Bing' },
        description: 'Take Taiyuan by 194 — with Turkic horse behind you, the Li clan heartland is open.',
        descriptionZh: "於194年前攻取太原 —— 借突厥之騎,直搗李氏根本。",
        goal: { kind: 'hold-cities', cityIds: ['taiyuan'], byYear: 194 },
      },
    },
    {
      id: 'obj-stse-wu',
      forceId: 'wu',
      primary: {
        title: { zh: '江淮自立', en: 'The Jianghuai Host' },
        description: 'Hold Jianye, Shouchun and Hefei by 196.',
        descriptionZh: "於196年前據建業、壽春、合肥 —— 杜伏威領江淮群盜,自成一方。",
        goal: { kind: 'hold-cities', cityIds: ['jianye', 'shouchun', 'hefei'], byYear: 196 },
      },
    },
  ],

  // Qianshuiyuan
  'scn-st-qianshui': [
    {
      id: 'obj-stqs-tang',
      forceId: 'tang',
      primary: {
        title: { zh: '再戰淺水原', en: 'Qianshuiyuan, the Second Time' },
        description: "Take Tianshui and Anding by 193 — Li Shimin lost here once, then waited out their grain.",
        descriptionZh: "於193年前取天水、安定 —— 淺水原初戰唐敗,再戰堅壁不出,待其糧盡。",
        goal: { kind: 'hold-cities', cityIds: ['tianshui', 'anding'], byYear: 193 },
      },
      secondary: [
        {
          title: { zh: '平定隴右', en: 'Settle Longyou' },
          description: 'Destroy the Xiqin force by 197.',
          descriptionZh: "於197年前滅西秦 —— 隴右既平,關中乃安。",
          goal: { kind: 'defeat-force', forceId: 'xiqin', byYear: 197 },
        },
      ],
    },
    {
      id: 'obj-stqs-xiqin',
      forceId: 'xiqin',
      primary: {
        title: { zh: '直取長安', en: "Straight for Chang'an" },
        description: "Take Chang'an by 193 — press on now; Xue Ju's death is what saved the Tang.",
        descriptionZh: "於193年前攻取長安 —— 薛舉暴卒才救了唐,趁現在就打。",
        goal: { kind: 'hold-cities', cityIds: ['changan'], byYear: 193 },
      },
    },
    {
      id: 'obj-stqs-zheng',
      forceId: 'zheng',
      primary: {
        title: { zh: '西向爭關', en: 'West While Tang Is Busy' },
        description: "Hold Luoyang and take Tongguan by 196.",
        descriptionZh: "於196年前守洛陽並取潼關 —— 唐師在隴右,關東可乘。",
        goal: { kind: 'hold-cities', cityIds: ['luoyang', 'tongguan'], byYear: 196 },
      },
    },
    {
      id: 'obj-stqs-xia',
      forceId: 'xia',
      primary: {
        title: { zh: '併吞河北', en: 'All of Hebei' },
        description: 'Hold Ye, Pengcheng and Linzi by 196.',
        descriptionZh: "於196年前據鄴城、彭城、臨淄。",
        goal: { kind: 'hold-cities', cityIds: ['ye', 'pengcheng', 'linzi'], byYear: 196 },
      },
    },
  ],

  // Bobi
  'scn-st-bobi': [
    {
      id: 'obj-stbb-tang',
      forceId: 'tang',
      primary: {
        title: { zh: '柏壁堅壁', en: 'Wait Them Out at Bobi' },
        description: 'Retake Taiyuan and Shangdang by 194 — hold the line until their supply fails, then chase them for three days.',
        descriptionZh: "於194年前收復太原、上黨 —— 堅壁不戰以老其師,糧盡而追,一日八戰。",
        goal: { kind: 'hold-cities', cityIds: ['taiyuan', 'shangdang'], byYear: 194 },
      },
      secondary: [
        {
          title: { zh: '滅定楊', en: 'End Dingyang' },
          description: 'Destroy the Dingyang force by 197.',
          descriptionZh: "於197年前滅劉武周 —— 河東既復,唐之根本乃固。",
          goal: { kind: 'defeat-force', forceId: 'dingyang', byYear: 197 },
        },
      ],
    },
    {
      id: 'obj-stbb-dingyang',
      forceId: 'dingyang',
      primary: {
        title: { zh: '宋金剛南下', en: "Song Jin'gang Drives South" },
        description: "Hold Taiyuan and take Chang'an by 196 — you have taken the Li clan's home ground; do not stop.",
        descriptionZh: "於196年前守太原並取長安 —— 已奪李氏根本之地,不可頓兵。",
        goal: { kind: 'hold-cities', cityIds: ['taiyuan', 'changan'], byYear: 196 },
      },
    },
    {
      id: 'obj-stbb-zheng',
      forceId: 'zheng',
      primary: {
        title: { zh: '洛陽自守', en: 'Luoyang Holds' },
        description: 'Still hold Luoyang in 196 and take Xuchang.',
        descriptionZh: "至196年仍守洛陽並取許昌。",
        goal: { kind: 'hold-cities', cityIds: ['luoyang', 'xuchang'], byYear: 196 },
      },
    },
    {
      id: 'obj-stbb-xia',
      forceId: 'xia',
      primary: {
        title: { zh: '趁虛而西', en: 'West While They Fight in Hedong' },
        description: 'Hold Ye and take Luoyang by 197.',
        descriptionZh: "於197年前守鄴城並取洛陽。",
        goal: { kind: 'hold-cities', cityIds: ['ye', 'luoyang'], byYear: 197 },
      },
    },
  ],

  // Hulao: one battle, two kingdoms
  'scn-st-hulao': [
    {
      id: 'obj-sthl-tang',
      forceId: 'tang',
      primary: {
        title: { zh: '一戰擒兩王', en: 'Two Kings in One Battle' },
        description: 'Take Luoyang and Ye by 194 — besiege one, ambush the other at the pass with three thousand horse.',
        descriptionZh: "於194年前取洛陽、鄴城 —— 圍洛陽而不撤,以三千五百騎據虎牢待竇建德。",
        goal: { kind: 'hold-cities', cityIds: ['luoyang', 'ye'], byYear: 194 },
      },
      secondary: [
        {
          title: { zh: '混一宇內', en: 'Unify the Realm' },
          description: 'Bring all under one banner.',
          descriptionZh: "混一天下 —— 虎牢一戰之後,天下大勢已定。",
          goal: { kind: 'unify-realm' },
        },
      ],
    },
    {
      id: 'obj-sthl-zheng',
      forceId: 'zheng',
      primary: {
        title: { zh: '守洛待援', en: 'Hold Until Xia Arrives' },
        description: 'Still hold Luoyang in 195 — the city was down to eating clay when help came.',
        descriptionZh: "至195年仍守洛陽 —— 城中糧盡,以土屑為餅,夏王之援終於未到。",
        goal: { kind: 'hold-cities', cityIds: ['luoyang'], byYear: 195 },
      },
    },
    {
      id: 'obj-sthl-xia',
      forceId: 'xia',
      primary: {
        title: { zh: '毋赴虎牢', en: 'Do Not Go to Hulao' },
        description: 'Take Luoyang by 195 while still holding Ye — Ling Jing advised crossing north instead; you refused.',
        descriptionZh: "於195年前取洛陽且鄴城不失 —— 凌敬勸你北渡黃河取山西,你沒有聽。",
        goal: { kind: 'hold-cities', cityIds: ['luoyang', 'ye'], byYear: 195 },
      },
      secondary: [
        {
          title: { zh: '夏國不亡', en: 'Xia Endures' },
          description: 'Survive to 205.',
          descriptionZh: "存續至205年 —— 虎牢被擒之後,河北再無夏王。",
          goal: { kind: 'survive-until', year: 205 },
        },
      ],
    },
  ],

  // The An Lushan rebellion
  'scn-st-anshi': [
    {
      id: 'obj-stas-tang',
      forceId: 'tang',
      primary: {
        title: { zh: '兩京克復', en: 'Retake Both Capitals' },
        description: 'Retake Luoyang by 194 — and never order the Tongguan army out of its fortifications again.',
        descriptionZh: "於194年前收復洛陽 —— 並且不要再逼潼關守軍出戰。",
        goal: { kind: 'hold-cities', cityIds: ['luoyang'], byYear: 194 },
      },
      secondary: [
        {
          title: { zh: '河北盡復', en: 'All of Hebei Back' },
          description: 'Destroy the Yan force by 200.',
          descriptionZh: "於200年前平定大燕 —— 河北諸鎮,一個不留。",
          goal: { kind: 'defeat-force', forceId: 'yan', byYear: 200 },
        },
      ],
    },
    {
      id: 'obj-stas-yan',
      forceId: 'yan',
      primary: {
        title: { zh: '漁陽鼙鼓', en: 'The War Drums of Yuyang' },
        description: "Take Chang'an by 193 — the pass falls when the court forces its garrison into the open.",
        descriptionZh: "於193年前攻取長安 —— 漁陽鼙鼓動地來,潼關一破,九重城闕煙塵生。",
        goal: { kind: 'hold-cities', cityIds: ['changan'], byYear: 193 },
      },
      secondary: [
        {
          title: { zh: '大燕不亡', en: 'Yan Endures' },
          description: 'Survive to 205 — the rebellion outlived An Lushan by seven years; make it last longer.',
          descriptionZh: "存續至205年 —— 安祿山死後亂事仍延七年,這一次要更久。",
          goal: { kind: 'survive-until', year: 205 },
        },
      ],
    },
  ],
};
