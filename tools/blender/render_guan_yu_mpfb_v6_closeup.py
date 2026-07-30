"""Render a calibrated head-and-shoulders close-up of the v6 Guan Yu look-dev."""

from pathlib import Path

import bpy
from mathutils import Vector


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
BLEND = SRC / "guan-yu-mpfb-v23.blend"
PREVIEW = SRC / "guan-yu-mpfb-v23-closeup.png"


def look_at(obj, target):
    obj.rotation_euler = (Vector(target) - obj.location).to_track_quat("-Z", "Y").to_euler()


bpy.ops.wm.open_mainfile(filepath=str(BLEND))
bpy.ops.object.camera_add(location=(0, -2.05, 1.58))
camera = bpy.context.object
camera.name = "Guan_Yu_Closeup_Camera"
camera.data.lens = 88
look_at(camera, (0, -0.08, 1.55))
bpy.context.scene.camera = camera

scene = bpy.context.scene
scene.render.resolution_x = 1000
scene.render.resolution_y = 1000
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = "PNG"
scene.render.filepath = str(PREVIEW)
scene.render.engine = "BLENDER_EEVEE"
bpy.ops.render.render(write_still=True)
print(f"PREVIEW={PREVIEW}")
