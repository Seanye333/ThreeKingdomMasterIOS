import type { EntityId } from '../types';

/**
 * 戰役落幕 —— 每個盤、每一家專屬的敗亡輓歌與史官論曰。
 *
 * ## 為什麼要有這個檔
 *
 * `systems/endings.ts` 的九種結局是**全域**的:它只看君主是死是囚、年份過沒過
 * 263,不看你玩的是哪一張盤、哪一家。於是玩黃巾的張角亡國,讀到的是「昔劉備
 * 數失城郭而終成帝業」—— 一句對太平道教主毫無意義的話。
 *
 * 開場白那一端早就是分勢力的(`scenarioPrologues.ts`),落幕這一端卻沒有對稱
 * 的東西。一個戰役如果開頭替你寫了「你沒有的:甲仗、糧道、能守城的人」,結尾
 * 就該回答那句話 —— 那才叫一個故事,不是一段開場白加一個通用的失敗畫面。
 *
 * ## 兩種東西,分開放
 *
 *  - `defeat` —— **敗亡變體**。有寫就整段蓋掉通用輓歌(標題也換)。
 *  - `verdict` / `verdictLost` —— **史官論曰**。不蓋任何東西,附在落幕正文
 *    之後,勝敗各一段。體例仿《後漢書》的「論曰」,收在事實之後下判斷。
 *
 * 兩者都是選填。沒寫的盤照舊走通用結局 —— 這是刻意的:86 個盤不可能都寫,
 * 而寫了一半的東西不該讓另一半變成空白。
 *
 * @see systems/endings.ts   套用處(checkEndings)
 * @see scenarioPrologues.ts 對稱的另一端
 */
export interface ScenarioVerdict {
  /** 敗亡變體 — 覆蓋通用輓歌。 */
  defeat?: { titleZh: string; titleEn: string; textZh: string; textEn: string };
  /** 論曰 — 功成落幕時附在正文後。 */
  verdictZh?: string;
  verdictEn?: string;
  /** 論曰 — 敗亡落幕時附在正文後。 */
  verdictLostZh?: string;
  verdictLostEn?: string;
}

export const SCENARIO_VERDICTS: Record<string, Record<EntityId, ScenarioVerdict>> = {
  /* ── 184 黃巾之亂 ──────────────────────────────────────────────────
     這張盤上五家的敗法各不相同,而且沒有一家的敗法是「打輸了」那麼簡單:
     漢室輸掉的是名分,黃巾輸掉的是那一個聲音,皇甫嵩輸在功太大,朱儁輸在
     他扶的是一根朽木,董卓輸在他一輩子都不是洛陽的人。 */
  'scn-184-yellow-turban': {
    han: {
      defeat: {
        titleZh: '四百年,盡於此',
        titleEn: 'Four Hundred Years, Ended Here',
        textZh:
          '洛陽宮闕,一夕易主。自高皇帝提三尺劍取天下,至於今日,凡四百年 —— '
          + '而亡之者,非匈奴,非強藩,乃八州之編戶齊民,頭裹黃巾,手持鋤耰棘矜。\n\n'
          + '史官執筆至此而擱:桓靈之世,黨錮再興,賣官及於公卿,州郡饑而倉廩不發。'
          + '民之所以戴黃巾者,非愛張角,是漢已無可戴矣。',
        textEn:
          'The palaces of Luoyang change hands in a single night. From the day the Exalted Founder took the realm with a three-foot sword to this morning is four hundred years — and what ended it was not the Xiongnu, not the overmighty marches, but the registered commoners of eight provinces, yellow cloth about their heads, hoes and thornwood staves in their hands.\n\n'
          + 'Here the historian sets down his brush. Under Huan and Ling the proscriptions came twice, offices were sold up to the Three Excellencies, the provinces starved while the granaries stayed shut. The people did not put on yellow because they loved Zhang Jue. They put it on because there was nothing left of Han to wear.',
      },
      verdictZh:
        '論曰:黃巾既平,漢祚延矣 —— 然延者,期年之命耳。'
        + '亂之所以起,不在張角一人,在十常侍之貨賂公行、在州郡之倉廩空竭。'
        + '刃可斬三十六方之眾,不可斬人心之離。君能鎮之於外,而不能革之於內,'
        + '則明歲之黃巾,異其色而已矣。',
      verdictEn:
        'The verdict: with the Turbans put down, the mandate of Han is extended — extended, that is, by about a year. The rising began not in Zhang Jue but in the open traffic of bribes among the Ten Attendants and the empty granaries of the provinces. A blade can cut down thirty-six divisions; it cannot cut down the loss of the people\'s hearts. A lord who suppresses without reforming will meet next year\'s rebellion wearing a different colour.',
      verdictLostZh:
        '論曰:或謂漢亡於黃巾,非也。黃巾者,漢自亡之形見於外者耳。'
        + '桓帝賣官,靈帝造西園,州牧擁兵而詔不出關 —— 四百年之基,蟻穴久矣,'
        + '一潰而已。',
      verdictLostEn:
        'The verdict: it is said that Han fell to the Yellow Turbans. It did not. The Turbans were merely the outward shape of a house that had been falling in on itself for decades — Huan selling offices, Ling building his Western Garden, the provincial governors holding troops while imperial edicts stopped at the passes. The ant-tunnels had been there a long time. The collapse only looked sudden.',
    },
    'yellow-turban': {
      defeat: {
        titleZh: '蒼天未死,黃天不立',
        titleEn: 'The Blue Heaven Did Not Die',
        textZh:
          '三十六方,一時俱起,旬月之間天下響應 —— 而不及一歲,盡矣。\n\n'
          + '所恃者,人多;所無者,城守之具、轉輸之糧、任事之才。'
          + '教主一身而繫三十六方之信,身沒則信散,信散則眾潰。'
          + '黃巾未嘗敗於一戰,是敗於「起事之後不知何為」。\n\n'
          + '然自此以降,朝廷不能復制州郡,牧守擁兵自重 —— 你點的那把火,'
          + '燒的不是你想燒的東西,卻終究燒掉了漢。',
        textEn:
          'Thirty-six divisions rose in a single season, and within a month the whole realm answered. Within a year, it was over.\n\n'
          + 'What you had was numbers. What you lacked was siege gear, a grain corridor, and men who could administer anything. The faith of thirty-six divisions hung on one man\'s body; when the body failed the faith scattered, and when the faith scattered the host dissolved. The Yellow Turbans were never beaten in a battle. They were beaten by having no answer to the question of what comes after the rising.\n\n'
          + 'And yet from this year onward the court could no longer hold its provinces, and the governors kept their armies. The fire you lit did not burn what you meant it to burn. It burned down Han all the same.',
      },
      verdictZh:
        '論曰:蒼天已死,黃天當立 —— 立之矣。然立國者與舉事者,所需非一術。'
        + '符水可以聚眾,不可以定賦;讖語可以驅人赴死,不可以使之春耕。'
        + '君既得天下,當自問:那三十六方之眾,今日靠什麼吃飯?',
      verdictEn:
        'The verdict: the Blue Heaven is dead and the Yellow Heaven stands — it does stand. But founding a state and raising a rebellion do not call for the same art. Talisman-water gathers a host; it does not assess a tax. A prophecy will send men to die; it will not send them out to the spring ploughing. Now that the realm is yours, ask yourself what those thirty-six divisions are going to eat.',
      verdictLostZh:
        '論曰:角之起也,以疾疫為機,以符水為信,八州同日而發 —— 其謀非不深。'
        + '其所以敗,在於教而無政:得城不能守,得粟不能計,得人不能用。'
        + '故曰:亂天下者易,有天下者難。',
      verdictLostEn:
        'The verdict: Zhang Jue timed his rising to a plague, bound his followers with talisman-water, and brought eight provinces out on the same day — the design was not shallow. What undid it was a church with no government: cities taken and not held, grain seized and not counted, men gathered and not employed. Hence the saying — to throw the realm into chaos is easy; to hold it is not.',
    },
    huangfu: {
      defeat: {
        titleZh: '功高而身危',
        titleEn: 'The Peril of Merit',
        textZh:
          '長社之火、廣宗之屍、下曲陽之京觀 —— 平黃巾之功,君居其半。\n\n'
          + '而後如何?閻忠說君「南面稱制」,君不聽;宦者趙忠、張讓求賄不得,'
          + '一疏而收左車騎將軍印綬,削戶六千。功之所在,即禍之所伏 —— '
          + '這不是敗於黃巾,是敗於平定黃巾之後的那個朝廷。',
        textEn:
          'The fire at Changshe, the corpses at Guangzong, the skull-mound at Xiaquyang — half the merit of breaking the Yellow Turbans is yours.\n\n'
          + 'And after? Yan Zhong urged you to face south and rule; you would not hear it. The eunuchs Zhao Zhong and Zhang Rang asked for their cut and did not get it, and one memorial stripped you of the seals of General of Chariots and Cavalry of the Left and six thousand households of your fief. Where the merit is, there the danger lies buried. You were not beaten by the Turbans. You were beaten by the court that remained after them.',
      },
      verdictZh:
        '論曰:嵩之用兵,得火攻之時、得追亡之度,信名將也。'
        + '至於閻忠之說,辭而不受,論者或惜之。然使嵩受之,則平黃巾之嵩,'
        + '即繼黃巾而起者矣 —— 其不受,正其所以為嵩。',
      verdictEn:
        'The verdict: in his use of arms Huangfu Song judged the hour for fire and the measure of a pursuit; he was a general in the true sense. As for Yan Zhong\'s proposal, he refused it, and some have thought that a waste. But had he accepted, the man who put down the Yellow Turbans would have become the next thing rising in their place. His refusal is precisely what made him Huangfu Song.',
      verdictLostZh:
        '論曰:古今名將,死於陣者十之三,死於功者十之七。'
        + '嵩破廣宗、屠下曲陽,天下震其名 —— 而印綬之收,不由陣前,由禁中一言。'
        + '悲夫。',
      verdictLostEn:
        'The verdict: of famous generals in every age, three in ten die in the line; seven in ten die of their own merit. He broke Guangzong and put Xiaquyang to the sword, and the realm shook at his name — and then the seals were taken from him, not on the field, but by a word spoken inside the palace. A pity.',
    },
    zhujun: {
      defeat: {
        titleZh: '扶漢者,漢先仆',
        titleEn: 'He Propped Up a Falling House',
        textZh:
          '宛城之圍,起土山以臨之,鳴鼓西南而入東北 —— 亂事終於君手。\n\n'
          + '而君終身所扶者,是一根朽木。後之董卓入洛,君守長安不下;'
          + '李傕召之,君明知其詐而往,曰「國家西遷,吾恨不能自奮」—— '
          + '發憤而卒。忠則忠矣,漢不可扶也。',
        textEn:
          'At the siege of Wancheng you raised earth-mounds to look down into the city, beat the drums to the southwest and went in over the northeast wall — the rebellion ended in your hands.\n\n'
          + 'And what you spent your life propping up was rotten timber. When Dong Zhuo entered Luoyang you would not yield Chang\'an; when Li Jue summoned you, you knew it for a trap and went anyway, saying only that with the court moved west you could not bear to sit still — and died of the rage of it. Loyal you certainly were. The house could not be propped up.',
      },
      verdictZh:
        '論曰:儁之圍宛,先受降而後拒之,論者謂其反覆。'
        + '然儁曰:「兵有形同而勢異者。今海內一統,唯黃巾造逆,納降無以勸善,'
        + '討之足以懲惡。」此非權詐,是知所以用降者也。',
      verdictEn:
        'The verdict: at Wancheng Zhu Jun first accepted the surrender and then refused it, and critics have called him inconstant. But he answered: forms that look alike may sit in wholly different positions. The realm is one; only the Turbans have risen. To take their surrender rewards nothing, while to break them deters much. That is not duplicity — that is knowing what a surrender is for.',
      verdictLostZh:
        '論曰:儁起於寒門,以孝致名,以戰致位,終以忠死。'
        + '其平黃巾也,天下稱之;其守漢室也,天下已無漢矣。'
        + '人各有時,儁之不幸,在生於一姓將終之日。',
      verdictLostEn:
        'The verdict: Zhu Jun rose from a poor house, made his name by filial devotion, his rank by war, and his end by loyalty. When he put down the Yellow Turbans the realm praised him; when he stood for the House of Han there was no longer a House of Han to stand for. Every man has his hour. Zhu Jun\'s misfortune was to be born in the last days of a dynasty.',
    },
    'dong-184': {
      defeat: {
        titleZh: '檻車徵詣廷尉',
        titleEn: 'Summoned to the Court of Judgment',
        textZh:
          '廣宗城下,兵不得進;詔書一下,檻車徵君詣廷尉,減死一等。\n\n'
          + '涼州人在洛陽,永遠是客。你手裡有湟中義從、有羌胡騎,'
          + '而朝堂上一個字也沒有。這一回你輸的不是廣宗那座城,'
          + '是「你打不下來,就沒有人替你說話」這件事。',
        textEn:
          'Beneath the walls of Guangzong the assault will not go in; an edict comes down, and a prison cart carries you to the Court of Judgment, your death sentence commuted by one degree.\n\n'
          + 'A man of Liang province is always a guest in Luoyang. You have the Huangzhong auxiliaries and the Qiang horse, and not one voice in the court. What you lost here was not the city. It was the fact that when you failed to take it, there was nobody to speak for you.',
      },
      verdictZh:
        '論曰:卓之得志,不在廣宗,在中平六年之詔 —— 京師一亂,'
        + '而涼州之兵入焉。使黃巾之世卓即得志,則其暴亦早見於此矣。'
        + '天下之禍,常始於「召外兵以定內爭」之一念。',
      verdictEn:
        'The verdict: Dong Zhuo\'s hour did not come at Guangzong. It came with the summons of 189, when the capital fell into disorder and the Liang province troops marched in. Had he prevailed here in the Turban years, his cruelty would simply have shown itself that much earlier. The great calamities of the realm commonly begin with a single thought — call in outside soldiers to settle a quarrel at home.',
      verdictLostZh:
        '論曰:卓少嘗遊羌中,盡與諸豪帥相結,故能得其死力。'
        + '然其所以終不容於朝者,亦在於此:朝廷用其兵而畏其人。'
        + '檻車之徵,非一日之怒也。',
      verdictLostEn:
        'The verdict: in his youth Dong Zhuo travelled among the Qiang and bound every chieftain to him, and so could command men who would die for him. And that same fact is why the court could never accommodate him: it used his soldiers and feared the man. The prison cart was not the anger of a single day.',
    },
  },
  /* ── 190 反董卓聯軍 ────────────────────────────────────────────────
     十一家,十一種敗法。這張盤的題目不是「誰打贏董卓」—— 董卓是被自己人
     殺的,聯軍一箭未發就散了。真正的題目是:義兵起於同一年,為什麼三年之內
     就變成互相攻伐的十一路諸侯。所以每一家的敗亡,寫的都是他**當初起兵時
     就已經帶著的那個病**。 */
  'scn-190-anti-dong-zhuo': {
    cao: {
      defeat: {
        titleZh: '諸君北面,我自西向',
        titleEn: 'Face North If You Will — I Ride West',
        textZh:
          '滎陽汴水,一敗塗地。所將卒不滿五千,而徐榮之眾數萬 —— 戰終日,士卒死傷過半,'
          + '身中流矢,所乘馬亦被創。曹洪以己馬相與,曰:「天下可無洪,不可無君。」\n\n'
          + '收餘燼還至酸棗,而諸軍十餘萬,日置酒高會,不圖進取。責之曰:'
          + '「舉義兵以誅暴亂,大眾已合,諸君何疑?」—— 眾莫能應。\n\n'
          + '自此再無人西向。而那一年之後,舉義兵的人各據州郡,所爭者已非董卓。',
        textEn:
          "At the Bian river by Xingyang the rout is total. Fewer than five thousand men against Xu Rong's tens of thousands: a full day of fighting, half the ranks dead or maimed, an arrow in your body, your horse cut down under you. Cao Hong gives you his own mount — 'The realm can do without Hong. It cannot do without you.'\n\n"
          + "You bring the embers back to Suanzao, where a hundred thousand allied troops hold banquets and make no move. 'We raised righteous troops to punish a tyrant. The host is assembled. What is there left to hesitate over?' Nobody answers.\n\n"
          + 'No one rides west again. Within the year the men who raised righteous troops are holding provinces of their own, and what they fight over is no longer Dong Zhuo.',
      },
      verdictZh:
        '論曰:酸棗之會,十餘萬眾,而唯操一人西向。夫舉義者眾,任義者寡 —— '
        + '諸君所惜者其兵,操所惜者其時。及其終有天下,論者謂之奸雄;'
        + '然當日汴水之敗,天下無第二人肯敗那一場。',
      verdictEn:
        'The historian says: a hundred thousand gathered at Suanzao, and one man rode west. Many will raise a righteous cause; few will spend anything on it. The others were husbanding their troops; he was husbanding the hour. Later ages called him a usurper — but on the day of the Bian river, no one else in the realm was willing to lose that battle.',
      verdictLostZh:
        '論曰:操之敗,不敗於徐榮,敗於身後十餘萬按兵不動之眾。'
        + '孤軍向西者,勝則天下之功,敗則天下之笑 —— 而笑之者,正是當日與之歃血者也。',
      verdictLostEn:
        'The historian says: he was not beaten by Xu Rong. He was beaten by the hundred thousand standing still behind him. The man who rides west alone wins the realm if he wins, and its laughter if he loses — and the loudest laughter comes from those who swore the oath beside him.',
    },
    'yuan-shao': {
      defeat: {
        titleZh: '四世三公,而不能決一事',
        titleEn: 'Four Generations of Excellencies, Not One Decision',
        textZh:
          '盟主之璽在案上,而河內之軍不動。議者曰當進洛陽,議者曰當立劉虞,'
          + '議者曰當先取冀州 —— 三議並陳,而三議皆不決。\n\n'
          + '兵久不用則士心懈,盟久不戰則約自解。及糧盡,諸軍各歸其鎮,'
          + '所謂十八路者,一夕而散。史稱其人:「外寬雅,有局度,喜怒不形於色;'
          + '而內多忌,好謀無決,有才而不能用,聞善而不能納。」',
        textEn:
          "The seal of the alliance's chief lies on the table and the army at Henei does not move. One counsel says march on Luoyang; one says enthrone Liu Yu; one says take Ji province first. Three counsels laid out, and not one of them chosen.\n\n"
          + 'An army long unused loses its edge; an alliance long unfought dissolves of itself. When the grain runs out the contingents ride home, and the eighteen roads are gone in a night. Of him the histories say: outwardly generous and composed, his moods never showing — inwardly full of suspicion, fond of planning and unable to choose, holding talent he could not use, hearing good counsel he could not take.',
      },
      verdictZh:
        '論曰:紹以四世三公之資為盟主,天下之望在焉。夫望之所歸者,'
        + '人皆以為其力足以任之 —— 而任天下者,不在資,在決。'
        + '能決者,雖起於卒伍而終有其國;不能決者,雖累世公卿而終無其身。',
      verdictEn:
        'The historian says: he was made chief of the alliance on four generations of Excellencies, and the hopes of the realm settled on him. Men assume that where hope settles, strength must follow. But a realm is carried by decision, not pedigree. He who can decide founds a state though he rose from the ranks; he who cannot loses even himself, though his house has held office for a century.',
      verdictLostZh:
        '論曰:紹非無兵,非無地,非無士 —— 所無者,一言而定之心耳。'
        + '當斷不斷,反受其亂:此語不始於紹,而紹足以為之注。',
      verdictLostEn:
        'The historian says: he lacked neither troops nor land nor talent. He lacked the will to say one sentence and be done. "He who will not cut when the moment comes will be cut by it" — the saying is older than he is, and he is its best gloss.',
    },
    'yuan-shu': {
      defeat: {
        titleZh: '冢中枯骨',
        titleEn: 'A Dry Bone in a Tomb',
        textZh:
          '玉璽在手,而米一斛值錢五十萬。士卒凍餒,江淮之間相食殆盡 —— '
          + '而後宮數百,皆服綺縠,餘粱肉。\n\n'
          + '及走死江亭,問廚下,尚有麥屑三十斛。時盛暑,欲得蜜漿,又無蜜。'
          + '坐榻上嘆息良久,乃大吒曰:「袁術至於此乎!」因頓伏床下,嘔血斗餘而死。',
        textEn:
          'The imperial seal is in your hand, and a bushel of rice costs five hundred thousand cash. Your soldiers freeze and starve; between the Yangtze and the Huai the living eat the dead — while several hundred women of your household wear figured silk and leave meat on the plate.\n\n'
          + 'Fleeing at last to a river pavilion you ask the kitchen what is left: thirty measures of wheat husks. It is high summer; you want honey water, and there is no honey. You sit a long while, then cry out — "Has Yuan Shu come to this!" — fall from the couch, vomit a gallon of blood, and die.',
      },
      verdictZh:
        '論曰:術得傳國璽而遂欲有天下,不知璽者器也,非命也。'
        + '孫堅得之而不敢有,術取之而不敢藏 —— 一物之重,不在物,在持之者之德。'
        + '故當時謂之冢中枯骨,何足介意。',
      verdictEn:
        'The historian says: he got the imperial seal and thought the realm came with it, not seeing that a seal is an object and not a mandate. Sun Jian found it and would not claim it; Yuan Shu seized it and could not hide it. The weight of a thing lies not in the thing but in the man who holds it. Hence the verdict passed on him in his own lifetime: a dry bone in a tomb, not worth a thought.',
      verdictLostZh:
        '論曰:術之亡,亡於稱帝之日,不亡於嘔血之時。'
        + '天下未一而先正大位,是以四方之兵皆有辭矣。',
      verdictLostEn:
        'The historian says: he fell on the day he took the title, not the day he vomited blood. To mount the throne while the realm is still divided is to hand every army in it a reason to march on you.',
    },
    sun: {
      defeat: {
        titleZh: '峴山之下,一矢而已',
        titleEn: 'Below Xian Mountain, a Single Arrow',
        textZh:
          '諸侯之中,唯堅獨進 —— 破華雄於陽人,敗呂布於洛陽城下,'
          + '掃除宗廟,平塞諸陵,而後引軍還。入洛之日,城中無雞犬,火猶未熄。\n\n'
          + '及攻劉表,表遣黃祖逆戰,祖敗走峴山。堅乘勝夜追之,'
          + '祖部曲從竹木間暗發,矢中其首 —— 時年三十七。\n\n'
          + '江東之業,自此付於一十七歲之子。',
        textEn:
          'Of all the lords only he advanced — broke Hua Xiong at Yangren, drove Lü Bu back under the walls of Luoyang, swept and sealed the imperial tombs, then led his army home. On the day he entered Luoyang there was not a chicken or a dog left alive in it, and the fires were still burning.\n\n'
          + "Then he moved on Liu Biao. Huang Zu met him and was driven back to Xian mountain; he pursued by night, and Huang Zu's men loosed from the bamboo in the dark. An arrow took him in the head. He was thirty-seven.\n\n"
          + 'What he had built passed that night to a boy of seventeen.',
      },
      verdictZh:
        '論曰:堅為長沙太守,越境討賊而不待詔,義也;諸侯高會而堅獨西,勇也;'
        + '得璽而還之,忠也。然輕身犯難,以三十七之年死於流矢之下 —— '
        + '兵者之常,而國之大不幸。',
      verdictEn:
        'The historian says: as Grand Administrator of Changsha he crossed his own borders to put down rebels without waiting for an edict — that was duty. While the lords banqueted, he alone rode west — that was courage. He found the seal and gave it back — that was loyalty. But he went forward too lightly, and at thirty-seven an arrow out of the dark ended him. Common enough in war; a disaster for a state.',
      verdictLostZh:
        '論曰:江東之基,起於一人之勇,亦幾亡於一人之死。'
        + '為將者不可以不勇,為主者不可以徒勇。',
      verdictLostEn:
        "The historian says: the house of the east was raised by one man's courage and very nearly ended by that same man's death. A general cannot do without daring. A lord cannot live on daring alone.",
    },
    dong: {
      defeat: {
        titleZh: '郿塢三十年之積',
        titleEn: 'Thirty Years of Grain at Mei',
        textZh:
          '築塢於郿,高厚七丈,與長安城埒 —— 積穀為三十年儲。'
          + '自云:「事成,雄據天下;不成,守此足以畢老。」\n\n'
          + '而事之不成,不在關東之兵,在門下之人。呂布戟中其喉,士卒不戰而潰。'
          + '屍暴於市,天時始熱,體肥,脂流於地;守屍吏然火置臍中,光明達旦,如是者積日。\n\n'
          + '袁氏門生故吏聚而焚其骨,揚灰於路。三十年之積,一日而盡。',
        textEn:
          "You raise a fortress at Mei, seventy feet high and as thick, a match for the walls of Chang'an, and store thirty years of grain in it. 'If this succeeds, I hold the realm. If it fails, this is enough to see out my old age.'\n\n"
          + "It failed — not to the armies of the east but to a man of your own household. Lü Bu's halberd goes through your throat and your soldiers scatter without a fight. Your body lies in the market; the weather has just turned hot, you were a fat man, and the fat runs out onto the ground. A guard sets a wick in your navel and lights it, and it burns till dawn, and does so for days.\n\n"
          + 'Then the retainers of the house of Yuan gather your bones, burn them, and scatter the ash on the road. Thirty years of grain, gone in a day.',
      },
      verdictZh:
        '論曰:卓以涼州武夫入洛,一夕而秉國政 —— 得之易,故守之無術。'
        + '廢立由己,遷都由己,焚宮室、發陵墓亦由己;凡可以震天下者,無所不用,'
        + '而終不能使一人為之死。積穀三十年,不如得士一日。',
      verdictEn:
        'The historian says: he came into Luoyang a soldier from Liang province and held the government within a night. What is taken easily is held without craft. He deposed and enthroned as he pleased, moved the capital as he pleased, burned the palaces and opened the tombs as he pleased — every instrument that can terrify a realm, and not one man in it who would die for him. Thirty years of stored grain are worth less than a single day of loyal men.',
      verdictLostZh:
        '論曰:卓之死,死於呂布,而使布殺之者,非王允之謀,是卓自為之。'
        + '待人以父子之名而責之以奴僕之實 —— 天下無此父子。',
      verdictLostEn:
        "The historian says: Lü Bu killed him, but what put the halberd in Lü Bu's hand was not Wang Yun's scheme — it was his own conduct. He called the man his son and used him as a servant. No father and son on earth survive that.",
    },
    'liu-biao': {
      defeat: {
        titleZh: '坐談客耳',
        titleEn: 'A Man for Conversation',
        textZh:
          '單馬入宜城,誘宗賊帥五十五人而斬之 —— 遂領荊州,地方數千里,帶甲十餘萬。'
          + '而關東舉義兵,不與;曹袁相持於官渡,亦不與。\n\n'
          + '嘗曰:「吾坐觀成敗,可以自保。」而成敗之後,無人與觀者共分之。'
          + '及身沒,二子爭立,舉州以降 —— 荊州十萬之眾,未嘗一戰而易主。',
        textEn:
          'You ride into Yicheng alone, lure fifty-five bandit chiefs to a meeting and have them killed — and so take Jing province: a thousand miles of country, a hundred thousand men under arms. When the east raises righteous troops you send none. When Cao and Yuan lock at Guandu you send none.\n\n'
          + '"I shall sit and watch who wins," you said, "and keep what is mine." But when the winning is over, nobody divides the spoils with the man who watched. You die; your two sons quarrel over the succession; the province surrenders entire. A hundred thousand men of Jing change masters without a single battle.',
      },
      verdictZh:
        '論曰:表有威容,知經術,愛民養士,一州稱治 —— 此守成之才也。'
        + '然當天下橫潰之日,而欲以守成之才處之,是持圓鑿而入方枘。'
        + '故時人謂之坐談客,非貶其人,貶其時之不可坐談也。',
      verdictEn:
        'The historian says: he had presence, learning, and care for his people, and his province was well governed — the gifts of a man who holds what he inherits. But he was asked to hold them in a decade that was tearing itself apart, and a round peg forced into a square hole is not less round for the forcing. His contemporaries called him a man for conversation: not an insult to him, but to the notion that his age left room for conversation.',
      verdictLostZh:
        '論曰:自保者,亂世之至難也。不取人,人必取之;'
        + '不與人爭天下,人必與汝爭州郡。',
      verdictLostEn:
        'The historian says: merely keeping what you have is the hardest thing in a broken age. If you will not take from others, others take from you. Decline to contest the realm and men will contest your province instead.',
    },
    'liu-yan': {
      defeat: {
        titleZh: '棧道既斷,天下遂遠',
        titleEn: 'The Plank Roads Cut, the Realm Made Distant',
        textZh:
          '請為益州牧,而使張魯斷絕斜谷閣道,盡殺漢使 —— 自此益州與中國不通。'
          + '造乘輿車具千餘乘,有僭擬之心。\n\n'
          + '而天下之變,不因斷道而止。二子死於長安,天火燒其城府車具,'
          + '徙居成都,疽發背卒。傳其業於一庸子,終為他人取之 —— '
          + '所謂天子氣在益州分野者,應在他人身上。',
        textEn:
          "You ask for Yi province, then have Zhang Lu cut the plank road through the Xie valley and kill every imperial envoy on it. From that day Yi province and the middle realm have no traffic. You build a thousand carriages of imperial pattern, and men understand what that means.\n\n"
          + "But cutting a road does not stop an age from turning. Your two sons die at Chang'an; heaven's fire burns your offices and your carriages; you move to Chengdu and die of an abscess on the back. What you built passes to a mediocre son, and from him to a stranger. The aura of a Son of Heaven over the Yi division turned out to be about somebody else.",
      },
      verdictZh:
        '論曰:焉之取益州,以避亂始,以僭擬終。夫據險而自完者,'
        + '可以延數十年之命,不可以成一代之業 —— 險者,拒人亦拒己也。',
      verdictEn:
        'The historian says: he took Yi province to escape the chaos and ended by rehearsing an emperor. A man who shuts himself behind mountains can buy decades of life but never an age of his own. The mountains that keep others out keep you in.',
      verdictLostZh:
        '論曰:斷閣道者,自斷其出路也。天下有變則不能應,天下既定則不能爭 —— '
        + '蜀之為蜀,自此定矣。',
      verdictLostEn:
        'The historian says: to cut the plank roads is to cut your own way out. You cannot answer the realm when it moves, and you cannot contest it once it has settled. What Shu would be was decided the day those roads came down.',
    },
    gongsun: {
      defeat: {
        titleZh: '易京百樓',
        titleEn: 'The Hundred Towers of Yijing',
        textZh:
          '白馬義從,馳射如飛,胡人望其塵而走 —— 而界橋一戰,'
          + '為麴義八百先登所破,自此不振。\n\n'
          + '乃於易京鑿塹十重,築京中亭樓,高十丈,自居之;積穀三百萬斛,曰:'
          + '「兵法百樓不攻。今吾樓櫓千重,食盡此穀,足知天下之事矣。」'
          + '疏遠賓客,無所親信 —— 謀臣猛將稍稍乖散。\n\n'
          + '及紹兵至,穿地直至樓下,火燒其柱。乃先殺其姊妹妻子,然後引火自焚。',
        textEn:
          "The White Horse Volunteers rode and shot like wind, and the northern tribes fled from their dust — until Ju Yi's eight hundred broke them at Jieqiao, and they were never the same.\n\n"
          + 'So you dug ten rings of trench at Yijing and raised a tower a hundred feet high in the middle to live in, and stored three million bushels of grain. "The art of war says a hundred towers cannot be stormed. I have a thousand tiers of them. By the time this grain is eaten I shall know how the realm turned out." You kept your guests at a distance and trusted nobody, and your counsellors and captains drifted away one by one.\n\n'
          + "When Yuan Shao's men came they tunnelled to the foot of the tower and fired its pillars. You killed your sisters, your wife and your children first, and then set the fire yourself.",
      },
      verdictZh:
        '論曰:瓚之興,以邊功;其亡,以自守。馳騁塞外者,一入高樓則失其所長。'
        + '夫恃險而不恃人,是以百樓為城而以四海為敵也。',
      verdictEn:
        'The historian says: he rose on the frontier and fell inside a wall. A man whose gift is the open steppe loses it the moment he climbs a tower. To trust in works and not in men is to make a fortress of a hundred towers and an enemy of everything outside them.',
      verdictLostZh:
        '論曰:瓚殺劉虞而失幽州之心,築易京而失部曲之心。'
        + '兩失之後,雖有百樓,誰與守之?',
      verdictLostEn:
        'The historian says: killing Liu Yu cost him the goodwill of You province; building Yijing cost him the goodwill of his own retainers. Having lost both, who exactly was going to hold his hundred towers?',
    },
    tao: {
      defeat: {
        titleZh: '無事便是大功,而無事不可久',
        titleEn: 'To Have Nothing Happen Was the Achievement',
        textZh:
          '徐州殷實,穀米豐贍,流民多歸之 —— 亂世之中,此已是難得。'
          + '然而闕宣稱帝於下邳,附之而後殺之;曹嵩過境而死於部下之手。\n\n'
          + '於是曹操東征,所過多所殘戮,雞犬亦盡,泗水為之不流。'
          + '謙不能拒,退保郯城,憂懼而卒 —— 臨終以徐州讓劉備,曰:'
          + '「非劉備不能安此州也。」',
        textEn:
          'Xu province was rich, its granaries full, and refugees came to it — in such an age that alone was an achievement. Then Que Xuan proclaimed himself emperor at Xiapi and you joined him before killing him; and Cao Song crossed your territory and died at the hands of your own officers.\n\n'
          + 'So Cao Cao came east. Where he passed there was slaughter, not a chicken or a dog left, and the Si river was dammed with the dead. You could not stop him, fell back on Tan, and died of fear and grief — leaving the province to Liu Bei with the words: "No one but Liu Bei can settle this place."',
      },
      verdictZh:
        '論曰:謙之守徐州,倉廩實而民附,可謂能矣。然亂世之守,不在倉廩,在四鄰。'
        + '一境之安,繫於他人之一怒 —— 此所以無事者不可久也。',
      verdictEn:
        "The historian says: he kept Xu province with full granaries and a people willing to come to him, and that was ably done. But keeping a province in a broken age depends less on your granaries than on your neighbours. The peace of one border rests on another man's temper — which is why having nothing happen can never last.",
      verdictLostZh:
        '論曰:謙非暴主,而徐州之民為之受屠 —— 亂世之禍,不必自作。',
      verdictLostEn:
        'The historian says: he was not a cruel ruler, and the people of Xu were butchered on his account all the same. In a broken age the calamity that finds you need not be one you made.',
    },
    'kong-rong': {
      defeat: {
        titleZh: '樽中酒不空',
        titleEn: 'The Cup Was Never Empty',
        textZh:
          '孔子二十世孫,少有異才,座上客常滿,樽中酒不空 —— '
          + '天下名士,莫不願一至北海。\n\n'
          + '而管亥圍城,眾寡不敵。城中之士能屬文者甚眾,能將兵者無一。'
          + '賴太史慈突圍求救於平原,劉備驚曰:「孔北海乃復知天下有劉備邪?」'
          + '乃遣兵三千 —— 圍始解。\n\n'
          + '解圍之後,座上客仍滿,而北海終不能守。',
        textEn:
          'Twentieth in descent from Confucius, gifted from boyhood, your hall always full of guests and your cup never empty — there was no famous man in the realm who did not want to visit Beihai once.\n\n'
          + 'Then Guan Hai laid siege, and you were badly outnumbered. The city held many men who could compose an essay and not one who could command troops. Taishi Ci cut his way out to beg help at Pingyuan, and Liu Bei said in astonishment: "So the Lord of Beihai knows there is a Liu Bei in the world after all?" — and sent three thousand men, and the siege lifted.\n\n'
          + 'The hall stayed full afterwards. Beihai was lost in the end all the same.',
      },
      verdictZh:
        '論曰:融名重天下,而所治不過一郡;議論足以動朝廷,而甲兵不足以保一城。'
        + '夫名者,亂世之至輕者也 —— 輕而人爭趨之,是以文士多而國少。',
      verdictEn:
        'The historian says: his name carried across the realm and his administration never reached beyond one commandery; his opinions could move a court and his soldiers could not hold a wall. Reputation is the lightest currency of a broken age — and because men chase it anyway, such an age produces many writers and few states.',
      verdictLostZh:
        '論曰:北海之失,不在無士,在無兵。座上客常滿者,不能為城上一卒。',
      verdictLostEn:
        'The historian says: Beihai did not fall for want of gentlemen. It fell for want of soldiers. A hall full of guests will not put one man on the wall.',
    },
    'ma-teng': {
      defeat: {
        titleZh: '入朝為衛尉',
        titleEn: 'Summoned to Court as Commandant of the Guards',
        textZh:
          '涼州之地,羌漢雜處。騰起於行伍,與韓遂結為異姓兄弟 —— '
          + '而後相攻,兵連不解;朝廷遣使和之,乃各罷兵。\n\n'
          + '及曹操經略關西,徵騰入朝,拜衛尉。騰以年老,乃入。'
          + '子超留領其部曲 —— 而超反於關中,操遂夷騰三族。\n\n'
          + '涼州之兵,自此為人所用,而不復為己有。',
        textEn:
          'Liang province, where Qiang and Han live mixed together. He rose from the ranks there and swore brotherhood with Han Sui — then fought him, year after year, until the court sent an envoy to make them stop.\n\n'
          + 'When Cao Cao turned west he summoned Ma Teng to court and made him Commandant of the Guards. Being old, he went. His son Ma Chao stayed behind with the troops — and revolted in Guanzhong, and Cao Cao put three degrees of the family to death.\n\n'
          + 'From then on the soldiers of Liang fought in other men\'s wars and never again in their own.',
      },
      verdictZh:
        '論曰:騰擁涼州之銳而不能自立者,以其地遠而心近也。'
        + '入朝則身為質,不入則名為叛 —— 邊將之難,自古如此。'
        + '故涼州之兵天下稱雄,而涼州之主未嘗有天下。',
      verdictEn:
        "The historian says: he commanded the finest cavalry in the realm and could never stand alone, because his country was far from the capital and his heart was not. Go to court and you are a hostage; refuse and you are a rebel. That has always been the frontier general's dilemma. The soldiers of Liang were famous everywhere; no lord of Liang ever held the realm.",
      verdictLostZh:
        '論曰:邊地之兵可以佐人,難以自王。非其人不武,是其地不足以養一朝廷。',
      verdictLostEn:
        'The historian says: frontier troops can make another man a king; they cannot make one of their own. Not because the men lack valour, but because the country behind them cannot feed a court.',
    },
  },
  /* ── 200 官渡之戰 ────────────────────────────────────────────────
     這張盤只有一個題目:**以少勝多之後,怎麼辦。**
     官渡是漢末唯一一場真正決定天下的仗,而八家的敗法,寫的都是他們
     在那一戰前後**沒能想通的那一件事**。 */
  'scn-200-guandu': {
    cao: {
      defeat: {
        titleZh: '許都空,而糧已盡',
        titleEn: 'Xu Is Empty, and the Grain Is Gone',
        textZh:
          '官渡相持,自八月至十月。軍糧將盡,士卒疲乏,書與荀彧議欲還許 —— '
          + '彧報曰:「公以十分居一之眾,畫地而守之,扼其喉而不得進,已半年矣。'
          + '情見勢竭,必將有變,此用奇之時,不可失也。」\n\n'
          + '而那一夜沒有人來降,沒有人說出烏巢二字。糧盡則軍散,軍散則許都無備。'
          + '袁紹之騎過官渡而南,一日夜至許 —— 天子在焉,而迎之者非我。\n\n'
          + '史官記此一戰曰:「紹之強,非操所能敵也。」下一句本該是「然卒破之者」——'
          + '而這一次,沒有下一句。',
        textEn:
          "The lines at Guandu hold from the eighth month to the tenth. The grain runs down, the men are worn through, and you write to Xun Yu about falling back on Xu. He writes back: 'With one man to their ten you have drawn a line and held it, gripped their throat so they cannot advance, for half a year now. Their situation is plain and their strength spent. Something must break. This is the hour for the unexpected stroke, and it must not be missed.'\n\n"
          + 'And that night nobody comes over to your side, and nobody says the word Wuchao. When the grain is gone the army scatters; when the army scatters Xu stands open. The Yuan horse cross Guandu going south and reach the capital in a day and a night — the Son of Heaven is there, and it is not you who receives him.\n\n'
          + "Of this battle the historian wrote: 'Shao's strength was more than Cao could match.' The next clause should have been 'and yet he broke him.' This time there is no next clause.",
      },
      verdictZh:
        '論曰:官渡之勝,不在兵多,在能忍。'
        + '自八月至十月,以一敵十而不退者半年 —— 天下之強,先強在肯守。'
        + '及烏巢火起,一夜而定十年之局:機不在謀者之手,在守得住到那一夜的人手裡。',
      verdictEn:
        'The historian says: Guandu was not won by numbers but by endurance. From the eighth month to the tenth, one man against ten, and he did not fall back — the strongest thing in the realm is the willingness to hold. When Wuchao burned, a single night settled the next ten years. The opening does not belong to the man who plans it; it belongs to the man who was still standing when it came.',
      verdictLostZh:
        '論曰:操之敗,敗於糧,不敗於兵。'
        + '夫以寡當眾者,所恃者一擊之機;機未至而糧先盡,則雖有奇謀,無所施矣。',
      verdictLostEn:
        'The historian says: he was beaten by his supply line, not by their army. A man who fights the many with the few is betting everything on one opening. If the grain runs out before the opening comes, the cleverest plan in the world has nowhere to land.',
    },
    'yuan-shao': {
      defeat: {
        titleZh: '田豐在獄中',
        titleEn: 'Tian Feng Is Still in the Cell',
        textZh:
          '田豐諫:「曹公善用兵,變化無方,眾雖少,未可輕也,不如以久持之。」'
          + '紹不從,以為沮眾,械繫之。沮授諫分兵之非,亦不用。\n\n'
          + '烏巢火起之夜,張郃請救之,郭圖請攻官渡 —— 兩議並陳,而紹用其半:'
          + '遣輕騎救烏巢,以重兵攻官渡。兩處俱敗。\n\n'
          + '軍潰而還,或謂田豐曰:「君必見重。」豐曰:「若軍有利,吾必全;'
          + '今軍敗,吾其死矣。」紹還,曰:「吾不用田豐言,果為所笑。」遂殺之。',
        textEn:
          "Tian Feng warns you: 'Cao is a fine commander and his shape changes without pattern. Few as they are, they cannot be taken lightly. Better to hold him at length.' You take this for demoralising the host and put him in irons. Ju Shou warns against splitting the army; you do not use that either.\n\n"
          + 'On the night Wuchao burns, Zhang He begs to relieve it and Guo Tu begs to storm Guandu. Two counsels, and you take half of each: light horse to Wuchao, the weight of the army against Guandu. Both fail.\n\n'
          + 'The army breaks and comes home. Someone tells Tian Feng he will surely be honoured now. "If the army had won, I would have lived," he says. "It lost. I shall die." You come back and say: "I did not use Tian Feng\'s words, and now he will laugh at me." So you have him killed.',
      },
      verdictZh:
        '論曰:紹有冀青幽并四州之地,帶甲數十萬,謀臣如雨,猛將如雲 —— '
        + '而所以敗者,以其能聚人而不能用人也。'
        + '田豐、沮授之言,非不聞也,聞而惡之;郭圖、審配之言,非不知其非也,'
        + '知而樂之。故曰:亡袁氏者,袁氏也,非曹氏。',
      verdictEn:
        'The historian says: he held four provinces, tens of thousands under arms, counsellors like rain and captains like cloud — and he lost because he could gather men and could not use them. He heard Tian Feng and Ju Shou; hearing them, he disliked them. He knew Guo Tu and Shen Pei were wrong; knowing it, he enjoyed them. What destroyed the house of Yuan was the house of Yuan.',
      verdictLostZh:
        '論曰:官渡既敗,發病嘔血;而三子爭立,河北遂為他人所有。'
        + '一敗未足以亡國,亡之者,敗後之三年也。',
      verdictLostEn:
        'The historian says: after Guandu he sickened and vomited blood; his three sons quarrelled over the succession, and Hebei passed to another house. One defeat does not end a state. What ended it was the three years after the defeat.',
    },
    sun: {
      defeat: {
        titleZh: '面如此,尚可復建功立事乎',
        titleEn: 'With a Face Like This, Can a Man Still Do Anything?',
        textZh:
          '策為人美姿顏,好笑語,性闊達聽受,善於用人 —— 士民見者,莫不盡心,樂為致死。'
          + '五年之間,盡有江東六郡。\n\n'
          + '而許貢之客三人,伏於丹徒西山,射之中頰。創甚,引鏡自照,'
          + '謂左右曰:「面如此,尚可復建功立事乎!」椎几大奮,創皆分裂,'
          + '其夜卒 —— 年二十六。\n\n'
          + '呼權佩以印綬,曰:「舉江東之眾,決機於兩陣之間,與天下爭衡,卿不如我;'
          + '舉賢任能,各盡其心,以保江東,我不如卿。」',
        textEn:
          'He was handsome, quick to laugh, open to what he was told, and good at using men — those who met him gave him everything and were glad to die for him. In five years he took the six commanderies of the east.\n\n'
          + "Then three retainers of Xu Gong lie in wait in the western hills at Dantu and put an arrow through his cheek. The wound is bad. He calls for a mirror, looks, and says to those around him: 'With a face like this, can a man still do anything?' He strikes the table and heaves himself up; every wound splits open; he dies that night, aged twenty-six.\n\n"
          + "He calls Quan and hangs the seals on him: 'To lead the host of the east, to decide the moment between two battle lines and contend with the realm — in that you are not my equal. To raise up the worthy and use the able, so that each gives you his whole heart and the east is kept — in that I am not yours.'",
      },
      verdictZh:
        '論曰:策英氣傑濟,猛銳冠世,覽奇取異,志陵中夏 —— 而輕佻果躁,'
        + '殞身致敗。夫以匹夫之勇取江東,亦以匹夫之身失之:'
        + '「性不好眾,常獨行」,是其取禍之道也。',
      verdictEn:
        'The historian says: his spirit was high, his edge unmatched in his age, his eye for the extraordinary sure, and his ambition reached into the central plain — and he was rash and quick-tempered, and it killed him. He took the east on personal daring and lost it the same way. He did not like company and rode out alone: that, and not the arrow, was the road to his ruin.',
      verdictLostZh:
        '論曰:江東之基,兄取之而弟守之。'
        + '取之者以勇,守之者以人 —— 兄弟二人合為一世,天下乃有三分。',
      verdictLostEn:
        'The historian says: the elder brother took the east and the younger kept it. One did it by daring, the other by handling men. Between the two of them they made one whole reign — and because of that, the realm had three parts instead of two.',
    },
    'liu-bei': {
      defeat: {
        titleZh: '妻子屢陷,而終不為人下',
        titleEn: 'He Lost His Family Again and Again, and Never Served',
        textZh:
          '徐州再失,妻子為曹公所虜,關羽降於下邳 —— 而備身走青州,轉投袁紹。'
          + '此非第一次:呂布襲下邳,妻子已陷一次;曹公東征,又陷一次。\n\n'
          + '半生流離,所至皆客:公孫瓚、陶謙、呂布、曹操、袁紹、劉表 —— '
          + '六易其主,而未嘗為人所有。\n\n'
          + '曹公曾與之論天下英雄,曰:「今天下英雄,唯使君與操耳。」'
          + '備方食,失匕箸。而後終身,他所做的每一件事,都在證明那句話。',
        textEn:
          'Xu province is lost a second time, your wife and children taken by Cao, Guan Yu surrendered at Xiapi — and you ride for Qing province and go over to Yuan Shao. It is not the first time: Lü Bu took Xiapi and your family with it once already; Cao came east and took them again.\n\n'
          + 'Half a life on the road, a guest everywhere you go: Gongsun Zan, Tao Qian, Lü Bu, Cao Cao, Yuan Shao, Liu Biao — six lords, and never once anyone\'s man.\n\n'
          + 'Cao Cao once talked over the heroes of the age with you and said: "The heroes of the realm today are you, sir, and Cao." You were eating; you dropped your chopsticks. Everything you did for the rest of your life was an argument that he was right.',
      },
      verdictZh:
        '論曰:備之為人,弘毅寬厚,知人待士,蓋有高祖之風,英雄之器焉。'
        + '機權幹略,不逮魏武,是以基宇亦狹 —— 然折而不撓,終不為下者,'
        + '抑揆彼之量必不容己,非唯競利,且以避害云爾。',
      verdictEn:
        'The historian says: he was broad, firm, and generous, he knew men and treated his officers well; there was something of the Exalted Founder in him, the shape of a hero. In craft and calculation he fell short of Cao, and so his ground was always narrow. But he bent and never broke, and never in the end served another — knowing, one supposes, that the other man\'s measure would never leave room for him. Not ambition alone, then: also survival.',
      verdictLostZh:
        '論曰:一生六易其主,而世不以為反覆者,以其所守者一。'
        + '所守者何?不為人下而已。',
      verdictLostEn:
        'The historian says: he changed lords six times and no one calls him a turncoat, because through all of it he kept one thing. What thing? Only this: he would not be another man\'s subordinate.',
    },
    'liu-biao': {
      defeat: {
        titleZh: '二子爭立,舉州以降',
        titleEn: 'Two Sons, One Surrender',
        textZh:
          '官渡相持,袁紹求援 —— 你許之而不至;曹操與紹相拒於官渡,'
          + '從事中郎韓嵩、別駕劉先勸你「舉州以附曹公」,蒯越亦勸之。你猶豫不決。\n\n'
          + '八年之間,荊州獨安:兵不出境,士人南奔者以萬計,學官立而詩書行。'
          + '而八年之後,你臥病;蔡氏立琮而黜琦;曹公南下,琮舉州降 ——'
          + '十萬之眾,未嘗一戰而易主。\n\n'
          + '你一生沒有做錯任何一件小事,只錯過了一件大事:那八年,天下正在分。',
        textEn:
          'While the lines hold at Guandu, Yuan Shao asks for help — you promise it and send none. Han Song and Liu Xian urge you to bring the whole province over to Cao; Kuai Yue urges the same. You cannot decide.\n\n'
          + 'For eight years Jing province alone is at peace: no army crosses its border, the displaced come south in their tens of thousands, schools are founded and the classics taught.\n\n'
          + 'And after eight years you take to your bed; the Cai family enthrones Cong and puts Qi aside; Cao comes south and Cong surrenders the province entire. A hundred thousand men change masters without a battle.\n\n'
          + 'You never got a small thing wrong in your life. You missed one large thing: during those eight years, the realm was being divided.',
      },
      verdictZh:
        '論曰:表雍容有威儀,而所守者一州之靜。'
        + '夫靜者,治世之美德,亂世之惰名也。'
        + '袁曹相持於官渡,天下之勢在此一舉,而表擁十萬之眾,坐觀其成敗 ——'
        + '成敗既分,則觀者亦在所分之中矣。',
      verdictEn:
        'The historian says: he was dignified and imposing, and what he guarded was the quiet of one province. Quiet is a virtue in a settled age and a name for sloth in a broken one. While Yuan and Cao locked at Guandu the whole realm turned on that one throw, and he sat with a hundred thousand men and watched to see who won. Once the winner is decided, the watcher is part of what gets divided.',
      verdictLostZh:
        '論曰:守成者不敗於敵,敗於子。'
        + '八年之積,一紙降書而盡 —— 所積者財,所不積者人心之屬。',
      verdictLostEn:
        'The historian says: the man who only holds is not undone by his enemies but by his heirs. Eight years of accumulation ended with one letter of surrender: he had stored up wealth and not the loyalty that decides where it goes.',
    },
    'liu-zhang': {
      defeat: {
        titleZh: '父子在州二十餘年,無恩德以加百姓',
        titleEn: 'Twenty Years in This Province, and No Kindness Done',
        textZh:
          '張魯據漢中而不奉命,你殺其母及弟 —— 於是漢中與益州為讎。'
          + '曹公將征張魯,你懼;張松勸迎劉備以拒之,你從之。\n\n'
          + '及備反攻,雒城守一年而破,成都尚有精兵三萬,穀帛支一年,'
          + '吏民咸欲死戰 —— 而你曰:「父子在州二十餘年,無恩德以加百姓;'
          + '百姓攻戰三年,肌膏草野者,以璋故也,何心能安!」遂開城出降。\n\n'
          + '群下莫不流涕。你走出成都那一日,是這一州二十餘年來,'
          + '第一次有人替百姓算過帳。',
        textEn:
          'Zhang Lu holds Hanzhong and will not obey; you kill his mother and his brother, and from then on Hanzhong and Yi are blood enemies. When Cao moves against Zhang Lu you take fright, and when Zhang Song urges you to bring in Liu Bei to shield you, you do it.\n\n'
          + 'When Bei turns on you, Luocheng holds a year before it falls. Chengdu still has thirty thousand good troops and a year of grain and cloth, and the officials and people all want to fight to the end — and you say: "Father and son, we have held this province more than twenty years, and done its people no kindness. They have fought three years, and their flesh has manured the wild grass, because of Zhang. How can I be easy in my mind?" And you open the gates.\n\n'
          + 'Not a man of your household could keep from weeping. The day you walked out of Chengdu was the first time in twenty years that anyone had done the arithmetic on the people\'s side.',
      },
      verdictZh:
        '論曰:璋闇弱,而非無仁。'
        + '成都尚可守一年而出降,史稱其「無恩德以加百姓」—— 此語出於其口,'
        + '而後世引之以譏其闇。然當日城中吏民願死戰者,正是他所謂無恩之百姓也。'
        + '闇者失其國,而仁者不失其心 —— 二者可以並存,亦可以並亡。',
      verdictEn:
        'The historian says: he was weak, and not without mercy. Chengdu could have held another year and he opened it; the line about having done the people no kindness is his own, and later ages quote it to mock his weakness. Yet the officials and people who wanted to fight to the death that day were the very people he said he had done nothing for. A weak man loses his state; a merciful one does not lose their goodwill. Both can be true, and both can end.',
      verdictLostZh:
        '論曰:引虎自衛者,虎入而主易。'
        + '張松、法正之謀,非備之能取,乃璋自開之也。',
      verdictLostEn:
        'The historian says: bring in a tiger to guard your house and the tiger becomes the householder. Zhang Song and Fa Zheng did not deliver the province to Liu Bei by their cleverness — Liu Zhang opened the door.',
    },
    'ma-teng': {
      defeat: {
        titleZh: '關中十部',
        titleEn: 'The Ten Companies of Guanzhong',
        textZh:
          '關中諸將十部:馬騰、韓遂、楊秋、李堪、成宜、張橫、梁興、侯選、程銀、馬玩 —— '
          + '各擁部曲,互為盟讎,而無一人能統之。曹公遣鍾繇撫關中,'
          + '騰遣子超領其部曲,而自入朝為衛尉。\n\n'
          + '這是一筆算不清的帳:入朝則兵權旁落,不入則名為叛。你選了入朝,'
          + '而超反於關中 —— 於是三族俱夷。\n\n'
          + '關中之兵甲天下,而關中之主未嘗有天下:十部者,十個為別人打仗的人。',
        textEn:
          'Ten companies held Guanzhong: Ma Teng, Han Sui, Yang Qiu, Li Kan, Cheng Yi, Zhang Heng, Liang Xing, Hou Xuan, Cheng Yin, Ma Wan — each with his own retainers, allies one year and enemies the next, and not one of them able to command the rest. Cao Cao sent Zhong Yao to settle the region; you gave your troops to your son Chao and went to court as Commandant of the Guards.\n\n'
          + 'It was a sum that would not come out. Go to court and your army passes to someone else; refuse and you are a rebel. You went — and Chao revolted in Guanzhong, and three degrees of your family died for it.\n\n'
          + 'The soldiers of Guanzhong were the best in the realm, and no lord of Guanzhong ever held it. Ten companies: ten men fighting other men\'s wars.',
      },
      verdictZh:
        '論曰:關中十部,兵強而無主。'
        + '強者不能相下,故無一能成;而其地扼隴蜀之衝,天下欲取中原者必先安之。'
        + '是以關中常為勝負之資,而不為勝負之家。',
      verdictEn:
        'The historian says: ten companies in Guanzhong, strong in arms and with no master. The strong would not defer to one another, so none of them came to anything — and their country sits astride the road between Long and Shu, so whoever wants the central plain must settle it first. Guanzhong was always the stake in the game and never one of the players.',
      verdictLostZh:
        '論曰:騰之入朝,非不智也,勢不得已耳。'
        + '邊將之於朝廷:不入則疑,入則質。此非一人之過,是一代之制。',
      verdictLostEn:
        'The historian says: going to court was not stupidity, it was the only move left. For a frontier general the court offers two options: stay away and be suspected, or come in and be a hostage. That is not one man\'s failing; it is the shape of the age.',
    },
    wuhuan: {
      defeat: {
        titleZh: '白狼山',
        titleEn: 'White Wolf Mountain',
        textZh:
          '蹋頓驍武,為烏丸諸部所服,袁紹矯制賜其單于印綬 —— 袁氏兄弟敗走,'
          + '遂奔遼西依之。你欲為之復河北,如當年冒頓之於漢。\n\n'
          + '而曹公用郭嘉之言,輕兵兼道,出盧龍塞,塹山堙谷五百餘里,'
          + '卒然登白狼山,與虜遇。眾甚盛,而軍在後,被甲者少 —— '
          + '曹公登高望之,見虜陣不整,乃縱兵擊之,使張遼為先鋒。\n\n'
          + '虜眾大崩,斬蹋頓於陣。胡漢降者二十餘萬口。自此三郡烏丸,'
          + '為天下名騎 —— 為別人的名騎。',
        textEn:
          "Tadun was fierce and able and the Wuhuan tribes deferred to him; Yuan Shao had forged an edict granting him the seals of a chanyu. When the Yuan brothers were beaten they fled to Liaoxi and took shelter with him, and he meant to win Hebei back for them, as the Xiongnu once did for a Han claimant.\n\n"
          + 'Then Cao Cao took Guo Jia\'s advice, went light and fast out through the Lulong pass, cut through hills and filled valleys for five hundred li, and came suddenly onto White Wolf Mountain and into contact. The tribal host was very large; his own baggage was far behind and few of his men were even in armour. He climbed for a look, saw the tribal line was ragged, and loosed his troops with Zhang Liao at the point.\n\n'
          + 'The host broke utterly and Tadun was killed in the ranks. Two hundred thousand Hu and Han came in and surrendered. From that day the Wuhuan of the three commanderies were the most famous cavalry in the realm — somebody else\'s famous cavalry.',
      },
      verdictZh:
        '論曰:烏丸之強,強於騎;其亡,亡於為人之援。'
        + '袁氏之敗,非烏丸之事,而蹋頓以一部之眾當中國之師,是代人受禍也。'
        + '故曰:外族之興衰,常繫於所依之人,而不繫於己。',
      verdictEn:
        'The historian says: the Wuhuan were strong in horse and were destroyed for being someone else\'s reinforcement. The fall of the Yuan was no business of theirs, and Tadun took the field against the armies of the middle realm on their behalf. The rise and fall of a border people usually turns on whom they lean against, not on themselves.',
      verdictLostZh:
        '論曰:白狼一戰,三郡烏丸盡為魏之精騎。'
        + '其眾未嘗少,其名未嘗墜 —— 所失者,只是為誰而戰。',
      verdictLostEn:
        'The historian says: after White Wolf Mountain the Wuhuan of the three commanderies became the finest cavalry of Wei. Their numbers did not shrink and their name did not fall. What they lost was the answer to the question of whom they fought for.',
    },
  },
  /* ── 208 赤壁之戰 ────────────────────────────────────────────────
     這張盤的題目是**一場火之後,天下為什麼變成三塊**。
     八家的敗法寫的都是那一年他們各自站在哪個位置上 —— 而位置決定了
     他們此後二十年只能是什麼。 */
  'scn-208-chibi': {
    cao: {
      defeat: {
        titleZh: '孤燒船自退,橫使周瑜虛獲此名',
        titleEn: 'I Burned the Ships Myself',
        textZh:
          '八十萬眾,舳艫千里,旌旗蔽空。橫槊賦詩於江上,曰:「月明星稀,烏鵲南飛。」'
          + '而後有人說:此不祥之言也。\n\n'
          + '大疫,吏士多死者,乃引軍還。後與孫權書曰:「赤壁之役,值有疾病,'
          + '孤燒船自退,橫使周瑜虛獲此名。」\n\n'
          + '這句話是真的,也是假的。真的是船確實是自己燒的;假的是 ——'
          + '從那一年起,他再也沒有渡過長江。',
        textEn:
          'Eight hundred thousand men, prows and sterns for a thousand li, banners blotting out the sky. He wrote a poem on the river with his spear across his knees: "The moon is bright, the stars few; the crows fly south." Someone said afterwards that this was an unlucky line.\n\n'
          + 'Then plague, and many of the officers and men died, and he led the army home. Later he wrote to Sun Quan: "At Red Cliffs there was sickness. I burned my own ships and withdrew, and let Zhou Yu take the credit for nothing."\n\n'
          + 'The sentence is true and it is false. True, because he did burn the ships himself. False, because from that year on he never crossed the Yangtze again.',
      },
      verdictZh:
        '論曰:操之取荊州,不血刃而得十萬之眾;及其敗於赤壁,亦不失一州之地。'
        + '然天下三分之勢,自此而定 —— 兵未大損而勢已判者,'
        + '以其所失者非兵,是**時**也。此後二十年,他每一次南下,對面都多了一個國家。',
      verdictEn:
        'The historian says: he took Jing province without a fight and a hundred thousand men with it; and when he lost at Red Cliffs he did not lose a single province. Yet the realm split in three from that night — the army was not much reduced, and the shape of the age was decided anyway. What he lost was not troops but the hour. For the next twenty years, every time he came south there was one more state on the other bank.',
      verdictLostZh:
        '論曰:江之為險,不在水,在人。'
        + '北人不習水戰,而連鎖其舟以求安 —— 求安者,火之所待也。',
      verdictLostEn:
        'The historian says: the river is not a barrier because of the water but because of the men on it. Northerners cannot fight afloat, so he chained his hulls together for steadiness. Steadiness is exactly what a fire waits for.',
    },
    sun: {
      defeat: {
        titleZh: '拔刀斫案',
        titleEn: 'He Cut the Corner off the Table',
        textZh:
          '曹操書至:「今治水軍八十萬眾,方與將軍會獵於吳。」群下皆失色,'
          + '議者咸曰宜迎之。獨魯肅不言,權起更衣,肅追於宇下 —— '
          + '「眾人皆可降曹,唯將軍不可。」\n\n'
          + '及周瑜自鄱陽還,曰:「操雖託名漢相,其實漢賊也。將軍以神武雄才,'
          + '兼仗父兄之烈,割據江東,地方數千里,兵精足用,英雄樂業,尚當橫行天下 ——'
          + '請得精兵三萬人,進住夏口,保為將軍破之。」\n\n'
          + '權拔刀斫前奏案曰:「諸將吏敢復有言當迎操者,與此案同!」\n\n'
          + '那一刀,是他二十七歲那年砍下去的。',
        textEn:
          'Cao Cao\'s letter arrives: "I have eight hundred thousand marines in training and propose to join Your Lordship for a hunt in Wu." The court goes pale; every voice says receive him. Only Lu Su says nothing — and when Quan rises to change his clothes, follows him under the eaves: "Any of us may surrender to Cao. Only Your Lordship may not."\n\n'
          + 'Then Zhou Yu comes back from Poyang: "Cao borrows the name of Han\'s chancellor and is Han\'s traitor. Your Lordship has divine martial talent, the legacy of a father and a brother, a thousand miles of the east, good troops and men glad to serve — you should be ranging the realm. Give me thirty thousand picked men, let me hold Xiakou, and I will break him for you."\n\n'
          + 'Quan drew his sword and cut the corner off the memorial table: "The next officer who says receive him goes the way of this table."\n\n'
          + 'He was twenty-seven the year he made that cut.',
      },
      verdictZh:
        '論曰:權之為人,屈身忍辱,任才尚計,有勾踐之奇 —— 而赤壁之決,'
        + '獨在一刀。夫議者眾而決者一,國之存亡,常繫於**肯不肯獨斷**的那一刻。'
        + '及其晚年,信讒賊,殺賢良,則又非復當日斫案之人矣。',
      verdictEn:
        'The historian says: he could bend, endure humiliation, use talent and prize calculation — there was something of King Goujian in him. And the decision at Red Cliffs came down to one sword-stroke. Many advise; one decides. A state usually lives or dies on whether its lord is willing to decide alone. In his last years he listened to slanderers and killed good men, and was no longer the man who cut that table.',
      verdictLostZh:
        '論曰:江東之守,守的不是江,是那一句「唯將軍不可降」。'
        + '降則為列侯,守則為敵國 —— 而他選了後者,那一年他二十七歲。',
      verdictLostEn:
        'The historian says: what the east defended was not the river but one sentence — "Only Your Lordship may not surrender." Surrender and be made a marquis; hold and be an enemy state. He chose the second, at twenty-seven.',
    },
    'liu-bei': {
      defeat: {
        titleZh: '當陽長阪,十餘萬眾',
        titleEn: 'A Hundred Thousand on the Road at Changban',
        textZh:
          '琮降,備走。過襄陽,或勸攻琮而取荊州,備曰:「吾不忍也。」'
          + '荊州士民多歸之,比到當陽,眾十餘萬,輜重數千兩,日行十餘里。\n\n'
          + '或謂備曰:「宜速行保江陵,今雖擁大眾,被甲者少,若曹公兵至,何以拒之?」'
          + '備曰:「夫濟大事必以人為本,今人歸吾,吾何忍棄去!」\n\n'
          + '曹公以精騎五千急追之,一日一夜行三百餘里,及於當陽之長阪。'
          + '備棄妻子,與諸葛亮、張飛、趙雲等數十騎走。\n\n'
          + '那十餘萬人,一個也沒有跟上來。',
        textEn:
          'Cong surrenders; Bei runs. Passing Xiangyang someone urges him to attack Cong and take the province. "I could not bear to," he says. The people of Jing follow him in numbers; by Dangyang there are a hundred thousand and more, several thousand baggage carts, ten li a day.\n\n'
          + 'Someone says: better to move fast and secure Jiangling. You have a great crowd but few of them are in armour. If Cao\'s troops come up, what will you hold them with? And he says: "To do any great thing you must have people as your foundation. These people have come to me. How can I bear to abandon them?"\n\n'
          + 'Cao Cao takes five thousand picked horse, covers three hundred li in a day and a night, and catches him on the long slope at Dangyang. Bei abandons his wife and children and rides off with Zhuge Liang, Zhang Fei, Zhao Yun and a few dozen horsemen.\n\n'
          + 'Not one of the hundred thousand caught up.',
      },
      verdictZh:
        '論曰:當陽之敗,兵法之至拙也;而備所以終有天下之半者,亦在此一拙。'
        + '夫十餘萬人日行十餘里,以待追騎,智者不為 —— 然自此之後,'
        + '天下皆知劉備所以異於曹操者何在。所失者妻子,所得者人心。',
      verdictEn:
        'The historian says: as generalship, Changban was as clumsy as it gets — and half the realm eventually came to him because of that clumsiness. To move a hundred thousand at ten li a day while cavalry closes is what no clever man does. But from that day everyone in the realm knew exactly how Liu Bei differed from Cao Cao. He lost his wife and children. He gained the thing that decides who men follow.',
      verdictLostZh:
        '論曰:三城三萬,而能與二強共分天下者,恃者非地非兵,恃孫劉之盟耳。'
        + '盟成則鼎立,盟解則無所歸 —— 此後二十年,他每一步都走在這條線上。',
      verdictLostEn:
        'The historian says: three cities and thirty thousand men, and he ended up dividing the realm with two great powers. What carried him was neither land nor troops but an alliance. With it, three kingdoms; without it, nowhere to stand. Every step of his next twenty years was walked along that line.',
    },
    'liu-biao': {
      defeat: {
        titleZh: '降書送出去時,一仗都沒打',
        titleEn: 'The Letter Went Out Before a Single Battle',
        textZh:
          '表卒,琮嗣。曹公南征,琮舉州降,而不告備。備至宛乃聞之。\n\n'
          + '荊州帶甲十餘萬,舟船數千,而未嘗一戰。蒯越、傅巽勸曰:'
          + '「逆順有大體,強弱有定勢。以人臣而拒人主,逆也;以新造之楚而御中國,'
          + '弱也;以劉備而敵曹公,不當也。三者皆短,欲以抗王師之鋒,必亡之道也。」\n\n'
          + '琮曰:「善。」\n\n'
          + '降之明年,曹公敗於赤壁。荊州十萬之眾,已在他人麾下,'
          + '正在江上燒著。',
        textEn:
          'Biao dies; Cong succeeds. Cao Cao comes south and Cong surrenders the province entire, without telling Bei — who hears of it only at Wan.\n\n'
          + 'Jing had a hundred thousand men under arms and thousands of hulls, and never fought once. Kuai Yue and Fu Xun advised him: "There is a great principle in rebellion and obedience, and a settled shape in strength and weakness. For a subject to resist his sovereign is rebellion; for a newly-made Chu to withstand the middle realm is weakness; for Liu Bei to be your match against Cao is not the case. Three counts against you, and you would meet the royal army with them. That is the road to certain ruin."\n\n'
          + 'And Cong said: "Very good."\n\n'
          + 'The year after the surrender, Cao lost at Red Cliffs. The hundred thousand men of Jing were already someone else\'s — and they were burning on the river.',
      },
      verdictZh:
        '論曰:琮之降,非怯也,理也 —— 蒯越所陳三事,無一不確。'
        + '然天下之事,有理而不可從者:荊州一降,而赤壁之火即為天下所共見。'
        + '早一年降,則十萬之眾為人所用;遲一年降,則其主自為一國。'
        + '成敗之際,不在理之明暗,在**時**之先後。',
      verdictEn:
        'The historian says: the surrender was not cowardice, it was reasoning — and every one of Kuai Yue\'s three points was correct. But there are matters in this world where the reasoning is sound and cannot be followed. Jing surrendered, and within the year the whole realm watched the fire on the river. Surrender a year early and your hundred thousand fight for someone else; hold a year longer and your house is a state. Between winning and losing, what counts is not the clarity of the argument but the order of events.',
      verdictLostZh:
        '論曰:父守之十八年,子棄之一日。'
        + '所守者非城池,是那十萬人願不願意為你死 —— 而那是問不出來的,只能試。',
      verdictLostEn:
        'The historian says: the father held it eighteen years and the son gave it away in one. What he was holding was never the walls: it was whether a hundred thousand men would die for him. You cannot ask that question. You can only find out.',
    },
    'liu-zhang': {
      defeat: {
        titleZh: '天下有變,而益州不動',
        titleEn: 'The Realm Moved. Yi Province Did Not.',
        textZh:
          '赤壁之火燒了三個月,消息傳到成都時,你正在議張魯。\n\n'
          + '別駕張松使於曹公,曹公不禮之;還,勸你絕曹而結劉備。'
          + '法正、孟達繼之。你以為得一外援,而外援看見的是一條路。\n\n'
          + '「今州中諸將龐羲、李異等皆恃功驕豪,欲有外意,'
          + '非得劉豫州,無以拒曹公也。」—— 說這話的人,'
          + '三年之後在成都城外替劉備畫地圖。',
        textEn:
          'The fire on the river burned for three months. When word of it reached Chengdu you were in council about Zhang Lu.\n\n'
          + 'Your aide Zhang Song went as envoy to Cao Cao, was treated with contempt, came home and urged you to break with Cao and take Liu Bei as a friend. Fa Zheng and Meng Da said the same. You thought you had acquired an ally. What the ally saw was a road.\n\n'
          + '"The generals of this province — Pang Xi, Li Yi and the rest — presume on their services and grow arrogant, and have thoughts of turning outward. Without the Governor of Yu we cannot hold off Cao Cao." The man who said that was drawing maps for Liu Bei outside Chengdu three years later.',
      },
      verdictZh:
        '論曰:璋之引劉備,以拒曹操也 —— 而曹操終不能入蜀,劉備反據其國。'
        + '夫外援者,強於己則不可召。召之而勝,則其功不可賞;'
        + '召之而敗,則其禍不可解。益州之亡,亡於一封請兵的信。',
      verdictEn:
        'The historian says: he brought Liu Bei in to keep Cao Cao out — and Cao never did get into Shu, while Liu Bei took the country. An ally stronger than yourself must not be summoned. If he wins for you, there is no reward large enough; if he loses, there is no escape from the consequences. Yi province fell to a letter asking for troops.',
      verdictLostZh:
        '論曰:蜀道之險,拒得住十萬之師,拒不住一個帶著地圖的自己人。',
      verdictLostEn:
        'The historian says: the roads into Shu can hold off a hundred thousand men. They cannot hold off one of your own people carrying a map.',
    },
    'zhang-lu': {
      defeat: {
        titleZh: '寶貨倉庫,國家之有',
        titleEn: 'The Storehouses Belong to the State',
        textZh:
          '以鬼道教民,自號師君。其來學者,初皆名鬼卒;受本道已信,號祭酒。'
          + '諸祭酒皆作義舍,置義米肉,行路者量腹取足。'
          + '不置長吏,以祭酒為治 —— 民夷便樂之。雄據巴漢垂三十年。\n\n'
          + '及曹公西征,左右欲盡燒寶貨倉庫,魯曰:'
          + '「本欲歸命國家,而意未達;今之走,避銳鋒,非有惡意。'
          + '寶貨倉庫,國家之有。」遂封藏而去。\n\n'
          + '曹公入南鄭,見其封藏,甚嘉之 —— 拜鎮南將軍,封閬中侯,邑萬戶。',
        textEn:
          'He taught the people by the way of the spirits and called himself Lord Instructor. Those who came to learn were called ghost-soldiers at first; once they had taken the doctrine and believed, they were called libationers. Every libationer kept a charity house with rice and meat set out, and travellers took what they needed. There were no ordinary officials: the libationers governed, and Han and non-Han alike were happy with it. He held Ba and Han for nearly thirty years.\n\n'
          + 'When Cao came west, his people wanted to burn the treasuries and granaries. "My intent was always to give myself to the state, and it has not been understood. I am withdrawing from the point of the spear, not out of ill will. The treasuries and granaries belong to the state." So he sealed them and left.\n\n'
          + 'Cao entered Nanzheng, saw the seals, and was greatly pleased — General Who Guards the South, Marquis of Langzhong, ten thousand households.',
      },
      verdictZh:
        '論曰:魯以道術治民三十年,不置長吏而巴漢安 —— 亂世之中,'
        + '此亦一治法也。及其去,封藏而不焚,是知天下終有主。'
        + '故曰:能守者未必能有,能有者未必能保;而知所歸者,身名俱全。',
      verdictEn:
        'The historian says: he governed by doctrine for thirty years, appointed no regular officials, and Ba and Han were quiet — in a broken age that is one way of governing. And when he left he sealed the storehouses instead of burning them, knowing the realm would have a master in the end. Hence: the man who can hold need not be the man who can own, and the man who owns need not be the man who keeps. But the man who knows where to give himself keeps both his life and his name.',
      verdictLostZh:
        '論曰:五斗米之教,能聚民而不能聚兵。'
        + '義舍所養者行路之人,不是甲士。',
      verdictLostEn:
        'The historian says: the Way of Five Pecks of Rice could gather a people and not an army. What the charity houses fed were travellers, not armoured men.',
    },
    'ma-teng': {
      defeat: {
        titleZh: '衛尉之印,在許都',
        titleEn: 'The Seal of the Guard Lies in Xu',
        textZh:
          '建安十三年,徵騰入朝為衛尉,子超領其部曲。\n\n'
          + '這一年,曹操南下荊州;這一年,赤壁火起。而你在許都,'
          + '穿著九卿的朝服,聽著南方傳來的消息。\n\n'
          + '兩年後,超與韓遂反於關中。書至許都,而衛尉馬騰與其二子及宗族'
          + '二百餘口,同日皆死。\n\n'
          + '史書寫這件事只用了十一個字:「超之叛也,騰坐夷三族。」',
        textEn:
          'In the thirteenth year of Jian\'an he was summoned to court as Commandant of the Guards, and his son Chao took over his troops.\n\n'
          + 'That was the year Cao Cao came south into Jing province. That was the year of the fire at Red Cliffs. And he was in Xu, wearing the court robes of one of the Nine Ministers, listening to news from the south.\n\n'
          + 'Two years later Chao and Han Sui revolted in Guanzhong. The dispatch reached Xu, and Commandant Ma Teng, his two other sons and more than two hundred of his kin all died on the same day.\n\n'
          + 'The histories give the whole thing eleven characters: "Chao rebelled; Teng was accordingly exterminated to three degrees."',
      },
      verdictZh:
        '論曰:騰之入朝,身為質也;超之反,質乃死焉。'
        + '夫以子代父領兵,而父入為卿 —— 兩全之計也,而兩全者往往兩失。'
        + '關中十部,自此無首;涼州之騎,自此為魏之銳。',
      verdictEn:
        'The historian says: going to court made him a hostage, and his son\'s revolt killed the hostage. Leave the army to the son and take a minister\'s office yourself — a plan to have it both ways, and having it both ways usually means losing both. Guanzhong lost its head that day, and the horsemen of Liang became the edge of Wei.',
      verdictLostZh:
        '論曰:兵在子而身在朝,則命不在己。'
        + '不在己者,雖九卿之貴,亦質而已矣。',
      verdictLostEn:
        'The historian says: when the army is with your son and your body is at court, your life is not in your own hands. And a life not in your own hands is a hostage\'s, whatever rank it wears.',
    },
    'shi-xie': {
      defeat: {
        titleZh: '交州四十年',
        titleEn: 'Forty Years in Jiao',
        textZh:
          '燮體器寬厚,謙虛下士,中國士人往依避難者以百數。'
          + '耽玩春秋,為之注解。兄弟並為列郡,雄長一州,偏在萬里,威尊無上。\n\n'
          + '出入鳴鐘磬,備具威儀,笳簫鼓吹,車騎滿道,胡人夾轂焚燒香者常有數十。'
          + '妻妾乘輜軿,子弟從兵騎 —— 當時貴重,震服百蠻,尉他不足踰也。\n\n'
          + '而每歲遣使詣權,貢雜香細葛、明珠大貝、流離翡翠、玳瑁犀象之珍,'
          + '無歲不至。四十年不見兵革 —— 在那個時代,這是一件更難的事。',
        textEn:
          'Xie was broad and generous in temper, modest to men of learning; scholars fleeing the middle realm came to him by the hundred. He was fond of the Spring and Autumn Annals and wrote a commentary on it. His brothers held the neighbouring commanderies, he was master of a whole province ten thousand li from anywhere, and his authority had nothing above it.\n\n'
          + 'He went out to bells and chimes in full ceremony, with reed pipes and drums, the road packed with carriages and riders, and often dozens of foreigners burning incense alongside his wheels. His wives rode in curtained carts, his sons and juniors had mounted escorts — the grandest man of his day, and the hundred southern peoples were in awe of him.\n\n'
          + 'And every year he sent envoys to Sun Quan with mixed incense and fine hemp, bright pearls and great shells, glass and kingfisher plumes, tortoiseshell, rhinoceros horn and ivory. Not one year was missed. Forty years without seeing war — in that age, the harder achievement.',
      },
      verdictZh:
        '論曰:燮在交州四十餘年,中國喪亂而一州獨全,士人避難者百數 ——'
        + '此非兵之功,是**歲貢不絕**之功也。'
        + '知其力不足以爭,而以禮自存,故能保其民,亦能保其身。'
        + '及其子徽不奉命,呂岱一至而族滅 —— 父之所以存者,子不知也。',
      verdictEn:
        'The historian says: he was in Jiao more than forty years; the middle realm tore itself apart and one province came through whole, with refugee scholars by the hundred. That was not the achievement of his soldiers but of tribute paid every single year without fail. Knowing his strength was not enough to contend, he kept himself by ceremony, and so kept his people and his own life. When his son Hui disobeyed, Lü Dai came once and the family was wiped out. What preserved the father, the son never understood.',
      verdictLostZh:
        '論曰:遠者可以自存,不可以自大。'
        + '萬里之外,威尊無上,而所恃者不過一封歲貢的表。',
      verdictLostEn:
        'The historian says: distance lets a man survive; it does not let him grow great. Ten thousand li out, with no authority above him, what he actually stood on was one tribute memorial a year.',
    },
  },
  /* ── 195 孫策定江東 ────────────────────────────────────────────
     一城九千五百兵,對面是四家各守一郡的太守。這張盤的題目是
     **一個沒有地盤的人怎麼在五年之內拿到一個國家** ——
     而十三家的敗法,寫的是他們各自為什麼沒能做到同一件事。 */
  'scn-195-jiangdong': {
    sun: {
      defeat: {
        titleZh: '質玉璽,借兵千餘',
        titleEn: 'A Seal in Pledge, a Thousand Men on Loan',
        textZh:
          '父死時你十七歲。扶柩還葬曲阿,居江都,而後以父之傳國璽質於袁術,'
          + '得兵千餘、騎數十。渡江之日,眾已五六千。\n\n'
          + '所至皆下:劉繇走豫章,嚴白虎奔餘杭,王朗浮海而遁,華歆葛巾迎於道左。'
          + '軍令嚴整,不敢虜略,雞犬菜茹,一無所犯 —— 民乃大悅,'
          + '競以牛酒詣軍。\n\n'
          + '而那一千人是借的。借的東西要還,或者要用比它更大的東西換掉。'
          + '你沒能活到換掉它的那一天。',
        textEn:
          "You were seventeen when your father died. You brought the coffin home to Qua, settled at Jiangdu, and then pledged your father's imperial seal to Yuan Shu for a thousand foot and a few dozen horse. By the day you crossed the river you had five or six thousand.\n\n"
          + 'Everything fell: Liu Yao ran to Yuzhang, Yan Baihu bolted to Yuhang, Wang Lang put to sea, Hua Xin came out to the roadside in a plain kerchief. Your orders were strict and nothing was looted — not a chicken, not a vegetable plot — and the people were delighted and came to the camp with cattle and wine.\n\n'
          + 'But the thousand men were borrowed. Borrowed things have to be given back, or replaced with something bigger. You did not live to the day of the replacement.',
      },
      verdictZh:
        '論曰:策以孤身渡江,五年而有六郡 —— 天下之速,無過於此者。'
        + '所恃者三:父之舊部、周瑜之交、及軍令之不犯民。'
        + '然輕而無備,性不好眾,常單騎出獵 —— 二十六歲死於三客之手。'
        + '創業之速與殞身之速,同出一源。',
      verdictEn:
        'The historian says: he crossed the river alone and held six commanderies in five years — nothing in the age moved faster. Three things carried him: his father\'s veterans, his friendship with Zhou Yu, and orders his soldiers did not dare break against civilians. But he went about lightly and without guard, disliked company, and rode out hunting alone — and died at twenty-six at the hands of three retainers. The speed with which he built and the speed with which he died came from the same thing.',
      verdictLostZh:
        '論曰:借兵者,其權在人。'
        + '策之絕袁術,在術僭號之後 —— 若術不僭,則江東之主終為術之部將耳。',
      verdictLostEn:
        "The historian says: a man who borrows an army holds it at someone else's pleasure. Sun Ce broke with Yuan Shu only after Shu took the imperial title. Had Shu not overreached, the lord of the east would have finished his life as Shu's subordinate officer.",
    },
    'liu-yao': {
      defeat: {
        titleZh: '揚州刺史,而無揚州',
        titleEn: 'Inspector of Yang, without Yang',
        textZh:
          '你是漢室宗親,朝廷所命的揚州刺史 —— 而袁術先據壽春,'
          + '你連治所都進不去,渡江寄治曲阿。\n\n'
          + '許劭勸你用太史慈,你曰:「我若用子義,許子將不當笑我邪?」'
          + '乃使慈偵視輕重而已。而神亭一戰,慈與策獨鬥,'
          + '策刺慈馬,攬得慈項上手戟,慈亦得策兜鍪 —— 那是你手上最好的一張牌,'
          + '你只讓他去看了看。\n\n'
          + '兵敗走豫章,病卒。年四十二。',
        textEn:
          'You were of the imperial house and the court\'s appointed Inspector of Yang — and Yuan Shu held Shouchun first, so you could not even enter your own seat, and crossed the river to govern from Qua.\n\n'
          + 'Xu Shao urged you to use Taishi Ci. "If I employ Ziyi," you said, "won\'t Xu Zijiang laugh at me?" So you sent him only to scout and report. And at Shenting he fought Sun Ce hand to hand — Ce speared his horse and took the short halberd from his neck, and Ci got Ce\'s helmet. That was the best card in your hand, and you used it to look at things.\n\n'
          + 'Beaten, you fled to Yuzhang and died of illness, aged forty-two.',
      },
      verdictZh:
        '論曰:繇以名義臨揚州,而不能用一太史慈 —— 所畏者,士林之議耳。'
        + '夫亂世用人,問其能不能,不問人笑不笑。'
        + '一問之差,而江東易主。',
      verdictEn:
        "The historian says: he came to Yang province with the court's authority and could not bring himself to use one Taishi Ci — what he feared was what the literary set would say. In a broken age you ask whether a man can do the thing, not whether people will laugh. One wrong question, and the east changed hands.",
      verdictLostZh:
        '論曰:有名而無實者,亂世之至危。'
        + '名足以招敵,而實不足以拒之。',
      verdictLostEn:
        'The historian says: to have the title and not the substance is the most dangerous position in a broken age. The title is enough to draw enemies and the substance is not enough to hold them off.',
    },
    'wang-lang': {
      defeat: {
        titleZh: '浮海而遁',
        titleEn: 'Away by Sea',
        textZh:
          '你是會稽太守,而孫策已破劉繇。功曹虞翻勸你避之,你不聽 ——'
          + '「吾為漢吏,宜保城邑。」乃出兵拒策於固陵。\n\n'
          + '策數渡水戰,不能克。其叔孫靜曰:「王朗負阻城守,難可卒拔。'
          + '查瀆南去此數十里,而道之要徑也,宜從彼據其內。」策從之,'
          + '夜多然火以為疑兵,分軍夜投查瀆道 —— 襲高遷屯。朗大駭。\n\n'
          + '兵敗浮海,至東冶,又追破之。乃詣策降。策以其儒雅,詰讓而不害。\n\n'
          + '你守到了最後一刻,而後活了下來 —— 二十七年後,'
          + '你是曹魏的司徒。',
        textEn:
          'You were Grand Administrator of Kuaiji, and Sun Ce had already broken Liu Yao. Your officer Yu Fan urged you to get out of the way, and you would not: "I am an officer of Han. I ought to hold my walls." So you took troops out and met him at Guling.\n\n'
          + 'Ce crossed the water again and again and could not carry it. His uncle Sun Jing said: "Wang Lang has the ground and the walls; he will not fall quickly. Zhadu is a few dozen li south of here and it is the key road — go round and take him from inside." Ce agreed, lit many fires by night as a decoy, sent a column down the Zhadu road, and fell on the camp at Gaoqian. You were badly shaken.\n\n'
          + 'Beaten, you put to sea, reached Dongye, and were run down again. So you went to Ce and surrendered. He rebuked you for your scholarship and let you live.\n\n'
          + 'You held to the last hour, and then you survived it — and twenty-seven years later you were Excellency over the Masses of Wei.',
      },
      verdictZh:
        '論曰:朗之拒策,非不知不敵也,以漢吏自任耳。'
        + '及其敗,不死不隱,受詰而不辱,終為魏之三公 ——'
        + '夫守節與惜身,世以為二事,而朗兼之。史家不能非之,亦不能全許。',
      verdictEn:
        'The historian says: he did not resist Sun Ce out of ignorance of the odds; he did it because he took the duties of a Han officer seriously. And when he lost he neither died nor went into hiding, took his dressing-down without disgrace, and ended as one of the Three Excellencies of Wei. Keeping faith and keeping one\'s skin are usually thought to be two different things. He managed both. A historian cannot condemn him for it and cannot entirely approve either.',
      verdictLostZh:
        '論曰:一郡之守,能拒策數月者,朗與嚴白虎耳。'
        + '而白虎以寇亡,朗以儒全 —— 同敗而異終。',
      verdictLostEn:
        'The historian says: only two men held Sun Ce off for months on one commandery — Wang Lang and Yan Baihu. Baihu ended as a bandit and Lang ended as a scholar of state. The same defeat, two different endings.',
    },
    'hua-xin': {
      defeat: {
        titleZh: '葛巾迎於道左',
        titleEn: 'A Plain Kerchief at the Roadside',
        textZh:
          '你是豫章太守。孫策略地至豫章,遣虞翻說你 ——'
          + '翻曰:「討逆將軍智略超世,用兵如神。府君無用兵之才,'
          + '不如避之。」\n\n'
          + '你曰:「久在江表,常欲北歸;孫會稽來,吾便去也。」'
          + '明日,葛巾迎策。策執其手,禮而用之。\n\n'
          + '豫章之民不知有兵。而後你北歸,歷魏三公,議禮定制,終為太尉。'
          + '史稱:「歆清純德素,誠一時之俊偉也。」\n\n'
          + '一座城可以守到最後一個人,也可以完好地交出去。'
          + '兩種都要有人做。',
        textEn:
          'You were Grand Administrator of Yuzhang. Sun Ce came into the commandery and sent Yu Fan to talk to you: "The General Who Punishes Rebels is a strategist beyond his age and uses troops like a spirit. Your Honour has no talent for war. Better to step aside."\n\n'
          + '"I have been south of the river a long time," you said, "and have long wanted to go north. Since the Kuaiji gentleman is coming, I shall go." Next day you met him in a plain kerchief. He took your hand, treated you with ceremony, and used you.\n\n'
          + 'Yuzhang never knew there had been an army. Later you went north, held three of the highest offices of Wei, settled its rites and institutions, and ended as Grand Commandant. The histories say: pure, plain and unornamented — one of the outstanding men of his time.\n\n'
          + 'A city can be held to the last man. It can also be handed over intact. Both need someone to do them.',
      },
      verdictZh:
        '論曰:歆之降,非怯也。度己之才不足以拒,而豫章之民無罪 ——'
        + '故一日而全一郡。世或譏其易主,然魏之典章,歆與有力焉。'
        + '夫守土者以死為節,治世者以成為功;所處不同,不可以一律繩之。',
      verdictEn:
        'The historian says: his surrender was not cowardice. He measured his own capacity, found it insufficient, and reflected that the people of Yuzhang had done nothing wrong — so a whole commandery came through in a day. Some sneer that he changed masters easily; yet the institutions of Wei owe a good deal to him. The man who holds ground makes death his standard; the man who governs makes results his. They stand in different places and cannot be measured with one rule.',
      verdictLostZh:
        '論曰:不戰而全一郡者,史書不記其功;而那一郡的人記得。',
      verdictLostEn:
        'The historian says: the histories keep no column for a commandery saved without a battle. The people of that commandery keep one.',
    },
    'yan-baihu': {
      defeat: {
        titleZh: '白虎群盜',
        titleEn: 'The White Tiger and His Bandits',
        textZh:
          '你不是朝廷所命的太守,是吳郡的宗帥 —— 聚眾萬餘,'
          + '據吳城,自號將軍。亂世之中,這也是一種立身之法。\n\n'
          + '孫策至,先遣弟嚴輿請和。策與輿共坐飲宴,'
          + '手戟擲之,輿應手而倒 —— 「吾聞其勇,故先試之。」\n\n'
          + '眾遂大懼。策攻之,一戰而破,白虎奔餘杭,'
          + '為許昭所庇。程普請討昭,策曰:「昭有義於舊君,'
          + '有誠於故友,此天下之丈夫也。」乃止。\n\n'
          + '你最後一次被史書提到,是在別人的義氣裡。',
        textEn:
          'You were no court-appointed administrator but a clan chief of Wu commandery — ten thousand men gathered, the city of Wu held, and the title of general taken for yourself. In a broken age that too is a way of standing up.\n\n'
          + 'When Sun Ce came, you first sent your brother Yan Yu to sue for terms. Ce sat drinking with him, threw a hand-halberd, and Yu went down where he sat. "I had heard he was brave, so I tested him first."\n\n'
          + 'Everyone was badly frightened after that. Ce attacked and broke you in a single battle; you fled to Yuhang and were sheltered by Xu Zhao. Cheng Pu asked to go after Zhao, and Ce said: "Zhao kept faith with his old lord and honour with an old friend. That is a man of the realm." And let it go.\n\n'
          + 'The last time the histories mention you, it is inside somebody else\'s loyalty.',
      },
      verdictZh:
        '論曰:白虎聚眾萬餘,而一戰即潰者,眾非其眾也。'
        + '宗帥之兵,合於利而散於危 —— 其興也速,其亡也無聲。',
      verdictEn:
        'The historian says: he gathered ten thousand and broke in one battle, because they were never really his. A clan chief\'s men come together for advantage and scatter at danger. Such a force rises quickly and ends without a sound.',
      verdictLostZh:
        '論曰:亂世之中,自號將軍者眾,而能傳之子孫者寡。'
        + '所異者一事:兵之來,為利乎,為義乎。',
      verdictLostEn:
        'The historian says: in a broken age many men call themselves general and few pass anything to their sons. One thing separates them: whether the soldiers came for gain or for a cause.',
    },
    'lu-bu': {
      defeat: {
        titleZh: '二城,而十一將',
        titleEn: 'Two Cities and Eleven Captains',
        textZh:
          '兗州反了又平,你走徐州。劉備以小沛處之,而你襲下邳,'
          + '反客為主 —— 這一年是你一生中兵最精、將最多、地最少的一年。\n\n'
          + '陳宮、高順、張遼、臧霸皆在麾下,而所據者二城。'
          + '轅門射戟,一箭解兩家之圍,天下稱其神 ——'
          + '而那一箭之後,你仍然只有二城。\n\n'
          + '「布,狼子野心,誠難久養。」說這句話的是陳宮,'
          + '而他最後與你同死於白門樓。',
        textEn:
          'Yan province rose and was retaken, and you went to Xu. Liu Bei parked you at Xiaopei, and you took Xiapi behind his back — the guest becoming the host. This was the year of your life with the best troops, the most captains, and the least ground.\n\n'
          + 'Chen Gong, Gao Shun, Zhang Liao, Zang Ba all under your banner — and two cities to your name. At the camp gate you shot the halberd and lifted a siege with one arrow, and the realm called it uncanny. After that arrow you still had two cities.\n\n'
          + '"Bu has a wolf\'s heart; he is hard to keep long." The man who said that was Chen Gong, and he died beside you on the White Gate Tower.',
      },
      verdictZh:
        '論曰:布有虓虎之勇,而無一定之謀 —— 反覆之間,所殺者皆其主。'
        + '故將雖精,而人不附;地雖得,而不能守。'
        + '陳登謂之「養虎當飽其肉,不飽則將噬人」,可謂知之。',
      verdictEn:
        'The historian says: he had a tiger\'s courage and no settled plan, and every man he killed had been his lord. So his captains were excellent and nobody trusted him; he took ground and could not hold it. Chen Deng said feeding a tiger means keeping it full, because a hungry one eats people. That was an accurate description.',
      verdictLostZh:
        '論曰:兵精將多而地狹者,必攻;攻而無信者,天下共棄之。',
      verdictLostEn:
        'The historian says: good troops, many captains, and no ground means you must attack. Attack without keeping faith, and the realm turns you out together.',
    },
    'yuan-shu': {
      defeat: {
        titleZh: '玉璽在手,而僭號在後',
        titleEn: 'The Seal in Hand, the Title Two Years Off',
        textZh:
          '孫堅之子以父璽質於你,借兵千餘 —— 你以為換來一個部將,'
          + '換來的是一個國家的開端。\n\n'
          + '南陽戶口百萬,壽春之富甲於淮南。而你所想的只有一件事:'
          + '「代漢者,當塗高也」—— 那句讖語裡的「塗」,你認定是「術」。\n\n'
          + '兩年後你僭號於壽春,而後眾叛親離。'
          + '孫策絕之,呂布絕之,曹操討之。',
        textEn:
          "Sun Jian's son pledged his father's seal to you for a thousand men. You thought you had acquired a subordinate officer. What you had acquired was the beginning of a state — someone else's.\n\n"
          + 'Nanyang had a million households and Shouchun was the richest place in Huainan. And you thought about one thing only: the old prophecy that "he who replaces Han stands on the high road" — and you had decided the character for road meant you.\n\n'
          + 'Two years later you took the title at Shouchun, and everyone left. Sun Ce broke with you. Lü Bu broke with you. Cao Cao came to punish you.',
      },
      verdictZh:
        '論曰:術以四世三公之資,據淮南之富,而所恃者一句讖語。'
        + '夫天命者,得之於人心,不得之於符讖。'
        + '借兵與孫策,得璽而失一國 —— 二者皆以為己有,而皆非己有。',
      verdictEn:
        'The historian says: with four generations of Excellencies behind him and the wealth of Huainan under him, what he actually relied on was a piece of doggerel. The mandate is won from what people think of you, not from prophecy. He lent troops to Sun Ce and got a seal and lost a country: he thought both were his, and neither was.',
      verdictLostZh:
        '論曰:天下未一而先正大位者,自絕於天下。',
      verdictLostEn:
        'The historian says: to take the title while the realm is still divided is to cut yourself off from it.',
    },
    cao: {
      defeat: {
        titleZh: '兗州未定,而天子在西',
        titleEn: 'Yan Not Yet Settled, and the Emperor in the West',
        textZh:
          '呂布之亂方平,兗州郡縣殘破,士民饑饉 —— 而你正在想一件更遠的事:'
          + '天子自長安東歸,道路艱阻,公卿相食。\n\n'
          + '荀彧曰:「昔晉文公納周襄王而諸侯景從,漢高祖為義帝縞素而天下歸心。'
          + '……誠因此時,奉主上以從民望,大順也。」\n\n'
          + '明年,你迎天子都許。而此刻,你手上只有一個殘破的兗州,'
          + '和一個還沒有人想到要去接的天子。',
        textEn:
          "Lü Bu's rising has just been put down; the commanderies of Yan are wrecked and the people are starving — and you are thinking about something further off: the Son of Heaven is coming east from Chang'an, the roads are impassable, and the ministers are eating each other.\n\n"
          + 'Xun Yu says: "When Duke Wen of Jin took in King Xiang of Zhou, the lords followed him like a shadow; when the Exalted Founder put on white for Emperor Yi, the realm turned to him... To seize this moment and serve the sovereign in accordance with what the people hope for — that is the great compliance."\n\n'
          + 'Next year you brought the emperor to Xu. Right now you hold one wrecked province, and an emperor nobody else has thought to collect.',
      },
      verdictZh:
        '論曰:操之興,不在官渡,在建安元年之迎天子。'
        + '夫奉天子以令不臣,名也;修耕植以畜軍資,實也。'
        + '名實既具,而後可以言取天下 —— 195 年他兩樣都還沒有。',
      verdictEn:
        'The historian says: his rise did not begin at Guandu but in the first year of Jian\'an, when he collected the emperor. To serve the Son of Heaven and command the disobedient is the name of the thing; to farm and store military supplies is the substance. Only with both can a man talk about taking the realm. In 195 he had neither.',
      verdictLostZh:
        '論曰:兗州殘破而不能守者,以其未有屯田也。'
        + '一歲之後,棗祗建議,而軍無饑年。',
      verdictLostEn:
        'The historian says: he could not hold a wrecked Yan because he had not yet begun the state farms. A year later Zao Zhi proposed them, and his army never had a hungry year again.',
    },
    'yuan-shao': {
      defeat: {
        titleZh: '河北四州,而不能決',
        titleEn: 'Four Provinces, and No Decision',
        textZh:
          '冀州已得,青州已定,公孫瓚困於易京,幽并指日可下 ——'
          + '天下之大,無人比你更近於一統。\n\n'
          + '沮授勸你迎天子於長安:「宜迎大駕,安宮鄴都,挾天子而令諸侯,'
          + '畜士馬以討不庭,誰能禦之?」而郭圖、淳于瓊曰:'
          + '「漢室陵遲,為日久矣,今欲興之,不亦難乎?」\n\n'
          + '你從了後者。次年,天子入許。',
        textEn:
          'Ji is taken, Qing is settled, Gongsun Zan is penned up at Yijing, and You and Bing are a short march away — no one in the realm stands closer to unifying it than you.\n\n'
          + 'Ju Shou urges you to collect the emperor from Chang\'an: "Receive the imperial carriage, settle the palace at Ye, hold the Son of Heaven and command the lords, feed your horses and punish those who do not attend — who could stand against you?" And Guo Tu and Chunyu Qiong say: "The house of Han has been sinking for a long time. To try to raise it now is surely hard."\n\n'
          + 'You listened to the second pair. The following year the emperor entered Xu.',
      },
      verdictZh:
        '論曰:紹失天子,非不知其利,乃不欲其煩 ——'
        + '迎之則事之,不迎則無所制。二者之間,他選了輕鬆的那一個。'
        + '四年之後,曹操以天子之名征之,而紹為叛臣。',
      verdictEn:
        'The historian says: he let the emperor go not because he could not see the advantage but because he did not want the inconvenience — collect him and you must serve him; leave him and you have nothing to command with. Between the two he chose the easy one. Four years later Cao Cao marched on him in the emperor\'s name, and he was the rebel.',
      verdictLostZh:
        '論曰:河北之強,強於地;其亡,亡於一議之不決。',
      verdictLostEn:
        'The historian says: Hebei was strong in land and fell on one undecided debate.',
    },
    'liu-biao': {
      defeat: {
        titleZh: '江漢之間,十八年',
        titleEn: 'Eighteen Years between the Han and the River',
        textZh:
          '你已經在襄陽七年。宗賊已平,江南已附,'
          + '士人南奔者以萬計 —— 學官立而詩書行於荊楚。\n\n'
          + '袁術在北,孫策在東,曹操在中原 —— 你與三者皆有隙,'
          + '而三者皆未及顧你。這十八年是買來的:'
          + '用不動兵買的。\n\n'
          + '而買來的東西,價錢要到最後一天才知道。',
        textEn:
          'You have been at Xiangyang seven years. The clan bandits are put down, the south has come in, refugee gentry arrive by the ten thousand — schools founded, the classics taught through Jing and Chu.\n\n'
          + 'Yuan Shu to the north, Sun Ce to the east, Cao Cao in the middle plain: you are on bad terms with all three and none of them has time for you yet. These eighteen years were bought — bought by not moving.\n\n'
          + 'And you never learn the price of a thing bought that way until the last day.',
      },
      verdictZh:
        '論曰:表之治荊州,可謂能矣;而所以終為人取者,'
        + '以其治之之法,正是不能取人之法。'
        + '守成之善者,亂世之至危 —— 因為別人不會停下來等你。',
      verdictEn:
        'The historian says: he governed Jing province ably, and it was taken from him in the end because the very method that governed it well was the method that could take nothing from anyone. Excellence at holding is the most dangerous thing to have in a broken age, because nobody else stops to wait for you.',
      verdictLostZh:
        '論曰:買來的太平,價在最後一天結。',
      verdictLostEn:
        'The historian says: peace bought that way is invoiced on the last day.',
    },
    'liu-yan': {
      defeat: {
        titleZh: '益州牧,子承其位',
        titleEn: 'The Governorship, Passed to a Son',
        textZh:
          '棧道已斷,漢使已絕,乘輿車具千餘乘已造 ——'
          + '而你在這一年病死,疽發背卒。\n\n'
          + '州大吏趙韙等貪璋溫仁,共上璋為益州刺史。'
          + '「溫仁」二字,是他們選他的理由,也是二十年後開城的理由。\n\n'
          + '你留下的那個國,比你想的要好守 —— 也比你想的要容易送人。',
        textEn:
          'The plank roads are cut, the imperial envoys are gone, a thousand carriages of imperial pattern have been built — and this is the year you die of an abscess on the back.\n\n'
          + 'The senior officers of the province, Zhao Wei and the rest, liked Zhang for being mild and kind, and jointly put him forward as Inspector of Yi. Mild and kind: their reason for choosing him, and twenty years later his reason for opening the gates.\n\n'
          + 'The state you left was easier to hold than you thought. It was also easier to give away.',
      },
      verdictZh:
        '論曰:焉創之以權術,璋守之以溫仁 —— 而益州卒歸於劉備。'
        + '夫創業者不可以無術,守成者不可以無威;'
        + '父有術而無仁,子有仁而無威,故二世而國移。',
      verdictEn:
        'The historian says: the father founded it by craft and the son kept it by mildness, and Yi province ended in Liu Bei\'s hands. A founder cannot do without craft and an heir cannot do without authority. The father had craft and no kindness; the son had kindness and no authority; so the state moved in two generations.',
      verdictLostZh:
        '論曰:選嗣以溫仁,是選一個不會殺人的人來守一塊人人想要的地。',
      verdictLostEn:
        'The historian says: to pick an heir for mildness is to pick a man who will not kill, to guard a country everyone wants.',
    },
    gongsun: {
      defeat: {
        titleZh: '界橋之後',
        titleEn: 'After Jieqiao',
        textZh:
          '白馬義從已喪於麴義之弩下,而你仍在河北與袁紹相持。'
          + '殺劉虞之後,幽州士民不附;部曲離散,謀臣稍遠。\n\n'
          + '你開始築樓 —— 一層,兩層,十層。'
          + '「兵法百樓不攻」,你這麼說的時候,身邊已經沒有幾個人在聽。',
        textEn:
          'The White Horse Volunteers are already gone under Ju Yi\'s crossbows, and you are still facing Yuan Shao across Hebei. Since you killed Liu Yu the people of You province have not warmed to you; your retainers drift away and your advisers keep their distance.\n\n'
          + 'You start building towers — one storey, two, ten. "The art of war says a hundred towers cannot be stormed," you say, and by then there are not many people left listening.',
      },
      verdictZh:
        '論曰:瓚殺劉虞而失幽州之心,自此雖有百樓,無與守者。'
        + '夫邊將之勇,足以破胡,不足以服士 —— 服士者,義也。',
      verdictEn:
        'The historian says: killing Liu Yu cost him the goodwill of You province, and after that a hundred towers had nobody to hold them. A frontier general\'s courage can break the northern tribes and cannot win over the gentry. What wins them is a cause.',
      verdictLostZh:
        '論曰:恃險者終於險。',
      verdictLostEn:
        'The historian says: the man who trusts in works ends inside them.',
    },
    'ma-teng': {
      defeat: {
        titleZh: '涼州十部,各自為兵',
        titleEn: 'Ten Companies, Ten Armies',
        textZh:
          '你與韓遂結為異姓兄弟,而後相攻;朝廷遣使和之,乃各罷兵。'
          + '關中十部,誰也統不了誰。\n\n'
          + '中原方亂,而你在西邊。天下之爭與你隔著一道潼關 ——'
          + '進不去,也沒有人打得進來。',
        textEn:
          'You and Han Sui swore brotherhood and then fought each other, until the court sent an envoy to make you stop. Ten companies in Guanzhong, and not one of them able to command the rest.\n\n'
          + 'The central plain is coming apart, and you are in the west. Between you and the contest stands the Tong pass — you cannot get through it, and nobody can get in.',
      },
      verdictZh:
        '論曰:關中之地,可以自守,不可以爭天下 ——'
        + '非其兵不強,是其人不一。十部各為其主,則十部皆為人用。',
      verdictEn:
        'The historian says: Guanzhong could keep itself and could not contest the realm — not because its soldiers were weak but because its men were not one. Ten companies each with its own master means ten companies for somebody else to use.',
      verdictLostZh:
        '論曰:兄弟而相攻者,朝廷和之;和之而不能一,則終為人所並。',
      verdictLostEn:
        'The historian says: sworn brothers who fight get reconciled by the court; reconciled but not united, they are absorbed in the end.',
    },
  },
  /* ── 234 五丈原 ─────────────────────────────────────────────────
     三家,而題目只有一個:**一個人能不能替一個國家延命。** */
  'scn-234-wuzhang': {
    shu: {
      defeat: {
        titleZh: '悠悠蒼天,曷此其極',
        titleEn: 'O Vast Heaven, Where Is the End of It',
        textZh:
          '出斜谷,據武功五丈原,與司馬懿對於渭南。懿堅壁不出 ——'
          + '亮遺懿巾幗婦人之服,懿怒,表請戰,而詔不許。\n\n'
          + '相持百餘日。其年八月,亮疾病,卒於軍,時年五十四。'
          + '及軍退,宣王案行其營壘處所,曰:「天下奇才也。」\n\n'
          + '長史楊儀等整軍而出,百姓奔告宣王,宣王追焉。'
          + '姜維令儀反旗鳴鼓,若將向宣王者 —— 宣王乃退,不敢逼。'
          + '百姓為之諺曰:「死諸葛走生仲達。」',
        textEn:
          'Out through the Xie valley to Wuzhang Plain at Wugong, facing Sima Yi across the Wei. Yi kept his walls and would not come out — so Liang sent him a woman\'s headdress and gown. Yi was furious and memorialised for permission to fight, and the edict refused him.\n\n'
          + 'They faced each other more than a hundred days. In the eighth month of that year Liang fell ill and died with the army, aged fifty-four. After the retreat, Sima Yi walked the lines of his camp and said: "A talent without equal in the realm."\n\n'
          + 'Yang Yi brought the army out in order. The country people ran to tell Sima Yi, who pursued — and Jiang Wei had Yi reverse the banners and beat the drums as if turning to give battle. Sima Yi withdrew and would not press. The people made a saying of it: "A dead Zhuge routs a living Zhongda."',
      },
      verdictZh:
        '論曰:亮之為治,開誠心,布公道;盡忠益時者雖讎必賞,'
        + '犯法怠慢者雖親必罰 —— 邦域之內,咸畏而愛之。'
        + '然連年動眾,未能成功,蓋應變將略,非其所長歟。'
        + '以一州之力抗九州,而九州不敢西向者十二年:功不在克復,在**未亡**。',
      verdictEn:
        'The historian says: he governed with an open heart and even-handed justice — a man who served the state loyally was rewarded though he were an enemy, and a man who broke the law or shirked was punished though he were kin, so that within the realm all feared him and loved him. Yet he moved armies year after year without success; adapting on campaign was perhaps not his gift. With one province he held off nine, and for twelve years the nine did not dare come west. The achievement was not recovery. It was that Shu did not fall.',
      verdictLostZh:
        '論曰:蜀之亡,不亡於五丈原,亡於五丈原之後三十年 ——'
        + '而那三十年裡,再沒有一個人能讓司馬氏在渭南停下來。',
      verdictLostEn:
        'The historian says: Shu did not fall at Wuzhang Plain. It fell thirty years later — and in those thirty years no one else ever made the house of Sima halt on the Wei again.',
    },
    wei: {
      defeat: {
        titleZh: '堅壁而已',
        titleEn: 'Hold the Walls. That Is All.',
        textZh:
          '諸將請戰,懿曰:「亮若勇者,當出武功依山而東;若西上五丈原,'
          + '則諸將無事矣。」亮果上原。\n\n'
          + '巾幗至,諸將忿。懿表請戰,帝使辛毗持節為軍師以制之。'
          + '姜維謂亮曰:「辛佐治仗節而至,賊不復出矣。」'
          + '亮曰:「彼本無戰情,所以固請戰者,以示武於其眾耳。」\n\n'
          + '將在軍,君命有所不受 —— 苟能制吾,豈千里而請戰邪?',
        textEn:
          'The generals asked to fight. "If Liang is bold he will come out at Wugong and go east along the hills," said Yi. "If he goes up onto Wuzhang Plain in the west, then you gentlemen have nothing to do." Liang went up onto the plain.\n\n'
          + 'The woman\'s headdress arrived and the generals were furious. Yi memorialised for permission to fight, and the emperor sent Xin Pi with the staff of authority as army supervisor to restrain him. Jiang Wei said to Liang: "Xin Zuozhi has come with the staff; the enemy will not come out again." And Liang said: "He never meant to fight. He asked so insistently only to show his own men some spirit."\n\n'
          + 'A general in the field need not take every order from his sovereign — if the sovereign could really control him, would he send a thousand li to ask permission to fight?',
      },
      verdictZh:
        '論曰:懿之不戰,非怯也,算也。'
        + '蜀道千里而運糧難,魏但堅壁,則亮自退 —— 以不動勝動,'
        + '所費者一將之名,所全者一國之實。'
        + '然天下由是知司馬氏之能,亦由是啟其心。',
      verdictEn:
        'The historian says: he refused battle not from fear but from arithmetic. A thousand li of Shu road makes supply hard; Wei had only to hold its walls and Liang would go home. He beat motion with stillness, spent one general\'s reputation and preserved a whole state. But from that the realm learned what the house of Sima could do — and the house of Sima learned it too.',
      verdictLostZh:
        '論曰:堅壁之計,勝在耐久;而耐久者,必先能耐謗。',
      verdictLostEn:
        'The historian says: a war of walls is won by endurance — and the first thing that has to be endured is not the enemy but the mockery.',
    },
    wu: {
      defeat: {
        titleZh: '合肥新城之下',
        titleEn: 'Under the New Walls at Hefei',
        textZh:
          '亮出五丈原,約吳同舉。權自將十萬眾圍合肥新城,'
          + '陸遜、諸葛瑾攻襄陽,孫韶、張承向廣陵淮陰 —— 三道俱進。\n\n'
          + '而滿寵拔新城之守,權攻城不下;魏明帝親御龍舟東征,'
          + '權聞之,乃退。\n\n'
          + '兩國同舉而各自退兵。這件事此後又發生了幾次 ——'
          + '同盟是真的,同時卻從來沒有真過。',
        textEn:
          'Liang came out onto Wuzhang Plain and asked Wu to move with him. Quan led a hundred thousand himself against the new walls at Hefei; Lu Xun and Zhuge Jin went at Xiangyang; Sun Shao and Zhang Cheng at Guangling and Huaiyin — three roads at once.\n\n'
          + 'But Man Chong held the new city and Quan could not take it; and when Emperor Ming of Wei came east in person on the dragon boat, Quan heard of it and withdrew.\n\n'
          + 'Two states moved together and each went home separately. It happened several more times after that. The alliance was real. Simultaneity never once was.',
      },
      verdictZh:
        '論曰:吳蜀之盟,四十年不絕,而未嘗一次真正同時。'
        + '蜀出祁山則吳攻合肥,吳攻合肥則蜀已退 —— 各為其國,'
        + '故盟可久而功不成。夫同盟者,共敵而已;共敵不等於共命。',
      verdictEn:
        'The historian says: the alliance of Wu and Shu lasted forty years and never once actually coincided. Shu came out at Qishan and Wu attacked Hefei; Wu attacked Hefei and Shu had already gone home. Each acted for his own state, so the alliance lasted and achieved nothing. An alliance means a shared enemy. A shared enemy is not a shared fate.',
      verdictLostZh:
        '論曰:合肥城下,權四至而四返。'
        + '非兵不多,是那座城從來不是他真正想要的東西。',
      verdictLostEn:
        'The historian says: Quan came to Hefei four times and went home four times. Not for want of troops — that city was never the thing he actually wanted.',
    },
  },
  /* ── 231 鹵城之戰 ──────────────────────────────────────────── */
  'scn-231-lucheng': {
    shu: {
      defeat: {
        titleZh: '甲首三千',
        titleEn: 'Three Thousand Helmets',
        textZh:
          '亮圍祁山,司馬懿救之。諸將咸請戰,懿不許,'
          + '曰:「亮遠來,利在急戰。」而諸將數請,懿病之,'
          + '賈栩、魏平言:「公畏蜀如虎,奈天下笑何!」\n\n'
          + '懿不得已,乃使張郃攻南圍,自案中道向亮。'
          + '亮使魏延、高翔、吳班逆戰,魏兵大敗 ——'
          + '獲甲首三千級,玄鎧五千領,角弩三千一百張。\n\n'
          + '而後李嚴假傳詔命,召亮還。糧不繼者,人也,非天也。',
        textEn:
          'Liang invested Qishan and Sima Yi came to relieve it. Every general asked to fight and Yi refused: "Liang has come a long way; a quick battle is what suits him." They asked again and again until it wore on him, and Jia Xu and Wei Ping said: "Your Excellency fears Shu like a tiger. What of the laughter of the realm?"\n\n'
          + 'So he sent Zhang He against the southern lines and took the middle road himself against Liang. Liang sent Wei Yan, Gao Xiang and Wu Ban to meet him, and the Wei troops were badly beaten — three thousand helmets taken, five thousand suits of black mail, three thousand one hundred horn crossbows.\n\n'
          + 'And then Li Yan forged an edict recalling him. What broke the supply line was a man, not the weather.',
      },
      verdictZh:
        '論曰:鹵城之戰,蜀之全勝也;而勝而即退者,糧盡於後方之人手。'
        + '李嚴以督運不繼,懼罪而矯詔 —— 一國之外患未除,而內間先發。'
        + '故曰:兵之所以不能久者,常不在敵。',
      verdictEn:
        'The historian says: Lucheng was a complete Shu victory, and the victor went home because his supply had failed in the hands of his own people. Li Yan, having botched the transport and fearing punishment, forged an edict. The external danger was not yet dealt with and the internal one moved first. Hence: what usually stops an army from staying in the field is not the enemy.',
      verdictLostZh:
        '論曰:斬將三千而還師,史書記其勝,而天下記其退。',
      verdictLostEn:
        'The historian says: three thousand helmets, and then the army went home. The histories record the victory; the realm remembered the retreat.',
    },
    wei: {
      defeat: {
        titleZh: '公畏蜀如虎',
        titleEn: 'Your Excellency Fears Shu Like a Tiger',
        textZh:
          '你知道不該打。蜀道千里,亮利在急戰,而你只要不動,'
          + '他自然要退 —— 這是最省的一條路。\n\n'
          + '而諸將日日請戰,言語漸不堪:「公畏蜀如虎,奈天下笑何!」'
          + '你終於出兵,而張郃死於木門,魏兵大敗。\n\n'
          + '那一戰輸掉的不是三千甲首,是「我可以不理會他們」這件事。',
        textEn:
          'You knew you should not fight. A thousand li of Shu road; a quick battle suits Liang; hold still and he must go home. That is the cheapest road there is.\n\n'
          + 'And your generals asked day after day, and the words got worse: "Your Excellency fears Shu like a tiger. What of the laughter of the realm?" So in the end you went out — and Zhang He died at Mumen and the Wei army was broken.\n\n'
          + 'What that battle cost was not three thousand helmets. It was the proposition that you could ignore them.',
      },
      verdictZh:
        '論曰:懿之敗於鹵城,敗於眾議,不敗於亮。'
        + '為將者,能拒敵而不能拒言,則其算終有一日為人所奪。',
      verdictEn:
        'The historian says: he was beaten at Lucheng by the opinion of his own officers, not by Liang. A commander who can hold off an enemy but cannot hold off talk will one day have his arithmetic taken out of his hands.',
      verdictLostZh:
        '論曰:張郃之死,魏失一名將,而司馬氏得一教訓:'
        + '此後渭南百餘日,他再沒有出過壁壘。',
      verdictLostEn:
        'The historian says: Zhang He\'s death cost Wei a great captain and taught the house of Sima something. For the hundred days on the Wei that came after, Sima Yi never once came out from behind his walls.',
    },
    wu: {
      defeat: {
        titleZh: '盟在西,而兵在東',
        titleEn: 'The Alliance Is West. The Army Is East.',
        textZh:
          '蜀出祁山,遣使告吳。你點頭 —— 而後看著淮南。\n\n'
          + '四十年裡,你的兵一次也沒有向西走過。'
          + '同盟寫在紙上,而地在江北。',
        textEn:
          'Shu came out at Qishan and sent word. You nodded — and then looked at Huainan.\n\n'
          + 'In forty years your troops never once marched west. The alliance was on paper; the land was north of the river.',
      },
      verdictZh:
        '論曰:吳之於蜀,盟而不同舉者,以其所欲者異也。'
        + '蜀欲興漢,吳欲保江 —— 目標既異,則同盟止於不相攻而已。',
      verdictEn:
        'The historian says: Wu allied with Shu and never moved with it, because they wanted different things. Shu wanted to restore Han; Wu wanted to keep the river. With different aims, an alliance amounts to no more than not attacking each other.',
      verdictLostZh:
        '論曰:不相攻,已經是亂世裡很難得的一種關係了。',
      verdictLostEn:
        'The historian says: not attacking each other is, in a broken age, already a rare kind of relationship.',
    },
  },
};

/** 取某盤某家的落幕文本;沒寫過就回 null(走通用結局)。 */
export function scenarioVerdict(
  scenarioId: string | null | undefined,
  forceId: EntityId | null | undefined,
): ScenarioVerdict | null {
  if (!scenarioId || !forceId) return null;
  return SCENARIO_VERDICTS[scenarioId]?.[forceId] ?? null;
}
