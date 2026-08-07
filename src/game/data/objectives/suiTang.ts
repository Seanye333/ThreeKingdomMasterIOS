import type { ScenarioObjective } from '../../types';

/** 劇本目標 · 隋唐盤 —— 純資料,唯一入口仍是 data/objectives.ts。 */
export const OBJ_SUITANG: Record<string, ScenarioObjective[]> = {
  'scn-st-suiend': [
    {
      id: 'obj-stse-tang',
      forceId: 'tang',
      primary: {
        title: { zh: '居關中而制天下', en: 'Hold Guanzhong, Command the Realm' },
        description: "Still hold Chang'an, Taiyuan, Tongguan and Shangdang in 189 — take the passes first; Luoyang comes three years later.",
        descriptionZh: "至189年仍據長安、太原、潼關、上黨 —— 先據關中根本;洛陽是三年後的事。",
        goal: { kind: 'hold-cities', cityIds: ['changan', 'tongguan'], byYear: 189 },
      },
      secondary: [
        {
          title: { zh: '太原起兵', en: 'The Rising at Taiyuan' },
          description: "Hold Chang'an and take Luoyang by 189 — enter the pass first, hold it, then take the plain.",
          descriptionZh: "於189年前據長安並取洛陽 —— 先入關中,據險自固,再東出爭天下。",
          goal: { kind: 'hold-cities', cityIds: ['changan', 'luoyang'], byYear: 189 },
        },
        {
          title: { zh: '混一宇內', en: 'Unify the Realm' },
          description: 'Bring all under one banner.',
          descriptionZh: "混一天下。",
          goal: { kind: 'unify-realm' },
        },
      ],
    },
    {
      id: 'obj-stse-wagang',
      forceId: 'wagang',
      primary: {
        title: { zh: '據洛口倉', en: 'Take the Granaries' },
        description: 'Take Luoyang by 188 — open the granaries and the hungry will come to you.',
        descriptionZh: "於188年前攻取洛陽 —— 開洛口倉恣民就食,饑者自來。",
        goal: { kind: 'hold-cities', cityIds: ['luoyang'], byYear: 188 },
      },
      secondary: [
        {
          title: { zh: '西入關中', en: 'Then Guanzhong' },
          description: "Take Chang'an by 188 — Li Mi argued against this road, and lost the empire on it.",
          descriptionZh: "於188年前西取長安 —— 李密不肯先入關,天下遂歸李氏。",
          goal: { kind: 'hold-cities', cityIds: ['changan'], byYear: 194 },
        },
      ],
    },
    {
      id: 'obj-stse-zheng',
      forceId: 'zheng',
      primary: {
        title: { zh: '據洛自守', en: 'Hold Luoyang' },
        description: "Still hold Luoyang and Wancheng in 190 — Xuchang is Li Mi's, and Li Mi is the nearer enemy.",
        descriptionZh: "至190年仍據洛陽、宛城 —— 許昌在李密手裡,而李密才是眼前的敵人。",
        goal: { kind: 'hold-cities', cityIds: ['luoyang', 'wancheng'], byYear: 190 },
      },
      secondary: [
        {
          title: { zh: '據洛稱鄭', en: 'Zheng at Luoyang' },
          description: 'Still hold Luoyang in 190, and take Xuchang.',
          descriptionZh: "至190年仍據洛陽並取許昌 —— 王世充守洛陽,四面皆敵。",
          goal: { kind: 'hold-cities', cityIds: ['luoyang', 'xuchang'], byYear: 190 },
        },
      ],
    },
    {
      id: 'obj-stse-xia',
      forceId: 'xia',
      primary: {
        title: { zh: '河北夏王', en: 'Xia King of Hebei' },
        description: "Still hold Ye, Bohai and Pingyuan in 191 — Hebei first; Luoyang is what killed him.",
        descriptionZh: "至191年仍據鄴、渤海、平原 —— 先坐穩河北;去救洛陽的那一趟要了他的命。",
        goal: { kind: 'hold-cities', cityIds: ['ye', 'bohai'], byYear: 191 },
      },
      secondary: [
        {
          title: { zh: '河北夏王', en: 'The Xia King of Hebei' },
          description: 'Hold Ye and take Luoyang by 191 — the most popular ruler of the age, and the least lucky.',
          descriptionZh: "於191年前守鄴城並取洛陽 —— 竇建德最得民心,也最不走運。",
          goal: { kind: 'hold-cities', cityIds: ['ye', 'luoyang'], byYear: 191 },
        },
      ],
    },
    {
      id: 'obj-stse-xiqin',
      forceId: 'xiqin',
      primary: {
        title: { zh: '隴右自立', en: 'A Realm in Longyou' },
        description: "Still hold Jincheng, Tianshui and Anding in 188 — Xue Ju died before he could enter the passes.",
        descriptionZh: "至188年仍據金城、天水、安定 —— 薛舉死在入關之前,而隴右本來就是他的。",
        goal: { kind: 'hold-cities', cityIds: ['jincheng', 'tianshui'], byYear: 188 },
      },
      secondary: [
        {
          title: { zh: '西秦入關', en: 'Xiqin Through the Pass' },
          description: "Take Chang'an by 188 — Xue Ju was one battle from taking the capital.",
          descriptionZh: "於188年前攻取長安 —— 薛舉離長安只差一戰。",
          goal: { kind: 'hold-cities', cityIds: ['changan'], byYear: 188 },
        },
      ],
    },
    {
      id: 'obj-stse-dingyang',
      forceId: 'dingyang',
      primary: {
        title: { zh: '借突厥之力', en: 'The Turkic Horse' },
        description: "Still hold Yanmen, Yunzhong and Shuofang in 188 — Liu Wuzhou's power was borrowed, and borrowed things go back.",
        descriptionZh: "至188年仍據雁門、雲中、朔方 —— 劉武周的兵是借突厥的,借來的東西要還。",
        goal: { kind: 'hold-cities', cityIds: ['yanmen', 'yunzhong'], byYear: 188 },
      },
      secondary: [
        {
          title: { zh: '南下并州', en: 'South into Bing' },
          description: 'Take Taiyuan by 188 — with Turkic horse behind you, the Li clan heartland is open.',
          descriptionZh: "於188年前攻取太原 —— 借突厥之騎,直搗李氏根本。",
          goal: { kind: 'hold-cities', cityIds: ['taiyuan'], byYear: 188 },
        },
      ],
    },
    {
      id: 'obj-stse-wu',
      forceId: 'wu',
      primary: {
        title: { zh: '江淮自立', en: 'The Huai Between' },
        description: "Still hold Jianye, Shouchun and Hefei in 190 — Du Fuwei held the Huai until he chose to submit.",
        descriptionZh: "至190年仍據建業、壽春、合肥 —— 杜伏威守得住江淮,他是自己選擇入朝的。",
        goal: { kind: 'hold-cities', cityIds: ['jianye', 'shouchun'], byYear: 190 },
      },
      secondary: [
        {
          title: { zh: '江淮自立', en: 'The Jianghuai Host' },
          description: 'Hold Jianye, Shouchun and Hefei by 190.',
          descriptionZh: "於190年前據建業、壽春、合肥 —— 杜伏威領江淮群盜,自成一方。",
          goal: { kind: 'hold-cities', cityIds: ['jianye', 'shouchun'], byYear: 190 },
        },
      ],
    },
  ],

  // Qianshuiyuan
  'scn-st-qianshui': [
    {
      id: 'obj-stqs-tang',
      forceId: 'tang',
      primary: {
        title: { zh: '再戰淺水原', en: 'Qianshuiyuan, the Second Time' },
        description: "Take Tianshui and Anding by 182 — Li Shimin lost here once, then waited out their grain.",
        descriptionZh: "於182年前取天水、安定 —— 淺水原初戰唐敗,再戰堅壁不出,待其糧盡。",
        goal: { kind: 'hold-cities', cityIds: ['tianshui', 'anding'], byYear: 182 },
      },
      secondary: [
        {
          title: { zh: '平定隴右', en: 'Settle Longyou' },
          description: 'Destroy the Xiqin force by 186.',
          descriptionZh: "於186年前滅西秦 —— 隴右既平,關中乃安。",
          goal: { kind: 'defeat-force', forceId: 'xiqin', byYear: 186 },
        },
      ],
    },
    {
      id: 'obj-stqs-xiqin',
      forceId: 'xiqin',
      primary: {
        title: { zh: '隴右之師', en: 'The Host of Longyou' },
        description: "Still hold Jincheng, Tianshui and Anding in 182 — you beat the Prince of Qin at Qianshuiyuan, then died of illness.",
        descriptionZh: "至182年仍據金城、天水、安定 —— 淺水原你贏了秦王,然後病死在入關之前。",
        goal: { kind: 'hold-cities', cityIds: ['jincheng', 'tianshui'], byYear: 182 },
      },
      secondary: [
        {
          title: { zh: '直取長安', en: "Straight for Chang'an" },
          description: "Take Chang'an by 182 — press on now; Xue Ju's death is what saved the Tang.",
          descriptionZh: "於182年前攻取長安 —— 薛舉暴卒才救了唐,趁現在就打。",
          goal: { kind: 'hold-cities', cityIds: ['changan'], byYear: 182 },
        },
      ],
    },
    {
      id: 'obj-stqs-zheng',
      forceId: 'zheng',
      primary: {
        title: { zh: '西向爭關', en: 'West While Tang Is Busy' },
        description: "Hold Luoyang and take Tongguan by 185.",
        descriptionZh: "於185年前守洛陽並取潼關 —— 唐師在隴右,關東可乘。",
        goal: { kind: 'hold-cities', cityIds: ['luoyang', 'tongguan'], byYear: 185 },
      },
    },
    {
      id: 'obj-stqs-xia',
      forceId: 'xia',
      primary: {
        title: { zh: '併吞河北', en: 'All of Hebei' },
        description: 'Hold Ye, Pengcheng and Linzi by 185.',
        descriptionZh: "於185年前據鄴城、彭城、臨淄。",
        goal: { kind: 'hold-cities', cityIds: ['ye', 'pengcheng', 'linzi'], byYear: 185 },
      },
    },
    {
      id: 'obj-st-qianshui-wagang',
      forceId: 'wagang',
      primary: {
        title: { zh: '據洛口倉', en: 'The Granary at Luokou' },
        description: "Still hold Puyang and Xuchang in 184. He opened the granary and let the people take what they wanted; the roads filled with the old and the carried.",
        descriptionZh: "至184年仍據濮陽、許昌。開倉恣民所取,老弱襁負,道路不絕。",
        goal: { kind: 'hold-cities', cityIds: ['puyang', 'xuchang'], byYear: 184 },
      },
    },
    {
      id: 'obj-st-qianshui-dingyang',
      forceId: 'dingyang',
      primary: {
        title: { zh: '借突厥之力', en: 'The Turkic Horse' },
        description: "Still hold Beiping and Ji in 184. Liu Wuzhou's strength was borrowed from the Turks, and borrowed things go back.",
        descriptionZh: "至184年仍據北平、薊。劉武周的兵是借突厥的,借來的東西要還。",
        goal: { kind: 'hold-cities', cityIds: ['beiping', 'ji'], byYear: 184 },
      },
    },
    {
      id: 'obj-st-qianshui-wu',
      forceId: 'wu',
      primary: {
        title: { zh: '江淮自立', en: 'The Huai Between' },
        description: "Still hold Shouchun and Kuaiji in 184. Du Fuwei could hold the Huai. He chose to submit; nobody took it from him.",
        descriptionZh: "至184年仍據壽春、會稽。杜伏威守得住江淮 —— 他是自己選擇入朝的。",
        goal: { kind: 'hold-cities', cityIds: ['shouchun', 'kuaiji'], byYear: 184 },
      },
    },
  ],

  // Bobi
  'scn-st-bobi': [
    {
      id: 'obj-stbb-tang',
      forceId: 'tang',
      primary: {
        title: { zh: '柏壁堅壁', en: 'Dig In at Bobi' },
        description: "Still hold Chang'an, Tongguan and Hedong in 182 — refuse battle for five months; Song Jingang's grain will run out.",
        descriptionZh: "至182年仍據長安、潼關、河東 —— 堅壁五月不出戰,宋金剛的糧自己會盡。",
        goal: { kind: 'hold-cities', cityIds: ['changan', 'tongguan'], byYear: 182 },
      },
      secondary: [
        {
          title: { zh: '柏壁堅壁', en: 'Wait Them Out at Bobi' },
          description: 'Retake Taiyuan and Shangdang by 182 — hold the line until their supply fails, then chase them for three days.',
          descriptionZh: "於182年前收復太原、上黨 —— 堅壁不戰以老其師,糧盡而追,一日八戰。",
          goal: { kind: 'hold-cities', cityIds: ['taiyuan', 'shangdang'], byYear: 182 },
        },
        {
          title: { zh: '滅定楊', en: 'End Dingyang' },
          description: 'Destroy the Dingyang force by 186.',
          descriptionZh: "於186年前滅劉武周 —— 河東既復,唐之根本乃固。",
          goal: { kind: 'defeat-force', forceId: 'dingyang', byYear: 186 },
        },
      ],
    },
    {
      id: 'obj-stbb-dingyang',
      forceId: 'dingyang',
      primary: {
        title: { zh: '宋金剛南下', en: "Song Jin'gang Drives South" },
        description: "Hold Taiyuan and take Chang'an by 185 — you have taken the Li clan's home ground; do not stop.",
        descriptionZh: "於185年前守太原並取長安 —— 已奪李氏根本之地,不可頓兵。",
        goal: { kind: 'hold-cities', cityIds: ['taiyuan', 'changan'], byYear: 185 },
      },
    },
    {
      id: 'obj-stbb-zheng',
      forceId: 'zheng',
      primary: {
        title: { zh: '洛陽自守', en: 'Luoyang Keeps Itself' },
        description: "Still hold Luoyang and Wancheng in 185 — while Tang and Dingyang fight over Hedong, do not move.",
        descriptionZh: "至185年仍據洛陽、宛城 —— 唐與定楊爭河東之際,你不動才是對的。",
        goal: { kind: 'hold-cities', cityIds: ['luoyang', 'wancheng'], byYear: 185 },
      },
      secondary: [
        {
          title: { zh: '洛陽自守', en: 'Luoyang Holds' },
          description: 'Still hold Luoyang in 185 and take Xuchang.',
          descriptionZh: "至185年仍守洛陽並取許昌。",
          goal: { kind: 'hold-cities', cityIds: ['luoyang', 'xuchang'], byYear: 185 },
        },
      ],
    },
    {
      id: 'obj-stbb-xia',
      forceId: 'xia',
      primary: {
        title: { zh: '趁虛而西', en: 'Westward While They Fight' },
        description: "Still hold Ye, Bohai and Pingyuan in 186 — Hebei is the base; the ride west is the gamble.",
        descriptionZh: "至186年仍據鄴、渤海、平原 —— 河北是本;西行是賭。",
        goal: { kind: 'hold-cities', cityIds: ['ye', 'bohai'], byYear: 186 },
      },
      secondary: [
        {
          title: { zh: '趁虛而西', en: 'West While They Fight in Hedong' },
          description: 'Hold Ye and take Luoyang by 186.',
          descriptionZh: "於186年前守鄴城並取洛陽。",
          goal: { kind: 'hold-cities', cityIds: ['ye', 'luoyang'], byYear: 186 },
        },
      ],
    },
    {
      id: 'obj-st-bobi-wagang',
      forceId: 'wagang',
      primary: {
        title: { zh: '據洛口倉', en: 'The Granary at Luokou' },
        description: "Still hold Puyang and Xuchang in 184. He opened the granary and let the people take what they wanted; the roads filled with the old and the carried.",
        descriptionZh: "至184年仍據濮陽、許昌。開倉恣民所取,老弱襁負,道路不絕。",
        goal: { kind: 'hold-cities', cityIds: ['puyang', 'xuchang'], byYear: 184 },
      },
    },
    {
      id: 'obj-st-bobi-xiqin',
      forceId: 'xiqin',
      primary: {
        title: { zh: '隴右自立', en: 'A Realm in Longyou' },
        description: "Still hold Tianshui and Anding in 184. The hard riders of Longyou — and Xue Ju died before he could enter the passes.",
        descriptionZh: "至184年仍據天水、安定。隴右悍騎,而薛舉死在入關之前。",
        goal: { kind: 'hold-cities', cityIds: ['tianshui', 'anding'], byYear: 184 },
      },
    },
    {
      id: 'obj-st-bobi-wu',
      forceId: 'wu',
      primary: {
        title: { zh: '江淮自立', en: 'The Huai Between' },
        description: "Still hold Shouchun and Kuaiji in 184. Du Fuwei could hold the Huai. He chose to submit; nobody took it from him.",
        descriptionZh: "至184年仍據壽春、會稽。杜伏威守得住江淮 —— 他是自己選擇入朝的。",
        goal: { kind: 'hold-cities', cityIds: ['shouchun', 'kuaiji'], byYear: 184 },
      },
    },
  ],

  // Hulao: one battle, two kingdoms
  'scn-st-hulao': [
    {
      id: 'obj-sthl-tang',
      forceId: 'tang',
      primary: {
        title: { zh: '一戰擒兩王', en: 'Two Kings in One Battle' },
        description: 'Take Luoyang and Ye by 182 — besiege one, ambush the other at the pass with three thousand horse.',
        descriptionZh: "於182年前取洛陽、鄴城 —— 圍洛陽而不撤,以三千五百騎據虎牢待竇建德。",
        goal: { kind: 'hold-cities', cityIds: ['luoyang', 'ye'], byYear: 182 },
      },
      secondary: [
        {
          title: { zh: '混一宇內', en: 'Unify the Realm' },
          description: 'Bring all under one banner.',
          descriptionZh: "混一天下 —— 虎牢一戰之後,天下大勢已定。",
          goal: { kind: 'unify-realm' },
        },
      ],
    },
    {
      id: 'obj-sthl-zheng',
      forceId: 'zheng',
      primary: {
        title: { zh: '守洛待援', en: 'Hold Until Xia Arrives' },
        description: 'Still hold Luoyang in 182 — the city was down to eating clay when help came.',
        descriptionZh: "至182年仍守洛陽 —— 城中糧盡,以土屑為餅,夏王之援終於未到。",
        goal: { kind: 'hold-cities', cityIds: ['luoyang'], byYear: 182 },
      },
    },
    {
      id: 'obj-sthl-xia',
      forceId: 'xia',
      primary: {
        title: { zh: '毋赴虎牢', en: 'Do Not Ride to Hulao' },
        description: "Still hold Ye, Bohai and Pingyuan in 182 — Ling Jing begged him to strike Shanxi instead; he rode to Hulao and lost everything.",
        descriptionZh: "至182年仍據鄴、渤海、平原 —— 凌敬勸他北取山西,他去了虎牢,一戰盡失。",
        goal: { kind: 'hold-cities', cityIds: ['ye', 'bohai'], byYear: 182 },
      },
      secondary: [
        {
          title: { zh: '毋赴虎牢', en: 'Do Not Go to Hulao' },
          description: 'Take Luoyang by 182 while still holding Ye — Ling Jing advised crossing north instead; you refused.',
          descriptionZh: "於182年前取洛陽且鄴城不失 —— 凌敬勸你北渡黃河取山西,你沒有聽。",
          goal: { kind: 'hold-cities', cityIds: ['luoyang', 'ye'], byYear: 182 },
        },
        {
          title: { zh: '夏國不亡', en: 'Xia Endures' },
          description: 'Survive to 185.',
          descriptionZh: "存續至185年 —— 虎牢被擒之後,河北再無夏王。",
          goal: { kind: 'survive-until', year: 185 },
        },
      ],
    },
  ],

  // The An Lushan rebellion
  'scn-st-anshi': [
    {
      id: 'obj-stas-tang',
      forceId: 'tang',
      primary: {
        title: { zh: '兩京克復', en: 'Retake Both Capitals' },
        description: 'Retake Luoyang by 184 — and never order the Tongguan army out of its fortifications again.',
        descriptionZh: "於184年前收復洛陽 —— 並且不要再逼潼關守軍出戰。",
        goal: { kind: 'hold-cities', cityIds: ['luoyang'], byYear: 184 },
      },
      secondary: [
        {
          title: { zh: '河北盡復', en: 'All of Hebei Back' },
          description: 'Destroy the Yan force by 188.',
          descriptionZh: "於188年前平定大燕 —— 河北諸鎮,一個不留。",
          goal: { kind: 'defeat-force', forceId: 'yan', byYear: 188 },
        },
      ],
    },
    {
      id: 'obj-stas-yan',
      forceId: 'yan',
      primary: {
        title: { zh: '漁陽鼙鼓', en: 'The Drums of Yuyang' },
        description: "Still hold Luoyang, Ye, Xuchang and Hulao in 184 — An Lushan took the eastern capital in thirty-four days; Chang'an is the next year's problem.",
        descriptionZh: "至184年仍據洛陽、鄴、許昌、虎牢 —— 三十四日下東都,長安是明年的事。",
        goal: { kind: 'hold-cities', cityIds: ['luoyang', 'ye'], byYear: 184 },
      },
      secondary: [
        {
          title: { zh: '漁陽鼙鼓', en: 'The War Drums of Yuyang' },
          description: "Take Chang'an by 184 — the pass falls when the court forces its garrison into the open.",
          descriptionZh: "於184年前攻取長安 —— 漁陽鼙鼓動地來,潼關一破,九重城闕煙塵生。",
          goal: { kind: 'hold-cities', cityIds: ['changan'], byYear: 184 },
        },
        {
          title: { zh: '大燕不亡', en: 'Yan Endures' },
          description: 'Survive to 190 — the rebellion outlived An Lushan by seven years; make it last longer.',
          descriptionZh: "存續至190年 —— 安祿山死後亂事仍延七年,這一次要更久。",
          goal: { kind: 'survive-until', year: 190 },
        },
      ],
    },
  ],
};
