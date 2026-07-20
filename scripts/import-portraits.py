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
#
# Detection uses the YuNet DNN model shipped next to this script. Do NOT go back to
# the Haar cascades: they hallucinate faces in dark armour/banner texture and miss
# profile / looking-down faces, which is how a whole library re-import once turned
# hundreds of avatars into torsos, horses and rooftops.
YUNET = os.path.join(os.path.dirname(os.path.abspath(__file__)), "yunet.onnx")
try:
    import cv2
    import numpy as np
    _CASC = [
        cv2.CascadeClassifier(cv2.data.haarcascades + n)
        for n in ("haarcascade_frontalface_default.xml",
                  "haarcascade_frontalface_alt2.xml",
                  "haarcascade_profileface.xml")
    ]
    _YUNET = (cv2.FaceDetectorYN.create(YUNET, "", (320, 320), 0.5, 0.3, 5000)
              if os.path.exists(YUNET) else None)
    if _YUNET is None:
        print(f"(note) {YUNET} missing — falling back to the weaker Haar cascades.")
except Exception:
    cv2 = None
    _YUNET = None
    print("(note) OpenCV not installed — face-centred crop disabled, using top anchor.\n"
          "       pip install --user opencv-python-headless")

# Uniform framing: every avatar gets the face at the same size and the same spot,
# so heads look consistent across the officer list / battle thumbnails.
FACE_FRACTION = 0.30   # face-box height as a fraction of the square
FACE_CY = 0.44         # face centre, vertically, in the square (headroom for a 冠)

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


def _detect_faces(bgr, det_max=1024):
    """Every face as (x, y, w, h) in image px. YuNet first (detects profile and
    looking-down faces the cascades miss); one brightened retry for dark scenes;
    the Haar cascades only if the model is unavailable."""
    if cv2 is None:
        return []
    h, w = bgr.shape[:2]
    if _YUNET is not None:
        s = min(1.0, det_max / max(w, h))
        small = (cv2.resize(bgr, (int(w * s), int(h * s)), interpolation=cv2.INTER_AREA)
                 if s < 1 else bgr)
        for img in (small, cv2.convertScaleAbs(small, alpha=1.8, beta=10)):
            _YUNET.setInputSize((img.shape[1], img.shape[0]))
            _, faces = _YUNET.detect(img)
            if faces is not None and len(faces):
                return [tuple(float(v) / s for v in f[:4]) for f in faces]
        return []
    gray = cv2.equalizeHist(cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY))
    mins = int(w * 0.035)
    dets = []
    for cc in _CASC:
        for d in cc.detectMultiScale(gray, scaleFactor=1.08, minNeighbors=4,
                                     minSize=(mins, mins)):
            dets.append(tuple(float(v) for v in d))
    # profile cascade only fires for faces looking one way — flip to catch the other
    for d in _CASC[-1].detectMultiScale(cv2.flip(gray, 1), scaleFactor=1.08,
                                        minNeighbors=4, minSize=(mins, mins)):
        x, y, fw, fh = (float(v) for v in d)
        dets.append((w - x - fw, y, fw, fh))
    return dets


def _pick_face(dets, w, h):
    """The head sits up top in these portraits — prefer a big face in the upper 2/3,
    which keeps us off a torso, a banner or a second figure in the background."""
    if not dets:
        return None
    up = [d for d in dets if (d[1] + d[3] / 2) < h * 0.68]
    return max(up or dets, key=lambda d: d[2] * d[3] - d[1] * w * 0.02)


def _crop_padded(bgr, left, top, side):
    """Crop, edge-padding whatever falls outside the image. Padding rather than
    shrinking the box is what keeps the head the same size everywhere — clamping to
    the canvas would silently zoom portraits whose head sits near an edge."""
    h, w = bgr.shape[:2]
    l, t, s = int(round(left)), int(round(top)), int(round(side))
    pl, pt = max(0, -l), max(0, -t)
    pr, pb = max(0, l + s - w), max(0, t + s - h)
    if pl or pt or pr or pb:
        bgr = cv2.copyMakeBorder(bgr, pt, pb, pl, pr, cv2.BORDER_REPLICATE)
        l, t = l + pl, t + pt
    return bgr[t:t + s, l:l + s]


def square_crop(im):
    """A 512×512 square avatar framed the same way for every officer: the detected
    face is FACE_FRACTION of the square's height and its centre lands at
    (0.5, FACE_CY) — head centred, with headroom for a tall cap/helmet/冠. Without a
    face (or without OpenCV) we anchor near the top, where the head sits in these."""
    w, h = im.size
    if cv2 is not None:
        bgr = cv2.cvtColor(np.array(im), cv2.COLOR_RGB2BGR)
        f = _pick_face(_detect_faces(bgr), w, h)
    else:
        f = None
    if f is not None:
        fx, fy, fw, fh = f
        side = fh / FACE_FRACTION
        left = (fx + fw / 2) - side / 2
        top = (fy + fh / 2) - FACE_CY * side
        sq = _crop_padded(bgr, left, top, side)
        return Image.fromarray(cv2.cvtColor(sq, cv2.COLOR_BGR2RGB)).resize(
            (512, 512), Image.LANCZOS)
    if h >= w:                                   # portrait → tight top-centre crop so
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
