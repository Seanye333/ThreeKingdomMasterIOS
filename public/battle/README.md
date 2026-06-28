# 戰果配圖(Battle-result key-art)

每打完一場戰術戰,結算畫面([BattleResultsModal])在「勝利/敗北」橫幅**背後**墊一張圖,壓暗 ~55% + 漸層罩保證「勝利/敗北」字與「捷/敗」朱印清晰。缺圖則只剩原本的文字橫幅(不變)。**引分(平局)不配圖。**

4 個 key = 野戰/攻城 × 勝/敗:

| key(檔名) | 觸發 |
|---|---|
| `field-victory` | 野戰大捷(`battle.field` 且勝) |
| `field-defeat` | 野戰慘敗 |
| `siege-victory` | 攻城/守城 勝(拔寨或卻敵) |
| `siege-defeat` | 攻城/守城 敗(城破或受挫) |

- 檔名:`public/battle/<key>.jpg`,規格同其餘:**16:9,~1400px,JPEG q≈82**。
  `sips -s format jpeg -s formatOptions 82 --resampleWidth 1400 in.png --out <key>.jpg`
- 橫幅是**又寬又扁的條狀裁切**(objectFit cover),所以**把主體放在畫面正中、別靠上下邊**(上下會被裁掉)。

---

## ⭐ STYLE BLOCK(每張都貼)
```
Epic cinematic Chinese historical key art, late Han dynasty / Three Kingdoms era,
photorealistic painterly matte-painting, highly detailed, dramatic lighting and
atmospheric haze, muted heroic palette (antique gold, earth brown, deep crimson,
charcoal). Composition centered with the main action in the MIDDLE of the frame
(top and bottom will be cropped to a wide banner). 16:9 widescreen, ultra-detailed.
NEGATIVE: no text, no captions, no watermark, no signature, no modern elements,
no Japanese/Ming/Qing aesthetics.
```

## SCENE(各 key)
```
field-victory (野戰大捷): a triumphant Han-dynasty field army at the moment of victory on an open battlefield, a general center-frame raising his blade amid cheering soldiers and a forest of banners, routed enemies fleeing in the distance, dust and warm golden battle-light, exultant triumph.
```
```
field-defeat (野戰慘敗): a shattered Han-dynasty army in defeat on an open battlefield at dusk, broken banners and fallen soldiers, survivors retreating through smoke and gloom center-frame, a grim grey-crimson sky, sorrow and ruin, desaturated.
```
```
siege-victory (攻城拔寨/守城卻敵): a victorious moment at a Han-dynasty city wall, soldiers swarming the ramparts center-frame and raising their banner high on the captured/held battlements, fire and dust below, triumphant siege, dramatic golden light.
```
```
siege-defeat (城破/攻城受挫): catastrophe at a Han-dynasty city wall, the rampart breached and burning center-frame, defenders overwhelmed and falling back, siege ladders and black smoke against a dark blood-red sky, the fall of a stronghold, grim and desperate.
```
