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
        title: { zh: '黃巾之鎮圧', en: 'Suppress the Yellow Turbans' },
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
};
