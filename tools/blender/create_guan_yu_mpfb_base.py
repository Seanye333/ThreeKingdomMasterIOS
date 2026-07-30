"""Create an Asian male Guan Yu base with MPFB in an isolated Blender extension path."""

from __future__ import annotations

import importlib
import os
import sys
from pathlib import Path

import bpy


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
ASSETS = SRC / "makehuman-system-assets"
MPFB_DATA = SRC / "blender-extensions/system/mpfb/data"
OUT = SRC / "guan-yu-mpfb-base.blend"


def dynamic_import(package_suffix: str, key: str):
    for module_name in sys.modules:
        if module_name.endswith(package_suffix):
            module = importlib.import_module(module_name)
            return getattr(module, key)
    raise RuntimeError(f"MPFB module not found: {package_suffix}")


def main():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.preferences.addon_enable(module="bl_ext.system.mpfb")

    HumanService = dynamic_import("mpfb.services.humanservice", "HumanService")
    TargetService = dynamic_import("mpfb.services.targetservice", "TargetService")
    HumanObjectProperties = dynamic_import("mpfb.entities.objectproperties", "HumanObjectProperties")

    human = HumanService.create_human()
    human.name = "Guan_Yu_Basemesh"

    macro_values = {
        "gender": 1.0,
        "age": 0.66,
        "muscle": 0.72,
        "weight": 0.58,
        "height": 0.64,
        "proportions": 0.76,
        "asian": 1.0,
        "caucasian": 0.0,
        "african": 0.0,
    }
    for key, value in macro_values.items():
        HumanObjectProperties.set_value(key, value, entity_reference=human)
    TargetService.reapply_macro_details(human)

    # Heroic but still human facial proportions.
    targets = [
        ("head/head-square.target.gz", 0.28),
        ("head/head-age-incr.target.gz", 0.16),
        ("chin/chin-width-incr.target.gz", 0.22),
        ("chin/chin-prominent-incr.target.gz", 0.10),
        ("cheek/l-cheek-bones-incr.target.gz", 0.18),
        ("cheek/r-cheek-bones-incr.target.gz", 0.18),
        ("nose/nose-scale-depth-decr.target.gz", 0.16),
        ("nose/nose-point-width-incr.target.gz", 0.10),
        ("eyes/l-eye-epicanthus-in.target.gz", 0.16),
        ("eyes/r-eye-epicanthus-in.target.gz", 0.16),
    ]
    for relative, weight in targets:
        path = MPFB_DATA / "targets" / relative
        if path.exists():
            TargetService.load_target(human, str(path), weight=weight)

    skin_path = ASSETS / "skins/middleage_asian_male/middleage_asian_male.mhmat"
    HumanService.set_character_skin(str(skin_path), human, skin_type="GAMEENGINE")

    asset_specs = [
        ("eyes/low-poly/low-poly.mhclo", "Eyes"),
        ("eyebrows/eyebrow003/eyebrow003.mhclo", "Eyebrows"),
        ("eyelashes/eyelashes01/eyelashes01.mhclo", "Eyelashes"),
        ("teeth/teeth_base/teeth_base.mhclo", "Teeth"),
    ]
    for relative, asset_type in asset_specs:
        HumanService.add_mhclo_asset(
            str(ASSETS / relative),
            human,
            asset_type=asset_type,
            material_type="GAMEENGINE",
        )

    rig = HumanService.add_builtin_rig(human, "game_engine")
    rig.name = "Guan_Yu_Game_Rig"

    bpy.context.view_layer.update()
    world_box = [human.matrix_world @ v.co for v in human.data.vertices]
    mins = tuple(round(min(v[i] for v in world_box), 4) for i in range(3))
    maxs = tuple(round(max(v[i] for v in world_box), 4) for i in range(3))
    print(f"BOUNDS_MIN={mins}")
    print(f"BOUNDS_MAX={maxs}")
    print(f"DIMENSIONS={tuple(round(v, 4) for v in human.dimensions)}")

    bpy.ops.wm.save_as_mainfile(filepath=str(OUT))
    print(f"BLEND={OUT}")


if __name__ == "__main__":
    main()
