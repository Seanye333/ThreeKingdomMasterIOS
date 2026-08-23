"""Add restrained bevel highlights and finish Zhao Yun's cape/boot materials."""

from pathlib import Path

import bpy


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
INPUT_BLEND = SRC / "zhao-yun-fullbody-v15-armor-finish.blend"
OUTPUT_BLEND = SRC / "zhao-yun-fullbody-v16-edge-polish.blend"

BEVEL_PREFIXES = (
    "ZhaoYun_Lamella_",
    "ZhaoYun_V5_Pauldron_Curved_Plate_",
    "ZhaoYun_V4_Skirt_Lamella_",
    "ZhaoYun_V4_Knee_Guard_",
    "ZhaoYun_V5_Hip_Guard_",
    "ZhaoYun_V16_Armored_Toe_Cap_",
    "ZhaoYun_V16_Tapered_Leather_Boot_",
    "ZhaoYun_V13_Fitted_Silver_Vambrace_",
)


def add_edge_bevels():
    changed = []
    for obj in bpy.data.objects:
        if obj.hide_render or obj.type != "MESH" or not obj.name.startswith(BEVEL_PREFIXES):
            continue
        if any(modifier.type == "BEVEL" and modifier.name.startswith("ZhaoYun V16") for modifier in obj.modifiers):
            continue
        smallest = max(0.001, min(obj.dimensions) * 0.08)
        bevel = obj.modifiers.new("ZhaoYun V16 Edge Polish", "BEVEL")
        bevel.width = min(0.0022, smallest)
        bevel.segments = 2
        bevel.limit_method = "ANGLE"
        changed.append(obj.name)
    return changed


def set_material(name, color, metallic, roughness, coat=0.0):
    material = bpy.data.materials.get(name)
    if not material or not material.use_nodes:
        return False
    bsdf = material.node_tree.nodes.get("Principled BSDF")
    if not bsdf:
        return False
    bsdf.inputs["Base Color"].default_value = (*color, 1.0)
    bsdf.inputs["Metallic"].default_value = metallic
    bsdf.inputs["Roughness"].default_value = roughness
    if "Coat Weight" in bsdf.inputs:
        bsdf.inputs["Coat Weight"].default_value = coat
    return True


def finish_costume_materials():
    changed = []
    settings = {
        "ZY6_Pleated_Ivory_Silk": ((0.32, 0.40, 0.53), 0.0, 0.58, 0.0),
        "ZY16_Shadowed_Ivory_Silk": ((0.12, 0.18, 0.27), 0.0, 0.65, 0.0),
        "ZY6_Deep_Leather_Glove": ((0.006, 0.010, 0.020), 0.0, 0.42, 0.08),
        "ZY5_Spear_Leather": ((0.10, 0.025, 0.018), 0.0, 0.44, 0.05),
    }
    for name, values in settings.items():
        if set_material(name, *values):
            changed.append(name)
    return changed


def main():
    bpy.ops.wm.open_mainfile(filepath=str(INPUT_BLEND))
    beveled = add_edge_bevels()
    materials = finish_costume_materials()
    bpy.context.view_layer.update()
    bpy.ops.wm.save_as_mainfile(filepath=str(OUTPUT_BLEND), compress=True)
    print(f"OUTPUT_BLEND={OUTPUT_BLEND}")
    print(f"BEVELED_OBJECTS={len(beveled)}")
    print(f"CHANGED_MATERIALS={materials}")


if __name__ == "__main__":
    main()
