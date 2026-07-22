/**
 * Officer biographies — short bilingual descriptions sourced from the
 * Records of the Three Kingdoms (三国志) and Romance of the Three Kingdoms
 * (三国演义). Major officers get 3–5 sentences; minor officers, 1–2.
 *
 * Each entry has a Chinese narrative and an English translation. Officers
 * not in this map fall back to a procedural description derived from stats.
 */
import { HISTORICAL_BIOGRAPHIES } from './historicalBiographies';

export interface OfficerBiography {
  zh: string;
  en: string;
  /** Optional era/period label (e.g., honorific or dynasty role). */
  era?: { zh: string; en: string };
  /** Famous quote attributed to the officer. */
  quote?: { zh: string; en: string };
  /** Real-history lifespan (BC/AD) for the 歷代名將 cross-over feature.
   *  Shown in UI separate from the playable birthYear (~150 AD). */
  lifespan?: { zh: string; en: string };
}

export const BIOGRAPHIES: Record<string, OfficerBiography> = {
  'cao-cao': {
    era: { zh: '魏武帝', en: 'Emperor Wu of Wei' },
    zh: '字孟德,沛国谯县人。汉相曹参之后。少时机警,有权数,任侠放荡;许劭评之曰:"治世之能臣,乱世之奸雄。" 起兵讨董卓,挟天子以令诸侯,北破袁绍,平定北方,奠定魏国基业。诗文俊爽,以《观沧海》《短歌行》传世。',
    en: 'Style name Mengde. A descendant of the Han chancellor Cao Shen. Cunning and unconventional in youth, Xu Shao judged him "a capable minister in peace, a treacherous hero in chaos." He raised troops against Dong Zhuo, took custody of the Han emperor to command the warlords, broke Yuan Shao in the north, and laid the foundation of Wei. His ci poems are first-rate; "Gazing at the Sea" and "Short Song" survive to this day.',
    quote: { zh: '宁我负人,毋人负我。', en: 'Better that I betray the world than the world betray me.' },
  },
  'liu-bei': {
    era: { zh: '蜀汉昭烈帝', en: 'Emperor Zhaolie of Shu Han' },
    zh: '字玄德,涿郡涿县人。汉景帝玄孙,中山靖王刘胜之后。少有大志,与关羽，张飞桃园结义。一生颠沛,屡败屡战,终入蜀建立汉中之业,称帝白帝。仁德爱民,以德服人,与曹操形成天下两极。',
    en: 'Style name Xuande. A descendant of Emperor Jing of Han through Prince Jing of Zhongshan, Liu Sheng. Ambitious from youth, he swore the Peach Garden Oath with Guan Yu and Zhang Fei. Through a lifetime of defeat and flight, he eventually entered Shu, took Hanzhong, and proclaimed himself emperor at Baidicheng. His benevolence drew men to him; with Cao Cao he formed the two poles of the realm.',
    quote: { zh: '勿以善小而不为,勿以恶小而为之。', en: 'Do no good so small it can be neglected; do no evil so small it can be excused.' },
  },
  'sun-quan': {
    era: { zh: '吴大帝', en: 'Emperor Da of Wu' },
    zh: '字仲谋,吴郡富春人。孙坚之子,孙策之弟。十九岁继兄业,内修政理,外结英才,赤壁联刘抗曹,夷陵破刘备,立国江东五十余年。 曹操叹曰:"生子当如孙仲谋。"',
    en: 'Style name Zhongmou. Son of Sun Jian and younger brother of Sun Ce. At nineteen he inherited the south. He cultivated good government, gathered talent, allied with Liu Bei at Red Cliffs, broke Liu Bei at Yiling, and ruled Jiangdong for over fifty years. Cao Cao sighed: "If one must have a son, let him be a Sun Zhongmou."',
  },
  'guan-yu': {
    era: { zh: '武圣', en: 'Saint of War' },
    zh: '字云长,河东解良人。身长九尺,髯长二尺,面如重枣。义薄云天,与刘备，张飞结为兄弟。 千里走单骑,过五关斩六将。水淹七军,威震华夏,败走麦城而死。后世尊为武圣,庙祀遍天下。',
    en: 'Style name Yunchang. Nine chi tall with a two-chi beard and a date-red face. His loyalty stretched higher than the clouds; he was sworn brother to Liu Bei and Zhang Fei. He rode a thousand li alone, slew six commanders at five passes, drowned seven armies at Fancheng, and shook all China — then fell at Maicheng. Later ages worshipped him as the Saint of War; temples to him stand across the realm.',
    quote: { zh: '玉可碎而不可改其白,竹可焚而不可毁其节。', en: 'Jade may shatter but its whiteness will not change; bamboo may burn but its uprightness will not be destroyed.' },
  },
  'zhang-fei': {
    era: { zh: '万人敌', en: 'Match for ten thousand men' },
    zh: '字翼德,涿郡人。豹头环眼,燕颔虎须。声若巨雷,势如奔马。当阳长坂桥头独退曹军百万,曹军莫敢近。粗中有细,义气深重,后为部下所害。',
    en: "Style name Yide. Leopard's head, ring eyes, swallow's jaw, tiger's whiskers. His voice was a thunder-clap, his charge a galloping horse. At the bridge of Changban he held back a million of Cao's troops alone, and none dared approach. Rough but not stupid, fiercely loyal — and in the end murdered by his own lieutenants.",
  },
  'zhao-yun': {
    era: { zh: '常胜将军', en: 'The Ever-Victorious' },
    zh: '字子龙,常山真定人。身长八尺,姿颜雄伟。 长坂坡中七进七出,怀抱阿斗杀出重围。一生未尝败绩,刘备叹曰:"子龙一身都是胆。" 蜀汉五虎之一。',
    en: 'Style name Zilong, of Zhending in Changshan. Eight chi tall, with majestic bearing. At Changban he charged in and out seven times, the infant heir clutched at his breast. He never lost a battle. Liu Bei said of him: "Zilong is courage from head to heel." One of the Five Tiger Generals of Shu.',
    quote: { zh: '臣子今日所为,皆是分内事!', en: "What I have done today is no more than a subject's duty!" },
  },
  'zhuge-liang': {
    era: { zh: '卧龙', en: 'The Sleeping Dragon' },
    zh: '字孔明,琅琊阳都人。身长八尺,容貌甚伟,躬耕于南阳,自比管乐。三顾而出,献《隆中对》,定天下三分之策。火烧博望,赤壁借东风,空城退仲达。鞠躬尽瘁,死而后已,星陨五丈原。',
    en: 'Style name Kongming, of Yangdu in Langya. Eight chi tall, majestic of countenance, he tilled his fields at Nanyang and compared himself to Guan Zhong and Yue Yi. Drawn out after three visits, he proposed the Longzhong Plan and divided the realm in three. He burned the camp at Bowang, called up the east wind at Red Cliffs, drove Sima Yi back with the empty fort. Bowing low, exhausting himself to death — until a star fell at Wuzhang Plains.',
    quote: { zh: '鞠躬尽瘁,死而后已。', en: 'I shall bend my back and exhaust my strength until the day of my death.' },
  },
  'lu-bu': {
    era: { zh: '飞将', en: 'The Flying General' },
    zh: '字奉先,五原九原人。弓马娴熟,有"人中吕布,马中赤兔"之誉。事丁原，董卓，王允,三易其主,世人称"三姓家奴"。辕门射戟,虎牢关战三英。最后败于下邳,白门楼为曹操所缢。',
    en: 'Style name Fengxian, of Jiuyuan in Wuyuan. Master of bow and horse, the saying went: "Among men, Lü Bu; among horses, Red Hare." He served Ding Yuan, Dong Zhuo, and Wang Yun in turn — the world called him "the slave of three surnames." He shot the halberd at Yuanmen and held off the three sworn brothers at Hulao Pass. In the end he was strangled by Cao Cao\'s order at White Gate Tower.',
    quote: { zh: '大丈夫生于天地间,岂能郁郁久居人下!', en: 'A real man between heaven and earth — how can he linger long under another?' },
  },
  'sun-jian': {
    era: { zh: '江东之虎', en: 'Tiger of Jiangdong' },
    zh: '字文台,吴郡富春人。少年时孤身追海盗,声名远播。讨黃巾，伐董卓,首入洛阳,得传国玉玺。征荆州刘表,中流矢而死,年三十七。',
    en: 'Style name Wentai, of Fuchun in Wu. As a boy he chased down pirates alone and made his name. He crushed the Yellow Turbans, led the assault on Dong Zhuo, was first into Luoyang and there found the imperial seal. Campaigning against Liu Biao in Jingzhou, he was struck by an arrow and died at thirty-seven.',
  },
  'sun-ce': {
    era: { zh: '小霸王', en: 'The Little Conqueror' },
    zh: '字伯符,孙坚长子。英气过人,与周瑜结布衣交。借兵袁术,渡江而东,数年之间尽收江东六郡。 二十六岁中刺客之箭,临终托弟孙权。 曹操叹:"狮儿难与争锋!"',
    en: 'Style name Bofu, eldest son of Sun Jian. Fierce of spirit, sworn friend to Zhou Yu. He borrowed troops from Yuan Shu, crossed the Yangtze, and in a few years conquered all six commanderies of Jiangdong. At twenty-six an assassin\'s arrow brought him down; on his deathbed he passed the south to his brother Sun Quan. Cao Cao sighed: "One cannot contend with that lion-cub."',
  },
  'zhou-yu': {
    era: { zh: '美周郎', en: 'The Handsome Zhou Lang' },
    zh: '字公瑾,庐江舒县人。容貌昳丽,精通音律,时人语曰:"曲有误,周郎顾。" 与孙策为总角之交,助平江东。 赤壁火攻大破曹操,奠定三分。 年三十六卒于巴丘,临终叹:"既生瑜,何生亮!"',
    en: 'Style name Gongjin, of Shu in Lujiang. Strikingly handsome and a master of music — they said, "If a note goes wrong, Zhou Lang will look up." Sworn friend to Sun Ce from boyhood, he helped pacify the south. At Red Cliffs his fire attack broke Cao Cao and divided the realm. He died at thirty-six at Baqiu, crying: "Since heaven gave the world Yu, why also Liang?"',
  },
  'sima-yi': {
    era: { zh: '冢虎', en: 'The Tomb-Tiger' },
    zh: '字仲达,河内温县人。隐忍多智,曹操疑其有狼顾之相而忌之。 历事曹操，丕，叡，芳四主。 拒诸葛于五丈原,平辽东公孙渊。 晚年发动高平陵之变,夺曹爽之权,为西晋开基。',
    en: 'Style name Zhongda, of Wen in Henei. Patient and deep-counseled; Cao Cao saw the wolf-glance in him and was wary. He served four lords of Wei in turn. He held Zhuge Liang at Wuzhang Plains and crushed Gongsun Yuan in Liaodong. Late in life he sprang the Gaopingling coup, seized power from Cao Shuang, and laid the foundation of Jin.',
  },
  'zhang-liao': {
    zh: '字文远,雁门马邑人。原从吕布,败后归曹操。 合肥之战率八百死士冲孙权十万军,几擒孙权,江东闻其名小儿不敢夜啼。',
    en: 'Style name Wenyuan, of Mayi in Yanmen. He served Lü Bu first, then went over to Cao Cao after defeat. At Hefei he led eight hundred picked men into Sun Quan\'s host of a hundred thousand and nearly took Sun Quan himself; afterward in Jiangdong children would not cry at night for fear of his name.',
  },
  'huang-zhong': {
    zh: '字汉升,南阳人。 老当益壮,弓马绝伦。 定军山一战斩夏侯渊,蜀汉五虎之一。',
    en: 'Style name Hansheng, of Nanyang. He was old, but the older he grew the stronger he became; none could match him with bow or horse. At Mount Dingjun he cut down Xiahou Yuan. One of the Five Tiger Generals of Shu.',
  },
  'ma-chao': {
    era: { zh: '锦马超', en: 'Brocade Ma Chao' },
    zh: '字孟起,扶风茂陵人。马腾之子,有西凉羌族血脉。骁勇异常,曹操叹"马儿不死,吾无葬地"。后归刘备,蜀汉五虎之一。',
    en: 'Style name Mengqi, of Maoling in Fufeng. Son of Ma Teng, with Qiang blood from the western marches. Cao Cao said, "Until that boy of the Ma family dies, I shall have no place to be buried." He went over to Liu Bei and became one of the Five Tiger Generals of Shu.',
  },
  'jiang-wei': {
    zh: '字伯约,天水冀县人。诸葛亮死后接掌北伐之业,九伐中原而无功。 蜀汉灭后伪降钟会图复国,事败被杀。',
    en: 'Style name Boyue, of Tianshui. After Zhuge Liang\'s death he carried on the northern campaigns — nine of them, all without lasting gain. When Shu fell he pretended to surrender to Zhong Hui in a last bid to restore his kingdom; the plot failed and he was killed.',
  },
  'pang-tong': {
    era: { zh: '凤雏', en: 'The Young Phoenix' },
    zh: '字士元,襄阳人。 与诸葛齐名,水镜先生云:"卧龙凤雏,得一可安天下。" 献连环计于曹营,后归刘备,落凤坡中箭而亡。',
    en: 'Style name Shiyuan, of Xiangyang. Reckoned the equal of Zhuge Liang — Sima Hui said, "Of the Sleeping Dragon and the Young Phoenix, one is enough to settle the realm." He devised the Chain Stratagem for Cao Cao\'s navy; later he served Liu Bei and fell at Phoenix Slope, struck through by an arrow.',
  },
  'dian-wei': {
    zh: '字号"古之恶来",曹操亲卫。 双戟八十斤,有万夫不当之勇。 宛城之变中为护曹操脱身,死战不退,身被数十创而绝。',
    en: 'Nicknamed "the new E Lai" after a legendary brawler of antiquity, he was Cao Cao\'s personal guard. He wielded twin halberds weighing eighty jin and had the courage to face ten thousand. In the mutiny at Wancheng he held the gate so Cao Cao could escape, dying upright under dozens of wounds.',
  },
  'xu-chu': {
    era: { zh: '虎痴', en: 'Tiger Idiot' },
    zh: '字仲康,谯县人。 力大无穷,曾倒拖牛尾百步。 曹操亲卫长。 与马超大战二百合不分胜负,赤膊力斗,以勇名重于世。',
    en: 'Style name Zhongkang, of Qiao. So strong he once dragged a bull a hundred paces by its tail. Captain of Cao Cao\'s personal guard. He fought Ma Chao to a draw for two hundred bouts, stripped to the waist, and was famed throughout the world for sheer brawn.',
  },
  'gan-ning': {
    era: { zh: '锦帆贼', en: 'The Brocade Pirate' },
    zh: '字兴霸,巴郡临江人。 少年游侠,以锦帆系船。 后归孙权。 百骑劫魏营,孙权叹:"孟德有张辽,孤有兴霸,足相敌也!"',
    en: 'Style name Xingba, of Linjiang in Ba. In his youth a river-knight whose boat trailed a banner of brocade. He went over to Sun Quan; with a hundred riders he raided the Wei camp at night. Sun Quan said: "Mengde has Zhang Liao, I have Xingba — we are matched."',
  },
  'taishi-ci': {
    zh: '字子义,东莱黄人。 神射手,与孙策一场酣战至于胫骨皆露。 后归孙策,镇守东莱,病卒。 临终叹:"大丈夫生于乱世,当带三尺剑,立不世之功!"',
    en: 'Style name Ziyi, of Huang in Donglai. A peerless archer who once fought Sun Ce until their leg bones showed through the wounds. He went over to Sun Ce, garrisoned Donglai, and died of illness. His last words: "A man born in a chaotic age should bear a three-foot sword and raise an immortal deed!"',
  },
  'lu-meng': {
    era: { zh: '士别三日,即更刮目相待', en: 'Three days apart, look at him with new eyes' },
    zh: '字子明,汝南富陂人。 少时不学,孙权劝学,刻苦自励,日积月累遂成大器。 白衣渡江,袭取荆州,擒杀关羽。',
    en: 'Style name Ziming, of Fupi in Runan. As a young man he never studied; Sun Quan urged him to read, and he applied himself until he became a great commander. In a white-robed crossing he took Jingzhou by surprise and captured Guan Yu.',
  },
  'lu-xun': {
    zh: '字伯言,吴郡吴县人。 出身江东大族。 夷陵之战,以白面书生之姿火烧连营七百里,大破刘备。 后任丞相,辅佐孙权。',
    en: 'Style name Boyan, of Wu county in Wujun. A young scholar of a great Jiangdong house. At Yiling he burned through seven hundred li of Liu Bei\'s linked camps and crushed the host of Shu. He rose to chancellor and steered the realm under Sun Quan.',
  },
  'diaochan': {
    era: { zh: '貂蝉', en: 'Diaochan' },
    zh: '王允义女,容貌倾国。 司徒以连环之计,使吕布，董卓父子反目。 凤仪亭一变,董卓死,汉室得苏。 四大美人之一。',
    en: 'Adopted daughter of Wang Yun, of nation-toppling beauty. The Minister wove the Chain Stratagem with her, turning the foster-son Lü Bu against the tyrant Dong Zhuo. In the moment at Phoenix Pavilion the tyrant fell and the Han line breathed again. One of the four classical beauties of China.',
  },
  'huang-yueying': {
    zh: '诸葛亮之妻,黄承彦之女。 容貌虽不出众,而才识过人。 善制木牛流马，连弩等机械,助孔明经天纬地。',
    en: "Wife of Zhuge Liang, daughter of Huang Chengyan. Not beautiful in face, but matchless in talent and learning. She devised the Wooden Ox and Flowing Horse carts, the repeating crossbow, and other machines, helping Kongming weave together heaven and earth.",
  },
  'dong-zhuo': {
    zh: '字仲颖,陇西临洮人。 凉州军阀,何进招其入京。 废少帝,立献帝,焚洛阳迁长安。 残暴无道,司徒王允以连环计使吕布手刃之。',
    en: 'Style name Zhongying, of Lintao in Longxi. A warlord of Liang province summoned to the capital by He Jin. He deposed the young emperor, raised Emperor Xian, and burned Luoyang to flee to Chang\'an. So tyrannical that Wang Yun wove the Chain Stratagem to have Lü Bu strike him down.',
  },
  'yuan-shao': {
    zh: '字本初,汝南汝阳人。 四世三公之家。 起兵讨董卓,众推为盟主。 后据河北,势力最盛。 官渡之战为曹操所破,郁郁而终。',
    en: 'Style name Benchu, of Ruyang in Runan. Of a family that held the Three Excellencies for four generations. He led the coalition against Dong Zhuo and was acclaimed its leader. Master of the north and most powerful warlord of his day, he was broken by Cao Cao at Guandu and died in despair.',
  },
  'yuan-shu': {
    zh: '字公路,袁绍异母弟。 据淮南。 得传国玉玺即僭号称帝,众叛亲离,呕血而死。',
    en: 'Style name Gonglu, half-brother of Yuan Shao. Master of Huainan. When the imperial seal came to him he proclaimed himself emperor; the world turned away, and he died vomiting blood.',
  },
  'xiahou-dun': {
    zh: '字元让,曹操族兄弟。 与吕布军战时被流矢射中左眼,自拔之吞食,曰:"父精母血,不可弃也!" 后世称"独眼夏侯"。',
    en: 'Style name Yuanrang, cousin of Cao Cao. Struck in the left eye by a stray arrow in the fight with Lü Bu, he pulled the shaft out — eye and all — and swallowed it, crying: "Father\'s seed, mother\'s blood — I cannot throw these away!" Forever after, the One-Eyed Xiahou.',
  },
  'guo-jia': {
    era: { zh: '鬼才', en: 'The Ghost-Talent' },
    zh: '字奉孝,颍川阳翟人。 曹操第一谋主,十胜十败论奠定北征方略。 三十八岁早逝,曹操痛哭:"若奉孝在,孤不至于此!"',
    en: 'Style name Fengxiao, of Yangzhai in Yingchuan. Cao Cao\'s chief counselor. His "Ten Victories, Ten Defeats" memorial set the strategy for the conquest of the north. He died at thirty-eight; Cao Cao wept: "If Fengxiao were alive, I would not have come to this!"',
  },
  'xun-yu': {
    zh: '字文若,颍川颍阴人。 王佐之才,曹操称之"吾之子房"。 助曹定都许昌，迎天子,运筹帷幄二十年。 后因反对曹操称魏公,郁郁而终。',
    en: 'Style name Wenruo, of Yingyin in Yingchuan. "A talent fit to assist a king" — Cao Cao called him "my Zifang." He helped Cao set the capital at Xuchang, escort the emperor, and steered grand strategy for twenty years. Opposing the elevation of Cao to Duke of Wei, he sank into despair and died.',
  },
  'jia-xu': {
    era: { zh: '毒士', en: 'The Poisonous Counselor' },
    zh: '字文和,武威姑臧人。 算无遗策,屡换其主而善终。 助贾诩献离间之计破马超，计败张绣，保曹丕嗣位。',
    en: 'Style name Wenhe, of Guzang in Wuwei. His strategies never miscarried, and he served many lords yet died in his bed. He sowed division between Ma Chao and Han Sui, broke Zhang Xiu through a trick, and secured Cao Pi as heir of Wei.',
  },
  'hua-tuo': {
    zh: '沛国谯县人,世称神医。 创麻沸散,行外科手术。 曹操患头风请之治,华佗欲开颅,曹操疑其谋害而杀之。 临终焚医书,世人惜哉。',
    en: 'Of Qiao in Pei, called the Divine Physician. He devised the Mafei powder, the world\'s first anaesthetic, and performed surgery. Summoned to treat Cao Cao\'s headaches, he proposed opening the skull; Cao Cao suspected murder and had him killed. At his death he burned his medical books — the world has mourned him ever since.',
  },
  'lu-su': {
    zh: '字子敬,临淮东城人。 江东重臣,主张联刘抗曹,促成赤壁之盟。 一生倡导孙刘联合,深谋远略。',
    en: 'Style name Zijing, of Dongcheng in Linhuai. A pillar of the Wu court. He pressed for the alliance with Liu Bei against Cao Cao that won the Red Cliffs. All his life he argued for unity between Sun and Liu — a deep and far-seeing strategist.',
  },
  'cao-pi': {
    era: { zh: '魏文帝', en: 'Emperor Wen of Wei' },
    zh: '字子桓,曹操次子。 废献帝而代之,建立曹魏。 工于诗赋,与建安七子齐名。 七步逼弟曹植,留下"煮豆燃豆萁"之千古名篇。',
    en: 'Style name Zihuan, second son of Cao Cao. He deposed Emperor Xian of Han and founded Wei. Skilled in poetry, he stood among the Seven Masters of Jian\'an. He gave his brother Cao Zhi seven paces to compose a poem on pain of death — and so was born the immortal verse of beans burning by their own stalks.',
  },
  'cao-zhi': {
    zh: '字子建,曹操三子。 才高八斗,与曹操，曹丕并称三曹。 七步成诗:"煮豆燃豆萁,豆在釜中泣;本是同根生,相煎何太急!"',
    en: 'Style name Zijian, third son of Cao Cao. Of him it was said: "If the world\'s talent be ten dou, Zijian holds eight." With his father and brother he made up the Three Caos of letters. His seven-step poem: "Beans burn over a fire of bean-stalks / the beans in the pot are weeping / both grew from one root — / why must we devour each other so fast?"',
  },
  'wang-yun': {
    zh: '字子师,太原祁县人。 汉室忠臣,假女貂蝉施连环计,使吕布刺杀董卓。 后被李傕，郭汜攻陷长安,自焚而死。',
    en: 'Style name Zishi, of Qi in Taiyuan. A loyal minister of Han. Through his ward Diaochan he wove the Chain Stratagem and had Lü Bu strike down Dong Zhuo. When Li Jue and Guo Si seized Chang\'an, he threw himself into the flames.',
  },
  'zhang-jiao': {
    era: { zh: '大贤良师', en: 'The Great Worthy Teacher' },
    zh: '钜鹿人。 创太平道,以符水治病传教,聚徒数十万。 中平元年,以"苍天已死,黄天当立"为号起义,黃巾之乱遂起。 数月后病死。',
    en: 'Of Julu. Founder of the Way of Great Peace, healing with talisman-water and gathering hundreds of thousands of converts. In the first year of Zhongping he raised his rebellion under the slogan "The Blue Heaven is dead, the Yellow Heaven shall stand" — and the Yellow Turbans rose. Within months he died of illness.',
  },
  'meng-huo': {
    zh: '南蛮王。 诸葛亮南征,七擒七纵,使其心服。 自此南方归附,蜀汉再无后顾之忧。',
    en: 'King of the Nanman. In Zhuge Liang\'s southern campaign he was captured seven times and released seven times, until at the seventh his heart bent. From then the south was loyal, and Shu had no need to look behind.',
  },
  'deng-ai': {
    era: { zh: '滅蜀名將', en: 'Conqueror of Shu' },
    zh: '字士載,義陽棘陽人。 少時口吃,以屯田起家,而胸藏萬甲。 平定淮南文欽之亂,挫姜維於洮西。 偷渡陰平七百里,翻越摩天嶺,奇兵入蜀,迫劉禪降。 一生未敗。 終為鍾會構陷,父子俱死於亂中。',
    en: 'Style name Shizai, of Jiyang in Yiyang. He stuttered as a boy and rose from farming the military colonies, but his chest held ten thousand schemes. He put down Wen Qin\'s revolt at Huainan, broke Jiang Wei at Taoxi, and made his immortal march — seven hundred li by goat-track through Yinping, crossing Motian Ridge into the heart of Shu — and forced the second emperor to bow. He never lost a battle. In the end Zhong Hui framed him, and father and son both died in the chaos.',
    quote: { zh: '士為知己者死。', en: 'A man will die for one who knows him.' },
  },
  'zhong-hui': {
    zh: '字士季,潁川長社人。 鍾繇之少子,才氣縱橫。 與鄧艾共滅蜀,而後欲據蜀自立,聯姜維起兵。 事敗,死於亂兵之中,年四十。',
    en: 'Style name Shiji, of Changshe in Yingchuan. Youngest son of Zhong Yao, a man of dazzling talent. With Deng Ai he conquered Shu, then schemed to hold it for himself and rose with Jiang Wei. The plot failed; he died in the mutiny at forty.',
  },
  'sima-shi': {
    era: { zh: '景皇帝', en: 'Emperor Jing of Jin' },
    zh: '字子元,司馬懿長子。 高平陵之變後執政,平王凌之亂，擒毋丘儉,以陰柔之術駕馭士林。 後司馬昭得以順承其志,終成晉室。',
    en: 'Style name Ziyuan, eldest son of Sima Yi. After the Gaopingling coup he took the regency. He crushed the revolt of Wang Ling, captured Guanqiu Jian, and bent the gentry to his will by quiet hands. His brother Sima Zhao would carry his designs forward — and his nephew would found Jin.',
  },
  'sima-zhao': {
    era: { zh: '文皇帝', en: 'Emperor Wen of Jin' },
    zh: '字子上,司馬懿次子。 兄死後執政。 鎮諸葛誕之叛，攬鄧艾鍾會以滅蜀。 弒高貴鄉公曹髦,獨攬大權。 「司馬昭之心,路人皆知。」',
    en: 'Style name Zishang, second son of Sima Yi. He took power after his brother died. He crushed Zhuge Dan\'s revolt, gathered Deng Ai and Zhong Hui to swallow Shu, and finally killed the Duke of Gaogui — Emperor Mao — to clear the throne for his son. "The heart of Sima Zhao is known even to passersby."',
  },
  'guo-huai': {
    zh: '字伯濟,太原陽曲人。 鎮守關西二十年,屢挫蜀漢北伐。 大破馬岱，姜維,鎮羌氐諸部安如磐石。',
    en: 'Style name Boji, of Yangqu in Taiyuan. Twenty years he held the western marches, blunting every Shu northern campaign. He broke Ma Dai and Jiang Wei, and held the Qiang and Di tribes to peace like an unmoved rock.',
  },
  'hao-zhao': {
    zh: '字伯道,太原人。 守陳倉,以千餘兵拒諸葛亮數萬之師二十餘日。 諸葛糧盡而退,自此名動天下。',
    en: 'Style name Bodao, of Taiyuan. Holding Chencang with barely a thousand men, he stood off Zhuge Liang\'s tens of thousands for over twenty days. When Zhuge\'s grain ran out and the army withdrew, Hao Zhao\'s name was known throughout the realm.',
  },
  'liao-hua': {
    era: { zh: '蜀漢之忠', en: "Shu's Faithful Veteran" },
    zh: '字元儉,襄陽人。 始隨關羽守荊州,後事先主，後主。 「蜀中無大將,廖化作先鋒。」 一生轉戰三世,八十而戰不衰。',
    en: 'Style name Yuanjian, of Xiangyang. He first followed Guan Yu at Jingzhou, then served both First and Second Emperors of Shu. They said: "When Shu has no great general, Liao Hua takes the van." Through three reigns he marched, still in the field at eighty.',
  },
  'guan-xing': {
    zh: '關羽次子。 隨諸葛亮南征北伐,屢立戰功。 早卒,蜀漢痛失一柱。',
    en: 'Second son of Guan Yu. He followed Zhuge Liang through the southern and northern campaigns, with many honors. He died young — Shu lost a pillar before it was full-grown.',
  },
  'zhang-bao': {
    zh: '張飛長子。 武勇似父,從諸葛亮北伐。 興勢山道墜馬,傷重而卒,孔明聞之失聲。',
    en: 'Eldest son of Zhang Fei. As fierce as his father, he marched with Zhuge Liang on the northern campaigns. At Xingshi mountain he fell from his horse and died of the wounds; when the word reached Zhuge Liang, the Prime Minister cried out.',
  },
  'ma-dai': {
    zh: '馬騰族姪,馬超之弟。 隨馬超歸蜀。 諸葛亮死後,奉遺命斬叛將魏延於漢中。',
    en: 'Nephew of Ma Teng, younger kinsman of Ma Chao. He went with Ma Chao into Shu. After Zhuge Liang\'s death, by his dying order, he cut down the rebel Wei Yan at Hanzhong.',
  },
  'yan-yan': {
    zh: '巴郡太守。 張飛入蜀,生擒之。 嚴顏抗曰:「我州但有斷頭將軍,無有降將軍!」 張飛敬之,釋而禮之。',
    en: 'Governor of Bajun. When Zhang Fei broke into Shu, he was captured alive. Defiant: "In this province there are only generals who lose their heads — never generals who surrender!" Zhang Fei honored him, freed him, and received him as a peer.',
  },
  'zhuge-jin': {
    zh: '字子瑜,諸葛亮長兄。 事孫權四十年,以誠信稱。 兩弟分仕魏蜀吳三家,不通私訊,公私分明。',
    en: 'Style name Ziyu, elder brother of Zhuge Liang. For forty years he served Sun Quan and was known for sincerity. His two brothers served Wei, Shu, and Wu in turn — yet he passed no private word between them. Public and private were strictly separated.',
  },
  'zhuge-ke': {
    zh: '字元遜,諸葛瑾長子。 才思過人而剛愎自用。 平山越，伐魏,初勝後敗,終為孫峻所殺,夷三族。',
    en: 'Style name Yuanxun, eldest son of Zhuge Jin. His wit was beyond men\'s, but he was stubborn and self-willed. He pacified the Shan Yue, then marched on Wei — won at first, lost at last. Sun Jun killed him and wiped out three branches of his clan.',
  },
  'zhong-yao': {
    era: { zh: '書聖', en: 'Sage of Calligraphy' },
    zh: '字元常,潁川長社人。 漢魏間名臣,亦書法宗師,小楷之祖。 鎮關中安羌渾,曹操譽其有蕭何之功。',
    en: 'Style name Yuanchang, of Changshe in Yingchuan. A great minister bridging Han and Wei, and the founding master of regular-script calligraphy. He held the Guanzhong region steady and quieted the Qiang; Cao Cao said his merit equaled Xiao He\'s.',
  },
  'chen-qun': {
    zh: '字長文,潁川許昌人。 制九品中正,定百年選官之制。 魏室棟梁,直諫曹丕，曹叡,稱賢相。',
    en: 'Style name Changwen, of Xu in Yingchuan. He established the Nine-rank System, which would govern official appointments for a hundred years. A pillar of Wei, he remonstrated with both Cao Pi and Cao Rui and was called a worthy chancellor.',
  },
  'yang-xiu': {
    zh: '字德祖,弘農華陰人。 才思敏捷,曹操謀士,常解其心意而招忌。 「雞肋」之語,終被曹操所殺。',
    en: "Style name Dezu, of Huayin in Hongnong. So nimble of mind that Cao Cao's hidden meanings could not stay hidden from him — which earned him hatred. When he read Cao Cao's password 'chicken-ribs' as a sign the campaign was finished, Cao Cao at last had him executed.",
  },
  // ─── 三國新增列傳 (Three Kingdoms — expanded biographies) ───
  'xiahou-yuan': {
    era: { zh: '征西將軍', en: 'General Who Conquers the West' },
    zh: '字妙才,沛國譙縣人,曹操族弟,夏侯惇之從弟。早年代曹操坐罪繫獄,曹操竭力救之得免,自此心服。隨曹操征戰二十餘年,長於奔襲,號「虎步關右」。破馬超於渭南,平宋建於枹罕,克氐羌諸部,曹操贊曰:「典軍校尉夏侯淵,三日五百,六日一千。」 後鎮漢中,定軍山之戰輕兵應急修鹿角,為黃忠所斬,時年六十有餘。',
    en: 'Style name Miaocai, cousin of Cao Cao and younger kinsman of Xiahou Dun. In his youth he took the blame for a crime of Cao Cao and was imprisoned; Cao Cao saved him at great cost, and his loyalty was thereafter unshakable. For more than twenty years he campaigned at Cao Cao\'s side, famed for lightning marches — "Tiger-Strider of Guanyou." He broke Ma Chao at Weinan, crushed Song Jian at Fuhan, and pacified the Di and Qiang. Cao Cao praised: "My Colonel-Director Xiahou Yuan — five hundred li in three days, a thousand li in six." Garrisoned at Hanzhong, he rode out lightly armed to repair the antlers at Mount Dingjun and was struck down by Huang Zhong, past sixty years of age.',
  },
  'xiahou-ba': {
    zh: '字仲權,夏侯淵之子。父死於蜀漢,銜恨二十年。司馬懿發高平陵之變,夏侯氏為司馬氏所忌,夏侯霸獨自西奔投蜀。後主以姨表之親厚待之,姜維引以為副,屢從北伐。卒於蜀中,蜀人感其投誠之義。',
    en: 'Style name Zhongquan, son of Xiahou Yuan. He carried twenty years of grief for his father, killed by Shu. When Sima Yi seized power in the Gaopingling coup and the Xiahou clan was marked, Xiahou Ba alone fled west and surrendered to Shu. The Second Emperor — his cousin by marriage — received him warmly; Jiang Wei made him a deputy and he marched in many northern campaigns. He died in Shu, mourned for his bold defection.',
  },
  'xiahou-xuan': {
    era: { zh: '玄學名士', en: 'Master of the Mysterious Learning' },
    zh: '字泰初,夏侯尚之子。少有名望,風儀爽朗,玄學三宗之一,與何晏，王弼齊名。歷任散騎常侍，征西將軍,有清談之才。司馬師執政,以與李豐謀廢之事,被誅夷三族。臨刑神色不變,世人歎其雅量。',
    en: 'Style name Taichu, son of Xiahou Shang. From youth a name of high repute, of luminous bearing, one of the three founders of the Mysterious Learning — set beside He Yan and Wang Bi. He served as Cavalier Attendant and General Who Conquers the West, peerless in pure conversation. When Sima Shi held power, his part in Li Feng\'s plot to depose the regent brought death to three branches of his clan. At the block his colour did not change; the world long admired his composure.',
  },
  'xiahou-mao': {
    zh: '字子林,夏侯惇之子。娶曹操女清河公主,駙馬都尉。鎮守長安。性懦怯,諸葛亮首出祁山,聞之喪膽,賴關中諸將支吾。後以怠職免歸。',
    en: 'Style name Zilin, son of Xiahou Dun. He married the Princess of Qinghe, Cao Cao\'s daughter, and bore the title of Imperial Son-in-Law. Governor of Chang\'an. Of timid nature, when Zhuge Liang first marched out of Mount Qi he lost his nerve; the Guanzhong generals had to hold the line. Eventually he was removed for negligence and sent home.',
  },
  'sima-yan': {
    era: { zh: '晉武帝', en: 'Emperor Wu of Jin' },
    zh: '字安世,司馬昭嫡長子。承父祖之業,代魏建晉,為晉開國之君。咸寧五年遣杜預，王濬，王渾分道伐吳,次年金陵草木皆破,三國歸於一統。前期省刑薄賦,號「太康之治」;後期沉湎酒色,大封同姓,埋下八王之亂之禍。在位二十五年,壽五十五。',
    en: 'Style name Anshi, eldest legitimate son of Sima Zhao. He inherited his father\'s and grandfather\'s work, replaced Wei, and founded Jin. In 279 he sent Du Yu, Wang Jun, and Wang Hun down three roads against Wu; the next year Jinling fell and the threefold split was ended. His early reign was lenient in punishment and light in taxation — the "Taikang prosperity." Late in life he drowned in wine and women, and his lavish enfeoffment of kinsmen planted the seed of the War of Eight Princes. Twenty-five years he reigned; fifty-five he lived.',
  },
  'sima-fu': {
    era: { zh: '安平獻王', en: 'Prince Xian of Anping' },
    zh: '字叔達,司馬懿之弟,司馬八達之一。歷仕魏晉兩朝,以清儉持身,身列三公而家無餘財。高平陵之變,佐兄定大計;甘露事變,曹髦遇害,獨撫屍而哭,曰:「殺陛下者,臣之罪也!」 武帝即位,封安平王,壽九十三,謚獻。',
    en: 'Style name Shuda, brother of Sima Yi, one of the eight gifted "Da" brothers of the Sima clan. He served both Wei and Jin, austere and frugal — though enrolled among the Three Excellencies, his household kept no surplus. He helped his brother plan the Gaopingling coup. When Emperor Mao was struck down in the Ganlu incident, Sima Fu alone cradled the body and wept: "He who killed the emperor — the crime is mine!" Under Emperor Wu he was made Prince of Anping. He lived ninety-three years; his posthumous name was Xian — "The Devoted."',
  },
  'sima-lang': {
    zh: '字伯達,司馬懿長兄,八達之首。少時避亂溫縣,治家有方。事曹操為主簿,鎮守冀州，兗州,平諸荒;隨夏侯惇征吳,於行間病卒,年四十七。臨終遺令薄葬,士林歎其廉。',
    en: 'Style name Boda, eldest brother of Sima Yi and first of the eight "Da." In youth he sheltered his clan from the chaos at Wen county and managed the household with iron care. He served Cao Cao as Master of Records, governed Jizhou and Yanzhou, and tamed many famine districts. Marching against Wu under Xiahou Dun, he died of plague in camp at forty-seven. His will commanded a frugal burial; the gentry mourned his clean hands.',
  },
  'sima-zhi': {
    zh: '字子華,司馬懿從弟,河內溫縣人。出仕魏室,以勤政著稱。歷任典農中郎將，大司農,管度支屯田,務在富國。在位敦厚不二,凡事執法,雖大臣權貴亦無所撓。',
    en: 'Style name Zihua, cousin of Sima Yi, of Wen in Henei. He took office under Wei and was known for diligence. As Director of Agricultural Colonies and Grand Minister of Agriculture he ran the granary and tuntian fields, his only aim the enrichment of the state. Solid and unyielding, he applied the law without exception, even against great ministers and favourites.',
  },
  'sima-fang': {
    zh: '字建公,河內溫縣人,司馬懿之父。漢京兆尹,以儀範稱於世。教子有方,八子皆登顯位,號司馬八達。年七十一卒於漢末。',
    en: 'Style name Jiangong, of Wen in Henei, father of Sima Yi. Under Han he served as Intendant of the Capital and was known throughout the realm for stately bearing. He raised his sons in strict order; all eight rose to high office and were called the Eight "Da" of Sima. He died at seventy-one in the closing years of Han.',
  },
  'sima-you': {
    era: { zh: '齊獻王', en: 'Prince Xian of Qi' },
    zh: '字大猷,司馬昭次子,司馬炎之同母弟。少有令德,聲望出炎之上,司馬昭嘗欲立之為嗣。武帝忌之,封齊王出鎮。後召還京師,憂憤而卒,年三十六。死後三日,士民哭聲滿洛陽。',
    en: 'Style name Dayou, second son of Sima Zhao and full brother of Sima Yan. Of luminous virtue from youth, his repute outshone his elder; Sima Zhao once thought of naming him heir. Emperor Wu, jealous, made him Prince of Qi and sent him to a frontier post. Later recalled to the capital, he died of grief and rage at thirty-six. For three days after his death the streets of Luoyang were filled with weeping.',
  },
  'sima-biao': {
    zh: '字紹統,西晉宗室,亦為史家。撰《續漢書》八十卷,補光武以下事,後范曄修《後漢書》多本於此。學問博洽,清貧自守,卒於洛陽。',
    en: 'Style name Shaotong, a Jin prince and also a historian. He compiled the Continued Han History in eighty fascicles, taking up the record from Emperor Guangwu onward; later Fan Ye, in writing his own Book of the Later Han, drew heavily upon it. Broad in learning and clean in poverty, he died at Luoyang.',
  },
  'sima-jun': {
    era: { zh: '扶風武王', en: 'Prince Wu of Fufeng' },
    zh: '字子臧,司馬懿之子,武帝叔父。鎮守關中,撫綏羌戎,有撫遠之略。性節儉,飲食衣服不貴於民。卒,武帝為之發哀,贈大司馬,謚武。',
    en: 'Style name Zicang, son of Sima Yi and uncle of Emperor Wu. Garrisoned in Guanzhong, he soothed the Qiang and Rong tribes and showed long sight in distant policy. Frugal in life — his food and dress no finer than the common folk\'s. At his death Emperor Wu mourned in person; he was granted the title Grand Marshal and the posthumous name Wu.',
  },
  'sima-zhou': {
    era: { zh: '琅琊武王', en: 'Prince Wu of Langya' },
    zh: '字子將,司馬懿之子。征伐淮南,以振武威,鎮東將軍,封琅琊王。其孫即東晉中興之主元帝司馬睿。',
    en: 'Style name Zijiang, son of Sima Yi. He campaigned in Huainan to extend the martial fame of the clan, and was made General Who Subdues the East and Prince of Langya. His grandson would become Emperor Yuan of the Eastern Jin, the restorer of the dynasty.',
  },
  'sima-liang': {
    era: { zh: '汝南文成王', en: 'Prince Wencheng of Runan' },
    zh: '字子翼,司馬懿四子。武帝臨終以之輔政,八王之亂首禍者。永平元年為汝南王;與楚王瑋構隙,瑋矯詔殺之,夷三族。',
    en: 'Style name Ziyi, fourth son of Sima Yi. Emperor Wu on his deathbed named him regent; he was the first to bring on the War of Eight Princes. In 291 he was made Prince of Runan. Falling out with Prince Wei of Chu, he was killed and his clan exterminated by Wei\'s forged edict — three branches.',
  },
  'sima-lun': {
    zh: '字子彝,司馬懿九子。性貪詐,八王之亂中弒賈后,廢惠帝自立。眾叛親離,旋為齊王冏所敗,賜死金墉。',
    en: 'Style name Ziyi (the lower), ninth son of Sima Yi. Grasping and false, in the War of Eight Princes he killed Empress Jia, deposed Emperor Hui, and made himself emperor. Cast off by men and kin alike, he was quickly broken by Prince Jiong of Qi and was ordered to die at Jinyong palace.',
  },
  'sima-ai': {
    era: { zh: '長沙厲王', en: 'Prince Li of Changsha' },
    zh: '字士度,武帝之子。八王之亂中破成都王穎、河間王顒於洛陽,以孤軍守京城百日。後為東海王越所執,焚於金墉,年二十八。',
    en: 'Style name Shidu, son of Emperor Wu. In the War of Eight Princes he broke the armies of Prince Ying of Chengdu and Prince Yong of Hejian outside Luoyang and held the capital with a lone force for a hundred days. Eventually seized by Prince Yue of Donghai, he was burned alive at Jinyong palace at twenty-eight.',
  },
  'sima-ying': {
    era: { zh: '成都王', en: 'Prince of Chengdu' },
    zh: '字章度,武帝之子。素得人望,八王亂中一度入洛專政。後敗於王浚之鮮卑騎,挾帝奔長安。永興二年被殺。',
    en: 'Style name Zhangdu, son of Emperor Wu. Long popular with men, in the War of Eight Princes he held Luoyang for a season. Defeated by Wang Jun and his Xianbei riders, he carried the emperor in flight to Chang\'an. In 306 he was killed.',
  },
  'sima-jiong': {
    era: { zh: '齊王', en: 'Prince of Qi' },
    zh: '字景治,司馬攸之子。糾合宗室誅趙王倫,迎惠帝復位,專政洛陽。日日宴樂,失人心,為長沙王乂所殺。',
    en: 'Style name Jingzhi, son of Sima You. He rallied the clan to put down Prince Lun of Zhao, restored Emperor Hui, and ruled at Luoyang. Day after day in banquet and music, he lost the hearts of men, and was killed by Prince Ai of Changsha.',
  },
  'sima-yong': {
    era: { zh: '河間王', en: 'Prince of Hejian' },
    zh: '字文載,司馬孚之孫。據關中,聯成都王穎攻洛陽。八王之亂中諸黨輾轉相殺,顒晚為南陽王模所迫,死於就國途中。',
    en: 'Style name Wenzai, grandson of Sima Fu. Master of Guanzhong, he joined Prince Ying of Chengdu in assaulting Luoyang. As the eight princes devoured each other, he was at last cornered by Prince Mo of Nanyang and died on the road to his appanage.',
  },
  'sima-yu': {
    zh: '字熙祖,惠帝太子。聰敏絕倫,賈后所忌,密召使醉,執手書反詞,廢為庶人,旋鴆殺於許昌。年二十三,天下冤之。',
    en: 'Style name Xizu, crown prince of Emperor Hui. Of preternatural intellect, hated by Empress Jia. She had him drugged with wine and made to copy a seditious draft; he was deposed to commoner and then poisoned at Xuchang. Twenty-three years old — the realm called it a great injustice.',
  },
  'sima-zhong': {
    era: { zh: '晉惠帝', en: 'Emperor Hui of Jin' },
    zh: '字正度,武帝次子。生而蒙昧,聞蝦蟆之鳴問:「為官乎,為私乎?」 在位十七年,八王之亂起,五胡入華,西晉自此亂亡。',
    en: 'Style name Zhengdu, second son of Emperor Wu. He came into the world dim. Hearing frogs at night, he asked: "Do they croak for the state, or for themselves?" Seventeen years he reigned: the War of Eight Princes broke out, the Five Hu poured into China, and the Western Jin fell into ruin.',
  },
  'wang-yuanji': {
    era: { zh: '文明皇后', en: 'Empress Wenming' },
    zh: '東海郯人,王肅之女,司馬昭夫人。聰明賢慧,有母儀之德。十五年生司馬炎，司馬攸。早察鍾會「見利忘義」必反,昭未深聽,後果應其言。武帝即位,尊為皇太后,壽五十二而崩。',
    en: 'Of Tan in Donghai, daughter of Wang Su and wife of Sima Zhao. Brilliant and wise, she carried the dignity of a mother of state. Over fifteen years she bore Sima Yan and Sima You. She saw early that Zhong Hui — "greedy and faithless" — would rebel, but Sima Zhao did not heed; afterwards her word came true. Under Emperor Wu she was honored as Grand Empress Dowager. She lived to fifty-two.',
  },
  'lady-zhen': {
    era: { zh: '甄夫人', en: 'Lady Zhen' },
    zh: '中山無極人,容色傾城。初為袁紹次子袁熙之婦。曹操克鄴,曹丕納之,寵冠後宮,生明帝叡。後為郭夫人所讒,被賜死,以髮覆面，糠塞口而葬。明帝即位,追尊為文昭皇后。曹植《洛神賦》傳為悼之而作。',
    en: 'Of Wuji in Zhongshan, of city-toppling beauty. She was first wife to Yuan Xi, second son of Yuan Shao. When Cao Cao took Ye, Cao Pi took her — and her favor outshone the rest of his harem. She bore the future Emperor Ming, Cao Rui. Later, slandered by Lady Guo, she was ordered to die; she was buried with her hair across her face and chaff stuffed in her mouth. When her son took the throne, she was raised to Empress Wenzhao. The "Rhapsody of the Goddess of the Luo" is said to have been Cao Zhi\'s elegy for her.',
  },
  'lady-sun': {
    era: { zh: '孫夫人', en: 'Lady Sun' },
    zh: '吳郡富春人,孫堅之女,孫權之妹。性剛猛,有兄風,侍婢百餘人皆執刀劍立侍。赤壁後孫劉聯姻,嫁劉備於荊州。後劉備入蜀,孫權密迎之歸,並欲攜阿斗,為趙雲、張飛截江奪回。傳夷陵之敗聞先主死訊,投江自盡。',
    en: 'Of Fuchun in Wu, daughter of Sun Jian and younger sister of Sun Quan. Fierce as her brothers — over a hundred maids attended her with sword and blade at the belt. After Red Cliffs the Sun-Liu marriage alliance gave her to Liu Bei at Jingzhou. When Liu Bei marched into Shu, Sun Quan sent a covert boat to bring her back, and she tried to take the infant heir A-dou with her; Zhao Yun and Zhang Fei blocked the river and snatched him back. Tradition says that when she heard of Liu Bei\'s death after Yiling, she threw herself into the Yangzi.',
  },
  'lady-huang': {
    zh: '黃承彥之女,諸葛亮之妻。容貌雖不甚美,然博通經史,巧思絕倫。能制木牛流馬，連弩之屬,助孔明定蜀興漢。傳襄陽童謠云:「莫作孔明擇婦,正得阿承醜女。」',
    en: 'Daughter of Huang Chengyan, wife of Zhuge Liang. Her face was no great beauty, but she was learned in the classics and histories and matchless in craft. She built the wooden ox and gliding horse and the repeating crossbow, and helped Kongming pacify Shu and uphold the Han. A ditty in Xiangyang ran: "Choose no wife as Kongming did — he got A-Cheng\'s plain-faced daughter."',
  },
  'cai-wenji': {
    era: { zh: '文姬', en: 'Wenji' },
    zh: '陳留人,蔡邕之女,名琰字文姬。博學能文,通音律。漢末為南匈奴所擄,留居匈奴十二年,生二子。曹操念與蔡邕舊交,以金璧贖歸,作《悲憤詩》、《胡笳十八拍》傳世。後嫁董祀,以記憶補書千卷。',
    en: 'Of Chenliu, daughter of Cai Yong, named Yan, styled Wenji. Vastly learned, a poet, and master of music. In the closing years of Han she was carried off by the Southern Xiongnu and lived among them for twelve years, bearing two sons. Cao Cao, mindful of his old friendship with her father, ransomed her back with gold and jade. She wrote the "Poem of Grief and Indignation" and the "Eighteen Songs of the Nomad Reed-Pipe," works that survive to this day. After her return she married Dong Si and restored a thousand lost volumes from memory.',
  },
  'bu-lianshi': {
    zh: '臨淮淮陰人,孫權之寵姬。性不妒忌,所薦皆寵。生孫魯班，孫魯育二女。權數欲立為后,以未生子辭。卒,權追贈皇后位,有寵終身。',
    en: 'Of Huaiyin in Linhuai, the beloved consort of Sun Quan. She was without jealousy — all the women she recommended became favorites in their turn. She bore Sun Luban and Sun Luyu. Sun Quan often wished to make her empress; she refused, having borne no son. After her death he posthumously raised her to that rank — the favor lasted all her life.',
  },
  'lady-bian': {
    era: { zh: '武宣皇后', en: 'Empress Wuxuan' },
    zh: '琅琊開陽人,出倡家。初為曹操妾,後正室丁夫人去,立為繼室。生曹丕，曹彰，曹植，曹熊四子。性節儉,衣食粗惡,謙抑無妒。曹丕即位尊為太后,武帝亦尊為太皇太后,壽七十一。',
    en: 'Of Kaiyang in Langya, born to a family of musicians. First a concubine of Cao Cao, she was raised to chief wife when Lady Ding was dismissed. She bore Cao Pi, Cao Zhang, Cao Zhi, and Cao Xiong. Frugal and self-effacing, her dress and food were coarse and she nursed no jealousy. Under Cao Pi she was Grand Empress Dowager; under Emperor Ming, Great Grand Empress Dowager. She lived seventy-one years.',
  },
  'lady-gan': {
    zh: '沛人,劉備之妾。沛縣聘為小妻,以禮自持,容色端麗。生後主劉禪。當陽長坂之難,趙雲懷阿斗於戰陣中救出,而甘夫人遂歿。蜀漢追尊為昭烈皇后。',
    en: 'Of Pei, concubine of Liu Bei. Taken as junior wife at Pei county, she bore herself with dignity, beautiful and grave. She gave Liu Bei his heir, the future Second Emperor. In the rout at Changban she perished even as Zhao Yun bore the infant A-dou out through the host. She was posthumously raised to Empress Zhaolie of Shu Han.',
  },
  'lady-mi': {
    zh: '徐州人,糜竺之妹,劉備夫人。當陽之難,抱阿斗投井而死,以全趙雲之志。趙雲推井牆而掩之,身負阿斗突出重圍。後人傷其節烈。',
    en: 'Of Xuzhou, sister of Mi Zhu and wife of Liu Bei. In the rout at Changban, clutching the infant A-dou, she leapt down a well to free Zhao Yun from divided care. Zhao Yun pushed the well-wall over to cover her body and, with the child at his breast, cut his way out of the host. Later ages mourned her courage and resolve.',
  },
  'lady-wu': {
    era: { zh: '吳國太', en: 'Lady Wu of the Sun House' },
    zh: '吳郡吳人,吳夫人之妹。孫堅死後,孫策、孫權之姨母兼養母。性慈而識大體,當勸權「外事不決問周瑜,內事不決問張昭」。劉備過江娶親,於甘露寺相親,定孫劉之好。',
    en: 'Of Wu county in Wujun, younger sister of Lady Wu the elder. After Sun Jian\'s death she was aunt and foster-mother to Sun Ce and Sun Quan. Kind in heart but firm in judgment, it was she who urged Sun Quan: "For matters abroad, ask Zhou Yu; for matters at home, ask Zhang Zhao." When Liu Bei crossed the river to wed, she met him at Ganlu Monastery and sealed the Sun-Liu match.',
  },
  'empress-guo': {
    era: { zh: '文德皇后', en: 'Empress Wende' },
    zh: '安平人,郭永之女,字女王。少而聰惠,曹操喜之,以賜曹丕。曹丕即位,與甄夫人爭寵,讒言甄被賜死。明帝立,亦無所出,養曹叡為己子。性節儉,卒於洛陽。',
    en: 'Of Anping, daughter of Guo Yong, courtesy name "Nü-wang" — Queen of Women. Bright from youth, Cao Cao prized her and gave her to Cao Pi. After his accession she contested favor with Lady Zhen and her slanders brought about the latter\'s death by edict. Childless herself, she raised Cao Rui as her own. Frugal of life, she died at Luoyang.',
  },
  'empress-mao': {
    zh: '河內人,明帝曹叡之后。少以姿色入宮。叡寵之既久,移情虞嬪,毛后怏怨,叡怒,賜死。',
    en: 'Of Henei, empress of Cao Rui, Emperor Ming. She entered the palace through her beauty. After long favor, the emperor\'s love passed to a Lady Yu; she complained openly, and the emperor in his anger sent down a draught of poison.',
  },
  'empress-pan': {
    zh: '會稽句章人,孫權之后。父為小吏,坐法死,姊妹沒入織室。權見而異之,納為宮人,寵冠後宮,生少子孫亮。權崩前立為皇后,旋為宮人所縊。',
    en: 'Of Juzhang in Kuaiji, empress of Sun Quan. Her father, a petty clerk, had been condemned to death; she and her sister were thrown into the palace weaving rooms. Sun Quan saw her, marked her out, brought her in as a palace woman, and raised her above the rest of his harem. She bore the youngest son Sun Liang. Just before Sun Quan\'s death she was made empress; soon after she was strangled by palace women.',
  },
  'cao-jie': {
    zh: '曹操之女,漢獻帝皇后。曹丕篡漢,遣使索玉璽,曹節怒擲璽於地曰:「上天不祚爾!」 隨獻帝出居山陽,後封山陽公夫人,於封地以禮自持,終其身。',
    en: 'Daughter of Cao Cao, empress of Emperor Xian of Han. When her brother Cao Pi seized the throne and sent for the imperial seal, she flung it to the ground crying: "Heaven will deny you good fortune!" She went into exile with the deposed emperor to Shanyang and there, as Lady of the Duke of Shanyang, kept her dignity to the end of her life.',
  },
  'cao-hua': {
    zh: '曹操之女,獻帝貴人。曹丕代漢,姊妹同居山陽公第,終身不再入魏宮。',
    en: 'Daughter of Cao Cao, Honored Lady of Emperor Xian. After Cao Pi replaced Han, she lived with her sister in the household of the Duke of Shanyang and never again set foot in a palace of Wei.',
  },
  'sun-luban': {
    era: { zh: '全公主', en: 'Princess Quan' },
    zh: '字大虎,孫權與步夫人長女。初嫁周瑜子周循,早寡;再嫁全琮,號全公主。慧黠而善讒,與步家、全氏專弄宮闈,構陷太子孫和,廢之為庶人。後孫綝起,謀殺之事敗,流徙豫章而卒。',
    en: 'Style name Dahu, elder daughter of Sun Quan and Lady Bu. First married to Zhou Xun, son of Zhou Yu, and widowed young; she married again to Quan Zong and became known as Princess Quan. Sharp and slanderous, with the Bu and Quan clans she dominated the inner palace and brought down the crown prince Sun He, sending him into commoner exile. When Sun Chen rose, her plot against him failed and she was exiled to Yuzhang, where she died.',
  },
  'sun-luyu': {
    era: { zh: '朱公主', en: 'Princess Zhu' },
    zh: '字小虎,孫權與步夫人次女,孫魯班之妹。嫁朱據,稱朱公主。性恬靜,與姊不睦,姊讒之,孫峻誅之於諸暨,夷其家。',
    en: 'Style name Xiaohu, younger daughter of Sun Quan and Lady Bu, sister of Sun Luban. Married to Zhu Ju, she was called Princess Zhu. Quiet and gentle, she fell out with her elder sister, who slandered her; Sun Jun put her to death at Zhuji and wiped out her household.',
  },
  'lady-cai': {
    zh: '襄陽人,劉表續弦。蔡瑁之姊。性嫉妒,陷劉琦,寵幼子劉琮。表卒,矯遺命立琮為主。曹操南下,琮降,蔡氏被遷青州,鬱卒。',
    en: 'Of Xiangyang, second wife of Liu Biao and elder sister of Cai Mao. Jealous and grasping, she undermined the elder son Liu Qi and pushed the younger Liu Cong forward. At Liu Biao\'s death she forged the will and made Cong master; when Cao Cao came south, Cong surrendered, and the Cai clan was moved to Qingzhou, where she died in despair.',
  },
  'lady-ding': {
    zh: '譙人,曹操原配。生曹昂。曹昂死於宛城張繡之變,丁夫人哭曰:「君殺吾子,而吾無恨乎!」 怒歸娘家。曹操親往迎,終不還。憂念終身,以妾卞夫人代為正室。',
    en: 'Of Qiao, first wife of Cao Cao. She bore Cao Ang, who fell in the Wancheng mutiny. She wept: "You killed my son, how can I not grieve?" and stormed back to her natal house. Cao Cao went in person to bring her home; she would not return. He grieved for her ever after and at length raised his concubine Lady Bian as principal wife in her stead.',
  },
  'lady-xiahou': {
    zh: '夏侯霸之女,夏侯淵從姪女。建安五年從父叔,於沛縣外採薪為張飛所獲,飛知其士族,納為夫人。生二女,皆為後主之后。',
    en: 'Daughter of Xiahou Ba (the elder line) and great-niece of Xiahou Yuan. In the year 200, gathering firewood beyond Pei county, she was caught by Zhang Fei; learning that she was of gentry blood, he made her his wife. She bore two daughters, both of whom became empresses of Liu Shan.',
  },
  'he-hou': {
    era: { zh: '何皇后', en: 'Empress He' },
    zh: '南陽宛人,屠家之女,以采女入宮。生少帝劉辯。父屠夫,兄何進為大將軍。靈帝崩,進謀誅宦官,反為十常侍所殺,董卓入京,廢辯為弘農王,鴆殺之,並逼何后服毒。',
    en: 'Of Wan in Nanyang, daughter of a butcher, entered the palace as a selected woman. She bore Liu Bian, the Young Emperor. Her father slaughtered cattle; her brother He Jin became Grand Marshal. When Emperor Ling died and He Jin plotted to wipe out the eunuchs, he was instead cut down by the Ten Attendants; Dong Zhuo entered the capital, deposed Bian as Prince of Hongnong and poisoned him, then forced the Empress He to drink the same draught.',
  },
  'dong-taihou': {
    zh: '河間人,漢桓帝皇后,靈帝之母。攬權多年,與何后爭嫡。靈帝崩,何進當權,逼董太后歸河間,憂憤暴卒。',
    en: 'Of Hejian, empress of Emperor Huan and mother of Emperor Ling of Han. For many years she held power and contested precedence with Empress He. After Emperor Ling died, He Jin in his rise forced her to return to Hejian, where she died of grief and rage.',
  },
  'wang-meiren': {
    zh: '趙人,漢靈帝美人,陳留王劉協(後獻帝)生母。何皇后忌之,鴆之而死。靈帝痛悼,追尊為靈懷皇后。',
    en: 'Of Zhao, a Lady of Honor of Emperor Ling and birth mother of Liu Xie, Prince of Chenliu — the future Emperor Xian. Empress He, jealous of her, poisoned her. The emperor mourned grievously and raised her posthumously to Empress Linghuai.',
  },
  'xiahou-hui': {
    zh: '夏侯尚之女,司馬師之妻。少有姿色,聰慧過人。司馬師潛謀大事,以慧察其機,後為師所鴆,年二十四。其女即晉武帝皇后楊艷之姑。',
    en: 'Daughter of Xiahou Shang and wife of Sima Shi. Beautiful and brilliant. When Sima Shi was laying his quiet schemes, she divined them through her wit; he had her poisoned at twenty-four. Her aunt-line led to Empress Yang Yan of Emperor Wu of Jin.',
  },
  'empress-mu': {
    zh: '陳留人,吳壹之妹,劉備之繼后。先嫁劉瑁,瑁早卒。劉備入蜀,法正勸納之,以結益州大姓,遂立為后。後主即位尊為皇太后。蜀漢亡後遷洛陽,卒。',
    en: 'Of Chenliu, sister of Wu Yi and second empress of Liu Bei. First married to Liu Mao, who died young. When Liu Bei entered Shu, Fa Zheng urged him to take her, to bind the great families of Yi province; she was made empress. Under the Second Emperor she was Grand Empress Dowager. After Shu fell she was moved to Luoyang and died there.',
  },
  'guan-yinping': {
    zh: '關羽之女。父守荊州時,孫權遣使求婚為子,羽辱使曰:「虎女焉嫁犬子!」 婚事不成,孫劉遂裂。荊州陷,銀屏隨諸葛瞻入蜀。',
    en: 'Daughter of Guan Yu. When her father held Jingzhou, Sun Quan sent envoys to propose marriage for his own son; Guan Yu insulted them: "Shall a tiger\'s daughter wed a dog\'s son?" The match fell through and the Sun-Liu alliance broke. After Jingzhou fell she went with Zhuge Zhan into Shu.',
  },
  'guan-suo': {
    zh: '關羽第三子,演義人物。荊州陷時為母所匿,流落山中,得異人傳武藝。後南中起兵,助諸葛亮七擒孟獲,屢立戰功。其妻鮑三娘亦女中豪傑。',
    en: 'Third son of Guan Yu (chiefly a Romance figure). When Jingzhou fell his mother hid him; he grew up in the hills and learned arms from a hermit master. Later he raised troops in the south and helped Zhuge Liang capture Meng Huo seven times. His wife Bao Sanniang was herself a heroine of the spear.',
  },
  'shamoke': {
    zh: '五溪蠻王。劉備伐吳,沙摩柯助蜀,以鐵蒺藜骨朵見長。夷陵之火,死於亂軍。',
    en: 'King of the Wuxi tribes. When Liu Bei marched against Wu, Shamoke joined the Shu host, famed for the iron-mace caltrop. He fell in the fire of Yiling, lost in the confusion of armies.',
  },
  'zhuge-zhan': {
    era: { zh: '蜀漢忠烈', en: 'Loyal Martyr of Shu' },
    zh: '字思遠,諸葛亮之子。父歿時年八歲,聰慧過人。長承父業,為衛將軍。鄧艾偷渡陰平,瞻領軍迎於綿竹,拒降書,戰死,年三十七。其子諸葛尚同陣陣亡。',
    en: 'Style name Siyuan, son of Zhuge Liang. He was eight when his father died — bright beyond his years. He rose to be General of the Guard. When Deng Ai broke through at Yinping, Zhuge Zhan led the host out to meet him at Mianzhu, refused the surrender letter, and fell in battle at thirty-seven. His son Zhuge Shang died at his side.',
  },
  'zhuge-shang': {
    zh: '諸葛亮之孫,諸葛瞻之子。年十九,綿竹之戰見父兵敗,歎曰:「父子荷國重恩,不早斬黃皓,以致敗國殄民,用生何為!」 拍馬入陣戰死。',
    en: 'Grandson of Zhuge Liang and son of Zhuge Zhan. At nineteen, watching his father\'s army break at Mianzhu, he sighed: "Father and son have borne the kingdom\'s heavy favor — and we did not cut off Huang Hao early enough. The state is ruined, the people undone. What is life for?" He whipped his horse into the lines and died fighting.',
  },
  'zhuge-dan': {
    zh: '字公休,諸葛亮族弟,曹魏鎮東大將軍。鎮淮南,治壽春。司馬昭專政,夏侯玄、李豐先後被誅,誕懼,起兵聚眾十餘萬,引吳為援。司馬昭親率二十六萬眾圍之,半歲城陷,誕被斬,夷三族。',
    en: 'Style name Gongxiu, cousin of Zhuge Liang and Wei\'s General Who Pacifies the East. He garrisoned Huainan and ruled at Shouchun. When Sima Zhao seized power and Xiahou Xuan and Li Feng were killed one after the other, Zhuge Dan, in fear, raised more than a hundred thousand men and called Wu to his aid. Sima Zhao took the field at the head of two hundred and sixty thousand and laid siege; after half a year the city fell, Zhuge Dan was beheaded, and three branches of his clan were exterminated.',
  },
  'zhuge-xu-wei': {
    zh: '字德林,諸葛誕之姪,魏將。曾從鄧艾、鍾會伐蜀,出武都道,被姜維所紿,失機而還,為鍾會收兵權。',
    en: 'Style name Delin, nephew of Zhuge Dan, a Wei general. In the Shu campaign with Deng Ai and Zhong Hui he marched out by the Wudu road; Jiang Wei deceived him and he missed his chance, drawing back — at which Zhong Hui took his troops away from him.',
  },
  'zhuge-xuan': {
    zh: '諸葛亮叔父。建安二年攜亮兄弟避亂荊州,依劉表。後病卒於襄陽,亮遂躬耕南陽。',
    en: 'Uncle of Zhuge Liang. In 197, fleeing the chaos of the north, he brought the young Zhuge brothers to Jingzhou and took shelter with Liu Biao. He died of illness at Xiangyang, and Zhuge Liang thereafter tilled the fields at Nanyang.',
  },
  'liu-chen': {
    era: { zh: '北地王', en: 'Prince of Beidi' },
    zh: '蜀漢後主第五子。鄧艾兵臨成都,後主議降,北地王諶力諫:「縱不能保,當父子君臣背城一戰,同死社稷!」 諫不納,赴昭烈廟哭祭,殺妻子,自刎於廟前,蜀漢君臣聞之莫不痛悼。',
    en: 'Fifth son of the Second Emperor of Shu. When Deng Ai brought his army to the gates of Chengdu and the emperor moved to surrender, the Prince of Beidi pressed his protest: "Even if we cannot hold, let father and son, lord and minister, stand back-to-wall and die together for the altars of state!" His words were not heeded. He went to the temple of the founding emperor, wept the rites, killed his wife and children, and cut his own throat at the temple gate; the court of Shu wept for him to a man.',
  },
  'pang-lin': {
    zh: '龐統之弟。隨劉備入蜀,荊州陷,妻子被擄。後黃權降魏,林父子隨之,後復歸蜀。',
    en: 'Younger brother of Pang Tong. He followed Liu Bei into Shu. When Jingzhou fell, his wife and children were taken captive. Later, when Huang Quan surrendered to Wei, Pang Lin and his sons went with him, and afterward returned to Shu.',
  },
  'zuo-ci': {
    era: { zh: '烏角先生', en: 'Master Black-Horn' },
    zh: '廬江人,字元放,著名方士。曹操召之而戲弄之,擲杯化魚,呵酒成霜。最終隱於山林,世傳得長生道。演義中多以神異之筆描其術。',
    en: 'Of Lujiang, courtesy name Yuanfang, a famed Daoist adept. Summoned by Cao Cao, he made sport of him — flinging the cup to turn into a fish, hailing the wine to freeze into frost. He vanished into the hills at the last and folk said he had won the Tao of long life. The Romance heaps marvels upon his arts.',
  },
  'wutugu': {
    zh: '南蠻烏戈國主。身長一丈二尺,披藤甲不畏刀箭。助孟獲拒蜀。諸葛亮以火攻焚於盤蛇谷,藤甲皆灰,孔明歎曰:「吾雖有功於社稷,必損陽壽矣!」',
    en: 'Lord of the Wuge tribe of the southern barbarians. He stood twelve chi tall and wore rattan armor that turned both blade and arrow. He came to Meng Huo\'s aid against Shu. Zhuge Liang burned them in the Coiled-Snake Valley; the rattan plates turned to ash. Kongming sighed: "Though I do my state a service, I must shorten my own years for it."',
  },
  'mu-lu': {
    zh: '南蠻八納洞主。能呼風喚雨,驅猛獸應敵。諸葛亮南征以木牛流馬制之,亦敗。',
    en: 'Lord of the Bana grotto among the southern tribes. He could summon wind and rain and drive wild beasts against the enemy. Zhuge Liang met him with wooden ox and gliding horse on the southern campaign, and he too was broken.',
  },
  'duosi': {
    zh: '禿龍洞主。據惡水四泉,蜀軍誤飲皆啞,瀕於潰。賴山中孟節指引,飲安樂泉而解,終擒朵思。',
    en: 'Lord of the Tulong grotto. He held four poisoned springs in his fastness; the Shu soldiers who drank from them were struck dumb and the army nearly broke. Only when the mountain hermit Meng Jie guided them to the Sweet-Joy Spring were they restored — and Duosi was at last taken.',
  },
  'daolaidong': {
    zh: '銀坑洞主帶來。孟獲之妻舅,助獲拒蜀。後被生擒。',
    en: 'Daolai, lord of the Silver-Pit grotto. Brother-in-law to Meng Huo, he came to his aid against Shu. He was taken alive.',
  },
  'dongtu-na': {
    zh: '建寧三洞元帥之一,先助孟獲拒蜀,被擒釋之,後與孟獲反目,為其所殺。',
    en: 'One of the three commanders of the Jianning grottoes. He first helped Meng Huo against Shu and was caught and freed; later he fell out with Meng Huo and was killed by him.',
  },
  'ahui-nan': {
    zh: '建寧元帥,孟獲部將。為馬岱所敗,降蜀。',
    en: 'A Jianning commander, captain under Meng Huo. He was broken by Ma Dai and surrendered to Shu.',
  },
  'zhurong': {
    era: { zh: '祝融夫人', en: 'Lady Zhurong' },
    zh: '南蠻王孟獲之妻,自稱祝融氏後裔。善飛刀,百發百中。生擒蜀將張嶷、馬忠,與孟獲偕被諸葛亮七擒七縱。終隨夫歸附蜀漢。',
    en: 'Wife of Meng Huo, claiming descent from the fire-god Zhurong. Mistress of the flying knife — never a missed mark. She took the Shu generals Zhang Ni and Ma Zhong alive. With her husband she was caught and freed by Zhuge Liang seven times and seven times again. In the end she submitted to Shu at her husband\'s side.',
  },
  'xi-zhicai': {
    zh: '潁川人,曹操早年第一謀士。荀彧薦之,操甚禮之,參謀軍機。建安初病卒,曹操痛失股肱,書與荀彧曰:「自志才亡後,莫可與計事者。」 後荀彧復薦郭嘉。',
    en: 'Of Yingchuan, Cao Cao\'s first chief counselor in his early years. Xun Yu recommended him; Cao Cao took him in great honor and shared the secrets of war. He died of illness early in the Jian\'an reign. Cao Cao, robbed of a right arm, wrote to Xun Yu: "Since Zhicai is gone, there is no one with whom I can plan." Soon after, Xun Yu recommended Guo Jia.',
  },
  'sima-hui': {
    era: { zh: '水鏡先生', en: 'Master Water-Mirror' },
    zh: '潁川陽翟人,字德操,世稱水鏡先生。隱於襄陽,不仕亂世,品評人物無虛。劉備走馬薦諸葛,水鏡語之:「臥龍鳳雛,得一可安天下。」 一語定三分。',
    en: 'Of Yangzhai in Yingchuan, style name Decao, known to the world as Master Water-Mirror. He hid himself at Xiangyang, refusing office in a broken age, his judgments of men never wrong. When Liu Bei rode in search of talent, Water-Mirror told him: "The Sleeping Dragon and the Young Phoenix — gain but one of them, and the realm shall be at peace." One sentence settled the threefold split.',
  },
  'cui-zhouping': {
    zh: '博陵人,崔烈之子,諸葛亮少年至交。隱於荊州,不仕。劉備三顧之中,先遇崔州平於郊野,聞其論古今治亂,知南陽果有高士。',
    en: 'Of Boling, son of Cui Lie and a friend of Zhuge Liang\'s youth. He lived in seclusion at Jingzhou and would not serve. On Liu Bei\'s three visits, he first met Cui Zhouping out on the road; hearing him discourse on the rise and fall of past ages, Liu Bei knew that Nanyang held men of real stature.',
  },
  'pang-degong': {
    zh: '襄陽人,龐統之叔父,司馬徽、諸葛亮皆敬之為師。隱於峴山之南,躬耕讀書。號諸葛亮為「臥龍」,龐統為「鳳雛」,司馬徽為「水鏡」,後世名士之名皆出此老。',
    en: 'Of Xiangyang, uncle of Pang Tong; both Sima Hui and Zhuge Liang revered him as teacher. He hid himself south of Mount Xian, tilling and reading. It was he who named Zhuge Liang "Sleeping Dragon," Pang Tong "Young Phoenix," and Sima Hui "Water-Mirror" — the great names of the age all came from this old man.',
  },
  'zhou-buyi': {
    zh: '南陽人,劉先之外甥。少有奇才,曹操稱「神童」。與曹沖友善,沖卒,操恐其智不可制,密遣人刺殺之,年僅十七。曹丕為之請命不得。',
    en: 'Of Nanyang, nephew of Liu Xian. A prodigy from childhood; Cao Cao called him a "divine child." He was the friend of Cao Chong. When Chong died, Cao Cao, fearing that no one could ever rein in such an intellect, sent men in secret to kill him — at seventeen. Cao Pi pleaded for his life and was refused.',
  },
  'gao-tang-long': {
    zh: '字升平,泰山平陽人。明帝時諫官,直言極諫,屢諍宮室之奢、籍田之廢。每有災異,必上書言天人感應。卒,明帝痛悼,贈關內侯。',
    en: 'Style name Shengping, of Pingyang in Taishan. A remonstrator under Emperor Ming, he spoke without fear, repeatedly opposing the lavishness of the palaces and the lapse of the imperial plowing. At each natural omen he submitted memorials on the response between heaven and man. At his death the emperor mourned and granted him the rank of Marquis within the Pass.',
  },
  'lu-ji': {
    era: { zh: '太康文宗', en: 'Master of Letters of Taikang' },
    zh: '字士衡,吳郡華亭人,陸遜之孫,陸抗之子。吳亡後與弟陸雲入洛,文名滿天下,世稱「二陸入洛,三張(張載、張協、張亢)減價」。作《文賦》,為中國文論之宗。後從成都王穎,八王之亂兵敗,讒於孟玖,被殺,臨刑歎:「華亭鶴唳,可復聞乎!」',
    en: 'Style name Shiheng, of Huating in Wu, grandson of Lu Xun and son of Lu Kang. After the fall of Wu he came with his brother Lu Yun to Luoyang, where their fame filled the realm — "the Two Lu came to the capital and the three Zhangs lost half their price." His Rhapsody on Literature is the foundation of Chinese literary criticism. Later, serving Prince Ying of Chengdu, he was beaten in the War of Eight Princes; slandered by Meng Jiu, he was put to death. At the block he sighed: "The cry of the cranes at Huating — shall I ever hear it again?"',
  },
  'gongsun-zan': {
    era: { zh: '白馬將軍', en: 'The White Horse General' },
    zh: '字伯珪,遼西令支人。少美姿貌,聲如洪鐘。鎮幽州,以白馬義從聞名,胡人畏之,語不敢南顧。後與袁紹相爭於河北,易京一戰,築樓百重以自固。袁紹圍數年,糧盡力竭,妻子俱被殺,自焚於樓上。',
    en: 'Style name Bogui, of Lingzhi in Liaoxi. In youth handsome, his voice like a bronze bell. Garrisoned in You province, he was famed for his White Horse Volunteers; the Hu tribes feared him and would not look south. Later he fought Yuan Shao for the north. At Yijing he built a hundred terraces to hold him fast. Yuan Shao laid siege for years; grain and men failed, his wife and children were killed, and he set fire to the tower upon himself.',
  },
  'gongsun-du': {
    zh: '字升濟,遼東襄平人。漢末為遼東太守,東伐高句麗,西擊烏丸,南取山東之地,自立為遼東侯。割據海東四十年,傳子康，淵,終為司馬懿所滅。',
    en: 'Style name Shengji, of Xiangping in Liaodong. In the closing years of Han he served as governor of Liaodong; he marched east against Goguryeo, west against the Wuhuan, took land south of the Shandong sea, and made himself Marquis of Liaodong. For forty years his house held the eastern seaboard apart from the realm, passed to his son Kang and grandson Yuan — at last destroyed by Sima Yi.',
  },
  'kebi-neng': {
    zh: '鮮卑大人。漢末興起於塞外,合諸部為一,擁眾十餘萬,屢犯邊塞。曹魏屢征不能克。終為幽州刺史王雄遣刺客所殺,鮮卑復散。',
    en: 'Great Chief of the Xianbei. In the closing years of Han he rose beyond the wall, gathered many tribes into one, mustered a hundred thousand, and raided the border again and again. Wei marched out many times without success. In the end Wang Xiong, governor of You province, sent an assassin to kill him, and the Xianbei dispersed once more.',
  },
  'budugen': {
    zh: '鮮卑小帥。中部鮮卑首領,軻比能興起前曾與相爭,後合而又離。屢通使於魏,封王,終為軻比能所殺。',
    en: 'A lesser Xianbei chief who led the central tribes; before Kebi Neng\'s rise he fought him, then joined and parted again. He sent envoys often to Wei and was made a king. In the end Kebi Neng killed him.',
  },
  'beigong-boyu': {
    zh: '羌人。中平元年起兵涼州,殺護羌校尉冷徵,推韓遂、邊章為主,擾關隴十餘年,為漢末涼州之亂之始。',
    en: 'A Qiang chieftain. In 184 he raised troops in Liang province, killed the Colonel-Protector of the Qiang Leng Zheng, and put Han Sui and Bian Zhang at his head; the Guan-Long region was thrown into turmoil for more than a decade — the beginning of the Liang revolt in the closing years of Han.',
  },
  'ma-yuanyi': {
    zh: '冀州黃巾大方渠帥。預謀內應洛陽,事洩,為馬日磾所誅,黃巾起義因之提前。',
    en: 'Great commander of one of the Yellow Turban "fang" hosts in Jizhou. He plotted to rise as an inner agent at Luoyang; the plot was uncovered, and Ma Ridi put him to death — which forced the Yellow Turban uprising to break out earlier than planned.',
  },
  'cheng-yuanzhi': {
    zh: '黃巾賊將。中平元年攻幽州涿郡,首遇劉、關、張三人桃園結義後初出茅廬之軍,為張飛所斬。',
    en: 'A Yellow Turban captain. In 184 he attacked Zhuojun in You province and was the first foe of Liu Bei, Guan Yu, and Zhang Fei after the Peach Garden Oath — Zhang Fei cut him down.',
  },
  'zhang-shiping': {
    zh: '中山販馬大商人。資助劉備起兵,贈以良馬五十匹，金銀五百兩、鑌鐵一千斤,劉備得以鍛雙股劍,招募鄉勇。',
    en: 'A great horse-trader of Zhongshan. He gave Liu Bei his beginning — fifty good horses, five hundred taels of gold and silver, a thousand jin of fine iron — with which Liu Bei forged his twin swords and gathered the lads of his village.',
  },
  'liu-cong': {
    zh: '荊州牧劉表幼子。表卒,蔡氏矯命立之為主。曹操南下,蔡瑁、蒯越力主降,琮從之,以荊州九郡降曹。後操遷之為青州刺史,途中為于禁所殺。',
    en: 'Younger son of Liu Biao, Inspector of Jingzhou. When his father died, Lady Cai forged the will to set him up. As Cao Cao came south, Cai Mao and Kuai Yue pressed surrender; Liu Cong yielded, giving Cao Cao the nine commanderies of Jingzhou. Cao Cao moved him to Inspector of Qingzhou; on the road Yu Jin killed him.',
  },
  'liu-hong-em': {
    era: { zh: '漢靈帝', en: 'Emperor Ling of Han' },
    zh: '名劉宏,東漢第十二代皇帝。少時為解瀆亭侯,延熹年入承大統。在位二十一年,任用宦官十常侍,賣官鬻爵,徵收西園錢,致天下沸騰。中平元年黃巾大起,漢室自此一蹶不振。中平六年崩,年三十四。',
    en: 'Personal name Liu Hong, twelfth emperor of the Eastern Han. As a boy he was Marquis of Jiedu Pavilion; he was raised to the throne in the Yanxi years. Twenty-one years he reigned, listening to the Ten Attendants — eunuchs — selling office and rank, levying the Western Park monies, until the realm boiled over. In 184 the Yellow Turbans rose, and Han never recovered. He died in 189, thirty-four years old.',
  },
  'wu-pu': {
    zh: '廣陵人,華佗弟子。傳五禽戲之養生術,年九十餘耳目聰明,齒牙完堅。',
    en: 'Of Guangling, disciple of Hua Tuo. He carried on the Five Animal Exercises of long life; at over ninety his eyes and ears were clear and his teeth still whole.',
  },
  'zhang-yu': {
    zh: '蜀郡人。善風角占候,劉備入蜀重之。後因進讒言謂劉備:「明年歲在庚子,有大喪。」 劉備惡之,殺之,並燒其著《太玄》。後諸葛亮悔之,曰:「裕之死,亮之罪也。」',
    en: 'Of Shujun. A master of the divination of the winds and stars, much honored by Liu Bei in Shu. Later, daring to whisper: "Next year, when Geng-zi comes round, there shall be a great mourning," he was killed by Liu Bei, who also burned his Taixuan writings. Zhuge Liang afterwards regretted it: "Yu\'s death was Liang\'s fault."',
  },
  'cao-anmin': {
    zh: '曹操之姪。從操征張繡,宛城之變中,獻馬於操使脫險,自死於亂兵。',
    en: 'Nephew of Cao Cao. He marched with him against Zhang Xiu. In the Wancheng mutiny he gave his own horse to Cao Cao for escape and died in the chaos of weapons.',
  },
  'cao-de': {
    zh: '曹操之弟,字德祖。徐州之難,隨父曹嵩避禍,為陶謙所遣張闓所殺,曹操由此屠徐州。',
    en: 'Younger brother of Cao Cao, style name Dezu. In the Xuzhou disaster he fled with their father Cao Song; Zhang Kai, sent by Tao Qian, killed him — and Cao Cao, in fury, put Xuzhou to the sword.',
  },
  'fu-shi-ren': {
    zh: '蜀漢將。守公安,與糜芳同。呂蒙白衣渡江,二人不戰而降。關羽腹背受敵,荊州盡失。後劉備伐吳,士仁懼罪,殺糜芳投先主而被斬。',
    en: 'A Shu officer who held Gong\'an together with Mi Fang. When Lü Meng made his white-robed crossing, both yielded without a blow; Guan Yu was caught front and back and Jingzhou was lost. Later, in Liu Bei\'s campaign against Wu, Shi Ren in fear killed Mi Fang and offered his head to the founding emperor — and was himself beheaded for it.',
  },
  'wang-zifu': {
    zh: '漢室忠臣。建安五年,與董承、種輯等受獻帝衣帶詔,謀誅曹操。事敗,夷三族。',
    en: 'A loyal minister of Han. In 200, with Dong Cheng and Zhong Ji, he received the secret edict in the silk sash from Emperor Xian and laid the plot against Cao Cao. The plot was uncovered; three branches of his clan were exterminated.',
  },
  'hu-ban': {
    zh: '荊州人,胡華之子。關羽過五關時,胡華以家書托之,班遇關羽於滎陽,夜半放羽出城,以全父友之交。',
    en: 'Of Jingzhou, son of Hu Hua. When Guan Yu crossed the five passes, Hu Hua had entrusted him with a family letter; Hu Ban met him at Xingyang and at midnight let him out of the city, honoring his father\'s friendship.',
  },
  'yan-baihu': {
    zh: '吳郡賊帥,自號東吳德王。據吳會數縣,孫策渡江,屢被破擊,終被殺。',
    en: 'A bandit chief of Wu commandery who styled himself "Virtuous King of the East Wu." He held several counties; when Sun Ce crossed the river he was broken again and again, and at last killed.',
  },
  'yan-yu': {
    zh: '嚴白虎之弟。從兄拒孫策,被孫策一矛刺殺。',
    en: 'Younger brother of Yan Baihu. He fought with his elder against Sun Ce and was killed by Sun Ce\'s spear in a single thrust.',
  },
  'sun-jing': {
    zh: '字幼台,孫堅之弟。從堅、策征戰江東。獻計策破王朗,大破會稽,功著吳國。後辭官歸隱富春。',
    en: 'Style name Youtai, younger brother of Sun Jian. He campaigned in Jiangdong with Sun Jian and Sun Ce, advised the strategy that broke Wang Lang, and shattered Kuaiji — great merit for the house of Wu. In old age he resigned office and retired to Fuchun.',
  },
  'sun-jiao': {
    zh: '字叔朗,孫堅弟孫靜之子,孫權堂兄。隨呂蒙襲荊州,有功。性豪健,飲酒擊劍,自比甘寧。',
    en: 'Style name Shulang, son of Sun Jing and cousin of Sun Quan. He took part with Lü Meng in the seizure of Jingzhou and won credit. Bold and strong, he loved wine and the sword; he compared himself to Gan Ning.',
  },
  'sun-lu': {
    zh: '孫權第三子。為建昌侯,早卒,年二十。',
    en: 'Third son of Sun Quan. Made Marquis of Jianchang, he died young at twenty.',
  },
  'sun-ba': {
    zh: '孫權第四子,封魯王。與太子和爭嫡,搆訌經年,號「二宮之爭」,東吳元氣大傷。權怒,賜霸死。',
    en: 'Fourth son of Sun Quan, Prince of Lu. He contested the heirship with the crown prince Sun He; their wrangling — the "Strife of the Two Palaces" — lasted years and drained the strength of Wu. Sun Quan in his rage ordered him to die.',
  },
  'sun-fen': {
    zh: '孫權第五子,封齊王。性兇暴,多殺戮。後孫綝廢之為庶人,卒被誅。',
    en: 'Fifth son of Sun Quan, Prince of Qi. Cruel and bloody. Sun Chen later reduced him to commoner and at last had him killed.',
  },
  // ─── 三國新增列傳 第二批 (Three Kingdoms — batch 2) ───
  'zhou-tai': {
    era: { zh: '東吳虎臣', en: 'Tiger Officer of Wu' },
    zh: '字幼平,九江下蔡人。少與蔣欽從孫策,有膽烈,屢從征戰。宣城之難,山賊驟至,孫權年少未及應變,周泰以身翼蔽,被創數十,血流污衣,幾死乃蘇。孫權後親數其瘡,一一賜爵,飲至酒酣,撫其背曰:「幼平,卿為孤兄弟戰如熊虎,不惜性命,被創數十,膚如刻畫,孤亦何心不待卿以骨肉之恩!」 後鎮濡須口,以禦魏軍。',
    en: 'Style name Youping, of Xiacai in Jiujiang. He followed Sun Ce from youth with Jiang Qin and went into many battles. In the Xuancheng disaster, when mountain bandits burst in upon young Sun Quan unprepared, Zhou Tai covered him with his own body, took dozens of cuts, and lay bleeding to near-death before reviving. Sun Quan, after, counted each scar one by one and matched each with a fief; deep in his cups he stroked Zhou Tai\'s back: "Youping, for me and my brothers you fought like bear and tiger, careless of your life — dozens of wounds carved into your skin. How could I treat you with anything less than the love between blood kin?" In later years he held Ruxukou against the Wei.',
  },
  'zhou-cang': {
    zh: '關西人,演義人物。原為黃巾餘黨,後遇關羽於臥牛山,棄賊歸之。隨關羽過五關，水淹七軍,生擒龐德。關羽敗走麥城,周倉守城,聞關羽父子被害,自刎以殉。',
    en: 'A man of Guanxi (chiefly a Romance figure). Once a leftover Yellow Turban, he met Guan Yu at Mount Sleeping-Ox and threw away his banditry to follow him. He went with Guan Yu through the five passes, joined the flooding of the seven armies, and took Pang De alive. When Guan Yu was driven into Maicheng, Zhou Cang held the wall; hearing that father and son were both dead, he cut his own throat to follow his lord.',
  },
  'zhou-fang': {
    zh: '字子魚,吳郡陽羡人。性沉密。黃武七年,自稱與曹休有隙,密遣親信七表詐降,引曹休深入。陸遜於石亭大破之,焚輜重逾萬,曹休羞憤而卒。事後孫權贈金千斤。',
    en: 'Style name Ziyu, of Yangxian in Wujun. Deep and close in temper. In 228, claiming to be at odds with Cao Xiu, he sent seven secret memorials feigning surrender and drew Cao Xiu deep into his trap. Lu Xun shattered the Wei host at Shiting, burned over ten thousand wagonloads of stores, and Cao Xiu died of shame and rage soon after. Sun Quan rewarded him a thousand jin of gold.',
  },
  'zhou-chu': {
    era: { zh: '改過自新', en: 'Reformed Man' },
    zh: '字子隱,義興陽羡人,周魴之子。少時凶橫,鄉里以南山虎、長橋蛟、周處並稱三害。後悟,獨殺虎斬蛟,折節讀書,訪陸機，陸雲於洛陽,終為晉名將。元康七年隨夏侯駿征齊萬年,孤軍力戰而死,贈平西將軍。',
    en: 'Style name Ziyin, of Yangxian in Yixing, son of Zhou Fang. In his wild youth the countryside named "Three Evils": the tiger of the southern hills, the dragon of the long bridge, and Zhou Chu. He awakened, slew the tiger and dragon with his own hand, bent his neck to study, sought out Lu Ji and Lu Yun at Luoyang, and rose to be a famed general of Jin. In 297 he campaigned with Xiahou Jun against Qi Wannian; left alone he fought to the death, and was raised posthumously to General Who Pacifies the West.',
  },
  'zhu-zhi': {
    zh: '字君理,丹陽故鄣人。隨孫堅起義,征討黃巾，董卓,堅死,從孫策渡江平定吳會。孫權繼立,任吳郡太守二十餘年,撫綏百姓,深得民心。卒年六十九,孫權親臨弔哭。',
    en: 'Style name Junli, of Guzhang in Danyang. He rose with Sun Jian in the early days, campaigning against the Yellow Turbans and Dong Zhuo; after Sun Jian\'s death he crossed the river with Sun Ce to settle Wu. Under Sun Quan he served twenty years as Governor of Wujun, gentle to the people and dear to them. He died at sixty-nine; Sun Quan came in person to mourn.',
  },
  'zhu-ran': {
    zh: '字義封,丹陽故鄣人,朱治之養子。從孫權四十年,沉勇有謀。江陵之役,以五千人拒夏侯尚數萬,固守半年,卒解圍。位至左大司馬，右軍師。卒年六十八,孫權為素服親臨。',
    en: 'Style name Yifeng, of Guzhang in Danyang, adopted son of Zhu Zhi. For forty years he served Sun Quan, deep and bold. At Jiangling he held off Xiahou Shang\'s tens of thousands with five thousand men, kept the city for half a year, and at last broke the siege. He rose to Left Marshal and Right Military Strategist. He died at sixty-eight; Sun Quan put on plain white and came in person to mourn.',
  },
  'zhu-huan': {
    zh: '字休穆,吳郡吳人。性烈剛強。鎮濡須,大破曹仁五萬之眾,陣斬常雕,生擒王雙,聲威大震。後與全琮分屯諸要,以禦魏軍。年六十二卒。',
    en: 'Style name Xiumu, of Wu county in Wujun. Fierce and unyielding in temper. Garrisoning Ruxu, he broke fifty thousand of Cao Ren\'s host, killed Chang Diao in the line, and took Wang Shuang alive — his fame shook the realm. Later, with Quan Cong, he held the key posts against Wei. He died at sixty-two.',
  },
  'zhu-ju': {
    zh: '字子範,吳郡吳人。儀容雄偉,有姿貌。孫權嫁孫魯育為其妻。位至驃騎將軍。二宮之爭中,扶太子和不疑,為孫弘所譖,賜死。',
    en: 'Style name Zifan, of Wu county in Wujun. Of majestic appearance and handsome bearing. Sun Quan gave him Princess Sun Luyu in marriage. He rose to General of Agile Cavalry. In the Strife of the Two Palaces he stood by the crown prince Sun He; Sun Hong\'s slander brought him a draught of death.',
  },
  'zhu-ji-wu': {
    zh: '字公緒,朱然之子。承父業,鎮樂鄉,屢禦魏軍。建興初為左大司馬,衛守國門。',
    en: 'Style name Gongxu, son of Zhu Ran. He carried on his father\'s line, garrisoned Lexiang, and held back Wei in many encounters. In the Jianxing reign he became Left Marshal, guardian of the gates of state.',
  },
  'zhu-yi-wu': {
    zh: '字季文,朱桓之子。少有勇略。從孫綝攻魏圍壽春,孫綝以無功歸罪於異,斬之於軍,世以為冤。',
    en: 'Style name Jiwen, son of Zhu Huan. Of bold spirit from youth. With Sun Chen he marched on Wei and laid siege to Shouchun; when nothing was gained, Sun Chen pinned the blame on him and had him beheaded in the camp — the world long called it an injustice.',
  },
  'zhu-ling': {
    zh: '字文博,清河鄃人。原袁紹將,後歸曹操,號其勇略不下徐晃。從征荊州、鄴城、馬超諸役,皆有戰功,封高唐侯。',
    en: 'Style name Wenbo, of Qingluo in Qinghe. Originally a general of Yuan Shao, he went over to Cao Cao and was reckoned no less in bold counsel than Xu Huang. He joined the campaigns of Jingzhou, Ye, and against Ma Chao, and was made Marquis of Gaotang.',
  },
  'zhu-jun': {
    zh: '字公偉,會稽上虞人。漢末名將,與皇甫嵩、盧植並稱三將。中平元年破黃巾於潁川、宛城,擊穎川張角弟。後抗李傕、郭汜,卒於朝。',
    en: 'Style name Gongwei, of Shangyu in Kuaiji. A famed general of late Han, set alongside Huangfu Song and Lu Zhi as the Three Generals. In 184 he broke the Yellow Turbans at Yingchuan and Wancheng, and crushed the brothers of Zhang Jiao. Later he stood against Li Jue and Guo Si, and died in office.',
  },
  'zhao-tong': {
    zh: '趙雲長子。承父爵,虎賁中郎督。隨諸葛瞻於綿竹之戰,父子皆死。',
    en: 'Eldest son of Zhao Yun. He inherited his father\'s fief as Director of Tiger-Knights. He fell at Mianzhu with Zhuge Zhan, father and son both dead in the same hour.',
  },
  'zhao-guang': {
    zh: '趙雲次子。從姜維北伐,沓中之戰戰死。蜀漢忠烈之家,父子三人為國而亡。',
    en: 'Second son of Zhao Yun. He marched with Jiang Wei on the northern campaign and died fighting at Tazhong. The house of Zhao Yun was loyal to the marrow — father and two sons all gave their lives for the state.',
  },
  'zhao-yan': {
    zh: '字伯然,潁川陽翟人。曹操幕士,與荀彧為同郡。歷任都督護軍、都督五軍護軍,奉法持重,曹丕、曹叡皆信任之。',
    en: 'Style name Boran, of Yangzhai in Yingchuan, a counselor of Cao Cao and fellow of Xun Yu. He served as Defender-Inspector of various armies, upright and weighty in conduct, and was trusted by both Cao Pi and Cao Rui.',
  },
  'zhao-zi': {
    zh: '字德度,南陽人。孫權使魏,與曹丕談,辭氣不屈。丕問:「吳如大夫者幾人?」 答曰:「聰明特達者八九十人,如臣之比,車載斗量,不可勝數。」 名動洛陽。',
    en: 'Style name Dedu, of Nanyang. Sent by Sun Quan as envoy to Wei, he met Cao Pi without bending in word or air. Cao Pi asked: "How many gentlemen like yourself has Wu?" He answered: "Of the truly luminous, eighty or ninety; of the like of your servant, you might load them on wagons or count them by the dou — they cannot be told." His fame shook Luoyang.',
  },
  'zheng-xuan': {
    era: { zh: '經學大師', en: 'Master of the Classics' },
    zh: '字康成,北海高密人。漢末經學集大成者,遍注五經,門徒數千,號鄭學。袁紹、孔融皆敬重之。袁紹與曹操相持官渡,徵之軍中,病卒於元城,年七十四。曹操親遣使弔之。',
    en: 'Style name Kangcheng, of Gaomi in Beihai. The great gatherer of late-Han classical learning — he annotated all Five Classics, gathered thousands of disciples, and his teaching was called the "Zheng school." Yuan Shao and Kong Rong both held him in awe. When Yuan Shao called him to the camp at the standoff of Guandu, he died of illness at Yuancheng at seventy-four. Cao Cao sent a personal envoy of condolence.',
  },
  'zhao-qi': {
    zh: '字邠卿,京兆長陵人。漢末耆儒,著《孟子章句》,為孟子注疏之祖。曾遊歷山東諸郡,袁紹、劉表皆禮之。卒年九十三。',
    en: 'Style name Binqing, of Changling in the metropolitan region. An aged scholar of late Han who wrote Sentences and Paragraphs of Mencius, the founding commentary on that classic. He travelled the eastern commanderies; Yuan Shao and Liu Biao both received him with great courtesy. He died at ninety-three.',
  },
  'zhang-zhongjing': {
    era: { zh: '醫聖', en: 'Sage of Medicine' },
    zh: '名機,字仲景,南陽人。建安年間任長沙太守。值傷寒流行,宗族死者三分有二,乃發憤著《傷寒雜病論》,確立辨證論治之法,後世奉為醫聖,與華佗並稱。其書經晉王叔和整理,分為《傷寒論》、《金匱要略》二書,千古不刊。',
    en: 'Personal name Ji, style name Zhongjing, of Nanyang. In the Jian\'an years he served as Governor of Changsha. When the cold-damage epidemics raged and two-thirds of his clan died, he set himself with grief to write the Treatise on Cold Damage and Miscellaneous Diseases, founding the method of differentiated syndromes that all later Chinese medicine has followed. Later ages set him beside Hua Tuo as a Sage of Medicine. Wang Shuhe of Jin sorted his work into the Treatise on Cold Damage and the Synopsis of the Golden Cabinet — books that have never gone out of use.',
  },
  'zhongli-mu': {
    zh: '字子幹,會稽山陰人,鍾離意之後。少有令名。任武陵太守,鎮蠻夷,以恩威並用,郡安五年。後為司隸校尉,直道不撓。',
    en: 'Style name Zigan, of Shanyin in Kuaiji, descendant of Zhongli Yi. From youth a name of high repute. As Governor of Wuling he tamed the southern tribes through balanced grace and severity, and the commandery was at peace for five years. Later as Inspector of the Capital Region he held to the straight path without bending.',
  },
  'xianyu-fu': {
    zh: '漁陽人。劉虞舊部。公孫瓚殺劉虞,鮮于輔聯合烏桓首領樓班、蘇仆延起兵,大破公孫瓚於鮑丘,瓚自此衰敗。後歸曹操,封都亭侯。',
    en: 'Of Yuyang, an old captain of Liu Yu. When Gongsun Zan killed Liu Yu, Xianyu Fu joined the Wuhuan chiefs Louban and Supuyan in revolt, broke Gongsun Zan at Baoqiu, and from there Gongsun Zan declined. He later went over to Cao Cao and was made Marquis of Duting.',
  },
  'xianyu-yin': {
    zh: '漁陽人,鮮于輔之弟。同兄起兵討公孫瓚,功著河北。',
    en: 'Of Yuyang, younger brother of Xianyu Fu. He rose with his brother against Gongsun Zan and earned merit in the north.',
  },
  'supuyan': {
    zh: '烏桓大人。漢末右北平烏桓首領之一。建安十年隨蹋頓南下助袁尚,曹操北征,被斬於白狼山。',
    en: 'A Great Chief of the Wuhuan. In the closing years of Han, one of the leaders of the You-Beiping Wuhuan. In 205 he marched south with Taduan to aid Yuan Shang; when Cao Cao crossed the wall, he was cut down at White Wolf Mountain.',
  },
  'wuhuan-tuli': {
    era: { zh: '蹋頓', en: 'Taduan' },
    zh: '烏桓大人,丘力居之姪。袁紹倚為強援,屢通婚姻。建安十二年曹操親征烏桓,張遼陣斬蹋頓於白狼山,烏桓自此衰落,漢末邊患告平。',
    en: 'A Great Chief of the Wuhuan, nephew of Qiuliju. Yuan Shao made him an ally by marriage. In 207 Cao Cao came north in person; at White Wolf Mountain Zhang Liao cut down Taduan in the battle line. From this day the Wuhuan declined and the border-trouble of late Han was ended.',
  },
  'sima-wang': {
    era: { zh: '義陽成王', en: 'Prince Cheng of Yiyang' },
    zh: '字子初,司馬孚之子,司馬懿之姪。歷任鎮西大將軍,鎮關中數年,蜀軍不敢輕犯。性嚴正,治軍有度,武帝即位封義陽王,壽六十六。',
    en: 'Style name Zichu, son of Sima Fu and nephew of Sima Yi. He served as Grand General Who Garrisons the West and held Guanzhong for years; the Shu army would not lightly cross. Stern and upright, ordered in command. Under Emperor Wu he was made Prince of Yiyang. He lived to sixty-six.',
  },
  'sima-tai': {
    zh: '字子舒,司馬懿之姪。歷任侍中、尚書令。八王之亂中持重,士林敬之。',
    en: 'Style name Zishu, nephew of Sima Yi. He served as Palace Attendant and Director of the Imperial Secretariat. In the War of Eight Princes he kept his footing, and the gentry held him in honor.',
  },
  'sima-quan': {
    zh: '司馬懿之姪。歷任安東將軍,鎮東南。八王之亂前卒。',
    en: 'Nephew of Sima Yi. He served as General Who Pacifies the East and held the southeast. He died before the War of Eight Princes broke out.',
  },
  'xiahou-zhan': {
    era: { zh: '太康文人', en: 'Master of the Taikang Era' },
    zh: '字孝若,夏侯惇曾孫。容貌甚偉,與潘岳齊名,世稱「連璧」。文辭優美,武帝雅愛之。著《新論》十卷。',
    en: 'Style name Xiaoruo, great-grandson of Xiahou Dun. Of striking appearance, set beside Pan Yue as the "Linked Jades" of the age. His prose was elegant; Emperor Wu doted on him. He wrote the New Discourses in ten fascicles.',
  },
  'xiahou-wei': {
    zh: '字季權,夏侯淵第四子。歷任荊州、兗州刺史。性闊達,以鎮邊稱。',
    en: 'Style name Jiquan, fourth son of Xiahou Yuan. He served as Inspector of Jingzhou and Yanzhou. Broad and easy in temper, known for his border governorships.',
  },
  'xiahou-cheng': {
    zh: '字叔權,夏侯淵第三子。少有名譽,曹操使從征,屢有戰功。早卒。',
    en: 'Style name Shuquan, third son of Xiahou Yuan. From youth of high repute; Cao Cao took him on campaign and he earned merit many times. He died young.',
  },
  'xiahou-rong': {
    zh: '字幼權,夏侯淵第五子。年七歲能屬文,稱神童。早卒。',
    en: 'Style name Youquan, fifth son of Xiahou Yuan. At seven he could compose prose and was called a divine child. He died young.',
  },
  'xiahou-he': {
    zh: '字義權,夏侯淵第七子。歷任河南尹、太常。明哲保身,八王之亂中以居中持重,士林安之。',
    en: 'Style name Yiquan, seventh son of Xiahou Yuan. He served as Intendant of Henan and Minister of Ceremonies. Wise to keep himself whole, in the War of Eight Princes he held a central, weighty stance and the gentry rested with him.',
  },
  'xiahou-de': {
    zh: '夏侯淵族姪。鎮守定軍山,黃忠來攻,德率眾守山,為黃忠所斬。',
    en: 'A clansman-nephew of Xiahou Yuan. He held Mount Dingjun. When Huang Zhong came up, he led his men to defend the slope and was cut down by Huang Zhong\'s blade.',
  },
  'xiahou-en': {
    zh: '曹操之背劍將。長坂之戰,身負曹操所佩青釭寶劍,為趙雲所斬,劍遂入趙雲之手。',
    en: 'Cao Cao\'s sword-bearer. At Changban he carried the famed Qinggang sword at his back; Zhao Yun cut him down, and the sword passed into Zhao Yun\'s hand.',
  },
  'chen-shi': {
    zh: '蜀漢將。隨諸葛亮北伐,出箕谷攻陳倉。為魏將郭淮所敗,免官。後復用,定軍中。',
    en: 'A Shu general. He marched with Zhuge Liang on the northern campaigns, going out by Ji Valley to attack Chencang. Broken by the Wei general Guo Huai, he was stripped of rank; later restored, he steadied the army.',
  },
  'han-de': {
    zh: '羌人,曹魏將,演義人物。鎮關中,與其四子韓瑛、韓瓊、韓琪、韓琪共拒蜀漢北伐。鳳鳴山一戰,趙雲老當益壯,連斬其四子,韓德亦戰死。',
    en: 'A Qiang man, a Wei general (chiefly Romance). He guarded Guanzhong with his four sons Han Ying, Han Qiong, Han Qi, and Han Qi the younger, holding off the Shu northern campaign. At Fengming Mountain Zhao Yun — old but the stronger for it — cut down all four sons, and Han De himself fell in the fight.',
  },
  'gongsun-yue': {
    zh: '公孫瓚從弟。袁紹爭冀州時,瓚遣越助袁術攻孫堅,中流矢而死。瓚以此恨袁紹,北方大戰由此而起。',
    en: 'Cousin of Gongsun Zan. When Yuan Shao contested Jizhou, Gongsun Zan sent Gongsun Yue to help Yuan Shu against Sun Jian; he was struck by a stray arrow and killed. Gongsun Zan made this his grudge against Yuan Shao, and the great war of the north began from it.',
  },
  'gongsun-gong': {
    zh: '字伯陽,公孫度之子。襲遼東。後為兄子公孫淵所篡,被囚。司馬懿平淵之亂,釋之。',
    en: 'Style name Boyang, son of Gongsun Du. He inherited Liaodong. Usurped by his nephew Gongsun Yuan, he was imprisoned. When Sima Yi crushed Yuan\'s revolt, Gongsun Gong was set free.',
  },
  'zhang-ji': {
    zh: '武威祖厲人,張繡之叔。董卓部將,後與李傕、郭汜共專朝政。建安元年攻穰城,中流矢而死,張繡領其眾。',
    en: 'Of Zuli in Wuwei, uncle of Zhang Xiu. A captain of Dong Zhuo, he later monopolized the court with Li Jue and Guo Si. In 196 he attacked Rangcheng and was struck by a stray arrow and killed; Zhang Xiu took up his troops.',
  },
  'zhang-baiqi': {
    zh: '黃巾餘黨,自號白騎賊帥。屢為李傕、郭汜部所擾,後降漢室,封騎都尉。',
    en: 'A leftover Yellow Turban who styled himself "White-Rider Chief." Often harried by Li Jue and Guo Si\'s troops, he later submitted to the Han court and was made Commandant of the Cavalry.',
  },
  'huangfu-jia': {
    zh: '皇甫嵩之姪。從叔父平黃巾,有戰功。後出為將,鎮關中。',
    en: 'Nephew of Huangfu Song. He marched with his uncle against the Yellow Turbans and earned merit; later as a general in his own right he held Guanzhong.',
  },
  'huangfu-li': {
    zh: '皇甫嵩從子。少有志節,獻策叔父誅董卓,嵩猶豫不從,後嵩果為卓所辱。漢末卒於朝。',
    en: 'A nephew of Huangfu Song. From youth a man of resolution, he urged his uncle to strike down Dong Zhuo; Huangfu Song hesitated and the chance was lost — and afterwards Dong Zhuo humbled him as predicted. He died at court in the closing years of Han.',
  },
  'lu-shu': {
    zh: '字行思,魯肅之子。為魏將討吳,授武陵太守。性恬靜,善撫蠻夷。',
    en: 'Style name Xingsi, son of Lu Su. Captured and turned to Wei service, he was made Governor of Wuling. Quiet and gentle by nature, he soothed the southern tribes.',
  },
  'zhuge-qiao': {
    zh: '字伯松,諸葛瑾次子,諸葛亮以無子過繼為嗣。少有令名,從亮南征,卒於漢中,年二十五,諸葛亮痛悼。',
    en: 'Style name Bosong, second son of Zhuge Jin. Childless, Zhuge Liang took him as heir. From youth a name of repute, he marched with Zhuge Liang in the southern campaign and died at Hanzhong at twenty-five. Zhuge Liang mourned him bitterly.',
  },
  'zhuge-rong': {
    zh: '諸葛瑾次子,諸葛恪之弟。位至奮威將軍。兄諸葛恪被誅,鬱卒於家。',
    en: 'Second son of Zhuge Jin and younger brother of Zhuge Ke. He rose to General Who Stirs Up Might. When his brother was killed in the purge, he died of grief at home.',
  },
  'bian-bing': {
    zh: '卞夫人之弟。曹操妻舅。歷任諸郡守,以外戚顯貴而未嘗預政,曹操深嘉之。',
    en: 'Younger brother of Lady Bian and brother-in-law to Cao Cao. He governed several commanderies; honored as imperial in-law he kept clear of policy, and Cao Cao prized him for it.',
  },
  'cao-ju': {
    zh: '字伯權,曹操之子。封彭城王。明帝信任,常與議朝政。',
    en: 'Style name Boquan, son of Cao Cao. Made Prince of Pengcheng. Emperor Ming trusted him and often took his counsel on affairs of state.',
  },
  'cao-yan': {
    zh: '曹操之子,早卒,追封廣宗殤公。',
    en: 'A son of Cao Cao who died young; posthumously made the Sorrowful Duke of Guangzong.',
  },
  'cao-gun': {
    zh: '字伯文,曹操之子,封東平靈王。博學能文,著詩賦數十篇。臨終遺令薄葬,曰:「孤生既不能拯國,死何敢厚葬以重民勞!」',
    en: 'Style name Bowen, son of Cao Cao, Prince Ling of Dongping. Broad in learning and a poet, he wrote dozens of pieces. His will commanded thin burial: "In life I could not save the state; how dare I burden the people with a thick funeral in death?"',
  },
  'cao-tai': {
    zh: '曹仁之子。襲父爵,鎮揚州。後從征東吳,有戰功。',
    en: 'Son of Cao Ren. He inherited his father\'s fief and held Yangzhou; later he campaigned against Wu and earned credit.',
  },
  'cao-hui': {
    zh: '曹操之子,封東鄉懷王。早卒,無嗣。',
    en: 'A son of Cao Cao, Prince Huai of Dongxiang. He died young, without heir.',
  },
  'cheng-wu': {
    zh: '程昱之子。從曹操征戰,以勇銳稱。為都督,鎮諸郡。',
    en: 'Son of Cheng Yu. He marched with Cao Cao and was known for boldness, serving as commandant of several commanderies.',
  },
  'cheng-zi': {
    zh: '程普之子。襲父爵,從孫權征戰,鎮陵陽。',
    en: 'Son of Cheng Pu. He inherited his father\'s fief, marched with Sun Quan, and held Lingyang.',
  },
  'sun-lang': {
    zh: '孫堅庶子,孫策、孫權異母弟。從征江東,以箭傷曹休而失軍紀,孫權怒杖之,後鬱憤而卒。',
    en: 'A natural son of Sun Jian, half-brother of Sun Ce and Sun Quan. He marched against Cao Xiu and broke discipline by shooting an arrow at him; Sun Quan in anger had him beaten, and he died not long after, broken in spirit.',
  },
  'zou-jing': {
    zh: '幽州校尉。中平元年隨劉備、關羽、張飛討黃巾賊,陣斬程遠志、鄧茂之眾。後鎮幽州。',
    en: 'A Colonel of You province. In 184 with Liu Bei, Guan Yu, and Zhang Fei he marched against the Yellow Turbans and cut down the host of Cheng Yuanzhi and Deng Mao. Later he held You province.',
  },
  'zou-dan': {
    zh: '幽州都尉。從鄒靖鎮幽州,後戰死於黃巾餘黨之亂。',
    en: 'A Colonel of You province. He served under Zou Jing and died in a clash with the remnants of the Yellow Turbans.',
  },
  'shi-hui': {
    zh: '士燮之子。父死後,孫權遣呂岱奪交州,徽不降,呂岱誘斬之,士氏遂滅。',
    en: 'Son of Shi Xie. When his father died, Sun Quan sent Lü Dai to take Jiao province; Shi Hui would not yield, and Lü Dai had him killed by a trick. The Shi clan was extinguished.',
  },
  'zhi-yu': {
    zh: '字仲洽,京兆長安人。西晉文人,博涉群書,著《文章流別集》,為文學分體之祖。亂中流寓死於洛陽。',
    en: 'Style name Zhongqia, of Chang\'an in the metropolitan region. A literary man of Western Jin, broad in his reading; he wrote the Anthology of Distinct Literary Genres, founding the classification of literary forms. In the chaos he wandered and died at Luoyang.',
  },
  'zhou-xuan': {
    zh: '字孔和,沛國譙人。善卜筮夢占,事曹操、曹丕。明帝召其入宮占夢,所言皆驗,世稱神卜。',
    en: 'Style name Konghe, of Qiao in Pei. A master of divination and dream-reading, he served Cao Cao and Cao Pi. Emperor Ming summoned him to read dreams in the palace and every word came true; the world called him a divine seer.',
  },
  'zhong-yu': {
    zh: '字稚叔,鍾繇之子,鍾會之兄。少有才名,事曹丕、曹叡,以文學見重。性溫雅,不附權貴。',
    en: 'Style name Zhishu, son of Zhong Yao and elder brother of Zhong Hui. From youth a name in letters, he served Cao Pi and Cao Rui and was valued for his writing. Mild and refined, he attached himself to no faction.',
  },
  'zhong-ji': {
    zh: '漢室忠臣。建安五年與董承、王子服等受獻帝衣帶詔,謀誅曹操。事敗,夷三族。',
    en: 'A loyal minister of Han. In 200 with Dong Cheng and Wang Zifu he received the secret sash-edict and plotted against Cao Cao. The plot was uncovered; three branches of his clan were exterminated.',
  },
  'zhang-zun': {
    zh: '張飛之孫,張苞之子。隨諸葛瞻於綿竹之戰,陣亡。蜀漢張家三代皆死於國事。',
    en: 'Grandson of Zhang Fei and son of Zhang Bao. He died at Mianzhu with Zhuge Zhan. Three generations of the Zhang line gave their lives for the state.',
  },
  'zhao-fan': {
    zh: '桂陽太守。趙雲取桂陽,趙範詐降,欲以寡嫂樊氏配雲。雲拒之曰:「相與同姓,卿兄即我兄。」 後範叛走,蜀漢以其虛詐輕之。',
    en: 'Governor of Guiyang. When Zhao Yun took Guiyang, Zhao Fan offered surrender by guile and proposed to marry his widowed sister-in-law Lady Fan to him. Zhao Yun refused: "We share a surname — your brother is my brother." Later Zhao Fan deserted, and Shu thought him false.',
  },
  'zhao-lei': {
    zh: '關羽都督。關羽北伐,趙累督糧。荊州陷後,隨關羽走麥城,陷沮水,被吳將馬忠所擒。',
    en: 'A commandant under Guan Yu. In the northern campaign he was in charge of the grain trains. When Jingzhou fell he followed Guan Yu to Maicheng, was caught at the Ju River, and taken prisoner by the Wu officer Ma Zhong.',
  },
  'zhao-hong-yt': {
    zh: '黃巾賊將,張曼成餘部。盤踞宛城,為朱儁、孫堅所破斬。',
    en: 'A Yellow Turban captain of Zhang Mancheng\'s remnants. He held Wancheng until Zhu Jun and Sun Jian broke it and cut him down.',
  },
  'mulu-da': {
    era: { zh: '木鹿大王', en: 'King Mulu' },
    zh: '南蠻八納洞主木鹿之大號。能呼風喚雨,驅虎豹熊蛇助戰。諸葛亮南征,以巨車載木刻獅虎，火炮驚之,木鹿大王陣亡。',
    en: 'Royal title of King Mulu, lord of the Bana grottoes of the south. He could call wind and rain and drive tigers, leopards, bears, and serpents into battle. In Zhuge Liang\'s southern campaign, a great wagon bearing wooden lions and tigers and gunpowder bombs frightened them off — and King Mulu fell in the line.',
  },
  'dong-tu-na': {
    zh: '南蠻董荼那洞主之另寫。詳見「dongtu-na」。',
    en: 'Alternate spelling for Dongtu Na, lord of a grotto among the southern tribes — see Dongtu Na.',
  },
  'yu-quan': {
    zh: '黃巾餘黨,於毒之另字。據黑山,聚眾十餘萬,擾冀州。為袁紹所破斬。',
    en: 'A leftover Yellow Turban, also written as Yu Du. He held the Black Mountains, gathered a hundred thousand, and harried Jizhou. Yuan Shao broke and beheaded him.',
  },
  'yu-digen': {
    zh: '黑山黃巾餘部。據山中,屢出抄掠。後降曹操。',
    en: 'A remnant of the Black Mountain Yellow Turbans. He held the hills and raided again and again, later submitting to Cao Cao.',
  },
  // ─── 三國新增列傳 第三批 (Three Kingdoms — batch 3) ───
  'zhang-zhao': {
    era: { zh: '東吳碩儒', en: 'Grand Scholar of Wu' },
    zh: '字子布,彭城人。少時博學,與張紘並稱「江東二張」。孫策起兵,延為長史,軍中政事悉付之。孫策臨終以張昭、周瑜為輔,曰:「內事不決問張昭,外事不決問周瑜。」 赤壁之議,主張迎曹,孫權後悔之。一生剛直敢諫,孫權嘗火其門以激之,昭閉門不出而泣。卒年八十一,謚文。',
    en: 'Style name Zibu, of Pengcheng. From youth broadly learned; he stood with Zhang Hong as the "Two Zhangs of Jiangdong." When Sun Ce raised troops, he made him Chief Clerk, and all the government of the camp was handed to him. On his deathbed Sun Ce set Zhang Zhao and Zhou Yu as regents: "For matters at home, ask Zhang Zhao; for matters abroad, ask Zhou Yu." At the council of Red Cliffs he argued for surrender to Cao Cao — Sun Quan regretted it afterwards. His whole life he was upright and dared to remonstrate; Sun Quan once set fire to his gate to draw him out, and Zhang Zhao bolted his door and wept within. He died at eighty-one; his posthumous name was Wen.',
  },
  'zhang-hong': {
    zh: '字子綱,廣陵人。少有名於江淮間。與張昭同事孫策、孫權,並稱二張。出使許都,曹操欲留之,後遣還。秉性溫和,文章雋永,孫策悼之,孫權倚之。卒年六十。',
    en: 'Style name Zigang, of Guangling. From youth a name in the Huai region. With Zhang Zhao he served Sun Ce and Sun Quan — the "Two Zhangs." Sent as envoy to Xudu, Cao Cao would have kept him, but at last let him return. Mild in temper and elegant in prose, mourned by Sun Ce and trusted by Sun Quan. He died at sixty.',
  },
  'zhang-bao-yt': {
    zh: '張角弟,黃巾「地公將軍」。中平元年攻潁川、宛城,屢為皇甫嵩、朱儁所敗。後為部將嚴政所殺,首級送漢營。',
    en: 'Younger brother of Zhang Jiao, the "Earth-Lord General" of the Yellow Turbans. In 184 he attacked Yingchuan and Wancheng and was broken again and again by Huangfu Song and Zhu Jun. He was killed by his own captain Yan Zheng, who sent his head to the Han camp.',
  },
  'zhang-liang-yt': {
    zh: '張角弟,黃巾「人公將軍」。中平元年率眾守廣宗,皇甫嵩夜襲破之,陣斬張梁,黃巾大局自此潰。',
    en: 'Younger brother of Zhang Jiao, the "Man-Lord General." In 184 he held Guangzong; Huangfu Song made a night attack and broke him, cutting down Zhang Liang in the line — and the Yellow Turban cause collapsed.',
  },
  'zhang-rang': {
    era: { zh: '十常侍首', en: 'Chief of the Ten Attendants' },
    zh: '潁川人,東漢宦官,十常侍之首。漢靈帝寵信無比,呼為「阿父」,賣官鬻爵,弄權十餘年。中平六年何進謀誅之,事洩,讓等於宮中殺進,袁紹引兵入宮屠宦官二千餘人,張讓投河而死。',
    en: 'Of Yingchuan, eunuch of Later Han and chief of the Ten Attendants. Emperor Ling doted on him beyond all, calling him "Old Father." For more than a decade he sold office and rank and held the court in his grip. In 189 He Jin plotted his death; the plot leaked, Zhang Let and the rest killed He Jin in the palace, and Yuan Shao led troops in to butcher over two thousand eunuchs. Zhang Rang threw himself into the river to die.',
  },
  'zhang-lu': {
    era: { zh: '師君', en: 'The Lord-Master' },
    zh: '字公祺,沛國豐人,五斗米道祖師張陵之孫。據漢中三十年,以鬼道治民,設義舍米肉以濟過客,號師君。建安二十年曹操親征,張魯先逃巴中,留庫府不毀,曹操嘉之,封閬中侯,五子皆封侯。後病卒洛陽。',
    en: 'Style name Gongqi, of Feng in Pei, grandson of Zhang Ling, founding master of the Way of the Five Pecks of Rice. For thirty years he ruled Hanzhong, governing through the "ghost-Way," setting up free hostels of rice and meat for travelers, called the "Lord-Master." In 215 Cao Cao came north in person; Zhang Lu first fled to Bazhong but left his armories and granaries unburned. Cao Cao prized this and made him Marquis of Langzhong, with all five of his sons enfeoffed. He died of illness at Luoyang.',
  },
  'zhang-ren': {
    zh: '蜀郡人,劉璋部將。射術絕倫,智勇雙全。劉備入蜀,張任守雒城,與張飛、諸葛亮相持。落鳳坡一役,設伏射殺龐統。後城陷被擒,大罵不降,曰:「老臣終不復事二主!」 劉備義之,惜不能用,終斬之以全其節。',
    en: 'Of Shu commandery, a captain of Liu Zhang. Peerless in archery, bold and clever. When Liu Bei marched into Shu, Zhang Ren held Luocheng against Zhang Fei and Zhuge Liang. At Phoenix Slope he laid an ambush and killed Pang Tong. When the city fell he was taken alive; cursing them, he refused surrender: "This old minister will never serve two lords!" Liu Bei honored him but could not bend him, and at last beheaded him to keep his name whole.',
  },
  'zhang-yi': {
    era: { zh: '南中柱石', en: 'Pillar of the South' },
    zh: '字伯岐,巴西宕渠人。從諸葛亮南征,撫蠻夷有方。鎮越巂太守十五年,以恩義降諸羌,夷漢咸服。後從姜維北伐,屢挫魏軍,陣戰皆先,鬚髮皆白猶持矛突陣,年六十而卒於沓中。',
    en: 'Style name Boqi, of Dangqu in Baxi. He marched with Zhuge Liang on the southern campaign and ruled the tribes with skill. As Governor of Yuesui for fifteen years he won the Qiang by grace and honor; barbarian and Han alike obeyed. Later under Jiang Wei he went north many times, blunting the Wei host, always at the front of the line; with hair and beard gone white he still rode with the spear into the enemy. He died at Tazhong at sixty.',
  },
  'zhang-yan': {
    era: { zh: '飛燕', en: 'Flying Swallow' },
    zh: '常山真定人。本姓褚,以飛捷得名「飛燕」。漢末聚黑山賊百萬眾,擾河北十餘年。袁紹屢攻不能克。建安十年見天下將定,率眾降曹操,封安國亭侯。',
    en: 'Of Zhending in Changshan. Originally surnamed Chu, he was nicknamed "Flying Swallow" for his quickness. In the late Han he gathered a hundred thousand of the Black Mountain bandits and harried the north for a decade. Yuan Shao tried many times and could not break him. In 205, seeing the realm soon to settle, he led his men in to surrender to Cao Cao and was made Marquis of Anguo Pavilion.',
  },
  'zhang-xiu': {
    zh: '字未詳,武威祖厲人,張濟之姪。繼領叔父之眾,屯宛城。建安二年降曹操,後因納張濟遺孀鄒氏事復叛,夜襲曹營,殺曹操長子曹昂、姪曹安民及典韋。後再降,從征官渡有功,於北征柳城途中病卒。',
    en: 'Of Zuli in Wuwei, nephew of Zhang Ji. He took over his uncle\'s troops and held Wancheng. In 197 he surrendered to Cao Cao, then over the affair of Cao Cao\'s taking his uncle\'s widow Lady Zou he rose again and made the famous night attack on the Cao camp, killing Cao Ang the eldest son, the nephew Cao Anmin, and Dian Wei. He surrendered again and earned credit at Guandu; he died of illness on the march to Liu City.',
  },
  'zhang-wen': {
    zh: '字惠恕,吳郡吳人。少有美名,孫權雅愛之。出使蜀漢,諸葛亮、秦宓皆與之辯,張溫推服。歸吳後為暨豔事所累,孫權惡其名望太重,廢黜歸家,鬱鬱而終。',
    en: 'Style name Huishu, of Wu county in Wujun. From youth a name of beauty; Sun Quan loved him. Sent as envoy to Shu, he debated Zhuge Liang and Qin Mi and bowed in admiration. Back in Wu he was caught up in the Ji Yan affair; Sun Quan, finding his reputation too great, dismissed him to his home, where he died in despair.',
  },
  'zhang-ti': {
    zh: '字巨先,襄陽人。吳國末代丞相。性沉毅有遠識。晉伐吳,張悌率精兵三萬迎於牛渚,大敗,左右勸退,悌曰:「吳國將亡,賢愚共知,今日明顯,殆死於此!」 死戰不退,身被數十創而卒,以全君臣之義。',
    en: 'Style name Juxian, of Xiangyang. The last chancellor of Wu. Steady and deep-sighted. When Jin\'s armies came down, Zhang Ti led thirty thousand picked men out to meet them at Niuzhu and was broken. When his men urged retreat, he said: "That the kingdom must fall, both wise and foolish know. Today the matter is plain — I shall die here." He fought to the end without one step back, fell under dozens of wounds, and so kept whole the bond of lord and minister.',
  },
  'zhang-song': {
    zh: '字永年,蜀郡成都人。身短貌寢,然博學強識,過目成誦。劉璋遣使曹操求援,操輕之,松遂歸劉備,獻西川地圖,謀取益州。法正、孟達為內應,事洩,被劉璋斬之。蜀漢之有西川,松實啟之。',
    en: 'Style name Yongnian, of Chengdu in Shu. Short and plain of face, but vastly learned, his memory infallible — he could repeat anything once seen. Sent by Liu Zhang as envoy to Cao Cao, he was slighted, and turned instead to Liu Bei, offering him the map of the western country and the plot to take Yi province. With Fa Zheng and Meng Da as inside friends, the scheme was found out and Liu Zhang beheaded him. That Shu came to hold the western country — Zhang Song opened the way.',
  },
  'zhang-hua': {
    era: { zh: '西晉宰輔', en: 'Chancellor of Western Jin' },
    zh: '字茂先,范陽方城人。少時貧苦,以才華自顯。預策伐吳,後為侍中、中書令,封廣武侯。著《博物志》十卷,集天下奇聞異物。趙王倫之亂,張華堅守不附,被收斬於朝堂,夷三族。死之日,天下莫不痛之。',
    en: 'Style name Maoxian, of Fangcheng in Fanyang. Poor in youth, he made himself known by sheer talent. He helped plan the conquest of Wu; later he was Palace Attendant and Director of the Imperial Secretariat, Marquis of Guangwu. He wrote the Bowuzhi in ten fascicles, gathering the wonders and strange things of the realm. In Prince Lun of Zhao\'s revolt he stood firm and would not join; he was seized and beheaded in the court hall, and three branches of his clan were extinguished. The day he died, all under heaven grieved.',
  },
  'zhang-mancheng': {
    zh: '南陽黃巾大方。中平元年攻南陽,殺太守褚貢。後為朱儁、孫堅所破斬。',
    en: 'A great Yellow Turban "fang" commander of Nanyang. In 184 he attacked Nanyang and killed the governor Chu Gong. Soon after he was broken and beheaded by Zhu Jun and Sun Jian.',
  },
  'zhang-miao': {
    zh: '字孟卓,東平壽張人,八廚之一。漢末名士。初與曹操為友,後與陳宮共迎呂布襲取兗州,曹操幾失根本。後呂布敗於下邳,張邈走求救於袁術,中途為部下所殺。',
    en: 'Style name Mengzhuo, of Shouzhang in Dongping, one of the "Eight Stewards" of late Han. A famed gentleman of the closing years. First a friend of Cao Cao, he joined Chen Gong in inviting Lü Bu to seize Yanzhou — Cao Cao very nearly lost his base. When Lü Bu was broken at Xiapi, Zhang Miao fled to seek help from Yuan Shu and was killed by his own men on the road.',
  },
  'zhang-chao': {
    zh: '張邈之弟,廣陵太守。從兄反曹操,迎呂布。後從邈奔走,事敗死於亂中。',
    en: 'Younger brother of Zhang Miao, Governor of Guangling. He joined his brother against Cao Cao in welcoming Lü Bu. When their cause fell, he fled with his brother and died in the chaos.',
  },
  'zhang-yang': {
    zh: '字稚叔,雲中人。漢末割據河內,平和好士,呂布、董昭皆嘗依之。聞曹操與呂布相攻,欲援呂布,被部將楊醜所殺,部眾散歸袁紹。',
    en: 'Style name Zhishu, of Yunzhong. In the closing years of Han he held Henei as his own and was gentle and fond of gentlemen — both Lü Bu and Dong Zhao took refuge with him. When he meant to march to Lü Bu\'s aid against Cao Cao, his captain Yang Chou killed him, and his troops scattered to Yuan Shao.',
  },
  'zhang-xun': {
    zh: '袁術大將軍。建安四年從袁術救陳,為呂布所敗。袁術稱帝,屢出師而無功。',
    en: 'A Grand General under Yuan Shu. In 199 he led the relief of Chen and was broken by Lü Bu. After Yuan Shu took the imperial title, he campaigned often without success.',
  },
  'zhang-ying': {
    zh: '劉繇部將。守牛渚,孫策渡江,為孫策所破斬。',
    en: 'A captain of Liu Yao. Holding Niuzhu, he was broken and beheaded by Sun Ce when he crossed the river.',
  },
  'zhang-yun': {
    zh: '荊州蔡瑁之姨甥,水軍都督。曹操南征,蔡瑁、張允降之,曹操命督水軍。周瑜用反間計,曹操中計斬之,赤壁水軍由此大失統將。',
    en: 'Nephew by marriage of Cai Mao, Director of Naval Forces in Jingzhou. When Cao Cao came south, Cai Mao and Zhang Yun submitted, and Cao Cao put them at the head of his fleet. Zhou Yu sowed the counter-trick; Cao Cao took the bait and beheaded them, and his fleet at Red Cliffs lost its commanders.',
  },
  'zhang-da-zf': {
    zh: '張飛帳下將。張飛遇害前,因鞭打士卒,夜半與范彊共割其首,持往孫權處邀功。後劉備伐吳,二人為孫權所執,押還蜀,凌遲處死,以祭翼德之靈。',
    en: 'A captain under Zhang Fei. When Zhang Fei was beating his soldiers without mercy on the eve of the Yiling campaign, Zhang Da with Fan Qiang cut off his head in the night and carried it to Sun Quan for reward. After Liu Bei\'s march on Wu, Sun Quan handed the two of them back, and they were torn apart at Chengdu in offering to the spirit of Zhang Yide.',
  },
  'zhang-shao': {
    zh: '張飛次子。襲爵西鄉侯。蜀漢亡時隨後主降晉,終於洛陽。',
    en: 'Second son of Zhang Fei. He inherited the title of Marquis of Xixiang. When Shu fell he went with the Second Emperor to surrender, and ended his days at Luoyang.',
  },
  'zhang-yong': {
    zh: '張飛之孫,張紹之子。蜀漢亡後遷洛陽,卒於晉。',
    en: 'Grandson of Zhang Fei, son of Zhang Shao. After Shu fell he was moved to Luoyang and ended his life under Jin.',
  },
  'zhang-fan-wei': {
    zh: '字公儀,河內修武人。漢末名士,德行為時所重。曹操辟之,辭以足疾,終身不仕,士林敬之。',
    en: 'Style name Gongyi, of Xiuwu in Henei. A famed gentleman of late Han, much honored for his conduct. Cao Cao summoned him; he declined on grounds of a foot ailment and would not serve to the end of his life. The gentry held him in honor.',
  },
  'zhang-wei': {
    zh: '張魯之弟。守陽平關,與曹操相持。後降曹操,封列侯。',
    en: 'Younger brother of Zhang Lu. He held Yangping Pass against Cao Cao; later he surrendered and was made a marquis.',
  },
  'zhang-bu': {
    zh: '吳國末年權臣。與濮陽興共立孫休,後又共立孫皓。皓既立,猜忌權臣,張布被誅夷三族。',
    en: 'A great minister at the end of Wu. With Puyang Xing he set up Sun Xiu, then with him set up Sun Hao. Once enthroned, Sun Hao distrusted the great ministers and had Zhang Bu killed, three branches of his clan with him.',
  },
  'zhang-cheng': {
    zh: '字仲嗣,張昭長子。承襲父職,任輔吳將軍。性溫雅,從父之風。',
    en: 'Style name Zhongsi, eldest son of Zhang Zhao. He inherited his father\'s office, serving as General Who Supports Wu. Mild and refined — the air of his father.',
  },
  'zhang-cheng-wei': {
    zh: '魏國將。鎮幽州,以鎮邊稱。',
    en: 'A Wei general. He held the You-Bei frontier with renown.',
  },
  'zhang-gui': {
    era: { zh: '前涼始祖', en: 'Founder of the Former Liang' },
    zh: '字士彥,安定烏氏人。西晉末出鎮涼州,撫綏羌胡,招集流亡,以保土安民見稱。其後子孫世襲,遂成前涼,凡九世七十六年,為晉室之屏障於河西。',
    en: 'Style name Shiyan, of Wushi in Anding. At the end of Western Jin he went west to govern Liang province; he tamed the Qiang and Hu, gathered the wanderers, and was famed for holding the soil and easing the people. His descendants held the post in line and at last became the Former Liang — nine generations, seventy-six years, a screen of the Jin in the lands west of the river.',
  },
  'zhang-mao-jin': {
    zh: '字成遜,前涼張軌之孫。承父業,鎮姑臧,以儉約治涼,五涼之最賢者。',
    en: 'Style name Chengxun, grandson of Zhang Gui of the Former Liang. He took up his father\'s work, governed at Guzang in austerity, and was reckoned the worthiest ruler of the Five Liangs.',
  },
  'zhang-heng-lw': {
    zh: '韓遂部將。隨韓遂、馬騰據關中。馬超伐曹,渭南之戰中為許褚所斬。',
    en: 'A captain under Han Sui. He held Guanzhong with Han Sui and Ma Teng. In Ma Chao\'s war on Cao Cao at Weinan he was cut down by Xu Chu.',
  },
  'zhang-nan': {
    zh: '蜀漢將。隨劉備伐吳,夷陵之火後從馮習殿後,陣亡。',
    en: 'A Shu officer. He marched with Liu Bei against Wu. After the fire of Yiling he covered the rear with Feng Xi and was killed in the line.',
  },
  'zhang-ni': {
    zh: '字伯恭,犍為武陽人。隨諸葛亮南征,北伐皆從。沓中之戰隨姜維拒鄧艾,陣亡。',
    en: 'Style name Bogong, of Wuyang in Qianwei. He marched with Zhuge Liang on the southern campaign and joined every northern one. At Tazhong, holding the line with Jiang Wei against Deng Ai, he died in the fight.',
  },
  'ze-rong': {
    zh: '丹陽人。漢末佛教大施主。據徐州下邳,築浮屠寺,以金塗佛,設浴佛大會,常聚萬眾。陶謙時掌徐州糧運,後叛走廣陵,殺薛禮,終被劉繇將孫策破之。',
    en: 'Of Danyang. A great Buddhist patron of late Han. He held Xiapi in Xuzhou, built a stupa hall, gilded the Buddha with gold, and held bathing rites that gathered ten thousand at a time. Under Tao Qian he managed the grain trains of Xuzhou; later he turned coat to Guangling, killed Xue Li, and was at last broken by Sun Ce.',
  },
  'zuo-si': {
    era: { zh: '洛陽紙貴', en: 'Paper Grew Dear in Luoyang' },
    zh: '字太沖,齊國臨淄人。家世微寒,貌寢,然博學精思。十年之功成《三都賦》,一出洛陽豪貴爭傳寫,洛陽紙價為之昂,世稱「洛陽紙貴」。亦工詩,有《詠史》八首傳世,氣骨高古。',
    en: 'Style name Taichong, of Linzi in Qi. Of low birth and plain face, but vastly learned and deeply thoughtful. Ten years he laboured on the Rhapsody on the Three Capitals; when it appeared, the great houses of Luoyang vied to copy it and the price of paper there rose — and so the proverb "paper grew dear in Luoyang." He was also a poet; his eight "Songs on History" survive, lofty and antique in spirit.',
  },
  // Notable Wu generals
  'cheng-pu': {
    era: { zh: '東吳老將', en: 'Old Marshal of Wu' },
    zh: '字德謀,右北平土垠人。吳之元勳,從孫堅、孫策、孫權三世。性寬厚,長者也。赤壁之戰為左都督,與周瑜共破曹操。後屢平江夏蠻夷,孫權呼之為「程公」,不直呼其名。卒於江夏。',
    en: 'Style name Demou, of Tuyin in Youbeiping. A founding officer of Wu, he served Sun Jian, Sun Ce, and Sun Quan in turn. Broad of heart and old in years. At Red Cliffs he was Left Commandant under Zhou Yu, joining in the breaking of Cao Cao. Later he pacified the tribes of Jiangxia; Sun Quan called him "Master Cheng" and would not say his given name. He died at Jiangxia.',
  },
  'huang-gai': {
    era: { zh: '火攻赤壁', en: 'Fire-Attack at Red Cliffs' },
    zh: '字公覆,零陵泉陵人。從孫堅起兵,事孫氏三世。赤壁之戰獻苦肉計,自請受周瑜杖刑,後詐降曹操,以艨衝鬥艦載薪油直衝曹軍水寨,縱火大破之。後鎮武陵,平蠻夷,以恩威見稱。',
    en: 'Style name Gongfu, of Quanling in Lingling. He rose with Sun Jian and served three generations of the Sun house. At Red Cliffs he gave the Plan of Self-Wounding — he asked Zhou Yu to beat him in the camp and then sent a false letter of surrender to Cao Cao. With dragon-prowed war-boats loaded with brushwood and oil he drove straight into the Cao fleet and set the whole on fire. Later he tamed the Wuling tribes by balanced grace and severity.',
  },
  'han-dang': {
    zh: '字義公,遼西令支人。隨孫堅起義,從孫策渡江,事孫權,號東吳三朝元老。性勇敢,征戰必先,屢從周瑜、呂蒙、陸遜立功。卒年七十餘。',
    en: 'Style name Yigong, of Lingzhi in Liaoxi. He rose with Sun Jian, crossed the river with Sun Ce, and served Sun Quan — three-reign elder of Wu. Bold in battle, always at the front; he won laurels under Zhou Yu, Lü Meng, and Lu Xun. He died past seventy.',
  },
  'jiang-qin': {
    zh: '字公奕,九江壽春人。少與周泰共事孫策,以驍勇稱。從孫權征戰,鎮宣城,平山賊。後病卒於返京途中。',
    en: 'Style name Gongyi, of Shouchun in Jiujiang. From youth he served Sun Ce with Zhou Tai, known for fierceness. Under Sun Quan he held Xuancheng and crushed the mountain bandits. He died of illness on the road home.',
  },
  'ling-tong': {
    zh: '字公績,吳郡餘杭人,凌操之子。父為甘寧所殺,孫權慮二人交惡,終以恩義和解,凌統不復計舊仇。從征合肥,救孫權於亂軍,功著三軍。年僅四十九卒,孫權哭之至於慟。',
    en: 'Style name Gongji, of Yuhang in Wujun, son of Ling Cao. His father had been killed by Gan Ning. Sun Quan, fearing trouble between them, brought them into peace by his own grace; Ling Tong let the old grudge go. At Hefei he saved Sun Quan from the rout, with merit known to all three armies. He died at only forty-nine; Sun Quan wept until grief broke his voice.',
  },
  'ling-cao': {
    zh: '吳郡餘杭人,凌統之父。從孫策破劉勳,先登有功。後與孫權征江夏,被甘寧射殺。',
    en: 'Of Yuhang in Wujun, father of Ling Tong. He marched with Sun Ce against Liu Xun and earned credit as first to mount the wall. Later, in Sun Quan\'s campaign against Jiangxia, he was shot down by Gan Ning.',
  },
  'chen-wu': {
    zh: '字子烈,廬江松滋人。容貌雄壯,從孫策渡江,屢立戰功。性仁厚,鄉里愛之。建安二十年合肥之役,為張遼所斬。孫權自臨其葬,以妾殉之。',
    en: 'Style name Zilie, of Songzi in Lujiang. Of majestic build, he crossed the river with Sun Ce and won many laurels. Generous to his villagers and beloved by them. In the Hefei battle of 215 Zhang Liao cut him down. Sun Quan came in person to his burial and made his concubine die with him.',
  },
  'dong-xi': {
    zh: '字元代,會稽餘姚人。身長八尺,以勇悍見稱。從孫權征討。建安十八年濡須之役,大風夜起,五樓船覆,左右勸登小船避之,董襲怒曰:「受將軍任,在此禦寇,何敢委去!」 終沒於江。',
    en: 'Style name Yuandai, of Yuyao in Kuaiji. Eight chi tall and famed for fierceness. He campaigned with Sun Quan. In the Ruxu battle of 213, when a great wind capsized the Five-Storey Ship by night, his men urged him into a skiff to save himself; Dong Xi roared: "Charged by my lord to hold this post against the enemy — how dare I leave it?" He went down with the ship.',
  },
  'pan-zhang': {
    zh: '字文珪,東郡發干人。性貪鄙,然驍勇敢戰。從征戰立功,擒關羽於臨沮,孫權喜之。後鎮魯口,卒年六十餘。',
    en: 'Style name Wengui, of Fagan in Dongjun. Grasping in temper but bold and quick in war. He earned credit in many fights and took Guan Yu alive at Linju, to Sun Quan\'s great joy. He later garrisoned Lukou and died past sixty.',
  },
  'ma-zhong': {
    zh: '東吳司馬。從潘璋擒關羽於臨沮,功著吳國。後鎮夷陵,參與大破劉備。',
    en: 'A Wu marshal. With Pan Zhang he took Guan Yu alive at Linju, of great credit to the kingdom. He later garrisoned Yiling and joined in the great breaking of Liu Bei.',
  },
  'gu-yong': {
    era: { zh: '東吳賢相', en: 'Worthy Chancellor of Wu' },
    zh: '字元嘆,吳郡吳人。少從蔡邕學,雅靜寡言。事孫權四十年,任丞相十九年,從未失大政。性嚴明,飲酒不亂,人莫測其喜怒。子顧邵、孫顧譚皆有大名。卒年七十六,謚肅。',
    en: 'Style name Yuantan, of Wu county in Wujun. In youth he studied under Cai Yong; quiet and sparing in speech. For forty years he served Sun Quan and for nineteen years was chancellor, and never once made a wrong call in great policy. Stern and clear, he was sober when others drank; no one could read his pleasure or anger. His son Gu Shao and grandson Gu Tan both became famous. He died at seventy-six; his posthumous name was Su.',
  },
  'bu-zhi': {
    zh: '字子山,臨淮淮陰人。少與諸葛瑾、嚴畯、衛旌等避亂江東,以才名顯。事孫權四十餘年,任右丞相。鎮交州,撫蠻夷,有威惠。卒年八十一。',
    en: 'Style name Zishan, of Huaiyin in Linhuai. In youth he fled the chaos to Jiangdong with Zhuge Jin, Yan Jun, and Wei Jing, and made his name by talent. For forty years he served Sun Quan and rose to Right Chancellor. Garrisoning Jiao province, he tamed the tribes with awe and kindness. He died at eighty-one.',
  },
  'quan-cong': {
    zh: '字子璜,吳郡錢唐人。為孫權婿,尚孫魯班。鎮淮南,屢禦魏軍。位至大司馬,封錢唐侯。卒年六十一。',
    en: 'Style name Zihuang, of Qiantang in Wujun. Son-in-law to Sun Quan through marriage to Sun Luban. He held Huainan against Wei in many fights, rose to Marshal of State, and was made Marquis of Qiantang. He died at sixty-one.',
  },
  'kan-ze': {
    zh: '字德潤,會稽山陰人。博覽群書,通解陰陽。赤壁之戰,獻苦肉計使曹操中計,為周瑜立功。後任太子太傅,著有《乾象曆》。',
    en: 'Style name Derun, of Shanyin in Kuaiji. Broad in his reading, master of Yin-Yang lore. At Red Cliffs he carried the Plan of Self-Wounding to Cao Cao, baiting him for Zhou Yu\'s glory. Later as Grand Tutor of the Crown Prince he compiled the Qianxiang Calendar.',
  },
  'luo-tong': {
    zh: '字公緒,會稽烏傷人。事孫權,有政事才。為新都、武陵太守,撫民有道。屢諫孫權,辭氣懇切。年三十六卒,孫權痛悼。',
    en: 'Style name Gongxu, of Wushang in Kuaiji. He served Sun Quan and was a man of administration. As Governor of Xindu and Wuling he settled the people well. He remonstrated often with Sun Quan, urgent and sincere in his words. He died at thirty-six; Sun Quan mourned bitterly.',
  },
  'shi-yi': {
    zh: '字子羽,北海營陵人。原姓氏,孔融嘲之以「氏」字無上,改為是。事孫權四十年,以清廉著稱,門無餘財,妻子衣食粗惡。',
    en: 'Style name Ziyu, of Yingling in Beihai. Originally surnamed Shi, but Kong Rong jested that the character lacked its top, so he changed it to "Shi" (the upright). For forty years he served Sun Quan, famed for clean hands; his household held no surplus and his wife and children went in coarse cloth and plain food.',
  },
  'yan-jun': {
    zh: '字曼才,彭城下邳人。博學能文,與張紘、諸葛瑾並推。事孫權,為衛尉。直諫不阿,孫權嘉之。',
    en: 'Style name Mancai, of Xiapi in Pengcheng. Broadly learned and a writer; ranked with Zhang Hong and Zhuge Jin. Under Sun Quan he served as Commandant of the Guards. He remonstrated straight without flattery; Sun Quan praised him for it.',
  },
  // Notable Shu officers
  'ma-liang': {
    era: { zh: '白眉馬良', en: 'White-Browed Ma Liang' },
    zh: '字季常,襄陽宜城人。兄弟五人並有才名,鄉里語曰:「馬氏五常,白眉最良。」 良眉有白毛,故稱。事劉備,為左將軍掾。劉備伐吳,馬良招撫五溪蠻,事未竟,夷陵之敗中陣亡,年三十六。',
    en: 'Style name Jichang, of Yicheng in Xiangyang. The five brothers were all of repute; the village said: "Of the five Constants of Ma, the White-Browed is the best." Ma Liang had a white eyebrow, hence the name. He served Liu Bei as adjutant to the General of the Left. In Liu Bei\'s campaign against Wu, Ma Liang was sent to gather the Wuxi tribes; before he could finish he fell in the disaster of Yiling at thirty-six.',
  },
  'ma-su': {
    era: { zh: '揮淚斬馬謖', en: 'Wept and Cut Down Ma Su' },
    zh: '字幼常,馬良之弟。才氣過人,好論軍計,諸葛亮愛之。然劉備臨終戒亮曰:「馬謖言過其實,不可大用。」 第一次北伐,亮使守街亭,馬謖捨水上山,為張郃所破,蜀軍大敗。亮揮淚斬之以正軍法,自貶三等。',
    en: 'Style name Youchang, younger brother of Ma Liang. Of high talent, fond of discussing military strategy — Zhuge Liang loved him. Yet Liu Bei on his deathbed warned: "Ma Su\'s words exceed his substance; he should not be greatly used." On the first northern campaign, Zhuge Liang sent him to hold the Jieting pass; Ma Su abandoned the water source and climbed the mountain, and Zhang He broke him utterly. Zhuge Liang wept and beheaded him to keep the army\'s law, and demoted himself three grades.',
  },
  'fa-zheng': {
    era: { zh: '蜀漢謀主', en: 'Chief Strategist of Shu' },
    zh: '字孝直,扶風郿人。少入蜀,事劉璋而不得志。與張松通謀迎劉備入蜀,獻取漢中之策。劉備得益州,以為尚書令、護軍將軍,謀主之任。建安二十四年定軍山一戰,以策斬夏侯淵。次年病卒,年四十五。劉備為之流涕者數日,諸葛亮歎:「法孝直在,必能制主上,令不東行!」',
    en: 'Style name Xiaozhi, of Mei in Fufeng. He went into Shu young and served Liu Zhang without rising. With Zhang Song he laid the plot to bring Liu Bei in, and offered the plan to take Hanzhong. When Yi province was won, Liu Bei made him Director of the Imperial Secretariat and Defender-General — chief of strategy. At Mount Dingjun in 219 his counsel killed Xiahou Yuan. He died the next year at forty-five. Liu Bei wept for him many days; Zhuge Liang sighed: "If Xiaozhi were alive, he alone could have curbed our lord and kept him from marching east!"',
  },
  'huang-quan': {
    zh: '字公衡,巴西閬中人。原劉璋部,劉備入蜀後降之,深見器重。夷陵之役,黃權督江北軍以禦魏。劉備敗於猇亭,歸路斷絕,黃權無奈降魏。曹丕問:「君何以背漢主而降?」 對曰:「臣不能成功,不能殉節,故來歸命。」 曹丕嘉之,封列侯。',
    en: 'Style name Gongheng, of Langzhong in Baxi. Originally a captain of Liu Zhang, he submitted to Liu Bei and was much trusted. In the Yiling campaign he commanded the northern bank against Wei. After Liu Bei\'s rout at Xiaoting, his road back was cut and he had to surrender to Wei. Cao Pi asked: "Why have you turned from the Han Lord to come to me?" He answered: "I could not finish the work; I could not die for my duty; so I have come to give myself up." Cao Pi prized the answer and made him a marquis.',
  },
  'jiang-wan': {
    era: { zh: '蜀漢柱石', en: 'Pillar of Shu' },
    zh: '字公琰,零陵湘鄉人。諸葛亮欽其才,以後事相托:「公琰託志忠雅,當與吾共贊王業者也。」 亮卒,蜀漢人心震動,蔣琬處之鎮定,不悲不喜,日夜操勞而面無慍色,百姓賴之以安。位至大司馬,輔政十二年。卒,謚恭。',
    en: 'Style name Gongyan, of Xiangxiang in Lingling. Zhuge Liang prized his talent and entrusted the future to him: "Gongyan is set in loyal grace — he is the one to share with me in upholding the royal work." At Zhuge Liang\'s death, when the realm was shaken, Jiang Wan held himself steady — neither grieved nor glad — and laboured day and night without a hint of complaint in his face. The people leaned on him for peace. He rose to Marshal of State and guided affairs for twelve years. He died, posthumous name Gong — "The Reverent."',
  },
  'fei-yi': {
    zh: '字文偉,江夏鄳人。蔣琬之後執政,以調和孫劉、寬容大臣稱。每與諸葛瑾子諸葛恪辯,皆能勝,孫權嘉之。家風儉素,雖位輔相,妻子布衣。延熙十六年,為魏降人郭循刺殺於漢壽,蜀漢中衰。',
    en: 'Style name Wenwei, of Meng in Jiangxia. After Jiang Wan he held the reins, famed for mending Sun-Liu relations and tolerating great ministers. In every debate with Zhuge Jin\'s son Zhuge Ke he came out the winner; Sun Quan praised it. His household was austere — though chancellor, his wife and children dressed in cloth. In 253 the Wei defector Guo Xun stabbed him at Hanshou, and Shu declined.',
  },
  'dong-yun': {
    zh: '字休昭,南郡枝江人。諸葛亮《出師表》所推「侍中、侍郎郭攸之、費禕、董允」之一。性正直,後主寵宦官黃皓,允屢正之,皓不敢為非。允卒,皓乃肆意,蜀漢之亡實由此始。',
    en: 'Style name Xiuzhao, of Zhijiang in Nanjun. One of the men Zhuge Liang named in the Memorial of the Northern Campaign — "the Palace Attendants and Counselors Guo Youzhi, Fei Yi, and Dong Yun." Upright by nature; when the Second Emperor doted on the eunuch Huang Hao, Dong Yun corrected him again and again, and Huang Hao dared not act crookedly. After Dong Yun died Huang Hao threw off all restraint — and from there Shu\'s ruin began.',
  },
  'wang-ping': {
    era: { zh: '識字三千', en: 'Three Thousand Characters' },
    zh: '字子均,巴西宕渠人。原魏將,降蜀後深得諸葛亮信任。馬謖失街亭,王平獨領千人鳴鼓自守,張郃疑有伏兵,不敢逼,蜀軍賴以撤退。後鎮漢中,興勢之役以三萬眾拒曹爽十萬,大破之。識字不過十,而口述為人作書,皆有意度,深通兵法。',
    en: 'Style name Zijun, of Dangqu in Baxi. Originally a Wei officer, he submitted to Shu and was deeply trusted by Zhuge Liang. When Ma Su lost Jieting, Wang Ping alone held a thousand men, beat the war-drums, and stood his ground; Zhang He, suspecting an ambush, dared not press, and the Shu army escaped under his cover. Later as governor of Hanzhong, at the Xingshi battle he broke Cao Shuang\'s hundred thousand with thirty thousand. He could read fewer than ten characters, yet his dictated letters were full of judgment, and he knew the art of war by heart.',
  },
  'wu-yi': {
    zh: '字子遠,陳留人。劉璋親家,後降劉備,妹為劉備皇后(穆皇后)。隨諸葛亮北伐,鎮漢中,位至車騎將軍。卒於建興末年。',
    en: 'Style name Ziyuan, of Chenliu. A kinsman by marriage of Liu Zhang, he submitted to Liu Bei; his sister became Liu Bei\'s empress, the Empress Mu. He marched with Zhuge Liang on the northern campaigns, garrisoned Hanzhong, and rose to General of Chariots and Cavalry. He died at the close of the Jianxing reign.',
  },
  'wei-yan': {
    era: { zh: '反骨將軍', en: 'The Bone-Backed General' },
    zh: '字文長,義陽人。隨劉備入蜀,有大功,鎮漢中。性矜傲,與楊儀不睦。諸葛亮死於五丈原,遺命魏延斷後;魏延以為相公雖死,我自當北伐,不肯退。與楊儀爭兵柄,被斬於漢中,夷三族。後人多惜其勇而冤。',
    en: 'Style name Wenchang, of Yiyang. He followed Liu Bei into Shu and earned great laurels, holding Hanzhong. Proud by nature, he and Yang Yi did not get on. When Zhuge Liang died at Wuzhang Plains, his last order set Wei Yan to cover the rear; Wei Yan thought: "Though the Chancellor is dead, I shall march north on my own — I shall not retreat." Fighting Yang Yi for the seal of command he was killed at Hanzhong, three branches of his clan extinguished. Later ages mostly mourned him as wronged in his courage.',
  },
  'meng-da': {
    zh: '字子敬,扶風人。原劉璋部,降劉備有功,封宜都太守。關羽北伐,孟達不發兵救,後懼劉備之罪,降魏。曹丕厚待之,使鎮新城。司馬懿伐之,日夜兼程,八日到城下,孟達死於亂兵,事如風雷。',
    en: 'Style name Zijing, of Fufeng. Originally with Liu Zhang, he submitted to Liu Bei with credit and was made Governor of Yidu. When Guan Yu marched north, Meng Da did not send relief; fearing Liu Bei\'s wrath he later went over to Wei. Cao Pi treated him richly and gave him Xincheng to hold. When Sima Yi marched on him, the army covered eight days\' road in one stretch and was at the wall — Meng Da died in the chaos, the matter struck like wind and thunder.',
  },
  // Wei officers
  'pang-de': {
    era: { zh: '抬棺戰關羽', en: 'Bore His Coffin Against Guan Yu' },
    zh: '字令明,南安人。原馬超部,馬超降劉備,德隨張魯,後降曹操。襄樊之役,自抬棺木出戰,誓與關羽決死。水淹七軍,被擒。關羽嘉其勇,勸降,德罵曰:「魏王帶甲百萬,威振天下;劉備庸才耳,豈能敵也!」 終為關羽所殺,曹操為之流涕。',
    en: 'Style name Lingming, of Nan\'an. Originally a captain of Ma Chao, when Ma Chao surrendered to Liu Bei he went with Zhang Lu, then submitted to Cao Cao. In the Xiangfan campaign he brought a coffin onto the field, swearing to fight Guan Yu to the death. In the flooding of the seven armies he was taken. Guan Yu prized his courage and urged surrender; Pang De cursed: "The King of Wei has a million in arms and rules the realm — Liu Bei is a mediocrity! How could he stand against?" Guan Yu killed him, and Cao Cao wept.',
  },
  'wen-pin': {
    zh: '字仲業,南陽宛人。原劉表將,荊州降後,獨不見曹操,曰:「不能保全土地,愧見明公。」 操嘉其忠,使鎮江夏二十餘年,屢卻孫權之軍,卒於官。',
    en: 'Style name Zhongye, of Wan in Nanyang. A captain of Liu Biao. When Jingzhou submitted, he alone would not appear before Cao Cao: "I could not keep the land — I am ashamed to face you." Cao Cao prized the loyalty and gave him Jiangxia to hold for over twenty years; he turned back Sun Quan many times and died in office.',
  },
  'li-dian': {
    zh: '字曼成,山陽鉅野人。少時好學,雅好詩書,人比之長者。從曹操征戰,功多而不爭,讓功於同僚,士林敬之。合肥之役,與張遼、樂進共拒孫權十萬之眾。卒年三十六,曹操痛之。',
    en: 'Style name Mancheng, of Juye in Shanyang. He loved learning from youth, given to poetry and the classics; men spoke of him as a man of stature. He campaigned with Cao Cao and earned much credit without contesting it, ceding glory to his peers; the gentry honored him. At Hefei he stood with Zhang Liao and Le Jin against Sun Quan\'s hundred thousand. He died at thirty-six; Cao Cao mourned him.',
  },
  'le-jin': {
    zh: '字文謙,陽平衛國人。短小精悍,膽烈過人,曹操深嘉之。每戰必先登,所至有功。合肥之戰與張遼、李典三人共破孫權,威震江東。',
    en: 'Style name Wenqian, of Wei in Yangping. Short and tough, his courage was beyond men\'s — Cao Cao prized him deeply. He was always first to mount the wall and his marks were everywhere. At Hefei with Zhang Liao and Li Dian he broke Sun Quan and shook the south.',
  },
  'yu-jin': {
    era: { zh: '威信過於關羽', en: 'Authority Greater than Guan Yu\'s' },
    zh: '字文則,泰山鉅平人。曹操稱其有古名將之風,持軍嚴整。從征歷年,屢立戰功,封左將軍,假節鉞。襄樊之役遇水淹七軍,被關羽所擒。後孫權得之,送還曹丕。丕令於陵屋中畫關羽戰勝、于禁降伏之像,禁見之,慚恚發病而卒。',
    en: 'Style name Wenze, of Juping in Taishan. Cao Cao said he had the air of the great generals of old, stern in command. In long campaigns he won many laurels and was made General of the Left, with the Yellow Battle-axe of imperial authority. In the Xiangfan battle the flood took the seven armies and Guan Yu took him alive. Sun Quan later sent him back to Cao Pi, who had him shown a painting in a tomb-chamber — Guan Yu triumphant, Yu Jin in surrender. Yu Jin saw it, fell sick with shame, and died.',
  },
  'xu-huang': {
    era: { zh: '周亞夫之風', en: 'In the Mould of Zhou Yafu' },
    zh: '字公明,河東楊人。原楊奉部,降曹操,深見器重。性沉穩,治軍嚴明。襄樊之役救曹仁,以新募之兵,千里赴援,直破關羽圍,長驅入樊,功冠諸將。曹操贊之曰:「徐將軍真有周亞夫之風!」',
    en: 'Style name Gongming, of Yang in Hedong. Originally with Yang Feng, he submitted to Cao Cao and was greatly trusted. Deep and steady, strict in his camp. In the Xiangfan battle he marched to Cao Ren\'s relief with newly raised troops, covered a thousand li, broke Guan Yu\'s siege, and rode straight into Fancheng — the highest credit of all the generals. Cao Cao said: "General Xu has the bearing of Zhou Yafu himself!"',
  },
  'zhang-he': {
    era: { zh: '巧變無方', en: 'Master of Changeful Stratagems' },
    zh: '字儁乂,河間鄚人。原袁紹部,官渡之戰降曹操。曹操喜曰:「韓信歸漢矣!」 性巧變,善應對。隨曹真、司馬懿屢禦蜀漢,定軍山之役、街亭之役皆有大功。木門道追姜維,中蜀軍埋伏,被亂箭射死。',
    en: 'Style name Junyi, of Mo in Hejian. Originally with Yuan Shao, at Guandu he came over to Cao Cao, who rejoiced: "Han Xin has come over to Han!" Clever and changeful, swift to answer events. With Cao Zhen and Sima Yi he fought back the Shu campaigns; at Mount Dingjun and at Jieting his merit was great. Pursuing Jiang Wei in the Mumen valley he ran into an ambush and was shot down by a storm of arrows.',
  },
  'cheng-yu': {
    zh: '字仲德,東郡東阿人。漢末名士,曹操舉之,為謀士。屢獻奇策,如東阿存麥以濟饑,徐州坐鎮,赤壁勸主等。性剛烈,與滿寵、賈詡並為曹操所重。卒年八十。',
    en: 'Style name Zhongde, of Dong\'e in Dongjun. A man of name in late Han, Cao Cao raised him as a strategist. He offered many bold plans — keeping the wheat at Dong\'e to save the famine, holding Xuzhou as anchor, urging the right counsel at Red Cliffs. Fierce in temper, set with Man Chong and Jia Xu among those Cao Cao prized most. He died at eighty.',
  },
  'man-chong': {
    zh: '字伯寧,山陽昌邑人。少為督郵,治盜有名。事曹操,為汝南太守,撫流民。後鎮東南,屢禦孫權,合肥新城出自其策。為人嚴峻,然有遠略,司馬懿亦敬之。',
    en: 'Style name Boning, of Changyi in Shanyang. As a young Investigation Inspector he made his name putting down bandits. Under Cao Cao he governed Runan and gathered the wanderers; later he held the southeast and stood off Sun Quan many times — the new fort at Hefei was his plan. Stern in temper but far-sighted; even Sima Yi held him in honor.',
  },
  'tian-yu': {
    zh: '字國讓,漁陽雍奴人。少從劉備,後事公孫瓚,終歸曹操。鎮北疆,撫烏桓鮮卑數十年,以恩信見服。年七十二卒。',
    en: 'Style name Guorang, of Yongnu in Yuyang. He first followed Liu Bei, then served Gongsun Zan, and at last came to Cao Cao. He held the northern marches for decades, soothing the Wuhuan and the Xianbei through faith and grace. He died at seventy-two.',
  },
  'qian-zhao': {
    zh: '字子經,安平觀津人。少從劉備,後仕曹操。任護鮮卑校尉,擊軻比能、步度根,屢有戰功。鎮邊近三十年,胡人畏之。',
    en: 'Style name Zijing, of Guanjin in Anping. He first followed Liu Bei, then took office under Cao Cao. As Colonel-Protector of the Xianbei he struck Kebi Neng and Budugen and earned merit many times. Nearly thirty years on the wall, the Hu tribes feared him.',
  },
  'yan-liang': {
    zh: '河北名將,袁紹部下。武勇絕倫,沮授嘗止勿用,謂其器小,不可獨任。建安五年白馬之戰,關羽於萬軍中策馬刺之,刎其首歸,人莫敢當。',
    en: 'A famed general of the north under Yuan Shao. Of peerless martial prowess. Ju Shou warned against using him alone, thinking his temper too narrow. In 200 at White Horse, Guan Yu rode through the host, ran him through, took his head, and came back — and none dared stand in the way.',
  },
  'wen-chou': {
    zh: '河北名將,與顏良齊名。延津之戰,亦為關羽所斬。袁紹河北雙璧,旬月之間俱亡,士氣大喪。',
    en: 'A famed general of the north, set beside Yan Liang. At Yanjin Guan Yu also cut him down. Within a month the twin jewels of Yuan Shao\'s north were both gone, and the army\'s spirit was broken.',
  },
  'tian-feng': {
    zh: '字元皓,鉅鹿人。袁紹謀主。屢諫袁紹勿輕舉,袁紹不聽,反惡之。官渡之敗,袁紹歸,左右賀曰:「田豐當喜矣。」 紹羞恚,賜豐死。豐臨死曰:「大丈夫生於天地,不知其主,而為之死,亦命也!」 一代奇才,死於庸主。',
    en: 'Style name Yuanhao, of Julu. Chief strategist of Yuan Shao. He often warned Yuan Shao against rash action; Yuan Shao would not hear and grew to hate him. After the rout at Guandu the camp said: "Tian Feng will be glad." Yuan Shao, in his shame and rage, sent down a draught of death. At the end Tian Feng sighed: "A great man born between heaven and earth — and he could not see his own master, but died for him. So be it!" A peerless talent, killed by a dim lord.',
  },
  'ju-shou': {
    zh: '廣平人。袁紹監軍。屢諫袁紹勿輕戰、勿分權於郭圖,皆不見納。官渡兵敗,沮授被擒,曹操故人也,操欲降之。授曰:「叔父、母弟皆在袁氏,願以一死報之。」 後謀逃歸,被殺。',
    en: 'Of Guangping. Inspector of the Army under Yuan Shao. He often warned Yuan Shao against rash war and against splitting power with Guo Tu — none was heeded. At Guandu he was taken alive; an old friend of Cao Cao, who hoped to bring him over. Ju Shou said: "My uncle and brothers are with the Yuan house. Let me die to repay them." When he later tried to escape back, he was killed.',
  },
  'shen-pei': {
    zh: '字正南,魏郡陰安人。袁紹忠謀。守鄴城,城破被執,寧死不降,顧北而拜,以項曰:「我君在北,不可使我西向死!」 慷慨就刑,世以為烈。',
    en: 'Style name Zhengnan, of Yin\'an in Wei. A loyal counselor of Yuan Shao. He held Ye city to the end; when the wall fell and he was taken he would not yield, faced north and bowed: "My lord is in the north — let me not die facing the west!" He went to the block bold of voice, and the world counted him a martyr.',
  },
  'guo-tu': {
    zh: '潁川人。袁紹幕士。屢進讒言,排擠田豐、沮授。官渡之敗,又進讒於袁譚,殺張郃、高覽,終致兄弟相爭,袁氏因之而亡。袁譚之敗,郭圖死於亂兵。',
    en: 'Of Yingchuan. A counselor of Yuan Shao. He whispered against Tian Feng and Ju Shou and pushed them aside. After Guandu he poisoned Yuan Tan\'s ear, drove off Zhang He and Gao Lan, and in the end set brother against brother — the Yuan house fell from this. When Yuan Tan was beaten, Guo Tu died in the rout.',
  },
  'xun-you': {
    era: { zh: '荀軍師', en: 'Counselor Xun the Younger' },
    zh: '字公達,潁川潁陰人,荀彧之姪。少有名於潁川。事曹操,為軍師,凡十二大奇策。性深沉,密謀不洩。曹操贊曰:「孤與荀公達周遊二十餘年,未嘗有毫毛可非者也!」 卒年五十八。',
    en: 'Style name Gongda, of Yingyin in Yingchuan, nephew of Xun Yu. From youth a name in his home county. Under Cao Cao he served as army strategist and gave a dozen great wonders of counsel. Deep and close in temper, his secrets never leaked. Cao Cao praised: "Twenty years I have travelled with Gongda, and I have never found a hair to fault in him!" He died at fifty-eight.',
  },
  'kong-rong': {
    era: { zh: '建安七子', en: 'One of the Seven Masters of Jian\'an' },
    zh: '字文舉,孔子二十世孫,魯國人。少有奇才,十歲讓梨,弱冠以辭辯名於世,「孔融讓梨」,千古傳為美談。任北海相時,招賢納士,以禮樂教民。後入朝仕漢,直言極諫,屢諷曹操。曹操患之,以「不孝」之罪殺之,並夷其家。',
    en: 'Style name Wenju, twentieth-generation descendant of Confucius, of Lu. Of rare talent in childhood — at ten he gave up the larger pear to his elder brothers, and the "Kong Rong yielding the pear" became a tale of all ages. In his youth he made his name in disputation. As Chancellor of Beihai he gathered worthies and taught the people through ritual and music. Later at court under Han he spoke straight without restraint and mocked Cao Cao again and again. Cao Cao took the affront and killed him on a charge of "unfilial conduct," wiping out his whole household.',
  },
  'cai-yong': {
    era: { zh: '蔡中郎', en: 'Cai the Palace Cavalier' },
    zh: '字伯喈,陳留圉人,蔡文姬之父。漢末大儒,博學多才,通音律、算數、書法、辭賦。靈帝時與盧植校書東觀,作《熹平石經》,刻五經於太學門外。董卓專政,蔡邕被脅入朝,卓敗,王允下之獄。允欲全之,蔡邕請刺面斷足以續漢史,允不許,死於獄中,年六十一。',
    en: 'Style name Bojie, of Yu in Chenliu, father of Cai Wenji. The great scholar of late Han — broad in learning, master of music, arithmetic, calligraphy, and rhapsody. Under Emperor Ling, with Lu Zhi he edited the texts at the East Watchtower and wrote the Xiping Stone Classics, carved at the gate of the Imperial Academy. When Dong Zhuo seized power, Cai Yong was forced to court; when Dong Zhuo fell, Wang Yun threw him in prison. He asked that his face be tattooed and his feet cut off so he might finish the history of Han; Wang Yun would not allow it, and he died in jail at sixty-one.',
  },
  'wang-lang': {
    era: { zh: '曹魏老臣', en: 'Old Minister of Wei' },
    zh: '字景興,東海郯人。漢末名儒,事陶謙、孫策、曹操。學問淵博,著《周易傳》、《春秋傳》。位至司徒。演義中有諸葛亮罵死王朗於陣前一節,實則王朗病卒於洛陽,壽七十餘。',
    en: 'Style name Jingxing, of Tan in Donghai. A famed Han scholar; he served Tao Qian, Sun Ce, and Cao Cao in turn. Of deep learning, he wrote Commentary on the Book of Changes and on the Spring and Autumn Annals. He rose to Excellency over the Masses. In the Romance Zhuge Liang curses him to death in the battle-line; in fact he died at Luoyang of illness, past seventy.',
  },
  'hua-xin': {
    zh: '字子魚,平原高唐人。漢末名士,管寧之友。少時與管寧同坐讀書,寧見金而不視,華歆拾而後棄,寧由是與之割席。後事孫策、曹操,位至司徒。鋒銳善斷,曹丕篡漢之議多其手筆。卒年七十五。',
    en: 'Style name Ziyu, of Gaotang in Pingyuan. A famed gentleman of late Han, friend of Guan Ning. As a youth he sat with Guan Ning reading; when a piece of gold rolled by, Guan Ning would not look, while Hua Xin picked it up and threw it away — from this Guan Ning cut their mat in two and parted. He later served Sun Ce and Cao Cao, rising to Excellency over the Masses. Quick and sharp in decision, much of Cao Pi\'s usurpation papers came from his hand. He died at seventy-five.',
  },
  'yang-biao': {
    zh: '字文先,弘農華陰人,楊修之父。四世太尉之家。漢末忠臣,屢諫董卓、李傕。曹操執政,佯歎不仕,以躲鋒鏑。卒年八十四。',
    en: 'Style name Wenxian, of Huayin in Hongnong, father of Yang Xiu. Of a house that held the Grand Marshalship for four generations. A loyal minister of late Han, he remonstrated with Dong Zhuo and Li Jue. When Cao Cao held power he feigned weariness and would not serve, to keep clear of the blade. He died at eighty-four.',
  },
  'he-jin': {
    zh: '字遂高,南陽宛人。何皇后之兄,屠家出身。漢靈帝崩,為大將軍輔政。欲誅十常侍,袁紹勸召董卓入京。陳琳、曹操諫:「鬮中取栗,何必牽虎入室!」 何進不聽,終為宦官設計入宮殺之,京師大亂,董卓乘隙入主,漢室遂崩。',
    en: 'Style name Suigao, of Wan in Nanyang. Brother of Empress He, born of a butcher\'s house. When Emperor Ling died he became Grand Marshal and regent. Meaning to wipe out the Ten Attendants, Yuan Shao urged him to call Dong Zhuo to the capital. Chen Lin and Cao Cao warned: "To pick a chestnut out of the ashes — why drag a tiger into the room?" He would not listen, and at the eunuchs\' plot he was killed in the palace; the capital fell into chaos, Dong Zhuo seized the chance, and the Han line crumbled.',
  },
  'lu-zhi': {
    era: { zh: '海內大儒', en: 'Grand Scholar of the Realm' },
    zh: '字子幹,涿郡涿人。少從馬融學,博學多通。劉備、公孫瓚皆其門生。漢末為北中郎將,征黃巾,以法持身,不與宦官左豐通賄,被誣免官。後復起為尚書,直諫董卓廢立,獨身敢言。退隱涿郡,卒於上谷。',
    en: 'Style name Zigan, of Zhuojun. Trained under Ma Rong from youth, broadly learned. Both Liu Bei and Gongsun Zan were his pupils. In late Han, as Northern General of the Household Cavalry, he marched against the Yellow Turbans; standing on the law, he refused to bribe the eunuch Zuo Feng and was slandered out of office. Reinstated as Director of the Imperial Secretariat, he alone dared rebuke Dong Zhuo over the deposing of an emperor. He retired to Zhuojun and died in Shanggu.',
  },
  'huangfu-song': {
    era: { zh: '漢末名將', en: 'Famed General of Late Han' },
    zh: '字義真,安定朝那人。漢末三大將之一。中平元年破張角弟張寶於下曲陽,張梁於廣宗,皇甫嵩、朱儁、盧植並稱平亂三將。性沉穩公正,持軍嚴整,所過秋毫無犯。雖功蓋海內,而不矜其功,士林歎其有古名將之風。',
    en: 'Style name Yizhen, of Chaona in Anding. One of the three great generals of late Han. In 184 he broke Zhang Bao at Xiaquyang and Zhang Liang at Guangzong — and with Zhu Jun and Lu Zhi was named one of the Three Generals who put down the rising. Steady and just in temper, stern in command, his army troubled not a hair of the countryside through which it passed. Though his merit covered the realm, he would not boast — and the gentry sighed that he had the air of the great captains of old.',
  },
  // ─── 三國新增列傳 第四批 (Three Kingdoms — batch 4) ───
  'liu-biao': {
    era: { zh: '荊州八駿', en: 'One of the Eight Stalwarts of Jingzhou' },
    zh: '字景升,山陽高平人。漢室宗親,八俊之一,身長八尺餘,溫文儒雅。漢末單騎入宜城,定荊州八郡,撫綏士民。坐擁雄兵十萬而保境安民,不思進取;曹操、袁紹相爭,皆遣使結之,表猶豫不從。建安十三年病卒,二子琦、琮爭嗣,曹操南下,荊州瓦解。',
    en: 'Style name Jingsheng, of Gaoping in Shanyang. A kinsman of the Han house, one of the "Eight Stalwarts" of his generation, eight chi tall, gentle and scholarly. In the closing years of Han he rode alone into Yicheng, settled the eight commanderies of Jingzhou, and tamed the people. With a hundred thousand under arms, he chose to guard his borders rather than advance; when Cao Cao and Yuan Shao were locked in war and both sent to him, he hesitated and joined neither. He died in 208; his sons Qi and Cong fell to fighting for the heirship, and when Cao Cao came south Jingzhou crumbled.',
  },
  'liu-zhang': {
    zh: '字季玉,江夏竟陵人,劉焉之子。承父業為益州牧。性闇弱,委政於張松、法正而不能裁。內懼張魯,外恐曹操,聞劉備之名而迎之入蜀。劉備反客為主,圍成都數月,劉璋出降,遷居公安。劉備憐之,以全其家。',
    en: 'Style name Jiyu, of Jingling in Jiangxia, son of Liu Yan. He inherited the post of Inspector of Yi province. Dim and weak, he handed government to Zhang Song and Fa Zheng but could not rein them in. Inwardly afraid of Zhang Lu and outwardly afraid of Cao Cao, on the name of Liu Bei he welcomed him in. Liu Bei turned guest into master, laid siege to Chengdu for months, and Liu Zhang came out to surrender; he was moved to Gong\'an. Liu Bei pitied him and kept his household whole.',
  },
  'tao-qian': {
    zh: '字恭祖,丹陽人。漢末徐州牧。性剛直,初與曹操為敵,張闓劫殺曹操父曹嵩,操遂屠徐州。陶謙憂懼,三讓徐州於劉備,卒於下邳,年六十三。',
    en: 'Style name Gongzu, of Danyang. Inspector of Xuzhou in the closing years of Han. Stiff and upright. He first stood against Cao Cao; when Zhang Kai killed Cao Cao\'s father Cao Song, Cao Cao put Xuzhou to the sword. Tao Qian in fear three times offered Xuzhou to Liu Bei and died at Xiapi, sixty-three years old.',
  },
  'han-sui': {
    zh: '字文約,金城人。涼州大豪。漢末與馬騰並起,擾關隴二十餘年。曹操西征,韓遂與馬超合,渭南之戰被曹操用反間計,與馬超相疑而敗。後再起,終為部將閻行刺殺,年七十餘。',
    en: 'Style name Wenyue, of Jincheng. A great chief of Liang province. In the closing years of Han he rose with Ma Teng and harried the Guan-Long region for more than twenty years. When Cao Cao came west, Han Sui joined Ma Chao; at Weinan, Cao Cao set the counter-trick between them, and they fell out and were broken. He rose again; in the end his captain Yan Xing killed him, past seventy.',
  },
  'ma-teng': {
    zh: '字壽成,扶風茂陵人。馬援之後,母為羌女。割據涼州,雄踞西陲。建安七年入朝拜衛尉,留質許都。子馬超起兵反曹,馬騰、馬休、馬鐵父子兄弟,皆被夷滅,家門盡誅。',
    en: 'Style name Shoucheng, of Maoling in Fufeng. A descendant of Ma Yuan, his mother a Qiang. He held Liang province as his own. In 202 he came to court and was made Commandant of the Imperial Guards, his family held in the capital as hostage. When his son Ma Chao rose against Cao Cao, Ma Teng, Ma Xiu, Ma Tie — father and brothers — were all put to the sword; the whole gate was wiped out.',
  },
  'gongsun-yuan': {
    zh: '字文懿,遼東公孫度之孫。承伯父康之業,景初元年自稱燕王,叛魏。司馬懿率四萬眾征之,渡遼水,圍襄平,城破,父子俱被斬,公孫氏遼東之業遂亡。',
    en: 'Style name Wenyi, grandson of Gongsun Du of Liaodong. He took up his uncle Kang\'s house and in 237 proclaimed himself King of Yan, rising against Wei. Sima Yi led forty thousand against him, crossed the Liao River, laid siege to Xiangping; the city fell, father and son were beheaded, and the house of Gongsun in Liaodong was ended.',
  },
  'gongsun-kang': {
    zh: '字未詳,公孫度之子。父死,自領遼東。建安十二年袁尚、袁熙北奔遼東,公孫康畏曹操,斬二袁首級送許都。曹操喜,封襄平侯。',
    en: 'Style name unknown, son of Gongsun Du. When his father died he took Liaodong. In 207 Yuan Shang and Yuan Xi fled north into Liaodong; Gongsun Kang, fearing Cao Cao, beheaded both Yuans and sent the heads to Xudu. Cao Cao was delighted and made him Marquis of Xiangping.',
  },
  'chen-gong': {
    era: { zh: '智囊', en: 'Bag of Wisdom' },
    zh: '字公台,東郡人。少有大志。曹操為東郡太守時釋之,後因曹操殺呂伯奢全家,大失所望,棄之而去。與張邈共迎呂布,奪兗州,使曹操幾失根本。下邳之圍,陳宮獻策不為呂布所納,城破被擒。曹操念舊欲赦之,陳宮昂然就死,曰:「請出就刑,以明軍法!」 自走赴刑,曹操為之流涕。',
    en: 'Style name Gongtai, of Dongjun. Of high resolution from youth. When Cao Cao was Governor of Dongjun he let him go after the killing at Lü Boshe\'s house, then walked away in disgust. With Zhang Miao he welcomed Lü Bu and seized Yanzhou — Cao Cao nearly lost his base. In the siege of Xiapi, Chen Gong\'s counsel was not heard; the city fell and he was taken. Cao Cao thought of old days and would have spared him; Chen Gong walked tall to the block: "Take me to my execution — let the army\'s law be clear!" He walked there of his own foot, and Cao Cao wept.',
  },
  'chen-lin': {
    zh: '字孔璋,廣陵射陽人。建安七子之一。原仕何進、袁紹,為袁紹作《討曹操檄》,列舉操之罪狀,辭氣激切,操讀之頭風頓愈。袁紹敗,陳琳歸曹操,操不咎舊事,使典文書。卒於建安二十二年瘟疫。',
    en: 'Style name Kongzhang, of Sheyang in Guangling. One of the Seven Masters of Jian\'an. He served first He Jin, then Yuan Shao; the Proclamation Against Cao Cao he wrote for Yuan Shao laid out Cao\'s crimes — Cao Cao read it and his migraine cleared on the spot. After Yuan Shao\'s defeat Chen Lin went over to Cao Cao, who held no grudge and put him to the keeping of letters. He died in the plague of 217.',
  },
  'chen-deng': {
    era: { zh: '湖海之士', en: 'A Man of the Rivers and Seas' },
    zh: '字元龍,下邳淮浦人,陳珪之子。豪氣絕倫。鎮廣陵,擊破孫策、嚴白虎,屢設奇計。劉備嘗評之:「元龍湖海之士,豪氣不除。」 早卒,年三十九,曹操深歎其才。',
    en: 'Style name Yuanlong, of Huaipu in Xiapi, son of Chen Gui. A man of unmatched magnificence. Holding Guangling he broke Sun Ce and Yan Baihu by many a clever stratagem. Liu Bei once said: "Yuanlong is a man of the rivers and seas — there is no curing his magnificence." He died young at thirty-nine; Cao Cao sighed deeply for the talent lost.',
  },
  'chen-gui': {
    zh: '字漢瑜,下邳淮浦人,陳登之父。漢末名士,呂布欲與袁術結親,陳珪用反間計使之絕婚,呂布之勢由此孤。位至沛相。',
    en: 'Style name Hanyu, of Huaipu in Xiapi, father of Chen Deng. A famed gentleman of late Han. When Lü Bu would marry into the Yuan Shu house, Chen Gui set a counter-trick that broke the match, and Lü Bu was left isolated. He rose to Chancellor of Pei.',
  },
  'li-yan': {
    era: { zh: '蜀漢顧命', en: 'Co-Regent of Shu' },
    zh: '字正方,後改名李平,南陽人。原劉璋部,降劉備有大功。劉備臨終於白帝,以諸葛亮為丞相,李嚴副之,共輔後主。後因北伐運糧失期,假傳詔旨歸過於亮,事敗被廢為庶民,流徙梓潼。聞諸葛亮卒於五丈原,慟哭發病而死,曰:「亮在,猶可望恕;亮死,吾無望矣!」',
    en: 'Style name Zhengfang, later renamed Li Ping, of Nanyang. Originally with Liu Zhang, he submitted to Liu Bei with great credit. On his deathbed at Baidi, Liu Bei made Zhuge Liang chancellor and Li Yan deputy, joint regents of the young emperor. Later, on a northern campaign, his grain trains came late; he forged an imperial edict to pin the blame on Zhuge Liang. When uncovered, he was reduced to commoner and sent to Zitong. Hearing that Zhuge Liang had died at Wuzhang Plains, he wept until he fell sick and died: "While Liang lived I could still hope for pardon; with Liang gone, there is no hope for me."',
  },
  'li-hui': {
    zh: '字德昂,建寧俞元人。蜀漢南中名臣。諸葛亮南征,李恢為庲降都督,撫綏夷漢。亮卒後,鎮南中十餘年,百姓安樂,夷漢相親。',
    en: 'Style name De\'ang, of Yuyuan in Jianning. A famed minister of Shu in the south. In Zhuge Liang\'s southern campaign Li Hui was made Director of the Pacification Command and gentled both barbarian and Han. After Zhuge Liang\'s death he held the south for over a decade — the people lived in ease and the tribes and Han drew close.',
  },
  'jian-yong': {
    zh: '字憲和,涿郡人。劉備同郡之友,從之周旋,以辯才見稱。劉備圍成都,簡雍單騎入城,說劉璋出降,蜀人謂之「不戰而下成都」。蜀漢建國後拜昭德將軍,以雅量名於士林。',
    en: 'Style name Xianhe, of Zhuojun. A friend of Liu Bei from the same county, he went with him through all his wanderings, famed as a quick tongue. When Liu Bei laid siege to Chengdu, Jian Yong rode in alone, persuaded Liu Zhang to surrender, and people said: "He took Chengdu without a fight." After Shu was founded he was made General of Manifest Virtue, and his composure was a name among the gentry.',
  },
  'sun-qian': {
    zh: '字公祐,北海人。鄭玄推薦於劉備,自此周旋輾轉,事先主二十年。與糜竺、簡雍並為劉備座上客,以辭令見稱。劉備定益州後,以為秉忠將軍,早卒。',
    en: 'Style name Gongyou, of Beihai. Recommended to Liu Bei by Zheng Xuan, he travelled with him for twenty years through every flight. With Mi Zhu and Jian Yong he was one of the three honored guests of Liu Bei\'s seat, famed for his speech. After Yi province was taken he was made General Who Upholds Loyalty, but died young.',
  },
  'mi-zhu': {
    zh: '字子仲,東海朐人。世為徐州大族,巨富。陶謙臨終以徐州托劉備,糜竺從之。劉備失徐州,糜竺以家財助之,二人不離。劉備定益州,糜竺位安漢將軍,班諸葛亮之右。其弟糜芳守江陵,降吳,糜竺自縛請罪,慚恚發病而卒。',
    en: 'Style name Zizhong, of Qu in Donghai. His house had been great in Xuzhou for generations, immensely wealthy. When Tao Qian on his deathbed gave Xuzhou to Liu Bei, Mi Zhu followed him. When Liu Bei lost Xuzhou, Mi Zhu poured out his fortune to help him, and the two were inseparable. After Yi province was won, Mi Zhu was made General Who Pacifies Han, ranked above Zhuge Liang. When his brother Mi Fang held Jiangling and gave it to Wu, Mi Zhu bound himself and asked to die; he fell sick with shame and rage and died.',
  },
  'mi-fang': {
    zh: '糜竺之弟。劉備之妻舅。守南郡江陵,呂蒙白衣渡江,糜芳與傅士仁不戰而降。關羽腹背受敵,荊州盡失,後又被擒。劉備伐吳,糜芳懼罪,殺傅士仁奔吳,孫權重之。後劉備擒之,押回成都,凌遲處死。',
    en: 'Younger brother of Mi Zhu, and brother-in-law to Liu Bei. He held Jiangling in Nanjun. When Lü Meng made his white-robed crossing, Mi Fang and Fu Shi-ren yielded without a fight; Guan Yu was caught front and back, and Jingzhou was lost. Later in Liu Bei\'s eastern campaign, Mi Fang in fear killed Fu Shi-ren and ran back to Wu; Sun Quan prized him. Eventually Liu Bei took him, sent him back to Chengdu, and had him torn apart.',
  },
  'cai-mao': {
    zh: '字德珪,襄陽人。劉表妻舅,荊州大族。與張允共統荊州水軍。曹操南征,劉琮降,蔡瑁、張允亦從之。曹操命督水軍。周瑜遣蔣幹過江,以離間之計使曹操疑蔡瑁、張允,操即斬之,赤壁水軍由此大失。',
    en: 'Style name Degui, of Xiangyang. Brother-in-law to Liu Biao and head of a great Jingzhou clan. With Zhang Yun he commanded the river fleet of Jingzhou. When Cao Cao came south and Liu Cong yielded, Cai Mao went with him, and Cao Cao put him in charge of the fleet. Zhou Yu sent Jiang Gan across the river with a counter-trick; Cao Cao took the bait and beheaded Cai Mao and Zhang Yun, and his fleet at Red Cliffs lost its commanders.',
  },
  'kuai-yue': {
    zh: '字異度,襄陽中廬人。漢末名士。劉表入荊州,蒯越獻計平諸宗賊,定荊州八郡。後勸劉琮降曹,曹操喜得蒯越過於得荊州,曰:「不喜得荊州,喜得蒯異度耳!」 封樊亭侯。',
    en: 'Style name Yidu, of Zhonglu in Xiangyang. A famed gentleman of late Han. When Liu Biao went into Jingzhou, Kuai Yue laid the plot that broke the bandit clans and settled the eight commanderies. He later urged Liu Cong to surrender. Cao Cao said: "I am not so glad to have Jingzhou as I am to have Kuai Yidu." He was made Marquis of Fanting.',
  },
  'kuai-liang': {
    zh: '字子柔,蒯越之兄。襄陽名士,佐劉表平荊州。性沉靜,知治民。卒於襄陽。',
    en: 'Style name Zirou, elder brother of Kuai Yue. A famed gentleman of Xiangyang, he helped Liu Biao settle Jingzhou. Quiet and steady, skilled in governance. He died at Xiangyang.',
  },
  'han-xuan': {
    zh: '字未詳,長沙太守。性急躁,屢殺降將。趙雲取長沙,黃忠為太守將,與雲戰百合不分勝負。韓玄疑黃忠有異心,欲斬之,魏延救之,殺韓玄獻城,蜀漢遂有長沙。',
    en: 'Style name unknown, Governor of Changsha. Quick of temper, he often killed those who surrendered. When Zhao Yun came against Changsha, Huang Zhong, as commander under him, fought Zhao Yun a hundred bouts without victor. Han Xuan, suspecting Huang Zhong of disloyalty, would have killed him; Wei Yan saved him, killed Han Xuan, and offered the city — and so Shu took Changsha.',
  },
  'jin-xuan': {
    zh: '武陵太守。劉備平荊南四郡,張飛攻武陵,金旋出戰,被張飛刺於馬下。',
    en: 'Governor of Wuling. When Liu Bei pacified the four southern commanderies, Zhang Fei attacked Wuling; Jin Xuan rode out, and Zhang Fei ran him through.',
  },
  'liu-du': {
    zh: '桂陽太守。劉備平荊南,趙雲攻桂陽,劉度遣子劉賢出戰,賢敗被擒。劉度遂降,以郡降劉備。',
    en: 'Governor of Guiyang. When Liu Bei pacified the south, Zhao Yun marched on Guiyang; Liu Du\'s son Liu Xian rode out, was beaten and taken. Liu Du then yielded and gave the commandery to Liu Bei.',
  },
  'jia-kui': {
    zh: '字梁道,河東襄陵人。事曹操、曹丕、曹叡三世。鎮豫州,擊吳有功。性剛直,屢忤權貴。臨終目不暝,曰:「逆賊未除,死有遺恨!」 曹叡聞之痛悼。',
    en: 'Style name Liangdao, of Xiangling in Hedong. He served Cao Cao, Cao Pi, and Cao Rui in turn. Garrisoning Yu province he beat Wu and earned credit. Stiff and upright, he clashed often with the great. On his deathbed his eyes would not close: "The rebels are not yet wiped out — there is grief in this death!" Cao Rui mourned bitterly when he heard.',
  },
  'he-yan': {
    era: { zh: '玄學祖師', en: 'Founding Master of the Mysterious Learning' },
    zh: '字平叔,何進之孫。母尹氏為曹操所納,何晏遂為操養子,娶曹操女金鄉公主。儀容美麗,粉面如玉,世稱「傅粉何郎」。注《老子》、《論語》,開玄學一派。高平陵之變,從曹爽被誅,夷三族。',
    en: 'Style name Pingshu, grandson of He Jin. His mother Lady Yin was taken by Cao Cao, and so He Yan grew up as Cao Cao\'s adopted son and married his daughter, the Princess of Jinxiang. Of beautiful appearance, his face white as powder — they called him "Powder-Face Master He." He wrote commentaries on the Daodejing and the Analects, founding the Mysterious Learning. In the Gaopingling coup, falling with Cao Shuang, he was killed and three branches of his clan extinguished.',
  },
  'wang-bi': {
    era: { zh: '少年天才', en: 'Boy Genius' },
    zh: '字輔嗣,山陽高平人。少而穎悟,十餘歲即注《老子》、《周易》,深得清談之理。與何晏、夏侯玄並為玄學三宗。年二十四而卒,後世惜之。',
    en: 'Style name Fusi, of Gaoping in Shanyang. A prodigy in childhood. In his early teens he wrote commentaries on the Daodejing and the Book of Changes, deeply at home in the pure discourse. With He Yan and Xiahou Xuan he founded the three schools of Mysterious Learning. He died at twenty-four; later ages mourned the loss.',
  },
  'ruan-ji': {
    era: { zh: '竹林七賢', en: 'One of the Seven Sages of the Bamboo Grove' },
    zh: '字嗣宗,陳留尉氏人,阮瑀之子。竹林七賢之首。喜長嘯,能青白眼,凡所惡者以白眼相向,所善者以青眼。母喪,飲酒食肉,送葬時始大慟,吐血數升。司馬昭欲與婚,阮籍醉六十日,使不得言而止。著《詠懷詩》,寄意深遠,千古傳誦。',
    en: 'Style name Sizong, of Weishi in Chenliu, son of Ruan Yu. First of the Seven Sages of the Bamboo Grove. He loved to whistle long and could turn the eye to dark or pale at will — those he disliked got the pale eye, those he loved the dark. At his mother\'s funeral he ate meat and drank wine; only when the bier was carried out did he weep, vomiting blood. When Sima Zhao would have wed his daughter into his house, Ruan Ji stayed drunk for sixty days until no word could be spoken — and the matter was let drop. His Songs of My Heart, deep in meaning, are read to this day.',
  },
  'ji-kang': {
    era: { zh: '廣陵散絕', en: 'The Guangling Tune is Lost Forever' },
    zh: '字叔夜,譙國銍人。竹林七賢之一,以琴名世。長身玉立,風儀高曠。鍛鐵自娛,鄙視名利。鍾會慕之,不為禮,鍾會懷恨,進讒於司馬昭。嵇康為呂安事被捕,臨刑顧視日影,索琴彈《廣陵散》,曲終歎:「《廣陵散》於今絕矣!」 從容就死,年四十。',
    en: 'Style name Shuye, of Zhi in Qiao. One of the Seven Sages of the Bamboo Grove, famed as a master of the qin. Tall and shining of bearing, lofty and free. He worked iron for his amusement and despised name and gain. Zhong Hui came to honor him; Ji Kang would not give him a proper greeting, and Zhong Hui took the slight and whispered against him to Sima Zhao. Caught up in the Lü An affair, on the day of his death he watched the shadow of the sun, called for the qin, and played the "Guangling Tune." At the end he sighed: "The Guangling Tune is lost from this day forth!" Calmly he went to the block at forty.',
  },
  'shan-tao': {
    zh: '字巨源,河內懷縣人。竹林七賢之一。事司馬氏,位至司徒。性沉雅,有大度。嵇康臨刑,以子託之,曰:「巨源在,汝不孤矣。」 山濤撫之如己子。',
    en: 'Style name Juyuan, of Huai county in Henei. One of the Seven Sages of the Bamboo Grove. He served the Sima house and rose to Excellency over the Masses. Steady and refined, of great composure. Before going to the block Ji Kang entrusted his son to him: "While Juyuan lives, you shall not be orphaned." Shan Tao raised the boy as his own.',
  },
  'xiang-xiu': {
    zh: '字子期,河內懷縣人。竹林七賢之一。注《莊子》,獨出新意,郭象集其大成。性溫雅,喜談玄。',
    en: 'Style name Ziqi, of Huai county in Henei. One of the Seven Sages of the Bamboo Grove. He wrote a fresh commentary on the Zhuangzi; Guo Xiang would later complete the work upon his foundation. Mild and refined, fond of pure conversation.',
  },
  'liu-ling': {
    zh: '字伯倫,沛國人。竹林七賢之一,以好酒著稱。常坐鹿車,攜一壺酒,使人荷鋤隨之,曰:「死便埋我!」 著《酒德頌》,千古傳誦。',
    en: 'Style name Bolun, of Pei. One of the Seven Sages of the Bamboo Grove, famed beyond all others for love of wine. He would ride out in a deer-cart with a jar of wine, a servant with a spade behind him: "If I die, bury me where I fall!" His "Praise of the Virtue of Wine" is read forever.',
  },
  'ruan-xian': {
    zh: '字仲容,阮籍之姪。竹林七賢之一,以琴名世。創阮咸樂器,後世稱「阮」。性放達,與群豬共飲於甕。',
    en: 'Style name Zhongrong, nephew of Ruan Ji. One of the Seven Sages of the Bamboo Grove, famed as a master of the qin. He created the long-necked lute called the ruanxian, still named "ruan" after him. So free in spirit he once drank from a wine-vat together with a herd of pigs.',
  },
  'wang-rong': {
    zh: '字濬沖,琅琊臨沂人,王戎,竹林七賢中最年少者。父早卒,以孝聞。事晉,位至司徒。性貪吝,自種好李,鬻之而恐人得其種,鑽其核。世以為儉吝之最。',
    en: 'Style name Junchong, of Linyi in Langya, the youngest of the Seven Sages of the Bamboo Grove. His father died young and he was famed for filial piety. Under Jin he rose to Excellency over the Masses. Yet of grasping temper — he grew fine plums, and when he sold them he bored out the pits for fear others would plant his stock. The world held him the meanest miser of the age.',
  },
  'yang-feng': {
    zh: '原李傕部將。漢末擁獻帝東歸洛陽,與韓暹、董承共護駕。曹操迎獻帝於許,楊奉、韓暹叛走,後為劉備所擒,亂中死。',
    en: 'Originally a captain under Li Jue. In late Han he carried Emperor Xian east to Luoyang with Han Xian and Dong Cheng, escorting the train. When Cao Cao took the emperor to Xu, Yang Feng and Han Xian deserted; later Liu Bei took him, and he died in the chaos.',
  },
  'han-xian': {
    zh: '原白波賊。與楊奉共護獻帝東歸。後與楊奉俱叛,事敗,死於亂中。',
    en: 'Originally a Whitewave bandit. He escorted Emperor Xian east with Yang Feng. He deserted with him in the end, and died in the chaos.',
  },
  'dong-cheng': {
    zh: '漢室外戚,獻帝舅。建安五年受獻帝衣帶詔,聯王子服、種輯、馬騰、劉備等謀誅曹操。事洩,夷三族。',
    en: 'An imperial in-law of Han, uncle to Emperor Xian. In 200 he received the secret sash-edict and joined with Wang Zifu, Zhong Ji, Ma Teng, and Liu Bei to plot Cao Cao\'s death. The plot was uncovered; three branches of his clan were extinguished.',
  },
  'li-jue': {
    zh: '字稚然,北地泥陽人。董卓部將。卓死,賈詡勸之合郭汜攻長安,大破呂布,殺王允,擁獻帝。與郭汜爭權,長安大亂,獻帝東出。建安三年為段煨所斬,夷三族。',
    en: 'Style name Zhiran, of Niyang in Beidi. A captain of Dong Zhuo. When Dong Zhuo fell, Jia Xu urged him to join Guo Si in striking back at Chang\'an; they broke Lü Bu, killed Wang Yun, and held Emperor Xian. He fell out with Guo Si, threw Chang\'an into chaos, and the emperor escaped east. In 198 Duan Wei beheaded him and three branches of his clan were extinguished.',
  },
  'guo-si': {
    zh: '張掖人。董卓部將。與李傕同據長安,挾持獻帝。後相攻不已,獻帝東出,二人尾追,曹陽之戰大敗。建安二年為部將伍習所殺。',
    en: 'Of Zhangye. A captain of Dong Zhuo. With Li Jue he held Chang\'an and seized Emperor Xian. They fell to fighting each other endlessly, and when the emperor escaped east the two pursued him; they were broken at the battle of Caoyang. In 197 his captain Wu Xi killed him.',
  },
  'fan-chou': {
    zh: '董卓部將,涼州人。與李傕、郭汜共害王允,後為李傕所殺。',
    en: 'A captain of Dong Zhuo, of Liang province. With Li Jue and Guo Si he killed Wang Yun; later Li Jue killed him.',
  },
  'duan-wei': {
    zh: '武威姑臧人。董卓部將,後事曹操。建安三年斬李傕父子,送首許都,封關內侯。',
    en: 'Of Guzang in Wuwei. A captain of Dong Zhuo, who later served Cao Cao. In 198 he beheaded Li Jue and his sons and sent the heads to Xudu; he was made Marquis within the Pass.',
  },
  'niu-fu': {
    zh: '董卓婿。從卓鎮陝。卓死,部下叛,牛輔慌走,為親信所殺。',
    en: 'Son-in-law of Dong Zhuo. He held Shaan for his father-in-law. When Dong Zhuo fell and his men rebelled, Niu Fu fled in panic and was killed by his own confidant.',
  },
  'liu-yan': {
    zh: '字君郎,江夏竟陵人。漢室宗親。獻策漢靈帝置州牧以鎮地方,自請為益州牧,藉以避亂。後割據西川,卒於興平元年,子劉璋繼業。',
    en: 'Style name Junlang, of Jingling in Jiangxia. A kinsman of the Han house. He proposed to Emperor Ling that "Inspectors" be promoted to "Governors" to hold the provinces, and asked the post of Yi province for himself, using it to escape the chaos. He set up his own house in the western country and died in 194; his son Liu Zhang took up the line.',
  },
  'liu-yao': {
    zh: '字正禮,東萊牟平人。漢室宗親。為揚州刺史,鎮曲阿。孫策渡江,被破走豫章,病卒。',
    en: 'Style name Zhengli, of Mouping in Donglai. A kinsman of the Han house. He was Inspector of Yangzhou and held Qu\'a. When Sun Ce crossed the river he broke him, and Liu Yao fled to Yuzhang and died of illness.',
  },
  'liu-qi': {
    zh: '荊州刺史劉表長子。為蔡氏所忌,問計於諸葛亮,亮以「申生在內而亡,重耳在外而安」對之,劉琦遂求出為江夏太守,得自全。劉表卒,劉琦聞之大慟。後曹操南下,劉琦從劉備走夏口,聯吳抗曹。赤壁後嗣立為荊州牧,旋病卒。',
    en: 'Eldest son of Liu Biao, Inspector of Jingzhou. Hated by Lady Cai, he asked Zhuge Liang what to do; Zhuge Liang replied with the example of Shen Sheng who stayed in and died, and Chong\'er who went out and lived. Liu Qi at once sought to be made Governor of Jiangxia and was kept whole. When Liu Biao died, Liu Qi wept bitterly. When Cao Cao came south he went with Liu Bei to Xiakou and joined Wu against Cao. After Red Cliffs he was set up as Inspector of Jingzhou and soon died of illness.',
  },
  'huang-zu': {
    zh: '江夏太守。劉表部下。孫堅伐荊州,黃祖伏弩射殺之。後孫權三征江夏,黃祖兵敗被擒,孫權斬之以祭父靈。',
    en: 'Governor of Jiangxia, under Liu Biao. When Sun Jian came up against Jingzhou, Huang Zu set crossbows in ambush and killed him with a shaft. Later Sun Quan marched on Jiangxia three times, broke Huang Zu, took him alive, and beheaded him to offer to his father\'s spirit.',
  },
  'su-fei': {
    zh: '黃祖部將。甘寧落魄時,蘇飛厚待之,薦於黃祖。後甘寧降吳,黃祖見擒於孫權,蘇飛亦被擒,甘寧為其求情,得免一死。',
    en: 'A captain under Huang Zu. When Gan Ning was at his lowest, Su Fei treated him richly and recommended him to Huang Zu. Later, when Gan Ning had gone over to Wu and Huang Zu had been taken by Sun Quan, Su Fei was also caught; Gan Ning pleaded for him, and his life was spared.',
  },
  'liu-yu': {
    zh: '字伯安,東海郯人,漢室宗親。鎮幽州,寬厚得民心,胡漢敬之。公孫瓚惡其德高,興兵殺之,夷其家,北疆士民痛之。',
    en: 'Style name Bo\'an, of Tan in Donghai, a kinsman of the Han house. Holding You province, he was broad-hearted and won the people; Hu and Han alike honored him. Gongsun Zan, hating that his virtue stood so high, raised troops and killed him, wiping out his household — and the people of the north grieved.',
  },
  'mi-heng': {
    era: { zh: '擊鼓罵曹', en: 'Drumming and Cursing Cao Cao' },
    zh: '字正平,平原人。少有才,狂傲不羈,孔融薦之曹操。操召見,衊辱座中,操使為鼓吏,禰衡裸體擊鼓罵曹,曹操恨而不殺,送之劉表;劉表又遣之黃祖,終為黃祖所殺,年僅二十六。',
    en: 'Style name Zhengping, of Pingyuan. From youth gifted, wild and unbridled. Kong Rong recommended him to Cao Cao. At the audience he humiliated all present; Cao Cao set him as a drum-officer, whereupon Mi Heng stripped naked, drummed, and cursed Cao Cao to his face. Cao Cao hated him but would not kill him and sent him on to Liu Biao; Liu Biao sent him on to Huang Zu, and Huang Zu killed him at twenty-six.',
  },
  'jiao-chu': {
    zh: '黃巾餘黨,號「角虎」。中平年間擾青州。後降曹操,封列侯。',
    en: 'A leftover Yellow Turban, called the "Horned Tiger." In the Zhongping years he harried Qing province; later he submitted to Cao Cao and was made a marquis.',
  },
  'guan-hai': {
    zh: '黃巾餘黨。聚眾圍北海,孔融求救於劉備。太史慈單騎突圍出,劉備引兵至,關亥為關羽所斬。',
    en: 'A leftover Yellow Turban. He gathered his men to besiege Beihai; Kong Rong sent to Liu Bei for help. Taishi Ci broke out alone, Liu Bei brought his men up, and Guan Hai was cut down by Guan Yu.',
  },
  'pei-yuanshao': {
    zh: '黃巾餘黨。據山林為盜,後遇關羽,聞義氣,折節歸之,常從關羽護送二嫂。後麥城之難,從關羽戰死。',
    en: 'A leftover Yellow Turban. He held the hills as a bandit until he met Guan Yu, was moved by his sense of right, bent his neck, and followed him — always at the side of the two ladies under Guan Yu\'s care. In the Maicheng disaster he died at Guan Yu\'s side.',
  },
  'bo-cai': {
    zh: '潁川黃巾大帥。中平元年攻潁川,大敗朱儁。後皇甫嵩、曹操合擊,大破之於長社,波才死於亂中。',
    en: 'A great Yellow Turban commander of Yingchuan. In 184 he attacked Yingchuan and broke Zhu Jun. When Huangfu Song and Cao Cao joined to strike him at Changshe, his army was shattered and he himself died in the rout.',
  },
  'liu-pi': {
    zh: '汝南黃巾餘黨。劉備自袁紹處南奔依之。後為曹仁、夏侯惇所破殺。',
    en: 'A leftover Yellow Turban of Runan. When Liu Bei left Yuan Shao\'s camp and turned south he came to him. Cao Ren and Xiahou Dun later broke and killed him.',
  },
  'gong-du': {
    zh: '汝南黃巾餘黨。從劉辟,後為曹操所破而死。',
    en: 'A leftover Yellow Turban of Runan, with Liu Pi. Cao Cao broke and killed him.',
  },
  // ─── 三國新增列傳 第五批 (Three Kingdoms — batch 5) ───
  'xu-shu': {
    era: { zh: '元直走馬薦諸葛', en: 'Yuanzhi on Horseback Recommends Zhuge' },
    zh: '字元直,潁川人。少好擊劍,為人報仇被捕,得救改名單福。從司馬徽學,與諸葛亮、龐統交厚。事劉備於新野,獻計破曹仁八門金鎖陣。曹操聞其名,囚其母以召之;徐庶辭劉備而北行,走馬薦諸葛於前。終身在魏不為設一謀,以全孝子之心。',
    en: 'Style name Yuanzhi, of Yingchuan. In his youth he loved the sword and went into hiding under a false name "Shan Fu" after killing a man in revenge. He studied under Sima Hui and became close to Zhuge Liang and Pang Tong. He served Liu Bei at Xinye and laid the plan that broke Cao Ren\'s Eight-Gate Golden Lock formation. When Cao Cao heard of him, he seized his mother to call him in. Xu Shu took his leave of Liu Bei and, riding north, turned in the saddle to recommend Zhuge Liang one last time. In Wei he gave Cao Cao not one stratagem to his dying day, that the heart of a filial son be kept whole.',
  },
  'liu-feng': {
    zh: '原羅侯寇氏子,劉備義子。隨諸葛亮、張飛入蜀,有戰功,鎮上庸。關羽北伐,呼劉封、孟達出兵相援,二人託詞不發。關羽敗死,劉封又與孟達不睦,被達誘叛魏,封獨還成都。劉備責之,且諸葛亮慮其剛猛難制,終勸劉備賜死。劉備為之流涕。',
    en: 'Originally a son of the Kou clan, lords of Luo, adopted by Liu Bei. He went into Shu with Zhuge Liang and Zhang Fei, won credit, and held Shangyong. When Guan Yu marched north and called on Liu Feng and Meng Da to support him, both made excuses. After Guan Yu\'s death, Liu Feng fell out with Meng Da, who turned him toward Wei; Liu Feng alone fled back to Chengdu. Liu Bei rebuked him, and Zhuge Liang, fearing his fierce temper would be too hard to rein in, urged Liu Bei to send down a draught of death. Liu Bei wept for him.',
  },
  'guan-ping': {
    zh: '關羽長子。隨父鎮荊州,助父出征襄樊,水淹七軍,擒于禁、斬龐德,父子之名震華夏。荊州陷後,隨父走麥城,父子俱被孫權所執。臨刑面不變色,從容就死,與父同葬於漳鄉。',
    en: 'Eldest son of Guan Yu. He held Jingzhou at his father\'s side and joined the Xiangfan campaign, the drowning of the seven armies, the capture of Yu Jin, and the killing of Pang De — father and son shook all China together. When Jingzhou fell he followed his father to Maicheng; the two were taken together by Sun Quan. At the block his colour did not change; calmly he died, and was buried with his father at Zhangxiang.',
  },
  'huo-jun': {
    zh: '字仲邈,南郡枝江人。劉備入蜀,以霍峻守葭萌關。劉璋將扶禁、向存以萬餘人圍之,峻以數百人拒之一年,出其不意,大破之,陣斬向存。劉備聞之大喜,擢為梓潼太守。早卒,劉備親臨弔哭。',
    en: 'Style name Zhongmiao, of Zhijiang in Nanjun. When Liu Bei marched into Shu, Huo Jun was set to hold Jiameng Pass. Liu Zhang\'s captains Fu Jin and Xiang Cun came up with over ten thousand and laid siege; Huo Jun with a few hundred held them off for a year, then struck out by surprise, broke them utterly, and beheaded Xiang Cun. Liu Bei in great joy made him Governor of Zitong. He died young; Liu Bei came in person to his bier.',
  },
  'wu-lan': {
    zh: '蜀漢將。劉備伐漢中,以吳蘭、雷銅為前鋒,與曹洪相持。中曹洪、曹休伏兵,陣亡。',
    en: 'A Shu officer. In Liu Bei\'s Hanzhong campaign, with Lei Tong he was set in the van against Cao Hong. They walked into Cao Hong and Cao Xiu\'s ambush and were killed.',
  },
  'leigh-tong': {
    zh: '蜀漢將。與吳蘭同為先鋒,共陣亡於漢中之役。',
    en: 'A Shu officer. With Wu Lan in the van, he died in the same Hanzhong ambush.',
  },
  'gao-pei': {
    zh: '劉璋部將。守白水關。劉備與龐統用計襲取,高沛被斬,劉備遂得長驅入蜀。',
    en: 'A captain of Liu Zhang. Holding Baishui Pass, he was struck down by Liu Bei and Pang Tong\'s ruse, and Liu Bei drove on into Shu unchecked.',
  },
  'yang-yi': {
    zh: '字威公,襄陽人。事關羽,後從劉備、諸葛亮。性狹隘,與魏延不睦。諸葛亮死於五丈原,楊儀總攬軍事,設計殺魏延。後因不得繼諸葛亮之任,口出怨言,被廢為庶人,流徙漢嘉,自殺。',
    en: 'Style name Weigong, of Xiangyang. He served Guan Yu and then Liu Bei and Zhuge Liang. Narrow in temper, he and Wei Yan did not get on. When Zhuge Liang died at Wuzhang Plains, Yang Yi took the command and laid the plot that killed Wei Yan. Later, denied the chancellorship that he had hoped to inherit, he muttered words of grievance; reduced to commoner and exiled to Hanjia, he killed himself.',
  },
  'xu-jing': {
    zh: '字文休,汝南平輿人。漢末名士,與從弟許劭並有人物之名。從劉璋避亂入蜀。劉備定蜀,以為左將軍長史,後拜司徒。年七十餘卒,諸葛亮親往弔之。',
    en: 'Style name Wenxiu, of Pingyu in Runan. A famed gentleman of late Han, ranked with his cousin Xu Shao as a great judge of men. He went into Shu with Liu Zhang to escape the chaos. When Liu Bei settled Shu he made him Chief Clerk to the General of the Left, and later Excellency over the Masses. He died past seventy; Zhuge Liang came in person to mourn.',
  },
  'liu-ba': {
    zh: '字子初,零陵烝陽人。少有奇才。曹操定荊州,劉巴歸之,曹操使其撫劉璋部下。後事劉備,任尚書令,鑄直百錢以穩定物價,蜀漢初年財用得寬。諸葛亮稱其「運籌策於帷幄之中,吾不如子初」。卒於章武二年。',
    en: 'Style name Zichu, of Zhengyang in Lingling. Of rare talent in youth. When Cao Cao took Jingzhou, Liu Ba went over to him and was sent to win Liu Zhang\'s men. Later he served Liu Bei as Director of the Imperial Secretariat; his minting of the Hundred-cash coin steadied prices and gave early Shu room to breathe. Zhuge Liang said: "In drawing strategies within the tent, I am not the equal of Zichu." He died in 222.',
  },
  'qiao-zhou': {
    era: { zh: '蜀中孔子', en: 'The Confucius of Shu' },
    zh: '字允南,巴西西充國人。蜀漢碩儒。著《仇國論》,主和反戰。鄧艾兵臨成都,譙周勸後主降,蜀漢遂亡。後人毀譽不一,然其學問深廣,門徒陳壽、文立、李密等皆名重於晉。',
    en: 'Style name Yunnan, of Xichongguo in Baxi. The grand scholar of Shu. He wrote the Discourse on Enemy States, urging peace against war. When Deng Ai came up to the gates of Chengdu, Qiao Zhou pressed the Second Emperor to surrender — and Shu was ended. Later ages have spoken both for and against him; but his learning was vast, and his pupils — Chen Shou, Wen Li, Li Mi — all rose to high name under Jin.',
  },
  'huang-hao': {
    era: { zh: '禍蜀之宦', en: 'The Eunuch Who Ruined Shu' },
    zh: '蜀漢宦官。後主寵幸,日盛於後宮。董允在世,黃皓不敢為非;允卒,皓內外勾結,搆陷姜維,致蜀漢人心離散。鄧艾入蜀,皓賄郤正勸後主降,後主從之。蜀漢亡,皓被司馬昭凌遲處死。',
    en: 'A eunuch of Shu. The Second Emperor doted on him and his power grew daily in the inner palace. While Dong Yun lived, Huang Hao dared do no evil; when Dong Yun died he wove webs within and without, slandered Jiang Wei, and tore the kingdom\'s spirit apart. When Deng Ai came in, he bribed Xi Zheng to urge the emperor to yield, and the emperor yielded. After Shu fell, Sima Zhao had Huang Hao torn apart.',
  },
  'chen-zhi': {
    zh: '字奉宗,汝南人。蜀漢後期執政,後主寵之。與黃皓互為表裏,排擠姜維,弊政叢生。延熙年卒於官。',
    en: 'Style name Fengzong, of Runan. A late Shu chancellor, doted on by the Second Emperor. He and Huang Hao were inside and outside of one body, drove off Jiang Wei, and bred bad government. He died in office in the Yanxi years.',
  },
  'du-qiong': {
    zh: '字伯瑜,蜀郡成都人。蜀漢儒臣。任太常。性沉默寡言,術數占候皆精。',
    en: 'Style name Boyu, of Chengdu in Shu. A Confucian minister of Shu, Minister of Ceremonies. Quiet and sparing of speech, expert in arithmancy and astrology.',
  },
  'lai-min': {
    zh: '字敬達,義陽新野人。蜀漢儒臣。任輔軍將軍。性放達好直言,屢忤後主,終以言被廢。',
    en: 'Style name Jingda, of Xinye in Yiyang. A Confucian minister of Shu, General Who Supports the Army. Free in temper and fond of plain speech, he clashed often with the Second Emperor and at last was dismissed for his words.',
  },
  'liao-li': {
    zh: '字公淵,武陵臨沅人。少有才名,諸葛亮稱其「龐統之亞」。後因怨言被貶為民,流徙汶山。聞諸葛亮死,大慟。',
    en: 'Style name Gongyuan, of Linyuan in Wuling. From youth a name of repute; Zhuge Liang called him "next to Pang Tong." Later, for muttered words of grievance, he was reduced to commoner and exiled to Wenshan. When Zhuge Liang died he wept bitterly.',
  },
  // Wu mid-tier
  'xu-sheng-wu': {
    zh: '字文嚮,琅琊莒人。投孫權,以勇略稱。守柴桑,屢禦曹魏。曹丕南征,徐盛於江岸築木城百里,如真城然,曹丕望之歎曰:「魏雖有武騎千群,無所用之!」 引兵而退。',
    en: 'Style name Wenxiang, of Ju in Langya. He came over to Sun Quan and was famed for boldness. Holding Chaisang, he beat back Wei many times. When Cao Pi marched south, Xu Sheng built a hundred li of timber walls along the bank that looked like a real city; Cao Pi gazed at them and sighed: "Though Wei has a thousand troops of horse, I can put them to no use here!" He led his army back.',
  },
  'dong-zhao': {
    zh: '字公仁,濟陰定陶人。曹操謀士。漢末勸曹操迎獻帝於許,定大計。後位至司徒。性深沉,有遠略。卒年八十一。',
    en: 'Style name Gongren, of Dingtao in Jiyin. A strategist of Cao Cao. In late Han he urged Cao Cao to escort the emperor to Xu, fixing the great policy. Later he rose to Excellency over the Masses. Deep and far-sighted. He died at eighty-one.',
  },
  'mao-jie': {
    zh: '字孝先,陳留平丘人。曹操謀士。性清廉公正,主吏部選舉,所薦皆清明之士。坐崔琰之獄,被免歸家,卒。',
    en: 'Style name Xiaoxian, of Pingqiu in Chenliu. A strategist of Cao Cao. Clean and just; in charge of the selection of officials, the men he recommended were all upright. Caught up in the Cui Yan affair, he was dismissed to his home and died.',
  },
  'cui-yan': {
    zh: '字季珪,清河東武城人。曹操幕士。儀容偉麗,鬚長四尺,曹操甚畏之。直諫不阿,觸怒曹操,被下獄賜死,士林惜之。',
    en: 'Style name Jigui, of Dongwucheng in Qinghe. A counselor of Cao Cao. Of majestic appearance, beard four chi long; Cao Cao stood in awe of him. He remonstrated straight and would not flatter; angering Cao Cao, he was thrown into prison and made to die. The gentry mourned him.',
  },
  'ren-jun': {
    zh: '字伯達,河南中牟人。曹操謀士。獻屯田之策,使許下倉廩盈滿,曹操強兵之本實基於此。位至長水校尉。',
    en: 'Style name Boda, of Zhongmou in Henan. A strategist of Cao Cao. He gave the plan of the agricultural colonies; the granaries of Xu were filled, and Cao Cao\'s strength was founded on this. He rose to Colonel of the Long Waters.',
  },
  'jiang-ji': {
    zh: '字子通,楚國平阿人。事曹氏四世,以智謀稱。從司馬懿發高平陵之變,後悔曰:「孤負曹爽矣!」 憂憤而卒。',
    en: 'Style name Zitong, of Ping\'e in Chu. He served four generations of the Cao house, famed for wisdom. He joined Sima Yi in the Gaopingling coup, then repented: "I have failed Cao Shuang!" He died of grief and rage.',
  },
  'gao-rou': {
    zh: '字文惠,陳留圉人。事曹氏四世,執掌廷尉二十餘年,以平反冤獄稱,獄無留滯。位至司空。卒年九十。',
    en: 'Style name Wenhui, of Yu in Chenliu. He served four generations of the Cao house, holding the Court Steward\'s office for over twenty years; famed for reversing wrongful judgments, no case was left to rot. He rose to Excellency over the Works. He died at ninety.',
  },
  'du-ji': {
    zh: '字伯侯,京兆杜陵人。曹操幕士,出為河東太守,治民有方,十六年間政化大行。位至尚書僕射。',
    en: 'Style name Bohou, of Duling in the metropolitan region. A counselor of Cao Cao, he was sent out as Governor of Hedong; his rule was wise and in sixteen years the people\'s ways were changed. He rose to Vice-Director of the Imperial Secretariat.',
  },
  'du-shu': {
    zh: '字務伯,杜畿之子。少有令名,事曹魏,以直言被誣免官。',
    en: 'Style name Wubo, son of Du Ji. From youth a name of repute, he served Wei; slandered for his plain speech, he was dismissed.',
  },
  'chen-tai': {
    zh: '字玄伯,潁川許昌人,陳群之子。事曹魏,鎮關中,屢卻姜維。性正直,不附權貴。高貴鄉公被殺,陳泰大哭曰:「殺天子者,司馬昭也!」 旋憂憤而卒。',
    en: 'Style name Xuanbo, of Xu in Yingchuan, son of Chen Qun. He served Wei, holding Guanzhong and beating back Jiang Wei many times. Upright by nature, attached to no faction. When the Duke of Gaogui — Emperor Mao — was killed, Chen Tai wept aloud: "He who killed the Son of Heaven is Sima Zhao!" Soon after, he died of grief and rage.',
  },
  'wei-guan': {
    zh: '字伯玉,河東安邑人。事曹魏、司馬氏。鄧艾、鍾會滅蜀,衛瓘監軍,事後收殺二人,獨還洛陽。事晉,位至太保。八王之亂中為楚王瑋所殺。',
    en: 'Style name Boyu, of Anyi in Hedong. He served Wei and the Sima house. When Deng Ai and Zhong Hui broke Shu, Wei Guan was Inspector of the Army; he had them both killed afterward and rode back alone to Luoyang. Under Jin he rose to Grand Mentor. In the War of Eight Princes, Prince Wei of Chu killed him.',
  },
  'jia-chong': {
    zh: '字公閭,平陽襄陵人。司馬昭智囊。高貴鄉公率殿中宿衛攻司馬昭,賈充令成濟弒之。司馬炎即位,封魯郡公,位至太尉。其女賈南風為惠帝皇后,八王之亂禍源。',
    en: 'Style name Gonglü, of Xiangling in Pingyang. Sima Zhao\'s brain. When the Duke of Gaogui led the palace guards out against Sima Zhao, it was Jia Chong who told Cheng Ji to strike the emperor down. When Sima Yan took the throne, Jia Chong was made Duke of Lu commandery and rose to Grand Marshal. His daughter Jia Nanfeng became Empress of Emperor Hui — the wellspring of the War of Eight Princes.',
  },
  'shi-bao': {
    zh: '字仲容,渤海南皮人。事司馬氏,鎮南將軍。鎮淮南二十年,屢禦吳。武帝以為大司馬,封樂陵郡公。',
    en: 'Style name Zhongrong, of Nanpi in Bohai. He served the Sima house as General Who Pacifies the South. Twenty years he held Huainan and beat back Wu. Emperor Wu made him Marshal of State and Duke of Leling commandery.',
  },
  'du-yu': {
    era: { zh: '武庫', en: 'The Armory' },
    zh: '字元凱,京兆杜陵人,杜預。博學多通,世稱「杜武庫」,無所不曉。鎮西大將軍,主謀伐吳。咸寧五年率軍渡江,連克江陵、武昌,長驅直入,旬月之間吳亡。喜《左氏春秋》,自稱「左傳癖」,著《春秋左氏經傳集解》,千古不刊。',
    en: 'Style name Yuankai, of Duling in the metropolitan region. Vastly learned and skilled in all things, the world called him "Du the Armory." As Grand General Who Garrisons the West, he was chief planner of the war on Wu. In 279 he led his army across the river, took Jiangling and Wuchang in one breath, drove straight on, and within a month Wu was undone. He loved the Zuo Commentary on the Spring and Autumn Annals and called himself a "Zuo Commentary addict." His Collected Notes on the Spring and Autumn Annals and Its Zuo Tradition has never gone out of use.',
  },
  'wang-jun': {
    era: { zh: '樓船下益州', en: 'The Tower-Ships Came Down from Yizhou' },
    zh: '字士治,弘農湖人。少有大志。為益州刺史,建造樓船,長百二十步,可載二千人,號為「樓船之冠」。咸寧六年順流而下,直撲建業,「千尋鐵鎖沉江底,一片降幡出石頭」,孫皓出降。後人賦之,千古傳誦。',
    en: 'Style name Shizhi, of Hu in Hongnong. Of high resolution from youth. As Inspector of Yi province he built tower-ships a hundred and twenty paces long, each carrying two thousand — first in the world. In 280 he sailed downstream straight on Jianye; "the thousand-fathom iron chains sank to the river bed, a single flag of surrender came out of Shitou" — and Sun Hao yielded. The verse is read forever.',
  },
  'wang-hun': {
    zh: '字玄沖,太原晉陽人。晉伐吳,與杜預、王濬分道下江南。性矜伐,與王濬爭功不已。武帝兩無所偏,二人皆封郡公。',
    en: 'Style name Xuanchong, of Jinyang in Taiyuan. In the Jin war on Wu he marched down with Du Yu and Wang Jun. Proud and contentious, he wrangled with Wang Jun for credit endlessly. Emperor Wu took neither side; both were made dukes of commanderies.',
  },
  'sun-hao': {
    era: { zh: '吳末帝', en: 'Last Emperor of Wu' },
    zh: '字元宗,孫權之孫,孫和之子。永安七年立。初頗有為,後沉湎酒色,殘殺臣下,鑿人眼，剝人面,吳國上下離心。天紀四年晉伐吳,孫皓銜璧降,送之洛陽,封歸命侯,卒於四年後。',
    en: 'Style name Yuanzong, grandson of Sun Quan and son of Sun He. Set on the throne in 264. He began with promise, then drowned in wine and women, gouged out eyes, flayed faces, and the heart of Wu turned away from him. In 280 the Jin marched against Wu and Sun Hao came forth bearing the jade seal; sent to Luoyang as Marquis of Returned Allegiance, he died four years later.',
  },
  'sun-he': {
    era: { zh: '南陽王', en: 'Prince of Nanyang' },
    zh: '字子孝,孫權第三子。孫登卒,立為太子。性仁孝。後與孫霸爭嫡,二宮之爭起,被廢為庶人,後賜死。其子孫皓即位,追尊文皇帝。',
    en: 'Style name Zixiao, third son of Sun Quan. After Sun Deng died he was made crown prince. Kind and filial. Later, locked in the Strife of the Two Palaces with Sun Ba, he was reduced to commoner and then to death. When his son Sun Hao took the throne, he raised him posthumously to Emperor Wen.',
  },
  'sun-deng': {
    zh: '字子高,孫權長子。立為太子,有令名,孫權所深愛。年三十三早卒,孫權哭之至痛,曰:「天乎,何奪吾子之速!」',
    en: 'Style name Zigao, eldest son of Sun Quan. Made crown prince, of high name, beloved of his father. He died at thirty-three; Sun Quan wept till his voice broke: "O Heaven — why take my son so soon?"',
  },
  'sun-liang': {
    zh: '字子明,孫權少子。年十歲嗣位,孫綝擅權,廢為會稽王,後又貶為侯官侯,自殺。',
    en: 'Style name Ziming, youngest son of Sun Quan. He came to the throne at ten; Sun Chen seized power and deposed him to Prince of Kuaiji, then reduced him to Marquis of Houguan, where he killed himself.',
  },
  'sun-xiu': {
    era: { zh: '吳景帝', en: 'Emperor Jing of Wu' },
    zh: '字子烈,孫權第六子。永安元年立。性好學,博覽群書。誅孫綝,收吳國權柄。在位七年崩。',
    en: 'Style name Zilie, sixth son of Sun Quan. Set on the throne in 258. Fond of learning, broad in his reading. He killed Sun Chen and took back the reins of state. He reigned seven years and died.',
  },
  'sun-jun': {
    zh: '字子遠,孫權姪孫。誅諸葛恪,執政。性陰險殺人不眨眼。為孫綝之從兄,死後孫綝繼之。',
    en: 'Style name Ziyuan, great-nephew of Sun Quan. He killed Zhuge Ke and took the regency. Sinister, who killed without blinking. Cousin to Sun Chen, who succeeded him at his death.',
  },
  'ding-feng': {
    zh: '字承淵,廬江安豐人。少從甘寧征戰,長於騎射。雪夜短兵,大破諸葛誕援兵於東興,聲威大震。後從孫休誅孫綝,功著吳國。',
    en: 'Style name Chengyuan, of Anfeng in Lujiang. He campaigned with Gan Ning from youth, master of horse and bow. In a snowy night he stripped off his armor and broke Zhuge Dan\'s relief force at Dongxing — his fame shook the realm. He later helped Sun Xiu put down Sun Chen, of great credit to Wu.',
  },
  'lu-dai': {
    zh: '字定公,廣陵海陵人。事孫權四十年。鎮交州,平士氏,撫蠻夷。性嚴整,行軍有度。年九十六卒。',
    en: 'Style name Dinggong, of Hailing in Guangling. Forty years he served Sun Quan. Holding Jiao province, he settled the Shi clan and gentled the southern tribes. Stern and ordered in command. He died at ninety-six.',
  },
  // Wei mid-tier
  'cao-zhang': {
    era: { zh: '黃鬚兒', en: 'The Yellow-Whiskered Boy' },
    zh: '字子文,曹操之子。鬚黃,曹操稱為「黃鬚兒」。少善騎射,武藝過人。北征烏桓有功。曹操卒後,曹彰問璽於曹丕,丕疑之,召之還國,後暴卒,世以為丕鴆之。',
    en: 'Style name Ziwen, son of Cao Cao. His whiskers were yellow, and Cao Cao called him his "Yellow-Whiskered Boy." Skilled with bow and horse from youth, his prowess in arms beyond men\'s. He earned credit in the northern campaign against the Wuhuan. After Cao Cao\'s death, when Cao Zhang asked after the imperial seal, Cao Pi grew suspicious, called him back to his fief, and there he died suddenly — the world said Cao Pi had poisoned him.',
  },
  'cao-rui': {
    era: { zh: '魏明帝', en: 'Emperor Ming of Wei' },
    zh: '字元仲,曹丕之子。少時聰穎,曹丕欲廢之,後感其孝乃止。在位十三年,沉毅好斷,任司馬懿、陳群、曹真。屢敗諸葛亮北伐,平公孫淵。然好土木,起宮室,百姓苦之。年三十五崩,以幼子曹芳託司馬懿、曹爽。',
    en: 'Style name Yuanzhong, son of Cao Pi. Sharp in youth, Cao Pi once thought of disinheriting him but was moved by his filial piety and let it pass. Thirteen years he reigned, deep and bold in judgment, trusting Sima Yi, Chen Qun, and Cao Zhen. He broke Zhuge Liang\'s northern campaigns many times and put down Gongsun Yuan. Yet he loved building — palaces rose and the people groaned. He died at thirty-five, and entrusted the boy Cao Fang to Sima Yi and Cao Shuang.',
  },
  'cao-fang': {
    zh: '字蘭卿,曹叡養子。年八歲嗣位,司馬懿、曹爽輔政。高平陵之變後司馬氏專權,正始十年司馬師廢之為齊王。卒於晉,壽四十三。',
    en: 'Style name Lanqing, adopted son of Cao Rui. He took the throne at eight, with Sima Yi and Cao Shuang as regents. After the Gaopingling coup the Sima house held all power; in 254 Sima Shi deposed him to Prince of Qi. He died under Jin at forty-three.',
  },
  'cao-mao': {
    era: { zh: '高貴鄉公', en: 'Duke of Gaogui Township' },
    zh: '字彥士,曹丕之孫。司馬師廢曹芳,立之為帝。聰明剛烈,深疾司馬氏專權。甘露五年率殿中宿衛數百攻司馬昭,曰:「司馬昭之心,路人所知!」 為賈充所率成濟所弒,年僅二十,血濺殿階。',
    en: 'Style name Yanshi, grandson of Cao Pi. When Sima Shi deposed Cao Fang, he was set on the throne. Sharp and fierce, he hated bitterly the rule of the Sima house. In 260 he led some hundreds of palace guards against Sima Zhao crying: "The heart of Sima Zhao is known even to the passerby!" Jia Chong\'s man Cheng Ji struck him down — twenty years old, his blood across the palace steps.',
  },
  'cao-huan': {
    era: { zh: '魏元帝', en: 'Emperor Yuan of Wei' },
    zh: '字景明,曹操之孫。曹髦被弒後立。年十五嗣位,司馬昭專政。咸熙二年司馬炎逼禪,曹魏遂亡。封陳留王,卒於太康元年,壽五十八。',
    en: 'Style name Jingming, grandson of Cao Cao. Set on the throne after Cao Mao was struck down. He took the throne at fifteen, Sima Zhao holding power in his stead. In 265 Sima Yan forced abdication, and Wei was ended. He was made Prince of Chenliu and died in 280 at fifty-eight.',
  },
  'cao-shuang': {
    zh: '字昭伯,曹真之子。曹叡臨終以與司馬懿同輔曹芳。爽用何晏、鄧颺、丁謐,排斥司馬懿。正始十年司馬懿乘其出獵高平陵,起兵奪權,曹爽不戰而降,夷三族。',
    en: 'Style name Zhaobo, son of Cao Zhen. Cao Rui on his deathbed made him co-regent of Cao Fang with Sima Yi. Cao Shuang put forward He Yan, Deng Yang, and Ding Mi and pushed Sima Yi aside. In 249, while he was out at the hunt at Gaopingling, Sima Yi rose, took the city, and Cao Shuang yielded without a blow — three branches of his clan were extinguished.',
  },
  'cao-zhen': {
    zh: '字子丹,曹操族子。從征戰,有功。曹丕、曹叡兩朝大將軍。鎮關中,屢禦諸葛亮北伐。卒於太和五年。',
    en: 'Style name Zidan, a clansman of Cao Cao. He marched in many campaigns with credit. Grand Marshal under Cao Pi and Cao Rui. Holding Guanzhong, he beat back Zhuge Liang\'s northern campaigns many times. He died in 231.',
  },
  'cao-xiu': {
    zh: '字文烈,曹操族姪。從征戰,有勇略。鎮揚州,大破吳將呂範。後石亭之役為陸遜所敗,憤恚而卒。',
    en: 'Style name Wenlie, a clansman-nephew of Cao Cao. He marched in many campaigns with bold counsel. Holding Yangzhou, he broke the Wu officer Lü Fan. Later beaten by Lu Xun at Shiting, he died of rage.',
  },
  'cao-chong': {
    era: { zh: '稱象神童', en: 'The Child Who Weighed the Elephant' },
    zh: '字倉舒,曹操之子。五六歲時智意所及,有若成人。鄴下有獻象,曹操欲知象重,群臣不能,曹沖曰:「置象於船中,刻其水痕,稱物以較之,則象重可知。」 操大喜。十三歲早卒,曹操痛失麒麟兒,曰:「此我之不幸,而汝曹之幸也!」',
    en: 'Style name Cangshu, son of Cao Cao. At five or six his mind was as a grown man\'s. When an elephant was sent to Ye, Cao Cao wished to know its weight; his ministers could not answer. Cao Chong said: "Put the elephant on a boat, mark the water-line, then weigh things against it — the weight will be known." Cao Cao was overjoyed. He died at thirteen; Cao Cao mourned the loss of his unicorn-child: "This is my misfortune — and your fortune!"',
  },
  'liu-shan': {
    era: { zh: '蜀漢後主', en: 'Second Emperor of Shu' },
    zh: '字公嗣,小名阿斗,劉備之子。劉備死,即位於成都,在位四十一年。前期賴諸葛亮輔政,蜀漢治;亮卒後,寵信黃皓,蜀政日壞。鄧艾兵臨,出降。後遷洛陽,封安樂公。司馬昭嘗試之以蜀樂,禪笑曰:「此間樂,不思蜀也。」 千古「樂不思蜀」之語出此。卒年六十四。',
    en: 'Style name Gongsi, childhood name A-dou, son of Liu Bei. He took the throne at Chengdu after his father\'s death and reigned forty-one years. While Zhuge Liang held the reins, Shu was well ordered; after Zhuge Liang\'s death he doted on the eunuch Huang Hao and the government decayed. When Deng Ai came up he yielded. Moved to Luoyang as Duke of Anle, Sima Zhao tried him by setting Shu music before him; Liu Shan smiled: "It is so pleasant here — I do not think of Shu." So began the proverb "happy and thinking not of Shu." He died at sixty-four.',
  },
  'liu-yong': {
    zh: '字公壽,劉備庶子,劉禪庶弟。封魯王。蜀漢亡,隨後主遷洛陽。',
    en: 'Style name Gongshou, natural son of Liu Bei and half-brother of Liu Shan. Made Prince of Lu. When Shu fell, he went with the Second Emperor to Luoyang.',
  },
  'liu-li': {
    zh: '字奉孝,劉備庶子。封梁王。蜀漢亡後遷洛陽。',
    en: 'Style name Fengxiao, natural son of Liu Bei. Made Prince of Liang. When Shu fell, he was moved to Luoyang.',
  },
  // ─── 三國新增列傳 第六批 (Three Kingdoms — batch 6) ───
  'cao-ren': {
    era: { zh: '天人之姿', en: 'Of Heavenly Stature' },
    zh: '字子孝,沛國譙人,曹操從弟。少好弓馬,膽勇過人。從曹操征戰,屢立大功,守城最稱奇將。荊州之役以孤城拒周瑜歲餘,牙旗如山。襄樊之圍,關羽水淹七軍,曹仁守樊城,身被數創不退,士卒爭以血肉填壕。徐晃援至,內外夾擊大破關羽。位至大司馬,封陳侯。卒年五十六。',
    en: 'Style name Zixiao, of Qiao in Pei, cousin of Cao Cao. From youth a master of bow and horse, his courage beyond men\'s. He campaigned with Cao Cao and earned great laurels, but it was in the holding of cities that he stood alone. In the Jingzhou war he held a single isolated wall against Zhou Yu for more than a year, his banners standing like a mountain. In the siege of Xiangfan, when Guan Yu drowned the seven armies, Cao Ren held Fancheng under dozens of wounds and would not give way; his soldiers fought to fill the moat with their own bodies. When Xu Huang came up they struck Guan Yu from both sides and shattered him. He rose to Marshal of State and was made Marquis of Chen. He died at fifty-six.',
  },
  'cao-hong': {
    zh: '字子廉,沛國譙人,曹操族弟。少有膽烈。汴水之敗,曹操失馬,洪解馬與之,曰:「天下可無洪,不可無公!」 步行扶操過河,操由是得免。從征戰歷年,功業甚多,然性吝嗇,坐犯不法事幾死,賴卞太后救之。位至驃騎將軍。',
    en: 'Style name Zilian, of Qiao in Pei, a clansman-cousin of Cao Cao. Of fierce courage from youth. After the defeat at the Bian River, when Cao Cao had lost his horse, Cao Hong gave him his own: "The world can do without Hong, but it cannot do without you!" He helped Cao Cao on foot across the river, and Cao Cao survived. He served in many campaigns with great credit. Yet grasping in temper — caught later in a crooked matter, he was nearly put to death, and only Empress Dowager Bian saved him. He rose to General of Agile Cavalry.',
  },
  'cao-chun': {
    era: { zh: '虎豹騎', en: 'Captain of the Tiger and Leopard Cavalry' },
    zh: '字子和,曹操族弟,曹仁之弟。督虎豹騎,曹操精銳。從征,於南皮陣斬袁譚,於長坂大破劉備,擒劉備二女,所向披靡。卒於建安十五年,曹操深歎其才。',
    en: 'Style name Zihe, cousin of Cao Cao and younger brother of Cao Ren. Commander of the Tiger and Leopard Cavalry, the elite of Cao Cao\'s host. He marched with Cao Cao, beheaded Yuan Tan in the line at Nanpi, broke Liu Bei at Changban and took his two daughters captive — none could stand before him. He died in 210, and Cao Cao mourned the talent lost.',
  },
  'cao-ang': {
    zh: '字子修,曹操長子。母劉夫人。曹操征張繡,張繡降而復叛,夜襲曹營。曹操騎絕影,中流矢,曹昂以己馬與父,自步戰殿後,為亂兵所害。曹丕後為太子,實基於曹昂之死。',
    en: 'Style name Zixiu, eldest son of Cao Cao, born of Lady Liu. When Cao Cao went against Zhang Xiu, who first surrendered and then rose, in the night attack Cao Cao\'s steed Jueying was hit by an arrow. Cao Ang gave his own horse to his father and stayed afoot in the rearguard; he was cut down in the chaos. That Cao Pi later became crown prince was founded on Cao Ang\'s death.',
  },
  'bao-xin': {
    zh: '字允誠,泰山平陽人。漢末名士,與曹操為知己。董卓入京,鮑信首勸袁紹襲卓,紹不敢,信獨遣兵歸鄉。後與曹操共擊兗州黃巾,鮑信戰歿,操求其屍不得,刻木為像,大哭祭之。',
    en: 'Style name Yuncheng, of Pingyang in Taishan. A famed gentleman of late Han and intimate of Cao Cao. When Dong Zhuo entered the capital, Bao Xin first urged Yuan Shao to strike him down; Yuan Shao would not, and Bao Xin alone took his troops home. Later with Cao Cao he attacked the Yanzhou Yellow Turbans and fell in battle; Cao Cao could not find his body, carved a wooden likeness, and wept over it in offering.',
  },
  'bian-rang': {
    zh: '字文禮,陳留人。漢末名士,以辭辯名於世。曹操為兗州牧,邊讓輕之,作詩文諷之。曹操羅織其罪,夷三族,引兗州士林大震,張邈、陳宮遂迎呂布反曹,曹操幾失根本。',
    en: 'Style name Wenli, of Chenliu. A famed gentleman of late Han, known throughout the realm for elegant speech. When Cao Cao took Yanzhou, Bian Rang slighted him and wrote verses to mock him. Cao Cao wove a crime around him and put his clan to the sword to three branches — at which the Yanzhou gentry rose in horror; Zhang Miao and Chen Gong welcomed Lü Bu into revolt, and Cao Cao nearly lost his base.',
  },
  'chen-dao': {
    era: { zh: '蜀漢白毦', en: 'Captain of the White-Plume Elite' },
    zh: '字叔至,汝南人。劉備帳下大將,聲名僅次趙雲。督白毦兵,蜀中精銳,專司宿衛。鎮永安,屢禦東吳。蜀漢一柱,惜陳壽未為立傳,後人歎之。',
    en: 'Style name Shuzhi, of Runan. A great general in Liu Bei\'s house, his name second only to Zhao Yun. He led the White-Plume Elite, the choicest soldiers of Shu, charged with the personal guard. He held Yong\'an against Wu in many fights. A pillar of Shu — and it is a pity Chen Shou wrote no biography for him; later ages have sighed for it.',
  },
  'chen-shou': {
    era: { zh: '三國志作者', en: 'Author of the Records of the Three Kingdoms' },
    zh: '字承祚,巴西安漢人,譙周門人。蜀漢時為觀閣令史,以不附黃皓被廢。蜀亡入晉,為著作郎,撰《三國志》六十五卷,文筆簡潔,評論公允,世稱良史。然父為馬謖部曲,父受髡刑,陳壽為馬謖、諸葛瞻立傳,有微辭,後世亦有譏之者。',
    en: 'Style name Chengzuo, of Anhan in Baxi, pupil of Qiao Zhou. Under Shu he was a Watchtower Recorder; for refusing to attach to Huang Hao he was dismissed. After the fall of Shu he came to Jin and as Court Author wrote the Records of the Three Kingdoms in sixty-five fascicles — terse in prose and balanced in judgment; the world calls it a fine history. Yet his father had been a captain under Ma Su and had been shaved for it as punishment, and his treatment of Ma Su and Zhuge Zhan carries an edge — for which later ages have sometimes faulted him.',
  },
  'chen-zhen': {
    zh: '字孝起,南陽人。蜀漢使者。屢出使東吳,以辯才見稱,與孫權相得。位至衛尉。卒於建興十二年。',
    en: 'Style name Xiaoqi, of Nanyang. An envoy of Shu. He went many times to Wu, famed for his speech, and was on good terms with Sun Quan. He rose to Commandant of the Guards. He died in 234.',
  },
  'chen-jiao': {
    zh: '字季弼,廣陵東陽人。事曹操、曹丕、曹叡三世。鎮東吳邊境,屢敗孫權之師。位至司徒。',
    en: 'Style name Jibi, of Dongyang in Guangling. He served Cao Cao, Cao Pi, and Cao Rui in turn. Holding the eastern marches against Wu, he beat back Sun Quan\'s armies many times. He rose to Excellency over the Masses.',
  },
  'chen-lan': {
    zh: '袁術部將。袁術稱帝,與雷薄共據灊山,後與雷薄叛走潛山。建安四年,袁術潰敗,陳蘭、雷薄拒之不納。後曹操遣張遼、于禁征之,陳蘭走天柱山,被張遼擒斬。',
    en: 'A captain of Yuan Shu. When Yuan Shu took the imperial title, he held Mount Qian with Lei Bo, and then deserted to Mount Qian (Tianzhu). When Yuan Shu was broken in 199, Chen Lan and Lei Bo refused to take him in. Cao Cao later sent Zhang Liao and Yu Jin to put them down; Chen Lan fled to Mount Tianzhu and was caught and beheaded by Zhang Liao.',
  },
  'cui-jun': {
    zh: '崔琰之姪。事曹操,以孝廉舉。為東萊太守,治民有方。',
    en: 'A nephew of Cui Yan. He served Cao Cao after being raised on Filial and Incorrupt. As Governor of Donglai he ruled the people well.',
  },
  'cui-lin': {
    zh: '字德儒,清河東武城人。崔琰從弟。事曹操、曹丕,以清節稱。位至御史中丞。',
    en: 'Style name Deru, of Dongwucheng in Qinghe, cousin of Cui Yan. Under Cao Cao and Cao Pi, he was known for clean conduct. He rose to Vice-Inspector of the Censorate.',
  },
  'da-qiao': {
    era: { zh: '大喬', en: 'Da Qiao' },
    zh: '廬江皖人,喬玄之女,小喬之姊。國色天香,孫策破皖城娶之,與妹小喬同稱「江東二喬」。孫策卒,大喬青年寡居。傳赤壁之戰,曹操作銅雀台,有「攬二喬於東南」之語,周瑜以此為辭激孫權抗曹。',
    en: 'Of Wan in Lujiang, daughter of Qiao Xuan, elder sister of Xiao Qiao. Of nation-toppling beauty. When Sun Ce broke Wan he took her to wife, and the two sisters were known as the "Two Qiaos of Jiangdong." Sun Ce died young and Da Qiao was widowed in her prime. Tradition tells that Cao Cao at the Bronze Sparrow Terrace longed to "gather the two Qiaos into the southeast"; Zhou Yu used the words to stir Sun Quan against him.',
  },
  'xiao-qiao': {
    era: { zh: '小喬', en: 'Xiao Qiao' },
    zh: '廬江皖人,喬玄之少女。周瑜娶之,夫婦相得。蘇東坡《念奴嬌·赤壁懷古》「小喬初嫁了,雄姿英發」之句,千古傳誦。周瑜卒於三十六歲,小喬青年寡居。',
    en: 'Of Wan in Lujiang, younger daughter of Qiao Xuan. Zhou Yu took her to wife and the marriage was beautiful. Su Dongpo\'s lines in "Reflections on Red Cliffs" — "Xiao Qiao was newly wed, his bearing brave and bright" — have rung across the ages. Zhou Yu died at thirty-six, and Xiao Qiao was widowed in her prime.',
  },
  'deng-zhi': {
    zh: '字伯苗,義陽新野人。蜀漢使者。劉備死後,蜀吳關係惡,鄧芝出使,以利害說孫權,復通孫劉之好。後從諸葛亮北伐,以剛直見稱。位至車騎將軍。',
    en: 'Style name Bomiao, of Xinye in Yiyang. An envoy of Shu. After Liu Bei\'s death, Shu and Wu were estranged; Deng Zhi went as envoy, laid out the gains and losses to Sun Quan, and renewed the bond between Sun and Liu. He later marched with Zhuge Liang on the north, famed for stiff uprightness. He rose to General of Chariots and Cavalry.',
  },
  'dong-bai': {
    zh: '董卓之孫女。卓寵之異常,封渭陽君。卓死,被王允下獄,坐車裂,年才十五。',
    en: 'A granddaughter of Dong Zhuo. He doted on her beyond all and made her Mistress of Weiyang. When Dong Zhuo fell, Wang Yun cast her into prison and had her torn between chariots at fifteen.',
  },
  'fan-jiang': {
    zh: '張飛帳下將。閬中之變,夜與張達共割張飛首,投降孫權。劉備伐吳,孫權懼,執范彊、張達送還蜀漢,凌遲處死,以祭翼德。',
    en: 'A captain under Zhang Fei. In the Langzhong mutiny he and Zhang Da cut off Zhang Fei\'s head in the night and went over to Sun Quan. When Liu Bei marched on Wu, Sun Quan in fear sent Fan Qiang and Zhang Da back, and they were torn apart in offering to Zhang Yide\'s spirit.',
  },
  'fei-shi': {
    zh: '字公舉,江夏鄳人,費禕之父。劉備入蜀,費詩拜為前部司馬。直諫劉備不可受漢中王號,觸怒貶為永昌從事,後復起為諫議大夫。',
    en: 'Style name Gongju, of Meng in Jiangxia, father of Fei Yi. When Liu Bei came into Shu, Fei Shi was made Marshal of the Vanguard. He spoke against Liu Bei taking the title of King of Hanzhong, was thrust down to a Yongchang office, and was later raised again as Counselor.',
  },
  'fu-qian': {
    era: { zh: '蜀漢忠烈', en: 'Loyal Martyr of Shu' },
    zh: '字公琰,義陽人,傅肜之子。蜀漢將。鄧艾入蜀,傅僉守關口,蔣舒詐降,僉知其叛,猶力戰不退,殺數十人,自刎而死。父子皆死國事,世稱蜀中忠烈。',
    en: 'Style name Gongyan, of Yiyang, son of Fu Rong. A captain of Shu. When Deng Ai broke through, Fu Qian held the pass; Jiang Shu pretended to surrender, and Fu Qian, knowing the betrayal, still fought on without one step back, killed dozens, and cut his own throat. Father and son both gave their lives for the state; the world counts them martyrs of Shu.',
  },
  'fu-rong': {
    zh: '字宏才,義陽人。蜀漢將。劉備伐吳,夷陵之敗,傅肜為斷後,被吳軍圍。吳人勸降,傅肜罵曰:「吳狗,何有漢將軍降者!」 力戰而死。',
    en: 'Style name Hongcai, of Yiyang. A captain of Shu. In the Yiling rout he covered the rear, surrounded by Wu. They called him to surrender; he cursed: "Wu dogs! When has a general of Han ever yielded?" and died fighting.',
  },
  'fu-xie': {
    zh: '字南容,北地靈州人。漢末名臣。中平四年涼州羌亂,漢陽太守傅燮城陷,城中皆勸降,燮對曰:「世亂不能養浩然之氣,食人之祿,豈避其難!」 引兵出戰而死。',
    en: 'Style name Nanrong, of Lingzhou in Beidi. A famed minister of late Han. In 187 the Qiang revolt of Liang province broke open the walls of Hanyang where he governed; all in the city urged surrender. Fu Xie answered: "In a chaotic age I cannot nurture the great breath of heaven — but I have eaten the lord\'s pay; how shall I shun his trial?" He led his men out and died fighting.',
  },
  'gao-shun': {
    era: { zh: '陷陣營', en: 'Captain of the Trap-Camp' },
    zh: '呂布部將。沉默寡言,不飲酒,清廉自守。所將「陷陣營」七百餘人,號為千人,鎧甲精煉,屢攻不克者,布令陷陣營必破之。下邳之圍,呂布敗,高順被擒,寧死不降,曹操斬之。',
    en: 'A captain of Lü Bu. Silent, refused drink, and kept clean hands. His "Trap-Camp" — over seven hundred strong, called a thousand for awe\'s sake — wore picked armor; any wall that defied attack, Lü Bu would order the Trap-Camp to break, and break it they did. In the siege of Xiapi Lü Bu fell; Gao Shun was taken, refused to yield, and Cao Cao beheaded him.',
  },
  'gao-lan': {
    zh: '原袁紹將。官渡之戰,郭圖讒之,高覽與張郃共降曹操。曹操喜,皆封侯。',
    en: 'Originally a general of Yuan Shao. At Guandu, Guo Tu whispered against him; Gao Lan and Zhang He together went over to Cao Cao. Cao Cao was overjoyed and made both marquises.',
  },
  'gao-ding': {
    zh: '蜀越雋夷王。劉備死,高定與雍闓、朱褒共反。諸葛亮南征,離間其黨,殺雍闓,高定軍亂,被斬。',
    en: 'King of the Yue-Sui tribes of Shu. When Liu Bei died, Gao Ding rose with Yong Kai and Zhu Bao. Zhuge Liang in the southern campaign sowed division between them, killed Yong Kai, and in the confusion that followed Gao Ding\'s army broke and he was beheaded.',
  },
  'gu-shao': {
    zh: '字孝則,顧雍長子。少有名於江東,與陸績、龐統並稱。事孫權,為豫章太守。早卒於官。',
    en: 'Style name Xiaoze, eldest son of Gu Yong. From youth a name in Jiangdong, ranked with Lu Ji and Pang Tong. Under Sun Quan he was Governor of Yuzhang. He died young in office.',
  },
  'gu-tan': {
    zh: '字子默,顧雍之孫。事孫權,為太常。捲入二宮之爭,被流交州,卒於途中,年僅四十二。',
    en: 'Style name Zimo, grandson of Gu Yong. Under Sun Quan he was Minister of Ceremonies. Drawn into the Strife of the Two Palaces, he was exiled to Jiao province and died on the road at forty-two.',
  },
  'guan-lu': {
    era: { zh: '神卜', en: 'The Divine Diviner' },
    zh: '字公明,平原人。漢末方士,通《周易》、風角、占卜,所言無不奇驗。曾為何晏、鄧颺占曰:「鬼幽鬼躁,有死無生。」 後高平陵之變,二人果俱被誅。年僅四十八卒。',
    en: 'Style name Gongming, of Pingyuan. An adept of late Han, master of the Book of Changes, the winds, and divination — every word he spoke came true. He once cast a fortune for He Yan and Deng Yang: "Ghost-dark, ghost-restless; death is there, life is not." In the Gaopingling coup both men were killed as he had said. He died at only forty-eight.',
  },
  'guo-yuan': {
    zh: '袁紹甥。建安七年,鍾繇圍其於平陽,馬超從父馬騰遣龐德率兵助鍾繇,陣斬郭援。',
    en: 'A nephew of Yuan Shao. In 202 Zhong Yao besieged him at Pingyang; Ma Teng sent Pang De with troops to help Zhong Yao, and Pang De cut Guo Yuan down in the line.',
  },
  'han-fu': {
    zh: '字文節,潁川人。漢末冀州牧。袁紹引兵入冀州,韓馥畏之,讓州於袁紹,自走依張邈。後憂懼自殺。',
    en: 'Style name Wenjie, of Yingchuan. Inspector of Jizhou in late Han. When Yuan Shao brought troops into Ji province, Han Fu in fear ceded the post to him and went to Zhang Miao. Later, sunk in dread, he took his own life.',
  },
  'han-hao': {
    zh: '字元嗣,河內人。事曹操。屯田之策,韓浩亦預其議,鎮關中,撫流民。位至中護軍。',
    en: 'Style name Yuansi, of Henei. He served Cao Cao. He joined in the counsels of the agricultural colonies and held Guanzhong, gathering the wanderers. He rose to Inspector of the Central Guards.',
  },
  'han-song': {
    zh: '字德高,義陽人。漢末名士。劉表使其過許都察動靜,被曹操留為侍中。劉表怒,欲殺其家,蒯越止之。',
    en: 'Style name Degao, of Yiyang. A famed gentleman of late Han. Liu Biao sent him to Xudu to gauge what was afoot; Cao Cao kept him as Palace Attendant. Liu Biao in anger would have killed his household, but Kuai Yue stopped him.',
  },
  'han-zong': {
    zh: '韓玄之弟。長沙陷,韓宗從劉度奔走荊南。',
    en: 'Younger brother of Han Xuan. When Changsha fell, Han Zong went with Liu Du into the south of Jingzhou.',
  },
  'hao-meng': {
    zh: '呂布部將。建安元年起兵反呂布,夜攻下邳,布走,賴高順、曹性平之。郝萌被曹性所斬。',
    en: 'A captain of Lü Bu. In 196 he rose against Lü Bu, attacking Xiapi by night; Lü Bu fled, and Gao Shun and Cao Xing put it down. Cao Xing cut Hao Meng down.',
  },
  'he-miao': {
    zh: '何進弟,車騎將軍。何進謀誅宦官,十常侍先殺進,何苗亦為袁紹所殺,以何進舊將吳匡指其陰結中常侍。',
    en: 'Younger brother of He Jin, General of Chariots and Cavalry. When He Jin\'s plot against the eunuchs broke, the Ten Attendants killed him first; He Miao was then killed by Yuan Shao on Wu Kuang\'s charge that he had been in secret with the eunuchs.',
  },
  'he-yong': {
    zh: '字伯求,南陽人。漢末名士,清議領袖。性敏銳,評議朝政無所避。漢末党錮之禍,何顒亡命江湖,獻計袁紹,謀誅宦官。',
    en: 'Style name Boqiu, of Nanyang. A famed gentleman of late Han and a leader of the "pure judgment" gentry. Sharp-minded, he spoke against court abuses without restraint. In the Disaster of the Faction Proscription he went into hiding among the rivers and lakes, and later gave Yuan Shao the plan to wipe out the eunuchs.',
  },
  'he-qi': {
    zh: '字公苗,會稽山陰人。事孫權,屢平山越,鎮會稽十餘年,境內肅然。位至後將軍。',
    en: 'Style name Gongmiao, of Shanyin in Kuaiji. Under Sun Quan he put down the Shan Yue tribes time and again. Twenty years he held Kuaiji, and within his borders all was quiet. He rose to General of the Rear.',
  },
  'hou-cheng': {
    zh: '呂布部將。下邳之圍,呂布酗酒鞭撻部下,侯成與宋憲、魏續共執陳宮、高順,開城降曹操,呂布被擒。',
    en: 'A captain of Lü Bu. In the siege of Xiapi, when Lü Bu drank to excess and beat his men, Hou Cheng with Song Xian and Wei Xu seized Chen Gong and Gao Shun, opened the gate to Cao Cao, and Lü Bu was taken.',
  },
  'song-xian': {
    zh: '呂布部將。下邳之圍,與侯成、魏續共執陳宮、高順,開城降曹操。後從征戰。',
    en: 'A captain of Lü Bu. In the siege of Xiapi, with Hou Cheng and Wei Xu, he seized Chen Gong and Gao Shun and opened the gate to Cao Cao. He later marched with him in campaigns.',
  },
  'wei-xu': {
    zh: '呂布部將。與宋憲、侯成共開城降曹。',
    en: 'A captain of Lü Bu. With Song Xian and Hou Cheng he opened the gate to Cao Cao.',
  },
  'cao-xing': {
    zh: '呂布部將。郝萌之亂,曹性執其首歸呂布。後一目被夏侯惇射中,曹性以箭還射夏侯惇,中其左目。',
    en: 'A captain of Lü Bu. In Hao Meng\'s revolt he took his head and brought it to Lü Bu. In a later fight, hit in one eye by Xiahou Dun\'s arrow, he shot back and struck Xiahou Dun in the left eye.',
  },
  'cao-bao': {
    zh: '陶謙部將。陶謙死,劉備代之,以曹豹為下邳相。後與張飛不睦,張飛醉酒鞭之,曹豹引呂布入下邳,劉備失徐州。',
    en: 'A captain of Tao Qian. When Tao Qian died and Liu Bei took Xuzhou, Cao Bao was made Chancellor of Xiapi. He fell out with Zhang Fei, who whipped him in his cups; Cao Bao called Lü Bu into Xiapi, and Liu Bei lost his province.',
  },
  'fu-wan': {
    zh: '字叔安,東漢獻帝皇后伏壽之父。建安十九年,獻帝衣帶詔事敗後,伏皇后密書其父除曹操,事洩,曹操殺伏后及二子,夷伏氏。',
    en: 'Style name Shu\'an, father of Empress Fu Shou of Emperor Xian. In 214, after the sash-edict affair, his daughter wrote in secret to her father to be rid of Cao Cao; the plot was found out, and Cao Cao killed the empress and two of her sons, wiping out the Fu clan.',
  },
  'fu-shi': {
    zh: '伏壽,獻帝皇后。其父伏完,以衣帶詔事密謀曹操,事洩被誅,皇后被廢黜,幽閉而死,二子亦死。',
    en: 'Fu Shou, empress of Emperor Xian. When her father Fu Wan\'s plot against Cao Cao was uncovered and his line wiped out, the empress was deposed, shut up in a chamber where she died, and her two sons died with her.',
  },
  'cao-zhao': {
    zh: '曹操之子,封濟陽公。早卒。',
    en: 'A son of Cao Cao, Duke of Jiyang. He died young.',
  },
  'cao-xun': {
    zh: '曹操之子,封陽武公。早卒。',
    en: 'A son of Cao Cao, Duke of Yangwu. He died young.',
  },
  'cao-shu': {
    zh: '曹操之子,封相殤公。早卒,曹操為之傷悼。',
    en: 'A son of Cao Cao, the Sorrowful Duke of Xiang. He died young and Cao Cao mourned him.',
  },
  'cao-jiong': {
    zh: '曹操之子,封樊安公。早卒。',
    en: 'A son of Cao Cao, Duke of Fan\'an. He died young.',
  },
  'cao-lin': {
    zh: '字未詳,曹丕之子,封東海王。為人勤學,工書法。',
    en: 'Style name unknown, son of Cao Pi, Prince of Donghai. Studious in life and a master of calligraphy.',
  },
  'cao-yu': {
    zh: '字彭祖,曹操之子。封燕王。明帝臨終欲託以社稷,劉放、孫資進讒罷之。蜀漢亡後仍以燕王之爵終。',
    en: 'Style name Pengzu, son of Cao Cao, Prince of Yan. Emperor Ming on his deathbed thought to entrust him with the state; Liu Fang and Sun Zi whispered against it, and he was set aside. He kept the title of Prince of Yan to the end of his days.',
  },
  'cao-yi': {
    zh: '曹操之子,封穀城殤公。早卒。',
    en: 'A son of Cao Cao, the Sorrowful Duke of Gucheng. He died young.',
  },
  'deng-yang': {
    zh: '字玄茂,南陽新野人。曹爽之黨,與何晏、丁謐並進。高平陵之變後被司馬懿所誅,夷三族。',
    en: 'Style name Xuanmao, of Xinye in Nanyang. A man of Cao Shuang\'s faction, set forward with He Yan and Ding Mi. After the Gaopingling coup Sima Yi killed him and three branches of his clan were extinguished.',
  },
  'ding-mi': {
    zh: '曹爽謀士。與何晏、鄧颺共執朝政。高平陵之變被誅。',
    en: 'A counselor of Cao Shuang. With He Yan and Deng Yang he held the court. He was killed in the Gaopingling coup.',
  },
  'cheng-ji-sh': {
    zh: '司馬昭部將。甘露五年高貴鄉公率宿衛攻司馬昭,賈充令成濟弒之,血濺殿階。後事敗,司馬昭以成濟為罪首,夷其族以塞天下口。',
    en: 'A captain under Sima Zhao. When the Duke of Gaogui led the guards against Sima Zhao in 260, Jia Chong told Cheng Ji to strike the emperor down; the blood splashed the palace steps. After the deed Sima Zhao made him the chief criminal and wiped out his clan to silence the realm.',
  },
  'feng-ji': {
    zh: '潁川人。袁紹謀士。屢進讒言,排擠田豐、沮授。袁紹敗,逢紀構陷田豐,袁紹遂殺之。後袁譚、袁尚相爭,逢紀附袁尚,被袁譚所殺。',
    en: 'Of Yingchuan. A counselor of Yuan Shao. He whispered often against Tian Feng and Ju Shou. After Guandu he wove the slander that brought Tian Feng a draught of death. When Yuan Tan and Yuan Shang fell to fighting, Feng Ji sided with Yuan Shang and was killed by Yuan Tan.',
  },
  'feng-xi': {
    zh: '蜀漢將。隨劉備伐吳,夷陵之火,馮習、張南俱戰歿。',
    en: 'A Shu officer. He marched with Liu Bei against Wu; in the fire of Yiling, Feng Xi and Zhang Nan both fell.',
  },
  'guan-yi': {
    zh: '關羽之孫,關興之子。蜀漢亡時被龐德之子龐會滅其家,以報父讎,世以為惜。',
    en: 'Grandson of Guan Yu and son of Guan Xing. When Shu fell, Pang De\'s son Pang Hui wiped out his household in vengeance for his father — the world long held it a sad ending.',
  },
  // ─── 三國新增列傳 第七批 (Three Kingdoms — batch 7) ───
  'hua-xiong': {
    era: { zh: '溫酒斬華雄', en: 'Slain Before the Wine Cooled' },
    zh: '董卓部將,鎮汜水關。十八路諸侯討卓,華雄連斬俞涉、潘鳳,聯軍喪膽。關羽請命出戰,曹操溫酒一杯餉之,雲長提刀上馬,須臾擲華雄之首於帳前,酒尚溫。「溫酒斬華雄」千古傳為美談。',
    en: 'A captain of Dong Zhuo, holding Sishui Pass. When the eighteen princes marched against Dong Zhuo, Hua Xiong cut down Yu She and Pan Feng one after another and the coalition lost heart. Guan Yu asked leave to ride out; Cao Cao warmed a cup of wine for him, Yunchang took his blade and mounted, and in a moment threw Hua Xiong\'s head down before the tent — the wine was still warm. "Hua Xiong slain before the wine cooled" is told down the ages.',
  },
  'ji-ling': {
    zh: '袁術上將。使三尖兩刃刀,有萬夫不當之勇。屢與張飛、關羽戰於沛縣。劉備伐袁術,關羽於陣前刺紀靈於馬下。',
    en: 'A senior general of Yuan Shu. He bore a triple-pointed double-edged blade and had the courage to face ten thousand. He fought Zhang Fei and Guan Yu often at Peixian. In Liu Bei\'s war on Yuan Shu, Guan Yu unhorsed him with a spear in the battle line.',
  },
  'ji-ping': {
    era: { zh: '漢室忠醫', en: 'Loyal Physician of the Han' },
    zh: '名穆,字稱平,洛陽人。漢宮太醫。建安五年參與董承衣帶詔謀誅曹操之事。曹操患頭風,使吉平診治,平欲下毒,事洩。曹操以鐵索鞭笞,平大罵不屈,最終撞階自盡,以全漢室之忠。',
    en: 'Personal name Mu, style name Cheng-ping, of Luoyang. A court physician of Han. In 200 he joined Dong Cheng\'s sash-edict plot against Cao Cao. When Cao Cao suffered his head-wind, Ji Ping was called to treat him and meant to poison the draught; the plot leaked. Cao Cao had him whipped with iron rods; Ji Ping cursed and would not bend, and at last threw himself down the palace steps to die — that the loyalty of Han be kept whole.',
  },
  'ji-shao': {
    era: { zh: '血染御衣', en: 'Blood Across the Imperial Robe' },
    zh: '字延祖,嵇康之子。父被司馬昭所殺,山濤撫之如子,薦於武帝,事晉。八王之亂,惠帝為亂兵所迫,嵇紹以身翼蔽,被亂兵殺於御前,血濺御衣。亂定,左右欲洗其衣,惠帝曰:「此嵇侍中之血,勿浣!」 千古忠臣之冠。',
    en: 'Style name Yanzu, son of Ji Kang. When his father was killed by Sima Zhao, Shan Tao raised him as his own and recommended him to Emperor Wu. In the War of Eight Princes, when Emperor Hui was beset by mutineers, Ji Shao covered him with his body and was struck down beside the imperial seat, his blood across the robe. When the chaos was over and attendants would wash it out, Emperor Hui said: "This is the blood of Palace Attendant Ji — let it not be washed!" The greatest of loyal ministers for the ages.',
  },
  'jian-shuo': {
    zh: '東漢宦官,十常侍之一,西園八校尉首領。漢靈帝命其督諸軍,何進患之。靈帝崩,蹇碩謀殺何進立陳留王,事洩,被斬。',
    en: 'A eunuch of Later Han, one of the Ten Attendants and head of the Eight Colonels of the Western Garden. Emperor Ling charged him with the command of all the armies, and He Jin feared him. When the emperor died, Jian Shuo plotted to kill He Jin and set up the Prince of Chenliu; the plot was uncovered and he was beheaded.',
  },
  'jiang-shu': {
    zh: '蜀漢將。守關口,鄧艾兵至,蔣舒詐降,引魏軍入,蜀漢門戶大開,傅僉死戰殉國。後蜀亡,蔣舒事魏。',
    en: 'A Shu officer. Holding a pass, when Deng Ai came up he pretended to surrender and let Wei through; the gates of Shu were thrown open, and Fu Qian died in the fight for the state. When Shu fell, Jiang Shu served Wei.',
  },
  'jiang-shu-sh': {
    zh: '蜀漢將。鎮要塞,屢禦魏軍。',
    en: 'A Shu officer who held key passes and beat back Wei many times.',
  },
  'ju-yi': {
    zh: '袁紹大將。先登破公孫瓚於界橋,以八百先登步兵卒大破白馬義從。後恃功而驕,袁紹忌之,設伏殺於營中。',
    en: 'A senior general of Yuan Shao. He led the storming party that broke Gongsun Zan at Jieqiao; with eight hundred first-mounted foot he shattered the White Horse Volunteers. Later, proud of his merit, Yuan Shao took offense, laid an ambush, and killed him in his own camp.',
  },
  'kong-zhou': {
    zh: '字公緒,陳留人。漢末名士,任豫州刺史。董卓專政,孔伷與袁紹、曹操等十八路諸侯共起兵討卓。',
    en: 'Style name Gongxu, of Chenliu. A famed gentleman of late Han, Inspector of Yu province. When Dong Zhuo held the court, Kong Zhou joined Yuan Shao, Cao Cao, and the rest of the Eighteen Princes in the war against him.',
  },
  'li-feng': {
    zh: '字宣國,馮翊東縣人。事曹魏。嘉平年間與夏侯玄、張緝謀廢司馬師,事洩,被司馬師於朝堂刺殺,夷三族。',
    en: 'Style name Xuanguo, of Dongxian in Fengyi. He served Wei. In the Jiaping years he plotted with Xiahou Xuan and Zhang Ji to depose Sima Shi; the plot leaked, and Sima Shi stabbed him to death in the court hall — three branches of his clan were extinguished.',
  },
  'li-ru': {
    zh: '董卓謀士,女婿。獻廢立之策,毒鴆少帝。董卓死,李儒亦被殺。',
    en: 'A counselor of Dong Zhuo and his son-in-law. He gave the plan to depose the emperor and poisoned the Young Emperor with his own hand. When Dong Zhuo fell, Li Ru was also killed.',
  },
  'li-su-dz': {
    zh: '董卓部將,呂布同郡人。董卓使其攜赤兔馬說呂布殺丁原,布從之。後王允設連環計,使李肅迎董卓入朝,布刺殺之。董卓既死,李肅領兵討卓殘部,敗於牛輔,被斬。',
    en: 'A captain of Dong Zhuo, a man of Lü Bu\'s county. Dong Zhuo sent him with the Red Hare horse to talk Lü Bu into killing Ding Yuan, and Lü Bu obeyed. Later, in Wang Yun\'s Chain Stratagem, Li Su led Dong Zhuo into the court, where Lü Bu cut him down. After Dong Zhuo died, Li Su was sent to clean up the rebels, was broken by Niu Fu, and was beheaded.',
  },
  'liu-bian': {
    era: { zh: '漢少帝', en: 'Young Emperor of Han' },
    zh: '何皇后所生,漢靈帝長子。中平六年靈帝崩,劉辯即位,何進輔政。十常侍亂,辯與弟陳留王協出逃北邙山,為崔毅救之。董卓入京,廢辯為弘農王,旋鴆殺之,年僅十六。',
    en: 'Son of Empress He, eldest son of Emperor Ling. In 189 the emperor died and Liu Bian came to the throne, He Jin as regent. When the Ten Attendants struck, Bian and his brother the Prince of Chenliu fled to Mount Beimang and Cui Yi rescued them. Dong Zhuo, on entering the capital, deposed Bian to Prince of Hongnong, then poisoned him — sixteen years old.',
  },
  'liu-fu': {
    zh: '字元穎,沛國相人。揚州刺史。漢末從荒蕪中興合肥,築城浚塘,植桑開田,招四方流民,屢年大稔。曹操深嘉之,合肥重鎮,實基於此。',
    en: 'Style name Yuanying, of Xiang in Pei. Inspector of Yangzhou. In the closing years of Han he raised Hefei from desolation — built walls and dug ponds, planted mulberries and opened fields, gathered the wanderers from every quarter, and saw harvest after harvest. Cao Cao prized him; the great fortress of Hefei was founded on his work.',
  },
  'liu-fang': {
    zh: '字子棄,涿郡方城人。曹魏中書監,與孫資並掌機密。明帝臨終,劉放、孫資勸帝立曹芳,以司馬懿、曹爽輔政,司馬氏因之而起。',
    en: 'Style name Ziqi, of Fangcheng in Zhuojun. Director of the Imperial Secretariat under Wei, holding the secrets with Sun Zi. When Emperor Ming was dying, Liu Fang and Sun Zi urged him to set up Cao Fang with Sima Yi and Cao Shuang as regents — the rise of the Sima house began here.',
  },
  'sun-zi': {
    zh: '字彥龍,太原中都人。曹魏中書令,與劉放共掌機密二十餘年。明帝託孤之議,孫資、劉放實主之。',
    en: 'Style name Yanlong, of Zhongdu in Taiyuan. Director of the Imperial Secretariat under Wei, with Liu Fang he held the state\'s secrets for over twenty years. The decision of the dying Emperor Ming on his heir-regents was theirs.',
  },
  'liu-kun': {
    era: { zh: '聞雞起舞', en: 'Roused at the Cock\'s Crow' },
    zh: '字越石,中山魏昌人。西晉名將。與祖逖少年知交,共處一床,夜半聞雞鳴,起而舞劍,以勵志,「聞雞起舞」之語出此。鎮幷州,以孤軍拒匈奴漢國,身陷胡塵十年。後段匹磾構陷,被害,年四十八。臨終《重贈盧諶詩》:「何意百煉鋼,化為繞指柔!」 千古絕唱。',
    en: 'Style name Yueshi, of Weichang in Zhongshan. A famed general of Western Jin. In youth he and Zu Ti slept in one bed; when the cock crowed in the middle of the night they rose and danced with the sword to spur themselves on — and the saying "roused at the cock\'s crow" comes from this. He held Bing province with one lone force against the Hu Han of the Xiongnu, sunk in barbarian dust for ten years. Duan Pidi later framed him and he died at forty-eight. His last poem, "Sent Again to Lu Chen," — "Who would have thought that hundred-times-forged steel / could melt into a softness wound about the finger!" — has rung through the ages.',
  },
  'huo-yi': {
    zh: '字紹先,霍峻之子。鎮南中,撫綏夷漢。蜀漢亡,霍弋據南中不降,後聞後主厚待於洛陽,乃率眾降晉。',
    en: 'Style name Shaoxian, son of Huo Jun. He held Nanzhong and gentled tribes and Han alike. When Shu fell, Huo Yi held Nanzhong and would not yield; only when he learned the Second Emperor was kindly treated at Luoyang did he lead his men in to Jin.',
  },
  'li-mi-shu': {
    era: { zh: '陳情表', en: 'The Memorial of Petition' },
    zh: '字令伯,犍為武陽人。蜀漢尚書郎,孝祖母無雙。蜀亡入晉,武帝徵其入朝,李密上《陳情表》辭之,言「臣無祖母,無以至今日;祖母無臣,無以終餘年」,千古傳為孝道之典。',
    en: 'Style name Lingbo, of Wuyang in Qianwei. A Secretariat Officer under Shu, peerless in filial piety to his grandmother. After Shu fell, Emperor Wu of Jin summoned him to court. Li Mi sent up the Memorial of Petition declining: "Without my grandmother, your servant could not be here today; without your servant, my grandmother could not finish her years." It is read forever as the model of filial duty.',
  },
  'liao-chun': {
    zh: '蜀漢將。隨諸葛亮南征北伐,屢從軍。',
    en: 'A Shu officer. He marched in many of Zhuge Liang\'s southern and northern campaigns.',
  },
  'liang-xi': {
    zh: '字子虞,陳郡柘人。事曹操,鎮幷州二十餘年。安撫胡漢,使匈奴貴族遷居中原,北疆安靜。位至大司農。',
    en: 'Style name Ziyu, of Zhe in Chenjun. Under Cao Cao he held Bing province for over twenty years. He soothed Hu and Han alike, moved the Xiongnu nobles into the central plains, and the north was quiet. He rose to Grand Minister of Agriculture.',
  },
  'liang-xing': {
    zh: '韓遂部將。涼州十部之一。建安十六年潼關之戰,從馬超、韓遂與曹操戰,敗走,後降曹。',
    en: 'A captain under Han Sui, one of the Ten of Liang province. In the Tongguan battle of 211 he fought with Ma Chao and Han Sui against Cao Cao, was beaten and fled, and later submitted.',
  },
  'lady-cao': {
    zh: '曹操從祖父曹節之女,夏侯惇之子夏侯楙之妻。性嚴妒。',
    en: 'Daughter of Cao Jie (Cao Cao\'s grand-uncle\'s family), wife of Xiahou Mao son of Xiahou Dun. Stern and jealous by temper.',
  },
  'lady-fan': {
    zh: '趙範之嫂。趙範取桂陽,以樊氏配趙雲。雲拒之,曰:「相與同姓,卿兄即吾兄。」 後人多稱雲之雅潔。',
    en: 'Sister-in-law of Zhao Fan. When Zhao Fan held Guiyang and offered Lady Fan to Zhao Yun in marriage, Zhao Yun refused: "We share a surname — your brother is my brother." Later ages have praised the cleanness of Zhao Yun for it.',
  },
  'lady-xu': {
    zh: '徐氏,吳大都督孫翊之妻。孫翊為部將邊洪所殺,徐氏假意嫁與邊洪,於婚禮上密令孫高、傅嬰殺邊洪,以全夫仇,孫權嘉其節。',
    en: 'Lady Xu, wife of Sun Yi, Wu Grand Commandant. When Sun Yi was killed by his captain Bian Hong, Lady Xu pretended to wed Bian Hong, and at the wedding she had Sun Gao and Fu Ying kill him — keeping faith with her husband\'s vengeance. Sun Quan praised her courage.',
  },
  'lady-zou': {
    zh: '張濟之遺孀。張濟死,張繡領其眾。曹操征宛城,張繡降,操納鄒氏,寵之。張繡怒,夜襲曹營,曹昂、典韋、曹安民俱死。',
    en: 'Widow of Zhang Ji. When Zhang Ji died, Zhang Xiu took up his men. When Cao Cao came to Wancheng and Zhang Xiu surrendered, Cao Cao took Lady Zou and doted on her. Zhang Xiu in fury attacked the Cao camp by night, and Cao Ang, Dian Wei, and Cao Anmin all died.',
  },
  'lei-xu': {
    zh: '袁術部將,與陳蘭共據灊山。袁術死,二人拒之不納,後為張遼擒斬。',
    en: 'A captain of Yuan Shu, holding Mount Qian with Chen Lan. When Yuan Shu died they refused to take him in, and were later caught and beheaded by Zhang Liao.',
  },
  'liu-pan': {
    zh: '長沙人。蜀漢將。隨諸葛亮南征,後從征戰。',
    en: 'Of Changsha. A Shu officer. He marched with Zhuge Liang in the southern campaign and afterward in many fights.',
  },
  'liu-he': {
    zh: '字玄度,東萊牟平人,劉虞之子。父被公孫瓚所殺,劉和走依袁紹,從伐瓚以報父仇。',
    en: 'Style name Xuandu, of Mouping in Donglai, son of Liu Yu. When his father was killed by Gongsun Zan, Liu He fled to Yuan Shao and marched with him to crush Gongsun Zan in vengeance.',
  },
  'liu-fan': {
    zh: '揚州劉繇之子。劉繇敗於孫策,病卒,劉氏奔豫章。後事孫權,為廬陵太守。',
    en: 'A son of Liu Yao, Inspector of Yangzhou. When his father was broken by Sun Ce and died of illness, the Liu line fled to Yuzhang. He later served Sun Quan as Governor of Luling.',
  },
  'liu-mao': {
    zh: '劉表之姪。劉表卒,劉琦、劉琮爭嗣,劉茂在側,後降曹操。',
    en: 'A nephew of Liu Biao. When Liu Biao died and Liu Qi and Liu Cong fought for the heirship, Liu Mao stood by; later he submitted to Cao Cao.',
  },
  'liu-shi': {
    zh: '蜀後主皇后劉氏,張飛長女。劉禪即位立為后,卒於建興十五年。後主後立其妹為后。',
    en: 'Lady Liu, empress of the Second Emperor of Shu, eldest daughter of Zhang Fei. When Liu Shan took the throne she was made empress and died in 237. The Second Emperor then took her younger sister as empress.',
  },
  'liu-ping': {
    zh: '袁紹從子。袁紹敗於官渡,劉平投奔劉表,後事劉備。',
    en: 'A nephew of Yuan Shao. When Yuan Shao was broken at Guandu, Liu Ping fled to Liu Biao and later served Liu Bei.',
  },
  'fu-jia': {
    zh: '字蘭石,北地泥陽人。曹魏謀士。明帝時為侍中。性方正,屢諫不阿。後事司馬氏,位至司空。',
    en: 'Style name Lanshi, of Niyang in Beidi. A counselor of Wei. Under Emperor Ming he was Palace Attendant. Square and upright, he remonstrated without flattery. He later served the Sima house and rose to Excellency over the Works.',
  },
  'fu-qi': {
    zh: '蜀漢將。隨諸葛亮南征,後從軍。',
    en: 'A Shu officer. He marched with Zhuge Liang in the southern campaign and afterward.',
  },
  'huan-jie': {
    zh: '字伯緒,長沙臨湘人。事曹操、曹丕,以剛直見稱。位至太常。子桓階,從征戰有功。',
    en: 'Style name Boxu, of Linxiang in Changsha. He served Cao Cao and Cao Pi, known for stiff uprightness. He rose to Minister of Ceremonies.',
  },
  'huan-fan': {
    zh: '字元則,沛國龍亢人。曹爽謀士。高平陵之變勸曹爽起兵,爽不從,後被司馬懿夷三族。',
    en: 'Style name Yuanze, of Longkang in Pei. A counselor of Cao Shuang. In the Gaopingling coup he urged Cao Shuang to raise troops; Cao Shuang would not, and Sima Yi later wiped out three branches of his clan.',
  },
  'huan-jia': {
    zh: '蜀漢將。隨諸葛亮北伐,屢從征戰。',
    en: 'A Shu officer. He marched in many of Zhuge Liang\'s northern campaigns.',
  },
  'cai-yan': {
    zh: '蔡邕之女蔡琰之另寫,即蔡文姬,見「cai-wenji」條。',
    en: 'Alternate written form for Cai Yan, daughter of Cai Yong — the famed Cai Wenji; see her entry.',
  },
  'chen-shu': {
    zh: '陳群之子,陳泰之兄。事曹魏,以才氣見稱。早卒。',
    en: 'Son of Chen Qun and elder brother of Chen Tai. Under Wei he was known for talent. He died young.',
  },
  'chen-biao': {
    zh: '字文奧,廣陵人。事孫權,以氣節稱。位至北部都督。',
    en: 'Style name Wen\'ao, of Guangling. He served Sun Quan, known for honor. He rose to Commandant of the Northern District.',
  },
  'cheng-bing': {
    zh: '字德樞,汝南人。事孫權,以辭辯稱。出使蜀漢,孫權嘉之。',
    en: 'Style name Deshu, of Runan. He served Sun Quan and was famed for his speech. Sent as envoy to Shu, Sun Quan praised him.',
  },
  'cheng-yi-lq': {
    zh: '蜀漢將。隨諸葛亮北伐,屢從征戰。',
    en: 'A Shu officer. He marched in many of Zhuge Liang\'s northern campaigns.',
  },
  'cheng-yin': {
    zh: '蜀漢將。事後主,隨姜維北伐。',
    en: 'A Shu officer who served the Second Emperor and marched with Jiang Wei on the northern campaigns.',
  },
  'deng-mao': {
    zh: '黃巾賊將。中平元年從程遠志攻幽州涿郡,為張飛所斬,演義中此為三英初出。',
    en: 'A Yellow Turban captain. In 184 with Cheng Yuanzhi he attacked Zhuojun in You province and was cut down by Zhang Fei — the first sortie of the three heroes in the Romance.',
  },
  'deng-long': {
    zh: '蜀漢將。後主時為偏將軍。',
    en: 'A Shu officer, Subordinate General under the Second Emperor.',
  },
  'dou-mao': {
    zh: '袁紹甥。從袁紹征戰,官渡之後死於亂中。',
    en: 'A nephew of Yuan Shao. He marched with him in his wars and died in the chaos after Guandu.',
  },
  'du-qi': {
    zh: '事曹操。從軍有功。',
    en: 'Served Cao Cao with credit in the army.',
  },
  'du-wei': {
    zh: '蜀漢將。隨諸葛亮北伐。',
    en: 'A Shu officer who marched in Zhuge Liang\'s northern campaigns.',
  },
  'du-xi': {
    zh: '字伯侯,京兆杜陵人。杜畿之孫。事司馬氏,鎮幽州。',
    en: 'Style name Bohou, of Duling in the metropolitan region, grandson of Du Ji. He served the Sima house and held You province.',
  },
  'duan-zhuo': {
    zh: '張角部將。中平元年隨張角起義,後為皇甫嵩、朱儁所平。',
    en: 'A captain under Zhang Jiao. In 184 he rose with Zhang Jiao and was put down by Huangfu Song and Zhu Jun.',
  },
  'e-huan': {
    zh: '南蠻將,孟獲之婿。隨孟獲拒蜀,被趙雲所擒,孟獲求釋之。',
    en: 'A captain of the southern tribes, son-in-law to Meng Huo. He fought Shu at his father-in-law\'s side, was taken by Zhao Yun, and freed at Meng Huo\'s plea.',
  },
  'fa-miao': {
    zh: '法正之父。漢末名士。後子法正入蜀仕劉璋,終佐劉備定益州。',
    en: 'Father of Fa Zheng. A famed gentleman of late Han. His son Fa Zheng went into Shu, served Liu Zhang, and at last helped Liu Bei settle Yi province.',
  },
  'fan-a': {
    zh: '蜀漢將。隨諸葛亮北伐。',
    en: 'A Shu officer who marched in Zhuge Liang\'s northern campaigns.',
  },
  'fan-jian': {
    zh: '蜀漢使者。出使吳國,深得孫權禮遇。',
    en: 'A Shu envoy. He went to Wu and was richly received by Sun Quan.',
  },
  'fan-neng': {
    zh: '蜀漢將。隨諸葛亮北伐。',
    en: 'A Shu officer who marched in Zhuge Liang\'s northern campaigns.',
  },
  'fei-yao': {
    zh: '魏將。鎮關中,從郭淮拒蜀。',
    en: 'A Wei officer who held Guanzhong and fought Shu under Guo Huai.',
  },
  'fei-zhan': {
    zh: '蜀漢將。隨姜維北伐。',
    en: 'A Shu officer who marched with Jiang Wei on the northern campaigns.',
  },
  'gao-sheng': {
    zh: '袁術部將。守壽春,城陷被擒,孫策斬之。',
    en: 'A captain of Yuan Shu. Holding Shouchun, when the city fell he was taken and Sun Ce beheaded him.',
  },
  'gou-fu': {
    zh: '蜀漢將。隨諸葛亮北伐。',
    en: 'A Shu officer who marched in Zhuge Liang\'s northern campaigns.',
  },
  'gu-cheng': {
    zh: '字子直,顧雍之孫,顧譚之弟。事孫權,以孝友稱。',
    en: 'Style name Zizhi, grandson of Gu Yong and younger brother of Gu Tan. Under Sun Quan he was known for filial piety and brotherly love.',
  },
  // ─── 三國新增列傳 第八批 (Three Kingdoms — batch 8) ───
  'yuan-tan': {
    zh: '字顯思,袁紹長子。鎮青州,屢與曹操相持。袁紹卒,與弟袁尚相攻,辛評勸其聯曹圖尚,曹操乘隙渡河。袁譚戰敗於南皮,被曹純所斬,首送許都。',
    en: 'Style name Xiansi, eldest son of Yuan Shao. Holding Qing province, he stood many times against Cao Cao. When Yuan Shao died he fell to fighting his brother Yuan Shang; Xin Ping urged him to ally with Cao Cao against Shang, and Cao Cao crossed the river through the breach. Yuan Tan was broken at Nanpi and Cao Chun cut him down; his head was sent to Xudu.',
  },
  'yuan-shang': {
    zh: '字顯甫,袁紹少子。袁紹愛之,欲立為嗣。紹卒,審配、逢紀矯命立尚。與兄袁譚相攻,鬩牆而亡。曹操破鄴,袁尚奔遼東,公孫康畏曹操,斬其首送許都。',
    en: 'Style name Xianfu, youngest son of Yuan Shao. Yuan Shao loved him and meant to make him heir. When Yuan Shao died, Shen Pei and Feng Ji forged the will to set up Shang. He and his brother Yuan Tan fell to fighting and tore the gate apart. When Cao Cao broke Ye, Yuan Shang fled to Liaodong; Gongsun Kang, fearing Cao Cao, cut his head off and sent it to Xudu.',
  },
  'yuan-xi': {
    zh: '字顯奕,袁紹次子。鎮幽州。父卒兄弟相爭,袁熙與袁尚共奔遼東,亦被公孫康所斬,首送許都。袁氏遂亡。',
    en: 'Style name Xianyi, second son of Yuan Shao. He held You province. When his father died and his brothers fought, he fled with Yuan Shang to Liaodong; Gongsun Kang also beheaded him and sent the head to Xudu. The house of Yuan was ended.',
  },
  'xun-shuang': {
    era: { zh: '潁川荀氏', en: 'The Xun House of Yingchuan' },
    zh: '字慈明,潁川潁陰人,荀彧之叔父。漢末大儒,八龍之一。少時博通群書。董卓徵為司空,荀爽應之以伺機誅卓,在朝九十五日而拜司空,然未及行謀,卒於官。',
    en: 'Style name Ciming, of Yingyin in Yingchuan, uncle of Xun Yu. A great scholar of late Han, one of the Eight Dragons of his house. Broadly learned from youth. When Dong Zhuo called him to be Excellency over the Works, Xun Shuang accepted, looking for the chance to kill him; ninety-five days from summons to office, he died before he could move.',
  },
  'xun-yue': {
    era: { zh: '漢紀作者', en: 'Author of the Han Chronicles' },
    zh: '字仲豫,潁川潁陰人,荀彧從兄。漢末儒臣。獻帝命其作《漢紀》三十卷,以《漢書》之事編年為體,精煉典雅,後世史家稱為良史。',
    en: 'Style name Zhongyu, of Yingyin in Yingchuan, cousin of Xun Yu. A Confucian minister of late Han. Emperor Xian set him to write the Chronicles of Han in thirty fascicles, recasting the events of the Hanshu in annal form; terse and refined, later historians count it a fine history.',
  },
  'xun-chen': {
    zh: '字友若,荀彧之兄。事袁紹,為謀士。官渡之前獻計擾敵運糧,袁紹不用。袁紹敗後病卒。',
    en: 'Style name Youruo, elder brother of Xun Yu. He served Yuan Shao as a counselor. Before Guandu he offered the plan of harrying the enemy\'s grain trains; Yuan Shao did not take it. After the defeat he died of illness.',
  },
  'xun-shu': {
    zh: '字季和,潁川潁陰人,荀彧之祖父。漢順帝時名臣,八龍之父。學問淵博,品行高潔,號神君。',
    en: 'Style name Jihe, of Yingyin in Yingchuan, grandfather of Xun Yu. A famed minister under Emperor Shun of Han, father of the Eight Dragons. Of deep learning and lofty conduct, known as the "Divine Lord."',
  },
  'xun-xu': {
    zh: '字公曾,潁川潁陰人,荀彧曾孫。事司馬氏,中書監。校定典籍,訂正音律,博學多通。',
    en: 'Style name Gongzeng, of Yingyin in Yingchuan, great-grandson of Xun Yu. He served the Sima house as Director of the Imperial Secretariat, collating classics and setting the music straight, broadly learned and skilled in many things.',
  },
  'xun-yi': {
    zh: '字景倩,潁川潁陰人,荀彧之子。事司馬氏。賈充作晉律,荀顗預其議。位至太尉。',
    en: 'Style name Jingqian, of Yingyin in Yingchuan, son of Xun Yu. He served the Sima house. When Jia Chong drafted the Jin laws, Xun Yi joined the council. He rose to Grand Marshal.',
  },
  'xun-can': {
    zh: '字奉倩,荀彧少子。少有令名,深愛其妻。妻病熱,荀粲冬日袒身臥於庭,以涼己身為妻消熱。妻終亡,粲哀痛而卒,年二十九。世以為傷情之絕唱。',
    en: 'Style name Fengqian, youngest son of Xun Yu. From youth a name of distinction, and devoted to his wife. When she fell ill of fever, he lay bare-chested through winter nights in the courtyard, cooling his own body to draw her heat away. When she died, he wasted in grief and died at twenty-nine — counted forever a peerless ode of sorrowful love.',
  },
  'xun-jin': {
    zh: '字宣慈,荀彧長子。位至虎賁中郎將,早卒。',
    en: 'Style name Xuanci, eldest son of Xun Yu. He rose to Director of Tiger-Knights and died young.',
  },
  'xun-shen': {
    zh: '荀彧之子。事曹魏,位至中領軍。',
    en: 'A son of Xun Yu. He served Wei as Inspector of the Central Forces.',
  },
  'wang-can': {
    era: { zh: '建安七子', en: 'One of the Seven Masters of Jian\'an' },
    zh: '字仲宣,山陽高平人。漢末名士,建安七子之一。容貌不揚,然博聞強識,過目不忘,蔡邕器之,倒屣相迎。從劉表於荊州,後歸曹操,任侍中。作《登樓賦》、《七哀詩》傳世。年四十一卒於行軍途中。',
    en: 'Style name Zhongxuan, of Gaoping in Shanyang. A famed gentleman of late Han, one of the Seven Masters of Jian\'an. Plain of face but vastly read and possessed of an iron memory; Cai Yong honored him so that he ran out with his slippers half on. He served Liu Biao in Jingzhou and later Cao Cao as Palace Attendant. His "Climbing the Tower" and "Seven Sorrows" survive. He died at forty-one on the march.',
  },
  'wang-su': {
    zh: '字子雍,東海郯人,王朗之子。事曹魏,博學經史,注《尚書》、《詩》、《論語》,稱「王學」,與鄭玄學派並立。其女王元姬為司馬昭妻,武帝外祖父。',
    en: 'Style name Ziyong, of Tan in Donghai, son of Wang Lang. Under Wei he was broadly learned in classics and history; his commentaries on the Documents, the Odes, and the Analects formed the "Wang School," standing against the school of Zheng Xuan. His daughter Wang Yuanji was Sima Zhao\'s wife — he was grandfather to Emperor Wu of Jin.',
  },
  'wang-jing': {
    zh: '字彥緯,冀州人。事曹魏。高貴鄉公被弒之日,王經與帝同謀,事敗,母子俱被司馬昭所殺。母臨刑謂之:「人誰不死,正畏不得其所。為此而死,何恨之有!」',
    en: 'Style name Yanwei, of Jizhou. He served Wei. On the day Emperor Mao was struck down, Wang Jing was in the plot with him. When it failed, he and his mother were both killed by Sima Zhao. His mother at the block said to him: "Who does not die? — fear only an unworthy place. To die for this, what is there to regret?"',
  },
  'wang-xiang': {
    era: { zh: '臥冰求鯉', en: 'Lying on the Ice to Find the Carp' },
    zh: '字休徵,琅琊臨沂人。事曹魏、司馬氏,位至太保。少時繼母朱氏不慈,然孝事愈謹。母冬日欲食生魚,王祥脫衣臥於冰上,冰自裂,雙鯉躍出。後人為二十四孝之一。年八十五卒。',
    en: 'Style name Xiuzheng, of Linyi in Langya. He served Wei and the Sima house, rising to Grand Mentor. His stepmother née Zhu was unkind, but Wang Xiang served her the more dutifully. When she wished for raw fish in winter, he stripped off his clothes and lay on the river ice — the ice cracked and two carp leapt out. Later ages counted him one of the Twenty-Four Filial Exemplars. He died at eighty-five.',
  },
  'wang-ling': {
    zh: '字彥雲,太原祁人,王允之姪。事曹魏,鎮淮南。嘉平三年聞司馬懿病重,密謀立楚王彪。事洩,王凌走見司馬懿,飲鴆而死。',
    en: 'Style name Yanyun, of Qi in Taiyuan, nephew of Wang Yun. He served Wei, holding Huainan. In 251, hearing that Sima Yi was gravely ill, he plotted to set up Cao Biao, Prince of Chu. The plot was uncovered. Wang Ling went out to meet Sima Yi and drank a draught of poison.',
  },
  'wang-yi': {
    zh: '字義山,趙昂之妻。馬超圍冀城,趙昂出降,馬超執其子為質。王異說馬超妻楊氏放歸子。後與夫共殺馬超妻子於冀城,以報父仇。',
    en: 'Style name Yishan, wife of Zhao Ang. When Ma Chao laid siege to Jicheng, Zhao Ang surrendered, and Ma Chao held their son as hostage. Wang Yi persuaded Ma Chao\'s wife Lady Yang to let the boy go. With her husband she later killed Ma Chao\'s wife and children at Jicheng in vengeance for her father.',
  },
  'wang-shuang': {
    zh: '字子全,曹魏將。武勇過人,使大刀,有萬夫不當之勇。第二次北伐,王雙領兵追蜀軍,中諸葛亮埋伏,被魏延所斬。',
    en: 'Style name Ziquan, a Wei general. Of great prowess, he wielded a massive blade and had the courage to face ten thousand. In the second northern campaign he led troops in pursuit of the Shu army; trapped in Zhuge Liang\'s ambush, he was cut down by Wei Yan.',
  },
  'wang-lian': {
    zh: '字文儀,南陽人。劉璋舊部,後事劉備,鎮鹽鐵,使蜀中財用大豐。後與諸葛亮共輔後主,卒於建興初。',
    en: 'Style name Wenyi, of Nanyang. Originally with Liu Zhang, he later served Liu Bei, taking charge of the salt and iron monopolies and making Shu\'s revenues abundant. He served as co-regent with Zhuge Liang under the Second Emperor and died early in the Jianxing reign.',
  },
  'wang-fu': {
    zh: '字國山,廣漢郪人。劉備舊部。荊州陷,從關羽走麥城,被孫權所擒,寧死不降,被斬。',
    en: 'Style name Guoshan, of Qi in Guanghan. Once a captain of Liu Bei, when Jingzhou fell he followed Guan Yu to Maicheng; taken by Sun Quan, he refused surrender and was beheaded.',
  },
  'wang-kuang': {
    zh: '字公節,兗州泰山人。漢末為河內太守。十八路諸侯討董卓,王匡與孫堅為先鋒,後為韓浩、夏侯惇所敗,憂憤而卒。',
    en: 'Style name Gongjie, of Taishan in Yanzhou. Governor of Henei in late Han. When the eighteen princes marched against Dong Zhuo, Wang Kuang and Sun Jian led the van; later beaten by Han Hao and Xiahou Dun, he died of grief and rage.',
  },
  'wang-rui': {
    zh: '字通耀,荊州刺史。漢末以荊州刺史與孫堅、武陵太守曹寅相忤,曹寅偽詔誅之,孫堅遂代之為荊州刺史。',
    en: 'Style name Tongyao, Inspector of Jingzhou. In late Han, as Inspector of Jingzhou, he fell out with Sun Jian and Cao Yin, Governor of Wuling; Cao Yin forged an edict to put him to death, and Sun Jian took the post in his place.',
  },
  'wang-zhong': {
    zh: '字仲輿,扶風人。原李傕部,降曹操,從征戰。建安四年劉備據徐州,曹操使王忠、劉岱共往討之,皆為劉備所敗。',
    en: 'Style name Zhongyu, of Fufeng. Originally with Li Jue, he submitted to Cao Cao and marched in his wars. In 199 when Liu Bei held Xuzhou, Cao Cao sent Wang Zhong and Liu Dai together against him; both were broken by Liu Bei.',
  },
  'wang-yan': {
    era: { zh: '清談誤國', en: 'Pure Talk that Ruined the State' },
    zh: '字夷甫,琅琊臨沂人。西晉名士。容貌姣麗,清談玄理,身居宰輔而不問政事,以「口中無雌黃」為時尚。八王之亂中為東海王越所重。永嘉之亂,被石勒所擒,石勒築土埋之,曰:「凡為天下計者,豈得以浮華誤蒼生!」',
    en: 'Style name Yifu, of Linyi in Langya. A famed gentleman of Western Jin. Of fair appearance and master of pure conversation, he held the chancellorship without troubling about government — "no orpiment in the mouth" was his fashion. In the War of Eight Princes Prince Yue of Donghai prized him. In the Yongjia chaos Shi Le took him alive and had him buried alive in earth: "He who plans for the realm — should he use empty bloom to mislead the common folk?"',
  },
  'xu-rong': {
    zh: '玄菟人。董卓部將。中平六年汴水之戰,大破曹操、鮑信,曹操中流矢,賴曹洪救之。後從牛輔,被部將李蒙所殺。',
    en: 'Of Xuantu. A captain of Dong Zhuo. In 189 at the Bian River he broke Cao Cao and Bao Xin utterly; Cao Cao was hit by an arrow and Cao Hong saved him. Later under Niu Fu, he was killed by his own captain Li Meng.',
  },
  'xu-shao': {
    era: { zh: '月旦評', en: 'The First-of-the-Month Judgments' },
    zh: '字子將,汝南平輿人。漢末名士。與從兄許靖每月旦評議人物,號「月旦評」,士林爭以一言為榮。曾評曹操:「治世之能臣,亂世之奸雄。」 曹操喜之。後避亂江南,卒於豫章。',
    en: 'Style name Zijiang, of Pingyu in Runan. A famed gentleman of late Han. With his cousin Xu Jing he judged men on the first day of each month — the "First-of-the-Month Judgments." The gentry vied for a single word from him. He once judged Cao Cao: "A capable minister in peace, a treacherous hero in chaos." Cao Cao was delighted. He later fled the chaos south and died at Yuzhang.',
  },
  'xu-gan': {
    zh: '字偉長,北海劇人。建安七子之一。性恬淡,著《中論》二十篇,以儒家之道明於亂世。曹操辟之,辭以疾不就。',
    en: 'Style name Weichang, of Ju in Beihai. One of the Seven Masters of Jian\'an. Quiet of temper, he wrote the Discourses of the Mean in twenty pieces, holding to the Confucian Way in a broken age. Cao Cao summoned him; he declined on the plea of illness.',
  },
  'ruan-yu': {
    zh: '字元瑜,陳留尉氏人。建安七子之一。文章書記,深得曹操之賞。其子阮籍,孫阮咸,皆名重於世,後成竹林七賢。',
    en: 'Style name Yuanyu, of Weishi in Chenliu. One of the Seven Masters of Jian\'an. His prose and dispatches won Cao Cao\'s deep favor. His son Ruan Ji and grandson Ruan Xian both stood high in the world, of the Seven Sages of the Bamboo Grove.',
  },
  'ying-shao': {
    era: { zh: '風俗通義', en: 'Author of the Fengsu Tongyi' },
    zh: '字仲遠,汝南南頓人。漢末博物學家。著《風俗通義》三十卷,集天下風土民情、傳說神怪,後存十卷,為漢末民俗之大成。',
    en: 'Style name Zhongyuan, of Nandun in Runan. A polymath of late Han. He wrote the Comprehensive Meaning of Customs in thirty fascicles, gathering the lore and legends and spirits of the realm; ten fascicles survive — the great compendium of late-Han folk life.',
  },
  'yu-fan': {
    era: { zh: '江東狂儒', en: 'The Wild Scholar of Jiangdong' },
    zh: '字仲翔,會稽餘姚人。江東大儒,通《周易》。性高傲,屢忤孫權,被流交州。在交州十餘年,教授不倦,門徒數百。注《老子》、《論語》。',
    en: 'Style name Zhongxiang, of Yuyao in Kuaiji. A great scholar of Jiangdong, master of the Book of Changes. Proud and quick in temper, he clashed often with Sun Quan and was exiled to Jiao province. Ten years in the south he taught without rest, with hundreds of disciples, and wrote commentaries on the Daodejing and the Analects.',
  },
  'yu-ji': {
    era: { zh: '神仙道人', en: 'Immortal Adept' },
    zh: '琅琊人。漢末方士。著《太平青領書》百餘卷,授張角,張角因之以為太平道。後南遊,孫策怒其惑眾,殺之於石室。傳孫策死後常見于吉,終以鬱憤而亡。',
    en: 'Of Langya. An adept of late Han. He wrote the Book of Great Peace in over a hundred fascicles and passed it to Zhang Jiao, who founded the Way of Great Peace from it. He later wandered south; Sun Ce, hating his sway over the people, killed him in a stone chamber. Tradition says Sun Ce, after his own death, was haunted by Yu Ji\'s vision and at last sickened away.',
  },
  'liu-ye': {
    zh: '字子揚,淮南成德人。漢室宗親。曹操謀士,屢獻奇策。建議曹操早取漢中,操不及取,劉備乘隙而入。又勸曹丕乘關羽敗時取吳,丕亦不從。位至太中大夫。',
    en: 'Style name Ziyang, of Chengde in Huainan. A kinsman of the Han house. A counselor of Cao Cao, he gave many bold plans. He urged Cao Cao to take Hanzhong at once; Cao Cao did not, and Liu Bei slipped in. He also urged Cao Pi to strike Wu while Guan Yu was undone; Cao Pi too refused. He rose to Grand Counselor.',
  },
  'pang-de-ye': {
    zh: '龐德公之姪。荊州名士,司馬徽、諸葛亮皆敬之。隱於峴山。',
    en: 'A nephew of Pang Degong. A famed gentleman of Jingzhou; Sima Hui and Zhuge Liang both honored him. He hid himself south of Mount Xian.',
  },
  'pang-hui': {
    zh: '龐德之子。鄧艾入蜀,鍾會、龐會隨之。蜀漢亡,龐會殺關羽之子關彝全家,以報父仇,世以為冤。',
    en: 'Son of Pang De. He marched with Deng Ai into Shu under Zhong Hui. When Shu fell, Pang Hui wiped out the household of Guan Yi, son of Guan Xing, in vengeance for his father — and the world called it a sad ending.',
  },
  'pei-xiu': {
    era: { zh: '中國地圖學之父', en: 'Father of Chinese Cartography' },
    zh: '字季彥,河東聞喜人。事曹魏、司馬氏。位至司空。著《禹貢地域圖》十八篇,提出「製圖六體」之法,為中國地圖學之祖。',
    en: 'Style name Jiyan, of Wenxi in Hedong. He served Wei and the Sima house and rose to Excellency over the Works. He wrote the Maps of the Tribute of Yu in eighteen pieces, setting forth the Six Principles of Mapmaking — the founder of Chinese cartography.',
  },
  'pan-yue': {
    era: { zh: '美姿儀', en: 'The Most Beautiful Man' },
    zh: '字安仁,滎陽中牟人。西晉文人。容貌絕美,少時出行,洛陽婦女擲果盈車,「擲果盈車」千古傳為美談。文章華麗,《悼亡詩》三首尤切人心。八王之亂中與石崇同被孫秀所殺,夷三族。',
    en: 'Style name Anren, of Zhongmou in Yingyang. A literary man of Western Jin. Of unmatched beauty, when he went out in his youth the women of Luoyang threw fruit at him until his cart was full — "fruit thrown to fill the cart" is told to this day. His prose was splendid; his three "Elegies for the Dead Wife" cut to the heart. In the War of Eight Princes Sun Xiu killed him with Shi Chong; three branches of his clan were extinguished.',
  },
  'shi-chong': {
    era: { zh: '富甲天下', en: 'Wealth Above All in the Realm' },
    zh: '字季倫,渤海南皮人。西晉富豪。家有金谷園,珊瑚樹三尺,以鐵如意擊碎之而不惜。與王愷鬥富,世稱奇觀。八王之亂中為孫秀所殺,愛妾綠珠墜樓殉之,千古傳為佳話。',
    en: 'Style name Jilun, of Nanpi in Bohai. The great rich man of Western Jin. He had the Jingu Garden and a three-chi coral tree that he would smash with his iron sceptre without a sigh. With Wang Kai he played a contest of wealth that the world called a wonder. In the War of Eight Princes Sun Xiu killed him; his beloved Green Pearl threw herself from the tower to die with him — a tale told ever after.',
  },
  'pei-kai': {
    zh: '字叔則,河東聞喜人,裴秀之姪。西晉清談名士。容貌玉立,風儀照人,世稱「玉人」。位至中書令。',
    en: 'Style name Shuze, of Wenxi in Hedong, nephew of Pei Xiu. A famed gentleman of Western Jin and master of pure conversation. Of jade-like bearing and luminous manner — they called him the "Jade Man." He rose to Director of the Imperial Secretariat.',
  },
  'yang-fu': {
    zh: '字義山,天水冀縣人。馬超殺涼州刺史韋康,楊阜哭三日,密謀復仇。與姜敘、趙昂等起兵,大破馬超於冀城,馬超遁走漢中。曹操贊曰:「楊阜何賢哉!」',
    en: 'Style name Yishan, of Ji in Tianshui. When Ma Chao killed Wei Kang the Inspector of Liang province, Yang Fu wept three days and laid the secret plot of vengeance. With Jiang Xu and Zhao Ang he raised troops, broke Ma Chao at Jicheng, and Ma Chao fled to Hanzhong. Cao Cao praised: "What a worthy man is Yang Fu!"',
  },
  'yang-hu': {
    era: { zh: '羊公遺愛', en: 'Lord Yang the Beloved' },
    zh: '字叔子,泰山南城人。西晉名將,鎮襄陽十年。與東吳陸抗對峙,以恩信相結,陸抗病,羊祜送藥;羊祜病,陸抗使人問候。臨終舉杜預以代己,杜預平吳,實基於羊祜遺謀。襄陽百姓建羊公碑,望之莫不流涕,號「墮淚碑」。',
    en: 'Style name Shuzi, of Nancheng in Taishan. A famed general of Western Jin, he held Xiangyang for ten years. Facing Lu Kang of Wu, they bound themselves by faith: when Lu Kang was ill Yang Hu sent medicine; when Yang Hu was ill Lu Kang sent to ask. On his deathbed he named Du Yu his successor; Du Yu\'s conquest of Wu was founded on Yang Hu\'s designs. The people of Xiangyang raised Lord Yang\'s stele; none who saw it could keep from tears — the "Stele of Falling Tears."',
  },
  'lu-kang': {
    era: { zh: '東吳擎天柱', en: 'Last Pillar of Wu' },
    zh: '字幼節,陸遜之子。事孫皓,鎮西陵。羊祜在襄陽,陸抗在西陵,二人以德相敬,邊境十年無事。陸抗病卒,東吳支柱遂亡,六年後西晉滅吳。',
    en: 'Style name Youjie, son of Lu Xun. Under Sun Hao he held Xiling. With Yang Hu at Xiangyang and Lu Kang at Xiling, they honored each other by their virtue, and the border had peace ten years. When Lu Kang died of illness, the pillar of Wu was gone — six years later Western Jin broke Wu.',
  },
  'lu-kai': {
    zh: '字敬風,吳郡吳人,陸遜族子。事孫權四世,以剛直見稱。孫皓寵幸萬彧,陸凱屢諫不阿,孫皓敬畏之而不殺。卒於官,孫皓尋夷其家。',
    en: 'Style name Jingfeng, of Wu county in Wujun, a clansman of Lu Xun. He served four lords of Wu, known for stiff uprightness. When Sun Hao doted on Wan Yu, Lu Kai remonstrated again and again; Sun Hao stood in awe of him and did not kill him. He died in office, and Sun Hao soon after wiped out his household.',
  },
  'pan-jun': {
    zh: '字承明,武陵漢壽人。初事劉表,後事劉備、孫權。性嚴正,任少府,掌宮室器用。位至太常。',
    en: 'Style name Chengming, of Hanshou in Wuling. He served Liu Biao first, then Liu Bei, then Sun Quan. Stern and upright, he was Junior Treasurer in charge of the palace stores. He rose to Minister of Ceremonies.',
  },
  'pan-lin': {
    zh: '潘璋族弟。事孫權,以勇敢稱。',
    en: 'A kinsman of Pan Zhang. He served Sun Quan and was known for boldness.',
  },
  'wen-qin': {
    zh: '字仲若,沛國譙人。曹魏將,鎮淮南。與毋丘儉共起兵反司馬師。事敗,文欽奔吳,孫綝厚待之。後諸葛誕反,文欽從之,被諸葛誕所殺。',
    en: 'Style name Zhongruo, of Qiao in Pei. A Wei general holding Huainan. With Guanqiu Jian he rose against Sima Shi. When the rising failed he fled to Wu, and Sun Chen received him richly. When Zhuge Dan later rose, Wen Qin joined him and was killed by Zhuge Dan in a quarrel.',
  },
  'wen-yang': {
    era: { zh: '世之惡來', en: 'A New E Lai' },
    zh: '字次騫,文欽之子。武力過人。隨父反司馬師,單騎入魏軍,如入無人之境,進退數十回合,司馬師目疾爆裂。後降晉,任東羌校尉。八王之亂中為東安王繇所殺,夷三族。世稱「世之惡來」。',
    en: 'Style name Ciqian, son of Wen Qin. Of prowess beyond men\'s. With his father against Sima Shi, he rode alone into the Wei host as if into empty country, dozens of charges back and forth — Sima Shi\'s eye-tumor burst from rage. He later submitted to Jin as Colonel-Protector of the Eastern Qiang. In the War of Eight Princes Prince An of Donghai killed him, three branches of his clan extinguished. The world said: "A new E Lai of his age."',
  },
  'wu-ban': {
    zh: '字元雄,陳留人,吳懿從弟。劉備伐吳,以吳班為先鋒。後從諸葛亮北伐,屢從軍。',
    en: 'Style name Yuanxiong, of Chenliu, cousin of Wu Yi. In Liu Bei\'s war on Wu he led the van. He later marched in Zhuge Liang\'s northern campaigns.',
  },
  'wu-jing': {
    zh: '吳夫人之弟,孫策、孫權之舅。守丹陽,孫策起兵江東,吳景助之。位至揚武中郎將。卒。',
    en: 'Younger brother of Lady Wu, uncle of Sun Ce and Sun Quan. He held Danyang and helped Sun Ce when he raised troops in Jiangdong. He rose to General of the Household of Glorious Might. He died in office.',
  },
  'yi-ji': {
    zh: '字機伯,山陽人。漢末名士,劉表幕士。劉表卒,從劉備入蜀,深受倚重。性辯捷,使吳國,以辭辯折孫權,孫權嘉之。',
    en: 'Style name Jibo, of Shanyang. A famed gentleman of late Han, counselor of Liu Biao. When Liu Biao died he followed Liu Bei into Shu and was greatly trusted. Quick of tongue, he went as envoy to Wu and bested Sun Quan in argument; Sun Quan praised him.',
  },
  'xi-zhi': {
    zh: '字令先,河南偃師人。蜀漢秘書令。文章典雅,著《釋譏》、《七命》。蜀漢亡,陪後主入洛陽,世稱「正始之教,郤令是基」。',
    en: 'Style name Lingxian, of Yanshi in Henan. Director of the Imperial Library of Shu. His prose was elegant; he wrote the Releasing Sarcasm and the Seven Edicts. When Shu fell he went with the Second Emperor to Luoyang, and was called: "Of the Zhengshi teaching, Lord Xi was the foundation."',
  },
  'xin-pi': {
    zh: '字佐治,潁川陽翟人,辛評之弟。原事袁紹,後降曹操。性剛烈直諫。鎮關中,從司馬懿拒諸葛亮於五丈原。司馬懿欲出戰,辛毗持節以禁之,曰:「將在外,君命有所不受;但君命已下,將軍敢違乎?」 諸葛亮歎服。位至衛尉。',
    en: 'Style name Zuozhi, of Yangzhai in Yingchuan, younger brother of Xin Ping. He served Yuan Shao first, then Cao Cao. Fierce and frank in remonstrance. Holding Guanzhong, he was with Sima Yi at Wuzhang Plains against Zhuge Liang. When Sima Yi would have gone out to battle, Xin Pi held the imperial baton: "A general in the field is not bound by the lord\'s order — but when the lord has spoken, dare a general defy it?" Zhuge Liang admired and yielded. He rose to Commandant of the Guards.',
  },
  'xin-ping': {
    zh: '辛毗之兄,袁紹幕士。袁紹敗於官渡,辛評與郭圖、許攸共謀,後因事被審配所構,母子兄弟皆下獄而死。',
    en: 'Elder brother of Xin Pi, counselor of Yuan Shao. After Guandu Xin Ping plotted with Guo Tu and Xu You; later, framed by Shen Pei, he and his mother and brothers were all cast into prison and died there.',
  },
  'yong-kai': {
    zh: '建寧大姓。劉備死,雍闓殺太守正昂,叛蜀附吳。諸葛亮南征,雍闓被高定部曲所殺。',
    en: 'A great clan-chief of Jianning. When Liu Bei died, Yong Kai killed the Governor Zheng Ang and turned from Shu to Wu. In Zhuge Liang\'s southern campaign Yong Kai was killed by Gao Ding\'s men.',
  },
  'zhu-bao': {
    zh: '牂柯太守。劉備死,朱褒據郡叛。諸葛亮南征,朱褒被擊敗,被斬。',
    en: 'Governor of Zangke. When Liu Bei died he held the commandery in revolt. Zhuge Liang in the southern campaign broke him and beheaded him.',
  },
  'meng-guang': {
    zh: '字孝裕,河南雒陽人。蜀漢老儒,通《公羊春秋》。性高傲,屢與譙周辯。位至大司農。',
    en: 'Style name Xiaoyu, of Luoyang in Henan. An aged scholar of Shu, master of the Gongyang Annals. Proud and quick to argue, he often debated Qiao Zhou. He rose to Grand Minister of Agriculture.',
  },
  'ma-tie': {
    zh: '馬騰之子,馬超之弟。隨父入朝為質。馬超起兵反曹,馬騰、馬休、馬鐵父子兄弟皆被夷。',
    en: 'A son of Ma Teng and younger brother of Ma Chao. He went with his father to court as hostage. When Ma Chao rose against Cao Cao, Ma Teng, Ma Xiu, and Ma Tie — father and brothers — were all put to the sword.',
  },
  'ma-xiu': {
    zh: '馬騰之子,馬超之弟。同馬鐵一道入朝為質,後被夷。',
    en: 'A son of Ma Teng and younger brother of Ma Chao. He went with Ma Tie to court as hostage and was put to the sword with the rest.',
  },
  'ma-wan': {
    zh: '韓遂部將。隨馬超、韓遂與曹操戰於渭南,敗,被斬。',
    en: 'A captain under Han Sui. He fought Cao Cao at Weinan with Ma Chao and Han Sui, was beaten and beheaded.',
  },
  'ma-zhong-wu': {
    zh: '吳將。隨潘璋擒關羽於臨沮,功著吳國。後關興北伐,陣斬之以雪父仇。',
    en: 'A Wu officer. With Pan Zhang he took Guan Yu alive at Linju, of great credit to the kingdom. Later in the northern campaign Guan Xing cut him down to wash out his father\'s grudge.',
  },
  'zang-ba': {
    zh: '字宣高,泰山華人。漢末割據泰山,呂布舊將。曹操破呂布,臧霸歸降,鎮青徐,與孫權對峙二十餘年。位至執金吾。',
    en: 'Style name Xuangao, of Hua in Taishan. In late Han he held Taishan as his own, an old captain of Lü Bu. When Cao Cao broke Lü Bu, Zang Ba submitted and was set to hold the Qing-Xu region, standing against Sun Quan for over twenty years. He rose to Chief of Imperial Insignia.',
  },
  'lu-zhao-cw': {
    zh: '字選曹,陸遜族子。事孫權,以才幹見稱。',
    en: 'Style name Xuancao, a clansman of Lu Xun. Under Sun Quan he was known for his ability.',
  },
  'lou-gui': {
    zh: '字子伯,荊州人。漢末隱士,以方術為人所重。劉表延之不仕。後劉備過之,妻為樊氏。',
    en: 'Style name Zibo, of Jingzhou. A recluse of late Han, valued for his magic arts. Liu Biao called him to office; he would not go. He was met later by Liu Bei; his wife was of the Fan clan.',
  },
  'lu-fan': {
    zh: '字子衡,汝南細陽人。袁術舊部,後事孫策、孫權。鎮丹陽,撫山越,屢有功。位至大司馬。',
    en: 'Style name Ziheng, of Xiyang in Runan. Originally with Yuan Shu, he later served Sun Ce and Sun Quan. Holding Danyang, he soothed the Shan Yue and earned many laurels. He rose to Marshal of State.',
  },
  // ─── 三國新增列傳 第九批 (Three Kingdoms — batch 9) ───
  'liu-xie': {
    era: { zh: '漢獻帝', en: 'Emperor Xian of Han' },
    zh: '名劉協,字伯和,漢靈帝幼子。中平六年董卓廢少帝,立協為帝,年九歲。在位三十一年,身不能制朝政,先後為董卓、李傕、楊奉、曹操所挾。建安元年迎曹操於許,密令董承衣帶詔,事敗。延康元年禪位於曹丕,廢為山陽公。在山陽行醫救民,百姓愛之。青龍二年崩於封地,年五十四,謚孝獻。',
    en: 'Personal name Liu Xie, style name Bohe, youngest son of Emperor Ling of Han. In 189 Dong Zhuo deposed the Young Emperor and set him on the throne at nine. Thirty-one years he reigned, with no power over his own government — held in turn by Dong Zhuo, Li Jue, Yang Feng, and Cao Cao. In 196 he received Cao Cao at Xu and gave Dong Cheng the secret sash-edict, which failed. In 220 he yielded the throne to Cao Pi and was reduced to Duke of Shanyang. There he practiced medicine and healed the people, who loved him. He died in his fief in 234 at fifty-four, posthumous name Xiaoxian — "Filial and Devoted."',
  },
  'shi-xie': {
    era: { zh: '交州士王', en: 'King of Jiaozhou' },
    zh: '字威彥,蒼梧廣信人。漢末交州牧。世為交州大姓,四世為刺史。在交州四十年,以文教治蠻夷,中原士人避亂南奔皆依之,袁徽稱其「德教大行」。後降孫權,封龍編侯。年九十卒。',
    en: 'Style name Weiyan, of Guangxin in Cangwu. Inspector of Jiao province in late Han. His house was the great clan of Jiao for four generations as inspectors. Forty years he held Jiao province, civilizing the tribes through letters; the gentry of the central plains fleeing the chaos all turned to him, and Yuan Hui said "his teaching and grace ran far." Later he yielded to Sun Quan and was made Marquis of Longbian. He died at ninety.',
  },
  'sun-yi': {
    zh: '字叔弼,孫堅第三子,孫策、孫權之弟。性烈似兄。為丹陽太守。為部將邊洪所殺,妻徐氏假意嫁邊洪,於婚禮上殺之,以全夫仇。',
    en: 'Style name Shubi, third son of Sun Jian and younger brother of Sun Ce and Sun Quan. Fierce in temper like his eldest brother. Governor of Danyang. He was killed by his captain Bian Hong; his wife Lady Xu pretended to wed Bian Hong and killed him at the wedding, keeping faith with her husband\'s vengeance.',
  },
  'sun-yu': {
    zh: '字仲異,孫堅之姪,孫靜次子。事孫權,位至奮威將軍。性沉毅,屢從征戰,為江東宿將。',
    en: 'Style name Zhongyi, nephew of Sun Jian and second son of Sun Jing. Under Sun Quan he rose to General Who Stirs Up Might. Deep and steady, in many campaigns he stood as a veteran of Jiangdong.',
  },
  'sun-fu': {
    zh: '字國儀,孫堅之姪,孫賁之弟。事孫權,鎮廬陵。性樸厚,有將才。',
    en: 'Style name Guoyi, nephew of Sun Jian and younger brother of Sun Ben. Under Sun Quan he held Luling. Simple and steady, of generalship.',
  },
  'sun-ben': {
    zh: '字伯陽,孫堅之姪,孫賁字。事孫策、孫權,鎮豫章,撫山越。位至征虜將軍。',
    en: 'Style name Boyang, nephew of Sun Jian; Sun Ben. He served Sun Ce and Sun Quan, holding Yuzhang and soothing the Shan Yue. He rose to General Who Subdues the Rebels.',
  },
  'sun-shao': {
    zh: '字公禮,孫策之子。孫策卒於二十六歲,孫紹年幼,孫權繼立。孫紹封吳侯,後改封上虞侯。',
    en: 'Style name Gongli, son of Sun Ce. Sun Ce died at twenty-six and Sun Shao was still a boy; Sun Quan took the seat. Sun Shao was made Marquis of Wu, then later Marquis of Shangyu.',
  },
  'sun-shao-wu': {
    zh: '字公禮,北海人。事孫權,位至中書令。性沉雅,有政事才。',
    en: 'Style name Gongli, of Beihai. Under Sun Quan he rose to Director of the Imperial Secretariat. Deep and refined, a man of administration.',
  },
  'sun-kuang': {
    zh: '字季佐,孫堅幼子,孫策、孫權之弟。早卒,曹氏為兒娶之,後與曹氏絕婚。',
    en: 'Style name Jizuo, youngest son of Sun Jian, younger brother of Sun Ce and Sun Quan. He died young. The Cao house had betrothed a daughter to him; afterwards the match was broken.',
  },
  'sun-huan': {
    zh: '字叔武,孫權族子。事孫權,鎮夏口。後位至前將軍,從征戰立功。',
    en: 'Style name Shuwu, a clansman of Sun Quan. He served him and held Xiakou. He rose to General of the Vanguard with credit in many campaigns.',
  },
  'sun-li': {
    zh: '魏將。鎮幽州,平烏桓、鮮卑。性嚴明,有名於北疆。',
    en: 'A Wei general. He held You province and put down the Wuhuan and Xianbei. Stern and clear in conduct, of name on the northern frontier.',
  },
  'sun-zhong': {
    zh: '黃巾餘黨。中平元年攻北海,孫仲與管亥共圍孔融,後被劉備、關羽、張飛所敗,陣亡。',
    en: 'A leftover Yellow Turban. In 184 he attacked Beihai, besieging Kong Rong with Guan Hai. Liu Bei, Guan Yu, and Zhang Fei broke them, and Sun Zhong was killed in the line.',
  },
  'wei-zhao': {
    era: { zh: '吳國史官', en: 'Historian of Wu' },
    zh: '字弘嗣,吳郡雲陽人。事孫權、孫亮、孫休,以博學掌史。著《吳書》、《漢書音義》、《辨釋名》等。孫皓即位,韋昭直諫不阿,觸怒孫皓,被害,年七十。',
    en: 'Style name Hongsi, of Yunyang in Wujun. He served Sun Quan, Sun Liang, and Sun Xiu, holding the office of history through his learning. He wrote the History of Wu, the Sound and Meaning of the Han History, and the Distinctions of the Names of Things. When Sun Hao took the throne, Wei Zhao remonstrated straight and would not flatter; Sun Hao took the affront and had him killed at seventy.',
  },
  'wei-kang': {
    zh: '字元將,京兆杜陵人。涼州刺史。馬超圍冀城,韋康守八月,糧盡開城,馬超殺之。楊阜、姜敘為其報仇,大破馬超於冀城。',
    en: 'Style name Yuanjiang, of Duling in the metropolitan region. Inspector of Liang province. When Ma Chao laid siege to Jicheng, Wei Kang held for eight months until grain ran out and opened the gate; Ma Chao killed him. Yang Fu and Jiang Xu took up his vengeance and broke Ma Chao at Jicheng.',
  },
  'wei-feng': {
    zh: '字子京,沛國人。事曹操,以才辯見稱。建安二十四年密謀反曹,事洩,被誅,牽連數十家。',
    en: 'Style name Zijing, of Pei. Under Cao Cao, known for talent and speech. In 219 he plotted secretly against Cao Cao; the plot leaked, he was killed, and dozens of houses were dragged in.',
  },
  'tao-huang': {
    zh: '字世英,丹陽秣陵人。吳國將。鎮交州,屢平叛亂。吳亡,陶璜歸晉,武帝以為交州牧,治民有方,夷漢咸服。',
    en: 'Style name Shiying, of Moling in Danyang. A Wu general. He held Jiao province and put down many risings. When Wu fell he submitted to Jin; Emperor Wu made him Inspector of Jiao province. He governed the people well, and tribes and Han alike obeyed.',
  },
  'xue-zong': {
    zh: '字敬文,沛郡竹邑人。吳國儒臣。事孫權四十年,博學能文,鎮交州,撫蠻夷有方。位至太子少傅。',
    en: 'Style name Jingwen, of Zhuyi in Pei. A Confucian minister of Wu, he served Sun Quan forty years; broadly learned and a writer. Holding Jiao province he gentled the tribes well. He rose to Junior Tutor of the Crown Prince.',
  },
  'shen-dan': {
    zh: '字義舉,房陵太守。本劉璋部,降劉備。後孟達叛蜀降魏,申耽從之。',
    en: 'Style name Yiju, Governor of Fangling. Originally with Liu Zhang, he submitted to Liu Bei. When Meng Da turned from Shu to Wei, Shen Dan went with him.',
  },
  'shen-yi': {
    zh: '申耽之弟,西城太守。孟達歸魏,司馬懿襲新城,申儀預其謀,反殺孟達。',
    en: 'Younger brother of Shen Dan, Governor of Xicheng. When Meng Da turned back to Wei and Sima Yi struck at Xincheng, Shen Yi was part of the plot and killed Meng Da in turn.',
  },
  'shen-ying': {
    zh: '吳郡盛澤人。事孫權,以勇略稱。',
    en: 'Of Shengze in Wujun. Under Sun Quan, known for boldness.',
  },
  'niu-jin': {
    zh: '曹仁部將。從征戰多年。襄樊之役,牛金率三百人迎戰關羽,被關羽包圍。曹仁親率騎兵殺入重圍,救出牛金。後被司馬懿所忌,憂憤而死。',
    en: 'A captain under Cao Ren. He campaigned with him for years. In the Xiangfan battle he led three hundred against Guan Yu and was surrounded; Cao Ren rode in personally with cavalry and cut him out. Later Sima Yi grew suspicious of him, and he died of grief and rage.',
  },
  'tian-chou': {
    zh: '字子泰,右北平無終人。漢末名士。劉虞使其入長安朝獻帝,以盡漢室之忠。歸而劉虞已被殺,田疇率部隱於徐無山,五千餘家賴以存活。曹操北征烏桓,田疇為嚮導,大破之。曹操欲封侯,田疇辭不受。',
    en: 'Style name Zitai, of Wuzhong in Youbeiping. A famed gentleman of late Han. Liu Yu sent him to Chang\'an to render tribute to Emperor Xian — the duty of a Han loyalist. When he came back, Liu Yu was dead; he led his men into Mount Xuwu where over five thousand households lived under his protection. When Cao Cao marched against the Wuhuan, Tian Chou was his guide and helped break them. Cao Cao would have made him a marquis; Tian Chou refused.',
  },
  'tian-kai': {
    zh: '公孫瓚部將。從公孫瓚與袁紹爭河北。公孫瓚敗,田楷死於亂中。',
    en: 'A captain of Gongsun Zan. He fought with him for the north against Yuan Shao. When Gongsun Zan fell, Tian Kai died in the chaos.',
  },
  'tian-xu': {
    zh: '魏將。鎮東北邊塞,擊鮮卑,有功。',
    en: 'A Wei officer who held the northeastern frontier and struck the Xianbei with credit.',
  },
  'xiang-lang': {
    zh: '字巨達,襄陽宜城人。蜀漢儒臣。位至左將軍。坐馬謖之事被免,後復用。博覽群書,以德高見尊。卒於延熙十年。',
    en: 'Style name Juda, of Yicheng in Xiangyang. A Confucian minister of Shu, General of the Left. Caught up in Ma Su\'s affair he was dismissed and later restored. Broadly read and held in honor for his virtue. He died in 247.',
  },
  'xing-cai': {
    zh: '邢道榮之另寫。零陵將。趙雲、張飛取零陵,邢道榮出戰被斬。',
    en: 'Alternate writing for Xing Daorong. A captain of Lingling. When Zhao Yun and Zhang Fei took Lingling, Xing Daorong rode out and was beheaded.',
  },
  'jia-fan': {
    zh: '蜀漢將。隨諸葛亮北伐。',
    en: 'A Shu officer who marched in Zhuge Liang\'s northern campaigns.',
  },
  'jia-mi-jin': {
    zh: '賈充之女賈午之子。事晉。',
    en: 'A son of Jia Wu, daughter of Jia Chong. He served Jin.',
  },
  'huang-chong': {
    zh: '字未詳,黃權之子。蜀漢將。鄧艾入蜀,黃崇隨諸葛瞻禦於綿竹,慷慨陳辭,激勵將士,陣亡。',
    en: 'Son of Huang Quan. A Shu officer. When Deng Ai broke in, Huang Chong went with Zhuge Zhan to Mianzhu, spoke with great spirit to rouse the men, and died in the fight.',
  },
  'huang-rang': {
    zh: '黃忠之子。蜀漢將。早卒於父之先。',
    en: 'A son of Huang Zhong. A Shu officer who died before his father.',
  },
  'lu-fu': {
    zh: '蜀漢使者。先主、後主時往來吳國,以辭令稱。',
    en: 'A Shu envoy. Under both emperors he went back and forth to Wu, known for his speech.',
  },
  'lu-yu': {
    zh: '字偉則,曹魏將。鎮西涼,擊鮮卑、羌人有功。',
    en: 'Style name Weize, a Wei officer. He held the western marches and struck the Xianbei and Qiang with credit.',
  },
  'lu-yun-jin': {
    zh: '陸機之弟陸雲,字士龍。西晉文人,與兄齊名,世稱「二陸」。八王之亂中與兄同被孟玖讒,被殺。',
    en: 'Lu Yun, younger brother of Lu Ji, style name Shilong. A literary man of Western Jin, ranked with his brother as the "Two Lu." In the War of Eight Princes Meng Jiu\'s slander brought both brothers to death.',
  },
  'lu-mao': {
    zh: '陸遜族子。事孫權,鎮邊。',
    en: 'A clansman of Lu Xun. Under Sun Quan he held the border.',
  },
  'lu-jing': {
    zh: '魯肅之姪。事孫權,以才幹見稱。',
    en: 'A nephew of Lu Su. Under Sun Quan, known for his ability.',
  },
  'lu-wan': {
    zh: '字子鴻,曹魏中書監。事曹丕、曹叡,掌機密。',
    en: 'Style name Zihong, Director of the Imperial Secretariat under Wei. He served Cao Pi and Cao Rui, holding the state\'s secrets.',
  },
  'lu-xiang': {
    zh: '陸抗之子。事孫皓,鎮西陵。吳亡入晉,任尚書郎。',
    en: 'A son of Lu Kang. He served Sun Hao at Xiling. When Wu fell he came into Jin as Secretariat Officer.',
  },
  'lu-yi-wu': {
    zh: '陸氏吳人,事孫權,以政事稱。',
    en: 'A man of the Lu clan of Wu, who served Sun Quan with administrative merit.',
  },
  'lu-ji-wu': {
    zh: '陸績,字公紀,陸康之子。少時於袁術席上懷橘三枚以遺母,六歲已有孝名。事孫權,任鬱林太守。博通天文歷算,著《渾天圖》、《周易注》。卒年三十二。',
    en: 'Lu Ji, style name Gongji, son of Lu Kang. At six, at Yuan Shu\'s table, he tucked three oranges in his sleeve for his mother — and was famed a filial child. Under Sun Quan he was Governor of Yulin. Broadly learned in astronomy and arithmetic, he wrote a Diagram of the Whole Heavens and a Commentary on the Book of Changes. He died at thirty-two.',
  },
  'lu-jun-wu': {
    zh: '陸俊,陸遜族姪。事孫權,鎮邊。',
    en: 'Lu Jun, a clansman-nephew of Lu Xun. Under Sun Quan he held the border.',
  },
  'lu-kuang': {
    zh: '陸康之姪。事孫權。',
    en: 'A nephew of Lu Kang. Under Sun Quan.',
  },
  'ma-bing': {
    zh: '蜀漢將。',
    en: 'A Shu officer.',
  },
  'ma-qi': {
    zh: '字承伯,巴西閬中人。蜀漢人,博學能文。位至尚書,著《讖緯》數卷。',
    en: 'Style name Chengbo, of Langzhong in Baxi. A man of Shu, broadly learned and a writer. He rose to Director of the Imperial Secretariat and wrote several fascicles of apocrypha.',
  },
  'ma-zun': {
    zh: '魏將。鎮關中,從郭淮、王雙拒蜀。',
    en: 'A Wei officer who held Guanzhong and fought Shu under Guo Huai and Wang Shuang.',
  },
  'man-wei': {
    zh: '滿寵之子。事曹魏,從父鎮淮南。',
    en: 'Son of Man Chong. Under Wei he held Huainan with his father.',
  },
  'mei-cheng': {
    zh: '袁術部將。守潛山,後與陳蘭、雷薄共拒曹軍,事敗被斬。',
    en: 'A captain of Yuan Shu. Holding Mount Qian, he stood with Chen Lan and Lei Bo against Cao\'s host; the fight failed and he was beheaded.',
  },
  'mu-shun': {
    zh: '南蠻將。隨孟獲拒蜀,被馬岱所擒。',
    en: 'A captain of the southern tribes. He fought Shu under Meng Huo and was taken by Ma Dai.',
  },
  'nan-lou': {
    zh: '烏桓大人。漢末右北平烏桓首領之一。與蹋頓、蘇仆延共助袁尚,曹操北征,被張遼斬於白狼山。',
    en: 'A Great Chief of the Wuhuan. In late Han, one of the leaders of the You-Beiping Wuhuan. With Taduan and Supuyan he helped Yuan Shang; when Cao Cao marched north, Zhang Liao cut him down at White Wolf Mountain.',
  },
  'peng-yang': {
    zh: '字永年,廣漢人。蜀漢人,自負其才。劉備入蜀,法正薦之,劉備拜為治中從事。後與馬超有不平之言,被諸葛亮告於劉備,下獄被殺,年三十七。',
    en: 'Style name Yongnian, of Guanghan. A man of Shu, proud of his talent. When Liu Bei came into Shu, Fa Zheng recommended him and Liu Bei made him Aide in the Office of Administration. Later he gave Ma Chao words of discontent; Zhuge Liang reported it to Liu Bei, and he was thrown into prison and killed at thirty-seven.',
  },
  'qiao-mao': {
    zh: '字元偉,梁國睢陽人。漢末東郡太守。十八路諸侯討董卓,橋瑁與曹操、袁紹並起,後為部將劉岱所殺。',
    en: 'Style name Yuanwei, of Suiyang in Liang. Governor of Dongjun in late Han. When the eighteen princes marched against Dong Zhuo, Qiao Mao rose with Cao Cao and Yuan Shao. He was later killed by his captain Liu Dai.',
  },
  'qin-lang': {
    zh: '字元明,新興雲中人。從父呂布,後事曹魏,鎮西將軍。鎮關中,擊鮮卑、羌人有功。',
    en: 'Style name Yuanming, of Yunzhong in Xinxing. He served Lü Bu first, then Wei as General Who Guards the West. He held Guanzhong and struck the Xianbei and Qiang with credit.',
  },
  'quan-duan': {
    zh: '全琮之子。事孫權,後在二宮之爭中附孫霸,被孫皓所黜。',
    en: 'A son of Quan Cong. Under Sun Quan, in the Strife of the Two Palaces he stood with Sun Ba and was later dismissed by Sun Hao.',
  },
  'quan-ji': {
    zh: '全琮之子。事孫權,鎮邊。',
    en: 'A son of Quan Cong. Under Sun Quan he held the border.',
  },
  'quan-yi': {
    zh: '全琮之子。後降晉。',
    en: 'A son of Quan Cong. He later surrendered to Jin.',
  },
  'shang-sheng': {
    zh: '字德高,曹魏將。鎮邊有功。',
    en: 'Style name Degao, a Wei officer of merit on the borders.',
  },
  'tao-shang': {
    zh: '陶謙長子。早卒,父陶謙以徐州托於劉備。',
    en: 'Eldest son of Tao Qian. He died young — Tao Qian gave Xuzhou over to Liu Bei.',
  },
  'tao-ying': {
    zh: '陶謙次子。父陶謙死,陶應隨家避亂,後事孫策、孫權。',
    en: 'Second son of Tao Qian. After his father died, Tao Ying went with the household into exile and later served Sun Ce and Sun Quan.',
  },
  'tao-ji': {
    zh: '陶謙族子。從父鎮徐州。',
    en: 'A clansman-nephew of Tao Qian. He held Xuzhou with his uncle.',
  },
  'tao-jun': {
    zh: '陶謙從子。從征戰。',
    en: 'A nephew of Tao Qian who marched in his campaigns.',
  },
  'teng-yin': {
    zh: '字承嗣,北海人。吳國丞相。與諸葛恪同輔孫亮,後諸葛恪敗,滕胤亦被誅,夷三族。',
    en: 'Style name Chengsi, of Beihai. Chancellor of Wu. He served as co-regent with Zhuge Ke under Sun Liang; when Zhuge Ke was killed, Teng Yin was killed too, and three branches of his clan were extinguished.',
  },
  'teng-xiu': {
    zh: '滕胤之子。父被誅後,滕修出奔,後事孫休。',
    en: 'A son of Teng Yin. When his father was killed he fled, and later served Sun Xiu.',
  },
  'yan-rou': {
    zh: '幽州人。漢末為烏桓校尉。鮮于輔起兵討公孫瓚,閻柔率烏桓共擊之。後事曹操,封關內侯。',
    en: 'Of You province. In late Han Colonel-Protector of the Wuhuan. When Xianyu Fu rose against Gongsun Zan, Yan Rou led the Wuhuan into the war. He later served Cao Cao and was made Marquis within the Pass.',
  },
  'bian-zhang': {
    zh: '羌人。中平元年起兵涼州,與北宮伯玉、韓遂共反,後被韓遂所殺。',
    en: 'A Qiang chieftain. In 184 he raised troops in Liang province with Beigong Boyu and Han Sui, and was later killed by Han Sui.',
  },
  'wu-can': {
    zh: '字孔休,吳郡人。吳國將。',
    en: 'Style name Kongxiu, of Wujun. A captain of Wu.',
  },
  'xue-li': {
    zh: '丹陽人。漢末守秣陵。笮融奔之,薛禮被笮融所殺。',
    en: 'Of Danyang. In late Han he held Moling. When Ze Rong came over, Ze Rong killed him.',
  },
  'xue-xu': {
    zh: '蜀漢人,薛綜之子。事孫權,出使蜀漢。',
    en: 'A son of Xue Zong, of Wu. He went as envoy to Shu.',
  },
  'xue-ying': {
    zh: '薛綜之子。事孫權,博學能文。',
    en: 'A son of Xue Zong. Under Sun Quan, broadly learned and a writer.',
  },
  'yang-hong': {
    zh: '字季休,犍為武陽人。蜀漢人。事劉備、後主,以政事稱。位至越騎校尉。',
    en: 'Style name Jixiu, of Wuyang in Qianwei. A man of Shu. Under Liu Bei and his son, known for administration. He rose to Colonel of the Yue Cavalry.',
  },
  'yu-huan': {
    zh: '字未詳,京兆人。曹魏史官。著《魏略》,後散佚,裴松之注《三國志》多引之。',
    en: 'Style name unknown, of the metropolitan region. A Wei historian. He wrote the Records of Wei, lost in the centuries; Pei Songzhi\'s commentary on the Records of the Three Kingdoms draws much from it.',
  },
  // ─── 三國新增列傳 第十批 (Three Kingdoms — batch 10) ───
  'tadun': {
    era: { zh: '蹋頓單于', en: 'Chanyu Taduan' },
    zh: '烏桓大人,丘力居之姪。袁紹倚為強援,屢通婚姻。建安十二年曹操親征烏桓,張遼於白狼山大軍中陣斬蹋頓。烏桓自此衰落,北疆告平。',
    en: 'A Great Chief of the Wuhuan, nephew of Qiuliju. Yuan Shao bound him as ally by marriage. In 207 Cao Cao came north in person; at White Wolf Mountain Zhang Liao cut Taduan down in the very midst of his host. The Wuhuan declined from this day, and the northern marches were at last quiet.',
  },
  'song-jian': {
    zh: '涼州枹罕人。漢末割據枹罕,自稱「河首平漢王」三十餘年。建安十九年夏侯淵討之,城破被誅,枹罕之亂遂平。',
    en: 'Of Fuhan in Liang province. In late Han he held Fuhan as his own, calling himself "King of the River-Head Pacifier of Han" for over thirty years. In 214 Xiahou Yuan came against him; the city fell and he was killed, and the Fuhan revolt was ended.',
  },
  'shi-tao': {
    zh: '士燮之弟。鎮合浦。兄死,孫權使呂岱伐之,被擒。',
    en: 'Younger brother of Shi Xie. He held Hepu. When his brother died, Sun Quan sent Lü Dai against him, and he was taken.',
  },
  'shi-huan': {
    zh: '魏將。從征戰。',
    en: 'A Wei officer who marched in many campaigns.',
  },
  'shi-miao': {
    zh: '魏將。',
    en: 'A Wei officer.',
  },
  'shi-shuo': {
    zh: '吳國人,士燮族人,鎮交州。',
    en: 'A clansman of Shi Xie, of Wu, holding Jiao province.',
  },
  'yang-zhen': {
    zh: '魏將。鎮邊有功。',
    en: 'A Wei officer of credit on the borders.',
  },
  'yang-ji': {
    zh: '楊修之子。事曹魏。',
    en: 'A son of Yang Xiu. He served Wei.',
  },
  'yang-jun': {
    zh: '字文長,弘農華陰人。西晉外戚。武帝皇后楊艷之父。武帝以為車騎將軍,執政。武帝死,惠帝即位,賈后誅楊駿,夷三族。',
    en: 'Style name Wenchang, of Huayin in Hongnong. A Western Jin in-law. Father of Empress Yang Yan of Emperor Wu. Emperor Wu made him General of Chariots and Cavalry and regent. When Emperor Wu died and Emperor Hui took the throne, Empress Jia killed Yang Jun and wiped out three branches of his clan.',
  },
  'yang-qiu': {
    zh: '韓遂部將。涼州十部之一。建安十六年從馬超、韓遂與曹操戰於渭南,敗,降曹操。',
    en: 'A captain under Han Sui, one of the Ten of Liang province. In the Tongguan battle of 211 he fought with Ma Chao and Han Sui against Cao Cao, was beaten, and submitted to him.',
  },
  'yang-ren': {
    zh: '董卓部將。從董卓守潼關。十八路諸侯討卓,楊任陣戰被斬。',
    en: 'A captain of Dong Zhuo who held Tongguan. In the war of the eighteen princes against Dong Zhuo, he was killed in the line.',
  },
  'yang-song': {
    zh: '張魯謀士。劉備、曹操相爭漢中,楊松貪賄,屢為曹操所用,張魯為其所誤。曹操定漢中後,以楊松賣主求榮,斬於市。',
    en: 'A counselor of Zhang Lu. When Liu Bei and Cao Cao contested Hanzhong, Yang Song was greedy for bribes and Cao Cao often used him; Zhang Lu was misled by him. After Cao Cao took Hanzhong, he beheaded Yang Song in the market for selling his lord for honor.',
  },
  'yang-xi': {
    zh: '字文然,犍為武陽人。蜀漢儒臣。著《季漢輔臣贊》,記蜀漢諸臣之事。',
    en: 'Style name Wenran, of Wuyang in Qianwei. A Confucian minister of Shu. He wrote the Praise of the Supporting Officers of the Late Han, recording the deeds of Shu\'s great men.',
  },
  'yang-xian': {
    zh: '張魯部將。漢中之役,被夏侯淵所敗。',
    en: 'A captain of Zhang Lu. In the Hanzhong battle he was broken by Xiahou Yuan.',
  },
  'yang-xin': {
    zh: '蜀漢將。',
    en: 'A Shu officer.',
  },
  'yang-ang': {
    zh: '袁術部將。鎮鄴城。後降曹操。',
    en: 'A captain of Yuan Shu. He held Ye city, and later submitted to Cao Cao.',
  },
  'yang-bo-zl': {
    zh: '黃巾餘黨,白繞之另寫。據黑山,後為袁紹所破。',
    en: 'A leftover Yellow Turban, alternately written for Bai Rao. He held the Black Mountains and was broken by Yuan Shao.',
  },
  'yang-hong-ys': {
    zh: '袁紹部將。從袁紹征戰。',
    en: 'A captain of Yuan Shao who marched in his wars.',
  },
  'yuan-yi-yh': {
    zh: '袁紹族兄,袁遺之另寫。山陽太守。十八路諸侯討董卓,袁遺為山陽太守。後被袁術所殺。',
    en: 'A clansman-cousin of Yuan Shao, also written for Yuan Yi. Governor of Shanyang. He joined the eighteen princes against Dong Zhuo as Governor of Shanyang. He was later killed by Yuan Shu.',
  },
  'yuan-yin': {
    zh: '袁紹族子。事曹魏。',
    en: 'A clansman-nephew of Yuan Shao. He served Wei.',
  },
  'yuan-cheng': {
    zh: '袁紹之姪。從袁紹征戰,官渡之敗後降曹。',
    en: 'A nephew of Yuan Shao who marched in his wars and surrendered to Cao Cao after Guandu.',
  },
  'yuan-feng': {
    zh: '袁術之姪。從袁術。袁術敗,袁奉投奔劉表。',
    en: 'A nephew of Yuan Shu. He served him; when Yuan Shu fell, Yuan Feng went to Liu Biao.',
  },
  'yue-chen': {
    zh: '東吳將。從孫權征戰。',
    en: 'A Wu officer who marched with Sun Quan.',
  },
  'zao-zhi': {
    zh: '字元嗣,潁川人。曹操謀士。獻屯田策,助濟漢末饑荒。位至河南尹。',
    en: 'Style name Yuansi, of Yingchuan. A counselor of Cao Cao. He gave the plan of the agricultural colonies that helped relieve the famine of late Han. He rose to Intendant of Henan.',
  },
  'zhu-cai': {
    zh: '朱然之孫。事吳國,以勇略稱。',
    en: 'A grandson of Zhu Ran. Under Wu, known for boldness.',
  },
  'zhu-gai': {
    zh: '魏將。從征戰。',
    en: 'A Wei officer who marched in many campaigns.',
  },
  'zhu-hao': {
    zh: '朱皓,字文明,朱儁之子。袁術使其領豫章太守。為笮融所殺。',
    en: 'Zhu Hao, style name Wenming, son of Zhu Jun. Yuan Shu made him Governor of Yuzhang. Ze Rong killed him.',
  },
  'zhu-rong': {
    zh: '南蠻王孟獲之妻祝融夫人之另寫,參見「zhurong」。',
    en: 'Alternate writing for Lady Zhurong, wife of King Meng Huo — see her entry.',
  },
  'sun-lin': {
    zh: '孫綝之另寫。詳見「sun-chen」(已合入孫綝條)。',
    en: 'Alternate writing for Sun Chen — see his entry.',
  },
  'sun-xin': {
    zh: '孫氏宗族,事孫權。',
    en: 'A kinsman of Sun, who served Sun Quan.',
  },
  'sun-xia': {
    zh: '孫氏宗族。',
    en: 'A kinsman of Sun.',
  },
  'sun-feng-wu': {
    zh: '孫氏宗族,孫權姪。事吳國,以勇敢稱。',
    en: 'A nephew of Sun Quan. Under Wu, known for boldness.',
  },
  'sun-de-er': {
    zh: '孫氏宗族。',
    en: 'A kinsman of Sun.',
  },
  'wang-ji': {
    zh: '字伯輿,東萊曲城人。曹魏將。從司馬懿、司馬師征討。鎮揚州,擊吳。位至征南將軍。',
    en: 'Style name Boyu, of Qucheng in Donglai. A Wei general. He marched in Sima Yi and Sima Shi\'s campaigns, holding Yangzhou and striking Wu. He rose to General Who Conquers the South.',
  },
  'wang-ji-wei': {
    zh: '魏將,王基之另寫。',
    en: 'A Wei officer, alternate writing for Wang Ji.',
  },
  'wang-kai-jin': {
    zh: '西晉人。',
    en: 'A man of Western Jin.',
  },
  'wang-kai-jx': {
    zh: '與石崇鬥富之王愷。武帝舅父。家極富,鬥富一場名動洛陽。',
    en: 'Wang Kai, who contested wealth with Shi Chong. Maternal uncle of Emperor Wu. His house was so rich that the contest of wealth was famous in Luoyang.',
  },
  'wang-mai': {
    zh: '魏將。',
    en: 'A Wei officer.',
  },
  'wang-si': {
    zh: '李傕部將。',
    en: 'A captain of Li Jue.',
  },
  'wang-fan': {
    zh: '魏將。',
    en: 'A Wei officer.',
  },
  'wang-fang': {
    zh: '魏將。',
    en: 'A Wei officer.',
  },
  'wang-shen': {
    zh: '魏將。',
    en: 'A Wei officer.',
  },
  'wang-ye': {
    zh: '魏將。',
    en: 'A Wei officer.',
  },
  'wang-kang': {
    zh: '會稽人。漢末名士,孫策渡江前王朗、王凱共拒之。',
    en: 'Of Kuaiji. A famed gentleman of late Han; before Sun Ce crossed the river, Wang Kang stood with Wang Lang against him.',
  },
  'wang-lei': {
    zh: '蜀漢將。',
    en: 'A Shu officer.',
  },
  'wei-dan': {
    zh: '魏將。',
    en: 'A Wei officer.',
  },
  'wei-ji': {
    zh: '字伯儒,京兆杜陵人。事曹魏,鎮河東。性嚴明,有政事才。位至太尉。',
    en: 'Style name Boru, of Duling in the metropolitan region. Under Wei he held Hedong. Stern and clear, of administrative talent. He rose to Grand Marshal.',
  },
  'wei-ji-wei': {
    zh: '魏將。',
    en: 'A Wei officer.',
  },
  'xie-jing': {
    zh: '吳將。從征戰。',
    en: 'A Wu officer who marched in many campaigns.',
  },
  'wuyan': {
    zh: '蜀漢將。',
    en: 'A Shu officer.',
  },
  'huafu': {
    zh: '魏將。',
    en: 'A Wei officer.',
  },
  'li-fu': {
    zh: '字孫德,梓潼涪人。蜀漢人。諸葛亮臨終,後主使李福問遺事。亮應對畢卒。福以亮遺命覆於後主。',
    en: 'Style name Sunde, of Fu in Zitong. A man of Shu. When Zhuge Liang was dying, the Second Emperor sent Li Fu to ask his last counsels. Zhuge Liang answered and died. Li Fu carried his words back to the throne.',
  },
  'li-kan': {
    zh: '蜀漢人。',
    en: 'A man of Shu.',
  },
  'li-mi-dz': {
    zh: '李密之另寫。',
    en: 'Alternate writing for Li Mi.',
  },
  'liu-bao': {
    zh: '南匈奴左賢王。蔡文姬於漢末為其所擄,生二子。後曹操贖文姬歸。',
    en: 'The Wise King of the Left of the Southern Xiongnu. He took Cai Wenji captive in late Han and she bore him two sons; Cao Cao later ransomed her back.',
  },
  'liu-lue': {
    zh: '魏將。',
    en: 'A Wei officer.',
  },
  'liu-shi-yin': {
    zh: '蜀漢人。',
    en: 'A man of Shu.',
  },
  'liu-xian': {
    zh: '劉度之子。趙雲取桂陽,劉賢出戰,被擒。',
    en: 'A son of Liu Du. When Zhao Yun took Guiyang, Liu Xian rode out and was taken.',
  },
  'liu-zan': {
    zh: '魏將。',
    en: 'A Wei officer.',
  },
  'liu-zhen': {
    zh: '字公幹,東平人。建安七子之一。文章名世,曹丕、曹植皆與唱和。後因不敬曹丕,被罰為苦役。',
    en: 'Style name Gongan, of Dongping. One of the Seven Masters of Jian\'an. His writing was famed; Cao Pi and Cao Zhi exchanged verses with him. For disrespect to Cao Pi he was sent to hard labour.',
  },
  'liu-zhen-han': {
    zh: '漢末人。',
    en: 'A man of late Han.',
  },
  'luo-xian': {
    zh: '字令則,襄陽人。蜀漢將。鎮永安,蜀漢亡,羅憲獨守永安,拒吳國乘隙之師六月。後降晉,武帝厚待之,封武陵太守。',
    en: 'Style name Lingze, of Xiangyang. A Shu officer who held Yong\'an. When Shu fell, Luo Xian alone held Yong\'an against the Wu opportunists for six months. Later he submitted to Jin; Emperor Wu treated him richly and made him Governor of Wuling.',
  },
  'meng-jian': {
    zh: '蜀漢將。',
    en: 'A Shu officer.',
  },
  'meng-you': {
    zh: '孟獲之弟。隨兄拒蜀,被諸葛亮七擒七縱,終服。',
    en: 'Younger brother of Meng Huo. He stood with his brother against Shu, was caught and freed seven times by Zhuge Liang, and at last yielded.',
  },
  'qian-hong': {
    zh: '魏將。',
    en: 'A Wei officer.',
  },
  'shen-you': {
    zh: '吳國人。',
    en: 'A man of Wu.',
  },
  'su-shuang': {
    zh: '原韓遂部,後降曹操。',
    en: 'Originally with Han Sui, later submitted to Cao Cao.',
  },
  'su-yu': {
    zh: '魏將。',
    en: 'A Wei officer.',
  },
  'su-ze': {
    zh: '魏將。',
    en: 'A Wei officer.',
  },
  'sui-gu': {
    zh: '魏將。',
    en: 'A Wei officer.',
  },
  'tang-bin': {
    zh: '蜀漢將。',
    en: 'A Shu officer.',
  },
  'tang-ji': {
    zh: '蜀漢將。',
    en: 'A Shu officer.',
  },
  'tang-zhou': {
    zh: '張角弟子。中平元年揭發馬元義內應之計,馬元義被誅,黃巾起義因之提前。',
    en: 'A disciple of Zhang Jiao. In 184 he revealed Ma Yuanyi\'s plan to act as inside agent at the capital; Ma Yuanyi was put to death, and the Yellow Turban uprising broke out earlier than planned.',
  },
  'bao-tao': {
    zh: '黃巾餘黨。',
    en: 'A leftover Yellow Turban.',
  },
  'bi-chen': {
    zh: '魏將。',
    en: 'A Wei officer.',
  },
  'bi-gui': {
    zh: '東吳人。',
    en: 'A man of Wu.',
  },
  'bian-hong': {
    zh: '吳將。殺孫翊,後為孫翊妻徐氏設計於婚禮殺之。',
    en: 'A Wu officer. He killed Sun Yi; later Lady Xu, Sun Yi\'s wife, laid the plot at her own wedding and killed him.',
  },
  'bian-lan': {
    zh: '魏將。',
    en: 'A Wei officer.',
  },
  'bu-chan': {
    zh: '步騭之姪。事孫權。',
    en: 'A nephew of Bu Zhi. He served Sun Quan.',
  },
  'bu-ji': {
    zh: '步騭之子。事孫權,鎮邊。',
    en: 'A son of Bu Zhi. Under Sun Quan he held the borders.',
  },
  'bu-xie': {
    zh: '步騭之子。事孫權。',
    en: 'A son of Bu Zhi. He served Sun Quan.',
  },
  'chen-ji-sg': {
    zh: '陳群之父陳紀之姪。漢末名士。',
    en: 'A nephew of Chen Ji (father of Chen Qun). A famed gentleman of late Han.',
  },
  'chen-jiu-hz': {
    zh: '魏將。',
    en: 'A Wei officer.',
  },
  'cheng-yi': {
    zh: '蜀漢將。',
    en: 'A Shu officer.',
  },
  'dai-ling': {
    zh: '黃巾餘黨。',
    en: 'A leftover Yellow Turban.',
  },
  'dai-yuan': {
    zh: '魏將。',
    en: 'A Wei officer.',
  },
  'dong-jue': {
    zh: '魏將。',
    en: 'A Wei officer.',
  },
  'han-zhong-yt': {
    zh: '黃巾餘黨,韓忠之另寫。中平元年攻南陽,被朱儁所斬。',
    en: 'A leftover Yellow Turban, alternate writing for Han Zhong. In 184 he attacked Nanyang and was beheaded by Zhu Jun.',
  },
  'he-ding': {
    zh: '魏將。',
    en: 'A Wei officer.',
  },
  'he-fu': {
    zh: '魏將。',
    en: 'A Wei officer.',
  },
  'he-yi': {
    zh: '汝南黃巾餘黨。從劉辟拒曹操,被夏侯惇所破。',
    en: 'A leftover Yellow Turban of Runan. With Liu Pi he stood against Cao Cao; Xiahou Dun broke him.',
  },
  'he-zeng': {
    zh: '字穎考,陳國陽夏人。西晉宰相。性奢侈,日食萬錢,猶曰「無下箸處」。位至太尉。',
    en: 'Style name Yingkao, of Yangxia in Chen. A Western Jin chancellor. So extravagant that he spent ten thousand cash a day on his table and still said "there is nowhere to lay the chopsticks." He rose to Grand Marshal.',
  },
  'he-zhi': {
    zh: '魏將。',
    en: 'A Wei officer.',
  },
  'hou-xuan': {
    zh: '魏將。',
    en: 'A Wei officer.',
  },
  'hu-fen': {
    zh: '魏將。',
    en: 'A Wei officer.',
  },
  'hu-lie': {
    zh: '魏將。從鄧艾入蜀。',
    en: 'A Wei officer who went into Shu with Deng Ai.',
  },
  'hu-yuan': {
    zh: '魏將。',
    en: 'A Wei officer.',
  },
  'hu-zhen': {
    zh: '董卓部將。從董卓守潼關。後降曹操。',
    en: 'A captain of Dong Zhuo who held Tongguan. He later submitted to Cao Cao.',
  },
  'hu-zhi': {
    zh: '字文德,曹魏將。鎮東吳邊境,持身清苦。位至征東將軍。',
    en: 'Style name Wende, a Wei officer. Holding the eastern marches against Wu, he kept clean in life. He rose to General Who Conquers the East.',
  },
  'hu-zong': {
    zh: '字偉則,汝南固始人。吳國謀士。少從孫權,凡所奏議皆為孫權所重。位至侍中。',
    en: 'Style name Weize, of Gushi in Runan. A counselor of Wu. He served Sun Quan from youth; all his memorials Sun Quan held in high honor. He rose to Palace Attendant.',
  },
  'jian-yi': {
    zh: '魏將。',
    en: 'A Wei officer.',
  },
  'jin-shang': {
    zh: '長安令。曹操遷獻帝於許,留金尚為京兆尹,後為李傕、郭汜所殺。',
    en: 'Prefect of Chang\'an. When Cao Cao moved Emperor Xian to Xu, Jin Shang was left as Intendant of the metropolitan region; Li Jue and Guo Si killed him.',
  },
  'yan-pu': {
    zh: '蜀漢人。',
    en: 'A man of Shu.',
  },
  'yin-shu': {
    zh: '魏將。',
    en: 'A Wei officer.',
  },
  'ying-yang': {
    zh: '魏將。',
    en: 'A Wei officer.',
  },
  'yu-mi': {
    zh: '虞翻之子。事孫權。',
    en: 'A son of Yu Fan. He served Sun Quan.',
  },
  // ─── 三國新增列傳 第十一批 (Three Kingdoms — batch 11, closing) ───
  'huang-chengyan': {
    zh: '襄陽人,黃月英之父,沔南名士。與司馬徽、龐德公友善。聞諸葛亮欲娶妻,以「我有醜女,黃頭黑色,然才堪相配」嫁之,孔明欣然應允。實則黃氏才高,巧思過人。',
    en: 'Of Xiangyang, father of Huang Yueying and a famed gentleman of Miannan. He was a friend to Sima Hui and Pang Degong. Hearing Zhuge Liang sought a wife, he said: "I have a plain daughter — yellow-haired and dark-skinned — but her talent is worthy of you." Kongming gladly agreed. In truth Lady Huang\'s wits were high and her craft beyond men\'s.',
  },
  'guanqiu-jian': {
    era: { zh: '淮南二叛', en: 'The Second Huainan Rising' },
    zh: '字仲恭,河東聞喜人。曹魏將。征公孫淵有功,曾遠征高句麗,大破之,深入丸都。正元二年與文欽起兵反司馬師於壽春,事敗,毋丘儉走慎縣為平民張屬所射殺,夷三族。',
    en: 'Style name Zhonggong, of Wenxi in Hedong. A Wei general. He earned credit against Gongsun Yuan and on a distant campaign against Goguryeo broke it utterly, marching deep to Hwando. In 255 with Wen Qin he rose against Sima Shi at Shouchun; the rising failed and Guanqiu Jian, fleeing to Shen county, was shot down by a commoner Zhang Shu. Three branches of his clan were extinguished.',
  },
  'xiahou-shang': {
    zh: '字伯仁,沛國譙人,夏侯淵從子,夏侯霸之父。事曹丕,鎮荊州。性風流,得曹丕之寵,與曹丕為布衣之交。位至征南大將軍。',
    en: 'Style name Boren, of Qiao in Pei, nephew of Xiahou Yuan and father of Xiahou Ba. Under Cao Pi he held Jingzhou. Of free and graceful temper, much loved by Cao Pi, who was his friend from the days before his power. He rose to Grand General Who Conquers the South.',
  },
  'hu-cheer': {
    zh: '張繡部曲,身能負五百斤,日行七百里。宛城之變,張繡以胡車兒盜典韋之雙戟,典韋失兵器,死戰而亡。',
    en: 'A retainer of Zhang Xiu, able to bear five hundred jin on his back and march seven hundred li in a day. In the Wancheng mutiny Zhang Xiu had Hu Cheer steal away Dian Wei\'s twin halberds; Dian Wei, without his weapons, died fighting.',
  },
  'nanhua-laoxian': {
    era: { zh: '南華老仙', en: 'Old Immortal of Mount Huanan' },
    zh: '張角師父。傳張角入山採藥,遇南華老仙,授以《太平要術》三卷,曰:「此名《太平要術》,汝得之,當代天宣化,普救世人。」 後張角據以創太平道,黃巾之亂自此而起。',
    en: 'Master of Zhang Jiao. Tradition tells that when Zhang Jiao went into the hills gathering herbs, he met the Old Immortal of Mount Huanan, who gave him three fascicles of the Essentials of the Great Peace: "This is the Essentials of the Great Peace — by it you shall declare Heaven\'s teaching and save the people." Zhang Jiao founded the Way of Great Peace upon it, and from this the Yellow Turban rising came.',
  },
  'bao-sanniang': {
    zh: '關索之妻,演義人物。武藝高強,從關索周旋。後從諸葛亮南征,屢有戰功。',
    en: 'Wife of Guan Suo (a Romance figure). High in arms, she went with Guan Suo through all his wanderings. Later she marched with Zhuge Liang in the southern campaign and earned many honors.',
  },
  'jinhuan-sanjie': {
    zh: '南蠻三洞元帥之一。隨孟獲拒蜀,與董荼那、阿會喃共抗諸葛亮,陣戰被趙雲所斬。',
    en: 'One of the three commanders of the southern grottoes. With Dongtu Na and Ahui Nan he stood against Zhuge Liang under Meng Huo; Zhao Yun cut him down in the line.',
  },
  'jin-huan': {
    zh: '金環三結之另寫,參見「jinhuan-sanjie」。',
    en: 'Alternate writing for Jinhuan Sanjie — see his entry.',
  },
  'mangya-chang': {
    zh: '南蠻將,孟獲之部。隨孟獲拒蜀,陣戰被馬岱所斬。',
    en: 'A captain of the southern tribes, under Meng Huo. He stood against Shu and was cut down by Ma Dai in the line.',
  },
  'dailai-dongzhu': {
    zh: '帶來洞主之另寫,參見「daolaidong」。',
    en: 'Alternate writing for Lord Daolai of the grotto — see his entry.',
  },
  'empress-bian': {
    zh: '卞夫人之另寫,參見「lady-bian」。',
    en: 'Alternate writing for Lady Bian — see her entry.',
  },
  'empress-cao': {
    zh: '曹節之另寫,參見「cao-jie」。',
    en: 'Alternate writing for Cao Jie — see her entry.',
  },
  'empress-zhang': {
    zh: '蜀漢後主皇后張氏。張飛之女。後主即位,延熙年間立為皇后。蜀亡後遷洛陽。',
    en: 'Lady Zhang, empress of the Second Emperor of Shu. A daughter of Zhang Fei. Made empress in the Yanxi years. When Shu fell she was moved to Luoyang.',
  },
  'lady-bian-younger': {
    zh: '卞夫人妹之另寫,參見「lady-bian」。',
    en: 'Younger sister of Lady Bian — see her entry.',
  },
  'lady-yan': {
    zh: '東吳人,孫權後宮。',
    en: 'A lady of Wu, of Sun Quan\'s palace.',
  },
  'liu-yu-yzs': {
    zh: '袁紹之姪,劉虞之子劉和。父劉虞為公孫瓚所殺,劉和奔依袁紹,從伐公孫瓚以報父仇。',
    en: 'Nephew of Yuan Shao, son of Liu Yu, named Liu He. After Gongsun Zan killed Liu Yu, Liu He went to Yuan Shao and marched against Gongsun Zan in vengeance.',
  },
  'liu-zhen-jian': {
    zh: '蜀漢人。',
    en: 'A man of Shu.',
  },
  'wang-shuang-wei': {
    zh: '王雙之另寫,參見「wang-shuang」。',
    en: 'Alternate writing for Wang Shuang — see his entry.',
  },
  'cui-zhou-ping': {
    zh: '崔州平之另寫,參見「cui-zhouping」。',
    en: 'Alternate writing for Cui Zhouping — see his entry.',
  },
  // ─── 歷代名將 (Historical Officers, 14 dynasties) ───
  ...HISTORICAL_BIOGRAPHIES,
};

/**
 * Procedural fallback bio for officers we haven't hand-written. Looks at their
 * highest stat and assembles a plausible one-liner.
 */
// 列傳金句補充 —— 侦查发现三国列传的 quote 字段只有 7 条,近 800 篇列传无名言
// 金句。给一线名将补上史实/演义名言(图鉴与列传显示 bio.quote)。用集中的补充
// 表 + 合并循环,避免逐条改动上百行的长列传条目;只对「已有 bio 且尚无 quote」
// 的人补,绝不覆盖既有 7 条。含 6 位女性(貂蝉/甄姬/蔡文姬/孙尚香/黄月英),
// 让女性角色的图鉴也有灵魂。
const SUPPLEMENTAL_QUOTES: Record<string, { zh: string; en: string }> = {
  'sima-yi':    { zh: '亮志大而不见机,多谋而少决,好兵而无权。', en: 'Liang is grand in ambition but blind to opportunity, full of schemes yet slow to decide, fond of arms yet without the means.' },
  'zhou-yu':    { zh: '丈夫处世,遇知己之主,外托君臣之义,内结骨肉之恩。', en: 'When a man of parts meets a lord who truly knows him, they are bound outwardly as sovereign and subject, inwardly as kin.' },
  'lu-su':      { zh: '汉室不可复兴,曹操不可卒除 —— 为将军计,惟鼎足江东,以观天下之衅。', en: 'The Han cannot be revived, nor Cao Cao removed at a stroke. Your best course is to hold Jiangdong as one leg of the tripod and watch for the realm\'s fractures.' },
  'lu-meng':    { zh: '士别三日,即更刮目相待。', en: 'Part from a man three days, and you must look at him with fresh eyes.' },
  'lu-xun':     { zh: '英雄棋跱,豺狼窥望;克敌宁乱,非众不济。', en: 'Heroes ranged like chesspieces, wolves watching all around — to defeat the foe and quiet the chaos takes more than one man\'s strength.' },
  'gan-ning':   { zh: '虽有十万之众,不足惧也 —— 锦帆甘兴霸在此!', en: 'Were they a hundred thousand, still no cause for fear — Gan Xingba of the Brocade Sails stands here!' },
  'zhang-zhao': { zh: '主公承父兄之业,当先保江东,以观天下之变。', en: 'My lord inherits the work of his father and brother — first secure Jiangdong, then watch how the realm turns.' },
  'zhao-yun':   { zh: '国贼是曹操,非孙权也 —— 愿以天下为重,勿因私忿而伐吴。', en: 'The traitor to the state is Cao Cao, not Sun Quan. Put the realm first; march not on Wu for private grief.' },
  'zhang-fei':  { zh: '我乃燕人张翼德也!谁敢与我决一死战?', en: 'I am Zhang Yide of Yan! Who dares fight me to the death?' },
  'huang-zhong':{ zh: '老夫一臂之力,尚开二石之弓,斩万人之将!', en: 'This old arm still draws a two-picul bow and cuts down commanders of ten thousand!' },
  'ma-chao':    { zh: '父母昆弟并见诛灭,此仇不共戴天。', en: 'My parents and brothers were slaughtered to the last — a hatred with which I cannot share the same sky.' },
  'wei-yan':    { zh: '若曹操举天下而来,请为大王拒之;偏将十万之众至,请为大王吞之。', en: 'Should Cao Cao come with all the realm, I will hold him off for you; should a lesser general bring a hundred thousand, I will swallow them whole.' },
  'xu-shu':     { zh: '某纵在曹营,终身不为设一谋。', en: 'Though I sit in Cao\'s camp, I will not devise a single stratagem for him as long as I live.' },
  'xun-you':    { zh: '公达外愚内智,外怯内勇,外弱内强。', en: 'Gongda seems dull but is wise within, timid without but bold within, frail in seeming but strong at heart.' },
  'jia-xu':     { zh: '离之而已 —— 一纸涂抹,可破十万雄兵。', en: 'Simply divide them — a few smeared lines on paper can break an army of a hundred thousand.' },
  'cao-ren':    { zh: '吾受国厚恩,当死守于此,岂能弃城而走!', en: 'I owe the state a deep debt — I will die holding this place. How could I abandon the city and flee?' },
  'zhong-hui':  { zh: '事成,则得天下;不成,退保蜀汉,亦不失为刘备。', en: 'If it succeeds, the realm is mine; if not, I withdraw to hold Shu — no worse off than Liu Bei.' },
  'zhang-he':   { zh: '郃识变数,善处营陈,料战势地形,无不如计。', en: 'Zhang He reads the shifting odds, sets his camps well, and judges terrain and momentum — nothing falls outside his reckoning.' },
  'xu-huang':   { zh: '徐将军可谓有周亚夫之风矣!', en: '"General Xu has the bearing of Zhou Yafu himself!" — so Cao Cao praised his march.' },
  'yu-jin':     { zh: '临难毋苟免 —— 惜乎三十年名节,毁于一朝之降。', en: 'In peril, seek no escape by any means — yet alas, thirty years of honor undone by a single surrender.' },
  'huang-gai':  { zh: '某愿行诈降之计,以火破曹 —— 纵受鞭笞,亦所甘心。', en: 'Let me feign surrender and break Cao Cao with fire — I will bear the whip gladly for it.' },
  'zhou-tai':   { zh: '身被数十创,肤如刻画 —— 皆为主公挡也。', en: 'Scores of wounds, my skin like carved lines — every one of them taken for my lord.' },
  'fa-zheng':   { zh: '法孝直若在,必能制主上,令不东行。', en: '"Had Fa Xiaozhi lived, he could have curbed our lord and stopped this eastern march." — Zhuge Liang, mourning Yiling.' },
  'diaochan':   { zh: '妾若能报国家,虽万死不辞。', en: 'If I can repay the state, I would not shrink from ten thousand deaths.' },
  'lady-zhen':  { zh: '蒲生我池中,其叶何离离 —— 莫以豪贤故,弃捐素所爱。', en: 'Cattails in my pond, their leaves so lush — do not, for the great and worthy, cast off the one you once loved. (from "Tang-shang xing")' },
  'cai-wenji':  { zh: '人生几何时,怀忧终年岁 —— 胡笳一曲,肝肠寸断。', en: 'How brief this life, yet care fills all its years — one air upon the nomad reed-pipe, and the heart breaks inch by inch.' },
  'lady-sun':   { zh: '侍婢数百,居常带刀 —— 江东儿女,未必逊于男儿。', en: 'Hundreds of maids about her, a blade always at her side — the daughters of Jiangdong yield nothing to its sons.' },
  'lady-huang': { zh: '莫道妇人无巧思,木牛流马我能陈。', en: 'Say not a woman has no cunning — the wooden ox and gliding horse, I too can lay them out.' },
};
for (const [id, q] of Object.entries(SUPPLEMENTAL_QUOTES)) {
  const bio = BIOGRAPHIES[id];
  if (bio && !bio.quote) bio.quote = q;
}

export function deriveBiography(stats: {
  leadership: number;
  war: number;
  intelligence: number;
  politics: number;
  charisma: number;
}, nameEn: string, nameZh: string): OfficerBiography {
  const best = Object.entries(stats).sort(([, a], [, b]) => b - a)[0];
  const archetype = best[0];
  const lookup: Record<string, OfficerBiography> = {
    war: {
      zh: `${nameZh},以武勇知名于乱世。三国群雄之中,堪当一阵之将。`,
      en: `${nameEn} is renowned for martial prowess. Among the heroes of his age, he can stand at the head of a host.`,
    },
    leadership: {
      zh: `${nameZh},统兵有方,治军严明,堪为一方将才。`,
      en: `${nameEn} commands troops well — strict in discipline, a worthy general for a region.`,
    },
    intelligence: {
      zh: `${nameZh},智谋深远,出策无差,是难得的谋士。`,
      en: `${nameEn} is deep in counsel and his strategies seldom miscarry — a rare strategist.`,
    },
    politics: {
      zh: `${nameZh},长于内政,治民有术,实为一郡之贤。`,
      en: `${nameEn} excels at internal affairs and the governance of the people — a virtuous official for a commandery.`,
    },
    charisma: {
      zh: `${nameZh},为人魅力非凡,所至从者如云。`,
      en: `${nameEn} has extraordinary charisma; wherever he goes, followers gather like clouds.`,
    },
  };
  return lookup[archetype] ?? lookup.leadership;
}

export function getBiography(
  officerId: string,
  nameEn: string,
  nameZh: string,
  stats: Parameters<typeof deriveBiography>[0],
): OfficerBiography {
  return BIOGRAPHIES[officerId] ?? deriveBiography(stats, nameEn, nameZh);
}
