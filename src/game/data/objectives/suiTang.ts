import type { ScenarioObjective } from '../../types';

/** 劇本目標 · 隋唐盤 —— 純資料,唯一入口仍是 data/objectives.ts。 */
/*
 * ── 隋末那幾家的期限,壓回他們各自的那一年(2026-08-08)────────────────
 *
 * 「隋末群雄逐鹿」開局是 618 年(盤上曆法軸 178),而鄭、夏、西秦、定楊、
 * 杜伏威五家的守成期限原本寫到 188–191,也就是**十到十三年**。
 * 而史書上這五個人沒有一個撐過四年:
 *
 *   薛舉   618 年八月病卒於軍中,子仁杲十一月降,斬於長安        → 179
 *   劉武周 620 年為李世民所破,奔突厥,為突厥所殺                → 180
 *   王世充 621 年降於李世民(「世充罪當死」而秦王釋之)          → 181
 *   竇建德 621 年虎牢被擒,械送長安而斬於市,年四十九            → 181
 *   杜伏威 622 年入朝,拜太子太保,而後憂懼而死                  → 182
 *
 * 體檢裡他們一律「守到 178 年」—— 開局那一年就丟了,而期限在十年之外,
 * 於是這幾條主目標永遠是 0。判準與 `objectiveLifespan` 那條硬性規則同型:
 * **期限壓回他真正撐到的那一年,那正是「他活著的時候守住了」。**
 */
export const OBJ_SUITANG: Record<string, ScenarioObjective[]> = {
  'scn-st-suiend': [
    {
      id: 'obj-stse-tang',
      forceId: 'tang',
      primary: {
        title: { zh: '居關中而制天下', en: 'Hold Guanzhong, Command the Realm' },
        description: "Still hold Chang'an and Tongguan in 189 — take the passes first; Luoyang comes three years later.",
        descriptionZh: "至189年仍據長安、潼關 —— 先據關中根本;洛陽是三年後的事。",
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
          description: "Take Chang'an by 194 — Li Mi argued against this road, and lost the empire on it.",
          descriptionZh: "於194年前西取長安 —— 李密不肯先入關,天下遂歸李氏。",
          goal: { kind: 'hold-cities', cityIds: ['changan'], byYear: 194 },
        },
      ],
    },
    {
      id: 'obj-stse-zheng',
      forceId: 'zheng',
      primary: {
        title: { zh: '據洛自守', en: 'Hold Luoyang' },
        description: "Still hold Luoyang and Wancheng in 181 — Xuchang is Li Mi's, and Li Mi is the nearer enemy.",
        descriptionZh: "至181年仍據洛陽、宛城 —— 許昌在李密手裡,而李密才是眼前的敵人。",
        goal: { kind: 'hold-cities', cityIds: ['luoyang', 'wancheng'], byYear: 181 },
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
        description: "Still hold Nanpi, Xindu and Changshan in 181 — Hebei first; Luoyang is what killed him.",
        descriptionZh: "至181年仍據南皮、信都、常山 —— 先坐穩河北;去救洛陽的那一趟要了他的命。",
        goal: { kind: 'hold-cities', cityIds: ['nanpi', 'xindu', 'changshan'], byYear: 181 },
      },
      /*
       * 鄴與渤海雖是竇建德開局的城,他兩張盤都守不住:這裡鄴六輪一次也沒撐到
       * 第一個檢查點、渤海 3/6,淺水原那張也只有鄴 2/6、渤海 1/6。
       * 改守河北腹地:南皮 6/6、常山 6/6、信都 5/6(+3 年)。
       *
       * ⚠ `what-they-actually-do` 把「每個檢查點都已失去」的城**不列在守成那幾行**。
       * 看不到某座開局有的城,不等於它沒事 —— 這次差點因此以為鄴不是他的。
       */
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
        description: "Still hold Tianshui, Shanggui and Jiuquan in 180 — Xue Ju died before he could enter the passes.",
        descriptionZh: "至180年仍據天水、上邽、酒泉 —— 薛舉死在入關之前,而隴右本來就是他的。",
        goal: { kind: 'hold-cities', cityIds: ['tianshui', 'shanggui', 'jiuquan'], byYear: 180 },
      },
      /*
       * **金城在這張盤 +1 年就只剩 1/6**(薛舉起兵之地,卻是最先被吃掉的)。
       * 淺水原那張的金城是 3/6,我在那邊留著它當張力;這裡 1/6 太薄,換掉。
       * 同一座城在不同盤上不是同一件事 —— 別把一張盤量到的結論搬去另一張。
       * 實測 +2 年:上邽 6/6、酒泉 6/6、天水 5/6。
       */
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
                description: "Still hold Ji, Wuyuan and Yunzhong in 180 — Liu Wuzhou's power was borrowed, and borrowed things go back.",
        descriptionZh: "至180年仍據薊、五原、雲中 —— 劉武周的兵是借突厥的,借來的東西要還。",
        /*
         * **雁門四輪一次也沒取到**,而北平是「每個檢查點都已失去」的。
         * 定楊七城四年後中位 5 —— 他沒崩,只是往南取不動:
         * 薊 4/4、五原 4/4、居庸關 4/4→3/4、雲中 3/4 一路。
         * 這一條在三次重跑裡是 3 → 1 → 0,屬於「一座取得型城把整條拖成擲硬幣」,
         * 拿掉它就穩。
         */
        goal: { kind: 'hold-cities', cityIds: ['ji', 'wuyuan', 'yunzhong'], byYear: 180 },
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
        description: "Still hold Jianye and Shouchun in 182 — Du Fuwei held the Huai until he chose to submit.",
        descriptionZh: "至182年仍據建業、壽春 —— 杜伏威守得住江淮,他是自己選擇入朝的。",
        goal: { kind: 'hold-cities', cityIds: ['jianye', 'shouchun'], byYear: 182 },
      },
      secondary: [
        {
          title: { zh: '江淮自立', en: 'The Jianghuai Host' },
          description: 'Hold Jianye and Shouchun by 190.',
          descriptionZh: "於190年前據建業、壽春 —— 杜伏威領江淮群盜,自成一方。",
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
        description: "Still hold Jincheng, Longxi and Shanggui in 180 — you beat the Prince of Qin at Qianshuiyuan, then died of illness.",
        descriptionZh: "至180年仍據金城、隴西、上邽 —— 淺水原你贏了秦王,然後病死在入關之前。",
        goal: { kind: 'hold-cities', cityIds: ['jincheng', 'longxi', 'shanggui'], byYear: 180 },
      },
      /*
       * 這條原本要守到 182 而實測只守到 179 —— 而 182 本來就過長:
       * 這張盤唐的主目標正是來取天水、安定,兩條題目本來就對著幹,
       * 西秦的窗口只能是薛舉還活著的那一兩年(史實 618 病卒於軍中)。
       *
       * 實測 +2 年:隴西 6/6、上邽 6/6、武威 5/6、安定 5/6,而**金城只有 3/6**
       * ——金城是薛舉起兵之地,留著它才有張力;天水 4/6 且是唐的目標城,拿掉。
       * 期限收到 180(開局 178 +2 年)。
       */
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
        description: "Still hold Wancheng and Xinye in 181 — the Tang army is away in Longyou; what the east can do is not lose ground.",
        descriptionZh: "至181年仍據宛城、新野 —— 唐師在隴右,而關東能做的是先不丟地。",
        goal: { kind: 'hold-cities', cityIds: ['wancheng', 'xinye'], byYear: 181 },
      },
      /*
       * 原本要「守洛陽並取潼關」,而潼關在唐手裡、他 4 城掉到 3,三輪 0/3。
       * 第一版改成守洛陽/宛城/博望仍然 0 —— 實測**洛陽本身就守不穩**
       * (+1年 5/6、+3年起只剩 3/6),三城合取更低。收成他最穩的兩座:
       * 宛城與新野(前期都是 6/6)。取潼關與守洛陽都留在次要。
       */
      secondary: [
        {
          title: { zh: '西向爭關', en: 'West While Tang Is Busy' },
          description: "Hold Luoyang and take Tongguan by 185.",
          descriptionZh: "於185年前守洛陽並取潼關 —— 唐師在隴右,關東可乘。",
          goal: { kind: 'hold-cities', cityIds: ['luoyang', 'tongguan'], byYear: 185 },
        },
      ],
    },
    {
      id: 'obj-stqs-xia',
      forceId: 'xia',
      primary: {
        title: { zh: '併吞河北', en: 'All of Hebei' },
        description: 'Still hold Xindu, Nanpi and Pingyuan in 181 — Hebei is his; Ye and Bohai are the two he cannot keep.',
        descriptionZh: "至181年仍據信都、南皮、平原 —— 河北是他的本;鄴與渤海是他守不住的那兩座。",
        goal: { kind: 'hold-cities', cityIds: ['xindu', 'nanpi', 'pingyuan'], byYear: 181 },
      },
      /*
       * 原本要「據鄴城、彭城、臨淄」而**鄴開局第一年就掉了**(六輪 2/6,
       * 渤海更只有 1/6)—— 竇建德在這張盤守得住的是河北腹地不是河北門戶:
       * 信都 6/6、南皮 6/6、常山/博陵/中山 6/6、平原 5/6(皆 +3 年)。
       * 改守腹地三座。彭城、臨淄本來就是他的、而且穩,拿來湊數只是虛胖。
       */
    },
    {
      id: 'obj-st-qianshui-wagang',
      forceId: 'wagang',
      primary: {
        title: { zh: '據洛口倉', en: 'The Granary at Luokou' },
        description: "Still hold Puyang, Liyang and Baima in 182. He opened the granary and let the people take what they wanted; the roads filled with the old and the carried.",
        descriptionZh: "至182年仍據濮陽、黎陽、白馬。開倉恣民所取,老弱襁負,道路不絕。",
        goal: { kind: 'hold-cities', cityIds: ['puyang', 'liyang', 'baima'], byYear: 182 },
      },
      /*
       * 原本要「仍據濮陽、許昌」到 184,而**許昌雖是瓦崗開局的城,他自己守不住**
       * ——六輪裡 +1 年就只剩 3/6、+2 年 2/6。這一型靜態掃描抓不到(城確實是他的),
       * 只有實測看得見。
       *
       * 改成他真的守得住的黃河一線:濮陽 5/6、白馬 6/6、黎陽 5/6(皆 +4 年),
       * 期限收到 182。黎陽倉也正是李密開倉恣民所取的那座倉。
       *
       * ⚠ 同一段文案在柏壁盤也有一份(**同一條目標複製到多張盤**那一型),
       * 但那張盤的許昌是 5/6,沒有壞 —— 所以只改這一份,不要順手兩份一起改。
       */
    },
    {
      id: 'obj-st-qianshui-dingyang',
      forceId: 'dingyang',
      primary: {
        title: { zh: '借突厥之力', en: 'The Turkic Horse' },
        description: "Still hold Ji and Juyong Pass in 181. Liu Wuzhou's strength was borrowed from the Turks, and borrowed things go back.",
        descriptionZh: "至181年仍據薊、居庸關。劉武周的兵是借突厥的,借來的東西要還。",
        goal: { kind: 'hold-cities', cityIds: ['ji', 'juyongguan'], byYear: 181 },
      },
      /*
       * 原本要「仍據北平、薊」而**北平開局第一年就沒了**(六輪 0/6,+3 年才
       * 回到 1/6)—— 守成型目標寫了一座守不住的城,整條 0/3。
       * 實測 +3 年:薊 5/6、居庸關 5/6、漁陽 5/6,雲中/朔方反而掉到 3/6、4/6。
       * 改守幽州這一段,期限跟著收到 181(開局 178 +3 年)。
       *
       * 順帶修好文案與資料對不上:原文寫「至184年」而 `byYear` 是 180。
       * 這種不一致玩家看得到、掃描看不到 —— 改 goal 一定要連兩段文案一起讀。
       */
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
        description: "Still hold Chang'an and Tongguan in 182 — refuse battle for five months; Song Jingang's grain will run out.",
        descriptionZh: "至182年仍據長安、潼關 —— 堅壁五月不出戰,宋金剛的糧自己會盡。",
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
        description: "Still hold Ji, Hukou and Yuyang in 181 — you have taken the Li clan's home ground; now keep it.",
        descriptionZh: "至181年仍據薊、壺口、漁陽 —— 已奪李氏根本之地,接下來是守得住。",
        goal: { kind: 'hold-cities', cityIds: ['ji', 'hukou', 'yuyang'], byYear: 181 },
      },
    },
    {
      id: 'obj-stbb-zheng',
      forceId: 'zheng',
      primary: {
        title: { zh: '洛陽自守', en: 'Luoyang Keeps Itself' },
        description: "Still hold Luoyang and Wancheng in 181 — while Tang and Dingyang fight over Hedong, do not move.",
        descriptionZh: "至181年仍據洛陽、宛城 —— 唐與定楊爭河東之際,你不動才是對的。",
        goal: { kind: 'hold-cities', cityIds: ['luoyang', 'wancheng'], byYear: 181 },
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
        description: "Still hold Nanpi, Xindu and Pingyuan in 186 — Hebei is the base; the ride west is the gamble.",
        descriptionZh: "至186年仍據南皮、信都、平原 —— 河北是本;西行是賭。",
        goal: { kind: 'hold-cities', cityIds: ['nanpi', 'xindu', 'pingyuan'], byYear: 186 },
      },
      /*
       * 第三張栽在鄴上的夏。**竇建德在這個模擬裡守不住鄴**:柏壁 1/6(+1 年)、
       * 淺水原 2/6、隋末更是一次也沒撐到第一個檢查點。而河北腹地他守得死死的
       * ——南皮/信都/臨淄 +8 年還是 6/6。三張盤一起改成腹地三座。
       *
       * 這是「同一條目標複製到多張盤」的變形:文案不同、病灶同一座城。
       * 判準:某座城在**多張盤**都拉低同一家的主目標時,那是盤面事實不是文案問題,
       * 改題目而不是改盤。
       */
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
        description: "Still hold Wuwei, Dunhuang and Shanggui in 182. The hard riders of Longyou — and Xue Ju died before he could enter the passes.",
        descriptionZh: "至182年仍據武威、敦煌、上邽。隴右悍騎,而薛舉死在入關之前。",
        goal: { kind: 'hold-cities', cityIds: ['wuwei', 'dunhuang', 'shanggui'], byYear: 182 },
      },
      /*
       * 天水、安定是**唐來取的城**(唐在淺水原那張的主目標就寫著取這兩座),
       * 兩邊對著幹的城不該同時當西秦的守成題:實測 +4 年天水 2/6、安定 2/6,
       * 而武威 6/6、敦煌 6/6、上邽 4/6 —— 河西那一段他守得住。
       * 期限也從 184(開局 +6 年)收到 182:柏壁已是 620 年,史實的西秦早沒了。
       */
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
        description: 'Still hold Luoyang and Wancheng in 179 — the city was down to eating clay when help came.',
        descriptionZh: "至179年仍據洛陽、宛城 —— 城中糧盡,以土屑為餅,夏王之援終於未到。",
        goal: { kind: 'hold-cities', cityIds: ['luoyang', 'wancheng'], byYear: 179 },
      },
      /*
       * 這是全庫最緊的一條守成:鄭開局四城、末期中位 **0** 城,
       * 洛陽 +1 年就只剩 2/6、+2 年 1/6 —— 圍城本來就是這張盤的題目。
       * 窗口從 182(開局 +4 年)收到 179(+1 年):「以土屑為餅」是一年的事,
       * 不是四年的事。南邊的宛城 +2 年還是 6/6,一起寫進去不會拉低它。
       *
       * 若這樣仍是 0/3,下一步是進 BY_DESIGN 而不是繼續放寬 ——
       * 同垓下的項羽、白門樓的呂布、樂毅伐齊的齊:**絕境本身就是題目**。
       */
    },
    {
      id: 'obj-sthl-xia',
      forceId: 'xia',
      primary: {
        title: { zh: '毋赴虎牢', en: 'Do Not Ride to Hulao' },
        description: "Still hold Ye and Bohai in 182 — Ling Jing begged him to strike Shanxi instead; he rode to Hulao and lost everything.",
        descriptionZh: "至182年仍據鄴、渤海 —— 凌敬勸他北取山西,他去了虎牢,一戰盡失。",
        goal: { kind: 'hold-cities', cityIds: ['ye', 'bohai'], byYear: 182 },
      },
      secondary: [
        {
          title: { zh: '毋赴虎牢', en: 'Do Not Go to Hulao' },
          description: 'Keep Zheng standing to 182 — Ling Jing advised crossing north instead; you refused, and rode to Hulao.',
          descriptionZh: "至182年鄭未亡 —— 凌敬勸你北渡黃河取山西,你沒有聽,還是去了虎牢。",
          /*
           * 原本寫成「取洛陽」,而洛陽是**鄭**的城、鄭是夏的開局盟友 ——
           * 竇建德是去**救**王世充的,史書上他到虎牢是為了解洛陽之圍。
           * 這正是 `protect-force` 要裝的形狀:出兵不為取地,而為那一家別亡。
           */
          goal: { kind: 'protect-force', forceId: 'zheng', byYear: 182 },
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
        description: "Still hold Luoyang, Liyang and Bohai in 180 — An Lushan took the eastern capital in thirty-four days; Chang'an is the next year's problem.",
        descriptionZh: "至180年仍據洛陽、黎陽、渤海 —— 三十四日下東都,長安是明年的事。",
        goal: { kind: 'hold-cities', cityIds: ['luoyang', 'liyang', 'bohai'], byYear: 180 },
      },
      /*
       * 大燕在這個模擬裡崩得極快:開局 18 城,六年後中位 **3** 城,
       * 洛陽 +3 年 2/6、+6 年 0/6,而鄴 +1 年就只剩 4/6、+3 年 0/6。
       * 原本的窗口是 184(開局 +6 年),等於問「叛軍能不能撐六年」——
       * 而安祿山 757 年就死於自己兒子之手,兩年而已。
       * 收到 180(+2 年),鄴換成他真的守得住的黎陽、渤海(+3 年 6/6)。
       * 「大燕不亡」撐到 190 那條留在次要,那才是問七年的地方。
       */
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
