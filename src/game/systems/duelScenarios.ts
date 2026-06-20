/**
 * 劇情單挑 — scripted one-on-one encounters drawn from the romance: 溫酒斬華雄,
 * 三英戰呂布, 斬顏良誅文醜, 葭萌關挑燈夜戰… Each names a famous opponent, sets
 * the stage, and maps the bout's outcome to concrete effects (gold, renown, the
 * occasional recruit) the host applies through the shared scenario-effect path.
 * The bout itself runs on the interactive 單挑 engine; this is the framing and
 * the spoils. Effects reuse {@link ScenarioEffect} so the store applies them
 * exactly like the 劇情舌戰 scenarios.
 */
import type { EntityId } from '../types';
import type { ScenarioEffect } from './debateScenarios';

export type DuelScenarioKind = 'famous-duel' | 'champion-challenge' | 'grudge';

export interface DuelScenario {
  id: string;
  kind: DuelScenarioKind;
  titleZh: string;
  titleEn: string;
  introZh: string;
  introEn: string;
  /** The famous warrior you must defeat (an existing roster id). */
  opponentId: EntityId;
  /** Effects on a win (whether on points or by a knockout). */
  winEffects: ScenarioEffect[];
  /** Effects on a loss. */
  loseEffects: ScenarioEffect[];
  /** Extra effects when you don't merely win but cut them down (斬殺). */
  slayEffects?: ScenarioEffect[];
}

const gold = (amount: number, zh: string, en: string): ScenarioEffect => ({ kind: 'gold', amount, textZh: zh, textEn: en });
const note = (zh: string, en: string): ScenarioEffect => ({ kind: 'note', textZh: zh, textEn: en });

export const DUEL_SCENARIOS: DuelScenario[] = [
  {
    id: 'slay-hua-xiong',
    kind: 'famous-duel',
    titleZh: '溫酒斬華雄', titleEn: 'Slay Hua Xiong',
    introZh: '華雄連斬聯軍數將,陣前耀武。溫酒尚熱,可敢出陣取其首級?',
    introEn: 'Hua Xiong has cut down champion after champion before the allied host. The wine is still warm — dare you ride out and take his head?',
    opponentId: 'hua-xiong',
    winEffects: [gold(400, '陣前揚名,聯軍犒賞 400 金。', 'Your name rings through the camp — the alliance rewards 400 gold.')],
    loseEffects: [note('不敵華雄,折戟而歸。', 'Bested by Hua Xiong, you withdraw.')],
    slayEffects: [gold(300, '提華雄首級而還 — 酒尚溫熱!威震諸侯。', 'You return with his head — the wine still warm! The lords are awed.')],
  },
  {
    id: 'three-vs-lubu',
    kind: 'famous-duel',
    titleZh: '三英戰呂布', titleEn: 'Battle Lü Bu',
    introZh: '虎牢關前,呂布橫戟立馬,天下無人敢當。遣一員猛將,與這「人中呂布」決一死戰!',
    introEn: 'At Hulao Pass, Lü Bu sits his horse with halberd levelled — none dare face him. Send your fiercest warrior against the peerless one!',
    opponentId: 'lu-bu',
    winEffects: [gold(600, '力撼呂布,威名動天下!', 'You stand against Lü Bu himself — your fame shakes the realm!')],
    loseEffects: [note('呂布勇不可當,你且戰且退。', 'Lü Bu is unstoppable; you give ground.')],
    slayEffects: [gold(800, '陣斬呂布 — 改寫天下大勢的一戰!', 'You cut down Lü Bu — a duel that rewrites history!')],
  },
  {
    id: 'slay-yan-liang',
    kind: 'famous-duel',
    titleZh: '萬軍斬顏良', titleEn: 'Slay Yan Liang',
    introZh: '顏良立馬於萬軍之中,白馬義從環衛。可敢策馬直入,於萬眾之中取其首級?',
    introEn: 'Yan Liang sits amid a host of ten thousand. Dare you charge straight in and take his head before them all?',
    opponentId: 'yan-liang',
    winEffects: [gold(450, '萬軍叢中斬將奪旗,曹公大喜。', 'You cut him down amid the host — your lord is overjoyed.')],
    loseEffects: [note('白馬義從圍攏,你殺出重圍。', 'The white-horse guards close in; you fight your way clear.')],
    slayEffects: [gold(350, '一刀斬顏良於馬下 — 河北軍奪氣!', 'One stroke fells Yan Liang — Hebei\'s host loses heart!')],
  },
  {
    id: 'jiameng-pass',
    kind: 'grudge',
    titleZh: '葭萌關挑燈夜戰', titleEn: 'Torchlit Duel at Jiameng',
    introZh: '馬超與你麾下猛將鬥得難解難分,自午至夜,挑燈再戰。今夜,定要分出高下!',
    introEn: 'Ma Chao and your champion have fought to a standstill from noon into night — torches lit, the duel resumes. Tonight it ends!',
    opponentId: 'ma-chao',
    winEffects: [gold(400, '挑燈夜戰,力壓錦馬超 — 傳為佳話。', 'In the torchlight you master the Splendid Ma Chao — a tale retold for years.')],
    loseEffects: [note('棋逢敵手,難分軒輊,鳴金各歸。', 'Too evenly matched — the gongs sound and both withdraw.')],
  },
  {
    id: 'shenting-taishici',
    kind: 'grudge',
    titleZh: '神亭嶺鬥太史慈', titleEn: 'Duel Taishi Ci at Shenting',
    introZh: '神亭嶺下,太史慈單騎挑戰,要與你部下大將捉對廝殺,以武會友。',
    introEn: 'At Shenting Ridge, Taishi Ci rides out alone to test your champion blade to blade — a duel between worthy foes.',
    opponentId: 'taishi-ci',
    winEffects: [gold(350, '神亭一戰,英雄相惜,威名遠播。', 'A duel of equals at Shenting — your fame spreads far.')],
    loseEffects: [note('太史慈武藝高強,你勉力全身而退。', 'Taishi Ci\'s skill is fierce; your champion withdraws intact.')],
  },
  {
    id: 'tiger-zhang-liao',
    kind: 'champion-challenge',
    titleZh: '逍遙津會張遼', titleEn: 'Face Zhang Liao at Xiaoyao Ford',
    introZh: '逍遙津畔,張遼威震江東。可遣猛將,當面挫其鋒芒?',
    introEn: 'At Xiaoyao Ford, Zhang Liao\'s name alone scatters armies. Send a warrior to blunt his edge?',
    opponentId: 'zhang-liao',
    winEffects: [gold(450, '力克張文遠 — 江東軍心大振!', 'You master Zhang Liao — the southern host takes heart!')],
    loseEffects: [note('張遼勇冠三軍,你部下力戰而還。', 'Zhang Liao\'s valour is unmatched; your champion fights free.')],
    slayEffects: [gold(400, '陣斬張遼 — 止啼之名,今日易主!', 'You cut down Zhang Liao — the terror of the north is undone!')],
  },
];

// ─── 單挑戰役 (duel campaign) — a curated chain of famous duels in story order.
// A step unlocks once the previous step is cleared (and its foe is on the field).
// Pure framing over the scenarios above; progress is tracked by the store.
export interface DuelCampaign { id: string; titleZh: string; titleEn: string; steps: string[]; }
export const DUEL_CAMPAIGNS: DuelCampaign[] = [
  {
    id: 'rise-of-a-champion',
    titleZh: '虎將之路', titleEn: 'Path of the Tiger General',
    steps: ['slay-hua-xiong', 'three-vs-lubu', 'slay-yan-liang', 'jiameng-pass', 'tiger-zhang-liao'],
  },
];

export interface CampaignStep { id: string; scenario: DuelScenario | undefined; cleared: boolean; unlocked: boolean; }
/** Resolve a campaign into per-step state given the set of cleared scenario ids. */
export function campaignSteps(campaign: DuelCampaign, cleared: ReadonlySet<string>): CampaignStep[] {
  let prevCleared = true; // the first step is always unlocked
  return campaign.steps.map((id) => {
    const isCleared = cleared.has(id);
    const step: CampaignStep = { id, scenario: DUEL_SCENARIOS_BY_ID[id], cleared: isCleared, unlocked: prevCleared };
    prevCleared = isCleared; // the NEXT step unlocks only once this one is cleared
    return step;
  });
}

export const DUEL_SCENARIOS_BY_ID: Record<string, DuelScenario> =
  Object.fromEntries(DUEL_SCENARIOS.map((s) => [s.id, s]));

/** Map a finished scenario bout to the effects a host should apply. */
export function duelScenarioOutcome(
  scenario: DuelScenario,
  result: { won: boolean; slain: boolean },
): ScenarioEffect[] {
  if (!result.won) return scenario.loseEffects;
  const effects = [...scenario.winEffects];
  if (result.slain && scenario.slayEffects) effects.push(...scenario.slayEffects);
  return effects;
}

/** A short headline for the result banner. */
export function duelScenarioResultLine(scenario: DuelScenario, result: { won: boolean; slain: boolean }): { zh: string; en: string } {
  if (!result.won) return { zh: `${scenario.titleZh} — 功敗垂成`, en: `${scenario.titleEn} — you fall short` };
  if (result.slain) return { zh: `${scenario.titleZh} — 陣斬敵將,大獲全勝!`, en: `${scenario.titleEn} — a kill, and a crushing victory!` };
  return { zh: `${scenario.titleZh} — 力克強敵!`, en: `${scenario.titleEn} — you best a mighty foe!` };
}

void gold; void note;
