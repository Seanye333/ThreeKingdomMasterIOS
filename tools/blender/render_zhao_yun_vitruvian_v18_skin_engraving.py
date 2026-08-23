"""Render Zhao Yun v18 skin and engraving previews/finals."""

from pathlib import Path
import sys

import bpy


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
BLEND = SRC / "zhao-yun-vitruvian-v18-skin-engraving.blend"
FACE_PREVIEW = SRC / "zhao-yun-vitruvian-v18-face-preview.png"
HERO_PREVIEW = SRC / "zhao-yun-vitruvian-v18-hero-preview.png"
FACE = SRC / "zhao-yun-vitruvian-v18-face.png"
HERO = SRC / "zhao-yun-vitruvian-v18-hero.png"
FULL = SRC / "zhao-yun-vitruvian-v18-full.png"

sys.path.insert(0, str(Path(__file__).resolve().parent))
import render_zhao_yun_vitruvian_v15_cinematic_hero as v15_render  # pylint: disable=wrong-import-position


def main():
    bpy.ops.wm.open_mainfile(filepath=str(BLEND))
    scene = v15_render.configure_scene()
    eye_light = bpy.data.objects.get("ZhaoYun_EyeLight")
    if eye_light:
        eye_light.data.energy = 8.8
    camera = bpy.data.objects["ZhaoYun_Portrait_Camera"]
    if "--face-preview" in sys.argv:
        v15_render.render(scene, camera, FACE_PREVIEW, (0.66, -2.35, 1.60), (0.0, -0.01, 1.625), 103, (700, 820), 64)
        return
    if "--preview" in sys.argv:
        v15_render.render(scene, camera, HERO_PREVIEW, (1.30, -3.92, 1.20), (0.0, -0.01, 1.25), 82, (700, 900), 56)
        return
    if "--face" in sys.argv:
        v15_render.render(scene, camera, FACE, (0.66, -2.35, 1.60), (0.0, -0.01, 1.625), 103, (1200, 1400), 144)
        return
    if "--full" in sys.argv:
        v15_render.render(scene, camera, FULL, (1.92, -4.82, 0.98), (0.0, 0.0, 1.13), 72, (1050, 1400), 104)
        return
    v15_render.render(scene, camera, HERO, (1.27, -3.88, 1.19), (0.0, -0.01, 1.23), 82, (1100, 1400), 120)


if __name__ == "__main__":
    main()
