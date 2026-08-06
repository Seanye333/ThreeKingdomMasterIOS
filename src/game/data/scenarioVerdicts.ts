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
  /* ── 197 渤海戰線 ─────────────────────────────────────────────── */
  'scn-197-bohai': {
    cao: {
      defeat: {
        titleZh: '失不便取其質',
        titleEn: 'I Failed to Take Hostages',
        textZh:
          '南征張繡,繡舉眾降。既而悔之,復叛。'
          + '公與戰,軍敗,為流矢所中,'
          + '長子昂、弟子安民遇害。\n\n'
          + '典韋戰於門中,賊不得入。'
          + '韋被數十創,短兵接戰,手殺數人。'
          + '創重,發怒,瞋目大罵而死。\n\n'
          + '公至舞陰,謂諸將曰:「吾降張繡等,'
          + '失不便取其質,以至於此。吾知所以敗。'
          + '諸卿觀之,自今已後不復敗矣。」',
        textEn:
          'He campaigned south against Zhang Xiu, who surrendered his whole force — and then regretted it and revolted again. Cao Cao fought him and was beaten, hit by a stray arrow, and lost his eldest son Ang and his nephew Anmin.\n\n'
          + 'Dian Wei fought in the gateway and they could not get in. Wounded dozens of times, he closed to short weapons and killed several with his hands. When the wounds told he flew into a rage, glared and cursed them, and died.\n\n'
          + 'At Wuyin, Cao said to his officers: "I accepted Zhang Xiu\'s surrender and failed to take hostages from him, and this is where it has brought me. I know why I was beaten. Watch, gentlemen — from now on I shall not be beaten again."',
      },
      verdictZh:
        '論曰:宛城一敗,喪長子、愛將、良騎,'
        + '而操之言不及一恨字,只論其所以敗。\n'
        + '**敗而能自數其故者,天下無幾人** ——'
        + '割髮代首在明年,官渡在三年之後;'
        + '此一敗,實為其後二十年之學。\n'
        + '而張繡終復來降,操執其手,為子均娶其女 ——'
        + '殺子之讎而納之,亦非常人所能。',
      verdictEn:
        'The historian says: at Wan he lost his eldest son, his favourite guardsman and his best horse, and not a word of what he said afterwards was regret — only an account of why he had lost. Very few men can itemise their own defeat. Cutting off his hair in place of his head came the next year, Guandu three years later; that one defeat was the schooling for the next twenty. And Zhang Xiu did come over again in the end, and Cao took him by the hand and married his daughter to his own son — receiving the man who had killed his son, which is also not ordinary.',
      verdictLostZh:
        '論曰:操後行經襄邑,設祭於典韋墓,'
        + '下車哭之而後過。年年如此。',
      verdictLostEn:
        "The historian says: afterwards, whenever he passed Xiangyi, Cao set out an offering at Dian Wei's grave, got down from his carriage and wept before going on. Every year.",
    },
    'yuan-shu': {
      defeat: {
        titleZh: '代漢者當塗高',
        titleEn: 'He Who Replaces Han Stands High on the Road',
        textZh:
          '術以讖文云「代漢者,當塗高也」,'
          + '自以名字應之;又以袁氏出陳,為舜後,'
          + '以黃代赤,德運之次 —— 遂建號仲氏。\n\n'
          + '呂布斬其使韓胤,孫策以書絕之。'
          + '曹操南征,術棄軍走。\n\n'
          + '後士眾饑困,不能自立,'
          + '欲往青州就袁譚,道路不得過。\n\n'
          + '問廚下,尚有麥屑三十斛。'
          + '時盛暑,欲得蜜漿,又無蜜。'
          + '坐櫺床上,嘆息良久,乃大咤曰:'
          + '「袁術至於此乎!」因頓伏床下,'
          + '嘔血斗餘而死。',
        textEn:
          'Yuan Shu took the prophecy "he who replaces Han stands high on the road" to point at his own name, and made much of the Yuan family\'s descent from the sages of Chen and of yellow succeeding red in the sequence of the elements — and proclaimed the Zhong dynasty.\n\n'
          + 'Lü Bu beheaded his envoy Han Yin and Sun Ce broke with him by letter. Cao Cao came south and Shu abandoned his army and ran.\n\n'
          + 'Later his men were starving and he could not hold anything together, and tried to reach Yuan Tan in Qing province, and could not get through.\n\n'
          + 'He asked the kitchen what there was: thirty measures of barley husks. It was high summer and he wanted honey water, and there was no honey. He sat on the slatted couch, sighed a long while, and then cried out: "Has it come to this for Yuan Shu?" — pitched forward off the couch, vomited a gallon of blood and died.',
      },
      verdictZh:
        '論曰:術之稱帝,不因其強,因其信讖。\n'
        + '天下方以奉天子為名,而術獨自為天子 ——'
        + '**於是所有人都有了討伐他的理由**。\n'
        + '故其亡也,不待一戰:'
        + '呂布斬其使,孫策絕其書,'
        + '部曲自散,而後饑死於床下。',
      verdictEn:
        'The historian says: Yuan Shu declared himself emperor not because he was strong but because he believed a prophecy. Everyone else in the realm was operating in the emperor\'s name, and he alone became one — which handed every man in China a reason to attack him. So his end needed no battle: Lü Bu beheaded his envoy, Sun Ce broke with him in writing, his troops melted away, and he starved to death beside a couch.',
      verdictLostZh:
        '論曰:術之敗,人以為驕;而其實是**急** ——'
        + '諸雄皆知漢可代,而皆待其時;'
        + '術獨不待,遂為天下先亡者。',
      verdictLostEn:
        'The historian says: people call it arrogance; it was really impatience. Every warlord knew Han could be replaced and every one of them was waiting for the moment. Shu would not wait, and so he was the first of them to die.',
    },
    'lu-bu': {
      defeat: {
        titleZh: '轅門射戟',
        titleEn: 'The Halberd at the Gate',
        textZh:
          '術遣紀靈步騎三萬攻備,備求救於布。'
          + '諸將謂布曰:「將軍常欲殺備,今可假手於術。」\n\n'
          + '布曰:「不然。術若破備,則北連太山諸將,'
          + '吾為在術圍中,不得不救也。」\n\n'
          + '乃屯於城西南一里,請靈等與備會。'
          + '布令門候於營門中舉一隻戟,曰:'
          + '「諸君觀布射戟小支,一發中者諸君當解去,'
          + '不中可留決鬥。」\n\n'
          + '布舉弓射戟,正中小支。諸將皆驚,言「將軍天威也」。',
        textEn:
          'Yuan Shu sent Ji Ling with thirty thousand horse and foot against Liu Bei, and Bei asked Lü Bu for help. Bu\'s officers said: "You have always wanted Liu Bei dead. Now you can have Yuan Shu do it for you."\n\n'
          + 'Bu said: "No. If Shu destroys Bei he will link up with the Taishan commanders in the north and I shall be inside Shu\'s ring. I have to relieve him."\n\n'
          + 'So he camped a li southwest of the city and invited Ji Ling and Liu Bei to meet him. He had the gate-warden set a halberd upright in the camp entrance and said: "Gentlemen, watch me shoot at the small side-blade of that halberd. If I hit it with one arrow you will all break off and go; if I miss, stay and fight it out."\n\n'
          + 'Bu raised his bow and put the arrow through the small blade. His officers were astonished and said, "That is the general\'s heavenly power."',
      },
      verdictZh:
        '論曰:射戟一節,人皆以為戲;'
        + '而布之言最明:「術若破備,'
        + '則北連太山諸將,吾為在術圍中。」\n'
        + '——**這是呂布一生唯一一次算對了形勢**。\n'
        + '然其後仍與術通婚,又絕之;'
        + '襲劉備而奪徐州,終為曹操所擒。'
        + '知勢而不能守勢,與不知同。',
      verdictEn:
        'The historian says: everyone treats the halberd shot as a party trick, and Bu\'s reasoning was the clearest thing he ever said: "If Shu destroys Bei he will link up with the Taishan commanders and I shall be inside Shu\'s ring." It is the one time in his life Lü Bu read a situation correctly. And then he made a marriage alliance with Shu, and broke it; raided Liu Bei and took Xu province; and ended in Cao Cao\'s hands. To see the shape of things and be unable to hold to it is the same as not seeing it.',
      verdictLostZh:
        '論曰:陳登父子言於操曰:「養呂布,譬如養虎,'
        + '當飽其肉,不飽則將噬人。」'
        + '操曰:「不如卿言。譬如養鷹,飢即為用,飽則颺去。」',
      verdictLostEn:
        'The historian says: Chen Deng and his father said to Cao Cao: "Keeping Lü Bu is like keeping a tiger — he must be fed full on meat, and if he is not he will eat people." Cao said: "Not quite. It is like keeping a hawk. Hungry, it works for you; full, it flies away."',
    },
    'yuan-shao': {
      defeat: {
        titleZh: '四州之地',
        titleEn: 'Four Provinces',
        textZh:
          '你已據冀、青、并三州,'
          + '而幽州只剩易京一座樓。\n\n'
          + '沮授進言:「將軍弱冠登朝,則播名海內;'
          + '值廢立之際,則忠義奮發;'
          + '單騎出奔,則董卓懷怖;'
          + '濟河而北,則勃海稽首 ——'
          + '振一郡之卒,撮冀州之眾,'
          + '威震河朔,名重天下。\n'
          + '雖黃巾猾亂,黑山跋扈,舉軍東向,則青州可定;'
          + '還討黑山,則張燕可滅;'
          + '回眾北首,則公孫必喪;'
          + '震脅戎狄,則匈奴必從。\n'
          + '橫大河之北,合四州之地,'
          + '收英雄之才,擁百萬之眾 ——'
          + '迎大駕於西京,復宗廟於洛邑,'
          + '號令天下,以討未復,'
          + '以此爭鋒,誰能敵之!」\n\n'
          + '——四州之地,你都拿到了。'
          + '而迎大駕的是曹操。',
        textEn:
          'You already held Ji, Qing and Bing provinces, and all that was left of You province was one tower at Yijing.\n\n'
          + 'Ju Shou had laid it out for you: "Your Excellency entered court at twenty and your name went round the seas; at the crisis of the deposition your loyalty rose up; when you rode out alone Dong Zhuo was afraid of you; when you crossed the river north, Bohai bowed its head. With one commandery\'s troops you gathered the men of Ji province and your name weighed on the realm. Turn the army east and Qing province can be settled; turn back on the Black Mountain and Zhang Yan can be destroyed; face the army north and Gongsun must fall; overawe the tribes and the Xiongnu must follow. Lie across the north of the Yellow River, join four provinces, gather the talent of the age and a million men — then fetch the imperial carriage from the western capital, restore the ancestral temples at Luoyang, and issue orders to the realm to punish those who have not submitted. Contend on those terms, and who can stand against you?"\n\n'
          + 'You got the four provinces. Somebody else fetched the emperor.',
      },
      verdictZh:
        '論曰:沮授之策,一字不誤,而紹行其半 ——'
        + '取四州而不迎天子。\n'
        + '郭圖等言:「若迎天子以自近,'
        + '動輒表聞,從之則權輕,違之則拒命。」'
        + '紹以為然。\n'
        + '**以權輕為患者,終無權** ——'
        + '三年之後,曹操以天子詔書責紹,'
        + '紹上書自訟而已。',
      verdictEn:
        'The historian says: Ju Shou\'s plan was correct in every particular and Shao carried out half of it — he took the four provinces and did not fetch the emperor. Guo Tu and others argued: "Bring the emperor close and every move has to be reported. Obey him and our authority shrinks; disobey and we are refusing an imperial order." Shao thought they were right. A man who fears his authority shrinking ends with no authority: three years later Cao Cao rebuked him by imperial edict, and all Shao could do was submit a memorial in his own defence.',
      verdictLostZh:
        '論曰:紹之所有,皆沮授所畫;'
        + '而授終以諫死於官渡之後。'
        + '**用其策而不用其人**,河北之亡在此。',
      verdictLostEn:
        'The historian says: everything Yuan Shao had, Ju Shou had drawn for him, and Ju Shou died after Guandu for remonstrating. Use the plan and not the man — that is how Hebei was lost.',
    },
  },
  /* ── 207 三顧茅廬 ─────────────────────────────────────────────── */
  'scn-207-three-visits': {
    'liu-biao': {
      defeat: {
        titleZh: '不用玄德之言',
        titleEn: 'I Did Not Take Xuande\'s Advice',
        textZh:
          '曹公北征烏丸,劉備說表襲許,表不能用。\n\n'
          + '公之南征也,表病篤。'
          + '謂備曰:「我兒不才,而諸將並零落,'
          + '我死之後,卿便攝荊州。」\n\n'
          + '備曰:「諸子自賢,君其憂病。」\n\n'
          + '表既卒,琮舉州降。備曰:'
          + '「吾不忍也。」乃過辭表墓,涕泣而去。\n\n'
          + '——荊州帶甲十萬,一日而屬人。',
        textEn:
          'While Cao Cao was north against the Wuhuan, Liu Bei urged Liu Biao to strike at Xu, and Biao could not bring himself to do it.\n\n'
          + 'When Cao came south, Biao was gravely ill. He said to Bei: "My son has no ability and my commanders are all gone or falling away. After I die, take Jing province yourself."\n\n'
          + 'And Bei said: "Your sons are able enough. Trouble yourself about your illness."\n\n'
          + 'When Biao died, Cong surrendered the province. Bei said: "I cannot bring myself to do it," and stopped at Biao\'s grave to take his leave, and went away weeping.\n\n'
          + 'A hundred thousand men under arms in Jing province, and in one day it belonged to somebody else.',
      },
      verdictZh:
        '論曰:表據荊州二十年,'
        + '地方數千里,帶甲十餘萬,'
        + '而終無所為 ——\n'
        + '非不能戰,是**不肯決**:'
        + '袁曹相持而不助,劉備請襲而不許,'
        + '欲觀天下之變,而天下之變不待人觀。\n'
        + '故其國不亡於兵,亡於一紙降書。',
      verdictEn:
        'The historian says: Liu Biao held Jing province for twenty years, several thousand li of country and over a hundred thousand men under arms, and did nothing with it. Not that he could not fight — he would not decide. He helped neither side while Yuan and Cao were locked together, and refused Liu Bei\'s raid, wanting to watch how the realm turned out. The realm does not wait to be watched. So his state fell not to an army but to one letter of surrender.',
      verdictLostZh:
        '論曰:表之未死也,備嘗於坐間起至廁,'
        + '見髀裡肉生,慨然流涕。'
        + '表怪問備,備曰:「吾常身不離鞍,髀肉皆消。'
        + '今不復騎,髀裡肉生。日月若馳,老將至矣,'
        + '而功業不建,是以悲耳。」',
      verdictLostEn:
        'The historian says: while Biao was still alive, Liu Bei got up from the table one day and went out, and seeing the flesh grown on his thighs, wept. Biao asked what was wrong, and Bei said: "I used never to be out of the saddle and the flesh was all worn off my thighs. Now I do not ride, and it has grown back. The days and months run on and age is coming, and nothing has been achieved. That is why I am sad."',
    },
    cao: {
      defeat: {
        titleZh: '緩之則自相圖',
        titleEn: 'Go Slowly and They Will Turn on Each Other',
        textZh:
          '袁尚、袁熙奔遼東,眾尚有數千騎。'
          + '諸將皆曰:「今不因而伐之,後必為患。」\n\n'
          + '公曰:「吾方使康斬送尚、熙首,不煩兵矣。」'
          + '九月,引兵自柳城還。康即斬尚、熙,傳其首。\n\n'
          + '諸將或問:「公還而康斬送尚、熙,何也?」\n\n'
          + '公曰:「彼素畏尚等,吾急之則並力,'
          + '緩之則自相圖,其勢然也。」\n\n'
          + '——是歲,郭嘉卒於柳城,年三十八。',
        textEn:
          'Yuan Shang and Yuan Xi fled to Liaodong with some thousands of horse still. The generals all said: "If we do not go after them now they will be trouble later."\n\n'
          + 'And Cao said: "I am about to have Gongsun Kang behead them and send the heads. No troops required." In the ninth month he brought the army back from Liucheng, and Kang beheaded them at once and forwarded the heads.\n\n'
          + 'One of the officers asked: "You came away, and Kang killed them and sent the heads. Why?"\n\n'
          + 'And Cao said: "He has always been afraid of the Yuans. Press them and they combine; leave them alone and they turn on each other. It follows from the situation."\n\n'
          + 'That year Guo Jia died at Liucheng, aged thirty-eight.',
      },
      verdictZh:
        '論曰:「急之則並力,緩之則自相圖」——'
        + '此一語可蔽操之用兵。\n'
        + '**外壓所以合人,去壓所以離人**:'
        + '袁譚袁尚之相攻,公孫康之斬尚,'
        + '皆同一理。\n'
        + '然明年赤壁,操以八十萬臨江,'
        + '孫劉本仇,乃因此而合 —— '
        + '同一理,反用於己。',
      verdictEn:
        'The historian says: "Press them and they combine; leave them alone and they turn on each other" — that one line covers the whole of Cao Cao\'s art. Outside pressure joins men together and removing it drives them apart: the Yuan brothers fighting each other, Gongsun Kang beheading Shang, all the same principle. And the next year at Red Cliffs he came down to the river with eight hundred thousand, and Sun and Liu, who had every reason to hate each other, joined together because of it. The same principle, applied to him.',
      verdictLostZh:
        '論曰:嘉臨終,操曰:「諸君年皆孤輩也,'
        + '唯奉孝最少。天下事竟,欲以後事屬之,'
        + '而中年夭折,命也夫!」',
      verdictLostEn:
        'The historian says: at Guo Jia\'s death Cao said: "You gentlemen are all of my own generation; only Fengxiao was much younger. When the business of the realm was finished I meant to hand what came after to him. And he is dead in his middle years. Well — it is fate."',
    },
    sun: {
      defeat: {
        titleZh: '西勢',
        titleEn: 'The Western Leverage',
        textZh:
          '甘寧陳計曰:「今漢祚日微,曹操彌憍,終為篡盜。'
          + '南荊之地,山陵形便,江川流通,'
          + '誠是國之西勢也。\n'
          + '寧已觀劉表,慮既不遠,兒子又劣,'
          + '非能承業傳基者也。\n'
          + '至尊當早規之,不可後操。\n'
          + '圖之之計,宜先取黃祖。'
          + '祖今年老,昏耄已甚,財穀並乏,'
          + '左右欺弄,務於貨利,'
          + '侵求吏士,吏士心怨,'
          + '舟船戰具,頓廢不修 ——'
          + '至尊今往,其破可必。」\n\n'
          + '權深納之。',
        textEn:
          'Gan Ning laid out his plan: "The fortune of Han fades daily and Cao Cao grows more overbearing; he will end by usurping. The land of southern Jing has hills that suit us and rivers that connect — it is the western leverage of this state.\n\n'
          + 'I have looked Liu Biao over. He does not see far and his sons are poor stuff; he is not a man to hand an inheritance on.\n\n'
          + 'Your Lordship should plan for it early and not be behind Cao Cao.\n\n'
          + 'And the way to plan for it is to take Huang Zu first. Zu is old now and very far gone, short of money and grain, cheated by his own people, taken up with profit and squeezing his officers and men, so that they resent him, while the ships and the fighting gear lie neglected and unrepaired. Go now and his defeat is certain."\n\n'
          + 'And Sun Quan took it deeply to heart.',
      },
      verdictZh:
        '論曰:江東之圖荊州,自甘寧此策始,'
        + '至呂蒙白衣渡江而成,凡十三年。\n'
        + '**其所以能久者,以其所欲者一** ——'
        + '孫氏三世,所爭無非上游一線:'
        + '得之則建業安,不得則建業為敵之下流。\n'
        + '故赤壁可以合劉,而荊州終不可以與劉。',
      verdictEn:
        'The historian says: the southeast\'s design on Jing province began with this plan of Gan Ning\'s and was completed thirteen years later when Lü Meng crossed in white clothes. It lasted because they only ever wanted one thing. Three generations of Suns fought over nothing but the upper river: hold it and Jianye is safe; lose it and Jianye sits downstream of an enemy. Which is why they could ally with Liu Bei at Red Cliffs and could never leave Jing province in his hands.',
      verdictLostZh:
        '論曰:寧,巴郡人,少為輕俠,'
        + '止則接輕俠,遊則鈴鈴有聲 ——'
        + '所過皆知「錦帆賊」至。'
        + '而其獻策乃有國士之慮。**人不可以其少時定**。',
      verdictLostEn:
        'The historian says: Gan Ning came from Ba commandery and ran with bravos in his youth; when he stopped somewhere the bravos gathered, and when he travelled there were bells ringing, so everywhere he passed knew the Brocade-Sail bandit had come. And the plan he offered is the thinking of a statesman. You cannot judge a man by what he was young.',
    },
    'gongsun-du': {
      defeat: {
        titleZh: '斬首而送之',
        titleEn: 'Behead Them and Send the Heads',
        textZh:
          '袁尚、袁熙來奔,眾尚數千騎。\n\n'
          + '初,你聞曹操北征,恐其襲己,'
          + '欲與尚等併力拒之。\n\n'
          + '而操引兵還。'
          + '——於是你先埋伏精勇於馬廄之中,'
          + '然後請尚、熙入,未及坐,'
          + '叱伏兵禽之,坐於凍地。\n\n'
          + '尚曰:「未死之間,寒不可忍,'
          + '可相與席乎?」\n'
          + '康曰:「卿頭顱方行萬里,何席之為!」\n\n'
          + '遂斬之。',
        textEn:
          'Yuan Shang and Yuan Xi came to you as fugitives, still with some thousands of horse.\n\n'
          + 'At first, hearing that Cao Cao was campaigning north, you were afraid he would come for you and thought of joining the Yuans to resist him.\n\n'
          + 'And then Cao took his army home.\n\n'
          + 'So you put picked men in the stables, invited Shang and Xi in, and before they could sit down called the ambush out and had them seized and set down on the frozen ground.\n\n'
          + 'Shang said: "Since we are not dead yet — the cold is past bearing. Might we have a mat between us?"\n\n'
          + 'And Kang said: "Your skulls are about to travel ten thousand li. What do you want with a mat?"\n\n'
          + 'And beheaded them.',
      },
      verdictZh:
        '論曰:康之斬尚,非忠於魏,是畏於魏 ——'
        + '而操之不攻,正為使其畏。\n'
        + '**遼東之存,存於中原之無暇**:'
        + '故公孫氏三世據之,'
        + '而終於司馬懿一征而滅。\n'
        + '塞外之國,其命不在己,在關內誰當國。',
      verdictEn:
        'The historian says: Gongsun Kang beheaded the Yuans not out of loyalty to Wei but out of fear of it — and Cao Cao\'s refusal to attack was exactly what produced the fear. Liaodong survived because the central plain had no time for it. Three generations of the Gongsun family held it, and one campaign by Sima Yi finished it. A frontier state\'s life is not in its own hands but in the question of who is running things inside the passes.',
      verdictLostZh:
        '論曰:尚、熙之來,挾數千騎;'
        + '而康懼其為變,先發制之。'
        + '**亡人不可久寄**:'
        + '客大於主,則主必殺客。',
      verdictLostEn:
        'The historian says: the Yuans arrived with thousands of horsemen, and Kang, afraid of what they might do, moved first. A fugitive cannot lodge anywhere long: when the guest is larger than the host, the host kills the guest.',
    },
  },
  /* ── 221 蜀漢建國 ─────────────────────────────────────────────── */
  'scn-221-shu-emperor': {
    'liu-bei': {
      defeat: {
        titleZh: '即皇帝位於武擔之南',
        titleEn: 'Enthroned South of Wudan',
        textZh:
          '曹丕稱尊號,或傳言漢帝見害。'
          + '於是備發喪制服,追諡曰孝愍皇帝。\n\n'
          + '群下上言宜即尊號 —— 備乃即皇帝位於成都武擔之南,'
          + '大赦,改年為章武。\n\n'
          + '而是歲六月,張飛為其帳下將張達、范彊所害。'
          + '飛營都督有表 —— 備聞飛都督之有表也,'
          + '曰:「噫!飛死矣。」\n\n'
          + '七月,親率諸軍伐吳。'
          + '趙雲諫曰:「國賊是曹操,非孫權也。'
          + '且先滅魏,則吳自服。'
          + '不應置魏,先與吳戰;兵勢一交,不得卒解也。」\n\n'
          + '備不聽。',
        textEn:
          'Cao Pi took the imperial title, and a rumour ran that the Han emperor had been murdered. So Liu Bei went into mourning and gave him the posthumous name Xiaomin.\n\n'
          + 'His officers urged him to take the title himself — and he was enthroned south of Wudan at Chengdu, proclaimed an amnesty, and changed the reign-name to Zhangwu.\n\n'
          + 'And in the sixth month of that year Zhang Fei was murdered by two of his own officers, Zhang Da and Fan Qiang. A memorial came in from the supervisor of Fei\'s camp — and hearing that it was from the supervisor and not from Fei, Bei said: "Ah. Fei is dead."\n\n'
          + 'In the seventh month he led the army against Wu in person. Zhao Yun remonstrated: "The enemy of the state is Cao Cao, not Sun Quan. Destroy Wei first and Wu will submit of itself. We should not set Wei aside and fight Wu; once the armies are engaged it cannot be broken off quickly."\n\n'
          + 'Bei did not listen.',
      },
      verdictZh:
        '論曰:章武之立,名為繼漢,實為報讎。\n'
        + '**一國之號可以繼,而一國之勢不可以憤取** ——'
        + '雲之言,亮不能爭,秦宓以言下獄;'
        + '明年猇亭一炬,蜀之精銳盡於彝陵之道。\n'
        + '然備托孤白帝,曰:「若嗣子可輔,輔之;'
        + '如其不才,君可自取。」'
        + '——**敗至於此,而國不亂**,亦足以立矣。',
      verdictEn:
        'The historian says: the Zhangwu enthronement was called a continuation of Han and was really a revenge. A dynasty\'s name can be inherited; a state\'s position cannot be seized in anger. Zhuge Liang could not argue against Zhao Yun\'s point, and Qin Mi went to prison for making it; the next year one fire at Xiaoting consumed the best of Shu along the Yiling road. And yet at Baidi, entrusting his son, Bei said: "If the heir is worth supporting, support him; if he has no ability, take it yourself." To be beaten that badly and leave the state unshaken is itself an achievement.',
      verdictLostZh:
        '論曰:章武三年,亮上言:「先帝知臣謹慎,'
        + '故臨崩寄臣以大事也。」'
        + '——蜀之所恃,不在其君之能,在其臣之不欺。',
      verdictLostEn:
        'The historian says: in the third year of Zhangwu, Zhuge Liang wrote: "The late Emperor knew that I was careful, and so on his deathbed he entrusted me with the great affair." What Shu rested on was not the ability of its sovereign but the fact that its minister did not cheat him.',
    },
    cao: {
      defeat: {
        titleZh: '舜禹之事,吾知之矣',
        titleEn: 'Now I Know About Shun and Yu',
        textZh:
          '漢帝以眾望在魏,乃召群公卿士,'
          + '告祠高廟,使兼御史大夫張音持節奉璽綬詔冊,'
          + '禪位於魏。\n\n'
          + '王三讓,乃受。'
          + '築壇於繁陽,燎祭天地、五岳、四瀆。\n\n'
          + '禮畢,顧謂群臣曰:'
          + '「舜、禹之事,吾知之矣。」\n\n'
          + '——封山陽公,邑一萬戶,'
          + '位在諸侯王上,奏事不稱臣,'
          + '受詔不拜,以天子車服郊祀天地。',
        textEn:
          'Since the wishes of the realm lay with Wei, the Han emperor called his ministers together, made announcement at the ancestral temple, and sent the acting Grandee Secretary Zhang Yin with the seals and cords and the edict of abdication.\n\n'
          + 'The King declined three times and then accepted. An altar was raised at Fanyang and burnt offerings made to Heaven and Earth, the five peaks and the four rivers.\n\n'
          + 'When the ceremony was over he turned to his officials and said: "Now I know about Shun and Yu."\n\n'
          + 'The former emperor was made Duke of Shanyang with a fief of ten thousand households, ranked above the kings, permitted not to call himself a subject in memorials, not to bow when receiving an edict, and to sacrifice to Heaven and Earth in the imperial carriage and robes.',
      },
      verdictZh:
        '論曰:「舜禹之事,吾知之矣」——'
        + '此一語道破四百年之禪讓文章。\n'
        + '然其待山陽公之厚,亦四百年所無:'
        + '**篡而不殺,自丕始;'
        + '而後之篡者,皆循其例** ——'
        + '故司馬氏之於曹奐,亦如是。\n'
        + '天下之禮,有時由最不敬者所立。',
      verdictEn:
        'The historian says: "Now I know about Shun and Yu" — one sentence goes through four hundred years of abdication literature. And his treatment of the Duke of Shanyang was more generous than anything in those four hundred years. Usurping without killing began with Cao Pi, and every usurper after him followed the precedent — the Simas treated Cao Huan the same way. Sometimes the observances of an age are established by the man with least reverence for them.',
      verdictLostZh:
        '論曰:魏之立國四十五年,而權移於臣者三十年。'
        + '丕黜諸侯王,防宗室如防賊,'
        + '及高平陵之變,無一人可援 ——'
        + '**防其所親,而失其所恃**。',
      verdictLostEn:
        'The historian says: Wei lasted forty-five years and for thirty of them power was in a subject\'s hands. Cao Pi cut down the imperial kings and guarded against his own clan as against bandits, and when the coup at Gaoping Tombs came there was nobody to call on. Guard against your own kin and you lose what holds you up.',
    },
    sun: {
      defeat: {
        titleZh: '屈身於陛下',
        titleEn: 'Bending to Your Majesty',
        textZh:
          '劉備稱帝,將東伐。'
          + '你遣使稱藩於魏,卑辭奉章,'
          + '並送于禁等還。\n\n'
          + '魏群臣皆賀,劉曄獨曰:'
          + '「權無故求降,必內有急。'
          + '今天下三分,中國十有其八。'
          + '吳、蜀各保一州…宜大興師,'
          + '徑渡江襲之。蜀攻其外,我襲其內,'
          + '吳之亡不出旬月矣。」\n\n'
          + '丕不從,受權降,拜為吳王。\n\n'
          + '——明年陸遜破備於猇亭。'
          + '又明年,魏三路伐吳,無功而還。',
        textEn:
          'Liu Bei took the imperial title and prepared to come east. You sent an envoy to Wei declaring yourself a vassal, with a humble memorial, and returned Yu Jin and the other prisoners.\n\n'
          + 'The Wei court all offered congratulations, and Liu Ye alone said: "Sun Quan asks to submit for no reason; there must be something urgent at home. The realm is in three parts and the middle kingdom holds eight tenths of it. Wu and Shu each hold one province... We should raise a great army, cross the river directly and strike him. Shu attacks his outside and we strike his inside, and Wu is finished within the month."\n\n'
          + 'Cao Pi would not have it; he accepted the submission and made Quan King of Wu.\n\n'
          + 'The next year Lu Xun broke Liu Bei at Xiaoting. The year after, Wei came at Wu along three roads and went home with nothing.',
      },
      verdictZh:
        '論曰:權之稱藩,不以其弱,以其**能弱** ——'
        + '一歲之間,北面事魏而西破蜀軍;'
        + '既破之,則不復稱藩。\n'
        + '劉曄之言,一字不誤,而丕以「人稱臣而伐之,'
        + '疑天下欲來者之心」拒之。\n'
        + '**惜名者失時**:'
        + '三國之勢,遂定於此一年。',
      verdictEn:
        'The historian says: Sun Quan submitted not because he was weak but because he was capable of being weak. Within a single year he faced north as a vassal of Wei and broke the Shu army in the west; and having broken it he stopped being a vassal. Every word of Liu Ye\'s advice was right, and Cao Pi refused it on the ground that attacking a man who has declared himself a subject would make anyone else hesitate to come in. A ruler who is careful of his good name misses his moment. The three-way balance was settled in that one year.',
      verdictLostZh:
        '論曰:趙咨使魏,丕問:「吳王何等主也?」'
        + '對曰:「聰明仁智,雄略之主也。」'
        + '丕問其狀,咨曰:「納魯肅於凡品,是其聰也;'
        + '拔呂蒙於行陣,是其明也;'
        + '獲于禁而不害,是其仁也;'
        + '取荊州而兵不血刃,是其智也;'
        + '據三州虎視於天下,是其雄也;'
        + '屈身於陛下,是其略也。」',
      verdictLostEn:
        'The historian says: when Zhao Zi went as envoy to Wei, Cao Pi asked, "What sort of ruler is the King of Wu?" He replied: "A shrewd, clear-sighted, humane and wise one, and a ruler of great designs." Asked for particulars, Zi said: "He took Lu Su out of the common run — that is shrewdness. He raised Lü Meng out of the ranks — that is clear sight. He captured Yu Jin and did not harm him — that is humanity. He took Jing province without bloodying a blade — that is wisdom. He holds three provinces and looks out on the realm like a tiger — that is greatness. And he bends to Your Majesty — that is design."',
    },
  },
  /* ── 228 石亭之戰 ─────────────────────────────────────────────── */
  'scn-228-shiting': {
    sun: {
      defeat: {
        titleZh: '割髮謝罪',
        titleEn: 'He Cut His Hair to Apologise',
        textZh:
          '周魴密表:「求以譎計挾誘曹休。」'
          + '權敕魴詐為郡中人所白,'
          + '被詰讓,因懼自嫌,'
          + '遣親人齎箋七條以誘休。\n\n'
          + '而休猶未信 —— 郡吏數詣門下,'
          + '魴乃詣門下,**割髮謝罪**。\n\n'
          + '休遂信之,率步騎十萬向皖。\n\n'
          + '陸遜為大都督,朱桓、全琮為左右督,'
          + '各督三萬人。'
          + '大破休於石亭,斬獲萬餘,'
          + '牛馬騾驢車乘萬兩,軍資器械略盡。',
        textEn:
          'Zhou Fang sent a secret memorial asking leave to lure Cao Xiu by a trick. Sun Quan had him pretend to have been denounced by people in his own commandery, called to account, and so frightened and under suspicion that he sent a confidant with seven articles of proposals to draw Xiu in.\n\n'
          + 'And Xiu still did not believe it — until, with commandery clerks repeatedly summoned to his gate, Zhou Fang went to the gate and cut off his hair in apology.\n\n'
          + 'Then Xiu believed him, and moved on Wan with a hundred thousand horse and foot.\n\n'
          + 'Lu Xun was Grand Commander with Zhu Huan and Quan Cong as commanders of left and right, thirty thousand each. They broke Xiu at Shiting, killed and captured over ten thousand, and took ten thousand carts, oxen, horses, mules and asses, and nearly all his stores and equipment.',
      },
      verdictZh:
        '論曰:魴之詐,以髮為信 ——'
        + '**身體髮膚,受之父母**,'
        + '故割之而人信;'
        + '而其所以能割者,正因人皆知其不可割。\n'
        + '朱桓請斷夾石、掛車以絕其歸路,'
        + '曰「休可生虜」,權不許 ——'
        + '於是石亭之捷止於一勝,'
        + '而魏之淮南如故。',
      verdictEn:
        'The historian says: Zhou Fang\'s deception was guaranteed with his hair — body, hair and skin are what one\'s parents gave one, so cutting it convinces people; and it convinces precisely because everyone knows it must not be cut. Zhu Huan asked to cut the Jiashi and Guache roads and close the line of retreat, saying "Xiu can be taken alive", and Sun Quan refused. So Shiting stayed a victory and nothing more, and Wei\'s Huainan was where it had been.',
      verdictLostZh:
        '論曰:是歲蜀出祁山,吳破石亭,'
        + '東西並舉,魏之最危一年也。'
        + '而街亭一失,兩路遂不相及 ——'
        + '**同盟之難,難在同時**。',
      verdictLostEn:
        'The historian says: that year Shu came out at Qishan and Wu broke Cao Xiu at Shiting — east and west rising together, the most dangerous year Wei had. And Jieting was lost, and the two efforts never met. The hard part of an alliance is simultaneity.',
    },
    cao: {
      defeat: {
        titleZh: '休雖明果而希用兵',
        titleEn: 'Bright and Decisive, and Seldom in the Field',
        textZh:
          '蔣濟表曰:「深入虜地,與權精兵對,'
          + '而朱然等在上流,乘休後,'
          + '臣未見其利也。」\n\n'
          + '休深入虜地,與賊相遇,'
          + '賊斷夾石,兵敗於石亭 ——'
          + '賴賈逵至,賊乃退。\n\n'
          + '休不悅,表逵稽留。'
          + '逵曰:「本為國家作豫州刺史,'
          + '不是為曹休作長史也。」\n\n'
          + '休還,以敗軍慚憤,疽發背薨。',
        textEn:
          'Jiang Ji memorialised: "To go deep into enemy country against Sun Quan\'s best troops, with Zhu Ran and the others upstream ready to come in behind Cao Xiu — I cannot see the advantage in it."\n\n'
          + 'Xiu went deep in, met the enemy, had the Jiashi road cut behind him, and was beaten at Shiting — and got away only because Jia Kui arrived, at which the enemy withdrew.\n\n'
          + 'Xiu was not pleased and impeached Kui for arriving late. Kui said: "I was made Inspector of Yu province for the state. I was not made chief clerk to Cao Xiu."\n\n'
          + 'Xiu went home, sick with shame and rage at the defeat, and died of a carbuncle on his back.',
      },
      verdictZh:
        '論曰:明帝之世,魏三面受敵而不亡,'
        + '所恃者一句:**守而不出,以待其弊**。\n'
        + '孫資之言:「但以現有之兵,分命大將據諸要險,'
        + '威足以震攝彊寇,鎮靜疆埸,'
        + '將士虎睡,百姓無事。」\n'
        + '休不守此,遂有石亭;'
        + '曹爽不守此,遂有興勢。\n'
        + '——魏之敗,皆敗於欲有所立。',
      verdictEn:
        'The historian says: under Emperor Ming, Wei faced enemies on three sides and did not fall, on one principle: hold and do not go out, and wait for them to wear themselves down. As Sun Zi put it: "With the troops we have, assign our great commanders to the key positions. Our weight will be enough to overawe strong enemies and keep the frontier quiet; the soldiers sleep like tigers and the people are undisturbed." Cao Xiu departed from it and got Shiting; Cao Shuang departed from it and got Xingshi. Wei\'s defeats were all defeats of men wanting to make a name.',
      verdictLostZh:
        '論曰:逵之至,休得不沒。'
        + '而休表逵稽留,逵不為屈。'
        + '——**救人者見責,此軍中所以無人肯救**。',
      verdictLostEn:
        'The historian says: Jia Kui\'s arrival was the only reason Cao Xiu was not destroyed, and Xiu impeached him for arriving late, and Kui would not give way. When the man who comes to the rescue is the one who gets blamed, that is why nobody in an army wants to be the rescuer.',
    },
    'liu-bei': {
      defeat: {
        titleZh: '此病不在兵少',
        titleEn: 'The Trouble Was Not Too Few Men',
        textZh:
          '亮身率諸軍攻祁山,戎陣整齊,賞罰肅而號令明,'
          + '南安、天水、安定三郡叛魏應亮,關中響震。\n\n'
          + '而亮違眾拔謖,統大眾在前,'
          + '與魏將張郃戰於街亭。'
          + '謖違亮節度,舉措煩擾,'
          + '舍水上山,不下據城 ——'
          + '郃絕其汲道,大破之。\n\n'
          + '亮拔西縣千餘家還漢中,戮謖以謝眾。\n\n'
          + '上疏曰:「大軍在祁山、箕谷,皆多於賊,'
          + '而不能破賊為賊所破者,'
          + '則此病不在兵少也,在一人耳。」'
          + '——請自貶三等。',
        textEn:
          'Zhuge Liang led the armies against Qishan in person, in good order, with strict rewards and punishments and clear orders, and three commanderies — Nan\'an, Tianshui and Anding — revolted from Wei and declared for him, and Guanzhong rang with it.\n\n'
          + 'And then, against everyone\'s advice, he promoted Ma Su to command the van, and Su fought Zhang He of Wei at Jieting. Su departed from Liang\'s instructions, fussed and interfered, camped on the hill away from the water instead of holding the town below — and He cut his access to water and broke him.\n\n'
          + 'Liang took a thousand-odd households from Xi county back to Hanzhong with him, and executed Ma Su to answer for it to the army.\n\n'
          + 'His memorial said: "Our armies at Qishan and at Jigu were both larger than the enemy\'s, and they could not beat the enemy and were beaten by him. The trouble here is not too few soldiers. It is one man." And he asked to be demoted three grades.',
      },
      verdictZh:
        '論曰:街亭之失,亮自任其咎,'
        + '不言謖之違節度,而言己之違眾拔謖 ——'
        + '**罪在用人者,不在被用者**,'
        + '此一疏,蜀之法度所由立。\n'
        + '故其後歲歲出兵而國不怨,'
        + '兵敗將誅而眾不叛:'
        + '賞罰之信,勝於一城之得失。',
      verdictEn:
        'The historian says: Zhuge Liang took the blame for Jieting himself, saying nothing about Ma Su departing from orders and everything about his own promoting Su against all advice. The fault lies with whoever appointed the man, not with the man appointed — and that memorial is the foundation of Shu\'s discipline. Which is why he could campaign year after year without the country resenting it, and lose battles and execute commanders without the army mutinying. Certainty in reward and punishment is worth more than the possession of a city.',
      verdictLostZh:
        '論曰:是歲十二月,亮復出散關,圍陳倉,'
        + '郝昭拒之二十餘日,糧盡而還,斬王雙。'
        + '——一年再出,不為其能勝,為其**不得不出**:'
        + '以一州之力抗九州,守則坐斃。',
      verdictLostEn:
        'The historian says: in the twelfth month of that year he came out again by Sanguan and invested Chencang; Hao Zhao held him twenty-odd days, his grain ran out and he went back, killing Wang Shuang on the way. Twice out in one year, not because he expected to win but because he had to: with one province against nine, sitting still is dying slowly.',
    },
  },
  /* ── 229 三帝鼎立 ─────────────────────────────────────────────── */
  'scn-229-three-emperors': {
    sun: {
      defeat: {
        titleZh: '中分天下',
        titleEn: 'The Realm Halved by Treaty',
        textZh:
          '夏四月,你即皇帝位於武昌,大赦,改元黃龍。\n\n'
          + '蜀遣衛尉陳震來賀 —— 乃與蜀盟,約:'
          + '中分天下,豫、青、徐、幽屬吳,'
          + '兗、冀、并、涼屬蜀,'
          + '其司州之土,以函谷關為界。\n\n'
          + '盟文曰:「若有害漢,則吳伐之;'
          + '若有害吳,則漢伐之。'
          + '各守分土,無相侵犯。」\n\n'
          + '——所分者,兩家皆未有之地。\n\n'
          + '秋九月,遷都建業。',
        textEn:
          'In the fourth month of summer you were enthroned as emperor at Wuchang, proclaimed an amnesty and changed the reign-name to Huanglong.\n\n'
          + 'Shu sent the Guard Commandant Chen Zhen to congratulate you — and a treaty was made with Shu dividing the realm in half: Yu, Qing, Xu and You provinces to Wu; Yan, Ji, Bing and Liang to Shu; and the territory of Si province divided at the Hangu pass.\n\n'
          + 'The text ran: "If any harm Han, Wu shall punish them; if any harm Wu, Han shall punish them. Each shall keep to its allotted land and neither shall encroach on the other."\n\n'
          + 'What they divided, neither of them owned.\n\n'
          + 'In the ninth month of autumn the capital moved to Jianye.',
      },
      verdictZh:
        '論曰:中分天下之盟,分的是魏土 ——'
        + '兩家所共有者,惟一敵而已。\n'
        + '**盟以敵為本,故敵在則盟固**:'
        + '此盟立三十年不變,'
        + '三國之中,惟此一約始終未廢。\n'
        + '而其所以未廢,亦正因兩家終身不能取其所分。',
      verdictEn:
        'The historian says: the treaty halving the realm divided Wei\'s territory. The only thing the two of them held in common was an enemy. A treaty founded on an enemy holds as long as the enemy does — this one stood unchanged for thirty years, the one agreement in the whole three-kingdoms period that was never broken. And it was never broken partly because neither party was ever able to take the land it had been allotted.',
      verdictLostZh:
        '論曰:蜀人或以為宜顯明正義,絕其盟好。'
        + '亮曰:「權有僭逆之心久矣。'
        + '國家所以略其釁情者,求掎角之援也。'
        + '若就其不動而睦於我,我之北伐,無東顧之憂,'
        + '河南之眾不得盡西,此之為利,亦已深矣。」',
      verdictLostEn:
        'The historian says: some in Shu held that they should declare the principle openly and break off the alliance. Zhuge Liang said: "Sun Quan has had usurping designs for a long time. The reason the state overlooks the offence is that we want a partner at the other horn. If he stays where he is and stays friendly with us, our northern campaigns have nothing to fear from the east and the troops south of the Yellow River cannot all go west. The advantage in that is very deep."',
    },
    'liu-bei': {
      defeat: {
        titleZh: '掎角之援',
        titleEn: 'A Partner at the Other Horn',
        textZh:
          '孫權稱尊號,遣使告蜀。'
          + '蜀之議者咸以為交之無益,而名體弗順,'
          + '宜顯明正義,絕其盟好。\n\n'
          + '亮曰:「權有僭逆之心久矣。'
          + '國家所以略其釁情者,求掎角之援也。\n'
          + '今若加顯絕,讎我必深,'
          + '便當移兵東伐,與之角力,'
          + '須並其土,乃議中原。\n'
          + '彼賢才尚多,將相輯睦,'
          + '未可一朝定也。」\n\n'
          + '乃遣陳震賀權踐位。\n\n'
          + '是歲,亮遣陳式攻武都、陰平,遂克定二郡。'
          + '詔復亮丞相。',
        textEn:
          'Sun Quan took the imperial title and sent word to Shu. The debate at Chengdu was unanimous that there was nothing to be got from the connection and that it offended propriety, and that Shu should declare the principle openly and break off the alliance.\n\n'
          + 'Zhuge Liang said: "Sun Quan has had usurping designs a long time. The reason the state overlooks the offence is that we want a partner at the other horn.\n\n'
          + 'Break with him openly now, and his hatred of us will run deep, and we shall have to move the army east and match strength with him, and shall have to absorb his territory before we can talk about the central plain.\n\n'
          + 'He still has plenty of able men and his ministers and commanders are on good terms. It is not a thing to be settled in a morning."\n\n'
          + 'So Chen Zhen was sent to congratulate Quan on his accession.\n\n'
          + 'That year Chen Shi was sent against Wudu and Yinping, and both commanderies were taken. An edict restored Liang to the chancellorship.',
      },
      verdictZh:
        '論曰:漢賊不兩立,而蜀賀吳僭 ——'
        + '此蜀立國以來最大之屈。\n'
        + '而亮為之,不諱其屈,只論其利:'
        + '「須並其土,乃議中原」八字,'
        + '是把整件事算到底之後的結論。\n'
        + '**能守名者未必能存國;'
        + '能存國者,必先算得清哪一種名可以不要**。',
      verdictEn:
        'The historian says: Han and the usurper cannot both stand, and Shu sent congratulations on a usurpation — the largest humiliation the state had swallowed since its founding. Zhuge Liang did it without pretending it was not a humiliation, and argued only from advantage: "we shall have to absorb his territory before we can talk about the central plain" is the conclusion of having worked the whole thing through to the end. A man who keeps his good name may not keep his state; a man who keeps his state has first worked out precisely which sort of good name he can do without.',
      verdictLostZh:
        '論曰:是歲取武都、陰平二郡,'
        + '蜀之北伐,實得地者惟此一次。'
        + '——五出祁山,所得二郡而已;'
        + '而以二郡之得,足使一國十年不疑其相。',
      verdictLostEn:
        'The historian says: that year Wudu and Yinping were taken — the only northern campaign that actually gained ground. Five expeditions to Qishan, and two commanderies to show for it; and those two commanderies were enough to keep a whole country from doubting its chancellor for ten years.',
    },
    cao: {
      defeat: {
        titleZh: '虎睡',
        titleEn: 'Let the Tigers Sleep',
        textZh:
          '吳、蜀並稱帝,天下三分之名始定。'
          + '群臣或請大舉伐吳。\n\n'
          + '孫資曰:「昔武皇帝征南鄭,取張魯,'
          + '陽平之役,危而後濟。'
          + '又自往拔出夏侯淵軍,數言南鄭直為天獄,'
          + '中斜谷道為五百里石穴耳。\n'
          + '——武皇帝聖於用兵,察蜀賊棲於山巖,'
          + '視吳虜竄於江湖,'
          + '皆桡而避之,不責將士之力,'
          + '不爭一朝之忿,誠所謂見勝而戰,'
          + '知難而退也。\n\n'
          + '若今分命大將據諸要險,'
          + '威足以震攝彊寇,鎮靜疆埸,'
          + '將士虎睡,百姓無事。\n'
          + '數年之間,中國日盛,吳蜀二虜必自罷弊。」',
        textEn:
          'Wu and Shu both declared emperors, and the three-way division of the realm had its formal shape. Some at court asked for a great campaign against Wu.\n\n'
          + 'Sun Zi said: "When the Martial Emperor campaigned at Nanzheng and took Zhang Lu, the affair at Yangping was touch and go before it came right. He went himself to extricate Xiahou Yuan\'s army, and said more than once that Nanzheng was simply a prison built by Heaven, and the Xie valley road nothing but five hundred li of stone burrow.\n\n'
          + 'The Martial Emperor was a genius at war, and seeing the Shu rebels perched among their crags and the Wu rebels hiding in their rivers and lakes, he bent aside and avoided them both. He did not spend his officers\' strength and did not contend over a morning\'s anger. That is what is meant by fighting when you see the victory and withdrawing when you know the difficulty.\n\n'
          + 'Assign our great commanders now to hold the key positions. Our weight will be enough to overawe strong enemies and keep the frontier quiet; the soldiers sleep like tigers and the people are undisturbed. In a few years the middle kingdom grows stronger daily and the two enemies must wear themselves out."',
      },
      verdictZh:
        '論曰:三國相持四十年,'
        + '而魏未嘗以一大役定天下 ——'
        + '所行者,孫資「虎睡」四字而已。\n'
        + '**以九州之富,行不爭之策,'
        + '則時間即為兵力**:'
        + '諸葛五出而國愈疲,'
        + '孫吳歲攻而力愈竭,'
        + '而魏坐收其弊。\n'
        + '及其亡也,亦非亡於吳蜀,亡於其臣。',
      verdictEn:
        'The historian says: the three states faced each other for forty years and Wei never settled the realm with one great campaign — what it did was Sun Zi\'s four words about sleeping tigers. Use the wealth of nine provinces to follow a policy of not contending, and time itself becomes military strength: Zhuge Liang went out five times and his country grew more exhausted; Wu attacked every year and its strength ran out; and Wei sat and collected the proceeds. And when Wei fell, it did not fall to Wu or Shu. It fell to its own minister.',
      verdictLostZh:
        '論曰:明帝之世,吳蜀不能為患;'
        + '而帝崩之年,託孤於曹爽、司馬懿 ——'
        + '**四十年不敗於外,而敗於一次託孤**。',
      verdictLostEn:
        'The historian says: in Emperor Ming\'s reign Wu and Shu could do Wei no harm; and in the year he died he entrusted his heir to Cao Shuang and Sima Yi. Forty years without a defeat abroad, undone by one deathbed arrangement.',
    },
  },
  /* ── 戰國·魏文侯首霸 ──────────────────────────────────────────── */
  'scn-ws-weiwen': {
    wei: {
      defeat: {
        titleZh: '謗書一篋',
        titleEn: 'A Basket of Denunciations',
        textZh:
          '文侯師卜子夏,友田子方,禮段干木 ——'
          + '過其閭,未嘗不軾也。\n\n'
          + '用李悝盡地力之教:「地方百里,'
          + '提封九萬頃,除山澤邑居參分去一,'
          + '為田六百萬畝,治田勤謹則畝益三升,'
          + '不勤則損亦如之。」'
          + '又作法經六篇,為後世律令之祖。\n\n'
          + '西門豹治鄴,鑿十二渠,引河水灌民田。\n'
          + '吳起守西河,秦兵不敢東向。\n'
          + '樂羊伐中山,三年而拔之 ——\n\n'
          + '羊反而語功,文侯示之兩篋:'
          + '皆謗羊之書也。羊再拜曰:'
          + '「此非臣之功,主君之力也。」',
        textEn:
          'Marquis Wen took Bu Zixia as his teacher, Tian Zifang as his friend, and treated Duan Ganmu with ceremony — he never passed his lane without bowing over the carriage rail.\n\n'
          + 'He used Li Kui\'s programme for getting everything out of the soil: "In a hundred li square there are ninety thousand qing of registered land; take away a third for hills, marshes and dwellings and six million mu remain as fields. Farm them diligently and each mu yields three sheng more; farm them slackly and it loses as much." And Li Kui wrote the Canon of Laws in six sections, ancestor of every code since.\n\n'
          + 'Ximen Bao governed Ye and cut twelve channels to bring river water onto the people\'s fields. Wu Qi held the western river and Qin dared not face east. Yue Yang attacked Zhongshan and took it in three years —\n\n'
          + 'and came back to speak of his achievement, and the Marquis showed him two basketfuls: all of them denunciations of Yue Yang. Yang bowed twice and said: "This was not your servant\'s doing. It was my lord\'s strength."',
      },
      verdictZh:
        '論曰:魏之先霸諸侯,不以其地,以其**能用人於未成之時** ——'
        + '樂羊三年不下中山,而謗書滿篋;\n'
        + '文侯不出一言,待其成而後示之。\n'
        + '故戰國之初,吳起、李悝、西門豹、樂羊皆在魏;'
        + '而其後商鞅、張儀、范雎、孫臏,'
        + '亦皆出於魏而不用於魏 ——\n'
        + '**一國之衰,常始於它不再是人才願意留下的地方**。',
      verdictEn:
        'The historian says: Wei led the feudal lords first not because of its land but because it could back a man before he had produced anything. Yue Yang spent three years failing to take Zhongshan and the denunciations filled two baskets; the Marquis said nothing at all, and waited until it was done before showing him. So at the opening of the Warring States, Wu Qi, Li Kui, Ximen Bao and Yue Yang were all in Wei — and afterwards Shang Yang, Zhang Yi, Fan Ju and Sun Bin all came out of Wei and were not employed by it. A state\'s decline usually begins when it stops being the place able men are willing to stay.',
      verdictLostZh:
        '論曰:文侯問群臣:「我何如主?」'
        + '皆曰仁君。任座曰:「君得中山,不以封君之弟,'
        + '而以封君之子,是以知君之非仁君也。」'
        + '文侯怒,任座趨出。'
        + '翟璜曰:「君仁君也。臣聞君明則臣直。'
        + '向者任座之言直,是以知君之仁也。」'
        + '文侯喜,使翟璜召任座而反之,親下堂迎之,以為上客。',
      verdictLostEn:
        'The historian says: Marquis Wen asked his court, "What kind of ruler am I?" and they all said a benevolent one. Ren Zuo said: "You took Zhongshan and enfeoffed your son with it rather than your younger brother. That is how I know you are not a benevolent ruler." The Marquis was angry and Ren Zuo hurried out. Then Zhai Huang said: "You are a benevolent ruler. I have heard that where the ruler is clear-sighted his ministers are blunt. Ren Zuo just spoke bluntly, and that is how I know." The Marquis was pleased, sent Zhai Huang to bring Ren Zuo back, went down from the hall to meet him himself, and made him an honoured guest.',
    },
  },
  /* ── 戰國·商鞅變法 ────────────────────────────────────────────── */
  'scn-ws-shangyang': {
    qin: {
      defeat: {
        titleZh: '徙木立信',
        titleEn: 'The Pole at the South Gate',
        textZh:
          '令既具,未布,恐民之不信,'
          + '乃立三丈之木於國都市南門,'
          + '募民有能徙置北門者予十金。\n'
          + '民怪之,莫敢徙。復曰:'
          + '「能徙者予五十金。」\n'
          + '有一人徙之,輒予五十金,以明不欺。\n\n'
          + '令行於民期年,秦民之國都言初令之不便者以千數。'
          + '於是太子犯法。衛鞅曰:'
          + '「法之不行,自上犯之。」\n'
          + '將法太子。太子,君嗣也,不可施刑,'
          + '刑其傅公子虔,黥其師公孫賈。\n\n'
          + '明日,秦人皆趨令。行之十年,'
          + '秦民大悅,道不拾遺,山無盜賊,'
          + '家給人足,民勇於公戰,怯於私鬥。',
        textEn:
          'The new laws were drafted and not yet published, and fearing the people would not trust them, he set a pole thirty feet long at the south gate of the capital market and offered ten pieces of gold to anyone who would move it to the north gate. The people thought it odd and nobody dared. He said: "Fifty to whoever moves it." One man moved it and was given fifty on the spot, to show that they were not being cheated.\n\n'
          + 'After the laws had run a year, the people who came to the capital to say the new laws were inconvenient numbered in the thousands. Then the heir apparent broke the law. Wei Yang said: "Laws fail because those above break them." He was going to have the heir punished — but the heir was the ruler\'s successor and could not be sentenced, so his guardian Prince Qian was punished instead and his tutor Gongsun Jia branded on the face.\n\n'
          + 'The next day every man in Qin hurried to obey. After ten years the people of Qin were delighted with it: nothing dropped on the road was picked up, there were no bandits in the hills, every household had enough, and men were brave in the state\'s wars and timid in private quarrels.',
      },
      verdictZh:
        '論曰:鞅之立法,先立**信**而後立法 ——'
        + '五十金買一根木頭,買的是「說了算數」四字。\n'
        + '然其信止於令,不及於人:\n'
        + '初言令不便者,後言令便,鞅曰'
        + '「此皆亂化之民也」,盡遷之於邊城 ——'
        + '**連稱讚都不許改口**,\n'
        + '故秦法可行百年而秦人不敢言。\n'
        + '孝公卒,鞅車裂於彤,而秦人不憐。',
      verdictEn:
        'The historian says: Shang Yang established credit before he established law — fifty pieces of gold for one pole bought four words: he means what he says. But the credit stopped at the statute and never reached the people. Those who had said at first that the laws were inconvenient and later said they were convenient were told by Yang, "These are people who disturb the transformation," and were deported to the frontier towns. He would not even allow them to change their minds in his favour. So the laws of Qin ran for a century and the people of Qin did not dare speak. When Duke Xiao died Yang was torn apart by chariots at Tong, and the people of Qin did not pity him.',
      verdictLostZh:
        '論曰:趙良謂鞅曰:「君之出也,'
        + '後車十數,從車載甲,多力而駢脅者為驂乘,'
        + '持矛而操闟戟者旁車而趨。'
        + '此一物不具,君固不出。'
        + '書曰:『恃德者昌,恃力者亡。』'
        + '君之危若朝露,尚將欲延年益壽乎?」\n'
        + '——後五月而難作。',
      verdictLostEn:
        'The historian says: Zhao Liang said to Shang Yang: "When you go out, there are a dozen carriages behind you and armoured men in them, powerful men with barrel ribs at your side and men with spears and halberds running alongside. If one of these is missing you do not go out at all. The Documents say: he who relies on virtue flourishes, he who relies on force perishes. Your danger is like the morning dew — and you still hope for length of years?" Five months later the blow fell.',
    },
  },
  /* ── 戰國·圍魏救趙 ────────────────────────────────────────────── */
  'scn-ws-guiling': {
    qi: {
      defeat: {
        titleZh: '批亢搗虛',
        titleEn: 'Strike the Throat, Stab the Empty Place',
        textZh:
          '魏伐趙,趙急,請救於齊。'
          + '齊威王欲將孫臏,臏辭謝曰:'
          + '「刑餘之人不可。」於是乃以田忌為將,'
          + '而孫子為師,居輜車中,坐為計謀。\n\n'
          + '田忌欲引兵之趙,孫子曰:\n'
          + '「夫解雜亂紛糾者不控捲,救鬥者不搏撠,'
          + '批亢搗虛,形格勢禁,則自為解耳。\n'
          + '今梁趙相攻,輕兵銳卒必竭於外,'
          + '老弱罷於內。\n'
          + '君不若引兵疾走大梁,據其街路,衝其方虛,'
          + '彼必釋趙而自救。\n'
          + '是我一舉解趙之圍而收獘於魏也。」\n\n'
          + '田忌從之。魏果去邯鄲,與齊戰於桂陵,大破梁軍。',
        textEn:
          'Wei attacked Zhao; Zhao was hard pressed and asked Qi for help. King Wei of Qi wanted Sun Bin in command, and Bin declined: "A man who has been mutilated cannot." So Tian Ji was made general and Master Sun his strategist, riding in a covered cart and doing his planning sitting down.\n\n'
          + 'Tian Ji wanted to march to Zhao, and Master Sun said: "To untangle a snarl you do not tug at it; to break up a fight you do not join in the grappling. Strike at the throat, stab at the empty place; make the shape of things forbid it, and it comes apart of itself.\n\n'
          + 'Wei and Zhao are locked together now, so Wei\'s light troops and best men must be spent abroad and the old and weak worn out at home.\n\n'
          + 'Better to march hard on Daliang, hold its streets, drive at what is empty — and they will let go of Zhao to save themselves.\n\n'
          + 'At one stroke we lift the siege of Zhao and collect the profit of Wei\'s exhaustion."\n\n'
          + 'Tian Ji did it. Wei did leave Handan, fought Qi at Guiling, and its army was broken.',
      },
      verdictZh:
        '論曰:救趙而不至趙,'
        + '此戰國兵法之一大轉關 ——\n'
        + '**戰之所在,不必在所爭之地**。\n'
        + '十二年後馬陵,臏減灶而誘龐涓,'
        + '書於樹曰「龐涓死於此樹之下」,'
        + '萬弩俱發 —— 用的仍是同一法:'
        + '不與敵爭其所備,而使敵自來就我所設。',
      verdictEn:
        'The historian says: relieving Zhao without going to Zhao is one of the great turning points in the military thinking of the age — where a battle is fought need not be where the thing in dispute lies. Twelve years later at Maling, Sun Bin reduced his cooking-fires to draw Pang Juan on, wrote on a tree "Pang Juan dies beneath this tree", and ten thousand crossbows went off together. The same method: never contend with an enemy where he is ready, but make him come of his own accord to where you have laid it out.',
      verdictLostZh:
        '論曰:臏與涓俱學兵法。涓自以能不及臏,'
        + '陰使召之,以法刑斷其兩足而黥之,欲隱勿見。'
        + '——**害人以絕其名,而其名終以害己者顯**。',
      verdictLostEn:
        'The historian says: Sun Bin and Pang Juan studied the art of war together. Juan knew himself the lesser, sent for Bin in secret, had his feet cut off by process of law and his face branded, meaning to keep him out of sight for good. Injure a man to bury his name, and his name ends up made by what you did to you.',
    },
    wei: {
      defeat: {
        titleZh: '釋趙而自救',
        titleEn: 'Let Go of Zhao and Save Yourself',
        textZh:
          '你圍邯鄲一年而拔之。\n'
          + '——而大梁空。\n\n'
          + '齊師直走大梁,據其街路,衝其方虛。'
          + '龐涓去邯鄲,倍道兼行,與齊戰於桂陵,'
          + '輕兵銳卒竭於外,老弱罷於內,遂大敗。\n\n'
          + '十二年後,你伐韓,韓告急於齊。'
          + '齊復以田忌將,直走大梁。'
          + '涓聞之,去韓而歸。\n\n'
          + '孫子曰:「彼三晉之兵素悍勇而輕齊,'
          + '齊號為怯。善戰者因其勢而利導之。」\n'
          + '——入魏地為十萬灶,明日為五萬灶,'
          + '又明日為三萬灶。',
        textEn:
          'You invested Handan for a year and took it. And Daliang was empty.\n\n'
          + 'The army of Qi marched straight on Daliang, held its streets and drove at what was empty. Pang Juan left Handan and came back by forced marches, fought Qi at Guiling with his light troops spent abroad and his old and weak worn out at home, and was thoroughly beaten.\n\n'
          + 'Twelve years later you attacked Hann, and Hann appealed to Qi. Qi again put Tian Ji in command and again marched straight on Daliang. Juan heard of it and left Hann to come home.\n\n'
          + 'And Master Sun said: "The troops of the three Jin states are famously fierce and hold Qi cheap; Qi has a name for cowardice. A good commander takes the shape of things as he finds it and steers it to advantage." Entering Wei territory they made a hundred thousand cooking-fires, the next day fifty thousand, the day after thirty thousand.',
      },
      verdictZh:
        '論曰:魏承文侯、武侯之業,'
        + '至惠王而地最廣、兵最強、都最富 ——'
        + '而兩敗於齊,一失太子,一失龐涓,'
        + '自是不復為霸。\n'
        + '**其病在四戰而無定向**:'
        + '西攻秦、北圍趙、南伐韓,'
        + '所向皆勝而所守皆虛。\n'
        + '惠王之問孟子曰「叟不遠千里而來,'
        + '亦將有以利吾國乎」,已是敗國之君語。',
      verdictEn:
        'The historian says: Wei inherited the work of Marquises Wen and Wu, and under King Hui it had the widest lands, the strongest army and the richest capital in the world — and was beaten twice by Qi, losing an heir apparent in one and Pang Juan in the other, and was never a leading power again. Its disease was fighting on four fronts with no settled direction: west at Qin, north round Zhao, south at Hann, winning wherever it went and leaving empty whatever it held. When King Hui asked Mencius, "Venerable sir, you have not thought a thousand li too far to come — will you also have something to profit my state by?" he was already speaking as the ruler of a lost cause.',
      verdictLostZh:
        '論曰:馬陵之役,涓自知智窮兵敗,'
        + '乃自剄,曰:「遂成豎子之名!」'
        + '——臨死所恨者,非國之亡,是人之名。',
      verdictLostEn:
        'The historian says: at Maling, knowing his cleverness exhausted and his army broken, Pang Juan cut his own throat, saying: "So I have made that wretch\'s reputation for him." What he regretted at the end was not his state\'s ruin but another man\'s fame.',
    },
  },
  /* ── 戰國·長平之戰 ────────────────────────────────────────────── */
  'scn-ws-changping': {
    zhao: {
      defeat: {
        titleZh: '膠柱鼓瑟',
        titleEn: 'Playing a Zither with the Pegs Glued',
        textZh:
          '廉頗堅壁以待秦,秦數挑戰,趙兵不出。'
          + '趙王數以為讓。\n\n'
          + '而秦相應侯又使人行千金於趙為反間,曰:'
          + '「秦之所惡,獨畏馬服子趙括將耳,'
          + '廉頗易與,且降矣。」\n\n'
          + '趙王遂以括代頗。'
          + '藺相如曰:「王以名使括,'
          + '若膠柱而鼓瑟耳。'
          + '括徒能讀其父書傳,不知合變也。」\n\n'
          + '括母上書曰:「始妾事其父,時為將,'
          + '身所奉飯飲而進食者以十數,所友者以百數,'
          + '大王及宗室所賞賜者盡以予軍吏士大夫。\n'
          + '今括一旦為將,東向而朝,軍吏無敢仰視之者,'
          + '王所賜金帛,歸藏於家,'
          + '而日視便利田宅可買者買之。'
          + '——父子異心,願王勿遣。」',
        textEn:
          'Lian Po held his walls and waited for Qin; Qin offered battle repeatedly and the Zhao troops would not come out. The King of Zhao reproached him for it more than once.\n\n'
          + 'And the Marquis of Ying, chancellor of Qin, sent a thousand pieces of gold into Zhao to sow the story: "The only thing Qin dreads is Zhao Kuo, son of the Lord of Mafu, taking command. Lian Po is easy to handle and is about to surrender anyway."\n\n'
          + 'So the King replaced Lian Po with Kuo. Lin Xiangru said: "Your Majesty is employing Kuo on the strength of a name. It is like gluing the pegs and then playing the zither. Kuo can recite his father\'s books; he does not know how to meet a change."\n\n'
          + 'And Kuo\'s mother submitted a memorial: "When I first served his father and he was a general, the men he served food to with his own hands were counted in tens and his friends in hundreds; everything Your Majesty and the royal house gave him he passed on to his officers and gentlemen.\n\n'
          + 'Kuo is a general one day and sits facing east receiving court, and not an officer dares look up at him; the gold and silk Your Majesty has given him he has stored at home, and he goes out daily to look at profitable fields and houses to buy. Father and son are not of one mind. I beg Your Majesty not to send him."',
      },
      verdictZh:
        '論曰:長平之敗,不敗於括,敗於**易將** ——'
        + '相如言之,括母言之,而趙王皆不聽:\n'
        + '所以不聽者,只因頗守而括言戰。\n'
        + '**國君之最難,在於忍受一個看起來不作為的將領**。\n'
        + '秦以千金易一將,而趙以四十萬人償之。',
      verdictEn:
        'The historian says: Changping was not lost by Zhao Kuo but by the change of commanders. Lin Xiangru said so and Kuo\'s own mother said so, and the King listened to neither — for no other reason than that Lian Po held and Kuo talked about attacking. The hardest thing for a sovereign is to tolerate a commander who appears to be doing nothing. Qin bought a change of general for a thousand pieces of gold, and Zhao paid for it with four hundred thousand men.',
      verdictLostZh:
        '論曰:括母請曰:「即如有不稱,妾得無隨坐乎?」'
        + '王許諾。及括軍敗,王以母先言,竟不誅也。\n'
        + '——舉國之中,惟一人在事前把話說死。',
      verdictLostEn:
        'The historian says: Kuo\'s mother asked, "And if he proves unequal to it, may I be spared being punished with him?" The King agreed. When Kuo\'s army was destroyed the King remembered what she had said beforehand and did not execute her. In the whole kingdom, one person had put it on the record in advance.',
    },
    qin: {
      defeat: {
        titleZh: '挾詐而盡阬之',
        titleEn: 'By a Trick, and Buried Them All',
        textZh:
          '趙括出銳卒自搏戰,秦軍射殺趙括。'
          + '括軍敗,卒四十萬人降武安君。\n\n'
          + '武安君計曰:「前秦已拔上黨,'
          + '上黨民不樂為秦而歸趙。'
          + '趙卒反覆,非盡殺之,恐為亂。」\n\n'
          + '乃挾詐而盡阬殺之,遺其小者二百四十人歸趙。'
          + '前後斬首虜四十五萬人。趙人大震。\n\n'
          + '——其後武安君稱病,不肯將邯鄲之役。'
          + '曰:「邯鄲實未易攻也。'
          + '且諸侯救日至,彼諸侯怨秦之日久矣。」\n'
          + '秦王賜之劍,自裁。\n'
          + '起曰:「我固當死。長平之戰,'
          + '趙卒降者數十萬人,我詐而盡阬之,是足以死。」',
        textEn:
          'Zhao Kuo took his best troops out to fight hand to hand and was shot dead by the Qin army. His army broke, and four hundred thousand men surrendered to the Lord of Wu\'an.\n\n'
          + 'The Lord of Wu\'an reasoned: "Qin has already taken Shangdang, and the people of Shangdang would not be Qin\'s and went over to Zhao. The soldiers of Zhao change sides. Unless they are all killed there will be trouble."\n\n'
          + 'So by a trick he buried the lot of them alive, sending two hundred and forty of the youngest home to Zhao. All told, four hundred and fifty thousand heads and prisoners. Zhao was shaken to its roots.\n\n'
          + 'Afterwards the Lord of Wu\'an pleaded illness and would not take command at Handan. He said: "Handan is really not easy to attack. And relief from the other states arrives daily; they have resented Qin a long time." The King of Qin sent him a sword.\n\n'
          + 'And Bai Qi said: "I do deserve to die. At Changping several hundred thousand men of Zhao surrendered, and I deceived them and buried them all. That is enough to die for."',
      },
      verdictZh:
        '論曰:長平一役,秦以一戰而定天下之勢 ——'
        + '自是六國無能野戰者。\n'
        + '然阬降四十萬,其害在後:'
        + '**降不可保,則往後無人肯降**;\n'
        + '故邯鄲之圍,秦以三年不下,'
        + '而諸侯之救日至。\n'
        + '白起之死,秦王殺之,而其罪自認,'
        + '亦可謂知其所以死者。',
      verdictEn:
        'The historian says: Changping settled the shape of the age in one battle — after it none of the six states could meet Qin in the field. And burying four hundred thousand who had surrendered did its damage later: if surrender does not keep you alive, nobody surrenders again. So the siege of Handan lasted three years without success while relief came in daily from the other states. The King of Qin killed Bai Qi, and Bai Qi named his own offence, which is at least knowing what one is dying of.',
      verdictLostZh:
        '論曰:秦之強,不獨在兵,在**能易將而不亂** ——'
        + '陰使武安君代王齕,而令軍中'
        + '「有敢泄武安君將者斬」。\n'
        + '同一年,趙易將而亡四十萬,秦易將而勝;'
        + '所異者,一在暗,一在明;'
        + '一由己出,一由敵使。',
      verdictLostEn:
        'The historian says: Qin\'s strength was not only in its troops but in being able to change commanders without disorder — the Lord of Wu\'an was substituted for Wang He in secret, with an order through the camp that anyone who let out that he was in command would be beheaded. In the same year Zhao changed commanders and lost four hundred thousand men and Qin changed commanders and won. The difference: one was done in the dark and one in the open; one was its own decision and one was the enemy\'s.',
    },
  },
  /* ── 戰國·五國攻秦 ────────────────────────────────────────────── */
  'scn-ws-hangu': {
    qin: {
      defeat: {
        titleZh: '天下之士合從',
        titleEn: 'The Vertical Alliance',
        textZh:
          '蘇秦說六國從親:'
          + '「秦以牛田之水通糧,蠶食諸侯,'
          + '六國從親以擯秦,'
          + '秦兵必不敢出於函谷關以害山東矣。」\n\n'
          + '於是六國從合而並力焉。'
          + '蘇秦為從約長,並相六國,'
          + '——秦兵不敢闚函谷關十五年。\n\n'
          + '然從者,以利合;'
          + '利盡則散。\n'
          + '張儀既相秦,乃以連橫破之:'
          + '「夫從人飾辯虛辭,高主之節,'
          + '言其利不言其害,卒有秦禍,無及為己。」',
        textEn:
          'Su Qin argued the six states into a vertical alliance: "Qin brings up its grain by water on ox-farmed land and eats the feudal states like silkworms. Let the six join north and south to fence Qin off, and Qin will never dare bring troops out of the Hangu pass to harm the lands east of the mountains."\n\n'
          + 'So the six combined and joined their strength. Su Qin was made head of the covenant and chancellor of all six at once — and for fifteen years Qin\'s troops did not so much as look at the Hangu pass.\n\n'
          + 'But an alliance made out of interest scatters when the interest is gone. Once Zhang Yi was chancellor of Qin he broke it with the horizontal alliance: "These vertical men dress up their arguments with empty phrases and flatter a ruler\'s dignity, speaking of the advantages and never of the harm. When the calamity from Qin finally arrives it is too late to do anything about it."',
      },
      verdictZh:
        '論曰:六國之地五倍於秦,兵十倍於秦,'
        + '而卒為秦所並 ——\n'
        + '非不能合,是**合而不能久**:'
        + '五國攻秦至函谷而還,一勝即散;'
        + '一國割地求和,則餘者亦爭割。\n'
        + '**從者,眾人共擔一事;'
        + '橫者,一人各許一利** ——'
        + '故從難而橫易。',
      verdictEn:
        'The historian says: the six states had five times Qin\'s land and ten times its soldiers, and Qin swallowed them. Not that they could not combine — they could not stay combined. Five of them attacked as far as the Hangu pass and went home; one victory and they scattered; one state ceded territory for peace and the rest raced to cede theirs. A vertical alliance asks many men to carry one thing; the horizontal offers each man his own advantage. Which is why the first is hard and the second easy.',
      verdictLostZh:
        '論曰:蘇秦既約六國,乃投從約書於秦。'
        + '秦人不出關者十五年 ——'
        + '**十五年之後,函谷關依舊在,而六國之約已無人記得**。',
      verdictLostEn:
        'The historian says: with the six states bound, Su Qin sent a copy of the covenant into Qin, and Qin did not come out of the pass for fifteen years. Fifteen years later the pass was still there and nobody remembered the covenant.',
    },
    qi: {
      defeat: {
        titleZh: '入函谷關',
        titleEn: 'Into the Hangu Pass',
        textZh:
          '孟嘗君相齊,率齊、韓、魏之師攻秦,'
          + '至函谷關 —— **入之**。'
          + '秦割河東三城以和。\n\n'
          + '此戰國二百年中,山東之師唯一次入關者。\n\n'
          + '而孟嘗君之在秦也,昭王囚之欲殺。'
          + '客有能為狗盜者,入秦宮藏中,取狐白裘以獻幸姬,'
          + '姬為言得出。\n'
          + '夜半至函谷關,關法雞鳴而出客。'
          + '客有能為雞鳴者,一鳴而群雞盡鳴,遂發傳出。\n\n'
          + '——出如脫兔,入如平地;'
          + '而其後齊亦亡於五國之兵。',
        textEn:
          'As chancellor of Qi, the Lord of Mengchang led the armies of Qi, Hann and Wei against Qin as far as the Hangu pass — and through it. Qin ceded three cities east of the river for peace.\n\n'
          + 'In two hundred years of the Warring States, that was the one time the armies of the east got inside the pass.\n\n'
          + 'And when the Lord of Mengchang had been in Qin, King Zhao imprisoned him and meant to kill him. One of his retainers could steal like a dog, and got into the Qin treasury and took the white fox robe to present to the favourite concubine, and she spoke for him and he was let out.\n\n'
          + 'He reached the pass at midnight, and by the regulation travellers were let out at cockcrow. One of his retainers could crow like a cock; he crowed once, every cock in the place answered, and the pass was opened and the warrant issued.\n\n'
          + 'Out like a bolting hare, and in as if the pass were level ground. And in the end Qi too fell to the armies of five states.',
      },
      verdictZh:
        '論曰:齊之強,嘗與秦並稱東西帝;'
        + '而其亡也,先失於**自為帝**,'
        + '再失於**獨吞宋**。\n'
        + '五國攻秦,齊為之長;五國伐齊,齊無一援。\n'
        + '**同一群人,可以跟你一起打人,也可以一起打你** ——'
        + '所別者,只在誰看起來最像下一個秦。',
      verdictEn:
        'The historian says: Qi was once strong enough to be called Emperor of the East alongside Qin as Emperor of the West. It lost itself first by taking that title and then by swallowing Song alone. When five states attacked Qin, Qi led them; when five states attacked Qi, not one came to help. The same set of people who will help you beat somebody will help beat you; the only question is who currently looks most like the next Qin.',
      verdictLostZh:
        '論曰:孟嘗君之出關,恃雞鳴狗盜;'
        + '而王安石譏之曰:「擅齊之強,'
        + '得一士焉,宜可以南面而制秦,'
        + '尚何取雞鳴狗盜之力哉?」',
      verdictLostEn:
        'The historian says: the Lord of Mengchang got out of the pass on a cock-crower and a dog-thief; and Wang Anshi\'s judgement on him was: "With the strength of Qi behind him, one real gentleman would have let him face south and dictate to Qin. What did he want with cock-crowers and dog-thieves?"',
    },
  },
  /* ── 戰國·伊闕之戰 ────────────────────────────────────────────── */
  'scn-ws-yique': {
    qin: {
      defeat: {
        titleZh: '二軍不同',
        titleEn: 'Two Armies, Not One',
        textZh:
          '韓魏合兵二十四萬,拒秦於伊闕。\n\n'
          + '白起察之:「韓孤顧魏,不欲先用其眾;'
          + '魏恃韓之銳,欲推以為鋒。'
          + '二軍不同心,故可破也。」\n\n'
          + '乃設疑兵以當韓陣,'
          + '而潛以精銳出魏軍之後,擊之。\n\n'
          + '魏軍既敗,韓軍自潰。'
          + '斬首二十四萬,虜其將公孫喜,拔五城。\n\n'
          + '——起由是為國尉,遷大良造。',
        textEn:
          'Hann and Wei put two hundred and forty thousand men together and stood against Qin at Yique.\n\n'
          + 'Bai Qi looked at it and said: "Hann is alone and keeps glancing at Wei, and does not want to spend its own men first. Wei is relying on Hann\'s picked troops and wants to push them out in front. The two armies are not of one mind, so they can be broken."\n\n'
          + 'So he set up a demonstration force facing the Hann line and took his best troops round in secret behind the Wei army and struck.\n\n'
          + 'With Wei broken, Hann fell apart of itself. Two hundred and forty thousand heads, their commander Gongsun Xi taken, five cities carried.\n\n'
          + 'And on the strength of it Bai Qi was made State Commandant and then Grand Steward of the Left.',
      },
      verdictZh:
        '論曰:起之破韓魏,不在其兵利,'
        + '在其**先讀懂了對面兩家的心事** ——\n'
        + '「韓孤顧魏,魏恃韓銳」八字,'
        + '是戰前偵察所不能得,'
        + '而必自兩國之處境推之。\n'
        + '**凡合兵者,必有一家想少出力**;'
        + '知其為誰,則陣未接而勝負分。',
      verdictEn:
        'The historian says: Bai Qi broke Hann and Wei not with better weapons but by reading what was in the minds of the two armies facing him. "Hann is alone and glancing at Wei; Wei is relying on Hann\'s picked troops" is not something scouting produces; it has to be deduced from the two states\' positions. Wherever armies are combined, one of them is hoping to spend less — know which, and the thing is decided before contact.',
      verdictLostZh:
        '論曰:秦之用起,起於伊闕,終於長平,'
        + '三十七年,未嘗一敗。'
        + '而其死也,以不肯將必敗之師。'
        + '——**善戰者知所不戰,而人主不許其不戰**。',
      verdictLostEn:
        'The historian says: Qin used Bai Qi from Yique to Changping, thirty-seven years without a defeat. And he died for refusing to command an army he knew would lose. A good commander knows what not to fight; a sovereign will not grant him the refusal.',
    },
    wei: {
      defeat: {
        titleZh: '推韓為鋒',
        titleEn: 'Push Hann Out in Front',
        textZh:
          '韓魏之兵二十四萬,倍於秦。\n\n'
          + '而你恃韓之銳,欲推以為鋒;'
          + '韓亦顧你,不欲先用其眾。\n'
          + '——兩軍相望,各待對方先動。\n\n'
          + '白起以疑兵當韓,以精銳出你之後。\n\n'
          + '公孫喜被虜。五城入秦。\n'
          + '自是韓魏不能復當秦於崤函之間,'
          + '而秦之東出,自伊闕始無阻。',
        textEn:
          'Hann and Wei had two hundred and forty thousand men, twice what Qin had.\n\n'
          + 'And you were relying on Hann\'s picked troops and wanted to push them out in front; and Hann was watching you and did not want to spend its own men first. Two armies facing one another, each waiting for the other to move.\n\n'
          + 'Bai Qi held Hann with a demonstration and took his best men round behind you.\n\n'
          + 'Gongsun Xi was captured. Five cities went to Qin. After that Hann and Wei could no longer hold Qin between Xiao and Hangu, and from Yique onwards Qin\'s road east was open.',
      },
      verdictZh:
        '論曰:韓魏本三晉之親,而至此各存其力 ——'
        + '**合兵而各存其力,則不如不合**:'
        + '二十四萬同死於一日,'
        + '正因為誰都不肯先死。\n'
        + '此後六國之伐秦,皆蹈此轍;'
        + '秦之所以能以一敵六,'
        + '不在其眾,在六者之各為己。',
      verdictEn:
        'The historian says: Hann and Wei were kin, both heirs of Jin, and here each was conserving its own strength. Armies combined with each side conserving itself would do better not to combine at all: two hundred and forty thousand died in one day precisely because nobody would die first. Every later coalition against Qin ran into the same rut. Qin held off six states not because of its numbers but because each of the six was in it for itself.',
      verdictLostZh:
        '論曰:魏自伊闕之後,'
        + '割河東四百里、河內、南陽,以至於安釐王之世,'
        + '所存者大梁一隅。'
        + '——**割地事秦,猶抱薪救火,薪不盡,火不滅**。',
      verdictLostEn:
        'The historian says: after Yique, Wei ceded four hundred li east of the river, then Henei, then Nanyang, until by King Anxi\'s time all it had left was the corner around Daliang. Ceding land to serve Qin is carrying firewood to put out a fire: while the wood lasts, the fire does not go out.',
    },
  },
  /* ── 戰國·鄢郢之戰 ────────────────────────────────────────────── */
  'scn-ws-yanying': {
    chu: {
      defeat: {
        titleZh: '水灌鄢城',
        titleEn: 'The River Let Into Yan',
        textZh:
          '白起攻楚,拔鄢、鄧五城。\n\n'
          + '鄢城堅,不可急拔。'
          + '起乃於城西百里,壅夷水為渠以灌鄢城。'
          + '水潰城東北角,城中人隨水流,'
          + '死於城東者數十萬,城東皆臭 ——'
          + '故名其陂曰臭池。\n\n'
          + '明年,拔郢,燒夷陵,東至竟陵。'
          + '楚王亡走,遷都於陳。\n\n'
          + '屈原懷石,自沉汨羅。\n\n'
          + '起由是封武安君。',
        textEn:
          'Bai Qi attacked Chu and took Yan, Deng and five other cities.\n\n'
          + 'Yan was strong and could not be rushed. So a hundred li west of it he dammed the Yi river into a channel and let it into the city. The water broke the northeast corner and the people inside went out with it; several hundred thousand died east of the walls and the whole area stank — the pool there was called the Stinking Pool from then on.\n\n'
          + 'The next year he took Ying, burnt the royal tombs at Yiling, and pushed east as far as Jingling. The King of Chu fled and moved the capital to Chen.\n\n'
          + 'Qu Yuan put a stone in his robe and drowned himself in the Miluo.\n\n'
          + "And Bai Qi was made Lord of Wu'an for it.",
      },
      verdictZh:
        '論曰:楚地方五千里,帶甲百萬,'
        + '而失郢都於一水之下 ——\n'
        + '**大國之亡,不在其小,在其散**:\n'
        + '懷王入秦而不返,'
        + '屈原放於江南,'
        + '而群臣爭以割地事秦為和。\n'
        + '故荀子曰:'
        + '「楚人鮫革犀兕以為甲,鞈如金石;'
        + '宛鉅鐵釶,慘如蜂蠆;'
        + '輕利僄遫,卒如飄風 ——'
        + '然而兵殆於垂沙,唐蔑死,'
        + '是無他故焉,不卹其下也。」',
      verdictEn:
        'The historian says: Chu was five thousand li across with a million men under arms, and lost its capital to a river. A great state is not destroyed by being small but by being scattered: King Huai went into Qin and did not come back, Qu Yuan was banished south of the river, and the court competed to make peace by ceding land. As Xunzi said: "The men of Chu make armour of shark hide and rhinoceros, hard as metal and stone; their steel from Wan is cruel as a wasp\'s sting; they are light and quick and fall like a whirlwind — and their army came to grief at Chuisha and Tang Mie died, and there was no other reason for it than that they did not care for the men below them."',
      verdictLostZh:
        '論曰:屈原既放,漁父曰:'
        + '「聖人不凝滯於物,而能與世推移。」'
        + '原曰:「安能以身之察察,受物之汶汶者乎!」'
        + '——**一國之亡,先亡其不肯同流者**。',
      verdictLostEn:
        'The historian says: when Qu Yuan had been banished, the fisherman said to him: "The sage is not held fast by things and can shift with the age." And Qu Yuan said: "How can a man who has kept himself clean take on the filth of things?" What a state loses first are the people who will not go along with it.',
    },
    qin: {
      defeat: {
        titleZh: '拔郢燒夷陵',
        titleEn: 'Ying Taken, Yiling Burnt',
        textZh:
          '起將數萬之師以與楚戰,'
          + '一戰而舉鄢郢,再戰而燒夷陵,'
          + '三戰而辱王之先人。\n\n'
          + '楚人震恐,東徙而不敢西向。\n\n'
          + '——秦置南郡於此,'
          + '自是江漢之粟入於關中,'
          + '而秦之國力始能兼支東西兩線。\n\n'
          + '其後司馬錯自隴西出蜀,'
          + '兩川之粟又入 ——'
          + '秦之能久戰,始於此二役。',
        textEn:
          'Bai Qi took some tens of thousands against Chu: one battle carried Yan and Ying, a second burnt Yiling, a third dishonoured the graves of the King\'s ancestors.\n\n'
          + 'The people of Chu were terrified, moved east, and did not dare face west again.\n\n'
          + 'Qin set up Nan commandery there, and from then on the grain of the Jiang and the Han came into Guanzhong, and Qin\'s resources could carry two fronts at once.\n\n'
          + 'Later Sima Cuo went out through Longxi into Shu, and the grain of the two river plains came in as well. Qin\'s capacity for long wars began with those two campaigns.',
      },
      verdictZh:
        '論曰:秦之並天下,人多稱其兵;'
        + '而其實勝於**糧** ——\n'
        + '取蜀而得成都之粟,取郢而得江漢之粟,'
        + '關中、巴蜀、南郡三地相接,'
        + '故能歲歲興師而國不匱。\n'
        + '**六國之敗,常敗於一戰;'
        + '秦之勝,勝於能連年**。',
      verdictEn:
        'The historian says: people credit Qin\'s conquest of the world to its soldiers; it was really won on grain. Taking Shu got it the harvests of Chengdu, taking Ying got it the harvests of the Jiang and the Han, and with Guanzhong, Ba-Shu and Nan commandery joined up it could put armies into the field year after year without running short. The six states were usually undone by a single battle; Qin won by being able to go on for years.',
      verdictLostZh:
        '論曰:白起言於秦王:'
        + '「是時楚王恃其國大,不卹其政,'
        + '而群臣相妒以功,諂諛用事,'
        + '良臣斥疏,百姓心離,城池不修 ——'
        + '故起所以得引兵深入,'
        + '多倍城邑,發梁焚舟以專民,'
        + '掠於郊野以足軍食。」',
      verdictLostEn:
        'The historian says: Bai Qi told the King of Qin: "At that time the King of Chu trusted in the size of his state and neglected its government; his ministers were jealous of one another\'s achievements and flatterers ran things; good ministers were pushed aside, the people\'s hearts had gone, and the walls and moats were unrepaired. That is why I was able to take an army deep in, leave walled towns behind me, break the bridges and burn the boats to fix my men\'s minds, and forage the countryside to feed them."',
    },
  },
  /* ── 戰國·閼與之戰 ────────────────────────────────────────────── */
  'scn-ws-yuyu': {
    zhao: {
      defeat: {
        titleZh: '兩鼠鬥於穴中',
        titleEn: 'Two Rats Fighting in a Hole',
        textZh:
          '秦伐韓,軍於閼與。'
          + '王召廉頗問:「可救不?」對曰:'
          + '「道遠險狹,難救。」'
          + '樂乘亦如之。\n\n'
          + '召趙奢問,奢曰:'
          + '「其道遠險狹,譬之猶兩鼠鬥於穴中,'
          + '將勇者勝。」\n\n'
          + '王乃令奢將。去邯鄲三十里而止,'
          + '令軍中曰:「有以軍事諫者死。」'
          + '留二十八日不行,復益增壘。\n\n'
          + '秦間來入,奢善食而遣之。'
          + '間以報秦將,秦將大喜曰:'
          + '「夫去國三十里而軍不行,乃增壘,'
          + '閼與非趙地也。」\n\n'
          + '——奢既已遣秦間,卷甲而趨之,'
          + '二日一夜至。',
        textEn:
          'Qin attacked Hann and camped at Yuyu. The King summoned Lian Po: "Can it be relieved?" — "The road is long, dangerous and narrow. Hard to relieve." Yue Cheng said the same.\n\n'
          + 'He summoned Zhao She, who said: "The road is long, dangerous and narrow. It is like two rats fighting in a hole: the braver commander wins."\n\n'
          + 'So the King gave She the command. He halted thirty li out of Handan and gave the order: "Anyone who advises me on military matters dies." He stayed twenty-eight days without moving and went on building his earthworks higher.\n\n'
          + 'A Qin spy came in and She fed him well and let him go. The spy reported, and the Qin commander was delighted: "Thirty li from his own capital and not moving, building earthworks — Yuyu is not Zhao\'s territory."\n\n'
          + 'And having let the spy go, She rolled up his armour and went for them, and arrived in two days and one night.',
      },
      verdictZh:
        '論曰:奢之勝,在**先教敵人替他做判斷** ——'
        + '築壘二十八日,不是備戰,是給間諜看的一份戰報。\n'
        + '至則許歷請諫,曰:'
        + '「先據北山上者勝,後至者敗。」'
        + '奢從之 —— 前令諫者死,而至此納諫,\n'
        + '**令之嚴以誤敵,令之弛以用人**,二者不相妨。\n'
        + '秦自商鞅以來,野戰之敗,以此為首。',
      verdictEn:
        'The historian says: Zhao She won by getting the enemy to draw his conclusion for him — twenty-eight days of earthworks was not preparation, it was a report written for a spy to read. On arrival Xu Li asked leave to advise: "Whoever holds the north hill first wins; whoever gets there second loses." She took the advice — having earlier made advising a capital offence. Strictness of orders to mislead an enemy and slackness of orders to use a man do not get in each other\'s way. It was the first serious defeat Qin had suffered in the field since Shang Yang.',
      verdictLostZh:
        '論曰:奢受賜為馬服君。'
        + '而其子括,即長平之將。'
        + '奢嘗與括言兵事,不能難,然不謂善。'
        + '母問其故,奢曰:'
        + '「兵,死地也,而括易言之。'
        + '使趙不將括即已,若必將之,破趙軍者必括也。」',
      verdictLostEn:
        'The historian says: Zhao She was rewarded with the title Lord of Mafu. His son was Zhao Kuo, the commander at Changping. She used to discuss war with Kuo and could not get the better of him in argument, and never said he was any good. His wife asked why, and She said: "War is where men die, and Kuo talks about it lightly. If Zhao does not make him a general, well and good; if it must, the man who destroys the armies of Zhao will be Kuo."',
    },
  },
  /* ── 戰國·齊湣王稱帝 ──────────────────────────────────────────── */
  'scn-ws-qimin': {
    qi: {
      defeat: {
        titleZh: '東帝',
        titleEn: 'Emperor of the East',
        textZh:
          '秦昭王自稱西帝,遣使立齊湣王為東帝。\n\n'
          + '蘇代自燕來,王曰:「善,子來!'
          + '秦使魏冉致帝,子以為何如?」\n\n'
          + '對曰:「王之問臣也卒,而患之所從生者微。'
          + '願王受之而勿稱也。\n'
          + '秦稱之,天下安之,王乃稱之,無後也。\n'
          + '且伐桀宋之利孰與伐秦之利?\n'
          + '——願王明釋帝以收天下之望,'
          + '倍約儐秦,勿使爭重,'
          + '而王以其間舉宋。此湯武之舉也。」\n\n'
          + '齊去帝復為王,秦亦去帝位。'
          + '——而後齊獨滅宋。\n\n'
          + '五國之兵遂西向,而齊為之的。',
        textEn:
          'King Zhao of Qin styled himself Emperor of the West and sent an envoy to make King Min of Qi Emperor of the East.\n\n'
          + 'Su Dai arrived from Yan, and the King said: "Good, you are here. Qin has sent Wei Ran with the title. What do you make of it?"\n\n'
          + 'He replied: "Your Majesty asks abruptly, and the trouble comes from something small. I would have you accept it and not use it.\n\n'
          + 'If Qin uses the title and the world accepts it, then Your Majesty may use it, and nothing comes of it.\n\n'
          + 'And which is worth more — attacking the tyrant of Song, or attacking Qin?\n\n'
          + 'Renounce the title publicly and collect the goodwill of the world; break the agreement and shut Qin out, and while they are busy competing, take Song. That is what Tang and Wu did."\n\n'
          + 'Qi gave up the title and went back to being a king, and Qin gave it up too. And then Qi swallowed Song by itself.\n\n'
          + 'And five armies turned west, and Qi was what they were aimed at.',
      },
      verdictZh:
        '論曰:湣王之亡,不亡於稱帝,亡於**去帝而仍獨吞宋** ——\n'
        + '去帝所以避天下之忌,滅宋所以自為天下之忌。\n'
        + '半途而止者,兩失之:'
        + '既不得帝之名,又盡收帝之怨。\n'
        + '**做一件招人恨的事,不如把它做全;'
        + '而更好的是根本不做**。',
      verdictEn:
        'The historian says: King Min was not destroyed by taking the imperial title but by giving it up and then swallowing Song by himself. Giving up the title was meant to avoid being the object of the world\'s suspicion; swallowing Song made him exactly that. Stopping halfway lost him both: he had neither the name of emperor nor any less of the resentment that goes with it. If you are going to do the thing that makes everyone hate you, better to do all of it — and better still not to do it.',
      verdictLostZh:
        '論曰:湣王亡至莒,楚使淖齒將兵救齊,因為齊相。'
        + '齒遂殺湣王,抽其筋,懸之廟梁,宿昔而死。'
        + '——**求救於外者,先問來者所欲**。',
      verdictLostEn:
        "The historian says: King Min fled to Ju, and Chu sent Nao Chi with troops to save Qi, and he was made chancellor of Qi. And Nao Chi killed the King, drew out his sinews and hung him from a temple beam, and he took a night and a day to die. Whoever asks outsiders for rescue should first ask what the rescuers want.",
    },
    yan: {
      defeat: {
        titleZh: '請自隗始',
        titleEn: 'Begin With Me',
        textZh:
          '燕昭王弔死問孤,與百姓同甘苦,'
          + '卑身厚幣以招賢者 ——'
          + '往見郭隗曰:'
          + '「齊因孤國之亂而襲破燕。'
          + '孤極知燕小力少,不足以報。'
          + '然得賢士與共國,以雪先王之恥,孤之願也。」\n\n'
          + '隗曰:「古之君人,有以千金求千里馬者,'
          + '三年不能得。涓人言於君曰:「請求之。」'
          + '君遣之,三月得千里馬,馬已死,'
          + '買其首五百金,反以報君。\n'
          + '君大怒。涓人曰:「死馬且買之五百金,'
          + '況生馬乎?馬今至矣!」\n'
          + '不期年,千里之馬至者三。\n\n'
          + '今王誠欲致士,先從隗始 ——'
          + '隗且見事,況賢於隗者乎?」\n\n'
          + '於是築宮而師之。樂毅自魏往,'
          + '鄒衍自齊往,劇辛自趙往,士爭趨燕。',
        textEn:
          'King Zhao of Yan condoled with the bereaved and enquired after orphans, shared what the people had, and humbled himself with rich presents to draw able men — and went to Guo Wei and said: "Qi took advantage of our disorder to break Yan. I know very well that Yan is small and weak and cannot avenge it. But to get able men and share the state with them and wipe out my predecessor\'s shame is what I want."\n\n'
          + 'Wei said: "There was a ruler of old who offered a thousand in gold for a thousand-li horse and could not get one in three years. An attendant said, \'Let me look for it.\' He was sent, and in three months found a thousand-li horse — dead — and bought its head for five hundred and came back with it.\n\n'
          + 'The ruler was furious. The attendant said: \'If you will pay five hundred for a dead horse, what will you pay for a live one? The horses are coming now.\' And within the year three thousand-li horses arrived.\n\n'
          + 'If Your Majesty really wants men, begin with me — if Wei is employed, what of men better than Wei?"\n\n'
          + 'So a residence was built and Guo Wei treated as a teacher. Yue Yi came from Wei, Zou Yan from Qi, Ju Xin from Zhao, and able men raced to get to Yan.',
      },
      verdictZh:
        '論曰:燕之報齊,始於一句「請自隗始」;'
        + '而其成也,在二十八年之後。\n'
        + '**弱國之興,不在得一良將,在使天下相信'
        + '此處值得來** ——\n'
        + '故買死馬之首者,買的不是馬,是消息。\n'
        + '然昭王一死,惠王疑毅,一戰而失七十城;'
        + '則所買之信,亦一君而盡。',
      verdictEn:
        'The historian says: Yan\'s revenge on Qi began with one sentence — "begin with me" — and came off twenty-eight years later. A weak state does not rise by acquiring one good commander but by making the world believe it is worth coming to. The man who bought the dead horse\'s head was not buying a horse; he was buying news. And when King Zhao died and King Hui distrusted Yue Yi, seventy cities went in a single campaign. The credit that had been bought was used up with one sovereign.',
      verdictLostZh:
        '論曰:昭王之於毅,二十八年不易其將;'
        + '惠王之於毅,一反間而易之。\n'
        + '**用人之難,不在識,在久**。',
      verdictLostEn:
        'The historian says: King Zhao kept Yue Yi in command for twenty-eight years without a change; King Hui replaced him on one piece of enemy misinformation. The hard part of employing men is not recognising them but keeping them.',
    },
  },
  /* ── 戰國·樂毅伐齊 ────────────────────────────────────────────── */
  'scn-ws-yueyi': {
    yan: {
      defeat: {
        titleZh: '下齊七十餘城',
        titleEn: 'Seventy Cities of Qi',
        textZh:
          '毅並護趙、楚、韓、魏、燕之兵以伐齊,'
          + '破之濟西。諸侯兵罷歸,而毅獨追至臨淄。\n\n'
          + '盡取齊寶財物祭器輸之燕。\n\n'
          + '而後**不急攻二城**:\n'
          + '修整燕軍,禁止侵掠,'
          + '求齊之逸民,顯而禮之,'
          + '寬其賦斂,除其暴令,修其舊政 ——'
          + '齊民喜悅。\n\n'
          + '圍莒、即墨三年不下。'
          + '或譖之曰:「毅之不下二城,'
          + '欲久仗兵威以服齊人,南面而王齊耳。」\n\n'
          + '昭王斬言者,而益尊毅。'
          + '——昭王卒,惠王立,'
          + '田單縱反間,遂以騎劫代毅。',
        textEn:
          'Yue Yi took command of the combined armies of Zhao, Chu, Hann, Wei and Yan against Qi and broke them west of the Ji. The other states\' contingents went home and Yue Yi alone pursued as far as Linzi.\n\n'
          + 'Everything of value in Qi — treasure, goods, sacrificial vessels — was taken to Yan.\n\n'
          + 'And then he did not press the last two cities. He put the Yan army in order and forbade plundering, sought out the men Qi had passed over and gave them honour and ceremony, lightened the taxes, repealed the harsh laws and restored the old administration — and the people of Qi were pleased with it.\n\n'
          + 'He besieged Ju and Jimo for three years without taking them. Somebody slandered him: "The reason Yue Yi will not take those two cities is that he wants to lean on his army\'s prestige long enough to subject the people of Qi and then face south as king of Qi himself."\n\n'
          + 'King Zhao beheaded the man who said it and honoured Yue Yi more than before. And King Zhao died, and King Hui came to the throne, and Tian Dan set the same story running again — and Qi Jie replaced Yue Yi.',
      },
      verdictZh:
        '論曰:毅之下七十城易,而收齊人之心難;'
        + '故三年不攻,非不能攻,是**攻之則七十城復叛**。\n'
        + '此戰國之中最深之一著,'
        + '而亦最易為讒者所用:\n'
        + '**凡以慢為策者,必被說成有二心**。\n'
        + '昭王能斬言者,惠王不能 ——'
        + '燕之得齊與失齊,皆在此一念。',
      verdictEn:
        'The historian says: taking seventy cities was the easy part and winning the people of Qi was not, so three years without an assault was not inability — an assault would have put all seventy back in revolt. It is the deepest stroke in the whole period and the easiest for a slanderer to work on: anyone whose policy is slowness will be described as disloyal. King Zhao could behead the man who said it and King Hui could not. Yan\'s gaining and losing of Qi both turn on that.',
      verdictLostZh:
        '論曰:毅奔趙,惠王使人讓之。'
        + '毅報書曰:「臣聞善作者不必善成,'
        + '善始者不必善終。\n'
        + '……臣聞古之君子,交絕不出惡聲;'
        + '忠臣去國,不潔其名。」',
      verdictLostEn:
        'The historian says: Yue Yi fled to Zhao, and King Hui sent a man to reproach him. He wrote back: "I have heard that a man good at beginning a thing need not be good at completing it, and that a good start need not have a good end... I have heard that the gentlemen of old, when a friendship ended, did not speak ill; and that a loyal minister leaving his state does not try to clear his own name."',
    },
  },
  /* ── 戰國·田單復國 ────────────────────────────────────────────── */
  'scn-ws-tiandan': {
    qi: {
      defeat: {
        titleZh: '火牛',
        titleEn: 'The Fire Oxen',
        textZh:
          '單既以反間去樂毅,乃縱言曰:'
          + '「吾唯懼燕人掘吾城外冢墓,僇先人,可為寒心。」'
          + '燕軍盡掘壟墓,燒死人。'
          + '即墨人從城上望見,皆涕泣,'
          + '俱欲出戰,怒自十倍。\n\n'
          + '乃收城中得千餘牛,為絳繒衣,畫以五彩龍文,'
          + '束兵刃於其角,而灌脂束葦於尾,燒其端。\n'
          + '鑿城數十穴,夜縱牛,壯士五千人隨其後。\n\n'
          + '牛尾熱,怒而奔燕軍,燕軍夜大驚。'
          + '牛尾炬火光明炫燿,燕軍視之皆龍文,'
          + '所觸盡死傷。\n\n'
          + '——七十餘城盡復為齊。',
        textEn:
          'Having got rid of Yue Yi by misinformation, Tian Dan set another story going: "The one thing I dread is the men of Yan digging up the graves outside our walls and dishonouring our ancestors. That would chill the heart." So the Yan army dug up all the grave mounds and burnt the dead. The people of Jimo watched from the walls and wept, and all of them wanted to go out and fight, and their rage was ten times what it had been.\n\n'
          + 'Then he collected a thousand-odd oxen in the city, dressed them in crimson silk painted with five-coloured dragon patterns, bound blades to their horns and fat-soaked reeds to their tails, and set the ends alight. Dozens of openings were cut in the wall, the oxen were loosed at night, and five thousand picked men followed them.\n\n'
          + 'The heat on their tails sent them raging into the Yan camp, and Yan panicked in the dark. In the glare of the burning tails the beasts seemed all dragon-pattern to them, and everything they touched was killed or maimed.\n\n'
          + 'And seventy-odd cities went back to Qi.',
      },
      verdictZh:
        '論曰:單之復國,凡三術:'
        + '一去其將,二**激其民**,三驚其軍。\n'
        + '而中間一著最要:'
        + '燕人掘墓,非燕之本意,是單使之;\n'
        + '**守城之難,難在守者不肯死;'
        + '而使守者肯死,不在賞,在恨**。\n'
        + '故七十城之復,始於一堆被燒的骨。',
      verdictEn:
        'The historian says: Tian Dan recovered his country by three devices — removing their commander, enraging his own people, and stampeding their army. The middle one mattered most. The men of Yan did not think of digging up graves; Tian Dan made them do it. The hard part of holding a city is that the defenders will not die for it, and what makes them willing is not reward but hatred. Seventy cities came back because of a heap of burnt bones.',
      verdictLostZh:
        '論曰:齊既復國,迎襄王於莒。'
        + '而王孫賈之母嘗謂賈曰:'
        + '「女朝出而晚來,則吾倚門而望;'
        + '女暮出而不還,則吾倚閭而望。'
        + '女今事王,王走,女不知其處,女尚何歸?」'
        + '——賈遂入市呼曰:'
        + '「淖齒亂齊國,殺閔王,欲與我誅者袒右!」'
        + '市人從者四百人。',
      verdictLostEn:
        'The historian says: with the country recovered, King Xiang was brought back from Ju. And Wangsun Jia\'s mother had once said to him: "When you go out in the morning and are late back, I stand at the door and watch for you; when you go out at evening and do not come home, I stand at the gate of the lane and watch. Now you serve the King, and the King has fled and you do not know where he is — what are you coming home for?" So Jia went into the marketplace and shouted: "Nao Chi has thrown Qi into chaos and murdered King Min. Whoever will help me punish him, bare your right shoulder!" Four hundred men in the market followed him.',
    },
  },
  /* ── 戰國·邯鄲之戰 ────────────────────────────────────────────── */
  'scn-ws-handan': {
    zhao: {
      defeat: {
        titleZh: '穎脫而出',
        titleEn: 'The Point Comes Clear Through',
        textZh:
          '長平既敗,秦圍邯鄲。'
          + '平原君約與食客門下有勇力文武備具者二十人偕,'
          + '得十九人,餘無可取者。\n\n'
          + '毛遂自薦。平原君曰:'
          + '「夫賢士之處世也,譬若錐之處囊中,'
          + '其末立見。今先生處勝之門下三年於此矣,'
          + '左右未有所稱誦,'
          + '勝未有所聞,是先生無所有也。」\n\n'
          + '毛遂曰:「臣乃今日請處囊中耳。'
          + '使遂蚤得處囊中,乃穎脫而出,非特其末見而已。」\n\n'
          + '——至楚,日出而言之,日中不決。'
          + '毛遂按劍歷階而上,'
          + '楚王遂許歃血於堂上。',
        textEn:
          'After Changping, Qin invested Handan. The Lord of Pingyuan meant to take twenty of his retainers who were complete in courage and in civil and military accomplishment, and found nineteen, and there was nobody else worth taking.\n\n'
          + 'Mao Sui put himself forward. The Lord of Pingyuan said: "An able man in the world is like an awl in a bag — the point shows at once. You have been in my household three years now, my people have said nothing about you and I have heard nothing, which means there is nothing there."\n\n'
          + 'And Mao Sui said: "I am asking today to be put in the bag. Had I been in the bag earlier, the whole point would have come clear through, not just the tip of it."\n\n'
          + 'In Chu they talked from sunrise to midday and nothing was decided. Mao Sui put his hand to his sword, went up the steps one at a time — and the King of Chu agreed to smear the blood of the covenant there in the hall.',
      },
      verdictZh:
        '論曰:邯鄲之圍,趙以一城當秦之全力三年 ——'
        + '而其解也,不在趙,在**楚與魏肯來**。\n'
        + '長平之後,山東諸國本已各自求全;'
        + '其復合者,以魯仲連一言:'
        + '「彼秦者,棄禮義而上首功之國也。'
        + '彼即肆然而為帝,則連有蹈東海而死耳,'
        + '吾不忍為之民也。」\n\n'
        + '**利可以散人,懼可以合人**:'
        + '而使懼者成形的,是長平那四十萬。',
      verdictEn:
        'The historian says: at Handan, Zhao held one city against the whole weight of Qin for three years — and the siege was lifted not by Zhao but by Chu and Wei being willing to come. After Changping the states east of the mountains were each looking to their own safety; what brought them together again was a sentence of Lu Zhonglian\'s: "That Qin is a state which has thrown away rites and right conduct and puts severed heads first. If it becomes emperor as it pleases, then I shall walk into the eastern sea and drown; I cannot bear to be its subject." Interest scatters men and fear joins them — and what gave the fear a shape was those four hundred thousand at Changping.',
      verdictLostZh:
        '論曰:信陵君竊符救趙,侯嬴為謀,'
        + '朱亥椎殺晉鄙,遂奪其軍。'
        + '嬴曰:「臣宜從,老不能。'
        + '請數公子行日,以至晉鄙軍之日,'
        + '北鄉自剄,以送公子。」'
        + '——果自剄。',
      verdictLostEn:
        'The historian says: the Lord of Xinling stole the tally to relieve Zhao. Hou Ying planned it and Zhu Hai killed Jin Bi with an iron mace and took over his army. Hou Ying had said: "I ought to go with you and am too old. Let me count the days of your journey, and on the day you reach Jin Bi\'s camp I shall face north and cut my throat to see you off." And he did.',
    },
    qin: {
      defeat: {
        titleZh: '邯鄲實未易攻',
        titleEn: 'Handan Is Not Easy to Attack',
        textZh:
          '長平之後,武安君欲乘勝滅趙。'
          + '應侯言於王曰:「秦兵勞,請許韓趙之割地以和,'
          + '且休士卒。」王聽之。\n\n'
          + '——九月,復發兵圍邯鄲。'
          + '武安君病,不行。\n\n'
          + '王自命之,起曰:'
          + '「邯鄲實未易攻也。'
          + '且諸侯救日至,彼諸侯怨秦之日久矣。\n'
          + '今秦雖破長平軍,而秦卒死者過半,國內空。'
          + '遠絕河山而爭人國都,'
          + '趙應其內,諸侯攻其外,破秦軍必矣。」\n\n'
          + '——王齕、鄭安平相繼敗,'
          + '安平以兵二萬降趙。',
        textEn:
          'After Changping the Lord of Wu\'an wanted to press on and finish Zhao. The Marquis of Ying told the King: "Our troops are worn out. Accept the territory Hann and Zhao are offering and make peace, and rest the men." The King agreed.\n\n'
          + 'And in the ninth month troops went out again to invest Handan. The Lord of Wu\'an was ill and did not go.\n\n'
          + 'When the King ordered him in person, Bai Qi said: "Handan really is not easy to attack. And relief from the other states arrives daily; they have resented Qin for a long time.\n\n'
          + 'Qin has destroyed the army at Changping, and more than half our own men are dead and the country is empty. To cross rivers and mountains and contend for another state\'s capital, with Zhao answering from inside and the other states attacking from outside, is certain destruction for our army."\n\n'
          + 'Wang He and Zheng Anping were beaten one after another, and Anping surrendered to Zhao with twenty thousand men.',
      },
      verdictZh:
        '論曰:秦之失邯鄲,失於**戰勝之後的那一個月** ——'
        + '長平既克,不乘之而許和,'
        + '既許和而復攻,則趙已得喘息,而諸侯已得聚謀。\n'
        + '**兵之機,不在勝,在勝後幾日之內**。\n'
        + '應侯之言,出於忌武安君之功;'
        + '一將相之私,遲秦統一者三十餘年。',
      verdictEn:
        'The historian says: Qin lost Handan in the month after its victory. Having broken Changping it did not follow through but made peace, and having made peace it attacked again — by which time Zhao had got its breath and the other states had had time to confer. The opportunity in war lies not in winning but in the few days after winning. And the Marquis of Ying gave that advice out of jealousy of the Lord of Wu\'an\'s achievement. One quarrel between a chancellor and a general put Qin\'s unification back thirty years.',
      verdictLostZh:
        '論曰:秦王怒,免武安君為士伍,遷之陰密。'
        + '行至杜郵,賜之劍。'
        + '——**先不用其言,後責其不行**,古今同患。',
      verdictLostEn:
        'The historian says: the King of Qin in his anger reduced the Lord of Wu\'an to the ranks and banished him to Yinmi, and when he had got as far as Duyou sent him a sword. First refusing a man\'s advice and then blaming him for not carrying out the opposite is an old complaint.',
    },
  },
  /* ── 戰國七雄·逐鹿 ────────────────────────────────────────────── */
  'scn-ws-seven': {
    qin: {
      defeat: {
        titleZh: '爭於氣力',
        titleEn: 'An Age That Contends by Strength',
        textZh:
          '韓非曰:「上古競於道德,'
          + '中世逐於智謀,當今爭於氣力。」\n\n'
          + '——七國並立,無一國可以不變法而存:'
          + '魏有李悝,楚有吳起,'
          + '韓有申不害,齊有鄒忌,'
          + '趙有武靈王之胡服,燕有樂毅,'
          + '而秦有商鞅。\n\n'
          + '所異者:六國之法,行於一君之世;'
          + '而秦之法,行於六君之世。\n\n'
          + '孝公用鞅,惠王殺鞅而不廢其法;'
          + '武王、昭王、孝文、莊襄,'
          + '至於始皇,凡百三十年,國策一也。',
        textEn:
          'Han Fei wrote: "High antiquity competed in virtue, the middle age contended in cleverness, and the present age contends by strength."\n\n'
          + 'Seven states stood together and not one of them could survive without reforming its laws: Wei had Li Kui, Chu had Wu Qi, Hann had Shen Buhai, Qi had Zou Ji, Zhao had King Wuling and his nomad dress, Yan had Yue Yi — and Qin had Shang Yang.\n\n'
          + 'The difference: in the six states the reforms lasted one reign. In Qin they lasted six.\n\n'
          + 'Duke Xiao employed Shang Yang; King Hui killed Shang Yang and kept his laws; and through Kings Wu, Zhao, Xiaowen and Zhuangxiang down to the First Emperor — a hundred and thirty years — the policy of the state was one policy.',
      },
      verdictZh:
        '論曰:七雄之世,人才無定所,'
        + '而**制度有定所** ——\n'
        + '商鞅、張儀、范雎、呂不韋、李斯,'
        + '無一秦人,而皆終於秦。\n'
        + '六國非無變法,是**變而不能傳**:'
        + '吳起死於楚悼王之喪,而楚法即廢;'
        + '申不害死而韓不用術。\n'
        + '**一世之強,人為之;數世之強,法為之**。',
      verdictEn:
        'The historian says: in the age of the seven powers talent had no fixed home and institutions did. Shang Yang, Zhang Yi, Fan Ju, Lü Buwei and Li Si were none of them men of Qin, and all of them ended in Qin. It was not that the six states did not reform — their reforms could not be handed on. Wu Qi was killed at King Dao of Chu\'s funeral and the laws of Chu lapsed with him; Shen Buhai died and Hann stopped using his methods. One generation of strength is made by men; several generations of it are made by institutions.',
      verdictLostZh:
        '論曰:蘇秦說六國,佩六國相印;'
        + '張儀相秦,而以連橫解之。'
        + '二人同出鬼谷,而所事不同 ——'
        + '**戰國之士無國,惟有主** 。',
      verdictLostEn:
        "The historian says: Su Qin talked the six states into an alliance and wore the chancellor's seal of all six; Zhang Yi was chancellor of Qin and undid it with the horizontal league. The two came from the same teacher and served opposite sides. The wandering advisers of that age had no country, only an employer.",
    },
  },
  /* ── 戰國·秦滅六國 ────────────────────────────────────────────── */
  'scn-ws-qin-unify': {
    qin: {
      defeat: {
        titleZh: '亡三十萬金',
        titleEn: 'Three Hundred Thousand in Gold',
        textZh:
          '尉繚說秦王曰:「以秦之彊,諸侯譬如郡縣之君,'
          + '臣但恐諸侯合從,翕而出不意 ——'
          + '此乃智伯、夫差、湣王之所以亡也。\n'
          + '願大王毋愛財物,賂其豪臣,以亂其謀,'
          + '不過亡三十萬金,則諸侯可盡。」\n\n'
          + '秦王從其計。\n\n'
          + '——趙有李牧,秦不能過。'
          + '乃多與趙王寵臣郭開金,為反間,'
          + '言牧欲反。趙王使人代之,牧不受命,'
          + '趙使人微捕得李牧,斬之。\n\n'
          + '三月而邯鄲下。',
        textEn:
          'Wei Liao advised the King of Qin: "With Qin as strong as it is, the feudal lords are like the governors of your commanderies. My one fear is that they combine and come at you together unexpectedly — that is how Zhi Bo, Fuchai and King Min were destroyed.\n\n'
          + 'I would have Your Majesty not begrudge money: bribe their powerful ministers and throw their plans into confusion. It will not cost more than three hundred thousand in gold, and the feudal lords can all be had."\n\n'
          + 'The King adopted the plan.\n\n'
          + 'Zhao had Li Mu and Qin could not get past him. So a great deal of gold went to Guo Kai, the favourite of the King of Zhao, to put it about that Li Mu meant to rebel. The King sent a man to replace him, Li Mu refused the order, and men were sent to arrest him quietly, and he was beheaded.\n\n'
          + 'Handan fell three months later.',
      },
      verdictZh:
        '論曰:秦之滅六國,兵不過六;'
        + '而金遍於六國之朝 ——\n'
        + '李牧斬於郭開,趙亡;'
        + '齊王建不備不助,秦兵至而降;'
        + '燕殺荊軻之後,獻太子丹之首而終不免。\n'
        + '**破一國之城,以兵;破一國之朝,以金** ——'
        + '三十萬金者,尉繚所計之最廉一戰。',
      verdictEn:
        'The historian says: Qin destroyed the six states with no more than six campaigns, and its gold was all over their courts. Li Mu was beheaded on Guo Kai\'s word and Zhao fell; King Jian of Qi neither armed nor helped anyone and surrendered when Qin arrived; Yan killed Jing Ke\'s patron and sent Prince Dan\'s head and was destroyed anyway. Cities are broken with soldiers and courts with money — three hundred thousand in gold was the cheapest campaign Wei Liao ever costed.',
      verdictLostZh:
        '論曰:王翦伐楚,請美田宅園池甚眾。'
        + '或曰:「將軍之乞貸,亦已甚矣!」'
        + '翦曰:「不然。夫秦王怚而不信人。'
        + '今空秦國甲士而專委於我,'
        + '我不多請田宅為子孫業以自堅,'
        + '顧令秦王坐而疑我邪?」',
        verdictLostEn:
        'The historian says: setting out against Chu, Wang Jian asked for a great many fine fields, houses, gardens and ponds. Somebody said, "Surely the general is begging rather hard." And Jian said: "Not at all. The King of Qin is coarse-grained and does not trust people. He has now emptied Qin of soldiers and put them entirely in my hands. If I do not ask for a great deal of land and property as an estate for my descendants, to make myself solid, am I to have him sitting at home suspecting me?"',
    },
    qi: {
      defeat: {
        titleZh: '松柏之間',
        titleEn: 'Among the Pines and Cypresses',
        textZh:
          '齊王建立四十餘年不受兵。'
          + '君王后賢,事秦謹,與諸侯信 ——'
          + '故齊亦東邊海上,秦日夜攻三晉、燕、楚,'
          + '五國各自救於秦,以故王建立四十餘年不受兵。\n\n'
          + '——五國既亡,秦兵卒入臨淄,民莫敢格者。\n\n'
          + '王建遂降,遷之共,處松柏之間,餓而死。\n\n'
          + '齊人怨王建不早與諸侯合從攻秦,'
          + '聽奸臣賓客以亡其國,'
          + '歌之曰:「松耶?柏耶?'
          + '住建共者客耶?」',
        textEn:
          'King Jian of Qi reigned over forty years without being attacked. The Queen Dowager was able, served Qin scrupulously and kept faith with the other states — so Qi sat on the eastern sea while Qin worked day and night on the three Jin states, Yan and Chu, and each of the five looked to its own defence. That is how King Jian reigned forty years untouched.\n\n'
          + 'And when the five were gone, Qin\'s troops walked into Linzi and nobody dared resist.\n\n'
          + 'King Jian surrendered, was moved to Gong, put among the pines and cypresses, and starved to death.\n\n'
          + 'The people of Qi resented his not having joined the others against Qin in good time, and his listening to treacherous ministers and hangers-on until the state was lost, and they made a song of it: "Was it the pines? Was it the cypresses? Or was it the guests who put Jian in Gong?"',
      },
      verdictZh:
        '論曰:齊四十年不受兵,而其亡最速 ——'
        + '**不受兵者,非無敵,是輪到得晚**。\n'
        + '王建之過,不在降,在四十年之中'
        + '未嘗一日以他國之亡為己事。\n'
        + '故蘇洵論六國曰:'
        + '「與嬴而不助五國也。五國既喪,齊亦不免矣。」',
      verdictEn:
        'The historian says: Qi went forty years without being attacked and fell fastest of all — not being attacked does not mean having no enemy; it means your turn is later. King Jian\'s fault was not the surrender but that in forty years he never once treated another state\'s destruction as his own business. As Su Xun said of the six states: "Qi sided with Qin and would not help the other five. Once the five were gone, Qi could not escape either."',
      verdictLostZh:
        '論曰:六國破滅,非兵不利,戰不善,弊在賂秦。'
        + '賂秦而力虧,破滅之道也。'
        + '——**以地事秦,猶抱薪救火,薪不盡,火不滅**。',
      verdictLostEn:
        'The historian says: the six states were destroyed not because their weapons were poor or their fighting bad, but by the bribing of Qin. Bribing Qin drained them, and that was the road to destruction. Serving Qin with territory is carrying firewood to put out a fire: while the wood lasts, the fire does not go out.',
    },
  },
  /* ── 大澤鄉起義 ───────────────────────────────────────────────── */
  'scn-ch-daze': {
    zhangchu: {
      defeat: {
        titleZh: '王侯將相寧有種乎',
        titleEn: 'Are Kings and Nobles Born to It?',
        textZh:
          '二世元年七月,發閭左適戍漁陽九百人,'
          + '屯大澤鄉。會天大雨,道不通,'
          + '度已失期 —— 失期,法皆斬。\n\n'
          + '陳勝、吳廣乃謀曰:'
          + '「今亡亦死,舉大計亦死;'
          + '等死,死國可乎?」\n\n'
          + '乃丹書帛曰「陳勝王」,置人所罾魚腹中。'
          + '又間令吳廣之次所旁叢祠中,'
          + '夜篝火,狐鳴呼曰:「大楚興,陳勝王!」\n\n'
          + '召令徒屬曰:'
          + '「公等遇雨,皆已失期,失期當斬。'
          + '藉第令毋斬,而戍死者固十六七。\n'
          + '且壯士不死即已,死即舉大名耳 ——'
          + '**王侯將相寧有種乎!**」',
        textEn:
          'In the seventh month of the First Year of the Second Emperor, nine hundred men from the poor side of the villages were sent to garrison Yuyang and camped at Dazexiang. Heavy rain came, the roads were impassable, and they reckoned they were already late — and being late meant execution under the law.\n\n'
          + 'So Chen Sheng and Wu Guang consulted: "We die if we run and we die if we attempt something great. Since we die either way, may we die for a country?"\n\n'
          + 'They wrote "Chen Sheng shall be king" on silk in cinnabar and put it inside a fish somebody had netted. And Wu Guang was quietly sent to the shrine in the grove beside the camp to light a fire in a basket at night and call out in a fox\'s voice: "Great Chu shall rise! Chen Sheng shall be king!"\n\n'
          + 'Then they called the conscripts together: "You have all been caught by the rain and are all late, and being late means beheading. And even suppose we are not beheaded — six or seven in ten of those sent to the frontier die there anyway.\n\n'
          + 'A brave man either does not die, or dies making a great name. Are kings and nobles born to it?"',
      },
      verdictZh:
        '論曰:陳涉之起,不以其眾,'
        + '以其**說出了那一句話** ——\n'
        + '自三代以來,受命之說在天;'
        + '至大澤鄉,乃在人。\n'
        + '故涉雖六月而亡,'
        + '而秦亦以之亡;'
        + '天下之豪傑,皆自此知**可以試**。\n'
        + '太史公列之於世家,曰:'
        + '「桀紂失其道而湯武作,'
        + '周失其道而春秋作。'
        + '陳涉雖已死,其所置遣侯王將相竟亡秦,'
        + '由涉首事也。」',
      verdictEn:
        'The historian says: Chen She did not rise on numbers but on having said that sentence. Since the Three Dynasties the mandate had been a matter of Heaven; at Dazexiang it became a matter of men. So although he lasted six months and Qin outlasted him, Qin died of it too — every bold man in the empire learned from him that it could be attempted. The Grand Historian put him among the hereditary houses, and wrote: "Jie and Zhou lost the way and Tang and Wu arose; Zhou lost the way and the Spring and Autumn Annals were written. Chen She was dead, and the kings, nobles and commanders he had installed did in the end destroy Qin, because he had begun it."',
      verdictLostZh:
        '論曰:涉少時嘗與人傭耕,輟耕之壟上,'
        + '悵恨久之,曰:「苟富貴,無相忘。」'
        + '傭者笑而應曰:「若為傭耕,何富貴也?」'
        + '涉太息曰:「嗟乎,燕雀安知鴻鵠之志哉!」\n\n'
        + '——及為王,故人來,言其故情。'
        + '或說陳王曰:「客愚無知,顓妄言,輕威。」'
        + '陳王斬之。諸陳王故人皆自引去,'
        + '由是無親陳王者。',
      verdictLostEn:
        'The historian says: as a young man Chen She was a hired ploughman, and one day he stopped at the field-edge and stood a long while bitter and dissatisfied, and said: "If any of us gets on in the world, let him not forget the rest." The others laughed: "You are a hired ploughman. What getting on?" And She sighed: "Ah — how should sparrows understand what the swan intends?"\n\n'
          + 'And when he was king, an old acquaintance came and talked about the old days. Somebody said to him, "This guest is an ignorant man who talks nonsense and cheapens your authority," and the King had him beheaded. All his old acquaintances took themselves off, and after that nobody was close to him.',
    },
    qin: {
      defeat: {
        titleZh: '關東群盜',
        titleEn: 'Bandits East of the Pass',
        textZh:
          '謁者使東方來,以反者聞二世。'
          + '二世怒,下之吏。\n\n'
          + '後使者至,上問之,'
          + '對曰:「群盜,郡守尉方逐捕,今盡得,不足憂。」'
          + '上悅。\n\n'
          + '——叔孫通亦曰:'
          + '「此特群盜鼠竊狗盜耳,何足置之齒牙間!'
          + '郡守尉今捕論,何足憂?」\n\n'
          + '二世喜,盡問諸生。'
          + '諸生或言反,或言盜。'
          + '於是二世令御史案諸生言反者下吏,非所宜言。'
          + '——言盜者皆罷之,賜通帛二十匹,衣一襲,拜為博士。\n\n'
          + '通已出宮,反舍,諸生曰:'
          + '「先生何言之諛也?」'
          + '通曰:「公不知也,我幾不脫於虎口!」'
          + '乃亡去。',
        textEn:
          'An usher came back from the east and reported the rising to the Second Emperor. The Emperor was angry and handed him to the law officers.\n\n'
          + 'The next messenger, when asked, said: "A gang of bandits. The commandery administrators and commandants are running them down and have taken the lot. Nothing to worry about." And the Emperor was pleased.\n\n'
          + 'Shusun Tong said the same: "These are common thieves, rats and dogs. Why should they be worth a word between the teeth? The administrators and commandants are arresting and sentencing them now. Where is the worry?"\n\n'
          + 'The Emperor was delighted and put the question to all the scholars. Some said rebellion and some said banditry. So he had the censors take down the names of those who had said rebellion and hand them to the law officers, for having said what should not be said — and dismissed those who had said banditry, and gave Shusun Tong twenty bolts of silk and a suit of clothes and made him an Academician.\n\n'
          + 'Once out of the palace and back at his lodgings, the other scholars said, "How could you flatter him like that?" And Tong said: "You gentlemen do not understand. I very nearly did not get out of the tiger\'s mouth." And he fled.',
      },
      verdictZh:
        '論曰:秦之亡,不亡於陳涉之九百人,'
        + '亡於**朝廷不許人說「反」字**。\n'
        + '言反者下吏,言盜者受賞;'
        + '於是二世所聞,皆天下無事。\n'
        + '**上不聞其實,則無論其兵幾何,皆不及用** ——'
        + '章邯之師出時,關東已數十萬眾矣。',
      verdictEn:
        'The historian says: Qin was not destroyed by Chen She\'s nine hundred men but by a court where the word "rebellion" could not be spoken. Those who said rebellion went to the law officers and those who said banditry were rewarded — so everything that reached the Second Emperor was that all was quiet in the empire. When the throne does not hear the facts, it does not matter how many soldiers it has; they arrive too late. By the time Zhang Han\'s army marched, there were already hundreds of thousands under arms east of the pass.',
      verdictLostZh:
        '論曰:趙高指鹿為馬,問左右,'
        + '左右或默,或言馬以阿順趙高,'
        + '或言鹿者,高因陰中諸言鹿者以法。'
        + '後群臣皆畏高。'
        + '——**與其說是試探,不如說是點名**。',
      verdictLostEn:
        'The historian says: Zhao Gao presented a deer and called it a horse, and asked the court. Some said nothing; some said horse to go along with him; and those who said deer he afterwards destroyed quietly by process of law. After that the whole court was afraid of him. It was less a test than a roll-call.',
    },
  },
  /* ── 鉅鹿之戰 ─────────────────────────────────────────────────── */
  'scn-ch-julu': {
    chu: {
      defeat: {
        titleZh: '破釜沉船',
        titleEn: 'Sink the Boats, Break the Cauldrons',
        textZh:
          '宋義行至安陽,留四十六日不進。'
          + '曰:「夫搏牛之蝱不可以破蟣蝨。'
          + '今秦攻趙,戰勝則兵罷,我承其敝;'
          + '不勝,則我引兵鼓行而西,必舉秦矣。」\n\n'
          + '時天寒大雨,士卒凍飢。'
          + '項羽曰:「今歲飢民貧,士卒食芋菽,軍無見糧,'
          + '乃飲酒高會 —— 不引兵渡河因趙食,'
          + '與趙并力攻秦,乃曰『承其敝』。'
          + '夫以秦之彊,攻新造之趙,'
          + '其勢必舉趙。趙舉而秦彊,何敝之承!」\n\n'
          + '——晨朝上將軍宋義,即其帳中斬宋義頭。\n\n'
          + '乃悉引兵渡河,皆沉船,破釜甑,燒廬舍,'
          + '持三日糧,以示士卒必死,無一還心。',
        textEn:
          'Song Yi got as far as Anyang and stayed forty-six days without moving. He said: "The gadfly that bites an ox cannot kill a louse. Qin is attacking Zhao; if Qin wins, its army will be worn out and we take it at its worst; if Qin loses, we beat the drums and march west and Qin is ours."\n\n'
          + 'It was cold and pouring with rain and the soldiers were freezing and hungry. Xiang Yu said: "It is a lean year and the people are poor; the men are eating taro and beans and there is no grain in the camp — and he is holding drinking parties. Instead of crossing the river to live off Zhao and joining Zhao to attack Qin, he talks about taking them at their worst. With Qin as strong as it is, attacking a newly re-founded Zhao, the outcome is certain: Zhao falls. And with Zhao fallen Qin is stronger than ever. What worst is there to take them at?"\n\n'
          + 'At the morning report he cut off Song Yi\'s head in his own tent.\n\n'
          + 'Then he took the whole army across the river and sank the boats, broke the cooking-pots and steamers, burned the huts, and carried three days\' rations — to show the men they were to die and that no one was going back.',
      },
      verdictZh:
        '論曰:破釜沉船,非勇,是**算**:\n'
        + '諸侯十餘壁莫敢縱兵,'
        + '楚軍若有退路,則亦一壁而已。\n'
        + '斷其退,則三日之糧即三日之期,'
        + '期內不勝則死 ——'
        + '於是無不一以當十。\n'
        + '戰罷,項羽召見諸侯將,'
        + '入轅門,無不膝行而前,莫敢仰視。\n'
        + '**諸侯之服,不服於楚之強,服於楚之肯死**。',
      verdictEn:
        'The historian says: sinking the boats was not bravery but arithmetic. A dozen allied camps sat there and none dared loose their troops; had Chu kept a line of retreat it would have been another such camp. Cut the retreat and three days\' rations become a three-day deadline, and failing to win inside it means dying — and every man was worth ten. After the battle Xiang Yu summoned the allied commanders, and every one of them came through the camp gate on his knees and none dared look up. What they submitted to was not Chu\'s strength but Chu\'s willingness to die.',
      verdictLostZh:
        '論曰:章邯既降,項羽立之為雍王。'
        + '而諸侯吏卒異時徭使屯戍過秦中,秦中吏卒遇之多無狀;'
        + '及秦軍降諸侯,諸侯吏卒乘勝多奴虜使之,輕折辱秦吏卒。\n'
        + '秦吏卒多竊言曰:「章將軍等詐吾屬降諸侯,'
        + '今能入關破秦,大善;'
        + '即不能,諸侯虜吾屬而東,秦必盡誅吾父母妻子。」\n\n'
        + '——於是楚軍夜擊阬秦卒二十餘萬人新安城南。',
      verdictLostEn:
        'The historian says: Zhang Han surrendered and Xiang Yu made him King of Yong. But the allied soldiers had in earlier years been sent through Qin territory on corvée and garrison duty, and the Qin officers and men had treated them badly; and now that the Qin army had surrendered, the allied soldiers in their victory used them like slaves and abused them freely.\n\n'
          + 'And the Qin soldiers said to one another quietly: "General Zhang and the rest tricked us into surrendering. If they can get through the pass and destroy Qin, well and good; if not, the allies will drag us east as prisoners and Qin will slaughter our parents, wives and children to the last."\n\n'
          + 'So the Chu army attacked by night and buried two hundred thousand Qin soldiers south of the walls of Xin\'an.',
    },
    qin: {
      defeat: {
        titleZh: '章邯之降',
        titleEn: 'Zhang Han Surrenders',
        textZh:
          '章邯以驪山刑徒破周文、殺陳勝、滅魏咎、斬項梁,'
          + '所向皆克 —— 秦之最後一支軍。\n\n'
          + '而鉅鹿既敗,邯使人見二世,'
          + '趙高不見,有不信之心。\n\n'
          + '邯恐,使長史欣請事。'
          + '留司馬門三日,趙高不見。'
          + '欣恐,亡去。高使人追之,不及。\n\n'
          + '欣還報曰:「趙高用事於中,'
          + '將軍有功亦誅,無功亦誅。」\n\n'
          + '陳餘亦遺邯書曰:'
          + '「白起、蒙恬,身死不見容於秦。'
          + '今將軍為秦將三歲矣,所亡失以十萬數,'
          + '而諸侯並起滋益多。\n'
          + '……何不還兵與諸侯為從,南面稱孤?」\n\n'
          + '邯遂降。',
        textEn:
          'Zhang Han had broken Zhou Wen with convict labourers from Mount Li, killed Chen Sheng, destroyed Wei Jiu and killed Xiang Liang — he won everywhere. He was the last army Qin had.\n\n'
          + 'And after the defeat at Julu he sent a man to the Second Emperor, and Zhao Gao would not receive him, and was inclined not to believe him.\n\n'
          + 'Alarmed, Han sent his chief clerk Sima Xin to make a report. Xin waited three days at the Major\'s Gate and Zhao Gao would not see him. Frightened, he ran; Gao sent men after him and they missed him.\n\n'
          + 'Xin got back and reported: "Zhao Gao is running things at court. If the general has successes he will be executed, and if he has none he will be executed."\n\n'
          + 'And Chen Yu wrote to Han: "Bai Qi and Meng Tian — Qin had no room for either of them and both died. You have been a general of Qin three years now; your losses run into hundreds of thousands and the risings multiply... Why not turn your army round, join the allies, face south and call yourself a prince?"\n\n'
          + 'And Han surrendered.',
      },
      verdictZh:
        '論曰:秦之亡,兵不先亡,將先亡 ——'
        + '而將之亡,不由敵,由其朝。\n'
        + '**「有功亦誅,無功亦誅」八字,'
        + '足以解散任何一支軍隊**。\n'
        + '章邯降而秦之關中無兵;'
        + '關中無兵而子嬰係頸以組,白馬素車,'
        + '奉天子璽符,降軹道旁 ——'
        + '自始皇二十六年並天下,至此十五年。',
      verdictEn:
        'The historian says: Qin\'s armies did not go first; its commanders did — and not to the enemy but to its own court. "Successes and he is executed, no successes and he is executed" is enough by itself to dissolve any army in the world. Zhang Han surrendered and Guanzhong had no troops; and with no troops in Guanzhong, Ziying put a cord round his neck, came in a plain carriage with white horses, and handed over the imperial seals beside the Zhi road. Fifteen years after the First Emperor united the world.',
      verdictLostZh:
        '論曰:賈誼曰:「一夫作難而七廟隳,'
        + '身死人手,為天下笑者,何也?'
        + '——仁義不施,而攻守之勢異也。」',
      verdictLostEn:
        'The historian says: Jia Yi wrote: "One man raised a difficulty and the seven ancestral temples came down; the ruler died at another\'s hands and became the laughing-stock of the world. Why? Because humanity and right were not practised, and because the conditions of attack and of holding what you have are not the same."',
    },
  },
  /* ── 楚漢·還定三秦 ────────────────────────────────────────────── */
  'scn-ch-sanqin': {
    han: {
      defeat: {
        titleZh: '國士無雙',
        titleEn: 'No Second Man Like Him',
        textZh:
          '信度何等已數言上,上不我用,即亡。'
          + '何聞信亡,不及以聞,自追之。'
          + '人有言上曰:「丞相何亡。」'
          + '上大怒,如失左右手。\n\n'
          + '居一二日,何來謁上。上且怒且喜,'
          + '罵何曰:「若亡,何也?」\n'
          + '何曰:「臣不敢亡也,臣追亡者。」'
          + '「若所追者誰?」曰:「韓信也。」\n\n'
          + '上復罵曰:「諸將亡者以十數,'
          + '公無所追;追信,詐也。」\n\n'
          + '何曰:「諸將易得耳。'
          + '至如信者,國士無雙。\n'
          + '王必欲長王漢中,無所事信;'
          + '必欲爭天下,非信無所與計事者。」',
        textEn:
          'Han Xin reckoned that Xiao He had spoken for him several times and the King was not going to use him, so he left. He Heard of it, and without waiting to report went after him himself. Somebody told the King: "The Chancellor He has deserted." And the King was as furious as a man who has lost both hands.\n\n'
          + 'A day or two later He came to court. The King was angry and glad at once, and swore at him: "You deserted. Why?" And He said: "I did not desert. I went after a deserter." — "And who was it you went after?" — "Han Xin."\n\n'
          + 'The King swore again: "Commanders have deserted by the dozen and you did not go after any of them. Going after Xin is a story."\n\n'
          + 'And He said: "Commanders are easy to come by. Of men like Xin there is no second one. If Your Majesty means to be king of Hanzhong for good, you have no use for Xin. If you mean to contend for the empire, there is nobody but Xin to plan it with."',
      },
      verdictZh:
        '論曰:漢之得天下,起於一次追亡 ——'
        + '而何之所以追,不在信之才,'
        + '在**他先問清楚了漢王要的是漢中還是天下**。\n'
        + '故信登壇,首言者亦此:'
        + '「今大王舉而東,三秦可傳檄而定也。」\n'
        + '**用人之先,必先定所欲**:'
        + '所欲小,則國士亦冗員。',
      verdictEn:
        'The historian says: the Han dynasty began with a man chasing a deserter — and Xiao He went after him not because of Han Xin\'s ability but because he had first established whether the King wanted Hanzhong or the empire. Which is what Han Xin himself opened with on the platform: "Move east now and the three Qin kingdoms can be settled by circular letter." Before employing men, settle what you want: where what you want is small, the finest man in the realm is surplus staff.',
      verdictLostZh:
        '論曰:信曰:「項王所過無不殘滅者,'
        + '天下多怨,百姓不親附,特劫於威彊耳。'
        + '名雖為霸,實失天下心,故曰其彊易弱。\n'
        + '——今大王誠能反其道:'
        + '任天下武勇,何所不誅!'
        + '以天下城邑封功臣,何所不服!'
        + '以義兵從思東歸之士,何所不散!」',
      verdictLostEn:
        'The historian says: Han Xin said: "Wherever the King of Chu passes he leaves ruin; the empire is full of resentment, the people are not attached to him, and they are held only by force. He has the name of hegemon and has really lost the empire\'s heart, and that is why I say his strength is easily weakened. If Your Majesty will do the opposite — employ the brave men of the empire, and what will not be destroyed? enfeoff your meritorious officers with the empire\'s cities, and what will not submit? lead men who long to go home east, in a righteous army, and what will not scatter before you?"',
    },
    yong: {
      defeat: {
        titleZh: '三秦',
        titleEn: 'The Three Kingdoms of Qin',
        textZh:
          '項王恐諸侯叛之,乃陰謀曰:'
          + '「巴、蜀道險,秦之遷人皆居蜀。」'
          + '乃曰:「巴、蜀亦關中地也。」'
          + '故立沛公為漢王,王巴、蜀、漢中,都南鄭。\n\n'
          + '而三分關中,王秦降將以距塞漢王:'
          + '章邯為雍王,司馬欣為塞王,董翳為翟王。\n\n'
          + '——而秦父兄怨此三人,痛入骨髓。\n\n'
          + '故信曰:「三秦王為秦將,'
          + '將秦子弟數歲矣,所殺亡不可勝計;'
          + '又欺其眾降諸侯,至新安,'
          + '項王詐阬秦降卒二十餘萬,'
          + '唯獨邯、欣、翳得脫。'
          + '秦父兄怨此三人,痛入骨髓。」',
        textEn:
          'Fearing the other lords would turn on him, the King of Chu reasoned privately: "The roads into Ba and Shu are dangerous, and Qin has always sent its exiles to Shu." So he announced that Ba and Shu were also part of the Guanzhong region, and made the Duke of Pei King of Han over Ba, Shu and Hanzhong, with his capital at Nanzheng.\n\n'
          + 'And he divided Guanzhong three ways among the surrendered Qin generals to keep the King of Han bottled up: Zhang Han as King of Yong, Sima Xin as King of Sai, Dong Yi as King of Di.\n\n'
          + 'And the elders of Qin hated those three men to the marrow.\n\n'
          + 'As Han Xin said: "The three kings of Qin were generals of Qin and led the sons of Qin for years, and the dead cannot be counted; and then they deceived their own men into surrendering, and at Xin\'an the King of Chu treacherously buried two hundred thousand Qin men who had given themselves up, and only Han, Xin and Yi got away. The elders of Qin hate those three to the marrow."',
      },
      verdictZh:
        '論曰:項王之封三秦,慮不可謂不密 ——'
        + '塞其道、分其地、王其降將。\n'
        + '而所忘者一事:**這三個人是關中人恨的人**。\n'
        + '故漢王一出陳倉,三秦傳檄而定;'
        + '守土者無民,則山川之險皆虛設。\n'
        + '——**封疆之固,不在誰把守,在守者身後站著誰**。',
      verdictEn:
        'The historian says: the King of Chu\'s arrangement of the three Qin kingdoms was not carelessly made — he blocked the roads, split the territory, and enthroned the surrendered generals. He forgot one thing: those three were the men Guanzhong hated. So the King of Han came out at Chencang and the three kingdoms were settled by circular letter. Where the holder of the ground has no people behind him, the passes and rivers are decoration. What makes a frontier solid is not who garrisons it but who is standing behind the garrison.',
      verdictLostZh:
        '論曰:漢王之入武關也,秋毫無所害,'
        + '除秦苛法,與秦民約,法三章耳:'
        + '殺人者死,傷人及盜抵罪。'
        + '——**約法三章者,亦一種佈陣**。',
      verdictLostEn:
        'The historian says: when the King of Han came in through the Wu pass he did not harm so much as a hair, repealed the harsh laws of Qin and made a covenant with its people of three articles only: death for murder, and penalties in proportion for injury and theft. Three articles of law are also a way of deploying an army.',
    },
  },
  /* ── 楚漢·彭城之戰 ────────────────────────────────────────────── */
  'scn-ch-pengcheng': {
    han: {
      defeat: {
        titleZh: '睢水為之不流',
        titleEn: 'The Sui River Stopped Flowing',
        textZh:
          '漢王部五諸侯兵,凡五十六萬人,東伐楚。\n'
          + '項王聞之,令諸將擊齊,而自以精兵三萬人南從魯出胡陵。\n\n'
          + '漢王入彭城,收其貨寶美人,日置酒高會。\n\n'
          + '項王晨擊漢軍而東,至彭城,日中,大破漢軍。'
          + '漢軍皆走,相隨入穀、泗水,殺漢卒十餘萬人。'
          + '漢卒皆南走山,楚又追擊至靈壁東睢水上。'
          + '漢軍卻,為楚所擠,多殺,'
          + '漢卒十餘萬人皆入睢水,睢水為之不流。\n\n'
          + '圍漢王三匝。'
          + '——於是大風從西北而起,折木發屋,揚沙石,'
          + '窈冥晝晦,逢迎楚軍。楚軍大亂,壞散,'
          + '而漢王乃得與數十騎遁去。',
        textEn:
          'The King of Han put together the armies of five lords, five hundred and sixty thousand in all, and marched east against Chu. Hearing of it, the King of Chu ordered his generals to go on with Qi and took thirty thousand picked men south from Lu by way of Huling.\n\n'
          + 'The King of Han entered Pengcheng, took its treasure and its women, and held drinking parties daily.\n\n'
          + 'The King of Chu attacked at dawn, drove east, and by midday at Pengcheng had broken the Han army. The Han troops all ran, went into the Gu and Si rivers one after another, and a hundred thousand of them were killed. The rest ran south into the hills and Chu pursued to the Sui river east of Lingbi. The Han army fell back, was crowded together by Chu and cut down in numbers, and a hundred thousand men went into the Sui, and the Sui stopped flowing.\n\n'
          + 'They had the King of Han surrounded three deep — and a great wind got up out of the northwest, breaking trees and stripping roofs and flinging sand and stones, and the day went dark, and it blew straight into the faces of the Chu army. Chu fell into confusion and came apart, and the King of Han got away with a few dozen horsemen.',
      },
      verdictZh:
        '論曰:五十六萬敗於三萬,'
        + '不敗於眾寡,敗於**入城之後那幾日**。\n'
        + '收貨寶、置酒高會者,非一人之過,'
        + '是五諸侯之兵各有所取 ——'
        + '**合眾人之兵者,必先合眾人之所欲;'
        + '所欲既得,則軍自散**。\n'
        + '故此後漢王不復合諸侯,'
        + '而以韓信別將北略,彭越擾其後,'
        + '英布叛其南 —— 三面之勢,自彭城一敗而定。',
      verdictEn:
        'The historian says: five hundred and sixty thousand beaten by thirty thousand — not by the odds, but by the few days after entering the city. Collecting treasure and holding drinking parties was not one man\'s fault: five lords\' armies each had something to take. Whoever combines several men\'s armies must first combine what those men want; once they have what they wanted, the army dissolves itself. So the King of Han never again fought as a coalition. He sent Han Xin off north on a separate command, had Peng Yue harass the rear and Ying Bu revolt in the south — the three-sided strategy was settled by the defeat at Pengcheng.',
      verdictLostZh:
        '論曰:楚騎追漢王,漢王急,'
        + '推墮孝惠、魯元車下,滕公常下收載之。'
        + '如是者三。曰:'
        + '「雖急不可以驅,奈何棄之?」'
        + '——**史不諱其推,亦不諱其收**。',
      verdictLostEn:
        'The historian says: with Chu cavalry on him and no time, the King of Han pushed the future Emperor Hui and Princess Yuan off the carriage, and Lord Teng got down and picked them up and put them back. Three times. And said: "We are pressed, but we cannot make the horses go faster than they can. Why abandon them?" The record does not conceal the pushing off, and does not conceal the picking up.',
    },
    chu: {
      defeat: {
        titleZh: '三萬破五十六萬',
        titleEn: 'Thirty Thousand Against Half a Million',
        textZh:
          '項王聞漢王入彭城,'
          + '令諸將擊齊,而自以精兵三萬人南下。\n\n'
          + '晨擊漢軍,日中而大破之。\n\n'
          + '——此項王一生用兵之極。\n\n'
          + '然勝而不能追亡:'
          + '漢王遁去,收兵於滎陽,'
          + '蕭何發關中老弱未傅者悉詣滎陽,漢軍復振。\n\n'
          + '而項王之後方,彭越已數絕其糧道;'
          + '其側,英布已叛;'
          + '其北,韓信已略趙、代、燕。\n\n'
          + '——一日之捷,而三面之敵成矣。',
        textEn:
          'Hearing that the King of Han had entered Pengcheng, the King of Chu left his generals to deal with Qi and came south himself with thirty thousand picked men.\n\n'
          + 'He attacked at dawn and by midday had broken them utterly.\n\n'
          + 'It is the high point of his career as a soldier.\n\n'
          + 'And he could not follow the victory up. The King of Han got away and reassembled at Xingyang, and Xiao He sent every man in Guanzhong too old or too young for the register to Xingyang, and the Han army was on its feet again.\n\n'
          + 'Meanwhile in his rear Peng Yue had already cut his supply road several times; on his flank Ying Bu had revolted; to the north Han Xin had overrun Zhao, Dai and Yan.\n\n'
          + 'One day\'s victory, and enemies on three sides.',
      },
      verdictZh:
        '論曰:項王戰未嘗敗,而終於亡 ——'
        + '所以然者,**其勝皆在戰,其敗皆在戰外**:\n'
        + '關中不都而都彭城,失地利;'
        + '阬降卒而屠城邑,失人和;'
        + '疑范增而逐之,失謀;'
        + '封諸侯而自為霸,失名。\n'
        + '故太史公曰:「自矜功伐,奮其私智而不師古,'
        + '謂霸王之業,欲以力征經營天下,'
        + '五年卒亡其國。」',
      verdictEn:
        'The historian says: the King of Chu never lost a battle and was destroyed all the same — because his victories were all in the fighting and his defeats all outside it. He would not make his capital in Guanzhong and made it at Pengcheng, and lost the advantage of ground; he buried prisoners and sacked towns, and lost the people; he suspected Fan Zeng and drove him off, and lost his counsel; he parcelled out kingdoms and made himself hegemon, and lost the name of it. So the Grand Historian wrote: "He was vain of his own conquests, pushed his private cleverness and would not learn from antiquity, called it the work of a hegemon-king, and meant to run the empire by force of arms — and in five years he had lost his state."',
      verdictLostZh:
        '論曰:范增曰:「豎子不足與謀!'
        + '奪項王天下者,必沛公也。'
        + '吾屬今為之虜矣!」'
        + '——後果為漢所間,增疽發背而死於道。',
      verdictLostEn:
        'The historian says: Fan Zeng said: "The boy is not worth planning with. The man who takes the empire from the King of Chu will be the Duke of Pei, and we shall all be his prisoners." Han later set them against each other, and Fan Zeng died of a carbuncle on the road home.',
    },
  },
  /* ── 楚漢·井陘之戰 ────────────────────────────────────────────── */
  'scn-ch-jingxing': {
    han: {
      defeat: {
        titleZh: '背水為陣',
        titleEn: 'Drawn Up With the River Behind',
        textZh:
          '信使人間視,知廣武君策不用,還報,則大喜,'
          + '乃敢引兵遂下。\n\n'
          + '未至井陘口三十里,止舍。夜半傳發,'
          + '選輕騎二千人,人持一赤幟,從間道萆山而望趙軍,'
          + '誡曰:「趙見我走,必空壁逐我,'
          + '若疾入趙壁,拔趙幟,立漢赤幟。」\n\n'
          + '乃使萬人先行,出,背水陳。趙軍望見而大笑。\n\n'
          + '既戰,佯敗走,趙果空壁爭漢鼓旗。'
          + '——漢軍皆殊死戰,不可敗。'
          + '而二千騎共候趙空壁逐利,則馳入,'
          + '拔趙幟,立漢赤幟二千。\n\n'
          + '趙軍已不勝,欲還歸壁,壁皆漢赤幟,大驚,遂亂。',
        textEn:
          'Han Xin sent men to look, learned that the Lord of Guangwu\'s plan had not been adopted, and on that report was delighted and dared bring his army down.\n\n'
          + 'Thirty li short of the Jingxing defile he halted. At midnight the order went round; two thousand light horse were picked, each with a red banner, and sent by a side track to lie under cover and watch the Zhao camp, with these instructions: "When Zhao sees us run they will empty the camp to chase us. Get into the camp at speed, pull down the Zhao banners and set up the red banners of Han."\n\n'
          + 'Then ten thousand men went out ahead and drew up with the river behind them, and the Zhao army looked at it and laughed out loud.\n\n'
          + 'When the fighting started the Han troops feigned defeat and ran, and Zhao did empty the camp to scramble for the Han drums and standards — and the Han troops fought to the death and could not be broken. And the two thousand horsemen, waiting for the camp to empty, galloped in, pulled down the Zhao banners and set up two thousand red ones.\n\n'
          + 'Zhao, unable to win in front, wanted to get back to camp; the camp was all red Han banners; and in their fright they came apart.',
      },
      verdictZh:
        '論曰:諸將問曰:「兵法右倍山陵,前左水澤,'
        + '今者將軍令臣等反背水陳,曰破趙會食,'
        + '臣等不服,然竟以勝,此何術也?」\n\n'
        + '信曰:「此在兵法,顧諸君不察耳。'
        + '兵法不曰『陷之死地而後生,置之亡地而後存』?'
        + '且信非得素拊循士大夫也,'
        + '此所謂『驅市人而戰之』,'
        + '其勢非置之死地,使人人自為戰;'
        + '今予之生地,皆走,寧尚可得而用之乎!」\n\n'
        + '——**背水者,非賭,是知道自己帶的是什麼兵**。',
      verdictEn:
        'The historian says: his officers asked: "The manuals say keep hills on your right and water in front and to the left. You made us draw up with our backs to the river and said we would dine after breaking Zhao, and we did not believe it, and we won. What is the method?"\n\n'
          + 'And Han Xin said: "It is in the manuals; you simply did not look. Do they not say, throw them into ground where they must die and they will live; put them where they must perish and they will survive? Besides, I have not had these men long enough to have won them over. This is what is meant by driving the men of the marketplace into battle. Unless they are put where they must die, so that every man fights for himself, giving them ground to live on means they all run — and then what use are they to me?"\n\n'
          + 'Fighting with the river behind you is not a gamble. It is knowing what kind of troops you have.',
      verdictLostZh:
        '論曰:信募生得廣武君者予千金。'
        + '既縛至,信解其縛,東鄉坐,師事之。'
        + '廣武君辭曰:「敗軍之將,不可以言勇;'
        + '亡國之大夫,不可以圖存。」\n'
        + '信曰:「僕聞之,百里奚居虞而虞亡,'
        + '在秦而秦霸,非愚於虞而智於秦也,'
        + '用與不用,聽與不聽也。'
        + '……僕委心歸計,願足下勿辭。」',
      verdictLostEn:
        'The historian says: Han Xin offered a thousand in gold for the Lord of Guangwu taken alive, and when he was brought in bound, untied him, seated him facing east and treated him as a teacher. The Lord of Guangwu declined: "The commander of a beaten army cannot speak of courage; the minister of a destroyed state cannot plan for survival." And Xin said: "I have heard that Baili Xi was in Yu and Yu was destroyed, and was in Qin and Qin became hegemon — he was not stupid in Yu and clever in Qin. It was a matter of being employed or not, of being listened to or not... I put my mind in your hands. Do not refuse me."',
    },
    zhao: {
      defeat: {
        titleZh: '義兵不用詐謀',
        titleEn: 'A Righteous Army Uses No Tricks',
        textZh:
          '廣武君李左車說成安君曰:'
          + '「井陘之道,車不得方軌,騎不得成列,'
          + '行數百里,其勢糧食必在其後。\n'
          + '願足下假臣奇兵三萬人,從間道絕其輜重;'
          + '足下深溝高壘,堅營勿與戰。\n'
          + '彼前不得鬥,退不得還,'
          + '吾奇兵絕其後,使野無所掠,'
          + '不至十日,而兩將之頭可致於麾下。」\n\n'
          + '成安君,儒者也,常稱義兵不用詐謀奇計,曰:\n'
          + '「兵法十則圍之,倍則戰。'
          + '今韓信兵號數萬,其實不過數千。'
          + '能千里而襲我,亦已罷極。'
          + '今如此避而不擊,後有大者,何以加之!'
          + '則諸侯謂吾怯,而輕來伐我。」\n\n'
          + '不聽廣武君策。',
        textEn:
          'Li Zuoche, Lord of Guangwu, put it to the Lord of Cheng\'an: "In the Jingxing defile carts cannot go two abreast and cavalry cannot form line. Marching several hundred li, their food must necessarily be strung out behind them.\n\n'
          + 'Give me thirty thousand men on a separate command and let me cut their baggage by the side tracks; dig deep, build high, hold the camp and refuse battle.\n\n'
          + 'Then they cannot fight in front and cannot get back, my detachment is across their rear, and there is nothing in the countryside to plunder. In under ten days the heads of both their generals can be laid before you."\n\n'
          + 'The Lord of Cheng\'an was a Confucian and always maintained that a righteous army uses no tricks or unorthodox devices, and said: "The manuals say surround at ten to one and give battle at two to one. Han Xin\'s army is called tens of thousands and is really a few thousand, and to have come a thousand li to attack us it must be worn out. If we avoid a force like this and do not strike it, what shall we do when a larger one comes? The other lords will call us cowards and think us cheap enough to attack."\n\n'
          + 'And he did not take the advice.',
      },
      verdictZh:
        '論曰:成安君非愚,是**以兵法之數為兵法** ——'
        + '十則圍之、倍則戰,說的是勢,不是戒律。\n'
        + '而其所畏者,亦非韓信,是「諸侯謂吾怯」:\n'
        + '**畏人議者,必為敵所用**;\n'
        + '故韓信不必勝趙之兵,只須勝趙之議。',
      verdictEn:
        'The historian says: the Lord of Cheng\'an was not a fool; he took the numbers in the manuals for the manuals themselves. Surround at ten to one, give battle at two to one — those describe a situation, not a commandment. And what he was afraid of was not Han Xin but being called a coward by the other lords. A man who fears what people will say can be used by his enemy. Han Xin did not have to beat Zhao\'s army; he only had to beat Zhao\'s staff meeting.',
      verdictLostZh:
        '論曰:信之所以敢下井陘,'
        + '正因**先探得廣武君策不用** ——'
        + '間諜所報者,非敵之兵,是敵之議。',
      verdictLostEn:
        "The historian says: what made Han Xin willing to come down the Jingxing defile was learning first that the Lord of Guangwu's plan had been rejected. What his spies brought back was not the enemy's order of battle but the enemy's staff discussion.",
    },
  },
  /* ── 楚漢·濰水之戰 ────────────────────────────────────────────── */
  'scn-ch-weishui': {
    han: {
      defeat: {
        titleZh: '囊沙壅水',
        titleEn: 'Sandbags in the River',
        textZh:
          '楚使龍且將兵二十萬救齊。\n\n'
          + '或說龍且曰:「漢兵遠鬥窮戰,其鋒不可當。'
          + '齊、楚自居其地戰,兵易敗散。'
          + '不如深壁,令齊王使其信臣招所亡城,'
          + '亡城聞其王在,楚來救,必反漢。'
          + '——漢兵二千里客居,齊城皆反之,其勢無所得食,'
          + '可無戰而降也。」\n\n'
          + '龍且曰:「吾平生知韓信為人,易與耳。'
          + '且夫救齊不戰而降之,吾何功?'
          + '今戰而勝之,齊之半可得。」\n\n'
          + '——信乃夜令人為萬餘囊,盛沙壅濰水上流,'
          + '引軍半渡,擊龍且,佯不勝,還走。'
          + '龍且果喜曰:「固知信怯也。」遂追渡水。'
          + '信使人決壅囊,水大至。',
        textEn:
          'Chu sent Long Ju with two hundred thousand to save Qi.\n\n'
          + 'Somebody advised him: "The Han troops are fighting far from home with nothing behind them and their edge cannot be met. Qi and Chu are fighting on their own ground and their soldiers scatter easily. Better to hold behind deep works and have the King of Qi send trusted men to call back the towns he has lost; hearing that their king is alive and that Chu has come to the rescue, they will certainly turn against Han. Han is two thousand li from home; with every town in Qi against them there is nothing for them to eat and they can be made to surrender without a battle."\n\n'
          + 'And Long Ju said: "I have known Han Xin all my life. He is easy to handle. And if I relieve Qi by making them surrender without a battle, where is my credit? Beat them in the field and half of Qi is mine."\n\n'
          + 'So in the night Han Xin had ten thousand bags filled with sand and dammed the upper Wei, brought his army half across, attacked Long Ju, pretended to lose and ran. And Long Ju was delighted: "I always knew he was a coward," and pursued across the water. And Han Xin had the bags cut open and the water came down.',
      },
      verdictZh:
        '論曰:濰水之勝,勝於**龍且要的是功,不是齊** ——'
        + '深壁不戰則齊自復,而龍且無功;'
        + '故彼必戰。\n'
        + '知敵之所欲,而後可以設餌。\n'
        + '龍且既死,項王大懼,'
        + '使武涉往說信 ——'
        + '天下之勢,自此三分而系於一人。',
      verdictEn:
        'The historian says: the Wei river was won because what Long Ju wanted was credit, not Qi. Hold behind works without fighting and Qi recovers itself and Long Ju has nothing to show — so he had to fight. Know what your enemy wants and you can set a bait. With Long Ju dead the King of Chu took fright and sent Wu She to talk Han Xin over: from then on the balance of the empire was in three parts and hung on one man.',
      verdictLostZh:
        '論曰:蒯通說信曰:「當今兩主之命縣於足下。'
        + '足下為漢則漢勝,與楚則楚勝。'
        + '……莫若兩利而俱存之,三分天下,鼎足而居。」\n'
        + '信曰:「漢王遇我甚厚,'
        + '載我以其車,衣我以其衣,食我以其食。'
        + '吾聞之,乘人之車者載人之患,'
        + '衣人之衣者懷人之憂,'
        + '食人之食者死人之事,吾豈可以鄉利倍義乎!」',
      verdictLostEn:
        'The historian says: Kuai Tong said to Han Xin: "The lives of both rulers hang on you at this moment. Side with Han and Han wins; side with Chu and Chu wins... Better to let both live and profit, and divide the empire three ways and stand like the legs of a tripod." And Xin said: "The King of Han has treated me generously — carried me in his own carriage, clothed me in his own clothes, fed me from his own table. I have heard that a man who rides in another\'s carriage carries that man\'s troubles, that a man who wears another\'s clothes takes that man\'s cares to heart, and that a man who eats another\'s food dies in his cause. How could I turn my back on right for profit?"',
    },
    qi: {
      defeat: {
        titleZh: '烹酈生',
        titleEn: 'The Envoy in the Cauldron',
        textZh:
          '酈食其說齊王曰:「王知天下之所歸乎?」'
          + '王曰:「不知也。」'
          + '曰:「王知天下之所歸,則齊國可得而有也;'
          + '若不知天下之所歸,即齊國未可得保也。」\n\n'
          + '——齊王田廣以為然,乃聽酈生,'
          + '罷歷下兵守戰備,與酈生日縱酒。\n\n'
          + '而韓信引兵東,將擊齊。'
          + '聞酈食其已說下齊,欲止。'
          + '蒯通說信曰:「將軍受詔擊齊,'
          + '而漢獨發間使下齊,寧有詔止將軍乎?'
          + '……且酈生一士,伏軾掉三寸之舌,下齊七十餘城;'
          + '將軍將數萬眾,歲餘乃下趙五十餘城。'
          + '為將數歲,反不如一豎儒之功乎!」\n\n'
          + '信然之,遂渡河襲齊。'
          + '齊王以為酈生賣己,乃烹之。',
        textEn:
          'Li Yiji said to the King of Qi: "Does Your Majesty know where the empire is going?" — "I do not." — "If Your Majesty knows where the empire is going, Qi can be kept; if not, Qi cannot be held."\n\n'
          + 'King Tian Guang thought he was right, listened to him, stood down the troops and works at Lixia, and drank with him daily.\n\n'
          + 'And Han Xin was marching east to attack Qi, and hearing that Li Yiji had already talked Qi into coming over, meant to stop. Kuai Tong said to him: "The general has an edict to attack Qi, and Han sends a private envoy of its own and Qi comes over. Is there an edict telling the general to stop? ... Besides, Li Yiji is one man; leaning on his carriage rail and wagging a three-inch tongue he has brought in seventy cities of Qi, and the general with tens of thousands took over a year to reduce fifty in Zhao. Some years a general, and less to show for it than one contemptible scholar?"\n\n'
          + 'Han Xin took the point and crossed the river against Qi. And the King of Qi, thinking Li Yiji had sold him, boiled him alive.',
      },
      verdictZh:
        '論曰:齊之亡,亡於**同時信了兩件事**:'
        + '信酈生之說,而罷歷下之備。\n'
        + '——降者可以不備兵,而未降之敵不因你的降而止步:'
        + '韓信所受之詔未改,則其兵必至。\n'
        + '**與一國議和,而不問其將是否同意,則和即為陷阱**。\n'
        + '酈生之死,亦死於此:'
        + '他所許的,不是他能兌現的。',
      verdictEn:
        'The historian says: Qi was destroyed by believing two things at once — believing Li Yiji, and standing down the defences at Lixia. A state that has come over need not keep its army in the field; but an enemy who has not yet been told does not stop because you surrendered. Han Xin\'s orders had not been changed, so his army was coming. Make peace with a country without asking whether its general agrees, and the peace is a trap. And Li Yiji died of the same thing: what he promised was not his to deliver.',
      verdictLostZh:
        '論曰:酈生將烹,曰:「舉大事不細謹,盛德不辭讓。'
        + '而公不為若更言!」遂烹酈生。'
        + '——漢定天下,封其弟酈商為列侯,'
        + '而高祖每念酈生,未嘗不欷歔。',
      verdictLostEn:
        'The historian says: about to be boiled, Li Yiji said: "A man engaged in great affairs does not fuss over details, and great virtue does not stand on ceremony. I am not going to change my story for you." And they boiled him. When Han had settled the empire, his younger brother Li Shang was made a marquis, and the founding emperor never thought of Li Yiji without sighing.',
    },
  },
  /* ── 楚漢爭霸 ─────────────────────────────────────────────────── */
  'scn-ch-chuhan': {
    han: {
      defeat: {
        titleZh: '養虎自遺患',
        titleEn: 'Rearing a Tiger to Bite You',
        textZh:
          '項王與漢約,中分天下,'
          + '割鴻溝以西者為漢,鴻溝而東者為楚。'
          + '——項王已約,乃引兵解而東歸。\n\n'
          + '漢欲西歸,張良、陳平說曰:'
          + '「漢有天下太半,而諸侯皆附之。'
          + '楚兵罷食盡,此天亡楚之時也。'
          + '不如因其機而遂取之。'
          + '今釋弗擊,此所謂『養虎自遺患』也。」\n\n'
          + '漢王聽之。\n\n'
          + '——五年,追項王至固陵,'
          + '而信、越期不至,漢敗。\n'
          + '張良曰:「君王能與共分天下,今可立致也。」'
          + '乃使使者告韓信、彭越:'
          + '「並力擊楚。楚破,自陳以東傅海與齊王,'
          + '睢陽以北至穀城與彭相國。」'
          + '——使者至,皆報「請今進兵」。',
        textEn:
          'The King of Chu made a treaty with Han halving the empire: west of the Hong Canal to Han and east of it to Chu — and having made it, he raised the siege and went home east.\n\n'
          + 'Han meant to go west, and Zhang Liang and Chen Ping said: "Han holds more than half the empire and the other lords are all attached to it. The Chu troops are worn out and their food is gone; this is the moment Heaven means Chu to be destroyed. Take the opportunity and finish it. To let it go now is what is called rearing a tiger to bite you."\n\n'
          + 'The King of Han took the advice.\n\n'
          + 'In the fifth year he pursued the King of Chu to Guling, and Han Xin and Peng Yue did not come at the appointed time, and Han was beaten.\n\n'
          + 'Zhang Liang said: "If Your Majesty will divide the empire with them, they can be brought here at once." So envoys went to Han Xin and Peng Yue: "Join in attacking Chu. When Chu is broken, everything from Chen east to the sea goes to the King of Qi, and everything north of Suiyang to Gucheng to Chancellor Peng."\n\n'
          + 'The envoys arrived, and both replied: "We ask leave to advance immediately."',
      },
      verdictZh:
        '論曰:高祖之取天下,'
        + '不在其能戰,在**其能分** ——\n'
        + '固陵之敗,不敗於楚,敗於信、越不至;'
        + '而其至也,不以詔,以地。\n'
        + '故置酒洛南宮,自論曰:'
        + '「夫運籌策帷帳之中,決勝於千里之外,吾不如子房;'
        + '鎮國家,撫百姓,給餽饟,不絕糧道,吾不如蕭何;'
        + '連百萬之軍,戰必勝,攻必取,吾不如韓信。'
        + '此三者,皆人傑也,吾能用之,此吾所以取天下也。'
        + '項羽有一范增而不能用,此其所以為我擒也。」',
      verdictEn:
        'The historian says: the founding emperor won the empire not by being able to fight but by being able to share it out. The defeat at Guling was not inflicted by Chu; it happened because Han Xin and Peng Yue did not come — and what brought them was not an edict but land. So at the banquet in the southern palace at Luoyang he took his own measure: "In planning inside the tent and deciding a victory a thousand li away, I am not the equal of Zifang. In holding the state together, comforting the people, keeping the supplies coming and the grain road open, I am not the equal of Xiao He. In leading a million men, winning every battle and taking every objective, I am not the equal of Han Xin. These three are the outstanding men of the age, and I could use them, and that is how I took the empire. Xiang Yu had one Fan Zeng and could not use him, and that is why I have him."',
      verdictLostZh:
        '論曰:項王為高俎,置太公其上,'
        + '告漢王曰:「今不急下,吾烹太公。」\n'
        + '漢王曰:「吾與項羽俱北面受命懷王,'
        + '曰『約為兄弟』,吾翁即若翁。'
        + '必欲烹而翁,則幸分我一桮羹。」\n\n'
        + '項王欲挑戰決雌雄,漢王笑謝曰:'
        + '「吾寧鬥智,不能鬥力。」',
      verdictLostEn:
        'The historian says: the King of Chu set up a high table with the King of Han\'s father on it, and called across: "Surrender at once or I boil your father." And the King of Han said: "You and I both faced north and took our orders from King Huai, and we agreed to be as brothers. My father is your father. If you insist on boiling your own father, be so good as to send me a cup of the soup."\n\n'
          + 'The King of Chu then challenged him to single combat to settle it, and the King of Han laughed and declined: "I would rather contend in wits. I cannot contend in strength."',
    },
    chu: {
      defeat: {
        titleZh: '鴻溝',
        titleEn: 'The Hong Canal',
        textZh:
          '是時項王兵罷食絕,'
          + '而漢兵盛食多,楚兵疲。\n\n'
          + '乃與漢約,中分天下,'
          + '割鴻溝以西者為漢,鴻溝而東者為楚。'
          + '歸漢王父母妻子,軍皆呼萬歲。\n\n'
          + '項王已約,乃引兵解而東歸。\n\n'
          + '——而漢兵不歸。\n\n'
          + '五年,漢王追項王至陽夏南,止軍,'
          + '與淮陰侯韓信、建成侯彭越期會而擊楚軍。\n\n'
          + '——垓下。',
        textEn:
          'By then the King of Chu\'s troops were worn out and his food gone, while the Han armies were strong and well supplied.\n\n'
          + 'So he made the treaty with Han halving the empire, west of the Hong Canal to Han and east of it to Chu, and returned the King of Han\'s parents, wife and children; and the whole army shouted for joy.\n\n'
          + 'Having made the treaty, he raised the siege and went home east.\n\n'
          + 'And the Han army did not go home.\n\n'
          + 'In the fifth year the King of Han pursued him to south of Yangxia, halted, and made an appointment with the Marquis of Huaiyin, Han Xin, and the Marquis of Jiancheng, Peng Yue, to strike Chu together.\n\n'
          + 'Gaixia.',
      },
      verdictZh:
        '論曰:鴻溝之約,楚信而漢背 ——'
        + '而後世責漢者少,責楚者多。\n'
        + '**其故在:項王之約,不是為了天下,是為了太公歸與士卒之呼萬歲**;'
        + '所欲既在息兵,則約成之日,已無再戰之志。\n'
        + '故不必待漢之背約,'
        + '楚之敗,在「軍皆呼萬歲」的那一刻已定。',
      verdictEn:
        'The historian says: at the Hong Canal, Chu kept faith and Han broke it — and posterity has blamed Chu more than Han. The reason is that Xiang Yu made the treaty not for the empire but to get the hostages back and hear his army cheer. Since what he wanted was to stop fighting, on the day the treaty was signed he had no fight left in him. So it did not need Han\'s treachery: Chu was beaten at the moment the whole army shouted for joy.',
      verdictLostZh:
        '論曰:漢王欲西歸,張良、陳平止之,'
        + '曰「養虎自遺患」;'
        + '而項王引兵東歸,無一人止之。\n'
        + '**范增死後,楚無諫者**。',
      verdictLostEn:
        'The historian says: the King of Han meant to go home west and Zhang Liang and Chen Ping stopped him with a line about rearing a tiger; the King of Chu marched home east and nobody stopped him. After Fan Zeng died, there was nobody in Chu who argued.',
    },
  },
  /* ── 楚漢·垓下之戰 ────────────────────────────────────────────── */
  'scn-ch-gaixia': {
    chu: {
      defeat: {
        titleZh: '虞兮虞兮奈若何',
        titleEn: 'Yu, Yu, What Is to Become of You',
        textZh:
          '項王軍壁垓下,兵少食盡,漢軍及諸侯兵圍之數重。\n\n'
          + '夜聞漢軍四面皆楚歌,項王乃大驚曰:'
          + '「漢皆已得楚乎?是何楚人之多也!」\n\n'
          + '項王則夜起,飲帳中。'
          + '有美人名虞,常幸從;'
          + '駿馬名騅,常騎之。\n\n'
          + '於是項王乃悲歌忼慨,自為詩曰:\n'
          + '「力拔山兮氣蓋世,'
          + '時不利兮騅不逝。'
          + '騅不逝兮可柰何,'
          + '虞兮虞兮柰若何!」\n\n'
          + '歌數闋,美人和之。'
          + '項王泣數行下,左右皆泣,莫能仰視。',
        textEn:
          'The King of Chu was walled up at Gaixia with few men and no food, and the armies of Han and the other lords had him surrounded several deep.\n\n'
          + 'In the night he heard the songs of Chu coming from every side of the Han lines, and started up in dismay: "Has Han taken all of Chu already? How can there be so many men of Chu over there?"\n\n'
          + 'He rose in the night and drank in his tent. There was a lady named Yu who was always with him, and a fine horse named Zhui that he always rode.\n\n'
          + 'And he sang, bitterly and grandly, a poem of his own:\n\n'
          + '"Strength to uproot mountains, a spirit over the age —\n'
          + 'and the time is against me, and Zhui will not go on.\n'
          + 'Zhui will not go on, and what is to be done?\n'
          + 'Yu, Yu, what is to become of you?"\n\n'
          + 'He sang it several times over and the lady sang it with him. Tears ran down his face, and everyone about him wept, and none of them could look up.',
      },
      verdictZh:
        '論曰:項王至東城,乃有二十八騎。'
        + '自度不得脫,謂其騎曰:'
        + '「吾起兵至今八歲矣,身七十餘戰,'
        + '所當者破,所擊者服,未嘗敗北,遂霸有天下。'
        + '然今卒困於此,此天之亡我,非戰之罪也。'
        + '今日固決死,願為諸君快戰,'
        + '必三勝之……令諸君知天亡我,非戰之罪也。」\n\n'
        + '——太史公曰:「自矜功伐,奮其私智而不師古……'
        + '身死東城,尚不覺寤而不自責,過矣。'
        + '乃引『天亡我,非用兵之罪也』,豈不謬哉!」',
      verdictEn:
        'The historian says: by Dongcheng he had twenty-eight horsemen left. Reckoning he could not get out, he said to them: "It is eight years since I raised troops. I have fought over seventy engagements; whatever stood against me was broken and whatever I struck submitted, and I was never once beaten, and so I held the empire as hegemon. And here I am, finished — Heaven is destroying me; it is no fault of my soldiering. Today I shall certainly die, and I should like to fight one good fight for you gentlemen and win three times over... so that you may know that it is Heaven destroying me and no fault of my soldiering."\n\n'
          + 'And the Grand Historian wrote: "Vain of his own conquests, pushing his private cleverness and refusing to learn from antiquity... he died at Dongcheng and still had not understood and would not blame himself. That was his error. And to fall back on \'Heaven is destroying me; it is no fault of my soldiering\' — is that not absurd?"',
      verdictLostZh:
        '論曰:於是項王乃欲東渡烏江。'
        + '烏江亭長檥船待,曰:'
        + '「江東雖小,地方千里,眾數十萬人,亦足王也。'
        + '願大王急渡。今獨臣有船,漢軍至,無以渡。」\n\n'
        + '項王笑曰:'
        + '「天之亡我,我何渡為!'
        + '且籍與江東子弟八千人渡江而西,今無一人還,'
        + '縱江東父兄憐而王我,我何面目見之?'
        + '縱彼不言,籍獨不愧於心乎?」\n\n'
        + '乃以馬賜亭長。'
        + '顧見漢騎司馬呂馬童,曰:'
        + '「吾聞漢購我頭千金,邑萬戶,吾為若德。」'
        + '乃自刎而死。',
      verdictLostEn:
        'The historian says: he thought then of crossing the Wu river east. The village head at the Wu crossing had a boat waiting and said: "The east of the river is small, but it is a thousand li across with several hundred thousand people, and it is enough to be king of. I beg Your Majesty to cross quickly. Mine is the only boat here; when the Han army comes there will be no way over."\n\n'
          + 'And the King of Chu laughed: "Heaven is destroying me. What should I cross for? Besides, I crossed west with eight thousand sons of the east and not one of them is going back. Even if their fathers and brothers pitied me and made me king, how could I face them? Even if they said nothing, would I not be ashamed in my own heart?"\n\n'
          + 'He gave the man his horse. Then, seeing Lü Matong of the Han cavalry among the pursuers, he said: "I hear Han has put a thousand in gold and a fief of ten thousand households on my head. Let me do you a good turn." And he cut his own throat.',
    },
    han: {
      defeat: {
        titleZh: '四面楚歌',
        titleEn: 'Songs of Chu on Every Side',
        textZh:
          '淮陰侯將三十萬自當之,'
          + '孔將軍居左,費將軍居右,'
          + '皇帝在後,絳侯、柴將軍在皇帝後。\n\n'
          + '項羽之卒可十萬。'
          + '淮陰先合,不利,卻。'
          + '孔將軍、費將軍縱,楚兵不利,'
          + '淮陰侯復乘之,大敗垓下。\n\n'
          + '——夜,令降卒四面歌楚歌。\n\n'
          + '此戰之勝,不在陣,'
          + '在**楚人已多在漢營之中**。',
        textEn:
          'The Marquis of Huaiyin took three hundred thousand into the centre, General Kong on the left and General Fei on the right, the Emperor behind, and the Marquis of Jiang and General Chai behind him.\n\n'
          + 'Xiang Yu had perhaps a hundred thousand. Huaiyin engaged first, had the worse of it and fell back. Kong and Fei came in from the flanks and Chu had the worse of it, and Huaiyin came on again, and Chu was broken at Gaixia.\n\n'
          + 'And that night the surrendered troops were set to sing the songs of Chu on every side.\n\n'
          + 'The battle was not won by the deployment. It was won by how many men of Chu were already in the Han camp.',
      },
      verdictZh:
        '論曰:四面楚歌之所以能行,'
        + '正因**漢軍中楚人已眾** ——'
        + '此非一夜之計,是五年招降納叛之積。\n'
        + '故聞歌而驚者,項王也;'
        + '而唱歌者,昔日之楚卒也。\n'
        + '**戰爭之終局,常不是誰殺得多,'
        + '是誰那邊的人變多了**。',
      verdictEn:
        'The historian says: the songs of Chu worked because there were by then so many men of Chu in the Han army — not a night\'s stratagem but five years of accepting deserters and surrenders. The man startled by the singing was Xiang Yu; the men singing had been soldiers of Chu. Wars usually end not with a count of who killed more but with a count of whose side has been growing.',
      verdictLostZh:
        '論曰:魯最後下。漢乃引項王頭示魯,魯父兄乃降。'
        + '始楚懷王初封項籍為魯公,及其死,魯最後下,'
        + '故以魯公禮葬項王穀城。'
        + '漢王為發哀,泣之而去。'
        + '——**諸項氏枝屬,漢王皆不誅**。',
      verdictLostEn:
        'The historian says: Lu was the last place to submit. Han had Xiang Yu\'s head shown to Lu, and then its elders surrendered. Because King Huai of Chu had originally enfeoffed Xiang Ji as Duke of Lu, and because Lu held out longest, he was buried at Gucheng with the rites of a Duke of Lu. The King of Han went into mourning for him, wept, and went away. And none of the Xiang clan were put to death.',
    },
  },
  /* ── 隋末群雄逐鹿 ─────────────────────────────────────────────── */
  'scn-st-suiend': {
    tang: {
      defeat: {
        titleZh: '先入關中者王',
        titleEn: 'Whoever Enters Guanzhong First',
        textZh:
          '隋失其鹿,天下共逐之。\n\n'
          + '李密雄視河洛,擁瓦崗之眾三十萬,'
          + '而與王世充相持於洛口 ——'
          + '天下之兵,盡繫於一倉。\n\n'
          + '李淵起於晉陽,'
          + '——不爭洛陽,不爭倉粟。'
          + '西入河東,渡龍門,下永豐倉,'
          + '十一月而克長安。\n\n'
          + '立代王侑為帝,約法十二條,'
          + '悉除隋苛禁。\n\n'
          + '密與世充相攻二年,'
          + '而關中已定。',
        textEn:
          'Sui lost its deer, and the whole empire ran after it.\n\n'
          + 'Li Mi dominated the Luo valley with three hundred thousand of the Wagang men, and was locked with Wang Shichong at the mouth of the Luo — every army in the empire tied to one granary.\n\n'
          + 'Li Yuan rose at Jinyang — and did not contend for Luoyang and did not contend for the grain. He went west into Hedong, crossed at Longmen, took the Yongfeng granary, and in the eleventh month held Chang\'an.\n\n'
          + 'He set up the Prince of Dai as emperor, made a covenant of twelve articles, and swept away the harsh prohibitions of Sui.\n\n'
          + 'Li Mi and Wang Shichong fought each other for two years, and by then Guanzhong was settled.',
      },
      verdictZh:
        '論曰:隋末之群雄,'
        + '兵最眾者李密,地最要者王世充,'
        + '而得天下者李淵 ——\n'
        + '**其別在:一爭倉,一爭城,一爭地** 。\n'
        + '洛口倉可以聚三十萬人,而不能養一國;'
        + '長安背關中,右隴蜀,'
        + '此高祖入關之故智,唐人再用之。\n'
        + '故曰:創業之難,不在能戰,在**知道該去哪裡**。',
      verdictEn:
        'The historian says: at the end of Sui the largest army was Li Mi\'s, the most important position was Wang Shichong\'s, and the man who got the empire was Li Yuan. The difference: one contended for a granary, one for a city, and one for a region. The Luokou granary could gather three hundred thousand men and could not feed a state; Chang\'an has Guanzhong at its back and Longyou and Shu on its right — the old calculation that took the founder of Han through the pass, used a second time. Which is to say that the hard part of founding a dynasty is not being able to fight. It is knowing where to go.',
      verdictLostZh:
        '論曰:淵之起也,劉文靜為之謀,'
        + '而首事者裴寂以晉陽宮人侍淵,'
        + '使不得不反。\n'
        + '——**大事之發端,常不甚體面**;'
        + '而史家錄之不諱,亦唐人之自信。',
      verdictLostEn:
        'The historian says: Liu Wenjing planned the rising, and Pei Ji set it going by putting the Jinyang palace women in Li Yuan\'s bed so that he had no choice but to revolt. The beginnings of great enterprises are often not very decorous — and that the Tang historians recorded it without covering it up is a kind of confidence in itself.',
    },
    wagang: {
      defeat: {
        titleZh: '罄南山之竹',
        titleEn: 'All the Bamboo of the Southern Hills',
        textZh:
          '密移檄郡縣,數煬帝十罪,曰:\n'
          + '「罄南山之竹,書罪無窮;'
          + '決東海之波,流惡難盡。」\n\n'
          + '破洛口倉,開倉恣民所取,'
          + '老弱襁負,道路不絕,'
          + '眾至數十萬。\n\n'
          + '——而糧不可久:'
          + '倉粟散而民歸,倉粟盡而民去。\n\n'
          + '密與世充決戰於邙山,敗。'
          + '降唐,復叛,死於熊耳山。\n\n'
          + '魏徵嘗上書密,陳十策,不用。'
          + '——後徵事唐,為太宗諫議大夫。',
        textEn:
          'Li Mi sent a manifesto round the commanderies listing ten crimes of Emperor Yang, and it said: "Use up all the bamboo of the southern hills, and his crimes would not be written out; let out all the water of the eastern sea, and the evil would not be washed away."\n\n'
          + 'He took the Luokou granary and threw it open for the people to take what they liked, and the old and the weak came with children on their backs in an unbroken line along the roads, and his following grew to hundreds of thousands.\n\n'
          + 'And grain does not last. While the granary was being given away the people came; when it was empty they went.\n\n'
          + 'Li Mi fought Wang Shichong to a decision at Mount Mang and lost. He surrendered to Tang, revolted again, and died in the Xiong\'er hills.\n\n'
          + 'Wei Zheng had once submitted ten proposals to him and they were not used. Wei Zheng afterwards served Tang, as Grand Counsellor to Emperor Taizong.',
      },
      verdictZh:
        '論曰:密之得眾,以開倉;而其失眾,亦以開倉 ——\n'
        + '**以粟聚人者,粟盡而人散;'
        + '以地聚人者,地在則人在**。\n'
        + '故李淵取關中而置根本,'
        + '密擁三十萬而無一州為家。\n'
        + '及邙山一敗,遂無所歸。\n'
        + '——魏徵之十策不用於瓦崗,而用於貞觀;'
        + '天下之才,終歸於能容之者。',
      verdictEn:
        'The historian says: Li Mi gathered his following by opening a granary and lost it the same way. Gather men with grain and they scatter when the grain is gone; gather them with territory and they stay while the territory does. So Li Yuan took Guanzhong and had a base, and Li Mi had three hundred thousand men and not one province to call home. After Mount Mang there was nowhere to go. Wei Zheng\'s ten proposals were not used at Wagang and were used in the Zhenguan reign; ability ends up wherever there is room for it.',
      verdictLostZh:
        '論曰:密殺翟讓而奪其眾,'
        + '自是將帥人人自疑。'
        + '——**取眾易,取眾之信難;'
        + '而殺其舊主者,終不能得其信**。',
      verdictLostEn:
        'The historian says: Li Mi killed Zhai Rang and took over his following, and from then on every commander under him was uneasy. Taking over men is easy and taking over their trust is not; and a man who has killed their old master never quite gets it.',
    },
    xia: {
      defeat: {
        titleZh: '重然諾',
        titleEn: 'A Man Who Kept His Word',
        textZh:
          '建德,貝州漳南人,'
          + '少尚氣俠,重然諾。\n\n'
          + '同縣人有喪親者,家貧無以葬,'
          + '時建德方耕於田,聞而歎息,'
          + '遽輟耕牛以與之,由是鄉黨敬異之。\n\n'
          + '既為夏王,'
          + '得隋黃門侍郎裴矩等,'
          + '每有攻戰所得資財,'
          + '悉以分將士,身無所取。'
          + '又不啖肉,常食唯有蔬菜脫粟之飯,'
          + '妻曹氏不衣紈綺,'
          + '所使婢妾才十數人。\n\n'
          + '——山東豪傑,多歸之。',
        textEn:
          'Dou Jiande was a man of Zhangnan in Beizhou, given in his youth to a chivalrous temper and to keeping his word.\n\n'
          + 'A man of the same county lost a parent and was too poor to pay for the funeral; Jiande, ploughing at the time, heard of it, sighed, and unyoked his ox on the spot and gave it to him. From then on the district thought him remarkable.\n\n'
          + 'As King of Xia he took Pei Ju, the Sui Vice-Director of the Chancellery, and others into his service, and whatever was captured in his campaigns he divided among his officers and men and kept nothing. He ate no meat; his meals were vegetables and unpolished grain; his wife of the Cao family wore no fine silk, and had perhaps a dozen maids.\n\n'
          + 'And the strong men of Shandong came over to him in numbers.',
      },
      verdictZh:
        '論曰:建德之德,近古之王者;'
        + '而其敗於虎牢,一日而國亡。\n'
        + '**德足以聚人,而不足以代兵法** ——'
        + '凌敬勸其渡河攻懷,則鄭圍自解,不用;'
        + '列陣自辰至午,士卒饑倦爭飲,'
        + '而唐騎三千五百自谷而出。\n'
        + '既擒,太宗問:「我自伐王世充,'
        + '關汝何事,越境而來?」'
        + '建德曰:「今不自來,恐煩遠取。」'
        + '——至死不失其氣。',
      verdictEn:
        'The historian says: Dou Jiande\'s virtue was nearly that of the kings of antiquity, and he lost at Hulao and his state was gone in a day. Virtue is enough to gather men and is not a substitute for the art of war. Ling Jing urged him to cross the river and attack Huai, which would have lifted the siege of Zheng of itself, and he did not do it; he stood in line of battle from dawn to midday until his men were hungry, tired and scrambling for water, and three thousand five hundred Tang horse came out of the valley. Taken prisoner, he was asked by Taizong: "I came to punish Wang Shichong. What business was it of yours, to cross your border and come here?" And Jiande said: "If I had not come myself, I was afraid of putting you to the trouble of fetching me." He did not lose his spirit even at the end.',
      verdictLostZh:
        '論曰:建德既死,其故將劉黑闥復起,'
        + '半歲盡復故地。'
        + '——**得地易,得人心之遺留難**;'
        + '唐之定河北,前後三年。',
      verdictLostEn:
        'The historian says: after Dou Jiande\'s death his old commander Liu Heita rose again and recovered all his territory within six months. Taking ground is easy; dealing with the loyalty a dead man leaves behind is not. It took Tang three years to settle Hebei.',
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
