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
 * Known keys (✅ = a 觸發 already fires it; ⏳ = key reserved, art welcome but the
 * trigger is deferred — see public/popups/README.md for the full table):
 *   — 第一章 城市/內政/經濟 —
 *   capital-set ✅            遷都之喜
 *   city-upgrade-town ✅      升「鎮」
 *   city-upgrade-city ✅      升「城」
 *   city-upgrade-large ✅     升「大城」
 *   city-upgrade-capital ✅   升「都」
 *   building-complete ✅      大興土木(城內建築竣工)
 *   wall-citadel ✅           堅城落成(城壁強化至 3 級)
 *   disaster-drought ✅       旱/蝗之災(engine: famine)
 *   disaster-flood ✅         水患
 *   disaster-plague ✅        瘟疫
 *   disaster-locust ⏳        蝗災(備用美術;engine 以 famine 出,可作 drought 的替圖)
 *   specialty-discovered ⏳   特產名物開發
 *   forge-masterpiece ⏳      名器鑄成(ForgingModal 已有 ForgedReveal)
 *   — 第二章 武將/成長/家族 —
 *   breakthrough-rebirth ✅   轉生突破(化境/通神)
 *   grade-promotion ✅        晉牌封賞(晉升金牌+品階)
 *   heir-coming-of-age ✅     子嗣及冠出仕
 *   heir-born ⏳              子嗣誕生
 *   wedding ✅                府內結親/婚禮
 *   officer-death ✅          名將辭世/國葬
 *   peerage-granted ✅        封爵
 *   honorific-granted ✅      拜名號將軍
 *   — 第三章 人才/招攬/舌戰 —
 *   officer-recruited ✅      訪賢得士(招攬/勸降來投)
 *   appraisal-verdict ✅      月旦評/名士品評
 *   persuasion-defection ⏳   說客勸降成功(與 officer-recruited 略重疊)
 *   — 第四章 軍事指揮/委任 —
 *   grand-muster ✅          全軍集結
 *   army-march ⏳            出征/大軍行軍(移動為逐格,無單一事件)
 *   governor-appointed ✅     委任太守(受印)
 *   province-governor ✅      州牧晉升
 *   evaluation-results ✅     考課殿最榜
 *   advisor-scheme ⏳        軍師獻策(被動乘子,無離散事件)
 */
export const KNOWN_POPUP_KEYS = [
  // 第一章 — 城市/內政/經濟
  'capital-set',
  'city-upgrade-town',
  'city-upgrade-city',
  'city-upgrade-large',
  'city-upgrade-capital',
  'building-complete',
  'wall-citadel',
  'disaster-drought',
  'disaster-flood',
  'disaster-plague',
  'disaster-locust',
  'specialty-discovered',
  'forge-masterpiece',
  // 第二章 — 武將/成長/家族
  'breakthrough-rebirth',
  'grade-promotion',
  'heir-coming-of-age',
  'heir-born',
  'wedding',
  'officer-death',
  'peerage-granted',
  'honorific-granted',
  // 第三章 — 人才/招攬/舌戰
  'officer-recruited',
  'appraisal-verdict',
  'persuasion-defection',
  // 第四章 — 軍事指揮/委任
  'grand-muster',
  'army-march',
  'governor-appointed',
  'province-governor',
  'evaluation-results',
  'advisor-scheme',
] as const;

/** Candidate image URLs for a key, tried in order (jpg first — best for the
 *  painterly key-art; png second). The popup falls back to a card if none load. */
export function popupImageCandidates(key: string): string[] {
  return [`/popups/${key}.jpg`, `/popups/${key}.png`];
}

export function popupVideoUrl(key: string): string {
  return `/popups/${key}.mp4`;
}
