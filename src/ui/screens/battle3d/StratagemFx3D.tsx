import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { hexWorld } from './battleGrid';
import { FX_DURATION, type TacticFxSpec } from '../../../game/data/stratagemFx';
import type { HexCoord } from '../../../game/types';

/**
 * 計略演出 — the per-stratagem particle set pieces (fire, flood, ambush,
 * rockfall, arrow storms, the lot). One switch over the FX archetype, each
 * arm its own little animated rig.
 *
 * Nearly a thousand lines of pure visual, split out of TacticalBattleScreen3D
 * so the battle host stays about the board, the HUD and the turn flow. It
 * reads nothing from the host — coordinates, a spec and a spawn time in,
 * meshes out — so it lifts cleanly.
 */

export function StratagemFXNode({ coord, spec, spawnedAt }: {
  coord: HexCoord; spec: TacticFxSpec; spawnedAt: number;
}) {
  const { kind, color, density, spin, scale, variant } = spec;
  const [x, z] = hexWorld(coord.col, coord.row);
  const dur = FX_DURATION[kind];
  /** particle count scaled by this tactic's density (min 2). */
  const n = (base: number) => Math.max(2, Math.round(base * density));
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (!groupRef.current) return;
    const age = (Date.now() - spawnedAt) / 1000;
    const t = Math.min(1, age / dur);
    const g = groupRef.current;
    // Per-FX animation logic
    switch (kind) {
      case 'fire': {
        // Rising particles — group climbs and shrinks
        g.position.y = t * 2.5;
        g.scale.setScalar(1 + t * 0.6);
        break;
      }
      case 'lightning': {
        // Quick descend + flash
        g.position.y = (1 - t) * 6;
        g.scale.setScalar(1 + (1 - t) * 0.4);
        break;
      }
      case 'arrows': {
        // Falling group
        g.position.y = (1 - t) * 5;
        break;
      }
      case 'aura': {
        // Slow rise + rotation
        g.rotation.y = t * Math.PI * 2;
        g.position.y = t * 0.8;
        break;
      }
      case 'swirl': {
        g.rotation.y = t * Math.PI * 4;
        g.position.y = 0.8 + Math.sin(t * Math.PI * 3) * 0.2;
        break;
      }
      case 'shockwave': {
        g.scale.setScalar(0.3 + t * 4);
        break;
      }
      case 'shield': {
        g.rotation.y = t * Math.PI;
        g.position.y = 0.5 + Math.sin(t * Math.PI * 2) * 0.1;
        break;
      }
      case 'chain': {
        g.rotation.y = t * Math.PI;
        break;
      }
      case 'grain': {
        // 焚糧 — climbs a little, flame flickers via scale
        g.position.y = t * 1.0;
        g.scale.setScalar(1 + t * 0.3 + Math.sin(t * 30) * 0.05);
        break;
      }
      case 'rune': {
        // 神算 — slow rise + steady rotation of the trigram
        g.rotation.y = t * Math.PI * 1.5;
        g.position.y = 0.3 + t * 0.5;
        break;
      }
      case 'feint': {
        // 偽計 — the false image pulls back and fades away
        g.position.z = -t * 1.8;
        g.position.x = t * 0.4;
        break;
      }
      case 'streak': {
        // 飛将 — dash forward leaving the trail behind
        g.position.x = t * 2.4;
        break;
      }
      case 'dragon': {
        // 龍威 — the dragon coils upward fast
        g.rotation.y = t * Math.PI * 3;
        g.position.y = t * 2.0;
        g.scale.setScalar(1 + t * 0.4);
        break;
      }
      case 'splash': {
        // 撞角 — water crown leaps then falls, ripple spreads
        g.position.y = Math.sin(t * Math.PI) * 1.4;
        g.scale.setScalar(1 + t * 1.2);
        break;
      }
      case 'grapple': {
        // 接舷 — ropes swing, sparks jitter
        g.rotation.y = Math.sin(t * Math.PI * 4) * 0.25;
        break;
      }
      case 'shipfire': {
        // 火船 — the blaze climbs the hull
        g.position.y = t * 0.8;
        g.scale.setScalar(1 + t * 0.5 + Math.sin(t * 26) * 0.04);
        break;
      }
      case 'scatter': {
        // 劫糧道 — crates burst outward
        g.scale.setScalar(0.4 + t * 2.2);
        break;
      }
      case 'rocks': {
        // 落石 — boulders plummet from above
        g.position.y = (1 - t) * 3.5;
        break;
      }
      case 'wind': {
        // 借東風 — the wind spirals up fast
        g.rotation.y = t * Math.PI * 4;
        g.position.y = t * 0.6;
        break;
      }
      case 'gate': {
        // 八門遁甲 — the eight gates wheel slowly shut
        g.rotation.y = t * Math.PI * 0.8;
        g.position.y = t * 0.2;
        break;
      }
      case 'empty': {
        // 空城計 — the unnerving calm spreads outward, almost still
        g.scale.setScalar(1 + t * 0.8);
        break;
      }
      case 'lamp': {
        // 七星燈 — the Dipper of lamps drifts gently upward
        g.position.y = t * 0.5;
        g.rotation.y = Math.sin(t * 2) * 0.1;
        break;
      }
      case 'net': {
        // 七擒 — the capture net drops over the foe
        g.position.y = (1 - t) * 2.2;
        break;
      }
      case 'charm': {
        // 美人計 — petals swirl up and around
        g.rotation.y = t * Math.PI * 2;
        g.position.y = t * 0.5;
        break;
      }
      case 'thunderstorm': {
        // 五雷 — a barrage of bolts crashes down
        g.position.y = (1 - t) * 5;
        g.scale.setScalar(1 + (1 - t) * 0.3);
        break;
      }
      case 'poison': {
        // 毒瘴 — the toxic cloud roils upward and swells
        g.position.y = t * 0.7;
        g.scale.setScalar(1 + t * 0.5);
        break;
      }
      case 'ice': {
        // 冰封 — shards lock in, a slow shiver
        g.position.y = 0.2 + Math.sin(t * 12) * 0.02 * (1 - t);
        break;
      }
      case 'blades': {
        // 刀陣 — the blade ring whirls
        g.rotation.y = t * Math.PI * 6;
        break;
      }
      case 'spears': {
        // 槍林 — the spear wall thrusts up
        g.position.y = -0.4 + Math.min(1, t * 3) * 0.4;
        break;
      }
      case 'caltrops': {
        // 鐵蒺藜 — spikes scatter outward across the ground
        g.scale.setScalar(0.3 + Math.min(1, t * 2.5) * 1.0);
        break;
      }
      case 'beast': {
        // 猛獸 — a pouncing lunge forward
        g.position.x = Math.sin(t * Math.PI) * 0.8;
        g.position.y = Math.sin(t * Math.PI) * 0.4;
        break;
      }
      case 'drum': {
        // 戰鼓 — pulses outward in beats
        g.scale.setScalar(0.6 + (0.4 + Math.abs(Math.sin(t * Math.PI * 4)) * 0.6) * (0.5 + t));
        break;
      }
      case 'cannon': {
        // 火砲 — muzzle blast bursts then drifts
        g.scale.setScalar(0.3 + Math.min(1, t * 4) * 1.4);
        g.position.y = t * 0.4;
        break;
      }
      case 'smoke': {
        // 煙幕 — the screen billows up and spreads
        g.position.y = t * 1.2;
        g.scale.setScalar(1 + t * 0.9);
        break;
      }
      case 'vortex': {
        // 旋渦 — a tight fast funnel
        g.rotation.y = t * Math.PI * 8;
        g.position.y = 0.6 + Math.sin(t * Math.PI * 2) * 0.15;
        break;
      }
      case 'oil': {
        // 火油 — the slick splatters out low and burns
        g.scale.setScalar(0.4 + t * 1.6);
        break;
      }
      case 'curse': {
        // 詛咒 — dark sigils orbit and sink in
        g.rotation.y = t * Math.PI * 3;
        g.position.y = 0.5 - t * 0.3;
        break;
      }
    }
    // Per-tactic spin direction/speed (applied to whatever rotation the case set).
    g.rotation.y *= spin;
    // Fade out
    const fade = 1 - t;
    g.traverse((obj) => {
      const m = (obj as THREE.Mesh).material as THREE.MeshBasicMaterial | undefined;
      if (m && 'opacity' in m) m.opacity = fade;
    });
  });

  // Geometry per kind
  const visuals = (() => {
    switch (kind) {
      case 'fire':
        // 烈焰 + 濃煙柱 — orange/yellow/red flame tongues at the base, dark
        // smoke billowing above; the whole column rises (赤壁 inferno).
        return (
          <>
            {Array.from({ length: n(18) }).map((_, i) => {
              const ang = (i / 18) * Math.PI * 3.2;
              const r = 0.12 + (i % 4) * 0.17;
              // tint the flame palette toward this tactic's colour
              const fc = i % 3 === 0 ? '#ffd24a' : i % 3 === 1 ? color : '#e0331a';
              return (
                <mesh key={`f${i}`} position={[Math.cos(ang) * r, 0.08 + (i % 5) * 0.18, Math.sin(ang) * r]}>
                  <sphereGeometry args={[0.13 + (i % 3) * 0.05, 6, 6]} />
                  <meshBasicMaterial color={fc} transparent opacity={1} toneMapped={false} />
                </mesh>
              );
            })}
            {Array.from({ length: 8 }).map((_, i) => {
              const ang = (i / 8) * Math.PI * 2;
              const r = 0.18 + (i % 3) * 0.16;
              return (
                <mesh key={`s${i}`} position={[Math.cos(ang) * r, 1.05 + i * 0.24, Math.sin(ang) * r]}>
                  <sphereGeometry args={[0.24 + (i % 3) * 0.09, 6, 6]} />
                  <meshBasicMaterial color={i % 2 ? '#52493f' : '#6a6055'} transparent opacity={1} />
                </mesh>
              );
            })}
          </>
        );
      case 'lightning':
        return (
          <>
            <mesh position={[0, 3, 0]}>
              <cylinderGeometry args={[0.04, 0.08, 6, 6]} />
              <meshBasicMaterial color={color} transparent opacity={1} />
            </mesh>
            <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.5, 0.8, 16]} />
              <meshBasicMaterial color={color} transparent opacity={1} side={THREE.DoubleSide} />
            </mesh>
          </>
        );
      case 'arrows':
        // variant 0/1: orbiting volley climbing a spiral; 2/3: a falling rain spread.
        return Array.from({ length: n(8) }).map((_, i) => {
          const ang = (i / 8) * Math.PI * 2;
          const rain = variant >= 2;
          const r = rain ? 0.25 + (i % 4) * 0.18 : 0.6;
          return (
            <mesh
              key={i}
              position={rain
                ? [Math.cos(ang) * r, 0.4 + (i % 5) * 0.42, Math.sin(ang) * r]
                : [Math.cos(ang) * r, i * 0.3, Math.sin(ang) * r]}
              rotation={rain ? [Math.PI / 2.2, 0, 0] : [Math.PI / 3, 0, 0]}
            >
              <cylinderGeometry args={[0.02, 0.02, 0.6, 4]} />
              <meshBasicMaterial color={color} transparent opacity={1} />
            </mesh>
          );
        });
      case 'aura':
        return (
          <>
            <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.7, 1.1, 24]} />
              <meshBasicMaterial color={color} transparent opacity={1} side={THREE.DoubleSide} />
            </mesh>
            {Array.from({ length: n(6) }).map((_, i) => {
              const ang = (i / n(6)) * Math.PI * 2;
              return (
                <mesh key={i} position={[Math.cos(ang) * 0.6, 0.5, Math.sin(ang) * 0.6]}>
                  <sphereGeometry args={[0.08, 6, 6]} />
                  <meshBasicMaterial color={color} transparent opacity={1} />
                </mesh>
              );
            })}
          </>
        );
      case 'swirl':
        return Array.from({ length: n(10) }).map((_, i) => {
          const ang = (i / 10) * Math.PI * 2;
          const r = 0.5 + (i % 2) * 0.2;
          return (
            <mesh key={i} position={[Math.cos(ang) * r, 0.2 + i * 0.05, Math.sin(ang) * r]}>
              <sphereGeometry args={[0.07, 5, 5]} />
              <meshBasicMaterial color={color} transparent opacity={1} />
            </mesh>
          );
        });
      case 'shockwave':
        // variant ≥2 adds a second, outer ring.
        return (
          <>
            <mesh position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.5, 0.7, 32]} />
              <meshBasicMaterial color={color} transparent opacity={1} side={THREE.DoubleSide} />
            </mesh>
            {variant >= 2 && (
              <mesh position={[0, 0.12, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[0.85, 0.98, 32]} />
                <meshBasicMaterial color={color} transparent opacity={0.6} side={THREE.DoubleSide} />
              </mesh>
            )}
          </>
        );
      case 'shield':
        return (
          <>
            <mesh position={[0, 0.4, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.85, 1.0, 24]} />
              <meshBasicMaterial color={color} transparent opacity={1} side={THREE.DoubleSide} />
            </mesh>
            <mesh position={[0, 0.7, 0]}>
              <sphereGeometry args={[0.9, 16, 8]} />
              <meshBasicMaterial color={color} transparent opacity={0.18} wireframe />
            </mesh>
          </>
        );
      case 'chain':
        return Array.from({ length: 5 }).map((_, i) => (
          <mesh key={i} position={[i * 0.25 - 0.5, 0.5, 0]}>
            <torusGeometry args={[0.12, 0.04, 6, 12]} />
            <meshBasicMaterial color={color} transparent opacity={1} />
          </mesh>
        ));
      case 'grain':
        // 兵糧攻 — 糧箱起火,火舌與穀屑齊飛
        return (
          <>
            {[-0.16, 0.16].map((dx, i) => (
              <mesh key={`box${i}`} position={[dx, 0.13, 0]}>
                <boxGeometry args={[0.24, 0.24, 0.24]} />
                <meshBasicMaterial color="#7a5230" transparent opacity={1} />
              </mesh>
            ))}
            {Array.from({ length: 8 }).map((_, i) => {
              const a = (i / 8) * Math.PI * 2;
              const r = 0.08 + (i % 3) * 0.08;
              const fc = i % 3 === 0 ? '#ffd24a' : i % 3 === 1 ? '#ff8424' : '#e0331a';
              return (
                <mesh key={`fl${i}`} position={[Math.cos(a) * r, 0.3 + (i % 4) * 0.15, Math.sin(a) * r]}>
                  <sphereGeometry args={[0.07, 6, 6]} />
                  <meshBasicMaterial color={fc} transparent opacity={1} toneMapped={false} />
                </mesh>
              );
            })}
          </>
        );
      case 'rune':
        // 神算 — 八卦符陣 + 浮空符牘 + 中央慧眼
        return (
          <>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
              <ringGeometry args={[0.55, 0.72, 8]} />
              <meshBasicMaterial color={color} transparent opacity={1} side={THREE.DoubleSide} toneMapped={false} />
            </mesh>
            {Array.from({ length: 8 }).map((_, i) => {
              const a = (i / 8) * Math.PI * 2;
              return (
                <mesh key={i} position={[Math.cos(a) * 0.46, 0.5, Math.sin(a) * 0.46]} rotation={[0, -a, 0]}>
                  <boxGeometry args={[0.02, 0.22, 0.02]} />
                  <meshBasicMaterial color={color} transparent opacity={1} toneMapped={false} />
                </mesh>
              );
            })}
            <mesh position={[0, 0.72, 0]}>
              <sphereGeometry args={[0.12, 12, 12]} />
              <meshBasicMaterial color="#d4ecff" transparent opacity={1} toneMapped={false} />
            </mesh>
          </>
        );
      case 'feint':
        // 偽計 — 半透明虛影連同煙塵向後撤去
        return (
          <>
            {Array.from({ length: 3 }).map((_, i) => (
              <mesh key={`gh${i}`} position={[i * 0.2 - 0.2, 0.5, i * 0.18]}>
                <boxGeometry args={[0.2, 0.5, 0.12]} />
                <meshBasicMaterial color={color} transparent opacity={0.45} />
              </mesh>
            ))}
            {Array.from({ length: 6 }).map((_, i) => {
              const a = (i / 6) * Math.PI * 2;
              return (
                <mesh key={`d${i}`} position={[Math.cos(a) * 0.4, 0.12, Math.sin(a) * 0.4]}>
                  <sphereGeometry args={[0.09, 5, 5]} />
                  <meshBasicMaterial color="#a89a86" transparent opacity={0.5} />
                </mesh>
              );
            })}
          </>
        );
      case 'streak':
        // 飛将 — 水平疾風線 + 揚塵尾跡
        return (
          <>
            {Array.from({ length: 5 }).map((_, i) => (
              <mesh
                key={`s${i}`}
                position={[-0.5 - i * 0.18, 0.3 + (i % 2) * 0.18, (i % 3 - 1) * 0.12]}
                rotation={[0, 0, Math.PI / 2]}
              >
                <cylinderGeometry args={[0.015, 0.015, 0.5, 4]} />
                <meshBasicMaterial color={color} transparent opacity={1} />
              </mesh>
            ))}
            {Array.from({ length: 6 }).map((_, i) => (
              <mesh key={`d${i}`} position={[-0.3 - i * 0.16, 0.1, i % 2 ? 0.12 : -0.12]}>
                <sphereGeometry args={[0.08 + (i % 2) * 0.04, 5, 5]} />
                <meshBasicMaterial color="#bda678" transparent opacity={0.6} />
              </mesh>
            ))}
          </>
        );
      case 'dragon':
        // 龍威 — 青龍鱗節螺旋升騰,腳下符環
        return (
          <>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
              <ringGeometry args={[0.45, 0.6, 24]} />
              <meshBasicMaterial color={color} transparent opacity={1} side={THREE.DoubleSide} toneMapped={false} />
            </mesh>
            {Array.from({ length: 12 }).map((_, i) => {
              const a = (i / 12) * Math.PI * 4;
              const r = 0.42 - i * 0.012;
              return (
                <mesh key={i} position={[Math.cos(a) * r, 0.1 + i * 0.13, Math.sin(a) * r]}>
                  <sphereGeometry args={[Math.max(0.04, 0.1 - i * 0.004), 8, 8]} />
                  <meshBasicMaterial color={i % 2 ? '#3a7dd9' : '#7ec8ff'} transparent opacity={1} toneMapped={false} />
                </mesh>
              );
            })}
          </>
        );
      case 'splash':
        // 撞角 — 浪冠水珠四濺 + 漣漪環
        return (
          <>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]}>
              <ringGeometry args={[0.4, 0.55, 24]} />
              <meshBasicMaterial color={color} transparent opacity={1} side={THREE.DoubleSide} />
            </mesh>
            {Array.from({ length: 10 }).map((_, i) => {
              const a = (i / 10) * Math.PI * 2;
              const r = 0.25 + (i % 3) * 0.12;
              return (
                <mesh key={i} position={[Math.cos(a) * r, 0.3 + (i % 4) * 0.18, Math.sin(a) * r]}>
                  <sphereGeometry args={[0.06, 6, 6]} />
                  <meshBasicMaterial color={i % 2 ? '#dff2fa' : color} transparent opacity={1} />
                </mesh>
              );
            })}
          </>
        );
      case 'grapple':
        // 接舷 — 飛鉤纜索鉤住敵舷,鉤尖迸火星
        return (
          <>
            {Array.from({ length: 4 }).map((_, i) => {
              const a = (i / 4) * Math.PI * 2;
              return (
                <mesh
                  key={`r${i}`}
                  position={[Math.cos(a) * 0.3, 0.45, Math.sin(a) * 0.3]}
                  rotation={[Math.PI / 3, -a, 0]}
                >
                  <cylinderGeometry args={[0.012, 0.012, 0.9, 4]} />
                  <meshBasicMaterial color={color} transparent opacity={1} />
                </mesh>
              );
            })}
            {Array.from({ length: 6 }).map((_, i) => {
              const a = (i / 6) * Math.PI * 2;
              return (
                <mesh key={`sp${i}`} position={[Math.cos(a) * 0.55, 0.72, Math.sin(a) * 0.55]}>
                  <sphereGeometry args={[0.05, 5, 5]} />
                  <meshBasicMaterial color="#ffd24a" transparent opacity={1} toneMapped={false} />
                </mesh>
              );
            })}
          </>
        );
      case 'shipfire':
        // 火船 — 黑船身載烈焰沖江,水面映漣漪
        return (
          <>
            <mesh position={[0, 0.12, 0]} rotation={[0, 0.3, 0]}>
              <boxGeometry args={[0.9, 0.18, 0.34]} />
              <meshBasicMaterial color="#2a2018" transparent opacity={1} />
            </mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
              <ringGeometry args={[0.6, 0.82, 24]} />
              <meshBasicMaterial color="#3a7dd9" transparent opacity={0.5} side={THREE.DoubleSide} />
            </mesh>
            {Array.from({ length: 12 }).map((_, i) => {
              const fc = i % 3 === 0 ? '#ffd24a' : i % 3 === 1 ? '#ff7e26' : '#e0331a';
              return (
                <mesh key={i} position={[(i % 5) * 0.18 - 0.36, 0.28 + (i % 4) * 0.16, Math.sin(i) * 0.1]}>
                  <sphereGeometry args={[0.1, 6, 6]} />
                  <meshBasicMaterial color={fc} transparent opacity={1} toneMapped={false} />
                </mesh>
              );
            })}
          </>
        );
      case 'scatter':
        // 劫糧道 — 糧車糧箱朝四方迸飛 + 煙塵
        return (
          <>
            {Array.from({ length: 6 }).map((_, i) => {
              const a = (i / 6) * Math.PI * 2;
              return (
                <mesh
                  key={`c${i}`}
                  position={[Math.cos(a) * 0.4, 0.2 + (i % 2) * 0.2, Math.sin(a) * 0.4]}
                  rotation={[a, a * 1.3, 0]}
                >
                  <boxGeometry args={[0.16, 0.16, 0.16]} />
                  <meshBasicMaterial color={i % 2 ? '#a9763e' : '#caa45a'} transparent opacity={1} />
                </mesh>
              );
            })}
            {Array.from({ length: 6 }).map((_, i) => {
              const a = (i / 6) * Math.PI * 2 + 0.5;
              return (
                <mesh key={`d${i}`} position={[Math.cos(a) * 0.5, 0.1, Math.sin(a) * 0.5]}>
                  <sphereGeometry args={[0.1, 5, 5]} />
                  <meshBasicMaterial color="#b3a081" transparent opacity={0.5} />
                </mesh>
              );
            })}
          </>
        );
      case 'rocks':
        // 落石 — 滾石自天崩落,著地揚起塵環
        return (
          <>
            {Array.from({ length: 6 }).map((_, i) => {
              const a = (i / 6) * Math.PI * 2;
              const r = 0.15 + (i % 3) * 0.12;
              return (
                <mesh
                  key={`b${i}`}
                  position={[Math.cos(a) * r, 0.4 + (i % 4) * 0.4, Math.sin(a) * r]}
                  rotation={[a, a, a * 0.5]}
                >
                  <dodecahedronGeometry args={[0.12 + (i % 3) * 0.04, 0]} />
                  <meshBasicMaterial color={i % 2 ? '#7c746a' : '#9a9288'} transparent opacity={1} />
                </mesh>
              );
            })}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]}>
              <ringGeometry args={[0.3, 0.55, 20]} />
              <meshBasicMaterial color="#8f877b" transparent opacity={0.5} side={THREE.DoubleSide} />
            </mesh>
          </>
        );
      case 'wind':
        // 借東風 — 螺旋風弧捲起,綠葉隨風旋飛
        return (
          <>
            {[0, 1, 2].map((i) => (
              <mesh key={`arc${i}`} position={[0, 0.3 + i * 0.4, 0]} rotation={[Math.PI / 2 - 0.3 * i, 0, i * 0.6]}>
                <torusGeometry args={[0.4 + i * 0.12, 0.025, 6, 16, Math.PI * 1.4]} />
                <meshBasicMaterial color={color} transparent opacity={1} toneMapped={false} />
              </mesh>
            ))}
            {Array.from({ length: 6 }).map((_, i) => {
              const a = (i / 6) * Math.PI * 2;
              return (
                <mesh key={`lf${i}`} position={[Math.cos(a) * 0.45, 0.3 + (i % 3) * 0.3, Math.sin(a) * 0.45]} rotation={[a, a, 0]}>
                  <boxGeometry args={[0.07, 0.03, 0.02]} />
                  <meshBasicMaterial color="#9ad6a8" transparent opacity={1} />
                </mesh>
              );
            })}
          </>
        );
      case 'gate':
        // 八門遁甲 — 八根光柱環成八門,死門(其一)染赤
        return (
          <>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]}>
              <ringGeometry args={[0.7, 0.85, 8]} />
              <meshBasicMaterial color={color} transparent opacity={1} side={THREE.DoubleSide} toneMapped={false} />
            </mesh>
            {Array.from({ length: 8 }).map((_, i) => {
              const a = (i / 8) * Math.PI * 2;
              return (
                <mesh key={i} position={[Math.cos(a) * 0.78, 0.45, Math.sin(a) * 0.78]}>
                  <boxGeometry args={[0.08, 0.9, 0.08]} />
                  <meshBasicMaterial color={i === 5 ? '#ff5530' : color} transparent opacity={1} toneMapped={false} />
                </mesh>
              );
            })}
          </>
        );
      case 'empty':
        // 空城計 — 城門大開,撫琴退兵,蕩開兩圈靜謐漣漪
        return (
          <>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]}>
              <ringGeometry args={[0.5, 0.62, 40]} />
              <meshBasicMaterial color={color} transparent opacity={0.7} side={THREE.DoubleSide} />
            </mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
              <ringGeometry args={[0.85, 0.92, 40]} />
              <meshBasicMaterial color={color} transparent opacity={0.4} side={THREE.DoubleSide} />
            </mesh>
            <mesh position={[0, 0.5, 0]} rotation={[0, 0, 0]}>
              <torusGeometry args={[0.22, 0.04, 6, 12, Math.PI]} />
              <meshBasicMaterial color="#c9b48a" transparent opacity={1} />
            </mesh>
            {Array.from({ length: 5 }).map((_, i) => (
              <mesh key={i} position={[(i - 2) * 0.18, 0.7 + Math.abs(i - 2) * 0.06, 0]}>
                <sphereGeometry args={[0.03, 6, 6]} />
                <meshBasicMaterial color="#fff4d8" transparent opacity={1} toneMapped={false} />
              </mesh>
            ))}
          </>
        );
      case 'lamp': {
        // 七星燈 — 七盞燈擺成北斗,祈壽延命
        const DIPPER: Array<[number, number]> = [
          [-0.6, 0.3], [-0.32, 0.22], [-0.03, 0.26], [0.26, 0.16], [0.42, -0.05], [0.22, -0.32], [-0.05, -0.34],
        ];
        return (
          <>
            {DIPPER.map(([px, pz], i) => (
              <mesh key={`l${i}`} position={[px, 0.4 + (i % 2) * 0.08, pz]}>
                <sphereGeometry args={[0.07, 8, 8]} />
                <meshBasicMaterial color={color} transparent opacity={1} toneMapped={false} />
              </mesh>
            ))}
            {DIPPER.map(([px, pz], i) => (
              <mesh key={`st${i}`} position={[px, 0.18, pz]}>
                <cylinderGeometry args={[0.012, 0.012, 0.4, 4]} />
                <meshBasicMaterial color="#6a5230" transparent opacity={1} />
              </mesh>
            ))}
          </>
        );
      }
      case 'net':
        // 七擒孟獲 — 擒縱之網自天罩落
        return (
          <>
            {Array.from({ length: 6 }).map((_, i) => {
              const a = (i / 6) * Math.PI * 2;
              return (
                <mesh key={`m${i}`} position={[Math.cos(a) * 0.3, 0.5, Math.sin(a) * 0.3]} rotation={[Math.PI / 2.5, -a, 0]}>
                  <cylinderGeometry args={[0.01, 0.01, 0.9, 4]} />
                  <meshBasicMaterial color={color} transparent opacity={1} />
                </mesh>
              );
            })}
            <mesh position={[0, 0.7, 0]}>
              <sphereGeometry args={[0.5, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2]} />
              <meshBasicMaterial color={color} transparent opacity={0.3} wireframe />
            </mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.06, 0]}>
              <ringGeometry args={[0.45, 0.5, 18]} />
              <meshBasicMaterial color={color} transparent opacity={1} side={THREE.DoubleSide} />
            </mesh>
          </>
        );
      case 'charm':
        // 美人計 — 桃色花瓣繞旋媚惑
        return (
          <>
            {Array.from({ length: 8 }).map((_, i) => {
              const a = (i / 8) * Math.PI * 2;
              const r = 0.35 + (i % 3) * 0.1;
              return (
                <mesh key={i} position={[Math.cos(a) * r, 0.3 + (i % 4) * 0.18, Math.sin(a) * r]} rotation={[a, a, 0]}>
                  <coneGeometry args={[0.06, 0.12, 4]} />
                  <meshBasicMaterial color={i % 2 ? '#ff9ec4' : '#ffd0e0'} transparent opacity={1} toneMapped={false} />
                </mesh>
              );
            })}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]}>
              <ringGeometry args={[0.3, 0.42, 24]} />
              <meshBasicMaterial color={color} transparent opacity={0.7} side={THREE.DoubleSide} />
            </mesh>
          </>
        );
      case 'thunderstorm':
        // 五雷正法 — 五道天雷齊落,焦土成環
        return (
          <>
            {([[-0.4, 0.2], [0.3, -0.3], [0.0, 0.0], [0.45, 0.35], [-0.3, -0.4]] as Array<[number, number]>).map(([px, pz], i) => (
              <mesh key={i} position={[px, 2.4, pz]}>
                <cylinderGeometry args={[0.03, 0.07, 5, 5]} />
                <meshBasicMaterial color={color} transparent opacity={1} toneMapped={false} />
              </mesh>
            ))}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
              <ringGeometry args={[0.5, 0.85, 24]} />
              <meshBasicMaterial color={color} transparent opacity={1} side={THREE.DoubleSide} toneMapped={false} />
            </mesh>
          </>
        );
      case 'poison':
        // 毒瘴 — 翻滾的綠毒雲團 + 升騰毒泡
        return (
          <>
            {Array.from({ length: n(10) }).map((_, i) => {
              const a = (i / 10) * Math.PI * 2;
              const r = 0.18 + (i % 3) * 0.14;
              return (
                <mesh key={`p${i}`} position={[Math.cos(a) * r, 0.3 + (i % 4) * 0.16, Math.sin(a) * r]}>
                  <sphereGeometry args={[0.16 + (i % 3) * 0.05, 6, 6]} />
                  <meshBasicMaterial color={i % 2 ? color : '#6fa030'} transparent opacity={0.7} />
                </mesh>
              );
            })}
          </>
        );
      case 'ice':
        // 冰封 — 放射狀冰晶碎片 + 地面寒環
        return (
          <>
            {Array.from({ length: n(8) }).map((_, i) => {
              const a = (i / 8) * Math.PI * 2;
              const r = 0.22 + (i % 2) * 0.16;
              return (
                <mesh key={i} position={[Math.cos(a) * r, 0.25 + (i % 3) * 0.18, Math.sin(a) * r]} rotation={[a, a, a]}>
                  <octahedronGeometry args={[0.1 + (i % 3) * 0.03, 0]} />
                  <meshBasicMaterial color={color} transparent opacity={0.85} toneMapped={false} />
                </mesh>
              );
            })}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]}>
              <ringGeometry args={[0.35, 0.5, 6]} />
              <meshBasicMaterial color={color} transparent opacity={0.6} side={THREE.DoubleSide} />
            </mesh>
          </>
        );
      case 'blades':
        // 刀陣 — 環繞的刀刃輪轉
        return Array.from({ length: n(7) }).map((_, i) => {
          const a = (i / n(7)) * Math.PI * 2;
          return (
            <mesh key={i} position={[Math.cos(a) * 0.5, 0.4, Math.sin(a) * 0.5]} rotation={[0, -a, Math.PI / 2.2]}>
              <coneGeometry args={[0.05, 0.34, 3]} />
              <meshBasicMaterial color={color} transparent opacity={0.95} toneMapped={false} />
            </mesh>
          );
        });
      case 'spears':
        // 槍林 — 一片向上戳刺的槍尖
        return Array.from({ length: n(9) }).map((_, i) => {
          const a = (i / n(9)) * Math.PI * 2;
          const r = 0.2 + (i % 3) * 0.14;
          return (
            <mesh key={i} position={[Math.cos(a) * r, 0.45, Math.sin(a) * r]}>
              <coneGeometry args={[0.04, 0.8, 4]} />
              <meshBasicMaterial color={color} transparent opacity={0.95} />
            </mesh>
          );
        });
      case 'caltrops':
        // 鐵蒺藜 — 地面四散的尖刺
        return (
          <>
            {Array.from({ length: n(12) }).map((_, i) => {
              const a = (i / 12) * Math.PI * 2 * 1.6;
              const r = 0.15 + (i % 4) * 0.12;
              return (
                <mesh key={i} position={[Math.cos(a) * r, 0.08, Math.sin(a) * r]} rotation={[Math.PI / 4, a, 0]}>
                  <tetrahedronGeometry args={[0.07, 0]} />
                  <meshBasicMaterial color={color} transparent opacity={0.95} />
                </mesh>
              );
            })}
          </>
        );
      case 'beast':
        // 猛獸 — 三道爪痕劃過 + 兇光
        return (
          <>
            {[0, 1, 2].map((i) => (
              <mesh key={i} position={[(i - 1) * 0.16, 0.5, 0]} rotation={[0, 0, -0.3]}>
                <boxGeometry args={[0.04, 0.7, 0.03]} />
                <meshBasicMaterial color={color} transparent opacity={0.95} toneMapped={false} />
              </mesh>
            ))}
            <mesh position={[0, 0.5, -0.1]}>
              <sphereGeometry args={[0.12, 8, 8]} />
              <meshBasicMaterial color="#ffd24a" transparent opacity={0.6} toneMapped={false} />
            </mesh>
          </>
        );
      case 'drum':
        // 戰鼓 — 同心鼓圈 + 中央鼓面
        return (
          <>
            {[0.4, 0.65, 0.9].map((rr, i) => (
              <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05 + i * 0.01, 0]}>
                <ringGeometry args={[rr, rr + 0.08, 28]} />
                <meshBasicMaterial color={color} transparent opacity={0.8 - i * 0.2} side={THREE.DoubleSide} />
              </mesh>
            ))}
            <mesh position={[0, 0.25, 0]}>
              <cylinderGeometry args={[0.22, 0.22, 0.3, 16]} />
              <meshBasicMaterial color="#8a2a1a" transparent opacity={0.9} />
            </mesh>
          </>
        );
      case 'cannon':
        // 火砲 — 砲口爆焰 + 灰煙
        return (
          <>
            {Array.from({ length: n(8) }).map((_, i) => {
              const a = (i / 8) * Math.PI * 2;
              const r = 0.1 + (i % 3) * 0.12;
              return (
                <mesh key={`b${i}`} position={[Math.cos(a) * r, 0.3, Math.sin(a) * r]}>
                  <sphereGeometry args={[0.12, 6, 6]} />
                  <meshBasicMaterial color={i % 2 ? '#ffd24a' : color} transparent opacity={0.9} toneMapped={false} />
                </mesh>
              );
            })}
            {Array.from({ length: 5 }).map((_, i) => (
              <mesh key={`s${i}`} position={[(i - 2) * 0.12, 0.6 + i * 0.08, 0]}>
                <sphereGeometry args={[0.14, 6, 6]} />
                <meshBasicMaterial color="#6a6055" transparent opacity={0.6} />
              </mesh>
            ))}
          </>
        );
      case 'smoke':
        // 煙幕 — 大團遮蔽灰煙
        return Array.from({ length: n(9) }).map((_, i) => {
          const a = (i / 9) * Math.PI * 2;
          const r = 0.15 + (i % 4) * 0.14;
          return (
            <mesh key={i} position={[Math.cos(a) * r, 0.3 + (i % 4) * 0.2, Math.sin(a) * r]}>
              <sphereGeometry args={[0.22 + (i % 3) * 0.08, 6, 6]} />
              <meshBasicMaterial color={color} transparent opacity={0.55} />
            </mesh>
          );
        });
      case 'vortex':
        // 旋渦 — 收緊的螺旋柱
        return Array.from({ length: n(14) }).map((_, i) => {
          const a = (i / 14) * Math.PI * 5;
          const r = 0.55 - i * 0.03;
          return (
            <mesh key={i} position={[Math.cos(a) * Math.max(0.05, r), 0.12 + i * 0.09, Math.sin(a) * Math.max(0.05, r)]}>
              <sphereGeometry args={[0.06, 5, 5]} />
              <meshBasicMaterial color={color} transparent opacity={0.9} toneMapped={false} />
            </mesh>
          );
        });
      case 'oil':
        // 火油 — 低伏黑油濺射 + 火苗
        return (
          <>
            {Array.from({ length: n(10) }).map((_, i) => {
              const a = (i / 10) * Math.PI * 2;
              const r = 0.3 + (i % 3) * 0.14;
              return (
                <mesh key={`o${i}`} position={[Math.cos(a) * r, 0.06, Math.sin(a) * r]}>
                  <sphereGeometry args={[0.1, 6, 6]} />
                  <meshBasicMaterial color={color} transparent opacity={0.9} />
                </mesh>
              );
            })}
            {Array.from({ length: 5 }).map((_, i) => {
              const a = (i / 5) * Math.PI * 2;
              return (
                <mesh key={`f${i}`} position={[Math.cos(a) * 0.25, 0.22, Math.sin(a) * 0.25]}>
                  <coneGeometry args={[0.06, 0.2, 5]} />
                  <meshBasicMaterial color="#ff7e26" transparent opacity={0.9} toneMapped={false} />
                </mesh>
              );
            })}
          </>
        );
      case 'curse':
        // 詛咒 — 環繞的暗紫符印 + 中央邪光
        return (
          <>
            {Array.from({ length: n(6) }).map((_, i) => {
              const a = (i / n(6)) * Math.PI * 2;
              return (
                <mesh key={i} position={[Math.cos(a) * 0.5, 0.5, Math.sin(a) * 0.5]} rotation={[0, -a, 0]}>
                  <torusGeometry args={[0.1, 0.02, 4, 8]} />
                  <meshBasicMaterial color={color} transparent opacity={0.95} toneMapped={false} />
                </mesh>
              );
            })}
            <mesh position={[0, 0.5, 0]}>
              <sphereGeometry args={[0.13, 10, 10]} />
              <meshBasicMaterial color={color} transparent opacity={0.5} toneMapped={false} />
            </mesh>
          </>
        );
    }
  })();

  return (
    <group ref={groupRef} position={[x, 0, z]}>
      <group scale={scale}>{visuals}</group>
    </group>
  );
}

/* ─── Formation visualizer — colored ring on the ground + zh label ──
 *  Coloring by "category" (defensive/offensive/mobile/mystic) gives a quick
 *  visual cue without needing 23 distinct shapes. */
