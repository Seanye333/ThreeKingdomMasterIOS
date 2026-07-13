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
 *   disaster-locust ✅        蝗災(engine 以 famine 出;與 drought 按年輪替出圖)
 *   disaster-quake ✅         地動(§8.2 地震,山城多發)
 *   specialty-discovered ✅   特產名物開發(名產作坊臻極盛)
 *   forge-masterpiece ✅      名器鑄成(神兵/gold 級;另 ForgingModal 內也有 ForgedReveal)
 *   — 第二章 武將/成長/家族 —
 *   breakthrough-rebirth ✅   轉生突破(化境/通神)
 *   grade-promotion ✅        晉牌封賞(晉升金牌+品階)
 *   heir-coming-of-age ✅     子嗣及冠出仕
 *   heir-born ✅              子嗣誕生(本家添丁)
 *   wedding ✅                府內結親/婚禮
 *   officer-death ✅          名將辭世/國葬
 *   peerage-granted ✅        封爵
 *   honorific-granted ✅      拜名號將軍
 *   — 第三章 人才/招攬/舌戰 —
 *   officer-recruited ✅      訪賢得士(招攬/勸降來投)
 *   appraisal-verdict ✅      月旦評/名士品評
 *   persuasion-defection ✅   說客勸降成功(applyScenarioEffects recruit 來投)
 *   — 第四章 軍事指揮/委任 —
 *   grand-muster ✅          全軍集結
 *   army-march ✅            大軍出征(手動 issueMarch ≥5000 兵;集結令走 quiet 不重彈)
 *   governor-appointed ✅     委任太守(受印)
 *   province-governor ✅      州牧晉升
 *   evaluation-results ✅     考課殿最榜
 *   advisor-scheme ✅        軍師獻策(executeScheme 謀略獻策得售)
 *   — 第六章 單挑 —
 *   duel-slay-champion ✅     陣斬名將(slayOfficerInDuel 玩家方斬殺敵將)
 *   duel-rival-callout ✅     宿敵結成(recordRivalry 交手≥3 結宿敵)
 *   duel-hall-legend ✅       名局入館(recordBout 長局/舌戰入武鬥館)
 *   — 第七章 外交・謀略・天子 —
 *   founding-ceremony ✅      建國大典(holdFoundingCeremony 定國號稱制)
 *   welcome-emperor ✅        奉迎天子(welcomeEmperor 迎鑾入都)
 *   throne-abdication ✅      即位踐祚·受禪(issueEdict enthronement)
 *   imperial-honors ✅        加九錫·封禪(issueEdict nine-bestowments / feng-shan)
 *   alliance-sealed ✅        會盟結盟(proposeAlliance 締盟)
 *   vassal-submits ✅         稱臣納貢(demandVassalage 招撫俯首)
 *   marriage-alliance ✅      秦晉之好(proposeMarriage 聯姻同盟)
 *   foreign-embassy ✅        遠使異域(dispatchEmbassy 絲路使團)
 *   righteous-banner ✅       清君側·勤王(raiseRighteousBanner 興義師)
 *   espionage-success ✅      諜報得手(resolution 玩家細作成功;每季≤1)
 *   — 第八章 事件・天命・異族・宗教 —
 *   tribe-submits ✅          異族內附(subjugateTribe 征服異族來附)
 *   tribe-raid ✅            異族入寇(inciteTribeRaid 以夷制夷嗾虜)
 *   pacify-rebels ✅          招安民變(pacifyCultForce 招安黃巾/邪教)
 *   heaven-omen ⏳           天命祥瑞(rollOmen;打隨機勢力,player gating 未定)
 *   religious-revolt ⏳       宗教民變(rollReligiousRebellion;季結算,觸發暫缺)
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
  'disaster-quake',
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
  // 第六章 — 單挑
  'duel-slay-champion',
  'duel-rival-callout',
  'duel-hall-legend',
  // 第七章 — 外交・謀略・天子
  'founding-ceremony',
  'welcome-emperor',
  'throne-abdication',
  'imperial-honors',
  'alliance-sealed',
  'vassal-submits',
  'marriage-alliance',
  'foreign-embassy',
  'righteous-banner',
  'espionage-success',
  // 第八章 — 事件・天命・異族・宗教
  'tribe-submits',
  'tribe-raid',
  'pacify-rebels',
  'heaven-omen',
  'religious-revolt',
] as const;

/** Candidate image URLs for a key, tried in order (jpg first — best for the
 *  painterly key-art; png second). The popup falls back to a card if none load. */
export function popupImageCandidates(key: string): string[] {
  return [`/popups/${key}.jpg`, `/popups/${key}.png`];
}

export function popupVideoUrl(key: string): string {
  return `/popups/${key}.mp4`;
}
