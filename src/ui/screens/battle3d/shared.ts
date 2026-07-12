/* battle3d/shared — the two symbols every battle-3D module leans on: the
 * embedded-diorama context (map/city previews render the battle scene inside
 * another canvas) and the mobile degrade flag. Leaf — import freely. */
import { createContext } from 'react';

/** True when the battle scene is being rendered as an embedded diorama. */
export const EmbeddedSceneCtx = createContext(false);

/** Coarse-pointer / small-screen device — drop pixel ratio and skip the
 *  post-processing pass so phones keep a playable framerate. */
export const IS_MOBILE = typeof window !== 'undefined'
  && (window.matchMedia?.('(pointer: coarse)')?.matches || window.innerWidth < 700);
