"""Render Zhao Yun v20 handsome rebuild previews and finals."""

from pathlib import Path
import sys

import bpy


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
BLEND = SRC / "zhao-yun-vitruvian-v20-handsome-rebuild.blend"
FACE_PREVIEW = SRC / "zhao-yun-vitruvian-v20-handsome-face-preview.png"
FACE = SRC / "zhao-yun-vitruvian-v20-handsome-face.png"
HERO = SRC / "zhao-yun-vitruvian-v20-handsome-hero.png"
FULL = SRC / "zhao-yun-vitruvian-v20-handsome-full.png"

sys.path.insert(0, str(Path(__file__).resolve().parent))
import render_zhao_yun_vitruvian_v15_cinematic_hero as v15_render  # pylint: disable=wrong-import-position


def main():
    bpy.ops.wm.open_mainfile(filepath=str(BLEND))
    scene = v15_render.configure_scene()
    scene.view_settings.exposure = -1.10
    for name, energy in {
        "ZhaoYun_Key": 61.0,
        "ZhaoYun_Fill": 7.0,
        "ZhaoYun_EyeLight": 9.2,
        "ZhaoYun_V15_Face_Warmth": 13.5,
    }.items():
        obj = bpy.data.objects.get(name)
        if obj:
            obj.data.energy = energy
    camera = bpy.data.objects["ZhaoYun_Portrait_Camera"]
    if "--face" in sys.argv:
        v15_render.render(scene, camera, FACE, (0.48, -1.78, 1.62), (0.0, -0.02, 1.64), 98, (1200, 1400), 144)
        return
    if "--hero" in sys.argv:
        v15_render.render(scene, camera, HERO, (1.27, -3.88, 1.19), (0.0, -0.01, 1.23), 82, (1100, 1400), 120)
        return
    if "--full" in sys.argv:
        v15_render.render(scene, camera, FULL, (1.92, -4.82, 0.98), (0.0, 0.0, 1.13), 72, (1050, 1400), 104)
        return
    v15_render.render(scene, camera, FACE_PREVIEW, (0.50, -1.48, 1.600), (0.0, -0.020, 1.650), 96, (560, 660), 52)


if __name__ == "__main__":
    main()
