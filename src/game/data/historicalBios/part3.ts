import type { OfficerBiography } from '../biographies';

/** 歷代名將列傳 第 3 部 — 純資料,唯一入口仍是 historicalBiographies.ts。 */
export const HIST_BIOS_3: Record<string, OfficerBiography> = {
  // ─── 歷代名將 新增第五批 (Historical biographies — batch 5: Western/Eastern Han) ───
  'hist-dong-zhongshu': {
    era: { zh: '罷黜百家', en: 'Dismisser of All Schools' },
    zh: '廣川人。事漢武帝,獻《天人三策》,主張「罷黜百家,獨尊儒術」,奠定儒學為國教之基。又倡「天人感應」、「君權神授」之說,影響中國二千年。三年不窺園,治學之精嚴,世以為楷模。',
    en: 'Of Guangchuan. Under Emperor Wu he submitted the Three Memorials on Heaven and Man, urging "dismiss the hundred schools, honor only the Confucian" — laying Confucianism\'s foundation as the state teaching. He also propounded "the response between Heaven and Man" and "the divine grant of imperial right," teachings that shaped China for two thousand years. Three years he did not so much as glance into his garden — the world held his discipline as a model.',
  },
  'hist-jia-yi': {
    era: { zh: '過秦論', en: 'Author of the Faults of Qin' },
    zh: '洛陽人。漢文帝時博士,二十餘歲入朝。著《過秦論》、《治安策》,陳秦亡之因、漢治之道,文采瑰麗,千古傳誦。後為長沙王太傅,憂憤而卒,年三十三。「賈生才調更無倫」千古惜之。',
    en: 'Of Luoyang. A scholar at the court of Emperor Wen of Han, he entered the court at twenty. He wrote the Faults of Qin and the Treatise on Peace, setting out the cause of Qin\'s fall and the Way of Han\'s rule; his prose was splendid and is read forever. Later sent as Tutor to the King of Changsha, he died of grief and rage at thirty-three. "No one matched Jia Sheng\'s talent" — the ages have grieved him.',
  },
  'hist-chao-cuo': {
    zh: '潁川人。漢景帝智囊。獻《削藩策》,削吳楚諸侯之地。七國之亂起,景帝斬晁錯以謝諸侯,然亂未止,終賴周亞夫平之。',
    en: 'Of Yingchuan. The brain of Emperor Jing of Han. He gave the Memorial on Cutting Down the Feudatories, taking lands from Wu, Chu, and the rest. The Revolt of the Seven Kingdoms broke out; the emperor beheaded Chao Cuo to placate the lords. The revolt did not end, but Zhou Yafu at last put it down.',
  },
  'hist-jia-shan': {
    zh: '潁川人。漢文帝時上《至言》,以秦亡為鑒。文帝賢之,後遷至少府。',
    en: 'Of Yingchuan. Under Emperor Wen of Han he sent up the "Words Reaching the Throne," taking the fall of Qin as a warning. The emperor honored him; he later rose to Junior Treasurer.',
  },
  'hist-sima-xiangru': {
    era: { zh: '辭賦聖手', en: 'Master of Rhapsody' },
    zh: '字長卿,蜀郡成都人。漢賦聖手。少時以才名於蜀。在臨邛,以琴聲挑卓文君,文君夜奔。後著《子虛賦》、《上林賦》獻於漢武帝,武帝大悅,拜為郎。又出使西南夷,平之。中國第一辭賦大家。',
    en: 'Style Changqing, of Chengdu in Shu. Master of the Han rhapsody. From youth a name in Shu by his talent. At Linqiong he played the qin to win Zhuo Wenjun, who eloped to him by night. He wrote the Sir Vacuous Rhapsody and the Shanglin Rhapsody for Emperor Wu; the emperor was delighted and made him a Gentleman. He was later sent as envoy to the southwestern Yi and pacified them. The first great master of Chinese rhapsody.',
  },
  'hist-zhuo-wenjun': {
    zh: '蜀郡臨邛富人卓王孫之女。寡居,聞司馬相如琴聲挑之,夜奔相如。父怒,斷其供給。文君當壚賣酒,「文君當壚」千古傳為佳話。',
    en: 'Daughter of Zhuo Wangsun, a rich man of Linqiong in Shu. Widowed young, she heard Sima Xiangru\'s qin call to her and eloped to him by night. Her father in anger cut off her allowance, and Wenjun stood at the wine-counter selling drinks. "Wenjun at the counter" is told down the ages as a fine tale.',
  },
  'hist-gongsun-hong': {
    zh: '字次卿,菑川薛人。漢武帝丞相。年六十始入朝,以《公羊春秋》學顯。性節儉,日食一肉,夜寢布被。漢相之中以布衣起家者,公孫弘為始。',
    en: 'Style Ciqing, of Xue in Zichuan. Chancellor under Emperor Wu of Han. At sixty he entered the court, raised up by his learning of the Gongyang Annals. Frugal — one dish of meat a day, a cloth coverlet at night. He was the first chancellor of Han to rise from common cloth.',
  },
  'hist-zhufu-yan': {
    era: { zh: '推恩令', en: 'The Edict of Grace' },
    zh: '齊國臨菑人。漢武帝謀士。獻「推恩令」之策,使諸侯王分封子弟為侯,諸侯之地由是日削,而朝廷無削藩之名。又屢進奇策。後為齊王所恨,被趙王所訟,夷三族。',
    en: 'Of Linzi in Qi. A counselor of Emperor Wu of Han. He gave the strategy of the "Edict of Grace" — having princes enfeoff their younger sons as marquises, so the princely lands shrank day by day without the court bearing the name of "cutting down feudatories." He gave many other bold counsels. Later hated by the King of Qi and sued by the King of Zhao, he was wiped out to three branches of his clan.',
  },
  'hist-sang-hongyang': {
    zh: '洛陽人。漢武帝財政大臣。獻鹽鐵專賣、均輸平準之策,使漢室財用充實。武帝崩,為霍光所殺。',
    en: 'Of Luoyang. Finance minister of Emperor Wu of Han. He gave the strategy of the salt and iron monopolies, the equable transport and price-stabilization — the Han treasury was filled. When Emperor Wu died, Huo Guang killed him.',
  },
  'hist-li-guangli': {
    zh: '李夫人之兄。漢武帝舅。封貳師將軍,西征大宛,取汗血馬,有功。後征匈奴,大敗,降匈奴,被殺。',
    en: 'Elder brother of Lady Li, brother-in-law to Emperor Wu of Han. Made General of Ershi, he marched west against Dayuan and brought back the blood-sweating horses with merit. Later sent against the Xiongnu, he was utterly broken, surrendered, and was killed.',
  },
  'hist-wei-zifu': {
    zh: '漢武帝皇后。原平陽公主家歌伎。武帝幸之,生子劉據,即戾太子。後巫蠱之禍,衛皇后、戾太子皆被誣自殺。其姪衛青、外甥霍去病皆為名將。',
    en: 'Empress of Emperor Wu of Han. Originally a singing-girl at Princess Pingyang\'s house, the emperor took her in. She bore the prince Liu Ju, who became the Crown Prince — later the "Wronged" Crown Prince. In the witchcraft disaster the empress and the crown prince were both slandered to suicide. Her nephew Wei Qing and grandnephew Huo Qubing both became famous generals.',
  },
  'hist-tian-fen': {
    zh: '漢武帝舅。王太后弟。為丞相,奢侈專橫,與灌夫、竇嬰相爭。後構陷竇嬰、灌夫,皆被殺。田蚡尋亦病卒。',
    en: 'Uncle of Emperor Wu of Han, brother of Empress Dowager Wang. As chancellor, lavish and overbearing, he contended with Guan Fu and Dou Ying. Later he framed both to death — and soon after fell ill and died himself.',
  },
  'hist-dou-ying': {
    zh: '字王孫,漢文帝竇皇后之姪。七國之亂中為大將軍,平亂有功,封魏其侯。與田蚡相鬥,被田蚡構陷,棄市於渭城。',
    en: 'Style Wangsun, nephew of Empress Dou of Emperor Wen of Han. In the Revolt of the Seven Kingdoms he was Grand Marshal with credit, made Marquis of Weiqi. He clashed with Tian Fen, who framed him; he was put to death in the marketplace at Weicheng.',
  },
  'hist-su-zhang': {
    zh: '蘇武之兄。漢武帝時奉車都尉,坐法自殺。',
    en: 'Elder brother of Su Wu. Under Emperor Wu of Han he served as Driver of the Imperial Carriage; convicted under the law, he took his own life.',
  },
  'hist-yan-zhu': {
    zh: '會稽吳人。漢武帝時侍中。文學之臣,與司馬相如齊名。後坐淮南王案,被殺。',
    en: 'Of Wu in Kuaiji. Palace Attendant under Emperor Wu of Han. A man of letters, ranked with Sima Xiangru. He was killed in the case of the King of Huainan.',
  },
  'hist-zhu-maichen': {
    era: { zh: '覆水難收', en: '"Water Spilt Cannot Be Recovered"' },
    zh: '會稽吳人。漢武帝時會稽太守。少貧,賣柴自給,讀書不輟。其妻不堪貧苦,離之。後朱買臣富貴歸鄉,前妻乞復合,朱買臣潑水於地,曰:「若能收此水,則可復合。」 「覆水難收」千古絕唱。',
    en: 'Of Wu in Kuaiji. Governor of Kuaiji under Emperor Wu of Han. Poor in youth, he sold firewood for his keep and never put down his books. His wife could not bear the poverty and left him. Later he came home rich and high; his former wife begged to be reunited. Zhu Maichen poured water on the ground and said: "If you can gather this water, we may be reunited." "Water spilt cannot be recovered" rings forever.',
  },
  'hist-jun-buyi': {
    zh: '渤海人。漢昭帝京兆尹。執法公正,以治安名於世。卒,百姓哭之至慟。',
    en: 'Of Bohai. Intendant of the metropolitan region under Emperor Zhao of Han. Upright in the law, famed throughout the realm for peace and order. At his death the people wept till their voices broke.',
  },
  'hist-zhao-chongguo': {
    zh: '字翁孫,隴西上邽人。漢宣帝名將。年七十而西擊羌人,以屯田之策定西陲。為將先計而後戰,謀深略遠,封營平侯。卒年八十六。',
    en: 'Style Wengsun, of Shanggui in Longxi. A famed general of Emperor Xuan of Han. At seventy he marched west against the Qiang and pacified the western marches with the strategy of agricultural colonies. As a general he planned first and fought after, deep in counsel; made Marquis of Yingping. He died at eighty-six.',
  },
  'hist-huang-ba': {
    zh: '字次公,淮陽陽夏人。漢宣帝名臣。為潁川太守,以治民見稱。在郡八年,獄無冤訴,號「天下第一賢吏」。位至丞相,封建成侯。',
    en: 'Style Cigong, of Yangxia in Huaiyang. A famed minister of Emperor Xuan of Han. As Governor of Yingchuan he was known for ruling the people; in eight years no unjust complaint left his prison — he was called the "first worthy official of the realm." He rose to chancellor and was made Marquis of Jiancheng.',
  },
  'hist-er-kuan': {
    zh: '字仲翁,千乘人。漢武帝時御史大夫。從董仲舒學《春秋》,知禮法。為人寬厚,有古名臣之風。',
    en: 'Style Zhongweng, of Qiansheng. Imperial Secretary under Emperor Wu of Han. He studied the Spring and Autumn under Dong Zhongshu and knew rites and laws. Broad and gentle, with the air of a famed minister of old.',
  },
  'hist-liu-xiang': {
    zh: '字子政,沛人,漢室宗親。漢成帝時大學者。校勘宮中書籍,著《別錄》、《新序》、《說苑》、《列女傳》。中華目錄學之祖。',
    en: 'Style Zizheng, of Pei, kinsman of the Han house. A great scholar under Emperor Cheng of Han. He collated the palace books and wrote the Bielu, the Xinxu, the Shuoyuan, and the Lienü Zhuan. The founder of Chinese bibliographic learning.',
  },
  'hist-wang-mang': {
    era: { zh: '篡漢之主', en: 'Usurper of the Han' },
    zh: '字巨君,東平陵人。漢元帝皇后王政君之姪。性偽飾,博士儒生皆譽之。元始五年,毒殺漢平帝,初始元年篡漢自立,建新朝。行「王田制」、改幣制、屢更地名,百姓苦之。地皇四年,綠林、赤眉起義,長安陷,王莽被斬於漸臺,新朝亡。',
    en: 'Style Jujun, of Donglingling. Nephew of Empress Wang Zhengjun of Emperor Yuan of Han. A man of false bearing, the scholars and Confucians all praised him. In 5 he poisoned Emperor Ping; in 9 he took the Han throne and founded the Xin dynasty. He set the "royal field" system, recoined the money, kept changing place-names — and the people groaned. In 23 the Green Forest and the Red Brows rose; Chang\'an fell, and Wang Mang was beheaded at the Jian Tower, the Xin ended.',
  },
  'hist-ma-yuan': {
    era: { zh: '馬革裹屍', en: '"Horse-Hide Shroud"' },
    zh: '字文淵,扶風茂陵人。東漢光武帝名將。平交趾,立銅柱為界。曰:「男兒要當死於邊野,以馬革裹屍還葬耳,何能臥床上在兒女子手中邪!」 後征武陵五溪蠻,病卒於軍中,年六十二。',
    en: 'Style Wenyuan, of Maoling in Fufeng. A famed general under Emperor Guangwu of the Eastern Han. He pacified Jiaozhi and set up bronze pillars as the boundary. He said: "A man should die in the field beyond the wall, wrapped in horse-hide and brought home for burial — how can he die in his bed under the hands of women and children?" Later on the campaign against the Wuxi tribes of Wuling he died of illness in camp at sixty-two.',
  },
  'hist-deng-yu': {
    era: { zh: '雲台第一', en: 'First of the Cloud Terrace' },
    zh: '字仲華,南陽新野人。光武帝二十八將之首,雲台二十八將位居第一。年十三即從光武帝起兵。平河北,定關中,為東漢開國第一功臣。封高密侯,壽五十七。',
    en: 'Style Zhonghua, of Xinye in Nanyang. First of the Twenty-Eight Generals of Emperor Guangwu, foremost on the Cloud Terrace. At thirteen he marched with the emperor. He pacified the north of the river and settled Guanzhong, the first founding minister of the Eastern Han. Made Marquis of Gaomi, he lived to fifty-seven.',
  },
  'hist-wu-han': {
    zh: '字子顏,南陽宛人。光武帝二十八將之一。性沉毅,為將剛勇,曾與光武戰於昆陽,以三千破王莽四十二萬之眾。封廣平侯。',
    en: 'Style Ziyan, of Wan in Nanyang. One of the Twenty-Eight Generals of Emperor Guangwu. Steady and bold; at Kunyang with three thousand he broke Wang Mang\'s four hundred and twenty thousand at the emperor\'s side. Made Marquis of Guangping.',
  },
  'hist-kou-xun': {
    zh: '字子翼,上谷昌平人。光武帝二十八將之一。鎮潁川,平赤眉,屢立戰功。封雍奴侯。',
    en: 'Style Ziyi, of Changping in Shanggu. One of the Twenty-Eight Generals of Emperor Guangwu. Holding Yingchuan, he put down the Red Brows and won many laurels. Made Marquis of Yongnu.',
  },
  'hist-jia-fu': {
    zh: '字君文,潁川冠軍人。光武帝二十八將之一。性勇悍,從征戰立功。封膠東侯。',
    en: 'Style Junwen, of Guanjun in Yingchuan. One of the Twenty-Eight Generals of Emperor Guangwu. Bold in temper, he marched and won credit. Made Marquis of Jiaodong.',
  },
  'hist-feng-yi': {
    era: { zh: '大樹將軍', en: 'The General of the Great Tree' },
    zh: '字公孫,潁川父城人。光武帝二十八將之一。性謙退,諸將並坐論功時,馮異獨立樹下,故號「大樹將軍」。鎮關中,平赤眉,封陽夏侯。',
    en: 'Style Gongsun, of Fucheng in Yingchuan. One of the Twenty-Eight Generals of Emperor Guangwu. Modest by nature — when the generals sat together to claim merit, Feng Yi alone stood under a tree, and so was called "the General of the Great Tree." Holding Guanzhong he put down the Red Brows and was made Marquis of Yangxia.',
  },
  'hist-cen-peng': {
    zh: '字君然,南陽棘陽人。光武帝二十八將之一。武勇敢戰,征隴西、伐公孫述,皆有功。後為刺客所殺。',
    en: 'Style Junran, of Jiyang in Nanyang. One of the Twenty-Eight Generals of Emperor Guangwu. Bold and quick in war, he marched on Longxi and Gongsun Shu with credit. He was later killed by an assassin.',
  },
  'hist-geng-yan': {
    zh: '字伯昭,扶風茂陵人。光武帝二十八將之一。鎮山東,平張步,大破之於臨菑。封好畤侯。',
    en: 'Style Bozhao, of Maoling in Fufeng. One of the Twenty-Eight Generals of Emperor Guangwu. Holding Shandong he put down Zhang Bu, breaking him utterly at Linzi. Made Marquis of Haozhi.',
  },
  'hist-geng-gong': {
    era: { zh: '十三將士歸玉門', en: '"Thirteen Soldiers Returned to Jade Gate"' },
    zh: '字伯宗,耿弇之姪。漢明帝時鎮疏勒。北匈奴圍之,城中糧盡,鑿井十五丈無水,煮鎧弩食筋革。後援軍至,殘卒十三人歸玉門關,鬚髮盡白。「十三將士歸玉門」千古絕唱。',
    en: 'Style Bozong, nephew of Geng Yan. Under Emperor Ming of Han he held Shule. The Northern Xiongnu besieged him; the city\'s grain failed and they dug fifteen zhang and struck no water, boiled their armor and bowstrings and ate the sinews and leather. When relief came at last, thirteen survivors returned to the Jade Gate Pass, their hair and beards wholly white. "Thirteen soldiers returned to Jade Gate" rings forever.',
  },
  'hist-ren-guang': {
    zh: '字伯卿,南陽宛人。光武帝二十八將之一。鎮信都,從征戰立功。封阿陵侯。',
    en: 'Style Boqing, of Wan in Nanyang. One of the Twenty-Eight Generals of Emperor Guangwu. Holding Xindu, he marched and won credit. Made Marquis of Aling.',
  },
  'hist-ma-wu': {
    zh: '字子張,南陽湖陽人。光武帝二十八將之一。性勇悍,從征戰立功。封楊虛侯。',
    en: 'Style Zizhang, of Huyang in Nanyang. One of the Twenty-Eight Generals of Emperor Guangwu. Bold in temper, he marched and won credit. Made Marquis of Yangxu.',
  },
  'hist-deng-taihou': {
    era: { zh: '鄧太后', en: 'Empress Dowager Deng' },
    zh: '名鄧綏,鄧禹之孫女。漢和帝皇后。和帝崩,連立殤帝、安帝。臨朝二十年,任賢納諫,平羌亂,救水旱,東漢得以維持。其行儉省,憂國憂民,千古賢后之典。',
    en: 'Personal name Deng Sui, granddaughter of Deng Yu. Empress of Emperor He of Han. When He died she set up in turn the infant Shang and then An, holding court for twenty years. She raised worthies and heard counsel, put down the Qiang revolt, relieved floods and droughts — the Eastern Han endured through her. Frugal in life, troubled for state and people, she stands as the model of worthy empresses for the ages.',
  },
  'hist-yin-lihua': {
    zh: '南陽新野人。光武帝皇后。性恭儉,光武帝早年所愛,曰:「仕宦當作執金吾,娶妻當得陰麗華。」 後立為皇后,母儀天下。',
    en: 'Of Xinye in Nanyang. Empress of Emperor Guangwu. Modest and frugal, the emperor\'s love from his youth — he had said: "If one would take office, let him be Chief of the Imperial Insignia; if one would take a wife, let her be Yin Lihua." She was made empress and bore the dignity of the mother of state.',
  },
  'hist-mingde-mahuanghou': {
    zh: '馬援之女,漢明帝皇后。性節儉,雖貴為皇后,不衣綾羅。撫養章帝為己子。臨朝不阿,千古賢后之典。',
    en: 'Daughter of Ma Yuan, empress of Emperor Ming of Han. Frugal in life — though empress, she wore no silk brocade. She raised the future Emperor Zhang as her own. At court she did not flatter — a model of worthy empresses for the ages.',
  },
  'hist-ma-rong': {
    zh: '字季長,扶風茂陵人。東漢大儒。註《五經》、《老子》、《淮南子》。門徒四百人,鄭玄、盧植皆其弟子。',
    en: 'Style Jichang, of Maoling in Fufeng. A great Confucian of the Eastern Han. He annotated the Five Classics, the Daodejing, and the Huainanzi. Four hundred disciples — Zheng Xuan and Lu Zhi were both his pupils.',
  },
  'hist-huan-rong': {
    zh: '字春卿,沛郡龍亢人。東漢大儒。光武帝時博士,以《歐陽尚書》學顯。為漢明帝之師,以師道見禮。',
    en: 'Style Chunqing, of Longkang in Pei. A great Confucian of the Eastern Han. A scholar at the court of Emperor Guangwu, raised up by his learning of the Ouyang Documents. Teacher of Emperor Ming, who honored him with the rite of master and disciple.',
  },
  'hist-wang-chong': {
    era: { zh: '論衡', en: 'Author of the Lunheng' },
    zh: '字仲任,會稽上虞人。東漢哲學家。著《論衡》八十五篇,以理駁讖緯,反對神學迷信,中華唯物論之一大家。',
    en: 'Style Zhongren, of Shangyu in Kuaiji. A philosopher of the Eastern Han. He wrote the Lunheng in eighty-five pieces, refuting the apocrypha by reason and standing against theological superstition — a great voice of Chinese materialism.',
  },
  'hist-yang-xiong': {
    zh: '字子雲,蜀郡成都人。西漢辭賦家、哲學家。著《太玄》、《法言》,擬《周易》、《論語》。又作《甘泉賦》、《羽獵賦》,文采華麗。後事王莽,世以為玷。',
    en: 'Style Ziyun, of Chengdu in Shu. A rhapsodist and philosopher of the Western Han. He wrote the Great Mystery and the Model Words, imitating the Changes and the Analects. The Ganquan Rhapsody and the Yulie Rhapsody are also his, splendid in style. He later served Wang Mang — and the world held it a stain.',
  },
  'hist-yan-guang': {
    era: { zh: '富春江釣翁', en: 'Fisherman of the Fuchun River' },
    zh: '字子陵,會稽餘姚人。少與光武帝同學。光武帝即位,屢徵不至。後勉強入京,光武帝同榻而眠,光以足加帝腹,次日太史奏:「客星犯御座甚急!」 後辭歸富春江,垂釣終身,千古高士之典。',
    en: 'Style Ziling, of Yuyao in Kuaiji. In youth he studied with the future Emperor Guangwu. When the emperor took the throne, he called Yan again and again — Yan would not come. Forced at last to the capital, the emperor had him sleep in the same bed; Yan laid his foot on the emperor\'s belly. The next day the Grand Astrologer reported: "A guest-star has gravely violated the imperial seat!" He took his leave, returned to the Fuchun River, and fished out his days — the model of the high recluse for the ages.',
  },
  'hist-zhuo-mao': {
    zh: '字子康,南陽宛人。東漢光武帝雲台二十八將之一。性溫雅,以德服人。封宣德侯。',
    en: 'Style Zikang, of Wan in Nanyang. One of the Twenty-Eight Cloud Terrace Generals of Emperor Guangwu of the Eastern Han. Mild and refined, he ruled men by virtue. Made Marquis of Xuande.',
  },
  'hist-diwu-lun': {
    zh: '字伯魚,京兆長陵人。東漢光武、明、章三朝大臣。性剛直,屢諫不阿,以清節聞於世。位至司空。',
    en: 'Style Boyu, of Changling in the metropolitan region. A great minister of three reigns — Guangwu, Ming, Zhang — of the Eastern Han. Stiff and upright, he remonstrated without flattery and was known for clean conduct. He rose to Excellency over the Works.',
  },
  'hist-he-xiu': {
    zh: '字邵公,任城樊人。東漢經學家。專治《公羊春秋》,著《公羊解詁》,千古公羊學之祖。',
    en: 'Style Shaogong, of Fan in Rencheng. A classical scholar of the Eastern Han. He specialized in the Gongyang Annals and wrote the Gongyang Interpretive Notes — the founding work of Gongyang studies for the ages.',
  },
  'hist-huan-kuan': {
    zh: '字次公,汝南南頓人。漢宣帝時諫議大夫。著《鹽鐵論》六十篇,記漢昭帝時鹽鐵會議,千古經濟思想史之珍。',
    en: 'Style Cigong, of Nandun in Runan. A counselor under Emperor Xuan of Han. He wrote the Discourses on Salt and Iron in sixty pieces, recording the salt-and-iron council under Emperor Zhao — a treasure of the history of economic thought.',
  },
  'hist-jia-kui': {
    zh: '字景伯,扶風平陵人。東漢經學家。注《左傳》、《國語》、《周官》。為馬融、鄭玄之師,東漢古文經學之祖。',
    en: 'Style Jingbo, of Pingling in Fufeng. A classical scholar of the Eastern Han. He annotated the Zuo Tradition, the Discourses of the States, and the Rites of Zhou. Teacher of Ma Rong and Zheng Xuan, founder of the Ancient-Script learning of the Eastern Han.',
  },
  // ─── 歷代名將 新增第六批 (Historical biographies — batch 6: Jin & Southern-Northern) ───
  'hist-liu-yuan': {
    era: { zh: '漢趙開國', en: 'Founder of Han-Zhao' },
    zh: '字元海,匈奴左部帥劉豹之子。漢化匈奴貴族。永興元年起兵離石,稱漢王,後稱帝,建漢趙(前趙),為五胡十六國之首。',
    en: 'Style Yuanhai, son of Liu Bao the Chief of the Left Xiongnu. A Xiongnu noble steeped in Han culture. In 304 he raised troops at Lishi, called himself King of Han, then emperor, and founded the Han-Zhao (Former Zhao) — the first of the Sixteen Kingdoms of the Five Hu.',
  },
  'hist-liu-yao': {
    zh: '前趙皇帝,劉淵族子。在位十一年,平劉曜之亂,定關中。後與石勒戰於洛陽,大敗被擒,被殺。前趙遂亡。',
    en: 'Emperor of the Former Zhao, clansman of Liu Yuan. Eleven years he reigned: he put down Liu Yao\'s revolt and settled Guanzhong. Defeated by Shi Le at Luoyang, he was taken and killed — and the Former Zhao was ended.',
  },
  'hist-fu-hong': {
    zh: '氐族,前秦開國之祖。輔石虎於後趙,後石虎死,氐族散去。苻洪率眾入關中,稱秦王,旋為部下毒殺。其子苻健建前秦。',
    en: 'Of the Di people, ancestor of the Former Qin. He served Shi Hu in the Later Zhao. When Shi Hu died and the Di scattered, Fu Hong led them into Guanzhong and called himself King of Qin — and was soon poisoned by his own men. His son Fu Jian (the earlier) founded the Former Qin.',
  },
  'hist-fu-xiong': {
    zh: '苻洪之子。後敗於石虎,降之。苻洪死,苻雄輔苻健建前秦。位至車騎大將軍。',
    en: 'Son of Fu Hong. After being broken by Shi Hu he submitted to him. When Fu Hong died, Fu Xiong helped Fu Jian (the elder) found the Former Qin. He rose to Grand General of Chariots and Cavalry.',
  },
  'hist-murong-huang': {
    zh: '前燕開國皇帝,字元真,鮮卑慕容部首領。在位十六年。建立前燕,定都龍城,後遷都鄴。',
    en: 'Founding emperor of the Former Yan, style Yuanzhen, chieftain of the Xianbei Murong. Sixteen years he reigned. He founded the Former Yan, set the capital first at Longcheng, then at Ye.',
  },
  'hist-murong-jun': {
    zh: '前燕第二代皇帝,慕容皝之子。在位十一年。滅冉魏,取河北,定都鄴。',
    en: 'Second emperor of the Former Yan, son of Murong Huang. Eleven years he reigned. He destroyed the Ran Wei, took the north of the river, and set the capital at Ye.',
  },
  'hist-murong-ke': {
    zh: '字玄恭,慕容皝之子。前燕宗室。輔幼主慕容暐,為太宰、太傅。性溫雅,有大略,前燕第一賢相。卒,前燕由是衰。',
    en: 'Style Xuangong, son of Murong Huang. A prince of the Former Yan. He served the boy-ruler Murong Wei as Grand Steward and Grand Tutor. Mild and refined, of great strategy — the first worthy chancellor of the Former Yan. At his death the Former Yan declined.',
  },
  'hist-tuoba-gui': {
    era: { zh: '北魏太祖', en: 'Emperor Taizu of Northern Wei' },
    zh: '字涉珪,鮮卑拓跋部首領。北魏開國皇帝。年十六起兵代北,平諸部,統一北方一隅。後敗於後燕,後北上敗後燕,定都平城。在位二十三年,被子拓跋紹所弒。',
    en: 'Style Shegui, chieftain of the Xianbei Tuoba. Founding emperor of Northern Wei. At sixteen he raised troops north of Dai, settled the tribes, and unified a corner of the north. Beaten by the Later Yan first, he then marched north and broke them, setting the capital at Pingcheng. Twenty-three years he reigned and was killed by his son Tuoba Shao.',
  },
  'hist-xiao-daocheng': {
    era: { zh: '南齊高帝', en: 'Emperor Gao of Southern Qi' },
    zh: '字紹伯,蘭陵人。南齊開國皇帝。劉宋大將,後篡宋建齊。在位四年崩,壽五十六。',
    en: 'Style Shaobo, of Lanling. Founding emperor of the Southern Qi. A great general of Liu Song, he replaced Song and founded Qi. Four years he reigned and died at fifty-six.',
  },
  'hist-xiao-tong': {
    era: { zh: '昭明太子', en: 'Crown Prince Zhaoming' },
    zh: '字德施,梁武帝蕭衍長子。昭明太子。性仁孝好學,主編《昭明文選》三十卷,中國第一部詩文總集,千古文人必讀之書。年三十一早卒,世以為惜。',
    en: 'Style Deshi, eldest son of Emperor Wu of Liang. Crown Prince Zhaoming. Kind, filial, and fond of learning, he led the compilation of the Wenxuan in thirty fascicles — the first general anthology of Chinese poetry and prose, the indispensable book of every man of letters. He died young at thirty-one, and the world has grieved him.',
  },
  'hist-xie-lingyun': {
    era: { zh: '山水詩祖', en: 'Founder of Landscape Poetry' },
    zh: '字宣明,陳郡陽夏人,謝玄之孫。南朝劉宋文人,中國山水詩之祖。屢遭貶謫,終以謀反罪被殺於廣州,年四十九。',
    en: 'Style Xuanming, of Yangxia in Chen, grandson of Xie Xuan. A writer of Liu Song in the Southern Dynasties, founder of Chinese landscape poetry. Sent down again and again, he was at last killed at Guangzhou on a charge of revolt at forty-nine.',
  },
  'hist-yu-xin': {
    era: { zh: '哀江南賦', en: 'The Lament for the South' },
    zh: '字子山,南陽新野人。南北朝大文學家。原仕梁,出使西魏被扣,事西魏、北周二十餘年。位至開府儀同三司,然終身思南,作《哀江南賦》,千古絕唱。',
    en: 'Style Zishan, of Xinye in Nanyang. A great writer of the Northern and Southern Dynasties. Originally with Liang, sent as envoy to Western Wei he was held, and served Western Wei and Northern Zhou for twenty years. He rose to Kaifu Yitong Sansi. All his life he longed for the south, and his Lament for the South rings forever.',
  },
  'hist-tao-hongjing': {
    era: { zh: '山中宰相', en: 'Chancellor in the Mountains' },
    zh: '字通明,丹陽秣陵人。南朝齊梁間道士、醫家、煉丹家。隱於茅山,梁武帝書信頻通,每有大事必問之,世稱「山中宰相」。著《本草經集注》、《真誥》。',
    en: 'Style Tongming, of Moling in Danyang. A Daoist adept, physician, and alchemist of the Southern Qi and Liang. Hidden on Mount Mao, he exchanged letters often with Emperor Wu of Liang, who asked him before every great matter — the world called him the "Chancellor in the Mountains." The Collected Annotations on Materia Medica and the True Declarations are his.',
  },
  'hist-ge-hong': {
    era: { zh: '抱朴子', en: '"He Who Embraces Simplicity"' },
    zh: '字稚川,自號抱朴子,丹陽句容人。東晉道士、煉丹家、醫家。著《抱朴子》內外篇、《肘後備急方》。中華煉丹術、化學之祖。',
    en: 'Style Zhichuan, calling himself "He Who Embraces Simplicity," of Jurong in Danyang. A Daoist adept, alchemist, and physician of the Eastern Jin. The Inner and Outer Chapters of the Baopuzi and the Emergency Recipes for One\'s Elbow Pocket are his — an ancestor of Chinese alchemy and chemistry.',
  },
  'hist-kou-qianzhi': {
    zh: '字輔真,馮翊萬年人。北魏道士。改革天師道,創北天師道,被北魏太武帝奉為國師,主持滅佛之事。',
    en: 'Style Fuzhen, of Wannian in Fengyi. A Daoist of Northern Wei. He reformed the Way of the Celestial Masters and founded the Northern school; Emperor Taiwu of Northern Wei honored him as State Preceptor and used him in the persecution of the Buddhists.',
  },
  'hist-jia-sixie': {
    era: { zh: '齊民要術', en: 'Author of the Essential Arts for the People' },
    zh: '北魏農學家。著《齊民要術》十卷,記中國北方農業之全,中國現存最早之農書,世界農學之珍。',
    en: 'A specialist in agriculture of Northern Wei. He wrote the Essential Arts for the People in ten fascicles — a complete record of the agriculture of north China, the earliest extant farming manual in China, a treasure of world agricultural science.',
  },
  'hist-gan-bao': {
    zh: '字令升,新蔡人。東晉史學家、文學家。著《搜神記》二十卷,中國志怪小說之祖。又著《晉紀》,記西晉一朝之事。',
    en: 'Style Lingsheng, of Xincai. A historian and writer of Eastern Jin. He wrote In Search of the Supernatural in twenty fascicles — the founding work of the Chinese tale of the strange. He also wrote the Jin Annals, a record of the Western Jin.',
  },
  'hist-liu-yiqing': {
    era: { zh: '世說新語', en: 'A New Account of the Tales of the World' },
    zh: '南朝劉宋宗室,臨川王。主編《世說新語》,記魏晉名士風流軼事,千古文人之必讀,中國筆記小說之祖。',
    en: 'A prince of Liu Song in the Southern Dynasties, Prince of Linchuan. He led the compilation of A New Account of the Tales of the World, recording the elegant tales of the Wei-Jin gentlemen — read by every man of letters for the ages, the founder of the Chinese miscellany.',
  },
  'hist-jiang-yan': {
    era: { zh: '江郎才盡', en: '"Lord Jiang\'s Talent Has Run Dry"' },
    zh: '字文通,濟陽考城人。南朝梁文人。少有才,作《別賦》、《恨賦》,千古傳誦。晚年才思衰退,世以「江郎才盡」為俗語。',
    en: 'Style Wentong, of Kaocheng in Jiyang. A writer of Liang in the Southern Dynasties. Talented in youth, his Rhapsody on Parting and Rhapsody on Regret are read forever. In old age his talent ran thin, and "Lord Jiang\'s talent has run dry" became a saying.',
  },
  'hist-yan-zhitui': {
    era: { zh: '顏氏家訓', en: 'Author of the Family Instructions of the Yan Clan' },
    zh: '字介,琅琊臨沂人。北齊、北周、隋三朝臣。著《顏氏家訓》二十篇,中華第一部家訓,千古傳為治家之典。',
    en: 'Style Jie, of Linyi in Langya. A minister of three dynasties — Northern Qi, Northern Zhou, and Sui. He wrote the Family Instructions of the Yan Clan in twenty pieces — the first family-instructions text of China, a model of household discipline for the ages.',
  },
  'hist-gao-huan': {
    era: { zh: '北齊高祖', en: 'High Founder of Northern Qi' },
    zh: '字賀六渾,渤海蓨人。鮮卑化漢人,東魏權臣。立元善見為孝靜帝,挾天子以令諸侯。屢與宇文泰爭,玉璧之戰大敗,憂憤而卒。其子高洋篡東魏建北齊。',
    en: 'Style Heliuhun, of Tiao in Bohai. A Xianbei-acculturated Han, the great power-holder of the Eastern Wei. He set up Yuan Shanjian as Emperor Xiaojing and held the throne to command the realm. He fought Yuwen Tai again and again; broken at Yubi he died of grief and rage. His son Gao Yang took the Eastern Wei throne and founded Northern Qi.',
  },
  'hist-gao-yang': {
    era: { zh: '北齊文宣帝', en: 'Emperor Wenxuan of Northern Qi' },
    zh: '高歡次子。篡東魏建北齊。在位十年,前期英武,後期沉湎酒色,大殺宗室、大臣,殘暴無道。卒於三十一歲。',
    en: 'Second son of Gao Huan. He took the Eastern Wei throne and founded Northern Qi. Ten years he reigned: brave and bold at first, in his later years he drowned in wine and women and killed the princes and great ministers — cruel and faithless. He died at thirty-one.',
  },
  'hist-gao-cheng': {
    zh: '字子惠,高歡長子。東魏權臣,大將軍。性聰穎,有才略。與弟高洋共執朝政。為廚奴蘭京所殺,年二十九。',
    en: 'Style Zihui, eldest son of Gao Huan. A great power-holder of the Eastern Wei, Grand Marshal. Sharp and capable. With his brother Gao Yang he held the court. He was killed by the kitchen-slave Lan Jing at twenty-nine.',
  },
  'hist-yuwen-tai': {
    era: { zh: '北周太祖', en: 'Founder of Northern Zhou' },
    zh: '字黑獺,鮮卑化匈奴人。西魏權臣。立元寶炬為文帝,挾天子以令諸侯。與高歡對峙,玉璧之戰大破之。建府兵制,為隋唐之基。卒,子宇文覺篡西魏建北周。',
    en: 'Style Heita, a Xiongnu Xianbei-acculturated man. Great power-holder of Western Wei. He set up Yuan Baoju as Emperor Wen and held the throne to command the realm. Against Gao Huan he broke him utterly at Yubi. He set up the Garrison Militia system, the foundation of Sui and Tang. At his death his son Yuwen Jue took the Western Wei throne and founded Northern Zhou.',
  },
  'hist-yuwen-yong': {
    era: { zh: '北周武帝', en: 'Emperor Wu of Northern Zhou' },
    zh: '宇文邕,宇文泰第四子。北周第三代皇帝。誅權臣宇文護,親政。建德六年滅北齊,統一北方。又行滅佛之政(三武滅佛之一)。卒於伐突厥途中,年三十六。隋楊堅以其女為后。',
    en: 'Yuwen Yong, fourth son of Yuwen Tai. Third emperor of Northern Zhou. He killed the powerful Yuwen Hu and took up rule himself. In 577 he ended the Northern Qi and unified the north. He also persecuted the Buddhists (one of the Three Wu persecutions). He died on the campaign against the Türks at thirty-six. Yang Jian of Sui made his daughter empress.',
  },
  'hist-yuwen-hu': {
    zh: '宇文泰之姪。北周權臣。執政十六年,廢殺孝閔帝、明帝二帝,專橫跋扈。後被武帝宇文邕誅之,夷三族。',
    en: 'Nephew of Yuwen Tai. The great power-holder of Northern Zhou. Sixteen years he held the court, deposing and killing two emperors — Xiaomin and Ming. Wild and overweening, he was at last killed by Emperor Wu Yuwen Yong and his clan exterminated to three branches.',
  },
  'hist-erzhu-rong': {
    zh: '北秀容人。北魏末權臣。河陰之變,殺胡太后與幼主,沉於黃河,又屠百官二千餘人,京師為空。後孝莊帝設計殺之,北魏遂亂。',
    en: 'Of Beixiurong. The great power-holder at the end of Northern Wei. In the Heyin incident he killed the Empress Dowager Hu and the boy-emperor, sinking them in the Yellow River, and butchered over two thousand officials — the capital was emptied. Emperor Xiaozhuang later laid the plot that killed him, and Northern Wei fell into chaos.',
  },
  'hist-wei-xiaokuan': {
    era: { zh: '玉璧守將', en: 'Defender of Yubi' },
    zh: '字孝寬,京兆杜陵人。西魏、北周名將。玉璧之戰,以一城之兵拒高歡十萬之眾,圍五十日不下。高歡憂憤而卒。功在千秋,周武帝倚之以滅北齊。',
    en: 'Style Xiaokuan, of Duling in the metropolitan region. A famed general of Western Wei and Northern Zhou. At Yubi with one city\'s force he held Gao Huan\'s hundred thousand for fifty days; the siege failed and Gao Huan died of grief and rage. His merit will not fade — Emperor Wu of Zhou leaned on him for the conquest of Northern Qi.',
  },
  'hist-huan-xuan': {
    zh: '字敬道,譙國龍亢人,桓溫之子。東晉末權臣。元興元年篡晉,改國號楚。在位三月,劉裕起兵討之,桓玄敗走江陵,被馮遷所殺。',
    en: 'Style Jingdao, of Longkang in Qiao, son of Huan Wen. Great power-holder at the end of Eastern Jin. In 403 he took the Jin throne and changed the dynasty\'s name to Chu. Three months he reigned; Liu Yu raised troops against him, and Huan Xuan fled to Jiangling, where Feng Qian killed him.',
  },
  'hist-liu-yu': {
    era: { zh: '宋武帝', en: 'Emperor Wu of Liu Song' },
    zh: '字德輿,小字寄奴,彭城人。南朝劉宋開國皇帝。出身寒微,從軍起家。平桓玄之亂,北伐後秦,克長安。後篡晉建宋。在位三年崩。',
    en: 'Style Deyu, child-name Jinu, of Pengcheng. Founding emperor of Liu Song in the Southern Dynasties. Of humble birth, he rose through the army. He put down Huan Xuan\'s revolt, marched north against the Later Qin, and took Chang\'an. He then took the Jin throne and founded Song. Three years he reigned.',
  },
  'hist-liu-laozhi': {
    zh: '字道堅,彭城人。東晉北府兵將領。淝水之戰先登破敵,屢立戰功。後事桓玄,桓玄篡晉,劉牢之憂憤自縊。',
    en: 'Style Daojian, of Pengcheng. A commander of the Beifu troops of Eastern Jin. At Feishui he was first to break the enemy, and won many laurels. He later served Huan Xuan; when Huan Xuan took the Jin throne, Liu Laozhi hanged himself in despair.',
  },
  'hist-huan-chong': {
    zh: '字幼子,譙國龍亢人,桓溫之弟。東晉名將。鎮荊州,治民有方,與謝安共扶晉室,東晉得以維持。',
    en: 'Style Youzi, of Longkang in Qiao, younger brother of Huan Wen. A famed general of Eastern Jin. Holding Jingzhou he ruled the people well; with Xie An he upheld the Jin house, and Eastern Jin endured.',
  },
  'hist-yu-liang': {
    zh: '字元規,潁川鄢陵人。東晉名臣,晉成帝舅。屢執朝政。性自負,逼蘇峻之亂,京師大破。後憂憤而卒。',
    en: 'Style Yuangui, of Yanling in Yingchuan. A famed minister of Eastern Jin, uncle of Emperor Cheng. He held the court many times. Proud by nature, he provoked Su Jun\'s revolt and the capital was broken. He died of grief and rage.',
  },
  'hist-yu-bing': {
    zh: '字季堅,庾亮之弟。事東晉成帝、康帝,以中書令掌機要。',
    en: 'Style Jijian, younger brother of Yu Liang. He served Emperors Cheng and Kang of Eastern Jin as Director of the Imperial Secretariat, holding the state\'s secrets.',
  },
  'hist-wang-yan': {
    era: { zh: '清談誤國', en: 'Pure Talk that Ruined the State' },
    zh: '字夷甫,琅琊臨沂人。西晉名士。容貌姣麗,清談玄理,身居宰輔而不問政事,以「口中無雌黃」為時尚。八王之亂中為東海王越所重。永嘉之亂,被石勒所擒,石勒築土埋之,曰:「凡為天下計者,豈得以浮華誤蒼生!」',
    en: 'Style Yifu, of Linyi in Langya. A famed gentleman of Western Jin. Of fair appearance and master of pure conversation, he held the chancellorship without troubling about government — "no orpiment in the mouth" was his fashion. In the War of Eight Princes Prince Yue of Donghai prized him. In the Yongjia chaos Shi Le took him alive and had him buried alive in earth: "He who plans for the realm — should he use empty bloom to mislead the common folk?"',
  },
  'hist-wei-jie': {
    era: { zh: '看殺衛玠', en: '"They Stared Wei Jie to Death"' },
    zh: '字叔寶,河東安邑人。西晉美男子。容貌絕美,白如玉雪。從建康渡江,觀者如堵牆,目不暫舍,衛玠不堪,病臥而卒,年二十七。世傳「看殺衛玠」。',
    en: 'Style Shubao, of Anyi in Hedong. The most beautiful man of Western Jin. Of unmatched beauty, white as jade and snow. As he crossed the Yangzi to Jiankang the onlookers stood as a wall, eyes never leaving him; he could not bear it, fell sick, and died at twenty-seven. They say: "They stared Wei Jie to death."',
  },
  'hist-li-xiong': {
    zh: '字仲俊,巴西宕渠人。成漢開國皇帝。在位三十年。建立成漢,定都成都。性節儉,任賢納諫,蜀中得以休養生息。',
    en: 'Style Zhongjun, of Dangqu in Baxi. Founding emperor of the Cheng Han. Thirty years he reigned. He founded Cheng Han and set the capital at Chengdu. Frugal in life, raising worthies and heeding counsel — Shu rested and grew under him.',
  },
  'hist-ji-shao': {
    era: { zh: '血染御衣', en: 'Blood Across the Imperial Robe' },
    zh: '字延祖,嵇康之子。父被司馬昭所殺,山濤撫之如子,薦於武帝,事晉。八王之亂,惠帝為亂兵所迫,嵇紹以身翼蔽,被亂兵殺於御前,血濺御衣。亂定,左右欲洗其衣,惠帝曰:「此嵇侍中之血,勿浣!」 千古忠臣之冠。',
    en: 'Style Yanzu, son of Ji Kang. When his father was killed by Sima Zhao, Shan Tao raised him as his own and recommended him to Emperor Wu. In the War of Eight Princes, when Emperor Hui was beset by mutineers, Ji Shao covered him with his body and was struck down beside the imperial seat, his blood across the robe. When the chaos was over and attendants would wash it out, Emperor Hui said: "This is the blood of Palace Attendant Ji — let it not be washed!" The greatest of loyal ministers for the ages.',
  },
  'hist-jia-chong': {
    zh: '字公閭,平陽襄陵人。司馬昭智囊。高貴鄉公率殿中宿衛攻司馬昭,賈充令成濟弒之。司馬炎即位,封魯郡公,位至太尉。其女賈南風為惠帝皇后,八王之亂禍源。',
    en: 'Style Gonglü, of Xiangling in Pingyang. Sima Zhao\'s brain. When the Duke of Gaogui led the palace guards out against Sima Zhao, it was Jia Chong who told Cheng Ji to strike the emperor down. When Sima Yan took the throne, Jia Chong was made Duke of Lu commandery and rose to Grand Marshal. His daughter Jia Nanfeng became Empress of Emperor Hui — the wellspring of the War of Eight Princes.',
  },
  'hist-jia-nanfeng': {
    era: { zh: '八王之亂之源', en: 'Wellspring of the War of Eight Princes' },
    zh: '賈充之女,晉惠帝皇后。性陰險,貌醜悍妒。專權十年,殺楊太后,廢愍懷太子,引諸王相爭。趙王倫廢之為庶人,旋鴆殺於金墉。年四十五。',
    en: 'Daughter of Jia Chong, empress of Emperor Hui of Jin. Sinister, ugly, fierce, and jealous. Ten years she held power: killed Empress Dowager Yang, deposed Crown Prince Minhuai, and set the princes to fighting. Prince Lun of Zhao reduced her to commoner and soon after poisoned her at Jinyong. Forty-five years old.',
  },
  'hist-wang-rong': {
    zh: '字濬沖,琅琊臨沂人,王戎,竹林七賢中最年少者。父早卒,以孝聞。事晉,位至司徒。性貪吝,自種好李,鬻之而恐人得其種,鑽其核。世以為儉吝之最。',
    en: 'Style Junchong, of Linyi in Langya, the youngest of the Seven Sages of the Bamboo Grove. His father died young and he was famed for filial piety. Under Jin he rose to Excellency over the Masses. Yet of grasping temper — he grew fine plums, and when he sold them he bored out the pits for fear others would plant his stock. The world held him the meanest miser of the age.',
  },
  // ─── 歷代名將 新增第七批 (Historical biographies — batch 7: Sui & Tang) ───
  'hist-gao-jiong': {
    zh: '字昭玄,渤海蓚人。隋朝開國名相。輔楊堅篡周建隋,定典章制度,平陳統一,功冠群臣。後與獨孤皇后不睦,被廢黜。煬帝時為太常,坐諫被殺。',
    en: 'Style Zhaoxuan, of Tiao in Bohai. A founding great chancellor of Sui. He helped Yang Jian take the Northern Zhou throne and found Sui, set the institutions and laws, broke Chen to unify the realm — his merit above all. He later fell out with Empress Dugu and was deposed. Under Emperor Yang he was Minister of Ceremonies; killed for remonstrating.',
  },
  'hist-yang-yong': {
    zh: '隋文帝楊堅長子,初立為太子。性寬厚,然好奢侈,與獨孤皇后不諧。煬帝楊廣設計奪嫡,廢楊勇為庶人。煬帝即位,賜死之。',
    en: 'Eldest son of Yang Jian of Sui, first heir. Broad and kind, but lavish — at odds with Empress Dugu. Yang Guang laid the plot to steal the heirship, and Yang Yong was deposed to commoner. When Yang Guang took the throne he sent down a draught of death.',
  },
  'hist-yang-xuangan': {
    zh: '楊素之子。隋末起兵反煬帝,圍洛陽,失敗自殺,夷其族。',
    en: 'Son of Yang Su. In late Sui he raised troops against Emperor Yang and laid siege to Luoyang; broken, he killed himself, and his clan was exterminated.',
  },
  'hist-yuwen-huaji': {
    zh: '隋末權臣。江都之變,弒煬帝楊廣於江都行宮。後稱許帝,旋為竇建德所擒,被斬。',
    en: 'A great power-holder at the end of Sui. In the Jiangdu mutiny he strangled Emperor Yang at the Jiangdu travel-palace. He then called himself Emperor of Xu; soon caught by Dou Jiande and beheaded.',
  },
  'hist-zhai-rang': {
    zh: '韋城人。隋末瓦崗軍創始人。後李密入軍,翟讓讓位於李密。李密疑之,使人殺翟讓於宴上。瓦崗軍由是亂。',
    en: 'Of Weicheng. Founder of the Wagang army at the end of Sui. When Li Mi joined, Zhai Rang yielded the leadership to him. Li Mi grew suspicious and had Zhai Rang killed at a banquet; the Wagang army was thrown into chaos.',
  },
  'hist-dou-jiande': {
    era: { zh: '夏王', en: 'King of Xia' },
    zh: '貝州漳南人。隋末群雄之一。據河北,稱夏王,治民有方,百姓擁戴。後援王世充被李世民擒於虎牢關,押至長安斬之。河北民懷之,立廟祭祀。',
    en: 'Of Zhangnan in Beizhou. One of the great rebels at the end of Sui. He held the north of the river and called himself King of Xia, ruling the people well and beloved by them. When he marched to relieve Wang Shichong he was taken by Li Shimin at Hulao Pass, sent to Chang\'an, and beheaded. The people of the north remembered him and built shrines for the offerings.',
  },
  'hist-wang-shichong': {
    zh: '字行滿,西域胡人,後遷洛陽。隋末權臣。鎮洛陽,以楊侗為帝。後篡之,自稱鄭帝。為李世民所破,被擒。本應赦免,獨孤修德為父報仇殺之。',
    en: 'Style Xingman, a Hu of the Western Regions, later moved to Luoyang. A great power-holder at the end of Sui. Holding Luoyang he set up Yang Tong as emperor and then took the throne himself, calling himself Emperor of Zheng. Broken by Li Shimin and taken alive, he was to be pardoned — but Dugu Xiude killed him to avenge his father.',
  },
  'hist-liu-wuzhou': {
    zh: '隋末群雄之一。據馬邑,稱定楊可汗。後敗於李世民,奔突厥被殺。其將尉遲恭歸唐,為名將。',
    en: 'One of the great rebels at the end of Sui. He held Mayi and called himself the Dingyang Khagan. Broken by Li Shimin he fled to the Türks and was killed. His captain Yuchi Gong came to Tang and became a famed general.',
  },
  'hist-xue-ju': {
    zh: '隋末群雄之一。據隴右,稱秦帝。子薛仁杲繼立。後被李世民所破,薛仁杲被斬,薛氏遂亡。',
    en: 'One of the great rebels at the end of Sui. He held the western marches and called himself Emperor of Qin. His son Xue Rengao took over; broken by Li Shimin, Xue Rengao was beheaded and the Xue line ended.',
  },
  'hist-li-jiancheng': {
    zh: '唐高祖李淵長子。初立為太子。與李世民爭嫡,玄武門之變被李世民射殺,年三十八。',
    en: 'Eldest son of Gaozu of Tang, first heir. He contested the heirship with Li Shimin; in the Xuanwu Gate incident Li Shimin shot him down at thirty-eight.',
  },
  'hist-zhangsun-wuji': {
    zh: '字輔機,河南洛陽人。唐太宗皇后長孫氏之兄。玄武門之變預謀,唐初第一功臣。後因反對立武則天為后,被許敬宗構陷,流黔州,自縊而死。',
    en: 'Style Fuji, of Luoyang in Henan. Elder brother of Empress Zhangsun of Taizong. In the Xuanwu Gate incident he was the chief planner — first founding minister of Tang. Later, opposing Wu Zetian\'s elevation as empress, he was framed by Xu Jingzong, exiled to Qianzhou, and hanged himself.',
  },
  'hist-hou-junji': {
    zh: '字伯通,豳州三水人。唐太宗名將。平吐谷渾、伐高昌,有大功。後與李承乾謀反,被誅,夷其家。',
    en: 'Style Botong, of Sanshui in Binzhou. A famed general of Taizong. He pacified the Tuyuhun and broke Gaochang with great merit. Later he plotted revolt with the Crown Prince Li Chengqian and was killed, his household exterminated.',
  },
  'hist-li-chengqian': {
    zh: '唐太宗長子。初立為太子。性放縱,與漢王李元昌、駙馬都尉杜荷、侯君集謀反,事敗被廢為庶人,流黔州而卒。',
    en: 'Eldest son of Taizong, first heir. Loose in life, he plotted revolt with Prince Yuanchang of Han, the Imperial Son-in-Law Du He, and Hou Junji; the plot failed and he was reduced to commoner, exiled to Qianzhou, where he died.',
  },
  'hist-su-dingfang': {
    era: { zh: '初唐二虎', en: 'One of the Two Tigers of Early Tang' },
    zh: '字定方,冀州武邑人。唐初名將。前後滅國三,執其主。平西突厥、滅百濟、伐高句麗,功冠一時。與李靖並稱「初唐二虎」。卒年七十六。',
    en: 'Style Dingfang, of Wuyi in Jizhou. A famed early-Tang general. He destroyed three kingdoms and took three rulers — Western Türks, Baekje, Goguryeo — his merit above the age. With Li Jing he was named one of the Two Tigers of early Tang. He died at seventy-six.',
  },
  'hist-yao-chong': {
    era: { zh: '救時宰相', en: '"Chancellor Who Saves the Age"' },
    zh: '字元之,陝州硤石人。唐玄宗開元名相。獻「十事要說」,治蝗有方,理財有道,開創開元盛世。世稱「救時宰相」。卒年七十二。',
    en: 'Style Yuanzhi, of Xiashi in Shaanzhou. A famed chancellor of Xuanzong\'s Kaiyuan reign. He gave the "Ten Affairs Memorial," tamed the locust plague, ordered the treasury — and opened the Kaiyuan golden age. The world called him the "Chancellor Who Saves the Age." He died at seventy-two.',
  },
  'hist-song-jing': {
    zh: '字廣平,邢州南和人。唐玄宗開元名相。繼姚崇為相,直言敢諫。剛正不阿,如石之堅,故有「有腳陽春」之稱。卒年七十五。',
    en: 'Style Guangping, of Nanhe in Xingzhou. A famed chancellor of Xuanzong\'s Kaiyuan reign, succeeding Yao Chong. Straight of speech, upright, hard as stone — they called him "spring on legs." He died at seventy-five.',
  },
  'hist-zhang-jiuling': {
    zh: '字子壽,韶州曲江人。唐玄宗時宰相。風儀俊美,文采斐然。屢諫玄宗勿用李林甫、安祿山,玄宗不聽,後悔之。「海上生明月,天涯共此時」千古絕唱。',
    en: 'Style Zishou, of Qujiang in Shaozhou. A chancellor under Xuanzong of Tang. Of handsome bearing and splendid in letters. He often warned the emperor against using Li Linfu and An Lushan; the emperor would not hear, and afterwards repented. "The bright moon rises over the sea / from a far horizon, we share this hour" rings forever.',
  },
  'hist-li-linfu': {
    era: { zh: '口蜜腹劍', en: '"Honey on the Lips, Sword in the Belly"' },
    zh: '唐玄宗宰相。表面溫和,背後陰險,世稱「口蜜腹劍」。專權十九年,排擠賢臣,引安祿山入朝,埋安史之亂之禍根。卒後被楊國忠所構,削官奪爵,棺槨被毀。',
    en: 'A chancellor of Xuanzong of Tang. Sweet on the surface, sinister beneath — the world said: "Honey on the lips, a sword in the belly." Nineteen years he held power, pushing aside the worthy and bringing An Lushan to court — the seed of the An Lushan rebellion. After his death Yang Guozhong framed him: his office was stripped, his rank taken, and his coffin destroyed.',
  },
  'hist-yang-guozhong': {
    zh: '楊貴妃之堂兄。唐玄宗末年宰相。專權跋扈,與安祿山相忌。馬嵬坡之變,陳玄禮率眾誅之,楊貴妃亦被縊。',
    en: 'Cousin of Yang Guifei. Chancellor at the end of Xuanzong\'s reign. Overbearing, and at odds with An Lushan. At Mawei Slope, Chen Xuanli led the men to kill him, and Yang Guifei was hanged.',
  },
  'hist-li-longji': {
    era: { zh: '唐玄宗', en: 'Emperor Xuanzong of Tang' },
    zh: '名李隆基,唐睿宗第三子。誅韋后、太平公主,即位。在位四十四年,前期任姚崇、宋璟,開「開元盛世」,唐極盛之時。後期寵楊貴妃,任李林甫、楊國忠,引安史之亂。奔蜀,馬嵬坡縊貴妃。返京後為太上皇,憂憤而卒。',
    en: 'Personal name Li Longji, third son of Ruizong of Tang. He killed Empress Wei and the Taiping Princess and took the throne. Forty-four years he reigned: in the early years with Yao Chong and Song Jing he opened the Kaiyuan golden age, the peak of Tang. In the later years he doted on Yang Guifei and used Li Linfu and Yang Guozhong, bringing on the An Lushan rebellion. He fled to Shu and at Mawei Slope had Yang Guifei hanged. Back in the capital as Grand Emperor, he died of grief and rage.',
  },
  'hist-tang-gaozong': {
    zh: '名李治,唐太宗第九子。在位三十四年。平百濟、滅高句麗,唐疆極盛。然身體孱弱,武則天參政,終致武則天稱帝。',
    en: 'Personal name Li Zhi, ninth son of Taizong of Tang. Thirty-four years he reigned. He pacified Baekje and ended Goguryeo — Tang reached its widest. Yet weak in body, he let Wu Zetian share in government — and at last she took the throne.',
  },
  'hist-shangguan-waner': {
    era: { zh: '巾幗宰相', en: 'Chancellor in Women\'s Garb' },
    zh: '陝州陝縣人,上官儀之孫女。武則天時昭容。掌詔誥,巾幗宰相。後事中宗韋后,神龍之變後被殺,年四十六。著《全唐詩》存其詩三十二首。',
    en: 'Of Shaan county in Shaanzhou, granddaughter of Shangguan Yi. A Lady Zhaorong of Wu Zetian. She held the imperial edicts — a chancellor in women\'s garb. She later served Empress Wei of Zhongzong; after the Shenlong incident she was killed at forty-six. The Complete Tang Poems hold thirty-two of her pieces.',
  },
  'hist-taiping': {
    zh: '太平公主,武則天之女。性聰慧而野心勃勃。神龍之變後,屢預朝政。後與李隆基爭權,事敗被賜死於家。',
    en: 'The Taiping Princess, daughter of Wu Zetian. Sharp and ambitious. After the Shenlong incident she joined in court affairs again and again. Locked in struggle with Li Longji, she was beaten and given a draught of death at her home.',
  },
  'hist-wang-bo': {
    era: { zh: '初唐四傑', en: 'One of the Four Greats of Early Tang' },
    zh: '字子安,絳州龍門人。初唐四傑之首,與楊炯、盧照鄰、駱賓王並稱。年十四即作《滕王閣序》,「落霞與孤鶩齊飛,秋水共長天一色」千古絕唱。年二十七渡海溺死。',
    en: 'Style Zi\'an, of Longmen in Jiangzhou. First of the Four Greats of early Tang, with Yang Jiong, Lu Zhaolin, and Luo Binwang. At fourteen he wrote the Preface to the Tengwang Pavilion: "The fallen rosy clouds and the lone wild goose fly together / the autumn waters and the long sky are of one color." At twenty-seven he was drowned crossing the sea.',
  },
  'hist-luo-binwang': {
    zh: '初唐四傑之一。年七歲作《詠鵝》,千古傳誦。徐敬業起兵討武則天,駱賓王作《討武曌檄》,武則天讀之歎曰:「宰相安得失此人!」 後失敗下落不明。',
    en: 'One of the Four Greats of early Tang. At seven he wrote the Ode to the Goose, still read today. When Xu Jingye rose against Wu Zetian, Luo Binwang wrote the Proclamation Against Wu Zhao. Wu Zetian read it and sighed: "How could the chancellor have let this man slip!" After the rising failed, his fate was unknown.',
  },
  'hist-yang-jiong': {
    zh: '初唐四傑之一。「寧為百夫長,勝作一書生」千古傳誦,《從軍行》之名句。',
    en: 'One of the Four Greats of early Tang. "Better be the captain of a hundred than a single scholar" — the famous line from his Marching to War.',
  },
  'hist-lu-zhaolin': {
    zh: '初唐四傑之一。久病不愈,投潁水而死。《長安古意》傳世。',
    en: 'One of the Four Greats of early Tang. After long incurable illness he threw himself into the Ying River. The Ancient Meanings of Chang\'an is his.',
  },
  'hist-meng-haoran': {
    era: { zh: '山水田園詩派', en: 'Master of Pastoral Verse' },
    zh: '字浩然,襄州襄陽人。盛唐詩人。與王維齊名,山水田園詩派之祖。隱於鹿門山,終身不仕。「春眠不覺曉,處處聞啼鳥」千古傳誦。',
    en: 'Style Haoran, of Xiangyang in Xiangzhou. A poet of the High Tang. With Wang Wei he was the founder of the school of landscape and pastoral verse. He hid himself on Mount Lumen and never took office. "Spring sleep — I do not feel the dawn / everywhere I hear the calling birds" rings forever.',
  },
  'hist-wang-wei': {
    era: { zh: '詩佛', en: 'Buddha of Poetry' },
    zh: '字摩詰,蒲州人。盛唐詩人、畫家。山水田園詩派代表,與孟浩然並稱。蘇軾贊其「詩中有畫,畫中有詩」。「大漠孤煙直,長河落日圓」、「明月松間照,清泉石上流」千古傳誦。',
    en: 'Style Mojie, of Puzhou. A poet and painter of the High Tang. Representative of the landscape-pastoral school, ranked with Meng Haoran. Su Shi praised him: "In his poems there is painting; in his paintings, poetry." "On the great desert, the lone column of smoke straight / on the long river, the falling sun round" and "the bright moon shines among the pines / the clear spring flows on the stones" — read forever.',
  },
  'hist-wang-changling': {
    zh: '字少伯,京兆萬年人。盛唐詩人,「七絕聖手」。邊塞詩名世。「秦時明月漢時關,萬里長征人未還」、「但使龍城飛將在,不教胡馬度陰山」千古絕唱。',
    en: 'Style Shaobo, of Wannian in the metropolitan region. A High Tang poet, "Sage of the Seven-Character Quatrain." Famed for frontier verse. "The bright moon of Qin, the pass of Han / on the ten-thousand-li march men do not come back" and "If only the Flying General of Dragon City were still there / no Hu horse would cross Mount Yin" rang forever.',
  },
  'hist-wang-zhihuan': {
    zh: '字季陵,絳州人。盛唐邊塞詩人。「黃河遠上白雲間,一片孤城萬仞山」、「欲窮千里目,更上一層樓」千古絕唱。',
    en: 'Style Jiling, of Jiangzhou. A High Tang frontier poet. "The Yellow River climbs far to the white clouds / a lone wall in ten-thousand-ren hills" and "Would you exhaust a thousand li of sight? / Climb one more story of the tower" rang forever.',
  },
  'hist-wang-han': {
    zh: '盛唐詩人。《涼州詞》:「葡萄美酒夜光杯,欲飲琵琶馬上催。醉臥沙場君莫笑,古來征戰幾人回?」 千古絕唱。',
    en: 'A High Tang poet. His Liangzhou Song: "Grape wine in the moonlight-shining cup / I would drink, but the pipa hurries from the saddle. / If I lie drunk on the sand, do not laugh — / from ancient times, how many have come back from war?" Rang forever.',
  },
  'hist-cen-shen': {
    zh: '盛唐邊塞詩人,與高適並稱「高岑」。「忽如一夜春風來,千樹萬樹梨花開」千古絕唱。出使邊塞,作《白雪歌》、《走馬川行》傳世。',
    en: 'A High Tang frontier poet, ranked with Gao Shi as "Gao and Cen." "Suddenly, as if in one night a spring wind had come / on a thousand trees, ten thousand trees, the pear blossoms had opened" rang forever. Sent to the frontier he wrote the White Snow Song and the Marching on the Zouma River.',
  },
  'hist-gao-shi': {
    zh: '字達夫,渤海蓚人。盛唐邊塞詩人。與岑參齊名。為將有威略,平哥舒翰之亂。位至刑部侍郎。',
    en: 'Style Dafu, of Tiao in Bohai. A High Tang frontier poet, ranked with Cen Shen. As a general he carried weight and was bold of counsel — he put down the trouble of Geshu Han. He rose to Vice-Minister of Justice.',
  },
  'hist-he-zhizhang': {
    era: { zh: '四明狂客', en: 'The Mad Guest of Siming' },
    zh: '字季真,號四明狂客,越州永興人。盛唐詩人。見李白於長安,稱之為「謫仙人」。性放達好酒,與李白為忘年交。「少小離家老大回,鄉音無改鬢毛衰」千古傳誦。',
    en: 'Style Jizhen, called the Mad Guest of Siming, of Yongxing in Yuezhou. A High Tang poet. He met Li Bai at Chang\'an and called him "an immortal banished to earth." Free of temper and fond of wine, sworn friend to Li Bai despite the years between them. "Young I left my home, old I return — / my village tongue unchanged, my hair gone thin" rang forever.',
  },
  'hist-li-shangyin': {
    era: { zh: '小李', en: 'The Lesser Li' },
    zh: '字義山,號玉谿生,懷州河內人。晚唐詩人。與杜牧並稱「小李杜」。詩風朦朧瑰麗。「相見時難別亦難,東風無力百花殘」、「春蠶到死絲方盡,蠟炬成灰淚始乾」千古絕唱。',
    en: 'Style Yishan, called Yuxisheng, of Henei in Huaizhou. A late-Tang poet. With Du Mu he was called the "Lesser Li-Du." His verse was misted and splendid. "To meet is hard, to part hard too / the east wind has no strength, the hundred flowers wither" and "the spring silkworm spins until death stops its thread / the wax candle, turned to ash, only then dries its tears" rang forever.',
  },
  'hist-wen-tingyun': {
    zh: '字飛卿,太原祁人。晚唐詩人、詞人。詞風華麗,為「花間派」之祖。性放達不羈,屢試不第。',
    en: 'Style Feiqing, of Qi in Taiyuan. A late-Tang poet and ci poet. His ci was splendid — founder of the "Among the Flowers" school. Free and unbridled, he failed the examinations again and again.',
  },
  'hist-shi-siming': {
    zh: '營州寧夷州突厥人。安祿山部將,與安祿山並稱「安史」。安祿山死後,史思明繼領叛軍,稱大燕皇帝。後為其子史朝義所弒。',
    en: 'A Türk of Ningyi in Yingzhou. A captain of An Lushan, his name set with An\'s as "An and Shi." When An Lushan died, Shi Siming took up the rebel army and called himself emperor of Great Yan. He was killed by his son Shi Chaoyi.',
  },
  'hist-yang-fugong': {
    zh: '唐末權宦。掌神策軍,擁立昭宗。後與田令孜爭權。',
    en: 'A great eunuch of the late Tang. He held the Shence army and set up Emperor Zhao. He later contested power with Tian Lingzi.',
  },
  'hist-tian-lingzi': {
    zh: '唐末權宦。僖宗時掌神策軍。黃巢攻長安,僖宗奔蜀,皆田令孜謀。後失勢,被王建殺於成都。',
    en: 'A great eunuch of the late Tang. Under Emperor Xizong he held the Shence army. When Huang Chao took Chang\'an and Xizong fled to Shu, it was all Tian Lingzi\'s plan. He later fell from power and was killed by Wang Jian at Chengdu.',
  },
  'hist-li-mi-sui': {
    zh: '字玄邃,趙郡平棘人。隋末瓦崗軍領袖。出身關隴貴族,博學多才。瓦崗軍鼎盛時,擁兵三十萬,號稱要奪天下。後敗於王世充,投唐,又叛唐,被誅。',
    en: 'Style Xuansui, of Pingji in Zhaojun. Leader of the Wagang army in late Sui. Of the Guan-Long aristocracy, broadly learned. At its peak the Wagang army was three hundred thousand strong and meant to take the realm. Broken by Wang Shichong, he came to Tang, then rose against Tang, and was killed.',
  },
  'hist-li-jing-tangts': {
    zh: '參見「hist-li-jing」(唐衛公李靖)。',
    en: 'See hist-li-jing — Duke Wei of Tang.',
  },
  'hist-pugu-huai’en': {
    zh: '鐵勒族,唐肅宗時名將。從郭子儀平安史之亂,功冠群臣,封大寧王。後為宦官駱奉先所讒,反叛,引吐蕃、回紇圍長安。後病死於軍中。',
    en: 'Of the Tiele people, a famed general under Suzong of Tang. With Guo Ziyi he put down the An Lushan rebellion, his merit above all the ministers; made Prince of Daning. Slandered later by the eunuch Luo Fengxian, he rose in revolt and brought Tibet and the Uyghurs to besiege Chang\'an. He died of illness in camp.',
  },
  'hist-zhang-xun': {
    era: { zh: '睢陽守將', en: 'Defender of Suiyang' },
    zh: '安史之亂中,張巡與許遠以五千兵守睢陽十月,大小戰四百餘次,殺敵十二萬。城陷被俘,寧死不降,從容就義。古來忠烈第一。',
    en: 'In the An Lushan rebellion, Zhang Xun with Xu Yuan held Suiyang for ten months with five thousand men — four hundred fights large and small, a hundred and twenty thousand of the enemy killed. When the city fell he was taken; refusing to bend, he went calmly to his death. The first martyr of all ages.',
  },
  'hist-yan-gaoqing': {
    era: { zh: '罵賊不屈', en: 'Cursed the Rebels to the End' },
    zh: '顏真卿之兄。安史之亂,顏杲卿與顏真卿首倡義兵抗安祿山。城陷被執,顏杲卿大罵安祿山,被剮舌而死。一門忠烈,千古傳誦。',
    en: 'Elder brother of Yan Zhenqing. In the An Lushan rebellion, Yan Gaoqing with Yan Zhenqing first raised the righteous host against An Lushan. When his city fell and he was taken, he cursed An Lushan; they cut out his tongue and he died. The loyal house has rung down the ages.',
  },
  'hist-zhang-xu': {
    era: { zh: '草聖', en: 'Sage of Cursive Calligraphy' },
    zh: '字伯高,吳郡人。盛唐書法家,張旭草書,世稱「草聖」。性嗜酒,醉後揮毫,如有神助。與李白詩、裴旻劍舞並稱「三絕」。',
    en: 'Style Bogao, of Wujun. A High Tang calligrapher; his cursive script the "Sage of Cursive." Fond of wine, he wrote in his cups as if divinely guided. With Li Bai\'s poems and Pei Min\'s sword-dance he made the "Three Wonders."',
  },
  'hist-liu-gongquan': {
    era: { zh: '楷書四大家', en: 'One of the Four Great Masters of Regular Script' },
    zh: '字誠懸,京兆華原人。唐代書法家,楷書四大家之一。筆力遒勁,世稱「柳體」。其書如鐵畫銀鉤,千古傳為書法之典。',
    en: 'Style Chengxuan, of Huayuan in the metropolitan region. A Tang calligrapher, one of the Four Great Masters of Regular Script. His brush had iron strength — the "Liu style." Like iron strokes and silver hooks, his calligraphy is held forever as a model.',
  },
  'hist-zhang-jianzhi': {
    zh: '字孟將,襄州襄陽人。武則天時宰相。神龍元年發動「神龍之變」,逼武則天禪位於中宗,恢復李唐。封漢陽郡王。後為武三思所構,流瀧州而死。',
    en: 'Style Mengjiang, of Xiangyang in Xiangzhou. A chancellor under Wu Zetian. In 705 he led the Shenlong incident, forcing Wu Zetian to yield the throne to Zhongzong, restoring the Li Tang. Made Prince of Hanyang commandery. Later framed by Wu Sansi, he was exiled to Longzhou and died.',
  },
  'hist-lou-shide': {
    era: { zh: '唾面自乾', en: '"Let the Spittle Dry on Its Own"' },
    zh: '字宗仁,鄭州原武人。武則天時宰相。性寬厚,弟出仕,告之曰:「人唾汝面,汝拭之,是逆其意也,當待其自乾。」',
    en: 'Style Zongren, of Yuanwu in Zhengzhou. A chancellor under Wu Zetian. Broad and gentle. When his brother went out to office he told him: "If a man spits in your face and you wipe it off, you go against his will; you should let the spittle dry on its own."',
  },
  'hist-lai-junchen': {
    era: { zh: '請君入甕', en: '"Please Sir, Step into the Jar"' },
    zh: '武則天時酷吏。著《羅織經》,教人陷害他人之術。設「請君入甕」之計使周興服罪。後反為周興黨所構,被武則天斬於市,百姓爭啖其肉。',
    en: 'A cruel inquisitor under Wu Zetian. He wrote the Classic of Weaving Snares, teaching the arts of framing men. He laid the "Please Sir, step into the jar" trick that made Zhou Xing confess. Later framed by Zhou Xing\'s party, Wu Zetian had him beheaded in the marketplace, and the people fought to bite his flesh.',
  },
  'hist-yuan-zhen': {
    zh: '字微之,河南洛陽人。中唐詩人。與白居易並稱「元白」。《會真記》(《鶯鶯傳》)後成《西廂記》之祖。「曾經滄海難為水,除卻巫山不是雲」千古絕唱。',
    en: 'Style Weizhi, of Luoyang in Henan. A mid-Tang poet, ranked with Bai Juyi as "Yuan and Bai." His Hui Zhen ji (Tale of Yingying) later became the source of the Romance of the Western Chamber. "Having seen the great sea, the rest is not water / except for Mount Wu, no cloud is a cloud" rang forever.',
  },
  'hist-li-deyu': {
    zh: '字文饒,趙郡贊皇人。晚唐宰相。牛李黨爭李黨之首。武宗時平回紇、滅佛(會昌滅佛),功業赫赫。宣宗即位,被牛黨所構,貶死崖州。',
    en: 'Style Wenrao, of Zanhuang in Zhaojun. A late-Tang chancellor; head of the Li faction in the Niu-Li factional war. Under Emperor Wu he broke the Uyghurs and persecuted the Buddhists (the Huichang persecution) with great merit. When Xuanzong took the throne, the Niu faction framed him and he was exiled to die at Yazhou.',
  },
  'hist-niu-sengru': {
    zh: '字思黯,安定鶉觚人。晚唐宰相。牛李黨爭牛黨之首。與李德裕針鋒相對,黨爭四十年,唐朝由是衰。',
    en: 'Style Si\'an, of Chungu in Anding. A late-Tang chancellor; head of the Niu faction in the Niu-Li factional war. Against Li Deyu he stood point for point, and the factional war lasted forty years — and Tang declined from it.',
  },
  'hist-jianzhen': {
    era: { zh: '東渡日本', en: 'East to Japan' },
    zh: '俗姓淳于,揚州人。唐代律宗高僧。應日本留學僧之請,東渡傳法,五次失敗,雙目失明,第六次終至日本,於東大寺授戒,日本佛教自此大興。卒於日本唐招提寺。',
    en: 'Lay surname Chunyu, of Yangzhou. A great Tang monk of the Vinaya school. At the request of Japanese student-monks he set sail east to teach the Law. Five times he failed and lost his sight; on the sixth he reached Japan, gave the precepts at Todai-ji, and Japanese Buddhism flourished from him. He died at Toshodai-ji in Japan.',
  },
  'hist-li-bi': {
    zh: '字長源,京兆人。唐肅宗、代宗、德宗三朝宰相。少時即有「神童」之名,從容於政,輔肅宗平安史之亂。性恬淡,屢辭爵位,世以為高士。',
    en: 'Style Changyuan, of the metropolitan region. A chancellor under three reigns — Suzong, Daizong, Dezong. From youth named a "divine child." Calm in government, he helped Suzong put down the An Lushan rebellion. Quiet by temper, he refused titles again and again — the world held him a high recluse.',
  },
  'hist-li-bao zhen': {
    zh: '參見「hist-li-baozhen」。',
    en: 'See hist-li-baozhen.',
  },
  'hist-yin-kaishan': {
    zh: '字開山,雍州鄠人。唐初名將,凌煙閣二十四功臣之一。隨李世民征戰,有功。封郿國公。',
    en: 'Style Kaishan, of Hu in Yongzhou. A famed early-Tang general, one of the Twenty-Four Meritorious Officers of the Lingyan Pavilion. He marched with Li Shimin and earned credit. Made Duke of Mei.',
  },
  'hist-chai-shao': {
    zh: '字嗣昌,晉州臨汾人。唐初名將,凌煙閣二十四功臣之一。娶李淵之女平陽公主。隨李世民征戰立功。',
    en: 'Style Sichang, of Linfen in Jinzhou. A famed early-Tang general, one of the Twenty-Four Meritorious Officers of the Lingyan Pavilion. He married Princess Pingyang, daughter of Li Yuan. He marched with Li Shimin and earned credit.',
  },
  'hist-princess-pingyang': {
    era: { zh: '娘子軍', en: 'The Lady\'s Army' },
    zh: '李淵之三女。隋末隨夫柴紹起兵,招集娘子軍七萬,助父定關中。卒年僅二十餘,以軍禮葬之,中華第一以軍禮葬之女子。',
    en: 'Third daughter of Li Yuan. In late Sui with her husband Chai Shao she raised troops, gathered the seventy-thousand-strong "Lady\'s Army," and helped her father settle Guanzhong. She died in her twenties, buried with military honors — the first woman in China so honored.',
  },
  'hist-xiao-yu': {
    zh: '字時文,後梁明帝之孫。唐初宰相,凌煙閣二十四功臣之一。性剛直,屢諫太宗。後因諫不從,辭官歸隱。',
    en: 'Style Shiwen, grandson of Emperor Ming of the Later Liang. An early-Tang chancellor, one of the Twenty-Four Meritorious Officers of the Lingyan Pavilion. Stiff and upright, he often remonstrated with Taizong. When his words were not heeded, he resigned and went into retirement.',
  },
  'hist-ma-zhou': {
    zh: '字賓王,博州茌平人。唐太宗時宰相。出身寒微,以才華自顯。事太宗,屢進奇策,深得器重。卒年四十八,太宗痛悼。',
    en: 'Style Binwang, of Chiping in Bozhou. A chancellor under Taizong of Tang. Of humble birth, he made himself by sheer talent. He served Taizong and offered many bold counsels, deeply trusted. He died at forty-eight; Taizong mourned bitterly.',
  },
  // ─── 歷代名將 新增第八批 (Historical biographies — batch 8: Five Dynasties & Song) ───
  'hist-li-keyong': {
    era: { zh: '獨眼龍', en: 'The One-Eyed Dragon' },
    zh: '字翼聖,沙陀人。後唐莊宗李存勖之父。一目眇,號「獨眼龍」。屢破朱溫,為唐勤王之雄。臨終以三矢付李存勖,囑滅梁、燕、契丹。',
    en: 'Style Yisheng, of the Shatuo people. Father of Li Cunxu of Later Tang. Blind in one eye — the "One-Eyed Dragon." He broke Zhu Wen many times, the hero loyal to Tang. On his deathbed he gave three arrows to Li Cunxu, charging him to destroy Liang, Yan, and Khitan.',
  },
  'hist-li-cunxu': {
    era: { zh: '後唐莊宗', en: 'Emperor Zhuang of Later Tang' },
    zh: '李克用之子。承父志,十年滅後梁、北平燕、東敗契丹,實踐三矢之囑。建後唐,號莊宗。然好聽戲,寵伶人,從中作亂,興教門之變被弒,年四十二。',
    en: 'Son of Li Keyong. Carrying out his father\'s charge, in ten years he destroyed Later Liang, pacified Yan in the north, and beat the Khitan in the east — completing the three arrows. He founded Later Tang as Emperor Zhuang. But fond of the theatre and doting on the actors, he let them stir trouble; in the Xingjiao Gate mutiny he was killed at forty-two.',
  },
  'hist-li-siyuan': {
    era: { zh: '後唐明宗', en: 'Emperor Ming of Later Tang' },
    zh: '李克用養子。莊宗被弒,即位為明宗。在位八年,夜祝天保人民,五代少有之賢君。',
    en: 'Adopted son of Li Keyong. After Emperor Zhuang was killed, he took the throne as Emperor Ming. Eight years he reigned. By night he prayed for the people\'s peace — a rare worthy ruler in the Five Dynasties.',
  },
  'hist-shi-jingtang': {
    era: { zh: '兒皇帝', en: 'Son-Emperor' },
    zh: '後晉開國皇帝。沙陀人。為謀奪位,以燕雲十六州割讓契丹,自稱「兒皇帝」,千古辱國之事。',
    en: 'Founder of Later Jin, of the Shatuo people. To win the throne he ceded the Sixteen Prefectures of Yan-Yun to the Khitan and called himself "son-emperor" — a shame upon the state for the ages.',
  },
  'hist-liu-zhiyuan': {
    zh: '後漢開國皇帝。沙陀人。後晉滅後,劉知遠起兵建後漢。在位一年崩。',
    en: 'Founder of the Later Han, of the Shatuo people. After Later Jin fell, Liu Zhiyuan raised troops and founded the Later Han. One year he reigned and died.',
  },
  'hist-guo-wei': {
    zh: '後周開國皇帝。原為後漢將,後因隱帝忌之欲殺,起兵奪位,建後周。在位三年崩,養子柴榮繼立。',
    en: 'Founder of the Later Zhou. Originally a general of Later Han, when Emperor Yin distrusted him and meant to kill him, he raised troops, seized the throne, and founded Later Zhou. Three years he reigned and died; his adopted son Chai Rong took up the line.',
  },
  'hist-chai-rong': {
    era: { zh: '周世宗', en: 'Emperor Shizong of Later Zhou' },
    zh: '後周第二代皇帝。郭威養子。在位六年,征討四方,北擊契丹,南平淮南,有志一統。然年僅三十九早卒,趙匡胤繼之而建宋。世稱五代第一明君。',
    en: 'Second emperor of Later Zhou, adopted son of Guo Wei. Six years he reigned, marching in all directions: in the north against Khitan, in the south against Huainan — resolved to unify the realm. But he died at thirty-nine, and Zhao Kuangyin took up the work and founded Song. Held as the first enlightened ruler of the Five Dynasties.',
  },
  'hist-feng-dao': {
    era: { zh: '五朝元老', en: 'Elder of Five Dynasties' },
    zh: '字可道,瀛州景城人。五代名臣,事後唐、後晉、後漢、後周、契丹遼五朝十帝。皆為宰相。歐陽修譏其無節,然其護民於亂世之功,千古史家評之不一。',
    en: 'Style Kedao, of Jingcheng in Yingzhou. A famed minister of the Five Dynasties, serving five reigns and ten emperors of Later Tang, Later Jin, Later Han, Later Zhou, and Khitan Liao. Each made him chancellor. Ouyang Xiu mocked his lack of principle, yet the historians of the ages have not been of one mind — for his work protecting the people in chaos was great.',
  },
  'hist-qian-liu': {
    era: { zh: '吳越錢王', en: 'King Qian of Wuyue' },
    zh: '字具美,杭州臨安人。吳越國開國國君。據兩浙,築錢塘江堤,興水利,通海貿,杭州大興。在位四十一年,壽八十一。後人感其德,築錢王祠以祀。',
    en: 'Style Jumei, of Lin\'an in Hangzhou. Founding ruler of the Wuyue kingdom. Holding the two Zhejiangs, he raised the Qiantang River dike, opened the waterworks, and traded by sea — Hangzhou flourished. Forty-one years he ruled and lived to eighty-one. The people, mindful of his grace, built King Qian\'s Shrine.',
  },
  'hist-ma-yin': {
    zh: '字霸圖,許州鄢陵人。十國楚國開國國君。據湖南,治民有方,商賈通行。在位二十六年,壽七十九。',
    en: 'Style Batu, of Yanling in Xuzhou. Founding ruler of the Chu kingdom of the Ten Kingdoms. Holding Hunan, he ruled the people well and trade flowed. Twenty-six years he ruled and lived to seventy-nine.',
  },
  'hist-meng-zhixiang': {
    zh: '後蜀開國皇帝。原為後唐將,後據蜀稱帝,建後蜀。在位一年崩,子孟昶繼立。',
    en: 'Founder of the Later Shu. Originally a general of Later Tang, he held Shu and called himself emperor, founding Later Shu. One year he reigned and died; his son Meng Chang took the line.',
  },
  'hist-meng-chang': {
    zh: '後蜀第二代皇帝。在位三十一年。性奢侈,寵花蕊夫人。後降宋,被宋太祖賜死,在位末年蜀人為其作詩:「十四萬人齊解甲,更無一個是男兒。」',
    en: 'Second emperor of Later Shu. Thirty-one years he reigned. Lavish in life, doting on Lady Huarui. He later submitted to Song; Taizu of Song gave him a draught of death. In his last year a Shu poet wrote: "A hundred and forty thousand at once laid down their arms — not one of them a man."',
  },
  'hist-yang-yanzhao': {
    era: { zh: '楊六郎', en: 'Yang Sixth-Brother' },
    zh: '字延朗,後改延昭。楊業之六子,世稱「楊六郎」。北宋名將。鎮三關二十餘年,契丹畏之。其子楊文廣亦為名將,楊家將之名千古傳誦。',
    en: 'Style Yanlang, later Yanzhao. Sixth son of Yang Ye — the world called him "Yang Sixth-Brother." A famed Northern Song general. He held the Three Passes for over twenty years, and the Khitan feared him. His son Yang Wenguang was also a famed general; the fame of the Yang family generals has rung down the ages.',
  },
  'hist-yang-ye': {
    era: { zh: '楊無敵', en: 'Yang the Invincible' },
    zh: '字繼業,麟州人。原北漢名將,降宋後鎮代州。號「楊無敵」,契丹聞名畏之。雍熙北伐,潘美、王侁陷之,陳家谷一戰被俘,絕食三日而死。',
    en: 'Style Jiye, of Linzhou. Originally a famed general of Northern Han, he submitted to Song and held Daizhou. Called "Yang the Invincible," the Khitan feared his name. In the Yongxi northern campaign, Pan Mei and Wang Shen trapped him; at Chenjiagu he was taken alive, and starved himself to death in three days.',
  },
  'hist-she-taijun': {
    era: { zh: '佘太君', en: 'Old Lady She' },
    zh: '楊業之妻。世稱「佘太君」、「百歲掛帥」。傳楊家將盡死於沙場後,佘太君年百歲,挺身掛帥,率楊家女將出征。世以為楊家將之核。',
    en: 'Wife of Yang Ye. The world called her "Old Lady She" — "took up the banner at a hundred." Tradition says that when the men of the Yang house had all died in battle, Old Lady She at a hundred stood forth and took up the command, leading the women of the Yang house to war. The world holds her the soul of the Yang generals.',
  },
  'hist-yang-zongbao': {
    zh: '楊延昭之子。傳娶穆桂英為妻。後從父征戰,有戰功。',
    en: 'Son of Yang Yanzhao. Tradition says he wed Mu Guiying. He marched with his father with credit in war.',
  },
  'hist-yang-wenguang': {
    zh: '字仲容,楊延昭之子。北宋名將。鎮西夏邊境,屢卻夏軍。卒於官。',
    en: 'Style Zhongrong, son of Yang Yanzhao. A famed Northern Song general. He held the Xixia border and turned back the Xia army many times. He died in office.',
  },
  'hist-pan-mei': {
    zh: '字仲詢,大名人。北宋開國名將。隨宋太祖平定後蜀、南唐,功冠群臣。雍熙北伐,因處置失當,致楊業死於陳家谷,為世所譏。',
    en: 'Style Zhongxun, of Daming. A famed founding general of Northern Song. With Taizu he pacified Later Shu and Southern Tang, his merit above the ministers. In the Yongxi northern campaign, by his mishandling Yang Ye died at Chenjiagu — and the world mocked him for it.',
  },
  'hist-shi-shouxin': {
    zh: '北宋開國名將。陳橋兵變預謀。後杯酒釋兵權,辭歸故里。',
    en: 'A founding general of Northern Song; one of the planners of the Chenqiao mutiny. Later in the wine-and-release of the generals he gave up his command and went home.',
  },
  'hist-zhao-guangyi': {
    era: { zh: '宋太宗', en: 'Emperor Taizong of Song' },
    zh: '宋太祖之弟,「燭影斧聲」之疑後即位。北滅北漢,二次北伐契丹皆敗。在位二十一年,平定割據之局,然軍事失利,使遼宋之爭延續百年。',
    en: 'Younger brother of Taizu of Song. After the mystery of "candle-shadow and axe-sound" he took the throne. He destroyed Northern Han, but twice marched north against Khitan and twice was broken. Twenty-one years he reigned, settling the feudatories — yet military failure let the Song-Liao struggle endure a hundred years.',
  },
  'hist-zhao-gou': {
    era: { zh: '宋高宗', en: 'Emperor Gaozong of Song' },
    zh: '宋徽宗第九子。靖康之變,徽、欽二帝被擄,趙構於應天府即位,建南宋。任秦檜為相,以「莫須有」害岳飛,主和於金,以歲幣換偏安。在位三十五年,後讓位於孝宗。壽八十一。',
    en: 'Ninth son of Emperor Huizong of Song. In the Jingkang disaster, when the two emperors Hui and Qin were carried off, Zhao Gou took the throne at Yingtianfu and founded the Southern Song. He made Qin Hui chancellor, killed Yue Fei on "perhaps there is," and bought peace from the Jin with yearly tribute. Thirty-five years he reigned, then yielded the throne to Xiaozong. He lived to eighty-one.',
  },
  'hist-song-huizong': {
    era: { zh: '宋徽宗', en: 'Emperor Huizong of Song' },
    zh: '名趙佶,神宗第十一子。在位二十五年。書畫絕世,創「瘦金體」書法,然好聲色,寵蔡京、童貫,致花石綱、方臘起義。靖康二年被金擄,客死五國城。',
    en: 'Personal name Zhao Ji, eleventh son of Shenzong. Twenty-five years he reigned. Of peerless brush in painting and writing, founder of the "Slender Gold" calligraphy. Yet fond of pleasure, doting on Cai Jing and Tong Guan — bringing on the Flower-and-Stone tribute trains and the rising of Fang La. In 1127 he was taken by the Jin and died in exile in the City of Five Kingdoms.',
  },
  'hist-cai-jing': {
    zh: '字元長,興化仙游人。宋徽宗時宰相。專權十五年,與童貫共禍北宋,徽宗書畫雖盛而政事大壞。靖康後被流嶺南,死於潭州。',
    en: 'Style Yuanchang, of Xianyou in Xinghua. Chancellor under Emperor Huizong of Song. Fifteen years he held power, with Tong Guan he ruined the Northern Song; Huizong\'s painting and writing flourished but government rotted. After Jingkang he was exiled to Lingnan and died at Tanzhou.',
  },
  'hist-tong-guan': {
    zh: '宋徽宗時權宦。執兵權二十年,平方臘起義,然北伐契丹屢敗,終致金兵南下。靖康元年被高宗趙構斬。',
    en: 'A great eunuch of Emperor Huizong of Song. Twenty years he held the army. He put down the rising of Fang La, but his northern campaigns against Khitan failed again and again, and the Jin came south. In 1126 Zhao Gou had him beheaded.',
  },
  'hist-gao-qiu': {
    zh: '宋徽宗時權臣。原為蘇軾家僮,以善蹴鞠得寵於徽宗,任太尉。執政腐敗,《水滸傳》以其為大反派。',
    en: 'A great minister of Emperor Huizong of Song. Originally a servant of Su Shi, his skill at cuju football won him the emperor\'s favor, and he was made Grand Marshal. His government was corrupt; the Water Margin makes him the great villain.',
  },
  'hist-jia-sidao': {
    era: { zh: '蟋蟀宰相', en: '"Cricket Chancellor"' },
    zh: '字師憲,台州天台人。南宋末權臣。專權二十年,以鬥蟋蟀為樂,號「蟋蟀宰相」。蒙古攻宋,賈似道私和。後鄂州之戰隱瞞敗績。德祐元年蒙古大舉南下,賈似道親率軍,大敗於丁家洲,被貶崖州,途中被殺。',
    en: 'Style Shixian, of Tiantai in Taizhou. The great power-holder at the end of Southern Song. Twenty years he held power, fond of cricket-fighting — "the Cricket Chancellor." When the Mongols pressed, he secretly made peace; after Ezhou he hid the loss. In 1275 the Mongols came south in force; Jia Sidao led the army in person and was broken at Dingjiazhou. Exiled to Yazhou, he was killed on the road.',
  },
  'hist-wen-yanbo': {
    zh: '字寬夫,汾州介休人。北宋名相。事仁宗、英宗、神宗、哲宗四朝五十年,位至宰相。性溫和持重,壽九十二。',
    en: 'Style Kuanfu, of Jiexiu in Fenzhou. A famed chancellor of Northern Song. He served four reigns — Renzong, Yingzong, Shenzong, Zhezong — for fifty years and rose to chancellor. Mild and weighty in temper, he lived to ninety-two.',
  },
  'hist-han-qi': {
    zh: '字稚圭,相州安陽人。北宋名相。與范仲淹、富弼共主慶曆新政。後事仁宗、英宗、神宗,位至宰相。鎮西夏,軍中有「軍中有一韓,西夏聞之心膽寒」之語。',
    en: 'Style Zhigui, of Anyang in Xiangzhou. A famed Northern Song chancellor. With Fan Zhongyan and Fu Bi he led the Qingli New Policies. He served Renzong, Yingzong, and Shenzong, rising to chancellor. Holding the Xixia front, the army said: "While there is one Han in the army, the Xixia hear and their hearts and gall freeze."',
  },
  'hist-li-gang': {
    era: { zh: '汴京保衛戰', en: 'Defender of Bianjing' },
    zh: '字伯紀,邵武人。北宋末年抗金名臣。靖康元年金兵圍汴京,李綱主戰,組織京城保衛戰,金兵退。然徽欽二帝再用主和派,李綱被貶,金兵再來,京師遂陷。南宋初為相七十五日,被罷。卒,壽五十八。',
    en: 'Style Boji, of Shaowu. A famed minister of the late Northern Song against the Jin. In 1126 when the Jin besieged Bianjing, Li Gang urged war, organized the defense, and the Jin withdrew. But Hui and Qin then turned again to the peace party; Li Gang was thrust down, the Jin came again, and the capital fell. In early Southern Song he was chancellor for seventy-five days and was dismissed. He died at fifty-eight.',
  },
  'hist-zong-ze': {
    era: { zh: '過河!過河!', en: '"Across the River! Across the River!"' },
    zh: '字汝霖,婺州義烏人。南宋初年抗金名將。鎮東京留守,招集兩河義軍百萬,連敗金兵。屢上奏請高宗北渡收復中原,高宗主和不允。臨終呼「過河!過河!過河!」 三聲而卒,年七十。',
    en: 'Style Rulin, of Yiwu in Wuzhou. A famed Southern Song general against the Jin. Holding Dongjing he gathered the righteous host of the two rivers, a million strong, and broke the Jin many times. He sent memorial after memorial begging the emperor to cross the river and recover the central plains; the emperor refused for peace. On his deathbed he cried out: "Across the river! Across the river! Across the river!" — three times — and died at seventy.',
  },
  'hist-niu-gao': {
    zh: '岳飛部將。隨岳飛抗金,屢立戰功。岳飛被害,牛皋憤而卒(一說被秦檜害)。',
    en: 'A captain of Yue Fei. He marched with him against the Jin and won many laurels. When Yue Fei was killed, Niu Gao died in rage (some say killed by Qin Hui).',
  },
  'hist-yu-yunwen': {
    era: { zh: '采石之戰', en: 'Victor of Caishi' },
    zh: '字彬甫,隆州井研人。南宋名臣。紹興三十一年,金主完顏亮率六十萬眾南侵,虞允文以一萬八千宋軍於采石大破金兵,完顏亮被部下所殺,金軍北撤。後位至宰相,卒。',
    en: 'Style Binfu, of Jingyan in Longzhou. A famed Southern Song minister. In 1161 when Wanyan Liang the Jin ruler led six hundred thousand south, Yu Yunwen with eighteen thousand Song troops broke the Jin at Caishi; Wanyan Liang was killed by his own men, and the Jin pulled back. He rose to chancellor and died.',
  },
  'hist-wanyan-liang': {
    zh: '金海陵王。弒熙宗自立。性殘忍,殺宗室甚多。紹興三十一年率大軍南侵宋,采石之敗,被部下完顏元宜所弒。',
    en: 'Prince Hailing of Jin. He killed Emperor Xizong and took the throne. Cruel in nature, he killed many of the clan. In 1161 he led a great army south against Song; after the Caishi defeat his man Wanyan Yuanyi killed him.',
  },
  'hist-mi-fu': {
    era: { zh: '米癲', en: '"Mi the Mad"' },
    zh: '字元章,號海岳外史,襄陽人。北宋書畫家。性放達不羈,世稱「米癲」。書法為宋四家之一(蘇黃米蔡)。畫風開創「米點山水」。',
    en: 'Style Yuanzhang, called the Recluse of Hai-Yue, of Xiangyang. A Northern Song calligrapher and painter. Free and unbridled, the world called him "Mi the Mad." His calligraphy was one of the Four Masters of Song (Su, Huang, Mi, Cai). His painting opened the "Mi-dot landscape" school.',
  },
  'hist-huang-tingjian': {
    zh: '字魯直,號山谷道人,洪州分寧人。北宋詩人、書法家。蘇門四學士之首。詩開江西詩派,書為宋四家之一。',
    en: 'Style Luzhi, called the Daoist of the Mountain Valley, of Fenning in Hongzhou. A Northern Song poet and calligrapher. First of the Four Scholars of Su Shi\'s gate. His verse opened the Jiangxi school of poetry; his calligraphy was one of the Four Masters of Song.',
  },
  'hist-su-xun': {
    zh: '字明允,號老泉,眉山人。北宋文學家。蘇軾、蘇轍之父。三蘇之一,唐宋八大家之一。著《六國論》、《辨姦論》。',
    en: 'Style Mingyun, called the Old Spring, of Meishan. A Northern Song writer. Father of Su Shi and Su Zhe. One of the Three Sus, one of the Eight Masters of Tang and Song. He wrote the Discourse on the Six States and the Discourse on Recognizing the Wicked.',
  },
  'hist-su-zhe': {
    zh: '字子由,蘇軾之弟。北宋文學家,唐宋八大家之一。位至門下侍郎(副相)。與兄手足情深,「但願人長久」即蘇軾為弟所作。',
    en: 'Style Ziyou, younger brother of Su Shi. A Northern Song writer, one of the Eight Masters of Tang and Song. He rose to Vice Director of the Chancellery. Brotherly love between them ran deep — "Wish only that we may live long" was Su Shi\'s song for him.',
  },
  'hist-shen-kuo': {
    era: { zh: '夢溪筆談', en: 'Author of the Dream Pool Essays' },
    zh: '字存中,號夢溪丈人,杭州錢塘人。北宋科學家、政治家。著《夢溪筆談》,記中華科技、天文、地理、生物之大成,世界科學史之珍。發現磁偏角,測定北極星位置,皆早於歐洲。',
    en: 'Style Cunzhong, called the Old Man of the Dream Pool, of Qiantang in Hangzhou. A Northern Song scientist and statesman. He wrote the Dream Pool Essays, gathering Chinese technology, astronomy, geography, and biology — a treasure of world science history. He discovered magnetic declination and measured the position of the Pole Star, both before Europe.',
  },
  'hist-yan-shu': {
    zh: '字同叔,撫州臨川人。北宋詞人、宰相。「無可奈何花落去,似曾相識燕歸來」千古絕唱。提拔范仲淹、歐陽修等賢才。',
    en: 'Style Tongshu, of Linchuan in Fuzhou. A Northern Song ci poet and chancellor. "No use against the falling flowers / familiar still, the swallows return" rang forever. He lifted up Fan Zhongyan, Ouyang Xiu, and other worthies.',
  },
  'hist-liu-yong-song': {
    era: { zh: '凡有井水處,皆能歌柳詞', en: '"Wherever There Is a Well, There Songs of Liu Are Sung"' },
    zh: '字耆卿,崇安人。北宋詞人。婉約派代表。詞風通俗,「凡有井水處,皆能歌柳詞」千古傳為盛況。「楊柳岸,曉風殘月」、「衣帶漸寬終不悔」千古絕唱。',
    en: 'Style Qiqing, of Chong\'an. A Northern Song ci poet, representative of the graceful school. His ci was plain — "Wherever there is a well, there songs of Liu are sung" tells of his fame. "The willow bank, the dawn wind, the waning moon" and "Though my belt grows ever looser, I shall never regret" rang forever.',
  },
  'hist-qin-guan': {
    zh: '字少游,號淮海居士,揚州高郵人。北宋詞人。蘇門四學士之一。「兩情若是久長時,又豈在朝朝暮暮」千古絕唱。',
    en: 'Style Shaoyou, called the Recluse of Huaihai, of Gaoyou in Yangzhou. A Northern Song ci poet, one of the Four Scholars of Su Shi\'s gate. "If the two hearts last long enough — does it matter that they meet at dawn and dusk?" rang forever.',
  },
  'hist-jiang-kui': {
    zh: '字堯章,號白石道人,饒州鄱陽人。南宋詞人、音樂家。一生未仕,以文為生。詞風清空,自製曲調。',
    en: 'Style Yaozhang, called the Daoist of the White Stone, of Poyang in Raozhou. A Southern Song ci poet and musician. He never took office and lived by his writing. His ci was clear and free, and he composed his own melodies.',
  },
  'hist-zhou-bangyan': {
    zh: '字美成,號清真居士,錢塘人。北宋詞人,周邦彥。詞律精嚴,集婉約詞之大成。徽宗時提舉大晟府,主修宮廷音樂。',
    en: 'Style Meicheng, called the Recluse of Pure Truth, of Qiantang. A Northern Song ci poet — Zhou Bangyan. His prosody was strict, the synthesizer of the graceful school. Under Huizong he led the Dasheng Bureau, in charge of the palace music.',
  },
  'hist-mei-yaochen': {
    zh: '字聖俞,號宛陵先生,宣州宣城人。北宋詩人。與蘇舜欽齊名,世稱「蘇梅」。詩風樸實,為宋詩之祖。',
    en: 'Style Shengyu, called the Master of Wanling, of Xuancheng in Xuanzhou. A Northern Song poet, ranked with Su Shunqin as "Su and Mei." Plain in style, an ancestor of Song poetry.',
  },
  'hist-su-shunqin': {
    zh: '字子美,銅山人。北宋詩人。與梅堯臣並稱「蘇梅」。性放達好酒。後遭黨爭被貶,鬱卒於蘇州。',
    en: 'Style Zimei, of Tongshan. A Northern Song poet, ranked with Mei Yaochen as "Su and Mei." Free and fond of wine. Caught up later in the factional war and thrust down, he died in despair at Suzhou.',
  },
  'hist-shi-hao': {
    zh: '字直翁,明州鄞縣人。南宋名相。事高宗、孝宗、光宗。為相時力主和議,亦保全岳飛家屬。',
    en: 'Style Zhiweng, of Yin county in Mingzhou. A famed Southern Song chancellor. He served Gaozong, Xiaozong, and Guangzong. As chancellor he urged peace, and also kept whole the household of Yue Fei.',
  },
  'hist-shi-miyuan': {
    zh: '南宋宰相,史浩之子。專權二十五年,廢濟王,立理宗。世以為奸臣。',
    en: 'A Southern Song chancellor, son of Shi Hao. Twenty-five years he held power, deposing the Prince of Ji and setting up Emperor Li. The world held him a wicked minister.',
  },
  'hist-han-tuozhou': {
    zh: '南宋寧宗時權臣。慶元黨禁,禁理學。後謀北伐金,大敗,被楊皇后與史彌遠合謀殺於玉津園,函首送金以求和。',
    en: 'A great power-holder under Ningzong of Southern Song. In the Qingyuan party-proscription he banned neo-Confucianism. Later he plotted the northern campaign against Jin and was utterly broken; Empress Yang and Shi Miyuan together had him killed at the Yujin Garden, and his head was sent in a box to Jin to make peace.',
  },
  'hist-liang-hongyu': {
    era: { zh: '梁紅玉擊鼓', en: 'Liang Hongyu Beat the War-Drum' },
    zh: '韓世忠之妻。原為京口娼女。黃天蕩之戰,梁紅玉親自擊鼓助戰,韓世忠以八千兵困金兀朮十萬於江中四十八日。古來巾幗英雄之冠。',
    en: 'Wife of Han Shizhong. Originally a courtesan of Jingkou. At the Yellow Sky Pool she beat the war-drum in person, and Han Shizhong with eight thousand trapped Wuzhu\'s hundred thousand Jin on the river for forty-eight days. The first heroine of the ages.',
  },
  'hist-wu-jie': {
    zh: '字晉卿,德順軍隴幹人。南宋抗金名將。與弟吳璘共守川陝,屢破金兵,使金不能越大散關。封涪王。卒年四十七。',
    en: 'Style Jinqing, of Longgan in Deshun Army. A famed Southern Song general against the Jin. With his brother Wu Lin he held Sichuan and Shaanxi, broke the Jin many times, and the Jin could not cross the Great Sanguan. Made Prince of Fu. He died at forty-seven.',
  },
  // ─── 歷代名將 新增第九批 (Historical biographies — batch 9: Yuan & Ming) ───
  'hist-jamuqa': {
    era: { zh: '札木合', en: 'Jamuqa' },
    zh: '蒙古札答蘭部首領。鐵木真少時的安答(義兄弟)。後因爭草原霸權,屢與鐵木真戰,終敗於鐵木真。鐵木真求其重歸,札木合請死,鐵木真為之流涕,以無流血禮處死。',
    en: 'Chief of the Jadaran Mongol tribe. Sworn brother (anda) of Temüjin in their youth. Later, fighting for hegemony of the steppe, he fought Temüjin many times and was at last broken. Temüjin offered to bring him back; Jamuqa asked to die. Temüjin wept and granted him a bloodless death.',
  },
  'hist-jebe': {
    era: { zh: '哲別', en: 'Jebe the Arrow' },
    zh: '蒙古別速部人。原名只兒豁阿歹。射成吉思汗之馬,被擒。成吉思汗賜名「哲別」(箭頭之意)。為四犬之一,與速不台合作,西征花剌子模、欽察、俄羅斯,所向披靡。',
    en: 'Of the Besud tribe of the Mongols, personal name Jirqo\'adai. He shot Genghis Khan\'s horse and was taken; the Khan named him "Jebe" (arrowhead). One of the Four Hounds. With Subutai he marched west against Khwarazm, the Cuman, and Russia — and none stood before him.',
  },
  'hist-muqali': {
    era: { zh: '木華黎', en: 'Muqali' },
    zh: '蒙古札剌兒部人。成吉思汗四傑之一。鐵木真稱帝,封太師、國王,授金國經略之任。鎮華北十年,屢敗金兵。卒於鳳翔軍中,年五十四。',
    en: 'Of the Jalair tribe of the Mongols. One of the Four Heroes of Genghis Khan. When Temüjin took the imperial title, he was made Grand Tutor and King, charged with the conquest of Jin. Ten years he held north China and broke the Jin armies many times. He died in camp at Fengxiang at fifty-four.',
  },
  'hist-jochi': {
    zh: '成吉思汗長子。性多疑,與父關係不睦。封欽察汗國,東至額爾齊斯河,西至俄羅斯。父在世時即卒。其子拔都繼承欽察汗位。',
    en: 'Eldest son of Genghis Khan. Of suspicious nature, at odds with his father. Enfeoffed with the Golden Horde, from the Irtysh to Russia. He died in his father\'s lifetime; his son Batu took the Golden Horde\'s throne.',
  },
  'hist-chagatai': {
    zh: '成吉思汗次子。封察合台汗國,中亞之地。性嚴峻,執行成吉思汗札撒不阿。',
    en: 'Second son of Genghis Khan. Enfeoffed with the Chagatai Khanate of Central Asia. Stern in temper, he enforced the Khan\'s Jasaq without bending.',
  },
  'hist-ogedei': {
    era: { zh: '窩闊台汗', en: 'Ögedei Khan' },
    zh: '成吉思汗第三子。蒙古第二代大汗。在位十三年。滅金,西征歐羅巴,築哈剌和林城為蒙古都。性寬厚好酒,後因酗酒而卒。',
    en: 'Third son of Genghis Khan. Second Great Khan of the Mongols. Thirteen years he reigned. He ended the Jin, marched west against Europe, and built Karakorum as the Mongol capital. Broad-hearted and fond of wine, he died of drink.',
  },
  'hist-tolui': {
    zh: '成吉思汗第四子。蒙哥、忽必烈、旭烈兀、阿里不哥之父。守蒙古本土,世稱「監國」。為兄窩闊台代死。',
    en: 'Fourth son of Genghis Khan. Father of Möngke, Kublai, Hülegü, and Ariq Böke. He held the Mongol homeland — called "Regent." He died in place of his brother Ögedei.',
  },
  'hist-mongke': {
    era: { zh: '蒙哥汗', en: 'Möngke Khan' },
    zh: '拖雷長子。蒙古第四代大汗。在位八年。發動三次西征,旭烈兀征中亞、波斯,忽必烈征南宋。蒙哥親征南宋,於釣魚城下中流矢而死,世界歷史為之轉折。',
    en: 'Eldest son of Tolui. Fourth Great Khan of the Mongols. Eight years he reigned. He launched three westward campaigns — Hülegü against Central Asia and Persia, Kublai against the Southern Song. Möngke marched against the Southern Song in person and was struck by a stray arrow at the walls of Diaoyu City and died — and world history turned.',
  },
  'hist-hulagu': {
    era: { zh: '旭烈兀', en: 'Hülegü' },
    zh: '拖雷之子,蒙哥之弟。蒙古西征軍統帥。1258年攻陷巴格達,滅阿拔斯王朝,屠百萬人,千年伊斯蘭黃金時代終於此。建伊兒汗國。',
    en: 'Son of Tolui, brother of Möngke. Commander of the Mongol westward armies. In 1258 he took Baghdad, ended the Abbasid Caliphate, and killed a million — the thousand-year golden age of Islam ended there. He founded the Ilkhanate.',
  },
  'hist-batu': {
    era: { zh: '拔都', en: 'Batu Khan' },
    zh: '朮赤之子。蒙古西征軍統帥。1235年率十五萬大軍西征,征俄羅斯、波蘭、匈牙利,所向披靡,馬蹄至維也納城下,因窩闊台死訊而還。建欽察汗國,即金帳汗國。',
    en: 'Son of Jochi. Commander of the Mongol westward armies. In 1235 he led a hundred and fifty thousand west — Russia, Poland, Hungary fell before him, his hooves at the walls of Vienna — and only the news of Ögedei\'s death turned him back. He founded the Kipchak Khanate, the Golden Horde.',
  },
  'hist-zhang-rou': {
    zh: '字德剛,易州定興人。元朝漢人世侯。降蒙古後屢立戰功。封蔡國公。其子張弘範後滅宋於崖山。',
    en: 'Style Degang, of Dingxing in Yizhou. A hereditary Han lord under Yuan. After submitting to the Mongols he won many laurels. Made Duke of Cai. His son Zhang Hongfan would later end the Song at Yashan.',
  },
  'hist-zhang-hongfan': {
    era: { zh: '崖山滅宋', en: 'Ended Song at Yashan' },
    zh: '張柔之子。元朝大將。崖山之戰,大破宋軍,陸秀夫負衛王跳海,宋遂亡。後勒石「鎮國大將軍張弘範滅宋於此」,千古恥辱。',
    en: 'Son of Zhang Rou. A great general of Yuan. At Yashan he broke the Song fleet; Lu Xiufu leapt into the sea with the boy emperor, and Song was ended. He cut into stone "Here Great General Zhang Hongfan, Defender of the State, ended Song" — a shame for the ages.',
  },
  'hist-toghto': {
    era: { zh: '脫脫', en: 'Toqto\'a' },
    zh: '元朝末年宰相。修《宋史》、《遼史》、《金史》三史。後征紅巾軍有功,被讒罷官,流雲南賜死。元失之脫脫,自此一蹶不振。',
    en: 'Chancellor at the end of Yuan. He oversaw the writing of the Song, Liao, and Jin Histories. He marched against the Red Turbans with credit; on slander he was dismissed, exiled to Yunnan, and given a draught of death. Yuan lost him — and never recovered.',
  },
  'hist-yuan-shundi': {
    zh: '元朝末代皇帝,孛兒只斤·妥懽帖睦爾。在位三十五年。國事大壞,紅巾軍起。朱元璋北伐,順帝棄大都北遁,北元由是始,蒙古退回草原。',
    en: 'Last emperor of Yuan, Borjigin Toghon Temür. Thirty-five years he reigned. Affairs of state rotted, the Red Turbans rose. When Zhu Yuanzhang marched north, Shundi abandoned Dadu and fled — Northern Yuan began here, and the Mongols pulled back to the steppe.',
  },
  'hist-han-liner': {
    zh: '元末紅巾軍領袖。父韓山童為白蓮教主,起義被殺。劉福通立其為「小明王」,建宋國。後為朱元璋部將廖永忠沉於江中。',
    en: 'A Red Turban leader of late Yuan. His father Han Shantong was the head of the White Lotus, killed for revolt. Liu Futong set him up as the "Little Bright King" and founded the Song state. He was later drowned in the river by Zhu Yuanzhang\'s captain Liao Yongzhong.',
  },
  'hist-liu-futong': {
    zh: '元末紅巾軍領袖。立韓林兒為小明王。三路北伐,直搗大都,後敗於察罕帖木兒,被殺。',
    en: 'A Red Turban leader of late Yuan. He set up Han Lin\'er as the Little Bright King. With three armies he marched north straight at Dadu; broken later by Chaghan Temür, he was killed.',
  },
  'hist-zhang-shicheng': {
    zh: '泰州白駒場人。元末群雄之一。原為鹽販,起兵據蘇州,自稱吳王。後降元,又叛元,終為朱元璋所滅,自縊於應天府。',
    en: 'Of Baijuchang in Taizhou. One of the great rebels of late Yuan. Born a salt-peddler, he raised troops, held Suzhou, and called himself King of Wu. He submitted to Yuan, then rose against Yuan, and was at last destroyed by Zhu Yuanzhang; he hanged himself at Yingtianfu.',
  },
  'hist-guan-hanqing': {
    era: { zh: '元曲之祖', en: 'Father of Yuan Drama' },
    zh: '號已齋叟,大都人。元代戲曲家。元曲四大家之首。著雜劇六十餘種,以《竇娥冤》、《救風塵》、《單刀會》傳世。中華戲曲史之最。',
    en: 'Called the Old Man of Yi-zhai, of Dadu. A dramatist of Yuan, first of the Four Great Masters of Yuan drama. He wrote over sixty zaju plays; The Injustice of Dou E, Rescued by a Courtesan, and Single-Blade Meeting survive. The summit of Chinese theatrical history.',
  },
  'hist-wang-shifu': {
    zh: '元代戲曲家。著《西廂記》五本二十一折,中華戲曲之巔峰。',
    en: 'A Yuan dramatist. He wrote the Romance of the Western Chamber in five books and twenty-one scenes — the summit of Chinese drama.',
  },
  'hist-zhao-mengfu': {
    era: { zh: '元代書畫家', en: 'Master of Calligraphy and Painting of Yuan' },
    zh: '字子昂,號松雪道人,湖州人。宋宗室,事元為翰林學士。書畫絕世,創「趙體」書法,與顏柳歐並稱楷書四大家。妻管道升亦書畫名家。',
    en: 'Style Zi\'ang, called the Daoist of Pine and Snow, of Huzhou. A kinsman of the Song house who served Yuan as Hanlin Academician. Peerless in calligraphy and painting, he created the "Zhao style" and stood with Yan, Liu, and Ou as one of the Four Great Masters of Regular Script. His wife Guan Daosheng was also a great painter and calligrapher.',
  },
  'hist-huang-gongwang': {
    zh: '字子久,號大痴道人,常熟人。元四家之首。畫風淡雅清逸。《富春山居圖》傳世,中華山水畫之巔峰。',
    en: 'Style Zijiu, called the Daoist of Great Foolishness, of Changshu. First of the Four Masters of Yuan. His painting was light and lofty. His Dwelling in the Fuchun Mountains survives — the summit of Chinese landscape painting.',
  },
  'hist-ni-zan': {
    zh: '字元鎮,號雲林,無錫人。元四家之一。出身富豪,後散家財,雲遊太湖,以畫自娛。畫風蕭疏淡遠,千古傳為文人畫之祖。',
    en: 'Style Yuanzhen, called Yunlin, of Wuxi. One of the Four Masters of Yuan. Born to a rich house, he later scattered his fortune and wandered Lake Tai, painting for his pleasure. His style was spare and far — a founder of the literati painting tradition for the ages.',
  },
  'hist-guo-shoujing': {
    era: { zh: '授時曆', en: 'Author of the Time-Granting Calendar' },
    zh: '字若思,順德邢台人。元代天文學家、水利學家。製《授時曆》,定一年為365.2425日,與現代曆法僅差26秒,比西方早三百年。又主持郭守敬水利,北引漕運。',
    en: 'Style Ruosi, of Xingtai in Shunde. An astronomer and hydraulic engineer of Yuan. He compiled the Time-Granting Calendar, fixing the year at 365.2425 days — twenty-six seconds from the modern reckoning, and three hundred years before the West. He also led the great waterworks, opening the northern grain transport.',
  },
  'hist-phagpa': {
    zh: '名八思巴,藏族薩迦派高僧。元世祖忽必烈封為國師、帝師。創八思巴文,蒙古新文字之祖。',
    en: 'Personal name \'Phags-pa, a great monk of the Tibetan Sakya school. Kublai Khan of Yuan made him State Preceptor and Imperial Preceptor. He created the \'Phags-pa script, ancestor of the new Mongol writing.',
  },
  'hist-li-wenzhong': {
    zh: '字思本,泗州盱眙人,朱元璋外甥。明初名將。隨徐達、常遇春北伐,平定北疆。封曹國公。卒年四十六。',
    en: 'Style Siben, of Xuyi in Sizhou, nephew of Zhu Yuanzhang through his sister. A famed early-Ming general. With Xu Da and Chang Yuchun he marched north and pacified the borders. Made Duke of Cao. He died at forty-six.',
  },
  'hist-feng-sheng': {
    zh: '安徽定遠人。明初名將。隨朱元璋起兵,北伐元都,平定西北。封宋國公。後因坐藍玉案被賜死。',
    en: 'Of Dingyuan in Anhui. A famed early-Ming general. He rose with Zhu Yuanzhang, marched on the Yuan capital, and pacified the northwest. Made Duke of Song. Caught up later in the Lan Yu case, he was given a draught of death.',
  },
  'hist-wang-baobao': {
    era: { zh: '擴廓帖木兒', en: 'Köke Temür' },
    zh: '元末名將,父為察罕帖木兒。鎮河北、山西,抗紅巾軍、抗明軍。朱元璋稱「奇男子」,屢欲招降不可。後北遁,卒於漠北。',
    en: 'A famed general of late Yuan, son of Chaghan Temür. He held Hebei and Shanxi against the Red Turbans and the Ming. Zhu Yuanzhang called him "a wondrous man" and tried again and again to bring him over — could not. He fled north at last and died in the desert.',
  },
  'hist-yao-guangxiao': {
    era: { zh: '黑衣宰相', en: 'The Black-Robed Chancellor' },
    zh: '法名道衍,長洲人。明初僧人,謀士。輔朱棣靖難奪位,功成不還俗,號「黑衣宰相」。主編《永樂大典》。卒,賜諡恭靖。',
    en: 'Dharma name Daoyan, of Changzhou. A monk and counselor of early Ming. He helped Zhu Di of the Yan in the Jingnan war and seizure of the throne; when the work was done he would not return to lay life and was called the "Black-Robed Chancellor." He led the compilation of the Yongle Encyclopedia. At his death he was given the posthumous name Gongjing.',
  },
  'hist-xie-jin': {
    zh: '字大紳,江西吉水人。明朝才子。主編《永樂大典》二萬二千卷。後得罪漢王朱高煦,被陷下獄,埋於雪中凍死,年四十七。',
    en: 'Style Dashen, of Jishui in Jiangxi. A talent of Ming. He led the compilation of the Yongle Encyclopedia in twenty-two thousand fascicles. He gave offense to Prince Han Zhu Gaoxu, was framed into prison, and was buried in the snow and frozen to death at forty-seven.',
  },
  'hist-yang-shiqi': {
    zh: '字士奇,泰和人。明朝三楊之首,內閣首輔。事建文、永樂、洪熙、宣德、正統五朝四十餘年。國事多依之,有「仁宣之治」之功。',
    en: 'Style Shiqi, of Taihe. First of the "Three Yangs" of Ming, Grand Secretary. He served Jianwen, Yongle, Hongxi, Xuande, and Zhengtong for over forty years. Affairs of state leaned on him, and the "Reign of Renxuan" owed much to his work.',
  },
  'hist-yang-rong': {
    zh: '字勉仁,建安人。明朝三楊之一。內閣大學士。事永樂、洪熙、宣德、正統四朝。',
    en: 'Style Mianren, of Jian\'an. One of the "Three Yangs" of Ming, Grand Secretary. He served Yongle, Hongxi, Xuande, and Zhengtong.',
  },
  'hist-yang-pu': {
    zh: '字弘濟,石首人。明朝三楊之一。內閣大學士。性溫和持重,事三朝。',
    en: 'Style Hongji, of Shishou. One of the "Three Yangs" of Ming, Grand Secretary. Mild and weighty in temper, he served three reigns.',
  },
  'hist-yang-tinghe': {
    zh: '字介夫,新都人。明武宗、世宗兩朝首輔。武宗崩無嗣,楊廷和定策迎興王朱厚熜入繼大統。後因大禮議與世宗不合,辭歸,被籍沒,父子皆貶。',
    en: 'Style Jiefu, of Xindu. Grand Secretary under both Emperor Wu and Emperor Shi of Ming. When Wuzong died without heir, Yang Tinghe set the plan to bring the Prince of Xing Zhu Houcong to the throne. He later fell out with Shizong in the Great Rites Controversy; he resigned, his house was confiscated, and father and son alike were thrust down.',
  },
  'hist-yan-song': {
    era: { zh: '青詞宰相', en: 'The Green-Ink Chancellor' },
    zh: '字惟中,分宜人。明嘉靖朝首輔。專權二十年,以善作青詞(道教祭文)得嘉靖帝寵信,號「青詞宰相」。其子嚴世蕃尤奸險。後為徐階所構,父子俱被籍沒,嚴世蕃斬首,嚴嵩餓死於墓側。',
    en: 'Style Weizhong, of Fenyi. Grand Secretary under Emperor Jiajing of Ming. Twenty years he held power, winning Jiajing\'s favor with his "green-ink" Daoist prayer-texts — the "Green-Ink Chancellor." His son Yan Shifan was even more sinister. Later framed by Xu Jie, father and son were both confiscated, Yan Shifan beheaded, and Yan Song starved to death beside the graves.',
  },
  'hist-yan-shifan': {
    zh: '嚴嵩之子。明嘉靖朝權貴。性陰險,號「鬼影」。專橫跋扈,聚財甚富。後與父同被徐階所構,被斬於市。',
    en: 'Son of Yan Song. A great power-holder of Jiajing\'s Ming. Sinister, called "ghost-shadow." Wild and overbearing, he gathered great wealth. Later, with his father, framed by Xu Jie, he was beheaded in the marketplace.',
  },
  'hist-xu-jie': {
    zh: '字子昇,松江華亭人。明嘉靖、隆慶兩朝首輔。性沉穩,以柔克剛,終於扳倒嚴嵩父子。提拔張居正,為「隆慶開關」之始。',
    en: 'Style Zisheng, of Huating in Songjiang. Grand Secretary under Jiajing and Longqing of Ming. Steady in temper, by gentleness he broke the hard — and at last he overthrew Yan Song and his son. He raised Zhang Juzheng, and the "Longqing Opening" began here.',
  },
  'hist-gao-gong': {
    zh: '字肅卿,新鄭人。明隆慶朝首輔。性剛烈,與張居正不睦。萬曆即位,張居正聯馮保構陷高拱,罷歸故里,憂憤而卒。',
    en: 'Style Suqing, of Xinzheng. Grand Secretary under Longqing of Ming. Stiff in temper, at odds with Zhang Juzheng. When Wanli took the throne, Zhang Juzheng with Feng Bao framed Gao Gong; dismissed to his home, he died of grief and rage.',
  },
  'hist-feng-bao': {
    zh: '深州人。明萬曆朝權宦。與張居正相結,共擔朝政十年。張居正死後,被新閣彈劾,籍沒家產,流南京。',
    en: 'Of Shenzhou. A great eunuch under Wanli of Ming. He bound himself to Zhang Juzheng and they held the court for ten years. After Zhang Juzheng died, the new cabinet impeached him; his house was confiscated and he was exiled to Nanjing.',
  },
  'hist-wei-zhongxian': {
    era: { zh: '九千歲', en: '"Nine-Thousand-Year Lord"' },
    zh: '河間肅寧人。明熹宗朝權宦。掌東廠,專權七年,號「九千歲」,僅次於皇帝「萬歲」。殺東林黨,陷楊漣、左光斗等忠臣。崇禎即位,逐之,自縊於阜城。',
    en: 'Of Suning in Hejian. A great eunuch under Emperor Xi of Ming. He held the Eastern Depot; seven years he held all power and was called the "Nine-Thousand-Year Lord," just below the emperor\'s "Ten-Thousand Years." He killed the Donglin party and framed Yang Lian, Zuo Guangdou, and other loyal ministers. When Chongzhen took the throne he was driven out; he hanged himself at Fucheng.',
  },
  'hist-yang-lian': {
    era: { zh: '東林六君子', en: 'One of the Six Donglin Gentlemen' },
    zh: '字文孺,湖廣應山人。明熹宗朝御史。上《劾魏忠賢二十四罪疏》,魏忠賢恨之,陷入詔獄,酷刑而死。東林六君子之首。',
    en: 'Style Wenru, of Yingshan in Huguang. A Censor under Emperor Xi of Ming. He sent up the Memorial Impeaching Wei Zhongxian for Twenty-Four Crimes. Wei Zhongxian hated him, threw him into the imperial prison, and he died under torture. First of the Six Donglin Gentlemen.',
  },
  'hist-zuo-guangdou': {
    zh: '字遺直,桐城人。明熹宗朝御史。與楊漣同劾魏忠賢,被陷入獄,酷刑而死。東林六君子之一。',
    en: 'Style Yizhi, of Tongcheng. A Censor under Emperor Xi of Ming. With Yang Lian he impeached Wei Zhongxian; framed into prison, he died under torture. One of the Six Donglin Gentlemen.',
  },
  'hist-li-shizhen': {
    era: { zh: '本草綱目', en: 'Author of the Compendium of Materia Medica' },
    zh: '字東璧,蘄州人。明朝醫學家。歷時二十七年,著《本草綱目》五十二卷,收藥一千八百九十二種,方一萬一千零九十六則。中華醫藥之大成,世界醫學史之珍。',
    en: 'Style Dongbi, of Qizhou. A Ming physician. For twenty-seven years he laboured on the Compendium of Materia Medica in fifty-two fascicles, containing 1,892 medicines and 11,096 prescriptions — the great gathering of Chinese pharmacology, a treasure of world medical history.',
  },
  'hist-xu-guangqi': {
    zh: '字子先,上海人。明末科學家、政治家。與利瑪竇譯《幾何原本》,中華西學東漸之始。著《農政全書》。位至禮部尚書、內閣大學士。',
    en: 'Style Zixian, of Shanghai. A scientist and statesman of late Ming. With Matteo Ricci he translated Euclid\'s Elements — the start of Western learning coming east. He wrote the Complete Treatise on Agricultural Administration. He rose to Minister of Rites and Grand Secretary.',
  },
  'hist-xu-xiake': {
    era: { zh: '徐霞客遊記', en: 'Author of the Travel Diaries' },
    zh: '名宏祖,號霞客,江陰人。明末旅行家、地理學家。三十年遊歷中華山川,著《徐霞客遊記》六十萬言,中華地理之大成,世界地理史之珍。',
    en: 'Personal name Hongzu, called Xiake, of Jiangyin. A traveler and geographer of late Ming. Thirty years he travelled the mountains and rivers of China and wrote the Travel Diaries of Xu Xiake in six hundred thousand words — the great compendium of Chinese geography, a treasure of world geographical history.',
  },
  'hist-song-yingxing': {
    era: { zh: '天工開物', en: 'Author of the Exploitation of the Works of Nature' },
    zh: '字長庚,江西奉新人。明末科學家。著《天工開物》十八卷,記中華農業、手工業之全,中華科技史之珍,世界第一部科技百科。',
    en: 'Style Changgeng, of Fengxin in Jiangxi. A scientist of late Ming. He wrote the Exploitation of the Works of Nature in eighteen fascicles — a complete record of Chinese agriculture and handicrafts, a treasure of Chinese science history, the world\'s first technical encyclopedia.',
  },
  'hist-tang-xianzu': {
    era: { zh: '東方莎士比亞', en: '"The Shakespeare of the East"' },
    zh: '字義仍,號海若,臨川人。明朝戲曲家。著「臨川四夢」(《牡丹亭》、《紫釵記》、《邯鄲記》、《南柯記》),以《牡丹亭》為魁。世稱「東方莎士比亞」。',
    en: 'Style Yireng, called Hairuo, of Linchuan. A Ming dramatist. He wrote the "Four Linchuan Dreams" (Peony Pavilion, Purple Hairpin, Handan Dream, Southern Branch Dream); the Peony Pavilion stands above all. The world has called him the "Shakespeare of the East."',
  },
  'hist-tang-yin': {
    era: { zh: '唐伯虎', en: 'Tang Bohu' },
    zh: '字伯虎,號六如居士,蘇州人。明朝書畫家、詩人。江南四大才子之首。性放達好酒,屢試不第。作詩畫,千古傳誦。「桃花仙人種桃樹,又摘桃花換酒錢」千古絕唱。',
    en: 'Style Bohu, called the Recluse of the Six As-Ifs, of Suzhou. A Ming calligrapher, painter, and poet. First of the Four Great Talents of Jiangnan. Free and fond of wine, he failed the examinations again and again. His verse and painting are read forever. "The Peach Blossom Immortal plants the peach tree / and plucks the peach blossoms for wine money" rang forever.',
  },
  'hist-wen-zhengming': {
    zh: '字徵明,號衡山居士,蘇州人。明朝書畫家。江南四大才子之一。與沈周、唐寅、仇英並稱「明四家」。',
    en: 'Style Zhengming, called the Recluse of Mount Heng, of Suzhou. A Ming calligrapher and painter. One of the Four Great Talents of Jiangnan. With Shen Zhou, Tang Yin, and Qiu Ying he made the "Four Masters of Ming."',
  },
  'hist-shen-zhou': {
    zh: '字啟南,號石田,蘇州人。明朝畫家。明四家之首。畫風文雅,開吳門畫派。',
    en: 'Style Qinan, called Shitian, of Suzhou. A Ming painter. First of the Four Masters of Ming. His style was elegant, founder of the Wumen school.',
  },
  'hist-qiu-ying': {
    zh: '字實父,號十洲,太倉人。明朝畫家。明四家之一。出身寒微,以畫為生。工筆人物畫尤精。',
    en: 'Style Shifu, called Shizhou, of Taicang. A Ming painter, one of the Four Masters of Ming. Of humble birth, he lived by his painting. He was peerless in gongbi figure work.',
  },
  'hist-yu-dayou': {
    zh: '字志輔,泉州晉江人。明朝抗倭名將。與戚繼光齊名,世稱「俞戚」。一生破倭百餘戰,皆勝。性剛直,屢遭讒言,屢起屢落。',
    en: 'Style Zhifu, of Jinjiang in Quanzhou. A famed Ming general against the Wokou pirates. Ranked with Qi Jiguang as "Yu and Qi." A hundred fights with the pirates and a hundred victories. Stiff and upright, he was slandered often, raised and cast down again and again.',
  },
  'hist-li-chengliang': {
    zh: '字汝契,鐵嶺人。明萬曆朝遼東名將。鎮遼東三十年,屢破女真、蒙古。然其子李如松等驕橫,且李成梁姑息努爾哈赤,埋清入關之禍根。',
    en: 'Style Ruqi, of Tieling. A famed general of Liaodong under Wanli of Ming. Thirty years he held Liaodong and broke the Jurchen and Mongols many times. But his son Li Rusong and others were proud, and Li Chengliang spared Nurhaci — laying the seed of the Qing\'s entry through the wall.',
  },
  'hist-hong-chengchou': {
    zh: '字彥演,南安人。明末抗清名將,後降清。崇禎時鎮遼東,松錦之戰被擒,降清。為清開國重臣,主持平定西南。世以為大節有虧。',
    en: 'Style Yanyan, of Nan\'an. A famed late-Ming general against the Qing, who later submitted. Under Chongzhen he held Liaodong; at Songjin he was taken and yielded. A great founding minister of Qing, he led the pacification of the southwest. The world held his great virtue broken.',
  },
  'hist-xiong-tingbi': {
    zh: '字飛百,湖廣江夏人。明末遼東經略。屢敗女真,然不見容於朝。後因王化貞失廣寧之罪,被斬於市,傳首九邊,千古冤案。',
    en: 'Style Feibai, of Jiangxia in Huguang. Commissioner of Liaodong at the end of Ming. He broke the Jurchen many times — but found no place in the court. Later, on Wang Huazhen\'s loss of Guangning he was beheaded in the marketplace and his head shown along the nine frontiers — a great injustice of the ages.',
  },
  'hist-sun-chengzong': {
    zh: '字稚繩,保定高陽人。明末薊遼督師。鎮關寧四年,築關寧錦防線,選練關寧鐵騎,為明朝抗清之屏障。後罷歸高陽,清兵攻之,孫承宗率家人抗清而死,夷其家。',
    en: 'Style Zhisheng, of Gaoyang in Baoding. Commander of the Ji-Liao region at the end of Ming. Four years he held Guan-Ning, building the Guan-Ning-Jin defense line and drilling the Guan-Ning Iron Cavalry — the screen of Ming against the Qing. Later dismissed to Gaoyang, when the Qing came against it, Sun Chengzong fought with his household to death — his clan was exterminated.',
  },
  'hist-chongzhen': {
    era: { zh: '崇禎帝', en: 'The Chongzhen Emperor' },
    zh: '名朱由檢,明思宗。光宗第五子。十七歲嗣位,誅魏忠賢。在位十七年,內憂外患,東有清兵,西有李自成。崇禎十七年三月十九日,李自成入北京,崇禎自縊於煤山,以髮覆面,衣襟書「朕涼德藐躬,上干天咎,然皆諸臣誤朕。任賊分裂朕屍,勿傷百姓一人」,年三十四,明亡。',
    en: 'Personal name Zhu Youjian, Emperor Si of Ming. Fifth son of Emperor Guang. At seventeen he took the throne and killed Wei Zhongxian. Seventeen years he reigned with troubles within and without — Qing in the east, Li Zicheng in the west. On the 19th day of the 3rd month of 1644 Li Zicheng entered Beijing; Chongzhen hanged himself on Mount Mei, his hair across his face, and wrote on his lapel: "Of cold virtue and slight body, I have offended Heaven, but it was the ministers who misled me. Let the rebels tear my body — but harm not one of the common people." Thirty-four years old, and Ming was ended.',
  },
  'hist-li-dingguo': {
    zh: '字鴻遠,陝西延安人。明末張獻忠養子。張獻忠死後,率部歸南明永曆帝,連敗清軍,殺清將孔有德、尼堪二王,號「兩蹶名王」。後被吳三桂所破,永曆帝被俘,李定國憂憤而卒於緬甸,年四十二。',
    en: 'Style Hongyuan, of Yan\'an in Shaanxi. An adopted son of Zhang Xianzhong at the end of Ming. When Zhang Xianzhong died he led his men to the Southern Ming Yongli emperor, broke the Qing many times, and killed two Qing princes Kong Youde and Nikan — "broke two famous princes." Later broken by Wu Sangui, the Yongli emperor was taken; Li Dingguo died of grief and rage in Burma at forty-two.',
  },
  'hist-zheng-keshuang': {
    zh: '鄭成功之孫。台灣鄭氏政權末代王。康熙二十二年,施琅率水師渡海,鄭克塽出降,台灣入清版圖。',
    en: 'Grandson of Zheng Chenggong. Last ruler of the Zheng house in Taiwan. In 1683 Shi Lang led the Qing fleet across the sea, and Zheng Keshuang yielded; Taiwan came into Qing.',
  },
  'hist-zhu-yousong': {
    era: { zh: '南明弘光帝', en: 'Emperor Hongguang of Southern Ming' },
    zh: '萬曆之孫,福王朱常洵之子。崇禎死,馬士英、阮大鋮立為帝,即南明弘光帝。在位一年,沉湎酒色。清兵渡江,被擒,押北京斬之。',
    en: 'Grandson of Wanli, son of the Prince of Fu Zhu Changxun. After Chongzhen died, Ma Shiying and Ruan Dacheng set him on the throne as the Hongguang emperor of Southern Ming. One year he reigned, drowning in wine and women. The Qing crossed the river, took him, and beheaded him at Beijing.',
  },
  'hist-zhu-youlang': {
    era: { zh: '永曆帝', en: 'The Yongli Emperor' },
    zh: '萬曆之孫,桂王。南明永曆帝。在位十六年,輾轉雲貴緬甸抗清。後吳三桂攻入緬甸,永曆帝被緬王獻於吳三桂,絞死於昆明,南明遂亡。',
    en: 'Grandson of Wanli, Prince of Gui. The Yongli emperor of Southern Ming. Sixteen years he reigned, fleeing through Yunnan, Guizhou, and Burma against the Qing. Wu Sangui at last marched into Burma; the king of Burma gave the Yongli emperor up, and he was strangled at Kunming — the Southern Ming was ended.',
  },
  'hist-yan-shi': {
    zh: '元朝漢人世侯。降蒙古,鎮東平,以漢法治民,蒙元時山東之主。',
    en: 'A hereditary Han lord of Yuan. He submitted to the Mongols and held Dongping, ruling by Chinese law — lord of Shandong under Mongol-Yuan.',
  },
};
