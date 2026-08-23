"""List V16 head, hair, eye, and circlet objects for composite cleanup."""

from pathlib import Path

import bpy


ROOT = Path(__file__).resolve().parents[2]
BLEND = ROOT / "public/models/duel/_src/zhao-yun-vitruvian-v16-fullbody-polish.blend"
TOKENS = ("hair", "circlet", "brow", "lash", "tear", "lacrimal", "eye", "topknot")


def main():
    bpy.ops.wm.open_mainfile(filepath=str(BLEND))
    for obj in sorted(bpy.data.objects, key=lambda item: item.name.lower()):
        if any(token in obj.name.lower() for token in TOKENS):
            print(
                f"{obj.name}|{obj.type}|parent={obj.parent.name if obj.parent else '-'}|"
                f"parent_type={obj.parent_type}|bone={obj.parent_bone}|hidden={obj.hide_render}|"
                f"particles={[system.settings.name for system in obj.particle_systems]}"
            )


if __name__ == "__main__":
    main()
