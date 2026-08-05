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
        description: 'Hold all of Liang province by 189 AD — Dong Zhuo lost at Guangzong and kept his troops anyway.',
        descriptionZh: '於189年前盡有涼州之地 —— 廣宗雖敗,兵權未交。',
        goal: { kind: 'control-province', provinceId: 'liang', byYear: 189 },
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
        title: { zh: '獻帝奉迎', en: 'Shelter the Emperor' },
        description: "Hold Luoyang and Xuchang by 197 AD.",
        descriptionZh: "於197年前同時據有洛陽與許昌。",
        goal: { kind: 'hold-cities', cityIds: ['luoyang', 'xuchang'], byYear: 197 },
      },
      secondary: [
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
        description: 'Take Ye by 196 — Gongsun Zan spent his life fighting Yuan Shao for Hebei, not for Xu province.',
        descriptionZh: '於196年前攻取鄴 —— 磐河、東光、界橋,他一生的仗都在河北打,一次也沒去過徐州。',
        goal: { kind: 'hold-cities', cityIds: ['ye'], byYear: 196 },
      },
      secondary: [
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
        descriptionZh: "於199年前盡取冀州 —— 盟主之名,終須有盟主之土。",
        goal: { kind: 'control-province', provinceId: 'ji', byYear: 199 },
      },
      secondary: [
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
        title: { zh: '單騎定荊州', en: 'One Rider, Nine Commanderies' },
        description: 'Control Jing province by 199.',
        descriptionZh: "於199年前盡有荊州 —— 單騎入宜城,竟成一方之主。",
        goal: { kind: 'control-province', provinceId: 'jing', byYear: 199 },
      },
    },
    {
      id: 'obj-190-liuyan',
      forceId: 'liu-yan',
      primary: {
        title: { zh: '益州天府', en: 'The Storehouse of Heaven' },
        description: 'Control Yi province by 200 — shut the passes and wait.',
        descriptionZh: "於200年前盡有益州 —— 閉關守險,坐待天下之變。",
        goal: { kind: 'control-province', provinceId: 'yi', byYear: 200 },
      },
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
        description: 'Take Luoyang by 193 — of all the lords, only Sun Jian actually got there.',
        descriptionZh: '於193年前攻取洛陽 —— 諸侯高會,唯堅獨進,入洛之日掃除宗廟、平塞諸陵。',
        goal: { kind: 'hold-cities', cityIds: ['luoyang'], byYear: 193 },
      },
      secondary: [
        {
          title: { zh: '傳國之璽', en: 'The Seal of State' },
          description: 'Hold Luoyang and Changsha together — the seal came out of a well in the ruins, and he carried it home.',
          descriptionZh: '同時據有洛陽與長沙 —— 玉璽出於城南甄官井中,而他帶著它回了江南。',
          goal: { kind: 'hold-cities', cityIds: ['luoyang', 'changsha'], byYear: 194 },
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
        description: "Hold both capitals — Luoyang and Chang'an — through 195.",
        descriptionZh: '至195年仍兩京俱在手 —— 焚洛陽、遷長安,而洛陽不可棄:棄之則關東長驅。',
        goal: { kind: 'hold-cities', cityIds: ['changan', 'luoyang'], byYear: 195 },
      },
      secondary: [
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
        descriptionZh: '據有武威、金城、安定 —— 讓涼州只認一個號令。',
        goal: { kind: 'hold-cities', cityIds: ['wuwei', 'jincheng', 'anding'], byYear: 196 },
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
        title: { zh: '官渡之戰', en: 'Defeat Yuan Shao at Guandu' },
        description: 'Eliminate the Yuan Shao force.',
        descriptionZh: "消滅袁紹勢力。",
        goal: { kind: 'defeat-force', forceId: 'yuan-shao', byYear: 207 },
      },
    },
    {
      id: 'obj-200-yuan',
      forceId: 'yuan-shao',
      primary: {
        title: { zh: '河北統一', en: 'Conquer Cao Cao' },
        description: 'Eliminate the Cao Cao force.',
        descriptionZh: "消滅曹操勢力。",
        goal: { kind: 'defeat-force', forceId: 'cao', byYear: 207 },
      },
    },
    /* 孫策 — 史實上他在出兵前死於刺客。這一局他還活著,而許都空虛。 */
    {
      id: 'obj-200-sun',
      forceId: 'sun',
      primary: {
        title: { zh: '襲許之機', en: 'The Opening at Xu' },
        description: 'Take Xuchang while the north is locked at Guandu — the raid Sun Ce never lived to make.',
        descriptionZh: '趁兩強相持於官渡、北方空虛之際攻取許昌 —— 孫策沒能活著發動的那一擊。',
        goal: { kind: 'hold-cities', cityIds: ['xuchang'], byYear: 205 },
      },
      secondary: [
        {
          title: { zh: '江東之固', en: 'Jiangdong Secured' },
          description: 'Hold Jianye, Wu and Kuaiji — the base that must not be lost while you march north.',
          descriptionZh: '守住建業、吳郡、會稽 —— 北上時不能丟的根本。',
          goal: { kind: 'hold-cities', cityIds: ['jianye', 'wu', 'kuaiji'], byYear: 205 },
        },
        {
          title: { zh: '不死於刺客', en: 'No Assassin' },
          description: 'Still alive in 205 — he was killed at twenty-six by three retainers of Xu Gong.',
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
        title: { zh: '天下之重', en: 'The Weight of the Realm' },
        description: 'Take Xuchang while the two powers are locked — Liu Xian told him the empire turned on him, and he did nothing.',
        descriptionZh: '趁兩強相持攻取許昌 —— 劉先說「天下之重,在於將軍」,而他沒有動。',
        goal: { kind: 'hold-cities', cityIds: ['xuchang'], byYear: 207 },
      },
      secondary: [
        {
          title: { zh: '保江漢間', en: 'Hold the Han and the River' },
          description: 'Still hold Xiangyang and Jiangling in 208 — the eighteen quiet years.',
          descriptionZh: '208年時仍據有襄陽與江陵 —— 那安靜的十八年。',
          goal: { kind: 'hold-cities', cityIds: ['xiangyang', 'jiangling'], byYear: 208 },
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
        title: { zh: '關中十部', en: 'The Ten of Guanzhong' },
        description: "Take Chang'an and hold it — with the north locked at Guandu, no one is watching the pass.",
        descriptionZh: '攻取並據守長安 —— 兩強鎖在官渡,關中無人看管。',
        goal: { kind: 'hold-cities', cityIds: ['changan'], byYear: 207 },
      },
      secondary: [
        {
          title: { zh: '涼州一統', en: 'One Command in Liang' },
          description: 'Hold Wuwei, Jincheng and Anding — the Liang country under a single seal.',
          descriptionZh: '據有武威、金城、安定 —— 涼州只認一個印。',
          goal: { kind: 'hold-cities', cityIds: ['wuwei', 'jincheng', 'anding'], byYear: 205 },
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
        title: { zh: '南征江東', en: 'Conquer Jiangdong' },
        description: "Take all of Sun Quan's cities before 215.",
        descriptionZh: "於215年前盡取孫權所有城池。",
        goal: { kind: 'defeat-force', forceId: 'sun', byYear: 215 },
      },
    },
    {
      id: 'obj-208-sun-liu',
      forceId: 'sun',
      primary: {
        title: { zh: '赤壁之戰', en: 'Win at Red Cliffs' },
        description: 'Repel Cao Cao\'s force and survive 210 AD.',
        descriptionZh: "擊退曹操大軍,堅守至210年。",
        goal: { kind: 'survive-until', year: 210 },
      },
    },
    {
      id: 'obj-208-liu',
      forceId: 'liu-bei',
      primary: {
        title: { zh: '蜀地確立', en: 'Establish Shu' },
        description: 'Take Chengdu and Hanzhong by 220 AD.',
        descriptionZh: "於220年前同時據有成都與漢中。",
        goal: { kind: 'hold-cities', cityIds: ['chengdu', 'hanzhong'], byYear: 220 },
      },
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
        title: { zh: '漢寧之治', en: 'The Rule of Hanning' },
        description: 'Still hold Hanzhong in 216 — Cao Cao came through Sanguan in 215 and he sealed the storehouses and left.',
        descriptionZh: '撐到216年仍據有漢中 —— 史實上215年曹操自散關入,他封藏府庫而去。',
        goal: { kind: 'hold-cities', cityIds: ['hanzhong'], byYear: 216 },
      },
      secondary: [
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
        title: { zh: '魏之天下統一', en: 'Wei Unifies the Realm' },
        description: 'Unify all cities under Wei.',
        descriptionZh: "於魏旗之下統一天下諸城。",
        goal: { kind: 'unify-realm' },
      },
    },
    {
      id: 'obj-220-liu',
      forceId: 'liu-bei',
      primary: {
        title: { zh: '漢室再興', en: 'Restore the Han' },
        description: 'Hold Luoyang and Chang\'an at the same time.',
        descriptionZh: "同時據有洛陽與長安。",
        goal: { kind: 'hold-cities', cityIds: ['luoyang', 'changan'] },
      },
    },
    {
      id: 'obj-220-sun',
      forceId: 'sun',
      primary: {
        title: { zh: '呉皇帝即位', en: 'Sun Quan as Emperor' },
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
        title: { zh: '北伐成就', en: 'Complete the Northern Campaign' },
        description: 'Take Chang\'an before Zhuge Liang dies (236 AD).',
        descriptionZh: "於諸葛亮歸天(236年)前攻取長安。",
        goal: { kind: 'hold-cities', cityIds: ['changan'], byYear: 236 },
      },
    },
    {
      id: 'obj-234-wei',
      forceId: 'cao',
      primary: {
        title: { zh: '蜀漢殲滅', en: 'Crush Shu' },
        description: 'Eliminate the Liu Bei force.',
        descriptionZh: "於245年前消滅劉備勢力。",
        goal: { kind: 'defeat-force', forceId: 'liu-bei', byYear: 245 },
      },
    },
  ],

  // 215 — Battle of Hefei
  'scn-215-hefei': [
    {
      id: 'obj-215-sun',
      forceId: 'sun',
      primary: {
        title: { zh: '攻取合肥', en: 'Take Hefei' },
        description: 'Seize Hefei by 217 — pry open the road north.',
        descriptionZh: "於217年前攻取合肥,打開北進之門。",
        goal: { kind: 'hold-cities', cityIds: ['hefei'], byYear: 217 },
      },
      secondary: [
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
        title: { zh: '為關羽復仇', en: 'Avenge Guan Yu' },
        description: 'Retake Jiangling from Wu by 225 — wash away the shame of Guan Yu.',
        descriptionZh: "於225年前自東吳手中奪回江陵,以雪雲長之恨。",
        goal: { kind: 'hold-cities', cityIds: ['jiangling'], byYear: 225 },
      },
      secondary: [
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
        title: { zh: '火燒連營', en: 'Burn the Camps' },
        description: 'Break Liu Bei — defeat the Shu invasion.',
        descriptionZh: "以陸遜之火,擊潰劉備伐吳之師。",
        goal: { kind: 'defeat-force', forceId: 'liu-bei' },
      },
      secondary: [
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
        description: 'Control You province by 199, then break Yuan Shao.',
        descriptionZh: "於199年前盡有幽州,再圖河北。",
        goal: { kind: 'control-province', provinceId: 'you', byYear: 199 },
      },
      secondary: [
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
        description: 'Control Liang province by 202.',
        descriptionZh: "於202年前盡有涼州,鐵騎出隴。",
        goal: { kind: 'control-province', provinceId: 'liang', byYear: 202 },
      },
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
        title: { zh: '全有揚州', en: 'All of Yang' },
        description: 'Control Yang province by 204.',
        descriptionZh: "於204年前盡有揚州。",
        goal: { kind: 'control-province', provinceId: 'yang', byYear: 204 },
      },
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
        title: { zh: '據江東以觀天下', en: 'Watch the Realm from Jiangdong' },
        description: 'Control Yang province by 204.',
        descriptionZh: "於204年前盡有揚州,坐觀中原之變。",
        goal: { kind: 'control-province', provinceId: 'yang', byYear: 204 },
      },
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
        title: { zh: '江東基業', en: 'The Jiangdong Inheritance' },
        description: 'Control Yang province by 205.',
        descriptionZh: "於205年前盡有揚州,守父兄之業。",
        goal: { kind: 'control-province', provinceId: 'yang', byYear: 205 },
      },
    },
    {
      id: 'obj-199-liubiao',
      forceId: 'liu-biao',
      primary: {
        title: { zh: '荊襄九郡', en: 'The Nine Commanderies of Jing' },
        description: 'Control Jing province by 206.',
        descriptionZh: "於206年前盡有荊州九郡。",
        goal: { kind: 'control-province', provinceId: 'jing', byYear: 206 },
      },
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
        description: 'Control Jiao province by 210.',
        descriptionZh: "於210年前盡有交州 —— 嶺南一隅,亦可自王。",
        goal: { kind: 'control-province', provinceId: 'jiao', byYear: 210 },
      },
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
        title: { zh: '守此蜀土', en: 'Keep the Shu Basin' },
        description: 'Control Yi province by 214 — and never invite a guest with an army.',
        descriptionZh: "於214年前盡有益州 —— 並且,永遠不要迎一個帶兵的客人入蜀。",
        goal: { kind: 'control-province', provinceId: 'yi', byYear: 214 },
      },
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
        description: 'Control Liang province by 213 — in history you accepted a court post and died for it.',
        descriptionZh: "於213年前盡有涼州 —— 史書上,你應召入朝,闔門遇害。",
        goal: { kind: 'control-province', provinceId: 'liang', byYear: 213 },
      },
    },
    {
      id: 'obj-207tv-shixie',
      forceId: 'shi-xie',
      primary: {
        title: { zh: '交趾世家', en: 'The House of Jiaozhi' },
        description: 'Control Jiao province by 212.',
        descriptionZh: "於212年前盡有交州。",
        goal: { kind: 'control-province', provinceId: 'jiao', byYear: 212 },
      },
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
        title: { zh: '益州自守', en: 'Hold Yi Alone' },
        description: 'Control Yi province by 214.',
        descriptionZh: "於214年前盡有益州。",
        goal: { kind: 'control-province', provinceId: 'yi', byYear: 214 },
      },
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
        title: { zh: '奪取長安', en: "Take Chang'an" },
        description: "Take Chang'an by 215 — avenge your father.",
        descriptionZh: "於215年前攻取長安 —— 父兄之讎,不共戴天。",
        goal: { kind: 'hold-cities', cityIds: ['changan'], byYear: 215 },
      },
      secondary: [
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
        title: { zh: '西州自立', en: 'A Realm of My Own in the West' },
        description: 'Control Liang province by 217 — thirty years in Guanzhong, always someone else\'s ally.',
        descriptionZh: "於217年前盡有涼州 —— 縱橫關中三十年,總是別人的盟友。",
        goal: { kind: 'control-province', provinceId: 'liang', byYear: 217 },
      },
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
        title: { zh: '驅逐客兵', en: 'Drive Out the Guest Army' },
        description: 'Destroy the Liu Bei force by 218.',
        descriptionZh: "於218年前擊滅劉備 —— 引之入蜀者我,逐之出蜀者亦當是我。",
        goal: { kind: 'defeat-force', forceId: 'liu-bei', byYear: 218 },
      },
      secondary: [
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
        title: { zh: '索還荊州', en: 'Demand Jing Back' },
        description: 'Take Jiangling by 219.',
        descriptionZh: "於219年前取回江陵 —— 借出去的荊州,總要討回來。",
        goal: { kind: 'hold-cities', cityIds: ['jiangling'], byYear: 219 },
      },
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
        title: { zh: '入主西川', en: 'Master of Xichuan' },
        description: 'Control Yi province by 218.',
        descriptionZh: "於218年前盡有益州 —— 隆中對之半,今日始成。",
        goal: { kind: 'control-province', provinceId: 'yi', byYear: 218 },
      },
      secondary: [
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
        title: { zh: '得隴望蜀', en: 'Having Long, Covet Shu' },
        description: 'Take Hanzhong by 217, then Chengdu.',
        descriptionZh: "於217年前取漢中,再下成都 —— 人苦無足,既得隴,復望蜀。",
        goal: { kind: 'hold-cities', cityIds: ['hanzhong', 'chengdu'], byYear: 220 },
      },
    },
    {
      id: 'obj-214-sun',
      forceId: 'sun',
      primary: {
        title: { zh: '湘水劃界', en: 'The Xiang River Line' },
        description: 'Take Jiangling by 220.',
        descriptionZh: "於220年前取江陵 —— 湘水之盟只是暫緩,荊州終須一決。",
        goal: { kind: 'hold-cities', cityIds: ['jiangling'], byYear: 220 },
      },
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
        title: { zh: '還於舊都', en: 'Return to the Old Capital' },
        description: "Take Chang'an and Luoyang by 240 — the Han restored is the whole point.",
        descriptionZh: "於240年前克復長安、洛陽 —— 漢賊不兩立,王業不偏安。",
        goal: { kind: 'hold-cities', cityIds: ['changan', 'luoyang'], byYear: 240 },
      },
      secondary: [
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
        title: { zh: '受禪定鼎', en: 'The Mandate Received' },
        description: 'Bring all under Wei.',
        descriptionZh: "混一天下 —— 受漢之禪,便當有一統之實。",
        goal: { kind: 'unify-realm' },
      },
      secondary: [
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
        title: { zh: '北上成都', en: 'North to Chengdu' },
        description: 'Take Chengdu by 232 — refuse to be pacified.',
        descriptionZh: "於232年前攻取成都 —— 不服王化,便打到成都去。",
        goal: { kind: 'hold-cities', cityIds: ['chengdu'], byYear: 232 },
      },
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
        title: { zh: '街亭不失', en: 'Jieting Must Hold' },
        description: 'Hold Jieting and Tianshui by 233 — do not camp on the hill.',
        descriptionZh: "於233年前據街亭、天水 —— 當道下寨,勿屯南山。",
        goal: { kind: 'hold-cities', cityIds: ['jieting', 'tianshui'], byYear: 233 },
      },
      secondary: [
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
        title: { zh: '詐降誘敵', en: 'The False Defection' },
        description: 'Take Hefei and Shouchun by 236 — Zhou Fang cut his hair to sell the lie.',
        descriptionZh: "於236年前取合肥、壽春 —— 周魴斷髮賺曹休。",
        goal: { kind: 'hold-cities', cityIds: ['hefei', 'shouchun'], byYear: 236 },
      },
      secondary: [
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
        goal: { kind: 'hold-cities', cityIds: ['hefei', 'shouchun'], byYear: 236 },
      },
    },
    {
      id: 'obj-228st-shu',
      forceId: 'liu-bei',
      primary: {
        title: { zh: '再出祁山', en: 'Out from Qishan Again' },
        description: "Take Chang'an by 240.",
        descriptionZh: "於240年前克復長安。",
        goal: { kind: 'hold-cities', cityIds: ['changan'], byYear: 240 },
      },
    },
  ],

  // 229 — Three emperors
  'scn-229-three-emperors': [
    {
      id: 'obj-229-wei',
      forceId: 'cao',
      primary: {
        title: { zh: '中原正統', en: 'The Legitimate Centre' },
        description: 'Bring all under Wei.',
        descriptionZh: "混一天下 —— 據中原十州之富,本當如此。",
        goal: { kind: 'unify-realm' },
      },
      secondary: [
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
        title: { zh: '漢賊不兩立', en: 'Han and Traitor Cannot Both Stand' },
        description: "Take Chang'an and Luoyang by 245.",
        descriptionZh: "於245年前克復長安、洛陽。",
        goal: { kind: 'hold-cities', cityIds: ['changan', 'luoyang'], byYear: 245 },
      },
      secondary: [
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
        title: { zh: '全據長江', en: 'The Whole River' },
        description: 'Hold Jiangling, Xiangyang and Hefei by 245.',
        descriptionZh: "於245年前兼據江陵、襄陽、合肥 —— 長江之險,與人共之則不險。",
        goal: { kind: 'hold-cities', cityIds: ['jiangling', 'xiangyang', 'hefei'], byYear: 245 },
      },
    },
    {
      id: 'obj-229-gongsun',
      forceId: 'gongsun',
      primary: {
        title: { zh: '燕王之號', en: 'King of Yan' },
        description: 'Declare yourself emperor — Liaodong has been its own country for forty years.',
        descriptionZh: "稱帝建號 —— 遼東割據四十年,何必為人臣?",
        goal: { kind: 'declare-emperor' },
      },
      secondary: [
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
        title: { zh: '甲首三千', en: 'Three Thousand Helmets' },
        description: "Take Tianshui and Chang'an by 240 — the one field battle Sima Yi lost outright.",
        descriptionZh: "於240年前取天水、長安 —— 鹵城一戰,獲甲首三千,司馬懿自此斂兵。",
        goal: { kind: 'hold-cities', cityIds: ['tianshui', 'changan'], byYear: 240 },
      },
      secondary: [
        {
          title: { zh: '糧不誤期', en: 'The Grain Must Not Be Late' },
          description: 'Hold Hanzhong through 240 — Li Yan\'s late supply ended this campaign.',
          descriptionZh: "至240年仍固守漢中 —— 上一次退兵,是因為李嚴的糧沒到。",
          goal: { kind: 'hold-cities', cityIds: ['hanzhong'], byYear: 240 },
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
        title: { zh: '燕祚不絕', en: 'Yan Endures' },
        description: 'Still hold Xiangping and Liaodong in 245 — history gives you until 238.',
        descriptionZh: "至245年仍據襄平、遼東 —— 史書只給了你到238年秋。",
        goal: { kind: 'hold-cities', cityIds: ['xiangping', 'liaodong'], byYear: 245 },
      },
      secondary: [
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
        title: { zh: '乘隙北伐', en: 'March While Wei Looks Northeast' },
        description: "Take Chang'an by 248.",
        descriptionZh: "於248年前克復長安 —— 魏之大軍在遼東。",
        goal: { kind: 'hold-cities', cityIds: ['changan'], byYear: 248 },
      },
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
        title: { zh: '曹爽伐蜀', en: "Cao Shuang's Invasion" },
        description: 'Take Hanzhong by 249 — you need a victory to hold the court.',
        descriptionZh: "於249年前攻取漢中 —— 你需要一場勝仗來坐穩朝堂。",
        goal: { kind: 'hold-cities', cityIds: ['hanzhong'], byYear: 249 },
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
        title: { zh: '閉城奪權', en: 'Shut the Gates, Take the Court' },
        description: 'Destroy the Cao Shuang force by 253 — ten years of feigned illness, one morning to act.',
        descriptionZh: "於253年前翦滅曹爽 —— 詐病十年,發於一朝。",
        goal: { kind: 'defeat-force', forceId: 'cao', byYear: 253 },
      },
      secondary: [
        {
          title: { zh: '洛陽在握', en: 'Hold Luoyang' },
          description: 'Still hold Luoyang in 255.',
          descriptionZh: "至255年仍據洛陽 —— 據武庫,屯洛水浮橋。",
          goal: { kind: 'hold-cities', cityIds: ['luoyang'], byYear: 255 },
        },
      ],
    },
    {
      id: 'obj-249-caoshuang',
      forceId: 'cao',
      primary: {
        title: { zh: '挾帝幸許', en: 'Take the Emperor to Xuchang' },
        description: 'Destroy the Sima faction by 253 — Huan Fan begged you to fight; you went home instead.',
        descriptionZh: "於253年前翦滅司馬氏 —— 桓範勸你挾天子走許昌,你選擇了回家做富家翁。",
        goal: { kind: 'defeat-force', forceId: 'sima', byYear: 253 },
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
        title: { zh: '姜維北伐', en: "Jiang Wei's Northern Campaigns" },
        description: "Take Tianshui and Chang'an by 262.",
        descriptionZh: "於262年前取天水、長安 —— 魏室內亂,正可乘之。",
        goal: { kind: 'hold-cities', cityIds: ['tianshui', 'changan'], byYear: 262 },
      },
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
        title: { zh: '出狄道', en: 'Out by Didao' },
        description: "Take Tianshui and Chang'an by 262.",
        descriptionZh: "於262年前取天水、長安。",
        goal: { kind: 'hold-cities', cityIds: ['tianshui', 'changan'], byYear: 262 },
      },
    },
  ],

  // 253 — The siege of Hefei New City
  'scn-253-hefei': [
    {
      id: 'obj-253-wu',
      forceId: 'sun',
      primary: {
        title: { zh: '拔新城', en: 'Storm the New City' },
        description: 'Take Hefei by 258 — two hundred thousand men, three months, one small wall.',
        descriptionZh: "於258年前攻下合肥新城 —— 二十萬眾,圍三月,終不能拔。",
        goal: { kind: 'hold-cities', cityIds: ['hefei'], byYear: 258 },
      },
      secondary: [
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
        title: { zh: '與吳並舉', en: 'March With Wu' },
        description: "Take Tianshui and Chang'an by 262.",
        descriptionZh: "於262年前取天水、長安 —— 東西並舉,魏不能兩顧。",
        goal: { kind: 'hold-cities', cityIds: ['tianshui', 'changan'], byYear: 262 },
      },
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
        title: { zh: '清君側', en: 'Purge the Emperor\'s Side' },
        description: 'Take Luoyang by 259 — the proclamation named eleven crimes of Sima Shi.',
        descriptionZh: "於259年前攻取洛陽 —— 傳檄州郡,數司馬師十一罪。",
        goal: { kind: 'hold-cities', cityIds: ['luoyang'], byYear: 259 },
      },
      secondary: [
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
        title: { zh: '洮西大捷', en: 'The Victory West of Tao' },
        description: "Take Tianshui and Chang'an by 264.",
        descriptionZh: "於264年前取天水、長安 —— 洮西一戰,魏人死者數萬。",
        goal: { kind: 'hold-cities', cityIds: ['tianshui', 'changan'], byYear: 264 },
      },
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
        title: { zh: '出駱谷', en: 'Out by the Luo Valley' },
        description: "Take Chang'an by 266.",
        descriptionZh: "於266年前克復長安 —— 魏之主力在淮南。",
        goal: { kind: 'hold-cities', cityIds: ['changan'], byYear: 266 },
      },
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
        title: { zh: '救蜀', en: 'Save Shu' },
        description: 'Hold Yongan by 267 — Shu falling leaves you alone against the north.',
        descriptionZh: "於267年前據永安 —— 唇亡則齒寒,蜀亡則吳孤。",
        goal: { kind: 'hold-cities', cityIds: ['yongan'], byYear: 267 },
      },
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
        title: { zh: '功高見疑', en: 'Too Much Merit' },
        description: 'Destroy the Zhong Hui force — he wrote the letters that had you arrested.',
        descriptionZh: "擊滅鍾會 —— 檻車囚你的那封表,是他偽作的。",
        goal: { kind: 'defeat-force', forceId: 'zhonghui' },
      },
      secondary: [
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
        title: { zh: '西取巴蜀', en: 'West into Ba-Shu' },
        description: 'Take Yongan and Chengdu by 270 — Shu is in chaos and its gates are open.',
        descriptionZh: "於270年前取永安、成都 —— 蜀方大亂,此千載之機。",
        goal: { kind: 'hold-cities', cityIds: ['yongan', 'chengdu'], byYear: 270 },
      },
    },
  ],

  // 265 — Sima Yan takes the throne
  'scn-265-jin-founded': [
    {
      id: 'obj-265-jin',
      forceId: 'sima',
      primary: {
        title: { zh: '混一宇內', en: 'One Realm Under Jin' },
        description: 'Bring all under Jin — sixty years of division end here.',
        descriptionZh: "混一天下 —— 六十年分裂,當終於此。",
        goal: { kind: 'unify-realm' },
      },
      secondary: [
        {
          title: { zh: '樓船下益州', en: 'The Tower Ships Sail' },
          description: 'Destroy the Wu force by 285.',
          descriptionZh: "於285年前滅吳 —— 王濬樓船下益州,金陵王氣黯然收。",
          goal: { kind: 'defeat-force', forceId: 'sun', byYear: 285 },
        },
      ],
    },
    {
      id: 'obj-265-wu',
      forceId: 'sun',
      primary: {
        title: { zh: '江東不亡', en: 'Wu Shall Not Fall' },
        description: 'Survive to 290 — history gives you until 280.',
        descriptionZh: "存續至290年 —— 史書只給了你到280年。",
        goal: { kind: 'survive-until', year: 290 },
      },
      secondary: [
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
        description: 'Control Jing province by 210.',
        descriptionZh: "於210年前盡有荊州。",
        goal: { kind: 'control-province', provinceId: 'jing', byYear: 210 },
      },
    },
    {
      id: 'obj-goh-liuyan',
      forceId: 'liu-yan',
      primary: {
        title: { zh: '益州有天子氣', en: 'A Son of Heaven Rises in Yi' },
        description: 'Control Yi province by 210, then declare yourself emperor.',
        descriptionZh: "於210年前盡有益州 —— 望氣者言益州有天子氣,你信了。",
        goal: { kind: 'control-province', provinceId: 'yi', byYear: 210 },
      },
      secondary: [
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
        description: 'Control You province and destroy Yuan Shao.',
        descriptionZh: "盡有幽州並擊滅袁紹 —— 界橋之敗,本非定局。",
        goal: { kind: 'control-province', provinceId: 'you', byYear: 210 },
      },
      secondary: [
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
