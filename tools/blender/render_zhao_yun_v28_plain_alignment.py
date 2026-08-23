"""Render the unprojected v27 model from the corrected reference-facing angle."""

from pathlib import Path
import sys

import bpy


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
BLEND = SRC / "zhao-yun-vitruvian-v27-stylized-portrait.blend"
OUTPUT = SRC / "zhao-yun-v28-plain-alignment.png"

sys.path.insert(0, str(Path(__file__).resolve().parent))
import render_zhao_yun_vitruvian_v27_stylized_portrait as v27  # pylint: disable=wrong-import-position
import render_zhao_yun_vitruvian_v15_cinematic_hero as renderer  # pylint: disable=wrong-import-position


def main():
    bpy.ops.wm.open_mainfile(filepath=str(BLEND))
    scene = v27.configure()
    camera = bpy.data.objects["ZhaoYun_Portrait_Camera"]
    renderer.render(
        scene,
        camera,
        OUTPUT,
        (-1.02, -1.57, 1.485),
        (0.0, -0.008, 1.628),
        106,
        (600, 700),
        48,
    )


if __name__ == "__main__":
    main()
