"""Render an honest full-body inspection view of the current Guan Yu v27 bust file."""

from pathlib import Path
import sys

import bpy

sys.path.insert(0, str(Path(__file__).resolve().parent))
from create_guan_yu_realistic import assign, look_at, mat


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
BLEND = SRC / "guan-yu-reference-bust-v27.blend"
OUTPUT = SRC / "guan-yu-reference-bust-v27-full-body.png"


def main():
    bpy.ops.wm.open_mainfile(filepath=str(BLEND))

    pedestal = bpy.data.objects.get("Cylinder")
    if pedestal:
        pedestal.hide_render = True
    for obj in bpy.data.objects:
        if "pedestal" in obj.name.lower():
            obj.hide_render = True

    bpy.ops.mesh.primitive_plane_add(size=12, location=(0, 0.15, 0.0))
    floor = bpy.context.object
    floor.name = "Full_Body_Inspection_Floor"
    assign(floor, mat("Full body charcoal floor", (0.006, 0.007, 0.006, 1), 0.72, noise=20, bump=0.03))

    camera = bpy.context.scene.camera
    camera.location = (0, -5.35, 1.02)
    camera.data.lens = 70
    look_at(camera, (0, -0.02, 0.93))

    for name, location, energy, color, size in [
        ("Full_Body_Neutral_Key", (-2.5, -3.3, 3.2), 700, (1.0, 0.72, 0.55), 2.8),
        ("Full_Body_Cool_Fill", (2.4, -2.4, 1.8), 280, (0.32, 0.44, 0.70), 3.0),
        ("Full_Body_Back_Rim", (0.6, 2.2, 2.7), 720, (1.0, 0.40, 0.17), 2.2),
    ]:
        bpy.ops.object.light_add(type="AREA", location=location)
        light = bpy.context.object
        light.name = name
        light.data.energy = energy
        light.data.color = color
        light.data.shape = "DISK"
        light.data.size = size
        look_at(light, (0, 0, 0.95))

    scene = bpy.context.scene
    scene.camera = camera
    scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_x = 1000
    scene.render.resolution_y = 1600
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.filepath = str(OUTPUT)
    scene.view_settings.look = "AgX - Medium High Contrast"
    scene.view_settings.exposure = -0.20
    bpy.ops.render.render(write_still=True)
    print(f"OUTPUT={OUTPUT}")


if __name__ == "__main__":
    main()
