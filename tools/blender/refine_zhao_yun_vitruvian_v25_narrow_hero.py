"""Narrow Zhao Yun v24's broad lower face without losing heroic definition."""

from __future__ import annotations

from pathlib import Path

import bpy
import numpy as np


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
INPUT_BLEND = SRC / "zhao-yun-vitruvian-v24-cinematic-lead.blend"
OUTPUT_BLEND = SRC / "zhao-yun-vitruvian-v25-narrow-hero.blend"
MORPHS_L2 = SRC / "charmorph-test/characters/Vitruvian/morphs/L2"


NARROW_HERO_STRUCTURE = {
    # Pull back the broad cheek and maxilla silhouette.
    "Face_Maxilla": -0.045,
    "Face_Zygomatic_Bone": -0.110,
    "Cheeks_UpperCheek_Bone": -0.090,
    "Cheeks_BoneDefinition": 0.020,
    # v23-v24 accumulated a very wide mandible. Reduce width decisively while
    # retaining a crisp ramus and chin instead of creating a pointed V-line.
    "Jaw_Width": -0.320,
    "Jaw_Definition": 0.015,
    "Jaw_Ramus_Extrusion": -0.030,
    "Jaw_Mandible_GonialAngle": -0.050,
    "Chin_Width": -0.040,
    "Chin_SecondaryWidth": -0.020,
}


def apply_morphs(body):
    coordinates = np.array([vertex.co[:] for vertex in body.data.vertices], dtype=np.float64)
    for name, weight in NARROW_HERO_STRUCTURE.items():
        data = np.load(MORPHS_L2 / f"{name}.npz")
        coordinates[data["idx"]] += data["delta"] * weight
    for vertex, coordinate in zip(body.data.vertices, coordinates):
        vertex.co = coordinate
    body.data.update()


def smoothstep(edge0, edge1, value):
    factor = max(0.0, min(1.0, (value - edge0) / (edge1 - edge0)))
    return factor * factor * (3.0 - 2.0 * factor)


def sculpt_narrow_silhouette(body):
    """Narrow outer jaw/cheek vertices while preserving central features."""
    skin_indices = {
        index
        for index, slot in enumerate(body.material_slots)
        if slot.material and slot.material.name == "UDIM.Skin"
    }
    skin_vertices = set()
    for polygon in body.data.polygons:
        if polygon.material_index in skin_indices:
            skin_vertices.update(polygon.vertices)

    changed = 0
    for index in skin_vertices:
        coordinate = body.data.vertices[index].co
        if not (1.475 < coordinate.z < 1.685 and coordinate.y < 0.060):
            continue
        outer_weight = smoothstep(0.030, 0.082, abs(coordinate.x))
        if coordinate.z < 1.605:
            vertical_weight = smoothstep(1.475, 1.535, coordinate.z) * (1.0 - 0.18 * smoothstep(1.575, 1.605, coordinate.z))
            strength = 0.105 * vertical_weight
        else:
            strength = 0.062 * (1.0 - smoothstep(1.605, 1.685, coordinate.z))
        coordinate.x *= 1.0 - strength * outer_weight
        changed += 1
    body.data.update()
    print(f"NARROWED_FACE_VERTICES={changed}")


def main():
    bpy.ops.wm.open_mainfile(filepath=str(INPUT_BLEND))
    body = bpy.data.objects["ZhaoYun_Body"]
    apply_morphs(body)
    sculpt_narrow_silhouette(body)
    bpy.context.view_layer.update()
    bpy.ops.wm.save_as_mainfile(filepath=str(OUTPUT_BLEND), compress=True)
    print(f"OUTPUT_BLEND={OUTPUT_BLEND}")


if __name__ == "__main__":
    main()
