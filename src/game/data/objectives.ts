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
      id: 'obj-190-liu-bei',
      forceId: 'liu-bei',
      primary: {
        title: { zh: '徐州奪取', en: 'Take Xuzhou' },
        description: 'Hold Pengcheng + Xiapi by 198 AD.',
        descriptionZh: "於198年前同時據有彭城與下邳。",
        goal: { kind: 'hold-cities', cityIds: ['pengcheng', 'xiapi'], byYear: 198 },
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
};
