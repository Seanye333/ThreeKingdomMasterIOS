"""Render Zhao Yun v26 reference-rebuild diagnostics and portraits."""

from pathlib import Path
import sys

import bpy


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
BLEND = SRC / "zhao-yun-vitruvian-v26-reference-rebuild.blend"
PREVIEW = SRC / "zhao-yun-vitruvian-v26-reference-rebuild-preview.png"
FACE = SRC / "zhao-yun-vitruvian-v26-reference-rebuild-face.png"
EYES = SRC / "zhao-yun-vitruvian-v26-reference-rebuild-eyes.png"

sys.path.insert(0, str(Path(__file__).resolve().parent))
import render_zhao_yun_vitruvian_v24_cinematic_lead as v24  # pylint: disable=wrong-import-position
import render_zhao_yun_vitruvian_v15_cinematic_hero as renderer  # pylint: disable=wrong-import-position


def configure():
    scene = v24.configure()
    scene.view_settings.exposure = -0.94
    settings = {
        "ZhaoYun_Key": (72.0, (1.0, 0.80, 0.65)),
        "ZhaoYun_Fill": (4.0, (0.56, 0.64, 0.82)),
        "ZhaoYun_Rim": (52.0, (0.56, 0.70, 0.96)),
        "ZhaoYun_V15_Face_Warmth": (16.0, (1.0, 0.68, 0.54)),
    }
    for name, (energy, color) in settings.items():
        light = bpy.data.objects.get(name)
        if light:
            light.data.energy = energy
            light.data.color = color
    eye_light = bpy.data.objects.get("ZhaoYun_EyeLight")
    if eye_light:
        eye_light.data.energy = 4.5
    return scene


def main():
    bpy.ops.wm.open_mainfile(filepath=str(BLEND))
    scene = configure()
    camera = bpy.data.objects["ZhaoYun_Portrait_Camera"]
    if "--eyes" in sys.argv:
        renderer.render(scene, camera, EYES, (0.30, -0.96, 1.658), (0.0, -0.038, 1.654), 112, (900, 560), 72)
        return
    if "--face" in sys.argv:
        renderer.render(scene, camera, FACE, (1.28, -1.96, 1.460), (0.0, -0.008, 1.628), 110, (1200, 1400), 164)
        return
    renderer.render(scene, camera, PREVIEW, (1.02, -1.57, 1.485), (0.0, -0.008, 1.628), 106, (600, 700), 48)


if __name__ == "__main__":
    main()
