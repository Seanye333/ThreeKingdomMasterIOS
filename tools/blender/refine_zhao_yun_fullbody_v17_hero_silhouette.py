"""Refine Zhao Yun's full-body silhouette without touching the locked V33 face."""

from pathlib import Path

import bpy
from mathutils import Vector


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
INPUT_BLEND = SRC / "zhao-yun-fullbody-v16-edge-polish.blend"
OUTPUT_BLEND = SRC / "zhao-yun-fullbody-v17-hero-silhouette.blend"


def configure_principled(material, color, metallic, roughness, coat=0.0):
    if not material.use_nodes:
        material.use_nodes = True
    bsdf = material.node_tree.nodes.get("Principled BSDF")
    if not bsdf:
        return
    bsdf.inputs["Base Color"].default_value = (*color, 1.0)
    bsdf.inputs["Metallic"].default_value = metallic
    bsdf.inputs["Roughness"].default_value = roughness
    if "Coat Weight" in bsdf.inputs:
        bsdf.inputs["Coat Weight"].default_value = coat


def give_cape_its_own_slate_material():
    source = bpy.data.materials["ZY6_Pleated_Ivory_Silk"]
    cape = bpy.data.materials.get("ZY17_Cape_Slate_Blue")
    if cape is None:
        cape = source.copy()
        cape.name = "ZY17_Cape_Slate_Blue"
    configure_principled(cape, (0.035, 0.075, 0.145), 0.0, 0.63, 0.03)

    changed = []
    for obj in bpy.data.objects:
        if not obj.name.startswith("ZhaoYun_V6_Pleated_White_Cape_"):
            continue
        for index, material in enumerate(obj.data.materials):
            if material and material.name == source.name:
                obj.data.materials[index] = cape
                changed.append(obj.name)
    return sorted(changed)


def scale_mesh_around_bounds(obj, factors):
    center = sum((Vector(corner) for corner in obj.bound_box), Vector()) / 8.0
    for vertex in obj.data.vertices:
        relative = vertex.co - center
        vertex.co = center + Vector(
            (
                relative.x * factors[0],
                relative.y * factors[1],
                relative.z * factors[2],
            )
        )
    obj.data.update()


def refine_glove_proportions():
    changed = []
    for side in ("l", "r"):
        obj = bpy.data.objects[f"ZhaoYun_V16_Fitted_Leather_Glove_{side}"]
        dimensions = tuple(obj.dimensions)
        longest = max(range(3), key=dimensions.__getitem__)
        factors = [0.86, 0.86, 0.86]
        factors[longest] = 0.965
        scale_mesh_around_bounds(obj, factors)
        changed.append((obj.name, tuple(round(value, 3) for value in factors)))

    leather = bpy.data.materials["ZY6_Deep_Leather_Glove"]
    configure_principled(leather, (0.018, 0.034, 0.065), 0.0, 0.50, 0.05)
    return changed


def expand_portrait_atmosphere_for_full_body():
    backdrop = bpy.data.objects.get("ZhaoYun_Restart_V18_Atmospheric_Backdrop")
    if not backdrop:
        return None
    # V33 used a portrait-sized panel.  In a full-body frame its diagonal edge
    # became visible, so enlarge the same material instead of changing lighting.
    backdrop.scale.x *= 3.2
    backdrop.scale.y *= 3.2
    backdrop.scale.z *= 3.2
    return tuple(round(value, 3) for value in backdrop.dimensions)


def main():
    bpy.ops.wm.open_mainfile(filepath=str(INPUT_BLEND))
    cape_objects = give_cape_its_own_slate_material()
    gloves = refine_glove_proportions()
    backdrop_dimensions = expand_portrait_atmosphere_for_full_body()
    bpy.context.view_layer.update()
    bpy.ops.wm.save_as_mainfile(filepath=str(OUTPUT_BLEND), compress=True)
    print(f"OUTPUT_BLEND={OUTPUT_BLEND}")
    print(f"CAPE_OBJECTS={cape_objects}")
    print(f"GLOVE_FACTORS={gloves}")
    print(f"ATMOSPHERIC_BACKDROP_DIMS={backdrop_dimensions}")


if __name__ == "__main__":
    main()
