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

  // ── 名場面之地 — ground the stories happen on ──────────────────────
  guandu: {
    zh: '汴水之濱,官道所渡。曹操以不滿萬之眾拒袁紹十萬,相持半年,糧且盡而不退。烏巢一炬,河北之勢遂傾 —— 中原的歸屬,是在這片平地上定下的。',
    en: 'A crossing on the Bian, where the highway fords. Cao Cao held ten thousand against Yuan Shao\'s hundred thousand for half a year, his grain nearly gone and his line unbroken. One torch at Wuchao tipped the north — the ownership of the Central Plain was settled on this flat ground.',
  },
  chibi: {
    zh: '大江南岸,絕壁臨流。建安十三年冬,黃蓋詐降,火船乘風而下,操軍舳艫一時盡燃,延及岸上營落。北軍不習水土,疫病先起於火之前。天下三分,始於這一夜的東南風。',
    en: 'Red cliffs on the south bank, sheer above the current. Huang Gai feigned surrender and the fireships ran down on the wind; Cao Cao\'s fleet burned in a single hour and the fire reached the camps ashore. His northerners were already sick before the flames came. The realm split into three on the strength of one night\'s southeast wind.',
  },
  changban: {
    zh: '當陽之野,長阪橫亙。曹操輕騎一日一夜行三百餘里及之,十餘萬百姓隨劉備而走,輜重塞道。趙雲七進七出於萬軍之中,張飛據水斷橋,瞋目橫矛,曹軍無人敢近。',
    en: 'The long slope on the Dangyang plain. Cao Cao\'s light horse came three hundred li in a day and a night; a hundred thousand civilians were walking with Liu Bei and the baggage choked the road. Zhao Yun went in and out of an army seven times, and Zhang Fei held the broken bridge with his spear across the saddle, glaring, and no one in the Cao army would come near.',
  },
  jieting: {
    zh: '隴山之口,街衢當道。諸葛亮出祁山,以馬謖督前部;謖舍水上山,不下據城,張郃絕其汲道,一日而潰。北伐之機盡於此地,而蜀相揮淚斬之。',
    en: 'A defile at the mouth of the Long hills, where the road passes through. Zhuge Liang came out at Qishan with Ma Su in the van; Ma Su left the water and went up the hill instead of holding the town, Zhang He cut him off from the stream, and it was over in a day. The whole northern campaign died here, and the Chancellor wept as he had him executed.',
  },
  maicheng: {
    zh: '沮漳之間,小城孤懸。關羽北伐失利,南歸無路,退保此城,士卒散亡,夜遁而西,為潘璋部將所擒。威震華夏者,終於一座沒有名字的小城。',
    en: 'A small walled place between the Ju and the Zhang. His northern campaign broken and the road south cut, Guan Yu fell back here; his men melted away, he slipped out west by night, and Pan Zhang\'s officers took him. The man whose fame had shaken the realm ended at a town nobody had heard of.',
  },
  xiaoting: {
    zh: '夷道之側,山林夾江。劉備七百餘里連營,陸遜按兵七八月不動,待其暑倦,一夕縱火,四十餘營俱燼。蜀漢的元氣,燒在了這片林子裡。',
    en: 'By the Yidao road, the river hemmed in by wooded hills. Liu Bei\'s camps ran seven hundred li; Lu Xun sat still for seven or eight months until the heat had worn them out, then loosed fire in one night and forty camps went up together. The strength of Shu burned in these woods.',
  },
  yiling: {
    zh: '大江出峽之口,楚之西門。白起燒夷陵,焚楚先王之墓,楚人自此不振;陸遜火燒連營,亦在此地。上游一失,則下游無險 —— 吳人守此,守的是整條長江。',
    en: 'Where the great river comes out of the gorges — the western door of Chu. Bai Qi burned Yiling and the tombs of the Chu kings with it, and Chu never recovered; Lu Xun\'s fire came later on the same ground. Lose the upper river and there is no defending the lower: holding this place, Wu was holding the whole Yangzi.',
  },
  fancheng: {
    zh: '漢水北岸,與襄陽夾江對峙。關羽圍之,會漢水暴溢,于禁七軍皆沒,龐德被斬,曹操議遷都以避其鋒。守此城者曹仁,以數千人堅守數月,城不沒者數板。',
    en: 'On the north bank of the Han, facing Xiangyang across the water. Guan Yu besieged it; the Han flooded, Yu Jin\'s seven armies drowned, Pang De was beheaded, and Cao Cao discussed moving the capital out of his reach. Cao Ren held it with a few thousand men for months, with only a few boards of wall above the flood.',
  },
  bowang: {
    zh: '宛洛之間,林木深阻。劉備屯新野,誘夏侯惇入博望,自燒屯偽遁,設伏於林,大破之。這是諸葛亮出山前劉備自己打的仗,演義卻算在了軍師頭上。',
    en: 'Between Wan and Luoyang, thick with timber and hard going. From Xinye, Liu Bei drew Xiahou Dun into Bowang, burned his own camp and feigned flight, and broke him from an ambush in the woods. This was Liu Bei\'s own battle, fought before Zhuge Liang came down from the hills — the novel gives the credit to the strategist.',
  },
  baima: {
    zh: '黃河南岸渡口。袁紹遣顏良攻此,曹操用荀攸計,聲東擊西,關羽策馬刺良於萬眾之中,斬其首而還,紹諸將莫能當者。',
    en: 'A ford on the south bank of the Yellow River. Yuan Shao sent Yan Liang against it; Cao Cao took Xun You\'s advice and feinted elsewhere, and Guan Yu rode into ten thousand men, ran Yan Liang through, took his head and came back — and none of Yuan Shao\'s officers could stand in his way.',
  },
  yanjin: {
    zh: '白馬之西,河濟之衝。曹操棄輜重以餌敵,文醜之軍爭取之,陣亂,遂縱兵擊,斬醜。以輜重為餌,是這一戰留給後世的講法。',
    en: 'West of Baima, where the Yellow River and the Ji converge. Cao Cao abandoned his baggage as bait; Wen Chou\'s men broke ranks to scramble for it, and he loosed his troops and killed Wen Chou. Baggage as bait is what later ages took from this battle.',
  },
  hulao: {
    zh: '成皋之險,天下之樞。東出則中原,西入則洛陽,自古為兵家必爭。三英戰呂布傳於演義,李世民三千五百騎擒竇建德則見於信史 —— 同一道關,兩個時代。',
    en: 'The defile at Chenggao, the hinge of the realm: east lies the Central Plain, west lies Luoyang, and armies have always had to fight for it. The three brothers against Lü Bu belongs to the novel; Li Shimin taking Dou Jiande with three thousand five hundred horse belongs to the record — the same pass, two ages apart.',
  },
  tongguan: {
    zh: '關中東門,河山之會。馬超十部反,屯此以拒曹操;操渡渭水,為超所追,矢下如雨,許褚左手舉鞍蔽之,右手撐船,僅以身免。',
    en: 'The eastern gate of Guanzhong, where the river meets the mountains. Ma Chao\'s ten companies held it against Cao Cao; crossing the Wei, Cao Cao was run down and the arrows came like rain, and Xu Chu held a saddle up as a shield with one hand and poled the boat with the other. It was very close.',
  },
  hanguguan: {
    zh: '崤函之險,一夫當關。秦據此以拒六國,合縱之師百萬叩關而攻,九國之師逡巡而不敢進 —— 秦之所以能一天下,半在此關。',
    en: 'The defile of Xiao and Han, where one man can hold the road. Qin held it against the six states; the vertical alliance beat on the gate with a million men and the armies of nine states milled about and dared not enter. Half of how Qin took the realm is this pass.',
  },
  jianmen: {
    zh: '大劍山斷處,兩崖如門。姜維列營守此,鍾會十餘萬眾攻之不能克,議欲還師。「一夫當關,萬夫莫開」—— 說的正是這裡。蜀之亡,不亡於劍閣,亡於陰平。',
    en: 'Where the Dajian range breaks and two cliffs stand like a gate. Jiang Wei held it in a line of camps and Zhong Hui\'s hundred thousand could not force it, and began discussing going home. "One man at the pass, ten thousand cannot open it" — this is the place. Shu did not fall at Jiange. It fell at Yinping.',
  },
  yinping: {
    zh: '摩天嶺下,人跡罕至。鄧艾自此行無人之地七百餘里,鑿山通道,造作橋閣,糧將匱而不返;山高谷深,乃以氈自裹,推轉而下,將士皆攀木緣崖,魚貫而進。',
    en: 'Below Motian ridge, where nobody goes. Deng Ai came this way seven hundred li through empty country, cutting a path and building trestles, his supplies failing and no thought of turning back. Where the drop was too steep he wrapped himself in felt and rolled down it, and his men went hand over hand along the trees and cliffs, in single file.',
  },
  baishuiguan: {
    zh: '白水之上,入蜀之鑰。劉璋以此關兵權授劉備,使拒張魯;龐統獻策,即以此軍還取成都。開門揖盜者,終於失其國。',
    en: 'Above the Bai river, the key to Shu. Liu Zhang handed Liu Bei command of this garrison to hold off Zhang Lu; Pang Tong\'s advice was to turn that same army round on Chengdu. The man who opened his own gate to a guest lost his province by it.',
  },
  jiameng: {
    zh: '蜀北之衝,劉備駐兵處。屯此年餘,厚樹恩德以收眾心,然後南向 —— 入蜀之戰不是奇襲,是一場準備了一年的背叛。',
    en: 'The northern approach to Shu, where Liu Bei was quartered. He stayed a year and more, spending freely on goodwill to bind the local men to him, and then turned south. The conquest of Shu was not a surprise attack; it was a betrayal a year in the preparing.',
  },
  luocheng: {
    zh: '成都北門,雒水環之。劉璋子劉循守此,拒劉備一年。龐統攻城,為流矢所中而卒,年三十六。城下之道,後人名曰落鳳坡。',
    en: 'The northern door of Chengdu, ringed by the Luo. Liu Zhang\'s son held it against Liu Bei for a year. Pang Tong, pressing the assault, was struck by a stray arrow and died at thirty-six. The road below the walls is called the Fallen Phoenix Slope after him.',
  },
  mianzhu: {
    zh: '成都之北,最後一道屏障。諸葛瞻拒鄧艾於此,艾遺書誘降,瞻怒斬其使,出戰而死,子尚曰:「父子荷國重恩,不早斬黃皓,以致傾敗,用生何為!」乃馳赴魏軍而死。',
    en: 'North of Chengdu, the last screen before the capital. Zhuge Zhan met Deng Ai here; Deng Ai wrote offering terms and Zhuge Zhan beheaded the messenger, went out to fight, and died. His son Shang said: "Father and son alike were loaded with the state\'s favour, and we did not cut Huang Hao down in time, and it has come to ruin. What is living for?" — and rode into the Wei lines and died.',
  },
  fucheng: {
    zh: '涪水之會,蜀中通衢。劉備與劉璋會於此,置酒百餘日,歡飲甚樂。龐統勸就席執之,備曰「初入他國,恩信未著,此不可也」。一年之後,兩人在城下相見。',
    en: 'Where the Fu waters meet, a hub of the Shu roads. Liu Bei and Liu Zhang met here and feasted for over a hundred days in great good humour. Pang Tong urged seizing him at the table; Liu Bei said, "We have only just entered another man\'s country and our credit is not yet established — it cannot be done." A year later they met again, under the walls.',
  },
  zitong: {
    zh: '劍閣之南,蜀道所經。李白云「蜀道之難,難於上青天」,其險正在此一線;而張松獻圖之後,這條路對外人就不再是難的了。',
    en: 'South of Jiange, on the Shu road. "The road to Shu is harder than climbing to the blue sky," wrote Li Bai, and this stretch is what he meant. After Zhang Song handed over his map, it stopped being hard for outsiders.',
  },
  gongan: {
    zh: '油江口,劉備立營處。孫夫人歸吳,關羽守荊,糜芳為南郡太守鎮此。呂蒙至,芳不戰而降 —— 荊州之失,失在後方一扇門。',
    en: 'At the mouth of the You river, where Liu Bei built his camp. Lady Sun went home to Wu, Guan Yu held Jing, and Mi Fang governed Nanjun from here. When Lü Meng arrived, Mi Fang surrendered without a fight. Jing province was lost through a door at the back.',
  },
  ruxu: {
    zh: '濡須水口,吳之北門。孫權築塢於此,與曹操相拒。操望其舟船器仗軍伍整肅,嘆曰:「生子當如孫仲謀!」乃退。丁奉雪中短兵,亦在此地。',
    en: 'The mouth of the Ruxu, Wu\'s northern door. Sun Quan built his works here and faced Cao Cao across the water. Looking at the ships and ranks in perfect order, Cao Cao said: "One should have a son like Sun Zhongmou" — and withdrew. Ding Feng\'s charge with short blades in the snow was fought here too.',
  },
  baqiu: {
    zh: '洞庭之口,大江所匯。周瑜自江陵還,道於此病卒,年三十六,取蜀之議遂寢。臨終上疏,猶論邊事,不及家私。',
    en: 'At the mouth of Dongting, where the waters gather into the great river. Zhou Yu, returning from Jiangling, fell ill here and died at thirty-six, and the plan for taking Shu lapsed with him. His last memorial discussed the frontier; it said nothing about his family.',
  },
  xiling: {
    zh: '峽口要害,吳之藩表。步闡以此城降晉,陸抗築嚴圍,內以圍闡,外以禦寇,不攻而先自固,卒破之。抗嘗言:西陵、建平,國之藩表,若失之則非徒失一郡。',
    en: 'The strongpoint at the gorge mouth, the outer screen of Wu. Bu Chan handed it to Jin; Lu Kang ringed it with works — inward to contain him, outward to meet the relief — securing himself before striking, and took it. He had written: Xiling and Jianping are the screen of the state; to lose them is not merely to lose a commandery.',
  },
  wuchang: {
    zh: '鄂縣改名,孫權建都於此。「寧飲建業水,不食武昌魚」—— 吳人不願西遷,終還建業。孫皓復遷,復還,國中怨聲載道。',
    en: 'Formerly E county, renamed when Sun Quan made it his capital. "Better to drink the water of Jianye than eat the fish of Wuchang" ran the song — the men of Wu did not want to move west, and the court went back. Sun Hao moved it again, and moved it back, and the whole country complained.',
  },

  // ── 州郡重鎮 — the provinces' working cities ───────────────────────
  taiyuan: {
    zh: '晉陽故地,并州之首,表裡山河。北控雁門,南扼上黨,自趙武靈王胡服騎射以來,便是中原對草原的門閂。李淵父子起兵於此,遂有天下。',
    en: 'The old Jinyang, first city of Bing province, with mountains without and rivers within. It commands Yanmen to the north and Shangdang to the south, and since King Wuling of Zhao put his men in nomad dress it has been the bolt on the door between the plain and the steppe. The Li family rose here and took the empire.',
  },
  shangdang: {
    zh: '太行之上,天下之脊。韓獻上黨於趙而長平之戰起,四十萬人埋骨於此地之南。得上黨者俯視河北,失之者仰人鼻息。',
    en: 'Atop the Taihang range — the spine of the realm. Han handed Shangdang to Zhao and the war at Changping followed, and four hundred thousand men were buried just south of here. Whoever holds it looks down on the north; whoever loses it lives at another\'s pleasure.',
  },
  hukou: {
    zh: '壺關天險,道狹如壺口。曹操北征高幹,行軍苦寒,作《苦寒行》:「北上太行山,艱哉何巍巍!羊腸阪詰屈,車輪為之摧。」',
    en: 'The Hu Pass, where the road narrows like the neck of a jar. Marching against Gao Gan in bitter weather, Cao Cao wrote the Ballad of the Bitter Cold: "North up the Taihang range — how hard it is, how sheer! The sheep-gut road doubles on itself, and the cartwheels break upon it."',
  },
  yanmen: {
    zh: '雁門之塞,勾注山口。李牧守此以拒匈奴,數年不戰,匈奴以為怯;一戰而破十餘萬騎,單于奔走,十餘歲不敢近趙邊。',
    en: 'The Yanmen barrier at the Gouzhu defile. Li Mu held it against the Xiongnu and refused battle for years until they thought him a coward; then in one action he destroyed a hundred thousand horse, the Chanyu fled, and for a decade they did not come near the Zhao frontier.',
  },
  shuofang: {
    zh: '河套之地,黃河北岸。秦逐匈奴而置之,漢武徙民十萬實邊。塞外之地而有塞內之田,得之則進可攻,失之則長城為前線。',
    en: 'The Ordos loop, on the north bank of the Yellow River. Qin drove the Xiongnu out and settled it; Emperor Wu of Han moved a hundred thousand households in to hold it. Fields beyond the wall: hold this and you can advance, lose it and the Great Wall becomes the front line.',
  },
  bohai: {
    zh: '渤海之濱,袁紹起家之郡。董卓以此授紹以羈縻之,紹遂據之以號召關東,天下響應。授人以郡者,未必留得住人。',
    en: 'On the Bohai shore, the commandery where Yuan Shao began. Dong Zhuo granted it to him to keep him quiet; Yuan Shao used it to call the east to arms, and the east came. Giving a man a commandery does not necessarily keep him.',
  },
  boling: {
    zh: '冀中平原,崔氏、盧氏所出。中原士族之淵藪,一姓數百年,朝代更迭而門第不衰 —— 得河北者,先要得這些人家。',
    en: 'The plain of central Ji, home of the Cui and the Lu. This is where the great clans of the north come from: one surname across centuries, dynasties turning over while the houses stand. To hold the north you must first have these families.',
  },
  changshan: {
    zh: '真定舊壤,趙子龍故里。「常山趙子龍」五字,便是他一生的名帖。井陘之口在其西,韓信背水破趙亦在此境。',
    en: 'The old Zhending ground, birthplace of Zhao Yun — "Zhao Zilong of Changshan" was the whole of his calling card. The Jingxing defile lies west of it, and Han Xin broke Zhao with the river at his back within these borders.',
  },
  xindu: {
    zh: '冀州治所之一,河北腹地。袁紹據冀,以此為根本;鄴城既破,袁氏兄弟猶爭此地而相攻 —— 兄弟鬩牆,曹操坐收。',
    en: 'One of the seats of Ji province, deep in the northern heartland. Yuan Shao made it a foundation of his rule; after Ye fell, his sons went on fighting each other for it. The brothers quarrelled and Cao Cao collected the pieces.',
  },
  zhongshan: {
    zh: '中山靖王之國,劉備自稱其後。一個織席販履的人,靠這個譜系走了三十年;而中山國的酒,漢時已是天下名品。',
    en: 'The fief of Prince Jing of Zhongshan, from whom Liu Bei claimed descent — a man who wove mats and sold sandals carried that lineage for thirty years. Zhongshan wine, in Han times, was already famous throughout the realm.',
  },
  linzi: {
    zh: '齊之故都,稷下學宮所在。臨淄之途,車轂擊,人肩摩,連衽成帷,舉袂成幕,揮汗成雨。樂毅下齊七十餘城,唯莒與即墨不服;田單火牛,自即墨而復之。',
    en: 'The old Qi capital and seat of the Jixia academy. In the streets of Linzi the cart hubs struck one another and shoulders rubbed; the joined lapels made a curtain, the raised sleeves a canopy, and the flicked sweat fell like rain. Yue Yi took seventy cities of Qi and only Ju and Jimo held out — and Tian Dan\'s fire oxen came out of Jimo and took them all back.',
  },
  langya: {
    zh: '琅琊之地,諸葛氏、王氏所出。諸葛亮生於此,王導、王羲之亦出此門。一郡而出兩姓,兩姓而定兩朝 —— 東晉所謂「王與馬,共天下」。',
    en: 'Langya, home of the Zhuge and the Wang. Zhuge Liang was born here; so were Wang Dao and Wang Xizhi. One commandery produced two houses, and the two houses steadied two dynasties — in the Eastern Jin they said "the Wang and the Sima share the realm."',
  },
  qiao: {
    zh: '沛國譙縣,曹氏、夏侯氏之鄉。曹操、曹仁、曹洪、夏侯惇、夏侯淵皆出於此 —— 魏之宗室大將,半數是同鄉。',
    en: 'Qiao county in Pei, the home village of the Cao and the Xiahou. Cao Cao, Cao Ren, Cao Hong, Xiahou Dun, Xiahou Yuan all came from here: half the great commanders of Wei were neighbours before they were generals.',
  },
  wancheng: {
    zh: '南陽首邑,天下之膂。冶鐵之利甲於漢世。曹操征張繡,納其嬸,繡夜襲之,長子曹昂、姪曹安民、大將典韋皆死於此 —— 一時之欲,三人之命。',
    en: 'Chief city of Nanyang and the spine of the realm, whose ironworks had no equal in Han times. Campaigning against Zhang Xiu, Cao Cao took his uncle\'s widow into his bed; Zhang Xiu raided the camp that night, and his eldest son Cao Ang, his nephew, and his guard commander Dian Wei all died here. One appetite, three lives.',
  },
  xinye: {
    zh: '襄陽北障,劉備屯兵七年之地。「新野牧,劉皇叔,自到此,民豐足」—— 童謠如此唱。三顧茅廬之後,他從這裡出發。',
    en: 'The northern shield of Xiangyang, where Liu Bei was quartered for seven years. The children sang: "Liu the Imperial Uncle governs Xinye; since he came, the people have enough." After the three visits to the thatched hut, it was from here that he set out.',
  },
  lingling: {
    zh: '荊南四郡之一,湘水上游。劉備取荊南,以諸葛亮督零陵、桂陽、長沙三郡,調其賦稅以充軍實 —— 蜀漢的第一份家底,出自這裡。',
    en: 'One of the four southern commanderies of Jing, on the upper Xiang. When Liu Bei took the south, Zhuge Liang was given Lingling, Guiyang and Changsha to administer and their taxes to fund the army. The first working capital of Shu came from here.',
  },
  guiyang: {
    zh: '荊南山鄉,趙雲曾為太守。趙範欲以寡嫂樊氏配之,雲辭曰:「相與同姓,卿兄猶我兄。」固辭不受,時人謂之知禮。',
    en: 'A hill commandery in southern Jing, where Zhao Yun once governed. Zhao Fan offered him his widowed sister-in-law in marriage; Zhao Yun refused: "We share a surname, so your brother is as my brother." He would not be moved, and the age thought him a man who knew propriety.',
  },
  jiangzhou: {
    zh: '巴郡治所,大江與嘉陵之會。嚴顏守此,張飛破之,顏曰:「我州但有斷頭將軍,無有降將軍也。」飛壯而釋之,引為賓客。',
    en: 'Seat of Ba commandery, where the great river meets the Jialing. Yan Yan held it and Zhang Fei broke him. "This province has generals who lose their heads," said Yan Yan, "not generals who surrender." Zhang Fei admired him, let him go, and kept him as a guest.',
  },
  yongan: {
    zh: '魚復改名,夷陵敗後劉備退保於此。章武三年,託孤於諸葛亮:「若嗣子可輔,輔之;如其不才,君可自取。」崩於永安宮。',
    en: 'Formerly Yufu, renamed after Liu Bei fell back here from Yiling. In his third year he left the heir in Zhuge Liang\'s hands: "If my son is worth supporting, support him; if he has not the ability, take it yourself." He died in the Yong\'an palace.',
  },
  baxi: {
    zh: '閬中所在,張飛守此七年。飛暴而無恩,刑殺既過,又日鞭撻健兒,先主常戒之曰:「卿刑殺既過差,又日鞭撾健兒,而令在左右,此取禍之道也。」後果為帳下所殺。',
    en: 'Around Langzhong, where Zhang Fei was posted for seven years. He was violent and ungenerous, executed too freely, and flogged his own guardsmen daily. Liu Bei warned him: "You execute too readily, you flog your fighting men every day, and then you keep them at your elbow. That is the road to disaster." His own tent-guards killed him.',
  },
  yangping: {
    zh: '漢中西門,山川之限。曹操攻張魯至此,見其險固,嘆曰:「他人商度,少如人意。」得之偶然,而失之亦速 —— 定軍山一戰,漢中易主。',
    en: 'The western gate of Hanzhong, closed in by mountain and water. Coming against Zhang Lu, Cao Cao looked at the position and said: "Other men\'s estimates rarely match what one finds." He took it by luck and lost it quickly — one battle at Dingjun and Hanzhong changed hands.',
  },
  shangyong: {
    zh: '漢水上游,山高路絕。關羽圍樊,呼劉封、孟達發兵相助,二人以山郡初附為辭不許。荊州既失,封還成都,賜死。',
    en: 'On the upper Han, high and hard to reach. Besieging Fan, Guan Yu called on Liu Feng and Meng Da for troops; they refused on the grounds that the hill commanderies had only just come over. When Jing province was lost, Liu Feng went back to Chengdu and was ordered to take his own life.',
  },
  wudu: {
    zh: '氐羌雜居之地,武都之名以水得。諸葛亮取武都、陰平二郡,以復先帝之志;此二郡在手,則隴右可窺。',
    en: 'Where Di and Qiang live intermixed; the name comes from the river. Zhuge Liang took Wudu and Yinping to make good the late sovereign\'s ambition — with these two commanderies in hand, Longyou can be watched.',
  },
  mei: {
    zh: '郿縣,董卓築塢於此,高厚七丈,積穀為三十年儲,曰:「事成,雄據天下;不成,守此足以畢老。」卓死,塢破,金玉山積。',
    en: 'Mei county, where Dong Zhuo built his fortress: walls seventy feet thick and high, and grain laid in for thirty years. "If the thing succeeds, I hold the realm," he said; "if it fails, this will see me out." When he died and it was opened, the gold and jade were piled like hills.',
  },
  wuguan: {
    zh: '關中南門,武關道所出。劉邦自此入秦,約法三章,秦人大悅;項羽由函谷而入,坑降卒,燒宮室 —— 兩條路,兩種天下。',
    en: 'The southern gate of Guanzhong, at the head of the Wu Pass road. Liu Bang came in this way and gave Qin its three articles of law, and the people were delighted; Xiang Yu came in by Hangu, buried the surrendered troops and burned the palaces. Two roads, and two kinds of realm.',
  },
  chencang: {
    zh: '渭水之濱,秦之舊都。韓信暗度陳倉以定三秦;諸葛亮圍此二十餘日不能拔,守將郝昭以千餘人拒數萬,雲梯衝車皆為所破。',
    en: 'On the Wei, an old Qin capital. Han Xin came out this way to take the Three Qin. Zhuge Liang besieged it twenty days and could not carry it: Hao Zhao held with a thousand-odd men against tens of thousands and broke every ladder and ram brought against him.',
  },
  sanguan: {
    zh: '大散關,秦蜀之衝。「鐵馬秋風大散關」—— 陸游詩中的邊塞,正是此地。北出則關中,南入則漢中。',
    en: 'The Great Sanguan pass, the hinge between Qin and Shu. "Iron horses in the autumn wind at Dasan Pass" — the frontier of Lu You\'s poem is this place. North lies Guanzhong, south lies Hanzhong.',
  },
  xiaoguan: {
    zh: '蕭關,關中四塞之一。北出則入河套,匈奴入寇多由此道。漢文帝時匈奴入蕭關,烽火通於甘泉、長安。',
    en: 'The Xiao Pass, one of the four barriers of Guanzhong. North of it lies the Ordos, and it was the Xiongnu\'s usual road in. In Emperor Wen\'s time they came through Xiaoguan and the beacon fires ran all the way to Ganquan and Chang\'an.',
  },
  anding: {
    zh: '涼州東門,絲路所經。諸葛亮一出祁山,南安、天水、安定三郡叛魏應蜀,關中響震 —— 隴右之心,從來不全在長安。',
    en: 'The eastern gate of Liang province, on the silk road. When Zhuge Liang first came out at Qishan, Nan\'an, Tianshui and Anding all went over to Shu and Guanzhong shook. Longyou\'s loyalties were never entirely in Chang\'an.',
  },
  jincheng: {
    zh: '黃河上游,羌漢雜處。韓遂據此三十年,縱橫關隴,與馬騰時盟時叛。涼州之亂,十年不能定 —— 朝廷曾議棄涼州,傅燮爭之乃止。',
    en: 'On the upper Yellow River, where Qiang and Han live side by side. Han Sui held it thirty years, ranging across Guanzhong and Long, allied to Ma Teng one year and at war with him the next. The Liang troubles took a decade to settle; the court once discussed abandoning the province, and Fu Xie argued them out of it.',
  },
  longxi: {
    zh: '隴山之西,李氏之望。飛將軍李廣出於此,其孫李陵亦然;姜維亦隴西天水人。此地出騎將,自古而然。',
    en: 'West of the Long range, seat of the Li. The Flying General Li Guang came from here, and his grandson Li Ling; Jiang Wei was a Longxi–Tianshui man too. This ground has always produced cavalry commanders.',
  },
  shanggui: {
    zh: '天水之北,隴上麥田。諸葛亮出祁山,芟上邽之麥以資軍;司馬懿至,而麥已盡 —— 兩軍相持,爭的常常只是一片熟田。',
    en: 'North of Tianshui, among the Long uplands\' wheat. Zhuge Liang came out at Qishan and cut the standing wheat at Shanggui to feed his army; by the time Sima Yi arrived the fields were bare. What two armies contend for is very often one ripe field.',
  },

  // ── 江東與嶺南 — the river country and the far south ───────────────
  wu: {
    zh: '吳郡治所,顧、陸、朱、張四姓所居。孫氏定江東,靠的不只是刀兵,還有與這四家的和解 —— 陸遜出陸氏,顧雍出顧氏,吳之社稷半在其手。',
    en: 'Seat of Wu commandery, home of the Gu, the Lu, the Zhu and the Zhang. The Sun did not take Jiangdong by arms alone; they came to terms with these four houses. Lu Xun was a Lu and Gu Yong a Gu, and half the state of Wu rested in their hands.',
  },
  danyang: {
    zh: '丹陽山險,民多果勁,好武習戰,高尚氣力 —— 天下精兵之所出。孫策渡江以此為始,諸葛恪招撫山越,亦取兵於此。',
    en: 'The Danyang hills, whose people are hardy and quarrelsome, fond of arms and proud of their strength — the source of the realm\'s best infantry. Sun Ce began his crossing here, and Zhuge Ke drew his levies from the same hills when he pacified the Shanyue.',
  },
  wuxi: {
    zh: '太湖之濱,魚米之鄉。嚴白虎據此為亂,孫策破之。「江東之民,不憂饑饉」—— 吳之能久持,一半是這片水田。',
    en: 'On the shore of Lake Tai, a country of fish and rice. Yan Baihu held it in rebellion and Sun Ce broke him. "The people of Jiangdong do not fear famine" — half of how Wu lasted so long is this paddy land.',
  },
  yuzhang: {
    zh: '贛江之會,江東西門。華歆為太守,孫策至,歆葛巾迎之,策以上賓禮待。名士守郡,守不住城,卻守住了一郡的體面。',
    en: 'Where the Gan waters meet, the western door of Jiangdong. Hua Xin was administrator; when Sun Ce came he went out in a plain kerchief to receive him, and Sun Ce treated him as an honoured guest. A famous scholar could not hold the walls, but he held the commandery\'s dignity.',
  },
  poyang: {
    zh: '彭蠡之澤,周魴詐降之地。魴七箋誘曹休,休疑,魴詣郡門截髮謝罪,休乃信之 —— 石亭之敗,始於這一縷頭髮。',
    en: 'On the Pengli marshes, where Zhou Fang staged his defection. Seven letters drew Cao Xiu on; when he grew suspicious, Zhou Fang went to his own headquarters gate and cut off his hair in penance, and Cao Xiu believed him. The defeat at Shiting began with that lock of hair.',
  },
  luling: {
    zh: '贛南山鄉,山越所居。孫權以此立郡,置縣以撫之。江東之患不在北,而在腹地的山民 —— 吳人平山越,前後數十年。',
    en: 'The hill country of southern Gan, where the Shanyue live. Sun Quan made a commandery of it and set up counties to bring them in. Wu\'s trouble was never only in the north; it was the hill people at its own back, and pacifying them took decades.',
  },
  linhai: {
    zh: '東海之濱,會稽東部。孫權遣衛溫、諸葛直將甲士萬人浮海求夷洲,得數千人還 —— 中國正史所記渡海至台灣之始,出於此。',
    en: 'On the eastern sea, beyond Kuaiji. From here Sun Quan sent Wei Wen and Zhuge Zhi with ten thousand men over the water in search of Yizhou; they came back with a few thousand people. It is the first crossing to Taiwan recorded in the Chinese histories.',
  },
  nanhai: {
    zh: '番禺所在,南海之口。海舶所聚,珠璣、犀象、玳瑁、果布之湊 —— 中國與南洋通商,自漢已然。士燮兄弟據交州四十年,富於一時。',
    en: 'Panyu, at the mouth of the southern sea, where the sea-going ships gather: pearls, rhinoceros horn, ivory, tortoiseshell and spices all come through. China has traded with the south seas since Han times. The Shi brothers held Jiao province for forty years and were rich on it.',
  },
  cangwu: {
    zh: '灕水、鬱水之會,交廣之樞。士燮為交趾太守,其弟士壹領此郡,兄弟並為列郡守,雄長一州,四十餘年疆場無事。',
    en: 'Where the Li and the Yu meet, the hinge between Jiao and Guang. Shi Xie governed Jiaozhi and his brother Shi Yi held this commandery; between them the brothers ran a whole province, and for forty years there was no fighting on its borders.',
  },
  guilin: {
    zh: '秦置桂林郡,靈渠所通。始皇發卒五十萬戍五嶺,鑿渠以通糧道 —— 湘灕相接,中原的船從此可以開到嶺南。',
    en: 'The Guilin commandery of Qin, served by the Magic Canal. The First Emperor sent half a million men to garrison the Five Ridges and cut a canal to carry their grain — with the Xiang joined to the Li, boats from the heartland could reach the far south.',
  },
  hepu: {
    zh: '南海採珠之地。郡不產穀,而海出珠寶,民採珠易米以自給。孟嘗為守,革其宿弊,去珠復還 —— 「合浦還珠」之典出此。',
    en: 'The pearl coast of the southern sea. The commandery grows no grain; its people dive for pearls and trade them for rice. When Meng Chang governed here and cleaned out the old abuses, the pearls were said to have come back — the proverb about the returning pearls of Hepu comes from this place.',
  },
  jiuzhen: {
    zh: '交州之南,今越南中部。漢置九真郡,任延教民耕犁、嫁娶,由是始知田作、姓氏 —— 郡守之政,及於一方之風俗。',
    en: 'South of Jiao province, in what is now central Vietnam. Han set up the Jiuzhen commandery, and Ren Yan taught the people the plough and the marriage rites, so that they came to know tillage and surnames. An administrator\'s policy can reach as far as a region\'s customs.',
  },
  rinan: {
    zh: '帝國之南極,日南郡。「日中無影」,故名。漢桓帝時大秦王安敦遣使自此入貢 —— 羅馬與漢之間唯一的一次直接往來,登陸處便在此地。',
    en: 'Rinan, the southern limit of the empire — "south of the sun," so named because at noon nothing casts a shadow. In Emperor Huan\'s reign an embassy from Andun, king of Da Qin, came in through this coast: the one direct contact between Rome and Han, and it landed here.',
  },
  zhuyai: {
    zh: '海中之洲,朱崖郡。漢武置郡,叛服不常,賈捐之上書請棄之,曰:「駱越之人,父子同川而浴,相習以鼻飲……非冠帶之國,《禹貢》所不及。」元帝從之,遂罷。',
    en: 'An island commandery in the sea. Emperor Wu of Han established it and it revolted and submitted by turns, until Jia Juanzhi memorialised asking that it be given up: "The Luoyue bathe in the same stream, fathers and sons together, and are accustomed to drinking through the nose… This is no land of caps and sashes, and the Tribute of Yu does not reach it." Emperor Yuan agreed, and the commandery was abolished.',
  },

  // ── 北疆與西域 — the frontier ─────────────────────────────────────
  ji: {
    zh: '燕之故都,幽州治所。「風蕭蕭兮易水寒」,荊軻自此西去;燕昭王築黃金台於此以求士,樂毅、鄒衍、劇辛皆至。北方之雄,起於此城。',
    en: 'The old Yan capital, seat of You province. "The wind is bleak, the Yi river cold" — Jing Ke went west from here. King Zhao of Yan raised his Terrace of Gold in this city to attract talent, and Yue Yi, Zou Yan and Ju Xin all came. The power of the north begins here.',
  },
  yuyang: {
    zh: '幽州要郡,安祿山起兵之地。「漁陽鼙鼓動地來,驚破霓裳羽衣曲」—— 白居易一句,寫盡盛唐之終。',
    en: 'A key commandery of You province, where An Lushan rose. "The war drums of Yuyang came shaking the earth, and shattered the Song of Rainbow Skirts" — one line of Bai Juyi\'s contains the whole end of the Tang golden age.',
  },
  'yi-county': {
    zh: '易水之濱,公孫瓚築京於此。樓高十丈,積穀三百萬斛,曰:「食盡此穀,足知天下之事矣。」袁紹穿地道而樓傾,瓚殺妻子而自焚。',
    en: 'On the Yi river, where Gongsun Zan built his fortress: towers a hundred feet high and three million bushels of grain. "By the time this grain is eaten," he said, "the affairs of the realm will have settled themselves." Yuan Shao mined beneath the towers, they came down, and Gongsun Zan killed his family and set fire to the last of them.',
  },
  juyongguan: {
    zh: '軍都陘之口,燕京北門。太行八陘之一,自古為華北平原與塞外之限。得居庸者,可閉關以絕胡騎。',
    en: 'At the mouth of the Juntu defile, the northern gate of the Yan plain. One of the eight passes of the Taihang and the boundary between the north China plain and the steppe. Whoever holds Juyong can shut the road on the nomad horse.',
  },
  yunzhong: {
    zh: '陰山之南,秦漢北疆。趙武靈王北破林胡、樓煩,置雲中、雁門、代郡;其後嘗欲自雲中南襲咸陽 —— 這條路,秦人一直防著。',
    en: 'South of the Yin mountains, on the Qin and Han northern frontier. King Wuling of Zhao broke the Linhu and Loufan here and set up the Yunzhong, Yanmen and Dai commanderies; afterwards he considered coming down on Xianyang from Yunzhong. Qin watched that road ever after.',
  },
  wuyuan: {
    zh: '河套北緣,呂布之鄉。「五原呂布」四字,是他一生武名的起點;而此地在漢為屯田重鎮,匈奴入寇必先犯之。',
    en: 'On the northern rim of the Ordos, Lü Bu\'s home country — "Lü Bu of Wuyuan" is where his name as a fighter starts. In Han times it was a major farming garrison, and any Xiongnu raid struck it first.',
  },
  liaodong: {
    zh: '遼水之東,公孫氏三世之業。度、康、淵祖孫割據五十年,南通孫吳,北撫高麗,自為一國。司馬懿克日而至,屠襄平,京觀而還。',
    en: 'East of the Liao, the inheritance of three generations of the Gongsun. Du, Kang and Yuan held it apart for fifty years, dealing with Wu by sea and managing Koguryo overland, effectively a separate country. Sima Yi came on his own schedule, put Xiangping to the sword, and went home leaving a monument of skulls.',
  },
  xiangping: {
    zh: '遼東治所。公孫淵稱燕王,司馬懿圍之。會霖雨三十餘日,遼水暴漲,運船直至城下;雨霽,起土山地道,城破,男子十五以上七千餘人皆殺之。',
    en: 'The seat of Liaodong. Gongsun Yuan declared himself King of Yan and Sima Yi came against him. Thirty days of rain flooded the Liao so the supply boats came right up to the walls; when it cleared he raised earthworks and drove tunnels, and when the city fell, seven thousand males above fifteen were put to death.',
  },
  liucheng: {
    zh: '柳城,烏桓之都。曹操千里奔襲,出盧龍塞,塹山堙谷五百餘里;白狼山卒與虜遇,張遼為先鋒,斬蹋頓 —— 袁氏最後的奧援,絕於此地。',
    en: 'Liucheng, the Wuhuan seat. Cao Cao came a thousand li by surprise through the Lulong pass, cutting hills and filling ravines for five hundred li; at White Wolf Mountain he met them unexpectedly, sent Zhang Liao in first, and took Tadun\'s head. The last refuge of the Yuan house ended here.',
  },
  wuhuan: {
    zh: '烏桓之地,幽州塞外。其俗貴少賤老,怒則殺父兄而終不害其母 —— 以母有族類,父兄無相仇報故也。漢末烏桓突騎,天下名騎。',
    en: 'The Wuhuan country beyond the You frontier. Their custom honours the young and slights the old; in anger a man may kill his father or brother but never his mother — because the mother has kin who would answer, and a father or brother has none. The Wuhuan shock cavalry of the late Han were famous throughout the realm.',
  },
  lelang: {
    zh: '朝鮮半島西北,漢武所置四郡之一。漢家衣冠、文書、印綬所及之最東 —— 樂浪漆器出土於平壤,銘文猶記蜀郡西工所造。',
    en: 'In the northwest of the Korean peninsula, one of the four commanderies Emperor Wu of Han established. It is the easternmost reach of Han dress, writing and seals: Lelang lacquerware dug up at Pyongyang still bears inscriptions saying it was made in the western workshops of Shu commandery.',
  },
  daifang: {
    zh: '樂浪之南,公孫康所分置。倭人、韓人朝貢,皆由此郡入。魏明帝時,倭女王卑彌呼遣使詣帶方,求詣天子朝獻。',
    en: 'South of Lelang, split off by Gongsun Kang. Tribute from the Wa and the Han peoples came in through this commandery; in Emperor Ming\'s reign Himiko, queen of the Wa, sent envoys to Daifang asking to present tribute at court.',
  },
  zhangye: {
    zh: '河西四郡之一,「張國臂掖,以通西域」。焉支山下水草豐美,匈奴歌曰:「亡我祁連山,使我六畜不蕃息;失我焉支山,使我婦女無顏色。」',
    en: 'One of the four Hexi commanderies — "the arm stretched out to open the road to the Western Regions." The pastures below the Yanzhi hills are rich, and the Xiongnu sang: "They have taken our Qilian mountains, and our herds no longer breed; they have taken our Yanzhi hills, and our women have no colour in their faces."',
  },
  jiuquan: {
    zh: '酒泉之名,以城下有泉,其水若酒。霍去病破匈奴至此,以御酒傾於泉中,與將士共飲 —— 一壺酒,分與三軍。',
    en: 'Named for the spring below the walls, whose water is said to taste of wine. Huo Qubing came this far breaking the Xiongnu and poured the wine the emperor had sent him into the spring so that the whole army could drink with him — one flask, shared out among three armies.',
  },
  dunhuang: {
    zh: '河西盡處,西域門戶。出玉門、陽關則入流沙。「勸君更盡一杯酒,西出陽關無故人」—— 中原送行的最後一站,在這裡。',
    en: 'The end of the Hexi corridor and the gate to the Western Regions; beyond the Jade Gate and the Yang Pass lies the shifting sand. "Drink one more cup of wine with me, my friend — west of the Yang Pass there is no one you know." This is where the heartland says goodbye.',
  },

  // ── 南中 — the deep south of Shu ──────────────────────────────────
  nanzhong: {
    zh: '南中四郡之總稱,蜀之腹背。諸葛亮南征,馬謖獻策:「攻心為上,攻城為下;心戰為上,兵戰為下。」故七擒孟獲而縱之,終亮之世,南方不敢復反。',
    en: 'The collective name for the four southern commanderies, at Shu\'s back. On the southern campaign Ma Su advised: "Taking the heart is highest and taking the walls lowest; fighting with the mind is highest and fighting with soldiers lowest." So Meng Huo was taken seven times and released, and to the end of Zhuge Liang\'s life the south did not rise again.',
  },
  jianning: {
    zh: '味縣所在,南中大姓雍闓據此叛。呂凱守永昌,答闓書曰:「天降喪亂,姦雄乘釁……」辭義正切,闓不能屈。',
    en: 'Around Wei county, where the great southern clansman Yong Kai raised his revolt. Lü Kai, holding Yongchang, wrote back to him: "Heaven has sent down disorder and the ambitious have taken their chance…" The letter was so plainly and rightly argued that Yong Kai could not answer it.',
  },
  yuexi: {
    zh: '邛都之地,西南夷所居。高定元據此反,諸葛亮南征三路並進,自率一軍由此入 —— 南中之役,不在一戰而在收心。',
    en: 'The Qiongdu country, home of the southwestern tribes. Gao Ding held it in revolt; Zhuge Liang came south on three roads and took this one himself. The southern campaign turned not on any battle but on winning the people over.',
  },
  yunnan: {
    zh: '滇池之畔,莊蹻王滇之地。漢武開西南夷,置益州郡;蜀漢改置雲南郡 —— 「雲南」二字為郡名,自此始。',
    en: 'Beside Lake Dian, where Zhuang Qiao once made himself king. Emperor Wu of Han opened the southwest and set up the Yizhou commandery; Shu renamed it Yunnan — and that is where the name of the province begins.',
  },
  yongchang: {
    zh: '南中最遠之郡,通身毒之道所出。雍闓叛而永昌獨不從,呂凱、王伉率吏民閉境拒守,道路斷絕數年,終不降 —— 亮至,嘉之,以凱為雲南太守。',
    en: 'The remotest of the southern commanderies, on the road that leads towards India. When Yong Kai revolted, Yongchang alone did not join him: Lü Kai and Wang Kang closed the borders and held out with their own officials and people, cut off for years, and never surrendered. When Zhuge Liang arrived he commended them and made Lü Kai administrator of Yunnan.',
  },
  qianwei: {
    zh: '岷江下游,蜀之富郡。井鹽之利甲於西南,漢時已鑿深井取鹵,煮之成鹽 —— 蜀漢之能以一州抗天下,鹽鐵之利居其半。',
    en: 'On the lower Min, a rich commandery of Shu. Its brine wells had no equal in the southwest; by Han times they were sinking deep shafts for brine and boiling it down. That Shu could fight the realm from one province is half explained by its salt and iron.',
  },
  liyang: {
    zh: '黃河北岸渡口,袁曹相持之地。紹軍屯此,操軍屯官渡,隔河而望。渡口之爭,常決於誰先斷了對方的糧。',
    en: 'A ford on the north bank of the Yellow River, where Yuan Shao and Cao Cao faced each other — the Yuan army here, the Cao army at Guandu, watching across the water. Contests over fords are usually decided by whichever side cuts the other\'s grain first.',
  },
};

/** Lookup a city's gazetteer note, or null if it carries none. */
export function cityLore(cityId: string): CityLore | null {
  return CITY_LORE[cityId] ?? null;
}
