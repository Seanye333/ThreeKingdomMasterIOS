import { useLayoutEffect, useRef, type ReactNode } from 'react';
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

/**
 * 靜態合批 — collapse hundreds of decorative meshes into a handful of draws.
 *
 * 城內一幀 ~4,100 次 draw call 的大頭不是三角形而是物件數:64 棟民居 × 每棟
 * 6–8 個 mesh、幾十片街磚、上百叢草,每個 mesh 都是一次 state change + 一次
 * draw(開陰影再乘二)。這裡在 React 提交完場景圖之後,把標記為靜態的 mesh
 * 依「材質簽名」分組、烤掉世界矩陣、把材質色寫進頂點色,合併成每組一個大
 * mesh —— 顏色各異的民居牆、瓦、磚因此可以進同一批。
 *
 * ## 使用方式(標記制,不動 JSX 結構)
 *
 * - 樹上包一層 `<StaticBatch deps={[...]}>`。
 * - 想合批的子樹在自己的根 group 標 `userData={{ batchStatic: true }}`。
 * - 靜態子樹裡的動態島(旗幟 useFrame、火焰、發光體)標
 *   `userData={{ batchSkip: true }}`,整個小子樹留在原地照常動。
 *
 * 沒標記的東西一概不碰 —— 互動物件(onClick 的市集、流民)、LOD、Instances、
 * 蒙皮網格都照舊走原路。原始 mesh 只是 `visible = false`,React 樹原封不動,
 * deps 一變就復原重烤。
 *
 * ## 明確不合的
 *
 * - 透明材質:合併會破壞排序,通通跳過。
 * - 帶貼圖的材質:UV 域不同,鍵裡帶 map uuid,同貼圖才會同批。
 * - `InstancedMesh` / `SkinnedMesh` / 多材質 mesh / LOD 子樹。
 *
 * ## deps 是契約
 *
 * 被合進大 mesh 的內容是「提交當下」的快照 —— 驅動這些 mesh 增減、換色、
 * 換位的**每一個**輸入都必須出現在 deps 裡,漏一個就是畫面停在舊狀態
 * (原件被藏著,React 更新了也看不見)。寧可多放引用,重烤一次只是幾 ms。
 */

interface BatchGroup {
  key: string;
  geoms: THREE.BufferGeometry[];
  /** The source meshes this group swallowed — hidden only if `ok`. */
  sources: THREE.Mesh[];
  /** Template material (cloned once per group so disposal is self-owned). */
  mat: THREE.MeshStandardMaterial;
  castShadow: boolean;
  receiveShadow: boolean;
  /** Set once the merged mesh actually exists. */
  ok: boolean;
}

/** Signature of everything (except colour, which we bake) that must match for
 *  two meshes to share a draw. */
function materialKey(m: THREE.MeshStandardMaterial, mesh: THREE.Mesh): string {
  const g = mesh.geometry;
  const attrs = Object.keys(g.attributes).sort().join(',');
  return [
    m.roughness.toFixed(3), m.metalness.toFixed(3),
    m.emissive.getHexString(), m.emissiveIntensity.toFixed(3),
    m.side, m.flatShading ? 1 : 0, m.alphaTest.toFixed(3),
    m.map?.uuid ?? '-', m.normalMap?.uuid ?? '-',
    m.normalMap ? `${m.normalScale.x.toFixed(2)},${m.normalScale.y.toFixed(2)}` : '-',
    m.envMapIntensity.toFixed(2),
    mesh.castShadow ? 1 : 0, mesh.receiveShadow ? 1 : 0,
    g.index ? 'i' : 'n', attrs,
  ].join('|');
}

/** Walk up from `obj` (exclusive of `root`'s parent): batchSkip anywhere
 *  beats batchStatic; otherwise the nearest batchStatic wins. Anything inside
 *  an interactive subtree (an r3f onClick/onPointer* handler on itself or an
 *  ancestor) is excluded automatically — the merged copy sets `raycast` to a
 *  no-op, so batching a tappable 府衙 would silently kill its inspect card.
 *  `__r3f.eventCount` is r3f internal but has been stable across v8/v9; if it
 *  ever vanishes the check degrades to "batch it", which is why the truly
 *  interactive wrappers in the city scene ALSO carry explicit batchSkip. */
function isBatchable(obj: THREE.Object3D, root: THREE.Object3D): boolean {
  let cur: THREE.Object3D | null = obj;
  let inStatic = false;
  while (cur && cur !== root.parent) {
    if (cur.userData?.batchSkip) return false;
    if ((cur as THREE.LOD).isLOD) return false;
    const r3f = (cur as unknown as { __r3f?: { eventCount?: number } }).__r3f;
    if ((r3f?.eventCount ?? 0) > 0) return false;
    if (cur.userData?.batchStatic) inStatic = true;
    cur = cur.parent;
  }
  return inStatic;
}

/** Spread-ready userData markers (module constants, no per-render allocs). */
export const BATCH_STATIC = { batchStatic: true } as const;
export const BATCH_SKIP = { batchSkip: true } as const;

export function StaticBatch({ children, deps, enabled = true }: {
  children: ReactNode;
  /** EVERY input that can add/remove/move/recolour a batched mesh. */
  deps: readonly unknown[];
  enabled?: boolean;
}) {
  const srcRef = useRef<THREE.Group>(null);
  const outRef = useRef<THREE.Group>(null);

  useLayoutEffect(() => {
    const src = srcRef.current, out = outRef.current;
    if (!src || !out || !enabled) return;

    src.updateWorldMatrix(true, true);
    const outInv = new THREE.Matrix4().copy(out.matrixWorld).invert();

    const groups = new Map<string, BatchGroup>();

    src.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh || !mesh.visible) return;
      if ((mesh as unknown as THREE.InstancedMesh).isInstancedMesh) return;
      if ((mesh as unknown as THREE.SkinnedMesh).isSkinnedMesh) return;
      if (Array.isArray(mesh.material)) return;
      const mat = mesh.material as THREE.MeshStandardMaterial;
      if (!mat?.isMeshStandardMaterial || mat.transparent || mat.vertexColors) return;
      if (!isBatchable(mesh, src)) return;

      const key = materialKey(mat, mesh);
      let grp = groups.get(key);
      if (!grp) {
        const tpl = mat.clone();
        tpl.color.set('#ffffff');   // colour rides in the vertices
        tpl.vertexColors = true;
        grp = { key, geoms: [], sources: [], mat: tpl, castShadow: mesh.castShadow, receiveShadow: mesh.receiveShadow, ok: false };
        groups.set(key, grp);
      }

      // Bake: world transform (relative to the output group) + material colour.
      const geo = mesh.geometry.clone();
      geo.applyMatrix4(new THREE.Matrix4().multiplyMatrices(outInv, mesh.matrixWorld));
      const n = geo.attributes.position.count;
      const col = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) {
        col[i * 3] = mat.color.r; col[i * 3 + 1] = mat.color.g; col[i * 3 + 2] = mat.color.b;
      }
      geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
      grp.geoms.push(geo);
      grp.sources.push(mesh);
    });

    const merged: THREE.Mesh[] = [];
    const hidden: THREE.Mesh[] = [];
    for (const grp of groups.values()) {
      // Lone meshes stay live — a merge of one buys nothing and costs a clone.
      if (grp.geoms.length >= 2) {
        const geo = mergeGeometries(grp.geoms, false);
        if (geo) {
          const mesh = new THREE.Mesh(geo, grp.mat);
          mesh.castShadow = grp.castShadow;
          mesh.receiveShadow = grp.receiveShadow;
          // Decorative geometry only — never a raycast target (and one merged
          // bound would otherwise eat pointer events for the whole district).
          mesh.raycast = () => {};
          out.add(mesh);
          merged.push(mesh);
          grp.ok = true;
        }
      }
      grp.geoms.forEach((g) => g.dispose());
      if (!grp.ok) { grp.mat.dispose(); continue; }
      // Hide originals only once their replacement actually exists, so a
      // failed merge degrades to "no batching", never to missing scenery.
      for (const m of grp.sources) { m.visible = false; hidden.push(m); }
    }

    // 量測鉤子 — cityRenderBudget.spec 靠這行驗證合批真的咬到東西。
    console.debug(`[StaticBatch] ${hidden.length} meshes → ${merged.length} draws (${groups.size} material groups)`);

    return () => {
      for (const m of merged) { out.remove(m); m.geometry.dispose(); (m.material as THREE.Material).dispose(); }
      for (const m of hidden) m.visible = true;
    };
    // The caller owns invalidation — see the deps contract in the header.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, ...deps]);

  return (
    <>
      <group ref={srcRef}>{children}</group>
      <group ref={outRef} />
    </>
  );
}
