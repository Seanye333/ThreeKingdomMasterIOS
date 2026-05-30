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
};
