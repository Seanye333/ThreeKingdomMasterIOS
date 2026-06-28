/**
 * 地圖聚焦匯流排 — lets HUD controls that live OUTSIDE the 3D Canvas (e.g. the
 * idle-officer button in MapScreen) ask the strategic map to fly its camera to
 * a city, without threading a ref/prop through the screen. StrategicMap3D
 * registers the handler when it mounts; callers fire requestMapFocus(cityId).
 * A plain module singleton — there is only ever one strategic map on screen.
 */
type FocusHandler = (cityId: string) => void;

let handler: FocusHandler | null = null;

export function setMapFocusHandler(fn: FocusHandler | null): void {
  handler = fn;
}

export function requestMapFocus(cityId: string): void {
  handler?.(cityId);
}
