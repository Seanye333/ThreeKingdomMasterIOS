"""Inspect Zhao Yun v24 sclera polygons near the lower eyelids."""

from pathlib import Path

import bpy
from mathutils import Vector


ROOT = Path(__file__).resolve().parents[2]
BLEND = ROOT / "public/models/duel/_src/zhao-yun-vitruvian-v24-cinematic-lead.blend"

bpy.ops.wm.open_mainfile(filepath=str(BLEND))
body = bpy.data.objects["ZhaoYun_Body"]
material_index = next(
    index
    for index, slot in enumerate(body.material_slots)
    if slot.material and slot.material.name == "Sclera_Cornea"
)
rows = []
for polygon in body.data.polygons:
    if polygon.material_index != material_index:
        continue
    center = sum((body.data.vertices[index].co for index in polygon.vertices), Vector()) / len(polygon.vertices)
    if center.z < 1.6395:
        rows.append((polygon.index, center.x, center.y, center.z))

print(f"LOWER_COUNT={len(rows)}")
print("MOST_FRONT")
for row in sorted(rows, key=lambda value: value[2])[:120]:
    print(row[0], *(f"{value:.6f}" for value in row[1:]))
print("LOWEST")
for row in sorted(rows, key=lambda value: value[3])[:120]:
    print(row[0], *(f"{value:.6f}" for value in row[1:]))
