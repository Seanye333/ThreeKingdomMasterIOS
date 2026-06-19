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
};

export function getDeathPoem(officerId: string): DeathPoem | null {
  return DEATH_POEMS[officerId] ?? null;
}
