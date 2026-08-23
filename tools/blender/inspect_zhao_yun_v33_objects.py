"""List V33 objects relevant to full-body compositing."""

from pathlib import Path

import bpy


ROOT = Path(__file__).resolve().parents[2]
BLEND = ROOT / "public/models/duel/_src/zhao-yun-restart-v33-dark-gaze.blend"


def main():
    bpy.ops.wm.open_mainfile(filepath=str(BLEND))
    print(f"OBJECT_COUNT={len(bpy.data.objects)}")
    for obj in sorted(bpy.data.objects, key=lambda item: item.name):
        particle_names = [system.settings.name for system in obj.particle_systems]
        print(
            f"{obj.name}|{obj.type}|parent={obj.parent.name if obj.parent else '-'}|"
            f"hidden={obj.hide_render}|particles={particle_names}"
        )


if __name__ == "__main__":
    main()
