"""Low-cost contact renders for choosing Zhao Yun's authored strand groom."""

from pathlib import Path

import bpy
from mathutils import Vector


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
BLEND = SRC / "zhao-yun-vitruvian-v1.blend"
STYLES = (("Back1", "Combover_zoro_d"),)


def look_at(obj, target):
    obj.rotation_euler = (Vector(target) - obj.location).to_track_quat("-Z", "Y").to_euler()


def main():
    bpy.ops.wm.open_mainfile(filepath=str(BLEND))
    scene = bpy.context.scene
    scene.render.engine = "CYCLES"
    scene.cycles.device = "GPU"
    scene.cycles.use_denoising = True
    scene.cycles.samples = 24
    scene.render.resolution_x = 480
    scene.render.resolution_y = 566
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.view_settings.look = "AgX - Medium High Contrast"
    scene.view_settings.exposure = -1.0
    for name, energy in {
        "ZhaoYun_Key": 58.0,
        "ZhaoYun_Fill": 18.0,
        "ZhaoYun_Rim": 38.0,
        "ZhaoYun_EyeLight": 5.0,
    }.items():
        if name in bpy.data.objects:
            bpy.data.objects[name].data.energy = energy

    try:
        prefs = bpy.context.preferences.addons["cycles"].preferences
        prefs.compute_device_type = "METAL"
        prefs.get_devices()
        for device in prefs.devices:
            device.use = device.type == "METAL"
    except (AttributeError, KeyError, TypeError):
        scene.cycles.device = "CPU"

    emitter = bpy.data.objects["ZhaoYun_Strand_Hair_Emitter"]
    camera = bpy.data.objects["ZhaoYun_Portrait_Camera"]
    camera.location = (0.24, -0.985, 1.67)
    camera.data.lens = 103
    look_at(camera, (0.0, 0.0, 1.65))

    for styles in STYLES:
        enabled = {*styles, "mind_eyebrows_11_Default"}
        for modifier in emitter.modifiers:
            if modifier.type == "PARTICLE_SYSTEM":
                visible = modifier.particle_system.name in enabled
                modifier.show_viewport = visible
                modifier.show_render = visible
        slug = "-plus-".join(style.lower() for style in styles)
        path = SRC / f"zhao-yun-hair-test-{slug}.png"
        scene.render.filepath = str(path)
        bpy.ops.render.render(write_still=True)
        print(f"RENDER={path}")


if __name__ == "__main__":
    main()
