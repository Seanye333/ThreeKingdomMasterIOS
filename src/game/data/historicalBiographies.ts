/**
 * 歷代名將 列傳 — concise historically-grounded biographies for the most
 * iconic historical officers across all 14 dynasties.
 *
 * Spread into the main BIOGRAPHIES map so OfficerDetail picks them up
 * automatically via `getBiography(officer.id)`.
 *
 * Target: ~150 priority figures. Less prominent officers fall back to the
 * stat-derived procedural bio in `biographies.ts`.
 */
import type { OfficerBiography } from './biographies';
import { HIST_BIOS_1 } from './historicalBios/part1';
import { HIST_BIOS_2 } from './historicalBios/part2';
import { HIST_BIOS_3 } from './historicalBios/part3';
import { HIST_BIOS_4 } from './historicalBios/part4';
import { HIST_BIOS_5 } from './historicalBios/part5';

/**
 * 列傳合併 — the five parts are pure data split only for file size; this file
 * stays the single entry point, so every importer is unchanged.
 *
 * ⚠ A duplicate id across parts would be SILENTLY swallowed by the spread,
 * leaving one biography unreachable — the same shape as the 2026-07 items.ts
 * bug where two different items shared an id and ITEMS_BY_ID kept only the
 * last. historicalBios.test.ts asserts the parts stay disjoint.
 */
export const HISTORICAL_BIOGRAPHIES: Record<string, OfficerBiography> = {
  ...HIST_BIOS_1,
  ...HIST_BIOS_2,
  ...HIST_BIOS_3,
  ...HIST_BIOS_4,
  ...HIST_BIOS_5,
};

// 歷代名將金句補遺 (2026-07) —— 跨界名冊的歷史名人配史實名言。與三國列傳
// 金句(biographies.ts SUPPLEMENTAL_QUOTES)對稱:集中補充表 + 合併迴圈,
// 只補「已有列傳且尚無金句」者,不命中(無此 bio)或已有 quote 者自動跳過。
const SUPPLEMENTAL_HIST_QUOTES: Record<string, { zh: string; en: string }> = {
  'hist-xiang-yu':      { zh: '力拔山兮氣蓋世,時不利兮騅不逝。', en: 'My strength could uproot mountains, my spirit overshadow the age — yet the times fail me, and my steed will not run.' },
  'hist-han-xin':       { zh: '狡兔死,走狗烹;飛鳥盡,良弓藏。', en: 'When the cunning hares are dead, the hounds are cooked; when the birds are gone, the good bow is put away.' },
  'hist-yue-fei':       { zh: '三十功名塵與土,八千里路雲和月 —— 莫等閒,白了少年頭,空悲切。', en: 'Thirty years of honour, dust and earth; eight thousand li of road, cloud and moon. Idle not — lest the young head whiten, and the grief be for nothing.' },
  'hist-li-bai':        { zh: '天生我材必有用,千金散盡還復來。', en: 'Heaven made my talents — they must have their use. Scatter a thousand in gold, and it comes again.' },
  'hist-du-fu':         { zh: '安得廣廈千萬間,大庇天下寒士俱歡顏。', en: 'Where might I find ten thousand rooms of mansion, to shelter all the world\'s cold scholars and see them smile?' },
  'hist-wen-tianxiang': { zh: '人生自古誰無死,留取丹心照汗青。', en: 'Since ancient times, what man has not died? Let me leave a loyal heart to shine in the annals.' },
  'hist-huo-qubing':    { zh: '匈奴未滅,何以家為!', en: 'The Xiongnu are not yet destroyed — what use have I for a home?' },
  'hist-jing-ke':       { zh: '風蕭蕭兮易水寒,壯士一去兮不復還。', en: 'The wind cries bleak, the Yi River cold; once the brave man departs, he returns no more.' },
  'hist-goujian':       { zh: '苦心人天不負,臥薪嘗膽,三千越甲可吞吳。', en: 'Heaven fails not the resolute: sleeping on brushwood, tasting gall — three thousand men of Yue can swallow Wu.' },
  'hist-yu-qian':       { zh: '粉骨碎身渾不怕,要留清白在人間。', en: 'Ground to powder, shattered bone — I fear it not; only to leave my purity in the world of men.' },
  'hist-fan-zhongyan':  { zh: '先天下之憂而憂,後天下之樂而樂。', en: 'Be first in the realm to worry its worries, and last to taste its joys.' },
  'hist-su-shi':        { zh: '大江東去,浪淘盡,千古風流人物。', en: 'The great river flows east, its waves scouring away the gallant men of a thousand ages.' },
  'hist-chen-sheng':    { zh: '王侯將相,寧有種乎!', en: 'Kings and nobles, generals and ministers — are they born to it?' },
  'hist-liu-bang':      { zh: '大風起兮雲飛揚,威加海內兮歸故鄉。', en: 'A great wind rises, the clouds fly scattered; my might now spans the realm, and I return to my home village.' },
  'hist-ban-chao':      { zh: '不入虎穴,焉得虎子。', en: "Enter not the tiger's den, and how will you seize the tiger's cubs?" },
  'hist-sun-wu':        { zh: '兵者,詭道也 —— 兵無常勢,水無常形。', en: 'War is the way of deception — an army has no constant force, as water has no constant shape.' },
  'hist-shang-yang':    { zh: '治世不一道,便國不法古。', en: 'To govern an age there is no single way; to benefit the state, one need not follow antiquity.' },
  'hist-wang-anshi':    { zh: '不畏浮雲遮望眼,只緣身在最高層。', en: 'I fear no drifting cloud to blind my sight — for I stand upon the highest tier.' },
  'hist-xin-qiji':      { zh: '醉裡挑燈看劍,夢回吹角連營。', en: 'Drunk, I trim the lamp and study my sword; in dream I return to the horns sounding across the linked camps.' },
  'hist-tang-taizong':  { zh: '以銅為鏡,可以正衣冠;以人為鏡,可以明得失。', en: "With bronze as a mirror one straightens one's robes; with men as a mirror one sees one's gains and failings." },
  'hist-qin-shihuang':  { zh: '朕為始皇帝,後世以計數,二世三世至於萬世,傳之無窮。', en: 'I am the First Emperor; those after shall be counted Second, Third, unto ten thousand generations, passed on without end.' },
  'hist-han-wudi':      { zh: '寇可往,我亦可往!', en: 'Where the raiders can go, there too can I!' },
  'hist-liu-xiu':       { zh: '仕宦當作執金吾,娶妻當得陰麗華。', en: 'For office, be the Bearer of the Golden Mace; for a wife, win Yin Lihua.' },
  'hist-zu-ti':         { zh: '祖逖不能清中原而復濟者,有如大江!', en: 'If Zu Ti cannot sweep the Central Plains clean and cross back again — let me be as this great river! (striking his oar midstream)' },
  'hist-zheng-chenggong':{ zh: '開闢荊榛逐荷夷,十年始克復先基。', en: "Clearing the thornlands, driving out the Dutch — ten years to reclaim at last my forebears' ground." },
  'hist-lin-zexu':      { zh: '苟利國家生死以,豈因禍福避趨之。', en: 'If it profits the state, I will meet life or death for it — how could I shrink or grasp for my own fortune?' },
  'hist-qi-jiguang':    { zh: '封侯非我意,但願海波平。', en: 'To be made a marquis is not my wish — I ask only that the sea-waves be stilled.' },
  'hist-hua-mulan':     { zh: '萬里赴戎機,關山度若飛 —— 將軍百戰死,壯士十年歸。', en: 'Ten thousand li she rode to the war, over passes and peaks as if in flight — generals die in a hundred battles, the brave return after ten years.' },
  'hist-zuo-zongtang':  { zh: '身無半畝,心憂天下;讀破萬卷,神交古人。', en: 'Not half an acre to my name, yet my heart grieves for the realm; ten thousand books read through, my spirit communes with the ancients.' },
  'hist-yue-yi':        { zh: '古之君子,交絕不出惡聲;忠臣去國,不潔其名。', en: 'The gentlemen of old, when a friendship ended, spoke no ill; the loyal minister who leaves his state does not clear his own name at its cost.' },
  // 歷代二線名將金句補·三 (2026-07)
  'hist-lian-po':      { zh: '我為趙將,有攻城野戰之大功;而藺相如徒以口舌為勞,位居我上。', en: 'I am a general of Zhao, with the great merit of storming cities and open battle; yet Lin Xiangru, whose toil was but words, is set above me.' },
  'hist-lin-xiangru':  { zh: '先國家之急,而後私讎也。', en: "I put the state's urgent needs first, and private quarrels after." },
  'hist-wu-qi':        { zh: '在德不在險——若君不修德,舟中之人盡為敵國也。', en: 'It lies in virtue, not in ramparts — if a ruler cultivates no virtue, the very men in his own boat become his enemies.' },
  'hist-wu-zixu':      { zh: '抉吾眼懸吳東門之上,以觀越寇之入滅吳!', en: 'Pluck out my eyes and hang them over the eastern gate of Wu, that I may watch the Yue invaders enter and destroy it!' },
  'hist-guan-zhong':   { zh: '倉廩實而知禮節,衣食足而知榮辱。', en: 'When the granaries are full, men know propriety; when food and clothing suffice, they know honour and shame.' },
  'hist-cao-gui':      { zh: '肉食者鄙,未能遠謀——夫戰,勇氣也,一鼓作氣。', en: 'The meat-eaters are shortsighted, unfit for far counsel — as for battle, it is a matter of spirit: the first drum rouses courage.' },
  'hist-li-mu':        { zh: '將在外,君令有所不受——匈奴小入,佯北不勝,而後大破之。', en: 'A general in the field need not obey every royal order — when the Xiongnu made small raids, I feigned defeat, then broke them utterly.' },
  'hist-wang-jian':    { zh: '為大王將,有功終不得封侯,故及時請園池為子孫業耳。', en: "As Your Majesty's general, merit will never win me a marquisate — so I ask in good time for gardens and ponds, as a legacy for my sons." },
  'hist-xie-an':       { zh: '小兒輩遂已破賊。', en: 'The young ones have gone and broken the foe. (said, unmoved over his chessboard)' },
  'hist-chen-qingzhi': { zh: '名師大將莫自牢,千兵萬馬避白袍。', en: 'Let famed hosts and great generals not think themselves secure — a thousand troops, ten thousand horse, all give way before the White Robe.' },
  'hist-wang-meng':    { zh: '捫蝨而談天下大勢,旁若無人。', en: 'Picking lice from his robe, he discoursed on the fate of the realm as though no one else were there.' },
  'hist-huan-wen':     { zh: '既不能流芳後世,不足復遺臭萬載邪!', en: 'If a man cannot leave his fragrance to later ages, is it not enough at least to leave a stench for ten thousand years?' },
  'hist-liu-kun':      { zh: '枕戈待旦,志梟逆虜,常恐祖生先吾著鞭。', en: 'I sleep on my spear awaiting dawn, bent on beheading the rebels — ever fearing that Zu Ti will crack the whip before me.' },
  'hist-tian-ji':      { zh: '以君下駟對彼上駟,取君上駟對彼中駟——一敗而再勝。', en: 'Match your worst horse against his best, then your best against his second — one loss, and two wins.' },
  'hist-zhao-she':     { zh: '其道遠險狹,譬猶兩鼠鬥於穴中,將勇者勝。', en: 'The road is far, steep and narrow — it is like two rats fighting in a hole: the braver general wins.' },
  'hist-pang-juan':    { zh: '遂成豎子之名!', en: "So I have made that wretch's name! (at Maling, reading the tree)" },
  'hist-xie-xuan':     { zh: '請君少卻,令晉兵得渡,以決勝負。', en: 'Draw back a little, I pray, and let the Jin troops cross — that the matter may be decided. (at the Fei River)' },
  'hist-fan-li':       { zh: '飛鳥盡,良弓藏;狡兔死,走狗烹。越王長頸鳥喙,可與共患難,不可與共樂。', en: 'When the birds are gone, the good bow is stored; when the hare is dead, the hound is cooked. The King of Yue, long-necked and hawk-beaked, one may share hardship with, but not ease.' },
};
for (const [id, q] of Object.entries(SUPPLEMENTAL_HIST_QUOTES)) {
  const bio = HISTORICAL_BIOGRAPHIES[id];
  if (bio && !bio.quote) bio.quote = q;
}
