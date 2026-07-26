import * as THREE from 'three';
import { tileNormal, brickNormal, woodNormal, clothNormal, earthNormal, tiled } from './textures/proceduralMaps';

/**
 * 材質譜 — one table of PBR surface parameters, so the same substance reads
 * the same way in all three scenes.
 *
 * The scenes carry ~584 `meshStandardMaterial` instances, nearly all of them
 * a colour plus hand-tuned `roughness`/`metalness` written at the moment that
 * mesh was authored. The numbers drifted: lacquered roof tile is 0.62/0.16 in
 * the city and 0.5/0 on the battlefield, timber ranges 0.55–0.9, and bronze
 * is frequently left at the default 1.0/0.0 — which is to say, not metal at
 * all.
 *
 * With an environment map now bound (see SkyEnvironment) these numbers
 * finally matter: `metalness` decides whether a surface reflects the sky, and
 * `roughness` decides how sharply. This table is the reference for what each
 * substance should be.
 *
 * ## Applying it
 *
 * Deliberately NOT swept across all 584 sites in one go. Material values are
 * judged by eye, and a headless SwiftShader run cannot render the city scene
 * at all — so a blind bulk edit would be unverifiable by construction. Adopt
 * it where the substance is unambiguous (roof tile, bronze, water, cloth),
 * look at the result on real hardware, then widen.
 *
 * Usage:
 *   <meshStandardMaterial color={c} {...SURFACE.tile} />
 */

export interface Surface {
  roughness: number;
  metalness: number;
  /** Per-surface scaling of the scene environment. 1 = full sky reflection. */
  envMapIntensity?: number;
}

export const SURFACE = {
  /** 琉璃瓦 — glazed roof tile: smooth, faintly metallic, catches the sky. */
  tile:     { roughness: 0.42, metalness: 0.18, envMapIntensity: 1.1 },
  /** 夯土/磚 — rammed earth and brick: matte, no reflection to speak of. */
  masonry:  { roughness: 0.92, metalness: 0.0,  envMapIntensity: 0.5 },
  /** 木構 — beams, posts, carts. Slight sheen where it is planed. */
  timber:   { roughness: 0.78, metalness: 0.0,  envMapIntensity: 0.6 },
  /** 布帛 — banners, tents, robes: fully diffuse. */
  cloth:    { roughness: 0.95, metalness: 0.0,  envMapIntensity: 0.4 },
  /** 青銅 — blades, helmets, fittings. Real metal: this is what IBL is for. */
  bronze:   { roughness: 0.34, metalness: 0.85, envMapIntensity: 1.3 },
  /** 鐵 — darker, rougher war metal. */
  iron:     { roughness: 0.46, metalness: 0.78, envMapIntensity: 1.15 },
  /** 皮革 — armour straps, saddles. */
  leather:  { roughness: 0.72, metalness: 0.05, envMapIntensity: 0.55 },
  /** 石 — walls, bridges, monuments. */
  stone:    { roughness: 0.88, metalness: 0.0,  envMapIntensity: 0.55 },
  /** 土地 — bare ground, fields, roads. */
  earth:    { roughness: 0.97, metalness: 0.0,  envMapIntensity: 0.45 },
  /** 水 — rivers, moats, paddies (the sea has its own reflector material). */
  water:    { roughness: 0.14, metalness: 0.28, envMapIntensity: 1.4 },
  /** 草木 — foliage: matte, and it should not pick up sky highlights. */
  foliage:  { roughness: 0.86, metalness: 0.0,  envMapIntensity: 0.5 },
} as const satisfies Record<string, Surface>;

export type SurfaceKind = keyof typeof SURFACE;

/* ─── 表面起伏 — optional procedural relief ─────────────────────────── */

/** Which generated normal map (if any) suits each surface. */
const RELIEF: Partial<Record<SurfaceKind, () => THREE.DataTexture>> = {
  tile: tileNormal,
  masonry: brickNormal,
  stone: brickNormal,
  timber: woodNormal,
  cloth: clothNormal,
  earth: earthNormal,
};

/**
 * 起伏強度 — one dial for the whole game.
 *
 * Relief tuned on a photo-scanned surface looks like crumpled foil on a
 * 200-triangle roof, so this starts low. Drop it to 0 to turn every
 * procedural normal map off at once without touching a call site.
 */
export const RELIEF_STRENGTH = 0.35;

type ReliefProps = Surface & { normalMap?: THREE.Texture; normalScale?: THREE.Vector2 };
// Whole-props cache: surfaceRelief is called from render, so it must not
// allocate a Vector2 (or anything else) per frame.
const reliefCache = new Map<string, ReliefProps>();

/**
 * Material props for a surface, with procedural relief where one applies.
 *
 * `repeat` is how many times the pattern tiles across the mesh's UV — a city
 * wall wants a dozen brick courses, a single roof slab wants two or three.
 *
 * Usage:  <meshStandardMaterial color={c} {...surfaceRelief('masonry', 6)} />
 */
export function surfaceRelief(kind: SurfaceKind, repeat = 2): ReliefProps {
  const base = SURFACE[kind];
  const make = RELIEF[kind];
  if (!make || RELIEF_STRENGTH <= 0) return base;
  const key = `${kind}:${repeat}`;
  let props = reliefCache.get(key);
  if (!props) {
    props = {
      ...base,
      normalMap: tiled(make(), repeat),
      normalScale: new THREE.Vector2(RELIEF_STRENGTH, RELIEF_STRENGTH),
    };
    reliefCache.set(key, props);
  }
  return props;
}
