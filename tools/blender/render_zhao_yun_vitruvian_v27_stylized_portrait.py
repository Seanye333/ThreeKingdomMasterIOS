"""Render Zhao Yun v27 with the supplied key-art style and framing."""

from pathlib import Path
import sys

import bpy


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
BLEND = SRC / "zhao-yun-vitruvian-v27-stylized-portrait.blend"
PREVIEW = SRC / "zhao-yun-vitruvian-v27-stylized-portrait-preview.png"
FACE = SRC / "zhao-yun-vitruvian-v27-stylized-portrait-face.png"
EYES = SRC / "zhao-yun-vitruvian-v27-stylized-portrait-eyes.png"

sys.path.insert(0, str(Path(__file__).resolve().parent))
import render_zhao_yun_vitruvian_v26_reference_rebuild as v26  # pylint: disable=wrong-import-position
import render_zhao_yun_vitruvian_v15_cinematic_hero as renderer  # pylint: disable=wrong-import-position


def configure():
    scene = v26.configure()
    scene.view_settings.exposure = -0.78
    settings = {
        "ZhaoYun_Key": (84.0, (1.0, 0.86, 0.74)),
        "ZhaoYun_Fill": (6.0, (0.64, 0.72, 0.92)),
        "ZhaoYun_Rim": (64.0, (0.66, 0.78, 1.0)),
        "ZhaoYun_EyeLight": (4.0, (0.92, 0.90, 0.86)),
        "ZhaoYun_V15_Face_Warmth": (13.0, (1.0, 0.76, 0.65)),
        "ZhaoYun_V15_Hair_Rim": (35.0, (0.46, 0.62, 0.98)),
    }
    for name, (energy, color) in settings.items():
        light = bpy.data.objects.get(name)
        if light:
            light.data.energy = energy
            light.data.color = color
    world = scene.world
    if world and world.use_nodes:
        background = world.node_tree.nodes.get("Background")
        if background:
            background.inputs["Color"].default_value = (0.20, 0.23, 0.29, 1.0)
            background.inputs["Strength"].default_value = 0.42
    return scene


def main():
    bpy.ops.wm.open_mainfile(filepath=str(BLEND))
    scene = configure()
    camera = bpy.data.objects["ZhaoYun_Portrait_Camera"]
    if "--eyes" in sys.argv:
        renderer.render(scene, camera, EYES, (0.38, -0.92, 1.655), (0.0, -0.038, 1.654), 114, (900, 560), 72)
        return
    if "--face" in sys.argv:
        renderer.render(scene, camera, FACE, (1.28, -1.96, 1.460), (0.0, -0.008, 1.628), 110, (1200, 1400), 164)
        return
    renderer.render(scene, camera, PREVIEW, (1.02, -1.57, 1.485), (0.0, -0.008, 1.628), 106, (600, 700), 48)


if __name__ == "__main__":
    main()
