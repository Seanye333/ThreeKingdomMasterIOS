import { useCallback, useEffect, useRef } from 'react';

/**
 * Focus containment for a dialog — move focus in on open, keep Tab inside, and
 * hand it back to whatever opened it on close.
 *
 * This was living inside the shared `<Modal>`, which meant the two panels that
 * predate `<Modal>` and hand-roll their own backdrop — 武將 (`OfficersTab`) and
 * 群雄 (`ForcesOverview`) — had none of it: Tab walked straight out of the
 * dialog into the map behind, and closing the panel dropped focus on <body>.
 *
 * Extracted rather than converting those panels to `<Modal>`: they carry their
 * own two-line header and their own CSS module, so wrapping them would mean a
 * visual rewrite to fix a keyboard bug. `<Modal>` uses this hook too, so there
 * is still one implementation.
 *
 * Returns the ref to put on the dialog frame and the keydown handler that traps
 * Tab. The frame needs `tabIndex={-1}` so it can hold focus itself when the
 * dialog has no focusable children yet.
 */
const FOCUSABLE_SEL =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function useDialogFocus<T extends HTMLElement = HTMLDivElement>() {
  const frameRef = useRef<T>(null);

  useEffect(() => {
    const restoreTo = (typeof document !== 'undefined' ? document.activeElement : null) as HTMLElement | null;
    const frame = frameRef.current;
    // Don't steal focus from a child that asked for it with autoFocus.
    if (frame && !frame.contains(document.activeElement)) frame.focus();
    return () => {
      if (restoreTo && typeof restoreTo.focus === 'function' && document.contains(restoreTo)) {
        restoreTo.focus();
      }
    };
  }, []);

  const onKeyDown = useCallback((e: React.KeyboardEvent<T>) => {
    if (e.key !== 'Tab') return;
    const frame = frameRef.current;
    if (!frame) return;
    // `offsetParent === null` filters out anything hidden by a collapsed
    // section; the activeElement exception keeps a focused-but-offscreen
    // control (a scrolled-out list row) from being dropped mid-cycle.
    const items = Array.from(frame.querySelectorAll<HTMLElement>(FOCUSABLE_SEL))
      .filter((el) => el.offsetParent !== null || el === document.activeElement);
    if (items.length === 0) { e.preventDefault(); frame.focus(); return; }
    const first = items[0], last = items[items.length - 1];
    const active = document.activeElement;
    if (e.shiftKey && (active === first || active === frame)) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && active === last) { e.preventDefault(); first.focus(); }
  }, []);

  return { frameRef, onKeyDown };
}
