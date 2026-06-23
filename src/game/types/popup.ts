/**
 * 慶典彈窗 — a celebratory image/video popup fired when something notable
 * completes (a city grows a tier, the capital moves, a great work is raised…).
 *
 * The art is OPTIONAL and supplied later: by convention each `key` maps to
 * `public/popups/<key>.png` (image) and `public/popups/<key>.mp4` (video).
 * When the file is absent the popup still shows as a styled fallback card, so
 * the system works before any asset exists and lights up as art is dropped in.
 */
export interface PopupEvent {
  /** Asset key → /popups/<key>.png|.mp4 (and the default copy in the registry). */
  key: string;
  /** Which medium to attempt first; falls back to the card if the file 404s. */
  media: 'image' | 'video';
  titleZh: string;
  titleEn: string;
  /** Optional one-line subtitle (e.g. the city name / the new tier). */
  captionZh?: string;
  captionEn?: string;
}
