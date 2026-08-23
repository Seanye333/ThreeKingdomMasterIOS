"""Locate imported visible mesh shells using skin materials."""

from pathlib import Path

import bpy


ROOT = Path(__file__).resolve().parents[2]
BLEND = ROOT / "public/models/duel/_src/zhao-yun-fullbody-v7-exact-face.blend"


def main():
    bpy.ops.wm.open_mainfile(filepath=str(BLEND))
    for obj in sorted(bpy.data.objects, key=lambda item: item.name):
        if obj.type != "MESH" or obj.hide_render or obj.name == "ZhaoYun_Restart_Body":
            continue
        materials = [material.name for material in obj.data.materials if material]
        if any("skin" in material.lower() or "udim" in material.lower() for material in materials):
            print(
                f"{obj.name}|materials={materials}|vertices={len(obj.data.vertices)}|"
                f"dimensions={tuple(round(value, 4) for value in obj.dimensions)}"
            )


if __name__ == "__main__":
    main()
