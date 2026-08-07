import type { ScenarioObjective } from '../../types';

/** 劇本目標 · 三國正史紀年盤 —— 純資料,唯一入口仍是 data/objectives.ts。 */
export const OBJ_THREEKINGDOMS: Record<string, ScenarioObjective[]> = {
  // 184 — Yellow Turban
  'scn-184-yellow-turban': [
    {
      id: 'obj-184-han',
      forceId: 'han',
      primary: {
        title: { zh: '八州之亂', en: 'The Rising in Eight Provinces' },
        /*
         * 原本是「於187年前徹底擊潰黃巾」—— 自走五輪 0/5,而且**照史書也不會
         * 發生**。184 年冬亂平、改元中平,但餘部入太行號黑山、散為青州黃巾,
         * 活過了這個王朝;這張盤自己的「黑山之聚」寫的就是「自此亂非一戰可平,
         * 而成積年之患」。主目標不該要求連史書都沒發生的事。
         *
         * 還有一層是**聯軍歸屬**:皇甫嵩軍與朱儁軍在盤上是獨立勢力,城是他們
         * 打下來的、記在他們名下(體檢實測舊黃巾十七城終歸皇甫嵩五至八座)。
         * 於是任何 hold-cities 寫法對漢室都判不對。break-force 只問「亂平了沒」,
         * 不問是誰平的 —— 這正是朝廷的視角。
         *
         * 門檻取十七之半:亂起八州,平其半即為破。實測 186 年黃巾城數
         * 8/7/5/10/9,約三輪過關。
         */
        description: "Break the rising by 186 — cut the Yellow Turbans to half the cities they raised (8 or fewer).",
        descriptionZh: "於186年前平定八州之亂 —— 使黃巾所據不及其半(八城以下)。",
        goal: { kind: 'break-force', forceId: 'yellow-turban', maxCities: 8, byYear: 186 },
      },
      secondary: [
        {
          title: { zh: '盡誅黃巾', en: 'Wipe Them Out' },
          description: 'Wipe the Yellow Turban force out entirely by 189 — no dynasty ever managed it.',
          descriptionZh: "於189年前徹底擊潰黃巾軍 —— 這一件,漢室終究沒做到。",
          goal: { kind: 'defeat-force', forceId: 'yellow-turban', byYear: 189 },
        },
        {
          title: { zh: '名將發掘', en: 'Recruit a Future Hero' },
          description: 'Recruit Cao Cao, Liu Bei, or Sun Jian to your court.',
          descriptionZh: "招攬曹操、劉備或孫堅入仕麾下。",
          goal: { kind: 'recruit-officer', officerId: 'cao-cao' },
        },
      ],
    },
    {
      id: 'obj-184-yt',
      forceId: 'yellow-turban',
      primary: {
        title: { zh: '蒼天已死', en: 'The Blue Heaven is Dead' },
        description: 'Take Luoyang before 186 AD.',
        descriptionZh: "於186年前攻取洛陽。",
        goal: { kind: 'hold-cities', cityIds: ['luoyang'], byYear: 186 },
      },
      secondary: [
        {
          title: { zh: '三十六方', en: 'Thirty-six Divisions' },
          description: 'Hold Ye, Beihai and Pingyuan together — the three provinces the rising actually took.',
          descriptionZh: '同時據有鄴、北海、平原 —— 起事之初真正控住的三州之地。',
          goal: { kind: 'hold-cities', cityIds: ['ye', 'beihai', 'pingyuan'], byYear: 187 },
        },
        /*
         * 五家裡只有黃巾一條次要目標,其餘二到三條 —— 補上他們的南線。
         *
         * 春,張曼成殺南陽太守褚貢而據宛;朱儁自五月圍到十一月,張曼成死了換
         * 趙弘,趙弘死了換韓忠,韓忠降而復叛又換孫夏,三易其帥才拔。守住宛城
         * 就是守住這場仗的南半邊,而它正對著朱儁的主目標 —— 兩家的主線在同一
         * 座城上撞頭,這是這張盤上唯一一組正面對衝的目標。
         *
         * 開局即據有,期限 186:守成型判法(見 objectives.ts)—— 要撐到那一年
         * 才算數。體檢實測朱儁十二輪裡九輪拿得下宛城,所以這條約四分之一機會。
         */
        {
          title: { zh: '南陽不下', en: 'Nanyang Holds' },
          description: 'Still hold Wancheng and Runan in 186 — the southern half of the rising, and the city Zhu Jun is coming for.',
          descriptionZh: '至186年仍據宛城與汝南 —— 起事的南半邊,而朱儁的大軍正衝著宛城來。',
          goal: { kind: 'hold-cities', cityIds: ['wancheng', 'runan'], byYear: 186 },
        },
      ],
    },
    /* 皇甫嵩軍 — 長社已勝,朝廷把北方交給他。他手上最值錢的不是八座城,
       是那個二十九歲的騎都尉。 */
    {
      id: 'obj-184-huangfu',
      forceId: 'huangfu',
      primary: {
        title: { zh: '北道之任', en: 'Charge of the Northern Road' },
        /*
         * 原本主目標是「盡滅黃巾」,而敘述卻寫「並據有鄴城」—— 判定與敘述各說
         * 各話。改成他真正打的那兩仗:廣宗(張角、張梁)與下曲陽(張寶),
         * 盤上即鄴與信都。「盡滅黃巾」降為次要 —— 那是漢室的大局,不是北道
         * 一路將領交得出的差事(體檢五輪,黃巾城數中位數 6,從未歸零)。
         */
        /*
         * 期限 186 → 187,再由「鄴+信都」收成「鄴」一座。
         *
         * 兩城同取實測八輪只中一次(鄴 3/8、信都 1/8、同時 1/8)—— 他要連下
         * 黃巾最硬的兩座老巢,而手上只有五城四萬兵。史書裡這兩仗也不是一回事:
         * 十月廣宗斬張梁,是決戰;十一月下曲陽斬張寶,是收尾。決戰作主目標,
         * 收尾作次要 —— 這樣分,難度與敘事同時對上。
         */
        description: 'Take Ye by 187 — at Guangzong he broke the main rebel host and killed Zhang Liang.',
        descriptionZh: '於187年前攻取鄴 —— 廣宗一戰斬張梁,黃巾主力於此而潰。',
        goal: { kind: 'hold-cities', cityIds: ['ye'], byYear: 187 },
      },
      secondary: [
        {
          title: { zh: '下曲陽', en: 'Xiaquyang' },
          description: 'Take Xindu too by 188 — Zhang Bao died there, and with him the last of the three brothers.',
          descriptionZh: '於188年前並取信都 —— 下曲陽斬張寶,三兄弟至此而盡。',
          goal: { kind: 'hold-cities', cityIds: ['xindu'], byYear: 188 },
        },
        {
          title: { zh: '盡平其眾', en: 'Finish Them' },
          description: 'Wipe the Yellow Turban force out entirely by 188 — few commanders ever managed it.',
          descriptionZh: '於188年前徹底擊潰黃巾軍 —— 能做到的將領不多。',
          goal: { kind: 'defeat-force', forceId: 'yellow-turban', byYear: 188 },
        },
        {
          title: { zh: '孟德在幕', en: 'Mengde in the Tent' },
          description: 'Keep Cao Cao in your service — he is a cavalry colonel under you, and not for long.',
          descriptionZh: '留住曹操 —— 此時他不過是你麾下騎都尉,而且留不了太久。',
          goal: { kind: 'recruit-officer', officerId: 'cao-cao', byYear: 190 },
        },
      ],
    },
    /* 朱儁軍 — 宛城之圍是黃巾之亂的終點。而他帳下坐著三家之中的兩家。 */
    {
      id: 'obj-184-zhujun',
      forceId: 'zhujun',
      primary: {
        title: { zh: '宛城之圍', en: 'The Siege of Wancheng' },
        /*
         * 期限 187 → 185。體檢實測朱儁取宛城的回合是 7 / 20 / 62 / 118 / 119
         * ——五輪之內遲早都拿得到,期限訂在 187 等於沒訂(引擎判定改成逐回合
         * 鎖存之後,這條是 5/5)。史實上宛城下於 184 年十一月,就是當年之內;
         * 給到 185 年底,是「兩個戰季之內結束這場仗」的意思。
         */
        description: 'Take Wancheng before 186 — the rebellion ended where Zhu Jun ended it, in the eleventh month of 184.',
        descriptionZh: '於186年前攻取宛城 —— 黃巾之亂終於此城,史實上是184年十一月。',
        goal: { kind: 'hold-cities', cityIds: ['wancheng'], byYear: 185 },
      },
      secondary: [
        {
          title: { zh: '荊南之定', en: 'Settle the Jing South' },
          description: 'Hold Xiangyang and Jiangling — the river country behind your siege line.',
          descriptionZh: '據有襄陽與江陵 —— 你圍城時背後的江漢之地。',
          goal: { kind: 'hold-cities', cityIds: ['xiangyang', 'jiangling'], byYear: 189 },
        },
        {
          title: { zh: '織席販履之徒', en: 'The Mat-weaver' },
          description: 'Keep Liu Bei under your banner past the rising — most of his commanders will not.',
          descriptionZh: '亂平之後仍留得住劉備 —— 多數人留不住。',
          goal: { kind: 'recruit-officer', officerId: 'liu-bei', byYear: 190 },
        },
      ],
    },
    /* 董卓軍 — 史實上他這一仗打輸了。所以他的主要目標不是打贏黃巾,
       是活著回涼州、把兵權保住,然後等洛陽自己亂起來。 */
    {
      id: 'obj-184-dong',
      forceId: 'dong-184',
      primary: {
        title: { zh: '擁兵自重', en: 'Keep the Army' },
        /*
         * 敘述寫「涼州仍在手中」,而判定只查 survive-until —— 這一家開局十三城、
         * 自走三跑長到十六城,活著是白送的。改成真的查涼州全境:開局他握有
         * 六郡,天水、酒泉、敦煌三郡在野,要自己去取。
         *
         * 這條目標的張力也對:涼州在西,而洛陽的機會在東 —— 史實上他正是在
         * 「回涼州保本」與「往東邊等機會」之間選了後者。
         */
        /*
         * 2026-08 再改一次 —— **`control-province` 這條在資料變動後悄悄變成死目標**。
         * 上面那段註解寫的是「開局握有六郡,天水、酒泉、敦煌三郡在野」;而後來把
         * 三十五座孤城掛回州裡,涼州從九城變十二城,董卓開局八城、在野四城
         * (天水、酒泉、敦煌、張掖)。體檢五輪:峰值一律 9/12 —— 他只走得到天水,
         * 河西走廊那三座沙漠城 AI 一次都沒去過。要求 AI 走到敦煌的目標,
         * 等於沒有目標。
         *
         * 改成**涼州六郡**(金城/天水/武威/安定/隴西/上邽):開局握五,天水在野一步之遙。
         * 敘述照舊講「擁兵自重」,而判定查的是他真的做得到的那一件。
         */
        description: 'Hold the six commandery seats of Liang by 189 — Dong Zhuo lost at Guangzong and kept his troops anyway.',
        descriptionZh: '於189年前盡有涼州六郡(金城、天水、武威、安定、隴西、上邽)—— 廣宗雖敗,兵權未交。',
        goal: { kind: 'hold-cities', cityIds: ['jincheng', 'tianshui', 'wuwei', 'anding', 'longxi', 'shanggui'], byYear: 189 },
      },
      secondary: [
        {
          title: { zh: '不交兵權', en: 'The Army Stays Mine' },
          description: 'Still be standing in 189 — the court ordered his troops handed to Huangfu Song; he declined.',
          descriptionZh: '撐到189年 —— 朝廷詔他把兵交給皇甫嵩,他沒交。',
          goal: { kind: 'survive-until', year: 189 },
        },
        {
          title: { zh: '近水樓臺', en: 'Nearest the Gate' },
          description: 'Take Luoyang — in history he only had to be closest when the palace tore itself apart.',
          descriptionZh: '攻取洛陽 —— 史實上他只是在宮中自相殘殺時離得最近。',
          goal: { kind: 'hold-cities', cityIds: ['luoyang'], byYear: 192 },
        },
      ],
    },
  ],

  // 190 — Anti-Dong Zhuo Coalition
  'scn-190-anti-dong-zhuo': [
    {
      id: 'obj-190-cao',
      forceId: 'cao',
      primary: {
        title: { zh: '兗州之叛', en: 'The Mutiny at Yan' },
        /*
         * 原本是「於197年前同時據有洛陽與許昌」—— 體檢十二輪 0 中,而他終局
         * 中位數只剩一座城。追下去,他不是被諸侯打垮的:六輪十四次失城裡
         * 無主(民變)七次、黃天教四次、董卓只有三次,外圍的白馬與延津民忠
         * 一路漂到二十以下,自己爛掉。
         *
         * 而這正是史實。194 年張邈、陳宮迎呂布入兗州,郡縣皆應,曹操只剩
         * 鄄城、范、東阿三城 —— 他一生最險的一關不是官渡,是那一年。
         * 所以主目標改成他真正做到的那件事:**守住核心**。取洛陽奉天子降為
         * 次要 —— 那是 196 年的事,是熬過這一關之後的獎賞,不是入場券。
         */
        /*
         * 兩城 → 三城(補上官渡)。第一版只查許昌與陳留,體檢十二輪 **12/12**
         * —— 那兩座是他的腹地,守成判法之下等於白送;而他真正會丟的是外圍。
         * 加上官渡:實測他在多輪裡於第 80–122 回合失去它,而那正是史實裡
         * 兗州之叛的形狀 —— 腹地還在,四邊全反。官渡日後也正是他與袁紹決勝
         * 之地,守住它才算「熬過那一關」。
         */
        description: 'Still hold Xuchang, Chenliu and Guandu in 196 — in 194 his own province turned on him and left him three cities.',
        descriptionZh: '至196年仍據有許昌、陳留與官渡 —— 194年張邈陳宮迎呂布,兗州郡縣皆應,他只剩三座城。',
        goal: { kind: 'hold-cities', cityIds: ['xuchang', 'chenliu', 'guandu'], byYear: 196 },
      },
      secondary: [
        {
          title: { zh: '奉天子以令不臣', en: 'The Emperor at Xu' },
          description: 'Take Luoyang while holding Xuchang — the court came out of the ruins in 196 and he moved it to Xu.',
          descriptionZh: '據有許昌之餘並取洛陽 —— 196年天子出焦土,而他把朝廷遷到了許。',
          goal: { kind: 'hold-cities', cityIds: ['luoyang', 'xuchang'], byYear: 199 },
        },
        {
          title: { zh: '袁紹討伐', en: 'Defeat Yuan Shao' },
          description: 'Crush the Yuan Shao force.',
          descriptionZh: "擊潰袁紹勢力。",
          goal: { kind: 'defeat-force', forceId: 'yuan-shao' },
        },
      ],
    },
    {
      id: 'obj-190-gongsun',
      forceId: 'gongsun',
      primary: {
        title: { zh: '南下爭河北', en: 'The Fight for Hebei' },
        /*
         * 原本是「於198年前取彭城與下邳」—— 徐州。而公孫瓚一生的戰場在河北:
         * 190 年他屯磐河,191 年破青州黃巾三十萬於東光,192 年與袁紹戰於界橋,
         * 白馬義從喪盡於麴義八百先登之下,此後五年皆與袁紹相持,終困死易京。
         * 他從沒有向徐州用兵,而徐州在盤面另一頭 —— 體檢十二輪 0 中。
         *
         * 換成他真正爭的那一塊:鄴。冀州五城,開局他據其三、袁紹據其二 ——
         * 這條目標與袁紹的「盡取冀州」是同一塊地的兩面,兩家必有一戰。
         */
        /*
         * 再改(2026-08,量測修好之後)。「攻取鄴」四輪 0 中 —— 鄴是袁紹的治所,
         * 而史實上公孫瓚一次也沒打進去:界橋之後他一路退,終困死易京。
         * 照本盤的準則(主目標寫他真正做到的事),取鄴該是次要。
         *
         * 換成他真正據有過的那一塊:幽州本鎮(北平、薊、漁陽、柳城 —— 逐城量到
         * 195 年皆 4/4)再加冀北的南皮與信都。後兩座是界橋那條線上的,
         * 袁紹的主目標指向平原、不指向它們,所以兩家可以各自成立而仍然相爭。
         */
        description: 'Still hold You province and the Ji-north foothold in 196 — Panhe, Donguang, Jieqiao: he never fought anywhere else.',
        descriptionZh: '至196年仍據北平、薊、漁陽、柳城與南皮、信都 —— 磐河、東光、界橋,他一生的仗都在河北打。',
        goal: { kind: 'hold-cities', cityIds: ['beiping', 'ji', 'yuyang', 'liucheng', 'nanpi', 'xindu'], byYear: 196 },
      },
      secondary: [
        {
          title: { zh: '南下爭河北', en: 'The Fight for Hebei' },
          description: 'Take Ye by 199 — the seat he spent his life failing to reach.',
          descriptionZh: '於199年前攻取鄴 —— 他打了一輩子河北,而這座城一次也沒進去過。',
          goal: { kind: 'hold-cities', cityIds: ['ye'], byYear: 199 },
        },
        {
          title: { zh: '界橋雪恥', en: 'Avenge Jieqiao' },
          description: 'Destroy the Yuan Shao force.',
          descriptionZh: "擊潰袁紹 —— 白馬義從喪於界橋,此讎當報。",
          goal: { kind: 'defeat-force', forceId: 'yuan-shao' },
        },
      ],
    },
    {
      id: 'obj-190-yuanshao',
      forceId: 'yuan-shao',
      primary: {
        title: { zh: '盟主之實', en: 'Make the Alliance Real' },
        description: 'Control Ji province by 199 — a chief of the alliance needs land of his own.',
        /*
         * 「於199年前盡取冀州」十二輪 0 中。冀州盤上五城:鄴、渤海是他的,
         * 平原、南皮、博陵在公孫瓚手裡 —— 全取等於九年之內把公孫瓚打乾淨,
         * 而公孫瓚終局有十四城,是北方最厚的一家。史實上那一仗打到 199 年
         * 易京自焚才了,是他一生最長的一場。
         *
         * 主目標收成第一步:平原。那是公孫瓚在冀州最南的一座,也是劉備當年
         * 為相之地 —— 界橋之後袁紹南下,先動的就是這一線。盡取冀州與掃平
         * 公孫瓚都留在次要,那才是九年之功。
         */
        descriptionZh: "於196年前攻取平原 —— 界橋既勝,河北之爭自此城始。",
        goal: { kind: 'hold-cities', cityIds: ['pingyuan'], byYear: 196 },
      },
      secondary: [
        {
          title: { zh: '盟主之土', en: 'A Chief Needs Land' },
          description: 'Control Ji province by 199 — the name of alliance-chief must in the end have soil under it.',
          descriptionZh: '於199年前盡取冀州 —— 盟主之名,終須有盟主之土。',
          goal: { kind: 'control-province', provinceId: 'ji', byYear: 199 },
        },
        {
          title: { zh: '掃平公孫', en: 'Sweep Away Gongsun Zan' },
          description: 'Destroy the Gongsun Zan force.',
          descriptionZh: "擊滅公孫瓚,盡有幽冀之地。",
          goal: { kind: 'defeat-force', forceId: 'gongsun' },
        },
      ],
    },
    {
      id: 'obj-190-yuanshu',
      forceId: 'yuan-shu',
      primary: {
        title: { zh: '南陽之富', en: 'The Wealth of Nanyang' },
        description: 'Hold Wancheng and Shouchun by 197, then take the title.',
        descriptionZh: "於197年前據宛城、壽春 —— 有此二城之富,方可言大位。",
        goal: { kind: 'hold-cities', cityIds: ['wancheng', 'shouchun'], byYear: 197 },
      },
      secondary: [
        {
          title: { zh: '僭號稱尊', en: 'Take the Title' },
          description: 'Declare yourself emperor.',
          descriptionZh: "稱帝建號 —— 史書為此記你一個「冢中枯骨」。",
          goal: { kind: 'declare-emperor' },
        },
      ],
    },
    {
      id: 'obj-190-liubiao',
      forceId: 'liu-biao',
      primary: {
        title: { zh: '單騎入宜城', en: 'One Rider into Yicheng' },
        /*
         * 「於199年前盡有荊州」實測十二輪 0 中,而他終局只有四到五城 ——
         * 荊州十六城裡孫堅佔三、袁術佔三、無主五座,要全取等於同時打贏兩家。
         * 那是他 191 年孫堅死後才慢慢做到的事,不是開局兩年的事。
         *
         * 主目標改成他真正立身的那一步:誘殺宗賊帥五十五人而後領荊州 ——
         * 守住襄陽(治所)、江陵(南郡)、江夏(黃祖)這三座。盡有荊州降為
         * 次要,那才是「竟成一方之主」的完成式。
         */
        description: 'Still hold Xiangyang, Jiangling and Jiangxia in 196 — he rode into Yicheng alone and took a province by killing fifty-five men at one meeting.',
        descriptionZh: '至196年仍據襄陽、江陵、江夏 —— 單馬入宜城,誘宗賊帥五十五人而斬之,遂領荊州。',
        goal: { kind: 'hold-cities', cityIds: ['xiangyang', 'jiangling', 'jiangxia'], byYear: 196 },
      },
      secondary: [
        {
          title: { zh: '盡有荊州', en: 'All Nine Commanderies' },
          description: 'Control Jing province by 199 — after Sun Jian died the south came in one commandery at a time.',
          descriptionZh: '於199年前盡有荊州 —— 孫堅既死,江南諸郡乃次第歸附。',
          goal: { kind: 'control-province', provinceId: 'jing', byYear: 199 },
        },
        {
          title: { zh: '北拒袁術', en: 'Hold the North Gate' },
          description: 'Take Xinye by 197 — Yuan Shu sat in Nanyang at his back, and that is the door.',
          descriptionZh: '於197年前攻取新野 —— 袁術據南陽在其肘腋,而新野是那扇門。',
          goal: { kind: 'hold-cities', cityIds: ['xinye'], byYear: 197 },
        },
      ],
    },
    {
      id: 'obj-190-liuyan',
      forceId: 'liu-yan',
      primary: {
        title: { zh: '閉關守險', en: 'Shut the Passes' },
        /*
         * 「於200年前盡有益州」十二輪 0 中 —— 益州十五城裡他只據四座,其餘
         * 十一座是無主的南中、雲南、永昌、越巂那一片,自走十年也走不到。
         * (郿與武關原本也算在益州,那一條已另外修掉,見 provinces.ts。)
         *
         * 主目標改成他真正做的事:閉關。成都、江州、永安 —— 蜀中三處要害,
         * 守住它們就是「坐待天下之變」。盡有益州留在次要。
         */
        description: 'Still hold Chengdu, Jiangzhou and Yong\'an in 197 — cut the roads and wait for the realm to change.',
        descriptionZh: '至197年仍據成都、江州、永安 —— 閉關守險,坐待天下之變。',
        goal: { kind: 'hold-cities', cityIds: ['chengdu', 'jiangzhou', 'yongan'], byYear: 197 },
      },
      secondary: [
        {
          title: { zh: '益州天府', en: 'The Storehouse of Heaven' },
          description: 'Control Yi province by 200.',
          descriptionZh: '於200年前盡有益州。',
          goal: { kind: 'control-province', provinceId: 'yi', byYear: 200 },
        },
        {
          title: { zh: '斷絕閣道', en: 'Cut the Plank Roads' },
          description: 'Take Hanzhong by 194 — he sent Zhang Lu to hold it and cut the Xie valley road, and after that no envoy of the Han came through.',
          descriptionZh: '於194年前攻取漢中 —— 使張魯據之而斷絕斜谷閣道,自此漢使不通。',
          goal: { kind: 'hold-cities', cityIds: ['hanzhong'], byYear: 194 },
        },
        {
          title: { zh: '南中之附', en: 'The South Bows' },
          description: 'Take Nanzhong by 199 — the far south was never governed so much as accommodated.',
          descriptionZh: '於199年前攻取南中 —— 南中之地,自來只可羈縻,不可郡縣。',
          goal: { kind: 'hold-cities', cityIds: ['nanzhong'], byYear: 199 },
        },
      ],
    },
    {
      id: 'obj-190-tao',
      forceId: 'tao',
      primary: {
        title: { zh: '徐州安堵', en: 'Keep Xuzhou Quiet' },
        description: 'Still hold Pengcheng and Xiapi in 197.',
        descriptionZh: "至197年仍保彭城、下邳 —— 亂世之中,無事便是大功。",
        goal: { kind: 'hold-cities', cityIds: ['pengcheng', 'xiapi'], byYear: 197 },
      },
      secondary: [
        {
          title: { zh: '流民歸之', en: 'The Refugees Come' },
          description: 'Hold all of Xu province by 197 — grain in the granaries drew the displaced from four directions.',
          descriptionZh: '於197年前盡有徐州 —— 穀米豐贍,流民多歸之。',
          goal: { kind: 'control-province', provinceId: 'xu', byYear: 197 },
        },
        {
          title: { zh: '非劉備不能安此州', en: 'No One but Liu Bei' },
          description: 'Have Liu Bei in your service by 195 — on his deathbed he gave the province to him.',
          descriptionZh: '於195年前招得劉備入麾下 —— 臨終讓徐州曰:「非劉備不能安此州也。」',
          goal: { kind: 'recruit-officer', officerId: 'liu-bei', byYear: 195 },
        },
      ],
    },
    /* 孫堅 —— 諸侯之中唯一真的打進洛陽的人。 */
    {
      id: 'obj-190-sun',
      forceId: 'sun',
      primary: {
        title: { zh: '掃除宗廟', en: 'Sweep the Ancestral Shrines' },
        /*
         * 原本是「掌控揚州諸城」—— 那是孫策 195 年以後的事,而盤上把孫堅的
         * 地盤從江東十城改回長沙三郡之後(見 scenarios.ts),這條目標連地理
         * 都對不上了:他人在荊南,而揚州在千里之外。
         *
         * 換成他 190 年真正做的那件事:諸侯高會於酸棗,唯堅獨進 —— 破華雄於
         * 陽人,敗呂布於洛陽城下,入洛之日掃除漢家宗廟、平塞諸陵而後還軍。
         * 期限 193:過了那一年他已死於峴山。
         */
        /*
         * 主次對調(2026-08-05 二次)。「於193年前攻取洛陽」十二輪 0 中 ——
         * 他的地盤在荊南,而洛陽在千里之外,中間隔著袁術與劉表;史實上他能
         * 到洛陽,是因為他以長沙太守的身分**隨袁術屯魯陽**當前鋒,而盤上
         * 表達不了「借道盟友」這件事。
         *
         * 所以主目標換成他在這張盤上真的走得到的那一步:襄陽。191 年袁術遣堅
         * 征荊州擊劉表,那是他最後一戰,也是他唯一與非盟友接壤的方向。
         * 掃除宗廟留作次要 —— 名場面該是獎賞,不是入場券。
         */
        description: 'Take Xiangyang by 195 — Yuan Shu sent him against Liu Biao, and that road ended at Xian mountain.',
        descriptionZh: '於195年前攻取襄陽 —— 袁術遣堅征荊州擊劉表,而這條路的盡頭是峴山。',
        goal: { kind: 'hold-cities', cityIds: ['xiangyang'], byYear: 195 },
      },
      secondary: [
        /*
         * 原本這條是「同時據有洛陽與長沙」—— 與主目標同樣卡在洛陽,一條路
         * 塞住就兩條都不通。換成他真正的下一步:191 年袁術遣堅征荊州擊劉表,
         * 而襄陽正在他長沙以北。史書裡他就是死在這條路上的。
         */
        {
          title: { zh: '掃除宗廟', en: 'Sweep the Ancestral Shrines' },
          description: 'Take Luoyang by 195 — of all the lords, only Sun Jian actually got there.',
          descriptionZh: '於195年前攻取洛陽 —— 諸侯高會,唯堅獨進,入洛之日掃除宗廟、平塞諸陵。',
          goal: { kind: 'hold-cities', cityIds: ['luoyang'], byYear: 195 },
        },
        {
          title: { zh: '峴山之讎', en: 'The Debt at Xian Mountain' },
          description: 'Break Liu Biao — the arrow that killed Sun Jian came from Huang Zu\'s men in the bamboo.',
          descriptionZh: '擊潰劉表 —— 殺孫堅的那一箭,出自黃祖部曲藏身的竹林。',
          goal: { kind: 'defeat-force', forceId: 'liu-biao' },
        },
      ],
    },
    /* 董卓 —— 他不是被聯軍打倒的,是被自己人殺的。 */
    {
      id: 'obj-190-dong',
      forceId: 'dong',
      primary: {
        title: { zh: '挾天子而令天下', en: 'The Emperor in Your Hands' },
        /*
         * 原本只查長安一城,而他開局就據有 —— 守成型判法之下,體檢十二輪
         * 十一輪達成。一個 92% 的主目標等於沒有目標。
         *
         * 加上洛陽:史實上他 190 年焚洛陽、遷都長安,兩京都在他手裡(留董越、
         * 段煨守之),而關東之兵始終沒能進洛陽 —— 進去的只有孫堅一個人,
         * 而那時城已成墟。要兩京俱在,才叫「挾天子而令天下」。
         */
        /*
         * 三改(2026-08,量測修好之後)。「長安+洛陽」四輪 0 中 —— 而逐城量下來,
         * 195 年他仍據長安 4/4、郿 4/4、武關 4/4、潼關 3/4,**只有洛陽是 2/4**。
         * 一座城把整條目標拉成擲硬幣,而那座城正是他自己燒掉並放棄的那一座。
         *
         * 改成關中之固:長安、潼關、武關 —— 東出之門與南下之門都在他手裡,
         * 這才是「挾天子而令天下」在盤面上的樣子。洛陽降為次要:
         * 史實上他棄之,而棄之則關東長驅 —— 那是代價,不是門檻。
         */
        description: "Hold Chang'an with the Tong and Wu passes through 195 — the emperor is only leverage while the gates are yours.",
        descriptionZh: '至195年仍據長安與潼關、武關 —— 挾天子者,所挾的其實是那兩扇門。',
        goal: { kind: 'hold-cities', cityIds: ['changan', 'tongguan', 'wuguan'], byYear: 195 },
      },
      secondary: [
        {
          title: { zh: '洛陽不棄', en: 'Do Not Abandon Luoyang' },
          description: 'Still hold Luoyang in 195 — he burned it and left, and the east came through.',
          descriptionZh: '至195年仍據洛陽 —— 史實上他焚之而去,而關東遂長驅。',
          goal: { kind: 'hold-cities', cityIds: ['luoyang'], byYear: 195 },
        },
        {
          title: { zh: '郿塢之積', en: 'The Stores at Mei' },
          description: 'Still hold Mei in 195 — seventy feet of wall and thirty years of grain, and he never got to use them.',
          descriptionZh: '至195年仍據有郿 —— 塢高七丈,積穀三十年,而他一日也沒用上。',
          goal: { kind: 'hold-cities', cityIds: ['mei'], byYear: 195 },
        },
        {
          title: { zh: '關東之兵', en: 'The Armies of the East' },
          description: 'Break Yuan Shao — the coalition had a chief, and cutting off its head ends it.',
          descriptionZh: '擊潰袁紹 —— 聯軍有盟主,盟主既去,盟自解矣。',
          goal: { kind: 'defeat-force', forceId: 'yuan-shao' },
        },
      ],
    },
    /* 孔融 — 兩座城、四個人,而且他不是武人。所以主要目標是活著:史實上
       他撐到 196 年被袁譚攻破北海,妻子被擄,他自己隻身逃奔許都。 */
    {
      id: 'obj-190-kongrong',
      forceId: 'kong-rong',
      primary: {
        title: { zh: '北海之守', en: 'Hold Beihai' },
        description: 'Still hold Beihai in 196 AD — the year Yuan Tan took it from him.',
        descriptionZh: '撐到196年仍據有北海 —— 史實上這一年袁譚破城,孔融隻身走許都。',
        goal: { kind: 'hold-cities', cityIds: ['beihai'], byYear: 196 },
      },
      secondary: [
        {
          title: { zh: '座上客常滿', en: 'A Hall Always Full' },
          description: 'Hold both Beihai and Linzi — the two seats of the Qi country you administer.',
          descriptionZh: '同時據有北海與臨淄 —— 你所治的齊地兩處治所。',
          goal: { kind: 'hold-cities', cityIds: ['beihai', 'linzi'], byYear: 198 },
        },
        {
          title: { zh: '子義突圍', en: 'Ziyi Rides Out' },
          description: 'Keep Taishi Ci — the one man here who broke a siege for you single-handed.',
          descriptionZh: '留住太史慈 —— 這座城裡唯一替你單騎突圍求援的人。',
          goal: { kind: 'recruit-officer', officerId: 'taishi-ci', byYear: 196 },
        },
      ],
    },
    /* 馬騰 — 一座武威城。關東在爭天下,他在爭明年的糧。史實上他 194 年
       與韓遂東出擊長安,敗於長平觀。 */
    {
      id: 'obj-190-mateng',
      forceId: 'ma-teng',
      primary: {
        title: { zh: '西涼之主', en: 'Master of the West' },
        description: 'Hold Wuwei, Jincheng and Anding — make the Liang country answer to one man.',
        /*
         * 三城 → 兩城,期限 196 → 198。他開局只有武威一座、七千兵,府庫十二輪
         * 見底五次 —— 六年之內連下金城與安定,對這樣的家底是空話(0/12)。
         * 金城是韓遂的本據,也是他與韓遂結為異姓兄弟又相攻的那座城;先拿下它,
         * 涼州才談得上「只認一個號令」。安定留在次要。
         */
        descriptionZh: '於198年前據有武威與金城 —— 金城是韓遂的本據,而涼州只能認一個號令。',
        goal: { kind: 'hold-cities', cityIds: ['wuwei', 'jincheng'], byYear: 198 },
      },
      secondary: [
        {
          title: { zh: '長平觀之役', en: 'The Battle of Changping Guan' },
          description: "Take Chang'an — in history he marched on it in 194 and was beaten.",
          descriptionZh: '攻取長安 —— 史實上他194年東出,敗於長平觀。',
          goal: { kind: 'hold-cities', cityIds: ['changan'], byYear: 200 },
        },
        {
          title: { zh: '涼州十部', en: 'The Ten of Liang' },
          description: 'Outlast Han Sui — sworn brother, then enemy, then brother again.',
          descriptionZh: '熬過韓遂 —— 結為異姓兄弟,又反目,又和解,反覆數次。',
          goal: { kind: 'survive-until', year: 200 },
        },
      ],
    },
  ],

  // 200 — Guandu
  'scn-200-guandu': [
    {
      id: 'obj-200-cao',
      forceId: 'cao',
      primary: {
        title: { zh: '守官渡', en: 'Hold the Line at Guandu' },
        /*
         * 原本是「於207年前消滅袁紹勢力」—— 照史書沒錯(紹死於 202,二子走
         * 烏丸,207 年白狼山盡滅),而體檢十二輪 0 中:曹操自己覆滅四次、
         * 終局中位數一座城。連活著都成問題,遑論滅人。
         *
         * 官渡打的是什麼?是**守**。自八月至十月,以一敵十而不退者半年,
         * 而後烏巢一夜。主目標因此改成他真正做到的那件事:守住許昌、官渡、
         * 白馬這條線到 203 年(紹死之次年)。破其軍、滅其族降為次要 ——
         * 那是熬過這一關之後的十年,不是入場券。
         */
        /*
         * 城單原本含白馬 —— 而史實上曹操斬顏良之後就**放棄**了白馬,徙其民而走;
         * 五輪追蹤裡它也確實在第 2–4 回合就丟了。守的是官渡那條線,不是黃河
         * 北岸的哨所。改成許昌(根本)、陳留(起兵之地)、官渡(壘)。
         */
        description: 'Still hold Xuchang, Chenliu and Guandu in 203 — Guandu was a battle about not falling back.',
        descriptionZh: '至203年仍據許昌、陳留與官渡 —— 官渡打的是守:自八月至十月,以一敵十而不退者半年。',
        goal: { kind: 'hold-cities', cityIds: ['xuchang', 'chenliu', 'guandu'], byYear: 203 },
      },
      secondary: [
        {
          title: { zh: '破紹之軍', en: 'Break the Host' },
          description: 'Cut Yuan Shao to ten cities by 205 — Guandu, then Cangting, then Ye.',
          descriptionZh: '於205年前使袁紹所據不過十城 —— 官渡、倉亭,而後鄴城。',
          goal: { kind: 'break-force', forceId: 'yuan-shao', maxCities: 10, byYear: 205 },
        },
        {
          title: { zh: '盡滅袁氏', en: 'End the House of Yuan' },
          description: 'Destroy the Yuan Shao force by 207 — the brothers died at White Wolf Mountain.',
          descriptionZh: '於207年前消滅袁紹勢力 —— 二子奔烏丸,盡於白狼山。',
          goal: { kind: 'defeat-force', forceId: 'yuan-shao', byYear: 207 },
        },
      ],
    },
    {
      id: 'obj-200-yuan',
      forceId: 'yuan-shao',
      primary: {
        /*
         * 主次對調(2026-08-06,量測修好之後)。原本主目標是「於207年前消滅曹操」——
         * 四輪 0 中,而史實上他也沒做到:官渡之後兩年他就死了,再五年河北盡入曹手。
         * 照本專案的準則(**主目標寫他真正做到的事**),滅曹該是次要。
         *
         * 他真正做到的是**四州在手**:冀州鄴、青州臨淄、幽州薊、并州晉陽 ——
         * 「橫大河之北,合四州之地」正是沮授說給他聽的那句話。這條是守成型:
         * 開局四座都在他手裡,問題從來不是取,是守得住幾年。
         */
        title: { zh: '合四州之地', en: 'Four Provinces Under One Hand' },
        description: 'Still hold Ye, Linzi, Ji and Jinyang in 205 — "lie across the north of the river and join four provinces."',
        descriptionZh: '至205年仍據鄴、臨淄、薊、晉陽 —— 沮授說的「橫大河之北,合四州之地」。',
        goal: { kind: 'hold-cities', cityIds: ['ye', 'linzi', 'ji', 'taiyuan'], byYear: 205 },
      },
      secondary: [
        {
          title: { zh: '河北統一', en: 'Conquer Cao Cao' },
          description: 'Eliminate the Cao Cao force by 207.',
          descriptionZh: '於207年前消滅曹操 —— 這一件,他沒做到。',
          goal: { kind: 'defeat-force', forceId: 'cao', byYear: 207 },
        },
        {
          title: { zh: '渡河而南', en: 'Cross the River' },
          description: 'Take Guandu by 203 — the fortified camp that held him for half a year.',
          descriptionZh: '於203年前攻取官渡 —— 那座壘擋了他半年。',
          goal: { kind: 'hold-cities', cityIds: ['guandu'], byYear: 203 },
        },
        {
          title: { zh: '田豐之言', en: "Tian Feng's Counsel" },
          description: 'Keep Tian Feng alive and in your service to 205 — he told you not to march, and you jailed him for it.',
          descriptionZh: '至205年田豐仍在麾下 —— 他勸你別南征,而你把他下了獄。',
          goal: { kind: 'recruit-officer', officerId: 'tian-feng', byYear: 205 },
        },
      ],
    },
    /* 孫策 — 史實上他在出兵前死於刺客。這一局他還活著,而許都空虛。 */
    {
      id: 'obj-200-sun',
      forceId: 'sun',
      primary: {
        title: { zh: '江東之固', en: 'Jiangdong Secured' },
        /*
         * 「趁兩強相持攻取許昌」實測十二輪 0 中 —— 那本來就是他**沒能發動**的
         * 那一擊(未發而死於許貢門客之手)。主次對調:主目標是他真正做到的
         * 那件事 —— 五年之間盡有江東六郡,守住建業、吳郡、會稽這三處根本;
         * 襲許留作次要,那是「若他活著」的那條線。
         */
        description: 'Still hold Jianye, Wu and Kuaiji in 205 — five years to take the six commanderies, and they were his.',
        descriptionZh: '至205年仍據建業、吳郡、會稽 —— 五年之間盡有江東六郡,這三處是根本。',
        goal: { kind: 'hold-cities', cityIds: ['jianye', 'wu', 'kuaiji'], byYear: 205 },
      },
      secondary: [
        {
          title: { zh: '襲許之機', en: 'The Opening at Xu' },
          description: 'Take Xuchang by 205 — the blow Sun Ce did not live to strike.',
          descriptionZh: '趁兩強相持於官渡、北方空虛之際攻取許昌 —— 孫策沒能活著發動的那一擊。',
          goal: { kind: 'hold-cities', cityIds: ['xuchang'], byYear: 205 },
        },
        {
          title: { zh: '不死於刺客', en: 'No Assassin' },
          description: 'Survive to 205 — he was twenty-six when Xu Gong\'s retainers found him.',
          descriptionZh: '撐到205年 —— 史實上他二十六歲死於許貢門客之手。',
          goal: { kind: 'survive-until', year: 205 },
        },
      ],
    },
    /* 劉備 — 四十歲,寄人籬下,沒有一寸地。所以主目標就是「有一塊地」。 */
    {
      id: 'obj-200-liubei',
      forceId: 'liu-bei',
      primary: {
        title: { zh: '一寸之地', en: 'One Foot of Ground' },
        description: 'Hold Xiapi and Xiaopei together — keep Xu province instead of losing it a third time.',
        descriptionZh: '同時據有下邳與小沛 —— 這一次別再把徐州丟掉。',
        goal: { kind: 'hold-cities', cityIds: ['xiapi', 'xiaopei'], byYear: 204 },
      },
      secondary: [
        {
          title: { zh: '掛印封金', en: 'The Seal Left Behind' },
          description: 'Get Guan Yu back — he is in Cao Cao\'s camp, and he is coming.',
          descriptionZh: '接回關羽 —— 他在曹營,而他會回來。',
          goal: { kind: 'recruit-officer', officerId: 'guan-yu', byYear: 203 },
        },
        {
          title: { zh: '不再寄人籬下', en: 'No More Roofs' },
          description: 'Still standing in 208 — the year the wind finally turned at Chibi.',
          descriptionZh: '撐到208年 —— 赤壁那一年風才轉向。',
          goal: { kind: 'survive-until', year: 208 },
        },
      ],
    },
    /* 劉表 — 這是他唯一一次伸手就能改寫天下的機會。史實上他沒有伸手。 */
    {
      id: 'obj-200-liubiao',
      forceId: 'liu-biao',
      primary: {
        /* 主次對調(2026-08-06):取許昌四輪 0 中,而史實上劉先勸他動、他沒有動。
           他真正做到的是那安靜的十八年 —— 主目標改成守江漢,取許昌降為次要。 */
        title: { zh: '保江漢間', en: 'Hold the Han and the River' },
        description: 'Still hold Xiangyang, Jiangling and Jiangxia in 208 — the eighteen quiet years.',
        descriptionZh: '至208年仍據襄陽、江陵、江夏 —— 那安靜的十八年,他做到的就是這一件。',
        goal: { kind: 'hold-cities', cityIds: ['xiangyang', 'jiangling', 'jiangxia'], byYear: 208 },
      },
      secondary: [
        {
          title: { zh: '天下之重', en: 'The Weight of the Realm' },
          description: 'Take Xuchang while the two powers are locked — Liu Xian told him the empire turned on him, and he did nothing.',
          descriptionZh: '趁兩強相持攻取許昌 —— 劉先說「天下之重,在於將軍」,而他沒有動。',
          goal: { kind: 'hold-cities', cityIds: ['xuchang'], byYear: 207 },
        },
        {
          title: { zh: '南陽之北', en: 'North of Nanyang' },
          description: 'Take Wancheng — the gate between Jing and the central plains.',
          descriptionZh: '攻取宛城 —— 荊州與中原之間的那道門。',
          goal: { kind: 'hold-cities', cityIds: ['wancheng'], byYear: 207 },
        },
      ],
    },
    /* 劉璋 — 益州的問題從來不是外面打不進來。 */
    {
      id: 'obj-200-liuzhang',
      forceId: 'liu-zhang',
      primary: {
        title: { zh: '天府之守', en: 'Keep the Storehouse' },
        description: 'Still hold Chengdu in 215 — in history he opened the gates in 214.',
        descriptionZh: '撐到215年仍據有成都 —— 史實上他214年開了門。',
        goal: { kind: 'hold-cities', cityIds: ['chengdu'], byYear: 215 },
      },
      secondary: [
        {
          title: { zh: '巴西之防', en: 'The Baxi Line' },
          description: 'Hold Baxi and Zitong — Pang Xi was sent there against Zhang Lu, not against Cao Cao.',
          descriptionZh: '守住巴西與梓潼 —— 龐羲去那裡防的是張魯,不是曹操。',
          goal: { kind: 'hold-cities', cityIds: ['baxi', 'zitong'], byYear: 210 },
        },
        {
          title: { zh: '取漢中', en: 'Take Hanzhong' },
          description: 'Take Hanzhong — the province your family lost when Zhang Lu closed the roads.',
          descriptionZh: '攻取漢中 —— 張魯關了棧道之後,你家丟掉的那一塊。',
          goal: { kind: 'hold-cities', cityIds: ['hanzhong'], byYear: 212 },
        },
      ],
    },
    /* 馬騰 — 史實上是他在西邊替曹操按住了背後。這一局可以不按。 */
    {
      id: 'obj-200-mateng',
      forceId: 'ma-teng',
      primary: {
        /* 主次對調(2026-08-06):取長安四輪 0 中,而長安在這張盤上是曹操的(鍾繇鎮之),
           史實上馬騰也沒去取 —— 他在槐里,受徵而後入朝。改成涼州一統為主。 */
        title: { zh: '涼州一統', en: 'One Command in Liang' },
        description: 'Hold Wuwei, Jincheng and Anding by 205 — the Liang country under a single seal.',
        descriptionZh: '至205年據有武威、金城、安定 —— 涼州只認一個印。',
        goal: { kind: 'hold-cities', cityIds: ['wuwei', 'jincheng', 'anding'], byYear: 205 },
      },
      secondary: [
        {
          title: { zh: '關中十部', en: 'The Ten of Guanzhong' },
          description: "Take Chang'an and hold it — with the north locked at Guandu, no one is watching the pass.",
          descriptionZh: '攻取並據守長安 —— 兩強鎖在官渡,關中無人看管。',
          goal: { kind: 'hold-cities', cityIds: ['changan'], byYear: 207 },
        },
        {
          title: { zh: '不入京師', en: 'Never Go to Court' },
          description: 'Still alive in 212 — the year he went to the capital and his household of two hundred died.',
          descriptionZh: '撐到212年 —— 史實上他入朝為衛尉,那一年全家二百餘口下獄。',
          goal: { kind: 'survive-until', year: 212 },
        },
      ],
    },
    /* 烏丸 — 塞外的規矩:誰給糧、誰給印,就跟誰。 */
    {
      id: 'obj-200-wuhuan',
      forceId: 'wuhuan',
      primary: {
        title: { zh: '白狼山之前', en: 'Before White Wolf Mountain' },
        description: 'Still hold Liucheng in 208 — Cao Cao came over the wall in 207 and the line never formed.',
        descriptionZh: '撐到208年仍據有柳城 —— 史實上207年曹操出塞,那天陣都沒列完。',
        goal: { kind: 'hold-cities', cityIds: ['liucheng'], byYear: 208 },
      },
      secondary: [
        {
          title: { zh: '控弦十萬', en: 'A Hundred Thousand Bows' },
          description: 'Hold Liaodong and Beiping as well — the three Wuhuan commanderies under one chieftain.',
          descriptionZh: '兼有遼東與北平 —— 三郡烏丸歸於一人。',
          goal: { kind: 'hold-cities', cityIds: ['liaodong', 'beiping'], byYear: 206 },
        },
        {
          title: { zh: '入塞', en: 'Through the Wall' },
          description: 'Take Ye — the Wuhuan rode into Hebei more than once, and not only as guests.',
          descriptionZh: '攻取鄴城 —— 烏丸不只一次入河北,而且不只是作客。',
          goal: { kind: 'hold-cities', cityIds: ['ye'], byYear: 210 },
        },
      ],
    },
  ],

  // 208 — Chibi
  'scn-208-chibi': [
    {
      id: 'obj-208-cao',
      forceId: 'cao',
      primary: {
        title: { zh: '北方不動', en: 'The North Does Not Move' },
        /*
         * 原本是「於215年前盡取孫權所有城池」。八十萬眾南下,滅一個孫權看似
         * 理所當然 —— 而赤壁之後他終其一生沒能過江。那是他**沒做到**的事,
         * 照這一批的判準該降為次要。
         *
         * 主目標換成他真正要拿的東西:江陵與江夏。前者是荊州的軍實所在
         * (「晝夜兼行三百餘里」搶的就是它),後者是入江東的門。這兩座拿下了,
         * 赤壁就贏了;拿不下,八十萬眾也只是燒在江上的船。
         */
        /*
         * 再改(2026-08-06,量測修好之後)。「江陵+江夏」四輪 0 中,而**江夏開局
         * 在劉備手裡** —— 曹操、孫權兩家的主目標同時指向那一座,而劉備四輪都守住了。
         * 一座城卡死兩條主目標,兩家一起 0。
         *
         * 只留江陵:那是荊州的軍實所在(「晝夜兼行三百餘里」搶的就是它),
         * 也是他真的搶到過的那一座。江夏改掛在次要。
         */
        /*
         * 三改(2026-08-06)。這張盤的開局外交是照史實寫的 —— 琮已遣使奉降、
         * 騰入朝為衛尉、璋遣使致敬 —— 於是曹操與盤上六家都是互不侵犯,
         * **他唯一能打的只有劉備與孫權,而那兩家在江南**。體檢四輪:
         * 「取江陵江夏」0/4(江陵在互不侵犯的劉琮手裡)、
         * 「定關中」0/4(天水安定在互不侵犯的馬騰手裡)、
         * 連三城的劉備都吃不掉(劉備四輪都是 3 → 3)——**那條江他過不去**,
         * 而那正是赤壁之後十二年的真實形狀。
         *
         * 所以主目標不寫他要拿下什麼,寫他真正做到的那一件:一敗而根本不動。
         * 五都俱在,則北方仍是他的。想拿江陵、想定關中,都在次要。
         */
        /* 五都收成三都:長安與薊各在邊上,四輪裡總有一座掉,而掉一座就整條不算。
           鄴(霸府)、許昌(天子)、洛陽(舊都)才是「根本不動」的那三座。 */
        description: 'Still hold Ye, Xuchang and Luoyang in 216 — he lost the river and did not lose the north.',
        descriptionZh: '至216年仍據鄴、許昌、洛陽 —— 霸府、天子、舊都;赤壁一敗而根本不動,這才是他真正做到的那一件。',
        goal: { kind: 'hold-cities', cityIds: ['ye', 'xuchang', 'luoyang'], byYear: 216 },
      },
      secondary: [
        {
          title: { zh: '定關中', en: 'Settle Guanzhong' },
          description: 'Hold Chang\'an, Chencang, Tianshui and Anding by 214 — the road he took when the river closed.',
          descriptionZh: '於214年前據有長安、陳倉、天水、安定 —— 南路既斷,他就往西走。',
          goal: { kind: 'hold-cities', cityIds: ['changan', 'chencang', 'tianshui', 'anding'], byYear: 214 },
        },
        {
          title: { zh: '會獵於吳', en: 'A Hunt in Wu' },
          description: 'Hold Jiangling and Jiangxia by 212 — the arsenal, and the gate into the east.',
          descriptionZh: '於212年前據有江陵與江夏 —— 一個是荊州的軍實所在,一個是入江東的門。',
          goal: { kind: 'hold-cities', cityIds: ['jiangling', 'jiangxia'], byYear: 212 },
        },
        {
          title: { zh: '南征江東', en: 'Conquer Jiangdong' },
          description: "Destroy the Sun force by 215 — after Red Cliffs he never crossed the river again.",
          descriptionZh: '於215年前消滅孫權勢力 —— 赤壁之後,他終其一生沒能過江。',
          goal: { kind: 'defeat-force', forceId: 'sun', byYear: 215 },
        },
        {
          title: { zh: '一鼓而下', en: 'Take It in One Blow' },
          description: 'Break Liu Bei to a single city by 210 — at Changban he chased him three hundred li and still lost him.',
          descriptionZh: '於210年前使劉備所據不過一城 —— 當陽長阪追了三百餘里,還是讓他跑了。',
          goal: { kind: 'break-force', forceId: 'liu-bei', maxCities: 1, byYear: 210 },
        },
      ],
    },
    {
      id: 'obj-208-sun-liu',
      forceId: 'sun',
      primary: {
        title: { zh: '赤壁之戰', en: 'Win at Red Cliffs' },
        /*
         * 原本是 survive-until 210 —— 開局十四城十三萬兵,活到 210 年是白送。
         * 改成他真正守住的那條線:建業(根本)、柴桑(周瑜屯兵、議降議戰之地)、
         * 江夏(黃祖舊地,赤壁之後的門戶)。
         */
        /* 再改(2026-08-06):江夏開局在劉備手裡,而曹操的主目標也指向它 ——
           三家搶一座,孫曹一起 0/4。換成他自己那條江防線:建業、柴桑、吳郡。
           江夏改掛次要(史實上要到 208 年殺黃祖之後才算真的到手)。 */
        description: 'Still hold Jianye, Chaisang and Wu in 212 — the river line the fire bought.',
        descriptionZh: '至212年仍據建業、柴桑與吳郡 —— 那條江防,是江上那把火換來的。',
        goal: { kind: 'hold-cities', cityIds: ['jianye', 'chaisang', 'wu'], byYear: 212 },
      },
      secondary: [
        {
          title: { zh: '竟長江所極', en: 'The River to Its End' },
          description: 'Take Jiangling by 212 — Zhou Yu spent a year and an arrow in the ribs on it.',
          descriptionZh: '於212年前攻取江陵 —— 周瑜圍了一年,肋上還中了一箭。',
          goal: { kind: 'hold-cities', cityIds: ['jiangling'], byYear: 212 },
        },
        {
          title: { zh: '不降', en: 'No Surrender' },
          description: 'Survive to 210 — the whole court told him to fold, and he cut the corner off the table.',
          descriptionZh: '撐到210年 —— 群下皆勸降,而他拔刀斫案。',
          goal: { kind: 'survive-until', year: 210 },
        },
      ],
    },
    {
      id: 'obj-208-liu',
      forceId: 'liu-bei',
      primary: {
        /*
         * 主次對調(2026-08-06)。「於220年前同時據有成都與漢中」是他一生的完成式,
         * 而在盤上他開局三城、對面曹操四十八城 —— 四輪 0 中,AI 終局也只長到四城。
         * 那條留作次要(玩家扮劉備時,它仍是這張盤真正的終點)。
         *
         * 主目標換成赤壁之後他立刻做到的那一步:荊南四郡。
         * 「先主表琦為荊州刺史,又南征四郡。武陵太守金旋、長沙太守韓玄、
         *   桂陽太守趙範、零陵太守劉度皆降。」—— 那是他第一次有地。
         */
        title: { zh: '南征四郡', en: 'The Four Southern Commanderies' },
        /* ⚠ 長沙開局在孫權手裡,而劉備與孫權是互不侵犯 —— 把長沙寫進去,
           這條就被外交鎖死了(四輪 0 中)。留武陵、桂陽、零陵三郡,
           再加公安:那是他借荊州之後的治所。 */
        description: 'Hold Wuling, Guiyang, Lingling and Gong\'an by 213 — the first land he ever actually held.',
        descriptionZh: '於213年前據有武陵、桂陽、零陵與公安 —— 南征諸郡,太守皆降,那是他第一次有地。',
        goal: { kind: 'hold-cities', cityIds: ['wuling', 'guiyang', 'lingling', 'gongan'], byYear: 213 },
      },
      secondary: [
        {
          title: { zh: '借荊州', en: 'The Loan of Jing' },
          description: 'Take Jiangling by 212 — Sun Quan lent it, and the loan was never repaid.',
          descriptionZh: '於212年前攻取江陵 —— 孫權借的,而這筆帳一直沒還。',
          goal: { kind: 'hold-cities', cityIds: ['jiangling'], byYear: 212 },
        },
        {
          title: { zh: '荊南四郡', en: 'The Four Southern Commanderies' },
          description: 'Take Changsha, Lingling, Guiyang and Wuling by 211 — the ground he actually stood on after the fire.',
          descriptionZh: '於211年前取長沙、零陵、桂陽、武陵 —— 火燒之後,他真正站住的是這四郡。',
          goal: { kind: 'hold-cities', cityIds: ['changsha', 'lingling', 'guiyang', 'wuling'], byYear: 211 },
        },
      ],
    },
    /* 劉琮 — 十七歲,而勸降的人比他官大。所以主目標就是**不降**。 */
    {
      id: 'obj-208-liucong',
      forceId: 'liu-biao',
      primary: {
        title: { zh: '不束手', en: 'Do Not Fold' },
        description: 'Still hold Xiangyang in 210 — in history the letter of surrender went out without a fight.',
        descriptionZh: '撐到210年仍據有襄陽 —— 史實上降書送出去時,一仗都沒打。',
        goal: { kind: 'hold-cities', cityIds: ['xiangyang'], byYear: 210 },
      },
      secondary: [
        {
          title: { zh: '江陵之積', en: 'The Arsenal at Jiangling' },
          description: 'Hold Jiangling — the armoury and grain Cao Cao rode day and night to reach first.',
          descriptionZh: '守住江陵 —— 曹操晝夜兼行搶的就是那裡的軍實。',
          goal: { kind: 'hold-cities', cityIds: ['jiangling'], byYear: 209 },
        },
        {
          title: { zh: '荊州水軍', en: "Jing's River Fleet" },
          description: 'Hold Xiangyang and Jiangxia together — the fleet that decided Red Cliffs was yours first.',
          descriptionZh: '同時據有襄陽與江夏 —— 決定赤壁的那支水軍,本來是你的。',
          goal: { kind: 'hold-cities', cityIds: ['xiangyang', 'jiangxia'], byYear: 212 },
        },
      ],
    },
    /* 劉璋 — 張松袖裡那張圖本來是要獻給曹操的。 */
    {
      id: 'obj-208-liuzhang',
      forceId: 'liu-zhang',
      primary: {
        title: { zh: '西川不獻', en: 'The Map Stays in the Sleeve' },
        description: 'Still hold Chengdu in 215 — Zhang Song sold the way in, and the gates opened in 214.',
        descriptionZh: '撐到215年仍據有成都 —— 張松賣了路,214年門就開了。',
        goal: { kind: 'hold-cities', cityIds: ['chengdu'], byYear: 215 },
      },
      secondary: [
        {
          title: { zh: '永年不叛', en: 'Yongnian Does Not Turn' },
          description: 'Still have Zhang Song in 212 — the year his own brother reported him.',
          descriptionZh: '212年時張松仍在麾下 —— 那一年是他親兄長告發了他。',
          goal: { kind: 'recruit-officer', officerId: 'zhang-song', byYear: 212 },
        },
        {
          title: { zh: '北取漢中', en: 'Take Hanzhong' },
          description: 'Take Hanzhong from Zhang Lu — the reason you ever invited outside help.',
          descriptionZh: '自張魯手中取回漢中 —— 你當初請外援,為的就是這個。',
          goal: { kind: 'hold-cities', cityIds: ['hanzhong'], byYear: 213 },
        },
      ],
    },
    /* 張魯 — 一個以道立國的地方。他要的從來不是天下。 */
    {
      id: 'obj-208-zhanglu',
      forceId: 'zhang-lu',
      primary: {
        /*
         * 三改(2026-08-06)。期限先從 216 收到 212,仍是 0/5 —— 逐城追下來,
         * 吃掉他的是劉璋(漢中易主於第 50/54/198 回合),而史實上劉璋數攻漢中
         * 不能下,那正是他後來請劉備入蜀的理由。姿態那一側已經補了
         * (兵 ×1.70,覆滅 4/5 → 1/5),但「守住漢中到 212」仍然太硬。
         *
         * 主目標改成他真正做到的那一件:活著。「雄據巴漢垂三十年」——
         * 一個道門政權在兩個州牧中間活到 215 年,本身就是那張盤要講的事。
         * 漢中不失降為次要。
         */
        title: { zh: '雄據巴漢', en: 'Thirty Years in Ba and Han' },
        description: 'Survive to 215 — a Daoist theocracy between two provincial governors, and it lasted thirty years.',
        descriptionZh: '撐到215年 —— 五斗米道據巴漢垂三十年,而215年曹操自散關入,他封藏府庫而去。',
        goal: { kind: 'survive-until', year: 215 },
      },
      secondary: [
        {
          title: { zh: '漢寧之治', en: 'The Rule of Hanning' },
          description: 'Still hold Hanzhong in 212 — Liu Zhang attacked it for years and never took it.',
          descriptionZh: '至212年仍據有漢中 —— 劉璋數攻不能下,這才請劉備入蜀。',
          goal: { kind: 'hold-cities', cityIds: ['hanzhong'], byYear: 212 },
        },
        {
          title: { zh: '巴漢之民', en: 'The People of Ba and Han' },
          description: 'Hold Hanzhong and Baxi together — the Ba country where tens of thousands followed the Way.',
          descriptionZh: '同時據有漢中與巴西 —— 奉道者數萬戶的巴地。',
          goal: { kind: 'hold-cities', cityIds: ['hanzhong', 'baxi'], byYear: 214 },
        },
        {
          title: { zh: '南取益州', en: 'South into Yi' },
          description: 'Take Chengdu — Liu Zhang killed your mother and brother, and the roads run both ways.',
          descriptionZh: '攻取成都 —— 劉璋殺你母弟,而棧道是雙向的。',
          goal: { kind: 'hold-cities', cityIds: ['chengdu'], byYear: 215 },
        },
      ],
    },
    /* 馬騰 — 這一年朝廷徵他入朝。韓遂勸他別去。 */
    {
      id: 'obj-208-mateng',
      forceId: 'ma-teng',
      primary: {
        title: { zh: '不入鄴城', en: 'Never Ride to Ye' },
        description: 'Still alive in 212 — he accepted the summons in 208 and his household died in 212.',
        descriptionZh: '撐到212年 —— 史實上他208年應徵入朝,212年全家二百餘口下獄。',
        goal: { kind: 'survive-until', year: 212 },
      },
      secondary: [
        {
          title: { zh: '關中之地', en: 'The Guanzhong Country' },
          description: "Take Chang'an — the pass country the ten commands could never agree on.",
          descriptionZh: '攻取長安 —— 關中十部誰也談不攏的那塊地。',
          goal: { kind: 'hold-cities', cityIds: ['changan'], byYear: 213 },
        },
        {
          title: { zh: '孟起在側', en: 'Mengqi at Hand' },
          description: 'Still have Ma Chao in 214 — he rose in the west, and it cost the family everything.',
          descriptionZh: '214年時馬超仍在麾下 —— 他起兵的代價是全家。',
          goal: { kind: 'recruit-officer', officerId: 'ma-chao', byYear: 214 },
        },
      ],
    },
    /* 士燮 — 離戰場最遠、活得最久的人。他的勝利是「什麼都沒發生」。 */
    {
      id: 'obj-208-shixie',
      forceId: 'shi-xie',
      primary: {
        title: { zh: '疆場無事', en: 'No Alarm on the Border' },
        description: 'Still hold Jiaozhi and Nanhai in 220 — forty years in the post and the province never burned.',
        descriptionZh: '撐到220年仍據有交趾與南海 —— 在郡四十餘年,交州獨全。',
        goal: { kind: 'hold-cities', cityIds: ['jiaozhi', 'nanhai'], byYear: 220 },
      },
      secondary: [
        {
          title: { zh: '南海之富', en: 'The Wealth of the Southern Sea' },
          description: 'Hold Jiaozhi, Nanhai, Hepu and Jiuzhen — the whole of Jiao under one house.',
          descriptionZh: '據有交趾、南海、合浦、九真 —— 交州盡歸一門。',
          goal: { kind: 'hold-cities', cityIds: ['jiaozhi', 'nanhai', 'hepu', 'jiuzhen'], byYear: 215 },
        },
        {
          title: { zh: '北向荊南', en: 'North into the Jing South' },
          description: 'Take Changsha — the one direction a Jiao lord could ever have gone.',
          descriptionZh: '攻取長沙 —— 交州之主唯一可能北上的方向。',
          goal: { kind: 'hold-cities', cityIds: ['changsha'], byYear: 220 },
        },
      ],
    },
  ],

  // 220 — Three Kingdoms Declared
  'scn-220-declaration': [
    {
      id: 'obj-220-cao',
      forceId: 'cao',
      primary: {
        title: { zh: '受禪定鼎', en: 'The Abdication Received' },
        description: "Still hold Luoyang, Xuchang, Chang'an and Ye in 226 — the dynasty is new; first it must not wobble.",
        descriptionZh: "至226年仍據洛陽、許昌、長安、鄴 —— 新朝初立,先站得住再談一統。",
        goal: { kind: 'hold-cities', cityIds: ['luoyang', 'changan'], byYear: 226 },
      },
      secondary: [
        {
          title: { zh: '魏之天下統一', en: 'Wei Unifies the Realm' },
          description: 'Unify all cities under Wei.',
          descriptionZh: "於魏旗之下統一天下諸城。",
          goal: { kind: 'unify-realm' },
        },
      ],
    },
    {
      id: 'obj-220-liu',
      forceId: 'liu-bei',
      primary: {
        title: { zh: '即皇帝位', en: 'Take the Imperial Title' },
        description: "Declare yourself emperor — with the Han abdicated, the succession has to be claimed by someone.",
        descriptionZh: "稱帝建號 —— 漢統既絕,總得有人接;章武元年四月即位於成都武擔之南。",
        goal: { kind: 'declare-emperor' },
      },
      secondary: [
        {
          title: { zh: '漢室再興', en: 'Restore the Han' },
          description: 'Hold Luoyang and Chang\'an at the same time.',
          descriptionZh: "同時據有洛陽與長安。",
          goal: { kind: 'hold-cities', cityIds: ['luoyang', 'changan'] },
        },
      ],
    },
    {
      id: 'obj-220-sun',
      forceId: 'sun',
      primary: {
        title: { zh: '吳皇帝即位', en: 'Sun Quan as Emperor' },
        description: 'Declare yourself Emperor (via the Court edict).',
        descriptionZh: "頒朝廷詔書,自立為帝。",
        goal: { kind: 'declare-emperor' },
      },
    },
  ],

  // 234 — Wuzhang Plains
  'scn-234-wuzhang': [
    {
      id: 'obj-234-shu',
      forceId: 'liu-bei',
      primary: {
        title: { zh: '屯田渭濱', en: 'Farming the Wei Banks' },
        description: "Still hold Hanzhong, Wudu and Yinping in 240 — dig in among the people and outlast him.",
        descriptionZh: "至240年仍據漢中、武都、陰平 —— 分兵屯田,雜於渭濱居民之間,百姓安堵而軍無私。",
        goal: { kind: 'hold-cities', cityIds: ['hanzhong', 'wudu', 'yinping'], byYear: 240 },
      },
      secondary: [
        {
          title: { zh: '北伐成就', en: 'Complete the Northern Campaign' },
          description: 'Take Chang\'an before Zhuge Liang dies (236 AD).',
          descriptionZh: "於諸葛亮歸天(236年)前攻取長安。",
          goal: { kind: 'hold-cities', cityIds: ['changan'], byYear: 236 },
        },
      ],
    },
    {
      id: 'obj-234-wei',
      forceId: 'cao',
      primary: {
        title: { zh: '拒亮於渭南', en: 'Hold the Wei' },
        description: "Still hold Chang'an, Anding and Longxi in 240 — refuse battle; the grain will decide it.",
        descriptionZh: "至240年仍據長安、安定、隴西 —— 堅壁拒守,不與交鋒,以待其變。",
        goal: { kind: 'hold-cities', cityIds: ['changan'], byYear: 240 },
      },
      secondary: [
        {
          title: { zh: '蜀漢殲滅', en: 'Crush Shu' },
          description: 'Eliminate the Liu Bei force.',
          descriptionZh: "於245年前消滅劉備勢力。",
          goal: { kind: 'defeat-force', forceId: 'liu-bei', byYear: 245 },
        },
      ],
    },
  ],

  // 215 — Battle of Hefei
  'scn-215-hefei': [
    {
      id: 'obj-215-sun',
      forceId: 'sun',
      primary: {
        title: { zh: '保江東', en: 'Hold the Southland' },
        description: "Still hold Jianye, Wu and Chaisang in 217 — ten thousand went to Hefei; eight hundred sent them home.",
        descriptionZh: "至217年仍據建業、吳郡、柴桑 —— 十萬眾出合肥,八百人把他們趕了回來。",
        goal: { kind: 'hold-cities', cityIds: ['jianye', 'wu', 'chaisang'], byYear: 217 },
      },
      secondary: [
        {
          title: { zh: '攻取合肥', en: 'Take Hefei' },
          description: 'Seize Hefei by 217 — pry open the road north.',
          descriptionZh: "於217年前攻取合肥,打開北進之門。",
          goal: { kind: 'hold-cities', cityIds: ['hefei'], byYear: 217 },
        },
        {
          title: { zh: '兵指壽春', en: 'March on Shouchun' },
          description: 'Hold Shouchun by 219.',
          descriptionZh: "於219年前據有壽春。",
          goal: { kind: 'hold-cities', cityIds: ['shouchun'], byYear: 219 },
        },
      ],
    },
    {
      id: 'obj-215-wei',
      forceId: 'cao',
      primary: {
        title: { zh: '張遼守合肥', en: "Zhang Liao's Stand" },
        description: 'Still hold Hefei at 217 — the legendary defense with 7,000 men.',
        descriptionZh: "以張遼七千之眾,於217年仍守住合肥,成就逍遙津傳奇。",
        goal: { kind: 'hold-cities', cityIds: ['hefei'], byYear: 217 },
      },
      secondary: [
        {
          title: { zh: '西取漢中', en: 'Take Hanzhong' },
          description: 'Take Hanzhong from Zhang Lu by 216.',
          descriptionZh: "於216年前自張魯手中取漢中。",
          goal: { kind: 'hold-cities', cityIds: ['hanzhong'], byYear: 216 },
        },
      ],
    },
    {
      id: 'obj-215-shu',
      forceId: 'liu-bei',
      primary: {
        title: { zh: '北爭漢中', en: 'Contest Hanzhong' },
        description: 'Take Hanzhong by 219 — the shield of Yi province.',
        descriptionZh: "於219年前奪取漢中,為益州之屏障。",
        goal: { kind: 'hold-cities', cityIds: ['hanzhong'], byYear: 219 },
      },
    },
    {
      id: 'obj-215-zhanglu',
      forceId: 'zhang-lu',
      primary: {
        title: { zh: '五斗自守', en: 'Hold the Faith' },
        description: 'Survive as lord of Hanzhong until 218.',
        descriptionZh: "憑五斗米道之眾,守漢中政教至218年。",
        goal: { kind: 'survive-until', year: 218 },
      },
    },
  ],

  // 219 — Hanzhong Campaign
  'scn-219-hanzhong': [
    {
      id: 'obj-219-shu',
      forceId: 'liu-bei',
      primary: {
        title: { zh: '定軍山斬夏侯', en: 'Mount Dingjun' },
        description: 'Hold Hanzhong by 220 — the road to King of Hanzhong.',
        descriptionZh: "於220年前據有漢中,黃忠斬夏侯淵,進位漢中王。",
        goal: { kind: 'hold-cities', cityIds: ['hanzhong'], byYear: 220 },
      },
      secondary: [
        {
          title: { zh: '跨有荊益', en: 'Jing and Yi Both' },
          description: 'Hold Chengdu and Jiangling together.',
          descriptionZh: "同時據有成都與江陵,跨有荊益,復隆中之策。",
          goal: { kind: 'hold-cities', cityIds: ['chengdu', 'jiangling'] },
        },
      ],
    },
    {
      id: 'obj-219-wei',
      forceId: 'cao',
      primary: {
        title: { zh: '拒漢中於秦川', en: 'Hold Hanzhong' },
        description: 'Still hold Hanzhong at 220 — keep Liu Bei out of Guanzhong.',
        descriptionZh: "於220年仍守住漢中,拒劉備於秦川之外。",
        goal: { kind: 'hold-cities', cityIds: ['hanzhong'], byYear: 220 },
      },
    },
    {
      id: 'obj-219-wu',
      forceId: 'sun',
      primary: {
        title: { zh: '白衣渡江', en: 'The White-Robed Crossing' },
        description: 'Take Jiangling by 220 — Lü Meng seizes Jing province.',
        descriptionZh: "呂蒙白衣渡江,於220年前襲取江陵,奪回荊州。",
        goal: { kind: 'hold-cities', cityIds: ['jiangling'], byYear: 220 },
      },
    },
  ],

  // 222 — Battle of Yiling
  'scn-222-yiling': [
    {
      id: 'obj-222-shu',
      forceId: 'liu-bei',
      primary: {
        title: { zh: '秭歸之進', en: 'The Advance to Zigui' },
        description: "Hold Yiling and Xiaoting by 225 — the army got this far, and then the camps burned.",
        descriptionZh: "於225年前取夷陵、猇亭 —— 大軍推到這裡,然後四十餘營燒了一夜。",
        goal: { kind: 'hold-cities', cityIds: ['yiling', 'xiaoting'], byYear: 225 },
      },
      secondary: [
        {
          title: { zh: '為關羽復仇', en: 'Avenge Guan Yu' },
          description: 'Retake Jiangling from Wu by 225 — wash away the shame of Guan Yu.',
          descriptionZh: "於225年前自東吳手中奪回江陵,以雪雲長之恨。",
          goal: { kind: 'hold-cities', cityIds: ['jiangling'], byYear: 225 },
        },
        {
          title: { zh: '伐滅東吳', en: 'Destroy Wu' },
          description: 'Defeat the Sun Quan force.',
          descriptionZh: "擊潰孫權勢力,盡復荊州。",
          goal: { kind: 'defeat-force', forceId: 'sun' },
        },
      ],
    },
    {
      id: 'obj-222-wu',
      forceId: 'sun',
      primary: {
        title: { zh: '火燒連營', en: 'The Camps Burn' },
        description: "Still hold Jiangling, Yiling and Xiaoting in 226 — Lu Xun gave ground for months, then burned forty camps in a night.",
        descriptionZh: "至226年仍據江陵、夷陵、猇亭 —— 陸遜退了七八百里,然後一夜燒了四十餘營。",
        goal: { kind: 'hold-cities', cityIds: ['jiangling', 'yiling', 'xiaoting'], byYear: 226 },
      },
      secondary: [
        {
          title: { zh: '火燒連營', en: 'Burn the Camps' },
          description: 'Break Liu Bei — defeat the Shu invasion.',
          descriptionZh: "以陸遜之火,擊潰劉備伐吳之師。",
          goal: { kind: 'defeat-force', forceId: 'liu-bei' },
        },
        {
          title: { zh: '固守荊州', en: 'Hold Jing Province' },
          description: 'Still hold Jiangling and Yiling by 224.',
          descriptionZh: "於224年仍據江陵與夷陵,保江東門戶。",
          goal: { kind: 'hold-cities', cityIds: ['jiangling', 'yiling'], byYear: 224 },
        },
      ],
    },
    {
      id: 'obj-222-wei',
      forceId: 'cao',
      primary: {
        title: { zh: '坐收漁利', en: 'Reap the Spoils' },
        description: 'While Shu and Wu bleed, seize Jing — hold Xiangyang and Jiangling by 226.',
        descriptionZh: "趁蜀吳相爭,南取荊襄 —— 於226年前據有襄陽與江陵。",
        goal: { kind: 'hold-cities', cityIds: ['xiangyang', 'jiangling'], byYear: 226 },
      },
      secondary: [
        {
          title: { zh: '混一宇內', en: 'Unify the Realm' },
          description: 'Bring all under Wei.',
          descriptionZh: "混一天下,成魏之大業。",
          goal: { kind: 'unify-realm' },
        },
      ],
    },
  ],

  // 189 — The Ten Attendants
  'scn-189-eunuchs': [
    {
      id: 'obj-189-hejin',
      forceId: 'han',
      primary: {
        title: { zh: '盡誅閹豎', en: 'Purge the Eunuchs' },
        description: 'Destroy the Ten Attendants by 192.',
        descriptionZh: "於192年前翦除十常侍,還政於朝。",
        goal: { kind: 'defeat-force', forceId: 'eunuchs', byYear: 192 },
      },
      secondary: [
        {
          title: { zh: '毋召外兵', en: 'Do Not Summon the Border Armies' },
          description: 'Break Dong Zhuo — the wolf you should never have called in.',
          descriptionZh: "擊潰董卓 —— 引狼入室者,終須自誅其狼。",
          goal: { kind: 'defeat-force', forceId: 'dong' },
        },
      ],
    },
    {
      id: 'obj-189-eunuchs',
      forceId: 'eunuchs',
      primary: {
        title: { zh: '挾持宮禁', en: 'Hold the Palace' },
        description: 'Still hold Luoyang in 193 — the Son of Heaven in your sleeves.',
        descriptionZh: "至193年仍據洛陽 —— 天子在袖,詔命由我。",
        goal: { kind: 'hold-cities', cityIds: ['luoyang'], byYear: 193 },
      },
    },
    {
      id: 'obj-189-dong',
      forceId: 'dong',
      primary: {
        title: { zh: '提兵入洛', en: 'March into Luoyang' },
        description: 'Take Luoyang by 192.',
        descriptionZh: "於192年前提兵入洛,執掌朝綱。",
        goal: { kind: 'hold-cities', cityIds: ['luoyang'], byYear: 192 },
      },
      secondary: [
        {
          title: { zh: '兩京在握', en: 'Both Capitals' },
          description: "Hold Luoyang and Chang'an together by 195.",
          descriptionZh: "於195年前兼據洛陽與長安,退可西守,進可東出。",
          goal: { kind: 'hold-cities', cityIds: ['luoyang', 'changan'], byYear: 195 },
        },
      ],
    },
    {
      id: 'obj-189-cao',
      forceId: 'cao',
      primary: {
        title: { zh: '奉天子以令不臣', en: 'Shelter the Son of Heaven' },
        description: 'Hold Luoyang and Xuchang by 199.',
        descriptionZh: "於199年前兼據洛陽與許昌,奉天子以令不臣。",
        goal: { kind: 'hold-cities', cityIds: ['luoyang', 'xuchang'], byYear: 199 },
      },
      secondary: [
        {
          title: { zh: '兗徐為基', en: 'Yan and Xu as the Base' },
          description: 'Hold Pengcheng and Xiapi by 199.',
          descriptionZh: "於199年前據彭城、下邳,以兗徐為根本。",
          goal: { kind: 'hold-cities', cityIds: ['pengcheng', 'xiapi'], byYear: 199 },
        },
      ],
    },
    {
      id: 'obj-189-yuanshao',
      forceId: 'yuan-shao',
      primary: {
        title: { zh: '跨有河北', en: 'Straddle the North' },
        description: 'Control Ji province by 200 — four provinces, a hundred thousand horse.',
        descriptionZh: "於200年前盡取冀州 —— 據四州之地,擁百萬之眾。",
        goal: { kind: 'control-province', provinceId: 'ji', byYear: 200 },
      },
    },
    {
      id: 'obj-189-sun',
      forceId: 'sun',
      primary: {
        title: { zh: '江東猛虎', en: 'The Tiger of Jiangdong' },
        description: 'Take Xiangyang by 196 — the wall that killed you in history.',
        descriptionZh: "於196年前攻取襄陽 —— 峴山之下,史書曾載你的死。",
        goal: { kind: 'hold-cities', cityIds: ['xiangyang'], byYear: 196 },
      },
      secondary: [
        {
          title: { zh: '荊南立業', en: 'A Seat in the South' },
          description: 'Hold Changsha and Jiangling by 198.',
          descriptionZh: "於198年前據長沙、江陵,以荊南為業。",
          goal: { kind: 'hold-cities', cityIds: ['changsha', 'jiangling'], byYear: 198 },
        },
      ],
    },
    {
      id: 'obj-189-liubiao',
      forceId: 'liu-biao',
      primary: {
        title: { zh: '坐保江漢', en: 'Keep the Han Valley' },
        description: 'Still hold Xiangyang, Jiangling and Jiangxia in 205.',
        descriptionZh: "至205年仍據襄陽、江陵、江夏 —— 守成之主,亦是一種答案。",
        goal: { kind: 'hold-cities', cityIds: ['xiangyang', 'jiangling', 'jiangxia'], byYear: 205 },
      },
    },
  ],

  // 192 — Wang Yun's chained stratagem
  'scn-192-wangyun': [
    {
      id: 'obj-192-han',
      forceId: 'han',
      primary: {
        title: { zh: '除卓餘燼', en: 'Finish What the Dagger Started' },
        description: 'Destroy the Li Jue force by 196 — Dong Zhuo is dead, his army is not.',
        descriptionZh: "於196年前翦滅李傕 —— 董卓已死,其眾未散。",
        goal: { kind: 'defeat-force', forceId: 'lijue', byYear: 196 },
      },
      secondary: [
        {
          title: { zh: '守漢舊都', en: "Hold Chang'an" },
          description: "Still hold Chang'an in 196.",
          descriptionZh: "至196年仍據長安,不使乘輿再度播遷。",
          goal: { kind: 'hold-cities', cityIds: ['changan'], byYear: 196 },
        },
      ],
    },
    {
      id: 'obj-192-lubu',
      forceId: 'lubu',
      primary: {
        title: { zh: '飛將求地', en: 'A Land for the Flying General' },
        description: 'Hold Luoyang and Hulao by 196 — you have a halberd, not a home.',
        descriptionZh: "於196年前據洛陽、虎牢 —— 有戟無土,終為客將。",
        goal: { kind: 'hold-cities', cityIds: ['luoyang', 'hulao'], byYear: 196 },
      },
    },
    {
      id: 'obj-192-lijue',
      forceId: 'lijue',
      primary: {
        title: { zh: '還都長安', en: "Retake Chang'an" },
        description: "Take Chang'an by 195 — avenge the Grand Preceptor.",
        descriptionZh: "於195年前攻取長安,為太師復仇。",
        goal: { kind: 'hold-cities', cityIds: ['changan'], byYear: 195 },
      },
    },
    {
      id: 'obj-192-cao',
      forceId: 'cao',
      primary: {
        title: { zh: '迎駕許都', en: 'Bring the Emperor to Xuchang' },
        description: "Hold Xuchang and Chang'an by 198.",
        descriptionZh: "於198年前兼據許昌與長安,迎天子而定名分。",
        goal: { kind: 'hold-cities', cityIds: ['xuchang', 'changan'], byYear: 198 },
      },
    },
    {
      id: 'obj-192-yuanshu',
      forceId: 'yuan-shu',
      primary: {
        title: { zh: '玉璽在手', en: 'The Seal is Mine' },
        description: 'Declare yourself emperor — the Imperial Seal came to your hand for a reason.',
        descriptionZh: "稱帝建號 —— 傳國玉璽既入吾手,豈非天意?",
        goal: { kind: 'declare-emperor' },
      },
      secondary: [
        {
          title: { zh: '淮南根本', en: 'The Huainan Base' },
          description: 'Still hold Shouchun in 199 — where history says you starved.',
          descriptionZh: "至199年仍據壽春 —— 史載你正是死在這座城裡。",
          goal: { kind: 'hold-cities', cityIds: ['shouchun'], byYear: 199 },
        },
      ],
    },
    {
      id: 'obj-192-gongsun',
      forceId: 'gongsun',
      primary: {
        title: { zh: '白馬義從', en: 'The White Horse Volunteers' },
        description: "Still hold Ji, Beiping, Yuyang and Yi County in 199 — You province also runs out to Lelang and Daifang, which no one contests.",
        descriptionZh: "至199年仍據薊、北平、漁陽、易縣 —— 幽州名下還有樂浪帶方,那是沒有人去爭的地方。",
        goal: { kind: 'hold-cities', cityIds: ['ji', 'beiping', 'yuyang'], byYear: 199 },
      },
      secondary: [
        {
          title: { zh: '白馬義從', en: 'The White Horse Volunteers' },
          description: 'Control You province by 199, then break Yuan Shao.',
          descriptionZh: "於199年前盡有幽州,再圖河北。",
          goal: { kind: 'control-province', provinceId: 'you', byYear: 199 },
        },
        {
          title: { zh: '河北決勝', en: 'Break Yuan Shao' },
          description: 'Destroy the Yuan Shao force.',
          descriptionZh: "擊潰袁紹 —— 界橋之恥,當於此雪。",
          goal: { kind: 'defeat-force', forceId: 'yuan-shao' },
        },
      ],
    },
  ],

  // 194 — Governor of Xuzhou
  'scn-194-xuzhou': [
    {
      id: 'obj-194-cao',
      forceId: 'cao',
      primary: {
        title: { zh: '報父之讎', en: 'Avenge Your Father' },
        description: 'Take Pengcheng and Xiapi by 198.',
        descriptionZh: "於198年前攻取彭城、下邳 —— 父讎在徐州。",
        goal: { kind: 'hold-cities', cityIds: ['pengcheng', 'xiapi'], byYear: 198 },
      },
      secondary: [
        {
          title: { zh: '定兗州之亂', en: 'Put Down the Yan Revolt' },
          description: 'Destroy Lü Bu — he took your province while you marched east.',
          descriptionZh: "擊滅呂布 —— 你東征之時,他偷了你的兗州。",
          goal: { kind: 'defeat-force', forceId: 'lubu' },
        },
      ],
    },
    {
      id: 'obj-194-tao',
      forceId: 'tao',
      primary: {
        title: { zh: '徐州不失', en: 'Xuzhou Shall Not Fall' },
        description: 'Still hold Pengcheng and Xiapi in 198.',
        descriptionZh: "至198年仍保彭城、下邳 —— 老病之身,守得一方是一方。",
        goal: { kind: 'hold-cities', cityIds: ['pengcheng', 'xiapi'], byYear: 198 },
      },
    },
    {
      id: 'obj-194-lubu',
      forceId: 'lubu',
      primary: {
        title: { zh: '奪兗取徐', en: 'Yan First, Then Xu' },
        description: 'Hold Puyang and Xiapi by 199.',
        descriptionZh: "於199年前兼據濮陽、下邳,自濮陽起,終於下邳。",
        goal: { kind: 'hold-cities', cityIds: ['puyang', 'xiapi'], byYear: 199 },
      },
    },
    {
      id: 'obj-194-yuanshao',
      forceId: 'yuan-shao',
      primary: {
        title: { zh: '河北一統', en: 'Master of the North' },
        description: 'Control Ji province by 201.',
        descriptionZh: "於201年前盡取冀州。",
        goal: { kind: 'control-province', provinceId: 'ji', byYear: 201 },
      },
      secondary: [
        {
          title: { zh: '南向許都', en: 'March South' },
          description: 'Take Xuchang by 205.',
          descriptionZh: "於205年前南取許昌。",
          goal: { kind: 'hold-cities', cityIds: ['xuchang'], byYear: 205 },
        },
      ],
    },
    {
      id: 'obj-194-yuanshu',
      forceId: 'yuan-shu',
      primary: {
        title: { zh: '仲氏之業', en: 'The House of Zhong' },
        description: 'Declare yourself emperor.',
        descriptionZh: "稱帝建號,國號仲氏。",
        goal: { kind: 'declare-emperor' },
      },
    },
    {
      id: 'obj-194-mateng',
      forceId: 'ma-teng',
      primary: {
        title: { zh: '西涼鐵騎', en: 'The Iron Horse of Liang' },
        description: "Still hold Jincheng, Wuwei, Anding and Longxi in 202 — Liang also counts Dunhuang and Jiuquan, a month's ride past anyone's interest.",
        descriptionZh: "至202年仍據金城、武威、安定、隴西 —— 涼州名下還有敦煌酒泉,那是誰也不會去的河西盡頭。",
        goal: { kind: 'hold-cities', cityIds: ['jincheng', 'wuwei', 'anding'], byYear: 202 },
      },
      secondary: [
        {
          title: { zh: '西涼鐵騎', en: 'The Iron Horse of Liang' },
          description: 'Control Liang province by 202.',
          descriptionZh: "於202年前盡有涼州,鐵騎出隴。",
          goal: { kind: 'control-province', provinceId: 'liang', byYear: 202 },
        },
      ],
    },
  ],

  // 195 — Sun Ce takes Jiangdong
  'scn-195-jiangdong': [
    {
      id: 'obj-195-sun',
      forceId: 'sun',
      primary: {
        title: { zh: '江東六郡', en: 'The Six Commanderies' },
        description: 'Hold Jianye, Wu, Kuaiji and Yuzhang by 200 — with a thousand borrowed men.',
        descriptionZh: "於200年前盡取建業、吳、會稽、豫章 —— 以千餘借兵,取江東六郡。",
        goal: { kind: 'hold-cities', cityIds: ['jianye', 'wu', 'kuaiji', 'yuzhang'], byYear: 200 },
      },
      secondary: [
        {
          title: { zh: '掃平劉繇', en: 'Sweep Away Liu Yao' },
          description: 'Destroy the Liu Yao force.',
          descriptionZh: "擊滅劉繇,拔曲阿之根。",
          goal: { kind: 'defeat-force', forceId: 'liu-yao' },
        },
      ],
    },
    {
      id: 'obj-195-liuyao',
      forceId: 'liu-yao',
      primary: {
        title: { zh: '守曲阿', en: 'Hold the Line at Qu\'e' },
        description: 'Still hold Jianye in 199 — the little tyrant is coming.',
        descriptionZh: "至199年仍據建業 —— 小霸王已渡江而來。",
        goal: { kind: 'hold-cities', cityIds: ['jianye'], byYear: 199 },
      },
    },
    {
      id: 'obj-195-huaxin',
      forceId: 'hua-xin',
      primary: {
        title: { zh: '豫章自保', en: 'Keep Yuzhang' },
        description: 'Still hold Yuzhang and Chaisang in 200.',
        descriptionZh: "至200年仍保豫章、柴桑 —— 名士守土,亦須刀兵。",
        goal: { kind: 'hold-cities', cityIds: ['yuzhang', 'chaisang'], byYear: 200 },
      },
    },
    {
      id: 'obj-195-cao',
      forceId: 'cao',
      primary: {
        title: { zh: '決戰河北', en: 'Settle It With Yuan Shao' },
        description: 'Destroy the Yuan Shao force by 207.',
        descriptionZh: "於207年前擊滅袁紹,定河北之局。",
        goal: { kind: 'defeat-force', forceId: 'yuan-shao', byYear: 207 },
      },
      secondary: [
        {
          title: { zh: '官渡不失', en: 'Hold Guandu' },
          description: 'Still hold Guandu in 202.',
          descriptionZh: "至202年仍守官渡 —— 此地一失,許都無險。",
          goal: { kind: 'hold-cities', cityIds: ['guandu'], byYear: 202 },
        },
      ],
    },
    {
      id: 'obj-195-yuanshao',
      forceId: 'yuan-shao',
      primary: {
        title: { zh: '南下許都', en: 'Take Xuchang' },
        description: 'Take Xuchang by 203.',
        descriptionZh: "於203年前南下攻取許昌,挾天子者當易人。",
        goal: { kind: 'hold-cities', cityIds: ['xuchang'], byYear: 203 },
      },
    },
    {
      id: 'obj-195-yuanshu',
      forceId: 'yuan-shu',
      primary: {
        title: { zh: '僭號稱尊', en: 'Take the Title' },
        description: 'Declare yourself emperor.',
        descriptionZh: "稱帝建號。",
        goal: { kind: 'declare-emperor' },
      },
    },
    /* 呂布 — 兩座城,十一員將。史實上他 199 年死於白門樓,所以主目標就是
       活過那一年,而且是在下邳活過。 */
    {
      id: 'obj-195-lubu',
      forceId: 'lu-bu',
      primary: {
        title: { zh: '白門樓之前', en: 'Before the White Gate' },
        description: 'Still hold Xiapi in 200 AD — in history the tower fell in 199.',
        descriptionZh: '撐到200年仍據有下邳 —— 史實上白門樓是199年的事。',
        goal: { kind: 'hold-cities', cityIds: ['xiapi'], byYear: 200 },
      },
      secondary: [
        {
          title: { zh: '徐州之主', en: 'Master of Xu' },
          description: 'Hold Xiapi and Langya together — the province you took while its lord was away.',
          descriptionZh: '同時據有下邳與琅琊 —— 趁人出兵而取的那個州。',
          goal: { kind: 'hold-cities', cityIds: ['xiapi', 'langya'], byYear: 198 },
        },
        {
          title: { zh: '公臺不去', en: 'Gongtai Stays' },
          description: 'Keep Chen Gong — he knew exactly what you were and stayed anyway.',
          descriptionZh: '留住陳宮 —— 他明知你是什麼人,還是留下了。',
          goal: { kind: 'recruit-officer', officerId: 'chen-gong', byYear: 199 },
        },
      ],
    },
    /* 劉表 — 不出兵就沒人動得了他。所以主目標是「守住十八年」,
       副目標才是那筆峴山的血債。 */
    {
      id: 'obj-195-liubiao',
      forceId: 'liu-biao',
      primary: {
        title: { zh: '荊州獨安', en: 'Jing Alone at Peace' },
        description: 'Still hold Xiangyang in 208 AD — Liu Biao held it eighteen years and died in his bed.',
        descriptionZh: '撐到208年仍據有襄陽 —— 劉表守了十八年,死於病榻。',
        goal: { kind: 'hold-cities', cityIds: ['xiangyang'], byYear: 208 },
      },
      secondary: [
        {
          title: { zh: '江夏之門', en: 'The Gate at Jiangxia' },
          description: 'Hold Jiangxia — Huang Zu killed Sun Jian, and the son will come for it.',
          descriptionZh: '守住江夏 —— 黃祖射殺孫堅,那個兒子遲早要來。',
          goal: { kind: 'hold-cities', cityIds: ['jiangxia'], byYear: 208 },
        },
        {
          title: { zh: '斷其根本', en: 'Cut the Root' },
          description: 'Destroy the Sun force before it can take the six commanderies.',
          descriptionZh: '在孫氏取得江東六郡之前擊滅之。',
          goal: { kind: 'defeat-force', forceId: 'sun', byYear: 205 },
        },
      ],
    },
    /* 劉璋 — 史實上他撐到 214 年開城。主目標就是把那道門守住。 */
    {
      id: 'obj-195-liuzhang',
      forceId: 'liu-yan',
      primary: {
        title: { zh: '不開此門', en: 'Do Not Open the Gate' },
        description: 'Still hold Chengdu in 215 AD — in history he opened it in 214.',
        descriptionZh: '撐到215年仍據有成都 —— 史實上他214年開了門。',
        goal: { kind: 'hold-cities', cityIds: ['chengdu'], byYear: 215 },
      },
      secondary: [
        {
          title: { zh: '收漢中', en: 'Retake Hanzhong' },
          description: 'Take Hanzhong from Zhang Lu — he closed the plank roads after you killed his family.',
          descriptionZh: '自張魯手中取回漢中 —— 你殺了他母弟,他關了棧道。',
          goal: { kind: 'hold-cities', cityIds: ['hanzhong'], byYear: 210 },
        },
        {
          title: { zh: '孝直不叛', en: 'Xiaozhi Does Not Turn' },
          description: 'Still have Fa Zheng in 213 — the man who wrote to Liu Bei showing him the way in.',
          descriptionZh: '213年時法正仍在麾下 —— 就是他寫信替劉備指路的。',
          goal: { kind: 'recruit-officer', officerId: 'fa-zheng', byYear: 213 },
        },
      ],
    },
    /* 公孫瓚 — 易京之下,他 199 年自焚。主目標是別走到那一步。 */
    {
      id: 'obj-195-gongsun',
      forceId: 'gongsun',
      primary: {
        title: { zh: '易京不焚', en: 'Yijing Does Not Burn' },
        description: 'Still hold Yi county in 200 AD — in history he burned himself in it in 199.',
        descriptionZh: '撐到200年仍據有易縣 —— 史實上他199年在城中自焚。',
        goal: { kind: 'hold-cities', cityIds: ['yi-county'], byYear: 200 },
      },
      secondary: [
        {
          title: { zh: '幽州之復', en: 'Retake You Province' },
          description: 'Hold Beiping and Ji together — the frontier command you actually understood.',
          descriptionZh: '同時據有北平與薊 —— 你真正懂的那條邊。',
          goal: { kind: 'hold-cities', cityIds: ['beiping', 'ji'], byYear: 199 },
        },
        {
          title: { zh: '子龍未去', en: 'Zilong Has Not Left' },
          description: 'Keep Zhao Yun — he left in history, saying he had not found what he sought.',
          descriptionZh: '留住趙雲 —— 史實上他託辭兄喪而去,終身未歸。',
          goal: { kind: 'recruit-officer', officerId: 'zhao-yun', byYear: 200 },
        },
      ],
    },
    /* 馬騰 — 關東在爭天下,他守的是隴西的春耕。 */
    {
      id: 'obj-195-mateng',
      forceId: 'ma-teng',
      primary: {
        title: { zh: '隴右之安', en: 'Peace in the Long Country' },
        description: 'Hold Wuwei, Jincheng and Longxi together — one command over the whole Liang country.',
        descriptionZh: '同時據有武威、金城、隴西 —— 讓整個涼州只認一個號令。',
        goal: { kind: 'hold-cities', cityIds: ['wuwei', 'jincheng', 'longxi'], byYear: 205 },
      },
      secondary: [
        {
          title: { zh: '入關中', en: 'Into Guanzhong' },
          description: "Take Chang'an — the march that failed at Changping Guan the year before.",
          descriptionZh: '攻取長安 —— 去年在長平觀敗掉的那一趟。',
          goal: { kind: 'hold-cities', cityIds: ['changan'], byYear: 205 },
        },
        {
          title: { zh: '錦馬超', en: 'Ma Chao in Brocade' },
          description: 'Still have Ma Chao in 211 — the year he rose in the west and it cost his family everything.',
          descriptionZh: '211年時馬超仍在麾下 —— 他起兵的那一年,代價是全家。',
          goal: { kind: 'recruit-officer', officerId: 'ma-chao', byYear: 211 },
        },
      ],
    },
    /* 嚴白虎 — 塢堡之長,不是諸侯。主目標是把孫策擋在江北。 */
    {
      id: 'obj-195-yanbaihu',
      forceId: 'yan-baihu',
      primary: {
        title: { zh: '劃江而治', en: 'A River Between Us' },
        description: 'Hold Wu commandery and Wuxi through 199 — the terms your brother went to ask for.',
        descriptionZh: '守住吳郡與無錫至199年 —— 你弟弟去談的正是這個。',
        goal: { kind: 'hold-cities', cityIds: ['wu', 'wuxi'], byYear: 199 },
      },
      secondary: [
        {
          title: { zh: '東吳德王', en: 'Prince of Virtue' },
          description: 'Break the Sun force outright — the boy came over with a thousand men.',
          descriptionZh: '擊滅孫氏 —— 那孩子過江時不過千餘人。',
          goal: { kind: 'defeat-force', forceId: 'sun', byYear: 200 },
        },
      ],
    },
    /* 王朗 — 受漢印綬,守漢之郡。他的目標不是爭天下,是不棄土。 */
    {
      id: 'obj-195-wanglang',
      forceId: 'wang-lang',
      primary: {
        title: { zh: '不棄印綬', en: 'The Seal Is Not Abandoned' },
        description: 'Still hold Kuaiji in 199 — Yu Fan told him to run; he would not.',
        descriptionZh: '撐到199年仍據有會稽 —— 虞翻勸他避走,他不肯。',
        goal: { kind: 'hold-cities', cityIds: ['kuaiji'], byYear: 199 },
      },
      secondary: [
        {
          title: { zh: '東冶不奔', en: 'No Ship to Dongye' },
          description: 'Hold Kuaiji and Linhai together — in history he lost both and took ship south.',
          descriptionZh: '同時據有會稽與臨海 —— 史實上他兩處皆失,浮海南奔。',
          goal: { kind: 'hold-cities', cityIds: ['kuaiji', 'linhai'], byYear: 200 },
        },
        {
          title: { zh: '仲翔在側', en: 'Zhongxiang at Hand' },
          description: 'Keep Yu Fan — the one man who told you the truth about Sun Ce.',
          descriptionZh: '留住虞翻 —— 唯一跟你說實話的人。',
          goal: { kind: 'recruit-officer', officerId: 'yu-fan', byYear: 200 },
        },
      ],
    },
  ],

  // 197 — The Bohai front
  'scn-197-bohai': [
    {
      id: 'obj-197-cao',
      forceId: 'cao',
      primary: {
        title: { zh: '北破袁紹', en: 'Break Yuan Shao' },
        description: 'Destroy the Yuan Shao force by 207.',
        descriptionZh: "於207年前擊滅袁紹 —— 以弱擊強,勝負在人不在眾。",
        goal: { kind: 'defeat-force', forceId: 'yuan-shao', byYear: 207 },
      },
      secondary: [
        {
          title: { zh: '取鄴定冀', en: 'Take Ye' },
          description: 'Hold Ye by 208.',
          descriptionZh: "於208年前攻下鄴城,河北遂定。",
          goal: { kind: 'hold-cities', cityIds: ['ye'], byYear: 208 },
        },
      ],
    },
    {
      id: 'obj-197-yuanshao',
      forceId: 'yuan-shao',
      primary: {
        title: { zh: '飲馬黃河', en: 'Water the Horses at the Yellow River' },
        description: 'Take Xuchang by 203.',
        descriptionZh: "於203年前攻取許昌 —— 十萬之眾,不當渡不得一河。",
        goal: { kind: 'hold-cities', cityIds: ['xuchang'], byYear: 203 },
      },
      secondary: [
        {
          title: { zh: '併吞公孫', en: 'Swallow Gongsun Zan' },
          description: 'Destroy the Gongsun Zan force by 201.',
          descriptionZh: "於201年前滅公孫瓚,盡有幽冀。",
          goal: { kind: 'defeat-force', forceId: 'gongsun', byYear: 201 },
        },
      ],
    },
    {
      id: 'obj-197-gongsun',
      forceId: 'gongsun',
      primary: {
        title: { zh: '易京樓不焚', en: 'The Tower Shall Not Burn' },
        description: 'Still hold Yi County in 202 — history gives you until 199.',
        descriptionZh: "至202年仍守易縣 —— 史書只給了你到199年。",
        goal: { kind: 'hold-cities', cityIds: ['yi-county'], byYear: 202 },
      },
    },
    {
      id: 'obj-197-sun',
      forceId: 'sun',
      primary: {
        title: { zh: '江東六郡', en: 'The Six Commanderies' },
        description: "Hold Jianye, Wu, Kuaiji and Yuzhang by 204 — the six commanderies are Wu; Hefei and Shouchun never were.",
        descriptionZh: "於204年前據建業、吳郡、會稽、豫章 —— 江東六郡才是孫氏的本,合肥壽春從來不是。",
        goal: { kind: 'hold-cities', cityIds: ['jianye', 'wu', 'kuaiji', 'yuzhang'], byYear: 204 },
      },
      secondary: [
        {
          title: { zh: '全有揚州', en: 'All of Yang' },
          description: 'Control Yang province by 204.',
          descriptionZh: "於204年前盡有揚州。",
          goal: { kind: 'control-province', provinceId: 'yang', byYear: 204 },
        },
      ],
    },
    {
      id: 'obj-197-lubu',
      forceId: 'lu-bu',
      primary: {
        title: { zh: '徐州為家', en: 'Xuzhou for a Home' },
        description: 'Hold Xiapi and Pengcheng by 201.',
        descriptionZh: "於201年前兼據下邳、彭城,終得一塊自己的地。",
        goal: { kind: 'hold-cities', cityIds: ['xiapi', 'pengcheng'], byYear: 201 },
      },
    },
  ],

  // 198 — The siege of Xiapi
  'scn-198-xiapi': [
    {
      id: 'obj-198-cao',
      forceId: 'cao',
      primary: {
        title: { zh: '白門樓', en: 'The White Gate Tower' },
        description: 'Destroy the Lü Bu force by 200.',
        descriptionZh: "於200年前擊滅呂布 —— 決沂泗之水,白門樓上見分曉。",
        goal: { kind: 'defeat-force', forceId: 'lubu', byYear: 200 },
      },
      secondary: [
        {
          title: { zh: '收降飛將', en: 'Take the Flying General Alive' },
          description: 'Recruit Lü Bu into your service.',
          descriptionZh: "招降呂布為己用 —— 縱虎為患,亦或如虎添翼。",
          goal: { kind: 'recruit-officer', officerId: 'lu-bu' },
        },
      ],
    },
    {
      id: 'obj-198-lubu',
      forceId: 'lubu',
      primary: {
        title: { zh: '下邳不陷', en: 'Xiapi Shall Not Fall' },
        description: 'Hold Xiapi and take Pengcheng by 202.',
        descriptionZh: "於202年前守住下邳並攻下彭城 —— 困守必死,唯有向外。",
        goal: { kind: 'hold-cities', cityIds: ['xiapi', 'pengcheng'], byYear: 202 },
      },
    },
    {
      id: 'obj-198-yuanshao',
      forceId: 'yuan-shao',
      primary: {
        title: { zh: '席捲中原', en: 'Roll Up the Central Plain' },
        description: 'Take Xuchang by 204.',
        descriptionZh: "於204年前攻取許昌。",
        goal: { kind: 'hold-cities', cityIds: ['xuchang'], byYear: 204 },
      },
    },
    {
      id: 'obj-198-sun',
      forceId: 'sun',
      primary: {
        title: { zh: '據江東以觀天下', en: 'Hold the Southland and Watch' },
        description: "Hold Jianye, Wu, Kuaiji and Yuzhang by 204 — settle the six commanderies first; the north can wait.",
        descriptionZh: "於204年前據建業、吳郡、會稽、豫章 —— 先定六郡,北方的事可以等。",
        goal: { kind: 'hold-cities', cityIds: ['jianye', 'wu', 'kuaiji', 'yuzhang'], byYear: 204 },
      },
      secondary: [
        {
          title: { zh: '據江東以觀天下', en: 'Watch the Realm from Jiangdong' },
          description: 'Control Yang province by 204.',
          descriptionZh: "於204年前盡有揚州,坐觀中原之變。",
          goal: { kind: 'control-province', provinceId: 'yang', byYear: 204 },
        },
      ],
    },
    {
      id: 'obj-198-yuanshu',
      forceId: 'yuan-shu',
      primary: {
        title: { zh: '仲氏不亡', en: 'Zhong Shall Not Fall' },
        description: 'Still hold Shouchun in 202 — history gives you until 199.',
        descriptionZh: "至202年仍據壽春 —— 史書只給了你到199年。",
        goal: { kind: 'hold-cities', cityIds: ['shouchun'], byYear: 202 },
      },
    },
  ],

  // 199 — The siege of Yijing
  'scn-199-yijing': [
    {
      id: 'obj-199-yuanshao',
      forceId: 'yuan-shao',
      primary: {
        title: { zh: '拔易京', en: 'Storm Yijing' },
        description: 'Destroy the Gongsun Zan force by 202.',
        descriptionZh: "於202年前滅公孫瓚,拔其樓堞。",
        goal: { kind: 'defeat-force', forceId: 'gongsun', byYear: 202 },
      },
      secondary: [
        {
          title: { zh: '併有幽州', en: 'Take You Province' },
          description: 'Control You province by 205.',
          descriptionZh: "於205年前盡有幽州。",
          goal: { kind: 'control-province', provinceId: 'you', byYear: 205 },
        },
      ],
    },
    {
      id: 'obj-199-gongsun',
      forceId: 'gongsun',
      primary: {
        title: { zh: '樓堞猶存', en: 'The Towers Still Stand' },
        description: 'Still hold Yi County and Beiping in 203.',
        descriptionZh: "至203年仍保易縣、北平 —— 積穀三百萬斛,守到天下事定。",
        goal: { kind: 'hold-cities', cityIds: ['yi-county', 'beiping'], byYear: 203 },
      },
    },
    {
      id: 'obj-199-cao',
      forceId: 'cao',
      primary: {
        title: { zh: '官渡決機', en: 'Decide It at Guandu' },
        description: 'Destroy the Yuan Shao force by 207.',
        descriptionZh: "於207年前擊滅袁紹。",
        goal: { kind: 'defeat-force', forceId: 'yuan-shao', byYear: 207 },
      },
    },
    {
      id: 'obj-199-sun',
      forceId: 'sun',
      primary: {
        title: { zh: '江東基業', en: 'The Foundation in the Southland' },
        description: "Hold Jianye, Wu, Kuaiji and Yuzhang by 205 — what Sun Ce won in five years, and died holding.",
        descriptionZh: "於205年前據建業、吳郡、會稽、豫章 —— 孫策五年所得,也是他死時手裡的全部。",
        goal: { kind: 'hold-cities', cityIds: ['jianye', 'wu', 'kuaiji', 'yuzhang'], byYear: 205 },
      },
      secondary: [
        {
          title: { zh: '江東基業', en: 'The Jiangdong Inheritance' },
          description: 'Control Yang province by 205.',
          descriptionZh: "於205年前盡有揚州,守父兄之業。",
          goal: { kind: 'control-province', provinceId: 'yang', byYear: 205 },
        },
      ],
    },
    {
      id: 'obj-199-liubiao',
      forceId: 'liu-biao',
      primary: {
        title: { zh: '荊襄之守', en: 'The Jing Heartland' },
        description: "Still hold Xiangyang, Jiangling, Jiangxia, Changsha and Wancheng in 206 — the nine commanderies were never all yours at once.",
        descriptionZh: "至206年仍據襄陽、江陵、江夏、長沙、宛城 —— 荊襄九郡從來沒有同時全在你手上。",
        goal: { kind: 'hold-cities', cityIds: ['xiangyang', 'jiangling', 'jiangxia'], byYear: 206 },
      },
      secondary: [
        {
          title: { zh: '荊襄九郡', en: 'The Nine Commanderies of Jing' },
          description: 'Control Jing province by 206.',
          descriptionZh: "於206年前盡有荊州九郡。",
          goal: { kind: 'control-province', provinceId: 'jing', byYear: 206 },
        },
      ],
    },
  ],

  // 204 — The fall of Ye
  'scn-204-yecheng': [
    {
      id: 'obj-204-cao',
      forceId: 'cao',
      primary: {
        title: { zh: '決漳水以灌鄴', en: 'Flood Ye' },
        description: 'Take Ye by 207.',
        descriptionZh: "於207年前攻下鄴城 —— 決漳水,圍之半年。",
        goal: { kind: 'hold-cities', cityIds: ['ye'], byYear: 207 },
      },
      secondary: [
        {
          title: { zh: '袁氏俱滅', en: 'End the House of Yuan' },
          description: 'Destroy the Yuan Shang force.',
          descriptionZh: "翦滅袁尚,袁氏之嗣遂絕。",
          goal: { kind: 'defeat-force', forceId: 'yuan-shang' },
        },
      ],
    },
    {
      id: 'obj-204-yuanshang',
      forceId: 'yuan-shang',
      primary: {
        title: { zh: '鄴城固守', en: 'Hold Ye' },
        description: 'Still hold Ye in 208.',
        descriptionZh: "至208年仍據鄴城 —— 父之基業,不可失於我手。",
        goal: { kind: 'hold-cities', cityIds: ['ye'], byYear: 208 },
      },
      secondary: [
        {
          title: { zh: '併兄之眾', en: 'Absorb Your Brother' },
          description: 'Destroy the Yuan Tan force — brothers first, Cao Cao after.',
          descriptionZh: "擊滅袁譚 —— 兄弟鬩牆在先,曹操在後。",
          goal: { kind: 'defeat-force', forceId: 'yuan-tan' },
        },
      ],
    },
    {
      id: 'obj-204-yuantan',
      forceId: 'yuan-tan',
      primary: {
        title: { zh: '長子當立', en: 'The Eldest Son Should Rule' },
        description: 'Destroy the Yuan Shang force — you were born first.',
        descriptionZh: "擊滅袁尚 —— 立嫡以長,何以廢我?",
        goal: { kind: 'defeat-force', forceId: 'yuan-shang' },
      },
      secondary: [
        {
          title: { zh: '入主鄴城', en: 'Take Ye for Yourself' },
          description: 'Hold Ye by 208.',
          descriptionZh: "於208年前入主鄴城。",
          goal: { kind: 'hold-cities', cityIds: ['ye'], byYear: 208 },
        },
      ],
    },
    {
      id: 'obj-204-sun',
      forceId: 'sun',
      primary: {
        title: { zh: '西進荊州', en: 'West into Jing' },
        description: 'Take Jiangxia and Jiangling by 210.',
        descriptionZh: "於210年前西取江夏、江陵 —— 父讎在黃祖,門戶在荊州。",
        goal: { kind: 'hold-cities', cityIds: ['jiangxia', 'jiangling'], byYear: 210 },
      },
    },
    {
      id: 'obj-204-liubiao',
      forceId: 'liu-biao',
      primary: {
        title: { zh: '守此荊土', en: 'Guard the Jing Soil' },
        description: 'Still hold Xiangyang and Jiangling in 210 — history gives you until 208.',
        descriptionZh: "至210年仍保襄陽、江陵 —— 史書只給了你到208年。",
        goal: { kind: 'hold-cities', cityIds: ['xiangyang', 'jiangling'], byYear: 210 },
      },
    },
    {
      id: 'obj-204-zhanglu',
      forceId: 'zhang-lu',
      primary: {
        title: { zh: '五斗米道', en: 'The Way of Five Pecks' },
        description: 'Still hold Hanzhong in 212, and take Chengdu.',
        descriptionZh: "至212年仍據漢中,並取成都 —— 政教合一,師君臨蜀。",
        goal: { kind: 'hold-cities', cityIds: ['hanzhong', 'chengdu'], byYear: 212 },
      },
    },
    {
      id: 'obj-204-shixie',
      forceId: 'shi-xie',
      primary: {
        title: { zh: '交州王', en: 'King of Jiao' },
        description: "Still hold Jiaozhi, Nanhai, Hepu and Cangwu in 210 — Jiao also counts Zhuyai and Rinan, past the end of the roads.",
        descriptionZh: "至210年仍據交趾、南海、合浦、蒼梧 —— 交州名下還有珠崖日南,那是路的盡頭之外。",
        goal: { kind: 'hold-cities', cityIds: ['jiaozhi', 'nanhai', 'hepu'], byYear: 210 },
      },
      secondary: [
        {
          title: { zh: '交州王', en: 'King of Jiao' },
          description: 'Control Jiao province by 210.',
          descriptionZh: "於210年前盡有交州 —— 嶺南一隅,亦可自王。",
          goal: { kind: 'control-province', provinceId: 'jiao', byYear: 210 },
        },
      ],
    },
  ],

  // 207 — The three visits to the thatched hut
  'scn-207-three-visits': [
    {
      id: 'obj-207tv-cao',
      forceId: 'cao',
      primary: {
        title: { zh: '南下荊襄', en: 'South into Jing' },
        description: 'Take Xiangyang and Jiangling by 211.',
        descriptionZh: "於211年前南取襄陽、江陵 —— 北方既定,當飲馬長江。",
        goal: { kind: 'hold-cities', cityIds: ['xiangyang', 'jiangling'], byYear: 211 },
      },
      secondary: [
        {
          title: { zh: '混一宇內', en: 'Unify the Realm' },
          description: 'Bring all under one banner.',
          descriptionZh: "混一天下。",
          goal: { kind: 'unify-realm' },
        },
      ],
    },
    {
      id: 'obj-207tv-sun',
      forceId: 'sun',
      primary: {
        title: { zh: '全據長江', en: 'The Whole Length of the River' },
        description: 'Take Jiangxia and Jiangling by 213 — Lu Su\'s plan: hold the river entire.',
        descriptionZh: "於213年前取江夏、江陵 —— 魯肅之策:竟長江所極而據守之。",
        goal: { kind: 'hold-cities', cityIds: ['jiangxia', 'jiangling'], byYear: 213 },
      },
      secondary: [
        {
          title: { zh: '盡有揚州', en: 'All of Yang' },
          description: 'Control Yang province by 213.',
          descriptionZh: "於213年前盡有揚州。",
          goal: { kind: 'control-province', provinceId: 'yang', byYear: 213 },
        },
      ],
    },
    {
      id: 'obj-207tv-liubiao',
      forceId: 'liu-biao',
      primary: {
        title: { zh: '三顧得人', en: 'Three Visits, One Sleeping Dragon' },
        description: 'Recruit Zhuge Liang — he is farming in Longzhong, in your province.',
        descriptionZh: "招得諸葛亮 —— 臥龍就在你的隆中躬耕,劉備尚未三顧。",
        goal: { kind: 'recruit-officer', officerId: 'zhuge-liang' },
      },
      secondary: [
        {
          title: { zh: '荊土不失', en: 'Jing Shall Not Be Handed Over' },
          description: 'Still hold Xiangyang and Jiangling in 212 — history has your son surrender them.',
          descriptionZh: "至212年仍保襄陽、江陵 —— 史書上,你的兒子把它們拱手送人。",
          goal: { kind: 'hold-cities', cityIds: ['xiangyang', 'jiangling'], byYear: 212 },
        },
      ],
    },
    {
      id: 'obj-207tv-liuzhang',
      forceId: 'liu-zhang',
      primary: {
        title: { zh: '守此蜀土', en: 'Hold the Shu Lands' },
        description: "Still hold Chengdu, Jiangzhou, Luocheng, Fucheng and Mianzhu in 214 — Yi also runs down to Nanzhong, which answers to no one.",
        descriptionZh: "至214年仍據成都、江州、雒城、涪城、綿竹 —— 益州名下還有南中,那裡誰的號令也不聽。",
        goal: { kind: 'hold-cities', cityIds: ['chengdu', 'jiangzhou', 'mianzhu'], byYear: 214 },
      },
      secondary: [
        {
          title: { zh: '守此蜀土', en: 'Keep the Shu Basin' },
          description: 'Control Yi province by 214 — and never invite a guest with an army.',
          descriptionZh: "於214年前盡有益州 —— 並且,永遠不要迎一個帶兵的客人入蜀。",
          goal: { kind: 'control-province', provinceId: 'yi', byYear: 214 },
        },
      ],
    },
    {
      id: 'obj-207tv-zhanglu',
      forceId: 'zhang-lu',
      primary: {
        title: { zh: '師君治漢中', en: 'The Teacher-Lord of Hanzhong' },
        description: 'Still hold Hanzhong and Yangping in 216 — history gives you until 215.',
        descriptionZh: "至216年仍據漢中、陽平 —— 史書只給了你到215年。",
        goal: { kind: 'hold-cities', cityIds: ['hanzhong', 'yangping'], byYear: 216 },
      },
    },
    {
      id: 'obj-207tv-mateng',
      forceId: 'ma-teng',
      primary: {
        title: { zh: '不入許都', en: 'Do Not Go to Xuchang' },
        description: "Still hold Wuwei, Jincheng, Anding and Longxi in 213 — stay in the west; the summons to court is a cage.",
        descriptionZh: "至213年仍據武威、金城、安定、隴西 —— 留在西邊。徵你入朝的那道詔書是個籠子。",
        goal: { kind: 'hold-cities', cityIds: ['wuwei', 'jincheng', 'anding'], byYear: 213 },
      },
      secondary: [
        {
          title: { zh: '不入許都', en: 'Do Not Go to Xuchang' },
          description: 'Control Liang province by 213 — in history you accepted a court post and died for it.',
          descriptionZh: "於213年前盡有涼州 —— 史書上,你應召入朝,闔門遇害。",
          goal: { kind: 'control-province', provinceId: 'liang', byYear: 213 },
        },
      ],
    },
    {
      id: 'obj-207tv-shixie',
      forceId: 'shi-xie',
      primary: {
        title: { zh: '交趾世家', en: 'The House of Jiaozhi' },
        description: "Still hold Jiaozhi, Nanhai, Hepu and Cangwu in 212 — forty years in which the south saw no war.",
        descriptionZh: "至212年仍據交趾、南海、合浦、蒼梧 —— 兄弟並為列郡守,四十餘年疆場無事。",
        goal: { kind: 'hold-cities', cityIds: ['jiaozhi', 'nanhai', 'hepu'], byYear: 212 },
      },
      secondary: [
        {
          title: { zh: '交趾世家', en: 'The House of Jiaozhi' },
          description: 'Control Jiao province by 212.',
          descriptionZh: "於212年前盡有交州。",
          goal: { kind: 'control-province', provinceId: 'jiao', byYear: 212 },
        },
      ],
    },
  ],

  // 207 — White Wolf Mountain, the northern campaign
  'scn-207-bailang': [
    {
      id: 'obj-207bl-cao',
      forceId: 'cao',
      primary: {
        title: { zh: '白狼山之戰', en: 'The Battle of White Wolf Mountain' },
        description: 'Destroy the Wuhuan force by 210 — cut the last Yuan refuge.',
        descriptionZh: "於210年前擊滅烏桓 —— 斷袁氏最後之奧援。",
        goal: { kind: 'defeat-force', forceId: 'wuhuan', byYear: 210 },
      },
      secondary: [
        {
          title: { zh: '取柳城', en: 'Take Liucheng' },
          description: 'Hold Liucheng by 210.',
          descriptionZh: "於210年前攻下柳城 —— 千里奔襲,輕兵掩其不備。",
          goal: { kind: 'hold-cities', cityIds: ['liucheng'], byYear: 210 },
        },
      ],
    },
    {
      id: 'obj-207bl-wuhuan',
      forceId: 'wuhuan',
      primary: {
        title: { zh: '踏頓南下', en: 'Tadun Rides South' },
        description: 'Take Beiping by 211 — strike before the Han army reaches the steppe.',
        descriptionZh: "於211年前攻取北平 —— 與其待其深入,不如先發南下。",
        goal: { kind: 'hold-cities', cityIds: ['beiping'], byYear: 211 },
      },
    },
    {
      id: 'obj-207bl-sun',
      forceId: 'sun',
      primary: {
        title: { zh: '西進取荊', en: 'West to Jing' },
        description: 'Take Jiangxia and Jiangling by 213.',
        descriptionZh: "於213年前西取江夏、江陵。",
        goal: { kind: 'hold-cities', cityIds: ['jiangxia', 'jiangling'], byYear: 213 },
      },
    },
    {
      id: 'obj-207bl-liubiao',
      forceId: 'liu-biao',
      primary: {
        title: { zh: '北伐許都', en: 'Strike at Xuchang' },
        description: 'Take Xuchang by 213 — Liu Bei urged it while Cao Cao marched north.',
        descriptionZh: "於213年前攻取許昌 —— 曹操北征之際,劉備曾勸你襲許,你沒有動。",
        goal: { kind: 'hold-cities', cityIds: ['xuchang'], byYear: 213 },
      },
    },
    {
      id: 'obj-207bl-liuzhang',
      forceId: 'liu-zhang',
      primary: {
        title: { zh: '益州自守', en: 'Yi Keeps to Itself' },
        description: "Still hold Chengdu, Jiangzhou, Luocheng and Fucheng in 214 — while the north settles itself, shut the passes.",
        descriptionZh: "至214年仍據成都、江州、雒城、涪城 —— 北方自去廝殺,你只要把關閉上。",
        goal: { kind: 'hold-cities', cityIds: ['chengdu', 'jiangzhou', 'luocheng'], byYear: 214 },
      },
      secondary: [
        {
          title: { zh: '益州自守', en: 'Hold Yi Alone' },
          description: 'Control Yi province by 214.',
          descriptionZh: "於214年前盡有益州。",
          goal: { kind: 'control-province', provinceId: 'yi', byYear: 214 },
        },
      ],
    },
  ],

  // 211 — Battle of Weinan
  'scn-211-weinan': [
    {
      id: 'obj-211-cao',
      forceId: 'cao',
      primary: {
        title: { zh: '離間關中', en: 'Sow Discord in Guanzhong' },
        description: 'Destroy the Ma Chao force by 215.',
        descriptionZh: "於215年前擊滅馬超 —— 抹書間韓遂,關中十部自潰。",
        goal: { kind: 'defeat-force', forceId: 'ma-chao', byYear: 215 },
      },
      secondary: [
        {
          title: { zh: '固守長安', en: "Hold Chang'an" },
          description: "Still hold Chang'an in 215.",
          descriptionZh: "至215年仍據長安。",
          goal: { kind: 'hold-cities', cityIds: ['changan'], byYear: 215 },
        },
      ],
    },
    {
      id: 'obj-211-machao',
      forceId: 'ma-chao',
      primary: {
        title: { zh: '關中十部之盟', en: 'The Ten Camps in League' },
        description: "Still hold Chencang, Anding and Wuwei in 215 — ten armies came east together; Chang'an was never yours to keep.",
        descriptionZh: "至215年仍據陳倉、安定、武威 —— 十部連兵東下,而長安從來沒有真正在你手上。",
        goal: { kind: 'hold-cities', cityIds: ['chencang', 'anding', 'wuwei'], byYear: 215 },
      },
      secondary: [
        {
          title: { zh: '奪取長安', en: "Take Chang'an" },
          description: "Take Chang'an by 215 — avenge your father.",
          descriptionZh: "於215年前攻取長安 —— 父兄之讎,不共戴天。",
          goal: { kind: 'hold-cities', cityIds: ['changan'], byYear: 215 },
        },
        {
          title: { zh: '盡有涼州', en: 'All of Liang' },
          description: 'Control Liang province by 217.',
          descriptionZh: "於217年前盡有涼州 —— 羌胡皆從,號為神威天將軍。",
          goal: { kind: 'control-province', provinceId: 'liang', byYear: 217 },
        },
      ],
    },
    {
      id: 'obj-211-hansui',
      forceId: 'han-sui',
      primary: {
        title: { zh: '西州自立', en: 'A Realm in the West' },
        description: "Still hold Jincheng, Wuwei and Anding in 217 — thirty years in Liang, and never once summoned to court.",
        descriptionZh: "至217年仍據金城、武威、安定 —— 在涼州三十年,一次也沒有應詔入朝。",
        goal: { kind: 'hold-cities', cityIds: ['jincheng', 'wuwei', 'anding'], byYear: 217 },
      },
      secondary: [
        {
          title: { zh: '西州自立', en: 'A Realm of My Own in the West' },
          description: 'Control Liang province by 217 — thirty years in Guanzhong, always someone else\'s ally.',
          descriptionZh: "於217年前盡有涼州 —— 縱橫關中三十年,總是別人的盟友。",
          goal: { kind: 'control-province', provinceId: 'liang', byYear: 217 },
        },
      ],
    },
    {
      id: 'obj-211-liubei',
      forceId: 'liu-bei',
      primary: {
        title: { zh: '西取益州', en: 'Take Yi Province' },
        description: 'Take Chengdu by 216 — the Longzhong plan, second half.',
        descriptionZh: "於216年前攻取成都 —— 隆中對的下半篇。",
        goal: { kind: 'hold-cities', cityIds: ['chengdu'], byYear: 216 },
      },
      secondary: [
        {
          title: { zh: '跨有荊益', en: 'Straddle Jing and Yi' },
          description: 'Hold Jiangling and Chengdu together by 218.',
          descriptionZh: "於218年前兼據江陵與成都 —— 跨有荊益,則霸業可成。",
          goal: { kind: 'hold-cities', cityIds: ['jiangling', 'chengdu'], byYear: 218 },
        },
      ],
    },
    {
      id: 'obj-211-sun',
      forceId: 'sun',
      primary: {
        title: { zh: '北取合肥', en: 'Take Hefei' },
        description: 'Take Hefei by 217 — the wall Sun Quan never got over.',
        descriptionZh: "於217年前攻取合肥 —— 孫權一生沒有翻過的那堵牆。",
        goal: { kind: 'hold-cities', cityIds: ['hefei'], byYear: 217 },
      },
    },
    {
      id: 'obj-211-liuzhang',
      forceId: 'liu-zhang',
      primary: {
        title: { zh: '勿迎劉備', en: 'Do Not Invite Liu Bei' },
        description: 'Still hold Chengdu in 216 — history has you open the gate yourself.',
        descriptionZh: "至216年仍據成都 —— 史書上,是你自己開的城門。",
        goal: { kind: 'hold-cities', cityIds: ['chengdu'], byYear: 216 },
      },
    },
    {
      id: 'obj-211-zhanglu',
      forceId: 'zhang-lu',
      primary: {
        title: { zh: '漢中不下', en: 'Hanzhong Holds' },
        description: 'Still hold Hanzhong in 216 — history gives you until 215.',
        descriptionZh: "至216年仍據漢中 —— 史書只給了你到215年。",
        goal: { kind: 'hold-cities', cityIds: ['hanzhong'], byYear: 216 },
      },
    },
  ],

  // 213 — Fallen Phoenix Slope
  'scn-213-fengpo': [
    {
      id: 'obj-213-liubei',
      forceId: 'liu-bei',
      primary: {
        title: { zh: '進取成都', en: 'On to Chengdu' },
        description: 'Take Luocheng and Chengdu by 217 — the road Pang Tong died on.',
        descriptionZh: "於217年前攻下雒城、成都 —— 龐統死在這條路上。",
        goal: { kind: 'hold-cities', cityIds: ['luocheng', 'chengdu'], byYear: 217 },
      },
      secondary: [
        {
          title: { zh: '鳳雛不隕', en: 'Keep the Fledgling Phoenix' },
          description: 'Still have Pang Tong in your service.',
          descriptionZh: "使龐統仍在麾下 —— 落鳳坡的那一箭,未必非中不可。",
          goal: { kind: 'recruit-officer', officerId: 'pang-tong' },
        },
      ],
    },
    {
      id: 'obj-213-liuzhang',
      forceId: 'liu-zhang',
      primary: {
        title: { zh: '拒守成都', en: 'Hold Chengdu' },
        description: "Still hold Chengdu and Jiangzhou in 218 — Zheng Du urged scorched earth; you said you had never heard of a lord who saves himself by ruining his people.",
        descriptionZh: "至218年仍據成都、江州 —— 鄭度勸你堅壁清野,你說「吾聞拒敵以安民,未聞動民以避敵」。",
        goal: { kind: 'hold-cities', cityIds: ['chengdu', 'jiangzhou'], byYear: 218 },
      },
      secondary: [
        {
          title: { zh: '驅逐客兵', en: 'Drive Out the Guest Army' },
          description: 'Destroy the Liu Bei force by 218.',
          descriptionZh: "於218年前擊滅劉備 —— 引之入蜀者我,逐之出蜀者亦當是我。",
          goal: { kind: 'defeat-force', forceId: 'liu-bei', byYear: 218 },
        },
        {
          title: { zh: '成都不開', en: 'Chengdu Keeps Its Gate Shut' },
          description: 'Still hold Chengdu in 218.',
          descriptionZh: "至218年仍據成都。",
          goal: { kind: 'hold-cities', cityIds: ['chengdu'], byYear: 218 },
        },
      ],
    },
    {
      id: 'obj-213-cao',
      forceId: 'cao',
      primary: {
        title: { zh: '先取漢中', en: 'Hanzhong First' },
        description: 'Take Hanzhong by 217 — get there before Liu Bei does.',
        descriptionZh: "於217年前攻取漢中 —— 得隴之後,是否望蜀?",
        goal: { kind: 'hold-cities', cityIds: ['hanzhong'], byYear: 217 },
      },
    },
    {
      id: 'obj-213-sun',
      forceId: 'sun',
      primary: {
        title: { zh: '湘水之西', en: 'West of the Xiang' },
        description: "Hold Changsha and Guiyang by 219 — the Xiang treaty gave Wu these two, not Jiangling.",
        descriptionZh: "於219年前取長沙、桂陽 —— 湘水劃界分給孫氏的是這兩郡,不是江陵。",
        goal: { kind: 'hold-cities', cityIds: ['changsha', 'guiyang'], byYear: 219 },
      },
      secondary: [
        {
          title: { zh: '索還荊州', en: 'Demand Jing Back' },
          description: 'Take Jiangling by 219.',
          descriptionZh: "於219年前取回江陵 —— 借出去的荊州,總要討回來。",
          goal: { kind: 'hold-cities', cityIds: ['jiangling'], byYear: 219 },
        },
      ],
    },
    {
      id: 'obj-213-zhanglu',
      forceId: 'zhang-lu',
      primary: {
        title: { zh: '據險自保', en: 'Hold the Passes' },
        description: 'Still hold Hanzhong in 217.',
        descriptionZh: "至217年仍據漢中。",
        goal: { kind: 'hold-cities', cityIds: ['hanzhong'], byYear: 217 },
      },
    },
  ],

  // 214 — Master of Xichuan
  'scn-214-xichuan': [
    {
      id: 'obj-214-liubei',
      forceId: 'liu-bei',
      primary: {
        title: { zh: '入主西川', en: 'Master of the West' },
        description: "Still hold Chengdu, Jiangzhou, Luocheng, Fucheng and Baxi in 218 — the heart of Yi; Nanzhong will need its own campaign.",
        descriptionZh: "至218年仍據成都、江州、雒城、涪城、巴西 —— 益州之心;南中要另打一場仗。",
        goal: { kind: 'hold-cities', cityIds: ['chengdu', 'jiangzhou', 'baxi'], byYear: 218 },
      },
      secondary: [
        {
          title: { zh: '入主西川', en: 'Master of Xichuan' },
          description: 'Control Yi province by 218.',
          descriptionZh: "於218年前盡有益州 —— 隆中對之半,今日始成。",
          goal: { kind: 'control-province', provinceId: 'yi', byYear: 218 },
        },
        {
          title: { zh: '北定漢中', en: 'Take Hanzhong' },
          description: 'Hold Hanzhong by 220.',
          descriptionZh: "於220年前據有漢中 —— 蜀之咽喉,不可假人。",
          goal: { kind: 'hold-cities', cityIds: ['hanzhong'], byYear: 220 },
        },
      ],
    },
    {
      id: 'obj-214-liuzhang',
      forceId: 'liu-zhang',
      primary: {
        title: { zh: '成都堅守', en: 'Chengdu Holds' },
        description: 'Still hold Chengdu in 219 — the city had three years of grain and wanted to fight.',
        descriptionZh: "至219年仍據成都 —— 城中尚有三年之糧,吏民咸欲死戰。",
        goal: { kind: 'hold-cities', cityIds: ['chengdu'], byYear: 219 },
      },
    },
    {
      id: 'obj-214-cao',
      forceId: 'cao',
      primary: {
        title: { zh: '既得隴', en: 'Long Is Enough' },
        description: "Hold Hanzhong by 220 — 'Having taken Long, must a man covet Shu?' You said that, and you turned back.",
        descriptionZh: "於220年前取漢中 ——「人苦無足,既得隴右,復欲得蜀」;你說完這句話就回去了。",
        goal: { kind: 'hold-cities', cityIds: ['hanzhong'], byYear: 220 },
      },
      secondary: [
        {
          title: { zh: '得隴望蜀', en: 'Having Long, Covet Shu' },
          description: 'Take Hanzhong by 217, then Chengdu.',
          descriptionZh: "於217年前取漢中,再下成都 —— 人苦無足,既得隴,復望蜀。",
          goal: { kind: 'hold-cities', cityIds: ['hanzhong', 'chengdu'], byYear: 220 },
        },
      ],
    },
    {
      id: 'obj-214-sun',
      forceId: 'sun',
      primary: {
        title: { zh: '湘水劃界', en: 'The Xiang Partition' },
        description: "Hold Changsha and Guiyang by 220 — three commanderies east of the Xiang; Jiangling waits until 219.",
        descriptionZh: "於220年前取長沙、桂陽 —— 湘水以東三郡歸吳;江陵要等到建安二十四年。",
        goal: { kind: 'hold-cities', cityIds: ['changsha', 'guiyang'], byYear: 220 },
      },
      secondary: [
        {
          title: { zh: '湘水劃界', en: 'The Xiang River Line' },
          description: 'Take Jiangling by 220.',
          descriptionZh: "於220年前取江陵 —— 湘水之盟只是暫緩,荊州終須一決。",
          goal: { kind: 'hold-cities', cityIds: ['jiangling'], byYear: 220 },
        },
      ],
    },
    {
      id: 'obj-214-zhanglu',
      forceId: 'zhang-lu',
      primary: {
        title: { zh: '漢中猶在', en: 'Hanzhong Endures' },
        description: 'Still hold Hanzhong in 218.',
        descriptionZh: "至218年仍據漢中。",
        goal: { kind: 'hold-cities', cityIds: ['hanzhong'], byYear: 218 },
      },
    },
  ],

  // 218 — Mount Dingjun, the Hanzhong campaign
  'scn-218-dingjun': [
    {
      id: 'obj-218-liubei',
      forceId: 'liu-bei',
      primary: {
        title: { zh: '定軍山', en: 'Mount Dingjun' },
        description: 'Hold Hanzhong and Yangping by 221.',
        descriptionZh: "於221年前據漢中、陽平 —— 老將黃忠一刀斬夏侯,漢中遂為我有。",
        goal: { kind: 'hold-cities', cityIds: ['hanzhong', 'yangping'], byYear: 221 },
      },
      secondary: [
        {
          title: { zh: '進位漢中王', en: 'King of Hanzhong' },
          description: 'Declare yourself emperor once Hanzhong is yours.',
          descriptionZh: "既得漢中,遂即尊位。",
          goal: { kind: 'declare-emperor' },
        },
      ],
    },
    {
      id: 'obj-218-cao',
      forceId: 'cao',
      primary: {
        title: { zh: '雞肋之地', en: 'Chicken Ribs' },
        description: 'Still hold Hanzhong in 221 — tasteless to eat, a pity to throw away.',
        descriptionZh: "至221年仍據漢中 —— 食之無肉,棄之有味,楊修因此死。",
        goal: { kind: 'hold-cities', cityIds: ['hanzhong'], byYear: 221 },
      },
      secondary: [
        {
          title: { zh: '擊滅劉備', en: 'Destroy Liu Bei' },
          description: 'Destroy the Liu Bei force.',
          descriptionZh: "擊滅劉備。",
          goal: { kind: 'defeat-force', forceId: 'liu-bei' },
        },
      ],
    },
    {
      id: 'obj-218-sun',
      forceId: 'sun',
      primary: {
        title: { zh: '襲取荊州', en: 'Seize Jing' },
        description: 'Take Jiangling by 222 — while Guan Yu looks north.',
        descriptionZh: "於222年前襲取江陵 —— 趁關羽北望之時。",
        goal: { kind: 'hold-cities', cityIds: ['jiangling'], byYear: 222 },
      },
      secondary: [
        {
          title: { zh: '合肥之志', en: 'Hefei Again' },
          description: 'Take Hefei by 224.',
          descriptionZh: "於224年前攻取合肥。",
          goal: { kind: 'hold-cities', cityIds: ['hefei'], byYear: 224 },
        },
      ],
    },
  ],

  // 221 — The founding of Shu-Han
  'scn-221-shu-emperor': [
    {
      id: 'obj-221-shu',
      forceId: 'liu-bei',
      primary: {
        title: { zh: '興復漢室', en: 'Restore the Han' },
        description: "Still hold Chengdu, Hanzhong and Jiangzhou in 240 — the old capitals are a vow; the realm you have is a fact.",
        descriptionZh: "至240年仍據成都、漢中、江州 —— 還於舊都是誓,手上這一塊是實。",
        goal: { kind: 'hold-cities', cityIds: ['chengdu', 'hanzhong', 'jiangzhou'], byYear: 240 },
      },
      secondary: [
        {
          title: { zh: '還於舊都', en: 'Return to the Old Capital' },
          description: "Take Chang'an and Luoyang by 240 — the Han restored is the whole point.",
          descriptionZh: "於240年前克復長安、洛陽 —— 漢賊不兩立,王業不偏安。",
          goal: { kind: 'hold-cities', cityIds: ['changan', 'luoyang'], byYear: 240 },
        },
        {
          title: { zh: '復取荊州', en: 'Retake Jing' },
          description: 'Hold Jiangling by 226.',
          descriptionZh: "於226年前奪回江陵 —— 雲長之讎,荊州之失。",
          goal: { kind: 'hold-cities', cityIds: ['jiangling'], byYear: 226 },
        },
      ],
    },
    {
      id: 'obj-221-wei',
      forceId: 'cao',
      primary: {
        title: { zh: '守成之君', en: 'Keep What Was Received' },
        description: "Still hold Luoyang, Xuchang, Chang'an and Ye in 230 — Wei never unified; it also never wobbled.",
        descriptionZh: "至230年仍據洛陽、許昌、長安、鄴 —— 魏未曾一統,而四十六年未曾動搖。",
        goal: { kind: 'hold-cities', cityIds: ['luoyang', 'changan'], byYear: 230 },
      },
      secondary: [
        {
          title: { zh: '受禪定鼎', en: 'The Mandate Received' },
          description: 'Bring all under Wei.',
          descriptionZh: "混一天下 —— 受漢之禪,便當有一統之實。",
          goal: { kind: 'unify-realm' },
        },
        {
          title: { zh: '南取江陵', en: 'Take Jiangling' },
          description: 'Hold Jiangling by 230.',
          descriptionZh: "於230年前南取江陵。",
          goal: { kind: 'hold-cities', cityIds: ['jiangling'], byYear: 230 },
        },
      ],
    },
    {
      id: 'obj-221-wu',
      forceId: 'sun',
      primary: {
        title: { zh: '保江東而稱尊', en: 'Hold the River, Take the Title' },
        description: 'Declare yourself emperor — last of the three to do it, and the most careful.',
        descriptionZh: "稱帝建號 —— 三家之中稱帝最晚,也活得最久。",
        goal: { kind: 'declare-emperor' },
      },
      secondary: [
        {
          title: { zh: '荊襄在握', en: 'Jing and Xiang' },
          description: 'Hold Jiangling and Xiangyang by 232.',
          descriptionZh: "於232年前兼據江陵、襄陽 —— 全據長江,方可久安。",
          goal: { kind: 'hold-cities', cityIds: ['jiangling', 'xiangyang'], byYear: 232 },
        },
      ],
    },
  ],

  // 225 — The southern campaign
  'scn-225-southern': [
    {
      id: 'obj-225-shu',
      forceId: 'liu-bei',
      primary: {
        title: { zh: '七擒孟獲', en: 'Seven Captures' },
        description: 'Destroy the Nanman force by 229 — take the hearts, not just the ground.',
        descriptionZh: "於229年前平定南蠻 —— 攻心為上,七縱而後可。",
        goal: { kind: 'defeat-force', forceId: 'nanman', byYear: 229 },
      },
      secondary: [
        {
          title: { zh: '南定而後北伐', en: 'South Settled, Then North' },
          description: "Take Chang'an by 240.",
          descriptionZh: "於240年前北取長安 —— 南方已定,兵甲已足。",
          goal: { kind: 'hold-cities', cityIds: ['changan'], byYear: 240 },
        },
      ],
    },
    {
      id: 'obj-225-nanman',
      forceId: 'nanman',
      primary: {
        title: { zh: '南中之主', en: 'Lord of Nanzhong' },
        description: "Still hold Jianning, Yunnan and Yuexi in 232 — the mountains are yours; Chengdu was never in reach.",
        descriptionZh: "至232年仍據建寧、雲南、越巂 —— 山是你的;成都從來不在你能到的地方。",
        goal: { kind: 'hold-cities', cityIds: ['jianning', 'yunnan', 'yuexi'], byYear: 232 },
      },
      secondary: [
        {
          title: { zh: '北上成都', en: 'North to Chengdu' },
          description: 'Take Chengdu by 232 — refuse to be pacified.',
          descriptionZh: "於232年前攻取成都 —— 不服王化,便打到成都去。",
          goal: { kind: 'hold-cities', cityIds: ['chengdu'], byYear: 232 },
        },
      ],
    },
    {
      id: 'obj-225-wei',
      forceId: 'cao',
      primary: {
        title: { zh: '乘虛伐蜀', en: 'Strike While Shu Marches South' },
        description: 'Take Hanzhong by 232.',
        descriptionZh: "於232年前攻取漢中 —— 諸葛南征,蜀北空虛。",
        goal: { kind: 'hold-cities', cityIds: ['hanzhong'], byYear: 232 },
      },
    },
    {
      id: 'obj-225-wu',
      forceId: 'sun',
      primary: {
        title: { zh: '合肥新城', en: 'Hefei Once More' },
        description: 'Take Hefei by 234.',
        descriptionZh: "於234年前攻取合肥。",
        goal: { kind: 'hold-cities', cityIds: ['hefei'], byYear: 234 },
      },
    },
  ],

  // 228 — The battle of Jieting
  'scn-228-jieting': [
    {
      id: 'obj-228jt-shu',
      forceId: 'liu-bei',
      primary: {
        title: { zh: '隴右三郡', en: 'The Three Commanderies of Longyou' },
        description: "Still hold Tianshui, Shangui, Wudu and Yinping in 233 — the gains of the first expedition.",
        descriptionZh: "至233年仍據天水、上邽、武都、陰平 —— 一出祁山所得,守得住才算數。",
        goal: { kind: 'hold-cities', cityIds: ['tianshui', 'shanggui'], byYear: 233 },
      },
      secondary: [
        {
          title: { zh: '街亭不失', en: 'Jieting Must Hold' },
          description: 'Hold Jieting and Tianshui by 233 — do not camp on the hill.',
          descriptionZh: "於233年前據街亭、天水 —— 當道下寨,勿屯南山。",
          goal: { kind: 'hold-cities', cityIds: ['jieting', 'tianshui'], byYear: 233 },
        },
        {
          title: { zh: '克復長安', en: "Take Chang'an" },
          description: "Take Chang'an by 240.",
          descriptionZh: "於240年前克復長安。",
          goal: { kind: 'hold-cities', cityIds: ['changan'], byYear: 240 },
        },
      ],
    },
    {
      id: 'obj-228jt-wei',
      forceId: 'cao',
      primary: {
        title: { zh: '拒蜀於隴右', en: 'Stop Them at Longyou' },
        description: "Still hold Chang'an and Tianshui in 236.",
        descriptionZh: "至236年仍保長安、天水 —— 三郡叛應,張郃須疾行。",
        goal: { kind: 'hold-cities', cityIds: ['changan', 'tianshui'], byYear: 236 },
      },
      secondary: [
        {
          title: { zh: '滅蜀', en: 'Destroy Shu' },
          description: 'Destroy the Shu force.',
          descriptionZh: "擊滅蜀漢。",
          goal: { kind: 'defeat-force', forceId: 'liu-bei' },
        },
      ],
    },
    {
      id: 'obj-228jt-wu',
      forceId: 'sun',
      primary: {
        title: { zh: '東西並舉', en: 'Strike from the East' },
        description: 'Take Hefei by 236 — while Wei looks west.',
        descriptionZh: "於236年前攻取合肥 —— 魏之目光在西,則東可乘。",
        goal: { kind: 'hold-cities', cityIds: ['hefei'], byYear: 236 },
      },
    },
  ],

  // 228 — The battle of Shiting
  'scn-228-shiting': [
    {
      id: 'obj-228st-wu',
      forceId: 'sun',
      primary: {
        title: { zh: '江表無虞', en: 'The Southland Untouched' },
        description: "Still hold Wuchang, Jianye, Jiangxia and Chaisang in 236 — Zhou Fang's false surrender was to break an army, not to take a city.",
        descriptionZh: "至236年仍據武昌、建業、江夏、柴桑 —— 周魴斷髮詐降,要的是曹休那十萬人,不是一座城。",
        goal: { kind: 'hold-cities', cityIds: ['wuchang', 'jiangxia'], byYear: 236 },
      },
      secondary: [
        {
          title: { zh: '詐降誘敵', en: 'The False Defection' },
          description: 'Take Hefei and Shouchun by 236 — Zhou Fang cut his hair to sell the lie.',
          descriptionZh: "於236年前取合肥、壽春 —— 周魴斷髮賺曹休。",
          goal: { kind: 'hold-cities', cityIds: ['hefei', 'shouchun'], byYear: 236 },
        },
        {
          title: { zh: '即皇帝位', en: 'Take the Title' },
          description: 'Declare yourself emperor.',
          descriptionZh: "稱帝建號 —— 石亭一勝,遂有黃龍改元。",
          goal: { kind: 'declare-emperor' },
        },
      ],
    },
    {
      id: 'obj-228st-wei',
      forceId: 'cao',
      primary: {
        title: { zh: '淮南不失', en: 'Huainan Holds' },
        description: 'Still hold Hefei and Shouchun in 236.',
        descriptionZh: "至236年仍保合肥、壽春 —— 曹休輕進,幾覆全軍。",
        goal: { kind: 'hold-cities', cityIds: ['shouchun'], byYear: 236 },
      },
    },
    {
      id: 'obj-228st-shu',
      forceId: 'liu-bei',
      primary: {
        title: { zh: '祁山之道', en: 'The Qishan Road' },
        description: "Still hold Tianshui, Shangui and Hanzhong in 236 — the road out must stay open.",
        descriptionZh: "至236年仍據天水、上邽、漢中 —— 出祁山的那條路,得先握在手裡。",
        goal: { kind: 'hold-cities', cityIds: ['tianshui', 'shanggui', 'hanzhong'], byYear: 236 },
      },
      secondary: [
        {
          title: { zh: '再出祁山', en: 'Out from Qishan Again' },
          description: "Take Chang'an by 240.",
          descriptionZh: "於240年前克復長安。",
          goal: { kind: 'hold-cities', cityIds: ['changan'], byYear: 240 },
        },
      ],
    },
  ],

  // 229 — Three emperors
  'scn-229-three-emperors': [
    {
      id: 'obj-229-wei',
      forceId: 'cao',
      primary: {
        title: { zh: '中原之固', en: 'The Central Plain Holds' },
        description: "Still hold Luoyang, Xuchang, Chang'an and Ye in 245 — the empire that outlasts both rivals.",
        descriptionZh: "至245年仍據洛陽、許昌、長安、鄴 —— 魏未曾一統,但也未曾動搖。",
        goal: { kind: 'hold-cities', cityIds: ['luoyang', 'changan'], byYear: 245 },
      },
      secondary: [
        {
          title: { zh: '中原正統', en: 'The Legitimate Centre' },
          description: 'Bring all under Wei.',
          descriptionZh: "混一天下 —— 據中原十州之富,本當如此。",
          goal: { kind: 'unify-realm' },
        },
        {
          title: { zh: '先滅蜀漢', en: 'Shu First' },
          description: 'Destroy the Shu force by 250.',
          descriptionZh: "於250年前擊滅蜀漢。",
          goal: { kind: 'defeat-force', forceId: 'liu-bei', byYear: 250 },
        },
      ],
    },
    {
      id: 'obj-229-shu',
      forceId: 'liu-bei',
      primary: {
        title: { zh: '武都陰平', en: 'Wudu and Yinping' },
        description: "Still hold Wudu, Yinping and Hanzhong in 235 — the one lasting territorial gain of the expeditions.",
        descriptionZh: "至235年仍據武都、陰平、漢中 —— 建興七年陳式所取,是歷次北伐唯一守得住的地。",
        goal: { kind: 'hold-cities', cityIds: ['wudu', 'yinping', 'hanzhong'], byYear: 235 },
      },
      secondary: [
        {
          title: { zh: '漢賊不兩立', en: 'Han and Traitor Cannot Both Stand' },
          description: "Take Chang'an and Luoyang by 245.",
          descriptionZh: "於245年前克復長安、洛陽。",
          goal: { kind: 'hold-cities', cityIds: ['changan', 'luoyang'], byYear: 245 },
        },
        {
          title: { zh: '出隴右', en: 'Into Longyou' },
          description: 'Hold Tianshui by 238.',
          descriptionZh: "於238年前據天水,斷隴右之路。",
          goal: { kind: 'hold-cities', cityIds: ['tianshui'], byYear: 238 },
        },
      ],
    },
    {
      id: 'obj-229-wu',
      forceId: 'sun',
      primary: {
        title: { zh: '江表之守', en: 'The Lands Beyond the River' },
        description: "Still hold Jiangling, Wuchang and Jianye in 245 — the river is the realm.",
        descriptionZh: "至245年仍據江陵、武昌、建業 —— 限江自保,是吳立國五十二年的本錢。",
        goal: { kind: 'hold-cities', cityIds: ['jiangling', 'wuchang', 'jianye'], byYear: 245 },
      },
      secondary: [
        {
          title: { zh: '全據長江', en: 'The Whole River' },
          description: 'Hold Jiangling, Xiangyang and Hefei by 245.',
          descriptionZh: "於245年前兼據江陵、襄陽、合肥 —— 長江之險,與人共之則不險。",
          goal: { kind: 'hold-cities', cityIds: ['jiangling', 'xiangyang', 'hefei'], byYear: 245 },
        },
      ],
    },
    {
      id: 'obj-229-gongsun',
      forceId: 'gongsun',
      primary: {
        title: { zh: '遼東自立', en: 'Liaodong Stands Alone' },
        description: "Survive to 238 — the year Sima Yi came.",
        descriptionZh: "撐到238年 —— 那一年司馬懿來了,四十日而襄平破。",
        goal: { kind: 'survive-until', year: 238 },
      },
      secondary: [
        {
          title: { zh: '燕王之號', en: 'King of Yan' },
          description: 'Declare yourself emperor — Liaodong has been its own country for forty years.',
          descriptionZh: "稱帝建號 —— 遼東割據四十年,何必為人臣?",
          goal: { kind: 'declare-emperor' },
        },
        {
          title: { zh: '襄平不陷', en: 'Xiangping Shall Not Fall' },
          description: 'Still hold Xiangping in 245 — history sends Sima Yi in 238.',
          descriptionZh: "至245年仍據襄平 —— 史書上,司馬懿238年就來了。",
          goal: { kind: 'hold-cities', cityIds: ['xiangping'], byYear: 245 },
        },
      ],
    },
  ],

  // 231 — The battle of Lucheng
  'scn-231-lucheng': [
    {
      id: 'obj-231-shu',
      forceId: 'liu-bei',
      primary: {
        title: { zh: '糧不誤期', en: 'The Grain Must Not Be Late' },
        description: "Still hold Hanzhong in 240 — the last campaign ended not in battle but in Li Yan's late supply.",
        descriptionZh: "至240年仍固守漢中 —— 上一次退兵不是敗於陣前,是李嚴的糧沒到。",
        goal: { kind: 'hold-cities', cityIds: ['hanzhong'], byYear: 240 },
      },
      secondary: [
        {
          title: { zh: '甲首三千', en: 'Three Thousand Helmets' },
          description: "Take Tianshui and Chang'an by 240 — the one field battle Sima Yi lost outright.",
          descriptionZh: "於240年前取天水、長安 —— 鹵城一戰,獲甲首三千,司馬懿自此斂兵。",
          goal: { kind: 'hold-cities', cityIds: ['tianshui', 'changan'], byYear: 240 },
        },
      ],
    },
    {
      id: 'obj-231-wei',
      forceId: 'cao',
      primary: {
        title: { zh: '斂兵依險', en: 'Fortify and Wait' },
        description: "Still hold Chang'an and Tianshui in 240 — refuse battle, let the grain run out.",
        descriptionZh: "至240年仍保長安、天水 —— 不與交鋒,待其糧盡自退。",
        goal: { kind: 'hold-cities', cityIds: ['changan', 'tianshui'], byYear: 240 },
      },
    },
    {
      id: 'obj-231-wu',
      forceId: 'sun',
      primary: {
        title: { zh: '淮南之圖', en: 'Designs on Huainan' },
        description: 'Take Hefei by 240.',
        descriptionZh: "於240年前攻取合肥。",
        goal: { kind: 'hold-cities', cityIds: ['hefei'], byYear: 240 },
      },
    },
  ],

  // 238 — Liaodong, the siege of Xiangping
  'scn-238-liaodong': [
    {
      id: 'obj-238-wei',
      forceId: 'cao',
      primary: {
        title: { zh: '克日擒淵', en: 'Take Gongsun Yuan on Schedule' },
        description: 'Destroy the Yan force by 241 — a hundred days out, a hundred back, a hundred to fight.',
        descriptionZh: "於241年前滅公孫淵 —— 往百日,還百日,攻百日,以六十日為休息。",
        goal: { kind: 'defeat-force', forceId: 'yan', byYear: 241 },
      },
      secondary: [
        {
          title: { zh: '混一宇內', en: 'Unify the Realm' },
          description: 'Bring all under one banner.',
          descriptionZh: "混一天下。",
          goal: { kind: 'unify-realm' },
        },
      ],
    },
    {
      id: 'obj-238-yan',
      forceId: 'yan',
      primary: {
        title: { zh: '襄平不陷', en: 'Xiangping Must Not Fall' },
        description: "Still hold Xiangping in 240 — Sima Yi took a hundred days to march and forty to finish it; outlast that and the title is real.",
        descriptionZh: "至240年仍據襄平 —— 司馬懿行軍百日、圍城四十日;撐過這一場,燕王才是真的。",
        goal: { kind: 'hold-cities', cityIds: ['xiangping'], byYear: 240 },
      },
      secondary: [
        {
          title: { zh: '燕祚不絕', en: 'Yan Endures' },
          description: 'Still hold Xiangping and Liaodong in 245 — history gives you until 238.',
          descriptionZh: "至245年仍據襄平、遼東 —— 史書只給了你到238年秋。",
          goal: { kind: 'hold-cities', cityIds: ['xiangping', 'liaodong'], byYear: 245 },
        },
        {
          title: { zh: '南結孫吳', en: 'Reach South to Wu' },
          description: 'Take Beiping by 245 — break out of the northeast corner.',
          descriptionZh: "於245年前南取北平 —— 困守遼東一隅,終無生路。",
          goal: { kind: 'hold-cities', cityIds: ['beiping'], byYear: 245 },
        },
      ],
    },
    {
      id: 'obj-238-shu',
      forceId: 'liu-bei',
      primary: {
        title: { zh: '漢中之守', en: 'Hanzhong Holds' },
        description: "Still hold Hanzhong and Yangping Pass in 248 — Wei is busy in the northeast; do not lose the gate.",
        descriptionZh: "至248年仍據漢中、陽平關 —— 魏方用兵遼東,而漢中之門不可失。",
        goal: { kind: 'hold-cities', cityIds: ['hanzhong', 'yangping'], byYear: 248 },
      },
      secondary: [
        {
          title: { zh: '乘隙北伐', en: 'March While Wei Looks Northeast' },
          description: "Take Chang'an by 248.",
          descriptionZh: "於248年前克復長安 —— 魏之大軍在遼東。",
          goal: { kind: 'hold-cities', cityIds: ['changan'], byYear: 248 },
        },
      ],
    },
    {
      id: 'obj-238-wu',
      forceId: 'sun',
      primary: {
        title: { zh: '遼東通使', en: 'The Liaodong Embassy' },
        description: 'Take Hefei by 248 — you sent a fleet to Liaodong and lost the envoys; take the wall instead.',
        descriptionZh: "於248年前攻取合肥 —— 浮海通遼東,使者為公孫淵所斬,不如踏實取合肥。",
        goal: { kind: 'hold-cities', cityIds: ['hefei'], byYear: 248 },
      },
    },
  ],

  // 241 — Wu strikes at Shaopi
  'scn-241-shaopi': [
    {
      id: 'obj-241-wu',
      forceId: 'sun',
      primary: {
        title: { zh: '四路伐魏', en: 'Four Armies North' },
        description: 'Take Hefei and Shouchun by 250 — Quan Cong at Shaopi, Zhuge Ke at Liu\'an.',
        descriptionZh: "於250年前取合肥、壽春 —— 全琮攻芍陂,諸葛恪向六安,四路並舉。",
        goal: { kind: 'hold-cities', cityIds: ['hefei', 'shouchun'], byYear: 250 },
      },
      secondary: [
        {
          title: { zh: '取襄陽', en: 'Take Xiangyang' },
          description: 'Hold Xiangyang by 252 — Zhu Ran\'s road into Jing.',
          descriptionZh: "於252年前取襄陽 —— 朱然攻樊,此路亦當開。",
          goal: { kind: 'hold-cities', cityIds: ['xiangyang'], byYear: 252 },
        },
      ],
    },
    {
      id: 'obj-241-wei',
      forceId: 'cao',
      primary: {
        title: { zh: '淮南屯田', en: 'The Huainan Colonies' },
        description: 'Still hold Hefei and Shouchun in 250 — Deng Ai\'s canals feed the front.',
        descriptionZh: "至250年仍保合肥、壽春 —— 鄧艾開廣漕渠,淮南之田足以養兵。",
        goal: { kind: 'hold-cities', cityIds: ['hefei', 'shouchun'], byYear: 250 },
      },
    },
    {
      id: 'obj-241-shu',
      forceId: 'liu-bei',
      primary: {
        title: { zh: '費禕守成', en: 'Fei Yi Holds the Line' },
        description: "Still hold Hanzhong in 250, and take Chang'an if you can.",
        descriptionZh: "至250年仍保漢中,有餘力則北取長安 —— 費禕主政,不欲窮兵。",
        goal: { kind: 'hold-cities', cityIds: ['hanzhong'], byYear: 250 },
      },
    },
  ],

  // 244 — The battle of Xingshi
  'scn-244-xingshi': [
    {
      id: 'obj-244-wei',
      forceId: 'cao',
      primary: {
        title: { zh: '關中不搖', en: 'Guanzhong Unshaken' },
        description: "Still hold Chang'an, Anding and Longxi in 249 — the retreat from Xingshi cost dearly, but not the west.",
        descriptionZh: "至249年仍據長安、安定、隴西 —— 興勢之退折兵甚眾,關中卻未曾動搖。",
        goal: { kind: 'hold-cities', cityIds: ['changan'], byYear: 249 },
      },
      secondary: [
        {
          title: { zh: '曹爽伐蜀', en: "Cao Shuang's Invasion" },
          description: 'Take Hanzhong by 249 — you need a victory to hold the court.',
          descriptionZh: "於249年前攻取漢中 —— 你需要一場勝仗來坐穩朝堂。",
          goal: { kind: 'hold-cities', cityIds: ['hanzhong'], byYear: 249 },
        },
        {
          title: { zh: '滅蜀', en: 'Destroy Shu' },
          description: 'Destroy the Shu force.',
          descriptionZh: "擊滅蜀漢。",
          goal: { kind: 'defeat-force', forceId: 'liu-bei' },
        },
      ],
    },
    {
      id: 'obj-244-shu',
      forceId: 'liu-bei',
      primary: {
        title: { zh: '拒敵於興勢', en: 'Stop Them at Xingshi' },
        description: 'Still hold Hanzhong and Yangping in 250 — Wang Ping held with three thousand.',
        descriptionZh: "至250年仍保漢中、陽平 —— 王平以三萬拒十餘萬,據險而不出。",
        goal: { kind: 'hold-cities', cityIds: ['hanzhong', 'yangping'], byYear: 250 },
      },
      secondary: [
        {
          title: { zh: '反攻關中', en: 'Counter into Guanzhong' },
          description: "Take Chang'an by 256.",
          descriptionZh: "於256年前克復長安 —— 敵既大敗而歸,可以進取。",
          goal: { kind: 'hold-cities', cityIds: ['changan'], byYear: 256 },
        },
      ],
    },
    {
      id: 'obj-244-wu',
      forceId: 'sun',
      primary: {
        title: { zh: '東線並進', en: 'Press the Eastern Front' },
        description: 'Take Hefei by 252.',
        descriptionZh: "於252年前攻取合肥。",
        goal: { kind: 'hold-cities', cityIds: ['hefei'], byYear: 252 },
      },
    },
  ],

  // 249 — The Gaoping Tombs incident
  'scn-249-gaopingling': [
    {
      id: 'obj-249-sima',
      forceId: 'sima',
      primary: {
        title: { zh: '據武庫,屯浮橋', en: 'The Armoury and the Bridge' },
        description: "Still hold Luoyang, Xuchang and Ye in 253 — what one morning seized, ten years must keep.",
        descriptionZh: "至253年仍據洛陽、許昌、鄴 —— 詐病十年發於一朝,而奪來的東西要守得住才算數。",
        goal: { kind: 'hold-cities', cityIds: ['luoyang', 'xuchang', 'ye'], byYear: 253 },
      },
      secondary: [
        {
          title: { zh: '翦滅曹爽', en: 'End the Cao Shuang Faction' },
          description: 'Destroy the Cao Shuang force by 253.',
          descriptionZh: "於253年前翦滅曹爽 —— 史書上他三日而族滅,盤上他還握著半個天下。",
          goal: { kind: 'defeat-force', forceId: 'cao', byYear: 253 },
        },
      ],
    },
    {
      id: 'obj-249-caoshuang',
      forceId: 'cao',
      primary: {
        title: { zh: '挾帝幸許', en: 'Take the Emperor to Xuchang' },
        description: "Take Xuchang by 253 — Huan Fan begged you to go there and call up the realm; you went home instead.",
        descriptionZh: "於253年前取許昌 —— 桓範勸你挾天子走許昌、召天下兵,你選擇了回家做富家翁。",
        goal: { kind: 'hold-cities', cityIds: ['xuchang'], byYear: 253 },
      },
      secondary: [
        {
          title: { zh: '許昌別都', en: 'Xuchang as the Second Capital' },
          description: 'Hold Xuchang and Luoyang by 255.',
          descriptionZh: "於255年前兼據許昌、洛陽。",
          goal: { kind: 'hold-cities', cityIds: ['xuchang', 'luoyang'], byYear: 255 },
        },
      ],
    },
    {
      id: 'obj-249-shu',
      forceId: 'liu-bei',
      primary: {
        title: { zh: '漢中之險', en: 'The Hanzhong Passes' },
        description: "Still hold Hanzhong and Yangping Pass in 262 — Jiang Wei's raids mean nothing if the gate falls.",
        descriptionZh: "至262年仍據漢中、陽平關 —— 姜維九伐中原,守不住這道門則一切皆空。",
        goal: { kind: 'hold-cities', cityIds: ['hanzhong', 'yangping'], byYear: 262 },
      },
      secondary: [
        {
          title: { zh: '姜維北伐', en: "Jiang Wei's Northern Campaigns" },
          description: "Take Tianshui and Chang'an by 262.",
          descriptionZh: "於262年前取天水、長安 —— 魏室內亂,正可乘之。",
          goal: { kind: 'hold-cities', cityIds: ['tianshui', 'changan'], byYear: 262 },
        },
      ],
    },
    {
      id: 'obj-249-wu',
      forceId: 'sun',
      primary: {
        title: { zh: '乘魏之亂', en: "Profit from Wei's Turmoil" },
        description: 'Take Hefei and Shouchun by 260.',
        descriptionZh: "於260年前取合肥、壽春 —— 魏有內變,淮南可圖。",
        goal: { kind: 'hold-cities', cityIds: ['hefei', 'shouchun'], byYear: 260 },
      },
    },
  ],

  // 252 — The battle of Dongxing
  'scn-252-dongxing': [
    {
      id: 'obj-252-wu',
      forceId: 'sun',
      primary: {
        title: { zh: '東興大捷', en: 'The Dongxing Victory' },
        description: 'Hold Ruxu and take Hefei by 258 — Ding Feng went in with short blades in the snow.',
        descriptionZh: "於258年前守濡須並取合肥 —— 丁奉雪中短兵,魏軍自相踐踏。",
        goal: { kind: 'hold-cities', cityIds: ['ruxu', 'hefei'], byYear: 258 },
      },
      secondary: [
        {
          title: { zh: '勿再興師', en: 'Do Not Overreach' },
          description: 'Still hold Ruxu and Jianye in 260 — the win went to Zhuge Ke\'s head, and cost him his life.',
          descriptionZh: "至260年仍保濡須、建業 —— 諸葛恪勝而驕,再攻新城,遂及於禍。",
          goal: { kind: 'hold-cities', cityIds: ['ruxu', 'jianye'], byYear: 260 },
        },
      ],
    },
    {
      id: 'obj-252-wei',
      forceId: 'cao',
      primary: {
        title: { zh: '拔東興堤', en: 'Break the Dongxing Dam' },
        description: 'Take Ruxu by 258.',
        descriptionZh: "於258年前攻取濡須 —— 壞其堤堰,則巢湖之路通。",
        goal: { kind: 'hold-cities', cityIds: ['ruxu'], byYear: 258 },
      },
    },
    {
      id: 'obj-252-shu',
      forceId: 'liu-bei',
      primary: {
        title: { zh: '隴右之出', en: 'Out Through Longyou' },
        description: "Still hold Wudu, Yinping and Hanzhong in 262 — the two commanderies are the staging ground.",
        descriptionZh: "至262年仍據武都、陰平、漢中 —— 二郡在手,出隴右才有立足之地。",
        goal: { kind: 'hold-cities', cityIds: ['wudu', 'yinping', 'hanzhong'], byYear: 262 },
      },
      secondary: [
        {
          title: { zh: '出狄道', en: 'Out by Didao' },
          description: "Take Tianshui and Chang'an by 262.",
          descriptionZh: "於262年前取天水、長安。",
          goal: { kind: 'hold-cities', cityIds: ['tianshui', 'changan'], byYear: 262 },
        },
      ],
    },
  ],

  // 253 — The siege of Hefei New City
  'scn-253-hefei': [
    {
      id: 'obj-253-wu',
      forceId: 'sun',
      primary: {
        title: { zh: '圍新城', en: 'The Siege of the New City' },
        description: "Still hold Jianye, Wuchang and Ruxu in 258 — Zhuge Ke besieged Hefei for three months and brought back plague.",
        descriptionZh: "至258年仍據建業、武昌、濡須 —— 諸葛恪圍新城三月,帶回來的是疫。",
        goal: { kind: 'hold-cities', cityIds: ['jianye', 'wuchang', 'ruxu'], byYear: 258 },
      },
      secondary: [
        {
          title: { zh: '拔新城', en: 'Storm the New City' },
          description: 'Take Hefei by 258 — two hundred thousand men, three months, one small wall.',
          descriptionZh: "於258年前攻下合肥新城 —— 二十萬眾,圍三月,終不能拔。",
          goal: { kind: 'hold-cities', cityIds: ['hefei'], byYear: 258 },
        },
        {
          title: { zh: '軍中無疫', en: 'Keep the Camp Alive' },
          description: 'Still hold Jianye and Ruxu in 260 — the siege lost more to sickness than to arrows.',
          descriptionZh: "至260年仍保建業、濡須 —— 圍城之敗,死於疫者多於死於矢者。",
          goal: { kind: 'hold-cities', cityIds: ['jianye', 'ruxu'], byYear: 260 },
        },
      ],
    },
    {
      id: 'obj-253-wei',
      forceId: 'cao',
      primary: {
        title: { zh: '守新城', en: 'Hold the New City' },
        description: 'Still hold Hefei in 258 — Zhang Te bought time with a fake surrender and rebuilt the wall at night.',
        descriptionZh: "至258年仍守合肥 —— 張特詐降緩兵,夜以拆屋之材補城。",
        goal: { kind: 'hold-cities', cityIds: ['hefei'], byYear: 258 },
      },
    },
    {
      id: 'obj-253-shu',
      forceId: 'liu-bei',
      primary: {
        title: { zh: '與吳並舉', en: 'Two Fronts' },
        description: "Still hold Hanzhong and Wudu in 262 — strike west while Wu strikes east, but hold what you have.",
        descriptionZh: "至262年仍據漢中、武都 —— 東西並舉是好謀,前提是自家的地還在。",
        goal: { kind: 'hold-cities', cityIds: ['hanzhong', 'wudu'], byYear: 262 },
      },
      secondary: [
        {
          title: { zh: '與吳並舉', en: 'March With Wu' },
          description: "Take Tianshui and Chang'an by 262.",
          descriptionZh: "於262年前取天水、長安 —— 東西並舉,魏不能兩顧。",
          goal: { kind: 'hold-cities', cityIds: ['tianshui', 'changan'], byYear: 262 },
        },
      ],
    },
  ],

  // 255 — The second Huainan revolt
  'scn-255-huainan2': [
    {
      id: 'obj-255-sima',
      forceId: 'cao',
      primary: {
        title: { zh: '平毌丘儉', en: 'Put Down Guanqiu Jian' },
        description: 'Destroy the Guanqiu force by 258 — ride out with a tumour in your eye if you must.',
        descriptionZh: "於258年前平定毌丘儉 —— 目瘤方割,亦當輿疾而東。",
        goal: { kind: 'defeat-force', forceId: 'guanqiu', byYear: 258 },
      },
      secondary: [
        {
          title: { zh: '壽春在握', en: 'Hold Shouchun' },
          description: 'Still hold Shouchun in 260.',
          descriptionZh: "至260年仍據壽春 —— 淮南三叛,皆起於此城。",
          goal: { kind: 'hold-cities', cityIds: ['shouchun'], byYear: 260 },
        },
      ],
    },
    {
      id: 'obj-255-guanqiu',
      forceId: 'guanqiu',
      primary: {
        title: { zh: '淮南舉義', en: 'The Huainan Rising' },
        description: "Still hold Shouchun and Xiangcheng in 258 — the call went out to the realm; only Huainan answered.",
        descriptionZh: "至258年仍據壽春、項城 —— 移檄郡國,而應者只有淮南一路。",
        goal: { kind: 'hold-cities', cityIds: ['shouchun', 'runan'], byYear: 258 },
      },
      secondary: [
        {
          title: { zh: '清君側', en: 'Purge the Emperor\'s Side' },
          description: 'Take Luoyang by 259 — the proclamation named eleven crimes of Sima Shi.',
          descriptionZh: "於259年前攻取洛陽 —— 傳檄州郡,數司馬師十一罪。",
          goal: { kind: 'hold-cities', cityIds: ['luoyang'], byYear: 259 },
        },
        {
          title: { zh: '毋失壽春', en: 'Do Not Lose Shouchun' },
          description: 'Still hold Shouchun in 258 — your army melted away when their families were held hostage.',
          descriptionZh: "至258年仍據壽春 —— 史書上,將士家屬在北,軍心一夕而散。",
          goal: { kind: 'hold-cities', cityIds: ['shouchun'], byYear: 258 },
        },
      ],
    },
    {
      id: 'obj-255-wu',
      forceId: 'sun',
      primary: {
        title: { zh: '乘亂北取', en: 'Take Huainan in the Confusion' },
        description: 'Take Shouchun by 262.',
        descriptionZh: "於262年前攻取壽春 —— 魏有內亂,淮南易主之機。",
        goal: { kind: 'hold-cities', cityIds: ['shouchun'], byYear: 262 },
      },
    },
    {
      id: 'obj-255-shu',
      forceId: 'liu-bei',
      primary: {
        title: { zh: '洮西大捷', en: 'The Victory at Taoxi' },
        description: "Still hold Wudu, Yinping and Hanzhong in 264 — Taoxi killed tens of thousands and changed nothing.",
        descriptionZh: "至264年仍據武都、陰平、漢中 —— 洮西破王經,死者數萬,而隴右終不可得。",
        goal: { kind: 'hold-cities', cityIds: ['hanzhong', 'wudu'], byYear: 264 },
      },
      secondary: [
        {
          title: { zh: '洮西大捷', en: 'The Victory West of Tao' },
          description: "Take Tianshui and Chang'an by 264.",
          descriptionZh: "於264年前取天水、長安 —— 洮西一戰,魏人死者數萬。",
          goal: { kind: 'hold-cities', cityIds: ['tianshui', 'changan'], byYear: 264 },
        },
      ],
    },
  ],

  // 257 — The third Huainan revolt
  'scn-257-huainan3': [
    {
      id: 'obj-257-sima',
      forceId: 'cao',
      primary: {
        title: { zh: '圍壽春', en: 'Encircle Shouchun' },
        description: 'Destroy the Zhuge Dan force by 261 — twenty-six legions, a ring of earth, and patience.',
        descriptionZh: "於261年前平定諸葛誕 —— 二十六萬眾,築圍而守,不與野戰。",
        goal: { kind: 'defeat-force', forceId: 'huainan', byYear: 261 },
      },
      secondary: [
        {
          title: { zh: '混一宇內', en: 'Unify the Realm' },
          description: 'Bring all under one banner.',
          descriptionZh: "混一天下 —— 內患既除,便可西向。",
          goal: { kind: 'unify-realm' },
        },
      ],
    },
    {
      id: 'obj-257-zhugedan',
      forceId: 'huainan',
      primary: {
        title: { zh: '壽春不下', en: 'Shouchun Shall Not Fall' },
        description: 'Still hold Shouchun in 262 — history gives you until 258.',
        descriptionZh: "至262年仍據壽春 —— 史書只給了你到258年二月。",
        goal: { kind: 'hold-cities', cityIds: ['shouchun'], byYear: 262 },
      },
      secondary: [
        {
          title: { zh: '兵入洛陽', en: 'March on Luoyang' },
          description: 'Take Luoyang by 264.',
          descriptionZh: "於264年前攻取洛陽 —— 困守孤城必亡,唯有北出。",
          goal: { kind: 'hold-cities', cityIds: ['luoyang'], byYear: 264 },
        },
      ],
    },
    {
      id: 'obj-257-wu',
      forceId: 'sun',
      primary: {
        title: { zh: '救壽春', en: 'Relieve Shouchun' },
        description: 'Take Shouchun by 262 — you sent Wen Qin and three legions in; none came back.',
        descriptionZh: "於262年前取壽春 —— 遣文欽、唐咨三萬入城,城破皆沒。",
        goal: { kind: 'hold-cities', cityIds: ['shouchun'], byYear: 262 },
      },
    },
    {
      id: 'obj-257-shu',
      forceId: 'liu-bei',
      primary: {
        title: { zh: '出駱谷', en: 'Out Through Luo Valley' },
        description: "Still hold Hanzhong, Wudu and Yinping in 266 — strike while Huainan burns, but the passes come first.",
        descriptionZh: "至266年仍據漢中、武都、陰平 —— 乘淮南之亂而出,前提是這幾道口子還在。",
        goal: { kind: 'hold-cities', cityIds: ['hanzhong', 'wudu', 'yinping'], byYear: 266 },
      },
      secondary: [
        {
          title: { zh: '出駱谷', en: 'Out by the Luo Valley' },
          description: "Take Chang'an by 266.",
          descriptionZh: "於266年前克復長安 —— 魏之主力在淮南。",
          goal: { kind: 'hold-cities', cityIds: ['changan'], byYear: 266 },
        },
      ],
    },
  ],

  // 263 — The conquest of Shu
  'scn-263-shu-fall': [
    {
      id: 'obj-263-wei',
      forceId: 'cao',
      primary: {
        title: { zh: '三路伐蜀', en: 'Three Roads into Shu' },
        description: 'Destroy the Shu force by 267 — Deng Ai over Yinping, Zhong Hui at Jiange.',
        descriptionZh: "於267年前滅蜀漢 —— 鍾會攻劍閣,鄧艾偷渡陰平。",
        goal: { kind: 'defeat-force', forceId: 'liu-bei', byYear: 267 },
      },
      secondary: [
        {
          title: { zh: '混一宇內', en: 'Unify the Realm' },
          description: 'Bring all under one banner.',
          descriptionZh: "混一天下。",
          goal: { kind: 'unify-realm' },
        },
      ],
    },
    {
      id: 'obj-263-shu',
      forceId: 'liu-bei',
      primary: {
        title: { zh: '社稷不亡', en: 'The Altars Shall Stand' },
        description: 'Survive to 270 — in history the gates of Chengdu open in the winter of 263.',
        descriptionZh: "存續至270年 —— 史書上,成都在263年冬開城出降。",
        goal: { kind: 'survive-until', year: 270 },
      },
      secondary: [
        {
          title: { zh: '守劍閣', en: 'Hold Jiange' },
          description: 'Still hold Hanzhong and Chengdu in 267.',
          descriptionZh: "至267年仍保漢中、成都 —— 姜維列營守險,會不能克。",
          goal: { kind: 'hold-cities', cityIds: ['hanzhong', 'chengdu'], byYear: 267 },
        },
      ],
    },
    {
      id: 'obj-263-wu',
      forceId: 'sun',
      primary: {
        title: { zh: '救蜀', en: 'Relieve Shu' },
        description: "Still hold Yongan-facing Jiangling and Xiling in 267 — Wu sent an army west; it turned back at the news.",
        descriptionZh: "至267年仍據江陵、西陵 —— 吳遣兵西上,聞成都已降而還。",
        goal: { kind: 'hold-cities', cityIds: ['jiangling', 'xiling'], byYear: 267 },
      },
      secondary: [
        {
          title: { zh: '救蜀', en: 'Save Shu' },
          description: 'Hold Yongan by 267 — Shu falling leaves you alone against the north.',
          descriptionZh: "於267年前據永安 —— 唇亡則齒寒,蜀亡則吳孤。",
          goal: { kind: 'hold-cities', cityIds: ['yongan'], byYear: 267 },
        },
      ],
    },
  ],

  // 264 — Zhong Hui's revolt
  'scn-264-zhonghui': [
    {
      id: 'obj-264-zhonghui',
      forceId: 'zhonghui',
      primary: {
        title: { zh: '據蜀自王', en: 'A Kingdom in Shu' },
        description: 'Hold Chengdu and Hanzhong by 268 — with Shu\'s army and Jiang Wei\'s counsel.',
        descriptionZh: "於268年前據成都、漢中 —— 得蜀兵,得姜維,事可濟也。",
        goal: { kind: 'hold-cities', cityIds: ['chengdu', 'hanzhong'], byYear: 268 },
      },
      secondary: [
        {
          title: { zh: '東向爭天下', en: 'Then Turn East' },
          description: 'Destroy the Sima force.',
          descriptionZh: "翦滅司馬昭 —— 事成則得天下,不成退保蜀漢。",
          goal: { kind: 'defeat-force', forceId: 'cao' },
        },
      ],
    },
    {
      id: 'obj-264-dengai',
      forceId: 'dengai',
      primary: {
        title: { zh: '偷渡陰平', en: 'The March Through Yinping' },
        description: "Still hold Chengdu and Yinping in 268 — seven hundred li of unpeopled mountain, and the war was over.",
        descriptionZh: "至268年仍據成都、陰平 —— 行無人之地七百餘里,鑿山通道,而蜀亡。",
        goal: { kind: 'hold-cities', cityIds: ['chengdu', 'yinping'], byYear: 268 },
      },
      secondary: [
        {
          title: { zh: '功高見疑', en: 'Too Much Merit' },
          description: 'Destroy the Zhong Hui force — he wrote the letters that had you arrested.',
          descriptionZh: "擊滅鍾會 —— 檻車囚你的那封表,是他偽作的。",
          goal: { kind: 'defeat-force', forceId: 'zhonghui' },
        },
        {
          title: { zh: '守成都', en: 'Hold Chengdu' },
          description: 'Still hold Chengdu in 268.',
          descriptionZh: "至268年仍據成都 —— 陰平小道走過來的,不該這樣死。",
          goal: { kind: 'hold-cities', cityIds: ['chengdu'], byYear: 268 },
        },
      ],
    },
    {
      id: 'obj-264-sima',
      forceId: 'cao',
      primary: {
        title: { zh: '收蜀定亂', en: 'Take Shu, End the Mutiny' },
        description: 'Destroy the Zhong Hui force by 268 — you sent him because he had no family to protect.',
        descriptionZh: "於268年前平定鍾會 —— 你早知道他會反,只是算準了他成不了。",
        goal: { kind: 'defeat-force', forceId: 'zhonghui', byYear: 268 },
      },
      secondary: [
        {
          title: { zh: '混一宇內', en: 'Unify the Realm' },
          description: 'Bring all under one banner.',
          descriptionZh: "混一天下。",
          goal: { kind: 'unify-realm' },
        },
      ],
    },
    {
      id: 'obj-264-wu',
      forceId: 'sun',
      primary: {
        title: { zh: '西陵之守', en: 'Hold the Upper River' },
        description: "Still hold Yongan-facing Jiangling and Xiling in 270 — with Shu gone, the upper river is all that is left.",
        descriptionZh: "至270年仍據江陵、西陵 —— 蜀既亡,上游就是吳的全部。",
        goal: { kind: 'hold-cities', cityIds: ['jiangling', 'xiling'], byYear: 270 },
      },
      secondary: [
        {
          title: { zh: '西取巴蜀', en: 'West into Ba-Shu' },
          description: 'Take Yongan and Chengdu by 270 — Shu is in chaos and its gates are open.',
          descriptionZh: "於270年前取永安、成都 —— 蜀方大亂,此千載之機。",
          goal: { kind: 'hold-cities', cityIds: ['yongan', 'chengdu'], byYear: 270 },
        },
      ],
    },
  ],

  // 265 — Sima Yan takes the throne
  'scn-265-jin-founded': [
    {
      id: 'obj-265-jin',
      forceId: 'sima',
      primary: {
        title: { zh: '樓船下益州', en: 'The Tower Ships Sail' },
        description: 'Destroy the Wu force by 285 — sixty years of division end when the last of them does.',
        descriptionZh: "於285年前滅吳 —— 王濬樓船下益州,金陵王氣黯然收。六十年分裂,終於此。",
        goal: { kind: 'defeat-force', forceId: 'sun', byYear: 285 },
      },
      secondary: [
        {
          title: { zh: '混一宇內', en: 'One Realm Under Jin' },
          description: 'Bring all under Jin.',
          descriptionZh: "混一天下 —— 滅吳只是收官,四夷與遼東還在外頭。",
          goal: { kind: 'unify-realm' },
        },
      ],
    },
    {
      id: 'obj-265-wu',
      forceId: 'sun',
      primary: {
        title: { zh: '苟延十五年', en: 'Fifteen Years More' },
        description: 'Survive to 280 — that is exactly how long history gave you.',
        descriptionZh: "存續至280年 —— 史書給你的,不多不少就是這十五年。",
        goal: { kind: 'survive-until', year: 280 },
      },
      secondary: [
        {
          title: { zh: '江東不亡', en: 'Wu Shall Not Fall' },
          description: 'Survive to 290 — ten years longer than you were given.',
          descriptionZh: "存續至290年 —— 比史書多給你的那十年。",
          goal: { kind: 'survive-until', year: 290 },
        },
        {
          title: { zh: '固守上游', en: 'Hold the Upper River' },
          description: 'Still hold Jiangling and Xiling in 285 — Wu dies when the upper river is lost.',
          descriptionZh: "至285年仍保江陵、西陵 —— 吳之存亡,在上游而不在建業。",
          goal: { kind: 'hold-cities', cityIds: ['jiangling', 'xiling'], byYear: 285 },
        },
      ],
    },
  ],

  // 272 — The battle of Xiling
  'scn-272-xiling': [
    {
      id: 'obj-272-wu',
      forceId: 'sun',
      primary: {
        title: { zh: '西陵之守', en: 'The Defence of Xiling' },
        description: 'Still hold Xiling and Jiangling in 278 — Lu Kang built a wall against his own rebel general.',
        descriptionZh: "至278年仍保西陵、江陵 —— 陸抗築嚴圍以待步闡,不攻而先自固。",
        goal: { kind: 'hold-cities', cityIds: ['xiling', 'jiangling'], byYear: 278 },
      },
      secondary: [
        {
          title: { zh: '國之西門', en: 'The Western Gate' },
          description: 'Survive to 288.',
          descriptionZh: "存續至288年 —— 西陵、建平,國之藩表,若失之則非徒失一郡。",
          goal: { kind: 'survive-until', year: 288 },
        },
      ],
    },
    {
      id: 'obj-272-jin',
      forceId: 'sima',
      primary: {
        title: { zh: '取西陵', en: 'Take Xiling' },
        description: 'Take Xiling and Jiangling by 278 — Bu Chan has opened the door.',
        descriptionZh: "於278年前取西陵、江陵 —— 步闡已獻城,上游一開,吳不能守。",
        goal: { kind: 'hold-cities', cityIds: ['xiling', 'jiangling'], byYear: 278 },
      },
      secondary: [
        {
          title: { zh: '混一宇內', en: 'Unify the Realm' },
          description: 'Bring all under one banner.',
          descriptionZh: "混一天下。",
          goal: { kind: 'unify-realm' },
        },
      ],
    },
  ],

  // 280 — Jin conquers Wu
  'scn-280-jin-unite': [
    {
      id: 'obj-280-jin',
      forceId: 'sima',
      primary: {
        title: { zh: '一片降旛出石頭', en: 'The Banner of Surrender at Shitou' },
        description: 'Destroy the Wu force by 284 — six armies down the river at once.',
        descriptionZh: "於284年前滅吳 —— 六路並進,千尋鐵鎖沉江底。",
        goal: { kind: 'defeat-force', forceId: 'sun', byYear: 284 },
      },
      secondary: [
        {
          title: { zh: '混一宇內', en: 'Unify the Realm' },
          description: 'Bring all under one banner.',
          descriptionZh: "混一天下 —— 自黃巾至此,九十六年。",
          goal: { kind: 'unify-realm' },
        },
      ],
    },
    {
      id: 'obj-280-wu',
      forceId: 'sun',
      primary: {
        title: { zh: '守此殘江', en: 'Hold What Is Left of the River' },
        description: 'Survive to 290 — the iron chains across the river will not be enough.',
        descriptionZh: "存續至290年 —— 攔江鐵鎖擋不住樓船,能擋住的只有人心。",
        goal: { kind: 'survive-until', year: 290 },
      },
      secondary: [
        {
          title: { zh: '建業不降', en: 'Jianye Does Not Surrender' },
          description: 'Still hold Jianye and Jiangling in 286.',
          descriptionZh: "至286年仍保建業、江陵。",
          goal: { kind: 'hold-cities', cityIds: ['jianye', 'jiangling'], byYear: 286 },
        },
      ],
    },
  ],

  // ───────────────────────────────────────────────────────────────────────
  // What-if boards. The objective is the premise: each force is asked to
  // cash in the thing history denied it.
  // ───────────────────────────────────────────────────────────────────────

  // Gathering of Heroes — everyone at their peak, all at once
  'scn-gathering-of-heroes': [
    {
      id: 'obj-goh-cao',
      forceId: 'cao',
      primary: {
        title: { zh: '寧我負人', en: 'Rather I Wrong the World' },
        description: 'Bring all under one banner.',
        descriptionZh: "混一天下 —— 群雄畢集,正是治世能臣、亂世奸雄的分野處。",
        goal: { kind: 'unify-realm' },
      },
      secondary: [
        {
          title: { zh: '先定中原', en: 'The Central Plain First' },
          description: 'Hold Luoyang, Xuchang and Ye by 210.',
          descriptionZh: "於210年前兼據洛陽、許昌、鄴城。",
          goal: { kind: 'hold-cities', cityIds: ['luoyang', 'xuchang', 'ye'], byYear: 210 },
        },
      ],
    },
    {
      id: 'obj-goh-liubei',
      forceId: 'liu-bei',
      primary: {
        title: { zh: '興復漢室', en: 'Restore the Han' },
        description: 'Hold Chengdu, Jiangling and Luoyang by 215.',
        descriptionZh: "於215年前兼據成都、江陵、洛陽 —— 跨有荊益,還於舊都。",
        goal: { kind: 'hold-cities', cityIds: ['chengdu', 'jiangling', 'luoyang'], byYear: 215 },
      },
      secondary: [
        {
          title: { zh: '三分而後一統', en: 'Three Parts, Then One' },
          description: 'Bring all under one banner.',
          descriptionZh: "混一天下。",
          goal: { kind: 'unify-realm' },
        },
      ],
    },
    {
      id: 'obj-goh-sun',
      forceId: 'sun',
      primary: {
        title: { zh: '小霸王西進', en: 'The Little Conqueror Rides West' },
        description: 'Hold Jianye, Jiangling and Hefei by 212 — Sun Ce never got the chance.',
        descriptionZh: "於212年前兼據建業、江陵、合肥 —— 若不遇許貢門客,孫策本可西向。",
        goal: { kind: 'hold-cities', cityIds: ['jianye', 'jiangling', 'hefei'], byYear: 212 },
      },
    },
    {
      id: 'obj-goh-yuanshao',
      forceId: 'yuan-shao',
      primary: {
        title: { zh: '四世三公', en: 'Four Generations, Three Excellencies' },
        description: 'Control Ji province and take Xuchang by 210.',
        descriptionZh: "於210年前盡有冀州並取許昌 —— 名門之望,當有名門之業。",
        goal: { kind: 'hold-cities', cityIds: ['ye', 'xuchang'], byYear: 210 },
      },
    },
    {
      id: 'obj-goh-dong',
      forceId: 'dong',
      primary: {
        title: { zh: '廢立由我', en: 'I Make and Unmake Emperors' },
        description: "Hold Luoyang and Chang'an by 208.",
        descriptionZh: "於208年前兼據洛陽、長安 —— 兩京在手,廢立由我。",
        goal: { kind: 'hold-cities', cityIds: ['luoyang', 'changan'], byYear: 208 },
      },
    },
    {
      id: 'obj-goh-lubu',
      forceId: 'lubu',
      primary: {
        title: { zh: '人中呂布', en: 'Lü Bu Among Men' },
        description: 'Hold Xiapi, Pengcheng and Luoyang by 212 — a place of your own at last.',
        descriptionZh: "於212年前據下邳、彭城、洛陽 —— 馬中赤兔,人中呂布,終於有了自己的地。",
        goal: { kind: 'hold-cities', cityIds: ['xiapi', 'pengcheng', 'luoyang'], byYear: 212 },
      },
    },
    {
      id: 'obj-goh-yuanshu',
      forceId: 'yuan-shu',
      primary: {
        title: { zh: '受命於天', en: 'Mandated by Heaven' },
        description: 'Declare yourself emperor and hold Shouchun through 210.',
        descriptionZh: "稱帝建號,並至210年仍據壽春。",
        goal: { kind: 'declare-emperor' },
      },
      secondary: [
        {
          title: { zh: '淮南不飢', en: 'Huainan Shall Not Starve' },
          description: 'Still hold Shouchun in 210.',
          descriptionZh: "至210年仍據壽春 —— 史書上你死時只想討一碗蜜水。",
          goal: { kind: 'hold-cities', cityIds: ['shouchun'], byYear: 210 },
        },
      ],
    },
    {
      id: 'obj-goh-liubiao',
      forceId: 'liu-biao',
      primary: {
        title: { zh: '荊州之主', en: 'Lord of Jing' },
        description: "Hold Xiangyang, Jiangling, Jiangxia and Changsha by 210.",
        descriptionZh: "於210年前據襄陽、江陵、江夏、長沙 —— 荊襄之心,九郡是牌匾上的話。",
        goal: { kind: 'hold-cities', cityIds: ['xiangyang', 'jiangling', 'jiangxia', 'changsha'], byYear: 210 },
      },
      secondary: [
        {
          title: { zh: '荊州之主', en: 'Lord of Jing' },
          description: 'Control Jing province by 210.',
          descriptionZh: "於210年前盡有荊州。",
          goal: { kind: 'control-province', provinceId: 'jing', byYear: 210 },
        },
      ],
    },
    {
      id: 'obj-goh-liuyan',
      forceId: 'liu-yan',
      primary: {
        title: { zh: '益州有天子氣', en: 'A Son of Heaven Rises in Yi' },
        description: "Hold Chengdu, Jiangzhou, Mianzhu and Luocheng by 210 — the diviners said Yi has the air of a Son of Heaven, and you believed them.",
        descriptionZh: "於210年前據成都、江州、綿竹、雒城 —— 望氣者言益州有天子氣,你信了。",
        goal: { kind: 'hold-cities', cityIds: ['chengdu', 'jiangzhou', 'mianzhu', 'luocheng'], byYear: 210 },
      },
      secondary: [
        {
          title: { zh: '益州有天子氣', en: 'A Son of Heaven Rises in Yi' },
          description: 'Control Yi province by 210, then declare yourself emperor.',
          descriptionZh: "於210年前盡有益州 —— 望氣者言益州有天子氣,你信了。",
          goal: { kind: 'control-province', provinceId: 'yi', byYear: 210 },
        },
        {
          title: { zh: '乘輿車具', en: 'The Imperial Carriage' },
          description: 'Declare yourself emperor.',
          descriptionZh: "稱帝建號 —— 你早已私造乘輿車具千餘乘。",
          goal: { kind: 'declare-emperor' },
        },
      ],
    },
    {
      id: 'obj-goh-gongsun',
      forceId: 'gongsun',
      primary: {
        title: { zh: '白馬將軍', en: 'The White Horse General' },
        description: "Hold Ji, Beiping, Yuyang and Liucheng by 210 — the frontier is yours; Jieqiao was not the end of it.",
        descriptionZh: "於210年前據薊、北平、漁陽、柳城 —— 邊地是你的;界橋之敗,本非定局。",
        goal: { kind: 'hold-cities', cityIds: ['ji', 'beiping', 'yuyang', 'liucheng'], byYear: 210 },
      },
      secondary: [
        {
          title: { zh: '白馬將軍', en: 'The White Horse General' },
          description: 'Control You province and destroy Yuan Shao.',
          descriptionZh: "盡有幽州並擊滅袁紹 —— 界橋之敗,本非定局。",
          goal: { kind: 'control-province', provinceId: 'you', byYear: 210 },
        },
        {
          title: { zh: '河北易主', en: 'The North Changes Hands' },
          description: 'Destroy the Yuan Shao force.',
          descriptionZh: "擊滅袁紹。",
          goal: { kind: 'defeat-force', forceId: 'yuan-shao' },
        },
      ],
    },
    {
      id: 'obj-goh-mateng',
      forceId: 'ma-teng',
      primary: {
        title: { zh: '西涼入關', en: 'Liang Comes Through the Pass' },
        description: "Take Chang'an by 210.",
        descriptionZh: "於210年前攻取長安 —— 西涼鐵騎,本可東出。",
        goal: { kind: 'hold-cities', cityIds: ['changan'], byYear: 210 },
      },
    },
    {
      id: 'obj-goh-zhanglu',
      forceId: 'zhang-lu',
      primary: {
        title: { zh: '政教合一', en: 'Church and State as One' },
        description: 'Hold Hanzhong and Chengdu by 212.',
        descriptionZh: "於212年前據漢中、成都 —— 以鬼道教民,雄據巴漢三十年。",
        goal: { kind: 'hold-cities', cityIds: ['hanzhong', 'chengdu'], byYear: 212 },
      },
    },
  ],

  // What if Guan Yu had held Jing province
};
