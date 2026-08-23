"""Match the V33 portrait camera side and face lighting in the full-body scene."""

from pathlib import Path

import bpy
from mathutils import Vector


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
INPUT_BLEND = SRC / "zhao-yun-fullbody-v2-clean-hair.blend"
PORTRAIT_BLEND = SRC / "zhao-yun-restart-v33-dark-gaze.blend"
OUTPUT_BLEND = SRC / "zhao-yun-fullbody-v3-face-match.blend"

PORTRAIT_LIGHTS = (
    "Restart cool fill",
    "Restart eye light",
    "Restart hair rim",
    "Restart soft key",
    "ZhaoYun_Restart_V18_Hair_Edge",
)


def look_at(obj, target):
    obj.rotation_euler = (Vector(target) - obj.location).to_track_quat("-Z", "Y").to_euler()


def append_portrait_lights():
    for name in PORTRAIT_LIGHTS:
        existing = bpy.data.objects.get(name)
        if existing:
            bpy.data.objects.remove(existing, do_unlink=True)
    with bpy.data.libraries.load(str(PORTRAIT_BLEND), link=False) as (source, destination):
        missing = set(PORTRAIT_LIGHTS).difference(source.objects)
        if missing:
            raise RuntimeError(f"Missing portrait lights: {sorted(missing)}")
        destination.objects = list(PORTRAIT_LIGHTS)
    for obj in destination.objects:
        if obj:
            bpy.context.scene.collection.objects.link(obj)


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


def configure_world(scene):
    world = scene.world
    world.use_nodes = True
    background = world.node_tree.nodes.get("Background")
    background.inputs["Color"].default_value = (0.028, 0.038, 0.060, 1.0)
    background.inputs["Strength"].default_value = 0.36


def configure_camera(scene):
    camera = bpy.data.objects.get("ZhaoYun_Fullbody_V3_Camera")
    if not camera:
        data = bpy.data.cameras.new("ZhaoYun_Fullbody_V3_Camera")
        camera = bpy.data.objects.new("ZhaoYun_Fullbody_V3_Camera", data)
        bpy.context.scene.collection.objects.link(camera)
    # Same portrait side and almost-level head angle as V33; moved back for full-body framing.
    camera.location = (-4.20, -6.50, 1.18)
    camera.data.lens = 106.0
    camera.data.sensor_width = 36.0
    look_at(camera, (0.0, 0.0, 1.15))
    scene.camera = camera


def main():
    bpy.ops.wm.open_mainfile(filepath=str(INPUT_BLEND))
    scene = bpy.context.scene

    for obj in bpy.data.objects:
        if obj.type == "LIGHT":
            obj.hide_render = True

    append_portrait_lights()
    add_area(
        "ZhaoYun_V3_Body_Key",
        430.0,
        (0.82, 0.90, 1.0),
        2.8,
        (-1.8, -3.2, 0.78),
        (0.0, 0.0, 0.78),
    )
    add_area(
        "ZhaoYun_V3_Body_Fill",
        270.0,
        (1.0, 0.76, 0.60),
        2.4,
        (2.1, -2.6, 0.92),
        (0.0, 0.0, 0.85),
    )
    add_area(
        "ZhaoYun_V3_Lower_Rim",
        520.0,
        (0.48, 0.64, 1.0),
        2.5,
        (1.4, 1.6, 0.95),
        (0.0, 0.0, 0.82),
    )

    scene.render.engine = "BLENDER_EEVEE"
    scene.view_settings.look = "AgX - Medium High Contrast"
    scene.view_settings.exposure = -0.82
    configure_world(scene)
    configure_camera(scene)
    bpy.context.view_layer.update()
    bpy.ops.wm.save_as_mainfile(filepath=str(OUTPUT_BLEND), compress=True)
    print(f"OUTPUT_BLEND={OUTPUT_BLEND}")
    print(f"CAMERA={scene.camera.name} LOCATION={tuple(scene.camera.location)} LENS={scene.camera.data.lens}")


if __name__ == "__main__":
    main()
