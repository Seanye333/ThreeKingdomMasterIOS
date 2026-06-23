# 慶典彈窗素材 (Celebration popup assets)

Drop generated art here. Each file's name is a **popup key**:

| Key | 觸發 | 建議畫面 |
|---|---|---|
| `capital-set` ✅ | 遷都成功 | 新都旌旗、宮闕、百官朝賀 |
| `city-upgrade-town` ✅ | 升「鎮」 | 邑→鎮,市集漸興 |
| `city-upgrade-city` ✅ | 升「城」 | 城牆築起、人煙稠密 |
| `city-upgrade-large` ✅ | 升「大城」 | 通衢廣陌、樓閣連雲 |
| `city-upgrade-capital` ✅ | 升「都」 | 天下名都、車馬輻輳 |

Formats:
- Image: `<key>.jpg` (preferred) or `<key>.png` (fallback). Absent → styled card.
- Video: `<key>.mp4` (only used when the event asks for video)

Recommended: 16:9, ~1400px wide, JPEG q≈82 (≈300–500 KB). Compress big exports
on macOS with no extra tools:

```
sips -s format jpeg -s formatOptions 82 --resampleWidth 1400 in.png --out capital-set.jpg
```

Missing files are fine — the popup degrades to a card automatically.
