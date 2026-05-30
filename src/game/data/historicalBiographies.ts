/**
 * 歷代名將 列傳 — concise historically-grounded biographies for the most
 * iconic historical officers across all 14 dynasties.
 *
 * Spread into the main BIOGRAPHIES map so OfficerDetail picks them up
 * automatically via `getBiography(officer.id)`.
 *
 * Target: ~150 priority figures. Less prominent officers fall back to the
 * stat-derived procedural bio in `biographies.ts`.
 */
import type { OfficerBiography } from './biographies';

export const HISTORICAL_BIOGRAPHIES: Record<string, OfficerBiography> = {
  // ─── 春秋 Spring & Autumn ────────────────────────────────────────
  'hist-jiang-ziya': {
    era: { zh: '周太師', en: 'Grand Tutor of Zhou' },
    zh: '名尚,字子牙,東海人。年八十遇周文王於渭水,輔武王伐紂滅商,封於齊。著《六韜》兵法,為中華兵家之祖。',
    en: 'Personal name Shang, style Ziya. Met King Wen of Zhou while fishing at the Wei River at age 80, helped King Wu overthrow Shang, was enfeoffed in Qi. Author of the Six Strategies, the founding text of Chinese military thought.',
    quote: { zh: '太公釣於渭水,願者上鉤。', en: 'Taigong fished at the Wei — only those who willed it took the hook.' },
  },
  'hist-zhou-gong': {
    era: { zh: '周公', en: 'Duke of Zhou' },
    zh: '姓姬名旦,周文王第四子,武王之弟,成王之叔。武王崩後輔成王,平三監之亂,制禮作樂,奠定周朝禮樂典章八百年。',
    en: 'Surname Ji, personal name Dan. Fourth son of King Wen, brother of King Wu, uncle of King Cheng. After King Wu died he served as regent, put down the Three Guards rebellion, and codified the ritual order that defined Zhou for eight centuries.',
    quote: { zh: '一沐三握髮,一飯三吐哺。', en: 'In a single bath I would interrupt three times to greet a guest; in a single meal, spit out the food thrice.' },
  },
  'hist-confucius': {
    era: { zh: '至聖先師', en: 'Supreme Sage' },
    zh: '名丘,字仲尼,魯國陬邑人。周遊列國十四年,弟子三千,賢者七十二。整理六經,刪詩定書,述而不作,儒家學派之祖。',
    en: 'Personal name Qiu, style Zhongni. Traveled the warring states for fourteen years; had three thousand disciples, seventy-two sages among them. Edited the Six Classics. Founder of the Confucian school.',
    quote: { zh: '己所不欲,勿施於人。', en: 'Do not impose on others what you yourself do not desire.' },
  },
  'hist-laozi': {
    era: { zh: '道家始祖', en: 'Founder of Daoism' },
    zh: '姓李名耳,字聃,楚國苦縣人。周守藏室之史。著《道德經》五千言,西出函谷關騎青牛而去,後世奉為道教教祖。',
    en: 'Surname Li, personal name Er, style Dan. Keeper of the royal archives at Zhou. Wrote the Daodejing in five thousand characters, then rode a green ox out the Hangu Pass and was never seen again. Later honored as the founding patriarch of Daoism.',
    quote: { zh: '道可道,非常道。', en: 'The way that can be spoken is not the eternal way.' },
  },
  'hist-zhuangzi': {
    era: { zh: '南華真人', en: 'True Man of South-Splendor' },
    zh: '名周,宋國蒙人。嘗為漆園吏。著《莊子》三十三篇,以寓言闡道,逍遙齊物,為先秦道家集大成者。',
    en: 'Personal name Zhou, a minor lacquer-park officer of Song. Author of the Zhuangzi in 33 chapters — allegories of the boundless and the equality of all things. Greatest Daoist of the pre-Qin era.',
    quote: { zh: '吾生也有涯,而知也無涯。', en: 'Life is bounded, but knowledge is boundless.' },
  },
  'hist-sun-wu': {
    era: { zh: '兵聖', en: 'Sage of War' },
    zh: '字長卿,齊國人。仕吳為將,佐闔閭破楚入郢,五戰五勝。著《孫子兵法》十三篇,世界兵學第一書。',
    en: 'Style name Changqing, a Qi native who served Wu. Helped King Helu break Chu and capture its capital Ying in five battles, five victories. Author of the thirteen-chapter Art of War — the foundational text of world military thought.',
    quote: { zh: '兵者,詭道也。', en: 'War is the way of deception.' },
  },
  'hist-guan-zhong': {
    era: { zh: '法家先驅', en: 'Forefather of Legalism' },
    zh: '名夷吾,字仲,潁上人。鮑叔牙薦於齊桓公,任為相四十年。改革鹽鐵,通商寬農,九合諸侯,使齊國九世稱霸。',
    en: 'Personal name Yiwu, style Zhong. Recommended by Bao Shuya to Duke Huan of Qi, served as chancellor for forty years. Reformed the salt and iron monopolies, opened commerce, eased agriculture — convened the princes nine times and made Qi hegemon for nine generations.',
    quote: { zh: '倉廩實而知禮節,衣食足而知榮辱。', en: 'When the granaries are full, men learn ritual; when clothed and fed, they learn shame and honor.' },
  },
  'hist-bao-shuya': {
    era: { zh: '管鮑之交', en: 'The Guan–Bao Friendship' },
    zh: '齊國大夫。少與管仲為友,深知其才,薦之於桓公為相而己居其下,千古知己之典範。',
    en: 'A noble of Qi. From youth a friend of Guan Zhong; he saw Guan\'s true worth and recommended him to Duke Huan as chancellor while accepting a subordinate post himself — the eternal model of true friendship.',
  },
  'hist-fan-li': {
    era: { zh: '陶朱公', en: 'Master Tao Zhu' },
    zh: '字少伯,楚國宛人。佐越王勾踐臥薪嘗膽二十年,終滅吳國。功成身退,泛舟五湖,經商而成巨富,後世奉為商聖。',
    en: 'Style Shaobo, from Wancheng in Chu. For twenty years he served King Goujian of Yue in his vendetta against Wu, eventually destroying it. He then withdrew, sailed the Five Lakes, and became a great merchant. Later venerated as the Saint of Commerce.',
    quote: { zh: '飛鳥盡,良弓藏;狡兔死,走狗烹。', en: 'When the birds are gone the bow is hidden; when the cunning hare is dead the hound is boiled.' },
  },
  'hist-fu-hao': {
    era: { zh: '商代女將', en: 'Shang Warrior-Priestess' },
    zh: '商王武丁之妻。中國史上最早可考的女性軍事統帥,率軍征羌、征夷,擁兵萬餘。墓出土青銅器數千件,銘其名「婦好」。',
    en: 'Consort of Shang king Wu Ding. The earliest documented female military commander in Chinese history, leading armies against the Qiang and Yi with over ten thousand troops. Her tomb yielded thousands of bronze vessels bearing her name "Lady Hao".',
  },
  'hist-goujian': {
    era: { zh: '越王勾踐', en: 'King Goujian of Yue' },
    zh: '臥薪嘗膽二十年,十年生聚十年教訓,終滅吳雪恥。范蠡、文種輔之。其勾踐劍千年不鏽,藏湖北博物館。',
    en: 'For twenty years he slept on brushwood and licked gall — ten years cultivating his people, ten teaching them war — until at last he destroyed Wu in revenge. Counseled by Fan Li and Wen Zhong. His sword, after twenty-four centuries, was unearthed unrusted.',
    quote: { zh: '臥薪嘗膽。', en: 'Sleeping on brushwood, licking gall.' },
  },
  'hist-xishi': {
    era: { zh: '四大美人之首', en: 'First of the Four Great Beauties' },
    zh: '越國苧蘿村浣紗女。范蠡獻於吳王夫差,使其荒淫亡國。「沉魚」之典即由其浣紗驚魚而出。',
    en: 'A washerwoman from Zhuluo village in Yue. Fan Li presented her to King Fuchai of Wu; her beauty led to his ruin. The idiom "fish sink" (so dazzled they forgot to swim) originated when she washed silk by the river.',
  },

  // ─── 戰國 Warring States ─────────────────────────────────────────
  'hist-sun-bin': {
    era: { zh: '兵法家', en: 'Strategist of Qi' },
    zh: '孫武後裔,鬼谷子弟子。同學龐涓忌其才,陷之以臏刑,然孫臏終以「圍魏救趙」「減灶之計」於馬陵射殺龐涓,著《孫臏兵法》。',
    en: 'A descendant of Sun Wu, disciple of Guiguzi. His fellow student Pang Juan, envious of his talent, had him crippled (his kneecaps cut). Sun Bin escaped to Qi and avenged himself at Maling with the "besiege Wei to save Zhao" stratagem, killing Pang Juan.',
  },
  'hist-bai-qi': {
    era: { zh: '武安君 / 人屠', en: 'Lord Wu\'an / The Butcher' },
    zh: '秦國名將,號「人屠」。一生七十餘戰未嘗敗績,長平之戰坑殺趙卒四十萬。後因功高震主,賜死於杜郵。',
    en: 'Qin general nicknamed "Human Butcher." Seventy battles fought, none lost. At Changping he buried alive 400,000 surrendered Zhao soldiers. Eventually forced to suicide at Duyou — his merit had outgrown his lord\'s tolerance.',
    quote: { zh: '長平四十萬,夜半坑於丘。', en: 'Four hundred thousand at Changping — buried at midnight in the hills.' },
  },
  'hist-wang-jian': {
    era: { zh: '秦始皇統一六國之將', en: 'Sword of Qin\'s Unification' },
    zh: '秦頻陽人,與子王賁皆為秦始皇統一六國之主將,滅趙、燕、楚。請田自污以避嬴政之疑,深通明哲保身之道。',
    en: 'A man of Pinyang in Qin. With his son Wang Ben, the chief generals of Qin\'s conquest of the six warring states — he toppled Zhao, Yan, and Chu. Famously asked for vast estates from Ying Zheng to allay imperial suspicion.',
  },
  'hist-li-mu': {
    era: { zh: '趙國最後支柱', en: 'Last Pillar of Zhao' },
    zh: '趙國北疆名將,守雁門大破匈奴十餘萬騎。後南拒秦軍,屢敗王翦。秦行反間計,趙王遷誅之,趙國隨之而亡。',
    en: 'Defended Zhao\'s northern frontier and crushed over 100,000 Xiongnu cavalry at Yanmen. Later turned south and repeatedly beat back Qin under Wang Jian. Killed by King Qian of Zhao on a Qin-planted slander — Zhao fell soon after.',
  },
  'hist-lian-po': {
    era: { zh: '戰國四大名將之一', en: 'One of the Four Great Generals of Warring States' },
    zh: '趙國名將。與藺相如「將相和」,負荊請罪,千古傳誦。老當益壯,「廉頗老矣,尚能飯否?」一語成讖。',
    en: 'One of the four great generals of the Warring States. Reconciled with Lin Xiangru in the legendary "general and chancellor" friendship, bearing brambles to apologize. The aged-but-still-fighting general — "Is old Lian Po still able to eat?" became a proverb of fading service.',
  },
  'hist-yue-yi': {
    era: { zh: '燕昭王上將軍', en: 'Yan\'s Supreme Commander' },
    zh: '燕昭王築黃金台招賢,樂毅自魏來投。聯五國伐齊,連下七十餘城,只剩莒、即墨二城。後燕惠王中田單反間計而召回,長嘆而去。',
    en: 'King Zhao of Yan built the Golden Terrace to attract talent; Yue Yi answered the call from Wei. Leading a five-state coalition he conquered all but two cities of Qi. Recalled by King Hui on a Tian Dan slander, he sighed and rode west to Zhao.',
  },
  'hist-shang-yang': {
    era: { zh: '變法之父', en: 'Father of the Qin Reform' },
    zh: '衛國公孫鞅,入秦變法。立木為信,廢井田,獎軍功,徙都咸陽,使秦由弱變強。秦孝公死後,被新王車裂於市。',
    en: 'A Wei noble named Gongsun Yang who reformed the Qin state. Verified his credibility by promising and delivering reward for moving a tree; abolished the well-field system; rewarded military merit; moved the capital to Xianyang. After Duke Xiao\'s death, dismembered by chariots in the market.',
    quote: { zh: '法之不行,自上犯之。', en: 'The law does not work because it is broken from above.' },
  },
  'hist-su-qin': {
    era: { zh: '合縱之祖', en: 'Founder of Vertical Alliance' },
    zh: '東周洛陽人,鬼谷子弟子。佩六國相印,主合縱抗秦十五年,秦兵不敢窺函谷關。後車裂於齊。',
    en: 'A Luoyang man, disciple of Guiguzi. At his peak he held the seals of chancellor for all six warring states, organizing the Vertical Alliance against Qin for fifteen years. Qin troops dared not look past Hangu Pass. Later dismembered in Qi.',
  },
  'hist-zhang-yi': {
    era: { zh: '連橫之父', en: 'Architect of Horizontal Alliance' },
    zh: '魏國人,鬼谷子弟子,與蘇秦同門。為秦相,獻連橫之策,瓦解六國合縱,使秦坐大。',
    en: 'A Wei man, disciple of Guiguzi, classmate of Su Qin. As Qin\'s chancellor he engineered the "horizontal alliance" — picking off the six states one by one to dismantle Su Qin\'s vertical league.',
  },
  'hist-han-fei': {
    era: { zh: '法家集大成', en: 'Synthesizer of Legalism' },
    zh: '韓國公子,口吃而善著書。秦始皇讀其《孤憤》《五蠹》,嘆「得見此人與之遊,死不恨矣」。後遭李斯陷害死於秦獄。',
    en: 'A Han prince, a stammerer but a master writer. The First Emperor read his "Solitary Indignation" and "Five Vermin," sighing "If I could meet this man and walk with him, I could die without regret." Killed in a Qin prison by his fellow student Li Si.',
  },
  'hist-guiguzi': {
    era: { zh: '縱橫家祖師', en: 'Patriarch of the Strategists' },
    zh: '隱於鬼谷,弟子蘇秦、張儀、孫臏、龐涓皆名動天下。傳《鬼谷子》一書,後世奉為縱橫家鼻祖。',
    en: 'Hermit of Ghost Valley. His disciples Su Qin, Zhang Yi, Sun Bin, and Pang Juan all shook the world. Author of the Guiguzi — the patriarch of all wandering persuaders.',
  },
  'hist-qu-yuan': {
    era: { zh: '楚辭之父', en: 'Father of Chu Ci' },
    zh: '楚國三閭大夫,屢諫楚懷王不聽,被讒流放。汨羅江抱石自沉而死,後世端午節食粽紀念之。著《離騷》《九歌》。',
    en: 'Magister of the Three Lineages of Chu. His warnings to King Huai went unheeded; slandered, he was exiled. Embracing a stone he drowned himself in the Miluo River. The Dragon Boat Festival rice-dumplings still commemorate him. Author of "Encountering Sorrow" and the "Nine Songs."',
    quote: { zh: '路漫漫其修遠兮,吾將上下而求索。', en: 'The road ahead is long; I will search high and low.' },
  },
  'hist-jing-ke': {
    era: { zh: '荊軻刺秦', en: 'Jing Ke\'s Assassination Attempt' },
    zh: '燕太子丹門客。獻樊於期首級與燕督亢之地圖,藏匕首於圖中,西入咸陽刺秦王嬴政。「圖窮匕現」,事敗被誅。',
    en: 'A retainer of Crown Prince Dan of Yan. Bearing the head of Fan Yuqi and a map of Yan\'s Dukang district concealing a poisoned dagger, he traveled west to Xianyang to assassinate Ying Zheng. The dagger appeared as the scroll unrolled — but the attempt failed.',
    quote: { zh: '風蕭蕭兮易水寒,壯士一去兮不復還。', en: 'The wind howls, the Yi River is cold; the hero goes, never to return.' },
  },

  // ─── 秦 / 楚漢 ──────────────────────────────────────────────────
  'hist-qin-shihuang': {
    era: { zh: '始皇帝', en: 'First Emperor' },
    zh: '名嬴政,秦莊襄王子。十三歲即位,二十二歲親政,三十九歲滅六國,稱皇帝。書同文,車同軌,築長城,焚書坑儒。三十九歲一統天下,五十歲死於沙丘。',
    en: 'Personal name Ying Zheng, son of King Zhuangxiang. Crowned at 13, took personal rule at 22, conquered the six states by 39, and proclaimed himself Emperor. Unified script and axle gauge, built the Great Wall, burned books and buried scholars. Died at 50 at Shaqiu.',
    quote: { zh: '朕為始皇帝,後世以計數,二世三世至於萬世,傳之無窮。', en: 'I am the First Emperor; the dynasty shall pass to the Second, the Third, and the Ten-thousandth, generation upon generation without end.' },
  },
  'hist-meng-tian': {
    era: { zh: '萬里長城', en: 'Builder of the Great Wall' },
    zh: '秦始皇大將。率三十萬眾北擊匈奴,卻匈奴七百餘里。築長城西起臨洮東至遼東萬餘里。傳曾造毛筆。秦二世時遭趙高陷害自盡。',
    en: 'Senior commander under Qin Shi Huang. Drove back the Xiongnu over 700 li with 300,000 troops; built the Great Wall from Lintao in the west to Liaodong in the east, over ten thousand li. Said to have invented the writing brush. Forced to suicide under the Second Emperor by Zhao Gao\'s slander.',
  },
  'hist-xiang-yu': {
    era: { zh: '西楚霸王', en: 'Hegemon-King of Western Chu' },
    zh: '名籍,字羽,下相人。身長八尺,力能扛鼎。鉅鹿之戰破釜沉舟,九戰九捷,坑殺秦卒二十萬。鴻門宴釋劉邦,終於垓下「四面楚歌」自刎烏江,年僅三十一。',
    en: 'Personal name Ji, style Yu, from Xiaxiang. Eight chi tall, could lift a bronze cauldron. At Julu he smashed cooking pots and sank his boats, winning nine victories in nine battles and burying alive 200,000 Qin troops. Spared Liu Bang at Hongmen — and at Gaixia, surrounded by "songs of Chu from all four sides," cut his own throat on the bank of the Wu River. Only thirty-one.',
    quote: { zh: '力拔山兮氣蓋世,時不利兮騅不逝。', en: 'My strength uproots mountains, my will covers the age — but the times are against me, and Wuzhui will not run.' },
  },
  'hist-han-xin': {
    era: { zh: '兵仙', en: 'Sage of War' },
    zh: '淮陰人。少時受胯下之辱,佐劉邦平天下。明修棧道暗度陳倉,背水一戰,十面埋伏。功成後封楚王,終以「多多益善」之言為呂后所殺,夷三族。',
    en: 'A Huaiyin man. In youth he crawled between an oaf\'s legs; later he won the empire for Liu Bang. The "open repair of the plank road and the secret crossing at Chencang," the "back-to-the-river stand," and "ambush on ten sides" — all his. King of Chu after victory, he died at Empress Lü\'s hand for boasting that he commanded "the more troops, the better." His three clans were exterminated.',
    quote: { zh: '韓信點兵,多多益善。', en: 'When Han Xin counts soldiers, the more the better.' },
  },
  'hist-zhang-liang': {
    era: { zh: '謀聖', en: 'Sage of Strategy' },
    zh: '字子房,韓國貴族後裔。博浪沙刺秦不成。圯橋三進履得黃石公《太公兵法》。輔劉邦運籌帷幄,鴻門解危,封留侯。功成歸隱赤松子。',
    en: 'Style Zifang, a Han noble scion. After a failed assassination attempt on the First Emperor at Bolangsha he received the Taigong\'s Art of War from Huangshigong at the Yi bridge — earned by retrieving the old man\'s shoe three times. He counseled Liu Bang from within the command tent, defused the Hongmen banquet, and was made Marquis of Liu. He retired to follow the immortal Master Red Pine.',
    quote: { zh: '運籌帷幄之中,決勝千里之外。', en: 'Planning from within the command tent, deciding victories a thousand li away.' },
  },
  'hist-xiao-he': {
    era: { zh: '漢初三傑', en: 'One of the Three Heroes of Early Han' },
    zh: '沛縣人,劉邦同鄉。蕭何月下追韓信為劉邦留住兵仙。入關中收秦律詔書圖籍,定漢律九章,為漢家四百年制度奠基。封酇侯,任丞相。',
    en: 'A Pei County native, Liu Bang\'s hometown friend. Famously chased Han Xin under the moon to keep the future "Sage of War." Upon entering Guanzhong he secured the Qin records, laws and maps; codified the Nine Sections of Han Law that grounded four centuries of governance. Marquis of Zan, chancellor.',
  },
  'hist-fan-zeng': {
    era: { zh: '亞父', en: 'Second Father' },
    zh: '居鄛人,七十而出,佐項羽。鴻門宴勸殺劉邦,項羽不聽。後遭陳平離間,辭歸,憤而死於途。「亞父」之稱即項羽尊之。',
    en: 'A native of Juchao; he came to serve Xiang Yu at age seventy. At the Hongmen banquet he urged the killing of Liu Bang — Xiang Yu would not heed. Chen Ping later turned Xiang Yu against him; he resigned and died of rage on the road. Xiang Yu had called him "Second Father."',
  },
  'hist-liu-bang': {
    era: { zh: '漢高祖', en: 'Emperor Gaozu of Han' },
    zh: '字季,沛縣豐邑人。亭長出身。以「約法三章」入關中,鴻門僥倖脫險,垓下圍項羽稱帝,建立漢朝。問計群臣,知張良運籌、蕭何治國、韓信用兵,故得天下。',
    en: 'Style name Ji, of Feng in Pei County. Began as a village constable. Won Guanzhong with the "Covenant of Three Laws," barely escaped Hongmen, surrounded Xiang Yu at Gaixia, and proclaimed himself Emperor. He admitted his strength was knowing whose counsel to use — Zhang Liang\'s strategy, Xiao He\'s government, Han Xin\'s generalship.',
    quote: { zh: '夫運籌策帷帳之中,決勝於千里之外,吾不如子房。', en: 'In planning from within the command tent and deciding victory a thousand li away, I am not Zifang\'s equal.' },
  },
  'hist-lu-zhi': {
    era: { zh: '呂后', en: 'Empress Lü' },
    zh: '字娥姁,單父人。漢高祖皇后,為人剛毅。高祖崩後臨朝稱制十五年,殺韓信、彭越,屠戚夫人,封呂氏為王,然政事不亂,司馬遷列入《本紀》。',
    en: 'Style E\'xu, a Shanfu woman. Empress of Han Gaozu, formidable and unyielding. After his death she ruled "behind the curtain" for fifteen years — killing Han Xin and Peng Yue, butchering Lady Qi, enfeoffing her own clan as kings. Yet government remained orderly, and Sima Qian included her among the imperial Annals.',
  },

  // ─── 兩漢 ──────────────────────────────────────────────────────
  'hist-han-wudi': {
    era: { zh: '漢武帝', en: 'Emperor Wu of Han' },
    zh: '名劉徹,景帝中子。十六歲即位,在位五十四年。罷黜百家,獨尊儒術。北逐匈奴,通西域,設絲綢之路。鹽鐵專營,鑄五銖錢。文治武功,然窮兵黷武,晚年自下《罪己詔》。',
    en: 'Personal name Liu Che, middle son of Emperor Jing. Crowned at 16, reigned 54 years. Dismissed the hundred schools, exalted Confucianism alone. Drove out the Xiongnu, opened the Western Regions and the Silk Road, monopolized salt and iron, minted the five-zhu coin. Both civil and martial glory — and in old age the famous self-blaming edict for his wars.',
  },
  'hist-wei-qing': {
    era: { zh: '長平侯', en: 'Marquis of Changping' },
    zh: '字仲卿,平陽人。出身奴僕,姊衛子夫為皇后。七擊匈奴,收河南地,封大將軍。為人寬仁退讓,不立威於士大夫,故獨終其位。',
    en: 'Style Zhongqing, of Pingyang. Born a slave; his sister Wei Zifu became empress. Seven campaigns against the Xiongnu and the recovery of the Henan district made him Grand General. Generous and self-effacing, he never lorded over the scholar-officials — and so kept his position until death.',
  },
  'hist-huo-qubing': {
    era: { zh: '冠軍侯', en: 'Marquis of Champion' },
    zh: '河東平陽人,衛青外甥。十八歲為驃姚校尉,六擊匈奴,封狼居胥山,禪姑衍山。「匈奴未滅,何以家為」一語震古爍今。年二十四病逝,武帝為其築墓如祁連山。',
    en: 'A Pingyang man, nephew of Wei Qing. At 18 a colonel of swift cavalry; in six campaigns against the Xiongnu he sealed Mount Langjuxu and held sacrifice at Mount Guyan. "The Xiongnu are not yet destroyed; what use have I of a home?" — a line that has echoed for two millennia. Died at 24; Emperor Wu built him a tomb shaped like the Qilian Mountains.',
    quote: { zh: '匈奴未滅,何以家為!', en: 'The Xiongnu are not yet destroyed — what need have I of a home?' },
  },
  'hist-li-guang': {
    era: { zh: '飛將軍', en: 'Flying General' },
    zh: '隴西成紀人。漢七擊匈奴,匈奴呼為「飛將軍」,避而不戰。然命途多舛,終身未封侯。司馬遷嘆「桃李不言,下自成蹊」。',
    en: 'Of Chengji in Longxi. Fought the Xiongnu in seven major campaigns; they called him "Flying General" and would not engage. Yet fortune denied him — he died never having been enfeoffed. Sima Qian sighed: "The peach and the plum speak not, yet a path is worn beneath them."',
  },
  'hist-zhang-qian': {
    era: { zh: '鑿空西域', en: 'He Who Carved Open the Western Regions' },
    zh: '字子文,漢中成固人。武帝建元三年使大月氏,被匈奴拘十年逃歸,後再使烏孫。「鑿空」西域,通絲綢之路,封博望侯。',
    en: 'Style Ziwen, of Chenggu in Hanzhong. Sent by Emperor Wu in 138 BCE to seek alliance with the Yuezhi; held captive by the Xiongnu for ten years before escaping. A second mission reached the Wusun. He "carved open" the Western Regions, founding the Silk Road. Enfeoffed Marquis of Bowang.',
  },
  'hist-su-wu': {
    era: { zh: '蘇武牧羊', en: 'Su Wu Tending Sheep' },
    zh: '字子卿,杜陵人。使匈奴被扣留,放牧北海十九年,持節不屈,白頭歸漢。漢使所為,千古節義之典範。',
    en: 'Style Ziqing, of Duling. Sent as envoy to the Xiongnu, he was detained and sent to herd sheep at Lake Baikal for nineteen years. He never let go of the Han envoy\'s staff, returned with white hair, and stands as the eternal model of loyalty.',
  },
  'hist-ban-chao': {
    era: { zh: '投筆從戎', en: 'Threw down the Brush, Took up the Sword' },
    zh: '字仲升,扶風人。班彪子,班固弟。少嘗為官書傭,擲筆嘆「大丈夫當效傅介子、張騫立功異域」,遂從戎西域。三十一年定西域五十餘國,封定遠侯。',
    en: 'Style Zhongsheng, of Fufeng. Son of Ban Biao, brother of Ban Gu. Once a clerk copying official papers, he threw down his brush and sighed: "A true man should follow Fu Jiezi and Zhang Qian and win merit in foreign lands." Pacified over fifty kingdoms of the Western Regions in thirty-one years.',
    quote: { zh: '不入虎穴,焉得虎子。', en: 'If you do not enter the tiger\'s lair, how will you take its cubs?' },
  },
  'hist-sima-qian': {
    era: { zh: '太史公', en: 'The Grand Historian' },
    zh: '字子長,夏陽人。繼父司馬談之業,任太史令。為李陵辯護觸怒武帝,受宮刑而不死。發憤著《史記》一百三十篇,中國第一部紀傳體通史。',
    en: 'Style Zichang, of Xiayang. Inherited his father\'s post as Grand Astrologer. For defending Li Ling he angered Emperor Wu and chose castration over death — and with that wound composed the 130-chapter Records of the Grand Historian, China\'s first comprehensive history in biographical form.',
    quote: { zh: '人固有一死,或重於泰山,或輕於鴻毛。', en: 'A man must die — but his death may weigh as Mount Tai or as a feather.' },
  },
  'hist-liu-xiu': {
    era: { zh: '漢光武帝', en: 'Emperor Guangwu of Han' },
    zh: '字文叔,南陽蔡陽人。漢室宗親,起兵反新莽。昆陽之戰以八千破王莽四十二萬。建立東漢,光武中興。在位三十二年,務從簡約,息兵養民。',
    en: 'Style Wenshu, of Caiyang in Nanyang. Han clansman who rose against Wang Mang. At Kunyang he routed 420,000 of Wang Mang\'s troops with 8,000. Founded the Eastern Han — the "Guangwu Restoration." Reigned 32 years, ruling with frugality and demobilization.',
  },
  'hist-cai-lun': {
    era: { zh: '造紙術發明', en: 'Inventor of Paper' },
    zh: '東漢宦官,字敬仲,桂陽人。元興元年改進造紙術,以樹皮、麻頭、漁網為料,人稱「蔡侯紙」。中國四大發明之一,改變人類文明。',
    en: 'Eastern Han eunuch, style Jingzhong, of Guiyang. In 105 CE refined paper-making using bark, hemp, and fishing nets — "Marquis Cai\'s paper." One of the Four Great Inventions of China, it changed human civilization.',
  },
  'hist-zhang-heng': {
    era: { zh: '天文星宿之祖', en: 'Astronomer-Pioneer' },
    zh: '字平子,南陽西鄂人。東漢科學家。發明渾天儀、地動儀(候風地動儀),測知千里外地震,著《靈憲》《二京賦》。',
    en: 'Style Pingzi, of Xi\'e in Nanyang. Eastern Han polymath. Invented the armillary sphere and the seismoscope (which detected an earthquake a thousand li away). Author of the "Spiritual Constitution" and "Two Capitals Rhapsody."',
  },

  // ─── 兩晉 ────────────────────────────────────────────────────────
  'hist-wang-xizhi': {
    era: { zh: '書聖', en: 'Sage of Calligraphy' },
    zh: '字逸少,琅琊人。東晉書法家,官右軍將軍。永和九年三月三日蘭亭雅集,作《蘭亭集序》,被譽為「天下第一行書」。',
    en: 'Style Yishao, of Langya. Eastern Jin calligrapher and General of the Right Army. At the Orchid Pavilion gathering in 353 CE he wrote the Preface to the Lanting Collection — "the foremost running-script in the world."',
  },
  'hist-tao-yuanming': {
    era: { zh: '隱逸詩人之宗', en: 'Patriarch of the Hermit Poets' },
    zh: '字元亮,潯陽柴桑人。曾任彭澤令八十一日,「不為五斗米折腰」,賦《歸去來兮辭》而歸隱。著《桃花源記》,千古田園詩之祖。',
    en: 'Style Yuanliang, of Chaisang in Xunyang. Served as magistrate of Pengze for 81 days before refusing to "bend his waist for five bushels of rice." Wrote "The Return" and the legendary "Peach Blossom Spring" — patriarch of pastoral poetry forever after.',
    quote: { zh: '不為五斗米折腰。', en: 'I will not bend my waist for five bushels of rice.' },
  },
  'hist-ji-kang': {
    era: { zh: '竹林七賢之首', en: 'First of the Seven Sages of the Bamboo Grove' },
    zh: '字叔夜,譙國銍人。鍛鐵自娛,通琴道。為司馬昭所殺,刑前彈《廣陵散》,嘆「《廣陵散》於今絕矣」。',
    en: 'Style Shuye, of Zhi in Qiao. He forged iron for pleasure and was master of the qin. Executed by Sima Zhao; before death he played the "Guangling Melody" and sighed: "The Guangling is lost from today."',
    quote: { zh: '《廣陵散》於今絕矣!', en: 'The Guangling melody is lost from this day forth!' },
  },
  'hist-wang-meng': {
    era: { zh: '前秦丞相', en: 'Chancellor of Former Qin' },
    zh: '字景略,北海劇人。捫虱談天下,佐苻堅統一北方,君臣相得無間,「秦主苻堅之得王猛,猶劉備之得諸葛亮」。',
    en: 'Style Jinglue, of Beihai. Famously plucked lice while discoursing on the empire — and so met Fu Jian, with whom he unified the north. The historian wrote: "Fu Jian getting Wang Meng was like Liu Bei getting Zhuge Liang."',
  },

  // ─── 南北朝 ────────────────────────────────────────────────────
  'hist-lanlingwang': {
    era: { zh: '蘭陵王', en: 'Prince of Lanling' },
    zh: '名長恭,北齊宗室。貌如美婦,戰時戴面具入陣。邙山之戰大破周軍,士卒作《蘭陵王入陣曲》。後遭高緯猜忌賜死,年三十三。',
    en: 'Personal name Changgong, a Northern Qi prince. So feminine of face that he wore a fierce mask into battle. Crushed the Zhou army at Mount Mang; his soldiers composed "The Prince of Lanling Enters Battle." Later forced to suicide by Emperor Wei, age 33.',
  },
  'hist-chen-qingzhi': {
    era: { zh: '白袍將軍', en: 'White-Robed General' },
    zh: '字子雲,梁朝名將。率七千白袍兵北伐,連下三十二城,四十七戰皆勝,所向披靡。「名師大將莫自牢,千兵萬馬避白袍」。',
    en: 'Style Ziyun, a great Liang general. Led 7,000 white-robed soldiers north, taking 32 cities and winning 47 battles without a loss. "Famed generals lock themselves in their forts; ten thousand horse and a thousand men flee the white robes."',
  },
  'hist-hua-mulan': {
    era: { zh: '巾幗英雄', en: 'Heroine in Hairpin' },
    zh: '北朝民歌《木蘭辭》之主角。父老無壯弟,代父從軍十二年,凱旋歸鄉。「同行十二年,不知木蘭是女郎」。',
    en: 'Heroine of the Northern Dynasty ballad. Her father was old and her brother too young — so she went to war in his place for twelve years and returned home in glory. "Twelve years marched together — none knew that Mulan was a girl."',
  },

  // ─── 隋 ──────────────────────────────────────────────────────────
  'hist-sui-wendi': {
    era: { zh: '隋文帝', en: 'Emperor Wen of Sui' },
    zh: '名楊堅,弘農華陰人。代周建隋,結束南北朝四百年分裂。創三省六部,行均田制,定開皇律。「開皇之治」為唐朝之先聲。',
    en: 'Personal name Yang Jian, of Huayin. Replaced Northern Zhou and founded the Sui, ending four centuries of north-south division. Created the Three Departments and Six Ministries, the equal-field system, and the Kaihuang Code. The "Kaihuang Reign" foreshadowed the glory of Tang.',
  },
  'hist-sui-yangdi': {
    era: { zh: '隋煬帝', en: 'Emperor Yang of Sui' },
    zh: '名楊廣,文帝次子。築大運河,征高麗三次,巡江都不歸。煊赫一時而二世亡,被宇文化及縊殺於江都。',
    en: 'Personal name Yang Guang, second son of Emperor Wen. Dug the Grand Canal, invaded Goguryeo three times, toured Jiangdu and never returned. Glory in one generation, ruin in the next — strangled at Jiangdu by Yuwen Huaji.',
  },

  // ─── 唐 ──────────────────────────────────────────────────────────
  'hist-tang-taizong': {
    era: { zh: '唐太宗', en: 'Emperor Taizong of Tang' },
    zh: '名李世民,隴西成紀人。玄武門之變繼位。任賢納諫,房謀杜斷,魏徵為鏡。對外破突厥、定吐谷渾,「天可汗」之尊。在位二十三年,「貞觀之治」千古傳頌。',
    en: 'Personal name Li Shimin, of Chengji in Longxi. Took the throne via the Xuanwu Gate Incident. Employed talent and accepted remonstrance — Fang plans, Du decides, Wei Zheng his mirror. Broke the Eastern Turks, settled the Tuyuhun, was hailed as Heavenly Khan. The "Reign of Zhenguan" remains the standard of good government.',
    quote: { zh: '以銅為鏡,可以正衣冠;以人為鏡,可以明得失。', en: 'A bronze mirror straightens cap and robe; a human mirror reveals success and failure.' },
  },
  'hist-li-jing': {
    era: { zh: '軍神', en: 'God of War' },
    zh: '字藥師,京兆三原人。佐唐太宗破突厥於陰山,夜襲頡利可汗於定襄,擒之長安。著《李衛公兵法》,軍神之稱由是而起。',
    en: 'Style Yaoshi, of Sanyuan in Jingzhao. Helped Taizong crush the Eastern Turks at the Yin Mountains, raided Khan Xieli at Dingxiang by night, brought him in chains to Chang\'an. Author of "Duke Li Wei\'s Art of War" — the "God of War."',
  },
  'hist-guo-ziyi': {
    era: { zh: '再造大唐', en: 'Re-builder of Tang' },
    zh: '字子儀,華州鄭縣人。安史之亂以朔方節度使收兩京,又退吐蕃之圍。功蓋一代,主不疑而身富貴,八子七婿皆顯,壽八十五。',
    en: 'Style Ziyi, of Zheng County in Huazhou. During the An Lushan rebellion he recovered both capitals as Jiedushi of Shuofang and later beat back a Tibetan siege. His merit covered an age yet his lord never suspected him; his eight sons and seven sons-in-law all rose to high office. Lived to 85.',
  },
  'hist-xuanzang': {
    era: { zh: '三藏法師', en: 'Tripitaka' },
    zh: '俗名陳禕,洛州緱氏人。貞觀三年西行天竺求法,十七年攜經六百五十七部歸長安,於慈恩寺譯之。著《大唐西域記》,後世吳承恩《西遊記》本之。',
    en: 'Lay name Chen Yi, of Goushi in Luozhou. In 629 CE journeyed to India for scripture; returned in 645 with 657 sutras and translated them at Ci\'en Temple. Author of "Great Tang Records of the Western Regions" — the seed of Wu Cheng\'en\'s "Journey to the West."',
  },
  'hist-wu-zetian': {
    era: { zh: '武周女皇', en: 'Empress of Wu Zhou' },
    zh: '并州文水人。十四歲入唐宮為才人,後立為高宗皇后。臨朝稱制二十一年,稱皇帝改國號周。中國史上唯一女皇帝,在位十五年。',
    en: 'Of Wenshui in Bingzhou. At fourteen entered the Tang palace as a Talent; later became Empress to Gaozong. Ruled "behind the curtain" for 21 years, then proclaimed herself Emperor and changed the dynasty to Zhou. The only female emperor in Chinese history, reigning 15 years.',
  },
  'hist-li-bai': {
    era: { zh: '詩仙', en: 'Immortal of Poetry' },
    zh: '字太白,號青蓮居士,自稱「謫仙人」。喜飲酒,著《將進酒》《蜀道難》《行路難》等千古絕唱。賀知章驚為謫仙。傳醉撈月而死於采石。',
    en: 'Style Taibai, called "Lay Buddhist Green Lotus" and "the banished immortal." A drinker — author of "Bring in the Wine," "The Shu Road is Hard," "Hard is the Way of the World" and many another immortal. He Zhizhang gaped and named him "fallen immortal." Said to have drowned at Caishi reaching for the moon\'s reflection.',
    quote: { zh: '天生我材必有用,千金散盡還復來。', en: 'Heaven gave me talent — there must be a use; spend a thousand gold and it returns.' },
  },
  'hist-du-fu': {
    era: { zh: '詩聖', en: 'Sage of Poetry' },
    zh: '字子美,自號少陵野老,鞏縣人。一生顛沛,寄寓成都草堂。詩近一千五百首,真實反映安史之亂民生疾苦,世稱「詩史」。',
    en: 'Style Zimei, called "Old Man of Shaoling," of Gong County. A lifetime of wandering; settled in a thatched hut in Chengdu. Some 1,500 poems survive — a true record of suffering during the An Lushan rebellion, called "the poetic history" of the age.',
  },
  'hist-yan-zhenqing': {
    era: { zh: '顏體鼻祖', en: 'Founder of Yan-Style Calligraphy' },
    zh: '字清臣,京兆萬年人。書法家,「顏體」開唐代雄渾一派。安史亂中起兵討叛,叔姪同殉節。李希烈叛,使其招降,大罵不屈而死。',
    en: 'Style Qingchen, of Wannian in Jingzhao. Calligrapher — his "Yan style" defined the heroic mode of Tang. During the An Lushan revolt he raised troops against the rebels; he and his nephew Yan Gaoqing died together as martyrs. Sent to win over Li Xilie, he cursed the rebel to his face and was killed.',
  },

  // ─── 五代 / 遼 ──────────────────────────────────────────────────
  'hist-abaoji': {
    era: { zh: '遼太祖', en: 'Emperor Taizu of Liao' },
    zh: '名耶律阿保機,契丹迭剌部人。統一契丹八部,建契丹國,定都上京。創契丹大字,行雙軌制(南北面官),奠定遼朝二百年基業。',
    en: 'Personal name Yelü Abaoji, of the Dielie clan of the Khitan. Unified the eight Khitan tribes and founded the Khitan state, capital at Shangjing. Created the Khitan large script and the dual administration (Northern and Southern bureaus) — foundation of the two-century Liao dynasty.',
  },
  'hist-li-yu': {
    era: { zh: '南唐後主', en: 'Last Ruler of Southern Tang' },
    zh: '字重光,南唐元宗第六子。亡國降宋,封違命侯。所作《虞美人》《浪淘沙》血淚之詞傳世。「春花秋月何時了」一闋,千古絕響。',
    en: 'Style Chongguang, sixth son of Yuanzong of Southern Tang. After surrender to Song he was demoted to "Marquis of Disobedience." His tear-stained ci poems — "Yu Mei Ren," "Lang Tao Sha" — survive. "When will the spring flowers and autumn moon be done?" — an immortal lyric of grief.',
    quote: { zh: '問君能有幾多愁,恰似一江春水向東流。', en: 'Ask how much sorrow can a man have — it is like a river of spring water flowing east without end.' },
  },

  // ─── 宋 ──────────────────────────────────────────────────────────
  'hist-zhao-kuangyin': {
    era: { zh: '宋太祖', en: 'Emperor Taizu of Song' },
    zh: '字元朗,涿郡人。後周禁軍統帥,陳橋兵變黃袍加身,代周建宋。「杯酒釋兵權」收武將兵柄,定下宋朝重文輕武之制。',
    en: 'Style Yuanlang, of Zhuojun. Commander of the Later Zhou imperial guards; the Chenqiao Mutiny draped the yellow robe upon him and he founded Song. The famous "wine cup releases generals" stripped his old comrades of their commands and set Song\'s civilian-over-military tradition.',
  },
  'hist-fan-zhongyan': {
    era: { zh: '范文正公', en: 'Lord Wenzheng of Fan' },
    zh: '字希文,蘇州吳縣人。慶曆新政主帥,守延安以「軍中有一范,西賊聞之驚破膽」。著《岳陽樓記》,「先天下之憂而憂,後天下之樂而樂」千古傳誦。',
    en: 'Style Xiwen, of Wu County in Suzhou. Head of the Qingli Reform; his garrison of Yan\'an inspired the Xixia\'s lament that "with one Fan in the army the western barbarians lose heart." Author of "On Yueyang Tower" — "Worry before the world worries, rejoice after the world rejoices."',
    quote: { zh: '先天下之憂而憂,後天下之樂而樂。', en: 'Worry before the world worries; rejoice only after the world rejoices.' },
  },
  'hist-bao-zheng': {
    era: { zh: '包青天', en: 'Bao the Clear-Sky Judge' },
    zh: '字希仁,廬州合肥人。宋朝名臣,鐵面無私,執法如山。權知開封府,審奇案,平冤獄,陳州糶米。後世神化為閻羅判官,「包公案」廣傳。',
    en: 'Style Xiren, of Hefei in Luzhou. The most celebrated Song magistrate — iron-faced and inflexible. As acting governor of Kaifeng he tried strange cases and corrected miscarriages; the "Chenzhou Rice" affair is famous. Later folklore made him a judge of the underworld.',
  },
  'hist-wang-anshi': {
    era: { zh: '荊國公', en: 'Duke of Jing' },
    zh: '字介甫,撫州臨川人。神宗熙寧變法主帥,行青苗、免役、市易、保甲諸法。「天變不足畏,祖宗不足法,人言不足恤」之語,千年爭議。',
    en: 'Style Jiefu, of Linchuan in Fuzhou. Architect of Emperor Shenzong\'s Xining Reforms — the Green Sprouts, Conscription Exemption, Market Exchange, and Mutual Security laws. "Heaven\'s changes need not be feared, the ancestors need not be followed, men\'s words need not be heeded" — a manifesto that has divided opinion for a thousand years.',
  },
  'hist-sima-guang': {
    era: { zh: '溫公', en: 'Lord Wen' },
    zh: '字君實,陝州夏縣人。北宋史學家,主編《資治通鑑》二百九十四卷,十九年成書。反對王安石新法,為舊黨領袖。',
    en: 'Style Junshi, of Xia County in Shaanzhou. Northern Song historian; chief editor of the Comprehensive Mirror to Aid Government in 294 chapters, nineteen years in the making. Opposed Wang Anshi\'s reforms — leader of the conservative faction.',
  },
  'hist-su-shi': {
    era: { zh: '東坡居士', en: 'Layman of the Eastern Slope' },
    zh: '字子瞻,號東坡,眉州眉山人。北宋文豪,詩、詞、賦、散文、書、畫無一不精。烏台詩案貶黃州,築東坡為食。「大江東去」之詞氣吞萬古。',
    en: 'Style Zizhan, called "Layman of the Eastern Slope," of Meishan in Meizhou. Northern Song polymath — poet, lyricist, essayist, calligrapher, painter. The "Crow Terrace Poems Case" sent him to Huangzhou, where he built his "Eastern Slope" and farmed for food. "The great river flows east" — his ci has the wind of all ages.',
    quote: { zh: '人有悲歡離合,月有陰晴圓缺。', en: 'Men have parting and reunion, joy and sorrow; the moon waxes, wanes, is full and dark.' },
  },
  'hist-yue-fei': {
    era: { zh: '武穆王', en: 'Prince Wumu' },
    zh: '字鵬舉,相州湯陰人。岳家軍紀律嚴明,「凍死不拆屋,餓死不擄掠」。連敗金兵,直搗黃龍。秦檜以「莫須有」三字殺之風波亭,年三十九。',
    en: 'Style Pengju, of Tangyin in Xiangzhou. The Yue Army was famous for discipline — "freeze to death rather than break a house, starve rather than plunder." He repeatedly broke the Jin and aimed to "march straight to Huanglong." Qin Hui killed him at the Wave Pavilion on the words "perhaps it could be so" — at thirty-nine.',
    quote: { zh: '直搗黃龍,與諸君痛飲爾。', en: 'Straight to Huanglong — and there I will drink deep with you all.' },
  },
  'hist-li-qingzhao': {
    era: { zh: '婉約詞宗', en: 'Mistress of Wanyue Ci' },
    zh: '號易安居士,濟南人。宋代女詞人。趙明誠之妻,夫婦同好金石。國破家亡之後詞風淒苦,「尋尋覓覓,冷冷清清」一首足傳千古。',
    en: 'Called "Yi\'an Jushi," of Jinan. Song dynasty female ci poet. Wife of Zhao Mingcheng — together they collected antiquities. After the fall of the north her ci turned anguished. "Searching, searching, cold, cold, lonely, lonely" alone immortalized her.',
  },
  'hist-wen-tianxiang': {
    era: { zh: '宋末三傑', en: 'One of the Three Heroes of Song\'s End' },
    zh: '字宋瑞,廬陵人。狀元出身,南宋丞相。崖山之後被俘,在燕京獄三年不降,作《正氣歌》、《過零丁洋》,從容就義。',
    en: 'Style Songrui, of Luling. A top metropolitan-exam graduate; chancellor of late Southern Song. After Yamen he was taken to Yanjing and held three years; he refused to surrender. Wrote "Song of the Right Spirit" and "Crossing Lingding Sea" and went calmly to execution.',
    quote: { zh: '人生自古誰無死,留取丹心照汗青。', en: 'Since antiquity who has not died? Leave behind a loyal heart to shine in the histories.' },
  },
  'hist-aguda': {
    era: { zh: '金太祖', en: 'Emperor Taizu of Jin' },
    zh: '名完顏阿骨打,女真人。起兵於黑龍江,十年滅遼,建立大金。創女真文字。',
    en: 'Personal name Wanyan Aguda, of the Jurchens. Raised forces on the Heilongjiang, destroyed Liao in ten years, founded the great Jin. Created the Jurchen script.',
  },
  'hist-wuzhu': {
    era: { zh: '金兀朮', en: 'Wuzhu' },
    zh: '名完顏宗弼,金太祖第四子。三犯江南,搜山檢海擒宋帝。郾城、潁昌兩敗於岳飛之手,有「撼山易,撼岳家軍難」之嘆。',
    en: 'Personal name Wanyan Zongbi, fourth son of Emperor Taizu of Jin. Three times invaded south of the Yangtze, "combing the mountains and dredging the sea" for the Song emperor. Twice broken by Yue Fei at Yancheng and Yingchang — "easier to shake a mountain than to shake the Yue Army."',
  },

  // ─── 元 ──────────────────────────────────────────────────────────
  'hist-genghis': {
    era: { zh: '成吉思汗', en: 'Genghis Khan' },
    zh: '名鐵木真,蒙古乞顏部人。統一蒙古諸部,西征花剌子模、東征金國,鐵騎縱橫歐亞。元朝建立的奠基者。',
    en: 'Personal name Temüjin, of the Borjigin clan of the Mongols. Unified the Mongol tribes, swept west against Khwarezm and east against Jin, his cavalry crossing Eurasia. Founder of what would become the Yuan dynasty.',
    quote: { zh: '人生最大的快樂,便是殺敵致果,奪其所有。', en: 'A man\'s greatest joy is to crush his enemies and take their possessions.' },
  },
  'hist-kublai': {
    era: { zh: '元世祖', en: 'Emperor Shizu of Yuan' },
    zh: '名忽必烈,拖雷之子。建立元朝,定都大都(北京)。攻南宋滅之,一統中華。馬可波羅入朝,記其盛景。',
    en: 'Personal name Kublai, son of Tolui. Founded the Yuan dynasty with capital at Dadu (modern Beijing). Conquered Southern Song to unify China. Hosted Marco Polo, who recorded the splendor of his court.',
  },
  'hist-subutai': {
    era: { zh: '蒙古第一名將', en: 'Mongolia\'s Greatest General' },
    zh: '兀良哈部人,鐵木真四犬之一。北滅西夏,西征欽察、俄羅斯,東征金國,一生大小三十二戰,被譽蒙古第一名將。',
    en: 'Of the Uriankhai. One of Genghis\'s "Four Hounds." Crushed Western Xia, drove west against the Kipchaks and Rus, east against Jin. Thirty-two campaigns — hailed as the foremost general of the Mongols.',
  },
  'hist-yelu-chucai': {
    era: { zh: '元初賢相', en: 'Early Yuan Worthy Chancellor' },
    zh: '字晉卿,契丹皇族後裔。仕窩闊台,勸蒙古汗保留農耕、行漢制,免天下生民塗炭。',
    en: 'Style Jinqing, descendant of Liao imperial blood. Served Ögedei Khan; persuaded the Mongols to preserve agriculture and adopt Chinese institutions, sparing countless lives.',
  },

  // ─── 明 ──────────────────────────────────────────────────────────
  'hist-zhu-yuanzhang': {
    era: { zh: '明太祖', en: 'Emperor Taizu of Ming' },
    zh: '字國瑞,濠州鍾離人。乞丐出身,投紅巾軍。陳友諒、張士誠相繼破之,北逐元順帝建明朝。在位三十一年,殺功臣以固皇權,《大誥》峻法。',
    en: 'Style Guorui, of Zhongli in Haozhou. From beggar to red turban to emperor. Broke Chen Youliang and Zhang Shicheng, drove Emperor Shun of Yuan north, and founded the Ming. Reigned 31 years — purged the founding generals to secure his throne; the "Grand Pronouncements" code was savage.',
  },
  'hist-yongle': {
    era: { zh: '明成祖', en: 'Emperor Chengzu of Ming' },
    zh: '名朱棣,太祖第四子,封燕王。「靖難之役」奪侄建文帝皇位,遷都北京。命鄭和七下西洋,纂《永樂大典》,五征漠北。',
    en: 'Personal name Zhu Di, fourth son of Taizu, Prince of Yan. Through the "Jingnan Campaign" he overthrew his nephew the Jianwen Emperor, then moved the capital to Beijing. Sent Zheng He on seven voyages, compiled the "Yongle Encyclopedia," and led five northern expeditions.',
  },
  'hist-zheng-he': {
    era: { zh: '三寶太監', en: 'Sanbao the Eunuch' },
    zh: '雲南昆陽人,本姓馬。永樂三年起七下西洋,船隊兩萬七千人,寶船九桅,遠至非洲東岸。世界航海史上空前壯舉。',
    en: 'Of Kunyang in Yunnan, born Ma. From 1405 led seven voyages to the Western Ocean — 27,000 men, nine-mast treasure ships, reaching the east coast of Africa. An achievement unparalleled in world maritime history.',
  },
  'hist-yu-qian': {
    era: { zh: '于少保', en: 'Lord Junior Protector Yu' },
    zh: '字廷益,錢塘人。土木堡之變後力保北京,擁立景帝,擊退也先,挽明朝於既倒。「粉骨碎身渾不怕,要留清白在人間」一聯如其志。',
    en: 'Style Tingyi, of Qiantang. After the Tumu disaster he saved Beijing, enthroned Emperor Jing, beat back Esen, and rescued the Ming from collapse. "Though body be ground to powder, leave purity on this earth" — his couplet sums up the man.',
  },
  'hist-wang-shouren': {
    era: { zh: '陽明先生', en: 'Master Yangming' },
    zh: '字伯安,號陽明,餘姚人。明代思想家,「心學」集大成。「知行合一」「致良知」之說影響東亞五百年。亦能用兵,平寧王宸濠之亂。',
    en: 'Style Bo\'an, named "Yangming," of Yuyao. The great Ming philosopher; synthesizer of "Mind Studies." His doctrines — "unity of knowing and doing," "extending innate moral knowledge" — have shaped East Asia for five centuries. Also a capable general — suppressed Prince Ning\'s rebellion.',
  },
  'hist-qi-jiguang': {
    era: { zh: '抗倭名將', en: 'Anti-Pirate Hero' },
    zh: '字元敬,登州人。明嘉靖朝抗倭名將。創鴛鴦陣,訓練「戚家軍」,九戰九捷掃平東南倭患。著《紀效新書》《練兵實紀》。',
    en: 'Style Yuanjing, of Dengzhou. Greatest of the Ming anti-pirate generals. Invented the Mandarin Duck Formation; trained the "Qi Army" — nine engagements, nine victories — and cleared the southeast coast. Author of the "New Treatise on Military Efficiency" and "Records of Practical Training."',
  },
  'hist-luo-guanzhong': {
    era: { zh: '三國演義作者', en: 'Author of Romance of the Three Kingdoms' },
    zh: '名本,字貫中,號湖海散人,太原人。元末明初小說家。著《三國演義》,中國第一部章回體歷史小說,影響東亞文化六百年。',
    en: 'Personal name Ben, style Guanzhong, called "Wanderer of Lake and Sea," of Taiyuan. Late Yuan / early Ming novelist. Author of "Romance of the Three Kingdoms," China\'s first chaptered historical novel, shaping East Asian culture for six centuries.',
  },
  'hist-shi-nai’an': {
    era: { zh: '水滸傳作者', en: 'Author of Outlaws of the Marsh' },
    zh: '名耳,字子安,興化人。元末明初小說家。著《水滸傳》,梁山泊一百零八好漢之事,中國四大奇書之一。',
    en: 'Personal name Er, style Zi\'an, of Xinghua. Late Yuan / early Ming novelist. Author of "Outlaws of the Marsh," the saga of the 108 heroes of Liangshan Marsh — one of China\'s Four Great Classical Novels.',
  },
  'hist-wu-cheng’en': {
    era: { zh: '西遊記作者', en: 'Author of Journey to the West' },
    zh: '字汝忠,號射陽山人,淮安人。著《西遊記》,以玄奘法師取經為本,塑造孫悟空、豬八戒、沙僧之魔幻世界。',
    en: 'Style Ruzhong, called "Shooting-Sun Mountaineer," of Huai\'an. Author of "Journey to the West" — adapted from Xuanzang\'s pilgrimage, creating the magical world of Sun Wukong, Pigsy, and Friar Sand.',
  },
  'hist-zheng-chenggong': {
    era: { zh: '國姓爺', en: 'Koxinga' },
    zh: '字明儼,泉州南安人。明隆武帝賜國姓朱,故稱「國姓爺」。抗清復明,渡海驅荷蘭人於台灣,建東寧政權。',
    en: 'Style Mingyan, of Nan\'an in Quanzhou. Granted the Ming imperial surname Zhu by Emperor Longwu — hence "Koxinga." Resisted Qing, sailed to Taiwan and drove out the Dutch, founded the Dongning regime.',
  },

  // ─── 清 ──────────────────────────────────────────────────────────
  'hist-nurhaci': {
    era: { zh: '清太祖', en: 'Emperor Taizu of Qing' },
    zh: '名愛新覺羅·努爾哈赤,女真建州左衛人。以十三副遺甲起兵,統一女真各部,創八旗,建後金。發《七大恨》討明,薩爾滸大破明軍。',
    en: 'Personal name Aisin-Gioro Nurhaci, of the Jianzhou Left Banner of the Jurchens. Raised an army with thirteen sets of armor inherited from his ancestors; unified the Jurchen tribes, established the Eight Banners, founded Later Jin. Issued the "Seven Grievances" against Ming; crushed the Ming at Sarhu.',
  },
  'hist-kangxi': {
    era: { zh: '康熙大帝', en: 'Emperor Kangxi' },
    zh: '名愛新覺羅·玄燁,在位六十一年,中國史上最久。擒鰲拜、平三藩、收台灣、徵噶爾丹、定西藏。「康乾盛世」之始。',
    en: 'Personal name Aisin-Gioro Xuanye. Reigned sixty-one years — the longest in Chinese history. Seized Oboi, suppressed the Three Feudatories, took Taiwan, campaigned against Galdan, secured Tibet. Began the "Kang-Qian Flourishing Age."',
  },
  'hist-qianlong': {
    era: { zh: '十全老人', en: 'Old Man of Ten Perfect Achievements' },
    zh: '名愛新覺羅·弘曆。雍正第四子。在位六十年,實際統治六十三年。自封「十全武功」,然晚年寵和珅,埋下清朝衰敗之種子。',
    en: 'Personal name Aisin-Gioro Hongli, fourth son of Yongzheng. Reigned 60 years, ruled 63. Boasted of "ten perfect military achievements"; in old age favored Heshen, planting the seeds of Qing\'s decline.',
  },
  'hist-zeng-guofan': {
    era: { zh: '湘軍始祖', en: 'Founder of the Xiang Army' },
    zh: '字伯涵,湘鄉人。創湘軍平太平天國,「結硬寨,打呆仗」。為人嚴正,著《曾文正公家書》。後世奉為儒將典範。',
    en: 'Style Bohan, of Xiangxiang. Founded the Xiang Army that crushed the Taiping — "build solid camps, fight stupid battles." Strict and upright; author of the "Family Letters of Lord Wenzheng." A model Confucian general.',
  },
  'hist-zuo-zongtang': {
    era: { zh: '左文襄公', en: 'Lord Wenxiang of Zuo' },
    zh: '字季高,湘陰人。平太平、捻軍,西征收復新疆,抬棺出征。「身無半畝,心憂天下」之語見其志。',
    en: 'Style Jigao, of Xiangyin. Suppressed the Taiping and Nian rebellions, then campaigned west and recovered Xinjiang, marching with his coffin behind him. "I have not half a mu of land, yet my heart frets for the empire" — the man in a line.',
  },
  'hist-lin-zexu': {
    era: { zh: '虎門銷煙', en: 'Smoke-Burner of Humen' },
    zh: '字元撫,福州侯官人。任欽差大臣赴廣州禁煙,虎門海邊銷英商鴉片二萬箱。中英鴉片戰爭由此而起。「苟利國家生死以,豈因禍福避趨之」。',
    en: 'Style Yuanfu, of Houguan in Fuzhou. As imperial commissioner to Guangzhou he destroyed 20,000 chests of British opium at Humen — sparking the First Opium War. "If it serves the state, I will face life and death; should I shrink from fortune or misfortune?"',
  },
  'hist-cixi': {
    era: { zh: '慈禧太后', en: 'Empress Dowager Cixi' },
    zh: '葉赫那拉氏,咸豐妃。同治、光緒兩朝臨朝聽政四十七年,實際清朝末期之主。鎮戊戌變法,囚光緒。',
    en: 'Of the Yehe Nara clan, consort of Xianfeng. Held court "behind the curtain" for 47 years under Tongzhi and Guangxu — effective ruler of late Qing. Crushed the Hundred Days\' Reform, imprisoned Guangxu.',
  },
  'hist-tan-sitong': {
    era: { zh: '戊戌六君子之首', en: 'First of the Six Martyrs of 1898' },
    zh: '字復生,湖南瀏陽人。著《仁學》。戊戌變法失敗,自願赴死,「我自橫刀向天笑,去留肝膽兩崑崙」。',
    en: 'Style Fusheng, of Liuyang in Hunan. Author of "On Benevolence." When the Hundred Days\' Reform failed he refused to flee. "I face the sword and laugh at heaven — gone or staying, my liver and gall stand as two K\'unlun mountains."',
    quote: { zh: '我自橫刀向天笑,去留肝膽兩崑崙。', en: 'I face the sword and laugh at heaven; gone or staying, my liver and gall stand as twin K\'unlun mountains.' },
  },
  'hist-cao-xueqin': {
    era: { zh: '紅樓夢作者', en: 'Author of Dream of the Red Chamber' },
    zh: '名霑,字夢阮,號雪芹,滿洲正白旗。家世顯赫,後家道中落,「批閱十載,增刪五次」成《紅樓夢》八十回,千古絕唱。',
    en: 'Personal name Zhan, style Mengruan, "Snow Celery" his sobriquet, of the Bordered White Banner. Born to splendor, fallen to poverty — "ten years reviewing, five times revising" he completed eighty chapters of "Dream of the Red Chamber." A wonder of literature without peer.',
    quote: { zh: '滿紙荒唐言,一把辛酸淚。', en: 'A page full of absurd words, a handful of bitter tears.' },
  },
  'hist-pu-songling': {
    era: { zh: '聊齋先生', en: 'Master of the Studio of Leisure' },
    zh: '字留仙,號柳泉居士,淄川人。屢試不第,設帳教書。著《聊齋誌異》四百餘篇,「孤憤之書」也,鬼狐故事千古傳唱。',
    en: 'Style Liuxian, called "Lay Buddhist of the Willow Spring," of Zichuan. Failed the exams repeatedly and lived as a tutor. Author of "Strange Tales from the Studio of Leisure" — over 400 pieces, "a book of lonely indignation," whose ghost-fox stories endure.',
  },

  // ─── Phase 24 — additional biographies for gap-fill ───
  'hist-wang-xianzhi': {
    era: { zh: '小聖', en: 'Lesser Sage' },
    zh: '字子敬,王羲之第七子。書法承父衣鉢,世稱「二王」。年方七歲學書,父抽筆不脫,即知其志。',
    en: 'Style Zijing, seventh son of Wang Xizhi. Inherited his father\'s calligraphy — the two are called "the Two Wangs." At seven Wang Xizhi tried to pull the brush from his grip and could not — his father knew the boy\'s will was set.',
  },
  'hist-fu-jian': {
    era: { zh: '前秦天王', en: 'Heavenly King of Former Qin' },
    zh: '字永固,氐族。十年統一北方。淝水之戰投鞭斷流,卻為東晉謝玄八千破八十萬,「風聲鶴唳」「草木皆兵」之典皆出於此。',
    en: 'Style Yonggu, of the Di people. In ten years he unified the north. At the Fei River he boasted that his "whips could dam the stream" — and was broken by Xie Xuan\'s 8,000 against his 800,000. "The wind in the rushes" and "every grass a soldier" both came from this disaster.',
  },
  'hist-murong-chui': {
    era: { zh: '後燕世祖', en: 'World-Ancestor of Later Yan' },
    zh: '字道明,鮮卑慕容皝第五子。淝水之戰後逃出長安,復興燕國。文武兼資,馬上得天下,為十六國時期第一名將。',
    en: 'Style Daoming, fifth son of Murong Huang. After the Fei River disaster he escaped Chang\'an and restored Yan. Equally adept in arms and letters, he won an empire from the saddle — the foremost general of the Sixteen Kingdoms era.',
  },
  'hist-tuoba-tao': {
    era: { zh: '北魏太武帝', en: 'Emperor Taiwu of Northern Wei' },
    zh: '北魏第三主,鮮卑拓跋燾。十二歲即位,西平赫連,北滅柔然,東破馮跋,南陷青齊,統一北方。',
    en: 'Third sovereign of Northern Wei, of the Xianbei Tuoba clan. Crowned at twelve, he conquered the Helian, broke the Rouran, smashed Feng Ba, took Qi province from the south — and unified the north.',
  },
  'hist-yuan-hong': {
    era: { zh: '北魏孝文帝', en: 'Emperor Xiaowen of Northern Wei' },
    zh: '名拓跋宏,後改元宏。遷都洛陽,禁鮮卑語,改漢姓,著漢服,促鮮卑漢化。中華民族大融合奠基者。',
    en: 'Personal name Tuoba Hong, later Yuan Hong. Moved the capital to Luoyang, banned the Xianbei language, took Chinese surnames, donned Han robes — driving the Xianbei into the Chinese fold. Foundational architect of ethnic fusion.',
  },
  'hist-xiao-yan': {
    era: { zh: '梁武帝', en: 'Emperor Wu of Liang' },
    zh: '字叔達,蘭陵人。代齊建梁,在位四十八年。崇佛三次捨身同泰寺,著《淨業賦》。侯景之亂被困臺城,餓死。',
    en: 'Style Shuda, of Lanling. Replaced Qi and founded Liang, reigning 48 years. Thrice "renounced the throne" to enter the Tongtai Monastery. During the Hou Jing rebellion he was besieged in Taicheng and starved to death.',
  },
  'hist-feng-taihou': {
    era: { zh: '北魏馮太后', en: 'Empress Dowager Feng of Northern Wei' },
    zh: '北燕馮弘孫女,北魏文成帝皇后。獻文、孝文兩朝臨朝聽政二十年,推行均田制、三長制,孝文帝漢化改革之奠基。',
    en: 'Granddaughter of Feng Hong of Northern Yan, empress to Emperor Wencheng of Northern Wei. Held court "behind the curtain" for twenty years under Xianwen and Xiaowen, implementing the equal-field and three-elder systems — the foundation of Xiaowen\'s sinicization.',
  },
  'hist-anlu-shan': {
    era: { zh: '安史之亂', en: 'The An–Shi Rebellion' },
    zh: '營州柳城雜種胡人。玄宗朝節度使,身兼平盧、范陽、河東三鎮。天寶十四載起兵反唐,陷兩京,稱大燕皇帝。後被其子安慶緒所殺。',
    en: 'A mixed-blood Sogdian of Liucheng. Under Emperor Xuanzong he held three frontier commands at once. In 755 he raised the great rebellion, took both capitals, proclaimed himself Emperor of Great Yan — and was murdered by his own son An Qingxu.',
  },
  'hist-huang-chao': {
    era: { zh: '黃巢之亂', en: 'The Huang Chao Rebellion' },
    zh: '曹州冤句人,鹽商出身。乾符二年起義,流動作戰,陷洛陽長安,稱大齊皇帝。雖敗,動搖唐祚根基。「待到秋來九月八,我花開後百花殺」。',
    en: 'A salt smuggler of Yuanju in Caozhou. Rose in 875, fought a mobile campaign that took Luoyang and Chang\'an, and proclaimed himself Emperor of Great Qi. He failed — but the Tang foundation was shaken. "When September the eighth comes round, my flowers will bloom and kill all others."',
  },
  'hist-zhu-wen': {
    era: { zh: '後梁太祖', en: 'Emperor Taizu of Later Liang' },
    zh: '字全忠,宋州碭山人。黃巢部將降唐,進封梁王。天祐四年篡唐建梁,結束唐祚二百八十九年,開五代之亂。',
    en: 'Style Quanzhong, of Dangshan in Songzhou. A general of Huang Chao who surrendered to Tang and was enfeoffed Prince of Liang. In 907 he usurped the throne and founded Liang, ending Tang\'s 289 years and beginning the chaos of the Five Dynasties.',
  },
  'hist-meng-tian-qin': {
    era: { zh: '蒙恬', en: 'Meng Tian' },
    zh: '齊國人。秦始皇大將,率三十萬眾北擊匈奴。築長城西起臨洮東至遼東,跨幽州、燕、代、塞,萬餘里。秦二世時遭趙高陷害自盡。',
    en: 'Of Qi. Senior commander under the First Emperor, leading 300,000 against the Xiongnu. Built the Great Wall from Lintao to Liaodong, over ten thousand li across Yan, Dai, and Sai. Forced to suicide by Zhao Gao under the Second Emperor.',
  },
  'hist-zhao-gao': {
    era: { zh: '指鹿為馬', en: 'Pointing to a Deer and Calling it a Horse' },
    zh: '秦宦官,任中車府令。秦始皇崩,矯詔殺扶蘇、立胡亥,擅權朝政。「指鹿為馬」之典出此。後被子嬰所殺。',
    en: 'A eunuch and superintendent of carriages. When the First Emperor died, he forged the testament to kill Fusu and enthrone Huhai, then ruled the court. The famous "point to a deer and call it a horse" loyalty test was his. Killed by Ziying.',
    quote: { zh: '指鹿為馬。', en: 'Point to a deer and call it a horse.' },
  },
  'hist-zhu-xi': {
    era: { zh: '朱子', en: 'Master Zhu' },
    zh: '字元晦,徽州婺源人。南宋理學集大成者。「存天理,滅人欲」,作《四書集注》,奠定七百年科舉教本之基。',
    en: 'Style Yuanhui, of Wuyuan in Huizhou. The Southern Song master of Neo-Confucianism. "Preserve heavenly principle, eliminate human desire." His "Collected Commentaries on the Four Books" anchored seven hundred years of the imperial examination curriculum.',
  },
  'hist-bai-juyi': {
    era: { zh: '香山居士', en: 'Layman of Xiangshan' },
    zh: '字樂天,號香山居士。中唐詩人,主張「文章合為時而著,歌詩合為事而作」。著《長恨歌》《琵琶行》,平易近人,老嫗能解。',
    en: 'Style Letian, called "Layman of Xiangshan." Middle-Tang poet who held that "writing must serve its age, songs must serve their occasion." Wrote "Song of Everlasting Sorrow" and "Pipa Lute" — so plain that an old woman could understand.',
  },
  'hist-zhao-feiyan': {
    era: { zh: '掌上輕燕', en: 'Featherweight on the Palm' },
    zh: '漢成帝皇后。體輕善舞,傳能立於人掌之上。與妹合德並寵,姊妹獨擅後宮十年。',
    en: 'Empress to Emperor Cheng of Han. So light and graceful she could supposedly dance on a man\'s palm. With her sister Hede she monopolized the harem for a decade.',
  },
  'hist-wang-zhaojun': {
    era: { zh: '昭君出塞', en: 'Wang Zhaojun Leaves the Pass' },
    zh: '名嬙,字昭君,南郡秭歸人。漢元帝宮女,自願和親嫁呼韓邪單于。「沉魚落雁」之雁即昭君。',
    en: 'Personal name Qiang, style Zhaojun, of Zigui in Nanjun. A palace woman under Emperor Yuan of Han, she volunteered to marry the Chanyu of the Xiongnu. The "fallen geese" of "fish sink, geese fall" refers to her — geese forgot to fly at the sight of her face.',
  },
  'hist-shi-le': {
    era: { zh: '後趙明帝', en: 'Emperor Ming of Later Zhao' },
    zh: '羯族,出身奴隸。佐劉淵,後自立為帝。一生不識字而通史書,以人講授而能評議。十六國時期罕見梟雄。',
    en: 'A Jie tribesman, born a slave. Served Liu Yuan, then proclaimed himself emperor. Could not read a character — yet had histories read aloud to him and judged them with insight. A rare ruler of the Sixteen Kingdoms era.',
  },
  'hist-mu-guiying': {
    era: { zh: '楊家將女將', en: 'Yang-Family Heroine' },
    zh: '楊宗保之妻,降龍木破天門陣。後楊家男丁盡死於遼,百歲掛帥西征,平西夏。',
    en: 'Wife of Yang Zongbao. Wielded the Subdue-Dragon Wood to break the Heavenly Gate Formation. When all the Yang men had fallen to the Liao, at a hundred years old she took the standard and led the campaign west against Western Xia.',
  },
  'hist-bian-que': {
    era: { zh: '神醫', en: 'Divine Healer' },
    zh: '名秦越人,渤海郡鄭人。中華醫學之祖。傳能洞見人臟腑,望色聞聲即知病。蔡桓公諱疾忌醫,五日後骨髓侵骨,病入膏肓。',
    en: 'Personal name Qin Yueren, of Zheng in Bohai. Father of Chinese medicine. Said to see straight into the viscera; from face and voice he knew the illness. Duke Huan of Cai concealed his disease — five days later it had penetrated the marrow, and could not be cured.',
  },
  'hist-mencius': {
    era: { zh: '亞聖', en: 'Sub-Sage' },
    zh: '名軻,字子輿,鄒人。受業於子思之門人。提出「性善論」「民貴君輕」「仁政」之說,與孔子並稱「孔孟」。',
    en: 'Personal name Ke, style Ziyu, of Zou. Studied under disciples of Zisi (Confucius\' grandson). Proposed the theories of "innate goodness," "the people are precious, the ruler is light," and "benevolent government." Paired with Confucius as "Kong–Meng."',
    quote: { zh: '民為貴,社稷次之,君為輕。', en: 'The people are most precious, the altars of state come next, the ruler is light.' },
  },
  'hist-xunzi': {
    era: { zh: '荀子', en: 'Master Xun' },
    zh: '名況,字卿,趙國人。先秦最後一位儒學大師。提出「性惡論」,主張隆禮重法。弟子李斯、韓非皆法家集大成者。',
    en: 'Personal name Kuang, style Qing, of Zhao. The last great Confucian of the pre-Qin era. Proposed the theory of "innate human evil"; advocated honoring ritual and emphasizing law. His disciples Li Si and Han Fei became the founders of Legalism.',
  },
  'hist-mozi': {
    era: { zh: '墨子', en: 'Master Mo' },
    zh: '名翟,魯國人。墨家學派創始人。主張「兼愛」「非攻」「節用」「尚賢」。與儒家並稱「儒墨顯學」。',
    en: 'Personal name Di, of Lu. Founder of the Mohist school. Advocated "universal love," "non-aggression," "frugality," and "promotion of the worthy." With the Confucians, his school was one of the two "prominent learnings" of the pre-Qin.',
  },
  'hist-wei-zheng': {
    era: { zh: '人鏡', en: 'Mirror of Men' },
    zh: '字玄成,巨鹿人。唐太宗時諫議大夫,屢諫太宗,前後二百餘事,太宗從之而不違。死後,太宗嘆「人鏡亡矣」。',
    en: 'Style Xuancheng, of Julu. Remonstrator under Emperor Taizong, who pressed over 200 admonitions on the throne — and Taizong followed without resistance. At his death the emperor sighed: "My mirror of men is gone."',
    quote: { zh: '兼聽則明,偏信則暗。', en: 'Listening to many makes one wise; trusting one makes one blind.' },
  },
  'hist-yang-guifei': {
    era: { zh: '羞花', en: 'Shaming Flowers' },
    zh: '名玉環,蒲州永樂人。唐玄宗貴妃。「回眸一笑百媚生,六宮粉黛無顏色」。安史之亂中縊死馬嵬坡,年三十八。',
    en: 'Personal name Yuhuan, of Yongle in Puzhou. Imperial Consort of Emperor Xuanzong. "A glance back, a smile, a hundred charms born; in the six palaces no painted face had color." Hanged at Mawei Slope in the An Lushan rebellion at 38.',
  },
  // ─── 歷代名將 新增第一批 (Historical biographies — batch 1: cross-dynasty famous figures) ───
  'hist-baili-xi': {
    era: { zh: '五羖大夫', en: 'The Five-Goatskins Counselor' },
    zh: '虞國人。年七十而事秦穆公,以五張羖羊皮自鬻贖之,故號「五羖大夫」。輔穆公稱霸西戎,開地千里,秦由是強。',
    en: 'Of the state of Yu. At seventy he came to serve Duke Mu of Qin, ransomed for five black goatskins — hence "the Five-Goatskins Counselor." Under his counsel Qin became hegemon of the western Rong and opened a thousand li of new land; from him Qin\'s rise began.',
  },
  'hist-bo-pi': {
    zh: '楚國伯州犁之孫。吳王夫差太宰。受越國重賄,屢進讒言害伍子胥,致夫差賜伍子胥死。越滅吳,句踐殺伯嚭以絕後患,千古佞臣之典。',
    en: 'Grandson of Bo Zhouli of Chu, Grand Steward of King Fuchai of Wu. Yue bribed him heavily; he slandered Wu Zixu again and again, causing Fuchai to send him a sword. When Yue swallowed Wu, Goujian killed Bo Pi to be rid of the source of trouble — the model of the flattering minister for the ages.',
  },
  'hist-bo-yi': {
    zh: '商孤竹君長子,與弟叔齊互讓君位。聞文王善養老,共奔西周。武王伐紂,叩馬而諫;周代商,二人恥食周粟,隱於首陽山採薇而食,終餓死。',
    en: 'Eldest son of the Lord of Guzhu in Shang. He and his brother Shu Qi yielded the throne to each other. Hearing King Wen of Zhou treated the aged well, they both came to him. When King Wu marched against the tyrant Zhou, they knocked at his horse to remonstrate; when Zhou replaced Shang, the two would not eat Zhou\'s grain, hid in Mount Shouyang, gathered ferns, and starved to death.',
  },
  'hist-bian-he': {
    era: { zh: '和氏璧', en: 'The He Family Jade' },
    zh: '楚國人。三獻和氏璧於楚厲王、武王、文王。厲、武皆以為石,刖其左、右足。文王使工剖之,果得寶玉,號「和氏之璧」。後傳為秦傳國玉璽,千古國寶之祖。',
    en: 'Of Chu. Three times he presented the He Family jade — first to King Li, then King Wu, then King Wen. The first two thought it stone and cut off his left and right feet in turn. King Wen had a craftsman cleave the stone — and a peerless jade lay inside, the "Jade of Bian He." It later became the imperial seal of Qin, the ancestor of all the great treasures of the state.',
  },
  'hist-baosi': {
    era: { zh: '烽火戲諸侯', en: 'Beacon-Fires for a Smile' },
    zh: '西周幽王寵妃。性不喜笑,幽王為悅之,舉烽火戲諸侯,諸侯至而無事,後犬戎攻鎬京,幽王再舉烽火,諸侯莫至,西周遂亡。中華第一傾國女子,「烽火戲諸侯」千古笑談。',
    en: 'Favorite consort of King You of Western Zhou. She would not laugh, and to please her the king lit the warning beacons; the lords came in arms and found nothing. Later when the Quanrong attacked the capital Haojing and the king lit the beacons again, no lord came — and Western Zhou fell. The first city-toppling woman of China; "beacon-fires for a smile" is a tale forever.',
  },
  'hist-meng-yi': {
    zh: '蒙恬之弟。秦始皇心腹,與兄共擔秦室。始皇死,趙高陷之,被殺於代地。',
    en: 'Younger brother of Meng Tian. The First Emperor\'s confidant, with his brother he held up the Qin house. When the emperor died, Zhao Gao framed him and he was killed at Dai.',
  },
  'hist-wang-ben': {
    zh: '王翦之子。隨父滅楚,又獨將兵滅燕、滅齊,六國盡入於秦。秦始皇封通武侯。',
    en: 'Son of Wang Jian. With his father he destroyed Chu, then alone he led troops to swallow Yan and Qi — the six states all came into Qin. The First Emperor made him Marquis of Tongwu.',
  },
  'hist-li-xin': {
    zh: '槐里人。秦始皇愛將。少壯氣銳,自請二十萬眾伐楚,大敗於楚將項燕。後從王翦再伐,克之。',
    en: 'Of Huaili. A favored general of the First Emperor. Young and full of fire, he asked for twenty thousand to take Chu and was crushed by the Chu general Xiang Yan. He later marched again under Wang Jian, and Chu was broken.',
  },
  'hist-zhang-han': {
    zh: '秦末名將。陳勝、吳廣起兵,二世以章邯將驪山徒卒擊之,連破陳勝、項梁,東破齊魏。後與項羽戰於鉅鹿,大敗,降項羽,封雍王。劉邦定關中,章邯自殺於廢丘。',
    en: 'A famed general of late Qin. When Chen Sheng and Wu Guang rose, the Second Emperor sent Zhang Han with the convict-labour of Mount Li, who broke Chen Sheng and Xiang Liang in turn and crushed Qi and Wei in the east. At Julu he was broken by Xiang Yu and yielded, made King of Yong. When Liu Bang settled the Pass region, Zhang Han killed himself at Feiqiu.',
  },
  'hist-fusu': {
    zh: '秦始皇長子。仁厚有古風。坑儒之事,扶蘇直諫,始皇怒,使監蒙恬軍於上郡。始皇崩,趙高、李斯矯詔賜死,扶蘇對使者拜,曰:「父賜子死,何敢復請!」 自刎。蒙恬欲止之,終不及。',
    en: 'Eldest son of the First Emperor of Qin. Kind and grave in the manner of antiquity. When the scholars were buried, Fusu remonstrated and his father in anger sent him to inspect Meng Tian\'s army at Shangjun. When the emperor died, Zhao Gao and Li Si forged the edict that bade him die. Fusu bowed to the messenger: "My father has bidden me die — how dare I question it?" and cut his own throat.',
  },
  'hist-huhai': {
    zh: '秦二世皇帝。始皇少子。趙高、李斯矯詔立之,殺扶蘇、蒙恬。在位三年,殘暴無道,殺兄弟姊妹三十餘人。後趙高弒之於望夷宮,年二十四。秦遂亡。',
    en: 'Second Emperor of Qin, youngest son of the First Emperor. Set up by Zhao Gao and Li Si\'s forged edict, with Fusu and Meng Tian killed. Three years he reigned, cruel and faithless, putting more than thirty of his own brothers and sisters to death. Zhao Gao at last killed him at Wangyi Palace at twenty-four, and Qin was ended.',
  },
  'hist-ziying': {
    zh: '秦王子嬰,二世姪。趙高弒二世立子嬰,子嬰謀殺趙高,夷其三族。在位四十六日,劉邦入關中,子嬰素車白馬,銜璧出降。後項羽入咸陽,殺之,焚秦宮室。',
    en: 'Ziying, last King of Qin, nephew of the Second Emperor. When Zhao Gao killed the emperor and set up Ziying, Ziying killed Zhao Gao and wiped out three branches of his clan. He reigned forty-six days; when Liu Bang entered the Pass, he came forth in a plain cart drawn by white horses, bearing the imperial seal in his mouth. Xiang Yu later entered Xianyang, killed him, and burned the palaces.',
  },
  'hist-chen-sheng': {
    era: { zh: '王侯將相寧有種乎', en: '"Are Princes and Generals Born to Their Rank?"' },
    zh: '字涉,陽城人。秦末戍卒,雨阻誤期,當斬。陳勝、吳廣於大澤鄉揭竿起義,呼曰:「王侯將相,寧有種乎!」 中華第一次農民大起義由此而起。建張楚政權,六月而敗,為部下莊賈所殺。',
    en: 'Style She, of Yangcheng. A conscript soldier of late Qin. When rain held him past his deadline, by law he would die. Chen Sheng with Wu Guang raised their cudgels at Daze and shouted: "Princes and generals — are they born to their rank?" The first great peasant uprising of China began from this. He set up the kingdom of Zhang Chu; six months and it was broken, and his man Zhuang Jia killed him.',
  },
  'hist-cao-can': {
    era: { zh: '蕭規曹隨', en: 'Cao Follows Xiao\'s Rule' },
    zh: '沛縣人,劉邦同鄉。漢初名臣。隨蕭何之後為丞相,完全遵循蕭何舊制,不變一字,號「蕭規曹隨」,使民得以休養生息,千古傳為良相之典。',
    en: 'Of Pei county, fellow villager of Liu Bang. A famed minister of early Han. As chancellor after Xiao He, he kept the laws and methods of his predecessor unchanged to the last word — "Cao followed Xiao\'s rule," and the people had room to breathe and grow. Held forever as a model of the good chancellor.',
  },
  'hist-zhou-bo': {
    zh: '沛縣人。從劉邦起兵,屢立戰功。漢定,封絳侯。呂后亂後,周勃與陳平合謀,誅諸呂,迎立漢文帝。功冠群臣,後子周亞夫繼之。',
    en: 'Of Pei county. From Liu Bang\'s first uprising he marched and earned many laurels. When Han was set he was made Marquis of Jiang. After the chaos of the Lü clan, Zhou Bo with Chen Ping wiped out the Lü and set up Emperor Wen. His merit stood above all the ministers; his son Zhou Yafu carried it on.',
  },
  'hist-zhou-yafu': {
    zh: '周勃之子。漢景帝時太尉。七國之亂,周亞夫鎮以「不出而坐」之策,絕吳楚糧道,三月平之。後與景帝意不合,免相,絕食死於獄,年六十五。',
    en: 'Son of Zhou Bo. Grand Marshal under Emperor Jing of Han. In the Revolt of the Seven Kingdoms he held the line by the strategy of "neither marching nor moving," cut off the Wu and Chu grain trains, and in three months it was over. Later he fell out with Emperor Jing, was dismissed, and starved himself to death in prison at sixty-five.',
  },
  'hist-guan-ying': {
    zh: '睢陽人。從劉邦起兵,以勇敢著稱。屢破項羽部,韓信下齊之役,灌嬰先登。漢定,封潁陰侯。後為太尉,平諸呂之亂。',
    en: 'Of Suiyang. From Liu Bang\'s first uprising, famed for boldness. He broke Xiang Yu\'s captains many times; in Han Xin\'s breaking of Qi he was first to mount the wall. When Han was set he was made Marquis of Yinyin. He later served as Grand Marshal and helped put down the Lü.',
  },
  'hist-ying-bu': {
    era: { zh: '黥布', en: 'Tattoo-Face Ying Bu' },
    zh: '六縣人。少時犯法被黥面,故號黥布。事項羽為猛將,有功於鉅鹿之戰。後歸劉邦,封淮南王。漢定後反,被劉邦親征所破,逃至番陽,為長沙王所殺。',
    en: 'Of Liu county. In his youth he was branded on the face for a crime — hence "Tattoo-Face." He served Xiang Yu as a fierce general, of credit at Julu. He later went over to Liu Bang and was made King of Huainan. After Han was set he rose in revolt; Liu Bang took the field in person and broke him. He fled to Poyang, where the King of Changsha killed him.',
  },
  'hist-peng-yue': {
    zh: '昌邑人。漁夫出身,聚眾為盜。後從劉邦,屢襲項羽糧道,使項羽腹背受敵,垓下之圍,彭越功不可沒。漢定,封梁王。後被呂后誣以反罪,夷三族,梟首洛陽。',
    en: 'Of Changyi. Born a fisher, he gathered men as a bandit. He came to Liu Bang and raided Xiang Yu\'s grain trains again and again, so that Xiang Yu was caught front and back; in the encirclement of Gaixia his work was great. When Han was set he was made King of Liang. Empress Lü later framed him with a charge of revolt, his clan was exterminated to three branches, and his head was set up at Luoyang.',
  },
  'hist-bu-shi': {
    zh: '河南人。漢武帝時牧羊富翁。屢以家財助軍,武帝嘉之,拜為御史大夫。性樸實,治民如治羊,「以時起居,惡者輒去」。',
    en: 'Of Henan. A sheep-farming rich man under Emperor Wu of Han. He gave again and again from his fortune to the army; the emperor praised him and made him Imperial Secretary. Simple in temper, he ruled the people as he ruled his sheep — "in season they rise and rest, and the bad are at once removed."',
  },
  'hist-ban-biao': {
    zh: '字叔皮,扶風安陵人,班固、班超、班昭之父。漢初太史令班固之父。著《史記後傳》六十五篇,班固承之而作《漢書》。',
    en: 'Style Shupi, of Anling in Fufeng, father of Ban Gu, Ban Chao, and Ban Zhao. He wrote the Sequel to the Records of the Grand Historian in sixty-five pieces, which Ban Gu took up and turned into the Book of Han.',
  },
  'hist-ban-gu': {
    era: { zh: '漢書作者', en: 'Author of the Book of Han' },
    zh: '字孟堅,扶風安陵人,班彪之子。事東漢明、章、和三朝。承父業,著《漢書》一百篇,為中國第一部斷代史。後從竇憲伐匈奴,竇憲事敗,班固牽連入獄,死於獄中,年六十一。',
    en: 'Style Mengjian, of Anling in Fufeng, son of Ban Biao. He served Emperors Ming, Zhang, and He of the Eastern Han. Carrying on his father\'s work he wrote the Book of Han in a hundred pieces — the first dynastic history of China. He marched with Dou Xian against the Xiongnu; when Dou Xian fell, Ban Gu was caught up and died in prison at sixty-one.',
  },
  'hist-ban-zhao': {
    era: { zh: '曹大家', en: 'Lady Cao' },
    zh: '字惠班,扶風安陵人,班彪之女,班固、班超之妹。中華第一才女史家。班固卒於獄,班昭續成《漢書·八表》、《天文志》。又入宮為皇后及諸貴人之師,號「曹大家」。著《女誡》七篇,為千古女學之祖。',
    en: 'Style Huiban, of Anling in Fufeng, daughter of Ban Biao, sister of Ban Gu and Ban Chao. China\'s first great female historian. When Ban Gu died in prison, she completed the Eight Tables and the Treatise on Astronomy of the Book of Han. She also entered the palace as teacher to the empress and great ladies — called "Lady Cao." She wrote the Admonitions for Women in seven pieces, the founding text of women\'s learning for the ages.',
  },
  'hist-ban-yong': {
    zh: '班超之子。承父業,鎮西域。打通絲綢之路,平定車師之亂,維持西域秩序。',
    en: 'Son of Ban Chao. He carried on his father\'s work in the Western Regions, kept the Silk Road open, put down the Cheshi revolt, and held the order of the West.',
  },
  'hist-ban-jieyu': {
    zh: '名婕妤,漢成帝妃。才華出眾,工於詩賦。後被趙飛燕所讒,自請供養太后於長信宮,作《團扇詩》以自比秋扇被棄。「新裂齊紈素,皎潔如霜雪」千古傳誦。',
    en: 'Personal name Jieyu, consort of Emperor Cheng of Han. Of great talent and a poet. Slandered by Zhao Feiyan, she asked to attend the empress dowager at Changxin Palace, and wrote the "Round Fan Poem," likening herself to an autumn fan set aside. "Newly cut from the Qi silk, bright as frost and snow" rings forever.',
  },
  'hist-chen-tang': {
    era: { zh: '明犯強漢者,雖遠必誅', en: '"Whoever Defies Strong Han Shall Be Punished, However Distant"' },
    zh: '字子公,山陽瑕丘人。漢元帝時西域副校尉。與甘延壽矯詔發西域兵,深入康居,陣斬北匈奴郅支單于,傳首長安。上疏曰:「明犯強漢者,雖遠必誅!」 千古絕唱。',
    en: 'Style Zigong, of Xiaqiu in Shanyang. Vice-Colonel of the Western Regions under Emperor Yuan. With Gan Yanshou he forged orders to raise the troops of the West, marched deep to Kangju, killed the Northern Xiongnu Zhizhi Chanyu in the line, and sent his head to Chang\'an. He memorialized: "Whoever defies strong Han shall be punished, however distant!" — peerless across the ages.',
  },
  'hist-huo-guang': {
    zh: '字子孟,河東平陽人,霍去病異母弟。漢武帝臨終以幼子昭帝相託。輔政二十年,廢昌邑王,立宣帝,號「霍光輔政」,西漢中興之首。然其家恃寵專橫,光死後三年,霍氏被夷三族。',
    en: 'Style Zimeng, of Pingyang in Hedong, half-brother of Huo Qubing. On his deathbed Emperor Wu entrusted his young son, Emperor Zhao, to him. Twenty years he held the regency, deposed the King of Changyi, and set up Emperor Xuan — the "Huo Guang regency," first of the Han restorers. But his house used his favor too high; three years after his death, the Huo clan was wiped out to three branches.',
  },
  'hist-bao-xuan': {
    zh: '字子都,渤海高城人。漢哀帝諫議大夫。直言敢諫,屢諫哀帝勿用董賢,觸怒哀帝,免歸。王莽篡漢,鮑宣被王莽殺害,夷其家。',
    en: 'Style Zidu, of Gaocheng in Bohai. Counselor of Emperor Ai of Han. Straight of speech, he often warned the emperor not to use Dong Xian; the emperor in anger dismissed him. When Wang Mang took the Han throne, Wang Mang killed Bao Xuan and wiped out his household.',
  },
  'hist-wang-dao': {
    era: { zh: '王與馬,共天下', en: '"Wang and Sima Share the Realm"' },
    zh: '字茂弘,琅琊臨沂人。東晉開國名相。輔司馬睿於建康,招攬南北士族,共扶晉室。當時有「王與馬,共天下」之語。事元、明、成三朝,位至丞相。卒,謚文獻。',
    en: 'Style Maohong, of Linyi in Langya. The founding great chancellor of the Eastern Jin. At Jiankang he stood by Sima Rui, gathered the gentry of north and south, and upheld the Jin house. The saying ran: "Wang and Sima share the realm." He served three reigns — Yuan, Ming, Cheng — rising to chancellor. He died, posthumous name Wenxian.',
  },
  'hist-xie-an': {
    era: { zh: '東山再起', en: 'Rose Again from the Eastern Hills' },
    zh: '字安石,陳郡陽夏人。東晉名相。少時隱於東山二十年,四十始出仕。淝水之戰,謝安為丞相,從容鎮定,以八萬之眾大破苻堅百萬之師。捷報至,謝安方與客對奕,看畢置之床上,客問,但云:「小兒輩遂已破賊。」 卒年六十六,謚文靖。',
    en: 'Style Anshi, of Yangxia in Chen. A great chancellor of Eastern Jin. He hid himself twenty years in the Eastern Hills before taking office at forty. In the battle of Feishui he was chancellor; calm and unhurried, with eighty thousand he broke Fu Jian\'s host of a million. When the dispatch came, Xie An was at chess; he set it on the couch and went on. When the guest asked, he only said: "The boys have broken the enemy." He died at sixty-six, posthumous name Wenjing.',
  },
  'hist-xie-xuan': {
    zh: '字幼度,陳郡陽夏人,謝安之姪。東晉名將。淝水之戰前線統帥,率八萬北府兵大破苻堅百萬。其後率軍北伐,收復河南、青、徐等州,中興東晉。',
    en: 'Style Youdu, of Yangxia in Chen, nephew of Xie An. A famed general of Eastern Jin. He was the field commander at Feishui, where with eighty thousand Beifu troops he broke Fu Jian\'s million. He then led the northern campaign, recovering Henan, Qing, and Xu — restoring the Eastern Jin.',
  },
  'hist-huan-wen': {
    zh: '字元子,譙國龍亢人。東晉權臣。三次北伐,雖未盡功,然威震一時。野心勃勃,曰:「不能流芳百世,亦當遺臭萬年!」 後欲篡晉,謀為謝安、王坦之所阻,憂憤而卒。',
    en: 'Style Yuanzi, of Longkang in Qiao. A great power-holder of Eastern Jin. Three times he marched north — though never fully successful, his name shook the age. Ambitious, he said: "If I cannot leave a fragrance for a hundred ages, let me leave a stench for ten thousand!" Later he meant to take the Jin throne, but Xie An and Wang Tanzhi blocked him; he died of grief and rage.',
  },
  'hist-zu-ti': {
    era: { zh: '中流擊楫', en: 'Struck the Oar Midstream' },
    zh: '字士稚,范陽遒人。東晉名將。與劉琨少年知交,聞雞起舞。元帝南渡,祖逖請北伐,將兵渡江,中流擊楫而誓:「祖逖不能清中原而復濟者,有如大江!」 收復黃河以南。元帝忌之,以戴淵牽制,祖逖憂憤成疾,卒於雍丘。',
    en: 'Style Shizhi, of Qiu in Fanyang. A famed general of Eastern Jin. In youth he was friend to Liu Kun, rising at the cock\'s crow to dance with the sword. When Emperor Yuan crossed south, Zu Ti asked leave for the northern campaign; crossing the river he struck his oar midstream and swore: "If Zu Ti cannot cleanse the central plains and come back across, may I be as this great river!" He recovered the land south of the Yellow River. Emperor Yuan grew suspicious and set Dai Yuan to check him; Zu Ti fell sick with grief and rage and died at Yongqiu.',
  },
  'hist-gu-kaizhi': {
    era: { zh: '畫聖', en: 'Sage of Painting' },
    zh: '字長康,小字虎頭,晉陵無錫人。東晉畫家。世稱「才絕、畫絕、痴絕」。畫「點睛」之術,傳神入妙。作《女史箴圖》、《洛神賦圖》傳世。中國畫之祖。',
    en: 'Style Changkang, child-name Hutou, of Wuxi in Jinling. A painter of Eastern Jin. The world said: "Of talent he is peerless, of painting peerless, of folly peerless." His art of "dotting the pupil" caught the spirit perfectly. The Admonitions of the Court Instructress and the Goddess of the Luo survive — the founder of Chinese painting.',
  },
  'hist-bao-zhao': {
    zh: '字明遠,東海人。南朝宋大詩人。出身寒微,以才華自顯。詩多反映寒士不平之氣,擅長七言歌行,為杜甫所讚。後死於亂兵之中。',
    en: 'Style Mingyuan, of Donghai. A great poet of Liu Song in the Southern Dynasties. Of humble birth, he made himself by sheer talent. His verse spoke the bitterness of the lowly scholar; master of the seven-character song-form, praised by Du Fu. He died in a mutiny.',
  },
  'hist-chen-baxian': {
    era: { zh: '陳武帝', en: 'Emperor Wu of Chen' },
    zh: '字興國,吳興長城人。南朝陳開國皇帝。出身寒微,以軍功起家。梁末侯景之亂,陳霸先起兵討之,平亂後奪梁建陳。在位三年崩,壽五十七。',
    en: 'Style Xingguo, of Changcheng in Wuxing. The founding emperor of Chen in the Southern Dynasties. Of humble birth, he rose by military merit. In late Liang during the Hou Jing rebellion he raised troops to put it down; afterwards he took the Liang throne and founded Chen. Three years he reigned and died at fifty-seven.',
  },
  'hist-chen-shubao': {
    era: { zh: '陳後主', en: 'Last Emperor of Chen' },
    zh: '名叔寶,字元秀,陳宣帝長子。沉湎酒色,寵幸張麗華、孔貴嬪,日夜燕樂。隋兵渡江,陳叔寶與張麗華、孔貴嬪同藏於井中,被擒。作《玉樹後庭花》,「亡國之音」千古傳為俗語。',
    en: 'Personal name Shubao, style Yuanxiu, eldest son of Emperor Xuan of Chen. Drowned in wine and women, doting on Zhang Lihua and Lady Kong, day and night in pleasure. When the Sui crossed the river, Chen Shubao hid in a well with Zhang Lihua and Lady Kong and was taken. He wrote "Jade Tree Backyard Flowers" — "music of a fallen state" has been a saying ever since.',
  },
  'hist-yang-jian': {
    era: { zh: '隋文帝', en: 'Emperor Wen of Sui' },
    zh: '名楊堅,弘農華陰人。北周外戚,以宰相之位篡周建隋。在位二十四年,平陳統一,結束三百年分裂。創科舉,設三省六部,定均田制,開「開皇之治」。然晚年廢太子楊勇,立楊廣,隋速亡之由。',
    en: 'Personal name Yang Jian, of Huayin in Hongnong. An in-law of Northern Zhou, he took the chancellorship and seized the throne to found Sui. Twenty-four years he reigned: he broke Chen and unified the realm, ending three hundred years of division. He created the imperial examinations, set up the Three Departments and Six Ministries, and the Equal-Field system — the "Reign of Kaihuang." Yet in old age he deposed the heir Yang Yong for Yang Guang — and from this Sui fell so quickly.',
  },
  'hist-yang-guang': {
    era: { zh: '隋煬帝', en: 'Emperor Yang of Sui' },
    zh: '名楊廣,隋文帝次子。在位十四年。開大運河,通南北漕運,功在千秋。然好大喜功,三征高句麗,皆敗。三下江南,奢侈無度。激起天下大亂,瓦崗、竇建德、李淵諸軍並起。江都之變,被宇文化及縊死,年五十。',
    en: 'Personal name Yang Guang, second son of Wen of Sui. Fourteen years he reigned: he opened the Grand Canal, joined north and south by water transport — a merit for the ages. Yet he loved grand show; three times he marched on Goguryeo and three times was broken. Three tours of the south, lavish beyond measure. He stirred the realm into chaos — Wagang, Dou Jiande, Li Yuan all rose. In the Jiangdu mutiny Yuwen Huaji strangled him at fifty.',
  },
  'hist-yang-su': {
    zh: '字處道,弘農華陰人。隋朝大將。隨楊堅篡周,平陳統一,功冠群臣。後與楊廣合謀廢太子楊勇,立楊廣,封越國公。卒,壽六十二。',
    en: 'Style Chudao, of Huayin in Hongnong. A great general of Sui. He helped Yang Jian take the Northern Zhou throne, broke Chen and unified the realm, his merit above all the ministers. He later joined Yang Guang in the plot that deposed the heir Yang Yong and set up Yang Guang, and was made Duke of Yue. He died at sixty-two.',
  },
  'hist-han-qinhu': {
    zh: '字子通,河南東垣人。隋朝大將。平陳之役,韓擒虎率五百騎渡江,直入建康,擒陳叔寶於井中。封上柱國。傳卒後封陰司之主。',
    en: 'Style Zitong, of Dongyuan in Henan. A great general of Sui. In the breaking of Chen he led five hundred horse across the river, rode straight into Jiankang, and took Chen Shubao alive from his well. He was made Pillar of State. Legend says that after death he became a lord of the underworld.',
  },
  'hist-fang-xuanling': {
    zh: '字喬,齊州臨淄人。唐太宗宰相。與杜如晦同為「房謀杜斷」,共佐太宗開貞觀盛世。位至司空,封梁國公。卒,太宗哭之至慟,輟朝五日。',
    en: 'Style Qiao, of Linzi in Qizhou. Chancellor of Taizong of Tang. With Du Ruhui he formed "Fang the Planner, Du the Decider," shaping the Zhenguan golden age. He rose to Excellency over the Works and was made Duke of Liang. At his death Taizong wept and suspended court for five days.',
  },
  'hist-du-ruhui': {
    zh: '字克明,京兆杜陵人。唐太宗宰相。明斷果決,與房玄齡共謀,房謀杜斷,千古傳為良相之典。年四十六早卒,太宗為之痛悼。',
    en: 'Style Keming, of Duling in the metropolitan region. Chancellor of Taizong of Tang. Quick and decisive in judgment, with Fang Xuanling — "Fang the Planner, Du the Decider" — set the model of great ministers for the ages. He died young at forty-six; Taizong mourned bitterly.',
  },
  'hist-qin-qiong': {
    era: { zh: '門神', en: 'Door God' },
    zh: '字叔寶,齊州歷城人。隋末從李密,後事王世充,終歸唐。隨李世民征戰,有功。玄武門之變先登,封翼國公。後與尉遲恭同為門神,千古鎮宅。',
    en: 'Style Shubao, of Licheng in Qizhou. In late Sui he served Li Mi, then Wang Shichong, and at last went to Tang. He marched with Li Shimin and earned credit. At the Xuanwu Gate he was first in, and was made Duke of Yi. He and Yuchi Jingde later became the Door Gods who guard households for all ages.',
  },
  'hist-yuchi-gong': {
    era: { zh: '尉遲敬德', en: 'Yuchi Jingde' },
    zh: '名恭,字敬德,朔州善陽人。原劉武周部,後歸唐。隨李世民征戰,屢救其於危急。玄武門之變射殺齊王元吉,救李世民。位至開府儀同三司,封鄂國公。與秦瓊同為門神。',
    en: 'Personal name Gong, style Jingde, of Shanyang in Shuozhou. Originally with Liu Wuzhou, he came to Tang. He marched with Li Shimin and saved him from peril again and again. At the Xuanwu Gate he shot Prince Yuanji and saved Li Shimin. He rose to the high rank of Kaifu Yitong Sansi and was made Duke of E. With Qin Qiong he became the Door God.',
  },
  'hist-cheng-yaojin': {
    era: { zh: '半路殺出', en: 'Sprung Out Halfway on the Road' },
    zh: '字義貞,濟州東阿人。隋末從李密,後歸唐。隨李世民征戰,以勇敢稱。傳善使板斧三招,程咬金「半路殺出」千古傳為俗語。卒於麟德二年,年七十七。',
    en: 'Style Yizhen, of Dong\'e in Jizhou. He served Li Mi in late Sui and then came to Tang. He marched with Li Shimin, famed for boldness. Tradition tells he used a great axe with three sure swings; "Cheng Yaojin springs out halfway on the road" became a saying. He died in 665 at seventy-seven.',
  },
  'hist-han-yu': {
    era: { zh: '唐宋八大家之首', en: 'First of the Eight Masters of Tang and Song' },
    zh: '字退之,自稱郡望昌黎,世稱韓昌黎。唐代古文運動領袖。倡「文以載道」,反對六朝以來駢儷之風。著《師說》、《進學解》、《祭十二郎文》。元和十四年,憲宗迎佛骨,韓愈上《論佛骨表》力諫,觸怒貶為潮州刺史。',
    en: 'Style Tuizhi, claiming descent from Changli — the world called him Han Changli. Leader of the Tang Classical Prose Movement. He urged "prose to carry the Way" against the parallel style of the Six Dynasties. He wrote the Discourse on Teachers, the Explanation of the Pursuit of Learning, the Sacrificial Address for the Twelfth Nephew. In 819, when Emperor Xianzong welcomed a Buddha relic, Han Yu sent up the Memorial Against the Buddha Bone in furious remonstrance, and was thrust down to Inspector of Chaozhou.',
  },
  'hist-liu-zongyuan': {
    era: { zh: '柳河東', en: 'Liu of Hedong' },
    zh: '字子厚,河東解人。唐代文學家,唐宋八大家之一。與韓愈共倡古文運動。因王叔文革新失敗,貶柳州刺史十年。作《永州八記》、《捕蛇者說》傳世。卒於柳州,年四十七。',
    en: 'Style Zihou, of Xie in Hedong. A Tang writer, one of the Eight Masters of Tang and Song. With Han Yu he led the Classical Prose Movement. When Wang Shuwen\'s reform failed, he was thrust down to Inspector of Liuzhou for ten years. The Eight Notes from Yongzhou and the Discourse on the Snake-Catcher are his. He died at Liuzhou at forty-seven.',
  },
  'hist-di-renjie': {
    era: { zh: '神探狄仁傑', en: 'Detective Di Renjie' },
    zh: '字懷英,并州太原人。武則天宰相。性正直敢諫,屢勸武則天還政於唐。為大理寺丞,一年斷積案一萬七千件,無冤訴。後人演義為神探,千古傳為清官之典。',
    en: 'Style Huaiying, of Taiyuan in Bingzhou. Chancellor of Wu Zetian. Upright and bold in remonstrance, he often urged her to return the throne to the Tang. As Vice-Director of the Court of Judicial Review he heard seventeen thousand backlogged cases in one year, with no unjust complaint. Later tales made him a divine detective; he is held forever as the model of the clean official.',
  },
  'hist-du-mu': {
    era: { zh: '小杜', en: 'The Lesser Du' },
    zh: '字牧之,京兆萬年人。晚唐詩人,杜佑之孫。與李商隱齊名,世稱「小李杜」。「商女不知亡國恨,隔江猶唱後庭花」、「停車坐愛楓林晚,霜葉紅於二月花」千古傳誦。',
    en: 'Style Muzhi, of Wannian in the metropolitan region. A late-Tang poet, grandson of Du You. With Li Shangyin he was called the "Lesser Li-Du." "The singing girl knows not the grief of fallen states / across the river she still sings the Backyard Flowers" and "I stop the cart, sit and love the maple wood at dusk / the frosted leaves are redder than spring flowers" are read forever.',
  },
  'hist-zhao-pu': {
    zh: '字則平,幽州薊縣人。宋太祖、太宗兩朝宰相。少習吏事,寡學術,號「半部《論語》治天下」。陳橋兵變,杯酒釋兵權,皆趙普所謀。三度為相,世稱開國名相。',
    en: 'Style Zeping, of Ji county in Youzhou. Chancellor to both Taizu and Taizong of Song. Skilled in administration but light in formal learning — he was said to "govern the realm with half a copy of the Analects." Both the Chenqiao mutiny and the wine-and-release of the generals were his counsels. Three times chancellor, the world named him the founding great minister.',
  },
  'hist-cao-bin': {
    zh: '字國華,真定靈壽人。北宋開國大將。隨宋太祖平定後蜀、南唐、南漢,功冠群臣。性仁厚,克城不殺一人,千古傳為良將之典。封魯國公,卒年六十九。',
    en: 'Style Guohua, of Lingshou in Zhending. A founding general of Northern Song. With Taizu he pacified the Later Shu, Southern Tang, and Southern Han — his merit above all. Kind and gentle, he took cities without one life lost. Held forever as a model general. Made Duke of Lu, he died at sixty-nine.',
  },
  'hist-kou-zhun': {
    zh: '字平仲,華州下邽人。北宋名相。澶淵之盟,寇準力主真宗親征,逼遼結盟,以歲幣三十萬換和平,百餘年無戰。然性剛直,屢忤權貴,後為丁謂所構,貶死雷州。',
    en: 'Style Pingzhong, of Xiagui in Huazhou. A famed chancellor of Northern Song. In the Chanyuan negotiation he pressed Emperor Zhenzong to take the field in person, forced the Liao to terms, and bought a century of peace for three hundred thousand strings a year. But stiff and frank, he clashed with the great; framed by Ding Wei, he was thrust down to die at Leizhou.',
  },
  'hist-han-shizhong': {
    era: { zh: '中興四將', en: 'One of the Four Generals of the Restoration' },
    zh: '字良臣,延安人。南宋抗金名將。黃天蕩之戰,以八千宋軍困金兀朮十萬於江中四十八日,幾擒之。與岳飛、劉光世、張俊並稱「中興四將」。秦檜害岳飛,韓世忠憤質之曰:「莫須有三字,何以服天下!」 後辭官閒居,號清涼居士。',
    en: 'Style Liangchen, of Yan\'an. A famed Southern Song general of the war against the Jin. At the Yellow Sky Pool he with eight thousand Song troops trapped Wuzhu\'s hundred thousand Jin on the river for forty-eight days, and nearly took him alive. With Yue Fei, Liu Guangshi, and Zhang Jun he was one of the "Four Generals of the Restoration." When Qin Hui killed Yue Fei, Han Shizhong indignantly asked him: "These three words \'perhaps there is\' — how shall they convince the realm?" In old age he resigned and lived quietly, called the Recluse of Cool Purity.',
  },
  'hist-qin-hui': {
    era: { zh: '千古奸臣', en: 'Treacherous Minister of the Ages' },
    zh: '字會之,江寧人。南宋宰相。主和派之首,以「莫須有」三字陷岳飛父子於風波亭。專權十九年,殺主戰派以求和於金。後人鑄其鐵像跪於岳飛墓前,千古唾罵。',
    en: 'Style Huizhi, of Jiangning. Chancellor of Southern Song. Head of the peace faction, with the three words "perhaps there is" he sent Yue Fei and his son to die at the Wind-and-Wave Pavilion. Nineteen years he held power, killing the war faction to make peace with the Jin. Later ages cast his iron statue kneeling before Yue Fei\'s tomb, cursed by every age.',
  },
  'hist-lu-you': {
    era: { zh: '愛國詩人', en: 'Patriot Poet' },
    zh: '字務觀,號放翁,越州山陰人。南宋大詩人。一生主張抗金,屢遭打擊。八十五歲臨終作《示兒》:「死去元知萬事空,但悲不見九州同。王師北定中原日,家祭無忘告乃翁!」 一片愛國之心,千古傳誦。',
    en: 'Style Wuguan, called the Released Old Man, of Shanyin in Yuezhou. A great poet of Southern Song. All his life he urged war against the Jin, again and again pushed aside. At eighty-five on his deathbed he wrote "To My Sons": "Knowing in death that all things are empty / I grieve still that I shall not see the Nine Provinces one. / On the day the king\'s armies settle the central plains, / at the family altar do not forget to tell your old father!" His patriot heart is read forever.',
  },
  'hist-xin-qiji': {
    era: { zh: '詞中之龍', en: 'Dragon of the Ci' },
    zh: '字幼安,號稼軒,歷城人。南宋詞人,文武全才。少時南渡,二十二歲於萬軍中生擒叛徒張安國而南歸。詞作豪放雄渾,與蘇軾並稱「蘇辛」。「眾裡尋他千百度,驀然回首,那人卻在,燈火闌珊處」千古絕唱。',
    en: 'Style You\'an, called Jiaxuan, of Licheng. A poet of Southern Song, master of letters and arms together. As a youth he crossed south; at twenty-two, in the midst of ten thousand of the enemy, he took the traitor Zhang Anguo alive and brought him back. His ci verse was bold and grand; with Su Shi he was called "Su and Xin." "I sought him a thousand times in the throng / sudden I turned my head — and there he was / in the dim afterglow of the lanterns" rings forever.',
  },
  'hist-cheng-hao': {
    zh: '字伯淳,號明道,洛陽人。北宋理學家。與弟程頤共創「洛學」,合稱「二程」,為宋明理學之祖。倡「天理」之說,主張「天人合一」。著《明道先生文集》傳世。',
    en: 'Style Bochun, called Mingdao, of Luoyang. A Northern Song neo-Confucian. With his brother Cheng Yi he founded the Luo school — the "Two Chengs" — the fathers of Song-Ming neo-Confucianism. He held the doctrine of "the principle of Heaven" and "the unity of Heaven and man." The Collected Works of Master Mingdao survive.',
  },
  'hist-cheng-yi': {
    zh: '字正叔,號伊川,洛陽人。北宋理學家,程顥之弟。與兄共創理學,主張「存天理,滅人欲」。性嚴峻,世稱「程門立雪」之典出於其門。為朱熹理學之祖。',
    en: 'Style Zhengshu, called Yichuan, of Luoyang. A Northern Song neo-Confucian, younger brother of Cheng Hao. With his brother he founded neo-Confucianism, urging "preserve Heaven\'s principle, extinguish human desire." Stern in temper — the famous "standing in the snow at Master Cheng\'s gate" comes from his school. He was the ancestor of Zhu Xi\'s neo-Confucianism.',
  },
  'hist-bayan': {
    zh: '字宗道,八鄰部蒙古人。元世祖大將。咸淳十年率二十萬大軍南下伐宋,沿江而下,連克襄陽、建康、臨安,陸秀夫負少帝跳海,宋亡。封河南王。',
    en: 'Style Zongdao, of the Bayid Mongols. The great general of Shizu. In 1274 he led two hundred thousand south against the Song, down the river, taking Xiangyang, Jiankang, and Lin\'an in turn; Lu Xiufu carried the young emperor on his back and leapt into the sea, and the Song was ended. He was made Prince of Henan.',
  },
  'hist-lu-xiufu': {
    zh: '字君實,楚州鹽城人。南宋末年丞相。崖山之戰,宋軍敗,陸秀夫負衛王趙昺跳海而死,後宮從者十餘萬人皆赴海。宋遂亡,中華王朝首次盡亡於異族。',
    en: 'Style Junshi, of Yancheng in Chuzhou. Last chancellor of Southern Song. At the battle of Yashan, when the Song fleet was broken, Lu Xiufu carried the boy emperor Zhao Bing on his back and leapt into the sea; over a hundred thousand of the court and ladies followed them in. The Song was ended — the first time a Chinese dynasty fell wholly to a foreign people.',
  },
  'hist-zhang-shijie': {
    zh: '范陽人。南宋末年抗元名將。崖山之戰,大潰於元軍張弘範。乘小船突圍,海上颶風驟起,張世傑曰:「我為趙氏存社稷亦力盡矣!」 自沉於海。',
    en: 'Of Fanyang. A famed general at the end of Southern Song. At Yashan he was utterly broken by the Yuan general Zhang Hongfan. In a skiff he cut his way out; a great storm rose on the sea. Zhang Shijie sighed: "For the Zhao house I have worked to keep up the altars — my strength is spent!" He cast himself into the sea.',
  },
  'hist-chang-yuchun': {
    era: { zh: '常十萬', en: 'Chang Ten-Thousand' },
    zh: '字伯仁,濠州懷遠人。明朝開國名將。自言「將兵十萬,橫行天下」,號「常十萬」。隨朱元璋、徐達征戰,所向披靡。北伐途中暴卒於柳河川,年四十,謚忠武。',
    en: 'Style Boren, of Huaiyuan in Haozhou. A famed founding general of Ming. He said: "With ten thousand troops, I will sweep the realm," and was called "Chang Ten-Thousand." With Zhu Yuanzhang and Xu Da he marched and none stood before him. On the northern campaign he died suddenly at Liuhe Plain at forty, posthumous name Zhongwu.',
  },
  'hist-fang-xiaoru': {
    era: { zh: '誅十族', en: 'Wiped Out Ten Degrees of Kin' },
    zh: '字希直,寧海人。明朝大儒,建文帝師。靖難之變,朱棣陷京師,命方孝孺草詔即位,孝孺擲筆於地,大書:「燕賊篡位!」 朱棣怒,夷其十族(九族加門生),八百七十三人皆死,千古第一忠烈。',
    en: 'Style Xizhi, of Ninghai. A great Confucian of Ming, teacher of Emperor Jianwen. In the Jingnan war, when Zhu Di had taken the capital, he ordered Fang Xiaoru to draft the accession edict. Fang Xiaoru threw the brush to the ground and wrote large: "The Yan rebel has usurped the throne!" Zhu Di in fury wiped out ten degrees of his kin — the nine and his pupils, eight hundred and seventy-three souls — the first great martyr of all ages.',
  },
  'hist-wang-yangming': {
    era: { zh: '心學祖師', en: 'Founder of the Mind-Heart Learning' },
    zh: '名守仁,字伯安,號陽明,餘姚人。明朝大儒,心學集大成者。創「致良知」、「知行合一」之說。三十七歲於龍場驛悟道,世稱「龍場悟道」。後平寧王朱宸濠之亂,功蓋一代。其學東傳日本,影響明治維新。',
    en: 'Personal name Shouren, style Bo\'an, called Yangming, of Yuyao. A great Confucian of Ming, synthesizer of the Mind-Heart Learning. He propounded "fully realizing the innate knowing" and "the unity of knowledge and action." At thirty-seven, at Longchang post-station, he awakened — the "Awakening at Longchang." He later put down the revolt of Zhu Chenhao the Prince of Ning, with merit above the age. His teaching crossed east to Japan and shaped the Meiji Restoration.',
  },
  'hist-yuan-chonghuan': {
    era: { zh: '寧遠大捷', en: 'Victor of Ningyuan' },
    zh: '字元素,廣東東莞人。明末抗清名將。寧遠之戰,以紅夷大炮重傷努爾哈赤;寧錦大捷,大破皇太極。崇禎中皇太極反間計,崇禎信之,以通敵之罪磔死袁崇煥於市,北京百姓爭啖其肉,千古第一冤案。',
    en: 'Style Yuansu, of Dongguan in Guangdong. A famed Ming general against the rising Qing. At Ningyuan he gravely wounded Nurhaci with red-barbarian cannon; at Ningjin he broke Hongtaiji. Hongtaiji laid a counter-trick on Chongzhen; the emperor trusted it and on a charge of treachery had Yuan Chonghuan torn apart in the marketplace, the people of Beijing fighting to bite his flesh — the first great injustice of the ages.',
  },
  'hist-li-zicheng': {
    era: { zh: '闖王', en: 'The Dashing King' },
    zh: '陝西米脂人。明末農民起義領袖。崇禎年間據商洛,號「闖王」。崇禎十七年三月入北京,崇禎自縊煤山,明亡。在位四十二日,吳三桂引清兵入關,李自成敗走西安,後死於通城。',
    en: 'Of Mizhi in Shaanxi. Leader of the late-Ming peasant rising. In the Chongzhen years he held Shangluo and was called "the Dashing King." In the third month of 1644 he entered Beijing; Emperor Chongzhen hanged himself on Mount Mei, and Ming fell. Forty-two days he held the throne; Wu Sangui brought the Qing in through the wall, and Li Zicheng fell back to Xi\'an, dying at Tongcheng.',
  },
  'hist-shi-kefa': {
    era: { zh: '揚州十日', en: 'The Ten Days at Yangzhou' },
    zh: '字憲之,號道鄰,祥符人。明末抗清名將。守揚州,清兵圍之,史可法以孤城拒多鐸大軍。城破被執,不屈而死。清兵屠揚州十日,殺八十萬人。其衣冠葬於梅花嶺,千古傳為抗清第一忠臣。',
    en: 'Style Xianzhi, called Daolin, of Xiangfu. A famed Ming general against the Qing. He held Yangzhou as Dodo besieged him with one lone wall. When the city fell he was taken and would not bend; he died. The Qing then put Yangzhou to ten days of slaughter — eight hundred thousand dead. His robe and cap were buried at Plum-Blossom Ridge; he is held forever as the first loyal minister of the Ming-Qing transition.',
  },
  'hist-huangtaiji': {
    era: { zh: '清太宗', en: 'Emperor Taizong of Qing' },
    zh: '努爾哈赤第八子。改國號為清,改族名為滿洲。創蒙古、漢軍八旗,連同滿洲八旗,共二十四旗。屢敗明軍於關外,離間崇禎與袁崇煥,使袁崇煥被磔死。為清入關奠定基礎。卒,年五十二,終未見入關。',
    en: 'Eighth son of Nurhaci. He renamed the dynasty Qing and the people Manchu. He set up the Mongol and Han Banners alongside the Manchu Eight, twenty-four banners in all. He broke the Ming many times beyond the wall and set the trap that led Chongzhen to tear Yuan Chonghuan apart. He laid the foundation for the Qing\'s entry through the wall. He died at fifty-two, never having seen the entry.',
  },
  'hist-dorgon': {
    era: { zh: '攝政王', en: 'Prince-Regent' },
    zh: '名多爾袞,努爾哈赤第十四子。皇太極死,扶順治帝即位,攝政七年。引清兵入關,平李自成,定中原。又行剃髮易服之令,激起江南抗清。卒於塞外,順治帝追為「成宗義皇帝」,旋以其專權,廢爵削謚,毀其陵。',
    en: 'Personal name Dorgon, fourteenth son of Nurhaci. When Hongtaiji died he raised the Shunzhi emperor to the throne and ruled as regent for seven years. He brought the Qing armies through the wall, broke Li Zicheng, and settled the central plains. He also enforced the head-shaving and dress-change edicts, which stirred the resistance of the south. He died beyond the wall; Shunzhi raised him to "Emperor Yi of Chengzong" — then, for his usurpation, undid the title, stripped the rank, and broke his tomb.',
  },
  'hist-yongzheng': {
    zh: '名胤禛,康熙第四子。九子奪嫡之勝者。在位十三年,行密折制,設軍機處,改土歸流,推行攤丁入畝。性勤儉嚴峻,日夜批奏摺,常至深夜。為「康乾盛世」承上啟下之關鍵。卒,壽五十八。',
    en: 'Personal name Yinzhen, fourth son of Kangxi. Winner of the Nine Sons\' struggle. Thirteen years he reigned: he set the Secret Memorial system, created the Grand Council, replaced native chieftains with regular officials, and folded the head-tax into the land-tax. Frugal and stern, he read memorials by day and night, often late. He was the pivot of the "Kang-Qian golden age." He died at fifty-eight.',
  },
  'hist-li-hongzhang': {
    era: { zh: '洋務運動', en: 'The Self-Strengthening Movement' },
    zh: '字漸甫,號少荃,合肥人。晚清重臣。與曾國藩共平太平天國。後主持洋務運動,辦江南製造局、輪船招商局、開平煤礦,建北洋海軍。代表清廷與外國訂《馬關條約》、《辛丑條約》,飽受詬病。臨終嘆:「秋風寶劍孤臣淚!」',
    en: 'Style Jianfu, called Shaoquan, of Hefei. A great minister of the late Qing. With Zeng Guofan he put down the Taiping. He then led the Self-Strengthening Movement: the Jiangnan Arsenal, the China Merchants\' Steam Navigation, the Kaiping mines, the Beiyang fleet. He signed the Treaty of Shimonoseki and the Boxer Protocol for the Qing court and was reviled for them. He sighed at the end: "Autumn wind, the lone minister\'s sword, his tears!"',
  },
  'hist-heshen': {
    era: { zh: '和珅跌倒,嘉慶吃飽', en: '"Heshen Falls, Jiaqing Eats Full"' },
    zh: '字致齋,鈕祜祿氏。乾隆寵臣。專權二十年,貪贓枉法,聚財富甲天下。家產八億兩白銀,相當於清廷十五年國庫收入。嘉慶四年,乾隆死後十五日,嘉慶賜其自盡,抄家盡入內庫,故有「和珅跌倒,嘉慶吃飽」之語。',
    en: 'Style Zhizhai, of the Niohuru clan. A favored minister of Qianlong. Twenty years he held power, taking bribes and bending the law, gathering wealth above all the realm. His house held eight hundred million taels of silver — fifteen years of the Qing treasury\'s income. In 1799, fifteen days after Qianlong\'s death, Jiaqing gave him a draught of death; his estate went to the inner treasury — and so the saying: "Heshen falls, Jiaqing eats full."',
  },
  // ─── 歷代名將 新增第二批 (Historical biographies — batch 2) ───
  'hist-an-lushan': {
    era: { zh: '安史之亂', en: 'The An Lushan Rebellion' },
    zh: '營州柳城雜胡,粟特、突厥混血。唐玄宗時三鎮節度使,擁兵十五萬。天寶十四載冬,以誅楊國忠為名,起兵范陽,陷洛陽、長安,玄宗奔蜀,楊貴妃縊死於馬嵬坡。安祿山稱大燕皇帝。次年為其子安慶緒所弒。安史之亂前後八年,唐由是衰。',
    en: 'A mixed-blood Hu of Liucheng in Yingzhou, of Sogdian and Türk descent. Under Xuanzong he held three military governorships with a hundred and fifty thousand under arms. In the winter of 755, under the pretext of striking down Yang Guozhong, he rose at Fanyang, took Luoyang and Chang\'an; the emperor fled to Shu and Yang Guifei was hanged at Mawei Slope. He called himself emperor of Great Yan. The next year his son An Qingxu killed him. The eight-year revolt brought Tang into decline.',
  },
  'hist-xue-rengui': {
    era: { zh: '三箭定天山', en: 'Three Arrows Settled Mount Tian' },
    zh: '字仁貴,絳州龍門人。唐太宗東征高句麗,白袍持戟,單騎陷陣,太宗驚曰:「朕不喜得遼東,喜得卿!」 後征九姓鐵勒,三箭射殺三將,胡人歌曰:「將軍三箭定天山,壯士長歌入漢關。」 平高句麗,封平陽郡公。',
    en: 'Style Rengui, of Longmen in Jiangzhou. When Taizong marched east against Goguryeo, in a white robe with a halberd he rode alone into the line; Taizong was startled: "I am not so glad to have Liaodong as I am to have you!" Later, on the campaign against the Nine Tribes of the Tiele, three arrows killed three generals, and the Hu sang: "The general with three arrows settled Mount Tian; the brave men in long song came back through the Han gate." He pacified Goguryeo and was made Duke of Pingyang commandery.',
  },
  'hist-hai-rui': {
    era: { zh: '海青天', en: 'Hai the Blue Sky' },
    zh: '字汝賢,號剛峰,瓊山人。明朝清官。性剛直,持身清苦,妻女衣食粗惡。任淳安知縣,觸權貴胡宗憲。後上《直言天下第一事疏》,備棺木以對嘉靖帝,世稱「海青天」。萬曆時為南京右都御史,卒於官,家無餘財。',
    en: 'Style Ruxian, called Gangfeng, of Qiongshan. A clean official of Ming. Stiff and upright in temper, austere in life — his wife and daughters in coarse cloth and poor food. As Magistrate of Chun\'an he clashed with the great in-laws Hu Zongxian. He sent up the Memorial on the First Affair of the Realm, brought a coffin to face Emperor Jiajing — and the world called him "Hai the Blue Sky." Under Wanli he was Censor-in-Chief of Nanjing and died in office; his house held nothing.',
  },
  'hist-zhang-juzheng': {
    era: { zh: '明朝第一改革家', en: 'First Reformer of Ming' },
    zh: '字叔大,號太岳,湖廣江陵人。萬曆首輔。萬曆元年至十年,主持「一條鞭法」改革,簡化賦稅,清查田畝,國庫充實。又用戚繼光、李成梁鎮邊,北疆無事。卒,神宗親政,反對者構陷,張居正被抄家,長子自殺,改革成果盡毀。',
    en: 'Style Shuda, called Taiyue, of Jiangling in Huguang. First Grand Secretary under Wanli. From 1573 to 1582 he led the Single-Whip reform, simplifying the taxes and surveying the fields; the treasury was filled. With Qi Jiguang and Li Chengliang on the frontier, the north was at peace. At his death, when Wanli took up rule himself, his enemies framed him; his house was confiscated, his eldest son took his own life, and the work of reform was destroyed.',
  },
  'hist-di-qing': {
    era: { zh: '面涅將軍', en: 'The Tattooed-Face General' },
    zh: '字漢臣,汾州西河人。北宋名將。出身行伍,面有刺字,猶不肯洗去,曰:「此天子之惠,願以此勵諸軍。」 與西夏戰,屢勝。後平儂智高之亂,夜襲崑崙關,大破之。封彰化軍節度使。狄青出身行伍而位至樞密使,千古傳為軍人之榮。',
    en: 'Style Hanchen, of Xihe in Fenzhou. A famed Northern Song general. Born to the ranks, his face was branded — and he would not wash it off: "This is the grace of the Son of Heaven; let it spur the army." Against the Xixia he won many fights. He later put down Nong Zhigao\'s revolt with a night attack on Kunlun Pass and broke it utterly. Made Military Commissioner of Zhanghua, he rose from the ranks to Bureau of Military Affairs Director — a glory for soldiers across the ages.',
  },
  'hist-ouyang-xiu': {
    era: { zh: '醉翁', en: 'The Drunken Old Man' },
    zh: '字永叔,號醉翁,廬陵人。北宋文壇盟主,唐宋八大家之一。主持嘉祐年間貢舉,拔蘇軾、蘇轍兄弟,獎掖後進。著《醉翁亭記》、《秋聲賦》、《新五代史》、《新唐書》。「醉翁之意不在酒,在乎山水之間」千古絕唱。',
    en: 'Style Yongshu, called the Drunken Old Man, of Luling. Master of the Northern Song literary world, one of the Eight Masters of Tang and Song. He led the Jiayou imperial examination and lifted up the Su Shi and Su Zhe brothers, nurturing the next generation. The Pavilion of the Drunken Old Man, the Sounds of Autumn Rhapsody, the New History of the Five Dynasties, and the New Book of Tang are his. "The Drunken Old Man\'s heart is not in the wine — it is in the hills and waters" rings forever.',
  },
  'hist-zhou-dunyi': {
    era: { zh: '理學之祖', en: 'Founder of Neo-Confucianism' },
    zh: '字茂叔,號濂溪,道州人。北宋理學開山祖師。著《太極圖說》、《通書》,以「無極而太極」立宋學之本。為程顥、程頤之師。一生愛蓮,作《愛蓮說》:「予獨愛蓮之出淤泥而不染,濯清漣而不妖。」 千古絕唱。',
    en: 'Style Maoshu, called Lianxi, of Daozhou. The founding master of Northern Song neo-Confucianism. He wrote the Diagram of the Supreme Ultimate and the Comprehending the Changes, fixing the root of Song learning in "from Wuji to Taiji." Teacher of Cheng Hao and Cheng Yi. All his life he loved the lotus, writing in the Discourse on Loving the Lotus: "I alone love the lotus that rises from the mud unstained, washed by the clear ripples and yet not seductive." It rings forever.',
  },
  'hist-zhang-zai': {
    era: { zh: '橫渠四句', en: 'The Four Sentences of Hengqu' },
    zh: '字子厚,號橫渠,鳳翔郿人。北宋理學家。「為天地立心,為生民立命,為往聖繼絕學,為萬世開太平」橫渠四句,千古儒者之志。著《正蒙》、《西銘》。',
    en: 'Style Zihou, called Hengqu, of Mei in Fengxiang. A Northern Song neo-Confucian. "To set the heart for Heaven and Earth, to set the destiny for the living people, to carry on the lost learning of past sages, to open the great peace for ten thousand ages" — the Four Sentences of Hengqu, the will of Confucians for all ages. The Correcting the Ignorant and the Western Inscription are his.',
  },
  'hist-shao-yong': {
    zh: '字堯夫,謚康節,共城人。北宋理學家。精易學,著《皇極經世》、《觀物內外篇》。以象數推天地萬物之變,世稱「邵子神數」。隱於洛陽安樂窩,日飲一壺酒,號「安樂先生」。',
    en: 'Style Yaofu, posthumous Kangjie, of Gongcheng. A Northern Song neo-Confucian. A master of the Book of Changes, he wrote the Supreme Principles Governing the World and the Inner and Outer Pieces on Observing Things. By image and number he traced the changes of heaven, earth, and the ten thousand things — the world spoke of "Master Shao\'s divine numerology." He hid himself at Anle Cottage in Luoyang, a daily jug of wine, called the "Master of Happy Peace."',
  },
  'hist-fu-bi': {
    zh: '字彥國,洛陽人。北宋名相。出使遼國,折遼興宗之氣,使宋遼之盟得以續。又佐范仲淹行慶曆新政。位至宰相。卒,謚文忠。',
    en: 'Style Yanguo, of Luoyang. A famed chancellor of Northern Song. Sent as envoy to the Liao, he bent the spirit of Liao Xingzong and renewed the Song-Liao treaty. With Fan Zhongyan he helped lead the Qingli New Policies. He rose to chancellor. He died, posthumous name Wenzhong.',
  },
  'hist-fan-zhi': {
    zh: '字文素,大名宗城人。北宋初宰相。事周、宋兩朝,以清廉著稱。位至司空,封魯國公。',
    en: 'Style Wensu, of Zongcheng in Daming. An early Northern Song chancellor, serving both Zhou and Song; known for clean hands. He rose to Excellency over the Works and was made Duke of Lu.',
  },
  'hist-fan-chengda': {
    zh: '字至能,號石湖居士,蘇州吳縣人。南宋詩人。與陸游、楊萬里、尤袤並稱「中興四大詩人」。出使金國,氣節凜然,金人服之。著《石湖居士詩集》、《吳郡志》。',
    en: 'Style Zhineng, called the Recluse of Stone Lake, of Wu county in Suzhou. A Southern Song poet, with Lu You, Yang Wanli, and You Mao the "Four Great Poets of the Restoration." Sent as envoy to the Jin, he stood with rigid honor and the Jin yielded. The Collected Poems of the Stone Lake Recluse and the Gazetteer of Wujun are his.',
  },
  'hist-fan-kuai': {
    zh: '沛縣人,劉邦妻舅。出身屠狗。鴻門宴中持劍盾闖入,瞋目視項羽,助劉邦脫險。漢定,封舞陽侯。性勇悍,然忠心耿耿,劉邦病重時欲殺之,賴呂后保之。',
    en: 'Of Pei county, brother-in-law of Liu Bang, born to a dog-butcher\'s house. At the Hongmen Banquet he burst in bearing sword and shield and glared at Xiang Yu, helping Liu Bang escape. After Han was set he was made Marquis of Wuyang. Bold and rough, but utterly loyal; when Liu Bang on his sickbed would have killed him, Empress Lü saved him.',
  },
  'hist-chen-ping': {
    era: { zh: '六出奇計', en: 'Six Wonders of Counsel' },
    zh: '陽武戶牖人。事項羽,後歸劉邦。獻六奇計:離間項羽范增、解滎陽圍、許韓信為齊王、使劉邦脫白登之圍等。漢定,位至丞相。性巧詐,以智謀名。',
    en: 'Of Huyou in Yangwu. He first served Xiang Yu, then went over to Liu Bang. He gave six wonders of counsel — driving Fan Zeng away from Xiang Yu, lifting the siege of Yingyang, letting Han Xin be made King of Qi, freeing Liu Bang from Baideng. When Han was set he rose to chancellor. Wily and clever, famed for his stratagems.',
  },
  'hist-chen-liang': {
    zh: '字同甫,號龍川,婺州永康人。南宋思想家、詞人。主張抗金,屢上書孝宗,意氣豪邁。與朱熹有「義利之辯」,主功利之學。詞風豪放,與辛棄疾為摯友。卒於紹熙五年,年五十二。',
    en: 'Style Tongfu, called Longchuan, of Yongkang in Wuzhou. A Southern Song thinker and ci poet. He urged war against the Jin and sent memorial after memorial to Emperor Xiaozong, bold and spirited. With Zhu Xi he held the great debate on righteousness and profit, championing the practical school. His ci was wild and grand; he was sworn friend to Xin Qiji. He died in 1194 at fifty-two.',
  },
  'hist-chen-xuanli': {
    zh: '唐玄宗禁軍將領。安史之亂中,隨玄宗西奔。馬嵬坡,陳玄禮率眾誅楊國忠,逼縊楊貴妃,千古馬嵬之變實主之。',
    en: 'A commander of the imperial guard under Emperor Xuanzong of Tang. In the An Lushan rebellion he fled west with the emperor. At Mawei Slope, Chen Xuanli led the men to kill Yang Guozhong and force the hanging of Yang Guifei — the Mawei mutiny of the ages was his.',
  },
  'hist-chen-youliang': {
    zh: '沔陽人。元末群雄之一。據江漢,自稱漢帝。鄱陽湖大戰,與朱元璋決戰,水戰三十六日,陳友諒中流矢而死,漢國遂亡,朱元璋遂得天下。',
    en: 'Of Mianyang. One of the great rebels of late Yuan. He held the Han-Jiang region and called himself emperor of Han. At Poyang Lake he fought Zhu Yuanzhang in a thirty-six-day naval battle; Chen Youliang was struck by a stray arrow and died, his Han kingdom ended, and Zhu Yuanzhang gained the realm.',
  },
  'hist-du-fuwei': {
    zh: '齊郡章丘人。隋末群雄之一。據江淮,號為「江淮霸主」。後降唐,封吳王。武德五年入朝,為李淵所殺。',
    en: 'Of Zhangqiu in Qijun. One of the great rebels of late Sui. He held the Huai region and called himself "Hegemon of the Huai." Later he submitted to Tang and was made King of Wu. When he came to court in 622, Li Yuan killed him.',
  },
  'hist-du-you': {
    era: { zh: '通典作者', en: 'Author of the Tongdian' },
    zh: '字君卿,京兆萬年人。唐代史學家。歷時三十六年,著《通典》二百卷,中華第一部典章制度通史。位至宰相。',
    en: 'Style Junqing, of Wannian in the metropolitan region. A Tang historian. For thirty-six years he laboured on the Tongdian in two hundred fascicles — China\'s first connected history of institutions and laws. He rose to chancellor.',
  },
  'hist-du-yu': {
    era: { zh: '武庫', en: 'The Armory' },
    zh: '字元凱,京兆杜陵人。西晉名將。博學多通,世稱「杜武庫」。鎮西大將軍,主謀伐吳。咸寧五年率軍渡江,連克江陵、武昌,長驅直入,旬月之間吳亡。著《春秋左氏經傳集解》,千古不刊。',
    en: 'Style Yuankai, of Duling in the metropolitan region. A famed general of Western Jin. Vastly learned, the world called him "Du the Armory." As Grand General Who Garrisons the West, he was chief planner of the war on Wu. In 279 he led his army across the river, took Jiangling and Wuchang in one breath, drove straight on, and within a month Wu was undone. His Collected Notes on the Spring and Autumn Annals and Its Zuo Tradition has never gone out of use.',
  },
  'hist-ji-xiaolan': {
    zh: '名昀,字曉嵐,獻縣人。乾隆寵臣。主編《四庫全書》,凡十年,七萬九千卷。性風趣,常與乾隆對句,世傳趣事甚多。著《閱微草堂筆記》傳世。',
    en: 'Personal name Yun, style Xiaolan, of Xian county. A favored minister of Qianlong. He led the compilation of the Complete Library in Four Treasuries — ten years, seventy-nine thousand fascicles. Witty by temper, he often matched couplets with Qianlong, and many stories survive. The Notes from the Yuewei Cottage is his.',
  },
  'hist-zheng-banqiao': {
    era: { zh: '揚州八怪', en: 'One of the Eight Eccentrics of Yangzhou' },
    zh: '名燮,字克柔,號板橋,興化人。清代書畫家。揚州八怪之一。善畫竹蘭石,書法獨創「六分半書」。為官清廉,任濰縣令時開倉賑災,救民無數。「難得糊塗」、「一枝一葉總關情」千古傳為人生境界。',
    en: 'Personal name Xie, style Keruo, called Banqiao, of Xinghua. A Qing painter and calligrapher, one of the Eight Eccentrics of Yangzhou. Master of bamboo, orchid, and stone; in calligraphy he created the "six-and-a-half-tenths script." A clean official, as Magistrate of Wei county he opened the granaries to relieve famine and saved countless lives. "Difficult to be muddled" and "every branch and leaf is feeling" are read forever as states of life.',
  },
  'hist-yan-ying': {
    era: { zh: '齊國賢相', en: 'Worthy Chancellor of Qi' },
    zh: '字仲,夷維人。春秋齊國名相,事齊靈公、莊公、景公三朝。身不滿六尺,而智冠群臣。出使楚國,以辭辯折楚靈王,「橘生淮南則為橘,生淮北則為枳」千古傳為佳話。著《晏子春秋》。',
    en: 'Style Zhong, of Yiwei. A famed chancellor of Qi in the Spring and Autumn, serving Dukes Ling, Zhuang, and Jing. Less than six chi tall, but his wit stood above all the ministers. Sent as envoy to Chu, he bested King Ling of Chu by argument: "The orange grown south of the Huai is an orange; grown north of the Huai it is a wild thorn-apple" — read forever as a fine tale. The Spring and Autumn Annals of Master Yan is his.',
  },
  'hist-ji-zha': {
    zh: '吳王壽夢第四子,封於延陵。父兄三讓其位,皆不就。觀周樂於魯,評之精當,知音之祖。掛劍徐君墓樹之典,千古傳為信義之高。',
    en: 'Fourth son of King Shoumeng of Wu, enfeoffed at Yanling. His father and brothers three times tried to give him the throne; he would not take it. He watched the music of Zhou at Lu and judged it perfectly — the founder of the connoisseur of music. The tale of hanging his sword on the tree by the tomb of the Lord of Xu is told forever as the height of faith and honor.',
  },
  'hist-li-shi': {
    zh: '魏國名將。少有勇略。從魏文侯征戰。後事秦,以軍功封侯。',
    en: 'A famed general of Wei. From youth bold of counsel; he marched with Marquis Wen of Wei. He later served Qin and was made marquis for military merit.',
  },
  'hist-fan-ju': {
    era: { zh: '遠交近攻', en: '"Make Friends with the Distant, Strike the Near"' },
    zh: '字叔,魏國人。本為魏中大夫須賈門客,被誣以洩密,鞭笞折肋,棄之廁中。後逃秦,獻「遠交近攻」之策,事秦昭王,位至應侯。其後讒害白起,賜死於杜郵。',
    en: 'Style Shu, of Wei. First a retainer of the Wei Grand Master Xu Jia, falsely accused of leaking secrets he was beaten until his ribs broke and thrown into the latrine. He fled to Qin, gave the strategy "make friends with the distant, strike the near," served King Zhao of Qin, and rose to Marquis of Ying. He later slandered Bai Qi into a draught at Duyou.',
  },
  'hist-fanchi': {
    zh: '名須,孔子弟子。學稼於孔子,孔子曰:「吾不如老農。」 又問為仁,孔子曰:「愛人。」 為孔門七十二賢之一。',
    en: 'Personal name Xu, disciple of Confucius. He asked to learn farming; the Master said: "I am not the equal of an old farmer." He asked about humaneness; the Master said: "Loving men." One of the Seventy-Two Sages of the Confucian school.',
  },
  'hist-fan-zhen': {
    zh: '字子真,南陽舞陰人。南朝齊梁間思想家。著《神滅論》,主張「形即神,神即形」,反對佛教因果輪迴之說,中華唯物論之先聲。',
    en: 'Style Zizhen, of Wuyin in Nanyang. A thinker of the Southern Qi and Liang. He wrote the Discourse on the Extinction of the Spirit, holding that "form is spirit, spirit is form," against the Buddhist doctrines of karma and rebirth — an early voice of Chinese materialism.',
  },
  'hist-fan-chunren': {
    zh: '字堯夫,蘇州吳縣人,范仲淹次子。北宋名臣。位至宰相。性溫和,有父之風。',
    en: 'Style Yaofu, of Wu county in Suzhou, second son of Fan Zhongyan. A famed Northern Song minister; he rose to chancellor. Mild in temper, in the manner of his father.',
  },
  'hist-fan-wencheng': {
    zh: '字憲斗,瀋陽人。清初開國名臣。歸後金,佐皇太極建制度,定典章,謚文程。',
    en: 'Style Xiandou, of Shenyang. A famed founding minister of the Qing. He went over to Later Jin and helped Hongtaiji build the institutions and laws — posthumous name Wencheng.',
  },
  'hist-fang-guozhen': {
    zh: '台州黃岩人。元末群雄之一。海上漁民出身,以海舶起家,據浙東二十年。後降明,封廣西行省左丞,病卒。',
    en: 'Of Huangyan in Taizhou. A great rebel of late Yuan. Born to fishermen and rising by sea-trade, he held the eastern Zhejiang coast for twenty years. He later submitted to Ming and was made Left Vice-Director of Guangxi Province; he died of illness.',
  },
  'hist-fu-youde': {
    zh: '宿州人。明初名將。隨徐達、常遇春北伐,後平雲南,定西南。封潁國公。後為朱元璋所忌,賜死於家。',
    en: 'Of Suzhou. A famed early-Ming general. He marched north with Xu Da and Chang Yuchun, then pacified Yunnan and settled the southwest. Made Duke of Ying. Later, distrusted by Zhu Yuanzhang, he was given a draught at his home.',
  },
  'hist-mu-ying': {
    zh: '字英,號景文,鳳陽人。明初名將。朱元璋義子。平雲南後鎮之十年,築昆明城,通驛道,撫綏夷漢。卒,沐氏世鎮雲南二百八十年。',
    en: 'Style Ying, called Jingwen, of Fengyang. A famed early-Ming general, adopted son of Zhu Yuanzhang. After pacifying Yunnan he held it for a decade, raised the wall of Kunming, opened the post-roads, and gentled tribes and Han alike. At his death the Mu line held Yunnan for two hundred and eighty years.',
  },
  'hist-tang-he': {
    zh: '字鼎臣,濠州鍾離人。明初名將。隨朱元璋起兵,平陳友諒,擒方國珍、陳友定,平定東南。封信國公。功成乞骸骨,得善終,壽七十,謚襄武。',
    en: 'Style Dingchen, of Zhongli in Haozhou. A famed early-Ming general. He rose with Zhu Yuanzhang, broke Chen Youliang, took Fang Guozhen and Chen Youding, and pacified the southeast. Made Duke of Xin. Asking leave to retire, he died peacefully at seventy, posthumous name Xiangwu.',
  },
  'hist-lan-yu': {
    zh: '定遠人,常遇春妻弟。明初名將。北伐元都,捕魚兒海大破北元,擒其后妃、官屬七萬餘人。封涼國公。後被朱元璋以「謀反」之罪族誅,藍玉案連坐一萬五千人,千古慘案。',
    en: 'Of Dingyuan, brother-in-law of Chang Yuchun. A famed early-Ming general. He marched north against the Yuan and at the Buyur Lake broke the Northern Yuan utterly, taking its empresses, consorts, and officers — over seventy thousand. Made Duke of Liang. Later Zhu Yuanzhang killed him on a charge of revolt and wiped out his clan; the Lan Yu case caught up fifteen thousand — a great horror of the ages.',
  },
  'hist-zhu-yunwen': {
    era: { zh: '建文帝', en: 'The Jianwen Emperor' },
    zh: '名朱允炆,朱元璋之孫,懿文太子之子。在位四年,行削藩,逼燕王朱棣起兵。靖難之變,京師陷,朱允炆失蹤,世有「焚於宮」、「為僧」二說,千古之謎。',
    en: 'Personal name Zhu Yunwen, grandson of Zhu Yuanzhang, son of the late Crown Prince Yiwen. Four years he reigned, cutting down the princes — and forced Zhu Di of Yan into revolt. In the Jingnan war when the capital fell, Zhu Yunwen vanished; the world tells of "burned in the palace" or "became a monk" — a mystery for the ages.',
  },
  'hist-wu-sangui': {
    era: { zh: '衝冠一怒為紅顏', en: 'In Rage for the Beauty His Crown Stood on End' },
    zh: '字長伯,遼東人。明末山海關總兵。本欲降李自成,聞愛妾陳圓圓被劉宗敏所擄,大怒,「衝冠一怒為紅顏」,引清兵入關。封平西王,鎮雲南。康熙削藩,三藩之亂起,吳三桂稱周帝。三年敗,憂憤而卒於衡州。',
    en: 'Style Zhangbo, of Liaodong. Commander of the Shanhai Pass at the end of Ming. He meant to surrender to Li Zicheng — but hearing that his beloved Chen Yuanyuan had been taken by Liu Zongmin, his anger rose: "In rage for the beauty his crown stood on end," and he brought the Qing in through the wall. Made Prince of Pingxi, holding Yunnan. When Kangxi cut down the feudatories, the Three Feudatories\' Revolt broke out; Wu Sangui called himself Emperor of Zhou. Three years and broken, he died of grief and rage at Hengzhou.',
  },
  'hist-zheng-zhilong': {
    zh: '字飛黃,福建南安人,鄭成功之父。明末東南海上巨梟。據台海之間,擁海舶千艘,號令半世紀。後降清,封同安侯。順治年間因子鄭成功抗清,被清廷誅於北京。',
    en: 'Style Feihuang, of Nan\'an in Fujian, father of Zheng Chenggong. A great sea-lord of the southeast at the end of Ming. He held the seas between Taiwan and the coast with a thousand ships, commanding for half a century. He later submitted to Qing and was made Marquis of Tong\'an. In the Shunzhi years, because his son Zheng Chenggong resisted the Qing, the court had him killed at Beijing.',
  },
  'hist-shi-lang': {
    era: { zh: '收復臺灣', en: 'Conqueror of Taiwan for Qing' },
    zh: '字尊侯,號琢公,福建晉江人。原鄭成功部,後降清。康熙二十二年,率水師渡海,大破鄭氏,收復臺灣。封靖海侯。中華自此將臺灣置於版圖,直至甲午。',
    en: 'Style Zunhou, called Zhuogong, of Jinjiang in Fujian. Originally with Zheng Chenggong, he submitted to the Qing. In 1683 he led the fleet across the sea, broke the Zheng house, and took Taiwan. Made Marquis of Jinghai. From this China placed Taiwan within her map, until the year jiawu.',
  },
  'hist-jiaqing': {
    zh: '名顒琰,乾隆第十五子。在位二十五年。誅和珅,然國勢衰頹,白蓮教、天理教起義不斷,英國使團來華,鴉片漸入。卒,壽六十一。',
    en: 'Personal name Yongyan, fifteenth son of Qianlong. Twenty-five years he reigned. He killed Heshen — yet the dynasty waned: the White Lotus and Tianli risings broke out one after another, the British embassy came, and opium began to flow in. He died at sixty-one.',
  },
  'hist-daoguang': {
    zh: '名旻寧,嘉慶第二子。在位三十年。鴉片戰爭中清廷大敗,簽訂《南京條約》,割香港、開五口、賠二千一百萬銀元,中華近代屈辱之始。',
    en: 'Personal name Minning, second son of Jiaqing. Thirty years he reigned. In the Opium War the Qing court was utterly broken and signed the Treaty of Nanjing — ceding Hong Kong, opening five ports, paying twenty-one million silver dollars. The age of modern humiliation for China began here.',
  },
  'hist-xianfeng': {
    zh: '名奕詝,道光第四子。在位十一年,值多事之秋。太平天國起,英法聯軍火燒圓明園,咸豐奔熱河,憂憤成疾,卒於避暑山莊,年三十一。',
    en: 'Personal name Yizhu, fourth son of Daoguang. Eleven years he reigned, in an age of trouble. The Taiping Heavenly Kingdom rose; the Anglo-French army burned the Yuanmingyuan; Xianfeng fled to Rehe, fell ill of grief and rage, and died at the Mountain Resort at thirty-one.',
  },
  'hist-hong-xiuquan': {
    era: { zh: '太平天王', en: 'Heavenly King of the Taiping' },
    zh: '本名仁坤,廣東花縣人。屢試不第,鬱鬱不平。讀基督教傳道書,自稱為耶穌之弟,創拜上帝會。咸豐元年於金田起義,號太平天國。十四年間據江南半壁,定都天京(南京)。後內訌、清廷反攻,1864年天京陷,洪秀全絕食死於天王府。',
    en: 'Originally named Renkun, of Hua county in Guangdong. He failed the examinations again and again and bore deep discontent. After reading Christian tracts he called himself the brother of Jesus and founded the God-Worshipping Society. In 1851 at Jintian he raised the rising under the name of the Taiping Heavenly Kingdom. For fourteen years he held half of Jiangnan with his capital at Tianjing (Nanjing). Internal strife and Qing counter-attack came; in 1864 Tianjing fell, and Hong Xiuquan starved himself to death in the Heavenly King\'s palace.',
  },
  'hist-shi-dakai': {
    era: { zh: '翼王', en: 'The Wing King' },
    zh: '廣西貴縣人。太平天國翼王。十六歲輔洪秀全起義,以勇略稱。天京之變後出走西征,轉戰四川,被困大渡河,以己一身換全軍,清軍不守信,凌遲處死於成都,年三十二。',
    en: 'Of Guixian in Guangxi. Wing King of the Taiping Heavenly Kingdom. At sixteen he stood with Hong Xiuquan in the rising, famed for bold counsel. After the Tianjing incident he marched west, fighting through to Sichuan; cornered at the Dadu River, he offered his own life to save his army — but the Qing did not keep faith, and he was torn apart at Chengdu at thirty-two.',
  },
  'hist-chen-yucheng': {
    era: { zh: '英王', en: 'The Hero King' },
    zh: '廣西藤縣人,太平天國英王。少年英勇,屢破清軍。安慶之戰,陳玉成援救不及,城陷。後被叛徒苗沛霖出賣,被清軍凌遲處死於河南延津,年二十六。',
    en: 'Of Tengxian in Guangxi, Hero King of the Taiping. Brave in his youth, he broke the Qing many times. At the battle of Anqing his relief came too late and the city fell. Later betrayed by Miao Peilin, he was torn apart by the Qing at Yanjin in Henan at twenty-six.',
  },
  'hist-li-xiucheng': {
    era: { zh: '忠王', en: 'The Loyal King' },
    zh: '廣西藤縣人,太平天國忠王。後期軍事支柱。曾國藩攻天京,李秀成苦守數年,終城陷被擒。寫《李秀成自述》數萬言而後就死,千古迷案。',
    en: 'Of Tengxian in Guangxi, Loyal King of the Taiping. The military pillar of its later years. When Zeng Guofan laid siege to Tianjing, Li Xiucheng held it bitterly for years; when the city fell at last he was taken. He wrote the Autobiography of Li Xiucheng in tens of thousands of characters and went to his death — a mystery of the ages.',
  },
  // ─── 歷代名將 新增第三批 (Historical biographies — batch 3: Spring & Autumn) ───
  'hist-zhou-wenwang': {
    era: { zh: '周文王', en: 'King Wen of Zhou' },
    zh: '姓姬名昌,商末周國國君。被殷紂囚於羑里七年,演《周易》。出獄後招賢納士,渭水訪呂尚,奠周朝八百年基業。卒,武王繼之伐紂。',
    en: 'Surname Ji, personal name Chang. Ruler of the Zhou state at the end of Shang. Imprisoned by the tyrant Zhou Xin at Youli for seven years, he there composed the Book of Changes. On his release he gathered worthies, met Jiang Ziya by the Wei River, and laid the foundation of the eight-hundred-year house of Zhou. He died; his son King Wu took up the work and overthrew Shang.',
  },
  'hist-zhou-wuwang': {
    era: { zh: '周武王', en: 'King Wu of Zhou' },
    zh: '姓姬名發,文王次子。承父志,以姜子牙為師,率八百諸侯,牧野一戰大破殷軍七十萬,紂王自焚於鹿臺,商遂亡。武王封功臣於各地,定周朝八百年之制。',
    en: 'Surname Ji, personal name Fa, second son of King Wen. Taking up his father\'s resolve, with Jiang Ziya as Grand Tutor he led eight hundred lords to Muye, broke seven hundred thousand of Shang in one blow; the tyrant Zhou burned himself on the Deer Terrace and Shang was ended. King Wu enfeoffed his meritorious men in every region and set the system that endured for eight hundred years.',
  },
  'hist-zhou-chengwang': {
    zh: '名誦,武王之子。十二歲嗣位,周公旦攝政,平管蔡之亂。成王親政後,「成康之治」開西周盛世。卒,康王繼之。',
    en: 'Personal name Song, son of King Wu. He took the throne at twelve; the Duke of Zhou served as regent and put down the Guan-Cai revolt. When King Cheng took up rule himself, the "Reign of Cheng-Kang" opened the golden age of Western Zhou. He died, and King Kang took up the line.',
  },
  'hist-zhou-liwang': {
    zh: '名胡,西周厲王。性暴虐貪婪,任榮夷公專利,行「監謗」之政,殺諫者。國人不堪,起而暴動,厲王奔彘,十四年而死。「防民之口,甚於防川」之語出此。',
    en: 'Personal name Hu, King Li of Western Zhou. Cruel and grasping, he made Duke Yi of Rong monopolize the marshes, set up the "watch on slander," and killed those who spoke. The people would bear no more and rose; King Li fled to Zhi and died there fourteen years later. "To bar the people\'s mouths is worse than barring a river" comes from this.',
  },
  'hist-zhou-xuanwang': {
    zh: '名靜,厲王之子。在位四十六年,初有「宣王中興」之譽,任用召穆公、周定公、尹吉甫,平淮夷、北戎。然晚年好戰,西周由此衰。',
    en: 'Personal name Jing, son of King Li. Forty-six years he reigned. His early years were called the "Restoration of King Xuan," when with Duke Mu of Shao, Duke Ding of Zhou, and Yin Jifu he pacified the Huai-Yi and the Northern Rong. But his late years were too fond of war, and Western Zhou began its decline.',
  },
  'hist-zhou-youwang': {
    zh: '名宮湦,宣王之子。寵褒姒,廢申后與太子宜臼。烽火戲諸侯,失信於天下。申侯怒,引犬戎攻鎬京,幽王死於驪山,西周遂亡。平王東遷洛邑,東周自此始。',
    en: 'Personal name Gongsheng, son of King Xuan. He doted on Baosi, deposed Queen Shen and the heir Yijiu. With his beacon-fires he made sport of the lords and lost the faith of the realm. The Marquis of Shen in fury brought the Quanrong against the capital Haojing; King You died at Mount Li, and Western Zhou fell. King Ping moved east to Luoyi — and from him the Eastern Zhou began.',
  },
  'hist-qi-huan-gong': {
    era: { zh: '春秋首霸', en: 'First Hegemon of the Spring and Autumn' },
    zh: '名小白,齊襄公之弟。鮑叔牙設計使其先入齊都即位。任用管仲為相,鮑叔牙副之,行「尊王攘夷」之策,九合諸侯,一匡天下,為春秋五霸之首。然晚年寵易牙、豎刁,死後諸子爭位,屍蛆出戶六十七日方葬。',
    en: 'Personal name Xiaobai, younger brother of Duke Xiang of Qi. Through Bao Shuya\'s scheme he entered the Qi capital first and took the throne. He raised Guan Zhong as chancellor with Bao Shuya as deputy and led the "honor the king, repel the barbarians" policy — nine times he gathered the lords and set the realm in order, first of the Five Hegemons of the Spring and Autumn. But in his old age he doted on Yi Ya and Shu Diao; his sons fought for the throne when he died, and his maggot-ridden body lay sixty-seven days before burial.',
  },
  'hist-song-xianggong': {
    era: { zh: '宋襄之仁', en: 'The Mercy of Duke Xiang of Song' },
    zh: '名茲甫,宋國國君。齊桓公死後,欲繼為霸主。與楚成王戰於泓水,楚軍渡河未濟、列陣未成時,公子目夷皆勸擊之,襄公皆不從,曰:「君子不困人於阸。」 終大敗,襄公中股,次年傷重而卒。「宋襄之仁」千古為笑談。',
    en: 'Personal name Zifu, ruler of the Song state. After Duke Huan of Qi died, he wished to take up the hegemony. He met King Cheng of Chu in battle at the Hong River; as the Chu army crossed the river and before they could form their line, the prince Muyi twice urged the strike. Duke Xiang refused: "A gentleman does not press a man in a strait." He was utterly broken and shot in the thigh, dying of the wound the next year. "The mercy of Duke Xiang of Song" is told down the ages as a joke.',
  },
  'hist-jin-wen-gong': {
    era: { zh: '退避三舍', en: 'Retreated Three Days\' March' },
    zh: '名重耳,晉獻公次子。少時遭驪姬之亂,亡命列國十九年。流亡中受楚成王厚待,許曰:「若返國治政,他日相見,當退避三舍。」 後返晉即位,大行新政。城濮之戰,果踐前言,退軍九十里,大破楚軍。春秋五霸之一。',
    en: 'Personal name Chong\'er, second son of Duke Xian of Jin. In youth, caught up in the Lady Li disaster, he fled abroad for nineteen years. In exile King Cheng of Chu received him richly; Chong\'er promised: "If I return to rule, on the day we meet again I will retreat three days\' march." He returned, took the throne, and reformed the state. At Chengpu, true to his word, he pulled back ninety li — then broke the Chu host. One of the Five Hegemons of the Spring and Autumn.',
  },
  'hist-qin-mugong': {
    era: { zh: '秦穆公', en: 'Duke Mu of Qin' },
    zh: '名任好,春秋秦國國君。在位三十九年,以五羖羊皮聘百里奚,任用蹇叔、由余等賢臣,平西戎,稱霸西陲,春秋五霸之一。崤之戰雖敗於晉,然撫綏戰士,終成西伯。',
    en: 'Personal name Renhao, ruler of Qin in the Spring and Autumn. Thirty-nine years he reigned, summoning Baili Xi for the price of five black goatskins, employing Jian Shu, You Yu, and other worthies; he pacified the western Rong and became hegemon of the west — one of the Five Hegemons of the Spring and Autumn. Though broken at the battle of Yao by Jin, he comforted his soldiers and grew into the Lord of the West.',
  },
  'hist-chu-zhuang-wang': {
    era: { zh: '不鳴則已,一鳴驚人', en: '"Once It Cries, It Astonishes the World"' },
    zh: '名旅,楚成王之孫。三年不問政事,大臣諫之,莊王曰:「三年不蜚,蜚將沖天;三年不鳴,鳴將驚人。」 後親政,任用孫叔敖,平內亂,北上中原,邲之戰大破晉軍,問鼎中原。春秋五霸之一。',
    en: 'Personal name Lü, grandson of King Cheng of Chu. Three years he did not touch state affairs; when his ministers urged him, he said: "Three years without flying, when it flies it will pierce the sky; three years without crying, when it cries it will astonish the world." He took up rule, raised Sunshu Ao, settled the inner troubles, marched north to the central plains, broke the Jin army at Bi, and asked the weight of the ding cauldrons. One of the Five Hegemons.',
  },
  'hist-chu-chengwang': {
    zh: '楚成王熊惲。在位四十六年,擴楚地千里,北敗齊兵,稱霸南方。後欲廢太子商臣,商臣攻成王,逼縊之。',
    en: 'King Cheng of Chu, Xiong Yun. Forty-six years he reigned, opening a thousand li of new ground for Chu, broke the Qi army in the north, and was hegemon of the south. Late in life he meant to depose the heir Shangchen; Shangchen attacked the king and forced him to hang himself.',
  },
  'hist-chu-gongwang': {
    zh: '楚共王熊審。楚莊王之子。鄢陵之戰被晉軍射傷一目。臨終嘆「不穀蒞政而獨敗於鄢陵,當謚靈、厲」。',
    en: 'King Gong of Chu, Xiong Shen, son of King Zhuang. At the battle of Yanling the Jin shot him through one eye. On his deathbed he sighed: "I have ruled and alone lost at Yanling — let my posthumous name be Ling or Li."',
  },
  'hist-chu-huiwang': {
    zh: '楚惠王熊章。在位五十七年,平白公勝之亂,北上滅蔡、滅杞,楚復興盛。',
    en: 'King Hui of Chu, Xiong Zhang. Fifty-seven years he reigned. He put down the revolt of Sheng of Bai, marched north to swallow Cai and Qi — and Chu rose again.',
  },
  'hist-chu-lingwang': {
    zh: '楚靈王熊圍。性奢侈,築章華臺,「楚王好細腰,宮中多餓死」。後諸弟起兵,靈王眾叛親離,自縊於申亥之家。',
    en: 'King Ling of Chu, Xiong Wei. Lavish in life, he built the Zhanghua Terrace — "the king of Chu loved thin waists, and the palace ladies starved themselves to death." When his brothers rose against him, his people and kin fell away; he hanged himself in Shen Hai\'s house.',
  },
  'hist-chu-pingwang': {
    zh: '楚平王熊棄疾。聽信費無忌之讒,奪太子建之妃,殺伍奢、伍尚父子,逼伍子胥奔吳。後吳師伐楚入郢,伍子胥鞭楚平王屍三百以雪父兄之仇。',
    en: 'King Ping of Chu, Xiong Qiji. Listening to Fei Wuji\'s slander, he took the heir Jian\'s bride, killed Wu She and Wu Shang father and son, and forced Wu Zixu into exile with Wu. Later the Wu army marched on Chu and entered Ying, and Wu Zixu whipped the corpse of King Ping three hundred strokes to wash out the grudge.',
  },
  'hist-helu': {
    era: { zh: '吳王闔閭', en: 'King Helu of Wu' },
    zh: '名光,吳王諸樊之子。使專諸刺王僚而自立。任用伍子胥、孫武,西破楚入郢,北威齊晉,南服越。後與越王句踐戰於檇李,中箭傷足而死,囑子夫差勿忘越仇。',
    en: 'Personal name Guang, son of King Zhufan of Wu. Through Zhuan Zhu he assassinated King Liao and took the throne himself. With Wu Zixu and Sun Wu, he broke Chu in the west and entered Ying, awed Qi and Jin in the north, and brought Yue to heel in the south. Later in battle with King Goujian of Yue at Zuili he was shot in the foot and died, charging his son Fuchai not to forget the grudge of Yue.',
  },
  'hist-fuchai': {
    era: { zh: '吳王夫差', en: 'King Fuchai of Wu' },
    zh: '吳王闔閭之子。為報父仇,擊敗越句踐於夫椒,圍之於會稽。句踐請降,夫差釋之。後夫差北上爭霸,黃池之會問鼎中原。然句踐臥薪嘗膽,內修十年,終以越兵破吳。夫差自殺,以巾覆面曰:「吾無顏見伍子胥於地下!」',
    en: 'King Fuchai of Wu, son of King Helu. To avenge his father he broke King Goujian of Yue at Fujiao and besieged him at Kuaiji; Goujian begged surrender and Fuchai let him go. Fuchai then marched north for hegemony and at the meeting of Huangchi asked the weight of the cauldrons. But Goujian, sleeping on brushwood and tasting gall, rebuilt for ten years and at last broke Wu. Fuchai killed himself, covering his face with a cloth: "I cannot face Wu Zixu in the world below!"',
  },
  'hist-jian-shu': {
    zh: '宋人,百里奚之友。秦穆公以重幣聘之,與百里奚共佐穆公,稱霸西戎。崤之戰前哭送其子,謂秦軍必敗,果應其言。',
    en: 'Of Song, friend of Baili Xi. Duke Mu of Qin called him with rich gifts; with Baili Xi he served Duke Mu in the hegemony of the western Rong. Before the battle of Yao he wept as his son rode out, saying the Qin army would surely lose — and his words came true.',
  },
  'hist-jie-zitui': {
    era: { zh: '割股啖君', en: 'Cut Flesh from His Thigh to Feed His Lord' },
    zh: '春秋晉國介之推。隨重耳流亡十九年,飢時割股肉以食重耳。重耳即位為晉文公,大封從臣,獨遺之推。之推不爭,攜母隱於綿山。文王悔,焚山逼之出,介之推與母抱樹而焚死。後人立寒食節以紀之。',
    en: 'Jie Zhitui of Jin in the Spring and Autumn. He followed Chong\'er through nineteen years of exile; in their hunger he cut flesh from his own thigh to feed his lord. When Chong\'er took the Jin throne as Duke Wen and richly enfeoffed his men, he alone was forgotten. Jie Zhitui would not contend; with his mother he hid in Mount Mian. The duke regretted and burned the mountain to force him out; Jie Zhitui and his mother embraced a tree and burned to death. Later the Cold Food Festival was set to commemorate him.',
  },
  'hist-sunshu-ao': {
    era: { zh: '令尹孫叔敖', en: 'Chancellor Sunshu Ao' },
    zh: '楚莊王令尹。三起三黜而面無慍色,興水利,鑄錢幣,楚由是強。位至宰相而家無餘財。臨終戒子勿受封地,得善終。',
    en: 'Chancellor under King Zhuang of Chu. Three times raised and three times cast down, his face never showed displeasure. He raised the waterworks, cast the coinage — and Chu grew strong. He rose to chancellor and his household held nothing. On his deathbed he warned his son to take no fief and died peacefully.',
  },
  'hist-shen-baoxu': {
    era: { zh: '哭秦庭', en: 'Wept at the Court of Qin' },
    zh: '楚國大夫,伍子胥之友。子胥伐楚入郢,申包胥奔秦乞師。立於秦庭,哭七日七夜,水漿不入口。秦哀公感之,賦《無衣》,出兵助楚,大破吳師,楚復國。',
    en: 'A grandee of Chu, friend of Wu Zixu. When Wu Zixu marched on Chu and entered Ying, Shen Baoxu fled to Qin to beg an army. He stood at the Qin court and wept seven days and seven nights, taking neither food nor water. Duke Ai of Qin was moved, sang the verse "Without Robes," and sent troops to help Chu; the Wu host was broken and Chu restored.',
  },
  'hist-zigong': {
    zh: '名端木賜,孔子弟子。能言善辯,精商賈,孔門十哲之一。出使列國,折衝樽俎,「子貢一出,存魯、亂齊、破吳、強晉、霸越」。',
    en: 'Personal name Duanmu Ci, disciple of Confucius. Eloquent and a master of commerce, one of the Ten Philosophers of the school. Sent as envoy to many states he swayed them at the wine-table: "One sortie of Zigong preserved Lu, threw Qi into chaos, broke Wu, strengthened Jin, and made Yue hegemon."',
  },
  'hist-zilu': {
    zh: '名仲由,字子路,孔子弟子。性勇直,事孔子四十年。後事衛,值衛亂,別人勸其去,子路曰:「食其食者不避其難。」 戰至冠纓斷,曰:「君子死,冠不免。」 結纓而死。孔子聞之,覆醢以哀。',
    en: 'Personal name Zhongyou, style Zilu, disciple of Confucius. Bold and straight; he served the Master forty years. He later served Wey; when chaos broke out and others urged him to flee, he said: "He who eats his lord\'s food does not flee his trouble." He fought until his cap-cord was cut and said: "A gentleman dies — his cap shall not fall." He tied the cord and fell. When Confucius heard, he overturned the meat-sauce in his grief.',
  },
  'hist-yan-hui': {
    era: { zh: '亞聖', en: 'Second Sage' },
    zh: '字子淵,孔子弟子。一簞食,一瓢飲,在陋巷,人不堪其憂,回也不改其樂。孔子贊曰:「賢哉回也!」 不幸早卒,孔子哭之慟,曰:「天喪予!天喪予!」 後世尊為復聖。',
    en: 'Style Ziyuan, disciple of Confucius. "A single bowl of rice, a single gourd of water, in a mean alley — others could not bear the grief, Hui did not change his joy." Confucius praised: "How worthy is Hui!" He died young; Confucius wept till his voice broke: "Heaven has bereft me! Heaven has bereft me!" Later ages honored him as the Restored Sage.',
  },
  'hist-zaiwo': {
    zh: '名予,字子我,孔子弟子。能言善辯。晝寢,孔子斥之:「朽木不可雕也,糞土之牆不可圬也。」 後事齊,參與田常之亂,被田常所殺,夷其族。',
    en: 'Personal name Yu, style Ziwo, disciple of Confucius. Eloquent in speech. He napped by day, and the Master rebuked him: "Rotten wood cannot be carved; a wall of dung cannot be plastered." He later served Qi, joined the revolt of Tian Chang, and was killed by Tian Chang — his clan exterminated.',
  },
  'hist-zhonggong': {
    zh: '名冉雍,字仲弓,孔子弟子。德行高潔,孔子稱:「雍也可使南面。」 為季氏宰,有惠政。',
    en: 'Personal name Ran Yong, style Zhonggong, disciple of Confucius. Of high virtue. The Master said: "Yong might face south as a ruler." As steward of the Ji clan he ruled with grace.',
  },
  'hist-ranqiu': {
    zh: '名求,字子有,孔子弟子。多才多藝,長於政事。為季氏宰,助季氏聚斂,孔子怒曰:「非吾徒也!小子鳴鼓而攻之可也。」',
    en: 'Personal name Qiu, style Ziyou, disciple of Confucius. Of many gifts, master of affairs of state. As steward of the Ji clan he helped them gather wealth, and the Master raged: "He is no disciple of mine! Let the young men beat the drum and attack him."',
  },
  'hist-zizhang': {
    zh: '名顓孫師,字子張,孔子弟子。志向高遠,問達於孔子。孔子答:「夫達也者,質直而好義,察言而觀色,慮以下人。」',
    en: 'Personal name Zhuansun Shi, style Zizhang, disciple of Confucius. Of lofty aim. He asked about reaching the truly accomplished; the Master answered: "He who is truly accomplished is upright in substance and loves righteousness, weighs words and watches faces, thinks always to bow before others."',
  },
  'hist-ziyou': {
    zh: '名言偃,字子游,孔子弟子。長於文學。為武城宰,以禮樂教民,孔子聞絃歌之聲,莞爾而笑曰:「割雞焉用牛刀?」',
    en: 'Personal name Yan Yan, style Ziyou, disciple of Confucius. Master of letters. As steward of Wucheng he taught the people through ritual and music; Confucius heard the strings and song and smiled: "Why use an ox-knife to kill a chicken?"',
  },
  'hist-zijian': {
    zh: '名宓不齊,字子賤,孔子弟子。為單父宰,鳴琴而治,百姓安樂。孔子贊曰:「君子哉若人!魯無君子者,斯焉取斯?」',
    en: 'Personal name Mi Buqi, style Zijian, disciple of Confucius. As steward of Shanfu he ruled by playing the qin, and the people lived in ease. The Master praised: "A gentleman, this man! Were there no gentlemen in Lu, where would he get this from?"',
  },
  'hist-gongye-chang': {
    zh: '孔子弟子,孔子之婿。能解鳥語。雖嘗在縲紲之中,孔子以為非其罪,妻之以女。',
    en: 'Disciple of Confucius and his son-in-law. He could understand the speech of birds. Though once jailed, the Master said it was no fault of his and married his daughter to him.',
  },
  'hist-qidiao-kai': {
    zh: '孔子弟子。孔子使之仕,對曰:「吾斯之未能信。」 孔子悅之。',
    en: 'A disciple of Confucius. When the Master sent him to take office he replied: "In this I cannot yet trust myself." The Master was glad.',
  },
  'hist-gao-chai': {
    zh: '字子羔,孔子弟子。身不滿五尺,然執法公正,事衛,逢衛亂全身而退。',
    en: 'Style Zigao, disciple of Confucius. Less than five chi tall, yet upright in the law; he served Wey and when chaos broke out he escaped with his life.',
  },
  'hist-gongxi-hua': {
    zh: '名赤,字子華,孔子弟子。善於禮節,出使能應對。孔子贊曰:「赤也,束帶立於朝,可使與賓客言也。」',
    en: 'Personal name Chi, style Zihua, disciple of Confucius. Master of ritual and a fit envoy. The Master praised: "Chi — girt with his sash he might stand in court and speak with the foreign guests."',
  },
  'hist-sima-niu': {
    zh: '名耕,字子牛,宋國人,孔子弟子。其兄桓魋亂宋,子牛憂之。問君子於孔子,孔子曰:「不憂不懼。」',
    en: 'Personal name Geng, style Ziniu, of Song, disciple of Confucius. His brother Huan Tui threw Song into chaos and Ziniu was full of grief. He asked the Master about the gentleman; Confucius said: "He neither grieves nor fears."',
  },
  'hist-yan-lu': {
    zh: '字路,孔子弟子,顏回之父。顏回死,顏路請孔子之車賣為椁,孔子不許。',
    en: 'Style Lu, disciple of Confucius and father of Yan Hui. When Yan Hui died, Yan Lu asked the Master\'s carriage to sell for an outer coffin; Confucius would not give it.',
  },
  'hist-shao-gong-shi': {
    zh: '召公奭,周文王之子。輔成王、康王,與周公旦並稱「周召」。治燕,以恩信服胡,燕由是強。',
    en: 'Duke Shi of Shao, son of King Wen. He served as regent under Kings Cheng and Kang, and with the Duke of Zhou was called "Zhou and Shao." Ruling Yan, he brought the Hu in by faith and grace, and Yan grew strong.',
  },
  'hist-zi-chan': {
    era: { zh: '鄭子產', en: 'Zichan of Zheng' },
    zh: '名僑,字子產,鄭國公族。執政二十六年,鑄刑書於鼎,開法律公布之先聲。孔子稱其有「君子之道四焉」。卒,孔子聞之流涕曰:「古之遺愛也!」',
    en: 'Personal name Qiao, style Zichan, of the Zheng ducal house. For twenty-six years he held the reins, casting the penal code onto bronze tripods — the first public publication of law. Confucius said: "In him are four ways of the gentleman." At his death Confucius wept: "A bequest of love from antiquity!"',
  },
  'hist-zheng-zhuanggong': {
    zh: '名寤生,鄭武公之子。春秋初鄭國中興之主。母武姜偏愛其弟共叔段,謀叛,被莊公平定,與母誓「不及黃泉,無相見也」,後掘隧黃泉相見而和。',
    en: 'Personal name Wusheng, son of Duke Wu of Zheng. The restorer of Zheng in early Spring and Autumn. His mother Lady Wujiang loved his brother Gongshu Duan more; she helped him plot revolt and was put down. Duke Zhuang swore to his mother: "Not until we reach the Yellow Springs shall we meet." Later he dug a tunnel to the Yellow Springs and met her there, and they were reconciled.',
  },
  'hist-zhao-dun': {
    zh: '春秋晉國正卿。權傾朝野。靈公欲殺之,鉏麑刺殺不忍而觸樹死。後趙穿弒靈公,趙盾雖未親手,然太史董狐書「趙盾弒其君」,千古史筆之典。',
    en: 'Chief minister of Jin in the Spring and Autumn. Power above the court. Duke Ling sought to kill him; the assassin Chu Ni could not bear it and dashed himself against a tree. Later Zhao Chuan killed Duke Ling; though Zhao Dun did not strike, the Grand Historian Dong Hu wrote: "Zhao Dun killed his lord." A model of historical writing for the ages.',
  },
  'hist-zhao-cui': {
    zh: '晉文公股肱之臣。隨重耳流亡十九年,後輔文公定霸業。',
    en: 'A pillar minister of Duke Wen of Jin. He went with Chong\'er through nineteen years of exile, then helped Duke Wen set the hegemony.',
  },
  'hist-zhao-jianzi': {
    zh: '春秋末晉國正卿。趙氏宗主。鑄刑鼎於范氏,定趙氏之基。其子趙無恤,後與韓、魏滅智伯,瓜分晉地,啟戰國之局。',
    en: 'Chief minister of Jin at the end of the Spring and Autumn; head of the Zhao house. He cast a penal tripod for the Fan clan and set the foundation of Zhao. His son Zhao Wuxu later joined Han and Wei in destroying Zhibo and partitioning Jin — opening the age of the Warring States.',
  },
  'hist-zhao-xiangzi': {
    zh: '名無恤,趙簡子之子。智伯求地,趙無恤不與,智伯與韓魏圍之於晉陽三年。後趙無恤與韓魏密謀,反攻智伯,殺之於汾水,瓜分智地。趙、韓、魏三家分晉,戰國七雄始於此。',
    en: 'Personal name Wuxu, son of Zhao Jianzi. When Zhibo demanded land, Zhao Wuxu refused, and Zhibo with Han and Wei besieged him at Jinyang for three years. He then plotted with Han and Wei in secret, struck back, and killed Zhibo at the Fen River, dividing his lands among them. The three houses of Zhao, Han, and Wei split Jin — and the Seven Powers of the Warring States began from here.',
  },
  'hist-zhibo': {
    zh: '名瑤,春秋末晉國四卿之一。專橫驕橫,索地於韓、魏、趙,趙不與。圍晉陽三年,引汾水灌之。韓魏與趙密謀,反攻智伯,殺之,以其頭為飲器,夷其族。',
    en: 'Personal name Yao, one of the four chief ministers of Jin at the end of the Spring and Autumn. Overbearing and proud, he demanded land from Han, Wei, and Zhao; Zhao refused. He besieged Jinyang for three years, diverting the Fen River to flood it. Han and Wei plotted in secret with Zhao, struck back, killed Zhibo, and made his skull a drinking-cup; his clan was exterminated.',
  },
  'hist-zhuan-zhu': {
    zh: '春秋吳國刺客。公子光謀殺王僚,使專諸藏匕首於魚腹,進炙時刺殺王僚於宴上,專諸亦死。光遂即位,是為吳王闔閭。',
    en: 'An assassin of Wu in the Spring and Autumn. When Prince Guang plotted the death of King Liao, he had Zhuan Zhu hide a dagger in the belly of a fish; serving the roasted dish at the banquet, Zhuan Zhu struck the king down — and was killed himself. Prince Guang took the throne as King Helu of Wu.',
  },
  'hist-yao-li': {
    zh: '春秋吳國刺客。受闔閭命刺殺王僚之子慶忌。先自斷右臂,殺其妻子,以取信於慶忌。後刺殺慶忌於江中。功成,自殺於江,曰:「殺妻子以事君,非仁;為新君而殺故君之子,非義。」',
    en: 'An assassin of Wu in the Spring and Autumn. He took King Helu\'s order to kill Qingji, the son of King Liao. First he cut off his own right arm and killed his wife and children to win Qingji\'s trust. He stabbed Qingji on the river. The work done, he killed himself on the river: "To kill wife and child to serve a lord is not humane; to kill the son of the old lord for the new is not righteous."',
  },
  'hist-qing-ji': {
    zh: '吳王僚之子。武力過人,能伏熊搏虎。父被弒,慶忌奔衛謀復仇。為要離所刺,投江而死,以手按要離於水中三次,讚之為「天下勇士」,終讓其去。',
    en: 'Son of King Liao of Wu. Of great prowess, he could wrestle bears and tigers down. When his father was killed he fled to Wey to plot vengeance. Yao Li stabbed him; mortally wounded, he held Yao Li down in the water three times and yet praised him as a "bold man under heaven" — and at last let him go.',
  },
  'hist-tian-ji': {
    era: { zh: '田忌賽馬', en: '"Tian Ji at the Horse Race"' },
    zh: '齊國名將,孫臏之友。賽馬之事,孫臏教以「以下駟對其上駟,以上駟對其中駟,以中駟對其下駟」,三戰二勝。又用孫臏之策,圍魏救趙,馬陵伏弩,大破龐涓。',
    en: 'A famed general of Qi, friend of Sun Bin. In the horse-race affair, Sun Bin taught him: "Match your lowest horse against his highest, your highest against his middling, your middling against his lowest" — three rounds, two wins. With Sun Bin\'s strategy he besieged Wei to relieve Zhao and laid the Maling ambush, breaking Pang Juan utterly.',
  },
  'hist-sima-rangju': {
    zh: '春秋齊國名將。司馬之祖。將兵立法嚴明,使齊景公愛將莊賈不至期斬之,軍威大振。著《司馬法》傳世,中華兵書之祖。',
    en: 'A famed general of Qi in the Spring and Autumn; ancestor of the Sima line. He set the law of command strictly, beheading the duke\'s favorite Zhuang Jia for arriving late — and the army\'s awe shook. His Methods of the Sima survive, the founding book of Chinese military thought.',
  },
  'hist-yi-yin': {
    era: { zh: '商湯之相', en: 'Chancellor of Tang of Shang' },
    zh: '夏末商初人。本為奴隸,以烹飪通湯,湯任之為相。輔商湯滅夏桀,建立商朝。又輔太甲三年,流之於桐宮,太甲悔過,迎之歸朝。卒,商朝以伊尹為千古第一賢相。',
    en: 'Of late Xia and early Shang. Born a slave, by his cooking he won the attention of Tang, who made him chancellor. He helped Tang overthrow the tyrant Jie and found the Shang dynasty. He then served Tai Jia for three years, exiled him to the Tong palace; when Tai Jia repented, he welcomed him back. At his death Shang held Yi Yin first among the worthy chancellors of all ages.',
  },
  'hist-fei-wuji': {
    zh: '楚平王佞臣。讒言奪太子建之妃,誣伍奢、伍尚父子,逼伍子胥奔吳。後吳師伐楚,費無忌被楚人誅。',
    en: 'A flattering minister of King Ping of Chu. By slander he took the bride of the heir Jian and accused Wu She and Wu Shang father and son falsely, forcing Wu Zixu to flee to Wu. Later when the Wu army marched on Chu, the people of Chu killed Fei Wuji.',
  },
  'hist-yang-youji': {
    era: { zh: '百步穿楊', en: 'A Hundred Paces Through the Willow' },
    zh: '春秋楚國神箭手。能於百步外射穿楊葉,百發百中,「百步穿楊」千古傳為神射之典。',
    en: 'A peerless archer of Chu in the Spring and Autumn. He could shoot a willow leaf at a hundred paces and never miss — "a hundred paces through the willow" is told down the ages as the model of divine shooting.',
  },
  'hist-zheng-huangong': {
    zh: '鄭桓公友。西周宣王之弟。封於鄭,後遷新鄭,鄭國之祖。',
    en: 'Duke Huan of Zheng, named You, younger brother of King Xuan of Western Zhou. Enfeoffed at Zheng and later moved to Xinzheng; ancestor of the Zheng state.',
  },
  'hist-lu-ban': {
    era: { zh: '工聖', en: 'Sage of Craftsmen' },
    zh: '名公輸般,魯國人。中華木工、機械之祖。發明雲梯、勾強、鋸子、墨斗、刨子。為楚造雲梯欲攻宋,墨子止之。後世奉為「工聖」、「祖師爺」,千古匠人之祖。',
    en: 'Personal name Gongshu Ban, of Lu. Founder of Chinese woodworking and mechanical craft. He invented the cloud-ladder, the grappling-spear, the saw, the carpenter\'s ink-line, and the plane. He made cloud-ladders for Chu to attack Song; Mozi stopped him. Later ages honored him as the "Sage of Craftsmen" and the "Founding Master," the ancestor of every artisan of the ages.',
  },
  'hist-liezi': {
    zh: '名禦寇,鄭國人。道家三大宗師之一,與老子、莊子並稱。著《列子》八篇。「愚公移山」、「兩小兒辯日」、「歧路亡羊」、「杞人憂天」皆出此書,千古傳誦。',
    en: 'Personal name Yukou, of Zheng. One of the three founding masters of Daoism, with Laozi and Zhuangzi. The Liezi in eight pieces is his. "Yu Gong moves the mountain," "two boys argue about the sun," "the lost sheep at the fork," and "the man of Qi who feared the sky would fall" all come from this book and are read forever.',
  },
  'hist-zhao-chuan': {
    zh: '春秋晉國刺客。趙盾族弟。受趙盾意,在桃園刺殺晉靈公,太史董狐書「趙盾弒其君」。',
    en: 'An assassin of Jin in the Spring and Autumn, cousin of Zhao Dun. At Zhao Dun\'s nod he killed Duke Ling of Jin in the peach garden; the Grand Historian Dong Hu wrote: "Zhao Dun killed his lord."',
  },
  'hist-luan-shu': {
    zh: '春秋晉國正卿。鄢陵之戰,晉軍大破楚,欒書與郤錡、士燮共為主將。後與荀偃廢晉厲公,立悼公。',
    en: 'Chief minister of Jin in the Spring and Autumn. At the battle of Yanling, when the Jin broke the Chu, Luan Shu was a chief commander with Xi Qi and Shi Xie. With Xun Yan he later deposed Duke Li of Jin and set up Duke Dao.',
  },
  'hist-han-jue': {
    zh: '春秋晉國正卿。趙氏孤兒之事,韓厥保全趙氏血脈,使程嬰、公孫杵臼之事得遂,趙武得復興趙氏。',
    en: 'Chief minister of Jin in the Spring and Autumn. In the affair of the Zhao orphan he kept the Zhao line alive, so that the work of Cheng Ying and Gongsun Chujiu could come to fruit and Zhao Wu could raise his clan again.',
  },
  'hist-hu-yan': {
    zh: '字子犯,晉文公之舅。隨重耳流亡十九年,輔晉文公成霸業。城濮之戰獻策退避三舍。',
    en: 'Style Zifan, uncle of Duke Wen of Jin. He went with Chong\'er through nineteen years of exile and helped him to the hegemony. At Chengpu he gave the counsel of retreating three days\' march.',
  },
  'hist-xian-zhen': {
    zh: '春秋晉國名將。城濮之戰晉軍中軍主將,大破楚軍。後與秦軍戰於崤,大破秦師。',
    en: 'A famed general of Jin in the Spring and Autumn. He was central-army commander at Chengpu and broke the Chu host, and later broke the Qin army at Yao.',
  },
  'hist-xian-gao': {
    zh: '鄭國商人。秦師欲襲鄭,弦高於滑遇之,假鄭君命以十二牛犒師,秦師以為鄭有備,遂退,鄭得免於難。',
    en: 'A merchant of Zheng. When the Qin army meant to take Zheng by surprise, Xian Gao met them at Hua and, faking the order of his lord, fêted them with twelve oxen. The Qin thought Zheng was forewarned and turned back, and Zheng escaped the disaster.',
  },
  'hist-zhu-zhiwu': {
    era: { zh: '燭之武退秦師', en: 'Zhu Zhiwu Turned Back the Qin Army' },
    zh: '鄭國老臣。秦晉合圍鄭,燭之武夜縋出城,說秦穆公:「亡鄭以陪鄰,君之薄也。」 秦穆公感之,留兵戍鄭而去,鄭得免於難。',
    en: 'An old minister of Zheng. When Qin and Jin together besieged Zheng, Zhu Zhiwu was lowered from the wall at night and persuaded Duke Mu of Qin: "To destroy Zheng is to make your neighbor strong; it is to your loss." Duke Mu was moved, left troops to garrison Zheng, and withdrew — and Zheng escaped the disaster.',
  },
  'hist-yan-jiangjun': {
    zh: '春秋楚將顏率之另寫。',
    en: 'Alternate writing for the Chu general Yan Shuai.',
  },
  'hist-qi-jinggong': {
    zh: '齊景公,在位五十八年,景公後期任用晏嬰,國治稍安。然好奢侈,養馬萬匹,孔子過齊歎之。',
    en: 'Duke Jing of Qi. Fifty-eight years he reigned; in his later years he raised Yan Ying and the state had peace. Yet lavish — he kept ten thousand horses, and Confucius sighed as he passed through Qi.',
  },
  'hist-yi-he': {
    zh: '秦國神醫。為晉平公診病,曰「不可為也」,並述六氣致病之理,千古中醫之祖。',
    en: 'A divine physician of Qin. Called to treat Duke Ping of Jin, he said: "It cannot be cured," and set out the doctrine of the Six Qi causing disease — an ancestor of Chinese medicine for the ages.',
  },
  'hist-shensheng': {
    zh: '晉獻公太子。母齊姜。獻公寵驪姬,驪姬譖之,申生不肯辨,自縊於曲沃。後諡共太子。',
    en: 'Crown prince of Duke Xian of Jin, son of Lady Qi Jiang. Duke Xian doted on Lady Li, who slandered him. Shen Sheng would not defend himself and hanged himself at Quwo. He was posthumously named the Reverent Crown Prince.',
  },
  'hist-li-ji': {
    zh: '驪姬,晉獻公寵妃。譖太子申生,逼申生自縊,又逼重耳、夷吾出奔,晉國大亂二十年。後被殺。',
    en: 'Lady Li, favorite of Duke Xian of Jin. She slandered the heir Shen Sheng to suicide and drove Chong\'er and Yiwu into exile, throwing Jin into chaos for twenty years. She was at last killed.',
  },
  'hist-wen-jiang': {
    zh: '魯桓公夫人,齊襄公之妹。與兄通姦,使彭生殺魯桓公於齊,千古宮闈醜聞。',
    en: 'Wife of Duke Huan of Lu, sister of Duke Xiang of Qi. She had a liaison with her brother and through Peng Sheng killed Duke Huan of Lu in Qi — a palace scandal of the ages.',
  },
  'hist-xia-ji': {
    zh: '陳國夏徵舒之母。容貌絕世,屢嫁屢寡,凡九夫。陳靈公與孔寧、儀行父皆通之,夏徵舒怒殺靈公。後楚莊王滅夏氏,賜夏姬於連尹襄老,襄老死於邲之戰,夏姬又從巫臣奔晉。',
    en: 'Mother of Xia Zhengshu of Chen. Of peerless beauty, she was widowed many times — nine husbands. Duke Ling of Chen with Kong Ning and Yi Xingfu had liaisons with her, and Xia Zhengshu in anger killed Duke Ling. King Zhuang of Chu then wiped out the Xia clan and gave her to Lian Yin Xianglao; when Xianglao died at the battle of Bi, she went with Wu Chen to Jin.',
  },
  'hist-shengong-wuchen': {
    zh: '楚國申公巫臣。為夏姬背楚奔晉。後楚滅其族,巫臣怒,獻計於晉,使吳國學戰車之術,以擾楚。吳楚之爭遂起。',
    en: 'Lord Wu Chen of Shen of Chu. For Lady Xia he left Chu and fled to Jin. When Chu wiped out his clan, in his rage he counseled Jin to teach Wu the use of chariot warfare to harass Chu — and the war between Wu and Chu was thus begun.',
  },
  'hist-qing-feng': {
    zh: '齊國大夫。崔杼弒齊莊公,慶封與之共執國政。後反殺崔氏,專齊政,終為四族所攻,奔吳,後楚靈王使吳獻之,被楚軍殺之。',
    en: 'A grandee of Qi. When Cui Zhu killed Duke Zhuang of Qi, Qing Feng held power with him. He later turned and wiped out the Cui, holding Qi alone — and was attacked by the four clans. He fled to Wu; when King Ling of Chu later asked Wu to give him up, the Chu army killed him.',
  },
  'hist-shu-ya': {
    zh: '魯國叔孫氏,叔牙之另寫。',
    en: 'Alternate writing for Shu Ya of the Shu Sun clan of Lu.',
  },
  'hist-cai-aihou': {
    zh: '蔡哀侯,蔡國國君。其妹嫁息侯。蔡哀侯戲息侯之夫人息媯,息侯怒,引楚文王伐蔡,蔡哀侯被擒。',
    en: 'Marquis Ai of Cai. His sister married the Marquis of Xi. Cai Ai mocked the Marquis of Xi\'s wife Lady Xi Gui; the Marquis of Xi in fury brought King Wen of Chu against Cai, and Cai Ai was taken.',
  },
  'hist-cai-huangong': {
    zh: '蔡桓公,蔡國國君。扁鵲三見之而不信,終病入膏肓而死,「諱疾忌醫」千古傳為俗語。',
    en: 'Duke Huan of Cai. Bian Que saw him three times and he would not believe; at last the sickness reached his marrow and he died — "shunning the doctor and hiding the disease" became a saying for the ages.',
  },
  'hist-guangxu': {
    zh: '名載湉,同治帝堂弟。同治死無嗣,慈禧立之為帝,時年四歲。長大欲變法圖強,行戊戌變法,被慈禧囚於瀛臺十年。光緒三十四年十月二十一日卒,二十二日慈禧亦卒,世傳慈禧鴆光緒。',
    en: 'Personal name Zaitian, cousin of Tongzhi. When Tongzhi died without heir, Cixi set him on the throne at four. As an adult he wished to reform the state and led the Hundred Days\' Reform; Cixi imprisoned him at Yingtai for ten years. On the twenty-first day of the tenth month of 1908 he died; on the twenty-second Cixi died too — and the world says Cixi poisoned Guangxu.',
  },
  // ─── 歷代名將 新增第四批 (Historical biographies — batch 4: Warring States) ───
  'hist-mengchang-jun': {
    era: { zh: '雞鳴狗盜', en: '"Cock-Crowing, Dog-Thievery"' },
    zh: '名田文,齊國貴族,薛公田嬰之子。戰國四公子之首。食客三千,以雞鳴、狗盜之徒脫秦昭王之獄,故有「雞鳴狗盜之雄」之語。後為齊湣王所忌,奔魏,封於薛。',
    en: 'Personal name Tian Wen, of the Qi nobility, son of Tian Ying Duke of Xue. First of the Four Lords of the Warring States. He kept three thousand retainers; with men who could crow like roosters and steal like dogs he slipped from the prison of King Zhao of Qin — hence "the lord of cock-crowing and dog-thievery." King Min of Qi grew suspicious; he fled to Wei and was enfeoffed at Xue.',
  },
  'hist-pingyuan-jun': {
    era: { zh: '毛遂自薦', en: '"Mao Sui Recommended Himself"' },
    zh: '名趙勝,趙武靈王之子,惠文王之弟。戰國四公子之一,食客數千。長平之後秦圍邯鄲,趙勝奉命求救於楚,毛遂自薦從行,於楚廷按劍說楚王,定縱約。後楚、魏救趙,大破秦軍於邯鄲城下。',
    en: 'Personal name Zhao Sheng, son of King Wuling of Zhao and brother of King Huiwen. One of the Four Lords of the Warring States, with thousands of retainers. After Changping when Qin besieged Handan, Zhao Sheng was sent to ask Chu for help; Mao Sui recommended himself to follow. At the Chu court, hand on his sword, Mao Sui persuaded the king of Chu and sealed the league. Chu and Wei came to Zhao\'s aid and broke the Qin army at the foot of Handan\'s walls.',
  },
  'hist-xinling-jun': {
    era: { zh: '竊符救趙', en: 'Stole the Token to Save Zhao' },
    zh: '名魏無忌,魏昭王少子,安釐王之異母弟。戰國四公子之一,食客三千。秦圍趙邯鄲,魏王懼秦不發兵,信陵君納侯嬴之計,使如姬竊兵符,朱亥以鐵錐椎殺魏將晉鄙,奪兵權救趙,大破秦軍。',
    en: 'Personal name Wei Wuji, youngest son of King Zhao of Wei and half-brother of King Anli. One of the Four Lords of the Warring States, with three thousand retainers. When Qin besieged Handan and the King of Wei in fear would not send troops, Xinling-jun took Hou Ying\'s counsel: Lady Ru stole the army-token, Zhu Hai with an iron mace killed the Wei general Jin Bi, and he seized command, marched to relieve Zhao, and broke the Qin army.',
  },
  'hist-chunshen-jun': {
    zh: '名黃歇,楚國貴族。戰國四公子之一,食客三千。事楚考烈王,任令尹二十餘年。後立李園之妹所生者為太子,李園恐事洩,於棘門埋伏殺之,夷其族。',
    en: 'Personal name Huang Xie, of the Chu nobility. One of the Four Lords of the Warring States, with three thousand retainers. He served King Kaolie of Chu as chancellor for over twenty years. He later set up as crown prince the son borne by Li Yuan\'s sister; Li Yuan, fearing the matter would leak, laid an ambush at the Ji gate and killed him, and wiped out his clan.',
  },
  'hist-mao-sui': {
    era: { zh: '毛遂自薦', en: '"Mao Sui Recommended Himself"' },
    zh: '平原君食客。秦圍邯鄲,平原君欲合縱於楚,從食客中選二十人,缺一,毛遂自薦曰:「臣乃今請處囊中耳。」 平原君攜之入楚。楚王猶豫,毛遂按劍歷階而上,曰:「合縱之利害,兩言而決;今日從之,在汝!」 楚王懼而從之,合縱遂定。',
    en: 'A retainer of Pingyuan-jun. When Qin besieged Handan and Pingyuan-jun wished to bind Chu in the league, he chose twenty men from his retainers — one short, Mao Sui recommended himself: "I beg today to be placed in the bag." Pingyuan-jun took him to Chu. The king of Chu hesitated; Mao Sui, hand on sword, mounted the steps: "The good and the harm of the league — two words decide it. The matter today is yours to choose!" The king in fear agreed, and the league was set.',
  },
  'hist-hou-ying': {
    zh: '魏國隱士。年七十為大梁夷門監者。信陵君折節下交,以上賓之禮事之。秦圍邯鄲,侯嬴獻竊符之計,使信陵君奪晉鄙之兵以救趙。信陵君既行,侯嬴自刎以送之。',
    en: 'A recluse of Wei. At seventy he kept the Yi gate of Daliang. Xinling-jun lowered himself to befriend him and treated him with the rite of an honored guest. When Qin besieged Handan, Hou Ying gave the plan of stealing the army-token, so that Xinling-jun could seize Jin Bi\'s troops and save Zhao. When Xinling-jun had marched, Hou Ying cut his own throat to see him off.',
  },
  'hist-zhu-hai': {
    zh: '大梁屠者。侯嬴薦之於信陵君。竊符救趙之役,朱亥袖四十斤鐵錐,擊殺晉鄙,奪兵權。後從信陵君破秦師。',
    en: 'A butcher of Daliang. Hou Ying recommended him to Xinling-jun. In the stealing of the token and saving of Zhao, Zhu Hai with a forty-jin iron mace in his sleeve killed Jin Bi and seized command. He then marched with Xinling-jun to break the Qin army.',
  },
  'hist-zhao-wuling': {
    era: { zh: '胡服騎射', en: '"Hu Dress, Horse and Bow"' },
    zh: '趙武靈王,名雍。在位二十七年,行「胡服騎射」之變,棄寬衣為短衣,棄戰車為騎兵,趙由是強。北滅中山,西破林胡、樓煩,開地千里。後傳位於子惠文王,自稱主父。其後沙丘宮變,被子餓死於沙丘行宮。',
    en: 'King Wuling of Zhao, personal name Yong. Twenty-seven years he reigned. He carried through the reform of "Hu dress, horse and bow" — putting off the wide robe for the short, the chariot for the cavalry — and Zhao grew strong. He swallowed Zhongshan in the north, broke the Linhu and Loufan in the west, and opened a thousand li of new land. He passed the throne to his son King Huiwen and called himself the "Father-Lord." In the Shaqiu palace coup his son starved him to death in the Shaqiu travel-palace.',
  },
  'hist-zhao-huiwen': {
    zh: '趙惠文王,武靈王之子。任用藺相如、廉頗、趙奢,趙國中興。澠池之會折秦昭王之威。',
    en: 'King Huiwen of Zhao, son of King Wuling. He raised Lin Xiangru, Lian Po, and Zhao She, and Zhao rose again. At the meeting of Mianchi he broke the awe of King Zhao of Qin.',
  },
  'hist-zhao-xiaocheng': {
    zh: '趙孝成王,惠文王之子。長平之戰,易廉頗為趙括,中秦反間計,趙軍四十萬被坑於長平,趙國自此衰。',
    en: 'King Xiaocheng of Zhao, son of King Huiwen. At Changping he swapped Lian Po for Zhao Kuo, falling for Qin\'s counter-trick; four hundred thousand of Zhao\'s host were buried alive at Changping, and Zhao began its decline.',
  },
  'hist-zhao-kuo': {
    era: { zh: '紙上談兵', en: '"Strategy on Paper"' },
    zh: '趙奢之子。少時習兵書,辯論無人能及,然「紙上談兵」。長平之戰,趙王易廉頗為趙括,趙括變更廉頗之軍法,出戰,被白起圍於長平,絕糧四十六日,趙括親率精兵衝殺,中流矢而死,趙軍四十萬皆降而被坑。',
    en: 'Son of Zhao She. From youth he studied military books; in debate none could match him, but only "strategy on paper." At Changping the King of Zhao swapped Lian Po for him; Zhao Kuo overturned Lian Po\'s laws, marched out, was surrounded by Bai Qi at Changping. Cut off from grain for forty-six days, Zhao Kuo himself led the elite to charge and was struck by a stray arrow and killed; four hundred thousand Zhao soldiers surrendered and were buried alive.',
  },
  'hist-zhao-wangqian': {
    zh: '趙王遷,趙幽繆王。在位八年,信讒言殺李牧,秦將王翦遂破趙都邯鄲,趙王遷被擄,趙亡。',
    en: 'King Qian of Zhao, posthumous name King Youmiao. Eight years he reigned; on slander he killed Li Mu, and Wang Jian of Qin broke the Zhao capital Handan, took King Qian, and ended Zhao.',
  },
  'hist-qin-xiaogong': {
    era: { zh: '秦孝公', en: 'Duke Xiao of Qin' },
    zh: '秦孝公,名渠梁。在位二十四年,下《求賢令》,用商鞅變法,廢井田,開阡陌,獎軍功,立郡縣。秦由是強,東出之基實基於此。',
    en: 'Duke Xiao of Qin, personal name Quliang. Twenty-four years he reigned. He issued the Edict Calling for Worthies, raised Shang Yang to lead the reforms — abolished the well-field, opened the paths, rewarded military merit, set up commanderies and counties. Qin grew strong from him; the foundation of the march eastward was here.',
  },
  'hist-qin-huiwen': {
    zh: '秦惠文王,孝公之子。即位殺商鞅以悅貴族,然新法不廢。任用張儀,行連橫之策,大破六國合縱。又南滅蜀,得天府之國。',
    en: 'King Huiwen of Qin, son of Duke Xiao. On taking the throne he killed Shang Yang to please the nobles — but the new laws he did not abolish. He raised Zhang Yi to lead the Horizontal League, breaking the Six States\' Vertical Alliance. He also took Shu in the south — and Qin gained the "Land of Abundance."',
  },
  'hist-qin-wuwang': {
    zh: '秦武王,惠文王之子。雄武好力,問鼎周室,於洛陽舉雍州鼎,絕脛而死,年二十三。',
    en: 'King Wu of Qin, son of King Huiwen. Bold and fond of strength, he marched on the Zhou royal house and asked the weight of the cauldrons. At Luoyang he lifted the Yongzhou tripod, broke his shin-bone, and died at twenty-three.',
  },
  'hist-qin-zhaoxiang': {
    era: { zh: '秦昭襄王', en: 'King Zhaoxiang of Qin' },
    zh: '秦昭襄王,在位五十六年,中國史上在位最久之帝王之一。任白起,殺六國精兵百餘萬。長平之戰坑趙卒四十萬,六國畏秦。範雎為相,行遠交近攻之策。為秦掃六合鋪平道路。',
    en: 'King Zhaoxiang of Qin. Fifty-six years he reigned — one of the longest reigns in Chinese history. He raised Bai Qi, who killed over a million of the picked troops of the six states. At Changping he buried alive four hundred thousand of Zhao\'s soldiers, and the six states feared Qin. With Fan Ju as chancellor he followed "make friends with the distant, strike the near," paving the way for the conquest.',
  },
  'hist-qin-zhuangxiang': {
    zh: '秦莊襄王,名子楚,異人,孝文王之子。少質於趙,為呂不韋所識,助之歸秦。即位三年崩,子嬴政繼立,即秦始皇。',
    en: 'King Zhuangxiang of Qin, personal name Zichu (formerly Yiren), son of King Xiaowen. In youth held hostage at Zhao, he was discovered by Lü Buwei, who helped him return to Qin. He reigned three years and died; his son Ying Zheng took the throne — the First Emperor.',
  },
  'hist-lu-buwei': {
    era: { zh: '奇貨可居', en: '"A Rare Treasure Worth Hoarding"' },
    zh: '陽翟大商人。見子楚質於趙,曰:「此奇貨可居。」 散家財助子楚歸秦即位,以己妾趙姬獻之,生嬴政,即秦始皇。莊襄王立,呂不韋為相,封文信侯,食邑十萬戶。始皇親政,呂不韋被免相,飲鴆而死。著《呂氏春秋》,號「一字千金」。',
    en: 'A great merchant of Yangzhai. Seeing Zichu held hostage at Zhao, he said: "This is a rare treasure worth hoarding." He poured out his fortune to help Zichu return to Qin and take the throne, and gave him his own concubine Lady Zhao, who bore Ying Zheng — the First Emperor. When King Zhuangxiang took the throne, Lü Buwei became chancellor and was made Marquis of Wenxin with a fief of a hundred thousand households. When the First Emperor took power he dismissed Lü Buwei, who drank a draught of death. He wrote the Annals of Master Lü — "a thousand pieces of gold for a word."',
  },
  'hist-zou-yan': {
    era: { zh: '五行終始', en: 'Cycles of the Five Elements' },
    zh: '齊國人。戰國陰陽家代表,五行學派之祖。著《大九州》,提「赤縣神州」之說,以為中國乃大九州之一。又創「五德終始說」,以五行相生相剋解王朝更迭。',
    en: 'Of Qi. Foremost of the Warring States Yin-Yang thinkers, founder of the Five Elements school. He wrote the Great Nine Continents, holding that China was but one of nine; he also created the theory of the Five Powers cycling, explaining the change of dynasties by the rise and fall of the five elements.',
  },
  'hist-zou-ji': {
    era: { zh: '鄒忌諷齊王納諫', en: '"Zou Ji Urged the King of Qi to Heed Counsel"' },
    zh: '齊威王相。以己美貌與徐公比,旦日問妻、妾、客,皆云己美。後見徐公,自愧不如。乃悟「妻之美我者私我也,妾之美我者畏我也,客之美我者有求於我也」,以此諷齊威王納諫。齊國大治。',
    en: 'Chancellor under King Wei of Qi. Comparing his looks to Lord Xu, he asked his wife, concubine, and guest in the morning; all said he was the more handsome. Then he saw Lord Xu and knew himself the lesser. He understood: "My wife praises me because she favors me; my concubine because she fears me; my guest because he seeks something from me." With this he urged King Wei of Qi to heed counsel — and Qi was well ruled.',
  },
  'hist-qi-weiwang': {
    zh: '齊威王,名因齊。任用鄒忌、田忌、孫臏,齊國大治。桂陵、馬陵兩戰大破魏軍,齊由是強。在位三十六年。',
    en: 'King Wei of Qi, personal name Yinqi. He raised Zou Ji, Tian Ji, and Sun Bin — and Qi was well ruled. At Guiling and Maling he broke the Wei host, and Qi grew strong. Thirty-six years he reigned.',
  },
  'hist-qi-xuanwang': {
    zh: '齊宣王,威王之子。與孟子論政,「五十步笑百步」之語出此。又有「南郭吹竽」之事,千古為俗語。',
    en: 'King Xuan of Qi, son of King Wei. He discoursed on government with Mencius — "fifty paces laughing at a hundred" comes from this. The tale of "Nanguo blowing the yu" — pretending to play in a band — also comes from him, and has become a saying for the ages.',
  },
  'hist-wei-huiwang': {
    era: { zh: '梁惠王', en: 'King Hui of Liang' },
    zh: '魏惠王,亦稱梁惠王。在位五十二年。與孟子論「何以利吾國」,孟子答:「王何必曰利?亦有仁義而已矣!」 又遷都大梁,故稱梁惠王。桂陵、馬陵兩敗於齊,魏由是衰。',
    en: 'King Hui of Wei, also known as King Hui of Liang. Fifty-two years he reigned. To Mencius he asked: "How shall I profit my state?" Mencius answered: "Why must Your Majesty speak of profit? There is humaneness and right, and that is all." He moved his capital to Daliang — hence King Hui of Liang. Broken twice by Qi at Guiling and Maling, Wei began its decline.',
  },
  'hist-yan-zhaowang': {
    era: { zh: '築黃金台', en: 'Built the Golden Terrace' },
    zh: '燕昭王,名職。即位後欲報齊湣王破燕之仇,築黃金台招賢,以郭隗為師。樂毅、鄒衍、劇辛皆來歸。任樂毅為大將,合五國之兵伐齊,連下七十餘城,齊幾亡。在位三十三年。',
    en: 'King Zhao of Yan, personal name Zhi. Taking the throne, he wished to avenge King Min of Qi\'s breaking of Yan. He built the Golden Terrace to call worthies, making Guo Wei his teacher; Yue Yi, Zou Yan, and Ju Xin all came. With Yue Yi as commander he gathered the troops of five states against Qi and took over seventy cities in a stroke — Qi was nearly ended. Thirty-three years he reigned.',
  },
  'hist-yan-huiwang': {
    zh: '燕惠王,昭王之子。中田單反間計,以騎劫代樂毅。即墨之戰,田單火牛陣大破騎劫,盡復齊七十餘城。樂毅奔趙,惠王悔之,以《報燕王書》傳千古。',
    en: 'King Hui of Yan, son of King Zhao. He fell for Tian Dan\'s counter-trick and replaced Yue Yi with Qi Jie. At Jimo, Tian Dan with the Fire-Ox stratagem broke Qi Jie utterly and recovered all seventy cities of Qi. Yue Yi fled to Zhao; King Hui repented, and the "Letter in Response to the King of Yan" has rung down the ages.',
  },
  'hist-taizi-dan': {
    era: { zh: '荊軻刺秦', en: '"Jing Ke\'s Attempt on Qin"' },
    zh: '燕王喜之子。質於秦,逃歸。秦兵壓境,太子丹遣荊軻往秦,以督亢地圖獻秦王,圖窮匕首見,刺秦王不中。秦怒,大舉伐燕,燕王喜獻太子丹之首於秦以求和,秦不允,終滅燕。',
    en: 'Son of King Xi of Yan. Held hostage in Qin, he escaped. With Qin\'s armies on his border, Crown Prince Dan sent Jing Ke to Qin with the Dukang map; when the scroll ran out the dagger showed, and Jing Ke struck at the King of Qin and missed. Qin in fury marched on Yan; King Xi offered the head of Crown Prince Dan to Qin for peace; Qin refused and at last swallowed Yan.',
  },
  'hist-gao-jianli': {
    zh: '燕國築琴師。荊軻友。荊軻刺秦不成被殺,高漸離為復仇,變姓名為宋子人家傭。後以善擊筑名,秦始皇召之入宮,熏其目使盲,以為樂工。漸離鉛灌於筑中,擊秦始皇不中,被誅。',
    en: 'A zhu-lute master of Yan, friend of Jing Ke. When Jing Ke failed and was killed, Gao Jianli, to avenge him, changed his name and became servant in the household at Songzi. His fame on the zhu spread, and the First Emperor summoned him to the palace, blinding his eyes to make him court musician. Gao Jianli loaded the zhu with lead and struck at the First Emperor and missed — and was killed.',
  },
  'hist-nie-zheng': {
    era: { zh: '士為知己者死', en: '"A Man Dies for One Who Knows Him"' },
    zh: '韓國刺客。為韓人嚴仲子所聘,刺殺韓相俠累於相府之上。聶政自知必死,自皮其面、抉其目、屠出腸,以恐人識其面,連累其姊。後姊聶榮聞之,認屍而死於屍上。',
    en: 'An assassin of Han. Hired by Yan Zhongzi of Han, he stabbed the Han chancellor Xia Lei in his own hall. Knowing death was certain, Nie Zheng flayed his own face, gouged out his eyes, and tore out his bowels, lest any recognize him and bring trouble on his sister. His sister Nie Rong heard, came and identified the body, and died upon it.',
  },
  'hist-feng-xuan': {
    zh: '齊國孟嘗君食客。為孟嘗君收債於薛,將債契盡燒之,曰:「市義以歸。」 後孟嘗君失勢,薛人迎之,孟嘗君方知馮諼之賢。馮諼又為孟嘗君「狡兔三窟」之計,使孟嘗君穩居相位。',
    en: 'A retainer of Mengchang-jun of Qi. Sent to collect debts at Xue, he burned all the contracts and said: "I have bought back righteousness for you." When Mengchang-jun fell from power and the people of Xue welcomed him home, he saw at last Feng Xuan\'s worth. Feng Xuan also made for him the "three burrows of the wily hare," keeping him steady in the chancellorship.',
  },
  'hist-zhuang-xin': {
    era: { zh: '亡羊補牢', en: '"Mending the Pen After the Sheep Is Lost"' },
    zh: '楚襄王臣。屢諫襄王勿沉湎酒色,不聽。秦破楚都郢,襄王悔之,使人求莊辛於趙。莊辛曰:「亡羊而補牢,未為遲也!」 楚復興。',
    en: 'A minister of King Xiang of Chu. He often warned the king against drowning in wine and women; the king would not hear. When Qin broke Ying, the Chu capital, the king repented and sent for Zhuang Xin in Zhao. Zhuang Xin said: "To mend the pen after the sheep is lost — it is not yet too late!" And Chu rose again.',
  },
  'hist-chu-huaiwang': {
    zh: '楚懷王,名熊槐。屢被張儀所騙。先信張儀「商於六百里」之諾,絕齊楚之盟,後僅得六里。後秦昭王邀其武關之會,遂被扣留秦國,客死於秦。屈原《離騷》為此而作。',
    en: 'King Huai of Chu, personal name Xiong Huai. Zhang Yi cheated him again and again. First trusting Zhang Yi\'s promise of "six hundred li at Shangyu," he broke the Qi-Chu alliance — and got only six li. King Zhao of Qin then summoned him to a meeting at Wuguan and held him; he died in exile in Qin. Qu Yuan\'s Li Sao was written for this.',
  },
  'hist-shen-buhai': {
    zh: '鄭國人,法家「術」派之祖。事韓昭侯,行變法,十五年韓國治。著《申子》二篇,主以「術」治臣,即君主以權術駕馭群臣,為韓非「法、術、勢」三派之一源。',
    en: 'Of Zheng. Founder of the "shu" (method) school of Legalism. Under Marquis Zhao of Han he led the reforms; in fifteen years Han was well ruled. The Shenzi in two pieces is his — he held that "shu" rules ministers, the lord using the arts of power to drive his servants. He was one of the three founts of Han Fei\'s "law, method, position."',
  },
  'hist-shendao': {
    zh: '趙國人,法家「勢」派之祖。著《慎子》。主以「勢」治國,即君主以權位威勢駕馭群臣,韓非「法、術、勢」三派之一源。',
    en: 'Of Zhao. Founder of the "shi" (position) school of Legalism. The Shenzi is his. He held that "shi" rules the state, the lord using the awe of his throne to drive his servants — one of the three founts of Han Fei\'s "law, method, position."',
  },
  'hist-gongsun-long': {
    era: { zh: '白馬非馬', en: '"A White Horse Is Not a Horse"' },
    zh: '趙國人,戰國名家代表。著《公孫龍子》。提出「白馬非馬」、「離堅白」之辯,以為名實之辯。為中華邏輯學之先聲。',
    en: 'Of Zhao. The great representative of the School of Names in the Warring States. The Gongsun Longzi is his. He propounded "a white horse is not a horse" and "separating the hard and the white" — the debate of names and substance, an early voice of Chinese logic.',
  },
  'hist-yang-zhu': {
    era: { zh: '楊朱', en: 'Yang Zhu' },
    zh: '魏國人。戰國思想家。主「為我」、「貴生」、「重己」,曰:「拔一毛而利天下,不為也。」 與墨家「兼愛」相對,孟子斥之為「無君」。',
    en: 'Of Wei. A Warring States thinker. He held "for the self," "valuing life," "honoring oneself" — and said: "To pluck out a single hair to benefit the realm, I would not do it." Against the Mohist "universal love," Mencius condemned him as denying the lord.',
  },
  'hist-zisi': {
    zh: '名孔伋,孔子之孫。著《中庸》,為儒家「思孟學派」之祖。受業於曾子,傳孟子,儒家道統由是而傳。',
    en: 'Personal name Kong Ji, grandson of Confucius. He wrote the Doctrine of the Mean and founded the "Si-Meng school" of Confucianism. He studied under Master Zeng and passed the line to Mencius — and so the orthodox Confucian transmission was kept.',
  },
  'hist-zixia': {
    zh: '名卜商,字子夏,孔子弟子。長於文學。孔子歿後,在西河講學,為魏文侯之師。',
    en: 'Personal name Bu Shang, style Zixia, disciple of Confucius. Master of letters. After the Master\'s death he taught at the Western River and was teacher to Marquis Wen of Wei.',
  },
  'hist-tian-dan': {
    era: { zh: '火牛陣', en: 'The Fire-Ox Stratagem' },
    zh: '齊國臨淄人。樂毅破齊七十餘城,獨即墨、莒不下。田單守即墨,用反間使燕易將,又設「火牛陣」夜襲燕軍,千牛尾束燃葦突陣,齊軍隨之大破燕。盡復七十餘城,迎齊襄王還國。',
    en: 'Of Linzi in Qi. When Yue Yi had taken over seventy cities of Qi, only Jimo and Ju still held; Tian Dan defended Jimo. He sowed the counter-trick that made Yan swap commanders, then set the Fire-Ox stratagem — a thousand oxen with burning reeds tied to their tails charged the Yan camp by night, and the Qi army broke them all. He recovered every one of the seventy cities and brought King Xiang back to his throne.',
  },
  'hist-lin-xiangru': {
    era: { zh: '完璧歸趙', en: 'Returned the Jade Whole to Zhao' },
    zh: '趙國上卿。秦王索和氏璧,藺相如奉璧入秦,終以智謀完璧歸趙。澠池之會,折秦昭王之威,迫之擊缶。與廉頗將相和,共扶趙國。「負荊請罪」「將相和」千古傳為美談。',
    en: 'Senior Counselor of Zhao. When the King of Qin sought the He Jade, Lin Xiangru carried it to Qin and by sheer wit brought it back whole to Zhao. At the meeting of Mianchi he broke the awe of King Zhao of Qin, forcing him to strike a clay pot. With Lian Po he made up the General-and-Chancellor pair that upheld Zhao. "Bearing the rod for pardon" and "the harmony of general and chancellor" are tales of all ages.',
  },
  'hist-meng-ao': {
    zh: '齊國蒙山人,蒙恬、蒙毅之祖。仕秦昭王、孝文王、莊襄王、始皇四朝,屢破六國,為秦掃六合之先驅。',
    en: 'Of Mengshan in Qi, ancestor of Meng Tian and Meng Yi. He served four reigns of Qin — Zhaoxiang, Xiaowen, Zhuangxiang, the First Emperor — broke the six states many times, the forerunner of Qin\'s conquest.',
  },
  'hist-meng-wei': {
    zh: '蒙驁之子,蒙恬、蒙毅之父。事秦,征伐有功。',
    en: 'Son of Meng Ao, father of Meng Tian and Meng Yi. He served Qin and won credit in war.',
  },
  'hist-sima-cuo': {
    zh: '秦惠文王、昭襄王將。獻策伐蜀,自率兵入蜀,平之,秦得天府之國。後又破楚黔中。',
    en: 'A general under Kings Huiwen and Zhaoxiang of Qin. He counseled the conquest of Shu and led the army in himself; Qin gained the "Land of Abundance." He later broke the Chu Qianzhong.',
  },
  'hist-gan-mao': {
    zh: '秦左丞相。事秦惠文王、武王。武王欲通三川,甘茂率兵下宜陽,五月不克,後力諫得續,終下之,為秦東出之門戶。',
    en: 'Left Chancellor of Qin. He served Kings Huiwen and Wu. When King Wu wished to open the Sanchuan, Gan Mao led the troops down to Yiyang; five months without success — by his stiff remonstrance he was allowed to go on, and at last took it, opening the eastern gate for Qin.',
  },
  'hist-gan-luo': {
    era: { zh: '十二為上卿', en: 'Chancellor at Twelve' },
    zh: '甘茂之孫。十二歲入秦,為呂不韋家僮。獻策使趙國割五城予秦,以解秦趙之爭。秦始皇拜為上卿,千古第一神童。',
    en: 'Grandson of Gan Mao. At twelve he came to Qin as a boy in Lü Buwei\'s household. He gave the counsel that made Zhao cede five cities to Qin, easing the conflict; the First Emperor made him Senior Counselor — the first divine child of the ages.',
  },
  'hist-fan-yuqi': {
    zh: '秦將。獲罪秦始皇,亡命燕。荊軻刺秦,以樊於期之首為信物獻於秦王,樊於期自刎以助荊軻。',
    en: 'A Qin general. Having committed an offense against the First Emperor, he fled to Yan. When Jing Ke went to assassinate the king of Qin, he carried Fan Yuqi\'s head as a token; Fan Yuqi cut his own throat to help Jing Ke.',
  },
  'hist-yue-yang': {
    zh: '魏文侯將。攻中山三年克之,中山君烹其子以餉樂羊,樂羊食之,以表忠魏。魏文侯雖加封賞,然疑其忍而疏之。',
    en: 'A general under Marquis Wen of Wei. After three years he took Zhongshan; the lord of Zhongshan boiled his son and sent the broth to him, and Yue Yang ate it to show his loyalty to Wei. Marquis Wen rewarded him, but distrusted his cruelty and kept him at a distance.',
  },
  'hist-li-yuan': {
    zh: '楚國人,春申君門客。獻其妹於春申君,有娠後使春申君獻於楚考烈王,生悍,立為太子。考烈王崩,李園恐春申君洩之,於棘門埋伏殺春申君,夷其族。',
    en: 'Of Chu, a retainer of Chunshen-jun. He gave his sister to Chunshen-jun; when she was with child, he had Chunshen-jun present her to King Kaolie of Chu. She bore Han, who was made crown prince. When the king died, Li Yuan, fearing Chunshen-jun would speak, laid an ambush at the Ji gate, killed Chunshen-jun, and wiped out his clan.',
  },
  'hist-laoai': {
    zh: '秦相呂不韋進獻於太后趙姬。趙姬寵之,封長信侯,僭以二國之君自居。後謀反被秦始皇平之,車裂於市,夷三族。趙姬亦被遷出咸陽。',
    en: 'Presented by Chancellor Lü Buwei to Empress Dowager Zhao. She doted on him and made him Marquis of Changxin, and he carried himself as a lord of two states. He plotted revolt; the First Emperor put it down, tore him apart by chariots in the marketplace, and wiped out three branches of his clan. The empress dowager too was sent away from Xianyang.',
  },
  'hist-tang-sui': {
    era: { zh: '布衣之怒', en: '"The Wrath of a Common Man"' },
    zh: '魏國使者。秦始皇使人說魏王,以五百里地易安陵,安陵君不允,使唐雎使秦。秦王恃強,唐雎按劍而起,曰:「布衣之怒,亦免冠徒跣,以頭搶地耳!若士必怒,伏屍二人,流血五步,天下縞素!」 秦王色撓,謝之,安陵得全。',
    en: 'An envoy of Wei. When the First Emperor sent to ask the King of Wei to swap Anling for five hundred li, the Lord of Anling refused and sent Tang Sui to Qin. The king of Qin trusted in his strength; Tang Sui rose with hand on sword: "The wrath of a common man? He doffs his cap, bares his feet, and beats his head on the ground! When a man of resolve is wroth, two corpses fall, blood spreads five paces — the realm wears mourning white!" The king\'s color paled and he apologized; Anling was kept whole.',
  },
  'hist-kuang-zhang': {
    zh: '齊國將。為齊威王將,大破秦於桑丘。又破燕、楚有功。為人剛直,孟嘗君薦之,齊閔王疑而不用,鬱鬱而卒。',
    en: 'A general of Qi. Under King Wei he broke Qin at Sangqiu utterly. He also broke Yan and Chu. Stiff and upright; Mengchang-jun recommended him, but King Min suspected him and did not use him, and he died in despair.',
  },
  'hist-su-dai': {
    zh: '蘇秦之弟。承兄業,游說列國,以縱橫之術立身。',
    en: 'Younger brother of Su Qin. He carried on his brother\'s work, travelling the states and making himself a name in the arts of league and counter-league.',
  },
  'hist-su-li': {
    zh: '蘇秦之弟,蘇代之兄。亦習縱橫之術。',
    en: 'Younger brother of Su Qin, elder of Su Dai. He too learned the arts of league and counter-league.',
  },
  'hist-gongsun-yan': {
    zh: '魏國人,與張儀齊名之縱橫家。提合縱五國伐秦之策,孟子稱「公孫衍、張儀豈不誠大丈夫哉?一怒而諸侯懼,安居而天下熄」。',
    en: 'Of Wei, a master of the league-arts ranked with Zhang Yi. He proposed the league of five states against Qin; Mencius said: "Were Gongsun Yan and Zhang Yi not truly great men? One word of wrath and the lords feared; in their ease the realm fell quiet."',
  },
  'hist-pang-juan': {
    zh: '魏國名將,與孫臏同學於鬼谷子。妒孫臏之才,設計刖其雙足。後齊魏戰於桂陵、馬陵,龐涓中孫臏伏弩,自刎於樹下,曰:「遂成豎子之名!」',
    en: 'A famed general of Wei, fellow student of Sun Bin under Master Guigu. In jealousy of his talent he had Sun Bin\'s feet cut off. Later, when Qi and Wei fought at Guiling and Maling, Pang Juan walked into Sun Bin\'s ambush and cut his own throat beneath a tree: "So have I made that boy\'s name!"',
  },
  'hist-qi-jie': {
    zh: '燕國將。燕惠王中田單反間計,以騎劫代樂毅。即墨之戰,被田單火牛陣大破,陣亡。',
    en: 'A general of Yan. When King Hui of Yan fell for Tian Dan\'s counter-trick, Qi Jie replaced Yue Yi. At Jimo, Tian Dan\'s Fire-Ox stratagem broke him and he was killed in the line.',
  },
  'hist-zheng-xiu': {
    zh: '楚懷王寵妃。性陰險。新得鄭袖之美而懷王寵之,鄭袖佯善,使新妃掩鼻見王,又使懷王怒而劓之。後人以「鄭袖巧詐」為宮闈陰險之典。',
    en: 'A favorite of King Huai of Chu. Sinister in nature. When a new beauty was sent to the king and he doted on her, Zheng Xiu feigned friendship, then had the new consort cover her nose when she met the king, and made the king in anger cut off her nose. Later ages took "Zheng Xiu\'s wile" as the very type of palace intrigue.',
  },
  'hist-mao-jiao': {
    zh: '秦客茅焦。秦始皇遷母趙姬出咸陽,殺諫者二十七人。茅焦以「天下之大,惟陛下不可失母」諫之,秦始皇感悟,迎母還咸陽,封茅焦為仲父。',
    en: 'Mao Jiao, a guest of Qin. When the First Emperor moved his mother Lady Zhao from Xianyang and killed twenty-seven who remonstrated, Mao Jiao said: "Of all the world, only Your Majesty cannot afford to lose his mother." The emperor was moved, brought his mother back, and made Mao Jiao "Second Father."',
  },
  'hist-tian-pian': {
    zh: '齊國稷下學宮先生。道家、黃老學派代表,與慎到、環淵齊名。',
    en: 'A master of the Jixia Academy of Qi. A representative of the Daoist Huang-Lao school, ranked with Shen Dao and Huan Yuan.',
  },
  'hist-huan-yuan': {
    zh: '齊國稷下學宮先生。道家代表,以黃老之學名於齊。',
    en: 'A master of the Jixia Academy of Qi, a representative of Daoism, famed in Qi for the Huang-Lao learning.',
  },
  'hist-xue-gong': {
    zh: '參見「hist-mengchang-jun」(田文,薛公)。',
    en: 'See hist-mengchang-jun — Tian Wen, Duke of Xue.',
  },
  'hist-huangshigong': {
    era: { zh: '黃石公', en: 'The Yellow Stone Lord' },
    zh: '秦末隱者。下邳橋上以履授張良,張良跪取之,黃石公遂授以《太公兵法》,曰:「讀此則為王者師矣。」 後張良果以此佐劉邦定天下。',
    en: 'A recluse of late Qin. On the bridge at Xiapi he dropped his shoe to Zhang Liang; Zhang Liang knelt to fetch it, and the Yellow Stone Lord gave him the Taigong Bingfa: "Read this and you shall be teacher to a king." With it Zhang Liang would later help Liu Bang gain the realm.',
  },
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
  // ─── 歷代名將 新增第十一批 (Historical biographies — batch 11: Chu-Han) ───
  'hist-xiang-liang': {
    zh: '楚國下相人,項羽叔父。楚將項燕之子。秦末於會稽起兵,立楚懷王孫熊心為楚懷王。屢破秦軍,於定陶為章邯所敗,中流矢而死。',
    en: 'Of Xiaxiang in Chu, uncle of Xiang Yu, son of the Chu general Xiang Yan. In late Qin he raised troops at Kuaiji and set up the grandson of King Huai of Chu as the new King Huai. He broke the Qin army many times, but at Dingtao he was beaten by Zhang Han and struck down by a stray arrow.',
  },
  'hist-xiang-bo': {
    zh: '名纏,字伯,項羽叔父。鴻門宴上以身翼蔽劉邦,使劉邦得脫。後降劉邦,封射陽侯,賜姓劉。',
    en: 'Personal name Chan, style Bo, uncle of Xiang Yu. At the Hongmen Banquet he covered Liu Bang with his own body and Liu Bang escaped. He later submitted to Liu Bang, was made Marquis of Sheyang, and given the surname Liu.',
  },
  'hist-wu-guang': {
    era: { zh: '陳勝吳廣', en: 'Chen Sheng and Wu Guang' },
    zh: '陽夏人。秦末戍卒。與陳勝於大澤鄉揭竿起義,號為「魚腹丹書」、「篝火狐鳴」,中華第一次農民大起義。後為部將田臧所殺。',
    en: 'Of Yangxia. A conscript soldier of late Qin. With Chen Sheng at Daze he raised the cudgel — using "the red writing in the fish belly" and "the fox-cry by the bonfire" — the first great peasant rising of China. He was later killed by his captain Tian Zang.',
  },
  'hist-zhou-wen': {
    zh: '陳勝部將。率十萬大軍直撲咸陽,至戲下,為章邯所敗,退至曹陽。再敗,自刎而死。',
    en: 'A captain of Chen Sheng. He led a hundred thousand straight at Xianyang. At Xi he was broken by Zhang Han and fell back to Caoyang. Beaten again, he cut his own throat.',
  },
  'hist-zhou-shi': {
    zh: '陳勝部將。受命略魏地,立魏咎為魏王。後章邯破之,周市死於亂中。',
    en: 'A captain of Chen Sheng, charged with seizing the lands of Wei; he set up Wei Jiu as King of Wei. Zhang Han later broke him and Zhou Shi died in the chaos.',
  },
  'hist-wu-chen': {
    zh: '陳勝部將。略趙地,自立為趙王。後為部將李良所殺。',
    en: 'A captain of Chen Sheng who seized the lands of Zhao and made himself King of Zhao. He was killed by his captain Li Liang.',
  },
  'hist-han-cheng': {
    zh: '韓國貴族,韓王。陳勝起義,張良立韓成為韓王,項羽不令之國,後殺之於彭城,張良由是歸劉邦。',
    en: 'Of the Han nobility, King of Han. When Chen Sheng rose, Zhang Liang set up Han Cheng as king of Han; Xiang Yu would not let him return to his land and later killed him at Pengcheng — and Zhang Liang from then turned to Liu Bang.',
  },
  'hist-wei-jiu': {
    zh: '魏國貴族。陳勝部將周市立為魏王。後章邯圍臨濟,魏咎自焚而死。',
    en: 'Of the Wei nobility. The Chen Sheng captain Zhou Shi set him up as King of Wei. When Zhang Han besieged Linji, Wei Jiu burned himself to death.',
  },
  'hist-wei-bao': {
    zh: '魏咎之弟。兄死後立為魏王。後降漢,又叛漢從楚,被韓信擒於河東,送長安,周苛斬之。',
    en: 'Younger brother of Wei Jiu. After his brother died he was set up as King of Wei. He submitted to Han, then turned from Han back to Chu; Han Xin took him at Hedong, sent him to Chang\'an, and Zhou Ke beheaded him.',
  },
  'hist-tian-rong': {
    zh: '齊國貴族。陳勝起義,田儋立為齊王,儋死,田榮繼之。後與項羽交惡,起兵反楚,被項羽破殺於平原。其弟田橫繼之。',
    en: 'Of the Qi nobility. When Chen Sheng rose, Tian Dan was set up as King of Qi; when Dan died, Tian Rong took up the line. Falling out with Xiang Yu, he rose against Chu; Xiang Yu broke and killed him at Pingyuan. His brother Tian Heng took the line.',
  },
  'hist-tian-heng': {
    era: { zh: '田橫五百士', en: '"The Five Hundred of Tian Heng"' },
    zh: '齊國貴族,田榮之弟。兄死後立為齊王,與項羽戰。漢定天下,田橫與五百士逃海島。劉邦召之入京,田橫於途中羞憤自殺。五百士聞之,皆自刎於海島,千古傳為氣節之絕唱。',
    en: 'Of the Qi nobility, brother of Tian Rong. After his brother died he was made King of Qi and fought Xiang Yu. When Han settled the realm, Tian Heng with five hundred men fled to a sea island. Liu Bang called him to the capital; on the road, in shame and rage, he killed himself. The five hundred heard, and every one of them cut his own throat on the island — a peerless song of honor for the ages.',
  },
  'hist-tian-dan-chu': {
    zh: '齊國貴族。陳勝起義時起兵,自立為齊王。後為章邯所殺於臨菑。',
    en: 'Of the Qi nobility. He rose with Chen Sheng and made himself King of Qi. Zhang Han later killed him at Linzi.',
  },
  'hist-tian-guang': {
    zh: '田榮之子。父死,韓信平齊,田廣與田橫共拒漢。後敗於高密。',
    en: 'Son of Tian Rong. When his father died and Han Xin pacified Qi, Tian Guang with Tian Heng stood against Han. He was broken at Gaomi.',
  },
  'hist-tian-jia': {
    zh: '齊國貴族。陳勝起義時立為齊王,後讓位於田儋。',
    en: 'Of the Qi nobility. When Chen Sheng rose he was made King of Qi and later yielded to Tian Dan.',
  },
  'hist-zhang-er': {
    zh: '大梁人。陳勝部將,後立為趙王。與陳餘為刎頸之交,後兩人交惡,張耳歸劉邦,韓信、張耳破陳餘於井陘,陳餘被斬。漢定,張耳封趙王,其子張敖娶劉邦女魯元公主。',
    en: 'Of Daliang. A captain of Chen Sheng, later made King of Zhao. He and Chen Yu were sworn-life friends; later they fell out, Zhang Er went over to Liu Bang, and at Jingxing, Han Xin and Zhang Er broke Chen Yu, who was beheaded. When Han was set, Zhang Er was made King of Zhao, and his son Zhang Ao wed Liu Bang\'s daughter Princess Luyuan.',
  },
  'hist-chen-yu': {
    zh: '大梁人,儒生。與張耳為刎頸之交,後因兩人意見不合而相絕。陳餘立趙歇為趙王,自為大將軍。井陘之戰,被韓信、張耳所破,死於泜水。',
    en: 'Of Daliang, a Confucian scholar. He and Zhang Er were sworn-life friends; later, falling out in opinion, they broke off. Chen Yu set up Zhao Xie as King of Zhao and made himself Grand Marshal. At Jingxing Han Xin and Zhang Er broke him, and he died at the Zhi River.',
  },
  'hist-zhang-ao': {
    zh: '張耳之子。襲趙王。劉邦過趙,張敖以子婿之禮事之,劉邦坐而辱之。張敖之相貫高怒,密謀殺劉邦,事敗,貫高自殺,張敖被廢為宣平侯。',
    en: 'Son of Zhang Er, who succeeded as King of Zhao. When Liu Bang passed through Zhao, Zhang Ao served him with the rite of a son-in-law; Liu Bang sat carelessly and insulted him. Zhang Ao\'s chancellor Guan Gao in fury plotted to kill Liu Bang; the plot leaked, Guan Gao killed himself, and Zhang Ao was reduced to Marquis of Xuanping.',
  },
  'hist-liyiji': {
    era: { zh: '高陽酒徒', en: 'The Drunkard of Gaoyang' },
    zh: '名酈食其,陳留高陽人。漢初謀士。原為儒生,自稱「高陽酒徒」,獻計於劉邦取陳留、下齊七十餘城。後齊王田廣以酈食其賣己,烹之於齊。',
    en: 'Personal name Li Yiji, of Gaoyang in Chenliu. A counselor of early Han. Originally a Confucian, he called himself "the Drunkard of Gaoyang." He counseled Liu Bang to take Chenliu and lay down seventy cities of Qi. King Guang of Qi, thinking Li Yiji had sold him out, boiled him alive in Qi.',
  },
  'hist-li-zuoche': {
    zh: '趙國謀士。井陘之戰,獻計於陳餘,陳餘不用。韓信破陳餘後,千金求李左車,以師禮事之,問策破燕齊。後從韓信征戰。',
    en: 'A counselor of Zhao. At Jingxing he gave counsel to Chen Yu, who did not use it. After Han Xin had broken Chen Yu, Han Xin sought Li Zuoche with a reward of a thousand gold pieces, served him with the rite of a master, and asked counsel for the breaking of Yan and Qi. He then marched with Han Xin.',
  },
  'hist-kuai-tong': {
    era: { zh: '三分天下', en: '"Divided the Realm in Three"' },
    zh: '齊國辯士。獻策於韓信,勸其背漢自立,「三分天下,鼎足而立」。韓信不忍,終被呂后所害。蒯通聞之,佯狂為巫。劉邦欲烹之,蒯通辯「狗各吠其主」,終被釋。',
    en: 'A diviner of Qi. He counseled Han Xin to turn from Han and stand alone, "divide the realm in three, stand as a tripod." Han Xin could not bring himself to do it and was at last killed by Empress Lü. When Kuai Tong heard, he pretended madness as a shaman. Liu Bang would have boiled him; Kuai Tong argued: "Each dog barks for its own master," and he was at last set free.',
  },
  'hist-ji-bu': {
    era: { zh: '一諾千金', en: '"A Single Promise Worth a Thousand Gold"' },
    zh: '楚國人。項羽部將,以勇義稱,「得黃金百斤,不如得季布一諾」,千古傳為俗語。楚亡,劉邦懸賞千金捕之,夏侯嬰薦於劉邦,赦之,終為郎中。',
    en: 'Of Chu. A captain of Xiang Yu, famed for courage and honor — "a hundred jin of gold is not worth a single promise of Ji Bu" became a saying for the ages. When Chu fell, Liu Bang set a thousand-gold price on his head; Xiahou Ying spoke for him and Liu Bang pardoned him; he became a Gentleman of the Palace.',
  },
  'hist-ji-xin': {
    era: { zh: '紀信誑楚', en: '"Ji Xin Deceived Chu"' },
    zh: '劉邦部將。容貌與劉邦相似。滎陽之圍,糧盡兵疲。紀信假扮劉邦,駕黃屋車出降楚,使劉邦得脫。項羽察覺,怒焚紀信於滎陽城下。',
    en: 'A captain of Liu Bang, of like face to him. In the siege of Yingyang, when grain and men failed, Ji Xin disguised himself as Liu Bang, drove out in the imperial yellow carriage to surrender to Chu, and Liu Bang slipped away. When Xiang Yu found out, in fury he burned Ji Xin at the wall of Yingyang.',
  },
  'hist-zhongli-mei': {
    zh: '楚國伊廬人。項羽部將,與韓信為友。楚亡,逃匿於韓信家。劉邦詔捕之,韓信欲解之,鍾離昧曰:「公非長者!」 自刎而死。劉邦因此疑韓信,終致韓信之禍。',
    en: 'Of Yilu in Chu. A captain of Xiang Yu, friend to Han Xin. When Chu fell he hid in Han Xin\'s house. When Liu Bang ordered his arrest and Han Xin meant to deliver him, Zhongli Mei said: "You are no man of stature!" and cut his own throat. Through this Liu Bang grew suspicious of Han Xin — and at last the disaster of Han Xin came.',
  },
  'hist-long-qu': {
    zh: '楚國名將。項羽愛將,號「龍翥鳳翔」。韓信下齊,長龍且率二十萬眾救齊。濰水之戰,韓信決水半渡而擊之,龍且陣亡,楚軍盡覆。',
    en: 'A famed general of Chu, beloved of Xiang Yu, called "Dragon Soaring, Phoenix Flying." When Han Xin pacified Qi, Long Qu led two hundred thousand to relieve it. At the Wei River Han Xin broke the dam and struck them mid-crossing; Long Qu died in the line and the Chu host was utterly destroyed.',
  },
  'hist-cao-jiu': {
    zh: '原秦獄吏,項梁、項羽之恩人。項羽封塞王,守成皋。劉邦激之出戰,曹咎大怒出戰,中漢軍埋伏,大敗,自刎於汜水。',
    en: 'Originally a Qin prison clerk, benefactor of Xiang Liang and Xiang Yu. Xiang Yu made him King of Sai, holding Chenggao. Liu Bang taunted him out; Cao Jiu in fury rode out, walked into the Han ambush, was utterly broken, and cut his throat at the Si River.',
  },
  'hist-huan-chu': {
    zh: '楚國人。項羽部將,以勇略稱。劉邦遣陸賈說之,桓楚不肯降。後事不詳。',
    en: 'Of Chu. A captain of Xiang Yu, famed for bold counsel. Liu Bang sent Lu Jia to talk him over; Huan Chu would not submit. His later end is unknown.',
  },
  'hist-yu-ji': {
    era: { zh: '虞美人', en: 'The Beautiful Lady Yu' },
    zh: '項羽寵姬。垓下之圍,四面楚歌,項羽悲歌曰:「力拔山兮氣蓋世,時不利兮騅不逝。騅不逝兮可奈何,虞兮虞兮奈若何!」 虞姬和歌而舞,自刎於帳前,以絕項羽之顧念。千古絕唱「霸王別姬」由此而起。',
    en: 'Beloved consort of Xiang Yu. In the encirclement at Gaixia, with Chu songs on every side, Xiang Yu sang in grief: "My strength could pluck up mountains, my breath cover the world / now the times go against me and my Zhui-horse will not run. / Zhui will not run — what shall I do? / Yu! Yu! What shall I do with you?" Lady Yu sang in answer, danced, and cut her own throat before his tent, that Xiang Yu need not look back. The peerless song of "the Conqueror Parts with Yu" comes from her.',
  },
  'hist-xiahou-ying': {
    era: { zh: '滕公', en: 'Duke Teng' },
    zh: '沛縣人。劉邦同鄉之友。為劉邦御車,封滕公。彭城之敗,劉邦欲棄子女,夏侯嬰收之車上而還。漢定,封汝陰侯。歷事高祖、惠帝、文帝三朝。',
    en: 'Of Pei county. Friend from the same village as Liu Bang. He drove the carriage for Liu Bang and was made Duke Teng. After the defeat at Pengcheng, when Liu Bang would have cast off his own children, Xiahou Ying picked them up onto the carriage and carried them back. When Han was set he was made Marquis of Ruyin. He served three reigns — Gaozu, Hui, and Wen.',
  },
  'hist-lu-wan': {
    era: { zh: '燕王', en: 'King of Yan' },
    zh: '沛縣豐邑人。劉邦同里同日生之友。劉邦寵之,封燕王。漢定後,劉邦疑諸異姓王,盧綰懼,陳豨之亂中暗通匈奴,劉邦怒,盧綰奔匈奴而死。',
    en: 'Of Fengyi in Pei county. A friend of Liu Bang, born on the same day in the same village. Liu Bang doted on him and made him King of Yan. After Han was set, Liu Bang grew suspicious of the kings of other surnames. Lu Wan in fear had secret dealings with the Xiongnu through Chen Xi\'s revolt; Liu Bang in anger pursued him. Lu Wan fled to the Xiongnu and died there.',
  },
  'hist-wang-ling': {
    zh: '沛縣人。漢初名臣。性剛直。呂后欲立諸呂為王,問王陵,陵曰:「高皇帝與群臣白馬之盟,非劉氏不王。今欲立諸呂,非約也。」 呂后怒,遷王陵為太傅,實奪其相權,陵稱病不朝,終卒於家。',
    en: 'Of Pei county. A famed early-Han minister. Stiff and upright. When Empress Lü would make the Lü princes kings, she asked Wang Ling; he said: "Gaozu and his ministers swore the White Horse Oath — none who is not of the Liu shall be king. To enthrone the Lü now would break the oath." Empress Lü in anger moved him to Grand Tutor, stripping his chancellorship in truth. He pleaded illness and would not come to court, and died at home.',
  },
  'hist-zhou-chang': {
    era: { zh: '期期艾艾', en: '"Stammering Out Every Word"' },
    zh: '沛縣人。漢初御史大夫。性剛直,口吃。劉邦欲廢太子,周昌入諫,口吃曰:「臣口不能言,然臣期期知其不可。陛下欲廢太子,臣期期不奉詔!」 劉邦笑而止。「期期艾艾」千古為俗語。',
    en: 'Of Pei county. Imperial Secretary of early Han. Stiff and upright, and a stammerer. When Liu Bang wished to depose the crown prince, Zhou Chang came to remonstrate, stammering: "Your servant\'s tongue cannot — cannot speak well, but your servant — your servant knows it cannot be done. Your Majesty wishes to depose the crown prince — your servant — your servant will not obey the edict!" Liu Bang laughed and let it drop. "Stammering and stuttering" became a saying for the ages.',
  },
  'hist-zhou-ke': {
    zh: '周昌之弟。守滎陽,城陷被項羽所擒。項羽欲降之,周苛罵曰:「若不趨降漢,今為虜矣!」 項羽怒,烹之。',
    en: 'Younger brother of Zhou Chang. He held Yingyang; when the city fell he was taken by Xiang Yu. Xiang Yu would have brought him over; Zhou Ke cursed: "You had better hurry and surrender to Han, or you will be a captive!" Xiang Yu in fury boiled him alive.',
  },
  'hist-sui-he': {
    zh: '漢初辯士。劉邦遣其說九江王英布反楚降漢,隨何以言激之,使英布起兵,項羽腹背受敵。漢定,封護軍中尉。',
    en: 'A diviner of early Han. Liu Bang sent him to persuade King Ying Bu of Jiujiang to turn from Chu to Han; Sui He spurred him with words, and Ying Bu rose — Xiang Yu was caught front and back. When Han was set he was made Commandant Protector of the Army.',
  },
  'hist-luan-bu': {
    zh: '梁人,彭越故友。彭越被誅夷三族,首級懸於洛陽,詔曰「敢有收視者輒捕之」。欒布獨往哭祭,劉邦怒欲烹之,欒布從容陳辭,劉邦感其忠義,釋之,封欒布為都尉。',
    en: 'Of Liang, an old friend of Peng Yue. When Peng Yue was killed and his clan exterminated, his head was hung at Luoyang with the edict: "Whoever dares to gather or look on him shall be caught." Luan Bu alone went to mourn. Liu Bang in fury would have boiled him; Luan Bu set forth the case calmly, and Liu Bang, moved by his loyalty, freed him and made him Commandant.',
  },
  'hist-ji-xin-chu': {
    zh: '楚國季信,項羽部將,與紀信同名而異姓。',
    en: 'Ji Xin of Chu, a captain of Xiang Yu — different surname, same personal name as Ji Xin of Liu Bang\'s side.',
  },
  'hist-qi-furen': {
    era: { zh: '人彘', en: '"The Human Pig"' },
    zh: '定陶人。漢高祖劉邦寵姬,生趙王劉如意。劉邦欲廢太子立如意,賴張良、商山四皓而止。劉邦死後,呂后陷之為「人彘」,斬手足,去眼,熏聾,飲瘖藥,棄於廁中,千古宮闈第一慘事。',
    en: 'Of Dingtao. The beloved consort of Han Gaozu Liu Bang, mother of Prince Liu Ruyi of Zhao. Liu Bang would have deposed the crown prince to set up Ruyi; only Zhang Liang and the Four Hoaries of Shang Mountain stopped him. After Liu Bang died, Empress Lü made her a "human pig" — cut off her hands and feet, gouged out her eyes, blasted her ears, gave her a mute draught, and threw her in the latrine — the first great horror of the inner palace for the ages.',
  },
  'hist-liu-ruyi': {
    zh: '劉邦寵姬戚夫人之子。封趙王。劉邦欲廢太子立之,未果。呂后毒殺於長安,年僅十二。',
    en: 'Son of Liu Bang\'s beloved Consort Qi. Made Prince of Zhao. Liu Bang would have deposed the crown prince to set him up — could not. Empress Lü poisoned him at Chang\'an at only twelve.',
  },
  'hist-liu-fei': {
    zh: '劉邦庶長子。封齊王。為人謹厚。呂后宴之,以毒酒欲害,賴齊內史獻計,獻城陽郡為呂后女魯元公主湯沐邑,得免。卒於高后元年。',
    en: 'Eldest natural son of Liu Bang. Made King of Qi. Cautious and kind. Empress Lü meant to poison him at a banquet; on the counsel of the Qi Inspector he ceded Chengyang commandery as the bathing-village of Princess Luyuan, and was saved. He died in the first year of Empress Lü.',
  },
  'hist-liu-jiao': {
    zh: '劉邦四弟。封楚王。性好書,招賢士甚多。後與穆生、白生、申公講論《詩經》,以文教稱。在位二十三年。',
    en: 'Fourth brother of Liu Bang. Made King of Chu. Fond of books, he gathered many worthies. With Mu Sheng, Bai Sheng, and Master Shen he discoursed on the Book of Odes, famed for letters and teaching. He reigned twenty-three years.',
  },
  'hist-zhou-yin': {
    zh: '項羽部將。守九江。隨何說九江王英布反楚,周殷亦從之,以九江降漢。垓下之圍,周殷率舒、六之兵會合於垓下。',
    en: 'A captain of Xiang Yu, holding Jiujiang. When Sui He persuaded King Ying Bu of Jiujiang to turn from Chu, Zhou Yin went with him and gave Jiujiang to Han. In the encirclement at Gaixia, Zhou Yin brought the troops of Shu and Liu to the meeting.',
  },
  'hist-pu-jiangjun': {
    zh: '陳勝部將,後事項羽。其名不詳,世稱「蒲將軍」。從項羽渡江入關,有戰功。',
    en: 'A captain of Chen Sheng, who later served Xiang Yu. His personal name is unknown — the world called him "General Pu." He crossed the river into Guanzhong with Xiang Yu, with credit in war.',
  },
  'hist-sima-ang': {
    zh: '原趙國將,項羽部下。項羽封殷王,鎮河內。後劉邦東征,降漢,韓信破之,被殺。',
    en: 'Originally a general of Zhao under Xiang Yu. Xiang Yu made him King of Yin, holding Henei. When Liu Bang marched east, he submitted; Han Xin later broke him and he was killed.',
  },
  'hist-shen-yang': {
    zh: '原趙國上將軍,項羽封河南王。後降劉邦。',
    en: 'Originally Senior General of Zhao; Xiang Yu made him King of Henan. He later submitted to Liu Bang.',
  },
  'hist-ren-ao': {
    zh: '沛縣人。劉邦同鄉之友。漢定,封陽都侯。性公正,任御史大夫,以執法稱。',
    en: 'Of Pei county, friend of Liu Bang from his village. When Han was set, made Marquis of Yangdu. Upright in temper, as Imperial Secretary he was famed for applying the law.',
  },
  'hist-shentu-jia': {
    zh: '梁人。漢文帝、景帝兩朝丞相。性剛直,屢諫不阿。卒於相位。',
    en: 'Of Liang. Chancellor under both Emperors Wen and Jing of Han. Stiff and upright, he remonstrated without flattery. He died in office.',
  },
  'hist-zhao-yao': {
    zh: '漢文帝時方士。獻禳災之術,文帝後悔之。',
    en: 'A Daoist adept under Emperor Wen of Han. He offered the art of warding off disasters; the emperor later regretted using him.',
  },
  'hist-zhao-ping': {
    zh: '秦東陵侯。秦亡,布衣為民,於長安城東種瓜,以瓜美聞,世稱「東陵瓜」。',
    en: 'Marquis of Dongling under Qin. When Qin fell he became a commoner and grew melons east of Chang\'an. His melons were the best — the world called them the "Dongling melons."',
  },
  'hist-wang-lingmu': {
    zh: '王陵之母。劉邦圍項羽於成皋,王陵欲歸劉邦,項羽執其母為質。母私見漢使,曰:「願告王陵,善事漢王,漢王長者也,毋以老妾故,持二心。」 言畢自刎。項羽怒烹其屍。王陵卒從劉邦。',
    en: 'Mother of Wang Ling. When Liu Bang besieged Xiang Yu at Chenggao and Wang Ling would have gone to Liu Bang, Xiang Yu held his mother as hostage. She met the Han envoy in secret: "Tell Wang Ling to serve the King of Han well; the King of Han is a man of stature. Do not waver in heart for the sake of an old woman." She cut her own throat. Xiang Yu in fury boiled the corpse. Wang Ling at last followed Liu Bang.',
  },
  'hist-han-ying': {
    zh: '漢初辯士。曾與晁錯共學《尚書》於伏生。事漢景帝,主削藩。',
    en: 'A diviner of early Han. With Chao Cuo he studied the Book of Documents under Master Fu. He served Emperor Jing of Han and urged the cutting down of the feudatories.',
  },
  'hist-yongchi': {
    zh: '沛縣人。劉邦之同鄉,然與劉邦素有嫌。劉邦欲殺之,張良勸先封以安群臣。漢定,封什邡侯。',
    en: 'Of Pei county. A fellow villager of Liu Bang, but at odds with him from the start. Liu Bang would have killed him; Zhang Liang urged him to enfeoff this enemy first to ease the ministers\' fears. When Han was set, he was made Marquis of Shifang.',
  },
  'hist-loufan': {
    zh: '楚國神箭手。項羽部將。鴻溝之約後,項羽使樓煩射劉邦,連射三人皆中。劉邦怒罵項羽,項羽不能勝。',
    en: 'A peerless archer of Chu, captain of Xiang Yu. After the truce of the Hong Canal, Xiang Yu had Loufan shoot at Liu Bang; he hit three men in a row. Liu Bang cursed at Xiang Yu, and Xiang Yu could not bear him.',
  },
  'hist-wu-she': {
    zh: '楚國令尹,伍子胥之父。楚平王聽費無忌之讒,殺伍奢、伍尚父子。伍子胥奔吳,終引吳師伐楚以雪父兄之仇。',
    en: 'Chancellor of Chu, father of Wu Zixu. When King Ping of Chu heeded Fei Wuji\'s slander, he killed Wu She and Wu Shang father and son. Wu Zixu fled to Wu and at last led the Wu army against Chu to wash out the grudge.',
  },
  'hist-wu-rui': {
    zh: '番陽令。秦末從項羽,後降漢,封長沙王,中華第一漢室異姓王。傳子吳臣,五世而絕。',
    en: 'Prefect of Poyang. In late Qin he joined Xiang Yu, then submitted to Han and was made King of Changsha — the first king of a non-Liu surname under Han. The line passed to his son Wu Chen and ended after five generations.',
  },
  'hist-hanxin-king': {
    zh: '韓王信,韓國貴族,劉邦所立韓王。後叛降匈奴,劉邦親征,白登之圍由是而起。後死於匈奴。與漢初三傑韓信非一人。',
    en: 'Han Xin, King of Han — a noble of the old Han state set up by Liu Bang as King. He later turned and went over to the Xiongnu; Liu Bang took the field in person, and the encirclement at Baideng came from this. He died among the Xiongnu. Not the same as Han Xin one of the Three Heroes.',
  },
  'hist-tian-diao': {
    zh: '齊國貴族,田榮之姪。',
    en: 'Of the Qi nobility, nephew of Tian Rong.',
  },
  'hist-tian-ken': {
    zh: '齊國謀士。劉邦定齊,田肯獻策曰:「陛下治秦中,如秦得齊也,則永世之計矣。」',
    en: 'A counselor of Qi. When Liu Bang settled Qi, Tian Ken gave counsel: "Your Majesty rules the Qin region; if you can hold it as Qin once held Qi, then the plan is for ten thousand generations."',
  },
  'hist-zhuang-bushi': {
    zh: '齊國辯士。漢武帝時人。',
    en: 'A diviner of Qi under Emperor Wu of Han.',
  },
  'hist-ge-ying': {
    zh: '秦末東陽人。陳嬰起兵,葛嬰亦舉兵,被陳勝所殺。',
    en: 'Of Dongyang in late Qin. When Chen Ying raised troops, Ge Ying too rose; Chen Sheng killed him.',
  },
  'hist-gong-ao': {
    zh: '楚國將。項羽封臨江王,鎮南郡。後降漢。',
    en: 'A general of Chu. Xiang Yu made him King of Linjiang, holding Nanjun. He later submitted to Han.',
  },
  'hist-guan-he': {
    zh: '漢初將。隨韓信征戰,封信武侯。',
    en: 'A general of early Han. He marched with Han Xin and was made Marquis of Xinwu.',
  },
  'hist-xiao-duoli': {
    zh: '匈奴單于。漢初冒頓單于之另寫。',
    en: 'A Xiongnu Chanyu; an alternate writing for Modu Chanyu of early Han.',
  },
  // ─── 歷代名將 新增第十二批 (Historical biographies — batch 12: cross-dynasty early) ───
  // Spring & Autumn
  'hist-wu-zixu': {
    era: { zh: '春秋雪父之仇', en: 'Avenger of His Father' },
    zh: '名員,楚國人。父兄被楚平王所殺,伍子胥奔吳,助闔閭五戰入郢,鞭楚平王屍三百以雪父兄之仇。後吳王夫差不聽其言,賜屬鏤劍命其自盡,曰:「抉吾眼置吳東門,以觀越寇入吳!」',
    en: 'Personal name Yun, of Chu. His father and brother were killed by King Ping of Chu; Wu Zixu fled to Wu, helped King Helu in five battles into Ying, and whipped the corpse of King Ping three hundred strokes. King Fuchai later would not hear him, sent the Shulü sword, and he cried: "Pluck out my eyes and set them on the eastern gate of Wu — that I may see Yue come in!"',
  },
  'hist-wen-zhong': {
    zh: '楚國郢人,字子禽。與范蠡共佐越王句踐滅吳。范蠡知句踐可共患難,不可共富貴,函書勸之去,文種不從。終被句踐賜劍自盡。',
    en: 'Of Ying in Chu, style Ziqin. With Fan Li he served King Goujian of Yue in destroying Wu. Fan Li, knowing Goujian could share hardship but not prosperity, sent a letter urging him to leave; Wen Zhong would not go. Goujian sent him a sword.',
  },
  'hist-you-yu': {
    zh: '原戎人,後事秦穆公。獻計平西戎,使秦穆公稱霸西陲。',
    en: 'Originally of the Rong, later he served Duke Mu of Qin. He gave the counsels to pacify the western Rong and made Duke Mu hegemon of the west.',
  },
  'hist-ji-you': {
    zh: '魯莊公弟。性正直,廢慶父之亂,立僖公。魯國中興之臣。',
    en: 'Younger brother of Duke Zhuang of Lu. Upright in temper, he put down Qingfu\'s revolt and set up Duke Xi — a restorer of Lu.',
  },
  'hist-qingfu': {
    zh: '魯莊公庶兄。亂魯,殺二君,後逃莒。魯人賂莒求之,慶父歸,自縊於密。「慶父不死,魯難未已」千古絕唱。',
    en: 'Half-brother of Duke Zhuang of Lu. He stirred Lu to chaos and killed two rulers, then fled to Ju. The Lu bribed Ju and he returned; he hanged himself at Mi. "While Qingfu is not dead, the troubles of Lu have no end" rang forever.',
  },
  'hist-huan-tui': {
    zh: '宋國司馬。孔子過宋,桓魋欲殺之。孔子歎曰:「天生德於予,桓魋其如予何!」',
    en: 'Sima of Song. When Confucius passed through Song, Huan Tui would have killed him. The Master sighed: "Heaven bore virtue in me — what can Huan Tui do to me?"',
  },
  'hist-zhao-wu': {
    era: { zh: '趙氏孤兒', en: 'The Orphan of the Zhao' },
    zh: '趙朔之子。趙氏為屠岸賈所滅,程嬰、公孫杵臼救之,藏於山中十五年。後趙武長大,復趙氏,誅屠岸賈,千古傳為忠義故事,改編為元雜劇《趙氏孤兒》。',
    en: 'Son of Zhao Shuo. When the Zhao clan was wiped out by Tu\'an Gu, Cheng Ying and Gongsun Chujiu saved him; he was hidden in the mountains fifteen years. Grown, Zhao Wu restored the Zhao and killed Tu\'an Gu — a tale of loyalty for the ages, made into the Yuan zaju "The Orphan of the Zhao."',
  },
  'hist-tu’an-jia': {
    zh: '晉國權臣。譖殺趙朔,夷趙氏。程嬰、公孫杵臼藏趙氏孤兒。後趙武長,屠岸賈被誅。',
    en: 'A great power-holder of Jin. He slandered Zhao Shuo to death and wiped out the Zhao. Cheng Ying and Gongsun Chujiu hid the Zhao orphan. When Zhao Wu grew up, Tu\'an Gu was killed.',
  },
  'hist-qubo-yu': {
    zh: '春秋衛國大夫。賢者。年五十而知四十九年之非。孔子至衛,主於蘧伯玉家,以為「君子哉蘧伯玉!」',
    en: 'A grandee of Wey in the Spring and Autumn, a worthy man. At fifty he knew the faults of his forty-nine years. When Confucius came to Wey he stayed in his house: "A gentleman is Qu Boyu!"',
  },
  'hist-yuxiong': {
    zh: '楚國始祖鬻熊。傳為周文王之師。後封於楚,楚國八百年之祖。',
    en: 'Yuxiong, ancestor of the state of Chu. Tradition says he was teacher to King Wen of Zhou. Enfeoffed in Chu, he was the ancestor of the eight-hundred-year house.',
  },
  'hist-ziyu-chu': {
    zh: '楚成王令尹,字子玉。城濮之戰主帥,為晉文公所敗,楚成王問罪,自殺於連榖。',
    en: 'Chancellor of King Cheng of Chu, style Ziyu. Commander at Chengpu, broken by Duke Wen of Jin. When King Cheng asked his crime, he killed himself at Liangu.',
  },
  'hist-ziyu-song': {
    zh: '宋國司寇。宋襄公之兄。屢諫襄公,泓水之戰勸其擊楚渡河之軍,襄公不從。',
    en: 'Minister of Justice in Song, elder brother of Duke Xiang. He often remonstrated; at the Hong River he urged the Duke to strike the Chu army mid-crossing — the Duke would not.',
  },
  'hist-zichang': {
    zh: '楚國令尹,字囊瓦。性貪,索蔡昭侯之裘,蔡昭侯不與,囊瓦怒囚之。後蔡昭侯入吳乞師,吳師伐楚入郢,囊瓦逃鄭而死。',
    en: 'Chancellor of Chu, style Nangwa. Greedy by nature, he demanded the fur robe of Marquis Zhao of Cai, who refused — and Nangwa held him captive. Marquis Zhao went to Wu to beg an army; the Wu army entered Ying; Nangwa fled to Zheng and died there.',
  },
  'hist-zinang': {
    zh: '楚共王令尹。臨終遺命:「必城郢!」 國以為憂,郢都之外無城,後楚平王築城於郢。',
    en: 'Chancellor of King Gong of Chu. On his deathbed he charged: "Be sure to wall Ying!" The state took it to heart, for outside Ying there was no wall; King Ping later raised it.',
  },
  'hist-zipi': {
    zh: '鄭國正卿。子產之師。',
    en: 'Chief Minister of Zheng, teacher of Zichan.',
  },
  'hist-zijia-ji': {
    zh: '鄭國大夫。執政。後與穆公子靈相爭。',
    en: 'A grandee of Zheng, holding power; he later contested with the prince Ling, son of Duke Mu.',
  },
  'hist-shi-hui': {
    zh: '晉國正卿。從晉文公流亡。後事晉襄公、晉靈公,以智見稱。',
    en: 'Chief Minister of Jin. He followed Duke Wen in exile. Under Dukes Xiang and Ling he was famed for cleverness.',
  },
  'hist-fan-wenzi': {
    zh: '晉國正卿。范文子。事晉景公、厲公。性謙退,屢辭功賞。',
    en: 'Chief Minister of Jin, Fan Wenzi. He served Dukes Jing and Li. Modest, he often refused merit and reward.',
  },
  'hist-zhixuanzi': {
    zh: '晉國正卿。智宣子。智伯之父。',
    en: 'Chief Minister of Jin, Zhi Xuanzi. Father of Zhibo.',
  },
  'hist-zhonghang-linfu': {
    zh: '晉國六卿之一。中行氏。後與趙氏交戰,被驅逐。',
    en: 'One of the Six Ministers of Jin, of the Zhonghang clan. He warred with the Zhao and was driven out.',
  },
  'hist-han-xuanzi': {
    zh: '晉國正卿。韓氏。執政於春秋末,為韓國之祖。',
    en: 'Chief Minister of Jin, of the Han clan. He held power at the end of the Spring and Autumn — ancestor of the state of Han.',
  },
  'hist-wei-xuangong': {
    zh: '衛國國君。在位十九年。性淫,娶宣姜,生公子壽、朔。後弒太子伋,衛由是亂。',
    en: 'Duke Xuan of Wey. Nineteen years he reigned. Lewd in temper, he took Lady Xuanjiang and bore the princes Shou and Shuo; he killed the heir Ji, and Wey fell into chaos.',
  },
  'hist-wei-huanzi': {
    zh: '晉國六卿之一,魏氏。為魏國之祖。',
    en: 'One of the Six Ministers of Jin, of the Wei clan — ancestor of the state of Wei.',
  },
  // Warring States
  'hist-wu-qi': {
    era: { zh: '吳子兵法', en: 'The Wuzi Bingfa' },
    zh: '衛國左氏人。為將與士卒同甘苦,卒有疽,吳起親為吮膿。事魯、魏、楚三國,皆為名將。在楚變法,觸貴族之怒。楚悼王死,貴族圍攻,吳起伏屍王屍上,中箭而亡。',
    en: 'Of Zuoshi in Wey. As a general he shared every hardship with his men — when a soldier had a boil, he sucked the pus with his own mouth. He served Lu, Wei, and Chu in turn. In Chu he led reforms and roused the nobles\' wrath. When King Dao died, the nobles surrounded him; Wu Qi flung himself across the king\'s body and died there under arrows.',
  },
  'hist-zhao-she': {
    era: { zh: '馬服君', en: 'Lord of Mafu' },
    zh: '趙國名將。閼與之戰,以「狹路相逢勇者勝」破秦軍,封馬服君。其子趙括紙上談兵,長平之敗實基於此。',
    en: 'A famed general of Zhao. At Yuyu he broke Qin by the saying "where two meet on a narrow road, the bold wins," and was made Lord of Mafu. His son Zhao Kuo could only "talk strategy on paper" — and the rout of Changping was rooted here.',
  },
  'hist-yue-jian': {
    zh: '樂毅之子。事燕惠王、武成王。性沉雅。後燕武成王伐趙,樂閒勸阻,不聽,大敗。樂閒奔趙。',
    en: 'Son of Yue Yi. He served Kings Hui and Wucheng of Yan. Steady and refined. When King Wucheng would march on Zhao, Yue Jian urged him not to; the king would not hear and was utterly broken. Yue Jian fled to Zhao.',
  },
  'hist-yue-cheng': {
    zh: '樂毅之姪。事燕,後事趙,封武襄君。',
    en: 'Nephew of Yue Yi. He served Yan and later Zhao, made Lord Wuxiang.',
  },
  'hist-cai-ze': {
    era: { zh: '貂蟬冠', en: '"The Sable-Marten Cap"' },
    zh: '燕國人。秦昭王時辯士。代范雎為秦相。性辯,有「日中則移,月滿則虧」之語,勸範雎讓位。',
    en: 'Of Yan. A diviner under King Zhao of Qin who replaced Fan Ju as chancellor. Eloquent — "the sun at noon will move; the moon when full will wane" was the saying with which he urged Fan Ju to yield.',
  },
  'hist-ju-xin': {
    zh: '楚國將。秦攻楚,劇辛奉命救援,中秦軍埋伏,大敗,自殺。',
    en: 'A general of Chu. When Qin came against Chu, Ju Xin marched to relieve; trapped in the Qin ambush he was broken and killed himself.',
  },
  'hist-duangan-mu': {
    zh: '魏國隱士。魏文侯欲見之,段干木翻牆而逃。文侯每過其閭必下車軾,以示敬。',
    en: 'A recluse of Wei. When Marquis Wen wished to meet him, Duangan Mu leapt over the wall to escape. Whenever the marquis passed his alley, he bowed from his carriage in honor.',
  },
  'hist-gongshu-cuo': {
    zh: '魏國相。臨終薦商鞅於魏惠王,曰:「公叔之臣有公孫鞅者,雖少,有奇才,願君舉國以聽之。」 又曰:「若君不能用,則殺之,毋使出境。」 惠王皆不從,商鞅遂奔秦,秦由是強。',
    en: 'Chancellor of Wei. On his deathbed he recommended Shang Yang to King Hui: "There is a man in my service, Gongsun Yang. Though young, he has rare talent. Take the state and listen to him." And again: "If you cannot use him, kill him — let him not leave the borders." The king did neither; Shang Yang fled to Qin, and from him Qin grew strong.',
  },
  'hist-pang-xuan': {
    zh: '魏國將。從吳起戰於陰晉,以五萬破秦五十萬,中華軍史奇跡之一。',
    en: 'A general of Wei. At Yinjin under Wu Qi, with fifty thousand he broke Qin\'s five hundred thousand — one of the wonders of Chinese military history.',
  },
  'hist-zhao-suhou': {
    zh: '趙國國君。在位二十四年。任用肥義,趙國中興。其孫即趙武靈王。',
    en: 'Marquis Su of Zhao. Twenty-four years he reigned. He raised Fei Yi, and Zhao was restored. His grandson would be King Wuling of Zhao.',
  },
  'hist-zou-yang': {
    zh: '齊國辯士。從吳王劉濞,後事梁孝王。獻《獄中上梁王書》,陳冤情,梁孝王赦之。',
    en: 'A diviner of Qi. He served the King of Wu Liu Bi and later King Xiao of Liang. He sent up the Letter from Prison to King of Liang, setting out his case; the king pardoned him.',
  },
  'hist-han-zhaohou': {
    zh: '韓國國君。任用申不害變法,韓國中興十五年。',
    en: 'Marquis Zhao of Han. He raised Shen Buhai to lead the reforms, and Han was restored for fifteen years.',
  },
  'hist-han-xiangwang': {
    zh: '韓國國君。在位二十三年。中原合縱抗秦時,韓襄王屢與秦戰,皆敗。',
    en: 'King Xiang of Han. Twenty-three years he reigned. In the days of the Vertical Alliance against Qin he fought Qin many times and lost each time.',
  },
  'hist-chu-kaolie': {
    zh: '楚國國君。在位二十五年。任用春申君為令尹。其後因春申君獻李園之妹生太子,引李園之亂。',
    en: 'King Kaolie of Chu. Twenty-five years he reigned, with Chunshen-jun as chancellor. When Chunshen-jun presented Li Yuan\'s sister, who bore the crown prince, the Li Yuan revolt followed.',
  },
  'hist-chu-qingxiang': {
    zh: '楚國國君。屈原所事之主。聽信讒言,放逐屈原。後秦伐楚,失國而走,卒於陳。',
    en: 'King Qingxiang of Chu — the king whom Qu Yuan served. Hearing slander, he exiled Qu Yuan. Later Qin came against Chu; he lost the land and fled, dying at Chen.',
  },
  'hist-chu-weiwang': {
    zh: '楚國國君。任用昭陽為令尹,楚國強盛。位至「諸侯之長」。',
    en: 'King Wei of Chu. He raised Zhao Yang as chancellor, and Chu was strong, with the title "head of the lords."',
  },
  'hist-chu-zhaowang': {
    zh: '楚國國君。吳師入郢,楚昭王奔隨。後申包胥哭秦庭,秦師救楚,昭王還國,中興楚室。',
    en: 'King Zhao of Chu. When the Wu army entered Ying he fled to Sui. After Shen Baoxu wept at the Qin court, the Qin army came to relieve Chu; King Zhao returned and restored his house.',
  },
  'hist-chu-daowang': {
    zh: '楚國國君。在位二十一年。任吳起變法,楚國強盛。卒,貴族圍攻吳起,吳起伏屍王屍上,中箭而死,變法亦廢。',
    en: 'King Dao of Chu. Twenty-one years he reigned. He raised Wu Qi to reform the state, and Chu was strong. At his death the nobles surrounded Wu Qi; Wu Qi flung himself across the king\'s body and died under arrows — and the reforms were undone.',
  },
  'hist-tian-qi': {
    zh: '齊國將。田齊宗室。從田忌,後因鄒忌之讒奔楚。',
    en: 'A general of Qi, of the Tian-Qi house. He marched with Tian Ji; through Zou Ji\'s slander he fled to Chu.',
  },
  'hist-zhao-liehou': {
    zh: '趙國國君,趙烈侯。在位九年。任用公仲連等賢臣,趙國始強。',
    en: 'Marquis Lie of Zhao. Nine years he reigned. He raised Gongzhong Lian and other worthies — and Zhao first grew strong.',
  },
  // Qin (the dynasty)
  'hist-meng-wu': {
    zh: '秦國名將。蒙驁之子,蒙恬、蒙毅之父。從王翦伐楚,有功。',
    en: 'A famed Qin general, son of Meng Ao, father of Meng Tian and Meng Yi. With Wang Jian he marched on Chu with credit.',
  },
  'hist-wang-li': {
    zh: '秦國名將。王翦之孫,王賁之子。鉅鹿之戰被項羽所擒,被殺。秦三世名將,至此而絕。',
    en: 'A famed Qin general. Grandson of Wang Jian, son of Wang Ben. At Julu he was taken by Xiang Yu and killed. Three generations of Wang generals ended with him.',
  },
  'hist-feng-jie': {
    zh: '秦國右丞相。秦始皇崩後,趙高、李斯矯詔,馮去疾、馮劫憤而自殺。',
    en: 'Right Chancellor of Qin. After the First Emperor died and Zhao Gao with Li Si forged the edict, Feng Quji and his son Feng Jie in fury killed themselves.',
  },
  'hist-feng-quji': {
    zh: '秦國右丞相,馮劫之父。秦二世時與李斯共諫,被囚,自殺。',
    en: 'Right Chancellor of Qin, father of Feng Jie. Under the Second Emperor he remonstrated with Li Si; imprisoned, he killed himself.',
  },
  'hist-feng-jing': {
    zh: '秦國名將。事始皇,屢從征戰。',
    en: 'A famed Qin general; he served the First Emperor in many campaigns.',
  },
  'hist-wang-wan': {
    zh: '秦始皇丞相。主分封制,與李斯主郡縣制相爭,始皇用李斯之策。',
    en: 'Chancellor of the First Emperor of Qin. He urged the feudatory system against Li Si\'s commandery system; the emperor took Li Si\'s plan.',
  },
  'hist-wei-liao': {
    zh: '魏國大梁人。秦始皇尉繚。獻計散財賄賂六國權貴,以亂其政,助秦掃六合。著《尉繚子》兵法。',
    en: 'Of Daliang in Wei. Marshal Liao of the First Emperor of Qin. He gave the counsel of scattering wealth to bribe the nobles of the six states and throw their courts into chaos — helping Qin sweep them. He wrote the Marshal Liao Bingfa.',
  },
  'hist-neishi-teng': {
    zh: '秦國內史。秦始皇十七年率兵滅韓,六國之第一個滅亡。',
    en: 'Intendant of the Capital under Qin. In 230 BCE he led the troops that destroyed Han — the first of the six states to fall.',
  },
  'hist-li-you': {
    zh: '李斯之子。秦三川郡守。陳勝起義,吳廣攻三川,李由戰死。',
    en: 'Son of Li Si, Governor of the Sanchuan commandery. When Chen Sheng rose and Wu Guang attacked Sanchuan, Li You died fighting.',
  },
  'hist-han-tan': {
    zh: '秦國將。從王翦滅楚,有戰功。',
    en: 'A Qin general; with Wang Jian he marched against Chu with credit.',
  },
  'hist-zhao-tuo': {
    era: { zh: '南越王', en: 'King of Nanyue' },
    zh: '真定人。秦末南海尉。秦亡,趙佗自立為南越武王,據嶺南九十三年。漢初與漢和親,稱臣。壽過百歲。',
    en: 'Of Zhending. Commandant of Nanhai at the end of Qin. When Qin fell, Zhao Tuo set himself up as Martial King of Nanyue and held Lingnan for ninety-three years. In early Han he made peace and submitted as vassal. He lived past a hundred.',
  },
  'hist-zheng-guo': {
    zh: '韓國水工。韓國恐秦攻韓,使鄭國至秦獻策修水渠,以耗秦力。秦始皇納其策,築鄭國渠,引涇水溉田四萬餘頃。後韓國本意被覺,秦始皇欲殺之,鄭國曰:「臣為韓延數歲之命,而為秦建萬世之功!」 秦始皇赦之,渠成,關中沃野千里,秦更強。',
    en: 'A water engineer of Han. Fearing Qin, Han sent Zheng Guo to Qin to propose building a great canal — to drain Qin\'s strength. The First Emperor took the plan; the Zheng Guo Canal was built, leading the Jing River to water forty thousand qing of fields. When the Han design was found out and the emperor would have killed him, Zheng Guo said: "Your servant has bought a few more years for Han, and built ten-thousand-generation merit for Qin!" The emperor pardoned him; the canal was finished, and Guanzhong became a thousand li of rich land — Qin grew stronger.',
  },
  'hist-sima-xin': {
    zh: '秦將。鉅鹿之戰後,司馬欣與章邯共降項羽,封塞王。後降漢,項羽伐齊,司馬欣再叛,被劉邦所斬。',
    en: 'A Qin general. After Julu he submitted to Xiang Yu with Zhang Han and was made King of Sai. He later submitted to Han; when Xiang Yu marched on Qi, Sima Xin rose again, and Liu Bang beheaded him.',
  },
  'hist-yin-tong': {
    zh: '秦會稽郡守。項梁、項羽於會稽舉兵,殷通先發於項梁,項梁斬之以奪其兵權。',
    en: 'Governor of Kuaiji under Qin. When Xiang Liang and Xiang Yu raised troops at Kuaiji, Yin Tong moved first against Xiang Liang; Xiang Liang beheaded him and seized his command.',
  },
  // Western Han additions
  'hist-lou-jing': {
    era: { zh: '婁敬', en: 'Lou Jing' },
    zh: '齊人。漢初獻策劉邦遷都關中,賜姓劉。又獻和親匈奴之策,定漢匈百年之大計。',
    en: 'Of Qi. In early Han he gave Liu Bang the counsel of moving the capital to Guanzhong, and was granted the surname Liu. He also gave the plan of marriage-alliance with the Xiongnu — the great hundred-year design between Han and Xiongnu.',
  },
  'hist-xiao-wangzhi': {
    zh: '字長倩,東海人。漢宣帝、元帝兩朝大臣。直言敢諫,屢忤宦官石顯。後被石顯構陷,自殺。',
    en: 'Style Changqian, of Donghai. A great minister of Emperors Xuan and Yuan of Han. Straight of speech, he often clashed with the eunuch Shi Xian. Framed at last by Shi Xian, he killed himself.',
  },
  'hist-han-yanshou': {
    zh: '字長公,燕人。漢宣帝時潁川太守。性嚴明,有政治才能。為京兆尹,與蕭望之相爭,被誣賜死。',
    en: 'Style Changgong, of Yan. Governor of Yingchuan under Emperor Xuan of Han. Stern and clear; of political talent. As Intendant of the metropolitan region he clashed with Xiao Wangzhi; framed, he was given a draught of death.',
  },
  'hist-zhao-guanghan': {
    zh: '字子都,涿郡蠡吾人。漢宣帝時京兆尹。執法嚴明,豪強斂手。後因事被誣,腰斬於市,百姓號哭數萬人。',
    en: 'Style Zidu, of Liwu in Zhuojun. Intendant of the metropolitan region under Emperor Xuan of Han. Strict in the law, the great houses drew in their hands. Later framed and cut in two at the waist, tens of thousands of the people wept aloud.',
  },
  'hist-wei-xuancheng': {
    zh: '魏相之子。事漢元帝為丞相。性溫和,以儉約名。',
    en: 'Son of Wei Xiang. Under Emperor Yuan of Han he was chancellor. Mild in temper, known for frugality.',
  },
  'hist-zheng-ji': {
    zh: '字翁孫,會稽山陰人。漢宣帝時西域都護。屯田渠犁,定西域日逐王,封安遠侯。漢西域第一任都護。',
    en: 'Style Wengsun, of Shanyin in Kuaiji. Protector-General of the Western Regions under Emperor Xuan of Han. He set up agricultural colonies at Quli and pacified the Rizhu King of the western lands; made Marquis of Anyuan — the first Protector-General of the Western Regions for Han.',
  },
  'hist-zhu-fu': {
    zh: '漢初辯士。事齊王劉肥。',
    en: 'A diviner of early Han, who served King Liu Fei of Qi.',
  },
  'hist-zhu-bo': {
    zh: '漢成帝時大臣。性剛直,屢諫不阿。',
    en: 'A great minister under Emperor Cheng of Han. Stiff and upright, he remonstrated without flattery.',
  },
  'hist-zhai-fangjin': {
    zh: '字子威,汝南上蔡人。漢成帝丞相。少貧苦,以才學自顯。為相九年,以執法嚴明稱。後因日食上書自責,服毒自殺。',
    en: 'Style Ziwei, of Shangcai in Runan. Chancellor of Emperor Cheng of Han. Poor in youth, he made himself by talent and learning. Nine years he was chancellor, known for strict law. After a solar eclipse he sent up a memorial of self-blame and took poison to die.',
  },
  'hist-wang-jia': {
    zh: '字公仲,平陵人。漢哀帝丞相。直言敢諫,反對哀帝寵董賢,被下獄絕食而死。',
    en: 'Style Gongzhong, of Pingling. Chancellor of Emperor Ai of Han. Straight of speech, he stood against the emperor\'s dotage on Dong Xian, was thrown in prison, and starved himself to death.',
  },
  'hist-shao-xinchen': {
    zh: '字翁卿,九江壽春人。漢宣帝時南陽太守。興水利,廣灌田,百姓富庶,號「召父」(後與漢光武時杜詩齊名「召父杜母」)。',
    en: 'Style Wengqing, of Shouchun in Jiujiang. Governor of Nanyang under Emperor Xuan of Han. He raised the waterworks and broadened irrigation, and the people grew rich — called "Father Shao" (with Du Shi of Eastern Han later "Father Shao and Mother Du").',
  },
  'hist-du-shi': {
    zh: '字君公,河內汲人。東漢光武帝時南陽太守。發明水排,用水力鼓風冶鐵,中華冶鐵之大革新。百姓號為「杜母」,與西漢召信臣並稱「召父杜母」。',
    en: 'Style Jungong, of Ji in Henei. Governor of Nanyang under Emperor Guangwu of the Eastern Han. He invented the water-bellows, using water power to blow air for iron-smelting — a great revolution in Chinese metallurgy. The people called him "Mother Du" and with Shao Xinchen of the Western Han made "Father Shao and Mother Du."',
  },
  'hist-ren-yan': {
    zh: '字長孫,南陽宛人。東漢光武帝時九真太守。在郡四年,興水利,教民耕織,夷漢咸服。',
    en: 'Style Zhangsun, of Wan in Nanyang. Governor of Jiuzhen under Emperor Guangwu of the Eastern Han. Four years he held the commandery, raised the waterworks, taught the people to plough and weave — barbarian and Han alike yielded.',
  },
  'hist-geng-chun': {
    zh: '字伯山,鉅鹿宋子人。東漢光武帝二十八將之一。從征戰立功,封東光侯。',
    en: 'Style Boshan, of Songzi in Julu. One of the Twenty-Eight Cloud Terrace Generals of Emperor Guangwu of the Eastern Han. He marched and won credit, made Marquis of Dongguang.',
  },
  // ─── 歷代名將 新增第十三批 (Historical biographies — batch 13: Jin / S-N / Sui / Tang) ───
  // Jin
  'hist-sima-rui': {
    era: { zh: '晉元帝', en: 'Emperor Yuan of Jin' },
    zh: '字景文,司馬覲之子。西晉末南渡,於建康即位,建東晉。王導輔之,「王與馬,共天下」。在位六年崩,壽四十七。',
    en: 'Style Jingwen, son of Sima Jin. At the end of Western Jin he crossed south, took the throne at Jiankang, and founded Eastern Jin. With Wang Dao as regent — "Wang and Sima share the realm." Six years he reigned and died at forty-seven.',
  },
  'hist-sima-shao': {
    era: { zh: '晉明帝', en: 'Emperor Ming of Jin' },
    zh: '字道畿,司馬睿長子。性聰穎,有大略。在位三年,平王敦之亂,東晉得以維持。年二十七早卒。',
    en: 'Style Daoji, eldest son of Sima Rui. Sharp and bold in counsel. Three years he reigned; he put down Wang Dun\'s revolt and Eastern Jin held. He died young at twenty-seven.',
  },
  'hist-sima-yue': {
    zh: '東海王,司馬泰之子。八王之亂中最後勝者。挾持惠帝,專權數年。後憂憤而卒。',
    en: 'Prince of Donghai, son of Sima Tai. The last victor of the War of Eight Princes. He held Emperor Hui and ruled for several years, then died of grief and rage.',
  },
  'hist-sima-wei': {
    zh: '楚王,武帝之子。八王之亂中早期參與者。矯詔殺司馬亮、衛瓘,後賈后又以矯詔之罪殺之。',
    en: 'Prince of Chu, son of Emperor Wu. An early actor in the War of Eight Princes. By forged edict he killed Sima Liang and Wei Guan; Empress Jia then killed him for the same crime of forgery.',
  },
  'hist-sima-teng': {
    zh: '東贏公。司馬越之弟。鎮鄴,後敗於石勒。',
    en: 'Duke of Dongying, younger brother of Sima Yue. He held Ye and was later broken by Shi Le.',
  },
  'hist-sima-dewen': {
    era: { zh: '晉恭帝', en: 'Emperor Gong of Jin' },
    zh: '東晉末代皇帝。劉裕篡晉,廢為零陵王,旋鴆殺之,東晉遂亡。',
    en: 'Last emperor of Eastern Jin. When Liu Yu took the Jin throne, he was reduced to Prince of Lingling and soon poisoned — and Eastern Jin was ended.',
  },
  'hist-sima-dezong': {
    era: { zh: '晉安帝', en: 'Emperor An of Jin' },
    zh: '東晉皇帝。性愚鈍,寒暑不知。在位二十二年,實權盡操於桓玄、劉裕。後為劉裕所縊,立其弟司馬德文。',
    en: 'Emperor of Eastern Jin. So dull he could not tell heat from cold. Twenty-two years he reigned, all real power in Huan Xuan and Liu Yu. Liu Yu later strangled him and set up his brother Sima Dewen.',
  },
  'hist-wang-dun': {
    zh: '字處仲,琅琊臨沂人,王導從兄。東晉初權臣。鎮荊州,後反晉,圍建康,逼晉元帝憂憤而卒。後欲再叛,病死於軍中,夷其族。',
    en: 'Style Chuzhong, of Linyi in Langya, cousin of Wang Dao. A great power-holder in early Eastern Jin. He held Jingzhou, then rose against Jin, besieged Jiankang, and forced Emperor Yuan to die of grief and rage. Meaning to rise again, he died of illness in camp; his clan was exterminated.',
  },
  'hist-tao-kan': {
    era: { zh: '陶侃搬磚', en: 'Tao Kan and the Bricks' },
    zh: '字士行,潯陽人。東晉名將。少時即勤,日搬磚百塊以勵志。鎮荊州、廣州,平蘇峻之亂,東晉柱石。卒,贈大司馬。',
    en: 'Style Shixing, of Xunyang. A famed Eastern Jin general. Diligent from youth — daily he moved a hundred bricks to spur himself on. Holding Jingzhou and Guangzhou, he put down Su Jun\'s revolt — a pillar of Eastern Jin. At his death he was granted the title Grand Marshal.',
  },
  'hist-su-jun': {
    zh: '東晉初武將。鎮歷陽,後反晉,陷建康。陶侃、溫嶠合力討之,蘇峻戰死。',
    en: 'A military man of early Eastern Jin. Holding Liyang, he rose against Jin and took Jiankang. Tao Kan and Wen Jiao together put him down; Su Jun died in battle.',
  },
  'hist-ruan-ji': {
    era: { zh: '竹林七賢', en: 'One of the Seven Sages of the Bamboo Grove' },
    zh: '字嗣宗,陳留尉氏人,阮瑀之子。竹林七賢之首。喜長嘯,能青白眼,凡所惡者以白眼相向,所善者以青眼。著《詠懷詩》,寄意深遠,千古傳誦。',
    en: 'Style Sizong, of Weishi in Chenliu, son of Ruan Yu. First of the Seven Sages of the Bamboo Grove. He loved to whistle long and could turn the eye to dark or pale — those he disliked got the pale eye, those he loved the dark. His Songs of My Heart, deep in meaning, are read to this day.',
  },
  'hist-ruan-xian': {
    zh: '字仲容,阮籍之姪。竹林七賢之一。以琴名世,創阮咸樂器。性放達,與群豬共飲於甕。',
    en: 'Style Zhongrong, nephew of Ruan Ji. One of the Seven Sages of the Bamboo Grove, famed as a qin master, creator of the ruanxian lute. So free in spirit he once drank from a wine-vat with a herd of pigs.',
  },
  'hist-shan-tao': {
    zh: '字巨源,河內懷縣人。竹林七賢之一。事司馬氏,位至司徒。嵇康臨刑,以子託之,曰:「巨源在,汝不孤矣。」',
    en: 'Style Juyuan, of Huai county in Henei. One of the Seven Sages. He served the Sima house and rose to Excellency over the Masses. Before going to the block, Ji Kang entrusted his son to him: "While Juyuan lives, you shall not be orphaned."',
  },
  'hist-liu-ling': {
    zh: '字伯倫,沛國人。竹林七賢之一。好酒。常坐鹿車,攜一壺酒,使人荷鋤隨之,曰:「死便埋我!」 著《酒德頌》。',
    en: 'Style Bolun, of Pei. One of the Seven Sages. Fond of wine — he would ride out in a deer-cart with a jar of wine, a servant with a spade behind him: "If I die, bury me where I fall!" The Praise of the Virtue of Wine is his.',
  },
  'hist-shan-jian': {
    zh: '山濤之子。事司馬氏,鎮襄陽。性嗜酒。「日夕傾倒載歸來」之語出此。',
    en: 'Son of Shan Tao. He served the Sima house and held Xiangyang. Fond of drink — "day and night he comes home tipping over" comes from him.',
  },
  'hist-shi-hu': {
    era: { zh: '後趙石虎', en: 'Shi Hu of Later Zhao' },
    zh: '後趙第三代皇帝。石勒之姪。性殘暴。在位十四年,大興土木,百姓不堪。卒,諸子相殘,後趙遂亡。',
    en: 'Third emperor of the Later Zhao, nephew of Shi Le. Of cruel temper. Fourteen years he reigned, raising great works of building, and the people could not bear it. At his death his sons devoured each other, and the Later Zhao fell.',
  },
  'hist-liu-kun': {
    era: { zh: '聞雞起舞', en: 'Roused at the Cock\'s Crow' },
    zh: '字越石,中山魏昌人。西晉名將。與祖逖少年知交,共處一床,夜半聞雞鳴,起而舞劍,以勵志。鎮幷州,以孤軍拒匈奴漢國十年。後段匹磾構陷,被害,年四十八。',
    en: 'Style Yueshi, of Weichang in Zhongshan. A famed general of Western Jin. In youth he and Zu Ti slept in one bed; when the cock crowed they rose and danced with the sword. He held Bing province with one lone force against the Han-Xiongnu for ten years. Duan Pidi later framed him; he died at forty-eight.',
  },
  'hist-zhou-yi': {
    zh: '字伯仁,汝南安成人。東晉名臣。性磊落,飲酒過度,號「三日僕射」。王敦之亂,被王敦所殺。臨終曰:「殺我者,孤負伯仁也!」',
    en: 'Style Boren, of Ancheng in Runan. A famed minister of Eastern Jin. Open and bold in temper, fond of wine — they called him "the Three-Day Vice Director." In Wang Dun\'s revolt Wang Dun killed him. His last words: "He who killed me has failed Boren!"',
  },
  'hist-zhou-chu': {
    era: { zh: '改過自新', en: 'Reformed Man' },
    zh: '字子隱,義興陽羡人,周魴之子。少時凶橫,鄉里以南山虎、長橋蛟、周處並稱三害。後悟,獨殺虎斬蛟,折節讀書,終為晉名將。元康七年從夏侯駿征齊萬年,孤軍力戰而死。',
    en: 'Style Ziyin, of Yangxian in Yixing, son of Zhou Fang. In his wild youth the countryside named "Three Evils": the tiger of the southern hills, the dragon of the long bridge, and Zhou Chu. He awakened, slew the tiger and dragon, bent his neck to study, and rose to be a famed general of Jin. In 297 he campaigned with Xiahou Jun against Qi Wannian; left alone he fought to the death.',
  },
  'hist-yin-hao': {
    era: { zh: '咄咄怪事', en: '"How Strange!"' },
    zh: '字深源,陳郡長平人。東晉名士。北伐失敗,被廢為庶人。終日書空作字「咄咄怪事」,千古傳為俗語。',
    en: 'Style Shenyuan, of Changping in Chenjun. A famed gentleman of Eastern Jin. After his northern campaign failed he was reduced to commoner. All day he wrote in the air the words "How strange! How strange!" — a saying for the ages.',
  },
  'hist-he-zeng': {
    zh: '字穎考,陳國陽夏人。西晉宰相。性奢侈,日食萬錢,猶曰「無下箸處」。位至太尉。',
    en: 'Style Yingkao, of Yangxia in Chen. A Western Jin chancellor. So extravagant that he spent ten thousand cash a day on his table and still said "there is nowhere to lay the chopsticks." He rose to Grand Marshal.',
  },
  // Southern-Northern Dynasties
  'hist-tan-daoji': {
    era: { zh: '檀公三十六策', en: 'Tan\'s Thirty-Six Strategies' },
    zh: '南朝劉宋名將。北伐有功,世稱「檀公三十六策,走為上計」,即「三十六計,走為上策」之祖。後為宋文帝所忌,被殺。臨刑投幘於地,瞋目而立曰:「乃壞汝萬里長城!」',
    en: 'A famed general of Liu Song in the Southern Dynasties. He had merit in the northern campaigns; the saying ran "Lord Tan\'s thirty-six strategies — running away is the best" — ancestor of "the thirty-six stratagems, running away is the best." Later distrusted by Emperor Wen of Song he was killed. At the block he flung his headcloth to the ground, glared, and said: "So you wreck your own Ten-Thousand-Li Wall!"',
  },
  'hist-shen-yue': {
    zh: '字休文,吳興武康人。南朝齊梁間史學家、文學家。著《宋書》一百卷,記劉宋一朝。又創「四聲八病」之說,中國音韻學之祖。',
    en: 'Style Xiuwen, of Wukang in Wuxing. A historian and writer of the Southern Qi and Liang. He wrote the Book of Song in a hundred fascicles, recording the Liu Song. He also propounded the doctrine of the "Four Tones and Eight Faults" — an ancestor of Chinese phonology.',
  },
  'hist-tuoba-jun': {
    era: { zh: '北魏文成帝', en: 'Emperor Wencheng of Northern Wei' },
    zh: '北魏第五代皇帝。十三歲嗣位。在位十四年,任陸麗,平亂後復興佛教,造雲岡石窟。',
    en: 'Fifth emperor of Northern Wei. Took the throne at thirteen. Fourteen years he reigned, raising Lu Li; after the chaos he revived Buddhism and ordered the carving of the Yungang Grottoes.',
  },
  'hist-tuoba-si': {
    era: { zh: '北魏明元帝', en: 'Emperor Mingyuan of Northern Wei' },
    zh: '北魏第二代皇帝。拓跋珪之子。在位十五年。鎮南北方,定柔然之亂。',
    en: 'Second emperor of Northern Wei, son of Tuoba Gui. Fifteen years he reigned, holding north and south and settling the Rouran revolt.',
  },
  'hist-yuwen-shenju': {
    zh: '北周名將。隨周武帝滅北齊,功冠群臣。後事周宣帝,被讒被殺。',
    en: 'A famed general of Northern Zhou. With Emperor Wu he ended Northern Qi, his merit above all. Under Emperor Xuan, slander brought him death.',
  },
  'hist-yuwen-yu': {
    era: { zh: '北周明帝', en: 'Emperor Ming of Northern Zhou' },
    zh: '北周第二代皇帝。宇文泰之子。在位三年,被宇文護所毒殺。',
    en: 'Second emperor of Northern Zhou, son of Yuwen Tai. Three years he reigned and was poisoned by Yuwen Hu.',
  },
  'hist-dugu-xin': {
    era: { zh: '三朝國丈', en: 'Three-Dynasty Imperial Father-in-Law' },
    zh: '字期彌頭,雲中人。西魏、北周名將。性風流,容貌絕世。三女皆為皇后:長女北周明敬后,四女唐元貞皇后(李淵之母),七女隋文獻皇后。中華歷史唯一三朝國丈。',
    en: 'Style Qimitou, of Yunzhong. A famed general of Western Wei and Northern Zhou. Of dashing bearing and unmatched looks. Three of his daughters became empresses: the eldest Empress Mingjing of Northern Zhou, the fourth Empress Yuanzhen of Tang (mother of Li Yuan), the seventh Empress Wenxian of Sui — the only man in Chinese history to be imperial father-in-law of three dynasties.',
  },
  'hist-hulu-guang': {
    zh: '北齊名將。出身行伍,善射,號「落雕都督」。鎮邊禦北周,以一戰之威使北周不敢南顧。後周武帝離間之,北齊後主誅之,北齊由是衰。',
    en: 'A famed general of Northern Qi. Born to the ranks, a master archer — "the Falcon-Felling Commandant." Holding the border against Northern Zhou, by his name alone he kept Zhou from looking south. Emperor Wu of Zhou sowed slander, the last emperor of Qi killed him, and Northern Qi declined from there.',
  },
  'hist-wu-mingche': {
    zh: '陳朝名將。鎮淮南,北伐北齊有功,後北伐北周失敗,被擒,終於長安。',
    en: 'A famed general of Chen. Holding Huainan he marched against Northern Qi with credit, then marched against Northern Zhou and failed; taken, he ended his days at Chang\'an.',
  },
  'hist-yang-dayan': {
    era: { zh: '萬人敵', en: '"Match for Ten Thousand"' },
    zh: '北魏名將,鮮卑族。武勇絕倫,有「萬人敵」之號。屢從魏軍南征北討,所向披靡。',
    en: 'A famed Xianbei general of Northern Wei. Of unmatched prowess — "match for ten thousand." He marched in many of Wei\'s campaigns and none stood before him.',
  },
  'hist-xiao-gang': {
    era: { zh: '梁簡文帝', en: 'Emperor Jianwen of Liang' },
    zh: '蕭衍三子。昭明太子早卒,立蕭綱為太子。後梁武帝餓死台城,蕭綱即位,旋為侯景所殺。',
    en: 'Third son of Xiao Yan. After Crown Prince Zhaoming died young, Xiao Gang was set up. When Emperor Wu starved to death at Taicheng, Xiao Gang took the throne — and Hou Jing killed him soon after.',
  },
  'hist-xiao-ziliang': {
    zh: '南齊竟陵王。蕭道成之孫。喜文學,招集學者,號「竟陵八友」(沈約、謝朓、王融、范雲、蕭衍、蕭琛、任昉、陸倕)。',
    en: 'Prince of Jingling of Southern Qi, grandson of Xiao Daocheng. Fond of letters, he gathered scholars — the "Eight Friends of Jingling" (Shen Yue, Xie Tiao, Wang Rong, Fan Yun, Xiao Yan, Xiao Chen, Ren Fang, Lu Chui).',
  },
  'hist-yang-zhong': {
    zh: '字揜于,弘農華陰人。隋文帝楊堅之父。西魏、北周名將。封隨國公,卒後追封太祖武元皇帝。',
    en: 'Style Yanyu, of Huayin in Hongnong. Father of Yang Jian of Sui. A famed general of Western Wei and Northern Zhou. Made Duke of Sui; after his death honored as the founding Emperor Wuyuan.',
  },
  'hist-shen-qingzhi': {
    zh: '南朝劉宋名將。出身寒微,從征戰立功,鎮雍州,北伐有功。卒於官。',
    en: 'A famed Liu Song general. Of humble birth, he rose by war, held Yongzhou, and earned credit in the northern campaigns. He died in office.',
  },
  'hist-su-chuo': {
    zh: '字令綽,京兆武功人。西魏名臣。佐宇文泰行府兵制、立六條詔書,為西魏、北周強盛之本。卒於宇文泰之先。',
    en: 'Style Lingchuo, of Wugong in the metropolitan region. A famed minister of Western Wei. With Yuwen Tai he set up the Garrison Militia and the Six-Item Edicts — the foundation of the rise of Western Wei and Northern Zhou. He died before Yuwen Tai.',
  },
  'hist-liu-yilong': {
    era: { zh: '宋文帝', en: 'Emperor Wen of Liu Song' },
    zh: '劉裕三子。在位三十年,「元嘉之治」,劉宋最盛之時。後被太子劉劭所弒。',
    en: 'Third son of Liu Yu. Thirty years he reigned — the "Reign of Yuanjia," the height of Liu Song. He was killed by the Crown Prince Liu Shao.',
  },
  // Sui
  'hist-he-ruobi': {
    era: { zh: '隋平陳第一功', en: 'First Credit of the Sui Conquest of Chen' },
    zh: '字輔伯,河南洛陽人。隋朝大將。平陳之役,與韓擒虎分軍渡江,首破陳軍於蔣山,生擒陳將魯廣達。封宋國公。後與賀若諼共謗朝廷,被煬帝所殺。',
    en: 'Style Fubo, of Luoyang in Henan. A great general of Sui. In the conquest of Chen, with Han Qinhu he divided the host across the river and first broke the Chen army at Mount Jiang, taking the Chen general Lu Guangda alive. Made Duke of Song. Later, with He Ruoxuan, he slandered the court and Emperor Yang killed him.',
  },
  'hist-mai-tiezhang': {
    zh: '隋朝名將。號「鐵杖」。從楊素征戰,以勇悍稱。後從楊廣征高句麗,於遼水之戰中,死戰殿後,壯烈犧牲。',
    en: 'A famed general of Sui, called "Iron-Staff." Under Yang Su he marched with credit, known for fierceness. He marched with Yang Guang against Goguryeo and at the Liao River fought to the death covering the rearguard, falling in glory.',
  },
  'hist-shi-wansui': {
    era: { zh: '萬歲', en: 'Ten Thousand Years' },
    zh: '隋朝名將。京兆櫟陽人。從楊素破突厥達頭可汗,大破之。後為楊素所讒,被煬帝所殺。其名「萬歲」千古傳為佳話。',
    en: 'A famed general of Sui, of Liyang in the metropolitan region. With Yang Su he broke the Türk Tardu Khan utterly. Later slandered by Yang Su, Emperor Yang killed him. His personal name "Ten Thousand Years" rang down the ages.',
  },
  'hist-zhang-xutuo': {
    zh: '隋末名將。鎮齊郡,屢破瓦崗、群盜,為隋朝末年柱石。後於滎陽之戰,中李密之伏,大敗,自殺。',
    en: 'A famed general of late Sui. Holding Qijun, he broke the Wagang and the bandit hosts many times — a pillar at the end of Sui. At Xingyang he walked into Li Mi\'s ambush, was broken, and killed himself.',
  },
  'hist-empress-xiao': {
    zh: '蕭岿之女,隋煬帝皇后。江都之變後,被宇文化及挾持,後落入竇建德之手,再入突厥。唐太宗滅突厥,迎其歸長安,以禮待之。',
    en: 'Daughter of Xiao Kui, empress of Yang Guang of Sui. After the Jiangdu mutiny she was held by Yuwen Huaji, then fell to Dou Jiande, then to the Türks. When Taizong of Tang destroyed the Türks he brought her back to Chang\'an and received her with rite.',
  },
  'hist-yang-tong': {
    zh: '隋煬帝之孫。煬帝被弒後,王世充立為皇帝,旋廢之鴆殺。',
    en: 'Grandson of Yang Guang of Sui. After Yang Guang was killed, Wang Shichong set him on the throne and soon deposed and poisoned him.',
  },
  'hist-pei-ju': {
    zh: '字弘大,聞喜人。隋朝重臣。出使西域,著《西域圖記》三卷。後事唐,任民部尚書。',
    en: 'Style Hongda, of Wenxi. A great minister of Sui. Sent as envoy to the Western Regions, he wrote the Illustrated Record of the Western Regions in three fascicles. He later served Tang as Minister of Civil Administration.',
  },
  'hist-su-wei': {
    zh: '字無畏,京兆武功人。隋朝重臣。與高熲、楊素、賀若弼並稱「四貴」。事文帝、煬帝,屢有諫言。煬帝怒,黜為庶人。',
    en: 'Style Wuwei, of Wugong in the metropolitan region. A great minister of Sui, with Gao Jiong, Yang Su, and He Ruobi the "Four Nobles." Under Wendi and Yangdi he often remonstrated; Yangdi in fury reduced him to commoner.',
  },
  // Tang
  'hist-li-xiaogong': {
    zh: '唐宗室。隨李靖平蕭銑、輔公祏,功冠群臣。封河間郡王。凌煙閣二十四功臣之一。',
    en: 'A kinsman of the Tang house. With Li Jing he pacified Xiao Xian and Fu Gongshi, his merit above all. Made Prince of Hejian commandery. One of the Twenty-Four Meritorious Officers of the Lingyan Pavilion.',
  },
  'hist-li-daozong': {
    zh: '唐宗室。從李世民征戰,有功。封江夏王。後為長孫無忌所構,流象州而卒。',
    en: 'A kinsman of the Tang house. He marched with Li Shimin with credit, made Prince of Jiangxia. Later framed by Zhangsun Wuji, he was exiled to Xiangzhou and died.',
  },
  'hist-li-su': {
    era: { zh: '雪夜入蔡州', en: 'Snowy Night into Caizhou' },
    zh: '字符直,洮州臨潭人。中唐名將。元和十二年雪夜入蔡州,生擒淮西節度使吳元濟,平淮西之亂,功冠唐朝中興。封涼國公。卒年四十九。',
    en: 'Style Yuanzhi, of Lintan in Taozhou. A famed mid-Tang general. In a snowy night of 817 he marched into Caizhou and took alive Wu Yuanji, Military Governor of Huaixi — pacifying Huaixi, his merit above the Tang restoration. Made Duke of Liang. He died at forty-nine.',
  },
  'hist-li-tai': {
    zh: '唐太宗第四子。封魏王。與太子李承乾爭嫡,事敗,被貶為東萊郡王。',
    en: 'Fourth son of Taizong, Prince of Wei. He contested the heirship with Crown Prince Li Chengqian; broken, he was reduced to Prince of Donglai commandery.',
  },
  'hist-li-xian': {
    era: { zh: '章懷太子', en: 'Crown Prince Zhanghuai' },
    zh: '唐高宗第六子,武則天之子。立為太子。性聰穎,為《後漢書》作注。後被武則天廢為庶人,流巴州,被逼自殺,年三十一。',
    en: 'Sixth son of Gaozong, born of Wu Zetian. Made crown prince. Sharp in mind, he annotated the Book of the Later Han. Wu Zetian later reduced him to commoner, exiled him to Bazhou, and forced him to take his own life at thirty-one.',
  },
  'hist-empress-wei': {
    zh: '唐中宗皇后韋氏。中宗復位後,韋后臨朝預政,欲效武則天。後被李隆基(玄宗)發動唐隆政變所殺,夷其黨。',
    en: 'Empress Wei of Emperor Zhongzong. After Zhongzong\'s restoration she took part in government, hoping to follow Wu Zetian. Li Longji (the future Emperor Xuanzong) struck in the Tanglong incident, killed her, and wiped out her faction.',
  },
  'hist-shangguan-yi': {
    zh: '字游韶,陝州陝縣人。唐高宗時宰相。性恪守禮法,反對武則天預政,被武則天構陷,夷三族。其孫女上官婉兒後為一代女才人。',
    en: 'Style Youshao, of Shaan county in Shaanzhou. A chancellor under Gaozong of Tang. Strict to the rites and against Wu Zetian\'s share in government; Wu Zetian framed him and his clan was exterminated to three branches. His granddaughter Shangguan Wan\'er would later be a talent of the age.',
  },
  'hist-wu-sansi': {
    zh: '武則天之姪。中宗時權臣,與韋后通,陷張柬之等五王。後為李隆基所殺。',
    en: 'A nephew of Wu Zetian. Under Zhongzong a great power-holder, in liaison with Empress Wei, he framed Zhang Jianzhi and the other Five Kings. Li Longji later killed him.',
  },
  'hist-wang-xuance': {
    era: { zh: '一人滅一國', en: 'One Man Destroyed a Kingdom' },
    zh: '唐使。出使天竺,值天竺大亂,新主拒絕通好,反劫王玄策。王玄策獨身脫險,北借吐蕃、泥婆羅兵八千,大破天竺,擒其王。千古「一人滅一國」之典。',
    en: 'A Tang envoy. Sent to India in a time of chaos, the new ruler refused friendship and robbed him. Wang Xuance escaped alone, borrowed eight thousand from Tibet and Nepal, broke India, and took its king alive. The model for the ages of "one man destroying a kingdom."',
  },
  'hist-gao-xianzhi': {
    era: { zh: '怛羅斯之戰', en: 'The Battle of Talas' },
    zh: '高麗人,生於唐。盛唐名將。鎮安西都護府,屢平西域諸國。天寶十年怛羅斯之戰,被大食(阿拉伯帝國)所破,中華勢力自此退出中亞,造紙術傳入西方。後安史之亂中為宦官邊令誠所讒,被殺。',
    en: 'Of Goguryeo, born under Tang. A famed High Tang general. He held the Anxi Protectorate and pacified the Western Regions many times. In 751 at Talas he was broken by the Abbasid Caliphate — China withdrew from Central Asia and papermaking passed to the west. In the An Lushan rebellion the eunuch Bian Lingcheng slandered him to death.',
  },
  'hist-feng-changqing': {
    zh: '蒲州猗氏人。盛唐名將。從高仙芝鎮安西,屢立戰功。安史之亂,守洛陽,城陷退守潼關,與高仙芝同被宦官邊令誠所讒,被殺。',
    en: 'Of Yishi in Puzhou. A famed High Tang general. With Gao Xianzhi he held Anxi with many laurels. In the An Lushan rebellion he held Luoyang; when the city fell he retreated to Tongguan and with Gao Xianzhi was slandered by Bian Lingcheng to death.',
  },
  'hist-geshu-han': {
    era: { zh: '北斗七星高,哥舒夜帶刀', en: '"The Big Dipper Hangs High, Geshu Wears the Blade at Night"' },
    zh: '突騎施部人。盛唐名將。鎮河西,屢破吐蕃。安史之亂,守潼關,中楊國忠之計出戰,大敗,被擒,降安祿山,後被安慶緒所殺。「北斗七星高,哥舒夜帶刀」千古傳誦。',
    en: 'Of the Türgesh. A famed High Tang general. Holding Hexi, he broke the Tibetans many times. In the An Lushan rebellion he held Tongguan; fooled by Yang Guozhong\'s plan he went out and was broken, taken, and yielded to An Lushan. An Qingxu later killed him. "The Big Dipper hangs high, Geshu wears the blade at night" rang forever.',
  },
  'hist-heichi-changzhi': {
    zh: '百濟人,唐高宗時降唐。在唐征突厥、吐蕃皆有功,封燕國公。後被周興所構,被武則天所殺。',
    en: 'Of Baekje, he submitted to Tang under Gaozong. In Tang\'s wars against the Türks and Tibetans he won credit, made Duke of Yan. Later framed by Zhou Xing, Wu Zetian killed him.',
  },
  'hist-fan-lihua': {
    era: { zh: '樊梨花', en: 'Fan Lihua' },
    zh: '演義人物。唐高宗時西涼女將。後降唐,嫁薛仁貴之子薛丁山。傳助唐平西涼,功著一時。',
    en: 'A figure of Romance. A western Liang woman general under Gaozong of Tang. She submitted to Tang and married Xue Dingshan, son of Xue Rengui. Tradition says she helped Tang pacify western Liang with great merit.',
  },
  'hist-zhu-ci': {
    zh: '唐德宗時藩鎮。涇原兵變後,自稱大秦皇帝,圍長安,德宗奔奉天。後李晟收復長安,朱泚被殺。',
    en: 'A military governor under Emperor De of Tang. After the Jingyuan mutiny he called himself Emperor of Great Qin, besieged Chang\'an, and the emperor fled to Fengtian. Li Sheng recovered Chang\'an and Zhu Ci was killed.',
  },
  'hist-li-jifu': {
    zh: '字弘憲,趙郡贊皇人。中唐宰相。憲宗朝主削藩,平淮西、淄青之亂,中華中興。其子即李德裕。',
    en: 'Style Hongxian, of Zanhuang in Zhaojun. A chancellor of mid-Tang. Under Xianzong he led the cutting down of military governors, pacifying Huaixi and Ziqing — the Tang restoration. His son was Li Deyu.',
  },
  'hist-liu-yuxi': {
    zh: '字夢得,洛陽人。中唐詩人。與柳宗元共倡新樂府運動。屢遭貶謫。「沉舟側畔千帆過,病樹前頭萬木春」、「東邊日出西邊雨,道是無晴卻有晴」千古絕唱。',
    en: 'Style Mengde, of Luoyang. A mid-Tang poet. With Liu Zongyuan he led the New Music Bureau movement. Sent down again and again. "Beside the sunken boat a thousand sails pass / before the sick tree ten thousand greet the spring" and "On the east, the sun shines; on the west, the rain falls / they say no sun (sentiment) — and yet there is" rang forever.',
  },
  'hist-li-heng': {
    era: { zh: '唐肅宗', en: 'Emperor Suzong of Tang' },
    zh: '玄宗第三子。安史之亂中於靈武即位,號肅宗。任郭子儀、李光弼平叛,收復長安、洛陽。在位七年崩。',
    en: 'Third son of Xuanzong. In the An Lushan rebellion he took the throne at Lingwu — Suzong. He raised Guo Ziyi and Li Guangbi to put down the revolt, recovered Chang\'an and Luoyang. Seven years he reigned and died.',
  },
  'hist-yang-yan': {
    zh: '字公南,鳳翔天興人。唐德宗朝宰相。創「兩稅法」,改革賦稅制度,中華稅制之大革新。後因奸臣構陷,被殺。',
    en: 'Style Gongnan, of Tianxing in Fengxiang. Chancellor under Emperor De of Tang. He created the Two-Taxes Law, the great revolution of Chinese tax. Framed later by wicked ministers, he was killed.',
  },
  'hist-yuan-jie': {
    zh: '字次山,河南人。中唐文學家。古文運動之先驅。著《篋中集》,選盛唐之詩。',
    en: 'Style Cishan, of Henan. A mid-Tang writer, a forerunner of the Classical Prose Movement. He compiled the Anthology from the Box, selecting the verse of the High Tang.',
  },
  'hist-yuan-zai': {
    zh: '字公輔,鳳翔岐山人。唐代宗時宰相。專權十餘年,貪贓枉法,後被代宗賜死。',
    en: 'Style Gongfu, of Qishan in Fengxiang. Chancellor under Daizong of Tang. Ten years he held power, grasping and crooked; Daizong gave him a draught of death.',
  },
  'hist-chen-zi’ang': {
    era: { zh: '前不見古人', en: '"Before Me, I See No Ancient"' },
    zh: '字伯玉,梓州射洪人。初唐詩人。古文運動先驅。「前不見古人,後不見來者,念天地之悠悠,獨愴然而涕下」千古絕唱,《登幽州台歌》出此。',
    en: 'Style Boyu, of Shehong in Zizhou. An early-Tang poet, a forerunner of the Classical Prose Movement. "Before me, I see no ancient; behind me, no one to come / I think of the vastness of heaven and earth, and alone in grief I shed tears" rang forever — from the Song on Climbing Youzhou Tower.',
  },
  // ─── 歷代名將 新增第十四批 (Historical biographies — batch 14: Late dynasties) ───
  // Five Dynasties
  'hist-li-jiqian': {
    era: { zh: '西夏始祖', en: 'Founder of the Western Xia Line' },
    zh: '党項族,夏州人。北宋初年起兵反宋,據河西。其孫李元昊正式稱帝,建西夏。',
    en: 'Of the Tangut people, of Xiazhou. In early Northern Song he rose against Song and held Hexi. His grandson Li Yuanhao formally took the title of emperor and founded the Western Xia.',
  },
  'hist-li-yuanhao': {
    era: { zh: '西夏景宗', en: 'Emperor Jingzong of Western Xia' },
    zh: '党項族李繼遷之孫。寶元元年稱帝,建大夏(西夏)。創西夏文字,行漢制。三川口、好水川、定川寨三大戰勝宋,迫宋議和。後被太子寧令哥所弒,年四十六。',
    en: 'Tangut, grandson of Li Jiqian. In 1038 he took the imperial title and founded Great Xia (Western Xia). He created the Western Xia script and applied Chinese institutions. At the Three-River Pass, Haoshui River, and Dingchuan Fort he broke the Song three times, forcing peace. His heir Ningling Ge later killed him at forty-six.',
  },
  'hist-li-maozhen': {
    zh: '唐末五代藩鎮。岐王。據關中,屢與後梁朱溫相爭。後依後唐。',
    en: 'A late-Tang and Five Dynasties military governor, King of Qi. He held Guanzhong and contested often with Zhu Wen of Later Liang, then leaned on Later Tang.',
  },
  'hist-an-zhongrong': {
    zh: '後晉時權臣。安重榮反晉,自稱「相天子」。後敗於石敬瑭,被斬。',
    en: 'A great power-holder of Later Jin. An Zhongrong rose against Jin, calling himself "Heaven\'s Helper." He was broken by Shi Jingtang and beheaded.',
  },
  'hist-sang-weihan': {
    zh: '河南洛陽人。後晉宰相。性勤儉公正。後晉亡,被亂兵所殺。',
    en: 'Of Luoyang in Henan. A Later Jin chancellor. Diligent, frugal, just. When Later Jin fell, he was killed in the mutiny.',
  },
  'hist-feng-yansi': {
    zh: '南唐後主之父李璟時宰相。詞人。著《陽春集》。「風乍起,吹皺一池春水」千古絕唱。',
    en: 'A chancellor under Li Jing, father of the Last Ruler of Southern Tang. A ci poet, of the Yangchun Collection. "A sudden gust of wind — wrinkling a pool of spring water" rang forever.',
  },
  // Song
  'hist-li-deming': {
    zh: '李繼遷之子。承父業,經營河西,為西夏建國奠定基礎。',
    en: 'Son of Li Jiqian. He carried on his father\'s work in Hexi, laying the foundation for the Western Xia.',
  },
  'hist-lu-yijian': {
    zh: '字坦夫,壽州人。北宋仁宗朝宰相。在位十年,以保守見稱。與范仲淹「慶曆新政」相對。',
    en: 'Style Tanfu, of Shouzhou. Chancellor under Renzong of Northern Song for ten years; known for conservatism, against Fan Zhongyan\'s Qingli New Policies.',
  },
  'hist-zhao-bian': {
    zh: '字閱道,衢州西安人。北宋名臣。性公正,號「鐵面御史」。後位至參知政事。',
    en: 'Style Yuedao, of Xi\'an in Quzhou. A famed Northern Song minister. Upright by nature — called the "Iron-Faced Censor." He rose to Vice Director of the Imperial Secretariat.',
  },
  'hist-zhao-ding': {
    zh: '字元鎮,解州聞喜人。南宋初年名相。輔高宗渡江,定都建康,主張抗金。後與秦檜不合,被貶死於潮州。',
    en: 'Style Yuanzhen, of Wenxi in Xiezhou. A famed early Southern Song chancellor. He helped Gaozong cross the river and set the capital at Jiankang, urging war on the Jin. Falling out with Qin Hui, he was thrust down to die at Chaozhou.',
  },
  'hist-zhao-ruyu': {
    zh: '字子直,饒州餘干人。南宋名相。發動「紹熙內禪」,擁寧宗即位。後被韓侂胄構陷,貶死於衡州。',
    en: 'Style Zizhi, of Yugan in Raozhou. A famed Southern Song chancellor. He led the Shaoxi internal abdication and set Ningzong on the throne. Han Tuozhou later framed him, and he was thrust down to die at Hengzhou.',
  },
  'hist-zhe-deyi': {
    zh: '北宋名將。折家世將,鎮西北邊疆。屢破西夏。',
    en: 'A famed Northern Song general of the Zhe house of hereditary commanders. He held the northwest border and broke the Western Xia many times.',
  },
  'hist-zhong-shiheng': {
    zh: '北宋名將。鎮西北,抗西夏。與其孫种師道、种師中世稱「種家將」。',
    en: 'A famed Northern Song general. He held the northwest against Western Xia. With his grandsons Zhong Shidao and Zhong Shizhong he formed the "Zhong family generals."',
  },
  'hist-wen-tong': {
    era: { zh: '胸有成竹', en: '"Bamboo in His Breast"' },
    zh: '字與可,梓州永泰人。北宋畫家、詩人。蘇軾表兄。畫竹一絕,世稱「文湖州」。「胸有成竹」之典出此。',
    en: 'Style Yuke, of Yongtai in Zizhou. A Northern Song painter and poet, cousin of Su Shi. His bamboo was peerless — called "Wen of Huzhou." "Bamboo in his breast" comes from him.',
  },
  'hist-he-zhu': {
    zh: '字方回,衛州人。北宋詞人。「試問閒愁都幾許?一川煙草,滿城風絮,梅子黃時雨」千古絕唱。',
    en: 'Style Fanghui, of Weizhou. A Northern Song ci poet. "Ask, how much idle sorrow is there? — a river of misty grass, a city of wind-blown willow-down, the plum-rain when the fruit turns yellow" rang forever.',
  },
  'hist-han-zhongyan': {
    zh: '字魯卿,北宋學者。撰《五代史補》。',
    en: 'Style Luqing, a Northern Song scholar. He wrote the Supplement to the History of the Five Dynasties.',
  },
  'hist-mi-youren': {
    zh: '米芾之子。承父業,亦工書畫,號「小米」。',
    en: 'Son of Mi Fu. He carried on his father\'s art in writing and painting, called the "Little Mi."',
  },
  'hist-lu-jiuyuan': {
    era: { zh: '心學先驅', en: 'Forerunner of the Mind-Heart School' },
    zh: '字子靜,號象山,撫州金溪人。南宋哲學家。心學祖師。與朱熹「鵝湖之會」,論「尊德性」與「道問學」。為王陽明心學之先驅。',
    en: 'Style Zijing, called Xiangshan, of Jinxi in Fuzhou. A Southern Song philosopher, founder of the Mind-Heart school. With Zhu Xi he held the Goose Lake debate on "honoring the moral nature" against "pursuing learning." A forerunner of Wang Yangming.',
  },
  'hist-ye-shi': {
    zh: '字正則,號水心,溫州人。南宋永嘉學派代表。主功利之學,反對朱熹理學。著《水心文集》。',
    en: 'Style Zhengze, called Shuixin, of Wenzhou. A representative of the Southern Song Yongjia school. He championed practical statecraft against Zhu Xi\'s school of principle. His Shuixin Collection is his.',
  },
  'hist-wang-yinglin': {
    zh: '字伯厚,慶元府鄞縣人。南宋末年大學者。著《困學紀聞》、《玉海》二百卷,中華類書之大者。又傳為《三字經》作者。',
    en: 'Style Bohou, of Yin county in Qingyuan Prefecture. A great scholar of late Southern Song. He wrote the Notes from My Difficulties in Learning and the Jade Sea in two hundred fascicles — a great Chinese encyclopedia. Tradition also names him author of the Three-Character Classic.',
  },
  // Yuan
  'hist-hoelun': {
    zh: '蒙古族,鐵木真之母。早寡。獨力撫養鐵木真四子,鐵木真稱帝,尊為「太祖訶額侖太皇太后」。',
    en: 'Mongol, mother of Temüjin. Widowed early, she alone raised Temüjin and his four brothers. When Temüjin took the imperial title, she was honored as "Empress Great Dowager Hoelun of the Founding Emperor."',
  },
  'hist-yesugei': {
    zh: '蒙古乞顏部首領。鐵木真之父。為塔塔兒人所毒殺,鐵木真自此遭難,後復興蒙古。',
    en: 'Chieftain of the Mongol Kiyad. Father of Temüjin. Poisoned by the Tatars; from there Temüjin\'s trials began, and from there he later rose to restore the Mongols.',
  },
  'hist-aju': {
    zh: '蒙古名將。元世祖時為大將軍。圍襄陽五年,破之,為宋亡前奏。後從伯顏伐宋,直撲臨安。',
    en: 'A famed Mongol general. Under Kublai he was Grand Marshal. He laid siege to Xiangyang for five years and broke it — the prelude to the fall of Song. With Bayan he later marched on Song and rode straight at Lin\'an.',
  },
  'hist-shi-tianze': {
    zh: '元朝漢人世侯。事窩闊台、蒙哥、忽必烈三朝。鎮真定四十年,治民有方。',
    en: 'A hereditary Han lord of Yuan. He served Ögedei, Möngke, and Kublai. Forty years he held Zhending and ruled the people well.',
  },
  'hist-ahmad': {
    zh: '回回人。元世祖忽必烈寵臣。專管理財。性貪暴,大盜公財,卒於王著之亂中被殺。死後忽必烈方知其貪,剖棺戮屍。',
    en: 'A Muslim. A favored minister of Kublai. He held the finances. Grasping and cruel, he stole greatly from the public coffers; in Wang Zhu\'s revolt he was killed. After his death Kublai learned of his greed, opened the coffin, and abused the corpse.',
  },
  'hist-saidianchi': {
    zh: '中亞布哈拉人,賽典赤·贍思丁。元世祖忽必烈時雲南行省平章政事。鎮雲南六年,興水利,辦學校,使雲南安定,夷漢咸服。卒於任,雲南人感其德,為立祠。',
    en: 'Sayyid Ajall Shams al-Din, of Bukhara in Central Asia. Pacification Commissioner of Yunnan under Kublai. Six years he held Yunnan, raising the waterworks, opening schools, and the province was settled — tribes and Han alike obeyed. He died in office; the people of Yunnan, mindful of his grace, built a shrine for him.',
  },
  'hist-bai-pu': {
    zh: '字仁甫,號蘭谷,真定人。元曲四大家之一。著雜劇《牆頭馬上》、《梧桐雨》等。',
    en: 'Style Renfu, called Langu, of Zhending. One of the Four Great Masters of Yuan drama. He wrote the zaju plays Over the Wall and on Horseback, Rain on the Wutong Tree, and others.',
  },
  'hist-ma-zhiyuan': {
    era: { zh: '秋思之祖', en: '"The Father of Autumn Thoughts"' },
    zh: '字千里,號東籬,大都人。元曲四大家之一。「枯藤老樹昏鴉,小橋流水人家,古道西風瘦馬,夕陽西下,斷腸人在天涯」千古絕唱,《天淨沙·秋思》出此。',
    en: 'Style Qianli, called Dongli, of Dadu. One of the Four Great Masters of Yuan drama. "Withered vine, old tree, evening crows / a small bridge, flowing water, a household / an old road, the west wind, a lean horse / the sunset sinks west / and a heart-broken man is at the world\'s end." From his Heavenly Pure Sand: Autumn Thoughts.',
  },
  'hist-zheng-guangzu': {
    zh: '字德輝,平陽襄陵人。元曲四大家之一。著《倩女離魂》、《王粲登樓》等。',
    en: 'Style Dehui, of Xiangling in Pingyang. One of the Four Great Masters of Yuan drama. He wrote The Soul of Lady Qian Leaves Her Body, Wang Can Climbs the Tower, and others.',
  },
  'hist-lian-xixian': {
    zh: '字希憲,畏兀兒人。元世祖時宰相。漢學家,封魏國公。卒於至元十七年。',
    en: 'Style Xixian, an Uyghur. A chancellor under Kublai. A Sinologist, made Duke of Wei. He died in 1280.',
  },
  'hist-li-meng': {
    zh: '元朝樞密使。從伯顏滅宋,有功。',
    en: 'Commissioner of Military Affairs under Yuan. With Bayan he marched in the conquest of Song.',
  },
  // Ming
  'hist-deng-yu-ming': {
    zh: '字伯顏,泗州虹縣人。明朝開國名將。隨朱元璋起兵,西平四川。封衛國公。後因坐藍玉案被誅。',
    en: 'Style Boyan, of Hong county in Sizhou. A founding general of Ming. He rose with Zhu Yuanzhang and pacified Sichuan in the west. Made Duke of Wei. He was killed in the Lan Yu case.',
  },
  'hist-jiajing': {
    era: { zh: '嘉靖帝', en: 'The Jiajing Emperor' },
    zh: '名朱厚熜,明武宗堂弟。在位四十五年。早期勤政,後期沉迷道教,二十餘年不上朝,任嚴嵩專權。海瑞《直言天下第一事疏》即諫之。後因丹藥而崩。',
    en: 'Personal name Zhu Houcong, cousin of Wuzong of Ming. Forty-five years he reigned. Diligent at first, in his later years he drowned in Daoism and did not hold court for twenty years, letting Yan Song hold all power. Hai Rui\'s Memorial on the First Affair of the Realm was sent to him. He died of his elixirs.',
  },
  'hist-wanli': {
    era: { zh: '萬曆帝', en: 'The Wanli Emperor' },
    zh: '名朱翊鈞,明穆宗第三子。在位四十八年,中國史上在位最久之帝王之一。早期張居正輔政,稱「萬曆中興」。後期沉湎酒色,二十八年不上朝。三大征(寧夏、朝鮮、播州)雖勝,然國庫空虛,明由是衰。',
    en: 'Personal name Zhu Yijun, third son of Muzong of Ming. Forty-eight years he reigned — one of the longest reigns in Chinese history. In the early years Zhang Juzheng was regent — the "Wanli Restoration." In his later years he drowned in wine and women and did not hold court for twenty-eight years. The Three Great Campaigns (Ningxia, Korea, Bozhou) were won, but the treasury was emptied, and from him Ming declined.',
  },
  'hist-liu-bowen': {
    era: { zh: '前知五百年', en: 'He Saw Five Hundred Years Ahead' },
    zh: '參見「hist-liu-bowen」。',
    en: 'See hist-liu-bowen.',
  },
  'hist-huang-zicheng': {
    zh: '字子澄,分宜人。建文帝謀士。倡削藩,引燕王朱棣靖難之變。事敗,被磔殺於市,夷三族。',
    en: 'Style Zicheng, of Fenyi. A counselor of Emperor Jianwen. He urged the cutting down of the princes — and stirred the Jingnan war of Zhu Di Prince of Yan. When the cause fell, he was torn apart in the marketplace and his clan exterminated.',
  },
  'hist-qi-tai': {
    zh: '溧水人。建文帝兵部尚書。與黃子澄共倡削藩。事敗,被朱棣所殺,夷三族。',
    en: 'Of Lishui. Minister of War under Emperor Jianwen. With Huang Zicheng he urged the cutting down of the princes. When the cause fell, Zhu Di killed him and his clan was exterminated.',
  },
  'hist-tie-xuan': {
    era: { zh: '鐵鉉', en: 'Tie Xuan the Loyal' },
    zh: '鄧州人。建文帝時山東參政。靖難之變,朱棣攻濟南,鐵鉉以孤城拒之,大破朱棣於白溝河。後朱棣即位,鐵鉉被擒,大罵不屈,被磔死,妻女沒入教坊。一門忠烈。',
    en: 'Of Dengzhou. Under Emperor Jianwen, Vice-Commissioner of Shandong. In the Jingnan war when Zhu Di attacked Ji\'nan, Tie Xuan held the lone city against him and broke him at the White Ditch River. When Zhu Di took the throne, Tie Xuan was taken; he cursed without yielding and was torn apart; his wife and daughters were given to the courtesan bureau. A loyal house.',
  },
  'hist-jian-yi': {
    zh: '字宜之,湖廣巴陵人。明初名臣。事建文、永樂、洪熙、宣德、正統五朝。位至吏部尚書。',
    en: 'Style Yizhi, of Baling in Huguang. A famed early-Ming minister, serving Jianwen, Yongle, Hongxi, Xuande, and Zhengtong. He rose to Minister of Personnel.',
  },
  'hist-xia-yuanji': {
    zh: '字維喆,湘陰人。明初名臣。事建文、永樂、洪熙、宣德、正統五朝,皆為戶部尚書。明朝財政之大家。',
    en: 'Style Weizhe, of Xiangyin. A famed early-Ming minister. Through five reigns — Jianwen to Zhengtong — he was Minister of Revenue. The great financier of Ming.',
  },
  'hist-yang-shen': {
    zh: '字用修,號升庵,新都人。明朝大才子。狀元,然嘉靖朝大禮議事件中被貶謫雲南三十五年。著《升庵集》。「滾滾長江東逝水,浪花淘盡英雄」千古絕唱,《二十一史彈詞》出此(後人移入《三國演義》卷首)。',
    en: 'Style Yongxiu, called Sheng\'an, of Xindu. A great talent of Ming. He was zhuangyuan; in the Great Rites Controversy of Jiajing\'s reign he was thrust down to Yunnan for thirty-five years. The Sheng\'an Collection is his. "On rolls the long Yangzi, flowing east / its waves wash away the heroes" rang forever — from his Ballads on the Twenty-One Histories (later moved into the opening of the Romance of the Three Kingdoms).',
  },
  'hist-feng-menglong': {
    era: { zh: '三言', en: 'Author of the Three Yans' },
    zh: '字猶龍,長洲人。明末文學家。輯《喻世明言》、《警世通言》、《醒世恆言》,號「三言」,中華短篇小說之大成。',
    en: 'Style Youlong, of Changzhou. A late-Ming writer. He compiled the Stories to Enlighten the World, Stories to Warn the World, and Stories to Awaken the World — the "Three Yans," a great gathering of Chinese short fiction.',
  },
  'hist-mao-wenlong': {
    zh: '杭州人。明末東江鎮總兵。據皮島,擾後金後方。袁崇煥以「擅權」為罪,矯詔斬之,後金由是無後顧之憂。',
    en: 'Of Hangzhou. Commander of the Dongjiang command at the end of Ming. He held Pi Island and harassed the Later Jin rear. Yuan Chonghuan, on a charge of "abuse of power," beheaded him by forged edict — and the Later Jin had no enemy behind.',
  },
  'hist-zou-yuanbiao': {
    zh: '字爾瞻,號南皋,吉水人。明末東林黨領袖。性剛直,屢忤宦官,被廷杖罷職。鄉里講學二十年。',
    en: 'Style Erzhan, called Nangao, of Jishui. A leader of the late-Ming Donglin party. Stiff and upright, he clashed often with the eunuchs and was beaten in court and dismissed. For twenty years he taught in his village.',
  },
  'hist-gu-xiancheng': {
    era: { zh: '東林書院', en: 'Founder of the Donglin Academy' },
    zh: '字叔時,號涇陽,無錫人。明末東林黨領袖。創東林書院,「風聲、雨聲、讀書聲,聲聲入耳;家事、國事、天下事,事事關心」千古絕唱。',
    en: 'Style Shushi, called Jingyang, of Wuxi. A leader of the late-Ming Donglin party. He founded the Donglin Academy. "The sound of wind, the sound of rain, the sound of reading — every sound enters the ear; family affairs, state affairs, the affairs of the realm — every affair concerns us" rang forever.',
  },
  'hist-gao-panlong': {
    zh: '字存之,號景逸,無錫人。東林黨領袖,與顧憲成共主東林書院。後被魏忠賢構陷,投水自盡。',
    en: 'Style Cunzhi, called Jingyi, of Wuxi. A leader of the Donglin party, with Gu Xiancheng head of the Donglin Academy. Framed later by Wei Zhongxian, he drowned himself.',
  },
  'hist-sun-chuanting': {
    zh: '字伯雅,代州振武衛人。明末名將。鎮陝西,屢破李自成。後崇禎逼其出戰,潼關之戰大敗,孫傳庭戰死於亂軍,明遂無人可禦李自成。',
    en: 'Style Boya, of Zhenwu Guard in Daizhou. A famed late-Ming general. Holding Shaanxi he broke Li Zicheng many times. When Chongzhen forced him to march out, he was utterly broken at Tongguan and died in the rout; Ming had no one left to stop Li Zicheng.',
  },
  'hist-sun-kewang': {
    zh: '陝西米脂人。明末張獻忠養子。張獻忠死後,孫可望率部歸南明永曆帝。後與李定國爭權,終降清,封義王。',
    en: 'Of Mizhi in Shaanxi. An adopted son of Zhang Xianzhong at the end of Ming. When Zhang Xianzhong died, Sun Kewang led his men to the Southern Ming Yongli emperor. He contested with Li Dingguo and at last submitted to Qing, made King Yi.',
  },
  'hist-shen-shixing': {
    zh: '字汝默,長洲人。明萬曆朝首輔。狀元。性溫和,後因國本之爭辭歸。',
    en: 'Style Rumo, of Changzhou. Grand Secretary under Wanli of Ming, a zhuangyuan. Mild in temper, he resigned after the "root of the state" dispute.',
  },
  'hist-yang-sichang': {
    zh: '字文弱,湖廣武陵人。明末兵部尚書。獻「四正六隅,十面張網」剿張獻忠之策,初有效,後敗於襄陽,憂憤而卒。',
    en: 'Style Wenruo, of Wuling in Huguang. Minister of War at the end of Ming. He gave the strategy of "four straight sides and six corners, the ten-faced net" against Zhang Xianzhong; it worked at first, then failed at Xiangyang, and he died of grief and rage.',
  },
  'hist-mao-yuanyi': {
    era: { zh: '武備志', en: 'Author of the Treatise on Military Preparation' },
    zh: '字止生,號鹿門,歸安人。明末軍事家。著《武備志》二百四十卷,中華第一部大型兵書集,涉兵法、陣圖、武器、戰史。世界軍事史之珍。',
    en: 'Style Zhisheng, called Lumen, of Gui\'an. A late-Ming military theorist. He wrote the Treatise on Military Preparation in 240 fascicles — the first great Chinese collection of military books, covering strategy, formations, weapons, and military history. A treasure of world military history.',
  },
  // Qing
  'hist-gao-shiqi': {
    zh: '字澹人,號江村,錢塘人。康熙寵臣。以詩書畫見幸,號「江村四友」之首。',
    en: 'Style Danren, called Jiangcun, of Qiantang. A favored minister of Kangxi, raised up for his poetry, calligraphy, and painting — first of the "Four Friends of Jiangcun."',
  },
  'hist-yu-chenglong': {
    era: { zh: '天下第一廉吏', en: '"First Clean Official Under Heaven"' },
    zh: '字北溟,山西永寧人。清康熙朝名臣。歷任知縣、知府、巡撫、總督,以清廉著稱,康熙譽為「天下第一廉吏」。卒,百姓哭之至慟。',
    en: 'Style Beiming, of Yongning in Shanxi. A famed minister under Kangxi. He served as Magistrate, Prefect, Governor, and Governor-General, famed for clean hands — Kangxi called him "the first clean official under heaven." At his death the people wept till their voices broke.',
  },
  'hist-bao-chao': {
    zh: '字春霆,四川奉節人。清末湘軍名將。從曾國藩平太平天國,所向披靡,「霆軍」威震一時。後因病解職。',
    en: 'Style Chunting, of Fengjie in Sichuan. A famed late-Qing general of the Hunan Army. With Zeng Guofan he marched against the Taiping and none stood before him; the "Ting Army" shook the age. He later resigned for illness.',
  },
  'hist-hu-linyi': {
    zh: '字貺生,湖南益陽人。清末湘軍三大員之一。鎮湖北,籌軍餉,助曾國藩平太平天國。卒於軍中。',
    en: 'Style Kuangsheng, of Yiyang in Hunan. One of the three great men of the late-Qing Hunan Army. Holding Hubei he raised the army\'s pay and helped Zeng Guofan against the Taiping. He died in camp.',
  },
  'hist-jiang-zhongyuan': {
    zh: '字常孺,湖南新寧人。清末湘軍名將。原為塾師,起兵討太平軍。後在廬州之戰中被殺。',
    en: 'Style Changru, of Xinning in Hunan. A famed late-Qing general of the Hunan Army. Once a village schoolmaster, he rose to fight the Taiping. He was killed at the battle of Luzhou.',
  },
  'hist-liu-yong': {
    era: { zh: '劉羅鍋', en: '"Hunchback Liu"' },
    zh: '字崇如,號石庵,山東諸城人。乾隆、嘉慶兩朝名臣。性詼諧公正,以剛直見稱。後人以「劉羅鍋」稱之,演義甚多。',
    en: 'Style Chongru, called Shi\'an, of Zhucheng in Shandong. A famed minister of Qianlong and Jiaqing. Witty and upright, known for stiff straightness. Later ages called him "Hunchback Liu" and many tales told of him.',
  },
  'hist-peng-yulin': {
    zh: '字雪琴,湖南衡陽人。清末湘軍水師統帥。組湘軍水師,與太平軍水戰於長江,屢勝。後位至兵部尚書。性清廉,號「彭青天」。',
    en: 'Style Xueqin, of Hengyang in Hunan. Commander of the Hunan Army\'s river fleet at the end of Qing. He raised the Hunan river fleet and broke the Taiping fleet on the Yangzi many times. He rose to Minister of War. Clean in temper, called "Peng the Blue Sky."',
  },
  'hist-tang-jingsong': {
    zh: '字維卿,廣西灌陽人。清末名將。中法戰爭中守台灣,與劉永福共抗法軍。日本割台,任臺灣民主國首任大總統。後流落上海。',
    en: 'Style Weiqing, of Guanyang in Guangxi. A famed late-Qing general. In the Sino-French War he held Taiwan with Liu Yongfu against the French. When Japan took Taiwan he served as the first president of the Republic of Taiwan. He later wandered to Shanghai.',
  },
  'hist-nie-shicheng': {
    zh: '字功亭,安徽合肥人。清末武毅軍統帥。中日甲午戰爭中守牛莊,後守天津。八國聯軍之役,聶士成於八里台力戰而死,身被數彈,血流如注。',
    en: 'Style Gongting, of Hefei in Anhui. Commander of the late-Qing Wuyi Army. In the Sino-Japanese War he held Niuzhuang and then Tianjin. In the Eight-Nation Army war he died fighting at Balitai, struck by many bullets, blood streaming.',
  },
  'hist-ma-yukun': {
    zh: '清末名將。隨左宗棠西征,平回亂,收復新疆。後在中日甲午戰爭中守平壤。',
    en: 'A famed late-Qing general. With Zuo Zongtang he marched west, put down the Hui revolt, and recovered Xinjiang. In the Sino-Japanese War he held Pyongyang.',
  },
  'hist-zhao-liangdong': {
    zh: '字西垣,甘肅寧夏人。清康熙時名將。從圖海平三藩,鎮西北。封一等公。',
    en: 'Style Xiyuan, of Ningxia in Gansu. A famed Kangxi general. With Tuhai he put down the Three Feudatories and held the northwest. Made a Duke of the First Class.',
  },
  // ─── 歷代名將 新增第十批 (Historical biographies — batch 10: Qing) ───
  'hist-hong-taiji': {
    zh: '參見「hist-huangtaiji」。',
    en: 'See hist-huangtaiji.',
  },
  'hist-dodo': {
    era: { zh: '多鐸', en: 'Dodo' },
    zh: '努爾哈赤第十五子,多爾袞之弟。清初名將。隨多爾袞入關,平江南。揚州十日、嘉定三屠皆多鐸所為。封豫親王。卒於天花,年三十六。',
    en: 'Fifteenth son of Nurhaci, younger brother of Dorgon. A famed early-Qing general. With Dorgon he came through the wall and pacified the south. The Ten Days at Yangzhou and the Three Slaughters at Jiading were his work. Made Prince of Yu. He died of smallpox at thirty-six.',
  },
  'hist-ajige': {
    zh: '努爾哈赤第十二子,多爾袞之兄。隨多爾袞、多鐸入關,平四川。封英親王。後因爭立順治帝失敗,被多爾袞所抑。多爾袞死後被誣謀反,賜死。',
    en: 'Twelfth son of Nurhaci, elder brother of Dorgon. With Dorgon and Dodo he came through the wall and pacified Sichuan. Made Prince of Ying. Defeated in the contest over Shunzhi\'s accession, he was held down by Dorgon. After Dorgon died he was framed with revolt and given a draught of death.',
  },
  'hist-shunzhi': {
    era: { zh: '順治帝', en: 'The Shunzhi Emperor' },
    zh: '名福臨,皇太極第九子。六歲嗣位,多爾袞攝政。多爾袞死後親政。性多情,寵愛董鄂妃,妃死後傷悼成疾。在位十八年,卒於養心殿,年二十四(或言出家五臺山)。',
    en: 'Personal name Fulin, ninth son of Hongtaiji. He took the throne at six, with Dorgon as regent. After Dorgon died he took up rule himself. Of strong feeling, he doted on Consort Donggo; when she died he sickened in grief. Eighteen years he reigned and died at the Yangxin Palace at twenty-four — or, the tale runs, became a monk on Mount Wutai.',
  },
  'hist-xiaozhuang': {
    era: { zh: '孝莊文太后', en: 'Empress Dowager Xiaozhuang Wen' },
    zh: '名布木布泰,蒙古博爾濟吉特氏。皇太極莊妃。生順治帝。皇太極崩,扶順治、康熙兩代幼帝臨朝。歷四朝,輔成清初基業,千古賢后之典。壽七十五。',
    en: 'Personal name Bumbutai, of the Mongol Borjigit clan. Consort Zhuang of Hongtaiji. Mother of the Shunzhi emperor. When Hongtaiji died, she raised both Shunzhi and Kangxi to the throne as boy-emperors. Through four reigns she helped found the early Qing — a model worthy empress for the ages. She lived to seventy-five.',
  },
  'hist-oboi': {
    era: { zh: '鰲拜', en: 'Oboi' },
    zh: '滿洲鑲黃旗人。清初名將,號「滿洲第一勇士」。順治帝託孤四輔政之一,後專權跋扈。康熙智擒鰲拜於南書房,囚死於獄,千古少年皇帝智擒權臣之典。',
    en: 'Of the Manchu Bordered Yellow Banner. A famed early-Qing general, called "first warrior of Manchuria." One of the four regents appointed by Shunzhi for his son. He grew overbearing and held all power. Kangxi cleverly seized him in the Southern Study and he died in prison — a model for the ages of a boy-emperor taking down a great power-holder.',
  },
  'hist-suksaha': {
    zh: '滿洲正白旗人。順治帝託孤四輔政之一。後鰲拜陷之,被誅,夷其家。',
    en: 'Of the Manchu Plain White Banner. One of the four regents appointed by Shunzhi. Later framed by Oboi, he was killed and his household exterminated.',
  },
  'hist-ebilun': {
    zh: '滿洲鑲黃旗人。順治帝託孤四輔政之一。性懦弱,從鰲拜行事,鰲拜既擒,亦被免官。',
    en: 'Of the Manchu Bordered Yellow Banner. One of the four regents appointed by Shunzhi. Weak in temper, he followed Oboi. When Oboi was taken he too was dismissed.',
  },
  'hist-tuhai': {
    zh: '滿洲正黃旗人。康熙時名將。平三藩之亂,鎮西北,屢有戰功。封一等公,謚文襄。',
    en: 'Of the Manchu Plain Yellow Banner. A famed general under Kangxi. He put down the Three Feudatories\' revolt, held the northwest, and won many laurels. Made a Duke of the First Class, posthumous name Wenxiang.',
  },
  'hist-songgotu': {
    zh: '滿洲正黃旗人。康熙時權臣。與明珠相鬥。康熙親征噶爾丹,索額圖預軍政。後與太子黨相結,被康熙圈禁而死。',
    en: 'Of the Manchu Plain Yellow Banner. A great minister under Kangxi. He contested power with Mingju. When Kangxi marched against Galdan in person, Songgotu joined the planning. Later, bound to the crown prince\'s faction, he was confined by Kangxi and died.',
  },
  'hist-mingju': {
    zh: '葉赫那拉氏。康熙時權臣。與索額圖相鬥。後因結黨被康熙罷職。其子納蘭性德為清代第一詞人。',
    en: 'Of the Yehenara clan. A great minister under Kangxi. He contested power with Songgotu. Later dismissed by Kangxi for faction-building. His son Nalan Xingde was the first ci poet of the Qing.',
  },
  'hist-nalan-xingde': {
    era: { zh: '清代第一詞人', en: 'First Ci Poet of the Qing' },
    zh: '字容若,葉赫那拉氏,明珠之子。康熙朝詞人。生於富貴,然以悲愴為詞,「人生若只如初見」、「當時只道是尋常」千古絕唱。年三十一早卒,世人惜之。',
    en: 'Style Rongruo, of the Yehenara clan, son of Mingju. A ci poet of the Kangxi reign. Born to wealth and rank, his verse was full of grief. "If life were only as the first meeting" and "back then I thought it ordinary" rang forever. He died at thirty-one, and the world mourned.',
  },
  'hist-shang-kexi': {
    zh: '遼東人。原明朝將,降清為三藩之一,封平南王,鎮廣東。康熙削藩,尚可喜上書請歸老遼東,然其子尚之信叛清,可喜遂憂憤而卒。',
    en: 'Of Liaodong. An old Ming general who submitted to Qing as one of the Three Feudatories — made Prince of Pingnan, holding Guangdong. When Kangxi cut down the feudatories he asked to retire to Liaodong; but his son Shang Zhixin rose against Qing, and Shang Kexi died of grief and rage.',
  },
  'hist-geng-jingzhong': {
    zh: '原明朝將耿仲明之孫。三藩之一,封靖南王,鎮福建。康熙削藩,耿精忠起兵反清。後敗降清,被凌遲處死。',
    en: 'Grandson of the old Ming general Geng Zhongming. One of the Three Feudatories, made Prince of Jingnan, holding Fujian. When Kangxi cut down the feudatories he rose against Qing. Broken and submitting, he was torn apart.',
  },
  'hist-zhaohui': {
    zh: '滿洲正黃旗人。乾隆時名將。隨乾隆征準噶爾、回部,平定新疆,功冠群臣。封一等武毅謀勇公。',
    en: 'Of the Manchu Plain Yellow Banner. A famed general under Qianlong. With Qianlong he campaigned against the Dzungars and the Hui, pacified Xinjiang, his merit above all. Made a Duke of the First Class — "Bold, Resolute, Skilled, and Brave."',
  },
  'hist-hailancha': {
    zh: '滿洲鑲黃旗人。乾隆時名將。隨阿桂、福康安征大小金川、廓爾喀,功著一時。',
    en: 'Of the Manchu Bordered Yellow Banner. A famed general under Qianlong. With Agui and Fukanggan he campaigned against the Greater and Lesser Jinchuan and the Gurkha — his fame in his age.',
  },
  'hist-agui': {
    zh: '滿洲正白旗人。乾隆朝名將。平大小金川、回部,鎮邊有功。位至武英殿大學士。乾隆四十大功臣之一。',
    en: 'Of the Manchu Plain White Banner. A famed general under Qianlong. He pacified the Greater and Lesser Jinchuan and the Hui with merit on the borders. He rose to Grand Secretary of the Wuying Hall. One of the Forty Meritorious Officers of Qianlong.',
  },
  'hist-fukanggan': {
    zh: '滿洲鑲黃旗人,富察氏。乾隆時名將,孝賢純皇后之姪。征大小金川、台灣林爽文、廓爾喀,所向披靡。封嘉勇郡王。',
    en: 'Of the Manchu Bordered Yellow Banner, of the Fucha clan. A famed general under Qianlong, nephew of the Pure Empress Xiaoxian. He marched on the Greater and Lesser Jinchuan, on Lin Shuangwen of Taiwan, on the Gurkhas — none stood before him. Made Prince of Jiayong commandery.',
  },
  'hist-nian-gengyao': {
    zh: '漢軍鑲黃旗人。雍正寵臣。平青海羅卜藏丹津,功冠群臣。封一等公。後恃寵驕橫,被雍正以九十二大罪賜死。',
    en: 'Of the Han Bordered Yellow Banner. A favored minister of Yongzheng. He put down Lobzang Danjin in Qinghai, his merit above all. Made a Duke of the First Class. Later proud and overbearing on his lord\'s favor, Yongzheng listed ninety-two great crimes and gave him a draught of death.',
  },
  'hist-ortai': {
    zh: '滿洲鑲藍旗人,西林覺羅氏。雍正朝重臣。主持「改土歸流」,改西南土司為流官,大行漢化。位至保和殿大學士。',
    en: 'Of the Manchu Bordered Blue Banner, of the Silin Gioro clan. A great minister of Yongzheng. He led the policy of "replacing native chieftains with regular officials," sinicizing the southwest. He rose to Grand Secretary of the Baohe Hall.',
  },
  'hist-zhang-tingyu': {
    zh: '字衡臣,安徽桐城人。雍正、乾隆兩朝重臣。主編《明史》、《大清會典》。歷三朝五十年,清朝唯一配享太廟之漢臣。',
    en: 'Style Hengchen, of Tongcheng in Anhui. A great minister of Yongzheng and Qianlong. He led the compilation of the Ming History and the Qing Statutes. For fifty years across three reigns — the only Han minister honored with offerings at the Imperial Ancestral Temple under Qing.',
  },
  'hist-chen-tingjing': {
    zh: '字子端,山西澤州人。康熙時名臣。主編《康熙字典》,中華第一部漢字字典,收四萬七千字。位至文淵閣大學士。',
    en: 'Style Ziduan, of Zezhou in Shanxi. A famed minister under Kangxi. He led the compilation of the Kangxi Dictionary — the first great Chinese character dictionary, with 47,000 entries. He rose to Grand Secretary of the Wenyuan Hall.',
  },
  'hist-tian-wenjing': {
    zh: '漢軍正黃旗人。雍正朝名臣,模範總督。鎮河南,清查積弊,以嚴明著稱。雍正譽為「模範督撫」。卒,雍正親臨弔唁。',
    en: 'Of the Han Plain Yellow Banner. A famed minister under Yongzheng, the model Governor-General. Holding Henan he investigated old abuses, known for strict clarity. Yongzheng called him a "model governor-general." At his death Yongzheng came in person to mourn.',
  },
  'hist-gu-yanwu': {
    era: { zh: '清初三大儒', en: 'One of the Three Great Confucians of Early Qing' },
    zh: '字寧人,號亭林,蘇州崑山人。明末清初大儒。著《日知錄》、《天下郡國利病書》。倡實學,反對空談。與黃宗羲、王夫之並稱清初三大儒。「天下興亡,匹夫有責」千古絕唱。',
    en: 'Style Ningren, called Tinglin, of Kunshan in Suzhou. A great Confucian of the late Ming and early Qing. He wrote the Daily Knowledge Record and the Treatise on the Geography and Statecraft of the Realm. He urged practical learning against empty talk. With Huang Zongxi and Wang Fuzhi he was one of the Three Great Confucians of early Qing. "The rise and fall of the realm — every common man has a share in it" rang forever.',
  },
  'hist-huang-zongxi': {
    era: { zh: '清初三大儒', en: 'One of the Three Great Confucians of Early Qing' },
    zh: '字太沖,號梨洲,浙江餘姚人。明末清初大儒。著《明夷待訪錄》,提出「天下為主,君為客」之說,啟蒙之先聲。又著《宋元學案》、《明儒學案》,中華第一部學術史。',
    en: 'Style Taichong, called Lizhou, of Yuyao in Zhejiang. A great Confucian of the late Ming and early Qing. He wrote the Mingyi Daifang Lu, propounding "the realm is the host, the lord is the guest" — an early voice of enlightenment. He also wrote the Cases of Song and Yuan Learning and the Cases of Ming Confucians, the first connected academic history of China.',
  },
  'hist-wang-fuzhi': {
    era: { zh: '清初三大儒', en: 'One of the Three Great Confucians of Early Qing' },
    zh: '字而農,號薑齋,湖南衡陽人。明末清初大儒。明亡後隱居衡山,著書四十年。集中華古代唯物論之大成。著《讀通鑑論》、《宋論》,千古史學之珍。',
    en: 'Style Erung, called Jiangzhai, of Hengyang in Hunan. A great Confucian of the late Ming and early Qing. After Ming fell he hid on Mount Heng and wrote for forty years. He gathered the materialist thought of ancient China into one. The Discourses on the Comprehensive Mirror and the Discourses on Song are his, a treasure of historical learning.',
  },
  'hist-zhu-shunshui': {
    zh: '字魯嶼,號舜水,浙江餘姚人。明末大儒。明亡後流亡日本二十年,授徒講學,日本水戶藩主德川光圀奉為國師,日本朱子學由是大興,影響明治維新。',
    en: 'Style Luyu, called Shunshui, of Yuyao in Zhejiang. A great Confucian of the late Ming. After Ming fell he wandered in Japan twenty years, teaching disciples. Tokugawa Mitsukuni of the Mito domain honored him as State Preceptor; Japanese Zhu Xi learning flourished from him, and shaped the Meiji Restoration.',
  },
  'hist-dai-zhen': {
    zh: '字東原,安徽休寧人。清代考據學大師。著《孟子字義疏證》,反對宋明理學「以理殺人」,主張義理寓於訓詁。',
    en: 'Style Dongyuan, of Xiuning in Anhui. A great master of evidential scholarship in the Qing. He wrote the Annotated Glosses on the Mencius, against the Song-Ming neo-Confucian "killing men with principle"; he held that meaning rests in glossing the words.',
  },
  'hist-duan-yucai': {
    zh: '字若膺,號茂堂,江蘇金壇人。清代文字學家。著《說文解字注》,中華文字學之大成,千古不刊。',
    en: 'Style Ruoying, called Maotang, of Jintan in Jiangsu. A philologist of the Qing. He wrote the Notes on the Shuowen Jiezi — the great gathering of Chinese philology, never to be undone.',
  },
  'hist-ruan-yuan': {
    zh: '字伯元,號芸臺,江蘇儀徵人。清乾隆、嘉慶、道光三朝重臣。主編《經籍籑詁》、《十三經注疏》。倡「樸學」,清代考據學集大成。位至體仁閣大學士。',
    en: 'Style Boyuan, called Yuntai, of Yizheng in Jiangsu. A great minister of Qianlong, Jiaqing, and Daoguang. He led the compilation of the Glosses of the Classics and the Thirteen Classics with Subcommentary. He championed "plain learning" — the great synthesizer of Qing evidential scholarship. He rose to Grand Secretary of the Tiren Hall.',
  },
  'hist-gong-zizhen': {
    zh: '字璱人,號定盦,浙江仁和人。清代思想家、詩人。倡更法、改革,「九州生氣恃風雷,萬馬齊喑究可哀。我勸天公重抖擻,不拘一格降人才」千古絕唱。',
    en: 'Style Seren, called Ding\'an, of Renhe in Zhejiang. A thinker and poet of the Qing. He urged reform: "The nine provinces\' breath rests on wind and thunder / when ten thousand horses fall silent it is grief — / I beg of Heaven to shake itself / and send down talent in every shape, unbound." Rang forever.',
  },
  'hist-wei-yuan': {
    zh: '字默深,湖南邵陽人。清代思想家。著《海國圖志》一百卷,介紹世界地理形勢,倡「師夷長技以制夷」,中華睜眼看世界之先聲。',
    en: 'Style Moshen, of Shaoyang in Hunan. A thinker of the Qing. He wrote the Illustrated Treatise on the Maritime Kingdoms in a hundred fascicles, telling of the geography of the world, and held: "Take up the foreigner\'s long art to control the foreigner" — the first voice of China opening her eyes upon the world.',
  },
  'hist-wu-jingzi': {
    era: { zh: '儒林外史', en: 'Author of The Scholars' },
    zh: '字敏軒,安徽全椒人。清代小說家。著《儒林外史》五十六回,中國第一部諷刺小說,刻畫科舉制度下士林之百態。',
    en: 'Style Minxuan, of Quanjiao in Anhui. A Qing novelist. He wrote The Scholars in fifty-six chapters — the first Chinese satirical novel, drawing the gentry under the examination system in every aspect.',
  },
  'hist-yuan-mei': {
    era: { zh: '隨園老人', en: 'The Old Man of Sui Garden' },
    zh: '字子才,號隨園老人,浙江錢塘人。清代詩人、文學家。性情詩派之祖。著《隨園詩話》、《子不語》。築隨園於南京,游樂終身。',
    en: 'Style Zicai, called the Old Man of Sui Garden, of Qiantang in Zhejiang. A Qing poet and writer, founder of the Spirit-and-Temper school of poetry. He wrote the Sui Garden Talks on Poetry and the Things Confucius Did Not Speak Of. He built the Sui Garden at Nanjing and made merry all his days.',
  },
  'hist-zhang-binglin': {
    zh: '字枚叔,號太炎,浙江餘杭人。清末民初思想家、革命家。同盟會領袖。主編《民報》。後因袁世凱稱帝,憤而著文反袁。文宗復古,訓詁學集大成,弟子魯迅、黃侃等皆名家。',
    en: 'Style Meishu, called Taiyan, of Yuhang in Zhejiang. A thinker and revolutionary of late Qing and early Republic. A leader of the Tongmenghui, editor of Min Bao. When Yuan Shikai took the imperial title, he wrote in fury against him. His prose looked to antiquity; he gathered the philological learning into one, and his disciples — Lu Xun, Huang Kan, and others — all became great men.',
  },
  'hist-kang-youwei': {
    era: { zh: '戊戌變法', en: 'Leader of the Hundred Days\' Reform' },
    zh: '字廣廈,號長素,廣東南海人。清末維新派領袖。倡君主立憲,公車上書。光緒帝重之,行戊戌變法,百日而敗。康有為流亡海外十六年,辛亥革命後反對共和,保皇終身。',
    en: 'Style Guangsha, called Changsu, of Nanhai in Guangdong. Leader of the reformist school in late Qing. He urged constitutional monarchy and led the Memorial of the Examination Carts. Emperor Guangxu valued him and led the Hundred Days\' Reform — a hundred days and it failed. Kang Youwei wandered abroad sixteen years; after the Xinhai Revolution he opposed the republic and was a monarchist to the end.',
  },
  'hist-liang-qichao': {
    zh: '字卓如,號任公,廣東新會人。清末民初思想家。康有為弟子。戊戌變法後流亡日本,著《新民說》、《飲冰室合集》,啟蒙中華近代思想。後在民國任財政總長,辭職後專事學術,死於協和醫院。',
    en: 'Style Zhuoru, called Rengong, of Xinhui in Guangdong. A thinker of late Qing and early Republic, pupil of Kang Youwei. After the Hundred Days\' Reform he wandered in Japan and wrote On the New Citizen and the Ice-Drinker\'s Studio Collected Works, awakening modern Chinese thought. Under the Republic he served as Finance Minister; resigning, he turned to scholarship, and died at the PUMC hospital.',
  },
  'hist-yang-shenxiu': {
    zh: '字儀村,陝西蒲城人。戊戌六君子之一。慷慨就義於菜市口。',
    en: 'Style Yicun, of Pucheng in Shaanxi. One of the Six Gentlemen of the Wuxu Reform. He went bold-voiced to death at Caishikou.',
  },
  'hist-liu-guangdi': {
    zh: '字裴村,四川富順人。戊戌六君子之一。慷慨就義於菜市口。',
    en: 'Style Peicun, of Fushun in Sichuan. One of the Six Gentlemen of the Wuxu Reform. He went bold-voiced to death at Caishikou.',
  },
  'hist-lin-xu': {
    zh: '字暾穀,福建侯官人。戊戌六君子之一。年僅二十四,慷慨就義於菜市口。',
    en: 'Style Tungu, of Houguan in Fujian. One of the Six Gentlemen of the Wuxu Reform. Just twenty-four, he went bold-voiced to death at Caishikou.',
  },
  'hist-yang-rui': {
    zh: '字叔嶠,四川綿竹人。戊戌六君子之一。慷慨就義於菜市口。',
    en: 'Style Shuqiao, of Mianzhu in Sichuan. One of the Six Gentlemen of the Wuxu Reform. He went bold-voiced to death at Caishikou.',
  },
  'hist-qiu-jin': {
    era: { zh: '鑑湖女俠', en: 'The Woman Knight of Lake Jian' },
    zh: '字璿卿,號鑑湖女俠,浙江紹興人。清末女革命家。留學日本,加入同盟會。回國後在紹興主大通學堂,謀光復軍起義。事敗被執,寫「秋風秋雨愁煞人」一句而死,年三十二。中華第一女革命家。',
    en: 'Style Xuanqing, called the Woman Knight of Lake Jian, of Shaoxing in Zhejiang. A woman revolutionary of late Qing. She studied in Japan and joined the Tongmenghui. Back in Shaoxing she led the Datong Academy and plotted the Guangfu army rising. Taken when the plot failed, she wrote a single line — "the autumn wind, the autumn rain, kill me with sorrow" — and died at thirty-two. The first woman revolutionary of China.',
  },
  'hist-zou-rong': {
    era: { zh: '革命軍', en: 'Author of The Revolutionary Army' },
    zh: '字蔚丹,四川巴縣人。清末革命家。年十八著《革命軍》二萬言,號召驅除韃虜,建立中華共和國。蘇報案被囚於上海西牢,年二十二死於獄中。',
    en: 'Style Weidan, of Ba county in Sichuan. A revolutionary of late Qing. At eighteen he wrote the Revolutionary Army in twenty thousand words, calling for the expulsion of the Manchus and the founding of a Chinese republic. Imprisoned in the Shanghai Western Jail in the Subao case, he died there at twenty-two.',
  },
  'hist-yuan-shikai': {
    era: { zh: '洪憲帝', en: 'Emperor Hongxian' },
    zh: '字慰亭,河南項城人。清末民初軍政人物。小站練兵,建北洋新軍。戊戌變法告密於慈禧,致變法失敗。武昌起義後,逼清帝退位,任中華民國臨時大總統。後復辟稱帝,號洪憲,八十三日而崩。年五十八。',
    en: 'Style Weiting, of Xiangcheng in Henan. A military and political figure of late Qing and early Republic. At Xiaozhan he drilled the Beiyang New Army. In the Hundred Days\' Reform he betrayed the plot to Cixi, bringing it down. After the Wuchang Uprising he forced the Qing emperor to abdicate and became Provisional President of the Republic of China. He then took the imperial title as Emperor Hongxian — eighty-three days and the throne fell. He died at fifty-eight.',
  },
  'hist-huang-xing': {
    zh: '字克強,湖南長沙人。中華民國開國元勳,孫中山之副。發動黃花崗起義、武昌起義,中華民國之建,黃興功不可沒。後與孫中山主張不同,病卒於上海,年四十二。',
    en: 'Style Keqiang, of Changsha in Hunan. A founding hero of the Republic of China, second to Sun Yat-sen. He led the Yellow Flower Mound and the Wuchang Uprisings; the founding of the Republic owed much to him. Differing later with Sun Yat-sen, he died of illness at Shanghai at forty-two.',
  },
  'hist-zhan-tianyou': {
    era: { zh: '中國鐵路之父', en: 'Father of Chinese Railways' },
    zh: '字眷誠,廣東南海人。清末工程師,中華鐵路之父。留學美國耶魯。主持京張鐵路,獨創「人字形」鐵路克服八達嶺險峻,中華第一條完全由華人自主修築之鐵路。',
    en: 'Style Juancheng, of Nanhai in Guangdong. An engineer of late Qing, the father of Chinese railways. He studied at Yale. He led the Beijing-Zhangjiakou Railway and devised the unique "zigzag" line to overcome the steep Badaling — the first railway in China built entirely by Chinese hands.',
  },
  'hist-cai-e': {
    era: { zh: '護國將軍', en: 'Defender of the Republic' },
    zh: '字松坡,湖南邵陽人。中華民國名將。袁世凱稱帝,蔡鍔以「為國民爭人格」起兵雲南,號護國軍,逼袁世凱取消帝制。後病死日本,年三十五。',
    en: 'Style Songpo, of Shaoyang in Hunan. A famed general of the Republic of China. When Yuan Shikai took the imperial title, Cai E raised troops in Yunnan, calling his force the Army to Protect the Country, and forced Yuan Shikai to undo the title. He died of illness in Japan at thirty-five.',
  },
  'hist-feng-zicai': {
    era: { zh: '鎮南關大捷', en: 'Victor of Zhennan Pass' },
    zh: '字翠亭,廣西博白人。清末名將。中法戰爭中,馮子材年近七十,率軍於鎮南關大破法軍,扭轉戰局。傳云「七十老翁猶執銳」,千古傳為國魂。',
    en: 'Style Cuiting, of Bobai in Guangxi. A famed general of late Qing. In the Sino-French War, near seventy years old, Feng Zicai led his troops to break the French at Zhennan Pass, turning the tide. "An old man of seventy still bearing the sharp blade" rang as the spirit of the nation.',
  },
  'hist-deng-shichang': {
    era: { zh: '甲午海戰', en: 'Hero of the Battle of the Yellow Sea' },
    zh: '字正卿,廣東番禺人。清北洋海軍致遠艦管帶。甲午海戰,致遠艦中彈將沉,鄧世昌命衝撞日艦吉野,中魚雷沉沒。鄧世昌與全艦二百四十六人共沉於海,年四十六。',
    en: 'Style Zhengqing, of Panyu in Guangdong. Captain of the Zhiyuan in the Qing Beiyang fleet. In the Battle of the Yellow Sea, when the Zhiyuan was hit and sinking, Deng Shichang ordered her to ram the Japanese Yoshino; struck by a torpedo, she went down. Deng Shichang and all 246 of the crew sank with the ship; he was forty-six.',
  },
  'hist-ding-ruchang': {
    zh: '字禹廷,安徽廬江人。清北洋海軍提督。甲午戰爭,北洋艦隊敗於黃海。威海衛之戰,丁汝昌守劉公島,糧盡援絕,服鴉片自盡,以保全艦官兵之命。',
    en: 'Style Yuting, of Lujiang in Anhui. Commander of the Qing Beiyang fleet. In the Sino-Japanese War the fleet was broken in the Yellow Sea. At Weihaiwei, holding Liugong Island, Ding Ruchang ran out of grain and relief failed; he took opium to die, that the lives of his officers and men might be kept whole.',
  },
  'hist-zuo-bao gui': {
    zh: '參見「hist-zuo-baogui」(若已錄)。',
    en: 'See hist-zuo-baogui.',
  },
  'hist-sengge-rinchen': {
    zh: '蒙古族,科爾沁人。咸豐朝名將。第二次鴉片戰爭中,大破英法聯軍於大沽口。後在山東剿捻軍,中流矢而死。',
    en: 'Of the Mongol Khorchin. A famed general under Xianfeng. In the Second Opium War he broke the Anglo-French army at the mouth of the Dagu River. Later in Shandong against the Nian, he was struck by a stray arrow and died.',
  },
  'hist-shen-baozhen': {
    zh: '字幼丹,福建侯官人,林則徐婿。清末名臣。創福州船政局,中華第一所近代海軍學校。後任兩江總督,治民有方。',
    en: 'Style Youdan, of Houguan in Fujian, son-in-law of Lin Zexu. A famed minister of late Qing. He founded the Fuzhou Naval Yard, the first modern naval academy of China. He later served as Governor-General of the Two Jiangs and ruled the people well.',
  },
  'hist-yikuang': {
    zh: '愛新覺羅·奕劻,慶親王。清末權貴,皇族內閣首席。貪贓枉法,世稱「慶記公司」。武昌起義後辭職,移居天津。',
    en: 'Aisin Gioro Yikuang, Prince Qing. A great power-holder of late Qing, head of the imperial-clan cabinet. Greedy and crooked, the world called his household "the Qing-Brand Company." After the Wuchang Uprising he resigned and moved to Tianjin.',
  },
  'hist-yixin': {
    era: { zh: '恭親王', en: 'Prince Gong' },
    zh: '愛新覺羅·奕訢,道光帝第六子。咸豐之弟。咸豐死後與慈禧合謀辛酉政變,擁同治。主持洋務運動,設總理衙門,興辦近代工業。光緒朝被慈禧逐出朝堂。卒於戊戌年。',
    en: 'Aisin Gioro Yixin, sixth son of Daoguang. Younger brother of Xianfeng. After Xianfeng\'s death he joined Cixi in the Xinyou coup that set up Tongzhi. He led the Self-Strengthening Movement, set up the Zongli Yamen, and opened modern industry. Under Guangxu, Cixi drove him from court. He died in the Wuxu year.',
  },
  'hist-weng-tonghe': {
    zh: '字叔平,江蘇常熟人。同治、光緒兩朝帝師。狀元出身。戊戌變法時力主新政,被慈禧逐歸故里,憂憤而卒。',
    en: 'Style Shuping, of Changshu in Jiangsu. Tutor to two emperors, Tongzhi and Guangxu. A zhuangyuan (first-place graduate) of his time. In the Wuxu reform he pressed for the new policies; Cixi drove him home, where he died of grief and rage.',
  },
  'hist-tongzhi': {
    era: { zh: '同治帝', en: 'The Tongzhi Emperor' },
    zh: '名載淳,咸豐帝獨子。在位十三年。慈安、慈禧兩太后垂簾聽政,後恭親王奕訢輔政,稱「同治中興」。年十九早卒,世傳死於天花或梅毒。',
    en: 'Personal name Zaichun, only son of Xianfeng. Thirteen years he reigned, with both Empresses Dowager Ci\'an and Cixi ruling from behind the curtain, and Prince Gong Yixin as regent — the "Tongzhi Restoration." He died young at nineteen, of smallpox or syphilis, the tradition says.',
  },
  'hist-yang-xiuqing': {
    zh: '原為廣西燒炭工。太平天國東王,實際軍政首腦。智略過人,組織嚴密,太平軍前期勝利賴其多。後恃功驕橫,要求洪秀全封其為「萬歲」。洪秀全與北王韋昌輝合謀,於天京之變誅之,夷家屬部下二萬餘人。',
    en: 'Originally a charcoal-burner of Guangxi. East King of the Taiping Heavenly Kingdom, in truth the head of its army and government. Of fine wits and tight order, the early Taiping victories owed much to him. Proud later on his merit, he asked Hong Xiuquan to make him a "Ten-Thousand-Year Lord." Hong Xiuquan and the North King Wei Changhui plotted together, killed him in the Tianjing incident, and slaughtered over twenty thousand of his household and following.',
  },
  'hist-liu-mingchuan': {
    zh: '字省三,安徽肥西人。淮軍出身,清末名將。中法戰爭中,守台灣有功。後任首任台灣巡撫,興建鐵路、電報、煤礦,號「台灣近代化之父」。',
    en: 'Style Xingsan, of Feixi in Anhui. Of Huai Army stock, a famed general of late Qing. In the Sino-French War he held Taiwan with merit. He later became the first Governor of Taiwan, building railways, telegraphs, and coal mines — the "father of Taiwan\'s modernization."',
  },
  'hist-liu-yongfu': {
    zh: '字淵亭,廣東欽州人。黑旗軍領袖。中法戰爭中,大破法軍於越南。後守台灣,日本割台,劉永福組臺灣民主國抗日。終敗走廈門。',
    en: 'Style Yuanting, of Qinzhou in Guangdong. Leader of the Black Flag Army. In the Sino-French War he broke the French in Vietnam. Later he held Taiwan; when Japan took Taiwan, Liu Yongfu organized the Republic of Taiwan in resistance. He was at last broken and fled to Xiamen.',
  },
  'hist-meng-gong': {
    zh: '字璞玉,隨州棗陽人。南宋抗蒙古名將。連敗蒙古軍,收復襄陽,抵抗四十年。卒於官,蒙古聞之大喜。',
    en: 'Style Puyu, of Zaoyang in Suizhou. A famed Southern Song general against the Mongols. He broke the Mongols many times, recovered Xiangyang, and resisted for forty years. He died in office, and the Mongols rejoiced when they heard.',
  },
  'hist-yu-jie': {
    era: { zh: '釣魚城', en: 'Defender of Diaoyu City' },
    zh: '字義甫,瀘州人。南宋抗蒙古名將。在合州築釣魚城,以扼蒙古入川之路。蒙哥汗親征,於釣魚城下中流矢而死,蒙古撤兵,世界歷史為之轉折。卒於官,蒙古軍三十六年攻釣魚城不下。',
    en: 'Style Yifu, of Luzhou. A famed Southern Song general against the Mongols. At Hezhou he built Diaoyu City to block the Mongol road into Sichuan. Möngke Khan came in person and was struck by a stray arrow at the walls of Diaoyu — the Mongols withdrew, and world history turned. Yu Jie died in office; the Mongols laid siege to Diaoyu for thirty-six years without success.',
  },
  'hist-li-cunxiao': {
    era: { zh: '王不過項,將不過李', en: '"No King Like Xiang; No General Like Li"' },
    zh: '字義成,代州飛狐人。李克用養子。武勇絕倫,號「飛虎將」、「五代第一猛將」。後因克用愛馬之事被讒,以五馬分屍而死。「王不過項,將不過李」之語出此。',
    en: 'Style Yicheng, of Feihu in Daizhou. Adopted son of Li Keyong. Of peerless prowess — "the Flying Tiger General" and "first warrior of the Five Dynasties." Through a slander over Keyong\'s prized horse he was torn apart by five chariots. "No king like Xiang Yu; no general like Li Cunxiao" comes from this.',
  },
  'hist-li-cunxin': {
    zh: '李克用養子,十三太保之一。從李存勖征戰。',
    en: 'An adopted son of Li Keyong, one of the Thirteen Adopted Sons. He marched with Li Cunxu in war.',
  },
  'hist-yelu-deguang': {
    era: { zh: '遼太宗', en: 'Emperor Taizong of Liao' },
    zh: '耶律阿保機次子。在位二十年。受石敬瑭割燕雲十六州,改國號大遼。後攻後晉,入汴京,然中原人不附,北歸途中卒於欒城,屍體被剖去腸胃,以鹽塗腹,號「帝羓」,千古笑談。',
    en: 'Second son of Yelu Abaoji. Twenty years he reigned. He received the Sixteen Prefectures from Shi Jingtang and changed the dynasty name to Great Liao. Marching on Later Jin, he entered Bianjing — but the people of the central plains would not follow, and on the road north he died at Luancheng. His belly was cut open, his bowels removed, the cavity packed with salt — they called him the "Emperor Jerky," a tale of laughter for the ages.',
  },
  'hist-xiao-taihou': {
    era: { zh: '蕭太后', en: 'Empress Dowager Xiao' },
    zh: '名綽,字燕燕,遼景宗皇后。景宗死,聖宗即位,蕭太后臨朝攝政二十七年。內修文治,外與宋戰,澶淵之盟由是而成。世稱遼朝第一賢后。',
    en: 'Personal name Chuo, style Yanyan, empress of Emperor Jingzong of Liao. When the emperor died and Shengzong took the throne, Empress Dowager Xiao held court for twenty-seven years. Within she ordered the civil arts; without she fought Song — and from her came the Chanyuan treaty. Held as the first worthy empress of Liao.',
  },
  'hist-wanyan-yong': {
    era: { zh: '金世宗', en: 'Emperor Shizong of Jin' },
    zh: '金第五代皇帝,完顏雍。在位二十九年。誅完顏亮,迎宋還孔孟,行漢制,號「大定之治」,金朝最盛之時。',
    en: 'Fifth emperor of Jin, Wanyan Yong. Twenty-nine years he reigned. He killed Wanyan Liang, restored Confucius and Mencius to Song honor, applied Chinese institutions — the "Reign of Dading," the peak of Jin.',
  },
};
