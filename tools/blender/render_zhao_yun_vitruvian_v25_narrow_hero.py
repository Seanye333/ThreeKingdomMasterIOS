"""Render Zhao Yun v25 narrow-hero previews and final portrait."""

from pathlib import Path
import sys

import bpy


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
BLEND = SRC / "zhao-yun-vitruvian-v25-narrow-hero.blend"
PREVIEW = SRC / "zhao-yun-vitruvian-v25-narrow-hero-preview.png"
FACE = SRC / "zhao-yun-vitruvian-v25-narrow-hero-face.png"

sys.path.insert(0, str(Path(__file__).resolve().parent))
import render_zhao_yun_vitruvian_v24_cinematic_lead as v24  # pylint: disable=wrong-import-position
import render_zhao_yun_vitruvian_v15_cinematic_hero as renderer  # pylint: disable=wrong-import-position


def main():
    bpy.ops.wm.open_mainfile(filepath=str(BLEND))
    scene = v24.configure()
    camera = bpy.data.objects["ZhaoYun_Portrait_Camera"]
    if "--face" in sys.argv:
        renderer.render(scene, camera, FACE, (1.00, -2.05, 1.490), (0.0, -0.012, 1.632), 108, (1200, 1400), 164)
        return
    renderer.render(scene, camera, PREVIEW, (0.82, -1.68, 1.505), (0.0, -0.012, 1.632), 104, (600, 700), 48)


if __name__ == "__main__":
    main()
