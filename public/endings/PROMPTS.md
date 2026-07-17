# 結局 key-art · 生成 Prompt(貼 ChatGPT / DALL-E / Sora)

每張 = **STYLE BLOCK** + 該結局的 **SCENE**。英文出圖最好。出圖後壓縮丟本資料夾,檔名 = kind:
```
sips -s format jpeg -s formatOptions 82 --resampleWidth 1400 in.png --out <kind>.jpg
```
缺圖不崩(退回程序 SVG 水墨小景)。

---

## ⭐ STYLE BLOCK(每個 prompt 前都貼)

```
Epic cinematic Chinese historical key art — a grand FINALE / ending splash, the emotional
climax of an era. Photorealistic painterly matte-painting, ultra high resolution, highly
detailed. Sweeping dramatic lighting, deep atmosphere, volumetric god-rays. Muted heroic
palette: antique gold, earth brown, deep crimson, charcoal black, jade accents. Authentic
late-Han / Three-Kingdoms China — grey-tiled palace roofs, red-lacquered columns, stone
terraces, silk war banners, lamellar armor. Monumental scale, cinematic wide composition,
subject centered with atmospheric space around. 16:9 widescreen.
NEGATIVE: no text, no captions, no watermark, no signature, no modern elements,
no Japanese/anime aesthetics.
```

---

### `unify` 天下統一(王道一統)
```
A benevolent sovereign at the summit of a grand unification rite receiving the homage of all realms, a vast peaceful land unrolling to the horizon under a radiant golden dawn, myriad subjects and officials bowing, a single imperial banner over a reunited realm, serene majesty and virtuous glory.
```

### `unify-tyrant` 霸道一統
```
A realm unified by the sword — an iron-willed conqueror standing atop a hill of shields and spears over a scorched battlefield at blood-red dusk, one dominant war-banner planted, ranks of soldiers below, the whole land subdued by force, dark crimson and ash, overwhelming martial dominance.
```

### `endured` 久御四海
```
An aged emperor standing alone on a high palace terrace at sunset, gazing out over a long-held realm, weathered and serene after decades of rule, long shadows and golden autumn light, banners of fallen rivals lying quiet below, the calm of a dynasty that outlasted its age.
```

### `restore-han` 漢室再興
```
The Han dynasty restored — a great "漢" war-banner raised once more over the palace towers of a reclaimed Luoyang, Liu-clan standards flying, officials and soldiers rejoicing in the courtyard, solemn golden light breaking through, the mandate of Han renewed.
```

### `hegemon` 霸業既成
```
A hegemon's triumph — a ruthless overlord standing before the gates of a seized capital, the banners of conquered rivals replaced by his single colour flying from every battlement, a great sword planted before the gate, gazing over his dominion at dusk, commanding and predatory.
```

### `tripartite` 三國鼎立
```
The Three Kingdoms stand in balance — three great war-banners (blue Wei, crimson Shu, green Wu) planted on three commanding heights across a divided landscape of rivers and mountains, a tense equilibrium of three powers, sweeping panorama at golden hour, epic stalemate.
```

### `recluse` 隱士退隐
```
A sage retires from the world — a lone scholar-hermit in plain robes on a small boat drifting on a misty river (or before a mountain thatched hut), a white crane in flight, distant peaks and cloud-sea, tranquil and transcendent, letting go of worldly glory, soft ethereal light.
```

### `emperor` 即位稱帝
```
An enthronement — the new emperor in dragon robes and beaded imperial crown seated upon the dragon throne receiving the homage of a hundred realms, golden hall of red columns and hanging banners, incense and radiant light, the supreme moment of imperial coronation, awe and grandeur.
```

### `defeat` 敗亡
```
Defeat and ruin — a torn banner and a broken halberd on a battlefield before a lone burning fortress at sunset, the silence after collapse, embers and drifting ash, a fallen helm, bleak and tragic grandeur, the somber end of an ambition.
```
