import type { ScenarioObjective } from '../../types';

/** 劇本目標 · 春秋戰國盤 —— 純資料,唯一入口仍是 data/objectives.ts。 */
export const OBJ_WARRINGSTATES: Record<string, ScenarioObjective[]> = {
  'scn-ws-seven': [
    {
      id: 'obj-ws7-qin',
      forceId: 'qin',
      primary: {
        title: { zh: '據崤函之固', en: 'Behind the Passes of Xiao and Han' },
        description: "Still hold Chang'an, Hanguguan, Tongguan, Hanzhong and Chengdu in 200 — the base six generations built.",
        descriptionZh: "至200年仍據長安、函谷關、潼關、漢中、成都 —— 六世之餘烈,先是守得住這一塊。",
        goal: { kind: 'hold-cities', cityIds: ['changan', 'hanguguan', 'hanzhong'], byYear: 200 },
      },
      secondary: [
        {
          title: { zh: '橫掃六合', en: 'Sweep Up the Six' },
          description: 'Bring all under one banner — from behind the Hangu Pass, one province at a time.',
          descriptionZh: "混一天下 —— 據函谷之險,遠交而近攻,蠶食諸侯。",
          goal: { kind: 'unify-realm' },
        },
        {
          title: { zh: '東出函谷', en: 'East Through Hangu' },
          description: 'Take Luoyang and Chenliu by 200.',
          descriptionZh: "於200年前東取洛陽、陳留 —— 先取韓魏,則天下之樞在我。",
          goal: { kind: 'hold-cities', cityIds: ['luoyang', 'chenliu'], byYear: 200 },
        },
      ],
    },
    {
      id: 'obj-ws7-chu',
      forceId: 'chu',
      primary: {
        title: { zh: '地方五千里', en: 'Five Thousand Li of Land' },
        description: "Take Chang'an by 205 — the largest state has never once used its size.",
        descriptionZh: "於205年前西取長安 —— 楚地五千里,帶甲百萬,從未真正用出來過。",
        goal: { kind: 'hold-cities', cityIds: ['changan'], byYear: 205 },
      },
      secondary: [
        {
          title: { zh: '合縱抗秦', en: 'The Vertical Alliance' },
          description: 'Destroy the Qin force.',
          descriptionZh: "擊滅秦國 —— 楚雖三戶,亡秦必楚。",
          goal: { kind: 'defeat-force', forceId: 'qin' },
        },
      ],
    },
    {
      id: 'obj-ws7-qi',
      forceId: 'qi',
      primary: {
        title: { zh: '東帝之業', en: 'Emperor of the East' },
        description: 'Declare yourself emperor — Qin took the western title; take the eastern one.',
        descriptionZh: "稱帝建號 —— 秦為西帝,齊為東帝,本是說好的。",
        goal: { kind: 'declare-emperor' },
      },
      secondary: [
        {
          title: { zh: '稷下之盛', en: 'The Jixia Academy' },
          description: 'Still hold Linzi and Beihai in 200.',
          descriptionZh: "至200年仍保臨淄、北海 —— 稷下學宮,天下文樞。",
          goal: { kind: 'hold-cities', cityIds: ['linzi', 'beihai'], byYear: 200 },
        },
      ],
    },
    {
      id: 'obj-ws7-yan',
      forceId: 'yan',
      primary: {
        title: { zh: '黃金台', en: 'The Terrace of Gold' },
        description: 'Take Linzi by 198 — twenty-eight years of humiliation, repaid in one campaign.',
        descriptionZh: "於198年前攻取臨淄 —— 築黃金台以求士,雪二十八年之恥。",
        goal: { kind: 'hold-cities', cityIds: ['linzi'], byYear: 198 },
      },
    },
    {
      id: 'obj-ws7-zhao',
      forceId: 'zhao',
      primary: {
        title: { zh: '胡服騎射', en: 'Nomad Dress, Mounted Archery' },
        description: 'Take Taiyuan, Yanmen and Yunzhong by 195, then strike at Qin.',
        descriptionZh: "於195年前據太原、雁門、雲中 —— 胡服騎射,北取樓煩林胡之地。",
        goal: { kind: 'hold-cities', cityIds: ['taiyuan', 'yanmen', 'yunzhong'], byYear: 195 },
      },
      secondary: [
        {
          title: { zh: '自雲中襲秦', en: 'Down on Qin from Yunzhong' },
          description: "Take Chang'an by 205 — Wuling's own plan: ride south out of the steppe.",
          descriptionZh: "於205年前攻取長安 —— 武靈王的舊策:自雲中南襲咸陽。",
          goal: { kind: 'hold-cities', cityIds: ['changan'], byYear: 205 },
        },
      ],
    },
    {
      id: 'obj-ws7-wei',
      forceId: 'wei',
      primary: {
        title: { zh: '重整武卒', en: 'Rebuild the Wu Zu' },
        description: 'Hold Chenliu, Luoyang and Puyang by 198 — the first hegemon, fallen to a buffer state.',
        descriptionZh: "於198年前據陳留、洛陽、濮陽 —— 戰國首霸,如今夾在秦齊之間。",
        goal: { kind: 'hold-cities', cityIds: ['chenliu', 'luoyang', 'puyang'], byYear: 198 },
      },
    },
    {
      id: 'obj-ws7-han',
      forceId: 'han',
      primary: {
        title: { zh: '勁弩勁韓', en: 'The Crossbows of Han' },
        description: 'Still hold Luoyang and Xuchang in 200 — smallest of the seven, first to be eaten.',
        descriptionZh: "至200年仍保洛陽、許昌 —— 七雄之末,秦之近攻首當其衝。",
        goal: { kind: 'hold-cities', cityIds: ['luoyang', 'xuchang'], byYear: 200 },
      },
      secondary: [
        {
          title: { zh: '存韓', en: 'Han Survives' },
          description: 'Survive to 210.',
          descriptionZh: "存續至210年 —— 韓非入秦而死,他要保的就是這件事。",
          goal: { kind: 'survive-until', year: 210 },
        },
      ],
    },
  ],

  // Marquis Wen of Wei, the first hegemon
  'scn-ws-weiwen': [
    {
      id: 'obj-wswen-wei',
      forceId: 'wei',
      primary: {
        title: { zh: '盡取西河', en: 'Take the West of the River' },
        description: "Take Chang'an and Tongguan by 195 — Wu Qi held this line against Qin for decades.",
        descriptionZh: "於195年前西取長安、潼關 —— 吳起守西河,秦兵不敢東向。",
        goal: { kind: 'hold-cities', cityIds: ['changan', 'tongguan'], byYear: 195 },
      },
      secondary: [
        {
          title: { zh: '首霸中原', en: 'First Hegemon' },
          description: 'Hold Chenliu, Luoyang and Ye by 198.',
          descriptionZh: "於198年前據陳留、洛陽、鄴城 —— 用李悝變法,魏最先強。",
          goal: { kind: 'hold-cities', cityIds: ['chenliu', 'luoyang', 'ye'], byYear: 198 },
        },
      ],
    },
    {
      id: 'obj-wswen-qin',
      forceId: 'qin',
      primary: {
        title: { zh: '保關中', en: 'Hold Guanzhong' },
        description: "Still hold Chang'an, Chencang and Hanzhong in 195 — Qin before the reforms is the weakest of the seven.",
        descriptionZh: "至195年仍據長安、陳倉、漢中 —— 變法之前的秦是七國最弱的一個,先活下來。",
        goal: { kind: 'hold-cities', cityIds: ['changan', 'chencang', 'hanzhong'], byYear: 195 },
      },
      secondary: [
        {
          title: { zh: '收復河西', en: 'Win Back the West Bank' },
          description: "Still hold Chang'an in 195 — before Shang Yang, Qin is the weak one.",
          descriptionZh: "至195年仍守長安 —— 商鞅未至,此時的秦是弱國。",
          goal: { kind: 'hold-cities', cityIds: ['changan'], byYear: 195 },
        },
        {
          title: { zh: '終有天下', en: 'The Long Game' },
          description: 'Bring all under one banner.',
          descriptionZh: "混一天下。",
          goal: { kind: 'unify-realm' },
        },
      ],
    },
    {
      id: 'obj-wswen-zhao',
      forceId: 'zhao',
      primary: {
        title: { zh: '三晉之分', en: 'The Three Jin Divide' },
        description: 'Take Ye and Shangdang by 198.',
        descriptionZh: "於198年前據鄴城、上黨 —— 三家分晉,魏最強而趙不甘。",
        goal: { kind: 'hold-cities', cityIds: ['ye', 'shangdang'], byYear: 198 },
      },
    },
    {
      id: 'obj-wswen-chu',
      forceId: 'chu',
      primary: {
        title: { zh: '吳起變法', en: "Wu Qi's Reforms" },
        description: 'Take Wancheng and Xuchang by 200 — Wu Qi went south after Wei drove him out.',
        descriptionZh: "於200年前北取宛城、許昌 —— 吳起去魏入楚,楚亦可強。",
        goal: { kind: 'hold-cities', cityIds: ['wancheng', 'xuchang'], byYear: 200 },
      },
    },
  ],

  // Shang Yang's reforms
  'scn-ws-shangyang': [
    {
      id: 'obj-wssy-qin',
      forceId: 'qin',
      primary: {
        title: { zh: '法行十年', en: 'Ten Years of the Law' },
        description: "Still hold Chang'an, Tongguan and Chencang in 200 — the law needs a decade before it needs an army.",
        descriptionZh: "至200年仍據長安、潼關、陳倉 —— 法行十年,秦民大悅,道不拾遺;東出是那之後的事。",
        goal: { kind: 'hold-cities', cityIds: ['changan', 'tongguan', 'chencang'], byYear: 200 },
      },
      secondary: [
        {
          title: { zh: '徙木立信', en: 'The Pole at the South Gate' },
          description: 'Take Tongguan, Luoyang and Chenliu by 200 — law before conquest, then conquest.',
          descriptionZh: "於200年前東取潼關、洛陽、陳留 —— 先立法,後出兵。",
          goal: { kind: 'hold-cities', cityIds: ['tongguan', 'luoyang', 'chenliu'], byYear: 200 },
        },
        {
          title: { zh: '席捲天下', en: 'Roll Up the Realm' },
          description: 'Bring all under one banner.',
          descriptionZh: "混一天下 —— 有席捲天下、包舉宇內之意。",
          goal: { kind: 'unify-realm' },
        },
      ],
    },
    {
      id: 'obj-wssy-wei',
      forceId: 'wei',
      primary: {
        title: { zh: '悔不殺鞅', en: 'We Should Have Killed Him' },
        description: 'Destroy the Qin force by 205 — you had Shang Yang in your court and let him go west.',
        descriptionZh: "於205年前擊滅秦國 —— 公叔痤說「不用則殺之」,你沒有聽。",
        goal: { kind: 'defeat-force', forceId: 'qin', byYear: 205 },
      },
      secondary: [
        {
          title: { zh: '保有河西', en: 'Keep the West Bank' },
          description: 'Still hold Chenliu and Luoyang in 198.',
          descriptionZh: "至198年仍保陳留、洛陽。",
          goal: { kind: 'hold-cities', cityIds: ['chenliu', 'luoyang'], byYear: 198 },
        },
      ],
    },
    {
      id: 'obj-wssy-chu',
      forceId: 'chu',
      primary: {
        title: { zh: '合縱長', en: 'Lead the Vertical Alliance' },
        description: "Take Chang'an by 208.",
        descriptionZh: "於208年前攻取長安 —— 六國合縱,楚為縱長。",
        goal: { kind: 'hold-cities', cityIds: ['changan'], byYear: 208 },
      },
    },
    {
      id: 'obj-wssy-qi',
      forceId: 'qi',
      primary: {
        title: { zh: '東方之強', en: 'The Strength of the East' },
        description: 'Hold Linzi, Pengcheng and Xiapi by 200.',
        descriptionZh: "於200年前據臨淄、彭城、下邳 —— 秦強於西,齊當強於東。",
        goal: { kind: 'hold-cities', cityIds: ['linzi', 'pengcheng', 'xiapi'], byYear: 200 },
      },
    },
  ],

  // Surround Wei to rescue Zhao
  'scn-ws-guiling': [
    {
      id: 'obj-wsgl-qi',
      forceId: 'qi',
      primary: {
        title: { zh: '圍魏救趙', en: 'Surround Wei to Rescue Zhao' },
        description: "Take Chenliu by 195 — strike the capital, not the siege.",
        descriptionZh: "於195年前攻取陳留 —— 批亢擣虛,不救邯鄲而攻大梁。",
        goal: { kind: 'hold-cities', cityIds: ['chenliu'], byYear: 195 },
      },
      secondary: [
        {
          title: { zh: '減灶誘敵', en: 'Fewer Cooking Fires Each Day' },
          description: 'Destroy the Wei force by 202 — Sun Bin owes Pang Juan a death.',
          descriptionZh: "於202年前擊滅魏國 —— 孫臏與龐涓之間,還有一筆帳。",
          goal: { kind: 'defeat-force', forceId: 'wei', byYear: 202 },
        },
      ],
    },
    {
      id: 'obj-wsgl-wei',
      forceId: 'wei',
      primary: {
        title: { zh: '拔邯鄲', en: 'Storm Handan' },
        description: 'Take Ye by 195 and still hold Chenliu — take Zhao before Qi reaches your capital.',
        descriptionZh: "於195年前攻下鄴城,且陳留不失 —— 要在齊軍抵達大梁之前拿下邯鄲。",
        goal: { kind: 'hold-cities', cityIds: ['ye', 'chenliu'], byYear: 195 },
      },
    },
    {
      id: 'obj-wsgl-zhao',
      forceId: 'zhao',
      primary: {
        title: { zh: '邯鄲不陷', en: 'Handan Holds' },
        description: 'Still hold Ye in 196.',
        descriptionZh: "至196年仍據鄴城 —— 齊之救兵未必來得及,先守住再說。",
        goal: { kind: 'hold-cities', cityIds: ['ye'], byYear: 196 },
      },
    },
    {
      id: 'obj-wsgl-qin',
      forceId: 'qin',
      primary: {
        title: { zh: '坐觀三晉', en: 'Watch the Three Jins' },
        description: "Still hold Chang'an, Tongguan and Hanzhong in 202 — let Wei and Qi bleed each other first.",
        descriptionZh: "至202年仍據長安、潼關、漢中 —— 三晉相攻,秦坐收其弊,此時不必東出。",
        goal: { kind: 'hold-cities', cityIds: ['changan', 'tongguan', 'hanzhong'], byYear: 202 },
      },
      secondary: [
        {
          title: { zh: '坐觀三晉', en: 'Watch the Three Jin Bleed' },
          description: 'Take Luoyang and Tongguan by 202 — let Wei and Qi wear each other out.',
          descriptionZh: "於202年前東取洛陽、潼關 —— 三晉相攻,秦收其利。",
          goal: { kind: 'hold-cities', cityIds: ['luoyang', 'tongguan'], byYear: 202 },
        },
      ],
    },
  ],

  // Five states attack Qin at Hangu
  'scn-ws-hangu': [
    {
      id: 'obj-wshg-qin',
      forceId: 'qin',
      primary: {
        title: { zh: '函谷不開', en: 'The Pass Does Not Open' },
        description: 'Still hold Hanguguan and Tongguan in 198 — one pass, five armies.',
        descriptionZh: "至198年仍守函谷關、潼關 —— 五國之師百萬,叩關而攻。",
        goal: { kind: 'hold-cities', cityIds: ['hanguguan', 'tongguan'], byYear: 198 },
      },
      secondary: [
        {
          title: { zh: '連橫破縱', en: 'Break the Alliance' },
          description: 'Destroy the Chu force — the vertical alliance dies when Chu leaves it.',
          descriptionZh: "擊滅楚國 —— 縱長既去,合縱自散。",
          goal: { kind: 'defeat-force', forceId: 'chu' },
        },
      ],
    },
    {
      id: 'obj-wshg-chu',
      forceId: 'chu',
      primary: {
        title: { zh: '叩關而攻', en: 'Beat on the Gate' },
        description: "Take Hanguguan and Chang'an by 200.",
        descriptionZh: "於200年前破函谷關、入長安 —— 合縱之師,唯一一次真正打到關下。",
        goal: { kind: 'hold-cities', cityIds: ['hanguguan', 'changan'], byYear: 200 },
      },
    },
    {
      id: 'obj-wshg-zhao',
      forceId: 'zhao',
      primary: {
        title: { zh: '趙師西向', en: 'Zhao Marches West' },
        description: "Take Tongguan and Chang'an by 202.",
        descriptionZh: "於202年前取潼關、長安。",
        goal: { kind: 'hold-cities', cityIds: ['tongguan', 'changan'], byYear: 202 },
      },
    },
    {
      id: 'obj-wshg-wei',
      forceId: 'wei',
      primary: {
        title: { zh: '五國之一', en: 'One of the Five' },
        description: 'Take Luoyang and Tongguan by 200.',
        descriptionZh: "於200年前取洛陽、潼關。",
        goal: { kind: 'hold-cities', cityIds: ['luoyang', 'tongguan'], byYear: 200 },
      },
    },
    {
      id: 'obj-wshg-qi',
      forceId: 'qi',
      primary: {
        title: { zh: '不與西事', en: 'Stay Out of the West' },
        description: 'Hold Linzi, Pengcheng and Langya by 200 — let the others break themselves on the pass.',
        descriptionZh: "於200年前據臨淄、彭城、琅琊 —— 遠交近攻,齊之所以最後亡。",
        goal: { kind: 'hold-cities', cityIds: ['linzi', 'pengcheng', 'langya'], byYear: 200 },
      },
    },
  ],

  // The battle of Yique
  'scn-ws-yique': [
    {
      id: 'obj-wsyq-qin',
      forceId: 'qin',
      primary: {
        title: { zh: '伊闕斬首', en: 'The Slaughter at Yique' },
        description: 'Take Luoyang and Xuchang by 195 — Bai Qi against two armies that will not fight together.',
        descriptionZh: "於195年前取洛陽、許昌 —— 白起以寡擊眾,韓魏各自為戰。",
        goal: { kind: 'hold-cities', cityIds: ['luoyang', 'xuchang'], byYear: 195 },
      },
      secondary: [
        {
          title: { zh: '滅韓', en: 'End Han' },
          description: 'Destroy the Han force by 205.',
          descriptionZh: "於205年前滅韓 —— 近攻之始。",
          goal: { kind: 'defeat-force', forceId: 'han', byYear: 205 },
        },
      ],
    },
    {
      id: 'obj-wsyq-han',
      forceId: 'han',
      primary: {
        title: { zh: '韓魏合軍', en: 'Han and Wei Must Fight as One' },
        description: 'Still hold Luoyang and Xuchang in 198 — the defeat came from each waiting for the other.',
        descriptionZh: "至198年仍保洛陽、許昌 —— 伊闕之敗,敗在兩軍互相觀望。",
        goal: { kind: 'hold-cities', cityIds: ['luoyang', 'xuchang'], byYear: 198 },
      },
    },
    {
      id: 'obj-wsyq-wei',
      forceId: 'wei',
      primary: {
        title: { zh: '不作壁上觀', en: 'Do Not Stand and Watch' },
        description: 'Still hold Chenliu and Puyang in 198, and hold Luoyang too.',
        descriptionZh: "至198年仍保陳留、濮陽,並據洛陽 —— 這一次不要讓韓軍獨當秦鋒。",
        goal: { kind: 'hold-cities', cityIds: ['chenliu', 'puyang', 'luoyang'], byYear: 198 },
      },
    },
    {
      id: 'obj-wsyq-zhao',
      forceId: 'zhao',
      primary: {
        title: { zh: '趙不可獨存', en: 'Zhao Cannot Stand Alone Either' },
        description: 'Take Shangdang and Luoyang by 202.',
        descriptionZh: "於202年前取上黨、洛陽 —— 韓魏若亡,趙即當秦鋒。",
        goal: { kind: 'hold-cities', cityIds: ['shangdang', 'luoyang'], byYear: 202 },
      },
    },
  ],

  // The Yan-Ying campaign
  'scn-ws-yanying': [
    {
      id: 'obj-wsyy-qin',
      forceId: 'qin',
      primary: {
        title: { zh: '水灌鄢城', en: 'Flood Yan' },
        description: 'Take Xiangyang and Jiangling by 196 — Bai Qi dammed the river and drowned a city.',
        descriptionZh: "於196年前取襄陽、江陵 —— 白起決夷水以灌鄢城,再拔郢都。",
        goal: { kind: 'hold-cities', cityIds: ['xiangyang', 'jiangling'], byYear: 196 },
      },
      secondary: [
        {
          title: { zh: '燒夷陵', en: 'Burn Yiling' },
          description: 'Hold Yiling by 198 — the tombs of the Chu kings.',
          descriptionZh: "於198年前據夷陵 —— 燒楚先王之墓,楚人自此不能復振。",
          goal: { kind: 'hold-cities', cityIds: ['yiling'], byYear: 198 },
        },
      ],
    },
    {
      id: 'obj-wsyy-chu',
      forceId: 'chu',
      primary: {
        title: { zh: '郢都不失', en: 'Ying Shall Not Fall' },
        description: 'Still hold Jiangling and Yiling in 198 — after this, Chu never came back west.',
        descriptionZh: "至198年仍保江陵、夷陵 —— 郢都一失,楚就再也沒有回到過西邊。",
        goal: { kind: 'hold-cities', cityIds: ['jiangling', 'yiling'], byYear: 198 },
      },
      secondary: [
        {
          title: { zh: '亡秦必楚', en: 'Chu Will Be the End of Qin' },
          description: 'Destroy the Qin force.',
          descriptionZh: "擊滅秦國 —— 楚雖三戶,亡秦必楚。",
          goal: { kind: 'defeat-force', forceId: 'qin' },
        },
      ],
    },
    {
      id: 'obj-wsyy-qi',
      forceId: 'qi',
      primary: {
        title: { zh: '秦楚相攻', en: 'Let Qin and Chu Fight' },
        description: 'Hold Linzi and Pengcheng by 198.',
        descriptionZh: "於198年前據臨淄、彭城。",
        goal: { kind: 'hold-cities', cityIds: ['linzi', 'pengcheng'], byYear: 198 },
      },
    },
    {
      id: 'obj-wsyy-zhao',
      forceId: 'zhao',
      primary: {
        title: { zh: '北方獨強', en: 'The Last Strong State in the North' },
        description: 'Hold Ye, Taiyuan and Shangdang by 198.',
        descriptionZh: "於198年前據鄴城、太原、上黨 —— 楚既弱,能抗秦者唯趙。",
        goal: { kind: 'hold-cities', cityIds: ['ye', 'taiyuan', 'shangdang'], byYear: 198 },
      },
    },
  ],

  // The battle of Yuyu
  'scn-ws-yuyu': [
    {
      id: 'obj-wsyu-zhao',
      forceId: 'zhao',
      primary: {
        title: { zh: '狹路相逢勇者勝', en: 'In a Narrow Road, the Brave Win' },
        description: 'Hold Shangdang and Taiyuan by 195 — Zhao She marched thirty li out and then ran.',
        descriptionZh: "於195年前據上黨、太原 —— 趙奢去邯鄲三十里而止,再一日一夜疾趨。",
        goal: { kind: 'hold-cities', cityIds: ['shangdang', 'taiyuan'], byYear: 195 },
      },
      secondary: [
        {
          title: { zh: '再破秦軍', en: 'Beat Qin Again' },
          description: 'Destroy the Qin force by 208 — Yuyu is the only field defeat Qin took in this era.',
          descriptionZh: "於208年前擊滅秦國 —— 閼與是這個時代秦唯一一次野戰大敗。",
          goal: { kind: 'defeat-force', forceId: 'qin', byYear: 208 },
        },
      ],
    },
    {
      id: 'obj-wsyu-qin',
      forceId: 'qin',
      primary: {
        title: { zh: '關中之固', en: 'Guanzhong Unshaken' },
        description: "Still hold Chang'an, Tongguan and Hanzhong in 196 — Yuyu was the one defeat; it cost Qin nothing at home.",
        descriptionZh: "至196年仍據長安、潼關、漢中 —— 閼與是秦東出以來唯一的敗仗,而關中未損分毫。",
        goal: { kind: 'hold-cities', cityIds: ['changan', 'tongguan', 'hanzhong'], byYear: 196 },
      },
      secondary: [
        {
          title: { zh: '取閼與', en: 'Take Yuyu' },
          description: 'Take Shangdang by 196 — a road too narrow for the loser to retreat.',
          descriptionZh: "於196年前攻取上黨 —— 其道遠險狹,譬之猶兩鼠鬥於穴中。",
          goal: { kind: 'hold-cities', cityIds: ['shangdang'], byYear: 196 },
        },
      ],
    },
    {
      id: 'obj-wsyu-wei',
      forceId: 'wei',
      primary: {
        title: { zh: '援趙', en: 'Reinforce Zhao' },
        description: 'Hold Luoyang and Chenliu by 198.',
        descriptionZh: "於198年前據洛陽、陳留 —— 趙若敗,魏即當其鋒。",
        goal: { kind: 'hold-cities', cityIds: ['luoyang', 'chenliu'], byYear: 198 },
      },
    },
    {
      id: 'obj-wsyu-han',
      forceId: 'han',
      primary: {
        title: { zh: '上黨之歸', en: 'Where Shangdang Goes' },
        description: 'Take Shangdang by 200 — whoever holds it decides the next war.',
        descriptionZh: "於200年前取上黨 —— 上黨歸誰,下一場大戰就在哪裡打。",
        goal: { kind: 'hold-cities', cityIds: ['shangdang'], byYear: 200 },
      },
    },
  ],

  // King Min of Qi takes the imperial title
  'scn-ws-qimin': [
    {
      id: 'obj-wsqm-qi',
      forceId: 'qi',
      primary: {
        title: { zh: '南面稱帝', en: 'Emperor of the East' },
        description: 'Declare yourself emperor and take Shouchun by 198 — Qi at its height swallowed Song.',
        descriptionZh: "稱帝建號並於198年前取壽春 —— 齊之極盛,滅宋而稱東帝。",
        goal: { kind: 'declare-emperor' },
      },
      secondary: [
        {
          title: { zh: '滅宋取淮', en: 'Swallow Song' },
          description: 'Hold Pengcheng, Xiapi and Shouchun by 198.',
          descriptionZh: "於198年前據彭城、下邳、壽春 —— 得宋地則齊愈驕,諸侯愈懼。",
          goal: { kind: 'hold-cities', cityIds: ['pengcheng', 'xiapi', 'shouchun'], byYear: 198 },
        },
      ],
    },
    {
      id: 'obj-wsqm-qin',
      forceId: 'qin',
      primary: {
        title: { zh: '去帝號以孤齊', en: 'Drop the Title, Isolate Qi' },
        description: 'Destroy the Qi force by 208 — Qin gave up the western title so Qi would stand alone.',
        descriptionZh: "於208年前擊滅齊國 —— 秦自去帝號,正為使齊獨當眾怒。",
        goal: { kind: 'defeat-force', forceId: 'qi', byYear: 208 },
      },
    },
    {
      id: 'obj-wsqm-yan',
      forceId: 'yan',
      primary: {
        title: { zh: '待時而動', en: 'Wait, Then Strike' },
        description: 'Take Linzi by 200 — Yan has been preparing this for twenty-eight years.',
        descriptionZh: "於200年前攻取臨淄 —— 燕昭王等這一天等了二十八年。",
        goal: { kind: 'hold-cities', cityIds: ['linzi'], byYear: 200 },
      },
    },
    {
      id: 'obj-wsqm-chu',
      forceId: 'chu',
      primary: {
        title: { zh: '淮北之爭', en: 'The Fight for Huaibei' },
        description: 'Hold Shouchun and Pengcheng by 200.',
        descriptionZh: "於200年前據壽春、彭城 —— 宋地之利,楚亦欲得。",
        goal: { kind: 'hold-cities', cityIds: ['shouchun', 'pengcheng'], byYear: 200 },
      },
    },
  ],

  // Yue Yi's campaign against Qi
  'scn-ws-yueyi': [
    {
      id: 'obj-wsyi-yan',
      forceId: 'yan',
      primary: {
        title: { zh: '下齊七十餘城', en: 'Seventy Cities in Six Months' },
        description: 'Take Linzi, Beihai and Langya by 196 — five states marched; only Yue Yi kept going.',
        descriptionZh: "於196年前取臨淄、北海、琅琊 —— 五國之師既還,獨樂毅引燕軍深入。",
        goal: { kind: 'hold-cities', cityIds: ['linzi', 'beihai', 'langya'], byYear: 196 },
      },
      secondary: [
        {
          title: { zh: '滅齊', en: 'End Qi' },
          description: 'Destroy the Qi force by 202 — two cities held out for five years in history.',
          descriptionZh: "於202年前滅齊 —— 史書上,莒與即墨守了五年,燕功敗垂成。",
          goal: { kind: 'defeat-force', forceId: 'qi', byYear: 202 },
        },
      ],
    },
    {
      id: 'obj-wsyi-qi',
      forceId: 'qi',
      primary: {
        title: { zh: '莒與即墨', en: 'Ju and Jimo' },
        description: 'Survive to 200, then retake Linzi — two cities are enough to come back from.',
        descriptionZh: "存續至200年,再復臨淄 —— 只剩兩城,也還能復國。",
        goal: { kind: 'survive-until', year: 200 },
      },
      secondary: [
        {
          title: { zh: '復齊七十城', en: 'Retake the Seventy' },
          description: 'Hold Linzi and Beihai by 205.',
          descriptionZh: "於205年前收復臨淄、北海。",
          goal: { kind: 'hold-cities', cityIds: ['linzi', 'beihai'], byYear: 205 },
        },
      ],
    },
    {
      id: 'obj-wsyi-qin',
      forceId: 'qin',
      primary: {
        title: { zh: '東方兩敗', en: 'The East Ruins Itself' },
        description: "Still hold Chang'an, Tongguan and Hanzhong in 200 — Qi and Yan are destroying the only rival Qin feared.",
        descriptionZh: "至200年仍據長安、潼關、漢中 —— 齊燕互毀,秦所畏者自去,不必費一兵。",
        goal: { kind: 'hold-cities', cityIds: ['changan', 'tongguan', 'hanzhong'], byYear: 200 },
      },
      secondary: [
        {
          title: { zh: '東方兩敗', en: 'Both Eastern Powers Bleed' },
          description: 'Take Luoyang, Chenliu and Shangdang by 200.',
          descriptionZh: "於200年前取洛陽、陳留、上黨 —— 燕齊相殘,秦得從容東出。",
          goal: { kind: 'hold-cities', cityIds: ['luoyang', 'chenliu', 'shangdang'], byYear: 200 },
        },
      ],
    },
    {
      id: 'obj-wsyi-zhao',
      forceId: 'zhao',
      primary: {
        title: { zh: '受樂毅', en: 'Shelter Yue Yi' },
        description: 'Hold Ye, Shangdang and Taiyuan by 200 — Yue Yi ended his life in Zhao.',
        descriptionZh: "於200年前據鄴城、上黨、太原 —— 樂毅最後奔趙,趙封之於觀津。",
        goal: { kind: 'hold-cities', cityIds: ['ye', 'shangdang', 'taiyuan'], byYear: 200 },
      },
    },
  ],

  // The battle of Changping
  'scn-ws-changping': [
    {
      id: 'obj-wscp-qin',
      forceId: 'qin',
      primary: {
        title: { zh: '取上黨', en: 'Take Shangdang' },
        description: "Hold Shangdang by 198 — the plateau is what the whole war was fought for.",
        descriptionZh: "於198年前據上黨 —— 這場仗打的就是這片高地;邯鄲是後話。",
        goal: { kind: 'hold-cities', cityIds: ['shangdang'], byYear: 198 },
      },
      secondary: [
        {
          title: { zh: '長平坑降', en: 'The Pit at Changping' },
          description: 'Take Shangdang and Ye by 198 — swap the general in secret, cut the supply road, then wait.',
          descriptionZh: "於198年前取上黨、鄴城 —— 陰使武安君為將,絕其糧道,然後圍之。",
          goal: { kind: 'hold-cities', cityIds: ['shangdang', 'ye'], byYear: 198 },
        },
        {
          title: { zh: '滅趙', en: 'End Zhao' },
          description: 'Destroy the Zhao force by 205.',
          descriptionZh: "於205年前滅趙 —— 趙卒四十萬既坑,邯鄲可下。",
          goal: { kind: 'defeat-force', forceId: 'zhao', byYear: 205 },
        },
      ],
    },
    {
      id: 'obj-wscp-zhao',
      forceId: 'zhao',
      primary: {
        title: { zh: '毋易廉頗', en: 'Do Not Replace Lian Po' },
        description: 'Still hold Shangdang and Ye in 200 — Lian Po held the line; the swap lost the war.',
        descriptionZh: "至200年仍保上黨、鄴城 —— 廉頗堅壁不出,換上趙括才是敗因。",
        goal: { kind: 'hold-cities', cityIds: ['shangdang', 'ye'], byYear: 200 },
      },
      secondary: [
        {
          title: { zh: '趙不亡', en: 'Zhao Survives' },
          description: 'Survive to 210.',
          descriptionZh: "存續至210年 —— 四十萬人的性命,換一個活下去的趙國。",
          goal: { kind: 'survive-until', year: 210 },
        },
      ],
    },
    {
      id: 'obj-wscp-wei',
      forceId: 'wei',
      primary: {
        title: { zh: '救趙與否', en: 'Whether to Save Zhao' },
        description: 'Hold Chenliu and Luoyang by 198, and take Shangdang — Zhao falling means Wei is next.',
        descriptionZh: "於198年前據陳留、洛陽並取上黨 —— 趙亡則魏為秦之鄰。",
        goal: { kind: 'hold-cities', cityIds: ['chenliu', 'luoyang', 'shangdang'], byYear: 198 },
      },
    },
    {
      id: 'obj-wscp-chu',
      forceId: 'chu',
      primary: {
        title: { zh: '北救之師', en: 'The Army from the South' },
        description: 'Take Xuchang and Luoyang by 200.',
        descriptionZh: "於200年前北取許昌、洛陽 —— 春申君將兵救趙,楚亦不能坐視。",
        goal: { kind: 'hold-cities', cityIds: ['xuchang', 'luoyang'], byYear: 200 },
      },
    },
  ],

  // The siege of Handan
  'scn-ws-handan': [
    {
      id: 'obj-wshd-qin',
      forceId: 'qin',
      primary: {
        title: { zh: '河東不失', en: 'Hold What Was Won' },
        description: "Still hold Shangdang and Tongguan in 200 — the siege failed; the plateau taken at Changping did not.",
        descriptionZh: "至200年仍據上黨、潼關 —— 邯鄲圍三年不下而還,長平所得的高地卻沒有丟。",
        goal: { kind: 'hold-cities', cityIds: ['shangdang', 'tongguan'], byYear: 200 },
      },
      secondary: [
        {
          title: { zh: '圍邯鄲', en: 'Besiege Handan' },
          description: 'Take Ye by 197 — Bai Qi refused this campaign and was ordered to die for it.',
          descriptionZh: "於197年前攻下鄴城 —— 武安君稱病不行,終賜劍杜郵。",
          goal: { kind: 'hold-cities', cityIds: ['ye'], byYear: 197 },
        },
        {
          title: { zh: '滅趙', en: 'End Zhao' },
          description: 'Destroy the Zhao force by 205.',
          descriptionZh: "於205年前滅趙。",
          goal: { kind: 'defeat-force', forceId: 'zhao', byYear: 205 },
        },
      ],
    },
    {
      id: 'obj-wshd-zhao',
      forceId: 'zhao',
      primary: {
        title: { zh: '邯鄲三年', en: 'Three Years Under Siege' },
        description: 'Still hold Ye in 200 — after Changping, with the city eating its own dead.',
        descriptionZh: "至200年仍守鄴城 —— 長平之後,城中析骨而炊,易子而食。",
        goal: { kind: 'hold-cities', cityIds: ['ye'], byYear: 200 },
      },
      secondary: [
        {
          title: { zh: '反攻', en: 'Push Them Back' },
          description: 'Take Shangdang and Taiyuan by 205.',
          descriptionZh: "於205年前收復上黨、太原 —— 圍解之後,失地當復。",
          goal: { kind: 'hold-cities', cityIds: ['shangdang', 'taiyuan'], byYear: 205 },
        },
      ],
    },
    {
      id: 'obj-wshd-wei',
      forceId: 'wei',
      primary: {
        title: { zh: '竊符救趙', en: 'Steal the Tally, Save Zhao' },
        description: 'Take Ye by 198 while holding Chenliu — Lord Xinling killed his own general for the seal.',
        descriptionZh: "於198年前援取鄴城且陳留不失 —— 信陵君椎殺晉鄙,奪符而後救趙。",
        goal: { kind: 'hold-cities', cityIds: ['ye', 'chenliu'], byYear: 198 },
      },
    },
    {
      id: 'obj-wshd-chu',
      forceId: 'chu',
      primary: {
        title: { zh: '毛遂自薦', en: 'Mao Sui Recommends Himself' },
        description: 'Take Luoyang and Xuchang by 200 — Chu agreed to the alliance under a sword.',
        descriptionZh: "於200年前北取洛陽、許昌 —— 毛遂按劍而前,楚王乃許合縱。",
        goal: { kind: 'hold-cities', cityIds: ['luoyang', 'xuchang'], byYear: 200 },
      },
    },
  ],

  // Tian Dan restores Qi
  'scn-ws-tiandan': [
    {
      id: 'obj-wstd-qi',
      forceId: 'qi',
      primary: {
        title: { zh: '火牛陣', en: 'The Fire Oxen' },
        description: 'Retake Linzi and Beihai by 196 — a thousand oxen, blades on their horns, reeds alight on their tails.',
        descriptionZh: "於196年前收復臨淄、北海 —— 牛千餘,束兵刃於角,灌脂束葦於尾而燒之。",
        goal: { kind: 'hold-cities', cityIds: ['linzi', 'beihai'], byYear: 196 },
      },
      secondary: [
        {
          title: { zh: '復七十餘城', en: 'All Seventy Back' },
          description: 'Destroy the Yan force by 205.',
          descriptionZh: "於205年前逐燕出境 —— 七十餘城,一城不留。",
          goal: { kind: 'defeat-force', forceId: 'yan', byYear: 205 },
        },
      ],
    },
    {
      id: 'obj-wstd-yan',
      forceId: 'yan',
      primary: {
        title: { zh: '毋易樂毅', en: 'Do Not Recall Yue Yi' },
        description: 'Still hold Linzi and Langya in 200 — the reversal began with a change of general.',
        descriptionZh: "至200年仍保臨淄、琅琊 —— 敗局起於騎劫代將。",
        goal: { kind: 'hold-cities', cityIds: ['linzi', 'langya'], byYear: 200 },
      },
    },
    {
      id: 'obj-wstd-qin',
      forceId: 'qin',
      primary: {
        title: { zh: '遠交近攻', en: 'Befriend the Far, Strike the Near' },
        description: "Still hold Chang'an, Tongguan, Hanzhong and Chengdu in 200 — while Yan and Qi ruin each other, consolidate.",
        descriptionZh: "至200年仍據長安、潼關、漢中、成都 —— 燕齊兩弊之際,范雎之策是先固其本。",
        goal: { kind: 'hold-cities', cityIds: ['changan', 'tongguan', 'hanzhong'], byYear: 200 },
      },
      secondary: [
        {
          title: { zh: '遠交近攻', en: 'Befriend the Far, Attack the Near' },
          description: 'Take Luoyang, Xuchang and Shangdang by 200.',
          descriptionZh: "於200年前取洛陽、許昌、上黨 —— 范雎之策,自韓魏始。",
          goal: { kind: 'hold-cities', cityIds: ['luoyang', 'xuchang', 'shangdang'], byYear: 200 },
        },
      ],
    },
    {
      id: 'obj-wstd-zhao',
      forceId: 'zhao',
      primary: {
        title: { zh: '燕齊兩弊', en: 'Both Neighbours Exhausted' },
        description: 'Hold Ye, Taiyuan and Shangdang by 198.',
        descriptionZh: "於198年前據鄴城、太原、上黨。",
        goal: { kind: 'hold-cities', cityIds: ['ye', 'taiyuan', 'shangdang'], byYear: 198 },
      },
    },
  ],

  // Qin swallows the six states
  'scn-ws-qin-unify': [
    {
      id: 'obj-wsqu-qin',
      forceId: 'qin',
      primary: {
        title: { zh: '六王畢,四海一', en: 'Six Kings Ended, the Realm One' },
        description: 'Bring all under one banner — ten years, six states, in order.',
        descriptionZh: "混一天下 —— 十年之間,韓趙魏楚燕齊,以次而滅。",
        goal: { kind: 'unify-realm' },
      },
      secondary: [
        {
          title: { zh: '先滅韓趙', en: 'Han and Zhao First' },
          description: 'Destroy the Han force by 195.',
          descriptionZh: "於195年前滅韓 —— 六國之滅,自韓始。",
          goal: { kind: 'defeat-force', forceId: 'han', byYear: 195 },
        },
      ],
    },
    {
      id: 'obj-wsqu-chu',
      forceId: 'chu',
      primary: {
        title: { zh: '非六十萬不可', en: 'It Will Take Six Hundred Thousand' },
        description: "Destroy the Qin force by 208 — Xiang Yan broke Li Xin's twenty legions before Wang Jian came.",
        descriptionZh: "於208年前擊滅秦國 —— 項燕破李信二十萬,直到王翦以六十萬來。",
        goal: { kind: 'defeat-force', forceId: 'qin', byYear: 208 },
      },
      secondary: [
        {
          title: { zh: '守郢壽春', en: 'Hold the Southern Capitals' },
          description: 'Still hold Jiangling and Shouchun in 200.',
          descriptionZh: "至200年仍保江陵、壽春。",
          goal: { kind: 'hold-cities', cityIds: ['jiangling', 'shouchun'], byYear: 200 },
        },
      ],
    },
    {
      id: 'obj-wsqu-zhao',
      forceId: 'zhao',
      primary: {
        title: { zh: '李牧在,趙不亡', en: 'While Li Mu Lives' },
        description: 'Still hold Ye and Taiyuan in 202 — Zhao fell to a bribe, not to an army.',
        descriptionZh: "至202年仍保鄴城、太原 —— 趙不是敗於秦軍,是敗於一筆賄賂。",
        goal: { kind: 'hold-cities', cityIds: ['ye', 'taiyuan'], byYear: 202 },
      },
    },
    {
      id: 'obj-wsqu-qi',
      forceId: 'qi',
      primary: {
        title: { zh: '不助五國者亡', en: 'The Last to Fall, and the Easiest' },
        description: 'Survive to 212 — Qi surrendered without a battle after watching five states die.',
        descriptionZh: "存續至212年 —— 齊坐視五國之亡,最後不戰而降。",
        goal: { kind: 'survive-until', year: 212 },
      },
      secondary: [
        {
          title: { zh: '西向抗秦', en: 'Fight, This Time' },
          description: 'Take Pengcheng, Chenliu and Luoyang by 205.',
          descriptionZh: "於205年前西取彭城、陳留、洛陽 —— 這一次不要等到最後。",
          goal: { kind: 'hold-cities', cityIds: ['pengcheng', 'chenliu', 'luoyang'], byYear: 205 },
        },
      ],
    },
    {
      id: 'obj-wsqu-wei',
      forceId: 'wei',
      primary: {
        title: { zh: '大梁不灌', en: 'Do Not Let Them Flood Daliang' },
        description: 'Still hold Chenliu and Puyang in 200 — Wang Ben turned the Yellow River onto the city.',
        descriptionZh: "至200年仍保陳留、濮陽 —— 王賁引河溝灌大梁,三月城壞。",
        goal: { kind: 'hold-cities', cityIds: ['chenliu', 'puyang'], byYear: 200 },
      },
    },
    {
      id: 'obj-wsqu-yan',
      forceId: 'yan',
      primary: {
        title: { zh: '風蕭蕭兮易水寒', en: 'The Wind is Cold on the Yi River' },
        description: "Take Chang'an by 205 — a dagger in a map roll was the other plan.",
        descriptionZh: "於205年前攻取長安 —— 圖窮匕見是另一條路,這條路要用兵。",
        goal: { kind: 'hold-cities', cityIds: ['changan'], byYear: 205 },
      },
    },
    {
      id: 'obj-wsqu-han',
      forceId: 'han',
      primary: {
        title: { zh: '存韓', en: 'Preserve Han' },
        description: 'Survive to 200 — Han is first on the list.',
        descriptionZh: "存續至200年 —— 名單上的第一個就是你。",
        goal: { kind: 'survive-until', year: 200 },
      },
    },
  ],

  // ───────────────────────────────────────────────────────────────────────
  // Chu-Han. Same map and calendar caveat as the Warring States boards.
  // Chang'an = Xianyang, Pengcheng = Western Chu's capital, Guandu/Hulao =
  // the Xingyang-Chenggao line, Ye = Handan/Julu, Linzi = Qi.
  // ───────────────────────────────────────────────────────────────────────

  // The rising at Dazexiang
};
