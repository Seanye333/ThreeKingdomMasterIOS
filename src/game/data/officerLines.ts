/**
 * 名將台詞 — signature spoken lines for famous warriors, used in the 3D 單挑 so
 * a great general taunts and finishes in their own voice rather than a generic
 * persona barb. Each officer has a pool of 挑釁 (pre-duel goads) and 必殺 (lines
 * cried on an unleashed finisher). Unknown officers fall back to the persona
 * lines in data/battleLines.ts.
 */
export interface OfficerLines { taunt: Array<{ zh: string; en: string }>; ult: Array<{ zh: string; en: string }>; }

const L = (zh: string, en: string) => ({ zh, en });

export const OFFICER_DUEL_LINES: Record<string, OfficerLines> = {
  'lu-bu': {
    taunt: [L('天下英雄,誰敢與我一戰?', 'Heroes of the realm — who dares face me?'), L('量你也不過如此!', 'You are nothing before me!')],
    ult: [L('方天畫戟,取你首級!', 'My Sky Piercer takes your head!'), L('人中呂布,馬中赤兔!', 'Lü Bu among men, Red Hare among horses!')],
  },
  'guan-yu': {
    taunt: [L('插標賣首之輩,也敢攔我?', 'A head for sale — and you bar my way?'), L('吾觀汝首,如探囊取物。', 'Your head is mine for the taking.')],
    ult: [L('青龍偃月,斬!', 'Green Dragon Blade — cut him down!'), L('待我提刀,過五關!', 'My blade carves through all who stand!')],
  },
  'zhang-fei': {
    taunt: [L('燕人張飛在此,誰敢決死戰!', 'Zhang Fei of Yan stands here — who dares fight to the death!'), L('喝!匹夫休走!', 'Hold, coward! Stand and fight!')],
    ult: [L('丈八蛇矛,取你性命!', 'My Serpent Spear ends you!'), L('當陽橋頭,聲震如雷!', 'My roar at Changban shakes the earth!')],
  },
  'zhao-yun': {
    taunt: [L('常山趙子龍在此!', 'Zhao Zilong of Changshan stands before you!'), L('七進七出,何懼於汝?', 'Seven charges through a host — why fear you?')],
    ult: [L('一身是膽,看槍!', 'All courage — taste my spear!'), L('長坂坡前,無人能擋!', 'None stopped me at Changban!')],
  },
  'ma-chao': {
    taunt: [L('錦馬超在此,曹賊膽寒!', 'Ma Chao the Splendid — let traitors tremble!'), L('西涼鐵騎,踏破爾營!', 'My Liang riders will trample your camp!')],
    ult: [L('為父報仇,看槍!', 'For my father — my spear!'), L('銀甲白袍,無堅不摧!', 'Silver mail, white robe — nothing withstands me!')],
  },
  'dian-wei': {
    taunt: [L('古之惡來,豈容爾等放肆!', 'The Wicked Lai of old — mind your tongue!'), L('某在此,賊休近前!', 'I stand here — come no closer, knave!')],
    ult: [L('雙戟在手,有死無生!', 'Twin halberds in hand — none survive!'), L('護主拼命,殺!', 'For my lord, to the death!')],
  },
  'xu-chu': {
    taunt: [L('虎癡許褚,與你一搏!', 'Tiger-fool Xu Chu — let us grapple!'), L('裸衣鬥馬超,亦不在話下!', 'I fought Ma Chao bare-chested — you are nothing!')],
    ult: [L('力大無窮,看招!', 'Boundless strength — take this!'), L('某這一拳,碎金裂石!', 'My blow shatters gold and stone!')],
  },
  'taishi-ci': {
    taunt: [L('東萊太史慈,特來會你!', 'Taishi Ci of Donglai comes to meet you!'), L('神亭一戰,可還記得?', 'Do you recall our duel at Shenting?')],
    ult: [L('箭無虛發,弓開如月!', 'My arrows never miss — the bow bends like the moon!'), L('大丈夫當帶三尺劍,立不世之功!', 'A true man wins deathless glory by the sword!')],
  },
  'gan-ning': {
    taunt: [L('錦帆賊甘興霸在此!', 'Gan Xingba of the Brocade Sails is here!'), L('百騎劫營,何曾怕死?', 'A hundred riders raided a camp — death holds no fear!')],
    ult: [L('鈴響弓鳴,授首吧!', 'Bells ring, bow sings — yield your head!'), L('江東之虎,撕碎爾等!', 'The tiger of the south tears you apart!')],
  },
  'huang-zhong': {
    taunt: [L('老將黃忠,寶刀未老!', 'Old Huang Zhong — my blade is far from blunt!'), L('莫欺我年邁,看箭!', 'Mock my grey hairs? Then taste my arrow!')],
    ult: [L('百步穿楊,一箭斃命!', 'A hundred paces, one arrow, one kill!'), L('定軍山上,斬夏侯!', 'At Mount Dingjun I felled Xiahou!')],
  },
  'zhang-liao': {
    taunt: [L('張遼在此,誰來受死!', 'Zhang Liao stands here — who comes to die!'), L('八百破十萬,豈懼於汝!', 'Eight hundred broke a hundred thousand — why fear you!')],
    ult: [L('威震逍遙津,看刀!', 'The terror of Xiaoyao Ford — my blade!'), L('止啼小兒,今日授首!', 'I who silence crying children — yield your head!')],
  },
  'sun-ce': {
    taunt: [L('江東小霸王,會你一會!', 'The Little Conqueror of the south greets you!'), L('父業我承,何人敢擋?', 'I carry my father\'s work — who dares bar me?')],
    ult: [L('一槍挑落,定江東!', 'One spear-thrust to win the south!'), L('小霸王之名,非浪得也!', 'My name is no idle boast!')],
  },
};

/** Signature taunt/ult lines for an officer, or null to use the persona fallback. */
export function officerDuelLine(id: string, kind: 'taunt' | 'ult', idx = 0): { zh: string; en: string } | null {
  const lines = OFFICER_DUEL_LINES[id];
  if (!lines) return null;
  const pool = lines[kind];
  if (!pool || pool.length === 0) return null;
  return pool[((idx % pool.length) + pool.length) % pool.length];
}
