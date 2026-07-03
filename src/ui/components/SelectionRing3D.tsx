import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * 選中金圈 — the ONE selection marker for all three 3D maps (world map,
 * tactical battle, city interior). Twin gold rings: the bright inner ring
 * breathes in scale, the darker halo breathes in opacity — both at 3 Hz —
 * plus an optional bobbing chevron for tall subjects. Whatever the player
 * taps (city, marching column, battle unit, building plot), "selected"
 * reads identically.
 *
 * Self-animating and non-raycasting so it never eats taps.
 */
export function SelectionRing3D({
  radius,
  y = 0.04,
  chevronY = null,
  chevronSize = 0.13,
  color = '#ffe08a',
  halo = '#d4a84a',
  segments = 40,
}: {
  /** Outer edge of the bright inner ring (world units of the parent group). */
  radius: number;
  /** Ground lift — keep just above the parent's own floor decals. */
  y?: number;
  /** If set, a down-pointing chevron bobs at this height above the subject. */
  chevronY?: number | null;
  chevronSize?: number;
  color?: string;
  halo?: string;
  segments?: number;
}) {
  const ringRef = useRef<THREE.Mesh>(null);
  const haloRef = useRef<THREE.MeshBasicMaterial>(null);
  const chevRef = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (ringRef.current) {
      const s = 1 + Math.sin(t * 3) * 0.08;
      ringRef.current.scale.set(s, s, s);
    }
    if (haloRef.current) haloRef.current.opacity = 0.5 + Math.sin(t * 3) * 0.25;
    if (chevRef.current && chevronY != null) {
      chevRef.current.position.y = chevronY + Math.sin(t * 3) * 0.09;
    }
  });
  return (
    <group raycast={() => null}>
      <mesh ref={ringRef} position={[0, y + 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} raycast={() => null}>
        <ringGeometry args={[radius * 0.76, radius, segments]} />
        <meshBasicMaterial color={color} side={THREE.DoubleSide} transparent opacity={0.9} toneMapped={false} depthWrite={false} />
      </mesh>
      <mesh position={[0, y, 0]} rotation={[-Math.PI / 2, 0, 0]} raycast={() => null}>
        <ringGeometry args={[radius * 1.09, radius * 1.48, segments]} />
        <meshBasicMaterial ref={haloRef} color={halo} side={THREE.DoubleSide} transparent opacity={0.4} toneMapped={false} depthWrite={false} />
      </mesh>
      {chevronY != null && (
        <group ref={chevRef} position={[0, chevronY, 0]}>
          <mesh rotation={[Math.PI, 0, 0]} raycast={() => null}>
            <coneGeometry args={[chevronSize, chevronSize * 1.7, 4]} />
            <meshBasicMaterial color={color} toneMapped={false} transparent opacity={0.95} />
          </mesh>
        </group>
      )}
    </group>
  );
}
