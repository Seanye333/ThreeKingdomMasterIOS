#!/usr/bin/env python3
"""
Batch-import officer portraits.

Drop source images into  portraits-src/  named by the officer's id, Chinese name
(simplified OR traditional), or English name — e.g. any of:

    portraits-src/zhao-yun.jpg
    portraits-src/赵云.png        (simplified)
    portraits-src/趙雲.jpeg       (traditional)
    portraits-src/Zhao Yun.png

Then run:

    python3 scripts/import-portraits.py

For every file it resolves to an officer it writes two assets the game loads:

    public/portraits/<id>.webp        512×512 square face crop  (list / duel / battle thumbnails)
    public/portraits/<id>-full.webp   the whole image, original aspect (officer-detail 立绘)

Unresolved filenames are listed so you can rename them. Re-running is safe
(idempotent) — it just overwrites the webp outputs.

Deps:  pip install --user Pillow opencc-python-reimplemented
"""
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC_DIR = os.path.join(ROOT, "portraits-src")
OUT_DIR = os.path.join(ROOT, "public", "portraits")
DATA_FILES = [
    os.path.join(ROOT, "src", "game", "data", "officers.ts"),
    os.path.join(ROOT, "src", "game", "data", "historicalOfficers.ts"),
]
IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".webp", ".bmp", ".tif", ".tiff"}

try:
    from PIL import Image
except ImportError:
    sys.exit("Pillow not installed — run: pip install --user Pillow")

try:
    from opencc import OpenCC
    _t2s = OpenCC("t2s").convert
    _s2t = OpenCC("s2t").convert
except Exception:
    print("(note) opencc not installed — simplified⇄traditional matching disabled.\n"
          "       pip install --user opencc-python-reimplemented")
    _t2s = lambda s: s
    _s2t = lambda s: s

# id: '<id>', name: { en: '<en>', zh: '<zh>' }
ENTRY_RE = re.compile(r"id:\s*'([^']+)'[^\n]*?name:\s*\{\s*en:\s*'([^']+)'\s*,\s*zh:\s*'([^']+)'")


def build_index():
    """name (id / zh-trad / zh-simp / english / english-kebab) -> officer id"""
    index, officer_ids = {}, set()
    for path in DATA_FILES:
        if not os.path.exists(path):
            continue
        for oid, en, zh in ENTRY_RE.findall(open(path, encoding="utf-8").read()):
            officer_ids.add(oid)
            index[oid] = oid
            for key in (zh, _t2s(zh), _s2t(zh), en.lower(), en.lower().replace(" ", "-")):
                index.setdefault(key, oid)
    return index, officer_ids


def resolve(stem, index):
    for key in (stem, stem.lower(), _t2s(stem), _s2t(stem), stem.lower().replace(" ", "-")):
        if key in index:
            return index[key]
    return None


def square_crop(im):
    """A 512×512 face-biased square: full width near the top for tall portraits,
    centered for wide ones."""
    w, h = im.size
    if h >= w:                       # portrait → keep width, bias so the face (usually
        side = w                     # the upper third of a full-body figure) lands in
        top = min(int(h * 0.14), h - side)  # the upper ~40% of the square
        box = (0, top, side, top + side)
    else:                            # landscape → center horizontally
        side = h
        left = (w - side) // 2
        box = (left, 0, left + side, side)
    return im.crop(box).resize((512, 512), Image.LANCZOS)


def downscale(im, cap=1024):
    w, h = im.size
    if max(w, h) <= cap:
        return im
    scale = cap / max(w, h)
    return im.resize((int(w * scale), int(h * scale)), Image.LANCZOS)


def main():
    if not os.path.isdir(SRC_DIR):
        sys.exit(f"No source dir: {SRC_DIR}  (create it and drop images in)")
    os.makedirs(OUT_DIR, exist_ok=True)
    index, officer_ids = build_index()
    print(f"Indexed {len(officer_ids)} officers from data.\n")

    matched, unresolved, failed = [], [], []
    for fn in sorted(os.listdir(SRC_DIR)):
        stem, ext = os.path.splitext(fn)
        if ext.lower() not in IMAGE_EXTS:
            continue
        oid = resolve(stem, index)
        if not oid:
            unresolved.append(fn)
            continue
        try:
            im = Image.open(os.path.join(SRC_DIR, fn)).convert("RGB")
            square_crop(im).save(os.path.join(OUT_DIR, f"{oid}.webp"), "WEBP", quality=90, method=6)
            downscale(im).save(os.path.join(OUT_DIR, f"{oid}-full.webp"), "WEBP", quality=88, method=6)
            matched.append((fn, oid))
        except Exception as e:  # noqa: BLE001
            failed.append((fn, str(e)))

    for fn, oid in matched:
        print(f"  ✓ {fn}  →  {oid}.webp + {oid}-full.webp")
    for fn, err in failed:
        print(f"  ✗ {fn}  — {err}")
    if unresolved:
        print("\nUnresolved (rename to an id / Chinese name / English name):")
        for fn in unresolved:
            print(f"  ? {fn}")

    have = {f[:-len("-full.webp")] if f.endswith("-full.webp") else f[:-len(".webp")]
            for f in os.listdir(OUT_DIR) if f.endswith(".webp")}
    print(f"\nDone: {len(matched)} imported, {len(failed)} failed, {len(unresolved)} unresolved.")
    print(f"Coverage: {len(have & officer_ids)}/{len(officer_ids)} officers now have a portrait.")


if __name__ == "__main__":
    main()
