# 戰役體檢清單與進度

> 這份文件回答兩個問題:**一個戰役怎樣才算做完**,以及**現在做到哪裡**。
>
> 機制與數值的正文在 [GUIDE.md](GUIDE.md)(改了機制請同步更新那一份);
> 內容索引在 [CATALOG.md](CATALOG.md)(機器產生,`npm run docs:catalog`)。
> 這一份只管「檢查」與「進度」,動手之前先把 §1 的表跑一遍拿基線。

最後更新:2026-08-08。全庫 **86 張盤 / 540 家勢力**。

---

## 1. 全庫檢查表

每一條都能單獨跑。**「硬性歸零」的那幾條有測試釘住,壞了會紅**;
標「診斷」的沒有測試,數字只供判斷,不追求 0。

| # | 查什麼 | 怎麼跑 | 釘住它的測試 | 現況 |
|---|---|---|---|---|
| 1 | 每家都有序章與目標 | — | `scenarioCoverage.test.ts` | **0 洞 / 540 家**(硬性) |
| 2 | 盤面內部一致性 | `node --import tsx scripts/scenario-audit.ts` | `scenarioAudit.test.ts` | **error 0 / warn 0**(硬性) |
| 3 | 跨盤靜態一致性 | `node --import tsx scripts/content-audit.ts` | — | error 0 / warn 5(診斷) |
| 4 | 主目標與開局外交是否矛盾 | `node --import tsx scripts/objective-diplomacy-audit.ts` | `objectiveDiplomacy.test.ts` | **0 條**(硬性) |
| 5 | 目標期限是否活過君主 | `node --import tsx scripts/objective-lifespan-audit.ts` | `objectiveLifespan.test.ts` | **0 條**(硬性) |
| 6 | 目標是否真的達得到(自走) | `node --import tsx scripts/objective-sweep.ts 3` | — | 見 §3(診斷,約一小時) |
| 7 | 鄰近補位有沒有送錯城 | `node --import tsx scripts/fill-audit.ts` | `proximityFill.test.ts` | 224 可疑(診斷) |
| 8 | 單盤 AI 自走體檢 | `node --import tsx scripts/scenario-report.ts <id> 180 12` | — | 逐盤(診斷) |
| 9 | 全 AI 觀察一整局 | `node --import tsx scripts/ai-watch.ts` | — | 診斷 |
| 10 | 時代不外漏(外傳三線) | — | `eraLeaks.test.ts` / `altEraEventChains.test.ts` | **硬性** |

**驗證三件套**(每個改動都要過):

```bash
npm run build          # tsc -b。不要用 tsc --noEmit,Vercel 會因未用 import 掛掉
npx vitest run         # 327 檔 / 2998 測試
npm run docs:catalog   # 改過 src/game/data/*.ts 之後
```

---

## 2. 一個戰役「做完」的六格規格

| 格 | 放在哪 | 全庫現況 |
|---|---|---|
| ① 序章 × 每一家 | `data/scenarioPrologues.ts` | **540/540** |
| ② 主目標 × 每一家 | `data/objectives/*.ts` | **540/540** |
| ③ 戰役專屬事件鏈 | `data/events.ts` + 盤上的 `eventFlags` | 零事件的盤 **0/86**;但有十來張只有 3–8 條(見 §4) |
| ④ 史官論曰 + 每家敗亡變體 | `data/scenarioVerdicts.ts` | 論曰 86/86;**每家敗亡變體缺 325/540**(選填,見 §4) |
| ⑤ 開局數值差異化 | `buildInitialCities` 第二參數 + `openingRelations` | 姿態 86/86、開局外交 86/86 |
| ⑥ AI 自走體檢 | `scripts/scenario-report.ts` | 逐盤,無全庫數字 |

六格全做完的樣板:**黃巾之亂 `scn-184-yellow-turban`**。

---

## 3. 主目標掃描(第 6 條)——最重要的那個數字

```bash
node --import tsx scripts/objective-sweep.ts 3            # 全庫,約 1–1.5 小時
node --import tsx scripts/objective-sweep.ts 3 scn-2      # 只掃三國中後期
```

輸出分三段:**設計如此**(具名例外,寫在腳本的 `BY_DESIGN`)、
**期限外做得到 / 撐了一段**(調窗口或調 AI)、**多跑 6 年也從未達成**(題目要重寫)。

分母是 540 條主目標。走勢:

| 時間 | 死目標 | 備註 |
|---|---|---|
| 2026-08-06 | 188 / 393(48%) | 起點,分母還沒補完 |
| 2026-08-07 | 105 / 540(19%) | 補完 147 家缺目標 + 五個全庫級缺口 |
| 2026-08-07 晚 | 116 / 540 | **修完城防上限之後變差,而那是對的**——先前的通過率有一部分是 bug 撐的 |
| 2026-08-08 早 | 118 / 540 | 形狀:守成 51、取得 35、半守半取 17、滅 11、其他 4 |
| 2026-08-08 本批之後 | 重掃中 | 已修 33 條外交矛盾 + 31 條期限,`BY_DESIGN` 另補 12 條 |

⚠ **三輪的解析度大約 ±1 張盤。** 別把個位數的差當成改動生效的證據 ——
要判斷有沒有效,要嘛提高輪數(≥12),要嘛看**同一條目標**跨多次掃描的走勢。

---

## 4. 待辦(依價值排序)

1. **重跑一次完整掃描**拿本批之後的數字(`objective-sweep.ts 3`),
   讀新增的「期限外做得到 / 從未達成」兩段 —— 那一欄決定修法。
2. **AI 收尾太慢**。198 盤呂布開局只有下邳、琅琊兩座城,曹操 14 城,
   而他 **202 年**才把呂布全滅(期限寫的是白門樓那一年)。
   十一條「滅某家」的主目標多半死在這裡。
3. **`feasibility` 沒有上限**(候選改動,patch 在 scratchpad,**尚未 ship**)。
   目標評分是 `feasibility × value × …`,而 `feasibility` 可以到 10 以上、
   `value` 最多 2.6 —— 於是**大國永遠先吃最弱的鄰居**。量出來的後果:
   張魯的「師君治漢中」在六張盤上都是死的,而他史書上守了漢中二十四年;
   韓的「勁弩勁韓」在五張戰國盤上都是死的,而韓撐到了公元前 230 年。
   加上限之後三輪看不出效果,**要用 12 輪 A/B 才能下結論**。
4. **每家敗亡變體缺 325/540**。`scenarioVerdicts.ts` 的檔頭明寫這是選填
   (沒寫的走通用輓歌),所以不是壞掉;但選了周邊勢力的玩家讀到的是通用文本。
   缺最多的:英雄集結 16、若董卓未亡 10、若呂布割據徐州 8、若袁術稱帝成 8。
5. **事件仍薄的十來張盤**(本盤年代內 3–8 條):西陵 3、芍陂 4、晉滅吳 4、
   襄平 5、五丈原 6、興勢 6、鍾會之亂 6、鹵城 7、安史之亂 7、彭城 7。
6. **`fill-audit` 的 224 座可疑補位城**。判準是「這一家在那個州一座明列的城
   都沒有」,邊界城本來就會跨州,所以不追求 0 —— 但值得逐州翻一遍。

---

## 5. 給下一個會話的坑(都實際踩過)

### 量測

- **用 `observeScenario(scn, 'normal')`,不是 `loadScenario(scn, forces[0].id)`**
  —— 後者把那張盤的主角變成一兵不出的玩家(`planAITurn` 用 `isHuman()` 跳過)。
- **回合數要蓋過所有目標期限**。外傳三線借三國曆法軸(`startDate.year = 178`)
  而期限寫到 200+,跑不夠等於所有守成目標假 0。
  判準:輸出的「旬」剛好等於 `MAX_TURNS` 的盤,結果不可信。
- **追守成型目標要印 `progress`,不是印城數** —— 丟了一座又從別處拿一座,
  城數看起來完全正常。
- **n=3 是雜訊**。同一份程式碼跑兩次 5 輪,主目標可以從 4/5 變 1/5。
  要下結論至少 12 輪;要歸因得跑兩組 12 輪。
- **反向驗證的結果要看,不要寫**。曾經跑了反向驗證、輸出寫著「仍然綠
  (測試沒抓到!)」,而提交信息裡照樣寫了「反向驗過它會紅」。

### 資料

- **`non-aggression` 不是「還沒開打」,是「永不交兵」**。`isHostilePermitted`
  只放行 `neutral`。要表達「此刻還沒開打但可以打」用 `neutral`。
- **開局的互不侵犯會期滿**(`SCENARIO_NAP_SEASONS = 20` 季);
  真的不該期滿的在盤上寫 `permanent: true`。同盟 `allied` 不由期限管。
- **事件的守衛要挑活得過那一刻的東西**。「綿竹」那一節第一次寫成
  `officer-alive: zhuge-zhan`,而諸葛瞻在盤上第 1 旬就戰死(綿竹之戰正是
  這張盤的開局戰)。改問「綿竹還在蜀手裡沒有」(`city-owner-ruler`)。
  同型:長社之火要 `officer-active: huangfu-song`,而他第 9 回合陣亡。
- **外傳三線的事件靠人擋、不靠年份**。三線共用 178 曆法軸,年份鎖不住;
  用只有那條線才有的人當 `officer-alive` 守衛,或掛在盤宣告的 `eventFlags` 上。
  `altEraEventChains.test.ts` 釘住這條約定。
- **`control-province` 在大州上是陷阱**(揚 16 城、荊 19、涼 12、交 8、幽 11):
  邊城 AI 永遠不去。改查該州核心三五座。緊湊的州(冀 9、徐 5、豫 5)沒問題。
- **`defeat-force` 要對方在盤上全滅**,而史書的「翦滅」常只是誅其身。
- **主目標寫他真正做到的,次要寫他沒做到的**。這是全庫的那把尺。
- **守成目標查兩到三座就好**,挑他真的會丟的那一兩座 —— 查四五座是白扣,
  只查腹地是白送。

### 工程

- **`npm run build`(`tsc -b`),不要 `tsc --noEmit`** —— Vercel 會因未用 import 掛掉。
- **不要用 `git checkout <file>` 撤銷臨時探針** —— 那個檔上所有未提交的改動
  會一起沒了(這次就把 20 對開局關係的修改一次還原掉,只好重做)。先 `cp` 備份。
- **不要在髒工作區跑 `eslint --fix`**。
- Python heredoc 裡寫 TS 字串:`\'` 會被 Python 吃掉、`\n` 會變成真換行。
  用雙引號的 TS 字串,或用 sentinel 事後換回去。
- 改機制要同步 `docs/GUIDE.md`;改 `src/game/data/*.ts` 要跑 `npm run docs:catalog`。
- 提交**不加** `Co-Authored-By`,PR 描述不加生成標注;一次會話切成數個提交,
  每條說清改動意圖與踩過的坑。
- 推送只推 `origin`(分支 `content-depth-flavor`),**不要碰
  `/Users/sean/Developer/ThreeKingdomMasters`**。

---

## 6. 2026-08-08 這一批做了什麼

五個提交,都在 `content-depth-flavor` 上:

1. **`48144de9` 董卓走不進洛陽** —— 33 條主目標與自家開局外交矛盾(從第 0 旬
   就是死的)。改 24 對關係為 `neutral`、改寫 9 條目標,
   另補目標型別 **`protect-force`**(救援:竊符救趙、毛遂自薦、吳救壽春,
   原本被寫成「取下你要救的那一家的城」)。
2. **`6af8342d` 覆蓋率棘輪早就該收** —— 預算掛在 227 而實際是 0,改硬性歸零。
3. **`9f83aa2c` 開局那紙互不侵犯一簽就是一輩子** —— 局中簽的只有八季,
   而劇本開局那些沒有期限(`rel()` 沒帶 `expiresAt`)。官渡在 195/197
   兩張盤打不起來就是這個。
4. **`09c187d0` 垓下之戰沒有四面楚歌** —— 五張盤在自己的年代裡零事件。
   補六條鏈 21 節 + 兩條楚漢橋接;新增 `Scenario.eventFlags`;
   順帶揪出 `findFiringEvent` 沒拿到戰役 rng(歷史事件擲骰走裸 `Math.random`)。
5. **`aded9702` 蜀漢亡國那一年三幕都沒有** —— 後三國補 8 節。
6. **`b4d1b79f` 袁術要守壽春到 205 年而他 199 年就死了** —— 31 條期限壓回卒年。
7. **`2d1ed36c`** —— `BY_DESIGN` 補 12 條,讓掃描的頭條數字只算「沒有解釋的」。
