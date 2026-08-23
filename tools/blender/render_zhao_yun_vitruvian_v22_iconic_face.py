"""Render Zhao Yun v22 iconic-face previews and finals."""

from pathlib import Path
import sys

import bpy


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
BLEND = SRC / "zhao-yun-vitruvian-v22-iconic-face.blend"
PREVIEW = SRC / "zhao-yun-vitruvian-v22-iconic-face-preview.png"
FACE = SRC / "zhao-yun-vitruvian-v22-iconic-face.png"
HERO = SRC / "zhao-yun-vitruvian-v22-iconic-hero.png"

sys.path.insert(0, str(Path(__file__).resolve().parent))
import render_zhao_yun_vitruvian_v15_cinematic_hero as renderer  # pylint: disable=wrong-import-position


def configure():
    scene = renderer.configure_scene()
    scene.view_settings.exposure = -1.08
    settings = {
        "ZhaoYun_Key": (59.0, (1.0, 0.74, 0.56)),
        "ZhaoYun_Fill": (5.0, (0.58, 0.62, 0.68)),
        "ZhaoYun_Rim": (42.0, (0.58, 0.67, 0.80)),
        "ZhaoYun_EyeLight": (8.4, (0.90, 0.86, 0.82)),
        "ZhaoYun_V15_Face_Warmth": (15.5, (1.0, 0.62, 0.46)),
        "ZhaoYun_V15_Lower_Fill": (0.0, (0.60, 0.64, 0.70)),
    }
    for name, (energy, color) in settings.items():
        obj = bpy.data.objects.get(name)
        if obj:
            obj.data.energy = energy
            obj.data.color = color
    return scene


def main():
    bpy.ops.wm.open_mainfile(filepath=str(BLEND))
    scene = configure()
    camera = bpy.data.objects["ZhaoYun_Portrait_Camera"]
    if "--face" in sys.argv:
        renderer.render(scene, camera, FACE, (0.66, -1.82, 1.535), (0.0, -0.02, 1.645), 102, (1200, 1400), 152)
        return
    if "--hero" in sys.argv:
        renderer.render(scene, camera, HERO, (1.34, -3.90, 1.10), (0.0, -0.01, 1.24), 84, (1100, 1400), 124)
        return
    renderer.render(scene, camera, PREVIEW, (0.54, -1.50, 1.555), (0.0, -0.02, 1.645), 98, (600, 700), 58)


if __name__ == "__main__":
    main()
