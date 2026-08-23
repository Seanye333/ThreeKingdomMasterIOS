"""Create a V33-exact full-body camera without altering the accepted face setup."""

from pathlib import Path

import bpy
from mathutils import Vector


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
INPUT_BLEND = SRC / "zhao-yun-fullbody-v6-v33-master.blend"
OUTPUT_BLEND = SRC / "zhao-yun-fullbody-v7-exact-face.blend"


def look_at(obj, target):
    obj.rotation_euler = (Vector(target) - obj.location).to_track_quat("-Z", "Y").to_euler()


def add_area(name, energy, color, size, location, target):
    data = bpy.data.lights.new(name, "AREA")
    data.energy = energy
    data.shape = "DISK"
    data.size = size
    data.color = color
    obj = bpy.data.objects.new(name, data)
    bpy.context.scene.collection.objects.link(obj)
    obj.location = location
    look_at(obj, target)
    return obj


def main():
    bpy.ops.wm.open_mainfile(filepath=str(INPUT_BLEND))
    scene = bpy.context.scene
    imported = bpy.data.collections["ZhaoYun_V16_Fullbody_Imported"]
    imported.hide_render = False

    camera_data = bpy.data.cameras.new("ZhaoYun_Fullbody_V7_Exact_Face_Camera")
    camera = bpy.data.objects.new("ZhaoYun_Fullbody_V7_Exact_Face_Camera", camera_data)
    scene.collection.objects.link(camera)
    # Same camera ray and 106mm lens as V33. Scaling the eye-to-target vector by
    # 4.75 preserves perspective while expanding the framing to the full figure.
    portrait_eye = Vector((-0.86, -1.35, 1.675))
    portrait_target = Vector((0.0, -0.018, 1.645))
    scale = 4.75
    target = Vector((0.0, -0.018, 1.10))
    camera.location = target + (portrait_eye - portrait_target) * scale
    camera.data.lens = 106.0
    camera.data.sensor_width = 36.0
    look_at(camera, target)
    scene.camera = camera

    # Only illuminate the lower costume. These lights are low and aimed below
    # the jaw so the accepted V33 facial light remains unchanged.
    add_area(
        "ZhaoYun_V7_Lower_Softbox",
        54.0,
        (0.72, 0.82, 1.0),
        2.4,
        (-1.1, -2.0, 0.62),
        (0.0, 0.0, 0.72),
    )
    add_area(
        "ZhaoYun_V7_Lower_Warm_Fill",
        24.0,
        (1.0, 0.76, 0.62),
        2.0,
        (1.4, -1.7, 0.50),
        (0.0, 0.0, 0.72),
    )

    scene.render.engine = "BLENDER_EEVEE"
    scene.view_settings.exposure = -0.82
    bpy.context.view_layer.update()
    bpy.ops.wm.save_as_mainfile(filepath=str(OUTPUT_BLEND), compress=True)
    print(f"OUTPUT_BLEND={OUTPUT_BLEND}")
    print(f"CAMERA_LOCATION={tuple(round(value, 4) for value in camera.location)}")
    print(f"CAMERA_TARGET={tuple(target)} LENS={camera.data.lens}")


if __name__ == "__main__":
    main()
