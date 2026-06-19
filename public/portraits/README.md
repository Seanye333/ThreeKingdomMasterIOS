# Officer portraits

Each officer can have two hand-drawn assets here, both WebP, keyed by officer id:

    public/portraits/<id>.webp        square face crop  — list / duel ring / battle thumbnails
    public/portraits/<id>-full.webp   whole image, original aspect — officer-detail 立绘 (left column)

e.g. `zhao-yun.webp` + `zhao-yun-full.webp`. Anything missing falls back to the
procedural SVG silhouette, so you can add portraits incrementally — one, a
faction, or the whole roster.

## Batch import (recommended)

Don't crop by hand. Drop source images (any size/aspect, jpg/png/webp) into the
repo-root `portraits-src/` folder, named by the officer's **id**, **Chinese name
(simplified or traditional)**, or **English name**:

    portraits-src/zhao-yun.jpg
    portraits-src/赵云.png          (simplified — auto-matched to 趙雲)
    portraits-src/趙雲.jpeg         (traditional)
    portraits-src/Zhao Yun.png

then run:

    python3 scripts/import-portraits.py

It resolves each file to an officer id and writes both the `<id>.webp` square
crop and the `<id>-full.webp` full image, prints anything it couldn't match, and
reports coverage (how many officers now have a portrait). Re-running is safe.

One-time deps: `pip install --user Pillow opencc-python-reimplemented`

## Manual override

You can also just drop a correctly-named `<id>.webp` / `<id>-full.webp` here
directly — the import script only overwrites ids it finds a source file for, so
hand-tuned crops survive. Find ids in `src/game/data/officers.ts` (Three
Kingdoms) or `src/game/data/historicalOfficers.ts` (cross-over generals, `hist-…`).
