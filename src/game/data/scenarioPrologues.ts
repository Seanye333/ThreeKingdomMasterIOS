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
      huangfu: {
        // 原文寫「長社一戰,你順風縱火…朝廷因此把北方交給你」—— 而長社之火是第 9–10
        // 回合才觸發的局內事件(chooser 正是皇甫嵩),序章等於先把玩家的第一場仗
        // 講完了。「督冀州」也早了半年:他是亂平之後才領冀州牧的。改成前瞻語氣,
        // 與朱儁、董卓兩篇一致。
        zh: '你是皇甫嵩,左中郎將,持節,與朱儁分討潁川。天下名將無多,你是其中一個 —— 而你手上是四萬官軍,對面是三十六方裡離京師最近的那一方。\n\n你麾下有個騎都尉叫曹操,二十九歲,洛陽北部尉出身,五色棒打死過蹇碩的叔父。這種人不適合當屬吏。\n\n打完黃巾,你會領冀州牧,上表請免一年租賦,百姓為你作歌。然後你會被宦官誣奏,收印綬,削戶邑。這是你最後一次手握重兵。',
        en: 'You are Huangfu Song, General of the Household of the Left, holding the staff, sent with Zhu Jun against the Turbans of Yingchuan. The realm has few real generals and you are one — and you have forty thousand imperial troops against the division that stands nearest the capital.\n\nUnder you rides a cavalry colonel named Cao Cao, twenty-nine, once a ward magistrate in Luoyang who beat a eunuch\'s uncle to death with his coloured staves. Men like that do not stay subordinates.\n\nWhen the Turbans are done you will be made Governor of Ji, petition to remit a year\'s taxes, and the people will make songs about you. Then the eunuchs will slander you, your seals will be taken and your fief cut. This is the last time you will hold an army.',
      },
      zhujun: {
        zh: '你是朱儁,右中郎將,督荊州。宛城已陷 —— 張曼成殺南陽太守褚貢據之,而你在新野,手上沒有攻城的器械。\n\n你會拿下它:外圍其城,內起土山以臨之,鳴鼓其西南而自將精卒五千掩其東北。從五月到十一月,六個月 —— 黃巾之亂終於宛城,而終結它的是你。\n\n你帳下的人比城更值得看:涿郡來的織席販履之徒劉備,帶著兩個結義兄弟;下邳來的孫堅,十七歲就在錢塘江上一個人嚇退海賊。他們現在是你的佐吏。\n\n二十年後,一個會在成都稱帝,一個的兒子會在建業稱帝。',
        en: 'You are Zhu Jun, General of the Household of the Right, commanding in Jing province. Wancheng has already fallen — Zhang Mancheng killed the Grand Administrator of Nanyang and holds it — and you are at Xinye with no siege engines.\n\nYou will take it: ring the city, raise earth-mounds inside the ring to look down into it, beat the drums to the southwest and go in over the northeast wall with five thousand picked men. Five months to November. The rebellion ended at Wancheng, and you were the man who ended it.\n\nThe people in your tent are worth more than the city. A mat-weaver out of Zhuo named Liu Bei, with two sworn brothers at his back. A man from Xiapi named Sun Jian who at seventeen faced down pirates on the Qiantang alone. Today they are your junior officers.\n\nTwenty years from now one of them will take the imperial title at Chengdu, and the other\'s son will take it at Jianye.',
      },
      'dong-184': {
        zh: '你是董卓,東中郎將,代盧植擊張角。你會打輸 —— 廣宗一戰失利,朝廷減死一等,你回到涼州。\n\n但涼州才是你真正的本錢。羌胡畏你的名字,你的部曲只認你的號令,朝廷屢次徵你入朝為少府、并州牧,你一次也沒有交出兵權。「所將湟中義從及秦胡兵皆詣臣曰:『牢直不畢,稟賜斷絕』」—— 這是奏章上的話,意思是:我的兵不讓我走。\n\n洛陽的宮牆很高。但那些人已經開始互相殘殺了,而你離得比誰都近。',
        en: 'You are Dong Zhuo, General of the Household of the East, sent to replace Lu Zhi against Zhang Jue. You will lose — Guangzong goes badly, the court commutes your death sentence one degree, and you go home to Liang province.\n\nLiang was always the real holding. The Qiang say your name carefully; your retainers take orders from no one else. Three times the court has summoned you to the capital as a minister, as a governor — and three times you have kept the army. "The Huangzhong auxiliaries and the Qin-Qiang troops came to me saying their pay was in arrears and their allowances stopped." That is what the memorial says. What it means is: my soldiers will not let me leave.\n\nThe palace walls at Luoyang are high. But the men behind them have begun killing each other, and no one is closer to the gate than you.',
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
      'yuan-shu': {
        zh: '你是袁術,後將軍,據南陽。南陽戶口數百萬,天下之富無過於此;孫堅是你的刀,他替你打進洛陽,傳國璽也在你手裡。\n\n你稱袁紹為「家奴」—— 他是庶出,你是嫡子,而天下士人偏偏都去投他。這口氣你一直沒嚥下去。\n\n七年後你會據璽稱帝,眾叛親離,走投無路。臨死前你想喝一口蜜水,廚下答:「只有麥屑三十斛。」',
        en: 'You are Yuan Shu, General of the Rear, holding Nanyang — millions of households, the richest commandery under heaven. Sun Jian is your blade; he will fight his way into Luoyang for you, and the Imperial Seal is in your hands.\n\nYou call Yuan Shao "the house slave." He was born of a concubine and you of the principal wife — and yet every gentleman in the realm goes to him. You have never swallowed that.\n\nSeven years from now you will take the imperial title on the strength of that seal, and everyone will leave you. At the end you will ask for a cup of honey water, and the kitchen will answer: "There is nothing but thirty bushels of husk."',
      },
      'liu-biao': {
        zh: '你是劉表,單馬入宜城而得荊州。蒯越為你設宴,誘宗賊帥五十五人而盡斬之,一日定荊襄。此後十八年,天下大亂而荊州獨安,兵不出境,士人南奔者以萬計。\n\n盟主的檄文你會署名。兵你不會發。\n\n曹操後來評你四個字:「坐談客耳。」他說得不錯 —— 但這十八年裡,只有你治下的百姓沒有餓死。',
        en: 'You are Liu Biao, who rode into Yicheng alone and came out holding Jing province. Kuai Yue laid a banquet, lured fifty-five bandit chiefs to it and had every one of them cut down — Jing and Xiang settled in a day. For eighteen years after, while the realm tore itself apart, Jing alone was quiet; your troops never crossed the border and scholars fled south to you in their tens of thousands.\n\nYou will sign the coalition\'s proclamation. You will not send an army.\n\nCao Cao would later sum you up in four characters: "a guest who talks." He was not wrong — and yet for eighteen years yours were the only people who did not starve.',
      },
      'liu-yan': {
        zh: '你是劉焉,漢室宗親。你本想求交趾牧以避亂,術士董扶告訴你「益州分野有天子氣」—— 於是你改口求益州。\n\n入蜀之後,你做的第一件事是燒絕棧道,殺盡朝廷使者,對外說是張魯斷了路。第二件事是造乘輿車具千餘乘。\n\n沒有人知道那些車是給誰坐的。你也不打算解釋。',
        en: 'You are Liu Yan, of the imperial clan. You meant to ask for Jiaozhi in the far south and sit the chaos out — then the diviner Dong Fu told you that the stars over Yi province showed the aura of a Son of Heaven. So you asked for Yi instead.\n\nThe first thing you did on arriving was burn the plank roads and kill every envoy the court sent, saying Zhang Lu had cut the way. The second was to have a thousand imperial carriages built.\n\nNobody knows who those carriages are for. You do not intend to explain.',
      },
      tao: {
        zh: '你是陶謙,徐州牧,年已六十。徐州百姓殷盛,穀米豐贍,流民多歸之 —— 亂世之中,這是難得的一塊淨土。\n\n你會做一件好心的事:護送曹操的父親曹嵩過境。你派的都尉張闓在半路上殺了他,取財而走。\n\n然後曹操來了。「所過多所殘戮」—— 五縣皆屠,雞犬亦盡,泗水為之不流。你守到死,臨終把徐州讓給一個帶著千餘兵來救你的縣令,姓劉名備。',
        en: 'You are Tao Qian, Governor of Xu province, sixty years old. Xu is prosperous and its granaries full, and the displaced come to you in numbers — in an age like this, that is a rare clean patch of ground.\n\nYou will do one kind thing: escort Cao Cao\'s father Cao Song through your territory. The captain you send, Zhang Kai, will kill him on the road for his baggage.\n\nThen Cao Cao comes. "Wherever he passed, he slaughtered" — five counties put to the sword, not a dog left alive, until the Si river would not flow. You hold out until you die, and on your deathbed you hand Xu province to a county magistrate who came to your rescue with a thousand men. His name is Liu Bei.',
      },
      'kong-rong': {
        zh: '你是孔融,孔子二十世孫,北海相。四歲讓梨,十歲折李膺之客,天下知名 —— 你這一生,名聲來得比什麼都早。\n\n你治北海,立學校,表儒術,收葬枯骨。「座上客常滿,樽中酒不空,吾無憂矣。」你確實不擅長打仗:黃巾管亥圍城,是太史慈單騎突圍求來的援兵。\n\n你手上兩座城,四個人。你有的是天下第一等的名望,和一張永遠不肯閉上的嘴 —— 十八年後,那張嘴會要了你全家的命。',
        en: 'You are Kong Rong, twentieth-generation descendant of Confucius, Chancellor of Beihai. At four you gave away the larger pear; at ten you out-talked Li Ying\'s guests. Fame came to you earlier than anything else in your life.\n\nYou govern Beihai by founding schools, honouring the classics and burying the unclaimed dead. "My hall is always full of guests and my cup is never empty — what have I to worry about?" You are indeed no soldier: when Guan Hai\'s Turbans ringed the city it was Taishi Ci who broke out alone to fetch help.\n\nYou hold two cities and four men. What you have is the first reputation in the realm, and a mouth that will not stay shut — eighteen years from now, that mouth will cost your whole household their lives.',
      },
      'ma-teng': {
        zh: '你是馬騰,伏波將軍馬援之後,母親是羌人。身長八尺餘,面鼻雄異,而性賢厚 —— 涼州人敬你,不只因為你能打。\n\n你與韓遂結為異姓兄弟,又反目成仇,又和解,反覆數次。涼州的規矩就是這樣:今日的盟友是昨日殺你部曲的人。\n\n關東諸侯在會盟飲酒,你在西邊守著一座武威城。他們爭的是天下,你爭的是明年的糧。',
        en: 'You are Ma Teng, descended from the Wave-Subduing General Ma Yuan, your mother a Qiang. Eight feet tall with a striking face, and known for being decent — Liang men respect you, and not only because you can fight.\n\nYou and Han Sui swore to be brothers, then became enemies, then made peace, and then did it all again. That is how Liang works: today\'s ally is the man who killed your retainers last year.\n\nThe lords east of the pass are drinking at their alliance banquet. You are out west holding one city at Wuwei. What they are fighting over is the empire. What you are fighting over is next year\'s grain.',
      },
    },
  },

  'scn-192-wangyun': {
    intro: {
      zh: '初平三年四月,司徒王允與呂布誅董卓於北掖門。長安士民歌舞於道,賣珠玉衣裝以相慶,填滿街肆。卓屍暴於市,守屍吏為大炷置卓臍中,光明達曙,如是積日。\n\n然後王允不肯赦涼州兵。李傕、郭汜本欲各自散去,賈詡曰:「聞長安中議欲盡誅涼州人,而諸君棄眾單行,即一亭長能束君矣。」於是聚眾西向,十日之間,長安又破。',
      en: 'In the fourth month the Minister over the Masses Wang Yun and Lü Bu killed Dong Zhuo at the northern palace gate. The people of Chang\'an sang and danced in the streets and sold their jewellery to pay for the celebration. His corpse was exposed in the market, and the guard set a great wick in the navel; it burned till dawn, and for days after.\n\nThen Wang Yun refused to pardon the Liang soldiers. Li Jue and Guo Si were ready to scatter and go home until Jia Xu told them: "If Chang\'an means to kill every Liang man, and you disband and travel alone, one village constable could arrest you." So they gathered instead and marched west. In ten days Chang\'an fell again.',
    },
    forces: {
      'yuan-shao': {
        zh: '你是袁紹。討董的盟主散了,而你手上多了一個渤海。\n\n韓馥讓出冀州那天,你連一兵都沒有動 —— 逢紀說「取冀州,只需一封信與公孫瓚的兵鋒」,他說對了。\n\n四世三公之後,門生故吏遍於天下。現在你要的不再是名望,是地。',
        en: 'You are Yuan Shao. The coalition against Dong Zhuo has come apart, and you have Bohai out of it.\n\nOn the day Han Fu handed over Ji province you had not moved a single soldier — Feng Ji had said it would take one letter and the threat of Gongsun Zan\'s cavalry, and he was right.\n\nFour generations of ministers; your family\'s clients are everywhere. What you need now is not reputation. It is ground.',
      },
      'liu-biao': {
        zh: '你是劉表。單騎入宜城,誅宗賊五十五人,而後荊州定。\n\n八郡之地,帶甲十餘萬,兵不出境,士不遠征。北方在打,你聽著。\n\n人說你是坐談客。也許。但荊州這十七年沒有兵災,那是你做到的。',
        en: 'You are Liu Biao. You rode into Yicheng alone, had fifty-five bandit-chiefs of the great houses put to death, and Jing province settled.\n\nEight commanderies, a hundred thousand under arms, and no army sent beyond the border. The north is fighting. You listen.\n\nThey call you a man for talk. Perhaps. But Jing province has seventeen years without war in it, and that was your doing.',
      },
      'tao-qian': {
        zh: '你是陶謙。徐州殷實,穀米豐贍,流民多歸之。\n\n而你老了。曹嵩死在你的地界上 —— 不論那是不是你的意思,曹操已經來過一次。\n\n守得住一年,是一年。',
        en: 'You are Tao Qian. Xu province is rich, its granaries full, and refugees keep coming to it.\n\nAnd you are old. Cao Song died on your ground — whatever your part in it, Cao Cao has already come once.\n\nEvery year it holds is a year won.',
      },
      'liu-yan': {
        zh: '你是劉焉。你求益州牧,是因為望氣者說益州有天子氣。\n\n到任第一件事,是遣張魯斷絕斜谷閣道,殺漢使。從此朝廷的詔書進不來。\n\n私造乘輿車具千餘乘。這件事沒有人問過你要做什麼。',
        en: 'You are Liu Yan. You asked for Yi province because the diviners said it had the air of a Son of Heaven.\n\nThe first thing you did on arrival was send Zhang Lu to cut the plank roads through the Xie valley and kill the court\'s envoys. No edict has reached you since.\n\nA thousand carriages of imperial pattern, quietly built. Nobody has yet asked you what they are for.',
      },
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
      'ma-teng': {
        zh: '你是馬騰。伏波將軍馬援之後,而母親是羌女 —— 涼州人叫你「馬兒」,中原人不太提你的出身。\n\n身長八尺餘,面鼻雄異,而性賢厚,人多敬之。你和韓遂結為異姓兄弟,一起在涼州打了很多年。\n\n這裡沒有朝廷。誰有兵,誰就是刺史。\n\n關中的糧不夠養這麼多兵,所以你們每隔幾年就要往東走一趟。',
        en: 'You are Ma Teng, descended from the Wave-Calming General Ma Yuan, and your mother was a Qiang woman — in Liang they call you \'the horse boy\'; in the central plain they do not raise the subject.\n\nEight feet and more, a striking face and nose, and a generous temper: men respect you.\n\nThere is no court out here. Whoever has troops is the inspector.\n\nGuanzhong does not grow enough to feed this many soldiers, which is why every few years you all have to walk east.',
      },
      gongsun: {
        zh: '你是公孫瓚。白馬義從追著烏丸的騎兵打了十年,邊地的人叫你白馬將軍。\n\n界橋一戰輸給了袁紹的大戟士。自此你退,再退。\n\n易京的樓還沒有築起來 —— 現在動手,還來得及不用築它。',
        en: 'You are Gongsun Zan. For ten years the White Horse Volunteers ran down Wuhuan cavalry, and the frontier called you the White Horse General.\n\nAt Jieqiao you lost to Yuan Shao\'s halberdiers. Since then you have drawn back, and back again.\n\nThe towers at Yi have not been built yet. Move now and you may never need them.',
      },
      'kong-rong': {
        zh: '你是孔融。孔子二十世孫,北海相。\n\n你立學校,表顯儒術,收葬枯骨 —— 而黃巾就在城外,管亥圍城,你派太史慈突圍求救於平原。\n\n士人稱你為天下名士。名士守不住城。',
        en: 'You are Kong Rong, twentieth in descent from Confucius, Chancellor of Beihai.\n\nYou founded schools, honoured the classics, buried the unclaimed dead — and the Turbans are outside the wall. Guan Hai has you surrounded and you have sent Taishi Ci through the lines to beg help from Pingyuan.\n\nThe gentry call you the first scholar of the age. Scholarship does not hold walls.',
      },
      'liu-biao': {
        zh: '你是劉表。北方打成一片,而荊州安。\n\n孫堅死在峴山,他的兒子在江東長大;袁術在南陽吃你的糧。你既不北上,也不南下。\n\n這叫守成。守成之主的難處是:守到什麼時候為止?',
        en: 'You are Liu Biao. The north is one long war, and Jing province is quiet.\n\nSun Jian died at Xian hill; his son is growing up in the Southland. Yuan Shu is in Nanyang eating your grain. You march neither north nor south.\n\nThey call it keeping what you have. The trouble with keeping is knowing when to stop.',
      },
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
      'yuan-shao': {
        zh: '四世三公,門生故吏遍天下。你據冀、青、并三州,帶甲數十萬 —— 此刻的你是天下最強的人,沒有第二個。\n\n沮授勸你「迎大駕於西京,挾天子而令諸侯」。你不肯。你的理由不是不懂:是天子在你營中,你每做一件事都得先請旨,而你已經習慣了不請旨。\n\n那個機會會被許都那個兵不滿萬的人撿走。五年之後,你們在官渡見面。',
        en: 'Four generations of the highest office; your family\'s clients and former subordinates fill the empire. You hold Ji, Qing and Bing with hundreds of thousands under arms — at this moment you are the strongest man alive, and there is no second.\n\nJu Shou urges you to fetch the emperor from the west and command the lords in his name. You refuse. Not because you fail to see it: because with an emperor in your camp you would have to ask permission for everything, and you have long since stopped asking.\n\nThe man at Xu with fewer than ten thousand troops will pick that chance up instead. Five years from now you meet him at Guandu.',
      },
      'lu-bu': {
        zh: '你是呂布。天下無人騎得過你,也無人再敢信你第二次。丁原、董卓,兩個提拔你的人都死在你手上 —— 這件事你走到哪裡都跟著。\n\n兗州敗於曹操,你來投劉備,然後趁他出兵取了下邳。陳宮還在你身邊,高順、張遼、臧霸也在。這些人明知道你是什麼人,還是留下了。\n\n四年後白門樓上,你會說「縛太急」,會說「明公所患不過於布,今布服矣」。曹操幾乎心動。然後劉備開口:「公不見丁建陽、董卓之事乎?」',
        en: 'You are Lü Bu. No man alive rides better, and no man will trust you twice. Ding Yuan and Dong Zhuo both raised you up and both died by your hand — that follows you everywhere.\n\nBeaten out of Yan by Cao Cao, you came to Liu Bei for shelter and took Xiapi the moment he marched. Chen Gong is still with you. So are Gao Shun, Zhang Liao, Zang Ba. Every one of them knows exactly what you are, and stayed.\n\nFour years from now on the White Gate Tower you will say "the ropes are too tight," and "what my lord feared was only Bu, and Bu now submits." Cao Cao will very nearly agree. Then Liu Bei will speak: "Has my lord forgotten Ding Jianyang and Dong Zhuo?"',
      },
      'liu-biao': {
        zh: '荊州地方數千里,帶甲十餘萬,士人南奔者以萬計。你不出兵,誰也奈何不了你。\n\n只有一件事跟著你:四年前,孫堅為你攻襄陽,死在峴山的竹林裡,射他的是你的部將黃祖。\n\n那個孩子如今二十一歲,剛過了江。他遲早會來要這筆帳,而黃祖還在江夏替你守著門。',
        en: 'Jing province runs thousands of li, over a hundred thousand under arms, scholars fleeing south to you in their tens of thousands. So long as you do not march, no one can touch you.\n\nOne thing does follow you. Four years ago Sun Jian came against Xiangyang for you and died in the bamboo on Mount Xian, shot by your officer Huang Zu.\n\nThat man\'s boy is twenty-one now and has just crossed the river. He will come to collect. And Huang Zu is still down at Jiangxia, holding your door.',
      },
      'liu-yan': {
        zh: '你是劉璋。父親劉焉去年死了,益州的官吏推你繼位 —— 他們挑的不是最能幹的兒子,是最好說話的那個。趙韙的原話是:「璋溫仁。」\n\n漢中的張魯已經不聽你了。你殺了他的母親和弟弟,他關了棧道,從此蜀道以北不再是你的。\n\n你手上有法正、張任、嚴顏、黃權,個個是人物 —— 十九年後,你會在成都城裡看著他們替你守城,然後開門投降。你說的是:「父子在州二十餘年,無恩德以加百姓,而百姓攻戰三年,肌膏草野者,以璋故也,何心能安!」',
        en: 'You are Liu Zhang. Your father Liu Yan died last year and the officials of Yi put you on the seat — not the ablest son, the most agreeable one. Zhao Wei\'s exact words were: "Zhang is mild."\n\nZhang Lu in Hanzhong no longer answers you. You killed his mother and his brother; he closed the plank roads, and everything north of them stopped being yours.\n\nYou hold Fa Zheng, Zhang Ren, Yan Yan, Huang Quan — every one of them a figure. Nineteen years from now you will watch them defend Chengdu for you, and then open the gates. What you will say is: "My father and I held this province twenty years and gave the people nothing; they have fought three years and their flesh has fed the fields, and it is because of me. How could my heart be easy?"',
      },
      gongsun: {
        zh: '界橋之後,你就沒有再贏過。麴義的先登死士破了你的白馬義從,袁紹一步一步壓過來。\n\n所以你築了易京:塹十重,起京數十,中央高樓十丈,積穀三百萬斛。你把家眷遷進去,說「兵法百樓不攻」,又說「當今四方虎爭,無有能坐吾城下相守經年者也」。\n\n城裡不許男子近前,傳令用女人的聲音喊過牆頭。你的部將在外面被圍,你不救 —— 你說救了一個,以後個個都等著人救。於是再沒有人替你死。',
        en: 'Since Jieqiao you have not won again. Ju Yi\'s vanguard broke your White Horse Volunteers, and Yuan Shao has been closing ever since.\n\nSo you built Yijing: ten rings of ditch, dozens of raised mounds, a central tower a hundred feet high, three million bushels of grain. You moved your household inside and said that by the art of war a hundred towers are not assaulted — and that in an age of tigers no one can sit under your walls for years.\n\nInside, no man may approach you; orders are relayed over the wall by women\'s voices. When your commanders are surrounded outside you do not relieve them — relieve one, you said, and every one of them will sit and wait to be relieved. So no one dies for you any more.',
      },
      'ma-teng': {
        zh: '去年你與韓遂東出,敗於長平觀。朝廷下詔赦你,拜征西將軍,你回了涼州 —— 這是涼州的常態:打、和、再打,而每一次和解都埋著下一次的仇。\n\n馬超今年二十,已經能自己領兵了。龐德在你帳下。韓遂是你的異姓兄弟 —— 也是十年後親手殺你全家八千里外那個消息的源頭。\n\n關東的人在爭天下。你要守的是隴西的春耕。',
        en: 'Last year you and Han Sui marched east and were beaten at Changping Guan. The court pardoned you, made you General Who Conquers the West, and you went home — that is the rhythm of Liang: fight, make peace, fight again, and every peace carries the next feud inside it.\n\nMa Chao is twenty and leads his own men now. Pang De is in your tent. Han Sui is your sworn brother — and, ten years from now, the reason a message arrives from two thousand miles away saying your household is dead.\n\nThe men east of the pass are fighting for the empire. What you have to protect is the spring sowing in Longxi.',
      },
      'yan-baihu': {
        zh: '你是嚴白虎,吳郡的萬人之長,自稱東吳德王。這一帶的塢堡認你的號令,不認朝廷的印。太守換了幾任,你一任也沒少收過糧。\n\n江北來了個二十一歲的孩子,帶著千餘人。你弟弟嚴輿去談,說劃江而治。\n\n孫策在席上一手戟擲了過去。',
        en: 'You are Yan Baihu, chief of ten thousand in Wu commandery, styling yourself Prince of Virtue of Eastern Wu. The stockades hereabouts obey you and not the court\'s seals. Governors have come and gone; not one of them ever cut your take of the grain.\n\nA twenty-one-year-old has crossed from the north with a thousand-odd men. Your brother Yan Yu goes to negotiate — a river between us, each to his own bank.\n\nAt the table, Sun Ce throws a halberd.',
      },
      'hua-xin': {
        zh: '你是華歆,豫章太守。少時與管寧同席讀書,門外有乘軒者過,你抬頭看了一眼 —— 管寧割席分坐,說「子非吾友也」。這件事跟了你一輩子。\n\n孫策渡江而來,你會整衣冠出迎。他以上賓之禮待你,說「府君年德名望,遠近所歸」。豫章不流一滴血。\n\n世人說你潔身,你確實不受饋遺。可是十九年後,是你帶著兵進宮,親手把伏皇后從壁中牽出來。她披髮徒跣過殿,問天子「不能復相活邪」,天子說「我亦不知命在何時」。那時你已經是尚書令了。',
        en: 'You are Hua Xin, Grand Administrator of Yuzhang. As a boy you shared a reading mat with Guan Ning; a nobleman\'s carriage passed the gate and you looked up — Guan Ning cut the mat in two and said, "You are no friend of mine." That has followed you all your life.\n\nWhen Sun Ce crosses the river you will straighten your robes and go out to meet him. He will receive you as an honoured guest and say your years and reputation draw men from far and near. Yuzhang will not lose a drop of blood.\n\nMen call you incorruptible, and it is true that you take no gifts. Yet nineteen years from now it is you who will come into the palace with soldiers and pull the Empress Fu out of the wall she hid in. She will be dragged barefoot past the hall, her hair loose, and ask the emperor whether he cannot keep her alive; he will answer that he does not know how long his own life is. By then you will be Master of Writing.',
      },
      'wang-lang': {
        zh: '你是王朗,會稽太守,經學之士,朝廷所命。虞翻勸你:孫策兵精,不如避之。你不肯 —— 你說你受漢的印綬,守的是漢的郡,豈能望風而走。\n\n你會敗,會浮海奔東冶,會被追上俘獲。孫策念你是儒者,責而不害。\n\n三十年後你官至魏司徒。而在後世的說書人口中,你會被寫成陣前被人罵死的那個老頭 —— 史書上的你,其實是個到死都認為守土是本分的人。',
        en: 'You are Wang Lang, Grand Administrator of Kuaiji, a classicist holding a court appointment. Yu Fan advises you: Sun Ce\'s troops are sharp, better to avoid him. You refuse — you hold the Han\'s seal over the Han\'s commandery, and an officer does not run at the sight of dust.\n\nYou will lose, take ship for Dongye, and be run down and captured. Sun Ce, out of regard for a scholar, will scold you and let you live.\n\nThirty years on you will be Minister over the Masses of Wei. And in the storytellers\' version you will be the old man argued to death in front of an army — when the man in the histories simply believed to the end that holding one\'s ground was the job.',
      },
    },
  },

  'scn-197-bohai': {
    intro: {
      zh: '建安二年。袁紹已破公孫瓚於易京之外,幽冀連為一體,帶甲數十萬,謀臣如雲,猛將如雨。\n\n曹操在許,兵不滿萬,傷者十二三。孔融說袁紹之強不可敵,荀彧說:紹兵雖眾而法不整,田豐剛而犯上,許攸貪而不治,審配專而無謀,逢紀果而自用 —— 此數人者,勢不相容,必生內變。\n\n黃河兩岸,各自屯糧。',
      en: 'Yuan Shao has broken Gongsun Zan outside Yijing; You and Ji are one realm now, with hundreds of thousands under arms, advisers like clouds and generals like rain.\n\nCao Cao is at Xu with fewer than ten thousand men, a fifth of them wounded. Kong Rong says Yuan Shao cannot be fought. Xun Yu answers: his troops are many but his discipline is not; Tian Feng is rigid and offends his lord, Xu You is greedy and unruly, Shen Pei is domineering and unsubtle, Feng Ji is decisive and self-willed — these men cannot coexist, and the break will come from inside.\n\nOn both banks of the Yellow River, the granaries fill.',
    },
    forces: {
      'ma-teng': {
        zh: '你是馬騰。你和韓遂鬧翻了 —— 兄弟一場,而涼州只有那麼多糧。\n\n他殺了你的妻子。你殺了他的部曲。然後朝廷派人來調解,你們又和好了。\n\n這種和好在涼州不算稀奇。稀奇的是它一次也沒有真的成立過。\n\n兒子馬超今年二十二,已經有了名聲。',
        en: 'You are Ma Teng. You and Han Sui have fallen out — sworn brothers once, and Liang province only grows so much grain.\n\nHe killed your wife. You killed his retainers. Then the court sent someone to reconcile you, and you were friends again.\n\nReconciliation of that kind is not unusual in Liang. What is unusual is that not one of them has ever actually held.\n\nYour son Ma Chao is twenty-two this year and already has a name.',
      },
      'yuan-shu': {
        zh: '你是袁術。傳國玉璽在你手上,你稱了帝,國號仲氏。\n\n然後淮南大旱,士卒散,部將叛。你的宮室還在修。\n\n四世三公之後 —— 你一直覺得那四個字是給你的,不是給你那個庶出的哥哥的。',
        en: 'You are Yuan Shu. The Heirloom Seal is in your hands; you have taken the imperial title and named your dynasty Zhong.\n\nThen the drought came to Huainan, the soldiers scattered and the generals went over. Your palace is still being built.\n\nFour generations of ministers — you always felt those words were meant for you, and not for that half-brother of yours.',
      },
      'liu-biao': {
        zh: '你是劉表。曹操在宛城折了長子與典韋,袁紹在河北收拾公孫瓚。\n\n而荊州無事。張繡在宛城替你擋著北面,你給他糧。\n\n這是最好的一年。最好的一年之後,通常沒有更好的了。',
        en: 'You are Liu Biao. Cao Cao has lost his eldest son and Dian Wei at Wancheng; Yuan Shao is finishing Gongsun Zan in the north.\n\nAnd Jing province is untouched. Zhang Xiu holds Wancheng as your shield to the north, and you send him grain.\n\nThis is the best year. After the best year there is usually not a better one.',
      },
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
      'ma-teng': {
        zh: '你是馬騰。鍾繇來了 —— 曹操派他鎮撫關中,而他做的第一件事是寫信給你和韓遂。\n\n信裡說得很客氣:朝廷不欲用兵於西,諸君能各安其部,則爵祿可保。\n\n你送了兒子去許都當人質。這在涼州叫識時務。\n\n識時務的人通常活得比較久,只是活得比較不像自己。',
        en: 'You are Ma Teng. Zhong Yao has arrived — Cao Cao sent him to pacify Guanzhong, and the first thing he did was write to you and Han Sui.\n\nThe letter was very courteous: the court has no wish to use arms in the west, and if you gentlemen each keep your own commands, your ranks and stipends are safe.\n\nYou sent a son to Xuchang as a hostage. In Liang that is called reading the times.\n\nPeople who read the times generally live longer. They just live less like themselves.',
      },
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
      'ma-teng': {
        zh: '你是馬騰。袁曹要在官渡決勝負,而兩邊都遣使來拉你。\n\n鍾繇說:曹公方有事於東,若將軍與之,則西方無憂矣。你派了馬超率萬餘人去助他打郭援。\n\n那一仗龐德斬了郭援 —— 你的人替曹操打贏了。\n\n替別人打贏的仗,記在別人的功勞簿上。這一點你當時大概沒有多想。',
        en: 'You are Ma Teng. Yuan and Cao are about to settle it at Guandu, and both sides have sent men to court you.\n\nZhong Yao says: the Duke of Cao has business in the east; if you side with him, the west need not worry him.\n\nYou sent Ma Chao with ten thousand and more to help against Guo Yuan. Pang De took Guo Yuan\'s head in that battle — your men won it for Cao Cao.\n\nBattles won for other people go into other people\'s ledgers. You probably did not think much about that at the time.',
      },
      'liu-biao': {
        zh: '你是劉表。易京的樓燒起來的時候,你在襄陽聽學。\n\n荊州的學官比中原任何一處都齊全,綦毋闓、宋忠在寫五經章句。北方每死一個人,你這裡就多幾個讀書人。\n\n這不是逃避。這是你選的那一種天下。',
        en: 'You are Liu Biao. When the towers at Yi burned you were at Xiangyang, listening to a lecture.\n\nJing province keeps more classical scholars than anywhere in the central plain; Qiwu Kai and Song Zhong are writing commentaries on the Five Classics. Every man who dies in the north sends you another reader.\n\nThis is not evasion. It is the kind of realm you chose.',
      },
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
      'ma-teng': {
        zh: '你是馬騰。曹操在河北收拾袁氏,而關中安靜了幾年。\n\n你和韓遂又鬧翻了,朝廷又來調解,你們又和好了。這是第幾次,涼州沒有人數。\n\n有人勸你入朝為衛尉 —— 交出兵權,換一個九卿。\n\n你今年五十多了。打了一輩子,而涼州的糧還是不夠。',
        en: 'You are Ma Teng. Cao Cao is finishing the Yuan family in the north, and Guanzhong has had a few quiet years.\n\nYou and Han Sui have fallen out again, the court has mediated again, and you are friends again. Nobody in Liang is counting which time this is.\n\nSomeone is suggesting you come to court as Commandant of the Guards — hand over the troops, take a seat among the Nine Ministers.\n\nYou are past fifty. A lifetime of fighting, and Liang still does not grow enough grain.',
      },
      'zhang-lu': {
        zh: '你是張魯。祖父張陵在鶴鳴山造符書,父親張衡傳之,到你這裡是第三代。\n\n漢中的路是你自己斷的:殺漢使,絕斜谷閣道。朝廷拿你沒辦法,就給了個鎮民中郎將,領漢寧太守 —— 承認你在這裡是合法的。\n\n治下不置長吏,以祭酒為治;置義舍,米肉懸於道,行路者量腹取足。犯法者三原而後刑。\n\n民、夷便樂之。這句話是史書寫的,不是你自己說的。',
        en: 'You are Zhang Lu. Your grandfather Zhang Ling wrote the talismans at Heming mountain, your father Zhang Heng passed them on, and you are the third.\n\nYou cut the road to Hanzhong yourself: killed the court\'s envoys, broke the plank galleries through the Xie valley. Unable to reach you, the court made you a General of the Household and Grand Administrator of Hanning — which is to say, legal.\n\nYou appoint no magistrates; the libationers govern. You keep charity lodges with rice and meat hung by the road for travellers to take what they need. An offender is forgiven three times before he is punished.\n\n',
      },
      'shi-xie': {
        zh: '你是士燮。交趾太守,兄弟四人分領合浦、九真、南海。\n\n中原大亂,而這裡沒有。士人避地來歸者以百數,你養著他們;鐘鳴磬響,胡人夾轂焚香者常有數十。\n\n出入鳴鐘磬,備具威儀,笳簫鼓吹,車騎滿道 —— 有人說這是僭越。那些人在北方,而北方在打仗。\n\n你今年六十七。你會活到九十歲。',
        en: 'You are Shi Xie, Grand Administrator of Jiaozhi; your three brothers hold Hepu, Jiuzhen and Nanhai between them.\n\nThe central plain is in chaos and this place is not. Scholars fleeing the wars come by the hundred and you keep them. Bells and chimes sound, and there are always a few dozen foreigners walking beside your carriage burning incense.\n\nBells and chimes when you go out, full ceremonial, pipes and drums, the road filled with horsemen — some call it presumption. Those people are in the north, and the north is at war.\n\nYou are sixty-seven. You will live to ninety.',
      },
      'liu-zhang': {
        zh: '你是劉璋。父親留下的益州,和父親留下的問題:東州兵與益州士族,誰也不服誰。\n\n趙韙反了,你平了。你以為那是最後一次。\n\n張魯在漢中不聽號令 —— 你殺了他母親和弟弟,而漢中還是他的。\n\n你性寬柔,無威略。這是《三國志》給你的四個字,而你自己覺得那叫寬厚。',
        en: 'You are Liu Zhang. Your father left you Yi province and your father\'s problem with it: the Eastern Province troops and the local gentry, neither yielding to the other.\n\nZhao Wei revolted and you put him down. You assumed that was the last of it.\n\nZhang Lu in Hanzhong will not take your orders — you had his mother and brother killed, and Hanzhong is still his.\n\n\'Mild and pliant, without authority or strategy.\' That is what the histories give you, in six words. You would call it generosity.',
      },
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
      'liu-biao': {
        zh: '兩強在官渡相持,誰勝了都要回頭找你。這是你這輩子唯一一次,只要伸手就能改寫天下的機會。\n\n袁紹遣使求援,你許之而不至;曹操在許都空虛,你也不動。劉表傳裡那句話寫得很直:「欲保江漢間,觀天下變。」\n\n韓嵩勸你擇一而從,你不肯;劉先說「豪傑並爭,兩雄相持,天下之重,在於將軍」,你還是不肯。\n\n八年後曹操南下,你的兒子開城投降。荊州十八年不動一兵,最後一次也沒動。',
        en: 'The two great powers are locked at Guandu, and whichever wins will come looking for you. This is the one moment in your life when reaching out your hand would change the empire.\n\nYuan Shao sends for help; you promise and do not go. Cao Cao has left Xuchang bare; you do not move. Your biography puts it plainly: "He meant to hold the Han and the Yangtze and watch the realm change."\n\nHan Song urges you to pick a side. You refuse. Liu Xian tells you that with the champions locked together, the weight of the empire rests with you. You refuse again.\n\nEight years from now Cao Cao comes south and your son opens the gates. Eighteen years and Jing never moved a soldier — not even this once.',
      },
      'liu-zhang': {
        zh: '中原打得天翻地覆,而蜀道之難,難於上青天 —— 這是益州的護身符,也是它的墓誌銘。\n\n你在成都收到兩邊的使者:曹操表你為振威將軍,你受了;袁紹也來拉攏,你不理。你派龐羲去守巴西,防的不是曹操,是漢中的張魯。\n\n你手上的地方,是這個時代唯一沒被戰火犁過的沃野。而你的問題從來不是外面打不進來,是裡面的人不想跟著你。',
        en: 'The central plains are tearing themselves apart, and the roads into Shu are harder than climbing to heaven — that is Yi province\'s charm and its epitaph.\n\nEnvoys reach Chengdu from both sides. Cao Cao names you General Who Displays Might and you accept it; Yuan Shao courts you and you ignore him. You send Pang Xi to hold Baxi — not against Cao Cao, against Zhang Lu in Hanzhong.\n\nWhat you hold is the one stretch of rich country this age has not ploughed with war. Your problem was never that outsiders cannot get in. It is that the men inside do not want to follow you.',
      },
      'ma-teng': {
        zh: '官渡相持,關中十部各擁強兵,誰也不服誰。鍾繇以司隸校尉持節督關中,寫信曉諭諸將 —— 你與韓遂各遣子入侍為質。\n\n這一步救了曹操:袁紹遣高幹、郭援入河東,鍾繇向你求援,你派馬超率萬餘人赴之,龐德親手斬了郭援,提首級來見。\n\n所以官渡那一仗,你在西邊替曹操按住了背後。他記得這件事 —— 記到十二年後,把你全家二百餘口下了獄。',
        en: 'While the armies sit at Guandu, ten commands hold Guanzhong and none of them obeys another. Zhong Yao comes as Colonel-Director with the staff of authority and writes to every general — you and Han Sui each send a son to court as surety.\n\nThat move saves Cao Cao. When Yuan Shao pushes Gao Gan and Guo Yuan into Hedong, Zhong Yao asks you for help; you send Ma Chao with over ten thousand men, and Pang De cuts Guo Yuan down and brings in the head.\n\nSo at Guandu it was you who held Cao Cao\'s back door in the west. He remembers it — remembers it for twelve years, and then puts your household of two hundred in prison.',
      },
      wuhuan: {
        zh: '你是蹋頓,烏丸大人。袁紹矯詔賜你單于印綬,又以宗室之女妻你 —— 中原人肯這樣待烏丸,是頭一遭。所以袁氏敗了,你收留他的兒子。\n\n遼西、右北平、遼東屬國三郡烏丸,控弦十萬。塞外的規矩很簡單:誰給糧、誰給印、誰把女兒嫁過來,就跟誰。\n\n七年後曹操會親自出塞。郭嘉勸他輕兵疾進,田疇引路走盧龍塞的舊道,大軍在白狼山上忽然出現在你面前 —— 那天你連陣都沒列完。',
        en: 'You are Tadun, chieftain of the Wuhuan. Yuan Shao forged an edict granting you the seal of a Chanyu and gave you a woman of the imperial clan to wife — no Han lord had ever treated the Wuhuan like that. So when the Yuan were broken, you took in his sons.\n\nThree Wuhuan commanderies — Liaoxi, Youbeiping, the Liaodong dependent state — a hundred thousand bows. The rule beyond the wall is simple: whoever brings grain, seals and daughters is the one you ride for.\n\nSeven years from now Cao Cao comes out past the wall himself. Guo Jia tells him to travel light and fast; Tian Chou leads them by the old road through Lulong. The army appears on White Wolf Mountain in front of you — and that day you never finish forming your line.',
      },
    },
  },

  'scn-207-three-visits': {
    intro: {
      zh: '建安十二年,劉備屯新野。徐庶臨行薦諸葛亮:「此人可就見,不可屈致也。將軍宜枉駕顧之。」\n\n凡三往,乃見。因屏人曰:「漢室傾頹,奸臣竊命,主上蒙塵。孤不度德量力,欲信大義於天下,而智術淺短,遂用猖蹶,至於今日。然志猶未已,君謂計將安出?」\n\n對曰:「今操已擁百萬之眾,挾天子而令諸侯,此誠不可與爭鋒。孫權據有江東,已歷三世,此可以為援而不可圖也。荊州北據漢沔,利盡南海,東連吳會,西通巴蜀,此用武之國。益州險塞,沃野千里,天府之土……」',
      en: 'Liu Bei is quartered at Xinye. Xu Shu, leaving his service, recommends Zhuge Liang: "This man can be visited; he cannot be summoned. You should go to him yourself."\n\nThree journeys before the meeting. Then, with the room cleared: "The House of Han is falling, treacherous men have stolen the mandate, the emperor is a fugitive. Without measuring my own virtue or strength I have wanted to make right prevail in the realm, and my judgement has been so shallow that I am reduced to this. Yet the ambition has not left me. What plan would you give me?"\n\nThe answer: "Cao Cao has a million men and holds the Son of Heaven to command the lords — there is no contesting him head-on. Sun Quan holds Jiangdong through three generations — he may be made an ally, not a target. Jing province commands the Han and Mian rivers, draws profit from the southern sea, links to Wu in the east and Ba-Shu in the west: it is a land made for war. Yi province is walled by its passes, a thousand li of rich fields, the storehouse of Heaven…"',
    },
    forces: {
      'ma-teng': {
        zh: '你是馬騰。北方定了。曹操平了烏桓,回過頭來,西邊只剩你們。\n\n徵你入朝的詔書會來的 —— 不是今年就是明年。去了,兵是馬超的;不去,就是反。\n\n三年後你會去。你的兒子會反。你和你的兩百多口宗族會死在許都。\n\n這件事現在還沒有發生。現在你還在涼州,還有兵。',
        en: 'You are Ma Teng. The north is settled. Cao Cao has finished the Wuhuan, and when he turns round, the west is what is left.\n\nThe summons to court will come — this year or next. Go, and the army becomes Ma Chao\'s; refuse, and it is rebellion.\n\nIn three years you will go. Your son will rebel. You and more than two hundred of your kin will die at Xuchang.\n\nNone of that has happened yet. For now you are still in Liang, and you still have the army.',
      },
      'zhang-lu': {
        zh: '你是張魯。漢中十七年了。\n\n北面曹操剛剛平定烏桓,南面劉璋殺了你的母親而不敢再北上。你夾在兩個人中間,而兩個人都還沒空。\n\n有人在民間掘出玉印,勸你稱漢寧王。閻圃說:「漢川之民,戶出十萬,財富土沃,四面險固;上匡天子,則為桓文,次及竇融,不失富貴。今承制署置,勢足斬斷,不煩於王。」\n\n你聽了他的。稱王的人先死,這件事你比誰都清楚。',
        en: 'You are Zhang Lu. Seventeen years in Hanzhong.\n\nNorth of you Cao Cao has just finished the Wuhuan; south of you Liu Zhang killed your mother and has not dared come up since. You are between two men, and neither has time for you yet.\n\nSomeone dug a jade seal out of a field and they want you to call yourself King of Hanning. Yan Pu said: \'The people of the Han valley are a hundred thousand households, the land rich, the passes strong on every side. Aid the Son of Heaven and you are a Duke Huan; failing that, a Dou Rong, and you keep your wealth. You already appoint whom you please and can execute whom you please. A crown adds nothing.\'\n\nYou listened. You know better than anyone that the ones who take crowns die first.',
      },
      'shi-xie': {
        zh: '你是士燮。交州四十年無事。\n\n孫權在江東立了腳,遣使來通好;曹操以朝廷之名遙授你綏南中郎將。兩邊都給你名號,兩邊都不來。\n\n這是你要的。名號不值錢,不來才值錢。\n\n你送去的貢物年年不斷:明珠、大貝、流離、翡翠、玳瑁、犀、象。買的不是官,是路上的安靜。',
        en: 'You are Shi Xie. Forty years without an alarm in Jiao province.\n\nSun Quan has his footing in the Southland and sends envoys to be friendly; Cao Cao, in the court\'s name, grants you a general\'s title from a long way off. Both sides give you names. Neither side comes.\n\nThat is the arrangement you want. The names are worth nothing. The not-coming is worth everything.\n\nThe tribute goes north every year without fail: pearls, great shells, glass, kingfisher feathers, tortoiseshell, rhinoceros horn, ivory. You are not buying office. You are buying quiet on the roads.',
      },
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
      'liu-biao': {
        zh: '你是劉琮。父親八月死了,蔡瑁、張允、蒯越把你推上位 —— 兄長劉琦在江夏,他們沒讓他回來奔喪。\n\n曹操的大軍到了新野。傅巽對你說:「以人臣而拒人主,逆也;以新造之楚而御國家,其勢弗當也;以劉備而敵曹公,又不當也。三者皆短,欲以抗王兵之鋒,必亡之道也。」他還問了一句最誅心的:「將軍自料何如劉備?」你答不上來。\n\n他們沒有一個人問過你想不想打。降書送出去的時候,劉備還在樊城,沒有人告訴他。\n\n荊州水軍蒙衝鬥艦以千數,現在都是曹操的了。這一年你十七歲。',
        en: 'You are Liu Cong. Your father died in the eighth month and Cai Mao, Zhang Yun and Kuai Yue put you on the seat — your elder brother Liu Qi is at Jiangxia, and they did not send for him to mourn.\n\nCao Cao\'s army has reached Xinye. Fu Xun tells you: "For a subject to resist his sovereign is treason; for a newly-made Chu to withstand the state is hopeless; for Liu Bei to face Lord Cao is hopeless too. All three are against you." Then he asks the question that cuts: "How does the general rate himself beside Liu Bei?" You have no answer.\n\nNot one of them asked whether you wanted to fight. When the letter of surrender went out, Liu Bei was still at Fancheng, and nobody told him.\n\nJing province\'s river fleet — a thousand war-junks and rams — belongs to Cao Cao now. You are seventeen years old.',
      },
      'liu-zhang': {
        zh: '曹操下荊州,你派河內陰溥去道賀,又加送三百兵。曹操表你為振威將軍。\n\n然後你派了張松。張松身材短小、放蕩不治節,而過目不忘 —— 他到許都時,曹操已破荊州,志得意滿,待他甚薄。楊修愛其才,勸曹操辟之,曹操不許。\n\n張松回來,勸你絕曹,結好劉備。你聽了。\n\n他袖子裡的那張西川地圖,原本是要獻給曹操的。',
        en: 'When Cao Cao took Jing you sent Yin Pu of Henei with congratulations, and three hundred soldiers besides. Cao Cao named you General Who Displays Might.\n\nThen you sent Zhang Song. Zhang Song is short, careless of ceremony, and forgets nothing he has read — and when he reached Xuchang, Cao Cao had just broken Jing province, was pleased with himself, and treated him coldly. Yang Xiu admired the man and urged Cao Cao to take him into service. Cao Cao would not.\n\nZhang Song came home and advised you to break with Cao and befriend Liu Bei. You listened.\n\nThe map of the western rivers in his sleeve had been meant for Cao Cao.',
      },
      'zhang-lu': {
        zh: '你是張魯,師君,五斗米道第三代。漢中不設長吏,以祭酒治民;路邊置義舍,米肉懸之,行者量腹取足 —— 取多者,鬼道輒病之。犯法者三原而後刑。\n\n巴、漢之民奉之者數萬戶,朝廷力不能征,就地拜你為鎮民中郎將,領漢寧太守。你在這裡三十年,治的是一個誰也沒見過的東西:一個以道立國的地方。\n\n七年後曹操自散關入。左右想燒了寶貨倉庫再走,你說:「本欲歸命國家,而意未達。今之走,避鋒銳,非有惡意。寶貨倉庫,國家之有。」乃封藏而去。\n\n曹操入南鄭,見府庫完好,嘆息良久,遣人慰勞,拜你鎮南將軍,待以客禮。',
        en: 'You are Zhang Lu, Lord Instructor, third of the Way of Five Pecks of Rice. Hanzhong has no ordinary magistrates; libationers govern the people. Free lodges stand along the roads with rice and meat hung up in them — a traveller takes what fills him, and one who takes more, the spirits make sick. An offender is forgiven three times before he is punished.\n\nTens of thousands of households in Ba and Han follow the Way. The court cannot reach you, so it appointed you on the spot: Palace Gentleman Who Pacifies the People, Administrator of Hanning. Thirty years here, governing a thing nobody else has ever seen — a country founded on a religion.\n\nSeven years from now Cao Cao comes through Sanguan. Your people want to burn the treasury before you go. You say: "I meant to give myself to the state and never managed to say so. Leaving now is avoiding a blade, not malice. The treasury and granaries belong to the state." And you seal them and leave.\n\nCao Cao enters Nanzheng, finds the storehouses whole, sighs a long while, sends men to comfort you, and receives you as a guest.',
      },
      'ma-teng': {
        zh: '這一年朝廷徵你為衛尉。韓遂勸你別去 —— 涼州人都知道,兵權一交,人就是人質。\n\n你去了。你把部曲留給馬超,自己帶著馬休、馬鐵和家眷東遷鄴城。史書上說你「自見年老,遂求還京畿」。\n\n關中還有十部人馬,誰也不服誰。三年後馬超與韓遂舉兵反曹,潼關一戰,渭水為之赤。消息傳到鄴城的時候,你人在城裡,兒子在兩千里外。\n\n那一年,你全家二百餘口下獄。',
        en: 'This year the court summons you to be Commandant of the Guards. Han Sui tells you not to go — every man in Liang knows that once you hand over the army, you are a hostage.\n\nYou go. You leave the retainers to Ma Chao and travel east to Ye with Ma Xiu, Ma Tie and your household. The histories say you "felt your years, and asked to return to the capital region."\n\nTen commands still hold Guanzhong and none obeys another. Three years from now Ma Chao and Han Sui rise against Cao Cao, and at Tong Pass the Wei river runs red. When the news reaches Ye you are inside the city and your son is two thousand li away.\n\nThat year your household of two hundred goes to prison.',
      },
      'shi-xie': {
        zh: '你是士燮,交趾太守,在郡四十餘年。中原大亂,而交州獨全 —— 士人避難來歸者以百數,袁徽寫信給荀彧說你「大亂之中,保全一郡,二十餘年疆場無事,民不失業」。\n\n你出入鳴鐘磬,備具威儀,笳簫鼓吹,車騎滿道;胡人夾轂焚燒香者常有數十。妻妾乘輜軿,子弟從兵騎 —— 當時貴重,震服百蠻,尉他不足踰也。\n\n北邊在打赤壁。你這裡的季節只有兩件事:船什麼時候到,和明年的荔枝。\n\n兩年後孫權遣步騭來,你率兄弟奉承節度。你活到九十歲。而你死後,兒子士徽自署交趾太守,三族被夷。',
        en: 'You are Shi Xie, Administrator of Jiaozhi, forty years in the post. The central plains are in ruins and Jiao province alone is whole — scholars flee to you by the hundred, and Yuan Hui wrote to Xun Yu that you had "kept one commandery entire through the great disorder, twenty years without an alarm on the border, and the people never out of work."\n\nWhen you go out there are bells and chimes, pipes and drums, the road full of carriages; Hu men walk beside the wheels burning incense, often dozens of them. Your wives ride curtained carts, your sons and brothers ride escorted — a state, as the histories say, that even Zhao Tuo did not surpass.\n\nUp north they are fighting at Red Cliffs. Down here the seasons are two questions: when the ships come, and next year\'s lychees.\n\nTwo years from now Sun Quan sends Bu Zhi, and you and your brothers accept his authority. You live to ninety. And after you die your son Shi Hui declares himself administrator, and three branches of your clan are put to the sword.',
      },
    },
  },

  'scn-211-weinan': {
    intro: {
      zh: '建安十六年,曹操遣鍾繇討張魯,關中諸將疑其襲己,馬超、韓遂等十部俱反,眾十萬,屯潼關。\n\n曹操與遂、超單馬會語,不及他事,但說京都舊故,拊手歡笑。既罷,超等問語何言,遂曰:「無所言也。」超等疑之。他日,操與遂書,多所點竄,如遂改定者,超等愈疑遂。\n\n九月,大戰渭南。曹操曰:「關中長遠,若賊各依險阻,征之,不一二年不可定也。今皆來集,其眾雖多,莫相歸服,軍無適主,一舉可滅,為功差易,吾是以喜。」',
      en: 'Cao Cao sent Zhong Yao against Zhang Lu; the Guanzhong generals took it for a move against themselves, and ten companies under Ma Chao and Han Sui rose together — a hundred thousand men camped at Tong Pass.\n\nCao Cao met Han Sui alone on horseback and spoke of nothing but old acquaintances in the capital, clapping his hands and laughing. Afterwards Ma Chao asked what had been said. "Nothing," said Han Sui. They began to wonder. Later Cao Cao sent Han Sui a letter full of crossings-out and corrections, as if Han Sui himself had altered it. After that they wondered a great deal.\n\nIn the ninth month came the battle south of the Wei. Cao Cao said: "Guanzhong is wide, and if the rebels each held their own strongholds it would take a year or two to reduce them. Instead they have all gathered here. Many as they are, none submits to another; the army has no master. One stroke ends it. That is why I am pleased."',
    },
    forces: {
      'zhang-lu': {
        zh: '你是張魯。曹操在潼關與馬超打,而馬超若敗,下一個就是漢中。\n\n劉璋那邊在議請劉備入蜀 —— 名義上是來打你的。\n\n兩面都在動,而你這裡還是照舊:祭酒治民,義舍施米,犯法者三原。\n\n二十年了。你大概是這個天下唯一一個沒打過大仗還活著的人。',
        en: 'You are Zhang Lu. Cao Cao is fighting Ma Chao at Tong pass, and if Ma Chao loses, Hanzhong is next.\n\nIn Chengdu they are debating whether to invite Liu Bei into Shu — nominally to come and deal with you.\n\nBoth sides are moving, and here everything is as it was: libationers governing, rice in the charity lodges, three pardons before a punishment.\n\nTwenty years. You may be the only man left under heaven who has survived this long without fighting a great battle.',
      },
      'shi-xie': {
        zh: '你是士燮。步騭來了,帶著孫權的印綬,也帶著兵。\n\n你率兄弟奉承節度。有人問你為什麼不抵抗 —— 因為抵抗要打仗,而交州四十年沒有打過仗,那正是你要保住的東西。\n\n名義上你仍是交趾太守。實際上南方換了主人。\n\n有些東西只能靠交出去來保住。',
        en: 'You are Shi Xie. Bu Zhi has arrived with Sun Quan\'s seals of office — and with soldiers.\n\nYou and your brothers accepted his authority. People ask why you did not resist. Because resisting means fighting, and Jiao province has not fought in forty years, and that is precisely the thing you are trying to keep.\n\nIn name you are still Grand Administrator of Jiaozhi. In fact the south has a new master.\n\nSome things can only be kept by handing them over.',
      },
      'liu-zhang': {
        zh: '你是劉璋。劉備已經進來了,屯葭萌,厚樹恩德以收眾心。\n\n黃權諫過:「左將軍有驍名,今請到,欲以部曲遇之,則不滿其心;欲以賓客禮待,則一國不容二君。」你沒有聽。\n\n王累倒懸於城門進諫,你也沒有聽。\n\n現在他在北面替你擋張魯,而你每個月給他糧。這件事聽起來很合理,直到有一天不合理為止。',
        en: 'You are Liu Zhang. Liu Bei is already inside, camped at Jiameng, spreading kindness and collecting men\'s hearts.\n\nHuang Quan warned you: \'The General of the Left has a name for daring. Bring him in and treat him as a subordinate, and he will not be satisfied; treat him as an honoured guest, and one state cannot hold two lords.\' You did not listen.\n\nWang Lei hung himself upside down at the city gate to remonstrate. You did not listen to that either.\n\nNow he holds the north against Zhang Lu for you, and every month you send him grain. It sounds perfectly reasonable, right up until the day it does not.',
      },
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
      'zhang-lu': {
        zh: '你是張魯。劉備和劉璋翻臉了 —— 在你的南面,替你打你的敵人。\n\n馬超敗於冀城,單身走漢中,來投你。你以女妻之的話說到一半,楊柏勸阻:能養其妻子而不能養其人。\n\n你留下了他。一年之後他會走 —— 去投那個正在打劉璋的人。\n\n你這裡從來留不住能打的人。這也許就是你能活二十年的原因。',
        en: 'You are Zhang Lu. Liu Bei and Liu Zhang have fallen out — south of you, fighting your enemy for you.\n\nMa Chao, beaten at Jicheng, has come to you alone. You were halfway through offering him your daughter when Yang Bo stopped it: a man who cannot keep his own household is not one to marry into yours.\n\nYou kept him anyway. In a year he will leave — for the man who is currently fighting Liu Zhang.\n\nFighting men never stay here. That may be exactly why you have lasted twenty years.',
      },
      'shi-xie': {
        zh: '你是士燮。北方在爭益州,而交州照舊。\n\n你的兒子士徽在身邊長大。他沒有見過中原,也沒有見過戰爭 —— 他只見過你四十年怎麼把這個地方守成一座沒有人願意來的城。\n\n你守得住,是因為你從不讓任何一邊覺得非來不可。\n\n而你活著的每一年,都是你兒子將來不會懂的那一課。',
        en: 'You are Shi Xie. The north is fighting over Yi province, and Jiao province is as it was.\n\nYour son Shi Hui is growing up here. He has never seen the central plain and has never seen a war — all he has seen is forty years of you keeping this place somewhere nobody wants to come.\n\nYou have held it by never letting either side feel it must.\n\nAnd every year you go on living is a lesson your son will not have learned.',
      },
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
      xianbei: {
        zh: '你是鮮卑。檀石槐死後,漠南分為三部,而你是軻比能。\n\n你出身小種,不是王族 —— 靠勇健、斷法平端、不貪財物,被推為大人。部落三千餘落,控弦十餘萬。\n\n中原的鐵器與工匠從邊市流進來,你的人開始學漢人的兵器與旗鼓。\n\n幽州的刺史換了幾任,每一任都想過怎麼分化你。',
        en: 'You are the Xianbei. After Tanshihuai died the steppe south of the desert split into three, and you are Kebi Neng.\n\nYou came out of a minor clan, not the royal line — men made you chieftain because you were brave, judged evenly, and did not take for yourself. Three thousand tents and more; a hundred thousand bows.\n\nIron and craftsmen come up through the border markets, and your people are learning Han weapons, banners and drums.\n\nYouzhou has had several inspectors. Every one of them has thought about how to split you.',
      },
      nanman: {
        zh: '你是南蠻。南中四郡:越巂、益州、牂柯、永昌 —— 山高林密,漢人的兵走進來就出不去。\n\n你是孟獲,漢夷所服。這四個字的意思是:漢人的移民和本地的夷人都聽你的,而那在南中很少見。\n\n成都的號令到得了郡治,到不了寨子。\n\n他們叫這裡不毛之地。不毛之地養活了幾十萬人。',
        en: 'You are the Nanman. Four commanderies in the south — Yuexi, Yizhou, Zangke, Yongchang — high hills and thick forest, where a Han army that walks in does not walk out.\n\nYou are Meng Huo, and both Han and tribe follow you. That combination is rare down here.\n\nChengdu\'s orders reach the commandery seats. They do not reach the stockades.\n\nThey call this barren country. The barren country feeds several hundred thousand people.',
      },
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
      xianbei: {
        zh: '你是鮮卑。曹操在漢中和劉備打,而幽州的邊防因此薄了。\n\n你送馬、送牛,受了魏的封號 —— 附義王。名號是給的,馬是真的。\n\n你的人在學漢法:立旗鼓,習戰陣。有人說這是歸化,有人說這是準備。\n\n兩種說法都對。',
        en: 'You are the Xianbei. Cao Cao is fighting Liu Bei over Hanzhong, and the frontier garrisons in Youzhou are thinner for it.\n\nYou have sent horses and cattle and taken a Wei title — King Who Cleaves to Right. The title is a gift. The horses were real.\n\nYour men are learning Han methods: standards and drums, formations and drill. Some call that submission. Others call it preparation.\n\nBoth are correct.',
      },
      nanman: {
        zh: '你是南蠻。北面在爭漢中,益州的兵都調上去了。\n\n南中的守備從來就薄,現在更薄。雍闓在益州郡已經開始不聽話。\n\n你可以現在動,也可以等。等的好處是:他們會打得更累。\n\n等的壞處是:他們也會騰出手來。',
        en: 'You are the Nanman. They are fighting over Hanzhong in the north and Yi province has sent its soldiers up.\n\nThe garrisons in the south were always thin. They are thinner now. Yong Kai in Yizhou commandery has already stopped obeying.\n\nYou can move now or you can wait. Waiting means they get more tired.\n\nIt also means they get free.',
      },
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
      xianbei: {
        zh: '你是鮮卑。關羽在襄樊,曹操在議遷都,而北邊沒有人看著。\n\n你統一了漠南,部眾十餘萬騎。素利、彌加、步度根各有其部,而他們的人一年比一年少。\n\n田豫在幽州,王雄在後面。他們拿你沒有辦法,只能離間。\n\n最後殺死你的不是軍隊,是一個刺客。那是十六年後的事。',
        en: 'You are the Xianbei. Guan Yu is at Fancheng, Cao Cao\'s court is debating moving the capital, and nobody is watching the north.\n\nYou have united the steppe south of the desert: a hundred thousand horse and more. Suli, Mijia and Budugen each hold their own people, and each year there are fewer of them.\n\nTian Yu is in Youzhou and Wang Xiong behind him. They cannot beat you, so they divide you.\n\nWhat kills you in the end is not an army. It is one assassin, sixteen years from now.',
      },
      nanman: {
        zh: '你是南蠻。劉備進位漢中王,而南中沒有人去道賀。\n\n雍闓遣使通吳,孫權遙署他為永昌太守 —— 兩個大國隔著兩千里在爭一塊他們都沒去過的地方。\n\n你在中間。他們給的官職你都收下,他們的兵你一個也不放進來。\n\n這就是南中活了幾百年的辦法。',
        en: 'You are the Nanman. Liu Bei has taken the title King of Hanzhong, and nobody in the south went to congratulate him.\n\nYong Kai has opened a line to Wu, and Sun Quan has appointed him Grand Administrator of Yongchang from two thousand li away — two great states contending over ground neither has ever seen.\n\nYou are in the middle. You accept every office they offer and let in none of their soldiers.\n\nThat is how the south has stayed alive for several hundred years.',
      },
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
      xianbei: {
        zh: '你是鮮卑。漢沒有了。三個皇帝在南邊互相稱帝,而長城以北照舊。\n\n你遣使去魏,受了印綬;也和蜀漢通過信 —— 諸葛亮北伐時要你出兵。\n\n兩邊都要你。這是你這一生最有價值的一段時間。\n\n價值來自於他們互相打。一旦停下來,你就只是邊患。',
        en: 'You are the Xianbei. There is no Han any more. Three emperors call themselves emperor in the south, and north of the Wall nothing has changed.\n\nYou sent envoys to Wei and took their seals; you have also corresponded with Shu Han — Zhuge Liang wants your horse when he marches north.\n\nBoth sides want you. This is the most valuable stretch of your life.\n\nThe value comes from their fighting each other. The moment they stop, you are just a border nuisance.',
      },
      nanman: {
        zh: '你是南蠻。漢沒有了,而南中連消息都晚了三個月才到。\n\n三個皇帝,三套年號。你這裡用的還是各寨子自己的曆。\n\n雍闓愈來愈大膽,高定在越巂自稱王。北面亂,南中就亂 —— 這是幾百年的規律。\n\n亂對你有利,只要不亂到有人來平它。',
        en: 'You are the Nanman. There is no Han any more, and the news took three months to reach the south.\n\nThree emperors, three reign-titles. Down here people still keep their own stockade calendars.\n\nYong Kai grows bolder and Gao Ding has styled himself king in Yuexi. When the north is disordered the south is disordered — that has been the rule for centuries.\n\nDisorder suits you, so long as it does not become disorderly enough that someone comes to settle it.',
      },
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
      xianbei: {
        zh: '你是鮮卑。南邊三個皇帝,而你是三個皇帝都寫過信的人。\n\n你的部下開始用漢人的兵器,你的號令開始像中原的號令。這讓你更強,也讓魏更怕你。\n\n田豫已經在挑撥素利與你了。他知道打不過你,所以他要你們自己打。\n\n你這一生最大的敵人不是魏軍,是「分化」這兩個字。',
        en: 'You are the Xianbei. Three emperors in the south, and you are the man all three have written to.\n\nYour men now carry Han weapons and your orders begin to sound like orders from the central plain. That makes you stronger, and it makes Wei more afraid of you.\n\nTian Yu is already setting Suli against you. He knows he cannot beat you, so he wants you to beat each other.\n\nThe great enemy of your life is not the Wei army. It is the word \'divide\'.',
      },
      nanman: {
        zh: '你是南蠻。劉備稱帝了,而他馬上要東征。\n\n蜀漢的兵會全部去打吳。南中這幾年不會有人來。\n\n雍闓殺了太守正昂,把接任的張裔綁去送給孫權。他做得比你更急。\n\n急的人先被記住。三年後來的那個人,手上會有一份名單。',
        en: 'You are the Nanman. Liu Bei has taken the imperial title, and he is about to march east.\n\nEvery soldier Shu Han has will go to fight Wu. Nobody is coming south for a few years.\n\nYong Kai has killed the Grand Administrator Zheng Ang and shipped his replacement Zhang Yi to Sun Quan in ropes. He is in more of a hurry than you are.\n\nPeople in a hurry get remembered first. The man who comes in three years will arrive with a list.',
      },
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
      xianbei: {
        zh: '你是鮮卑。蜀漢在夷陵燒了連營,吳魏在江淮相持,而北邊三年沒有戰事。\n\n三年是很長的時間。長到足夠把三千落變成十萬騎,也長到足夠讓對面想清楚該派誰來。\n\n王雄接了幽州。他是個文人,對你很客氣。\n\n對你客氣的人,你要多看兩眼。',
        en: 'You are the Xianbei. Shu Han\'s camps burned at Yiling, Wu and Wei are locked along the Huai, and the north has had three years without a war.\n\nThree years is a long time. Long enough to turn three thousand tents into a hundred thousand horse — and long enough for the other side to work out whom to send.\n\nWang Xiong has taken Youzhou. He is a civil man and very courteous to you.\n\nPeople who are courteous to you deserve a second look.',
      },
      nanman: {
        zh: '你是南蠻。劉備在夷陵大敗,退到白帝城,病了。\n\n這是南中最好的機會,也是最後一個 —— 蜀漢若就此崩了,南中自然無主;蜀漢若緩過來,第一個要收拾的就是後院。\n\n雍闓已經反了。高定反了。朱褒反了。\n\n你還沒有。他們都在等你。',
        en: 'You are the Nanman. Liu Bei has been broken at Yiling, fallen back to Baidi, and taken ill.\n\nThis is the south\'s best opening and also its last — if Shu Han collapses now the south is nobody\'s; if Shu Han recovers, the first thing it tidies is its own back yard.\n\nYong Kai has revolted. Gao Ding has revolted. Zhu Bao has revolted.\n\nYou have not. They are all waiting on you.',
      },
      'liu-bei': {
        zh: '你連營七百餘里。曹丕聽說之後笑了:「備不曉兵,豈有七百里連營可以拒敵者乎!」\n\n夏天到了,天太熱,你把水軍移上岸,把營寨紮進林子裡。這是你一生最後一個決定。',
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
      xianbei: {
        zh: '你是鮮卑。諸葛亮出祁山,遣使約你出兵 —— 你答應了,騎兵到了石城。\n\n魏國兩線用兵,而你在第三條線上。\n\n這是你這一生離「成為天下棋手」最近的一次。\n\n王雄派的那個人叫韓龍。他還沒有出發。',
        en: 'You are the Xianbei. Zhuge Liang has come out through Qishan and sent to ask you to move — you agreed, and your horse reached Shicheng.\n\nWei is fighting on two fronts, and you are the third.\n\nThis is the closest you will ever come to being a player rather than a piece.\n\nThe man Wang Xiong will send is called Han Long. He has not set out yet.',
      },
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
      zh: '太和二年,鄱陽太守周魴詐降誘曹休,前後七箋,言辭懇切。休疑之,魴乃詣郡門下,截髮謝罪。\n\n休信之,率步騎十萬向皖。陸遜為大都督,朱桓、全琮為左右督,各三萬人。戰於石亭,休大敗,死傷萬餘,車乘器械略盡。休還,慚憤,疽發背而卒。\n\n朱桓曾請斷夾石、掛車之路以絕其歸,則休可生擒,「若蒙天威,得以休自效,便可乘勝長驅,進取壽春,割有淮南」。孫權以問陸遜,遜以為不可。',
      en: 'Zhou Fang, Administrator of Poyang, feigned defection to draw Cao Xiu in — seven letters, each more earnest than the last. When Cao Xiu grew suspicious, Zhou Fang went to the gate of his own headquarters and cut off his hair in penance.\n\nCao Xiu believed him and came to Wan with a hundred thousand foot and horse. Lu Xun took supreme command with Zhu Huan and Quan Cong on the wings, thirty thousand each. At Shiting Cao Xiu was broken: over ten thousand casualties, and his carts and equipment lost almost entire. He went home in shame and rage, an abscess opened on his back, and he died.\n\nZhu Huan had asked to cut the Jiashi and Guache roads and take Cao Xiu alive — "and then, riding the victory, we drive on to Shouchun and take Huainan for ourselves." Sun Quan put it to Lu Xun, who thought it could not be done.',
    },
    forces: {
      cao: {
        zh: '周魴斷髮詐降,曹休信了。你在洛陽收到捷報的草稿,和敗報,只差幾天。',
        en: 'Zhou Fang cut his hair and offered a false surrender, and Cao Xiu believed it. In Luoyang the draft of the victory dispatch and the news of the defeat are a few days apart.',
      },
      sun: {
        zh: '七封書信,一次斷髮。曹休十萬大軍進了石亭 —— 這是江東少有的主動出擊,而且贏了。',
        en: 'Seven letters and one shorn head. Cao Xiu has walked a hundred thousand men into Shiting. Jiangdong rarely strikes first, and this time it worked.',
      },
      'liu-bei': {
        zh: '東吳大勝,魏國東線吃緊。丞相要出祁山了 —— 這是最好的時機。',
        en: 'Wu has won big and Wei\'s eastern line is strained. The Prime Minister is going out through Qishan; the moment will not be better.',
      },
      xianbei: {
        zh: '軻比能在觀望。魏國東西兩線都在打,北邊的邊牆一年比一年薄。',
        en: 'Kebineng is watching. Wei is fighting on both eastern and western lines, and the northern wall thins every year.',
      },
    },
  },

  'scn-229-three-emperors': {
    intro: {
      zh: '黃龍元年,孫權即皇帝位於武昌。蜀漢遣衛尉陳震賀,與吳中分天下:豫、青、徐、幽屬吳,兗、冀、并、涼屬蜀,司州以函谷關為界。\n\n這是一份很認真地瓜分了一個他們誰也沒佔領的地方的盟書。三個天子並立,各有年號、各修史書、各自認為對方是賊。\n\n此後五十一年,再無人能獨力破局。',
      en: 'Sun Quan took the imperial title at Wuchang. Shu sent the Guard Commandant Chen Zhen with congratulations, and the two courts divided the realm between them: Yu, Qing, Xu and You to Wu; Yan, Ji, Bing and Liang to Shu; and Si province split at the Hangu Pass.\n\nIt is a treaty that very seriously partitions a great deal of land neither party holds. Three Sons of Heaven now reign at once, each with his own era name, each writing his own history, each certain the others are traitors.\n\nFor the fifty-one years that follow, no one of them can break the deadlock alone.',
    },
    forces: {
      xianbei: {
        zh: '你是鮮卑。三個皇帝都認得你的名字。\n\n諸葛亮要你的騎兵,魏要你的馬,吳離得太遠只能寫信。你什麼都答應,什麼都不全給。\n\n這不是狡猾。統一漠南的人只有一個籌碼:別人正在互相打。\n\n籌碼是有期限的。',
        en: 'You are the Xianbei. All three emperors know your name.\n\nZhuge Liang wants your horsemen, Wei wants your horses, Wu is too far away to do more than write. You agree to everything and deliver all of nothing.\n\nThat is not cunning. A man who has united the steppe has exactly one asset: that the others are busy with each other.\n\nAssets of that kind have an expiry date.',
      },
      nanman: {
        zh: '你是南蠻。四年前那個人來過了。\n\n他七次擒你,七次放你。最後一次你說:公,天威也,南人不復反矣。\n\n他沒有留兵,沒有運糧,用你們自己的人管你們自己的地。有人說那是恩,有人說那是他沒有兵可留。\n\n兩種說法都對。而南中確實沒有再反。',
        en: 'You are the Nanman. Four years ago that man came.\n\nHe took you seven times and let you go seven times. The last time you said: your authority is heaven\'s, and the men of the south will not revolt again.\n\nHe left no garrison and shipped no grain; he governs your ground with your own men. Some call that generosity. Others say he had no garrison to leave.\n\nBoth are correct. And the south has not revolted since.',
      },
      cao: {
        zh: '你是魏。曹叡即位三年,而三面都有人稱帝了。\n\n西邊諸葛亮出祁山已經兩次,司馬懿與張郃在關中往來奔命;東邊孫權剛剛在武昌即位,遣使來說要中分天下;北邊公孫淵在遼東,名義上是你的太守。\n\n十州之地,帶甲數十萬,而你的難處不是打不過誰 —— 是三條戰線同時要人。\n\n魏一朝四十六年沒有一統天下,也一次沒有動搖。這兩件事是同一件事。',
        en: 'You are Wei. Cao Rui is three years on the throne, and there are now emperors on three sides of you.\n\nIn the west Zhuge Liang has come out through Qishan twice; Sima Yi and Zhang He run back and forth across Guanzhong. In the east Sun Quan has just been enthroned at Wuchang and sends envoys proposing to halve the realm. In the north Gongsun Yuan sits in Liaodong, nominally your Grand Administrator.\n\nTen provinces, several hundred thousand under arms — and your difficulty is not that you cannot beat anyone. It is that three fronts want men at the same time.\n\nIn forty-six years Wei never united the realm and never once wobbled. Those are the same fact.',
      },
      'liu-bei': {
        zh: '你是蜀漢。先帝已崩六年,天子十九歲,而丞相在漢中。\n\n建興七年春,陳式取武都、陰平二郡 —— 這是歷次北伐裡唯一守得住的地。詔書因此復丞相之位。\n\n孫權稱帝的消息傳來,朝中有人主張顯明正義、絕其盟好。丞相說:「權有僭逆之心久矣,國家所以略其釁情者,求掎角之援也。」\n\n於是遣衛尉陳震去道賀,約中分天下。所分者,兩家皆未有之地。',
        en: 'You are Shu Han. Six years since the First Emperor died; the Son of Heaven is nineteen; the Chancellor is at Hanzhong.\n\nIn the spring of the seventh year Chen Shi took the two commanderies of Wudu and Yinping — the one territorial gain of all the northern campaigns that could be held. The edict restoring the Chancellor\'s rank followed.\n\nWhen word came that Sun Quan had taken the imperial title, there were men at court who wanted the principle declared and the alliance broken. The Chancellor said: \'Sun Quan has had usurping designs for a long time. The reason the state overlooks the offence is that we want a partner at the other horn.\'\n\nSo the Guard Commandant Chen Zhen went to congratulate him, and they agreed to halve the realm. What they divided, neither of them owned.',
      },
      sun: {
        zh: '你是吳。夏四月,你即皇帝位於武昌,大赦,改元黃龍。\n\n二十九年前你兄長把印綬交給你的時候說:「舉江東之眾,決機於兩陣之間,與天下爭衡,卿不如我;舉賢任能,各盡其心,以保江東,我不如卿。」\n\n他說對了。你沒有決過什麼機,但江東還在,而且今天有了皇帝。\n\n秋九月,遷都建業。建業在下游,武昌在上游 —— 你這一生都在想這兩座城之間該把重心放在哪裡。',
        en: 'You are Wu. In the fourth month you were enthroned as emperor at Wuchang, proclaimed an amnesty, and changed the reign-name to Huanglong.\n\nTwenty-nine years ago your brother handed you the seals and said: \'In taking the host of the Southland and deciding the moment between two battle-lines, contending with all under heaven — you are not my equal. In raising the worthy and employing the able so that each gives his whole heart, and so keeping the Southland — I am not yours.\'\n\nHe was right. You have decided very few moments between battle-lines. But the Southland is still here, and as of today it has an emperor.\n\nIn the ninth month the capital moves to Jianye. Jianye is downstream and Wuchang is upstream — you will spend your whole life deciding which of those two cities the weight should sit in.',
      },
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
    forces: {
      cao: {
        zh: '司馬懿接手西線。他不出戰,將士譏他畏蜀如虎 —— 而他知道,拖下去糧盡的是對方。',
        en: 'Sima Yi has taken the western command. He will not give battle and his officers mock him for fearing Shu like a tiger. He knows whose grain runs out first.',
      },
      'liu-bei': {
        zh: '木牛運糧,割麥於上邽。這一仗你打贏了,但李嚴的糧沒有到 —— 你又得退。',
        en: 'Wooden oxen bring the grain and you cut the wheat at Shanggui. You won the field — and Li Yan\'s supply never came, so you must withdraw again.',
      },
      sun: {
        zh: '蜀漢又出祁山。你只需要在東線做做樣子,魏國就得兩頭顧。',
        en: 'Shu is out through Qishan again. A gesture on the eastern line is enough to make Wei look two ways.',
      },
    },
  },

  'scn-238-liaodong': {
    intro: {
      zh: '景初二年,司馬懿討公孫淵。魏明帝問:「四千里征伐,雖云用奇,亦當任力,不當稍計役費。度往還幾時?」對曰:「往百日,攻百日,還百日,以六十日為休息,如此,一年足矣。」\n\n淵遣步騎數萬屯遼隧,圍塹二十餘里。懿曰:「賊堅營高壘,欲以老吾兵也。今我攻之,正入其計。賊大眾在此,則巢窟虛矣,我直指襄平,必內懼,懼而求戰,破之必矣。」\n\n會霖雨三十餘日,遼水暴漲,運船自遼口徑至城下。雨霽,起土山地道,楯櫓鉤橦,發矢石雨下。城破,男子年十五已上七千餘人皆殺之,以為京觀。',
      en: 'Sima Yi went against Gongsun Yuan. The emperor asked: "A campaign of four thousand li — surprise has its place, but so does hard strength, and the cost should not be counted too closely. How long, out and back?" He answered: "A hundred days out, a hundred to take it, a hundred back, and sixty for rest. A year is enough."\n\nGongsun Yuan put tens of thousands at Liaosui behind twenty li of ditch. Sima Yi said: "They are dug in behind high works to wear my army out. Attacking them there plays their game. Their whole force is here, so the nest is empty — I shall march straight on Xiangping, and they will be afraid for it. Fear will make them come out, and then they can be broken."\n\nThen came thirty days of rain, the Liao rose in flood, and the supply boats came upriver to the walls. When it cleared he raised earthworks and drove tunnels, brought up mantlets and rams, and rained arrows and stones. When the city fell, seven thousand males above the age of fifteen were killed and heaped into a monument of skulls.',
    },
    forces: {
      cao: {
        zh: '公孫淵自立為燕王。司馬懿說,往百日,攻百日,還百日 —— 一年足矣。',
        en: 'Gongsun Yuan has styled himself King of Yan. Sima Yi says: a hundred days out, a hundred days to take it, a hundred days back. A year will do.',
      },
      yan: {
        zh: '三代經營遼東,你是第一個敢稱王的。魏國遠在千里之外,而你忘了司馬懿走得很快。',
        en: 'Three generations built Liaodong and you are the first to take a king\'s title. Wei is a thousand li away — and you forgot how fast Sima Yi moves.',
      },
      'liu-bei': {
        zh: '魏國主力北上遼東。西線空虛,而丞相已經不在了。',
        en: 'Wei\'s main force has gone north to Liaodong. The western line is bare — and the Prime Minister is gone.',
      },
      sun: {
        zh: '公孫淵曾向你稱臣,又殺了你的使者。這筆帳你記著,但現在幫他還是看他死,是另一回事。',
        en: 'Gongsun Yuan swore fealty to you and then killed your envoys. You remember. Whether to help him or watch him die is a separate question.',
      },
    },
  },

  'scn-241-shaopi': {
    intro: {
      zh: '正始二年,吳四路伐魏:全琮攻芍陂,朱然圍樊,諸葛瑾攻柤中,諸葛恪向六安。\n\n這是吳國少有的一次全線並舉。魏遣司馬懿督軍南下,朱然圍樊城不克而退。\n\n此後司馬懿在淮南大興屯田,鄧艾陳《濟河論》,開廣漕渠,每東南有事,大軍興眾,泛舟而下,達於江淮,資食有儲而無水害。吳國的機會,一年比一年少。',
      en: 'Wu attacked Wei on four fronts at once: Quan Cong at Shaopi, Zhu Ran besieging Fan, Zhuge Jin at Zhazhong, Zhuge Ke towards Liu\'an.\n\nIt is one of the few times Wu moved on the whole line together. Wei sent Sima Yi south in command, and Zhu Ran gave up the siege of Fan.\n\nAfterwards Sima Yi settled great military colonies across Huainan; Deng Ai submitted his treatise on the rivers and cut the broad canal, so that whenever the southeast stirred, a great army could be raised and float straight down to the Yangzi and Huai with supplies laid in and no flood damage. Wu\'s openings grow fewer every year.',
    },
    forces: {
      cao: {
        zh: '明帝新喪,幼主在位。四路吳軍同時北上,而輔政的曹爽從沒打過仗。',
        en: 'The Bright Emperor is newly dead and a child sits the throne. Four Wu columns are coming north at once, and Cao Shuang, who governs for him, has never fought a battle.',
      },
      sun: {
        zh: '曹叡死了,魏國換了幼主。全琮、諸葛恪、朱然分道並進 —— 這是你最後一次大舉北伐。',
        en: 'Cao Rui is dead and Wei has a child emperor. Quan Cong, Zhuge Ke and Zhu Ran advance on separate roads. This is your last great northern effort.',
      },
      'liu-bei': {
        zh: '蔣琬持重,不輕出兵。吳國在東邊打得熱鬧,而漢中的糧只夠守。',
        en: 'Jiang Wan is cautious and will not spend troops lightly. Wu makes a great noise in the east, and Hanzhong\'s grain is enough only to hold.',
      },
    },
  },

  'scn-244-xingshi': {
    intro: {
      zh: '正始五年,大將軍曹爽伐蜀,以夏侯玄為征西將軍,發卒十餘萬,入駱谷。\n\n漢中守兵不滿三萬,諸將大驚,或曰:「今力不足以拒敵,聽當固守漢、樂二城,遇賊令入,比爾間,涪軍足得至關。」王平曰:「不然。漢中去涪垂千里,賊若得關,便為禍也。今宜先遣劉護軍、杜參軍據興勢,平為後拒。若賊分向黃金,平率千人下自臨之,比爾間,涪軍行至,此計之上也。」\n\n關中及氐、羌轉輸不能供,牛馬騾驢多死,民夷號泣道路。爽等引退,平所斷截,爽爭嶮乃得過,失亡甚眾。',
      en: 'The General-in-Chief Cao Shuang invaded Shu with Xiahou Xuan as General Who Conquers the West, raising over a hundred thousand men into the Luo valley.\n\nHanzhong had fewer than thirty thousand defenders, and the officers were alarmed. Some said: "We have not the strength to resist. Hold the two forts of Han and Le, let them in, and by the time that is done the army from Fu will have reached the passes." Wang Ping said: "No. Hanzhong is near a thousand li from Fu, and if they take the passes it is a disaster. Send Protector Liu and Adjutant Du to hold Xingshi at once, and I shall stand behind them. If they turn towards Huangjin I shall go down against them with a thousand men, and by then the Fu army will have arrived. That is the better plan."\n\nGuanzhong and the Di and Qiang could not keep up the transport; oxen, horses, mules and donkeys died in numbers, and Han and tribesman alike wept along the roads. When Cao Shuang withdrew, Wang Ping had cut the road behind him; he fought his way through the defiles and lost a great many men.',
    },
    forces: {
      cao: {
        zh: '曹爽要立威,強行伐蜀。關中的牛馬死了大半,而興勢的險道還沒走完。',
        en: 'Cao Shuang wants a reputation and has forced a campaign against Shu. Most of Guanzhong\'s draught animals are dead already and the Xingshi road is not even finished.',
      },
      'liu-bei': {
        zh: '王平守興勢,兵不滿三萬。他說:漢中之守,在險不在眾。',
        en: 'Wang Ping holds Xingshi with fewer than thirty thousand. He says: Hanzhong is held by the ground, not by numbers.',
      },
      sun: {
        zh: '魏國西征,東線就鬆。這種便宜不占白不占。',
        en: 'Wei has gone west and the eastern line is loose. It would be a waste not to take the opening.',
      },
    },
  },

  'scn-249-gaopingling': {
    intro: {
      zh: '正始十年正月甲午,天子謁高平陵,曹爽兄弟皆從。司馬懿勒兵出,閉城門,據武庫,屯洛水浮橋,奏爽罪惡。\n\n桓範出城奔爽,勸挾天子幸許昌,發四方兵以自輔。爽兄弟猶豫未決。範謂羲曰:「事昭然,卿用讀書何為邪!於今日卿等門戶倒矣!」\n\n爽夜不能決,乃投刀於地曰:「我不失作富家翁。」範哭曰:「曹子丹佳人,生汝兄弟,犢耳!何圖今日坐汝等族滅矣!」\n\n數日,以謀反下獄,夷三族。',
      en: 'On the jiawu day the emperor visited the Gaoping Tombs and the Cao Shuang brothers all went with him. Sima Yi brought out troops, shut the gates, seized the armoury, occupied the floating bridge over the Luo, and memorialised against Cao Shuang\'s crimes.\n\nHuan Fan got out of the city to Cao Shuang and urged him to take the emperor to Xuchang and call up the provincial armies. The brothers hesitated. Huan Fan said to Cao Xi: "The thing is plain as day. What have you read books for? Today your house falls."\n\nCao Shuang could not decide all night. At last he threw his sword down: "I can still be a rich gentleman." Huan Fan wept: "Cao Zhen was a fine man, and he fathered you — calves! Who could have imagined I would be exterminated along with you."\n\nWithin days they were charged with treason and their clans destroyed to the third degree.',
    },
    forces: {
      'liu-bei': {
        zh: '你是蜀漢。魏國在洛陽自己撕自己 —— 司馬懿閉城奪權,曹爽三日而族滅。\n\n這是三十年來北方最亂的一天,而你手上有姜維。\n\n費禕不肯給他多兵:每欲興軍大舉,維輒裁制不從,與其兵不過萬人。「吾等不如丞相亦已遠矣;丞相猶不能定中夏,況吾等乎?」\n\n這句話很有道理。有道理的話通常也就是不會做那件事的理由。',
        en: 'You are Shu Han. Wei is tearing at itself in Luoyang — Sima Yi shut the gates and took the government, and three days later Cao Shuang\'s family was extinguished.\n\nIt is the most disordered day the north has had in thirty years, and you have Jiang Wei.\n\nFei Yi will not give him troops. Every time he proposes a great expedition Fei Yi cuts it down, and never lets him have more than ten thousand men. \'We fall a long way short of the Chancellor; if even he could not settle the central plain, what of us?\'\n\nIt is a very sound argument. Sound arguments are usually also the reason a thing does not get done.',
      },
      sun: {
        zh: '你是吳。你今年六十八,在位二十七年。\n\n太子和與魯王霸相爭,朝中分為兩黨,而你既不廢也不立,看著他們鬥。陸遜上疏切諫,你遣使責問,他憤恚而卒 —— 那是四年前的事。\n\n現在魏國在洛陽內鬥。你手上還有多少能用兵的人?\n\n二宮之爭折掉的棟梁,比赤壁以來任何一場仗都多。',
        en: 'You are Wu. You are sixty-eight, in the twenty-seventh year of your reign.\n\nThe Crown Prince He and the Prince of Lu, Ba, are at each other\'s throats and the court has split into two parties. You neither depose one nor confirm the other; you watch them fight. Lu Xun sent up a memorial of sharp remonstrance, you sent officers to reprimand him, and he died of grief and indignation — four years ago now.\n\nNow Wei is fighting itself in Luoyang. How many men do you still have who can handle an army?\n\nThe struggle between the two palaces has broken more load-bearing timber than any battle since Red Cliffs.',
      },
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
    forces: {
      cao: {
        zh: '司馬師初掌大權,需要一場勝仗。三路伐吳,東興堤下是最險的一路。',
        en: 'Sima Shi has just taken power and needs a victory. Three columns against Wu, and the one under the Dongxing dyke is the most exposed.',
      },
      sun: {
        zh: '諸葛恪築東興堤,魏人來拆。丁奉說:今日之事,取封侯之賞,正在今日 —— 雪中脫甲,短兵而上。',
        en: 'Zhuge Ke built the Dongxing dyke and Wei has come to break it. Ding Feng said the rank of marquis is won today — and stripped his armour in the snow to go in with short blades.',
      },
      'liu-bei': {
        zh: '姜維在西線試探。東興若勝,魏國兩線俱疲。',
        en: 'Jiang Wei probes in the west. If Dongxing holds, Wei is tired on both lines.',
      },
    },
  },

  'scn-253-hefei': {
    intro: {
      zh: '建興二年,諸葛恪乘東興之勝,大發州郡二十萬眾伐魏。眾皆以為不可,恪作論以諭眾。\n\n圍合肥新城,連月不拔。士卒疲勞,因暑飲水,泄下流腫,病者大半,死傷塗地。諸營吏日白病者多,恪以為詐,欲斬之,自是莫敢言。\n\n八月引軍還,士卒傷病流曳道路,或頓仆坑壑,或見略獲,存亡忿痛,大小呼嗟。而恪晏然自若,出住江渚一月。\n\n十月,孫峻與吳主謀,置酒請恪,伏兵殺之。',
      en: 'Riding the Dongxing victory, Zhuge Ke raised two hundred thousand men from the provinces against Wei. Everyone said it could not be done; he wrote an essay to explain it to them.\n\nHe besieged Hefei New City for months without taking it. The men wore out, drank bad water in the heat, and came down with dysentery and swellings until more than half were sick and the dead lay everywhere. His camp officers reported the numbers daily; he took it for malingering and threatened to behead them, and after that nobody spoke.\n\nIn the eighth month he withdrew, the sick and wounded dragging along the roads, some collapsing into ditches, some taken by the enemy, the living and the dying alike crying out. Zhuge Ke was perfectly composed, and stopped a month on an island in the river.\n\nIn the tenth month Sun Jun and the ruler of Wu invited him to a banquet and killed him with hidden soldiers.',
    },
    forces: {
      cao: {
        zh: '合肥新城只有三千人,而諸葛恪帶了二十萬。張特說:魏法,被攻百日而救不至者,降不罪家人 —— 他還差九十天。',
        en: 'Xincheng at Hefei holds three thousand men and Zhuge Ke has brought two hundred thousand. Zhang Te cites the law: a garrison unrelieved for a hundred days may surrender without harm to its family. He has ninety days to go.',
      },
      sun: {
        zh: '東興大勝之後,你聲望到了頂點,於是舉二十萬北伐。城下暑疫大起,而你不肯退。',
        en: 'After Dongxing your standing was at its height, so you took two hundred thousand north. Plague broke out under the walls in the heat, and you will not withdraw.',
      },
      'liu-bei': {
        zh: '姜維出隴西策應。吳國若能拖住魏國主力,這一次也許能有進展。',
        en: 'Jiang Wei goes out through Longxi in concert. If Wu can pin Wei\'s main force, this time there might be progress.',
      },
    },
  },

  'scn-255-huainan2': {
    intro: {
      zh: '正元二年正月,鎮東將軍毌丘儉、揚州刺史文欽矯太后詔起兵壽春,移檄州郡,數司馬師罪狀十一條。\n\n司馬師新割目瘤,創甚,或勸使不行,曰:「我請舉軍,君可鎮許昌。」師曰:「不可。淮南之事,豈可以文書解決乎?」乃輿疾而東。\n\n儉、欽軍在項,不進不退。師遣諸葛誕自安風向壽春,胡遵出譙、宋之間,絕其歸路。將士家皆在北,眾心沮散,降者相屬。\n\n師以文鴦夜襲,驚而目瘤迸出,痛甚,齧被皆破,而左右莫知。閏月,師卒於許昌,年四十八。',
      en: 'Guanqiu Jian, General Who Guards the East, and Wen Qin, Inspector of Yang province, raised troops at Shouchun under a forged edict of the Empress Dowager, and circulated a proclamation to the provinces listing eleven crimes of Sima Shi.\n\nSima Shi had just had a tumour cut from his eye and the wound was severe. Someone urged him to stay behind: "Let me lead the army; you hold Xuchang." He said: "No. Is the Huainan business a thing to be settled by correspondence?" And he went east in a litter.\n\nThe rebel army sat at Xiang, neither advancing nor retiring. Sima Shi sent Zhuge Dan from Anfeng towards Shouchun and Hu Zun out between Qiao and Song to cut the road home. The soldiers\' families were all in the north; morale dissolved and desertions ran in streams.\n\nWen Yang raided the camp by night; the shock burst the wound and forced the eye out, and the pain was such that Sima Shi bit through his bedding — and none of his staff knew. In the intercalary month he died at Xuchang, aged forty-eight.',
    },
    forces: {
      cao: {
        zh: '司馬師目上新割了瘤,還是親征。毌丘儉是明帝舊臣,反的旗號是清君側 —— 這種旗號最難處置。',
        en: 'Sima Shi has a fresh incision over his eye and rides out anyway. Guanqiu Jian was the Bright Emperor\'s man and marches under the banner of cleansing the court — the hardest banner to answer.',
      },
      guanqiu: {
        zh: '你受明帝厚恩,不能看著曹家的天下被人拿走。淮南的兵是好兵,但家眷都在北邊。',
        en: 'The Bright Emperor raised you and you will not watch the Cao realm taken. Huainan\'s troops are good troops — and their families are all in the north.',
      },
      sun: {
        zh: '淮南又反了。這是江東北上最好的口子,問題是這口子開得太頻繁,已經不太可信。',
        en: 'Huainan has revolted again. It is the best opening Jiangdong ever gets north — and it opens so often now that it is hard to trust.',
      },
      'liu-bei': {
        zh: '魏國內亂,姜維又要出兵。朝中已經有人在問,這樣打下去圖什麼。',
        en: 'Wei is in disorder and Jiang Wei wants to march again. People at court have begun asking what all this is for.',
      },
    },
  },

  'scn-257-huainan3': {
    intro: {
      zh: '甘露二年,征東大將軍諸葛誕殺揚州刺史樂綝,據壽春反,遣使稱臣於吳。吳遣文欽、唐咨、全懌等三萬人助之。\n\n司馬昭督二十六萬眾臨淮,使王基、陳騫圍之,築壘再重,深溝高壘,不與交鋒。\n\n城中食少,外救不至,誕與欽計議不協,誕殺欽。欽子鴦、虎逾城降,昭赦之,使繞城呼曰:「文欽之子猶不見殺,其餘何懼?」城內喜且擾,又日饑困,誕、咨等智力窮。\n\n二月,城潰。誕突小城門出,大將軍司馬胡奮部兵擊斬之,夷三族。麾下數百人坐不降見斬,皆曰:「為諸葛公死,不恨。」',
      en: 'Zhuge Dan, Grand General Who Conquers the East, killed the Inspector of Yang province, held Shouchun against the court, and sent to Wu offering his submission. Wu sent Wen Qin, Tang Zi and Quan Yi with thirty thousand men to help him.\n\nSima Zhao brought two hundred and sixty thousand to the Huai and had Wang Ji and Chen Qian ring the city with a double rampart, deep ditches and high works, and refuse all battle.\n\nFood ran short inside and no relief came. Zhuge Dan and Wen Qin fell out, and Zhuge Dan killed him. Wen Qin\'s sons Yang and Hu climbed the wall and surrendered; Sima Zhao pardoned them and sent them riding round the walls calling: "Even Wen Qin\'s own sons are not put to death. What have the rest of you to fear?"\n\nIn the second month the city broke. Zhuge Dan burst out of a postern and was cut down. Several hundred of his men were beheaded for refusing to surrender, every one of them saying: "To die for Lord Zhuge — no regret."',
    },
    forces: {
      cao: {
        zh: '諸葛誕反了,還向吳國求援。司馬昭帶著天子和太后一起親征 —— 這一仗不能輸。',
        en: 'Zhuge Dan has revolted and asked Wu for help. Sima Zhao has brought the Son of Heaven and the dowager on campaign with him. This one cannot be lost.',
      },
      huainan: {
        zh: '你看著王淩死、毌丘儉死,知道下一個是自己。壽春城高糧足,而吳國的援軍已經進城。',
        en: 'You watched Wang Ling die and Guanqiu Jian die and you know you are next. Shouchun is high-walled and well stocked, and Wu\'s relief is already inside.',
      },
      sun: {
        zh: '諸葛誕求援,你派了三萬人進壽春。人進去容易 —— 出來要看司馬昭的臉色。',
        en: 'Zhuge Dan asked and you sent thirty thousand into Shouchun. Getting them in was easy; getting them out is up to Sima Zhao.',
      },
      'liu-bei': {
        zh: '姜維聞淮南之亂,又出駱谷。這是他第幾次北伐,朝中已經沒人數了。',
        en: 'Jiang Wei heard of Huainan and went out through Luo valley again. Nobody at court is counting the campaigns any more.',
      },
    },
  },

  'scn-263-shu-fall': {
    intro: {
      zh: '景元四年,司馬昭議伐蜀,朝臣多以為不可,獨鍾會贊成。乃使鄧艾、諸葛緒各統三萬餘人,鍾會統十餘萬眾,分從斜谷、駱谷、子午谷伐蜀。\n\n姜維退保劍閣,列營守險,會攻之不能克。糧道險遠,議欲還歸。\n\n鄧艾自陰平道行無人之地七百餘里,鑿山通道,造作橋閣。山高谷深,至為艱險,又糧運將匱,頻於危殆。艾以氈自裹,推轉而下。將士皆攀木緣崖,魚貫而進。\n\n先登至江由,蜀守將馬邈降。斬諸葛瞻於綿竹。十一月,後主輿櫬自縛,詣軍壘門。',
      en: 'Sima Zhao proposed the conquest of Shu; most of the court thought it impossible, and only Zhong Hui supported him. Deng Ai and Zhuge Xu were given thirty thousand each and Zhong Hui over a hundred thousand, to enter Shu by the Xie, Luo and Ziwu valleys.\n\nJiang Wei fell back on Jiange and held the defiles in a line of camps, and Zhong Hui could not force them. With his supply line long and dangerous, he began to discuss going home.\n\nDeng Ai took the Yinping road seven hundred li through empty country, cutting a path through the mountains and building trestle bridges. The peaks were high and the gorges deep and the way desperately hard, and his supplies were failing; more than once it was nearly the end of him. He wrapped himself in felt and rolled down the slope. The men went hand over hand along the trees and cliffs, in single file.\n\nThe vanguard reached Jiangyou and its commander surrendered. Zhuge Zhan was killed at Mianzhu. In the eleventh month the Later Sovereign came to the gate of the camp with his coffin and his hands bound.',
    },
    forces: {
      sun: {
        zh: '你是吳。魏三路伐蜀的消息傳來,朝議遣兵救之。\n\n丁奉出壽春,留平出南郡,丁封孫異向沔中 —— 三路並發,像是要救。\n\n但兵還在路上,成都已降。諸軍聞之,皆罷。\n\n救蜀這件事,你們做了,只是做得剛好來不及。而唇亡齒寒四個字,從此不再是比喻。',
        en: 'You are Wu. Word has come that Wei is invading Shu on three roads, and the court has resolved to send relief.\n\nDing Feng out of Shouchun, Liu Ping out of Nan commandery, Ding Feng and Sun Yi toward Mianzhong — three columns moving at once, which looks a great deal like a rescue.\n\nBut the troops were still on the road when Chengdu surrendered. Hearing it, every column turned back.\n\nYou did in fact try to save Shu. You simply did it slowly enough to be too late. And \'the teeth go cold when the lips are gone\' stops being a figure of speech today.',
      },
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
      sun: {
        zh: '你是吳。蜀亡了,而滅蜀的人在成都自己反了。\n\n鍾會據蜀自王,鄧艾被檻車徵下 —— 魏國在你的上游打成一團。\n\n這是最後一次機會:巴蜀若能入手,長江上下俱在,還可以劃江而治。\n\n你派了盛曼西上。而益州的路,從來不是靠一支偏師走得完的。',
        en: 'You are Wu. Shu has fallen, and the man who took it has rebelled in Chengdu.\n\nZhong Hui has made himself a king in Shu and Deng Ai has been carted off in a prison wagon — Wei is fighting itself on your upper river.\n\nThis is the last opening: with Ba and Shu in hand the whole Yangtze is yours, and the realm can still be halved at the river.\n\nYou have sent Sheng Man west. The road into Yi province has never yet been walked by a single detached column.',
      },
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
    forces: {
      sima: {
        zh: '祖父誅曹爽,伯父廢一帝,父親殺一帝。到你這裡,只剩最後一步,而且是最體面的一步。',
        en: 'Your grandfather cut down Cao Shuang, your uncle deposed one emperor, your father killed another. Only the last step is left for you — and it is the seemly one.',
      },
      sun: {
        zh: '孫皓即位之初也曾被稱明主。現在建業的宮裡,沒有人敢抬頭說話。',
        en: 'Sun Hao was called a wise lord when he took the throne. Now in the palace at Jianye nobody dares raise their head to speak.',
      },
    },
  },

  'scn-272-xiling': {
    intro: {
      zh: '鳳凰元年,西陵督步闡據城降晉。陸抗聞之,日夜赴赴,敕軍營更築嚴圍,自赤谿至故市,內以圍闡,外以禦寇,晝夜催切,如敵已至,眾甚苦之。\n\n諸將咸諫曰:「今及三軍之銳,亟以攻闡,比晉救至,必可拔也,何事於圍,以敝士民之力乎?」抗曰:「此城處勢既固,糧穀又足,且所繕修備禦之具,皆抗所宿規。今反身攻之,既非可卒克,且北救必至,至而無備,表裏受難,何以禦之?」\n\n晉遣羊祜率步軍出江陵,徐胤督水軍詣建平,楊肇至西陵。抗令張咸固守江陵,公安督孫遵巡南岸禦祜,水軍督留慮拒胤,身自率眾憑圍對肇。\n\n肇計屈夜遁,闡城破,誅之。',
      en: 'Bu Chan, commandant of Xiling, handed the city to Jin. Lu Kang went day and night, and ordered a full ring of works built from Chixi to Gushi — inward to contain Bu Chan, outward to meet the relief — driving the work round the clock as if the enemy were already there, and his men suffered greatly for it.\n\nHis officers all objected: "Take Bu Chan now, while the army is keen; we can have the place before Jin arrives. Why build works and wear out the men?" Lu Kang answered: "That city is strongly sited and well provisioned, and every defence in it was laid out by me. Turning on it now will not carry it quickly, and the northern relief will certainly come — and if it comes and we are unprepared, we are pressed inside and out. What would we meet it with?"\n\nJin sent Yang Hu with the foot to Jiangling, Xu Yin with the fleet to Jianping, and Yang Zhao to Xiling. Lu Kang had Zhang Xian hold Jiangling fast, Sun Zun patrol the south bank against Yang Hu, Liu Lü hold off the fleet, and took the field against Yang Zhao himself from behind his works.\n\nYang Zhao, out of ideas, slipped away by night. Xiling fell and Bu Chan was executed.',
    },
    forces: {
      sima: {
        zh: '你是晉。步闡以西陵降,而西陵是吳的上游門戶。\n\n羊祜出江陵,徐胤趨建平,楊肇赴西陵 —— 八萬人接應一座送上門的城。\n\n對面是陸抗。他先築圍以斷內外,不救步闡而先修圍牆 —— 諸將皆諫,他不聽。\n\n「西陵、建平,國之藩表;若非其人,萬里長江,難以恃也。」這句話是他寫給孫皓的。孫皓沒有讀懂,而你要面對的正是寫這句話的人。',
        en: 'You are Jin. Bu Chan has surrendered Xiling, and Xiling is the gate to Wu\'s upper river.\n\nYang Hu moves on Jiangling, Xu Yin on Jianping, Yang Zhao on Xiling itself — eighty thousand men to collect a city that has walked over on its own.\n\nOpposite you is Lu Kang. His first act is to throw up a wall of circumvallation, cutting Bu Chan off from outside relief instead of relieving him. His officers all remonstrated. He did not listen.\n\n\'Xiling and Jianping are the outer fence of the state; without the right man there, ten thousand li of Yangtze cannot be relied on.\' He wrote that to Sun Hao. Sun Hao did not understand it. You have to fight the man who wrote it.',
      },
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
    forces: {
      sima: {
        zh: '王濬樓船下益州,金陵王氣黯然收。二十年的準備,只差把船放下水。',
        en: 'Wang Jun\'s towered ships come down from Yi, and the king-spirit of Jinling dims and gathers in. Twenty years of preparation; all that is left is to put the boats in the water.',
      },
      sun: {
        zh: '鐵鎖橫江,鐵錐沉水。你以為長江還能守 —— 而王濬的木筏推走了錐,火炬燒斷了鎖。',
        en: 'Iron chains across the river and iron spikes beneath it. You thought the Yangzi would still hold — and Wang Jun\'s rafts pushed the spikes aside and his torches burned through the chains.',
      },
    },
  },

  // ── 假想 · 岔路口 ─────────────────────────────────────────────────
  // Each of these boards turns on one moment that went the other way.
  'scn-gathering-of-heroes': {
    intro: {
      zh: '沒有這一年。\n\n董卓還在,呂布還在,孫堅的兒子已經長大而孫堅未死,袁紹與袁術都還沒有輸,劉備已經有了地盤,曹操已經有了天子,公孫瓚的白馬義從還在,馬騰韓遂還在關中,劉焉還在益州。\n\n史書把他們錯開了二十年,好讓每個人依次退場。這一局把他們全部放在同一張棋盤上。',
      en: 'This year never happened.\n\nDong Zhuo is still here. So is Lü Bu. Sun Jian\'s sons are grown and Sun Jian is not dead. Neither Yuan has lost yet. Liu Bei already holds land and Cao Cao already holds the emperor. The White Horse Volunteers still ride, Ma Teng and Han Sui still hold Guanzhong, Liu Yan still holds Shu.\n\nHistory spread them across twenty years so that each could leave the stage in turn. This board puts every one of them on it at once.',
    },
    forces: {
      cao: {
        zh: '兗州初定,青州兵在手。你比誰都清楚自己起步晚 —— 也比誰都清楚該去許都接誰。',
        en: 'Yan province is settled and the Qing troops are yours. Nobody knows better than you how late you started — or who is waiting at Xu to be collected.',
      },
      'liu-bei': {
        zh: '六座城,兩個兄弟,和一個誰都認的皇叔名分。你這一生最不缺的就是重新開始。',
        en: 'Six cities, two brothers, and a title of imperial uncle that everyone acknowledges. Starting over is the one thing you have never lacked.',
      },
      sun: {
        zh: '江東是你打下來的,不是繼承的。二十出頭,天下英雄還沒把你算進去。',
        en: 'Jiangdong you took; you did not inherit it. Barely past twenty, and the heroes of the realm have not yet counted you in.',
      },
      'yuan-shao': {
        zh: '四世三公,天下歸心。你什麼都有 —— 除了決斷。',
        en: 'Four generations of ministers and the realm inclines to you. You have everything except decision.',
      },
      'yuan-shu': {
        zh: '一座城,一方玉璽。你相信天命,而天命最不喜歡的就是這種相信。',
        en: 'One city and one imperial seal. You believe in the mandate — and the mandate has no patience with that kind of belief.',
      },
      dong: {
        zh: '西涼兵在手,天子在手。你知道所有人都恨你,而你賭他們互相更恨。',
        en: 'The Liang troops are yours and so is the Son of Heaven. You know they all hate you, and you are betting they hate each other more.',
      },
      lubu: {
        zh: '兩座城,一匹馬,一支戟。天下第一,沒有人肯收留。',
        en: 'Two cities, one horse, one halberd. First under heaven, and nobody will take you in.',
      },
      'liu-biao': {
        zh: '荊襄十六城,帶甲之士不少。你想守成,而守成在這個年代不是一個選項。',
        en: 'Sixteen cities of Jing and Xiang and no shortage of men under arms. You want to keep what you have — and in this age that is not on the menu.',
      },
      'liu-yan': {
        zh: '米賊斷道,益州自守。這條路是你自己斷的,好處與壞處都由你獨得。',
        en: 'The rice bandits have cut the road and Yi keeps to itself. You cut it yourself; the benefit and the cost are both entirely yours.',
      },
      'zhang-lu': {
        zh: '漢中政教合一,民不苦役。亂世裡,你這五座城是少見的安穩地方。',
        en: 'Church and state are one in Hanzhong and the people are not worked to death. In a broken age your five cities are a rare quiet place.',
      },
      gongsun: {
        zh: '白馬義從天下聞名,而你的鄰居是袁紹。名聲不能當糧食。',
        en: 'The White Horse riders are famous throughout the realm, and your neighbour is Yuan Shao. Fame is not grain.',
      },
      'gongsun-du': {
        zh: '遼東遠在天邊,你自稱遼東侯、平州牧,中原沒人來管。安靜地做一個王,也是一種活法。',
        en: 'Liaodong is at the edge of the world. You style yourself Marquis of Liaodong and governor of Ping, and nobody from the central plain comes to argue. Being a quiet king is also a way to live.',
      },
      'ma-teng': {
        zh: '西涼的馬,關中的地,朝廷的名分。三樣你都有一點,哪一樣都不夠。',
        en: 'Liang\'s horses, Guanzhong\'s land, the court\'s commission. You have a little of each and enough of none.',
      },
      'han-sui': {
        zh: '你在西涼比馬騰久。這片地上的規矩是:活得久的人說了算。',
        en: 'You have been in Liang longer than Ma Teng. The rule out here is that whoever lasts longest decides.',
      },
      'kong-rong': {
        zh: '孔子二十世孫,座上客常滿。兩座城,和一屋子清談。',
        en: 'Twentieth-generation descendant of Confucius, and the seats at your table are always full. Two cities, and a house full of talk.',
      },
      tao: {
        zh: '徐州殷實,你已經老病。曹操的父親死在你的地界上 —— 這筆帳算不清了。',
        en: 'Xu is prosperous and you are old and ill. Cao Cao\'s father died on your ground, and that account will never be settled.',
      },
      'shi-xie': {
        zh: '交趾七郡,四十年無兵災。中原人不知道有你,這正合你意。',
        en: 'Seven commanderies of Jiaozhi and forty years without war. The central plain does not know you exist, which suits you exactly.',
      },
    },
  },

  'scn-whatif-guanyu-jing': {
    intro: {
      zh: '岔路在江陵的城門。\n\n史書上,呂蒙白衣渡江,糜芳、傅士仁不戰而降,關羽腹背受敵,走麥城,父子俱歿。荊州一失,隆中對的兩路北伐就永遠只剩一路。\n\n這一局,那扇門沒有開。關羽守住了荊州,蜀漢同時據有荊益 —— 諸葛亮在隆中畫的那張圖,完整地擺在你面前。',
      en: 'The fork is at the gate of Jiangling.\n\nIn the histories Lü Meng crossed in white, Mi Fang and Fu Shiren surrendered without a fight, Guan Yu was caught front and rear, fled to Maicheng, and died there with his son. With Jing gone, the two-road northern campaign of the Longzhong plan was permanently reduced to one road.\n\nOn this board that gate stayed shut. Guan Yu held Jing province, and Shu holds Jing and Yi together — the map Zhuge Liang drew in that thatched hut, intact and in front of you.',
    },
    forces: {
      cao: {
        zh: '荊州沒有丟。你父親留下的北方完好無缺,但南邊那道口子沒堵上 —— 關羽仍在江陵,漢水一漲他就能北望許都。你比曹操年輕,也比他少一分僥倖。',
        en: 'Jing did not fall. The north your father left you is whole, but the gap in the south never closed: Guan Yu still holds Jiangling, and one high water on the Han puts him within sight of Xu. You are younger than Cao Cao was — and you have had less luck.',
      },
      'liu-bei': {
        zh: '荊州守住了,隆中對還活著。兩路北伐不再是紙上談兵 —— 但你已經六十開外,關羽也不年輕,而曹丕的中原比你當年見過的更完整。',
        en: 'Jing held, so the Longzhong plan is still alive: the two-pronged northern march is no longer a thing on paper. But you are past sixty, Guan Yu is not young either, and Cao Pi\'s central plain is more whole than anything you ever faced.',
      },
      sun: {
        zh: '你沒能拿回荊州。江東只剩下江東,而上游握在盟友手裡 —— 盟友是好聽的說法,實情是你的咽喉不在自己手上。',
        en: 'You never got Jing back. Jiangdong is only Jiangdong now, and the upper river is in an ally\'s hand — which is the polite way of saying your throat is not your own.',
      },
      'shi-xie': {
        zh: '交州偏遠,亂世反倒是福分。你已經八十歲了,想的是把這片安土完整交出去 —— 交給誰,是你最後一個決定。',
        en: 'Jiao is remote, and in a broken age that is a blessing. You are eighty. What you want is to hand this quiet corner on intact — and to whom is the last decision you will make.',
      },
      nanman: {
        zh: '漢人的荊州之爭與你無關,但他們打得越久,南中就越自在。趁著北面無暇南顧,把寨子連成一片。',
        en: 'The Han quarrel over Jing is none of yours, and the longer they fight the freer Nanzhong is. While no one up north can spare a glance southward, link the stockades into something that will hold.',
      },
      xianbei: {
        zh: '軻比能第一次把散落的部落攏在一起。塞南諸郡守備空虛,而中原正忙著彼此 —— 這樣的窗口不會開很久。',
        en: 'Kebineng has gathered the scattered tribes for the first time. The commanderies inside the passes are thinly held and the central plain is busy with itself. A window like this does not stay open.',
      },
    },
  },

  'scn-whatif-zhuge-lives': {
    intro: {
      zh: '岔路在五丈原的病榻。\n\n史書上,他五十四歲死於軍中,姜維扶著蜀漢又走了三十年,終究是「臣等正欲死戰,陛下何故先降」。\n\n這一局他活到八十。屯田仍在,渭南的營壘仍在,那個一日不能不理事的人還在案前。時間 —— 他一生最缺的東西 —— 這次給夠了。',
      en: 'The fork is a sickbed on the Wuzhang plain.\n\nIn the histories he died in camp at fifty-four. Jiang Wei carried Shu another thirty years, and it ended with a prince crying "we were ready to fight to the death — why has Your Majesty surrendered first?"\n\nOn this board he lives to eighty. The farming colonies are still there, the works along the Wei are still there, and the man who could not leave a day\'s business undone is still at his desk. Time — the one thing he never had enough of — has been granted.',
    },
    forces: {
      cao: {
        zh: '諸葛亮沒有死在五丈原。他把多活的每一年都用來種地、造弩、練兵 —— 你面對的不是一次北伐,是一個永遠不會鬆手的鄰居。',
        en: 'Zhuge Liang did not die at Wuzhang. Every year he was given past that he spent on farms, crossbows and drill. What faces you is not one northern campaign; it is a neighbour who will never let go.',
      },
      'liu-bei': {
        zh: '相父還在。國事有人扛,你只需要不添亂 —— 但這也意味著,只要他還在,你就永遠學不會自己扛。',
        en: 'The Prime Minister still stands. The state has someone to carry it and you need only stay out of the way — which also means that while he lives you will never learn to carry it yourself.',
      },
      sun: {
        zh: '蜀漢沒有垮,盟約還在,北伐年年有人替你牽制曹魏。這對江東是好事 —— 直到有一天他們真的贏了。',
        en: 'Shu did not collapse; the alliance holds, and every year someone else pins Wei down for you. Good for Jiangdong — right up until the day they actually win.',
      },
    },
  },

  'scn-whatif-cao-wins-chibi': {
    intro: {
      zh: '岔路在一場東南風。\n\n史書上,黃蓋詐降,火船順風而下,操軍船艦一時盡燒,延及岸上營落,人馬燒溺死者甚眾。曹操北還,天下遂成三分。\n\n這一局風沒有轉。周瑜死於亂軍,孫權下落不明,江東只剩殘部;劉備連荊州都還沒摸到就已無處可去。曹操的船隊仍在江上,順流東下。',
      en: 'The fork is a southeast wind.\n\nIn the histories Huang Gai feigned surrender, the fireships ran down on the wind, Cao Cao\'s fleet burned in a single hour and the fire spread to the camps ashore, and men and horses died burning and drowning in great numbers. Cao Cao went north, and the realm settled into three.\n\nOn this board the wind never turned. Zhou Yu died in the rout, Sun Quan is unaccounted for, and Wu is a remnant. Liu Bei had not yet so much as touched Jing province and has nowhere left to go. Cao Cao\'s fleet is still on the river, still coming east.',
    },
    forces: {
      cao: {
        zh: '東風沒有來。江東水軍在赤壁化為焦木,孫權北面稱臣的表章還在路上。天下十有其八 —— 剩下的那兩分,都在山裡。',
        en: 'The east wind never came. The Jiangdong fleet burned to charcoal at Chibi and Sun Quan\'s letter of submission is still on the road. Eight parts of the realm in ten are yours; the other two are in the mountains.',
      },
      'liu-bei': {
        zh: '你又跑了。這一次連荊州的立錐之地都沒有,身邊只剩諸葛亮、關張,和一座孤城。你這輩子輸過很多次,但沒有一次像現在這樣沒有下一步。',
        en: 'You ran again. This time there is not even a foothold in Jing — only Zhuge Liang, your brothers, and one lone city. You have lost many times in your life, but never before with no next move.',
      },
      sun: {
        zh: '兄長戰死,父兄兩代的基業一夜燒完。你這個年紀本不該坐這個位子 —— 但江東除了你,已經沒有姓孫的了。',
        en: 'Your brother fell and two generations of your family\'s work burned in a night. You are too young for this seat. But there is no other Sun left in Jiangdong.',
      },
      'liu-zhang': {
        zh: '蜀道還在,曹操暫時進不來。你父親留下的益州完好無損,而你這輩子最擅長的事就是等 —— 問題是這次還等得到誰。',
        en: 'The Shu roads still hold and Cao Cao cannot come in yet. The Yi province your father left is untouched, and waiting is the thing you have always been best at. The question is who is left to wait for.',
      },
      'zhang-lu': {
        zh: '漢中還是漢中,教眾還是教眾。北面是曹操,南面是劉璋 —— 兩邊都想要這條路,而你只想要五斗米。',
        en: 'Hanzhong is still Hanzhong and the faithful are still the faithful. Cao Cao to the north, Liu Zhang to the south; both want the road, and all you ever wanted was the five pecks of rice.',
      },
      'ma-teng': {
        zh: '關中諸將名義上還奉朝廷,實際上誰也不聽誰。曹操騰出手來只是時間問題,而你已經老了。',
        en: 'The generals of Guanzhong still nominally serve the court and in practice obey nobody. Cao Cao freeing his hands is only a matter of time, and you are old.',
      },
      'shi-xie': {
        zh: '交州離赤壁很遠,遠到消息傳來時已成舊聞。天下要定了,你要考慮的是向誰稱臣。',
        en: 'Jiao is far from Chibi — far enough that the news arrived stale. The realm is about to settle, and what you must decide is whose vassal to be.',
      },
    },
  },

  'scn-whatif-women': {
    intro: {
      zh: '這一局沒有岔路,只有一個一直沒被問出口的問題:如果她們有兵呢?\n\n貂蟬傾覆了一個權臣而史書不記其姓;孫尚香房中侍婢百餘皆親執刀,劉備每入心常凜然;黃月英造木牛流馬而只留下一個「醜」字的傳說;祝融是南中唯一在陣上勝過蜀將的人;蔡琰沒入胡中十二年,歸來默寫四百餘篇無一誤字;卞夫人在曹操凶問傳來時按住了整個曹家。\n\n她們每一個都做過需要兵權才做得成的事,而沒有一個拿到過兵權。',
      en: 'There is no fork here — only a question nobody got round to asking: what if they had armies?\n\nDiaochan brought down a tyrant and the histories do not record her surname. Lady Sun kept a hundred armed maids in her chambers, and Liu Bei never entered them without a chill. Huang Yueying built the wooden oxen and is remembered by a legend about her looks. Zhu Rong is the only commander at Nanzhong who beat a Shu general in the field. Cai Yan spent twelve years among the Xiongnu and came back able to write out four hundred texts from memory without an error. Lady Bian held the House of Cao together the day they thought Cao Cao was dead.\n\nEvery one of them did something that ought to have required an army. Not one of them was ever given one.',
    },
    forces: {
      'diaochan-han': {
        zh: '你曾經是別人棋盤上最鋒利的一枚子。現在棋盤是你的了 —— 而所有人都還當你是那枚子,這是你最大的本錢。',
        en: 'You were once the sharpest piece on someone else\'s board. The board is yours now — and everyone still treats you as the piece, which is your greatest asset.',
      },
      'lady-sun': {
        zh: '兄長的妹妹、劉備的夫人 —— 兩邊都用這兩個身分算計過你。這一次你自己領兵,身分只剩一個。',
        en: 'Your brother\'s sister, Liu Bei\'s wife — both sides have used those two titles to reckon with you. This time you lead your own troops, and there is only one title left.',
      },
      yueying: {
        zh: '世人只記得你是誰的妻子,不記得那些連弩、木牛、水碓是誰畫的圖。現在沒有人可以署別人的名了。',
        en: 'The world remembers whose wife you were and not who drew the repeating crossbow, the wooden ox, the water-driven trip hammer. There is nobody left to put another name on the work.',
      },
      'zhurong-nan': {
        zh: '南中的女子本就上馬能戰。你不需要向誰證明什麼 —— 你只需要那些北來的人明白,這片山是有主的。',
        en: 'Women of Nanzhong have always fought from the saddle; you have nothing to prove to anyone. You need only make the northerners understand that these mountains have an owner.',
      },
      'caiyan-ye': {
        zh: '你被擄去十二年,回來時父親的藏書已散盡,你憑記憶默寫了四百篇。能記住一個崩塌的天下的人,也許能重建它。',
        en: 'Twelve years taken, and when you came back your father\'s library was gone; you wrote out four hundred pieces from memory. Someone who can hold a collapsed world in her head might be able to rebuild one.',
      },
      qiao: {
        zh: '姐妹兩人,一個嫁了孫策,一個嫁了周瑜,兩個都死得早。江東的人習慣把你們當作故事的註腳 —— 現在故事是你們寫。',
        en: 'Two sisters: one married Sun Ce, one married Zhou Yu, and both men died young. Jiangdong is used to treating you as a footnote to their story. The story is yours to write now.',
      },
      'bian-liang': {
        zh: '你出身倡家,一路走到魏國太后。這一生你看盡了男人如何爭奪、如何猜忌、如何敗亡 —— 沒有人比你更懂這個位子怎麼坐。',
        en: 'Born into an entertainer\'s household, you rose to be dowager of Wei. You have watched men contend, suspect one another and fall, your whole life. Nobody understands this seat better than you do.',
      },
    },
  },

  'scn-whatif-yuan-guandu': {
    intro: {
      zh: '岔路在烏巢的糧囤。\n\n史書上,許攸家人犯法被收,許攸夜奔曹操,烏巢一炬,十萬之眾一夕而潰。袁紹渡河北走,兩年後嘔血而死。\n\n這一局審配沒有動許攸的家人。烏巢沒有燒。曹操退保許都,兵不滿萬;而河北的四州之地、十萬帶甲,一寸未損。',
      en: 'The fork is a grain dump at Wuchao.\n\nIn the histories Shen Pei arrested Xu You\'s family for corruption, Xu You rode to Cao Cao that night, one torch went into Wuchao, and a hundred thousand men came apart before morning. Yuan Shao fled north across the river and died of a haemorrhage two years later.\n\nOn this board Shen Pei left the family alone. Wuchao did not burn. Cao Cao has fallen back on Xuchang with under ten thousand men, and the four northern provinces and their hundred thousand soldiers are untouched.',
    },
    forces: {
      cao: {
        zh: '官渡輸了。烏巢沒燒成,許都在夜裡失守,你帶著殘部退到最後幾座城。你這一生賭過很多次,只有這次沒有下一把。',
        en: 'Guandu was lost. Wuchao never burned, Xu fell in the night, and you came away with a remnant and a handful of cities. You have gambled all your life; this is the first time there is no next hand.',
      },
      'yuan-shao': {
        zh: '你贏了。四世三公之後,終於名副其實 —— 而現在最危險的不是曹操,是你三個兒子看著這片天下的眼神。',
        en: 'You won. Four generations of ministers behind you, and at last the name fits the man. The danger now is not Cao Cao; it is the way your three sons look at what you have taken.',
      },
      sun: {
        zh: '兄長還在,江東正壯。北面袁紹方勝,曹操將亡 —— 中原空出來的位置,不會等太久。',
        en: 'Your brother lives and Jiangdong is growing. Yuan Shao has just won in the north and Cao Cao is finished. The space opening in the central plain will not wait long.',
      },
      'liu-bei': {
        zh: '你又一次寄人籬下。袁紹待你不薄,但你很清楚:贏家的帳下,從來不是織席販履之徒的容身處。',
        en: 'Once more you are somebody\'s guest. Yuan Shao has treated you well, but you know how this goes: a winner\'s camp is no place for a mat-weaver\'s son.',
      },
      'liu-biao': {
        zh: '荊州承平二十年,你把它守得很好。北面剛換了主人,而你已經六十多歲,兩個兒子誰也扛不住這樣的鄰居。',
        en: 'Twenty years of peace in Jing, and you kept it well. The north has just changed hands; you are past sixty, and neither of your sons could stand up to a neighbour like that.',
      },
      'liu-zhang': {
        zh: '袁紹贏了誰輸了誰,益州都聽不太清。蜀道依舊難行 —— 這是你唯一的長處,也是你唯一的策略。',
        en: 'Whether Yuan Shao won or Cao Cao lost, it all arrives faint in Yi. The Shu roads are still hard: your only strength, and your only policy.',
      },
      'ma-teng': {
        zh: '關中還是那個關中,只是要應付的人換了姓。你和韓遂之間的舊帳,遲早要在新主人面前算一次。',
        en: 'Guanzhong is still Guanzhong; only the surname of the man to be handled has changed. The old account between you and Han Sui will have to be settled in front of the new master sooner or later.',
      },
      wuhuan: {
        zh: '蹋頓與袁氏交好多年。中原的勝者是你的親家 —— 這意味著馬匹和糧食,也意味著遲早要替他去死。',
        en: 'Tadun has been close to the Yuan for years. The winner in the central plain is kin by marriage: that means horses and grain, and it means dying for him eventually.',
      },
    },
  },

  'scn-whatif-lubu-xuzhou': {
    intro: {
      zh: '岔路在下邳的城樓。\n\n史書上,陳宮獻了計而呂布不敢用,侯成叛,曹操決沂泗灌城,白門樓上一段對話之後,「縊殺布」。\n\n這一局他採了陳宮的計 —— 騎兵在外,步軍守城,互為表裡。徐州守住了。一個從來沒有輸過陣、卻從來守不住地的人,第一次真正握住了一塊地方。',
      en: 'The fork is the tower over the Xiapi gate.\n\nIn the histories Chen Gong offered the plan and Lü Bu dared not use it; Hou Cheng betrayed him; Cao Cao turned the rivers onto the city; and after a short conversation on the White Gate Tower, "Bu was strangled."\n\nOn this board he took the plan — cavalry outside the lines, infantry on the walls, each covering the other. Xuzhou held. A man who never lost a battle and never once kept what he took is holding ground for the first time.',
    },
    forces: {
      cao: {
        zh: '下邳沒有淹成。呂布還在徐州,而你東邊的門戶因此始終開著 —— 你比誰都清楚,那個人不會安分。',
        en: 'Xiapi never flooded. Lü Bu still holds Xu, and so your eastern door has never shut. Nobody knows better than you that the man will not sit still.',
      },
      lubu: {
        zh: '這一次你守住了。徐州是你的,陳宮還在,赤兔還在 —— 缺的仍是那件從沒學會的事:讓人願意替你賣命。',
        en: 'This time you held. Xu is yours, Chen Gong is with you, Red Hare is under you. What is still missing is the one thing you never learned: making men want to die for you.',
      },
      'yuan-shao': {
        zh: '河北四州在手,公孫瓚將亡。你唯一該擔心的是,南邊那兩個小人物 —— 曹操和呂布 —— 有一個會活下來。',
        en: 'Four provinces of Hebei in hand and Gongsun Zan nearly finished. The only thing worth worrying about is that one of those two small men in the south — Cao Cao or Lü Bu — will survive.',
      },
      'yuan-shu': {
        zh: '玉璽在你手裡,而稱帝的話還沒說出口。說出口,天下共討;不說,這方印就只是一塊石頭。',
        en: 'The seal is in your hands and the word has not yet been said. Say it and the realm marches on you; leave it unsaid and the seal is a piece of stone.',
      },
      sun: {
        zh: '江東初定,父仇未報。北面袁術還占著你父親的舊部,南面山越未平 —— 你只有二十出頭,時間站在你這邊。',
        en: 'Jiangdong is barely settled and your father is unavenged. Yuan Shu still holds his old troops in the north and the Shanyue are unpacified in the south. You are barely past twenty; time is on your side.',
      },
      'liu-biao': {
        zh: '坐擁荊襄,帶甲十萬,而你這一生只想守成。北面亂得越久,你這個選擇看起來就越像智慧。',
        en: 'Jing and Xiang beneath you, a hundred thousand under arms, and all you have ever wanted is to keep what you have. The longer the north burns, the more your choice looks like wisdom.',
      },
      'liu-zhang': {
        zh: '父親留下的基業還在。你既無野心也無威望,益州的世族比你更像主人 —— 這一點所有人都看得出來。',
        en: 'Your father\'s inheritance is intact. You have neither ambition nor authority, and the great families of Yi look more like the masters here than you do. Everyone can see it.',
      },
      gongsun: {
        zh: '白馬義從還在,但易京的糧越吃越少。袁紹一年比一年近,而你已經不再出城迎戰了。',
        en: 'The White Horse riders are still yours, but the granaries at Yijing are thinning. Yuan Shao is closer every year, and you no longer ride out to meet him.',
      },
      'ma-teng': {
        zh: '西涼的馬還是天下最好的。朝廷遠在關東,你在關中既是朝廷的將軍,也是自己的主人。',
        en: 'The horses of Liang are still the best under heaven. The court is far away in the east; in Guanzhong you are its general and your own master at once.',
      },
    },
  },

  'scn-whatif-machao-guanzhong': {
    intro: {
      zh: '岔路在一封塗改過的信。\n\n史書上,曹操與韓遂陣前敘舊而不談軍事,又故意送去一封多處點竄的書信,馬超疑韓遂,關中十部自相離散,一戰而潰。\n\n這一局那封信沒有寄出。十部聯軍仍是十萬之眾,馬超盡得關中,涼州羌胡皆從 —— 曹操說過的那句「馬兒不死,吾無葬地也」,現在要當真了。',
      en: 'The fork is a letter with crossings-out in it.\n\nIn the histories Cao Cao chatted with Han Sui about old times and never mentioned the war, then deliberately sent a letter full of alterations. Ma Chao suspected Han Sui, the ten companies of Guanzhong came apart on their own, and one battle finished them.\n\nOn this board that letter was never sent. The coalition is still a hundred thousand strong, Ma Chao holds all of Guanzhong, and the Qiang of Liang ride with him. Cao Cao once said that while that boy lived he would have no place to be buried. It is now worth taking literally.',
    },
    forces: {
      cao: {
        zh: '渭南沒有贏。關中盡失,潼關以西不再是你的 —— 而馬超才三十出頭。',
        en: 'Weinan was not won. Guanzhong is gone and nothing west of Tong pass is yours any more — and Ma Chao is barely thirty.',
      },
      'ma-chao': {
        zh: '關中十部都聽你的了。父親的仇報了一半,而韓遂還在你身邊 —— 這個人,你至今不知道該不該信。',
        en: 'All ten commands of Guanzhong obey you. Half your father\'s death is avenged, and Han Sui is still at your side — a man you have never decided whether to trust.',
      },
      'han-sui': {
        zh: '你在西涼四十年,看著馬騰起、馬騰死、馬超起。年輕人衝得快,而衝得快的人活不長。',
        en: 'Forty years in Liang, and you watched Ma Teng rise, Ma Teng die, and Ma Chao rise. The young charge fast, and men who charge fast do not last.',
      },
      'liu-bei': {
        zh: '關中易主,曹操西線大亂。這是入蜀最好的掩護。',
        en: 'Guanzhong has changed hands and Cao Cao\'s western line is in chaos. There will be no better cover for going into Shu.',
      },
      sun: {
        zh: '北面亂了,合肥的守軍調走了一半。',
        en: 'The north is in disorder and half the Hefei garrison has been pulled away.',
      },
      'liu-zhang': {
        zh: '張魯在北,馬超更北。益州的門口忽然多了兩把刀。',
        en: 'Zhang Lu to the north and Ma Chao beyond him. There are suddenly two blades at Yi\'s door.',
      },
      'zhang-lu': {
        zh: '漢中夾在馬超與劉璋之間。你既不想打,也沒地方躲。',
        en: 'Hanzhong sits between Ma Chao and Liu Zhang. You do not want to fight and there is nowhere to hide.',
      },
      'shi-xie': {
        zh: '中原的消息傳到交州,總是慢半年,也總是壞消息。',
        en: 'News reaches Jiao half a year late, and it is always bad.',
      },
    },
  },

  'scn-whatif-sunce-lives': {
    intro: {
      zh: '岔路在丹徒的獵場。\n\n史書上,孫策單騎逐鹿,遇許貢門客三人,面頰中箭,創甚,夜卒,年二十六。臨終呼張昭等曰:「中國方亂,夫以吳越之眾,三江之固,足以觀成敗。」又謂孫權:「舉江東之眾,決機於兩陣之間,與天下爭衡,卿不如我;舉賢任能,各盡其心,以保江東,我不如卿。」\n\n這一局那三個人沒有等到他。而他正在做的事,是襲許都。',
      en: 'The fork is a hunting ground at Dantu.\n\nIn the histories Sun Ce rode ahead of his escort after a deer, met three retainers of Xu Gong, took an arrow in the face, and died that night at twenty-six. At the end he told Zhang Zhao: "The heartland is in chaos. With the men of Wu and Yue and the security of the three rivers, we can afford to watch and see who wins." And to Sun Quan: "In leading Jiangdong\'s armies and deciding matters between two battle lines, contending with the realm — you are not my equal. In raising up worthy men and getting the best from each of them, to keep Jiangdong safe — I am not yours."\n\nOn this board those three men never found him. And the thing he was working on is a raid on Xuchang.',
    },
    forces: {
      sun: {
        zh: '許貢的門客沒能得手。你二十六歲,江東初定,而曹操與袁紹正在官渡對峙 —— 許都空著。',
        en: 'Xu Gong\'s retainers failed. You are twenty-six, Jiangdong is newly settled, and Cao Cao and Yuan Shao are locked at Guandu. Xu is empty.',
      },
      cao: {
        zh: '官渡未決,而江東那個小霸王還活著。郭嘉說他輕而無備,必死於匹夫之手 —— 這一次沒有應驗。',
        en: 'Guandu is undecided and the young overlord of Jiangdong is still alive. Guo Jia said he was careless and would die at some commoner\'s hand. Not this time.',
      },
      'yuan-shao': {
        zh: '官渡對峙,你兵多糧足。南邊孫策若真敢襲許都,曹操就完了。',
        en: 'Locked at Guandu with more men and more grain. If Sun Ce really dares strike at Xu, Cao Cao is finished.',
      },
      'liu-bei': {
        zh: '你在袁紹帳下,心思卻在別處。天下要變了,而你還沒有一塊地。',
        en: 'You are in Yuan Shao\'s camp with your mind elsewhere. The realm is about to turn over and you still have no ground of your own.',
      },
      'liu-biao': {
        zh: '孫策沒死,黃祖就還得繼續打。江夏是荊州的東門。',
        en: 'Sun Ce did not die, so Huang Zu must keep fighting. Jiangxia is Jing\'s eastern gate.',
      },
      'liu-zhang': {
        zh: '中原大戰與益州無關 —— 每一代蜀主都這麼想。',
        en: 'The great war in the central plain is nothing to Yi. Every lord of Shu has thought so.',
      },
      'ma-teng': {
        zh: '關中在等結果。誰贏,關中就奉誰。',
        en: 'Guanzhong waits for the result. Whoever wins, Guanzhong will serve.',
      },
      wuhuan: {
        zh: '袁氏若敗,幽州的難民會往北跑;袁氏若勝,他會來要馬。',
        en: 'If the Yuan lose, refugees come north out of You. If they win, he will come for horses.',
      },
    },
  },

  'scn-whatif-dong-lives': {
    intro: {
      zh: '岔路在未央殿的掖門。\n\n史書上,王允與呂布謀,李肅執戟刺之不入,呂布持矛叫「有詔討賊」,董卓死,夷三族。市人以其屍置臍中燃燈,光明達曙。\n\n這一局那一戟刺中了,而刺的人不是呂布 —— 或者說,連環之計根本沒有做成。董卓仍在長安,郿塢的糧穀足支三十年,關東諸侯依然彼此提防。',
      en: 'The fork is a side gate of the Weiyang palace.\n\nIn the histories Wang Yun and Lü Bu laid the plot; Li Su\'s halberd would not go through the armour; Lü Bu levelled his spear and cried "there is an edict to punish the traitor"; and Dong Zhuo died, and his clan with him. The market people set a wick in his navel, and it burned till dawn.\n\nOn this board the blade turned — or rather, the chained stratagem never came together at all. Dong Zhuo is still in Chang\'an, Meiwu holds thirty years of grain, and the eastern lords still trust each other less than they fear him.',
    },
    forces: {
      dong: {
        zh: '王允的計沒成,呂布還是你的義子。長安在手,天子在手 —— 而關東那些人,你其實從沒真正贏過。',
        en: 'Wang Yun\'s plot failed and Lü Bu is still your adopted son. Chang\'an is yours and so is the Son of Heaven — and you have never actually beaten the men east of the pass.',
      },
      cao: {
        zh: '你只有兩座城,連兗州都還沒到手。討董的聯軍散了,而董卓還活著。',
        en: 'Two cities, and Yan province not yet in hand. The coalition against Dong Zhuo dissolved, and Dong Zhuo is still alive.',
      },
      'yuan-shao': {
        zh: '盟主的名分還在,聯軍已經散了。你要的是河北,不是洛陽。',
        en: 'You are still nominally chief of the alliance and the alliance is gone. What you want is Hebei, not Luoyang.',
      },
      'yuan-shu': {
        zh: '你和兄長已經翻臉。南陽戶口百萬,而你想的是更遠的東西。',
        en: 'You and your cousin have fallen out. Nanyang holds a million households, and your mind is on something further off.',
      },
      sun: {
        zh: '孫堅是討董諸將中唯一真打的。你打進了洛陽,撿到了一方印 —— 這方印會要你兒子的命。',
        en: 'Of all the lords against Dong Zhuo, Sun Jian alone actually fought. You broke into Luoyang and picked up a seal. That seal will cost your sons dearly.',
      },
      'liu-biao': {
        zh: '單騎入荊州,已經坐穩。北面的爛攤子,能不沾就不沾。',
        en: 'You rode into Jing alone and the seat is secure. The mess in the north is best not touched.',
      },
      'liu-yan': {
        zh: '你上書請立州牧,天下由此分裂 —— 這一點你心裡清楚。益州的路,你已經斷了。',
        en: 'You are the man who asked for provincial governors, and the realm split because of it. You know that. And you have already cut the roads into Yi.',
      },
      gongsun: {
        zh: '白馬義從縱橫塞北,而你真正的對手在南邊,姓袁。',
        en: 'The White Horse riders range beyond the frontier — and your real opponent is to the south, and his name is Yuan.',
      },
      tao: {
        zh: '徐州富庶,而你老了。膝下無人可託,城裡卻來了一個織席販履的。',
        en: 'Xu is rich and you are old. There is no one of your own to hand it to — and a mat-weaver\'s son has arrived in the city.',
      },
      'kong-rong': {
        zh: '北海被黃巾圍過,是劉備來解的圍。你會做文章,不會打仗,這一點你自己也認。',
        en: 'Beihai was besieged by the Turbans and Liu Bei broke the siege. You write well and cannot fight, and you admit it yourself.',
      },
      'ma-teng': {
        zh: '董卓還在長安,關中就輪不到你。',
        en: 'While Dong Zhuo is in Chang\'an, Guanzhong is not yours to take.',
      },
    },
  },

  'scn-whatif-yuanshu-empire': {
    intro: {
      zh: '岔路在壽春的糧倉。\n\n史書上,袁術僭號之後奢淫肆欲,士卒凍餒,江淮空盡,人民相食。眾叛親離,欲往青州依袁譚,道死;臨終問廚下,尚有麥屑三十斛。時盛暑,欲得蜜漿,又無蜜。坐櫬床上,嘆息良久,乃大吒曰:「袁術至於此乎!」\n\n這一局他沒有把淮南吃空。帝號立住了,壽春的倉是滿的,而許都那位天子從此有了一個同行。',
      en: 'The fork is the granary at Shouchun.\n\nIn the histories Yuan Shu took the title and then gave himself to luxury while his soldiers froze and starved; Huainan was eaten bare and people ate each other. Deserted by everyone, he set out for Qing province to shelter with Yuan Tan and died on the road. At the end he asked the kitchen what was left: thirty bushels of barley chaff. It was high summer and he wanted honey water, and there was no honey. He sat up on the couch, sighed for a long while, and then cried out: "Has it come to this for Yuan Shu?"\n\nOn this board he did not eat Huainan bare. The title held, the granaries are full, and the emperor at Xuchang now has a colleague.',
    },
    forces: {
      'yuan-shu': {
        zh: '仲家皇帝坐穩了。玉璽、年號、宮室都齊了 —— 缺的是人心,而那樣東西買不到,也搶不來。',
        en: 'The Zhongjia emperor sits secure. Seal, reign name, palace, all in place. What is missing is the hearts of men, and that cannot be bought or taken.',
      },
      cao: {
        zh: '你手裡有天子,他手裡有玉璽。這場仗名義上是討逆,實際上是兩個挾天命的人只能活一個。',
        en: 'You hold the Son of Heaven; he holds the seal. Nominally this is a punitive campaign. Actually it is two men each claiming the mandate, and only one may live.',
      },
      lubu: {
        zh: '徐州剩下兩座城。你替誰打都可以,問題是誰付得起 —— 這句話你說出口的時候,自己也知道難聽。',
        en: 'Two cities left in Xu. You will fight for anyone; the question is who can pay. You know how that sounds even as you say it.',
      },
      'yuan-shao': {
        zh: '族弟稱了帝。汝南袁氏的名聲被他一個人敗光,而天下人分不清哪個是你。',
        en: 'Your cousin has taken the title. He has spent the Yuan name down to nothing by himself, and the realm cannot tell which of you is which.',
      },
      sun: {
        zh: '你替袁術打了幾年仗,現在他成了皇帝。玉璽本來是你父親的 —— 這筆帳,你記得很清楚。',
        en: 'You fought for Yuan Shu for years and now he is an emperor. The seal was your father\'s to begin with. You remember the account precisely.',
      },
      'liu-biao': {
        zh: '袁術僭號,天下側目。荊州緊挨著淮南,你這次很難再作壁上觀。',
        en: 'Yuan Shu has usurped the style and the realm has turned to look. Jing borders Huainan; this time it will be hard to stay out of it.',
      },
      'liu-zhang': {
        zh: '中原出了個皇帝,益州照舊。你父親教過你:蜀中之主要學會的第一件事,是聽不見。',
        en: 'There is an emperor in the central plain; Yi carries on. Your father taught you that the first thing a lord of Shu must learn is how not to hear.',
      },
      gongsun: {
        zh: '南邊的僭號與你無關,你眼前只有袁紹。易京的牆一年比一年高,人一年比一年少。',
        en: 'The usurpation in the south is nothing to you; there is only Yuan Shao in front of you. The walls of Yijing rise a little every year and the men behind them thin.',
      },
      'ma-teng': {
        zh: '朝廷有兩個了,你依然只認一個 —— 誰給糧,你就認誰。這話不能明說,但關中人人都懂。',
        en: 'There are two courts now, and you still recognise only one: whoever sends grain. It cannot be said aloud, but everyone in Guanzhong understands it.',
      },
    },
  },

  'scn-whatif-guojia-lives': {
    intro: {
      zh: '岔路在柳城的歸途。\n\n史書上,郭嘉隨軍北征烏桓,水土不服,道病卒,年三十八。次年赤壁大敗,曹操嘆曰:「郭奉孝在,不使孤至此。」\n\n這一局他回來了。荊州剛下,水軍新編,連環的船已經紮好 —— 而帳中多了一個從不隨眾附和的人。',
      en: 'The fork is the road home from Liucheng.\n\nIn the histories Guo Jia went north against the Wuhuan, could not take the climate, and died of illness on the road at thirty-eight. The next year came Chibi, and Cao Cao said: "Had Fengxiao been here, I would not have come to this."\n\nOn this board he came back. Jing province has just fallen, the fleet is newly organised, the ships are already chained — and there is one man in the tent who has never once agreed with the room.',
    },
    forces: {
      cao: {
        zh: '郭嘉沒死在柳城。赤壁之前有他一句話,也許就不會有那把火 —— 你身邊還有一個能說真話的人。',
        en: 'Guo Jia did not die at Liucheng. One word from him before Chibi might have kept the fire from starting. You still have someone who tells you the truth.',
      },
      'liu-bei': {
        zh: '曹操南下,你在當陽被追上。三座城,十萬百姓,一條退路。',
        en: 'Cao Cao is coming south and they caught you at Dangyang. Three cities, a hundred thousand civilians, one road out.',
      },
      sun: {
        zh: '曹操的信到了。降還是戰,江東分成兩半 —— 而你才二十六歲。',
        en: 'Cao Cao\'s letter has come. Submit or fight; Jiangdong is split in two. And you are twenty-six.',
      },
      'liu-biao': {
        zh: '父親剛死,蔡瑁勸降。你十幾歲,沒有人問過你想怎麼樣。',
        en: 'Your father is just dead and Cai Mao urges surrender. You are barely more than a boy and nobody has asked you what you want.',
      },
      'liu-zhang': {
        zh: '荊州降了,曹操到了門口。你開始考慮請人入蜀 —— 這個念頭最後會要你的位子。',
        en: 'Jing has surrendered and Cao Cao is at the door. You have begun to think about inviting someone into Shu. That thought will cost you the seat.',
      },
      'zhang-lu': {
        zh: '漢中在曹操與劉璋之間,而兩邊都騰不出手 —— 暫時。',
        en: 'Hanzhong lies between Cao Cao and Liu Zhang, and neither can spare a hand — for now.',
      },
      'ma-teng': {
        zh: '曹操召你入朝。去,是死;不去,也是死。',
        en: 'Cao Cao has summoned you to court. Going is death and not going is death.',
      },
      'shi-xie': {
        zh: '交州安穩,你最想知道的是江東會不會降。',
        en: 'Jiao is quiet. What you most want to know is whether Jiangdong will submit.',
      },
    },
  },

  'scn-whatif-zhouyu-lives': {
    intro: {
      zh: '岔路在巴丘的病榻。\n\n史書上,周瑜取蜀之議方定,還江陵治行裝,道於巴丘病卒,年三十六。他上書孫權:「乞與奮威俱進取蜀,得蜀而并張魯,因留奮威固守其地,好與馬超結援。瑜還與將軍據襄陽以蹙操,北方可圖也。」\n\n那份規劃就此作廢,魯肅接任,吳蜀由爭為盟。這一局他沒有死在巴丘 —— 二分天下之策,要開始執行了。',
      en: 'The fork is a sickbed at Baqiu.\n\nIn the histories the plan for taking Shu had just been approved; Zhou Yu went back to Jiangling to prepare, fell ill on the road at Baqiu, and died at thirty-six. His memorial had read: "Let me and the General Who Rouses Might advance on Shu together. Taking Shu we absorb Zhang Lu, and leave the General Who Rouses Might to hold that ground and make common cause with Ma Chao. I shall come back and hold Xiangyang with you to squeeze Cao Cao, and the north can be planned for."\n\nThat plan lapsed, Lu Su succeeded him, and Wu and Shu became allies instead of rivals. On this board he did not die at Baqiu — and the two-way partition of the realm is about to be attempted.',
    },
    forces: {
      sun: {
        zh: '周瑜沒有死在巴丘。他的二分天下之計還在案上:取蜀、并張魯、結馬超,然後與曹操分天下。',
        en: 'Zhou Yu did not die at Baqiu. His plan for halving the realm is still on the table: take Shu, absorb Zhang Lu, ally with Ma Chao, then divide the world with Cao Cao.',
      },
      cao: {
        zh: '赤壁之後你退回北方,而江東那個周瑜還活著。他若西進,你的西線和南線就會連成一片。',
        en: 'You fell back north after Chibi, and Zhou Yu is still alive down there. If he goes west, your southern and western lines become one problem.',
      },
      'liu-bei': {
        zh: '周瑜要取益州,而益州是諸葛亮給你畫的那一半天下。盟友和對手,現在是同一個人。',
        en: 'Zhou Yu means to take Yi — and Yi is the half of the realm Zhuge Liang drew for you. Ally and rival are now the same man.',
      },
      'ma-chao': {
        zh: '江東遣使來了,說要與你共擊曹操。西涼的騎兵配上江東的水軍 —— 這話聽著很像真的。',
        en: 'An envoy has come from Jiangdong proposing a joint blow at Cao Cao. Liang\'s horse with Jiangdong\'s ships: it sounds almost real.',
      },
      'han-sui': {
        zh: '又是盟約。你這輩子簽過的盟約,沒有一份活過三年。',
        en: 'Another pact. Not one of the pacts you have signed has outlived three years.',
      },
      'liu-zhang': {
        zh: '東邊要來,北邊也要來。你派誰去守,誰就可能是下一個主人。',
        en: 'They come from the east and from the north. Whoever you send to hold the gate may be the next master.',
      },
      'zhang-lu': {
        zh: '周瑜的計裡有你一份 —— 被并的那一份。',
        en: 'You have a part in Zhou Yu\'s plan: the part that gets absorbed.',
      },
      'shi-xie': {
        zh: '江東要西進了,交州背後就空了。',
        en: 'Jiangdong is going west, and Jiao\'s back is bare.',
      },
    },
  },

  'scn-whatif-pangtong-lives': {
    intro: {
      zh: '岔路在雒城下的一支流矢。\n\n史書上,龐統率眾攻城,為流矢所中,卒,年三十六。臥龍鳳雛得一可安天下,而劉備得二,一個死在入蜀的路上,另一個從此再沒離開過案牘。\n\n這一局那支箭偏了。鳳雛坐鎮成都,臥龍便能專心北伐 —— 諸葛亮一生「政事無巨細,咸決於亮」的重擔,這回有人分。',
      en: 'The fork is a stray arrow under the walls of Luocheng.\n\nIn the histories Pang Tong led the assault, was struck, and died at thirty-six. It was said that either the Sleeping Dragon or the Fledgling Phoenix would be enough to settle the realm. Liu Bei had both — and one died on the road into Shu, and the other never again got out from behind a desk.\n\nOn this board the arrow missed. With the Phoenix holding Chengdu the Dragon can give the north his whole attention — the burden of a man through whose hands every matter great and small had to pass is, this once, shared.',
    },
    forces: {
      'liu-bei': {
        zh: '落鳳坡沒有射中。龐統還在,益州已定,而諸葛亮不必入蜀 —— 荊州留著一個真正能鎮的人。',
        en: 'The arrow at Luofeng missed. Pang Tong lives, Yi is taken, and Zhuge Liang need not come west — which leaves someone in Jing who can truly hold it.',
      },
      cao: {
        zh: '劉備得了益州,而荊州也沒鬆。兩頭都硬起來了。',
        en: 'Liu Bei has Yi and Jing has not loosened either. Both ends have hardened.',
      },
      sun: {
        zh: '荊州要不回來了。孔明在荊州,而龐統在成都 —— 這兩個人一南一北,你插不進去。',
        en: 'Jing will not come back. Kongming is in Jing and Pang Tong in Chengdu; with those two north and south you cannot get a wedge in.',
      },
      'zhang-lu': {
        zh: '劉備在南,曹操在北。漢中這條路,兩邊都要走。',
        en: 'Liu Bei to the south and Cao Cao to the north. Both of them want the Hanzhong road.',
      },
      'shi-xie': {
        zh: '交州依舊。你已經很老了。',
        en: 'Jiao is as it was. You are very old now.',
      },
      xianbei: {
        zh: '中原三分,邊牆無人管。',
        en: 'The central plain is in three and nobody is minding the frontier.',
      },
      nanman: {
        zh: '蜀漢坐大,南中的日子要不好過了。',
        en: 'Shu is growing. Life in Nanzhong is about to get harder.',
      },
    },
  },

  'scn-whatif-guanyu-north': {
    intro: {
      zh: '岔路在漢水的洪峰之後。\n\n史書上,關羽水淹七軍,威震華夏,曹操議徙都以避 —— 然後司馬懿的一封信送到江東,呂蒙的船隊換上了白衣。\n\n這一局那封信沒起作用,或者江東沒有動。樊城已破,許都在望,而曹操還在洛陽。',
      en: 'The fork is the week after the Han River crested.\n\nIn the histories Guan Yu drowned the seven armies, his fame shook the realm, and Cao Cao discussed moving the capital out of reach — and then one letter from Sima Yi went to Jiangdong, and Lü Meng\'s crews put on white.\n\nOn this board that letter did not work, or Jiangdong did not move. Fan has fallen, Xuchang is in sight, and Cao Cao is still at Luoyang.',
    },
    forces: {
      'liu-bei': {
        zh: '水淹七軍,威震華夏。曹操幾乎要遷都 —— 而東邊那個盟友,沒有動。',
        en: 'The seven armies drowned and the realm shook. Cao Cao nearly moved his capital — and the ally in the east did not move at all.',
      },
      cao: {
        zh: '于禁降了,龐德死了,許都在關羽的鋒下。司馬懿說,先不要遷都,孫權未必願意看劉備得志。',
        en: 'Yu Jin surrendered, Pang De is dead, and Xu lies under Guan Yu\'s blade. Sima Yi says: do not move the capital yet. Sun Quan may not want to see Liu Bei succeed.',
      },
      sun: {
        zh: '關羽威震華夏,而荊州就在你上游。幫他,還是趁他北顧的時候動手 —— 這個決定會定你一朝的走向。',
        en: 'Guan Yu shakes the realm, and Jing sits upstream of you. Help him, or move while his back is turned. This decision sets the course of your whole reign.',
      },
      xianbei: {
        zh: '中原震動,邊軍南調。這是最好的時候。',
        en: 'The central plain is shaking and the frontier troops have gone south. There is no better time.',
      },
      nanman: {
        zh: '北面打得越大,南中越沒人管。',
        en: 'The bigger the war up north, the less anyone minds Nanzhong.',
      },
    },
  },

  'scn-whatif-gaopingling': {
    intro: {
      zh: '岔路在高平陵的那一夜。\n\n史書上,曹爽在城外想了一夜,把刀扔在地上:「我不失作富家翁。」桓範哭道:「曹子丹佳人,生汝兄弟,犢耳!」數日之後,夷三族。\n\n這一局他沒有扔那把刀 —— 或者說,他先動了手。天子在他手裡,大司農印在他手裡,四方之兵可以召。司馬懿有的只是洛陽一城和一支臨時湊起來的隊伍。',
      en: 'The fork is that night outside the Gaoping Tombs.\n\nIn the histories Cao Shuang thought about it until dawn and threw his sword down: "I can still be a rich gentleman." Huan Fan wept: "Cao Zhen was a fine man, and he fathered you — calves!" Within days their clans were destroyed.\n\nOn this board he did not throw the sword down — or rather, he moved first. He has the emperor, he has the Grand Agriculturalist\'s seal, and he can call up the provincial armies. Sima Yi has the city of Luoyang and whatever he could scrape together that morning.',
    },
    forces: {
      cao: {
        zh: '你先動手了。司馬懿稱病三年,而你這次沒有信 —— 高平陵那天,洛陽的城門是你關上的。',
        en: 'You moved first. Sima Yi feigned illness for three years and this time you did not believe it. On the day of Gaoping tombs it was you who shut the gates of Luoyang.',
      },
      sima: {
        zh: '七十歲,裝了三年病,結果被一個紈褲搶了先手。你手裡只剩三千死士和一個活著的名聲。',
        en: 'Seventy years old, three years of feigned illness, and a wastrel got in first. You have three thousand sworn men and a name that is still worth something.',
      },
      'liu-bei': {
        zh: '魏國自己打起來了。姜維說機不可失,而蔣琬費禕都不在了。',
        en: 'Wei is fighting itself. Jiang Wei says the moment cannot be missed — and Jiang Wan and Fei Yi are both gone.',
      },
      sun: {
        zh: '魏國內亂,淮南空虛。你已經很老了,但這一次值得再賭一把。',
        en: 'Wei is in turmoil and Huainan is bare. You are very old — and this is worth one more throw.',
      },
    },
  },

  'scn-whatif-luxun-lives': {
    intro: {
      zh: '岔路在武昌的一封詔書。\n\n史書上,孫權立太子和與魯王霸,兩宮並立,群臣分黨。陸遜屢次上疏切諫,孫權遣中使責問,「遜憤恚致卒」,年六十三。此後吳國二十年,顧命之臣接連死於內鬥,江防從內部爛掉。\n\n這一局那些詔書沒有發出。二宮之爭止於朝堂,陸遜還在。',
      en: 'The fork is an edict sent from Wuchang.\n\nIn the histories Sun Quan set up both a Crown Prince and a Prince of Lu, the two households stood level, and the court split into parties. Lu Xun remonstrated again and again; Sun Quan sent messengers to reprimand him; and "in indignation Lu Xun died," aged sixty-three. For twenty years afterwards Wu\'s designated ministers killed one another in turn, and the river defence rotted from the inside.\n\nOn this board those messengers never rode. The quarrel of the two households stayed in the council chamber, and Lu Xun is still alive.',
    },
    forces: {
      sun: {
        zh: '陸遜沒有被逼死。二宮之爭仍在,而朝中還有一個人敢說話 —— 這對你是好事,雖然你當時不這麼想。',
        en: 'Lu Xun was not hounded to death. The two-palace quarrel goes on, and there is still one man at court who dares speak. That is good for you, though you did not think so at the time.',
      },
      sima: {
        zh: '高平陵之後,魏國是你的了。南邊的陸遜還活著,而他是唯一讓你認真對待過的對手。',
        en: 'After Gaoping tombs, Wei is yours. Lu Xun is still alive in the south — the only opponent you ever took entirely seriously.',
      },
      cao: {
        zh: '曹爽敗了,曹氏的宗室只剩名分。你這個位子,是別人留給你的。',
        en: 'Cao Shuang is finished and the Cao clan has only its titles left. The seat you sit in was left to you by someone else.',
      },
      'liu-bei': {
        zh: '吳國沒有自毀長城,盟約還算牢靠。姜維的北伐至少不必獨自面對魏國。',
        en: 'Wu did not tear down its own wall and the alliance still holds. At least Jiang Wei\'s campaigns will not face Wei alone.',
      },
    },
  },

  // ── 戰國 ─────────────────────────────────────────────────────────
  // These boards borrow the Three Kingdoms map and calendar. The intro of
  // each says which city stands in for which, so nobody has to guess.
  'scn-ws-seven': {
    intro: {
      zh: '周室東遷之後五百年,天子只剩一個名分。三家分晉,田氏代齊,禮樂征伐自諸侯出。\n\n秦據關中而有巴蜀,楚地五千里,齊有稷下之盛,趙胡服騎射,魏首霸而衰,燕築黃金台,韓當秦之衝。合縱連橫,朝秦暮楚,一士之辯可傾一國。\n\n【輿圖代換】長安=咸陽,鄴=邯鄲,臨淄=齊都,薊=燕都,陳留=大梁,許昌=新鄭,江陵=郢,上黨=長平所在,函谷關即函谷關。',
      en: 'Five hundred years after the Zhou moved east, the Son of Heaven is a title and nothing more. Three houses have partitioned Jin, the Tian clan has replaced the rulers of Qi, and rites and campaigns alike now issue from the feudal lords.\n\nQin holds Guanzhong and Ba-Shu. Chu is five thousand li across. Qi has the Jixia academy. Zhao rides in nomad dress. Wei was the first hegemon and is fading. Yan has built its Terrace of Gold. Han stands directly in Qin\'s path. Alliances form vertically and horizontally, men serve Qin at dawn and Chu at dusk, and one persuader\'s argument can overturn a state.\n\n[Map] Chang\'an = Xianyang, Ye = Handan, Linzi = the Qi capital, Ji = the Yan capital, Chenliu = Daliang, Xuchang = Xinzheng, Jiangling = Ying, Shangdang = the Changping ground, and the Hangu Pass is itself.',
    },
    forces: {
      qin: {
        zh: '函谷關以西是你的,以東是六國的。歷代秦君攢下的家底夠厚,厚到你可以不急 —— 但六國隨時可能合縱。',
        en: 'West of Hangu is yours; east of it belongs to six others. Generations of Qin lords have left you enough to be patient with — but the six could league together at any time.',
      },
      chu: {
        zh: '地方五千里,帶甲百萬。楚國最大,也最散 —— 屈景昭三家的封邑加起來比王室還多。',
        en: 'Five thousand li and a million under arms. Chu is the largest state and the loosest: the fiefs of the Qu, the Jing and the Zhao together outweigh the royal house.',
      },
      qi: {
        zh: '臨淄之途,車轂擊,人肩摩。齊國富甲天下,而富庶的國家最怕的是別人也知道。',
        en: 'In the streets of Linzi the wheel hubs strike and the shoulders rub. Qi is the richest state under heaven — and a rich state\'s chief danger is that everyone knows it.',
      },
      yan: {
        zh: '燕地苦寒,國小民貧。你在易水邊築黃金台招賢 —— 這是弱國唯一買得起的東西。',
        en: 'Yan is cold and poor. You have raised the Terrace of Gold on the Yi to draw men of worth. It is the only thing a weak state can afford to buy.',
      },
      zhao: {
        zh: '胡服騎射之後,趙國有了天下最強的騎兵。你證明了華夏可以學夷狄 —— 現在要證明學了有用。',
        en: 'Since the barbarian dress and mounted archery, Zhao has the finest cavalry under heaven. You proved the Xia could learn from the Hu; now prove the learning was worth it.',
      },
      wei: {
        zh: '魏國曾經是天下第一。桂陵、馬陵之後,那個位置空了出來,而你還坐在原處假裝沒事。',
        en: 'Wei was once first among the states. After Guiling and Maling that place stood empty, and you are still sitting where you were, pretending otherwise.',
      },
      han: {
        zh: '韓國最小,夾在秦楚魏之間。你的申不害留下一套術治 —— 但術治救不了地理。',
        en: 'Han is the smallest, wedged between Qin, Chu and Wei. Shen Buhai left you a statecraft of method — and method cannot fix geography.',
      },
    },
  },

  'scn-ws-weiwen': {
    intro: {
      zh: '魏文侯用李悝變法、西門豹治鄴、吳起守西河 —— 戰國第一個真正意義上的強國。\n\n吳起在西河,秦兵不敢東向;李悝盡地力之教,作《法經》;樂羊伐中山三年而拔之。魏之武卒,衣三屬之甲,操十二石之弩,負矢五十個,置戈其上,冠胄帶劍,贏三日之糧,日中而趨百里。\n\n這是霸業的開端,也是它最好的一年 —— 此後魏惠王遷都大梁,失商鞅、失孫臏、失范雎,一步步把天下讓給了秦。',
      en: 'Marquis Wen of Wei employed Li Kui\'s reforms, Ximen Bao to govern Ye, and Wu Qi to hold the west of the river — the first state of the Warring States to be genuinely strong.\n\nWith Wu Qi on the west bank, Qin dared not face east. Li Kui taught the full use of the soil and wrote the Canon of Law. Yue Yang took three years over Zhongshan and took it. The Wei heavy infantry wore three-piece armour, spanned a twelve-picul crossbow, carried fifty bolts and a halberd besides, went helmeted and belted with a sword and three days\' rations, and covered a hundred li between dawn and noon.\n\nThis is the beginning of the hegemony, and its best year. After this King Hui moves the capital to Daliang, loses Shang Yang, loses Sun Bin, loses Fan Ju, and hands the realm to Qin one man at a time.',
    },
    forces: {
      wei: {
        zh: '李悝變法,吳起練兵,西門豹治鄴。三晉之中你第一個變法,也第一個強起來 —— 這個開頭沒有人能複製。',
        en: 'Li Kui\'s reforms, Wu Qi\'s army, Ximen Bao at Ye. Of the three Jin successors you reformed first and rose first. Nobody else gets this beginning.',
      },
      qin: {
        zh: '河西之地被魏國奪走了。你想變法,而國中老世族沒有一個人願意。商鞅還在魏國,無人賞識。',
        en: 'Wei has taken the land west of the river. You want reform and not one of the old families will have it. Shang Yang is still in Wei, and nobody there sees him.',
      },
      chu: {
        zh: '吳起若來,楚國可強 —— 但變法要動貴族的封邑,而楚國的貴族比王還老。',
        en: 'If Wu Qi comes, Chu can be strong. But reform means touching the nobles\' fiefs, and the nobles of Chu are older than the throne.',
      },
      qi: {
        zh: '田氏代齊未久,你需要一場勝仗來證明這個位子坐得正。',
        en: 'It has not been long since the Tian took Qi. You need a victory to prove the seat is rightfully yours.',
      },
      yan: {
        zh: '燕在最北,離中原的爭鬥最遠。遠是安全,也是被遺忘。',
        en: 'Yan lies furthest north, furthest from the quarrels of the central states. Distance is safety, and it is also being forgotten.',
      },
      zhao: {
        zh: '三晉本是一家,如今各走各路。魏國走在前面,你得決定是跟還是擋。',
        en: 'The three Jin were one house and now go their own ways. Wei is out in front; you must decide whether to follow it or block it.',
      },
      han: {
        zh: '三晉之末。魏強則韓安,魏弱則韓危 —— 你的國運掛在別人身上。',
        en: 'Last of the three Jin. When Wei is strong Han is safe; when Wei is weak Han is in danger. Your fortunes hang on someone else.',
      },
    },
  },

  'scn-ws-shangyang': {
    intro: {
      zh: '秦孝公下求賢令:「賓客群臣有能出奇計強秦者,吾且尊官,與之分土。」衛鞅自魏入秦。\n\n變法之令既具,未布,恐民之不信,乃立三丈之木於國都市南門,募民有能徙置北門者予十金。民怪之,莫敢徙。復曰「能徙者予五十金」。有一人徙之,輒予五十金,以明不欺。卒下令。\n\n行之十年,秦民大悅,道不拾遺,山無盜賊,家給人足,民勇於公戰,怯於私鬥,鄉邑大治。\n\n【輿圖代換】同「戰國七雄」一本。',
      en: 'Duke Xiao of Qin issued a call for talent: "If any guest or officer can produce an extraordinary plan to make Qin strong, I shall give him high office and share territory with him." Wei Yang came to Qin from Wei.\n\nThe reform edicts were drafted but not yet published, for fear the people would not believe them. So a pole thirty feet long was set up at the south gate of the market, and it was announced that whoever moved it to the north gate would be given ten pieces of gold. The people thought it strange and nobody touched it. The offer was raised to fifty. One man moved it and was given fifty on the spot, to show that the state did not deceive. Then the edicts went out.\n\nTen years on, the people of Qin were content: nothing dropped on the road was picked up, there were no bandits in the hills, every household had enough, men were brave in the state\'s wars and reluctant in private quarrels, and the districts were well governed.\n\n[Map] As in the Seven Powers board.',
    },
    forces: {
      qin: {
        zh: '商鞅來了。徙木立信之後,新法要動的是宗室的血 —— 你要決定護他到什麼地步。',
        en: 'Shang Yang has come. After the pole and the reward, the new law must next cut into the royal clan. You must decide how far you will shield him.',
      },
      chu: {
        zh: '秦人在變法。你聽說了,也沒放在心上 —— 西邊那個牧馬的國家,能變成什麼樣。',
        en: 'Qin is reforming. You heard, and thought little of it. What could that horse-herding state in the west possibly become?',
      },
      qi: {
        zh: '齊威王一鳴驚人,稷下學宮客卿如雲。你比誰都富,也比誰都愛聽人說話。',
        en: 'King Wei of Qi startled the realm with one cry, and the Jixia academy fills with retained scholars. You are richer than anyone, and fonder than anyone of being talked to.',
      },
      yan: {
        zh: '燕國依舊安靜。天下在變,而變化傳到薊城要很久。',
        en: 'Yan is quiet as ever. The realm is changing, and change takes a long time to reach Ji.',
      },
      zhao: {
        zh: '趙國尚未胡服。你能看見北邊騎兵的厲害,但改祖宗衣冠這種話還說不出口。',
        en: 'Zhao has not yet taken barbarian dress. You can see what the horsemen of the north can do, but changing the robes of the ancestors is not yet a thing that can be said aloud.',
      },
      wei: {
        zh: '公叔痤臨終說:用商鞅,不用就殺了他。你兩樣都沒做。',
        en: 'On his deathbed Gongshu Cuo said: employ Shang Yang, and if you will not, kill him. You did neither.',
      },
      han: {
        zh: '申不害為相,韓國十五年無事。無事不等於強,只等於沒被挑上。',
        en: 'With Shen Buhai as chancellor Han has had fifteen quiet years. Quiet is not strength; it only means nobody has picked you yet.',
      },
    },
  },

  'scn-ws-guiling': {
    intro: {
      zh: '魏伐趙,圍邯鄲。趙求救於齊,齊威王使田忌將,孫臏為師,居輜車中,坐為計謀。\n\n田忌欲引兵之趙。孫臏曰:「夫解雜亂紛糾者不控卷,救鬥者不搏撠,批亢擣虛,形格勢禁,則自為解耳。今梁趙相攻,輕兵銳卒必竭於外,老弱罷於內。君不若引兵疾走大梁,據其街路,衝其方虛,彼必釋趙而自救。是我一舉解趙之圍而收弊於魏也。」\n\n田忌從之。魏果去邯鄲,與齊戰於桂陵,大破梁軍。',
      en: 'Wei invaded Zhao and besieged Handan. Zhao appealed to Qi, and King Wei of Qi sent Tian Ji in command with Sun Bin as strategist, riding in a covered cart and directing from his seat.\n\nTian Ji wanted to march to Zhao. Sun Bin said: "To untangle a knot you do not tug at the loops; to break up a brawl you do not join in the grappling. Strike where it is vital and thrust at what is empty, so that the shape of things forbids him to continue, and the knot unties itself. Liang and Zhao are locked together, so his light troops and picked men are all spent abroad and only the old and weak are left at home. Better to march hard on Daliang, hold its streets, and thrust at the emptiness there. He will let Zhao go to save himself — and with one move we raise the siege of Zhao and take Wei at a disadvantage."\n\nTian Ji did so. Wei duly left Handan, met Qi at Guiling, and was broken.',
    },
    forces: {
      qi: {
        zh: '圍魏救趙。孫臏說,批亢搗虛 —— 不去邯鄲,直取大梁。',
        en: 'Besiege Wei to rescue Zhao. Sun Bin says: strike where it is hollow. Not Handan — go straight for Daliang.',
      },
      wei: {
        zh: '龐涓的主力在邯鄲城下,大梁空了。你這一生最恨的人,現在在齊國的車上。',
        en: 'Pang Juan\'s main force is under the walls of Handan and Daliang is empty. The man you hate most in the world is riding in a Qi chariot.',
      },
      zhao: {
        zh: '邯鄲被圍。齊國答應救援,但你不知道他們會不會來,更不知道他們什麼時候來。',
        en: 'Handan is invested. Qi has promised relief; you do not know whether it will come, still less when.',
      },
      qin: {
        zh: '三晉互鬥,河西可取。這是商鞅教你的:等他們自己耗。',
        en: 'The three Jin are tearing at each other and the land west of the river is there for the taking. This is what Shang Yang taught you: let them spend themselves.',
      },
      chu: {
        zh: '中原打起來了,楚國坐大。你只需要不站錯邊。',
        en: 'The central states are fighting and Chu grows. All you have to do is not pick the wrong side.',
      },
      yan: {
        zh: '與你無關。但每一次中原大戰,燕國都能安穩幾年。',
        en: 'None of it is yours. But every great war in the central plain buys Yan a few quiet years.',
      },
      han: {
        zh: '魏趙相攻,韓國暫安。暫安的意思是,下一個輪到你。',
        en: 'Wei and Zhao are at each other and Han is briefly safe. Briefly safe means you are next.',
      },
    },
  },

  'scn-ws-hangu': {
    intro: {
      zh: '五國合縱攻秦,兵至函谷關。\n\n秦地被山帶河,四塞以為固,自崤函以東,諸侯之地不敵秦之一半;然而合縱之師動輒百萬,叩關而攻。秦人開關延敵,九國之師逡巡而不敢進。\n\n蘇秦曰:「山東之建國莫強於趙,秦之所害於天下者莫如趙。然而秦不敢舉兵伐趙者,何也?畏韓魏之議其後也。」合縱之難,不在秦強,而在六國各自為謀。',
      en: 'Five states allied to attack Qin, and their armies came up to the Hangu Pass.\n\nQin is girdled by mountains and rivers and closed on four sides; east of Xiao and Han, the lands of all the lords together are not half of Qin — and yet the vertical alliance can field a million men to beat on the gate. Qin opened the pass and invited them in, and the armies of the nine states milled about and dared not enter.\n\nSu Qin said: "Of the states east of the mountains none is stronger than Zhao, and none Qin fears more. Yet Qin dares not march on Zhao — why? Because it fears Han and Wei talking behind its back." The difficulty of the alliance is not Qin\'s strength; it is that the six states each plan for themselves.',
    },
    forces: {
      qin: {
        zh: '六國合縱,聯軍壓境。函谷關是你唯一的門,也是你唯一需要的門。',
        en: 'The six states have leagued and their armies are at your door. Hangu is the only gate you have, and the only one you need.',
      },
      chu: {
        zh: '你是縱約長。名義上六國聽你的 —— 實際上他們連糧道都不肯合。',
        en: 'You are chief of the alliance. Nominally the six obey you; in practice they will not even share a supply road.',
      },
      qi: {
        zh: '齊國出兵最少,離秦國最遠。合縱對你是買賣,不是生死。',
        en: 'Qi sent the fewest men and is furthest from Qin. For you the alliance is a transaction, not a matter of life and death.',
      },
      yan: {
        zh: '燕國跟著來了。你知道自己這點兵決定不了什麼,但不來會被記住。',
        en: 'Yan came along. You know your handful of troops decides nothing — but not coming would be remembered.',
      },
      zhao: {
        zh: '趙軍是聯軍主力之一。函谷關難攻,而你身後就是秦國最想要的那條路。',
        en: 'Zhao\'s troops are among the alliance\'s best. Hangu is hard to storm — and behind you lies the road Qin wants most.',
      },
      wei: {
        zh: '魏國離秦國最近,合縱若敗,第一個挨打的是你。',
        en: 'Wei is nearest to Qin. If the alliance breaks, you are the first to be struck.',
      },
      han: {
        zh: '韓國出兵了,因為不出兵活不下去。合縱是小國唯一的活路。',
        en: 'Han sent troops because not sending them is death. The alliance is a small state\'s only road.',
      },
    },
  },

  'scn-ws-yique': {
    intro: {
      zh: '秦昭襄王十四年,白起為左更,攻韓魏於伊闕。\n\n韓魏合軍二十四萬,而各懷觀望:韓恃魏之銳,魏恃韓之堅,皆不肯先用其眾。白起以少擊眾,先以疑兵當韓陣,而潛以精銳襲魏軍。魏軍既敗,韓軍自潰。\n\n斬首二十四萬,虜其將公孫喜,拔五城。白起遷為國尉。此人一生殺人以百萬計,而未嘗一敗。',
      en: 'Bai Qi, then a Zuogeng, attacked Han and Wei at Yique.\n\nThe two armies together numbered two hundred and forty thousand, and each waited on the other: Han counted on Wei\'s keenness and Wei on Han\'s solidity, and neither would commit first. Bai Qi, with the smaller force, held the Han line with a feint and sent his best men secretly against the Wei. When the Wei broke, the Han collapsed of themselves.\n\nTwo hundred and forty thousand heads were taken, their general captured, and five cities fell. Bai Qi was promoted Commandant of the State. Over his life the men he killed are counted in the millions, and he never lost.',
    },
    forces: {
      qin: {
        zh: '白起初露鋒芒。韓魏聯軍在伊闕互相觀望 —— 兩支軍隊,沒有一個統帥。',
        en: 'Bai Qi\'s first showing. The Han and Wei armies at Yique are each waiting for the other: two armies and not one commander.',
      },
      wei: {
        zh: '你和韓軍各據一邊,誰都不肯先動。公孫喜想讓韓軍打頭陣,韓軍也這麼想。',
        en: 'You and the Han hold separate ground and neither will move first. Gongsun Xi wants Han in the van; so does Han.',
      },
      han: {
        zh: '魏軍在側,你以為有靠山。白起看見的是兩支各懷心思的軍隊。',
        en: 'With Wei alongside you think you have support. What Bai Qi sees is two armies each minding its own thoughts.',
      },
      qi: {
        zh: '秦國東出了。齊國富庶依舊,而富庶在戰國是罪。',
        en: 'Qin has come east. Qi is as rich as ever, and in this age wealth is a crime.',
      },
      chu: {
        zh: '楚懷王已入秦不返。國中無主之感,比失地更難補。',
        en: 'King Huai went into Qin and did not come back. The sense of a state without its lord is harder to mend than lost land.',
      },
      yan: {
        zh: '樂毅在你手下。你要做的是忍 —— 忍到齊國露出破綻的那一天。',
        en: 'Yue Yi serves you. What you must do is wait — until the day Qi shows its throat.',
      },
      zhao: {
        zh: '趙國的騎兵已成,但趙武靈王死於沙丘。強兵在,主心骨沒了。',
        en: 'Zhao\'s cavalry is made, but King Wuling died at Shaqiu. The army remains; the spine is gone.',
      },
    },
  },

  'scn-ws-yanying': {
    intro: {
      zh: '秦昭襄王二十八年,白起攻楚,拔鄢、鄧五城。\n\n鄢城堅守,白起乃引西山長谷水,決堤灌城,城東北角潰,城中人隨水流,死於城東者數十萬,城東皆臭,因名其陂為臭池。\n\n次年拔郢,燒夷陵,即楚先王之墓。楚頃襄王東北保於陳城。屈原聞郢都陷落,自沉汨羅。\n\n楚自此不振,而秦置南郡 —— 這是秦第一次真正把手伸進長江。',
      en: 'Bai Qi attacked Chu and took Yan, Deng, and five other cities.\n\nYan held out, so he led the water of a long valley in the western hills, breached the dyke and flooded the city. The northeast corner gave way and the people were carried out with the water; several hundred thousand died east of the wall, and the stench there gave the pool its name.\n\nThe next year he took Ying and burned Yiling, where the kings of Chu were buried. King Qingxiang fled northeast to Chen. Hearing that Ying had fallen, Qu Yuan drowned himself in the Miluo.\n\nChu never recovered, and Qin established the Nan commandery — the first time Qin\'s hand actually reached the Yangzi.',
    },
    forces: {
      qin: {
        zh: '白起南下,鄢郢在望。楚國最大,也最先被打斷脊梁。',
        en: 'Bai Qi has gone south and Yan and Ying are in sight. Chu is the largest state, and the first to have its spine broken.',
      },
      chu: {
        zh: '郢都是楚國八百年的都城。白起引水灌鄢,城中死者數十萬 —— 而你連遷都的路都要現找。',
        en: 'Ying has been the capital of Chu for eight hundred years. Bai Qi turned the river into Yan and hundreds of thousands died in the streets. You have to find the road to a new capital as you flee down it.',
      },
      qi: {
        zh: '楚國要垮了。少了這個最大的鄰居,齊國就是下一個最大的。',
        en: 'Chu is going down. With the largest neighbour gone, Qi becomes the largest.',
      },
      yan: {
        zh: '樂毅伐齊之機將至。你等了一輩子。',
        en: 'The moment for Yue Yi to march on Qi is near. You have waited your whole life.',
      },
      zhao: {
        zh: '秦國在南邊用兵,北邊就鬆了。趙國的騎兵該動了。',
        en: 'Qin is committed in the south, so the north is loose. It is time the horsemen of Zhao moved.',
      },
      wei: {
        zh: '秦楚相攻,魏國得喘一口。喘完之後呢,你沒有答案。',
        en: 'Qin and Chu are locked and Wei can breathe. What comes after the breath, you have no answer for.',
      },
      han: {
        zh: '每一次秦國打別人,韓國都覺得自己多活了一年。',
        en: 'Every time Qin strikes someone else, Han feels it has been given another year.',
      },
    },
  },

  'scn-ws-yuyu': {
    intro: {
      zh: '秦伐韓,軍於閼與。趙王問廉頗:「可救不?」對曰:「道遠險狹,難救。」問樂乘,亦如之。問趙奢,奢曰:「其道遠險狹,譬之猶兩鼠鬥於穴中,將勇者勝。」\n\n王乃令趙奢將。去邯鄲三十里而止,軍中不得以軍事諫者死。秦間來入,趙奢善食而遣之。間以報秦將,秦將大喜曰:「夫去國三十里而軍不行,乃增壘,閼與非趙地也。」\n\n趙奢既已遣秦間,卷甲而趨之,二日一夜至,令善射者去閼與五十里而軍。許歷請以軍事諫,曰:「先據北山上者勝。」趙奢許諾,即發萬人趨之。秦兵後至,爭山不得上,趙奢縱兵擊之,大破秦軍。',
      en: 'Qin invaded Han and camped at Yuyu. The King of Zhao asked Lian Po: "Can it be relieved?" — "The road is long, difficult and narrow. It cannot." He asked Yue Cheng, and got the same. He asked Zhao She, who said: "The road is long, difficult and narrow. It is like two rats fighting in a hole. The braver commander wins."\n\nSo Zhao She was given the command. He halted thirty li from Handan and made it a capital offence to offer advice on military affairs. A Qin spy came into the camp; Zhao She fed him well and sent him off. The spy reported, and the Qin commander was delighted: "Thirty li from his own capital and the army has stopped and is building works. Yuyu is not Zhao\'s ground."\n\nHaving seen the spy off, Zhao She rolled up his armour and went at speed, arriving in two days and a night, and posted archers fifty li from Yuyu. Xu Li asked leave to speak on military affairs: "Whoever takes the northern height first will win." Zhao She agreed and sent ten thousand men up it. The Qin arrived later, could not fight their way onto the hill, and Zhao She came down on them and broke them.',
    },
    forces: {
      zhao: {
        zh: '趙奢說:狹路相逢勇者勝。閼與道險而狹,秦軍不信有人敢來。',
        en: 'Zhao She said: where the road is narrow, the bold man wins. The pass at Yuyu is steep and tight, and Qin does not believe anyone will dare come.',
      },
      qin: {
        zh: '閼與孤懸,你以為趙國不會救。趙奢在邯鄲城外築壘二十八日不動 —— 然後兩日一夜奔至。',
        en: 'Yuyu hangs isolated and you assumed Zhao would not relieve it. Zhao She camped outside Handan for twenty-eight days without moving — and then covered the distance in two days and a night.',
      },
      chu: {
        zh: '秦趙相爭,楚國看戲。你已經沒有力氣做別的了。',
        en: 'Qin and Zhao are at each other and Chu watches. You have no strength left for anything else.',
      },
      qi: {
        zh: '齊國剛從樂毅之禍緩過來。這一次,誰也不想再出頭。',
        en: 'Qi has only just come back from what Yue Yi did to it. This time nobody wants to be first.',
      },
      yan: {
        zh: '樂毅已去,燕國又回到原來的樣子。',
        en: 'Yue Yi is gone and Yan is what it was before.',
      },
      wei: {
        zh: '信陵君尚在。魏國還有一個能做事的人。',
        en: 'The Lord of Xinling still lives. Wei still has one man who can do things.',
      },
      han: {
        zh: '上黨在你手裡,而上黨是秦趙都想要的。這塊地遲早要出事。',
        en: 'Shangdang is yours, and Shangdang is what both Qin and Zhao want. That land will bring trouble.',
      },
    },
  },

  'scn-ws-qimin': {
    intro: {
      zh: '齊湣王滅宋,拓地千餘里,南割楚之淮北,西侵三晉,欲以并周室為天子。與秦昭王約:秦為西帝,齊為東帝。\n\n蘇代自燕來,說湣王曰:「今秦稱西帝而天下安之,則王稱東帝而天下不之罪;秦稱之而天下惡之,王勿稱以收天下,此大資也。」齊乃去帝復為王,秦亦去帝位。\n\n然而滅宋之後,齊愈驕,而諸侯愈懼。燕昭王等這一天,已經等了二十八年。',
      en: 'King Min of Qi destroyed Song, extending his territory a thousand li, cut off Chu\'s land north of the Huai, encroached on the three Jin states, and meant to absorb the Zhou house and become Son of Heaven. He agreed with King Zhao of Qin that Qin should be Emperor of the West and Qi Emperor of the East.\n\nSu Dai came from Yan and told him: "If Qin takes the western title and the realm accepts it, then your taking the eastern title will not be held against you. If Qin takes it and the realm detests it, then decline yours and gather the realm to you — that is the greater asset." So Qi gave up the title and returned to being a king, and Qin gave it up as well.\n\nBut after Song, Qi grew prouder and the other states grew more frightened. King Zhao of Yan had been waiting twenty-eight years for this.',
    },
    forces: {
      qi: {
        zh: '你稱東帝,滅宋國,天下側目。齊湣王的威風正盛 —— 盛到六國都在算你。',
        en: 'You styled yourself Emperor of the East and swallowed Song, and the realm turned to look. King Min\'s power is at its height — high enough that all six are reckoning against you.',
      },
      yan: {
        zh: '樂毅為上將軍,五國之兵在手。二十八年的仇,今天開始算。',
        en: 'Yue Yi is Supreme General and the troops of five states are in his hand. Twenty-eight years of grievance start being settled today.',
      },
      qin: {
        zh: '讓燕國去打齊國,秦國一兵不折而得利。這是范雎之前的秦國就懂的道理。',
        en: 'Let Yan strike Qi and Qin profits without losing a man. Qin understood this even before Fan Ju.',
      },
      chu: {
        zh: '淖齒帶兵救齊,實則圖齊。楚國的算盤從來不在明面上。',
        en: 'Nao Chi marches to save Qi and means to take it. Chu\'s calculations are never made in the open.',
      },
      zhao: {
        zh: '五國伐齊,趙國有份。分肉的時候別落在後面。',
        en: 'Five states march on Qi and Zhao is one of them. Do not be last at the carving.',
      },
      wei: {
        zh: '宋國的地,魏國也想要一份。',
        en: 'Wei wants a share of Song\'s land too.',
      },
      han: {
        zh: '跟著去就是了。韓國從來沒有別的選擇。',
        en: 'Go along. Han has never had another option.',
      },
    },
  },

  'scn-ws-yueyi': {
    intro: {
      zh: '燕昭王即位,卑身厚幣以招賢者,築宮而師郭隗。於是士爭趨燕:樂毅自魏往,鄒衍自齊往,劇辛自趙往。\n\n二十八年,燕國殷富,士卒樂佚輕戰。乃以樂毅為上將軍,與秦楚三晉合謀以伐齊。齊兵敗,湣王出亡於外。樂毅獨追至臨淄,盡取齊寶財物祭器輸之燕。\n\n燕軍五歲,下齊七十餘城,皆為郡縣以屬燕,唯獨莒、即墨未服。',
      en: 'King Zhao of Yan came to the throne, humbled himself and spent lavishly to attract able men, and built a palace for Guo Wei and treated him as his teacher. So the talented flocked to Yan: Yue Yi from Wei, Zou Yan from Qi, Ju Xin from Zhao.\n\nAfter twenty-eight years Yan was rich and its soldiers were comfortable and eager for war. Yue Yi was made Senior General, and with Qin, Chu and the three Jin states he moved against Qi. The Qi army broke and King Min fled the country. Yue Yi alone pressed on to Linzi and sent the whole treasury and ritual vessels of Qi back to Yan.\n\nIn five years the Yan army took more than seventy cities of Qi and made them commanderies of Yan. Only Ju and Jimo did not submit.',
    },
    forces: {
      yan: {
        zh: '半年下齊七十餘城,只剩莒與即墨。你離滅齊只有兩座城 —— 而燕王已經老了,太子不喜歡你。',
        en: 'Seventy cities of Qi in half a year; only Ju and Jimo are left. You are two cities from ending Qi — and the king is old, and the crown prince does not like you.',
      },
      qi: {
        zh: '七十餘城盡失,王死於淖齒之手。即墨城裡推了一個管市場的小吏出來守城,他叫田單。',
        en: 'Seventy cities gone and the king dead at Nao Chi\'s hands. In Jimo they have pushed forward a minor market official to hold the walls. His name is Tian Dan.',
      },
      qin: {
        zh: '齊國要沒了。少一個大國,秦國東出就少一道門。',
        en: 'Qi is about to end. One fewer great state is one fewer gate on Qin\'s road east.',
      },
      chu: {
        zh: '淖齒殺了齊王。楚國本想救齊,結果吃了齊 —— 現在燕國要來吃楚。',
        en: 'Nao Chi killed the king of Qi. Chu came to save Qi and ate it instead — and now Yan is coming to eat Chu\'s share.',
      },
      zhao: {
        zh: '趙國在伐齊中得了地。得地容易,守地要看誰是鄰居。',
        en: 'Zhao gained land in the war on Qi. Gaining is easy; keeping depends on who the neighbour is.',
      },
      wei: {
        zh: '魏國也分了齊地。這些年魏國唯一還能做的,就是跟著大國分東西。',
        en: 'Wei took its share of Qi as well. In these years the only thing Wei can still do is follow a great state and take a share.',
      },
      han: {
        zh: '韓國分到的最少,一如既往。',
        en: 'Han\'s share was the smallest, as always.',
      },
    },
  },

  'scn-ws-changping': {
    intro: {
      zh: '秦攻韓上黨,上黨降趙。秦怒,使王齕攻趙,趙使廉頗將。廉頗堅壁不出,秦數挑戰,趙兵不出。\n\n秦相應侯使人行千金於趙為反間,曰:「秦之所惡,獨畏馬服君趙奢之子趙括為將耳。」趙王遂以括代廉頗。藺相如曰:「王以名使括,若膠柱而鼓瑟耳。括徒能讀其父書傳,不知合變也。」王不聽。\n\n括母上書言於王曰:「括不可使將。」王曰:「何以?」對曰:「始妾事其父,時為將,身所奉飯飲而進食者以十數,所友者以百數……今括一旦為將,東向而朝,軍吏無敢仰視之者,王所賜金帛,歸藏於家……父子異心,願王勿遣。」\n\n秦聞括為將,乃陰使白起為上將軍。趙括出擊,秦軍佯敗而走,張二奇兵以劫之。趙軍分而為二,糧道絕。四十六日,士卒相食。括出銳卒自搏戰,秦軍射殺之。卒四十萬人降,白起盡坑之。',
      en: 'Qin attacked Han\'s Shangdang, and Shangdang surrendered to Zhao instead. Qin, enraged, sent Wang He against Zhao, and Zhao sent Lian Po. Lian Po held his walls and would not come out; Qin offered battle repeatedly and the Zhao would not take it.\n\nThe Qin chancellor spent a thousand pieces of gold in Zhao on a rumour: "The one thing Qin dreads is that Zhao Kuo, son of the Lord of Mafu, should be given the command." So the King of Zhao replaced Lian Po with Zhao Kuo. Lin Xiangru said: "To employ Zhao Kuo on his reputation is to glue down the bridges of a zither and then play it. He can recite his father\'s books; he does not understand adapting to circumstances." The king did not listen.\n\nZhao Kuo\'s mother memorialised: "Kuo must not be given the command." — "Why?" — "When I served his father, he was a general; the men he served food to with his own hands were counted in dozens and his friends in hundreds… Now Kuo is made a general in a single day, sits facing east to receive his officers, and not one of them dares look up at him; and the gold and silk Your Majesty gives him he takes home and stores… Father and son are not of one mind. I beg you not to send him."\n\nHearing Zhao Kuo had the command, Qin secretly made Bai Qi supreme commander. Zhao Kuo attacked; the Qin feigned defeat and fell back, and two flying columns cut him off. The Zhao army was split in two and its supply road severed. For forty-six days the soldiers ate one another. Zhao Kuo led his best men out to fight in person and was shot down. Four hundred thousand surrendered, and Bai Qi buried them all.',
    },
    forces: {
      qin: {
        zh: '廉頗築壘不出,你耗不起。范雎的反間計已經送進邯鄲 —— 只要趙國換將。',
        en: 'Lian Po has dug in and will not come out, and you cannot outlast him. Fan Ju\'s whispers are already inside Handan. All that is needed is for Zhao to change generals.',
      },
      zhao: {
        zh: '廉頗堅守三年,國中糧盡。趙括說父親的兵書他都讀過 —— 而趙奢生前說過,此子不可為將。',
        en: 'Lian Po has held for three years and the granaries are empty. Zhao Kuo says he has read all his father\'s books on war — and Zhao She said before he died that this son must never be given an army.',
      },
      chu: {
        zh: '秦趙傾國相持。無論誰贏,楚國都少一個對手 —— 但贏的那個會更可怕。',
        en: 'Qin and Zhao have staked everything on each other. Whoever wins, Chu loses a rival — and gains a worse one.',
      },
      qi: {
        zh: '趙國來借糧。給,則得罪秦;不給,則趙亡而齊孤。你選了不給。',
        en: 'Zhao has come to borrow grain. Give it and offend Qin; refuse and Zhao falls and Qi stands alone. You refused.',
      },
      yan: {
        zh: '趙國若敗,燕國北面就空了。你在等,也在怕。',
        en: 'If Zhao breaks, Yan\'s southern flank opens. You are waiting, and you are afraid.',
      },
      wei: {
        zh: '長平之戰,魏國按兵不動。這一手後來讓信陵君羞愧了一輩子。',
        en: 'Wei did not move at Changping. The Lord of Xinling was ashamed of it for the rest of his life.',
      },
      han: {
        zh: '上黨是韓國的地,是韓國獻給趙國的。這場仗因你而起。',
        en: 'Shangdang was Han\'s land, and Han gave it to Zhao. This war began with you.',
      },
    },
  },

  'scn-ws-handan': {
    intro: {
      zh: '長平之後,秦圍邯鄲。趙以平原君為使,求救於楚,得毛遂自薦而定合縱;又使人請救於魏,魏王使晉鄙將十萬眾救趙,秦王使人告魏王曰:「吾攻趙旦暮且下,而諸侯敢救者,已拔趙,必移兵先擊之。」魏王恐,使人止晉鄙,留軍壁鄴,名為救趙,實持兩端。\n\n信陵君乃用侯嬴之謀,竊符矯詔,椎殺晉鄙,選兵八萬人進兵擊秦軍。秦軍解去,邯鄲得全。\n\n城中易子而食,析骨而炊,守了近三年。',
      en: 'After Changping, Qin besieged Handan. Zhao sent the Lord of Pingyuan to appeal to Chu, where Mao Sui recommended himself and secured the alliance; and sent to Wei, where the king dispatched Jin Bi with a hundred thousand men. Then the King of Qin sent word to the King of Wei: "Zhao will fall to me within days, and any lord who dares relieve it will be the first I turn on once Zhao is taken." The King of Wei took fright, halted Jin Bi and had him entrench at Ye — nominally relieving Zhao, in fact hedging.\n\nSo the Lord of Xinling took Hou Ying\'s advice, stole the tally, forged the order, had Jin Bi beaten to death, picked eighty thousand men and attacked the Qin. The Qin lifted the siege, and Handan was saved.\n\nInside, they had exchanged children to eat and split bones for fuel. The siege had lasted nearly three years.',
    },
    forces: {
      zhao: {
        zh: '長平死了四十萬,邯鄲城裡沒有壯丁了。城破在即,平原君的門客裡有一個叫毛遂的。',
        en: 'Forty thousand tens died at Changping and there are no men of age left in Handan. The wall is about to go. Among the Lord of Pingyuan\'s retainers there is one called Mao Sui.',
      },
      qin: {
        zh: '白起說邯鄲不可攻,你不聽,然後賜死了他。現在圍城已久,而諸侯的救兵在路上。',
        en: 'Bai Qi said Handan could not be taken. You did not listen, and then you had him killed. The siege has dragged, and relief columns are on the road.',
      },
      wei: {
        zh: '晉鄙帶十萬大軍駐鄴按兵不動。信陵君竊了兵符,殺了晉鄙 —— 這是他一生做過最對也最不能原諒的事。',
        en: 'Jin Bi sits at Ye with a hundred thousand and will not move. The Lord of Xinling stole the tally and had him killed: the most right and least forgivable thing he ever did.',
      },
      chu: {
        zh: '毛遂按劍上階,說楚國之強不是為趙國,是為楚國自己。你同意了。',
        en: 'Mao Sui came up the steps with his hand on his sword and said Chu\'s strength was not for Zhao\'s sake but Chu\'s own. You agreed.',
      },
      qi: {
        zh: '齊國又一次沒有動。長平時不借糧,邯鄲時不發兵 —— 這樣的國家,將來也不會有人救。',
        en: 'Once again Qi did not move: no grain at Changping, no troops at Handan. Nobody will come for a state like that either.',
      },
      yan: {
        zh: '趙國虛弱至此,燕國動了念頭。這個念頭後來讓廉頗打到了燕都城下。',
        en: 'Zhao is this weak, and Yan has had a thought. That thought later brought Lian Po to the gates of Ji.',
      },
      han: {
        zh: '韓國什麼也做不了。它一直什麼也做不了。',
        en: 'Han can do nothing. Han has never been able to do anything.',
      },
    },
  },

  'scn-ws-tiandan': {
    intro: {
      zh: '燕下齊七十餘城,唯莒、即墨不下。田單守即墨,聞燕昭王卒,惠王立,與樂毅有隙,乃縱反間曰:「樂毅與燕新王有隙,欲連兵且留齊,南面而王齊。」燕王使騎劫代樂毅。\n\n田單乃收城中得千餘牛,為絳繒衣,畫以五彩龍文,束兵刃於其角,而灌脂束葦於尾,燒其端。鑿城數十穴,夜縱牛,壯士五千人隨其後。牛尾熱,怒而奔燕軍,燕軍夜大驚。牛尾炬火光明炫燿,燕軍視之皆龍文,所觸盡死傷。\n\n齊人追亡逐北,所過城邑皆畔燕而歸田單,七十餘城盡復為齊。',
      en: 'Yan had taken more than seventy cities of Qi; only Ju and Jimo held out. Tian Dan held Jimo, and hearing that King Zhao of Yan had died and his successor was at odds with Yue Yi, he put a rumour about: "Yue Yi has fallen out with the new king and means to keep his army in Qi and rule it as king himself." The King of Yan replaced Yue Yi with Qi Jie.\n\nTian Dan then collected a thousand-odd oxen from the city, dressed them in crimson silk painted with five-coloured dragons, bound blades to their horns and greased reeds to their tails, and set the ends alight. He opened dozens of holes in the wall and loosed the oxen by night with five thousand picked men behind them. The heat maddened the beasts and they charged the Yan lines. In the dark the Yan were appalled; by the torchlight on the tails every animal looked like a dragon, and what they touched died.\n\nThe Qi ran the fugitives down, and every town they passed turned from Yan back to Tian Dan. All seventy-odd cities became Qi again.',
    },
    forces: {
      qi: {
        zh: '即墨守了五年。你用反間逼走樂毅,收千餘牛,束兵刃於角,灌脂縛葦於尾 —— 夜半縱火而出。',
        en: 'Jimo has held five years. You whispered Yue Yi out of his command, gathered a thousand oxen, bound blades to their horns and greased reeds to their tails — and loosed them burning in the dark.',
      },
      yan: {
        zh: '樂毅走了,騎劫來了。五年的圍城,毀在一次換將上。',
        en: 'Yue Yi is gone and Qi Jie has come. Five years of siege undone by one change of commander.',
      },
      qin: {
        zh: '齊國復國了。東邊又多一個對手,但也多一個牽制燕趙的人。',
        en: 'Qi has risen again. One more rival in the east — and one more weight on Yan and Zhao.',
      },
      chu: {
        zh: '齊國復國與楚無涉,但淖齒的舊帳,齊人會記著。',
        en: 'Qi\'s restoration is nothing to Chu — but the Qi will remember Nao Chi.',
      },
      zhao: {
        zh: '齊燕兩敗,趙國坐收。這幾年是趙國最好的幾年。',
        en: 'Qi and Yan have both bled and Zhao gathers what is left. These are Zhao\'s best years.',
      },
      wei: {
        zh: '天下又亂了一輪,魏國還在原地。',
        en: 'The realm has turned over once more and Wei is where it was.',
      },
      han: {
        zh: '韓國依舊。',
        en: 'Han is as it was.',
      },
    },
  },

  'scn-ws-qin-unify': {
    intro: {
      zh: '秦王政親政,李斯、尉繚為謀,遠交近攻,間諸侯之君臣。\n\n十七年滅韓,十九年滅趙,二十二年滅魏,二十四年滅楚,二十五年滅燕,二十六年滅齊。十年之間,六王畢,四海一。\n\n李牧在則趙不亡,秦以千金行反間於趙,趙王使趙蔥代之,李牧不受命,趙人捕而殺之,三月後邯鄲陷。滅趙者非秦兵,是一筆賄賂。\n\n王翦伐楚,曰非六十萬人不可;李信曰二十萬足矣。秦王以李信為輕銳,使之,大敗。乃復請王翦,傾國之兵與之。',
      en: 'The King of Qin took personal rule, with Li Si and Wei Liao to plan for him: befriend the far and attack the near, and set the lords against their own ministers.\n\nHan fell in his seventeenth year, Zhao in his nineteenth, Wei in his twenty-second, Chu in his twenty-fourth, Yan in his twenty-fifth, Qi in his twenty-sixth. In ten years the six kings ended and the realm was one.\n\nWhile Li Mu lived Zhao could not fall, so Qin spent a thousand pieces of gold on a rumour; the King of Zhao sent Zhao Cong to replace him; Li Mu refused the order and his own people seized and killed him. Handan fell three months later. What destroyed Zhao was not the Qin army but a bribe.\n\nWang Jian said the conquest of Chu would take six hundred thousand men. Li Xin said two hundred thousand would do. The king thought Li Xin bold and keen and sent him, and he was badly beaten. Then he went back to Wang Jian and gave him the strength of the whole state.',
    },
    forces: {
      qin: {
        zh: '六國只剩殘軀。你二十出頭,已經在想這片天下該叫什麼名字 —— 王不夠,得換一個字。',
        en: 'The six are husks now. You are barely past twenty and already thinking what this realm should be called. King is not enough; the word will have to change.',
      },
      chu: {
        zh: '李信說二十萬足矣,王翦說非六十萬不可。楚國還能撐多久,取決於秦王信誰。',
        en: 'Li Xin says two hundred thousand will do; Wang Jian says it cannot be done under six hundred thousand. How long Chu lasts depends on which of them the king of Qin believes.',
      },
      qi: {
        zh: '齊國四十年不修戰備。後勝收了秦國的錢,天天說秦齊交好。',
        en: 'Qi has not maintained an army in forty years. Hou Sheng has taken Qin\'s money and says daily that Qin and Qi are friends.',
      },
      yan: {
        zh: '荊軻已經上路。這是燕國最後一計,而它建立在一個人的手上。',
        en: 'Jing Ke is on the road. It is Yan\'s last stratagem, and it rests on one man\'s hand.',
      },
      zhao: {
        zh: '李牧死了。趙國最後一道牆是自己拆的。',
        en: 'Li Mu is dead. Zhao pulled down its own last wall.',
      },
      wei: {
        zh: '大梁城堅,而秦人引黃河灌之。',
        en: 'Daliang\'s walls are strong, and the Qin have turned the Yellow River onto them.',
      },
      han: {
        zh: '韓國第一個滅。你連掙紮的餘地都沒有。',
        en: 'Han falls first. There is not even room to struggle.',
      },
    },
  },

  // ── 楚漢 ─────────────────────────────────────────────────────────
  'scn-ch-daze': {
    intro: {
      zh: '二世元年七月,發閭左適戍漁陽九百人,屯大澤鄉。陳勝、吳廣皆次當行,為屯長。會天大雨,道不通,度已失期。失期,法皆斬。\n\n陳勝、吳廣乃謀曰:「今亡亦死,舉大計亦死,等死,死國可乎?」\n\n乃行卜。卜者知其指意,曰:「足下事皆成,有功。然足下卜之鬼乎!」陳勝、吳廣喜,念鬼,曰:「此教我先威眾耳。」乃丹書帛曰「陳勝王」,置人所罾魚腹中。卒買魚烹食,得魚腹中書,固以怪之矣。又間令吳廣之次所旁叢祠中,夜篝火,狐鳴呼曰:「大楚興,陳勝王!」\n\n【輿圖代換】長安=咸陽,彭城=西楚都,陳留一帶=陳,臨淄=齊,鄴=邯鄲/鉅鹿,官渡+虎牢=滎陽成皋一線。',
      en: 'Nine hundred conscripts were sent to garrison Yuyang and halted at Dazexiang. Chen Sheng and Wu Guang were among them, each in charge of a section. Then came heavy rain, the roads were impassable, and they reckoned they had already missed their date. Missing the date meant death for all of them under the law.\n\nSo Chen Sheng and Wu Guang talked it over: "To desert is death and to raise a great enterprise is death. If we must die either way, may we not die for a country?"\n\nThey consulted a diviner, who understood what they were asking and said: "All of your undertakings will succeed. But have you consulted the spirits about it?" They were pleased, and thought about the spirits, and said: "He is telling us to overawe the crowd first." So they wrote "Chen Sheng shall be king" in cinnabar on silk and put it inside a netted fish. A soldier bought the fish, cooked it, found the writing, and naturally thought it very strange. And Wu Guang went secretly by night to a shrine near the camp, lit a fire in a basket, and cried out in a fox\'s voice: "Great Chu shall rise! Chen Sheng shall be king!"\n\n[Map] Chang\'an = Xianyang, Pengcheng = the Western Chu capital, Linzi = Qi, Ye = Handan and Julu, Guandu with Hulao = the Xingyang-Chenggao line.',
    },
    forces: {
      qin: {
        zh: '六國已滅,天下一統,而戍卒在大澤鄉喊出了那句話。你是二世皇帝,身邊只有趙高告訴你四海昇平。',
        en: 'The six states are gone and the realm is one — and then conscripts at Dazexiang said the thing out loud. You are the Second Emperor, and the only man near you is Zhao Gao, telling you all is well.',
      },
      zhangchu: {
        zh: '失期當斬,反亦死。你不過是個屯長,喊出「王侯將相寧有種乎」時並沒想到有人會跟 —— 現在跟的人太多了。',
        en: 'Late is death, and rebellion is death. You were a squad leader; when you asked whether kings and nobles are born to it you did not expect anyone to follow. Too many are following now.',
      },
      chu: {
        zh: '楚雖三戶,亡秦必楚。你藏了半輩子,等的就是有人先動 —— 陳勝動了,現在輪到項氏。',
        en: 'Though but three households remain, it is Chu that will end Qin. You have hidden half your life waiting for someone else to move first. Chen Sheng moved. Now it is the turn of the Xiang.',
      },
      qi: {
        zh: '田氏是齊國宗室。復國不需要理由,只需要時機 —— 而秦的郡兵這一年第一次不夠用了。',
        en: 'The Tian are the royal house of Qi. Restoration needs no reason, only a moment — and this year, for the first time, Qin\'s garrisons are not enough.',
      },
    },
  },

  'scn-ch-julu': {
    intro: {
      zh: '章邯已破陳勝,殺項梁,乃渡河擊趙,大破之,圍鉅鹿。楚懷王以宋義為上將軍,項羽為次將,救趙。\n\n宋義行至安陽,留四十六日不進。項羽曰:「今歲饑民貧,士卒食芋菽,軍無見糧,乃飲酒高會,不引兵渡河因趙食,與趙并力攻秦,乃曰『承其敝』。夫以秦之彊,攻新造之趙,其勢必舉趙。趙舉而秦彊,何敝之承!」晨朝上將軍宋義,即其帳中斬宋義頭。\n\n乃悉引兵渡河,皆沉船,破釜甑,燒廬舍,持三日糧,以示士卒必死,無一還心。於是至則圍王離,與秦軍遇,九戰,絕其甬道,大破之。\n\n當是時,楚兵冠諸侯。諸侯軍救鉅鹿下者十餘壁,莫敢縱兵。及楚擊秦,諸將皆從壁上觀。楚戰士無不一以當十,呼聲動天,諸侯軍無不人人惴恐。於是已破秦軍,項羽召見諸侯將,入轅門,無不膝行而前,莫敢仰視。',
      en: 'Zhang Han had broken Chen Sheng and killed Xiang Liang; he crossed the river against Zhao, shattered it, and besieged Julu. King Huai of Chu made Song Yi supreme commander and Xiang Yu his second, to relieve Zhao.\n\nSong Yi got as far as Anyang and stopped there for forty-six days. Xiang Yu said: "The harvest has failed and the people are poor; the men are eating taro and beans and the army has no visible grain — and he holds drinking parties instead of crossing the river to feed off Zhao and join them against Qin. He talks of "taking them at a disadvantage." Qin is strong and Zhao is newly established; Qin will certainly take Zhao. And with Zhao taken Qin is stronger still. What disadvantage is there to take?" At the morning audience he cut off Song Yi\'s head in his own tent.\n\nThen he took the whole army across, sank the boats, broke the cauldrons and steamers, burned the huts, and issued three days\' rations, to show the men they would die there and none would be coming back. Arriving, he shut in Wang Li, met the Qin army, fought nine engagements, cut their walled supply road, and destroyed them.\n\nIn that hour the Chu soldiers outmatched every army of the lords. Ten and more allied camps sat below Julu and not one dared loose its troops. When Chu struck, they all watched from behind their palisades. Not a Chu soldier who was not the match of ten, and their shouting shook the sky, and there was not a man in the allied camps who was not terrified. And when the Qin army was broken and Xiang Yu summoned the allied generals, they came in at the gate of his camp on their knees, and none dared look up.',
    },
    forces: {
      qin: {
        zh: '你是刑徒軍的統帥,靠一群囚犯打贏了陳勝、項梁。現在鉅鹿城下,你要面對的是項梁的侄子,和一支沒有退路的軍隊。',
        en: 'You command an army of convicts and with it you beat Chen Sheng and Xiang Liang. Now, before Julu, you face Xiang Liang\'s nephew — and an army with nowhere to retreat to.',
      },
      chu: {
        zh: '叔父死了。你渡河之後鑿沉船隻、砸破鍋灶、燒掉營帳,只帶三日之糧 —— 諸侯在壁上看著,他們會看見什麼,今天決定。',
        en: 'Your uncle is dead. You crossed the river, sank the boats, smashed the cauldrons, burned the huts, and carry three days\' rations. The other lords are watching from their walls. What they see is decided today.',
      },
      zhao: {
        zh: '鉅鹿被圍,城中糧盡。諸侯的兵就在壁壘之外,沒有一支敢動 —— 你能做的只有守住,再守一天。',
        en: 'Julu is invested and the granaries are empty. The allied armies are just outside their own palisades and not one of them will move. All you can do is hold, and hold one day longer.',
      },
      qi: {
        zh: '齊地初復,你不願把子弟送去替趙國死。這個算盤打得很精 —— 精到後來的人都記得。',
        en: 'Qi has only just been restored and you will not send your sons to die for Zhao. It is a shrewd calculation — shrewd enough that everyone afterwards remembered it.',
      },
      wei: {
        zh: '魏國只剩一座城。你這個魏王是別人立的,能不能活到明年,取決於鉅鹿城下誰贏。',
        en: 'One city is all that is left of Wei. Someone else made you king, and whether you see next year depends on who wins under the walls of Julu.',
      },
    },
  },

  'scn-ch-chuhan': {
    intro: {
      zh: '項羽既定天下,自立為西楚霸王,分封諸侯十八王。徙劉邦為漢王,王巴、蜀、漢中,都南鄭 —— 巴蜀道險,秦之遷人皆居蜀,這是流放。\n\n漢王之國,張良送至褒中,勸燒絕所過棧道,以備諸侯盜兵,亦示項羽無東意。\n\n蕭何薦韓信,拜為大將軍。信問:「大王自料勇悍仁彊孰與項王?」漢王默然良久,曰:「不如也。」信曰:「惟信亦為大王不如也。然臣嘗事之,請言項王之為人也……項王喑噁叱咤,千人皆廢,然不能任屬賢將,此特匹夫之勇耳。項王見人恭敬慈愛,言語嘔嘔,人有疾病,涕泣分食飲,至使人有功當封爵者,印刓敝,忍不能予,此所謂婦人之仁也。」',
      en: 'Having settled the realm, Xiang Yu made himself Hegemon-King of Western Chu and invested eighteen kings. Liu Bang he transferred to be King of Han over Ba, Shu and Hanzhong, with his capital at Nanzheng — the Shu roads are difficult and Qin sent its exiles there. It was banishment.\n\nZhang Liang escorted the King of Han as far as Baozhong and advised him to burn the plank roads behind him, both against pursuit and to show Xiang Yu he had no thought of coming east.\n\nXiao He recommended Han Xin, who was made supreme commander. Han Xin asked: "How does Your Majesty judge yourself against the King of Chu in courage, ferocity, benevolence and strength?" The King of Han was silent a long while. "I am not his equal." — "Neither, in my judgement, are you. But I served him, and let me tell you what sort of man he is… When Xiang Yu roars, a thousand men fall back; but he cannot delegate to able generals, so it is the courage of one man. He is courteous and kind to those he meets, gentle in speech, and when a man is ill he weeps and shares his own food with him — yet when a man has earned a fief, he turns the seal over in his hand until its corners wear smooth and cannot bring himself to hand it across. That is a woman\'s kindness."',
    },
    forces: {
      chu: {
        zh: '你分封了十八路諸侯,自號西楚霸王。分封的時候你以為天下就此安定 —— 而漢中那個人,你連提防都懶得。',
        en: 'You parcelled the realm among eighteen lords and styled yourself Hegemon-King of Western Chu. You thought that settled it. The man you sent to Hanzhong was not even worth guarding against.',
      },
      han: {
        zh: '巴蜀漢中,是流放。你燒了棧道向天下表明無意東歸 —— 現在韓信說,可以走陳倉。',
        en: 'Ba, Shu and Hanzhong: an exile. You burned the plank roads to show the realm you would not come back east. Now Han Xin says there is a way through Chencang.',
      },
      yong: {
        zh: '你降了項羽,他讓你替他看住漢中那個人。秦人恨你 —— 二十萬子弟死在新安,是你帶去的。',
        en: 'You surrendered to Xiang Yu and he set you to watch the man in Hanzhong. The people of Qin hate you: two hundred thousand of their sons died at Xin\'an, and you led them there.',
      },
      qi: {
        zh: '項羽分封時把齊地拆成三份,沒有你的名字。你反了 —— 這是他霸業上的第一道裂縫。',
        en: 'When Xiang Yu divided the realm he cut Qi into three and your name was on none of them. You revolted. It is the first crack in his hegemony.',
      },
      zhao: {
        zh: '你和張耳曾是刎頸之交,現在是死敵。趙國在你手裡,而井陘口那條路太窄了。',
        en: 'You and Zhang Er once swore to die for one another; now you are mortal enemies. Zhao is yours — and the road through Jingxing is very narrow.',
      },
      wei: {
        zh: '你在漢楚之間反覆過一次,以後還會再反覆。西魏是塊夾在中間的地,而夾在中間的人沒有第三條路。',
        en: 'You have already switched between Han and Chu once, and you will again. Western Wei is caught in the middle, and men caught in the middle have no third road.',
      },
      jiujiang: {
        zh: '你是項羽最能打的部將,現在他要你出兵,你稱病不去。這一步走出去,就回不了頭了。',
        en: 'You are Xiang Yu\'s hardest-hitting general, and when he called for your troops you pleaded illness. Take that step and there is no walking it back.',
      },
    },
  },

  'scn-ch-sanqin': {
    intro: {
      zh: '漢元年八月,漢王用韓信之計,從故道還,襲雍王章邯。邯迎擊漢陳倉,雍兵敗,還走;止戰好畤,又復敗,走廢丘。\n\n漢王遂定雍地,東至咸陽,引兵圍雍王廢丘,而遣諸將略定隴西、北地、上郡。\n\n燒絕的棧道是給項羽看的。真正的路一直在陳倉。',
      en: 'The King of Han took Han Xin\'s advice, came back by the old road, and struck at Zhang Han, King of Yong. Zhang Han met him at Chencang, was beaten and fell back; he stood again at Haozhi, was beaten again, and fled to Feiqiu.\n\nThe King of Han settled the Yong lands, reached Xianyang in the east, left troops to invest Feiqiu, and sent his generals to take Longxi, Beidi and Shang commandery.\n\nThe burnt plank roads were for Xiang Yu to look at. The real road was always Chencang.',
    },
    forces: {
      chu: {
        zh: '齊地在反,你親自去打。西邊那條被燒斷的棧道,你一次都沒回頭看過。',
        en: 'Qi is in revolt and you have gone to deal with it yourself. Not once have you looked back at the burnt plank road in the west.',
      },
      han: {
        zh: '明修棧道,暗度陳倉。三秦的兵都盯著棧道,而韓信的前鋒已經出了故道 —— 這一刻之後,你不再是漢中王。',
        en: 'Repair the plank roads in plain sight; cross at Chencang in the dark. The Three Qin are watching the roadworks while Han Xin\'s van is already through the old pass. After this moment you are no longer merely King of Hanzhong.',
      },
      yong: {
        zh: '你守著關中的門。棧道還沒修好,你以為還有半年 —— 陳倉的急報是今天早上到的。',
        en: 'You hold the gate of Guanzhong. The plank road is far from finished and you reckoned on half a year. The dispatch from Chencang came in this morning.',
      },
      qi: {
        zh: '項羽的主力在你這裡。你未必打得贏,但只要拖住他,西邊那個人就有時間。',
        en: 'Xiang Yu\'s main force is here, on you. You may not beat him, but every day you hold him is a day for the man in the west.',
      },
      zhao: {
        zh: '中原打成一團,趙國暫時安穩。你和張耳的舊怨還沒了結,而他現在替漢王做事。',
        en: 'The central plain is a tangle and Zhao is quiet for now. Your feud with Zhang Er is unfinished, and he serves the King of Han these days.',
      },
      wei: {
        zh: '漢王出關了。你在河東,兩邊都夠得著你 —— 這一次要押得比上一次準。',
        en: 'The King of Han is out of the passes. You are in Hedong, within reach of both. This time the bet had better be the right one.',
      },
      jiujiang: {
        zh: '你按兵不動。項羽記仇,漢王在拉攏 —— 九江這塊地方,遲早要選。',
        en: 'You have kept your troops at home. Xiang Yu does not forget, and the King of Han is courting you. Jiujiang will have to choose eventually.',
      },
    },
  },

  'scn-ch-pengcheng': {
    intro: {
      zh: '漢二年,漢王劫五諸侯兵,凡五十六萬人,東伐楚。至彭城,收其貨寶美人,日置酒高會。\n\n項王聞之,令諸將擊齊,而自以精兵三萬人南從魯出胡陵,至蕭,晨擊漢軍而東,至彭城,日中,大破漢軍。漢軍皆走,相隨入穀、泗水,殺漢卒十餘萬人。漢卒皆南走山,楚又追擊至靈壁東睢水上。漢軍卻,為楚所擠,多殺,漢卒十餘萬人皆入睢水,睢水為之不流。\n\n圍漢王三匝。於是大風從西北而起,折木發屋,揚沙石,窈冥晝晦,逢迎楚軍。楚軍大亂,壞散,而漢王乃得與數十騎遁去。',
      en: 'The King of Han gathered the armies of five lords — five hundred and sixty thousand men — and marched east against Chu. Reaching Pengcheng, he took its treasure and its women and held banquets every day.\n\nHearing of it, Xiang Yu ordered his generals to continue against Qi and himself took thirty thousand picked men south from Lu by way of Huling, reached Xiao, struck the Han army at dawn and drove east, and by midday at Pengcheng had broken it utterly. The Han fled and were pushed into the Gu and Si rivers, and a hundred thousand were killed. They ran south into the hills and Chu pursued them to the Sui River east of Lingbi. The Han fell back, were crowded together by the Chu and cut down in numbers, and a hundred thousand more went into the Sui, and the Sui would not flow.\n\nThey ringed the King of Han three deep. Then a great wind came out of the northwest, snapping trees and stripping roofs and driving sand and stones, and the day went black, and it blew straight into the faces of the Chu. Their ranks broke apart in the confusion, and the King of Han got away with a few dozen horsemen.',
    },
    forces: {
      chu: {
        zh: '彭城丟了。五十六萬諸侯聯軍占了你的都城,而你手上只有三萬騎 —— 從齊地南下,晨襲。',
        en: 'Pengcheng has fallen. Five hundred and sixty thousand allied troops hold your capital and you have thirty thousand horse. Come down from Qi and strike at dawn.',
      },
      han: {
        zh: '你進了彭城,收了項羽的府庫美人,日日置酒。五十六萬人,沒有一個在放哨。',
        en: 'You are inside Pengcheng, you have taken Xiang Yu\'s treasury and his women, and you drink every day. Five hundred and sixty thousand men, and not one of them on watch.',
      },
      yong: {
        zh: '漢王東進,你已經敗了。廢丘還在守,水已經淹到城下。',
        en: 'The King of Han has gone east; you are already beaten. Feiqiu still holds, and the floodwater is at the wall.',
      },
      qi: {
        zh: '楚軍主力被你拖在齊地,而彭城空了。這筆帳算得漂亮 —— 只是項羽回身極快。',
        en: 'You pinned Chu\'s main force in Qi and Pengcheng emptied. A beautiful piece of arithmetic — except that Xiang Yu turns very fast.',
      },
      zhao: {
        zh: '諸侯都去了彭城,你沒去。等消息傳回來,你會慶幸這個決定。',
        en: 'Every lord went to Pengcheng; you did not. When the news comes back you will be glad of it.',
      },
      wei: {
        zh: '你跟著漢王進了彭城。分贓的時候你在,潰散的時候你也會在。',
        en: 'You went into Pengcheng with the King of Han. You were there for the division of spoils and you will be there for the rout.',
      },
      jiujiang: {
        zh: '項羽召你出兵,你又沒去。彭城若敗,他第一個要算的就是你。',
        en: 'Xiang Yu summoned your troops and again you did not come. If Pengcheng falls, you are the first name on his list.',
      },
    },
  },

  'scn-ch-jingxing': {
    intro: {
      zh: '韓信、張耳以兵數萬,東下井陘擊趙。趙王、成安君陳餘聚兵井陘口,號稱二十萬。\n\n廣武君李左車說成安君曰:「井陘之道,車不得方軌,騎不得成列,行數百里,其勢糧食必在其後。願足下假臣奇兵三萬人,從間道絕其輜重;足下深溝高壘,堅營勿與戰。彼前不得鬥,退不得還,野無所掠,不至十日,而兩將之頭可致於麾下。」成安君儒者也,常稱義兵不用詐謀奇計,不聽。\n\n韓信使人間視,知其不用,乃夜半傳發,選輕騎二千人,人持一赤幟,從間道萆山而望趙軍,誡曰:「趙見我走,必空壁逐我,若疾入趙壁,拔趙幟,立漢赤幟。」\n\n乃使萬人先行,出,背水陣。趙軍望見而大笑。',
      en: 'Han Xin and Zhang Er took some tens of thousands east through the Jingxing defile against Zhao. The King of Zhao and Chen Yu massed at the mouth of the pass, calling it two hundred thousand.\n\nLi Zuoche advised Chen Yu: "The Jingxing road will not take two carts abreast nor cavalry in line, and after a march of several hundred li their supply must be strung out behind. Give me thirty thousand men on a flanking road and I shall cut their baggage off; you dig deep, build high, hold your camp and refuse battle. Unable to fight in front or withdraw behind, with nothing to forage in open country, in under ten days I shall lay both their heads before you." Chen Yu was a scholar and was fond of saying that a righteous army does not use deception or unorthodox schemes, and he refused.\n\nHan Xin sent scouts, learned the plan had been rejected, and moved at midnight. He picked two thousand light horse, each with a red banner, sent them by a hidden path to lie in the hills overlooking the Zhao camp, and told them: "When Zhao sees us run they will empty their works to chase us. Ride hard into the camp, pull down the Zhao banners and set up the red banners of Han."\n\nThen he sent ten thousand men out ahead to form up with the river at their backs. The Zhao looked at it and laughed out loud.',
    },
    forces: {
      chu: {
        zh: '韓信北上了。你抽不出兵去救趙,只能指望陳餘的二十萬守得住那條窄道。',
        en: 'Han Xin has gone north. You cannot spare troops for Zhao and must hope Chen Yu\'s two hundred thousand can hold that narrow road.',
      },
      han: {
        zh: '三萬新兵,對二十萬。韓信要你信他一次:背水列陣,置之死地。',
        en: 'Thirty thousand raw troops against two hundred thousand. Han Xin asks you to trust him once: form up with the river at your back, and leave the men no ground to live on.',
      },
      yong: {
        zh: '關中已定,你只是史書上的一個註腳了。',
        en: 'Guanzhong is settled. You are a footnote now.',
      },
      qi: {
        zh: '趙國要完了。下一個就是齊 —— 你比誰都清楚,卻誰也不肯信。',
        en: 'Zhao is finished. Qi is next, and you know it better than anyone — and nobody will believe you.',
      },
      zhao: {
        zh: '李左車說,派奇兵斷其糧道,不出十日韓信可擒。你說,義兵不用詐謀。',
        en: 'Li Zuoche says: send a flying column to cut their supply and Han Xin is taken within ten days. You said a righteous army does not stoop to trickery.',
      },
      jiujiang: {
        zh: '你已經投了漢。項羽的舊部裡,只剩你還有兵。',
        en: 'You have gone over to Han. Of Xiang Yu\'s old commanders you are the only one who still has an army.',
      },
    },
  },

  'scn-ch-weishui': {
    intro: {
      zh: '漢遣酈食其說齊,齊王田廣以為然,乃罷歷下守戰備,與酈生日縱酒。韓信引兵東,未渡平原,聞酈食其已說下齊,欲止。范陽辯士蒯通說信曰:「將軍受詔擊齊,而漢獨發間使下齊,寧有詔止將軍乎?何以得毋行也!」\n\n信然之,遂渡河襲齊。齊王以酈生賣己,乃烹之。\n\n楚使龍且將兵二十萬救齊。或說龍且曰:「漢兵遠鬥窮戰,其鋒不可當。齊、楚自居其地戰,兵易敗散。不如深壁,令齊王使其信臣招所亡城,城聞其王在,楚來救,必反漢。」龍且曰:「吾平生知韓信為人,易與耳……今若此,成安君之為人也。」\n\n遂戰。信夜令人為萬餘囊,滿盛沙,壅水上流,引軍半渡,擊龍且,佯不勝,還走。龍且果喜曰:「固知信怯也。」遂追。信使人決壅囊,水大至,龍且軍太半不得渡,即急擊,殺龍且。',
      en: 'Han sent Li Yiji to talk Qi over, and King Tian Guang agreed, stood down the defences at Lixia, and spent his days drinking with the envoy. Han Xin, marching east, heard before he had crossed at Pingyuan that Qi had already come over, and thought to stop. The persuader Kuai Tong told him: "You were ordered to attack Qi, and Han has separately sent an envoy to talk it down — but was there an order stopping you? How can you not go on?"\n\nHan Xin agreed, crossed, and fell on Qi. The King of Qi, believing Li Yiji had sold him, boiled him alive.\n\nChu sent Long Ju with two hundred thousand to save Qi. Someone advised him: "The Han troops are far from home and fight desperately; their edge cannot be met. Qi and Chu are fighting on their own ground, where armies come apart easily. Better to dig in, and let the King of Qi send trusted men to call back the cities he has lost — hearing their king is alive and that Chu has come to help, they will turn against Han." Long Ju said: "I have known Han Xin all my life. He is easily handled… Do that, and I am no better than Chen Yu."\n\nSo he gave battle. By night Han Xin had over ten thousand bags filled with sand and dammed the river upstream, took his army half across, attacked Long Ju, pretended to fail and ran. Long Ju was delighted: "I always knew Han Xin was a coward." He pursued. Han Xin had the bags cut open, the water came down in a wall, and over half of Long Ju\'s army could not cross — and he struck at once, and killed him.',
    },
    forces: {
      chu: {
        zh: '龍且帶著二十萬去救齊。你在滎陽和漢王對峙,分不出身 —— 而濰水那邊,韓信在上游築壩。',
        en: 'Long Ju has gone with two hundred thousand to relieve Qi. You are locked with the King of Han at Xingyang and cannot get free — and upstream on the Wei, Han Xin is damming the river.',
      },
      han: {
        zh: '韓信在齊地已經勢不可擋。你需要他的勝利,也開始害怕他的勝利。',
        en: 'Han Xin is unstoppable in Qi. You need his victories, and you have begun to be afraid of them.',
      },
      qi: {
        zh: '酈食其已經說降了你,漢軍卻仍然渡河。你把說客烹了 —— 然後發現自己既失了盟友,也失了齊國。',
        en: 'Li Yiji had already talked you into surrender, and the Han army crossed anyway. You boiled the envoy — and then found you had lost both the ally and Qi.',
      },
    },
  },

  'scn-ch-gaixia': {
    intro: {
      zh: '項王軍壁垓下,兵少食盡,漢軍及諸侯兵圍之數重。夜聞漢軍四面皆楚歌,項王乃大驚曰:「漢皆已得楚乎?是何楚人之多也!」\n\n項王則夜起,飲帳中。有美人名虞,常幸從;駿馬名騅,常騎之。於是項王乃悲歌慷慨,自為詩曰:「力拔山兮氣蓋世,時不利兮騅不逝。騅不逝兮可奈何,虞兮虞兮奈若何!」歌數闋,美人和之。項王泣數行下,左右皆泣,莫能仰視。\n\n於是項王乃上馬騎,麾下壯士騎從者八百餘人,直夜潰圍南出,馳走。\n\n至烏江,亭長檥船待,曰:「江東雖小,地方千里,眾數十萬人,亦足王也。願大王急渡。」項王笑曰:「天之亡我,我何渡為!且籍與江東子弟八千人渡江而西,今無一人還,縱江東父兄憐而王我,我何面目見之?」',
      en: 'Xiang Yu\'s army was walled in at Gaixia, few in number and out of food, ringed several deep by the Han and their allies. In the night he heard Chu songs coming from every side of the Han camp, and was appalled: "Have they taken all of Chu already? How can there be so many men of Chu over there?"\n\nHe rose in the night and drank in his tent. He had a lady named Yu who always accompanied him, and a fine horse named Zhui that he always rode. So he sang, bitterly and grandly, a poem of his own: "My strength uprooted mountains, my spirit overshadowed the age — the times are against me and Zhui will not run. Zhui will not run, and what is to be done? Yu, my Yu, what is to become of you?" He sang it several times over and the lady sang with him. Tears ran down his face, and his attendants wept, and none of them could look up.\n\nThen he mounted, and with eight hundred and more of his best riders behind him broke out southward through the lines in the dark and rode.\n\nAt the Wu River the village head had a boat waiting: "Jiangdong is small, but a thousand li across with several hundred thousand people — enough to be a king in. Cross quickly, my lord." Xiang Yu laughed: "Heaven is destroying me. What should I cross for? Besides, I took eight thousand sons of Jiangdong west across this river, and not one has come back. Even if their fathers and brothers pitied me and made me king, with what face would I meet them?"',
    },
    forces: {
      chu: {
        zh: '四面楚歌。八千子弟渡江而西,如今無一人隨你 —— 只剩虞姬,和一匹不肯走的馬。',
        en: 'Chu songs on every side. Eight thousand sons of Jiangdong crossed the river with you and not one is left — only Yu, and a horse that will not leave.',
      },
      han: {
        zh: '韓信、彭越、英布都到了。四十萬圍十萬,這一仗你不會輸 —— 你唯一要想的是,贏了之後這三個人怎麼辦。',
        en: 'Han Xin, Peng Yue and Ying Bu have all come. Four hundred thousand around one hundred thousand: you will not lose this. The only thing left to think about is what to do with those three afterwards.',
      },
    },
  },

  // ── 隋唐 ─────────────────────────────────────────────────────────
  'scn-st-suiend': {
    intro: {
      zh: '隋大業末,三征高麗,開運河,築東都,天下死於役而家傷於財。群盜蜂起,竇建德於河北,李密據瓦崗,杜伏威在江淮,薛舉起隴西,劉武周連突厥,王世充守洛陽。\n\n太原留守李淵父子起兵,西入關中 —— 這是所有人裡走得最穩的一步:先取長安,據險自固,再東出爭天下。\n\n【輿圖代換】長安=唐都,洛陽=王世充之鄭,鄴=竇建德之夏,太原=李氏根本,虎牢=虎牢,天水安定=薛舉隴西,建業壽春=杜伏威江淮。',
      en: 'At the end of the Sui: three invasions of Koguryo, the Grand Canal, the eastern capital — the realm died in the corvée and its households were ruined paying for it. Bandit armies rose everywhere. Dou Jiande in Hebei, Li Mi with the Wagang bands, Du Fuwei in the Jianghuai, Xue Ju in Longxi, Liu Wuzhou allied to the Turks, Wang Shichong holding Luoyang.\n\nThe garrison commander of Taiyuan, Li Yuan, rose with his sons and went west into Guanzhong — the steadiest move anyone made: take Chang\'an first, secure the passes, and only then come east to contend for the realm.\n\n[Map] Chang\'an = the Tang capital, Luoyang = Wang Shichong\'s Zheng, Ye = Dou Jiande\'s Xia, Taiyuan = the Li clan\'s base, Hulao is itself, Tianshui and Anding = Xue Ju\'s Longxi, Jianye and Shouchun = Du Fuwei\'s Jianghuai.',
    },
    forces: {
      tang: {
        zh: '晉陽起兵,你已經五十二歲。世民催得急,建成守得穩 —— 而你要的是關中,不是天下第一個稱帝的名頭。',
        en: 'You raised troops at Jinyang at fifty-two. Shimin pushes hard and Jiancheng holds steady. What you want is Guanzhong, not the distinction of being first to take the title.',
      },
      wagang: {
        zh: '瓦崗軍是天下最大的一支。你殺了翟讓才坐穩這個位子 —— 從那天起,舊部看你的眼神就變了。',
        en: 'Wagang is the largest force in the realm. You had to kill Zhai Rang to sit securely at its head, and since that day the old hands have looked at you differently.',
      },
      zheng: {
        zh: '洛陽在你手裡,越王在你手裡。你是最會投機的那一個,而投機的人沒有根。',
        en: 'Luoyang is yours and so is the Prince of Yue. You are the best opportunist of them all, and opportunists have no roots.',
      },
      xia: {
        zh: '竇建德得河北人心。你分財於眾,不修宮室 —— 這樣的人本該贏,可惜對手裡有一個李世民。',
        en: 'Dou Jiande has the hearts of Hebei. You share out the spoils and build no palaces. A man like that ought to win — but one of the others is Li Shimin.',
      },
      xiqin: {
        zh: '薛舉據隴西,兵鋒最銳。你離長安最近,而長安剛剛換了主人。',
        en: 'Xue Ju holds Longxi and his troops are the sharpest in the field. You are nearest to Chang\'an, and Chang\'an has just changed hands.',
      },
      dingyang: {
        zh: '劉武周北連突厥,南下太原。晉陽是李淵起兵之地 —— 拿下它,唐就斷了根。',
        en: 'Liu Wuzhou is joined to the Turks in the north and comes down on Taiyuan. Jinyang is where Li Yuan raised his banner; take it and Tang is cut off at the root.',
      },
      wu: {
        zh: '江淮之間是你的。北面群雄相殺,你只要不北上,就沒人顧得上你。',
        en: 'The land between the Jiang and the Huai is yours. The heroes in the north are killing each other; as long as you do not go north, nobody has time for you.',
      },
    },
  },

  'scn-st-qianshui': {
    intro: {
      zh: '薛舉據隴西,兵鋒直指長安。淺水原初戰,李世民病臥軍中,劉文靜等出戰大敗,士卒死者十五六。\n\n薛舉將乘勝取長安,會薛舉病卒,子薛仁杲立。李世民再至,堅壁不出六十餘日,待其糧盡兵散,一戰而破之。\n\n這一戰教會他一件事:不急。他後來每一次大勝 —— 柏壁、虎牢 —— 用的都是同一招。',
      en: 'Xue Ju held Longxi and his spearhead pointed straight at Chang\'an. At the first battle of Qianshuiyuan, Li Shimin lay ill in camp; Liu Wenjing and the others gave battle and were badly beaten, with more than half the men lost.\n\nXue Ju was about to take Chang\'an on the momentum of it when he died of illness, and his son succeeded him. Li Shimin came back, held his works for over sixty days until their grain failed and their army scattered, and broke them in one action.\n\nThat battle taught him one thing: do not hurry. Every great victory he wins afterwards — Bobi, Hulao — is the same move.',
    },
    forces: {
      xiqin: {
        zh: '薛舉大破唐軍於淺水原,長安震動。你正要東進 —— 然後病倒了。',
        en: 'Xue Ju broke the Tang army at Qianshuiyuan and Chang\'an shook. You were about to press east — and then you fell ill.',
      },
      tang: {
        zh: '淺水原敗了,八位總管盡沒。世民病中,劉文靜不聽將令擅自出戰 —— 這一課很貴。',
        en: 'Qianshuiyuan was lost and eight commanders with it. Shimin was ill and Liu Wenjing gave battle against orders. An expensive lesson.',
      },
      wagang: {
        zh: '李密與王世充在洛陽相持。你贏了很多次,但每一次都更弱一點。',
        en: 'Li Mi and Wang Shichong grind on at Luoyang. You have won many times, and each win has left you weaker.',
      },
      zheng: {
        zh: '洛陽糧盡,而瓦崗有倉。你缺的是一次決戰。',
        en: 'Luoyang is out of grain and Wagang has the granaries. What you need is one decisive battle.',
      },
      xia: {
        zh: '河北安定,你在等中原分出勝負。',
        en: 'Hebei is settled and you are waiting for the central plain to decide.',
      },
      dingyang: {
        zh: '突厥給了你馬。南下的路是通的。',
        en: 'The Turks have given you horses and the road south is open.',
      },
      wu: {
        zh: '江淮無事。無事就是你的策略。',
        en: 'Nothing is happening on the Huai. That is the policy.',
      },
    },
  },

  'scn-st-bobi': {
    intro: {
      zh: '劉武周連突厥南下,宋金剛取太原、晉州,李元吉棄并州而走,唐之根本之地一夕而失。朝議欲棄河東以守關西。\n\n李世民上表:「太原王業所基,國之根本;河東殷實,京邑所資。若舉而棄之,臣竊憤恨。願假精兵三萬,必能平殄武周,克復汾晉。」\n\n乃屯柏壁,堅壁不戰,相持數月。宋金剛糧盡北走,世民追之,一日八戰,晝夜二百餘里,不解甲者三日。',
      en: 'Liu Wuzhou came south with Turkic support; Song Jin\'gang took Taiyuan and Jinzhou; Li Yuanji abandoned Bing province and fled, and the Li clan\'s home ground was lost in a night. The court discussed giving up Hedong and holding the west.\n\nLi Shimin memorialised: "Taiyuan is the foundation of the dynasty and the root of the state; Hedong is rich and supplies the capital. To pick it up and throw it away — I confess I cannot bear it. Give me thirty thousand good troops and I shall destroy Liu Wuzhou and take back Fen and Jin."\n\nHe camped at Bobi and refused battle for months. When Song Jin\'gang\'s grain failed and he went north, Li Shimin followed: eight actions in one day, two hundred li through a day and a night, and three days without taking his armour off.',
    },
    forces: {
      tang: {
        zh: '劉武周奪了太原,河東盡失。滿朝主張棄河東守關中,只有世民說:太原是王業所基,不可棄。',
        en: 'Liu Wuzhou has taken Taiyuan and Hedong is gone. The whole court says abandon it and hold Guanzhong. Only Shimin says Taiyuan is the foundation of the house and cannot be given up.',
      },
      dingyang: {
        zh: '宋金剛連下數州,勢如破竹。柏壁那邊唐軍堅壁不出 —— 你的糧道有多長,自己算過嗎。',
        en: 'Song Jingang has taken prefecture after prefecture. The Tang at Bobi sit behind their walls and will not come out. Have you measured how long your supply line has become?',
      },
      wagang: {
        zh: '瓦崗已散,你的舊部四散投人。',
        en: 'Wagang is scattered and your old hands have gone to other men.',
      },
      zheng: {
        zh: '唐軍陷在河東,洛陽得以喘息。這口氣要用來做什麼,你得快點想。',
        en: 'The Tang are stuck in Hedong and Luoyang can breathe. You had better decide quickly what to do with the breath.',
      },
      xia: {
        zh: '坐觀唐與劉武周相攻。誰贏了,誰就是你的下一個對手。',
        en: 'Watch Tang and Liu Wuzhou tear at each other. Whoever wins is your next opponent.',
      },
      xiqin: {
        zh: '薛仁杲已降,西秦名存實亡。',
        en: 'Xue Rengao has surrendered; Western Qin exists in name only.',
      },
      wu: {
        zh: '江淮依舊。',
        en: 'The Huai is as it was.',
      },
    },
  },

  'scn-st-hulao': {
    intro: {
      zh: '李世民圍王世充於洛陽,竇建德率十萬眾來救。諸將皆言腹背受敵,請退保新安。\n\n世民曰:「世充兵疲食盡,上下離心,不煩力攻,可以坐克。建德新破海公,將驕卒惰,吾據武牢,扼其咽喉。彼若冒險爭鋒,取之甚易;若狐疑不戰,旬月之間,世充自潰。」\n\n乃留兵圍洛陽,自以三千五百人東據虎牢。相持二十餘日,建德列陣二十里,自辰至午,士卒饑倦,皆坐列,又爭飲水。世民曰:「可擊矣。」\n\n一戰擒建德,王世充舉洛陽降。一戰而定兩國。',
      en: 'Li Shimin was besieging Wang Shichong in Luoyang when Dou Jiande came to relieve him with a hundred thousand men. His officers all said they would be caught front and rear and asked to fall back on Xin\'an.\n\nHe answered: "Wang Shichong\'s troops are worn out and his food is gone, and his people are divided; he need not be stormed, he can be had by sitting still. Dou Jiande has just beaten Duke Hai, so his officers are proud and his men slack. I shall hold Hulao and have him by the throat. If he risks a battle for it, he is easily taken; if he hesitates and does not fight, then within a month Wang Shichong collapses of himself."\n\nHe left the siege in place and went east to Hulao with three thousand five hundred men. They faced each other twenty days. Dou Jiande drew up a line twenty li long from the hour of the dragon to noon, until his men were hungry and tired and sat down in their ranks and began quarrelling over the water. Li Shimin said: "Now."\n\nOne battle took Dou Jiande alive, and Wang Shichong handed over Luoyang. One battle settled two kingdoms.',
    },
    forces: {
      tang: {
        zh: '圍洛陽,打援兵。三千五百騎守虎牢,對竇建德十萬 —— 世民說,可以。',
        en: 'Invest Luoyang and beat the relief. Three thousand five hundred horse at Hulao against Dou Jiande\'s hundred thousand. Shimin says it can be done.',
      },
      zheng: {
        zh: '洛陽被圍將近一年,城中人相食。竇建德的援兵是你最後的指望。',
        en: 'Luoyang has been invested nearly a year and the people in it are eating each other. Dou Jiande\'s relief is the last hope.',
      },
      xia: {
        zh: '凌敬勸你北上太行、直取關中,圍魏救趙。將領們收了王世充的錢,說直接去虎牢。',
        en: 'Ling Jing urged you to go north over the Taihang and strike at Guanzhong — besiege Wei to rescue Zhao. Your generals have taken Wang Shichong\'s money and say go straight to Hulao.',
      },
    },
  },

  'scn-st-anshi': {
    intro: {
      zh: '天寶十四載十一月,安祿山以誅楊國忠為名,發所部兵及同羅、奚、契丹、室韋凡十五萬眾,反於范陽。\n\n海內久承平,百姓累世不識兵革,猝聞範陽兵起,遠近震駭。河北皆祿山統內,所過州縣,望風瓦解,守令或開門出迎,或棄城竄匿,或為所擒戮,無敢拒之者。\n\n哥舒翰守潼關,以為賊遠來,利在速戰,王師堅守以弊之,不可輕出。楊國忠疑其圖己,言於帝,遣中使趣戰,項背相望。翰不得已,撫膺慟哭,引兵出關。\n\n潼關既失,長安不守。',
      en: 'An Lushan rose at Fanyang on the pretext of punishing Yang Guozhong, with a hundred and fifty thousand men of his own commands and of the Tongluo, Xi, Khitan and Shiwei.\n\nThe empire had been long at peace and its people had not seen war in generations; when word came that Fanyang had risen, near and far alike were appalled. All of Hebei was under An Lushan\'s own command, and the prefectures along his road fell apart at the sight of him — magistrates opened their gates to welcome him, or abandoned their towns and hid, or were taken and killed, and not one resisted.\n\nGeshu Han held the Tong Pass, judging that the rebels had come far and needed a quick decision, so that the imperial army should hold and wear them out and on no account come out. Yang Guozhong suspected the army was meant for him, spoke to the emperor, and messengers were sent to press for battle, one on the heels of another. Geshu Han, with no choice left, beat his breast and wept, and led his army out of the pass.\n\nWith the Tong Pass gone, Chang\'an could not be held.',
    },
    forces: {
      tang: {
        zh: '開元盛世四十年,你老了。安祿山兼三鎮節度,兵力甲於天下,而你還在驪山。',
        en: 'Forty years of the Kaiyuan peace, and you are old. An Lushan holds three commands and the strongest army in the realm — and you are still at Li mountain.',
      },
      yan: {
        zh: '三鎮之兵在手,朝廷無備。楊國忠日日說你要反 —— 說得多了,不反反而危險。',
        en: 'Three commands\' troops in hand and the court unready. Yang Guozhong says daily that you will revolt. Said often enough, not revolting becomes the dangerous course.',
      },
    },
  },
};
