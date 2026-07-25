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

  // ── 200–222 · 三分之勢 ────────────────────────────────────────────
  'scn-200-guandu': {
    intro: {
      zh: '建安五年,袁紹發精兵十萬、騎萬匹,南下攻許。曹操兵不滿萬,守官渡。\n\n相持半年,曹操糧將盡,寫信給荀彧欲還許,荀彧報曰:「今軍食雖少,未若楚漢在滎陽、成皋間也。是時劉、項莫肯先退,先退者勢屈。公以十分居一之眾,畫地而守之,扼其喉而不得進,已半年矣。情見勢竭,必將有變,此用奇之時,不可失也。」\n\n十月,許攸來奔。烏巢的火在夜裡燒起來。',
      en: 'Yuan Shao came south against Xu with a hundred thousand picked men and ten thousand horse. Cao Cao held Guandu with fewer than ten thousand.\n\nAfter six months his grain was nearly gone and he wrote to Xun Yu about falling back on Xu. Xun Yu replied: "Our supplies are short, but not as short as Liu Bang\'s between Xingyang and Chenggao. Neither he nor Xiang Yu would be the first to withdraw, because the one who withdraws first is the one who has broken. With a tenth of his numbers you have drawn a line and held it, gripped his throat so he cannot advance, for half a year. His position is exposed and his strength spent. Something will give. This is the moment for the unexpected — do not lose it."\n\nIn the tenth month Xu You came over. That night the fires went up at Wuchao.',
    },
    forces: {
      cao: {
        zh: '你有不到一萬人,和一個很簡單的處境:退一步就沒有第二步。\n\n許攸夜至,問你還有多少糧。你說一年 —— 他不信;你說半年 —— 他起身要走;你才說:「實無,止有此月之糧耳。」\n\n然後他告訴你烏巢在哪裡。五千人,夜行,打著袁軍的旗,遇上盤問就說「袁公恐曹操鈔略後軍,遣兵以益備」。',
        en: 'You have under ten thousand men and a very simple position: there is no second step after the one back.\n\nXu You arrives at night and asks how much grain you have. A year, you say — he does not believe it. Half a year — he stands to leave. Then you tell him: "In truth there is none. This month\'s only."\n\nAnd then he tells you where Wuchao is. Five thousand men, marching by night under Yuan banners, and when challenged: "Lord Yuan feared Cao Cao would raid the rear, and sent us to strengthen the guard."',
      },
      'yuan-shao': {
        zh: '十萬對一萬。田豐勸你持久,你把他下了獄;沮授勸你分兵護糧,你不聽;許攸家人犯法被審配收捕,許攸一怒投了曹操。\n\n烏巢起火時,張郃勸你救烏巢,郭圖勸你攻官渡大營。你兩件事都做了一半 —— 派輕騎救烏巢,派重兵攻大營。結果兩件事都沒成。',
        en: 'A hundred thousand against ten. Tian Feng argued for the long war and you jailed him. Ju Shou asked for a detachment to guard the grain and you refused. Shen Pei arrested Xu You\'s family for corruption, and Xu You rode straight to Cao Cao.\n\nWhen Wuchao burns, Zhang He tells you to relieve it and Guo Tu tells you to storm the main camp. You do half of each — light horse to Wuchao, your heavy troops against the camp. Neither succeeds.',
      },
      sun: {
        zh: '你是孫策。中原兩強決戰,你的機會在許都 —— 天子無人守。\n\n史書上,你在出兵前死於刺客之手,年二十六。這一局你還活著。',
        en: 'You are Sun Ce. The two great powers are locked together in the north and your opening is Xuchang — nobody is guarding the emperor.\n\nIn the histories you die at an assassin\'s hand before the army moves, aged twenty-six. In this run you are still alive.',
      },
      'liu-bei': {
        zh: '你剛在徐州被打散,關羽降了曹操,張飛不知所蹤,妻子被俘。你單騎投袁紹 —— 又一次寄人籬下。\n\n這一年你四十歲。你已經丟過徐州兩次、丟過小沛、丟過妻子三回。你還沒有一寸地。',
        en: 'You have just been scattered out of Xuzhou. Guan Yu has gone over to Cao Cao, Zhang Fei is somewhere unknown, your wives are captives. You ride alone to Yuan Shao — another man\'s roof again.\n\nYou are forty years old. You have lost Xuzhou twice, lost Xiaopei, lost your family three times. You do not yet hold one foot of ground.',
      },
    },
  },

  'scn-207-three-visits': {
    intro: {
      zh: '建安十二年,劉備屯新野。徐庶臨行薦諸葛亮:「此人可就見,不可屈致也。將軍宜枉駕顧之。」\n\n凡三往,乃見。因屏人曰:「漢室傾頹,奸臣竊命,主上蒙塵。孤不度德量力,欲信大義於天下,而智術淺短,遂用猖蹶,至於今日。然志猶未已,君謂計將安出?」\n\n對曰:「今操已擁百萬之眾,挾天子而令諸侯,此誠不可與爭鋒。孫權據有江東,已歷三世,此可以為援而不可圖也。荊州北據漢沔,利盡南海,東連吳會,西通巴蜀,此用武之國。益州險塞,沃野千里,天府之土……」',
      en: 'Liu Bei is quartered at Xinye. Xu Shu, leaving his service, recommends Zhuge Liang: "This man can be visited; he cannot be summoned. You should go to him yourself."\n\nThree journeys before the meeting. Then, with the room cleared: "The House of Han is falling, treacherous men have stolen the mandate, the emperor is a fugitive. Without measuring my own virtue or strength I have wanted to make right prevail in the realm, and my judgement has been so shallow that I am reduced to this. Yet the ambition has not left me. What plan would you give me?"\n\nThe answer: "Cao Cao has a million men and holds the Son of Heaven to command the lords — there is no contesting him head-on. Sun Quan holds Jiangdong through three generations — he may be made an ally, not a target. Jing province commands the Han and Mian rivers, draws profit from the southern sea, links to Wu in the east and Ba-Shu in the west: it is a land made for war. Yi province is walled by its passes, a thousand li of rich fields, the storehouse of Heaven…"',
    },
    forces: {
      cao: {
        zh: '北方已定,烏桓已破,郭嘉死在回師的路上,年三十八。你在渤海邊上寫「東臨碣石,以觀滄海」。\n\n下一步是荊州。你在鄴城鑿玄武池練水軍 —— 北人不習水戰,你知道,可你還是要南下。',
        en: 'The north is settled, the Wuhuan broken, and Guo Jia died on the road home at thirty-eight. On the shore of the Bohai you write: "East I came to Jieshi stone, to look upon the vast blue sea."\n\nNext is Jing province. At Ye you have dug the Xuanwu lake to drill a navy — northerners cannot fight on water, and you know it, and you are going south anyway.',
      },
      sun: {
        zh: '你二十六歲,坐領江東七年。魯肅早就對你說過:漢室不可復興,曹操不可卒除,為將軍計,惟有鼎足江東以觀天下之釁。\n\n黃祖還在江夏。父讎、荊州、長江上游 —— 三件事是同一件事。',
        en: 'You are twenty-six and have held Jiangdong seven years. Lu Su told you long ago: the Han cannot be restored and Cao Cao cannot be removed quickly; your course is to hold Jiangdong as one leg of a tripod and watch for the realm\'s fractures.\n\nHuang Zu is still at Jiangxia. Your father\'s death, Jing province, and the upper river are three names for one problem.',
      },
      'liu-biao': {
        zh: '你老了。長子劉琦與次子劉琮爭嗣,蔡氏一族站在劉琮那邊。劉備在新野替你守著北門,你既用他,又防他。\n\n臥龍就在你治下的隆中,黃承彥是他岳父,蔡瑁是他姨父的連襟 —— 荊襄的名士圈子你熟得很。你只是從來沒去請過他。',
        en: 'You are old. Your elder son Liu Qi and younger son Liu Cong are contending for the succession, and the Cai clan stands behind Liu Cong. Liu Bei holds your northern door at Xinye, and you both use him and watch him.\n\nThe Sleeping Dragon farms at Longzhong, inside your own province. Huang Chengyan is his father-in-law; the Cai family are relations by marriage. You know the Jing gentry circle perfectly well. You have simply never gone to ask him.',
      },
      'liu-zhang': {
        zh: '你父親留下的益州,你守得住嗎?張魯在漢中不聽號令,你殺了他母親和弟弟,結成死仇。\n\n張松、法正這些人已經在替你物色新主。你自己還不知道。',
        en: 'Can you hold the Yi province your father left you? Zhang Lu in Hanzhong ignores your orders; you executed his mother and brother, and the feud is permanent.\n\nZhang Song and Fa Zheng are already shopping for a new lord on your behalf. You have not noticed yet.',
      },
    },
  },

  'scn-207-bailang': {
    intro: {
      zh: '建安十二年,曹操北征烏桓。諸將皆言:袁尚亡虜耳,胡人貪而無親,豈能為尚用?今深入征之,劉備必說劉表以襲許。\n\n郭嘉曰:「公雖威震天下,胡恃其遠,必不設備。因其無備,卒然擊之,可破滅也。」\n\n七月大水,傍海道不通。田疇獻計出盧龍塞,塹山堙谷五百餘里。八月登白狼山,卒與虜遇,眾甚盛。曹操登高望之,見其陣不整,乃縱兵擊之,使張遼為先鋒,虜眾大崩,斬蹋頓。',
      en: 'Cao Cao marches north against the Wuhuan. His officers all object: Yuan Shang is a fugitive, the nomads are greedy and loyal to nobody — why would they fight for him? Go that deep and Liu Bei will talk Liu Biao into raiding Xu.\n\nGuo Jia answers: "Your name carries across the realm, but they trust their distance and will not prepare. Strike them suddenly while they are unready, and they can be destroyed."\n\nThe seventh month brings floods and the coast road is impassable. Tian Chou offers a route through the Lulong pass — five hundred li of cut hills and filled ravines. In the eighth month, climbing White Wolf Mountain, the army meets the enemy unexpectedly, and in great numbers. Cao Cao looks down, sees their ranks are ragged, and lets the army go with Zhang Liao at the head. The Wuhuan collapse and Tadun\'s head is taken.',
    },
    forces: {
      cao: {
        zh: '你在做一件所有人都反對的事:帶著全部主力,離開中原,深入塞外五百里,把許都留給劉表和劉備。\n\n郭嘉支持你。回師途中他病死了,你哭得很厲害。此後每逢挫敗,你都會說一句「郭奉孝在,不使孤至此」。',
        en: 'You are doing the thing everyone advised against: taking your whole field army five hundred li beyond the frontier and leaving Xuchang to Liu Biao and Liu Bei.\n\nGuo Jia backed you. He dies of illness on the road home, and you weep hard. For the rest of your life, after every reverse, you will say the same sentence: "Had Fengxiao been here, I would not have come to this."',
      },
      wuhuan: {
        zh: '你是蹋頓。烏桓三王之首,袁氏的姻親與奧援,袁尚兄弟就在你帳中。\n\n漢人的大軍從來到不了這裡 —— 傍海的路一到夏天就淹。所以你沒有設防。',
        en: 'You are Tadun, first of the three Wuhuan kings, kinsman and refuge of the Yuan house — Yuan Shang and his brother are in your camp right now.\n\nHan armies have never reached this far. The coast road floods every summer. So you have posted no guard.',
      },
      'liu-biao': {
        zh: '劉備勸你趁曹操北征襲許,你沒有動。\n\n曹操回來以後,你對劉備說:「不用君言,故失此大會。」劉備答:「今天下分裂,日尋干戈,事會之來,豈有終極乎?若能應之於後者,則此未足為恨也。」',
        en: 'Liu Bei urged you to raid Xu while Cao Cao was in the far north. You did not move.\n\nWhen Cao Cao came back you told him: "I did not take your advice, and so I lost that great chance." Liu Bei answered: "The realm is split and men take up arms daily. Chances will keep coming — is there any end to them? If you can meet the next one, this is not worth regretting."',
      },
    },
  },

  'scn-208-chibi': {
    intro: {
      zh: '建安十三年秋,曹操下荊州,劉琮舉眾降。曹操得荊州水軍,號八十萬眾,順流東下,遺孫權書曰:「近者奉辭伐罪,旌麾南指,劉琮束手。今治水軍八十萬眾,方與將軍會獵於吳。」\n\n權以示群下,莫不響震失色。張昭等曰:曹公豺虎也,挾天子以征四方,拒之不順,且將軍大勢可以拒操者長江也,今操得荊州,水軍蒙衝鬥艦乃以千數,操悉浮以沿江,此為長江之險已與我共之矣。\n\n魯肅不言。權起更衣,肅追於宇下。周瑜自鄱陽還,曰:「操雖託名漢相,其實漢賊也。將軍以神武雄才,兼仗父兄之烈,割據江東,地方數千里,兵精足用,英雄樂業,當橫行天下,為漢家除殘去穢。」',
      en: 'In autumn Cao Cao took Jing province and Liu Cong surrendered his whole force. With the Jing fleet in hand Cao Cao came downriver claiming eight hundred thousand men, and wrote to Sun Quan: "Lately, under imperial commission to punish the guilty, I turned my banners south and Liu Cong folded his hands. I now have eight hundred thousand marines, and shall hunt with you in Wu."\n\nSun Quan showed the letter to his court and every face went white. Zhang Zhao and the rest said: Cao Cao is a wolf; he holds the Son of Heaven and campaigns in his name, so resisting him puts us in the wrong — and the one thing that could have stopped him was the Yangzi, which he now shares with us, a thousand warships strong.\n\nLu Su said nothing. When Sun Quan rose to change his clothes, Lu Su followed him out under the eaves. And Zhou Yu came back from Poyang: "Cao Cao styles himself Chancellor of Han; he is Han\'s traitor. You have divine martial talent and your father\'s and brother\'s legacy, several thousand li of Jiangdong, sharp troops enough for the work, and heroes glad to serve you. You should sweep the realm and clear the filth from the House of Han."',
    },
    forces: {
      cao: {
        zh: '你五十四歲,平生第一次覺得天下唾手可得。荊州水軍不戰而降,劉備在當陽被追上,長江以北再無敵手。\n\n賈詡勸你先安撫荊州、緩圖江東,你沒有聽。軍中已有疫病。北方士卒不習水土,你把船連起來,想讓他們站得穩一點。',
        en: 'You are fifty-four, and for the first time in your life the realm looks like something you could simply pick up. The Jing fleet surrendered without a fight, Liu Bei was run down at Changban, and north of the Yangzi nothing stands against you.\n\nJia Xu advised consolidating Jing first and taking Jiangdong slowly. You did not listen. There is already sickness in the camp. Your northerners cannot keep their feet on water, so you have chained the ships together to steady them.',
      },
      sun: {
        zh: '你二十七歲。滿朝文武都勸降,只有魯肅和周瑜勸戰。魯肅在廊下對你說:我們這些人降了曹操,還能做官;將軍降了曹操,能去哪裡?\n\n你拔刀斫案:「諸將吏敢復有言當迎操者,與此案同!」周瑜要五萬人,你給了三萬 —— 這是你能給的全部。',
        en: 'You are twenty-seven. Every civil officer says surrender; only Lu Su and Zhou Yu say fight. Lu Su tells you under the eaves: men like us can surrender and still hold office. Where would you go?\n\nYou cut the corner off the table with your sword: "Any officer who again speaks of receiving Cao Cao goes the way of this table." Zhou Yu asks for fifty thousand men. You give him thirty thousand — it is everything you have.',
      },
      'liu-bei': {
        zh: '你在當陽被曹操的虎豹騎追上,一日一夜行三百餘里,妻子失散,趙雲單騎救回阿斗,張飛據水斷橋。十餘萬百姓跟著你走,有人勸你棄之,你說:「夫濟大事必以人為本,今人歸吾,吾何忍棄去!」\n\n現在你在夏口,兵不滿兩萬。諸葛亮說:「事急矣,請奉命求救於孫將軍。」',
        en: 'The Tiger and Leopard cavalry ran you down at Changban after three hundred li in a day and a night. Your family was scattered; Zhao Yun brought your son back alone; Zhang Fei held the broken bridge. A hundred thousand civilians were walking with you and someone advised abandoning them. You said: "A great undertaking must have people at its root. They have come to me — how could I bear to leave them?"\n\nNow you are at Xiakou with under twenty thousand men. Zhuge Liang says: "The situation is desperate. Let me go and ask General Sun for help."',
      },
    },
  },

  'scn-211-weinan': {
    intro: {
      zh: '建安十六年,曹操遣鍾繇討張魯,關中諸將疑其襲己,馬超、韓遂等十部俱反,眾十萬,屯潼關。\n\n曹操與遂、超單馬會語,不及他事,但說京都舊故,拊手歡笑。既罷,超等問語何言,遂曰:「無所言也。」超等疑之。他日,操與遂書,多所點竄,如遂改定者,超等愈疑遂。\n\n九月,大戰渭南。曹操曰:「關中長遠,若賊各依險阻,征之,不一二年不可定也。今皆來集,其眾雖多,莫相歸服,軍無適主,一舉可滅,為功差易,吾是以喜。」',
      en: 'Cao Cao sent Zhong Yao against Zhang Lu; the Guanzhong generals took it for a move against themselves, and ten companies under Ma Chao and Han Sui rose together — a hundred thousand men camped at Tong Pass.\n\nCao Cao met Han Sui alone on horseback and spoke of nothing but old acquaintances in the capital, clapping his hands and laughing. Afterwards Ma Chao asked what had been said. "Nothing," said Han Sui. They began to wonder. Later Cao Cao sent Han Sui a letter full of crossings-out and corrections, as if Han Sui himself had altered it. After that they wondered a great deal.\n\nIn the ninth month came the battle south of the Wei. Cao Cao said: "Guanzhong is wide, and if the rebels each held their own strongholds it would take a year or two to reduce them. Instead they have all gathered here. Many as they are, none submits to another; the army has no master. One stroke ends it. That is why I am pleased."',
    },
    forces: {
      cao: {
        zh: '十部聯軍看著嚇人,實際上沒有主帥。你要做的只是把他們湊在一起,然後拆散。\n\n渡渭水時被馬超追上,箭如雨下,許褚左手舉馬鞍擋箭,右手撐船。你上岸後笑著說:「今日幾為小賊所困乎!」',
        en: 'The ten-company coalition looks terrifying and has no commander. Your whole task is to keep them gathered, then take them apart.\n\nCrossing the Wei, Ma Chao catches you; the arrows come down like rain, and Xu Chu holds a saddle up as a shield with his left hand and poles the boat with his right. Ashore, you laugh: "Today I was very nearly cornered by a young bandit."',
      },
      'ma-chao': {
        zh: '你父親馬騰在許都做官,實際是人質。你起兵,就是把他的命交出去了 —— 後來曹操夷了你三族。\n\n你有西涼鐵騎和羌胡之眾,曹操說「馬兒不死,吾無葬地」。可你信了韓遂,又疑了韓遂,這支聯軍垮在自己人手裡。',
        en: 'Your father Ma Teng holds an office in Xuchang, which is another word for hostage. Rising means handing over his life — Cao Cao later executed your entire clan.\n\nYou have the Liang cavalry and the Qiang tribes behind you, and Cao Cao says that while that boy lives he will have no place to be buried. But you trusted Han Sui, and then doubted Han Sui, and this coalition came apart from the inside.',
      },
      'han-sui': {
        zh: '你在關中縱橫三十年,和馬超的父親做過盟友也做過仇敵。你今年七十歲。\n\n曹操在陣前只和你談舊事,笑著拍手,一句正事不說 —— 這一手你看穿了,可你身邊的人沒看穿。',
        en: 'Thirty years in Guanzhong; you have been Ma Teng\'s ally and his enemy by turns. You are seventy years old.\n\nCao Cao rode out and talked to you about old times, laughing and clapping, and said nothing of business — you saw through it perfectly well. The men beside you did not.',
      },
      'liu-bei': {
        zh: '你剛得了荊州南四郡,借了南郡,娶了孫夫人。龐統勸你入蜀,說「荊州荒殘,人物殫盡,東有吳孫,北有曹氏,鼎足之計難以得志」。\n\n劉璋請你入川防張魯 —— 這是張松和法正給你開的門。',
        en: 'You have the four southern commanderies of Jing, Nanjun on loan, and Lady Sun for a wife. Pang Tong urges you west: "Jing is wasted and stripped of men, with Sun in the east and Cao in the north; the tripod cannot be built from here."\n\nLiu Zhang has invited you into Shu to deal with Zhang Lu. Zhang Song and Fa Zheng opened that door for you.',
      },
    },
  },

  'scn-213-fengpo': {
    intro: {
      zh: '建安十八年,劉備與劉璋反目,自葭萌南下,圍雒城。\n\n龐統率眾攻城,為流矢所中,卒,年三十六。先主痛惜,言則流涕。\n\n雒城守了一年。城破之後,成都在望。',
      en: 'Liu Bei has broken with Liu Zhang and come south from Jiameng to besiege Luocheng.\n\nPang Tong, leading the assault, was struck by a stray arrow and died. He was thirty-six. Liu Bei grieved for him, and wept whenever he was mentioned.\n\nLuocheng held for a year. When it fell, Chengdu was in sight.',
    },
    forces: {
      'liu-bei': {
        zh: '你五十三歲,第一次真的在打自己的地盤。龐統給了你上中下三策,你選了中策 —— 然後他死在雒城下。\n\n諸葛亮、張飛、趙雲從荊州溯江來援,關羽留守。這一步之後,荊州只剩關羽一個人。',
        en: 'You are fifty-three and for the first time you are fighting for ground that will be your own. Pang Tong gave you three plans; you took the middle one, and then he died under the walls of Luocheng.\n\nZhuge Liang, Zhang Fei and Zhao Yun are coming upriver from Jing to reinforce you, and Guan Yu stays behind. After this, Jing province is one man.',
      },
      'liu-zhang': {
        zh: '你請他來,給他兵、給他糧、給他白水關的軍權。鄭度勸你堅壁清野,你說:「吾聞拒敵以安民,未聞動民以避敵也。」\n\n這句話很仁厚。它也讓你輸掉了益州。',
        en: 'You invited him in, gave him troops, gave him grain, gave him command at Baishui Pass. Zheng Du urged you to burn the fields and pull the people behind the walls. You answered: "I have heard of resisting an enemy to keep the people safe. I have not heard of uprooting the people to avoid an enemy."\n\nIt is a generous sentence. It also loses you Yi province.',
      },
      cao: {
        zh: '你剛從渭南回來,受封魏公,加九錫。荀彧不贊成 —— 然後荀彧死了,一說憂死,一說飲藥。\n\n南邊孫權在濡須,西邊劉備在打益州。你在等哪一頭先出事。',
        en: 'You are back from the Wei with the title of Duke of Wei and the nine bestowments. Xun Yu did not approve — and then Xun Yu died, of grief, or of a cup, depending on who tells it.\n\nSun Quan is at Ruxu in the south and Liu Bei is taking Yi province in the west. You are waiting to see which one breaks first.',
      },
      sun: {
        zh: '濡須之戰,曹操望見你的舟船器仗軍伍整肅,嘆道:「生子當如孫仲謀。」\n\n你借出去的南郡還沒還。劉備正在西邊拿一整個益州 —— 等他拿到了,你就更要不回來了。',
        en: 'At Ruxu, Cao Cao looked across at your ships and ranks in perfect order and said: "One should have a son like Sun Zhongmou."\n\nThe Nanjun you lent out has not come back. Liu Bei is out west taking an entire province — and once he has it, you will never get it back.',
      },
    },
  },

  'scn-214-xichuan': {
    intro: {
      zh: '建安十九年夏,劉備圍成都數十日,城中尚有精兵三萬人,穀帛支一年,吏民咸欲死戰。\n\n簡雍入城說劉璋,璋曰:「父子在州二十餘年,無恩德以加百姓。百姓攻戰三年,肌膏草野者,以璋故也,何心能安!」遂開城出降,群下莫不流涕。\n\n劉備入成都,置酒大饗,取蜀城中金銀分賜將士,還其穀帛。',
      en: 'Liu Bei had besieged Chengdu for some tens of days. The city still had thirty thousand good troops and a year of grain and cloth, and its officials and people wanted to fight to the death.\n\nJian Yong went in to talk to Liu Zhang, who said: "My father and I have governed this province more than twenty years without conferring any kindness on its people. They have been fighting for three years, and their flesh has greased the fields, because of me. How could I be easy?" He opened the gates and surrendered, and none of his men could keep from weeping.\n\nLiu Bei entered Chengdu, held a great feast, distributed the city\'s gold and silver to his soldiers, and returned the grain and cloth to their owners.',
    },
    forces: {
      'liu-bei': {
        zh: '隆中對說的「跨有荊益」,今天成了一半。你五十四歲,終於有了一塊真正屬於自己的地。\n\n然後孫權派人來要荊州。你說:「須得涼州,當以荊州相與。」他大怒。',
        en: 'The Longzhong plan said "straddle Jing and Yi," and today half of it is real. You are fifty-four and at last you hold ground that is your own.\n\nThen Sun Quan sends to ask for Jing province back. You answer: "When I have taken Liang, I shall hand Jing over." He is furious.',
      },
      'liu-zhang': {
        zh: '城中有三萬精兵、一年之糧,吏民都要打。你開了城門。\n\n史書沒有嘲笑你這一句 —— 陳壽只是照錄了你說的話:百姓攻戰三年,肌膏草野者,以璋故也。',
        en: 'Thirty thousand good troops inside, a year of grain, and a population that wanted to fight. You opened the gates.\n\nThe histories do not sneer at this. Chen Shou simply wrote down what you said: they have been fighting three years, and their flesh has greased the fields, because of me.',
      },
      cao: {
        zh: '劉備得了益州,你必須先取漢中 —— 漢中是蜀的咽喉,也是你南下的跳板。\n\n司馬懿、劉曄都勸你趁蜀人未附,一鼓下之。你說了那句有名的話:「人苦無足,既得隴,復望蜀邪!」',
        en: 'Liu Bei has Yi province, so Hanzhong has to be yours first — it is the throat of Shu and your own springboard south.\n\nSima Yi and Liu Ye both urge you to press on before the Shu people settle under their new lord. You give the famous answer: "Men suffer from never being satisfied. Having taken Long, must I covet Shu too?"',
      },
      sun: {
        zh: '劉備拿了益州,還不還荊州。你派呂蒙取長沙、零陵、桂陽三郡,劉備親率五萬下公安 —— 兩家幾乎開戰。\n\n然後曹操攻漢中,劉備急了,湘水劃界,各分一半。這只是延期。',
        en: 'Liu Bei has Yi province and still will not return Jing. You send Lü Meng to take Changsha, Lingling and Guiyang; Liu Bei comes down to Gong\'an with fifty thousand men. The two houses nearly go to war.\n\nThen Cao Cao attacks Hanzhong, Liu Bei needs peace in a hurry, and you split the province along the Xiang River. It is a postponement, nothing more.',
      },
    },
  },

  'scn-215-hefei': {
    intro: {
      zh: '建安二十年,孫權率十萬眾圍合肥。城中七千人。\n\n曹操遠征張魯前留下一函,署曰「賊至乃發」。發之,教曰:「若孫權至者,張、李將軍出戰,樂將軍守城,護軍勿得與戰。」諸將皆疑。張遼曰:「公遠征在外,比救至,彼破我必矣。是以教指及其未合逆擊之,折其盛勢,以安眾心,然後可守也。成敗之機,在此一戰,諸君何疑?」\n\n是夜募敢從之士八百人,椎牛饗將士。平旦,遼被甲持戟,先登陷陣,殺數十人,斬二將,大呼自名,衝壘入,至權麾下。權大驚,眾不知所為,走登高冢,以長戟自守。',
      en: 'Sun Quan brought a hundred thousand men against Hefei. There were seven thousand inside.\n\nBefore leaving for Zhang Lu, Cao Cao had left a sealed letter marked "open when the enemy comes." It read: "If Sun Quan arrives, Generals Zhang and Li shall go out and fight; General Yue shall hold the city; the protector-of-the-army shall not join the battle." The officers were baffled. Zhang Liao said: "Our lord is far away. By the time relief comes they will certainly have broken us. The order means we should strike before they concentrate — break their momentum, steady our men, and then the place can be held. Success or failure turns on this one action. What is there to doubt?"\n\nThat night he called for eight hundred volunteers and killed oxen to feast them. At dawn Zhang Liao put on his armour, took his halberd, went in first, killed some dozens of men and two officers, shouted his own name, broke through the palisade and reached Sun Quan\'s own standard. Sun Quan was appalled; nobody knew what to do; he fled up a burial mound and held it with a long halberd.',
    },
    forces: {
      sun: {
        zh: '十萬對七千。你在逍遙津差點被八百人活捉,凌統的親兵三百人全部戰死,你自己靠著甘寧和呂蒙斷後,騎馬躍過斷橋才逃出來。\n\n「張遼止啼」四個字從此傳遍江東 —— 小孩夜哭,說一聲張遼來了就不哭了。這是你一生最丟臉的一仗,你以後還要打七次合肥。',
        en: 'A hundred thousand against seven thousand — and eight hundred of them nearly took you alive at Xiaoyaojin. Ling Tong\'s three hundred household troops all died. You got out because Gan Ning and Lü Meng covered the rear and your horse cleared a broken bridge.\n\nAfter this, "Zhang Liao stops the crying" passes into speech across Jiangdong: a child weeping at night is quieted by his name. It is the most humiliating battle of your life, and you will attack Hefei seven more times.',
      },
      cao: {
        zh: '你在漢中打張魯,合肥只有七千人。你留了一封信,把三個互不相能的將領的分工寫死在裡面 —— 樂進守城,張遼李典出戰,薛悌不許動。\n\n這封信是你這輩子寫得最好的一份調度。',
        en: 'You are in Hanzhong dealing with Zhang Lu and there are seven thousand men at Hefei. You left one letter that nails down the roles of three officers who cannot stand each other: Yue Jin holds the wall, Zhang Liao and Li Dian go out, Xue Ti does not move.\n\nIt is the finest set of orders you ever wrote.',
      },
      'liu-bei': {
        zh: '你剛與孫權湘水劃界,分了荊州。曹操在漢中,你在成都。\n\n法正說:漢中若得,則可蠶食雍涼,廣拓境土。這是下一步。',
        en: 'You have just split Jing province with Sun Quan along the Xiang. Cao Cao is in Hanzhong and you are in Chengdu.\n\nFa Zheng says: take Hanzhong and you can eat into Yong and Liang and widen your borders. That is the next move.',
      },
    },
  },

  'scn-218-dingjun': {
    intro: {
      zh: '建安二十三年,劉備進兵漢中,屯陽平關。二十四年正月,自陽平南渡沔水,緣山稍前,於定軍山勢作營。\n\n夏侯淵將兵來爭其地。法正曰:「可擊矣。」先主命黃忠乘高鼓譟攻之,大破淵軍,斬淵及魏將軍趙顒等。\n\n曹操自長安舉眾南征。先主遙策之曰:「曹公雖來,無能為也,我必有漢川矣。」及操至,先主斂眾拒險,終不交鋒,積月不拔,亡者日多。夏,操果引軍還。',
      en: 'Liu Bei advanced into Hanzhong and camped at Yangping Pass. In the first month he crossed the Mian south of Yangping, worked his way along the hills, and made his camp on the heights of Mount Dingjun.\n\nXiahou Yuan came up to contest the ground. Fa Zheng said: "Now he can be struck." Liu Bei sent Huang Zhong down from the height with drums beating; Xiahou Yuan\'s army was broken and Xiahou Yuan himself killed, with the Wei general Zhao Yong.\n\nCao Cao brought his whole force south from Chang\'an. Liu Bei judged it from a distance: "Cao Cao may come, but he can do nothing. Hanzhong will be mine." When Cao Cao arrived, Liu Bei kept his men behind the high ground and refused battle for months; nothing was taken and desertions mounted daily. In summer Cao Cao withdrew.',
    },
    forces: {
      'liu-bei': {
        zh: '這是你第一次在正面戰場上贏曹操。你五十八歲,等了三十年。\n\n黃忠已經六十多,諸將都覺得該用張飛。法正說:用黃忠,激之。定軍山那一刀砍下去,漢中就是你的了。',
        en: 'This is the first time you beat Cao Cao in a stand-up fight. You are fifty-eight. You have waited thirty years.\n\nHuang Zhong is past sixty and your officers all think Zhang Fei should have the command. Fa Zheng says: use Huang Zhong, and provoke him into it. When that blade comes down at Dingjun, Hanzhong is yours.',
      },
      cao: {
        zh: '夏侯淵死了。你說過他:「為將當有怯弱時,不可但恃勇也。將當以勇為本,行之以智計;但知任勇,一匹夫敵耳。」他還是自己帶了四百兵去修鹿角。\n\n你在漢中待了兩個月,拿不下,退不甘。傳令的口令是「雞肋」—— 楊修一聽就收拾行裝,你把他殺了。',
        en: 'Xiahou Yuan is dead. You had told him: "A general must know when to be cautious; he cannot live on courage alone. Courage is the root, but it is carried out with calculation. A man who knows only courage is a match for one opponent." He went out with four hundred men to repair the abatis anyway.\n\nYou spend two months in Hanzhong, unable to take it and unwilling to leave. The watchword you give is "chicken ribs." Yang Xiu hears it and starts packing, so you have him executed.',
      },
      sun: {
        zh: '劉備在漢中和曹操死磕,關羽在荊州盯著襄樊。兩家都動了,只有你還沒動。\n\n呂蒙病了 —— 或者說,他讓所有人都以為他病了。陸遜寫了一封很謙卑的信給關羽。',
        en: 'Liu Bei is locked with Cao Cao in Hanzhong and Guan Yu is watching Fancheng from Jing. Both houses have committed. You have not.\n\nLü Meng is ill — or rather, Lü Meng has let everyone believe he is ill. Lu Xun has written Guan Yu a very humble letter.',
      },
    },
  },

  'scn-219-hanzhong': {
    intro: {
      zh: '建安二十四年秋七月,群下上先主為漢中王。八月,關羽率眾攻曹仁於樊。大霖雨,漢水汎溢,于禁所督七軍皆沒。羽獲于禁,斬龐德,威震華夏。曹操議徙許都以避其銳。\n\n司馬懿、蔣濟曰:「于禁等為水所沒,非戰攻之失,於國家大計未足有損。劉備、孫權,外親內疏,關羽得志,權必不願也。可遣人勸權躡其後,許割江南以封權,則樊圍自解。」\n\n閏十月,呂蒙白衣渡江。',
      en: 'In the seventh month Liu Bei\'s officers raised him to King of Hanzhong. In the eighth Guan Yu attacked Cao Ren at Fan. Heavy rain came, the Han River flooded, and the seven armies under Yu Jin were drowned. Guan Yu took Yu Jin alive and beheaded Pang De, and his fame shook the realm. Cao Cao discussed moving the capital out of his reach.\n\nSima Yi and Jiang Ji said: "Yu Jin was lost to floodwater, not to a defeat in the field; the state has taken no real damage. Liu Bei and Sun Quan are close in appearance and estranged in fact, and Sun Quan will not welcome Guan Yu\'s success. Send someone to urge him to strike the rear, and offer him the land south of the river. The siege of Fan will lift itself."\n\nIn the intercalary tenth month, Lü Meng crossed the river in white.',
    },
    forces: {
      'liu-bei': {
        zh: '進位漢中王,置百官,封五虎。這是你一生的最高點。\n\n關羽在北面打得極好。荊州的後背交給了糜芳和傅士仁 —— 這兩個名字你以後不會想再聽到。',
        en: 'King of Hanzhong, a full set of officers appointed, the five great generals invested. This is the summit of your life.\n\nGuan Yu is doing magnificently in the north. The back door of Jing province is in the hands of Mi Fang and Fu Shiren — two names you will not want to hear again.',
      },
      cao: {
        zh: '于禁七軍覆沒,龐德被斬,樊城將破。你六十五歲,在許都議遷都。\n\n司馬懿說了另一條路:孫劉外親內疏,關羽得志,孫權必不願。這封信送出去之後,你只要等。',
        en: 'Yu Jin\'s seven armies are gone, Pang De is beheaded, Fan is about to fall. You are sixty-five and in Xuchang discussing where to move the capital.\n\nSima Yi offers another road: Sun and Liu are close in name and estranged in fact, and Sun Quan will not want Guan Yu to succeed. Once that letter goes out, all you have to do is wait.',
      },
      sun: {
        zh: '你向關羽求婚,想為兒子娶他女兒。他罵你的使者:「虎女安肯嫁犬子!」\n\n呂蒙稱病回建業,陸遜代之,寫信極盡謙卑。關羽於是把後方的兵調去了樊城。船已經備好了。',
        en: 'You asked for Guan Yu\'s daughter for your son. He abused your envoy: "Shall a tiger\'s daughter be married to a dog\'s whelp?"\n\nLü Meng has gone back to Jianye on grounds of illness and Lu Xun has replaced him with a letter of extravagant humility. So Guan Yu has moved his rear garrisons up to Fan. The boats are ready.',
      },
    },
  },

  'scn-220-declaration': {
    intro: {
      zh: '建安二十五年正月,曹操薨於洛陽,年六十六。十月,曹丕受禪,國號魏,改元黃初。\n\n次年四月,劉備即皇帝位於成都,國號漢,改元章武。\n\n又八年,孫權即皇帝位於武昌。三分之勢至此皆有名分 —— 天下有了三個天子,誰也不承認誰。',
      en: 'In the first month Cao Cao died at Luoyang, aged sixty-six. In the tenth month Cao Pi received the abdication, named his dynasty Wei, and changed the era to Huangchu.\n\nIn the fourth month of the following year Liu Bei took the imperial title at Chengdu, named his dynasty Han, and changed the era to Zhangwu.\n\nEight years later Sun Quan took the title at Wuchang. The tripod now has its names as well as its shape — three Sons of Heaven, none of whom acknowledges the others.',
    },
    forces: {
      cao: {
        zh: '你是曹丕。受禪臺上,你回頭對左右說:「舜禹之事,吾知之矣。」\n\n父親留下的天下你接住了。父親留下的問題也一併接住:宗室不得干政,兵權在外姓,而司馬懿正在關中替你擋著諸葛亮。',
        en: 'You are Cao Pi. On the abdication platform you turn to your attendants and say: "Now I understand what happened between Shun and Yu."\n\nYou have caught the realm your father left. You have also caught his problems: the imperial clan is barred from power, the armies are in other men\'s hands, and Sima Yi is out west holding Zhuge Liang off for you.',
      },
      'liu-bei': {
        zh: '關羽死了,荊州沒了,張飛被部下所殺。你六十一歲,剛剛稱帝。\n\n諸葛亮、趙雲都勸你先打魏。你要打吳。',
        en: 'Guan Yu is dead, Jing province is gone, and Zhang Fei has been murdered by his own officers. You are sixty-one and newly an emperor.\n\nZhuge Liang and Zhao Yun both say strike Wei first. You are going to strike Wu.',
      },
      sun: {
        zh: '你剛拿下荊州全境,殺了關羽 —— 然後立刻向曹丕稱臣,受封吳王。有人覺得屈辱,你不在乎。\n\n劉備要來報仇。你需要的只是北面不動手。',
        en: 'You have all of Jing province and Guan Yu\'s head — and you immediately declared yourself a vassal of Cao Pi and accepted the title King of Wu. Some of your court found that humiliating. You do not care.\n\nLiu Bei is coming for revenge. All you need is for the north to stay still.',
      },
    },
  },

  'scn-221-shu-emperor': {
    intro: {
      zh: '章武元年四月,劉備即皇帝位於成都武擔之南。詔曰:「朕以否德,忝嗣臨大位,兢兢業業,懼不能綏。」\n\n七月,大舉伐吳。趙雲諫曰:「國賊是曹操,非孫權也,且先滅魏,則吳自服。」不聽。將行,張飛為其帳下將張達、范彊所殺。\n\n先主聞飛營都督有表,曰:「噫!飛死矣。」',
      en: 'In the fourth month Liu Bei took the imperial title south of Wudan at Chengdu. His edict began: "I, of scant virtue, have unworthily succeeded to the great position, and I go in fear that I cannot bring peace."\n\nIn the seventh month he moved against Wu in force. Zhao Yun objected: "The traitor to the state is Cao Cao, not Sun Quan. Destroy Wei first and Wu will submit of itself." He was not heeded. As the army set out, Zhang Fei was murdered by his own officers Zhang Da and Fan Qiang.\n\nWhen Liu Bei was told a memorial had come from the commander of Zhang Fei\'s camp, he said: "Ah. Zhang Fei is dead."',
    },
    forces: {
      'liu-bei': {
        zh: '你六十一歲,終於坐上了那個位子 —— 而桃園裡的三個人只剩你一個。\n\n諸葛亮沒有勸你。他後來說:「法孝直若在,則能制主上,令不東行。」',
        en: 'You are sixty-one and you have finally reached the seat — and of the three men in the peach garden only you are left.\n\nZhuge Liang did not try to stop you. He said afterwards: "Had Fa Xiaozhi been alive, he could have restrained our lord and kept him from going east."',
      },
      cao: {
        zh: '你是曹丕,受禪剛一年。蜀吳即將開戰,劉曄勸你趁機伐吳:「彼新有大功,上下相疑,可乘也。」你不聽,反而封孫權為吳王。\n\n兩家打完了,你再動手 —— 這是你以為的算盤。',
        en: 'You are Cao Pi, one year into your reign. Shu and Wu are about to fight, and Liu Ye urges you to strike Wu now: "They have just won a great success and are suspicious of one another. This can be used." You refuse, and invest Sun Quan as King of Wu instead.\n\nYou will move after they have exhausted each other — that is your reckoning.',
      },
      sun: {
        zh: '你剛殺了關羽,劉備舉國而來。你向曹丕稱臣,把後背交出去,然後把全部希望押在一個三十九歲、從沒獨當一面的書生身上。\n\n陸遜。諸將皆不服。',
        en: 'You have killed Guan Yu and Liu Bei is coming with everything he has. You have made yourself Cao Pi\'s vassal to secure your back, and then staked everything on a thirty-nine-year-old scholar who has never held an independent command.\n\nLu Xun. Not one of your generals accepts him.',
      },
    },
  },

  'scn-222-yiling': {
    intro: {
      zh: '章武二年,先主自秭歸率諸將進軍,緣山截嶺,於夷道猇亭駐營。\n\n陸遜按兵不動七八個月。諸將皆欲擊之,遜曰:「備舉軍東下,銳氣始盛,且乘高守險,難可卒攻,攻之縱下,猶難盡克,若有不利,損我大勢,非小故也。今但獎厲將士,廣施方略,以觀其變。」\n\n六月,遜曰:「攻之必矣。」乃敕各持一把茅,以火攻拔之。斬張南、馮習及胡王沙摩柯等首,破其四十餘營。先主升馬鞍山,陳兵自繞。遜督促諸軍四面蹙之,土崩瓦解,死者萬數。',
      en: 'Liu Bei advanced from Zigui, cutting along the ridges, and camped at Xiaoting near Yidao.\n\nLu Xun sat still for seven or eight months. His officers all wanted to attack. He told them: "Liu Bei has come east with his whole army and his edge is still keen; he holds the heights and the difficult ground, and cannot be rushed. Even a successful assault would not finish him, and a failure would cost us the whole position. For now, encourage the men, extend our arrangements, and watch for the change."\n\nIn the sixth month: "Now he can be attacked." Each man was issued a bundle of straw, and it was taken with fire. Zhang Nan, Feng Xi and the tribal king Shamoke were killed and forty-odd camps broken. Liu Bei climbed Mount Ma\'an and drew his troops around him; Lu Xun pressed in from every side, and it came apart, with dead in the tens of thousands.',
    },
    forces: {
      'liu-bei': {
        zh: '你連營七百餘里。曹丕聽說之後笑了:「備不曉兵,豈有七百里連營可以拒敵者乎!」\n\n夏天到了,天太熱,你把水軍移上岸,把營寨扎進林子裡。這是你一生最後一個決定。',
        en: 'Your camps run for seven hundred li. When Cao Pi heard of it he laughed: "Liu Bei does not understand war. Whoever heard of resisting an enemy with seven hundred li of linked camps?"\n\nSummer comes and the heat is unbearable, so you bring the marines ashore and pitch your camps in the woods. It is the last decision of your life.',
      },
      sun: {
        zh: '陸遜三十九歲,諸將或是孫策舊部,或是公室貴戚,誰也不服他。他按劍說:「僕雖書生,受命主上。國家所以屈諸君使相承望者,以僕有尺寸可稱,能忍辱負重故也。」\n\n他等了七八個月。你也等了七八個月。',
        en: 'Lu Xun is thirty-nine, and every officer under him is either one of Sun Ce\'s veterans or a member of the ruling house, and none of them accepts him. He put his hand on his sword: "Scholar though I am, I hold my commission from our lord. If the state asks you gentlemen to bend and take my orders, it is because I have some small merit — I can swallow humiliation and carry weight."\n\nHe waited seven or eight months. So did you.',
      },
      cao: {
        zh: '你是曹丕。兩家在夷陵死磕,你按兵不動,想等一個更好的時機。\n\n劉曄說:「今還自相攻,天亡之也,宜大興師,徑渡江襲之。蜀攻其外,我襲其內,吳之亡不出旬月矣。」你沒有聽。夷陵之後,你再南征三次,都無功而返。',
        en: 'You are Cao Pi. The two of them are grinding each other up at Yiling and you are holding still, waiting for a better moment.\n\nLiu Ye said: "They are attacking each other — Heaven is destroying them. Raise a great army, cross the river directly and strike. Shu presses from outside, we strike from within, and Wu is finished within the month." You did not listen. After Yiling you invade the south three times and come back with nothing.',
      },
    },
  },

  'scn-225-southern': {
    intro: {
      zh: '建興三年春,亮率眾南征。馬謖送之數十里,亮曰:「雖共謀之歷年,今可更惠良規。」謖曰:「南中恃其險遠,不服久矣,雖今日破之,明日復反耳。……夫用兵之道,攻心為上,攻城為下;心戰為上,兵戰為下。願公服其心而已。」\n\n亮納其策,赦孟獲以服南方。故終亮之世,南方不敢復反。',
      en: 'Zhuge Liang led the army south. Ma Su rode some tens of li to see him off, and Zhuge Liang said: "We have planned this together for years — give me one more good rule." Ma Su answered: "Nanzhong trusts to its distance and its passes and has been unsubmissive for a long time. Break them today and they rebel tomorrow… In the use of arms, taking the heart is the highest and taking the walls the lowest; fighting with the mind is highest, fighting with soldiers lowest. I would ask you only to win their allegiance."\n\nZhuge Liang took the advice, and pardoned Meng Huo to bring the south over. To the end of his life, the south did not rise again.',
    },
    forces: {
      'liu-bei': {
        zh: '先主崩於永安,託孤於你。「若嗣子可輔,輔之;如其不才,君可自取。」你涕泣曰:「臣敢竭股肱之力,效忠貞之節,繼之以死!」\n\n南方未平,北伐不可言。你要先走這一趟。',
        en: 'The First Sovereign died at Yong\'an and left the heir in your hands: "If my son is worth supporting, support him. If he has not the ability, take it yourself." You wept and answered: "I shall exhaust the strength of my limbs and offer loyalty and integrity, and follow it to my death."\n\nThe south is unpacified, so there is no talking about a northern campaign. This journey has to come first.',
      },
      nanman: {
        zh: '你是孟獲,南中之望,漢夷所服。蜀漢的丞相親自來了。\n\n擒了七次,放了七次。第七次你說:「公,天威也,南人不復反矣。」—— 那是史書寫的。這一局你可以不說。',
        en: 'You are Meng Huo, the man Nanzhong looks to, respected by Han and tribesman alike. The Chancellor of Shu has come in person.\n\nSeven times taken, seven times released. The seventh time you said: "Sir, this is Heaven\'s own authority. The men of the south will not rebel again." That is what the histories record. In this run you need not say it.',
      },
      cao: {
        zh: '你是曹叡,剛即位。諸葛亮在南征,孫權在合肥。\n\n司馬懿在荊州,曹真在關中。你祖父留下的將領還在,你父親留下的猜忌也還在。',
        en: 'You are Cao Rui, newly enthroned. Zhuge Liang is campaigning in the far south and Sun Quan is at Hefei.\n\nSima Yi is in Jing, Cao Zhen in Guanzhong. Your grandfather\'s generals are still alive, and so is your father\'s distrust of the imperial clan.',
      },
      sun: {
        zh: '夷陵大勝之後,你與蜀漢復盟。鄧芝來使,你問:「若天下太平,二主分治,不亦樂乎?」鄧芝答:「天無二日,土無二王。」你大笑。\n\n你的方向仍是合肥。永遠是合肥。',
        en: 'After Yiling you renewed the alliance with Shu. When Deng Zhi came as envoy you asked him: "If the realm were at peace and two rulers divided the rule of it, would that not be pleasant?" Deng Zhi answered: "There are not two suns in the sky, nor two kings on the earth." You laughed out loud.\n\nYour direction is still Hefei. It is always Hefei.',
      },
    },
  },

  'scn-228-jieting': {
    intro: {
      zh: '建興六年春,亮出祁山,戎陣整齊,賞罰肅而號令明,南安、天水、安定三郡叛魏應亮,關中響震。\n\n魏明帝西鎮長安,命張郃拒亮。亮使馬謖督諸軍在前,與郃戰於街亭。謖違亮節度,舉措煩擾,舍水上山,不下據城。郃絕其汲道,擊,大破之。\n\n亮拔西縣千餘家還於漢中,戮謖以謝眾。上疏曰:「臣以弱才,叨竊非據……請自貶三等,以督厥咎。」',
      en: 'Zhuge Liang came out at Qishan with his ranks in perfect order, his discipline strict and his orders clear. Three commanderies — Nan\'an, Tianshui and Anding — went over to him, and Guanzhong shook.\n\nThe Wei emperor came west to Chang\'an and sent Zhang He against him. Zhuge Liang put Ma Su in command of the vanguard, and he met Zhang He at Jieting. Ma Su departed from his instructions, fussed at his dispositions, left the water and went up the hill instead of holding the town below. Zhang He cut him off from the stream, attacked, and destroyed him.\n\nZhuge Liang carried a thousand households of Xi county back to Hanzhong and executed Ma Su before the army. His memorial read: "With my feeble talent I have usurped a place I could not fill… I ask to be demoted three grades, to answer for the fault."',
    },
    forces: {
      'liu-bei': {
        zh: '出師表已上:「今南方已定,兵甲已足,當獎率三軍,北定中原。」\n\n三郡響應,隴右震動。你把先鋒交給了馬謖 —— 諸將都說該用魏延或吳懿。先主臨終說過:「馬謖言過其實,不可大用。」',
        en: 'The memorial has gone in: "The south is settled now and our armour is sufficient; I should lead the three armies north and set the Central Plain in order."\n\nThree commanderies have risen for you and the whole of Longyou is shaking. You have given the vanguard to Ma Su — every officer said it should be Wei Yan or Wu Yi. The First Sovereign said on his deathbed: "Ma Su\'s words outrun his substance. He must not be given great responsibility."',
      },
      cao: {
        zh: '三郡叛應,朝野恐懼。你是曹叡,親自西鎮長安 —— 這一步穩住了關中的人心。\n\n張郃日夜兼行,趕到街亭,看見蜀軍上了山。他做的第一件事是斷水。',
        en: 'Three commanderies have gone over and the court is frightened. You are Cao Rui, and you go west to Chang\'an yourself — that one move steadies Guanzhong.\n\nZhang He marches day and night, reaches Jieting, and sees the Shu army has gone up the hill. The first thing he does is cut them off from the water.',
      },
      sun: {
        zh: '諸葛亮出祁山,魏之主力盡在西線。周魴正在鄱陽寫第七封詐降信給曹休。\n\n他把頭髮割了,以取信於敵。',
        en: 'Zhuge Liang is out at Qishan and Wei\'s field armies are all in the west. Zhou Fang is at Poyang writing his seventh letter of false surrender to Cao Xiu.\n\nHe has cut off his hair to make the enemy believe him.',
      },
    },
  },

  'scn-234-wuzhang': {
    intro: {
      zh: '建興十二年春,亮悉大眾由斜谷出,以流馬運,據武功五丈原,與司馬宣王對於渭南。\n\n亮每患糧不繼,使己志不申,是以分兵屯田,為久駐之基。耕者雜於渭濱居民之間,而百姓安堵,軍無私焉。\n\n相持百餘日。其年八月,亮疾病,卒於軍,時年五十四。及軍退,宣王案行其營壘處所,曰:「天下奇才也。」',
      en: 'Zhuge Liang came out by the Xie valley with his whole army, supplied by the flowing horses, and took position on the Wuzhang plain facing Sima Yi across the Wei.\n\nHe had always been hampered by supply, so he divided his troops into farming colonies as the basis of a long stay. His men worked the fields among the people along the Wei, and the people were undisturbed, and the army took nothing for itself.\n\nThey faced each other for over a hundred days. In the eighth month of that year he fell ill and died in camp, aged fifty-four. When the army had withdrawn, Sima Yi rode through the lines of his camp and said: "A rare talent of the age."',
    },
    forces: {
      'liu-bei': {
        zh: '第五次北伐。你五十四歲,分兵屯田,打算長住。\n\n司馬懿不出戰。你送去婦人的衣服,他把使者留下吃飯,只問你睡得好不好、吃得多不多、事務煩不煩。使者答:「諸葛公夙興夜寐,罰二十以上皆親覽焉;所啖食不至數升。」司馬懿對人說:「亮將死矣。」',
        en: 'The fifth northern campaign. You are fifty-four, you have put your soldiers to the plough, and you intend to stay.\n\nSima Yi will not come out. You send him women\'s clothes; he keeps your envoy to dinner and asks only how you sleep, how much you eat, and how heavy your workload is. Your envoy answers: "His lordship rises early and retires late; every punishment above twenty strokes he reviews himself; and he eats a few pints a day." Sima Yi tells his staff: "Zhuge Liang is going to die."',
      },
      cao: {
        zh: '司馬懿的方略只有兩個字:不戰。將士請戰,他就上表請示,曹叡派辛毗持節到軍門,誰再請戰就按軍法。\n\n姜維說:「辛佐治仗節而至,賊不復出矣。」諸葛亮答:「彼本無戰情,所以固請戰者,以示武於其眾耳。」',
        en: 'Sima Yi\'s whole method is two words: do not fight. When his officers demanded battle he memorialised for permission, and Cao Rui sent Xin Pi with the imperial tally to stand in the camp gate: anyone who asks again answers to military law.\n\nJiang Wei said: "Xin Zuozhi has come with the tally — they will not come out now." Zhuge Liang answered: "He never intended to fight. He asked so insistently only to make a show of spirit before his own men."',
      },
      sun: {
        zh: '你與諸葛亮約好東西並舉,親率十萬攻合肥新城。\n\n滿寵想棄城,曹叡不許:「先帝東置合肥,南守襄陽,西固祁山,賊來輒破於三城之下者,地有所必爭也。」你圍了一個多月,魏軍主力東來,你退了。',
        en: 'You and Zhuge Liang agreed to move east and west together, and you take a hundred thousand men against Hefei New City yourself.\n\nMan Chong wanted to abandon it. Cao Rui refused: "The late emperor set Hefei in the east, held Xiangyang in the south and secured Qishan in the west; whenever the enemy comes he is broken under one of those three walls, because they are ground that must be fought for." You besiege it for over a month, the Wei field army comes east, and you withdraw.',
      },
    },
  },

  // ── 228–280 · 後三國 ──────────────────────────────────────────────
  'scn-228-shiting': {
    intro: {
      zh: '太和二年,鄱陽太守周魴詐降誘曹休,前後七箋,言辭懇切。休疑之,魴乃詣郡門下,截髮謝罪。\n\n休信之,率步騎十萬向皖。陸遜為大都督,朱桓、全琮為左右督,各三萬人。戰於石亭,休大敗,死傷萬餘,車乘器械略盡。休還,慚憤,疽發背而卒。\n\n朱桓曾請斷夾石、挂車之路以絕其歸,則休可生擒,「若蒙天威,得以休自效,便可乘勝長驅,進取壽春,割有淮南」。孫權以問陸遜,遜以為不可。',
      en: 'Zhou Fang, Administrator of Poyang, feigned defection to draw Cao Xiu in — seven letters, each more earnest than the last. When Cao Xiu grew suspicious, Zhou Fang went to the gate of his own headquarters and cut off his hair in penance.\n\nCao Xiu believed him and came to Wan with a hundred thousand foot and horse. Lu Xun took supreme command with Zhu Huan and Quan Cong on the wings, thirty thousand each. At Shiting Cao Xiu was broken: over ten thousand casualties, and his carts and equipment lost almost entire. He went home in shame and rage, an abscess opened on his back, and he died.\n\nZhu Huan had asked to cut the Jiashi and Guache roads and take Cao Xiu alive — "and then, riding the victory, we drive on to Shouchun and take Huainan for ourselves." Sun Quan put it to Lu Xun, who thought it could not be done.',
    },
  },

  'scn-229-three-emperors': {
    intro: {
      zh: '黃龍元年,孫權即皇帝位於武昌。蜀漢遣衛尉陳震賀,與吳中分天下:豫、青、徐、幽屬吳,兗、冀、并、涼屬蜀,司州以函谷關為界。\n\n這是一份很認真地瓜分了一個他們誰也沒佔領的地方的盟書。三個天子並立,各有年號、各修史書、各自認為對方是賊。\n\n此後五十一年,再無人能獨力破局。',
      en: 'Sun Quan took the imperial title at Wuchang. Shu sent the Guard Commandant Chen Zhen with congratulations, and the two courts divided the realm between them: Yu, Qing, Xu and You to Wu; Yan, Ji, Bing and Liang to Shu; and Si province split at the Hangu Pass.\n\nIt is a treaty that very seriously partitions a great deal of land neither party holds. Three Sons of Heaven now reign at once, each with his own era name, each writing his own history, each certain the others are traitors.\n\nFor the fifty-one years that follow, no one of them can break the deadlock alone.',
    },
    forces: {
      gongsun: {
        zh: '你是公孫淵,遼東三代之業。孫權遣使浮海封你為燕王,送金玉珍寶。\n\n你殺了吳使,把首級送去洛陽 —— 換來一個大司馬、樂浪公。兩邊都騙過了,兩邊也都記住了。',
        en: 'You are Gongsun Yuan, third of your house to hold Liaodong. Sun Quan sent envoys by sea to make you King of Yan, with gold and jade and treasure.\n\nYou killed the envoys and sent their heads to Luoyang — which bought you the title Grand Marshal and Duke of Lelang. You have deceived both courts. Both courts have remembered it.',
      },
    },
  },

  'scn-231-lucheng': {
    intro: {
      zh: '建興九年,亮復出祁山,以木牛運。司馬懿使費曜、戴陵留精兵四千守上邽,餘眾悉出,西救祁山。\n\n亮分兵留攻,自逆懿於上邽之東。懿斂軍依險,兵不得交。亮引還。懿等尋亮至鹵城,登山掘營,不肯戰。賈栩、魏平數請戰,因曰:「公畏蜀如虎,奈天下笑何!」懿病之。\n\n乃使張郃攻南圍,自案中道向亮。亮使魏延、高翔、吳班逆戰,魏兵大敗,獲甲首三千級,玄鎧五千領,角弩三千一百張。懿還保營。',
      en: 'Zhuge Liang came out at Qishan again, supplied by the wooden oxen. Sima Yi left four thousand picked men under Fei Yao and Dai Ling to hold Shanggui and took everything else west to relieve Qishan.\n\nZhuge Liang detached a force to continue the siege and went to meet Sima Yi east of Shanggui. Sima Yi drew up on high ground and would not engage, so Zhuge Liang withdrew. Sima Yi followed him to Lucheng, dug in on the hillside, and again refused battle. Jia Xu and Wei Ping asked repeatedly for permission to fight, and finally said: "You fear the Shu as tigers. What will the realm make of that?" It stung him.\n\nSo he sent Zhang He against the southern lines and came at Zhuge Liang himself down the middle road. Wei Yan, Gao Xiang and Wu Ban met them, and the Wei army was broken: three thousand helmeted heads taken, five thousand suits of black armour, three thousand one hundred crossbows. Sima Yi went back inside his camp.',
    },
  },

  'scn-238-liaodong': {
    intro: {
      zh: '景初二年,司馬懿討公孫淵。魏明帝問:「四千里征伐,雖云用奇,亦當任力,不當稍計役費。度往還幾時?」對曰:「往百日,攻百日,還百日,以六十日為休息,如此,一年足矣。」\n\n淵遣步騎數萬屯遼隧,圍塹二十餘里。懿曰:「賊堅營高壘,欲以老吾兵也。今我攻之,正入其計。賊大眾在此,則巢窟虛矣,我直指襄平,必內懼,懼而求戰,破之必矣。」\n\n會霖雨三十餘日,遼水暴漲,運船自遼口徑至城下。雨霽,起土山地道,楯櫓鉤橦,發矢石雨下。城破,男子年十五已上七千餘人皆殺之,以為京觀。',
      en: 'Sima Yi went against Gongsun Yuan. The emperor asked: "A campaign of four thousand li — surprise has its place, but so does hard strength, and the cost should not be counted too closely. How long, out and back?" He answered: "A hundred days out, a hundred to take it, a hundred back, and sixty for rest. A year is enough."\n\nGongsun Yuan put tens of thousands at Liaosui behind twenty li of ditch. Sima Yi said: "They are dug in behind high works to wear my army out. Attacking them there plays their game. Their whole force is here, so the nest is empty — I shall march straight on Xiangping, and they will be afraid for it. Fear will make them come out, and then they can be broken."\n\nThen came thirty days of rain, the Liao rose in flood, and the supply boats came upriver to the walls. When it cleared he raised earthworks and drove tunnels, brought up mantlets and rams, and rained arrows and stones. When the city fell, seven thousand males above the age of fifteen were killed and heaped into a monument of skulls.',
    },
  },

  'scn-241-shaopi': {
    intro: {
      zh: '正始二年,吳四路伐魏:全琮攻芍陂,朱然圍樊,諸葛瑾攻柤中,諸葛恪向六安。\n\n這是吳國少有的一次全線並舉。魏遣司馬懿督軍南下,朱然圍樊城不克而退。\n\n此後司馬懿在淮南大興屯田,鄧艾陳《濟河論》,開廣漕渠,每東南有事,大軍興眾,泛舟而下,達於江淮,資食有儲而無水害。吳國的機會,一年比一年少。',
      en: 'Wu attacked Wei on four fronts at once: Quan Cong at Shaopi, Zhu Ran besieging Fan, Zhuge Jin at Zhazhong, Zhuge Ke towards Liu\'an.\n\nIt is one of the few times Wu moved on the whole line together. Wei sent Sima Yi south in command, and Zhu Ran gave up the siege of Fan.\n\nAfterwards Sima Yi settled great military colonies across Huainan; Deng Ai submitted his treatise on the rivers and cut the broad canal, so that whenever the southeast stirred, a great army could be raised and float straight down to the Yangzi and Huai with supplies laid in and no flood damage. Wu\'s openings grow fewer every year.',
    },
  },

  'scn-244-xingshi': {
    intro: {
      zh: '正始五年,大將軍曹爽伐蜀,以夏侯玄為征西將軍,發卒十餘萬,入駱谷。\n\n漢中守兵不滿三萬,諸將大驚,或曰:「今力不足以拒敵,聽當固守漢、樂二城,遇賊令入,比爾間,涪軍足得至關。」王平曰:「不然。漢中去涪垂千里,賊若得關,便為禍也。今宜先遣劉護軍、杜參軍據興勢,平為後拒。若賊分向黃金,平率千人下自臨之,比爾間,涪軍行至,此計之上也。」\n\n關中及氐、羌轉輸不能供,牛馬騾驢多死,民夷號泣道路。爽等引退,平所斷截,爽爭嶮乃得過,失亡甚眾。',
      en: 'The General-in-Chief Cao Shuang invaded Shu with Xiahou Xuan as General Who Conquers the West, raising over a hundred thousand men into the Luo valley.\n\nHanzhong had fewer than thirty thousand defenders, and the officers were alarmed. Some said: "We have not the strength to resist. Hold the two forts of Han and Le, let them in, and by the time that is done the army from Fu will have reached the passes." Wang Ping said: "No. Hanzhong is near a thousand li from Fu, and if they take the passes it is a disaster. Send Protector Liu and Adjutant Du to hold Xingshi at once, and I shall stand behind them. If they turn towards Huangjin I shall go down against them with a thousand men, and by then the Fu army will have arrived. That is the better plan."\n\nGuanzhong and the Di and Qiang could not keep up the transport; oxen, horses, mules and donkeys died in numbers, and Han and tribesman alike wept along the roads. When Cao Shuang withdrew, Wang Ping had cut the road behind him; he fought his way through the defiles and lost a great many men.',
    },
  },

  'scn-249-gaopingling': {
    intro: {
      zh: '正始十年正月甲午,天子謁高平陵,曹爽兄弟皆從。司馬懿勒兵出,閉城門,據武庫,屯洛水浮橋,奏爽罪惡。\n\n桓範出城奔爽,勸挾天子幸許昌,發四方兵以自輔。爽兄弟猶豫未決。範謂羲曰:「事昭然,卿用讀書何為邪!於今日卿等門戶倒矣!」\n\n爽夜不能決,乃投刀於地曰:「我不失作富家翁。」範哭曰:「曹子丹佳人,生汝兄弟,犢耳!何圖今日坐汝等族滅矣!」\n\n數日,以謀反下獄,夷三族。',
      en: 'On the jiawu day the emperor visited the Gaoping Tombs and the Cao Shuang brothers all went with him. Sima Yi brought out troops, shut the gates, seized the armoury, occupied the floating bridge over the Luo, and memorialised against Cao Shuang\'s crimes.\n\nHuan Fan got out of the city to Cao Shuang and urged him to take the emperor to Xuchang and call up the provincial armies. The brothers hesitated. Huan Fan said to Cao Xi: "The thing is plain as day. What have you read books for? Today your house falls."\n\nCao Shuang could not decide all night. At last he threw his sword down: "I can still be a rich gentleman." Huan Fan wept: "Cao Zhen was a fine man, and he fathered you — calves! Who could have imagined I would be exterminated along with you."\n\nWithin days they were charged with treason and their clans destroyed to the third degree.',
    },
    forces: {
      sima: {
        zh: '你七十一歲,裝了兩年病。李勝來探,你披髮持杯,粥流滿襟,說話含糊,把「荊州」聽成「并州」。李勝回去說:「太傅語言錯誤,口不攝杯,指南為北……令人愴然。」\n\n今天早上,你上馬了。',
        en: 'You are seventy-one and you have been ill for two years. Li Sheng came to look you over; you sat with your hair loose, could not hold the cup, spilled gruel down your front, slurred your words and heard "Jing province" as "Bing province." Li Sheng went back and reported: "The Grand Tutor\'s speech is confused, he cannot manage a cup, he mistakes south for north… it is pitiful to see."\n\nThis morning you got on a horse.',
      },
      cao: {
        zh: '你是曹爽。你把太傅架空了十年,用了何晏、鄧颺、丁謐,改了法度,伐了蜀,一無所成。\n\n今天你陪天子出城,城門在你身後關上了。桓範帶著大司農印跑出來找你,說「天子在外,發詔書召天下兵,誰敢不應」。\n\n你想了一夜。',
        en: 'You are Cao Shuang. You sidelined the Grand Tutor for ten years, promoted He Yan, Deng Yang and Ding Mi, changed the statutes, invaded Shu, and achieved nothing.\n\nToday you escorted the emperor out of the city, and the gates shut behind you. Huan Fan came out with the Grand Agriculturalist\'s seal and told you: the Son of Heaven is outside the walls; issue an edict calling up the armies of the realm, and who dares refuse?\n\nYou thought about it all night.',
      },
    },
  },

  'scn-252-dongxing': {
    intro: {
      zh: '嘉平四年,吳築東興堤,遏巢湖。魏遣諸葛誕、胡遵率眾七萬攻之。\n\n諸葛恪興軍四萬,晨夜赴救。遣冠軍將軍丁奉與呂據、留贊、唐咨為前部。時天寒雪,魏諸將置酒高會,奉見其前部兵少,謂諸將曰:「今乘諸軍遲緩,若敵據便地,則難與爭鋒矣,宜促上岸。」乃辟諸軍使下道,帥麾下三千人徑進。\n\n時北風,奉舉帆二日至,遂據徐塘。敵驚,恃雪寒,酒行,不設備。奉曰:「取封侯爵賞,正在今日!」乃使兵解鎧著胄,持短兵。敵人從而笑焉,不為設備。奉縱兵斫之,大破敵前屯。',
      en: 'Wu built the Dongxing dam to hold back Lake Chao. Wei sent Zhuge Dan and Hu Zun with seventy thousand men against it.\n\nZhuge Ke raised forty thousand and marched night and day to relieve it, with Ding Feng, Lü Ju, Liu Zan and Tang Zi in the van. It was cold and snowing, and the Wei officers were at their wine. Ding Feng saw how few men were in their forward camp and told his colleagues: "The other columns are slow. If the enemy takes the good ground we cannot fight him for it. We must get ashore now." He cleared the road for the rest and pushed on with his own three thousand.\n\nThe north wind was up; he raised sail, arrived in two days, and seized Xutang. The enemy was startled, but trusting to the snow and cold they went on drinking and posted no guard. Ding Feng said: "The rank of marquis is to be had today." He had his men strip off their mail, put on helmets, and take up short blades. The enemy laughed at the sight and still made no preparation. Ding Feng let his men in among them and destroyed the forward camp.',
    },
  },

  'scn-253-hefei': {
    intro: {
      zh: '建興二年,諸葛恪乘東興之勝,大發州郡二十萬眾伐魏。眾皆以為不可,恪作論以諭眾。\n\n圍合肥新城,連月不拔。士卒疲勞,因暑飲水,泄下流腫,病者大半,死傷塗地。諸營吏日白病者多,恪以為詐,欲斬之,自是莫敢言。\n\n八月引軍還,士卒傷病流曳道路,或頓仆坑壑,或見略獲,存亡忿痛,大小呼嗟。而恪晏然自若,出住江渚一月。\n\n十月,孫峻與吳主謀,置酒請恪,伏兵殺之。',
      en: 'Riding the Dongxing victory, Zhuge Ke raised two hundred thousand men from the provinces against Wei. Everyone said it could not be done; he wrote an essay to explain it to them.\n\nHe besieged Hefei New City for months without taking it. The men wore out, drank bad water in the heat, and came down with dysentery and swellings until more than half were sick and the dead lay everywhere. His camp officers reported the numbers daily; he took it for malingering and threatened to behead them, and after that nobody spoke.\n\nIn the eighth month he withdrew, the sick and wounded dragging along the roads, some collapsing into ditches, some taken by the enemy, the living and the dying alike crying out. Zhuge Ke was perfectly composed, and stopped a month on an island in the river.\n\nIn the tenth month Sun Jun and the ruler of Wu invited him to a banquet and killed him with hidden soldiers.',
    },
  },

  'scn-255-huainan2': {
    intro: {
      zh: '正元二年正月,鎮東將軍毌丘儉、揚州刺史文欽矯太后詔起兵壽春,移檄州郡,數司馬師罪狀十一條。\n\n司馬師新割目瘤,創甚,或勸使不行,曰:「我請舉軍,君可鎮許昌。」師曰:「不可。淮南之事,豈可以文書解決乎?」乃輿疾而東。\n\n儉、欽軍在項,不進不退。師遣諸葛誕自安風向壽春,胡遵出譙、宋之間,絕其歸路。將士家皆在北,眾心沮散,降者相屬。\n\n師以文鴦夜襲,驚而目瘤迸出,痛甚,齧被皆破,而左右莫知。閏月,師卒於許昌,年四十八。',
      en: 'Guanqiu Jian, General Who Guards the East, and Wen Qin, Inspector of Yang province, raised troops at Shouchun under a forged edict of the Empress Dowager, and circulated a proclamation to the provinces listing eleven crimes of Sima Shi.\n\nSima Shi had just had a tumour cut from his eye and the wound was severe. Someone urged him to stay behind: "Let me lead the army; you hold Xuchang." He said: "No. Is the Huainan business a thing to be settled by correspondence?" And he went east in a litter.\n\nThe rebel army sat at Xiang, neither advancing nor retiring. Sima Shi sent Zhuge Dan from Anfeng towards Shouchun and Hu Zun out between Qiao and Song to cut the road home. The soldiers\' families were all in the north; morale dissolved and desertions ran in streams.\n\nWen Yang raided the camp by night; the shock burst the wound and forced the eye out, and the pain was such that Sima Shi bit through his bedding — and none of his staff knew. In the intercalary month he died at Xuchang, aged forty-eight.',
    },
  },

  'scn-257-huainan3': {
    intro: {
      zh: '甘露二年,征東大將軍諸葛誕殺揚州刺史樂綝,據壽春反,遣使稱臣於吳。吳遣文欽、唐咨、全懌等三萬人助之。\n\n司馬昭督二十六萬眾臨淮,使王基、陳騫圍之,築壘再重,深溝高壘,不與交鋒。\n\n城中食少,外救不至,誕與欽計議不協,誕殺欽。欽子鴦、虎逾城降,昭赦之,使繞城呼曰:「文欽之子猶不見殺,其餘何懼?」城內喜且擾,又日饑困,誕、咨等智力窮。\n\n二月,城潰。誕突小城門出,大將軍司馬胡奮部兵擊斬之,夷三族。麾下數百人坐不降見斬,皆曰:「為諸葛公死,不恨。」',
      en: 'Zhuge Dan, Grand General Who Conquers the East, killed the Inspector of Yang province, held Shouchun against the court, and sent to Wu offering his submission. Wu sent Wen Qin, Tang Zi and Quan Yi with thirty thousand men to help him.\n\nSima Zhao brought two hundred and sixty thousand to the Huai and had Wang Ji and Chen Qian ring the city with a double rampart, deep ditches and high works, and refuse all battle.\n\nFood ran short inside and no relief came. Zhuge Dan and Wen Qin fell out, and Zhuge Dan killed him. Wen Qin\'s sons Yang and Hu climbed the wall and surrendered; Sima Zhao pardoned them and sent them riding round the walls calling: "Even Wen Qin\'s own sons are not put to death. What have the rest of you to fear?"\n\nIn the second month the city broke. Zhuge Dan burst out of a postern and was cut down. Several hundred of his men were beheaded for refusing to surrender, every one of them saying: "To die for Lord Zhuge — no regret."',
    },
  },

  'scn-263-shu-fall': {
    intro: {
      zh: '景元四年,司馬昭議伐蜀,朝臣多以為不可,獨鍾會贊成。乃使鄧艾、諸葛緒各統三萬餘人,鍾會統十餘萬眾,分從斜谷、駱谷、子午谷伐蜀。\n\n姜維退保劍閣,列營守險,會攻之不能克。糧道險遠,議欲還歸。\n\n鄧艾自陰平道行無人之地七百餘里,鑿山通道,造作橋閣。山高谷深,至為艱險,又糧運將匱,頻於危殆。艾以氈自裹,推轉而下。將士皆攀木緣崖,魚貫而進。\n\n先登至江由,蜀守將馬邈降。斬諸葛瞻於綿竹。十一月,後主輿櫬自縛,詣軍壘門。',
      en: 'Sima Zhao proposed the conquest of Shu; most of the court thought it impossible, and only Zhong Hui supported him. Deng Ai and Zhuge Xu were given thirty thousand each and Zhong Hui over a hundred thousand, to enter Shu by the Xie, Luo and Ziwu valleys.\n\nJiang Wei fell back on Jiange and held the defiles in a line of camps, and Zhong Hui could not force them. With his supply line long and dangerous, he began to discuss going home.\n\nDeng Ai took the Yinping road seven hundred li through empty country, cutting a path through the mountains and building trestle bridges. The peaks were high and the gorges deep and the way desperately hard, and his supplies were failing; more than once it was nearly the end of him. He wrapped himself in felt and rolled down the slope. The men went hand over hand along the trees and cliffs, in single file.\n\nThe vanguard reached Jiangyou and its commander surrendered. Zhuge Zhan was killed at Mianzhu. In the eleventh month the Later Sovereign came to the gate of the camp with his coffin and his hands bound.',
    },
    forces: {
      'liu-bei': {
        zh: '你是劉禪。姜維早就上表:「聞鍾會治兵關中,欲規進取,宜並遣張翼、廖化督諸軍分護陽安關口、陰平橋頭以防未然。」黃皓信巫鬼,說敵終不自致,你把表壓下了,群臣不知。\n\n譙周勸降,北地王劉諶請一戰而死。你選了前者。',
        en: 'You are Liu Shan. Jiang Wei memorialised long ago: "I hear Zhong Hui is drilling troops in Guanzhong with designs on us. Send Zhang Yi and Liao Hua with detachments to hold the Yang\'an pass and the Yinping bridgehead against what may come." Huang Hao consulted a shaman, who said the enemy would never actually come, and you shelved the memorial; the court never saw it.\n\nQiao Zhou urges surrender. The Prince of Beidi asks to fight and die. You take the first.',
      },
      cao: {
        zh: '你是司馬昭。伐蜀是你一個人的決定 —— 朝臣皆謂不可,唯鍾會與你意合。\n\n你派鍾會去,是因為他有才、有膽,而且沒有家累。你算準了他會反,也算準了他反不成。',
        en: 'You are Sima Zhao. The invasion is your decision alone — the court said it could not be done, and only Zhong Hui agreed with you.\n\nYou sent Zhong Hui because he is able, because he is bold, and because he has no family to be held for his good behaviour. You reckon that he will rebel. You also reckon that he will fail.',
      },
    },
  },

  'scn-264-zhonghui': {
    intro: {
      zh: '景元五年正月,鍾會至成都,誣鄧艾謀反,檻車徵之。會既得艾,獨統大眾,威震西土,自謂功名蓋世,不可復為人下。\n\n姜維知會有異志,勸會盡殺北來諸將,因欲乘釁復蜀祚。密書與後主曰:「願陛下忍數日之辱,臣欲使社稷危而復安,日月幽而復明。」\n\n會欲使維將五萬人出斜谷為前驅,而諸將不從。乃悉請護軍郡守牙門騎督以上,置益州諸胡人於殿,以太后遺詔宣示。眾莫敢動。\n\n十八日,胡烈子淵率其父兵擊會。城中大亂,兵交,會格鬥而死,姜維亦死。',
      en: 'Zhong Hui reached Chengdu, accused Deng Ai of treason and had him carted away under arrest. With Deng Ai in his hands he commanded the whole army, his name shook the west, and he judged that his achievements had grown too great for him ever to serve under another man again.\n\nJiang Wei, seeing his intention, urged him to kill every officer who had come from the north — meaning to use the opening to restore Shu. He wrote secretly to the Later Sovereign: "Bear a few days\' humiliation, and I shall make the altars totter and stand again, and the sun and moon go dark and shine again."\n\nZhong Hui meant to send Jiang Wei out by the Xie valley with fifty thousand in the van, and his officers would not have it. So he summoned every protector, administrator and cavalry commander, shut them in a hall with the tribal levies of Yi province, and read out a supposed testamentary edict of the Empress Dowager. Nobody dared move.\n\nOn the eighteenth Hu Lie\'s son led his father\'s troops against him. The city dissolved into fighting, and Zhong Hui died sword in hand. Jiang Wei died too.',
    },
    forces: {
      zhonghui: {
        zh: '你四十歲,滅了蜀漢,手握二十萬眾。司馬昭來信說要親至長安 —— 你懂那是什麼意思。\n\n「事成則得天下,不成退保蜀漢,不失作劉備也。」姜維在你身邊,他說的每一句都對,而你不知道他真正想要什麼。',
        en: 'You are forty, you have destroyed Shu, and two hundred thousand men take your orders. Sima Zhao writes that he is coming to Chang\'an in person — you know what that means.\n\n"If it succeeds, the realm; if it fails, fall back on Shu and be no worse off than Liu Bei." Jiang Wei is at your elbow and everything he says is correct, and you have no idea what he actually wants.',
      },
      dengai: {
        zh: '你偷渡陰平,滅了蜀,然後在成都擅自承制拜官 —— 上書說「兵有先聲而後實者,今因平蜀之勢以乘吳,可不勞而定」。\n\n鍾會把你的表改了,加上狂悖之辭。檻車來的時候,你仰天長嘆:「艾忠臣也,一至此乎!」',
        en: 'You came over Yinping, destroyed Shu, and then at Chengdu began appointing officials on your own authority — memorialising that "in war the announcement sometimes precedes the substance; use the momentum of Shu\'s fall against Wu and it can be settled without effort."\n\nZhong Hui altered your memorial and inserted arrogant language. When the prison cart came you looked up and cried: "Deng Ai is a loyal servant — has it come to this?"',
      },
      cao: {
        zh: '你是司馬昭。鍾會反了,鄧艾也「反」了。你早有準備:賈充已入斜谷,你自己屯長安,十萬眾在後。\n\n有人問你何以知會必敗。你說:「若滅蜀之後,中國將士人自思歸,不肯與同也。」',
        en: 'You are Sima Zhao. Zhong Hui has rebelled and Deng Ai has "rebelled" too. You were ready: Jia Chong is already in the Xie valley, you are at Chang\'an yourself, and a hundred thousand men are behind you.\n\nSomeone asked how you knew Zhong Hui would fail. You said: "Once Shu was taken, the soldiers from the heartland would all be thinking of home. They would not go along with him."',
      },
    },
  },

  'scn-265-jin-founded': {
    intro: {
      zh: '咸熙二年八月,司馬昭卒,子炎嗣位。十二月,魏帝禪位於晉,封為陳留王,即位於南郊。\n\n自曹丕受禪至此四十五年,司馬氏行的是同一套儀節、同一份詔書格式、同一個「天命有歸」的說法。魏之得漢與晉之得魏,連措辭都彼此照抄。\n\n天下只剩兩家。吳主孫皓在位六年,遷都武昌又還建業,殺人剝面鑿眼,群臣側目。晉之滅吳,只在時間。',
      en: 'Sima Zhao died and his son Sima Yan succeeded him. In the twelfth month the Wei emperor abdicated to Jin, was made Prince of Chenliu, and Sima Yan took the throne at the southern altar.\n\nForty-five years after Cao Pi received the same abdication, the Sima house used the same ceremonial, the same form of edict, the same language about where the Mandate had settled. Wei\'s taking of Han and Jin\'s taking of Wei are copied from one another almost word for word.\n\nTwo houses are left. Sun Hao of Wu has reigned six years; he moved the capital to Wuchang and moved it back, and he flays faces and puts out eyes, and his court cannot meet his gaze. Jin\'s conquest of Wu is now only a question of when.',
    },
  },

  'scn-272-xiling': {
    intro: {
      zh: '鳳凰元年,西陵督步闡據城降晉。陸抗聞之,日夜赴赴,敕軍營更築嚴圍,自赤谿至故市,內以圍闡,外以禦寇,晝夜催切,如敵已至,眾甚苦之。\n\n諸將咸諫曰:「今及三軍之銳,亟以攻闡,比晉救至,必可拔也,何事於圍,以敝士民之力乎?」抗曰:「此城處勢既固,糧穀又足,且所繕修備禦之具,皆抗所宿規。今反身攻之,既非可卒克,且北救必至,至而無備,表裏受難,何以禦之?」\n\n晉遣羊祜率步軍出江陵,徐胤督水軍詣建平,楊肇至西陵。抗令張咸固守江陵,公安督孫遵巡南岸禦祜,水軍督留慮拒胤,身自率眾憑圍對肇。\n\n肇計屈夜遁,闡城破,誅之。',
      en: 'Bu Chan, commandant of Xiling, handed the city to Jin. Lu Kang went day and night, and ordered a full ring of works built from Chixi to Gushi — inward to contain Bu Chan, outward to meet the relief — driving the work round the clock as if the enemy were already there, and his men suffered greatly for it.\n\nHis officers all objected: "Take Bu Chan now, while the army is keen; we can have the place before Jin arrives. Why build works and wear out the men?" Lu Kang answered: "That city is strongly sited and well provisioned, and every defence in it was laid out by me. Turning on it now will not carry it quickly, and the northern relief will certainly come — and if it comes and we are unprepared, we are pressed inside and out. What would we meet it with?"\n\nJin sent Yang Hu with the foot to Jiangling, Xu Yin with the fleet to Jianping, and Yang Zhao to Xiling. Lu Kang had Zhang Xian hold Jiangling fast, Sun Zun patrol the south bank against Yang Hu, Liu Lü hold off the fleet, and took the field against Yang Zhao himself from behind his works.\n\nYang Zhao, out of ideas, slipped away by night. Xiling fell and Bu Chan was executed.',
    },
    forces: {
      sun: {
        zh: '陸抗是陸遜的兒子。他上疏說過:「西陵、建平,國之藩表,既處上流,受敵二境。若敵泛舟順流,舳艫千里,星奔電邁,俄然行至,非可恃援他部以救倒懸也。此乃社稷安危之機,非徒封疆侵陵小害也。」\n\n他和羊祜隔江對峙,互通使節,送藥送酒。他病時羊祜送藥,左右勸別喝,他一飲而盡。',
        en: 'Lu Kang is Lu Xun\'s son. He had memorialised: "Xiling and Jianping are the outer screen of the state. They sit upstream and face the enemy on two frontiers. If he takes to the boats and comes down the current, a thousand li of hulls moving like meteors, he arrives before word of him does, and no neighbouring command can be relied on to cut us down from the noose. This is where the safety of the altars is decided — not a small matter of a raided border."\n\nHe and Yang Hu face each other across the river and exchange envoys, medicine and wine. When he was ill Yang Hu sent him medicine; his staff told him not to drink it, and he drank it off.',
      },
    },
  },

  'scn-280-jin-unite': {
    intro: {
      zh: '太康元年正月,晉六路伐吳:王濬、唐彬自巴蜀浮江而下,杜預出江陵,王戎向武昌,胡奮趨夏口,王渾出橫江,司馬伷向塗中。\n\n吳人於江磧要害處,並以鐵鎖橫截之;又作鐵錐長丈餘,暗置江中,以逆距船。濬乃作大筏數十,縛草為人,先驅,錐著筏去。又作火炬,長十餘丈,大數十圍,灌以麻油,在船前,遇鎖,燃炬燒之,須臾,融液斷絕,於是船無所礙。\n\n三月,王濬舟師直抵石頭。孫皓面縛輿櫬,詣軍門降。\n\n自中平元年黃巾舉事,至此九十六年。',
      en: 'Jin came against Wu on six roads at once: Wang Jun and Tang Bin down the river from Ba-Shu, Du Yu out of Jiangling, Wang Rong towards Wuchang, Hu Fen at Xiakou, Wang Hun by Hengjiang, Sima Zhou towards Tuzhong.\n\nThe Wu had strung iron chains across the narrows and set iron spikes over ten feet long under the water to hole the hulls. Wang Jun built great rafts, bound straw men on them, and sent them ahead; the spikes came away in the rafts. He made torches ten fathoms long and dozens of spans around, soaked them in hemp oil, and set them at his bows; where a chain barred the way, the torch was lit against it, and in moments the iron ran and parted, and the ships passed without hindrance.\n\nIn the third month Wang Jun\'s fleet came up to Shitou. Sun Hao had himself bound, brought his coffin, and surrendered at the gate of the camp.\n\nFrom the rising of the Yellow Turbans to this day: ninety-six years.',
    },
  },
};
