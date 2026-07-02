import { useEffect } from 'react';

/**
 * Close-on-Escape for modals/windows — STACKED: with several layers open
 * (e.g. a detail window over a roster over the map), Escape closes only the
 * TOPMOST layer (the most recently mounted listener), not every layer at
 * once. The shared <Modal> wrapper and hand-rolled backdrops both register
 * here, so the whole UI peels one layer per press.
 */
type EscHandler = () => void;
const escStack: EscHandler[] = [];
let bound = false;
function ensureBound() {
  if (bound || typeof window === 'undefined') return;
  bound = true;
  window.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key !== 'Escape' || escStack.length === 0) return;
    escStack[escStack.length - 1]();
  });
}

/** Register a handler on the escape stack for the lifetime of the caller. */
export function useEscapeKey(onEscape: () => void, enabled = true): void {
  useEffect(() => {
    if (!enabled) return;
    ensureBound();
    escStack.push(onEscape);
    return () => {
      const i = escStack.lastIndexOf(onEscape);
      if (i >= 0) escStack.splice(i, 1);
    };
  }, [onEscape, enabled]);
}
