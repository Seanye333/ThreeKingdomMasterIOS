/**
 * 名將台詞 — signature spoken lines for famous warriors, used in the 3D 單挑 so
 * a great general taunts and finishes in their own voice rather than a generic
 * persona barb. Each officer has a pool of 挑釁 (pre-duel goads) and 必殺 (lines
 * cried on an unleashed finisher). Unknown officers fall back to the persona
 * lines in data/battleLines.ts.
 */
export interface OfficerLines { taunt: Array<{ zh: string; en: string }>; ult: Array<{ zh: string; en: string }>; }

const L = (zh: string, en: string) => ({ zh, en });

export const OFFICER_DUEL_LINES: Record<string, OfficerLines> = {
  // ─── 2026-07 補:侦查發現的未覆蓋名將,此前回落到 battleLines.ts 的 persona 通用詞 ───
  'yan-liang': {
    taunt: [L('河北顏良在此,誰敢一戰?', 'Yan Liang of Hebei stands here — who dares fight?'), L('連斬曹將,爾等何足道哉!', 'I have felled Cao\'s generals — you are beneath notice!')],
    ult: [L('大刀一舉,取爾首級!', 'My great blade rises — your head is forfeit!'), L('河北上將,名不虛傳!', 'A champion of Hebei — the name is well earned!')],
  },
  'wen-chou': {
    taunt: [L('河北文醜,誰與爭鋒?', 'Wen Chou of Hebei — who contends with me?'), L('顏良之仇,今日必報!', "Today I avenge Yan Liang!")],
    ult: [L('槍出如龍,爾命休矣!', 'My spear strikes like a dragon — your life ends!'), L('延津渡口,血染徵袍!', 'At Yanjin ford my war-robe runs red!')],
  },
  'hua-xiong': {
    taunt: [L('都督華雄在此,鼠輩退避!', 'Commander Hua Xiong is here — scatter, vermin!'), L('十八路諸侯,無人敢當!', 'Eighteen lords, and not one dares face me!')],
    ult: [L('關西刀法,一刀兩斷!', 'The blade-art of Guanxi cleaves you in two!'), L('汜水關前,人頭滾滾!', 'At Sishui Pass the heads roll!')],
  },
  'ji-ling': {
    taunt: [L('淮南上將紀靈,取爾狗命!', 'Ji Ling of Huainan comes for your worthless life!'), L('三尖兩刃,誰人能擋?', 'My three-pointed blade — who can withstand it?')],
    ult: [L('五十斤大刀,力劈華山!', 'My fifty-catty blade could split a mountain!'), L('關雲長又如何,某亦不懼!', 'Even Guan Yu — I do not fear him!')],
  },
  'zhang-ren': {
    taunt: [L('蜀中張任,豈容爾等犯境!', 'Zhang Ren of Shu — you dare cross our borders?'), L('落鳳坡下,亂箭已備!', 'At Fallen Phoenix Slope, the arrows are already nocked!')],
    ult: [L('一弩穿心,萬箭齊發!', 'One bolt through the heart — loose every arrow!'), L('忠臣不事二主,死戰到底!', 'A loyal minister serves one lord only — I fight to the death!')],
  },
  'wei-yan': {
    taunt: [L('大將魏延在此,誰敢來戰?', 'General Wei Yan stands here — who dares come?'), L('子午奇謀,惜乎不用!', 'My Ziwu Valley gambit — a pity it was never used!')],
    ult: [L('反骨又如何,看我大刀!', 'Traitor\'s bones or not — face my blade!'), L('長沙魏延,取上將首級!', 'Wei Yan of Changsha takes a champion\'s head!')],
  },
  'guan-xing': {
    taunt: [L('關興在此,為父報仇!', 'Guan Xing is here — to avenge my father!'), L('虎父無犬子,看我手段!', 'No tiger sires a dog — witness my skill!')],
    ult: [L('青龍刀在,父仇必報!', 'The Green Dragon blade endures — my father is avenged!'), L('夷陵陣前,斬將奪旗!', 'Before Yiling I cut down foes and seize their banners!')],
  },
  'ding-feng': {
    taunt: [L('江東丁奉,老當益壯!', 'Ding Feng of the south — old, and fiercer for it!'), L('雪中短兵,取爾性命!', 'Short blades in the snow — your life is mine!')],
    ult: [L('奮短兵,破強敵!', 'Short steel unleashed — the strong foe falls!'), L('三代元勳,豈是虛名?', 'Elder of three reigns — no empty title!')],
  },
  'liao-hua': {
    taunt: [L('廖化雖老,尚能提刀!', 'Old as I am, I can still lift my blade!'), L('蜀中先鋒,豈容小覷!', 'The vanguard of Shu — do not make light of me!')],
    ult: [L('一生征戰,老而彌堅!', 'A lifetime at war — the harder for the years!'), L('隨丞相北伐,死而後已!', 'I marched north with the Chancellor — until my last breath!')],
  },
  'wang-shuang': {
    taunt: [L('魏將王雙,誰敢攖鋒?', 'Wang Shuang of Wei — who braves my edge?'), L('流星錘下,無人生還!', 'None survive my meteor hammer!')],
    ult: [L('大刀流星,連斬蜀將!', 'Blade and hammer — I fell the men of Shu one by one!'), L('陳倉道上,取爾首級!', 'On the Chencang road, your head is mine!')],
  },
  'lu-bu': {
    taunt: [L('天下英雄,誰敢與我一戰?', 'Heroes of the realm — who dares face me?'), L('量你也不過如此!', 'You are nothing before me!')],
    ult: [L('方天畫戟,取你首級!', 'My Sky Piercer takes your head!'), L('人中呂布,馬中赤兔!', 'Lü Bu among men, Red Hare among horses!')],
  },
  'guan-yu': {
    taunt: [L('插標賣首之輩,也敢攔我?', 'A head for sale — and you bar my way?'), L('吾觀汝首,如探囊取物。', 'Your head is mine for the taking.')],
    ult: [L('青龍偃月,斬!', 'Green Dragon Blade — cut him down!'), L('待我提刀,過五關!', 'My blade carves through all who stand!')],
  },
  'zhang-fei': {
    taunt: [L('燕人張飛在此,誰敢決死戰!', 'Zhang Fei of Yan stands here — who dares fight to the death!'), L('喝!匹夫休走!', 'Hold, coward! Stand and fight!')],
    ult: [L('丈八蛇矛,取你性命!', 'My Serpent Spear ends you!'), L('當陽橋頭,聲震如雷!', 'My roar at Changban shakes the earth!')],
  },
  'zhao-yun': {
    taunt: [L('常山趙子龍在此!', 'Zhao Zilong of Changshan stands before you!'), L('七進七出,何懼於汝?', 'Seven charges through a host — why fear you?')],
    ult: [L('一身是膽,看槍!', 'All courage — taste my spear!'), L('長坂坡前,無人能擋!', 'None stopped me at Changban!')],
  },
  'ma-chao': {
    taunt: [L('錦馬超在此,曹賊膽寒!', 'Ma Chao the Splendid — let traitors tremble!'), L('西涼鐵騎,踏破爾營!', 'My Liang riders will trample your camp!')],
    ult: [L('為父報仇,看槍!', 'For my father — my spear!'), L('銀甲白袍,無堅不摧!', 'Silver mail, white robe — nothing withstands me!')],
  },
  'dian-wei': {
    taunt: [L('古之惡來,豈容爾等放肆!', 'The Wicked Lai of old — mind your tongue!'), L('某在此,賊休近前!', 'I stand here — come no closer, knave!')],
    ult: [L('雙戟在手,有死無生!', 'Twin halberds in hand — none survive!'), L('護主拼命,殺!', 'For my lord, to the death!')],
  },
  'xu-chu': {
    taunt: [L('虎癡許褚,與你一搏!', 'Tiger-fool Xu Chu — let us grapple!'), L('裸衣鬥馬超,亦不在話下!', 'I fought Ma Chao bare-chested — you are nothing!')],
    ult: [L('力大無窮,看招!', 'Boundless strength — take this!'), L('某這一拳,碎金裂石!', 'My blow shatters gold and stone!')],
  },
  'taishi-ci': {
    taunt: [L('東萊太史慈,特來會你!', 'Taishi Ci of Donglai comes to meet you!'), L('神亭一戰,可還記得?', 'Do you recall our duel at Shenting?')],
    ult: [L('箭無虛發,弓開如月!', 'My arrows never miss — the bow bends like the moon!'), L('大丈夫當帶三尺劍,立不世之功!', 'A true man wins deathless glory by the sword!')],
  },
  'gan-ning': {
    taunt: [L('錦帆賊甘興霸在此!', 'Gan Xingba of the Brocade Sails is here!'), L('百騎劫營,何曾怕死?', 'A hundred riders raided a camp — death holds no fear!')],
    ult: [L('鈴響弓鳴,授首吧!', 'Bells ring, bow sings — yield your head!'), L('江東之虎,撕碎爾等!', 'The tiger of the south tears you apart!')],
  },
  'huang-zhong': {
    taunt: [L('老將黃忠,寶刀未老!', 'Old Huang Zhong — my blade is far from blunt!'), L('莫欺我年邁,看箭!', 'Mock my grey hairs? Then taste my arrow!')],
    ult: [L('百步穿楊,一箭斃命!', 'A hundred paces, one arrow, one kill!'), L('定軍山上,斬夏侯!', 'At Mount Dingjun I felled Xiahou!')],
  },
  'zhang-liao': {
    taunt: [L('張遼在此,誰來受死!', 'Zhang Liao stands here — who comes to die!'), L('八百破十萬,豈懼於汝!', 'Eight hundred broke a hundred thousand — why fear you!')],
    ult: [L('威震逍遙津,看刀!', 'The terror of Xiaoyao Ford — my blade!'), L('止啼小兒,今日授首!', 'I who silence crying children — yield your head!')],
  },
  'sun-ce': {
    taunt: [L('江東小霸王,會你一會!', 'The Little Conqueror of the south greets you!'), L('父業我承,何人敢擋?', 'I carry my father\'s work — who dares bar me?')],
    ult: [L('一槍挑落,定江東!', 'One spear-thrust to win the south!'), L('小霸王之名,非浪得也!', 'My name is no idle boast!')],
  },
  'pang-de': {
    taunt: [L('抬櫬而來,有死無還!', 'I bear my own coffin — there is no road back!'), L('關某縱勇,某亦不懼!', 'Brave as Guan may be, I do not fear him!')],
    ult: [L('決死一戰,看我刀!', 'A fight to the death — my blade!'), L('白袍染血,亦不退半步!', 'Bloodied robe and all, I yield no step!')],
  },
  'zhang-he': {
    taunt: [L('河間張郃,善能巧變!', 'Zhang He of Hejian — master of the cunning shift!'), L('爾之破綻,某已盡知。', 'Your every weakness, I already see.')],
    ult: [L('巧變一擊,防不勝防!', 'A cunning blow you cannot guard!'), L('用兵如神,豈在力哉?', 'War is wit, not brute strength!')],
  },
  'xiahou-dun': {
    taunt: [L('盲夏侯在此,誰敢爭鋒!', 'Blind Xiahou stands here — who dares cross me!'), L('父精母血,豈可棄之!', 'Flesh of my parents — I will not cast it away!')],
    ult: [L('拔矢啖睛,有進無退!', 'I swallowed my own eye — I never retreat!'), L('獨眼一怒,取你性命!', 'One eye, one fury — your life is forfeit!')],
  },
  'xiahou-yuan': {
    taunt: [L('妙才神速,你逃不掉!', 'Swift Miaocai — there is no escape!'), L('三日五百,六日一千!', 'Five hundred li in three days, a thousand in six!')],
    ult: [L('神射一箭,例不虛發!', 'My arrow flies — and never misses!'), L('疾如奔雷,授首吧!', 'Swift as thunder — yield your head!')],
  },
  'xu-huang': {
    taunt: [L('長驅直入,有周亞夫之風!', 'A headlong charge — the bearing of Zhou Yafu!'), L('治軍嚴整,豈容爾放肆!', 'My ranks are iron — mind your insolence!')],
    ult: [L('一斧開山,擋者披靡!', 'My axe cleaves mountains — all before it scatter!'), L('長驅而入,直取中軍!', 'Straight through to your heart of battle!')],
  },
  'jiang-wei': {
    taunt: [L('天水姜伯約,文武兼資!', 'Jiang Boyue of Tianshui — blade and mind alike!'), L('武侯所傳,豈是虛名?', 'The Marquis taught me well — no idle boast!')],
    ult: [L('文武雙絕,看我槍!', 'Sword and stratagem as one — my spear!'), L('繼承遺志,九伐中原!', 'I carry the dream — nine campaigns north!')],
  },
  'zhou-tai': {
    taunt: [L('周泰護主,身被數創亦不退!', 'Zhou Tai guards his lord — wounds and all, I hold!'), L('這一身傷疤,皆是功勳!', 'Each scar I bear is a deed of valour!')],
    ult: [L('九處創傷,拼死一擊!', 'Nine wounds — and a death-defying blow!'), L('刀山火海,某亦敢闖!', 'Through blades and fire I have charged!')],
  },
  'wen-yang': {
    taunt: [L('文鴦在此,雄兵且退!', 'Wen Yang stands here — let the host fall back!'), L('單騎入陣,有進無退!', 'One rider into the host — only forward!')],
    ult: [L('七進七出,殺個痛快!', 'Seven charges in and out — a glorious slaughter!'), L('小將軍之勇,趙雲再世!', 'A valour reborn from Zhao Yun himself!')],
  },
  'sun-jian': {
    taunt: [L('江東猛虎孫文台在此!', 'Sun Wentai, the Tiger of Jiangdong, is here!'), L('斬華雄者,正是孫某!', 'It was I who would fell Hua Xiong!')],
    ult: [L('猛虎一撲,撕碎爾等!', 'The tiger pounces — and tears you apart!'), L('古錠刀下,有死無生!', 'Beneath my Gu Ding blade, none survive!')],
  },
  'deng-ai': {
    taunt: [L('鄧士載在此,口吃心不吃!', 'Deng Shizai stands here — my tongue stammers, my mind does not!'), L('偷渡陰平,豈是常人能為?', 'Who but I could cross Yinping in secret?')],
    ult: [L('出其不意,一擊制勝!', 'Where none expect — one blow to decide all!'), L('裹氈而下,有死無還!', 'I rolled down the cliffs wrapped in felt — there is no road back!')],
  },
  'gao-shun': {
    taunt: [L('陷陣營在此,陷無不破!', 'The Trap-Breaker Camp stands here — no line we cannot break!'), L('某之所至,陣腳必亂!', 'Where I charge, your ranks shatter!')],
    ult: [L('陷陣破敵,一鼓而下!', 'Break the line — take it at a stroke!'), L('七百陷陣,當者披靡!', 'Seven hundred break-ranks — all before us scatter!')],
  },
  'cao-zhang': {
    taunt: [L('黃鬚兒在此,誰敢爭鋒!', 'The Yellow-Beard stands here — who dares cross me!'), L('某能手格猛獸,何懼於汝!', 'I wrestle wild beasts bare-handed — why fear you!')],
    ult: [L('萬夫不當,看我一擊!', 'Match for ten thousand — take this blow!'), L('率師北征,所向無前!', 'I marched north and nothing stood before me!')],
  },
  'gongsun-zan': {
    taunt: [L('白馬將軍公孫瓚在此!', 'Gongsun Zan, the White-Horse General, is here!'), L('白馬義從,縱橫河北!', 'My White-Horse Volunteers sweep all Hebei!')],
    ult: [L('白馬銀槍,取你性命!', 'White horse, silver spear — your life is mine!'), L('一箭穿心,例不虛發!', 'One arrow through the heart — and it never misses!')],
  },
  'ling-tong': {
    taunt: [L('江東凌公績在此!', 'Ling Gongji of Jiangdong stands here!'), L('某與你死戰到底!', 'I will fight you to the very end!')],
    ult: [L('拼將一死,看我刀!', 'I stake my life — taste my blade!'), L('沙場之上,有進無退!', 'On the field of war, only forward!')],
  },
  'huang-gai': {
    taunt: [L('老將黃公覆在此!', 'Old Huang Gongfu stands here!'), L('苦肉之計,某甘領之!', 'The bitter-flesh ruse — gladly I bore it!')],
    ult: [L('鐵鞭一擊,碎你天靈!', 'One stroke of my iron whip shatters your skull!'), L('赤壁火起,某當先鋒!', 'When Red Cliff burned, I led the van!')],
  },
  'zhu-rong': {
    taunt: [L('祝融夫人在此,休得無禮!', 'Lady Zhurong stands here — mind your manners!'), L('飛刀百發百中,爾敢一試?', 'My hurled blades never miss — care to try?')],
    ult: [L('飛刀絕殺,取你首級!', 'A hurled blade, a certain kill — your head is forfeit!'), L('火神之裔,豈容小覷!', 'Heir to the Fire God — do not take me lightly!')],
  },
  'meng-huo': {
    taunt: [L('南蠻之王孟獲在此!', 'Meng Huo, King of the Nanman, stands here!'), L('縱被擒七次,某亦不服!', 'Take me seven times — still I will not yield!')],
    ult: [L('蠻力一擊,山崩地裂!', 'A savage blow — mountains crack and earth splits!'), L('犀甲在身,刀槍難入!', 'In rhino-hide, no blade can pierce me!')],
  },
  'yan-yan': {
    taunt: [L('老夫嚴顏在此,斷頭將軍是也!', 'Old Yan Yan stands here — the "Headless General"!'), L('但有斷頭將軍,無降將軍!', 'This land has beheaded generals — never surrendered ones!')],
    ult: [L('老當益壯,看我這一刀!', 'Old and only fiercer — taste my blade!'), L('白髮蒼蒼,志不稍減!', 'Grey of hair, undimmed of will!')],
  },
  'ma-dai': {
    taunt: [L('西涼馬岱在此,誰來受死!', 'Ma Dai of Xiliang stands here — who comes to die!'), L('鐵騎所至,踏破爾營!', 'Where my iron cavalry rides, your camp is trampled!')],
    ult: [L('西涼鐵騎,一錘定音!', 'Iron cavalry of Xiliang — one blow ends it!'), L('丞相遺計,某來執行!', 'The Chancellor\'s last command — I carry it out!')],
  },
  'zhang-bao': {
    taunt: [L('燕人張苞在此,父風猶在!', 'Zhang Bao of Yan stands here — my father\'s fire lives on!'), L('丈八蛇矛,某亦能使!', 'The Serpent Spear — I wield it too!')],
    ult: [L('燕人之吼,聲震九霄!', 'The roar of Yan shakes the heavens!'), L('繼承父志,殺!', 'I carry my father\'s will — to the death!')],
  },
  'zhou-cang': {
    taunt: [L('某周倉,願為關公扛刀!', 'I am Zhou Cang — I bear Lord Guan\'s blade!'), L('莫看某是步將,擒你綽綽有餘!', 'A foot-soldier I may be — taking you is easy enough!')],
    ult: [L('虎背一扛,力撼千鈞!', 'My bear-back heaves — a thousand jun of force!'), L('水中擒將,某之所長!', 'Taking a foe in the water — that is my craft!')],
  },
  'guo-huai': {
    taunt: [L('某郭伯濟,料敵於先!', 'I am Guo Boji — I read the foe before he moves!'), L('關右之事,某瞭如指掌。', 'The west is mine to know, every inch of it.')],
    ult: [L('機先一擊,你已敗了!', 'I strike where you will be — you are already lost!'), L('用兵貴謀,豈在匹夫之勇?', 'War is foresight — not a brute\'s courage!')],
  },
  'hao-zhao': {
    taunt: [L('某郝伯道,守城之將也!', 'I am Hao Bodao — a holder of walls!'), L('千餘守軍,亦教爾無功而返!', 'A thousand men, and still I send you home empty!')],
    ult: [L('死守不退,看某這一槍!', 'I yield nothing — taste my spear!'), L('陳倉城下,寸土不讓!', 'Below Chencang, not one foot of ground!')],
  },
  'cao-zhen': {
    taunt: [L('某曹子丹,虎豹之裔!', 'I am Cao Zidan, heir to the Tiger Cavalry!'), L('大將軍在此,誰敢放肆!', 'The Grand Marshal stands here — who dares be insolent!')],
    ult: [L('虎豹遺風,一擊建功!', 'The Tiger Cavalry\'s legacy — one blow wins the day!'), L('某射虎搏獸,何懼於汝!', 'I shoot tigers and grapple beasts — why fear you!')],
  },
  'zhu-huan': {
    taunt: [L('某朱休穆,攻守相生!', 'I am Zhu Xiumu — bulwark and sally as one!'), L('以寡敵眾,某之常事!', 'Few against many — that is my daily work!')],
    ult: [L('看某一擊,攻守俱絕!', 'One blow — flawless in attack and guard alike!'), L('濡須之畔,教曹兵喪膽!', 'At Ruxu I left the Wei host trembling!')],
  },
  'cheng-pu': {
    taunt: [L('某程德謀,江表元勳!', 'I am Cheng Demou — elder of the southern host!'), L('三世舊將,豈懼後生?', 'A veteran of three lords — why fear a stripling?')],
    ult: [L('老臣一矛,沉穩致命!', 'An old vassal\'s spear — steady and lethal!'), L('江東基業,某與有功焉!', 'Jiangdong\'s rise — I had my hand in it!')],
  },
  'wen-pin': {
    taunt: [L('某文仲業,江夏砥柱!', 'I am Wen Zhongye — the bastion of Jiangxia!'), L('守此一方,某當仁不讓!', 'I hold this border, and yield it to no one!')],
    ult: [L('砥柱一擊,中流不倒!', 'A bastion\'s blow — unmoved in the torrent!'), L('某守江夏,東吳難越雷池!', 'While I hold Jiangxia, Wu shall not pass!')],
  },
  'ma-zhong-wu': {
    taunt: [L('某馬忠,伏路專候名將!', 'I am Ma Zhong — I lie in wait for famous men!'), L('絆馬索一起,看你往哪裡逃!', 'My trip-ropes spring — where will you flee?')],
    ult: [L('伏路擒龍,一網成擒!', 'An ambush for a dragon — the net falls shut!'), L('縱是萬人敵,亦難逃此伏!', 'Even a foe of myriads cannot slip this snare!')],
  },
  'xiahou-ba': {
    taunt: [L('某夏侯仲權,虎步關右!', 'I am Xiahou Zhongquan — I stride the west like a tiger!'), L('家門之仇,某必報之!', 'My family\'s blood-debt — I will repay it!')],
    ult: [L('虎步一擊,關右無敵!', 'A tiger\'s stride, a blow none in the west withstands!'), L('縱投他國,武勇不減!', 'Though I changed my banner, my valour holds!')],
  },
  // ── 千古名將(hist- 池)──
  'hist-xiang-yu': {
    taunt: [L('力拔山兮氣蓋世!', 'My strength uproots mountains, my spirit cloaks the age!'), L('彼可取而代也!', 'That throne — I could take it for my own!')],
    ult: [L('破釜沉舟,有死無生!', 'Sink the boats, smash the cauldrons — no retreat!'), L('此天亡我,非戰之罪!', 'Heaven undoes me — no fault of my sword!')],
  },
  'hist-bai-qi': {
    taunt: [L('某武安君白起也!', 'I am Bai Qi, Lord Wu\'an!'), L('六國之師,皆喪我手。', 'The hosts of six kingdoms perished by my hand.')],
    ult: [L('長平一坑,殺神之名!', 'The pits of Changping — the God of Slaughter\'s name!'), L('戰必勝,攻必取!', 'Every battle won, every fortress taken!')],
  },
  'hist-han-xin': {
    taunt: [L('國士無雙,韓信是也!', 'Peerless statesman — I am Han Xin!'), L('將兵多多益善耳!', 'The more troops you give me, the better!')],
    ult: [L('背水一戰,置之死地!', 'Back to the river — a fight to the death!'), L('明修棧道,暗度陳倉!', 'Mend the roads in the open, cross at Chencang in the dark!')],
  },
  'hist-huo-qubing': {
    taunt: [L('匈奴未滅,何以家為!', 'The Xiongnu unbroken — what use have I for a home!'), L('長驅千里,直搗王庭!', 'A thousand li in a charge — straight to the Khan\'s court!')],
    ult: [L('封狼居胥,飲馬瀚海!', 'Banner on Wolf-Stone Mount, horses watered at the northern sea!'), L('閃電奔襲,匈奴喪膽!', 'A lightning raid — the Xiongnu lose heart!')],
  },
  'hist-li-guang': {
    taunt: [L('飛將軍李廣在此!', 'Li Guang, the Flying General, stands here!'), L('胡人聞我名,不敢南下。', 'The nomads hear my name and dare not ride south.')],
    ult: [L('一箭沒石,神射無雙!', 'My arrow sinks into stone — a peerless shot!'), L('射虎之臂,豈虛言哉!', 'This arm felled a tiger — no idle boast!')],
  },
  'hist-li-cunxiao': {
    taunt: [L('十三太保李存孝在此!', 'Li Cunxiao, the Thirteenth Champion, stands here!'), L('王不過項,將不過李!', 'No king surpassed Xiang Yu; no general, me!')],
    ult: [L('天下無敵,看我一槍!', 'Unmatched under heaven — taste my spear!'), L('力舉千鈞,勢不可當!', 'I heave a thousand jun — nothing can withstand it!')],
  },
  'hist-yue-fei': {
    taunt: [L('精忠報國,岳飛在此!', 'Utmost loyalty to the realm — Yue Fei stands here!'), L('還我河山,壯志未酬!', 'Give back our rivers and hills — my vow unfulfilled!')],
    ult: [L('瀝泉神矛,直搗黃龍!', 'My Liquan spear drives straight to Huanglong!'), L('撼山易,撼岳家軍難!', 'Easier to shake a mountain than the army of Yue!')],
  },
  'hist-chang-yuchun': {
    taunt: [L('常遇春在此,人稱常十萬!', 'Chang Yuchun — they call me "Chang Ten-Thousand"!'), L('某一人,可當十萬眾!', 'I alone am worth a host of a hundred thousand!')],
    ult: [L('萬夫莫當,看我一擊!', 'Match for ten thousand — take this blow!'), L('先登陷陣,所向披靡!', 'First over the wall — all before me scatter!')],
  },
  'hist-xue-rengui': {
    taunt: [L('白袍薛仁貴在此!', 'Xue Rengui in his white robe stands here!'), L('將軍三箭定天山!', 'Three arrows of the general settled all Tianshan!')],
    ult: [L('三箭連珠,天山震服!', 'Three arrows in a string — Tianshan submits!'), L('白袍一掃,敵軍奪氣!', 'A sweep of the white robe — the foe loses heart!')],
  },
  'hist-yuchi-gong': {
    taunt: [L('某尉遲敬德,鋼鞭在手!', 'I am Yuchi Jingde — iron whip in hand!'), L('單鞭可奪槊,爾敢一試?', 'My whip can wrest a lance — care to try?')],
    ult: [L('單鞭奪槊,一擊定音!', 'Whip takes the lance — one blow decides!'), L('鋼鞭所至,槊折人亡!', 'Where my whip falls, lances break and men die!')],
  },
  'hist-tian-dan': {
    taunt: [L('即墨田單,火牛在後!', 'Tian Dan of Jimo — the fire-oxen at my back!'), L('燕軍雖眾,某有奇計!', 'The Yan host is great, but I have a stratagem!')],
    ult: [L('火牛破陣,燎原千里!', 'Fire-oxen shatter the line — flames for a thousand li!'), L('一戰復齊,七十餘城!', 'One battle restored Qi — seventy cities and more!')],
  },
  'hist-qi-jiguang': {
    taunt: [L('某戚繼光,專破倭寇!', 'I am Qi Jiguang — bane of the pirates!'), L('鴛鴦陣法,進退有度!', 'My Mandarin-Duck formation — flawless in advance and retreat!')],
    ult: [L('鴛鴦破陣,一鼓殲敵!', 'The Mandarin-Duck breaks the line — annihilation at one stroke!'), L('封侯非我意,但願海波平!', 'No rank I seek — only calm upon the seas!')],
  },
  'hist-genghis': {
    taunt: [L('普天之下,皆我牧場!', 'All under heaven is my pasture!'), L('一代天驕,捨我其誰?', 'Pride of an age — who else but me?')],
    ult: [L('鐵騎所至,踏平天下!', 'Where my horsemen ride, the world is trampled flat!'), L('彎弓射鵰,一發貫日!', 'I bend the bow at eagles — one shot pierces the sun!')],
  },
  'hist-tang-taizong': {
    taunt: [L('天策上將李世民在此!', 'Li Shimin, Lord of Heaven\'s Strategy, stands here!'), L('某能定鼎天下,豈懼一將?', 'I won an empire — why fear one general?')],
    ult: [L('天策一擊,定鼎乾坤!', 'A blow of Heaven\'s Strategy — and the realm is settled!'), L('玄甲鐵騎,所向無前!', 'My black-armoured riders — nothing stands before them!')],
  },
  'hist-yang-ye': {
    taunt: [L('楊無敵在此,遼兵聞風喪膽!', 'Yang the Invincible stands here — the Liao tremble at my name!'), L('某鎮邊關,寸土不讓!', 'I hold the frontier — not one foot of ground!')],
    ult: [L('無敵之名,看我這一槍!', 'The Invincible\'s name — taste my spear!'), L('縱馬革裹屍,忠魂不滅!', 'Wrapped in a horse-hide, my loyal soul lives on!')],
  },
  'hist-fan-kuai': {
    taunt: [L('某樊噲,鴻門宴上撞帳而入!', 'I am Fan Kuai — I crashed into the Hongmen tent!'), L('生啖彘肩,飲酒斗餘!', 'I ate a raw pork-shoulder and drank a gallon of wine!')],
    ult: [L('力撞營門,沛公得脫!', 'I smash the camp-gate — and my lord wins free!'), L('猛士在此,項王亦壯之!', 'A true warrior — even the King of Chu admired me!')],
  },
  'hist-zhao-kuangyin': {
    taunt: [L('某趙匡胤,一條盤龍棍打下四百軍州!', 'I am Zhao Kuangyin — my Coiled-Dragon cudgel won four hundred prefectures!'), L('太祖長拳,天下無對!', 'My Founder\'s Fist has no equal under heaven!')],
    ult: [L('盤龍棍起,橫掃千軍!', 'The Coiled-Dragon rises — and sweeps a thousand foes!'), L('黃袍加身,當有此威!', 'The yellow robe is mine — and with it, this might!')],
  },
  'hist-wuzhu': {
    taunt: [L('大金兀朮在此,南朝誰敢當?', 'Wuzhu of the Great Jin stands here — who in the south dares face me?'), L('鐵浮屠拐子馬,踏破中原!', 'My iron-pagoda cavalry tramples the Central Plains!')],
    ult: [L('鐵騎一衝,山河變色!', 'One charge of iron horse — and the land changes colour!'), L('縱有岳飛,某亦不懼!', 'Even Yue Fei — I do not fear him!')],
  },
  'hist-mu-guiying': {
    taunt: [L('穆桂英掛帥,誰敢小覷女流?', 'Mu Guiying takes command — who dares scorn a woman?'), L('楊門女將,巾幗不讓鬚眉!', 'Lady-general of the Yang — no less than any man!')],
    ult: [L('梨花槍法,百步穿心!', 'My Pear-Blossom Spear pierces hearts at a hundred paces!'), L('大破天門陣,看我神威!', 'I shattered the Heaven-Gate Formation — behold my might!')],
  },
  'hist-luo-cheng': {
    taunt: [L('某羅成,羅家槍法天下知!', 'I am Luo Cheng — the Luo-Family Spear is known to all!'), L('回馬一槍,例不落空!', 'My wheeling spear-thrust never misses!')],
    ult: [L('回馬羅槍,取你性命!', 'Luo\'s wheeling spear — your life is forfeit!'), L('一桿銀槍,挑盡群雄!', 'One silver spear unhorses every champion!')],
  },
  'hist-yang-youji': {
    taunt: [L('某養由基,百步之外,射楊葉百發百中!', 'I am Yang Youji — a hundred paces off, I split a willow-leaf every time!'), L('天下神射,捨我其誰?', 'The realm\'s finest archer — who else but me?')],
    ult: [L('一箭穿楊,例不虛發!', 'One arrow through the willow — and it never fails!'), L('箭無虛發,弓開如月!', 'No arrow wasted — the bow bends like the moon!')],
  },
  'hist-lanlingwang': {
    taunt: [L('蘭陵王高長恭在此!', 'Gao Changgong, Prince of Lanling, stands here!'), L('某戴面具入陣,只為破敵!', 'I don a mask and charge — only to break the foe!')],
    ult: [L('蘭陵入陣,勢不可當!', 'The Prince of Lanling charges — none can withstand it!'), L('金墉城下,單騎解圍!', 'Below Jinyong I broke the siege alone!')],
  },
  'hist-oboi': {
    taunt: [L('滿洲第一勇士鰲拜在此!', 'Oboi, first warrior of Manchuria, stands here!'), L('某縱橫沙場,何懼於汝?', 'I have ranged every battlefield — why fear you?')],
    ult: [L('巴圖魯之勇,一擊建功!', 'A baturu\'s valour — one blow wins the day!'), L('白甲兵鋒,當者披靡!', 'The white-armoured vanguard — all before it scatter!')],
  },
  'hist-jing-ke': {
    taunt: [L('風蕭蕭兮易水寒!', 'The wind sighs, the Yi waters run cold!'), L('壯士一去兮,不復還!', 'The brave man departs, never to return!')],
    ult: [L('圖窮匕見,一擊必殺!', 'The map unrolls, the dagger flashes — one strike to kill!'), L('事所以不成,惜哉!', 'That it failed — what a pity!')],
  },
  'hist-hua-mulan': {
    taunt: [L('木蘭替父從軍,豈讓鬚眉?', 'Mulan took her father\'s place — no less than any man!'), L('萬里赴戎機,某亦能戰!', 'Ten thousand li to war — and fight I can!')],
    ult: [L('朔氣傳金柝,寒光照鐵衣 — 看招!', 'War-drums on the frost, cold light on my mail — take this!'), L('十二年征戰,豈是虛名?', 'Twelve years of war — no idle name!')],
  },
  'hist-xin-qiji': {
    taunt: [L('某辛幼安,醉裡挑燈看劍!', 'I am Xin You\'an — drunk, I trim the lamp to look on my sword!'), L('五十弦翻塞外聲,沙場點兵!', 'The strings ring with frontier songs — I muster the host!')],
    ult: [L('馬作的盧飛快,弓如霹靂弦驚!', 'My horse flies like Dilu, my bow cracks like thunder!'), L('萬軍叢中,某擒叛將如探囊!', 'In a host of ten thousand I plucked a traitor like a purse!')],
  },
  'hist-cheng-yaojin': {
    taunt: [L('某程咬金,三板斧在此!', 'I am Cheng Yaojin — and here come my three axe-strokes!'), L('半路殺出個程咬金,可怕否?', 'Cheng Yaojin springs from the roadside — afraid yet?')],
    ult: [L('三板斧下,管教你魂飛魄散!', 'Three strokes of my axe and your soul flees your body!'), L('某這板斧,劈山開石!', 'My axe cleaves mountains and splits stone!')],
  },
  'hist-kublai': {
    taunt: [L('大元世祖忽必烈在此!', 'Kublai, Founder of the Great Yuan, stands here!'), L('混一寰宇,普天皆臣!', 'One realm under heaven — all the world my subject!')],
    ult: [L('鐵騎踏破,江山一統!', 'Iron horse tramples through — and the realm is made one!'), L('上承天命,所向無敵!', 'I bear Heaven\'s mandate — none can withstand me!')],
  },
  'hist-tan-daoji': {
    taunt: [L('某檀道濟,豈是爾等可欺?', 'I am Tan Daoji — am I one for you to trifle with?'), L('唱籌量沙,某有奇計!', 'Counting sand as grain — I never want for a ruse!')],
    ult: [L('一擊建功,如卷席而進!', 'One blow wins the day — I roll on like a rolled mat!'), L('乃壞汝萬里長城!', 'You break your own Great Wall by felling me!')],
  },
  'hist-qin-liangyu': {
    taunt: [L('白桿兵主帥秦良玉在此!', 'Qin Liangyu, commander of the White-Staff Brigade, stands here!'), L('巾幗執戈,亦能護國!', 'A woman bears the halberd — and guards the realm no less!')],
    ult: [L('白桿一挑,賊寇喪膽!', 'A thrust of the white staff — the brigands lose heart!'), L('忠貞報國,某無愧於心!', 'Loyal to the realm — my heart bears no shame!')],
  },
  'hist-li-dingguo': {
    taunt: [L('某李定國,兩蹶名王!', 'I am Li Dingguo — I felled two princes of the Qing!'), L('縱明祚將盡,某志不移!', 'Though the Ming wanes, my resolve does not!')],
    ult: [L('象陣一衝,清軍潰散!', 'My war-elephants charge — and the Qing host scatters!'), L('桂林衡州,某威震西南!', 'At Guilin and Hengzhou my name shook the southwest!')],
  },
  'hist-shi-dakai': {
    taunt: [L('翼王石達開在此!', 'Shi Dakai, the Wing-King, stands here!'), L('某縱橫十餘載,未嘗一敗!', 'Ten years I ranged the land and never knew defeat!')],
    ult: [L('翼王破陣,勢如奔雷!', 'The Wing-King breaks the line like a thunderclap!'), L('大渡河畔,某捨命而戰!', 'By the Dadu River, I fight with my life on the line!')],
  },
  'hist-zhao-she': {
    taunt: [L('某趙奢,狹路相逢勇者勝!', 'I am Zhao She — in a narrow pass, the brave man wins!'), L('閼與之圍,某一戰解之!', 'The siege of Eyu — I broke it in a single battle!')],
    ult: [L('居高臨下,勢如破竹!', 'From the heights I sweep down like splitting bamboo!'), L('狹路相逢,看某之勇!', 'A narrow pass — behold a brave man\'s mettle!')],
  },
  'hist-li-cunxu': {
    taunt: [L('某李亞子,生子當如是!', 'I am the Tiger-Cub — "a man should sire a son like this"!'), L('十三太保,某居其首!', 'Of the thirteen champions, I stand foremost!')],
    ult: [L('親冒矢石,先登陷陣!', 'Through arrow and stone I climb first into the breach!'), L('一鼓而下,所向無前!', 'At one drumbeat I take it — nothing stands before me!')],
  },
  'cao-cao': {
    taunt: [L('寧教我負天下人!', 'Better I wrong the world than the world wrong me!'), L('天下英雄,唯使君與操耳!', 'The realm\'s only heroes are you and I!')],
    ult: [L('倚天劍出,順我者生!', 'My Yitian sword is drawn — submit, and live!'), L('某挾天子以令諸侯!', 'I hold the Son of Heaven and command the lords!')],
  },
  'lu-meng': {
    taunt: [L('士別三日,當刮目相看!', 'Three days apart, and you must look at me anew!'), L('白衣渡江,某取荊州如反掌!', 'White-robed I crossed the river — Jingzhou fell to my hand!')],
    ult: [L('暗渡奇襲,一擊定荊襄!', 'A hidden crossing, a surprise stroke — and Jing is mine!'), L('吳下阿蒙,今非昔比!', 'No longer the unread Meng of old!')],
  },
  'hist-zu-ti': {
    taunt: [L('某祖逖,聞雞起舞之人!', 'I am Zu Ti — I who rose to dance at the cock\'s crow!'), L('中流擊楫,不復中原不還!', 'I struck the oar midstream — I will not return till the plains are won!')],
    ult: [L('擊楫中流,北伐建功!', 'Oar struck midstream — the northern march begins!'), L('壯志未酬,某誓復河山!', 'My vow unfulfilled — I swear to win our rivers and hills!')],
  },
  'hist-zhou-yafu': {
    taunt: [L('某周亞夫,細柳治軍!', 'I am Zhou Yafu — the iron camp of Xiliu is mine!'), L('軍中聞將令,不聞天子詔!', 'In camp, men heed the general\'s word — not even the emperor\'s!')],
    ult: [L('堅壁挫敵,一戰平七國!', 'Hold the wall, blunt the foe — seven kingdoms quelled in a stroke!'), L('治軍如鐵,寸步不亂!', 'My army is iron — not one step out of order!')],
  },
  'hist-zheng-chenggong': {
    taunt: [L('某鄭成功,誓復我疆土!', 'I am Zheng Chenggong — sworn to reclaim our land!'), L('開闢荊榛逐荷夷!', 'I cleared the wilds and drove the Dutch from our shores!')],
    ult: [L('跨海東征,光復河山!', 'Across the sea I march — and win back our soil!'), L('縱明祚已盡,某志不渝!', 'Though the Ming is fallen, my resolve does not waver!')],
  },
  'hist-zhao-wuling': {
    taunt: [L('某趙武靈王,胡服騎射!', 'I am King Wuling of Zhao — nomad dress, mounted bow!'), L('變法圖強,何懼舊俗?', 'I reform to grow strong — why fear old custom?')],
    ult: [L('鐵騎縱橫,看我胡服之威!', 'Iron horse ranges free — behold the strength of the nomad way!'), L('開疆拓土,趙國大興!', 'I broaden the borders — and Zhao rises mighty!')],
  },
  'hist-yongle': {
    taunt: [L('永樂大帝在此,四夷賓服!', 'The Yongle Emperor stands here — the four corners submit!'), L('某五征漠北,威加四海!', 'Five campaigns north — my might spans the four seas!')],
    ult: [L('天子守國門,一擊定乾坤!', 'The Son of Heaven guards the gate — one blow settles the realm!'), L('鄭和下西洋,某之威也!', 'Zheng He\'s voyages — they are my majesty!')],
  },
  'hist-xie-xuan': {
    taunt: [L('某謝玄,北府兵帥!', 'I am Xie Xuan — commander of the Beifu Army!'), L('八萬破百萬,談笑之間!', 'Eighty thousand broke a million — between a laugh and a word!')],
    ult: [L('北府勁旅,淝水破敵!', 'The Beifu veterans shatter the foe at the Fei!'), L('風聲鶴唳,草木皆兵!', 'Wind and crane-cries — the foe takes every reed for a soldier!')],
  },
  'hist-pang-juan': {
    taunt: [L('某龐涓,鬼谷高徒!', 'I am Pang Juan — prized student of Guiguzi!'), L('用兵之道,某豈遜於人?', 'In the art of war, am I less than any man?')],
    ult: [L('一擊建功,直取敵帥!', 'One blow wins the day — straight for the enemy\'s commander!'), L('馬陵道上…遂成豎子之名!', 'On the Maling road… and so I made that stripling\'s name!')],
  },
  'zhuge-liang': {
    taunt: [L('某臥龍諸葛孔明,豈用刀兵?', 'I am the Sleeping Dragon — what need have I of blades?'), L('談笑之間,檣櫓灰飛煙滅。', 'Between a laugh and a word, your fleet turns to ash.')],
    ult: [L('羽扇一揮,萬軍辟易!', 'A wave of my feather fan — and armies recoil!'), L('運籌帷幄,決勝千里!', 'I plot within the tent, and win battles a thousand li away!')],
  },
  'lady-sun': {
    taunt: [L('某孫尚香,弓腰之姬!', 'I am Sun Shangxiang — the bow-waisted lady!'), L('莫欺我是女流,刀劍無眼!', 'Mock me for a woman? Blades have no eyes!')],
    ult: [L('一箭穿心,巾幗無雙!', 'An arrow through the heart — no woman my equal!'), L('房中常設兵器,某豈尋常女子?', 'I keep weapons in my chambers — am I an ordinary woman?')],
  },
  'yuan-shao': {
    taunt: [L('某袁本初,四世三公!', 'I am Yuan Benchu — four generations of ministers!'), L('帶甲百萬,良將千員,誰敢爭鋒?', 'A million in armour, a thousand fine generals — who dares cross me?')],
    ult: [L('河北之眾,踏破爾營!', 'The host of Hebei tramples your camp!'), L('某虎踞河北,睥睨天下!', 'I crouch like a tiger over Hebei, scornful of the realm!')],
  },
  'zhuge-zhan': {
    taunt: [L('某諸葛思遠,父志在肩!', 'I am Zhuge Siyuan — my father\'s charge upon my shoulders!'), L('綿竹在此,有死無降!', 'Mianzhu stands here — death before surrender!')],
    ult: [L('忠烈一擊,不負父名!', 'A loyal blow — I will not disgrace my father\'s name!'), L('身殉社稷,死而後已!', 'I give my life for the realm — until death and no sooner!')],
  },
  'hist-zhang-xun': {
    taunt: [L('某張巡,死守睢陽!', 'I am Zhang Xun — I hold Suiyang to the death!'), L('嚼齒穿齦,誓不降賊!', 'I grind my teeth to splinters — I will never yield to rebels!')],
    ult: [L('孤城死守,一夫當關!', 'A lone city held to the last — one man bars the gate!'), L('守一城,捍天下,某無憾矣!', 'To hold one city and shield the realm — I die content!')],
  },
  'hist-li-zicheng': {
    taunt: [L('闖王李自成在此!', 'Li Zicheng, the Dashing King, stands here!'), L('迎闖王,不納糧 — 隨我入京!', '"Welcome the Dashing King, pay no grain" — ride with me to the capital!')],
    ult: [L('闖軍一衝,直搗京師!', 'The Dashing army charges — straight for the capital!'), L('十八子,主神器 — 天命在我!', '"The son of eighteen rules the realm" — the mandate is mine!')],
  },
  'hist-tian-ji': {
    taunt: [L('某田忌,賽馬之間,自有玄機!', 'I am Tian Ji — even in a horse-race, there is a stratagem!'), L('以下駟對上駟,以上駟對中駟!', 'My worst against your best, my best against your middle!')],
    ult: [L('避實擊虛,一擊制勝!', 'Shun the strong, strike the weak — one blow to win!'), L('孫子之謀,某執而行之!', 'Master Sun\'s stratagem — I take it up and act!')],
  },
  'hist-xiang-zhuang': {
    taunt: [L('某項莊,舞劍助興!', 'I am Xiang Zhuang — a sword-dance to liven the feast!'), L('項莊舞劍,意在沛公!', 'Xiang Zhuang dances the sword — but his aim is the Duke of Pei!')],
    ult: [L('劍光一閃,席間取命!', 'A flash of the blade — a life taken at the banquet!'), L('鴻門一舞,險些改寫天下!', 'One dance at Hongmen — and history nearly changed!')],
  },
  'hist-huan-wen': {
    taunt: [L('某桓溫,大丈夫當如是!', 'I am Huan Wen — thus should a great man be!'), L('既不能流芳百世,亦當遺臭萬年!', 'If I cannot leave a fragrance for the ages, let me leave a stench for ten thousand years!')],
    ult: [L('北伐一擊,氣概干雲!', 'A northern-campaign blow — my spirit pierces the clouds!'), L('木猶如此,人何以堪!', 'Even the trees have so aged — how then shall a man bear it!')],
  },
  'hist-zhu-yuanzhang': {
    taunt: [L('大明太祖朱元璋在此!', 'Zhu Yuanzhang, Founder of the Great Ming, stands here!'), L('某起於布衣,提三尺劍取天下!', 'From a peasant\'s cloth I rose, and won the realm with a three-foot blade!')],
    ult: [L('驅逐胡虜,恢復中華!', 'Drive out the barbarians — restore China!'), L('鄱陽一戰,陳友諒授首!', 'One battle at Poyang, and Chen Youliang yields his head!')],
  },
  'hist-wang-xuance': {
    taunt: [L('某王玄策,大唐使節!', 'I am Wang Xuance — envoy of the great Tang!'), L('借兵數千,某滅汝一國!', 'With a few thousand borrowed troops, I will topple your kingdom!')],
    ult: [L('一人滅一國,看某手段!', 'One man topples a kingdom — behold my craft!'), L('縱橫天竺,大唐威儀!', 'Across India I range — such is the majesty of Tang!')],
  },
  'hist-tian-heng': {
    taunt: [L('某田橫,五百壯士共生死!', 'I am Tian Heng — five hundred brave men live and die with me!'), L('義不帝秦,豈肯辱身?', 'I will not bow to the usurper — shall I shame myself now?')],
    ult: [L('義之所在,雖死不退!', 'Where honour lies, I do not retreat though I die!'), L('五百義士,可昭日月!', 'Five hundred righteous men — bright as sun and moon!')],
  },
  'hist-tao-kan': {
    taunt: [L('某陶士行,運甓勵志!', 'I am Tao Shixing — I haul bricks to keep my will keen!'), L('大禹聖人,猶惜寸陰!', 'Even the sage Yu treasured each inch of time!')],
    ult: [L('勤勉一擊,豈容懈怠?', 'A diligent blow — I will brook no slackness!'), L('某治荊州,夜不閉戶!', 'I governed Jingzhou — and none need bar their doors at night!')],
  },
  'hist-wei-rui': {
    taunt: [L('某韋睿,乘輿白角,持竹如意!', 'I am Wei Rui — borne in a chair, a bamboo wand in hand!'), L('儒將用兵,何須親持刀劍?', 'A scholar-general fights — what need has he to grip a blade?')],
    ult: [L('白袍指處,鍾離大捷!', 'Where the white robe points — the great triumph at Zhongli!'), L('運籌一擊,韋虎之名!', 'A blow of strategy — the name of "Wei the Tiger"!')],
  },
  'zhuge-ke': {
    taunt: [L('某諸葛元遜,丞相之姪!', 'I am Zhuge Yuanxun — nephew of the great Chancellor!'), L('東興一戰,某破魏軍!', 'At Dongxing, in one battle, I shattered the Wei host!')],
    ult: [L('東興大捷,一鼓破敵!', 'The triumph at Dongxing — the foe broken at one drumbeat!'), L('某之才略,豈遜於人?', 'My talent and strategy — are they less than any man\'s?')],
  },
  'hist-yuan-chonghuan': {
    taunt: [L('某袁崇煥,寧遠城在此!', 'I am Yuan Chonghuan — and Ningyuan city stands here!'), L('憑堅城,用大炮,某守此關!', 'Strong walls and great cannon — I hold this pass!')],
    ult: [L('紅夷大炮,一轟退敵!', 'The red-barbarian cannon roars — and drives the foe back!'), L('某守遼東,五年復遼!', 'I guard Liaodong — and in five years I will reclaim it!')],
  },
  'tian-yu': {
    taunt: [L('某田國讓,鎮守北疆!', 'I am Tian Guorang — warden of the northern frontier!'), L('胡虜犯境,某教其有來無回!', 'Let the nomads raid — I\'ll see they never return!')],
    ult: [L('邊塞一擊,胡騎喪膽!', 'A frontier blow — the nomad horse loses heart!'), L('守土安民,某之職也!', 'To hold the land and keep the people safe — that is my charge!')],
  },
  'hist-sun-wu': {
    taunt: [L('某孫武,兵者,國之大事也!', 'I am Sun Wu — war is the great affair of the state!'), L('知己知彼,百戰不殆!', 'Know yourself and the foe, and win a hundred battles!')],
    ult: [L('兵者詭道也 — 出其不意!', 'War is the way of deception — strike where none expect!'), L('善戰者,致人而不致於人!', 'The skilled bring the foe to them, and are never brought!')],
  },
  'hist-sima-rangju': {
    taunt: [L('某司馬穰苴,軍法無情!', 'I am Sima Rangju — military law shows no mercy!'), L('將在軍,君命有所不受!', 'A general in the field need not heed every royal command!')],
    ult: [L('明法審令,一擊建功!', 'Clear law, strict command — one blow wins the day!'), L('約束既定,士卒用命!', 'Once discipline is set, every soldier gives his all!')],
  },
  'hist-zuo-zongtang': {
    taunt: [L('某左季高,抬棺西征!', 'I am Zuo Jigao — I march west bearing my own coffin!'), L('身無半畝,心憂天下!', 'Not half an acre to my name — yet the realm weighs on my heart!')],
    ult: [L('收復新疆,寸土不讓!', 'Reclaim Xinjiang — not one foot of soil yielded!'), L('抬棺出征,有死無還!', 'I march with my coffin — there is no road back!')],
  },
  'hist-zong-ze': {
    taunt: [L('某宗汝霖,誓復中原!', 'I am Zong Ruhin — sworn to retake the Central Plains!'), L('黃河之險,某可一戰而渡!', 'The peril of the Yellow River — I will cross it in a single battle!')],
    ult: [L('過河!過河!過河!', 'Cross the river! Cross the river! Cross the river!'), L('壯志未酬,某死不瞑目!', 'My vow unfulfilled — I die with my eyes open!')],
  },
  'hist-li-yuan': {
    taunt: [L('唐國公李淵在此!', 'Li Yuan, Duke of Tang, stands here!'), L('太原起兵,某當取天下!', 'Risen at Taiyuan — I will take the realm!')],
    ult: [L('晉陽一舉,直入長安!', 'One rising at Jinyang — straight into Chang\'an!'), L('開創大唐,某之基業!', 'The founding of the great Tang — this is my work!')],
  },
  'hist-li-guangli': {
    taunt: [L('某貳師將軍李廣利!', 'I am Li Guangli, the Ershi General!'), L('遠征大宛,取汗血寶馬!', 'A far campaign to Dayuan — to seize the blood-sweating steeds!')],
    ult: [L('萬里遠征,一擊建功!', 'Ten thousand li of campaign — one blow wins the day!'), L('大宛城下,某必破之!', 'Below the walls of Dayuan — I will surely break it!')],
  },
  'hist-huang-xing': {
    taunt: [L('某黃克強,革命健者!', 'I am Huang Keqiang — stalwart of the revolution!'), L('為天下蒼生,何惜此身?', 'For the people of the realm — what care I for my life?')],
    ult: [L('黃花崗上,某身先士卒!', 'At Huanghuagang I lead the charge myself!'), L('推翻帝制,共和肇興!', 'Topple the throne — and a republic is born!')],
  },
  'hist-chen-tang': {
    taunt: [L('某陳湯,矯詔出兵!', 'I am Chen Tang — I marched on a forged decree!'), L('犯強漢者,雖遠必誅!', 'Whoever offends the mighty Han — however far, shall be struck down!')],
    ult: [L('遠征萬里,梟首示眾!', 'A campaign of ten thousand li — and a head raised before all!'), L('郅支授首,西域震服!', 'Zhizhi yields his head — and the Western Regions submit!')],
  },
  'hist-huang-chao': {
    taunt: [L('某黃巢,沖天香陣透長安!', 'I am Huang Chao — the soaring scent of war fills Chang\'an!'), L('待到秋來九月八,我花開後百花殺!', 'When autumn\'s ninth-month comes, my bloom opens and all others die!')],
    ult: [L('滿城盡帶黃金甲!', 'The whole city clad in golden armour!'), L('沖天大將軍,踏破帝京!', 'The Heaven-Storming General tramples the imperial capital!')],
  },
  'hist-hong-taiji': {
    taunt: [L('大清太宗皇太極在此!', 'Hong Taiji, Taizong of the Qing, stands here!'), L('某承父業,終成大業!', 'I carry my father\'s work — and complete the great design!')],
    ult: [L('八旗鐵騎,踏破關門!', 'The Eight-Banner horse tramples through the pass!'), L('松錦一戰,明室膽寒!', 'One battle at Song-Jin — and the Ming court quails!')],
  },
  'hist-li-ji': {
    taunt: [L('某英國公李勣,三朝元老!', 'I am Li Ji, Duke of Ying — elder of three reigns!'), L('滅東突厥,平高句麗,某之功也!', 'The Eastern Turks crushed, Goguryeo subdued — my doing!')],
    ult: [L('用兵持重,一擊建功!', 'War waged with care — and one blow wins the day!'), L('某歷事三朝,未嘗敗績!', 'Three reigns I served, and never knew defeat!')],
  },
  'hist-feng-yi': {
    taunt: [L('某馮異,人稱大樹將軍!', 'I am Feng Yi — they call me the Great-Tree General!'), L('諸將論功,某獨退立樹下。', 'While the others vied for credit, I stood alone beneath a tree.')],
    ult: [L('謙退之將,一擊定關中!', 'A modest general — and one blow settles Guanzhong!'), L('失之東隅,收之桑榆!', 'What\'s lost at dawn is won at dusk!')],
  },
  'hist-liang-hongyu': {
    taunt: [L('某梁紅玉,親執桴鼓!', 'I am Liang Hongyu — I beat the war-drums with my own hands!'), L('巾幗執桴,豈讓鬚眉?', 'A woman at the drums — no less than any man!')],
    ult: [L('擂鼓黃天蕩,困住兀朮!', 'My drums at Huangtiandang trap Wuzhu himself!'), L('鼓聲所至,三軍用命!', 'Where my drums sound, the whole host gives its all!')],
  },
  'hist-chen-youliang': {
    taunt: [L('大漢皇帝陳友諒在此!', 'Chen Youliang, Emperor of the Great Han, stands here!'), L('某擁巨艦六十萬,何懼朱元璋?', 'With giant ships and six hundred thousand — why fear Zhu Yuanzhang?')],
    ult: [L('樓船蔽江,一擊定鼎!', 'Tower-ships blot the river — one blow to seize the realm!'), L('鄱陽湖上,與爾決一死戰!', 'On Lake Poyang — a fight to the death with you!')],
  },
  'hist-chai-rong': {
    taunt: [L('某周世宗柴榮在此!', 'I am Chai Rong, Shizong of the Zhou!'), L('十年開拓,十年養民,十年致太平!', 'Ten years to expand, ten to nourish, ten to bring peace!')],
    ult: [L('御駕親征,所向披靡!', 'I lead the campaign myself — all before me scatter!'), L('高平一戰,某身先士卒!', 'At Gaoping I charged ahead of my own men!')],
  },
  'hist-cao-can': {
    taunt: [L('某曹參,蕭規曹隨!', 'I am Cao Can — I follow the order Xiao laid down!'), L('攻城略地,某戰功第一!', 'In storming cities and taking land, my battle-merit is first!')],
    ult: [L('身被七十創,陷陣拔旗!', 'Seventy wounds on my body — I break the line and seize the banner!'), L('清靜無為,而天下自定!', 'Govern by stillness — and the realm settles of itself!')],
  },
  'hist-jiang-ziya': {
    taunt: [L('某姜尚,渭水垂釣待明君!', 'I am Jiang Shang — I fished the Wei, awaiting a wise lord!'), L('願者上鉤,爾敢一試?', 'Let the willing take the hook — care to try?')],
    ult: [L('太公兵法,一擊定殷!', 'The Taigong\'s art of war — one blow ends the Shang!'), L('封神之戰,某執其牛耳!', 'In the war that named the gods, I led them all!')],
  },
  'hist-liu-xiu': {
    taunt: [L('某劉文叔,中興漢室!', 'I am Liu Wenshu — restorer of the Han!'), L('仕宦當作執金吾,娶妻當得陰麗華!', 'For office, the Bearer of the Gilded Mace; for a wife, Yin Lihua!')],
    ult: [L('昆陽一戰,隕石破敵!', 'At Kunyang, a falling star shatters the foe!'), L('以三千破四十萬,天命在某!', 'Three thousand broke four hundred thousand — Heaven\'s mandate is mine!')],
  },
  'hist-han-wudi': {
    taunt: [L('漢武大帝在此!', 'The Martial Emperor of Han stands here!'), L('寇可往,某亦可往!', 'Where the raider can go, so can I!')],
    ult: [L('封狼居胥,飲馬瀚海!', 'Banner on Wolf-Stone Mount, horses watered at the northern sea!'), L('明犯強漢者,雖遠必誅!', 'Whoever offends the mighty Han — however far — shall be struck down!')],
  },
  'hist-goujian': {
    taunt: [L('某越王勾踐,臥薪嘗膽!', 'I am Goujian, King of Yue — I sleep on brushwood and taste gall!'), L('十年生聚,十年教訓!', 'Ten years to gather, ten years to teach!')],
    ult: [L('三千越甲,可吞吳!', 'Three thousand Yue warriors can swallow all of Wu!'), L('忍辱負重,終雪前恥!', 'I bore the shame — and washed it clean at last!')],
  },
  'zhou-yu': {
    taunt: [L('某周公瑾,談笑間定江東!', 'I am Zhou Gongjin — between a laugh and a word I settle the south!'), L('曲有誤,周郎顧!', 'Strike a wrong note, and Zhou Yu will turn his head!')],
    ult: [L('火燒赤壁,檣櫓灰飛煙滅!', 'Red Cliff aflame — your fleet to ash and smoke!'), L('既生瑜,何生亮?…看槍!', '"Why, with Yu, was Liang also born?"… now taste my spear!')],
  },
  'hist-du-yu': {
    taunt: [L('某杜元凱,人稱杜武庫!', 'I am Du Yuankai — they call me the Arsenal of Du!'), L('伐吳之計,某已成竹在胸!', 'The plan to conquer Wu is already whole in my mind!')],
    ult: [L('勢如破竹,一鼓滅吳!', 'Like splitting bamboo — at one drumbeat I end Wu!'), L('文武兼資,某無所不能!', 'Pen and sword alike — there is nothing I cannot do!')],
  },
  'hist-chen-qingzhi': {
    taunt: [L('某陳慶之,白袍七千!', 'I am Chen Qingzhi — seven thousand in white robes!'), L('名師大將莫自牢,千兵萬馬避白袍!', '"Let no famed general boast — a thousand horse flee the white robe!"')],
    ult: [L('白袍所向,所向披靡!', 'Where the white robe charges, all before it scatter!'), L('七千破數十萬,某之功也!', 'Seven thousand broke hundreds of thousands — my doing!')],
  },
  'hist-fu-jian': {
    taunt: [L('大秦天王苻堅在此!', 'Fu Jian, Heavenly King of the Great Qin, stands here!'), L('某之眾,投鞭可斷流!', 'My host — its whips alone could dam a river!')],
    ult: [L('百萬之師,踏破江南!', 'A host of a million tramples the southland!'), L('（風聲鶴唳…)某豈敗於此?', '(Wind and crane-cries…) am I to lose here?')],
  },
  'hist-deng-yu': {
    taunt: [L('某鄧仲華,雲台之首!', 'I am Deng Zhonghua — foremost of the Cloud Terrace!'), L('某仗策遊說,定河北之策!', 'With my staff and my counsel, I set the plan to win Hebei!')],
    ult: [L('運籌一擊,定鼎中興!', 'A blow of strategy — and the restoration is sealed!'), L('某年二十四,拜大司徒!', 'At twenty-four I was made Grand Minister!')],
  },
  'hist-deng-shichang': {
    taunt: [L('某鄧世昌,致遠艦管帶!', 'I am Deng Shichang — captain of the Zhiyuan!'), L('吾輩從軍衛國,早置生死於度外!', 'We who serve and guard the realm long ago set life and death aside!')],
    ult: [L('開足馬力,直撞敵艦!', 'Full steam ahead — ram the enemy ship!'), L('以身殉國,與艦俱沉!', 'I give my life for the realm — and sink with my ship!')],
  },
  'hist-she-taijun': {
    taunt: [L('佘太君在此,楊門一脈猶在!', 'The Matriarch She stands here — the line of Yang lives on!'), L('百歲掛帥,某志不衰!', 'A hundred years old and still I take command — my will undimmed!')],
    ult: [L('佘家槍法,老而彌堅!', 'The She-family spear — older and only firmer!'), L('十二寡婦,亦能征西!', 'Even twelve widows can march to the west!')],
  },
};

/** Signature taunt/ult lines for an officer, or null to use the persona fallback. */
export function officerDuelLine(id: string, kind: 'taunt' | 'ult', idx = 0): { zh: string; en: string } | null {
  const lines = OFFICER_DUEL_LINES[id];
  if (!lines) return null;
  const pool = lines[kind];
  if (!pool || pool.length === 0) return null;
  return pool[((idx % pool.length) + pool.length) % pool.length];
}
