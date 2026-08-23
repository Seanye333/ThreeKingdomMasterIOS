"""Remove floating forearm trim and add stronger material separation to Zhao Yun's outfit."""

from pathlib import Path

import bpy


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
INPUT_BLEND = SRC / "zhao-yun-fullbody-v11-tailored-sleeves.blend"
OUTPUT_BLEND = SRC / "zhao-yun-fullbody-v12-material-depth.blend"


def hide_forearm_artifacts():
    prefixes = (
        "ZhaoYun_V4_Vambrace_Band_",
        "ZhaoYun_V4_Elbow_Guard_",
    )
    hidden = []
    for obj in bpy.data.objects:
        if obj.name.startswith(prefixes) and not obj.hide_render:
            obj.hide_render = True
            obj.hide_set(True)
            hidden.append(obj.name)
    return hidden


def set_principled(material_name, color, metallic, roughness, coat=0.0):
    material = bpy.data.materials.get(material_name)
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


def main():
    bpy.ops.wm.open_mainfile(filepath=str(INPUT_BLEND))
    hidden = hide_forearm_artifacts()
    changed = []
    settings = {
        "ZY4_Weathered_Silver": ((0.29, 0.36, 0.46), 0.78, 0.31, 0.10),
        "ZY4_Antique_Gold": ((0.48, 0.23, 0.055), 0.72, 0.30, 0.08),
        "ZY4_Deep_Navy_Cloth": ((0.018, 0.033, 0.072), 0.0, 0.66, 0.0),
        "ZY6_Pleated_Ivory_Silk": ((0.43, 0.50, 0.62), 0.0, 0.60, 0.0),
        "ZY16_Shadowed_Ivory_Silk": ((0.18, 0.23, 0.32), 0.0, 0.68, 0.0),
        "ZY6_Deep_Leather_Glove": ((0.010, 0.014, 0.024), 0.0, 0.46, 0.06),
        "ZY4_Deep_Crimson": ((0.18, 0.012, 0.016), 0.0, 0.52, 0.0),
    }
    for name, values in settings.items():
        if set_principled(name, *values):
            changed.append(name)

    bpy.context.view_layer.update()
    bpy.ops.wm.save_as_mainfile(filepath=str(OUTPUT_BLEND), compress=True)
    print(f"OUTPUT_BLEND={OUTPUT_BLEND}")
    print(f"HIDDEN_FOREARM_ARTIFACTS={hidden}")
    print(f"CHANGED_MATERIALS={changed}")


if __name__ == "__main__":
    main()
