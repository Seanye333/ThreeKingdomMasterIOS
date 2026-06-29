# 單挑戰役封面 · 生成 Prompt(貼 ChatGPT / DALL-E / Sora)

用法:每張圖 = **STYLE BLOCK**(下方整段)+ 該戰役的 **SCENE**(一句)。英文出圖效果最好,直接貼英文。
出圖後壓縮丟進本資料夾,檔名 = campaign id:
```
sips -s format jpeg -s formatOptions 82 --resampleWidth 1400 in.png --out <campaignId>.jpg
```
⚠ 卡片把封面裁成**橫條**(約 16:5),主體請放畫面**中央橫帶**,上下會被切。缺圖不崩(banner 自動隱藏)。

---

## ⭐ STYLE BLOCK(每個 prompt 前都貼)

```
Epic cinematic Chinese historical key art, single-combat / champion-duel theme.
Photorealistic painterly matte-painting, highly detailed. Dramatic golden-hour
lighting, warm low sun, soft atmospheric haze and god-rays, drifting battlefield
dust. Muted heroic palette: antique gold, earth brown, deep crimson, charcoal
black, jade accents. Authentic ancient-Chinese armor, lacquered plate, horsehair
plumes, silk war banners, lamellar and helmets. Grand scale, shallow depth of
field, volumetric light, dynamic heroic composition. Keep the focal figures in
the CENTRAL HORIZONTAL BAND of the frame (the image is cropped to a wide banner).
16:9 widescreen, ultra-detailed.
NEGATIVE: no text, no captions, no watermark, no signature, no modern elements,
no Japanese/anime aesthetics, no gore.
```

---

## 三國篇(漢末三國)

### `rise-of-a-champion` 虎將之路
```
A single armored tiger-general on horseback before a vast army at dawn, levelling a green-dragon glaive at the enemy ranks, calm and unstoppable; a still-steaming cup of warm wine on a low table in the foreground, vapor rising — the legend of slaying a foe before the wine cooled.
```

### `duels-of-legend` 萬人敵之名
```
A lone spear-wielding warrior bursting deep into a sea of enemy soldiers, men and horses thrown aside in his wake, banners toppling, a single myriad-foe champion carving a path through ten thousand, motion blur of the charge.
```

### `generals-deathmatch` 名將生死鬥
```
Two veteran generals locked in a mounted duel, blades clashing in a lethal split-second, sparks flying, horses rearing, killing intent in their eyes, dust and crimson cloaks swirling, a true deathmatch of champions.
```

### `warlords-of-the-realm` 亂世群雄
```
A panorama of rival warlords standing beneath their own clan banners across a contested plain at dusk, each flanked by a fierce champion, smoke of scattered camps on the horizon — the fractured age of contending heroes.
```

### `siege-and-snare` 攻堅破伏
```
A night assault on a lone fortress, defenders' torches blazing on the battlements while hidden ambushers spring from the dark below, sudden fire and arrows, a champion fighting clear of the snare, tense and treacherous.
```

## 千古篇(跨代傳奇)

### `legends-of-the-ages` 千古名將
```
A heroic group silhouette of legendary generals from across the ages standing shoulder to shoulder along a river of time — a hegemon with a great halberd, an archer, a tiger-general, a marshal — each gripping a famed weapon, mythic timeless grandeur, layered golden mist.
```

### `emperors-and-khans` 帝王雄主
```
Three sovereign warlords standing together in commanding poise — a golden-armored Tang prince-general, a steppe khan in furs and lamellar, a masked prince-general in an ornate war-mask — imperial majesty, banners and a vast host behind them.
```

### `heroes-and-assassins` 俠骨刺客
```
A white-robed swordsman on the cold bank of the Yi River, wind whipping reeds and snow, the instant a hidden dagger is revealed from a map scroll, resolute and doomed, lone-blade chivalry and an assassin's resolve, pale wintry light.
```

### `tigers-of-every-age` 歷代名帥
```
A grand marshal resting a hand on his sword atop a high command terrace, looking out over a massed army, a signal banner in hand, calm strategic authority, sweeping host below, commander of every age.
```

### `loyalty-and-rebellion` 忠魂逆鱗
```
A desperate last stand within a besieged lone city, tattered banners over broken walls, loyal defenders fighting to the death amid ash and smoke, tragic and heroic, bleak twilight, the loyal soul that touches the dragon's scale.
```

### `founders-and-wanderers` 開國奇士
```
A commoner-born hero in plain robes gripping a sword beneath a rising sun, the banners of a new dynasty unfurling behind him on a distant rampart, dawn light, the dawn of a founding age.
```

### `sages-and-statesmen` 兵聖名臣
```
A military sage resting a hand on his sword as he surveys a battle array, bamboo war-scrolls and a sand-table map on the low table before him, composed strategic wisdom, lamplit pavilion, the sage and the statesman.
```

### `hegemons-and-rebels` 霸主梟雄
```
A ruthless hegemon standing atop a high platform surveying a land ablaze with beacon-fires, hand on sword hilt, gazing down with predatory ambition, smoke columns across the plain, overpowering menace.
```

### `strategists-of-genius` 奇謀儒將
```
A white-robed scholar-general standing serenely before his battle line holding a feather fan, behind him a river of chained warships erupting in flame, brilliant stratagem and scholarly grace, reflected firelight on dark water.
```
