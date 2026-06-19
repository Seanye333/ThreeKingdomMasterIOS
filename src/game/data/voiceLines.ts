/**
 * Officer voice lines that fire during tactical battles.
 *
 * Trigger keys:
 *   'attack'   — when the officer attacks an enemy
 *   'critical' — when the officer rolls a high-damage attack
 *   'hit'      — when the officer takes damage
 *   'lowHp'    — when the officer's troops drop below 30% max
 *   'kill'     — when the officer's attack routs/kills an enemy unit
 *   'stratagem'— when the officer uses any stratagem
 *   'duel'     — when commander-vs-commander duel triggers
 *   'rally'    — when this officer is the morale anchor
 *   'spawn'    — said when the battle begins
 */

export type VoiceTrigger =
  | 'attack'
  | 'critical'
  | 'hit'
  | 'lowHp'
  | 'kill'
  | 'stratagem'
  | 'duel'
  | 'rally'
  | 'spawn';

export interface VoiceLineSet {
  attack?: string[];
  critical?: string[];
  hit?: string[];
  lowHp?: string[];
  kill?: string[];
  stratagem?: string[];
  duel?: string[];
  rally?: string[];
  spawn?: string[];
}

export const VOICE_LINES: Record<string, VoiceLineSet> = {
  'lu-bu': {
    spawn: ['天下無双!', '人中之呂布，馬中之赤兎!'],
    attack: ['哼!', '休得阻擋!', '我之方天畫戟，接招!'],
    critical: ['天下無敵!', '誰能擋吾乎!'],
    duel: ['取爾性命!'],
    kill: ['哈哈哈!不堪一擊!'],
    lowHp: ['豈料，此呂布也...'],
  },
  'guan-yu': {
    spawn: ['豈可背義不可。'],
    attack: ['青龍偃月在此!', '哼!'],
    critical: ['一刀斬之!'],
    duel: ['試我寶刀!'],
    kill: ['弱兵，與爾交鋒，辱我聲名。'],
    lowHp: ['吾尚能戰!'],
    rally: ['以義兄之名!'],
  },
  'zhang-fei': {
    spawn: ['燕人，張飛在此!'],
    attack: ['接招!', '拿下!', '休想逃!'],
    critical: ['之一擊豈可避乎!'],
    duel: ['堂堂正正一戰!'],
    kill: ['鼠輩!'],
    lowHp: ['嗚呼，竟葬此處...'],
  },
  'liu-bei': {
    spawn: ['漢室，再興!'],
    attack: ['仁，立身之本!'],
    rally: ['眾將士，隨我來!'],
    lowHp: ['尚不死心...'],
  },
  'zhuge-liang': {
    spawn: ['天之時，地之利，人之和。吾計成矣。'],
    stratagem: ['吾計已成。', '盡如吾料。'],
    critical: ['盡在掌握。'],
    rally: ['勿躁，時機未到。'],
    lowHp: ['失算乎... 不，尚有計策。'],
  },
  'cao-cao': {
    spawn: ['天下，盡入吾手。'],
    attack: ['寧可我天下亦背!'],
    critical: ['乱世之奸雄在此!'],
    duel: ['有趣，吾來會會!'],
    rally: ['進，再進!'],
    lowHp: ['尚未休，尚...'],
  },
  'zhao-yun': {
    spawn: ['常山之趙子龍，前來!'],
    attack: ['哼!', '龍之一閃!'],
    critical: ['一騎当千!'],
    duel: ['堂堂一戰!'],
    kill: ['猶可一戰!'],
    lowHp: ['主公，吾當護衛...'],
    rally: ['眾將士，勇往直前!'],
  },
  'ma-chao': {
    spawn: ['錦馬超在此!'],
    attack: ['接招!', '直撃也!'],
    critical: ['一閃!'],
    duel: ['單騎決鬥!'],
  },
  'sun-ce': {
    spawn: ['江東有虎在此!'],
    attack: ['直取爾首!'],
    critical: ['小覇王之一撃!'],
    duel: ['有趣，放馬過來!'],
  },
  'sun-quan': {
    spawn: ['呉之旗幟飄揚。'],
    rally: ['江東之士，力，貸!'],
    lowHp: ['尚，。'],
  },
  'zhou-yu': {
    spawn: ['美周郎，参陣。'],
    stratagem: ['計已成。'],
    critical: ['炎，燃盛!'],
    duel: ['受立!'],
  },
  'lu-meng': {
    spawn: ['呂蒙，白衣，脱!'],
    attack: ['静，確実。'],
    stratagem: ['策，極。'],
  },
  'sima-yi': {
    spawn: ['鷹，空，待。'],
    stratagem: ['機，見動。'],
    rally: ['焦，勝機必来。'],
    lowHp: ['之程度沈...'],
  },
  'xiahou-dun': {
    spawn: ['夏侯惇，参戰!'],
    attack: ['之眼，見開見!'],
    critical: ['父母之精，無駄不可!'],
    hit: ['...!'],
  },
  'huang-zhong': {
    spawn: ['老兵，尚衰!'],
    attack: ['弓，絞!', '矢，放!'],
    critical: ['百歩，外!'],
  },
  'taishi-ci': {
    attack: ['哼!', '弓頼!'],
    duel: ['單騎，所望!'],
    critical: ['遠近自在!'],
  },
  'gan-ning': {
    spawn: ['錦帆賊，甘興覇!'],
    attack: ['哈哈哈，来!'],
    critical: ['百騎之魂，見!'],
  },
  'dian-wei': {
    spawn: ['典韋，君，守!'],
    attack: ['接招!'],
    duel: ['命代!'],
    lowHp: ['尚，主之...!'],
  },
  'xu-chu': {
    spawn: ['虎痴，参陣!'],
    attack: ['!', '!'],
    critical: ['一閃!'],
  },
  'zhang-liao': {
    spawn: ['張遼，文遠。'],
    attack: ['接招!'],
    critical: ['八百八万勝!'],
    duel: ['尋常!'],
  },
};

/** Pick a random voice line for an officer and trigger, or null if none. */
export function pickVoiceLine(
  officerId: string,
  trigger: VoiceTrigger,
  rng: () => number,
): string | null {
  const set = VOICE_LINES[officerId];
  if (!set) return null;
  const lines = set[trigger];
  if (!lines || lines.length === 0) return null;
  return lines[Math.floor(rng() * lines.length)];
}
