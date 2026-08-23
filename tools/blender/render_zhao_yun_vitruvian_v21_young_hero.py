"""Render Zhao Yun v21 youthful-hero previews and finals."""

from pathlib import Path
import sys

import bpy


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
BLEND = SRC / "zhao-yun-vitruvian-v21-young-hero.blend"
FACE_PREVIEW = SRC / "zhao-yun-vitruvian-v21-young-hero-face-preview.png"
FACE = SRC / "zhao-yun-vitruvian-v21-young-hero-face.png"
HERO = SRC / "zhao-yun-vitruvian-v21-young-hero-upper.png"
FULL = SRC / "zhao-yun-vitruvian-v21-young-hero-full.png"

sys.path.insert(0, str(Path(__file__).resolve().parent))
import render_zhao_yun_vitruvian_v15_cinematic_hero as renderer  # pylint: disable=wrong-import-position


def configure():
    scene = renderer.configure_scene()
    scene.view_settings.exposure = -1.08
    for name, energy in {
        "ZhaoYun_Key": 61.0,
        "ZhaoYun_Fill": 7.0,
        "ZhaoYun_EyeLight": 7.8,
        "ZhaoYun_V15_Face_Warmth": 13.5,
        "ZhaoYun_V15_Lower_Fill": 0.0,
    }.items():
        obj = bpy.data.objects.get(name)
        if obj:
            obj.data.energy = energy
    colors = {
        "ZhaoYun_Fill": (0.56, 0.62, 0.70),
        "ZhaoYun_EyeLight": (0.86, 0.86, 0.86),
        "ZhaoYun_V15_Lower_Fill": (0.56, 0.63, 0.72),
    }
    for name, color in colors.items():
        obj = bpy.data.objects.get(name)
        if obj:
            obj.data.color = color
    return scene


def main():
    bpy.ops.wm.open_mainfile(filepath=str(BLEND))
    scene = configure()
    camera = bpy.data.objects["ZhaoYun_Portrait_Camera"]
    if "--face" in sys.argv:
        renderer.render(scene, camera, FACE, (0.61, -1.78, 1.58), (0.0, -0.02, 1.645), 100, (1200, 1400), 144)
        return
    if "--hero" in sys.argv:
        renderer.render(scene, camera, HERO, (1.27, -3.88, 1.19), (0.0, -0.01, 1.23), 82, (1100, 1400), 120)
        return
    if "--full" in sys.argv:
        renderer.render(scene, camera, FULL, (1.92, -4.82, 0.98), (0.0, 0.0, 1.13), 72, (1050, 1400), 104)
        return
    renderer.render(scene, camera, FACE_PREVIEW, (0.50, -1.48, 1.60), (0.0, -0.02, 1.65), 96, (560, 660), 52)


if __name__ == "__main__":
    main()
