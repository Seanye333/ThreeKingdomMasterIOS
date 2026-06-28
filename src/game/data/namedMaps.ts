import type { NamedBattleMap } from '../types';

/**
 * Pre-designed maps for specific city IDs. When a tactical battle is
 * launched against one of these cities, the named map's terrain layout,
 * weather, and special tiles override the procedural generation.
 */
export const NAMED_BATTLE_MAPS: NamedBattleMap[] = [
  {
    id: 'map-red-cliffs',
    name: { en: 'Red Cliffs', zh: '赤壁' },
    description:
      'A long Yangtze front. The northern fleet chained at the bank; the southern allies upstream. A wind from the south is the only hope.',
    width: 15,
    height: 11,
    weather: 'wind',
    timeOfDay: 'dusk',
    terrainOverrides: (() => {
      // Build a wide river slicing diagonally with bridges/fords.
      const out: Record<string, 'plain' | 'forest' | 'mountain' | 'river' | 'road'> = {};
      // River along rows 3-4
      for (let col = 0; col < 12; col++) {
        out[`${col},3`] = 'river';
        out[`${col},4`] = 'river';
      }
      // Forested cliffs to the south
      for (let col = 1; col < 11; col += 3) {
        out[`${col},6`] = 'forest';
        out[`${col + 1},7`] = 'forest';
      }
      // Mountain on the far western edge
      out['0,0'] = 'mountain';
      out['0,7'] = 'mountain';
      return out;
    })(),
    specialTiles: [
      { coord: { col: 5, row: 3 }, label: { en: 'Bridge', zh: '橋' }, role: 'bridge' },
      { coord: { col: 8, row: 3 }, label: { en: 'Ford', zh: '渡' }, role: 'bridge' },
    ],
    windDirection: 'east', // 東南風 — the fire blows down onto the chained northern fleet
    reinforcements: [
      { arriveTurn: 3, side: 'defender', officerId: 'huang-gai', troops: 1200, unitType: 'navy', edge: 'south',
        announcement: '🔥 黃蓋詐降,火船蔽江直撞連環 — 烈焰沖天!' },
    ],
    defenderObjective: { kind: 'survive-turns', turnsRequired: 6 },
    introZh: '北軍艦船相連、鎖如平地;只待東南風起,一炬可焚連營。守得風來,則勝。',
    introEn: 'Red Cliffs — the chained northern fleet awaits the south wind and the fire. Hold until it turns.',
  },
  {
    id: 'map-hulao-pass',
    name: { en: 'Hulao Pass', zh: '虎牢關' },
    description:
      'The mountain chokepoint where Liu, Guan, and Zhang faced Lü Bu. A narrow road runs between sheer cliffs.',
    width: 14,
    height: 10,
    weather: 'clear',
    timeOfDay: 'day',
    terrainOverrides: (() => {
      const out: Record<string, 'plain' | 'forest' | 'mountain' | 'river' | 'road'> = {};
      // Mountains on top and bottom rows
      for (let col = 0; col < 11; col++) {
        out[`${col},0`] = 'mountain';
        out[`${col},5`] = 'mountain';
      }
      // Road through the middle
      for (let col = 0; col < 11; col++) {
        out[`${col},2`] = 'road';
        out[`${col},3`] = 'road';
      }
      // Forest patches on the flanks
      out['3,1'] = 'forest';
      out['7,4'] = 'forest';
      return out;
    })(),
    specialTiles: [
      { coord: { col: 5, row: 2 }, label: { en: 'The Pass', zh: '關門' }, role: 'flag' },
    ],
    defenderObjective: { kind: 'survive-turns', turnsRequired: 6 },
    introZh: '虎牢關前,三英戰呂布!聯軍欲破關而入,守軍但須拒之關外,堅守即勝。',
    introEn: 'Hulao Pass — three heroes against Lü Bu. Hold the chokepoint and the day is yours.',
  },
  {
    id: 'map-changban',
    name: { en: 'Changban Bridge', zh: '長坂橋' },
    description:
      'Liu Bei flees south; Zhang Fei holds the bridge alone, Zhao Yun rides through the Cao army. Civilians fill the road.',
    width: 13,
    height: 10,
    weather: 'clear',
    timeOfDay: 'day',
    terrainOverrides: (() => {
      const out: Record<string, 'plain' | 'forest' | 'mountain' | 'river' | 'road'> = {};
      // River along row 4 with a bridge in the middle
      for (let col = 0; col < 10; col++) {
        out[`${col},4`] = 'river';
      }
      out['5,4'] = 'road'; // bridge
      // Road north-south through col 5
      for (let row = 0; row < 7; row++) {
        if (row !== 4) out[`5,${row}`] = 'road';
      }
      // Forest patches
      out['1,1'] = 'forest';
      out['8,6'] = 'forest';
      return out;
    })(),
    specialTiles: [
      { coord: { col: 5, row: 4 }, label: { en: 'Changban Bridge', zh: '長坂橋' }, role: 'bridge' },
      { coord: { col: 5, row: 6 }, label: { en: 'Civilian Wagons', zh: '民之車' }, role: 'wagon' },
    ],
    reinforcements: [
      { arriveTurn: 3, side: 'defender', officerId: 'zhang-fei', troops: 1000, unitType: 'spearmen', edge: 'west',
        announcement: '🗡 張飛橫矛立馬當陽橋 — 「燕人張翼德在此,誰敢與我決死!」' },
    ],
    defenderObjective: { kind: 'survive-turns', turnsRequired: 5 },
    introZh: '長坂橋頭,張飛據水斷橋、趙雲七進七出。掩護百姓,撐到援軍即可。',
    introEn: 'Changban — hold the bridge and cover the people until relief comes.',
  },
  {
    id: 'map-wuzhang-plains',
    name: { en: 'Wuzhang Plains', zh: '五丈原' },
    description:
      "Zhuge Liang's last campaign. A wide plain with the Wei river to the north. Sima Yi refuses every challenge.",
    width: 14,
    height: 10,
    weather: 'clear',
    timeOfDay: 'day',
    terrainOverrides: (() => {
      const out: Record<string, 'plain' | 'forest' | 'mountain' | 'river' | 'road'> = {};
      // Wei river on top
      for (let col = 0; col < 11; col++) out[`${col},0`] = 'river';
      // Mountain ridge to the south
      for (let col = 3; col < 8; col++) out[`${col},6`] = 'mountain';
      out['5,5'] = 'mountain';
      // Forest patches
      out['1,2'] = 'forest';
      out['9,3'] = 'forest';
      return out;
    })(),
    specialTiles: [
      { coord: { col: 5, row: 3 }, label: { en: 'Star Hill', zh: '星之丘' }, role: 'hill' },
    ],
    defenderObjective: { kind: 'survive-turns', turnsRequired: 6 }, // 司馬懿據守不出,待星落
    introZh: '武侯六出,陳兵五丈原。司馬懿堅壁拒戰 —— 蜀軍須速戰,魏軍但守得秋風起,大事定矣。',
    introEn: 'Wuzhang Plains — Zhuge Liang\'s last march. Sima Yi will not be drawn; hold until the autumn wind falls and the star with it.',
  },
  {
    id: 'map-guandu',
    name: { en: 'Guandu', zh: '官渡' },
    description:
      "Cao Cao's smaller host faces Yuan Shao's massive army. Granaries at Wuchao are the key.",
    width: 15,
    height: 10,
    weather: 'clear',
    timeOfDay: 'day',
    terrainOverrides: (() => {
      const out: Record<string, 'plain' | 'forest' | 'mountain' | 'river' | 'road'> = {};
      // Some forest cover
      out['2,1'] = 'forest';
      out['9,5'] = 'forest';
      out['5,5'] = 'forest';
      return out;
    })(),
    specialTiles: [
      { coord: { col: 10, row: 3 }, label: { en: 'Wuchao Granary', zh: '烏巣之倉' }, role: 'supply' },
    ],
    attackerObjective: { kind: 'capture-supply', tileCoord: { col: 10, row: 3 }, turnsRequired: 2 },
    introZh: '官渡決於烏巢 — 直取糧囤、焚其積穀,袁紹百萬之眾不戰自潰。',
    introEn: "Guandu hinges on Wuchao — seize the granary and Yuan Shao's vast host starves.",
  },

  // ─── Phase 35 additional maps ──────────────────────────────
  {
    id: 'map-maicheng',
    name: { en: 'Maicheng', zh: '麥城' },
    description:
      "Guan Yu's last stand. A small walled town encircled by Wu forces; his only path west is cut by Lü Meng's cavalry.",
    width: 12,
    height: 9,
    weather: 'rain',
    timeOfDay: 'dusk',
    terrainOverrides: (() => {
      const out: Record<string, 'plain' | 'forest' | 'mountain' | 'river' | 'road'> = {};
      // Forest cordons everywhere
      for (const [c, r] of [[1, 1], [2, 4], [6, 0], [7, 3], [3, 5]] as Array<[number, number]>) {
        out[`${c},${r}`] = 'forest';
      }
      // The road west — but with a forest ambush right at the exit
      out['0,2'] = 'road'; out['1,2'] = 'road'; out['2,2'] = 'road';
      out['1,3'] = 'forest';   // ambush hex
      return out;
    })(),
    specialTiles: [
      { coord: { col: 0, row: 2 }, label: { en: 'West Gate (escape)', zh: '西門' }, role: 'flag' },
    ],
    defenderObjective: { kind: 'escape' },
    introZh: '關羽走麥城,四面楚歌。殺出重圍、自西門突圍而走,方有生路。',
    introEn: 'Maicheng — surrounded. Cut your commander free out the west gate.',
  },
  {
    id: 'map-fancheng',
    name: { en: 'Fancheng', zh: '樊城' },
    description:
      "Guan Yu's siege of Cao's general Cao Ren. The Han river overflowed; Guan dammed it to drown Yu Jin's seven armies.",
    width: 14,
    height: 10,
    weather: 'rain',
    timeOfDay: 'day',
    terrainOverrides: (() => {
      const out: Record<string, 'plain' | 'forest' | 'mountain' | 'river' | 'road'> = {};
      // Han river slashes diagonally
      for (let c = 0; c < 11; c++) {
        out[`${c},3`] = 'river';
      }
      // The city of Fancheng is at the far right
      out['9,3'] = 'road';
      out['10,3'] = 'road';
      out['10,4'] = 'road';
      return out;
    })(),
    specialTiles: [
      { coord: { col: 10, row: 3 }, label: { en: 'Fancheng', zh: '樊城' }, role: 'flag' },
      { coord: { col: 5, row: 2 }, label: { en: 'Han Dam (Guan Yu)', zh: '漢水堰' }, role: 'bridge' },
    ],
    defenderObjective: { kind: 'survive-turns', turnsRequired: 6 }, // 曹仁守孤城待援
    introZh: '關羽圍樊,漢水暴漲。決漢水堰則七軍盡沒(水淹七軍) —— 曹仁但能守得援軍至,圍自解矣。',
    introEn: 'Fancheng — break the Han dam and the relief army drowns (水淹七軍). Cao Ren must hold the walls until rescue comes.',
  },
  {
    id: 'map-dingjun',
    name: { en: 'Mt. Dingjun', zh: '定軍山' },
    description:
      "Huang Zhong's miracle. A tall mountain over the Hanzhong corridor where the old general struck down Xiahou Yuan in a single charge.",
    width: 13,
    height: 11,
    weather: 'clear',
    timeOfDay: 'dawn',
    terrainOverrides: (() => {
      const out: Record<string, 'plain' | 'forest' | 'mountain' | 'river' | 'road'> = {};
      // Mountain massif center
      for (let c = 3; c <= 6; c++) {
        for (let r = 2; r <= 5; r++) out[`${c},${r}`] = 'mountain';
      }
      out['4,3'] = 'plain'; out['5,3'] = 'plain'; // High plateau (clear shot)
      // Roads
      for (let c = 0; c < 10; c++) out[`${c},7`] = 'road';
      return out;
    })(),
    specialTiles: [
      { coord: { col: 4, row: 3 }, label: { en: 'High Plateau', zh: '山頂' }, role: 'hill' },
    ],
    reinforcements: [
      { arriveTurn: 3, side: 'attacker', officerId: 'huang-zhong', troops: 1500, unitType: 'cavalry', edge: 'west',
        announcement: '⚔ 老將黃忠居高鼓譟、勢如雷霆 — 直取夏侯淵!' },
    ],
    attackerObjective: { kind: 'destroy-commander' },
    introZh: '定軍山,老黃忠居高臨下、一刀斬夏侯淵。取敵主將首級者勝。',
    introEn: 'Mt. Dingjun — strike from the heights and cut down the enemy commander.',
  },
  {
    id: 'map-jieting',
    name: { en: 'Jieting', zh: '街亭' },
    description:
      'The strategic chokepoint Ma Su lost — by camping atop the hill instead of holding the road below. Sima Yi cut off his water and broke him.',
    width: 13,
    height: 9,
    weather: 'clear',
    timeOfDay: 'day',
    terrainOverrides: (() => {
      const out: Record<string, 'plain' | 'forest' | 'mountain' | 'river' | 'road'> = {};
      // Central hill (the fatal one Ma Su climbed)
      for (const k of ['4,2', '4,3', '5,2', '5,3']) {
        out[k] = 'mountain';
      }
      // Vital road
      for (let c = 0; c < 10; c++) out[`${c},4`] = 'road';
      // The spring (water)
      out['3,3'] = 'river';
      return out;
    })(),
    specialTiles: [
      { coord: { col: 4, row: 2 }, label: { en: 'Lone Hill (Ma Su\'s mistake)', zh: '孤山' }, role: 'hill' },
      { coord: { col: 3, row: 3 }, label: { en: 'Spring', zh: '水源' }, role: 'supply' },
    ],
    reinforcements: [
      { arriveTurn: 4, side: 'defender', officerId: 'wang-ping', troops: 1200, unitType: 'infantry', edge: 'west',
        announcement: '🛡 王平鳴鼓徐退、當道拒守 — 收攏敗兵,不教全軍盡潰!' },
    ],
    defenderObjective: { kind: 'hold-tile', tileCoord: { col: 3, row: 3 }, turnsRequired: 5 },
    introZh: '街亭當道,守住水源即守住糧道。莫學馬謖舍水上山,自陷絕地。',
    introEn: 'Jieting — hold the spring astride the road; do not abandon the water for the hill.',
  },
  // ─── Six new famous battlefields ──────────────────────────────────
  {
    id: 'map-hefei',
    name: { en: 'Hefei', zh: '合肥' },
    description: 'The wide plain north of Hefei where Zhang Liao\'s 800 broke Sun Quan\'s 100,000.',
    width: 14,
    height: 10,
    weather: 'clear',
    timeOfDay: 'dawn',
    terrainOverrides: (() => {
      const out: Record<string, import('../types').TerrainKind> = {};
      // River along the far north (Xiaoyao Ford 逍遙津).
      for (let col = 0; col < 14; col++) out[`${col},0`] = 'river';
      out['7,0'] = 'bridge';
      // City wall on south (Hefei city itself).
      for (let col = 4; col < 11; col++) out[`${col},9`] = 'gate';
      // Watchtower flanks.
      out['3,8'] = 'watchtower';
      out['10,8'] = 'watchtower';
      // Light scattered hills.
      out['5,4'] = 'hill';
      out['9,5'] = 'hill';
      return out;
    })(),
    specialTiles: [
      { coord: { col: 7, row: 0 }, label: { en: 'Xiaoyao Ford', zh: '逍遙津' }, role: 'bridge' },
    ],
    reinforcements: [
      { arriveTurn: 3, side: 'defender', officerId: 'zhang-liao', troops: 1600, unitType: 'cavalry', edge: 'east',
        announcement: '🐎 張遼率八百死士直衝吳營 — 威震逍遙津!' },
    ],
    defenderObjective: { kind: 'survive-turns', turnsRequired: 6 },
    introZh: '合肥逍遙津,張遼八百破十萬。孤城拒眾,守得住便是威震江東。',
    introEn: 'Hefei — 800 against a host. Hold the lone fort and shatter their nerve.',
  },
  {
    id: 'map-yiling',
    name: { en: 'Yiling', zh: '夷陵' },
    description: 'Where Lu Xun burned Liu Bei\'s 700-li camps. Forested gorges with the Yangtze to one side.',
    width: 16,
    height: 10,
    weather: 'wind',
    timeOfDay: 'dusk',
    terrainOverrides: (() => {
      const out: Record<string, import('../types').TerrainKind> = {};
      // River north edge.
      for (let col = 0; col < 16; col++) out[`${col},0`] = 'river';
      // Mountains south.
      for (let col = 0; col < 16; col++) out[`${col},9`] = 'mountain';
      // Forested camps stretching the whole battlefield — fire bait.
      for (let col = 2; col < 15; col += 2) {
        out[`${col},3`] = 'forest';
        out[`${col + 1},5`] = 'forest';
        out[`${col},7`] = 'forest';
      }
      out['10,4'] = 'hill';
      return out;
    })(),
    specialTiles: [
      { coord: { col: 10, row: 4 }, label: { en: 'Lu Xun\'s Observation Hill', zh: '陸遜瞭望' }, role: 'hill' },
    ],
    windDirection: 'east', // 東風 — fire sweeps the forested camps (火燒連營)
    defenderObjective: { kind: 'survive-turns', turnsRequired: 6 },
    introZh: '夷陵連營七百里,皆紮林間。陸遜按兵不動,只待東風一炬 — 火燒連營。',
    introEn: 'Yiling — 700 li of camps in the woods. Bide your time for the wind and the fire.',
  },
  {
    id: 'map-bowangpo',
    name: { en: 'Bowang Slope', zh: '博望坡' },
    description: 'Zhuge Liang\'s first stratagem — a narrow forested defile lured Cao\'s vanguard into fire.',
    width: 12,
    height: 10,
    weather: 'clear',
    timeOfDay: 'day',
    terrainOverrides: (() => {
      const out: Record<string, import('../types').TerrainKind> = {};
      // Mountain walls north and south.
      for (let col = 0; col < 12; col++) {
        out[`${col},0`] = 'mountain';
        out[`${col},9`] = 'mountain';
      }
      // Dense forest along the central road.
      for (let col = 1; col < 11; col++) {
        out[`${col},3`] = 'forest';
        out[`${col},6`] = 'forest';
      }
      // Road runs through center.
      for (let col = 0; col < 12; col++) out[`${col},5`] = 'road';
      out['6,5'] = 'chokepoint';
      return out;
    })(),
    specialTiles: [
      { coord: { col: 6, row: 5 }, label: { en: 'Defile', zh: '隘口' }, role: 'hill' },
    ],
  },
  {
    id: 'map-xinye',
    name: { en: 'Xinye', zh: '新野' },
    description: 'Liu Bei\'s burning of Xinye — a small walled town set ablaze to delay Cao Cao\'s pursuit.',
    width: 12,
    height: 9,
    weather: 'wind',
    timeOfDay: 'dusk',
    terrainOverrides: (() => {
      const out: Record<string, import('../types').TerrainKind> = {};
      // City gate cluster south.
      for (let col = 4; col < 9; col++) out[`${col},8`] = 'gate';
      // Forests surrounding (kindling).
      for (let col = 1; col < 11; col += 2) {
        out[`${col},2`] = 'forest';
        out[`${col + 1},4`] = 'forest';
        out[`${col},6`] = 'forest';
      }
      out['6,5'] = 'hill';
      return out;
    })(),
    specialTiles: [
      { coord: { col: 6, row: 8 }, label: { en: 'Xinye Town', zh: '新野城' }, role: 'flag' },
    ],
    windDirection: 'south', // 風助火勢 — Zhuge's fire engulfs the wooded town
    defenderObjective: { kind: 'survive-turns', turnsRequired: 5 }, // 火燒新野,遲滯曹軍追兵
    introZh: '火燒新野 —— 棄一座空城,引曹軍入火林。風起焰騰,撐住延滯追兵,百姓得渡。',
    introEn: 'Xinye — abandon the town as a torch. Lure the pursuit into the burning woods and delay them long enough.',
  },
  {
    id: 'map-tongguan',
    name: { en: 'Tong Pass', zh: '潼關' },
    description: 'Where Cao Cao stripped off his red robe and cut his beard to escape Ma Chao\'s charge. A river-side pass.',
    width: 14,
    height: 10,
    weather: 'clear',
    timeOfDay: 'day',
    terrainOverrides: (() => {
      const out: Record<string, import('../types').TerrainKind> = {};
      // The Yellow River on the north edge.
      for (let col = 0; col < 14; col++) out[`${col},0`] = 'river';
      // Mountain wall south of the road.
      for (let col = 0; col < 14; col++) out[`${col},9`] = 'mountain';
      for (let col = 0; col < 14; col++) out[`${col},7`] = 'mountain';
      // Pass road.
      for (let col = 0; col < 14; col++) out[`${col},5`] = 'road';
      out['7,5'] = 'chokepoint';
      // Two bridges crossing the river.
      out['3,0'] = 'bridge';
      out['10,0'] = 'bridge';
      return out;
    })(),
    specialTiles: [
      { coord: { col: 7, row: 5 }, label: { en: 'Tong Pass Gate', zh: '潼關' }, role: 'flag' },
    ],
  },
  {
    id: 'map-hanzhong',
    name: { en: 'Yangping Pass', zh: '陽平關' },
    description: 'The gateway into the Hanzhong basin — forested ridges and steep cliffs barring the road south. Liu Bei contests Cao Cao for the whole region.',
    width: 14,
    height: 12,
    weather: 'clear',
    timeOfDay: 'dawn',
    terrainOverrides: (() => {
      const out: Record<string, import('../types').TerrainKind> = {};
      // Mountain ridge north + south.
      for (let col = 0; col < 14; col++) {
        out[`${col},0`] = 'mountain';
        out[`${col},11`] = 'mountain';
      }
      // Forested approaches.
      for (let col = 1; col < 13; col += 2) {
        out[`${col},2`] = 'forest';
        out[`${col + 1},9`] = 'forest';
      }
      // Hills — high ground.
      out['4,5'] = 'hill';
      out['9,5'] = 'hill';
      out['7,6'] = 'watchtower';
      return out;
    })(),
    specialTiles: [
      { coord: { col: 7, row: 6 }, label: { en: 'Pass Watchtower', zh: '關樓' }, role: 'hill' },
    ],
    defenderObjective: { kind: 'survive-turns', turnsRequired: 6 }, // 曹軍扼關待援
    introZh: '陽平天險,一夫當關。曹軍據關以拒劉備 —— 守住關隘,則漢中可保;一旦失守,蜀軍長驅而入。',
    introEn: 'Yangping Pass — hold this gate and Hanzhong is safe; lose it and Liu Bei pours into the basin.',
  },
  // ─── Three more famous battlefields ─────────────────────────────────
  {
    id: 'map-chencang',
    name: { en: 'Chencang', zh: '陳倉' },
    description:
      'Hao Zhao\'s thousand held Zhuge Liang\'s hundred thousand for twenty days — a small fortress plugging a narrow valley, every approach under the wall.',
    width: 14,
    height: 10,
    weather: 'snow',
    timeOfDay: 'day',
    terrainOverrides: (() => {
      const out: Record<string, import('../types').TerrainKind> = {};
      // Steep valley sides squeeze the approach.
      for (let col = 0; col < 14; col++) {
        out[`${col},0`] = 'mountain';
        out[`${col},9`] = 'mountain';
      }
      for (let col = 6; col < 14; col++) {
        out[`${col},1`] = 'mountain';
        out[`${col},8`] = 'mountain';
      }
      // The fortress wall ring with a single gate.
      for (const r of [3, 4, 5, 6]) out[`11,${r}`] = 'wall';
      out['11,4'] = 'gate';
      // Watch positions on the wall shoulders.
      out['10,3'] = 'watchtower';
      out['10,6'] = 'watchtower';
      // A frozen stream cuts the open ground.
      for (const r of [2, 3, 4, 5, 6, 7]) out[`4,${r}`] = 'river';
      out['4,4'] = 'bridge';
      return out;
    })(),
    specialTiles: [
      { coord: { col: 11, row: 4 }, label: { en: 'Chencang Gate', zh: '陳倉城門' }, role: 'flag' },
      { coord: { col: 4, row: 4 }, label: { en: 'Frozen Ford', zh: '冰河渡口' }, role: 'bridge' },
    ],
  },
  {
    id: 'map-ruxukou',
    name: { en: 'Ruxukou', zh: '濡須口' },
    description:
      'The fortified river mouth where Wu\'s navy checked Cao Cao again and again — "a son should be like Sun Zhongmou."',
    width: 16,
    height: 10,
    weather: 'rain',
    timeOfDay: 'dusk',
    terrainOverrides: (() => {
      const out: Record<string, import('../types').TerrainKind> = {};
      // The Ruxu water runs through the middle of the field.
      for (let col = 0; col < 16; col++) {
        out[`${col},4`] = 'river';
        out[`${col},5`] = 'river';
      }
      out['5,4'] = 'bridge';
      out['5,5'] = 'bridge';
      out['11,4'] = 'bridge';
      out['11,5'] = 'bridge';
      // Wu's fortified dock on the south bank.
      for (const c of [12, 13, 14]) out[`${c},7`] = 'wall';
      out['13,7'] = 'gate';
      out['12,8'] = 'watchtower';
      // Marshy banks.
      for (const c of [1, 3, 7, 9]) { out[`${c},3`] = 'marsh'; out[`${c},6`] = 'marsh'; }
      return out;
    })(),
    specialTiles: [
      { coord: { col: 5, row: 4 }, label: { en: 'Upper Crossing', zh: '上渡' }, role: 'bridge' },
      { coord: { col: 11, row: 5 }, label: { en: 'Lower Crossing', zh: '下渡' }, role: 'bridge' },
      { coord: { col: 13, row: 7 }, label: { en: 'Ruxu Fort', zh: '濡須塢' }, role: 'flag' },
    ],
  },
  {
    id: 'map-xiapi',
    name: { en: 'Xiapi', zh: '下邳' },
    description:
      'Cao Cao broke the dikes of the Yi and Si to drown Lü Bu\'s last city — the walls rise from floodwater, and the White Gate Tower waits.',
    width: 15,
    height: 10,
    weather: 'rain',
    timeOfDay: 'day',
    terrainOverrides: (() => {
      const out: Record<string, import('../types').TerrainKind> = {};
      // Floodwater laps the city on three sides.
      for (let col = 8; col < 15; col++) { out[`${col},0`] = 'river'; out[`${col},9`] = 'river'; }
      for (const r of [1, 2, 7, 8]) out[`14,${r}`] = 'river';
      // The city wall, gate at the White Gate Tower.
      for (const r of [2, 3, 4, 5, 6, 7]) out[`11,${r}`] = 'wall';
      out['11,4'] = 'gate';
      out['12,4'] = 'watchtower';
      // Mudflats where the flood receded.
      for (const c of [7, 8, 9]) { out[`${c},2`] = 'marsh'; out[`${c},7`] = 'marsh'; }
      return out;
    })(),
    specialTiles: [
      { coord: { col: 12, row: 4 }, label: { en: 'White Gate Tower', zh: '白門樓' }, role: 'flag' },
    ],
  },
];

// NOTE: city ids in cities.ts are BARE ('hefei', 'fancheng' …). These keys
// used to carry a 'city-' prefix that never matched, so every named
// battlefield was silently dead content — sieges always rolled procedural
// terrain. Keys now match the real catalog (verified against cities.ts).
export const NAMED_MAPS_BY_CITY: Record<string, string> = {
  'fancheng':  'map-fancheng',
  'jiangling': 'map-maicheng',
  'hanzhong':  'map-dingjun',
  'mei':       'map-wuzhang-plains', // 郿 — 諸葛亮 last campaign by the 五丈原
  'yangping':  'map-hanzhong',       // 陽平關 — the gateway into the Hanzhong basin
  'tianshui':  'map-jieting',
  'chibi':     'map-red-cliffs',
  'changban':  'map-changban',
  'changan':   'map-hulao-pass',
  'luoyang':   'map-hulao-pass',
  'guandu':    'map-guandu',
  'hefei':     'map-hefei',
  'yiling':    'map-yiling',
  'xinye':     'map-xinye',
  'bowang':    'map-bowangpo',
  'tongguan':  'map-tongguan',
  'chencang':  'map-chencang',
  'ruxu':      'map-ruxukou',
  'xiapi':     'map-xiapi',
};

export const NAMED_MAPS_BY_ID: Record<string, NamedBattleMap> =
  Object.fromEntries(NAMED_BATTLE_MAPS.map((m) => [m.id, m]));
