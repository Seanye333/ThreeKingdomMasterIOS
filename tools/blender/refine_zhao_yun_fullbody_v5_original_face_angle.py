"""Restore the V33 face angle and rotate the spear away from the face."""

import math
from pathlib import Path

import bpy
from mathutils import Matrix, Vector


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
INPUT_BLEND = SRC / "zhao-yun-fullbody-v4-portrait-camera.blend"
OUTPUT_BLEND = SRC / "zhao-yun-fullbody-v5-original-face-angle.blend"


def look_at(obj, target):
    obj.rotation_euler = (Vector(target) - obj.location).to_track_quat("-Z", "Y").to_euler()


def rotate_visible_spear():
    spear_objects = [
        obj
        for obj in bpy.data.objects
        if not obj.hide_render and ("Spear" in obj.name or "Tassel" in obj.name)
    ]
    pivot = Vector((-0.387, -0.320, 1.029))
    transform = (
        Matrix.Translation(pivot)
        @ Matrix.Rotation(math.radians(-8.0), 4, "Y")
        @ Matrix.Translation(-pivot)
    )
    for obj in spear_objects:
        obj.matrix_world = transform @ obj.matrix_world
    print(f"ROTATED_VISIBLE_SPEAR_OBJECTS={len(spear_objects)}")


def main():
    bpy.ops.wm.open_mainfile(filepath=str(INPUT_BLEND))
    scene = bpy.context.scene
    camera = bpy.data.objects["ZhaoYun_Fullbody_V4_Camera"]
    camera.name = "ZhaoYun_Fullbody_V5_Camera"
    camera.data.name = "ZhaoYun_Fullbody_V5_Camera"
    camera.location = (-4.20, -6.50, 1.18)
    camera.data.lens = 106.0
    look_at(camera, (0.0, 0.0, 1.15))
    scene.camera = camera
    rotate_visible_spear()
    bpy.context.view_layer.update()
    bpy.ops.wm.save_as_mainfile(filepath=str(OUTPUT_BLEND), compress=True)
    print(f"OUTPUT_BLEND={OUTPUT_BLEND}")
    print(f"CAMERA_LOCATION={tuple(camera.location)} LENS={camera.data.lens}")


if __name__ == "__main__":
    main()
