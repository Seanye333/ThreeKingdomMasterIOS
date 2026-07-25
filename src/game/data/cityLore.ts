/**
 * 地方風物志 — a short, evocative gazetteer note for the major cities: the
 * lay of its land, the deeds it is remembered for, the flavour of the place in
 * the age of the Three Kingdoms.
 *
 * Purely display flavour (shown read-only in the City panel's 總覽 tab); NOT part
 * of the City runtime type or the save format. Only a subset of the 128 cities
 * carry an entry — the historically resonant ones. Add freely, keyed by city id.
 */
export interface CityLore {
  zh: string;
  en: string;
}

export const CITY_LORE: Record<string, CityLore> = {
  luoyang: {
    zh: '九朝故都,居天下之中,河洛環抱,王氣所鍾。董卓一炬,宮闕成墟,銅駝荊棘,行人為之淚下 —— 繁華與離黍,皆萃於此。',
    en: 'Ancient capital of nine dynasties, seat of the realm\'s centre, cradled by the Yellow and Luo rivers where the king-aura gathers. One torch of Dong Zhuo turned its palaces to rubble — bronze camels lost in brambles, and travellers weep to pass. Splendour and ruin meet here.',
  },
  changan: {
    zh: '秦川八百里,沃野膏腴,漢家陵闕,錯落其間。四塞為固,金城千里,自古帝王州 —— 然李傕郭汜之亂,長安亦幾成白地。',
    en: 'The eight hundred li of the Qin plain, rich and fat, strewn with the tomb-towers of the Han. Ringed by passes and walled a thousand li, a land of emperors since antiquity — yet the strife of Li Jue and Guo Si left even Chang\'an near a wasteland.',
  },
  xuchang: {
    zh: '曹操挾天子而都於此,屯田積穀,許下之田歲收百萬斛。天子雖在,號令皆出司空府 —— 漢室之名存,而實已移。',
    en: 'Here Cao Cao held the Son of Heaven and made his capital, opening farm-colonies that reaped a million bushels a year. The emperor sat, but every command issued from the Excellency\'s office — the Han in name, its substance already moved.',
  },
  ye: {
    zh: '冀州雄鎮,漳水之陽。袁氏四世之基,曹操破之而營之,築銅雀、金鳳、冰井三臺,遂為北方霸府,鄴下文章甲於一時。',
    en: 'Mighty seat of Ji province, north of the Zhang river. Base of four generations of the Yuan clan, broken by Cao Cao and rebuilt into his own — the Bronze Sparrow, Golden Phoenix and Ice-Well terraces rose here, and it became the northern hegemon\'s hall, its letters the finest of the age.',
  },
  chengdu: {
    zh: '天府之國,沃野千里,水旱從人,不知饑饉。錦官城外柏森森,都江堰潤兩川 —— 高祖因之以成帝業,昭烈憑之以立蜀漢。',
    en: 'Land of Heavenly Storehouses, a thousand li of fertile fields where flood and drought bend to human will and famine is unknown. Cypresses shade the Brocade City; the Dujiang weir waters the two rivers. Here Han\'s founder forged his throne, and here the First Sovereign of Shu raised his own.',
  },
  jianye: {
    zh: '鍾山龍蟠,石頭虎踞,大江天塹,足以為固。諸葛亮嘗歎:此帝王之宅也。孫吳定鼎於斯,江東子弟,遂成鼎足之一。',
    en: 'Bell Mountain coils like a dragon, Stone City crouches like a tiger, and the great river is a Heaven-set moat. Zhuge Liang once sighed: this is a dwelling for emperors. Here Sun\'s Wu set its tripod-foot, and the sons of the Southland became one leg of the divided realm.',
  },
  xiangyang: {
    zh: '漢水津要,南北喉襟,兵家必爭。城西二十里有隆中,臥龍高臥其間;劉表牧荊,文士雲集,一時稱盛。',
    en: 'A ford-key on the Han river, throat between north and south, prize of every strategist. Twenty li west lies Longzhong, where the Crouching Dragon lay in wait; under Liu Biao\'s governance the literati gathered like clouds, and it flourished for a season.',
  },
  jiangling: {
    zh: '荊州咽喉,南郡治所,控扼大江,積甲如山。關羽鎮之以圖北,呂蒙白衣渡江而襲之 —— 得失之間,荊州易主。',
    en: 'The throat of Jing province and seat of Nan commandery, gripping the great river with arms stacked like hills. Guan Yu held it to strike north; Lü Meng crossed the river in white and took it by stealth — and in that turn of gain and loss, all Jing changed hands.',
  },
  xiapi: {
    zh: '泗水淮流之交,徐州要害。呂布據之,轅門射戟,雄極一時;曹操決泗、沂之水以灌城,白門樓上,飛將終殞。',
    en: 'Where the Si meets the Huai, the vital point of Xu province. Lü Bu held it — the halberd shot at the gate marking his brief zenith; then Cao Cao loosed the Si and Yi to drown the walls, and atop the White Gate Tower the Flying General met his end.',
  },
  shouchun: {
    zh: '淮南重鎮,芍陂灌溉,魚稻之饒。袁術僭號稱帝於此,奢縱無度,不三年而敗亡 —— 冢中枯骨,竟欲窺神器。',
    en: 'Great town of Huainan, watered by the Shao reservoir, rich in fish and rice. Here Yuan Shu usurped the imperial title, ruled in reckless excess, and fell within three years — a "withered bone in the tomb" who dared covet the sacred vessel.',
  },
  hefei: {
    zh: '江淮鎖鑰,魏吳必爭之地。孫權十萬圍之,張遼率八百死士夜陷其陣,威震逍遙津,江東小兒聞遼名而不敢夜啼。',
    en: 'Lock and key of the Yangtze-Huai country, contested without end by Wei and Wu. Sun Quan besieged it with a hundred thousand; Zhang Liao broke their lines by night with eight hundred braves, his fame thundering at Xiaoyao Ford — until Southland children hushed at his name.',
  },
  hanzhong: {
    zh: '秦蜀之咽喉,米倉、褒斜諸道通焉。張魯以五斗米道據之三十年,民夷信向;定軍山下,黃忠一戰斬夏侯淵,漢中遂歸於蜀。',
    en: 'The throat between Qin and Shu, threaded by the Micang and Baoxie roads. Zhang Lu held it thirty years by the Way of the Five Pecks of Rice, folk and tribes alike his faithful; and below Dingjun Mountain, Huang Zhong felled Xiahou Yuan in a single stroke, and Hanzhong passed to Shu.',
  },
  pengcheng: {
    zh: '汴泗交流,徐州治所,四通五達,自古四戰之地。舟車輻輳,商賈雲集,然無險可恃,得之易而守之難。',
    en: 'Where the Bian meets the Si, seat of Xu province, open on every side — a land of four fronts since old. Boats and carts converge, merchants throng; yet with no fastness to lean on, easily won and hard to hold.',
  },
  wan: {
    zh: '南陽帝鄉,光武龍興之地,冠蓋相望,富冠海內。宛城之役,曹操喪長子與典韋於此 —— 一時之敗,痛徹肺腑。',
    en: 'Nanyang, the emperor\'s home country, where Emperor Guangwu rose like a dragon; carriage-canopies in unbroken sight, its wealth first in the realm. At the battle of Wan, Cao Cao lost his eldest son and Dian Wei here — a defeat that cut him to the marrow.',
  },
  chenliu: {
    zh: '兗州要邑,通衢所會。曹操散家財、首倡義兵於此,矯詔討董,天下響應 —— 霸業之始,實肇於陳留。',
    en: 'Key town of Yan province, where the great roads meet. Here Cao Cao poured out his family fortune and first raised a righteous host, forging an edict to smite Dong Zhuo as the realm answered — the seed of his hegemony was truly sown at Chenliu.',
  },
  puyang: {
    zh: '濮水之上,兗州爭衡之地。呂布乘曹操東征而襲兗州,操還與布相持於濮陽,幾為火所焚,狼狽而僅免。',
    en: 'On the Pu river, a proving-ground for mastery of Yan province. When Cao Cao marched east, Lü Bu seized Yan; Cao turned back and locked with him at Puyang, all but consumed by fire, escaping only in bedraggled ruin.',
  },
  beihai: {
    zh: '青州名郡,鄭康成之鄉里。孔融為相,好士養民,然黃巾蜂起,管亥圍城,幸太史慈突圍求救,劉備一旅來援而解。',
    en: 'Renowned commandery of Qing province, home country of the scholar Zheng Xuan. Kong Rong governed here, prizing talent and nurturing the folk — until the Yellow Turbans swarmed and Guan Hai laid siege; Taishi Ci broke out for aid, and Liu Bei\'s column raised the ring.',
  },
  kuaiji: {
    zh: '越地舊都,禹穴所在,大江之南,魚鹽之利。虞、魏、顧、陸諸族世居於此;山越阻險出沒,郡縣常患其擾。',
    en: 'Old capital of the Yue country, site of Yu\'s cave-tomb, south of the great river and rich in fish and salt. The Yu, Wei, Gu and Lu clans have dwelt here for generations; the Shan Yue haunt the crags, a standing vexation to the counties.',
  },
  chaisang: {
    zh: '潯陽江畔,大江與彭蠡之會。周瑜練水軍於此,舳艫千里;赤壁之戰前夜,魯肅引孔明過江,聯吳抗曹之議,定於柴桑帳中。',
    en: 'On the Xunyang reach, where the great river meets Lake Pengli. Here Zhou Yu drilled his fleet, prows and sterns a thousand li; and on the eve of Red Cliffs, Lu Su led Kongming across the river, and the pact to ally Wu against Cao was sealed in a Chaisang tent.',
  },
  jiangxia: {
    zh: '夏口要地,漢水入江之口,控扼大江上下。黃祖鎮之而拒孫氏,孫堅、孫策父子先後圖之,禰衡亦殞命於此。',
    en: 'The strong point of Xiakou, where the Han pours into the Yangtze, gripping the river above and below. Huang Zu held it against the Suns; father and son, Sun Jian and Sun Ce, each sought it in turn — and here too Mi Heng met his death.',
  },
  wuwei: {
    zh: '河西走廊之衝,涼州大馬,橫行天下。羌胡雜處,商旅西通西域,然叛服無常,馬騰、韓遂之屬,擁兵割據其間。',
    en: 'The pivot of the Hexi Corridor, whence the great horses of Liang province ranged the realm. Qiang and Hu dwell mingled here, and merchants pass west to the Western Regions — yet loyalty is fickle, and the likes of Ma Teng and Han Sui held the land under arms.',
  },
  tianshui: {
    zh: '隴右要衝,渭水上游,姜維之故里。街亭在其東,馬謖失之而諸葛揮淚;伯約降蜀,遂繼武侯之志,九伐中原。',
    en: 'A key crossing of the Longyou country, on the upper Wei, birthplace of Jiang Wei. Jieting lies to its east — lost by Ma Su, and wept over by Zhuge Liang; here Boyue turned to Shu, and took up the Chancellor\'s charge, nine times marching on the heartland.',
  },
  nanpi: {
    zh: '渤海之濱,冀州要邑。袁紹以渤海起家,官渡既敗,袁譚據南皮以抗曹,城破身死,河北盡歸於曹氏。',
    en: 'On the shore of the Bohai gulf, a key town of Ji province. From Bohai Yuan Shao first rose; after the rout at Guandu, Yuan Tan held Nanpi against Cao — the walls fell, he died, and all Hebei passed to the house of Cao.',
  },
  xiaopei: {
    zh: '沛國小城,徐州之屏。劉備三讓徐州而屯小沛,呂布轅門射戟解其危;後為布所破,備乃奔曹 —— 顛沛流離,此其一驛。',
    en: 'The small city of Pei, a screen before Xu province. Liu Bei, having thrice declined Xu province, garrisoned Xiaopei, and Lü Bu\'s halberd-shot at the gate once spared him; later broken by Bu, he fled to Cao — one waystation in a life of wandering.',
  },
  runan: {
    zh: '汝潁之間,多奇士。袁氏四世三公,門生故吏遍天下;許劭兄弟月旦評人物,一言之褒,聲價十倍,士林重之。',
    en: 'Between the Ru and the Ying, a land teeming with rare talents. The Yuan clan held the Three Excellencies four generations, its protégés and former clerks spread across the realm; the Xu brothers\' "First-of-the-Month" appraisals could raise a man\'s worth tenfold with a word, and the literati held them in awe.',
  },
  changsha: {
    zh: '湘水之濱,荊南重鎮,魚米之鄉。太守韓玄麾下,黃忠老而彌辣、魏延勇而有謀;關羽戰長沙,與黃忠惺惺相惜,傳為佳話。',
    en: 'On the Xiang river, a great town of southern Jing, a country of fish and rice. Under Governor Han Xuan served Huang Zhong — old yet deadly — and Wei Yan, brave and cunning; when Guan Yu fought at Changsha, he and Huang Zhong honoured each other as equals, a tale long told.',
  },
  pingyuan: {
    zh: '河朔平衍之地,青冀之交。劉備嘗為平原相,外禦寇難,內豐財施,士之下者必與同席而食 —— 仁聲於此始著。',
    en: 'A flat, open land of the Hebei country, at the seam of Qing and Ji. Liu Bei once served as Chancellor of Pingyuan — warding off raiders without, freely giving within, sharing his mat and board even with the lowly. Here his name for benevolence first shone.',
  },
  beiping: {
    zh: '幽燕苦寒之地,北拒烏桓、鮮卑。公孫瓚據之,簡邊騎為白馬義從,馳突塞上,胡人畏之;然剛愎自用,終困於易京樓中。',
    en: 'A bitter, frozen land of the You-Yan country, warding off the Wuhuan and Xianbei to the north. Gongsun Zan held it, forging his border-riders into the White Horse Volunteers who stormed the frontier till the Hu feared them — yet, stubborn and self-willed, he came at last to grief in the tower of Yijing.',
  },
  guangling: {
    zh: '江淮之交,廣陵潮壯,天下奇觀。太守陳登治之,興陂塘、通漕運,又破孫策之眾於江上,雄氣勃勃,惜乎早世。',
    en: 'At the meeting of the Yangtze and Huai, where the Guangling tide surges — a wonder of the realm. Governor Chen Deng ruled it, raising dikes and opening grain-transport, and shattered Sun Ce\'s host upon the river; his heroic spirit brimmed over — a pity he died young.',
  },
  jiaozhi: {
    zh: '嶺南絕域,珠璣、犀象、玳瑁之所出。士燮世守交州,綏撫百越,中原喪亂而此地獨安,流寓之士,多歸依焉。',
    en: 'A far frontier south of the ranges, whence come pearls, rhino-horn, ivory and tortoiseshell. Shi Xie held Jiao province for generations, soothing the Hundred Yue; while the heartland drowned in chaos this land alone stayed at peace, and refugee scholars flocked to its shelter.',
  },
  wuling: {
    zh: '沅、湘之地,五溪蠻所居,山深林密,瘴癘之鄉。蠻王沙摩柯率眾助劉備伐吳,夷陵一炬,蠻兵與漢軍俱燼於猇亭。',
    en: 'The country of the Yuan and Xiang rivers, home of the Five Streams Man, deep in mountain and forest, a land of pestilent vapours. Their king Shamoke led his men to help Liu Bei against Wu — and in the one blaze of Yiling, Man warriors and Han troops burned together at Xiaoting.',
  },
  lujiang: {
    zh: '皖城形勝,大江之北。孫策、周瑜攻皖,得橋公二女,國色天香,策納大喬、瑜娶小喬,英雄美人,一時稱羨。',
    en: 'The fair vantage of Wan city, north of the great river. When Sun Ce and Zhou Yu took Wan, they won the two daughters of Elder Qiao, beauties beyond compare — Ce wed the Elder Qiao, Yu the Younger; heroes and belles, the envy of the age.',
  },
  xincheng: {
    zh: '房陵、上庸之間,山峻水險,介乎魏蜀。孟達叛蜀降魏,復欲叛魏歸蜀,司馬懿八日行千二百里,兵臨城下,達猶未及舉事而首已傳矣。',
    en: 'Between Fangling and Shangyong, where the mountains are sheer and the waters treacherous, wedged between Wei and Shu. Meng Da forsook Shu for Wei, then made to forsake Wei for Shu — but Sima Yi marched twelve hundred li in eight days, and before Meng Da could even rise, his head was already sent on.',
  },
};

/** Lookup a city's gazetteer note, or null if it carries none. */
export function cityLore(cityId: string): CityLore | null {
  return CITY_LORE[cityId] ?? null;
}
