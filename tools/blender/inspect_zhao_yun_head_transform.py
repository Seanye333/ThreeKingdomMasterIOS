"""Inspect the V16 head-bone and hair-emitter parenting transforms."""

from pathlib import Path

import bpy


ROOT = Path(__file__).resolve().parents[2]
BLEND = ROOT / "public/models/duel/_src/zhao-yun-vitruvian-v16-fullbody-polish.blend"


def compact(matrix):
    return tuple(tuple(round(value, 6) for value in row) for row in matrix)


def main():
    bpy.ops.wm.open_mainfile(filepath=str(BLEND))
    rig = bpy.data.objects["ZhaoYun_Game_Rig"]
    bone = rig.pose.bones["head"]
    emitter = bpy.data.objects["ZhaoYun_Strand_Hair_Emitter"]
    print(f"RIG_WORLD={compact(rig.matrix_world)}")
    print(f"HEAD_REST={compact(rig.data.bones['head'].matrix_local)}")
    print(f"HEAD_POSE={compact(bone.matrix)}")
    print(f"HEAD_DEFORM={compact(bone.matrix @ rig.data.bones['head'].matrix_local.inverted())}")
    print(f"EMITTER_WORLD={compact(emitter.matrix_world)}")
    print(f"EMITTER_BASIS={compact(emitter.matrix_basis)}")
    print(f"EMITTER_PARENT_INV={compact(emitter.matrix_parent_inverse)}")


if __name__ == "__main__":
    main()
