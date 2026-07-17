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

# Optional face detection — when OpenCV is present the square thumbnail is cropped
# centred on the detected face (so a full-body 立繪 yields a head-and-shoulders
# avatar instead of a torso with the head sliced off). Without it we fall back to
# a top-anchored crop, since in these portraits the head is always near the top.
#   pip install --user opencv-python-headless
try:
    import cv2
    import numpy as np
    _CASC = [
        cv2.CascadeClassifier(cv2.data.haarcascades + n)
        for n in ("haarcascade_frontalface_default.xml",
                  "haarcascade_frontalface_alt2.xml",
                  "haarcascade_profileface.xml")
    ]
except Exception:
    cv2 = None
    print("(note) OpenCV not installed — face-centred crop disabled, using top anchor.\n"
          "       pip install --user opencv-python-headless")

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


def _detect_face(im):
    """Largest face in the upper ~65% of the image, or None. Aggressive: small
    minSize (catches the small head in a full-body 立繪) and a horizontally-flipped
    pass so the profile cascade catches faces turned either way."""
    if cv2 is None:
        return None
    gray = cv2.equalizeHist(cv2.cvtColor(np.array(im), cv2.COLOR_RGB2GRAY))
    H, W = gray.shape
    mins = int(W * 0.035)
    dets = []
    for cc in _CASC:
        for d in cc.detectMultiScale(gray, scaleFactor=1.08, minNeighbors=4,
                                     minSize=(mins, mins)):
            dets.append(tuple(int(v) for v in d))
    # profile cascade only fires for faces looking one way — flip to catch the other
    for d in _CASC[-1].detectMultiScale(cv2.flip(gray, 1), scaleFactor=1.08,
                                        minNeighbors=4, minSize=(mins, mins)):
        x, y, fw, fh = (int(v) for v in d)
        dets.append((W - x - fw, y, fw, fh))
    if not dets:
        return None
    up = [d for d in dets if (d[1] + d[3] / 2) < H * 0.65]
    # bigger is better, higher (smaller y) is better — keeps us off a torso/banner
    return max(up or dets, key=lambda d: d[2] * d[3] - d[1] * W * 0.02)


def square_crop(im):
    """A 512×512 square avatar. With OpenCV, centred on the detected face with
    generous headroom (so the top of the head is always in frame — a full-body 立繪
    still yields a head-and-shoulders crop, not a torso with the head sliced off);
    otherwise anchored near the top, where the head sits in these portraits."""
    w, h = im.size
    f = _detect_face(im)
    if f is not None:
        fx, fy, fw, fh = f
        cx = fx + fw / 2
        side = min(int(fh * 3.25), w, h)         # face ≈ 31% of the square height
        top = int(fy - 1.15 * fh)                # headroom for a tall cap/helmet/冠
        left = max(0, min(int(cx - side / 2), w - side))
        top = max(0, min(top, h - side))
        box = (left, top, left + side, top + side)
    elif h >= w:                                 # portrait → tight top-centre crop so
        side = int(min(w, h * 0.66))             # the head fills more than a full-width
        left = max(0, (w - side) // 2)           # square would (head sits top-centre)
        top = min(int(h * 0.02), h - side)
        box = (left, top, left + side, top + side)
    else:                                        # landscape → centre horizontally
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

    requested = set(sys.argv[1:])
    if requested:
        missing = [fn for fn in sorted(requested) if not os.path.exists(os.path.join(SRC_DIR, fn))]
        if missing:
            sys.exit("Missing source file(s): " + ", ".join(missing))
        source_files = sorted(requested)
    else:
        source_files = sorted(os.listdir(SRC_DIR))

    matched, unresolved, failed = [], [], []
    for fn in source_files:
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
