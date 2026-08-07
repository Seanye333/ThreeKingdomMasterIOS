import type { ScenarioObjective } from '../../types';

/** 劇本目標 · 楚漢盤 —— 純資料,唯一入口仍是 data/objectives.ts。 */
export const OBJ_CHUHAN: Record<string, ScenarioObjective[]> = {
  'scn-ch-daze': [
    {
      id: 'obj-chdz-zhangchu',
      forceId: 'zhangchu',
      primary: {
        title: { zh: '王侯將相寧有種乎', en: 'Are Kings and Nobles Born to It?' },
        description: 'Take Luoyang by 190 — six hundred conscripts late for a garrison, and the law says death either way.',
        descriptionZh: "於190年前攻取洛陽 —— 失期當斬,舉大計亦死,等死,死國可乎?",
        goal: { kind: 'hold-cities', cityIds: ['luoyang'], byYear: 190 },
      },
      secondary: [
        {
          title: { zh: '入關滅秦', en: 'Through the Pass, End Qin' },
          description: "Take Chang'an by 196 — the first rising rarely gets there.",
          descriptionZh: "於196年前攻取長安 —— 首義者多半到不了咸陽。",
          goal: { kind: 'hold-cities', cityIds: ['changan'], byYear: 196 },
        },
      ],
    },
    {
      id: 'obj-chdz-qin',
      forceId: 'qin',
      primary: {
        title: { zh: '關東群盜', en: '"Merely Bandits, Your Majesty"' },
        description: 'Destroy the Zhangchu force by 192 — the court insisted there was no rebellion at all.',
        descriptionZh: "於192年前平定張楚 —— 朝廷上下都說那不過是群盜,不足憂。",
        goal: { kind: 'defeat-force', forceId: 'zhangchu', byYear: 192 },
      },
      secondary: [
        {
          title: { zh: '二世而不亡', en: 'Not Dead in the Second Generation' },
          description: 'Survive to 205 — the empire that was to last ten thousand generations.',
          descriptionZh: "存續至205年 —— 那個號稱傳之萬世的帝國。",
          goal: { kind: 'survive-until', year: 205 },
        },
      ],
    },
    {
      id: 'obj-chdz-chu',
      forceId: 'chu',
      primary: {
        title: { zh: '江東子弟八千人', en: 'Eight Thousand Sons of the East' },
        description: "Still hold Pengcheng in 192 — Xiang Liang crossed the river with eight thousand; Xianyang is four years away.",
        descriptionZh: "至192年仍據彭城 —— 項梁渡江時只有八千人;咸陽是四年後的事。",
        goal: { kind: 'hold-cities', cityIds: ['pengcheng'], byYear: 192 },
      },
      secondary: [
        {
          title: { zh: '楚雖三戶', en: 'Though Chu Has But Three Households' },
          description: "Take Pengcheng and Chang'an by 196 — Xiang Liang raises the old Chu banner in Kuaiji.",
          descriptionZh: "於196年前取彭城、長安 —— 項梁起於會稽,立楚後以從民望。",
          goal: { kind: 'hold-cities', cityIds: ['pengcheng', 'changan'], byYear: 196 },
        },
      ],
    },
    {
      id: 'obj-chdz-qi',
      forceId: 'qi',
      primary: {
        title: { zh: '田氏復齊', en: 'The Tian Clan Restores Qi' },
        description: 'Hold Linzi, Beihai and Langya by 192, then take Pengcheng.',
        descriptionZh: "於192年前據臨淄、北海、琅琊 —— 田氏自立,齊地復國。",
        goal: { kind: 'hold-cities', cityIds: ['linzi', 'beihai', 'langya'], byYear: 192 },
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
        description: "Take Luoyang and Chang'an by 196 — sink the boats, smash the pots, carry three days' rations. Julu is Zhao's city; the road it opens runs west.",
        descriptionZh: "於196年前取洛陽、長安 —— 沉船破釜,持三日糧。鉅鹿是趙的城,那一戰打開的路通向西邊。",
        goal: { kind: 'hold-cities', cityIds: ['luoyang', 'changan'], byYear: 196 },
      },
      secondary: [
        {
          title: { zh: '破釜沉舟', en: 'Break the Cauldrons, Sink the Boats' },
          description: 'Take Ye by 192 — three days of rations, no way back across the river.',
          descriptionZh: "於192年前攻取鉅鹿(鄴) —— 皆沉船,破釜甑,持三日糧,以示士卒必死。",
          goal: { kind: 'hold-cities', cityIds: ['ye'], byYear: 192 },
        },
        {
          title: { zh: '諸侯膝行', en: 'The Lords Came in on Their Knees' },
          description: 'Destroy the Qin force by 198.',
          descriptionZh: "於198年前滅秦 —— 召見諸侯將,無不膝行而前,莫敢仰視。",
          goal: { kind: 'defeat-force', forceId: 'qin', byYear: 198 },
        },
      ],
    },
    {
      id: 'obj-chjl-qin',
      forceId: 'qin',
      primary: {
        title: { zh: '關中未失', en: 'Guanzhong Still Stands' },
        description: "Still hold Chang'an, Tongguan and Hanguguan in 192 — Zhang Han surrendered at Yin Ruins; before that, the passes held.",
        descriptionZh: "至192年仍據長安、潼關、函谷關 —— 章邯降於殷墟是後來的事;在那之前,關是關得住的。",
        goal: { kind: 'hold-cities', cityIds: ['changan', 'tongguan', 'hanguguan'], byYear: 192 },
      },
      secondary: [
        {
          title: { zh: '章邯不降', en: 'Zhang Han Does Not Surrender' },
          description: "Still hold Chang'an and Luoyang in 198 — the last army Qin had, and a court that would not back it.",
          descriptionZh: "至198年仍保長安、洛陽 —— 秦最後一支軍隊,和一個不肯支持它的朝廷。",
          goal: { kind: 'hold-cities', cityIds: ['changan', 'luoyang'], byYear: 198 },
        },
        {
          title: { zh: '先破鉅鹿', en: 'Take Julu First' },
          description: 'Take Ye by 192.',
          descriptionZh: "於192年前攻下鉅鹿(鄴)。",
          goal: { kind: 'hold-cities', cityIds: ['ye'], byYear: 192 },
        },
      ],
    },
    {
      id: 'obj-chjl-zhao',
      forceId: 'zhao',
      primary: {
        title: { zh: '鉅鹿之圍', en: 'Under Siege at Julu' },
        description: 'Still hold Ye in 194 — ten allied armies watched from behind their walls.',
        descriptionZh: "至194年仍守鉅鹿(鄴) —— 諸侯軍十餘壁,無一人敢縱兵。",
        goal: { kind: 'hold-cities', cityIds: ['ye'], byYear: 194 },
      },
    },
    {
      id: 'obj-chjl-wei',
      forceId: 'wei',
      primary: {
        title: { zh: '魏地復國', en: 'Wei Restored' },
        description: "Still hold Puyang and Chenliu in 196 — Wei Bao got his ancestors' land back; Luoyang was never part of it.",
        descriptionZh: "至196年仍據濮陽、陳留 —— 魏豹復得魏地;洛陽從來不在其中。",
        goal: { kind: 'hold-cities', cityIds: ['puyang', 'chenliu'], byYear: 196 },
      },
      secondary: [
        {
          title: { zh: '魏地復國', en: 'Wei Restored' },
          description: 'Hold Puyang and take Luoyang by 196.',
          descriptionZh: "於196年前守濮陽並取洛陽 —— 魏豹得一城而稱王,總要再取一城。",
          goal: { kind: 'hold-cities', cityIds: ['puyang', 'luoyang'], byYear: 196 },
        },
      ],
    },
    {
      id: 'obj-chjl-qi',
      forceId: 'qi',
      primary: {
        title: { zh: '齊不救趙', en: 'Qi Does Not Ride to Julu' },
        description: 'Hold Linzi, Beihai and Langya by 194 — Qi sat out the decisive battle of the age.',
        descriptionZh: "於194年前據臨淄、北海、琅琊 —— 這個時代的決戰,齊沒有參加。",
        goal: { kind: 'hold-cities', cityIds: ['linzi', 'beihai', 'langya'], byYear: 194 },
      },
    },
  ],

  // Chu and Han contend
  'scn-ch-chuhan': [
    {
      id: 'obj-chch-han',
      forceId: 'han',
      primary: {
        title: { zh: '還定三秦', en: 'Take Back the Three Qin' },
        description: "Take Chang'an by 192, then Pengcheng — burn the plank roads, then walk out by Chencang.",
        descriptionZh: "於192年前攻取長安 —— 明修棧道,暗度陳倉。",
        goal: { kind: 'hold-cities', cityIds: ['changan'], byYear: 192 },
      },
      secondary: [
        {
          title: { zh: '垓下之圍', en: 'The Ring at Gaixia' },
          description: 'Destroy the Chu force by 200.',
          descriptionZh: "於200年前擊滅西楚 —— 四面楚歌,十面埋伏。",
          goal: { kind: 'defeat-force', forceId: 'chu', byYear: 200 },
        },
      ],
    },
    {
      id: 'obj-chch-chu',
      forceId: 'chu',
      primary: {
        title: { zh: '西楚霸王', en: 'Hegemon-King of Western Chu' },
        description: "Still hold Pengcheng, Xuchang, Chenliu and Wancheng in 196 — nine commanderies of Western Chu, and eighteen kings enfeoffed by your word.",
        descriptionZh: "至196年仍據彭城、許昌、陳留、宛城 —— 西楚九郡,十八諸侯出於你一言。",
        goal: { kind: 'hold-cities', cityIds: ['pengcheng', 'xuchang', 'chenliu', 'wancheng'], byYear: 196 },
      },
      secondary: [
        {
          title: { zh: '力拔山兮', en: 'My Strength Uprooted Mountains' },
          description: 'Destroy the Han force by 198 — you win every battle; that has never been the problem.',
          descriptionZh: "於198年前擊滅漢 —— 你每戰必勝,問題從來不在戰場上。",
          goal: { kind: 'defeat-force', forceId: 'han', byYear: 198 },
        },
        {
          title: { zh: '守成皋滎陽', en: 'Hold the Chenggao Line' },
          description: 'Still hold Guandu and Hulao in 196.',
          descriptionZh: "至196年仍守滎陽、成皋(官渡、虎牢) —— 楚漢相持之地。",
          goal: { kind: 'hold-cities', cityIds: ['guandu', 'hulao'], byYear: 196 },
        },
      ],
    },
    {
      id: 'obj-chch-yong',
      forceId: 'yong',
      primary: {
        title: { zh: '廢丘死守', en: 'Feiqiu Holds' },
        description: "Still hold Chang'an in 192 — the other two of the Three Qin folded in weeks; you held out ten months.",
        descriptionZh: "至192年仍據長安 —— 三秦另外兩家數週而降,你守了十個月。",
        goal: { kind: 'hold-cities', cityIds: ['changan'], byYear: 192 },
      },
      secondary: [
        {
          title: { zh: '三秦拒漢', en: 'The Three Qin Hold the Passes' },
          description: "Still hold Chang'an and Chencang in 194 — you were Qin's last general; hold what Xiang Yu gave you.",
          descriptionZh: "至194年仍保長安、陳倉 —— 你是秦最後的大將,守住項羽分給你的地方。",
          goal: { kind: 'hold-cities', cityIds: ['changan', 'chencang'], byYear: 194 },
        },
      ],
    },
    {
      id: 'obj-chch-qi',
      forceId: 'qi',
      primary: {
        title: { zh: '齊地自立', en: 'Qi Stands Alone' },
        description: 'Hold Linzi and Beihai by 194 — Tian Rong refused Xiang Yu\'s partition and paid for it.',
        descriptionZh: "於194年前據臨淄、北海 —— 田榮不受項羽之封,遂反。",
        goal: { kind: 'hold-cities', cityIds: ['linzi', 'beihai'], byYear: 194 },
      },
    },
    {
      id: 'obj-chch-zhao',
      forceId: 'zhao',
      primary: {
        title: { zh: '刎頸之交既絕', en: 'The Friendship That Broke' },
        description: 'Hold Ye and Changshan by 194 — Chen Yu and Zhang Er swore to die for each other, once.',
        descriptionZh: "於194年前據鄴城、常山 —— 陳餘與張耳,曾是刎頸之交。",
        goal: { kind: 'hold-cities', cityIds: ['ye', 'changshan'], byYear: 194 },
      },
    },
    {
      id: 'obj-chch-wei',
      forceId: 'wei',
      primary: {
        title: { zh: '首鼠兩端', en: 'Hedging Between Two Kings' },
        description: 'Still hold Luoyang and Puyang in 196 — Wei Bao changed sides once too often.',
        descriptionZh: "至196年仍保洛陽、濮陽 —— 魏豹反覆於楚漢之間,終為韓信所擒。",
        goal: { kind: 'hold-cities', cityIds: ['luoyang', 'puyang'], byYear: 196 },
      },
    },
    {
      id: 'obj-chch-jiujiang',
      forceId: 'jiujiang',
      primary: {
        title: { zh: '黥布反楚', en: 'The Tattooed King Turns' },
        description: 'Hold Shouchun and Hefei by 194, then take Pengcheng.',
        descriptionZh: "於194年前據壽春、合肥 —— 英布叛楚歸漢,淮南遂為戰場。",
        goal: { kind: 'hold-cities', cityIds: ['shouchun', 'hefei'], byYear: 194 },
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
        description: "Take Chencang and Chang'an by 191 — the burnt roads were the point.",
        descriptionZh: "於191年前取陳倉、長安 —— 燒絕棧道以示無還心,正是為了這一天。",
        goal: { kind: 'hold-cities', cityIds: ['chencang', 'changan'], byYear: 191 },
      },
      secondary: [
        {
          title: { zh: '東出函谷', en: 'East Through Hangu' },
          description: 'Take Luoyang and Hanguguan by 195.',
          descriptionZh: "於195年前東出函谷關、取洛陽。",
          goal: { kind: 'hold-cities', cityIds: ['hanguguan', 'luoyang'], byYear: 195 },
        },
      ],
    },
    {
      id: 'obj-chsq-yong',
      forceId: 'yong',
      primary: {
        title: { zh: '塞漢中於巴蜀', en: 'Keep Them Bottled in Shu' },
        description: "Still hold Chang'an and Chencang in 194 — that is the whole reason you were given this land.",
        descriptionZh: "至194年仍保長安、陳倉 —— 項羽封你三秦,就是要你堵住漢中。",
        goal: { kind: 'hold-cities', cityIds: ['changan', 'chencang'], byYear: 194 },
      },
    },
    {
      id: 'obj-chsq-chu',
      forceId: 'chu',
      primary: {
        title: { zh: '北擊齊而已', en: 'Qi First, As Always' },
        description: 'Hold Pengcheng and take Linzi by 194 — Xiang Yu marched north while Han came out of the west.',
        descriptionZh: "於194年前守彭城並取臨淄 —— 項羽北擊齊之時,漢已出關。",
        goal: { kind: 'hold-cities', cityIds: ['pengcheng', 'linzi'], byYear: 194 },
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
        description: 'Still hold Linzi and Beihai in 195 — every month Qi holds is a month Han grows.',
        descriptionZh: "至195年仍保臨淄、北海 —— 齊多守一月,漢便多長一分。",
        goal: { kind: 'hold-cities', cityIds: ['linzi', 'beihai'], byYear: 195 },
      },
    },
    {
      id: 'obj-chsq-jiujiang',
      forceId: 'jiujiang',
      primary: {
        title: { zh: '按兵不動', en: 'Send No Troops' },
        description: 'Hold Shouchun and Hefei by 194 — Ying Bu answered neither call, and both kings noticed.',
        descriptionZh: "於194年前據壽春、合肥 —— 英布稱病不出,楚漢都記下了這一筆。",
        goal: { kind: 'hold-cities', cityIds: ['shouchun', 'hefei'], byYear: 194 },
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
        description: 'Retake Pengcheng by 192 and destroy the Han army — the fastest reversal in the record.',
        descriptionZh: "於192年前收復彭城 —— 以三萬精騎,晨擊漢軍五十六萬,半日而破之。",
        goal: { kind: 'hold-cities', cityIds: ['pengcheng'], byYear: 192 },
      },
      secondary: [
        {
          title: { zh: '追亡逐北', en: 'Run Them Down' },
          description: 'Destroy the Han force by 198.',
          descriptionZh: "於198年前擊滅漢 —— 睢水為之不流。",
          goal: { kind: 'defeat-force', forceId: 'han', byYear: 198 },
        },
      ],
    },
    {
      id: 'obj-chpc-han',
      forceId: 'han',
      primary: {
        title: { zh: '守住彭城', en: 'Keep Pengcheng This Time' },
        description: 'Still hold Pengcheng in 194 — five armies, one banquet, and a cavalry charge at dawn.',
        descriptionZh: "至194年仍守彭城 —— 五諸侯兵五十六萬,入城即置酒高會,天亮時全完了。",
        goal: { kind: 'hold-cities', cityIds: ['pengcheng'], byYear: 194 },
      },
      secondary: [
        {
          title: { zh: '退保滎陽', en: 'Fall Back on Xingyang' },
          description: 'Still hold Guandu and Hulao in 196 — the line Han held for two years.',
          descriptionZh: "至196年仍保滎陽、成皋(官渡、虎牢) —— 漢就是在這裡撐了兩年。",
          goal: { kind: 'hold-cities', cityIds: ['guandu', 'hulao'], byYear: 196 },
        },
      ],
    },
    {
      id: 'obj-chpc-yong',
      forceId: 'yong',
      primary: {
        title: { zh: '廢丘之圍', en: 'The Siege of Feiqiu' },
        description: "Still hold Chang'an in 192 — ten months, until they turned the river on the walls.",
        descriptionZh: "至192年仍據長安 —— 十個月,直到他們引水灌城。",
        goal: { kind: 'hold-cities', cityIds: ['changan'], byYear: 192 },
      },
      secondary: [
        {
          title: { zh: '廢丘之圍', en: 'The Siege of Feiqiu' },
          description: "Still hold Chang'an in 194.",
          descriptionZh: "至194年仍守長安 —— 章邯困守廢丘十月,終自刎。",
          goal: { kind: 'hold-cities', cityIds: ['changan'], byYear: 194 },
        },
      ],
    },
    {
      id: 'obj-chpc-qi',
      forceId: 'qi',
      primary: {
        title: { zh: '齊地未平', en: 'Qi Is Not Yet Pacified' },
        description: 'Still hold Linzi and Beihai in 195.',
        descriptionZh: "至195年仍保臨淄、北海 —— 項羽陷在齊地,劉邦才能襲彭城。",
        goal: { kind: 'hold-cities', cityIds: ['linzi', 'beihai'], byYear: 195 },
      },
    },
    {
      id: 'obj-chpc-jiujiang',
      forceId: 'jiujiang',
      primary: {
        title: { zh: '淮南之王', en: 'King of Huainan' },
        description: 'Hold Shouchun, Hefei and Lujiang by 194.',
        descriptionZh: "於194年前據壽春、合肥、廬江。",
        goal: { kind: 'hold-cities', cityIds: ['shouchun', 'hefei', 'lujiang'], byYear: 194 },
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
        description: 'Take Ye and Changshan by 192 — put the men where they cannot run, and they will fight.',
        descriptionZh: "於192年前取鄴城、常山 —— 陷之死地而後生,置之亡地而後存。",
        goal: { kind: 'hold-cities', cityIds: ['ye', 'changshan'], byYear: 192 },
      },
      secondary: [
        {
          title: { zh: '再定燕齊', en: 'Then Yan and Qi' },
          description: 'Take Linzi and Ji by 196 — the northern half of the war, won by one man.',
          descriptionZh: "於196年前取臨淄、薊 —— 北方半壁,韓信一人下之。",
          goal: { kind: 'hold-cities', cityIds: ['linzi', 'ji'], byYear: 196 },
        },
      ],
    },
    {
      id: 'obj-chjx-zhao',
      forceId: 'zhao',
      primary: {
        title: { zh: '用李左車之策', en: "Take Li Zuoche's Advice" },
        description: 'Still hold Ye and Changshan in 194 — cut the supply train in the gorge; the plan was on the table.',
        descriptionZh: "至194年仍保鄴城、常山 —— 李左車請以奇兵絕其輜重,陳餘不聽。",
        goal: { kind: 'hold-cities', cityIds: ['ye', 'changshan'], byYear: 194 },
      },
    },
    {
      id: 'obj-chjx-chu',
      forceId: 'chu',
      primary: {
        title: { zh: '正面相持', en: 'Hold the Front Yourself' },
        description: 'Still hold Guandu and Hulao in 196, and take Pengcheng back if lost.',
        descriptionZh: "至196年仍守滎陽、成皋(官渡、虎牢) —— 你在正面壓住劉邦,北方卻在丟。",
        goal: { kind: 'hold-cities', cityIds: ['guandu', 'hulao'], byYear: 196 },
      },
      secondary: [
        {
          title: { zh: '救趙救齊', en: 'Save the North' },
          description: 'Take Ye and Linzi by 198.',
          descriptionZh: "於198年前取鄴城、臨淄 —— 韓信一路下去,楚之側翼全空。",
          goal: { kind: 'hold-cities', cityIds: ['ye', 'linzi'], byYear: 198 },
        },
      ],
    },
    {
      id: 'obj-chjx-qi',
      forceId: 'qi',
      primary: {
        title: { zh: '齊之最後', en: "Qi's Last Years" },
        description: 'Still hold Linzi and Beihai in 196 — Han Xin is coming east after Zhao.',
        descriptionZh: "至196年仍保臨淄、北海 —— 破趙之後,韓信就要東來。",
        goal: { kind: 'hold-cities', cityIds: ['linzi', 'beihai'], byYear: 196 },
      },
    },
    {
      id: 'obj-chjx-yong',
      forceId: 'yong',
      primary: {
        title: { zh: '關中殘局', en: 'What Is Left of Guanzhong' },
        description: "Still hold Chang'an in 194.",
        descriptionZh: "至194年仍守長安。",
        goal: { kind: 'hold-cities', cityIds: ['changan'], byYear: 194 },
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
        description: 'Take Linzi and Beihai by 192 — dam the Wei upstream, let half of them cross, then open it.',
        descriptionZh: "於192年前取臨淄、北海 —— 夜作萬餘囊,壅濰水上流,半渡而決之。",
        goal: { kind: 'hold-cities', cityIds: ['linzi', 'beihai'], byYear: 192 },
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
        description: 'Still hold Linzi and Beihai in 195 — Qi had agreed terms when Han Xin attacked anyway.',
        descriptionZh: "至195年仍保臨淄、北海 —— 酈食其已說降齊,韓信仍然襲之,酈生被烹。",
        goal: { kind: 'hold-cities', cityIds: ['linzi', 'beihai'], byYear: 195 },
      },
      secondary: [
        {
          title: { zh: '三分天下', en: 'A Third Way' },
          description: 'Survive to 205 — Kuai Tong argued Qi could be the third of three.',
          descriptionZh: "存續至205年 —— 蒯通說三分天下鼎足而立,那也是一條路。",
          goal: { kind: 'survive-until', year: 205 },
        },
      ],
    },
    {
      id: 'obj-chws-chu',
      forceId: 'chu',
      primary: {
        title: { zh: '保彭城', en: 'Hold Pengcheng' },
        description: "Still hold Pengcheng and Xuchang in 194 — Long Ju went east to save Qi and died in the Wei's sand-dammed flood.",
        descriptionZh: "至194年仍據彭城、許昌 —— 龍且東救齊,死於濰水囊沙之下。西楚的本在彭城。",
        goal: { kind: 'hold-cities', cityIds: ['pengcheng', 'xuchang'], byYear: 194 },
      },
      secondary: [
        {
          title: { zh: '救齊之師', en: 'The Army Sent to Save Qi' },
          description: 'Hold Linzi by 194 and Guandu through 196 — Long Ju took twenty legions east and lost them all.',
          descriptionZh: "於194年前取臨淄、196年前仍守滎陽 —— 龍且將二十萬東救,全軍覆沒。",
          goal: { kind: 'hold-cities', cityIds: ['linzi'], byYear: 194 },
        },
        {
          title: { zh: '守住正面', en: 'Hold the Front' },
          description: 'Still hold Guandu and Hulao in 196.',
          descriptionZh: "至196年仍守滎陽、成皋(官渡、虎牢)。",
          goal: { kind: 'hold-cities', cityIds: ['guandu', 'hulao'], byYear: 196 },
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
        description: 'Destroy the Chu force by 192 — thirty legions, ten ambushes, and a night of homesick singing.',
        descriptionZh: "於192年前擊滅西楚 —— 十面埋伏,夜聞四面皆楚歌。",
        goal: { kind: 'defeat-force', forceId: 'chu', byYear: 192 },
      },
      secondary: [
        {
          title: { zh: '取彭城', en: 'Take Pengcheng' },
          description: 'Hold Pengcheng and Xiapi by 193.',
          descriptionZh: "於193年前取彭城、下邳 —— 西楚之都。",
          goal: { kind: 'hold-cities', cityIds: ['pengcheng', 'xiapi'], byYear: 193 },
        },
      ],
    },
    {
      id: 'obj-chgx-chu',
      forceId: 'chu',
      primary: {
        title: { zh: '不肯過江東', en: 'He Would Not Cross the River' },
        description: 'Survive to 195 and hold Pengcheng — Jiangdong had eight thousand sons left to give.',
        descriptionZh: "存續至195年並保有彭城 —— 江東子弟多才俊,捲土重來未可知。",
        goal: { kind: 'survive-until', year: 195 },
      },
      secondary: [
        {
          title: { zh: '收復失地', en: 'Win It Back' },
          description: "Take Chang'an and Luoyang by 200.",
          descriptionZh: "於200年前克復長安、洛陽 —— 天亡我,非戰之罪?那就再戰一次。",
          goal: { kind: 'hold-cities', cityIds: ['changan', 'luoyang'], byYear: 200 },
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
