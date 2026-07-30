# 名場面事件圖(Historical-event key-art)

史實事件彈窗([EventModal.tsx](../../src/ui/components/EventModal.tsx))頂部一條 16:9 banner ——
**有圖用圖、缺圖不顯示**(放檔即生效,onError 自動隱藏,版面如常,不崩)。

| 用途 | 檔名 | 缺檔時 |
|---|---|---|
| **名場面圖** | `public/events/<event.id>.jpg` | 不顯示 banner(只剩標題+登場人物+內文,不變) |

- 規格:**16:9,~1400px 寬,JPEG q≈82**。壓縮:
  `sips -s format jpeg -s formatOptions 82 --resampleWidth 1400 in.png --out <event.id>.jpg`
- ⚠ 檔名 = **事件 id**(不是中文名)。全部事件 id 見 `src/game/data/events.ts`;下表是先做的一批。
- 出圖 prompt 見 `PROMPTS.md`。

---

## 首批 18 名場面 ↔ 檔名(event id)

| id(檔名) | 名場面 | 建議畫面 |
|---|---|---|
| `evt-peach-garden-oath` | 桃園結義 | 劉關張桃林設壇歃血結義、烏牛白馬祭、桃花紛落、晨光、生死之盟 |
| `evt-warm-wine-hua-xiong` | 溫酒斬華雄 | 關羽提華雄首級擲於案、杯酒尚溫、帳中群雄駭然、火把、豪氣干雲 |
| `evt-three-heroes-lu-bu` | 三英戰呂布 | 虎牢關前劉關張三騎圍攻赤兔方天戟呂布、塵土旌旗、以三敵一 |
| `evt-lu-bu-halberd-shot` | 轅門射戟 | 呂布挽強弓遠射轅門畫戟小枝、諸將屏息、一箭止兵、神技 |
| `evt-heroes-over-wine` | 煮酒論英雄 | 曹操劉備亭中對飲青梅煮酒、指天論英雄、雷雨將至、暗潮洶湧 |
| `evt-zhao-yun-changban` | 長坂之趙雲 | 白袍趙雲白馬單騎陷陣、懷抱阿斗、槍挑敵軍、旌旗傾倒、七進七出 |
| `evt-changban-bridge` | 當陽橋斷喝 | 張飛獨立當陽橋頭怒目橫矛大喝、聲震敵軍、萬軍為之退卻、暮塵 |
| `evt-borrowing-arrows` | 草船借箭 | 濃霧中草束戰船逼近敵岸、萬箭齊射插滿草人、諸葛亮舟中酌酒、拂曉 |
| `evt-zhuge-borrows-wind` | 借東風 | 諸葛亮七星壇作法祭風、衣髮飄揚、東風驟起於江上、星雲流轉、玄秘 |
| `evt-hengshuo-poetry` | 橫槊賦詩 | 曹操立於樓船船首橫槊對月賦詩、連環戰船火把、大戰前夜、蒼涼豪邁 |
| `evt-huarong-path` | 華容道義釋曹操 | 關羽橫刀立馬扼華容窄道、攔敗走曹操殘軍、念舊恩終放行、霧林、義薄 |
| `evt-guan-yu-flooded-armies` | 水淹七軍 | 洪流暴漲淹沒魏軍營寨器械、關羽駕舟俘擒溺卒、暴雨滔天、席捲 |
| `evt-single-blade-meeting` | 單刀赴會 | 關羽單提青龍刀從容步入敵宴、主客與伏兵緊繃、燭光大堂、膽識 |
| `evt-scraping-bone` | 刮骨療毒 | 華佗為關羽刮骨去毒、關羽泰然弈棋飲酒談笑、侍者失色、燭帳、剛毅 |
| `evt-empty-fort-stratagem` | 空城計 | 諸葛亮於敞開城樓焚香撫琴、城門洞開空無一人、城下大軍疑而止步、靜中之險 |
| `evt-baidi-1` | 白帝托孤 | 劉備白帝城病榻執諸葛亮手、託孤幼主、侍臣垂淚、燭光、悲愴訣別 |
| `evt-jieting-ma-su` | 揮淚斬馬謖 | 諸葛亮揮淚偏首、下令斬跪伏之馬謖、三軍肅然、旌旗刀斧、悲壯執法 |
| `evt-zhuge-liang-dies` | 五丈原星墜 | 諸葛亮五丈原軍帳中病逝、秋夜一顆大星流墜、燈陣祈禳、諸將哀慟、玄悲 |
