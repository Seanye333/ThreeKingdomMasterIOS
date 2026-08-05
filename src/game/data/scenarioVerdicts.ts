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
};

/** 取某盤某家的落幕文本;沒寫過就回 null(走通用結局)。 */
export function scenarioVerdict(
  scenarioId: string | null | undefined,
  forceId: EntityId | null | undefined,
): ScenarioVerdict | null {
  if (!scenarioId || !forceId) return null;
  return SCENARIO_VERDICTS[scenarioId]?.[forceId] ?? null;
}
