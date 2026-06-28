/**
 * 戰役回放 — campaign timelapse history (SESSION-ONLY).
 *
 * A tiny standalone zustand store that records one territory-ownership
 * snapshot per in-game season as the campaign plays. It is deliberately NOT
 * part of the persisted game save: the history lives only for the current
 * session and is wiped on reload, so it costs nothing in save size or
 * save-format compatibility. The replay panel reads from it to fast-forward
 * the rise and fall of every realm across the campaign so far.
 */
import { create } from 'zustand';

export interface TerritorySnapshot {
  /** Display label for this point in time, e.g. "190 春上". */
  label: string;
  /** cityId → owning forceId at that moment (null = neutral / unheld). */
  owners: Record<string, string | null>;
}

interface ReplayState {
  snapshots: TerritorySnapshot[];
  /** forceId → hex colour, accumulated across snapshots so a force that has
   *  since been destroyed still paints in its true banner colour on replay. */
  colors: Record<string, string>;
  record: (snap: TerritorySnapshot, colors: Record<string, string>) => void;
  clear: () => void;
}

// A full long campaign is ~hundreds of seasons; cap the ring buffer so memory
// stays bounded even on marathon sessions (oldest snapshots roll off).
const CAP = 400;

export const useReplayStore = create<ReplayState>((set) => ({
  snapshots: [],
  colors: {},
  record: (snap, colors) =>
    set((s) => {
      const last = s.snapshots[s.snapshots.length - 1];
      // Same season re-recorded (e.g. a re-render before the date advanced) —
      // replace in place rather than stacking a duplicate frame.
      if (last && last.label === snap.label) {
        return {
          snapshots: [...s.snapshots.slice(0, -1), snap],
          colors: { ...s.colors, ...colors },
        };
      }
      const next = [...s.snapshots, snap];
      if (next.length > CAP) next.splice(0, next.length - CAP);
      return { snapshots: next, colors: { ...s.colors, ...colors } };
    }),
  clear: () => set({ snapshots: [], colors: {} }),
}));
