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
