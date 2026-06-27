# 慶典彈窗 · 生成 Prompt(貼 ChatGPT / DALL-E / Sora)

用法:每張圖 = **STYLE BLOCK**(下方整段)+ 該 key 的 **SCENE**(一句)。英文出圖效果最好,直接貼英文。
出圖後壓縮丟進本資料夾,檔名 = key:
```
sips -s format jpeg -s formatOptions 82 --resampleWidth 1400 in.png --out <key>.jpg
```
缺圖不崩(退化為卡片)。🎬 = 也可做 `<key>.mp4` 短視頻:STYLE + SCENE + **MOTION** + `4–6 second seamless loop, slow cinematic camera`;**做了 mp4 才把該 key 的 `media` 改 `'video'`**,否則保持 `image`(video 失敗只退化為卡片、不會回退到 jpg)。

---

## ⭐ STYLE BLOCK(每個 prompt 前都貼)

```
Epic cinematic Chinese historical key art, late Han dynasty / Three Kingdoms era
(3rd-century China). Photorealistic painterly matte-painting, highly detailed.
Dramatic golden-hour lighting, warm low sun, soft atmospheric haze and god-rays.
Muted heroic palette: antique gold, earth brown, deep crimson, charcoal black,
jade accents. Authentic Han architecture — sweeping grey-tiled roofs, red-lacquered
columns, gilded finials, stone terraces, hanging silk banners. Grand scale, shallow
depth of field, volumetric light. 16:9 widescreen, ultra-detailed.
NEGATIVE: no text, no captions, no watermark, no signature, no modern elements,
no Japanese/Ming/Qing aesthetics, keep Han-era 3rd-century China.
```

---

## 第一章 · 城市/內政/經濟

### `disaster-drought` ✅
```
A parched Han-dynasty farmland under a merciless white-hot sky, cracked dry riverbed, withered millet fields, a lone farmer kneeling in despair clutching dead stalks, an idle waterwheel by an empty channel, dust haze and heat shimmer, oppressive ominous mood, harsh pale light (less golden).
```

### `disaster-flood` ✅
```
A swollen muddy river bursting its banks and swallowing Han-dynasty paddy fields and a riverside village, villagers fleeing to high ground carrying children and grain sacks, a broken earthen dike, grey storm light, churning brown water, desperate rescue.
```

### `disaster-plague` ✅
```
A shrouded Han-dynasty town gripped by plague, physicians in cloth masks tending rows of the sick under makeshift awnings, smoking braziers of medicinal herbs, white mourning cloth hung in doorways, dim overcast light, somber and tense, muted grey-green palette.
```

### `disaster-locust` ⏳ 🎬 (備用美術;engine 以 famine 出,可作 drought 替圖)
```
A vast dark swarm of locusts blotting out the sun over Han-dynasty grain fields, panicked peasants waving cloth and beating gongs, sky turned sickly brown-green, stalks stripped bare, a magistrate watching in horror from a field path, apocalyptic dread.
```
MOTION: `the locust swarm churns and surges across the sky, peasants flail, dust drifts.`

### `specialty-discovered` ⏳
```
Officials and merchants marveling at a freshly opened chest of rare regional treasure (bolts of fine silk, jade, lacquerware, or a string of fine horses) in a bustling Han-dynasty market courtyard, golden light, banners, prosperity and discovery.
```

### `forge-masterpiece` ⏳ (ForgingModal 已有 ForgedReveal)
```
Inside a Han-dynasty forge at night, a master blacksmith lifting a newly forged glowing white-hot legendary blade from the anvil, a fountain of orange sparks, molten light on his sweat-streaked face and on awed onlookers, hammer mid-swing, intense heat glow, heroic.
```

---

## 第二章 · 武將/成長/家族

### `breakthrough-rebirth` ✅ 🎬
```
A warrior-sage achieving transcendent breakthrough on a mountaintop shrine at dawn, a radiant golden aura and swirling energy erupting around him, five glowing points of light orbiting his body, robes and hair lifted by a spiritual wind, a distant sea of clouds and peaks below, ecstatic enlightenment, divine ascension.
```
MOTION: `the golden aura ignites and pulses outward in a slow shockwave, motes of light spiral upward, cloth billows, slow push-in.`

### `grade-promotion` ✅
```
A formal Han-dynasty court investiture: a kneeling general in armor receiving a golden seal and a crimson silk robe from his lord on a raised dais, rows of officials bowing in a grand pillared hall, hanging banners, shafts of golden light, ceremonial gravitas, honor and triumph.
```

### `heir-coming-of-age` ✅
```
A young man in his coming-of-age cap and new formal robes stepping for the first time into a Han-dynasty court, his proud father presenting him to assembled officials, morning light through the hall, banners, a fresh hopeful beginning, dignified.
```

### `heir-born` ⏳
```
Joyful celebration in a Han-dynasty noble household as a midwife presents a swaddled newborn to the beaming father and family, red silk lanterns and decorations, warm candlelight in an inner courtyard, servants bringing wine, tender and festive.
```

### `wedding` ✅
```
A Han-dynasty wedding ceremony, bride and groom in red-and-gold ceremonial robes bowing to heaven and earth before an altar, red silk drapery, paired candles, family and guests in a lantern-lit hall, joyous auspicious celebration.
```

### `officer-death` ✅
```
A solemn state funeral for a great Han-dynasty general: a white-and-black draped bier borne in procession through a city gate, soldiers and officials in mourning white lining the road, banners lowered, grey overcast dawn, leaves falling, profound grief and honor.
```

### `peerage-granted` ✅
```
An ennoblement ceremony in a grand Han-dynasty hall: a lord bestowing a marquis's gold-and-jade seal and a patent of nobility upon a kneeling vassal, attendants holding the ceremonial robe and tasseled crown, rows of courtiers, incense smoke, golden light, lofty honor.
```

### `honorific-granted` ✅
```
A martial investiture on a windswept Han-dynasty parade ground: a lord handing a great command banner and a bronze tiger-tally to an armored general before ranked troops, war drums and fluttering standards, dust and golden dusk light, martial pride and authority.
```

---

## 第三章 · 人才/招攬/舌戰

### `appraisal-verdict` ✅
```
A renowned scholar-critic delivering a public verdict on a young talent before a rapt crowd in a Han-dynasty garden pavilion, the subject standing modestly under scrutiny, listeners murmuring and nodding, refined scholarly atmosphere, autumn maples, soft cultured light.
```

### `persuasion-defection` ⏳ (與 officer-recruited 略重疊)
```
An envoy in scholar's robes leaving a rival lord's hall with a defecting general at his side, a treaty scroll in hand, the rival court watching tensely behind, dusk light, banners of two contrasting colors, the charged tension of a turned allegiance.
```

---

## 第四章 · 軍事指揮/委任

### `grand-muster` ✅
```
Multiple Han-dynasty armies converging on a grand staging plain, columns of troops from different directions meeting amid a sea of tents and banners, commanders conferring over a map table in a great war pavilion, organized vastness, golden afternoon light, the gathering of a host.
```

### `army-march` ⏳ 🎬 (移動為逐格,觸發暫缺)
```
A great Han-dynasty army marching out through a massive city gate at dawn, mounted generals leading endless columns of spearmen and cavalry, a forest of banners and standards, rising dust, crowds and a lord watching from the wall, epic momentum and resolve.
```
MOTION: `banners ripple, dust drifts, the column advances toward camera, slow cinematic dolly.`

### `governor-appointed` ✅
```
A lord conferring the seal and tally of a commandery governorship on a kneeling official in a Han-dynasty hall, the new governor receiving the bronze seal-ribbon with both hands, attendants and banners, formal solemnity, golden light, the weight of office.
```

### `province-governor` ✅
```
An elevated investiture to provincial governor: a high official receiving the greater seal, a ceremonial axe and a province's command banner before assembled commandery officials and troops, a large provincial map displayed, a grander hall, imposing majestic authority, golden light.
```

### `evaluation-results` ✅
```
A Han-dynasty court assembly for the annual performance review: a great merit-ranking board unveiled before kneeling governors, the top performer honored with a robe while a failing one bows his head in shame, the lord presiding from the dais, tense ceremonial judgment, hall of pillars and banners.
```

### `advisor-scheme` ⏳ (軍師為被動乘子,觸發暫缺)
```
A military strategist presenting a bold plan in a Han-dynasty war tent at night, leaning over a lamplit map of cities and rivers, generals listening intently around the table, candle and brazier glow, scrolls and a feather fan, the spark of a winning stratagem.
```
