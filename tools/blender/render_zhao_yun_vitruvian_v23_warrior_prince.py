"""Render Zhao Yun v23 warrior-prince previews and finals."""

from pathlib import Path
import sys

import bpy


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
BLEND = SRC / "zhao-yun-vitruvian-v23-warrior-prince.blend"
PREVIEW = SRC / "zhao-yun-vitruvian-v23-warrior-prince-preview.png"
FACE = SRC / "zhao-yun-vitruvian-v23-warrior-prince-face.png"
HERO = SRC / "zhao-yun-vitruvian-v23-warrior-prince-hero.png"
EYES = SRC / "zhao-yun-vitruvian-v23-warrior-prince-eyes.png"
EYES_DEBUG = SRC / "zhao-yun-vitruvian-v23-warrior-prince-eyes-material-debug.png"

sys.path.insert(0, str(Path(__file__).resolve().parent))
import render_zhao_yun_vitruvian_v15_cinematic_hero as renderer  # pylint: disable=wrong-import-position


def configure():
    scene = renderer.configure_scene()
    scene.view_settings.exposure = -1.10
    settings = {
        "ZhaoYun_Key": (57.0, (1.0, 0.72, 0.53)),
        "ZhaoYun_Fill": (4.0, (0.62, 0.63, 0.66)),
        "ZhaoYun_Rim": (38.0, (0.62, 0.68, 0.76)),
        "ZhaoYun_EyeLight": (8.8, (0.92, 0.86, 0.80)),
        "ZhaoYun_V15_Face_Warmth": (17.0, (1.0, 0.60, 0.43)),
        "ZhaoYun_V15_Lower_Fill": (0.0, (0.62, 0.64, 0.68)),
    }
    for name, (energy, color) in settings.items():
        obj = bpy.data.objects.get(name)
        if obj:
            obj.data.energy = energy
            obj.data.color = color
    return scene


def debug_materials():
    colors = {
        "UDIM.Skin": (0.18, 0.18, 0.18, 1.0),
        "Iris": (0.0, 1.0, 0.0, 1.0),
        "Pupil": (0.0, 0.0, 1.0, 1.0),
        "Sclera_Cornea": (0.0, 1.0, 1.0, 1.0),
        "EyeHair": (1.0, 0.0, 0.0, 1.0),
    }
    for name, color in colors.items():
        material = bpy.data.materials.get(name)
        if not material:
            continue
        material.use_nodes = True
        nodes = material.node_tree.nodes
        links = material.node_tree.links
        nodes.clear()
        output = nodes.new("ShaderNodeOutputMaterial")
        emission = nodes.new("ShaderNodeEmission")
        emission.inputs["Color"].default_value = color
        emission.inputs["Strength"].default_value = 1.0
        links.new(emission.outputs["Emission"], output.inputs["Surface"])


def main():
    bpy.ops.wm.open_mainfile(filepath=str(BLEND))
    scene = configure()
    camera = bpy.data.objects["ZhaoYun_Portrait_Camera"]
    if "--debug-materials" in sys.argv:
        debug_materials()
        renderer.render(scene, camera, EYES_DEBUG, (0.25, -0.94, 1.665), (0.0, -0.035, 1.655), 108, (800, 500), 8)
        return
    if "--eyes" in sys.argv:
        renderer.render(scene, camera, EYES, (0.25, -0.94, 1.665), (0.0, -0.035, 1.655), 108, (800, 500), 72)
        return
    if "--face" in sys.argv:
        renderer.render(scene, camera, FACE, (0.68, -1.82, 1.525), (0.0, -0.02, 1.642), 103, (1200, 1400), 152)
        return
    if "--hero" in sys.argv:
        renderer.render(scene, camera, HERO, (1.35, -3.90, 1.08), (0.0, -0.01, 1.23), 84, (1100, 1400), 124)
        return
    renderer.render(scene, camera, PREVIEW, (0.56, -1.50, 1.545), (0.0, -0.02, 1.642), 99, (600, 700), 40)


if __name__ == "__main__":
    main()
