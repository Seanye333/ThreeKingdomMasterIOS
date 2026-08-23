"""Render the V33 face from the full-body file using the exact accepted portrait setup."""

from pathlib import Path

import bpy
from mathutils import Vector


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
BLEND = SRC / "zhao-yun-fullbody-v2-clean-hair.blend"
PORTRAIT_BLEND = SRC / "zhao-yun-restart-v33-dark-gaze.blend"
OUTPUT = SRC / "zhao-yun-fullbody-face-calibration.png"

KEEP_PREFIXES = (
    "ZhaoYun_Restart_Circlet_",
    "ZhaoYun_Restart_V10_",
    "ZhaoYun_Restart_V27_",
)
KEEP_EXACT = {
    "ZhaoYun_Body",
    "ZhaoYun_Strand_Hair_Emitter",
    "Lacrimal_Caruncle",
    "Tearline",
    "ZhaoYun_Restart_V6_Dark_Tunic",
    "ZhaoYun_Restart_V6_Pauldron_-1",
    "ZhaoYun_Restart_V6_Pauldron_1",
    "ZhaoYun_Restart_V6_Silver_Collar",
    "ZhaoYun_Restart_V6_White_Cape",
    "ZhaoYun_Restart_V11_Chest_Clasp_Halo",
    "ZhaoYun_Restart_V11_Chest_Clasp_Jade",
    "ZhaoYun_Restart_V11_Chest_Clasp_Wing_-1",
    "ZhaoYun_Restart_V11_Chest_Clasp_Wing_1",
    "ZhaoYun_Restart_V13_Chest_Gold_Rib_-1",
    "ZhaoYun_Restart_V13_Chest_Gold_Rib_1",
}
LIGHT_NAMES = {
    "Restart cool fill",
    "Restart eye light",
    "Restart hair rim",
    "Restart soft key",
    "ZhaoYun_Restart_V18_Hair_Edge",
}


def look_at(obj, target):
    obj.rotation_euler = (Vector(target) - obj.location).to_track_quat("-Z", "Y").to_euler()


def append_portrait_lights(scene):
    for name in LIGHT_NAMES:
        existing = bpy.data.objects.get(name)
        if existing:
            bpy.data.objects.remove(existing, do_unlink=True)
    with bpy.data.libraries.load(str(PORTRAIT_BLEND), link=False) as (source, destination):
        missing = LIGHT_NAMES.difference(source.objects)
        if missing:
            raise RuntimeError(f"Missing V33 lights: {sorted(missing)}")
        destination.objects = sorted(LIGHT_NAMES)
    for obj in destination.objects:
        if obj:
            scene.collection.objects.link(obj)


def main():
    bpy.ops.wm.open_mainfile(filepath=str(BLEND))
    scene = bpy.context.scene

    append_portrait_lights(scene)

    for obj in bpy.data.objects:
        if obj.type == "LIGHT":
            obj.hide_render = obj.name not in LIGHT_NAMES
            continue
        if obj.type in {"CAMERA", "EMPTY", "ARMATURE"}:
            continue
        keep = obj.name in KEEP_EXACT or obj.name.startswith(KEEP_PREFIXES)
        obj.hide_render = not keep

    # Remove irrelevant full-body geometry entirely so Eevee only compiles the
    # accepted portrait objects during this exact face calibration.
    for obj in tuple(bpy.data.objects):
        if obj.type in {"MESH", "CURVE", "SURFACE", "FONT", "META"} and obj.hide_render:
            bpy.data.objects.remove(obj, do_unlink=True)

    camera = bpy.data.objects.get("ZhaoYun_Face_Calibration_Camera")
    if not camera:
        data = bpy.data.cameras.new("ZhaoYun_Face_Calibration_Camera")
        camera = bpy.data.objects.new("ZhaoYun_Face_Calibration_Camera", data)
        scene.collection.objects.link(camera)
    camera.location = (-0.86, -1.35, 1.675)
    camera.data.lens = 106.0
    camera.data.sensor_width = 36.0
    look_at(camera, (0.0, -0.018, 1.645))
    scene.camera = camera

    scene.render.engine = "BLENDER_EEVEE"
    scene.view_settings.look = "AgX - Medium High Contrast"
    scene.view_settings.exposure = -0.82
    scene.world.use_nodes = True
    background = scene.world.node_tree.nodes.get("Background")
    background.inputs["Color"].default_value = (0.028, 0.038, 0.060, 1.0)
    background.inputs["Strength"].default_value = 0.36
    scene.render.resolution_x = 1000
    scene.render.resolution_y = 1167
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"
    scene.render.filepath = str(OUTPUT)
    scene.eevee.taa_render_samples = 48

    emitter = bpy.data.objects["ZhaoYun_Strand_Hair_Emitter"]
    for particle_system in emitter.particle_systems:
        if particle_system.name == "SceneHair_1_O4saken":
            particle_system.settings.rendered_child_count = 36
        elif particle_system.name == "Combover_zoro_d":
            particle_system.settings.rendered_child_count = 8
        elif "eyebrows" in particle_system.name.lower():
            particle_system.settings.rendered_child_count = min(
                particle_system.settings.rendered_child_count,
                8,
            )

    bpy.ops.render.render(write_still=True)
    print(f"RENDER={OUTPUT}")


if __name__ == "__main__":
    main()
