/**
 * 劇情舌戰 — scripted war-of-words encounters with stakes beyond a morale nudge:
 * 說降 (talk a wavering officer into defecting), 游說 (sway a neutral lord), and
 * 罵死 (shout an emotional foe down so hard it breaks them). Each scenario names
 * an opponent, sets the stage, and maps the bout's outcome to concrete effects a
 * host can apply (recruit / morale / relationship / gold / affliction). The bout
 * itself runs through the existing interactive 舌戰 engine; this layer is the
 * framing and the consequences.
 */
import type { EntityId } from '../types';
import type { DebateTopic } from './wordWar';

export type ScenarioKind = 'persuade-defect' | 'sway-neutral' | 'shout-down';

export interface ScenarioEffect {
  // 'slay' — a 罵死 that actually kills (王朗墜馬); 'afflict' — only shames;
  // 'ally' — shift diplomacy with the target FORCE (amount ≥20 seals an alliance,
  // negative just sours the score), used by the live 说客 (§3.4).
  kind: 'recruit' | 'morale' | 'relationship' | 'gold' | 'afflict' | 'slay' | 'ally' | 'note';
  /** Target officer / force, where relevant. */
  targetId?: EntityId;
  /** Magnitude (gold, morale delta, relationship delta). */
  amount?: number;
  textZh: string;
  textEn: string;
}

export interface DebateScenario {
  id: string;
  kind: ScenarioKind;
  titleZh: string;
  titleEn: string;
  introZh: string;
  introEn: string;
  /** 論題 — what the debate turns on; apt arguments bite harder in the bout. */
  topic: DebateTopic;
  /** The officer you must out-argue (an existing roster id). */
  opponentId: EntityId;
  /** Effects applied on a win (points or rout). */
  winEffects: ScenarioEffect[];
  /** Effects applied on a loss. */
  loseEffects: ScenarioEffect[];
  /** Extra effects when you don't just win but break them (沉著 to 0 — a 罵倒). */
  routEffects?: ScenarioEffect[];
}

const note = (zh: string, en: string): ScenarioEffect => ({ kind: 'note', textZh: zh, textEn: en });

export const DEBATE_SCENARIOS: DebateScenario[] = [
  {
    id: 'shout-down-wang-lang',
    kind: 'shout-down',
    titleZh: '罵死王朗', titleEn: 'Shout Down Wang Lang',
    introZh: '兩軍陣前,王朗策馬而出,欲以言辭勸降。你須當眾駁倒這位老臣,挫其銳氣。',
    introEn: 'Before both armies, Wang Lang rides out to talk you into surrender. Out-argue the old minister in the open and break his nerve.',
    topic: 'legitimacy',
    opponentId: 'wang-lang',
    winEffects: [
      { kind: 'morale', amount: -15, textZh: '王朗理屈詞窮,敵軍士氣大挫(−15)。', textEn: 'Wang Lang is left speechless — enemy morale crumbles (−15).' },
    ],
    loseEffects: [
      { kind: 'morale', amount: -10, textZh: '反被王朗搶白,我軍士氣受挫(−10)。', textEn: 'Wang Lang turns it back on you — your morale dips (−10).' },
    ],
    routEffects: [
      { kind: 'slay', targetId: 'wang-lang', textZh: '王朗氣血上湧,墜馬而亡 — 一段佳話。', textEn: 'Wang Lang, apoplectic, topples from his horse — a tale for the ages.' },
    ],
  },
  {
    id: 'persuade-defect',
    kind: 'persuade-defect',
    titleZh: '說降叛將', titleEn: 'Talk a Defector Over',
    introZh: '對方麾下一員大將心懷不滿。你若能曉以利害,辯得他心服,他或願棄暗投明。',
    introEn: 'An able officer in the enemy camp harbours resentment. Win him over in debate and he may cross to your banner.',
    topic: 'interest',
    opponentId: 'wei-yan',
    winEffects: [
      { kind: 'recruit', targetId: 'wei-yan', textZh: '對方折服,願率部來投!', textEn: 'Won over — he brings his command across to you!' },
    ],
    loseEffects: [
      { kind: 'relationship', targetId: 'wei-yan', amount: -1, textZh: '說之不動,反生嫌隙。', textEn: 'Unmoved — and now wary of you.' },
    ],
  },
  {
    id: 'sway-neutral-lord',
    kind: 'sway-neutral',
    titleZh: '游說中立諸侯', titleEn: 'Sway a Neutral Lord',
    introZh: '一方諸侯尚在觀望。憑三寸不爛之舌,說動他與你結盟,共抗強敵。',
    introEn: 'A fence-sitting lord watches and waits. With a silver tongue, talk him into an alliance against the common foe.',
    topic: 'strategy',
    opponentId: 'kong-rong',
    winEffects: [
      { kind: 'relationship', targetId: 'kong-rong', amount: 2, textZh: '諸侯欣然結盟!', textEn: 'The lord gladly agrees to an alliance!' },
      { kind: 'gold', amount: 500, textZh: '並饋贈軍資 500。', textEn: 'And gifts 500 gold toward the war.' },
    ],
    loseEffects: [
      { kind: 'note', textZh: '諸侯不為所動,拂袖而去。', textEn: 'The lord is unmoved and takes his leave.', },
    ],
  },
  {
    id: 'persuade-zhang-liao',
    kind: 'persuade-defect',
    titleZh: '白門樓說張遼', titleEn: 'Win Over Zhang Liao',
    introZh: '白門樓上,張遼寧死不降,破口大罵。你若能以忠義相激、曉以大勢,或可收得這員萬人敵。',
    introEn: 'On the White Gate Tower, Zhang Liao curses, ready to die rather than yield. Appeal to honour and the tide of history, and you may win this matchless warrior.',
    topic: 'honor',
    opponentId: 'zhang-liao',
    winEffects: [
      { kind: 'recruit', targetId: 'zhang-liao', textZh: '張遼為忠義所感,釋甲來投!', textEn: 'Moved by your appeal to honour, Zhang Liao lays down his arms and joins you!' },
    ],
    loseEffects: [
      { kind: 'relationship', targetId: 'zhang-liao', amount: -1, textZh: '張遼怒目而視,不發一言。', textEn: 'Zhang Liao glares in furious silence.' },
    ],
  },
  {
    id: 'shout-down-mi-heng',
    kind: 'shout-down',
    titleZh: '反挫狂士禰衡', titleEn: 'Out-talk the Insolent Mi Heng',
    introZh: '狂士禰衡擊鼓罵座,目中無人。當眾折其銳氣,挫其狂傲!',
    introEn: 'The insolent Mi Heng drums and insults the whole court, sparing no one. Break his arrogance before them all!',
    topic: 'honor',
    opponentId: 'mi-heng',
    winEffects: [
      { kind: 'morale', amount: -8, textZh: '禰衡語塞,滿座稱快。', textEn: 'Mi Heng is left speechless; the court is delighted.' },
    ],
    loseEffects: [
      { kind: 'note', textZh: '反遭禰衡譏諷,自取其辱。', textEn: 'Mi Heng turns his barbs on you — a humiliation.' },
    ],
    routEffects: [
      { kind: 'afflict', targetId: 'mi-heng', textZh: '禰衡羞憤無地,拂衣而去。', textEn: 'Mi Heng, shamed beyond words, storms out.' },
    ],
  },
];

export const DEBATE_SCENARIOS_BY_ID: Record<string, DebateScenario> =
  Object.fromEntries(DEBATE_SCENARIOS.map((s) => [s.id, s]));

/** Map a finished scenario bout to the effects a host should apply. */
export function scenarioOutcome(
  scenario: DebateScenario,
  result: { won: boolean; routed: boolean },
): ScenarioEffect[] {
  if (!result.won) return scenario.loseEffects;
  const effects = [...scenario.winEffects];
  if (result.routed && scenario.routEffects) effects.push(...scenario.routEffects);
  return effects;
}

/** A short headline for the result banner. */
export function scenarioResultLine(scenario: DebateScenario, result: { won: boolean; routed: boolean }): { zh: string; en: string } {
  if (!result.won) return { zh: `${scenario.titleZh} — 功敗垂成`, en: `${scenario.titleEn} — you fall short` };
  if (result.routed && scenario.kind === 'shout-down') return { zh: `${scenario.titleZh} — 大獲全勝!`, en: `${scenario.titleEn} — a crushing victory!` };
  return { zh: `${scenario.titleZh} — 辯勝!`, en: `${scenario.titleEn} — you carry the day!` };
}

void note; // reserved helper for future scenarios
