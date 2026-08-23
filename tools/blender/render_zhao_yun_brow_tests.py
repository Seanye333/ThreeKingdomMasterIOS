"""Low-resolution eyebrow groom comparison for Zhao Yun."""

from pathlib import Path

import bpy
from mathutils import Vector


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
BLEND = SRC / "zhao-yun-vitruvian-v2.blend"
BROWS = (
    "mind_eyebrows_01",
    "mind_eyebrows_03",
    "mind_eyebrows_07",
    "mind_eyebrows_11_Default",
    "mind_eyebrows_14",
)


def look_at(obj, target):
    obj.rotation_euler = (Vector(target) - obj.location).to_track_quat("-Z", "Y").to_euler()


def main():
    bpy.ops.wm.open_mainfile(filepath=str(BLEND))
    scene = bpy.context.scene
    scene.render.engine = "CYCLES"
    scene.cycles.device = "GPU"
    scene.cycles.use_denoising = True
    scene.cycles.samples = 20
    scene.render.resolution_x = 400
    scene.render.resolution_y = 472
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

    camera = bpy.data.objects["ZhaoYun_Portrait_Camera"]
    camera.location = (0.055, -0.965, 1.665)
    camera.data.lens = 105
    look_at(camera, (0.0, -0.004, 1.651))
    emitter = bpy.data.objects["ZhaoYun_Strand_Hair_Emitter"]
    for brow in BROWS:
        enabled = {"Back1", "Combover_zoro_d", brow}
        for modifier in emitter.modifiers:
            if modifier.type == "PARTICLE_SYSTEM":
                visible = modifier.particle_system.name in enabled
                modifier.show_viewport = visible
                modifier.show_render = visible
        path = SRC / f"zhao-yun-brow-test-{brow.lower()}.png"
        scene.render.filepath = str(path)
        bpy.ops.render.render(write_still=True)
        print(f"RENDER={path}")


if __name__ == "__main__":
    main()
