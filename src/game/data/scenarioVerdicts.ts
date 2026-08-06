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
    'liu-bei': {
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
    cao: {
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
    sun: {
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
    'liu-bei': {
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
    cao: {
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
    sun: {
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
  /* ── 222 夷陵之戰 ─────────────────────────────────────────────── */
  'scn-222-yiling': {
    'liu-bei': {
      defeat: {
        titleZh: '連營七百里',
        titleEn: 'Seven Hundred Li of Camps',
        textZh:
          '關羽死,荊州失。趙雲諫曰:「國賊是曹操,非孫權也。'
          + '且先滅魏,則吳自服。」不從。\n\n'
          + '自巫峽建平連圍至夷陵界,立數十屯,以金錦爵賞誘動諸夷。'
          + '而陸遜堅守七八月不戰 —— 及暑,蜀軍疲頓,乃使士各持一把茅,'
          + '以火攻拔之。\n\n'
          + '舟船器械,水步軍資,一時略盡,屍骸塞江而下。'
          + '走還白帝,慚恚曰:「吾乃為遜所折辱,豈非天邪!」',
        textEn:
          'Guan Yu is dead and Jing province gone. Zhao Yun remonstrates: "The traitor to the state is Cao, not Sun. Destroy Wei first and Wu submits of itself." He is not heeded.\n\n'
          + 'The line of camps runs from the Wu gorge and Jianping down to the Yiling boundary, dozens of stockades, with gold and brocade and titles held out to move the tribes. And Lu Xun holds without fighting for seven or eight months — until the heat, when the Shu army is worn down, and each of his men takes a bundle of thatch and burns it out.\n\n'
          + 'Boats and gear, the whole supply of a river-and-land army, gone at a stroke; the corpses came down the river thick enough to block it. He got back to Baidi and said, burning with shame: "That I should be brought down and disgraced by Xun — is this not Heaven\'s doing?"',
      },
      verdictZh:
        '論曰:先主以雪恥興師,而所失者國之精銳。'
        + '兵法忌怒而興師 —— 「主不可以怒而興師,將不可以慍而致戰」,'
        + '此語出於孫子,而先主讀過。'
        + '然關羽張飛俱以非命終,而三人者名為君臣,恩猶父子:'
        + '天下之義,有時不在兵法之內。',
      verdictEn:
        'The historian says: he raised the army to wipe out a disgrace and spent the best troops the state had. The classics forbid marching in anger — "a ruler must not raise troops out of rage, nor a general give battle out of pique." Sunzi wrote that, and the First Lord had read it. But Guan Yu and Zhang Fei had both died violently, and though the three were nominally lord and subjects, the bond was a father\'s and sons\'. There are obligations in this world that fall outside the art of war.',
      verdictLostZh:
        '論曰:夷陵之敗,蜀之元氣盡矣。'
        + '此後諸葛亮六出祁山,所將者皆新募之兵 —— 而老兵在猇亭的火裡。',
      verdictLostEn:
        'The historian says: after Yiling the vitality of Shu was spent. Zhuge Liang went out at Qishan six times afterwards with newly raised men — the veterans were in the fire at Xiaoting.',
    },
    sun: {
      defeat: {
        titleZh: '七八月不戰',
        titleEn: 'Seven Months without a Battle',
        textZh:
          '諸將並曰:「攻備當在初,今乃令入五六百里,相銜持經七八月,'
          + '其諸要害皆已固守,擊之必無利矣。」\n\n'
          + '遜曰:「備是猾虜,更嘗事多,其軍始集,思慮精專,未可干也。'
          + '今住已久,不得我便,兵疲意沮,計不復生,'
          + '掎角此寇,正在今日。」\n\n'
          + '而諸將皆孫策時舊將、或公室貴戚,各自矜恃,不相聽從。'
          + '遜按劍曰:「僕雖書生,受命主上。國家所以屈諸君使相承望者,'
          + '以僕有尺寸可稱,能忍辱負重故也。」',
        textEn:
          'The generals said with one voice: "Bei should have been struck at the outset. Now we have let him come five or six hundred li in and stood locked with him seven or eight months, and every key point is fortified. There is nothing to be gained by attacking now."\n\n'
          + 'And Xun said: "Bei is a cunning old campaigner with a great deal of experience. When his army first gathered, his thinking was sharp and concentrated and he could not be touched. He has been sitting a long time now and has got nothing from us; his men are tired and their spirits low, and no new plan is coming. Today is the day to close on him."\n\n'
          + 'His generals were Sun Ce\'s old officers or relations of the ruling house, each standing on his own dignity, and none of them would listen. Xun laid his hand on his sword: "I am a scholar, but I hold the sovereign\'s commission. The state has put you gentlemen under me because I have some small merit — namely that I can swallow insult and carry weight."',
      },
      verdictZh:
        '論曰:遜之勝,勝在能忍。七八月不戰,而諸將日謗其怯 ——'
        + '忍敵易,忍自己人難。及火起,一夕而破四十餘營。'
        + '故曰:大將之才,不在能戰,在能不戰。',
      verdictEn:
        'The historian says: he won by waiting. Seven or eight months without a battle, and his own officers calling him a coward every day of it — enduring the enemy is easy, enduring your own side is not. When the fires went up, forty camps went in a night. Hence: the mark of a great commander is not that he can fight but that he can decline to.',
      verdictLostZh:
        '論曰:吳之勝夷陵,與蜀之勝鹵城同 —— 皆勝而不能進。'
        + '三分之勢,至此鑄定:不是誰打贏了,是誰都贏不下去。',
      verdictLostEn:
        'The historian says: Wu\'s victory at Yiling was like Shu\'s at Lucheng — a win that could not be followed up. The three-way split was cast at that point: not because anyone had won, but because nobody could keep winning.',
    },
    cao: {
      defeat: {
        titleZh: '備不曉兵',
        titleEn: 'Bei Does Not Understand War',
        textZh:
          '權遣使稱藩,而後與備相攻。群臣皆賀,唯劉曄曰:'
          + '「權無故求降,必內有急。宜大興師,徑渡江襲之。'
          + '蜀攻其外,我襲其內,吳之亡不出旬月矣。」\n\n'
          + '帝不從,曰:「人稱降而伐之,疑天下欲來者心。」\n\n'
          + '及聞備連營七百里,曰:「備不曉兵,豈有七百里營可以拒敵者乎!'
          + '苞原隰險阻而為軍者為敵所禽,此兵忌也。孫權上事今至矣。」'
          + '後七日,吳破蜀書到。\n\n'
          + '他看對了那一仗,而錯過了那一年。',
        textEn:
          'Quan sent envoys to submit as a vassal, and then went to war with Bei. The court all offered congratulations; only Liu Ye said: "Quan has asked to submit for no reason, so something is pressing at home. We should raise a great army, cross the river directly and strike him. Shu attacks his outside, we strike his inside, and Wu is finished within the month."\n\n'
          + 'The emperor would not: "To attack a man who has declared his submission would make everyone in the realm who might come over think twice."\n\n'
          + 'Then he heard about the seven hundred li of camps: "Bei does not understand war. Whoever heard of holding off an enemy with seven hundred li of camps? To make your position in marsh and thicket and broken ground is to be taken by the enemy — the art of war forbids it. Sun Quan\'s dispatch will arrive presently." Seven days later the news of Wu\'s victory came in.\n\n'
          + 'He read the battle correctly and missed the year.',
      },
      verdictZh:
        '論曰:文帝之不襲吳,以信也;而劉曄之策,以利也。'
        + '信與利,人主終身所擇 —— 而三分之世,信者常後於利者一步。'
        + '及吳破蜀而復叛,魏乃三路伐之,已無其時矣。',
      verdictEn:
        'The historian says: Emperor Wen declined to strike Wu out of good faith; Liu Ye\'s plan was pure advantage. Faith or advantage — that is the choice a sovereign makes all his life, and in an age of three powers the man of faith is usually one step behind the man of advantage. When Wu had beaten Shu and turned on Wei again, Wei sent three armies against it, and the moment was gone.',
      verdictLostZh:
        '論曰:兩虎相鬥而不取,非仁也,是不知其為兩虎也。',
      verdictLostEn:
        'The historian says: to watch two tigers fight and take nothing is not mercy. It is failing to notice that they are tigers.',
    },
  },
  /* ── 263 滅蜀之役 ─────────────────────────────────────────────── */
  'scn-263-shu-fall': {
    'liu-bei': {
      defeat: {
        titleZh: '陰平無人',
        titleEn: 'Nobody on the Yinping Road',
        textZh:
          '鍾會出斜谷,姜維斂眾守劍閣 —— 會攻之不能克,糧道險遠,'
          + '議欲還。\n\n'
          + '而鄧艾自陰平道行無人之地七百餘里,鑿山通道,造作橋閣。'
          + '山高谷深,至為艱險;糧運將匱,頻於危殆。艾以氈自裹,推轉而下。'
          + '將士皆攀木緣崖,魚貫而進。\n\n'
          + '諸葛瞻拒之於綿竹,敗死。後主遣使奉璽綬 ——'
          + '而劍閣之師,一箭未發。',
        textEn:
          'Zhong Hui came out through the Xie valley, and Jiang Wei drew his forces in and held Jiange. Hui could not carry it; his supply road was long and dangerous, and he talked of going home.\n\n'
          + 'And Deng Ai went by the Yinping road, seven hundred li through country with nobody in it, cutting through hills and building plank bridges. The mountains were high and the valleys deep and it was as hard as ground gets; the grain nearly ran out and they were in danger again and again. Ai wrapped himself in felt and rolled down the slope. The officers and men went hand over hand down the cliffs and through in single file.\n\n'
          + 'Zhuge Zhan met them at Mianzhu and died. The Later Lord sent out the seals — and the army at Jiange never loosed an arrow.',
      },
      verdictZh:
        '論曰:蜀之亡,非亡於劍閣,亡於一條沒有人設防的小路。'
        + '姜維九伐中原而國小民疲,譙周作《仇國論》,黃皓用事於內 ——'
        + '陰平之險,守之者一屯足矣,而三十年無人置一卒。',
      verdictEn:
        'The historian says: Shu did not fall at Jiange. It fell on one road nobody was guarding. Jiang Wei went north nine times and the country was small and its people worn out; Qiao Zhou wrote his essay against the war; Huang Hao ran things inside the palace. One post would have held the Yinping route, and in thirty years nobody put a single soldier on it.',
      verdictLostZh:
        '論曰:後主之降,群臣多勸;而北地王諶哭於昭烈之廟,'
        + '殺妻子而後自殺。一國之亡,總有一個人不肯。',
      verdictLostEn:
        'The historian says: the court urged the Later Lord to surrender, and he did. The Prince of Beidi wept at the shrine of the Illustrious Founder, killed his wife and children, and then himself. When a state falls there is always one man who will not.',
    },
    cao: {
      defeat: {
        titleZh: '三路伐蜀',
        titleEn: 'Three Roads into Shu',
        textZh:
          '司馬昭曰:「今宜先取蜀,三年之後,因巴蜀順流之勢,'
          + '水陸並進,此滅虞定虢,吞韓並魏之勢也。」\n\n'
          + '而朝臣多以為不可,唯鍾會與昭意同。乃使會統十餘萬眾,'
          + '鄧艾、諸葛緒各將三萬餘人 —— 三路俱進。\n\n'
          + '及蜀既平,會謀反於成都,艾為衛瓘所收 ——'
          + '滅一國之後,先死的是滅它的兩個人。',
        textEn:
          'Sima Zhao said: "We should take Shu first. Three years later, using the downstream advantage from Ba and Shu, we go by land and water together — this is the way Yu was destroyed and Guo settled, the way Han was swallowed and Wei absorbed."\n\n'
          + 'Most of the court thought it could not be done; only Zhong Hui agreed with him. So Hui was given more than a hundred thousand, and Deng Ai and Zhuge Xu thirty thousand each — three roads at once.\n\n'
          + 'And when Shu had fallen, Hui plotted rebellion at Chengdu and Ai was arrested by Wei Guan. After a state was destroyed, the first two men to die were the two who destroyed it.',
      },
      verdictZh:
        '論曰:昭之取蜀,決於一人之議而成不世之功 ——'
        + '而功成之日,即疑其將。鍾會之反,鄧艾之死,皆在蜀亡之後三月。'
        + '故曰:滅國者,先自防其人。',
      verdictEn:
        'The historian says: Sima Zhao took Shu on one man\'s advice and achieved something no age had matched — and on the day it was achieved he began to suspect his generals. Zhong Hui\'s revolt and Deng Ai\'s death both fell within three months of Shu\'s fall. Hence: the man who destroys a state guards first against his own people.',
      verdictLostZh:
        '論曰:伐蜀之議,朝臣皆以為不可 —— 而不可者,常是最後成的那一件。',
      verdictLostEn:
        'The historian says: the whole court said the invasion could not be done. The thing that cannot be done is often the thing that gets done.',
    },
    sun: {
      defeat: {
        titleZh: '救蜀之師,行至半途',
        titleEn: 'The Relief Column Got Halfway',
        textZh:
          '蜀告急。吳遣丁奉向壽春,留平、施績向南郡,丁封、孫異向沔中 ——'
          + '三道以救之。\n\n'
          + '而蜀已降。諸軍聞之,乃還。\n\n'
          + '四十年的同盟,最後一次履約,走到一半就沒有必要了。',
        textEn:
          'Shu sent word that it was in extremity. Wu sent Ding Feng towards Shouchun, Liu Ping and Shi Ji towards Nan commandery, Ding Feng the younger and Sun Yi towards Mianzhong — three roads to relieve it.\n\n'
          + 'And Shu had already surrendered. The columns heard, and turned round.\n\n'
          + 'Forty years of alliance, and the last time it was honoured the march became unnecessary halfway.',
      },
      verdictZh:
        '論曰:蜀亡而吳救不及,非不欲救,是不能及。'
        + '唇亡齒寒,吳人知之久矣 —— 而知之與能之,是兩件事。'
        + '自是之後十七年,晉伐吳,而無人救吳。',
      verdictEn:
        'The historian says: Wu\'s relief did not arrive in time — not for want of will but for want of reach. When the lips are gone the teeth are cold; the men of Wu had known that a long time. Knowing a thing and being able to act on it are two different matters. Seventeen years later Jin came for Wu, and nobody marched to relieve them.',
      verdictLostZh:
        '論曰:同盟之用,在於使敵不敢先取其一。'
        + '一旦其一已取,盟即無所附麗。',
      verdictLostEn:
        'The historian says: an alliance works by making the enemy afraid to take either party first. Once one of them has been taken, there is nothing left for the alliance to attach to.',
    },
  },
  /* ── 280 晉滅吳 ───────────────────────────────────────────────── */
  'scn-280-jin-unite': {
    sun: {
      defeat: {
        titleZh: '一片降幡出石頭',
        titleEn: 'One White Banner over Shitou',
        textZh:
          '吳人於江磧要害處,並以鐵鎖橫截之;又作鐵錐長丈餘,暗置江中,'
          + '以逆距船。\n\n'
          + '而王濬作大筏數十,方百餘步,縛草為人,被甲持杖,'
          + '令善水者以筏先行,錐輒著筏去。又作火炬,長十餘丈,'
          + '大數十圍,灌以麻油,在船前 —— 遇鎖,然炬燒之,'
          + '須臾,融液斷絕。\n\n'
          + '於是船無所礙。三月,濬至石頭,皓面縛輿櫬,詣軍門降。',
        textEn:
          'The men of Wu ran iron chains across the river at the shoals and narrows, and set iron spikes more than ten feet long under the water to catch the hulls.\n\n'
          + 'So Wang Jun built dozens of great rafts a hundred paces square, bound straw men in armour holding staves, and had strong swimmers take the rafts down first — and the spikes fastened into the rafts and went away with them. He also made torches ten and more fathoms long and dozens of spans thick, soaked in hemp oil, mounted in the bows: when they met a chain they lit them, and in a little while the iron ran molten and parted.\n\n'
          + 'After that nothing was in the way of the ships. In the third month Jun reached Shitou, and Hao had himself bound and brought a coffin to the gate of the camp and surrendered.',
      },
      verdictZh:
        '論曰:吳之亡,不亡於王濬之樓船,亡於孫皓之刑戮。'
        + '剝人之面,鑿人之眼,而以為威;'
        + '及晉師既至,守江者無一人肯死。'
        + '鐵鎖橫江,而人心不橫。',
      verdictEn:
        "The historian says: Wu did not fall to Wang Jun's tower-ships. It fell to Sun Hao's executions — flaying men's faces and gouging out their eyes, and calling it authority. When the armies of Jin came down, not one man on the river was willing to die for him. The chains lay across the water. Nothing lay across the hearts.",
      verdictLostZh:
        '論曰:王濬樓船下益州,金陵王氣黯然收。'
        + '千尋鐵鎖沉江底,一片降幡出石頭。',
      verdictLostEn:
        "The historian says: Wang Jun's tower-ships came down from Yi province, and the king-aura of Jinling went out. A thousand fathoms of iron chain went to the river bottom, and one white banner came out over Shitou.",
    },
    sima: {
      defeat: {
        titleZh: '天下歸一',
        titleEn: 'The Realm Made One',
        textZh:
          '自中平元年黃巾起,至太康元年吳亡 —— 九十六年。\n\n'
          + '其間稱帝者十餘人,擁兵者百餘家,'
          + '戶口自五千餘萬減至七百餘萬。\n\n'
          + '而後三十六年,永嘉之亂起,洛陽再破。',
        textEn:
          'From the Yellow Turban rising in the first year of Zhongping to the fall of Wu in the first year of Taikang — ninety-six years.\n\n'
          + 'In that time more than ten men called themselves emperor and a hundred houses held armies, and the registered population fell from over fifty million to a little over seven million.\n\n'
          + 'And thirty-six years after that, the Yongjia disorder began and Luoyang was sacked again.',
      },
      verdictZh:
        '論曰:晉之一天下,收九十六年之亂 —— 而所以能收者,'
        + '非其德過於魏蜀吳,是三家自相消耗至盡而已。'
        + '故太康之世不過十年,而神州陸沉。'
        + '合久必分者,非天道,是人事未修。',
      verdictEn:
        'The historian says: Jin gathered up ninety-six years of disorder — and could do it not because its virtue exceeded Wei, Shu or Wu, but because the three had ground each other down to nothing. So the Taikang peace lasted barely ten years before the heartland went under. "Long united, it must divide" is not a law of Heaven. It is unfinished human business.',
      verdictLostZh:
        '論曰:統一者,收拾之功也;而收拾之後,能否守之,是另一件事。',
      verdictLostEn:
        'The historian says: unification is the work of tidying up. Whether the tidied thing can be kept is a separate question entirely.',
    },
  },
  /* ── 249 高平陵之變 ───────────────────────────────────────────── */
  'scn-249-gaopingling': {
    sima: {
      defeat: {
        titleZh: '正始十年正月甲午',
        titleEn: 'The Sixth Day of the First Month',
        textZh:
          '曹爽兄弟從天子謁高平陵,司馬懿以皇太后令閉諸城門,'
          + '勒兵據武庫,授兵出屯洛水浮橋。\n\n'
          + '奏爽曰:「但以免官,以侯就第。」蔣濟亦為書喻之,'
          + '指洛水為誓。爽終夜不決,以刀築地曰:'
          + '「我不失作富家翁!」桓範哭曰:「曹子丹佳人,'
          + '生汝兄弟,犢耳!」\n\n'
          + '爽兄弟既歸第,有司奏其謀反,誅之,夷三族。'
          + '洛水之誓,自此不足信於天下。',
        textEn:
          'The Cao Shuang brothers went with the emperor to the tombs at Gaoping, and Sima Yi, using an order from the Empress Dowager, shut the city gates, took the arsenal under guard, and drew up troops on the floating bridge over the Luo.\n\n'
          + 'He memorialised concerning Shuang: only dismissal, and retirement to his marquisate. Jiang Ji wrote to him too, swearing by the Luo. Shuang could not decide all night, and struck the ground with his sword: "I shall still be a rich gentleman!" Huan Fan wept: "Cao Zidan was a fine man, and he fathered you two — calves!"\n\n'
          + 'Once the brothers were back at their houses the officials memorialised that they had plotted rebellion, and they were executed to three degrees of kin. From that day the oath sworn by the Luo was not worth anything in the realm.',
      },
      verdictZh:
        '論曰:高平陵之事,一日而魏祚移。'
        + '而所以能成者,不在兵,在爽之不決 ——'
        + '桓範勸挾天子幸許昌,發四方兵,此上策也;而爽計之一夜,'
        + '所計者惟富家翁三字。\n'
        + '夫人主之權,一日不執,則終身不復執。',
      verdictEn:
        "The historian says: in a single day at Gaoping the fortune of Wei changed houses — and what made it possible was not troops but Shuang's indecision. Huan Fan urged him to take the emperor to Xuchang and call up the armies of the four quarters; that was the right move. Shuang thought about it all night, and what he thought about was the phrase 'rich gentleman'. Power let go of for one day is never taken up again.",
      verdictLostZh:
        '論曰:指洛水為誓而後夷其三族 —— 自是之後,魏之君臣相與,'
        + '無一言可信者。司馬氏得天下之速,亦以此;失人心之久,亦以此。',
      verdictLostEn:
        'The historian says: he swore by the Luo and then exterminated three degrees of the family. After that nothing said between sovereign and minister in Wei could be believed. The house of Sima got the realm quickly because of it, and was distrusted for a very long time because of it.',
    },
    cao: {
      defeat: {
        titleZh: '我不失作富家翁',
        titleEn: 'I Shall Still Be a Rich Gentleman',
        textZh:
          '大司農桓範出城,以太后令召之,不從而奔爽 ——'
          + '「今卿與天子相隨,令於天下,誰敢不應者?」\n\n'
          + '爽默然。範又謂羲曰:「此事昭然,卿用讀書何為邪!'
          + '於今日卿門戶倒矣!」\n\n'
          + '自甲夜至五鼓,爽乃投刀於地曰:'
          + '「司馬公正當欲奪吾權耳。吾得以侯還第,不失作富家翁。」\n\n'
          + '範哭曰:「曹子丹佳人,生汝兄弟,犢耳!'
          + '何圖今日坐汝等族滅矣!」',
        textEn:
          'Huan Fan, the Minister of Agriculture, got out of the city — summoned by the Dowager\'s order, he ignored it and rode to Shuang instead. "You have the Son of Heaven with you. Give orders to the realm and who will dare not obey?"\n\n'
          + 'Shuang said nothing. Fan turned to Xi: "This is perfectly plain. What have you been reading books for? Today your house falls!"\n\n'
          + 'From the first watch to the fifth Shuang sat, and then threw his sword down: "The Sima gentleman only wants my authority. If I go back to my house as a marquis I shall still be a rich gentleman."\n\n'
          + 'And Fan wept: "Cao Zidan was a fine man, and he fathered you two — calves! Who would have thought I should be wiped out with your family today?"',
      },
      verdictZh:
        '論曰:爽之敗,非才不足,是志不足。'
        + '兵在手而不知用,天子在側而不知挾 ——'
        + '所求者一身之安,而一身之安,正是他唯一得不到的東西。',
      verdictEn:
        'The historian says: Shuang did not fall short in ability but in will. He had troops in hand and did not know how to use them, the Son of Heaven at his elbow and did not know how to hold him. What he wanted was his own safety — and his own safety was the one thing he was never going to get.',
      verdictLostZh:
        '論曰:桓範之策,行之則魏未必亡;不行,則一夜而畢。'
        + '謀之在人,而決之在主 —— 決者一人,故國之興亡常在一人之一夜。',
      verdictLostEn:
        'The historian says: had Huan Fan\'s plan been carried out, Wei might not have ended. It was not, and the thing was over in a night. Plans come from many; the decision comes from one. That is why the fate of a state so often turns on one man\'s single night.',
    },
    'liu-bei': {
      defeat: {
        titleZh: '姜維聞之,乃出隴右',
        titleEn: 'Jiang Wei Heard, and Went Out to Longyou',
        textZh:
          '魏之政變,蜀人聞之而喜:曹爽既誅,夏侯霸懼而來奔 ——'
          + '姜維以為魏方多事,可以有為,乃連年出兵。\n\n'
          + '而司馬氏之立,魏之內爭反而止;蜀所遇者,'
          + '從此是一個比曹爽更難對付的對手。',
        textEn:
          "Word of the coup reached Shu and was welcome: Cao Shuang was dead and Xiahou Ba, frightened, came over to them. Jiang Wei reckoned Wei had trouble enough at home for something to be made of it, and went out year after year.\n\n"
          + 'But the rise of the Sima ended Wei\'s internal quarrels. From then on what Shu faced was an opponent considerably harder to deal with than Cao Shuang.',
      },
      verdictZh:
        '論曰:敵國之亂,未必己之利。'
        + '曹爽在,則魏之政出於二;司馬氏專,則魏之政出於一。'
        + '姜維喜其亂而不知其將定 —— 九伐中原,自此無一功。',
      verdictEn:
        "The historian says: disorder in an enemy state is not automatically to your advantage. While Cao Shuang lived, Wei's government came from two places; once the Sima held it alone, it came from one. Jiang Wei was pleased by the disorder and did not see that it was about to settle. Nine campaigns north, and not one of them achieved anything.",
      verdictLostZh:
        '論曰:夏侯霸之奔蜀,蜀人以為得一將;'
        + '而魏人以為去一患。',
      verdictLostEn:
        'The historian says: when Xiahou Ba fled to Shu, Shu thought it had gained a general. Wei thought it had shed a problem.',
    },
    sun: {
      defeat: {
        titleZh: '二宮之爭',
        titleEn: 'The Quarrel of the Two Palaces',
        textZh:
          '魏有高平陵,吳有二宮 —— 太子和與魯王霸並寵,'
          + '朝臣分為兩部,陸遜、顧譚、吾粲皆坐之。\n\n'
          + '遜屢書諫爭,權遣中使責問,遜憤恚致卒,年六十三。\n\n'
          + '而後廢太子,賜魯王死。一國之中,同時失去一個儲君、一個宗王、'
          + '和一個丞相。',
        textEn:
          'Wei had Gaoping; Wu had the two palaces — the heir apparent He and the Prince of Lu, Ba, favoured equally, the court split in two, and Lu Xun, Gu Tan and Wu Can all caught in it.\n\n'
          + 'Xun wrote again and again to remonstrate. Quan sent a palace envoy to reprimand him, and Xun died of rage and grief at sixty-three.\n\n'
          + 'Then the heir was deposed and the Prince of Lu ordered to die. In one country, at one time: an heir, a prince of the blood, and a chancellor, all gone.',
      },
      verdictZh:
        '論曰:權之晚年,信讒賊,興大獄,二宮之爭幾亡其國。'
        + '夫創業者能忍辱,而守成者不能忍疑 ——'
        + '陸遜死於一封責問的詔書,而吳之柱石自此空。',
      verdictEn:
        'The historian says: in his last years Quan listened to slanderers and raised great prosecutions, and the quarrel of the two palaces nearly ended his state. The man who founds can swallow humiliation; the man who inherits cannot swallow suspicion. Lu Xun died of a reprimanding edict, and the pillar of Wu was gone.',
      verdictLostZh:
        '論曰:敵國方變,而己國方亂 —— 兩家皆內耗,'
        + '而先定者勝。魏先定,故三十年後晉滅吳。',
      verdictLostEn:
        'The historian says: the enemy state was convulsing and so was his own. Both were consuming themselves, and the one that settled first won. Wei settled first — and thirty years later Jin destroyed Wu.',
    },
  },
  /* ── 219 漢中王 ───────────────────────────────────────────────── */
  'scn-219-hanzhong': {
    'liu-bei': {
      defeat: {
        titleZh: '水淹七軍,而後白衣渡江',
        titleEn: 'Seven Armies Drowned, and Then the White Robes',
        textZh:
          '關羽圍樊,漢水暴溢,于禁七軍皆沒,龐德死之 ——'
          + '威震華夏,曹操議徙許都以避其銳。\n\n'
          + '而呂蒙稱疾還建業,陸遜代之,遺羽書,辭甚謙下。'
          + '羽意大安,稍撤兵以赴樊。\n\n'
          + '蒙至尋陽,盡伏其精兵舠䑡中,使白衣搖櫓,作商賈人服 ——'
          + '晝夜兼行,至羽所置江邊屯候,盡收縛之,是故羽不聞知。\n\n'
          + '荊州降。走麥城,至臨沮,為潘璋司馬馬忠所獲。',
        textEn:
          'Guan Yu invested Fan; the Han river burst its banks and all seven of Yu Jin\'s armies went under, and Pang De died — his name shook the realm, and Cao Cao debated moving the capital out of his way.\n\n'
          + 'And Lü Meng pleaded illness and went back to Jianye, and Lu Xun replaced him and wrote to Yu in the humblest terms. Yu was much reassured and drew troops off to Fan.\n\n'
          + 'Meng reached Xunyang, hid all his best men in the covered boats, and had them row in white civilian clothes dressed as merchants — travelling day and night, taking and binding every watch-post Yu had set along the river, so that Yu heard nothing.\n\n'
          + 'Jing province surrendered. He fell back on Maicheng, and at Linju was taken by Ma Zhong, an officer of Pan Zhang.',
      },
      verdictZh:
        '論曰:漢中王之立,蜀之極盛也;而極盛之日,即荊州之失。'
        + '羽剛而自矜,善待卒伍而驕於士大夫 ——'
        + '糜芳、傅士仁之降,非一日之故。\n'
        + '夫兩線之業,恃盟而已;盟一旦翻,則首尾皆敵。',
      verdictEn:
        'The historian says: taking the title of King of Hanzhong was the height of Shu — and on that same height Jing province was lost. Yu was hard and full of himself, good to his soldiers and arrogant with the gentry; the surrender of Mi Fang and Shi Ren was not the work of one day. An enterprise on two fronts rests on an alliance, and when the alliance turns over, both ends are enemies.',
      verdictLostZh:
        '論曰:失荊州者,失的不是一州,是隆中對的那一半 ——'
        + '「命一上將將荊州之軍以向宛洛」,自此無人可命,亦無軍可將。',
      verdictLostEn:
        'The historian says: losing Jing province was not losing a province. It was losing half of the Longzhong plan — "let one senior general take the army of Jing towards Wan and Luo." After that there was no general to send and no army to send.',
    },
    sun: {
      defeat: {
        titleZh: '白衣渡江',
        titleEn: 'Crossing in White',
        textZh:
          '權內憚羽,外欲以為己功,箋與曹公,乞以討羽自效。\n\n'
          + '蒙曰:「今征虜守南郡,潘璋住白帝,蔣欽將游兵萬人循江上下,'
          + '應敵所在,而蒙為國家前據襄陽,如此,何憂於操,何賴於羽?」\n\n'
          + '羽之死,吳得荊州全境 —— 而自是與蜀為讎,'
          + '夷陵之師,即在三年之後。',
        textEn:
          'Quan feared Guan Yu at home and wanted the credit abroad, and wrote to Cao offering to punish Yu as his own service.\n\n'
          + 'Meng said: "Let Zhengly hold Nan commandery, Pan Zhang sit at Baidi, Jiang Qin take ten thousand mobile troops up and down the river to meet whatever comes — and let me take Xiangyang for the state in front. Do that, and what is there to fear from Cao, and what do we need Guan Yu for?"\n\n'
          + 'Yu died and Wu had the whole of Jing province — and from then on Shu was an enemy. The army at Yiling came three years later.',
      },
      verdictZh:
        '論曰:取荊州者,吳之必爭也 —— 全據長江,而後可守。'
        + '然取之而失盟,遂啟夷陵之師;夷陵雖勝,而三分之勢亦自此僵。'
        + '故曰:得地而失援,其得未必為得。',
      verdictEn:
        'The historian says: Wu had to have Jing province — the whole length of the river, or the river could not be held. But taking it cost the alliance and brought on the army at Yiling; and though Yiling was a victory, the three-way balance froze from that point. Hence: ground gained at the price of an ally is not necessarily a gain.',
      verdictLostZh:
        '論曰:呂蒙之計,十全者也;而其後三年,吳與蜀皆不能北向一步。',
      verdictLostEn:
        "The historian says: Lü Meng's plan was flawless. And for three years after it, neither Wu nor Shu could take a single step northward.",
    },
    cao: {
      defeat: {
        titleZh: '議徙許都',
        titleEn: 'They Talked of Moving the Capital',
        textZh:
          '羽威震華夏,操議徙許都以避其銳。'
          + '司馬懿、蔣濟諫曰:「于禁等為水所沒,非戰攻之失,'
          + '於國家大計未足有損。劉備、孫權,外親內疏,'
          + '羽之得意,權必不願也。可遣人勸權躡其後,'
          + '許割江南以封權,則樊圍自解。」\n\n'
          + '操從之。而後羽死,荊州歸吳。\n\n'
          + '一封信解了一座城的圍,也把三分之勢釘死了二十年。',
        textEn:
          'Guan Yu\'s name shook the realm, and Cao debated moving the capital out of his way. Sima Yi and Jiang Ji remonstrated: "Yu Jin and the rest were lost to floodwater, not to a failure of arms; the state\'s position is not really damaged. Liu Bei and Sun Quan are close on the surface and estranged underneath. Yu\'s success is the last thing Quan wants. Send someone to urge Quan to come in behind him, and promise to cede the land south of the river to him as his fief — and the siege of Fan lifts of itself."\n\n'
          + 'Cao did it. Yu died, and Jing province went to Wu.\n\n'
          + 'One letter lifted the siege of one city, and nailed the three-way split in place for twenty years.',
      },
      verdictZh:
        '論曰:魏之解樊圍,不以兵,以一封書 ——'
        + '「劉備、孫權,外親內疏」八字,是三分之世最貴的一句話。'
        + '夫敵之盟,不必以兵破之,示之以利可也。',
      verdictEn:
        'The historian says: Wei lifted the siege of Fan not with troops but with a letter — and the eight words "Liu Bei and Sun Quan are close on the surface and estranged underneath" were the most valuable sentence of the age. An enemy alliance need not be broken by force. Show it an advantage and it breaks itself.',
      verdictLostZh:
        '論曰:割江南以封權,虛言也;而權受之 ——'
        + '非不知其虛,是他本來就想要那塊地。',
      verdictLostEn:
        'The historian says: the offer to cede the south was empty words, and Quan took it — not because he could not see it was empty, but because he wanted that land anyway.',
    },
  },
  /* ── 225 南征之役 ─────────────────────────────────────────────── */
  'scn-225-southern': {
    'liu-bei': {
      defeat: {
        titleZh: '攻心為上',
        titleEn: 'Attack the Heart',
        textZh:
          '南中四郡皆反。亮曰:「若留外人,則當留兵;兵留則無所食,'
          + '一不易也。加夷新傷破,父兄死喪,留外人而無兵者,'
          + '必成禍患,二不易也。……三不易也。」\n\n'
          + '馬謖送之數十里,曰:「夫用兵之道,攻心為上,攻城為下;'
          + '心戰為上,兵戰為下。願公服其心而已。」\n\n'
          + '七縱七擒,獲曰:「公,天威也,南人不復反矣。」'
          + '遂至滇池。即其渠率而用之,不留兵,不運糧。',
        textEn:
          'All four commanderies of the south rose. Liang said: "If I leave outsiders in charge I must leave troops; leave troops and there is nothing to feed them — that is the first difficulty. The tribes have just been beaten and have fathers and brothers dead; leave outsiders without troops and it becomes a calamity — that is the second... and there is a third."\n\n'
          + 'Ma Su saw him off for dozens of li: "In the use of troops, attacking the heart is highest and attacking walls lowest; a war of minds is highest and a war of arms lowest. I hope Your Excellency will simply win their hearts."\n\n'
          + 'Seven times released and seven times taken, Huo said: "Your Excellency, this is Heaven\'s authority. The southern people will not rebel again." So he went on to Lake Dian, appointed their own chieftains to govern them, left no garrison and shipped no grain.',
      },
      verdictZh:
        '論曰:南征之功,不在克敵,在**不留兵**。'
        + '留兵則糧不繼,不留兵則其心自服 —— 亮之所以能北伐者,'
        + '正以南中無後顧之憂。故曰:攻心者,省兵之術也。',
      verdictEn:
        'The historian says: the achievement of the southern campaign was not beating anyone but leaving no garrison. Garrison it and the supply fails; leave it ungarrisoned and the place settles itself. Liang could go north afterwards precisely because the south needed no watching. Winning hearts is, among other things, an economy of troops.',
      verdictLostZh:
        '論曰:南中之亂,起於雍闓之附吳而終於孟獲之心服 ——'
        + '一叛一服之間,所爭者不是兵力,是有沒有人肯替你說話。',
      verdictLostEn:
        "The historian says: the southern rising began with Yong Kai going over to Wu and ended with Meng Huo's heart. Between a revolt and a submission, what is at stake is not troop strength but whether anyone will speak for you.",
    },
    nanman: {
      defeat: {
        titleZh: '七擒七縱',
        titleEn: 'Seven Times Taken',
        textZh:
          '你被擒了七次。第一次你說地勢不熟,第二次你說手下無能,'
          + '第三次你說是弟弟壞事 —— 每一次他都放你回去。\n\n'
          + '第七次,你不說了。',
        textEn:
          'You were taken seven times. The first time you said you did not know the ground; the second, that your officers were useless; the third, that your brother had spoiled it. Every time he let you go.\n\n'
          + 'The seventh time, you stopped talking.',
      },
      verdictZh:
        '論曰:蠻夷之叛服,常在一人之心。'
        + '獲之七擒而服,非力屈也,是無話可說 ——'
        + '而無話可說,正是心服之始。',
      verdictEn:
        'The historian says: whether a border people rises or submits usually turns on one man. Huo submitted after seven captures not because his strength was gone but because he had run out of things to say — and having nothing left to say is where genuine submission begins.',
      verdictLostZh:
        '論曰:南中不置官,不留兵,而終蜀之世不復大反 ——'
        + '此非蠻夷之易服,是治之者知其所欲。',
      verdictLostEn:
        'The historian says: no officials were installed in the south and no troops left, and there was no great rising again for the rest of Shu\'s existence. That is not because border peoples are easily pacified. It is because the man who settled it understood what they wanted.',
    },
    cao: {
      defeat: {
        titleZh: '坐視其南',
        titleEn: 'Watching the South',
        textZh:
          '蜀方南征,國中空虛 —— 而魏之群臣議伐蜀,'
          + '曹丕方三路伐吳,不暇及也。\n\n'
          + '一年之後,亮還成都,治戎講武;又三年,出祁山。',
        textEn:
          'Shu was campaigning in the south and the country behind was empty — and while the Wei court debated an invasion, Cao Pi had three armies committed against Wu and no attention to spare.\n\n'
          + 'A year later Liang was back in Chengdu drilling troops. Three years after that, he came out at Qishan.',
      },
      verdictZh:
        '論曰:敵之虛,不在其境之空,在我之能不能及。'
        + '魏之伐吳三路皆無功,而蜀之南中一舉而定 ——'
        + '同一年,兩國各用其兵,而所得相去如此。',
      verdictEn:
        "The historian says: an enemy's weakness is not a matter of his country being empty but of whether you can reach it. Wei's three columns against Wu achieved nothing that year while Shu settled the whole south in one campaign. The same year, two states spent their armies, and this was the difference in what they bought.",
      verdictLostZh:
        '論曰:三路伐吳而無功者,以其分也。分兵者,示強而實弱。',
      verdictLostEn:
        'The historian says: three columns against Wu achieved nothing because they were three. Dividing an army displays strength and produces weakness.',
    },
    sun: {
      defeat: {
        titleZh: '遙署永昌太守',
        titleEn: 'A Governor Appointed from a Thousand Li Away',
        textZh:
          '雍闓殺太守而附吳,你遙署他為永昌太守 ——'
          + '一紙任命,不費一兵,而蜀之後方亂了三年。\n\n'
          + '而後諸葛亮南征,四郡皆平。你的那位太守,'
          + '死在自己人手裡。',
        textEn:
          'Yong Kai killed the administrator and came over to you, and you appointed him Grand Administrator of Yongchang from a thousand li away — one sheet of paper, not one soldier, and the rear of Shu was in disorder for three years.\n\n'
          + 'Then Zhuge Liang went south and all four commanderies were settled. Your administrator was killed by his own people.',
      },
      verdictZh:
        '論曰:遙制之術,費省而效速 —— 然所立者,'
        + '非其力所能保。故雍闓死而吳不能救,'
        + '南中之地,終為蜀有。',
      verdictEn:
        'The historian says: governing at a distance by appointment is cheap and quick — and what you set up that way you cannot protect. So Yong Kai died and Wu could not save him, and the south ended in Shu\'s hands.',
      verdictLostZh:
        '論曰:以一紙亂人之後方,善謀也;而謀止於此,則亦止於一紙。',
      verdictLostEn:
        "The historian says: to disorder an enemy's rear with a single document is good scheming. Scheming that stops there also stops at a single document.",
    },
  },
  /* ── 228 街亭之戰 ─────────────────────────────────────────────── */
  'scn-228-jieting': {
    'liu-bei': {
      defeat: {
        titleZh: '舍水上山',
        titleEn: 'Off the Water, onto the Hill',
        textZh:
          '亮出祁山,南安、天水、安定三郡叛魏應亮,關中響震。\n\n'
          + '而亮違眾拔謖,統大眾在前。謖舍水上山,舉措煩擾,'
          + '王平連規諫謖,謖不能用 —— 張郃絕其汲道,擊,大破之。\n\n'
          + '亮拔西縣千餘家還漢中,戮謖以謝眾。'
          + '上疏曰:「臣以弱才,叨竊非據……請自貶三等,以督厥咎。」',
        textEn:
          'Liang came out at Qishan and three commanderies — Nan\'an, Tianshui and Anding — went over from Wei to him, and Guanzhong shook.\n\n'
          + 'And Liang, against everyone\'s advice, promoted Ma Su to command the van. Su left the water and went up the hill, and his dispositions were fussy and confused; Wang Ping remonstrated again and again and Su would not use it — and Zhang He cut him off from the water, attacked, and broke him utterly.\n\n'
          + 'Liang took a thousand households from Xi county back to Hanzhong and executed Su to answer for it, and memorialised: "With feeble talent I have usurped a place not mine... I ask to be demoted three ranks, to bear the blame."',
      },
      verdictZh:
        '論曰:街亭之敗,敗於用人。先主臨終謂亮曰:'
        + '「馬謖言過其實,不可大用,君其察之!」而亮違眾用之。\n'
        + '及敗,戮謖而自貶三等 —— 知過而肯自罰者,古今為將者少。'
        + '然一戰之失,三郡復入於魏,關中之震,自此不復有。',
      verdictEn:
        'The historian says: Jieting was lost in the choosing of a man. On his deathbed the First Lord told Liang: "Ma Su\'s words outrun his substance; he cannot be given great responsibility. Watch him." And Liang, against everyone, used him. When it failed he executed Su and demoted himself three ranks — few commanders in any age both see their error and punish themselves for it. But one lost battle put three commanderies back into Wei, and Guanzhong never shook again.',
      verdictLostZh:
        '論曰:出師之初,三郡響應;一敗之後,終亮之世,'
        + '再無一郡叛魏而應蜀。人心之向背,常決於第一仗。',
      verdictLostEn:
        'The historian says: at the outset three commanderies came over. After the one defeat, not a single commandery ever went over to Shu again in Liang\'s lifetime. Which way people lean is usually settled by the first battle.',
    },
    cao: {
      defeat: {
        titleZh: '張郃絕其汲道',
        titleEn: 'Zhang He Cut Them Off from the Water',
        textZh:
          '三郡叛,朝野恐懼。帝曰:「亮阻山為固,今者自來,'
          + '既亮貪三郡,知進而不知退,今因此時,破亮必也。」'
          + '乃遣張郃西拒之。\n\n'
          + '郃至街亭,見謖依阻南山,不下據城 ——'
          + '絕其汲道,擊,大破之。三郡復平。',
        textEn:
          'Three commanderies revolted and the court took fright. The emperor said: "Liang had mountains to make himself safe in, and now he has come out of his own accord. Since he covets three commanderies and knows how to advance but not how to withdraw, this is the moment: he will certainly be broken." And sent Zhang He west.\n\n'
          + 'He reached Jieting, saw Su had gone up the southern hill instead of holding the town below — cut him off from the water, attacked, and broke him. The three commanderies were quiet again.',
      },
      verdictZh:
        '論曰:魏之勝街亭,勝在一將之目力。'
        + '郃見謖舍水上山,不待命而絕其汲道 ——'
        + '兵之勝負,有時只在看見對方站錯了地方的那一眼。',
      verdictEn:
        "The historian says: Wei won at Jieting on one general's eye. He saw that Su had left the water for the hill, cut the water without waiting for orders, and that was the battle. Sometimes the whole thing is the moment when someone notices the other man is standing in the wrong place.",
      verdictLostZh:
        '論曰:郃自街亭之後,為蜀所深憚;而三年之後,'
        + '死於木門之弩下 —— 司馬懿使之追,郃曰不可,而不得已。',
      verdictLostEn:
        'The historian says: after Jieting, Shu was thoroughly wary of Zhang He. Three years later he died under the crossbows at Mumen — Sima Yi ordered the pursuit, He said it should not be made, and made it anyway.',
    },
    sun: {
      defeat: {
        titleZh: '石亭在後',
        titleEn: 'Shiting Comes Later',
        textZh:
          '蜀出祁山而敗於街亭 —— 而這一年秋天,'
          + '周魴詐降誘曹休,陸遜大破之於石亭。\n\n'
          + '同一年,兩國各出其兵,一敗一勝 ——'
          + '而勝的那一家,也沒有再往前一步。',
        textEn:
          'Shu came out at Qishan and lost at Jieting — and that autumn Zhou Fang faked a defection to draw in Cao Xiu, and Lu Xun broke him at Shiting.\n\n'
          + 'The same year, two states sent out their armies, one lost and one won — and the one that won did not take a step further either.',
      },
      verdictZh:
        '論曰:蜀敗於西而吳勝於東,同在一年 ——'
        + '而魏之疆域,終歲未減一縣。'
        + '兩國各勝其勝,各敗其敗,而不能合為一事:此三分之所以久也。',
      verdictEn:
        "The historian says: Shu lost in the west and Wu won in the east in the same year — and Wei's borders were not a single county smaller at the end of it. Each state had its own victory and its own defeat and could not make them into one thing. That is why the three-way split lasted.",
      verdictLostZh:
        '論曰:同盟而不能同時者,其盟止於使敵不能專力於一方 ——'
        + '而三分之世,這已經足夠了。',
      verdictLostEn:
        'The historian says: an alliance that cannot act simultaneously amounts to keeping the enemy from concentrating on one side. In an age of three powers, that turned out to be enough.',
    },
  },
  /* ── 238 遼東·襄平之戰 ────────────────────────────────────────── */
  'scn-238-liaodong': {
    yan: {
      defeat: {
        titleZh: '燕王之號,兩年而已',
        titleEn: 'King of Yan, for Two Years',
        textZh:
          '你先遣使南通孫權,權遣使拜你為燕王 —— 而你斬其使,'
          + '送首於魏。魏拜你為大司馬、樂浪公。\n\n'
          + '兩面皆賣,兩面皆不信。而後你自立為燕王,置百官。\n\n'
          + '司馬懿至,四月而克襄平。城破之日,'
          + '男子年十五已上七千餘人皆殺之,以為京觀。',
        textEn:
          'First you sent envoys south to Sun Quan, and Quan sent envoys to make you King of Yan — and you beheaded them and sent the heads to Wei. Wei made you Grand Marshal and Duke of Lelang.\n\n'
          + 'You sold both sides and neither believed you afterwards. Then you declared yourself King of Yan and appointed a full set of officials.\n\n'
          + 'Sima Yi came, and Xiangping fell in four months. On the day the walls went, more than seven thousand males aged fifteen and up were killed and piled into a victory mound.',
      },
      verdictZh:
        '論曰:淵之亡,亡於兩賣。'
        + '通吳以抗魏,可也;既通而斬其使,則吳不復救;'
        + '受魏之封而後自王,則魏不復容。\n'
        + '夫小國之存,恃一大國之庇;兩庇之而兩失之,'
        + '則四十年之基,四月而盡。',
      verdictEn:
        'The historian says: Yuan fell by selling both sides. To approach Wu against Wei was reasonable; to approach them and then behead their envoys meant Wu would never come to his aid. To accept a title from Wei and then crown himself meant Wei would never tolerate him. A small state survives under the shelter of a large one. He tried for two shelters and lost both, and forty years of foundation went in four months.',
      verdictLostZh:
        '論曰:公孫氏據遼東三世五十年,而亡於一人之反覆。'
        + '守遠地者,信為第一事 —— 遠則兵不能及,唯信可以及。',
      verdictLostEn:
        'The historian says: the Gongsun held Liaodong for three generations and fifty years, and it ended in one man\'s double-dealing. For a state far from anywhere, credibility is the first requirement — armies cannot reach that far; only a reputation can.',
    },
    cao: {
      defeat: {
        titleZh: '四月而克',
        titleEn: 'Four Months',
        textZh:
          '帝問懿:「往還幾日?」對曰:「往百日,攻百日,還百日,'
          + '以六十日為休息,一年足矣。」\n\n'
          + '會霖雨三十餘日,遼水暴漲,運船自遼口徑至城下。'
          + '諸將欲移營,懿斬令曰:「敢有言徙者斬。」\n\n'
          + '雨霽,乃合圍,起土山地道,晝夜攻之 —— 城破。',
        textEn:
          'The emperor asked Yi how long the round trip would take. "A hundred days out, a hundred days to take it, a hundred days back, and sixty to rest. A year is enough."\n\n'
          + 'Then it rained for thirty days and more, the Liao rose, and the supply boats came up from the estuary right to the walls. His generals wanted to move camp, and he had the order posted: any man who mentions moving is executed.\n\n'
          + 'When the rain cleared he closed the ring, raised earthworks and drove tunnels, and attacked day and night. The walls came down.',
      },
      verdictZh:
        '論曰:懿之料敵,先計日而後行 —— 一年之期,'
        + '果如其言。而霖雨三十日,諸將皆欲徙,獨懿不動:'
        + '所恃者非天時,是**已經算過的那個數**。',
      verdictEn:
        'The historian says: he counted the days before he moved, and the year came out as he had said. And when it rained for thirty days and every general wanted to shift camp, he alone did not move — what he was standing on was not the weather but a number he had already worked out.',
      verdictLostZh:
        '論曰:襄平既破,坑其男子七千餘人 —— 遼東自此虛,'
        + '而高句麗、鮮卑遂入其地。滅一國而不能有其民,'
        + '所得者土,所失者藩。',
      verdictLostEn:
        'The historian says: when Xiangping fell, seven thousand men were put in a pit. Liaodong was empty afterwards, and Goguryeo and the Xianbei moved into it. To destroy a state without keeping its people is to gain ground and lose a buffer.',
    },
  },
  /* ── 220 三國鼎立 ─────────────────────────────────────────────── */
  'scn-220-declaration': {
    cao: {
      defeat: {
        titleZh: '受禪臺上',
        titleEn: 'On the Altar of Abdication',
        textZh:
          '延康元年十月,漢帝告祠高廟,使張音奉璽綬詔冊,禪位於魏。'
          + '築壇於繁陽,庚午,王升壇即阼,百官陪位。\n\n'
          + '禮畢,顧謂群臣曰:「舜、禹之事,吾知之矣。」\n\n'
          + '這句話是實話。而實話說出口的那一刻,'
          + '四百年的漢就真的完了 —— 不是因為誰打贏了,'
          + '是因為終於有人肯把它說破。',
        textEn:
          'In the tenth month of the first year of Yankang the Han emperor announced it at the high temple and sent Zhang Yin with the seals and the edict, abdicating in favour of Wei. An altar was raised at Fanyang, and on the gengwu day the king mounted it and took the throne with the officials ranged below.\n\n'
          + 'When the ceremony was over he turned to his court and said: "Now I understand the business of Shun and Yu."\n\n'
          + 'It was a true remark. And in the moment it was said aloud, four hundred years of Han were really over — not because anyone had won, but because somebody was finally willing to say it.',
      },
      verdictZh:
        '論曰:魏之代漢,以禪為名。'
        + '禪者,堯舜之事也;而堯舜之事,自魏而後,'
        + '為權臣易代之通用文書 —— 晉受魏禪,宋受晉禪,'
        + '齊梁陳隋皆用此禮。\n'
        + '曹丕一句「舜禹之事,吾知之矣」,說破的不只是他自己。',
      verdictEn:
        'The historian says: Wei replaced Han under the name of abdication. Abdication was the business of Yao and Shun — and after Wei it became the standard paperwork by which a powerful minister changes a dynasty. Jin took Wei\'s abdication, Song took Jin\'s, and Qi, Liang, Chen and Sui all used the same rite. Cao Pi\'s one line about understanding the business of Shun and Yu gave away rather more than himself.',
      verdictLostZh:
        '論曰:受禪之易,正是其後三代亡國之易。'
        + '既以此得之,則不能禁人之以此取之。',
      verdictLostEn:
        'The historian says: the ease of taking a throne by abdication was exactly the ease with which three later houses lost theirs. Having got it that way, you cannot forbid anyone else to take it that way.',
    },
    'liu-bei': {
      defeat: {
        titleZh: '天下未有無君之國',
        titleEn: 'No Realm Has Ever Been without a Sovereign',
        textZh:
          '漢帝見害之訊至成都 —— 訊是假的,而你不知道。\n\n'
          + '群臣勸進,你怒曰:「孤何忍為此!」'
          + '諸葛亮曰:「今曹氏篡漢,天下無主,大王劉氏苗族,'
          + '紹世而起,今即帝位,乃其宜也。」\n\n'
          + '而後你稱帝於成都,國號漢 ——'
          + '所繼者非國,是那一個字。',
        textEn:
          'Word reached Chengdu that the Han emperor had been murdered. The report was false, and you did not know that.\n\n'
          + 'The court urged you to take the throne and you were angry: "How could I bear to do such a thing?" And Zhuge Liang said: "The house of Cao has usurped Han and the realm has no sovereign. Your Highness is of the seed of Liu, rising to continue the line. To take the imperial position now is entirely fitting."\n\n'
          + 'So you took the throne at Chengdu, and called the state Han — what you were continuing was not a country. It was one character.',
      },
      verdictZh:
        '論曰:先主之稱帝,以繼漢為名 —— 而所繼者,一州之地耳。'
        + '然名之為用大矣:蜀之君臣以此自任,四十年間,'
        + '雖弱而不肯降,雖敗而不肯改號。'
        + '國小而志不小者,恃此一字。',
      verdictEn:
        'The historian says: the First Lord took the throne in the name of continuing Han — and what he continued amounted to one province. But a name can do a great deal of work: the lord and officers of Shu took it as their charge, and for forty years, weak as they were, they would not surrender, and beaten as they were, they would not change the name of the state. A small country with large ambitions was standing on that one character.',
      verdictLostZh:
        '論曰:漢帝實未死,而蜀已為之發喪 ——'
        + '正統之爭,有時不必等真相。',
      verdictLostEn:
        'The historian says: the Han emperor was not in fact dead, and Shu had already held his funeral. A contest over legitimacy does not always wait for the facts.',
    },
    sun: {
      defeat: {
        titleZh: '稱藩',
        titleEn: 'Vassal',
        textZh:
          '曹丕受禪,你遣使奉章,並送于禁等還 ——'
          + '丕遣邢貞拜你為吳王,加九錫。\n\n'
          + '群臣以為宜稱上將軍九州伯,不當受魏封。'
          + '你曰:「九州伯,於古未聞也。昔沛公亦受項羽拜為漢王,'
          + '蓋時宜耳,復何損邪?」\n\n'
          + '受封之後八年,你自己稱帝。'
          + '那八年裡,魏以為你是臣,而蜀以為你是敵。',
        textEn:
          'When Cao Pi took the abdication you sent a memorial of submission and returned Yu Jin and the others — and Pi sent Xing Zhen to invest you as King of Wu with the nine bestowals.\n\n'
          + 'Your court thought you should style yourself Supreme General and Count of the Nine Provinces and not accept Wei\'s patent. And you said: "Count of the Nine Provinces was never heard of in antiquity. The Duke of Pei once accepted the title King of Han from Xiang Yu; it suited the moment. Where is the harm?"\n\n'
          + 'Eight years after accepting it you declared yourself emperor. During those eight years Wei took you for a subject and Shu took you for an enemy.',
      },
      verdictZh:
        '論曰:權之稱藩,權宜也;而權宜之久,亦成一種身分。'
        + '八年之間,北面事魏而東拒蜀 —— 所省者兩線之兵,'
        + '所費者一國之名。及其自立,天下已不甚驚。',
      verdictEn:
        'The historian says: his submission was expedience, and expedience kept up long enough becomes a status of its own. For eight years he faced north as a subject and held off Shu in the east, saving himself a two-front war at the cost of his state\'s standing. When he did crown himself, nobody in the realm was very surprised.',
      verdictLostZh:
        '論曰:三家之中,吳最後稱帝,而最先受人之封 ——'
        + '知所先後,亦一國之術。',
      verdictLostEn:
        'The historian says: of the three, Wu was the last to claim the throne and the first to accept someone else\'s patent. Knowing which comes first is also a way of running a state.',
    },
  },
  /* ── 265 司馬炎篡魏 ───────────────────────────────────────────── */
  'scn-265-jin-founded': {
    sima: {
      defeat: {
        titleZh: '司馬昭之心',
        titleEn: 'What Sima Zhao Was After',
        textZh:
          '高貴鄉公曰:「司馬昭之心,路人所知也。'
          + '吾不能坐受廢辱,今日當與卿等自出討之。」\n\n'
          + '乃拔劍升輦,率殿中宿衛蒼頭官僮鼓譟而出。'
          + '賈充呼成濟曰:「畜養汝等,正為今日!」'
          + '濟即前刺帝,刃出於背。\n\n'
          + '五年之後,炎受禪。而弒君那一筆,'
          + '史書寫在那一家的頭上,寫了三百年。',
        textEn:
          'The Duke of Gaogui said: "What Sima Zhao is after, every man in the street knows. I will not sit and be deposed and disgraced. Today I shall go out against him with you."\n\n'
          + 'And he drew his sword, mounted his carriage, and went out at the head of the palace guards, the grooms and the household boys, shouting. Jia Chong called to Cheng Ji: "You have been kept and fed for exactly this day!" And Ji went forward and ran the emperor through, the blade coming out at his back.\n\n'
          + 'Five years later Yan took the abdication. And the killing of a sovereign was written against that family in the histories for three hundred years.',
      },
      verdictZh:
        '論曰:晉之代魏,與魏之代漢,禮同而事異 ——'
        + '魏之受禪,漢帝尚存;晉之受禪,魏帝已弒其一。'
        + '故晉雖有天下,而不能以名義服人;'
        + '八王之亂,永嘉之禍,其原不在惠帝,在甘露五年那一輛車。',
      verdictEn:
        'The historian says: Jin replaced Wei by the same rite Wei used on Han, and it was not the same thing. When Wei took the abdication, the Han emperor was alive. When Jin took it, one Wei emperor had already been murdered. So Jin held the realm and could never make its claim stick; the war of the eight princes and the Yongjia catastrophe did not begin with Emperor Hui — they began with a carriage in the fifth year of Ganlu.',
      verdictLostZh:
        '論曰:得國不正者,常以嚴法自防;'
        + '而防其外者,終不能防其內。',
      verdictLostEn:
        'The historian says: a house that takes a state by dubious means usually protects itself with severe laws — and guarding the outside never guards the inside.',
    },
    sun: {
      defeat: {
        titleZh: '西陵猶在',
        titleEn: 'Xiling Still Holds',
        textZh:
          '魏亡,晉立。而吳仍在江南 ——'
          + '陸抗在西陵,丁奉在江北,長江仍是長江。\n\n'
          + '孫皓卻在建業鑿人之眼,剝人之面。\n\n'
          + '十五年,不算長。',
        textEn:
          'Wei ended and Jin began, and Wu was still there south of the river — Lu Kang at Xiling, Ding Feng north of the water, and the Yangtze still the Yangtze.\n\n'
          + 'And Sun Hao was in Jianye gouging out eyes and flaying faces.\n\n'
          + 'Fifteen years is not long.',
      },
      verdictZh:
        '論曰:吳之能久,以江;其終亡,以人。'
        + '江者,守之具也;人者,守江者也。'
        + '具在而人不在,則江與平地同。',
      verdictEn:
        'The historian says: Wu lasted because of the river and ended because of its people. The river is the instrument of defence; people are what defends with it. Keep the instrument and lose the people, and the river is level ground.',
      verdictLostZh:
        '論曰:晉之立,吳臣或請乘其新造而伐之 ——'
        + '皓不能用,而以為天命在己。十五年後,天命在王濬的樓船上。',
      verdictLostEn:
        'The historian says: when Jin was founded some of Wu\'s officers asked to strike while it was new. Hao would not, and took it that the mandate was his. Fifteen years later the mandate was aboard Wang Jun\'s tower-ships.',
    },
  },
  /* ── 272 西陵之戰 ─────────────────────────────────────────────── */
  'scn-272-xiling': {
    sun: {
      defeat: {
        titleZh: '陸抗圍步闡,而不救外圍',
        titleEn: 'Lu Kang Ringed Bu Chan and Ignored the Relief',
        textZh:
          '步闡據西陵以降晉。抗至,令諸軍築嚴圍,自赤谿至故市,'
          + '內以圍闡,外以禦寇 —— 晝夜催切,如敵已至。\n\n'
          + '諸將咸諫:「今宜及三軍之銳,亟攻闡,比晉救至,'
          + '闡必可拔。何事於圍,而以弊士民之力乎?」\n\n'
          + '抗曰:「此城處勢既固,糧穀又足,且所繕修備禦之具,'
          + '皆抗所宿規。今反攻之,不可猝拔。'
          + '及晉救船至,而吾無以禦之,此乃表裡受難也。」\n\n'
          + '及羊祜等至,果不能克。闡遂敗,夷三族。',
        textEn:
          'Bu Chan held Xiling and went over to Jin. Kang came up and had a heavy line dug from Chixi to Gushi — inward to invest Chan, outward to hold off relief — driving the work day and night as though the enemy were already in sight.\n\n'
          + 'His generals all objected: "We should use the edge our men have now and storm Chan at once. He can certainly be taken before the Jin relief arrives. Why build lines and wear out the strength of soldiers and civilians?"\n\n'
          + 'And Kang said: "That city sits on strong ground and has grain enough, and every one of its defence works was laid out by me. Turn and storm it and it will not fall quickly. And when the Jin relief boats arrive I shall have nothing to hold them with, and we shall be in trouble from both directions at once."\n\n'
          + 'Yang Hu and the rest came, and could do nothing. Chan fell, and three degrees of his family with him.',
      },
      verdictZh:
        '論曰:抗之守西陵,先為不可勝而後求勝 ——'
        + '諸將欲速,而抗知其城之堅者,以其備皆己所規也。'
        + '知己知彼,常人以為兩事;抗之知彼,正是知己。',
      verdictEn:
        'The historian says: at Xiling he made himself unbeatable first and looked for the victory afterwards. His officers wanted speed; he knew how strong the place was because he had designed its works himself. Knowing yourself and knowing the enemy are usually treated as two things. In his case, knowing the enemy was knowing himself.',
      verdictLostZh:
        '論曰:抗卒之後,吳無守江之人。'
        + '羊祜與抗對境,而祜曰:「抗存,吳未可圖也。」'
        + '——一人之存亡,而一國之期在焉。',
      verdictLostEn:
        'The historian says: after Kang died Wu had no one to hold the river. Yang Hu faced him across the border and said: "While Kang lives, Wu cannot be planned against." One man\'s life, and a state\'s remaining time inside it.',
    },
    sima: {
      defeat: {
        titleZh: '羊祜與陸抗',
        titleEn: 'Yang Hu and Lu Kang',
        textZh:
          '祜與抗對境,使命交通。抗遺祜酒,祜飲之不疑;'
          + '抗有疾,祜饋之藥,抗服之不疑 ——'
          + '人以為譏,抗曰:「羊祜豈鴆人者!」\n\n'
          + '西陵一敗,祜坐貶。而後八年,他上表請伐吳,'
          + '曰:「吳平則胡自定,但當速濟大功耳。」\n\n'
          + '表上而不用。祜卒,舉杜預自代 ——'
          + '五年之後,王濬的船下建業。',
        textEn:
          'Hu and Kang faced each other across the frontier and their envoys came and went. Kang sent Hu wine and Hu drank it without hesitation; Kang was ill and Hu sent him medicine and he took it without hesitation — and when people made insinuations Kang said: "Is Yang Hu a man who poisons people?"\n\n'
          + 'After the defeat at Xiling, Hu was demoted. Eight years later he memorialised for an invasion of Wu: "Settle Wu and the northern tribes settle themselves. The only thing is to get the great work done quickly."\n\n'
          + 'The memorial was submitted and not acted on. Hu died, recommending Du Yu to take his place — and five years after that, Wang Jun\'s ships came down to Jianye.',
      },
      verdictZh:
        '論曰:祜之於抗,敵國也,而以信相與 ——'
        + '此非婦人之仁,是伐國之遠謀:'
        + '使吳人知晉之可信,則他日之降者不疑。'
        + '故曰:滅國者,不始於兵。',
      verdictEn:
        'The historian says: Hu and Kang were officers of enemy states and dealt with each other in good faith. That was not softness but long-range strategy for taking a country: let the men of Wu learn that Jin can be trusted, and those who come over later will not hesitate. Hence: the destruction of a state does not begin with soldiers.',
      verdictLostZh:
        '論曰:祜請伐吳而朝議不許,及其卒,而後用其言 ——'
        + '天下之事,常成於言者已歿之後。',
      verdictLostEn:
        'The historian says: Hu asked to invade and the court refused; after he died they did what he had said. Things in this world are commonly accomplished after the man who proposed them is dead.',
    },
  },
  /* ── 218 定軍山·漢中之戰 ──────────────────────────────────────── */
  'scn-218-dingjun': {
    'liu-bei': {
      defeat: {
        titleZh: '男子當戰,女子當運',
        titleEn: 'The Men Fight and the Women Carry',
        textZh:
          '法正曰:「曹操一舉而降張魯,定漢中,不因此勢以圖巴蜀,'
          + '而留夏侯淵、張郃屯守,身遽北還 —— 此非其智不逮而力不足也,'
          + '必將內有憂偪故耳。」\n\n'
          + '黃忠推鋒必進,一戰而斬淵。及操自來爭,'
          + '先主曰:「曹公雖來,無能為也,我必有漢川矣。」'
          + '斂眾拒險,終不交鋒 ——\n\n'
          + '蜀中發兵者眾,男子當戰,女子當運。'
          + '操積月不拔,亡者日多,遂引軍還。',
        textEn:
          'Fa Zheng said: "Cao Cao took Zhang Lu\'s surrender and settled Hanzhong in one stroke, and then did not use the position to move on Ba and Shu — he left Xiahou Yuan and Zhang He to garrison it and went hurrying north himself. That is not because his judgement failed or his strength was short. He must have trouble at home."\n\n'
          + 'Huang Zhong drove his point in and killed Yuan in a single fight. When Cao came himself to contest it, the First Lord said: "Cao may come; he can do nothing. Hanchuan is mine." And he drew his men in behind the passes and would not engage —\n\n'
          + 'Shu was sending everything it had: the men fighting, the women carrying. Cao spent months without taking anything, losing more men every day, and led his army home.',
      },
      verdictZh:
        '論曰:漢中之得,蜀之極盛;而「男子當戰,女子當運」八字,'
        + '亦是蜀之極限。一州之力,傾國而戰,勝之而國已疲 ——'
        + '故王業之基雖立,而其後六出祁山,終不能再有一個漢中。',
      verdictEn:
        'The historian says: taking Hanzhong was the height of Shu — and the eight words about the men fighting and the women carrying are also the measure of its ceiling. One province, everything thrown in, a victory that left the country exhausted. The foundation of a royal enterprise was laid; and in six later campaigns out of Qishan there was never another Hanzhong.',
      verdictLostZh:
        '論曰:操之棄漢中,曰「雞肋」—— 食之無所得,棄之如可惜。'
        + '而先主之取漢中,傾一國以就之。同一塊地,二人所計不同,'
        + '故所得亦不同。',
      verdictLostEn:
        'The historian says: Cao called Hanzhong a chicken rib — nothing on it worth eating, and a pity to throw away. Liu Bei emptied a country to get it. The same piece of ground: two men reckoned it differently, and got correspondingly different things.',
    },
    cao: {
      defeat: {
        titleZh: '雞肋',
        titleEn: 'Chicken Ribs',
        textZh:
          '王欲還,出令曰「雞肋」。官屬不知所謂。'
          + '主簿楊修便自嚴裝,人驚問之,修曰:'
          + '「夫雞肋,棄之如可惜,食之無所得,以比漢中,知王欲還也。」\n\n'
          + '而夏侯淵已死於定軍山下 —— 淵為督帥,'
          + '而自將四百兵行鹿角,分兵半助張郃,'
          + '黃忠乘高鼓譟而下,一戰斬之。\n\n'
          + '操聞之曰:「當固守,何以行鹿角!」',
        textEn:
          'The king meant to withdraw and gave out the watchword "chicken ribs." His staff did not know what he meant. The recorder Yang Xiu packed his own baggage, and when people asked in astonishment he said: "A chicken rib is a pity to throw away and has nothing on it to eat. Compared to Hanzhong, that means the king intends to go home."\n\n'
          + 'And Xiahou Yuan was already dead below Dingjun mountain — the commander-in-chief, going out himself with four hundred men to repair the abatis, half his force detached to help Zhang He, when Huang Zhong came down off the high ground shouting and killed him in one fight.\n\n'
          + 'Cao heard of it and said: "He should have held his position. What was he doing repairing abatis?"',
      },
      verdictZh:
        '論曰:淵之死,死於督帥而自行小役。'
        + '操嘗戒之曰:「為將當有怯弱時,不可但恃勇也。」而淵不改。\n'
        + '至於漢中之棄,則非戰之罪:'
        + '**一州之地,爭之者傾國,守之者分兵** —— 遠者常負。',
      verdictEn:
        'The historian says: Xiahou Yuan died because a commander-in-chief went out to do a working party\'s job. Cao had warned him: "A general must know when to be timid; courage alone will not do." He did not change. As for giving up Hanzhong, that was not a failure of arms: **the side contesting a province empties itself into it, and the side holding it must divide** — and distance loses.',
      verdictLostZh:
        '論曰:雞肋之令,楊修解之而先自嚴裝 —— 後坐是死。'
        + '知主之意者,不必說出來。',
      verdictLostEn:
        'The historian says: Yang Xiu read the watchword and packed first — and was executed for it later. Knowing your lord\'s mind does not oblige you to say so out loud.',
    },
    sun: {
      defeat: {
        titleZh: '合肥之後,濡須之前',
        titleEn: 'After Hefei, before Ruxu',
        textZh:
          '曹劉爭漢中,而你在東邊修濡須塢。\n\n'
          + '三年前逍遙津那一場,張遼八百人衝了你十萬眾 ——'
          + '自此江北之地,你不再輕出。\n\n'
          + '而荊州還在關羽手裡。你在等的不是漢中的結果,'
          + '是那個人什麼時候把兵調去打樊城。',
        textEn:
          'Cao and Liu were fighting over Hanzhong, and you were building the works at Ruxu in the east.\n\n'
          + 'Three years before at Xiaoyaojin, Zhang Liao had charged your hundred thousand with eight hundred men. You did not go lightly north of the river after that.\n\n'
          + 'And Jing province was still in Guan Yu\'s hands. What you were waiting for was not the outcome in Hanzhong. It was the day that man moved his troops off to attack Fan.',
      },
      verdictZh:
        '論曰:漢中之役,吳未出一兵,而所得最多 ——'
        + '曹劉相持而俱疲,關羽北伐而後方虛,'
        + '呂蒙之計,正生於此二年之間。'
        + '故曰:三分之世,善為國者,不必在戰場上。',
      verdictEn:
        'The historian says: Wu sent not one soldier to the Hanzhong campaign and got the most out of it. Cao and Liu wore each other down; Guan Yu went north and left his rear empty; and Lü Meng\'s plan was born in exactly those two years. In an age of three powers, the man who runs his state best is not necessarily on a battlefield.',
      verdictLostZh:
        '論曰:逍遙津之後,權不復輕合肥;'
        + '而不輕者,乃能待其可乘之時。',
      verdictLostEn:
        'The historian says: after Xiaoyaojin, Quan never took Hefei lightly again — and a man who stops taking things lightly is a man who can wait for his moment.',
    },
  },
  /* ── 215 合肥之戰 ─────────────────────────────────────────────── */
  'scn-215-hefei': {
    sun: {
      defeat: {
        titleZh: '逍遙津上',
        titleEn: 'At Xiaoyao Ford',
        textZh:
          '權率十萬眾圍合肥,而城中七千人。\n\n'
          + '遼夜募敢從之士,得八百人,椎牛饗將士,明日大戰。'
          + '平旦,遼被甲持戟,先登陷陣,殺數十人,斬二將,'
          + '大呼自名,衝壘入,至權麾下 —— 權大驚,走登高冢,以長戟自守。\n\n'
          + '圍十餘日,城不可拔,乃引退。'
          + '而權留逍遙津北,遼覘望知之,即將步騎奄至。'
          + '權乘駿馬上津橋,橋南已見徹,丈餘無版 ——'
          + '谷利在馬後,使權持鞍緩控,利於後著鞭,以助馬勢,遂得超度。',
        textEn:
          'Quan came against Hefei with a hundred thousand. There were seven thousand men in the city.\n\n'
          + 'Liao spent the night calling for volunteers and got eight hundred, killed oxen to feast them, and at first light went out. In armour with his halberd he was first into the line, killed dozens, cut down two generals, shouted his own name, broke through the works and came right up to Quan\'s standard — Quan bolted for a high mound and held it with a long halberd.\n\n'
          + 'After ten days and more the city would not fall and he withdrew. And Quan lingered north of Xiaoyao ford; Liao saw it and came down on him with horse and foot at once. Quan put his good horse at the ford bridge and the southern span had already been broken — ten feet with no planking. Gu Li was behind him: he had Quan take the saddle and slacken the rein, and laid on with the whip from behind to give the horse its head, and so they got across.',
      },
      verdictZh:
        '論曰:以十萬攻七千而不能拔,又幾為八百人所擒 ——'
        + '權之短於將略,自此天下知之。\n'
        + '然亦自此,吳之為國,由攻轉守:'
        + '不能北取,則專力於江 —— 三分之勢,由此而固。',
      verdictEn:
        'The historian says: a hundred thousand could not carry seven thousand, and the commander was nearly taken by eight hundred men. Everyone in the realm learned that day that Quan was no field general. But from that day Wu also turned from attacking to holding: unable to take the north, it put everything into the river — and the three-way balance hardened.',
      verdictLostZh:
        '論曰:張遼之八百,非以少勝多,是以**先**勝眾 ——'
        + '「賊至乃發」四字,是曹操留下的教令。',
      verdictLostEn:
        'The historian says: Zhang Liao\'s eight hundred did not beat numbers with fewness. They beat numbers with being first — "when the enemy arrives, go out" was the standing order Cao Cao had left in a sealed box.',
    },
    cao: {
      defeat: {
        titleZh: '教與函,賊至乃發',
        titleEn: 'The Sealed Box',
        textZh:
          '操征張魯,教與護軍薛悌,署函邊曰「賊至乃發」。'
          + '及權至,發教,曰:「若孫權至者,張、李將軍出戰,'
          + '樂將軍守,護軍勿得與戰。」\n\n'
          + '諸將皆疑。遼曰:「公遠征在外,比救至,彼破我必矣。'
          + '是以教指及其未合逆擊之,折其盛勢,以安眾心,然後可守也。'
          + '成敗之機,在此一戰,諸君何疑?」',
        textEn:
          'Cao was campaigning against Zhang Lu and left instructions with the army protector Xue Ti, marked on the outside of the box: open when the enemy arrives. When Quan came they opened it: "If Sun Quan comes, Generals Zhang and Li go out and fight; General Yue holds the city; the army protector is not to take part."\n\n'
          + 'The generals were all doubtful. Liao said: "His Excellency is far away on campaign. By the time relief comes they will certainly have broken us. That is why the instruction says to strike them before they concentrate — blunt their momentum, settle our own men\'s minds, and then the place can be held. Success or failure turns on this one fight. What is there for you gentlemen to doubt?"',
      },
      verdictZh:
        '論曰:操之教,不在多,在**時**——「賊至乃發」四字,'
        + '是把一個決定留在最需要它的那一刻。\n'
        + '夫遠征者最忌遙制,而操以一函制之:所制者非其行,是其疑。',
      verdictEn:
        'The historian says: the value of Cao\'s instruction was not in its content but its timing — "open when the enemy arrives" put a decision in the hands of the men who needed it at the moment they needed it. Commanding a distant garrison from far away is the classic mistake, and he did it with one sealed box: what he controlled was not their movements but their hesitation.',
      verdictLostZh:
        '論曰:七千守十萬,而合肥終魏之世不失 ——'
        + '一城之固,有時不在城。',
      verdictLostEn:
        'The historian says: seven thousand held off a hundred thousand, and Hefei never fell for as long as Wei lasted. What makes a city hold is sometimes not the city.',
    },
    'liu-bei': {
      defeat: {
        titleZh: '湘水為界',
        titleEn: 'The Xiang as the Border',
        textZh:
          '孫權遣呂蒙襲取長沙、零陵、桂陽三郡。'
          + '先主引兵五萬下公安,關羽入益陽 ——\n\n'
          + '而曹操定漢中之訊至。先主懼失益州,'
          + '乃遣使求和,分荊州:以湘水為界,'
          + '長沙、江夏、桂陽以東屬權,南郡、零陵、武陵以西屬備。\n\n'
          + '同盟未破,而已經需要劃界了。',
        textEn:
          'Sun Quan sent Lü Meng to seize Changsha, Lingling and Guiyang. The First Lord brought fifty thousand men down to Gong\'an and Guan Yu moved into Yiyang —\n\n'
          + 'and then word came that Cao Cao had settled Hanzhong. Fearing for Yi province, the First Lord sent for terms and divided Jing: the Xiang river as the boundary, Changsha, Jiangxia and Guiyang eastward to Quan, Nan commandery, Lingling and Wuling westward to Bei.\n\n'
          + 'The alliance was not broken. It had merely reached the point of needing a surveyed line.',
      },
      verdictZh:
        '論曰:湘水之分,盟之始裂也。'
        + '夫同盟至於畫地,則已非同盟,是兩國之界約耳。'
        + '四年之後,呂蒙白衣渡江,所渡者正是這一條界。',
      verdictEn:
        'The historian says: the division at the Xiang was where the alliance began to split. When allies get to the point of drawing a line on the ground they are no longer allies but two states with a border treaty. Four years later Lü Meng crossed in white robes — and what he crossed was that line.',
      verdictLostZh:
        '論曰:兩線之國,必有一線受屈。'
        + '先主之屈於湘水者,為漢中;而漢中既得,荊州遂失。',
      verdictLostEn:
        'The historian says: a state fighting on two fronts must give way on one. The First Lord gave way at the Xiang in order to have Hanzhong — and having got Hanzhong, he lost Jing.',
    },
  },
  /* ── 214 入主西川 ─────────────────────────────────────────────── */
  'scn-214-xichuan': {
    'liu-bei': {
      defeat: {
        titleZh: '雒城一年',
        titleEn: 'A Year before Luocheng',
        textZh:
          '龐統中流矢卒,年三十六。先主進圍雒城,一年乃拔。'
          + '諸葛亮、張飛、趙雲將兵溯流定白帝、江州、江陽 ——'
          + '而後合圍成都。\n\n'
          + '城中尚有精兵三萬人,穀帛支一年,吏民咸欲死戰。'
          + '而璋曰:「百姓攻戰三年,肌膏草野者,以璋故也,何心能安!」'
          + '遂開城出降。群下莫不流涕。',
        textEn:
          'Pang Tong was killed by a stray arrow at thirty-six. The First Lord closed on Luocheng and took a year over it. Zhuge Liang, Zhang Fei and Zhao Yun came up the river settling Baidi, Jiangzhou and Jiangyang — and then the ring closed on Chengdu.\n\n'
          + 'There were still thirty thousand good troops inside and a year of grain and cloth, and the officials and people all wanted to fight to the death. And Zhang said: "The people have been fighting three years, and their flesh has manured the wild grass, because of Zhang. How can I be easy?" And opened the gates. Not a man of his household could keep from weeping.',
      },
      verdictZh:
        '論曰:先主之取益州,以客而奪主 ——'
        + '龐統勸之,法正應之,而先主猶豫者累日。'
        + '及既得之,西土人士皆有次序,而蜀之基定。\n'
        + '然此後二十年,蜀人未嘗以外來者視之 ——'
        + '所以能然者,以其入城之日不殺一人。',
      verdictEn:
        'The historian says: he took Yi province as a guest displacing a host — Pang Tong urged it, Fa Zheng answered for it, and the First Lord hesitated for days. Once he had it, the men of the west were all placed in proper order and the foundation of Shu was laid. And for twenty years afterwards the people of Shu never treated him as an outsider — which was possible because on the day he entered the city he killed nobody.',
      verdictLostZh:
        '論曰:一年之雒城,三年之攻戰 —— 而成都不戰而下。'
        + '取一國者,末後一步常不在兵。',
      verdictLostEn:
        'The historian says: a year at Luocheng, three years of fighting — and Chengdu came without a battle. In taking a country the last step is usually not a military one.',
    },
    'liu-zhang': {
      defeat: {
        titleZh: '開城',
        titleEn: 'The Gates',
        textZh:
          '你有三萬精兵,一年之糧,和一城願意為你死戰的吏民。\n\n'
          + '你都不要了。',
        textEn:
          'You had thirty thousand good troops, a year of grain, and a city full of officials and people who wanted to fight to the death for you.\n\n'
          + 'You declined all of it.',
      },
      verdictZh:
        '論曰:璋之降,史書譏其闇弱;而闇弱者不當有此語。'
        + '「百姓攻戰三年,肌膏草野者,以璋故也」——'
        + '一國之主而肯把帳算在自己頭上,亂世之中,'
        + '這是第二個人做到的事。',
      verdictEn:
        'The historian says: the histories call his surrender weakness, and a weak man does not produce that sentence. "The people have fought three years and their flesh has manured the wild grass, because of Zhang." A ruler willing to put the account in his own name — in that age he was the second man to manage it.',
      verdictLostZh:
        '論曰:引劉備者,張松法正;而開城者,璋也。'
        + '亡國之罪,史書歸於前二人,而璋自認之。',
      verdictLostEn:
        'The historian says: Zhang Song and Fa Zheng brought Liu Bei in; Liu Zhang opened the gates. The histories put the blame for the state\'s fall on the first two. He put it on himself.',
    },
    cao: {
      defeat: {
        titleZh: '既得隴,復望蜀',
        titleEn: 'Having Long, He Wanted Shu',
        textZh:
          '劉曄勸曰:「今破漢中,蜀人震恐,其勢自傾。'
          + '以公之神明,因其傾而壓之,無不克也。'
          + '若小緩之,諸葛亮明於治而為相,關羽、張飛勇冠三軍而為將,'
          + '蜀民既定,據險守要,則不可犯矣。」\n\n'
          + '操曰:「人苦無足,既得隴右,復欲得蜀!」\n\n'
          + '居七日,蜀降者說:「蜀中一日數十驚,備雖斬之而不能安。」'
          + '操復問曄,曄曰:「今已小定,未可擊也。」',
        textEn:
          'Liu Ye urged him: "We have broken Hanzhong and the people of Shu are terrified; the place is toppling of its own weight. With Your Excellency\'s judgement, press on it while it is toppling and nothing will hold. Delay a little and Zhuge Liang, who is brilliant at government, will be chancellor, and Guan Yu and Zhang Fei, the bravest men in any army, will be his generals; once the people of Shu are settled and they hold the passes, the place cannot be touched."\n\n'
          + 'And Cao said: "Men suffer from never having enough. Having got Longyou, now you want Shu as well!"\n\n'
          + 'Seven days later a defector from Shu reported: "There are dozens of panics a day in Shu; Bei is executing people and cannot settle it." Cao asked Ye again, and Ye said: "It has steadied a little now. It cannot be struck."',
      },
      verdictZh:
        '論曰:七日之間,可擊者變為不可擊 ——'
        + '兵機之速如此。操以一言辭之,而後二十年不能入蜀。\n'
        + '夫「既得隴復望蜀」者,譏貪也;而當日之勢,'
        + '貪者得之,不貪者失之。',
      verdictEn:
        'The historian says: in seven days a thing that could be struck became a thing that could not. That is how fast a military opening closes. Cao turned it down with one remark, and for twenty years afterwards he could not get into Shu. "Having Long he wanted Shu" is a jibe at greed — and on that particular day, the greedy man would have had it and the ungreedy one lost it.',
      verdictLostZh:
        '論曰:曄之策,操不用;而曄未嘗以此自伐 ——'
        + '謀臣之難,不在獻策,在策不用而心不怨。',
      verdictLostEn:
        'The historian says: Cao did not take Liu Ye\'s advice, and Ye never made anything of it afterwards. The hard part of being a strategist is not producing the plan. It is having it refused and not resenting it.',
    },
  },
  /* ── 211 渭南之戰 ─────────────────────────────────────────────── */
  'scn-211-weinan': {
    cao: {
      defeat: {
        titleZh: '離之而已',
        titleEn: 'Just Separate Them',
        textZh:
          '關中諸將十部,眾十萬,而操曰:「關中長遠,若賊各依險阻,'
          + '征之,不一二年不可定也。今皆來集,其眾雖多,莫相歸服,'
          + '軍無適主,一舉可滅,為功差易,吾是以喜。」\n\n'
          + '及與韓遂交馬語移時,不及軍事,但說京都舊故 ——'
          + '超等問遂:「公何言?」遂曰:「無所言也。」超等疑之。\n\n'
          + '他日,操又與遂書,多所點竄,如遂改定者 ——'
          + '超等愈疑遂。遂大戰,遂等大敗。',
        textEn:
          'Ten companies in Guanzhong, a hundred thousand men, and Cao said: "Guanzhong is far off. If the rebels each held their own defiles it would take a year or two to settle. Now they have all gathered in one place — many as they are, none of them defers to another and the army has no proper master. It can be destroyed at a stroke, and rather easily. That is why I am pleased."\n\n'
          + 'And when he met Han Sui, they rode knee to knee talking a long while, nothing about the campaign, only old acquaintances in the capital. Chao and the others asked Sui what he had said. "Nothing at all." And they began to wonder.\n\n'
          + 'Later Cao wrote to Sui and made many corrections in the letter, as if Sui had altered it. Chao and the rest wondered a great deal more. Then Cao gave battle, and they were badly beaten.',
      },
      verdictZh:
        '論曰:潼關之勝,不在渭水之陣,在**十部無適主**五字。'
        + '兵多而無統者,不必以兵破之;示之以疑可也。'
        + '故曰:合眾者難,離眾者易 —— 而離之之術,常止於一封改過的信。',
      verdictEn:
        'The historian says: Tongguan was not won on the Wei river but in the phrase "the army has no proper master." A large force with no unified command need not be broken by force; it is enough to give it something to doubt. Gathering men is hard and separating them is easy — and the technique of separating them often amounts to one letter with corrections in it.',
      verdictLostZh:
        '論曰:超等十部,合則十萬,分則各數千。'
        + '而其合也,以利;其分也,亦以利。',
      verdictLostEn:
        'The historian says: the ten companies together were a hundred thousand and separately a few thousand each. They came together for advantage and they came apart for advantage.',
    },
    'ma-chao': {
      defeat: {
        titleZh: '若使早用李堪之計',
        titleEn: 'If Only We Had Taken Li Kan\'s Advice',
        textZh:
          '超等屯渭南,遣信求割河以西請和,操不許。'
          + '九月,進軍渡渭。超等數挑戰,又不許;'
          + '固請割地,求送任子,操用賈詡計,偽許之。\n\n'
          + '而後一戰而破。超走涼州,遂走金城。\n\n'
          + '其後操曰:「賊守潼關,若吾入河東,賊必引守諸津,'
          + '則西河未可渡。吾故盛兵向潼關,賊悉眾南守,西河之備虛,'
          + '故二將得擅取西河。」',
        textEn:
          'Chao and the rest camped south of the Wei and sent to ask for peace, offering to cede the land west of the river; Cao refused. In the ninth month he moved and crossed the Wei. Chao offered battle repeatedly and was refused; when he pressed hard to cede territory and send hostages, Cao took Jia Xu\'s advice and pretended to agree.\n\n'
          + 'Then one battle broke them. Chao ran for Liang province and Sui for Jincheng.\n\n'
          + 'Afterwards Cao said: "The rebels held Tongguan. Had I gone into Hedong they would have drawn back to hold the fords and the west river could not have been crossed. So I made a great show at Tongguan, they all went south to hold it, the west river was left empty, and my two generals had it for the taking."',
      },
      verdictZh:
        '論曰:超之勇,冠於一時;而所將者非其兵,所盟者非其黨。'
        + '十部各為其主,故操一離而潰。\n'
        + '其後超奔漢中,再奔劉備,終為蜀之五虎 ——'
        + '而涼州之地,自此不復有主。',
      verdictEn:
        'The historian says: Ma Chao\'s courage had no equal in his day, and the troops he led were not his and the allies he had sworn with were not his party. Ten companies each with its own master, so one act of separation scattered them. Afterwards he fled to Hanzhong, then to Liu Bei, and ended as one of Shu\'s Five Tigers — and Liang province never had a master again.',
      verdictLostZh:
        '論曰:求割地、求送任子者,已示其怯;'
        + '示怯而後戰,未有能勝者。',
      verdictLostEn:
        'The historian says: to offer territory and to offer hostages is to show that you are afraid. Nobody who shows fear first and fights afterwards wins.',
    },
    'han-sui': {
      defeat: {
        titleZh: '公何言?無所言也',
        titleEn: '"What Did He Say?" "Nothing at All."',
        textZh:
          '你與曹操之父同歲孝廉,又與操同時,'
          + '故交馬語移時,所說者京都舊故,拊手歡笑。\n\n'
          + '而後超問你說了什麼。你說沒說什麼 ——'
          + '這是實話,而實話在那個時候是最壞的答案。\n\n'
          + '你在關中三十年,與馬騰結為異姓兄弟,又相攻,又和解。'
          + '而最後拆散你們的,是一場沒有內容的談話。',
        textEn:
          'You and Cao Cao\'s father had been recommended in the same year, and you and Cao had served at the same time — so you rode knee to knee a long while talking about old acquaintances in the capital, clapping your hands and laughing.\n\n'
          + 'Then Chao asked you what had been said. You said nothing had been. It was true, and the truth was the worst possible answer at that moment.\n\n'
          + 'Thirty years in Guanzhong; sworn brother to Ma Teng, then at war with him, then reconciled. And what finally separated you was a conversation with no content in it.',
      },
      verdictZh:
        '論曰:操之離間,不用一言之偽,'
        + '而用**一場無事之談** —— 無事者,最難自明。'
        + '遂之見疑,非其罪也;而疑之既生,雖無罪亦無以自解。',
      verdictEn:
        'The historian says: Cao\'s wedge was not a lie but a conversation about nothing — and nothing is the hardest thing to prove. Han Sui was suspected without having done anything, and once suspicion exists, innocence has no way to argue itself.',
      verdictLostZh:
        '論曰:三十年之盟,壞於一日之語;'
        + '而語之所以能壞之者,以其盟本無所繫。',
      verdictLostEn:
        'The historian says: thirty years of alliance undone by one day\'s conversation — and the conversation could undo it because the alliance had never been fastened to anything.',
    },
  },
  /* ── 213 落鳳坡 ───────────────────────────────────────────────── */
  'scn-213-fengpo': {
    'liu-bei': {
      defeat: {
        titleZh: '進退狼跋',
        titleEn: 'Caught between Advancing and Retreating',
        textZh:
          '龐統曰:「今陰選精兵,晝夜兼道,徑襲成都,此上計也。'
          + '楊懷、高沛,璋之名將,今宜稱有急還救荊州,'
          + '併使裝束,外作歸形;此二子既服將軍英名,'
          + '又喜將軍之去,必乘輕騎來見,將軍因此執之,'
          + '進取其兵,乃向成都,此中計也。'
          + '退還白帝,連引荊州,徐還圖之,此下計也。'
          + '若沉吟不去,將致大困,不可久矣。」\n\n'
          + '先主然其中計。而後統率眾攻雒縣,'
          + '為流矢所中,卒 —— 年三十六。',
        textEn:
          'Pang Tong said: "Pick good troops quietly, march day and night, go straight for Chengdu — that is the best plan. Yang Huai and Gao Pei are Zhang\'s best generals; announce that there is an emergency and you are going back to Jing, have the baggage packed and make a show of leaving. Those two admire your name and will be glad you are going, and will certainly come with a light escort to see you off; seize them then, take their troops, and go for Chengdu — that is the middle plan. Fall back on Baidi, link up with Jing, and come back to it slowly — that is the lowest. And if you sit and brood and do not go, you will be in serious difficulty and it will not last long."\n\n'
          + 'The First Lord took the middle plan. Then Tong led an assault on Luo county, was hit by a stray arrow, and died at thirty-six.',
      },
      verdictZh:
        '論曰:三計之中,先主取其中 —— 非不知上計之速,'
        + '以其名不正也。故寧遲一年而後取之。\n'
        + '龐統死於流矢,而蜀之取益州,自此以兵而非以謀。'
        + '一人之死,而一國之得失皆改其形。',
      verdictEn:
        'The historian says: of three plans the First Lord took the middle one — not because he could not see that the first was faster, but because it could not be justified. Better a year slower and defensible. Pang Tong died of a stray arrow, and from then on Shu took Yi province by force rather than by scheme. One man\'s death, and the whole shape of a country\'s gain changed with it.',
      verdictLostZh:
        '論曰:客而取主者,必先有辭。'
        + '無辭而取之,雖得其地,不得其人。',
      verdictLostEn:
        'The historian says: a guest who intends to displace his host needs a justification first. Take it without one and you may have the ground; you will not have the people.',
    },
    'liu-zhang': {
      defeat: {
        titleZh: '斬楊懷、高沛',
        titleEn: 'Yang Huai and Gao Pei',
        textZh:
          '楊懷、高沛守白水關,數諫你遣備還荊州。\n\n'
          + '而備稱有急欲還,二人輕騎來見 —— 備斬之,'
          + '併其兵,徑向成都。\n\n'
          + '你最忠的兩個將,死於一場送行。',
        textEn:
          'Yang Huai and Gao Pei held Baishui pass and repeatedly urged you to send Bei back to Jing province.\n\n'
          + 'And Bei announced an emergency and a departure, and the two came with a light escort to see him off — and he killed them, took their troops, and went straight for Chengdu.\n\n'
          + 'Your two most loyal generals died at a farewell.',
      },
      verdictZh:
        '論曰:懷、沛數諫而璋不聽,及其死,璋乃驚 ——'
        + '夫諫者,主之藩籬也;藩籬既去,而後知風之寒。',
      verdictEn:
        'The historian says: Huai and Pei warned him repeatedly and he did not listen, and when they were dead he was shocked. Men who warn you are a hedge around a ruler. Only when the hedge is gone does he notice how cold the wind is.',
      verdictLostZh:
        '論曰:引之者璋,斬其將者備 —— 而璋猶以為可與言和。',
      verdictLostEn:
        'The historian says: Zhang brought him in, and he killed Zhang\'s generals — and Zhang still thought terms could be discussed.',
    },
    sun: {
      defeat: {
        titleZh: '備入蜀,而荊州空',
        titleEn: 'Bei Went into Shu, and Jing Was Empty',
        textZh:
          '劉備入蜀,留關羽守荊州。'
          + '你遣使求還三郡,羽不與 ——\n\n'
          + '而蜀之主力在西,荊州之守,只有一個人。\n\n'
          + '呂蒙在你身邊,已經在算了。',
        textEn:
          'Liu Bei went into Shu and left Guan Yu holding Jing province. You sent to ask for the three commanderies back and Yu would not give them —\n\n'
          + 'and the main strength of Shu was in the west, and one man was holding Jing.\n\n'
          + 'Lü Meng was at your elbow, already doing the arithmetic.',
      },
      verdictZh:
        '論曰:備之西入,吳之機也。'
        + '夫同盟而一方遠征,則其後必虛;虛而不取,他人取之。'
        + '故權之圖荊州,不始於呂蒙,始於備入蜀之日。',
      verdictEn:
        'The historian says: Bei going west was Wu\'s opening. When one ally goes off on a long campaign his rear is bound to be thin, and a thin rear that you do not take, somebody else does. Quan\'s designs on Jing did not begin with Lü Meng. They began the day Bei went into Shu.',
      verdictLostZh:
        '論曰:借荊州者,本無還期;'
        + '而求還者,亦本不指望其還 —— 求之,所以立辭耳。',
      verdictLostEn:
        'The historian says: the loan of Jing province never had a due date, and the man asking for it back never expected to get it. He asked in order to have a justification.',
    },
  },
  /* ── 189 十常侍之亂 ───────────────────────────────────────────── */
  'scn-189-eunuchs': {
    han: {
      defeat: {
        titleZh: '召外兵',
        titleEn: 'Send for the Border Armies',
        textZh:
          '太后不聽誅宦,袁紹勸進曰:「可多召四方猛將及諸豪傑,'
          + '使並引兵向京城,以脅太后。」\n\n'
          + '陳琳諫曰:「今將軍總皇威,握兵要,龍驤虎步,高下在心 ——'
          + '此猶鼓洪爐燎毛髮耳。夫違經合道,天人所順;'
          + '而反委釋利器,更徵外助。大兵聚會,強者為雄,'
          + '所謂倒持干戈,授人以柄,功必不成,只為亂階。」\n\n'
          + '進不聽。曹操聞而笑曰:「宦官之官,古今宜有,'
          + '但世主不當假之權寵,使至於此。既治其罪,當誅元惡,'
          + '一獄吏足矣,何至紛紛召外兵乎!欲盡誅之,事必宣露,吾見其敗也。」\n\n'
          + '八月,進入省,宦官伏兵斬之於嘉德殿前。',
        textEn:
          'The Dowager would not have the eunuchs killed, so Yuan Shao urged: "Summon a number of the fierce generals of the four quarters and the local strongmen, and have them all march on the capital to put pressure on the Dowager."\n\n'
          + 'Chen Lin remonstrated: "Your Excellency holds the imperial authority and the keys of the army; you stride like a dragon and a tiger, and high and low are at your discretion. This is like working a great furnace to singe a hair. To go outside the rules and stay within the Way is what Heaven and men approve — and instead you would put down the sharp instrument in your hand and send for outside help. When great armies gather, the strongest becomes the master. This is called reversing your grip on the spear and handing someone else the shaft. It cannot succeed and it will only make a stair for disorder."\n\n'
          + 'He was not heeded. Cao Cao heard and laughed: "Eunuch offices are proper enough in any age. The trouble is that sovereigns should not lend them power and favour until it comes to this. Since their crimes are to be punished, execute the ringleaders — one gaoler is enough. Why all this summoning of border armies? If he means to kill them all, word will get out, and I can see how it ends."\n\n'
          + 'In the eighth month He Jin went into the palace, and the eunuchs\' hidden men cut him down before the Jiade hall.',
      },
      verdictZh:
        '論曰:進之死,死於召外兵之前 —— 召兵之議一出,'
        + '而禁中已無可保之理。陳琳、曹操皆言之,而進不聽者,'
        + '以其所畏在太后,不在董卓。\n'
        + '夫倒持干戈者,不知授柄之人為誰 —— 而那個人已經在路上了。',
      verdictEn:
        'The historian says: He Jin died before the border armies were ever summoned — from the moment the proposal was made, the inner palace could not be kept. Chen Lin said so and Cao Cao said so, and he did not listen because what he feared was the Dowager, not Dong Zhuo. A man who reverses his grip on a spear does not know who will take the shaft — and that man was already on the road.',
      verdictLostZh:
        '論曰:一獄吏足矣 —— 而所以不能用一獄吏者,'
        + '以其兄妹之間,已非君臣。',
      verdictLostEn:
        'The historian says: one gaoler would have been enough. The reason one gaoler could not be used was that between a brother and a sister there is no relation of sovereign and subject.',
    },
    eunuchs: {
      defeat: {
        titleZh: '張常侍是我父',
        titleEn: '"Chang Rang Is My Father"',
        textZh:
          '靈帝嘗曰:「張常侍是我父,趙常侍是我母。」'
          + '你們十二人共守禁中三十年,靠的是宮牆、詔書,和皇帝的耳朵。\n\n'
          + '而那位皇帝死了。何進在門外,袁紹在門外。\n\n'
          + '你們殺了何進 —— 而後袁紹勒兵斬趙忠,'
          + '捕諸宦者,無少長皆殺之,凡二千餘人,'
          + '或有無鬚而誤死者。\n\n'
          + '張讓等劫少帝走小平津,追急,讓等投河而死。',
        textEn:
          'Emperor Ling used to say: "Chang Rang is my father and Zhao Zhong is my mother." Twelve of you held the inner palace for thirty years on three things — walls, edicts, and the emperor\'s ear.\n\n'
          + 'And that emperor died. He Jin was outside. Yuan Shao was outside.\n\n'
          + 'You killed He Jin — and then Yuan Shao brought troops in, cut down Zhao Zhong, and had every eunuch taken and killed regardless of age, more than two thousand of them; some men without beards died by mistake.\n\n'
          + 'Zhang Rang and the rest carried the young emperor off to Xiaopingjin, and when the pursuit closed they went into the river.',
      },
      verdictZh:
        '論曰:宦者之禍,起於人主之私 —— 「張常侍是我父」一語,'
        + '非讓等所能自致,乃靈帝授之也。\n'
        + '及其誅也,無少長皆殺,二千餘人,而漢之禁中遂空。'
        + '宦官既盡,而董卓入洛 —— 去一患而致一亡。',
      verdictEn:
        'The historian says: the eunuch calamity began in a sovereign\'s private affections — "Chang Rang is my father" was not something Zhang Rang could have arranged for himself; Emperor Ling gave it to him. And when the reckoning came, every one of them died regardless of age, more than two thousand, and the inner palace of Han was empty. The eunuchs were finished, and Dong Zhuo entered Luoyang. One nuisance removed and a dynasty ended.',
      verdictLostZh:
        '論曰:守禁中三十年而不出一步者,一旦出宮門,即無所依。'
        + '權之所在,亦其所囚。',
      verdictLostEn:
        'The historian says: men who held the inner palace for thirty years without once stepping outside it had nothing to stand on the moment they went out the gate. Where their power was, they were also imprisoned.',
    },
    dong: {
      defeat: {
        titleZh: '奉召而來',
        titleEn: 'Summoned',
        textZh:
          '你在河東,而洛陽的詔書到了 —— 召你將兵入京,以脅太后。\n\n'
          + '你上書曰:「臣輒鳴鐘鼓如洛陽,請收讓等,以清姦穢。」'
          + '而後緩行,觀變。\n\n'
          + '及至,何進已死,宦官已誅,少帝在北邙山下 ——'
          + '你迎之而還。從此洛陽的兵是你的,天子也是你的。\n\n'
          + '你什麼都沒做。你只是來得剛剛好。',
        textEn:
          'You were in Hedong when the edict came from Luoyang, summoning you to bring troops to the capital and put pressure on the Dowager.\n\n'
          + 'You memorialised: "Your servant will beat drums and bells all the way to Luoyang and ask for Zhang Rang and the rest to be arrested and the filth cleaned out." And then marched slowly, watching.\n\n'
          + 'By the time you arrived He Jin was dead, the eunuchs were dead, and the young emperor was under the Beimang hills. You collected him and came back. From that day the troops in Luoyang were yours and so was the Son of Heaven.\n\n'
          + 'You had done nothing at all. You had merely arrived at exactly the right time.',
      },
      verdictZh:
        '論曰:卓之得洛陽,非戰也,是**時**也 ——'
        + '進召之而進死,宦誅之而宦盡,'
        + '及卓至,城中無主而兵在其手。\n'
        + '故曰:授人以柄者,不必授於強者;授於**恰好在場**的那一個。',
      verdictEn:
        'The historian says: Dong Zhuo did not take Luoyang by fighting; he took it by timing. He Jin summoned him and then died; the eunuchs were destroyed and then gone; and when Zhuo arrived the city had no master and the troops were in his hands. Hence: the man you hand the shaft to need not be the strongest. It is whoever happens to be standing there.',
      verdictLostZh:
        '論曰:緩行者,非怯也,待其自亂也。'
        + '待之而後入,故一入而無所爭。',
      verdictLostEn:
        'The historian says: he marched slowly not out of timidity but to let the thing come apart by itself. He waited and then went in, and having waited, there was nothing left to fight over.',
    },
  },
  /* ── 194 徐州牧 ───────────────────────────────────────────────── */
  'scn-194-xuzhou': {
    cao: {
      defeat: {
        titleZh: '兗州反,而徐州未下',
        titleEn: 'Yan Revolted before Xu Fell',
        textZh:
          '再征徐州,所過殘戮,雞犬亦盡,泗水為之不流。\n\n'
          + '而張邈與陳宮叛迎呂布 —— 郡縣皆應,'
          + '唯鄄城、范、東阿三城為荀彧、程昱所全。\n\n'
          + '你回師,與布相持於濮陽百餘日。蝗蟲起,百姓大餓,'
          + '布眾亦餓,各引去。\n\n'
          + '袁紹使人說你連和,欲使你舉家往鄴。'
          + '你方畏懼,欲許之 —— 程昱曰:'
          + '「意者將軍殆臨事而懼,不然何慮之不深也!'
          + '夫袁紹據燕、趙之地,有并天下之心,而智不能濟也。'
          + '將軍自度能為之下乎?」',
        textEn:
          'The second campaign into Xu: slaughter everywhere it passed, not a chicken or a dog left, the Si river dammed with the dead.\n\n'
          + 'And then Zhang Miao and Chen Gong revolted and brought in Lü Bu — every commandery and county went over, and only Juancheng, Fan and Dong\'e were kept, by Xun Yu and Cheng Yu.\n\n'
          + 'You turned back and stood facing Bu at Puyang for a hundred days and more. Then locusts came and the people starved, and Bu\'s men starved too, and both sides drew off.\n\n'
          + 'Yuan Shao sent to propose an alliance and suggested you move your family to Ye. You were frightened enough to consider it — and Cheng Yu said: "I take it Your Excellency has been frightened by events; otherwise how could you think so shallowly? Yuan Shao holds the country of Yan and Zhao and has designs on the whole realm, and his judgement is not equal to it. Do you reckon you could be his subordinate?"',
      },
      verdictZh:
        '論曰:操之興,不在兗州之得,在兗州既失而復得。'
        + '一州皆反而三城不動 —— 荀彧、程昱之力也。\n'
        + '故曰:創業者不患無地,患無死守之人。'
        + '而屠徐州之事,史官不為之諱:'
        + '其後徐州之人,終操之世不肯附。',
      verdictEn:
        "The historian says: Cao's rise was not in taking Yan province but in losing it and getting it back. The whole province turned and three towns did not — the work of Xun Yu and Cheng Yu. A founder's problem is not a shortage of ground but a shortage of men who will hold it to the death. As for the massacre in Xu, the historians do not gloss it over: the people of Xu would not come over to him for the rest of his life.",
      verdictLostZh:
        '論曰:報父之讎而屠一州之民 —— 讎報矣,而州不可有。'
        + '兵之所忌,莫大於使人無降之路。',
      verdictLostEn:
        'The historian says: he avenged his father by massacring a province. The vengeance was taken and the province could never be held. Nothing in war is more foolish than leaving people no road on which to surrender.',
    },
    tao: {
      defeat: {
        titleZh: '非劉備不能安此州',
        titleEn: 'No One but Liu Bei',
        textZh:
          '曹嵩過境,你遣都尉張闓將騎二百護送 ——'
          + '而闓於泰山華、費間殺之,取財物而走。\n\n'
          + '你不能自明,亦不能拒操。退保郯城,'
          + '而徐州之民為之受屠。\n\n'
          + '臨終,謂別駕麋竺曰:「非劉備不能安此州也。」',
        textEn:
          'Cao Song crossed your territory and you sent the commandant Zhang Kai with two hundred horse to escort him — and Kai killed him between Hua and Fei in Taishan, took his goods, and rode off.\n\n'
          + 'You could neither clear yourself nor hold Cao off. You fell back on Tan, and the people of Xu were butchered on your account.\n\n'
          + 'At the end you said to your aide Mi Zhu: "No one but Liu Bei can settle this province."',
      },
      verdictZh:
        '論曰:謙之禍,起於一都尉之貪。'
        + '夫遣人護送者,所託非人,則禍不可解 ——'
        + '而亂世之中,遣誰去,常是主者一念之間的事。',
      verdictEn:
        'The historian says: Tao Qian\'s ruin began with one commandant\'s greed. When you send an escort and pick the wrong man, the consequence cannot be argued away — and in a broken age, whom you send is usually a matter of one passing thought.',
      verdictLostZh:
        '論曰:讓徐州於備,而不讓於子 —— 亂世之中,'
        + '此為知子,亦為知州。',
      verdictLostEn:
        'The historian says: he left the province to Liu Bei and not to his sons. In such an age that was knowing his sons, and also knowing his province.',
    },
    lubu: {
      defeat: {
        titleZh: '兗州一時皆應',
        titleEn: 'All Yan Came Over at Once',
        textZh:
          '陳宮說張邈曰:「今雄傑並起,天下分崩,'
          + '君以千里之眾,當四戰之地,撫劍顧眄,亦足以為人豪,'
          + '而反受制於人,不以鄙乎!今州軍東征,其處空虛,'
          + '呂布壯士,善戰無前,若權迎之,共牧兖州,'
          + '觀天下形勢,俟時事之變通,此亦縱橫之一時也。」\n\n'
          + '邈從之。布至,郡縣皆應 ——\n\n'
          + '而百餘日之後,蝗起,人相食,布眾亦餓,'
          + '你不得不走。你這一生所有的城,都是這樣來的,也是這樣走的。',
        textEn:
          'Chen Gong said to Zhang Miao: "Strong men are rising everywhere and the realm is coming apart. You have a thousand li of people and hold ground fought over on four sides; you could put your hand on your sword, look about you, and be one of the great men of the age — and instead you take orders from someone else. Is that not shabby? The provincial army has gone east and the place is empty. Lü Bu is a fighter, unbeatable in the field. Take him in on your own terms, hold Yan province jointly, watch how the realm shapes, and wait for events. This too is a moment for the arts of alliance."\n\n'
          + 'Miao agreed. Bu arrived, and every commandery and county came over —\n\n'
          + 'and a hundred days later the locusts came, people ate each other, his own men starved, and he had to go. Every city he ever held came to him that way, and left him that way.',
      },
      verdictZh:
        '論曰:布之得兗州,以其虛;其失兗州,以其無食。'
        + '善戰無前而不能理民 —— 故所至皆下,而所下皆不能久。',
      verdictEn:
        'The historian says: he got Yan province because it was empty and lost it because there was nothing to eat. Unbeatable in the field and unable to administer a population — so everything fell to him and nothing he took stayed taken.',
      verdictLostZh:
        '論曰:陳宮之謀,可謂善矣;而所託者布 ——'
        + '謀之善否,終繫於用之者。',
      verdictLostEn:
        "The historian says: Chen Gong's plan was a good one, and the man he entrusted it to was Lü Bu. Whether a plan is good in the end depends on who carries it out.",
    },
  },
  /* ── 198 下邳之圍 ─────────────────────────────────────────────── */
  'scn-198-xiapi': {
    cao: {
      defeat: {
        titleZh: '決泗沂之水',
        titleEn: 'They Turned the Rivers on It',
        textZh:
          '攻之不拔,連戰,士卒疲,欲還。'
          + '荀攸、郭嘉曰:「呂布勇而無謀,今三戰皆北,其銳氣衰矣。'
          + '三軍以將為主,主衰則軍無奮意。夫陳宮有智而遲,'
          + '今及布氣之未復,宮謀之未定,進急攻之,布可拔也。」\n\n'
          + '乃引沂、泗灌城。月餘,布將侯成、宋憲、魏續縛陳宮,'
          + '將其眾降。布與麾下登白門樓,兵圍急,乃下降。',
        textEn:
          'The assaults failed, the fighting dragged, the men were worn out, and he thought of going home. Xun You and Guo Jia said: "Lü Bu is brave and has no plan. He has been beaten three times and his edge has gone. An army takes its spirit from its commander, and when the commander flags there is no fight in the ranks. Chen Gong has judgement and is slow with it. Press the attack now, while Bu\'s spirit has not come back and Gong\'s plan is not settled, and Bu can be taken."\n\n'
          + 'So they turned the Yi and the Si into the city. A month later Bu\'s own officers Hou Cheng, Song Xian and Wei Xu tied up Chen Gong and surrendered with their troops. Bu went up the White Gate Tower with his household, and with the ring closing, came down and gave himself up.',
      },
      verdictZh:
        '論曰:下邳之克,不在水,在**攸嘉之言**——'
        + '三戰皆北而銳氣衰,主衰則軍無奮意;'
        + '此非料城,是料人。\n'
        + '而操之欲還,亦見用兵者未有不疲之時 ——'
        + '所異者,身邊有沒有人肯說「再攻一次」。',
      verdictEn:
        'The historian says: Xiapi was not carried by water but by what Xun You and Guo Jia said — three defeats and the edge is gone; when the commander flags there is no fight in the ranks. That is not reading a city, it is reading a man. And that Cao wanted to go home shows there is no campaign without a moment of exhaustion. The difference is whether anyone beside you is willing to say: attack once more.',
      verdictLostZh:
        '論曰:布縛而請曰「明公所患不過於布,今已服矣」——'
        + '操顧劉備,備曰:「明公不見布之事丁建陽及董太師乎!」'
        + '一言而決其死。',
      verdictLostEn:
        'The historian says: bound, Bu said: "What Your Excellency feared was only me, and I have submitted." Cao looked at Liu Bei, and Bei said: "Has Your Excellency not seen how he served Ding Jianyang and the Grand Preceptor Dong?" One sentence settled it.',
    },
    lubu: {
      defeat: {
        titleZh: '白門樓',
        titleEn: 'The White Gate Tower',
        textZh:
          '陳宮勸你出屯於外,與城中為犄角 ——'
          + '而妻曰:「昔曹氏待公台如赤子,猶舍而來投將軍。'
          + '今將軍厚公台不過於曹公,而欲委全城,捐妻子,'
          + '孤軍遠出,若一旦有變,妾豈得為將軍妻哉!」\n\n'
          + '你乃止。\n\n'
          + '侯成、宋憲、魏續縛陳宮以降。你登白門樓,'
          + '謂左右曰:「卿曹無相困,我當自首明公。」',
        textEn:
          'Chen Gong urged you to camp outside and make a pincer with the city — and your wife said: "Cao once treated Gongtai like his own child, and Gongtai still left him and came to you. Now you do not treat Gongtai better than Cao did, and you propose to hand him the whole city, abandon your wife and children, and go off alone with an army. If anything changes, how am I to remain your wife?"\n\n'
          + 'So you stayed.\n\n'
          + 'Hou Cheng, Song Xian and Wei Xu tied Chen Gong up and surrendered. You went up the White Gate Tower and said to those around you: "Do not distress yourselves, gentlemen. I shall surrender to His Excellency myself."',
      },
      verdictZh:
        '論曰:布之敗,不敗於曹操,敗於不能用陳宮。'
        + '宮之策再三,而布再三不用 —— 一因妻言,一因將疑,'
        + '一因自負其勇。\n'
        + '故曰:有謀臣而不能用,與無謀臣同;'
        + '而有謀臣不用者,其罪又浮於無。',
      verdictEn:
        "The historian says: Lü Bu was not beaten by Cao Cao but by his inability to use Chen Gong. Gong offered plans three times and three times they were not taken — once because of a wife's words, once because of suspicion of his officers, once out of confidence in his own arm. To have a strategist and not use him is the same as having none — except that it is worse, because you had the choice.",
      verdictLostZh:
        '論曰:陳宮死時,操泣而問其母妻,宮曰:'
        + '「聞將以孝治天下者,不害人之親。」遂就刑,顧不還。\n'
        + '一敗之下,主辱而臣不辱者,此類是也。',
      verdictLostEn:
        'The historian says: when Chen Gong was put to death Cao wept and asked about his mother and wife, and Gong said: "I have heard that a man who governs the realm by filial piety does not harm another man\'s kin." And went to the execution ground without looking back. In defeat, the lord may be disgraced and the officer not — this was such a case.',
    },
    'yuan-shao': {
      defeat: {
        titleZh: '公孫瓚未死',
        titleEn: 'Gongsun Zan Is Not Dead Yet',
        textZh:
          '曹操圍下邳,而你在易京。\n\n'
          + '田豐勸你襲許,曰:「與公爭天下者,曹操也。'
          + '今操東擊呂布,許下空虛。」而你以子疾辭。\n\n'
          + '豐舉杖擊地曰:「夫遭難遇之機,而以嬰兒之病失其會,'
          + '惜哉!」',
        textEn:
          'Cao Cao was investing Xiapi, and you were at Yijing.\n\n'
          + 'Tian Feng urged you to strike at Xu: "The man contending with Your Excellency for the realm is Cao Cao. He has gone east against Lü Bu, and Xu is empty." And you declined on the ground that your son was ill.\n\n'
          + 'Feng struck the ground with his staff: "An opening like this comes once, and to lose it over a child\'s illness — what a pity!"',
      },
      verdictZh:
        '論曰:紹之失許,以子疾;而子疾者,一時之私也。'
        + '夫爭天下者,不得有一時之私 ——'
        + '兩年之後,操以此二年所得,拒之於官渡。',
      verdictEn:
        'The historian says: he lost Xu over a sick child — a private matter of one moment. A man contending for the realm cannot afford one private moment. Two years later Cao held him at Guandu with what those two years had bought.',
      verdictLostZh:
        '論曰:機不可失者,以其不再來;'
        + '而人主之所以失機,常不因大事,因小事。',
      verdictLostEn:
        'The historian says: an opening must not be missed because it does not come again — and what makes a ruler miss one is usually not a great matter but a small one.',
    },
  },
  /* ── 204 鄴城陷落 ─────────────────────────────────────────────── */
  'scn-204-yecheng': {
    cao: {
      defeat: {
        titleZh: '決漳水灌城',
        titleEn: 'The Zhang River into the City',
        textZh:
          '圍鄴,為土山、地道。審配夜出兵擊,為伏所破。'
          + '乃鑿塹圍城,周四十里,初令淺,示若可越 ——'
          + '配望而笑之,不出爭利。\n\n'
          + '公一夜浚之,廣深二丈,決漳水灌城,城中餓死者過半。\n\n'
          + '八月,審配兄子榮夜開所守城東門內兵。配拒戰城中,'
          + '生禽配。辛毗等舉刀撾其頭,配罵曰:'
          + '「汝等破我冀州,唯恨死之晚也!」\n\n'
          + '公謂曰:「知我來何以多弩?」配曰:「恨少!」',
        textEn:
          'He invested Ye with earthworks and tunnels. Shen Pei came out at night and was cut up by an ambush. Then he dug a ring of trench forty li round, shallow at first so that it looked crossable — and Pei looked at it, laughed, and did not come out to contest it.\n\n'
          + 'In one night the trench was deepened to twenty feet by twenty, and the Zhang river was let into the city, and more than half the people inside starved.\n\n'
          + 'In the eighth month Shen Pei\'s nephew Rong opened the east gate he was holding and let the troops in. Pei fought on inside and was taken alive. Xin Pi and others struck his head with the flats of their blades, and he cursed them: "You people wrecked my Ji province. My only regret is dying so late."\n\n'
          + 'Cao said to him: "Did you know how many crossbows I came with?" And Pei said: "Too few!"',
      },
      verdictZh:
        '論曰:鄴城之克,在一夜浚塹。'
        + '示之以淺而後深之 —— 兵者詭道,而詭之所施,在敵已笑之後。\n'
        + '審配死而不屈,操欲活之而不可得 ——'
        + '故取一城易,取一城之人心難。',
      verdictEn:
        'The historian says: Ye fell on one night\'s digging. Show them something shallow and then deepen it — war is the way of deception, and deception works best after the enemy has already laughed. Shen Pei died unbending; Cao wanted to keep him alive and could not. Taking a city is easy. Taking the loyalty inside it is not.',
      verdictLostZh:
        '論曰:袁氏之亡,不亡於操,亡於兄弟。'
        + '譚尚相攻,而操坐收 —— 郭嘉之言:'
        + '「急之則相持,緩之而後爭心生。」',
      verdictLostEn:
        'The historian says: the house of Yuan fell not to Cao but to its own brothers. Tan and Shang fought each other and Cao gathered the pieces — as Guo Jia had said: press them and they hold together; ease off and the quarrel starts.',
    },
    'yuan-shang': {
      defeat: {
        titleZh: '兄弟相攻',
        titleEn: 'Brother against Brother',
        textZh:
          '父卒,審配、逢紀矯遺命奉你為嗣。'
          + '譚自稱車騎將軍,屯黎陽 —— 兄在外而弟在內。\n\n'
          + '曹操渡河攻譚,譚求救於你。你不欲多與之兵,'
          + '而自將攻譚 —— 譚敗,走平原,遣辛毗詣操請降。\n\n'
          + '操曰:「今兄弟相攻,非有他志,顧欲併吞天下耳。」'
          + '而許之。',
        textEn:
          'When your father died, Shen Pei and Feng Ji produced a will making you the heir. Tan styled himself General of Chariots and Cavalry and camped at Liyang — the elder brother outside and the younger inside.\n\n'
          + 'Cao Cao crossed the river against Tan, and Tan asked you for help. You did not care to give him many troops, and went to attack him yourself — Tan was beaten, fled to Pingyuan, and sent Xin Pi to Cao to offer surrender.\n\n'
          + 'And Cao said: "The brothers are fighting each other with no larger design; each simply means to swallow the other." And accepted.',
      },
      verdictZh:
        '論曰:袁氏之敗,不在官渡,在官渡之後。'
        + '紹死而嗣不定,審配、逢紀立尚,郭圖、辛評立譚 ——'
        + '一家而二黨,則外敵不必攻,自攻可也。\n'
        + '故曰:立嗣不定者,國之大禍,'
        + '而其禍常發於父既沒之後。',
      verdictEn:
        'The historian says: the Yuan were not destroyed at Guandu but after it. Shao died with the succession unsettled, Shen Pei and Feng Ji set up Shang, Guo Tu and Xin Ping set up Tan — one house with two factions, and no outside enemy needs to attack; it attacks itself. An unsettled succession is a state\'s great calamity, and the calamity usually breaks out after the father is in the ground.',
      verdictLostZh:
        '論曰:河北之地,四州也;而二子分之,則各不足以當一操。',
      verdictLostEn:
        'The historian says: Hebei was four provinces. Split between two sons, neither half was a match for one Cao Cao.',
    },
    'yuan-tan': {
      defeat: {
        titleZh: '請降於操',
        titleEn: 'Surrendering to Cao',
        textZh:
          '你是長子,而嗣立者是弟。\n\n'
          + '你求兵於尚而不得,乃攻之;敗走平原,'
          + '遣辛毗請降於曹操 —— 操以女妻譚子,而後絕婚,'
          + '進軍攻之。\n\n'
          + '南皮之戰,你單馬奔陣而死。'
          + '你這一生所借的每一支兵,最後都用來打自己家的人。',
        textEn:
          'You were the eldest son, and the succession went to your brother.\n\n'
          + 'You asked him for troops and did not get them, so you attacked him; beaten, you fled to Pingyuan and sent Xin Pi to surrender to Cao Cao — who married a daughter to your son, and then broke the match and marched against you.\n\n'
          + 'At Nanpi you charged the line alone and died. Every soldier you ever borrowed was used in the end against your own family.',
      },
      verdictZh:
        '論曰:譚之降操,以攻其弟;而操之受降,以待其自弊。'
        + '兄弟之爭,外人未有不利之者 ——'
        + '故曰:內爭者,以己之力為人之資。',
      verdictEn:
        "The historian says: Tan surrendered to Cao in order to attack his brother, and Cao accepted the surrender in order to let them wear each other out. An outsider never loses by a quarrel between brothers. Internal war converts your own strength into someone else's resources.",
      verdictLostZh:
        '論曰:長子而不得立,古今之亂多出於此;'
        + '然亂之成否,不在立誰,在**立之明否**。',
      verdictLostEn:
        'The historian says: an eldest son passed over has caused a great deal of trouble in every age. But whether it becomes trouble depends less on who is chosen than on whether the choice was made openly.',
    },
  },
  /* ── 192 王允連環計 ───────────────────────────────────────────── */
  'scn-192-wangyun': {
    han: {
      defeat: {
        titleZh: '關東鼠子,豈能為我患',
        titleEn: 'Rats of the East',
        textZh:
          '卓死,長安士庶咸相慶賀,諸阿附卓者皆下獄死。'
          + '而蔡邕以嘆息坐之 —— 允曰:「昔武帝不殺司馬遷,'
          + '使作謗書,流於後世。方今國祚中衰,戎馬在郊,'
          + '不可令佞臣執筆在幼主左右。」邕遂死獄中。\n\n'
          + '涼州兵求赦,允曰:「今歲不可再赦。」'
          + '賈詡說李傕曰:「聞長安中議欲盡誅涼州人,'
          + '而諸君棄眾單行,即一亭長能束君矣。'
          + '不如率眾而西,所在收兵,以攻長安。」\n\n'
          + '傕等從之。允死於宣平門外。',
        textEn:
          "Zhuo was dead, and the people of Chang'an congratulated one another; everyone who had attached himself to Zhuo was thrown into prison and died there. Cai Yong was condemned for a sigh — Wang Yun said: \"Emperor Wu once spared Sima Qian, and let him write a book of slanders that has come down to later ages. Now the fortune of the state is at its ebb and cavalry are in the suburbs. We cannot have a flatterer holding a brush beside a young sovereign.\" And Yong died in gaol.\n\n"
          + 'The Liang province soldiers asked for an amnesty, and Yun refused. Jia Xu said to Li Jue: "It is said they mean to kill every man from Liang province in the capital. If you gentlemen abandon your troops and travel alone, one village constable could arrest you. Better to march west, pick up soldiers wherever you pass, and attack Chang\'an."\n\n'
          + 'They did. Wang Yun died outside the Xuanping gate.',
      },
      verdictZh:
        '論曰:允之誅卓,天下之功也;而其後不能安涼州之眾,'
        + '一言之吝,而身與國俱亡。\n'
        + '夫大事既成,最難者不在成之,在**善其後** ——'
        + '赦一人易,赦一軍難;而不赦一軍者,即以一軍為敵。',
      verdictEn:
        'The historian says: killing Dong Zhuo was a service to the realm, and afterwards he could not settle the Liang province soldiers — one refusal, and he and the state went together. When a great thing has been done, the hard part is not doing it but finishing it properly. Pardoning one man is easy and pardoning an army is not; and to refuse to pardon an army is to make an army your enemy.',
      verdictLostZh:
        '論曰:賈詡一言而傾長安,其後自以為悔 ——'
        + '而當日之勢,涼州人不反則死,詡不過說出了他們已經想到的事。',
      verdictLostEn:
        "The historian says: one speech of Jia Xu's overturned Chang'an, and he regretted it afterwards. But as things stood the men of Liang would die if they did not revolt, and he had only said aloud what they had already worked out.",
    },
    lubu: {
      defeat: {
        titleZh: '奉先何在',
        titleEn: 'Where Is Fengxian?',
        textZh:
          '卓自知凶恣,每懷猜畏,行止常以布自衛 ——'
          + '然卓性剛而褊,忿不思難,嘗小失意,拔手戟擲布。'
          + '布拳捷避之,為卓顧謝,卓意亦解。由是陰怨卓。\n\n'
          + '允以是告布使為內應。布曰:「奈如父子何!」'
          + '允曰:「君自姓呂,本非骨肉。今憂死不暇,何謂父子?」\n\n'
          + '布遂許之。及卓入,布持矛刺之,卓大呼曰:'
          + '「呂布何在!」布曰:「有詔討賊臣!」',
        textEn:
          'Zhuo knew how savagely he had behaved and lived in constant suspicion, keeping Bu about him as a bodyguard — but Zhuo was violent and narrow, and did not think ahead when angry: once, over some small thing, he threw a hand-halberd at Bu. Bu was quick enough to dodge it and apologised, and Zhuo\'s temper passed. Bu resented him from then on.\n\n'
          + 'Wang Yun heard of it and asked him to act from inside. "But what about father and son?" said Bu. And Yun said: "Your surname is Lü. There was never any blood between you. He is worrying about his own life at this moment. What father and son?"\n\n'
          + 'So Bu agreed. When Zhuo came in, Bu ran him through with a spear, and Zhuo cried out: "Where is Lü Bu?" And Bu said: "There is an edict for the punishment of a traitor."',
      },
      verdictZh:
        '論曰:布之殺卓,天下快之;而其所以殺者,'
        + '不過一戟之忿與一女之私。\n'
        + '故其後之棄劉備、叛袁術,皆同此理 ——'
        + '所行雖或合於義,而其發動未嘗出於義。',
      verdictEn:
        'The historian says: the realm was delighted when Bu killed Dong Zhuo, and what moved him to it was a thrown halberd and a private affair. His later abandonment of Liu Bei and betrayal of Yuan Shu came from the same place. His actions sometimes happened to be right; the impulse behind them never was.',
      verdictLostZh:
        '論曰:「君自姓呂,本非骨肉」—— 王允一語破之。'
        + '凡以父子之名結人者,其結亦止於一名。',
      verdictLostEn:
        'The historian says: "Your surname is Lü. There was never any blood between you." One sentence undid it. Bonds made out of the words father and son go no further than the words.',
    },
    lijue: {
      defeat: {
        titleZh: '率眾而西',
        titleEn: 'March West and Pick Up Troops',
        textZh:
          '你們本欲解散,各自逃亡。而賈詡曰:'
          + '「不如率眾而西,所在收兵,以攻長安,為董公報仇。'
          + '幸而事濟,奉國家以征天下;若不濟,走未後也。」\n\n'
          + '比至長安,眾十餘萬。八日而城陷。\n\n'
          + '而後你與郭汜爭權,相攻於長安中,'
          + '死者萬餘人。天子播越,百官暴骨。',
        textEn:
          'You were about to disband and scatter. And Jia Xu said: "Better to march west, gathering soldiers as you go, and attack Chang\'an in the Grand Preceptor\'s name. If it comes off, you hold the state and campaign in its name; if it does not, running away is still available."\n\n'
          + 'By the time you reached Chang\'an you had over a hundred thousand. The city fell in eight days.\n\n'
          + 'And then you and Guo Si fought each other for control inside the city, and more than ten thousand died. The emperor fled from place to place and the bones of his officials lay in the open.',
      },
      verdictZh:
        '論曰:傕汜之得長安,以詡之一言;其失天下,以其無所欲。'
        + '得政而不知所為,則爭權而已;'
        + '爭權而後,城中相攻,天子播越 ——'
        + '漢之最後一點體面,盡於此二年。',
      verdictEn:
        'The historian says: Li Jue and Guo Si took Chang\'an on one piece of advice and lost the realm because they wanted nothing in particular. Having got the government they had no idea what to do with it, so they fought over it; and after that they fought inside the city, and the emperor was a fugitive. Whatever dignity Han had left was used up in those two years.',
      verdictLostZh:
        '論曰:詡後自言:「此救命之計,何功之有!」'
        + '——謀之為禍,有時謀者亦不能預。',
      verdictLostEn:
        'The historian says: Jia Xu said afterwards, "That was a plan to save my own life. What merit is there in it?" The harm a piece of advice can do is sometimes beyond the man who gives it.',
    },
  },
  /* ── 199 易京之戰 ─────────────────────────────────────────────── */
  'scn-199-yijing': {
    gongsun: {
      defeat: {
        titleZh: '百樓不攻',
        titleEn: 'A Hundred Towers Cannot Be Stormed',
        textZh:
          '瓚曰:「昔謂天下事可指麾而定,今日視之,'
          + '非我所決,不如休兵力耕,以救凶年。'
          + '兵法百樓不攻。今吾樓櫓千重,食盡此穀,足知天下之事矣。」\n\n'
          + '於是不復救諸將,曰:「救一人,使後將恃救不肯力戰。」\n\n'
          + '及紹來攻,諸將果無鬥志,或降或走。'
          + '瓚穿地道至高樓下,火燒其柱,樓輒傾倒 ——'
          + '瓚知必敗,盡殺其妻子,乃自殺。',
        textEn:
          'Zan said: "I used to think the business of the realm could be settled with a wave of the hand. Looking at it now, it is not mine to settle. Better to rest the troops and farm hard and get through the lean years. The art of war says a hundred towers cannot be stormed. I have a thousand tiers of them; by the time this grain is eaten I shall know how the realm turned out."\n\n'
          + 'So he stopped relieving his own commanders: "Relieve one, and the next will count on relief instead of fighting."\n\n'
          + 'When Yuan Shao came, his commanders had no fight in them, and surrendered or ran. Tunnels were driven to the foot of the great tower and the pillars fired, and the tower came down. Knowing it was finished, he killed his wife and children and then himself.',
      },
      verdictZh:
        '論曰:瓚之不救諸將,其言似有理,而其效必至於無人肯戰。'
        + '夫恃險者棄人,棄人者無險可恃 ——'
        + '易京之樓千重,而破之者不過一條地道。',
      verdictEn:
        'The historian says: his reason for not relieving his commanders sounded plausible and guaranteed that nobody would fight. A man who trusts in works discards people, and a man who discards people has no works worth trusting. A thousand tiers at Yijing, and one tunnel brought it down.',
      verdictLostZh:
        '論曰:白馬義從縱橫塞外十餘年,而終於一座樓裡。'
        + '將之失其所長,常自以為得計。',
      verdictLostEn:
        'The historian says: the White Horse Volunteers ranged the frontier for over a decade and it ended inside a tower. When a commander gives up the thing he is good at, he usually thinks he has been clever.',
    },
    'yuan-shao': {
      defeat: {
        titleZh: '穿地及樓',
        titleEn: 'Tunnels to the Tower',
        textZh:
          '瓚遣子求救於黑山諸帥,欲自將突騎出,'
          + '傍西山以擾其後 —— 長史關靖諫曰:'
          + '「今將軍將士,皆已土崩瓦解,其所以能相守者,'
          + '顧戀其居處老小,而恃將軍為主故耳。'
          + '將軍堅守曠日,袁紹要當自退。若捨之而出,'
          + '後無鎮重,易京之危,可立而待也。」\n\n'
          + '瓚乃止。而紹漸增兵,穿地道直至樓下,火燒其柱。',
        textEn:
          'Zan sent his son to ask the Black Mountain chiefs for relief and meant to take his cavalry out himself and work round the western hills against Shao\'s rear — and his chief clerk Guan Jing remonstrated: "Your officers and men have already come apart. The only reason they still hold together is that they are attached to their houses and families here and are counting on Your Excellency as their master. Hold out long enough and Yuan Shao will have to withdraw. Leave them and go out, and with nothing solid behind them the fall of Yijing can be timed."\n\n'
          + 'So Zan stayed. And Shao brought up more troops, drove a tunnel to the foot of the tower, and fired its pillars.',
      },
      verdictZh:
        '論曰:紹之取幽州,積四年之功 ——'
        + '界橋一勝,而後乃能言取;易京一破,而後河北無敵。\n'
        + '然其取之也緩,而失之也速:'
        + '明年官渡,四州之力,一戰而空。',
      verdictEn:
        'The historian says: it took him four years to take You province — the win at Jieqiao made it discussable, the fall of Yijing left him without a rival in Hebei. He acquired it slowly and lost it quickly: the next year at Guandu, four provinces\' strength emptied out in one battle.',
      verdictLostZh:
        '論曰:公孫既滅,紹地最廣而心最驕 ——'
        + '田豐沮授之諫,自此不入。',
      verdictLostEn:
        'The historian says: with Gongsun gone, Shao had the widest lands and the highest opinion of himself. Tian Feng and Ju Shou were never listened to again.',
    },
  },
  /* ── 207 白狼山·北征烏桓 ──────────────────────────────────────── */
  'scn-207-bailang': {
    cao: {
      defeat: {
        titleZh: '虜卒聞之',
        titleEn: 'The Tribes Heard of It Suddenly',
        textZh:
          '諸將皆曰:「袁尚亡虜耳,夷狄貪而無親,豈能為尚用?」'
          + '郭嘉曰:「胡恃其遠,必不設備。因其無備,卒然擊之,'
          + '可破滅也。」\n\n'
          + '行至無終,值夏水,傍海道不通。田疇獻策:'
          + '「舊北平郡治在平岡,道出盧龍,達於柳城。'
          + '自建武以來,陷壞斷絕,垂二百載,而尚有微徑可從。」\n\n'
          + '塹山堙谷五百餘里,卒登白狼山,與虜遇。'
          + '眾甚盛,而軍在後,被甲者少 ——'
          + '公登高望之,見虜陣不整,乃縱兵擊之,使張遼為先鋒。',
        textEn:
          'The generals all said: "Yuan Shang is a fugitive. The tribes are greedy and have no attachments — what would they do anything for him for?" And Guo Jia said: "The Hu rely on their distance and will certainly not be prepared. Strike suddenly at their unpreparedness and they can be destroyed."\n\n'
          + 'The march reached Wuzhong and the summer floods closed the coast road. Tian Chou offered a route: "The old seat of Beiping commandery was at Pinggang; the road runs out through Lulong and reaches Liucheng. It has been broken and disused since the Jianwu era, nearly two hundred years, and there is still a faint track."\n\n'
          + 'Cutting through hills and filling valleys for five hundred li, they came up suddenly onto White Wolf Mountain and into contact. The tribal host was very large; his own column was strung out behind and few of his men were in armour — he climbed for a look, saw the tribal line was ragged, and loosed his troops with Zhang Liao at the point.',
      },
      verdictZh:
        '論曰:北征之役,諸將皆以為不可,而操獨行之 ——'
        + '所恃者郭嘉一言:「因其無備,卒然擊之。」\n'
        + '然還師之日,操自論之曰:「孤前行,乘危以徼幸,'
        + '雖得之,天所佐也,顧不可以為常。」'
        + '**賞諫者而不賞從者** —— 此其所以為操。',
      verdictEn:
        'The historian says: every general said the northern campaign could not be done and he did it anyway, on one line of Guo Jia\'s: strike suddenly at their unpreparedness. And on the way home he judged himself: "I went out and gambled on danger. I got away with it, and Heaven helped me, but it cannot be made a habit." Then he rewarded the men who had advised against it, and not the men who had agreed. That is why he was Cao Cao.',
      verdictLostZh:
        '論曰:郭嘉卒於柳城,年三十八。'
        + '操後於赤壁敗,嘆曰:「郭奉孝在,不使孤至此。」',
      verdictLostEn:
        'The historian says: Guo Jia died at Liucheng, aged thirty-eight. After the defeat at Red Cliffs Cao sighed: "Had Guo Fengxiao been alive, he would not have let me come to this."',
    },
    wuhuan: {
      defeat: {
        titleZh: '白狼山下',
        titleEn: 'Below White Wolf Mountain',
        textZh:
          '你是三郡烏丸之主,袁氏之婿黨。'
          + '袁尚兄弟來奔,你欲為之復河北 ——'
          + '如當年冒頓之於漢。\n\n'
          + '而曹操自盧龍塞出,塹山堙谷五百餘里,'
          + '卒然而至。你的陣還沒有整好。\n\n'
          + '虜眾大崩,你死於陣中。胡漢降者二十餘萬口。',
        textEn:
          'You were lord of the Wuhuan of three commanderies and a marriage-ally of the house of Yuan. When the Yuan brothers came to you, you meant to win Hebei back for them, as the Xiongnu had once done for a Han claimant.\n\n'
          + 'And Cao Cao came out through the Lulong pass, cutting hills and filling valleys for five hundred li, and arrived suddenly. Your line was not yet formed.\n\n'
          + 'The host broke utterly and you died in the ranks. Two hundred thousand Hu and Han came in and surrendered.',
      },
      verdictZh:
        '論曰:蹋頓以一部之眾,當中國之師,'
        + '所為者非其國之利,是袁氏之讎 ——'
        + '代人受禍者,雖強必亡。\n'
        + '自此三郡烏丸為天下名騎,而其名在魏,不在烏丸。',
      verdictEn:
        'The historian says: Tadun took the field against the armies of the middle realm with one people\'s strength, and not for his own people\'s interest but for the Yuan family\'s quarrel. Whoever takes another\'s calamity on himself is destroyed however strong he is. After that the Wuhuan of the three commanderies were the most famous cavalry in the realm — famous in Wei\'s service, not their own.',
      verdictLostZh:
        '論曰:遼西之敗,不在兵少,在無備 ——'
        + '恃遠者,以遠為備;而遠者,終有人走得到。',
      verdictLostEn:
        'The historian says: the defeat in Liaoxi was not for want of numbers but for want of preparation. Men who rely on distance use distance as their defence — and distance is something somebody eventually walks.',
    },
  },
  /* ── 241 芍陂之戰 ─────────────────────────────────────────────── */
  'scn-241-shaopi': {
    cao: {
      defeat: {
        titleZh: '力戰連日',
        titleEn: 'Days of Hard Fighting',
        textZh:
          '吳人四道並出:朱然圍樊,諸葛瑾攻柤中,'
          + '全琮攻芍陂,朱異襲樊城外圍。\n\n'
          + '王淩與孫禮戰於芍陂,力戰連日 ——'
          + '所爭者不過一道堤、一片陂水,'
          + '而淮南之田盡在其下。\n\n'
          + '吳軍退走。是歲,魏於淮南廣開屯田,'
          + '自鍾離而南,橫石以西,盡沘水四百餘里,'
          + '五里置一營,營六十人,且佃且守。',
        textEn:
          'Wu came out along four roads at once: Zhu Ran invested Fan, Zhuge Jin struck at Zuzhong, Quan Cong went for the Shaobei reservoir and Zhu Yi at the outworks of Fan.\n\n'
          + 'Wang Ling and Sun Li fought at Shaobei for days on end — what was at stake was an embankment and a sheet of water, and every field in Huainan lay below it.\n\n'
          + 'The Wu army withdrew. That year Wei opened the Huainan military colonies wide: from Zhongli south, from Hengshi west, four hundred li along the Bi river, a camp every five li and sixty men to a camp, farming and holding the line at once.',
      },
      verdictZh:
        '論曰:芍陂之爭,不在城,在水 ——'
        + '陂決則淮南無田,無田則壽春不可守。\n'
        + '魏之所以能久制江北者,'
        + '非以其兵多,以其**兵能自食** ——'
        + '五里一營,且佃且守,'
        + '故吳人歲歲而來,歲歲而無所得。',
      verdictEn:
        'The historian says: the fight at Shaobei was not over a city but over water — breach the embankment and Huainan has no fields, and without fields Shouchun cannot be held. Wei kept the north bank not because it had more soldiers but because its soldiers fed themselves: a camp every five li, farming and holding at once. So Wu came every year and every year got nothing.',
      verdictLostZh:
        '論曰:淮南一失,壽春為孤城;'
        + '壽春為孤城,而合肥、鍾離不能獨立 ——'
        + '一堤之下,系四百里之地。',
      verdictLostEn:
        'The historian says: lose Huainan and Shouchun is an island; with Shouchun an island, Hefei and Zhongli cannot stand alone. Four hundred li of country hung below one embankment.',
    },
    sun: {
      defeat: {
        titleZh: '四道並出',
        titleEn: 'Four Roads at Once',
        textZh:
          '赤烏四年,你發四路之師 ——'
          + '這是你這一代人最後一次有力氣同時打四個方向。\n\n'
          + '朱然圍樊城,幾拔之;'
          + '而司馬懿自將救之,然退。'
          + '諸葛瑾病卒於柤中軍中。全琮不能過芍陂。\n\n'
          + '是歲,太子孫登卒,年三十三。'
          + '臨終上疏,言陸遜、諸葛瑾可任 ——'
          + '而後二宮並闕,江東自相攻十餘年。',
        textEn:
          'In the fourth year of Chiwu you sent out four columns — the last time your generation had the strength to push in four directions at once.\n\n'
          + 'Zhu Ran nearly took Fan; then Sima Yi came down in person and Ran withdrew. Zhuge Jin died of illness in camp at Zuzhong. Quan Cong could not get past Shaobei.\n\n'
          + 'That year the heir apparent Sun Deng died, aged thirty-three. His last memorial named Lu Xun and Zhuge Jin as men to be trusted — and after him came the rivalry of the two palaces, and Wu spent over a decade fighting itself.',
      },
      verdictZh:
        '論曰:吳之北伐,自建安至赤烏,無歲不出,而無一歲有功。'
        + '非將不勇,地形使然:'
        + '出江則舍其所長,登陸則失其舟楫。\n'
        + '而是歲之真敗不在芍陂,在建業 ——'
        + '孫登既卒,二宮構隙,'
        + '**外不能取一城,內先折其半國**。',
      verdictEn:
        'The historian says: Wu campaigned north every year from Jian\'an to Chiwu and never once profited by it. Not for want of brave commanders — the ground decided it: leave the river and you give up what you are good at; go ashore and your ships are no use to you. And the real defeat that year was not at Shaobei but at Jianye. With Sun Deng dead the two palaces fell out, and having failed to take a single city abroad, Wu broke half of itself at home.',
      verdictLostZh:
        '論曰:陸遜以二宮之爭憤恚而卒。'
        + '吳之名將,死於魏者少,死於朝議者多。',
      verdictLostEn:
        "The historian says: Lu Xun died of vexation over the quarrel of the two palaces. Fewer of Wu's great commanders were killed by Wei than by discussions at court.",
    },
  },
  /* ── 244 興勢之戰 ─────────────────────────────────────────────── */
  'scn-244-xingshi': {
    cao: {
      defeat: {
        titleZh: '牛馬騾驢多死',
        titleEn: 'The Oxen and Mules Died',
        textZh:
          '爽欲立威名於天下,西征蜀漢,發卒十餘萬,'
          + '自駱谷入。\n\n'
          + '而蜀已據興勢 —— 王平曰:'
          + '「若賊分向黃金,我防之不及。'
          + '宜先遣劉護軍、杜參軍據興勢,'
          + '吾為後拒。若賊分向黃金,吾自率千人下自臨之。」\n\n'
          + '關中及氐、羌轉輸不能供,'
          + '牛馬騾驢多死,民夷號泣道路。'
          + '爽乃引還 —— 費禕已據三嶺以截其後,'
          + '爭嶮乃得過,失亡甚眾。',
        textEn:
          'Cao Shuang wanted a great name in the realm, so he campaigned west against Shu with over a hundred thousand men, entering by the Luo valley.\n\n'
          + 'Shu already held Xingshi. Wang Ping had said: "If they turn aside for Huangjin I cannot cover it in time. Send Protector Liu and Adjutant Du to hold Xingshi first, and I will be the rearguard. If they do turn for Huangjin, I will take a thousand men down myself and meet them."\n\n'
          + 'The transport of Guanzhong and of the Di and Qiang could not keep up; the oxen, horses, mules and asses died in numbers, and Chinese and tribesmen alike wept along the roads. Shuang turned back — and Fei Yi had already taken the three ridges across his line of retreat. He got through only by fighting for the high ground, and lost heavily.',
      },
      verdictZh:
        '論曰:爽之伐蜀,不為地,不為敵,為名 ——'
        + '「欲立威名於天下」六字,已是敗辭。\n'
        + '軍出而關中虛耗,氐羌怨叛,'
        + '自是爽之威望日損,而司馬懿之望日隆;'
        + '五年之後高平陵之變,'
        + '其種**播於駱谷之中**。',
      verdictEn:
        'The historian says: Cao Shuang invaded Shu not for ground and not for an enemy but for a reputation — "wanting a great name in the realm" is already the language of defeat. The army marched, Guanzhong was drained, the Di and Qiang turned resentful; from then on Shuang\'s standing fell as fast as Sima Yi\'s rose. Five years later came the coup at Gaoping Tombs, and its seed was sown in the Luo valley.',
      verdictLostZh:
        '論曰:懿與爽書曰:「昔武皇帝再入漢中,幾至大敗,君所知也。'
        + '今興平路勢至嶮,蜀已先據;若進不獲戰,退見徼絕,'
        + '覆軍必矣。」爽不聽。',
      verdictLostEn:
        'The historian says: Sima Yi wrote to Shuang: "The Martial Emperor went into Hanzhong twice and came near to disaster — you know this. The road now is of the most dangerous kind and Shu has got there first. If you advance and cannot bring them to battle, and retreat to find the way cut, your army is certainly lost." Shuang did not listen.',
    },
    'liu-bei': {
      defeat: {
        titleZh: '據險而已',
        titleEn: 'Hold the Narrows, Nothing More',
        textZh:
          '諸將或曰:「今力不足以拒敵,聽當固守漢、樂二城,'
          + '遇賊令入,比爾間,涪軍足得至關。」\n\n'
          + '王平曰:「不然。漢中去涪垂千里,賊若得關,便為禍也。」\n\n'
          + '於是據興勢,多張旗幟,彌亙百餘里。'
          + '費禕自成都赴援 —— 臨行,與來敏圍棋,'
          + '意色不變。敏曰:「吾聊觀試君耳!'
          + '君信可人,必能辦賊者也。」',
        textEn:
          'Some of the officers said: "We have not the strength to stop them. We should hold the two fortified towns of Han and Le, let the enemy come in, and in the meantime the army from Fu can reach the pass."\n\n'
          + 'Wang Ping said: "No. Hanzhong is nearly a thousand li from Fu. If they get the pass, the harm is already done."\n\n'
          + 'So they held Xingshi and set out banners over a hundred li of ridge. Fei Yi came up from Chengdu — and before he left he played a game of weiqi with Lai Min without a flicker of expression. Min said: "I was only testing you. You will do; you are certainly the man to deal with them."',
      },
      verdictZh:
        '論曰:蜀之能立四十年於一州之地,'
        + '不在其能出,在其**能守** ——'
        + '守之要,又不在城,在道:'
        + '陽平、興勢、劍閣,三處而已。\n'
        + '故王平之言勝於眾議者一句:'
        + '「賊若得關,便為禍也。」'
        + '後二十年鄧艾自陰平入,亦正坐此。',
      verdictEn:
        'The historian says: Shu lasted forty years on one province not because it could attack but because it could defend, and defence there was never a matter of cities but of roads — Yangping, Xingshi, Jiange, and that is all. Which is why Wang Ping\'s one sentence beat the whole staff: "If they get the pass, the harm is already done." Twenty years later Deng Ai came in by Yinping, and the principle held.',
      verdictLostZh:
        '論曰:費禕之赴援,不急一日之程,而急一局之棋 ——'
        + '**將帥之定,軍之所恃**。'
        + '禕在,則蜀之守猶可為;禕死於歲首之會,而蜀事始不可支。',
      verdictLostEn:
        "The historian says: Fei Yi, going up to the relief, would not hurry a day's march but would finish a game of weiqi — a commander's composure is what an army leans on. While Yi lived, Shu could still be defended; he was murdered at a New Year banquet, and after that nothing there held together.",
    },
  },
  /* ── 252 東興之戰 ─────────────────────────────────────────────── */
  'scn-252-dongxing': {
    sun: {
      defeat: {
        titleZh: '雪中短兵',
        titleEn: 'Short Blades in the Snow',
        textZh:
          '恪築東興堤,左右結山,俠築兩城。'
          + '魏以為侵軼,三道並進,'
          + '胡遵、諸葛誕率眾七萬攻兩城。\n\n'
          + '時天寒雪,魏諸將會飲,見前部兵少,'
          + '笑而不設備。丁奉謂諸將曰:'
          + '「今日之事,取封侯爵賞之時也!」'
          + '乃使兵解鎧著胄,持短兵。魏軍益笑之。\n\n'
          + '兵得上,便鼓譟亂斫。魏軍驚擾散走,'
          + '爭渡浮橋,橋壞絕,自投於水,更相蹈藉,'
          + '死者數萬。',
        textEn:
          'Zhuge Ke raised the Dongxing embankment, anchored it on the hills at either end, and built a fort at each side. Wei took it for an encroachment and came on by three roads, Hu Zun and Zhuge Dan bringing seventy thousand against the two forts.\n\n'
          + 'It was cold and snowing, and the Wei commanders were at a drinking party; seeing how few men were in the leading party they laughed and took no precautions. Ding Feng said to the other officers: "Today is the day one earns a marquisate." He had his men take off their armour, keep their helmets, and carry short blades. The Wei troops laughed harder.\n\n'
          + 'Once up, they raised a shout and cut in among them. The Wei army broke in confusion, crowded onto the pontoon bridge, the bridge gave way and they went into the water and trampled one another. Tens of thousands died.',
      },
      verdictZh:
        '論曰:東興之捷,吳自赤壁以來未有也。'
        + '而恪由此輕魏 —— 明年興二十萬眾出新城,'
        + '士卒疲病,還而見殺。\n'
        + '**一勝之害,有時甚於一敗**:'
        + '敗者知懼,勝者不知止。',
      verdictEn:
        'The historian says: Wu had had no such victory since Red Cliffs. And it made Zhuge Ke contemptuous of Wei — the next year he took two hundred thousand out to New Hefei, his troops sickened and broke down, and he was murdered on his return. A win can do more harm than a loss: a beaten man knows fear, a winner does not know when to stop.',
      verdictLostZh:
        '論曰:丁奉解鎧而勝,非勇於無甲,是知雪中之戰,'
        + '甲重則不能疾 ——'
        + '將之所以異於卒者,在此一念之間。',
      verdictLostEn:
        'The historian says: Ding Feng won by taking his armour off — not from bravado, but because he knew that in snow armour makes you slow. That single judgement is the whole difference between a commander and a soldier.',
    },
    cao: {
      defeat: {
        titleZh: '見前部兵少',
        titleEn: 'So Few in the Leading Party',
        textZh:
          '王昶攻南郡,毌丘儉向武昌,'
          + '胡遵、諸葛誕率七萬攻東興二城 ——'
          + '三道並進,兵勢極盛。\n\n'
          + '而堤上二城,各留千人。魏軍造浮橋以渡,'
          + '陳於堤上,分兵攻兩城 —— 城在高峻,不可卒拔。\n\n'
          + '諸軍聞前敗,各燒屯走。是役,'
          + '樂安太守桓嘉沒,前將軍韓綜死,'
          + '喪失車乘牛馬騾驢各數千,資器山積。\n\n'
          + '司馬昭以監軍失利,削爵。',
        textEn:
          'Wang Chang went at Nan commandery, Guanqiu Jian towards Wuchang, Hu Zun and Zhuge Dan with seventy thousand at the two forts of Dongxing — three roads at once, and a great weight of troops.\n\n'
          + 'But the two forts on the embankment had a thousand men each. The Wei army threw a pontoon bridge, drew up along the dyke, and detached troops against the forts — which stood high and could not be rushed.\n\n'
          + 'When the other columns heard of the defeat in front, each burned its camp and left. In that action the Grand Administrator of Le\'an, Huan Jia, was lost and the General of the Van, Han Zong, killed; several thousand each of carts, oxen, horses, mules and asses were lost, and the stores lay in heaps.\n\n'
          + 'Sima Zhao was stripped of his title for the failure as army supervisor.',
      },
      verdictZh:
        '論曰:三道並進而敗於一堤者,'
        + '兵多而心不一也。\n'
        + '諸葛誕、胡遵、王昶、毌丘儉皆一時之選,'
        + '而無一人總之 —— **無主之師,勝則爭功,敗則爭走**。'
        + '此後淮南三叛,四人之中三人在其列,'
        + '亦可知魏之淮南,將帥各為身謀久矣。',
      verdictEn:
        'The historian says: three columns beaten by one embankment — plenty of troops and no single mind. Zhuge Dan, Hu Zun, Wang Chang and Guanqiu Jian were all first-rate men, and nobody was over them. An army without a master competes for credit when it wins and competes to get away when it loses. Three of those four appear in the later Huainan revolts, which tells you how long the commanders there had been looking after themselves.',
      verdictLostZh:
        '論曰:昭既削爵,而問於眾曰:「誰任其咎?」'
        + '王儀曰:「責在元帥。」昭怒曰:「司馬欲委罪於孤邪!」'
        + '遂殺之。—— 敗軍之責,自此無人敢言。',
      verdictLostEn:
        'The historian says: stripped of his title, Sima Zhao asked his staff, "Whose fault was it?" Wang Yi said, "The responsibility lies with the commander-in-chief." Zhao said furiously, "Does the marshal mean to put the blame on me?" and had him killed. After that nobody spoke about who had lost a battle.',
    },
  },
  /* ── 253 合肥新城之戰 ─────────────────────────────────────────── */
  'scn-253-hefei': {
    cao: {
      defeat: {
        titleZh: '被攻過百日',
        titleEn: 'Attacked Past the Hundredth Day',
        textZh:
          '恪興二十萬眾圍新城。城中三千人耳。\n\n'
          + '守將張特拒之數月,城將陷,乃謂吳人曰:'
          + '「今我無心復戰也。然魏法,被攻過百日而救不至者,'
          + '雖降,家不坐也。自受敵以來,已九十餘日矣。'
          + '此城中本有四千餘人,戰死者已過半,'
          + '城雖陷,尚有半人不欲降,我當還差錄之,'
          + '明日早送名,且持我印綬去以為信。」\n\n'
          + '乃投其印綬以與之。吳人聽之而不取其印。'
          + '特乃夜徹諸屋材柵,補其缺為二重。\n\n'
          + '明日謂曰:「我但有鬥死耳!」',
        textEn:
          'Zhuge Ke invested New Hefei with two hundred thousand. There were three thousand men inside.\n\n'
          + 'The commandant Zhang Te held out for months, and when the place was about to fall he said to the men of Wu: "I have no heart left for fighting. But the law of Wei is that if a garrison is attacked past a hundred days and no relief comes, then even if it surrenders its families are not punished. It is over ninety days since I was first engaged. There were four thousand-odd men here and more than half are dead; even when the city falls, half of the rest do not want to surrender, so I must go back and take their names. I will send you the roll in the morning, and here is my seal of office as a pledge."\n\n'
          + 'And he threw down his seal to them. The men of Wu listened, and did not pick up the seal. That night Te pulled down the timbers and palisades of the houses and built the breach up double.\n\n'
          + 'In the morning he said: "All I have left is to die fighting."',
      },
      verdictZh:
        '論曰:三千人守二十萬,不以城堅,以其**知法** ——'
        + '百日之限,本為恤降者而設,'
        + '而特用之以誑敵,遂為守城之奇。\n'
        + '然其所以敢誑者,亦坐吳人急於一日之功;'
        + '**急者可欺,緩者不可欺**。',
      verdictEn:
        'The historian says: three thousand held off two hundred thousand not because the walls were strong but because the commandant knew the law. The hundred-day rule existed to spare men who surrendered, and he used it to deceive an enemy — which made it one of the great defences. But he dared it only because Wu was in a hurry for a result. The impatient can be tricked; the patient cannot.',
      verdictLostZh:
        '論曰:司馬孚將二十萬赴救,而諸將請速進,孚曰:'
        + '「夫攻者,借人之力以為功;今圍城已久,'
        + '不如緩之。」—— 待其自敝而已。',
      verdictLostEn:
        'The historian says: Sima Fu marched two hundred thousand to the relief, and when his officers pressed him to hurry he said: "An attacker borrows other men\'s strength to make his success. They have been at that siege a long time now; better to go slowly." He was simply waiting for them to wear out.',
    },
    sun: {
      defeat: {
        titleZh: '因暑飲水',
        titleEn: 'They Drank in the Heat',
        textZh:
          '大臣以為民疲,勸恪不可。恪不聽,'
          + '違眾出軍,大發州郡二十萬眾,百姓騷動。\n\n'
          + '圍新城數月,不拔。士卒疲勞,因暑飲水,'
          + '泄下流腫,病者大半,死傷塗地。'
          + '諸營吏日白病者多,恪以為詐,欲斬之,自是無敢言。\n\n'
          + '恪內惟失計,而恥城不下,忿形於色。'
          + '及退,傷病流曳,或頓仆道路,或見略獲 ——'
          + '而恪晏然自若,出住江渚一月,圖起田於潯陽。\n\n'
          + '孫峻因民之多怨,眾之所嫌,'
          + '構恪欲為變,與亮謀,置酒請恪。',
        textEn:
          'The senior ministers thought the people were exhausted and urged him not to go. Ke would not listen; he went out against everyone\'s advice, levied two hundred thousand from the provinces and commanderies, and the country was in an uproar.\n\n'
          + 'He lay before New Hefei for months and could not take it. The troops wore out, drank in the heat, and came down with dysentery and swellings; more than half were sick and the dead and injured lay everywhere. The camp officers reported the numbers of sick daily and Ke said they were lying and meant to behead one, and after that nobody dared say anything.\n\n'
          + 'Inwardly he knew he had miscalculated, and was ashamed the place had not fallen, and it showed in his face. On the retreat the sick and wounded dragged themselves along, dropped in the road, or were taken — while Ke went on unruffled, halted a month on an island in the river, and drew up plans for opening farmland at Xunyang.\n\n'
          + 'Sun Jun, using the general resentment and the general dislike, framed him for plotting a coup, arranged it with the young emperor, and invited him to a banquet.',
      },
      verdictZh:
        '論曰:恪之敗,不敗於張特,敗於**不肯聽壞消息** ——'
        + '諸營日白病者多,而以為詐;'
        + '既知失計,而恥形於色,'
        + '則左右皆知其不可諫矣。\n'
        + '故一軍之潰,常先潰於中軍之帳;'
        + '而恪之死,亦不在酒中,在新城之下。',
      verdictEn:
        'The historian says: Zhuge Ke was not beaten by Zhang Te but by his refusal to hear bad news. The camps reported their sick daily and he called it a lie; he knew he had miscalculated and let his shame show, and everyone around him understood he could no longer be advised. An army usually collapses first inside the commander\'s tent. And Ke did not die at that banquet; he died under the walls of New Hefei.',
      verdictLostZh:
        '論曰:東興大捷在前,新城大敗在後,相去一年。'
        + '吳人殺恪,夷三族;而其後孫峻、孫綝相繼專朝,'
        + '所殺者皆宗室大臣 —— **江東自是無可用之人**。',
      verdictLostEn:
        'The historian says: the great victory at Dongxing and the disaster at New Hefei were one year apart. Wu killed Zhuge Ke and exterminated his kin to the third degree; then Sun Jun and Sun Chen held the court in turn, and what they killed were the imperial clansmen and senior ministers. After that there was nobody left in the southeast to use.',
    },
  },
  /* ── 255 淮南二叛 ─────────────────────────────────────────────── */
  'scn-255-huainan2': {
    cao: {
      defeat: {
        titleZh: '目瘤突出',
        titleEn: 'The Eye Burst',
        textZh:
          '師新割目瘤,創甚。或曰:「可遣太尉往。」'
          + '傅嘏、王肅、鍾會皆勸師自行:'
          + '「若他人往,事有不捷,則天下事去矣。」\n\n'
          + '師蹶然而起曰:「我請輿疾而東。」\n\n'
          + '鍾會之策:「淮南將士家皆在北,'
          + '眾心沮散,降者相屬。'
          + '宜深溝高壘以待之,不與之戰。」\n\n'
          + '果如所料。而文欽子鴦,年十八,'
          + '夜襲師營,大呼:「司馬師何在!」'
          + '師驚,目瘤突出,痛甚,'
          + '恐眾之駭,齧被而忍之,被為之破裂。',
        textEn:
          'Sima Shi had just had a tumour cut from his eye and the wound was bad. Someone suggested sending the Grand Commandant instead; Fu Gu, Wang Su and Zhong Hui all urged him to go himself: "If another man goes and it does not come off, the realm is lost."\n\n'
          + 'Shi got up abruptly: "Then carry me east on my sickbed."\n\n'
          + 'Zhong Hui\'s plan was this: "The families of the Huainan officers and men are all in the north. Their hearts will fail and they will come over one after another. We should dig deep and build high and wait, and not give them a battle."\n\n'
          + 'And so it went. Then Wen Qin\'s son Yang, eighteen years old, raided Shi\'s camp at night shouting, "Where is Sima Shi?" Shi started up; the tumour burst from its socket and the pain was terrible. Fearing the effect on his men, he bit down on the bedding and endured it, and the bedding tore.',
      },
      verdictZh:
        '論曰:淮南之兵,一敗於家在北。'
        + '**深溝高壘,不與之戰** —— 鍾會此策,'
        + '不攻其軍,攻其軍中之家書。\n'
        + '而師以疾東征,勝而卒於許昌,年四十八。'
        + '天下之權遂歸昭 ——'
        + '一齧之被,實裂魏祚。',
      verdictEn:
        'The historian says: the Huainan troops were beaten by the fact that their families were in the north. Dig deep, build high, refuse battle — Zhong Hui\'s plan attacked not their army but the letters from home inside it. And Shi went east on a sickbed, won, and died at Xuchang aged forty-eight. Power passed to Zhao. That torn bedding tore the fortune of Wei with it.',
      verdictLostZh:
        '論曰:文鴦單騎陷陣,追騎數百不敢逼 ——'
        + '二十六年後,鴦為諸葛誕所殺之父復仇不得,'
        + '終夷三族於晉。**勇者不保其身,常坐所事非人**。',
      verdictLostEn:
        'The historian says: Wen Yang charged the line alone and several hundred pursuers dared not close with him. Twenty-six years later he was exterminated to the third degree under Jin. A brave man rarely keeps his life, usually because of whom he served.',
    },
    guanqiu: {
      defeat: {
        titleZh: '移檄郡國',
        titleEn: 'The Circular to the Commanderies',
        textZh:
          '儉與欽矯太后詔,起兵壽春,'
          + '移檄郡國,數司馬師之罪十一條 ——'
          + '所言皆實,而應者無一郡。\n\n'
          + '將士家皆在北,眾心沮散,'
          + '降者相屬,惟淮南新附農民為之用。\n\n'
          + '儉走,匿水草中,為安風津都尉部民張屬所射殺。'
          + '屬以功封侯。\n\n'
          + '——舉義者死於漁人之手。',
        textEn:
          'Jian and Wen Qin forged an edict from the Empress Dowager, raised troops at Shouchun and sent a circular round the commanderies setting out eleven charges against Sima Shi. Every charge was true and not one commandery answered.\n\n'
          + 'The families of their officers and men were all in the north; their hearts failed and they went over in a steady stream, and only the newly settled farmers of Huainan stayed with them.\n\n'
          + 'Jian fled and hid in the reeds by the water, and a militiaman named Zhang Shu of the Anfeng ford garrison shot him. Shu was ennobled for it.\n\n'
          + 'The man who rose for the right cause died at the hands of a fisherman.',
      },
      verdictZh:
        '論曰:儉之檄,字字皆實;而兵者不以理直勝。\n'
        + '**舉大事者先問其眾之家在何處** ——'
        + '淮南之卒,身在南而心在北,'
        + '此非忠於司馬,是質於司馬。\n'
        + '王淩、儉、誕三叛,前後十年,'
        + '所敗者同一因;而司馬氏所恃者,亦不過此一著。',
      verdictEn:
        'The historian says: every word of Guanqiu Jian\'s circular was true, and wars are not won by being in the right. Whoever raises a great enterprise should first ask where his men\'s families live. The soldiers of Huainan stood in the south with their hearts in the north — not loyalty to the Simas but hostages held by them. The three Huainan revolts spanned ten years and all failed for the same reason, and that one device was the whole of the Sima family\'s security.',
      verdictLostZh:
        '論曰:儉嘗與夏侯玄、李豐善,豐既誅,玄夷,'
        + '而儉不自安 —— 三叛之起,皆起於「見前者之死」。'
        + '殺一人以立威,而後不得不殺其友;此其所以無窮。',
      verdictLostEn:
        'The historian says: Guanqiu Jian had been close to Xiahou Xuan and Li Feng, and when Feng was executed and Xuan\'s family destroyed he no longer felt safe. All three revolts began with watching what happened to the last man. Kill one to make an example and you must then kill his friends; that is why it never ends.',
    },
  },
  /* ── 257 淮南三叛 ─────────────────────────────────────────────── */
  'scn-257-huainan3': {
    cao: {
      defeat: {
        titleZh: '長圍',
        titleEn: 'The Long Wall',
        textZh:
          '昭督二十六萬眾臨淮,'
          + '築長圍以困壽春,不攻。\n\n'
          + '或言「宜急攻之」,昭曰:'
          + '「城固而眾多,攻之必傷;'
          + '若吳兵至,表裡受敵,危道也。'
          + '今三叛相聚於孤城之中,天其或者將使同就戮乎!'
          + '吾當以全策縻之。」\n\n'
          + '既而城中食盡,全懌等數萬人出降。'
          + '誕與文欽爭議,遂殺欽。欽子鴦、虎踰城降 ——'
          + '昭赦之,使繞城而呼:'
          + '「文欽之子猶不見殺,其餘何懼!」\n\n'
          + '城中皆喜,又日益飢困。遂陷。',
        textEn:
          'Sima Zhao brought two hundred and sixty thousand down to the Huai, walled Shouchun in with a long circumvallation, and did not attack.\n\n'
          + 'When some urged an assault he said: "The walls are strong and the garrison large; storming it will cost us. And if the Wu troops arrive we shall be taken front and rear — that is a dangerous road. All three rebellions have now gathered in one isolated city. Perhaps Heaven means them to be executed together. I shall tie them up with a whole strategy."\n\n'
          + 'In time the food ran out and Quan Yi and tens of thousands came out and surrendered. Zhuge Dan quarrelled with Wen Qin and killed him, and Qin\'s sons Yang and Hu got over the wall and surrendered — and Zhao pardoned them and sent them riding round the walls calling: "Even Wen Qin\'s sons are not put to death. What has anyone else to fear?"\n\n'
          + 'The garrison was delighted, and hungrier every day. Then the city fell.',
      },
      verdictZh:
        '論曰:昭之取壽春,不以攻,以圍;'
        + '不以殺,以赦 ——\n'
        + '殺文欽者誕也,赦文欽之子者昭也。'
        + '**使敵自相殺,而我專行其赦**,'
        + '則城中之人,恨不在我。\n'
        + '三叛既平,魏之異議者盡於此。'
        + '明年甘露之變,天子死於南闕,而無一人起。',
      verdictEn:
        'The historian says: Zhao took Shouchun not by assault but by encirclement, and not by killing but by pardon. Zhuge Dan killed Wen Qin; Zhao pardoned Wen Qin\'s sons. Let the enemy do his own killing and keep the pardoning for yourself, and the men inside will not hate you. With the third revolt put down, dissent in Wei was finished. The next year the emperor was killed at the southern gate-tower and not one man rose.',
      verdictLostZh:
        '論曰:誕麾下數百人拱手為列,每斬一人,輒降之,'
        + '終不變,曰:「為諸葛公死,不恨。」'
        + '——時人比之田橫。',
      verdictLostEn:
        'The historian says: several hundred of Zhuge Dan\'s guards stood in ranks with their hands folded, and as each was beheaded he was offered his life, and not one changed, each saying, "To die for Lord Zhuge — I have no regret." People compared them to the followers of Tian Heng.',
    },
    huainan: {
      defeat: {
        titleZh: '豈可以社稷輸人',
        titleEn: 'Hand the Altars to Another?',
        textZh:
          '昭使賈充觀誕。充曰:'
          + '「洛中諸賢,皆願禪代,君以為云何?」\n\n'
          + '誕厲聲曰:「卿非賈豫州子乎?'
          + '世受魏恩,豈可以社稷輸人!'
          + '若洛中有難,吾當死之。」\n\n'
          + '充還,言於昭:「誕再在揚州,得士眾心。'
          + '今徵,必不來,禍小事淺;不徵,事遲禍大。」\n\n'
          + '——於是徵之。誕遂反。'
          + '一問一答之間,淮南又反一次。',
        textEn:
          'Zhao sent Jia Chong to sound out Zhuge Dan. Chong said: "All the worthy men in Luoyang would like to see the succession pass. What does my lord think?"\n\n'
          + 'Dan said sharply: "Are you not the son of Jia of Yu province? Your house has had Wei\'s favour for generations. How can you hand the altars of the state to another man? If there is trouble in Luoyang I shall die for it."\n\n'
          + 'Chong went back and told Zhao: "Dan has been twice in Yang province and has the hearts of the men there. Summon him now and he will certainly not come — small harm and a shallow business. Do not summon him and it comes late and the harm is great."\n\n'
          + 'So he was summoned, and he rebelled. Between one question and one answer, Huainan revolted again.',
      },
      verdictZh:
        '論曰:誕之反,司馬氏逼之也;'
        + '而誕之敗,亦誕自取 ——'
        + '外求救於吳,則士心先貳;'
        + '內殺文欽,則吳援自絕。\n'
        + '**恃外援者,先失其內**:'
        + '全氏數萬人一夕而降,即由吳中構隙。',
      verdictEn:
        'The historian says: the Simas forced Zhuge Dan into revolt, and he also brought his defeat on himself. Asking Wu for help split his own men\'s loyalty first; killing Wen Qin cut off the Wu relief. A man who leans on outside help loses his own house first — the Quan family and their tens of thousands went over in a single night because of a quarrel back in Wu.',
      verdictLostZh:
        '論曰:王淩以子為質而反,毌丘儉以檄而反,'
        + '誕以一問而反 —— 十年三叛,'
        + '而司馬氏之勢因三叛而定。'
        + '**反者非不忠,是無術**。',
      verdictLostEn:
        'The historian says: Wang Ling revolted with his son as a hostage, Guanqiu Jian revolted with a manifesto, Zhuge Dan revolted over a single question. Three revolts in ten years, and the Simas were made secure by all three. The rebels did not lack loyalty; they lacked method.',
    },
    sun: {
      defeat: {
        titleZh: '救之者三萬',
        titleEn: 'Thirty Thousand for the Relief',
        textZh:
          '誕遣子靚為質求救,吳遣文欽、唐咨、全懌等'
          + '將三萬眾入壽春。\n\n'
          + '而魏長圍既合,朱異三攻黎漿,不得進,'
          + '孫綝怒,斬異於鑊里。'
          + '——自斬其將,而後退師。\n\n'
          + '全懌兄子輝、儀在建業,與家內爭訟,'
          + '將母奔魏。鍾會偽作其書,'
          + '言吳怒懌等不能拔壽春,欲盡誅諸將家。'
          + '懌等大懼,遂開東城門出降。',
        textEn:
          'Dan sent his son Jing as a hostage to ask for help, and Wu sent Wen Qin, Tang Zi and Quan Yi with thirty thousand into Shouchun.\n\n'
          + 'But the Wei circumvallation had closed. Zhu Yi attacked Lijiang three times and could not get through, and Sun Chen in a rage had him executed at Huoli — beheaded his own commander, and then withdrew the army.\n\n'
          + 'Quan Yi\'s nephews Hui and Yi were at Jianye, fell out with their family in a lawsuit, and took their mother over to Wei. Zhong Hui forged a letter in their hand saying that Wu was furious the Quans had failed to take Shouchun and meant to put all the commanders\' families to death. They were terrified, opened the east gate and surrendered.',
      },
      verdictZh:
        '論曰:吳之救誕,兵入而援不繼,'
        + '將帥斬於後,家書偽於前 ——'
        + '三萬眾降於一紙。\n'
        + '**內無以安其家者,不可以將兵於外**。'
        + '孫綝殺朱異,與司馬昭赦文鴦,'
        + '一日之間,高下判矣。',
      verdictEn:
        'The historian says: Wu put troops into Shouchun and then failed to follow them up — its commander executed behind them, a forged letter from home in front of them, and thirty thousand men surrendered to a piece of paper. A state that cannot keep its soldiers\' families safe cannot send them abroad. Sun Chen killing Zhu Yi and Sima Zhao pardoning Wen Yang happened within days of each other, and that settled which was which.',
      verdictLostZh:
        '論曰:自此吳不復北向。'
        + '綝專朝而殺大臣,廢少帝;'
        + '而江東之力,自壽春一役盡矣。',
      verdictLostEn:
        'The historian says: Wu never faced north again. Sun Chen ran the court, killed its ministers and deposed the young emperor; and the strength of the southeast had been used up at Shouchun.',
    },
  },
  /* ── 264 鍾會之亂 ─────────────────────────────────────────────── */
  'scn-264-zhonghui': {
    zhonghui: {
      defeat: {
        titleZh: '事成則得天下',
        titleEn: 'If It Comes Off, the Realm',
        textZh:
          '會既平蜀,威震西土,'
          + '自謂功名蓋世,不可復為人下。\n\n'
          + '姜維說之曰:「聞君自淮南以來,算無遺策,'
          + '晉道克昌,皆君之力。'
          + '今復定蜀,威德振世,民高其功,主畏其謀,'
          + '欲以此安歸乎?」\n\n'
          + '會矯太后遺詔,起兵廢昭,'
          + '悉請護軍、郡守、牙門騎督以上,'
          + '皆閉之於益州諸曹屋中。\n\n'
          + '維勸會盡殺之,會猶豫未決。'
          + '——十八日,亂作。會與維俱死,死者數百人。',
        textEn:
          'Having pacified Shu, Zhong Hui\'s authority shook the west, and he judged that with such a name he could no longer be anyone\'s subordinate.\n\n'
          + 'Jiang Wei worked on him: "They say that since Huainan not one of your calculations has miscarried, and that the rise of the house of Jin is your doing. Now you have taken Shu as well; your name shakes the age, the people rate your achievement high and your master fears your cleverness. Where do you propose to retire to with all that?"\n\n'
          + 'Hui forged a testamentary edict from the Empress Dowager to raise troops and depose Sima Zhao, summoned every army-protector, commandery administrator and cavalry commandant, and shut them up in the offices of Yi province.\n\n'
          + 'Wei urged him to kill them all, and he hesitated. On the eighteenth the mutiny came. Hui and Wei died together, and several hundred with them.',
      },
      verdictZh:
        '論曰:會之才,天下所共許;'
        + '而其敗,在**謀成於密而發於猶豫** ——\n'
        + '既閉諸將於屋,則已無回頭之路;'
        + '既無回頭之路,而不能決一日之殺,'
        + '是以死。\n'
        + '昔昭遣會伐蜀,或言會不可信,昭曰:'
        + '「取蜀之後,中國將士人人思歸,'
        + '蜀之遺民,未離憂懼;會若作惡,'
        + '祗自滅族耳。」—— 果如其言。',
      verdictEn:
        'The historian says: everyone granted Zhong Hui\'s ability, and he was destroyed by a plot laid in secret and launched in hesitation. Having locked the commanders up he had no road back; having no road back and being unable to decide on one day\'s killing, he died. When Zhao sent him against Shu and someone said Hui was not to be trusted, Zhao replied: "Once Shu is taken, every soldier of the middle realm will be thinking of home, and the surviving people of Shu will not yet be over their fright. If Hui makes trouble, he will only destroy his own clan." And so it turned out.',
      verdictLostZh:
        '論曰:維之勸會,非為會也 ——'
        + '密書於後主曰:「願陛下忍數日之辱,'
        + '臣欲使社稷危而復安,日月幽而復明。」\n'
        + '事不成而身死,然其志可見。',
      verdictLostEn:
        'The historian says: Jiang Wei was not egging Zhong Hui on for Zhong Hui\'s sake. His secret letter to his own sovereign said: "I beg Your Majesty to endure the humiliation a few days more. Your servant means to bring the altars of the state back from danger to safety and the sun and moon from darkness back to light." It failed and he died, and his intention is plain enough.',
    },
    dengai: {
      defeat: {
        titleZh: '陰平小路',
        titleEn: 'The Yinping Track',
        textZh:
          '艾自陰平行無人之地七百餘里,'
          + '鑿山通道,造作橋閣。'
          + '山高谷深,至為艱險,又糧運將匱,頻於危殆。'
          + '艾以氈自裹,推轉而下。'
          + '將士皆攀木緣崖,魚貫而進。\n\n'
          + '出江油,破諸葛瞻於綿竹,遂至成都。'
          + '——滅蜀之功,天下第一。\n\n'
          + '而後艾輒承制拜官,言於眾曰:'
          + '「姜維自一時雄兒也,與某相值,故窮耳。」'
          + '又曰:「諸君賴遭某,故得有今日耳。」\n\n'
          + '會白其反狀。檻車徵。'
          + '衛瓘遣田續追殺之於綿竹西。',
        textEn:
          'Deng Ai went from Yinping seven hundred li through empty country, cutting a road through the mountains and building trestle bridges. The hills were high and the gorges deep and it was as dangerous as could be, and the supply train was failing, so that they were repeatedly at the point of ruin. Ai wrapped himself in a felt and rolled down; the officers and men went hand over hand along the cliffs and filed forward one behind another.\n\n'
          + 'He came out at Jiangyou, broke Zhuge Zhan at Mianzhu, and reached Chengdu. No man in the realm had done more.\n\n'
          + 'Afterwards he made appointments on his own authority, and said in company: "Jiang Wei was a hero of his day; he ran out of road because he came up against me." And: "You gentlemen are fortunate to have met me, or you would not be here today."\n\n'
          + 'Zhong Hui reported him for treason. He was sent for in a cage-cart. Wei Guan sent Tian Xu after him and he was killed west of Mianzhu.',
      },
      verdictZh:
        '論曰:艾之取蜀,自古用兵之奇,無以過之;'
        + '而其死,不以奇,以言。\n'
        + '**功大者宜口拙**。'
        + '「諸君賴遭某」六字,'
        + '比七百里陰平之險更難行。\n'
        + '會雖誣之,而聽誣者早已在心;'
        + '故艾之罪,不在反,在**不可制**。',
      verdictEn:
        'The historian says: as a stroke of arms, Deng Ai\'s conquest of Shu has never been bettered — and what killed him was not the stroke but his mouth. A man with a great achievement should be clumsy in speech. "You gentlemen are fortunate to have met me" is a harder road than seven hundred li of Yinping. Zhong Hui\'s charge was a fabrication and the man who believed it had already made up his mind. Deng Ai\'s offence was not rebellion; it was being impossible to control.',
      verdictLostZh:
        '論曰:泰始元年,詔曰:「艾有功勳,'
        + '受罪不逃刑,而子孫為民隸,朕常愍之。」'
        + '——赦在身後,官在子孫,兵法無此一條。',
      verdictLostEn:
        'The historian says: in the first year of Taishi an edict ran: "Deng Ai had merit and, charged, did not flee his punishment, and his descendants are bondsmen. I have always pitied it." A pardon after death and an office for the grandchildren: no manual of war has a section on that.',
    },
    cao: {
      defeat: {
        titleZh: '以全策縻之',
        titleEn: 'Tie It Up With a Whole Strategy',
        textZh:
          '或謂昭曰:「會不可信,不可令伐蜀。」'
          + '昭笑曰:「取蜀之後,中國將士人人思歸,'
          + '蜀之遺民,未離憂懼。'
          + '會若作惡,祗自滅族耳。」\n\n'
          + '及會反狀白,昭自將十萬屯長安,'
          + '遣賈充將萬人入斜谷。\n\n'
          + '會聞之,謂所親曰:「但取鄧艾,相國知我能獨辦之。'
          + '今來大重,必覺我異矣,便當速發。」\n\n'
          + '——十八日,眾軍攻之。'
          + '會、維、艾,三人皆死於一月之內。'
          + '天下遂為一。',
        textEn:
          'Someone said to Sima Zhao: "Zhong Hui is not to be trusted; he should not be given the Shu campaign." Zhao laughed: "Once Shu is taken, every soldier of the middle realm will be thinking of home and the surviving people of Shu will not yet be over their fright. If Hui makes trouble he will only destroy his own clan."\n\n'
          + 'When the report of the plot came in, Zhao took a hundred thousand to Chang\'an himself and sent Jia Chong with ten thousand into the Xie valley.\n\n'
          + 'Hui heard of it and said to his intimates: "For arresting Deng Ai alone, the Chancellor knows I can manage it by myself. Coming on this scale, he must have noticed something. We shall have to move quickly."\n\n'
          + 'On the eighteenth the army turned on him. Hui, Jiang Wei and Deng Ai all died within one month. And the realm became one.',
      },
      verdictZh:
        '論曰:昭之於會,知其才而用之,知其反而不禁 ——'
        + '所恃者,不在會之忠,在**眾將之思歸**。\n'
        + '故其用人也,不問其心,問其勢:'
        + '勢不可為,則雖有心而無用。\n'
        + '蜀既平,艾、會、維同月而死,'
        + '而司馬氏無一人污手 —— 二年之後,禪代成。',
      verdictEn:
        'The historian says: Zhao knew Zhong Hui\'s ability and used him, knew he would rebel and did not stop him — because what he relied on was not Hui\'s loyalty but the soldiers\' longing for home. So in employing men he did not ask about their hearts but about their circumstances: where the circumstances forbid it, the intention is worthless. Shu fell, and Deng Ai, Zhong Hui and Jiang Wei died in the same month, and no Sima had to dirty his hands. Two years later the succession passed.',
      verdictLostZh:
        '論曰:蜀之亡,亡於一冬;而收其亡者三人,'
        + '三人又相殺於一月 ——'
        + '天下之事,有時不必自為,待之而已。',
      verdictLostEn:
        'The historian says: Shu fell in a single winter, three men divided the credit for it, and within a month the three had destroyed one another. Some things in this world do not need doing; they need waiting for.',
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
