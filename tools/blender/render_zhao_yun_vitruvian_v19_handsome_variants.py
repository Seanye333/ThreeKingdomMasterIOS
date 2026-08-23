"""Render low-cost close-up comparisons for Zhao Yun v19 face variants."""

from pathlib import Path
import sys

import bpy


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"

sys.path.insert(0, str(Path(__file__).resolve().parent))
import render_zhao_yun_vitruvian_v15_cinematic_hero as v15_render  # pylint: disable=wrong-import-position


def requested_variant():
    for argument in sys.argv:
        if argument.startswith("--variant="):
            return argument.split("=", 1)[1]
    return "portrait"


def main():
    variant = requested_variant()
    blend = SRC / f"zhao-yun-vitruvian-v19-{variant}.blend"
    output = SRC / f"zhao-yun-vitruvian-v19-{variant}-face-preview.png"
    bpy.ops.wm.open_mainfile(filepath=str(blend))
    scene = v15_render.configure_scene()
    scene.view_settings.exposure = -1.00
    eye_light = bpy.data.objects.get("ZhaoYun_EyeLight")
    if eye_light:
        eye_light.data.energy = 10.2
    face_warmth = bpy.data.objects.get("ZhaoYun_V15_Face_Warmth")
    if face_warmth:
        face_warmth.data.energy = 11.5
    camera = bpy.data.objects["ZhaoYun_Portrait_Camera"]
    v15_render.render(
        scene,
        camera,
        output,
        (0.34, -1.34, 1.635),
        (0.0, -0.025, 1.655),
        92,
        (520, 620),
        40,
    )


if __name__ == "__main__":
    main()
