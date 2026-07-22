/**
 * 絕命詩 — Final words / death poems for famous officers.
 *
 * When a named officer in this table dies (any cause — combat, plague,
 * intrigue), the season report includes their final lines. Selected from
 * historical record and Romance of the Three Kingdoms.
 */
export interface DeathPoem {
  zh: string;
  en: string;
}

export const DEATH_POEMS: Record<string, DeathPoem> = {
  'guan-yu': {
    zh: '玉可碎而不可改其白，竹可焚而不可毀其節。',
    en: 'Jade may shatter but its whiteness cannot be changed; bamboo may burn but its rectitude cannot be unmade.',
  },
  'zhuge-liang': {
    zh: '鞠躬盡瘁，死而後已 — 出師未捷身先死，長使英雄淚滿襟。',
    en: '"To bow my head and exert all my strength until death" — alas, the campaign unfinished, I fall first; let heroes hereafter weep into their robes.',
  },
  'cao-cao': {
    zh: '對酒當歌，人生幾何？譬如朝露，去日苦多。',
    en: 'Wine before song — how brief a life. Like morning dew, our days vanish.',
  },
  'liu-bei': {
    zh: '勿以善小而不為，勿以惡小而為之 — 唯賢唯德，能服於人。',
    en: 'Do not neglect a small good; do not commit a small evil. Only virtue can move men.',
  },
  'cao-zhi': {
    zh: '煮豆燃豆萁，豆在釜中泣。本是同根生，相煎何太急。',
    en: 'Beans burn beside their own stalks; in the pot they weep. We sprang from the same root — why such haste to consume one another?',
  },
  'sun-ce': {
    zh: '內事不決問張昭，外事不決問周瑜。',
    en: 'For matters within, ask Zhang Zhao; for matters without, ask Zhou Yu.',
  },
  'zhou-yu': {
    zh: '既生瑜，何生亮！',
    en: 'Since Heaven made Yu, why also Liang?!',
  },
  'lu-bu': {
    zh: '今日縛我者，何不殺我？',
    en: 'You who have bound me today — why not strike?',
  },
  'dian-wei': {
    zh: '吾為主公而死，無憾也！',
    en: 'I die for my lord. I have no regret!',
  },
  'pang-tong': {
    zh: '今日陷此，乃天命也。',
    en: 'That I fall here today — this is Heaven\'s will.',
  },
  'sima-yi': {
    zh: '吾事有成，可瞑目矣。',
    en: 'My work is done. I may now close my eyes.',
  },
  'yuan-shao': {
    zh: '我家四世三公，今竟敗於此小子之手！',
    en: 'My house held the Three Excellencies for four generations — and I am undone by that upstart!',
  },
  'lu-meng': {
    zh: '吾乃天下名士，誤中孺子之計！',
    en: 'I, a renowned scholar of the realm, was undone by that boy\'s ruse!',
  },
  'huang-zhong': {
    zh: '老臣雖死，不負先帝!',
    en: 'Though this old vassal dies, I have not failed the late Emperor.',
  },
  'zhang-fei': {
    zh: '殺我者必范疆，張達也!',
    en: 'My killers — they will be Fan Jiang and Zhang Da!',
  },
  'guan-ping': {
    zh: '父帥已歿，吾豈獨生?',
    en: 'My father has fallen — how could I live alone?',
  },
  'liu-shan': {
    zh: '此間樂，不思蜀。',
    en: 'This place is pleasant. I do not miss Shu.',
  },
  'zhuge-zhan': {
    zh: '吾父子受國厚恩，何顏見人?',
    en: 'My father and I owed deep grace to the state — with what face could I meet our people?',
  },
  'zhuge-shang': {
    zh: '父死國亡，何用生為!',
    en: 'My father is dead, the state is fallen — what use is life?',
  },
  'liu-chen': {
    zh: '寧為玉碎，不為瓦全!',
    en: 'Better a shattered jewel than an intact tile!',
  },
  'jiang-wei': {
    zh: '我計不成，乃天命也!',
    en: 'My stratagem has failed — this is Heaven\'s decree!',
  },
  'deng-ai': {
    zh: '吾忠心可昭日月，何忍見害!',
    en: 'My loyalty shines like sun and moon — how can I bear to be killed?',
  },
  'xun-yu': {
    zh: '食漢祿而守漢節，空函見賜，復何言哉——死自吾分，恨漢室之難扶也。',
    en: 'I ate the Han\'s salt and kept the Han\'s honor. An empty box is sent to me — what more is there to say? Death is my portion; that the Han cannot be saved, that alone I grieve.',
  },
  'zhao-yun': {
    zh: '吾一身都是膽也——隨先主三十年，大小數十戰，未嘗折其銳氣。',
    en: 'I am courage, body and bone — thirty years at my lord\'s side, dozens of battles, and never once did my edge dull.',
  },
  'taishi-ci': {
    zh: '大丈夫生於亂世，當帶三尺之劍，以升天子之階。今所志未從，奈何死乎！',
    en: 'A true man born to a broken age should gird a three-foot blade and climb to the Son of Heaven\'s hall. My purpose unfulfilled — how can I die like this?!',
  },
  'zhang-liao': {
    zh: '生為漢將，威震逍遙——八百破十萬，江東小兒聞名，夜不敢啼。',
    en: 'A general of Han in life, I shook Xiaoyao Ford — eight hundred broke a hundred thousand; at my name the children of Wu dared not cry in the night.',
  },
  'ma-chao': {
    zh: '臣門宗二百餘口，為孟德所誅殆盡，惟餘從弟岱——乞陛下垂託，以繼血食。',
    en: 'Over two hundred of my clan were butchered by Mengde; only my cousin Dai remains. I beg Your Majesty take him in, that my line\'s offerings not end.',
  },
  'sun-jian': {
    zh: '江東基業，始於此身——惜乎峴山一矢，玉璽未酬，壯圖成夢。',
    en: 'The foundation of the Southland began with me — but for one arrow at Mount Xian, the seal unclaimed, my grand design left a dream.',
  },
  'sun-quan': {
    zh: '坐斷東南，鼎足三分，亦人傑也——惜乎暮年多疑，託孤非人，遺恨江表。',
    en: 'I held the Southeast and made the realm stand on three legs — a hero too. Yet in my dotage I grew suspicious, entrusted my heir to the wrong men, and left grief upon the Yangtze.',
  },
  'lu-xun': {
    zh: '火燒連營七百里，西破蜀師，此身許國——竟以忠讜見疑於君，憤懣而終。',
    en: 'Seven hundred li of linked camps I burned, breaking the host of Shu; this body I pledged to the state — yet my honest counsel drew my lord\'s suspicion, and in that bitterness I end.',
  },
  'cao-pi': {
    zh: '蓋文章，經國之大業，不朽之盛事——年壽有時而盡，榮樂止乎其身，未若文章之無窮。',
    en: 'Literature is the great enterprise of statecraft, a splendor that does not decay. Years and honors end with the body — none of it endures like the written word.',
  },
  'dong-zhuo': {
    zh: '吾兒奉先何在？！',
    en: 'Where is my son Fengxian?!',
  },
  'yuan-shu': {
    zh: '袁術至於此乎！',
    en: 'Has it come to this — for Yuan Shu?! (Blood on his lips, he died.)',
  },
  'guo-jia': {
    zh: '嘉自弱冠即從公——今遺一計，遼東可不戰而定，惜不能再睹明公成業也。',
    en: 'Since my cap-and-gown years I followed you, my lord. I leave one last stratagem — Liaodong may be taken without a battle. I grieve only that I shall not see your work fulfilled.',
  },
  'xu-chu': {
    zh: '吾為主公遮箭奪船，護駕終身——虎癡之名，死亦無愧。',
    en: 'I caught the arrows for my lord and seized the boat at the Wei, and guarded him all my life. "The Tiger Fool" — even in death I bear the name without shame.',
  },
  'xiahou-dun': {
    zh: '身經百戰，拔矢啖睛，不損父母之遺——為魏元勳，死亦瞑目。',
    en: 'A hundred battles fought; I plucked the arrow and swallowed my own eye rather than waste what my parents gave. A founding pillar of Wei — I close my eyes content.',
  },
  'pang-de': {
    zh: '我寧為國家鬼，不為賊將也——抬櫬決死，豈降劉備乎！',
    en: 'I would sooner be a ghost of the state than a rebel\'s general. I bore my own coffin to this fight — how could I bow to Liu Bei?!',
  },
  'wang-yun': {
    zh: '吾為社稷除元惡，今賊反噬——死何足惜，恨漢室之難扶也！',
    en: 'For the altars of state I cut down the arch-villain; now the traitors turn upon me. Death I do not begrudge — I grieve only that the Han is so hard to save.',
  },
  'lu-su': {
    zh: '榻上一策，已定天下三分——惜乎未見九州同軌，先歸黃壤。',
    en: 'One plan upon the couch already foretold the realm split three ways — I grieve only that I go to the yellow earth before I see the Nine Provinces made one.',
  },
};

export function getDeathPoem(officerId: string): DeathPoem | null {
  return DEATH_POEMS[officerId] ?? null;
}
