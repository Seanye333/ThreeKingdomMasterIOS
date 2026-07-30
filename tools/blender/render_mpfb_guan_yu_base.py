"""Render the MPFB Guan Yu base for visual quality control."""

from pathlib import Path

import bpy
from mathutils import Vector


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
BLEND = SRC / "guan-yu-mpfb-base.blend"
PREVIEW = SRC / "guan-yu-mpfb-base-preview.png"


def look_at(obj, target):
    obj.rotation_euler = (Vector(target) - obj.location).to_track_quat("-Z", "Y").to_euler()


bpy.ops.wm.open_mainfile(filepath=str(BLEND))

bpy.ops.mesh.primitive_plane_add(size=12, location=(0, 0, -0.028))
floor = bpy.context.object
material = bpy.data.materials.new("Dark studio floor")
material.diffuse_color = (0.016, 0.012, 0.01, 1)
material.roughness = 0.76
floor.data.materials.append(material)

bpy.ops.object.camera_add(location=(0, -4.8, 1.10))
camera = bpy.context.object
camera.data.lens = 62
look_at(camera, (0, -0.02, 0.90))
bpy.context.scene.camera = camera

for name, location, energy, color, size in [
    ("Warm_Key", (-2.4, -3.0, 3.5), 1050, (1.0, 0.68, 0.46), 2.3),
    ("Cool_Fill", (2.2, -2.0, 2.4), 620, (0.28, 0.42, 0.66), 2.7),
    ("Rim", (0.7, 2.4, 3.0), 1250, (1.0, 0.36, 0.16), 2.0),
]:
    bpy.ops.object.light_add(type="AREA", location=location)
    light = bpy.context.object
    light.name = name
    light.data.energy = energy
    light.data.color = color
    light.data.shape = "DISK"
    light.data.size = size
    look_at(light, (0, 0, 1.05))

scene = bpy.context.scene
if scene.world is None:
    scene.world = bpy.data.worlds.new("Studio World")
scene.world.color = (0.003, 0.002, 0.002)
scene.render.engine = "BLENDER_EEVEE"
scene.render.resolution_x = 900
scene.render.resolution_y = 1200
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = "PNG"
scene.render.filepath = str(PREVIEW)
try:
    scene.view_settings.look = "AgX - Medium High Contrast"
except TypeError:
    scene.view_settings.look = "Medium High Contrast"
bpy.ops.render.render(write_still=True)
print(f"PREVIEW={PREVIEW}")
