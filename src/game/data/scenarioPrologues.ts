/**
 * 序章 — the opening page of a campaign.
 *
 * A scenario used to drop you straight onto the map with one line of
 * description. This file gives each board an opening: `intro` sets the state
 * of the realm at that moment (shown to everyone), and `forces` adds the part
 * only your house can hear — who you are, what you want, and what stands in
 * the way.
 *
 * Purely display flavour, like [cityLore]: NOT part of the Scenario type, the
 * runtime state, or the save format. A scenario with no entry simply opens
 * without a prologue, and a force with no entry gets the intro alone.
 */

export interface PrologueText {
  zh: string;
  en: string;
}

export interface ScenarioPrologue {
  /** The board as it stands — read by every player of this scenario. */
  intro: PrologueText;
  /** Per-force opening, keyed by the scenario's own force ids. */
  forces?: Record<string, PrologueText>;
}

/**
 * The opening a given player sees: the board's `intro`, plus their own house's
 * paragraph when it has one. Returns null when the scenario has no prologue,
 * so the caller can simply skip the screen.
 */
export function scenarioPrologue(
  scenarioId: string | null,
  forceId: string | null,
): { intro: PrologueText; force: PrologueText | null } | null {
  if (!scenarioId) return null;
  const p = SCENARIO_PROLOGUES[scenarioId];
  if (!p) return null;
  return { intro: p.intro, force: (forceId && p.forces?.[forceId]) || null };
}

export const SCENARIO_PROLOGUES: Record<string, ScenarioPrologue> = {
  // ── 184–199 · 漢室傾頹 ─────────────────────────────────────────────
  'scn-184-yellow-turban': {
    intro: {
      zh: '光和七年,大疫連歲,河北先饑。鉅鹿人張角以符水治病,十餘年間徒眾數十萬,遍於八州。二月,三十六方一時俱起,皆著黃巾為標識,焚官府,劫聚邑,旬日之間天下響應,京師震動。\n\n朝廷解黨錮,發天下精兵。這一年,許多後來寫進史書的名字第一次帶兵。',
      en: 'A decade of plague, and the north starved first. Zhang Jue of Julu healed with charmed water and gathered several hundred thousand followers across eight provinces. In the second month all thirty-six divisions rose at once under yellow headscarves; within ten days the realm answered them and the capital shook.\n\nThe court lifted the ban on the factions and called up every soldier it had. This is the year a great many names in the histories first took the field.',
    },
    forces: {
      han: {
        zh: '你是漢。宦官與外戚爭了二十年,黨人下獄,賣官至公卿,而州郡的倉是空的。如今太平道舉事,你要靠盧植、皇甫嵩、朱儁這幾個人,和各地自募的義兵。\n\n平黃巾不難。難的是:兵權一旦下放到州郡,就再也收不回來了。',
        en: 'You are Han. Twenty years of eunuchs against consort-clans, the honest men in prison, offices sold up to the highest ranks, and every provincial granary empty. Against the Great Peace you have Lu Zhi, Huangfu Song, Zhu Jun — and whatever militia the provinces raise themselves.\n\nBeating the Turbans is the easy part. The hard part: once the provinces hold armies, no edict ever takes them back.',
      },
      'yellow-turban': {
        zh: '蒼天已死,黃天當立;歲在甲子,天下大吉。\n\n你有數十萬教眾,一呼百應。你沒有的:甲仗、糧道、能守城的人。三十六方各自為戰,而官軍正在集結。這場起義要麼在一年內拿下洛陽,要麼在一年內結束。',
        en: '"The Blue Heaven is dead; the Yellow Heaven shall rise. In the year of jiazi, let the realm rejoice."\n\nYou have hundreds of thousands who come when called. What you do not have: armour, supply lines, anyone who can hold a wall. Thirty-six divisions each fight their own war while the imperial armies gather. This rising either takes Luoyang within the year, or it ends within the year.',
      },
    },
  },

  'scn-189-eunuchs': {
    intro: {
      zh: '中平六年四月,靈帝崩。大將軍何進與十常侍相持於宮省之間,袁紹勸盡誅宦官,何進猶豫,乃召四方猛將入京以脅太后 —— 陳琳諫曰:「此所謂倒持干戈,授人以柄。」\n\n八月,何進入宮被殺;袁紹引兵燒宮門,殺宦者二千餘人,無鬚者亦死。少帝與陳留王夜出北邙,迎面而來的,是并州牧董卓的三千涼州兵。',
      en: 'In the fourth month the Emperor Ling died. General-in-Chief He Jin and the Ten Attendants circled each other inside the palace; Yuan Shao urged him to kill them all, and when he hesitated, He Jin summoned the border generals to frighten the Empress Dowager instead. Chen Lin warned him: "This is holding the halberd by the blade and offering the handle to another."\n\nIn the eighth month He Jin walked into the palace and was killed. Yuan Shao burned the gates and put two thousand eunuchs to the sword — men without beards died too. The boy emperor fled north by night, and what came up the road to meet him was Dong Zhuo and three thousand Liang cavalry.',
    },
    forces: {
      han: {
        zh: '你是何進 —— 屠戶之子,以妹為后而至大將軍。宦官殺你不敢明來,你殺宦官卻要問過太后。袁紹說「今將軍總皇威,握兵要」,可你真正握得住的只有這座宮城。\n\n召外兵是最壞的一步棋。但如果不召,誰替你動手?',
        en: 'You are He Jin — a butcher\'s son who rose to General-in-Chief because his sister became empress. The eunuchs cannot kill you openly; you cannot kill them without asking the Dowager. Yuan Shao says you hold the imperial authority and the army in your hands. What you actually hold is this palace.\n\nSummoning the border armies is the worst move on the board. But if you do not, who does the killing for you?',
      },
      eunuchs: {
        zh: '你是張讓。天子曾說「張常侍是我父」,如今那位天子已經死了。你們十二人共守禁中三十年,靠的是宮牆、詔書,和皇帝的耳朵 —— 這三樣都在流失。\n\n何進在門外。袁紹在門外。他們要的不是罷免,是滅門。',
        en: 'You are Zhang Rang. The late emperor called you "my father." That emperor is dead. Twelve of you have held the inner palace for thirty years on three things — walls, edicts, and the emperor\'s ear — and all three are running out.\n\nHe Jin is outside. Yuan Shao is outside. They have not come to dismiss you.',
      },
      dong: {
        zh: '你是董卓。奉詔而來,詔書卻已無人可奉 —— 大將軍死了,宦官死了,天子在北邙的野地裡哭。你在路上遇見他,問他事變經過,他答不清楚;問陳留王,對答如流。\n\n三千兵不夠,你讓他們夜出四門、旦而復入,城中以為西涼兵日日增援。名分是可以造的,兵威也是。',
        en: 'You are Dong Zhuo. You came under an edict, and there is no longer anyone to obey — the General-in-Chief is dead, the eunuchs are dead, and the Son of Heaven is crying in a field on Mount Beimang. You meet him on the road; he cannot tell you what happened. His younger brother can, clearly.\n\nThree thousand men is not enough, so you march them out the gates by night and back in by morning until the city believes Liang reinforcements arrive daily. Legitimacy can be manufactured. So can strength.',
      },
      cao: {
        zh: '你是曹操,西園八校尉之一。當日袁紹議誅宦官,你笑他:「閹豎之官,古今宜有,但世主不當假之權寵。既治其罪,當誅元惡,一獄吏足矣,何必紛紛召外兵乎!」\n\n沒有人聽。現在洛陽有一支涼州軍,而你手上有陳留的家財和一紙矯詔。',
        en: 'You are Cao Cao, one of the eight colonels of the Western Garden. When Yuan Shao proposed slaughtering the eunuchs you laughed at him: "Eunuchs are an old institution; the fault is in the rulers who gave them power. Punish the ringleaders — one jailer would do. Why in heaven\'s name summon the border armies?"\n\nNobody listened. Now there is a Liang army in Luoyang, and you have your family\'s money in Chenliu and a forged edict.',
      },
      'yuan-shao': {
        zh: '你是袁紹,四世三公,門生故吏遍天下。誅宦官是你力主的,燒宮門是你帶的頭 —— 這一夜之後,你的名望到了頂點。\n\n然後董卓來了。你在朝堂上按劍而出,橫刀長揖而去,奔往冀州。天下的名望還在你身上,但洛陽已經不是你的了。',
        en: 'You are Yuan Shao. Four generations of your house have held the highest offices; your clients are in every province. Killing the eunuchs was your idea and burning the palace gates was your doing — after tonight your name stands at its height.\n\nThen Dong Zhuo arrives. You put your hand on your sword in open court, bow, walk out, and ride for Ji province. The realm\'s regard is still yours. Luoyang is not.',
      },
    },
  },

  'scn-190-anti-dong-zhuo': {
    intro: {
      zh: '初平元年正月,關東州郡起兵討董。袁紹為盟主,屯河內;諸軍十餘萬,日置酒高會,無一人敢先進。\n\n二月,董卓焚洛陽宮廟官府居家,二百里內無復孑遺,驅數百萬口西入關中,積屍盈路。曹操獨追之,敗於滎陽,幾死。孫堅入洛陽,掃除宗廟,祠以太牢,見城中空無所有,乃嘆息流涕。',
      en: 'In the first month the provinces east of the pass rose against Dong Zhuo. Yuan Shao was made chief of the alliance and camped at Henei; the confederate armies numbered over a hundred thousand and held banquets every day, and not one of them would march first.\n\nIn the second month Dong Zhuo burned Luoyang — palaces, temples, offices, homes, nothing left standing for two hundred li — and drove millions of people west into the pass, the dead piled along the roads. Cao Cao pursued alone, was broken at Xingyang, and barely lived. Sun Jian reached Luoyang, swept the ancestral temple, offered the great sacrifice, looked at the empty city and wept.',
    },
    forces: {
      cao: {
        zh: '你在滎陽丟了幾乎全部的兵,回到酸棗,看見諸軍日日高會 —— 你當眾說出那個沒人願意聽的方略,然後自己去揚州募兵。\n\n「諸君北面,我自西向。」這句話說完之後,聯軍就散了。你手上只剩一支殘軍,和一個很清楚的認識:這天下靠會盟是打不下來的。',
        en: 'You lost nearly your whole force at Xingyang, rode back to Suanzao, and found the allied camps at their banquets again. You laid out the plan nobody wanted to hear, then went to Yang province to raise new men yourself.\n\n"You gentlemen face north; I shall go west." After that sentence the coalition dissolved. You have a broken army and one very clear idea: this realm will not be won by committee.',
      },
      sun: {
        zh: '你是孫堅。諸侯屯兵不進,你自魯陽北上,兵敗而復振,斬華雄於陽人。袁術聽人挑撥斷你軍糧,你連夜馳見,畫地作勢:「所以出身不顧,上為國家討賊,下慰將軍家門之私讎,堅與卓非有骨肉之怨也。」\n\n你是唯一真正打進洛陽的人。你也是最快死的那一個 —— 若不改寫。',
        en: 'You are Sun Jian. While the lords sat still you marched north from Luyang, were beaten, reformed, and took Hua Xiong\'s head at Yangren. When Yuan Shu listened to a slander and cut your grain, you rode through the night to his tent and drew the map on the ground: "I go out heedless of my life — above, to punish a traitor for the state; below, to avenge your own house. Between Dong Zhuo and me there is no private quarrel."\n\nYou are the only man who actually fights his way into Luoyang. You are also the first to die — unless this run says otherwise.',
      },
      dong: {
        zh: '你是董卓。廢立已行,太后已死,弘農王已飲藥。關東十餘萬眾扣關而來,你卻很清楚:那些人彼此提防更甚於怕你。\n\n遷都長安,燒了洛陽。「關東鼠子,豈能為我患?」 —— 說這話的時候,你身後是二百里的焦土。',
        en: 'You are Dong Zhuo. The deposition is done, the Dowager is dead, the deposed boy-emperor has drunk the cup. A hundred thousand easterners are at the passes, and you understand something about them: they fear each other more than they fear you.\n\nSo you move the capital to Chang\'an and burn Luoyang behind you. "Those rats east of the pass — how could they trouble me?" You say it with two hundred li of ash at your back.',
      },
      'yuan-shao': {
        zh: '你是盟主。十餘萬眾聽你號令 —— 名義上。你提議另立幽州牧劉虞為帝,劉虞不受;你想向西,又怕自己的糧道;你手上真正的兵不多,真正的地一寸也還沒有。\n\n盟主是個好名分,但名分不生一斛糧。冀州就在旁邊,韓馥懦弱。',
        en: 'You are chief of the alliance. A hundred thousand men take your orders — nominally. You propose enthroning Liu Yu of You province instead; Liu Yu refuses. You would like to march west, but not with your own supply line the way it is. Your actual troops are few and your actual territory is nothing.\n\nChief of the alliance is a fine title. Titles do not produce grain. Ji province is next door, and Han Fu is a weak man.',
      },
      gongsun: {
        zh: '你是公孫瓚,白馬義從的主人。你在北疆打了半輩子胡騎,靠的是馬快、箭準、下手狠。討董對你不過是南下的由頭 —— 你真正的對手在冀州。\n\n劉備此時在你麾下。',
        en: 'You are Gongsun Zan, master of the White Horse Volunteers. You have spent half your life fighting steppe cavalry on the northern frontier with fast horses, straight arrows and no mercy. The coalition is only a reason to come south — your real opponent is in Ji province.\n\nLiu Bei is one of your officers at this moment.',
      },
    },
  },

  'scn-192-wangyun': {
    intro: {
      zh: '初平三年四月,司徒王允與呂布誅董卓於北掖門。長安士民歌舞於道,賣珠玉衣裝以相慶,填滿街肆。卓屍暴於市,守屍吏為大炷置卓臍中,光明達曙,如是積日。\n\n然後王允不肯赦涼州兵。李傕、郭汜本欲各自散去,賈詡曰:「聞長安中議欲盡誅涼州人,而諸君棄眾單行,即一亭長能束君矣。」於是聚眾西向,十日之間,長安又破。',
      en: 'In the fourth month the Minister over the Masses Wang Yun and Lü Bu killed Dong Zhuo at the northern palace gate. The people of Chang\'an sang and danced in the streets and sold their jewellery to pay for the celebration. His corpse was exposed in the market, and the guard set a great wick in the navel; it burned till dawn, and for days after.\n\nThen Wang Yun refused to pardon the Liang soldiers. Li Jue and Guo Si were ready to scatter and go home until Jia Xu told them: "If Chang\'an means to kill every Liang man, and you disband and travel alone, one village constable could arrest you." So they gathered instead and marched west. In ten days Chang\'an fell again.',
    },
    forces: {
      han: {
        zh: '你是王允。連環之計成了,天下以為漢室復興 —— 而你在最要緊的一件事上失了分寸:蔡邕為董卓之死嘆了一聲,你殺了他;涼州數萬人請赦,你不許。\n\n你手上有天子、有呂布、有滿朝公卿。你缺的只是一道赦書。',
        en: 'You are Wang Yun. The chained stratagem worked and the realm believes the Han restored — and on the one thing that mattered you lost your judgement. Cai Yong sighed at Dong Zhuo\'s death, so you killed him. Tens of thousands of Liang soldiers asked for pardon, and you refused.\n\nYou hold the emperor, Lü Bu and the whole court. What you are short of is a single amnesty.',
      },
      lubu: {
        zh: '你是呂布。殺丁原,殺董卓 —— 兩個都曾以父子相待。長安人叫你「飛將」,也叫你別的。\n\n你有天下第一的武藝和赤兔,沒有一寸自己的地。城破那日,你在青瑣門外招呼王允同走,他不肯;你只帶了數百騎,提著董卓的頭出武關。',
        en: 'You are Lü Bu. You killed Ding Yuan and you killed Dong Zhuo — both had called you their son. Chang\'an calls you the Flying General, and other things too.\n\nYou have the finest arms in the realm and Red Hare, and not one foot of land. On the day the city falls you call from the gate for Wang Yun to ride with you; he will not. You leave through the Wu Pass with a few hundred horse and Dong Zhuo\'s head at your saddle.',
      },
      lijue: {
        zh: '你是李傕。董卓死時,你正屯陝縣,上書求赦,不許。賈詡一句話讓你明白:散是死,聚還有一線。\n\n於是十萬涼州兵回頭西向。攻進長安之後呢?你也不知道 —— 史書上你們接下來的十年,是搶天子、燒宮殿、互相攻殺。',
        en: 'You are Li Jue. When Dong Zhuo died you were camped at Shan; you petitioned for pardon and were refused. Jia Xu made one thing clear to you: scattering is death, staying together is a chance.\n\nSo a hundred thousand Liang soldiers turned back west. And after Chang\'an falls? You do not know either — in the histories the next ten years are you and your colleagues stealing the emperor, burning the palace, and killing each other.',
      },
      cao: {
        zh: '你在兗州。青州黃巾三十萬來降,你收其精銳,號青州兵 —— 這是你第一支真正屬於自己的軍隊。\n\n荀彧來投,說「奉天子以令不臣」。長安正在大亂,天子在亂軍之中。這一步走不走?',
        en: 'You are in Yan province. Three hundred thousand Qing province Turbans surrendered; you took the best of them and called them the Qing Province Corps — the first army that is truly yours.\n\nXun Yu has come to you and said: shelter the Son of Heaven and command those who will not submit. Chang\'an is coming apart and the emperor is somewhere in the middle of it. Do you make that move?',
      },
      'yuan-shu': {
        zh: '你是袁術。傳國玉璽在孫堅手上,孫堅死了,你從他家裡拿到了它。\n\n「代漢者,當塗高也。」你叫袁公路,塗即路。這句讖語你信了很多年 —— 現在你有玉璽、有淮南之富、有孫策這樣的少年將軍。',
        en: 'You are Yuan Shu. The Imperial Seal was in Sun Jian\'s keeping; Sun Jian is dead, and you took it from his household.\n\n"He who replaces Han shall be the high one on the road." Your courtesy name is Gonglu — "the road." You have believed that prophecy for years, and now you hold the Seal, the wealth of Huainan, and a young general named Sun Ce.',
      },
    },
  },

  'scn-194-xuzhou': {
    intro: {
      zh: '興平元年。前一年,曹操之父曹嵩自琅琊避難,為陶謙部將所殺 —— 一說劫財,一說有意。曹操以復仇為名東征徐州,所過多所殘戮,泗水為之不流。\n\n這一年他再征徐州,而張邈、陳宮迎呂布入兗州,郡縣皆應,只剩鄄城、范、東阿三城。曹操回師,發現自己已經沒有家了。',
      en: 'The previous year Cao Cao\'s father, travelling out of Langya, was killed by officers of Tao Qian — for his money, some said; on purpose, said others. Cao Cao marched east into Xuzhou to avenge him and slaughtered as he went, until the Si River would not flow for the bodies.\n\nThis year he goes east again — and behind him Zhang Miao and Chen Gong open Yan province to Lü Bu. Every commandery goes over; three towns hold out. Cao Cao turns his army round and discovers he no longer has a home.',
    },
    forces: {
      cao: {
        zh: '父讎在徐州,叛徒在兗州,而糧只夠一個月。程昱替你保住了三座城,荀彧在鄄城拒張邈之使。\n\n有人勸你去投袁紹。荀彧說:不可。這一年你要在復仇與生存之間選一個 —— 史書上你選了生存,回師打呂布,一年才打完。',
        en: 'Your father\'s killers are in Xuzhou, the men who betrayed you are in Yan, and you have a month\'s grain. Cheng Yu saved three towns for you; Xun Yu turned Zhang Miao\'s envoy away from Juancheng.\n\nSomeone suggests you go over to Yuan Shao. Xun Yu says no. This year you choose between vengeance and survival — in the histories you chose survival, turned back on Lü Bu, and it took a year.',
      },
      tao: {
        zh: '你是陶謙,老了,病了。曹嵩死在你的地界上,你說不清,也辯不明。徐州殷實,百姓富庶,而你守不住 —— 你知道自己守不住。\n\n三讓徐州的故事就從這裡開始。你要把它讓給誰?',
        en: 'You are Tao Qian: old, and ill. Cao Song died on your ground and you can neither explain it nor argue your way out. Xuzhou is rich and its people prosperous, and you cannot hold it — you know you cannot hold it.\n\nThis is where the story of the thrice-offered province begins. Who do you mean to hand it to?',
      },
      lubu: {
        zh: '陳宮替你打開了兗州。八十天之間,你從一個逃亡的客將變成一州之主。\n\n然後濮陽城下,你和曹操對峙了一百多天,蝗蟲來了,兩邊都沒糧,各自罷兵。你打仗從不輸,可你總是守不住得到的東西。',
        en: 'Chen Gong opened Yan province to you. In eighty days you went from a fugitive with a halberd to the lord of a province.\n\nThen came a hundred days facing Cao Cao under the walls of Puyang, and then the locusts, and neither army had grain, and both went home. You never lose a battle. You have never once kept what you took.',
      },
      'yuan-shao': {
        zh: '你已據冀州,幽州公孫瓚是你唯一真正的對手。中原正在自相殘殺 —— 曹操與呂布爭兗州,陶謙病篤,袁術妄言天命。\n\n你要做的只是等,和吞。',
        en: 'Ji province is yours, and Gongsun Zan in You is the only opponent who matters. The Central Plain is busy killing itself — Cao Cao and Lü Bu over Yan, Tao Qian dying, Yuan Shu talking about mandates.\n\nAll you have to do is wait, and swallow.',
      },
    },
  },

  'scn-195-jiangdong': {
    intro: {
      zh: '興平二年,孫策年二十一,以父之舊部千餘人、袁術所還之兵數千,渡江東下。\n\n所至皆破,而軍令嚴整,不掠民財,雞犬菜茹一無所犯,百姓大悅,爭以牛酒詣軍。劉繇奔豫章,嚴白虎走餘杭,王朗降於東冶。江東六郡,數年而定。',
      en: 'Sun Ce is twenty-one. With something over a thousand of his father\'s old soldiers and a few thousand more that Yuan Shu returned to him, he crosses the Yangzi and goes east.\n\nHe breaks everything in his path, and his discipline is absolute: nothing is taken from the people, not a chicken or a bundle of greens, and the countryside comes out with oxen and wine to meet his army. Liu Yao runs to Yuzhang, Yan Baihu to Yuhang, Wang Lang surrenders at Dongye. In a few years the six commanderies of Jiangdong are his.',
    },
    forces: {
      sun: {
        zh: '你是孫策。父親死在峴山,部曲被袁術收去,你守孝三年,然後拿玉璽去換回一千多個人。\n\n渡江那天,你什麼都沒有 —— 沒有地盤,沒有名分,沒有後路。你有的是周瑜、一支願意跟你死的舊部,和一個二十一歲的人才會有的判斷:江東可取,而且只有現在可取。',
        en: 'You are Sun Ce. Your father died on Mount Xian, his troops were absorbed by Yuan Shu, and after three years of mourning you traded the Imperial Seal for a thousand-odd men.\n\nOn the day you cross the river you have nothing — no territory, no title, no line of retreat. What you do have is Zhou Yu, a core of veterans willing to die with you, and the judgement only a twenty-one-year-old makes: Jiangdong can be taken, and only right now.',
      },
      'liu-yao': {
        zh: '你是劉繇,漢室宗親,朝廷所命的揚州刺史 —— 名分俱全,兵也不少。有人勸你用太史慈為大將,你說:「我若用子義,許子將不當笑我邪?」\n\n於是太史慈只做了個偵騎。於是他在神亭嶺遇上孫策,單騎交鋒,搶了對方的兜鍪。於是後來他成了孫策的人。',
        en: 'You are Liu Yao, kin to the imperial house and the court\'s own Inspector of Yang province — every credential in order, and no shortage of troops. Someone suggests making Taishi Ci your commander. You answer: "If I employed Ziyi, would Xu Shao not laugh at me?"\n\nSo Taishi Ci was made a scout. So he met Sun Ce alone on Shenting ridge and came away with the man\'s helmet. So he ended up serving Sun Ce.',
      },
      cao: {
        zh: '你已迎天子於許,屯田於許下,歲得穀百萬斛。名分和糧都有了。\n\n北面是袁紹,東面是呂布,南面是張繡和劉表。你比誰都清楚接下來要打誰,也比誰都清楚打不起幾場。',
        en: 'The emperor is at Xu, the military colonies around it are yielding a million bushels a year. You have both legitimacy and grain.\n\nYuan Shao is to the north, Lü Bu to the east, Zhang Xiu and Liu Biao to the south. You know better than anyone who has to be fought next, and better than anyone how few such wars you can afford.',
      },
      'yuan-shu': {
        zh: '孫策向你借兵時,你答應了,大概是覺得他打不下來。\n\n你手上有玉璽,有淮南,有一句念了二十年的讖語。你即將做出這個時代最著名的一個錯誤決定。',
        en: 'When Sun Ce asked you for troops you gave them, probably because you did not think he could win.\n\nYou hold the Seal, you hold Huainan, and you have been reciting the same prophecy for twenty years. You are about to make the most famous bad decision of the age.',
      },
    },
  },

  'scn-197-bohai': {
    intro: {
      zh: '建安二年。袁紹已破公孫瓚於易京之外,幽冀連為一體,帶甲數十萬,謀臣如雲,猛將如雨。\n\n曹操在許,兵不滿萬,傷者十二三。孔融說袁紹之強不可敵,荀彧說:紹兵雖眾而法不整,田豐剛而犯上,許攸貪而不治,審配專而無謀,逢紀果而自用 —— 此數人者,勢不相容,必生內變。\n\n黃河兩岸,各自屯糧。',
      en: 'Yuan Shao has broken Gongsun Zan outside Yijing; You and Ji are one realm now, with hundreds of thousands under arms, advisers like clouds and generals like rain.\n\nCao Cao is at Xu with fewer than ten thousand men, a fifth of them wounded. Kong Rong says Yuan Shao cannot be fought. Xun Yu answers: his troops are many but his discipline is not; Tian Feng is rigid and offends his lord, Xu You is greedy and unruly, Shen Pei is domineering and unsubtle, Feng Ji is decisive and self-willed — these men cannot coexist, and the break will come from inside.\n\nOn both banks of the Yellow River, the granaries fill.',
    },
    forces: {
      cao: {
        zh: '你兵少糧少,唯一的優勢是:你的命令出得去,而且回得來。\n\n荀彧替你數過袁紹帳下每一個人的毛病。這些毛病要等到烏巢那一夜才會全部發作 —— 在那之前,你要在黃河邊上撐住。',
        en: 'You are short of men and short of grain. Your one advantage: your orders go out and come back again.\n\nXun Yu has itemised the flaws of every man in Yuan Shao\'s tent for you. Those flaws will all come due on one night at Wuchao — until then, you have to hold the river line.',
      },
      'yuan-shao': {
        zh: '你有四州之地,十萬之眾,天下士人的仰望。曹操在你眼裡還是那個西園的校尉,那個替你跑腿的舊友。\n\n沮授勸你緩進,田豐勸你持久,郭圖勸你速戰。三種意見都有道理,而你的毛病是:三種都聽,一種都不執行到底。',
        en: 'Four provinces, a hundred thousand men, and the regard of every scholar in the realm. Cao Cao is still, in your mind, the colonel from the Western Garden — the old friend who ran your errands.\n\nJu Shou urges patience. Tian Feng urges a long war. Guo Tu urges a quick strike. All three arguments have merit, and your particular flaw is this: you listen to all three and carry none of them through.',
      },
      gongsun: {
        zh: '你退進易京,樓十丈,積穀三百萬斛,說:「兵法百樓不攻。今吾樓櫓千重,食盡此穀,足知天下之事矣。」\n\n這是把自己活埋。史書上你在兩年後自焚於樓上。',
        en: 'You have withdrawn into Yijing: towers a hundred feet high, three million bushels of grain, and your own explanation — "The art of war says a hundred towers cannot be stormed. I have a thousand tiers of works. By the time this grain is eaten, the affairs of the realm will have settled themselves."\n\nThis is burying yourself alive. In the histories you set fire to the tower two years from now.',
      },
      sun: {
        zh: '你是孫策,江東已定,袁術僭號而你與之絕交。曹操表你為討逆將軍,封吳侯 —— 這是拉攏。\n\n你在想的是許都。史書給你的時間是三年。',
        en: 'You are Sun Ce; Jiangdong is settled, and you have broken with Yuan Shu over his imperial pretensions. Cao Cao has memorialised you as General Who Punishes Rebels and Marquis of Wu — that is a bid for your friendship.\n\nWhat you are actually thinking about is Xuchang. History gives you three years.',
      },
    },
  },

  'scn-198-xiapi': {
    intro: {
      zh: '建安三年冬,曹操圍呂布於下邳。三戰皆破之,布退守城,不出。\n\n陳宮勸他:將軍將騎出屯於外,宮以餘眾閉守於內,若向將軍,宮引兵擊其背;若來攻城,將軍為救於外。不過旬日,操軍食盡,可一鼓而破。呂布以為然,妻曰:「宮、順素不和,將軍一出,豈得齊心固守乎?」布乃止。\n\n十二月,決沂、泗二水灌城。城潰,布登白門樓,自縛請降。',
      en: 'In winter Cao Cao besieged Lü Bu at Xiapi, beat him in three engagements, and shut him inside the walls.\n\nChen Gong proposed a plan: take the cavalry out and camp beyond the siege lines, leave the infantry to hold the city; if they turn on you, I strike their rear; if they storm the city, you relieve it from outside. Ten days and their grain fails. Lü Bu thought it good. His wife said: "Chen Gong and Gao Shun have never got on. The moment you ride out, how will they hold together?" So he stayed.\n\nIn the twelfth month they turned the Yi and Si rivers onto the walls. The city broke. Lü Bu climbed the White Gate Tower and had himself bound.',
    },
    forces: {
      cao: {
        zh: '你圍了下邳半年,兵疲,想撤。荀攸、郭嘉說:呂布勇而無謀,今屢戰皆北,銳氣衰矣。三軍以將為主,主衰則軍無奮意。\n\n於是決水。城破後,呂布在樓上喊:「明公所患不過於布,今已服矣,天下不足憂。」你確實動心了 —— 然後劉備在旁邊說了一句話。',
        en: 'Six months of siege, your army tired, and you are ready to lift it. Xun You and Guo Jia stop you: Lü Bu is brave and unsubtle; he has been beaten repeatedly and his edge is gone. An army takes its spirit from its commander, and his is broken.\n\nSo you flood the city. When it falls he calls down from the tower: "What troubled you was only me, and now I submit. The realm need not concern you." You did in fact consider it — and then Liu Bei, standing beside you, said one sentence.',
      },
      lubu: {
        zh: '你被困在下邳。陳宮的計是對的,你也知道是對的,可你不敢把後背交給高順和陳宮 —— 因為他們也不敢把後背交給你。\n\n城中將領一個接一個地談降。你對左右說:「卿曹無相困,我當自首明公。」這句話說出口的時候,你其實已經降了。',
        en: 'You are shut in Xiapi. Chen Gong\'s plan is correct and you know it is correct, and you dare not put your back to Chen Gong and Gao Shun — because neither of them dares put a back to you.\n\nOne officer after another opens talks with the besiegers. You tell your staff: "Do not trouble yourselves over me; I shall go and submit to him myself." By the time you say that sentence you have already surrendered.',
      },
      'yuan-shao': {
        zh: '曹操陷在徐州半年。你在河北整軍,滅公孫瓚在即。\n\n田豐勸你趁此襲許,你以幼子有病為由不出。田豐舉杖擊地:「夫遭難遇之機,而以嬰兒之病失其會,惜哉!」',
        en: 'Cao Cao has been stuck in Xuzhou for half a year. You are reorganising in the north and about to finish Gongsun Zan.\n\nTian Feng urges you to raid Xu while it is open. You decline because your youngest son is ill. Tian Feng strikes the ground with his staff: "Such a chance comes once, and it is lost over an infant\'s fever. What a pity."',
      },
      sun: {
        zh: '江東已定,你二十四歲。北面在打呂布,西面是黃祖 —— 父讎所在。\n\n你要先報父讎,還是先看許都?',
        en: 'Jiangdong is settled and you are twenty-four. To the north they are fighting over Lü Bu; to the west sits Huang Zu, who killed your father.\n\nThe blood debt first, or Xuchang first?',
      },
    },
  },

  'scn-199-yijing': {
    intro: {
      zh: '建安四年三月,袁紹攻易京。公孫瓚遣子求救於黑山,欲自將突騎出戰,長史關靖諫曰:「將軍一出,則諸軍不復堅守。」乃止。\n\n救兵之期,約以舉火為號。袁紹得其書,如期舉火;瓚以為救至,出戰,大敗。紹為地道穿其樓下,樓輒傾倒。瓚知必敗,盡殺其妻子,乃自焚。',
      en: 'In the third month Yuan Shao attacked Yijing. Gongsun Zan sent his son to the Black Mountain bands for relief and meant to lead his cavalry out; his chief clerk Guan Jing stopped him — "The moment you ride out, no unit in this fortress will hold." So he stayed.\n\nThe relief force was to signal with fires on a set night. Yuan Shao intercepted the letter and lit the fires himself. Gongsun Zan came out believing help had come, and was destroyed. Yuan Shao mined beneath the towers and they came down one by one. Knowing the end, Gongsun Zan killed his own family and then set the tower alight.',
    },
    forces: {
      'yuan-shao': {
        zh: '公孫瓚困守孤樓,河北就要姓袁。此戰之後,你有四州、十萬眾、天下第一的名望。\n\n然後你要面對的,是那個帶著天子、糧不滿一年的老朋友。沮授說「宜徐徐圖之」,你不想聽。',
        en: 'Gongsun Zan is sealed in his tower and the north is about to be yours: four provinces, a hundred thousand men, the first name in the realm.\n\nAfter that comes the old friend who holds the emperor and less than a year\'s grain. Ju Shou says to take it slowly. You do not want to hear it.',
      },
      gongsun: {
        zh: '你把自己關進了易京。「兵法百樓不攻」—— 可你算漏了地道。\n\n關靖說了句實話:將軍一出,則諸軍不復堅守。這座樓困住的不只是袁紹的兵,還有你自己所有的選擇。',
        en: 'You have shut yourself into Yijing. "A hundred towers cannot be stormed" — you did not account for tunnels.\n\nGuan Jing told you the truth: the moment you ride out, nobody holds. This fortress is not only keeping Yuan Shao\'s army out; it has closed off every choice you had.',
      },
      cao: {
        zh: '北方即將只剩一個對手。你在許屯田,在官渡築壘,把黃河南岸的每一處渡口都看了一遍。\n\n袁紹滅公孫瓚之日,就是你們決戰的倒計時開始之時。',
        en: 'The north is about to have one master. You are farming soldiers around Xu, building works at Guandu, and you have walked every ford on the south bank of the river.\n\nThe day Gongsun Zan burns is the day the clock on your own war starts running.',
      },
    },
  },

  'scn-204-yecheng': {
    intro: {
      zh: '建安九年,曹操圍鄴。決漳水灌城,城中餓死者過半。八月,審配之侄開東門,鄴破。\n\n袁紹已死四年,三子分立:袁譚據青州,袁尚據鄴,袁熙在幽州。曹操不必打贏所有人 —— 他只要等這三兄弟先打起來。郭嘉說:急之則相持,緩之而後爭心生。',
      en: 'Cao Cao besieges Ye and turns the Zhang River onto it; more than half the people inside starve. In the eighth month Shen Pei\'s nephew opens the east gate.\n\nYuan Shao has been dead four years and his three sons have split the inheritance: Yuan Tan in Qing, Yuan Shang at Ye, Yuan Xi in You. Cao Cao does not have to beat all of them — he only has to wait for the brothers to start. Guo Jia put it plainly: press them and they close ranks; ease off and their ambitions do the work.',
    },
    forces: {
      cao: {
        zh: '你等了四年,等袁氏兄弟自己打起來。現在袁譚向你請降求援 —— 你答應了,還與他結為兒女親家。\n\n這是一步很髒也很有效的棋。鄴城破後,你在袁紹墓前哭祭,厚待其妻子。哭是真的,吞併也是真的。',
        en: 'You waited four years for the brothers to turn on each other. Now Yuan Tan asks for your help against his own brother — you agree, and seal it with a marriage.\n\nIt is a dirty move and it works. When Ye falls you weep at Yuan Shao\'s grave and treat his widow generously. The grief is real. So is the annexation.',
      },
      'yuan-shang': {
        zh: '父親臨終未立嗣,審配、逢紀矯詔立你。你是幼子,你有鄴城,你哥哥恨你。\n\n審配在城中守到最後 —— 城破被擒,請求面北而死,因為「我君在北」。這樣的人袁氏還有幾個,但你已經用不上了。',
        en: 'Your father named no heir; Shen Pei and Feng Ji produced an edict and installed you. You are the youngest son, you hold Ye, and your brother hates you.\n\nShen Pei holds the city to the last — taken alive, he asks to be executed facing north, "because my lord is in the north." The Yuan house still has men like that. You have run out of ways to use them.',
      },
      'yuan-tan': {
        zh: '你是長子。父親偏愛幼弟,你被出繼給伯父,又被打發去青州 —— 「立嫡以長」四個字,你念了很多年。\n\n現在你向曹操求援打自己的弟弟。你也知道這意味著什麼,但你更知道:不這樣做,鄴城永遠不會是你的。',
        en: 'You are the eldest. Your father favoured the youngest, had you adopted out to an uncle, and packed you off to Qing province. You have been reciting the rule of primogeniture to yourself for years.\n\nNow you are asking Cao Cao for help against your own brother. You know exactly what that means. You also know that without it, Ye is never yours.',
      },
      sun: {
        zh: '你是孫權,兄長遇刺已四年。張昭、周瑜扶你坐穩了位子,江東的心也定了。\n\n黃祖還在江夏。父讎未報。而北方袁氏將亡,曹操很快就會轉過身來。',
        en: 'You are Sun Quan; your brother has been dead four years. Zhang Zhao and Zhou Yu steadied your seat and Jiangdong has settled around you.\n\nHuang Zu is still at Jiangxia and your father is still unavenged. And the Yuan house is finishing, which means Cao Cao will turn around soon.',
      },
      'liu-biao': {
        zh: '你據荊州十餘年,帶甲十餘萬,坐觀成敗。劉備在新野,替你守北門。\n\n史書給你的評語是「外寬內忌,好謀無決」。四年後你會病死,你的次子會把荊州獻出去。',
        en: 'Fourteen years in Jing province, a hundred thousand under arms, and a policy of watching. Liu Bei is at Xinye holding your northern door.\n\nThe verdict the histories give you: generous on the outside, suspicious within; fond of plans, incapable of decisions. In four years you die of illness and your second son hands the province over.',
      },
    },
  },
};
