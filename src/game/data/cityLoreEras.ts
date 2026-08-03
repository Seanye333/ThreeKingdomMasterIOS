/**
 * 分代風物志 — the gazetteer note a city gets on a NON-Three-Kingdoms board.
 *
 * `cityLore.ts` is written for the Three Kingdoms, and says so in every line:
 * 長安 talks about 李傕郭汜, 許昌 about 曹操挾天子. Show that on 「戰國·長平之戰」
 * and the city panel is quoting events four hundred years in the future
 * (2026-08-01 目視巡檢當場看到:玩秦國的長安,風物志在講李傕郭汜之亂)。
 *
 * So a cross-era board reads THIS table instead, keyed by era. A city with no
 * entry for the running era shows **nothing** — silence is correct, an
 * anachronism is not. `cityLoreEras.test.ts` enforces exactly that: it fails
 * if the accessor ever falls back to the Three-Kingdoms text off-era.
 *
 * ## 填法
 *
 * 這張表**刻意不求一次填滿** —— 128 城 × 3 代是內容工作,不是程式工作,而且該
 * 跟著戰役一個一個做(打到哪個盤就把那盤的城寫齊)。目前先寫各代真正在盤上
 * 當都城/戰地的城:玩家最先看到的就是它們。
 */
import type { CityLore } from './cityLore';

export type LoreEra = 'warring-states' | 'chu-han' | 'sui-tang';

/** 劇本 id → 該用哪一代的風物志(三國/假想盤回傳 null,照舊用 cityLore)。 */
export function loreEraFor(scenarioId: string | null | undefined): LoreEra | null {
  if (!scenarioId) return null;
  if (scenarioId.startsWith('scn-ws-')) return 'warring-states';
  if (scenarioId.startsWith('scn-ch-')) return 'chu-han';
  if (scenarioId.startsWith('scn-st-')) return 'sui-tang';
  return null;
}

const WARRING_STATES: Record<string, CityLore> = {
  changan: {
    zh: '秦之咸陽,渭水北岸。孝公用商君,徙木立信,廢井田、開阡陌,秦人畏法如畏天。函谷以西,耕戰之國 —— 山東六國謂之虎狼。',
    en: "Qin's Xianyang on the north bank of the Wei. Duke Xiao took Shang Yang, who moved a pole to prove his word, broke the well-fields and opened the furrows until Qin feared the law as it feared heaven. West of Hangu lies a realm of plough and war — the six eastern states call it the tiger-wolf.",
  },
  jiangling: {
    zh: '楚之郢都,江漢之會。方城以為城,漢水以為池,帶甲百萬,粟支十年。屈子行吟澤畔,而郢終為白起所拔 —— 楚雖三戶,亡秦必楚。',
    en: "Ying, capital of Chu, where the Yangtze meets the Han. Its wall is the Fangcheng range, its moat the Han river; a million in armour, grain for ten years. Qu Yuan wandered these marshes chanting — and Ying fell at last to Bai Qi. Though but three clans remain, it will be Chu that ends Qin.",
  },
  linzi: {
    zh: '齊之臨淄,七萬戶,揮汗成雨。稷下學宮聚天下之士,淳于髡、鄒衍、荀卿論辯其間 —— 富甲東方,而燕人樂毅一舉下七十餘城。',
    en: "Linzi of Qi, seventy thousand households, their sweat falling as rain. The Jixia Academy gathers the empire's minds — Chunyu Kun, Zou Yan, Xun Qing arguing beneath its eaves. Richest city of the east, and yet Yue Yi of Yan took seventy of Qi's cities in a season.",
  },
  ji: {
    zh: '燕之薊城,北臨大漠,南接齊趙。昭王築黃金臺以招賢,郭隗為之先 —— 樂毅自魏來,劇辛自趙來,弱燕遂能報齊之仇。',
    en: "Ji of Yan, the desert at its back, Qi and Zhao before it. King Zhao raised the Terrace of Gold to summon talent, beginning with Guo Wei — then Yue Yi came from Wei and Ju Xin from Zhao, and weak Yan took its revenge on Qi.",
  },
  ye: {
    zh: '趙之邯鄲,漳滏之間。武靈王胡服騎射,北破林胡,趙騎甲於天下。廉頗、李牧為之守,而長平一敗,四十萬眾坑於秦。',
    en: "Handan of Zhao, between the Zhang and the Fu. King Wuling put his men in nomad coats and taught them to shoot from the saddle; Zhao's horse became the finest under heaven. Lian Po and Li Mu held it — but after Changping, four hundred thousand were buried by Qin.",
  },
  chenliu: {
    zh: '魏之大梁,鴻溝所經。惠王徙都於此,築長城、鑿運河,擅天下之利。然桂陵、馬陵兩敗於齊,龐涓死而魏霸業衰。',
    en: "Daliang of Wei, on the Hong canal. King Hui moved his capital here, walled it and cut waterways, and held the richest crossroads under heaven — until Guiling and Maling broke his armies, Pang Juan died, and Wei's hegemony went with him.",
  },
  xuchang: {
    zh: '韓之新鄭,居天下之中,四面受敵。申不害為相,修術行道,國治兵強十五年 —— 然韓地最狹,強弩勁弓之外,無險可恃。',
    en: "Xinzheng of Han, at the very centre of the realm and exposed on every side. Shen Buhai served as chancellor and by his statecraft kept it ordered and strong for fifteen years — but Han's land is the narrowest, and beyond its famous crossbows it has no barrier to trust.",
  },
  taiyuan: {
    zh: '趙之晉陽,汾水之上,表裡山河。智伯決水灌之,城不浸者三版,而襄子卒破三家之圍 —— 趙氏之興,實始於此。',
    en: "Jinyang of Zhao on the Fen, mountains and rivers for its coat. Zhi Bo turned the river upon it until only three courses of wall stood dry, yet Viscount Xiang broke the siege of the three houses — the rise of Zhao truly began here.",
  },
  shouchun: {
    zh: '楚之壽春。郢破之後,楚室東遷於此,以淮為屏。春申君治之,門下食客三千,而王室已成強弩之末。',
    en: "Shouchun of Chu. After Ying fell the court moved east to here and made the Huai its shield. The Lord of Chunshen governed it with three thousand retainers at his gate — but the royal house was by then an arrow at the end of its flight.",
  },
  langya: {
    zh: '齊之琅邪,東臨滄海。齊人善漁鹽之利,方士言海上有三神山 —— 後始皇東巡,五至琅邪,遣徐福入海求仙。',
    en: "Langya of Qi, facing the open sea. Its people grow rich on fish and salt, and its magicians speak of three holy mountains out on the water — in time the First Emperor would come here five times, and send Xu Fu out to sea after the immortals.",
  },
  beihai: {
    zh: '齊之即墨。樂毅下齊七十餘城,唯莒與即墨不下。田單守之,收城中千餘牛,披赤繒、束兵刃於角,夜縱火牛而出 —— 一戰復齊。',
    en: "Jimo of Qi. Yue Yi took seventy cities and more; only Ju and Jimo held. Tian Dan defended it, gathered a thousand oxen, dressed them in crimson silk and bound blades to their horns, and loosed them by night with their tails alight — and in one stroke Qi was restored.",
  },
};

const CHU_HAN: Record<string, CityLore> = {
  changan: {
    zh: '秦之咸陽,已為沛公所入。約法三章,秋毫無犯,而項王繼至,火三月不滅 —— 後高祖都長安,蕭何治之,關中遂為漢家根本。',
    en: "Xianyang of Qin, entered first by the Duke of Pei, who bound the people with three articles of law and touched nothing. Then the King of Chu came, and the fires burned three months. Later Gaozu made Chang'an his capital and Xiao He governed it — Guanzhong became the root of Han.",
  },
  pengcheng: {
    zh: '西楚霸王之都。項王既分天下,自王梁楚九郡,都彭城。漢王乘虛襲之,五十六萬眾入城 —— 項王以三萬騎晨擊,漢卒睢水為之不流。',
    en: "Capital of the Hegemon-King of Western Chu. Having carved the realm, Xiang Yu took nine commanderies for himself and ruled from Pengcheng. The King of Han seized it with five hundred and sixty thousand men — and Xiang Yu came at dawn with thirty thousand horse, until the Sui river could not flow for the Han dead.",
  },
  hanzhong: {
    zh: '漢王受封之地,巴蜀漢中。棧道既燒,示天下無還心;而韓信明修棧道、暗度陳倉,一舉還定三秦 —— 漢之興,自此始。',
    en: "The fief the King of Han was given: Ba, Shu and Hanzhong. He burned the plank roads behind him to show he would not return — then Han Xin repaired them in plain sight while crossing at Chencang in secret, and the Three Qins fell in a single stroke. Here Han began.",
  },
  jianye: {
    zh: '會稽郡治,項氏起兵之所。項梁、項籍避仇於此,聞陳勝之事,遂殺郡守而舉江東子弟八千人渡江西向。',
    en: "Seat of Kuaiji commandery, where the Xiang rose. Xiang Liang and Xiang Ji hid here from a blood feud; when word of Chen Sheng came they cut down the governor and led eight thousand sons of Jiangdong across the river and west.",
  },
  runan: {
    zh: '陳郡之地。陳勝、吳廣起於大澤鄉,入陳而稱王,國號張楚 —— 雖六月而敗,然天下之亡秦,自此始。',
    en: "The land of Chen commandery. Chen Sheng and Wu Guang rose at Daze village, entered Chen and took the kingly title, naming their state Zhang Chu. Six months and it was broken — yet the fall of Qin began here.",
  },
  ye: {
    zh: '趙地邯鄲。井陘之戰,韓信背水列陣,趙軍笑之;而奇兵二千拔趙幟、立赤幟,趙眾大潰 —— 兵法所謂置之死地而後生。',
    en: "Handan in the land of Zhao. At Jingxing, Han Xin drew up his line with the river at his back and Zhao laughed at him — then two thousand picked riders pulled down Zhao's banners and raised the red, and Zhao broke. This is what the art of war means by placing men where they cannot retreat.",
  },
  linzi: {
    zh: '齊都臨淄。酈食其說下齊七十餘城,而韓信乘其無備襲之 —— 齊王烹酈生,東走高密,遂有濰水之戰。',
    en: "Linzi, capital of Qi. Li Yiji talked seventy cities into surrender — and Han Xin struck them while they stood unguarded. The King of Qi boiled Li alive, fled east to Gaomi, and the battle of the Wei river followed.",
  },
  shouchun: {
    zh: '淮南之地。垓下既破,項王東走,至陰陵迷道,田父紿之左 —— 左則陷大澤,漢騎及之。天亡我,非戰之罪也。',
    en: "The land of Huainan. After Gaixia the Hegemon rode east, lost his way at Yinling, and a farmer told him to go left — left was the marsh, and the Han horse came up. 'Heaven destroys me; it is no fault of my arms.'",
  },
  puyang: {
    zh: '定陶之野。項梁破秦軍於東阿、濮陽,益輕秦,而章邯夜銜枚擊之 —— 梁死定陶,楚軍為之奪氣。',
    en: "The plain of Dingtao. Xiang Liang beat the Qin armies at Dong'e and Puyang and came to hold Qin cheap — then Zhang Han came by night with bits in his men's mouths. Xiang Liang died at Dingtao, and the heart went out of the Chu army.",
  },
};

const SUI_TANG: Record<string, CityLore> = {
  changan: {
    zh: '大興城,隋之新都,宇文愷所營,坊市棋布,天下之壯麗無過於此。李淵自太原入關,據之而有天下之基 —— 唐之社稷,實立於此城。',
    en: "Daxing, the Sui's new capital, laid out by Yuwen Kai in a chequerboard of wards and markets — nothing under heaven is grander. Li Yuan came through the passes from Taiyuan and took it, and with it the foundation of an empire. Here the altars of Tang were raised.",
  },
  luoyang: {
    zh: '東都洛陽。煬帝營之,徙天下富商數萬家實其中,運河四達。王世充挾越王侗據此,而李密之瓦崗軍臨於城下 —— 洛口之倉,天下所爭。',
    en: "Luoyang, the eastern capital. Emperor Yang built it and moved tens of thousands of merchant houses into it, canals running out in all directions. Wang Shichong holds it with the boy Prince of Yue in his keeping, while Li Mi's Wagang army stands at the walls — the granaries of Luokou are what all the realm is fighting over.",
  },
  ye: {
    zh: '河北之地,竇建德所有。夏王起於漳南,務農息兵,得眾心 —— 河北之民多歸之。虎牢一戰而擒,河北遂空。',
    en: "The Hebei plain, held by Dou Jiande. The King of Xia rose at Zhangnan, put his men to the plough and won the people's hearts, and Hebei came over to him in numbers. One battle at Hulao took him prisoner, and Hebei stood empty.",
  },
  tianshui: {
    zh: '隴右之地,薛舉父子據之。西秦霸王驍勇善騎,淺水原一戰破秦王於高墌 —— 然舉暴卒,仁杲繼之而降,隴右遂入於唐。',
    en: "The Long uplands, held by Xue Ju and his son. The Hegemon-King of Western Qin was a fierce horseman and broke the Prince of Qin at Gaozhi on the Qianshui plain — then Xue Ju died suddenly, his son Rengao surrendered, and the Long country passed to Tang.",
  },
  beiping: {
    zh: '馬邑之北,劉武周所據。恃突厥而稱帝,遣宋金剛南下,并州震動 —— 秦王堅壁柏壁,待其糧盡,一鼓而追奔數百里。',
    en: "North of Mayi, held by Liu Wuzhou, who took the imperial title under Turkic patronage and sent Song Jin'gang south until Bingzhou shook. The Prince of Qin dug in at Bobi and waited for their grain to run out — then struck once and pursued for hundreds of li.",
  },
  puyang: {
    zh: '瓦崗之地。翟讓聚眾於此,李密繼之,破洛口倉而恣民就食 —— 一時眾至數十萬,單雄信、程咬金、秦叔寶皆在其麾下。',
    en: "The Wagang country. Zhai Rang gathered his band here and Li Mi took it over, broke open the Luokou granary and let the people eat their fill — hundreds of thousands came, and Shan Xiongxin, Cheng Yaojin and Qin Shubao all rode under his banner.",
  },
  shouchun: {
    zh: '江淮之間,杜伏威所有。以輔公祏為副,擁兵數萬,南破李子通,遂有江淮 —— 後入朝而輔公祏叛,江南復亂。',
    en: "The land between the Yangtze and the Huai, held by Du Fuwei with Fu Gongshi as his second and tens of thousands under arms. He broke Li Zitong in the south and took the Huai country — later he went to court, Fu Gongshi rebelled, and the south fell into war again.",
  },
};


/**
 * 漢末風物志的年限閘 —— 詞 → 該事最早成立的年份。
 *
 * `cityLore.ts` 寫的是「事後視角」:鄴講銅雀臺(210)、永安講白帝托孤(223)。
 * 一座城的三國文本裡若出現這些詞,就表示它要到那一年才說得通;盤面年份未到,
 * 該城改用下面的 LATE_HAN。這樣不必替 128 城逐一標年份,而且**日後新增的
 * 風物志一旦帶進劇透,測試會先紅**(見 cityLoreEras.test.ts)。
 *
 * 只收**事件與人物**,不收地名 —— 赤壁、街亭、陳倉、合肥、南中在 184 年
 * 都已經是地名了,拿地名當標記會把該城自己的名字掃成劇透(初版就用「南中」
 * 掃中了九真的「今越南中部」)。地名靠 LORE_GATE_OVERRIDES 具名處理。
 */
export const POST_184_MARKERS: Record<string, number> = {
  銅雀: 210, 金鳳: 210, 冰井: 210, 赤壁之戰: 208, 官渡: 200, 挾天子: 196,
  許下: 196, 托孤: 223, 蜀漢: 221, 昭烈: 221, 季漢: 221,
  孫吳: 222, 東吳: 222, 鼎足: 222, 三分: 222, 五丈原: 234, 七擒: 225,
  諸葛亮: 207, 孔明: 207, 臥龍: 207, 隆中: 207, 三顧: 207,
  司馬懿: 208, 仲達: 208, 周瑜: 198, 公瑾: 198, 陸遜: 219, 姜維: 228,
  鄧艾: 263, 鍾會: 263, 李傕: 192, 郭汜: 192, 魏武: 220, 黃初: 220,
  受禪: 220, 九品: 220, 建安: 196, 麥城: 219, 水淹七軍: 219, 定軍山: 219,
  漢中王: 219, 白門樓: 198, 逍遙津: 215, 馬超: 211, 孫策: 195, 小霸王: 195,
  伯符: 195, 矯詔: 190, 討董: 190, 呂蒙: 219, 甘寧: 208, 太史慈: 195,
  魯肅: 200, 龐統: 213, 法正: 214, 黃忠: 219, 白馬義從: 191, 文醜: 200,
  雍闓: 225, 呂凱: 225,
  // 第二輪:初版只收了最顯眼的幾個,漏掉「魏之宗室」「孫權築塢」「趙雲為太守」
  // 這一類 —— 靠人看名單是看不齊的,要按城逐一翻舊文才補得出來。
  典韋: 197, 陳宮: 194, 馬騰: 187, 三讓徐州: 194, 轅門射戟: 196, 士燮: 187,
  烏巢: 200, 潘璋: 219, 顏良: 200, 李世民: 620, 三英戰呂布: 190, 濡須塢: 213,
  孫皓: 264, 高幹: 206, 苦寒行: 206, 號召關東: 190, 袁氏兄弟: 205,
  魏之宗室: 220, 張繡: 197, 趙範: 209, 嚴顏: 214, 先主: 223, 劉封: 219,
  孟達: 219, 孫權: 195, 于禁: 219, 沙摩柯: 222, 平原相: 191, 劉備: 190,
  襲兗州: 194, 宮闕成墟: 190, 銅駝荊棘: 190, 僭號: 197, 陸抗: 272, 步闡: 272,
  周魴: 228, 蹋頓: 207, 卑彌呼: 238, 張松: 211, 李白: 750, 陸游: 1160,
};

/**
 * 標記詞掃不出來、但確實是後世事的城 —— 每條都要寫理由。
 * 值是「三國文本最早何時說得通」,9999 表示那段文字永遠不該出現在盤上。
 */
export const LORE_GATE_OVERRIDES: Record<string, number> = {
  changban: 208,  // 長阪之戰,文中無可標的專名(「當陽」184 年已是縣名)
  jiuzhen: 9999,  // 舊文用「今越南中部」作註 —— 那不是年代問題,是現代地名
  lelang: 9999,   // 舊文引「樂浪漆器出土於平壤」,是現代考古的視角
  mei: 192,       // 董卓築郿塢
  'yi-county': 193, // 公孫瓚築易京
  wuyuan: 190,    // 「五原呂布」之名要到他隨丁原入洛才響
};

/**
 * 漢末(184 前後)的風物志 —— `cityLore.ts` 是「事後視角」的方志:鄴講銅雀臺
 * (210)、陳留講矯詔討董(190)、永安講白帝托孤(223)。放在最早的盤上,城池
 * 面板就是在替玩家劇透四十年後的事(2026-08-02 試玩,黃巾開局點開鄴即見)。
 *
 * 這張表寫的是同一座城在 184 年該有的樣子:地理照舊,而人事只到靈帝為止。
 * 選用時機由 `cityLore()` 依**盤面年份**決定,見該檔的年限閘。
 */
const LATE_HAN: Record<string, CityLore> = {
  changan: {
    zh: '前漢之舊都,秦川八百里沃野在其外,漢家陵闕列於渭北。光武東遷之後,此為西京,置京兆尹守之。四塞為固,金城千里 —— 帝王之資猶在,只是宮闕漸蕪,行人指點而已。',
    en: "Old capital of the Former Han: the eight hundred li of the Qin plain beyond its walls, the tomb-towers of the Han ranged along the north bank of the Wei. Since Guangwu moved the court east it has been the Western Capital under an Intendant. Ringed by passes, walled a thousand li — the making of an empire is still here; only the palaces grow weedy, and travellers merely point them out.",
  },
  xuchang: {
    zh: '潁川之許縣,水土沃衍,宜稻宜麥。潁川多名士 —— 荀氏八龍、陳寔父子、鍾氏世習法律,一郡之中,冠蓋相望。黃巾初起,潁川首當其衝,波才之眾數萬,郡兵不能當。',
    en: "Xu county in Yingchuan, its soil deep and kind to rice and wheat alike. Yingchuan breeds men of name — the eight dragons of the Xun, Chen Shi and his sons, the Zhong house that has read law for generations — and caps of office look across at one another the length of the commandery. When the Turbans rose, Yingchuan took the first blow: Bo Cai's tens of thousands, and the commandery troops could not stand.",
  },
  ye: {
    zh: '魏郡治所,漳水之陽。西門豹為令,投巫於河而鑿十二渠,漳水遂為鄴田之利,至今賴之。冀州戶口天下最盛 —— 而太平道之根亦在此州,三十六方,大方萬餘人。',
    en: "Seat of Wei commandery, north of the Zhang. Ximen Bao governed here, threw the sorcerers in the river and cut twelve canals, and the Zhang has watered Ye's fields ever since. Ji province carries more households than any under heaven — and the Way of Great Peace struck its root in this same soil: thirty-six divisions, the great ones ten thousand strong.",
  },
  chengdu: {
    zh: '天府之國,沃野千里,水旱從人。李冰鑿離堆而穿二江,岷水馴而兩川熟;文翁立學於市中,蜀人始知向學,子弟爭遊京師。錦官在城南,蜀錦之名,天下無兩。',
    en: "The Land of Heavenly Storehouses: a thousand li of fertile field where flood and drought bend to human will. Li Bing cut the Separated Hill and split the river in two, taming the Min until both plains ripened; Wen Weng raised a school in the market, and from that day the men of Shu took to letters and their sons went up to the capital to study. South of the wall stands the Brocade Office — no silk under heaven matches Shu's.",
  },
  jianye: {
    zh: '丹陽之秣陵,鍾山盤紆,大江繞其北。楚威王埋金以鎮王氣,故曰金陵;秦皇東巡,鑿方山、斷長隴以泄之,乃改名秣陵。山川如此,而猶是江南一縣,吏民不過數千戶。',
    en: "Moling in Danyang, where Bell Mountain coils and the great river runs past its north. King Wei of Chu is said to have buried gold here to press down the king-aura, whence the name Jinling; the First Emperor, passing east, cut through Fangshan and broke the long ridge to let it out, and renamed the place Moling. Such mountains, such a river — and still only a county of the south, a few thousand households on its rolls.",
  },
  xiangyang: {
    zh: '漢水之津,南北喉襟。隔水而北即樊城,南通江陵,西接房陵 —— 商旅之舟自峴山下轉輸,終歲不絕。習、龐、蔡、黃諸族聚居其間,荊襄士族,根柢已深。',
    en: "A ford on the Han and the throat between north and south. Fan lies across the water, Jiangling opens southward, Fangling to the west — the merchant boats turning below Xian Hill never stop the year round. The Xi, Pang, Cai and Huang live thick along this reach; the great houses of Jing have struck deep root here.",
  },
  jiangling: {
    zh: '南郡治所,大江所經。楚之郢都在其北十里,春秋以來為南方都會,舟車輻輳,魚鹽竹木之利甲於江漢。城中積穀足支數載 —— 得江陵者,制荊楚之腹心。',
    en: "Seat of Nan commandery, on the great river. Ying, the Chu capital, stood ten li north of it; since the Spring and Autumn it has been the metropolis of the south, where boats and carts converge and the profit of fish, salt, bamboo and timber outdoes the whole Han valley. Its granaries hold years of grain — hold Jiangling and you hold the belly of Chu.",
  },
  xiapi: {
    zh: '泗、沂之交,徐州要害。圯上老人授書於張子房,即此橋也。城凡三重,溝塹深廣,引水為固;南通廣陵,北接東海 —— 淮泗之間,無踰此者。',
    en: "Where the Si meets the Yi, the key of Xu province. It was on the causeway bridge here that the old man gave Zhang Liang his book. Three rings of wall, ditches broad and deep with water standing in them; southward it opens to Guangling, northward to Donghai — nothing between the Huai and the Si can match it.",
  },
  hefei: {
    zh: '九江之地,施水、肥水交會,南控巢湖,北望淮壖。舟自淮入肥,自肥入江,轉輸之利盡在一縣 —— 故雖僻在江淮之間,而商賈輻輳,倉廩常盈。',
    en: "Jiujiang country, where the Shi and the Fei meet, Lake Chao beneath it and the Huai marshes beyond. Boats come out of the Huai into the Fei and out of the Fei into the Yangtze, and the whole profit of that portage rests on one county — so for all that it sits lonely between the rivers, merchants crowd in and the granaries are seldom empty.",
  },
  hanzhong: {
    zh: '秦蜀之咽喉,褒斜、儻駱、子午諸道通焉。高祖王漢中而後定三秦,漢之名實始於此。今巴漢之間,五斗米道盛行,師君以鬼道教民,病者出米五斗以自贖 —— 郡縣不能禁。',
    en: "The throat between Qin and Shu, threaded by the Baoxie, Tangluo and Ziwu roads. Here the Founder was made King of Han, and from here he took the three Qins; the dynasty's very name begins in this valley. Between Ba and Han the Way of Five Pecks now spreads — its masters teach by spirit-craft and the sick pay five pecks of rice to redeem themselves. The commandery cannot stop it.",
  },
  chenliu: {
    zh: '兗州要邑,通衢所會,當汴、濟之衝,自大梁以來為天下之市。郡人蔡伯喈博學工書,正定六經文字,刻石於太學門外,觀視摹寫者車乘日千餘輛。',
    en: "A chief town of Yan province where the highroads meet, commanding the Bian and the Ji, a market for the realm since the days of Daliang. Its native son Cai Yong, learned and a master of the brush, fixed the text of the Six Classics and had it cut in stone outside the Imperial Academy — a thousand carriages a day came to look and to copy.",
  },
  beihai: {
    zh: '青州名郡,濱海多鹽。高密鄭康成杜門注經,遍注群經而弟子逾千,學者自遠方負笈而至 —— 齊魯之學,至此而集。然青州黃巾亦最盛,眾號百萬,郡縣望風而潰。',
    en: "A famed commandery of Qing province, salt-rich along the sea. At Gaomi, Zheng Xuan has shut his gate to gloss the classics — he has annotated them all, and a thousand students have come with their book-boxes from far provinces; the learning of Qi and Lu is gathered up in him. Yet the Turbans are thickest in Qing too, said to be a million strong, and the counties fall at the rumour of them.",
  },
  chaisang: {
    zh: '豫章之柴桑,大江與彭蠡之會。廬山北峙,雲氣常滿,山中多隱者、多方士。江路自此上通荊楚、下達吳會,漁鹽之舟蔽川而下。',
    en: "Chaisang of Yuzhang, where the great river meets Lake Pengli. Mount Lu stands to the north with cloud always on it, and the mountain is full of hermits and men of arts. From here the river road runs up to Chu and down to Wu, and the fishing and salt boats go down in numbers that hide the water.",
  },
  jiangxia: {
    zh: '漢水入江之口,荊州東門。雲夢之澤在其北,魚鱉蒲葦之饒,居民多以舟為業。江面於此驟闊,風濤易作,舟人未明不敢發 —— 控此則上下之路皆在掌中。',
    en: "Where the Han pours into the Yangtze, the eastern gate of Jing province. The Yunmeng marshes lie north of it, rich in fish and turtle, reed and rush, and most of its people live by boat. The river widens all at once here and the wind gets up easily; boatmen will not put out before daylight. Hold this and both the up-river and the down-river roads lie in your hand.",
  },
  tianshui: {
    zh: '隴右要衝,渭水上游,今名漢陽。土宜畜牧,涼州之馬多出於此。羌胡與漢民錯居,自安帝以來羌亂數十年不絕,郡治屢徙,城邑多空 —— 邊人習戰,勝於中州。',
    en: "The key of the Long uplands on the upper Wei, called Hanyang in these years. The soil suits herds, and much of Liang province's horseflesh comes from here. Qiang and Han live mixed together; since Emperor An the Qiang wars have run on for decades without a break, the commandery seat has moved more than once, and many walled towns stand empty. The border men know war better than the men of the central provinces.",
  },
  nanpi: {
    zh: '渤海郡治,清河之濱。負海帶河,魚鹽之利與冀州之粟並行。郡當幽、冀之交,南北往來必經,戶口殷實,號為大郡。',
    en: "Seat of Bohai commandery, on the Qing. The sea at its back and the river at its belt, it lives by fish and salt as much as by Ji province's grain. It lies where You and Ji meet, on the road every traveller between north and south must take; its households are many and it is counted among the great commanderies.",
  },
  changsha: {
    zh: '湘水之濱,荊南重鎮,魚稻之鄉。賈生謫為長沙王太傅,渡湘而弔屈子,遂有《鵩鳥》之作。郡土卑濕,中州人視為遠謫之地,而其民樸勁,山谷之間多不服王化者。',
    en: "On the Xiang, chief seat of southern Jing, a country of fish and rice. Jia Yi was banished here as Grand Tutor to its king, crossed the Xiang to mourn Qu Yuan, and wrote his 'Owl' upon it. The land is low and damp and men of the central provinces think it a place of exile — but its people are plain and tough, and in the valleys there are many who have never bowed to the court.",
  },
  beiping: {
    zh: '幽燕苦寒之地,右北平也。飛將軍李廣守此,匈奴號曰漢之飛將軍,避之數歲不敢入。今北有烏桓、鮮卑,歲歲寇邊,郡兵不足,恃邊民之騎射以自守。',
    en: "The cold country of You and Yan — Youbeiping. Li Guang held it, and the Xiongnu called him the Flying General of Han and for years would not come near. Now the Wuhuan and the Xianbei are to the north and raid every season; the commandery troops are too few, and it is the borderers' own bows and horses that keep the line.",
  },
  guangling: {
    zh: '江淮之交,廣陵潮壯,天下奇觀。吳王夫差鑿邗溝以通江淮,漕運之利,至今賴之。枚乘作《七發》,言觀濤於廣陵之曲江 —— 士人至此,必一觀而後去。',
    en: "Where the Yangtze meets the Huai, and the Guangling bore runs — one of the sights of the world. King Fuchai of Wu cut the Han canal to join the two rivers, and the grain barges profit by it still. Mei Sheng wrote his 'Seven Stimuli' on watching the tide at the river's bend here; no man of letters passes through without going to see it once.",
  },
  wuling: {
    zh: '沅、澧之地,五溪蠻所居,山深林密,瘴癘之鄉。蠻夷椎髻跣足,射獵為生,不供租賦;郡縣以羈縻處之,叛服無常 —— 每有征討,兵未接而病者已半。',
    en: "The country of the Yuan and the Li, home of the Five Streams tribes: deep hills, thick forest, fever in the air. The tribesmen knot their hair and go barefoot, live by the hunt and pay no tax; the commandery holds them on a loose rein and they submit or rebel by turns. Whenever a punitive column goes in, half of it is sick before it fights.",
  },
  lujiang: {
    zh: '皖城形勝,大江之北,大別山南。淮南、江東之間,惟此一郡當其衝。境內多銅,漢初吳王濞即以豫章、廬江之銅鑄錢,富埒天子 —— 山澤之利,自古為爭。',
    en: "Wan and its good ground, north of the great river and south of the Dabie hills. Between Huainan and the Southland only this one commandery stands in the way. There is copper in its hills: at the dynasty's beginning the King of Wu minted from the copper of Yuzhang and Lujiang until he was as rich as the Son of Heaven. The profit of mountain and marsh has been fought over ever since.",
  },
  xincheng: {
    zh: '房陵、上庸之間,山峻水險,漢水穿其中。秦徙不軌之臣於房陵,故其地多遷客之裔。四塞而少田,自守則有餘,出爭則不足 —— 郡縣之令,常止於谷口。',
    en: "The country between Fangling and Shangyong: sheer hills, dangerous water, the Han river threading through. Qin used to banish its untrustworthy ministers to Fangling, and many here descend from exiles. Walled about by mountains and short of fields, it has enough to hold itself and never enough to march out — the writ of the magistrates usually stops at the mouth of the valleys.",
  },
  chibi: {
    zh: '大江南岸,絕壁臨流,石色赭赤,故以名之。上下數十里皆蘆葦沙洲,舟行至此,江面斗折,風向屢變 —— 漁樵而外,無人問津。',
    en: "A cliff on the south bank of the great river, its rock a rusty red, and named for the colour. For tens of li above and below there is nothing but reed-beds and sandbars; the river bends sharply here and the wind shifts without warning. Beyond fishermen and woodcutters, nobody comes.",
  },
  changban: {
    zh: '當陽之野,長阪橫亙,自襄陽南下江陵者必經。坡土鬆而路狹,車不得方軌;春夏雨後,泥濘沒踝,輜重過此,常至日暮不能盡。',
    en: "The open country at Dangyang, where a long slope runs across the road every traveller from Xiangyang down to Jiangling must take. The soil is loose and the track narrow — two carts cannot pass abreast — and after the spring rains the mud comes over the ankle; a baggage train crossing here is often still strung out at dusk.",
  },
  jieting: {
    zh: '隴山之口,街衢當道,自關中入隴右者由此。亭下有泉,四面皆山,而山上無水。守此則隴道斷,失此則隴右可以長驅 —— 邊將皆知其要,而戍卒常不滿百。',
    en: "The mouth of the Long range, where the highroad runs through: anyone going from within the passes out to the Long uplands comes this way. There is a spring below the post-house; hills stand on every side, and on the hills there is no water. Hold it and the Long road is cut; lose it and a column rides straight through. Every border officer knows its worth — and the garrison is seldom a hundred men.",
  },
  xiaoting: {
    zh: '夷道之側,山林夾江,江面窄而灘多。自此以西即入峽,舟行逆水,一日不過數十里;以東則豁然平衍 —— 峽口之守,常在此亭。',
    en: "Beside the Yidao road, hills and forest crowding the river where the channel narrows and the shoals begin. West of here the gorges start and a boat pulling against the current makes only a few tens of li a day; east of it the land opens out flat. Whoever watches the gorge mouth watches from this post.",
  },
  yiling: {
    zh: '大江出峽之口,楚之西門。白起伐楚,燒夷陵而焚其先王之墓,楚人自此不振。今為南郡屬縣,峽江之舟至此始得平流,鹽鐵百貨,皆於此轉輸。',
    en: "Where the great river comes out of the gorges — the western gate of Chu. When Bai Qi struck at Chu he burned Yiling and the tombs of its former kings, and Chu never recovered. Now it is a county of Nan commandery: boats out of the gorges first find easy water here, and salt, iron and every other cargo is transhipped at its wharves.",
  },
  fancheng: {
    zh: '漢水北岸,與襄陽夾江對峙,一水之隔而南北異勢。周之樊侯國在此,故以為名。水漲時二城相望如隔湖海,舟渡艱難 —— 守襄陽者必先守樊。',
    en: "On the north bank of the Han, facing Xiangyang across the water: one river between them, and two different countries. The Zhou marquisate of Fan stood here and gave it the name. When the water rises the two towns look at each other across what might be a lake and the crossing is hard — whoever would hold Xiangyang must hold Fan first.",
  },
  bowang: {
    zh: '宛、洛之間,林木深阻,道狹而長。前漢張騫封博望侯,取廣博瞻望之義,即此地也。行旅過此,兩側皆山林,前後不相見 —— 商隊多結伴而行。',
    en: "Between Wan and Luoyang, thick woods hemming a road that is narrow and long. Zhang Qian of the Former Han was made Marquis of Bowang — 'broad prospect' — after this place. Travellers passing through have forest on both hands and cannot see the head or the tail of their own column; caravans go in company here.",
  },
  yanjin: {
    zh: '大河之津,河、濟之衝。河至此屢徙,沙洲時見時沒,渡口亦隨之而移。自古南北之師爭渡於此 —— 得津則兵可濟,失津則隔河相望而已。',
    en: "A ford of the Yellow River where it meets the Ji. The river shifts often here; sandbars appear and drown again, and the crossing moves with them. Armies from north and south have always fought for these fords — hold one and your troops can cross; lose it and you stand on the bank and look.",
  },
  tongguan: {
    zh: '關中東門,河山之會,秦之桃林之塞在其側。黃河至此折而東,南倚華山,道險狹而長,車不方軌 —— 自函谷以來,守關中者未有不守此道者。',
    en: "The eastern gate of the land within the passes, where river and mountain meet; Qin's old Peach Forest barrier lay beside it. The Yellow River turns east here with Mount Hua to the south, and the road is narrow and long, too narrow for two carts abreast. Since the days of Hangu, no one holding the passes has failed to hold this road.",
  },
  jianmen: {
    zh: '大劍山斷處,兩崖如門,飛閣通衢,棧道相屬三十里。秦欲伐蜀,五丁開道,金牛之計自此而入 —— 一夫當關,萬夫莫開,自古蜀之北門。',
    en: "Where the Great Sword range breaks and two cliffs stand like a gate, a flying gallery carrying the road and thirty li of trestle-way strung along the rock. When Qin meant to take Shu, five strongmen opened the road and the trick of the golden oxen came through here. One man in the gate and ten thousand cannot force it — the northern door of Shu since antiquity.",
  },
  yinping: {
    zh: '摩天嶺下,氐人所居,廣漢屬國之地。山高谷深,道絕人稀,自此而南七百餘里皆無人之境 —— 郡縣以為天險,故守備最薄。',
    en: "Below Motian ridge, where the Di live, in the dependent state of Guanghan. The mountains are high and the valleys deep, the tracks fail and the people are few; south of here seven hundred li run empty of men. The commandery calls it a heaven-set barrier — which is why it is the least guarded place on the frontier.",
  },
  baishuiguan: {
    zh: '白水之上,葭萌之北,入蜀之鑰。關前水急不可涉,關後棧道通漢中。益州之北,舍此無他徑可通大軍 —— 故守蜀之北者,恆以重兵屯之。',
    en: "Above the Bai river north of Jiameng — the key that opens Shu. The water before the barrier runs too fast to ford, and behind it the trestle road goes on to Hanzhong. North of Yi province there is no other track an army can use, and so whoever guards Shu's north keeps his weight of troops here.",
  },
  luocheng: {
    zh: '廣漢郡治,雒水環之,成都之北門。土沃而近水,稻田彌望;城陴堅厚,倉儲常實 —— 自漢中南下者,過此始見成都之郊。',
    en: "Seat of Guanghan commandery, ringed by the Luo, the northern door of Chengdu. The soil is rich and the water near, and rice fields run to the horizon; its parapets are thick and its granaries usually full. Coming south from Hanzhong, it is here that a traveller first sees the outskirts of Chengdu.",
  },
  mianzhu: {
    zh: '成都之北,綿水所經,竹木蔽野,故以為名。地平而饒,漢時為廣漢大縣;北連雒城,南直成都,中間無險 —— 過綿竹則蜀之腹心無所蔽矣。',
    en: "North of Chengdu on the Mian, bamboo and timber covering the fields — whence the name. Level, generous ground, and in Han times one of Guanghan's great counties; Luocheng lies to its north and Chengdu straight to its south, with nothing defensible between. Past Mianzhu, the heart of Shu has no cover left.",
  },
  fucheng: {
    zh: '涪水之會,蜀中通衢。自漢中入蜀者至此路始分:一趨成都,一趨巴西。城據高阜,俯瞰兩江,商旅舟車,四時不絕。',
    en: "Where the Fu waters meet — a crossroads of Shu. Coming into Shu from Hanzhong the road first divides here: one branch for Chengdu, one for Baxi. The town sits on a rise looking down on both rivers, and boats and carts pass through it in every season.",
  },
  gongan: {
    zh: '油江之口,南郡孱陵之地,大江南岸。江湖交錯,葦荻連天,春水一漲則陸道皆絕,惟舟可行。荊南四郡之貢賦,率由此渡江而北。',
    en: "The mouth of the You river in Chanling of Nan commandery, on the south bank of the great river. River and lake run into one another and the reeds go to the skyline; when the spring water rises every land road fails and only boats move. The tax and tribute of the four southern commanderies crosses to the north bank here.",
  },
  baqiu: {
    zh: '洞庭之口,大江所匯。湖闊八百里,秋水時至,不辨牛馬;君山孤峙湖心,相傳湘君之所游。舟師出入荊、湘,必泊於此 —— 而水氣鬱蒸,客居者多病。',
    en: "The mouth of Lake Dongting, where the great river gathers. The lake is eight hundred li across, and when the autumn water comes you cannot tell an ox from a horse on the far shore; Jun Mountain stands alone at its centre, where the Lady of the Xiang is said to have walked. Any fleet moving between Jing and Xiang must lie here — and the damp air breeds fevers in men from elsewhere.",
  },
  langya: {
    zh: '東海之濱,琅琊臺在其南。秦皇三至琅琊,徙黔首三萬戶,刻石紀功,遣徐福入海求仙 —— 一去不返。郡多大姓,諸葛氏自司隸校尉豐以來,世為冠族。',
    en: "On the eastern sea, with the Langya terrace to its south. The First Emperor came here three times, moved thirty thousand households in, cut his deeds in stone, and sent Xu Fu out to sea after the immortals — who never came back. The commandery is full of great houses; the Zhuge have been of the first rank ever since Zhuge Feng was Colonel-Director of Retainers.",
  },
  xinye: {
    zh: '南陽之新野,襄陽北障,淯水經其東。光武微時遊學長安,聞新野陰氏女之美,嘆曰「娶妻當得陰麗華」—— 後果為皇后。南陽為帝鄉,冠蓋之盛,他郡莫及。',
    en: "Xinye of Nanyang, the northern screen of Xiangyang, the Yu river along its east. When Guangwu was still a student at Chang'an he heard of the beauty of the Yin girl of Xinye and sighed, 'A man should marry Yin Lihua' — and in time she was his empress. Nanyang is the emperor's own country; no other commandery has such a press of caps and canopies.",
  },
  lingling: {
    zh: '荊南四郡之一,湘水上游。九疑山在其南,相傳虞舜南巡,崩於蒼梧之野而葬於九疑 —— 故其地雖遠,而祀典甚重。山谷多蠻,郡兵歲歲征之。',
    en: "One of the four southern commanderies of Jing, on the upper Xiang. The Nine Doubts range lies to its south, where Shun is said to have died on his southern progress and been buried — so for all its distance the place keeps a heavy round of sacrifices. The valleys are full of tribesmen, and the commandery troops campaign against them every year.",
  },
  yongan: {
    zh: '巴郡之魚復,大江三峽之口。白帝山臨江而立,公孫述據蜀時築城其上,以為西南之鎖鑰。江水至此束於兩崖,聲聞數十里,舟人望而色變。',
    en: "Yufu of Ba commandery, at the mouth of the Three Gorges. White Emperor Hill stands over the water; when Gongsun Shu held Shu he walled its top and made it the lock of the southwest. The river is squeezed between two cliffs here and its noise carries tens of li — boatmen change colour at the sight.",
  },
  yangping: {
    zh: '漢中西門,沔水之陽,山川之限。自隴右入漢中者,必出此關;關外谷道回曲,伏兵所便。守漢中而不守陽平,猶啟門而寢也。',
    en: "The western gate of Hanzhong, north of the Mian, where the mountains close in. Anyone coming down from the Long uplands into Hanzhong must come out at this barrier; beyond it the valley road twists — good ground for an ambush. To hold Hanzhong without holding Yangping is to sleep with the door open.",
  },
  wudu: {
    zh: '氐羌雜居之地,西漢水所經,郡以水得名。土宜麻麥而少稻;氐人依山為落,種田織布,與漢民互市。安帝以來羌氐屢叛,郡治數徙,吏民苦之。',
    en: "A country where Di and Qiang live mixed, on the Western Han river that gave the commandery its name. The soil takes hemp and wheat but little rice; the Di keep their hamlets against the hillsides, farm and weave and trade with the Han settlers. Since Emperor An the Qiang and Di have risen again and again, the commandery seat has moved more than once, and the people are worn out by it.",
  },
  chencang: {
    zh: '渭水之濱,秦之舊都。文公獲若石之神於此,祠曰陳寶。韓信暗度而定三秦,自此為關中西門 —— 道出散關,直趨漢中。',
    en: "On the Wei, an old seat of Qin. Duke Wen took a stone-spirit here and raised the shrine of the Chen Treasure. Han Xin crossed secretly and won the three Qins, and ever since this has been the western gate of the passes — the road goes out through San Barrier and straight down to Hanzhong.",
  },
  anding: {
    zh: '涼州東門,涇水所出,絲路所經。西域之賈東行,至此始入內郡。安帝永初中羌大入寇,郡治自臨涇內徙美陽,居民南遷者十餘萬 —— 邊郡之殘破,自此始。',
    en: "The eastern gate of Liang province, at the head of the Jing, on the silk road: merchants coming east out of the Western Regions first enter the inner commanderies here. In the Yongchu years of Emperor An the Qiang broke in, the commandery seat was moved inward from Linjing to Meiyang, and more than a hundred thousand people went south with it. The ruin of the border commanderies began then.",
  },
  longxi: {
    zh: '隴山之西,李氏之望。飛將軍李廣出於此,善騎射,射石而沒鏃;其孫陵以五千步卒抗匈奴八萬,矢盡而降,司馬遷為之辯而受腐刑。隴西之名,半在弓馬。',
    en: "West of the Long range, seat of the Li. The Flying General Li Guang came from here — an archer who once drove a shaft to its feathers into a rock he had taken for a tiger; his grandson Ling held off eighty thousand Xiongnu with five thousand foot until his arrows ran out and he surrendered, and Sima Qian was castrated for speaking on his behalf. Half of Longxi's name is bow and horse.",
  },
  shanggui: {
    zh: '天水之北,渭水所經,隴上之麥田在焉。土厚水足,一歲再熟,邊軍之糧多仰於此。城當隴道之衝,自關中西出者,過陳倉、越隴山,即抵其下。',
    en: "North of Tianshui on the Wei, where the wheat fields of the Long uplands lie. The soil is deep and the water sufficient — two crops a year — and much of the border army's grain comes from here. The town sits astride the Long road: coming west out of the passes, past Chencang and over the range, you arrive beneath its walls.",
  },
  wu: {
    zh: '吳郡治所,太湖之東。闔閭城基猶在,伍子胥相土嘗水而築之。顧、陸、朱、張四姓世居,累世冠冕,田連阡陌 —— 江東之政,不在刺史而在此數家。',
    en: "Seat of Wu commandery, east of Lake Tai. The foundations of King Helü's city are still there — Wu Zixu chose the ground and tasted the water before he built. The Gu, Lu, Zhu and Zhang have lived here for generations, cap after cap of office, their fields running one into another. The government of the Southland sits less with the Inspector than with these few houses.",
  },
  danyang: {
    zh: '丹陽山險,民多果勁,好武習戰,高尚氣力 —— 天下精兵之所出。山中有銅,漢初鑄錢之利在此;又多越人遺種,依阻山谷,號曰山越,郡縣不能盡有其地。',
    en: "Danyang of the steep hills, whose people are hard and quick, fond of arms and used to fighting, and who set store by strength — the best infantry under heaven comes out of it. There is copper in the mountains and the early Han minted from it; and the remnants of the Yue hold the valleys, called the Mountain Yue, whose ground the magistrates have never wholly taken.",
  },
  wuxi: {
    zh: '太湖之濱,魚米之鄉。相傳周秦之間錫山產錫,兵爭不絕;漢興而錫盡,故曰無錫,其地遂安 —— 里諺云:「有錫兵,天下爭;無錫寧,天下清。」',
    en: "On the shore of Lake Tai, a country of fish and rice. It is said that between Zhou and Qin the hill here yielded tin and men fought over it without cease; when Han rose the tin gave out, and so the place is Wuxi, No-Tin, and the fighting stopped. The village rhyme runs: tin here, war everywhere; no tin, and the realm is quiet.",
  },
  yuzhang: {
    zh: '贛江之會,江東西門。郡人徐孺子恭儉義讓,屢辟不就,陳蕃為太守,特設一榻以待之,去則懸之 —— 「徐孺下陳蕃之榻」,南州高士,以此為稱。',
    en: "Where the Gan waters meet, the western gate of the Southland. Its native Xu Zhi was modest and dutiful and refused every summons to office; when Chen Fan was Grand Administrator he kept one couch set apart for him and hung it up again when he left. 'Xu Zhi let down Chen Fan's couch' — the phrase still stands for the high-minded men of the south.",
  },
  jiuzhen: {
    zh: '交州之南,海隅之地。漢置九真郡,光武時任延為太守,教民耕犁、制媒聘、立學校,嶺南始知婚姻之禮。土產明珠、翡翠、玳瑁,而道遠瘴深,吏多不願行。',
    en: "South of Jiao province, on the edge of the sea. The Han set up Jiuzhen commandery here, and under Guangwu the Grand Administrator Ren Yan taught the people the plough, arranged matches and betrothals, and opened schools — it was then that the far south first learned the rites of marriage. It yields bright pearls, kingfisher plumes and tortoiseshell; but the road is long and the fever deep, and few officials want the post.",
  },
  wuyuan: {
    zh: '河套北緣,陰山之南,秦之長城在其北。蒙恬將三十萬眾卻匈奴,自九原築直道抵甘泉,千八百里 —— 今道猶存而戍已疏。土宜牧,漢民與匈奴雜居,習騎射者眾。',
    en: "The northern rim of the river loop, south of the Yin mountains, the Qin wall beyond. Meng Tian drove back the Xiongnu with three hundred thousand men and ran the Straight Road from Jiuyuan to Ganquan, eighteen hundred li — the road is still there; the garrisons are not. The land is for herds, Han and Xiongnu live side by side, and there are many here who can ride and shoot.",
  },
  liaodong: {
    zh: '遼水之東,漢之東北極邊。武帝滅衛氏朝鮮,置四郡,而遼東最為要衝。其地苦寒,五穀晚熟;東接高句麗、濊貊,北接鮮卑,郡兵歲不解甲。',
    en: "East of the Liao, the far northeastern edge of Han. Emperor Wu destroyed the Wei kingdom of Chosŏn and set up four commanderies, of which Liaodong is the key. The country is bitterly cold and its grain ripens late; Goguryeo and the Ye-Maek lie east of it, the Xianbei north, and the commandery troops go a whole year without taking off their armour.",
  },
  xiangping: {
    zh: '遼東郡治,小遼水之濱。土城四圍,外有濠塹。中原有亂,士人多避地遼東,講學於海隅 —— 而胡騎一至,城門即閉,數月不開。',
    en: "Seat of Liaodong commandery, on the Lesser Liao. An earth wall on all four sides with a ditch outside it. When the central provinces are in disorder, scholars come away to Liaodong and lecture on the sea's edge — and when the nomad horse appear the gates shut and stay shut for months.",
  },
  nanzhong: {
    zh: '益州之南陲,四郡之總稱。莊蹻王滇於此,漢武開西南夷,置郡縣而羈縻其長。夷漢雜處,大姓擁部曲,郡吏不能制;道遠瘴重,漢兵至此,未戰而病者半。',
    en: "The southern march of Yi province, the general name of its four commanderies. Zhuang Qiao once made himself king of Dian here; Emperor Wu opened the southwestern tribes, set up commanderies, and left their chiefs on a loose rein. Tribesman and Han live mixed, the great families keep their own retainers, and the clerks cannot govern them. The road is long and the fever heavy — half a Han column is sick before it fights.",
  },
  jianning: {
    zh: '益州郡之味縣,滇池東北。郡以州名,而去成都二千里。雍、孟諸族世居於此,擁僮僕部曲數千;郡守至者,非因其力不能行事 —— 名為漢郡,實同羈縻。',
    en: "Wei county of Yizhou commandery, northeast of Lake Dian. The commandery bears the province's own name and lies two thousand li from Chengdu. The Yong and the Meng have been here for generations with thousands of bondsmen and retainers; a Grand Administrator who arrives can get nothing done except through them. A Han commandery in name; in fact, held on a rein.",
  },
  yuexi: {
    zh: '邛都之地,西南夷所居,邛海在其側。漢武遣司馬相如通西南夷,置越巂郡。其民耕田有邑聚,而叟、笮諸種散處山谷,叛服無常 —— 邛竹之杖,曾自此轉販身毒。',
    en: "The country of Qiongdu, where the southwestern tribes live, with Lake Qiong beside it. Emperor Wu sent Sima Xiangru to open the southwest and set up Yuexi commandery. Its people farm and live in settlements, while the Sou and the Ze are scattered through the valleys and submit or rebel by turns — and the bamboo staves of Qiong once went from here to India by trade.",
  },
  yunnan: {
    zh: '益州郡之屬縣,洱水之東。莊蹻循江而上,王滇數世,變服從其俗。漢武開之,賜滇王印;其地宜蠶桑,又產鹽井,而山高路絕,王化所及,不過縣治數十里。',
    en: "A county of Yizhou commandery, east of the Er waters. Zhuang Qiao came up the river, ruled Dian for generations, and took the dress and customs of the place. Emperor Wu opened it and gave the King of Dian his seal. The land suits silkworms and has salt wells — but the mountains are high and the roads fail, and the writ of the court reaches only a few tens of li beyond the county seat.",
  },
  yongchang: {
    zh: '南中最遠之郡,哀牢夷之地。明帝時哀牢王柳貌率種人五十餘萬內附,始置永昌。其西通身毒,商賈由此販琉璃、光珠、蠶綿而東 —— 而去洛陽萬里,詔書一至,常逾歲時。',
    en: "The furthest commandery of the south, country of the Ailao. Under Emperor Ming their king Liumao came in with more than five hundred thousand of his people, and Yongchang was established. Westward the road runs to India, and traders bring glass, bright pearls and floss silk east along it — but it is ten thousand li from Luoyang, and an edict often takes more than a year to arrive.",
  },
  qianwei: {
    zh: '岷江下游,蜀之富郡。井鹽之利甲於西南,鑿深井取鹵,以竹筒引之,煮之成鹽;又有火井,取火煮鹵,一日夜可得數斛 —— 蜀之富,鹽鐵居其半。',
    en: "The lower Min, one of Shu's rich commanderies. Its well-salt outdoes anything in the southwest: they sink deep shafts for the brine, lead it off in bamboo pipes and boil it down; there are fire-wells too, whose flame boils the pans and yields several bushels in a day and a night. Half of Shu's wealth is salt and iron.",
  },
  liyang: {
    zh: '大河北岸之渡,魏郡屬縣。明帝置黎陽營,常屯騎士以鎮河北 —— 中原有事,此營先發。津渡當南北之衝,河冰合則車馬可通,河開則舟人坐取其利。',
    en: "A crossing on the north bank of the Yellow River, a county of Wei commandery. Emperor Ming raised the Liyang camp here and has kept horse standing in it ever since to hold Hebei down — when there is trouble in the central provinces, this camp marches first. The ford lies on the road between north and south: when the river freezes, carts and horses go over; when it opens, the boatmen sit and take their profit.",
  },

  wan: {
    zh: '南陽帝鄉,光武龍興之地,冠蓋相望,富冠海內。城中三市並列,商賈以萬數;太守杜詩造水排以鼓鑄,用力少而見功多,百姓便之,號曰「杜母」。',
    en: "The emperor's own country: Nanyang, where Guangwu rose — one cap of office in sight of the next, and wealth beyond any other commandery. Three markets stand side by side inside the wall and the merchants number in the tens of thousands; Du Shi the Grand Administrator built water-driven bellows for the furnaces, little labour for much yield, and the people called him Mother Du.",
  },
  wancheng: {
    zh: '南陽首邑,天下之膂,冶鐵之利甲於漢世。今張曼成據此,自稱神上使,殺太守褚貢,黃巾之眾數萬,盤據不去 —— 南陽為帝鄉而賊據之,朝廷之恥,莫大於此。',
    en: "The chief town of Nanyang and the spine of the realm; no ironworks in Han match its own. Zhang Mancheng holds it now — he styles himself the Envoy of the Spirits, has killed Chu Gong the Grand Administrator, and sits there with tens of thousands of Turbans. Nanyang is the emperor's own country and rebels are in it: the court knows no greater shame.",
  },
  puyang: {
    zh: '濮水之上,衛之故都。桑間濮上之音,古以為亡國之聲;而其地平衍多桑,女工之富,甲於兗州。四通八達而無險可守 —— 兗州爭衡,常先爭此。',
    en: "On the Pu, old capital of Wey. The airs of Sangjian and Puhang were reckoned by the ancients the music of a state's ruin; yet the country is level and thick with mulberry, and no part of Yan province is richer in women's work. Roads run out of it every way and it has no defensible ground — whoever contests Yan province contests this place first.",
  },
  wuwei: {
    zh: '河西走廊之衝,武帝置四郡以斷匈奴右臂,武威其首也。霍去病兩出隴西,踰居延,收休屠祭天金人 —— 自是河西無王庭。涼州大馬,橫行天下,而羌胡雜處,叛服無常。',
    en: "The key of the Hexi corridor. Emperor Wu set four commanderies here to cut off the Xiongnu's right arm, and Wuwei is the first of them. Huo Qubing rode out twice past Longxi, crossed the Juyan, and carried off the golden man the Xiutu worshipped — after that there was no nomad court in Hexi. The great horses of Liang range where they please; but Qiang and Han live mixed here, and submit or rebel by turns.",
  },
  xiaopei: {
    zh: '沛國之小城,徐州之屏。高祖起於豐沛,提三尺劍取天下,故沛人至今自矜其鄉。城小而當四衝,南通淮泗,北接山陽 —— 屯此者,進可爭徐,退可保豫。',
    en: "A small town of Pei, the screen of Xu province. The Founder rose at Feng and Pei and took the realm with a three-foot sword, and the men of Pei have been proud of their country ever since. The town is small and sits on four roads — Huai and Si to the south, Shanyang to the north. Camp here and you can push for Xu or fall back on Yu.",
  },
  pingyuan: {
    zh: '河朔平衍之地,青、冀之交,一望無山。土宜五穀而近河,水患亦頻;民多流亡,郡縣以招徠戶口為急。黃巾之亂,青州最甚,而平原正當其衝。',
    en: "Flat country north of the river where Qing and Ji meet, and not a hill in sight. The soil takes all five grains and the river is close — so are its floods; many of its people have drifted away, and the magistrates' first business is coaxing households back onto the rolls. In the Turban rising Qing province has suffered worst, and Pingyuan stands in its path.",
  },
  jiaozhi: {
    zh: '嶺南絕域,珠璣、犀象、玳瑁之所出。光武時徵側、徵貳姊妹反,馬援將樓船南征,立銅柱以表漢界 ——「銅柱折,交趾滅」,南人相戒,過者輒投一石,積之成丘。',
    en: "The far south beyond the ranges, whence come pearls, rhinoceros horn and tortoiseshell. Under Guangwu the Trưng sisters rose in revolt, and Ma Yuan took his tower-ships south and set up a bronze pillar to mark the Han border — 'when the pillar falls, Jiaozhi ends,' the southerners warn each other, and every passer-by throws a stone at its foot until the stones have made a mound.",
  },
  guandu: {
    zh: '汴水之濱,鴻溝故道所經,官道由此渡河。地平無險而當南北之衝,自大梁以來,此為中原之門樞;車轍相錯,亭傳相望 —— 兵家過此,必爭一渡。',
    en: "On the Bian, along the old course of the Hong canal, where the official road crosses the water. Level ground with nothing defensible about it, and yet it sits astride the road between north and south: since the days of Daliang this has been the hinge of the central plain, cart-ruts crossing and post-houses in sight of one another. No army passes without fighting for the ford.",
  },
  maicheng: {
    zh: '沮、漳二水之間,小城孤懸。相傳楚昭王所築,與偃城、驢城鼎立,土人謂之三城。城小而無井,恃外水以汲 —— 圍之數日,則自困矣。',
    en: "Between the Ju and the Zhang, a small town standing alone. King Zhao of Chu is said to have built it, one of three set out together with Yancheng and Lücheng, which the country people call the Three Towns. It is small and has no well and draws its water from outside the wall — invest it for a few days and it starves itself.",
  },
  baima: {
    zh: '黃河南岸之渡,對岸即黎陽。津側有白馬山,故以名之。河至此廣而流緩,舟楫易濟,自古南北之師必爭 —— 得此渡則河南之地皆震。',
    en: "A crossing on the south bank of the Yellow River, Liyang on the far shore. There is a White Horse hill beside the ford, which gave it the name. The river is broad and slow here and easily crossed, and armies from north and south have always fought for it — take this ford and every district south of the river feels it.",
  },
  hulao: {
    zh: '成皋之險,天下之樞。東出則中原,西入則洛陽,一關而扼二京之間。周穆王獲虎於此而牢之,故曰虎牢;楚漢相持成皋,漢王數敗而終不去 —— 知其不可失也。',
    en: "The narrows at Chenggao, the hinge of the realm: go east and you are on the central plain, west and you are at Luoyang — one barrier holding the road between two capitals. King Mu of Zhou is said to have caged a tiger here, whence the name; when Chu and Han faced each other at Chenggao the King of Han was beaten again and again and still would not leave, knowing what it was worth.",
  },
  jiameng: {
    zh: '蜀北之衝,白水之南。秦滅蜀,置葭萌縣,自此漢中入蜀之路始通。城居谷口,南望劍閣,北接白水 —— 兵至此則蜀人聞警,故常設戍不撤。',
    en: "The northern gate-post of Shu, south of the Bai river. When Qin destroyed Shu it made Jiameng a county, and from then the road from Hanzhong into Shu was open. The town sits at a valley mouth, the Sword Barrier to its south and the Bai water to its north — when troops reach here the men of Shu hear of it, and so the garrison is never withdrawn.",
  },
  ruxu: {
    zh: '濡須水口,巢湖之南泄。湖水由此入江,兩岸夾山,水道窄而深,舟師出入必由之 —— 江東之北門,無險於此者。',
    en: "The mouth of the Ruxu, where Lake Chao drains south into the Yangtze. Hills close on both banks and the channel is narrow and deep; any fleet going in or out must pass it — the northern door of the Southland, and nowhere better defended by nature.",
  },
  wuchang: {
    zh: '江南之鄂縣,樊山之下,大江所經。楚熊渠封中子紅為鄂王,即此地也。山出銅鐵,冶鑄甚饒;江面稍狹,南北之舟至此易渡 —— 上控江夏,下臨柴桑。',
    en: "E county on the south bank below Fan Hill, on the great river. King Xiongqu of Chu made his second son King of E here. The hills give copper and iron and the smelting is rich; the river narrows a little, so boats cross easily between the banks — Jiangxia above it, Chaisang below.",
  },
  hukou: {
    zh: '壺關天險,道狹如壺口。太行八陘,此其一也;羊腸之坂詰屈,車輪為之摧,行者側足而過。上黨居天下之脊,得之則俯瞰河北 —— 而糧運之難,亦莫此為甚。',
    en: "The barrier of Hu, where the road narrows like the neck of a jar. Of the eight passes of the Taihang this is one; the Sheep's Gut slope twists until it breaks cart-wheels and travellers go along it sideways. Shangdang sits on the spine of the realm and whoever holds it looks down on Hebei — and nowhere is it harder to bring up grain.",
  },
  bohai: {
    zh: '渤海之濱,冀州大郡,戶口數十萬,號為沃壤。煮海為鹽,漁鹽之利,郡藏常盈 —— 而太平道以冀州為根,渤海之民,從之者眾,郡縣莫敢言。',
    en: "On the Bohai shore, a great commandery of Ji province with hundreds of thousands of households and soil reckoned among the richest. They boil the sea for salt, and the profit of fish and salt keeps the stores full — but the Way of Great Peace struck its root in Ji province, and the people of Bohai have gone over to it in numbers the magistrates dare not name aloud.",
  },
  xindu: {
    zh: '冀州治所之一,河北腹地,漳、滹沱之間。光武自薊南奔,郡國皆閉門,獨信都太守任光開城迎之,遂以此為根本而定河北 —— 中興之業,實起於此。',
    en: "One of the seats of Ji province, in the heart of Hebei between the Zhang and the Hutuo. When Guangwu fled south from Ji, every commandery shut its gates against him; only Ren Guang, Grand Administrator of Xindu, opened his and took him in, and from that base he won Hebei. The restoration truly began here.",
  },
  zhongshan: {
    zh: '中山靖王之國,漢家宗室之藩。其地饒栗棗,而中山之酒尤名於世,相傳有千日之釀,飲者醉臥經年 —— 郡人以織席販繒為業者亦眾。',
    en: "The kingdom of the Jing Prince of Zhongshan, a fief of the imperial house. The country is rich in chestnuts and jujubes, and the wine of Zhongshan is famous — there is said to be a thousand-day brew whose drinkers lie insensible for a year. Many of its people live by weaving mats and selling silk.",
  },
  qiao: {
    zh: '沛國譙縣,渦水所經,曹氏、夏侯氏之鄉。縣人華佗精於方藥,又善刀鋸,能刳破腹背、抽割積聚,傅以神膏,四五日創愈 —— 沛譙之間,言醫者必稱之。',
    en: "Qiao county in Pei, on the Guo river, home of the Cao and the Xiahou. Its native Hua Tuo is a master of drugs and of the knife: he can open the belly or the back and cut away what has gathered there, dress it with a marvellous salve, and the wound closes in four or five days — between Pei and Qiao, no one talks of medicine without naming him.",
  },
  guiyang: {
    zh: '荊南山鄉,郴縣所在,五嶺之北。太守衛颯鑿山通道五百餘里,列亭傳、置郵驛,嶺南之貨始得北運。山出鉛錫,溪多毒瘴,居民刀耕火種,郡不能盡籍其戶。',
    en: "Hill country in southern Jing about Chen county, north of the Five Ranges. Wei Sa the Grand Administrator cut a road five hundred li through the mountains and set post-houses and relay stations along it, and only then could the goods of the far south come north. The hills give lead and tin, the valleys breed fever, the people slash and burn — and the commandery has never got all their households onto its rolls.",
  },
  jiangzhou: {
    zh: '巴郡治所,大江與嘉陵之會。兩江夾城,舟楫輻輳,鹽井之利與蜀中相通。巴人剛勇,善歌舞,高祖募之以定三秦,所謂巴渝之舞,至今存於樂府。',
    en: "Seat of Ba commandery, where the great river meets the Jialing. Two rivers press the town between them and the boats crowd its banks; its salt wells trade with all of Shu. The men of Ba are hard and brave and good singers and dancers — the Founder raised them to win the three Qins, and the Bayu dance they brought is kept in the Music Bureau still.",
  },
  baxi: {
    zh: '閬中所在,嘉陵江曲折繞城,三面皆水。巴西多板楯蠻,善用木盾白竹之弩,號曰神兵;高祖賴之以定關中,故世世復其租賦,不與齊民同。',
    en: "Langzhong, where the Jialing bends round the town and water lies on three sides. Baxi is full of the Shield-Board tribes, who fight with wooden shields and white-bamboo crossbows and are called the Spirit Troops; the Founder owed the winning of the passes to them, and their taxes have been remitted generation after generation, apart from the common roll.",
  },
  shangyong: {
    zh: '漢水上游,山高路絕,自古為庸國之地。武王伐紂,庸人與焉;秦滅之而置縣。四面皆山,道通房陵,而與漢中隔一大巴 —— 王師罕至,大姓自守,郡縣不過名目。',
    en: "The upper Han, high hills and failing roads: the old country of Yong. When King Wu marched against Zhou the men of Yong went with him; Qin destroyed them and made the place a county. Mountains close it on every side, the road runs on to Fangling, and the Daba range stands between it and Hanzhong — the royal armies seldom come, the great families keep themselves, and the magistracy is little more than a name.",
  },
  jincheng: {
    zh: '黃河上游,羌漢雜處,武帝置郡以隔羌胡。趙充國屯田湟中,以耕代戰,羌人遂服。今北宮伯玉、李文侯反於金城,劫邊章、韓遂而立之 —— 涼州之亂,自此而始。',
    en: "The upper Yellow River, Qiang and Han living mixed, where Emperor Wu set a commandery to keep them apart. Zhao Chongguo settled soldier-farms in the Huang valley and fought by ploughing, and the Qiang submitted. Now Beigong Boyu and Li Wenhou have risen at Jincheng and seized Bian Zhang and Han Sui to lead them — the Liang province wars begin here.",
  },
  luling: {
    zh: '贛南山鄉,豫章之南境,山越所居。層巒疊嶂,溪谷相通,民依險而居,不供租賦;招之則來,督之則叛 —— 江東之患,不在北而在腹地。',
    en: "Hill country in the south of Yuzhang, where the Mountain Yue live. Range behind range with the valleys running into one another; the people keep to defensible ground and pay no tax — coax them and they come in, press them and they rebel. The Southland's trouble is not on its northern border but in its own belly.",
  },
  linhai: {
    zh: '東海之濱,會稽東部都尉所治。海中有夷洲、亶洲,相傳徐福所至,其人時至會稽市貨。土產海錯、木材,而颶風時作,舟人畏之 —— 中國之極東,至此而止。',
    en: "On the eastern sea, seat of the Eastern Commandant of Kuaiji. Out in the water lie Yizhou and Danzhou, where Xu Fu is said to have gone; their people come in to the Kuaiji markets to trade from time to time. It yields sea-food and timber, and the typhoons come often enough that boatmen fear it — the far east of the Middle Kingdom stops here.",
  },
  nanhai: {
    zh: '番禺所在,南海之口。海舶所聚,珠璣、犀象、玳瑁、果布之湊 —— 中國與南洋通商,自漢已然。秦時趙佗據此稱南越王,傳五世九十三年,武帝乃平之。',
    en: "Panyu, at the mouth of the southern sea, where the sea-going ships gather and pearls, rhinoceros horn, tortoiseshell and southern cloth come together — China has traded with the south seas since the dynasty began. In Qin times Zhao Tuo held it and called himself King of Nanyue; his house lasted five generations and ninety-three years before Emperor Wu put it down.",
  },
  cangwu: {
    zh: '灕水、鬱水之會,交、廣之樞。秦鑿靈渠,通湘、灕二水,舟自長沙可直下番禺 —— 嶺南之入版圖,實賴此渠。中原喪亂,士人南避者踵相接,郡中講誦之聲不絕。',
    en: "Where the Li meets the Yu, the hinge between Jiao and Guang. Qin cut the Magic Canal to join the Xiang and the Li, and a boat from Changsha can run straight down to Panyu — it is that canal that brought the far south into the empire's map at all. When the central provinces fall into disorder the scholars come south one behind another, and the sound of recitation is never out of the commandery.",
  },
  luoyang: {
    zh: '九朝故都,居天下之中,河洛環抱,王氣所鍾。南北二宮相望,複道連其上;太學諸生三萬餘人,而西園賣官之榜亦張於此 —— 公千萬,卿五百萬,天子自為賈人。',
    en: "Ancient capital of nine dynasties, seat of the realm's centre, cradled by the Yellow and the Luo where the king-aura gathers. The Northern and Southern Palaces face each other with a covered way running above them; thirty thousand students fill the Imperial Academy — and the price-list of the Western Garden is posted here as well: ten million for an Excellency, five million for a Minister. The Son of Heaven has turned merchant.",
  },
  shouchun: {
    zh: '淮南重鎮,芍陂灌溉,魚稻之饒。楚考烈王徙都於此,故城郭宏壯;孫叔敖作芍陂,周百二十里,溉田萬頃,至今為淮南之利,郡以此不憂饑。',
    en: "The chief seat of Huainan, watered by the Shao reservoir, rich in fish and rice. King Kaolie of Chu moved his capital here and its walls are grand accordingly; Sunshu Ao made the Shao reservoir, a hundred and twenty li round, watering ten thousand qing of field — Huainan lives off it still, and the commandery does not fear famine.",
  },
  zitong: {
    zh: '劍閣之南,蜀道所經。秦惠王欲伐蜀,作五石牛,言能糞金;蜀侯使五丁開道以迎之,道成而國隨之亡 —— 蜀之險,自古不亡於外寇,而亡於自啟其扉。',
    en: "South of the Sword Barrier, on the road into Shu. King Hui of Qin, meaning to take Shu, had five stone oxen made and let it be put about that they dunged gold; the Marquis of Shu sent five strongmen to cut a road to fetch them, and when the road was finished his state went down it. The barriers of Shu have never fallen to an invader — only to those who opened their own door.",
  },
  xiling: {
    zh: '峽口要害,大江出峽之處。上接夷陵,下臨江漢,水急灘多,舟師逆流而上者,常以縴挽而行。荊州之西藩 —— 守此則峽路不通,失此則上游門戶洞開。',
    en: "The key of the gorge mouth, where the great river comes out. Yiling lies above it and the Han plain below; the water runs fast and the shoals are many, and fleets working upstream are often hauled along by tow-line. It is the western outwork of Jing province — hold it and the gorge road is shut; lose it and the door to the upper river stands open.",
  },
  mei: {
    zh: '右扶風之郿縣,渭水之南,秦嶺之北。土沃宜稼,又當褒斜道之北口 —— 自漢中北出者,至此始見關中之野;西行則歷陳倉,直趨隴右。',
    en: "Mei county in Youfufeng, south of the Wei and north of the Qinling. The soil is rich and takes a crop well, and the town sits at the northern mouth of the Baoxie road — coming north out of Hanzhong, it is here you first see the open plain of the passes; go west instead and you pass Chencang and run straight for the Long uplands.",
  },
  sanguan: {
    zh: '大散關,秦蜀之衝,散谷之口。北出則關中,南入則漢中;褒斜、故道二途於此交會。關踞高阜,下臨深澗,一徑通車,守者數百可拒萬人。',
    en: "The Great San Barrier at the mouth of the San valley, where Qin meets Shu: north of it the land within the passes, south of it Hanzhong, and the Baoxie and the Old Road come together here. The barrier sits on a height above a deep ravine with a single cart-track through it — a few hundred men holding it can stop ten thousand.",
  },
  poyang: {
    zh: '彭蠡之澤,豫章之東。湖廣而淺,春夏水漲則彌望無際,秋冬水落則洲渚相連。民以漁為業,又多山越,居澤畔者亦不甚服官法。',
    en: "The Pengli marshes east of Yuzhang. The lake is wide and shallow: when the spring water rises it reaches out of sight, and when it falls in autumn the sandbars join up into dry land. The people live by fishing, and there are many Mountain Yue among them — even those on the lake shore are not much given to obeying the magistrates.",
  },
  'yi-county': {
    zh: '易水之濱,幽州之南陲。荊軻西入秦,燕太子丹送之於此,高漸離擊筑,士皆垂淚 ——「風蕭蕭兮易水寒,壯士一去兮不復還」。今為邊郡屯戍之地,烏桓犯塞,常先及之。',
    en: "On the Yi river, the southern march of You province. When Jing Ke went west into Qin the Crown Prince of Yan saw him off here; Gao Jianli struck his lute and every man there wept — 'the wind is bleak, the Yi water cold; once the brave man goes he comes back no more.' Now it is a border post, and when the Wuhuan cross the line it is usually the first place they reach.",
  },
  liucheng: {
    zh: '烏桓之都,遼西之北。烏桓自匈奴衰而盛,分部而居,善騎射,漢置護烏桓校尉以領之。其俗貴少賤老,怒則殺父兄而終不害其母 —— 以母有族類,父兄無相仇報故也。',
    en: "The Wuhuan's own seat, north of Liaoxi. The Wuhuan grew strong as the Xiongnu weakened; they live in scattered divisions, ride and shoot well, and Han keeps a Protector-Colonel over them. By their custom the young are honoured and the old slighted, and in anger a man may kill his father or his brother but never his mother — for a mother has kin to avenge her, and a father or brother has none.",
  },
  lelang: {
    zh: '朝鮮半島西北,武帝所置四郡之一,漢家衣冠、文書、印綬所及之最東。其民相傳為箕子之後,俗尚禮讓,犯禁者少;郡通海道,與三韓、倭人交市。',
    en: "The northwest of the Korean peninsula, one of the four commanderies Emperor Wu established — the furthest east that Han dress, Han documents and Han seals of office reach. Its people are held to descend from the Viscount of Ji; they set store by courtesy and few break the law. The commandery has a sea road and trades with the Three Han and with the Wa.",
  },
  daifang: {
    zh: '樂浪之南,黃海之濱。漢家設縣於此以綏東夷,韓、濊之貢,皆由此入。海路自此浮渡,可至倭人諸國 —— 其人分為百餘國,以女子為王者亦有之。',
    en: "South of Lelang on the Yellow Sea. Han set a county here to keep the eastern tribes quiet, and the tribute of the Han and the Ye comes in this way. From here a ship can cross to the countries of the Wa — more than a hundred of them, and some, they say, ruled by women.",
  },
};

/** 漢末(184 前後)版本;沒寫就回 null。 */
export function lateHanCityLore(cityId: string): CityLore | null {
  return LATE_HAN[cityId] ?? null;
}

/** 測試與工具用:漢末版目前寫了哪些城。 */
export function lateHanCityIds(): string[] {
  return Object.keys(LATE_HAN);
}

const BY_ERA: Record<LoreEra, Record<string, CityLore>> = {
  'warring-states': WARRING_STATES,
  'chu-han': CHU_HAN,
  'sui-tang': SUI_TANG,
};

/** 該代該城的風物志;沒寫就是 null(**不回退三國文本**)。 */
export function eraCityLore(era: LoreEra, cityId: string): CityLore | null {
  return BY_ERA[era][cityId] ?? null;
}

/** 測試與工具用:某一代目前寫了哪些城。 */
export function eraLoreCityIds(era: LoreEra): string[] {
  return Object.keys(BY_ERA[era]);
}
