"""Give Zhao Yun v21 stronger iconic hero cues around the eyes and hairline."""

from __future__ import annotations

import sys
from pathlib import Path

import bpy


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
INPUT_BLEND = SRC / "zhao-yun-vitruvian-v21-young-hero.blend"
OUTPUT_BLEND = SRC / "zhao-yun-vitruvian-v22-iconic-face.blend"

sys.path.insert(0, str(Path(__file__).resolve().parent))
import create_zhao_yun_vitruvian_v1 as base  # pylint: disable=wrong-import-position
import build_zhao_yun_vitruvian_v4_fullbody as v4  # pylint: disable=wrong-import-position
import refine_zhao_yun_vitruvian_v15_cinematic_hero as v15  # pylint: disable=wrong-import-position


def strengthen_brow_groom():
    emitter = bpy.data.objects["ZhaoYun_Strand_Hair_Emitter"]
    enabled = {"Combover_zoro_d", "mind_eyebrows_07", "mind_eyebrows_11_Default"}
    for modifier in emitter.modifiers:
        if modifier.type != "PARTICLE_SYSTEM":
            continue
        name = modifier.particle_system.name
        visible = name in enabled
        modifier.show_viewport = visible
        modifier.show_render = visible
        modifier.particle_system.settings.material = 1
        if name == "mind_eyebrows_07":
            modifier.particle_system.settings.root_radius *= 1.12
            modifier.particle_system.settings.tip_radius *= 1.06


def enlarge_irises(body, scale=1.13):
    material_indices = {
        index
        for index, slot in enumerate(body.material_slots)
        if slot.material and slot.material.name in {"Iris", "Pupil"}
    }
    vertices = set()
    for polygon in body.data.polygons:
        if polygon.material_index in material_indices:
            vertices.update(polygon.vertices)
    for side in (-1.0, 1.0):
        side_vertices = [body.data.vertices[index] for index in vertices if body.data.vertices[index].co.x * side > 0.0]
        if not side_vertices:
            continue
        center_x = sum(vertex.co.x for vertex in side_vertices) / len(side_vertices)
        center_z = sum(vertex.co.z for vertex in side_vertices) / len(side_vertices)
        for vertex in side_vertices:
            vertex.co.x = center_x + (vertex.co.x - center_x) * scale
            vertex.co.z = center_z + (vertex.co.z - center_z) * scale
    body.data.update()


def build_upper_lash_lines(rig, material):
    left = [
        (-0.0117, -0.0751, 1.6455),
        (-0.0183, -0.0735, 1.6508),
        (-0.0243, -0.0714, 1.6510),
        (-0.0295, -0.0688, 1.6508),
        (-0.0351, -0.0647, 1.6539),
        (-0.0443, -0.0560, 1.6543),
        (-0.0512, -0.0500, 1.6475),
    ]
    right = [(-x, y, z) for x, y, z in left]
    for side, points in ((-1, left), (1, right)):
        line = base.add_curve_strand(
            f"ZhaoYun_V22_Upper_Lash_{side}",
            points,
            0.00034,
            material,
        )
        v4.parent_to_bone_keep_transform(line, rig, "head")


def build_face_framing_locks(rig, raven, raven_soft):
    locks = (
        (
            "Left_Inner",
            [(-0.047, -0.047, 1.738), (-0.061, -0.070, 1.690), (-0.057, -0.074, 1.628), (-0.072, -0.054, 1.565)],
            (0.0016, 0.0024, 0.0017, 0.00030),
            raven,
        ),
        (
            "Left_Outer",
            [(-0.061, -0.036, 1.733), (-0.071, -0.056, 1.671), (-0.079, -0.055, 1.604), (-0.083, -0.026, 1.535)],
            (0.0022, 0.0034, 0.0025, 0.00040),
            raven_soft,
        ),
        (
            "Right_Inner",
            [(0.047, -0.047, 1.738), (0.061, -0.070, 1.690), (0.057, -0.074, 1.628), (0.072, -0.054, 1.565)],
            (0.0016, 0.0024, 0.0017, 0.00030),
            raven,
        ),
        (
            "Right_Outer",
            [(0.061, -0.036, 1.733), (0.071, -0.056, 1.671), (0.079, -0.055, 1.604), (0.083, -0.026, 1.535)],
            (0.0022, 0.0034, 0.0025, 0.00040),
            raven_soft,
        ),
        (
            "Forehead_Sweep",
            [(0.042, -0.042, 1.742), (0.031, -0.060, 1.724), (0.021, -0.071, 1.702), (0.014, -0.075, 1.681)],
            (0.0018, 0.0021, 0.0014, 0.00025),
            raven,
        ),
    )
    for name, points, widths, material in locks:
        if "Outer" in name:
            continue
        v15.add_ribbon(
            f"ZhaoYun_V22_Face_Lock_{name}",
            points,
            widths,
            material,
            rig,
            0.00030,
        )


def warm_skin_and_deepen_eyes():
    skin = bpy.data.materials.get("UDIM.Skin")
    if skin and skin.use_nodes:
        settings = skin.node_tree.nodes.get("charmorph_settings")
        if settings:
            values = {
                "Saturation": 0.035,
                "Value": -0.012,
                "Hemoglobin Fraction": 0.034,
                "Subsurface Scale Multiplier": 0.082,
                "Roughness Multiplier": 0.042,
            }
            for name, value in values.items():
                socket = settings.outputs.get(name)
                if socket and hasattr(socket, "default_value"):
                    socket.default_value = value

    iris = bpy.data.materials.get("Iris")
    if iris and iris.use_nodes:
        primary = iris.node_tree.nodes.get("Primary Iris Color")
        secondary = iris.node_tree.nodes.get("Secondary Iris Color")
        if primary and "Color" in primary.outputs:
            primary.outputs["Color"].default_value = (0.0025, 0.0018, 0.0012, 1.0)
        if secondary and "Color" in secondary.outputs:
            secondary.outputs["Color"].default_value = (0.014, 0.0055, 0.0015, 1.0)


def main():
    bpy.ops.wm.open_mainfile(filepath=str(INPUT_BLEND))
    body = bpy.data.objects["ZhaoYun_Body"]
    rig = bpy.data.objects["ZhaoYun_Game_Rig"]
    raven = bpy.data.materials["ZY15_Raven_Hair"]
    liner = base.make_material("ZY22_Deep_Brown_Lash", (0.0020, 0.0010, 0.0006), 0.0, 0.64)

    strengthen_brow_groom()
    enlarge_irises(body)
    build_upper_lash_lines(rig, liner)
    warm_skin_and_deepen_eyes()
    bpy.context.view_layer.update()
    bpy.ops.wm.save_as_mainfile(filepath=str(OUTPUT_BLEND), compress=True)
    print(f"OUTPUT_BLEND={OUTPUT_BLEND}")


if __name__ == "__main__":
    main()
