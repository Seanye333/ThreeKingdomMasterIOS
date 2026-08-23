"""Render Zhao Yun v24 cinematic-leading-man previews and finals."""

from pathlib import Path
import sys

import bpy


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
BLEND = SRC / "zhao-yun-vitruvian-v24-cinematic-lead.blend"
PREVIEW = SRC / "zhao-yun-vitruvian-v24-cinematic-lead-preview.png"
FACE = SRC / "zhao-yun-vitruvian-v24-cinematic-lead-face.png"
HERO = SRC / "zhao-yun-vitruvian-v24-cinematic-lead-hero.png"
EYES = SRC / "zhao-yun-vitruvian-v24-cinematic-lead-eyes.png"
LONG_HAIR_TEST = SRC / "zhao-yun-vitruvian-v24-cinematic-lead-long-hair-test.png"

sys.path.insert(0, str(Path(__file__).resolve().parent))
import render_zhao_yun_vitruvian_v15_cinematic_hero as renderer  # pylint: disable=wrong-import-position


def configure():
    scene = renderer.configure_scene()
    scene.view_settings.exposure = -1.03
    settings = {
        "ZhaoYun_Key": (67.0, (1.0, 0.69, 0.49)),
        "ZhaoYun_Fill": (2.8, (0.50, 0.58, 0.72)),
        "ZhaoYun_Rim": (49.0, (0.52, 0.66, 0.90)),
        "ZhaoYun_EyeLight": (10.0, (0.90, 0.87, 0.82)),
        "ZhaoYun_V15_Face_Warmth": (23.0, (1.0, 0.54, 0.38)),
        "ZhaoYun_V15_Hair_Rim": (29.0, (0.32, 0.49, 0.86)),
        "ZhaoYun_V15_Lower_Fill": (0.0, (0.48, 0.55, 0.72)),
    }
    for name, (energy, color) in settings.items():
        obj = bpy.data.objects.get(name)
        if obj:
            obj.data.energy = energy
            obj.data.color = color
    return scene


def enable_long_hair_test():
    emitter = bpy.data.objects["ZhaoYun_Strand_Hair_Emitter"]
    enabled = {"SceneHair_1_O4saken", "mind_eyebrows_07", "mind_eyebrows_11_Default"}
    for modifier in emitter.modifiers:
        if modifier.type == "PARTICLE_SYSTEM":
            visible = modifier.particle_system.name in enabled
            modifier.show_viewport = visible
            modifier.show_render = visible
    hairstyle = emitter.particle_systems.get("SceneHair_1_O4saken")
    if hairstyle:
        for particle in hairstyle.particles:
            tip_z = particle.hair_keys[-1].co_local.z
            scale = 0.42 if tip_z < -0.050 else (0.68 if tip_z < -0.020 else 1.0)
            for key in particle.hair_keys:
                coordinate = key.co_local.copy()
                coordinate *= scale
                key.co_local = coordinate


def main():
    bpy.ops.wm.open_mainfile(filepath=str(BLEND))
    scene = configure()
    camera = bpy.data.objects["ZhaoYun_Portrait_Camera"]
    if "--long-hair-test" in sys.argv:
        enable_long_hair_test()
        renderer.render(scene, camera, LONG_HAIR_TEST, (0.82, -1.68, 1.505), (0.0, -0.012, 1.632), 104, (600, 700), 36)
        return
    if "--eyes" in sys.argv:
        renderer.render(scene, camera, EYES, (0.30, -0.96, 1.658), (0.0, -0.038, 1.654), 112, (900, 560), 72)
        return
    if "--face" in sys.argv:
        renderer.render(scene, camera, FACE, (1.00, -2.05, 1.490), (0.0, -0.012, 1.632), 108, (1200, 1400), 164)
        return
    if "--hero" in sys.argv:
        renderer.render(scene, camera, HERO, (1.48, -4.00, 1.035), (0.0, -0.005, 1.215), 86, (1100, 1400), 132)
        return
    renderer.render(scene, camera, PREVIEW, (0.82, -1.68, 1.505), (0.0, -0.012, 1.632), 104, (600, 700), 48)


if __name__ == "__main__":
    main()
