"""Render Zhao Yun v16 full-body polish previews and finals."""

from pathlib import Path
import sys

import bpy


ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "public/models/duel/_src"
BLEND = SRC / "zhao-yun-vitruvian-v16-fullbody-polish.blend"
PREVIEW = SRC / "zhao-yun-vitruvian-v16-polished-preview.png"
HERO = SRC / "zhao-yun-vitruvian-v16-polished-hero.png"
FULL = SRC / "zhao-yun-vitruvian-v16-polished-full.png"

sys.path.insert(0, str(Path(__file__).resolve().parent))
import render_zhao_yun_vitruvian_v15_cinematic_hero as v15_render  # pylint: disable=wrong-import-position


def main():
    bpy.ops.wm.open_mainfile(filepath=str(BLEND))
    scene = v15_render.configure_scene()
    camera = bpy.data.objects["ZhaoYun_Portrait_Camera"]
    if "--preview" in sys.argv:
        v15_render.render(scene, camera, PREVIEW, (1.92, -4.82, 0.98), (0.0, 0.0, 1.13), 72, (700, 920), 48)
        return
    if "--full" in sys.argv:
        v15_render.render(scene, camera, FULL, (1.92, -4.82, 0.98), (0.0, 0.0, 1.13), 72, (1050, 1400), 104)
        return
    v15_render.render(scene, camera, HERO, (1.27, -3.88, 1.19), (0.0, -0.01, 1.23), 82, (1100, 1400), 120)


if __name__ == "__main__":
    main()
