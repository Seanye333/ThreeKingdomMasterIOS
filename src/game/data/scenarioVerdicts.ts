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
};

/** 取某盤某家的落幕文本;沒寫過就回 null(走通用結局)。 */
export function scenarioVerdict(
  scenarioId: string | null | undefined,
  forceId: EntityId | null | undefined,
): ScenarioVerdict | null {
  if (!scenarioId || !forceId) return null;
  return SCENARIO_VERDICTS[scenarioId]?.[forceId] ?? null;
}
