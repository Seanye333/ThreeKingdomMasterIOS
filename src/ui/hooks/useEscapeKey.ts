import { useEffect } from 'react';

/**
 * Close-on-Escape for hand-rolled modals/windows. The shared <Modal> wrapper
 * already does this; this hook gives the same courtesy to components that roll
 * their own `position:fixed` backdrop without adopting the wrapper.
 *
 * Listens on `keydown` while `enabled` (default true) and fires `onEscape` for
 * the Escape key. Cleans up on unmount / dependency change.
 */
export function useEscapeKey(onEscape: () => void, enabled = true): void {
  useEffect(() => {
    if (!enabled) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onEscape();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onEscape, enabled]);
}
