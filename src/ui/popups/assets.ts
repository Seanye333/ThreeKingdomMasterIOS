/**
 * 慶典彈窗素材約定 — each PopupEvent.key maps to a file under public/popups/:
 *   image →  public/popups/<key>.jpg  (preferred for the painterly key-art),
 *            or  <key>.png            (tried as a fallback)
 *   video →  public/popups/<key>.mp4
 *
 * Compress big exports first (macOS, no extra tools):
 *   sips -s format jpeg -s formatOptions 82 --resampleWidth 1400 in.png --out <key>.jpg
 *
 * Drop a generated file in with the matching name and it shows automatically;
 * if the file is missing the popup falls back to a styled card (see
 * CelebrationPopup), so nothing breaks before the art exists.
 *
 * Known keys currently emitted by the game (add art for any of these):
 *   capital-set            遷都之喜
 *   city-upgrade-town      升「鎮」
 *   city-upgrade-city      升「城」
 *   city-upgrade-large     升「大城」
 *   city-upgrade-capital   升「都」
 *   building-complete      大興土木(城內建築竣工)
 *   officer-recruited      訪賢得士(招攬/勸降來投)
 *   wall-citadel           堅城落成(城壁強化至 3 級)
 */
export const KNOWN_POPUP_KEYS = [
  'capital-set',
  'city-upgrade-town',
  'city-upgrade-city',
  'city-upgrade-large',
  'city-upgrade-capital',
  'building-complete',
  'officer-recruited',
  'wall-citadel',
] as const;

/** Candidate image URLs for a key, tried in order (jpg first — best for the
 *  painterly key-art; png second). The popup falls back to a card if none load. */
export function popupImageCandidates(key: string): string[] {
  return [`/popups/${key}.jpg`, `/popups/${key}.png`];
}

export function popupVideoUrl(key: string): string {
  return `/popups/${key}.mp4`;
}
