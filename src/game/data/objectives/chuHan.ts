import type { ScenarioObjective } from '../../types';

/** 劇本目標 · 楚漢盤 —— 純資料,唯一入口仍是 data/objectives.ts。 */
export const OBJ_CHUHAN: Record<string, ScenarioObjective[]> = {
  'scn-ch-daze': [
    {
      id: 'obj-chdz-zhangchu',
      forceId: 'zhangchu',
      primary: {
        title: { zh: '王侯將相寧有種乎', en: 'Are Kings and Nobles Born to It?' },
        description: 'Take Luoyang by 182 — six hundred conscripts late for a garrison, and the law says death either way.',
        descriptionZh: "於182年前攻取洛陽 —— 失期當斬,舉大計亦死,等死,死國可乎?",
        goal: { kind: 'hold-cities', cityIds: ['luoyang'], byYear: 182 },
      },
      secondary: [
        {
          title: { zh: '入關滅秦', en: 'Through the Pass, End Qin' },
          description: "Take Chang'an by 184 — the first rising rarely gets there.",
          descriptionZh: "於184年前攻取長安 —— 首義者多半到不了咸陽。",
          goal: { kind: 'hold-cities', cityIds: ['changan'], byYear: 184 },
        },
      ],
    },
    {
      id: 'obj-chdz-qin',
      forceId: 'qin',
      primary: {
        title: { zh: '關東群盜', en: '"Merely Bandits, Your Majesty"' },
        description: 'Still hold Hangu Pass and Luoyang in 181 — the court insisted there was no rebellion at all.',
        descriptionZh: "至181年仍據函谷關與洛陽 —— 朝廷上下都說那不過是群盜,不足憂。",
        goal: { kind: 'hold-cities', cityIds: ['hanguguan', 'luoyang'], byYear: 181 },
      },
      /*
       * 這條換過三次 goal,而**三次都是同一個誤判**:以為秦的難處是平不平得掉
       * 亂民。實測六輪:秦開局 115 城,五年後中位 **62** 城,而張楚從四城長到
       * **七城** —— 秦不是在剿匪,是在崩。
       *
       * 於是題目改成守關:函谷關 +3 年 5/6、洛陽 4/6(+5 年掉到 2/6 和 4/6,
       * 所以期限收在 181 而不是 183)。關中本部反而穩得很(長安/郿/陳倉/上邽
       * 五年後全是 6/6),拿來當題目太便宜;**函谷關才是關東與關中的分界**,
       * 也正是這張盤的題眼。
       *
       * ⚠ 先前 break-force 的門檻訂過三次,錯的方向相反,記在這裡免得重蹈:
       *   一訂三城 —— 用跑十年的探針量的,而期限只有 +5 年。
       *   二訂五城 —— 照 break-floor「最少值的上緣」訂的,而**張楚開局就只有
       *     四城**:門檻高過開局城數 = 第 0 旬就成立,整條變擺設。
       * 判準:break-force 的門檻有**兩道**邊界 —— 下緣是期限內量得到的最少值,
       * 上緣是**對方開局城數減一**;交不到就別用這型。break-floor 現在兩道都報。
       */
      secondary: [
        {
          title: { zh: '關東群盜', en: 'Bandits of the East' },
          description: 'Destroy the Zhangchu force by 186.',
          descriptionZh: "於186年前平定張楚 —— 一個也不留。",
          goal: { kind: 'defeat-force', forceId: 'zhangchu', byYear: 186 },
        },
        {
          title: { zh: '二世而不亡', en: 'Not Dead in the Second Generation' },
          description: 'Survive to 186 — the empire that was to last ten thousand generations.',
          descriptionZh: "存續至186年 —— 那個號稱傳之萬世的帝國。",
          goal: { kind: 'survive-until', year: 186 },
        },
      ],
    },
    {
      id: 'obj-chdz-chu',
      forceId: 'chu',
      primary: {
        title: { zh: '江東子弟八千人', en: 'Eight Thousand Sons of Jiangdong' },
        description: "Still hold Kuaiji and Wu in 181 — Xiang Liang killed the governor in his own hall and raised eight thousand; Pengcheng came later.",
        descriptionZh: "至181年仍據會稽、吳 —— 梁乃召故所知豪吏,籍遂拔劍斬守頭。得精兵八千人。彭城是後來的事,先要有這八千人。",
        /*
         * 原本是「於183年前取彭城」,而彭城對江東的項氏是 **0.00**(不相鄰,
         * 中間隔著廣陵、下邳)。史書上的順序是:前 209 會稽起兵、渡江北上、
         * 前 208 立懷王於盱眙才都彭城。主目標寫起兵那一步,取彭城降為次要。
         */
        goal: { kind: 'hold-cities', cityIds: ['kuaiji', 'wu'], byYear: 181 },
      },
      secondary: [
        {
          title: { zh: '楚雖三戶', en: 'Though Chu Has But Three Households' },
          description: "Take Pengcheng and Chang'an by 184 — Xiang Liang raises the old Chu banner in Kuaiji.",
          descriptionZh: "於184年前取彭城、長安 —— 項梁起於會稽,立楚後以從民望。",
          goal: { kind: 'hold-cities', cityIds: ['pengcheng', 'changan'], byYear: 184 },
        },
      ],
    },
    {
      id: 'obj-chdz-qi',
      forceId: 'qi',
      primary: {
        title: { zh: '田氏復齊', en: 'The Tian Clan Restores Qi' },
        description: 'Hold Linzi, Beihai and Langya by 183, then take Pengcheng.',
        descriptionZh: "於183年前據臨淄、北海、琅琊 —— 田氏自立,齊地復國。",
        goal: { kind: 'hold-cities', cityIds: ['linzi', 'beihai', 'langya'], byYear: 183 },
      },
    },
  ],

  // The battle of Julu
  'scn-ch-julu': [
    {
      id: 'obj-chjl-chu',
      forceId: 'chu',
      primary: {
        title: { zh: '破釜沉舟', en: 'Break the Cauldrons' },
        description: 'Zhao must still hold six cities in 182 — sink the boats, smash the pots, carry three days of rations, and get there before the pocket dies.',
        /*
         * 原本是「取洛陽、長安」,而**長安對楚是 0.00(完全不相鄰)**,
         * 洛陽 0.11 —— 兩座都在六十五城的秦手裡,三年之內誰也拿不到。
         * 鉅鹿之戰本來就不是取城之戰,是**救趙**:趙王被圍於鉅鹿,
         * 十餘壁諸侯莫敢縱兵,而項羽渡河擊之。主目標就寫那件事。
         * 入關中是後面的事,降為次要。
         */
        descriptionZh: "至182年趙猶有六城 —— 沉船破釜,持三日糧,以示士卒必死;而鉅鹿之圍,十餘壁諸侯莫敢縱兵。",
        goal: { kind: 'protect-force', forceId: 'zhao', minCities: 6, byYear: 182 },
      },
      secondary: [
        {
          title: { zh: '先入關中', en: 'First Through the Passes' },
          description: 'Take Luoyang by 186 — the road Julu opened runs west.',
          descriptionZh: "於186年前取洛陽 —— 鉅鹿那一戰打開的路,通向西邊。",
          goal: { kind: 'hold-cities', cityIds: ['luoyang'], byYear: 186 },
        },
        {
          title: { zh: '諸侯膝行', en: 'The Lords Came in on Their Knees' },
          description: 'Destroy the Qin force by 186.',
          descriptionZh: "於186年前滅秦 —— 召見諸侯將,無不膝行而前,莫敢仰視。",
          goal: { kind: 'defeat-force', forceId: 'qin', byYear: 186 },
        },
      ],
    },
    {
      id: 'obj-chjl-qin',
      forceId: 'qin',
      primary: {
        title: { zh: '關中未失', en: 'Guanzhong Still Stands' },
        description: "Still hold Chang'an, Tongguan and Hanguguan in 182 — Zhang Han surrendered at Yin Ruins; before that, the passes held.",
        descriptionZh: "至182年仍據長安、潼關、函谷關 —— 章邯降於殷墟是後來的事;在那之前,關是關得住的。",
        goal: { kind: 'hold-cities', cityIds: ['changan', 'tongguan', 'hanguguan'], byYear: 182 },
      },
      secondary: [
        {
          title: { zh: '章邯不降', en: 'Zhang Han Does Not Surrender' },
          description: "Still hold Chang'an and Luoyang in 186 — the last army Qin had, and a court that would not back it.",
          descriptionZh: "至186年仍保長安、洛陽 —— 秦最後一支軍隊,和一個不肯支持它的朝廷。",
          goal: { kind: 'hold-cities', cityIds: ['changan', 'luoyang'], byYear: 186 },
        },
        {
          title: { zh: '先破鉅鹿', en: 'Take Julu First' },
          description: 'Take Ye by 182.',
          descriptionZh: "於182年前攻下鉅鹿(鄴)。",
          goal: { kind: 'hold-cities', cityIds: ['ye'], byYear: 182 },
        },
      ],
    },
    {
      id: 'obj-chjl-zhao',
      forceId: 'zhao',
      primary: {
        title: { zh: '鉅鹿之圍', en: 'Under Siege at Julu' },
        description: 'Still hold Ye in 183 — ten allied armies watched from behind their walls.',
        descriptionZh: "至183年仍守鉅鹿(鄴) —— 諸侯軍十餘壁,無一人敢縱兵。",
        goal: { kind: 'hold-cities', cityIds: ['ye'], byYear: 183 },
      },
    },
    {
      id: 'obj-chjl-wei',
      forceId: 'wei',
      primary: {
        title: { zh: '魏地復國', en: 'Wei Restored' },
        description: "Hold Puyang and take Guandu by 184 — Wei Bao got his ancestors' land back; Luoyang was never part of it.",
        descriptionZh: "於184年前據濮陽並取官渡 —— 魏豹復得魏地;洛陽從來不在其中。",
        goal: { kind: 'hold-cities', cityIds: ['puyang', 'guandu'], byYear: 184 },
      },
      /*
       * 魏開局**只有一座城**(濮陽),而題目要他去取陳留 —— 實測六輪裡
       * 陳留到第六年才有 1/6,期限之內是 0/6。他真正搆得著的是官渡(+3 年 2/6)。
       * 濮陽本身守得住(+6 年 5/6),所以「守本 + 取一座搆得著的」才成立。
       * 判準跟壓力值那一課同型:**一城小國的擴張目標要挑鄰城裡實測非零的那一座**。
       */
      secondary: [
        {
          title: { zh: '魏地復國', en: 'Wei Restored' },
          description: 'Hold Puyang and take Luoyang by 185.',
          descriptionZh: "於185年前守濮陽並取洛陽 —— 魏豹得一城而稱王,總要再取一城。",
          goal: { kind: 'hold-cities', cityIds: ['puyang', 'luoyang'], byYear: 185 },
        },
      ],
    },
    {
      id: 'obj-chjl-qi',
      forceId: 'qi',
      primary: {
        title: { zh: '齊不救趙', en: 'Qi Does Not Ride to Julu' },
        description: 'Still hold Linzi and Beihai in 180 — Qi sat out the decisive battle of the age.',
        descriptionZh: "至180年仍據臨淄、北海 —— 這個時代的決戰,齊沒有參加。",
        goal: { kind: 'hold-cities', cityIds: ['linzi', 'beihai'], byYear: 180 },
      },
      /*
       * 琅琊是這三座裡守不住的那一座(+1 年就只剩 2/6),而臨淄、北海
       * +2 年還有 5~6/6、+5 年掉到 3/6。拿掉琅琊、窗口從 +5 年收到 +2 年。
       * 文案也從「於…前據」改成「至…仍據」:三座開局都是齊的,這是守成不是取得。
       */
    },
  ],

  // Chu and Han contend
  'scn-ch-chuhan': [
    {
      id: 'obj-chch-han',
      forceId: 'han',
      primary: {
        title: { zh: '還定三秦', en: 'Take Back the Three Qin' },
        description: "Take Chang'an by 183, then Pengcheng — burn the plank roads, then walk out by Chencang.",
        descriptionZh: "於183年前攻取長安 —— 明修棧道,暗度陳倉。",
        goal: { kind: 'hold-cities', cityIds: ['changan'], byYear: 183 },
      },
      secondary: [
        {
          title: { zh: '垓下之圍', en: 'The Ring at Gaixia' },
          description: 'Destroy the Chu force by 188.',
          descriptionZh: "於188年前擊滅西楚 —— 四面楚歌,十面埋伏。",
          goal: { kind: 'defeat-force', forceId: 'chu', byYear: 188 },
        },
      ],
    },
    {
      id: 'obj-chch-chu',
      forceId: 'chu',
      primary: {
        title: { zh: '西楚霸王', en: 'Hegemon-King of Western Chu' },
        description: "Still hold Pengcheng, Xuchang, Chenliu and Wancheng in 186 — nine commanderies of Western Chu, and eighteen kings enfeoffed by your word.",
        descriptionZh: "至186年仍據彭城、許昌、陳留、宛城 —— 西楚九郡,十八諸侯出於你一言。",
        goal: { kind: 'hold-cities', cityIds: ['pengcheng', 'xuchang', 'chenliu', 'wancheng'], byYear: 186 },
      },
      secondary: [
        {
          title: { zh: '力拔山兮', en: 'My Strength Uprooted Mountains' },
          description: 'Destroy the Han force by 187 — you win every battle; that has never been the problem.',
          descriptionZh: "於187年前擊滅漢 —— 你每戰必勝,問題從來不在戰場上。",
          goal: { kind: 'defeat-force', forceId: 'han', byYear: 187 },
        },
        {
          title: { zh: '守成皋滎陽', en: 'Hold the Chenggao Line' },
          description: 'Still hold Guandu and Hulao in 186.',
          descriptionZh: "至186年仍守滎陽、成皋(官渡、虎牢) —— 楚漢相持之地。",
          goal: { kind: 'hold-cities', cityIds: ['guandu', 'hulao'], byYear: 186 },
        },
      ],
    },
    {
      id: 'obj-chch-yong',
      forceId: 'yong',
      primary: {
        title: { zh: '廢丘死守', en: 'Feiqiu Holds' },
        description: "Still hold Chang'an in 183 — the other two of the Three Qin folded in weeks; you held out ten months.",
        descriptionZh: "至183年仍據長安 —— 三秦另外兩家數週而降,你守了十個月。",
        goal: { kind: 'hold-cities', cityIds: ['changan'], byYear: 183 },
      },
      secondary: [
        {
          title: { zh: '三秦拒漢', en: 'The Three Qin Hold the Passes' },
          description: "Still hold Chang'an and Chencang in 184 — you were Qin's last general; hold what Xiang Yu gave you.",
          descriptionZh: "至184年仍保長安、陳倉 —— 你是秦最後的大將,守住項羽分給你的地方。",
          goal: { kind: 'hold-cities', cityIds: ['changan', 'chencang'], byYear: 184 },
        },
      ],
    },
    {
      id: 'obj-chch-qi',
      forceId: 'qi',
      primary: {
        title: { zh: '齊地自立', en: 'Qi Stands Alone' },
        description: 'Still hold Linzi and Beihai in 181 — Tian Rong refused Xiang Yu\'s partition and paid for it.',
        descriptionZh: "至181年仍據臨淄、北海 —— 田榮不受項羽之封,遂反。",
        goal: { kind: 'hold-cities', cityIds: ['linzi', 'beihai'], byYear: 181 },
      },
      /*
       * 窗口從 184(開局 +6 年)收到 181(+3 年)。實測 +3 年臨淄 5/6、北海 5/6,
       * 而 +6 年北海掉到 3/6 —— 差別全在後面那三年。
       * 田榮 205 BC 就死於平原,問他撐六年本來就過長。
       *
       * 文案也一併從「於…前據」改成「至…仍據」:兩座城開局都是齊的,
       * 這是守成不是取得,原本的寫法會讓玩家以為要去打。
       */
    },
    {
      id: 'obj-chch-zhao',
      forceId: 'zhao',
      primary: {
        title: { zh: '刎頸之交既絕', en: 'The Friendship That Broke' },
        description: 'Hold Ye and Changshan by 184 — Chen Yu and Zhang Er swore to die for each other, once.',
        descriptionZh: "於184年前據鄴城、常山 —— 陳餘與張耳,曾是刎頸之交。",
        goal: { kind: 'hold-cities', cityIds: ['ye', 'changshan'], byYear: 184 },
      },
    },
    {
      id: 'obj-chch-wei',
      forceId: 'wei',
      primary: {
        title: { zh: '首鼠兩端', en: 'Hedging Between Two Kings' },
        description: 'Still hold Luoyang and Puyang in 186 — Wei Bao changed sides once too often.',
        descriptionZh: "至186年仍保洛陽、濮陽 —— 魏豹反覆於楚漢之間,終為韓信所擒。",
        goal: { kind: 'hold-cities', cityIds: ['luoyang', 'puyang'], byYear: 186 },
      },
    },
    {
      id: 'obj-chch-jiujiang',
      forceId: 'jiujiang',
      primary: {
        title: { zh: '黥布反楚', en: 'The Tattooed King Turns' },
        description: 'Hold Shouchun and Hefei by 184, then take Pengcheng.',
        descriptionZh: "於184年前據壽春、合肥 —— 英布叛楚歸漢,淮南遂為戰場。",
        goal: { kind: 'hold-cities', cityIds: ['shouchun', 'hefei'], byYear: 184 },
      },
      secondary: [
        {
          title: { zh: '自取天下', en: 'Or Take It All Yourself' },
          description: 'Declare yourself emperor.',
          descriptionZh: "稱帝建號 —— 為人臣者,終不免鳥盡弓藏。",
          goal: { kind: 'declare-emperor' },
        },
      ],
    },
  ],

  // Retaking the Three Qin
  'scn-ch-sanqin': [
    {
      id: 'obj-chsq-han',
      forceId: 'han',
      primary: {
        title: { zh: '暗度陳倉', en: 'Out by Chencang' },
        description: "Take Chencang and Chang'an by 181 — the burnt roads were the point.",
        descriptionZh: "於181年前取陳倉、長安 —— 燒絕棧道以示無還心,正是為了這一天。",
        goal: { kind: 'hold-cities', cityIds: ['chencang', 'changan'], byYear: 181 },
      },
      secondary: [
        {
          title: { zh: '東出函谷', en: 'East Through Hangu' },
          description: 'Take Luoyang and Hanguguan by 185.',
          descriptionZh: "於185年前東出函谷關、取洛陽。",
          goal: { kind: 'hold-cities', cityIds: ['hanguguan', 'luoyang'], byYear: 185 },
        },
      ],
    },
    {
      id: 'obj-chsq-yong',
      forceId: 'yong',
      primary: {
        title: { zh: '廢丘十月', en: 'Ten Months in Feiqiu' },
        description: "Still hold Xiaoguan, Jieting and Shanggui in 180 — Zhang Han held Feiqiu ten months after everything else was gone.",
        /*
         * 改過兩次,兩次都是同一個病:**挑了他守不住的城**。
         *   一寫「保長安、陳倉」——而陳倉開局就在漢手裡(暗度陳倉是這張盤的
         *     前提,不是它的題目)。
         *   二寫「保長安、郿」——實測長安 +1 年只剩 2/6,而**郿是每個檢查點
         *     都已失去**的那種(what-they-actually-do 把這類城收在最後那條 ✗ 行,
         *     不列在守成那幾行,很容易看漏)。
         * 章邯真正做到的是三秦盡失之後還守著西邊:蕭關 6/6、街亭 6/6、
         * 上邽 5/6(+2 年)。窗口跟著從 182 收到 180 ——「十個月」不是四年。
         */
        descriptionZh: "至180年仍據蕭關、街亭、上邽 —— 三秦盡失,而廢丘獨守十月;漢引水灌之,乃降,章邯自殺。",
        goal: { kind: 'hold-cities', cityIds: ['xiaoguan', 'jieting', 'shanggui'], byYear: 180 },
      },
      secondary: [
        {
          title: { zh: '復陳倉', en: 'Retake Chencang' },
          description: 'Take Chencang back by 185 — shut the back road for good.',
          descriptionZh: "於185年前復取陳倉 —— 把那條故道徹底堵死。",
          goal: { kind: 'hold-cities', cityIds: ['chencang'], byYear: 185 },
        },
      ],
    },
    {
      id: 'obj-chsq-chu',
      forceId: 'chu',
      primary: {
        title: { zh: '彭城之守', en: 'Hold Pengcheng' },
        description: "Still hold Pengcheng in 184 — he went north against Qi, and Liu Bang walked into his capital behind him.",
        descriptionZh: "至184年仍據彭城 —— 羽北擊齊,而漢王劫五諸侯兵五十六萬人入彭城。羽聞之,自以精兵三萬人南從魯出胡陵,至蕭,大破漢軍。",
        /*
         * 原本是「於184年前取彭城、臨淄」—— 彭城他**開局就有**(守成),
         * 而臨淄是 0.00(不相鄰)。也就是「守自己的都城 + 一座構不著的城」。
         * 主目標留彭城 —— 那正是這張盤的戲眼:他北擊齊的時候,都城丟了,
         * 而他三萬人殺回來。北擊齊降為次要。
         */
        goal: { kind: 'hold-cities', cityIds: ['pengcheng'], byYear: 184 },
      },
      secondary: [
        {
          title: { zh: '擊滅漢王', en: 'Destroy the King of Han' },
          description: 'Destroy the Han force.',
          descriptionZh: "擊滅漢王。",
          goal: { kind: 'defeat-force', forceId: 'han' },
        },
      ],
    },
    {
      id: 'obj-chsq-qi',
      forceId: 'qi',
      primary: {
        title: { zh: '牽制項羽', en: 'Pin Xiang Yu Down' },
        description: 'Still hold Linzi and Beihai in 185 — every month Qi holds is a month Han grows.',
        descriptionZh: "至185年仍保臨淄、北海 —— 齊多守一月,漢便多長一分。",
        goal: { kind: 'hold-cities', cityIds: ['linzi', 'beihai'], byYear: 185 },
      },
    },
    {
      id: 'obj-chsq-jiujiang',
      forceId: 'jiujiang',
      primary: {
        title: { zh: '按兵不動', en: 'Send No Troops' },
        description: 'Hold Shouchun and Hefei by 184 — Ying Bu answered neither call, and both kings noticed.',
        descriptionZh: "於184年前據壽春、合肥 —— 英布稱病不出,楚漢都記下了這一筆。",
        goal: { kind: 'hold-cities', cityIds: ['shouchun', 'hefei'], byYear: 184 },
      },
    },
    {
      id: 'obj-ch-sanqin-zhao',
      forceId: 'zhao',
      primary: {
        title: { zh: '胡服騎射', en: 'Ride and Shoot' },
        description: "Still hold Ye and Beiping in 184. He put his people in nomad coats and taught them to shoot from the saddle; the northern army is what the realm fears.",
        descriptionZh: "至184年仍據鄴、北平。胡服騎射以教百姓 —— 北邊之師,天下所畏。",
        goal: { kind: 'hold-cities', cityIds: ['ye', 'beiping'], byYear: 184 },
      },
    },
    {
      id: 'obj-ch-sanqin-wei',
      forceId: 'wei',
      primary: {
        title: { zh: '大梁之守', en: 'Daliang Holds' },
        description: "Still hold Puyang and Luoyang in 184. Wei was first to power under heaven and threw it away; what is left is Daliang and the river bend.",
        descriptionZh: "至184年仍據濮陽、洛陽。魏為天下先霸而自棄之 —— 如今守著大梁與河曲。",
        goal: { kind: 'hold-cities', cityIds: ['puyang', 'luoyang'], byYear: 184 },
      },
    },
  ],

  // The battle of Pengcheng
  'scn-ch-pengcheng': [
    {
      id: 'obj-chpc-chu',
      forceId: 'chu',
      primary: {
        title: { zh: '三萬破五十六萬', en: 'Thirty Thousand Against Half a Million' },
        description: 'Still hold Wancheng, Xinye and Xiangyang in 180 — three myriad horse broke five hundred and sixty thousand at dawn; holding what that bought is the next problem.',
        descriptionZh: "至180年仍據宛城、新野、襄陽 —— 以三萬精騎晨擊漢軍五十六萬,半日而破之;而守得住那一戰換來的地,是另一回事。",
        goal: { kind: 'hold-cities', cityIds: ['wancheng', 'xinye', 'xiangyang'], byYear: 180 },
      },
      secondary: [
        {
          title: { zh: '追亡逐北', en: 'Run Them Down' },
          description: 'Destroy the Han force by 186.',
          descriptionZh: "於186年前擊滅漢 —— 睢水為之不流。",
          goal: { kind: 'defeat-force', forceId: 'han', byYear: 186 },
        },
      ],
    },
    {
      id: 'obj-chpc-han',
      forceId: 'han',
      primary: {
        title: { zh: '守住彭城', en: 'Keep Pengcheng This Time' },
        description: 'Still hold Pengcheng in 183 — five armies, one banquet, and a cavalry charge at dawn.',
        descriptionZh: "至183年仍守彭城 —— 五諸侯兵五十六萬,入城即置酒高會,天亮時全完了。",
        goal: { kind: 'hold-cities', cityIds: ['pengcheng'], byYear: 183 },
      },
      secondary: [
        {
          title: { zh: '退保滎陽', en: 'Fall Back on Xingyang' },
          description: 'Still hold Guandu and Hulao in 185 — the line Han held for two years.',
          descriptionZh: "至185年仍保滎陽、成皋(官渡、虎牢) —— 漢就是在這裡撐了兩年。",
          goal: { kind: 'hold-cities', cityIds: ['guandu', 'hulao'], byYear: 185 },
        },
      ],
    },
    {
      id: 'obj-chpc-yong',
      forceId: 'yong',
      primary: {
        title: { zh: '廢丘之圍', en: 'The Siege of Feiqiu' },
        description: "Still hold Chang'an and Xiaoguan in 179 — ten months, until they turned the river on the walls.",
        descriptionZh: "至179年仍據長安、蕭關 —— 十個月,直到他們引水灌城。",
        goal: { kind: 'hold-cities', cityIds: ['changan', 'xiaoguan'], byYear: 179 },
      },
      /*
       * 長安在這張盤 +1 年 4/6、+2 年 3/6、+4 年 1/6,而窗口原本開到 182(+4 年)。
       * 「十個月」就是十個月:收到 179(+1 年),再配一座他守得穩的蕭關(6/6)。
       * 章邯的雍在三張盤上都守不住長安(彭城 4/6→1/6、井陘 4/6→2/6、
       * 三秦 2/6→0/6),而蕭關/街亭/上邽三張都穩 —— 跟竇建德之於鄴同型。
       */
      secondary: [
        {
          title: { zh: '廢丘之圍', en: 'The Siege of Feiqiu' },
          description: "Still hold Chang'an in 183.",
          descriptionZh: "至183年仍守長安 —— 章邯困守廢丘十月,終自刎。",
          goal: { kind: 'hold-cities', cityIds: ['changan'], byYear: 183 },
        },
      ],
    },
    {
      id: 'obj-chpc-qi',
      forceId: 'qi',
      primary: {
        title: { zh: '齊地未平', en: 'Qi Is Not Yet Pacified' },
        description: 'Still hold Linzi and Beihai in 181 — Xiang Yu is stuck in Qi; that is the only reason Pengcheng is open.',
        descriptionZh: "至181年仍保臨淄、北海 —— 項羽陷在齊地,劉邦才能襲彭城。",
        goal: { kind: 'hold-cities', cityIds: ['linzi', 'beihai'], byYear: 181 },
      },
      /*
       * 窗口 184(開局 +6 年)→ 181(+3 年)。實測北海 +2 年 6/6、+4 年 4/6,
       * 掉的全在後面那幾年;臨淄一路 6/6。田氏在楚漢盤上一律是三年的事,
       * 楚漢爭霸那張的齊也是同樣的收法。
       */
    },
    {
      id: 'obj-chpc-jiujiang',
      forceId: 'jiujiang',
      primary: {
        title: { zh: '淮南之王', en: 'King of Huainan' },
        description: 'Hold Shouchun, Hefei and Lujiang by 183.',
        descriptionZh: "於183年前據壽春、合肥、廬江。",
        goal: { kind: 'hold-cities', cityIds: ['shouchun', 'hefei', 'lujiang'], byYear: 183 },
      },
    },
    {
      id: 'obj-ch-pengcheng-zhao',
      forceId: 'zhao',
      primary: {
        title: { zh: '胡服騎射', en: 'Ride and Shoot' },
        description: "Still hold Ye and Beiping in 184. He put his people in nomad coats and taught them to shoot from the saddle; the northern army is what the realm fears.",
        descriptionZh: "至184年仍據鄴、北平。胡服騎射以教百姓 —— 北邊之師,天下所畏。",
        goal: { kind: 'hold-cities', cityIds: ['ye', 'beiping'], byYear: 184 },
      },
    },
    {
      id: 'obj-ch-pengcheng-wei',
      forceId: 'wei',
      primary: {
        title: { zh: '大梁之守', en: 'Daliang Holds' },
        description: "Still hold Puyang and Luoyang in 184. Wei was first to power under heaven and threw it away; what is left is Daliang and the river bend.",
        descriptionZh: "至184年仍據濮陽、洛陽。魏為天下先霸而自棄之 —— 如今守著大梁與河曲。",
        goal: { kind: 'hold-cities', cityIds: ['puyang', 'luoyang'], byYear: 184 },
      },
    },
  ],

  // The battle of Jingxing
  'scn-ch-jingxing': [
    {
      id: 'obj-chjx-han',
      forceId: 'han',
      primary: {
        title: { zh: '背水一戰', en: 'With the River at Our Backs' },
        description: "Take Chang'an by 182 — put the men where they cannot run and they will fight; then the road west opens.",
        /*
         * 改過兩次。原本是「取鄴城、常山」而常山對漢壓力 0.00(完全不相鄰);
         * 上一版改成單取鄴(邯鄲),仍然三輪 0/3 —— **鄴在趙手裡而漢打不動它**。
         *
         * 實測(6 輪,開局 178,+1/+3/+5/+8 年在手比例)漢真正在做的事:
         * 他 28 城長到 40,而 **郿 6/6、散關 6/6、長安 6/6(+3 年起)** ——
         * 那是還定三秦那條路,也正是井陘之後韓信真正打開的方向。
         * 取邯鄲與滅趙都留在次要。
         */
        descriptionZh: "於182年前取長安 —— 陷之死地而後生,置之亡地而後存;背水而勝,西邊那條路才開得了。",
        goal: { kind: 'hold-cities', cityIds: ['changan'], byYear: 182 },
      },
      secondary: [
        {
          title: { zh: '取邯鄲', en: 'Take Handan' },
          description: 'Take Handan (Ye) by 186 — Chen Yu fell at the Zhi, and Zhao Xie was taken.',
          descriptionZh: "於186年前取邯鄲(鄴) —— 井陘一戰,斬成安君泜水上,禽趙王歇。",
          goal: { kind: 'hold-cities', cityIds: ['ye'], byYear: 186 },
        },
        {
          title: { zh: '滅趙', en: 'End Zhao' },
          description: 'Destroy the Zhao force by 186.',
          descriptionZh: "於186年前滅趙。",
          goal: { kind: 'defeat-force', forceId: 'zhao', byYear: 186 },
        },
        {
          title: { zh: '再定燕齊', en: 'Then Yan and Qi' },
          description: 'Take Linzi and Ji by 185 — the northern half of the war, won by one man.',
          descriptionZh: "於185年前取臨淄、薊 —— 北方半壁,韓信一人下之。",
          goal: { kind: 'hold-cities', cityIds: ['linzi', 'ji'], byYear: 185 },
        },
      ],
    },
    {
      id: 'obj-chjx-zhao',
      forceId: 'zhao',
      primary: {
        title: { zh: '用李左車之策', en: "Take Li Zuoche's Advice" },
        description: 'Still hold Ye and Changshan in 183 — cut the supply train in the gorge; the plan was on the table.',
        descriptionZh: "至183年仍保鄴城、常山 —— 李左車請以奇兵絕其輜重,陳餘不聽。",
        goal: { kind: 'hold-cities', cityIds: ['ye', 'changshan'], byYear: 183 },
      },
    },
    {
      id: 'obj-chjx-chu',
      forceId: 'chu',
      primary: {
        title: { zh: '正面相持', en: 'Hold the Front Yourself' },
        description: 'Still hold Guandu and Hulao in 185, and take Pengcheng back if lost.',
        descriptionZh: "至185年仍守滎陽、成皋(官渡、虎牢) —— 你在正面壓住劉邦,北方卻在丟。",
        goal: { kind: 'hold-cities', cityIds: ['guandu', 'hulao'], byYear: 185 },
      },
      secondary: [
        {
          title: { zh: '救趙救齊', en: 'Save the North' },
          description: 'Keep Zhao standing to 186 — Han Xin went north, and Chu\'s flank went with it.',
          descriptionZh: "至186年趙未亡 —— 韓信一路下去,楚之側翼全空。",
          /*
           * 原本寫成「取鄴城、臨淄」而**趙與齊都是楚的開局盟友** ——
           * `isHostilePermitted` 只放行 neutral,這條從第 0 旬就走不動。
           * 標題寫的是「救」,那就用 `protect-force`:救援看的是他還在不在。
           */
          goal: { kind: 'protect-force', forceId: 'zhao', byYear: 186 },
        },
      ],
    },
    {
      id: 'obj-chjx-qi',
      forceId: 'qi',
      primary: {
        title: { zh: '齊之最後', en: "Qi's Last Years" },
        description: 'Still hold Linzi and Beihai in 185 — Han Xin is coming east after Zhao.',
        descriptionZh: "至185年仍保臨淄、北海 —— 破趙之後,韓信就要東來。",
        goal: { kind: 'hold-cities', cityIds: ['linzi', 'beihai'], byYear: 185 },
      },
    },
    {
      id: 'obj-chjx-yong',
      forceId: 'yong',
      primary: {
        title: { zh: '關中殘局', en: 'What Is Left of Guanzhong' },
        description: 'Still hold Xiaoguan, Shanggui and Jieting in 181 — what is left of Guanzhong, and it is not the capital.',
        descriptionZh: "至181年仍據蕭關、上邽、街亭 —— 關中殘局,而剩下的不是那座都城。",
        goal: { kind: 'hold-cities', cityIds: ['xiaoguan', 'shanggui', 'jieting'], byYear: 181 },
      },
    },
    {
      id: 'obj-ch-jingxing-jiujiang',
      forceId: 'jiujiang',
      primary: {
        title: { zh: '淮南之王', en: 'King of Jiujiang' },
        description: "Still hold Shouchun and Hefei in 184. Ying Bu fought well and changed sides often. For the moment he is still watching.",
        descriptionZh: "至184年仍據壽春、合肥。黥布善戰而反覆 —— 這一回他還在觀望。",
        goal: { kind: 'hold-cities', cityIds: ['shouchun', 'hefei'], byYear: 184 },
      },
    },
  ],

  // The battle of Weishui
  'scn-ch-weishui': [
    {
      id: 'obj-chws-han',
      forceId: 'han',
      primary: {
        title: { zh: '囊沙壅水', en: 'Sandbags in the River' },
        description: 'Take Linzi and Beihai by 182 — dam the Wei upstream, let half of them cross, then open it.',
        descriptionZh: "於182年前取臨淄、北海 —— 夜作萬餘囊,壅濰水上流,半渡而決之。",
        goal: { kind: 'hold-cities', cityIds: ['linzi', 'beihai'], byYear: 182 },
      },
      secondary: [
        {
          title: { zh: '請為假王', en: 'Ask to Be Made King' },
          description: 'Declare yourself emperor — Han Xin asked for a provisional crown; it was the beginning of the end for him.',
          descriptionZh: "稱帝建號 —— 韓信請為假齊王,那封信是他後來一切禍事的開端。",
          goal: { kind: 'declare-emperor' },
        },
      ],
    },
    {
      id: 'obj-chws-qi',
      forceId: 'qi',
      primary: {
        title: { zh: '酈生已說降', en: 'We Had Already Surrendered' },
        description: 'Still hold Linzi and Beihai in 183 — Qi had agreed terms when Han Xin attacked anyway.',
        descriptionZh: "至183年仍保臨淄、北海 —— 酈食其已說降齊,韓信仍然襲之,酈生被烹。",
        goal: { kind: 'hold-cities', cityIds: ['linzi', 'beihai'], byYear: 183 },
      },
      secondary: [
        {
          title: { zh: '三分天下', en: 'A Third Way' },
          description: 'Survive to 186 — Kuai Tong argued Qi could be the third of three.',
          descriptionZh: "存續至186年 —— 蒯通說三分天下鼎足而立,那也是一條路。",
          goal: { kind: 'survive-until', year: 186 },
        },
      ],
    },
    {
      id: 'obj-chws-chu',
      forceId: 'chu',
      primary: {
        title: { zh: '保彭城', en: 'Hold Pengcheng' },
        description: "Still hold Pengcheng and Xuchang in 183 — Long Ju went east to save Qi and died in the Wei's sand-dammed flood.",
        descriptionZh: "至183年仍據彭城、許昌 —— 龍且東救齊,死於濰水囊沙之下。西楚的本在彭城。",
        goal: { kind: 'hold-cities', cityIds: ['pengcheng', 'xuchang'], byYear: 183 },
      },
      secondary: [
        {
          title: { zh: '救齊之師', en: 'The Army Sent to Save Qi' },
          description: 'Keep Qi standing to 183 — Long Ju took twenty legions east to save them and lost them all.',
          descriptionZh: "至183年齊未亡 —— 龍且將二十萬東救,全軍覆沒。",
          /*
           * 原本寫成「取臨淄」,而臨淄是**齊**的城、齊是楚的開局盟友 ——
           * 龍且是去**救**齊的,不是去打齊的。改 `protect-force`。
           * 原文案還把兩件事擠在一句(「於183年前取臨淄、183年前仍守滎陽」),
           * 而 goal 只有臨淄一座 —— 滎陽那半句是隔壁「守住正面」的內容。
           */
          goal: { kind: 'protect-force', forceId: 'qi', byYear: 183 },
        },
        {
          title: { zh: '守住正面', en: 'Hold the Front' },
          description: 'Still hold Guandu and Hulao in 183.',
          descriptionZh: "至183年仍守滎陽、成皋(官渡、虎牢)。",
          goal: { kind: 'hold-cities', cityIds: ['guandu', 'hulao'], byYear: 183 },
        },
      ],
    },
  ],

  // The battle of Gaixia
  'scn-ch-gaixia': [
    {
      id: 'obj-chgx-han',
      forceId: 'han',
      primary: {
        title: { zh: '四面楚歌', en: 'Songs of Chu on Every Side' },
        description: 'Destroy the Chu force by 181 — thirty legions, ten ambushes, and a night of homesick singing.',
        descriptionZh: "於181年前擊滅西楚 —— 十面埋伏,夜聞四面皆楚歌。",
        goal: { kind: 'defeat-force', forceId: 'chu', byYear: 181 },
      },
      secondary: [
        {
          title: { zh: '取彭城', en: 'Take Pengcheng' },
          description: 'Hold Pengcheng and Xiapi by 182.',
          descriptionZh: "於182年前取彭城、下邳 —— 西楚之都。",
          goal: { kind: 'hold-cities', cityIds: ['pengcheng', 'xiapi'], byYear: 182 },
        },
      ],
    },
    {
      id: 'obj-chgx-chu',
      forceId: 'chu',
      primary: {
        title: { zh: '不肯過江東', en: 'He Would Not Cross the River' },
        description: 'Survive to 182 and hold Pengcheng — Jiangdong had eight thousand sons left to give.',
        descriptionZh: "存續至182年並保有彭城 —— 江東子弟多才俊,捲土重來未可知。",
        goal: { kind: 'survive-until', year: 182 },
      },
      secondary: [
        {
          title: { zh: '收復失地', en: 'Win It Back' },
          description: "Take Chang'an and Luoyang by 185.",
          descriptionZh: "於185年前克復長安、洛陽 —— 天亡我,非戰之罪?那就再戰一次。",
          goal: { kind: 'hold-cities', cityIds: ['changan', 'luoyang'], byYear: 185 },
        },
      ],
    },
  ],

  // ───────────────────────────────────────────────────────────────────────
  // Sui-Tang. Chang'an = the Tang capital, Luoyang = Wang Shichong's Zheng,
  // Ye = Dou Jiande's Xia, Taiyuan = the Li clan's base, Hulao = the pass where
  // one battle settled two kingdoms.
  // ───────────────────────────────────────────────────────────────────────

  // The end of Sui: the warlords contend
};
