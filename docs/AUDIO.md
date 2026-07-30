# 音效素材需求清單

遊戲的音訊**程式碼已經完工**——採樣優先、逐項回退合成音、預設關閉、設定裡有開關。
缺的純粹是檔案。把素材照下面的路徑丟進 `public/audio/`,不用改一行程式碼。

## 怎麼生效

1. 檔案放進 `public/audio/{sfx,music,fx,event}/`,檔名**完全對應**下表的鍵,副檔名 `.mp3`
2. 玩家在 **設定 → 真實音效包** 打開(預設關閉,持久化在 `tkm-audiofiles`)
3. 沒放的項目自動回退到合成音——**可以只買一部分先上**,不會有破音或靜默

接線在 [App.tsx:41](../src/App.tsx#L41) 的 `enableAudioFiles()`,路徑規則見
[sound.ts](../src/game/systems/sound.ts) 的 `enableAudioFiles()`。
想換成 `.ogg` 或放 CDN,改那一行的參數即可:`enableAudioFiles('/audio', 'ogg')`。

## 授權注意

上架商用**必須**確認素材授權涵蓋「商業遊戲內嵌散布」。訂閱制音樂庫
(Epidemic Sound / Artlist / Soundstripe)的標準授權多半涵蓋,但要留存授權證明。
免費庫(freesound 等)逐條授權不同,CC-BY 需要在遊戲內標註出處——
若用了,在標題畫面或設定裡加一頁 Credits。

---

## 1. 背景音樂 `public/audio/music/<track>.mp3`

**5 首**,最貴也最影響質感的部分。需要**無縫循環**(loop-ready,首尾能接上)。

| 檔名 | 何時播放 | 建議長度 | 風格方向 |
|---|---|---|---|
| `peace.mp3` | 內政、城市畫面、平時大地圖 | 2–3 分鐘 | 古箏/笛/簫為主,舒緩,留白多。這首玩家聽最久,別太滿 |
| `tension.mp3` | 敵軍逼近、謀反前兆、季末結算 | 1.5–2 分鐘 | 低音鼓點漸強,弦樂懸疑,不要旋律性太強 |
| `battle.mp3` | 戰術會戰、攻城 | 2–3 分鐘 | 戰鼓 + 嗩吶/號角,節奏推進 |
| `victory.mp3` | 攻下城池、統一天下 | 30–60 秒 | 不需循環,昂揚收束 |
| `defeat.mp3` | 城破、勢力滅亡 | 30–60 秒 | 不需循環,蒼涼收束 |

現在的程式化配樂([sound.ts](../src/game/systems/sound.ts) `MUSIC_TRACKS`)是五聲音階寫的,
換真實素材時沿用**宮商角徵羽**的調性會最連貫。

## 2. 通用音效 `public/audio/sfx/<name>.mp3`

**23 個**,都是短音(多數 < 1 秒)。這批最容易從音效庫批量湊齊。

| 檔名 | 用途 | 長度 |
|---|---|---|
| `click.mp3` | 按鈕點擊 | < 0.15s,要輕,會響非常多次 |
| `open-modal.mp3` | 面板開啟 | < 0.3s |
| `sword.mp3` | 單挑刀劍相擊 | < 0.5s |
| `horn.mp3` | 號角,出兵 | 1–2s |
| `gong.mp3` | 鑼,重大宣告 | 1–2s |
| `arrow.mp3` | 箭矢破空 | < 0.5s |
| `fire.mp3` | 火計點燃 | 1–2s |
| `coin.mp3` | 金錢收支 | < 0.4s |
| `defeat.mp3` | 敗北提示 | 1–2s |
| `victory.mp3` | 勝利提示 | 1–2s |
| `march.mp3` | 部隊開拔 | 1–2s |
| `bell.mp3` | 季節推進 | 1–2s |
| `dirge.mp3` | 武將殞命 | 2–3s,哀 |
| `crash.mp3` | 城牆崩塌 | 1–2s |
| `whoosh.mp3` | 畫面轉場 | < 0.4s |
| `pluck.mp3` | 琴音,文事/舌戰 | < 0.6s |
| `quake.mp3` | 地動 | 2–3s |
| `thud.mp3` | 重擊落地 | < 0.5s |
| `shout.mp3` | 士兵吶喊 | 1–2s |
| `wardrum.mp3` | 戰鼓 | 1–2s |
| `retreat.mp3` | 鳴金收兵 | 1–2s |
| `forge.mp3` | 鍛造 | 1–2s |
| `wedding.mp3` | 聯姻 | 2–3s,喜 |

## 3. 計略特效音 `public/audio/fx/<kind>.mp3`

**37 個**,戰法/計略施放時的 sting,建議 0.5–2 秒。
這批**可以最後補**——回退的合成音在這裡違和感最小。

```
fire  shipfire  oil  grain  lightning  thunderstorm  arrows  cannon
caltrops  shockwave  beast  streak  spears  blades  rocks  splash
shield  chain  net  grapple  scatter  swirl  feint  smoke  poison
ice  vortex  curse  rune  dragon  wind  gate  lamp  empty  charm
aura  drum
```

## 4. 事件情緒音 `public/audio/event/<mood>.mp3`

**5 個**,事件彈窗開啟時的短 cue,1–2 秒。

| 檔名 | 情緒 |
|---|---|
| `auspicious.mp3` | 祥瑞、喜訊 |
| `ominous.mp3` | 凶兆、讖緯 |
| `martial.mp3` | 軍事、征伐 |
| `somber.mp3` | 哀事、喪亂 |
| `mystic.mp3` | 天象、方術 |

---

## 建議採購順序

錢有限的話按這個順序,每一步都能單獨上線:

1. **5 首 BGM** —— 對「這遊戲值不值錢」的感知影響最大
2. **23 個通用音效** —— 尤其 `click` / `open-modal` / `sword` / `horn`,玩家最常聽到
3. **5 個事件 cue** —— 事件彈窗是這遊戲的高頻互動
4. **37 個計略 FX** —— 合成音在這裡最堪用,可以最後補

## 檔案體積

70 個檔案若用 128kbps mp3,音效約 20–30 KB 一個、BGM 約 2 MB 一首,
全套約 **12–15 MB**。相對現在 471 MiB 的包體可以忽略,不必為此壓縮音質。
BGM 建議 160–192kbps(循環音樂的壓縮痕跡比音效明顯)。
